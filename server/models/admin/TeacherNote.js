const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

// A teacher's private note about one student (TCH-013). Only the author sees it,
// and only inside the workspace (org) it was written in.
const schema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutor', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  body: { type: String, required: true, trim: true, maxlength: 2000 },
  pinned: { type: Boolean, default: false },
}, { timestamps: true })

schema.index({ orgId: 1, tutorId: 1, studentId: 1, createdAt: -1 })

module.exports = adminDb.model('TeacherNote', schema)
