// Report data (FND-060): everything a printable learner / group / school
// report needs, assembled from the shared analytics (analytics/queries.js and
// insights.js), never recomputed here. The client renders it with ReportView.
const q = require('../analytics/queries')
const { buildInsights, buildStory } = require('../analytics/insights')
const { entitlementsFor } = require('../utils/entitlements')

// Branding: the school's logo and name when its plan has `reports.branded`.
async function brandFor(orgId) {
  if (!orgId) return null
  try {
    const ent = await entitlementsFor({ role: 'admin', orgId: String(orgId) })
    const Org = require('../models/admin/Organization')
    const SAOrg = require('../models/superadmin/Organization')
    const [org, sa] = await Promise.all([Org.findById(orgId).select('name logoUrl').lean(), SAOrg.findOne({ adminOrgId: String(orgId) }).select('logoUrl').lean()])
    if (!org) return null
    const branded = ent.modules.includes('reports.branded')
    return { name: org.name, logoUrl: branded ? (org.logoUrl || sa?.logoUrl || '') : '', branded }
  } catch { return null }
}

const rangeLabel = (range) => (range.days === 1 ? 'today' : range.days === 7 ? 'in the last 7 days' : `from ${range.from} to ${range.to}`)

// scope: { emails, who, names, tz, orgId? } (from utils/scopes.js); kind: 'learner' | 'group' | 'org'
async function buildReport(scope, kind, query = {}) {
  const tz = query.tz || scope.tz || 'UTC'
  const o = await q.overview(scope.emails, { from: query.from, to: query.to, cmp: query.cmp || 'prev', tz })
  const single = kind === 'learner' && scope.emails.length === 1
  const [streak, learnerRows] = await Promise.all([
    single ? q.streak(scope.emails[0], tz) : null,
    kind === 'learner' ? null : q.perLearner(scope.emails, { from: o.range.from, to: o.range.to, tz }),
  ])
  const series = q.series(o.days, o.range)
  const matrix = q.matrix(o.days)
  const patterns = q.patterns(o.days)
  const who = scope.who || (single ? 'They' : 'The group')
  const names = scope.names || {}
  const learners = learnerRows ? learnerRows.rows.map((r) => ({
    name: names[r.email] || r.email.split('@')[0], minutes: Math.round(r.minutes), answered: r.answered, accuracy: r.accuracy,
    activeDays: r.activeDays, consistency: r.consistency, engagement: r.engagement, lastActive: r.lastActive, atRisk: r.atRisk, riskReason: r.riskReason,
  })).sort((a, b) => Number(b.atRisk) - Number(a.atRisk) || a.name.localeCompare(b.name)) : null
  return {
    kind, who, range: o.range, generatedAt: new Date().toISOString(),
    brand: await brandFor(scope.orgId),
    story: buildStory({ cur: o.cur, prev: o.prev, who, rangeLabel: rangeLabel(o.range) }),
    insights: buildInsights({ cur: o.cur, prev: o.prev, matrix, patterns, streak, who, rangeDays: o.range.days }),
    totals: o.cur, previous: o.prev, deltas: o.deltas, streak,
    series, matrix, patterns: { bestHour: patterns.bestHour, weekdayAvgMinutes: patterns.weekdayAvgMinutes, weekendAvgMinutes: patterns.weekendAvgMinutes, heat: patterns.heat },
    learners,
    summary: learners ? { learners: learners.length, active: learners.filter((l) => l.activeDays > 0).length, atRisk: learners.filter((l) => l.atRisk).length } : null,
  }
}

module.exports = { buildReport, brandFor }
