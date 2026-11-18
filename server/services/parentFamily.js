// Family settings shared by every guardian of a learner (PAR-004, PAR-012,
// PAR-042, PAR-060): weekly goal and reward, healthy-use limits, grade and
// language. Each guardian has their own `Child` row; these settings are kept
// identical on all verified rows of the same learner. Notification preferences
// stay per guardian.
const Child = require('../models/Child')
const q = require('../analytics/queries')
const { childAccess } = require('../utils/guardianLink')

const CONSENT_VERSION = '2026-11'
const LEARNER_FIELDS = ['grade', 'language', 'weeklyGoal', 'healthyUse']

// The caller's own verified link, or { error }.
async function ownChild(parent, childId, { allowUnverified = false } = {}) {
  if (!/^[a-f0-9]{24}$/i.test(String(childId || ''))) return { error: { status: 404, message: 'Child not found' } }
  const child = await Child.findOne({ _id: childId, parentId: parent.id })
  if (!child) return { error: { status: 404, message: 'Child not found' } }
  if (allowUnverified) return { child }
  const access = childAccess(child)
  if (!access.ok) return { error: { status: access.status, message: access.message, code: access.code } }
  return { child }
}

// Express helper: req.child or an error answer.
const requireOwnChild = (opts) => async (req, res, next) => {
  try {
    const { child, error } = await ownChild(req.parent, req.params.id, opts)
    if (error) return res.status(error.status).json({ success: false, message: error.message, code: error.code })
    req.child = child
    req.actor = req.actor || { role: 'parent', id: String(req.parent.id), email: req.parent.email, name: req.parent.name }
    next()
  } catch (err) {
    console.error('ownChild error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const verifiedRows = (email) => Child.find({ email: String(email).toLowerCase(), linkStatus: 'verified' })

async function syncLearnerSettings(email, patch) {
  const $set = {}
  for (const k of LEARNER_FIELDS) if (patch[k] !== undefined) $set[k] = patch[k]
  if (!Object.keys($set).length) return
  await Child.updateMany({ email: String(email).toLowerCase(), linkStatus: 'verified' }, { $set })
}

const learnerSettingsFrom = (row) => Object.fromEntries(LEARNER_FIELDS.map((k) => [k, row?.[k] ?? undefined]).filter(([, v]) => v !== undefined))

// Monday..Sunday of the week containing `today` (local date).
function weekOf(today) {
  const dow = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7
  const from = q.addDays(today, -dow)
  return { from, to: q.addDays(from, 6) }
}

// Goal ring: which days this week met the daily minutes, from the same LearnerDay rollups.
async function goalProgress(email, goal, tz = 'UTC') {
  const today = q.todayIn(tz)
  const { from, to } = weekOf(today)
  const docs = await q.fetchDays([email], from, to)
  const by = Object.fromEntries(docs.map((d) => [d.date, d.minutes || 0]))
  const target = goal?.minutesPerDay || 20
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = q.addDays(from, i)
    const minutes = Math.round((by[date] || 0) * 10) / 10
    return { date, minutes, met: minutes >= target, future: date > today, today: date === today }
  })
  const daysMet = days.filter((d) => d.met).length
  const daysPerWeek = goal?.daysPerWeek || 5
  return { from, to, today, minutesPerDay: target, daysPerWeek, days, daysMet, reached: daysMet >= daysPerWeek, minutes: Math.round(days.reduce((s, d) => s + d.minutes, 0)) }
}

const toMin = (hhmm) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '')); return m ? Number(m[1]) * 60 + Number(m[2]) : null }

function localMinutesNow(tz = 'UTC', now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now)
  const get = (t) => Number(parts.find((p) => p.type === t)?.value || 0)
  return get('hour') * 60 + get('minute')
}

function inWindow(nowMin, startMin, endMin) {
  if (startMin == null || endMin == null || startMin === endMin) return false
  return startMin < endMin ? nowMin >= startMin && nowMin < endMin : nowMin >= startMin || nowMin < endMin
}

// When guardians disagree, the gentlest-for-the-child (strictest) rule wins.
function strictestHealthy(rows) {
  const out = { dailyLimitMin: 0, quietStart: '', quietEnd: '', breakEveryMin: 0 }
  for (const r of rows) {
    const h = r.healthyUse || {}
    if (h.dailyLimitMin > 0 && (!out.dailyLimitMin || h.dailyLimitMin < out.dailyLimitMin)) out.dailyLimitMin = h.dailyLimitMin
    if (h.breakEveryMin > 0 && (!out.breakEveryMin || h.breakEveryMin < out.breakEveryMin)) out.breakEveryMin = h.breakEveryMin
    if (!out.quietStart && toMin(h.quietStart) != null && toMin(h.quietEnd) != null) { out.quietStart = h.quietStart; out.quietEnd = h.quietEnd }
  }
  return out
}

async function healthyState(email, rows, tz = 'UTC', now = new Date()) {
  const rules = strictestHealthy(rows)
  const today = q.todayIn(tz)
  const [day] = await q.fetchDays([email], today, today)
  const todayMinutes = Math.round((day?.minutes || 0) * 10) / 10
  const nowMin = localMinutesNow(tz, now)
  return {
    ...rules,
    todayMinutes,
    limitReached: rules.dailyLimitMin > 0 && todayMinutes >= rules.dailyLimitMin,
    quietNow: inWindow(nowMin, toMin(rules.quietStart), toMin(rules.quietEnd)),
  }
}

// Validation of the settings a parent may send.
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/
function cleanSettings(body = {}) {
  const out = {}
  const errors = []
  const int = (v, min, max) => { const n = Number(v); return Number.isInteger(n) && n >= min && n <= max ? n : null }
  if (body.age !== undefined) { const n = int(body.age, 1, 25); if (n == null) errors.push('Age must be between 1 and 25'); else out.age = n }
  if (body.grade !== undefined) out.grade = String(body.grade).trim().slice(0, 30)
  if (body.language !== undefined) {
    const l = String(body.language).trim()
    if (l && !/^[a-z]{2}(-[A-Za-z]{2})?$/.test(l)) errors.push('Unknown language'); else out.language = l
  }
  if (body.avatar !== undefined) out.avatar = String(body.avatar).slice(0, 8)
  if (body.name !== undefined) {
    const n = String(body.name).trim()
    if (n.length < 1 || n.length > 60) errors.push('Name must be 1-60 characters'); else out.name = n
  }
  if (body.weeklyGoal !== undefined) {
    if (body.weeklyGoal === null) out.weeklyGoal = null
    else {
      const g = body.weeklyGoal || {}
      const minutesPerDay = int(g.minutesPerDay, 5, 120)
      const daysPerWeek = int(g.daysPerWeek, 1, 7)
      if (minutesPerDay == null || daysPerWeek == null) errors.push('A goal is 5-120 minutes on 1-7 days')
      else out.weeklyGoal = { minutesPerDay, daysPerWeek, reward: String(g.reward || '').trim().slice(0, 80), rewardEmoji: String(g.rewardEmoji || '').slice(0, 8), setAt: new Date() }
    }
  }
  if (body.healthyUse !== undefined) {
    const h = body.healthyUse || {}
    const dailyLimitMin = h.dailyLimitMin === undefined || h.dailyLimitMin === '' ? 0 : int(h.dailyLimitMin, 0, 600)
    const breakEveryMin = h.breakEveryMin === undefined || h.breakEveryMin === '' ? 0 : int(h.breakEveryMin, 0, 120)
    const quietStart = String(h.quietStart || '')
    const quietEnd = String(h.quietEnd || '')
    if (dailyLimitMin == null) errors.push('Daily limit must be 0-600 minutes')
    else if (breakEveryMin == null) errors.push('Break reminder must be 0-120 minutes')
    else if ((quietStart || quietEnd) && !(HHMM.test(quietStart) && HHMM.test(quietEnd))) errors.push('Quiet hours need a start and an end time')
    else out.healthyUse = { dailyLimitMin, breakEveryMin, quietStart, quietEnd }
  }
  if (body.notifyPrefs !== undefined) {
    const p = body.notifyPrefs || {}
    out.notifyPrefs = {}
    for (const k of ['weeklyDigest', 'milestones', 'goalReached', 'inactivity']) if (p[k] !== undefined) out.notifyPrefs[k] = Boolean(p[k])
  }
  if (body.onboarded) out.onboardedAt = new Date()
  return { out, errors }
}

module.exports = {
  CONSENT_VERSION, LEARNER_FIELDS, ownChild, requireOwnChild, verifiedRows, syncLearnerSettings, learnerSettingsFrom,
  weekOf, goalProgress, strictestHealthy, healthyState, cleanSettings, inWindow, toMin,
}
