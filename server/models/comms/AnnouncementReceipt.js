const mongoose = require('mongoose')

// One recipient's copy of an announcement: their inbox entry and read receipt.
const schema = new mongoose.Schema({
  announcementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Announcement', required: true },
  to: { type: String, required: true },          // "<role>:<id>"
  role: { type: String, required: true },
  readAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
}, { timestamps: true })

schema.index({ announcementId: 1, to: 1 }, { unique: true })
schema.index({ to: 1, createdAt: -1 })

module.exports = mongoose.model('AnnouncementReceipt', schema)
