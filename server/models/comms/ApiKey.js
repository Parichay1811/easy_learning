const mongoose = require('mongoose')

// A read-only, organisation-scoped API key (FND-062, module `api.export`).
// Only a SHA-256 hash of the secret is stored; the full key is shown once.
const schema = new mongoose.Schema({
  orgId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  prefix: { type: String, required: true, unique: true },   // public part, shown in lists
  hash: { type: String, required: true },
  scopes: [{ type: String, enum: ['learners:read', 'summaries:read'] }],
  createdBy: { type: String, required: true },
  lastUsedAt: { type: Date, default: null },
  useCount: { type: Number, default: 0 },
  revokedAt: { type: Date, default: null },
}, { timestamps: true })

module.exports = mongoose.model('ApiKey', schema)
