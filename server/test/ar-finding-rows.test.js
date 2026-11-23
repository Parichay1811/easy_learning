// The compact camera-game rows (services/arFindingRows.js) and their periods, without a
// database. The client engine builds the same row from an on-device session
// (client/src/ar/insights/findings.js rowFromSession): the two shapes must not drift apart.
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')
const { compactRow, periods } = require('../services/arFindingRows')

const ENGINE = path.join(__dirname, '..', '..', 'client', 'src', 'ar', 'insights', 'findings.js')

const stored = {
  email: 'kid@x.test', gameId: 'find-shape', engine: 'tap', title: 'Find the Shape', group: 'look', domains: ['visualDiscrimination', 'x', 7],
  lifeSkill: 'instructions', startedAt: new Date('2026-11-20T09:30:00Z'), activeMs: 91000, outcome: 'completed',
  promptStageStart: 'B', promptStageEnd: 'C', level: 3, levelCleared: false, clearedBy: null,
  summary: { trials: 12, correct: 8, near: 2, accuracyPct: 66.7, comprehensionPct: 83.3, independentPct: 50, medianLatencyMs: 820, medianMovementMs: 1310, pathEfficiency: 0.74, pauseCount: 1, byHand: { left: { trials: 3 } } },
  trials: [{ accuracy: 'correct' }], device: { cores: 4 }, settingsSnapshot: { seated: true },
}

test('a stored round becomes a compact row: the summary numbers, nothing private or bulky', () => {
  const row = compactRow(stored)
  assert.equal(row.day, '2026-11-20')
  assert.equal(row.at, '2026-11-20T09:30:00.000Z')
  assert.deepEqual(row.domains, ['visualDiscrimination', 'x'])
  assert.equal(row.trials, 12)
  assert.equal(row.near, 2)
  assert.equal(row.pathEfficiency, 0.74)
  assert.equal(row.levelCleared, false)
  for (const k of ['email', 'summary', 'device', 'settingsSnapshot', 'events', 'profile']) assert.ok(!(k in row), k)
  assert.equal(typeof row.trials, 'number', 'trials is a count, never the turns')
  // Missing numbers stay null, never 0 (0 % would be a claim).
  const bare = compactRow({ gameId: 'g', startedAt: new Date('2026-01-01T00:00:00Z') })
  assert.equal(bare.comprehensionPct, null)
  assert.equal(bare.pathEfficiency, null)
  assert.equal(bare.trials, 0)
})

test('periods: an explicit range, or N days ending on a day, and the equal period before', () => {
  assert.deepEqual(periods({ from: '2026-11-01', to: '2026-11-30' }), {
    period: { from: '2026-11-01', to: '2026-11-30', days: 30 },
    previous: { from: '2026-10-02', to: '2026-10-31', days: 30 },
  })
  assert.deepEqual(periods({ to: '2026-11-23', days: 28 }).previous, { from: '2026-09-29', to: '2026-10-26', days: 28 })
  // Garbage in: a sane default, never an exception.
  const d = periods({ from: 'nope', to: 'also-nope', days: -4 })
  assert.equal(d.period.days, 28)
  assert.equal(periods({ to: '2026-11-23', days: 5000 }).period.days, 400)
})

test('the server row and the device row have exactly the same fields', { skip: !fs.existsSync(ENGINE) && 'client engine not in this checkout' }, async () => {
  const { rowFromSession } = await import(pathToFileURL(ENGINE).href)
  const fromServer = compactRow(stored)
  const fromDevice = rowFromSession({ ...stored, startedAt: stored.startedAt.toISOString() })
  assert.deepEqual(Object.keys(fromServer).sort(), Object.keys(fromDevice).sort())
  // Same numbers too (domains aside: the device keeps every string it was given).
  const { domains: _a, ...s } = fromServer
  const { domains: _b, ...c } = fromDevice
  assert.deepEqual(s, c)
})
