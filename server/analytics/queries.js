// The one query layer every role uses (FND-041/043). Pass the learners in
// scope (an array of emails: one child, a group, a unit, a school) and a date
// range; everything is summed from LearnerDay, never from raw events.
const LearnerDay = require('../models/analytics/LearnerDay')
const LearningEvent = require('../models/analytics/LearningEvent')
const { MODULES, SUBJECTS, pct, masteryLevel, engagementScore } = require('../utils/metrics')

const ISO = /^\d{4}-\d{2}-\d{2}$/
const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const daysBetween = (a, b) => Math.round((new Date(`${b}T12:00:00Z`) - new Date(`${a}T12:00:00Z`)) / 86400000)
const todayIn = (tz = 'UTC') => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const norm = (emails) => [...new Set((emails || []).map((e) => String(e).toLowerCase()).filter(Boolean))]

// from/to are inclusive local dates. Default: the last 7 days.
function parseRange({ from, to, cmp = 'prev', tz = 'UTC' } = {}) {
  const end = ISO.test(to || '') ? to : todayIn(tz)
  const start = ISO.test(from || '') ? from : addDays(end, -6)
  if (start > end) throw Object.assign(new Error('from must be before to'), { status: 400 })
  const days = daysBetween(start, end) + 1
  if (days > 800) throw Object.assign(new Error('Range too long (max 800 days)'), { status: 400 })
  let prev = null
  if (cmp === 'prev') prev = { from: addDays(start, -days), to: addDays(start, -1) }
  else if (cmp === 'lastyear') prev = { from: addDays(start, -365), to: addDays(end, -365) }
  return { from: start, to: end, days, prev }
}

async function fetchDays(emails, from, to) {
  const list = norm(emails)
  if (!list.length) return []
  return LearnerDay.find({ email: { $in: list }, date: { $gte: from, $lte: to } }).lean()
}

const ACTIVE_MINUTES = 3

function totals(days, rangeDays) {
  const t = { minutes: 0, sessions: 0, answered: 0, correct: 0, firstTry: 0, hints: 0, xp: 0, stars: 0, timeMsSum: 0, timedCount: 0 }
  const active = new Set()
  for (const d of days) {
    for (const k of Object.keys(t)) t[k] += d[k] || 0
    if ((d.answered || 0) > 0 || (d.minutes || 0) >= ACTIVE_MINUTES) active.add(`${d.email}|${d.date}`)
  }
  const activeDates = new Set([...active].map((x) => x.split('|')[1]))
  const learners = new Set(days.map((d) => d.email)).size
  const activeDays = activeDates.size
  return {
    ...t,
    learners,
    activeDays,
    accuracy: pct(t.correct, t.answered),
    firstTryAccuracy: pct(t.firstTry, t.answered),
    avgTimeSec: t.timedCount ? Math.round(t.timeMsSum / t.timedCount / 100) / 10 : null,
    consistency: rangeDays ? pct(activeDays, rangeDays) : null,
    engagement: engagementScore({ activeDays, days: rangeDays, minutes: t.minutes / Math.max(1, learners), answered: t.answered / Math.max(1, learners) }),
  }
}

const delta = (cur, prev) => (cur == null || prev == null ? null : Math.round((cur - prev) * 10) / 10)

async function overview(emails, query) {
  const range = parseRange(query)
  const [curDays, prevDays] = await Promise.all([
    fetchDays(emails, range.from, range.to),
    range.prev ? fetchDays(emails, range.prev.from, range.prev.to) : [],
  ])
  const cur = totals(curDays, range.days)
  const prev = range.prev ? totals(prevDays, range.days) : null
  const deltas = prev && {
    minutes: delta(cur.minutes, prev.minutes), activeDays: delta(cur.activeDays, prev.activeDays),
    accuracy: delta(cur.accuracy, prev.accuracy), answered: delta(cur.answered, prev.answered), xp: delta(cur.xp, prev.xp),
    stars: delta(cur.stars, prev.stars), consistency: delta(cur.consistency, prev.consistency),
  }
  return { range, cur, prev, deltas, days: curDays, prevDays }
}

// Day series, grouped into weeks or months for long ranges so charts stay small.
function series(days, range, { bucket } = {}) {
  const span = range.days
  const by = bucket || (span > 400 ? 'month' : span > 93 ? 'week' : 'day')
  const key = (date) => {
    if (by === 'day') return date
    if (by === 'month') return date.slice(0, 7)
    const d = new Date(`${date}T12:00:00Z`); const dow = (d.getUTCDay() + 6) % 7
    d.setUTCDate(d.getUTCDate() - dow); return d.toISOString().slice(0, 10)
  }
  const map = new Map()
  const slot = (k) => { if (!map.has(k)) map.set(k, { key: k, minutes: 0, answered: 0, correct: 0, xp: 0, bySubject: {} }); return map.get(k) }
  // Fill empty days so charts show gaps honestly.
  if (by === 'day') for (let i = 0; i < span; i++) slot(addDays(range.from, i))
  for (const d of days) {
    const s = slot(key(d.date))
    s.minutes += d.minutes || 0; s.answered += d.answered || 0; s.correct += d.correct || 0; s.xp += d.xp || 0
    for (const [ms, v] of Object.entries(d.byModuleSubject || {})) {
      const subject = ms.split('_')[1] || 'general'
      s.bySubject[subject] = (s.bySubject[subject] || 0) + (v.minutes || 0)
    }
  }
  return {
    bucket: by,
    points: [...map.values()].sort((a, b) => (a.key < b.key ? -1 : 1)).map((s) => ({ ...s, minutes: Math.round(s.minutes * 10) / 10, accuracy: pct(s.correct, s.answered) })),
  }
}

// Subject x module grid: answers, accuracy, minutes and mastery for each tile.
function matrix(days) {
  const grid = {}
  for (const s of SUBJECTS) { grid[s] = {}; for (const m of MODULES) grid[s][m] = { answered: 0, correct: 0, minutes: 0 } }
  for (const d of days) {
    for (const [ms, v] of Object.entries(d.byModuleSubject || {})) {
      const [m, s] = ms.split('_')
      if (!grid[s]?.[m]) continue
      grid[s][m].answered += v.answered || 0; grid[s][m].correct += v.correct || 0; grid[s][m].minutes += v.minutes || 0
    }
  }
  for (const s of SUBJECTS) for (const m of MODULES) {
    const c = grid[s][m]
    c.accuracy = pct(c.correct, c.answered); c.minutes = Math.round(c.minutes * 10) / 10
    c.mastery = masteryLevel(c.answered, c.accuracy)
  }
  return grid
}

// When do they learn? Weekday x hour activity, best hour, weekday vs weekend.
function patterns(days) {
  const heat = Array.from({ length: 7 }, () => Array(24).fill(0)) // Monday first
  let weekday = 0, weekend = 0, weekdayDates = new Set(), weekendDates = new Set()
  const devices = {}
  for (const d of days) {
    const dow = (new Date(`${d.date}T12:00:00Z`).getUTCDay() + 6) % 7
    for (const [h, n] of Object.entries(d.byHour || {})) heat[dow][Number(h)] += n
    for (const [k, n] of Object.entries(d.devices || {})) devices[k] = (devices[k] || 0) + n
    const mins = d.minutes || 0
    if (dow >= 5) { weekend += mins; weekendDates.add(d.date) } else { weekday += mins; weekdayDates.add(d.date) }
  }
  const hours = Array(24).fill(0)
  heat.forEach((row) => row.forEach((n, h) => { hours[h] += n }))
  const peak = Math.max(...hours)
  return {
    heat, devices,
    bestHour: peak > 0 ? hours.indexOf(peak) : null,
    weekdayAvgMinutes: weekdayDates.size ? Math.round(weekday / weekdayDates.size) : null,
    weekendAvgMinutes: weekendDates.size ? Math.round(weekend / weekendDates.size) : null,
  }
}

// Current and longest streak from all activity dates (up to ~2 years back).
// `skipDates` (a Set or array of YYYY-MM-DD, e.g. school holidays, ADM-062): an
// inactive day in it does not break the streak (and does not count as a day of it).
async function streak(email, tz = 'UTC', { skipDates } = {}) {
  const today = todayIn(tz)
  const docs = await LearnerDay.find({ email: String(email).toLowerCase(), date: { $gte: addDays(today, -800) } }).select('date minutes answered').lean()
  const active = new Set(docs.filter((d) => (d.answered || 0) > 0 || (d.minutes || 0) >= ACTIVE_MINUTES).map((d) => d.date))
  return streakFrom(active, today, skipDates)
}

function streakFrom(active, today, skipDates) {
  const skip = skipDates instanceof Set ? skipDates : new Set(skipDates || [])
  const bridge = (d) => !active.has(d) && skip.has(d)
  let current = 0
  // Today not finished yet: a streak that ran up to yesterday is still alive.
  let cursor = active.has(today) || bridge(today) ? today : addDays(today, -1)
  for (let guard = 0; guard < 900; guard++) {
    if (active.has(cursor)) current++
    else if (!bridge(cursor)) break
    cursor = addDays(cursor, -1)
  }
  let longest = 0, run = 0, prev = null
  for (const date of [...active].sort()) {
    let linked = false
    if (prev) { let d = addDays(prev, 1); while (d < date && bridge(d)) d = addDays(d, 1); linked = d === date }
    run = linked ? run + 1 : 1
    longest = Math.max(longest, run); prev = date
  }
  return { current, longest: Math.max(longest, current), lastActive: [...active].sort().pop() || null }
}

// ── Rollups for schools and units (ADM-040..044) ─────────────────────────────

// Per-learner sums over a range, computed in MongoDB: Map email -> totals.
async function perEmailTotals(emails, from, to) {
  const list = norm(emails)
  const out = new Map()
  if (!list.length) return out
  const rows = await LearnerDay.aggregate([
    { $match: { email: { $in: list }, date: { $gte: from, $lte: to } } },
    { $group: {
      _id: '$email',
      minutes: { $sum: '$minutes' }, answered: { $sum: '$answered' }, correct: { $sum: '$correct' }, sessions: { $sum: '$sessions' },
      activeDays: { $sum: { $cond: [{ $or: [{ $gt: ['$answered', 0] }, { $gte: ['$minutes', ACTIVE_MINUTES] }] }, 1, 0] } },
      lastDate: { $max: '$date' },
    } },
  ])
  for (const r of rows) out.set(r._id, { minutes: r.minutes, answered: r.answered, correct: r.correct, sessions: r.sessions, activeDays: r.activeDays, lastDate: r.lastDate })
  return out
}

// Per-learner, per-subject answers: Map email -> { english: { answered, correct, minutes }, ... }.
async function perEmailSubjects(emails, from, to) {
  const list = norm(emails)
  const out = new Map()
  if (!list.length) return out
  const rows = await LearnerDay.aggregate([
    { $match: { email: { $in: list }, date: { $gte: from, $lte: to } } },
    { $project: { email: 1, ms: { $objectToArray: { $ifNull: ['$byModuleSubject', {}] } } } },
    { $unwind: '$ms' },
    { $group: {
      _id: { email: '$email', subject: { $arrayElemAt: [{ $split: ['$ms.k', '_'] }, 1] } },
      answered: { $sum: '$ms.v.answered' }, correct: { $sum: '$ms.v.correct' }, minutes: { $sum: '$ms.v.minutes' },
    } },
  ])
  for (const r of rows) {
    if (!out.has(r._id.email)) out.set(r._id.email, {})
    out.get(r._id.email)[r._id.subject] = { answered: r.answered, correct: r.correct, minutes: r.minutes }
  }
  return out
}

// Sum learners into groups (units, sections, teachers' classes). `groups` is
// [{ key, emails }]; `perEmail` from perEmailTotals. Per-learner averages, so a
// big section and a small one can be compared fairly.
function rollupGroups(groups, perEmail, rangeDays) {
  return groups.map(({ key, emails, ...rest }) => {
    const list = norm(emails)
    const t = { minutes: 0, answered: 0, correct: 0, activeDays: 0, active: 0 }
    for (const e of list) {
      const r = perEmail.get(e)
      if (!r) continue
      t.minutes += r.minutes || 0; t.answered += r.answered || 0; t.correct += r.correct || 0; t.activeDays += r.activeDays || 0
      if ((r.activeDays || 0) > 0) t.active++
    }
    const n = list.length
    return {
      key, ...rest,
      learners: n,
      activeLearners: t.active,
      activePct: pct(t.active, n),
      minutes: Math.round(t.minutes * 10) / 10,
      minutesPerLearner: n ? Math.round((t.minutes / n) * 10) / 10 : null,
      answered: t.answered,
      accuracy: pct(t.correct, t.answered),
      engagement: n ? engagementScore({ activeDays: t.activeDays / n, days: rangeDays, minutes: t.minutes / n, answered: t.answered / n }) : null,
    }
  })
}

// Row x subject accuracy grid (e.g. grade x subject): groups [{ key, emails }], perSubj from perEmailSubjects.
function subjectGrid(groups, perSubj) {
  return groups.map(({ key, emails, ...rest }) => {
    const cells = {}
    for (const s of SUBJECTS) cells[s] = { answered: 0, correct: 0, minutes: 0 }
    for (const e of norm(emails)) {
      for (const [s, v] of Object.entries(perSubj.get(e) || {})) {
        if (!cells[s]) continue
        cells[s].answered += v.answered || 0; cells[s].correct += v.correct || 0; cells[s].minutes += v.minutes || 0
      }
    }
    for (const s of SUBJECTS) { cells[s].accuracy = pct(cells[s].correct, cells[s].answered); cells[s].minutes = Math.round(cells[s].minutes * 10) / 10 }
    return { key, ...rest, cells }
  })
}

// Change per learner between two periods (wins, class growth). Accuracy deltas
// need at least `minAnswers` answers in both periods to count.
function growthRows(emails, cur, prev, { minAnswers = 10 } = {}) {
  return norm(emails).map((email) => {
    const c = cur.get(email) || {}, p = prev.get(email) || {}
    const ca = (c.answered || 0) >= minAnswers ? pct(c.correct, c.answered) : null
    const pa = (p.answered || 0) >= minAnswers ? pct(p.correct, p.answered) : null
    return {
      email, minutes: Math.round((c.minutes || 0) * 10) / 10, prevMinutes: Math.round((p.minutes || 0) * 10) / 10,
      accuracy: ca, prevAccuracy: pa, accuracyDelta: ca != null && pa != null ? ca - pa : null,
      minutesDelta: Math.round(((c.minutes || 0) - (p.minutes || 0)) * 10) / 10,
      activeDays: c.activeDays || 0, lastDate: c.lastDate || p.lastDate || null,
    }
  })
}

// How the time was spent: practice, warrior, test, homework, ar, ai_teacher.
function featureUse(days) {
  const out = {}
  for (const d of days) for (const [k, n] of Object.entries(d.sources || {})) out[k] = (out[k] || 0) + n
  return out
}

// Distinct active learners per day (adoption over time).
function activeSeries(days, range) {
  const by = new Map()
  for (let i = 0; i < range.days; i++) by.set(addDays(range.from, i), new Set())
  for (const d of days) if (((d.answered || 0) > 0 || (d.minutes || 0) >= ACTIVE_MINUTES) && by.has(d.date)) by.get(d.date).add(d.email)
  return [...by.entries()].map(([date, s]) => ({ date, learners: s.size }))
}

// Calendar heatmap: minutes per day (summed over the learners in scope).
async function calendar(emails, year) {
  const from = `${year}-01-01`, to = `${year}-12-31`
  const days = await fetchDays(emails, from, to)
  const by = {}
  for (const d of days) by[d.date] = (by[d.date] || 0) + (d.minutes || 0)
  return Object.entries(by).map(([date, minutes]) => ({ date, minutes: Math.round(minutes * 10) / 10 })).sort((a, b) => (a.date < b.date ? -1 : 1))
}

// One row per learner for group/unit tables, with the at-risk rule applied.
async function perLearner(emails, query) {
  const range = parseRange({ ...query, cmp: 'none' })
  const list = norm(emails)
  const twoWeeksAgo = addDays(range.to, -13), oneWeekAgo = addDays(range.to, -6)
  const [days, recent] = await Promise.all([fetchDays(list, range.from, range.to), fetchDays(list, twoWeeksAgo, range.to)])
  const group = (docs) => { const m = new Map(); for (const d of docs) { if (!m.has(d.email)) m.set(d.email, []); m.get(d.email).push(d) } return m }
  const byEmail = group(days), recentBy = group(recent)
  const rows = list.map((email) => {
    const t = totals(byEmail.get(email) || [], range.days)
    const rec = recentBy.get(email) || []
    const lastWeek = totals(rec.filter((d) => d.date >= oneWeekAgo), 7)
    const weekBefore = totals(rec.filter((d) => d.date < oneWeekAgo), 7)
    const lastDate = (byEmail.get(email) || []).map((d) => d.date).sort().pop() || null
    const idle = !rec.some((d) => (d.answered || 0) > 0 || (d.minutes || 0) >= ACTIVE_MINUTES)
    const drop = lastWeek.accuracy != null && weekBefore.accuracy != null && weekBefore.accuracy - lastWeek.accuracy > 15
    return { email, ...t, lastActive: lastDate, atRisk: idle || drop, riskReason: idle ? 'inactive' : drop ? 'accuracy_drop' : null }
  })
  return { range, rows }
}

// Raw usage log for one learner, newest first.
async function timeline(email, { from, to, limit = 100 } = {}) {
  const q = { email: String(email).toLowerCase() }
  if (from || to) q.ts = { ...(from && { $gte: new Date(`${from}T00:00:00Z`) }), ...(to && { $lte: new Date(`${to}T23:59:59Z`) }) }
  return LearningEvent.find(q).sort({ ts: -1 }).limit(Math.min(Number(limit) || 100, 500)).lean()
}

module.exports = {
  parseRange, fetchDays, totals, overview, series, matrix, patterns, streak, streakFrom, calendar, perLearner, timeline, addDays, daysBetween, todayIn, norm,
  perEmailTotals, perEmailSubjects, rollupGroups, subjectGrid, growthRows, featureUse, activeSeries, ACTIVE_MINUTES,
}
