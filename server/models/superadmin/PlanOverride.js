const mongoose = require('mongoose')
const superAdminDb = require('../../db/superAdminDb')

// The plan catalogue editor (SUP-050) stores its changes here, on top of
// config/plans.js. Each save is a new version; subscribers keep the snapshot
// they bought until renewal, unless the change is forced.
const schema = new mongoose.Schema({
  plan: { type: String, required: true, index: true },
  version: { type: Number, required: true },
  label: { type: String, default: '' },
  for: { type: String, default: '' },
  modules: { type: [String], default: undefined },
  limits: { type: mongoose.Schema.Types.Mixed, default: undefined },
  prices: { type: mongoose.Schema.Types.Mixed, default: {} }, // { EUR: { month: 900, year: 9000, perSeat: false } } in cents
  trialDays: { type: Number, default: 0 },
  active: { type: Boolean, default: true }, // false: closed to new customers (grandfathered)
  coupons: { type: [{ code: String, percentOff: Number, months: Number, expiresAt: Date }], default: [] },
  forced: { type: Boolean, default: false },
  note: { type: String, default: '' },
  by: { type: String, default: '' },
}, { timestamps: true })
schema.index({ plan: 1, version: -1 }, { unique: true })

module.exports = superAdminDb.models.PlanOverride || superAdminDb.model('PlanOverride', schema)
