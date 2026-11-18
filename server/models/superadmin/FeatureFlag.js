const mongoose = require('mongoose')
const superAdminDb = require('../../db/superAdminDb')

// Feature flags and module switches (SUP-042).
// kind 'module': a plan module key from config/plans.js switched on/off for the
//   whole platform or for a plan (one org's module overrides stay in
//   Organization.featureOverrides, as entitlementsFor already reads them).
// kind 'feature': a new feature with a percentage rollout and per-plan/per-org
//   rules, read with services/featureFlags.isOn(key, { orgId, plan, actorId }).
const schema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true },
  kind: { type: String, enum: ['module', 'feature'], default: 'feature' },
  description: { type: String, default: '' },
  platform: { type: String, enum: ['default', 'on', 'off'], default: 'default' },
  plans: { type: mongoose.Schema.Types.Mixed, default: {} }, // { institute: 'on', solo_free: 'off' }
  orgs: { type: mongoose.Schema.Types.Mixed, default: {} }, // features: { <adminOrgId>: 'on'|'off' }
  rollout: { type: Number, min: 0, max: 100, default: 0 }, // features only
  updatedBy: { type: String, default: '' },
}, { timestamps: true, minimize: false })

module.exports = superAdminDb.models.FeatureFlag || superAdminDb.model('FeatureFlag', schema)
