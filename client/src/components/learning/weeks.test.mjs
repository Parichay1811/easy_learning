// node --test client/src/components/learning/weeks.test.mjs
// "My weeks": a week is named by its seven days, never by its Monday alone
// (which read as a date one day early for a learner who played on Tuesday).
import { test } from "node:test";
import assert from "node:assert/strict";
import { weekMonday, weekRange, weekDays } from "./weeks.js";

const iso = (d) => d.toISOString().slice(0, 10);
// Any dash and any space: browsers differ in the exact characters of a range.
const plain = (s) => s.replace(/[   ]/g, " ").replace(/\s*[–—-]\s*/g, "-");

test("a week key is its Monday", () => {
  assert.equal(iso(weekMonday("2026-11-23")), "2026-11-23");
  assert.equal(iso(weekMonday("2026-11-23T00:00:00.000Z")), "2026-11-23");
  assert.equal(iso(weekMonday("2026-W48")), "2026-11-23");
  assert.equal(iso(weekMonday("2026-W1")), "2025-12-29", "ISO week 1 of 2026 starts in December");
  assert.equal(iso(weekMonday("2021-W01")), "2021-01-04");
  assert.equal(weekMonday("soon"), null);
  assert.equal(weekMonday(null), null);
});

test("a week is shown as its seven days, in the page's language", () => {
  assert.equal(plain(weekRange("2026-11-23", "en-GB")), "23-29 Nov");
  assert.equal(plain(weekRange("2026-11-23", "en-US")), "Nov 23-29");
  assert.equal(plain(weekRange("2026-W48", "en-GB")), "23-29 Nov");
  assert.equal(plain(weekRange("2026-11-30", "en-GB")), "30 Nov-6 Dec", "across two months");
  assert.match(plain(weekRange("2026-12-28", "en-GB")), /^28 Dec( 2026)?-3 Jan( 2027)?$/, "across two years (the years may be added)");
  // The 24th (the day the learner played) is inside the range: no "one day early".
  for (const lang of ["en", "de", "fr", "es", "ja", "ru", "zh", "tr", "vi", "ko", "id", "it", "nl", "pt"]) {
    const s = weekRange("2026-11-23", lang);
    assert.ok(/23/.test(s) && /29/.test(s), `${lang}: ${s}`);
  }
  // The chart's axis: the day numbers only (still a range, never one date).
  assert.equal(plain(weekDays("2026-11-23", "en-GB")), "23-29");
  assert.equal(plain(weekDays("2026-11-23", "en-US")), "23-29");
  assert.match(plain(weekDays("2026-11-30", "en-GB")), /30.*-.*6/);
  assert.equal(weekRange("soon", "en"), "soon");
  assert.match(weekRange("2026-11-23", "not a language"), /23/, "an unknown language falls back");
});

test("the label never depends on the reader's timezone", () => {
  const before = process.env.TZ;
  try {
    for (const tz of ["America/Los_Angeles", "Asia/Kolkata", "Pacific/Kiritimati", "UTC"]) {
      process.env.TZ = tz;
      assert.equal(plain(weekRange("2026-11-23", "en-GB")), "23-29 Nov", tz);
    }
  } finally {
    if (before === undefined) delete process.env.TZ; else process.env.TZ = before;
  }
});
