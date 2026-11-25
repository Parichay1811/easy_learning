// Warrior mode is "beat your own best" (docs/learning/GAME-ROADMAP.md G-005):
// no clock unless the learner turns one on, a clock that never costs a star,
// a pass mark that scales with the round, and the learner's own best to beat.

// The share of a round's questions to get right to pass (6 of 10).
export const PASS_SHARE = 0.6;

/** Stars needed to pass a Warrior round of `total` questions (at least 1). */
export function warriorPassMark(total) {
  const n = Math.max(1, Math.round(Number(total) || 0));
  return Math.max(1, Math.ceil(n * PASS_SHARE));
}

/** True when { stars, total } beats the earlier best (a bigger share right; the same share with more stars). */
export function beatsBest(prev, cur) {
  if (!cur || !(cur.total > 0)) return false;
  if (!prev || !(prev.total > 0)) return cur.stars > 0;
  const a = cur.stars / cur.total;
  const b = prev.stars / prev.total;
  return a > b + 1e-9 || (Math.abs(a - b) < 1e-9 && cur.stars > prev.stars);
}

/**
 * The seconds left when the clock's length changes in the middle of a question
 * (Normal to More time, or back): the same share of the new length, so the
 * ring neither jumps to half nor hands out a full new clock.
 *   rescaleTimeLeft(12, 30, 60) -> 24      rescaleTimeLeft(50, 60, 30) -> 25
 */
export function rescaleTimeLeft(left, oldTotal, newTotal) {
  const next = Math.max(0, Math.round(Number(newTotal) || 0));
  const old = Number(oldTotal) || 0;
  if (!(old > 0) || !next) return next;
  const share = Math.min(1, Math.max(0, (Number(left) || 0) / old));
  return Math.min(next, Math.round(share * next));
}

/**
 * What a finished Warrior round counts. Open questions (speaking or writing
 * with no right answer: status "ungraded") are not scored in Warrior: they are
 * no star and they are left out of the pass mark.
 *   total: questions in the round; unscored: how many were not scored; stars: right answers.
 * -> { scored (questions that count), passMark, passed }
 * A round with nothing to score has no result: passed is null (it is shown as practice).
 */
export function warriorResult({ total, unscored = 0, stars = 0 }) {
  const n = Math.max(0, Math.round(Number(total) || 0));
  const scored = Math.max(0, n - Math.max(0, Math.round(Number(unscored) || 0)));
  if (!scored) return { scored: 0, passMark: 0, passed: null };
  const passMark = warriorPassMark(scored);
  return { scored, passMark, passed: (Number(stars) || 0) >= passMark };
}

const STORE = "learnigo_warrior_best";

function readAll(storage) {
  try { return JSON.parse(storage?.getItem(STORE) || "{}") || {}; } catch { return {}; }
}

/**
 * Notes a finished Warrior round under `key` (learner + module + subject) and
 * says how it compares: { best (the earlier best, or null), newBest }.
 * Kept on this device; storage switched off just means no best is shown.
 */
export function noteWarriorBest(key, stars, total, storage = typeof localStorage !== "undefined" ? localStorage : null) {
  const all = readAll(storage);
  const prev = all[key] || null;
  const cur = { stars: Math.max(0, Math.round(stars) || 0), total: Math.max(1, Math.round(total) || 1) };
  const newBest = beatsBest(prev, cur);
  if (newBest) {
    all[key] = cur;
    try { storage?.setItem(STORE, JSON.stringify(all)); } catch { /* storage off */ }
  }
  return { best: prev, newBest };
}
