const mongoose = require('mongoose')

const sessionSchema = new mongoose.Schema({
  startTime: { type: Date, required: true },
  endTime:   { type: Date, required: true },
  durationMinutes: { type: Number, default: 0 },
  module:  { type: String, default: 'general' }, // listen|read|write|speak|spelling|memory|puzzle|learn
  subject: { type: String, default: 'general' }, // english|maths|science|general
  xpEarned: { type: Number, default: 0 },
  score:    { type: Number, default: 0 }, // 0–100 percentage
}, { _id: false })

const studentActivitySchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  // The learner's own calendar day, stored as UTC midnight of that date (see dayKey below):
  // a round played on 24 November in Los Angeles or in Kolkata is 2026-11-24T00:00:00.000Z.
  // Read it back as a calendar date (its UTC year-month-day), never through local time.
  // Rows from before late November 2026 were keyed by the UTC day of the instant.
  date:  { type: Date, required: true },
  sessions: [sessionSchema],
  totalMinutes: { type: Number, default: 0 },
  totalXP:      { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },
}, { timestamps: true })

studentActivitySchema.index({ email: 1, date: 1 }, { unique: true })

// 'YYYY-MM-DD' of an instant in a timezone (an unknown timezone counts as UTC).
function localDateOf(now = new Date(), tz = 'UTC') {
  const fmt = (timeZone) => new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  let parts
  try { parts = fmt(tz || 'UTC') } catch { parts = fmt('UTC') }
  const get = (t) => parts.find((p) => p.type === t).value
  return `${get('year')}-${get('month')}-${get('day')}`
}

/**
 * The day a learner's activity belongs to: THEIR calendar date at `now` (tz = the X-Timezone
 * header), as UTC midnight of that date. Every writer of StudentActivity uses this for `date`.
 *   dayKey(new Date('2026-11-25T03:00:00Z'), 'America/Los_Angeles') -> 2026-11-24T00:00:00.000Z
 */
function dayKey(now = new Date(), tz = 'UTC') {
  return new Date(`${localDateOf(now, tz)}T00:00:00.000Z`)
}
studentActivitySchema.statics.dayKey = dayKey
studentActivitySchema.statics.localDateOf = localDateOf

module.exports = mongoose.model('StudentActivity', studentActivitySchema)
