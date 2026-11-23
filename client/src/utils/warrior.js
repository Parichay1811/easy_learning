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
