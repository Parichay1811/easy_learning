// The learning APIs' operations, shared by the learner, guardian and teacher
// controllers. Each returns data or throws an HttpError-like { status, message, code }.
const crypto = require('crypto')
const cfg = require('../../config/learning')
const store = require('./store')
const { loadCatalog } = require('./catalog')
const { composeRound } = require('./round')
const { pickBaselineItems, placeLevel } = require('./baseline')
const { evaluateLevel, freshLevel, normalise } = require('./levelPolicy')
const { profileView, companionView, difficulties, historyView } = require('./views')
const { holdOn } = require('./engine')
const { firstNameInitial } = require('../../utils/minimise')

const DAY = 86400000

class LearnError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code }
}

// The learner's own view, with the same weekly totals the guardian/teacher view shows.
async function view(email, { now = new Date() } = {}) {
  const [profile, skills, ceilings] = await Promise.all([store.getProfile(email), store.getSkills(email), store.ceilings(email)])
  return { ...profileView(profile, skills, { catalog: loadCatalog(), ceilings, now }), history: historyView(profile) }
}

// The guardian / teacher view: the profile plus difficulties and weekly history.
async function adultView(email, { now = new Date() } = {}) {
  const [profile, skills, ceilings] = await Promise.all([store.getProfile(email), store.getSkills(email), store.ceilings(email)])
  const catalog = loadCatalog()
  const v = profileView(profile, skills, { catalog, ceilings, now })
  const refs = skills.flatMap((s) => (s.misconceptions || []).filter((m) => m.q && m.module).map((m) => ({ subject: s.subject, module: m.module, q: m.q })))
  const notes = await store.questionNotes(refs)
  return { ...v, difficulties: difficulties(skills, catalog, notes), history: historyView(profile) }
}

async function companion(email, name) {
  const [profile, skills] = await Promise.all([store.getProfile(email), store.getSkills(email)])
  return companionView(profile, skills, { catalog: loadCatalog(), name })
}

// Learner's own changes. A level a guardian or teacher locked cannot be changed (409).
async function learnerUpdate(email, value, now = new Date()) {
  return store.serial(email, async () => {
    const profile = await store.getProfile(email)
    for (const [s, spec] of Object.entries(value.levels || {})) {
      const ls = normalise(profile.levels[s])
      if (ls.locked) throw new LearnError(409, `Your ${s} level was set by your ${ls.lockedBy === 'teacher' ? 'teacher' : 'grown-up'}, so it can't be changed here.`, 'LEVEL_LOCKED')
      if (spec.level !== ls.level) profile.levels[s] = freshLevel(spec.level, 'self', { now })
    }
    if (value.ageBand !== undefined) profile.ageBand = value.ageBand
    if (value.pace !== undefined) profile.pace = value.pace
    if (value.supports !== undefined) profile.supports = { ...(profile.supports || {}), ...value.supports }
    if (value.goals !== undefined) {
      // The learner manages their own goals; on goals a grown-up set they can only tick "done".
      const adult = (profile.goals || []).filter((g) => g.by !== 'learner')
      const sent = new Map(value.goals.map((g) => [g.id, g]))
      const keptAdult = adult.map((g) => (sent.has(g.id) ? { ...g, done: sent.get(g.id).done } : g))
      const own = value.goals.filter((g) => !adult.some((a) => a.id === g.id)).map((g) => ({ ...g, by: 'learner', createdAt: now }))
      profile.goals = [...keptAdult, ...own].slice(0, cfg.limits.goals)
    }
    await store.saveProfile(email, profile)
  })
}

// A guardian's or teacher's changes (role: 'guardian' | 'teacher'; name: their short display name).
async function adultUpdate(email, value, role, { name = '', now = new Date() } = {}) {
  return store.serial(email, async () => {
    const profile = await store.getProfile(email)
    const changed = {}
    const setBy = { role, name: firstNameInitial(name, '').slice(0, 60) }
    for (const [s, spec] of Object.entries(value.levels || {})) {
      const ls = normalise(profile.levels[s])
      const locked = spec.locked ?? ls.locked
      if (spec.level !== undefined && spec.level !== ls.level) {
        profile.levels[s] = freshLevel(spec.level, role, { locked, lockedBy: role, now, setBy })
      } else if (locked !== ls.locked) {
        // Locking or unlocking the level as it is: the level keeps its source; who and when are recorded.
        profile.levels[s] = { ...ls, locked, lockedBy: locked ? role : null, setAt: now, setBy }
      }
      changed[s] = { from: ls.level, to: profile.levels[s].level, locked }
      // Suggestions about a level an adult just set are settled.
      profile.suggestions = (profile.suggestions || []).filter((x) => !(x.subject === s && (x.type === 'level_up' || x.type === 'level_down')))
    }
    if (value.ageBand !== undefined) profile.ageBand = value.ageBand
    if (value.pace !== undefined) profile.pace = value.pace
    if (value.supports !== undefined) profile.supports = { ...(profile.supports || {}), ...value.supports }
    if (value.goals !== undefined) {
      const before = new Map((profile.goals || []).map((g) => [g.id, g]))
      profile.goals = value.goals.map((g) => (before.has(g.id) ? { ...g, by: before.get(g.id).by, createdAt: before.get(g.id).createdAt } : { ...g, by: role, createdAt: now }))
    }
    if (value.overrides !== undefined) {
      // Each role manages its own overrides; the other role's stay.
      const others = (profile.overrides || []).filter((o) => o.by !== role)
      profile.overrides = [...others, ...value.overrides.map((o) => ({ ...o, by: role, at: now }))].slice(0, cfg.limits.overrides)
    }
    await store.saveProfile(email, profile)
    return { levels: changed }
  })
}

async function answerSuggestion(email, id, accept, now = new Date()) {
  return store.serial(email, async () => {
    const profile = await store.getProfile(email)
    const s = (profile.suggestions || []).find((x) => x.id === id)
    if (!s) throw new LearnError(404, 'That suggestion is no longer there.', 'NOT_FOUND')
    let levelChange = null
    if (s.type === 'level_up' || s.type === 'level_down') {
      const ls = normalise(profile.levels[s.subject])
      if (accept) {
        if (ls.locked) throw new LearnError(409, 'This level was set by a grown-up or teacher. Ask them to change it.', 'LEVEL_LOCKED')
        const to = Math.max(cfg.MIN_LEVEL, Math.min(cfg.MAX_LEVEL, s.to))
        if (s.type === 'level_up') {
          const ceil = (await store.ceilings(email))[s.subject]
          if (ceil != null && to > ceil) throw new LearnError(409, 'There is nothing at that level yet.', 'NO_CONTENT')
        }
        profile.levels[s.subject] = freshLevel(to, 'self', { now })
        levelChange = { subject: s.subject, from: ls.level, to }
      } else {
        const until = new Date(now.getTime() + cfg.suggestionSnoozeDays * DAY)
        profile.levels[s.subject] = { ...ls, ...(s.type === 'level_up' ? { snoozeUp: until } : { snoozeDown: until }) }
      }
    }
    profile.suggestions = profile.suggestions.filter((x) => x.id !== id)
    await store.saveProfile(email, profile)
    return { accepted: !!accept, ...(levelChange ? { levelChange } : {}) }
  })
}

const seedOf = (q) => (typeof q === 'string' && q.length && q.length <= 64 ? q : crypto.randomBytes(8).toString('hex'))

async function round(email, { subject, module, lang, size, seed, skill }, now = new Date()) {
  const [profile, skills, pool] = await Promise.all([store.getProfile(email), store.getSkills(email, subject), store.loadPool(email, subject, module)])
  const ls = normalise(profile.levels[subject])
  const { status } = evaluateLevel(ls, { ceiling: cfg.MAX_LEVEL, hold: holdOn(profile, subject), now })
  const out = composeRound({
    pool, subject, module, level: ls.level, status, size, seed: seedOf(seed), now,
    skills: new Map(skills.map((s) => [s.skill, s])),
    profile, catalog: loadCatalog(), focusSkill: skill || null,
  })
  const full = await store.fullQuestions(subject, module, out.items, lang)
  return {
    items: full.map(({ pick, question }) => ({
      ...question,
      support: { ...pick.support, skill: pick.skill, ...(pick.for ? { for: pick.for } : {}) },
      why: pick.why,
    })),
    subject, module, level: ls.level, servedLevel: out.servedLevel, status, ceiling: out.ceiling, focus: out.focus,
  }
}

async function baselineItems(email, { subject, module, lang, seed }) {
  const [profile, pool] = await Promise.all([store.getProfile(email), store.loadPool(email, subject, module)])
  const picks = pickBaselineItems(pool, { module, ageBand: profile.ageBand, seed: seedOf(seed) })
  const full = await store.fullQuestions(subject, module, picks, lang)
  return { items: full.map(({ question }) => question), subject, module }
}

// results: [{ questionId, status }] -> placement (levels come from the questions themselves).
async function placeBaseline(email, subject, results, now = new Date()) {
  const ids = [...new Set(results.map((r) => r.questionId))]
  const metas = await store.levelsOf(email, subject, ids)
  const scored = results.filter((r) => metas.has(r.questionId) && metas.get(r.questionId).graded)
    .map((r) => ({ level: metas.get(r.questionId).level, status: r.status }))
  if (!scored.length) throw new LearnError(400, 'None of those answers belong to this subject.', 'NO_RESULTS')
  const level = placeLevel(scored)
  return store.serial(email, async () => {
    const profile = await store.getProfile(email)
    const ls = normalise(profile.levels[subject])
    if (ls.locked) throw new LearnError(409, 'This level was set by a grown-up or teacher, so the check-in can\'t change it.', 'LEVEL_LOCKED')
    profile.levels[subject] = freshLevel(level, 'baseline', { now })
    profile.baselineDone = { ...profile.baselineDone, [subject]: true }
    await store.saveProfile(email, profile)
    return { level, subject, counted: scored.length }
  })
}

module.exports = { LearnError, view, adultView, companion, learnerUpdate, adultUpdate, answerSuggestion, round, baselineItems, placeBaseline }
