const mongoose = require('mongoose')
const superAdminDb = require('../../db/superAdminDb')

// "Was this account signed in and using the platform on this day?" One row per
// role + account + UTC day, written at most once a day per account by the
// platform guard. Powers DAU/WAU/MAU by role and "last admin login" (SUP-010, SUP-020).
const schema = new mongoose.Schema({
  role: { type: String, required: true }, // student | parent | admin | teacher | superadmin
  id: { type: String, required: true },
  orgId: { type: String, default: '' },
  date: { type: String, required: true }, // YYYY-MM-DD (UTC)
  firstAt: { type: Date, default: Date.now },
}, { versionKey: false })
schema.index({ role: 1, id: 1, date: 1 }, { unique: true })
schema.index({ date: 1, role: 1 })

module.exports = superAdminDb.models.ActorDay || superAdminDb.model('ActorDay', schema)
