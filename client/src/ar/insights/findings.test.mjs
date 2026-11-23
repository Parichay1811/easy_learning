// node --test client/src/ar/insights/findings.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  RULES, buildFindings, trendOfPct, aggregate, periodsFor, splitRows, rowFromSession, inputFromSessions, buckets, activityOf,
} from './findings.js'
import { TEXT, findingSentence, findingNotes, evidenceLine, nextSentence, pendingSentence, trendWords, allTextEntries, seriesWords } from './text.js'
import { ACTIVITIES } from './activities.js'

// A stand-in for i18next's t: no translations loaded, so the default (with {{params}}) is used.
const t = (key, o = {}) => {
  const d = (o.count === 1 && o.defaultValue_one) || o.defaultValue_other || o.defaultValue || key
  return String(d).replace(/\{\{(\w+)\}\}/g, (_, k) => (o[k] == null ? '' : String(o[k])))
}
const ctx = { t, skillName: (id) => `skill:${id}`, gameName: (id) => `game:${id}` }

const TO = '2026-11-23'
const { period, previous } = periodsFor({ days: 28, to: TO })
const day = (daysAgo) => {
  const d = new Date(`${TO}T10:00:00Z`)
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d.toISOString()
}

let seq = 0
// One round. `pct` is the share understood; `own` the share done with no help.
function round({ ago, gameId = 'memory-game', domains = ['workingMemory'], trials = 20, pct = 70, own = 50, eff = null, move = null, level = 2, cleared = null, clearedBy = null, engine = 'tap', outcome = 'completed' }) {
  const at = day(ago)
  const correct = Math.round((pct / 100) * trials)
  return {
    at: at.replace('10:00', `10:${String(seq++ % 60).padStart(2, '0')}`), day: at.slice(0, 10), gameId, engine, title: gameId, group: 'remember', domains, lifeSkill: null, outcome,
    activeMs: 120000, trials, correct, near: 0, accuracyPct: pct, comprehensionPct: pct, independentPct: own,
    medianLatencyMs: 900, medianMovementMs: move, pathEfficiency: eff, timingVariabilityMs: null, inhibitionPct: null, noGoTrials: 0,
    traceAccuracy: null, pauseCount: 0, promptStart: 'C', promptEnd: 'C', level, levelCleared: cleared, clearedBy,
  }
}
const input = (prevRows, curRows) => ({ period, previous, rows: { current: curRows, previous: prevRows } })
const range = (n, fn) => Array.from({ length: n }, (_, i) => fn(i))

test('periods: two equal, back-to-back windows ending on the given day', () => {
  assert.deepEqual(period, { from: '2026-10-27', to: '2026-11-23', days: 28 })
  assert.deepEqual(previous, { from: '2026-09-29', to: '2026-10-26', days: 28 })
  const split = splitRows([round({ ago: 0 }), round({ ago: 27 }), round({ ago: 28 }), round({ ago: 55 }), round({ ago: 56 })], { period, previous })
  assert.equal(split.current.length, 2)
  assert.equal(split.previous.length, 2) // 56 days ago is outside both
  // Weekly buckets: 4 + 4, oldest first, flagged current/previous.
  const b = buckets({ period, previous })
  assert.equal(b.length, 8)
  assert.equal(b[0].from, previous.from)
  assert.equal(b[7].to, period.to)
  assert.deepEqual(b.map((x) => x.current), [false, false, false, false, true, true, true, true])
})

test('nothing played: one honest "too early to tell" finding and nothing invented', () => {
  const r = buildFindings(input([], []))
  assert.equal(r.enough, false)
  assert.deepEqual(r.findings.map((f) => f.kind), ['notEnough'])
  assert.equal(r.learner.wins.length, 0)
  assert.match(findingSentence(r.findings[0], 'adult', ctx), /Not enough play yet to tell/)
  assert.match(findingSentence(r.findings[0], 'child', ctx), /few more rounds/)
})

test('below the minimum (2 rounds / 16 turns): no skill findings, says so, still counts the play', () => {
  const r = buildFindings(input([], [round({ ago: 1, trials: 8, pct: 100 }), round({ ago: 2, trials: 8, pct: 100 })]))
  assert.equal(r.enough, false)
  const kinds = r.findings.map((f) => f.kind)
  assert.equal(kinds[0], 'notEnough')
  assert.ok(!kinds.includes('strength') && !kinds.includes('gettingBetter'), 'no claim about a skill below the gate')
  assert.ok(kinds.includes('consistency') && kinds.includes('effort'), 'facts about play are still reported')
  assert.equal(r.pending[0].domain, 'workingMemory')
  assert.match(pendingSentence(r.pending, ctx), /Too early to tell: skill:workingMemory \(16 turns\)/)
})

test('a clear improvement is "getting better" with an up trend and the numbers behind it', () => {
  const prev = range(4, (i) => round({ ago: 30 + i * 5, pct: 50 }))
  const cur = range(5, (i) => round({ ago: 1 + i * 4, pct: 85 }))
  const r = buildFindings(input(prev, cur))
  const f = r.all.find((x) => x.kind === 'gettingBetter' && x.measure === 'understanding')
  assert.ok(f, 'found')
  assert.equal(f.subject.id, 'workingMemory')
  assert.equal(f.trend.dir, 'up')
  assert.equal(f.value.now, 85)
  assert.equal(f.value.before, 50)
  assert.equal(f.evidence.rounds, 5)
  assert.equal(f.evidence.trials, 100)
  assert.equal(f.evidence.prevRounds, 4)
  assert.match(findingSentence(f, 'adult', ctx), /skill:workingMemory: understood 85% of turns, up from 50%/)
  assert.equal(findingSentence(f, 'child', ctx), 'You got better at game:memory-game!')
  assert.equal(trendWords(f, ctx), 'up 35 points')
  assert.match(evidenceLine(f, ctx), /100 turns in 5 rounds, 2026-10-27 to 2026-11-23 · period before: 80 turns in 4 rounds/)
  assert.equal(r.learner.wins[0].id, f.id)
  // A sparkline series spans both periods.
  assert.equal(f.series.length, 8)
  assert.ok(f.series.some((p) => p.current && p.value === 85))
})

test('noise is not a trend: a 6-point change, or a big change on little data, is "flat"', () => {
  const small = buildFindings(input(range(5, (i) => round({ ago: 30 + i * 4, pct: 70 })), range(5, (i) => round({ ago: 1 + i * 4, pct: 76 }))))
  assert.ok(!small.all.some((f) => f.kind === 'gettingBetter' && f.measure === 'understanding'))
  // 12 points on 3 rounds a side: inside 1.65 standard errors, so flat.
  const a = aggregate(range(3, (i) => round({ ago: i + 1, pct: 72, trials: 7 })))
  const b = aggregate(range(3, (i) => round({ ago: 30 + i, pct: 60, trials: 7 })))
  const tr = trendOfPct(a, b, 'understoodPct')
  assert.equal(tr.dir, 'flat')
  assert.ok(tr.threshold > RULES.minDeltaPts)
  // Too little in the period before: no arrow at all, and the finding says so.
  const none = buildFindings(input([round({ ago: 40, pct: 20 })], range(4, (i) => round({ ago: 1 + i, pct: 92 }))))
  const s = none.all.find((f) => f.kind === 'strength')
  assert.equal(s.trend.dir, null)
  assert.ok(s.notes.includes('noEarlierPeriod'))
  assert.match(findingNotes(s, ctx).map((n) => n.text).join(' '), /Not enough play in the period before/)
  assert.equal(trendWords(s, ctx), 'nothing to compare with yet')
})

test('a dip after moving up a level is "worth more practice" and says the levels got harder', () => {
  const prev = range(5, (i) => round({ ago: 30 + i * 4, gameId: 'freeze', domains: ['inhibition'], pct: 85, level: 2 }))
  const cur = range(5, (i) => round({ ago: 1 + i * 4, gameId: 'freeze', domains: ['inhibition'], pct: 55, level: 3 }))
  const r = buildFindings(input(prev, cur))
  const f = r.findings.find((x) => x.kind === 'needsPractice')
  assert.ok(f)
  assert.equal(f.reason, 'dip')
  assert.equal(f.trend.dir, 'down')
  assert.match(findingSentence(f, 'adult', ctx), /dipped to 55% of turns understood, down from 85%/)
  assert.match(findingNotes(f, ctx).map((n) => n.text).join(' '), /levels got harder/)
  assert.equal(f.next.gameId, 'freeze')
  assert.equal(f.next.mode, 'practise')
  // The learner sees it only as a challenge, never as a list of what went wrong.
  assert.ok(!r.learner.wins.includes(f))
  assert.equal(r.learner.challenge.gameId, 'freeze')
  assert.match(nextSentence(r.learner.challenge, 'child', ctx), /Practise game:freeze/)
})

test('understanding and movement never mix: changing one leaves the other untouched', () => {
  const mk = (pct, eff, move) => [
    ...range(5, (i) => round({ ago: 30 + i * 4, pct: 50, eff: 0.55, move: 1600 })),
    ...range(5, (i) => round({ ago: 1 + i * 4, pct, eff, move })),
  ]
  const split = (rows) => splitRows(rows, { period, previous })
  const base = buildFindings({ period, previous, rows: split(mk(85, 0.8, 1100)) })
  const slowMover = buildFindings({ period, previous, rows: split(mk(85, 0.4, 2600)) })
  const lowUnderstanding = buildFindings({ period, previous, rows: split(mk(40, 0.8, 1100)) })
  const pick = (r, measure) => JSON.stringify(r.all.filter((f) => f.measure === measure).map((f) => [f.kind, f.value, f.trend]))
  // Same understanding, very different movement: identical understanding findings.
  assert.equal(pick(base, 'understanding'), pick(slowMover, 'understanding'))
  assert.equal(pick(base, 'independence'), pick(slowMover, 'independence'))
  // Same movement, very different understanding: identical movement findings.
  assert.equal(pick(base, 'directness'), pick(lowUnderstanding, 'directness'))
  assert.equal(pick(base, 'movingTime'), pick(lowUnderstanding, 'movingTime'))
  // And both kinds are there as separate findings.
  assert.ok(base.all.some((f) => f.measure === 'directness' && f.kind === 'gettingBetter'))
  assert.ok(base.all.some((f) => f.measure === 'movingTime' && f.kind === 'gettingBetter'))
  assert.ok(base.all.some((f) => f.measure === 'understanding' && f.kind === 'gettingBetter'))
  // Slower movement is never a "problem" on its own; less direct reaching is practice, framed as movement.
  assert.ok(!slowMover.all.some((f) => f.measure === 'movingTime'))
  const lowReach = slowMover.all.find((f) => f.measure === 'directness')
  assert.equal(lowReach.kind, 'needsPractice')
  assert.match(findingSentence(lowReach, 'adult', ctx), /^Movement: .*says nothing about understanding|^Movement: /)
})

test('the reach measurement (calibration) never counts as understanding', () => {
  const cal = range(6, (i) => round({ ago: 1 + i, gameId: 'setup-space', domains: ['reachAccuracy'], engine: 'calibration', pct: 0, trials: 5 }))
  const r = buildFindings(input([], cal))
  assert.ok(!r.all.some((f) => f.measure === 'understanding' && f.subject.id === 'reachAccuracy'))
  assert.equal(r.enough, false)
})

test('independence: more turns done without help is its own finding', () => {
  const prev = range(5, (i) => round({ ago: 30 + i * 4, pct: 80, own: 35 }))
  const cur = range(5, (i) => round({ ago: 1 + i * 4, pct: 80, own: 70 }))
  const r = buildFindings(input(prev, cur))
  const f = r.findings.find((x) => x.kind === 'independence')
  assert.equal(f.variant, 'up')
  assert.match(findingSentence(f, 'adult', ctx), /70% of turns needed no hint or demonstration, up from 35%/)
  assert.equal(findingSentence(f, 'child', ctx), 'You did more all by yourself!')
})

test('effort counts trying again after a round that did not clear', () => {
  const cur = [
    round({ ago: 6, gameId: 'g1', cleared: false, pct: 50 }),
    round({ ago: 5, gameId: 'g1', cleared: false, pct: 55 }),
    round({ ago: 4, gameId: 'g1', cleared: true, clearedBy: 'effort', pct: 62 }),
    round({ ago: 3, gameId: 'g2', cleared: true, pct: 90 }),
  ]
  const r = buildFindings(input([], cur))
  const f = r.all.find((x) => x.kind === 'effort')
  assert.equal(f.value.retries, 2)
  assert.equal(f.value.effortClears, 1)
  assert.match(findingSentence(f, 'adult', ctx), /played again 2 times after a round that did not clear its level\. 1 level opened through persistence\./)
  assert.equal(findingSentence(f, 'child', ctx), 'You kept trying, even when it was tricky!')
})

test('grown-ups get 3 to 6 findings, good news first, and "worth more practice" is never crowded out', () => {
  const doms = ['workingMemory', 'sequencing', 'visualDiscrimination', 'spatialConcepts', 'readingSymbol']
  const prev = doms.flatMap((d, k) => range(4, (i) => round({ ago: 30 + i * 5 + k, gameId: `g-${d}`, domains: [d], pct: 50, own: 30, eff: 0.55, move: 1700 })))
  const cur = doms.flatMap((d, k) => range(4, (i) => round({ ago: 1 + i * 5 + k, gameId: `g-${d}`, domains: [d], pct: d === 'readingSymbol' ? 35 : 90, own: 70, eff: 0.85, move: 1100 })))
  const r = buildFindings(input(prev, cur))
  assert.ok(r.findings.length >= RULES.minAdult && r.findings.length <= RULES.maxAdult)
  assert.ok(r.findings.some((f) => f.kind === 'needsPractice' && f.subject.id === 'readingSymbol'))
  assert.equal(r.findings[0].kind, 'gettingBetter')
  // The learner gets at most three wins, all of them good news.
  assert.ok(r.learner.wins.length <= RULES.learnerWins)
  assert.ok(r.learner.wins.every((f) => ['gettingBetter', 'strength', 'independence', 'consistency'].includes(f.kind)))
  assert.equal(r.learner.challenge.domain, 'readingSymbol')
})

test('a stretch suggestion prefers a game in the same skill that has not been played yet', () => {
  const catalog = [
    { id: 'memory-game', domains: ['workingMemory'], engine: 'tap' },
    { id: 'memory-two', domains: ['workingMemory', 'sequencing'], engine: 'sequence' },
    { id: 'setup-space', domains: ['workingMemory'], engine: 'calibration' },
  ]
  const r = buildFindings(input([], range(5, (i) => round({ ago: 1 + i, pct: 95 }))), { catalog })
  const f = r.all.find((x) => x.kind === 'strength')
  assert.deepEqual(f.next, { gameId: 'memory-two', mode: 'new' })
  assert.equal(nextSentence(f.next, 'adult', ctx), 'A new game to try: game:memory-two.')
})

test('every finding has a home and a class activity, and every activity has both', () => {
  const prev = range(5, (i) => round({ ago: 30 + i * 4, pct: 50, eff: 0.5, move: 1600 }))
  const cur = range(5, (i) => round({ ago: 1 + i * 4, pct: 85, eff: 0.85, move: 1000, own: 85 }))
  const r = buildFindings(input(prev, cur))
  for (const f of r.all) {
    const a = activityOf(f)
    assert.ok(a?.home?.text && a?.class?.text, `activity for ${f.id}`)
  }
  for (const [k, v] of Object.entries(ACTIVITIES)) assert.ok(v.home.key.endsWith(`${k}.home`) && v.class.text)
})

test('the words: process praise only, no diagnosis, no labels, no comparison with other children', () => {
  const words = JSON.stringify(allTextEntries()) + JSON.stringify(ACTIVITIES)
  for (const bad of [/diagnos/i, /disorder/i, /deficit/i, /impair/i, /\bsmart\b/i, /clever/i, /genius/i, /talent/i, /(is|are|falls?|fell) behind/i, /\bnormal\b/i, /average/i, /other (children|kids)/i, /\bpeers?\b/i, /\bweak/i, /\bfail/i, /\bpoor\b/i]) {
    assert.ok(!bad.test(words), `found ${bad}`)
  }
  // Every entry has a key under ar.findings and some English text.
  const all = allTextEntries()
  assert.ok(Object.keys(all).length > 60)
  for (const [k, v] of Object.entries(all)) {
    assert.ok(k.startsWith('ar.findings.'), k)
    assert.ok(typeof v === 'string' && v.length > 1, k)
  }
  assert.ok(TEXT.kind.needsPractice.text === 'Worth more practice')
  assert.equal(seriesWords([{ value: 55 }, { value: null }, { value: 80 }], '%', 'Understood', t), 'Understood, oldest first: 55%, no play, 80%.')
})

test('on-device sessions become the same rows, in the same periods', () => {
  const now = Date.parse(`${TO}T12:00:00Z`)
  const session = {
    clientSessionId: 'x', gameId: 'find-shape', engine: 'tap', title: 'Find the Shape', group: 'look', domains: ['visualDiscrimination'],
    startedAt: day(2), endedAt: day(2), activeMs: 90000, outcome: 'completed', level: 2, levelCleared: true, clearedBy: 'criterion',
    promptStageStart: 'B', promptStageEnd: 'C',
    summary: { trials: 12, correct: 9, near: 1, accuracyPct: 75, comprehensionPct: 83.3, independentPct: 58.3, medianLatencyMs: 800, medianMovementMs: 1200, pathEfficiency: 0.71, pauseCount: 1 },
    trials: [{ accuracy: 'correct' }],
  }
  const row = rowFromSession(session)
  assert.equal(row.day, day(2).slice(0, 10))
  assert.equal(row.trials, 12)
  assert.equal(row.correct, 9)
  assert.equal(row.pathEfficiency, 0.71)
  assert.ok(!('summary' in row) && !('trials' in row && Array.isArray(row.trials)))
  const inp = inputFromSessions([session], { days: 28, now })
  assert.equal(inp.rows.current.length, 1)
  assert.equal(inp.period.to, TO)
})

test('movement evidence counts only the rounds that measured movement', () => {
  const prev = [
    ...range(4, (i) => round({ ago: 30 + i * 4, gameId: 'catch', domains: ['bilateralCoordination'], eff: 0.55, move: 1600 })),
    ...range(6, (i) => round({ ago: 31 + i * 3, gameId: 'quiz', domains: ['workingMemory'] })),
  ]
  const cur = [
    ...range(4, (i) => round({ ago: 1 + i * 4, gameId: 'catch', domains: ['bilateralCoordination'], eff: 0.82, move: 1100 })),
    ...range(6, (i) => round({ ago: 2 + i * 3, gameId: 'quiz', domains: ['workingMemory'] })),
  ]
  const r = buildFindings(input(prev, cur))
  const reach = r.all.find((f) => f.measure === 'directness')
  assert.equal(reach.kind, 'gettingBetter')
  assert.equal(reach.evidence.rounds, 4)
  assert.equal(reach.evidence.prevRounds, 4)
  assert.deepEqual(reach.subject.games, ['catch'])
  const quick = r.all.find((f) => f.measure === 'movingTime')
  assert.equal(quick.evidence.rounds, 4)
})

test('a game title ending in "!" does not get a second full stop', () => {
  const named = { ...ctx, gameName: () => 'Pets Only!' }
  assert.equal(nextSentence({ gameId: 'x', mode: 'practise' }, 'adult', named), 'Keep practising Pets Only! A level lower is fine.')
  assert.equal(nextSentence({ gameId: 'x', mode: 'new' }, 'adult', named), 'A new game to try: Pets Only!')
})
