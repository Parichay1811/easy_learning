// Test rules (TCH-031) as pure functions, so the timing and release decisions
// are made in one place on the server and are easy to test.

const GRACE_MS = 10 * 1000 // network slack on every deadline

const toDate = (d) => (d ? new Date(d) : null)

// Where the test window is right now: upcoming | open | late | closed.
function windowState(rules = {}, now = new Date()) {
  const opensAt = toDate(rules.opensAt)
  const closesAt = toDate(rules.closesAt)
  if (rules.alwaysOpen) return { phase: 'open', opensAt: null, closesAt: null, lateUntil: null }
  if (opensAt && now < opensAt) return { phase: 'upcoming', opensAt, closesAt, lateUntil: null }
  if (!closesAt || now <= closesAt) return { phase: 'open', opensAt, closesAt, lateUntil: null }
  if (rules.lateWork === 'marked') return { phase: 'late', opensAt, closesAt, lateUntil: null }
  if (rules.lateWork === 'until' && rules.lateUntil && now <= new Date(rules.lateUntil)) return { phase: 'late', opensAt, closesAt, lateUntil: new Date(rules.lateUntil) }
  return { phase: 'closed', opensAt, closesAt, lateUntil: rules.lateWork === 'until' ? toDate(rules.lateUntil) : null }
}

// The latest moment any work can be handed in (null = no hard stop).
function hardStop(rules = {}) {
  if (rules.alwaysOpen) return null
  if (rules.lateWork === 'marked') return null
  if (rules.lateWork === 'until' && rules.lateUntil) return new Date(rules.lateUntil)
  return toDate(rules.closesAt)
}

const multiplier = (acc) => {
  const m = Number(acc?.extraTime || 1)
  return [1, 1.25, 1.5, 2].includes(m) ? m : 1
}

// Deadline for a new attempt: the time limit (stretched by the student's extra
// time), never past the hard stop.
function attemptDeadline(rules = {}, startedAt = new Date(), acc = {}) {
  let deadline = null
  if (rules.timeLimit === 'total' && rules.totalMinutes) {
    deadline = new Date(startedAt.getTime() + rules.totalMinutes * 60000 * multiplier(acc))
  }
  const stop = hardStop(rules)
  if (stop && (!deadline || stop < deadline)) deadline = stop
  return deadline
}

// Seconds allowed on one question in per-question mode.
const perQuestionMs = (rules = {}, acc = {}) => (rules.timeLimit === 'per_question' && rules.perQuestionSeconds ? rules.perQuestionSeconds * 1000 * multiplier(acc) : null)

const pastDeadline = (attempt, now = new Date()) => !!attempt.deadlineAt && now.getTime() > new Date(attempt.deadlineAt).getTime() + GRACE_MS

function itemExpired(attempt, item, now = new Date()) {
  const ms = perQuestionMs(attempt.rules, attempt.accommodations)
  if (!ms || !item.openedAt) return false
  return now.getTime() > new Date(item.openedAt).getTime() + ms + GRACE_MS
}

// Are this attempt's results visible to the student (and their parents)?
function isReleased(test, attempt, now = new Date()) {
  if (!attempt || attempt.status === 'in_progress') return false
  if (test.resultsReleasedAt && new Date(test.resultsReleasedAt) <= now) return true
  const rules = test.rules || {}
  if (rules.release === 'manual') return false
  if (rules.feedback === 'immediate' || rules.feedback === 'after_submit') return true
  if (rules.feedback === 'after_close') {
    const close = toDate(rules.closesAt)
    return !!close && now > close && windowState(rules, now).phase !== 'late'
  }
  return false
}

// Show the right answers along with the score?
const showAnswers = (test, attempt, now = new Date()) => isReleased(test, attempt, now) && (test.rules?.feedback || 'after_submit') !== 'never'

// Which attempt counts (best / last / average) among submitted ones.
function countedScore(attempts, how = 'best') {
  const done = attempts.filter((a) => a.status !== 'in_progress' && Number.isFinite(a.percent))
  if (!done.length) return null
  if (how === 'last') return done.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0].percent
  if (how === 'average') return Math.round(done.reduce((s, a) => s + a.percent, 0) / done.length)
  return Math.max(...done.map((a) => a.percent))
}

// Features that need the 'tests.advanced' module.
function advancedFeatures(test) {
  const used = []
  const items = (test.sections || []).flatMap((s) => s.items || [])
  if (items.some((i) => i.kind === 'pool')) used.push('random pools')
  if (test.rules?.timeLimit === 'per_question') used.push('per-question time limits')
  const integ = test.rules?.integrity || {}
  if (integ.logTabSwitches || integ.logPaste || integ.fullscreen) used.push('integrity logging')
  if (test.rules?.lateWork === 'until') used.push('late work until a date')
  return used
}

// Sanity checks on rules before publishing. Returns a list of problems.
function ruleProblems(rules = {}) {
  const p = []
  if (!rules.alwaysOpen && rules.opensAt && rules.closesAt && new Date(rules.closesAt) <= new Date(rules.opensAt)) p.push('The closing time must be after the opening time')
  if (rules.timeLimit === 'total' && !rules.totalMinutes) p.push('Set the time limit in minutes')
  if (rules.timeLimit === 'per_question' && !rules.perQuestionSeconds) p.push('Set the seconds per question')
  if (rules.lateWork === 'until' && (!rules.lateUntil || (rules.closesAt && new Date(rules.lateUntil) <= new Date(rules.closesAt)))) p.push('Late work must be allowed until a date after the closing time')
  if (rules.timezone) { try { new Intl.DateTimeFormat('en', { timeZone: rules.timezone }) } catch { p.push('Unknown timezone') } }
  return p
}

// Offset (ms) of a timezone at an instant: local wall time minus UTC.
function tzOffsetMs(instant, tz) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(instant)
  const get = (t) => Number(parts.find((p) => p.type === t).value)
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')) - Math.floor(instant.getTime() / 1000) * 1000
}

// "2026-11-20T09:00" on the wall clock in `tz` -> the UTC instant. Handles DST.
function zonedToUtc(local, tz = 'UTC') {
  const m = String(local || '').match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (!m) return null
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0))
  let guess = wall - tzOffsetMs(new Date(wall), tz)
  guess = wall - tzOffsetMs(new Date(guess), tz)
  return new Date(guess)
}

module.exports = { zonedToUtc, tzOffsetMs, GRACE_MS, windowState, hardStop, attemptDeadline, perQuestionMs, pastDeadline, itemExpired, isReleased, showAnswers, countedScore, advancedFeatures, ruleProblems, multiplier }
