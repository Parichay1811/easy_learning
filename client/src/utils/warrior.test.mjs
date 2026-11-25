// node --test client/src/utils/warrior.test.mjs
// Warrior mode: the pass mark scales with the round (a 3-question round can pass),
// and the learner's own best is kept and beaten fairly across rounds of different lengths.
import { test } from "node:test";
import assert from "node:assert/strict";
import { warriorPassMark, beatsBest, noteWarriorBest, rescaleTimeLeft, warriorResult } from "./warrior.js";

test("the pass mark is 60% of the round, never more than the round", () => {
  assert.equal(warriorPassMark(10), 6);
  assert.equal(warriorPassMark(8), 5);
  assert.equal(warriorPassMark(3), 2);
  assert.equal(warriorPassMark(1), 1);
  assert.equal(warriorPassMark(0), 1);
  for (let n = 1; n <= 20; n += 1) assert.ok(warriorPassMark(n) <= n);
});

test("a better share beats the best; the same share needs more stars", () => {
  assert.equal(beatsBest(null, { stars: 0, total: 10 }), false);
  assert.equal(beatsBest(null, { stars: 4, total: 10 }), true);
  assert.equal(beatsBest({ stars: 6, total: 10 }, { stars: 7, total: 10 }), true);
  assert.equal(beatsBest({ stars: 6, total: 10 }, { stars: 5, total: 8 }), true); // 62.5% > 60%
  assert.equal(beatsBest({ stars: 4, total: 8 }, { stars: 5, total: 10 }), true); // same 50%, more stars
  assert.equal(beatsBest({ stars: 8, total: 10 }, { stars: 7, total: 10 }), false);
});

test("the best is kept per key and reported against the earlier one", () => {
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  assert.deepEqual(noteWarriorBest("me|read|maths", 5, 10, storage), { best: null, newBest: true });
  assert.deepEqual(noteWarriorBest("me|read|maths", 4, 10, storage), { best: { stars: 5, total: 10 }, newBest: false });
  assert.deepEqual(noteWarriorBest("me|read|maths", 7, 10, storage), { best: { stars: 5, total: 10 }, newBest: true });
  assert.deepEqual(noteWarriorBest("me|listen|maths", 2, 10, storage), { best: null, newBest: true });
  // No storage at all: nothing breaks.
  assert.deepEqual(noteWarriorBest("x", 3, 10, null), { best: null, newBest: true });
});

test("changing the clock's length mid-question keeps the same share of the time", () => {
  assert.equal(rescaleTimeLeft(30, 30, 60), 60, "a full clock stays full");
  assert.equal(rescaleTimeLeft(12, 30, 60), 24, "Normal to More time: not a jump to half the ring");
  assert.equal(rescaleTimeLeft(50, 60, 30), 25, "More time to Normal");
  assert.equal(rescaleTimeLeft(0, 30, 60), 0, "a clock that ran out stays at zero");
  assert.equal(rescaleTimeLeft(1, 30, 60), 2);
  assert.equal(rescaleTimeLeft(45, 30, 60), 60, "never more than the new length");
  assert.equal(rescaleTimeLeft(10, 0, 30), 30, "no earlier clock: a full one");
  assert.equal(rescaleTimeLeft(10, 30, 0), 0);
  for (let left = 0; left <= 30; left += 1) {
    const there = rescaleTimeLeft(left, 30, 60);
    assert.ok(there >= left && there <= 60, `more time never takes time away (${left} -> ${there})`);
    assert.equal(rescaleTimeLeft(there, 60, 30), left, "and back again gives the same seconds");
  }
});

test("Warrior: open questions are no star and are left out of the pass mark", () => {
  // 10 questions, 3 of them open speaking: 7 count, 5 of 7 passes.
  assert.deepEqual(warriorResult({ total: 10, unscored: 3, stars: 5 }), { scored: 7, passMark: 5, passed: true });
  assert.deepEqual(warriorResult({ total: 10, unscored: 3, stars: 4 }), { scored: 7, passMark: 5, passed: false });
  // Before: the 3 open answers were 3 free stars, so 3 right of 7 "passed" (3 + 3 = 6 of 10).
  assert.equal(warriorResult({ total: 10, unscored: 3, stars: 3 }).passed, false);
  // Nothing open: as before.
  assert.deepEqual(warriorResult({ total: 10, stars: 6 }), { scored: 10, passMark: 6, passed: true });
  assert.deepEqual(warriorResult({ total: 10, stars: 5 }), { scored: 10, passMark: 6, passed: false });
  // Nothing to score: no result at all (never "you needed 1").
  assert.deepEqual(warriorResult({ total: 4, unscored: 4, stars: 0 }), { scored: 0, passMark: 0, passed: null });
  assert.deepEqual(warriorResult({ total: 0 }), { scored: 0, passMark: 0, passed: null });
});
