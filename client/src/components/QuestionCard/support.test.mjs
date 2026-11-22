// node --test client/src/components/QuestionCard/support.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findSmallSum, describeSum, spokenAnswers, buildChoices, micProblem, nextStrategy, supportStepShown,
  messageArgs, isHiddenAudio, seedOf, scriptOf,
} from "./support.js";

test("finds small sums to draw", () => {
  assert.deepEqual(findSmallSum("4 − 1 = ?"), { a: 4, b: 1, op: "−", result: 3 });
  assert.deepEqual(findSmallSum("What is four minus one?"), { a: 4, b: 1, op: "−", result: 3 });
  assert.deepEqual(findSmallSum("", "2 + 3"), { a: 2, b: 3, op: "+", result: 5 });
  assert.deepEqual(findSmallSum("Sam has 2 plus 1"), { a: 2, b: 1, op: "+", result: 3 });
  assert.deepEqual(findSmallSum("3 x 4"), { a: 3, b: 4, op: "×", result: 12 });
  assert.equal(findSmallSum("37 + 45"), null, "too big to draw");
  assert.equal(findSmallSum("3 − 7"), null, "below zero");
  assert.equal(findSmallSum("Tap the cat"), null);
  assert.equal(describeSum({ a: 4, b: 1, op: "−", result: 3 }), "4, take away 1, leaves 3");
});

test("a second way to answer a speaking question", () => {
  const q = { accepted_answers: ["three", "3"], correct_answer: "three", speech_scoring: { sample_answer: "three" } };
  assert.deepEqual(spokenAnswers(q), ["three", "3"]);
  const c = buildChoices(q, [], seedOf("MA-SPK-1"));
  assert.equal(c.length, 3);
  assert.ok(c.includes("three"));
  assert.ok(c.includes("four") && c.includes("two"));
  assert.deepEqual(buildChoices(q, [], 5), buildChoices(q, [], 5), "stable for one question");
  const word = { accepted_answers: ["soap"], correct_answer: "soap" };
  const w = buildChoices(word, ["help", "soap", "", "a very long answer that is much longer", "cup"], 3);
  assert.deepEqual([...w].sort(), ["cup", "help", "soap"]);
  assert.equal(buildChoices(word, ["help"], 3), null, "not enough fair choices");
  assert.equal(buildChoices({}, ["x", "y"]), null);
});

test("microphone problems are uncertain, never wrong", () => {
  assert.deepEqual(micProblem({ unsupported: true }), { status: "uncertain", reason: "unsupported" });
  assert.deepEqual(micProblem({ error: "not-allowed" }), { status: "uncertain", reason: "mic_blocked" });
  assert.deepEqual(micProblem({ error: "NotAllowedError" }), { status: "uncertain", reason: "mic_blocked" });
  assert.deepEqual(micProblem({ error: "no-speech" }), { status: "uncertain", reason: "no_speech" });
  assert.deepEqual(micProblem({ error: "audio-capture" }), { status: "uncertain", reason: "no_mic" });
  assert.deepEqual(micProblem({ transcript: "  " }), { status: "uncertain", reason: "no_speech" });
  assert.equal(micProblem({ transcript: "three" }), null);
  assert.equal(micProblem("three"), null);
});

test("each explanation is offered once, in order", () => {
  const used = new Set();
  assert.equal(nextStrategy({ canPicture: true, hintCount: 2, hasWorked: true, used }), "pictures");
  used.add("pictures");
  assert.equal(nextStrategy({ canPicture: true, hintCount: 2, hasWorked: true, used }), "guided");
  used.add("guided");
  assert.equal(nextStrategy({ canPicture: true, hintCount: 2, hasWorked: true, used }), "hints");
  used.add("hints");
  assert.equal(nextStrategy({ canPicture: true, hintCount: 2, hasWorked: true, used }), "worked");
  used.add("worked");
  assert.equal(nextStrategy({ canPicture: true, hintCount: 2, hasWorked: true, used }), null);
  assert.equal(nextStrategy({ canPicture: false, hintCount: 1, hasWorked: false, used: new Set() }), "hints");
  assert.equal(supportStepShown(new Set()), null);
  assert.equal(supportStepShown(new Set(["hints"])), 0);
  assert.equal(supportStepShown(new Set(["hints", "pictures"])), 1);
  assert.equal(supportStepShown(new Set(["guided", "pictures"])), 2);
});

test("the server's message becomes t() arguments with skill names", () => {
  const msg = { key: "correctNextSkill", params: { skill: { id: "maths.add-10", name: "Adding within 10" }, n: 3 }, text: "You can do Adding within 10!" };
  const [key, opts] = messageArgs(msg, (id, name) => `[${id}] ${name}`);
  assert.equal(key, "learn.feedback.correctNextSkill");
  assert.equal(opts.skill, "[maths.add-10] Adding within 10");
  assert.equal(opts.n, 3);
  assert.equal(opts.defaultValue, "You can do Adding within 10!");
  assert.equal(messageArgs(null), null);
  assert.equal(messageArgs({ text: "no key" }), null);
});

test("hidden audio: hearing it is the task", () => {
  assert.equal(isHiddenAudio({ instruction: "Listen. Tap the number.", audio_text: "two" }), true);
  assert.equal(isHiddenAudio({ instruction: "Read it.", prompt: "The sun is hot.", audio_text: "The sun is hot." }), false);
  assert.equal(isHiddenAudio({ instruction: "Tap", audio_text: "" }), false);
});

test("a narration script is used only in the language of the card", () => {
  const en = { lang: "en", instruction: "Tap the cat.", narration: { text: "Can you find the cat? Tap it.", style: "curious", v: 1, status: "authored" } };
  assert.deepEqual(scriptOf(en), { text: "Can you find the cat? Tap it.", lang: "en" });
  const de = { lang: "de", narration: { text: "Findest du die Katze? Tippe sie an.", status: "templated" } };
  assert.deepEqual(scriptOf(de), { text: "Findest du die Katze? Tippe sie an.", lang: "de" });
  // An English (authored) script left on a translated card: read the card instead.
  assert.equal(scriptOf({ lang: "de", narration: { text: "Can you find the cat?", status: "authored" } }), null);
  // The script says which language it is in: that wins.
  assert.equal(scriptOf({ lang: "fr", narration: { text: "Can you find it?", lang: "en", status: "reviewed" } }), null);
  assert.deepEqual(scriptOf({ lang: "fr", narration: { text: "Tu la trouves ?", lang: "fr-FR", status: "reviewed" } }), { text: "Tu la trouves ?", lang: "fr" });
  assert.equal(scriptOf({ lang: "en", narration: { text: "   " } }), null);
  assert.equal(scriptOf({ lang: "en" }), null);
  assert.equal(scriptOf(null), null);
});
