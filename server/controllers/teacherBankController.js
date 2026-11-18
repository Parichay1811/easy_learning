// Teacher question bank (TCH-020..027): editor, tags, import/export, bank
// browser, collections, versioning, review hand-off, quality stats and
// opt-in sharing to the public bank. Every route is behind teacherAuth and
// requireModule('qbank.author') (see routes/teacherTests.js).
const Batch = require('../models/admin/Batch')
const TestAttempt = require('../models/tests/TestAttempt')
const QuestionCollection = require('../models/tests/QuestionCollection')
const QuestionRevision = require('../models/QuestionRevision')
const QuestionUploadBatch = require('../models/superadmin/QuestionUploadBatch')
const PublicQuestionSubmission = require('../models/superadmin/PublicQuestionSubmission')
const { audit } = require('../utils/audit')
const { teachesBatch } = require('../utils/scopes')
const { entitlementsFor } = require('../utils/entitlements')
const { normaliseQuestion, pickContent, INTERACTIONS, GRADE_BANDS } = require('../utils/questionShape')
const bank = require('../utils/questionBank')
const { parseImport, toCsv } = require('../utils/questionCsv')
const { fileUrl, saveBufferToUploads } = require('../middleware/upload')

const fail = (res, status, message, extra = {}) => res.status(status).json({ success: false, message, ...extra })
const oops = (res, err, where) => { console.error(`${where} error:`, err); fail(res, 500, 'Internal server error') }
const T = (req) => ({ id: String(req.teacher.id), orgId: String(req.teacher.orgId), name: req.teacher.name || '', email: req.teacher.email || '' })

const TAG_FIELDS = new Set(['skillIds', 'gradeBand', 'difficulty', 'curriculumCode', 'estimatedSeconds', 'points'])
const MAX_IMPORT = 300

// Batches the teacher teaches, from a requested list (for module-practice visibility).
async function ownBatchIds(teacher, requested) {
  const ids = (Array.isArray(requested) ? requested : []).filter(bank.isId).slice(0, 50)
  if (!ids.length) return { ok: true, ids: [] }
  const batches = await Batch.find({ _id: { $in: ids }, orgId: teacher.orgId })
  const mine = batches.filter((b) => teachesBatch(b, teacher.id)).map((b) => String(b._id))
  return mine.length === ids.length ? { ok: true, ids: mine } : { ok: false }
}

// GET /bank/meta
const meta = async (req, res) => {
  try {
    const t = T(req)
    const ws = await bank.workspaceKind(t.orgId)
    const ent = await entitlementsFor(req.actor)
    res.json({ success: true, workspace: ws, modules: bank.MODULES, subjects: bank.SUBJECTS, interactions: INTERACTIONS, gradeBands: GRADE_BANDS, entitlements: ent.modules })
  } catch (err) { oops(res, err, 'bank.meta') }
}

// GET /bank/questions
const list = async (req, res) => {
  try {
    const { scope = 'mine' } = req.query
    if (!['mine', 'school', 'learnigo'].includes(scope)) return fail(res, 400, 'Unknown scope')
    if (req.query.module && !bank.MODULES.includes(req.query.module)) return fail(res, 400, 'Unknown module')
    if (req.query.subject && !bank.SUBJECTS.includes(req.query.subject)) return fail(res, 400, 'Unknown subject')
    const out = await bank.searchBank(T(req), { ...req.query, scope })
    res.json({ success: true, ...out })
  } catch (err) { oops(res, err, 'bank.list') }
}

async function loadReadable(req, res) {
  const { module, subject, id } = req.params
  const doc = await bank.findQuestion(module, subject, id)
  if (!doc || !(await bank.canRead(T(req), doc))) { fail(res, 404, 'Question not found'); return null }
  return doc
}
async function loadEditable(req, res) {
  const { module, subject, id } = req.params
  const doc = await bank.findQuestion(module, subject, id)
  if (!doc || !(await bank.canEdit(T(req), doc))) { fail(res, 404, 'Question not found'); return null }
  return doc
}

// GET /bank/questions/:module/:subject/:id
const getOne = async (req, res) => {
  try {
    const doc = await loadReadable(req, res)
    if (!doc) return
    const t = T(req)
    const mine = doc.submittedBy && String(doc.submittedBy) === t.id
    const review = mine && doc.uploadBatchId ? await QuestionUploadBatch.findById(doc.uploadBatchId).select('status rejectionReason rejectionHistory reviewedBy reviewedAt source batchIds').lean() : null
    const q = bank.withInteraction(doc.toObject(), req.params.module)
    const share = mine ? await PublicQuestionSubmission.findOne({ questionId: String(doc._id) }).sort({ createdAt: -1 }).select('status createdAt reviewNote').lean() : null
    res.json({ success: true, question: { ...pickContent(q), _id: String(doc._id), module: req.params.module, subject: req.params.subject, status: doc.status, version: doc.version || 1, mine, legacy: !doc.interaction, updatedAt: doc.updatedAt, authorName: doc.authorName || '' }, review, share })
  } catch (err) { oops(res, err, 'bank.getOne') }
}

// POST /bank/questions  { module, subject, batchIds?, ...question }
const create = async (req, res) => {
  try {
    const t = T(req)
    const { module, subject } = req.body
    const Model = bank.getQuestionModel(module, subject)
    if (!Model) return fail(res, 400, 'Pick a module and a subject')
    const { data, errors } = normaliseQuestion(req.body)
    if (errors) return fail(res, 400, 'Please fix the highlighted fields', { errors })
    const batches = await ownBatchIds(t, req.body.batchIds)
    if (!batches.ok) return fail(res, 400, 'One or more selected groups are not yours')
    const { batch, status } = await bank.openReview(t, { module, subject, count: 1, batchIds: batches.ids, label: `Question editor: ${data.instruction.slice(0, 60)}` })
    const [id] = await bank.nextIds(Model, 1)
    const doc = await Model.create({ ...data, id, module, subject, status, submittedBy: t.id, uploadBatchId: batch._id, orgId: t.orgId, authorName: t.name, version: 1 })
    res.status(201).json({ success: true, question: bank.summary(doc, module, subject, t), status })
  } catch (err) {
    if (err.name === 'ValidationError') return fail(res, 400, err.message)
    oops(res, err, 'bank.create')
  }
}

// Saves the current content as a revision, then applies `data`. Content edits in an
// institute send the question back to review in its own one-question batch.
async function applyEdit(req, doc, module, subject, data, { contentChanged }) {
  const t = T(req)
  await QuestionRevision.create({ module, subject, questionId: String(doc._id), version: doc.version || 1, content: pickContent(doc.toObject()), editedBy: t.id, editedByRole: 'teacher' })
  Object.assign(doc, data)
  doc.version = (doc.version || 1) + 1
  if (!doc.orgId) doc.orgId = t.orgId
  if (contentChanged) {
    const ws = await bank.workspaceKind(t.orgId)
    const old = doc.uploadBatchId ? await QuestionUploadBatch.findById(doc.uploadBatchId) : null
    const alreadyPendingAlone = old && old.status === 'pending' && old.rowCount === 1
    if (ws.kind === 'solo') {
      doc.status = 'approved'
    } else if (!alreadyPendingAlone) {
      const { batch } = await bank.openReview(t, { module, subject, count: 1, batchIds: old?.batchIds || [], label: `Edited: ${String(doc.instruction || '').slice(0, 60)}` })
      doc.uploadBatchId = batch._id
      doc.status = 'pending'
      if (old && old.rowCount > 0) { old.rowCount = Math.max(0, old.rowCount - 1); await old.save() }
    } else doc.status = 'pending'
  }
  await doc.save()
  return doc
}

// Did anything a student sees change (not just tags)? Both sides normalised the same way.
function contentDiffers(doc, data) {
  const cur = pickContent(doc.toObject())
  const norm = normaliseQuestion({ ...cur, emoji: cur.image?.emoji, imageUrl: cur.image?.url }).data
  if (!norm) return true
  const strip = (q) => JSON.stringify(Object.fromEntries(Object.entries(q).filter(([k]) => !TAG_FIELDS.has(k) && k !== 'level').sort(([a], [b]) => a.localeCompare(b))))
  return strip(norm) !== strip(data)
}

// PUT /bank/questions/:module/:subject/:id
const update = async (req, res) => {
  try {
    const doc = await loadEditable(req, res)
    if (!doc) return
    const { module, subject } = req.params
    const { data, errors } = normaliseQuestion(req.body)
    if (errors) return fail(res, 400, 'Please fix the highlighted fields', { errors })
    await applyEdit(req, doc, module, subject, data, { contentChanged: contentDiffers(doc, data) })
    res.json({ success: true, question: bank.summary(doc, module, subject, T(req)), status: doc.status, version: doc.version })
  } catch (err) {
    if (err.name === 'ValidationError') return fail(res, 400, err.message)
    oops(res, err, 'bank.update')
  }
}

// DELETE /bank/questions/:module/:subject/:id  (archive: past tests keep their snapshot)
const archive = async (req, res) => {
  try {
    const doc = await loadEditable(req, res)
    if (!doc) return
    doc.archived = true
    await doc.save()
    await audit(req, 'question.archive', { targetType: 'question', targetId: String(doc._id), orgId: T(req).orgId })
    res.json({ success: true })
  } catch (err) { oops(res, err, 'bank.archive') }
}

// POST /bank/questions/:module/:subject/:id/duplicate  { module?, subject? }
const duplicate = async (req, res) => {
  try {
    const src = await loadReadable(req, res)
    if (!src) return
    const t = T(req)
    const module = req.body?.module || req.params.module
    const subject = req.body?.subject || req.params.subject
    const Model = bank.getQuestionModel(module, subject)
    if (!Model) return fail(res, 400, 'Pick a module and a subject')
    const content = bank.snapshot(src, req.params.module)
    const { data, errors } = normaliseQuestion({ ...content, emoji: content.image?.emoji, imageUrl: content.image?.url })
    if (errors) return fail(res, 400, 'This question cannot be copied into the editor', { errors })
    const { batch, status } = await bank.openReview(t, { module, subject, count: 1, label: `Copy: ${data.instruction.slice(0, 60)}` })
    const [id] = await bank.nextIds(Model, 1)
    const doc = await Model.create({ ...data, id, module, subject, status, submittedBy: t.id, uploadBatchId: batch._id, orgId: t.orgId, authorName: t.name, version: 1, copiedFrom: { module: req.params.module, subject: req.params.subject, questionId: String(src._id), version: src.version || 1 } })
    res.status(201).json({ success: true, question: bank.summary(doc, module, subject, t), status })
  } catch (err) { oops(res, err, 'bank.duplicate') }
}

// GET /bank/questions/:module/:subject/:id/revisions
const revisions = async (req, res) => {
  try {
    const doc = await loadEditable(req, res)
    if (!doc) return
    const rows = await QuestionRevision.find({ questionId: String(doc._id) }).sort({ version: -1 }).limit(50).lean()
    res.json({ success: true, current: doc.version || 1, revisions: rows.map((r) => ({ version: r.version, at: r.createdAt, content: r.content })) })
  } catch (err) { oops(res, err, 'bank.revisions') }
}

// Quality stats (TCH-027) from submitted test attempts in this workspace.
async function qualityStats(orgId, questionIds) {
  if (!questionIds.length) return {}
  const match = { orgId: String(orgId), status: { $ne: 'in_progress' }, 'items.questionId': { $in: questionIds } }
  const [main, wrong] = await Promise.all([
    TestAttempt.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $match: { 'items.questionId': { $in: questionIds }, 'items.answered': true } },
      { $group: {
        _id: '$items.questionId',
        used: { $sum: 1 },
        correct: { $sum: { $cond: ['$items.correct', 1, 0] } },
        timeMs: { $avg: '$items.timeMs' },
        highN: { $sum: { $cond: [{ $gte: ['$percent', 75] }, 1, 0] } },
        highCorrect: { $sum: { $cond: [{ $and: [{ $gte: ['$percent', 75] }, '$items.correct'] }, 1, 0] } },
      } },
    ]),
    TestAttempt.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $match: { 'items.questionId': { $in: questionIds }, 'items.answered': true, 'items.correct': false } },
      { $group: { _id: { q: '$items.questionId', a: '$items.responseKey' }, n: { $sum: 1 } } },
      { $sort: { n: -1 } },
    ]),
  ])
  const out = {}
  for (const r of main) {
    const pct = r.used ? Math.round((r.correct / r.used) * 100) : null
    const top = wrong.find((w) => w._id.q === r._id)
    const flags = []
    if (r.used >= 5 && pct >= 95) flags.push('too_easy')
    if (r.used >= 5 && top && top.n / r.used >= 0.4) flags.push('confusing')
    if (r.highN >= 3 && r.highCorrect / r.highN < 0.4) flags.push('possibly_wrong_key')
    out[r._id] = { used: r.used, percentCorrect: pct, avgSeconds: r.timeMs ? Math.round(r.timeMs / 100) / 10 : null, commonWrong: top ? { answer: top._id.a, count: top.n } : null, flags }
  }
  return out
}

// GET /bank/questions/:module/:subject/:id/stats
const stats = async (req, res) => {
  try {
    const doc = await loadReadable(req, res)
    if (!doc) return
    const s = await qualityStats(T(req).orgId, [String(doc._id)])
    res.json({ success: true, stats: s[String(doc._id)] || { used: 0, percentCorrect: null, avgSeconds: null, commonWrong: null, flags: [] } })
  } catch (err) { oops(res, err, 'bank.stats') }
}

// POST /bank/stats { ids: [] }
const statsMany = async (req, res) => {
  try {
    const ids = (Array.isArray(req.body?.ids) ? req.body.ids : []).filter(bank.isId).slice(0, 200).map(String)
    res.json({ success: true, stats: await qualityStats(T(req).orgId, ids) })
  } catch (err) { oops(res, err, 'bank.statsMany') }
}

// POST /bank/images (multipart "image")
const uploadImage = async (req, res) => {
  try {
    if (!req.file) return fail(res, 400, 'Choose a picture to upload')
    const filename = saveBufferToUploads('question-images', req.file.buffer, req.file.originalname)
    res.status(201).json({ success: true, url: fileUrl(req, 'question-images', filename) })
  } catch (err) { oops(res, err, 'bank.uploadImage') }
}

// POST /bank/import { module, subject, text, format?, dryRun?, batchIds? }
const importQuestions = async (req, res) => {
  try {
    const t = T(req)
    const { module, subject, text, format = 'auto', dryRun = false } = req.body || {}
    const Model = bank.getQuestionModel(module, subject)
    if (!Model) return fail(res, 400, 'Pick a module and a subject')
    if (!text || String(text).length > 500000) return fail(res, 400, 'Paste some questions (up to 500 KB)')
    if (!['auto', 'csv', 'tsv', 'text'].includes(format)) return fail(res, 400, 'Unknown format')
    const parsed = parseImport(text, format)
    if (parsed.rows.length > MAX_IMPORT) return fail(res, 400, `At most ${MAX_IMPORT} questions per import`)
    const valid = [], rowErrors = []
    for (const { line, input } of parsed.rows) {
      const r = normaliseQuestion(input)
      if (r.errors) rowErrors.push(...r.errors.map((e) => ({ row: line, field: e.field, message: e.message })))
      else valid.push({ line, data: r.data })
    }
    if (dryRun) return res.json({ success: true, format: parsed.format, valid: valid.length, rowErrors, preview: valid.slice(0, 50).map((v) => ({ line: v.line, ...v.data })) })
    if (!valid.length) return fail(res, 400, 'No valid questions found', { rowErrors, format: parsed.format })
    const batches = await ownBatchIds(t, req.body.batchIds)
    if (!batches.ok) return fail(res, 400, 'One or more selected groups are not yours')
    const { batch, status } = await bank.openReview(t, { module, subject, count: valid.length, batchIds: batches.ids, source: 'csv', label: `${parsed.format.toUpperCase()} import (${valid.length})` })
    batch.rowErrors = rowErrors.slice(0, 500)
    batch.skippedRowCount = rowErrors.length
    await batch.save()
    const ids = await bank.nextIds(Model, valid.length)
    await Model.insertMany(valid.map((v, i) => ({ ...v.data, id: ids[i], module, subject, status, submittedBy: t.id, uploadBatchId: batch._id, orgId: t.orgId, authorName: t.name, version: 1 })))
    await audit(req, 'question.import', { targetType: 'question_batch', targetId: String(batch._id), orgId: t.orgId, meta: { count: valid.length, format: parsed.format } })
    res.status(201).json({ success: true, inserted: valid.length, rowErrors, status, batchId: String(batch._id) })
  } catch (err) { oops(res, err, 'bank.import') }
}

// GET /bank/export.csv?scope=mine&module=&subject=
const exportCsv = async (req, res) => {
  try {
    const t = T(req)
    const scope = ['mine', 'school'].includes(req.query.scope) ? req.query.scope : 'mine'
    const filter = await bank.scopeFilter(t, scope)
    const rows = []
    for (const c of bank.collectionsFor(req.query.module, req.query.subject)) {
      const docs = await c.Model.find(filter).sort({ updatedAt: -1 }).limit(2000).lean()
      rows.push(...docs.map((d) => bank.withInteraction(d, c.module)))
    }
    await audit(req, 'question.export', { targetType: 'question_bank', targetId: scope, orgId: t.orgId, meta: { count: rows.length } })
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="questions-${scope}.csv"`)
    res.send(`﻿${toCsv(rows)}`)
  } catch (err) { oops(res, err, 'bank.export') }
}

// PATCH /bank/bulk { updates: [{ module, subject, id, set: { ...fields } }] }  (grid edit)
const BULK_FIELDS = ['instruction', 'prompt', 'audio_text', 'skillIds', 'gradeBand', 'difficulty', 'curriculumCode', 'estimatedSeconds', 'points']
const bulkUpdate = async (req, res) => {
  try {
    const updates = Array.isArray(req.body?.updates) ? req.body.updates.slice(0, 200) : []
    if (!updates.length) return fail(res, 400, 'Nothing to save')
    const results = []
    for (const u of updates) {
      const doc = await bank.findQuestion(u.module, u.subject, u.id)
      if (!doc || !(await bank.canEdit(T(req), doc))) { results.push({ id: u.id, ok: false, message: 'Not found' }); continue }
      if (!doc.interaction) { results.push({ id: u.id, ok: false, message: 'Open this older question in the editor first' }); continue }
      const set = Object.fromEntries(Object.entries(u.set || {}).filter(([k]) => BULK_FIELDS.includes(k)))
      const current = pickContent(doc.toObject())
      const { data, errors } = normaliseQuestion({ ...current, emoji: current.image?.emoji, imageUrl: current.image?.url, ...set })
      if (errors) { results.push({ id: u.id, ok: false, errors }); continue }
      const contentChanged = ['instruction', 'prompt', 'audio_text'].some((k) => k in set && String(set[k] ?? '') !== String(current[k] ?? ''))
      await applyEdit(req, doc, u.module, u.subject, data, { contentChanged })
      results.push({ id: u.id, ok: true, status: doc.status, version: doc.version })
    }
    res.json({ success: true, results, saved: results.filter((r) => r.ok).length })
  } catch (err) { oops(res, err, 'bank.bulk') }
}

// POST /bank/questions/:module/:subject/:id/share { creditAs?, note? }  (module qbank.share)
const share = async (req, res) => {
  try {
    const doc = await loadEditable(req, res)
    if (!doc) return
    if (doc.status !== 'approved') return fail(res, 409, 'Only approved questions can be offered to the public bank')
    const t = T(req)
    const open = await PublicQuestionSubmission.findOne({ questionId: String(doc._id), status: 'submitted' })
    if (open) return fail(res, 409, 'This question is already waiting for review')
    const sub = await PublicQuestionSubmission.create({
      module: req.params.module, subject: req.params.subject, questionId: String(doc._id), version: doc.version || 1,
      content: pickContent(doc.toObject()), orgId: t.orgId, authorTutorId: t.id, authorName: t.name, authorEmail: t.email,
      creditAs: String(req.body?.creditAs || t.name).slice(0, 80), note: String(req.body?.note || '').slice(0, 500),
    })
    res.status(201).json({ success: true, submission: { _id: String(sub._id), status: sub.status } })
  } catch (err) { oops(res, err, 'bank.share') }
}

// GET /bank/shares
const myShares = async (req, res) => {
  try {
    const rows = await PublicQuestionSubmission.find({ authorTutorId: T(req).id, orgId: T(req).orgId }).sort({ createdAt: -1 }).limit(200).select('-content').lean()
    res.json({ success: true, submissions: rows })
  } catch (err) { oops(res, err, 'bank.shares') }
}

// ── Collections ──
const colFilter = (t, id) => ({ _id: bank.isId(id) ? id : null, orgId: t.orgId })
const listCollections = async (req, res) => {
  try {
    const t = T(req)
    const rows = await QuestionCollection.find({ orgId: t.orgId, $or: [{ ownerTutorId: t.id }, { shared: true }] }).sort({ updatedAt: -1 }).lean()
    res.json({ success: true, collections: rows.map((c) => ({ ...c, mine: c.ownerTutorId === t.id, count: c.items.length })) })
  } catch (err) { oops(res, err, 'bank.collections') }
}
const createCollection = async (req, res) => {
  try {
    const t = T(req)
    const name = String(req.body?.name || '').trim()
    if (!name) return fail(res, 400, 'Give the collection a name')
    const c = await QuestionCollection.create({ orgId: t.orgId, ownerTutorId: t.id, name: name.slice(0, 80), description: String(req.body?.description || '').slice(0, 500), shared: !!req.body?.shared })
    res.status(201).json({ success: true, collection: c })
  } catch (err) { oops(res, err, 'bank.createCollection') }
}
const getCollection = async (req, res) => {
  try {
    const t = T(req)
    const c = await QuestionCollection.findOne(colFilter(t, req.params.id)).lean()
    if (!c || (c.ownerTutorId !== t.id && !c.shared)) return fail(res, 404, 'Collection not found')
    const questions = []
    for (const it of c.items) {
      const doc = await bank.findQuestion(it.module, it.subject, it.questionId)
      if (doc && await bank.canRead(t, doc)) questions.push(bank.summary(doc, it.module, it.subject, t))
    }
    res.json({ success: true, collection: { ...c, mine: c.ownerTutorId === t.id }, questions })
  } catch (err) { oops(res, err, 'bank.getCollection') }
}
// PATCH /bank/collections/:id { name?, description?, shared?, add?: [{module,subject,questionId}], remove?: [questionId] }
const updateCollection = async (req, res) => {
  try {
    const t = T(req)
    const c = await QuestionCollection.findOne({ ...colFilter(t, req.params.id), ownerTutorId: t.id })
    if (!c) return fail(res, 404, 'Collection not found')
    if (req.body.name !== undefined) c.name = String(req.body.name).trim().slice(0, 80) || c.name
    if (req.body.description !== undefined) c.description = String(req.body.description).slice(0, 500)
    if (req.body.shared !== undefined) c.shared = !!req.body.shared
    for (const it of (Array.isArray(req.body.add) ? req.body.add : []).slice(0, 100)) {
      const doc = await bank.findQuestion(it.module, it.subject, it.questionId)
      if (!doc || !(await bank.canRead(t, doc))) return fail(res, 404, 'Question not found')
      if (!c.items.some((x) => x.questionId === String(doc._id))) c.items.push({ module: it.module, subject: it.subject, questionId: String(doc._id) })
    }
    const remove = new Set((Array.isArray(req.body.remove) ? req.body.remove : []).map(String))
    if (remove.size) c.items = c.items.filter((x) => !remove.has(x.questionId))
    await c.save()
    res.json({ success: true, collection: c })
  } catch (err) { oops(res, err, 'bank.updateCollection') }
}
const deleteCollection = async (req, res) => {
  try {
    const t = T(req)
    const r = await QuestionCollection.deleteOne({ ...colFilter(t, req.params.id), ownerTutorId: t.id })
    if (!r.deletedCount) return fail(res, 404, 'Collection not found')
    await audit(req, 'question_collection.delete', { targetType: 'question_collection', targetId: req.params.id, orgId: t.orgId })
    res.json({ success: true })
  } catch (err) { oops(res, err, 'bank.deleteCollection') }
}

module.exports = {
  meta, list, getOne, create, update, archive, duplicate, revisions, stats, statsMany, uploadImage, importQuestions, exportCsv,
  bulkUpdate, share, myShares, listCollections, createCollection, getCollection, updateCollection, deleteCollection, qualityStats,
}
