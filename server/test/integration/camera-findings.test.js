// Camera-game findings for the three audiences: the learner (GET /api/ar/insights?findings=),
// the parent (GET /api/parent/children/:id/analytics/ar) and the teacher (GET
// /api/teacher/students/:id/profile → cameraGames). The rows are uploaded through the real
// API, and every route keeps its own access check: a teacher only sees students in their
// own groups, a parent only their own verified child. The rows are then fed to the client's
// findings engine (the single source of truth) to check the teacher really gets findings.
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')
const mongoose = require('mongoose')
const { start } = require('./harness')

let app
const oid = () => new mongoose.Types.ObjectId()
const ids = {}
const DAY = 86400000
const ENGINE = path.join(__dirname, '..', '..', '..', 'client', 'src', 'ar', 'insights', 'findings.js')

// One uploaded round, `ago` days back, understood `pct` % of `trials` turns.
let seq = 0
function round({ ago, gameId = 'memory-match', domains = ['workingMemory'], pct = 60, own = 40, trials = 20, eff = 0.7, level = 2, cleared = null }) {
  const at = new Date(Date.now() - ago * DAY - 3600_000)
  const correct = Math.round((pct / 100) * trials)
  return {
    clientSessionId: `cam-${seq++}-${ago}`,
    gameId, engine: 'tap', title: gameId, group: 'remember', domains,
    startedAt: at.toISOString(), endedAt: new Date(at.getTime() + 120_000).toISOString(),
    durationMs: 120_000, activeMs: 115_000, outcome: 'completed', level, levelCleared: cleared, clearedBy: cleared ? 'criterion' : null,
    summary: { trials, correct, near: 0, accuracyPct: pct, comprehensionPct: pct, independentPct: own, medianLatencyMs: 900, medianMovementMs: 1200, pathEfficiency: eff },
    trials: [{ accuracy: 'correct', latencyMs: 900 }],
  }
}

test.before(async () => {
  app = await start()
  const { admin, superadmin, main } = app.db
  const orgA = oid(), orgB = oid()
  const tA = oid(), tA2 = oid(), tB = oid()
  const sA = oid(), sB = oid()
  const gA = oid(), gA2 = oid(), gB = oid()
  await admin.collection('organizations').insertMany([
    { _id: orgA, name: 'Sunrise School', kind: 'institute', status: 'approved', adminUid: 'adm-a', adminEmail: 'head@a.test' },
    { _id: orgB, name: 'Other School', kind: 'institute', status: 'approved', adminUid: 'adm-b', adminEmail: 'head@b.test' },
  ])
  await superadmin.collection('organizations').insertMany([
    { _id: oid(), name: 'Sunrise School', adminOrgId: String(orgA), status: 'approved', subscriptionPlan: 'free', kind: 'institute' },
    { _id: oid(), name: 'Other School', adminOrgId: String(orgB), status: 'approved', subscriptionPlan: 'free', kind: 'institute' },
  ])
  await admin.collection('tutors').insertMany([
    { _id: tA, name: 'Ms A', email: 'a@a.test', orgId: orgA, uid: 'g-a', authStatus: 'active', status: 'active', batchIds: [], studentIds: [], subjectIds: [] },
    { _id: tA2, name: 'Mr A2', email: 'a2@a.test', orgId: orgA, uid: 'g-a2', authStatus: 'active', status: 'active', batchIds: [], studentIds: [], subjectIds: [] },
    { _id: tB, name: 'Ms B', email: 'b@b.test', orgId: orgB, uid: 'g-b', authStatus: 'active', status: 'active', batchIds: [], studentIds: [], subjectIds: [] },
  ])
  await admin.collection('students').insertMany([
    { _id: sA, name: 'Asha Rao', email: 'Asha@Kids.test', orgId: orgA, batchIds: [gA], tutorIds: [], parentIds: [], status: 'active' },
    { _id: sB, name: 'Zed', email: 'zed@kids.test', orgId: orgB, batchIds: [gB], tutorIds: [], parentIds: [], status: 'active' },
  ])
  await admin.collection('batches').insertMany([
    { _id: gA, name: 'Year 3', orgId: orgA, tutorIds: [tA], directTutorIds: [tA], subjects: [], studentIds: [sA], status: 'active' },
    // A colleague's group in the same school, without Asha.
    { _id: gA2, name: 'Year 6', orgId: orgA, tutorIds: [tA2], directTutorIds: [tA2], subjects: [], studentIds: [], status: 'active' },
    { _id: gB, name: 'B group', orgId: orgB, tutorIds: [tB], directTutorIds: [tB], subjects: [], studentIds: [sB], status: 'active' },
  ])
  // Parents: mum is linked (verified) to Asha; a stranger is linked to Zed only.
  const mum = oid(), stranger = oid(), ashaRow = oid(), zedRow = oid()
  await main.collection('parentaccounts').insertMany([
    { _id: mum, uid: 'p-mum', email: 'mum@family.test', name: 'Priya', plan: 'free' },
    { _id: stranger, uid: 'p-x', email: 'x@other.test', name: 'Stranger', plan: 'free' },
  ])
  const linked = { linkStatus: 'verified', verifiedBy: 'school', verifiedAt: new Date(), consentVersion: '2026-11', createdAt: new Date(), updatedAt: new Date() }
  await main.collection('children').insertMany([
    { _id: ashaRow, parentId: mum, name: 'Asha', age: 8, email: 'asha@kids.test', ...linked },
    { _id: zedRow, parentId: stranger, name: 'Zed', age: 9, email: 'zed@kids.test', ...linked },
  ])
  Object.assign(ids, {
    orgA: String(orgA), orgB: String(orgB), tA: String(tA), tA2: String(tA2), tB: String(tB), sA: String(sA), sB: String(sB),
    mum: String(mum), stranger: String(stranger), ashaRow: String(ashaRow), zedRow: String(zedRow),
  })

  // Asha's rounds, uploaded by Asha: working memory 50 % four weeks ago → 85 % now,
  // a dip in "stopping and waiting" after a level up, and reaches getting more direct.
  const asha = app.tokens.student('asha@kids.test', 'Asha')
  const before = [
    ...[30, 34, 38, 42, 46].map((ago) => round({ ago, pct: 50, own: 30, eff: 0.6 })),
    ...[31, 36, 41, 47].map((ago) => round({ ago, gameId: 'freeze-dance', domains: ['inhibition'], pct: 85, own: 70, eff: 0.6, level: 2 })),
  ]
  const now = [
    ...[1, 4, 8, 12, 16, 20].map((ago) => round({ ago, pct: 85, own: 70, eff: 0.82 })),
    ...[2, 6, 11, 18].map((ago) => round({ ago, gameId: 'freeze-dance', domains: ['inhibition'], pct: 55, own: 50, eff: 0.8, level: 3 })),
  ]
  const r = await app.call('POST', '/api/ar/sessions', { token: asha, body: { sessions: [...before, ...now] } })
  assert.equal(r.status, 200, JSON.stringify(r.body))
  assert.equal(r.body.saved, before.length + now.length)
  ids.ashaRounds = { before: before.length, now: now.length }

  // Zed (another school) has his own rounds; none of them may ever show up for Asha.
  const zed = app.tokens.student('zed@kids.test', 'Zed')
  const z = await app.call('POST', '/api/ar/sessions', { token: zed, body: { sessions: [3, 5, 9].map((ago) => round({ ago, gameId: 'zed-only-game' })) } })
  assert.equal(z.body.saved, 3)
})
test.after(async () => { await app?.stop() })

const T = {
  a: () => app.tokens.teacher(ids.tA, ids.orgA, 'a@a.test'),
  a2: () => app.tokens.teacher(ids.tA2, ids.orgA, 'a2@a.test'),
  b: () => app.tokens.teacher(ids.tB, ids.orgB, 'b@b.test'),
}
const P = {
  mum: () => app.tokens.parent(ids.mum, 'mum@family.test'),
  stranger: () => app.tokens.parent(ids.stranger, 'x@other.test'),
}

function assertRowShape(row) {
  for (const k of ['at', 'day', 'gameId', 'domains', 'trials', 'correct', 'comprehensionPct', 'independentPct', 'pathEfficiency', 'medianMovementMs', 'level']) {
    assert.ok(k in row, `row has ${k}`)
  }
  // A row is a round's summary: never its turns, its device or its settings.
  for (const k of ['events', 'device', 'settingsSnapshot', 'profile', 'email', 'summary']) assert.ok(!(k in row), `row has no ${k}`)
  assert.equal(typeof row.trials, 'number')
}

test('learner: /ar/insights adds this period and the one before only when asked (additive)', async () => {
  const asha = app.tokens.student('asha@kids.test', 'Asha')
  const plain = await app.call('GET', '/api/ar/insights?days=30', { token: asha })
  assert.equal(plain.status, 200)
  assert.equal(plain.body.data.findings, undefined, 'existing callers get the same payload')
  assert.ok(plain.body.data.overall.trials > 0)

  const r = await app.call('GET', '/api/ar/insights?days=30&findings=28', { token: asha })
  const f = r.body.data.findings
  assert.equal(f.period.days, 28)
  assert.equal(f.previous.days, 28)
  assert.equal(f.previous.to < f.period.from, true)
  assert.equal(f.rows.current.length, ids.ashaRounds.now)
  assert.equal(f.rows.previous.length, ids.ashaRounds.before)
  f.rows.current.forEach(assertRowShape)
  // Oldest first, inside the period.
  const days = f.rows.current.map((x) => x.day)
  assert.deepEqual([...days].sort(), days)
  assert.ok(days.every((d) => d >= f.period.from && d <= f.period.to))
})

test('teacher of the class: the student profile carries camera-game rows for both periods', async () => {
  const r = await app.call('GET', `/api/teacher/students/${ids.sA}/profile`, { token: T.a() })
  assert.equal(r.status, 200, JSON.stringify(r.body))
  const cg = r.body.cameraGames
  assert.ok(cg, 'cameraGames present')
  assert.equal(cg.period.days, 28)
  assert.equal(cg.rows.current.length, ids.ashaRounds.now)
  assert.equal(cg.rows.previous.length, ids.ashaRounds.before)
  cg.rows.current.forEach(assertRowShape)
  assert.ok(!JSON.stringify(cg).includes('zed-only-game'), 'only this student’s rounds')
  // Everything the profile had before is still there.
  assert.equal(r.body.student.name, 'Asha Rao')
  assert.ok(Array.isArray(r.body.notes))

  const short = await app.call('GET', `/api/teacher/students/${ids.sA}/profile?arDays=14`, { token: T.a() })
  assert.equal(short.body.cameraGames.period.days, 14)
  const clamped = await app.call('GET', `/api/teacher/students/${ids.sA}/profile?arDays=9999`, { token: T.a() })
  assert.equal(clamped.body.cameraGames.period.days, 120)
})

test('teachers outside the class get nothing: same school other group, and another school', async () => {
  const colleague = await app.call('GET', `/api/teacher/students/${ids.sA}/profile`, { token: T.a2() })
  assert.equal(colleague.status, 404)
  assert.equal(colleague.body.cameraGames, undefined)
  const otherSchool = await app.call('GET', `/api/teacher/students/${ids.sA}/profile`, { token: T.b() })
  assert.ok([403, 404].includes(otherSchool.status), String(otherSchool.status))
  assert.equal(otherSchool.body.cameraGames, undefined)
  // Their own student works, and holds only that student's rounds.
  const own = await app.call('GET', `/api/teacher/students/${ids.sB}/profile`, { token: T.b() })
  assert.equal(own.status, 200)
  assert.equal(own.body.cameraGames.rows.current.length, 3)
  assert.ok(own.body.cameraGames.rows.current.every((x) => x.gameId === 'zed-only-game'))
})

test('parent: only their own linked child, for the picked period and the one before', async () => {
  const to = new Date().toISOString().slice(0, 10)
  const from = new Date(Date.now() - 27 * DAY).toISOString().slice(0, 10)
  const r = await app.call('GET', `/api/parent/children/${ids.ashaRow}/analytics/ar?from=${from}&to=${to}`, { token: P.mum() })
  assert.equal(r.status, 200, JSON.stringify(r.body))
  const f = r.body.findings
  assert.equal(f.period.from, from)
  assert.equal(f.period.to, to)
  assert.equal(f.period.days, 28)
  assert.equal(f.rows.current.length, ids.ashaRounds.now)
  assert.equal(f.rows.previous.length, ids.ashaRounds.before)
  // The existing summary is still there.
  assert.equal(r.body.sessions, ids.ashaRounds.now)
  assert.ok(/not a medical/i.test(r.body.disclaimer))

  const notMine = await app.call('GET', `/api/parent/children/${ids.zedRow}/analytics/ar`, { token: P.mum() })
  assert.ok([403, 404].includes(notMine.status), String(notMine.status))
  assert.equal(notMine.body.findings, undefined)
  const stranger = await app.call('GET', `/api/parent/children/${ids.ashaRow}/analytics/ar`, { token: P.stranger() })
  assert.ok([403, 404].includes(stranger.status), String(stranger.status))
  assert.equal(stranger.body.findings, undefined)
})

test('the teacher’s rows give real findings in the shared engine (and keep understanding and movement apart)', { skip: !fs.existsSync(ENGINE) && 'client engine not in this checkout' }, async () => {
  const { buildFindings } = await import(pathToFileURL(ENGINE).href)
  const r = await app.call('GET', `/api/teacher/students/${ids.sA}/profile`, { token: T.a() })
  const out = buildFindings(r.body.cameraGames)
  assert.equal(out.enough, true)
  const better = out.findings.find((f) => f.kind === 'gettingBetter' && f.measure === 'understanding')
  assert.equal(better?.subject.id, 'workingMemory')
  assert.equal(better.trend.dir, 'up')
  const practise = out.findings.find((f) => f.kind === 'needsPractice')
  assert.equal(practise?.subject.id, 'inhibition')
  assert.ok(practise.notes.includes('harderLevels'))
  const movement = out.all.find((f) => f.measure === 'directness')
  assert.equal(movement?.kind, 'gettingBetter')
  assert.ok(out.findings.length >= 3 && out.findings.length <= 6)
})
