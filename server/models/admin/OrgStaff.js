const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

// Staff roles (ADM-023): somebody the admin lets into the school dashboard with
// fewer rights. Matched by verified email on the admin Google sign-in.
//   coordinator: everything inside their units (and/or subjects), no settings
//   office:      people management (students, teachers, parents, imports), no analytics
//   viewer:      read-only analytics (a board member)
// Permissions live in utils/orgAccess.js.
const schema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  name: { type: String, default: '', trim: true },
  role: { type: String, enum: ['coordinator', 'office', 'viewer'], required: true },
  unitIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrgUnit' }],
  subjects: [{ type: String, lowercase: true, trim: true }],
  status: { type: String, enum: ['active', 'disabled'], default: 'active' },
  uid: { type: String, default: '' },
  lastLoginAt: { type: Date, default: null },
  invitedBy: { type: String, default: '' },
}, { timestamps: true })

schema.index({ orgId: 1, email: 1 }, { unique: true })
schema.index({ email: 1, status: 1 })

module.exports = adminDb.model('OrgStaff', schema)
