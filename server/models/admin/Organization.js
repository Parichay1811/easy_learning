const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

const schema = new mongoose.Schema({
  // 'institute' = a school or centre run by an admin; 'solo' = one private tutor (FND-015).
  kind: { type: String, enum: ['institute', 'solo'], default: 'institute' },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['school', 'coaching_centre', 'institution', 'other'], default: 'school' },
  adminEmail: { type: String, required: true, lowercase: true },
  adminUid: { type: String, required: true },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String, default: '' },
  rejectionHistory: { type: [{ reason: String, rejectedAt: { type: Date, default: Date.now } }], default: [] },
  logoUrl: { type: String, default: '' },
  brandColor: { type: String, default: '' }, // TCH-081: on reports, invites and the join page
}, { timestamps: true })

module.exports = adminDb.model('Organization', schema)
