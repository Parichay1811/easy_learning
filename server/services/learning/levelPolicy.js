// Per-subject level policy. Pure.
//
//   accuracy  = mean credit of the last `levelWindow` graded attempts at the level
//   >= advance (0.85)          "advancing": after >= 12 attempts over >= 2 days the
//                               level goes up by one (if not locked / held, and
//                               there is content above), otherwise a suggestion
//   practice..advance (0.60+)   "practice"
//   < practice                  "support": sustained support becomes a level_down
//                               SUGGESTION. A level is never lowered automatically.
//
// Which attempts count for the level: items AT the level; items above it only
// when answered right (a stretch miss is expected and never counts against);
// items below it (warm-ups, prerequisites) and items without a level never count.
const cfg = require('../../config/learning')

const round3 = (n) => Math.round(n * 1000) / 1000

// Who sets a level for each source, when not given.
const SETTER = { default: null, baseline: 'learner', self: 'learner', guardian: 'guardian', teacher: 'teacher', engine: 'engine' }

function freshLevel(level, source, { locked, lockedBy, now, setBy } = {}) {
  return {
    level, source, locked: !!locked, lockedBy: locked ? lockedBy || null : null, setAt: now || new Date(),
    setBy: setBy || { role: SETTER[source] ?? null, name: '' },
    attempts: 0, window: [], snoozeUp: null, snoozeDown: null,
  }
}

function normalise(ls) {
  return {
    level: Number.isInteger(ls?.level) ? ls.level : cfg.defaultLevel,
    source: ls?.source || 'default',
    locked: !!ls?.locked,
    lockedBy: ls?.lockedBy || null,
    setAt: ls?.setAt || null,
    setBy: { role: ls?.setBy?.role || null, name: ls?.setBy?.name || '' },
    attempts: ls?.attempts || 0,
    window: Array.isArray(ls?.window) ? ls.window.map((w) => ({ c: w.c, d: w.d })) : [],
    snoozeUp: ls?.snoozeUp || null,
    snoozeDown: ls?.snoozeDown || null,
  }
}

// Does this attempt count for the level? -> the new level state (or the same one).
function recordLevelAttempt(ls, { outcome, credit, itemLevel, date }) {
  const s = normalise(ls)
  if (!Number.isInteger(itemLevel) || itemLevel < s.level) return s
  const ok = outcome === 'independent' || outcome === 'assisted'
  if (itemLevel > s.level && !ok) return s
  s.window = [...s.window, { c: round3(credit), d: date }].slice(-cfg.levelWindow)
  s.attempts += 1
  return s
}

// { status, accuracy, attempts, days, action }
//   action: 'advance' | 'suggest_up' | 'suggest_down' | null
//   ctx: { ceiling (highest level with content, or null), hold (guardian/teacher hold), now }
function evaluateLevel(ls, { ceiling = null, hold = false, now = new Date() } = {}) {
  const s = normalise(ls)
  const n = s.window.length
  const accuracy = n ? round3(s.window.reduce((a, w) => a + (w.c || 0), 0) / n) : null
  const days = new Set(s.window.map((w) => w.d).filter(Boolean)).size
  let status = 'new'
  if (n >= cfg.minAttemptsForStatus) {
    status = accuracy >= cfg.thresholds.advance ? 'advancing' : accuracy >= cfg.thresholds.practice ? 'practice' : 'support'
  }
  let action = null
  const roomAbove = s.level < cfg.MAX_LEVEL && ceiling != null && s.level < ceiling
  if (status === 'advancing' && n >= cfg.minAttemptsToAdvance && days >= cfg.minDaysToAdvance && roomAbove) {
    if (s.locked || hold) {
      if (!s.snoozeUp || new Date(s.snoozeUp) <= now) action = 'suggest_up'
    } else action = 'advance'
  } else if (status === 'support' && n >= cfg.supportSuggest.minAttempts && days >= cfg.supportSuggest.minDays && s.level > cfg.MIN_LEVEL) {
    if (!s.snoozeDown || new Date(s.snoozeDown) <= now) action = 'suggest_down'
  }
  return { status, accuracy, attempts: s.attempts, days, action }
}

module.exports = { recordLevelAttempt, evaluateLevel, freshLevel, normalise }
