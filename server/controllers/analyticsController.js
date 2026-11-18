// Shared analytics handlers (FND-041/043/044). A role's route first decides WHO
// may be looked at and sets `req.analyticsScope = { emails: [...], who, tz }`
// (a verified child, a teacher's group, a school unit...), then mounts one of
// these. Every role therefore gets identical numbers from identical code.
const q = require('../analytics/queries')
const { buildInsights, buildStory } = require('../analytics/insights')
const { METRICS } = require('../utils/metrics')

const wrap = (fn) => async (req, res) => {
  try {
    const scope = req.analyticsScope
    if (!scope || !Array.isArray(scope.emails)) return res.status(500).json({ success: false, message: 'Analytics scope missing' })
    res.json({ success: true, ...(await fn(req, scope)) })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    console.error('analytics error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const query = (req, scope) => ({ ...req.query, tz: req.query.tz || scope.tz || 'UTC' })

// Story + tiles + deltas + series + insights for the chosen range.
const overview = wrap(async (req, scope) => {
  const o = await q.overview(scope.emails, query(req, scope))
  const single = scope.emails.length === 1
  const [streak, series, matrix, patterns] = await Promise.all([
    single ? q.streak(scope.emails[0], scope.tz) : null,
    q.series(o.days, o.range),
    q.matrix(o.days),
    q.patterns(o.days),
  ])
  const who = scope.who || (single ? 'They' : 'The group')
  return {
    range: o.range, totals: o.cur, previous: o.prev, deltas: o.deltas, streak, series, matrix, patterns,
    story: buildStory({ cur: o.cur, prev: o.prev, who, rangeLabel: o.range.days === 1 ? 'today' : `in the last ${o.range.days} days` }),
    insights: buildInsights({ cur: o.cur, prev: o.prev, matrix, patterns, streak, who, rangeDays: o.range.days }),
  }
})

const calendar = wrap(async (req, scope) => {
  const year = Number(req.query.year) || new Date().getFullYear()
  return { year, days: await q.calendar(scope.emails, year) }
})

const matrix = wrap(async (req, scope) => {
  const range = q.parseRange({ ...query(req, scope), cmp: 'none' })
  return { range, matrix: q.matrix(await q.fetchDays(scope.emails, range.from, range.to)) }
})

const patterns = wrap(async (req, scope) => {
  const range = q.parseRange({ ...query(req, scope), cmp: 'none' })
  return { range, ...q.patterns(await q.fetchDays(scope.emails, range.from, range.to)) }
})

// One row per learner (groups, units, schools), at-risk first.
const learners = wrap(async (req, scope) => {
  const { range, rows } = await q.perLearner(scope.emails, query(req, scope))
  const names = scope.names || {}
  const out = rows.map((r) => ({ ...r, name: names[r.email] || r.email.split('@')[0] }))
    .sort((a, b) => Number(b.atRisk) - Number(a.atRisk) || (b.minutes - a.minutes))
  return { range, learners: out, atRisk: out.filter((r) => r.atRisk).length }
})

// Raw usage log, single learner only.
const timeline = wrap(async (req, scope) => {
  if (scope.emails.length !== 1) return { events: [] }
  const events = await q.timeline(scope.emails[0], { from: req.query.from, to: req.query.to, limit: req.query.limit })
  return { events }
})

const metricsDictionary = (req, res) => res.json({ success: true, metrics: METRICS })

module.exports = { overview, calendar, matrix, patterns, learners, timeline, metricsDictionary }
