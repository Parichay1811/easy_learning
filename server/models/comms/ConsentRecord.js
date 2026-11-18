const mongoose = require('mongoose')

// Who consented to what, for which learner, under which policy version (FND-070).
// Append-only: a change of mind is a new record (status 'withdrawn'), so the
// history can always be shown. Read through utils/consent.js.
const schema = new mongoose.Schema({
  subjectEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  subjectName: { type: String, default: '' },
  childId: { type: String, default: '' },        // parent's Child row, when given by a parent
  studentId: { type: String, default: '' },      // school Student row, when recorded by a school
  orgId: { type: String, default: '' },
  // 'learning' (use of the service), 'data_sharing' (school sees home activity), 'media', 'marketing'...
  purpose: { type: String, required: true },
  status: { type: String, enum: ['given', 'withdrawn'], required: true },
  // GDPR Art. 6 basis: guardian consent, or the school's DPA / public task.
  legalBasis: { type: String, enum: ['consent', 'contract', 'public_task', 'legitimate_interest', 'legal_obligation'], default: 'consent' },
  policyVersion: { type: String, required: true },
  byRole: { type: String, required: true },
  byId: { type: String, required: true },
  byName: { type: String, default: '' },
  method: { type: String, default: '' },         // 'link_code', 'school_dpa', 'settings', 'signup'
  ip: { type: String, default: '' },
}, { timestamps: true })

schema.index({ subjectEmail: 1, purpose: 1, createdAt: -1 })

module.exports = mongoose.model('ConsentRecord', schema)
