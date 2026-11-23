/**
 * The camera-games findings engine.
 *
 * Turns the rounds of two equal periods (the one asked about and the one just
 * before it) into a handful of plain-language FINDINGS for three readers: the
 * learner ("For me"), and the grown-ups around them (parent, teacher,
 * therapist). It is the single source of truth: the insights screen runs it on
 * the device (offline, from the on-device history, or from the server's rows
 * when signed in), and the student dashboard, the parent's Learning tab and the
 * teacher's student view run it on the rows their own server routes hand over
 * (server/services/arFindingRows.js builds the same row shape as rowFromSession
 * below). Pure: no React, no i18n, no network. The screens turn a finding into
 * words with ./text.js.
 *
 * The rules it keeps, because the insights screen exists to keep them:
 *  - Understanding (accuracy) and movement (speed, reach) are NEVER combined.
 *    They are different findings with different measures.
 *  - Nothing is a diagnosis, nothing is a deficit label, nothing compares a
 *    child with other children. The only comparison is with the same child's
 *    previous period.
 *  - It says "not enough play yet to tell" instead of guessing: a level needs
 *    RULES.minRounds rounds and RULES.minTrials turns, and a trend needs that
 *    in BOTH periods and a change bigger than the noise (see trendOfPct).
 *  - Praise is for process (practice, trying again, regular play), never for
 *    being clever.
 */
import { ACTIVITIES } from './activities.js'

export const RULES = Object.freeze({
  // How much play before anything is said about a skill.
  minRounds: 3,
  minTrials: 20,
  // A percentage has to move by at least this many points…
  minDeltaPts: 8,
  // …AND by more than this many standard errors of the difference (≈ 90 %, one-sided).
  seMultiplier: 1.65,
  // Turns inside one round are not independent of each other, so at most this
  // many turns per round count towards the noise estimate.
  turnsPerRoundCap: 12,
  strongPct: 85, // understood at least this share of turns: going well
  practisePct: 60, // below this share: worth more practice
  independentHighPct: 80,
  // Movement, in its own units.
  directnessDeltaPts: 5, // reach directness is path efficiency × 100
  directnessLowPct: 60,
  directnessHighPct: 80,
  movingTimeRel: 0.15, // quicker or slower by at least 15 %…
  movingTimeAbsMs: 150, // …and at least 150 ms
  // Regular play.
  consistencyDeltaDays: 2,
  consistencyDeltaRel: 0.25,
  // How many findings each reader gets.
  maxAdult: 6,
  minAdult: 3,
  learnerWins: 3,
})

const DAY = 86400000
const NO_FINDINGS_ENGINES = new Set(['calibration']) // a reach measurement, not a task with right answers

// ── small numeric helpers ────────────────────────────────────────────────────
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : null)
const r0 = (v) => (v == null ? null : Math.round(v))
const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10)
function median(values) {
  const v = values.filter((n) => Number.isFinite(n)).sort((a, b) => a - b)
  if (!v.length) return null
  const mid = Math.floor(v.length / 2)
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2
}
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10)
const dayMs = (iso) => Date.parse(`${iso}T00:00:00.000Z`)
const addDays = (iso, n) => isoDay(dayMs(iso) + n * DAY)
const daysBetween = (a, b) => Math.round((dayMs(b) - dayMs(a)) / DAY)

// ── rows ─────────────────────────────────────────────────────────────────────
/**
 * One on-device session (telemetry.js) → the engine's row. The server builds the
 * same shape from a stored round (server/services/arFindingRows.js compactRow).
 */
export function rowFromSession(s) {
  const sum = s?.summary || {}
  const atRaw = s?.startedAt || s?.endedAt || null
  const atMs = atRaw ? Date.parse(atRaw) : NaN
  return {
    at: Number.isFinite(atMs) ? new Date(atMs).toISOString() : null,
    day: Number.isFinite(atMs) ? isoDay(atMs) : null,
    gameId: s?.gameId || null,
    engine: s?.engine || null,
    title: s?.title || null,
    group: s?.group || null,
    domains: Array.isArray(s?.domains) ? s.domains.filter((d) => typeof d === 'string') : [],
    lifeSkill: s?.lifeSkill || null,
    outcome: s?.outcome || 'completed',
    activeMs: num(s?.activeMs) || 0,
    trials: num(sum.trials) || 0,
    correct: num(sum.correct) || 0,
    near: num(sum.near) || 0,
    accuracyPct: num(sum.accuracyPct),
    comprehensionPct: num(sum.comprehensionPct),
    independentPct: num(sum.independentPct),
    medianLatencyMs: num(sum.medianLatencyMs),
    medianMovementMs: num(sum.medianMovementMs),
    pathEfficiency: num(sum.pathEfficiency),
    timingVariabilityMs: num(sum.timingVariabilityMs),
    inhibitionPct: num(sum.inhibitionPct),
    noGoTrials: num(sum.noGoTrials) || 0,
    traceAccuracy: num(sum.traceAccuracy),
    pauseCount: num(sum.pauseCount) || 0,
    promptStart: s?.promptStageStart || null,
    promptEnd: s?.promptStageEnd || null,
    level: num(s?.level),
    levelCleared: typeof s?.levelCleared === 'boolean' ? s.levelCleared : null,
    clearedBy: s?.clearedBy || null,
  }
}

/** The period that ends today (UTC) and the equal one before it. */
export function periodsFor({ days = 28, to, now = Date.now() } = {}) {
  const n = Math.max(1, Math.round(Number(days) || 28))
  const end = typeof to === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : isoDay(now)
  const from = addDays(end, -(n - 1))
  return {
    period: { from, to: end, days: n },
    previous: { from: addDays(from, -n), to: addDays(from, -1), days: n },
  }
}

/** Splits rows into the two periods; rows outside both are dropped. */
export function splitRows(rows, { period, previous }) {
  const current = []
  const before = []
  for (const r of rows || []) {
    if (!r?.day) continue
    if (r.day >= period.from && r.day <= period.to) current.push(r)
    else if (r.day >= previous.from && r.day <= previous.to) before.push(r)
  }
  const byTime = (a, b) => String(a.at).localeCompare(String(b.at))
  return { current: current.sort(byTime), previous: before.sort(byTime) }
}

/** On-device sessions → the same input the server routes return. */
export function inputFromSessions(sessions, opts = {}) {
  const { period, previous } = periodsFor(opts)
  const rows = (sessions || []).map(rowFromSession)
  return { period, previous, rows: splitRows(rows, { period, previous }), truncated: false, source: 'device' }
}

// ── aggregation ──────────────────────────────────────────────────────────────
const countsForUnderstanding = (r) => !NO_FINDINGS_ENGINES.has(r.engine)

function understoodOf(r) {
  if (r.correct || r.near) return r.correct + r.near
  return r.comprehensionPct != null ? (r.comprehensionPct / 100) * r.trials : 0
}
const independentOf = (r) => (r.independentPct != null ? (r.independentPct / 100) * r.trials : 0)

/** Everything one set of rows says, in separate measures. */
export function aggregate(rows) {
  let rounds = 0
  let trials = 0
  let understood = 0
  let independent = 0
  let ms = 0
  let effSum = 0
  let effW = 0
  let effRounds = 0
  const days = new Set()
  const moving = []
  const thinking = []
  const levels = []
  const games = new Map()
  for (const r of rows || []) {
    if (r.day) days.add(r.day)
    ms += r.activeMs || 0
    if (r.level != null) levels.push(r.level)
    if (r.gameId) games.set(r.gameId, (games.get(r.gameId) || 0) + 1)
    const n = r.trials || 0
    if (n > 0) {
      rounds++
      trials += n
      understood += understoodOf(r)
      independent += independentOf(r)
      if (r.pathEfficiency != null) {
        effSum += r.pathEfficiency * n
        effW += n
        effRounds++
      }
      if (r.medianMovementMs != null) moving.push(r.medianMovementMs)
      if (r.medianLatencyMs != null) thinking.push(r.medianLatencyMs)
    }
  }
  return {
    played: (rows || []).length, // every round, including ones with no turns
    rounds, // rounds with at least one turn
    trials,
    days: days.size,
    dayList: [...days].sort(),
    minutes: Math.round(ms / 60000),
    understoodPct: pct(understood, trials),
    independentPct: pct(independent, trials),
    directnessPct: effW ? r1((effSum / effW) * 100) : null,
    directnessRounds: effRounds,
    movingMs: r0(median(moving)),
    movingRounds: moving.length,
    thinkingMs: r0(median(thinking)),
    thinkingRounds: thinking.length,
    levelTop: levels.length ? Math.max(...levels) : null,
    levelMedian: levels.length ? median(levels) : null,
    games: [...games.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id),
  }
}

const enough = (a) => a.rounds >= RULES.minRounds && a.trials >= RULES.minTrials

// ── trends ───────────────────────────────────────────────────────────────────
/**
 * Up / flat / down for a percentage, or null when either period has too little
 * play. "Up" needs the change to beat BOTH a fixed floor (RULES.minDeltaPts) and
 * the noise of two proportions measured on this many turns.
 */
export function trendOfPct(cur, prev, key) {
  if (!enough(cur) || !enough(prev)) return { dir: null, better: null, delta: null, threshold: null }
  const a = cur[key]
  const b = prev[key]
  if (a == null || b == null) return { dir: null, better: null, delta: null, threshold: null }
  const n1 = Math.max(1, Math.min(cur.trials, cur.rounds * RULES.turnsPerRoundCap))
  const n2 = Math.max(1, Math.min(prev.trials, prev.rounds * RULES.turnsPerRoundCap))
  const p1 = a / 100
  const p2 = b / 100
  const se = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2) * 100
  const threshold = Math.max(RULES.minDeltaPts, RULES.seMultiplier * se)
  const delta = a - b
  const dir = delta >= threshold ? 'up' : delta <= -threshold ? 'down' : 'flat'
  return { dir, better: dir === 'flat' ? null : dir === 'up', delta: r1(delta), threshold: r1(threshold) }
}

function trendOfDirectness(cur, prev) {
  const ok = (a) => a.directnessRounds >= RULES.minRounds && a.trials >= RULES.minTrials && a.directnessPct != null
  if (!ok(cur) || !ok(prev)) return { dir: null, better: null, delta: null, threshold: null }
  const delta = cur.directnessPct - prev.directnessPct
  const t = RULES.directnessDeltaPts
  const dir = delta >= t ? 'up' : delta <= -t ? 'down' : 'flat'
  return { dir, better: dir === 'flat' ? null : dir === 'up', delta: r1(delta), threshold: t }
}

function trendOfMovingTime(cur, prev) {
  const ok = (a) => a.movingRounds >= RULES.minRounds && a.movingMs != null
  if (!ok(cur) || !ok(prev)) return { dir: null, better: null, delta: null, threshold: null }
  const delta = cur.movingMs - prev.movingMs
  const t = Math.max(RULES.movingTimeAbsMs, prev.movingMs * RULES.movingTimeRel)
  const dir = delta <= -t ? 'down' : delta >= t ? 'up' : 'flat'
  // Lower is quicker. Quicker is reported as better movement; slower is never
  // reported as a problem on its own (careful is fine).
  return { dir, better: dir === 'down' ? true : null, delta: r0(delta), threshold: r0(t) }
}

function trendOfDays(cur, prev) {
  if (!prev.played) return { dir: null, better: null, delta: null, threshold: null }
  const t = Math.max(RULES.consistencyDeltaDays, Math.round(prev.days * RULES.consistencyDeltaRel))
  const delta = cur.days - prev.days
  const dir = delta >= t ? 'up' : delta <= -t ? 'down' : 'flat'
  return { dir, better: dir === 'up' ? true : null, delta, threshold: t }
}

// ── series for the sparklines ────────────────────────────────────────────────
/** Buckets both periods into equal slices (weeks, or days for a short period). */
export function buckets({ period, previous }) {
  const size = period.days <= 7 ? 1 : period.days <= 120 ? 7 : 14
  const out = []
  const add = (win, current) => {
    const count = Math.max(1, Math.ceil(win.days / size))
    for (let i = 0; i < count; i++) {
      const to = addDays(win.to, -i * size)
      const fromCand = addDays(to, -(size - 1))
      const from = fromCand < win.from ? win.from : fromCand
      out.push({ from, to, current })
    }
  }
  add(previous, false)
  add(period, true)
  return out.sort((a, b) => a.from.localeCompare(b.from))
}

const MEASURE_OF = {
  understanding: (a) => (a.trials ? a.understoodPct : null),
  independence: (a) => (a.trials ? a.independentPct : null),
  directness: (a) => (a.directnessRounds ? a.directnessPct : null),
  movingTime: (a) => (a.movingRounds ? a.movingMs : null),
  thinkingTime: (a) => (a.thinkingRounds ? a.thinkingMs : null),
  days: (a) => a.days,
  rounds: (a) => a.played,
}

function seriesOf(rows, bucketList, measure) {
  const pick = MEASURE_OF[measure]
  return bucketList.map((b) => {
    const inB = rows.filter((r) => r.day >= b.from && r.day <= b.to)
    const a = aggregate(inB)
    return { from: b.from, to: b.to, current: b.current, value: inB.length || measure === 'days' || measure === 'rounds' ? pick(a) : null }
  })
}

// ── catalogue helpers (next game) ────────────────────────────────────────────
/**
 * A game to play next for one skill area.
 *  practise: the game already played most in that area (keep going, a level lower is fine);
 *  stretch:  a game in that area not played yet, else the same game at the next level.
 */
function suggestGame(domain, mode, { catalog, playedGames, gameSlices }) {
  const inDomain = (g) => g && !NO_FINDINGS_ENGINES.has(g.engine) && Array.isArray(g.domains) && g.domains[0] === domain
  const played = playedGames.filter((id) => {
    const g = catalog.find((c) => c.id === id)
    return g ? inDomain(g) : gameSlices.get(id)?.domain === domain
  })
  if (mode === 'practise' && played.length) return { gameId: played[0], mode: 'practise' }
  const fresh = catalog.filter((g) => inDomain(g) && !playedGames.includes(g.id))
  if (mode === 'stretch' && fresh.length) return { gameId: fresh[0].id, mode: 'new' }
  if (played.length) return { gameId: played[0], mode: mode === 'stretch' ? 'nextLevel' : 'practise' }
  if (fresh.length) return { gameId: fresh[0].id, mode: 'new' }
  return null
}

// ── the findings ─────────────────────────────────────────────────────────────
const primaryDomain = (r) => (Array.isArray(r.domains) && r.domains.length ? r.domains[0] : null)

function evidenceOf(cur, prev, input) {
  return {
    rounds: cur.rounds,
    trials: cur.trials,
    days: cur.days,
    prevRounds: prev.rounds,
    prevTrials: prev.trials,
    period: input.period,
    previous: input.previous,
  }
}

/**
 * @param {{ period, previous, rows: { current: object[], previous: object[] } }} input
 *   what the server routes return (services/arFindingRows.js) or inputFromSessions() builds
 * @param {{ catalog?: { id, domains, engine, group }[] }} [opts]
 *   the game catalogue, for "a game to play next"; without it only played games are suggested
 */
export function buildFindings(input, { catalog = [] } = {}) {
  const period = input?.period || periodsFor().period
  const previous = input?.previous || periodsFor({ days: period.days, to: period.to }).previous
  const curRows = input?.rows?.current || []
  const prevRows = input?.rows?.previous || []
  const all = [...prevRows, ...curRows]
  const bucketList = buckets({ period, previous })
  const ctx = { period, previous }

  const taskRowsCur = curRows.filter(countsForUnderstanding)
  const taskRowsPrev = prevRows.filter(countsForUnderstanding)
  const taskRowsAll = all.filter(countsForUnderstanding)
  const cur = aggregate(curRows)
  const prev = aggregate(prevRows)
  const taskCur = aggregate(taskRowsCur)
  const taskPrev = aggregate(taskRowsPrev)
  const isEnough = enough(taskCur)

  const playedGames = cur.games.concat(prev.games.filter((g) => !cur.games.includes(g)))
  const gameSlices = new Map()
  for (const r of all) if (r.gameId && !gameSlices.has(r.gameId)) gameSlices.set(r.gameId, { domain: primaryDomain(r), title: r.title })
  const suggest = (domain, mode) => suggestGame(domain, mode, { catalog, playedGames, gameSlices })

  const candidates = []
  const pending = []

  // ── understanding, per skill area (each round counts once, for its main skill) ──
  const domains = new Set(taskRowsAll.map(primaryDomain).filter(Boolean))
  for (const d of domains) {
    const rc = taskRowsCur.filter((r) => primaryDomain(r) === d)
    const rp = taskRowsPrev.filter((r) => primaryDomain(r) === d)
    const a = aggregate(rc)
    const b = aggregate(rp)
    if (!rc.length) continue
    if (!enough(a)) {
      pending.push({ domain: d, rounds: a.rounds, trials: a.trials, games: a.games })
      continue
    }
    const trend = trendOfPct(a, b, 'understoodPct')
    const harder = b.levelMedian != null && a.levelMedian != null && a.levelMedian > b.levelMedian
    const base = {
      measure: 'understanding',
      subject: { type: 'domain', id: d, games: a.games.slice(0, 3) },
      trend,
      value: { now: r0(a.understoodPct), before: enough(b) ? r0(b.understoodPct) : null, unit: '%' },
      evidence: evidenceOf(a, b, ctx),
      confidence: 'enough',
      notes: [
        ...(trend.dir == null ? ['noEarlierPeriod'] : []),
        ...(harder ? ['harderLevels'] : []),
      ],
      levels: { now: a.levelMedian, before: b.levelMedian },
      series: seriesOf(taskRowsAll.filter((r) => primaryDomain(r) === d), bucketList, 'understanding'),
      activity: d,
    }
    if (trend.dir === 'up') {
      candidates.push({ ...base, kind: 'gettingBetter', priority: 90 + Math.min(trend.delta, 40), next: suggest(d, 'stretch') })
    } else if (trend.dir === 'down' || a.understoodPct < RULES.practisePct) {
      // A dip right after moving up a level is expected, and it is said so.
      candidates.push({ ...base, kind: 'needsPractice', reason: trend.dir === 'down' ? 'dip' : 'level', priority: 70 + (RULES.practisePct - Math.min(a.understoodPct, RULES.practisePct)) / 4, next: suggest(d, 'practise') })
    } else if (a.understoodPct >= RULES.strongPct) {
      candidates.push({ ...base, kind: 'strength', priority: 60 + (a.understoodPct - RULES.strongPct), next: suggest(d, 'stretch') })
    }
  }

  // ── independence: turns done right with no highlight and no demonstration ──
  if (enough(taskCur)) {
    const trend = trendOfPct(taskCur, taskPrev, 'independentPct')
    const base = {
      kind: 'independence',
      measure: 'independence',
      subject: { type: 'overall', id: null, games: taskCur.games.slice(0, 3) },
      trend,
      value: { now: r0(taskCur.independentPct), before: enough(taskPrev) ? r0(taskPrev.independentPct) : null, unit: '%' },
      evidence: evidenceOf(taskCur, taskPrev, ctx),
      confidence: 'enough',
      notes: [
        ...(trend.dir == null ? ['noEarlierPeriod'] : []),
        ...(taskPrev.levelMedian != null && taskCur.levelMedian != null && taskCur.levelMedian > taskPrev.levelMedian ? ['harderLevels'] : []),
      ],
      levels: { now: taskCur.levelMedian, before: taskPrev.levelMedian },
      series: seriesOf(taskRowsAll, bucketList, 'independence'),
      activity: 'independence',
      next: null,
    }
    if (trend.dir === 'up') candidates.push({ ...base, variant: 'up', priority: 85 + Math.min(trend.delta, 30) })
    else if (trend.dir === 'down') candidates.push({ ...base, variant: 'down', priority: 55 })
    else if (taskCur.independentPct >= RULES.independentHighPct) candidates.push({ ...base, variant: 'high', priority: 58 })
  }

  // ── movement: reach directness and moving time, never mixed with understanding ──
  // Each is measured on the rounds that recorded it, and its evidence counts only those.
  {
    const has = (r) => r.pathEfficiency != null && r.trials > 0
    const a = aggregate(curRows.filter(has))
    const b = aggregate(prevRows.filter(has))
    const trend = trendOfDirectness(a, b)
    const hasLevel = a.directnessRounds >= RULES.minRounds && a.trials >= RULES.minTrials && a.directnessPct != null
    const base = {
      measure: 'directness',
      subject: { type: 'movement', id: 'directness', games: a.games.slice(0, 3) },
      trend,
      value: { now: r0(a.directnessPct), before: b.directnessRounds >= RULES.minRounds ? r0(b.directnessPct) : null, unit: '%' },
      evidence: evidenceOf(a, b, ctx),
      confidence: 'enough',
      notes: trend.dir == null ? ['noEarlierPeriod'] : [],
      series: seriesOf(all.filter(has), bucketList, 'directness'),
      activity: 'movement',
      next: null,
    }
    if (hasLevel) {
      if (trend.dir === 'up') candidates.push({ ...base, kind: 'gettingBetter', variant: 'up', priority: 80 + Math.min(trend.delta, 20) })
      else if (trend.dir === 'down') candidates.push({ ...base, kind: 'needsPractice', variant: 'down', priority: 50 })
      else if (a.directnessPct < RULES.directnessLowPct) candidates.push({ ...base, kind: 'needsPractice', variant: 'low', priority: 48 })
      else if (a.directnessPct >= RULES.directnessHighPct) candidates.push({ ...base, kind: 'strength', variant: 'high', priority: 45 })
    }
  }
  {
    const has = (r) => r.medianMovementMs != null && r.trials > 0
    const a = aggregate(curRows.filter(has))
    const b = aggregate(prevRows.filter(has))
    const trend = trendOfMovingTime(a, b)
    if (trend.better) {
      candidates.push({
        kind: 'gettingBetter',
        measure: 'movingTime',
        variant: 'quicker',
        subject: { type: 'movement', id: 'movingTime', games: a.games.slice(0, 3) },
        trend,
        value: { now: a.movingMs, before: b.movingMs, unit: 'ms' },
        evidence: evidenceOf(a, b, ctx),
        confidence: 'enough',
        notes: [],
        series: seriesOf(all.filter(has), bucketList, 'movingTime'),
        activity: 'movement',
        next: null,
        priority: 75,
      })
    }
  }

  // ── regular play (a fact, so it needs no minimum) ──
  if (cur.played) {
    const trend = trendOfDays(cur, prev)
    const weeksTotal = Math.max(1, Math.ceil(period.days / 7))
    const weeks = new Set(cur.dayList.map((d) => Math.floor(daysBetween(d, period.to) / 7))).size
    candidates.push({
      kind: 'consistency',
      measure: 'days',
      subject: { type: 'play', id: 'days', games: [] },
      trend,
      value: { now: cur.days, before: prev.played ? prev.days : null, unit: 'days', total: period.days, weeks, weeksTotal },
      evidence: evidenceOf(cur, prev, ctx),
      confidence: 'enough',
      notes: [],
      series: seriesOf(all, bucketList, 'days'),
      activity: 'consistency',
      next: null,
      priority: trend.dir === 'up' ? 52 : 30,
    })
  }

  // ── effort: trying again after a round that did not clear its level ──
  if (cur.played) {
    let retries = 0
    let toughRounds = 0
    const last = new Map()
    for (const r of curRows) {
      const before = last.get(r.gameId)
      if (before && before.levelCleared === false) retries++
      if (r.outcome === 'completed' && r.trials >= 3 && (r.comprehensionPct ?? 100) < RULES.practisePct) toughRounds++
      last.set(r.gameId, r)
    }
    const effortClears = curRows.filter((r) => r.clearedBy === 'effort').length
    candidates.push({
      kind: 'effort',
      measure: 'rounds',
      variant: retries > 0 ? 'retries' : toughRounds > 0 ? 'tough' : 'rounds',
      subject: { type: 'play', id: 'effort', games: [] },
      trend: { dir: null, better: null, delta: null, threshold: null },
      value: { now: cur.played, before: prev.played || null, unit: 'rounds', minutes: cur.minutes, retries, toughRounds, effortClears },
      evidence: evidenceOf(cur, prev, ctx),
      confidence: 'enough',
      notes: [],
      series: seriesOf(all, bucketList, 'rounds'),
      activity: 'effort',
      next: null,
      priority: retries > 0 ? 50 : 25,
    })
  }

  for (const c of candidates) c.id = `${c.kind}:${c.measure}:${c.subject.id ?? 'all'}`

  // ── choosing what each reader sees ──
  const byPriority = [...candidates].sort((a, b) => b.priority - a.priority)
  const notEnough = !isEnough
    ? {
        id: 'notEnough',
        kind: 'notEnough',
        measure: null,
        subject: { type: 'play', id: null, games: [] },
        trend: { dir: null, better: null, delta: null, threshold: null },
        value: { rounds: taskCur.rounds, trials: taskCur.trials, minRounds: RULES.minRounds, minTrials: RULES.minTrials },
        evidence: evidenceOf(taskCur, taskPrev, ctx),
        confidence: 'low',
        notes: [],
        series: [],
        activity: null,
        next: null,
        priority: 100,
      }
    : null

  const adult = pickAdult(byPriority, notEnough)
  const learner = pickLearner(byPriority, { notEnough, catalog, playedGames, isEnough })

  return {
    enough: isEnough,
    period,
    previous,
    totals: { current: cur, previous: prev, tasks: { current: taskCur, previous: taskPrev } },
    numbers: numbersOf({ cur, prev, taskCur, taskPrev, all, taskRowsAll, bucketList }),
    findings: adult,
    all: byPriority,
    pending: pending.sort((a, b) => b.trials - a.trials),
    learner,
    truncated: Boolean(input?.truncated),
  }
}

// Reading order for grown-ups: good news first, then where practice is worth
// spending, then habits. Within a kind, the stronger signal first.
const ADULT_ORDER = ['notEnough', 'gettingBetter', 'strength', 'independence', 'needsPractice', 'consistency', 'effort']
const KIND_CAP = { gettingBetter: 2, strength: 2, needsPractice: 2, independence: 1, consistency: 1, effort: 1 }

function pickAdult(sorted, notEnough) {
  const out = notEnough ? [notEnough] : []
  const perKind = {}
  for (const f of sorted) {
    if (out.length >= RULES.maxAdult) break
    if ((perKind[f.kind] || 0) >= (KIND_CAP[f.kind] ?? 1)) continue
    out.push(f)
    perKind[f.kind] = (perKind[f.kind] || 0) + 1
  }
  // "Worth more practice" is never crowded out by good news: an adult needs to
  // see where the next session is worth spending. It replaces the lowest-priority
  // habit finding (or, failing that, the last one picked).
  const firstPractice = sorted.find((f) => f.kind === 'needsPractice')
  if (firstPractice && !out.includes(firstPractice)) {
    let i = out.findLastIndex((f) => f.kind === 'effort' || f.kind === 'consistency')
    if (i < 0) i = out.length - 1
    out[i] = firstPractice
  }
  const rank = (f) => ADULT_ORDER.indexOf(f.kind)
  return out.sort((a, b) => rank(a) - rank(b) || b.priority - a.priority)
}

/**
 * For the learner: up to three things that got better (or are going well), one
 * next challenge, and their effort. Only good news and a challenge, never a
 * list of what went wrong.
 */
function pickLearner(sorted, { notEnough, catalog, playedGames, isEnough }) {
  const positive = (f) =>
    f.kind === 'gettingBetter' ||
    f.kind === 'strength' ||
    (f.kind === 'independence' && f.variant !== 'down') ||
    (f.kind === 'consistency' && f.value.now >= 2)
  const wins = sorted.filter(positive).slice(0, RULES.learnerWins)
  const effort = sorted.find((f) => f.kind === 'effort') || null

  // The challenge: the skill most worth practising, else the next step up from
  // the strongest one, else a game not played yet.
  let challenge = null
  const practise = sorted.find((f) => f.kind === 'needsPractice' && f.measure === 'understanding')
  const stretch = sorted.find((f) => (f.kind === 'strength' || f.kind === 'gettingBetter') && f.measure === 'understanding')
  if (practise?.next) challenge = { from: practise.id, domain: practise.subject.id, ...practise.next }
  else if (stretch?.next) challenge = { from: stretch.id, domain: stretch.subject.id, ...stretch.next }
  else {
    const fresh = catalog.find((g) => !NO_FINDINGS_ENGINES.has(g.engine) && !playedGames.includes(g.id))
    const again = playedGames.find(Boolean)
    if (!isEnough && again) challenge = { from: null, domain: null, gameId: again, mode: 'more' }
    else if (fresh) challenge = { from: null, domain: fresh.domains?.[0] || null, gameId: fresh.id, mode: 'new' }
    else if (again) challenge = { from: null, domain: null, gameId: again, mode: 'more' }
  }
  return { enough: isEnough, notEnough, wins, challenge, effort }
}

/** The headline numbers with their change, for "what each number means". */
function numbersOf({ cur, prev, taskCur, taskPrev, all, taskRowsAll, bucketList }) {
  const row = (key, now, before, trend, unit, series) => ({ key, now, before, trend, unit, series })
  return [
    row('understood', r0(taskCur.understoodPct), enough(taskPrev) ? r0(taskPrev.understoodPct) : null, trendOfPct(taskCur, taskPrev, 'understoodPct'), '%', seriesOf(taskRowsAll, bucketList, 'understanding')),
    row('onTheirOwn', r0(taskCur.independentPct), enough(taskPrev) ? r0(taskPrev.independentPct) : null, trendOfPct(taskCur, taskPrev, 'independentPct'), '%', seriesOf(taskRowsAll, bucketList, 'independence')),
    row('thinkingTime', taskCur.thinkingMs, taskPrev.thinkingRounds >= RULES.minRounds ? taskPrev.thinkingMs : null, { dir: null, better: null }, 'ms', seriesOf(taskRowsAll, bucketList, 'thinkingTime')),
    row('movingTime', cur.movingMs, prev.movingRounds >= RULES.minRounds ? prev.movingMs : null, trendOfMovingTime(cur, prev), 'ms', seriesOf(all, bucketList, 'movingTime')),
    row('directness', r0(cur.directnessPct), prev.directnessRounds >= RULES.minRounds ? r0(prev.directnessPct) : null, trendOfDirectness(cur, prev), '%', seriesOf(all, bucketList, 'directness')),
    row('daysPlayed', cur.days, prev.played ? prev.days : null, trendOfDays(cur, prev), 'days', seriesOf(all, bucketList, 'days')),
  ]
}

/** The activity pair (home / class) for a finding, if it has one. */
export function activityOf(finding) {
  return finding?.activity ? ACTIVITIES[finding.activity] || null : null
}
