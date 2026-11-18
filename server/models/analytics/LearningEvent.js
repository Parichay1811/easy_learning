const mongoose = require('mongoose')

// Raw events behind the rollups (FND-040): they feed the usage log and
// timeline. Kept 24 months, then deleted; the rollups are kept for good.
const schema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  ts: { type: Date, required: true, default: Date.now },
  kind: { type: String, enum: ['answer', 'session', 'round', 'test', 'ai_teacher'], required: true },
  module: String,
  subject: String,
  correct: Boolean,
  timeMs: Number,
  minutes: Number,
  xp: Number,
  stars: Number,
  mode: String,       // practice | warrior
  source: String,     // practice | warrior | test | homework | ar | ai_teacher
  testId: String,
  topic: String,
  title: String,      // ai_teacher: the lesson's title from the pack (never the child's own words)
  device: { type: String, default: 'unknown' }, // phone | tablet | desktop | unknown
  os: String,
  browser: String,
  orgId: String,
}, { minimize: true })

schema.index({ email: 1, ts: -1 })
schema.index({ ts: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 730 })

module.exports = mongoose.model('LearningEvent', schema)
