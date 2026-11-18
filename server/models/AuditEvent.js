const mongoose = require('mongoose')

// Append-only record of sensitive actions (FND-072): sign-ins, "view as", exports,
// deletions, grade changes, permission changes. Each event stores the hash of the
// one before it, so any later edit or deletion in the middle is detectable.
const schema = new mongoose.Schema({
  at: { type: Date, default: Date.now, index: true },
  actorRole: { type: String, required: true },
  actorId: { type: String, default: '' },
  actorEmail: { type: String, default: '' },
  action: { type: String, required: true, index: true },
  targetType: { type: String, default: '' },
  targetId: { type: String, default: '' },
  orgId: { type: String, default: '', index: true },
  reason: { type: String, default: '' },
  ip: { type: String, default: '' },
  meta: { type: mongoose.Schema.Types.Mixed },
  prevHash: { type: String, default: '' },
  hash: { type: String, default: '' },
}, { minimize: true })
schema.index({ targetType: 1, targetId: 1, at: -1 })

module.exports = mongoose.model('AuditEvent', schema)
