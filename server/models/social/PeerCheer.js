const mongoose = require('mongoose')
const cfg = require('../../config/social')

// A cheer from one learner to a friend or team-mate (G-507): a sticker and a line, both
// from fixed lists. There is no free text. Shown the next time the friend opens Learnigo.
const schema = new mongoose.Schema({
  from: { type: String, required: true, lowercase: true, trim: true, index: true },
  to: { type: String, required: true, lowercase: true, trim: true },
  sticker: { type: String, enum: cfg.CHEER_STICKERS, required: true },
  line: { type: String, enum: cfg.CHEER_LINES, required: true },
  day: { type: String, required: true }, // the sender's local date (YYYY-MM-DD), for the daily limit
  seenAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false })

schema.index({ to: 1, seenAt: 1, createdAt: -1 })
schema.index({ from: 1, day: 1 })
// Cheers are small moments, not a record: they go away after 90 days.
schema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 86400 })

module.exports = mongoose.model('PeerCheer', schema)
