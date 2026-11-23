// "At a glance" insights for grown-ups, through the real routes:
//   GET /api/parent/children/:id/insights     a parent's OWN verified child only
//   GET /api/teacher/students/:id/insights    a student in one of MY groups only
//   GET /api/teacher/groups/:id/insights      one of MY groups only
// Learning is stored the way the engine and the analytics recorder store it (LearnerDay rows,
// SkillMastery rows); another school's learner has data too, and it must never leak.
const test = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const { start } = require('./harness')

let app
const oid = () => new mongoose.Types.ObjectId()
const ids = {}
const DAY = 86400000
const iso = (ago) => new Date(Date.now() - ago * DAY).toISOString().slice(0, 10)

test.before(async () => {
  app = await start()
  const { admin, superadmin, main } = app.db
  const orgA = oid(), orgB = oid()
  const tA = oid(), tA2 = oid(), tB = oid()
  const sA = oid(), sA2 = oid(), sB = oid()
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
    { _id: sA2, name: 'Ben Ito', email: 'ben@kids.test', orgId: orgA, batchIds: [gA], tutorIds: [], parentIds: [], status: 'active' },
    { _id: sB, name: 'Zed', email: 'zed@kids.test', orgId: orgB, batchIds: [gB], tutorIds: [], parentIds: [], status: 'active' },
  ])
  await admin.collection('batches').insertMany([
    { _id: gA, name: 'Year 3', orgId: orgA, tutorIds: [tA], directTutorIds: [tA], subjects: [], studentIds: [sA, sA2], status: 'active' },
    { _id: gA2, name: 'Year 6', orgId: orgA, tutorIds: [tA2], directTutorIds: [tA2], subjects: [], studentIds: [], status: 'active' },
    { _id: gB, name: 'B group', orgId: orgB, tutorIds: [tB], directTutorIds: [tB], subjects: [], studentIds: [sB], status: 'active' },
  ])
  const mum = oid(), stranger = oid(), ashaRow = oid(), zedRow = oid(), pendingRow = oid()
  await main.collection('parentaccounts').insertMany([
    { _id: mum, uid: 'p-mum', email: 'mum@family.test', name: 'Priya', plan: 'free' },
    { _id: stranger, uid: 'p-x', email: 'x@other.test', name: 'Stranger', plan: 'free' },
  ])
  const linked = { linkStatus: 'verified', verifiedBy: 'school', verifiedAt: new Date(), consentVersion: '2026-11', createdAt: new Date(), updatedAt: new Date() }
  await main.collection('children').insertMany([
    { _id: ashaRow, parentId: mum, name: 'Asha', age: 8, email: 'asha@kids.test', ...linked },
    { _id: zedRow, parentId: stranger, name: 'Zed', age: 9, email: 'zed@kids.test', ...linked },
    // A link that is not confirmed yet: no learning data through it.
    { _id: pendingRow, parentId: mum, name: 'Ben', age: 8, email: 'ben@kids.test', linkStatus: 'pending', createdAt: new Date(), updatedAt: new Date() },
  ])

  // Learning: Asha practised on 5 of the last 7 days and much less the week before; Ben and Asha
  // both find "Comparing numbers" tricky with the same mix-up; Zed (other school) has a secret skill.
  const days = []
  for (const ago of [0, 1, 2, 4, 5]) days.push({ email: 'asha@kids.test', date: iso(ago), answered: 12, correct: 10, firstTry: 10, hints: 1, minutes: 9 })
  for (const ago of [8, 10]) days.push({ email: 'asha@kids.test', date: iso(ago), answered: 15, correct: 9, firstTry: 6, hints: 6, minutes: 10 })
  for (const ago of [9, 11]) days.push({ email: 'ben@kids.test', date: iso(ago), answered: 10, correct: 6, firstTry: 5, hints: 2, minutes: 8 })
  days.push({ email: 'zed@kids.test', date: iso(1), answered: 30, correct: 29, firstTry: 29, hints: 0, minutes: 20 })
  await main.collection('learnerdays').insertMany(days)
  const mix = { text: 'picked the reversed symbol', count: 3, at: new Date(Date.now() - DAY), q: 'q-none', module: 'read', resolvedAt: null }
  const row = (email, o) => ({ email, subject: 'maths', name: '', level: 2, box: 0, due: null, supportStep: 1, rightItems: ['a'], lastAt: new Date(Date.now() - DAY), misconceptions: [], ...o })
  await main.collection('skillmasteries').insertMany([
    row('asha@kids.test', { skill: 'maths.compare-numbers', mastery: 0.3, attempts: 14, correct: 6, missesSinceSuccess: 2, misconceptions: [mix] }),
    row('asha@kids.test', { skill: 'maths.shapes', mastery: 0.92, attempts: 12, correct: 11, box: 3, due: new Date(Date.now() + 9 * DAY), rightItems: ['a', 'b', 'c'], masteredAt: new Date(Date.now() - 2 * DAY) }),
    row('ben@kids.test', { skill: 'maths.compare-numbers', mastery: 0.35, attempts: 10, correct: 4, misconceptions: [mix] }),
    row('zed@kids.test', { skill: 'maths.zed-secret-skill', name: 'Zed secret skill', mastery: 0.2, attempts: 10, correct: 2, misconceptions: [{ ...mix, text: 'zed-only mix-up' }] }),
  ])
  Object.assign(ids, {
    orgA: String(orgA), orgB: String(orgB), tA: String(tA), tA2: String(tA2), tB: String(tB), sA: String(sA), sA2: String(sA2), sB: String(sB),
    gA: String(gA), gA2: String(gA2), gB: String(gB), mum: String(mum), stranger: String(stranger), ashaRow: String(ashaRow), zedRow: String(zedRow), pendingRow: String(pendingRow),
  })
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
const noLeak = (body) => {
  const s = JSON.stringify(body)
  for (const bad of ['zed', 'Zed', 'secret']) assert.ok(!s.includes(bad), `no "${bad}" in the answer`)
}

test('parent: own verified child gets findings with evidence; nobody else can', async () => {
  const r = await app.call('GET', `/api/parent/children/${ids.ashaRow}/insights?days=7`, { token: P.mum() })
  assert.equal(r.status, 200, JSON.stringify(r.body))
  const ins = r.body.insights
  assert.equal(ins.period.days, 7)
  assert.ok(ins.findings.length >= 3 && ins.findings.length <= 5, 'three to five findings')
  for (const f of ins.findings) assert.ok(f.key && f.kind && Array.isArray(f.evidence), 'every finding is a key with its evidence')
  assert.ok(ins.findings.some((f) => f.kind === 'win' && f.key === 'mastered'))
  const p = ins.findings.find((f) => f.kind === 'practice')
  assert.equal(p.skill.id, 'maths.compare-numbers'); assert.equal(p.next.key, 'home.practise')
  assert.ok(!JSON.stringify(ins).includes('reversed symbol'), 'parents never get the technical mix-up text')
  assert.equal(ins.measures.activeDays.cur, 5)
  assert.ok(ins.skills.subjects.some((x) => x.subject === 'maths'))
  noLeak(r.body)

  const month = await app.call('GET', `/api/parent/children/${ids.ashaRow}/insights?days=28`, { token: P.mum() })
  assert.equal(month.body.insights.period.days, 28)

  const stranger = await app.call('GET', `/api/parent/children/${ids.ashaRow}/insights`, { token: P.stranger() })
  assert.ok([403, 404].includes(stranger.status), `a different parent: ${stranger.status}`)
  assert.equal(stranger.body.insights, undefined)
  const notMine = await app.call('GET', `/api/parent/children/${ids.zedRow}/insights`, { token: P.mum() })
  assert.ok([403, 404].includes(notMine.status), `another family's child: ${notMine.status}`)
  const pending = await app.call('GET', `/api/parent/children/${ids.pendingRow}/insights`, { token: P.mum() })
  assert.ok([403, 404].includes(pending.status), `an unconfirmed link: ${pending.status}`)
  const anon = await app.call('GET', `/api/parent/children/${ids.ashaRow}/insights`, {})
  assert.equal(anon.status, 401)
  const teacherToken = await app.call('GET', `/api/parent/children/${ids.ashaRow}/insights`, { token: T.a() })
  assert.equal(teacherToken.status, 401, 'a teacher token is not a parent token')
})

test('teacher student: my own student only (not a colleague, not another school)', async () => {
  const r = await app.call('GET', `/api/teacher/students/${ids.sA}/insights?days=7`, { token: T.a() })
  assert.equal(r.status, 200, JSON.stringify(r.body))
  const p = r.body.insights.findings.find((f) => f.kind === 'practice')
  assert.equal(p.next.key, 'class.practise')
  assert.ok(p.evidence.some((e) => e.key === 'mixupText' && e.params.text === 'picked the reversed symbol'), 'teachers see the mix-up in words')
  noLeak(r.body)

  const colleague = await app.call('GET', `/api/teacher/students/${ids.sA}/insights`, { token: T.a2() })
  assert.equal(colleague.status, 404)
  const otherSchool = await app.call('GET', `/api/teacher/students/${ids.sA}/insights`, { token: T.b() })
  assert.equal(otherSchool.status, 404)
  const theirOwn = await app.call('GET', `/api/teacher/students/${ids.sB}/insights`, { token: T.a() })
  assert.equal(theirOwn.status, 404, 'another school\'s student')
  const bad = await app.call('GET', '/api/teacher/students/not-an-id/insights', { token: T.a() })
  assert.equal(bad.status, 404)
  const parentToken = await app.call('GET', `/api/teacher/students/${ids.sA}/insights`, { token: P.mum() })
  assert.equal(parentToken.status, 401)
})

test('teacher group: my own group only; a hard skill shared by two students, in name order', async () => {
  const r = await app.call('GET', `/api/teacher/groups/${ids.gA}/insights?days=7`, { token: T.a() })
  assert.equal(r.status, 200, JSON.stringify(r.body))
  const g = r.body.insights
  assert.equal(g.students, 2); assert.equal(g.measures.active.cur, 1)
  assert.deepEqual(g.checkIns.map((c) => c.student.name), ['Ben Ito'], 'Ben did not practise in the last 7 days')
  assert.equal(g.hardSkills.length, 1)
  assert.deepEqual(g.hardSkills[0].students.map((x) => x.name), ['Asha Rao', 'Ben Ito'])
  assert.equal(g.hardSkills[0].mixup.text, 'picked the reversed symbol')
  assert.equal(g.hardSkills[0].mixup.students, 2)
  assert.equal(g.mixups.length, 0, 'named once, with the hard skill')
  noLeak(r.body)

  for (const [who, tok] of [['colleague', T.a2()], ['other school', T.b()]]) {
    const x = await app.call('GET', `/api/teacher/groups/${ids.gA}/insights`, { token: tok })
    assert.equal(x.status, 404, who)
  }
  const cross = await app.call('GET', `/api/teacher/groups/${ids.gB}/insights`, { token: T.a() })
  assert.equal(cross.status, 404)
})

test('a practice group from a hard skill is named after the skill; only students of my group join', async () => {
  await app.db.admin.collection('orgpolicies').insertOne({ orgId: new mongoose.Types.ObjectId(ids.orgA), teachersCreateGroups: true })
  const r = await app.call('POST', '/api/teacher/groups/suggested', { token: T.a(), body: { fromGroupId: ids.gA, studentIds: [ids.sA, ids.sA2, ids.sB], skill: 'maths.compare-numbers', subject: 'maths' } })
  assert.equal(r.status, 201, JSON.stringify(r.body))
  assert.match(r.body.group.name, /^Practice: Comparing numbers \(Year 3\)/)
  assert.equal(r.body.group.studentCount, 2, 'a student from another school is ignored')
  const unknown = await app.call('POST', '/api/teacher/groups/suggested', { token: T.a(), body: { fromGroupId: ids.gA, studentIds: [ids.sA], skill: '<script>' } })
  assert.equal(unknown.status, 201)
  assert.match(unknown.body.group.name, /^Practice: Extra practice/, 'an unknown skill id never becomes a name')
  const other = await app.call('POST', '/api/teacher/groups/suggested', { token: T.b(), body: { fromGroupId: ids.gA, studentIds: [ids.sA], skill: 'maths.compare-numbers' } })
  assert.ok([403, 404].includes(other.status), `another school cannot make a group from my group: ${other.status}`)
})
