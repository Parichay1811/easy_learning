// The decision log: why the engine did what it did, in numbers and plain words. Pure.
//
// A decision (models/learning/LearningDecision.js) is { at, type, subject, skill,
// from, to, reason (a code), evidence: small numbers only }: no answers, nothing
// the learner typed or said, no times. The views render a reason as
// { key: "learn.decision.<code>", params, text } (English text; the client
// translates with t(key, { defaultValue: text, ...params })).
const cfg = require('../../config/learning')
const { render } = require('./feedback')

const SUBJECT_NAMES = { english: 'English', maths: 'Maths', science: 'Science' }
const STRATEGY_NAMES = { words: 'words', visual: 'pictures', guided: 'step by step', simpler: 'an easier one first', reassess: 'a rest' }

// reason code -> English text (keys learn.decision.<code>)
const REASONS = {
  level_up: 'Moved up from level {{from}} to level {{to}} in {{subjectName}}: {{pct}}% right over the last {{n}} answers, on {{days}} different days.',
  level_suggest_up: 'Suggested level {{to}} in {{subjectName}} ({{pct}}% right over the last {{n}} answers). The level is held, so it only changes if someone accepts.',
  level_suggest_down: 'Suggested some time at level {{to}} in {{subjectName}} ({{pct}}% right over the last {{n}} answers, on {{days}} days). Nothing changes unless someone accepts.',
  set_by_learner: '{{subjectName}} level set to {{to}} by the learner (it was {{from}}).',
  set_by_guardian: '{{subjectName}} level set to {{to}} by a guardian (it was {{from}}).',
  set_by_teacher: '{{subjectName}} level set to {{to}} by a teacher (it was {{from}}).',
  accepted_suggestion: '{{subjectName}} level changed from {{from}} to {{to}} after the learner accepted a suggestion.',
  placement: '{{subjectName}} level {{to}} from the placement check-in ({{right}} of {{n}} right).',
  // _one / _other: plural forms chosen by params.count (i18next does the same with `count`).
  support_up_one: '{{skillName}}: now explained a different way ({{strategyName}}) after a miss.',
  support_up_other: '{{skillName}}: now explained a different way ({{strategyName}}) after {{count}} misses in a row.',
  support_down: '{{skillName}}: less support needed now ({{strategyName}}) after a right answer without help.',
  support_park_one: '{{skillName}}: resting until tomorrow after another miss; it comes back as a review.',
  support_park_other: '{{skillName}}: resting until tomorrow after {{count}} misses in a row; it comes back as a review.',
  probe_confident: '{{skillName}}: a confident start (right first time without help, at stage {{stage}}), so beginner practice is skipped.',
  probe_steady: '{{skillName}}: first questions done ({{right}} of {{n}} right); normal practice from here.',
  probe_gentle: '{{skillName}}: the first questions were tricky ({{right}} of {{n}} right), so it starts gently, with support.',
  band_easier: '{{subjectName}}: {{pct}}% right over the last {{n}} answers, below the {{lowPct}}-{{highPct}}% target, so the next rounds are a little easier.',
  band_harder: '{{subjectName}}: {{pct}}% right over the last {{n}} answers, above the {{lowPct}}-{{highPct}}% target, so the next rounds are a little harder.',
  band_hold: '{{subjectName}}: {{pct}}% right over the last {{n}} answers, inside the {{lowPct}}-{{highPct}}% target, so rounds stay as they are.',
  misconception_explained: '{{skillName}}: the same mix-up came up {{count}} times, so the next question comes with a short explanation.',
  mastered: '{{skillName}} mastered: right on {{items}} different questions, up to stage {{stage}}, and remembered on a later day.',
}

// A text by code; codes with plural forms (<code>_one / <code>_other) pick one by params.count.
function templateOf(table, code, params = {}) {
  if (table[code] != null) return table[code]
  if (table[`${code}_one`] != null) return params.count === 1 ? table[`${code}_one`] : table[`${code}_other`]
  return ''
}

const pct = (x) => (typeof x === 'number' ? Math.round(x * 100) : null)
const small = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v === 'number' && Number.isFinite(v)).map(([k, v]) => [k, Math.round(v * 1000) / 1000]))

// A decision document (without email); evidence keeps numbers only.
function decision(type, { at, subject = null, skill = null, from = null, to = null, reason, evidence = {} }) {
  return { at, type, subject, skill, from, to, reason, evidence: small(evidence) }
}

/**
 * The decisions behind one counted answer (engine.applyAttempt).
 * ctx: { now, subject, skillId, before (row before), skill (row after), events, probe, band, levelChange,
 *        levelEval, suggestion, misconceptionRepeat }
 */
function decisionsFromAttempt(ctx) {
  const { now: at, subject, skillId, before, skill } = ctx
  const out = []
  if (ctx.levelChange) {
    const ev = ctx.levelEval || {}
    out.push(decision('level_up', { at, subject, from: ctx.levelChange.from, to: ctx.levelChange.to, reason: 'level_up', evidence: { acc: ev.accuracy, n: ev.n, days: ev.days } }))
  }
  if (ctx.suggestion && (ctx.suggestion.type === 'level_up' || ctx.suggestion.type === 'level_down')) {
    const ev = ctx.levelEval || {}
    out.push(decision('level_suggest', {
      at, subject, from: ctx.suggestion.level, to: ctx.suggestion.to, reason: ctx.suggestion.type === 'level_up' ? 'level_suggest_up' : 'level_suggest_down',
      evidence: { acc: ev.accuracy, n: ev.n, days: ev.days },
    }))
  }
  if (ctx.probe) {
    out.push(decision('probe', { at, subject, skill: skillId, to: ctx.probe.state, reason: `probe_${ctx.probe.state}`, evidence: { n: ctx.probe.n, right: ctx.probe.right, stage: ctx.probe.stage } }))
  }
  // A change of approach (not the one a concluded probe explains).
  const fromStep = before?.supportStep | 0
  const toStep = skill?.supportStep | 0
  if (fromStep !== toStep && !ctx.probe) {
    const parked = !!ctx.events?.parked
    out.push(decision('support_step', {
      at, subject, skill: skillId, from: fromStep, to: toStep,
      reason: parked ? 'support_park' : toStep > fromStep ? 'support_up' : 'support_down',
      evidence: { step: toStep, misses: toStep > fromStep ? (before?.missesSinceSuccess || 0) + 1 : 0 },
    }))
  }
  if (ctx.band) {
    out.push(decision('band_tilt', {
      at, subject, from: ctx.band.from, to: ctx.band.to, reason: `band_${ctx.band.to}`,
      evidence: { acc: ctx.band.recent, n: ctx.band.n, low: ctx.band.low, high: ctx.band.high },
    }))
  }
  if (ctx.misconceptionRepeat) {
    out.push(decision('misconception_explained', { at, subject, skill: skillId, reason: 'misconception_explained', evidence: { count: ctx.misconceptionRepeat.count } }))
  }
  if (ctx.newlyMastered) {
    out.push(decision('mastered', {
      at, subject, skill: skillId, reason: 'mastered',
      evidence: { items: Array.isArray(skill.rightItems) ? skill.rightItems.length : null, stage: skill.topStage, box: skill.box, mastery: skill.mastery },
    }))
  }
  return out
}

// A level set by someone (learner, guardian, teacher, placement, accepted suggestion).
function levelSet({ at, subject, from, to, reason, evidence = {} }) {
  return decision('level_set', { at, subject, from, to, reason, evidence })
}

// -> { at, type, subject, skill, reason: { key, params, text } }
//   names: optional Map skill id -> English name (the learner's skill rows), for skills outside the catalogue
function decisionView(d, catalog, names = null) {
  const ev = d.evidence || {}
  const fallback = names?.get?.(d.skill) || undefined
  const skillName = d.skill ? (catalog ? catalog.name(d.skill, fallback) : fallback || d.skill) : null
  const params = {
    ...(d.subject ? { subject: d.subject, subjectName: SUBJECT_NAMES[d.subject] || d.subject } : {}),
    ...(d.skill ? { skill: d.skill, skillName } : {}),
    ...(d.from != null ? { from: d.from } : {}),
    ...(d.to != null ? { to: d.to } : {}),
    ...ev,
  }
  if (typeof ev.acc === 'number') params.pct = pct(ev.acc)
  if (typeof ev.low === 'number') params.lowPct = pct(ev.low)
  if (typeof ev.high === 'number') params.highPct = pct(ev.high)
  if (d.type === 'support_step' && Number.isInteger(d.to)) {
    params.strategy = cfg.strategies[d.to] || 'words'
    params.strategyName = STRATEGY_NAMES[params.strategy]
    if (typeof ev.misses === 'number') params.count = ev.misses
  }
  const template = templateOf(REASONS, d.reason, params)
  return {
    at: d.at, type: d.type, subject: d.subject || null, skill: d.skill || null,
    reason: { key: `learn.decision.${d.reason}`, params, text: render(template, params) },
  }
}

module.exports = { REASONS, SUBJECT_NAMES, STRATEGY_NAMES, decision, decisionsFromAttempt, levelSet, decisionView, templateOf }
