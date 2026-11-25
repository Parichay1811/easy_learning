// What the lesson had on the board, kept while a menu view ("Key Concepts",
// "Experiments / Activities") borrows it, so "Lesson Board" can put it back.
// Pure (no page), so it can be checked in Node.
//
// The board is a function of the ops added since its last "clear", each at
// its time on the board clock (board.js), so those are what is remembered:
// adding them again at the same times redraws the lesson as it stood, without
// its sounds or entrances (they are in the past). With nothing asked yet that
// is the welcome board.

// Lines that draw nothing and are not a lesson: never picked up again.
const NOT_RESUMED = new Set(["ack", "say"]);

/**
 * Where a run (app.js) would carry on from: { i, resume }. resume is false
 * when there is nothing left to say: it had finished or was stopped, it was a
 * menu view or a short line, or its stream was dropped.
 */
export function resumePoint(r) {
  if (!r?.plan) return { i: 0, resume: false };
  // Left in the pause after a sentence: the next one.
  const i = r.paused && r.between ? r.i + 1 : (r.i ?? 0);
  const resume =
    !r.dead && !r.finished && r.waiting == null && !r.plan.menu && !NOT_RESUMED.has(r.plan.kind) && i < r.plan.steps.length;
  return { i, resume };
}

export function createLessonMemory() {
  let ops = []; // [op, at] on the lesson's board since its last "clear"
  let away = null; // what was going on when a menu view took the board
  return {
    /** The lesson drew this on the board at board time `at`. */
    drew(op, at) {
      if (op.op === "clear") ops = [];
      else ops.push([op, at]);
    },
    /** A menu view takes the board from `run`; a second menu view keeps the first lesson. */
    leave(run, extra = {}) {
      away ||= { run, ...resumePoint(run), ...extra };
    },
    /** True while a menu view is on the board. */
    get away() {
      return !!away;
    },
    /** The lesson is back (or a new one drew over the menu view): { run, i, resume, ops, …extra }, or null if it never left. */
    back() {
      const was = away && { ...away, ops: ops.slice() };
      away = null;
      return was || null;
    },
    get ops() {
      return ops.slice();
    },
  };
}
