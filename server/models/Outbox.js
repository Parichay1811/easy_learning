const mongoose = require('mongoose')

// Every email the platform sends or would send (invites, digests, reminders). When SMTP
// is not configured the message stays `queued` here, so nothing is lost and the super
// admin can see what would have gone out; with SMTP it is marked `sent` or `failed`.
const schema = new mongoose.Schema({
  to: { type: String, required: true, lowercase: true, trim: true, index: true },
  subject: { type: String, required: true },
  text: { type: String, default: '' },
  html: { type: String, default: '' },
  kind: { type: String, default: 'general' },   // invite, digest, reminder, announcement ...
  status: { type: String, enum: ['queued', 'sent', 'failed'], default: 'queued', index: true },
  error: { type: String, default: '' },
  sentAt: { type: Date, default: null },
}, { timestamps: true })
schema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 })

module.exports = mongoose.model('Outbox', schema)
