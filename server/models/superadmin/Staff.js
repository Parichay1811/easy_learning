const mongoose = require('mongoose')
const superAdminDb = require('../../db/superAdminDb')

// A named Learnigo staff member with a role (SUP-001 / FND-014). Every console
// action is attributed to one of these (the env account is only a break-glass
// owner). Passwords are bcrypt hashes; the TOTP secret is sealed (utils/totp.js).
const STAFF_ROLES = ['owner', 'support', 'content', 'finance', 'engineer', 'analyst']

const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: STAFF_ROLES, required: true },
  status: { type: String, enum: ['active', 'disabled'], default: 'active' },
  passwordHash: { type: String, required: true },
  mustChangePassword: { type: Boolean, default: true },
  totpSecret: { type: String, default: '' }, // sealed
  totpEnabled: { type: Boolean, default: false },
  totpLastStep: { type: Number, default: -1 }, // refuses a replay of the same code
  recoveryCodes: { type: [{ hash: String, usedAt: { type: Date, default: null } }], default: [] },
  failedLogins: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },
  lastLoginIp: { type: String, default: '' },
  createdBy: { type: String, default: '' },
  prefs: { type: mongoose.Schema.Types.Mixed, default: {} }, // saved views etc.
}, { timestamps: true, minimize: false })

const Staff = superAdminDb.models.Staff || superAdminDb.model('Staff', schema)
module.exports = Staff
module.exports.STAFF_ROLES = STAFF_ROLES
