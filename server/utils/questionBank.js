// The question bank as a teacher sees it (TCH-020..027): "mine", "my school's"
// and "Learnigo's", across the 12 module x subject collections, plus the
// review hand-off (solo: auto-approved; institute: the admin's review queue).
const mongoose = require('mongoose')
const Counter = require('../models/Counter')
const Organization = require('../models/admin/Organization')
const QuestionUploadBatch = require('../models/superadmin/QuestionUploadBatch')
const { questionModels, getQuestionModel, MODULES, SUBJECTS } = require('./questionModels')
const { pickContent } = require('./questionShape')

const isId = (v) => mongoose.isValidObjectId(v) && String(new mongoose.Types.ObjectId(String(v))) === String(v)
const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const ALL = MODULES.flatMap((m) => SUBJECTS.map((s) => ({ module: m, subject: s, Model: questionModels[m][s] })))
const collectionsFor = (module, subject) => ALL.filter((c) => (!module || c.module === module) && (!subject || c.subject === subject))

async function workspaceKind(orgId) {
  const org = await Organization.findById(orgId).select('kind name').lean()
  return { kind: org?.kind === 'solo' ? 'solo' : 'institute', name: org?.name || '' }
}

// Ids of every upload batch from this org (legacy .xlsx uploads have no orgId on the question).
async function orgUploadBatchIds(orgId, { approvedOnly = false } = {}) {
  const filter = { orgId: String(orgId) }
  if (approvedOnly) filter.status = 'approved'
  return (await QuestionUploadBatch.find(filter).select('_id').lean()).map((b) => b._id)
}

const learnigoFilter = () => ({ uploadBatchId: null, submittedBy: null, orgId: null })

// Which questions a teacher can see, per scope. Returns a Mongo filter.
async function scopeFilter(teacher, scope) {
  if (scope === 'learnigo') return learnigoFilter()
  if (scope === 'school') {
    const batches = await orgUploadBatchIds(teacher.orgId, { approvedOnly: true })
    return { status: 'approved', archived: { $ne: true }, $or: [{ orgId: String(teacher.orgId) }, { uploadBatchId: { $in: batches } }] }
  }
  if (!isId(teacher.id)) return { _id: null }
  return { submittedBy: new mongoose.Types.ObjectId(String(teacher.id)), archived: { $ne: true } }
}

// May this teacher read this question (to preview, duplicate or use in a test)?
async function canRead(teacher, doc) {
  if (!doc) return false
  if (doc.submittedBy && String(doc.submittedBy) === String(teacher.id)) return true
  if (!doc.uploadBatchId && !doc.submittedBy && !doc.orgId) return true // Learnigo content
  if (doc.status !== 'approved' || doc.archived) return false
  if (doc.orgId) return String(doc.orgId) === String(teacher.orgId)
  if (doc.uploadBatchId) {
    const b = await QuestionUploadBatch.findById(doc.uploadBatchId).select('orgId').lean()
    return !!b && String(b.orgId) === String(teacher.orgId)
  }
  return false
}

// Only the author, inside the same workspace, may edit.
async function canEdit(teacher, doc) {
  if (!doc || !doc.submittedBy || String(doc.submittedBy) !== String(teacher.id)) return false
  if (doc.orgId) return String(doc.orgId) === String(teacher.orgId)
  if (doc.uploadBatchId) {
    const b = await QuestionUploadBatch.findById(doc.uploadBatchId).select('orgId').lean()
    return !!b && String(b.orgId) === String(teacher.orgId)
  }
  return false
}

async function findQuestion(module, subject, id) {
  const Model = getQuestionModel(module, subject)
  if (!Model || !isId(id)) return null
  return Model.findById(id)
}

const short = (s, n = 140) => (s ? String(s).slice(0, n) : '')

// Questions saved before the rich content migration have no `interaction`.
// Tests need one, so map the old flat shape to the nearest widget.
function withInteraction(q, module) {
  if (q.interaction) return q
  const out = { ...q }
  if (Array.isArray(q.options) && q.options.length && q.answer) {
    return { ...out, interaction: 'tap_mcq', instruction: q.question || q.title || 'Choose the answer', prompt: q.content || q.text || '', correct_answer: q.answer, accepted_answers: [q.answer], image: q.emoji ? { mode: 'emoji', emoji: q.emoji } : null }
  }
  if (module === 'write' && q.character) {
    return { ...out, interaction: 'typed_short', instruction: 'Write what you hear', audio_text: q.character, prompt: q.hint || '', correct_answer: q.character, accepted_answers: [q.character], image: q.emoji ? { mode: 'emoji', emoji: q.emoji } : null }
  }
  if (module === 'listen' && q.sentence) {
    return { ...out, interaction: 'typed_short', instruction: 'Listen and type the sentence', audio_text: q.sentence, prompt: '', correct_answer: q.sentence, accepted_answers: [q.sentence], image: q.emoji ? { mode: 'emoji', emoji: q.emoji } : null }
  }
  const text = q.text || q.sentence || q.content || ''
  if (text) {
    return { ...out, interaction: 'mic_record', instruction: 'Read this out loud', prompt: text, correct_answer: text, speech_scoring: { expected_keywords: text.split(/\s+/).slice(0, 8), sample_answer: text }, image: q.emoji ? { mode: 'emoji', emoji: q.emoji } : null }
  }
  return { ...out, interaction: 'typed_short', instruction: q.question || q.title || 'Answer', prompt: '', correct_answer: q.answer || '', accepted_answers: [q.answer || ''] }
}

function summary(doc, module, subject, teacher) {
  const q = withInteraction(doc.toObject ? doc.toObject() : doc, module)
  return {
    _id: String(doc._id), module, subject,
    interaction: q.interaction, instruction: short(q.instruction), prompt: short(q.prompt),
    emoji: q.image?.emoji || doc.emoji || '', imageUrl: q.image?.url || '',
    difficulty: doc.difficulty || doc.level || null, skillIds: doc.skillIds || [], gradeBand: doc.gradeBand || '',
    curriculumCode: doc.curriculumCode || '', estimatedSeconds: doc.estimatedSeconds || null, points: doc.points || null,
    status: doc.status, version: doc.version || 1, updatedAt: doc.updatedAt, authorName: doc.authorName || '',
    mine: !!(teacher && doc.submittedBy && String(doc.submittedBy) === String(teacher.id)),
    legacy: !doc.interaction,
  }
}

// One page of bank results across the collections the filters allow.
async function searchBank(teacher, { scope = 'mine', module, subject, interaction, skill, difficulty, gradeBand, q, status, page = 1, limit = 30 } = {}) {
  const base = await scopeFilter(teacher, scope)
  const and = [base]
  if (interaction) and.push({ interaction })
  if (skill) and.push({ skillIds: String(skill).toLowerCase() })
  if (difficulty) {
    const d = Number(difficulty)
    and.push({ $or: [{ difficulty: d }, { difficulty: { $exists: false }, level: d }] })
  }
  if (gradeBand) and.push({ gradeBand })
  if (status && scope === 'mine') and.push({ status })
  if (q) {
    const re = new RegExp(escapeRe(String(q).slice(0, 80)), 'i')
    and.push({ $or: [{ instruction: re }, { prompt: re }, { title: re }, { question: re }, { content: re }, { sentence: re }, { text: re }, { skillIds: re }, { curriculumCode: re }] })
  }
  const filter = { $and: and }
  limit = Math.min(100, Math.max(1, Number(limit) || 30))
  page = Math.max(1, Number(page) || 1)
  const cols = collectionsFor(module, subject)
  const per = await Promise.all(cols.map(async (c) => {
    const [total, rows] = await Promise.all([
      c.Model.countDocuments(filter),
      c.Model.find(filter).sort({ updatedAt: -1, _id: -1 }).limit(page * limit).lean(),
    ])
    return { c, total, rows }
  }))
  const total = per.reduce((s, p) => s + p.total, 0)
  const merged = per.flatMap((p) => p.rows.map((r) => ({ r, c: p.c })))
    .sort((a, b) => (new Date(b.r.updatedAt || 0) - new Date(a.r.updatedAt || 0)) || String(b.r._id).localeCompare(String(a.r._id)))
    .slice((page - 1) * limit, page * limit)
  return { total, page, limit, questions: merged.map(({ r, c }) => summary(r, c.module, c.subject, teacher)) }
}

async function nextIds(Model, n) {
  const counter = await Counter.findOneAndUpdate({ _id: Model.modelName }, { $inc: { seq: n } }, { upsert: true, new: true })
  const start = counter.seq - n + 1
  return Array.from({ length: n }, (_, i) => String(start + i))
}

// Creates the review record for new questions and returns the status they start with.
// Solo workspaces review their own work, so it is approved at once.
async function openReview(teacher, { module, subject, count, batchIds = [], source = 'editor', label = '' }) {
  const ws = await workspaceKind(teacher.orgId)
  const solo = ws.kind === 'solo'
  const batch = await QuestionUploadBatch.create({
    module, subject, source,
    submittedByTutorId: String(teacher.id), submittedByName: teacher.name || teacher.email || 'Teacher', submittedByEmail: teacher.email || 'unknown',
    orgId: String(teacher.orgId), orgName: ws.name || 'Workspace',
    batchIds: batchIds.map(String),
    originalFilename: label || (source === 'csv' ? 'CSV import' : 'Question editor'),
    originalFileUrl: source === 'csv' ? 'import://csv' : 'editor://question',
    rowCount: count,
    status: solo ? 'approved' : 'pending',
    reviewedBy: solo ? 'auto (solo workspace)' : '',
    reviewedAt: solo ? new Date() : null,
  })
  return { batch, status: solo ? 'approved' : 'pending', solo }
}

// Snapshot used inside a test attempt: content only, never ids of other people.
function snapshot(doc, module) {
  const raw = doc.toObject ? doc.toObject() : doc
  return pickContent(withInteraction(raw, module))
}

// Draws `count` questions for a random pool, skipping ones already in the test.
async function drawPool(teacher, pool, exclude = new Set(), rand = Math.random) {
  let refs = []
  if (pool.source === 'collection') {
    const QuestionCollection = require('../models/tests/QuestionCollection')
    const col = await QuestionCollection.findOne({ _id: isId(pool.collectionId) ? pool.collectionId : null, orgId: String(teacher.orgId), $or: [{ ownerTutorId: String(teacher.id) }, { shared: true }] }).lean()
    for (const it of col?.items || []) {
      const doc = await findQuestion(it.module, it.subject, it.questionId)
      if (doc && await canRead(teacher, doc)) refs.push({ doc, module: it.module, subject: it.subject })
    }
  } else {
    const base = await scopeFilter(teacher, pool.source || 'mine')
    const and = [base]
    if (pool.skillIds?.length) and.push({ skillIds: { $in: pool.skillIds } })
    if (pool.difficultyMin || pool.difficultyMax) {
      const range = {}
      if (pool.difficultyMin) range.$gte = pool.difficultyMin
      if (pool.difficultyMax) range.$lte = pool.difficultyMax
      and.push({ $or: [{ difficulty: range }, { difficulty: { $exists: false }, level: range }] })
    }
    if (pool.interactions?.length) and.push({ interaction: { $in: pool.interactions } })
    // Only questions a student may see: approved, or the teacher's own in a solo workspace.
    and.push({ status: 'approved' })
    for (const c of collectionsFor(pool.module, pool.subject)) {
      const docs = await c.Model.find({ $and: and }).limit(500)
      refs.push(...docs.map((doc) => ({ doc, module: c.module, subject: c.subject })))
    }
  }
  refs = refs.filter((r) => !exclude.has(String(r.doc._id)) && r.doc.status === 'approved')
  for (let i = refs.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [refs[i], refs[j]] = [refs[j], refs[i]] }
  return refs.slice(0, pool.count || 1)
}

module.exports = {
  ALL, collectionsFor, workspaceKind, orgUploadBatchIds, scopeFilter, canRead, canEdit, findQuestion, summary,
  searchBank, nextIds, openReview, snapshot, withInteraction, drawPool, isId, escapeRe, MODULES, SUBJECTS, getQuestionModel,
}
