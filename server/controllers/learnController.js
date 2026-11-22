// The learner's adaptive-learning API (/api/learn, docs/learning/ADAPTIVE.md).
// Identity is always the signed-in learner (req.user.email from dashboardAuth).
const cfg = require('../config/learning')
const actions = require('../services/learning/actions')
const store = require('../services/learning/store')
const validate = require('../services/learning/validate')
const { validTz } = require('../analytics/record')

const STATUSES = ['correct', 'close', 'incorrect', 'uncertain', 'ungraded']
const emailOf = (req) => String(req.user?.email || '').toLowerCase()
const LANG_RE = /^[a-z]{2}(-[a-z]{2})?$/

const handle = (fn) => async (req, res) => {
  try {
    if (!emailOf(req)) return res.status(401).json({ success: false, message: 'Unauthorized' })
    await fn(req, res)
  } catch (err) {
    if (err instanceof actions.LearnError) return res.status(err.status).json({ success: false, message: err.message, ...(err.code ? { code: err.code } : {}) })
    if (err?.name === 'ValidationError' || err?.name === 'CastError') return res.status(400).json({ success: false, message: err.message })
    console.error('learn route error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const bad = (res, errors) => res.status(400).json({ success: false, message: errors[0], errors })

// subject + module (+ lang, size, seed) from a query string; null + errors when invalid.
function roundQuery(q, { needModule = true } = {}) {
  const errors = []
  const subject = String(q.subject || '').toLowerCase()
  const module = String(q.module || '').toLowerCase()
  if (!cfg.SUBJECTS.includes(subject)) errors.push(`subject must be one of ${cfg.SUBJECTS.join(', ')}`)
  if (needModule && !cfg.MODULES.includes(module)) errors.push(`module must be one of ${cfg.MODULES.join(', ')}`)
  const lang = String(q.lang || '').toLowerCase()
  if (lang && !LANG_RE.test(lang)) errors.push('lang must be a language code like "de"')
  let size
  if (q.size !== undefined) {
    size = Number(q.size)
    if (!Number.isInteger(size) || size < cfg.round.minSize || size > cfg.round.maxSize) errors.push(`size must be a whole number from ${cfg.round.minSize} to ${cfg.round.maxSize}`)
  }
  const seed = q.seed === undefined ? undefined : String(q.seed).slice(0, 64)
  // ?skill=<id>: a "Practise now" round centred on one skill (an unknown skill gives the normal round).
  let skill
  if (q.skill !== undefined) {
    skill = String(q.skill)
    if (!validate.SKILL_RE.test(skill)) errors.push('skill must be a skill id like "maths.subtraction-within-10"')
  }
  // ?mode=challenge (3 items one stage up on a strong skill) | discovery (everyday items); ?resume=1
  let mode = null
  if (q.mode !== undefined && q.mode !== '') {
    mode = String(q.mode).toLowerCase()
    if (!cfg.ROUND_MODES.includes(mode)) errors.push(`mode must be one of ${cfg.ROUND_MODES.join(', ')}`)
  }
  const resume = TRUE.includes(String(q.resume || '').toLowerCase())
  // ?source=next|welcome|journey|explore|challenge|discovery: the learner chose this round from there.
  let source = null
  if (q.source !== undefined && q.source !== '') {
    source = String(q.source).toLowerCase()
    if (!cfg.CHOICE_SOURCES.includes(source)) errors.push(`source must be one of ${cfg.CHOICE_SOURCES.join(', ')}`)
  }
  return { value: { subject, module, lang, size, seed, skill, mode, resume, source }, errors }
}

const TRUE = ['1', 'true', 'yes']
const tzOf = (req) => validTz(req.get?.('x-timezone') || 'UTC')
// ?lang= on the journey endpoints (the texts come back in English with keys; lang is checked, not required).
function langQuery(q, errors) {
  const lang = String(q.lang || '').toLowerCase()
  if (lang && !LANG_RE.test(lang)) errors.push('lang must be a language code like "de"')
  return lang
}

// GET /api/learn/profile
const getProfile = handle(async (req, res) => {
  res.json({ success: true, ...(await actions.view(emailOf(req))) })
})

// PUT /api/learn/profile { levels?: { maths: 3 }, ageBand?, pace?, supports?, goals? }
const putProfile = handle(async (req, res) => {
  const { value, errors } = validate.learnerUpdate(req.body)
  if (errors.length) return bad(res, errors)
  await actions.learnerUpdate(emailOf(req), value)
  res.json({ success: true, ...(await actions.view(emailOf(req))) })
})

// DELETE /api/learn/profile[?settings=1] — reset personalisation (answer history stays).
const deleteProfile = handle(async (req, res) => {
  const settings = ['1', 'true', 'yes'].includes(String(req.query.settings || '').toLowerCase())
  const removed = await store.serial(emailOf(req), () => store.resetProfile(emailOf(req), { settings }))
  res.json({ success: true, removed, ...(await actions.view(emailOf(req))) })
})

// POST /api/learn/suggestions/:id { accept: bool }
const answerSuggestion = handle(async (req, res) => {
  if (typeof req.body?.accept !== 'boolean') return bad(res, ['accept must be true or false'])
  const id = String(req.params.id || '')
  if (!/^[a-f0-9]{6,32}$/.test(id)) return res.status(404).json({ success: false, message: 'That suggestion is no longer there.', code: 'NOT_FOUND' })
  const result = await actions.answerSuggestion(emailOf(req), id, req.body.accept)
  res.json({ success: true, ...result, ...(await actions.view(emailOf(req))) })
})

// GET /api/learn/round?subject=maths&module=write&lang=de&size=10[&seed=][&skill=<id>][&mode=challenge|discovery][&resume=1][&source=next|...]
const getRound = handle(async (req, res) => {
  const { value, errors } = roundQuery(req.query)
  if (errors.length) return bad(res, errors)
  res.json({ success: true, ...(await actions.round(emailOf(req), value)) })
})

// DELETE /api/learn/round/resume?subject=&module= — "Start fresh": forget the unfinished round.
const deleteResume = handle(async (req, res) => {
  const { value, errors } = roundQuery(req.query)
  if (errors.length) return bad(res, errors)
  res.json({ success: true, ...(await actions.dropResume(emailOf(req), value)) })
})

// GET /api/learn/welcome?lang=[&calm=1] — a welcome-back message built only from stored history.
const getWelcome = handle(async (req, res) => {
  const errors = []
  langQuery(req.query, errors)
  if (errors.length) return bad(res, errors)
  const calm = TRUE.includes(String(req.query.calm || '').toLowerCase())
  res.json({ success: true, ...(await actions.welcome(emailOf(req), { name: req.user?.name, calm })) })
})

// GET /api/learn/next?lang= — "What next?", ranked, at most 6.
const getNext = handle(async (req, res) => {
  const errors = []
  langQuery(req.query, errors)
  if (errors.length) return bad(res, errors)
  res.json({ success: true, ...(await actions.next(emailOf(req), { tz: tzOf(req) })) })
})

// GET /api/learn/discovery?lang= — today's quick discovery (one everyday question).
const getDiscovery = handle(async (req, res) => {
  const errors = []
  const lang = langQuery(req.query, errors)
  if (errors.length) return bad(res, errors)
  res.json({ success: true, ...(await actions.discovery(emailOf(req), { lang, tz: tzOf(req) })) })
})

// GET /api/learn/journey — stages per subject for the journey map.
const getJourney = handle(async (req, res) => {
  const subjects = await actions.journey(emailOf(req))
  res.json({ success: true, subjects, ...subjects })
})

// GET /api/learn/decisions?limit= — the learner's recent engine decisions, in plain words.
const getDecisions = handle(async (req, res) => {
  let limit = 20
  if (req.query.limit !== undefined) {
    limit = Number(req.query.limit)
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) return bad(res, ['limit must be a whole number from 1 to 100'])
  }
  res.json({ success: true, decisions: await actions.decisions(emailOf(req), { limit }) })
})

// GET /api/learn/baseline?subject=maths&module=read&lang=
const getBaseline = handle(async (req, res) => {
  const { value, errors } = roundQuery(req.query)
  if (errors.length) return bad(res, errors)
  res.json({ success: true, ...(await actions.baselineItems(emailOf(req), value)) })
})

// POST /api/learn/baseline { subject, results: [{ questionId, level?, status }] } -> { level }
const postBaseline = handle(async (req, res) => {
  const b = req.body || {}
  const errors = []
  if (!cfg.SUBJECTS.includes(b.subject)) errors.push(`subject must be one of ${cfg.SUBJECTS.join(', ')}`)
  if (!Array.isArray(b.results) || !b.results.length || b.results.length > 20) errors.push('results must be a list of 1 to 20 answers')
  else {
    b.results.forEach((r, i) => {
      if (!r || typeof r !== 'object') return errors.push(`results[${i}] must be an object`)
      if (typeof r.questionId !== 'string' || !r.questionId || r.questionId.length > 80) errors.push(`results[${i}].questionId is required`)
      if (!STATUSES.includes(r.status)) errors.push(`results[${i}].status must be one of ${STATUSES.join(', ')}`)
      if (r.level !== undefined && !validate.isLevel(r.level)) errors.push(`results[${i}].level must be a whole number from ${cfg.MIN_LEVEL} to ${cfg.MAX_LEVEL}`)
      return null
    })
  }
  if (errors.length) return bad(res, errors)
  const out = await actions.placeBaseline(emailOf(req), b.subject, b.results.map((r) => ({ questionId: r.questionId, status: r.status })))
  res.json({ success: true, ...out })
})

// GET /api/learn/companion — what the AI Teacher may know (no free text the learner wrote).
const getCompanion = handle(async (req, res) => {
  res.json({ success: true, ...(await actions.companion(emailOf(req), req.user?.name)) })
})

module.exports = {
  getProfile, putProfile, deleteProfile, answerSuggestion, getRound, getBaseline, postBaseline, getCompanion, handle, roundQuery,
  deleteResume, getWelcome, getNext, getDiscovery, getJourney, getDecisions,
}
