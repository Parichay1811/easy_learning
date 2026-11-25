// node --test client/src/components/dashboard/charts/monthBlocks.test.mjs
// The calendar heatmap's layout: one block per month, a gap between months, a
// week that straddles two months split between them (like LeetCode's calendar).
import { test } from "node:test";
import assert from "node:assert/strict";
import { monthBlocks, placeBlocks, moveDay, shiftDay, weekdayOf } from "./monthBlocks.js";

test("a year is twelve blocks holding every day once, in its own month", () => {
  const blocks = monthBlocks("2026-01-01", "2026-12-31");
  assert.deepEqual(blocks.map((b) => b.key), ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((m) => `2026-${m}`));
  const days = blocks.flatMap((b) => b.weeks.flat().filter(Boolean));
  assert.equal(days.length, 365);
  assert.equal(new Set(days).size, 365);
  for (const b of blocks) {
    for (const week of b.weeks) {
      assert.equal(week.length, 7);
      week.forEach((iso, row) => {
        if (!iso) return;
        assert.equal(iso.slice(0, 7), b.key, "only its own month's days");
        assert.equal(weekdayOf(iso), row, "Monday on top, Sunday at the bottom");
      });
    }
    assert.ok(b.weeks.length >= 4 && b.weeks.length <= 6, `${b.key}: ${b.weeks.length} weeks`);
  }
});

test("a week that straddles two months is split between them", () => {
  // Monday 30 November 2026 .. Sunday 6 December 2026.
  const [nov, dec] = monthBlocks("2026-11-01", "2026-12-31");
  assert.deepEqual(nov.weeks[nov.weeks.length - 1], ["2026-11-30", null, null, null, null, null, null]);
  assert.deepEqual(dec.weeks[0], [null, "2026-12-01", "2026-12-02", "2026-12-03", "2026-12-04", "2026-12-05", "2026-12-06"]);
  // November 2026 starts on a Sunday: its first column is that one day.
  assert.deepEqual(nov.weeks[0], [null, null, null, null, null, null, "2026-11-01"]);
  assert.deepEqual(nov.weeks[1][0], "2026-11-02");
  // A month that starts on a Monday and the one before it share no week.
  const [may, june] = monthBlocks("2026-05-01", "2026-06-30");
  assert.equal(may.weeks[may.weeks.length - 1][6], "2026-05-31");
  assert.equal(june.weeks[0][0], "2026-06-01");
});

test("a range can start and stop in the middle of a month", () => {
  const blocks = monthBlocks("2026-11-24", "2026-12-02");
  assert.deepEqual(blocks.map((b) => [b.key, b.year, b.month, b.weeks.length]), [["2026-11", 2026, 10, 2], ["2026-12", 2026, 11, 1]]);
  assert.deepEqual(blocks[0].weeks[0], [null, "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29"]);
  assert.deepEqual(blocks[1].weeks[0], [null, "2026-12-01", "2026-12-02", null, null, null, null]);
  assert.deepEqual(monthBlocks("2026-11-25", "2026-11-25")[0].weeks, [[null, null, "2026-11-25", null, null, null, null]]);
  assert.deepEqual(monthBlocks("2026-12-01", "2026-11-01"), []);
  assert.deepEqual(monthBlocks("nonsense", "2026-11-01"), []);
  assert.deepEqual(monthBlocks("2026-02-31", "2026-03-01"), []);
  assert.equal(monthBlocks("2020-01-01", "2030-01-01").flatMap((b) => b.weeks.flat().filter(Boolean)).length, 800, "never a runaway range");
  // A leap year.
  assert.equal(monthBlocks("2028-01-01", "2028-12-31").flatMap((b) => b.weeks.flat().filter(Boolean)).length, 366);
});

test("the layout never depends on the reader's timezone", () => {
  const before = process.env.TZ;
  const want = JSON.stringify(monthBlocks("2026-10-25", "2026-11-25"));
  try {
    for (const tz of ["America/Los_Angeles", "Asia/Kolkata", "Europe/Berlin", "Pacific/Kiritimati"]) {
      process.env.TZ = tz;
      assert.equal(JSON.stringify(monthBlocks("2026-10-25", "2026-11-25")), want, tz); // 25 October: clocks go back in Berlin
    }
  } finally {
    if (before === undefined) delete process.env.TZ; else process.env.TZ = before;
  }
});

test("blocks sit in one grid with a gap column between months", () => {
  const blocks = monthBlocks("2026-10-01", "2026-12-31");
  const placed = placeBlocks(blocks, { first: 2 });
  assert.deepEqual(placed.blocks.map((b) => [b.key, b.start, b.span]), [["2026-10", 2, 5], ["2026-11", 8, 6], ["2026-12", 15, 5]]);
  assert.equal(placed.columns, 5 + 1 + 6 + 1 + 5);
  assert.deepEqual(placed.template.map((c) => (c.gap ? "|" : "w")).join(""), "wwwww|wwwwww|wwwww");
  assert.deepEqual(placeBlocks([]).blocks, []);
  assert.equal(placeBlocks(blocks).blocks[0].start, 1);
});

test("arrow keys move by date, so a split week never traps the keyboard", () => {
  const [from, to] = ["2026-01-01", "2026-12-31"];
  // Monday 30 November: the next column in its block does not exist; a week later is 7 December.
  assert.equal(moveDay("2026-11-30", "ArrowRight", from, to), "2026-12-07");
  assert.equal(moveDay("2026-12-01", "ArrowLeft", from, to), "2026-11-24");
  assert.equal(moveDay("2026-11-30", "ArrowDown", from, to), "2026-12-01", "down the same week, into the next month's block");
  assert.equal(moveDay("2026-12-06", "ArrowDown", from, to), "2026-12-06", "Sunday is the bottom of a week");
  assert.equal(moveDay("2026-11-30", "ArrowUp", from, to), "2026-11-30", "Monday is the top");
  assert.equal(moveDay("2026-12-28", "ArrowRight", from, to), "2026-12-31", "never past the last day");
  assert.equal(moveDay("2026-01-03", "ArrowLeft", from, to), "2026-01-01", "never before the first");
  assert.equal(moveDay("2026-06-15", "Home", from, to), "2026-01-01");
  assert.equal(moveDay("2026-06-15", "End", from, to), "2026-12-31");
  assert.equal(moveDay("2026-06-15", "Enter", from, to), null);
  assert.equal(shiftDay("2026-02-28", 1), "2026-03-01");
  assert.equal(shiftDay("2028-02-28", 1), "2028-02-29");
});
