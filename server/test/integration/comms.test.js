// The shared communication layer end to end, with several schools and parents:
// nothing reaches the wrong person, no email addresses leak, policies, limits,
// unsubscribe and idempotent digests all hold.
process.env.API_KEY_RATE_PER_MIN = '8'
const test = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const { start } = require('./harness')

let app, ids, T
const oid = () => new mongoose.Types.ObjectId()
const today = new Date().toISOString().slice(0, 10)
const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
async function until(fn, ms = 3000) { const end = Date.now() + ms; for (;;) { const v = await fn(); if (v || Date.now() > end) return v; await wait(50) } }
// The next Sunday / Monday / 1st of a month at a given UTC hour, as an ISO string.
function nextDow(dow, hour, from = new Date()) { const d = new Date(from); d.setUTCHours(hour, 0, 0, 0); while (d.getUTCDay() !== dow || d < from) d.setUTCDate(d.getUTCDate() + 1); return d.toISOString() }
const EMAILS = ['mum@family.test', 'dad@family.test', 'zed.parent@family.test', 'stranger@family.test', 'meera.parent@family.test', 't1@school-a.test', 't2@school-a.test', 'tb@school-b.test', 'head@school-a.test', 'head@school-b.test']

test.before(async () => {
  app = await start()
  const { admin, main, superadmin } = app.db
  const orgA = oid(), orgB = oid(), orgC = oid()
  const batchA1 = oid(), batchA2 = oid(), batchB = oid(), batchC = oid()
  const tA1 = oid(), tA2 = oid(), tB = oid(), tC = oid()
  const adA = oid(), adB = oid(), adC = oid()
  const sAanya = oid(), sRavi = oid(), sZed = oid(), sMeera = oid()
  const P1 = oid(), P2 = oid(), P3 = oid(), P4 = oid(), P5 = oid()
  await admin.collection('organizations').insertMany([
    { _id: orgA, name: 'Sunrise', adminUid: 'a-A', adminEmail: 'head@school-a.test', kind: 'institute', status: 'approved', logoUrl: 'https://cdn.test/sunrise.png' },
    { _id: orgB, name: 'Riverside', adminUid: 'a-B', adminEmail: 'head@school-b.test', kind: 'institute', status: 'approved' },
    { _id: orgC, name: 'No Comms Academy', adminUid: 'a-C', adminEmail: 'c@school-c.test', kind: 'institute', status: 'approved' },
  ])
  await superadmin.collection('organizations').insertMany([
    { _id: oid(), name: 'Sunrise', adminOrgId: String(orgA), status: 'approved', subscriptionPlan: 'pro' },
    { _id: oid(), name: 'Riverside', adminOrgId: String(orgB), status: 'approved', subscriptionPlan: 'pro' },
    { _id: oid(), name: 'No Comms Academy', adminOrgId: String(orgC), status: 'approved', subscriptionPlan: 'pro', featureOverrides: ['-comms'] },
  ])
  await admin.collection('orgadmins').insertMany([
    { _id: adA, uid: 'a-A', email: 'head@school-a.test', name: 'Mrs Head', orgId: orgA },
    { _id: adB, uid: 'a-B', email: 'head@school-b.test', name: 'Mr Other', orgId: orgB },
    { _id: adC, uid: 'a-C', email: 'c@school-c.test', name: 'Ms C', orgId: orgC },
  ])
  await admin.collection('tutors').insertMany([
    { _id: tA1, name: 'Mr Sharma', email: 't1@school-a.test', orgId: orgA, status: 'active' },
    { _id: tA2, name: 'Ms Iyer', email: 't2@school-a.test', orgId: orgA, status: 'active' },
    { _id: tB, name: 'Mr Brown', email: 'tb@school-b.test', orgId: orgB, status: 'active' },
    { _id: tC, name: 'Mr C', email: 'tc@school-c.test', orgId: orgC, status: 'active' },
  ])
  await admin.collection('batches').insertMany([
    { _id: batchA1, name: 'Year 4 Maths', orgId: orgA, tutorIds: [tA1], directTutorIds: [tA1], subjects: [], status: 'active' },
    { _id: batchA2, name: 'Year 5 English', orgId: orgA, tutorIds: [tA2], directTutorIds: [tA2], subjects: [], status: 'active' },
    { _id: batchB, name: 'Riverside 4', orgId: orgB, tutorIds: [tB], directTutorIds: [tB], subjects: [], status: 'active' },
    { _id: batchC, name: 'C group', orgId: orgC, tutorIds: [tC], directTutorIds: [tC], subjects: [], status: 'active' },
  ])
  await admin.collection('students').insertMany([
    { _id: sAanya, name: 'Aanya Rao', email: 'aanya@kids.test', grade: 'Year 4', orgId: orgA, batchIds: [batchA1], status: 'active' },
    { _id: sMeera, name: 'Meera Khan', email: 'meera@kids.test', grade: 'Year 4', orgId: orgA, batchIds: [batchA1], status: 'active' },
    { _id: sRavi, name: 'Ravi Kumar', email: 'ravi@kids.test', grade: 'Year 5', orgId: orgA, batchIds: [batchA2], status: 'active' },
    { _id: sZed, name: 'Zed Young', email: 'zed@kids.test', grade: 'Year 4', orgId: orgB, batchIds: [batchB], status: 'active' },
  ])
  await main.collection('parentaccounts').insertMany([
    { _id: P1, uid: 'p1', email: 'mum@family.test', name: 'Priya Rao', plan: 'free' },
    { _id: P2, uid: 'p2', email: 'dad@family.test', name: 'Dev Kumar', plan: 'free' },
    { _id: P3, uid: 'p3', email: 'zed.parent@family.test', name: 'Zoe Young', plan: 'family_plus' },
    { _id: P4, uid: 'p4', email: 'stranger@family.test', name: 'Stranger', plan: 'free' },
    { _id: P5, uid: 'p5', email: 'meera.parent@family.test', name: 'Mina Khan', plan: 'free' },
  ])
  const kids = await main.collection('children').insertMany([
    { parentId: P1, name: 'Aanya', age: 9, email: 'aanya@kids.test', linkStatus: 'verified' },
    { parentId: P2, name: 'Ravi', age: 10, email: 'ravi@kids.test', linkStatus: 'pending' },
    { parentId: P3, name: 'Zed', age: 9, email: 'zed@kids.test', linkStatus: 'verified' },
    { parentId: P4, name: 'Aanya', age: 9, email: 'aanya@kids.test', linkStatus: 'pending' },
    { parentId: P5, name: 'Meera', age: 9, email: 'meera@kids.test', linkStatus: 'verified' },
  ])
  // Learning in the last two weeks for Aanya, Ravi and Zed.
  const days = []
  for (let i = 0; i < 14; i++) {
    const date = addDays(today, -i)
    for (const [email, n] of [['aanya@kids.test', 20], ['ravi@kids.test', 12], ['zed@kids.test', 8]]) {
      days.push({ email, date, minutes: 15, sessions: 1, answered: n, correct: Math.round(n * 0.7), firstTry: 5, byModuleSubject: { listen_english: { answered: n, correct: Math.round(n * 0.7), minutes: 15 } }, byHour: { 17: n }, devices: { phone: n } })
    }
  }
  await main.collection('learnerdays').insertMany(days)
  const s = (x) => String(x)
  ids = { orgA: s(orgA), orgB: s(orgB), orgC: s(orgC), batchA1: s(batchA1), batchA2: s(batchA2), batchB: s(batchB), tA1: s(tA1), tA2: s(tA2), tB: s(tB), tC: s(tC), adA: s(adA), adB: s(adB), adC: s(adC), sAanya: s(sAanya), sRavi: s(sRavi), sZed: s(sZed), sMeera: s(sMeera), P1: s(P1), P2: s(P2), P3: s(P3), P4: s(P4), P5: s(P5), childAanya: s(kids.insertedIds[0]), childRavi: s(kids.insertedIds[1]), childZed: s(kids.insertedIds[2]), childAanyaStranger: s(kids.insertedIds[3]) }
  const t = app.tokens
  T = {
    P1: t.parent(ids.P1, 'mum@family.test'), P2: t.parent(ids.P2, 'dad@family.test'), P3: t.parent(ids.P3, 'zed.parent@family.test'), P4: t.parent(ids.P4, 'stranger@family.test'), P5: t.parent(ids.P5, 'meera.parent@family.test'),
    tA1: t.teacher(ids.tA1, ids.orgA), tA2: t.teacher(ids.tA2, ids.orgA), tB: t.teacher(ids.tB, ids.orgB), tC: t.teacher(ids.tC, ids.orgC),
    adA: t.admin(ids.adA, ids.orgA, 'a-A'), adB: t.admin(ids.adB, ids.orgB, 'a-B'), adC: t.admin(ids.adC, ids.orgC, 'a-C'), sa: t.superadmin(),
  }
})
test.after(async () => { await app?.stop() })

const noEmails = (body, label) => { const s = JSON.stringify(body); for (const e of EMAILS) assert.ok(!s.includes(e), `${label}: leaked ${e}`) }
const outbox = (q = {}) => app.db.main.collection('outboxes').find(q).toArray()
const setPolicy = (orgId, messaging) => app.db.admin.collection('orgpolicies').updateOne({ orgId: new mongoose.Types.ObjectId(orgId) }, { $set: { messaging } }, { upsert: true })

// ── Messaging ─────────────────────────────────────────────────────────────────

test('contacts come only from verified links, and never show an email address', async () => {
  const c = await app.call('GET', '/api/messages/contacts', { token: T.P1 })
  assert.equal(c.status, 200)
  const keys = c.body.items.map((x) => x.key).sort()
  assert.deepEqual(keys, [`admin:${ids.adA}`, `teacher:${ids.tA1}`].sort())
  assert.equal(c.body.items.find((x) => x.role === 'teacher').childName, 'Aanya')
  noEmails(c.body, 'parent contacts')
  // pending link: nobody to write to; the stranger claiming Aanya too
  assert.equal((await app.call('GET', '/api/messages/contacts', { token: T.P2 })).body.items.length, 0)
  assert.equal((await app.call('GET', '/api/messages/contacts', { token: T.P4 })).body.items.length, 0)
  // teacher sees parents of their own students only (verified), plus the school office
  const tc = await app.call('GET', '/api/messages/contacts', { token: T.tA1 })
  assert.deepEqual(tc.body.items.map((x) => x.key).sort(), [`admin:${ids.adA}`, `parent:${ids.P1}`, `parent:${ids.P5}`].sort())
  assert.equal(tc.body.items.find((x) => x.role === 'parent').canStart, false, 'default policy: parents start')
  noEmails(tc.body, 'teacher contacts')
  const ac = await app.call('GET', '/api/messages/contacts', { token: T.adB })
  assert.deepEqual(ac.body.items.map((x) => x.key).sort(), [`parent:${ids.P3}`, `teacher:${ids.tB}`].sort())
  assert.equal((await app.call('GET', '/api/messages/contacts', { token: T.sa })).status, 403)
})

test('a parent can only start a conversation with a teacher of their verified child', async () => {
  const to = (k) => ({ to: k, body: 'Hello!' })
  assert.equal((await app.call('POST', '/api/messages/threads', { token: T.P1, body: to(`teacher:${ids.tA2}`) })).status, 404, "Ravi's teacher, not Aanya's")
  assert.equal((await app.call('POST', '/api/messages/threads', { token: T.P1, body: to(`teacher:${ids.tB}`) })).status, 404, 'another school')
  assert.equal((await app.call('POST', '/api/messages/threads', { token: T.P2, body: to(`teacher:${ids.tA2}`) })).status, 404, 'unverified link')
  assert.equal((await app.call('POST', '/api/messages/threads', { token: T.P4, body: to(`teacher:${ids.tA1}`) })).status, 404, 'stranger with a pending link')
  assert.equal((await app.call('POST', '/api/messages/threads', { token: T.P1, body: to(`parent:${ids.P5}`) })).status, 403, 'parent to parent')
  assert.equal((await app.call('POST', '/api/messages/threads', { token: T.P1, body: { to: `teacher:${ids.tA1}`, body: '   ' } })).status, 400)
  assert.equal((await app.call('POST', '/api/messages/threads', { token: T.P1, body: { to: 'nonsense', body: 'x' } })).status, 400)

  const r = await app.call('POST', '/api/messages/threads', { token: T.P1, body: { to: `teacher:${ids.tA1}`, subject: 'Homework', body: 'Hi Mr Sharma, Aanya found the fractions hard.' } })
  assert.equal(r.status, 201)
  assert.equal(r.body.thread.childName, 'Aanya Rao')
  assert.equal(r.body.thread.with.name, 'Mr Sharma')
  noEmails(r.body, 'start thread')
  ids.thread1 = r.body.thread.id
  // The same pair about the same child reuses the conversation.
  const again = await app.call('POST', '/api/messages/threads', { token: T.P1, body: { to: `teacher:${ids.tA1}`, body: 'One more thing.' } })
  assert.equal(again.body.thread.id, ids.thread1)

  // Teacher: unread, bell notification of kind message
  const list = await app.call('GET', '/api/messages/threads', { token: T.tA1 })
  assert.equal(list.body.items.length, 1)
  assert.equal(list.body.items[0].unread, 2)
  assert.equal(list.body.items[0].with.name, 'Priya Rao')
  noEmails(list.body, 'teacher threads')
  assert.equal((await app.call('GET', '/api/messages/unread-count', { token: T.tA1 })).body.count, 2)
  const bell = await app.call('GET', '/api/notifications', { token: T.tA1 })
  assert.ok(bell.body.items.some((n) => n.kind === 'message' && n.title.includes('Priya Rao')))
  // Nobody else can read it
  for (const tok of [T.tA2, T.adA, T.adB, T.P4, T.P5]) assert.equal((await app.call('GET', `/api/messages/threads/${ids.thread1}/messages`, { token: tok })).status, 404)
})

test('read receipts: the parent sees when the teacher has read, and the teacher can reply', async () => {
  const before = await app.call('GET', `/api/messages/threads/${ids.thread1}/messages`, { token: T.P1 })
  assert.ok(before.body.items.every((m) => m.fromMe && m.read === false))
  const opened = await app.call('GET', `/api/messages/threads/${ids.thread1}/messages`, { token: T.tA1 })
  assert.equal(opened.body.items.length, 2)
  assert.equal((await app.call('GET', '/api/messages/unread-count', { token: T.tA1 })).body.count, 0)
  const rep = await app.call('POST', `/api/messages/threads/${ids.thread1}/messages`, { token: T.tA1, body: { body: 'Thanks, we will practise in class.' } })
  assert.equal(rep.status, 201)
  const after = await app.call('GET', `/api/messages/threads/${ids.thread1}/messages`, { token: T.P1 })
  assert.ok(after.body.items.filter((m) => m.fromMe).every((m) => m.read === true))
  assert.equal(after.body.items.at(-1).fromMe, false)
  // pagination
  const page = await app.call('GET', `/api/messages/threads/${ids.thread1}/messages?limit=2`, { token: T.P1 })
  assert.equal(page.body.items.length, 2)
  assert.ok(page.body.nextBefore)
  const older = await app.call('GET', `/api/messages/threads/${ids.thread1}/messages?limit=2&before=${encodeURIComponent(page.body.nextBefore)}`, { token: T.P1 })
  assert.equal(older.body.items.length, 1)
})

test('school policy: parents start by default; "both" lets teachers start; "off" stops everything', async () => {
  const start = (tok, to) => app.call('POST', '/api/messages/threads', { token: tok, body: { to, body: 'Hello from school' } })
  const r = await start(T.tA1, `parent:${ids.P5}`)
  assert.equal(r.status, 403)
  assert.equal(r.body.code, 'PARENT_STARTS')
  // the admin may start with a parent of their school, but not another school's admin
  assert.equal((await start(T.adA, `parent:${ids.P1}`)).status, 201)
  assert.equal((await start(T.adB, `parent:${ids.P1}`)).status, 404)
  await setPolicy(ids.orgA, 'both')
  assert.equal((await start(T.tA1, `parent:${ids.P5}`)).status, 201)
  await setPolicy(ids.orgA, 'off')
  const off = await app.call('POST', `/api/messages/threads/${ids.thread1}/messages`, { token: T.P1, body: { body: 'Still there?' } })
  assert.equal(off.status, 403)
  assert.equal(off.body.code, 'MESSAGING_OFF')
  assert.equal((await app.call('GET', '/api/messages/contacts', { token: T.P1 })).body.items.length, 0)
  // staff can still talk to each other
  assert.equal((await start(T.tA1, `admin:${ids.adA}`)).status, 201)
  await setPolicy(ids.orgA, 'parent_starts')
  await app.db.admin.collection('orgpolicies').updateOne({ orgId: new mongoose.Types.ObjectId(ids.orgA) }, { $set: { officeHours: 'Mon-Fri 00:00-00:01' } })
  const notice = await app.call('POST', `/api/messages/threads/${ids.thread1}/messages`, { token: T.P1, body: { body: 'Thanks!' } })
  assert.equal(notice.status, 201)
  assert.equal(notice.body.notice.outsideOfficeHours, true)
  await app.db.admin.collection('orgpolicies').updateOne({ orgId: new mongoose.Types.ObjectId(ids.orgA) }, { $set: { officeHours: '' } })
})

test('staff messaging stays inside the school, and needs the comms module', async () => {
  const start = (tok, to) => app.call('POST', '/api/messages/threads', { token: tok, body: { to, body: 'Staff note' } })
  assert.equal((await start(T.tA1, `admin:${ids.adB}`)).status, 404)
  assert.equal((await start(T.tB, `teacher:${ids.tA1}`)).status, 403, 'teacher to teacher is not a supported pair')
  assert.equal((await start(T.adA, `teacher:${ids.tB}`)).status, 404)
  const locked = await start(T.tC, `admin:${ids.adC}`)
  assert.equal(locked.status, 402)
  assert.equal(locked.body.code, 'MODULE_LOCKED')
})

test('attachments: images/PDF only, size-limited, served to participants only', async () => {
  const send = async (tok, file, type, name) => {
    const fd = new FormData()
    fd.append('body', 'See attached')
    fd.append('files', new Blob([file], { type }), name)
    const res = await fetch(`${app.url}/api/messages/threads/${ids.thread1}/messages`, { method: 'POST', headers: { authorization: `Bearer ${tok}` }, body: fd })
    return { status: res.status, body: await res.json() }
  }
  const ok = await send(T.tA1, Buffer.from('%PDF-1.4 tiny'), 'application/pdf', 'worksheet.pdf')
  assert.equal(ok.status, 201)
  const url = ok.body.message.attachments[0].url
  const get = (tok) => fetch(`${app.url}${url}`, { headers: { authorization: `Bearer ${tok}` } })
  const mine = await get(T.P1)
  assert.equal(mine.status, 200)
  assert.equal(mine.headers.get('content-type'), 'application/pdf')
  assert.equal((await get(T.tA2)).status, 404)
  assert.equal((await get(T.P4)).status, 404)
  assert.equal((await fetch(`${app.url}${url}`)).status, 401)
  const bad = await send(T.tA1, Buffer.from('#!/bin/sh'), 'text/x-shellscript', 'run.sh')
  assert.equal(bad.status, 400)
  const big = await send(T.tA1, Buffer.alloc(5 * 1024 * 1024 + 10), 'image/png', 'huge.png')
  assert.equal(big.status, 400)
})

test('abuse reports go to the right school, and a moderator can hide a message', async () => {
  const msgs = await app.call('GET', `/api/messages/threads/${ids.thread1}/messages`, { token: T.P1 })
  const theirs = msgs.body.items.find((m) => !m.fromMe)
  const mine = msgs.body.items.find((m) => m.fromMe)
  assert.equal((await app.call('POST', `/api/messages/${mine.id}/flag`, { token: T.P1, body: { reason: 'abuse' } })).status, 400)
  assert.equal((await app.call('POST', `/api/messages/${theirs.id}/flag`, { token: T.P4, body: { reason: 'abuse' } })).status, 404)
  assert.equal((await app.call('POST', `/api/messages/${theirs.id}/flag`, { token: T.P1, body: { reason: 'inappropriate', note: 'Not ok' } })).status, 201)
  const a = await app.call('GET', '/api/messages/flags', { token: T.adA })
  assert.equal(a.body.items.length, 1)
  assert.equal(a.body.items[0].reporter.name, 'Priya Rao')
  noEmails(a.body, 'flags')
  assert.equal((await app.call('GET', '/api/messages/flags', { token: T.adB })).body.items.length, 0)
  assert.equal((await app.call('GET', '/api/messages/flags', { token: T.tA1 })).status, 403)
  assert.equal((await app.call('GET', '/api/messages/flags', { token: T.sa })).body.items.length, 1)
  assert.equal((await app.call('POST', `/api/messages/flags/${a.body.items[0].id}`, { token: T.adB, body: { action: 'hide' } })).status, 404)
  assert.equal((await app.call('POST', `/api/messages/flags/${a.body.items[0].id}`, { token: T.adA, body: { action: 'hide' } })).status, 200)
  const after = await app.call('GET', `/api/messages/threads/${ids.thread1}/messages`, { token: T.P1 })
  const hidden = after.body.items.find((m) => m.id === theirs.id)
  assert.equal(hidden.hidden, true)
  assert.equal(hidden.body, '')
  assert.ok(await app.db.main.collection('auditevents').findOne({ action: 'message.flag.hide' }))
})

test('messaging metrics for admins: counts and reply times, never content, own school only', async () => {
  const m = await app.call('GET', '/api/admin/messaging/metrics', { token: T.adA })
  assert.equal(m.status, 200)
  assert.ok(m.body.messages.total >= 5)
  assert.ok(m.body.threads.startedByParents >= 1)
  assert.equal(m.body.threads.replied >= 1, true)
  assert.ok(m.body.replyTime.medianHours != null)
  const s = JSON.stringify(m.body)
  assert.ok(!s.includes('fractions') && !s.includes('practise in class'), 'no message content')
  noEmails(m.body, 'metrics')
  const b = await app.call('GET', '/api/admin/messaging/metrics', { token: T.adB })
  assert.equal(b.body.messages.total, 0)
  assert.equal((await app.call('GET', '/api/admin/messaging/metrics', { token: T.tA1 })).status, 401)
})

test('rate limits stop message floods', async () => {
  const t = await app.call('POST', '/api/messages/threads', { token: T.adB, body: { to: `teacher:${ids.tB}`, body: 'start' } })
  assert.equal(t.status, 201)
  let last
  for (let i = 0; i < 22; i++) last = await app.call('POST', `/api/messages/threads/${t.body.thread.id}/messages`, { token: T.adB, body: { body: `spam ${i}` } })
  assert.equal(last.status, 429)
  assert.equal(last.body.code, 'RATE_LIMITED')
})

// ── Notifications and preferences ────────────────────────────────────────────

test('notification preferences: off stops the bell, digest defers the email, instant emails now', async () => {
  const g = await app.call('GET', '/api/notification-prefs', { token: T.P5 })
  assert.equal(g.status, 200)
  assert.equal(g.body.kinds.find((k) => k.kind === 'message').mode, 'instant')
  assert.ok(!g.body.kinds.some((k) => k.kind === 'teacher_summary'), 'parents only see kinds that apply to them')
  assert.equal((await app.call('PUT', '/api/notification-prefs', { token: T.P5, body: { kinds: { nope: 'off' } } })).status, 400)
  assert.equal((await app.call('PUT', '/api/notification-prefs', { token: T.P5, body: { kinds: { message: 'loud' } } })).status, 400)
  assert.equal((await app.call('PUT', '/api/notification-prefs', { token: T.P5, body: { kinds: { security: 'off' } } })).body.kinds.find((k) => k.kind === 'security').mode, 'instant', 'locked kinds stay on')

  // The teacher writes to Meera's parent three times under three settings.
  await setPolicy(ids.orgA, 'both')
  const send = (text) => app.call('POST', '/api/messages/threads', { token: T.tA1, body: { to: `parent:${ids.P5}`, body: text } })
  const bell = async () => (await app.call('GET', '/api/notifications?limit=100', { token: T.P5 })).body.items.filter((n) => n.kind === 'message').length
  const mails = async () => (await outbox({ to: 'meera.parent@family.test', kind: 'notify:message' })).length

  await app.call('PUT', '/api/notification-prefs', { token: T.P5, body: { kinds: { message: 'off' } } })
  await wait(400)   // emails from earlier tests go out in the background; let them land first
  const b0 = await bell(), m0 = await mails()
  assert.equal((await send('one')).status, 201)
  await wait(150)
  assert.equal(await bell(), b0, 'off: no bell entry')
  assert.equal(await mails(), m0, 'off: no email')

  await app.call('PUT', '/api/notification-prefs', { token: T.P5, body: { kinds: { message: 'digest' } } })
  await send('two')
  await wait(150)
  assert.equal(await bell(), b0 + 1)
  assert.equal(await mails(), m0, 'digest: email waits')
  assert.ok(await app.db.main.collection('notifications').findOne({ to: `parent:${ids.P5}`, email: 'digest' }))

  await app.call('PUT', '/api/notification-prefs', { token: T.P5, body: { kinds: { message: 'instant' } } })
  await send('three')
  assert.ok(await until(async () => (await mails()) === m0 + 1), 'instant: emailed')
  const mail = (await outbox({ to: 'meera.parent@family.test', kind: 'notify:message' })).pop()
  assert.ok(mail.html.includes('/api/notification-prefs/unsubscribe?t='))
  assert.ok(!mail.html.includes('t1@school-a.test'), "the teacher's address is not in the email")
  await setPolicy(ids.orgA, 'parent_starts')

  // The daily digest job sends the deferred one once.
  const run = (now) => app.call('POST', '/api/jobs/notification_daily/run', { token: T.sa, body: { now } })
  const evening = new Date(); evening.setUTCHours(18, 0, 0, 0)
  assert.equal((await run(evening.toISOString())).status, 200)
  const daily = await outbox({ to: 'meera.parent@family.test', kind: 'digest:daily' })
  assert.equal(daily.length, 1)
  await run(evening.toISOString())
  assert.equal((await outbox({ to: 'meera.parent@family.test', kind: 'digest:daily' })).length, 1, 'once a day')
})

test('notification list pages with nextBefore', async () => {
  const now = Date.now()
  await app.db.main.collection('notifications').insertMany(Array.from({ length: 5 }, (_, i) => ({ to: `parent:${ids.P2}`, kind: 'other', title: `n${i}`, body: '', link: '', readAt: null, email: '', createdAt: new Date(now - i * 1000), updatedAt: new Date() })))
  const p1 = await app.call('GET', '/api/notifications?limit=2', { token: T.P2 })
  assert.equal(p1.body.items.length, 2)
  const p2 = await app.call('GET', `/api/notifications?limit=2&before=${encodeURIComponent(p1.body.nextBefore)}`, { token: T.P2 })
  assert.deepEqual(p2.body.items.map((n) => n.title), ['n2', 'n3'])
})

// ── Announcements ────────────────────────────────────────────────────────────

test('announcements reach exactly the audience the author may address', async () => {
  const post = (tok, audience, extra = {}) => app.call('POST', '/api/announcements', { token: tok, body: { title: 'Trip on Friday', body: 'Bring a packed lunch.', audience, ...extra } })
  assert.equal((await post(T.tA1, { type: 'org' })).status, 403)
  assert.equal((await post(T.tA1, { type: 'group', ids: [ids.batchA2] })).status, 404, 'not their group')
  assert.equal((await post(T.adB, { type: 'group', ids: [ids.batchA1] })).status, 404, "another school's group")
  assert.equal((await post(T.P1, { type: 'group', ids: [ids.batchA1] })).status, 403)
  assert.equal((await post(T.tC, { type: 'group', ids: [] })).status, 402)

  const dry = await post(T.tA1, { type: 'group', ids: [ids.batchA1] }, { dryRun: true })
  assert.equal(dry.body.recipients, 2, 'Aanya and Meera\'s verified parents (the teacher is the author)')
  const r = await post(T.tA1, { type: 'group', ids: [ids.batchA1] })
  assert.equal(r.status, 201)
  assert.equal(r.body.announcement.status, 'sent')
  ids.ann1 = r.body.announcement.id
  const receipts = await app.db.main.collection('announcementreceipts').find({ announcementId: new mongoose.Types.ObjectId(ids.ann1) }).toArray()
  assert.deepEqual(receipts.map((x) => x.to).sort(), [`parent:${ids.P1}`, `parent:${ids.P5}`].sort())
  for (const [tok, n] of [[T.P1, 1], [T.P5, 1], [T.P4, 0], [T.P2, 0], [T.P3, 0]]) {
    assert.equal((await app.call('GET', '/api/announcements', { token: tok })).body.items.length, n)
  }
  const bell = await app.call('GET', '/api/notifications', { token: T.P1 })
  assert.ok(bell.body.items.some((n) => n.kind === 'announcement' && n.title === 'Trip on Friday'))

  // grade parents: Ravi's link is pending, so nobody; staff only: both teachers (the admin is the author)
  assert.equal((await post(T.adA, { type: 'grade_parents', grade: 'Year 5' }, { dryRun: true })).body.recipients, 0)
  assert.equal((await post(T.adA, { type: 'grade_parents', grade: 'Year 4' }, { dryRun: true })).body.recipients, 2)
  const staff = await post(T.adA, { type: 'staff' })
  assert.equal(staff.body.announcement.recipientCount, 2)
  assert.equal((await post(T.adA, { type: 'org' }, { dryRun: true })).body.recipients, 4, '2 teachers + 2 verified parents')
  // Units: an id that is not one of this school's units is refused; a real unit reaches its groups.
  assert.equal((await post(T.adA, { type: 'unit', ids: [ids.batchA1] })).status, 404)
  const unitId = new mongoose.Types.ObjectId()
  const batchA1 = await app.db.admin.collection('batches').findOne({ _id: new mongoose.Types.ObjectId(ids.batchA1) })
  await app.db.admin.collection('orgunits').insertOne({ _id: unitId, orgId: batchA1.orgId, parentId: null, type: 'grade', name: 'Year 4', path: `/${unitId}`, depth: 0, order: 0, archivedAt: null })
  await app.db.admin.collection('batches').updateOne({ _id: batchA1._id }, { $set: { unitId } })
  const viaUnit = await post(T.adA, { type: 'unit', ids: [String(unitId)] }, { dryRun: true })
  const viaGroup = await post(T.adA, { type: 'group', ids: [ids.batchA1] }, { dryRun: true })
  assert.equal(viaUnit.status, 200)
  assert.equal(viaUnit.body.recipients, viaGroup.body.recipients)
  assert.ok(viaUnit.body.recipients > 0)
  assert.equal((await post(T.adB, { type: 'unit', ids: [String(unitId)] }, { dryRun: true })).status, 404, "another school's unit")

  // super admin: segment of parents on Family Plus only
  const seg = await post(T.sa, { type: 'segment', roles: ['parent'], plans: ['family_plus'] }, { dryRun: true })
  assert.equal(seg.body.recipients, 1)
  assert.equal((await post(T.sa, { type: 'platform', roles: ['teacher'] }, { dryRun: true })).body.recipients, 4)
  assert.equal((await post(T.adA, { type: 'platform' })).status, 403)
})

test('read receipts and read-rate report; scheduled and expired announcements', async () => {
  assert.equal((await app.call('POST', `/api/announcements/${ids.ann1}/read`, { token: T.P1 })).status, 200)
  const rep = await app.call('GET', `/api/announcements/${ids.ann1}/report`, { token: T.tA1 })
  assert.equal(rep.status, 200)
  assert.equal(rep.body.total, 2)
  assert.equal(rep.body.read, 1)
  assert.equal(rep.body.readRate, 50)
  assert.deepEqual(rep.body.notYetRead.map((x) => x.name), ['Mina Khan'])
  noEmails(rep.body, 'report')
  assert.equal((await app.call('GET', `/api/announcements/${ids.ann1}/report`, { token: T.adA })).status, 200, 'the school admin')
  for (const tok of [T.tA2, T.adB, T.P1]) assert.equal((await app.call('GET', `/api/announcements/${ids.ann1}/report`, { token: tok })).status, 404)
  const sent = await app.call('GET', '/api/announcements/sent', { token: T.tA1 })
  assert.equal(sent.body.items[0].readRate, 50)

  const future = new Date(Date.now() + 3 * 86400000).toISOString()
  const s = await app.call('POST', '/api/announcements', { token: T.tA1, body: { title: 'Later', body: 'Scheduled note', audience: { type: 'group', ids: [ids.batchA1] }, publishAt: future } })
  assert.equal(s.body.announcement.status, 'scheduled')
  assert.equal((await app.call('GET', '/api/announcements', { token: T.P5 })).body.items.some((a) => a.title === 'Later'), false)
  await app.call('POST', '/api/jobs/announcements/run', { token: T.sa, body: { now: new Date(Date.now() + 4 * 86400000).toISOString() } })
  assert.equal((await app.call('GET', '/api/announcements', { token: T.P5 })).body.items.some((a) => a.title === 'Later'), true)

  const e = await app.call('POST', '/api/announcements', { token: T.tA1, body: { title: 'Soon gone', body: 'x', audience: { type: 'group', ids: [ids.batchA1] }, expiresAt: new Date(Date.now() + 400).toISOString() } })
  assert.equal(e.status, 201)
  await wait(500)
  assert.equal((await app.call('GET', '/api/announcements', { token: T.P5 })).body.items.some((a) => a.title === 'Soon gone'), false)
  assert.equal((await app.call('POST', '/api/announcements', { token: T.tA1, body: { title: 'x', body: 'y', audience: { type: 'group', ids: [ids.batchA1] }, link: 'javascript:alert(1)' } })).status, 400)
})

// ── Digests and the scheduler ────────────────────────────────────────────────

test('weekly parent digest: Sunday evening, verified children only, once per week, unsubscribe honoured', async () => {
  const run = (now) => app.call('POST', '/api/jobs/parent_weekly/run', { token: T.sa, body: { now } })
  // Counted from the start of today: on a Sunday evening after 19:00 UTC "the next Sunday" would be a
  // week away, past the learning seeded for the last 14 days (the digest covers the 7 days before it).
  const startOfToday = new Date(); startOfToday.setUTCHours(0, 0, 0, 0)
  const sunday = nextDow(0, 19, startOfToday)
  const saturday = new Date(new Date(sunday).getTime() - 86400000).toISOString()
  assert.equal((await run(saturday)).body.result.sent, 0, 'not on Saturday')
  const r = await run(sunday)
  assert.equal(r.status, 200)
  const mails = await outbox({ kind: 'digest:parent_weekly' })
  assert.deepEqual(mails.map((m) => m.to).sort(), ['meera.parent@family.test', 'mum@family.test', 'zed.parent@family.test'].sort())
  const mum = mails.find((m) => m.to === 'mum@family.test')
  assert.match(mum.subject, /Aanya's week/)
  assert.ok(mum.html.includes('Time learning') && mum.html.includes('One idea for the week ahead'))
  assert.ok(!mum.html.includes('<style'), 'inline styles only')
  assert.ok(!mum.html.includes('Zed') && !mum.html.includes('Ravi'))
  const zed = mails.find((m) => m.to === 'zed.parent@family.test')
  assert.ok(zed.html.includes('Zed') && !zed.html.includes('Aanya'))
  assert.equal(mails.filter((m) => m.to === 'stranger@family.test' || m.to === 'dad@family.test').length, 0, 'pending links get nothing')

  // Idempotent: a second run (a restart), even two at once, in the same week sends nothing new.
  await Promise.all([run(sunday), run(sunday)])
  await run(new Date(new Date(sunday).getTime() + 3600000).toISOString())
  assert.equal((await outbox({ kind: 'digest:parent_weekly' })).length, 3)

  // One-tap unsubscribe from the email itself; tampered tokens fail.
  const link = zed.html.match(/href="([^"]*notification-prefs\/unsubscribe\?t=[^"]+)"/)[1].replace(/&amp;/g, '&')
  const path = link.slice(link.indexOf('/api/'))
  const bad = await fetch(`${app.url}${path.slice(0, -3)}xyz`)
  assert.equal(bad.status, 400)
  const ok = await fetch(`${app.url}${path}`)
  assert.equal(ok.status, 200)
  assert.match(await ok.text(), /unsubscribed/)
  const pref = await app.call('GET', '/api/notification-prefs', { token: T.P3 })
  assert.equal(pref.body.kinds.find((k) => k.kind === 'weekly_digest').mode, 'off')
  // Next week: Zed's parent gets nothing, the others do.
  await run(new Date(new Date(sunday).getTime() + 7 * 86400000).toISOString())
  const week2 = (await outbox({ kind: 'digest:parent_weekly' })).slice(3).map((m) => m.to).sort()
  assert.deepEqual(week2, ['meera.parent@family.test', 'mum@family.test'])
})

test('teacher Monday summary and admin monthly summary', async () => {
  const mon = nextDow(1, 8)
  const r = await app.call('POST', '/api/jobs/teacher_weekly/run', { token: T.sa, body: { now: mon } })
  assert.equal(r.status, 200)
  const t1 = (await outbox({ kind: 'digest:teacher_weekly', to: 't1@school-a.test' }))
  assert.equal(t1.length, 1)
  assert.ok(t1[0].html.includes('Year 4 Maths'))
  assert.ok(!t1[0].html.includes('Zed'), 'only their own learners')
  await app.call('POST', '/api/jobs/teacher_weekly/run', { token: T.sa, body: { now: mon } })
  assert.equal((await outbox({ kind: 'digest:teacher_weekly', to: 't1@school-a.test' })).length, 1)

  const d = new Date(); d.setUTCMonth(d.getUTCMonth() + 1, 1); d.setUTCHours(9, 0, 0, 0)
  await app.call('POST', '/api/jobs/admin_monthly/run', { token: T.sa, body: { now: d.toISOString() } })
  const heads = await outbox({ kind: 'digest:admin_monthly' })
  assert.ok(heads.some((m) => m.to === 'head@school-a.test' && m.subject.startsWith('Sunrise')))
  assert.equal((await app.call('POST', '/api/jobs/admin_monthly/run', { token: T.adA, body: {} })).status, 403)
  assert.equal((await app.call('POST', '/api/jobs/nope/run', { token: T.sa, body: {} })).status, 404)
  const st = await app.call('GET', '/api/jobs', { token: T.sa })
  assert.ok(st.body.jobs.find((j) => j.name === 'parent_weekly').lastRun)
})

// ── Reports and exports ──────────────────────────────────────────────────────

test('report data: same scopes as the dashboards, branded when the plan allows', async () => {
  const p = await app.call('GET', `/api/reports/parent/children/${ids.childAanya}`, { token: T.P1 })
  assert.equal(p.status, 200)
  assert.equal(p.body.report.kind, 'learner')
  assert.equal(p.body.report.totals.answered, 140)
  assert.ok(p.body.report.story.length > 10)
  assert.equal((await app.call('GET', `/api/reports/parent/children/${ids.childRavi}`, { token: T.P2 })).status, 403)
  assert.equal((await app.call('GET', `/api/reports/parent/children/${ids.childAanya}`, { token: T.P4 })).status, 404)
  assert.equal((await app.call('GET', `/api/reports/parent/children/${ids.childAanya}`, { token: T.tA1 })).status, 403)
  const g = await app.call('GET', `/api/reports/teacher/batches/${ids.batchA1}`, { token: T.tA1 })
  assert.equal(g.status, 200)
  assert.deepEqual(g.body.report.learners.map((l) => l.name).sort(), ['Aanya Rao', 'Meera Khan'])
  assert.equal(g.body.report.brand.logoUrl, 'https://cdn.test/sunrise.png')
  assert.equal((await app.call('GET', `/api/reports/teacher/batches/${ids.batchA1}`, { token: T.tA2 })).status, 404)
  const org = await app.call('GET', '/api/reports/admin/org', { token: T.adA })
  assert.equal(org.body.report.summary.learners, 3)
  assert.equal((await app.call('GET', `/api/reports/admin/batches/${ids.batchA1}`, { token: T.adB })).status, 404)
  assert.equal((await app.call('GET', `/api/reports/admin/students/${ids.sAanya}`, { token: T.adB })).status, 404)
})

test('CSV/XLSX exports: scoped, formula-safe and audited', async () => {
  const res = await fetch(`${app.url}/api/reports/admin/org/learners.export?format=csv`, { headers: { authorization: `Bearer ${T.adA}` } })
  assert.equal(res.status, 200)
  assert.match(res.headers.get('content-type'), /text\/csv/)
  const csv = await res.text()
  const lines = csv.trim().split('\r\n')
  assert.equal(lines.length, 4)
  assert.ok(lines[0].includes('Learner'))
  assert.ok(!csv.includes('zed@kids.test') && !csv.includes('Zed'))
  const ev = await app.db.main.collection('auditevents').findOne({ action: 'export.learners', orgId: ids.orgA })
  assert.equal(ev.meta.rows, 3)
  const x = await fetch(`${app.url}/api/reports/teacher/batches/${ids.batchA1}/learners.export?format=xlsx`, { headers: { authorization: `Bearer ${T.tA1}` } })
  assert.equal(x.status, 200)
  const buf = Buffer.from(await x.arrayBuffer())
  assert.equal(buf.slice(0, 2).toString(), 'PK')
  assert.equal((await fetch(`${app.url}/api/reports/teacher/batches/${ids.batchA1}/learners.export`, { headers: { authorization: `Bearer ${T.tB}` } })).status, 404)
})

test('API keys: module-gated, hashed, scoped, org-only, rate-limited and revocable', async () => {
  assert.equal((await app.call('POST', '/api/admin/api-keys', { token: T.adA, body: { name: 'MIS', scopes: ['learners:read'] } })).status, 402)
  await app.db.superadmin.collection('organizations').updateOne({ adminOrgId: ids.orgA }, { $set: { featureOverrides: ['api.export'] } })
  assert.equal((await app.call('POST', '/api/admin/api-keys', { token: T.adA, body: { name: 'MIS', scopes: [] } })).status, 400)
  const c = await app.call('POST', '/api/admin/api-keys', { token: T.adA, body: { name: 'MIS', scopes: ['learners:read'] } })
  assert.equal(c.status, 201)
  const key = c.body.key
  const stored = await app.db.main.collection('apikeys').findOne({})
  // The secret is base64url, so it can itself contain "_": take everything after "lk_<prefix>_".
  const secret = key.split('_').slice(2).join('_')
  assert.ok(secret.length >= 20 && !JSON.stringify(stored).includes(secret), 'only a hash is stored')
  const v1 = (path, k = key) => fetch(`${app.url}${path}`, { headers: { 'x-api-key': k } })
  const l = await v1('/api/v1/learners')
  assert.equal(l.status, 200)
  const body = await l.json()
  assert.deepEqual(body.data.map((s) => s.name).sort(), ['Aanya Rao', 'Meera Khan', 'Ravi Kumar'])
  assert.equal((await v1('/api/v1/daily-summaries')).status, 403, 'scope missing')
  assert.equal((await v1('/api/v1/learners', `${key.slice(0, -2)}xx`)).status, 401)
  assert.equal((await fetch(`${app.url}/api/v1/learners`)).status, 401)
  assert.equal((await app.call('GET', '/api/admin/api-keys', { token: T.adB })).status, 402)
  let last
  for (let i = 0; i < 10; i++) last = await v1('/api/v1/learners')
  assert.equal(last.status, 429)
  assert.equal((await app.call('DELETE', `/api/admin/api-keys/${c.body.apiKey.id}`, { token: T.adB })).status, 404)
  assert.equal((await app.call('DELETE', `/api/admin/api-keys/${c.body.apiKey.id}`, { token: T.adA })).status, 200)
  assert.equal((await v1('/api/v1/learners')).status, 401)
  const s = await app.call('POST', '/api/admin/api-keys', { token: T.adA, body: { name: 'BI', scopes: ['summaries:read'] } })
  const ds = await v1(`/api/v1/daily-summaries?from=${addDays(today, -2)}&to=${today}`, s.body.key)
  const dsb = await ds.json()
  assert.equal(dsb.total, 6, '2 learners with activity x 3 days, Zed excluded')
  assert.ok(dsb.data.every((d) => d.learnerId))
  assert.ok(await app.db.main.collection('auditevents').findOne({ action: 'apikey.create' }))
})

// ── Consent ──────────────────────────────────────────────────────────────────

test('consent records: parents for their own child, admins for their students, history is append-only', async () => {
  const give = await app.call('POST', '/api/consents', { token: T.P1, body: { childId: ids.childAanya, purpose: 'learning', status: 'given' } })
  assert.equal(give.status, 201)
  assert.equal((await app.call('POST', '/api/consents', { token: T.P1, body: { childId: ids.childAanya, purpose: 'nonsense' } })).status, 400)
  assert.equal((await app.call('POST', '/api/consents', { token: T.P4, body: { childId: ids.childAanya, purpose: 'learning' } })).status, 404)
  await app.call('POST', '/api/consents', { token: T.P1, body: { childId: ids.childAanya, purpose: 'learning', status: 'withdrawn' } })
  await app.call('POST', '/api/consents', { token: T.adA, body: { studentId: ids.sAanya, purpose: 'school_dpa' } })
  const h = await app.call('GET', `/api/consents?childId=${ids.childAanya}`, { token: T.P1 })
  assert.equal(h.body.items.length, 3)
  assert.equal(h.body.current.learning, 'withdrawn')
  assert.equal(h.body.current.school_dpa, 'given')
  noEmails(h.body, 'consent')
  assert.equal((await app.call('GET', `/api/consents?studentId=${ids.sAanya}`, { token: T.adA })).body.items.length, 3)
  assert.equal((await app.call('GET', `/api/consents?studentId=${ids.sAanya}`, { token: T.adB })).status, 404)
  assert.equal((await app.call('GET', `/api/consents?childId=${ids.childAanya}`, { token: T.tA1 })).status, 403)
})
