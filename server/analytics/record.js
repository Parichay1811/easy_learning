// Writes learning events: one raw event plus an atomic $inc on the learner's
// LearnerDay. Never throws into the request: analytics must not break learning.
const LearnerDay = require('../models/analytics/LearnerDay')
const LearningEvent = require('../models/analytics/LearningEvent')

const safeKey = (s) => String(s || 'general').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30) || 'general'

function validTz(tz) {
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return tz } catch { return 'UTC' }
}

// Local calendar date and hour for an instant in a timezone.
function localParts(ts, tz = 'UTC') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: validTz(tz), year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(ts)
  const get = (t) => parts.find((p) => p.type === t).value
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour: String(Number(get('hour'))) }
}

function parseDevice(ua = '') {
  const s = String(ua)
  const type = /iPad|Tablet|Nexus 7|SM-T/i.test(s) ? 'tablet' : /Mobi|iPhone|Android/i.test(s) ? 'phone' : s ? 'desktop' : 'unknown'
  const os = /Windows/.test(s) ? 'Windows' : /iPhone|iPad|iOS/.test(s) ? 'iOS' : /Android/.test(s) ? 'Android' : /Mac OS X/.test(s) ? 'macOS' : /Linux/.test(s) ? 'Linux' : ''
  const browser = /Edg\//.test(s) ? 'Edge' : /Chrome\//.test(s) ? 'Chrome' : /Firefox\//.test(s) ? 'Firefox' : /Safari\//.test(s) ? 'Safari' : ''
  return { device: type, os, browser }
}

// From an Express request: the learner's timezone (X-Timezone header) and device.
const contextFrom = (req) => ({ tz: validTz(req.get?.('x-timezone') || 'UTC'), ...parseDevice(req.get?.('user-agent') || '') })

async function bump({ email, ts = new Date(), tz = 'UTC', device = 'unknown', source = 'practice', inc = {}, ms = null }) {
  const { date, hour } = localParts(ts, tz)
  const $inc = { [`byHour.${hour}`]: 1, [`devices.${safeKey(device)}`]: 1, [`sources.${safeKey(source)}`]: 1 }
  for (const [k, v] of Object.entries(inc)) if (v) $inc[k] = v
  if (ms) {
    $inc[`byModuleSubject.${ms.key}.answered`] = ms.answered || 0
    $inc[`byModuleSubject.${ms.key}.correct`] = ms.correct || 0
    $inc[`byModuleSubject.${ms.key}.minutes`] = ms.minutes || 0
  }
  await LearnerDay.updateOne(
    { email, date },
    { $inc, $set: { tz, lastAt: ts }, $min: { firstAt: ts } },
    { upsert: true },
  )
}

async function guard(fn) {
  try { await fn() } catch (err) { console.error('analytics record failed:', err.message) }
}

function recordAnswer(e) {
  return guard(async () => {
    const email = String(e.email || '').toLowerCase()
    if (!email) return
    const { module: m, subject: s, correct, timeMs, mode = 'practice', source, hintsUsed = 0, firstTry = null, ts = new Date(), testId, orgId } = e
    const key = `${safeKey(m)}_${safeKey(s)}`
    const timed = Number.isFinite(timeMs) && timeMs > 0
    await Promise.all([
      bump({
        email, ts, tz: e.tz, device: e.device, source: source || (testId ? 'test' : mode),
        inc: {
          answered: 1, correct: correct ? 1 : 0, hints: hintsUsed, firstTry: firstTry === true && correct ? 1 : 0,
          timeMsSum: timed ? Math.round(timeMs) : 0, timedCount: timed ? 1 : 0,
        },
        ms: { key, answered: 1, correct: correct ? 1 : 0 },
      }),
      LearningEvent.create({ email, ts, kind: 'answer', module: m, subject: s, correct: !!correct, timeMs: timed ? Math.round(timeMs) : undefined, mode, source: source || (testId ? 'test' : mode), testId, device: e.device, os: e.os, browser: e.browser, orgId }),
    ])
  })
}

function recordSession(e) {
  return guard(async () => {
    const email = String(e.email || '').toLowerCase()
    if (!email) return
    const { module: m, subject: s, minutes = 0, xp = 0, mode, source, ts = new Date(), orgId } = e
    const key = `${safeKey(m)}_${safeKey(s)}`
    await Promise.all([
      bump({ email, ts, tz: e.tz, device: e.device, source: source || mode || 'practice', inc: { minutes, sessions: 1, xp }, ms: { key, minutes } }),
      LearningEvent.create({ email, ts, kind: 'session', module: m, subject: s, minutes, xp, mode, source: source || mode || 'practice', device: e.device, os: e.os, browser: e.browser, orgId }),
    ])
  })
}

function recordRound(e) {
  return guard(async () => {
    const email = String(e.email || '').toLowerCase()
    if (!email) return
    const { module: m, subject: s, mode = 'practice', stars = 0, totalStars = 0, ts = new Date(), orgId } = e
    await Promise.all([
      bump({ email, ts, tz: e.tz, device: e.device, source: mode, inc: { stars: totalStars || stars } }),
      LearningEvent.create({ email, ts, kind: 'round', module: m, subject: s, stars: totalStars || stars, mode, source: mode, device: e.device, os: e.os, browser: e.browser, orgId }),
    ])
  })
}

module.exports = { recordAnswer, recordSession, recordRound, contextFrom, localParts, parseDevice, validTz }
