const mongoose = require('mongoose')

// The content of a bank question before an edit (TCH-023 versioning). The live
// question keeps a `version` counter; past test attempts keep their own snapshot.
const schema = new mongoose.Schema({
  module: { type: String, required: true },
  subject: { type: String, required: true },
  questionId: { type: String, required: true },
  version: { type: Number, required: true },
  content: mongoose.Schema.Types.Mixed,
  editedBy: String,
  editedByRole: String,
}, { timestamps: true })

schema.index({ questionId: 1, version: -1 })

module.exports = mongoose.model('QuestionRevision', schema)
