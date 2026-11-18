const mongoose = require('mongoose')

// A learner without an email (FND-011): a young child a parent or teacher
// creates. They sign in with a login code plus a picture password. All their
// learning data is keyed by a synthetic internal email (`ml-<id>@managed.learnigo.invalid`)
// so every analytics query keeps working unchanged. `.invalid` is reserved
// (RFC 2606), so nothing is ever sent to it.
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  age: { type: Number, min: 2, max: 18, default: null },
  avatar: { type: String, maxlength: 8, default: '' },
  email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
  // sha256 of the normalised login code, so a code can be looked up but not read back.
  loginCodeHash: { type: String, required: true, unique: true },
  // bcrypt of the picture sequence.
  pictureHash: { type: String, required: true },
  createdByRole: { type: String, enum: ['parent', 'teacher', 'admin'], required: true },
  createdById: { type: String, required: true },
  orgId: { type: String, default: null },
  batchId: { type: String, default: null },
  status: { type: String, enum: ['active', 'disabled'], default: 'active' },
  lastLoginAt: { type: Date, default: null },
  failedLogins: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
}, { timestamps: true })

module.exports = mongoose.model('ManagedLearner', schema)
