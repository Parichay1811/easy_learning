const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

// Consent per student (ADM-081 / FND-070): who consented, on what legal basis,
// to which policy version, and when. Withdrawal sets withdrawnAt, never a delete.
const schema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  basis: { type: String, enum: ['school_dpa', 'guardian', 'learner'], required: true },
  givenBy: { type: String, default: '', maxlength: 120 },
  version: { type: String, default: '', maxlength: 40 },
  note: { type: String, default: '', maxlength: 300 },
  recordedBy: { type: String, default: '' },
  at: { type: Date, default: Date.now },
  withdrawnAt: { type: Date, default: null },
}, { timestamps: true })

schema.index({ orgId: 1, studentId: 1, at: -1 })

module.exports = adminDb.model('ConsentRecord', schema)
