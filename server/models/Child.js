const mongoose = require('mongoose')

// A parent's link to a learner. The link only shows the learner's data once it
// is `verified` (utils/guardianLink.js). Rows made before verification existed
// have no linkStatus and read as 'pending' through the default below, so they
// are locked until verified (scripts/migrate-verify-children.js does it for the
// ones a school already confirmed).
const schema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParentAccount', required: true },
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 1, max: 25 },
  email: {
    type: String, required: true, lowercase: true, trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
  },
  linkStatus: { type: String, enum: ['pending', 'verified', 'revoked'], default: 'pending', index: true },
  verifiedAt: { type: Date, default: null },
  // How the link was proven: 'school' (an org admin already linked this parent
  // and student) or 'child_code' (the learner generated a one-time code).
  verifiedBy: { type: String, enum: ['school', 'child_code', null], default: null },
  consentVersion: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Child', schema)
