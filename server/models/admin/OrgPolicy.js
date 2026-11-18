const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

// One document per organisation (ADM-060 / FND-022). Read through utils/orgPolicy.js,
// which fills in defaults, so a missing document just means "defaults".
const schema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },
  messaging: { type: String, enum: ['off', 'parent_starts', 'both'], default: 'parent_starts' },
  officeHours: { type: String, default: '' },
  teachersCreateGroups: { type: Boolean, default: false },
  parentsSeeClassAverage: { type: Boolean, default: false },
  leaderboards: { type: String, enum: ['off', 'group'], default: 'off' },
  aiTeacherInSchoolHours: { type: Boolean, default: true },
  activityVisibility: { type: String, enum: ['assigned', 'school_hours', 'all'], default: 'assigned' },
  retentionYears: { type: Number, default: 2, min: 0, max: 10 },
  dpaAcceptedAt: { type: Date, default: null },
  dpaAcceptedBy: { type: String, default: '' },
  dpaVersion: { type: String, default: '' },
  dpaSignerName: { type: String, default: '' },
  dpaSignerRole: { type: String, default: '' },
  // ADM-062: holidays in the school calendar do not break learners' streaks.
  holidaysKeepStreak: { type: Boolean, default: true },
  // ADM-050: questions waiting longer than this are flagged in the review queue.
  reviewSlaDays: { type: Number, default: 3, min: 1, max: 30 },
  // ADM-061 (module reports.branded): colours, report header/footer, join-page welcome.
  branding: {
    primaryColor: { type: String, default: '' },
    accentColor: { type: String, default: '' },
    reportHeader: { type: String, default: '' },
    reportFooter: { type: String, default: '' },
    welcomeMessage: { type: String, default: '' },
  },
}, { timestamps: true })

module.exports = adminDb.model('OrgPolicy', schema)
