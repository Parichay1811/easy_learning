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

/**
 * Pure core: one COUNTABLE graded attempt.
 *   profile: the learner profile (plain object; a copy is returned)
 *   prevSkill: the skill row or null
 *   a: { outcome, subject, module, questionId, skill, skillName, itemLevel, catalogLevel, misconception, strategyUsed, date, now, ceiling }
 * -> { profile, skill, events, levelChange }
 */
function applyAttempt(profileIn, prevSkill, a) {
  const profile = { ...profileIn, levels: { ...profileIn.levels }, suggestions: [...(profileIn.suggestions || [])] }
  const { now, subject } = a
  const base = prevSkill || { skill: a.skill, subject, name: a.skillName, level: a.catalogLevel ?? null }
  const res = updateSkill(base, { outcome: a.outcome, itemLevel: a.itemLevel, module: a.module, questionId: a.questionId, misconception: a.misconception, strategyUsed: a.strategyUsed }, now)
  const skill = { ...res.skill, skill: a.skill, subject, name: a.skillName }
  const events = res.events
  if (events.strategyCredited) {
    profile.explanationPrefs = { ...(profile.explanationPrefs || {}), [events.strategyCredited]: (profile.explanationPrefs?.[events.strategyCredited] || 0) + 1 }
  }

  // Level policy for the subject. An automatic change only ever goes UP, and only on a right answer.
  const credit = creditOf(a.outcome)
  let ls = recordLevelAttempt(profile.levels[subject], { outcome: a.outcome, credit, itemLevel: a.itemLevel, date: a.date })
  const ev = evaluateLevel(ls, { ceiling: a.ceiling ?? null, hold: holdOn(profile, subject), now })
  const ok = a.outcome === 'independent' || a.outcome === 'assisted'
  let levelChange = null
  if (ev.action === 'advance' && ok) {
    levelChange = { subject, from: ls.level, to: ls.level + 1 }
    ls = freshLevel(ls.level + 1, 'engine', { now })
    profile.suggestions = profile.suggestions.filter((x) => !(x.subject === subject && (x.type === 'level_up' || x.type === 'level_down')))
  }
  profile.levels[subject] = ls
  if (!levelChange && ev.action === 'suggest_up') {
    suggest(profile, { type: 'level_up', subject, level: ls.level, to: ls.level + 1, key: 'levelUp', params: { level: ls.level, next: ls.level + 1 } }, now)
  }
  if (!levelChange && ev.action === 'suggest_down') {
    suggest(profile, { type: 'level_down', subject, level: ls.level, to: ls.level - 1, key: 'levelDown', params: { level: ls.level, to: ls.level - 1 } }, now)
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

  return { profile, skill, events, levelChange }
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

/**
 * Logs one answer into the engine. Returns null when the answer cannot be tied
 * to a bank question the learner can see (teacher test items, unknown ids).
 *   body: the /api/dashboard/log-answer body (old or new shape)
 *   ctx:  { tz, now }
 */
async function processAnswer(email, body, { tz = 'UTC', now = new Date() } = {}) {
  const e = String(email || '').toLowerCase()
  const module = String(body.module || '').toLowerCase()
  const subject = String(body.subject || '').toLowerCase()
  if (!e || !cfg.MODULES.includes(module) || !cfg.SUBJECTS.includes(subject) || typeof body.questionId !== 'string') return null
  const q = await store.findQuestion(e, module, subject, body.questionId)
  if (!q) return null
  const meta = metaOf(q, subject)
  const status = answerStatus(body, q)
  const hintsUsed = Math.max(0, Math.min(10, Number(body.hintsUsed) || 0))
  const firstTry = typeof body.firstTry === 'boolean' ? body.firstTry : null
  const mode = typeof body.mode === 'string' ? body.mode : 'practice'
  const graded = meta.graded && isServable(q)
  const cls = classifyAttempt({ status, firstTry, hintsUsed, graded, mode, timedOut: body.timedOut === true })
  const reason = typeof body.reason === 'string' ? body.reason.slice(0, 30) : null
  const catalog = loadCatalog()
  const ceiling = cls.countable ? (await store.ceilings(e))[subject] : null

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
    if (cls.countable) {
      // Only a distractor insight FROM THIS QUESTION is kept (never text the learner wrote).
      const insights = q.distractor_insight && typeof q.distractor_insight === 'object' ? Object.values(q.distractor_insight).filter((v) => typeof v === 'string') : []
      const misconception = typeof body.misconception === 'string' && insights.includes(body.misconception.trim()) ? body.misconception.trim() : null
      // The support the client actually showed (old clients send none: no strategy is credited).
      const stepSent = Number.isInteger(body.supportStep) && body.supportStep >= 0 && body.supportStep < cfg.strategies.length ? body.supportStep : null
      const out = applyAttempt(profile, prevSkill, {
        outcome: cls.outcome, subject, module, questionId: q.id, skill: meta.skill, skillName, itemLevel: meta.level,
        catalogLevel: catalog.get(meta.skill)?.level ?? null, misconception,
        strategyUsed: stepSent == null ? null : cfg.strategies[stepSent], date: localDate(now, tz), now, ceiling,
      })
      ;({ profile, skill, events, levelChange } = out)
    }

    const next = events?.newlyMastered ? await nextSkillAfter(e, catalog, meta.skill) : null
    const message = chooseMessage({
      status, reason, events, skill: { id: meta.skill, name: skillName }, next, levelChange, firstTry, hintsUsed,
      interaction: q.interaction, graded, now,
    }, { lastKey: profile.lastMessageKey, counter: profile.messageCount || 0 })
    profile.lastMessageKey = message.key
    profile.messageCount = (profile.messageCount || 0) + 1

    if (events) await store.saveSkill(e, skill)
    await store.saveProfile(e, profile)

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
    }
  })
}

module.exports = { processAnswer, applyAttempt, localDate, weekOf, suggest, holdOn, normalise }
