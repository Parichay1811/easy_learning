// Diagnostic probe per skill (config.probe; a starting hypothesis). Pure.
//
// The first contact with a skill is up to `probe.items` accessible items (the
// round marks them why "probe"). Then:
//   confident  right first try, no hint, on an item at stage >= confidentStage:
//              starting mastery at least `confidentMastery`, Leitner box 1 (it
//              comes back tomorrow as a review), no beginner practice meanwhile;
//   gentle     no right answer in the probe: support step >= gentleStep (pictures
//              and a worked example up front) and lower stages first;
//   steady     anything else: normal practice.
// Skill rows from before probes existed (attempts but no `probe`) are never probed.
const cfg = require('../../config/learning')
const { dueAfter } = require('./spacing')

const RIGHT = new Set(['independent', 'assisted'])

// Is the next answer on this skill part of its probe?
const inProbe = (row) => !((row?.attempts || 0) > 0) || row?.probe?.state === 'pending'

/**
 * @param before  the skill row before this answer (or null)
 * @param skill   the row after mastery.updateSkill
 * @param attempt { outcome, stage }
 * -> { skill, result: null | { state, n, right, stage } }  (result only when the probe concludes)
 */
function applyProbe(before, skill, { outcome, stage }, now) {
  if (!inProbe(before)) return { skill, result: null }
  const prev = (before?.attempts || 0) > 0 ? before.probe || {} : {}
  const n = (prev.n || 0) + 1
  const right = (prev.right || 0) + (RIGHT.has(outcome) ? 1 : 0)
  const top = Number.isInteger(stage) ? Math.max(prev.top ?? -1, stage) : (prev.top ?? null)
  const confident = outcome === 'independent' && Number.isInteger(stage) && stage >= cfg.probe.confidentStage
  let state = 'pending'
  if (confident) state = 'confident'
  else if (n >= cfg.probe.items) state = right > 0 ? 'steady' : 'gentle'

  const s = { ...skill, probe: { state, n, right, top: top == null || top < 0 ? null : top, at: now } }
  if (state === 'confident') {
    s.mastery = Math.max(s.mastery || 0, cfg.probe.confidentMastery)
    if ((s.box || 0) < 1) { s.box = 1; s.due = dueAfter(1, now) }
    s.supportStep = 0
    s.missesAtStep = 0
  } else if (state === 'gentle') {
    s.supportStep = Math.max(s.supportStep | 0, cfg.probe.gentleStep)
  }
  return { skill: s, result: state === 'pending' ? null : { state, n, right, stage: s.probe.top } }
}

module.exports = { applyProbe, inProbe }
