const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

// What a teacher told us about their teaching, per workspace (TCH-001), the getting-started
// checklist state, and the optional public tutor page (TCH-082).
const schema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutor', required: true },
  country: { type: String, default: '', trim: true, maxlength: 60 },
  subjects: [{ type: String, trim: true, maxlength: 40 }],
  grades: [{ type: String, trim: true, maxlength: 40 }],
  checklistDismissedAt: { type: Date, default: null },
  // Public page: off until the tutor turns it on.
  publicEnabled: { type: Boolean, default: false },
  slug: { type: String, default: undefined, lowercase: true, trim: true },
  headline: { type: String, default: '', maxlength: 120 },
  bio: { type: String, default: '', maxlength: 1200 },
  testimonials: [{ quote: { type: String, maxlength: 400 }, by: { type: String, maxlength: 60 } }],
  publicGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
}, { timestamps: true })

schema.index({ orgId: 1, tutorId: 1 }, { unique: true })
schema.index({ slug: 1 }, { unique: true, partialFilterExpression: { slug: { $type: 'string' } } })

module.exports = adminDb.model('TeacherProfile', schema)
