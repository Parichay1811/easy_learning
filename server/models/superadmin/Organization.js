const mongoose = require('mongoose')
const superAdminDb = require('../../db/superAdminDb')

const schema = new mongoose.Schema({
  // 'institute' = a school or centre run by an admin; 'solo' = one private tutor (FND-015).
  kind: { type: String, enum: ['institute', 'solo'], default: 'institute' },
  // Module overrides set by the super admin: 'tests.advanced' adds it, '-sso' removes it (FND-030).
  featureOverrides: [{ type: String }],
  plan: { type: String, default: '' },
  name: { type: String, required: true, trim: true },
  type: { type: String, default: 'school' },
  adminEmail: { type: String, required: true, lowercase: true },
  adminName: { type: String, default: '' },
  adminUid: { type: String, required: true },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String, default: '' },
  rejectionHistory: { type: [{ reason: String, rejectedAt: { type: Date, default: Date.now } }], default: [] },
  adminOrgId: { type: String, default: '' },
  subscriptionPlan: { type: String, enum: ['free', 'basic', 'pro', 'enterprise'], default: 'free' },
  subscriptionStatus: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
  approvedAt: { type: Date, default: null },
  approvedBy: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  adminDesignation: { type: String, default: '' },
}, { timestamps: true })

module.exports = superAdminDb.model('Organization', schema)
