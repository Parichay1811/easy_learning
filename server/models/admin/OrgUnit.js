const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

// The school tree (FND-017 / ADM-010): campus -> grade -> section, plus
// departments as a second view of the same people. `path` is the chain of
// ancestor ids including this unit ("/<campusId>/<gradeId>/<sectionId>/"), so a
// whole subtree is one indexed prefix query. Ids, not names, so renames are free.
const schema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgUnit', default: null },
  type: { type: String, enum: ['campus', 'grade', 'section', 'department'], required: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  path: { type: String, required: true },
  depth: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
  // Departments: the content subject they look after (english/maths/science or an org Subject name).
  subject: { type: String, default: '', trim: true, lowercase: true },
  archivedAt: { type: Date, default: null },
}, { timestamps: true })

schema.index({ orgId: 1, path: 1 })
schema.index({ orgId: 1, parentId: 1, order: 1 })

module.exports = adminDb.model('OrgUnit', schema)
