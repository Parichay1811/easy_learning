const mongoose = require('mongoose')

// A one-time code a learner generates so a parent can link to them (FND-012).
// Only a hash is stored. Codes expire after 24 hours (TTL index) and work once.
const schema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  usedAt: { type: Date, default: null },
  usedBy: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('LinkCode', schema)
