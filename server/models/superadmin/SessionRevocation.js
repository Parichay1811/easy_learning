const mongoose = require('mongoose')
const superAdminDb = require('../../db/superAdminDb')

// "Sign this account out everywhere" for any role (SUP-012, FND-074). Tokens of
// that account issued before `before` are refused by the platform guard.
const schema = new mongoose.Schema({
  role: { type: String, required: true },
  id: { type: String, required: true },
  before: { type: Date, required: true },
  by: { type: String, default: '' },
  reason: { type: String, default: '' },
}, { timestamps: true })
schema.index({ role: 1, id: 1 }, { unique: true })

module.exports = superAdminDb.models.SessionRevocation || superAdminDb.model('SessionRevocation', schema)
