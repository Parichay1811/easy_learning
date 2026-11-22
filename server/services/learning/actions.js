// The learning APIs' operations, shared by the learner, guardian and teacher
// controllers. Each returns data or throws an HttpError-like { status, message, code }.
const crypto = require('crypto')
const cfg = require('../../config/learning')
const store = require('./store')
const { loadCatalog } = require('./catalog')
const { composeRound, supportFor } = require('./round')
const { pickBaselineItems, placeLevel } = require('./baseline')
const { evaluateLevel, freshLevel, normalise } = require('./levelPolicy')
const { profileView, companionView, difficulties, historyView } = require('./views')
const { holdOn, localDate } = require('./engine')
const { firstNameInitial } = require('../../utils/minimise')
const { metaOf, itemStage } = require('./questionMeta')
const { bandState, restartBand } = require('./band')
const { issueRound, activeRound, dropRound, resumePosition } = require('./roundState')
const { levelSet, decisionView } = require('./decisions')
const { welcomeFor, nextFor, journeyFor, pickDiscovery, discoveryMessage } = require('./journey')
const { evidenceView } = require('./evidence')

const DAY = 86400000

// A level set by anyone starts the subject's target band afresh (answers at the old level say little about the new one).
const freshBand = (profile, subject) => { profile.band = { ...(profile.band || {}), [subject]: restartBand(profile.band?.[subject]) } }

class LearnError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code }
}

// The learner's own view, with the same weekly totals the guardian/teacher view shows.
async function view(email, { now = new Date() } = {}) {
  const [profile, skills, ceilings] = await Promise.all([store.getProfile(email), store.getSkills(email), store.ceilings(email)])
  return { ...profileView(profile, skills, { catalog: loadCatalog(), ceilings, now }), history: historyView(profile) }
}

// The guardian / teacher view: the profile plus difficulties, weekly history and the learning evidence.
async function adultView(email, { now = new Date() } = {}) {
  const [profile, skills, ceilings, decisions, activity] = await Promise.all([
    store.getProfile(email), store.getSkills(email), store.ceilings(email), store.getDecisions(email, cfg.evidence.decisions), store.activityCounts(email),
  ])
  const catalog = loadCatalog()
  const v = profileView(profile, skills, { catalog, ceilings, now })
  const refs = skills.flatMap((s) => (s.misconceptions || []).filter((m) => m.q && m.module).map((m) => ({ subject: s.subject, module: m.module, q: m.q })))
  const notes = await store.questionNotes(refs)
  // Learners from before baselines were stored: computed from their answer history (stored on their next answer).
  const historyBaselines = {}
  for (const subject of cfg.SUBJECTS) {
    if (profile.baseline?.[subject]) continue
    if (!skills.some((r) => r.subject === subject && (r.attempts || 0) > 0)) continue
    const b = await store.historyBaseline(email, subject)
    if (b) historyBaselines[subject] = b
  }
  const evidence = evidenceView({ profile, skills, catalog, notes, decisions, historyBaselines, activity, now })
  return { ...v, difficulties: difficulties(skills, catalog, notes), history: historyView(profile), evidence }
}

async function companion(email, name) {
  const [profile, skills] = await Promise.all([store.getProfile(email), store.getSkills(email)])
  return companionView(profile, skills, { catalog: loadCatalog(), name })
}

// Learner's own changes. A level a guardian or teacher locked cannot be changed (409).
async function learnerUpdate(email, value, now = new Date()) {
  return store.serial(email, async () => {
    const profile = await store.getProfile(email)
    const decisions = []
    for (const [s, spec] of Object.entries(value.levels || {})) {
      const ls = normalise(profile.levels[s])
      if (ls.locked) throw new LearnError(409, `Your ${s} level was set by your ${ls.lockedBy === 'teacher' ? 'teacher' : 'grown-up'}, so it can't be changed here.`, 'LEVEL_LOCKED')
      if (spec.level !== ls.level) {
        profile.levels[s] = freshLevel(spec.level, 'self', { now })
        freshBand(profile, s)
        decisions.push(levelSet({ at: now, subject: s, from: ls.level, to: spec.level, reason: 'set_by_learner' }))
      }
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
    await store.addDecisions(email, decisions)
  })
}

// A guardian's or teacher's changes (role: 'guardian' | 'teacher'; name: their short display name).
async function adultUpdate(email, value, role, { name = '', now = new Date() } = {}) {
  return store.serial(email, async () => {
    const profile = await store.getProfile(email)
    const changed = {}
    const decisions = []
    const setBy = { role, name: firstNameInitial(name, '').slice(0, 60) }
    for (const [s, spec] of Object.entries(value.levels || {})) {
      const ls = normalise(profile.levels[s])
      const locked = spec.locked ?? ls.locked
      if (spec.level !== undefined && spec.level !== ls.level) {
        profile.levels[s] = freshLevel(spec.level, role, { locked, lockedBy: role, now, setBy })
        freshBand(profile, s)
        decisions.push(levelSet({ at: now, subject: s, from: ls.level, to: spec.level, reason: role === 'teacher' ? 'set_by_teacher' : 'set_by_guardian' }))
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
    await store.addDecisions(email, decisions)
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
        freshBand(profile, s.subject)
        levelChange = { subject: s.subject, from: ls.level, to }
        await store.addDecisions(email, [levelSet({ at: now, subject: s.subject, from: ls.level, to, reason: 'accepted_suggestion' })])
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

const newRoundId = () => crypto.randomBytes(6).toString('hex')

// Round items as the client gets them: the question (translated), its stage, support and why.
function roundItem({ pick, question }) {
  const stage = Number.isInteger(question.stage) ? question.stage : (Number.isInteger(pick.stage) ? pick.stage : itemStage(question))
  return { ...question, stage, support: { ...pick.support, skill: pick.skill, ...(pick.for ? { for: pick.for } : {}) }, why: pick.why }
}

// A repeated misconception: the first item of that skill brings its explanation (support.strategy "misconception").
async function withExplanations(items, skillMap, subject, lang, catalog) {
  const seen = new Set()
  for (const it of items) {
    const row = skillMap.get(it.support.skill)
    if (!row?.explain?.text || seen.has(row.skill)) continue
    seen.add(row.skill)
    const explain = await store.explainFor({ subject, module: row.explain.module, q: row.explain.q }, {
      skill: row.skill, skillName: catalog.name(row.skill, row.name), misconception: row.explain.text, lang,
    })
    if (explain) it.support = { ...it.support, strategy: 'misconception', explain }
  }
  return items
}

/**
 * GET /api/learn/round. Adds to the response: roundId, target { low, high, recent, n, tilt }, mode;
 * `mode=challenge` (3 items one stage up on a strong skill: + challenge { skill, stage } | null);
 * `mode=discovery` (everyday items); `resume=1`: the unfinished round of this subject+module, same
 * items in the same order, + { resume: true, position, answered } — else { resume: false } + a fresh round.
 */
async function round(email, { subject, module, lang, size, seed, skill, mode = null, resume = false, source = null }, now = new Date()) {
  const e = String(email || '').toLowerCase()
  const [profile, skills, pool] = await Promise.all([store.getProfile(e), store.getSkills(e, subject), store.loadPool(e, subject, module)])
  const ls = normalise(profile.levels[subject])
  const { status } = evaluateLevel(ls, { ceiling: cfg.MAX_LEVEL, hold: holdOn(profile, subject), now })
  const band = bandState(profile.band?.[subject])
  const target = { low: band.low, high: band.high, recent: band.recent, n: band.n, tilt: band.tilt }
  const skillMap = new Map(skills.map((s) => [s.skill, s]))
  const catalog = loadCatalog()

  if (resume) {
    const st = activeRound(profile.rounds, subject, module, now)
    if (st) {
      const picks = st.items.map((x) => ({ _id: x.oid, id: x.q, why: x.why, ...(x.for ? { for: x.for } : {}) }))
      const full = await store.fullQuestions(subject, module, picks, lang)
      const items = full.map(({ pick, question }) => {
        const m = metaOf(question, subject)
        return roundItem({ pick: { ...pick, skill: m.skill, stage: m.stage, support: supportFor(skillMap.get(m.skill), pick.why) }, question })
      })
      await withExplanations(items, skillMap, subject, lang, catalog)
      const ceiling = pool.reduce((mx, q) => (Number.isInteger(q.level) && q.level > (mx ?? -1) ? q.level : mx), null)
      return {
        items, subject, module, level: ls.level, servedLevel: null, status, ceiling, focus: st.skill || null,
        roundId: st.id, target, mode: st.mode || null, resume: true, position: resumePosition(st), answered: [...(st.answered || [])],
      }
    }
  }

  const out = composeRound({
    pool, subject, module, level: ls.level, status, size: size ?? (mode === 'discovery' ? cfg.discovery.roundSize : undefined), seed: seedOf(seed), now,
    skills: skillMap, profile, catalog, focusSkill: skill || null, tilt: band.tilt, mode,
  })
  const full = await store.fullQuestions(subject, module, out.items, lang)
  const items = await withExplanations(full.map(roundItem), skillMap, subject, lang, catalog)
  const roundId = newRoundId()
  // Remember the round so it can be resumed after logout (question ids only).
  if (full.length) await store.serial(e, async () => {
    const p = await store.getProfile(e)
    const rounds = issueRound(p.rounds, { id: roundId, subject, module, mode, source, skill: out.focus || null, now, items: full.map(({ pick }) => ({ q: pick.id, oid: pick._id, why: pick.why, for: pick.for })) })
    await store.saveRounds(e, rounds)
  })
  return {
    items, subject, module, level: ls.level, servedLevel: out.servedLevel, status, ceiling: out.ceiling, focus: out.focus,
    roundId, target, mode: mode || null,
    ...(mode === 'challenge' ? { challenge: out.challenge || null } : {}),
    ...(resume ? { resume: false } : {}),
  }
}

// DELETE /api/learn/round/resume: "Start fresh" (forget the unfinished round of a subject+module).
async function dropResume(email, { subject, module }, now = new Date()) {
  const e = String(email || '').toLowerCase()
  return store.serial(e, async () => {
    const p = await store.getProfile(e)
    const { rounds, dropped } = dropRound(p.rounds, subject, module, now)
    if (dropped) await store.saveRounds(e, rounds)
    return { dropped: dropped > 0 }
  })
}

// ── Journey views (built only from stored history) ─────────────────────────

// The learner's comfort settings ask for calm (the calm/focus presets set reduced motion).
const calmOf = (profile, asked) => !!asked || profile.supports?.motion === 'reduced'

async function welcome(email, { name = '', calm = false } = {}, now = new Date()) {
  const [profile, skills, index] = await Promise.all([store.getProfile(email), store.getSkills(email), store.skillIndex(email)])
  return welcomeFor({ name, profile, skills, catalog: loadCatalog(), index, now, calm: calmOf(profile, calm) })
}

// Today's discovery pick (without loading the question): { pick, date, answered }.
async function discoveryPick(email, { tz = 'UTC' } = {}, now = new Date()) {
  const e = String(email || '').toLowerCase()
  const index = await store.skillIndex(e)
  const date = localDate(now, tz)
  if (!index.everyday.length) return { pick: null, date, answered: false }
  const ids = index.everyday.map((q) => q.id)
  const since = new Date(now.getTime() - (cfg.discovery.avoidDays + 1) * 86400000)
  const rows = await store.answeredSince(e, ids, since)
  const first = new Date(`${date}T12:00:00Z`)
  first.setUTCDate(first.getUTCDate() - cfg.discovery.avoidDays)
  const firstDay = first.toISOString().slice(0, 10)
  const avoid = new Set()
  const today = new Set()
  for (const r of rows) {
    const d = localDate(new Date(r.timestamp), tz)
    if (d === date) today.add(r.questionId)
    else if (d >= firstDay && d < date) avoid.add(r.questionId)
  }
  const pick = pickDiscovery(index.everyday, { email: e, date, avoid })
  return { pick, date, answered: !!pick && today.has(pick.id) }
}

// GET /api/learn/discovery -> { item, date, answered, subject, module, mode: 'discovery', message }
async function discovery(email, { lang, tz } = {}, now = new Date()) {
  const { pick, date, answered } = await discoveryPick(email, { tz }, now)
  const none = { item: null, date, answered: false, message: discoveryMessage('none') }
  if (!pick) return none
  const [full] = await store.fullQuestions(pick.subject, pick.module, [{ ...pick, why: 'discovery', support: { step: 0, strategy: 'words' } }], pick.subject === 'english' ? undefined : lang)
  if (!full) return none
  return { item: roundItem(full), date, answered, subject: pick.subject, module: pick.module, mode: 'discovery', message: discoveryMessage(answered ? 'done' : 'intro') }
}

async function next(email, { tz = 'UTC' } = {}, now = new Date()) {
  const [profile, skills, index, d] = await Promise.all([store.getProfile(email), store.getSkills(email), store.skillIndex(email), discoveryPick(email, { tz }, now)])
  return nextFor({ profile, skills, catalog: loadCatalog(), index, now, discovery: { available: !!d.pick, answered: d.answered, subject: d.pick?.subject, module: d.pick?.module } })
}

async function journey(email) {
  const [profile, skills, index, ceilings] = await Promise.all([store.getProfile(email), store.getSkills(email), store.skillIndex(email), store.ceilings(email)])
  return journeyFor({ profile, skills, index, ceilings })
}

async function decisions(email, { limit = 20 } = {}) {
  const catalog = loadCatalog()
  const [list, skills] = await Promise.all([store.getDecisions(email, limit), store.getSkills(email)])
  const names = new Map(skills.map((r) => [r.skill, r.name]))
  return list.map((d) => decisionView(d, catalog, names))
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
    freshBand(profile, subject)
    profile.baselineDone = { ...profile.baselineDone, [subject]: true }
    const right = scored.filter((r) => r.status === 'correct').length
    // The evidence baseline is stored once (the placement, unless first answers already made one).
    if (!profile.baseline?.[subject]) {
      profile.baseline = { ...(profile.baseline || {}), [subject]: { level, accuracy: Math.round((right / scored.length) * 100) / 100, n: scored.length, at: now, source: 'placement' } }
      if (profile.baselineAcc?.[subject]) { const rest = { ...profile.baselineAcc }; delete rest[subject]; profile.baselineAcc = rest }
    }
    await store.saveProfile(email, profile)
    await store.addDecisions(email, [levelSet({ at: now, subject, from: ls.level, to: level, reason: 'placement', evidence: { right, n: scored.length } })])
    return { level, subject, counted: scored.length }
  })
}

module.exports = {
  LearnError, view, adultView, companion, learnerUpdate, adultUpdate, answerSuggestion, round, baselineItems, placeBaseline,
  dropResume, welcome, next, journey, discovery, decisions,
}
