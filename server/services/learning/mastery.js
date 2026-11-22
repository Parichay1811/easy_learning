// Mastery per skill from graded attempts. Pure: takes plain objects, returns new ones.
//
// What counts: a GRADED question whose answer status is correct, close or
// incorrect, from an untimed mode. Uncertain speech, ungraded items, timed
// games and response time never count. A correct answer never lowers mastery.
const cfg = require('../../config/learning')
const { schedule, isReviewDue } = require('./spacing')
const { escalate, strategyFor } = require('./support')
const { chanceWeight } = require('./questionMeta')

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
// A mini challenge (mode "challenge", one stage up) is a stretch: a miss there never counts
// against anything (like a stretch miss at the next level); a right answer counts as usual.
function classifyAttempt({ status, firstTry = null, hintsUsed = 0, graded = true, mode = 'practice', timedOut = false }) {
  if (cfg.ignoreModes.includes(mode)) return { countable: false, outcome: null, why: 'mode' }
  if (timedOut) return { countable: false, outcome: null, why: 'time' }
  if (!graded) return { countable: false, outcome: null, why: 'ungraded' }
  if (mode === 'challenge' && (status === 'incorrect' || status === 'close')) return { countable: false, outcome: null, why: 'challenge' }
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

// weight (0..1): how much this answer counts; a right answer on an item with only 2 or 3
// choices counts for less (config.chanceDiscount). It scales the step, never the target, so
// mastery can still reach 1.
function nextMastery(m, outcome, weight = 1) {
  const c = creditOf(outcome)
  const w = CORRECT.has(outcome) ? Math.max(0, Math.min(1, Number(weight) || 0)) : 1
  const r = (cfg.masteryRate[outcome] ?? 0.2) * w
  let next = m + r * (c - m)
  if (CORRECT.has(outcome)) next = Math.max(m, next) // a right answer never lowers it
  return round3(Math.min(1, Math.max(0, next)))
}

// The evidence a mastered skill needs besides a high average (config.masteryEvidence): right
// answers on >= 2 different questions, one at stage >= 2 when the skill has items there
// (`stageAvail`: the highest stage this skill has questions at, recorded at the last answer).
// Rows from before this rule (no `rightItems`) keep the old rule, as does a row that was
// mastered under it (`legacyEvidence`) until its next miss.
function hasEvidence(s) {
  if (!Array.isArray(s.rightItems) || s.legacyEvidence) return true
  const ev = cfg.masteryEvidence
  if (s.rightItems.length < ev.minItems) return false
  if (Number.isInteger(s.stageAvail) && s.stageAvail >= ev.minStage && !((s.topStage ?? -1) >= ev.minStage)) return false
  return true
}

const isMastered = (s) => (s.mastery || 0) >= cfg.masteredAt && (s.box || 0) >= cfg.masteredMinBox && hasEvidence(s)

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
  // A new occurrence re-opens it (resolvedAt: null).
  if (hit) Object.assign(hit, { count: hit.count + 1, at: now, resolvedAt: null }, from.q ? from : {})
  else out.push({ text: t, count: 1, at: now, ...from, explained: 0, resolvedAt: null })
  out.sort((a, b) => b.count - a.count || new Date(b.at) - new Date(a.at))
  return out.slice(0, cfg.limits.misconceptions)
}

// Per-stage counts on a skill row: [{ s: stage, n: attempts, c: right, i: right first try, no hint }].
function bumpStage(list, stage, outcome) {
  const out = (list || []).map((x) => ({ ...x }))
  if (!Number.isInteger(stage)) return out
  let row = out.find((x) => x.s === stage)
  if (!row) { row = { s: stage, n: 0, c: 0, i: 0 }; out.push(row) }
  row.n += 1
  if (CORRECT.has(outcome)) row.c += 1
  if (outcome === 'independent') row.i += 1
  return out.sort((a, b) => a.s - b.s)
}

// One graded attempt on a skill.
//   attempt: { outcome, itemLevel, module, questionId, misconception, strategyUsed,
//              stage (the item's stage or null), choices (2/3 for few-choice items), stageAvail }
// Returns { skill, events } where events tell the feedback and level code what happened.
function updateSkill(prev, attempt, now) {
  // Rows written before the evidence rule have no rightItems: they keep the old rule while they
  // are mastered (legacyEvidence), so nobody loses a mastered skill because the rule changed.
  const legacyRow = (prev?.attempts || 0) > 0 && !Array.isArray(prev?.rightItems)
  const s = {
    mastery: 0, attempts: 0, correct: 0, independent: 0, streak: 0, missesSinceSuccess: 0, box: 0, due: null,
    supportStep: 0, missesAtStep: 0, parkedUntil: null, helpedBy: null, lastOutcome: null, lastAt: null,
    lastCorrectAt: null, lastMissAt: null, masteredAt: null, modules: [], misconceptions: [], level: null,
    topStage: null, stageAvail: null, byStage: [], legacyEvidence: false,
    ...prev,
  }
  s.rightItems = Array.isArray(prev?.rightItems) ? prev.rightItems : []
  if (legacyRow) s.legacyEvidence = isMastered({ ...prev, rightItems: undefined })
  const { outcome } = attempt
  const before = { ...s, rightItems: legacyRow ? undefined : s.rightItems }
  before.state = skillState(before, now)
  before.mastered = isMastered(before)
  const ok = CORRECT.has(outcome)
  const next = { ...s }

  next.attempts = s.attempts + 1
  if (ok) next.correct = s.correct + 1
  if (outcome === 'independent') next.independent = s.independent + 1
  next.mastery = nextMastery(s.mastery || 0, outcome, ok ? chanceWeight(attempt.choices) : 1)
  next.streak = ok ? s.streak + 1 : 0
  next.missesSinceSuccess = outcome === 'incorrect' ? s.missesSinceSuccess + 1 : ok ? 0 : s.missesSinceSuccess

  const esc = escalate(s, outcome, now)
  next.supportStep = esc.supportStep
  next.missesAtStep = esc.missesAtStep
  next.parkedUntil = esc.parkedUntil
  const sched = schedule({ box: s.box, due: s.due }, outcome, now, { park: esc.parked })
  next.box = sched.box
  next.due = sched.due

  // Evidence for "mastered": which questions came right, the highest stage that came right.
  const stage = Number.isInteger(attempt.stage) ? attempt.stage : null
  if (ok && typeof attempt.questionId === 'string' && attempt.questionId && !s.rightItems.includes(attempt.questionId)) {
    next.rightItems = [...s.rightItems, attempt.questionId.slice(0, 80)].slice(-cfg.limits.rightItems)
  }
  if (ok && stage != null) next.topStage = Math.max(s.topStage ?? -1, stage)
  if (Number.isInteger(attempt.stageAvail)) next.stageAvail = attempt.stageAvail
  next.byStage = bumpStage(s.byStage, stage, outcome)
  if (outcome === 'incorrect') next.legacyEvidence = false

  // The approach that came right before a success after a struggle is remembered.
  let strategyCredited = null
  if (ok && s.missesSinceSuccess > 0 && attempt.strategyUsed && attempt.strategyUsed !== 'reassess') {
    strategyCredited = attempt.strategyUsed
    next.helpedBy = strategyCredited
  }

  next.lastOutcome = outcome
  next.lastAt = now
  if (ok) next.lastCorrectAt = now
  let misconceptionRepeat = null
  if (outcome === 'incorrect') {
    next.lastMissAt = now
    if (attempt.misconception) {
      next.misconceptions = addMisconception(s.misconceptions, attempt.misconception, now, { q: attempt.questionId, module: attempt.module })
      // The same idea went wrong `misconceptionRepeat` times since it was last explained.
      const m = next.misconceptions.find((x) => x.text === String(attempt.misconception).trim().slice(0, cfg.limits.misconceptionText))
      if (m && m.count - (m.explained || 0) >= cfg.misconceptionRepeat) {
        m.explained = m.count
        misconceptionRepeat = { text: m.text, count: m.count, q: m.q || null, module: m.module || null }
      }
    }
  } else if (ok && next.streak >= 2) {
    // Two right answers in a row after a misconception's last occurrence: it counts as resolved.
    next.misconceptions = (next.misconceptions || []).map((m) => (m.resolvedAt ? m : { ...m, resolvedAt: now }))
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
      wasReviewDue: before.state === 'review_due',
      stage,
      misconceptionRepeat,
    },
  }
}

module.exports = { answerStatus, classifyAttempt, creditOf, nextMastery, updateSkill, skillState, isMastered, hasEvidence, addMisconception, bumpStage, STATUSES }
