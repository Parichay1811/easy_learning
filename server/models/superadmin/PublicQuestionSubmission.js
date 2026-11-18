const mongoose = require('mongoose')
const superAdminDb = require('../../db/superAdminDb')

// A teacher offering one of their questions to the public Learnigo bank (TCH-025).
// Only the submission record: the Learnigo content team reviews it (SUP-031).
const schema = new mongoose.Schema({
  module: { type: String, required: true },
  subject: { type: String, required: true },
  questionId: { type: String, required: true },
  version: Number,
  content: mongoose.Schema.Types.Mixed, // snapshot of what was offered
  orgId: { type: String, required: true },
  authorTutorId: { type: String, required: true },
  authorName: String,
  authorEmail: String,
  creditAs: { type: String, maxlength: 80 },
  note: { type: String, maxlength: 500 },
  status: { type: String, enum: ['submitted', 'accepted', 'declined', 'withdrawn'], default: 'submitted', index: true },
  reviewedAt: Date,
  reviewNote: String,
}, { timestamps: true })

schema.index({ questionId: 1, status: 1 })

module.exports = superAdminDb.model('PublicQuestionSubmission', schema)
