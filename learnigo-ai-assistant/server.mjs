#!/usr/bin/env node
// Learnigo live teacher: a small local server for a website where a student
// talks and a teacher answers with a drawn, narrated mini-lesson. Speech in
// (Moonshine) and out (Supertonic) run on this computer's CPU; the router tries
// rules and the lesson packs before it ever asks a model.
//
//   npm start   (or node server.mjs)   then open http://localhost:4173
//
// Settings: PORT (4173), HOST (127.0.0.1), LT_LLM (local, the default: a small
// model inside this server; "ollama" for an Ollama server; "off" for none),
// LT_LOCAL_MODEL (a GGUF, default Qwen3.5 0.8B from Hugging Face),
// LT_LLM_MODEL (qwen3.5:0.8b; gemma4:e4b is more accurate with a GPU),
// LT_LLM_CPU=1 (run it on the CPU only), LT_FAST_MODEL (the LLM's model,
// "off" for none), LT_TTS (supertonic or
// kokoro), LT_TTS_STEPS (5), LT_VOICE (F1, F2, M1, M2; af_heart for kokoro),
// LT_ASR (moonshine, moonshine-tiny, whisper or whisper-small),
// LT_DATA (./data).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPacks } from "./lib/packs.mjs";
import { respond, setTerms } from "./lib/router.mjs";
import { createLLM } from "./lib/llm.mjs";
import { createFast } from "./lib/fast.mjs";
import {
  createLocalLLM,
  createLocalFast,
  DEFAULT_MODEL,
} from "./lib/local-llm.mjs";
import { createVideos } from "./lib/videos.mjs";
import { createHeard } from "./lib/heard.mjs";
import { createWiki } from "./lib/wiki.mjs";
import { createOpenData } from "./lib/opendata.mjs";
import { loadSimsMeta, loadTopics } from "./lib/sims-meta.mjs";
import { topicVisual } from "./shared/topic-visuals.js";
import { setSimsMeta } from "./shared/autoviz.js";
import { createSpeech } from "./lib/speech.mjs";
import { createStore } from "./lib/store.mjs";
import { buildCards, createIndex } from "./lib/knowledge.mjs";
import { createEmbedder } from "./lib/embed.mjs";
import { createTools } from "./lib/tools.mjs";
import { createMcp } from "./lib/mcp.mjs";
import { quizStep } from "./shared/solvers.js";
import {
  GREETING,
  FILLERS,
  NOT_HEARD,
  STOPPED,
  GO_AHEAD,
  MISS,
  OFFER,
  FRAGMENT,
  GENERIC_ACKS,
  TALK,
} from "./shared/lines.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "127.0.0.1";
const DATA = process.env.LT_DATA || path.join(ROOT, "data");

const PACKS = path.join(ROOT, "packs");
// LT_DRAFTS=off serves only reviewed packs (generated drafts are unchecked).
const DRAFTS = process.env.LT_DRAFTS !== "off";
// Each topic's opening picture (a simulation, shapes, a map...), from its
// curriculum row and the simulations the board has.
const simsMeta = await loadSimsMeta();
setSimsMeta(simsMeta);
const topicRows = loadTopics();
setTerms([...topicRows.values()].map((t) => t.title));
const withVisuals = (all) => {
  for (const p of all.values())
    p.visual = topicVisual(topicRows.get(p.id) || p, simsMeta);
  return all;
};
let packs = withVisuals(
  loadPacks(PACKS, { drafts: DRAFTS, log: (m) => console.warn(m) }),
);
const store = createStore(DATA);
// The small model: inside this server by default (llama.cpp, nothing else to
// install); LT_LLM=ollama uses an Ollama server instead; LT_LLM=off never.
// The classifier only routes maths questions with numbers: topics with a template.
const ENGINE = process.env.LT_LLM || "local";
const llmTopics = [...packs.values()]
  .filter((p) => p.template)
  .map((p) => ({ id: p.id, title: p.title }));
const local =
  ENGINE === "local"
    ? createLocalLLM({
        uri: process.env.LT_LOCAL_MODEL || DEFAULT_MODEL,
        cpu: process.env.LT_LLM_CPU === "1",
        topics: llmTopics,
        log: (m) => console.log(m),
      })
    : null;
const llm =
  ENGINE === "off"
    ? null
    : local ||
      createLLM({
        model: process.env.LT_LLM_MODEL || "qwen3.5:0.8b",
        cpu: process.env.LT_LLM_CPU === "1",
        topics: llmTopics,
      });
const fast =
  ENGINE === "off" || process.env.LT_FAST_MODEL === "off"
    ? null
    : local
      ? createLocalFast(local)
      : createFast({
          model:
            process.env.LT_FAST_MODEL ||
            process.env.LT_LLM_MODEL ||
            "qwen3.5:0.8b",
          cpu: process.env.LT_LLM_CPU === "1",
        });
const heard = createHeard(packs, topicRows, { dataDir: DATA });
const wiki =
  process.env.LT_WIKI === "off"
    ? null
    : createWiki({
        dataDir: DATA,
        log: (m) => console.warn(m),
        // Optional: our own knowledge base on a Wiki.js server, asked before Wikipedia.
        own: process.env.LT_WIKIJS_URL
          ? {
              url: process.env.LT_WIKIJS_URL,
              token: process.env.LT_WIKIJS_TOKEN,
              name: process.env.LT_WIKIJS_NAME,
            }
          : null,
      });
// Exact answers from open data: Wikidata, World Bank, PubChem, Wiktionary, NASA, art, quakes, weather.
const opendata =
  process.env.LT_DATA_SOURCES === "off"
    ? null
    : createOpenData({ dataDir: DATA, log: (m) => console.warn(m) });

// Topics with no drawn picture open on a real one: their Wikipedia article's
// freely licensed image, fetched slowly in the background (one topic at a
// time, cached for a month), so the first lesson never waits for it.
let filling = false;
async function fillPictures() {
  if (!wiki || filling) return;
  filling = true;
  try {
    await fillEach();
  } finally {
    filling = false;
  }
}
async function fillEach() {
  for (const p of packs.values()) {
    if (p.visual || p.status === "reviewed") continue;
    const row = topicRows.get(p.id);
    const r = await wiki
      .lookup(`what is ${row?.title || p.title}`)
      .catch(() => null);
    if (r?.image)
      p.visual = {
        op: "image",
        src: r.image.src,
        credit: r.image.credit,
        caption: r.title,
      };
    await new Promise((ok) => setTimeout(ok, 400));
  }
}
setTimeout(() => fillPictures().catch(() => {}), 15000).unref();
const speech = createSpeech({ dataDir: DATA, log: (m) => console.log(m) });
const videos =
  process.env.LT_VIDEOS === "off"
    ? null
    : createVideos({ dataDir: DATA, log: (m) => console.warn(m) });
// The knowledge base: every pack as searchable cards, hybrid search with a
// small embedding model (LT_EMBED=off for word search only).
const embedder =
  process.env.LT_EMBED === "off" ? null : createEmbedder({ dataDir: DATA });
let kb;
let tools;
let mcp;
function index() {
  const next = createIndex(buildCards(packs), {
    embedder,
    log: (m) => console.log(m),
  });
  next.embedded.catch((e) => console.error("embeddings:", e.message));
  kb = next;
  tools = createTools({ packs, kb, llm, fast });
  mcp = createMcp(tools);
}
index();

// New packs arrive while the factory runs: look at packs/ every minute and
// reload when anything changed (only new phrasings are embedded).
function packsStamp(dir = PACKS) {
  let n = 0;
  let newest = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      const [a, b] = packsStamp(p);
      n += a;
      newest = Math.max(newest, b);
    } else if (e.name.endsWith(".json")) {
      n++;
      newest = Math.max(newest, fs.statSync(p).mtimeMs);
    }
  }
  return [n, newest];
}
let stamp = packsStamp().join();
function reload() {
  packs = withVisuals(
    loadPacks(PACKS, { drafts: DRAFTS, log: (m) => console.warn(m) }),
  );
  heard.rebuild(packs);
  fillPictures().catch(() => {});
  index();
  stamp = packsStamp().join();
  console.log(`reloaded ${packs.size} packs`);
}
setInterval(() => {
  try {
    if (packsStamp().join() !== stamp) reload();
  } catch (e) {
    console.error("reload:", e.message);
  }
}, 60000).unref();

// Every fixed line, made at start so it plays at once.
speech.ready
  .then(() => {
    const lines = [
      GREETING,
      ...FILLERS,
      NOT_HEARD,
      STOPPED,
      GO_AHEAD,
      MISS,
      FRAGMENT,
      ...GENERIC_ACKS,
      ...Object.values(TALK),
    ];
    // Reviewed packs only: draft packs (thousands of lines) are voiced the
    // first time they are used, then cached.
    for (const p of packs.values()) {
      if (p.status !== "reviewed") continue;
      lines.push(
        ...p.explain.map((s) => s.say),
        ...p.faq.map(({ a }) => `${a} ${OFFER}`),
        ...p.quiz.map((q) => quizStep(q).say),
      );
    }
    speech.warm(lines);
  })
  .catch((e) => console.error("could not load the speech models:", e.message));

// Load the models now, so the first question that needs one does not wait.
(local ? local.loading : Promise.resolve())
  .then(() => llm?.available())
  .then((up) => up && llm.classify("hello").catch(() => {}));
fast?.warm();
// Pending saves (the TODO list) are written before the process ends.
for (const sig of ["SIGINT", "SIGTERM"])
  process.on(sig, () => {
    store.flush();
    process.exit(0);
  });
// A stray failed promise is logged; it never takes the teacher down.
process.on("unhandledRejection", (e) => console.error("unhandled:", e));

// One pack from each of several subjects for the start chips, so the first
// screen shows the range: reviewed packs first, then a different mix each hour.
function exampleSpread(all, n) {
  const byDomain = new Map();
  const hour = Math.floor(Date.now() / 3.6e6);
  const order = [...all.values()]
    .filter((p) => p.examples?.length)
    .sort(
      (a, b) =>
        (a.status === "reviewed" ? 0 : 1) - (b.status === "reviewed" ? 0 : 1) ||
        hash(`${a.id}${hour}`) - hash(`${b.id}${hour}`),
    );
  for (const p of order) {
    const d = p.id.split("-")[0];
    if (!byDomain.has(d)) byDomain.set(d, p);
  }
  return [...byDomain.values()].slice(0, n);
}
const hash = (s) => {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
};

// What the pack factory has done so far (factory/report.jsonl).
function factoryProgress() {
  const file = path.join(ROOT, "factory", "report.jsonl");
  if (!fs.existsSync(file)) return null;
  const rows = fs
    .readFileSync(file, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  const ok = rows.filter((r) => r.ok);
  return {
    made: ok.length,
    failed: rows.length - ok.length,
    avgSeconds: ok.length
      ? Math.round(ok.reduce((s, r) => s + r.ms, 0) / ok.length / 1000)
      : null,
    last: rows
      .slice(-8)
      .reverse()
      .map((r) => ({
        id: r.id,
        ok: r.ok,
        at: r.at,
        problem: r.problems?.[0] || null,
      })),
  };
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".mp4": "video/mp4",
};
const STATIC = [
  ["/shared/", path.join(ROOT, "shared")],
  ["/vendor/gsap/", path.join(ROOT, "node_modules", "gsap", "dist")], // animation library (GSAP, free licence)
  ["/vendor/world/", path.join(ROOT, "node_modules", "world-atlas")], // world map (world-atlas, ISC; Natural Earth, public domain)
  ["/", path.join(ROOT, "public")],
];

function serveStatic(req, res, pathname) {
  if (pathname === "/") pathname = "/index.html";
  if (pathname === "/admin") pathname = "/admin.html";
  for (const [prefix, dir] of STATIC) {
    if (!pathname.startsWith(prefix)) continue;
    let name;
    try {
      name = decodeURIComponent(pathname.slice(prefix.length));
    } catch {
      return send(res, 400, { error: "bad path" });
    }
    const file = path.join(dir, name);
    if (
      !file.startsWith(dir + path.sep) ||
      !fs.existsSync(file) ||
      !fs.statSync(file).isFile()
    )
      break;
    const headers = {
      "Content-Type": MIME[path.extname(file)] || "application/octet-stream",
      "Cache-Control":
        prefix === "/" || prefix === "/shared/" ? "no-cache" : "max-age=3600",
      "Accept-Ranges": "bytes",
    };
    // Videos (the 3D render loops) are fetched in ranges; Safari needs this to play them.
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
    if (range) {
      const size = fs.statSync(file).size;
      const start = range[1]
        ? Number(range[1])
        : Math.max(0, size - Number(range[2]));
      const end =
        range[1] && range[2] ? Math.min(size - 1, Number(range[2])) : size - 1;
      if (start >= size || start > end) {
        res.writeHead(416, { "Content-Range": `bytes */${size}` });
        res.end();
        return;
      }
      res.writeHead(206, {
        ...headers,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": end - start + 1,
      });
      fs.createReadStream(file, { start, end }).pipe(res);
      return;
    }
    res.writeHead(200, headers);
    fs.createReadStream(file).pipe(res);
    return;
  }
  send(res, 404, { error: "not found" });
}

function send(res, code, body, headers = {}) {
  const data = Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body));
  res.writeHead(code, {
    "Content-Type": Buffer.isBuffer(body)
      ? "application/octet-stream"
      : "application/json",
    "Content-Length": data.length,
    ...headers,
  });
  res.end(data);
}

// A JSON body; anything else is the client's mistake (400), not the server's.
async function readJson(req, limit) {
  const text = (await readBody(req, limit)).toString();
  try {
    return JSON.parse(text || "{}") || {};
  } catch {
    throw Object.assign(new Error("expected JSON"), { code: 400 });
  }
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) {
        reject(Object.assign(new Error("too large"), { code: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const MAX_QUESTION = 500; // characters of a typed or heard question
let heardCount = 0;
const api = {
  async "GET /api/health"() {
    const sample = exampleSpread(packs, 6);
    return {
      ready: speech.isReady(),
      llm: llm ? await llm.available() : false,
      model: llm?.model || null,
      kb: { cards: kb.size, hybrid: kb.hybrid },
      packCount: packs.size,
      packs: sample.map((p) => ({
        id: p.id,
        title: p.title,
        examples: p.examples,
      })),
      tts: speech.stats,
    };
  },

  // Body: Float32 samples, 16 kHz mono; ?ctx= the open lesson and the
  // questions on screen ({ topic, chips, awaiting }). The recogniser reads the
  // lesson's words first (Whisper) and its few best guesses are checked
  // against the lessons (heard.mjs). Returns { text, heard, options, swapped, ms }.
  async "POST /api/asr"(req, res, url) {
    const buf = await readBody(req, 4 * 16000 * 20);
    if (buf.length % 4)
      throw Object.assign(new Error("expected 32-bit float samples"), {
        code: 400,
      });
    const samples = new Float32Array(
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length),
    );
    let context = {};
    try {
      context = JSON.parse(url.searchParams.get("ctx") || "{}") || {};
    } catch {
      /* no context */
    }
    const t0 = performance.now();
    const keep = ++heardCount;
    const hyps = await speech.transcribe(samples, {
      prompt: heard.prompt(context),
      beams: 4,
      keep,
    });
    const heardMs = Math.round(performance.now() - t0);
    const out = await heard.choose(hyps, {
      context,
      kb,
      acoustic: (texts) => speech.score(keep, texts),
    });
    return {
      ...out,
      ms: Math.round(performance.now() - t0),
      heardMs,
      seconds: +(samples.length / 16000).toFixed(2),
    };
  },

  // The student's own corrections: GET lists them, POST { heard, text }
  // learns one ("the venom" -> "Thevenin"), POST { forget } drops one.
  async "GET /api/heard"() {
    return { fixes: heard.fixes };
  },
  async "POST /api/heard"(req) {
    const body = await readJson(req, 16 * 1024);
    if (body.forget) {
      heard.forget(body.forget);
      return { fixes: heard.fixes };
    }
    return {
      learned: heard.learn(String(body.heard || ""), String(body.text || "")),
    };
  },

  // Videos to watch next on a topic: GET /api/videos?q=Newton's laws
  async "GET /api/videos"(req, res, url) {
    return {
      videos: videos
        ? await videos.search(url.searchParams.get("q") || "")
        : [],
    };
  },

  // Streams newline-separated JSON events: an 'ack' to say at once when the
  // answer needs thinking, the 'plan', then streamed 'step's and 'end' for a
  // spoken answer. Each line's voice is started here, before the browser asks.
  async "POST /api/ask"(req, res) {
    // The pack factory pauses while students are asking (factory/build-packs.mjs).
    fs.promises
      .writeFile(path.join(DATA, "site-active"), String(Date.now()))
      .catch(() => {});
    const body = await readJson(req, 64 * 1024);
    const context = body.context || {};
    if (!String(body.text || "").trim())
      throw Object.assign(new Error("no text"), { code: 400 });
    // Words spelt by sound ("photosinthesis") become the lesson's word. A
    // question is a sentence or two: a pasted page is cut, so no pattern
    // spends seconds on it.
    const text = heard.fix(String(body.text).slice(0, MAX_QUESTION));
    const { history = [], ...ctx } = context;
    const t0 = performance.now();
    const gone = new AbortController();
    res.on("close", () => {
      if (!res.writableEnded) gone.abort();
    });
    res.writeHead(200, {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
    });
    const firsts = { ack: null, plan: null };
    let kind = null;
    let topic = null;
    let spoken = 0;
    const emit = (e) => {
      const ms = Math.round(performance.now() - t0);
      if (!firsts[e.type] && e.type in firsts) firsts[e.type] = ms;
      if (e.type === "plan") {
        kind = e.kind;
        topic = e.topic || null;
      }
      const lines =
        e.type === "ack"
          ? [e.say]
          : e.type === "step"
            ? [e.step.say]
            : e.type === "plan"
              ? (e.steps || []).map((s) => s.say)
              : [];
      for (const say of lines)
        if (say && spoken++ < 3)
          speech
            .speak(say, { cancelled: () => gone.signal.aborted })
            .catch(() => {});
      if (!res.writableEnded) res.write(JSON.stringify({ ...e, ms }) + "\n");
    };
    let tier = "error";
    try {
      tier = await respond(text, {
        context: ctx,
        history,
        packs,
        kb,
        llm,
        fast,
        wiki,
        opendata,
        videos,
        emit,
        signal: gone.signal,
        onTodo: (q, extra) => store.addTodo(q, extra),
      });
    } catch (e) {
      // The 200 is already sent: the page hears the error as a line, and
      // the stream still ends.
      if (e.message !== "cancelled") console.error("/api/ask", text, e);
      emit({ type: "error" });
    } finally {
      res.end();
    }
    store.log({
      text,
      tier,
      kind,
      topic,
      ms: Math.round(performance.now() - t0),
      ack: firsts.ack,
      first: firsts.plan,
    });
    return undefined;
  },

  async "GET /api/tts"(req, res, url) {
    const text = url.searchParams.get("text") || "";
    const speed = Math.min(
      1.3,
      Math.max(0.7, Number(url.searchParams.get("speed")) || 1),
    );
    if (!text || text.length > 600)
      throw Object.assign(new Error("text must be 1 to 600 characters"), {
        code: 400,
      });
    let gone = false;
    res.on("close", () => {
      if (!res.writableEnded) gone = true;
    });
    const t0 = performance.now();
    const audio = await speech.speak(text, {
      voice: url.searchParams.get("voice") || undefined,
      speed,
      cancelled: () => gone,
    });
    if (!gone)
      send(res, 200, audio, {
        "Content-Type": "audio/wav",
        "Cache-Control": "public, max-age=86400",
        "X-Gen-Ms": String(Math.round(performance.now() - t0)),
      });
    return undefined;
  },

  // MCP (Streamable HTTP, JSON replies): the teacher's tools for any MCP client.
  async "POST /mcp"(req, res) {
    let msg;
    try {
      msg = JSON.parse((await readBody(req, 256 * 1024)).toString());
    } catch {
      return {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "parse error" },
      };
    }
    const reply = await mcp.handle(msg);
    if (reply === null) {
      res.writeHead(202).end();
      return undefined;
    }
    return reply;
  },

  async "GET /api/admin"() {
    const list = [...packs.values()];
    const byArea = {};
    for (const p of list)
      byArea[p.area || p.id.split("-")[0]] =
        (byArea[p.area || p.id.split("-")[0]] || 0) + 1;
    return {
      todos: store.todos(),
      recent: store.recent().slice(0, 60),
      stats: store.stats(),
      tts: speech.stats,
      packs: {
        total: list.length,
        reviewed: list.filter((p) => p.status === "reviewed").length,
        draft: list.filter((p) => p.status === "draft").length,
        byArea,
      },
      factory: factoryProgress(),
    };
  },

  async "POST /api/admin/reload"() {
    reload();
    return { packs: packs.size };
  },

  async "POST /api/admin/done"(req) {
    const { key } = await readJson(req, 4096);
    store.doneTodo(String(key || ""));
    return { ok: true };
  },
};

// Anything that changes something (a POST) must come from this site's own
// pages or a local tool, never from another website the student has open:
// that page could plant a "correction" or fill the TODO list. A browser
// always sends Origin with a POST; local tools (curl, MCP clients) send none.
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
function sameSite(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const host = new URL(origin).host;
    return host === req.headers.host || LOCAL.test(host);
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  let url;
  try {
    url = new URL(req.url, "http://localhost");
  } catch {
    return send(res, 400, { error: "bad url" });
  }
  try {
    const handler = api[`${req.method} ${url.pathname}`];
    if (!handler)
      return req.method === "GET"
        ? serveStatic(req, res, url.pathname)
        : send(res, 404, { error: "not found" });
    if (req.method !== "GET" && !sameSite(req))
      throw Object.assign(new Error("origin not allowed"), { code: 403 });
    const out = await handler(req, res, url);
    if (out !== undefined) send(res, 200, out);
  } catch (e) {
    if (e.message === "cancelled") {
      if (!res.writableEnded) res.destroy();
      return;
    }
    if (!e.code || e.code >= 500 || typeof e.code !== "number")
      console.error(url.pathname, e);
    if (!res.headersSent)
      send(res, typeof e.code === "number" ? e.code : 500, {
        error: e.message,
      });
    else if (!res.writableEnded) res.end();
  }
});

server.listen(PORT, HOST, () => {
  console.log(
    `Learnigo live teacher on http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}  (admin: /admin)`,
  );
  console.log(
    `packs: ${packs.size} (${[...packs.values()].filter((p) => p.status === "reviewed").length} reviewed); LLM: ${llm ? llm.model : "off"}; fast model: ${fast ? fast.model : "off"}`,
  );
});
