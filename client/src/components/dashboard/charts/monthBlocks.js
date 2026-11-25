// The calendar heatmap's layout, like LeetCode's: one block per month with a
// gap between months, instead of one unbroken run of weeks where nobody can
// tell where a month ends. Used by the learner's own calendar
// (pages/studentDashboard/HistoryTab.jsx) and the grown-ups' one
// (CalendarHeatmap.jsx), so every role sees the same calendar.
// Pure (no React, no imports): `node --test` checks it (monthBlocks.test.mjs).
//
// Days are calendar dates ("YYYY-MM-DD"). All the arithmetic is on UTC
// midnights of those dates, so the reader's timezone never moves a day.

const DAY = 86400000;
const MAX_DAYS = 800;

const toMs = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ""));
  if (!m) return NaN;
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  // 2026-02-31 is not a date.
  return new Date(ms).toISOString().slice(0, 10) === `${m[1]}-${m[2]}-${m[3]}` ? ms : NaN;
};
const toISO = (ms) => new Date(ms).toISOString().slice(0, 10);

/** `iso` moved by `n` days. */
export function shiftDay(iso, n) {
  const ms = toMs(iso);
  return Number.isNaN(ms) ? "" : toISO(ms + n * DAY);
}

/** Monday = 0 … Sunday = 6. */
export function weekdayOf(iso) {
  const ms = toMs(iso);
  return Number.isNaN(ms) ? -1 : (new Date(ms).getUTCDay() + 6) % 7;
}

/**
 * The days `from`..`to` (inclusive) as month blocks:
 *   [{ key: "2026-11", year: 2026, month: 10, weeks: [[iso | null × 7], …] }]
 * Each week is a column, Monday on top. A week that straddles two months is
 * split: it is the last column of one block and the first of the next, each
 * holding only its own month's days (null elsewhere).
 */
export function monthBlocks(from, to) {
  const a = toMs(from);
  const b = Math.min(toMs(to), a + (MAX_DAYS - 1) * DAY);
  if (Number.isNaN(a) || Number.isNaN(b) || a > b) return [];
  const blocks = [];
  for (let t = a; t <= b; t += DAY) {
    const iso = toISO(t);
    const key = iso.slice(0, 7);
    let block = blocks[blocks.length - 1];
    if (!block || block.key !== key) {
      block = { key, year: Number(iso.slice(0, 4)), month: Number(iso.slice(5, 7)) - 1, weeks: [] };
      blocks.push(block);
    }
    const row = (new Date(t).getUTCDay() + 6) % 7;
    if (!block.weeks.length || row === 0) block.weeks.push([null, null, null, null, null, null, null]);
    block.weeks[block.weeks.length - 1][row] = iso;
  }
  return blocks;
}

/**
 * Where each block sits in one CSS grid: week columns, with one narrow gap
 * column between two months.
 *   placeBlocks(blocks, { first: 1 }) ->
 *   { template: [{ gap: false }, …], blocks: [{ …block, start (grid column of its first week), span }], columns }
 * `first`: the grid column of the first week (2 when a column of weekday names comes first).
 */
export function placeBlocks(blocks, { first = 1 } = {}) {
  const template = [];
  const placed = [];
  let col = first;
  blocks.forEach((block, i) => {
    if (i > 0) { template.push({ gap: true }); col += 1; }
    placed.push({ ...block, start: col, span: block.weeks.length });
    for (let w = 0; w < block.weeks.length; w += 1) template.push({ gap: false });
    col += block.weeks.length;
  });
  return { template, blocks: placed, columns: template.length };
}

/**
 * Arrow keys on a day, by date (never by column: a split week has blank cells
 * a column-based move would get stuck on). Left / Right: a week earlier /
 * later; Up / Down: the day before / after within the week; Home / End: the
 * first / last day. Returns the day to move to (clamped to from..to), or null
 * when the key is not a calendar key.
 */
export function moveDay(iso, key, from, to) {
  const at = toMs(iso);
  const lo = toMs(from);
  const hi = toMs(to);
  if (Number.isNaN(at) || Number.isNaN(lo) || Number.isNaN(hi)) return null;
  const row = (new Date(at).getUTCDay() + 6) % 7;
  let next;
  if (key === "ArrowRight") next = at + 7 * DAY;
  else if (key === "ArrowLeft") next = at - 7 * DAY;
  else if (key === "ArrowDown") next = row < 6 ? at + DAY : at;
  else if (key === "ArrowUp") next = row > 0 ? at - DAY : at;
  else if (key === "Home") next = lo;
  else if (key === "End") next = hi;
  else return null;
  return toISO(Math.min(hi, Math.max(lo, next)));
}
