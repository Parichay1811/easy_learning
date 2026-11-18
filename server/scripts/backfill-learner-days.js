/**
 * backfill-learner-days.js
 *
 * Builds LearnerDay rollups from the history that already exists
 * (StudentActivity sessions and StudentAnswer), so the new dashboards show past
 * weeks, months and years from day one. Safe to re-run: it only creates days that
 * don't exist yet, so live data is never overwritten. Run it right after deploying.
 * Dates use UTC (the old data has no timezone); new events use the learner's own.
 *
 * Usage:
 *   cd server
 *   node scripts/backfill-learner-days.js            # dry run, prints counts
 *   node scripts/backfill-learner-days.js --apply
 */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const mongoose = require('mongoose')
const LearnerDay = require('../models/analytics/LearnerDay')
const StudentActivity = require('../models/StudentActivity')
const StudentAnswer = require('../models/StudentAnswer')
const { localParts } = require('../analytics/record')

const APPLY = process.argv.includes('--apply')
const key = (s) => String(s || 'general').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30) || 'general'
const blank = (email, date) => ({
  email, date, tz: 'UTC', minutes: 0, sessions: 0, answered: 0, correct: 0, firstTry: 0, hints: 0, timeMsSum: 0, timedCount: 0, xp: 0, stars: 0,
  byModuleSubject: {}, byHour: {}, devices: {}, sources: {}, firstAt: null, lastAt: null,
})

async function build() {
  const days = new Map()
  const day = (email, date) => { const k = `${email}|${date}`; if (!days.has(k)) days.set(k, blank(email, date)); return days.get(k) }
  const ms = (d, m, s) => (d.byModuleSubject[`${key(m)}_${key(s)}`] ||= { answered: 0, correct: 0, minutes: 0 })
  const span = (d, ts) => { d.firstAt = !d.firstAt || ts < d.firstAt ? ts : d.firstAt; d.lastAt = !d.lastAt || ts > d.lastAt ? ts : d.lastAt }

  for await (const a of StudentActivity.find({}).lean().cursor()) {
    const email = String(a.email).toLowerCase()
    for (const s of a.sessions || []) {
      const ts = new Date(s.endTime || s.startTime || a.date)
      const { date, hour } = localParts(ts, 'UTC')
      const d = day(email, date)
      d.minutes += s.durationMinutes || 0; d.sessions += 1; d.xp += s.xpEarned || 0
      ms(d, s.module, s.subject).minutes += s.durationMinutes || 0
      d.byHour[hour] = (d.byHour[hour] || 0) + 1
      span(d, ts)
    }
  }
  for await (const a of StudentAnswer.find({}).lean().cursor()) {
    const email = String(a.email).toLowerCase()
    const ts = new Date(a.timestamp)
    const { date, hour } = localParts(ts, 'UTC')
    const d = day(email, date)
    d.answered += 1; if (a.correct) d.correct += 1
    if (a.timeTaken > 0) { d.timeMsSum += a.timeTaken * 1000; d.timedCount += 1 }
    const cell = ms(d, a.module, a.subject); cell.answered += 1; if (a.correct) cell.correct += 1
    d.byHour[hour] = (d.byHour[hour] || 0) + 1
    d.sources[a.mode || 'practice'] = (d.sources[a.mode || 'practice'] || 0) + 1
    span(d, ts)
  }
  return [...days.values()]
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI)
  const docs = await build()
  const learners = new Set(docs.map((d) => d.email)).size
  console.log(`${APPLY ? 'Applying' : 'Dry run'}: ${docs.length} learner-days for ${learners} learners`)
  if (APPLY) {
    for (let i = 0; i < docs.length; i += 500) {
      await LearnerDay.bulkWrite(docs.slice(i, i + 500).map((d) => ({
        // $setOnInsert: days that already have live data are left alone.
        updateOne: { filter: { email: d.email, date: d.date }, update: { $setOnInsert: d }, upsert: true },
      })))
    }
    console.log('Done.')
  } else console.log('Run again with --apply to write.')
  await mongoose.disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
