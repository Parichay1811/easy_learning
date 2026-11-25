// What the lesson had on the board while a menu view borrows it
// (public/lesson-memory.js): "Lesson Board" puts it back.
import test from "node:test";
import assert from "node:assert/strict";
import { createLessonMemory, resumePoint } from "../public/lesson-memory.js";

const lesson = (n = 3, extra = {}) => ({ plan: { kind: "explain", steps: Array.from({ length: n }, (_, i) => ({ say: `Step ${i}.`, draw: [] })) }, i: 0, ...extra });

test("the board is what was drawn since its last clear, each op at its own time", () => {
  const m = createLessonMemory();
  m.drew({ op: "clear" }, 0);
  m.drew({ op: "title", text: "Ask me anything" }, 0);
  m.drew({ op: "chips", items: ["a"] }, 1.2);
  assert.deepEqual(m.ops, [[{ op: "title", text: "Ask me anything" }, 0], [{ op: "chips", items: ["a"] }, 1.2]]);
  m.drew({ op: "clear" }, 9);
  m.drew({ op: "title", text: "Circles" }, 9);
  m.drew({ op: "mark", option: 1 }, 14);
  assert.deepEqual(m.ops, [[{ op: "title", text: "Circles" }, 9], [{ op: "mark", option: 1 }, 14]]);
});

test("a menu view takes the board and gives it back once, with where the lesson was", () => {
  const m = createLessonMemory();
  assert.equal(m.away, false);
  assert.equal(m.back(), null, "nothing to go back to while the lesson has the board");
  m.drew({ op: "title", text: "Circles" }, 3);
  const run = lesson(4, { i: 2, drawn: 2 });
  m.leave(run, { awaiting: { options: [1, 2] }, sticky: "Concept Explainer" });
  assert.equal(m.away, true);
  const was = m.back();
  assert.equal(was.run, run);
  assert.equal(was.i, 2);
  assert.equal(was.resume, true);
  assert.deepEqual(was.awaiting, { options: [1, 2] });
  assert.equal(was.sticky, "Concept Explainer");
  assert.deepEqual(was.ops, [[{ op: "title", text: "Circles" }, 3]]);
  assert.equal(m.away, false);
  assert.equal(m.back(), null);
});

test("from one menu view to another, the lesson kept is still the first one's", () => {
  const m = createLessonMemory();
  const run = lesson(3, { i: 1 });
  m.leave(run);
  m.leave({ plan: { kind: "say", menu: "concepts", steps: [{ say: "Key ideas.", draw: [] }] }, i: 0 });
  m.leave({ plan: { kind: "say", steps: [{ say: "Okay.", draw: [] }] }, i: 0, finished: true });
  assert.equal(m.back().run, run);
});

test("where a lesson carries on from", () => {
  assert.deepEqual(resumePoint(lesson(3, { i: 1 })), { i: 1, resume: true });
  // Interrupted in the pause after a sentence: the next one.
  assert.deepEqual(resumePoint(lesson(3, { i: 1, paused: true, between: true })), { i: 2, resume: true });
  assert.deepEqual(resumePoint(lesson(3, { i: 1, paused: true, between: false })), { i: 1, resume: true });
  // Nothing left to say: finished, stopped, past its last sentence, or its stream was dropped.
  assert.equal(resumePoint(lesson(3, { i: 2, finished: true })).resume, false);
  assert.equal(resumePoint(lesson(3, { i: 1, dead: true })).resume, false);
  assert.equal(resumePoint(lesson(3, { i: 2, paused: true, between: true })).resume, false);
  assert.equal(resumePoint(lesson(3, { i: 2, waiting: 3 })).resume, false);
  // Short lines and menu views are never picked up again.
  for (const kind of ["ack", "say"]) assert.equal(resumePoint({ plan: { kind, steps: [{ say: "Okay." }] }, i: 0 }).resume, false);
  assert.equal(resumePoint({ plan: { kind: "say", menu: "try", steps: [{ say: "Try it." }] }, i: 0 }).resume, false);
  // Before anything ran.
  assert.deepEqual(resumePoint(null), { i: 0, resume: false });
  assert.deepEqual(resumePoint({ plan: { kind: "greet", steps: [{ say: "Hi." }] } }), { i: 0, resume: true });
});
