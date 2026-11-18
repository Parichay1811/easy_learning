const mongoose = require('mongoose')

// A conversation between two linked accounts (FND-051): parent<->teacher,
// parent<->admin, teacher<->admin. The older admin<->super admin and
// parent<->super admin chats keep their own collections.
const participant = new mongoose.Schema({
  key: { type: String, required: true },         // "<role>:<id>"
  role: { type: String, enum: ['parent', 'teacher', 'admin'], required: true },
  id: { type: String, required: true },
  name: { type: String, default: '' },
  lastReadAt: { type: Date, default: null },     // read receipts: everything before this was seen
  unread: { type: Number, default: 0 },
  muted: { type: Boolean, default: false },
}, { _id: false })

const schema = new mongoose.Schema({
  orgId: { type: String, required: true, index: true },
  participants: { type: [participant], validate: (v) => v.length === 2 },
  // Sorted participant keys + child, so the same pair about the same child reuses one thread.
  pairKey: { type: String, required: true, unique: true },
  // When the conversation is about a child: the parent's Child id and the school's Student id.
  childId: { type: String, default: '' },
  studentId: { type: String, default: '' },
  childName: { type: String, default: '' },
  subject: { type: String, default: '', maxlength: 140 },
  startedBy: { type: String, required: true },
  lastMessageAt: { type: Date, default: Date.now },
  lastSenderKey: { type: String, default: '' },
  lastPreview: { type: String, default: '' },    // shown to the two participants only
  messageCount: { type: Number, default: 0 },
  // First staff reply time, for the admin's messaging metrics (never content).
  firstReplyMs: { type: Number, default: null },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, { timestamps: true })

schema.index({ 'participants.key': 1, lastMessageAt: -1 })
schema.index({ orgId: 1, createdAt: -1 })

module.exports = mongoose.model('Thread', schema)
