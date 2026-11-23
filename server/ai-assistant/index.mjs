// Learnigo AI assistant ("live teacher"): a student talks and a teacher answers
// with a drawn, narrated mini-lesson. Speech in (Moonshine) and out
// (Supertonic) run on the server's CPU; the router tries rules and the lesson
// packs before it ever asks a model.
//
// This is a module of the main Express API, not a server of its own:
// server/server.js mounts it at /api/ai-assistant, and the browser app in
// ./public is served by the React site at /ai-assistant/ (see
// client/scripts/ai-assistant-static.mjs).
//
// Settings (environment): AI_ASSISTANT=off (skip it entirely, read by
// server.js), LT_LLM (local, the default: a small model inside this server;
// "ollama" for an Ollama server; "off" for none), LT_LOCAL_MODEL (a GGUF,
// default Qwen3.5 0.8B from Hugging Face), LT_LLM_MODEL (qwen3.5:0.8b;
// gemma4:e4b is more accurate with a GPU), LT_LLM_CPU=1 (run it on the CPU
// only), LT_FAST_MODEL (the LLM's model, "off" for none), LT_TTS (supertonic or
// kokoro), LT_TTS_STEPS (5), LT_VOICE (F1, F2, M1, M2; af_heart for kokoro),
// LT_ASR (moonshine, moonshine-tiny, whisper or whisper-small),
// LT_DATA (./data), LT_CACHE (~/.cache/learnigo-teacher, the models).
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
import { RENDERS, findRender } from "./shared/renders.js";
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
const DATA = process.env.LT_DATA || path.join(ROOT, "data");

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

// The question box's topic suggestions: every lesson pack's title, matched as
// the student types. The exact title comes first, then titles that start with it,
// then titles whose words start with each typed word, then titles that
// contain it; reviewed lessons and shorter titles break ties.
const fold = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
let topicIndex = null;
let topicIndexFor = null;
function suggestFrom(packs, q, n) {
  if (topicIndexFor !== packs) {
    const seen = new Set();
    topicIndex = [];
    for (const p of packs.values()) {
      const key = fold(p.title);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      topicIndex.push({ id: p.id, title: p.title, area: p.area || "", key, words: key.split(" "), reviewed: p.status === "reviewed" });
    }
    topicIndexFor = packs;
  }
  const t = fold(q);
  if (t.length < 2) return [];
  const typed = t.split(" ");
  const out = [];
  for (const e of topicIndex) {
    let score = 0;
    if (e.key === t) score = 120;
    else if (e.key.startsWith(t)) score = 100;
    else if (typed.every((w) => e.words.some((x) => x.startsWith(w)))) score = 60 + (e.words[0].startsWith(typed[0]) ? 10 : 0);
    else if (e.key.includes(t)) score = 40;
    if (!score) continue;
    out.push({ e, score: score + (e.reviewed ? 5 : 0) - e.key.length / 100 });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, n).map(({ e }) => ({ id: e.id, title: e.title, area: e.area }));
}

// What the lesson page shows around the board for one topic (GET /lesson):
// its subject and group, the key takeaways, a real-life example (with a
// picture when there is one), something to try, the quiz, and the other
// topics of its group for the subject menu. Taken from the pack itself.
const sentences = (text) => String(text || "").match(/[^.!?]+[.!?]+/g)?.map((x) => x.trim()) || [];
const REAL_LIFE = /\b(in real life|in everyday life|for example|think about|imagine|you can see|you see this|like a|such as|at home|in your)\b/i;
const TRY_IT = /\b(try|experiment|measure|test how|we can use|you can use|watch what happens|place|drop|fill|mix|count)\b/i;
// A 3D render only on a strong match: its title is the lesson's title or one
// of its keywords, or two of its tags are. One shared word is not enough
// ("force" is not a gear train, "axis" is not the seasons).
function renderFor(pack) {
  const want = new Set([pack.title, ...(pack.keywords || [])].map((w) => String(w).toLowerCase().trim()));
  let best = null;
  let top = 1;
  for (const r of Object.values(RENDERS)) {
    const score = (want.has(r.title.toLowerCase()) ? 2 : 0) + r.tags.filter((t) => want.has(String(t).toLowerCase())).length;
    if (score > top) { top = score; best = r; }
  }
  return best;
}

export function lessonCard(pack, all, topicRows = new Map()) {
  const says = (pack.explain || []).map((s) => s.say);
  const faqs = (pack.faq || []).map((f) => (Array.isArray(f) ? f[1] : f.a));
  // Sentences kept with their passage, so an example only runs on within it.
  const passages = [...says, ...faqs].map(sentences);
  const pick = (re, skip = "") => {
    for (const p of passages)
      for (let i = 0; i < p.length; i++)
        if (re.test(p[i]) && p[i] !== skip) return p[i] + (p[i + 1] && p[i + 1].length < 140 ? ` ${p[i + 1]}` : "");
    return null;
  };
  const real = pick(REAL_LIFE);
  const tryIt = pick(TRY_IT, real ? sentences(real)[0] : "");
  const quiz = pack.quiz || [];
  const row = topicRows.get(pack.id) || {};
  const [group, groupName] = String(pack.group || row.group || "").split(/\s+—\s+/);
  const area = pack.area || row.area || "";
  const render = renderFor(pack);
  const image = pack.visual?.op === "image" ? { src: pack.visual.src, credit: pack.visual.credit || null }
    : render ? { src: render.src, credit: null } : null;
  const related = [];
  for (const p of all.values())
    if (p.id !== pack.id && related.length < 40 && (pack.group ? p.group === pack.group : p.id.split("-")[0] === pack.id.split("-")[0]))
      related.push({ id: p.id, title: p.title });
  // Reviewed packs have no fact list: the first sentence of each step instead.
  const takeaways = (pack.facts || []).length ? pack.facts.slice(0, 3) : says.map((x) => sentences(x)[0] || x).filter(Boolean).slice(0, 3);
  return {
    id: pack.id,
    title: pack.title,
    subject: area.split(":")[0].trim(),
    area,
    group: groupName || group || "",
    takeaways,
    realLife: real,
    image,
    tryIt: tryIt || null,
    practice: quiz[0] ? quiz[0].say || quiz[0].q || null : null,
    quizCount: quiz.length,
    keywords: pack.keywords || [],
    related,
  };
}

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

// Loads the packs, models and indexes, then returns { handle, close }.
export async function createAIAssistant() {
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
      dataDir: DATA,
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

  const MAX_QUESTION = 500; // characters of a typed or heard question
  let heardCount = 0;
  const suggestTopics = (q, n) => suggestFrom(packs, q, n);
  const api = {
    async "GET /health"() {
      const sample = exampleSpread(packs, 6);
      return {
        ready: speech.isReady(),
        // "browser": the page speaks with the browser's own voice (LT_TTS=browser).
        voice: speech.voice,
        // false: no speech recognition (LT_ASR=off); the page asks for typing.
        hearing: speech.hearing,
        llm: llm ? await llm.available() : false,
        model: llm?.model || null,
        kb: { cards: kb.size, hybrid: kb.hybrid, clustered: kb.clustered },
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
    async "POST /asr"(req, res, url) {
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
        beams: Number(process.env.LT_ASR_BEAMS || 4),
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
    async "GET /heard"() {
      return { fixes: heard.fixes };
    },
    async "POST /heard"(req) {
      const body = await readJson(req, 16 * 1024);
      if (body.forget) {
        heard.forget(body.forget);
        return { fixes: heard.fixes };
      }
      return {
        learned: heard.learn(String(body.heard || ""), String(body.text || "")),
      };
    },

    // Topics for the question box as the student types: GET /topics?q=photo
    // -> { topics: [{ id, title, area }] }, best first. Titles only, from
    // memory, so it is cheap enough for every keystroke on a small server.
    // The page around the board for one topic: GET /lesson?id=PHYS-DYN-01
    async "GET /lesson"(req, res, url) {
      const pack = packs.get(url.searchParams.get("id") || "");
      if (!pack) throw Object.assign(new Error("no such lesson"), { code: 404 });
      return lessonCard(pack, packs, topicRows);
    },

    async "GET /topics"(req, res, url) {
      return { topics: suggestTopics(url.searchParams.get("q") || "", 8) };
    },

    // Videos to watch next on a topic: GET /api/videos?q=Newton's laws
    async "GET /videos"(req, res, url) {
      return {
        videos: videos
          ? await videos.search(url.searchParams.get("q") || "")
          : [],
      };
    },

    // Streams newline-separated JSON events: an 'ack' to say at once when the
    // answer needs thinking, the 'plan', then streamed 'step's and 'end' for a
    // spoken answer. Each line's voice is started here, before the browser asks.
    async "POST /ask"(req, res) {
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
        "X-Accel-Buffering": "no",
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
          if (say && speech.voice === "server" && spoken++ < 3)
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
        if (e.message !== "cancelled") console.error("ai-assistant /ask", text, e);
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

    async "GET /tts"(req, res, url) {
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
      // lang: two letters (en, es, fr…); the whole site's narrator uses this.
      const lang = (url.searchParams.get("lang") || "en").slice(0, 2).toLowerCase();
      // priority=warm: the page is fetching ahead (the next sentences); it is made
      // after the sentences someone is waiting for, and moves up if they ask for it.
      const priority = url.searchParams.get("priority") === "warm" ? "warm" : "live";
      const audio = await speech.speak(text, {
        voice: url.searchParams.get("voice") || undefined,
        speed,
        lang,
        priority,
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

    async "GET /admin"() {
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

    async "POST /admin/reload"() {
      reload();
      return { packs: packs.size };
    },

    async "POST /admin/done"(req) {
      const { key } = await readJson(req, 4096);
      store.doneTodo(String(key || ""));
      return { ok: true };
    },
  };

  // A Node request handler for paths below the mount point (Express strips
  // /api/ai-assistant from req.url before it gets here).
  async function handle(req, res) {
    let url;
    try {
      url = new URL(req.url, "http://localhost");
    } catch {
      return send(res, 400, { error: "bad url" });
    }
    try {
      const handler = api[`${req.method} ${url.pathname}`];
      if (!handler) return send(res, 404, { error: "not found" });
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
        console.error("ai-assistant", url.pathname, e);
      if (!res.headersSent)
        send(res, typeof e.code === "number" ? e.code : 500, {
          error: e.message,
        });
      else if (!res.writableEnded) res.end();
    }
  }

  console.log(
    `AI assistant ready — packs: ${packs.size} (${[...packs.values()].filter((p) => p.status === "reviewed").length} reviewed); LLM: ${llm ? llm.model : "off"}; fast model: ${fast ? fast.model : "off"}`,
  );

  return {
    handle,
    // Pending saves (the TODO list) are written before the process ends.
    close: () => store.flush(),
  };
}
