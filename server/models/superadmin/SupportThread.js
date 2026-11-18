const mongoose = require('mongoose')
const superAdminDb = require('../../db/superAdminDb')

// Support-desk state for one conversation in the unified inbox (SUP-060). The
// messages stay where they are (ContactMessage, ChatMessage, ParentChatMessage);
// this adds assignment, status, tags and internal notes on top.
const schema = new mongoose.Schema({
  kind: { type: String, enum: ['contact', 'admin_chat', 'parent_chat'], required: true },
  ref: { type: String, required: true }, // contact id | adminUid | parentUid
  assigneeId: { type: String, default: '' },
  assigneeName: { type: String, default: '' },
  status: { type: String, enum: ['open', 'pending', 'resolved'], default: 'open' },
  tags: { type: [String], default: [] },
  notes: { type: [{ at: { type: Date, default: Date.now }, by: String, text: String }], default: [] },
}, { timestamps: true })
schema.index({ kind: 1, ref: 1 }, { unique: true })

module.exports = superAdminDb.models.SupportThread || superAdminDb.model('SupportThread', schema)
