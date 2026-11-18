const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

// One row per school parent invited (ADM-022). The invite IS the verification:
// when that email signs in as a parent, every active org Parent record with it
// becomes verified Child links (utils/parentLinks.js). invited -> linked, or bounced.
const schema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  status: { type: String, enum: ['invited', 'linked', 'bounced'], default: 'invited' },
  sends: { type: Number, default: 0 },
  lastSentAt: { type: Date, default: null },
  outboxId: { type: String, default: '' },
  linkedAt: { type: Date, default: null },
}, { timestamps: true })

schema.index({ orgId: 1, parentId: 1 }, { unique: true })
schema.index({ email: 1 })

module.exports = adminDb.model('ParentInvite', schema)
