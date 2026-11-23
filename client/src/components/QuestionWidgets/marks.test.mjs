// node --test client/src/components/QuestionWidgets/marks.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  targetSequence, sequenceMarks, binHomes, binMark, homeOf, partnerOf, expectedAnswer,
} from "./marks.js";

test("a built order is marked piece by piece", () => {
  const q = { interaction: "drag_order", options: ["c", "a", "b"], correct_answer: ["a", "b", "c"] };
  assert.deepEqual(sequenceMarks(q, ["a", "c", "b"], "wrong"), [true, false, false]);
  assert.deepEqual(sequenceMarks(q, ["A ", "b", "c"], "wrong"), [true, true, true], "trimmed, case-blind");
  assert.deepEqual(sequenceMarks(q, ["b", "a", "c"], "correct"), [true, true, true], "a right answer is right everywhere");
  assert.deepEqual(sequenceMarks(q, ["a"], null), [true], "a part-built order when the answer is shown");
  assert.deepEqual(sequenceMarks(q, [], "wrong"), []);
});

test("a word built from letter tiles is compared letter by letter", () => {
  const q = { interaction: "letter_bank", options: ["t", "a", "c"], correct_answer: "cat" };
  assert.deepEqual(targetSequence(q), ["c", "a", "t"]);
  assert.deepEqual(sequenceMarks(q, ["c", "t", "a"], "wrong"), [true, false, false]);
  const words = { interaction: "letter_bank", options: ["sat", "The", "cat"], correct_answer: "The cat sat" };
  assert.deepEqual(targetSequence(words), ["The", "cat", "sat"]);
  // No fair piece-by-piece comparison: phrases that do not split one per tile, or an equation.
  assert.equal(targetSequence({ options: ["the cat", "sat"], correct_answer: "the cat sat down" }), null);
  assert.equal(targetSequence({ options: ["3", "+", "4", "=", "7"], correct_answer: "3+4=7", validation: { equation: "any_true" } }), null);
  assert.deepEqual(sequenceMarks({ options: ["3", "=", "7"], correct_answer: "3=7", validation: { equation: true } }, ["7", "=", "3"], "wrong"), [null, null, null]);
  assert.deepEqual(targetSequence({ options: ["o", "g", "d"], accepted_answers: ["dog"] }), ["d", "o", "g"]);
});

test("sorted items are marked by their bin", () => {
  const q = { correct_answer: { fruit: ["Apple", "pear"], vegetable: ["carrot"] } };
  const homes = binHomes(q);
  assert.equal(binMark(homes, "apple", "fruit"), true);
  assert.equal(binMark(homes, "carrot", "fruit"), false);
  assert.equal(binMark(homes, "stone", "fruit"), null);
  assert.equal(homeOf(homes, "Carrot "), "vegetable");
  assert.equal(homeOf(homes, "stone"), null);
  assert.equal(binHomes({ correct_answer: ["not", "bins"] }).size, 0);
});

test("the right partner and the expected typed answer", () => {
  assert.equal(partnerOf([["cat", "kitten"], ["dog", "puppy"]], "Dog"), "puppy");
  assert.equal(partnerOf([["cat", "kitten"]], "cow"), null);
  assert.equal(expectedAnswer({ correct_answer: "seven", accepted_answers: ["7", "seven"] }), "seven");
  assert.equal(expectedAnswer({ correct_answer: 7 }), "7");
  assert.equal(expectedAnswer({ accepted_answers: ["", "blue"] }), "blue");
  assert.equal(expectedAnswer({}), "");
});
