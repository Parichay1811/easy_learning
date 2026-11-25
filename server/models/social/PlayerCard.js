const mongoose = require('mongoose')
const cfg = require('../../config/social')

// A learner's player card (G-506): what other learners may see of them. A nickname made of two
// friendly words, an avatar from a fixed set and a friend code. Never an email, surname,
// school or photo. Keyed by the learner's email, so data export and erasure include it
// (services/dataRights.js).
const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  nickA: { type: String, enum: cfg.NICK_A, required: true },
  nickN: { type: String, enum: cfg.NICK_N, required: true },
  avatar: { type: String, enum: cfg.AVATARS, required: true },
  // First name only, kept so friends see "Aanya" (taken from the account name when the card is made).
  firstName: { type: String, default: '', maxlength: 30, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  // The learner's own switches (a grown-up's switches in Child.together win over these).
  friends: { type: Boolean, default: true },
  matches: { type: Boolean, default: true },
  mystery: { type: Boolean, default: false },
  // Nicknames this learner reported (G-518); hidden from them afterwards.
  blocked: { type: [String], default: [] },
}, { timestamps: true, versionKey: false })

module.exports = mongoose.model('PlayerCard', schema)
