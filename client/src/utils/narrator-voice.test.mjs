// node --test client/src/utils/narrator-voice.test.mjs
// The site speaks in the AI teacher's natural (server) voice: every sentence the
// server can say is said in it, a sentence that fails once is asked for again
// instead of switching to the browser's robotic voice, sound the browser blocks
// (nothing tapped yet) is not replaced by the browser's voice, and only a
// language the server has no voice for (Chinese) uses the browser's voice.
import { test } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, next) {
    try { return next(specifier, context); } catch (err) {
      if (specifier.startsWith(".") && !/\.[cm]?js$/.test(specifier)) return next(`${specifier}.js`, context);
      throw err;
    }
  },
});

// Browser voices for English and Chinese; anything they say is recorded.
const browserSaid = [];
const voices = [
  { name: "Samantha", lang: "en-US", localService: true },
  { name: "Tingting", lang: "zh-CN", localService: true },
];
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.speechSynthesis = {
  speaking: false,
  getVoices: () => voices,
  speak(u) { browserSaid.push({ text: u.text, lang: u.lang }); setTimeout(() => u.onend?.({}), 1); },
  cancel() {}, pause() {}, resume() {}, addEventListener() {}, removeEventListener() {},
};
globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; this.lang = ""; this.voice = null; } };

// The server voice: each request is answered by `server(text, lang)`.
const requests = [];
let server = () => ({ status: 200 });
globalThis.fetch = async (url) => {
  const q = new URL(url, "https://learnigo.test").searchParams;
  const text = q.get("text");
  const lang = q.get("lang");
  requests.push({ text, lang, priority: q.get("priority") || "live" });
  const r = server(text, lang);
  await new Promise((res) => setTimeout(res, r.delay || 5));
  return { ok: r.status === 200, status: r.status, blob: async () => new Blob([new Uint8Array(64)], { type: "audio/wav" }) };
};

// The audio element: `audioBlocked` makes play() fail as browsers do before a tap.
const played = [];
let audioBlocked = false;
globalThis.Audio = class {
  constructor() { this.src = ""; this.volume = 1; this.playbackRate = 1; this.onended = null; this.onerror = null; }
  play() {
    if (audioBlocked) return Promise.reject(Object.assign(new Error("not allowed"), { name: "NotAllowedError" }));
    played.push(this.src);
    setTimeout(() => this.onended?.(), 2);
    return Promise.resolve();
  }
  pause() {}
};

const { narrate, onNarration } = await import("./narrator.js");

const reset = () => { browserSaid.length = 0; requests.length = 0; played.length = 0; audioBlocked = false; server = () => ({ status: 200 }); };

test("every sentence is said in the server's natural voice", async () => {
  reset();
  const sources = [];
  const off = onNarration((e) => { if (e.type === "sentence") sources.push(e.source); });
  const ok = await narrate("Hi Sam. You were partway through your English round. You can carry on from there.", { lang: "en-US", user: true });
  off();
  assert.equal(ok, true);
  assert.deepEqual(sources, ["server", "server", "server"]);
  assert.equal(browserSaid.length, 0, "the browser's voice never spoke");
  assert.equal(played.length, 3);
});

test("sentences fetched ahead go at low priority; the one being waited for is live", async () => {
  reset();
  await narrate("One. Two. Three. Four.", { lang: "en-US", user: true });
  const live = requests.filter((r) => r.priority === "live").map((r) => r.text);
  const warm = requests.filter((r) => r.priority === "warm").map((r) => r.text);
  assert.ok(live.includes("One."), "the first sentence is live");
  assert.ok(warm.length >= 1, "a later sentence was fetched at low priority");
});

test("a sentence that fails once is asked for again, still in the natural voice", async () => {
  reset();
  let failed = false;
  server = (text) => {
    if (text === "Read the equation." && !failed) { failed = true; return { status: 500 }; }
    return { status: 200 };
  };
  const ok = await narrate("Read the equation. Tap the answer.", { lang: "en-US", user: true });
  assert.equal(ok, true);
  assert.equal(browserSaid.length, 0, "no robotic fallback after one failed request");
  assert.equal(requests.filter((r) => r.text === "Read the equation." && r.priority === "live").length, 2);
});

test("sound blocked by the browser (nothing tapped yet) is not replaced by the browser's voice", async () => {
  reset();
  audioBlocked = true;
  const events = [];
  const off = onNarration((e) => events.push(e.type));
  let ended = false;
  const ok = await narrate("Welcome back. Here is your next step.", { lang: "en-US", onEnd: () => { ended = true; } });
  off();
  assert.equal(ok, false);
  assert.equal(browserSaid.length, 0, "the browser's voice did not step in");
  assert.ok(events.includes("blocked"));
  assert.equal(ended, true, "callers are not left waiting");
  // Only the usual look-ahead for the next sentence; nothing is asked for again after the block.
  assert.ok(requests.filter((r) => r.text === "Here is your next step.").length <= 1, "the rest is not fetched for nothing");
});

test("only a language the server cannot speak (Chinese) uses the browser's voice", async () => {
  reset();
  const ok = await narrate("你好。", { lang: "zh-CN", user: true });
  assert.equal(ok, true);
  assert.equal(requests.length, 0, "Chinese is never sent to the server voice");
  assert.equal(browserSaid.length, 1);
  assert.match(browserSaid[0].lang, /^zh/);
});
