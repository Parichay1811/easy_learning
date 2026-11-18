const mongoose = require('mongoose')

// A verified guardian invites a co-guardian by email (FND-013). The invite is
// bound to that email: only a parent who signs in with it can accept. Only a
// hash of the link token is stored. Valid 14 days.
const schema = new mongoose.Schema({
  learnerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  childName: { type: String, default: '' },
  fromChildId: { type: mongoose.Schema.Types.ObjectId, required: true }, // the inviting guardian's Child row
  fromParentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  fromName: { type: String, default: '' },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'accepted', 'cancelled'], default: 'pending' },
  acceptedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true },
}, { timestamps: true })

module.exports = mongoose.model('GuardianInvite', schema)
