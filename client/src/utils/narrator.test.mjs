// node --test client/src/utils/narrator.test.mjs
// The narrator never speaks in the wrong language: with no voice for the text's
// language (and no server voice) nothing is said, listeners hear "unavailable",
// the words still go to the captions, and the promise resolves at once. A stop
// also cancels a narration still waiting in the queue.
import { test } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// The client's imports leave out ".js" (Vite resolves them); do the same here.
registerHooks({
  resolve(specifier, context, next) {
    try { return next(specifier, context); } catch (err) {
      if (specifier.startsWith(".") && !/\.[cm]?js$/.test(specifier)) return next(`${specifier}.js`, context);
      throw err;
    }
  },
});

// A browser with an English-only voice list, no Audio (so no server voice), and a speech
// stub that records what it was asked to say instead of making a sound.
const spoken = [];
const voices = [{ name: "Samantha", lang: "en-US", localService: true }];
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.speechSynthesis = {
  speaking: false,
  getVoices: () => voices,
  speak(u) { spoken.push({ text: u.text, lang: u.lang, voice: u.voice?.lang || null }); setTimeout(() => u.onend?.({}), u.text.startsWith("Slow") ? 60 : 1); },
  cancel() {},
  pause() {},
  resume() {},
  addEventListener() {},
  removeEventListener() {},
};
globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; this.lang = ""; this.voice = null; } };

const { narrate, onNarration, stopNarration } = await import("./narrator.js");

function record() {
  const events = [];
  const off = onNarration((e) => events.push(e));
  return { events, off };
}

test("a language with no voice on this device is never spoken, only shown", async () => {
  spoken.length = 0;
  const { events, off } = record();
  const t0 = Date.now();
  const ok = await narrate("Bonjour. Écoute bien la phrase.", { lang: "fr-FR" });
  off();
  assert.equal(ok, false, "nothing was heard");
  assert.ok(Date.now() - t0 < 1500, "and nothing waited for it");
  assert.deepEqual(spoken, [], "the English voice was not asked to read French");
  const un = events.filter((e) => e.type === "unavailable");
  assert.equal(un.length, 1, "listeners are told once");
  assert.equal(un[0].lang, "fr-FR");
  const sentences = events.filter((e) => e.type === "sentence");
  assert.deepEqual(sentences.map((e) => e.text), ["Bonjour.", "Écoute bien la phrase."], "the words still go to the captions");
  assert.ok(sentences.every((e) => e.source === "none"));
  assert.equal(events.at(-1).type, "end");
  assert.equal(events.at(-1).source, "none");
});

test("the same holds when the learner pressed a button (user: true)", async () => {
  spoken.length = 0;
  const ok = await narrate("Hier ist ein Rätsel.", { lang: "de-DE", user: true });
  assert.equal(ok, false);
  assert.deepEqual(spoken, []);
});

test("a language with a voice is spoken in that voice", async () => {
  spoken.length = 0;
  const { events, off } = record();
  const ok = await narrate("Here is a little puzzle for you.", { lang: "en-US" });
  off();
  assert.equal(ok, true);
  assert.deepEqual(spoken, [{ text: "Here is a little puzzle for you.", lang: "en-US", voice: "en-US" }]);
  assert.equal(events.filter((e) => e.type === "unavailable").length, 0);
});

test("a stop also cancels a narration waiting in the queue", async () => {
  spoken.length = 0;
  const first = narrate("Slow sentence one. Slow sentence two.", { lang: "en-US" });
  const queued = narrate("Queued words that must not be said.", { lang: "en-US", queue: true });
  await new Promise((r) => setTimeout(r, 20));
  stopNarration();
  assert.equal(await first, false);
  assert.equal(await queued, false, "the queued narration resolves without speaking");
  await new Promise((r) => setTimeout(r, 100));
  assert.ok(!spoken.some((x) => x.text.startsWith("Queued")), `queued words were said: ${JSON.stringify(spoken)}`);
});
