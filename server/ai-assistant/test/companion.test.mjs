// The personal start (public/companion.js): what the teacher says to a
// signed-in learner, built only from the checked summary the site sends.
import test from "node:test";
import assert from "node:assert/strict";
import { readCompanion, companionLines, chipLabel } from "../public/companion.js";

test("nothing usable, or not an object: no personal start", () => {
  for (const d of [null, undefined, "hi", 3, {}, { focus: "x", wins: 5 }, { name: "   " }]) {
    assert.equal(readCompanion(d), null, JSON.stringify(d));
  }
});

test("the summary is trimmed: first name only, no markup, at most 3 skills and 2 wins, known strategies only", () => {
  const c = readCompanion({
    name: "Sam <b>Smith</b>",
    focus: [
      { skill: "maths.take-away-10", name: "Taking away within 10", strategy: "visual" },
      { skill: "x", name: "<script>alert(1)</script>", strategy: "hack" },
      { skill: "y", name: "Counting to 20" },
      { skill: "z", name: "Fourth one" },
    ],
    wins: ["Adding within 5", { name: "Shapes" }, { name: "Third" }],
    prefers: "shouting",
    email: "never@used.example",
  });
  assert.equal(c.name, "Sam");
  assert.equal(c.focus.length, 3);
  assert.equal(c.focus[0].strategy, "visual");
  assert.equal(c.focus[1].strategy, "");
  assert.ok(!/[<>]/.test(c.focus[1].name), "markup is removed");
  assert.equal(c.wins.length, 2);
  assert.equal(c.prefers, null);
  assert.ok(!("email" in c), "nothing else is passed on");
});

test("the welcome refers to something real and kind", () => {
  const tricky = companionLines(readCompanion({ name: "Sam", focus: [{ skill: "a", name: "Taking away within 10", strategy: "visual" }] }));
  assert.equal(tricky.hello, "Welcome back, Sam!");
  assert.equal(tricky.line, "Last time, taking away within 10 was tricky, so shall we try it with pictures?");

  const guided = companionLines(readCompanion({ name: "Ana", focus: [{ skill: "a", name: "Telling the time", strategy: "guided" }] }));
  assert.match(guided.line, /step by step/);

  const carryOn = companionLines(readCompanion({ name: "Lee", focus: [{ skill: "a", name: "Counting to 20", strategy: "words" }] }));
  assert.equal(carryOn.line, "Shall we carry on with counting to 20?");

  const win = companionLines(readCompanion({ name: "Kim", wins: [{ name: "Adding within 5" }] }));
  assert.equal(win.line, "You've got the hang of adding within 5. Ready for something new?");

  const plain = companionLines(readCompanion({ name: "Jo" }));
  assert.equal(plain.line, "What shall we learn today?");
  assert.equal(companionLines(null), null);
});

test("skill chips follow what helped before, else how the learner likes things explained", () => {
  assert.equal(chipLabel({ name: "Taking away", strategy: "visual" }, {}), "Taking away with pictures");
  assert.equal(chipLabel({ name: "Telling the time", strategy: "guided" }, {}), "Telling the time, step by step");
  assert.equal(chipLabel({ name: "Counting to 20", strategy: "words" }, { prefers: "visual" }), "Counting to 20 with pictures");
  assert.equal(chipLabel({ name: "Counting to 20", strategy: "" }, { prefers: "words" }), "Practise counting to 20");
  assert.equal(chipLabel({ name: "English spelling", strategy: "" }, {}), "Practise English spelling", "proper nouns keep their capital");
});
