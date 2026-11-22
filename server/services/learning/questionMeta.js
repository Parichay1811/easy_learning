// What the engine needs to know about a question, from whatever metadata it
// carries. Content v3 adds level 0..8, skill, age_band, graded and qa.status;
// older or teacher-made questions get sensible derived values. Pure.
const { MIN_LEVEL, MAX_LEVEL, stageOfBloom, chanceDiscount } = require('../../config/learning')

const slug = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

// One primary skill id. Ids without a subject prefix get one ("spelling" ->
// "english.spelling") so two subjects never share a skill by accident.
function deriveSkill(q, subject) {
  const raw = (typeof q.skill === 'string' && q.skill.trim())
    || (Array.isArray(q.skillIds) && q.skillIds.find((s) => typeof s === 'string' && s.trim()))
    || slug(q.academic?.skill)
    || `${subject}.${slug(q.question_type || q.interaction || 'general') || 'general'}`
  const id = String(raw).trim().toLowerCase().replace(/[^a-z0-9.\-_]/g, '-').slice(0, 80)
  return id.includes('.') ? id : `${subject}.${id}`
}

// A readable name for a skill when the catalogue has none.
function deriveSkillName(q) {
  const s = String(q.academic?.skill || q.question_type || q.interaction || '').replace(/[_-]+/g, ' ').trim()
  return s ? s.charAt(0).toUpperCase() + s.slice(1, 80) : 'Practice'
}

const isOpenAnswer = (v) => typeof v === 'string' && v.trim().toLowerCase() === 'open'

// false = practice only: never counted for mastery or levels.
function isGraded(q) {
  if (typeof q.graded === 'boolean') return q.graded
  if (q.qa?.status === 'needs_review') return false
  if (q.interaction === 'mic_record') {
    const kw = q.speech_scoring?.expected_keywords
    if (!Array.isArray(kw) || !kw.length) return false
  }
  if (isOpenAnswer(q.correct_answer)) return false
  return true
}

const isServable = (q) => q?.qa?.status !== 'excluded'

function itemLevel(q) {
  const n = Number(q.level)
  if (!Number.isInteger(n)) return null
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, n))
}

const ageBandOf = (q) => (q.age_band === 'young' ? 'young' : 'all')

const isEveryday = (q) => q?.everyday === true

// Stage 0..5 (the kind of thinking asked for): the item's own `stage` when the content has one,
// else derived the same way the content scripts do: everyday -> 0, else from cognition.bloom
// (remember 1, understand 2, apply 3, analyze/evaluate 4, create 4). null when nothing says.
function itemStage(q) {
  const n = Number(q?.stage)
  if (q?.stage != null && Number.isInteger(n) && n >= 0 && n <= 5) return n
  if (isEveryday(q)) return 0
  const b = typeof q?.cognition?.bloom === 'string' ? q.cognition.bloom.trim().toLowerCase() : ''
  return Number.isInteger(stageOfBloom[b]) ? stageOfBloom[b] : null
}

// How many answers a single-choice item offers (true/false = 2), else null (typed, spoken,
// ordering, multi-select... where guessing is unlikely). For the chance discount.
const SINGLE_CHOICE = new Set(['tap_mcq', 'true_false', 'drag_to_blank'])
function choicesOf(q) {
  if (q?.interaction === 'true_false') return 2
  if (!SINGLE_CHOICE.has(q?.interaction) || !Array.isArray(q.options)) return null
  return q.options.length >= 2 ? q.options.length : null
}

// The weight of a right answer on this item in the mastery average (1 = full).
const chanceWeight = (choices) => (Number.isInteger(choices) && chanceDiscount[choices] != null ? chanceDiscount[choices] : 1)

// The compact view of a question the round composer works on.
function metaOf(q, subject) {
  return {
    _id: String(q._id || ''),
    id: q.id == null ? q.id : String(q.id), // older school uploads have numeric ids
    level: itemLevel(q),
    skill: deriveSkill(q, subject),
    skillName: deriveSkillName(q),
    graded: isGraded(q),
    ageBand: ageBandOf(q),
    interaction: q.interaction || null,
    verified: q.qa?.status === 'verified',
    qaStatus: q.qa?.status || null,
    stage: itemStage(q),
    everyday: isEveryday(q),
    choices: choicesOf(q),
  }
}

// The fields the round composer needs (a light DB projection).
const META_FIELDS = 'id level skill skillIds academic.skill question_type interaction graded qa.status age_band speech_scoring.expected_keywords correct_answer stage everyday cognition.bloom options'

module.exports = { slug, deriveSkill, deriveSkillName, isGraded, isServable, itemLevel, ageBandOf, metaOf, META_FIELDS, isOpenAnswer, itemStage, choicesOf, chanceWeight, isEveryday }
