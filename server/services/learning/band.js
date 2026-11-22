// Target success band per subject (config.targetBand; a starting hypothesis). Pure.
//
// The share of RIGHT answers (right first try or with help; a close answer is
// not yet right) over the last `window` graded attempts in a subject. Below
// `low` the next round tilts easier, above `high` harder, inside it holds. No
// tilt before `minAttempts` answers; a new level starts that count afresh
// (`fresh`: answers since the level changed). Once tilted, it turns back to
// "hold" only `hysteresis` inside the band. Time is never part of it.
//
// State per subject (profile.band[subject]): { recent: [1, 0, ...] (the last `window`, kept across
// level changes for the grown-ups' "now"), fresh: answers since the level changed, tilt }
const cfg = require('../../config/learning')

const round2 = (n) => Math.round(n * 100) / 100

// list: [1, 0, 1, ...] (1 = right); prev: the tilt so far -> { low, high, recent (rate or null), n, tilt }
function bandOf(list = [], c = cfg.targetBand, prev = 'hold') {
  const l = (Array.isArray(list) ? list : []).slice(-c.window)
  const n = l.length
  const rate = n ? round2(l.reduce((a, b) => a + (b ? 1 : 0), 0) / n) : null
  let tilt = 'hold'
  if (n >= c.minAttempts) {
    const h = c.hysteresis || 0
    if (rate < c.low) tilt = 'easier'
    else if (rate > c.high) tilt = 'harder'
    else if (prev === 'harder' && rate > c.high - h) tilt = 'harder'
    else if (prev === 'easier' && rate < c.low + h) tilt = 'easier'
  }
  return { low: c.low, high: c.high, recent: rate, n, tilt }
}

const freshOf = (state) => {
  const r = Array.isArray(state?.recent) ? state.recent : []
  return Math.min(cfg.targetBand.window, Number.isInteger(state?.fresh) ? state.fresh : r.length)
}
// The answers that count for the tilt: those since the level last changed.
function windowOf(state) {
  const f = freshOf(state)
  return f ? (Array.isArray(state?.recent) ? state.recent : []).slice(-f) : []
}

// The band of a subject as the next round uses it.
const bandState = (state) => bandOf(windowOf(state), cfg.targetBand, state?.tilt || 'hold')

// One graded outcome -> { state, band, changed: { from, to } | null }
function recordBand(state, right) {
  const w = cfg.targetBand.window
  const recent = [...(Array.isArray(state?.recent) ? state.recent : []), right ? 1 : 0].slice(-w)
  const fresh = Math.min(w, freshOf(state) + 1)
  const from = state?.tilt || 'hold'
  const band = bandOf(recent.slice(-fresh), cfg.targetBand, from)
  return { state: { recent, fresh, tilt: band.tilt }, band, changed: band.tilt !== from ? { from, to: band.tilt } : null }
}

// A new level: the tilt starts afresh (the recent answers stay, for the grown-ups' "now").
const restartBand = (state) => ({ recent: Array.isArray(state?.recent) ? state.recent : [], fresh: 0, tilt: 'hold' })

module.exports = { bandOf, bandState, recordBand, restartBand, windowOf }
