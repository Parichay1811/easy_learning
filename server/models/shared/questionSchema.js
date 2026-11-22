const mongoose = require('mongoose')

// Shared shape for all 12 Listen/Read/Write/Speak x English/Maths/Science
// question collections. Each question comes from the rich, ~36-field content
// bank in server/data (see server/data/README.md) — id, subject, module,
// level etc. are explicit because they're queried/sorted/filtered; everything
// else varies shape by interaction type (e.g. correct_answer is a string, an
// array, or a category map depending on the widget) so it's stored as-is via
// Mixed rather than hand-modeled.
//
// subject/module/interaction/level are NOT required: the teacher-upload
// Excel pipeline (server/utils/questionValidation.js) still writes the old
// flat shape and was intentionally left untouched by this migration (a
// 36-field spreadsheet isn't realistic for teachers to fill in), so it never
// supplies these. Those old flat fields (sentence/text/answer/etc.) stay
// declared here too, so both existing and newly-uploaded legacy-shaped
// questions keep their content instead of Mongoose silently stripping it —
// the client renders anything missing `interaction` via a generic fallback.
function buildQuestionSchema() {
  const schema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    subject: { type: String },
    module: { type: String },
    type_index: { type: Number },
    question_type: { type: String },
    interaction: { type: String, index: true },
    // Learning level, not age: 0 = starter ("foundation"), 1-5 the original bank, 6-8 stretch.
    level: { type: Number, min: 0, max: 8 },
    level_name: { type: String },
    difficulty_band: { type: String },
    joy_flavor: { type: String },
    instruction: { type: String },
    prompt: { type: String },
    audio_text: { type: String, default: null },
    audio_link: { type: String },
    module_image_link: { type: String },
    question_image_link: { type: String },
    image: { type: mongoose.Schema.Types.Mixed },
    options: { type: mongoose.Schema.Types.Mixed },
    correct_answer: { type: mongoose.Schema.Types.Mixed },
    accepted_answers: { type: mongoose.Schema.Types.Mixed },
    distractor_insight: { type: mongoose.Schema.Types.Mixed },
    hints: { type: mongoose.Schema.Types.Mixed },
    worked_example: { type: String },
    feedback: { type: mongoose.Schema.Types.Mixed },
    points: { type: Number },
    bonus: { type: mongoose.Schema.Types.Mixed },
    readability: { type: mongoose.Schema.Types.Mixed },
    academic: { type: mongoose.Schema.Types.Mixed },
    life_skill: { type: mongoose.Schema.Types.Mixed },
    cognition: { type: mongoose.Schema.Types.Mixed },
    analysis: { type: mongoose.Schema.Types.Mixed },
    tags: { type: mongoose.Schema.Types.Mixed },
    telemetry: { type: mongoose.Schema.Types.Mixed },
    adaptive: { type: mongoose.Schema.Types.Mixed },
    wellbeing: { type: mongoose.Schema.Types.Mixed },
    accessibility: { type: mongoose.Schema.Types.Mixed },
    speech_scoring: { type: mongoose.Schema.Types.Mixed },

    // Content v3 (server/data/README.md, docs/learning/QUESTION-BANK.md). All optional so
    // teacher uploads and older documents stay valid; the answer checker has defaults.
    skill: { type: String, index: true },          // one id from server/data/skills.json
    age_band: { type: String, enum: ['all', 'young'] },
    graded: { type: Boolean },                     // false = practice only, never counted for mastery
    validation: { type: mongoose.Schema.Types.Mixed }, // { method, ...options } used by utils/scoreAnswer.js
    qa: { type: mongoose.Schema.Types.Mixed },     // { status: verified|needs_review|excluded, checks, version, reviewed, reason? }

    // Content v4 (docs/learning/QUESTION-BANK.md). Optional, like the v3 fields.
    stage: { type: Number, min: 0, max: 5, index: true }, // kind of thinking: 0 everyday curiosity … 5 transfer
    everyday: { type: Boolean, index: true },      // the everyday-curiosity pool (stage 0)
    // { text, style: curious|story|detective|adventure|calm|challenge, v, status: authored|templated|reviewed }
    // in English; translations.<lang>.narration has the same shape (translations is Mixed, so it passes through).
    narration: { type: mongoose.Schema.Types.Mixed },

    // Old flat schema (teacher-upload pipeline, pre-migration content)
    sentence: { type: String },
    text: { type: String },
    title: { type: String },
    content: { type: String },
    question: { type: String },
    answer: { type: String },
    character: { type: String },
    type: { type: String },
    hint: { type: String },
    emoji: { type: String },
    xp: { type: Number },
    category: { type: String },
    translations: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Teacher-upload / admin-review support (unchanged from the old schema)
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    uploadBatchId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },

    // Tags for analytics and the question bank (FND-042, TCH-021). All optional:
    // seed content gets defaults from scripts/backfill-question-tags.js.
    skillIds: { type: [String], default: undefined, index: true },
    gradeBand: { type: String },
    difficulty: { type: Number, min: 1, max: 5 },
    curriculumCode: { type: String },
    estimatedSeconds: { type: Number, min: 0 },
    // Authoring (TCH-020/023): the workspace a teacher-made question belongs to,
    // its edit count (old versions live in QuestionRevision), and what it was copied from.
    orgId: { type: String, default: null, index: true },
    authorName: { type: String },
    version: { type: Number, default: 1 },
    copiedFrom: { type: mongoose.Schema.Types.Mixed },
    archived: { type: Boolean, default: false },
  }, { timestamps: true })
  schema.index({ 'qa.status': 1 })
  return schema
}

module.exports = { buildQuestionSchema }
