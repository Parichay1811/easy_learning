// Platform analytics for the super admin console (SUP-020..022). Everything is
// computed from rollups (LearnerDay, ActorDay), account counts and
// subscriptions, never from raw events, and cached for a few minutes because
// these are platform-wide. Shapes reuse the shared query layer
// (analytics/queries.js) so a "matrix" or "accuracy" means the same as on
// every other dashboard.
const q = require('../analytics/queries')
const { pct } = require('../utils/metrics')
const { cached } = require('../utils/ttlCache')

const TTL = 5 * 60_000
const utcToday = () => new Date().toISOString().slice(0, 10)
const lazy = (p) => require(p)
const M = {
  LearnerDay: () => lazy('../models/analytics/LearnerDay'),
  ActorDay: () => lazy('../models/superadmin/ActorDay'),
  Subscription: () => lazy('../models/superadmin/Subscription'),
}
const ACTIVE = { $or: [{ answered: { $gt: 0 } }, { minutes: { $gte: 3 } }] }
const weekOf = (iso) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10) }
const ROLES = ['admin', 'teacher', 'parent', 'student', 'superadmin']

// ── live counters for the console's top bar (< 2 s, cached 30 s) ─────────────
function live() {
  return cached('platform:live', 30_000, async () => {
    const LearnerDay = M.LearnerDay()
    const today = utcToday()
    const yesterday = q.addDays(today, -1)
    const SAOrg = lazy('../models/superadmin/Organization')
    const ContactMessage = lazy('../models/ContactMessage')
    const ChatMessage = lazy('../models/superadmin/ChatMessage')
    const ParentChatMessage = lazy('../models/ParentChatMessage')
    const DataRequest = lazy('../models/DataRequest')
    const now = Date.now()
    const [learnersNow, dau, pendingOrgs, openContacts, unreadAdmin, unreadParent, dataPending, dataOverdue, rev] = await Promise.all([
      LearnerDay.countDocuments({ date: { $gte: yesterday }, lastAt: { $gte: new Date(now - 15 * 60_000) } }),
      LearnerDay.countDocuments({ date: { $gte: yesterday }, lastAt: { $gte: new Date(now - 24 * 3600_000) } }),
      SAOrg.countDocuments({ status: 'pending' }),
      ContactMessage.countDocuments({ status: 'open' }),
      ChatMessage.countDocuments({ senderRole: 'admin', readBySuperadmin: false }),
      ParentChatMessage.countDocuments({ senderRole: 'parent', readBySuperadmin: false }),
      DataRequest.countDocuments({ status: { $in: ['pending', 'processing'] } }),
      DataRequest.countDocuments({ status: { $in: ['pending', 'processing'] }, dueAt: { $lt: new Date() } }),
      revenueTotals(),
    ])
    return { at: new Date().toISOString(), learnersNow, dau, pendingOrgs, openSupport: openContacts + unreadAdmin + unreadParent, dataPending, dataOverdue, mrrCents: rev.mrrCents, currency: rev.currency }
  })
}

// ── growth (SUP-020) ─────────────────────────────────────────────────────────
function growth({ days = 30 } = {}) {
  const span = Math.min(180, Math.max(7, Number(days) || 30))
  return cached(`platform:growth:${span}`, TTL, async () => {
    const LearnerDay = M.LearnerDay()
    const ActorDay = M.ActorDay()
    const today = utcToday()
    const from = q.addDays(today, -(span - 1))
    const [learnerDaily, actorDaily, wau, mau, actorWau, actorMau, tz, signups, funnel, cohorts] = await Promise.all([
      LearnerDay.aggregate([{ $match: { date: { $gte: from, $lte: today }, ...ACTIVE } }, { $group: { _id: '$date', learners: { $sum: 1 }, minutes: { $sum: '$minutes' }, answered: { $sum: '$answered' } } }]),
      ActorDay.aggregate([{ $match: { date: { $gte: from, $lte: today } } }, { $group: { _id: { date: '$date', role: '$role' }, n: { $sum: 1 } } }]),
      LearnerDay.distinct('email', { date: { $gte: q.addDays(today, -6) }, ...ACTIVE }).then((x) => x.length),
      LearnerDay.distinct('email', { date: { $gte: q.addDays(today, -29) }, ...ACTIVE }).then((x) => x.length),
      ActorDay.aggregate([{ $match: { date: { $gte: q.addDays(today, -6) } } }, { $group: { _id: { role: '$role', id: '$id' } } }, { $group: { _id: '$_id.role', n: { $sum: 1 } } }]),
      ActorDay.aggregate([{ $match: { date: { $gte: q.addDays(today, -29) } } }, { $group: { _id: { role: '$role', id: '$id' } } }, { $group: { _id: '$_id.role', n: { $sum: 1 } } }]),
      LearnerDay.aggregate([{ $match: { date: { $gte: from } } }, { $group: { _id: { tz: '$tz', email: '$email' } } }, { $group: { _id: '$_id.tz', learners: { $sum: 1 } } }, { $sort: { learners: -1 } }, { $limit: 40 }]),
      signupSeries(from, today),
      activationFunnel(),
      retentionCohorts(),
    ])
    const ld = new Map(learnerDaily.map((d) => [d._id, d]))
    const ad = new Map()
    for (const r of actorDaily) ad.set(`${r._id.date}|${r._id.role}`, r.n)
    const points = []
    for (let i = 0; i < span; i++) {
      const date = q.addDays(from, i)
      const l = ld.get(date)
      const p = { key: date, learners: l?.learners || 0, minutes: Math.round(l?.minutes || 0), answered: l?.answered || 0 }
      for (const r of ['admin', 'teacher', 'parent']) p[r] = ad.get(`${date}|${r}`) || 0
      points.push(p)
    }
    const roleMap = (arr) => Object.fromEntries(arr.map((x) => [x._id, x.n]))
    const aw = roleMap(actorWau), am = roleMap(actorMau)
    const dauToday = points[points.length - 1]
    const active = {
      learners: { dau: dauToday.learners, wau, mau },
      ...Object.fromEntries(['admin', 'teacher', 'parent'].map((r) => [r, { dau: dauToday[r], wau: aw[r] || 0, mau: am[r] || 0 }])),
    }
    const regions = {}
    for (const t of tz) { const region = String(t._id || 'Unknown').split('/')[0] || 'Unknown'; regions[region] = (regions[region] || 0) + t.learners }
    return {
      range: { from, to: today, days: span }, series: points, active,
      stickiness: mau ? pct(wau, mau) : null,
      timezones: tz.map((t) => ({ tz: t._id || 'Unknown', learners: t.learners })),
      regions: Object.entries(regions).map(([region, learners]) => ({ region, learners })).sort((a, b) => b.learners - a.learners),
      signups, funnel, cohorts,
      notes: { roles: 'Learners from learning rollups; other roles from daily sign-in activity (recorded from the day this console shipped).' },
    }
  })
}

async function signupSeries(from, to) {
  const ParentAccount = lazy('../models/ParentAccount')
  const OrgAdmin = lazy('../models/admin/OrgAdmin')
  const Tutor = lazy('../models/admin/Tutor')
  const Student = lazy('../models/admin/Student')
  const User = lazy('../models/User')
  const Organization = lazy('../models/superadmin/Organization')
  const range = { createdAt: { $gte: new Date(`${from}T00:00:00Z`), $lte: new Date(`${to}T23:59:59Z`) } }
  const week = { $dateToString: { format: '%Y-%m-%d', date: { $dateTrunc: { date: '$createdAt', unit: 'week', startOfWeek: 'monday' } } } }
  const byWeek = (Model) => Model.aggregate([{ $match: range }, { $group: { _id: week, n: { $sum: 1 } } }])
  const [parent, admin, teacher, student, selfStudent, orgs] = await Promise.all([byWeek(ParentAccount), byWeek(OrgAdmin), byWeek(Tutor), byWeek(Student), byWeek(User),
    Organization.aggregate([{ $match: range }, { $group: { _id: { country: '$country', kind: '$kind' }, n: { $sum: 1 } } }])])
  const weeks = new Map()
  const add = (rows, role) => { for (const r of rows) { const w = weeks.get(r._id) || { key: r._id, parent: 0, admin: 0, teacher: 0, student: 0 }; w[role] += r.n; weeks.set(r._id, w) } }
  add(parent, 'parent'); add(admin, 'admin'); add(teacher, 'teacher'); add(student, 'student'); add(selfStudent, 'student')
  const totals = { parent: 0, admin: 0, teacher: 0, student: 0 }
  for (const w of weeks.values()) for (const k of Object.keys(totals)) totals[k] += w[k]
  const byCountry = {}
  for (const o of orgs) { const c = o._id.country || 'Unknown'; byCountry[c] = (byCountry[c] || 0) + o.n }
  return { weekly: [...weeks.values()].sort((a, b) => (a.key < b.key ? -1 : 1)), totals, orgsByCountry: Object.entries(byCountry).map(([country, n]) => ({ country, orgs: n })).sort((a, b) => b.orgs - a.orgs) }
}

// Signup -> first lesson -> active on day 7+ -> linked parent -> paid, for
// learner accounts created in the last 90 days.
function activationFunnel({ days = 90 } = {}) {
  return cached(`platform:funnel:${days}`, TTL * 2, async () => {
    const LearnerDay = M.LearnerDay()
    const Student = lazy('../models/admin/Student')
    const User = lazy('../models/User')
    const Child = lazy('../models/Child')
    const ParentAccount = lazy('../models/ParentAccount')
    const since = new Date(Date.now() - days * 86400_000)
    const [students, users, children] = await Promise.all([
      Student.find({ createdAt: { $gte: since }, email: { $ne: '' } }).select('email orgId').lean(),
      User.find({ createdAt: { $gte: since } }).select('email').lean(),
      Child.find({ createdAt: { $gte: since } }).select('email parentId linkStatus').lean(),
    ])
    const signups = new Set([...students, ...users, ...children].map((x) => String(x.email || '').toLowerCase()).filter(Boolean))
    const list = [...signups]
    if (!list.length) return { cohortDays: days, steps: [{ key: 'signup', n: 0 }, { key: 'first_lesson', n: 0 }, { key: 'day7', n: 0 }, { key: 'linked_parent', n: 0 }, { key: 'paid', n: 0 }] }
    const spans = await LearnerDay.aggregate([{ $match: { email: { $in: list }, ...ACTIVE } }, { $group: { _id: '$email', first: { $min: '$date' }, last: { $max: '$date' } } }])
    const started = new Set(spans.map((s) => s._id))
    const day7 = new Set(spans.filter((s) => q.daysBetween(s.first, s.last) >= 7).map((s) => s._id))
    const allChildren = await Child.find({ email: { $in: list }, linkStatus: 'verified' }).select('email parentId').lean()
    const linked = new Set(allChildren.map((c) => c.email))
    const paidParents = new Set((await ParentAccount.find({ _id: { $in: allChildren.map((c) => c.parentId) }, plan: { $nin: ['free', '', null] } }).select('_id').lean()).map((p) => String(p._id)))
    const paidOrgs = new Set((await M.Subscription().find({ ownerType: 'org', status: 'active', priceCents: { $gt: 0 } }).select('ownerId').lean()).map((s) => s.ownerId))
    const orgOf = new Map(students.map((s) => [s.email, String(s.orgId)]))
    const paid = new Set(list.filter((e) => paidOrgs.has(orgOf.get(e)) || allChildren.some((c) => c.email === e && paidParents.has(String(c.parentId)))))
    const n = (s) => list.filter((e) => s.has(e)).length
    return { cohortDays: days, steps: [{ key: 'signup', n: list.length }, { key: 'first_lesson', n: n(started) }, { key: 'day7', n: n(day7) }, { key: 'linked_parent', n: n(linked) }, { key: 'paid', n: n(paid) }] }
  })
}

// Weekly cohorts by first active week (last 8 weeks): % of each cohort active in week 0..7.
function retentionCohorts({ weeks = 8 } = {}) {
  return cached(`platform:cohorts:${weeks}`, TTL * 2, async () => {
    const LearnerDay = M.LearnerDay()
    const today = utcToday()
    const start = weekOf(q.addDays(today, -7 * (weeks - 1)))
    // Learners whose first ever active day is in the window.
    const firsts = await LearnerDay.aggregate([
      { $match: ACTIVE },
      { $group: { _id: '$email', first: { $min: '$date' } } },
      { $match: { first: { $gte: start } } },
    ])
    if (!firsts.length) return { weeks, rows: [] }
    const firstOf = new Map(firsts.map((f) => [f._id, weekOf(f.first)]))
    const activity = await LearnerDay.aggregate([
      { $match: { email: { $in: [...firstOf.keys()] }, date: { $gte: start }, ...ACTIVE } },
      { $group: { _id: '$email', dates: { $addToSet: '$date' } } },
    ])
    const cohorts = new Map()
    for (const a of activity) {
      const c = firstOf.get(a._id)
      const row = cohorts.get(c) || { cohort: c, size: 0, active: Array(weeks).fill(0) }
      row.size++
      const seen = new Set(a.dates.map((d) => Math.floor(q.daysBetween(c, weekOf(d)) / 7)))
      for (const w of seen) if (w >= 0 && w < weeks) row.active[w]++
      cohorts.set(c, row)
    }
    const rows = [...cohorts.values()].sort((a, b) => (a.cohort < b.cohort ? -1 : 1)).map((r) => {
      const age = Math.floor(q.daysBetween(r.cohort, weekOf(today)) / 7)
      return { cohort: r.cohort, size: r.size, retention: r.active.map((n, w) => (w > age ? null : pct(n, r.size))) }
    })
    return { weeks, rows }
  })
}

// ── learning (SUP-021) ──────────────────────────────────────────────────────
function learning({ days = 30 } = {}) {
  const span = Math.min(180, Math.max(7, Number(days) || 30))
  return cached(`platform:learning:${span}`, TTL, async () => {
    const LearnerDay = M.LearnerDay()
    const today = utcToday()
    const from = q.addDays(today, -(span - 1))
    const match = { date: { $gte: from, $lte: today } }
    const sumMap = (field) => LearnerDay.aggregate([{ $match: match }, { $project: { kv: { $objectToArray: `$${field}` } } }, { $unwind: '$kv' }, { $group: { _id: '$kv.k', n: { $sum: '$kv.v' } } }, { $sort: { n: -1 } }])
    const [ms, totalsAgg, sources, devices, hours] = await Promise.all([
      LearnerDay.aggregate([{ $match: match }, { $project: { kv: { $objectToArray: '$byModuleSubject' } } }, { $unwind: '$kv' },
        { $group: { _id: '$kv.k', answered: { $sum: '$kv.v.answered' }, correct: { $sum: '$kv.v.correct' }, minutes: { $sum: '$kv.v.minutes' } } }]),
      LearnerDay.aggregate([{ $match: match }, { $group: { _id: null, minutes: { $sum: '$minutes' }, answered: { $sum: '$answered' }, correct: { $sum: '$correct' }, sessions: { $sum: '$sessions' }, learners: { $addToSet: '$email' } } },
        { $project: { minutes: 1, answered: 1, correct: 1, sessions: 1, learners: { $size: '$learners' } } }]),
      sumMap('sources'), sumMap('devices'), sumMap('byHour'),
    ])
    // One synthetic "day" so the shared matrix() shapes it exactly like every other dashboard.
    const byModuleSubject = Object.fromEntries(ms.map((r) => [r._id, { answered: r.answered, correct: r.correct, minutes: r.minutes }]))
    const matrix = q.matrix([{ byModuleSubject }])
    const cells = []
    for (const [subject, row] of Object.entries(matrix)) for (const [module, c] of Object.entries(row)) cells.push({ subject, module, ...c })
    cells.sort((a, b) => b.answered - a.answered)
    const t = totalsAgg[0] || { minutes: 0, answered: 0, correct: 0, sessions: 0, learners: 0 }
    const [ar, ai] = await Promise.all([arUsage(from), aiTeacher()])
    return {
      range: { from, to: today, days: span },
      totals: { learners: t.learners, minutes: Math.round(t.minutes), answered: t.answered, accuracy: pct(t.correct, t.answered), sessions: t.sessions },
      matrix, top: cells.slice(0, 4), least: cells.filter((c) => c.answered > 0).slice(-4).reverse(), unused: cells.filter((c) => !c.answered).map((c) => `${c.module}_${c.subject}`),
      sources: sources.map((s) => ({ source: s._id, events: s.n })),
      devices: devices.map((s) => ({ device: s._id, events: s.n })),
      hours: Array.from({ length: 24 }, (_, h) => ({ hour: h, events: hours.find((x) => x._id === String(h))?.n || 0 })),
      ar, ai,
      languages: null,
      accessibility: null,
      notes: { languages: 'Not logged yet: the site keeps the chosen language in the browser only.', accessibility: 'Not logged yet: read-aloud and dyslexia-font use are not recorded server-side.' },
    }
  })
}

async function arUsage(fromIso) {
  try {
    const ARSession = lazy('../models/ARSession')
    const rows = await ARSession.aggregate([{ $match: { startedAt: { $gte: new Date(`${fromIso}T00:00:00Z`) } } }, { $group: { _id: '$gameId', sessions: { $sum: 1 }, learners: { $addToSet: '$email' } } },
      { $project: { sessions: 1, learners: { $size: '$learners' } } }, { $sort: { sessions: -1 } }])
    return { games: rows.map((r) => ({ game: r._id, sessions: r.sessions, learners: r.learners })), sessions: rows.reduce((s, r) => s + r.sessions, 0) }
  } catch { return { games: [], sessions: 0 } }
}

// The AI Teacher's own admin numbers (its /admin endpoint, through the API proxy).
function aiTeacher() {
  return cached('platform:ai', 60_000, async () => {
    const data = await require('./aiTeacherAdmin').get('/admin')
    if (!data.ok) return { available: false, message: data.message }
    const recent = data.body.recent || []
    const topics = {}
    for (const r of recent) if (r.topic) topics[r.topic] = (topics[r.topic] || 0) + 1
    return {
      available: true, asks: recent.length, byTier: data.body.stats?.byTier || {}, packs: data.body.packs, tts: data.body.tts,
      topTopics: Object.entries(topics).map(([topic, n]) => ({ topic, n })).sort((a, b) => b.n - a.n).slice(0, 10),
      missingTopics: (data.body.todos || []).filter((t) => !t.done).slice(0, 10).map((t) => ({ text: t.text, count: t.count })),
    }
  })
}

// ── revenue (SUP-022) ───────────────────────────────────────────────────────
const monthly = (s) => (s.interval === 'year' ? Math.round((s.priceCents || 0) / 12) : s.priceCents || 0)
async function revenueTotals() {
  const subs = await M.Subscription().find({ status: { $in: ['active', 'past_due'] } }).select('priceCents interval currency').lean()
  return { mrrCents: subs.reduce((s, x) => s + monthly(x), 0), currency: subs[0]?.currency || 'EUR' }
}

function revenue() {
  return cached('platform:revenue', TTL, async () => {
    const Subscription = M.Subscription()
    const ParentAccount = lazy('../models/ParentAccount')
    const subs = await Subscription.find().lean()
    const now = Date.now()
    const d30 = now - 30 * 86400_000
    const paying = subs.filter((s) => ['active', 'past_due'].includes(s.status))
    const mrrCents = paying.reduce((s, x) => s + monthly(x), 0)
    const mix = {}
    for (const s of subs) { const k = `${s.plan}`; mix[k] = mix[k] || { plan: s.plan, active: 0, trialing: 0, past_due: 0, paused: 0, cancelled: 0, mrrCents: 0 }; mix[k][s.status]++; if (['active', 'past_due'].includes(s.status)) mix[k].mrrCents += monthly(s) }
    const familyPlus = await ParentAccount.countDocuments({ plan: 'family_plus' })
    const hist = (s, action) => (s.history || []).filter((h) => h.action === action)
    const trialsStarted = subs.filter((s) => hist(s, 'trial.start').length || s.trialEndsAt).length
    const converted = subs.filter((s) => hist(s, 'trial.converted').length).length
    const churned = subs.filter((s) => s.status === 'cancelled' && s.cancelledAt && new Date(s.cancelledAt) >= new Date(d30))
    const reasons = {}
    for (const s of churned) { const r = s.cancelReason || 'No reason given'; reasons[r] = (reasons[r] || 0) + 1 }
    let seatGrowth = 0
    for (const s of subs) for (const h of hist(s, 'seats.change')) if (new Date(h.at) >= new Date(d30)) seatGrowth += (h.meta?.to || 0) - (h.meta?.from || 0)
    const invoices = subs.flatMap((s) => (s.invoices || []).map((i) => ({ ...i, ownerId: s.ownerId, saOrgId: s.saOrgId, plan: s.plan })))
    const open = invoices.filter((i) => i.status === 'open')
    const vat = {}
    for (const i of invoices.filter((x) => x.status === 'paid' && x.paidAt && new Date(x.paidAt) >= new Date(now - 365 * 86400_000))) {
      const c = i.country || 'Unknown'
      vat[c] = vat[c] || { country: c, invoicedCents: 0, vatCents: 0 }
      vat[c].invoicedCents += i.amountCents; vat[c].vatCents += i.vatCents || 0
    }
    return {
      currency: paying[0]?.currency || 'EUR',
      mrrCents, arrCents: mrrCents * 12,
      subscribers: paying.length, familyPlus,
      planMix: Object.values(mix).sort((a, b) => b.mrrCents - a.mrrCents),
      trials: { active: subs.filter((s) => s.status === 'trialing').length, endingIn7d: subs.filter((s) => s.status === 'trialing' && s.trialEndsAt && new Date(s.trialEndsAt) - now < 7 * 86400_000).length, started: trialsStarted, converted, conversion: trialsStarted ? pct(converted, trialsStarted) : null },
      churn: { last30d: churned.length, reasons: Object.entries(reasons).map(([reason, n]) => ({ reason, n })) },
      seatGrowth30d: seatGrowth,
      failedPayments: subs.filter((s) => s.status === 'past_due').length,
      invoices: { open: open.length, openCents: open.reduce((s, i) => s + i.amountCents, 0), overdue: open.filter((i) => i.dueAt && new Date(i.dueAt) < new Date()).length, list: open.sort((a, b) => new Date(a.dueAt || 0) - new Date(b.dueAt || 0)).slice(0, 20) },
      vatByCountry: Object.values(vat),
      stripe: !!process.env.STRIPE_SECRET_KEY,
      notes: { vat: 'VAT figures are what was recorded on invoices; with Stripe on, Stripe Tax computes them.' },
    }
  })
}

module.exports = { live, growth, learning, revenue, activationFunnel, retentionCohorts, aiTeacher, ROLES }
