// What the engine needs to know about a question, from whatever metadata it
// carries. Content v3 adds level 0..8, skill, age_band, graded and qa.status;
// older or teacher-made questions get sensible derived values. Pure.
const { MIN_LEVEL, MAX_LEVEL } = require('../../config/learning')

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

// The compact view of a question the round composer works on.
function metaOf(q, subject) {
  return {
    _id: String(q._id || ''),
    id: q.id,
    level: itemLevel(q),
    skill: deriveSkill(q, subject),
    skillName: deriveSkillName(q),
    graded: isGraded(q),
    ageBand: ageBandOf(q),
    interaction: q.interaction || null,
    verified: q.qa?.status === 'verified',
    qaStatus: q.qa?.status || null,
  }
}

// The fields the round composer needs (a light DB projection).
const META_FIELDS = 'id level skill skillIds academic.skill question_type interaction graded qa.status age_band speech_scoring.expected_keywords correct_answer'

module.exports = { slug, deriveSkill, deriveSkillName, isGraded, isServable, itemLevel, ageBandOf, metaOf, META_FIELDS, isOpenAnswer }
