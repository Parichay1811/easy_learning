const mongoose = require('mongoose')

// A data-rights request (FND-071), shared by the Parent privacy centre (which
// creates them) and the Super Admin queue (which resolves them).
//   export: fulfilled straight away (the JSON download); kept here as the record.
//   delete: 30-day grace (`dueAt`). The guardian can cancel while it is pending.
//           The super admin approves it (status 'processing') or rejects it;
//           services/dataRights.js runDueDeletions() erases the learner once an
//           approved request is past dueAt, then marks it 'done'.
const schema = new mongoose.Schema({
  subjectEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  subjectName: { type: String, default: '' },
  requestedByRole: { type: String, required: true },
  requestedById: { type: String, required: true },
  orgId: { type: String, default: null },
  kind: { type: String, enum: ['export', 'delete'], required: true },
  status: { type: String, enum: ['pending', 'processing', 'done', 'rejected'], default: 'pending', index: true },
  dueAt: { type: Date, default: null },
  resolvedAt: { type: Date, default: null },
  resolvedBy: { type: String, default: '' },
  note: { type: String, default: '', maxlength: 500 },
  result: { type: mongoose.Schema.Types.Mixed, default: null }, // e.g. how many records were erased
}, { timestamps: true })

module.exports = mongoose.model('DataRequest', schema)
