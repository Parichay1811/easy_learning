const mongoose = require('mongoose')
const superAdminDb = require('../../db/superAdminDb')

// Incidents and maintenance windows (SUP-043). Active ones with `banner` show a
// site-wide banner (GET /api/status); all of them make up the public status log.
const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  kind: { type: String, enum: ['incident', 'maintenance'], default: 'incident' },
  severity: { type: String, enum: ['minor', 'major', 'critical'], default: 'minor' },
  status: { type: String, enum: ['scheduled', 'investigating', 'identified', 'monitoring', 'resolved'], default: 'investigating' },
  message: { type: String, default: '' },
  banner: { type: Boolean, default: true },
  startsAt: { type: Date, default: Date.now },
  endsAt: { type: Date, default: null },
  resolvedAt: { type: Date, default: null },
  updates: { type: [{ at: { type: Date, default: Date.now }, status: String, message: String, by: String }], default: [] },
  createdBy: { type: String, default: '' },
}, { timestamps: true })
schema.index({ status: 1, startsAt: -1 })

module.exports = superAdminDb.models.Incident || superAdminDb.model('Incident', schema)
