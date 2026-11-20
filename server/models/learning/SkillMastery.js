const mongoose = require('mongoose')
const cfg = require('../../config/learning')

// One learner's state on one skill (services/learning/mastery.js): mastery,
// Leitner box, teaching-support step. One row per (email, skill), so answers
// on different skills update different documents.
// No raw answers are kept: `misconceptions` holds at most a few
// distractor-insight texts FROM THE CONTENT (checked against the question),
// never anything the learner typed.
const schema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  skill: { type: String, required: true },
  subject: { type: String, enum: cfg.SUBJECTS, required: true },
  name: { type: String, default: '' }, // English name (catalogue or question), for views
  level: { type: Number, min: cfg.MIN_LEVEL, max: cfg.MAX_LEVEL, default: null },

  mastery: { type: Number, min: 0, max: 1, default: 0 },
  attempts: { type: Number, default: 0 }, // graded attempts only
  correct: { type: Number, default: 0 },
  independent: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  missesSinceSuccess: { type: Number, default: 0 },

  // Spaced repetition (config.leitnerDays)
  box: { type: Number, min: 0, max: cfg.leitnerDays.length - 1, default: 0 },
  due: { type: Date, default: null },

  // Teaching escalation (config.strategies)
  supportStep: { type: Number, min: 0, max: cfg.strategies.length - 1, default: 0 },
  missesAtStep: { type: Number, default: 0 },
  parkedUntil: { type: Date, default: null },
  helpedBy: { type: String, default: null }, // the strategy before the last success after a struggle

  lastOutcome: { type: String, enum: ['independent', 'assisted', 'close', 'incorrect', null], default: null },
  lastAt: { type: Date, default: null },
  lastCorrectAt: { type: Date, default: null },
  lastMissAt: { type: Date, default: null },
  masteredAt: { type: Date, default: null },
  modules: { type: [String], default: [] },
  // q/module: the bank question (content id) of the most recent occurrence, for its parent note / teacher action.
  misconceptions: { type: [new mongoose.Schema({ text: String, count: Number, at: Date, q: String, module: String }, { _id: false })], default: [] },
}, { timestamps: true })

schema.index({ email: 1, skill: 1 }, { unique: true })
schema.index({ email: 1, subject: 1 })

module.exports = mongoose.models.SkillMastery || mongoose.model('SkillMastery', schema)
