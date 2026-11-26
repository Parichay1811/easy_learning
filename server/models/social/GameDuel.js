const mongoose = require('mongoose')

// A camera game duel (content v5): two friends play the same camera game, each at their own
// level, each in their own time; the stars of each one's first finished round count (0-3).
// The higher gets a ribbon and the other a "brave mover" prize; a draw gives both the ribbon;
// both get a true award for how they played. Only the game id and the stars are kept: never a
// camera frame, never timings. There is no clock and no ranking anywhere.
const playerSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  stars: { type: Number, default: null }, // null until played
  level: { type: Number, default: null }, // the level they played at (their own)
  playedAt: { type: Date, default: null },
}, { _id: false })

const schema = new mongoose.Schema({
  gameId: { type: String, required: true, match: /^[a-z0-9][a-z0-9-]{1,48}$/ },
  emails: { type: [String], required: true },
  players: { type: [playerSchema], default: [] },
  createdBy: { type: String, required: true, lowercase: true },
  status: { type: String, enum: ['open', 'done'], default: 'open' },
  doneAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true },
}, { timestamps: true, versionKey: false })

schema.index({ emails: 1, status: 1, createdAt: -1 })
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('GameDuel', schema)
