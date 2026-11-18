const mongoose = require('mongoose')
const superAdminDb = require('../../db/superAdminDb')

// "View as" (SUP-002): a staff member seeing what an admin, teacher or parent
// sees, read-only, for 30 minutes, with a reason. Always audited.
const schema = new mongoose.Schema({
  staffId: { type: String, default: '' },
  staffEmail: { type: String, required: true },
  staffName: { type: String, default: '' },
  targetRole: { type: String, enum: ['admin', 'teacher', 'parent'], required: true },
  targetId: { type: String, required: true },
  targetName: { type: String, default: '' },
  targetEmail: { type: String, default: '' },
  orgId: { type: String, default: '', index: true }, // adminDb org id
  reason: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  endedAt: { type: Date, default: null },
  ip: { type: String, default: '' },
}, { timestamps: true })

module.exports = superAdminDb.models.ViewAsSession || superAdminDb.model('ViewAsSession', schema)
