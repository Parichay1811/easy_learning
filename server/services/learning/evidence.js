// Learning evidence for guardians and teachers (the `evidence` block of
// GET /api/parent/children/:childId/learning and /api/teacher/students/:id/learning). Pure.
//
// Everything is counted from what the engine stored: no time-on-app as success,
// no IQ-like score, no comparison with other children. Every insight sentence
// cites the numbers it is built from in `params`.
//   baseline      placement result, else the first evidence.baselineAttempts graded answers (stored once)
//   current       the level now and the share right over the last targetBand.window graded answers
//   byStage       attempts / right / right alone per stage 0..5
//   stageReached  per week and subject, the highest stage answered right first try without a hint so far
//   independence  per week: right alone vs right with help
//   retention     reviews that were due and how many were remembered
//   misconceptions recurring mix-ups and which are resolved (two right in a row since)
//   activity      rounds finished, days practised, discoveries, skills explored, activities chosen (counts, not time)
const cfg = require('../../config/learning')
const { render } = require('./feedback')
const { normalise } = require('./levelPolicy')
const { bandOf } = require('./band')
const { isMastered } = require('./mastery')
const { noteKey } = require('./views')
const { decisionView, SUBJECT_NAMES, templateOf } = require('./decisions')

// learn.insight.<code>
const INSIGHTS = {
  // Countable insights have plural forms (_one / _other) chosen by params.count, like i18next.
  baseline_now_one: '{{subjectName}}: {{fromPct}}% right in the first {{fromN}} answers, {{toPct}}% right in the last answer.',
  baseline_now_other: '{{subjectName}}: {{fromPct}}% right in the first {{fromN}} answers, {{toPct}}% right in the last {{count}}.',
  level_now: '{{subjectName}}: started at level {{from}}, now at level {{to}}.',
  stage_reached: '{{subjectName}}: the highest stage answered right without help is stage {{stage}} ({{stageName}}).',
  independence_week_one: 'In the week of {{week}}, {{independent}} of {{count}} right answer came without any help (the week before: {{prevIndependent}} of {{prevTotal}}).',
  independence_week_other: 'In the week of {{week}}, {{independent}} of {{count}} right answers came without any help (the week before: {{prevIndependent}} of {{prevTotal}}).',
  independence_first_one: 'In the week of {{week}}, {{independent}} of {{count}} right answer came without any help.',
  independence_first_other: 'In the week of {{week}}, {{independent}} of {{count}} right answers came without any help.',
  retention_one: '1 of {{reviews}} reviews was remembered ({{pct}}%).',
  retention_other: '{{count}} of {{reviews}} reviews were remembered ({{pct}}%).',
  misconceptions_resolved_one: '1 mix-up is now cleared up (of {{seen}} noticed so far).',
  misconceptions_resolved_other: '{{count}} mix-ups are now cleared up (of {{seen}} noticed so far).',
  mastered_one: '1 skill mastered: right on different questions and remembered on a later day.',
  mastered_other: '{{count}} skills mastered, each right on different questions and remembered on a later day.',
  discoveries_one: '1 everyday discovery question answered.',
  discoveries_other: '{{count}} everyday discovery questions answered.',
  not_enough: 'Not enough answers yet for insights. They appear after a few rounds.',
}

const pct = (x) => Math.round(x * 100)
const insight = (code, params) => ({ key: `learn.insight.${code}`, params, text: render(templateOf(INSIGHTS, code, params), params) })

/**
 * in: { profile, skills (rows), catalog, notes (Map from store.questionNotes), decisions (raw docs, newest first),
 *       historyBaselines: { [subject]: baseline } (for learners from before baselines were stored),
 *       activity: { rounds, days }, now }
 */
function evidenceView({ profile = {}, skills = [], catalog = null, notes = new Map(), decisions = [], historyBaselines = {}, activity = {}, now = new Date() }) {
  const rows = skills.filter((r) => (r.attempts || 0) > 0)

  // Baseline and now, per subject (only subjects with answers).
  const baseline = {}
  const current = {}
  for (const s of cfg.SUBJECTS) {
    const b = profile.baseline?.[s] || historyBaselines[s]
    if (b) baseline[s] = { level: b.level ?? null, accuracy: b.accuracy ?? null, n: b.n || 0, at: b.at || null, source: b.source || 'first_attempts' }
    const band = bandOf(profile.band?.[s]?.recent)
    if (band.n || b || rows.some((r) => r.subject === s)) current[s] = { level: normalise(profile.levels?.[s]).level, accuracy: band.recent, n: band.n }
  }

  // By stage (all skills).
  const byStage = {}
  for (let st = 0; st <= 5; st++) byStage[st] = { attempts: 0, correct: 0, independent: 0 }
  for (const r of rows) for (const b of r.byStage || []) {
    if (!byStage[b.s]) continue
    byStage[b.s].attempts += b.n || 0
    byStage[b.s].correct += b.c || 0
    byStage[b.s].independent += b.i || 0
  }

  // Weekly series from the journal (last evidence.weeks weeks).
  const journal = [...(profile.journal || [])].sort((a, b) => (a.w < b.w ? -1 : a.w > b.w ? 1 : 0))
  const weeks = [...new Set(journal.map((j) => j.w))].slice(-cfg.evidence.weeks)
  const stageReached = []
  const best = {}
  for (const j of journal) {
    if (j.top == null) continue
    best[j.s] = Math.max(best[j.s] ?? -1, j.top)
    if (weeks.includes(j.w)) stageReached.push({ week: j.w, subject: j.s, stage: best[j.s] })
  }
  const independence = weeks.map((w) => {
    const js = journal.filter((j) => j.w === w)
    return { week: w, independent: js.reduce((a, j) => a + (j.ind || 0), 0), assisted: js.reduce((a, j) => a + (j.ast || 0), 0) }
  })
  const g = profile.growth || {}
  const reviews = g.reviews || 0
  const reviewsRight = g.reviewsRight || 0
  const retention = {
    reviews, correct: reviewsRight, rate: reviews ? Math.round((reviewsRight / reviews) * 100) / 100 : null,
    byWeek: weeks.map((w) => {
      const js = journal.filter((j) => j.w === w)
      return { week: w, reviews: js.reduce((a, j) => a + (j.rv || 0), 0), correct: js.reduce((a, j) => a + (j.rvc || 0), 0) }
    }),
  }

  // Recurring mix-ups (the misconception text is for teachers in `difficulties`; here the parent note).
  const mItems = []
  for (const r of rows) for (const m of r.misconceptions || []) {
    if ((m.count || 0) < 1) continue
    const n = m.q && m.module ? notes.get(noteKey(r.subject, m.module, m.q)) : null
    mItems.push({ skill: r.skill, skillName: catalog?.name(r.skill, r.name) || r.name || r.skill, subject: r.subject, count: m.count, parentNote: n?.parentNote || null, resolvedAt: m.resolvedAt || null })
  }
  mItems.sort((a, b) => (a.resolvedAt ? 1 : 0) - (b.resolvedAt ? 1 : 0) || b.count - a.count)
  const misconceptions = { seen: mItems.length, resolved: mItems.filter((m) => m.resolvedAt).length, items: mItems.slice(0, 10) }

  const mastered = rows.filter(isMastered).length
  // explored: skills ever tried; chosen: activities the learner started by choice (a discovery, a mini
  // challenge, a round opened from "What next?", the welcome or the journey map).
  const activityOut = { rounds: activity.rounds || 0, days: activity.days || 0, discoveries: g.discoveries || 0, explored: rows.length, chosen: g.chosen || 0 }

  // Insights: every claim cites its numbers.
  const insights = []
  for (const s of cfg.SUBJECTS) {
    const b = baseline[s]
    const c = current[s]
    const subjectName = SUBJECT_NAMES[s]
    if (b && c && typeof b.accuracy === 'number' && typeof c.accuracy === 'number' && b.n >= cfg.evidence.minForInsight && c.n >= cfg.evidence.minForInsight) {
      insights.push(insight('baseline_now', { subject: s, subjectName, fromPct: pct(b.accuracy), fromN: b.n, toPct: pct(c.accuracy), toN: c.n, count: c.n }))
    }
    if (b && c && Number.isInteger(b.level) && Number.isInteger(c.level) && c.level > b.level) insights.push(insight('level_now', { subject: s, subjectName, from: b.level, to: c.level }))
    if (best[s] != null && best[s] >= 0) insights.push(insight('stage_reached', { subject: s, subjectName, stage: best[s], stageName: cfg.STAGES[best[s]] }))
  }
  const lastTwo = independence.filter((w) => w.independent + w.assisted > 0).slice(-2)
  if (lastTwo.length) {
    const [prev, cur] = lastTwo.length === 2 ? lastTwo : [null, lastTwo[0]]
    const total = cur.independent + cur.assisted
    if (total >= cfg.evidence.minForInsight) {
      insights.push(prev
        ? insight('independence_week', { week: cur.week, independent: cur.independent, total, count: total, prevIndependent: prev.independent, prevTotal: prev.independent + prev.assisted })
        : insight('independence_first', { week: cur.week, independent: cur.independent, total, count: total }))
    }
  }
  if (reviews >= 3) insights.push(insight('retention', { correct: reviewsRight, count: reviewsRight, reviews, pct: pct(reviewsRight / reviews) }))
  if (misconceptions.seen) insights.push(insight('misconceptions_resolved', { resolved: misconceptions.resolved, count: misconceptions.resolved, seen: misconceptions.seen }))
  if (mastered) insights.push(insight('mastered', { count: mastered }))
  if (g.discoveries) insights.push(insight('discoveries', { count: g.discoveries }))
  if (!insights.length) insights.push(insight('not_enough', {}))

  return {
    baseline, current, byStage, stageReached, independence, retention, misconceptions, activity: activityOut, insights,
    decisions: decisions.slice(0, cfg.evidence.decisions).map((d) => decisionView(d, catalog, new Map(skills.map((r) => [r.skill, r.name])))),
  }
}

module.exports = { INSIGHTS, evidenceView, templateOf }
