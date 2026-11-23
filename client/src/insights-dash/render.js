// Turns the server's insight keys + numbers (services/learnerInsights.js) into words. Pure: the
// caller passes `t` and two formatters, so this runs in node tests too.
//   const r = renderer({ t, day: (iso) => "18 Nov", list: (arr) => "a, b and c", audience: "parent" })
//   r.finding(f) -> { kind, kindLabel, tone, title, evidence: [string], next: string|null, note: string|null }
import { tx } from "./strings.js";

const SUBJECTS = { english: "English", maths: "Maths", science: "Science" };

export function renderer({ t, day = (x) => x, list = (a) => a.join(", "), audience = "parent", subject = (k) => SUBJECTS[k] || k }) {
  const strategy = (s) => tx(t, `strategy.${s}`);
  // Dates and lists in params are formatted here; everything else is passed through.
  const prep = (p = {}) => {
    const o = { ...p };
    for (const k of ["date", "last"]) if (o[k]) o[k] = day(o[k]);
    if (Array.isArray(o.skills)) o.skills = list(o.skills);
    if (o.strategy) o.strategy = strategy(o.strategy);
    if (o.subject) o.subject = subject(o.subject);
    return o;
  };

  function evidence(e) {
    const p = prep(e.params);
    if (e.key === "reviewsWhat") p.range = `${day(e.params.from)} – ${day(e.params.to)}`;
    if (e.key === "rightOf") p.count = e.params.attempts;
    if (e.key === "rightOfRecent") p.count = e.params.misses;
    if (e.key === "activeDays") p.count = e.params.answered;
    return tx(t, `evidence.${e.key}`, p);
  }

  function finding(f) {
    const p = prep(f.params);
    if (f.key === "remembered" || f.key === "slipping") p.count = f.params.n;
    if (f.key === "quiet") p.count = f.params.days;
    if (f.key === "habit" || f.key === "someDays") p.count = f.params.days;
    const kind = f.kind;
    const next = f.next ? tx(t, f.next.key, prep(f.next.params)) : null;
    return {
      id: f.id, kind, tone: f.tone || null,
      kindLabel: tx(t, `kind.${kind}`),
      toneLabel: f.tone ? tx(t, `tone.${f.tone}`) : null,
      title: tx(t, `finding.${f.key}`, p),
      evidence: (f.evidence || []).map(evidence),
      next, note: f.next?.note || null,
      nextLabel: tx(t, audience === "teacher" ? "next.class" : "next.home"),
      skill: f.skill || null,
    };
  }

  function headline(h) {
    if (!h) return "";
    const p = h.params || {};
    if (h.key === "quiet") return tx(t, "headline.quiet", { count: p.days });
    const parts = [tx(t, "headline.active", { ...p, count: p.days })];
    if (p.mastered) parts.push(tx(t, "headline.activeMastered", { count: p.mastered }));
    if (p.practise) parts.push(tx(t, "headline.activePractise", { count: p.practise }));
    return parts.join(" ");
  }

  function groupHeadline(h) {
    const p = h?.params || {};
    const parts = [tx(t, "group.headline", { ...p, count: p.of })];
    if (p.checkIns) parts.push(tx(t, "group.headlineCheck", { count: p.checkIns }));
    if (p.hard) parts.push(tx(t, "group.headlineHard", { count: p.hard }));
    return parts.join(" ");
  }

  function reason(r) {
    const p = prep(r.params);
    if (r.key === "quiet") {
      const base = tx(t, "group.reason.quiet", { count: r.params.days });
      return r.params.last ? `${base} (${tx(t, "group.reason.quietLast", { date: day(r.params.last) })})` : base;
    }
    if (r.key === "stuck") {
      const bits = [tx(t, "group.reason.stuck", p)];
      if (r.params.mixup) bits.push(tx(t, "group.reason.stuckMixup", { mixup: r.params.mixup, count: r.params.times }));
      if (r.params.strategy && r.params.strategy !== "words") bits.push(tx(t, "group.reason.stuckStrategy", { strategy: strategy(r.params.strategy) }));
      return bits.join("; ");
    }
    return tx(t, `group.reason.${r.key}`, p);
  }
  const action = (r) => tx(t, `group.action.${r.key}`);

  return { finding, evidence, headline, groupHeadline, reason, action, strategy };
}

// A share comparison (server compareShare) -> { value, status, statusLabel } for a measure tile.
export function shareMeasure(t, c, need = 20) {
  if (!c) return { value: null, status: "early", statusLabel: tx(t, "measure.early") };
  if (c.status === "early") {
    return { value: c.cur, prev: c.prev, status: "early", statusLabel: tx(t, "measure.early"), why: tx(t, "measure.earlyWhy", { count: c.curN || 0, cur: c.curN || 0, prev: c.prevN || 0, need }) };
  }
  return { value: c.cur, prev: c.prev, status: c.status, statusLabel: tx(t, `measure.${c.status}`) };
}

// Count comparison: more / fewer / same (no judgement either way).
export function countStatus(cur, prev) {
  if (prev == null) return null;
  return cur > prev ? "more" : cur < prev ? "fewer" : "same";
}

// One metric of the weekly trend -> points (null = left out) and a one-line summary.
export function trendSeries(weeks = [], metric) {
  // Weeks before the first one with any learning are "not yet", not zero.
  const start = weeks.findIndex((w) => (w.activeDays || 0) > 0 || (w.answered || 0) > 0);
  const pts = weeks.map((w, i) => ({ week: w.week, partial: !!w.partial, value: start < 0 || i < start ? null : metric === "days" ? w.activeDays : metric === "remembered" ? w.rememberedPct : w[metric] }));
  const full = pts.filter((p) => p.value != null && !p.partial);
  return { points: pts, first: full[0] || null, last: full[full.length - 1] || null, count: full.length };
}
