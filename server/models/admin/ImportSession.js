const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

// An uploaded roster (ADM-020), parsed once and kept for a day so the mapping
// screen, the dry run and the real import all read exactly the same rows.
const schema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  createdBy: { type: String, default: '' },
  filename: { type: String, default: '' },
  headers: [{ type: String }],
  rows: { type: [[String]], default: [] },
  committedAt: { type: Date, default: null },
  result: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 },
})

module.exports = adminDb.model('ImportSession', schema)
