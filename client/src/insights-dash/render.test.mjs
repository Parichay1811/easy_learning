// node --test src/insights-dash/render.test.mjs
// The insight wording: every key the server can send has English text (with plural pairs where a
// count is shown), the words never judge or compare a child, and a thin week is left out of a trend.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { STRINGS, tx, hasString, toResources } from "./strings.js";
import { renderer, shareMeasure, trendSeries, countStatus } from "./render.js";

// A tiny i18next stand-in: picks _one/_other by count and fills {{params}}.
const t = (key, o = {}) => {
  const tpl = o.count === 1 && o.defaultValue_one ? o.defaultValue_one : o.count !== undefined && o.defaultValue_other ? o.defaultValue_other : o.defaultValue;
  return String(tpl).replace(/\{\{(\w+)\}\}/g, (_, k) => (o[k] ?? `{{${k}}}`));
};
const r = renderer({ t, day: (iso) => `day(${iso})`, list: (a) => a.join(" + ") });

// Every key the server (server/services/learnerInsights.js) can produce.
const SERVER = fs("../../../server/services/learnerInsights.js");
function fs(rel) { return readFileSync(new URL(rel, import.meta.url), "utf8"); }

test("every finding, evidence and next-step key the server sends has English text", () => {
  const keys = new Set([...SERVER.matchAll(/key: '([a-zA-Z]+)'/g)].map((m) => m[1]));
  const nexts = [...SERVER.matchAll(/next\('([a-zA-Z]+)'/g)].map((m) => m[1]);
  for (const n of nexts) {
    assert.ok(hasString(`home.${n}`), `home.${n}`);
    assert.ok(hasString(`class.${n}`), `class.${n}`);
  }
  assert.ok(hasString("group.headline"), "the group headline");
  keys.delete("group");
  for (const k of keys) {
    const found = ["finding", "evidence", "headline", "group.reason", "group"].some((ns) => hasString(`${ns}.${k}`));
    assert.ok(found, `no text for "${k}"`);
  }
});

test("plural pairs exist wherever a count is shown, and render with the right form", () => {
  const res = toResources();
  assert.ok(res.finding.mastered_one && res.finding.mastered_other);
  assert.equal(tx(t, "finding.mastered", { count: 1, skills: "Counting" }), "Mastered a new skill: Counting");
  assert.equal(tx(t, "finding.mastered", { count: 2, skills: "A + B" }), "Mastered 2 new skills: A + B");
});

test("no judging or comparing words anywhere in the wording", () => {
  const all = JSON.stringify(STRINGS).toLowerCase();
  for (const bad of ["diagnos", "deficit", "disorder", "normal", "average", "smart", "clever", "weak", "lazy", "behind", "best in", "other children's"]) {
    assert.ok(!all.includes(bad), `"${bad}" must not appear`);
  }
  // "no rankings" is a promise; a ranking itself is never described.
  assert.ok(!/(?<!no )rank/.test(all), "no ranking language");
});

test("findings render with evidence and the audience's next step", () => {
  const f = {
    id: "practise:x", kind: "practice", key: "practise", params: { name: "Sam", skill: "Comparing numbers" },
    evidence: [{ key: "rightOfRecent", params: { correct: 6, attempts: 14, misses: 2 } }, { key: "supportTried", params: { strategy: "visual" } }],
    next: { key: "home.practise", params: { name: "Sam", skill: "Comparing numbers" }, note: "Use coins." },
  };
  const out = r.finding(f);
  assert.equal(out.kindLabel, "Worth more practice");
  assert.equal(out.title, "Comparing numbers");
  assert.deepEqual(out.evidence, ["6 of 14 right so far; the last 2 tries were not right yet.", "Learnigo already explains it another way (pictures)."]);
  assert.match(out.next, /one round of Comparing numbers/);
  assert.equal(out.note, "Use coins.");
  assert.equal(out.nextLabel, "At home, 10 minutes");
  const teacher = renderer({ t, audience: "teacher" }).finding({ ...f, next: { key: "class.practise", params: { skill: "Comparing numbers" } } });
  assert.equal(teacher.nextLabel, "In class");
  assert.equal(r.finding({ kind: "effort", key: "quiet", params: { days: 7 }, evidence: [{ key: "lastActive", params: { date: "2026-11-12" } }] }).evidence[0], "Last learning: day(2026-11-12).");
});

test("headlines and measures: too early to tell is said in words", () => {
  assert.equal(r.headline({ key: "active", params: { name: "Sam", days: 5, of: 7, answered: 62, mastered: 2, practise: 1 } }),
    "Sam practised on 5 of the last 7 days and answered 62 questions. 2 new skills mastered. 1 skill is worth more practice.");
  assert.equal(r.headline({ key: "quiet", params: { days: 7 } }), "No learning in the last 7 days.");
  const early = shareMeasure(t, { cur: 90, prev: null, curN: 6, prevN: 0, status: "early" });
  assert.equal(early.statusLabel, "Too early to tell"); assert.equal(early.why, "6 answers now, 0 before; we compare from 20 each");
  assert.equal(shareMeasure(t, { cur: 80, prev: 60, curN: 50, prevN: 50, status: "up" }).statusLabel, "Up on the period before");
  assert.equal(countStatus(3, 5), "fewer"); assert.equal(countStatus(5, 5), "same"); assert.equal(countStatus(5, null), null);
});

test("weekly trend: thin weeks and weeks before the start are left out, not drawn as zero", () => {
  const weeks = [
    { week: "2026-10-26", activeDays: 0, answered: 0, firstTry: null },
    { week: "2026-11-02", activeDays: 3, answered: 30, firstTry: 60 },
    { week: "2026-11-09", activeDays: 1, answered: 4, firstTry: null },
    { week: "2026-11-16", activeDays: 5, answered: 50, firstTry: 74 },
    { week: "2026-11-23", activeDays: 1, answered: 12, firstTry: 50, partial: true },
  ];
  const ft = trendSeries(weeks, "firstTry");
  assert.deepEqual(ft.points.map((p) => p.value), [null, 60, null, 74, 50]);
  assert.equal(ft.first.value, 60); assert.equal(ft.last.value, 74, "the week in progress is not the latest full week");
  assert.deepEqual(trendSeries(weeks, "days").points.map((p) => p.value), [null, 3, 1, 5, 1]);
});

test("group reasons carry their numbers", () => {
  assert.equal(r.reason({ key: "quiet", params: { days: 7, last: "2026-11-13" } }), "No learning in the last 7 days (last learning day(2026-11-13))");
  assert.equal(r.reason({ key: "stuck", params: { skill: "Taking away", correct: 7, attempts: 21, mixup: "added instead of subtracting", times: 8, strategy: "visual" } }),
    "Finding Taking away tricky: 7 of 21 right; mix-up “added instead of subtracting” 8 times; Learnigo already tried: pictures");
});
