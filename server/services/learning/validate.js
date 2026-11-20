// Strict validation of what learners, guardians and teachers may send. Pure.
// Every function returns { value, errors }: unknown fields and wrong types are
// errors (400), never silently stored.
const cfg = require('../../config/learning')

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
const SKILL_RE = /^[a-z0-9][a-z0-9._-]{0,79}$/
const isLevel = (v) => Number.isInteger(v) && v >= cfg.MIN_LEVEL && v <= cfg.MAX_LEVEL
// Printable text only: no markup, no control characters.
const cleanText = (s) => String(s).replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim()

function supports(input, errors) {
  if (!isObj(input)) { errors.push('supports must be an object'); return undefined }
  const out = {}
  const fields = new Map(cfg.SUPPORT_FIELDS.map((f) => [f.key, f]))
  for (const [k, v] of Object.entries(input)) {
    const f = fields.get(k)
    if (!f) { errors.push(`supports.${k} is not a known setting`); continue }
    if (f.type === 'bool' && typeof v !== 'boolean') errors.push(`supports.${k} must be true or false`)
    else if (f.type === 'range' && !(typeof v === 'number' && Number.isFinite(v) && v >= f.min && v <= f.max)) errors.push(`supports.${k} must be a number from ${f.min} to ${f.max}`)
    else if (f.type === 'choice' && !f.options.includes(v)) errors.push(`supports.${k} must be one of ${f.options.join(', ')}`)
    else out[k] = v
  }
  return out
}

function goals(input, errors, by) {
  if (!Array.isArray(input)) { errors.push('goals must be a list'); return undefined }
  if (input.length > cfg.limits.goals) { errors.push(`at most ${cfg.limits.goals} goals`); return undefined }
  const out = []
  const ids = new Set()
  input.forEach((g, i) => {
    if (!isObj(g)) { errors.push(`goals[${i}] must be an object`); return }
    const extra = Object.keys(g).filter((k) => !['id', 'text', 'subject', 'target', 'done'].includes(k))
    if (extra.length) errors.push(`goals[${i}]: unknown field ${extra[0]}`)
    const text = typeof g.text === 'string' ? cleanText(g.text) : ''
    if (!text || text.length > cfg.limits.goalText) errors.push(`goals[${i}].text must be 1 to ${cfg.limits.goalText} characters`)
    if (g.subject != null && !cfg.SUBJECTS.includes(g.subject)) errors.push(`goals[${i}].subject is not a subject`)
    if (g.target != null && !(Number.isInteger(g.target) && g.target >= 0 && g.target <= 1000)) errors.push(`goals[${i}].target must be a whole number from 0 to 1000`)
    if (g.done != null && typeof g.done !== 'boolean') errors.push(`goals[${i}].done must be true or false`)
    let id = typeof g.id === 'string' && /^[a-zA-Z0-9_-]{1,40}$/.test(g.id) ? g.id : null
    if (g.id != null && !id) errors.push(`goals[${i}].id is not valid`)
    if (!id) id = `g${Date.now().toString(36)}${i}`
    if (ids.has(id)) errors.push(`goals[${i}].id is repeated`)
    ids.add(id)
    out.push({ id, text, subject: g.subject ?? null, target: g.target ?? null, done: !!g.done, by })
  })
  return out
}

function overrides(input, errors, by) {
  if (!Array.isArray(input)) { errors.push('overrides must be a list'); return undefined }
  if (input.length > cfg.limits.overrides) { errors.push(`at most ${cfg.limits.overrides} overrides`); return undefined }
  const out = []
  input.forEach((o, i) => {
    if (!isObj(o)) { errors.push(`overrides[${i}] must be an object`); return }
    const extra = Object.keys(o).filter((k) => !['type', 'subject', 'skill'].includes(k))
    if (extra.length) errors.push(`overrides[${i}]: unknown field ${extra[0]}`)
    if (!cfg.OVERRIDE_TYPES.includes(o.type)) { errors.push(`overrides[${i}].type must be one of ${cfg.OVERRIDE_TYPES.join(', ')}`); return }
    if (o.subject != null && !cfg.SUBJECTS.includes(o.subject)) errors.push(`overrides[${i}].subject is not a subject`)
    if (o.type === 'hold_level' && !o.subject) errors.push(`overrides[${i}]: hold_level needs a subject`)
    if (o.type !== 'hold_level' && !(typeof o.skill === 'string' && SKILL_RE.test(o.skill))) errors.push(`overrides[${i}]: ${o.type} needs a skill id`)
    out.push({ type: o.type, subject: o.subject ?? null, skill: o.type === 'hold_level' ? null : o.skill, by })
  })
  return out
}

// Learner: PUT /api/learn/profile { levels?: { maths: 3 }, ageBand?, pace?, supports?, goals? }
function learnerUpdate(body) {
  const errors = []
  const value = {}
  if (!isObj(body)) return { value, errors: ['send a JSON object'] }
  const extra = Object.keys(body).filter((k) => !['levels', 'ageBand', 'pace', 'supports', 'goals'].includes(k))
  if (extra.length) errors.push(`unknown field ${extra[0]}`)
  if (body.levels !== undefined) {
    if (!isObj(body.levels)) errors.push('levels must be an object')
    else {
      value.levels = {}
      for (const [s, v] of Object.entries(body.levels)) {
        if (!cfg.SUBJECTS.includes(s)) errors.push(`levels.${s} is not a subject`)
        else if (!isLevel(v)) errors.push(`levels.${s} must be a whole number from ${cfg.MIN_LEVEL} to ${cfg.MAX_LEVEL}`)
        else value.levels[s] = { level: v }
      }
    }
  }
  if (body.ageBand !== undefined) {
    if (body.ageBand !== null && !cfg.AGE_BANDS.includes(body.ageBand)) errors.push(`ageBand must be one of ${cfg.AGE_BANDS.join(', ')} or null`)
    else value.ageBand = body.ageBand
  }
  if (body.pace !== undefined) {
    if (!cfg.PACES.includes(body.pace)) errors.push(`pace must be one of ${cfg.PACES.join(', ')}`)
    else value.pace = body.pace
  }
  if (body.supports !== undefined) value.supports = supports(body.supports, errors)
  if (body.goals !== undefined) value.goals = goals(body.goals, errors, 'learner')
  return { value, errors }
}

// Guardian / teacher: PUT .../learning { levels?: { maths: { level, locked } | 3 }, ageBand?, pace?, supports?, goals?, overrides? }
function adultUpdate(body, by) {
  const errors = []
  const value = {}
  if (!isObj(body)) return { value, errors: ['send a JSON object'] }
  const extra = Object.keys(body).filter((k) => !['levels', 'ageBand', 'pace', 'supports', 'goals', 'overrides'].includes(k))
  if (extra.length) errors.push(`unknown field ${extra[0]}`)
  if (body.levels !== undefined) {
    if (!isObj(body.levels)) errors.push('levels must be an object')
    else {
      value.levels = {}
      for (const [s, v] of Object.entries(body.levels)) {
        if (!cfg.SUBJECTS.includes(s)) { errors.push(`levels.${s} is not a subject`); continue }
        const spec = isObj(v) ? v : { level: v }
        const bad = Object.keys(spec).filter((k) => !['level', 'locked'].includes(k))
        if (bad.length) { errors.push(`levels.${s}: unknown field ${bad[0]}`); continue }
        if (spec.level !== undefined && !isLevel(spec.level)) { errors.push(`levels.${s}.level must be a whole number from ${cfg.MIN_LEVEL} to ${cfg.MAX_LEVEL}`); continue }
        if (spec.locked !== undefined && typeof spec.locked !== 'boolean') { errors.push(`levels.${s}.locked must be true or false`); continue }
        if (spec.level === undefined && spec.locked === undefined) { errors.push(`levels.${s} needs a level or locked`); continue }
        value.levels[s] = { ...(spec.level !== undefined ? { level: spec.level } : {}), ...(spec.locked !== undefined ? { locked: spec.locked } : {}) }
      }
    }
  }
  if (body.ageBand !== undefined) {
    if (body.ageBand !== null && !cfg.AGE_BANDS.includes(body.ageBand)) errors.push(`ageBand must be one of ${cfg.AGE_BANDS.join(', ')} or null`)
    else value.ageBand = body.ageBand
  }
  if (body.pace !== undefined) {
    if (!cfg.PACES.includes(body.pace)) errors.push(`pace must be one of ${cfg.PACES.join(', ')}`)
    else value.pace = body.pace
  }
  if (body.supports !== undefined) value.supports = supports(body.supports, errors)
  if (body.goals !== undefined) value.goals = goals(body.goals, errors, by)
  if (body.overrides !== undefined) value.overrides = overrides(body.overrides, errors, by)
  return { value, errors }
}

module.exports = { learnerUpdate, adultUpdate, SKILL_RE, isLevel, cleanText }
