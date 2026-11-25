import test from "node:test";
import assert from "node:assert/strict";
import { pickGuide, placeHand } from "./pickGuide.js";

const c = (o = {}) => ({ key: "k", order: 5, visible: true, disabled: false, inDialog: false, done: false, ...o });

test("the lowest order wins; the first in the page breaks a tie", () => {
  assert.equal(pickGuide([c({ order: 5 }), c({ order: 1 }), c({ order: 1 })]), 1);
  assert.equal(pickGuide([c(), c()]), 0);
});

test("hidden, disabled and already-tapped targets are skipped", () => {
  assert.equal(pickGuide([c({ visible: false, order: 1 }), c({ disabled: true, order: 1 }), c({ done: true, order: 1 }), c({ order: 9 })]), 3);
  assert.equal(pickGuide([c({ visible: false })]), -1);
  assert.equal(pickGuide([]), -1);
});

test("with a dialog open only targets inside it count", () => {
  assert.equal(pickGuide([c({ order: 1 }), c({ order: 7, inDialog: true })], { dialogOpen: true }), 1);
  assert.equal(pickGuide([c({ order: 1 })], { dialogOpen: true }), -1);
});

test("the hand sits under the target, or above it at the bottom of the screen, always on screen", () => {
  const view = { width: 390, height: 800 };
  const under = placeHand({ left: 100, top: 100, width: 120, height: 50 }, view);
  assert.equal(under.below, true);
  assert.ok(under.y > 100 && under.y < 160);
  const above = placeHand({ left: 100, top: 740, width: 120, height: 50 }, view);
  assert.equal(above.below, false);
  assert.ok(above.y < 740);
  const edge = placeHand({ left: 370, top: 100, width: 40, height: 40 }, view);
  assert.ok(edge.x + 56 <= 390);
  assert.ok(placeHand({ left: -30, top: 10, width: 40, height: 40 }, view).x >= 6);
});
