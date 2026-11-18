const mongoose = require('mongoose')

// One document per learner per local day, updated with $inc as events arrive
// (FND-043). Weekly, monthly and yearly views are sums of these, so a page
// never scans raw events. Keyed by email like the rest of the learner data.
const schema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  date: { type: String, required: true }, // YYYY-MM-DD in the learner's timezone
  tz: { type: String, default: 'UTC' },
  minutes: { type: Number, default: 0 },
  sessions: { type: Number, default: 0 },
  answered: { type: Number, default: 0 },
  correct: { type: Number, default: 0 },
  firstTry: { type: Number, default: 0 },
  hints: { type: Number, default: 0 },
  timeMsSum: { type: Number, default: 0 },
  timedCount: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  stars: { type: Number, default: 0 },
  // { 'listen_english': { answered, correct, minutes } }
  byModuleSubject: { type: mongoose.Schema.Types.Mixed, default: {} },
  // { '13': 4 } : events per local hour
  byHour: { type: mongoose.Schema.Types.Mixed, default: {} },
  devices: { type: mongoose.Schema.Types.Mixed, default: {} },
  sources: { type: mongoose.Schema.Types.Mixed, default: {} },
  firstAt: { type: Date },
  lastAt: { type: Date },
}, { minimize: false })

schema.index({ email: 1, date: 1 }, { unique: true })
schema.index({ date: 1 })

module.exports = mongoose.model('LearnerDay', schema)
