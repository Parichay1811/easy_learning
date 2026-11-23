// node --test client/src/utils/navMemory.test.mjs
// "Back" from a round returns where the learner came from.
import { test } from "node:test";
import assert from "node:assert/strict";
import { notePath, originFor, backTargetFor } from "./navMemory.js";

test("a round started from the dashboard goes back to the dashboard", () => {
  notePath("/home");
  notePath("/dashboard?tab=learning");
  // Before the round page is noted, and after it is (and after ?resume=1 changes).
  assert.equal(backTargetFor("/module/read/maths"), "/dashboard?tab=learning");
  notePath("/module/read/maths");
  assert.equal(backTargetFor("/module/read/maths"), "/dashboard?tab=learning");
  notePath("/module/read/maths?resume=1");
  assert.equal(originFor("/module/read/maths"), "/dashboard?tab=learning");
});

test("from Home, a login page or a first visit, Back goes Home (null)", () => {
  notePath("/home");
  notePath("/module/listen/english");
  assert.equal(backTargetFor("/module/listen/english"), null);
  notePath("/login");
  notePath("/module/write/science");
  assert.equal(backTargetFor("/module/write/science"), null);
  notePath("/discovery?challenge=1");
  notePath("/module/read/science?challenge=1");
  assert.equal(backTargetFor("/module/read/science"), "/discovery?challenge=1");
});
