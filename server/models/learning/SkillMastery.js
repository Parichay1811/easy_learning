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
  // explained: the count when it was last explained; resolvedAt: two right answers in a row after its last occurrence.
  misconceptions: { type: [new mongoose.Schema({ text: String, count: Number, at: Date, q: String, module: String, explained: { type: Number, default: 0 }, resolvedAt: { type: Date, default: null } }, { _id: false })], default: [] },

  // ── Evidence for "mastered" (config.masteryEvidence) ──
  rightItems: { type: [String], default: undefined }, // distinct question ids answered right (the last few); absent on rows from before the rule
  topStage: { type: Number, default: null }, // highest stage answered right
  stageAvail: { type: Number, default: null }, // highest stage this skill has questions at (when last answered)
  legacyEvidence: { type: Boolean, default: false }, // mastered under the earlier rule; kept until the next miss
  // Per-stage counts: attempts, right, right first try without a hint.
  byStage: { type: [new mongoose.Schema({ s: Number, n: Number, c: Number, i: Number }, { _id: false })], default: [] },
  // Diagnostic probe on first contact (services/learning/probe.js)
  probe: {
    type: new mongoose.Schema({ state: { type: String, enum: ['pending', 'confident', 'steady', 'gentle'] }, n: Number, right: Number, top: Number, at: Date }, { _id: false }),
    default: undefined,
  },
  // A repeated misconception to explain with the next item of this skill (its text is from the content).
  explain: {
    type: new mongoose.Schema({ text: String, q: String, module: String, at: Date }, { _id: false }),
    default: null,
  },
}, { timestamps: true })

schema.index({ email: 1, skill: 1 }, { unique: true })
schema.index({ email: 1, subject: 1 })

module.exports = mongoose.models.SkillMastery || mongoose.model('SkillMastery', schema)
