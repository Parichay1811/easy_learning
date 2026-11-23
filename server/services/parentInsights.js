// Deeper parent views (PAR-031..036, PAR-040/041, PAR-071, PAR-080..082).
// Everything sums the same LearnerDay rollups through analytics/queries.js, so
// the numbers match the overview. Where a view needs per-answer or per-session
// detail (sources, AI Teacher topics, AR, question review) it reads the raw
// LearningEvent / StudentAnswer / ARSession rows of ONE learner.
const q = require('../analytics/queries')
const { buildStory, buildInsights } = require('../analytics/insights')
const { MODULES, SUBJECTS, pct, masteryLevel } = require('../utils/metrics')
const LearnerDay = require('../models/analytics/LearnerDay')
const LearningEvent = require('../models/analytics/LearningEvent')
const StudentAnswer = require('../models/StudentAnswer')
const StudentAchievement = require('../models/StudentAchievement')
const ARSession = require('../models/ARSession')
const { findingsInput } = require('./arFindingRows')
const { ACHIEVEMENTS } = require('../controllers/dashboardController')

const round1 = (n) => Math.round(n * 10) / 10
const cap = (s) => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1)
const dayStart = (iso) => new Date(`${iso}T00:00:00Z`)
const dayEnd = (iso) => new Date(`${iso}T23:59:59.999Z`)

// ── Practice vs Warrior vs tests (PAR-034) ───────────────────────────────────
async function bySource(email, range) {
  const rows = await LearningEvent.aggregate([
    { $match: { email, kind: 'answer', ts: { $gte: dayStart(range.from), $lte: dayEnd(range.to) } } },
    { $group: { _id: { $ifNull: ['$source', '$mode'] }, answered: { $sum: 1 }, correct: { $sum: { $cond: ['$correct', 1, 0] } }, timeSum: { $sum: { $ifNull: ['$timeMs', 0] } }, timed: { $sum: { $cond: [{ $gt: ['$timeMs', 0] }, 1, 0] } } } },
  ])
  const pick = (k) => rows.filter((r) => (k === 'test' ? ['test', 'homework'].includes(r._id) : r._id === k))
  const sum = (list) => {
    const t = list.reduce((a, r) => ({ answered: a.answered + r.answered, correct: a.correct + r.correct, timeSum: a.timeSum + r.timeSum, timed: a.timed + r.timed }), { answered: 0, correct: 0, timeSum: 0, timed: 0 })
    return { answered: t.answered, correct: t.correct, accuracy: pct(t.correct, t.answered), avgTimeSec: t.timed ? round1(t.timeSum / t.timed / 1000) : null }
  }
  const out = { practice: sum(pick('practice')), warrior: sum(pick('warrior')), test: sum(pick('test')) }
  let note = null
  if (out.warrior.accuracy != null && out.practice.accuracy != null && out.practice.accuracy - out.warrior.accuracy >= 5) {
    note = 'Timed Warrior rounds score a little lower than relaxed practice. That is normal: the clock adds pressure, it is not a drop in ability.'
  }
  return { range, sources: out, note }
}

// ── Accuracy, speed and independence trends (PAR-032) ────────────────────────
function bucketKey(date, by) {
  if (by === 'month') return date.slice(0, 7)
  const d = new Date(`${date}T12:00:00Z`); const dow = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - dow); return d.toISOString().slice(0, 10)
}

async function trends(email, range) {
  const by = range.days > 120 ? 'month' : 'week'
  const [days, prevDays] = await Promise.all([
    q.fetchDays([email], range.from, range.to),
    range.prev ? q.fetchDays([email], range.prev.from, range.prev.to) : [],
  ])
  const groups = new Map()
  for (const d of days) { const k = bucketKey(d.date, by); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(d) }
  const shape = (t) => ({
    answered: t.answered, accuracy: t.accuracy, firstTryAccuracy: t.firstTryAccuracy, avgTimeSec: t.avgTimeSec,
    independence: t.answered ? pct(t.answered - Math.min(t.hints, t.answered), t.answered) : null,
  })
  const points = [...groups.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([key, list]) => ({ key, ...shape(q.totals(list, 7)) }))
  const cur = shape(q.totals(days, range.days))
  const prev = range.prev ? shape(q.totals(prevDays, range.days)) : null
  const parts = []
  if (prev && cur.answered >= 10 && prev.answered >= 10) {
    if (cur.avgTimeSec != null && prev.avgTimeSec != null) {
      if (cur.avgTimeSec <= prev.avgTimeSec - 0.5) parts.push('answers faster')
      else if (cur.avgTimeSec >= prev.avgTimeSec + 0.5) parts.push('takes a little more time per question')
    }
    if (cur.independence != null && prev.independence != null) {
      if (cur.independence >= prev.independence + 3) parts.push('needs fewer hints')
      else if (cur.independence <= prev.independence - 3) parts.push('is using hints a bit more')
    }
    if (cur.firstTryAccuracy != null && prev.firstTryAccuracy != null) {
      if (cur.firstTryAccuracy >= prev.firstTryAccuracy + 3) parts.push('gets more right on the first try')
    }
  }
  const summary = parts.length ? `${cap(parts.join(', ').replace(/, ([^,]*)$/, ' and $1'))} than the period before.` : (cur.answered ? 'Keeps a steady pace compared with the period before.' : null)
  return { range, bucket: by, points, current: cur, previous: prev, summary }
}

// ── Skill map (PAR-031) ──────────────────────────────────────────────────────
// The question banks don't carry skill ids yet (FND-042). When answers carry the
// bank question's curriculum topic we group by it; otherwise the "skill" level is
// module x subject. `level` says which one the client is showing.
async function skills(email, range) {
  const nowFrom = q.addDays(range.to, -29)
  const thenTo = q.addDays(range.from, -1), thenFrom = q.addDays(range.from, -30)
  const topicAnswers = await StudentAnswer.find({ email, topic: { $nin: [null, ''] }, timestamp: { $gte: dayStart(thenFrom), $lte: dayEnd(range.to) } }).select('module subject topic correct timestamp').lean()

  if (topicAnswers.length >= 20) {
    const map = new Map()
    for (const a of topicAnswers) {
      const key = `${a.subject}|${a.topic}`
      if (!map.has(key)) map.set(key, { subject: a.subject, topic: a.topic, modules: new Set(), now: [0, 0], then: [0, 0], all: [] })
      const s = map.get(key)
      s.modules.add(a.module)
      const date = a.timestamp.toISOString().slice(0, 10)
      if (date >= nowFrom) { s.now[0]++; if (a.correct) s.now[1]++ }
      if (date <= thenTo) { s.then[0]++; if (a.correct) s.then[1]++ }
    }
    const groups = {}
    for (const s of map.values()) {
      const accNow = pct(s.now[1], s.now[0]), accThen = pct(s.then[1], s.then[0])
      ;(groups[s.subject] ||= []).push({
        key: `${s.subject}:${s.topic}`, label: cap(s.topic), modules: [...s.modules],
        answered: s.now[0], accuracy: accNow, mastery: masteryLevel(s.now[0], accNow),
        then: { answered: s.then[0], accuracy: accThen, mastery: masteryLevel(s.then[0], accThen) },
      })
    }
    return { range, level: 'topic', windows: { now: { from: nowFrom, to: range.to }, then: { from: thenFrom, to: thenTo } }, groups: SUBJECTS.filter((s) => groups[s]).map((s) => ({ subject: s, skills: groups[s] })) }
  }

  const [nowDays, thenDays, history] = await Promise.all([
    q.fetchDays([email], nowFrom, range.to),
    q.fetchDays([email], thenFrom, thenTo),
    q.fetchDays([email], q.addDays(range.to, -400), range.to),
  ])
  const nowM = q.matrix(nowDays), thenM = q.matrix(thenDays)
  // The day each tile first reached "Mastered" (cumulative, from at most 400 days back).
  const masteredAt = {}
  const run = {}
  for (const d of [...history].sort((a, b) => (a.date < b.date ? -1 : 1))) {
    for (const [ms, v] of Object.entries(d.byModuleSubject || {})) {
      const r = (run[ms] ||= { a: 0, c: 0 })
      r.a += v.answered || 0; r.c += v.correct || 0
      if (!masteredAt[ms] && masteryLevel(r.a, pct(r.c, r.a)) === 'mastered') masteredAt[ms] = d.date
    }
  }
  const groups = SUBJECTS.map((s) => ({
    subject: s,
    skills: MODULES.map((m) => {
      const n = nowM[s][m], t = thenM[s][m]
      return {
        key: `${m}_${s}`, label: cap(m), module: m, answered: n.answered, accuracy: n.accuracy, mastery: n.mastery, minutes: n.minutes,
        masteredAt: n.mastery === 'mastered' ? masteredAt[`${m}_${s}`] || null : null,
        then: { answered: t.answered, accuracy: t.accuracy, mastery: t.mastery },
      }
    }),
  }))
  return { range, level: 'module_subject', windows: { now: { from: nowFrom, to: range.to }, then: { from: thenFrom, to: thenTo } }, groups }
}

// ── Question-level review (PAR-033) ──────────────────────────────────────────
const BANKS = {}
function bankModel(module, subject) {
  const m = String(module || '').toLowerCase(), s = String(subject || '').toLowerCase()
  if (!MODULES.includes(m) || !SUBJECTS.includes(s)) return null
  const name = `${cap(m)}${cap(s)}`
  if (!BANKS[name]) BANKS[name] = require(`../models/${name}`)
  return BANKS[name]
}
const CARD_FIELDS = 'id subject module interaction level level_name instruction prompt audio_text image question_image_link options correct_answer academic.skill academic.curriculum_strand hints'

async function answers(email, { filter = 'all', limit = 30, before, module, subject } = {}) {
  const lim = Math.min(Math.max(Number(limit) || 30, 1), 100)
  const base = { email }
  if (before && !Number.isNaN(Date.parse(before))) base.timestamp = { $lt: new Date(before) }
  // "Slow" is relative to this child: more than twice their usual time, and at least 15 s.
  const recent = await StudentAnswer.find({ email, timeTaken: { $gt: 0 } }).sort({ timestamp: -1 }).limit(200).select('timeTaken').lean()
  const times = recent.map((r) => r.timeTaken).sort((a, b) => a - b)
  const median = times.length ? times[Math.floor(times.length / 2)] : null
  const slowAt = Math.max(15, median ? median * 2 : 15)
  const f = { ...base }
  if (MODULES.includes(module)) f.module = module
  if (SUBJECTS.includes(subject)) f.subject = subject
  if (filter === 'wrong') f.correct = false
  else if (filter === 'hint') f.hintsUsed = { $gt: 0 }
  else if (filter === 'slow') f.timeTaken = { $gte: slowAt }
  const list = await StudentAnswer.find(f).sort({ timestamp: -1 }).limit(lim).lean()

  // The exact bank question, so the parent sees the card the child saw.
  const want = {}
  for (const a of list) if (a.questionId) { const M = bankModel(a.module, a.subject); if (M) (want[M.modelName] ||= { M, ids: new Set() }).ids.add(a.questionId) }
  const cards = {}
  await Promise.all(Object.values(want).map(async ({ M, ids }) => {
    const docs = await M.find({ id: { $in: [...ids] } }).select(CARD_FIELDS).lean()
    for (const d of docs) cards[d.id] = d
  }))
  return {
    filter, slowAfterSec: slowAt, medianSec: median,
    answers: list.map((a) => ({
      id: String(a._id), at: a.timestamp, module: a.module, subject: a.subject, mode: a.mode, question: a.question,
      userAnswer: a.userAnswer, correctAnswer: a.correctAnswer, correct: a.correct, timeSec: a.timeTaken, hintsUsed: a.hintsUsed || 0,
      slow: a.timeTaken != null && a.timeTaken >= slowAt, card: a.questionId ? cards[a.questionId] || null : null,
    })),
    nextBefore: list.length === lim ? list[list.length - 1].timestamp : null,
  }
}

// ── AI Teacher usage (PAR-036) ───────────────────────────────────────────────
async function aiTeacher(email, range) {
  const rows = await LearningEvent.find({ email, kind: 'ai_teacher', ts: { $gte: dayStart(range.from), $lte: dayEnd(range.to) } }).select('topic title subject minutes ts').lean()
  const topics = new Map(), subjects = {}
  for (const r of rows) {
    const t = topics.get(r.topic) || { topic: r.topic, title: r.title || r.topic, subject: r.subject || 'general', minutes: 0, visits: 0, lastAt: null }
    t.minutes += r.minutes || 0; t.visits++; if (!t.lastAt || r.ts > t.lastAt) t.lastAt = r.ts
    topics.set(r.topic, t)
    subjects[t.subject] = (subjects[t.subject] || 0) + (r.minutes || 0)
  }
  const list = [...topics.values()].map((t) => ({ ...t, minutes: round1(t.minutes) })).sort((a, b) => b.minutes - a.minutes)
  const fav = Object.entries(subjects).sort((a, b) => b[1] - a[1])[0]
  return { range, minutes: round1(list.reduce((s, t) => s + t.minutes, 0)), topics: list.slice(0, 30), topicCount: list.length, favouriteSubject: fav ? fav[0] : null }
}

// ── Screen time (PAR-041) ────────────────────────────────────────────────────
const LATE = new Set(['21', '22', '23', '0', '1', '2', '3', '4', '5'])
async function screenTime(email, range) {
  const [days, sessions] = await Promise.all([
    q.fetchDays([email], range.from, range.to),
    LearningEvent.find({ email, kind: { $in: ['session', 'ai_teacher'] }, ts: { $gte: dayStart(range.from), $lte: dayEnd(range.to) } }).sort({ minutes: -1 }).limit(1).select('minutes ts module subject kind').lean(),
  ])
  const t = q.totals(days, range.days)
  const devices = {}
  let lateDays = 0
  for (const d of days) {
    for (const [k, n] of Object.entries(d.devices || {})) devices[k] = (devices[k] || 0) + n
    if (Object.keys(d.byHour || {}).some((h) => LATE.has(h) && d.byHour[h] > 0)) lateDays++
  }
  const series = q.series(days, range, { bucket: range.days > 93 ? 'week' : 'day' })
  const daily = days.map((d) => d.minutes || 0)
  return {
    range, minutes: round1(t.minutes), activeDays: t.activeDays,
    avgPerActiveDay: t.activeDays ? Math.round(t.minutes / t.activeDays) : null,
    longestDay: daily.length ? round1(Math.max(...daily)) : null,
    longestSession: sessions[0] ? { minutes: sessions[0].minutes, at: sessions[0].ts, what: sessions[0].kind === 'ai_teacher' ? 'AI Teacher' : `${cap(sessions[0].module)} · ${cap(sessions[0].subject)}` } : null,
    lateEveningDays: lateDays, devices, series,
  }
}

// ── Movement and focus games (PAR-035) ───────────────────────────────────────
// Plain words only. These are game results, not health measurements.
// `findings` is the input of the shared findings engine (client/src/ar/insights/findings.js):
// this period's rounds and the equal period's before it, as compact rows (services/arFindingRows.js).
async function arSummary(email, range) {
  const [rows, findings] = await Promise.all([
    ARSession.find({ email, startedAt: { $gte: dayStart(range.from), $lte: dayEnd(range.to) } })
      .select('gameId title startedAt activeMs summary.accuracyPct summary.medianLatencyMs summary.pathEfficiency summary.byHand summary.trials summary.independentPct')
      .sort({ startedAt: 1 }).lean(),
    findingsInput(email, { from: range.from, to: range.to }),
  ])
  if (!rows.length) return { range, sessions: 0, minutes: 0, games: [], weeks: [], notes: [], findings }
  const med = (arr) => { const a = arr.filter((x) => x != null).sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : null }
  const weeks = new Map(), games = new Map()
  for (const r of rows) {
    const k = bucketKey(r.startedAt.toISOString().slice(0, 10), 'week')
    const w = weeks.get(k) || { key: k, acc: [], lat: [], steady: [], left: 0, right: 0, sessions: 0 }
    const s = r.summary || {}
    w.acc.push(s.accuracyPct); w.lat.push(s.medianLatencyMs); w.steady.push(s.pathEfficiency); w.sessions++
    w.left += s.byHand?.left?.trials || 0; w.right += s.byHand?.right?.trials || 0
    weeks.set(k, w)
    const g = games.get(r.gameId) || { gameId: r.gameId, title: r.title || r.gameId, sessions: 0, minutes: 0 }
    g.sessions++; g.minutes += (r.activeMs || 0) / 60000
    games.set(r.gameId, g)
  }
  const wk = [...weeks.values()].map((w) => ({
    key: w.key, sessions: w.sessions, accuracy: med(w.acc), reactionMs: med(w.lat),
    steadiness: med(w.steady) != null ? Math.round(med(w.steady) * 100) : null,
    bothHandsPct: w.left + w.right ? Math.round((Math.min(w.left, w.right) / (w.left + w.right)) * 200) : null,
  }))
  const first = wk[0], last = wk[wk.length - 1]
  const notes = []
  if (wk.length >= 2) {
    if (first.reactionMs && last.reactionMs && last.reactionMs < first.reactionMs * 0.9) notes.push({ key: 'reaction_faster', text: 'Reacts a little faster in the games than a few weeks ago.' })
    if (first.accuracy != null && last.accuracy != null && last.accuracy >= first.accuracy + 5) notes.push({ key: 'accuracy_up', text: 'Hits the right target more often than before.' })
    if (first.steadiness != null && last.steadiness != null && last.steadiness >= first.steadiness + 5) notes.push({ key: 'steadier', text: 'Moves more directly to the target: smoother, steadier reaches.' })
  }
  if (last.bothHandsPct != null && last.bothHandsPct >= 60) notes.push({ key: 'both_hands', text: 'Uses both hands well in the games.' })
  return {
    range, sessions: rows.length, minutes: Math.round(rows.reduce((s, r) => s + (r.activeMs || 0), 0) / 60000),
    games: [...games.values()].map((g) => ({ ...g, minutes: Math.round(g.minutes) })).sort((a, b) => b.sessions - a.sessions),
    weeks: wk, notes, findings,
    disclaimer: 'These are results from play, to celebrate progress. They are not a medical or diagnostic measure.',
  }
}

// ── Milestones and the Year in Learnigo (PAR-080..082) ───────────────────────
async function milestones(email, { to } = {}) {
  const docs = await LearnerDay.find({ email, ...(to && { date: { $lte: to } }) }).select('date answered minutes byModuleSubject').sort({ date: 1 }).lean()
  const out = []
  let answered = 0, minutes = 0, prevDate = null, run = 0
  const seen = new Set()
  const cum = {}
  const add = (key, date, text, icon) => { if (!seen.has(key)) { seen.add(key); out.push({ key, date, text, icon }) } }
  for (const d of docs) {
    const active = (d.answered || 0) > 0 || (d.minutes || 0) >= 3
    if (active) {
      if (!seen.has('first_day')) add('first_day', d.date, 'First day of learning on Learnigo', '🌱')
      run = prevDate && q.addDays(prevDate, 1) === d.date ? run + 1 : 1
      prevDate = d.date
      if (run >= 7) add('streak_7', d.date, 'First 7-day streak', '🔥')
      if (run >= 30) add('streak_30', d.date, 'A 30-day streak', '🏅')
    }
    const before = answered
    answered += d.answered || 0; minutes += d.minutes || 0
    for (const n of [100, 500, 1000, 5000]) if (before < n && answered >= n) add(`answers_${n}`, d.date, `${n.toLocaleString('en')} questions answered`, n >= 1000 ? '🏆' : '💯')
    if (minutes >= 600) add('hours_10', d.date, '10 hours of learning', '⏱️')
    for (const [ms, v] of Object.entries(d.byModuleSubject || {})) {
      const c = (cum[ms] ||= { a: 0, c: 0 })
      c.a += v.answered || 0; c.c += v.correct || 0
      if (masteryLevel(c.a, pct(c.c, c.a)) === 'mastered' && c.a >= 20) {
        const [m, s] = ms.split('_')
        if (!seen.has('first_mastered')) add('first_mastered', d.date, `First area mastered: ${cap(m)} · ${cap(s)}`, '⭐')
      }
    }
  }
  return out
}

async function yearInReview(email, year, tz = 'UTC') {
  const from = `${year}-01-01`
  const today = q.todayIn(tz)
  const to = `${year}-12-31` < today ? `${year}-12-31` : today
  const range = { from, to, days: q.daysBetween(from, to) + 1, prev: null }
  const prevRange = { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` }
  const [days, prevDays, ai, ms, ach] = await Promise.all([
    q.fetchDays([email], from, to), q.fetchDays([email], prevRange.from, prevRange.to), aiTeacher(email, range),
    milestones(email, { to }), StudentAchievement.find({ email, earnedAt: { $gte: dayStart(from), $lte: dayEnd(to) } }).lean(),
  ])
  const t = q.totals(days, range.days)
  const matrix = q.matrix(days)
  const subjMin = {}, tiles = []
  for (const s of SUBJECTS) for (const m of MODULES) {
    const c = matrix[s][m]
    subjMin[s] = (subjMin[s] || 0) + c.minutes
    if (c.answered) tiles.push({ subject: s, module: m, ...c })
  }
  const topSubject = Object.entries(subjMin).sort((a, b) => b[1] - a[1]).find(([, v]) => v > 0)?.[0] || null
  const months = {}
  for (const d of days) { const k = d.date.slice(0, 7); months[k] = (months[k] || 0) + (d.minutes || 0) }
  const bestMonth = Object.entries(months).sort((a, b) => b[1] - a[1])[0]
  // Longest streak inside the year.
  const active = days.filter((d) => (d.answered || 0) > 0 || (d.minutes || 0) >= 3).map((d) => d.date).sort()
  let longest = 0, runLen = 0, prev = null
  for (const date of active) { runLen = prev && q.addDays(prev, 1) === date ? runLen + 1 : 1; longest = Math.max(longest, runLen); prev = date }
  const pt = q.totals(prevDays, 365)
  return {
    year, from, to, minutes: Math.round(t.minutes), activeDays: t.activeDays, answered: t.answered, accuracy: t.accuracy, xp: t.xp, stars: t.stars,
    topSubject, mastered: tiles.filter((x) => x.mastery === 'mastered').map((x) => ({ subject: x.subject, module: x.module, accuracy: x.accuracy })),
    longestStreak: longest, bestMonth: bestMonth ? { month: bestMonth[0], minutes: Math.round(bestMonth[1]) } : null,
    months: Object.entries(months).sort().map(([month, m]) => ({ month, minutes: Math.round(m) })),
    favouriteAiTopic: ai.topics[0] ? { title: ai.topics[0].title, minutes: ai.topics[0].minutes } : null,
    badges: ach.length,
    milestones: ms.filter((m) => m.date >= from && m.date <= to),
    thenVsNow: thenVsNow(days),
    lastYear: pt.answered || pt.minutes ? { minutes: Math.round(pt.minutes), answered: pt.answered, accuracy: pt.accuracy } : null,
  }
}

// Then vs now (PAR-081): the first and the last month of activity, per area practised in both.
function thenVsNow(days) {
  const sorted = [...days].sort((a, b) => (a.date < b.date ? -1 : 1))
  if (sorted.length < 2) return null
  const firstMonth = sorted[0].date.slice(0, 7), lastMonth = sorted[sorted.length - 1].date.slice(0, 7)
  if (firstMonth === lastMonth) return null
  const thenM = q.matrix(sorted.filter((d) => d.date.startsWith(firstMonth)))
  const nowM = q.matrix(sorted.filter((d) => d.date.startsWith(lastMonth)))
  const thenT = q.totals(sorted.filter((d) => d.date.startsWith(firstMonth)), 30)
  const nowT = q.totals(sorted.filter((d) => d.date.startsWith(lastMonth)), 30)
  const rows = []
  for (const s of SUBJECTS) for (const m of MODULES) {
    const a = thenM[s][m], b = nowM[s][m]
    if (a.answered >= 5 && b.answered >= 5) rows.push({ subject: s, module: m, then: { month: firstMonth, accuracy: a.accuracy }, now: { month: lastMonth, accuracy: b.accuracy }, change: b.accuracy - a.accuracy })
  }
  rows.sort((x, y) => y.change - x.change)
  return {
    then: { month: firstMonth, accuracy: thenT.accuracy, avgTimeSec: thenT.avgTimeSec, hintsPer100: thenT.answered ? Math.round((thenT.hints / thenT.answered) * 100) : null },
    now: { month: lastMonth, accuracy: nowT.accuracy, avgTimeSec: nowT.avgTimeSec, hintsPer100: nowT.answered ? Math.round((nowT.hints / nowT.answered) * 100) : null },
    areas: rows.slice(0, 4),
  }
}

// ── The report (PAR-071, PAR-072) ────────────────────────────────────────────
async function buildReport({ email, name, from, to, tz = 'UTC' }) {
  const range = q.parseRange({ from, to, cmp: 'prev', tz })
  const o = await q.overview([email], { from: range.from, to: range.to, cmp: 'prev', tz })
  const [streak, cal, src, sk, ai, ach, ms] = await Promise.all([
    q.streak(email, tz),
    q.calendar([email], Number(range.to.slice(0, 4))),
    bySource(email, range),
    skills(email, range),
    aiTeacher(email, range),
    StudentAchievement.find({ email }).sort({ earnedAt: -1 }).lean(),
    milestones(email, { to: range.to }),
  ])
  const matrix = q.matrix(o.days)
  const patterns = q.patterns(o.days)
  const who = name || 'Your child'
  const rangeLabel = `in these ${range.days} days`
  return {
    child: { name: who }, range, totals: o.cur, previous: o.prev, deltas: o.deltas, streak,
    series: q.series(o.days, range), matrix, patterns,
    story: buildStory({ cur: o.cur, prev: o.prev, who, rangeLabel }),
    insights: buildInsights({ cur: o.cur, prev: o.prev, matrix, patterns, streak, who, rangeDays: range.days }),
    calendar: cal.filter((d) => d.date >= range.from && d.date <= range.to),
    sources: src.sources, sourcesNote: src.note, skills: sk, aiTeacher: { minutes: ai.minutes, topics: ai.topics.slice(0, 8) },
    achievements: ach.filter((a) => a.earnedAt && a.earnedAt.toISOString().slice(0, 10) <= range.to).map((a) => { const def = ACHIEVEMENTS.find((x) => x.id === a.achievementId); return { id: a.achievementId, name: def?.name, icon: def?.icon, earnedAt: a.earnedAt } }),
    milestones: ms.filter((m) => m.date >= range.from && m.date <= range.to),
    generatedAt: new Date(),
  }
}

module.exports = { bySource, trends, skills, answers, aiTeacher, screenTime, arSummary, milestones, yearInReview, buildReport, thenVsNow, bankModel }
