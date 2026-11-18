// The learner's side of the family features (behind dashboardAuth, so only the
// signed-in learner's own data): their goal and reward, healthy-use state,
// cheers from their guardians, and the AI Teacher usage log (FND-045).
const Cheer = require('../models/Cheer')
const LearnerDay = require('../models/analytics/LearnerDay')
const LearningEvent = require('../models/analytics/LearningEvent')
const fam = require('../services/parentFamily')
const { contextFrom, localParts } = require('../analytics/record')

const handle = (fn) => async (req, res) => {
  try { await fn(req, res) } catch (err) {
    console.error('learnerFamily error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
const emailOf = (req) => String(req.user?.email || '').toLowerCase()
const tzOf = (req) => contextFrom(req).tz

// GET /api/dashboard/family
const getFamily = handle(async (req, res) => {
  const email = emailOf(req)
  const tz = tzOf(req)
  const rows = email ? await fam.verifiedRows(email) : []
  if (!rows.length) return res.json({ success: true, linked: false, goal: null, progress: null, healthy: null, cheers: [] })
  const goalRow = rows.filter((r) => r.weeklyGoal?.minutesPerDay).sort((a, b) => (b.weeklyGoal.setAt || 0) - (a.weeklyGoal.setAt || 0))[0]
  const goal = goalRow?.weeklyGoal || null
  const [progress, healthy, cheers] = await Promise.all([
    goal ? fam.goalProgress(email, goal, tz) : null,
    fam.healthyState(email, rows, tz),
    Cheer.find({ learnerEmail: email, seenAt: null }).sort({ createdAt: -1 }).limit(5),
  ])
  res.json({
    success: true, linked: true,
    goal: goal && { minutesPerDay: goal.minutesPerDay, daysPerWeek: goal.daysPerWeek, reward: goal.reward, rewardEmoji: goal.rewardEmoji },
    progress, healthy,
    cheers: cheers.map((c) => ({ id: String(c._id), sticker: c.sticker, message: c.message, fromName: c.fromName, hasVoice: c.hasVoice, createdAt: c.createdAt })),
  })
})

// POST /api/dashboard/cheers/:id/seen
const markCheerSeen = handle(async (req, res) => {
  if (!/^[a-f0-9]{24}$/i.test(req.params.id)) return res.status(404).json({ success: false, message: 'Not found' })
  const r = await Cheer.updateOne({ _id: req.params.id, learnerEmail: emailOf(req) }, { $set: { seenAt: new Date() } })
  if (!r.matchedCount) return res.status(404).json({ success: false, message: 'Not found' })
  res.json({ success: true })
})

// GET /api/dashboard/cheers/:id/voice
const cheerVoice = handle(async (req, res) => {
  if (!/^[a-f0-9]{24}$/i.test(req.params.id)) return res.status(404).end()
  const c = await Cheer.findOne({ _id: req.params.id, learnerEmail: emailOf(req), hasVoice: true }).select('+voice voiceType')
  if (!c?.voice) return res.status(404).end()
  res.set('Content-Type', c.voiceType || 'audio/webm')
  res.set('Cache-Control', 'private, max-age=3600')
  res.send(c.voice)
})

// POST /api/dashboard/ai-teacher-log { topic, title?, subject, seconds }
// The topic is the lesson id from the knowledge pack (e.g. PHYS-DYN-01), never
// what the child typed; free text is not stored (FND-045).
const TOPIC = /^[A-Za-z0-9][A-Za-z0-9_./-]{0,60}$/
const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n)
const aiTeacherLog = handle(async (req, res) => {
  const email = emailOf(req)
  const { topic, title, subject } = req.body || {}
  const seconds = Math.round(Number(req.body?.seconds))
  if (!email) return res.status(400).json({ success: false, message: 'No learner' })
  if (!TOPIC.test(String(topic || ''))) return res.status(400).json({ success: false, message: 'Unknown topic' })
  if (!Number.isFinite(seconds) || seconds < 5) return res.json({ success: true, skipped: true })
  const secs = Math.min(seconds, 30 * 60) // one report covers at most 30 minutes
  const minutes = Math.round((secs / 60) * 10) / 10
  const ctx = contextFrom(req)
  const ts = new Date()
  const { date, hour } = localParts(ts, ctx.tz)
  const subj = clean(subject, 40) || 'general'
  await Promise.all([
    LearningEvent.create({ email, ts, kind: 'ai_teacher', topic: String(topic), subject: subj, title: clean(title, 80) || undefined, minutes, source: 'ai_teacher', device: ctx.device, os: ctx.os, browser: ctx.browser }),
    // Active time counts it, like any other learning, in the same rollup.
    LearnerDay.updateOne(
      { email, date },
      { $inc: { minutes, [`byHour.${hour}`]: 1, [`devices.${ctx.device || 'unknown'}`]: 1, 'sources.ai_teacher': 1 }, $set: { tz: ctx.tz, lastAt: ts }, $min: { firstAt: ts } },
      { upsert: true },
    ),
  ])
  res.json({ success: true })
})

module.exports = { getFamily, markCheerSeen, cheerVoice, aiTeacherLog }
