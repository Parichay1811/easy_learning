const mongoose = require('mongoose')

// A one-to-many message (FND-052). Who may send to which audience is decided in
// services/announcements.js; recipients get an AnnouncementReceipt (their inbox
// entry and read receipt) plus a bell notification.
const schema = new mongoose.Schema({
  authorKey: { type: String, required: true, index: true },
  authorRole: { type: String, enum: ['superadmin', 'admin', 'teacher'], required: true },
  authorName: { type: String, default: '' },
  orgId: { type: String, default: '', index: true },   // empty for platform/segment announcements
  audience: {
    type: { type: String, enum: ['platform', 'segment', 'org', 'unit', 'group', 'grade_parents', 'staff'], required: true },
    ids: [{ type: String }],                // group or unit ids
    grade: { type: String, default: '' },
    includeParents: { type: Boolean, default: true },
    includeStaff: { type: Boolean, default: true },
    // segment: platform roles and organisation filters
    roles: [{ type: String, enum: ['parent', 'teacher', 'admin'] }],
    orgKind: { type: String, enum: ['', 'solo', 'institute'], default: '' },
    plans: [{ type: String }],
  },
  label: { type: String, default: '' },     // "Year 4 Maths", "All parents of Year 5" (for the feed)
  title: { type: String, required: true, maxlength: 140 },
  body: { type: String, required: true, maxlength: 5000 },
  link: { type: String, default: '' },
  publishAt: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, default: null },
  status: { type: String, enum: ['scheduled', 'sending', 'sent', 'cancelled'], default: 'scheduled', index: true },
  recipientCount: { type: Number, default: 0 },
  sentAt: { type: Date, default: null },
}, { timestamps: true })

module.exports = mongoose.model('Announcement', schema)
