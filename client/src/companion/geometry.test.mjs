import test from "node:test";
import assert from "node:assert/strict";
import { fitFrame, hopKeyframes, gazeTowards, visibleShare, pickSpot } from "./geometry.js";

const manifest = { width: 480, height: 454, body: { left: 0.1583, top: 0.141, right: 0.8208, bottom: 0.9692 } };

test("the dog's body fills the spot like the old still picture (frame overhangs for ears and paws)", () => {
  const spot = { left: 100, top: 200, width: 120, height: 140 };
  const f = fitFrame(spot, manifest.body, manifest);
  const bodyTop = f.top + manifest.body.top * f.height;
  const bodyBottom = f.top + manifest.body.bottom * f.height;
  const bodyCx = f.left + ((manifest.body.left + manifest.body.right) / 2) * f.width;
  assert.ok(Math.abs(bodyBottom - (spot.top + spot.height)) < 0.01, "paws on the spot's floor");
  assert.ok(Math.abs(bodyTop - spot.top) < 1, "head at the spot's top");
  assert.ok(Math.abs(bodyCx - (spot.left + spot.width / 2)) < 0.01, "centred");
  assert.ok(f.width > spot.width && f.height > spot.height, "room around the body");
});

test("a hop rises above both ends and lands exactly on the target", () => {
  const a = { left: 0, top: 500, width: 100, height: 100 };
  const b = { left: 600, top: 300, width: 160, height: 160 };
  const k = hopKeyframes(a, b);
  assert.deepEqual(k[0], { t: 0, ...a });
  const end = k[k.length - 1];
  assert.ok(Math.abs(end.left - b.left) < 1e-9 && Math.abs(end.top - b.top) < 1e-9 && end.width === b.width);
  const mid = k[Math.floor(k.length / 2)];
  assert.ok(mid.top + mid.height < Math.min(a.top + a.height, b.top + b.height), "the arc goes up");
});

test("gaze: which side, and 'ahead' when the target is in front", () => {
  const dog = { left: 500, top: 500, width: 100, height: 100 };
  assert.equal(gazeTowards(dog, { left: 100, top: 500, width: 50, height: 40 }).dir, "left");
  assert.equal(gazeTowards(dog, { left: 900, top: 500, width: 50, height: 40 }).dir, "right");
  assert.equal(gazeTowards(dog, { left: 520, top: 200, width: 60, height: 40 }).dir, "center");
});

test("visible share of a rect", () => {
  assert.equal(visibleShare({ left: 0, top: 0, width: 100, height: 100 }, 1000, 1000), 1);
  assert.equal(visibleShare({ left: -50, top: 0, width: 100, height: 100 }, 1000, 1000), 0.5);
  assert.equal(visibleShare({ left: 0, top: 2000, width: 100, height: 100 }, 1000, 1000), 0);
});

test("spot choice: dialogs win, bigger wins, the current spot is kept while still on screen", () => {
  const r = (top, h = 120) => ({ left: 10, top, width: h, height: h });
  const page = { id: "page", rect: r(100, 140) };
  const small = { id: "small", rect: r(400, 100) };
  assert.equal(pickSpot([page, small], null, 1000, 800), "page");
  const dialog = { id: "dialog", rect: r(300, 110), modal: true };
  assert.equal(pickSpot([page, small, dialog], "page", 1000, 800), "dialog", "a dialog takes the dog");
  // Scrolled so the current spot is 40% visible: stays (no hopping back and forth).
  const scrolled = { id: "page", rect: { left: 10, top: -84, width: 140, height: 140 } };
  assert.equal(pickSpot([scrolled, small], "page", 1000, 800), "page");
  // Mostly gone: moves on.
  const gone = { id: "page", rect: { left: 10, top: -120, width: 140, height: 140 } };
  assert.equal(pickSpot([gone, small], "page", 1000, 800), "small");
  assert.equal(pickSpot([], "page", 1000, 800), null);
});
