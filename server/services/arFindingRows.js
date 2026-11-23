// Camera-game (AR) rounds, as the compact rows the findings engine reads.
//
// One source of truth for the findings themselves: the pure engine in
// client/src/ar/insights/findings.js. It has to run on the device (the insights
// screen works offline from the on-device history) and it is where the
// sentences are translated, so it lives in the client. The server's only jobs
// are deciding WHO may see a learner's rounds (each route keeps its own access
// check) and handing over the same row shape for two equal periods: the one
// asked about and the one just before it. The learner's own screen, the student
// dashboard, the parent's Learning tab and the teacher's student view all feed
// the very same rows to the very same engine, so they can never disagree.
//
// A row is one round's summary, never its trials: no per-turn data, no frames,
// nothing the parent/teacher views do not need.
const ARSession = require('../models/ARSession')

const DAY_MS = 86400000
const MAX_ROWS_PER_PERIOD = 400 // a child plays tens of rounds a month; more than this is a runaway
const MIN_DAYS = 1
const MAX_DAYS = 400

const ISO = /^\d{4}-\d{2}-\d{2}$/
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null)
const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const daysBetween = (a, b) => Math.round((new Date(`${b}T12:00:00Z`) - new Date(`${a}T12:00:00Z`)) / DAY_MS)
const utcDay = (d) => new Date(d).toISOString().slice(0, 10)

const FIELDS = 'gameId engine title group domains lifeSkill startedAt activeMs outcome promptStageStart promptStageEnd '
  + 'level levelCleared clearedBy summary.trials summary.correct summary.near summary.accuracyPct summary.comprehensionPct '
  + 'summary.independentPct summary.medianLatencyMs summary.medianMovementMs summary.pathEfficiency '
  + 'summary.timingVariabilityMs summary.inhibitionPct summary.noGoTrials summary.traceAccuracy summary.pauseCount'

/** One stored round → the engine's row. Mirrors rowFromSession() in the client engine. */
function compactRow(doc) {
  const s = (doc && doc.summary) || {}
  const at = doc.startedAt ? new Date(doc.startedAt) : null
  return {
    at: at ? at.toISOString() : null,
    day: at ? utcDay(at) : null,
    gameId: str(doc.gameId),
    engine: str(doc.engine),
    title: str(doc.title),
    group: str(doc.group),
    domains: Array.isArray(doc.domains) ? doc.domains.filter((d) => typeof d === 'string').slice(0, 8) : [],
    lifeSkill: str(doc.lifeSkill),
    outcome: str(doc.outcome) || 'completed',
    activeMs: num(doc.activeMs) || 0,
    trials: num(s.trials) || 0,
    correct: num(s.correct) || 0,
    near: num(s.near) || 0,
    accuracyPct: num(s.accuracyPct),
    comprehensionPct: num(s.comprehensionPct),
    independentPct: num(s.independentPct),
    medianLatencyMs: num(s.medianLatencyMs),
    medianMovementMs: num(s.medianMovementMs),
    pathEfficiency: num(s.pathEfficiency),
    timingVariabilityMs: num(s.timingVariabilityMs),
    inhibitionPct: num(s.inhibitionPct),
    noGoTrials: num(s.noGoTrials) || 0,
    traceAccuracy: num(s.traceAccuracy),
    pauseCount: num(s.pauseCount) || 0,
    promptStart: str(doc.promptStageStart),
    promptEnd: str(doc.promptStageEnd),
    level: num(doc.level),
    levelCleared: typeof doc.levelCleared === 'boolean' ? doc.levelCleared : null,
    clearedBy: str(doc.clearedBy),
  }
}

/**
 * The period asked about and the equal period before it, as UTC calendar days.
 *   periods({ to: '2026-11-23', days: 28 })           → the 28 days ending on the 23rd and the 28 before
 *   periods({ from: '2026-11-01', to: '2026-11-30' }) → November, and the 30 days before it
 */
function periods({ from, to, days } = {}) {
  const end = ISO.test(to || '') ? to : utcDay(Date.now())
  let n = Number.isFinite(Number(days)) && Number(days) > 0 ? Math.round(Number(days)) : null
  let start = ISO.test(from || '') ? from : null
  if (start && start > end) start = end
  if (!n) n = start ? daysBetween(start, end) + 1 : 28
  n = Math.min(Math.max(n, MIN_DAYS), MAX_DAYS)
  if (!start || daysBetween(start, end) + 1 !== n) start = addDays(end, -(n - 1))
  return {
    period: { from: start, to: end, days: n },
    previous: { from: addDays(start, -n), to: addDays(start, -1), days: n },
  }
}

const startOf = (iso) => new Date(`${iso}T00:00:00.000Z`)
const endOf = (iso) => new Date(`${iso}T23:59:59.999Z`)

async function rowsIn(email, win, limit = MAX_ROWS_PER_PERIOD) {
  // Newest first so a runaway history keeps its most recent rounds, then put
  // back in time order for the engine.
  const docs = await ARSession.find({ email, startedAt: { $gte: startOf(win.from), $lte: endOf(win.to) } })
    .select(FIELDS).sort({ startedAt: -1 }).limit(limit + 1).lean()
  const truncated = docs.length > limit
  return { rows: docs.slice(0, limit).reverse().map(compactRow), truncated }
}

/**
 * Everything the engine needs for one learner, for one period and the one before.
 * The CALLER has already decided this viewer may see this learner's rounds.
 * @returns {{ period, previous, rows: { current, previous }, truncated }}
 */
async function findingsInput(email, opts = {}) {
  const who = String(email || '').trim().toLowerCase()
  const { period, previous } = periods(opts)
  if (!who) return { period, previous, rows: { current: [], previous: [] }, truncated: false }
  const [cur, prev] = await Promise.all([rowsIn(who, period), rowsIn(who, previous)])
  return { period, previous, rows: { current: cur.rows, previous: prev.rows }, truncated: cur.truncated || prev.truncated }
}

module.exports = { compactRow, periods, findingsInput, MAX_ROWS_PER_PERIOD }
