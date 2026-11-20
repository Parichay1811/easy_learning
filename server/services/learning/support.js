// Teaching escalation per skill: when something does not work, change the
// approach instead of repeating it. Pure.
//
//   step 0 words    numbers/words, hint 1 on request
//   step 1 visual   pictures/objects: visual + worked example up front
//   step 2 guided   step by step: all hints in order, read aloud
//   step 3 simpler  an easier related item next (a prerequisite), then back
//   step 4 reassess park the skill, reassess later (review due tomorrow)
//
// An independent correct (first try, no hint asked for) steps down one. After a
// park, a correct answer starts the ladder again (independent: step 0; with
// help: step 2). A miss at the reassess step parks it again and asks a grown-up
// to look (the engine turns `reparked` into a "review" suggestion).
const cfg = require('../../config/learning')

const DAY = 86400000
const strategyFor = (step) => cfg.strategies[Math.max(0, Math.min(cfg.strategies.length - 1, step | 0))]
const LAST = cfg.strategies.length - 1

// outcome: 'independent' | 'assisted' | 'close' | 'incorrect'
function escalate(state, outcome, now, { missesPerStep = cfg.missesPerStep, parkDays = cfg.parkDays } = {}) {
  const step = Math.max(0, Math.min(LAST, state.supportStep | 0))
  let misses = state.missesAtStep | 0
  const out = { supportStep: step, missesAtStep: misses, parkedUntil: state.parkedUntil || null, parked: false, reparked: false, changed: false }

  if (outcome === 'independent') {
    out.supportStep = step === LAST ? 0 : Math.max(0, step - 1)
    out.missesAtStep = 0
    out.parkedUntil = null
  } else if (outcome === 'assisted') {
    out.supportStep = step === LAST ? 2 : step
    out.missesAtStep = 0
    if (step === LAST) out.parkedUntil = null
  } else if (outcome === 'incorrect') {
    misses += 1
    if (step === LAST) {
      out.supportStep = LAST
      out.missesAtStep = 0
      out.parkedUntil = new Date(now.getTime() + parkDays * DAY)
      out.parked = true
      out.reparked = true
    } else if (misses >= missesPerStep) {
      out.supportStep = step + 1
      out.missesAtStep = 0
      if (out.supportStep === LAST) {
        out.parkedUntil = new Date(now.getTime() + parkDays * DAY)
        out.parked = true
      }
    } else {
      out.missesAtStep = misses
    }
  }
  // 'close' (a near miss) changes nothing: it is not a miss.
  out.changed = out.supportStep !== step
  out.strategy = strategyFor(out.supportStep)
  return out
}

const isParked = (skill, now) => !!skill?.parkedUntil && new Date(skill.parkedUntil).getTime() > now.getTime()

module.exports = { escalate, strategyFor, isParked }
