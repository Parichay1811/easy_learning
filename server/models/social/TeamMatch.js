const mongoose = require('mongoose')

// A team match or class quest inside one group (G-501, G-511, G-512), run by the group's
// teacher. One team = a class quest with one shared bar; two to four = a team match.
// Scores are never stored while it runs: they are counted from the learners' own right
// answers in the window (services/social/teams.js). When it ends, the ceremony is written
// once: which teams reached the goal, who was first, and one true award per participant.
const teamSchema = new mongoose.Schema({
  key: { type: String, required: true },
  emoji: { type: String, default: '' },
  color: { type: String, default: '' },
  members: { type: [String], default: [] }, // learner emails (lowercase)
  goal: { type: Number, required: true }, // stars; in proportion to the team's size
  // Written when the match ends:
  stars: { type: Number, default: null },
  reached: { type: Boolean, default: null },
  reachedAt: { type: Date, default: null },
  firstFlag: { type: Boolean, default: false },
}, { _id: false })

const schema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdByTutorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true, trim: true, maxlength: 60 },
  kind: { type: String, enum: ['quest', 'teams'], required: true },
  subject: { type: String, default: '' }, // '' = any subject counts
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  starsPerDayCap: { type: Number, required: true },
  teams: { type: [teamSchema], default: [] },
  emails: { type: [String], default: [] }, // every member, for one indexed lookup and data rights
  status: { type: String, enum: ['active', 'ended'], default: 'active' },
  endedAt: { type: Date, default: null },
  endedBy: { type: String, default: '' }, // 'teacher' | 'time'
}, { timestamps: true, versionKey: false })

schema.index({ batchId: 1, status: 1, endsAt: -1 })
schema.index({ emails: 1, status: 1 })

module.exports = mongoose.model('TeamMatch', schema)
