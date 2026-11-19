const mongoose = require('mongoose')

// A parent's link to a learner. The link only shows the learner's data once it
// is `verified` (utils/guardianLink.js). Rows made before verification existed
// have no linkStatus and read as 'pending' through the default below, so they
// are locked until verified (scripts/migrate-verify-children.js does it for the
// ones a school already confirmed).
//
// Each guardian has their own row (FND-013), so notification preferences are
// per guardian. Settings about the learner (weekly goal, healthy-use limits,
// grade, language) are kept the same on every verified row of that learner by
// services/parentFamily.js.
const goalSchema = new mongoose.Schema({
  minutesPerDay: { type: Number, min: 5, max: 120, default: 20 },
  daysPerWeek: { type: Number, min: 1, max: 7, default: 5 },
  reward: { type: String, trim: true, maxlength: 80, default: '' },
  rewardEmoji: { type: String, maxlength: 8, default: '' },
  setAt: { type: Date, default: null },
}, { _id: false })

const healthySchema = new mongoose.Schema({
  dailyLimitMin: { type: Number, min: 0, max: 600, default: 0 }, // 0 = no limit
  quietStart: { type: String, default: '' }, // 'HH:MM' local, '' = off
  quietEnd: { type: String, default: '' },
  breakEveryMin: { type: Number, min: 0, max: 120, default: 0 }, // 0 = off
}, { _id: false })

const schema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParentAccount', required: true },
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 1, max: 25 },
  email: {
    type: String, required: true, lowercase: true, trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
  },
  linkStatus: { type: String, enum: ['pending', 'verified', 'revoked'], default: 'pending', index: true },
  verifiedAt: { type: Date, default: null },
  // How the link was proven: 'school' (an org admin already linked this parent
  // and student), 'child_code' (the learner generated a one-time code),
  // 'parent_created' (this parent created the managed learner),
  // 'co_guardian' (a verified guardian invited this parent) or 'child_request'
  // (the learner accepted the parent's request, or asked the parent themselves:
  // services/linkRequests.js).
  verifiedBy: { type: String, enum: ['school', 'child_code', 'parent_created', 'co_guardian', 'child_request', null], default: null },
  consentVersion: { type: String, default: '' },

  // FND-011 / FND-013
  managedLearnerId: { type: mongoose.Schema.Types.ObjectId, default: null },
  guardianRole: { type: String, enum: ['primary', 'co'], default: 'primary' },
  invitedByParentId: { type: mongoose.Schema.Types.ObjectId, default: null },
  avatar: { type: String, maxlength: 8, default: '' },
  revokedAt: { type: Date, default: null },
  revokedBy: { type: String, default: '' },

  // PAR-004 first-run setup
  grade: { type: String, trim: true, maxlength: 30, default: '' },
  language: { type: String, trim: true, maxlength: 10, default: '' },
  weeklyGoal: { type: goalSchema, default: null },
  healthyUse: { type: healthySchema, default: () => ({}) },
  notifyPrefs: {
    weeklyDigest: { type: Boolean, default: true },
    milestones: { type: Boolean, default: true },
    goalReached: { type: Boolean, default: true },
    inactivity: { type: Boolean, default: false },
  },
  onboardedAt: { type: Date, default: null },

  // FND-070: what was agreed, by whom, when.
  consentHistory: [{
    _id: false,
    at: { type: Date, default: Date.now },
    action: { type: String },
    version: { type: String, default: '' },
    by: { type: String, default: '' },
    note: { type: String, default: '' },
  }],
}, { timestamps: true })

schema.index({ email: 1, linkStatus: 1 })

module.exports = mongoose.model('Child', schema)
