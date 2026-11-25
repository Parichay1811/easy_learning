// node --test client/src/utils/scoreAnswer.test.mjs
// The client copy of the answer checker on "capitals and full stop" items: the hint names what
// is really wrong, and a one-letter slip (a phone "correcting" a name) is close, never plain
// wrong. The same cases run against the server copy in server/test/answer-check.test.js
// (and server/test/answer-check-parity.test.js keeps the two copies identical).
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkAnswer } from "./scoreAnswer.js";

const strict = { method: "text", case_sensitive: true, punctuation_strict: true };
const typed = (correct, validation, extra = {}) => ({ interaction: "typed_short", correct_answer: correct, accepted_answers: [correct], validation, ...extra });

test("strict capitals and full stops: the hint names what is really wrong", () => {
  const q = typed("Ana saves her coins.", strict);
  const got = (a) => { const r = checkAnswer(q, a); return [r.status, r.reason]; };
  assert.deepEqual(got("Ana saves her coins."), ["correct", undefined]);
  assert.deepEqual(got("Ana  saves her coins ."), ["correct", undefined], "spaces are never the point");
  assert.deepEqual(got("ana saves her coins."), ["close", "capitals"]);
  assert.deepEqual(got("Ana Saves her coins."), ["close", "capitals"]);
  assert.deepEqual(got("Ana saves her coins"), ["close", "punctuation"], "a missing full stop is not a capitals problem");
  assert.deepEqual(got("Ana saves her coins!"), ["close", "punctuation"]);
  assert.deepEqual(got("ana saves her coins"), ["close", "capitals_punctuation"]);
  assert.equal(checkAnswer(q, "ana saves her coins").correct, false, "close is never counted as right");
});

test("strict items: one spelling slip is close, another word is wrong", () => {
  const q = typed("Ana saves her coins.", strict);
  const got = (a) => { const r = checkAnswer(q, a); return [r.status, r.reason]; };
  assert.deepEqual(got("Anna saves her coins."), ["close", "spelling"], "autocorrect turned Ana into Anna");
  assert.deepEqual(got("anna saves her coins"), ["close", "spelling"]);
  assert.deepEqual(got("Ana save her coins."), ["close", "spelling"]);
  assert.deepEqual(got("Ana saves his coins."), ["incorrect", undefined]);
  assert.deepEqual(got("Bob saves her coins."), ["incorrect", undefined]);
  assert.deepEqual(got("Ann saves her coins."), ["incorrect", undefined], "no slack when both spellings are under four letters");
  const known = typed("Tia told the truth.", strict, { distractor_insight: { "Tina told the truth.": "changed the name" } });
  assert.deepEqual([checkAnswer(known, "Tina told the truth.").status, checkAnswer(known, "Tina told the truth.").misconception], ["incorrect", "changed the name"]);
});

test("items that do not test capitals are as forgiving as before", () => {
  const q = typed("petal", { method: "text", strip_articles: true });
  assert.equal(checkAnswer(q, "Petal").status, "correct");
  assert.equal(checkAnswer(q, "petel").status, "correct");
  const spell = typed("friend", { method: "text", spelling_strict: true });
  assert.deepEqual([checkAnswer(spell, "freind").status, checkAnswer(spell, "freind").reason], ["close", "spelling"]);
  assert.equal(checkAnswer(typed("cat", { method: "text", spelling_strict: true }), "cot").status, "incorrect");
});
