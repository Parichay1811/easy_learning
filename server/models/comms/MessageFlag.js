const mongoose = require('mongoose')

// An abuse report on a message (FND-051, SUP-051). The org's admin and the
// super admin review them; the reporter is never shown to the sender.
const schema = new mongoose.Schema({
  messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true },
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true },
  orgId: { type: String, required: true, index: true },
  reporterKey: { type: String, required: true },
  senderKey: { type: String, required: true },
  reason: { type: String, enum: ['abuse', 'spam', 'inappropriate', 'safety', 'other'], default: 'other' },
  note: { type: String, default: '', maxlength: 500 },
  status: { type: String, enum: ['open', 'dismissed', 'actioned'], default: 'open', index: true },
  reviewedBy: { type: String, default: '' },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true })

schema.index({ messageId: 1, reporterKey: 1 }, { unique: true })

module.exports = mongoose.model('MessageFlag', schema)
