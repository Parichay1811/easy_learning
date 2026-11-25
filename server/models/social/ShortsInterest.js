const mongoose = require('mongoose')

// What a learner likes to watch in Shorts (G-521, G-530). One small document per learner:
// the themes they picked themselves, the shorts they hearted, and per theme and per topic
// area how many shorts they opened and watched to the end. No times of day, no watch
// history beyond the last few ids (so the feed does not repeat itself). Their grown-ups
// and teachers see a summary of this, and the learner is told so.
const countSchema = new mongoose.Schema({
  views: { type: Number, default: 0 },
  done: { type: Number, default: 0 }, // watched to the end
  likes: { type: Number, default: 0 },
  right: { type: Number, default: 0 }, // "now you try" answered right
  last: { type: Date, default: null },
}, { _id: false })

const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  picks: { type: [String], default: [] }, // themes the learner chose
  themes: { type: Map, of: countSchema, default: () => ({}) },
  areas: { type: Map, of: countSchema, default: () => ({}) },
  liked: [{ _id: false, id: String, title: String, theme: String, at: { type: Date, default: Date.now } }],
  seen: { type: [String], default: [] }, // the most recent ids only
  // Per ISO week (YYYY-Www): shorts watched to the end, for "how it changed".
  weeks: { type: Map, of: Number, default: () => ({}) },
  totals: { views: { type: Number, default: 0 }, done: { type: Number, default: 0 }, likes: { type: Number, default: 0 } },
}, { timestamps: true, versionKey: false })

module.exports = mongoose.model('ShortsInterest', schema)
