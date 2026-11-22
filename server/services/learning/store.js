// Database side of the learning engine: profiles, skill rows and the question
// pool. The rules live in the pure modules next to this file.
const LearnerProfile = require('../../models/learning/LearnerProfile')
const SkillMastery = require('../../models/learning/SkillMastery')
const LearningDecision = require('../../models/learning/LearningDecision')
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
  'recent', 'sitting', 'history', 'lastMessageKey', 'messageCount', 'last', 'lastActiveAt',
  'band', 'rounds', 'baseline', 'baselineAcc', 'journal', 'growth']

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
  'supportStep', 'missesAtStep', 'parkedUntil', 'helpedBy', 'lastOutcome', 'lastAt', 'lastCorrectAt', 'lastMissAt', 'masteredAt', 'modules', 'misconceptions',
  'rightItems', 'topStage', 'stageAvail', 'byStage', 'legacyEvidence', 'probe', 'explain']

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
  // The engine's decisions about what it forgot go too.
  await LearningDecision.deleteMany({ email: e })
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

// One question the learner could see, for logging an answer. Older school uploads stored numeric
// ids (e.g. 9001) although the schema says String: the query is cast to a string and would miss
// them, so a numeric id is matched as a number too.
async function findQuestion(email, module, subject, questionId) {
  const Model = getQuestionModel(module, subject)
  const qid = typeof questionId === 'number' && Number.isInteger(questionId) ? String(questionId) : questionId
  if (!Model || typeof qid !== 'string' || !qid) return null
  const vis = await visibilityFor(email)(module, subject)
  const base = { status: 'approved', ...vis }
  const doc = await Model.findOne({ id: qid.slice(0, 80), ...base }).select(ENGINE_FIELDS).lean()
  if (doc || !/^\d{1,15}$/.test(qid)) return doc
  // (Mongoose casts a plain number here too, so compare the stored id as text.)
  return Model.findOne({ $expr: { $eq: [{ $toString: '$id' }, qid] }, ...base }).select(ENGINE_FIELDS).lean()
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

// What content this learner can see, per skill (cached a minute): subject, modules, levels and
// stages it has questions at, and the everyday-curiosity items (graded ones) for discoveries.
//   -> { skills: Map id -> { skill, subject, modules: { module: n }, moduleMax: { module: highest graded stage }, levels: [],
//        stages: [stages with graded items], practiceStages: [stages with practice-only items], maxStage (graded), count },
//        everyday: [meta + subject, module] }
async function skillIndex(email) {
  return cached(`learn:skills:${lower(email)}`, 60_000, async () => {
    const vis = visibilityFor(email)
    const skills = new Map()
    const everyday = []
    for (const subject of cfg.SUBJECTS) {
      for (const module of cfg.MODULES) {
        for (const q of await loadPool(email, subject, module, vis)) {
          let s = skills.get(q.skill)
          if (!s) { s = { skill: q.skill, subject, modules: {}, moduleMax: {}, levels: [], stages: [], practiceStages: [], maxStage: null, count: 0 }; skills.set(q.skill, s) }
          s.count += 1
          s.modules[module] = (s.modules[module] || 0) + 1
          if (Number.isInteger(q.level) && !s.levels.includes(q.level)) s.levels.push(q.level)
          // Stages count only where an answer can count (graded items): e.g. the stage-5 transfer items
          // are practice-only, so they never make "beyond recognition" or a challenge out of reach.
          if (Number.isInteger(q.stage) && q.graded) {
            s.moduleMax[module] = Math.max(s.moduleMax[module] ?? -1, q.stage)
            if (!s.stages.includes(q.stage)) { s.stages.push(q.stage); s.maxStage = Math.max(s.maxStage ?? -1, q.stage) }
          } else if (Number.isInteger(q.stage) && !s.practiceStages.includes(q.stage)) s.practiceStages.push(q.stage)
          if (q.everyday && q.graded) everyday.push({ ...q, subject, module })
        }
      }
    }
    for (const s of skills.values()) { s.levels.sort((a, b) => a - b); s.stages.sort((a, b) => a - b) }
    everyday.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    return { skills, everyday }
  })
}

// A baseline for a learner whose first answers came before baselines were kept: their first
// `evidence.baselineAttempts` answers in the subject from the answer history (timed games and
// placement left out); the level is the most common level of those questions.
async function historyBaseline(email, subject) {
  const StudentAnswer = require('../../models/StudentAnswer')
  const rows = await StudentAnswer.find({ email: lower(email), subject, mode: { $nin: cfg.ignoreModes } })
    .sort({ timestamp: 1 }).limit(cfg.evidence.baselineAttempts).select('module questionId correct timestamp').lean()
  if (!rows.length) return null
  const levels = {}
  const byModule = new Map()
  for (const r of rows) if (r.questionId && cfg.MODULES.includes(r.module)) { if (!byModule.has(r.module)) byModule.set(r.module, []); byModule.get(r.module).push(r.questionId) }
  for (const [module, ids] of byModule) {
    const Model = getQuestionModel(module, subject)
    if (!Model) continue
    const docs = await Model.find({ id: { $in: ids } }).select('id level').lean()
    const lv = new Map(docs.map((d) => [d.id, d.level]))
    for (const id of ids) { const l = lv.get(id); if (Number.isInteger(l)) levels[l] = (levels[l] || 0) + 1 }
  }
  const e = Object.entries(levels).map(([l, n]) => [Number(l), n]).sort((a, b) => b[1] - a[1] || a[0] - b[0])
  return {
    level: e.length ? e[0][0] : null,
    accuracy: Math.round((rows.filter((r) => r.correct).length / rows.length) * 100) / 100,
    n: rows.length, at: rows[rows.length - 1].timestamp, source: 'first_attempts',
  }
}

// The explanation for a repeated misconception, from the question it last came from:
// its worked example (translated when there is a translation), else its note for grown-ups,
// else the misconception itself. English-subject items are never translated.
async function explainFor({ subject, module, q }, { skill, skillName, misconception = '', lang = 'en' } = {}) {
  const { buildExplain } = require('./explain')
  const Model = getQuestionModel(module, subject)
  const useLang = subject === 'english' ? 'en' : (lang || 'en')
  const fields = ['id', 'worked_example', 'analysis.teacher_action_if_missed']
  if (useLang !== 'en') fields.push(`translations.${useLang}.worked_example`)
  const doc = Model && typeof q === 'string' ? await Model.findOne({ id: q }).select(fields.join(' ')).lean() : null
  return buildExplain(doc, { skill, skillName, misconception, lang: useLang })
}

// ── Decision log ────────────────────────────────────────────────────────────
async function addDecisions(email, list) {
  if (!list?.length) return
  await LearningDecision.insertMany(list.map((d) => ({ ...d, email: lower(email) })), { ordered: false })
}

async function getDecisions(email, limit = 20) {
  return LearningDecision.find({ email: lower(email) }).sort({ at: -1, _id: -1 }).limit(Math.max(1, Math.min(100, limit))).select('-_id -__v -email').lean()
}

// ── Growth badges (StudentAchievement) ──────────────────────────────────────
// Stored once with their evidence (numbers only). Written through the collection so the
// evidence is kept whatever the model's fields; the unique (email, achievementId) index keeps
// it to one per learner. -> true when it is new.
async function awardAchievement(email, id, evidence, now = new Date()) {
  const StudentAchievement = require('../../models/StudentAchievement')
  const r = await StudentAchievement.collection.updateOne(
    { email: lower(email), achievementId: id },
    { $setOnInsert: { email: lower(email), achievementId: id, earnedAt: now, evidence: evidence || {} } },
    { upsert: true },
  )
  return !!r.upsertedCount
}

// Answers to these questions since a date (ids and times only), for today's discovery.
async function answeredSince(email, questionIds, since) {
  if (!questionIds.length) return []
  const StudentAnswer = require('../../models/StudentAnswer')
  return StudentAnswer.find({ email: lower(email), questionId: { $in: questionIds }, timestamp: { $gte: since } }).select('questionId timestamp -_id').lean()
}

// Rounds finished and days practised (counts, never time), for the evidence activity block.
async function activityCounts(email) {
  const StudentRound = require('../../models/StudentRound')
  const StudentActivity = require('../../models/StudentActivity')
  const e = lower(email)
  const [rounds, days] = await Promise.all([StudentRound.countDocuments({ email: e }), StudentActivity.countDocuments({ email: e, totalSessions: { $gt: 0 } })])
  return { rounds, days }
}

// Writes only the unfinished-round state (a GET round must not overwrite other profile fields).
async function saveRounds(email, rounds) {
  await LearnerProfile.updateOne({ email: lower(email) }, { $set: { rounds } }, { upsert: true, runValidators: true })
}

module.exports = {
  serial, defaultProfile, getProfile, saveProfile, getSkills, getSkill, saveSkill, resetProfile,
  visibilityFor, loadPool, ceilings, findQuestion, levelsOf, fullQuestions, questionNotes, LearnerProfile, SkillMastery, LearningDecision,
  skillIndex, historyBaseline, explainFor, addDecisions, getDecisions, awardAchievement, saveRounds, answeredSince, activityCounts,
}
