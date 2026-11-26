const mongoose = require('mongoose')
const cfg = require('../../config/social')
const learn = require('../../config/learning')

// The same round for two learners, each in their own time (G-508, G-515).
//   buddy     two friends; the result is one shared total
//   friendly  two friends side by side, each at their own level; the higher score gets a
//             ribbon, the other a "brave challenger" prize, and both a true process award
//   mystery   someone new near the same level (each at their own level), nickname and avatar only
// Only question ids are kept, never answers. There is no clock anywhere in it.
const playerSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  stars: { type: Number, default: null }, // null until played
  total: { type: Number, default: null },
  firstTry: { type: Number, default: 0 }, // right first time, no hint
  // Fair duels (content v5): in a friendly or mystery match each player answers their own
  // questions at their own level (same subject, kind and number). Empty: the round's shared items.
  own: { type: [{ _id: false, q: String, oid: mongoose.Schema.Types.ObjectId }], default: [] },
  level: { type: Number, default: null },
  playedAt: { type: Date, default: null },
  seenResult: { type: Boolean, default: false },
}, { _id: false })

const schema = new mongoose.Schema({
  kind: { type: String, enum: ['buddy', 'friendly', 'mystery'], required: true },
  subject: { type: String, enum: learn.SUBJECTS, required: true },
  module: { type: String, enum: cfg.match.modules, required: true },
  level: { type: Number, default: 1 },
  items: [{ _id: false, q: String, oid: mongoose.Schema.Types.ObjectId }],
  emails: { type: [String], required: true }, // one (a mystery round waiting for a partner) or two
  players: { type: [playerSchema], default: [] },
  createdBy: { type: String, required: true, lowercase: true },
  status: { type: String, enum: ['open', 'done'], default: 'open' },
  doneAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true },
}, { timestamps: true, versionKey: false })

schema.index({ emails: 1, status: 1, createdAt: -1 })
schema.index({ kind: 1, status: 1, subject: 1, module: 1, level: 1 })
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('BuddyMatch', schema)
