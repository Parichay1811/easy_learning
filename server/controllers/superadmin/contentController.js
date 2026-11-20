// Content (SUP-030, SUP-032): the built-in Learnigo question banks (Listen/Read/
// Write/Speak x English/Maths/Science; only seed content, uploadBatchId null,
// never an organisation's own uploads, design-guide 5.4) with translation
// coverage, browse, edit and staff tags; and the AI Teacher's own admin data
// (stats, topics with no lesson, heard-fix list, voice cache) read through its
// existing endpoints.
const { questionModels, getQuestionModel, MODULES, SUBJECTS } = require('../../utils/questionModels')
const ai = require('../../services/aiTeacherAdmin')
const { readPlatformSettings } = require('./opsController')
const { audit } = require('../../utils/audit')
const { cached, clear } = require('../../utils/ttlCache')
const { h, fail, paging, rx } = require('./util')

const BUILT_IN = { uploadBatchId: null }
const EDITABLE = ['instruction', 'prompt', 'audio_text', 'options', 'correct_answer', 'accepted_answers', 'hints', 'feedback', 'worked_example', 'level', 'level_name', 'difficulty_band', 'question', 'answer', 'hint', 'sentence', 'text', 'title', 'content']

const banks = h(async (req) => {
  if (req.query.fresh) clear('content:') // the page's "refresh" button
  const out = await cached('content:banks', 60_000, async () => {
    const langs = (await readPlatformSettings())['platform.languages'].value.filter((l) => l !== 'en')
    const rows = []
    for (const m of MODULES) for (const s of SUBJECTS) {
      const Model = questionModels[m][s]
      const [builtIn, orgUploads, byLang, byLevel, flagged] = await Promise.all([
        Model.countDocuments(BUILT_IN),
        Model.countDocuments({ uploadBatchId: { $ne: null } }),
        Model.aggregate([{ $match: BUILT_IN }, { $project: { t: { $objectToArray: { $ifNull: ['$translations', {}] } } } }, { $unwind: '$t' }, { $group: { _id: '$t.k', n: { $sum: 1 } } }]),
        Model.aggregate([{ $match: BUILT_IN }, { $group: { _id: '$level', n: { $sum: 1 } } }]),
        Model.collection.countDocuments({ uploadBatchId: null, 'staffTags.0': { $exists: true } }),
      ])
      const tr = Object.fromEntries(byLang.map((x) => [x._id, x.n]))
      rows.push({ module: m, subject: s, builtIn, orgUploads, tagged: flagged, levels: Object.fromEntries(byLevel.map((x) => [x._id ?? 'none', x.n])), translations: Object.fromEntries(langs.map((l) => [l, { n: tr[l] || 0, pct: builtIn ? Math.round(((tr[l] || 0) / builtIn) * 100) : null }])) })
    }
    return { rows, languages: langs }
  })
  return out
})

const listQuestions = h(async (req) => {
  const Model = getQuestionModel(req.params.module, req.params.subject)
  if (!Model) throw fail(404, 'Unknown bank')
  const { limit, skip, page } = paging(req.query, { def: 25, max: 100 })
  const f = { ...BUILT_IN }
  if (req.query.q) { const r = rx(req.query.q); f.$or = [{ id: r }, { prompt: r }, { instruction: r }, { question: r }, { sentence: r }, { text: r }] }
  if (req.query.level) f.level = Number(req.query.level)
  if (req.query.tag) f.staffTags = String(req.query.tag)
  if (req.query.missing) f[`translations.${String(req.query.missing).replace(/[^a-z-]/gi, '')}`] = { $exists: false }
  const [total, rows] = await Promise.all([
    Model.collection.countDocuments(f),
    Model.collection.find(f, { projection: { id: 1, prompt: 1, instruction: 1, question: 1, sentence: 1, text: 1, level: 1, difficulty_band: 1, interaction: 1, staffTags: 1, translations: 1, correct_answer: 1, updatedAt: 1 } }).sort({ id: 1 }).skip(skip).limit(limit).toArray(),
  ])
  return { total, page, rows: rows.map((q) => ({ ...q, _id: String(q._id), translations: Object.keys(q.translations || {}) })) }
})

const getQuestion = h(async (req) => {
  const Model = getQuestionModel(req.params.module, req.params.subject)
  if (!Model) throw fail(404, 'Unknown bank')
  const q = await Model.collection.findOne({ ...BUILT_IN, id: String(req.params.id) })
  if (!q) throw fail(404, 'Question not found')
  return { question: { ...q, _id: String(q._id) } }
})

const updateQuestion = h(async (req) => {
  const Model = getQuestionModel(req.params.module, req.params.subject)
  if (!Model) throw fail(404, 'Unknown bank')
  const q = await Model.collection.findOne({ ...BUILT_IN, id: String(req.params.id) })
  if (!q) throw fail(404, 'Question not found')
  const set = {}
  for (const k of EDITABLE) if (req.body?.[k] !== undefined) set[k] = req.body[k]
  if (set.level !== undefined) { const n = Number(set.level); if (!(Number.isInteger(n) && n >= 0 && n <= 8)) throw fail(400, 'Level is 0 to 8.'); set.level = n }
  if (req.body?.staffTags !== undefined) {
    if (!Array.isArray(req.body.staffTags)) throw fail(400, 'staffTags must be a list.')
    set.staffTags = [...new Set(req.body.staffTags.map((t) => String(t).trim().toLowerCase().slice(0, 40)).filter(Boolean))].slice(0, 20)
  }
  if (!Object.keys(set).length) throw fail(400, 'Nothing to change.')
  if (JSON.stringify(set).length > 50_000) throw fail(400, 'Too large.')
  set.updatedAt = new Date()
  await Model.collection.updateOne({ _id: q._id }, { $set: set })
  clear('content:')
  const before = Object.fromEntries(Object.keys(set).filter((k) => k !== 'updatedAt').map((k) => [k, q[k] ?? null]))
  await audit(req, 'content.question.update', { targetType: 'question', targetId: `${req.params.module}_${req.params.subject}:${q.id}`, meta: { before, after: set } })
  return { question: { ...q, ...set, _id: String(q._id) } }
})

// ── SUP-032 AI Teacher content ───────────────────────────────────────────────
const aiOverview = h(async () => {
  const [admin, heard, health] = await Promise.all([ai.get('/admin'), ai.get('/heard'), ai.get('/health')])
  if (!admin.ok) return { available: false, message: admin.message }
  const b = admin.body
  const topics = {}
  for (const r of b.recent || []) if (r.topic) topics[r.topic] = (topics[r.topic] || 0) + 1
  return {
    available: true,
    packs: b.packs, factory: b.factory || null, stats: b.stats, tts: b.tts,
    todos: (b.todos || []).slice(0, 100),
    recent: (b.recent || []).slice(0, 60),
    topTopics: Object.entries(topics).map(([topic, n]) => ({ topic, n })).sort((a, b2) => b2.n - a.n).slice(0, 15),
    heard: heard.ok ? heard.body.fixes : null,
    health: health.ok ? { ready: health.body.ready, voice: health.body.voice, hearing: health.body.hearing, llm: health.body.llm, model: health.body.model, kb: health.body.kb, packCount: health.body.packCount } : null,
  }
})

const aiTodoDone = h(async (req) => {
  const key = String(req.body?.key || '')
  if (!key) throw fail(400, 'Which topic?')
  const r = await ai.post('/admin/done', { key })
  if (!r.ok) throw fail(502, r.message)
  await audit(req, 'content.ai.todo_done', { targetType: 'ai_topic', targetId: key.slice(0, 120) })
  return { done: true }
})

module.exports = { banks, listQuestions, getQuestion, updateQuestion, aiOverview, aiTodoDone }
