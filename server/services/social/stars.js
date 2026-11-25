// Stars for teams and friends: one star is one right answer (StudentAnswer.correct), and at
// most `capPerDay` a day count per learner, so a long session never beats learning a little
// each day (roadmap guardrail: rewards follow learning, never time).
//
//   starsBy(emails, from, to, { capPerDay, subject }) -> Map(email -> { stars, raw, answered, days })
//   detail(emails, from, to, { subject })              -> Map(email -> the numbers behind the awards)
const StudentAnswer = require('../../models/StudentAnswer')

const lower = (s) => String(s || '').trim().toLowerCase()

const windowMatch = (emails, from, to, subject) => ({
  email: { $in: emails }, timestamp: { $gte: from, $lt: to },
  ...(subject ? { subject } : {}),
})

async function starsBy(emails, from, to, { capPerDay = Infinity, subject = '' } = {}) {
  const list = [...new Set((emails || []).map(lower).filter(Boolean))]
  const out = new Map(list.map((e) => [e, { stars: 0, raw: 0, answered: 0, days: 0, first: null }]))
  if (!list.length || !(from < to)) return out
  const rows = await StudentAnswer.aggregate([
    { $match: windowMatch(list, from, to, subject) },
    { $group: {
      _id: { email: '$email', day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } } },
      right: { $sum: { $cond: ['$correct', 1, 0] } }, answered: { $sum: 1 },
      first: { $min: { $cond: ['$correct', '$timestamp', null] } },
    } },
  ])
  for (const r of rows) {
    const row = out.get(lower(r._id.email))
    if (!row) continue
    row.raw += r.right
    row.stars += Math.min(r.right, capPerDay)
    row.answered += r.answered
    if (r.right > 0) row.days += 1
    if (r.first && (!row.first || r.first < row.first)) row.first = r.first
  }
  return out
}

// The moment a team's capped stars reached `goal` (or null): walks the answers in order.
async function reachedAt(emails, from, to, goal, { capPerDay = Infinity, subject = '' } = {}) {
  const list = [...new Set((emails || []).map(lower).filter(Boolean))]
  if (!list.length || !(goal > 0)) return null
  const rows = await StudentAnswer.find({ ...windowMatch(list, from, to, subject), correct: true }).select('email timestamp').sort({ timestamp: 1 }).lean()
  const perDay = new Map()
  let total = 0
  for (const r of rows) {
    const k = `${lower(r.email)}|${r.timestamp.toISOString().slice(0, 10)}`
    const n = perDay.get(k) || 0
    if (n >= capPerDay) continue
    perDay.set(k, n + 1)
    total += 1
    if (total >= goal) return r.timestamp
  }
  return null
}

// The numbers behind the personal awards, per learner, from their own answers in the window:
//   right, answered, noHint (right without a hint), comebacks (a right answer after two or
//   more misses in a row), firstHalf / secondHalf accuracy, areas (different subject x skill
//   places tried), reviews (right answers in review rounds are not marked on the answer, so
//   this stays 0 unless the answer's mode says so).
async function detail(emails, from, to, { subject = '' } = {}) {
  const list = [...new Set((emails || []).map(lower).filter(Boolean))]
  const blank = () => ({ right: 0, answered: 0, noHint: 0, comebacks: 0, areas: 0, first: null, firstHalf: null, secondHalf: null, improved: 0 })
  const out = new Map(list.map((e) => [e, blank()]))
  if (!list.length || !(from < to)) return out
  const rows = await StudentAnswer.find(windowMatch(list, from, to, subject)).select('email correct hintsUsed timestamp subject module').sort({ timestamp: 1 }).lean()
  const mid = new Date((from.getTime() + Math.min(to.getTime(), Date.now())) / 2)
  const work = new Map(list.map((e) => [e, { misses: 0, areas: new Set(), h1: [0, 0], h2: [0, 0] }]))
  for (const r of rows) {
    const e = lower(r.email)
    const o = out.get(e); const w = work.get(e)
    if (!o) continue
    o.answered += 1
    w.areas.add(`${r.subject}|${r.module}`)
    const half = r.timestamp < mid ? w.h1 : w.h2
    half[1] += 1
    if (r.correct) {
      o.right += 1
      half[0] += 1
      if (!r.hintsUsed) o.noHint += 1
      if (w.misses >= 2) o.comebacks += 1
      w.misses = 0
      if (!o.first) o.first = r.timestamp
    } else {
      w.misses += 1
    }
  }
  for (const [e, o] of out) {
    const w = work.get(e)
    o.areas = w.areas.size
    // Accuracy needs a few answers on each side to mean anything.
    if (w.h1[1] >= 5 && w.h2[1] >= 5) {
      o.firstHalf = Math.round((w.h1[0] / w.h1[1]) * 100)
      o.secondHalf = Math.round((w.h2[0] / w.h2[1]) * 100)
      o.improved = o.secondHalf - o.firstHalf
    }
  }
  return out
}

module.exports = { starsBy, reachedAt, detail }
