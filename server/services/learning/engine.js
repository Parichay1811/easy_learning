// The learning engine's write path: one answer in, updated skill + level +
// feedback message out. `applyAttempt` is the pure core (rules from ./mastery,
// ./levelPolicy, ./support, ./spacing); `processAnswer` adds storage and the
// feedback message.
const crypto = require('crypto')
const cfg = require('../../config/learning')
const store = require('./store')
const { loadCatalog } = require('./catalog')
const { metaOf, isServable } = require('./questionMeta')
const { answerStatus, classifyAttempt, creditOf, updateSkill, skillState, isMastered } = require('./mastery')
const { recordLevelAttempt, evaluateLevel, freshLevel, normalise } = require('./levelPolicy')
const { chooseMessage, suggestionText } = require('./feedback')
const { applyProbe } = require('./probe')
const { recordBand, restartBand } = require('./band')
const { decisionsFromAttempt } = require('./decisions')
const { trackAnswer } = require('./roundState')
const { newlyEarned, badgeView, GROWTH_IDS } = require('./achievements')

const MINUTE = 60000
const newId = () => crypto.randomBytes(6).toString('hex')

function localDate(now, tz) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  } catch {
    return now.toISOString().slice(0, 10)
  }
}

// Monday of the week of a YYYY-MM-DD date.
function weekOf(date) {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

// Adds a suggestion unless the same kind is already waiting. Mutates profile.
function suggest(profile, s, now) {
  const same = (x) => x.type === s.type && (x.subject ?? null) === (s.subject ?? null) && (x.skill ?? null) === (s.skill ?? null)
  if ((profile.suggestions || []).some(same)) return null
  const entry = { id: newId(), subject: null, skill: null, level: null, to: null, ...s, text: suggestionText(s.key, s.params), createdAt: now }
  profile.suggestions = [...(profile.suggestions || []), entry].slice(-10)
  return entry
}

const holdOn = (profile, subject) => (profile.overrides || []).some((o) => o.type === 'hold_level' && (!o.subject || o.subject === subject))

const RIGHT = new Set(['independent', 'assisted'])

// The weekly journal per subject (counts only), for the guardian/teacher evidence:
//   { w: week, s: subject, top: highest stage right first try without a hint, ind, ast: right alone / with help,
//     rv, rvc: reviews that were due / remembered, disc: discoveries }
function bumpJournal(journal, { week, subject, outcome, stage, review, discovery }) {
  const out = (journal || []).map((j) => ({ ...j }))
  let row = out.find((j) => j.w === week && j.s === subject)
  if (!row) { row = { w: week, s: subject, top: null, ind: 0, ast: 0, rv: 0, rvc: 0, disc: 0 }; out.push(row) }
  if (outcome === 'independent') {
    row.ind += 1
    if (Number.isInteger(stage)) row.top = Math.max(row.top ?? -1, stage)
  }
  if (outcome === 'assisted') row.ast += 1
  if (review) { row.rv += 1; if (RIGHT.has(outcome)) row.rvc += 1 }
  if (discovery) row.disc += 1
  const weeks = [...new Set(out.map((j) => j.w))].sort().slice(-cfg.limits.journalWeeks)
  return out.filter((j) => weeks.includes(j.w)).sort((x, y) => (x.w < y.w ? -1 : x.w > y.w ? 1 : x.s.localeCompare(y.s)))
}

const growthOf = (profile) => ({ discoveries: 0, discoveryDays: [], firstDiscoveryDate: null, solved: 0, reviews: 0, reviewsRight: 0, chosen: 0, badges: [], log: [], ...(profile.growth || {}) })

// A discovery answered (any status but uncertain): counts for the curiosity badges and today's discovery.
// The first answer to a discovery that day is an activity chosen by the learner (unless its round counted it).
function noteDiscovery(profileIn, { q, date, subject, week, inRound = false }) {
  const profile = { ...profileIn }
  const g = growthOf(profile)
  if (!inRound && !(g.log || []).some((x) => x.q === q && x.d === date)) g.chosen = (g.chosen || 0) + 1
  g.discoveries += 1
  if (!g.firstDiscoveryDate) g.firstDiscoveryDate = date
  if (!g.discoveryDays.includes(date)) g.discoveryDays = [...g.discoveryDays, date].slice(-60)
  g.log = [...(g.log || []).filter((x) => !(x.q === q && x.d === date)), { q, d: date }].slice(-cfg.limits.discoveryLog)
  profile.growth = g
  if (subject && week) profile.journal = bumpJournal(profile.journal, { week, subject, outcome: null, stage: null, review: false, discovery: true })
  return profile
}

// Baseline per subject = the placement result, else the first `evidence.baselineAttempts` graded
// answers (stored once). profile.baselineAcc[subject] collects them while the baseline is missing.
function bumpBaseline(profile, { subject, outcome, itemLevel, now }) {
  if (profile.baseline?.[subject] || !profile.baselineAcc?.[subject]) return profile
  const acc = { n: 0, right: 0, levels: {}, ...profile.baselineAcc[subject] }
  acc.n += 1
  if (RIGHT.has(outcome)) acc.right += 1
  if (Number.isInteger(itemLevel)) acc.levels = { ...acc.levels, [itemLevel]: (acc.levels[itemLevel] || 0) + 1 }
  const out = { ...profile, baselineAcc: { ...profile.baselineAcc, [subject]: acc } }
  if (acc.n >= cfg.evidence.baselineAttempts) {
    out.baseline = { ...(profile.baseline || {}), [subject]: { level: commonLevel(acc.levels), accuracy: Math.round((acc.right / acc.n) * 100) / 100, n: acc.n, at: now, source: 'first_attempts' } }
    const rest = { ...out.baselineAcc }
    delete rest[subject]
    out.baselineAcc = rest
  }
  return out
}

// The most frequent level in { level: count } (ties: the lower level), or null.
function commonLevel(levels = {}) {
  const e = Object.entries(levels).map(([l, n]) => [Number(l), n]).filter(([l]) => Number.isInteger(l))
  if (!e.length) return null
  e.sort((a, b) => b[1] - a[1] || a[0] - b[0])
  return e[0][0]
}

/**
 * Pure core: one COUNTABLE graded attempt.
 *   profile: the learner profile (plain object; a copy is returned)
 *   prevSkill: the skill row or null
 *   a: { outcome, subject, module, questionId, skill, skillName, itemLevel, catalogLevel, misconception, strategyUsed, date, now, ceiling,
 *        stage (the item's 0..5 or null), choices (2/3 for few-choice items), stageAvail (highest stage this skill has items at) }
 * -> { profile, skill, events, levelChange, decisions, probe, band }
 */
function applyAttempt(profileIn, prevSkill, a) {
  const profile = { ...profileIn, levels: { ...profileIn.levels }, suggestions: [...(profileIn.suggestions || [])] }
  const { now, subject } = a
  const base = prevSkill || { skill: a.skill, subject, name: a.skillName, level: a.catalogLevel ?? null }
  const res = updateSkill(base, {
    outcome: a.outcome, itemLevel: a.itemLevel, module: a.module, questionId: a.questionId, misconception: a.misconception, strategyUsed: a.strategyUsed,
    stage: a.stage ?? null, choices: a.choices ?? null, stageAvail: a.stageAvail ?? null,
  }, now)
  const events = res.events
  // The diagnostic probe on the first contact with a skill.
  const pr = applyProbe(prevSkill, res.skill, { outcome: a.outcome, stage: a.stage ?? null }, now)
  const skill = { ...pr.skill, skill: a.skill, subject, name: a.skillName }
  events.newlyMastered = isMastered(skill) && !events.before.mastered
  if (events.newlyMastered && !skill.masteredAt) skill.masteredAt = now
  events.probe = pr.result
  if (events.strategyCredited) {
    profile.explanationPrefs = { ...(profile.explanationPrefs || {}), [events.strategyCredited]: (profile.explanationPrefs?.[events.strategyCredited] || 0) + 1 }
  }

  // Level policy for the subject. An automatic change only ever goes UP, and only on a right answer.
  const credit = creditOf(a.outcome)
  let ls = recordLevelAttempt(profile.levels[subject], { outcome: a.outcome, credit, itemLevel: a.itemLevel, date: a.date })
  const ev = evaluateLevel(ls, { ceiling: a.ceiling ?? null, hold: holdOn(profile, subject), now })
  const levelEval = { accuracy: ev.accuracy, n: ls.window.length, days: ev.days }
  const ok = RIGHT.has(a.outcome)
  let levelChange = null
  let suggestion = null
  if (ev.action === 'advance' && ok) {
    levelChange = { subject, from: ls.level, to: ls.level + 1 }
    ls = freshLevel(ls.level + 1, 'engine', { now })
    profile.suggestions = profile.suggestions.filter((x) => !(x.subject === subject && (x.type === 'level_up' || x.type === 'level_down')))
  }
  profile.levels[subject] = ls
  if (!levelChange && ev.action === 'suggest_up') {
    suggestion = suggest(profile, { type: 'level_up', subject, level: ls.level, to: ls.level + 1, key: 'levelUp', params: { level: ls.level, next: ls.level + 1 } }, now)
  }
  if (!levelChange && ev.action === 'suggest_down') {
    suggestion = suggest(profile, { type: 'level_down', subject, level: ls.level, to: ls.level - 1, key: 'levelDown', params: { level: ls.level, to: ls.level - 1 } }, now)
  }
  if (events.reparked) suggest(profile, { type: 'review', subject, skill: a.skill, key: 'review', params: { skill: { id: a.skill, name: a.skillName } } }, now)

  // This sitting: several misses close together -> suggest a short break.
  const sitting = (profile.sitting || []).filter((x) => now - new Date(x.at) <= cfg.sessionGapMinutes * MINUTE)
  sitting.push({ ok: a.outcome !== 'incorrect', at: now })
  const lastFew = sitting.slice(-cfg.breakWindow)
  if (lastFew.filter((x) => !x.ok).length >= cfg.breakMisses) {
    suggest(profile, { type: 'break', key: 'takeBreak', params: {} }, now)
    profile.sitting = []
  } else profile.sitting = lastFew

  // Weekly totals for the guardian/teacher chart (counts only).
  const week = weekOf(a.date)
  const hist = (profile.history || []).map((h) => ({ ...h }))
  const row = hist.find((h) => h.week === week)
  if (row) { row.attempts += 1; row.credit = Math.round((row.credit + credit) * 1000) / 1000 } else hist.push({ week, attempts: 1, credit })
  profile.history = hist.sort((x, y) => (x.week < y.week ? -1 : 1)).slice(-cfg.limits.history)

  // The target success band of the subject (tilts the next round). A new level starts it afresh:
  // answers at the old level say little about the new one.
  const bs = recordBand(profile.band?.[subject], ok)
  profile.band = { ...(profile.band || {}), [subject]: levelChange ? restartBand(bs.state) : bs.state }
  const band = !levelChange && bs.changed ? { ...bs.changed, recent: bs.band.recent, n: bs.band.n, low: bs.band.low, high: bs.band.high } : null

  // Evidence for grown-ups: weekly journal, growth counters, baseline.
  profile.journal = bumpJournal(profile.journal, { week, subject, outcome: a.outcome, stage: a.stage ?? null, review: events.wasReviewDue, discovery: false })
  const g = growthOf(profile)
  if (a.outcome === 'independent' && Number.isInteger(a.stage) && a.stage >= cfg.achievements.problemSolverStage) g.solved += 1
  if (events.wasReviewDue) { g.reviews += 1; if (ok) g.reviewsRight += 1 }
  profile.growth = g
  Object.assign(profile, bumpBaseline(profile, { subject, outcome: a.outcome, itemLevel: a.itemLevel, now }))
  events.comeback = ok && (events.before.missesSinceSuccess || 0) >= cfg.achievements.comebackMisses
    ? { skill: a.skill, skillName: a.skillName, misses: events.before.missesSinceSuccess } : null

  const decisions = decisionsFromAttempt({
    now, subject, skillId: a.skill, before: prevSkill, skill, events, probe: events.probe, band, levelChange, levelEval, suggestion,
    misconceptionRepeat: events.misconceptionRepeat, newlyMastered: events.newlyMastered,
  })
  return { profile, skill, events, levelChange, decisions, probe: events.probe, band }
}

// The skill that builds on this one and is not mastered yet (from the catalogue).
async function nextSkillAfter(email, catalog, skillId) {
  const ids = catalog.nextSkills(skillId)
  if (!ids.length) return null
  const rows = await store.SkillMastery.find({ email, skill: { $in: ids } }).select('skill mastery box').lean()
  const done = new Set(rows.filter(isMastered).map((r) => r.skill))
  const id = ids.find((i) => !done.has(i))
  return id ? { id, name: catalog.name(id) } : null
}

// Growth badges earned by this answer: [{ id, params }] (stored with their evidence, shown in the reply).
async function growthEarned(e, profile, { events, prevSkill, discovered }) {
  if (!events && !discovered) return []
  const g = growthOf(profile)
  const earned = new Set(g.badges || [])
  if (GROWTH_IDS.every((id) => earned.has(id))) return []
  const stats = {
    discoveries: g.discoveries, discoveryDays: (g.discoveryDays || []).length, firstDiscoveryDate: g.firstDiscoveryDate,
    solved: g.solved, reviewsRight: g.reviewsRight, comeback: events?.comeback || null,
  }
  // Counting skill rows only when they can have changed (a new skill, or one newly mastered).
  if ((events && !(prevSkill?.attempts > 0) && !earned.has('growth_concept_explorer')) || (events?.newlyMastered && !earned.has('growth_three_mastered'))) {
    const rows = await store.SkillMastery.find({ email: e, attempts: { $gt: 0 } }).select('skill mastery box rightItems topStage stageAvail legacyEvidence attempts').lean()
    stats.skillsTried = rows.length
    stats.mastered = rows.filter(isMastered).length
  }
  return newlyEarned(stats, earned)
}

/**
 * Logs one answer into the engine. Returns null when the answer cannot be tied
 * to a bank question the learner can see (teacher test items, unknown ids).
 *   body: the /api/dashboard/log-answer body (old or new shape; new: roundId, position, lang, mode "discovery" | "challenge")
 *   ctx:  { tz, now }
 */
async function processAnswer(email, body, { tz = 'UTC', now = new Date() } = {}) {
  const e = String(email || '').toLowerCase()
  const module = String(body.module || '').toLowerCase()
  const subject = String(body.subject || '').toLowerCase()
  const questionId = typeof body.questionId === 'number' && Number.isInteger(body.questionId) ? String(body.questionId) : body.questionId
  if (!e || !cfg.MODULES.includes(module) || !cfg.SUBJECTS.includes(subject) || typeof questionId !== 'string') return null
  const found = await store.findQuestion(e, module, subject, questionId)
  if (!found) return null
  const q = { ...found, id: String(found.id) } // older school uploads have numeric ids
  const meta = metaOf(q, subject)
  const status = answerStatus(body, q)
  const hintsUsed = Math.max(0, Math.min(10, Number(body.hintsUsed) || 0))
  const firstTry = typeof body.firstTry === 'boolean' ? body.firstTry : null
  const mode = typeof body.mode === 'string' ? body.mode.slice(0, 20) : 'practice'
  const graded = meta.graded && isServable(q)
  const cls = classifyAttempt({ status, firstTry, hintsUsed, graded, mode, timedOut: body.timedOut === true })
  const reason = typeof body.reason === 'string' ? body.reason.slice(0, 30) : null
  const lang = typeof body.lang === 'string' && /^[a-z]{2}(-[a-z]{2})?$/.test(body.lang) ? body.lang : 'en'
  const catalog = loadCatalog()
  const ceiling = cls.countable ? (await store.ceilings(e))[subject] : null
  const stageAvail = cls.countable ? ((await store.skillIndex(e)).skills.get(meta.skill)?.maxStage ?? null) : null
  const date = localDate(now, tz)

  return store.serial(e, async () => {
    let profile = await store.getProfile(e)
    const prevSkill = await store.getSkill(e, meta.skill)
    const skillName = catalog.name(meta.skill, prevSkill?.name || meta.skillName)

    profile.recent = [...(profile.recent || []).filter((r) => r.q !== q.id), { q: q.id, at: now }].slice(-cfg.round.recentKeep)
    profile.last = { subject, module }
    profile.lastActiveAt = now

    let events = null
    let skill = prevSkill
    let levelChange = null
    let decisions = []
    if (cls.countable) {
      // Baseline for grown-ups: start collecting the first answers, or (a learner with earlier
      // answers, from before baselines were kept) take it from their answer history, once.
      if (!profile.baseline?.[subject] && !profile.baselineAcc?.[subject]) {
        const prior = await store.SkillMastery.exists({ email: e, subject, attempts: { $gt: 0 } })
        if (prior) profile.baseline = { ...(profile.baseline || {}), [subject]: (await store.historyBaseline(e, subject)) || { level: null, accuracy: null, n: 0, at: now, source: 'first_attempts' } }
        else profile.baselineAcc = { ...(profile.baselineAcc || {}), [subject]: { n: 0, right: 0, levels: {} } }
      }
      // Only a distractor insight FROM THIS QUESTION is kept (never text the learner wrote).
      const insights = q.distractor_insight && typeof q.distractor_insight === 'object' ? Object.values(q.distractor_insight).filter((v) => typeof v === 'string') : []
      const misconception = typeof body.misconception === 'string' && insights.includes(body.misconception.trim()) ? body.misconception.trim() : null
      // The support the client actually showed (old clients send none: no strategy is credited).
      const stepSent = Number.isInteger(body.supportStep) && body.supportStep >= 0 && body.supportStep < cfg.strategies.length ? body.supportStep : null
      const out = applyAttempt(profile, prevSkill, {
        outcome: cls.outcome, subject, module, questionId: q.id, skill: meta.skill, skillName, itemLevel: meta.level,
        catalogLevel: catalog.get(meta.skill)?.level ?? null, misconception,
        strategyUsed: stepSent == null ? null : cfg.strategies[stepSent], date, now, ceiling,
        stage: meta.stage, choices: meta.choices, stageAvail,
      })
      ;({ profile, skill, events, levelChange, decisions } = out)
    }

    // The round this answer belongs to (resume after logout); a round the learner chose counts once.
    const position = Number.isInteger(body.position) ? body.position : null
    const tracked = trackAnswer(profile.rounds, { roundId: body.roundId, position, subject, module, q: q.id, now })
    profile.rounds = tracked.rounds
    if (tracked.info?.started && tracked.info.chosen) profile.growth = { ...growthOf(profile), chosen: (growthOf(profile).chosen || 0) + 1 }

    // A discovery question answered (curiosity counts, right or not).
    const discovered = mode === 'discovery' && status !== 'uncertain'
    if (discovered) profile = noteDiscovery(profile, { q: q.id, date, subject, week: weekOf(date), inRound: !!tracked.info })

    // A misconception that came up again: the next item of this skill brings an explanation.
    let explain = null
    if (events?.misconceptionRepeat) {
      const rep = events.misconceptionRepeat
      const src = { subject, module: rep.module || module, q: rep.q || q.id }
      explain = await store.explainFor(src, { skill: meta.skill, skillName, misconception: rep.text, lang })
      skill = { ...skill, explain: { text: rep.text.slice(0, cfg.limits.misconceptionText), q: src.q, module: src.module, at: now } }
    } else if (events && prevSkill?.explain) {
      // Shown with this item: done.
      skill = { ...skill, explain: null }
    }

    const next = events?.newlyMastered ? await nextSkillAfter(e, catalog, meta.skill) : null
    const message = chooseMessage({
      status, reason, events, skill: { id: meta.skill, name: skillName }, next, levelChange, firstTry, hintsUsed,
      interaction: q.interaction, graded, now, mode,
    }, { lastKey: profile.lastMessageKey, counter: profile.messageCount || 0 })
    profile.lastMessageKey = message.key
    profile.messageCount = (profile.messageCount || 0) + 1

    if (events) await store.saveSkill(e, skill)
    // Growth badges (after the skill row is saved, so counts include it).
    const won = await growthEarned(e, profile, { events, prevSkill, discovered })
    if (won.length) profile.growth = { ...growthOf(profile), badges: [...new Set([...(growthOf(profile).badges || []), ...won.map((w) => w.id)])] }
    await store.saveProfile(e, profile)
    if (decisions.length) await store.addDecisions(e, decisions)
    const achievements = []
    for (const w of won) if (await store.awardAchievement(e, w.id, w.params, now)) achievements.push(badgeView(w.id, w.params))

    const s = skill || { mastery: 0, attempts: 0, supportStep: 0 }
    return {
      skill: meta.skill,
      name: skillName,
      counted: !!events,
      ...(events ? {} : { notCounted: cls.why }),
      mastery: Math.round((s.mastery || 0) * 100) / 100,
      state: skillState(s, now),
      supportStep: s.supportStep | 0,
      strategy: cfg.strategies[s.supportStep | 0],
      message,
      ...(levelChange ? { levelChange } : {}),
      stage: meta.stage,
      ...(events?.probe ? { probe: events.probe.state } : {}),
      achievements,
      ...(explain ? { explain } : {}),
      ...(tracked.info ? { round: { roundId: tracked.info.roundId, position: tracked.info.position, answered: tracked.info.answered, total: tracked.info.total, done: tracked.info.done } } : {}),
    }
  })
}

module.exports = { processAnswer, applyAttempt, localDate, weekOf, suggest, holdOn, normalise, noteDiscovery, bumpJournal, bumpBaseline, commonLevel, growthOf }
