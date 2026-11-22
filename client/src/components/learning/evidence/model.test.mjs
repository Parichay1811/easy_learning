// node --test client/src/components/learning/evidence/model.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { normaliseEvidence, pickInsights, say, localParams, weekKey, isPlaceholder } from "./model.js";
import { SAMPLE_EVIDENCE, EMPTY_EVIDENCE } from "./sample.js";

// A stand-in for i18next's t: no translations loaded, so the default (with {{params}}) is used.
const t = (key, a, b) => {
  const o = typeof a === "object" && a ? a : { ...(b || {}), defaultValue: a };
  const d = (o.count === 1 && o.defaultValue_one) || o.defaultValue || key;
  return String(d).replace(/\{\{(\w+)\}\}/g, (_, k) => (o[k] == null ? "" : String(o[k])));
};

test("absent, empty and placeholder-only evidence count as empty", () => {
  assert.equal(normaliseEvidence(undefined).empty, true);
  assert.equal(normaliseEvidence(EMPTY_EVIDENCE).empty, true);
  const onlyPlaceholder = { ...EMPTY_EVIDENCE, insights: [{ key: "learn.insight.not_enough", params: {}, text: "Not enough answers yet." }] };
  assert.equal(normaliseEvidence(onlyPlaceholder).empty, true);
  assert.equal(isPlaceholder(onlyPlaceholder.insights[0]), true);
});

test("the sample is complete and accuracies become fractions", () => {
  const ev = normaliseEvidence(SAMPLE_EVIDENCE, "en");
  assert.equal(ev.empty, false);
  assert.deepEqual(Object.values(ev.has).every(Boolean), true);
  assert.deepEqual(ev.subjects.map((s) => s.key), ["english", "maths", "science"]);
  assert.equal(normaliseEvidence({ current: { maths: { level: 2, accuracy: 82, n: 30 } } }).subjects[0].current.accuracy, 0.82);
  assert.equal(ev.byStage.length, 6);
  assert.equal(ev.byStage[5].accuracy, null, "no answers -> no share, never 0 %");
});

test("partial evidence: only what is there", () => {
  const ev = normaliseEvidence({ baseline: { maths: { level: 2, accuracy: 0.6, n: 7, source: "first_attempts" } } });
  assert.equal(ev.has.subjects, true);
  assert.equal(ev.subjects[0].current, null);
  assert.equal(ev.has.retention, false);
  assert.equal(ev.has.independence, false);
  assert.equal(ev.activity, null);
});

test("stage line never falls and weeks sort across formats", () => {
  const ev = normaliseEvidence({ stageReached: [
    { week: "2026-11-09", subject: "maths", stage: 3 }, { week: "2026-11-02", subject: "maths", stage: 1 }, { week: "2026-11-16", subject: "maths", stage: 2 },
  ] }, "en");
  assert.deepEqual(ev.stages.rows.map((r) => r.maths), [1, 3, 3]);
  assert.deepEqual(ev.stages.rows.map((r) => r.mathsWeek), [1, 3, 2]);
  assert.equal(weekKey("2026-W47"), "2026-11-16");
  assert.equal(weekKey("2026-11-16T00:00:00.000Z"), "2026-11-16");
});

test("weeks with nothing in them are left out; counts stay counts", () => {
  const ev = normaliseEvidence({ independence: [{ week: "2026-11-09", independent: 0, assisted: 0 }, { week: "2026-11-16", independent: 4, assisted: 1 }],
    retention: { reviews: 3, correct: 2, rate: 0.67, byWeek: [{ week: "2026-11-09", reviews: 0, correct: 0 }, { week: "2026-11-16", reviews: 3, correct: 2 }] } });
  assert.equal(ev.independence.length, 1);
  assert.deepEqual([ev.retention.weeks.length, ev.retention.weeks[0].again], [1, 1]);
});

test("insights: variety first, placeholders dropped", () => {
  const picked = pickInsights(SAMPLE_EVIDENCE.insights, 4).map((m) => m.key.split(".").pop());
  assert.deepEqual(picked, ["independence_week", "baseline_now", "level_now", "stage_reached"]);
  assert.equal(pickInsights([{ key: "learn.insight.not_enough", text: "x" }]).length, 0);
});

test("server sentences: English default with readable weeks, params localised", () => {
  const ind = SAMPLE_EVIDENCE.insights.find((m) => m.key.endsWith("independence_week"));
  const text = say(t, ind, "learn.insight", "en");
  assert.match(text, /^In the week of 16 Nov|^In the week of Nov 16/);
  assert.ok(!text.includes("2026-11-16"));
  const p = localParams(t, { subject: "maths", subjectName: "Maths", skill: "maths.place-value", skillName: "Place value", stage: 4, stageName: "reasoning", strategy: "visual" }, "en");
  assert.equal(p.subjectName, "Maths", "subject default from levels.js; the locale file says Mathematics");
  assert.equal(p.skillName, "Place value");
  assert.equal(p.stageName, "Reasoning");
  assert.equal(p.strategyName, "pictures");
  assert.equal(say(t, { key: "level_up", text: "Moved up." }, "learn.decision"), "Moved up.");
  assert.equal(say(t, "plain"), "plain");
  assert.equal(say(t, null), "");
});
