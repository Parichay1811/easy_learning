const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

// A teacher's named set of bank questions, e.g. "Fractions starter set" (TCH-023).
const schema = new mongoose.Schema({
  orgId: { type: String, required: true, index: true },
  ownerTutorId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, default: '', maxlength: 500 },
  // Shared with the other teachers in the same workspace.
  shared: { type: Boolean, default: false },
  items: [{ module: String, subject: String, questionId: String, _id: false }],
}, { timestamps: true })

module.exports = adminDb.model('QuestionCollection', schema)
