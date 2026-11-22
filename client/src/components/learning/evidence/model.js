// Pure helpers for the evidence panel. They turn the engine's `evidence`
// (GET /api/parent/children/:id/learning and GET /api/teacher/students/:id/learning,
// shape in JOURNEY-CONTRACT §2 "Parent / teacher") into what the panel draws.
// Every part may be missing or partial: nothing here throws, missing numbers
// stay null (shown as "—"), never 0 %.
import { SUBJECTS, MODULES, asFraction, subjectName, moduleName, skillName, weekLabel } from "../levels.js";

export const STAGES = [0, 1, 2, 3, 4, 5];
// Fewer graded answers than this and we say the numbers can still move a lot.
export const SMALL_N = 10;
// Fewer answers or reviews than this in a week and we show counts, not a share.
export const SMALL_WEEK = 5;
// Charts show at most this many recent weeks.
export const MAX_WEEKS = 12;

// The kind of thinking a question asks for (contract §1 `stage`): the contract's names (same as the
// landing page), a short axis label and one plain sentence.
const STAGE_TEXT = [
  { name: "Everyday curiosity", short: "Everyday", text: "Questions about everyday life, like rain, sharing or telling the time." },
  { name: "Recognition", short: "Recognise", text: "Spots and remembers the idea." },
  { name: "Understanding", short: "Understand", text: "Says what it means, in their own way." },
  { name: "Application", short: "Apply", text: "Uses it to solve a problem." },
  { name: "Reasoning", short: "Reason", text: "Compares, checks and explains why." },
  { name: "Transfer", short: "Transfer", text: "Uses the idea in a new situation." },
];
const stageOf = (n) => STAGE_TEXT[Math.max(0, Math.min(5, Math.round(Number(n) || 0)))];
export const stageName = (t, n) => t(`evidence.stage.${Math.round(Number(n) || 0)}.name`, stageOf(n).name);
export const stageShort = (t, n) => t(`evidence.stage.${Math.round(Number(n) || 0)}.short`, stageOf(n).short);
export const stageText = (t, n) => t(`evidence.stage.${Math.round(Number(n) || 0)}.text`, stageOf(n).text);

const num = (v) => (v != null && Number.isFinite(Number(v)) ? Number(v) : null);
const count = (v) => Math.max(0, Math.round(num(v) || 0));
const SUBJECT_KEYS = SUBJECTS;

/** A week ("2026-11-16", an ISO datetime, or "2026-W47") -> the local ISO date of its Monday, for sorting. */
export function weekKey(week) {
  const s = String(week ?? "");
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = /^(\d{4})-W(\d{1,2})$/.exec(s);
  if (!m) return s;
  const jan4 = new Date(Date.UTC(Number(m[1]), 0, 4));
  const monday = new Date(jan4.getTime() - ((jan4.getUTCDay() + 6) % 7) * 86400000 + (Number(m[2]) - 1) * 7 * 86400000);
  return monday.toISOString().slice(0, 10);
}

const STRATEGY = { words: "words", visual: "pictures", guided: "step by step", simpler: "an easier one first", reassess: "a rest" };
const WEEKISH = /^\d{4}-(W\d{1,2}|\d{2}-\d{2})$/;

/**
 * Server params -> params for t(): subjects, skills, stages, strategies and weeks named in
 * the page's language (the engine sends English names next to the ids:
 * subjectName, skillName, stageName, strategyName).
 */
export function localParams(t, params, lang) {
  const out = { ...(params && typeof params === "object" ? params : {}) };
  if (SUBJECT_KEYS.includes(out.subject)) { out.subjectName = subjectName(t, out.subject); out.subject = out.subjectName; }
  if (typeof out.skill === "string" && out.skill) out.skillName = skillName(t, { id: out.skill, name: out.skillName });
  if (MODULES.includes(out.module)) out.module = moduleName(t, out.module);
  if (Number.isInteger(out.stage) && out.stage >= 0 && out.stage <= 5) out.stageName = stageName(t, out.stage);
  if (STRATEGY[out.strategy]) out.strategyName = t(`evidence.strategy.${out.strategy}`, STRATEGY[out.strategy]);
  for (const [k, v] of Object.entries(out)) {
    if (v && typeof v === "object") out[k] = skillName(t, v);
    else if (typeof v === "string" && WEEKISH.test(v)) out[k] = weekLabel(v, lang);
  }
  return out;
}

/**
 * A server sentence { key, params, text } in the page's language:
 * t(key, { defaultValue: text, ...params }). Bare keys get the namespace `ns`
 * (e.g. "learn.insight"); a plain string passes through. Until a key is
 * translated, the server's English shows, with raw week dates made readable.
 */
export function say(t, m, ns, lang) {
  if (!m) return "";
  if (typeof m === "string") return m;
  let text = typeof m.text === "string" ? m.text : "";
  const raw = m.params && typeof m.params === "object" ? m.params : {};
  for (const v of Object.values(raw)) if (typeof v === "string" && WEEKISH.test(v)) text = text.split(v).join(weekLabel(v, lang));
  if (!m.key) return text;
  const key = /^(learn|evidence|journey|parent)\./.test(m.key) || !ns ? m.key : `${ns}.${m.key}`;
  return t(key, { ...localParams(t, raw, lang), defaultValue: text });
}

/** The engine's "not enough answers yet" placeholder is not evidence. */
export const isPlaceholder = (m) => /(^|\.)not_enough$/.test(String(m?.key || ""));

// Which kinds of insight a parent reads first (learn.insight.<code>); unknown codes come after.
const INSIGHT_ORDER = ["independence_week", "independence_first", "baseline_now", "level_now", "stage_reached", "retention", "misconceptions_resolved", "mastered", "discoveries"];
const codeOf = (m) => String(m?.key || "").split(".").pop();

/**
 * Up to `max` insight sentences with variety: one of each kind first (in INSIGHT_ORDER),
 * then a second of each, and so on, so three subjects' baselines never crowd out
 * independence or reviews. Placeholders are dropped.
 */
export function pickInsights(list, max = 5) {
  const real = (Array.isArray(list) ? list : []).filter((x) => x && (x.text || x.key) && !isPlaceholder(x));
  const groups = new Map();
  for (const m of real) { const c = codeOf(m); if (!groups.has(c)) groups.set(c, []); groups.get(c).push(m); }
  const codes = [...groups.keys()].sort((a, b) => ((INSIGHT_ORDER.indexOf(a) + 1) || 99) - ((INSIGHT_ORDER.indexOf(b) + 1) || 99));
  const out = [];
  for (let round = 0; out.length < Math.min(max, real.length); round += 1) {
    for (const c of codes) { const m = groups.get(c)[round]; if (m && out.length < max) out.push(m); }
  }
  return out;
}

const part = (x) => {
  if (!x || typeof x !== "object") return null;
  const level = num(x.level);
  const accuracy = asFraction(x.accuracy);
  const n = count(x.n);
  if (level == null && accuracy == null && !n) return null;
  return { level, accuracy, n, at: x.at || null, source: x.source || null };
};

function stageRow(bs, stage) {
  let x = null;
  if (Array.isArray(bs)) x = bs.find((y) => y && Number(y.stage) === stage) || bs[stage] || null;
  else if (bs && typeof bs === "object") x = bs[stage] ?? bs[String(stage)] ?? null;
  const attempts = count(x?.attempts);
  const correct = Math.min(count(x?.correct), attempts);
  const independent = Math.min(count(x?.independent), attempts);
  return { stage, attempts, correct, independent, accuracy: attempts ? correct / attempts : null };
}

const byWeek = (list) => (Array.isArray(list) ? list : [])
  .filter((w) => w && w.week != null)
  .map((w) => ({ ...w, key: weekKey(w.week) }))
  .sort((a, b) => a.key.localeCompare(b.key));

/** Highest stage reached so far per subject, week by week (a line that never falls), plus that week's own value. */
function stageWeeks(list, lang) {
  const rows = byWeek(list);
  const subjects = [...new Set(rows.map((r) => r.subject).filter(Boolean))]
    .sort((a, b) => (SUBJECT_KEYS.indexOf(a) + 1 || 99) - (SUBJECT_KEYS.indexOf(b) + 1 || 99));
  const weeks = [...new Set(rows.map((r) => r.key))].sort();
  const best = {};
  const out = weeks.map((key) => {
    const row = { key, x: weekLabel(key, lang) };
    for (const s of subjects) {
      const here = rows.filter((r) => r.key === key && r.subject === s).map((r) => num(r.stage)).filter((v) => v != null);
      const week = here.length ? Math.max(...here) : null;
      if (week != null) best[s] = Math.max(best[s] ?? 0, week);
      row[s] = best[s] ?? null;
      row[`${s}Week`] = week;
    }
    return row;
  });
  return { rows: out.slice(-MAX_WEEKS), subjects, best };
}

/** Everything the panel shows, from whatever the server sent. */
export function normaliseEvidence(ev, lang) {
  const e = ev && typeof ev === "object" ? ev : {};
  const base = e.baseline && typeof e.baseline === "object" ? e.baseline : {};
  const cur = e.current && typeof e.current === "object" ? e.current : {};
  const keys = [...new Set([...Object.keys(base), ...Object.keys(cur)])]
    .sort((a, b) => (SUBJECT_KEYS.indexOf(a) + 1 || 99) - (SUBJECT_KEYS.indexOf(b) + 1 || 99));
  const subjects = keys.map((key) => ({ key, baseline: part(base[key]), current: part(cur[key]) })).filter((x) => x.baseline || x.current);

  const byStage = STAGES.map((st) => stageRow(e.byStage, st));
  const stages = stageWeeks(e.stageReached, lang);

  const independence = byWeek(e.independence).slice(-MAX_WEEKS).map((w) => {
    const independent = count(w.independent);
    const assisted = count(w.assisted);
    return { key: w.key, x: weekLabel(w.key, lang), independent, assisted, total: independent + assisted };
  }).filter((w) => w.total > 0);

  const r = e.retention && typeof e.retention === "object" ? e.retention : {};
  const weeks = byWeek(r.byWeek).slice(-MAX_WEEKS).map((w) => {
    const reviews = count(w.reviews);
    const correct = Math.min(count(w.correct), reviews);
    return { key: w.key, x: weekLabel(w.key, lang), reviews, remembered: correct, again: reviews - correct };
  }).filter((w) => w.reviews > 0);
  const reviews = r.reviews != null ? count(r.reviews) : weeks.reduce((a, w) => a + w.reviews, 0);
  const remembered = r.correct != null ? Math.min(count(r.correct), reviews) : weeks.reduce((a, w) => a + w.remembered, 0);
  const retention = { reviews, remembered, rate: reviews ? (asFraction(r.rate) ?? remembered / reviews) : null, weeks };

  const m = e.misconceptions && typeof e.misconceptions === "object" ? e.misconceptions : {};
  const items = (Array.isArray(m.items) ? m.items : []).filter((x) => x && (x.skill || x.skillName || x.parentNote)).map((x) => ({
    skill: x.skill || null, skillName: x.skillName || "", subject: x.subject || null, count: num(x.count),
    parentNote: x.parentNote || "", resolvedAt: x.resolvedAt || null,
  })).sort((a, b) => Number(Boolean(a.resolvedAt)) - Number(Boolean(b.resolvedAt)));
  const misconceptions = {
    seen: m.seen != null ? count(m.seen) : items.length,
    resolved: m.resolved != null ? count(m.resolved) : items.filter((x) => x.resolvedAt).length,
    items,
  };

  const a = e.activity && typeof e.activity === "object" ? e.activity : null;
  const activity = a ? { rounds: num(a.rounds), days: num(a.days), discoveries: num(a.discoveries), explored: num(a.explored) } : null;

  const insights = (Array.isArray(e.insights) ? e.insights : []).filter((x) => x && (x.text || x.key));
  const realInsights = insights.filter((x) => !isPlaceholder(x));
  const decisions = (Array.isArray(e.decisions) ? e.decisions : []).filter((x) => x && (x.reason || x.type))
    .sort((x, y) => String(y.at || "").localeCompare(String(x.at || "")));

  const has = {
    subjects: subjects.length > 0,
    stages: stages.rows.length > 0,
    byStage: byStage.some((x) => x.attempts > 0),
    independence: independence.length > 0,
    retention: reviews > 0,
    misconceptions: misconceptions.seen > 0 || items.length > 0,
    activity: Boolean(activity && Object.values(activity).some((v) => v > 0)),
    insights: realInsights.length > 0,
    decisions: decisions.length > 0,
  };
  return { subjects, byStage, stages, independence, retention, misconceptions, activity, insights, decisions, has, empty: !Object.values(has).some(Boolean) };
}

/** The latest week's share on their own, with its numbers: { independent, total, share, small }. */
export function latestIndependence(weeks) {
  const w = weeks[weeks.length - 1];
  if (!w) return null;
  return { ...w, share: w.total ? w.independent / w.total : null, small: w.total < SMALL_WEEK };
}
