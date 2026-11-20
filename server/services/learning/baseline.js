// Optional baseline placement: one graded item per level, easiest first; the
// learner is placed at the highest level answered correctly before two misses.
// (They can always pick a level themselves instead.) Pure.
const { createRng } = require('./rng')
const cfg = require('../../config/learning')

const STOP_AFTER_MISSES = 2

// One item per level 0..ceiling, ascending: graded, verified when any are,
// not a microphone item outside the speak module, not "young" for teens/adults.
function pickBaselineItems(pool, { module, ageBand = null, seed = 'b' } = {}) {
  const rng = createRng(seed)
  const graded = pool.filter((q) => q.graded && Number.isInteger(q.level) && q.qaStatus !== 'needs_review')
  const anyVerified = graded.some((q) => q.verified)
  const usable = anyVerified ? graded.filter((q) => q.verified) : graded
  const adultish = ageBand === 'teen' || ageBand === 'adult'
  const levels = [...new Set(usable.map((q) => q.level))].sort((a, b) => a - b)
  const out = []
  for (const level of levels) {
    const at = usable.filter((q) => q.level === level)
    const penalty = (q) => (module !== 'speak' && q.interaction === 'mic_record' ? 2 : 0) + (adultish && q.ageBand === 'young' ? 1 : 0)
    const best = Math.min(...at.map(penalty))
    const pick = rng.pick(at.filter((q) => penalty(q) === best))
    if (pick) out.push(pick)
  }
  return out
}

// results: [{ level, status }] -> the placement level.
// "correct" moves the placement up; "incorrect" is a miss; close, uncertain and
// ungraded answers are neither (they never push anyone down).
function placeLevel(results) {
  const sorted = [...results].filter((r) => Number.isInteger(r.level)).sort((a, b) => a.level - b.level)
  let best = null
  let misses = 0
  for (const r of sorted) {
    if (r.status === 'correct') best = best == null ? r.level : Math.max(best, r.level)
    else if (r.status === 'incorrect' && ++misses >= STOP_AFTER_MISSES) break
  }
  return Math.max(cfg.MIN_LEVEL, Math.min(cfg.MAX_LEVEL, best ?? cfg.MIN_LEVEL))
}

module.exports = { pickBaselineItems, placeLevel, STOP_AFTER_MISSES }
