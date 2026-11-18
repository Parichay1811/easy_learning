const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

// A test or a practice set (TCH-030/031/060), owned by one teacher in one workspace.
// Items point at bank questions ({module, subject, questionId}) or are random
// pools ("8 from fractions, difficulty 2-3"). Attempts snapshot the questions
// they used, so editing a question or the test never changes past results.

const rubricLevel = new mongoose.Schema({ label: { type: String, maxlength: 60 }, points: Number }, { _id: false })
const rubricCriterion = new mongoose.Schema({ name: { type: String, maxlength: 80 }, levels: [rubricLevel] }, { _id: false })

const item = new mongoose.Schema({
  kind: { type: String, enum: ['question', 'pool'], default: 'question' },
  // kind = question
  module: String,
  subject: String,
  questionId: String,
  // kind = pool: draws `count` questions at attempt start
  pool: {
    source: { type: String, enum: ['mine', 'school', 'learnigo', 'collection'], default: 'mine' },
    collectionId: String,
    module: String,
    subject: String,
    skillIds: [String],
    difficultyMin: { type: Number, min: 1, max: 5 },
    difficultyMax: { type: Number, min: 1, max: 5 },
    interactions: [String],
    count: { type: Number, min: 1, max: 50 },
  },
  points: { type: Number, min: 0, max: 100, default: 1 },
  partialCredit: { type: Boolean, default: true },
  // 'auto' (scoreAnswer) or 'manual' (marking queue, TCH-041). Default by type.
  marking: { type: String, enum: ['auto', 'manual'], default: 'auto' },
  rubric: [rubricCriterion],
})

const section = new mongoose.Schema({
  title: { type: String, default: '', maxlength: 120 },
  fixedOrder: { type: Boolean, default: false },
  items: [item],
})

const rules = new mongoose.Schema({
  alwaysOpen: { type: Boolean, default: false },
  opensAt: Date,
  closesAt: Date,
  timezone: { type: String, default: 'UTC' },
  timeLimit: { type: String, enum: ['none', 'total', 'per_question'], default: 'none' },
  totalMinutes: { type: Number, min: 1, max: 600 },
  perQuestionSeconds: { type: Number, min: 5, max: 3600 },
  attempts: { type: Number, min: 0, max: 20, default: 1 }, // 0 = unlimited
  counts: { type: String, enum: ['best', 'last', 'average'], default: 'best' },
  shuffleQuestions: { type: Boolean, default: false },
  shuffleOptions: { type: Boolean, default: true },
  hints: { type: Boolean, default: false },
  listen: { type: Boolean, default: true },
  aiTeacherLocked: { type: Boolean, default: true },
  feedback: { type: String, enum: ['immediate', 'after_submit', 'after_close', 'never'], default: 'after_submit' },
  release: { type: String, enum: ['auto', 'manual'], default: 'auto' },
  style: { type: String, enum: ['practice', 'warrior'], default: 'practice' },
  passMark: { type: Number, min: 0, max: 100, default: 50 },
  masteryCredit: { type: Boolean, default: true },
  lateWork: { type: String, enum: ['none', 'marked', 'until'], default: 'none' },
  lateUntil: Date,
  integrity: {
    fullscreen: { type: Boolean, default: false },
    logTabSwitches: { type: Boolean, default: false },
    logPaste: { type: Boolean, default: false },
  },
}, { _id: false })

const schema = new mongoose.Schema({
  orgId: { type: String, required: true, index: true },
  ownerTutorId: { type: String, required: true, index: true },
  ownerName: { type: String, default: '' },
  kind: { type: String, enum: ['test', 'practice'], default: 'test' },
  title: { type: String, required: true, trim: true, maxlength: 140 },
  description: { type: String, default: '', maxlength: 2000 },
  subject: { type: String, default: '' },
  isTemplate: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  sections: [section],
  rules: { type: rules, default: () => ({}) },
  // Practice sets can also be "15 min of Listen · Maths" instead of questions (TCH-060).
  target: {
    module: String,
    subject: String,
    minutes: { type: Number, min: 1, max: 600 },
    aiTopic: { type: String, maxlength: 120 },
  },
  resultsReleasedAt: { type: Date, default: null },
  closeNotifiedAt: { type: Date, default: null },
  copiedFrom: { type: String, default: null },
}, { timestamps: true })

schema.index({ orgId: 1, ownerTutorId: 1, updatedAt: -1 })

module.exports = adminDb.model('Test', schema)
