const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

// One student's go at a test (TCH-033/040). Everything needed to mark it is
// frozen at start: the questions (with their answers, never sent to the
// student), the rules and the student's accommodations. Keyed by the
// student's email like the rest of the learning data.

const manual = new mongoose.Schema({
  score: Number,
  comment: { type: String, maxlength: 1000 },
  levels: [Number],            // chosen level per rubric criterion
  markedBy: String,
  markedByName: String,
  markedAt: Date,
}, { _id: false })

const item = new mongoose.Schema({
  itemId: { type: String, required: true },
  section: { type: Number, default: 0 },
  sectionTitle: String,
  module: String,
  subject: String,
  questionId: String,
  version: Number,
  points: Number,
  partialCredit: Boolean,
  marking: { type: String, default: 'auto' },
  rubric: mongoose.Schema.Types.Mixed,
  q: mongoose.Schema.Types.Mixed,          // question snapshot incl. correct answer
  optionOrder: [Number],                   // shuffled option order shown to this student
  // the answer
  response: mongoose.Schema.Types.Mixed,
  responseKey: String,                     // normalised text of the answer, for "most common wrong answer"
  answered: { type: Boolean, default: false },
  openedAt: Date,
  savedAt: Date,
  timeMs: Number,
  hintsUsed: { type: Number, default: 0 },
  correct: Boolean,
  fraction: Number,
  autoScore: Number,
  score: Number,
  needsMarking: { type: Boolean, default: false },
  manual: manual,
  recorded: { type: Boolean, default: false },  // sent to analytics
  checked: { type: Boolean, default: false },   // immediate feedback given: the answer is final
}, { _id: false })

const schema = new mongoose.Schema({
  orgId: { type: String, required: true, index: true },
  testId: { type: String, required: true, index: true },
  assignmentId: String,
  studentId: { type: String, required: true },
  studentEmail: { type: String, required: true, lowercase: true, index: true },
  studentName: String,
  attemptNo: { type: Number, default: 1 },
  status: { type: String, enum: ['in_progress', 'submitted', 'auto_submitted'], default: 'in_progress', index: true },
  startedAt: { type: Date, default: Date.now },
  deadlineAt: Date,                          // null = no time limit
  submittedAt: Date,
  late: { type: Boolean, default: false },
  rules: mongoose.Schema.Types.Mixed,        // rules snapshot
  accommodations: mongoose.Schema.Types.Mixed,
  items: [item],
  currentIndex: { type: Number, default: 0 },
  lastSeenAt: Date,
  events: [{ type: { type: String }, at: Date, itemId: String, _id: false }],
  score: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  percent: Number,
  passed: Boolean,
  needsMarking: { type: Boolean, default: false },
  resultNotifiedAt: Date,
}, { timestamps: true })

schema.index({ testId: 1, studentEmail: 1, attemptNo: 1 }, { unique: true })
schema.index({ orgId: 1, status: 1, needsMarking: 1 })

module.exports = adminDb.model('TestAttempt', schema)
