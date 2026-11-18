const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

const scheduleSlotSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
}, { timestamps: false })

const subjectAssignmentSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacherIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tutor' }],
  schedule: [scheduleSlotSchema],
})

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  subject: { type: String, default: '' },
  description: { type: String, default: '' },
  academicYear: { type: String, default: '', trim: true },
  term: { type: String, default: '', trim: true },
  maxStudents: { type: Number, default: null, min: 1 },
  subjects: [subjectAssignmentSchema],
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  directTutorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tutor' }],
  // Derived (batchService.syncBatchDerivedFields): union of directTutorIds + subjects[].teacherIds.
  tutorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tutor' }],
  studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  // Teacher-made groups (TCH-010/011/055): look, grade band, who made it, archive, join code.
  color: { type: String, default: '' },
  emoji: { type: String, default: '' },
  gradeBand: { type: String, default: '' },
  groupKind: { type: String, enum: ['class', 'practice'], default: 'class' },
  createdByTutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutor', default: null },
  archivedAt: { type: Date, default: null },
  joinCode: { type: String, default: undefined },
  joinEnabled: { type: Boolean, default: true },
  // School tree and academic year (ADM-010/012). Archived groups (archivedAt above) are read-only but still reportable.
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgUnit', default: null },
  yearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', default: null },
}, { timestamps: true })

schema.index({ joinCode: 1 }, { unique: true, partialFilterExpression: { joinCode: { $type: 'string' } } })

schema.index({ orgId: 1, 'subjects.teacherIds': 1 })
schema.index({ orgId: 1, 'subjects.subject': 1 })
schema.index({ orgId: 1, tutorIds: 1 })

module.exports = adminDb.model('Batch', schema)
