// Foundations end to end: learning events become analytics every role can read,
// each role sees only its own scope, plans and notifications work, forged identity fails.
const test = require('node:test')
const assert = require('node:assert/strict')
const { start } = require('./harness')

let app
let ids
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(new Date())

test.before(async () => {
  app = await start()
  const { admin: adminDb, main, superadmin } = app.db
  const oid = () => new (require('mongoose').Types.ObjectId)()
  const orgA = oid(), orgB = oid(), batchA = oid(), tutorA = oid(), tutorOther = oid(), parentId = oid(), otherParentId = oid()
  const Org = adminDb.collection('organizations'), Student = adminDb.collection('students'), Batch = adminDb.collection('batches')
  await Org.insertMany([{ _id: orgA, name: 'Sunrise', adminUid: 'a-1', kind: 'institute', status: 'approved' }, { _id: orgB, name: 'Other School', adminUid: 'a-2', kind: 'institute', status: 'approved' }])
  await superadmin.collection('organizations').insertMany([{ _id: oid(), name: 'Sunrise', adminOrgId: String(orgA), status: 'approved', subscriptionPlan: 'free' }])
  const saOrg = await superadmin.collection('organizations').findOne({ adminOrgId: String(orgA) })
  await Student.insertMany([
    { _id: oid(), name: 'Aanya', email: 'aanya@kids.test', orgId: orgA, batchIds: [batchA], status: 'active' },
    { _id: oid(), name: 'Ravi', email: 'ravi@kids.test', orgId: orgA, batchIds: [], status: 'active' },
    { _id: oid(), name: 'Zed', email: 'zed@kids.test', orgId: orgB, batchIds: [], status: 'active' },
  ])
  await Batch.insertOne({ _id: batchA, name: 'Year 5', orgId: orgA, tutorIds: [tutorA], directTutorIds: [], subjects: [], studentIds: [], status: 'active' })
  const aanya = await Student.findOne({ email: 'aanya@kids.test' })
  await main.collection('children').insertMany([
    { _id: oid(), parentId, name: 'Aanya', age: 9, email: 'aanya@kids.test', linkStatus: 'verified' },
    { _id: oid(), parentId, name: 'Ravi', age: 9, email: 'ravi@kids.test', linkStatus: 'pending' },
    { _id: oid(), parentId: otherParentId, name: 'Aanya?', age: 9, email: 'aanya@kids.test', linkStatus: 'pending' },
  ])
  ids = { orgA: String(orgA), orgB: String(orgB), batchA: String(batchA), tutorA: String(tutorA), tutorOther: String(tutorOther), parentId: String(parentId), otherParentId: String(otherParentId), saOrg: String(saOrg._id), aanyaId: String(aanya._id),
    childVerified: String((await main.collection('children').findOne({ name: 'Aanya', parentId })) ._id), childPending: String((await main.collection('children').findOne({ name: 'Ravi' }))._id), childOther: String((await main.collection('children').findOne({ name: 'Aanya?' }))._id) }
})
test.after(async () => { await app?.stop() })

test('a learner\'s answers and sessions become rollups, in their own timezone', async () => {
  const t = app.tokens.student('aanya@kids.test', 'Aanya')
  const h = { 'x-timezone': 'UTC' }
  for (let i = 0; i < 8; i++) {
    const r = await app.call('POST', '/api/dashboard/log-answer', { token: t, headers: h, body: { module: 'listen', subject: 'english', correct: i < 6, timeTaken: 4, question: `q${i}` } })
    assert.equal(r.status, 200)
  }
  await app.call('POST', '/api/dashboard/log-answer', { token: t, headers: h, body: { module: 'read', subject: 'maths', correct: false, timeTaken: 9 } })
  const s = await app.call('POST', '/api/dashboard/log-session', { token: t, headers: h, body: { module: 'listen', subject: 'english', durationMinutes: 12, xpEarned: 40 } })
  assert.equal(s.status, 200)
  const day = await app.db.main.collection('learnerdays').findOne({ email: 'aanya@kids.test', date: today })
  assert.equal(day.answered, 9)
  assert.equal(day.correct, 6)
  assert.equal(day.minutes, 12)
  assert.equal(day.byModuleSubject.listen_english.answered, 8)
  assert.equal(day.byModuleSubject.read_maths.correct, 0)
  assert.equal(day.timedCount, 9)
})

test('parent: verified child gets overview, matrix and timeline; pending and strangers are refused', async () => {
  const p = app.tokens.parent(ids.parentId)
  const ov = await app.call('GET', `/api/parent/children/${ids.childVerified}/analytics/overview?range=week`, { token: p })
  assert.equal(ov.status, 200)
  assert.equal(ov.body.totals.answered, 9)
  assert.equal(ov.body.totals.accuracy, 67)
  assert.equal(ov.body.totals.minutes, 12)
  assert.equal(ov.body.totals.activeDays, 1)
  assert.equal(ov.body.series.points.length, 7)
  assert.equal(ov.body.matrix.english.listen.answered, 8)
  assert.equal(ov.body.matrix.english.listen.mastery, 'practising') // 6 of 8 = 75 %
  assert.equal(ov.body.matrix.maths.read.mastery, 'not_started')
  assert.ok(typeof ov.body.story === 'string' && ov.body.story.includes('12 min'))
  assert.ok(Array.isArray(ov.body.insights))
  const tl = await app.call('GET', `/api/parent/children/${ids.childVerified}/analytics/timeline`, { token: p })
  assert.equal(tl.status, 200)
  assert.ok(tl.body.events.length >= 9)
  // pending link: no data at all
  const pend = await app.call('GET', `/api/parent/children/${ids.childPending}/analytics/overview`, { token: p })
  assert.equal(pend.status, 403)
  assert.equal(pend.body.code, 'LINK_NOT_VERIFIED')
  // another parent with a pending link to the same child, and an unauthenticated caller
  assert.equal((await app.call('GET', `/api/parent/children/${ids.childOther}/analytics/overview`, { token: app.tokens.parent(ids.otherParentId) })).status, 403)
  assert.equal((await app.call('GET', `/api/parent/children/${ids.childVerified}/analytics/overview`, { token: app.tokens.parent(ids.otherParentId) })).status, 404)
  assert.equal((await app.call('GET', `/api/parent/children/${ids.childVerified}/analytics/overview`)).status, 401)
})

test('comparison: previous period deltas and yesterday-vs-today ranges', async () => {
  const p = app.tokens.parent(ids.parentId)
  const r = await app.call('GET', `/api/parent/children/${ids.childVerified}/analytics/overview?from=${today}&to=${today}&cmp=prev`, { token: p })
  assert.equal(r.status, 200)
  assert.equal(r.body.range.days, 1)
  assert.equal(r.body.previous.minutes, 0)
  assert.equal(r.body.deltas.minutes, 12)
  const bad = await app.call('GET', `/api/parent/children/${ids.childVerified}/analytics/overview?from=2026-12-31&to=2026-01-01`, { token: p })
  assert.equal(bad.status, 400)
  const cal = await app.call('GET', `/api/parent/children/${ids.childVerified}/analytics/calendar?year=${today.slice(0, 4)}`, { token: p })
  assert.equal(cal.body.days.find((d) => d.date === today).minutes, 12)
})

test('teacher: sees only groups they teach and only those students', async () => {
  const mine = app.tokens.teacher(ids.tutorA, ids.orgA)
  const ok = await app.call('GET', `/api/teacher/batches/${ids.batchA}/analytics/overview`, { token: mine })
  assert.equal(ok.status, 200)
  assert.equal(ok.body.totals.learners, 1)
  const learners = await app.call('GET', `/api/teacher/batches/${ids.batchA}/analytics/learners`, { token: mine })
  assert.equal(learners.body.learners[0].name, 'Aanya')
  assert.equal((await app.call('GET', `/api/teacher/batches/${ids.batchA}/analytics/overview`, { token: app.tokens.teacher(ids.tutorOther, ids.orgA) })).status, 404)
  assert.equal((await app.call('GET', `/api/teacher/batches/${ids.batchA}/analytics/overview`, { token: app.tokens.teacher(ids.tutorA, ids.orgB) })).status, 404)
  assert.equal((await app.call('GET', `/api/teacher/students/${ids.aanyaId}/analytics/overview`, { token: mine })).status, 200)
})

test('admin: own school only; super admin: any school', async () => {
  const a = app.tokens.admin('1', ids.orgA, 'a-1')
  const school = await app.call('GET', '/api/admin/analytics/overview', { token: a })
  assert.equal(school.status, 200)
  assert.equal(school.body.totals.answered, 9)
  const rows = await app.call('GET', '/api/admin/analytics/learners', { token: a })
  assert.deepEqual(rows.body.learners.map((l) => l.name).sort(), ['Aanya', 'Ravi'])
  assert.equal(rows.body.learners.find((l) => l.name === 'Ravi').atRisk, true) // no learning in two weeks
  assert.equal(rows.body.learners.find((l) => l.name === 'Aanya').atRisk, false)
  // the other school's admin sees none of it
  const other = await app.call('GET', '/api/admin/analytics/overview', { token: app.tokens.admin('2', ids.orgB, 'a-2') })
  assert.equal(other.body.totals.answered, 0)
  assert.equal((await app.call('GET', `/api/admin/students/${ids.aanyaId}/analytics/overview`, { token: app.tokens.admin('2', ids.orgB, 'a-2') })).status, 404)
  const sa = await app.call('GET', `/api/superadmin/organizations/${ids.saOrg}/analytics/overview`, { token: app.tokens.superadmin() })
  assert.equal(sa.body.totals.answered, 9)
  assert.equal((await app.call('GET', `/api/superadmin/organizations/${ids.saOrg}/analytics/overview`, { token: a })).status, 401)
})

test('plans: modules per role, overrides, solo orgs, locked modules', async () => {
  const parent = await app.call('GET', '/api/entitlements', { token: app.tokens.parent(ids.parentId) })
  assert.equal(parent.body.plan, 'free')
  assert.ok(parent.body.modules.includes('family.link'))
  assert.ok(!parent.body.modules.includes('analytics.deep'))
  const school = await app.call('GET', '/api/entitlements', { token: app.tokens.admin('1', ids.orgA, 'a-1') })
  assert.equal(school.body.plan, 'institute')
  assert.ok(school.body.modules.includes('org.tree') && school.body.modules.includes('tests'))
  // super admin switches one module off for this school, another on
  await app.db.superadmin.collection('organizations').updateOne({ _id: new (require('mongoose').Types.ObjectId)(ids.saOrg) }, { $set: { featureOverrides: ['-qbank.share', 'sso'] } })
  const after = await app.call('GET', '/api/entitlements', { token: app.tokens.teacher(ids.tutorA, ids.orgA) })
  assert.ok(!after.body.modules.includes('qbank.share'))
  assert.ok(after.body.modules.includes('sso'))
  // a solo tutor
  const soloOrg = new (require('mongoose').Types.ObjectId)()
  await app.db.admin.collection('organizations').insertOne({ _id: soloOrg, name: 'Ms Rao Tutoring', adminUid: 'a-solo', kind: 'solo', status: 'approved' })
  const solo = await app.call('GET', '/api/entitlements', { token: app.tokens.admin('9', String(soloOrg), 'a-solo') })
  assert.equal(solo.body.plan, 'solo_free')
  assert.equal(solo.body.kind, 'solo')
  assert.ok(solo.body.modules.includes('tests') && !solo.body.modules.includes('org.tree'))
  assert.equal(solo.body.limits.students, 15)
  assert.equal((await app.call('GET', '/api/entitlements')).status, 401)
})

test('notifications: delivered to the right person only, mark read', async () => {
  const { notify } = { notify: null }
  const now = new Date()
  await app.db.main.collection('notifications').insertMany([
    { to: `parent:${ids.parentId}`, kind: 'test_assigned', title: 'New test', body: '', link: '', readAt: null, createdAt: now, updatedAt: now },
    { to: `parent:${ids.otherParentId}`, kind: 'test_assigned', title: 'Not yours', body: '', link: '', readAt: null, createdAt: now, updatedAt: now },
  ])
  const p = app.tokens.parent(ids.parentId)
  const list = await app.call('GET', '/api/notifications', { token: p })
  assert.equal(list.body.unread, 1)
  assert.equal(list.body.items[0].title, 'New test')
  await app.call('POST', `/api/notifications/${list.body.items[0]._id}/read`, { token: app.tokens.parent(ids.otherParentId) })
  assert.equal((await app.call('GET', '/api/notifications/unread-count', { token: p })).body.count, 1, "someone else can't mark mine read")
  await app.call('POST', '/api/notifications/read-all', { token: p })
  assert.equal((await app.call('GET', '/api/notifications/unread-count', { token: p })).body.count, 0)
  void notify
  // Students: a notice addressed by email reaches them whichever way they signed in.
  await app.db.main.collection('notifications').insertOne({ to: 'student:aanya@kids.test', kind: 'test_assigned', title: 'Fractions quiz', body: '', link: '', readAt: null, createdAt: now, updatedAt: now })
  const stu = await app.call('GET', '/api/notifications', { token: app.tokens.student('Aanya@kids.test', 'Aanya') })
  assert.equal(stu.status, 200)
  assert.ok(stu.body.items.some((n) => n.title === 'Fractions quiz'))
  assert.ok(!stu.body.items.some((n) => n.title === 'New test'), "a parent's notices are not a student's")
})

test('forged identity fails: unsigned cookie, body-only sign-in, wrong-secret token', async () => {
  const forgedCookie = `user_session=${encodeURIComponent(JSON.stringify({ uid: 'x', email: 'aanya@kids.test' }))}`
  assert.equal((await app.call('GET', '/api/dashboard/stats', { cookie: forgedCookie })).status, 401)
  assert.equal((await app.call('POST', '/api/dashboard/link-code', { cookie: forgedCookie })).status, 401)
  for (const route of ['/api/auth/session', '/api/parent/auth/google', '/api/teacher/auth/google', '/api/admin/auth/google']) {
    const r = await app.call('POST', route, { body: { uid: 'victim', email: 'aanya@kids.test', name: 'x' } })
    assert.equal(r.status, 400, route)
    assert.ok(!r.body.token, route)
  }
  assert.equal((await app.call('GET', '/api/parent/children', { token: app.tokens.student('aanya@kids.test') })).status, 401)
  assert.equal((await app.call('GET', '/api/admin/analytics/overview', { token: app.tokens.teacher(ids.tutorA, ids.orgA) })).status, 401)
})

test('learner link code end to end: make, parent enters, verified; code works once', async () => {
  const stu = app.tokens.student('ravi@kids.test', 'Ravi')
  const made = await app.call('POST', '/api/dashboard/link-code', { token: stu })
  assert.equal(made.status, 201)
  const p = app.tokens.parent(ids.parentId)
  const wrong = await app.call('POST', `/api/parent/children/${ids.childPending}/verify`, { token: p, body: { code: 'ZZZZZZ' } })
  assert.equal(wrong.status, 400)
  const ok = await app.call('POST', `/api/parent/children/${ids.childPending}/verify`, { token: p, body: { code: made.body.code.toLowerCase() } })
  assert.equal(ok.status, 200)
  assert.equal(ok.body.child.linkStatus, 'verified')
  assert.equal((await app.call('GET', `/api/parent/children/${ids.childPending}/analytics/overview`, { token: p })).status, 200)
  // the same code cannot link a second parent
  const second = await app.call('POST', `/api/parent/children/${ids.childOther}/verify`, { token: app.tokens.parent(ids.otherParentId), body: { code: made.body.code } })
  assert.equal(second.status, 400)
  // a code made for Ravi cannot verify a link to Aanya
  const mine = await app.call('POST', '/api/dashboard/link-code', { token: stu })
  const cross = await app.call('POST', `/api/parent/children/${ids.childOther}/verify`, { token: app.tokens.parent(ids.otherParentId), body: { code: mine.body.code } })
  assert.equal(cross.status, 400)
})
