// Stay signed in until sign-out (POST /api/auth/renew): a still-valid token becomes a
// fresh one with the same claims, but only while the account is still allowed in.
const test = require('node:test')
const assert = require('node:assert/strict')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { start } = require('./harness')

const S = { student: 'test-student-secret', parent: 'test-parent-secret', admin: 'test-admin-secret', teacher: 'test-teacher-secret', superadmin: 'test-superadmin-secret' }
const oid = () => new mongoose.Types.ObjectId()
let app

// The lifetimes a deployment can set (server/.env); the test pins them so it does not depend on a local .env.
const LIFETIMES = { JWT_EXPIRES_IN: '30d', PARENT_JWT_EXPIRES_IN: '30d', ADMIN_JWT_EXPIRES_IN: '30d', TEACHER_JWT_EXPIRES_IN: '30d' }
test.before(async () => { app = await start({ env: LIFETIMES }) })
test.after(async () => { await app?.stop?.() })

const renew = (token) => app.call('POST', '/api/auth/renew', { token })
const days = (t) => (jwt.decode(t).exp * 1000 - Date.now()) / 86_400_000

test('a learner with an email account gets a fresh 30-day token with the same claims, and it works', async () => {
  const id = oid()
  await app.db.main.collection('users').insertOne({ _id: id, name: 'Ria', email: 'ria@kids.test', passwordHash: 'x' })
  const old = jwt.sign({ id: String(id), email: 'ria@kids.test', name: 'Ria' }, S.student, { expiresIn: '2d' })
  const r = await renew(old)
  assert.equal(r.status, 200)
  assert.equal(r.body.renewed, true)
  assert.equal(r.body.role, 'student')
  const p = jwt.verify(r.body.token, S.student)
  assert.equal(p.id, String(id))
  assert.equal(p.email, 'ria@kids.test')
  assert.ok(days(r.body.token) > 29, 'full lifetime again')
  const use = await app.call('GET', '/api/dashboard/stats', { token: r.body.token })
  assert.equal(use.status, 200, 'the renewed token signs the learner in')
})

test('a deleted account, or a disabled picture-login learner, is not renewed', async () => {
  const gone = jwt.sign({ id: String(oid()), email: 'gone@kids.test', name: 'Gone' }, S.student, { expiresIn: '2d' })
  assert.equal((await renew(gone)).status, 401)
  const ml = oid()
  await app.db.main.collection('managedlearners').insertOne({ _id: ml, name: 'Pip', status: 'disabled' })
  const managed = jwt.sign({ id: String(ml), name: 'Pip', managed: true }, S.student, { expiresIn: '2d' })
  assert.equal((await renew(managed)).status, 401)
  await app.db.main.collection('managedlearners').updateOne({ _id: ml }, { $set: { status: 'active' } })
  assert.equal((await renew(managed)).status, 200)
})

test('parents, school admins and active teachers stay signed in; disabled teachers and removed staff do not', async () => {
  const pid = oid()
  await app.db.main.collection('parentaccounts').insertOne({ _id: pid, uid: 'p-1', email: 'mum@family.test', name: 'Mum' })
  const p = await renew(jwt.sign({ id: String(pid), uid: 'p-1', email: 'mum@family.test', name: 'Mum', role: 'parent' }, S.parent, { expiresIn: '1d' }))
  assert.equal(p.status, 200)
  assert.equal(jwt.verify(p.body.token, S.parent).role, 'parent')

  const aid = oid()
  const org = oid()
  await app.db.admin.collection('orgadmins').insertOne({ _id: aid, uid: 'a-1', email: 'head@school.test', name: 'Head', orgId: org })
  const a = await renew(jwt.sign({ id: String(aid), uid: 'a-1', email: 'head@school.test', orgId: String(org), role: 'org_admin' }, S.admin, { expiresIn: '1d' }))
  assert.equal(a.status, 200)
  assert.equal(jwt.verify(a.body.token, S.admin).orgId, String(org))

  const tid = oid()
  await app.db.admin.collection('tutors').insertOne({ _id: tid, uid: 't-1', email: 't@school.test', name: 'Tess', orgId: org, status: 'active', authStatus: 'active' })
  const teacher = jwt.sign({ id: String(tid), uid: 't-1', email: 't@school.test', orgId: String(org), role: 'teacher' }, S.teacher, { expiresIn: '1d' })
  assert.equal((await renew(teacher)).status, 200)
  await app.db.admin.collection('tutors').updateOne({ _id: tid }, { $set: { authStatus: 'disabled' } })
  assert.equal((await renew(teacher)).status, 401, 'a disabled teacher cannot keep a session going')

  const sid = oid()
  await app.db.admin.collection('orgstaffs').insertOne({ _id: sid, orgId: org, email: 'office@school.test', role: 'office', status: 'disabled' })
  const staff = jwt.sign({ id: String(aid), email: 'office@school.test', orgId: String(org), staffId: String(sid), staffRole: 'office', role: 'org_staff' }, S.admin, { expiresIn: '1d' })
  assert.equal((await renew(staff)).status, 401, 'removed staff are not renewed')
})

test('never renewed: support "view as" sessions, Learnigo staff, expired or forged tokens', async () => {
  const pid = oid()
  await app.db.main.collection('parentaccounts').insertOne({ _id: pid, uid: 'p-2', email: 'dad@family.test', name: 'Dad' })
  const viewAs = jwt.sign({ id: String(pid), email: 'dad@family.test', role: 'parent', imp: { sid: 'x', by: 'support@learnigo.test' } }, S.parent, { expiresIn: '10m' })
  assert.equal((await renew(viewAs)).status, 403)
  assert.equal((await renew(jwt.sign({ email: 'root@example.com', role: 'superadmin' }, S.superadmin, { expiresIn: '1h' }))).status, 401)
  assert.equal((await renew(jwt.sign({ id: String(pid), role: 'parent' }, S.parent, { expiresIn: -10 }))).status, 401, 'expired')
  assert.equal((await renew(jwt.sign({ id: String(pid), role: 'parent' }, 'not-the-secret', { expiresIn: '1h' }))).status, 401, 'forged')
  assert.equal((await renew('')).status, 401)
})

test('a Google sign-in learner (Google id, refreshed by Google sign-in itself) is a no-op', async () => {
  const r = await renew(jwt.sign({ id: 'firebase-uid-123', email: 'g@kids.test', name: 'G' }, S.student, { expiresIn: '1d' }))
  assert.equal(r.status, 200)
  assert.equal(r.body.renewed, false)
})
