// A week's name. The engine keys a week by its Monday ("2026-11-23") or as an
// ISO week ("2026-W48"). Shown as that bare date it reads as a day, and a
// learner who played on Tuesday the 24th sees "23 Nov" and thinks the date is
// a day out. So a week is always shown as its seven days: "23–29 Nov".
// Pure (no React, no imports): `node --test` checks it (weeks.test.mjs).

const DAY = 86400000;

/** The Monday of a week key, as a Date at 12:00 UTC (null when the key is not a week). */
export function weekMonday(week) {
  const w = String(week ?? "");
  const d = /^(\d{4})-(\d{2})-(\d{2})/.exec(w);
  if (d) {
    const at = new Date(Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), 12));
    return Number.isNaN(at.getTime()) ? null : at;
  }
  const m = /^(\d{4})-W(\d{1,2})$/.exec(w);
  if (!m) return null;
  // ISO week 1 is the week with 4 January in it.
  const jan4 = Date.UTC(Number(m[1]), 0, 4, 12);
  return new Date(jan4 - ((new Date(jan4).getUTCDay() + 6) % 7) * DAY + (Number(m[2]) - 1) * 7 * DAY);
}

/**
 * A week key -> its seven days in the page's language: "23–29 Nov" (en-GB),
 * "Nov 23 – 29" (en-US), "30 Nov – 6 Dec" across two months. Calendar dates
 * only (UTC inside), so the reader's timezone never moves it by a day.
 */
export function weekRange(week, lang) {
  return range(week, lang, { day: "numeric", month: "short" });
}

/**
 * The same week as its day numbers only, "23–29", for a chart's axis where
 * the month does not fit under every point (the full range is in the list and
 * the tooltip beside it).
 */
export function weekDays(week, lang) {
  // No spaces around the dash: the last label sits at the very edge of the chart.
  return range(week, lang, { day: "numeric" }).replace(/[\s\u2009\u202f\u00a0]*([\u2013\u2014~\uff5e-])[\s\u2009\u202f\u00a0]*/g, "$1");
}

function range(week, lang, parts) {
  const monday = weekMonday(week);
  if (!monday) return String(week ?? "");
  const sunday = new Date(monday.getTime() + 6 * DAY);
  const make = (l) => new Intl.DateTimeFormat(l || undefined, { ...parts, timeZone: "UTC" });
  let f;
  try { f = make(lang); } catch { f = make(undefined); }
  try {
    if (typeof f.formatRange === "function") return f.formatRange(monday, sunday);
  } catch { /* an old browser: the two dates, below */ }
  return `${f.format(monday)} – ${f.format(sunday)}`;
}
