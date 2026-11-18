const mongoose = require('mongoose')

// A parent's cheer (PAR-061): a sticker and a kind message, optionally a short
// voice note, shown to the learner the next time they open Learnigo.
const schema = new mongoose.Schema({
  learnerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  fromParentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  fromName: { type: String, default: '' },
  sticker: { type: String, required: true },
  message: { type: String, default: '', maxlength: 140 },
  voice: { type: Buffer, default: null, select: false },
  voiceType: { type: String, default: '' },
  hasVoice: { type: Boolean, default: false },
  seenAt: { type: Date, default: null },
}, { timestamps: true })

schema.index({ learnerEmail: 1, seenAt: 1, createdAt: -1 })

module.exports = mongoose.model('Cheer', schema)
