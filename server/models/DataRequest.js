const mongoose = require('mongoose')

// A data-rights request (FND-071): export or delete everything about a learner.
// Shared by the Parent privacy centre (which owns this model and
// services/dataRights.js) and the Super Admin queue (SUP-061). Schema as agreed
// in docs/todo/FOUNDATION_API.md; guarded so either branch's copy can load first.
const schema = new mongoose.Schema({
  subjectEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  subjectName: { type: String, default: '' },
  requestedByRole: { type: String, required: true },
  requestedById: { type: String, required: true },
  orgId: { type: String, default: null },
  kind: { type: String, enum: ['export', 'delete'], required: true },
  status: { type: String, enum: ['pending', 'processing', 'done', 'rejected'], default: 'pending', index: true },
  dueAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  resolvedAt: { type: Date, default: null },
  resolvedBy: { type: String, default: '' },
  note: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.models.DataRequest || mongoose.model('DataRequest', schema)
