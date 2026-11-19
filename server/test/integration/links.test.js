// Connect by email (services/linkRequests.js): one person types the other's email,
// the other taps Accept or Decline. Parent <-> learner, teacher <-> learner,
// school <-> teacher, school -> learner, plus the safety rules: only the invited
// email can answer, nothing is shared before Accept, requests expire, senders are
// rate limited, and a request to an email without an account waits for sign-up.
// Also: a new school is self-serve (approved at once, no Super Admin step).
const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { start } = require('./harness')

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } })
const idToken = (uid, email, name = 'Person') => jwt.sign({ sub: uid, email, email_verified: true, name }, privateKey, { algorithm: 'RS256', keyid: 'test-kid', audience: 'learningo-c9ac4', issuer: 'https://securetoken.google.com/learningo-c9ac4', expiresIn: '1h' })

let app
const oid = () => new mongoose.Types.ObjectId()
const ids = {}
const T = {}
const outbox = (q) => app.db.main.collection('outboxes').find(q).toArray()
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

test.before(async () => {
  app = await start({ env: { TEST_FIREBASE_PUBLIC_KEY: publicKey }, preload: [require.resolve('./fake-firebase')] })
  const { main, admin, superadmin } = app.db
  ids.school = oid(); ids.solo = oid(); ids.head = oid(); ids.rao = oid(); ids.group = oid(); ids.soloAdmin = oid()
  await admin.collection('organizations').insertMany([
    { _id: ids.school, name: 'Sunrise School', kind: 'institute', type: 'school', status: 'approved', adminUid: 'adm-s', adminEmail: 'head@sunrise.test' },
    { _id: ids.solo, name: 'Rao Tutoring', kind: 'solo', type: 'other', status: 'approved', adminUid: 'adm-rao', adminEmail: 'rao@tutor.test' },
  ])
  await superadmin.collection('organizations').insertMany([
    { name: 'Sunrise School', adminOrgId: String(ids.school), status: 'approved', subscriptionPlan: 'free', kind: 'institute' },
    { name: 'Rao Tutoring', adminOrgId: String(ids.solo), status: 'approved', subscriptionPlan: 'free', kind: 'solo' },
  ])
  await admin.collection('orgadmins').insertMany([
    { _id: ids.head, uid: 'adm-s', email: 'head@sunrise.test', name: 'Mrs Head', orgId: ids.school, role: 'org_admin' },
    { _id: ids.soloAdmin, uid: 'adm-rao', email: 'rao@tutor.test', name: 'Ms Rao', orgId: ids.solo, role: 'org_admin' },
  ])
  await admin.collection('tutors').insertOne({ _id: ids.rao, name: 'Ms Rao', email: 'rao@tutor.test', uid: 't-rao', orgId: ids.solo, status: 'active', authStatus: 'active', batchIds: [ids.group], studentIds: [] })
  await admin.collection('batches').insertOne({ _id: ids.group, name: 'Fractions Club', orgId: ids.solo, tutorIds: [ids.rao], directTutorIds: [ids.rao], createdByTutorId: ids.rao, studentIds: [], subjects: [], status: 'active', groupKind: 'class' })

  ids.mum = oid(); ids.other = oid()
  await main.collection('parentaccounts').insertMany([
    { _id: ids.mum, uid: 'p-mum', email: 'mum@family.test', name: 'Priya Rao', plan: 'free' },
    { _id: ids.other, uid: 'p-other', email: 'other@family.test', name: 'Other Parent', plan: 'free' },
  ])
  T.mum = app.tokens.parent(String(ids.mum), 'mum@family.test')
  T.other = app.tokens.parent(String(ids.other), 'other@family.test')
  T.maya = app.tokens.student('maya@kids.test', 'Maya Singh')
  T.leo = app.tokens.student('leo@kids.test', 'Leo')
  T.rao = app.tokens.teacher(String(ids.rao), String(ids.solo), 'rao@tutor.test')
  // The school admin's token carries their real sign-in email (teachers address requests to it).
  T.head = jwt.sign({ id: String(ids.head), uid: 'adm-s', email: 'head@sunrise.test', name: 'Mrs Head', orgId: String(ids.school), role: 'org_admin' }, 'test-admin-secret', { expiresIn: '1h' })
})
test.after(async () => { await app?.stop() })

test('parent -> learner: the learner accepts, and only then the parent sees anything', async () => {
  const sent = await app.call('POST', '/api/parent/links', { token: T.mum, body: { to: 'student', email: 'Maya@Kids.test', name: 'Maya', age: 8 } })
  assert.equal(sent.status, 201)
  assert.equal(sent.body.request.status, 'pending')
  assert.equal(sent.body.request.to.email, 'maya@kids.test')
  const childId = sent.body.request.child.id
  // A waiting card, no data.
  const row = await app.db.main.collection('children').findOne({ _id: new mongoose.Types.ObjectId(childId) })
  assert.equal(row.linkStatus, 'pending')
  assert.equal((await app.call('GET', `/api/parent/children/${childId}/analytics/overview`, { token: T.mum })).status, 403)
  // The learner has no parent/teacher account: one email tells them where to accept.
  const mails = await outbox({ to: 'maya@kids.test', kind: 'link_request' })
  assert.equal(mails.length, 1)
  assert.match(mails[0].text, /My people/)
  // Sending again doesn't make a second request.
  const again = await app.call('POST', '/api/parent/links', { token: T.mum, body: { to: 'student', email: 'maya@kids.test', name: 'Maya', age: 8 } })
  assert.equal(again.status, 200)
  assert.equal(again.body.duplicate, true)
  assert.equal((await outbox({ to: 'maya@kids.test' })).length, 1)

  const inbox = await app.call('GET', '/api/dashboard/links', { token: T.maya })
  assert.equal(inbox.status, 200)
  assert.equal(inbox.body.incoming.length, 1)
  const r = inbox.body.incoming[0]
  assert.equal(r.from.name, 'Priya Rao')
  assert.equal(r.direction, 'incoming')
  assert.equal(r.kind, 'family')

  // Nobody else can answer it: another learner, a parent, nobody signed in.
  assert.equal((await app.call('POST', `/api/dashboard/links/${r.id}/accept`, { token: T.leo })).status, 404)
  assert.equal((await app.call('POST', `/api/parent/links/${r.id}/accept`, { token: T.other })).status, 404)
  assert.equal((await app.call('POST', `/api/dashboard/links/${r.id}/accept`)).status, 401)
  // The other parent can't cancel it either.
  assert.equal((await app.call('POST', `/api/parent/links/${r.id}/cancel`, { token: T.other })).status, 404)

  const ok = await app.call('POST', `/api/dashboard/links/${r.id}/accept`, { token: T.maya })
  assert.equal(ok.status, 200)
  assert.equal(ok.body.request.status, 'accepted')
  const linked = await app.db.main.collection('children').findOne({ _id: new mongoose.Types.ObjectId(childId) })
  assert.equal(linked.linkStatus, 'verified')
  assert.equal(linked.verifiedBy, 'child_request')
  assert.equal((await app.call('GET', `/api/parent/children/${childId}/analytics/overview`, { token: T.mum })).status, 200)
  // The parent hears about it in their bell.
  const bell = await app.db.main.collection('notifications').findOne({ to: `parent:${ids.mum}`, kind: 'link_request' })
  assert.match(bell.title, /Maya accepted/)
  // Answered once only; a new request for a linked child is refused.
  assert.equal((await app.call('POST', `/api/dashboard/links/${r.id}/accept`, { token: T.maya })).status, 409)
  assert.equal((await app.call('POST', '/api/parent/links', { token: T.mum, body: { to: 'student', email: 'maya@kids.test', name: 'Maya', age: 8 } })).status, 409)
  const out = await app.call('GET', '/api/parent/links', { token: T.mum })
  assert.equal(out.body.outgoing[0].status, 'accepted')
  assert.equal((await app.db.main.collection('auditevents').countDocuments({ action: { $in: ['link.request', 'link.accept'] } })) >= 2, true)
})

test('learner -> grown-up who has no account yet: the request waits for sign-up; decline and cancel', async () => {
  const sent = await app.call('POST', '/api/dashboard/links', { token: T.leo, body: { to: 'parent', email: 'newdad@family.test', age: 9 } })
  assert.equal(sent.status, 201)
  // Same answer whether or not the email has an account (no account lookup leaks).
  assert.deepEqual(Object.keys(sent.body).sort(), ['request', 'success'])
  const mail = (await outbox({ to: 'newdad@family.test', kind: 'link_request' }))[0]
  assert.ok(mail, 'an email tells them how to join')
  assert.match(mail.text, /sign in as a parent/i)

  // He signs up as a parent with that email: the request is waiting.
  const signin = await app.call('POST', '/api/parent/auth/google', { body: { idToken: idToken('uid-newdad', 'newdad@family.test', 'Sam Lee') } })
  assert.equal(signin.status, 200)
  const dad = signin.body.token
  const inbox = await app.call('GET', '/api/parent/links', { token: dad })
  assert.equal(inbox.body.incoming.length, 1)
  assert.equal(inbox.body.incoming[0].child.name, 'Leo')
  assert.equal(inbox.body.incoming[0].from.email, 'leo@kids.test')
  const acc = await app.call('POST', `/api/parent/links/${inbox.body.incoming[0].id}/accept`, { token: dad, body: { age: 10 } })
  assert.equal(acc.status, 200)
  assert.equal(acc.body.child.linkStatus, 'verified')
  assert.equal(acc.body.child.age, 10)
  const leoChild = acc.body.child._id
  assert.equal((await app.call('GET', `/api/parent/children/${leoChild}/analytics/overview`, { token: dad })).status, 200)
  const leoOut = await app.call('GET', '/api/dashboard/links', { token: T.leo })
  assert.equal(leoOut.body.outgoing[0].status, 'accepted')

  // Leo sees his grown-up and can stop sharing; then Dad sees nothing.
  const people = await app.call('GET', '/api/dashboard/links/people', { token: T.leo })
  assert.equal(people.body.guardians.length, 1)
  assert.equal(people.body.guardians[0].name, 'Sam')
  assert.equal((await app.call('POST', '/api/dashboard/links/people/unlink', { token: T.maya, body: { type: 'parent', id: people.body.guardians[0].id } })).status, 404, 'not Maya’s link')
  assert.equal((await app.call('POST', '/api/dashboard/links/people/unlink', { token: T.leo, body: { type: 'parent', id: people.body.guardians[0].id } })).status, 200)
  assert.equal((await app.call('GET', `/api/parent/children/${leoChild}/analytics/overview`, { token: dad })).status, 403)

  // Decline: Mum says no thanks; nothing is linked.
  const toMum = await app.call('POST', '/api/dashboard/links', { token: T.leo, body: { to: 'parent', email: 'mum@family.test' } })
  assert.equal(toMum.status, 201)
  const no = await app.call('POST', `/api/parent/links/${toMum.body.request.id}/decline`, { token: T.mum })
  assert.equal(no.status, 200)
  assert.equal(no.body.request.status, 'declined')
  assert.equal(await app.db.main.collection('children').countDocuments({ parentId: ids.mum, email: 'leo@kids.test' }), 0)
  assert.equal((await app.call('POST', `/api/parent/links/${toMum.body.request.id}/accept`, { token: T.mum })).status, 409)

  // Cancel: Leo takes a request back before it is answered.
  const toGran = await app.call('POST', '/api/dashboard/links', { token: T.leo, body: { to: 'parent', email: 'gran@family.test' } })
  assert.equal((await app.call('POST', `/api/dashboard/links/${toGran.body.request.id}/cancel`, { token: T.maya })).status, 404, 'only the sender cancels')
  assert.equal((await app.call('POST', `/api/dashboard/links/${toGran.body.request.id}/cancel`, { token: T.leo })).status, 200)
  const gran = (await app.call('POST', '/api/parent/auth/google', { body: { idToken: idToken('uid-gran', 'gran@family.test', 'Gran') } })).body.token
  assert.equal((await app.call('GET', '/api/parent/links', { token: gran })).body.incoming.length, 0)

  // A parent cancelling "add my child" removes the waiting card too.
  const p = await app.call('POST', '/api/parent/links', { token: T.other, body: { to: 'student', email: 'zara@kids.test', name: 'Zara', age: 7 } })
  assert.equal((await app.call('POST', `/api/parent/links/${p.body.request.id}/cancel`, { token: T.other })).status, 200)
  assert.equal(await app.db.main.collection('children').countDocuments({ parentId: ids.other, email: 'zara@kids.test' }), 0)
  // Removing a waiting child card cancels its request, so it can't be accepted later.
  const q = await app.call('POST', '/api/parent/links', { token: T.other, body: { to: 'student', email: 'ivy@kids.test', name: 'Ivy', age: 7 } })
  assert.equal((await app.call('DELETE', `/api/parent/children/${q.body.request.child.id}`, { token: T.other })).status, 200)
  const ivy = app.tokens.student('ivy@kids.test', 'Ivy')
  assert.equal((await app.call('GET', '/api/dashboard/links', { token: ivy })).body.incoming.length, 0)
  assert.equal((await app.call('POST', `/api/dashboard/links/${q.body.request.id}/accept`, { token: ivy })).status, 409)
})

test('bad requests: own email, managed learners, unknown kinds', async () => {
  assert.equal((await app.call('POST', '/api/parent/links', { token: T.mum, body: { to: 'student', email: 'mum@family.test', name: 'X', age: 8 } })).status, 400)
  assert.equal((await app.call('POST', '/api/parent/links', { token: T.mum, body: { to: 'student', email: 'not-an-email', name: 'X', age: 8 } })).status, 400)
  assert.equal((await app.call('POST', '/api/parent/links', { token: T.mum, body: { to: 'student', email: 'ml-abc@managed.learnigo.invalid', name: 'X', age: 8 } })).status, 400)
  assert.equal((await app.call('POST', '/api/parent/links', { token: T.mum, body: { to: 'teacher', email: 'rao@tutor.test' } })).status, 400)
  const managed = app.tokens.student('ml-0123456789abcdef01234567@managed.learnigo.invalid', 'Mini')
  assert.equal((await app.call('POST', '/api/dashboard/links', { token: managed, body: { to: 'parent', email: 'x@y.test' } })).status, 403)
  assert.equal((await app.call('POST', '/api/dashboard/links/123/accept', { token: T.maya })).status, 404)
})

test('teacher <-> learner: invite into a group, ask to join, choose the group, leave a tutor group', async () => {
  const inv = await app.call('POST', '/api/teacher/links', { token: T.rao, body: { to: 'student', email: 'maya@kids.test', groupId: String(ids.group) } })
  assert.equal(inv.status, 201)
  assert.equal(inv.body.request.group.name, 'Fractions Club')
  // Not in the group before she says yes.
  assert.equal((await app.db.admin.collection('batches').findOne({ _id: ids.group })).studentIds.length, 0)
  assert.equal(await app.db.admin.collection('students').countDocuments({ email: 'maya@kids.test' }), 0)
  // Someone else's group id is a 404.
  assert.equal((await app.call('POST', '/api/teacher/links', { token: T.rao, body: { to: 'student', email: 'x@kids.test', groupId: String(oid()) } })).status, 404)

  const mine = await app.call('GET', '/api/dashboard/links', { token: T.maya })
  const r = mine.body.incoming.find((x) => x.kind === 'class')
  assert.equal(r.from.name, 'Ms Rao')
  const yes = await app.call('POST', `/api/dashboard/links/${r.id}/accept`, { token: T.maya })
  assert.equal(yes.status, 200)
  assert.equal(yes.body.joined, true)
  const st = await app.db.admin.collection('students').findOne({ email: 'maya@kids.test', orgId: ids.solo })
  assert.ok((await app.db.admin.collection('batches').findOne({ _id: ids.group })).studentIds.some((x) => String(x) === String(st._id)))
  assert.ok(await app.db.main.collection('notifications').findOne({ to: `teacher:${ids.rao}`, kind: 'link_request' }))

  // Leo asks Ms Rao by email; she picks the group (she only has one, so it's that one).
  const ask = await app.call('POST', '/api/dashboard/links', { token: T.leo, body: { to: 'teacher', email: 'rao@tutor.test' } })
  assert.equal(ask.status, 201)
  const tin = await app.call('GET', '/api/teacher/links', { token: T.rao })
  assert.equal(tin.body.incoming.length, 1)
  assert.equal(tin.body.groups.length, 1)
  const take = await app.call('POST', `/api/teacher/links/${tin.body.incoming[0].id}/accept`, { token: T.rao, body: { groupId: String(ids.group) } })
  assert.equal(take.status, 200)
  assert.equal(take.body.group.name, 'Fractions Club')
  const leoOut = await app.call('GET', '/api/dashboard/links', { token: T.leo })
  assert.equal(leoOut.body.outgoing.find((x) => x.kind === 'class').status, 'accepted')

  const people = await app.call('GET', '/api/dashboard/links/people', { token: T.leo })
  assert.equal(people.body.classes.length, 1)
  assert.equal(people.body.classes[0].teacher, 'Ms Rao')
  assert.equal(people.body.classes[0].canLeave, true)
  assert.equal((await app.call('POST', '/api/dashboard/links/people/unlink', { token: T.leo, body: { type: 'class', id: people.body.classes[0].id } })).status, 200)
  assert.equal((await app.call('GET', '/api/dashboard/links/people', { token: T.leo })).body.classes.length, 0)

  // A learner can decline a teacher too.
  const inv2 = await app.call('POST', '/api/teacher/links', { token: T.rao, body: { to: 'student', email: 'leo@kids.test', groupId: String(ids.group) } })
  assert.equal((await app.call('POST', `/api/dashboard/links/${inv2.body.request.id}/decline`, { token: T.leo })).status, 200)
  const out = await app.call('GET', '/api/teacher/links', { token: T.rao })
  assert.equal(out.body.outgoing.find((x) => x.id === inv2.body.request.id).status, 'declined')
})

test('school <-> teacher: a school invites someone with no account; they accept on /teach with Google', async () => {
  const inv = await app.call('POST', '/api/admin/links', { token: T.head, body: { to: 'teacher', email: 'new.teacher@mail.test', name: 'Ms New' } })
  assert.equal(inv.status, 201)
  assert.equal(inv.body.request.org.name, 'Sunrise School')
  assert.ok((await outbox({ to: 'new.teacher@mail.test', kind: 'link_request' })).length)
  assert.equal(await app.db.admin.collection('tutors').countDocuments({ email: 'new.teacher@mail.test' }), 0, 'nothing before Accept')

  const tok = idToken('uid-new', 'new.teacher@mail.test', 'Nina New')
  const signin = await app.call('POST', '/api/teacher/auth/google', { body: { idToken: tok } })
  assert.equal(signin.status, 404)
  assert.equal(signin.body.pendingInvites, 1)
  const hub = await app.call('POST', '/api/teacher/auth/invites', { body: { idToken: tok } })
  assert.equal(hub.status, 200)
  assert.equal(hub.body.hasWorkspace, false)
  assert.equal(hub.body.incoming.length, 1)
  // Someone else's Google account can't accept it.
  const stranger = idToken('uid-x', 'stranger@mail.test')
  assert.equal((await app.call('POST', `/api/teacher/auth/invites/${hub.body.incoming[0].id}/accept`, { body: { idToken: stranger } })).status, 404)
  assert.equal((await app.call('POST', `/api/teacher/auth/invites/${hub.body.incoming[0].id}/accept`, { body: {} })).status, 400)
  const acc = await app.call('POST', `/api/teacher/auth/invites/${hub.body.incoming[0].id}/accept`, { body: { idToken: tok } })
  assert.equal(acc.status, 200)
  assert.ok(acc.body.token)
  const tutor = await app.db.admin.collection('tutors').findOne({ email: 'new.teacher@mail.test', orgId: ids.school })
  assert.equal(tutor.authStatus, 'active')
  assert.equal((await app.call('GET', '/api/teacher/workspace', { token: acc.body.token })).status, 200)
  await wait(50)
  assert.ok(await app.db.main.collection('notifications').findOne({ to: `admin:${ids.head}`, kind: 'link_request' }))

  // A teacher asks to join a school (the admin's email); the admin accepts.
  const ask = await app.call('POST', '/api/teacher/links', { token: T.rao, body: { to: 'school', email: 'head@sunrise.test' } })
  assert.equal(ask.status, 201)
  const ain = await app.call('GET', '/api/admin/links', { token: T.head })
  assert.equal(ain.body.incoming.length, 1)
  assert.equal(ain.body.incoming[0].from.email, 'rao@tutor.test')
  assert.equal(await app.db.admin.collection('tutors').countDocuments({ email: 'rao@tutor.test', orgId: ids.school }), 0)
  assert.equal((await app.call('POST', `/api/admin/links/${ain.body.incoming[0].id}/accept`, { token: T.head })).status, 200)
  assert.equal(await app.db.admin.collection('tutors').countDocuments({ email: 'rao@tutor.test', orgId: ids.school }), 1)
  const raoOut = await app.call('GET', '/api/teacher/links', { token: T.rao })
  const done = raoOut.body.outgoing.find((x) => x.kind === 'staff')
  assert.equal(done.status, 'accepted')
  assert.equal(done.org.name, 'Sunrise School')
  // Asking again now says they already teach there.
  assert.equal((await app.call('POST', '/api/teacher/links', { token: T.rao, body: { to: 'school', email: 'head@sunrise.test' } })).status, 409)

  // Someone with only a Google account asks from /teach; the school declines.
  const lone = idToken('uid-lone', 'lone@mail.test', 'Lone Tutor')
  const j = await app.call('POST', '/api/teacher/auth/join-school', { body: { idToken: lone, email: 'head@sunrise.test' } })
  assert.equal(j.status, 201)
  const ain2 = await app.call('GET', '/api/admin/links', { token: T.head })
  const jr = ain2.body.incoming.find((x) => x.from.email === 'lone@mail.test')
  assert.equal((await app.call('POST', `/api/admin/links/${jr.id}/decline`, { token: T.head })).status, 200)
  const loneHub = await app.call('POST', '/api/teacher/auth/invites', { body: { idToken: lone } })
  assert.equal(loneHub.body.outgoing[0].status, 'declined')
})

test('school -> learner: the learner joins the school only after saying yes', async () => {
  const inv = await app.call('POST', '/api/admin/links', { token: T.head, body: { to: 'student', email: 'kid3@kids.test', name: 'Kid Three' } })
  assert.equal(inv.status, 201)
  assert.equal(await app.db.admin.collection('students').countDocuments({ email: 'kid3@kids.test' }), 0)
  const kid = app.tokens.student('kid3@kids.test', 'Kid Three')
  const r = (await app.call('GET', '/api/dashboard/links', { token: kid })).body.incoming[0]
  assert.equal(r.org.name, 'Sunrise School')
  assert.equal((await app.call('POST', `/api/dashboard/links/${r.id}/accept`, { token: kid })).status, 200)
  const st = await app.db.admin.collection('students').findOne({ email: 'kid3@kids.test', orgId: ids.school })
  assert.equal(st.status, 'active')
  // Already in: a second invitation is refused.
  assert.equal((await app.call('POST', '/api/admin/links', { token: T.head, body: { to: 'student', email: 'kid3@kids.test' } })).status, 409)
})

test('requests expire after 14 days', async () => {
  const sent = await app.call('POST', '/api/parent/links', { token: T.other, body: { to: 'student', email: 'late@kids.test', name: 'Late', age: 9 } })
  const exp = new Date(sent.body.request.expiresAt).getTime() - Date.now()
  assert.ok(exp > 13.9 * 86400000 && exp <= 14 * 86400000)
  await app.db.main.collection('linkrequests').updateOne({ _id: new mongoose.Types.ObjectId(sent.body.request.id) }, { $set: { expiresAt: new Date(Date.now() - 1000) } })
  const late = app.tokens.student('late@kids.test', 'Late')
  assert.equal((await app.call('GET', '/api/dashboard/links', { token: late })).body.incoming.length, 0)
  const acc = await app.call('POST', `/api/dashboard/links/${sent.body.request.id}/accept`, { token: late })
  assert.equal(acc.status, 410)
  const out = await app.call('GET', '/api/parent/links', { token: T.other })
  assert.equal(out.body.outgoing.find((x) => x.id === sent.body.request.id).status, 'expired')
  // An expired request doesn't block a fresh one.
  assert.equal((await app.call('POST', '/api/parent/links', { token: T.other, body: { to: 'student', email: 'late@kids.test', name: 'Late', age: 9 } })).status, 201)
})

test('sending is rate limited per sender', async () => {
  const pid = oid()
  await app.db.main.collection('parentaccounts').insertOne({ _id: pid, uid: 'p-busy', email: 'busy@family.test', name: 'Busy', plan: 'free' })
  const busy = app.tokens.parent(String(pid), 'busy@family.test')
  for (let i = 0; i < 20; i++) {
    const r = await app.call('POST', '/api/parent/links', { token: busy, body: { to: 'student', email: `kid${i}@many.test`, name: `Kid ${i}`, age: 8 } })
    assert.equal(r.status, 201, `request ${i}`)
  }
  const over = await app.call('POST', '/api/parent/links', { token: busy, body: { to: 'student', email: 'one-more@many.test', name: 'One more', age: 8 } })
  assert.equal(over.status, 429)
  assert.equal(over.body.code, 'RATE_LIMITED')
  // The refused request left no waiting child card behind.
  assert.equal(await app.db.main.collection('children').countDocuments({ parentId: pid, email: 'one-more@many.test' }), 0)
})

test('a new school is self-serve: approved at once, the Super Admin only oversees', async () => {
  const signin = await app.call('POST', '/api/admin/auth/google', { body: { idToken: idToken('uid-hill', 'head@hill.test', 'Hill Head') } })
  assert.equal(signin.status, 200)
  const reg = await app.call('POST', '/api/admin/org', { token: signin.body.token, body: { name: 'Hill School', type: 'school', designation: 'principal' } })
  assert.equal(reg.status, 201)
  assert.equal(reg.body.org.status, 'approved')
  const sa = await app.db.superadmin.collection('organizations').findOne({ adminOrgId: String(reg.body.org._id) })
  assert.equal(sa.status, 'approved')
  assert.equal(sa.approvedBy, 'self-signup (free)')
  // Editing details doesn't send it back for approval.
  const edit = await app.call('POST', '/api/admin/org', { token: signin.body.token, body: { name: 'Hill Primary School', type: 'school', designation: 'principal' } })
  assert.equal(edit.body.org.status, 'approved')
  // The new school can invite a teacher straight away.
  assert.equal((await app.call('POST', '/api/admin/links', { token: signin.body.token, body: { to: 'teacher', email: 'teach@hill.test' } })).status, 201)
})
