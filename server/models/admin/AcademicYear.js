const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

const span = { name: { type: String, required: true, trim: true, maxlength: 80 }, start: { type: String, required: true }, end: { type: String, required: true } }

// Academic years and terms (FND-018 / ADM-012) plus the school calendar
// (ADM-062: holidays and exam weeks). Dates are local YYYY-MM-DD strings, like LearnerDay.
const schema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true, trim: true, maxlength: 40 },
  start: { type: String, required: true },
  end: { type: String, required: true },
  status: { type: String, enum: ['planning', 'current', 'archived'], default: 'planning' },
  terms: [new mongoose.Schema(span)],
  events: [new mongoose.Schema({ ...span, kind: { type: String, enum: ['holiday', 'exam', 'event'], required: true } })],
  promotedAt: { type: Date, default: null },
}, { timestamps: true })

schema.index({ orgId: 1, start: 1 })

module.exports = adminDb.model('AcademicYear', schema)
