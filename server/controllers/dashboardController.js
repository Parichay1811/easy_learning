const { recordAnswer, recordSession, recordRound, contextFrom } = require('../analytics/record')
const StudentActivity   = require('../models/StudentActivity')
const StudentAchievement = require('../models/StudentAchievement')
const StudentAnswer      = require('../models/StudentAnswer')
const StudentRound       = require('../models/StudentRound')
const { processAnswer }  = require('../services/learning/engine')
const growth = require('../services/learning/achievements')

// ── Achievement definitions ────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: 'first_step',      name: 'First Step',      icon: '🌟', description: 'Complete your first lesson', category: 'learning', xp: 10 },
  { id: 'bookworm',        name: 'Bookworm',         icon: '📚', description: 'Complete 5 reading lessons', category: 'learning', xp: 25 },
  { id: 'sharp_ears',      name: 'Sharp Ears',       icon: '👂', description: 'Complete 5 listening lessons', category: 'learning', xp: 25 },
  { id: 'penpal',          name: 'Penpal',           icon: '✍️', description: 'Complete 5 writing lessons', category: 'learning', xp: 25 },
  { id: 'public_speaker',  name: 'Public Speaker',   icon: '🎤', description: 'Complete 5 speaking lessons', category: 'learning', xp: 25 },
  { id: 'all_rounder',     name: 'All-Rounder',      icon: '🌈', description: 'Try all 3 subjects', category: 'learning', xp: 40 },
  // Retired: no longer awarded; badges already earned stay visible. Streak badges punish a missed day and
  // XP badges reward time spent, and learning is not rewarded for the hour of the day (docs/learning/GAME-ROADMAP.md G-006).
  { id: 'three_day_streak', name: 'On Fire',         icon: '🔥', description: 'Active 3 days in a row', category: 'streak', xp: 50, retired: true },
  { id: 'week_warrior',    name: 'Week Warrior',     icon: '⚔️', description: 'Active 7 days in a row', category: 'streak', xp: 100, retired: true },
  { id: 'century',         name: 'Century',          icon: '💯', description: 'Earn 100 XP', category: 'xp', xp: 0, retired: true },
  { id: 'champion',        name: 'Champion',         icon: '🏆', description: 'Earn 500 XP', category: 'xp', xp: 0, retired: true },
  { id: 'early_bird',      name: 'Early Bird',       icon: '🐦', description: 'Study before 8 AM', category: 'special', xp: 20, retired: true },
  { id: 'night_owl',       name: 'Night Owl',        icon: '🦉', description: 'Study after 9 PM', category: 'special', xp: 20, retired: true },
  // Growth badges (services/learning/achievements.js): awarded from log-answer with their evidence.
  ...growth.listEntries(),
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function midnight(d = new Date()) {
  const dt = new Date(d)
  dt.setUTCHours(0, 0, 0, 0)
  return dt
}

const clampNum = (v, lo, hi) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo }
const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10
// Most minutes one answered question can add (a learner who walks away does not keep counting).
const ANSWER_MAX_MINUTES = 3
// Most minutes one round can show as its length.
const ROUND_MAX_MINUTES = 60

function calcStreak(activityDocs) {
  if (!activityDocs.length) return 0
  const dates = activityDocs
    .map(a => midnight(a.date).getTime())
    .sort((a, b) => b - a)

  const todayMs = midnight().getTime()
  let streak = 0
  for (let i = 0; i < dates.length; i++) {
    const expected = todayMs - i * 86400000
    if (dates[i] === expected) streak++
    else break
  }
  return streak
}

// Days with any learning in the last 7 days, today included (UTC days, like calcStreak).
// Shown instead of a streak: nothing is lost by missing a day.
function daysThisWeek(activityDocs, now = new Date()) {
  const todayMs = midnight(now).getTime()
  const since = todayMs - 6 * 86400000
  const days = new Set()
  for (const a of activityDocs) {
    const d = midnight(a.date).getTime()
    if (d >= since && d <= todayMs && ((a.totalSessions || 0) > 0 || (a.totalMinutes || 0) > 0 || (a.totalXP || 0) > 0)) days.add(d)
  }
  return days.size
}

async function checkAndAwardAchievements(email) {
  const [allActivity, earned] = await Promise.all([
    StudentActivity.find({ email }),
    StudentAchievement.find({ email }).select('achievementId'),
  ])
  const earnedSet = new Set(earned.map(a => a.achievementId))

  const totalSessions = allActivity.reduce((s, a) => s + a.totalSessions, 0)

  const moduleCounts = {}
  const subjects = new Set()
  allActivity.forEach(day => {
    day.sessions.forEach(s => {
      moduleCounts[s.module] = (moduleCounts[s.module] || 0) + 1
      if (s.subject && s.subject !== 'general') subjects.add(s.subject)
    })
  })

  const newAchievements = []
  const award = async (id) => {
    if (!earnedSet.has(id)) {
      try {
        await StudentAchievement.create({ email, achievementId: id, earnedAt: new Date() })
        newAchievements.push(id)
      } catch (_) {}
    }
  }

  if (totalSessions >= 1)  await award('first_step')
  if ((moduleCounts['read']  || 0) >= 5) await award('bookworm')
  if ((moduleCounts['listen'] || 0) >= 5) await award('sharp_ears')
  if ((moduleCounts['write'] || 0) >= 5) await award('penpal')
  if ((moduleCounts['speak'] || 0) >= 5) await award('public_speaker')
  if (subjects.size >= 3)  await award('all_rounder')

  // three_day_streak / week_warrior / century / champion / early_bird / night_owl are no longer awarded (see ACHIEVEMENTS).

  return newAchievements
}

// New badge ids -> what the page needs to show them ({ id, name, icon, description, category }).
const badgeCards = (ids) => (ids || [])
  .map((id) => ACHIEVEMENTS.find((d) => d.id === id))
  .filter(Boolean)
  .map(({ id, name, icon, description, category }) => ({ id, name, icon, description, category }))

// ── Controllers ────────────────────────────────────────────────────────────────

const logSession = async (req, res) => {
  try {
    const { email } = req.user
    const { module: mod, subject, durationMinutes, xpEarned, score, startTime } = req.body

    if (!mod) return res.status(400).json({ success: false, message: 'module is required' })

    const now     = new Date()
    const start   = startTime ? new Date(startTime) : new Date(now - (durationMinutes || 1) * 60000)
    const dayKey  = midnight(now)

    // One answered question (kind 'answer'): its XP and its real minutes (capped, so an idle tab does not
    // count) go on the day, but it is not a session: the round it belongs to is (logRound). Older clients
    // send neither kind nor real minutes and keep the old behaviour.
    if (req.body.kind === 'answer') {
      const minutes = clampNum(durationMinutes, 0, ANSWER_MAX_MINUTES)
      const xp = clampNum(xpEarned, 0, 100)
      await StudentActivity.findOneAndUpdate(
        { email, date: dayKey },
        { $inc: { totalMinutes: minutes, totalXP: xp } },
        { upsert: true, new: true }
      )
      await recordSession({ email, module: mod, subject, minutes, xp, ts: now, countSession: false, ...contextFrom(req) })
      return res.json({ success: true, newAchievements: [] })
    }

    const sessionEntry = {
      startTime: start,
      endTime: now,
      durationMinutes: durationMinutes || 0,
      module: mod,
      subject: subject || 'general',
      xpEarned: xpEarned || 0,
      score: score || 0,
    }

    await StudentActivity.findOneAndUpdate(
      { email, date: dayKey },
      {
        $push: { sessions: sessionEntry },
        $inc: {
          totalMinutes: durationMinutes || 0,
          totalXP: xpEarned || 0,
          totalSessions: 1,
        },
      },
      { upsert: true, new: true }
    )

    await recordSession({ email, module: mod, subject, minutes: durationMinutes || 0, xp: xpEarned || 0, ts: now, ...contextFrom(req) })

    const newAchievements = await checkAndAwardAchievements(email)
    res.json({ success: true, newAchievements, badges: badgeCards(newAchievements) })
  } catch (err) {
    console.error('logSession error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getStats = async (req, res) => {
  try {
    const { email } = req.user
    const [allActivity, achievements] = await Promise.all([
      StudentActivity.find({ email }),
      StudentAchievement.find({ email }),
    ])

    const totalXP       = allActivity.reduce((s, a) => s + a.totalXP, 0)
    const totalMinutes  = Math.round(allActivity.reduce((s, a) => s + a.totalMinutes, 0))
    const totalSessions = allActivity.reduce((s, a) => s + a.totalSessions, 0)
    const streak        = calcStreak(allActivity)
    const daysLearnedThisWeek = daysThisWeek(allActivity)

    const todayDoc = allActivity.find(a => midnight(a.date).getTime() === midnight().getTime())
    const todayMinutes = Math.round(todayDoc?.totalMinutes || 0)
    const todayXP      = todayDoc?.totalXP || 0

    const hourBuckets = new Array(24).fill(0)
    allActivity.forEach(day => {
      day.sessions.forEach(s => {
        if (s.startTime) hourBuckets[new Date(s.startTime).getHours()]++
      })
    })
    const maxHour = hourBuckets.indexOf(Math.max(...hourBuckets))
    const peakLabel = `${maxHour % 12 || 12}${maxHour < 12 ? 'AM' : 'PM'} – ${(maxHour + 2) % 12 || 12}${(maxHour + 2) < 12 ? 'AM' : 'PM'}`

    const level = Math.floor(totalXP / 100) + 1

    res.json({
      success: true,
      data: {
        totalXP, totalMinutes, totalSessions, streak, daysThisWeek: daysLearnedThisWeek,
        todayMinutes, todayXP,
        peakTimeLabel: hourBuckets.every(b => b === 0) ? null : peakLabel,
        level,
        achievementCount: achievements.length,
      },
    })
  } catch (err) {
    console.error('getStats error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getActivity = async (req, res) => {
  try {
    const { email } = req.user
    let dateFilter

    if (req.query.year) {
      const y = parseInt(req.query.year)
      dateFilter = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) }
    } else {
      const days = parseInt(req.query.days) || 365
      const since = new Date()
      since.setDate(since.getDate() - days)
      dateFilter = { $gte: since }
    }

    const activity = await StudentActivity.find({ email, date: dateFilter })
      .select('date totalMinutes totalXP totalSessions')
      .lean()

    res.json({ success: true, data: activity.map((a) => ({ ...a, totalMinutes: Math.round(a.totalMinutes || 0) })) })
  } catch (err) {
    console.error('getActivity error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getAchievements = async (req, res) => {
  try {
    const { email } = req.user
    const earned = await StudentAchievement.collection.find({ email: String(email).toLowerCase() }).toArray()
    const earnedMap = {}
    earned.forEach(a => { earnedMap[a.achievementId] = a })

    // Retired badges show only when earned; growth badges carry their evidence ({ key, params, text }).
    const result = ACHIEVEMENTS.filter(def => !def.retired || earnedMap[def.id]).map(def => {
      const got = earnedMap[def.id]
      const out = { ...def, earned: !!got, earnedAt: got?.earnedAt || null }
      if (def.category === 'growth') {
        const view = growth.badgeView(def.id, got?.evidence || {})
        out.key = view.key
        out.desc = view.desc
        if (got) out.evidence = view.evidence
      }
      return out
    })

    res.json({ success: true, data: result })
  } catch (err) {
    console.error('getAchievements error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getPerformance = async (req, res) => {
  try {
    const { email } = req.user
    const days = parseInt(req.query.days) || 30
    const since = new Date()
    since.setDate(since.getDate() - days)

    const activity = await StudentActivity.find({ email, date: { $gte: since } })
      .select('date totalXP totalSessions totalMinutes')
      .sort({ date: 1 })
      .lean()

    res.json({ success: true, data: activity.map((a) => ({ ...a, totalMinutes: Math.round(a.totalMinutes || 0) })) })
  } catch (err) {
    console.error('getPerformance error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// Answers are stored as text; a structured answer (e.g. a speech result object) is kept as short JSON.
const answerText = (v) => (v == null ? '' : typeof v === 'string' ? v : JSON.stringify(v).slice(0, 500))

// Old body: { module, subject, question, userAnswer, correctAnswer, correct, xpEarned, timeTaken, mode, questionId, topic, hintsUsed }.
// New body adds { status, firstTry, hintsUsed, supportStep, misconception, uncertain } for the learning
// engine (services/learning/engine.js) and the reply adds `learn` (skill, mastery, support, message).
// An "uncertain" answer (speech not heard, microphone blocked) is never counted: not stored as right
// or wrong and not in the analytics.
const logAnswer = async (req, res) => {
  try {
    const { email } = req.user
    const { module: mod, subject, question, userAnswer, correctAnswer, correct, xpEarned, timeTaken, mode } = req.body
    const uncertain = req.body.status === 'uncertain' || req.body.uncertain === true
    if (!uncertain) {
      await StudentAnswer.create({
        email,
        module: mod || 'unknown',
        subject: subject || 'general',
        question: question || '',
        userAnswer: answerText(userAnswer),
        correctAnswer: answerText(correctAnswer),
        correct: !!correct,
        xpEarned: xpEarned || 0,
        timeTaken: (typeof timeTaken === 'number' && timeTaken > 0) ? timeTaken : null,
        mode: mode || 'practice',
        questionId: typeof req.body.questionId === 'string' ? req.body.questionId.slice(0, 60) : Number.isInteger(req.body.questionId) ? String(req.body.questionId) : null,
        topic: typeof req.body.topic === 'string' ? req.body.topic.slice(0, 80) : null,
        hintsUsed: Math.max(0, Math.min(10, Number(req.body.hintsUsed) || 0)),
      })
      await recordAnswer({
        email, module: mod, subject, correct: !!correct, mode: mode || 'practice',
        timeMs: (typeof timeTaken === 'number' && timeTaken > 0) ? timeTaken * 1000 : null, // client sends seconds
        hintsUsed: Number(req.body.hintsUsed) || 0, firstTry: req.body.firstTry ?? null, testId: req.body.testId,
        ...contextFrom(req),
      })
    }
    // The adaptive engine never breaks answer logging.
    let learn = null
    try {
      learn = await processAnswer(email, req.body, { tz: contextFrom(req).tz })
    } catch (err) {
      console.error('learning engine error:', err.message)
    }
    res.json({ success: true, learn })
  } catch (err) {
    console.error('logAnswer error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getAnswers = async (req, res) => {
  try {
    const { email } = req.user
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)
    const answers = await StudentAnswer.find({ email })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean()
    res.json({ success: true, data: answers })
  } catch (err) {
    console.error('getAnswers error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getModuleStars = async (req, res) => {
  try {
    const { email } = req.user
    const activity = await StudentActivity.find({ email }).select('sessions').lean()

    const totals = {}
    activity.forEach(day => {
      day.sessions.forEach(s => {
        const key = s.subject && s.subject !== 'general'
          ? `${s.module}_${s.subject}`
          : s.module
        if (!totals[key]) totals[key] = { sum: 0, count: 0 }
        totals[key].sum += (s.score || 0)
        totals[key].count += 1
      })
    })

    const stars = {}
    Object.entries(totals).forEach(([key, { sum, count }]) => {
      const avg = sum / count
      stars[key] = avg >= 84 ? 3 : avg >= 66 ? 2 : avg >= 33 ? 1 : 0
    })

    res.json({ success: true, data: stars })
  } catch (err) {
    console.error('getModuleStars error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const logRound = async (req, res) => {
  try {
    const { email } = req.user
    const { module: mod, subject, mode, stars, bonusStars, totalStars, passed } = req.body
    // Newer clients send the round's length in questions and minutes: the round is then one session with
    // its real length, and its XP and minutes are not added again (each answer already added its own).
    const questions = Number.isInteger(req.body.questions) && req.body.questions > 0 ? Math.min(req.body.questions, 50) : null

    await StudentRound.create({
      email,
      module: mod || 'unknown',
      subject: subject || 'general',
      mode: mode || 'practice',
      stars: stars || 0,
      bonusStars: bonusStars || 0,
      totalStars: totalStars || 0,
      passed: passed ?? null,
    })

    const dayKey = midnight()
    if (questions) {
      const now = new Date()
      const minutes = round1(clampNum(req.body.durationMinutes, 0, ROUND_MAX_MINUTES))
      const right = Math.min(Math.max(0, Number(stars) || 0), questions)
      const xpEarned = Math.max(0, Math.min(Number(req.body.xpEarned) || 0, questions * 100))
      await StudentActivity.findOneAndUpdate(
        { email, date: dayKey },
        {
          $push: { sessions: { startTime: new Date(now - minutes * 60000), endTime: now, durationMinutes: minutes, module: mod || 'unknown', subject: subject || 'general', xpEarned, score: Math.round((right / questions) * 100) } },
          $inc: { totalSessions: 1 },
        },
        { upsert: true, new: true }
      )
      await recordRound({ email, module: mod, subject, mode: mode || 'practice', stars: stars || 0, totalStars: totalStars || 0, countSession: true, ...contextFrom(req) })
    } else {
      // Older clients: 10 XP per correct answer + 2 per bonus star, a fixed 5 minutes.
      const xpEarned = (stars || 0) * 10 + (bonusStars || 0) * 2
      await StudentActivity.findOneAndUpdate(
        { email, date: dayKey },
        {
          $push: { sessions: { startTime: new Date(), endTime: new Date(), durationMinutes: 5, module: mod || 'unknown', subject: subject || 'general', xpEarned, score: Math.round(((stars || 0) / 10) * 100) } },
          $inc: { totalMinutes: 5, totalXP: xpEarned, totalSessions: 1 },
        },
        { upsert: true, new: true }
      )
      // Stars only: minutes come from real session durations (logSession), not the fixed 5 above.
      await recordRound({ email, module: mod, subject, mode: mode || 'practice', stars: stars || 0, totalStars: totalStars || 0, ...contextFrom(req) })
    }

    // The page shows new badges when the round ends (badges: what it needs to show them).
    const newAchievements = await checkAndAwardAchievements(email)
    res.json({ success: true, newAchievements, badges: badgeCards(newAchievements) })
  } catch (err) {
    console.error('logRound error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getRounds = async (req, res) => {
  try {
    const { email } = req.user
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)
    const rounds = await StudentRound.find({ email })
      .sort({ completedAt: -1 })
      .limit(limit)
      .lean()
    res.json({ success: true, data: rounds })
  } catch (err) {
    console.error('getRounds error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { ACHIEVEMENTS, logSession, getStats, getActivity, getAchievements, getPerformance, getModuleStars, logAnswer, getAnswers, logRound, getRounds }
