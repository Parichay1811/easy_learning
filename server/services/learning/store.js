// Database side of the learning engine: profiles, skill rows and the question
// pool. The rules live in the pure modules next to this file.
const LearnerProfile = require('../../models/learning/LearnerProfile')
const SkillMastery = require('../../models/learning/SkillMastery')
const { getQuestionModel } = require('../../utils/questionModels')
const { getStudentOrgInfo, getVisibleUploadBatchIds } = require('../../utils/questionVisibility')
const { applyQuestionTranslation } = require('../../utils/applyQuestionTranslation')
const { cached } = require('../../utils/ttlCache')
const cfg = require('../../config/learning')
const { metaOf, isServable, META_FIELDS } = require('./questionMeta')

const lower = (s) => String(s || '').trim().toLowerCase()

// One write at a time per learner (one server process): two answers sent at
// once must not overwrite each other's profile changes.
const queues = new Map()
function serial(key, fn) {
  const prev = queues.get(key) || Promise.resolve()
  const run = prev.then(fn, fn)
  const tail = run.then(() => {}, () => {})
  queues.set(key, tail)
  tail.then(() => { if (queues.get(key) === tail) queues.delete(key) })
  return run
}

// A profile with every default filled in (not saved until something changes).
function defaultProfile(email) {
  const doc = new LearnerProfile({ email: lower(email) }).toObject()
  delete doc._id
  return doc
}

async function getProfile(email) {
  const found = await LearnerProfile.findOne({ email: lower(email) }).lean()
  if (!found) return defaultProfile(email)
  // Fill defaults for fields added later.
  const base = defaultProfile(email)
  return { ...base, ...found, levels: { ...base.levels, ...(found.levels || {}) } }
}

const STORED = ['levels', 'ageBand', 'pace', 'supports', 'goals', 'overrides', 'explanationPrefs', 'suggestions', 'baselineDone',
  'recent', 'sitting', 'history', 'lastMessageKey', 'messageCount', 'last', 'lastActiveAt']

async function saveProfile(email, profile) {
  const $set = {}
  for (const k of STORED) if (profile[k] !== undefined) $set[k] = profile[k]
  await LearnerProfile.updateOne({ email: lower(email) }, { $set }, { upsert: true, runValidators: true })
}

async function getSkills(email, subject) {
  const filter = { email: lower(email) }
  if (subject) filter.subject = subject
  return SkillMastery.find(filter).select('-__v -createdAt -updatedAt').lean()
}

async function getSkill(email, skill) {
  return SkillMastery.findOne({ email: lower(email), skill }).lean()
}

const SKILL_FIELDS = ['subject', 'name', 'level', 'mastery', 'attempts', 'correct', 'independent', 'streak', 'missesSinceSuccess', 'box', 'due',
  'supportStep', 'missesAtStep', 'parkedUntil', 'helpedBy', 'lastOutcome', 'lastAt', 'lastCorrectAt', 'lastMissAt', 'masteredAt', 'modules', 'misconceptions']

async function saveSkill(email, skill) {
  const $set = {}
  for (const k of SKILL_FIELDS) if (skill[k] !== undefined) $set[k] = skill[k]
  await SkillMastery.updateOne({ email: lower(email), skill: skill.skill }, { $set }, { upsert: true, runValidators: true })
}

// Reset what the engine learned. Locks and overrides set by a guardian or
// teacher stay (a learner cannot reset them away); `settings` also clears the
// learner's own settings (pace, age band, supports, goals).
async function resetProfile(email, { settings = false } = {}) {
  const e = lower(email)
  const removedSkills = (await SkillMastery.deleteMany({ email: e })).deletedCount
  const old = await LearnerProfile.findOne({ email: e }).lean()
  await LearnerProfile.deleteOne({ email: e })
  if (old) {
    const keep = defaultProfile(e)
    let kept = false
    for (const s of cfg.SUBJECTS) {
      const ls = old.levels?.[s]
      if (ls?.locked) { keep.levels[s] = { ...keep.levels[s], level: ls.level, source: ls.source, locked: true, lockedBy: ls.lockedBy, setAt: ls.setAt, setBy: ls.setBy }; kept = true }
    }
    if (old.overrides?.length) { keep.overrides = old.overrides; kept = true }
    if (!settings) {
      for (const k of ['pace', 'ageBand', 'supports', 'goals']) keep[k] = old[k] ?? keep[k]
      kept = true
    } else if (old.goals?.some((g) => g.by !== 'learner')) {
      keep.goals = old.goals.filter((g) => g.by !== 'learner'); kept = true
    }
    if (kept) await saveProfile(e, keep)
  }
  return { skills: removedSkills, profile: old ? 1 : 0 }
}

// ── Questions ───────────────────────────────────────────────────────────────

// The same visibility rule as GET /api/<module>/<subject> (utils/questionVisibility.js):
// a learner outside any organisation sees Learnigo's questions; a school
// learner sees only the questions their teachers uploaded for their groups.
function visibilityFor(email) {
  let info = null
  return async (module, subject) => {
    if (!info) info = await getStudentOrgInfo(email)
    if (!info.isOrgStudent) return { uploadBatchId: null }
    const ids = await getVisibleUploadBatchIds(module, subject, info.batchIds)
    return { uploadBatchId: { $in: ids } }
  }
}

const baseFilter = (vis) => ({ status: 'approved', archived: { $ne: true }, 'qa.status': { $ne: 'excluded' }, ...vis })

// The servable questions of one module x subject, as compact metadata.
async function loadPool(email, subject, module, vis = visibilityFor(email)) {
  const Model = getQuestionModel(module, subject)
  if (!Model) return []
  const docs = await Model.find(baseFilter(await vis(module, subject))).select(META_FIELDS).lean()
  return docs.filter(isServable).map((q) => metaOf(q, subject))
}

// Highest level with content per subject (across its four modules), for this learner.
async function ceilings(email) {
  return cached(`learn:ceil:${lower(email)}`, 60_000, async () => {
    const vis = visibilityFor(email)
    const out = {}
    for (const subject of cfg.SUBJECTS) {
      let max = null
      for (const module of cfg.MODULES) {
        const Model = getQuestionModel(module, subject)
        const levels = (await Model.distinct('level', baseFilter(await vis(module, subject)))).filter((l) => Number.isInteger(l))
        if (levels.length) max = Math.max(max ?? -1, ...levels)
      }
      out[subject] = max
    }
    return out
  })
}

const ENGINE_FIELDS = `${META_FIELDS} distractor_insight`

// One question the learner could see, for logging an answer.
async function findQuestion(email, module, subject, questionId) {
  const Model = getQuestionModel(module, subject)
  if (!Model || typeof questionId !== 'string' || !questionId) return null
  const vis = await visibilityFor(email)(module, subject)
  return Model.findOne({ id: questionId.slice(0, 80), status: 'approved', ...vis }).select(ENGINE_FIELDS).lean()
}

// Levels of question ids within a subject (any module), for baseline results.
async function levelsOf(email, subject, ids) {
  const vis = visibilityFor(email)
  const out = new Map()
  for (const module of cfg.MODULES) {
    const Model = getQuestionModel(module, subject)
    const docs = await Model.find({ id: { $in: ids }, ...baseFilter(await vis(module, subject)) }).select(META_FIELDS).lean()
    for (const d of docs) out.set(d.id, metaOf(d, subject))
  }
  return out
}

// The plain-language notes written with each question (analysis.parent_note and
// analysis.teacher_action_if_missed), for misconceptions' source questions.
// refs: [{ subject, module, q }] -> Map "<subject>|<module>|<q>" -> { parentNote, teacherAction }
async function questionNotes(refs) {
  const groups = new Map()
  for (const r of refs) {
    if (!getQuestionModel(r.module, r.subject) || typeof r.q !== 'string') continue
    const k = `${r.subject}|${r.module}`
    if (!groups.has(k)) groups.set(k, { ...r, ids: new Set() })
    groups.get(k).ids.add(r.q)
  }
  const out = new Map()
  for (const g of groups.values()) {
    const docs = await getQuestionModel(g.module, g.subject).find({ id: { $in: [...g.ids] } }).select('id analysis.parent_note analysis.teacher_action_if_missed').lean()
    for (const d of docs) {
      const text = (v) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 400) : null)
      out.set(`${g.subject}|${g.module}|${d.id}`, { parentNote: text(d.analysis?.parent_note), teacherAction: text(d.analysis?.teacher_action_if_missed) })
    }
  }
  return out
}

// Full questions, translated like GET /api/<module>/<subject>?lang=, in the order given.
async function fullQuestions(subject, module, picks, lang) {
  const Model = getQuestionModel(module, subject)
  const docs = await Model.find({ _id: { $in: picks.map((p) => p._id) } }).lean()
  const byId = new Map(docs.map((d) => [String(d._id), d]))
  return picks.filter((p) => byId.has(String(p._id))).map((p) => ({ pick: p, question: applyQuestionTranslation(byId.get(String(p._id)), lang) }))
}

module.exports = {
  serial, defaultProfile, getProfile, saveProfile, getSkills, getSkill, saveSkill, resetProfile,
  visibilityFor, loadPool, ceilings, findQuestion, levelsOf, fullQuestions, questionNotes, LearnerProfile, SkillMastery,
}
