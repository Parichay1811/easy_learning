const mongoose = require('mongoose')
const cfg = require('../../config/learning')

// One learner's adaptive-learning profile (services/learning, docs/learning/ADAPTIVE.md).
// Keyed by the learner's email like every other learner collection, so data
// export and erasure (services/dataRights.js) include it.
//
// Data minimisation: no raw answers, no free text the learner typed in an
// answer, no time measurements, no diagnosis. `supports` are comfort
// preferences (client/src/utils/learnerPrefs.js), never a label.
// Per-skill state lives in SkillMastery (one row per skill, so answers on
// different skills never overwrite each other).

const attemptSchema = new mongoose.Schema({
  c: { type: Number, min: 0, max: 1 }, // credit 0..1 (config.credit)
  d: { type: String }, // local date YYYY-MM-DD (the "≥ 2 days" rule)
}, { _id: false })

const levelSchema = new mongoose.Schema({
  level: { type: Number, min: cfg.MIN_LEVEL, max: cfg.MAX_LEVEL, default: cfg.defaultLevel },
  source: { type: String, enum: cfg.LEVEL_SOURCES, default: 'default' },
  locked: { type: Boolean, default: false },
  lockedBy: { type: String, enum: ['guardian', 'teacher', null], default: null },
  setAt: { type: Date, default: null }, // when the level or its lock last changed
  // Who last changed it: a role, and for a guardian/teacher their short display name ("Priya R."), never an email.
  setBy: {
    role: { type: String, enum: ['learner', 'guardian', 'teacher', 'engine', null], default: null },
    name: { type: String, maxlength: 60, default: '' },
  },
  attempts: { type: Number, default: 0 }, // graded attempts counted at this level since it was set
  window: { type: [attemptSchema], default: [] }, // the last config.levelWindow of them
  snoozeUp: { type: Date, default: null }, // a dismissed level_up suggestion stays quiet until then
  snoozeDown: { type: Date, default: null },
}, { _id: false })

const goalSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, maxlength: cfg.limits.goalText, default: '' },
  subject: { type: String, enum: [...cfg.SUBJECTS, null], default: null },
  target: { type: Number, min: 0, max: 1000, default: null },
  done: { type: Boolean, default: false },
  by: { type: String, enum: ['learner', 'guardian', 'teacher'], default: 'learner' },
  createdAt: { type: Date, default: Date.now },
}, { _id: false })

const suggestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['level_up', 'level_down', 'review', 'break'], required: true },
  subject: { type: String, enum: [...cfg.SUBJECTS, null], default: null },
  skill: { type: String, default: null },
  level: { type: Number, default: null }, // the level now
  to: { type: Number, default: null }, // the level suggested
  key: { type: String, required: true }, // learn.suggestion.<key>
  params: { type: mongoose.Schema.Types.Mixed, default: {} },
  text: { type: String, default: '' }, // English fallback
  createdAt: { type: Date, default: Date.now },
}, { _id: false })

const overrideSchema = new mongoose.Schema({
  type: { type: String, enum: cfg.OVERRIDE_TYPES, required: true },
  subject: { type: String, enum: [...cfg.SUBJECTS, null], default: null },
  skill: { type: String, default: null },
  by: { type: String, enum: ['guardian', 'teacher'], required: true },
  at: { type: Date, default: Date.now },
}, { _id: false })

const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  levels: {
    english: { type: levelSchema, default: () => ({}) },
    maths: { type: levelSchema, default: () => ({}) },
    science: { type: levelSchema, default: () => ({}) },
  },
  ageBand: { type: String, enum: [...cfg.AGE_BANDS, null], default: null },
  pace: { type: String, enum: cfg.PACES, default: 'steady' },
  supports: { type: mongoose.Schema.Types.Mixed, default: {} },
  goals: { type: [goalSchema], default: [] },
  overrides: { type: [overrideSchema], default: [] },
  // Which teaching strategy came right before a success after a struggle (counts).
  explanationPrefs: {
    words: { type: Number, default: 0 },
    visual: { type: Number, default: 0 },
    guided: { type: Number, default: 0 },
    simpler: { type: Number, default: 0 },
  },
  suggestions: { type: [suggestionSchema], default: [] },
  baselineDone: {
    english: { type: Boolean, default: false },
    maths: { type: Boolean, default: false },
    science: { type: Boolean, default: false },
  },
  // Question ids answered lately (content ids only), so a round avoids repeats.
  recent: { type: [new mongoose.Schema({ q: String, at: Date }, { _id: false })], default: [] },
  // The last few graded outcomes of this sitting (true = right), for a "break" suggestion.
  sitting: { type: [new mongoose.Schema({ ok: Boolean, at: Date }, { _id: false })], default: [] },
  // Weekly graded attempts and credit (Monday of the week), for the guardian/teacher chart.
  history: { type: [new mongoose.Schema({ week: String, attempts: Number, credit: Number }, { _id: false })], default: [] },
  lastMessageKey: { type: String, default: '' },
  messageCount: { type: Number, default: 0 },
  last: { subject: { type: String, default: null }, module: { type: String, default: null } },
  lastActiveAt: { type: Date, default: null },
}, { timestamps: true, minimize: false })

module.exports = mongoose.models.LearnerProfile || mongoose.model('LearnerProfile', schema)
