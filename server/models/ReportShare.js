const mongoose = require('mongoose')

// A read-only link to one report (PAR-072): 7 days, revocable, audited.
// Only a hash of the token is stored; the link shows only that report.
const schema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  childId: { type: mongoose.Schema.Types.ObjectId, required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  learnerEmail: { type: String, required: true, lowercase: true },
  childName: { type: String, default: '' },
  from: { type: String, required: true },
  to: { type: String, required: true },
  tz: { type: String, default: 'UTC' },
  label: { type: String, default: '', maxlength: 60 },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
  views: { type: Number, default: 0 },
  lastViewedAt: { type: Date, default: null },
}, { timestamps: true })

module.exports = mongoose.model('ReportShare', schema)
