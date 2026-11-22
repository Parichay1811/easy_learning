const mongoose = require('mongoose')
const cfg = require('../../config/learning')

// The adaptive engine's decision log (services/learning/decisions.js): every level
// change or suggestion, support step, probe result, band tilt, explained
// misconception and mastered skill, with a reason code and the numbers behind it.
// Shown in plain language to the learner, their guardians and teachers.
//
// Data minimisation: no answers, nothing the learner typed or said, no times;
// `evidence` holds small numbers only. Short-lived: deleted `decisionTtlDays`
// (180) days after `at` by the TTL index. Keyed by the learner's email, so data
// export and erasure (services/dataRights.js) include it.
const schema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  at: { type: Date, required: true, default: Date.now },
  type: { type: String, enum: cfg.DECISION_TYPES, required: true },
  subject: { type: String, enum: [...cfg.SUBJECTS, null], default: null },
  skill: { type: String, default: null },
  from: { type: mongoose.Schema.Types.Mixed, default: null }, // a level, a support step, a tilt
  to: { type: mongoose.Schema.Types.Mixed, default: null },
  reason: { type: String, required: true, maxlength: 40 }, // learn.decision.<reason>
  evidence: { type: mongoose.Schema.Types.Mixed, default: {} }, // { acc, n, days, ... } numbers only
}, { versionKey: false })

schema.index({ email: 1, at: -1 })
schema.index({ at: 1 }, { expireAfterSeconds: cfg.decisionTtlDays * 86400 })

module.exports = mongoose.models.LearningDecision || mongoose.model('LearningDecision', schema)
