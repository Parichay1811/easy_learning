// Mastery per skill from graded attempts. Pure: takes plain objects, returns new ones.
//
// What counts: a GRADED question whose answer status is correct, close or
// incorrect, from an untimed mode. Uncertain speech, ungraded items, timed
// games and response time never count. A correct answer never lowers mastery.
const cfg = require('../../config/learning')
const { schedule, isReviewDue } = require('./spacing')
const { escalate, strategyFor } = require('./support')

const STATUSES = ['correct', 'close', 'incorrect', 'uncertain', 'ungraded']
const CORRECT = new Set(['independent', 'assisted'])
const round3 = (n) => Math.round(n * 1000) / 1000

// Which status an answer has, from the new body or an old client's body.
// Old clients sent only `correct`; they also counted a failed microphone as
// correct, so their speech answers are "uncertain" (never counted).
function answerStatus(body, question) {
  if (STATUSES.includes(body.status)) return body.status
  if (body.uncertain === true) return 'uncertain'
  if (question?.interaction === 'mic_record') return 'uncertain'
  return body.correct ? 'correct' : 'incorrect'
}

// { countable, outcome, why }: outcome is independent | assisted | close | incorrect.
function classifyAttempt({ status, firstTry = null, hintsUsed = 0, graded = true, mode = 'practice', timedOut = false }) {
  if (cfg.ignoreModes.includes(mode)) return { countable: false, outcome: null, why: 'mode' }
  if (timedOut) return { countable: false, outcome: null, why: 'time' }
  if (!graded) return { countable: false, outcome: null, why: 'ungraded' }
  if (status === 'correct') {
    // Old clients gave one try per question and sent no firstTry: that is a first try.
    const independent = firstTry !== false && !(Number(hintsUsed) > 0)
    return { countable: true, outcome: independent ? 'independent' : 'assisted', why: null }
  }
  if (status === 'close') return { countable: true, outcome: 'close', why: null }
  if (status === 'incorrect') return { countable: true, outcome: 'incorrect', why: null }
  return { countable: false, outcome: null, why: status || 'unknown' }
}

const creditOf = (outcome) => cfg.credit[outcome] ?? 0

function nextMastery(m, outcome) {
  const c = creditOf(outcome)
  const r = cfg.masteryRate[outcome] ?? 0.2
  let next = m + r * (c - m)
  if (CORRECT.has(outcome)) next = Math.max(m, next) // a right answer never lowers it
  return round3(Math.min(1, Math.max(0, next)))
}

const isMastered = (s) => (s.mastery || 0) >= cfg.masteredAt && (s.box || 0) >= cfg.masteredMinBox

// new | learning | mastered | review_due
function skillState(s, now) {
  if (!s || !s.attempts) return 'new'
  if (isReviewDue(s, now)) return 'review_due'
  return isMastered(s) ? 'mastered' : 'learning'
}

// source: the question it came from most recently ({ q: content id, module }), so a grown-up's view
// can show that question's own parent note and teacher action.
function addMisconception(list, text, now, source = {}) {
  const t = String(text || '').trim().slice(0, cfg.limits.misconceptionText)
  const out = (list || []).map((m) => ({ ...m }))
  if (!t) return out
  const from = { q: typeof source.q === 'string' ? source.q.slice(0, 80) : null, module: source.module || null }
  const hit = out.find((m) => m.text === t)
  if (hit) Object.assign(hit, { count: hit.count + 1, at: now }, from.q ? from : {})
  else out.push({ text: t, count: 1, at: now, ...from })
  out.sort((a, b) => b.count - a.count || new Date(b.at) - new Date(a.at))
  return out.slice(0, cfg.limits.misconceptions)
}

// One graded attempt on a skill.
//   attempt: { outcome, itemLevel, module, questionId, misconception, strategyUsed }
// Returns { skill, events } where events tell the feedback and level code what happened.
function updateSkill(prev, attempt, now) {
  const s = {
    mastery: 0, attempts: 0, correct: 0, independent: 0, streak: 0, missesSinceSuccess: 0, box: 0, due: null,
    supportStep: 0, missesAtStep: 0, parkedUntil: null, helpedBy: null, lastOutcome: null, lastAt: null,
    lastCorrectAt: null, lastMissAt: null, masteredAt: null, modules: [], misconceptions: [], level: null,
    ...prev,
  }
  const { outcome } = attempt
  const before = { ...s, state: skillState(s, now), mastered: isMastered(s) }
  const ok = CORRECT.has(outcome)
  const next = { ...s }

  next.attempts = s.attempts + 1
  if (ok) next.correct = s.correct + 1
  if (outcome === 'independent') next.independent = s.independent + 1
  next.mastery = nextMastery(s.mastery || 0, outcome)
  next.streak = ok ? s.streak + 1 : 0
  next.missesSinceSuccess = outcome === 'incorrect' ? s.missesSinceSuccess + 1 : ok ? 0 : s.missesSinceSuccess

  const esc = escalate(s, outcome, now)
  next.supportStep = esc.supportStep
  next.missesAtStep = esc.missesAtStep
  next.parkedUntil = esc.parkedUntil
  const sched = schedule({ box: s.box, due: s.due }, outcome, now, { park: esc.parked })
  next.box = sched.box
  next.due = sched.due

  // The approach that came right before a success after a struggle is remembered.
  let strategyCredited = null
  if (ok && s.missesSinceSuccess > 0 && attempt.strategyUsed && attempt.strategyUsed !== 'reassess') {
    strategyCredited = attempt.strategyUsed
    next.helpedBy = strategyCredited
  }

  next.lastOutcome = outcome
  next.lastAt = now
  if (ok) next.lastCorrectAt = now
  if (outcome === 'incorrect') {
    next.lastMissAt = now
    if (attempt.misconception) next.misconceptions = addMisconception(s.misconceptions, attempt.misconception, now, { q: attempt.questionId, module: attempt.module })
  }
  if (attempt.module && !s.modules.includes(attempt.module)) next.modules = [...s.modules, attempt.module]
  if (next.level == null && Number.isInteger(attempt.itemLevel)) next.level = attempt.itemLevel

  const mastered = isMastered(next)
  if (mastered && !before.mastered) next.masteredAt = now
  return {
    skill: next,
    events: {
      outcome,
      before,
      newlyMastered: mastered && !before.mastered,
      stepChanged: esc.changed,
      stepUp: esc.supportStep > (s.supportStep | 0),
      parked: esc.parked,
      reparked: esc.reparked,
      strategy: strategyFor(next.supportStep),
      strategyCredited,
      recovered: ok && s.missesSinceSuccess > 0,
      masteryDelta: round3(next.mastery - (s.mastery || 0)),
    },
  }
}

module.exports = { answerStatus, classifyAttempt, creditOf, nextMastery, updateSkill, skillState, isMastered, addMisconception, STATUSES }
