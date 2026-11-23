// The companion's behaviour rules (docs/companion/INTERACTIONS.md).
import test from "node:test";
import assert from "node:assert/strict";
import { createBrain, PRIORITY } from "./brain.js";

function setup(seq = [0.1]) {
  let t = 1_000_000;
  let i = 0;
  const brain = createBrain({ now: () => t, random: () => seq[i++ % seq.length] });
  return { brain, at: (ms) => { t = ms; return t; }, advance: (ms) => { t += ms; return t; }, get t() { return t; } };
}

test("a first arrival says hello; arriving again soon after is a curious look, not another hello", () => {
  const w = setup([0.9]);
  assert.equal(w.brain.dispatch({ type: "arrive" }), true, "hello interrupts the idle clip");
  assert.equal(w.brain.choose().clip, "hello");
  w.advance(5_000);
  w.brain.dispatch({ type: "arrive" });
  assert.equal(w.brain.choose().clip, "tilt");
});

test("speaking wins over everything except a celebration that is already on screen", () => {
  const w = setup([0.9]);
  w.brain.dispatch({ type: "success", size: "big" });
  assert.equal(w.brain.choose().clip, "cheer");
  assert.equal(w.brain.dispatch({ type: "speakStart" }), false, "the cheer finishes first");
  assert.equal(w.brain.choose().clip, "talk", "then the dog talks");
  w.advance(4_000);
  assert.equal(w.brain.choose().clip, "talk", "and keeps talking while the voice speaks");
  assert.equal(w.brain.dispatch({ type: "speakEnd" }), true, "stops talking as soon as the voice stops");
  assert.notEqual(w.brain.choose().clip, "talk");
});

test("one right answer is a small hop on the current clip; a big success is a cheer, not more often than every few seconds", () => {
  const w = setup([0.9]);
  w.brain.choose();
  assert.equal(w.brain.dispatch({ type: "success" }), true);
  const small = w.brain.choose();
  assert.equal(small.keep, true, "no clip change for a single right answer");
  assert.equal(small.cues.hop, "small");
  w.brain.dispatch({ type: "success", size: "big" });
  const big = w.brain.choose();
  assert.equal(big.clip, "cheer");
  assert.equal(big.cues.hop, "big");
  w.advance(1_000);
  w.brain.dispatch({ type: "success", size: "big" });
  const again = w.brain.choose();
  assert.equal(again.keep, true, "a second big success a second later does not restart the cheer");
  assert.equal(again.cues.hop, "small", "it only adds a small hop");
});

test("support (a wrong answer) is gentle and rate-limited", () => {
  const w = setup([0.9]);
  assert.equal(w.brain.dispatch({ type: "support" }), true);
  assert.equal(w.brain.choose().clip, "comfort");
  w.advance(2_000);
  assert.equal(w.brain.dispatch({ type: "support" }), false, "not again two seconds later");
});

test("attention: looks the right way, not while scrolling, not again within the cooldown", () => {
  const w = setup([0.9]);
  w.brain.dispatch({ type: "quiet" });
  assert.equal(w.brain.dispatch({ type: "attend", dir: "left" }), false, "mid-scroll: don't chase things");
  w.advance(2_000);
  assert.equal(w.brain.dispatch({ type: "attend", dir: "left" }), true);
  const b = w.brain.choose();
  assert.equal(b.clip, "lookLeft");
  assert.equal(b.cues.lean, -1);
  w.advance(3_000);
  assert.equal(w.brain.dispatch({ type: "attend", dir: "right" }), false, "cooldown");
  w.advance(8_000);
  w.brain.choose(); // the look clip has ended
  assert.equal(w.brain.dispatch({ type: "attend", dir: "right" }), true);
  assert.equal(w.brain.choose().clip, "lookRight");
});

test("guide points at things on the right with the paw, and looks at things on the left", () => {
  const w = setup([0.9]);
  w.brain.dispatch({ type: "guide", dir: "right" });
  assert.equal(w.brain.choose().clip, "point");
  w.advance(31_000);
  w.brain.dispatch({ type: "guide", dir: "left" });
  assert.equal(w.brain.choose().clip, "lookLeft");
});

test("calm while the learner reads; small ambient moves only now and then, never the same one twice running", () => {
  const w = setup([0.1, 0.0, 0.1, 0.0]);
  w.brain.dispatch({ type: "quiet" });
  w.advance(2_000);
  assert.equal(w.brain.choose().clip, "idle", "reading: idle");
  w.advance(10_000);
  const a = w.brain.choose();
  assert.notEqual(a.clip, "idle", "quiet for a while: a small move");
  assert.equal(a.priority, PRIORITY.ambient);
  w.advance(4_000);
  assert.equal(w.brain.choose().clip, "idle", "not again so soon");
  w.advance(15_000);
  const b = w.brain.choose();
  assert.notEqual(b.clip, a.clip, "never the same flourish twice in a row");
});

test("nobody around for over a minute: one slow yawn, then still", () => {
  const w = setup([0.9]);
  w.advance(80_000);
  assert.equal(w.brain.choose().clip, "sleepy");
  w.advance(5_000);
  assert.equal(w.brain.choose().clip, "idle");
  w.advance(60_000);
  assert.equal(w.brain.choose().clip, "idle", "only one yawn until someone is back");
  w.brain.dispatch({ type: "activity" });
  w.advance(80_000);
  assert.equal(w.brain.choose().clip, "sleepy", "after activity, a later lull can yawn again");
});

test("a reaction that waited too long is dropped (stale), not played late", () => {
  const w = setup([0.9]);
  w.brain.dispatch({ type: "greet" });
  w.advance(5_000);
  assert.equal(w.brain.choose().clip, "idle");
});

test("a look that never got performed (it expired while a hello played) does not block the next look", () => {
  const w = setup([0.9]);
  w.brain.dispatch({ type: "arrive" });
  w.brain.choose(); // hello
  assert.equal(w.brain.dispatch({ type: "attend", dir: "right" }), false, "waits for the hello");
  w.advance(4_000);
  assert.equal(w.brain.choose().clip, "idle", "too late: dropped");
  w.advance(500);
  assert.equal(w.brain.dispatch({ type: "attend", dir: "right" }), true, "the next look is not on cooldown");
  assert.equal(w.brain.choose().clip, "lookRight");
});
