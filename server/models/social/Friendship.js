const mongoose = require('mongoose')

// Two learners who are friends (G-506). One row per pair: `a` < `b` (emails, sorted), so a
// pair can exist only once. `emails` repeats both for one indexed lookup and for data rights.
//   pending          asked by `requestedBy`, waiting for the other learner
//   awaiting_adult   both learners agreed; waiting for the grown-ups named in `awaiting`
//   active           friends
// A declined or removed friendship is deleted (nothing is kept about it).
const schema = new mongoose.Schema({
  a: { type: String, required: true, lowercase: true, trim: true },
  b: { type: String, required: true, lowercase: true, trim: true },
  emails: { type: [String], required: true },
  status: { type: String, enum: ['pending', 'awaiting_adult', 'active'], default: 'pending' },
  requestedBy: { type: String, required: true, lowercase: true },
  // Learners whose grown-up still has to say yes.
  awaiting: { type: [String], default: [] },
  approvals: [{ _id: false, learner: String, byRole: String, byId: String, at: { type: Date, default: Date.now } }],
  since: { type: Date, default: null },
  expiresAt: { type: Date, default: null }, // unanswered requests go away by themselves
}, { timestamps: true, versionKey: false })

schema.index({ a: 1, b: 1 }, { unique: true })
schema.index({ emails: 1, status: 1 })
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('Friendship', schema)
