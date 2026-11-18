const mongoose = require('mongoose')
const superAdminDb = require('../../db/superAdminDb')

// One signed-in console session. The JWT carries its id (`sid`); revoking the
// session here signs that browser out on its next request.
const schema = new mongoose.Schema({
  staffId: { type: String, default: '', index: true }, // '' = the env break-glass account
  email: { type: String, required: true, lowercase: true },
  name: { type: String, default: '' },
  role: { type: String, required: true },
  breakGlass: { type: Boolean, default: false },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  expiresAt: { type: Date, required: true },
  lastSeenAt: { type: Date, default: Date.now },
  revokedAt: { type: Date, default: null },
  revokedBy: { type: String, default: '' },
}, { timestamps: true })
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 })

module.exports = superAdminDb.models.StaffSession || superAdminDb.model('StaffSession', schema)
