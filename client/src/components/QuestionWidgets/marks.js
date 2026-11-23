// Pure helpers for the answer widgets: which pieces of an answer were right
// once the card has judged it, and what the right answer looks like when it is
// shown. No React, no imports, so `node --test` checks them (marks.test.mjs).
// Values are compared trimmed and case-blind, like the tap widgets do; the
// verdict itself always comes from scoreAnswer.js (`result`).

const norm = (v) => String(v ?? "").trim().toLowerCase();

/**
 * The pieces a built sequence is compared with, one per tile, or null when
 * there is no single right order to compare with (an equation made from
 * tiles: any true one counts) or the answer cannot be split one piece per tile.
 */
export function targetSequence(question) {
  const ca = question?.correct_answer;
  if (Array.isArray(ca)) return ca.map((v) => String(v));
  if (question?.validation?.equation) return null;
  const accepted = Array.isArray(question?.accepted_answers) ? question.accepted_answers : [];
  const answer = typeof ca === "string" && ca.trim() ? ca : accepted.find((a) => typeof a === "string" && a.trim());
  if (!answer) return null;
  const options = Array.isArray(question?.options) ? question.options : [];
  // letter_bank with a word answer: single letters are joined with nothing, words with spaces.
  const singles = options.length > 0 && options.every((o) => [...String(o)].length <= 1);
  const pieces = singles ? [...answer.replace(/\s+/g, "")] : answer.trim().split(/\s+/);
  return pieces.length === options.length ? pieces : null;
}

/**
 * One mark per placed piece: true (in the right place), false (not), or null
 * (no fair way to say). A right answer is right everywhere: it may have been
 * accepted another way (an alternative answer) than the one compared with.
 */
export function sequenceMarks(question, placed, result) {
  const list = Array.isArray(placed) ? placed : [];
  if (result === "correct") return list.map(() => true);
  const target = targetSequence(question);
  if (!target) return list.map(() => null);
  return list.map((v, i) => (i < target.length ? norm(v) === norm(target[i]) : false));
}

/** Where each item belongs: normalised item -> Set of bins (from correct_answer). */
export function binHomes(question) {
  const homes = new Map();
  const ca = question?.correct_answer;
  if (!ca || typeof ca !== "object" || Array.isArray(ca)) return homes;
  for (const [bin, items] of Object.entries(ca)) {
    for (const it of Array.isArray(items) ? items : []) {
      const key = norm(it);
      if (!homes.has(key)) homes.set(key, new Set());
      homes.get(key).add(bin);
    }
  }
  return homes;
}

/** true when `item` is in one of its bins, false when not, null when it has no known bin. */
export function binMark(homes, item, bin) {
  const home = homes.get(norm(item));
  return home ? home.has(bin) : null;
}

/** The (first) bin an item belongs in, or null. */
export function homeOf(homes, item) {
  const home = homes.get(norm(item));
  return home ? [...home][0] : null;
}

/** The right partner of a left item in match_pairs, or null. */
export function partnerOf(pairs, left) {
  const hit = (Array.isArray(pairs) ? pairs : []).find((p) => Array.isArray(p) && norm(p[0]) === norm(left));
  return hit ? hit[1] : null;
}

/** The answer to show for a typed question: correct_answer (as the card's sheet does), else the first accepted answer. */
export function expectedAnswer(question) {
  const ca = question?.correct_answer;
  if ((typeof ca === "string" && ca.trim()) || typeof ca === "number") return String(ca).trim();
  const accepted = Array.isArray(question?.accepted_answers) ? question.accepted_answers : [];
  const first = accepted.find((a) => (typeof a === "string" && a.trim()) || typeof a === "number");
  return first != null ? String(first).trim() : "";
}
