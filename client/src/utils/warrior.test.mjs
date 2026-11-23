// node --test client/src/utils/warrior.test.mjs
// Warrior mode: the pass mark scales with the round (a 3-question round can pass),
// and the learner's own best is kept and beaten fairly across rounds of different lengths.
import { test } from "node:test";
import assert from "node:assert/strict";
import { warriorPassMark, beatsBest, noteWarriorBest } from "./warrior.js";

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
