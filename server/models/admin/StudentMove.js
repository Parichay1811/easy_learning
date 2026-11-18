const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

// A student's history in the school (ADM-024 / ADM-012): section moves,
// promotions, leaving and rejoining. Append-only.
const schema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  kind: { type: String, enum: ['move', 'promote', 'repeat', 'leave', 'rejoin'], required: true },
  fromUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgUnit', default: null },
  toUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgUnit', default: null },
  fromBatchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
  toBatchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
  yearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', default: null },
  reason: { type: String, default: '', maxlength: 300 },
  by: { type: String, default: '' },
  at: { type: Date, default: Date.now },
})

schema.index({ orgId: 1, studentId: 1, at: -1 })

module.exports = adminDb.model('StudentMove', schema)
