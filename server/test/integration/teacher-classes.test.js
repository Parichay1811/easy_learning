// Teacher classes and performance end to end (TCH-001/003, TCH-010..013, TCH-050..056, TCH-080..082):
// Solo signup, workspace switching, groups with plan limits and school policy, adding students
// (join code, roster import, move/copy), inviting parents, Today/heatmap/summary, private notes,
// and that no teacher reaches another teacher's private groups or another school's data.
const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

// Sign-in tokens the server will accept: our own certificate, test mode only.
const key = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
process.env.FIREBASE_PROJECT_ID = 'learningo-c9ac4'
process.env.FIREBASE_TEST_CERTS = JSON.stringify({ kidT: key.publicKey.export({ type: 'spki', format: 'pem' }) })
const idToken = (email, uid, extra = {}) => jwt.sign({ email, email_verified: true, name: extra.name || 'Teacher Person', ...extra }, key.privateKey, {
  algorithm: 'RS256', keyid: 'kidT', audience: 'learningo-c9ac4', issuer: 'https://securetoken.google.com/learningo-c9ac4', subject: uid, expiresIn: '1h',
})

const { start } = require('./harness')

let app
const oid = () => new mongoose.Types.ObjectId()
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(new Date())
const decode = (t) => jwt.decode(t)
const ids = {}

test.before(async () => {
  app = await start()
  const { admin, superadmin } = app.db
  const orgA = oid(), orgB = oid()
  const tA1 = oid(), tA2 = oid(), tB = oid(), dual = oid()
  const sA = oid(), sA2 = oid(), sB = oid()
  const assigned = oid(), bGroup = oid()
  await admin.collection('organizations').insertMany([
    { _id: orgA, name: 'Sunrise School', kind: 'institute', status: 'approved', adminUid: 'adm-a', adminEmail: 'head@a.test' },
    { _id: orgB, name: 'Other School', kind: 'institute', status: 'approved', adminUid: 'adm-b', adminEmail: 'head@b.test' },
  ])
  await superadmin.collection('organizations').insertMany([
    { _id: oid(), name: 'Sunrise School', adminOrgId: String(orgA), status: 'approved', subscriptionPlan: 'free', kind: 'institute' },
    { _id: oid(), name: 'Other School', adminOrgId: String(orgB), status: 'approved', subscriptionPlan: 'free', kind: 'institute' },
  ])
  await admin.collection('tutors').insertMany([
    { _id: tA1, name: 'Ms A1', email: 'a1@a.test', orgId: orgA, uid: 'g-a1', authStatus: 'active', status: 'active', batchIds: [], studentIds: [], subjectIds: [] },
    { _id: tA2, name: 'Mr A2', email: 'a2@a.test', orgId: orgA, uid: 'g-a2', authStatus: 'active', status: 'active', batchIds: [], studentIds: [], subjectIds: [] },
    { _id: tB, name: 'Ms B', email: 'b@b.test', orgId: orgB, uid: 'g-b', authStatus: 'active', status: 'active', batchIds: [], studentIds: [], subjectIds: [] },
    // Teaches at school A by day; signs up as a Solo tutor below.
    { _id: dual, name: 'Dual Person', email: 'dual@x.test', orgId: orgA, uid: 'g-dual', authStatus: 'active', status: 'active', batchIds: [], studentIds: [], subjectIds: [], lastLoginAt: new Date(Date.now() - 86400000) },
  ])
  await admin.collection('students').insertMany([
    { _id: sA, name: 'Asha', email: 'asha@kids.test', orgId: orgA, batchIds: [assigned], tutorIds: [], parentIds: [], status: 'active' },
    { _id: sA2, name: 'Bo', email: 'bo@kids.test', orgId: orgA, batchIds: [], tutorIds: [], parentIds: [], status: 'active' },
    { _id: sB, name: 'Zed', email: 'zed@kids.test', orgId: orgB, batchIds: [bGroup], tutorIds: [], parentIds: [], status: 'active' },
  ])
  await admin.collection('batches').insertMany([
    { _id: assigned, name: 'Year 5 (admin made)', orgId: orgA, tutorIds: [tA1], directTutorIds: [tA1], subjects: [], studentIds: [sA], status: 'active' },
    { _id: bGroup, name: 'B group', orgId: orgB, tutorIds: [tB], directTutorIds: [tB], subjects: [], studentIds: [sB], status: 'active' },
  ])
  // Production databases still carry the old globally-unique uid index; the server drops it.
  await admin.collection('tutors').createIndex({ uid: 1 }, { unique: true, name: 'uid_1', partialFilterExpression: { uid: { $type: 'string', $gt: '' } } })
  // A school admin who also tutors privately.
  await admin.collection('orgadmins').insertOne({ _id: oid(), uid: 'adm-a', email: 'head@a.test', name: 'Head', orgId: orgA, role: 'org_admin' })
  Object.assign(ids, { orgA: String(orgA), orgB: String(orgB), tA1: String(tA1), tA2: String(tA2), tB: String(tB), dual: String(dual), sA: String(sA), sA2: String(sA2), sB: String(sB), assigned: String(assigned), bGroup: String(bGroup) })
})
test.after(async () => { await app?.stop() })

const T = {
  a1: () => app.tokens.teacher(ids.tA1, ids.orgA, 'a1@a.test'),
  a2: () => app.tokens.teacher(ids.tA2, ids.orgA, 'a2@a.test'),
  b: () => app.tokens.teacher(ids.tB, ids.orgB, 'b@b.test'),
}
let solo // { token, orgId, tutorId }

test('solo signup: verified token only; creates both org copies, admin, tutor, subjects; idempotent', async () => {
  const forged = await app.call('POST', '/api/teacher/auth/solo', { body: { email: 'rao@tutor.test', name: 'x' } })
  assert.equal(forged.status, 400)
  const unverified = await app.call('POST', '/api/teacher/auth/solo', { body: { idToken: idToken('rao@tutor.test', 'g-rao', { email_verified: false }) } })
  assert.equal(unverified.status, 403)

  const r = await app.call('POST', '/api/teacher/auth/solo', { body: { idToken: idToken('Rao@Tutor.test', 'g-rao', { name: 'Ms Rao' }), workspaceName: 'Rao Tutoring', subjects: ['Maths', 'Piano'], grades: ['Year 4', 'Year 5'], country: 'Ireland' } })
  assert.equal(r.status, 201, JSON.stringify(r.body))
  assert.equal(r.body.created, true)
  const p = decode(r.body.token)
  assert.equal(p.role, 'teacher')
  assert.equal(p.email, 'rao@tutor.test')
  assert.ok(r.body.adminToken)
  assert.equal(decode(r.body.adminToken).role, 'org_admin')
  assert.equal(String(decode(r.body.adminToken).orgId), String(p.orgId))

  const org = await app.db.admin.collection('organizations').findOne({ _id: new mongoose.Types.ObjectId(p.orgId) })
  assert.equal(org.kind, 'solo')
  assert.equal(org.status, 'approved')
  assert.equal(org.name, 'Rao Tutoring')
  const sa = await app.db.superadmin.collection('organizations').findOne({ adminOrgId: String(p.orgId) })
  assert.equal(sa.plan, 'solo_free')
  assert.equal(sa.kind, 'solo')
  assert.equal(sa.status, 'approved')
  const subjects = await app.db.admin.collection('subjects').find({ orgId: org._id }).toArray()
  assert.deepEqual(subjects.map((s) => s.name).sort(), ['English', 'Maths', 'Piano', 'Science'])
  const tutor = await app.db.admin.collection('tutors').findOne({ orgId: org._id })
  assert.equal(tutor.uid, 'g-rao')
  assert.ok(await app.db.admin.collection('orgadmins').findOne({ email: 'rao@tutor.test', orgId: org._id }))

  // Same person again: same workspace, nothing new.
  const again = await app.call('POST', '/api/teacher/auth/solo', { body: { idToken: idToken('rao@tutor.test', 'g-rao') } })
  assert.equal(again.status, 200)
  assert.equal(again.body.created, false)
  assert.equal(String(decode(again.body.token).orgId), String(p.orgId))
  assert.equal(await app.db.admin.collection('organizations').countDocuments({ adminEmail: 'rao@tutor.test' }), 1)

  // Plans: Solo Free with limits.
  const ent = await app.call('GET', '/api/entitlements', { token: r.body.token })
  assert.equal(ent.body.plan, 'solo_free')
  assert.deepEqual(ent.body.limits, { groups: 1, students: 15 })
  solo = { token: r.body.token, orgId: String(p.orgId), tutorId: String(p.id) }
})

test('teacher sign-in: friendlier 404, workspace list and switching for a school + Solo teacher', async () => {
  const none = await app.call('POST', '/api/teacher/auth/google', { body: { idToken: idToken('nobody@x.test', 'g-nobody') } })
  assert.equal(none.status, 404)
  assert.equal(none.body.code, 'NO_TEACHER_ACCOUNT')
  assert.equal(none.body.canStartSolo, true)

  // One workspace: no choice needed.
  const one = await app.call('POST', '/api/teacher/auth/google', { body: { idToken: idToken('a1@a.test', 'g-a1') } })
  assert.equal(one.status, 200)
  assert.equal(one.body.workspaces.length, 1)
  assert.equal(one.body.needsChoice, false)
  assert.equal(one.body.adminToken, null)

  // The school teacher starts a Solo workspace with the same Google account.
  const s = await app.call('POST', '/api/teacher/auth/solo', { body: { idToken: idToken('dual@x.test', 'g-dual', { name: 'Dual Person' }) } })
  assert.equal(s.status, 201, JSON.stringify(s.body))
  const soloOrg = String(decode(s.body.token).orgId)
  assert.notEqual(soloOrg, ids.orgA)

  const signIn = await app.call('POST', '/api/teacher/auth/google', { body: { idToken: idToken('dual@x.test', 'g-dual') } })
  assert.equal(signIn.status, 200)
  assert.equal(signIn.body.workspaces.length, 2)
  assert.equal(signIn.body.needsChoice, true)
  assert.deepEqual(signIn.body.workspaces.map((w) => w.kind).sort(), ['institute', 'solo'])
  // Last used (the Solo one) is entered by default.
  assert.equal(String(decode(signIn.body.token).orgId), soloOrg)

  // Pick the school explicitly at sign-in, then switch back.
  const school = await app.call('POST', '/api/teacher/auth/google', { body: { idToken: idToken('dual@x.test', 'g-dual'), tutorId: ids.dual } })
  assert.equal(String(decode(school.body.token).orgId), ids.orgA)
  assert.equal(school.body.needsChoice, false)
  const soloWs = signIn.body.workspaces.find((w) => w.kind === 'solo')
  const sw = await app.call('POST', '/api/teacher/auth/switch', { token: school.body.token, body: { tutorId: soloWs.tutorId } })
  assert.equal(sw.status, 200)
  assert.equal(String(decode(sw.body.token).orgId), soloOrg)
  assert.ok(sw.body.adminToken, 'own Solo workspace gives the admin token too')
  const list = await app.call('GET', '/api/teacher/auth/workspaces', { token: sw.body.token })
  assert.equal(list.body.workspaces.length, 2)

  // Cannot switch into somebody else's Tutor row.
  const bad = await app.call('POST', '/api/teacher/auth/switch', { token: school.body.token, body: { tutorId: ids.tA2 } })
  assert.equal(bad.status, 404)
  const garbage = await app.call('POST', '/api/teacher/auth/switch', { token: school.body.token, body: { tutorId: 'nope' } })
  assert.equal(garbage.status, 404)
  // A different Google account with the same email is refused.
  const other = await app.call('POST', '/api/teacher/auth/google', { body: { idToken: idToken('dual@x.test', 'g-impostor') } })
  assert.equal(other.status, 403)
})

let g1
test('groups: create, edit, archive/restore; Solo Free limit is a friendly 402', async () => {
  const subjects = await app.db.admin.collection('subjects').find({ orgId: new mongoose.Types.ObjectId(solo.orgId) }).toArray()
  const maths = subjects.find((s) => s.name === 'Maths')
  const bad = await app.call('POST', '/api/teacher/groups', { token: solo.token, body: { name: '' } })
  assert.equal(bad.status, 400)
  const badColour = await app.call('POST', '/api/teacher/groups', { token: solo.token, body: { name: 'X', color: 'red' } })
  assert.equal(badColour.status, 400)
  const c = await app.call('POST', '/api/teacher/groups', { token: solo.token, body: { name: 'Evening Maths', subjectIds: [String(maths._id)], color: '#3d9bff', emoji: '🧮', gradeBand: 'Year 4-5' } })
  assert.equal(c.status, 201, JSON.stringify(c.body))
  g1 = c.body.group
  assert.equal(g1.canManage, true)
  assert.equal(g1.subjects.length, 1)

  // Schedule through the existing endpoint (the tutor teaches the subject).
  const slot = await app.call('POST', `/api/teacher/batches/${g1._id}/subjects/${g1.subjects[0]._id}/schedule`, { token: solo.token, body: { dayOfWeek: new Date().getUTCDay(), startTime: '00:00', endTime: '23:59' } })
  assert.equal(slot.status, 200, JSON.stringify(slot.body))

  const second = await app.call('POST', '/api/teacher/groups', { token: solo.token, body: { name: 'Second' } })
  assert.equal(second.status, 402)
  assert.equal(second.body.code, 'PLAN_LIMIT')
  assert.equal(second.body.limit, 'groups')
  assert.equal(second.body.max, 1)

  const e = await app.call('PATCH', `/api/teacher/groups/${g1._id}`, { token: solo.token, body: { name: 'Evening Maths A', color: '#43c0a0' } })
  assert.equal(e.status, 200)
  assert.equal(e.body.group.name, 'Evening Maths A')
  assert.equal(e.body.group.subjects[0].schedule.length, 1, 'editing keeps the schedule')

  const arch = await app.call('POST', `/api/teacher/groups/${g1._id}/archive`, { token: solo.token })
  assert.equal(arch.status, 200)
  const list = await app.call('GET', '/api/teacher/groups', { token: solo.token })
  assert.equal(list.body.groups.length, 0)
  assert.equal(list.body.archivedCount, 1)
  assert.deepEqual(list.body.usage, { groups: 0, students: 0 })
  const res = await app.call('POST', `/api/teacher/groups/${g1._id}/restore`, { token: solo.token })
  assert.equal(res.status, 200)
})

test('school policy: teachers create groups only when allowed; their groups stay private', async () => {
  const blocked = await app.call('POST', '/api/teacher/groups', { token: T.a1(), body: { name: 'My club' } })
  assert.equal(blocked.status, 403)
  assert.equal(blocked.body.code, 'POLICY_BLOCKED')
  await app.db.admin.collection('orgpolicies').insertOne({ orgId: new mongoose.Types.ObjectId(ids.orgA), teachersCreateGroups: true })
  const ok = await app.call('POST', '/api/teacher/groups', { token: T.a1(), body: { name: 'My club' } })
  assert.equal(ok.status, 201)
  const club = ok.body.group._id

  // The admin-made group: visible, but not mine to rename.
  const list = await app.call('GET', '/api/teacher/groups', { token: T.a1() })
  const adminMade = list.body.groups.find((g) => g._id === ids.assigned)
  assert.equal(adminMade.canManage, false)
  assert.equal((await app.call('PATCH', `/api/teacher/groups/${ids.assigned}`, { token: T.a1(), body: { name: 'x' } })).status, 403)

  // Another teacher at the same school sees nothing of my private group.
  const other = await app.call('GET', '/api/teacher/groups', { token: T.a2() })
  assert.equal(other.body.groups.length, 0)
  for (const [m, path, body] of [
    ['PATCH', `/api/teacher/groups/${club}`, { name: 'x' }], ['POST', `/api/teacher/groups/${club}/archive`], ['GET', `/api/teacher/groups/${club}/join`],
    ['GET', `/api/teacher/groups/${club}/heatmap`], ['GET', `/api/teacher/groups/${club}/parents`], ['POST', `/api/teacher/groups/${club}/roster`, { rows: [{ name: 'x' }] }],
    ['GET', `/api/teacher/batches/${club}/analytics/overview`],
  ]) {
    assert.equal((await app.call(m, path, { token: T.a2(), body })).status, 404, `${m} ${path}`)
  }
})

test('another school can never reach this school\'s groups, students or notes', async () => {
  for (const [m, path, body] of [
    ['GET', `/api/teacher/groups/${ids.assigned}/heatmap`], ['GET', `/api/teacher/groups/${ids.assigned}/suggestions`], ['GET', `/api/teacher/groups/${ids.assigned}/join`],
    ['POST', `/api/teacher/groups/${ids.assigned}/parents/invite`, { invites: [{ studentId: ids.sA, email: 'p@x.test' }] }],
    ['POST', `/api/teacher/groups/${ids.bGroup}/students/transfer`, { toGroupId: ids.assigned, studentIds: [ids.sB] }],
    ['GET', `/api/teacher/students/${ids.sA}/profile`], ['GET', `/api/teacher/students/${ids.sA}/notes`], ['POST', `/api/teacher/students/${ids.sA}/notes`, { body: 'hi' }],
    ['GET', `/api/teacher/students/${ids.sA}/analytics/overview`],
  ]) {
    assert.equal((await app.call(m, path, { token: T.b(), body })).status, 404, `${m} ${path}`)
  }
  // And a Solo tutor cannot reach the school's group either.
  assert.equal((await app.call('GET', `/api/teacher/groups/${ids.assigned}/heatmap`, { token: solo.token })).status, 404)
  // Wrong role / no token.
  assert.equal((await app.call('GET', '/api/teacher/groups', { token: app.tokens.parent(String(oid())) })).status, 401)
  assert.equal((await app.call('GET', '/api/teacher/today')).status, 401)
})

test('roster import: preview first, plan limit shown and enforced, then created and added', async () => {
  const rows = [
    { name: 'Lina', email: 'lina@kids.test', grade: 'Year 4', parentEmail: 'lina.mum@home.test', parentName: 'Mrs L' },
    { name: 'Omar', email: 'omar@kids.test', age: '9' },
    { name: '', email: 'nobody@kids.test' },
    { name: 'Bad', email: 'not-an-email' },
    { name: 'Dup', email: 'lina@kids.test' },
    { name: 'NoMail' },
  ]
  const dry = await app.call('POST', `/api/teacher/groups/${g1._id}/roster`, { token: solo.token, body: { rows, dryRun: true } })
  assert.equal(dry.status, 200)
  assert.deepEqual(dry.body.summary, { new: 3, existing: 0, in_group: 0, error: 3 })
  assert.equal(await app.db.admin.collection('students').countDocuments({ orgId: new mongoose.Types.ObjectId(solo.orgId) }), 0, 'dry run writes nothing')
  const withErrors = await app.call('POST', `/api/teacher/groups/${g1._id}/roster`, { token: solo.token, body: { rows, dryRun: false } })
  assert.equal(withErrors.status, 400)

  const tooMany = Array.from({ length: 16 }, (_, i) => ({ name: `Kid ${i}`, email: `kid${i}@kids.test` }))
  const dryMany = await app.call('POST', `/api/teacher/groups/${g1._id}/roster`, { token: solo.token, body: { rows: tooMany, dryRun: true } })
  assert.equal(dryMany.body.problems[0].code, 'PLAN_LIMIT')
  const applyMany = await app.call('POST', `/api/teacher/groups/${g1._id}/roster`, { token: solo.token, body: { rows: tooMany, dryRun: false } })
  assert.equal(applyMany.status, 402)
  assert.equal(applyMany.body.limit, 'students')

  const good = rows.filter((r) => ['Lina', 'Omar', 'NoMail'].includes(r.name))
  const apply = await app.call('POST', `/api/teacher/groups/${g1._id}/roster`, { token: solo.token, body: { rows: good, dryRun: false, inviteParents: true } })
  assert.equal(apply.status, 200, JSON.stringify(apply.body))
  assert.equal(apply.body.created, 3)
  assert.equal(apply.body.invited, 1)
  const again = await app.call('POST', `/api/teacher/groups/${g1._id}/roster`, { token: solo.token, body: { rows: good.slice(0, 1), dryRun: true } })
  assert.equal(again.body.rows[0].status, 'in_group')
  const audit = await app.db.main.collection('auditevents').findOne({ action: 'roster.import' })
  assert.ok(audit)
  const mail = await app.db.main.collection('outboxes').findOne({ to: 'lina.mum@home.test' })
  assert.ok(mail, 'parent invite queued')
  assert.match(mail.subject, /Lina/)
})

test('join code: public lookup, student joins themselves, parent joins a verified child only', async () => {
  const j = await app.call('GET', `/api/teacher/groups/${g1._id}/join`, { token: solo.token })
  assert.equal(j.status, 200)
  const code = j.body.join.code
  assert.match(code, /^[A-Z0-9]{6}$/)
  assert.ok(j.body.join.url.endsWith(`/join/${code}`))

  const look = await app.call('GET', `/api/join/${code.toLowerCase()}`)
  assert.equal(look.status, 200)
  assert.equal(look.body.group.name, 'Evening Maths A')
  assert.equal(look.body.org.kind, 'solo')
  assert.equal(look.body.org.brandColor, '', 'no branding on Solo Free')
  assert.equal(look.body.studentIds, undefined)
  assert.equal((await app.call('GET', '/api/join/ZZZZZZ')).status, 404)

  assert.equal((await app.call('POST', `/api/join/${code}`)).status, 401)
  assert.equal((await app.call('POST', `/api/join/${code}`, { token: T.b() })).status, 403)

  const stu = app.tokens.student('mei@kids.test', 'Mei')
  const joined = await app.call('POST', `/api/join/${code}`, { token: stu })
  assert.equal(joined.status, 201, JSON.stringify(joined.body))
  assert.equal((await app.call('POST', `/api/join/${code}`, { token: stu })).body.alreadyMember, true)
  const n = await app.db.main.collection('notifications').findOne({ to: `teacher:${solo.tutorId}`, kind: 'group.joined' })
  assert.ok(n)

  const parentId = oid()
  await app.db.main.collection('parentaccounts').insertOne({ _id: parentId, uid: 'p-uid', email: 'noah.dad@home.test', name: 'Noah Dad' })
  const pending = oid(), verified = oid()
  await app.db.main.collection('children').insertMany([
    { _id: pending, parentId, name: 'Stranger', age: 9, email: 'asha@kids.test', linkStatus: 'pending' },
    { _id: verified, parentId, name: 'Noah', age: 9, email: 'noah@kids.test', linkStatus: 'verified' },
  ])
  const p = app.tokens.parent(String(parentId), 'noah.dad@home.test')
  assert.equal((await app.call('POST', `/api/join/${code}`, { token: p, body: { childId: String(pending) } })).status, 403)
  assert.equal((await app.call('POST', `/api/join/${code}`, { token: p, body: {} })).status, 400)
  const pj = await app.call('POST', `/api/join/${code}`, { token: p, body: { childId: String(verified) } })
  assert.equal(pj.status, 201)

  // Turning the code off stops it; resetting makes a new one.
  await app.call('POST', `/api/teacher/groups/${g1._id}/join`, { token: solo.token, body: { enabled: false } })
  assert.equal((await app.call('GET', `/api/join/${code}`)).status, 404)
  const reset = await app.call('POST', `/api/teacher/groups/${g1._id}/join`, { token: solo.token, body: { enabled: true, reset: true } })
  assert.notEqual(reset.body.join.code, code)
})

test('parents: Linked / Invited / None per child, bulk invite emails', async () => {
  const before = await app.call('GET', `/api/teacher/groups/${g1._id}/parents`, { token: solo.token })
  assert.equal(before.status, 200)
  const by = Object.fromEntries(before.body.students.map((s) => [s.name, s.status]))
  assert.equal(by.Lina, 'invited')
  assert.equal(by.Noah, 'linked', 'a parent who joined their verified child is linked')
  assert.equal(by.Omar, 'none')
  const omar = before.body.students.find((s) => s.name === 'Omar')
  const inv = await app.call('POST', `/api/teacher/groups/${g1._id}/parents/invite`, { token: solo.token, body: { invites: [{ studentId: omar.studentId, email: 'omar.mum@home.test' }, { studentId: ids.sB, email: 'x@y.test' }, { studentId: omar.studentId, email: 'bad' }] } })
  assert.equal(inv.status, 200)
  assert.equal(inv.body.sent, 1)
  assert.deepEqual(inv.body.results.map((r) => r.status), ['invited', 'error', 'error'])
  const after = await app.call('GET', `/api/teacher/groups/${g1._id}/parents`, { token: solo.token })
  assert.equal(after.body.students.find((s) => s.name === 'Omar').status, 'invited')
  // Once the invited parent signs in and their link is verified, the child shows Linked.
  const acct = oid()
  await app.db.main.collection('parentaccounts').insertOne({ _id: acct, uid: 'p-omar', email: 'omar.mum@home.test', name: 'Omar Mum' })
  await app.db.main.collection('children').insertOne({ _id: oid(), parentId: acct, name: 'Omar', age: 9, email: 'omar@kids.test', linkStatus: 'verified' })
  const linked = await app.call('GET', `/api/teacher/groups/${g1._id}/parents`, { token: solo.token })
  assert.equal(linked.body.students.find((s) => s.name === 'Omar').status, 'linked')
})

test('Today, heatmap, compare, suggestions and summary use the shared analytics', async () => {
  const days = ['lina', 'omar', 'mei'].map((n, i) => ({
    email: `${n}@kids.test`, date: today, minutes: 20, answered: 10, correct: i === 0 ? 9 : 4, firstTry: 3, timeMsSum: 50000, timedCount: 10,
    byModuleSubject: { read_maths: { answered: 10, correct: i === 0 ? 9 : 4, minutes: 20 } }, byHour: { 17: 10 }, devices: { phone: 10 },
  }))
  await app.db.main.collection('learnerdays').insertMany(days)

  const t = await app.call('GET', '/api/teacher/today', { token: solo.token, headers: { 'x-timezone': 'UTC' } })
  assert.equal(t.status, 200)
  assert.equal(t.body.classes.length, 1)
  assert.equal(t.body.classes[0].groupName, 'Evening Maths A')
  assert.equal(t.body.checklist.group, true)
  assert.equal(t.body.checklist.students, true)
  assert.equal(t.body.checklist.results, true)
  assert.equal(t.body.counts.studentsWithoutEmail, 1)
  assert.ok(t.body.attention.some((a) => a.name === 'Noah'), 'inactive learner needs attention')
  assert.ok(typeof t.body.week.story === 'string')

  const h = await app.call('GET', `/api/teacher/groups/${g1._id}/heatmap`, { token: solo.token })
  assert.equal(h.status, 200)
  assert.equal(h.body.columns.length, 12)
  const lina = h.body.rows.find((r) => r.name === 'Lina')
  assert.equal(lina.cells.read_maths.accuracy, 90)
  assert.equal(lina.cells.read_maths.mastery, 'mastered')
  assert.equal(h.body.columns.find((c) => c.key === 'read_maths').touched, 3)
  assert.equal(h.body.rows[0].atRisk, true, 'at-risk pinned on top')

  const sug = await app.call('GET', `/api/teacher/groups/${g1._id}/suggestions`, { token: solo.token })
  assert.equal(sug.body.suggestions[0].title, 'Read · Maths')
  assert.deepEqual(sug.body.suggestions[0].students.map((s) => s.name).sort(), ['Mei', 'Omar'])
  const made = await app.call('POST', '/api/teacher/groups/suggested', { token: solo.token, body: { fromGroupId: g1._id, studentIds: sug.body.suggestions[0].students.map((s) => s.id), module: 'read', subject: 'maths' } })
  assert.equal(made.status, 201, 'practice groups do not count against the group limit')
  assert.equal(made.body.group.studentCount, 2)

  const cmp = await app.call('GET', '/api/teacher/groups/compare', { token: solo.token })
  assert.equal(cmp.status, 200)
  assert.equal(cmp.body.groups.length, 1, 'practice groups are left out of the comparison')
  assert.equal(cmp.body.groups[0].answered, 30)

  const s = await app.call('GET', '/api/teacher/summary', { token: solo.token })
  assert.equal(s.status, 200)
  assert.equal(s.body.students, 5)
  assert.equal(s.body.testsCreated, 0)
  assert.equal(s.body.questionsContributed, 0)
})

test('student profile and private notes: only the author sees them', async () => {
  const lina = await app.db.admin.collection('students').findOne({ email: 'lina@kids.test' })
  const prof = await app.call('GET', `/api/teacher/students/${lina._id}/profile`, { token: solo.token })
  assert.equal(prof.status, 200)
  assert.equal(prof.body.groups[0].name, 'Evening Maths A')
  assert.equal(prof.body.parents.status, 'invited')
  const ov = await app.call('GET', `/api/teacher/students/${lina._id}/analytics/overview`, { token: solo.token })
  assert.equal(ov.status, 200)
  assert.equal(ov.body.totals.answered, 10)

  assert.equal((await app.call('POST', `/api/teacher/students/${lina._id}/notes`, { token: solo.token, body: { body: '  ' } })).status, 400)
  const n = await app.call('POST', `/api/teacher/students/${lina._id}/notes`, { token: solo.token, body: { body: 'Likes word problems. Needs larger text.', pinned: true } })
  assert.equal(n.status, 201)
  const up = await app.call('PATCH', `/api/teacher/students/${lina._id}/notes/${n.body.note._id}`, { token: solo.token, body: { pinned: false } })
  assert.equal(up.body.note.pinned, false)

  // School A teacher A1 also teaches Asha; A2 must not see A1's notes about her.
  const a1note = await app.call('POST', `/api/teacher/students/${ids.sA}/notes`, { token: T.a1(), body: { body: 'Private to A1' } })
  assert.equal(a1note.status, 201)
  await app.db.admin.collection('batches').updateOne({ _id: new mongoose.Types.ObjectId(ids.assigned) }, { $addToSet: { tutorIds: new mongoose.Types.ObjectId(ids.tA2) } })
  const a2view = await app.call('GET', `/api/teacher/students/${ids.sA}/notes`, { token: T.a2() })
  assert.equal(a2view.status, 200)
  assert.equal(a2view.body.notes.length, 0)
  assert.equal((await app.call('DELETE', `/api/teacher/students/${ids.sA}/notes/${a1note.body.note._id}`, { token: T.a2() })).status, 404)
  assert.equal((await app.call('DELETE', `/api/teacher/students/${ids.sA}/notes/${a1note.body.note._id}`, { token: T.a1() })).status, 200)
})

test('move and copy students between my groups; workspace, plan and branding', async () => {
  const ws = await app.call('GET', '/api/teacher/workspace', { token: solo.token })
  assert.equal(ws.status, 200)
  assert.equal(ws.body.plan.id, 'solo_free')
  assert.deepEqual(ws.body.limits, { groups: 1, students: 15 })
  assert.equal(ws.body.usage.students, 5)
  assert.equal(ws.body.upgrade.plan, 'solo_pro')
  assert.equal(ws.body.upgrade.billingAvailable, false)
  assert.equal(ws.body.profile.country, 'Ireland')

  const locked = await app.call('PATCH', '/api/teacher/workspace', { token: solo.token, body: { brandColor: '#123456' } })
  assert.equal(locked.status, 402)
  assert.equal(locked.body.module, 'reports.branded')
  const named = await app.call('PATCH', '/api/teacher/workspace', { token: solo.token, body: { name: 'Rao Maths Club', checklistDismissed: true } })
  assert.equal(named.status, 200)
  assert.equal((await app.db.superadmin.collection('organizations').findOne({ adminOrgId: solo.orgId })).name, 'Rao Maths Club', 'both org copies stay in sync')
  assert.equal((await app.call('PATCH', '/api/teacher/workspace', { token: T.a1(), body: { name: 'Hijack' } })).status, 403)

  // Upgrade (as billing will): Solo Pro has no group limit and has branding.
  await app.db.superadmin.collection('organizations').updateOne({ adminOrgId: solo.orgId }, { $set: { plan: 'solo_pro' } })
  const brand = await app.call('PATCH', '/api/teacher/workspace', { token: solo.token, body: { brandColor: '#123456', logoUrl: 'https://img.test/logo.png' } })
  assert.equal(brand.status, 200, JSON.stringify(brand.body))
  assert.equal(brand.body.workspace.brandColor, '#123456')
  assert.equal((await app.call('PATCH', '/api/teacher/workspace', { token: solo.token, body: { logoUrl: 'javascript:alert(1)' } })).status, 400)

  const g2 = (await app.call('POST', '/api/teacher/groups', { token: solo.token, body: { name: 'Saturday' } })).body.group
  const lina = await app.db.admin.collection('students').findOne({ email: 'lina@kids.test' })
  const copy = await app.call('POST', `/api/teacher/groups/${g1._id}/students/transfer`, { token: solo.token, body: { toGroupId: g2._id, studentIds: [String(lina._id)], mode: 'copy' } })
  assert.equal(copy.status, 200)
  let b1 = await app.db.admin.collection('batches').findOne({ _id: new mongoose.Types.ObjectId(g1._id) })
  assert.ok(b1.studentIds.some((x) => String(x) === String(lina._id)))
  const move = await app.call('POST', `/api/teacher/groups/${g1._id}/students/transfer`, { token: solo.token, body: { toGroupId: g2._id, studentIds: [String(lina._id)], mode: 'move' } })
  assert.equal(move.status, 200)
  b1 = await app.db.admin.collection('batches').findOne({ _id: new mongoose.Types.ObjectId(g1._id) })
  assert.ok(!b1.studentIds.some((x) => String(x) === String(lina._id)))
  // Into a group that is not mine: 404.
  assert.equal((await app.call('POST', `/api/teacher/groups/${g2._id}/students/transfer`, { token: solo.token, body: { toGroupId: ids.assigned, studentIds: [String(lina._id)] } })).status, 404)

  // Public tutor page (TCH-082): off until published with an address.
  const noSlug = await app.call('PATCH', '/api/teacher/workspace', { token: solo.token, body: { publicEnabled: true } })
  assert.equal(noSlug.status, 400)
  const pub = await app.call('PATCH', '/api/teacher/workspace', { token: solo.token, body: { slug: 'ms-rao', publicEnabled: true, headline: 'Maths for curious kids', publicGroupId: g1._id, testimonials: [{ quote: 'Wonderful', by: 'A parent' }] } })
  assert.equal(pub.status, 200, JSON.stringify(pub.body))
  const page = await app.call('GET', '/api/join/tutor/ms-rao')
  assert.equal(page.status, 200)
  assert.equal(page.body.profile.headline, 'Maths for curious kids')
  assert.equal(page.body.org.brandColor, '#123456')
  assert.ok(page.body.joinCode)
  assert.equal(page.body.tutor.email, undefined, 'no email on the public page')
  await app.call('PATCH', '/api/teacher/workspace', { token: solo.token, body: { publicEnabled: false } })
  assert.equal((await app.call('GET', '/api/join/tutor/ms-rao')).status, 404)
})

test('a school admin can start a Solo workspace without mixing it with the school', async () => {
  const r = await app.call('POST', '/api/teacher/auth/solo', { body: { idToken: idToken('head@a.test', 'adm-a', { name: 'Head' }) } })
  assert.equal(r.status, 201, JSON.stringify(r.body))
  assert.equal(r.body.adminToken, null, 'their admin login stays the school')
  const org = await app.db.admin.collection('organizations').findOne({ _id: new mongoose.Types.ObjectId(decode(r.body.token).orgId) })
  assert.equal(org.adminUid, 'solo:adm-a')
  const admin = await app.db.admin.collection('orgadmins').findOne({ uid: 'adm-a' })
  assert.equal(String(admin.orgId), ids.orgA)
  assert.equal(await app.db.admin.collection('organizations').countDocuments({ adminUid: 'adm-a' }), 1)
})

test('school admin sends a teacher invite naming the school and their groups; other schools cannot', async () => {
  const adminA = app.tokens.admin(String(oid()), ids.orgA, 'adm-a')
  const r = await app.call('POST', `/api/admin/tutors/${ids.tA1}/invite`, { token: adminA })
  assert.equal(r.status, 200, JSON.stringify(r.body))
  const mail = await app.db.main.collection('outboxes').findOne({ to: 'a1@a.test', kind: 'teacher_invite' })
  assert.match(mail.subject, /Sunrise School/)
  assert.match(mail.html, /Year 5 \(admin made\)/)
  const adminB = app.tokens.admin(String(oid()), ids.orgB, 'adm-b')
  assert.equal((await app.call('POST', `/api/admin/tutors/${ids.tA1}/invite`, { token: adminB })).status, 404)
  assert.equal((await app.call('POST', `/api/admin/tutors/${ids.tA1}/invite`, { token: T.a1() })).status, 401)
})
