// Super admin console end to end (SUP-001..070): named staff with 2FA and
// roles, lockout and revoked sessions, read-only "view as" that can never
// write, the audit chain, the directory and org detail, suspension, people,
// analytics, health, flags, plans and billing, support and data rights.
const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('crypto')
const mongoose = require('mongoose')
const { start } = require('./harness')
const totp = require('../../utils/totp')
const stripe = require('../../services/billing/stripe')

const WEBHOOK_SECRET = 'whsec_test_only'
let app
let owner // the break-glass owner (legacy token, as before this work)
const ids = {}
const staff = {} // role -> { token, email, password, secret, id }
const oid = () => new mongoose.Types.ObjectId()
const today = new Date().toISOString().slice(0, 10)

async function login(email, password) { return app.call('POST', '/api/superadmin/auth/login', { body: { email, password } }) }

// Creates a staff member as the owner, then goes through the whole first sign-in.
async function onboard(role, name) {
  const email = `${role}@learnigo.test`
  const c = await app.call('POST', '/api/superadmin/staff', { token: owner, body: { email, name, role } })
  assert.equal(c.status, 200, JSON.stringify(c.body))
  const first = await login(email, c.body.temporaryPassword)
  assert.equal(first.body.step, 'setup')
  const setup = await app.call('POST', '/api/superadmin/auth/2fa/setup', { body: { setupToken: first.body.setupToken } })
  const password = `long-new-password-${role}`
  const enabled = await app.call('POST', '/api/superadmin/auth/2fa/enable', { body: { setupToken: first.body.setupToken, code: totp.totp(setup.body.secret), newPassword: password } })
  assert.equal(enabled.status, 200, JSON.stringify(enabled.body))
  staff[role] = { token: enabled.body.token, email, password, secret: setup.body.secret, id: c.body.staff.id, recoveryCodes: enabled.body.recoveryCodes }
  return staff[role]
}

test.before(async () => {
  app = await start({ env: { STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET, STAFF_LOGIN_IP_LIMIT: '500' } })
  owner = app.tokens.superadmin()
  const { admin: A, main: M, superadmin: S } = app.db
  const now = new Date()
  const orgA = oid(), orgB = oid(), orgC = oid(), adminA = oid(), adminB = oid(), tutorA = oid(), parentId = oid()
  await A.collection('organizations').insertMany([
    { _id: orgA, name: 'Sunrise Primary', adminEmail: 'head@sunrise.edu', adminUid: 'a-1', kind: 'institute', status: 'approved', createdAt: now, updatedAt: now },
    { _id: orgB, name: 'Ms Rao Tutoring', adminEmail: 'rao@tutor.test', adminUid: 'a-2', kind: 'solo', status: 'approved', createdAt: now, updatedAt: now },
    { _id: orgC, name: 'Maple Academy', adminEmail: 'maple.owner@gmail.com', adminUid: 'a-3', kind: 'institute', status: 'pending', createdAt: now, updatedAt: now },
  ])
  const sa = await S.collection('organizations').insertMany([
    { name: 'Sunrise Primary', adminEmail: 'head@sunrise.edu', adminUid: 'a-1', adminOrgId: String(orgA), status: 'approved', subscriptionPlan: 'pro', kind: 'institute', country: 'DE', featureOverrides: [], rejectionHistory: [], createdAt: now, updatedAt: now },
    { name: 'Ms Rao Tutoring', adminEmail: 'rao@tutor.test', adminUid: 'a-2', adminOrgId: String(orgB), status: 'approved', subscriptionPlan: 'free', kind: 'solo', featureOverrides: [], rejectionHistory: [], createdAt: now, updatedAt: now },
    { name: 'Maple Academy', adminEmail: 'maple.owner@gmail.com', adminUid: 'a-3', adminOrgId: String(orgC), status: 'pending', subscriptionPlan: 'free', phone: '', featureOverrides: [], rejectionHistory: [], createdAt: new Date(Date.now() - 50 * 3600_000), updatedAt: new Date(Date.now() - 50 * 3600_000) },
  ])
  await A.collection('orgadmins').insertMany([
    { _id: adminA, uid: 'a-1', email: 'head@sunrise.edu', name: 'Mrs Head', orgId: orgA, createdAt: now },
    { _id: adminB, uid: 'a-2', email: 'rao@tutor.test', name: 'Ms Rao', orgId: orgB, createdAt: now },
  ])
  await A.collection('tutors').insertOne({ _id: tutorA, name: 'Mr Sharma', email: 'sharma@sunrise.edu', uid: 't-1', orgId: orgA, batchIds: [], studentIds: [], status: 'active', authStatus: 'active', createdAt: now })
  const students = [
    { _id: oid(), name: 'Aanya', email: 'aanya@kids.test', orgId: orgA, batchIds: [], parentIds: [], status: 'active', createdAt: now },
    { _id: oid(), name: 'Ravi', email: 'ravi@kids.test', orgId: orgA, batchIds: [], parentIds: [], status: 'active', createdAt: now },
    { _id: oid(), name: 'Zed', email: 'zed@kids.test', orgId: orgB, batchIds: [], parentIds: [], status: 'active', createdAt: now },
  ]
  await A.collection('students').insertMany(students)
  await M.collection('parentaccounts').insertOne({ _id: parentId, uid: 'p-1', email: 'mum@family.test', name: 'Priya', plan: 'free', createdAt: now })
  await M.collection('children').insertOne({ _id: oid(), parentId, name: 'Mia', age: 8, email: 'mia@home.test', linkStatus: 'verified', createdAt: now })
  await M.collection('users').insertOne({ _id: oid(), name: 'Solo Kid', email: 'solo@home.test', passwordHash: 'x', createdAt: now })
  const day = (email, extra = {}) => ({ email, date: today, tz: 'Europe/Berlin', minutes: 12, sessions: 1, answered: 10, correct: 7, firstTry: 6, hints: 0, timeMsSum: 40000, timedCount: 10, xp: 30, stars: 7, byModuleSubject: { listen_english: { answered: 10, correct: 7, minutes: 12 } }, byHour: { 10: 10 }, devices: { tablet: 10 }, sources: { practice: 10 }, firstAt: now, lastAt: now, ...extra })
  await M.collection('learnerdays').insertMany([day('aanya@kids.test'), day('mia@home.test'), day('zed@kids.test', { date: '2020-01-01' })])
  // org A bought 1 seat but has 2 learners: over its limit.
  await S.collection('subscriptions').insertOne({ ownerType: 'org', ownerId: String(orgA), saOrgId: String(sa.insertedIds[0]), plan: 'institute', planVersion: 0, planSnapshot: null, status: 'active', seats: 1, currency: 'EUR', interval: 'month', priceCents: 300, invoices: [], history: [], createdAt: now, updatedAt: now })
  Object.assign(ids, { orgA: String(orgA), orgB: String(orgB), orgC: String(orgC), saA: String(sa.insertedIds[0]), saB: String(sa.insertedIds[1]), saC: String(sa.insertedIds[2]), adminA: String(adminA), adminB: String(adminB), tutorA: String(tutorA), parentId: String(parentId), studentA: String(students[0]._id), studentB: String(students[2]._id) })
})
test.after(async () => { await app?.stop() })

// ── SUP-001 staff, 2FA, roles ──────────────────────────────────────────────────
test('break-glass env login keeps working and is audited', async () => {
  const r = await login('root@example.com', 'x')
  assert.equal(r.status, 200)
  assert.ok(r.body.token)
  assert.equal(r.body.superadmin.staffRole, 'owner')
  assert.equal((await login('root@example.com', 'wrong')).status, 401)
  assert.equal((await login('', '')).status, 400)
  const me = await app.call('GET', '/api/superadmin/auth/me', { token: r.body.token })
  assert.equal(me.body.superadmin.breakGlass, true)
  const ev = await app.db.main.collection('auditevents').findOne({ action: 'staff.login.breakglass' })
  assert.ok(ev)
})

test('staff onboarding: temporary password, forced new password, TOTP set-up, recovery codes', async () => {
  const email = 'support@learnigo.test'
  const c = await app.call('POST', '/api/superadmin/staff', { token: owner, body: { email, name: 'Sam Support', role: 'support' } })
  assert.equal(c.status, 200)
  assert.equal((await app.call('POST', '/api/superadmin/staff', { token: owner, body: { email, name: 'Dup', role: 'support' } })).status, 409)
  assert.equal((await app.call('POST', '/api/superadmin/staff', { token: owner, body: { email: 'x@y.z', name: 'Bad', role: 'wizard' } })).status, 400)
  const first = await login(email, c.body.temporaryPassword)
  assert.equal(first.body.step, 'setup')
  assert.equal(first.body.mustChangePassword, true)
  assert.equal(first.body.token, undefined, 'no session before 2FA')
  // A challenge token is never a session token.
  assert.equal((await app.call('GET', '/api/superadmin/stats', { token: first.body.setupToken })).status, 403)
  const setup = await app.call('POST', '/api/superadmin/auth/2fa/setup', { body: { setupToken: first.body.setupToken } })
  assert.match(setup.body.otpauthUri, /^otpauth:\/\/totp\/Learnigo:/)
  const weak = await app.call('POST', '/api/superadmin/auth/2fa/enable', { body: { setupToken: first.body.setupToken, code: totp.totp(setup.body.secret), newPassword: 'short' } })
  assert.equal(weak.body.code, 'WEAK_PASSWORD')
  const wrong = await app.call('POST', '/api/superadmin/auth/2fa/enable', { body: { setupToken: first.body.setupToken, code: '000000', newPassword: 'a-much-longer-password' } })
  assert.equal(wrong.status, 401)
  const ok = await app.call('POST', '/api/superadmin/auth/2fa/enable', { body: { setupToken: first.body.setupToken, code: totp.totp(setup.body.secret), newPassword: 'a-much-longer-password' } })
  assert.equal(ok.status, 200)
  assert.equal(ok.body.recoveryCodes.length, 10)
  assert.equal(ok.body.superadmin.staffRole, 'support')
  staff.support = { token: ok.body.token, email, password: 'a-much-longer-password', secret: setup.body.secret, id: c.body.staff.id, recoveryCodes: ok.body.recoveryCodes }
  // The old temporary password no longer works.
  assert.equal((await login(email, c.body.temporaryPassword)).status, 401)
  const stored = await app.db.superadmin.collection('staffs').findOne({ email })
  assert.ok(!stored.totpSecret.includes(setup.body.secret), 'TOTP secret is stored sealed')
  assert.ok(stored.passwordHash.startsWith('$2'), 'bcrypt hash')
  assert.ok(stored.recoveryCodes.every((r) => r.hash.length === 64 && !ok.body.recoveryCodes.includes(r.hash)))
})

test('second sign-in needs a code; replays and used recovery codes are refused', async () => {
  const s = staff.support
  const r = await login(s.email, s.password)
  assert.equal(r.body.step, 'totp')
  assert.equal((await app.call('POST', '/api/superadmin/auth/2fa/verify', { body: { challengeToken: r.body.challengeToken, code: '123456' } })).status, 401)
  // The code used at set-up (same 30 s step) cannot be replayed...
  const replay = await app.call('POST', '/api/superadmin/auth/2fa/verify', { body: { challengeToken: r.body.challengeToken, code: totp.totp(s.secret) } })
  assert.equal(replay.status, 401)
  // ...but the next step's code is accepted (one step of drift).
  const next = await app.call('POST', '/api/superadmin/auth/2fa/verify', { body: { challengeToken: r.body.challengeToken, code: totp.totp(s.secret, Date.now() + 30_000) } })
  assert.equal(next.status, 200, JSON.stringify(next.body))
  const rc = s.recoveryCodes[0]
  const r2 = await login(s.email, s.password)
  const viaCode = await app.call('POST', '/api/superadmin/auth/2fa/verify', { body: { challengeToken: r2.body.challengeToken, recoveryCode: rc.toUpperCase() } })
  assert.equal(viaCode.status, 200)
  assert.equal(viaCode.body.recoveryCodesLeft, 9)
  const r3 = await login(s.email, s.password)
  assert.equal((await app.call('POST', '/api/superadmin/auth/2fa/verify', { body: { challengeToken: r3.body.challengeToken, recoveryCode: rc } })).status, 401)
  assert.equal((await app.call('POST', '/api/superadmin/auth/2fa/verify', { body: { challengeToken: 'junk', code: '123456' } })).body.code, 'CHALLENGE_EXPIRED')
})

test('roles gate the console; owners pass everything', async () => {
  await onboard('analyst', 'Ana Analyst')
  await onboard('engineer', 'Eli Engineer')
  await onboard('finance', 'Fay Finance')
  await onboard('content', 'Cal Content')
  const t = (r) => staff[r].token
  assert.equal((await app.call('GET', '/api/superadmin/staff', { token: t('support') })).status, 403)
  assert.equal((await app.call('GET', '/api/superadmin/staff', { token: owner })).status, 200)
  assert.equal((await app.call('GET', '/api/superadmin/ops/health', { token: t('support') })).status, 403)
  assert.equal((await app.call('GET', '/api/superadmin/ops/health', { token: t('engineer') })).status, 200)
  assert.equal((await app.call('GET', '/api/superadmin/directory', { token: t('support') })).status, 200)
  assert.equal((await app.call('GET', '/api/superadmin/directory', { token: t('content') })).status, 403)
  assert.equal((await app.call('POST', '/api/superadmin/view-as', { token: t('analyst'), body: {} })).status, 403)
  assert.equal((await app.call('GET', '/api/superadmin/platform/growth', { token: t('analyst') })).status, 200)
  assert.equal((await app.call('GET', '/api/superadmin/platform/revenue', { token: t('support') })).status, 403)
  assert.equal((await app.call('GET', '/api/superadmin/content/banks', { token: t('support') })).status, 403)
  assert.equal((await app.call('GET', '/api/superadmin/content/banks', { token: t('content') })).status, 200)
  assert.equal((await app.call('PUT', '/api/superadmin/billing/plans/institute', { token: t('support'), body: { reason: 'x' } })).status, 403)
  assert.equal((await app.call('GET', '/api/superadmin/support/inbox', { token: t('finance') })).status, 403)
  assert.equal((await app.call('GET', '/api/superadmin/stats')).status, 401)
  assert.equal((await app.call('GET', '/api/superadmin/stats', { token: app.tokens.admin(ids.adminA, ids.orgA, 'a-1') })).status, 401)
})

test('a role change applies at once; disabling and revoking end sessions', async () => {
  const a = staff.analyst
  assert.equal((await app.call('PATCH', `/api/superadmin/staff/${a.id}`, { token: owner, body: { role: 'support' } })).status, 200)
  assert.equal((await app.call('GET', '/api/superadmin/support/inbox', { token: a.token })).status, 200)
  await app.call('PATCH', `/api/superadmin/staff/${a.id}`, { token: owner, body: { role: 'analyst' } })
  assert.equal((await app.call('GET', '/api/superadmin/support/inbox', { token: a.token })).status, 403)
  // Revoke all of the analyst's sessions.
  await app.call('POST', `/api/superadmin/staff/${a.id}/revoke-sessions`, { token: owner })
  const after = await app.call('GET', '/api/superadmin/stats', { token: a.token })
  assert.equal(after.status, 401)
  assert.equal(after.body.code, 'SESSION_REVOKED')
  // Logout ends just that session.
  const e = staff.engineer
  assert.equal((await app.call('POST', '/api/superadmin/auth/logout', { token: e.token })).status, 200)
  assert.equal((await app.call('GET', '/api/superadmin/ops/health', { token: e.token })).status, 401)
  // A fresh sign-in for later tests.
  const r = await login(e.email, e.password)
  e.token = (await app.call('POST', '/api/superadmin/auth/2fa/verify', { body: { challengeToken: r.body.challengeToken, recoveryCode: e.recoveryCodes[0] } })).body.token
  // Keep at least one active owner; nobody disables themselves.
  assert.equal((await app.call('PATCH', `/api/superadmin/staff/${a.id}`, { token: owner, body: { status: 'disabled' } })).status, 200)
  assert.equal((await login(a.email, a.password)).status, 401)
})

test('lockout after 5 wrong passwords; the owner can unlock', async () => {
  const f = staff.finance
  for (let i = 0; i < 4; i++) assert.equal((await login(f.email, 'nope')).status, 401)
  const locked = await login(f.email, 'nope')
  assert.equal(locked.status, 423)
  assert.equal(locked.body.code, 'LOCKED')
  assert.equal((await login(f.email, f.password)).status, 423, 'even the right password while locked')
  assert.ok(await app.db.main.collection('auditevents').findOne({ action: 'staff.locked', targetId: f.id }))
  assert.equal((await app.call('POST', `/api/superadmin/staff/${f.id}/unlock`, { token: owner })).status, 200)
  assert.equal((await login(f.email, f.password)).body.step, 'totp')
})

test('lost phone: owner resets 2FA with a reason, the person sets it up again', async () => {
  const c = staff.content
  assert.equal((await app.call('POST', `/api/superadmin/staff/${c.id}/reset-2fa`, { token: owner, body: {} })).status, 400)
  const r = await app.call('POST', `/api/superadmin/staff/${c.id}/reset-2fa`, { token: owner, body: { reason: 'Lost phone, verified by video call' } })
  assert.equal(r.status, 200)
  assert.equal((await app.call('GET', '/api/superadmin/content/banks', { token: c.token })).status, 401)
  assert.equal((await login(c.email, r.body.temporaryPassword)).body.step, 'setup')
})

test('unit: the login IP throttle', () => {
  const sa = require('../../services/staffAuth')
  let hit = false
  for (let i = 0; i < 6; i++) hit = sa.throttled('10.9.9.9', { limit: 5 })
  assert.equal(hit, true)
  assert.equal(sa.throttled('10.9.9.8', { limit: 5 }), false)
})

// ── SUP-002 view as ────────────────────────────────────────────────────────────
test('view as: needs a reason, is read-only everywhere, audited for the org, notifies its admin, ends', async () => {
  const s = staff.support.token
  assert.equal((await app.call('POST', '/api/superadmin/view-as', { token: s, body: { targetRole: 'admin', targetId: ids.adminA, reason: 'short' } })).body.code, 'REASON_REQUIRED')
  assert.equal((await app.call('POST', '/api/superadmin/view-as', { token: s, body: { targetRole: 'robot', targetId: ids.adminA, reason: 'checking a ticket' } })).status, 400)
  assert.equal((await app.call('POST', '/api/superadmin/view-as', { token: s, body: { targetRole: 'admin', targetId: String(oid()), reason: 'checking a support ticket' } })).status, 404)
  const r = await app.call('POST', '/api/superadmin/view-as', { token: s, body: { targetRole: 'admin', targetId: ids.adminA, reason: 'Ticket 42: admin cannot see Year 5' } })
  assert.equal(r.status, 200)
  assert.equal(r.body.storageKey, 'admin_jwt')
  const t = r.body.token
  const seenBefore = await app.db.superadmin.collection('actordays').countDocuments({ role: 'admin', id: ids.adminA })
  const exp = JSON.parse(Buffer.from(t.split('.')[1], 'base64url')).exp
  assert.ok(exp * 1000 - Date.now() <= 30 * 60_000 + 5000, 'expires within 30 minutes')
  // Reads work...
  assert.equal((await app.call('GET', '/api/admin/stats', { token: t })).status, 200)
  assert.equal((await app.call('GET', '/api/admin/analytics/overview', { token: t })).status, 200)
  // ...every write is refused before it reaches a route, whatever the method or path.
  for (const [method, path] of [['POST', '/api/admin/tutors'], ['PATCH', `/api/admin/students/${ids.studentA}`], ['PUT', '/api/admin/org'], ['DELETE', `/api/admin/tutors/${ids.tutorA}`], ['POST', '/api/notifications/read-all'], ['POST', '/api/admin/chat'], ['POST', '/api/does/not/exist']]) {
    const w = await app.call(method, path, { token: t, body: { name: 'hacked' } })
    assert.equal(w.status, 403, `${method} ${path}`)
    assert.equal(w.body.code, 'VIEW_AS_READ_ONLY')
  }
  // GETs with side effects (marking chat read) are refused too.
  assert.equal((await app.call('GET', '/api/admin/chat', { token: t })).body.code, 'VIEW_AS_PRIVATE')
  // Still only that org: another school's student is unreachable.
  assert.equal((await app.call('GET', `/api/admin/students/${ids.studentB}/analytics/overview`, { token: t })).status, 404)
  // The student record was not changed.
  const st = await app.db.admin.collection('students').findOne({ _id: new mongoose.Types.ObjectId(ids.studentA) })
  assert.equal(st.name, 'Aanya')
  // Audited under org A, and org A's admin was told.
  const ev = await app.db.main.collection('auditevents').findOne({ action: 'support.view_as.start', targetId: ids.adminA })
  assert.equal(ev.orgId, ids.orgA)
  assert.equal(ev.actorEmail, staff.support.email)
  assert.match(ev.reason, /Ticket 42/)
  const n = await app.db.main.collection('notifications').findOne({ to: `admin:${ids.adminA}`, kind: 'security' })
  assert.ok(n && /viewing as/.test(n.body))
  // View-as never counts as the admin's own activity.
  await app.db.superadmin.collection('actordays').deleteMany({ role: 'admin', id: ids.adminA })
  assert.equal((await app.call('GET', '/api/admin/stats', { token: t })).status, 200)
  assert.equal(await app.db.superadmin.collection('actordays').countDocuments({ role: 'admin', id: ids.adminA }), 0)
  void seenBefore
  // End from the banner (the one POST it may make), then it is dead.
  assert.equal((await app.call('POST', '/api/view-as/end', { token: t })).status, 200)
  const dead = await app.call('GET', '/api/admin/stats', { token: t })
  assert.equal(dead.status, 401)
  assert.equal(dead.body.code, 'VIEW_AS_ENDED')
  assert.ok(await app.db.main.collection('auditevents').findOne({ action: 'support.view_as.end', orgId: ids.orgA }))
})

test('view as teacher and parent: reads only', async () => {
  const s = staff.support.token
  const tr = await app.call('POST', '/api/superadmin/view-as', { token: s, body: { targetRole: 'teacher', targetId: ids.tutorA, reason: 'Teacher reports empty groups page' } })
  assert.equal(tr.status, 200)
  assert.equal((await app.call('GET', '/api/teacher/batches', { token: tr.body.token })).status, 200)
  assert.equal((await app.call('POST', '/api/teacher/questions/upload', { token: tr.body.token })).body.code, 'VIEW_AS_READ_ONLY')
  const pr = await app.call('POST', '/api/superadmin/view-as', { token: s, body: { targetRole: 'parent', targetId: ids.parentId, reason: 'Parent cannot see her child' } })
  assert.equal((await app.call('GET', '/api/parent/children', { token: pr.body.token })).status, 200)
  assert.equal((await app.call('POST', '/api/parent/children', { token: pr.body.token, body: { name: 'X', age: 9, email: 'x@y.z' } })).body.code, 'VIEW_AS_READ_ONLY')
  assert.equal((await app.call('DELETE', '/api/parent/children/abc', { token: pr.body.token })).status, 403)
  // A view-as token is not a console token.
  assert.equal((await app.call('GET', '/api/superadmin/stats', { token: pr.body.token })).status, 401)
  const list = await app.call('GET', '/api/superadmin/view-as?active=1', { token: s })
  assert.ok(list.body.sessions.length >= 2)
})

// ── SUP-003 audit ───────────────────────────────────────────────────────────
test('audit: filter by org and actor, export (owner), verify the chain, detect tampering', async () => {
  const s = staff.support.token
  const byOrg = await app.call('GET', `/api/superadmin/audit?org=${ids.saA}`, { token: s })
  assert.equal(byOrg.status, 200)
  assert.ok(byOrg.body.events.length >= 2)
  assert.ok(byOrg.body.events.every((e) => e.orgId === ids.orgA))
  const byActor = await app.call('GET', `/api/superadmin/audit?actor=${encodeURIComponent(staff.support.email)}&action=support.view_as`, { token: s })
  assert.ok(byActor.body.events.length >= 3)
  assert.equal((await app.call('GET', '/api/superadmin/audit/export', { token: s })).status, 403)
  const csv = await fetch(`${app.url}/api/superadmin/audit/export?action=staff`, { headers: { authorization: `Bearer ${owner}` } })
  assert.equal(csv.status, 200)
  assert.match(csv.headers.get('content-type'), /text\/csv/)
  assert.match(await csv.text(), /^at,actorRole,actorEmail/)
  const ok = await app.call('GET', '/api/superadmin/audit/verify', { token: s })
  assert.equal(ok.body.ok, true, JSON.stringify(ok.body.firstBreak))
  assert.ok(ok.body.checked > 10)
  // Someone edits an event in the database: the check finds it.
  const victim = await app.db.main.collection('auditevents').findOne({ action: 'support.view_as.start' })
  await app.db.main.collection('auditevents').updateOne({ _id: victim._id }, { $set: { reason: 'nothing to see' } })
  const bad = await app.call('GET', '/api/superadmin/audit/verify', { token: s })
  assert.equal(bad.body.ok, false)
  assert.equal(bad.body.firstBreak.id, String(victim._id))
  await app.db.main.collection('auditevents').updateOne({ _id: victim._id }, { $set: { reason: victim.reason } })
})

// ── SUP-010..014 organisations and people ──────────────────────────────────────
test('directory: institutes and solo workspaces with seats, activity, health and flags; CSV export', async () => {
  const s = staff.support.token
  const r = await app.call('GET', '/api/superadmin/directory?limit=50', { token: s })
  assert.equal(r.status, 200)
  const a = r.body.rows.find((x) => x.adminOrgId === ids.orgA)
  const b = r.body.rows.find((x) => x.adminOrgId === ids.orgB)
  assert.equal(a.kind, 'institute'); assert.equal(b.kind, 'solo')
  assert.equal(a.seatsUsed, 2); assert.equal(a.seatLimit, 1)
  assert.ok(a.flags.includes('over_limit'))
  assert.equal(a.active7, 1)
  assert.equal(b.active7, 0)
  assert.equal(typeof a.health, 'number')
  assert.equal(a.country, 'DE')
  assert.equal(r.body.facets.kinds.solo, 1)
  const solo = await app.call('GET', '/api/superadmin/directory?kind=solo', { token: s })
  assert.deepEqual(solo.body.rows.map((x) => x.adminOrgId), [ids.orgB])
  const flagged = await app.call('GET', '/api/superadmin/directory?flag=over_limit', { token: s })
  assert.equal(flagged.body.total, 1)
  const csv = await fetch(`${app.url}/api/superadmin/directory?format=csv`, { headers: { authorization: `Bearer ${s}` } })
  assert.match(await csv.text(), /Sunrise Primary,institute,approved,DE/)
  assert.ok(await app.db.main.collection('auditevents').findOne({ action: 'org.directory.export' }))
})

test('organisation detail and feature overrides change what its admin gets', async () => {
  const s = staff.support.token
  const d = await app.call('GET', `/api/superadmin/organizations/${ids.saA}/detail`, { token: s })
  assert.equal(d.status, 200)
  assert.equal(d.body.people.students, 2)
  assert.equal(d.body.people.teachers, 1)
  assert.ok(d.body.billing)
  assert.ok(d.body.audit.length >= 1)
  assert.equal((await app.call('GET', `/api/superadmin/organizations/${String(oid())}/detail`, { token: s })).status, 404)
  assert.equal((await app.call('GET', '/api/superadmin/organizations/not-an-id/detail', { token: s })).status, 404)
  assert.equal((await app.call('PUT', `/api/superadmin/organizations/${ids.saA}/overrides`, { token: s, body: { featureOverrides: ['teleport'] } })).status, 400)
  assert.equal((await app.call('PUT', `/api/superadmin/organizations/${ids.saA}/overrides`, { token: s, body: { featureOverrides: ['sso', '-ai.teacher'], reason: 'pilot' } })).status, 200)
  const ent = await app.call('GET', '/api/entitlements', { token: app.tokens.admin(ids.adminA, ids.orgA, 'a-1') })
  assert.ok(ent.body.modules.includes('sso'))
  assert.ok(!ent.body.modules.includes('ai.teacher'))
  // Org B is untouched.
  const entB = await app.call('GET', '/api/entitlements', { token: app.tokens.admin(ids.adminB, ids.orgB, 'a-2') })
  assert.ok(!entB.body.modules.includes('sso'))
  assert.ok(await app.db.main.collection('auditevents').findOne({ action: 'org.overrides.update', orgId: ids.orgA }))
  await app.call('PUT', `/api/superadmin/organizations/${ids.saA}/overrides`, { token: s, body: { featureOverrides: [] } })
})

test('approval queue: verification hints, SLA timer, templates; approval is attributed', async () => {
  const s = staff.support.token
  const q = await app.call('GET', '/api/superadmin/approvals', { token: s })
  const maple = q.body.rows.find((r) => r.id === ids.saC)
  assert.ok(maple.hints.some((h) => h.key === 'free_mail'))
  assert.ok(maple.hints.some((h) => h.key === 'no_phone'))
  assert.equal(maple.sla.state, 'overdue')
  assert.ok(q.body.templates.length >= 3)
  assert.equal((await app.call('PUT', `/api/superadmin/organizations/${ids.saC}/approve`, { token: s })).status, 200)
  const sa = await app.db.superadmin.collection('organizations').findOne({ _id: new mongoose.Types.ObjectId(ids.saC) })
  assert.equal(sa.approvedBy, staff.support.email)
  assert.ok(await app.db.main.collection('auditevents').findOne({ action: 'org.approve', orgId: ids.orgC, actorId: staff.support.id }))
})

test('suspend: the org\'s admins and teachers are stopped at once; unsuspend restores', async () => {
  const s = staff.support.token
  const adminTok = app.tokens.admin(ids.adminB, ids.orgB, 'a-2')
  assert.equal((await app.call('GET', '/api/admin/students', { token: adminTok })).status, 200)
  assert.equal((await app.call('POST', `/api/superadmin/organizations/${ids.saB}/suspend`, { token: s, body: { reason: '' } })).status, 400)
  assert.equal((await app.call('POST', `/api/superadmin/organizations/${ids.saB}/suspend`, { token: s, body: { reason: 'Spam sign-ups reported' } })).status, 200)
  const blocked = await app.call('GET', '/api/admin/students', { token: adminTok })
  assert.equal(blocked.status, 403)
  assert.equal(blocked.body.code, 'ORG_SUSPENDED')
  // Org A is not affected.
  assert.equal((await app.call('GET', '/api/admin/students', { token: app.tokens.admin(ids.adminA, ids.orgA, 'a-1') })).status, 200)
  const dir = await app.call('GET', '/api/superadmin/directory?status=suspended', { token: s })
  assert.deepEqual(dir.body.rows.map((r) => r.id), [ids.saB])
  assert.equal((await app.call('POST', `/api/superadmin/organizations/${ids.saB}/unsuspend`, { token: s, body: { note: 'Appeal accepted' } })).status, 200)
  assert.equal((await app.call('GET', '/api/admin/students', { token: adminTok })).status, 200)
})

test('people search across roles; profile view is audited; revoke sessions signs a person out', async () => {
  const s = staff.support.token
  assert.equal((await app.call('GET', '/api/superadmin/people?q=a', { token: s })).status, 400)
  const r = await app.call('GET', '/api/superadmin/people?q=sunrise', { token: s })
  const roles = r.body.rows.map((x) => x.role).sort()
  assert.deepEqual(roles, ['admin', 'teacher'])
  assert.equal(r.body.rows[0].org.name, 'Sunrise Primary')
  const kid = await app.call('GET', '/api/superadmin/people?q=aanya', { token: s })
  assert.equal(kid.body.rows[0].lastActive, today)
  const p = await app.call('GET', `/api/superadmin/people/teacher/${ids.tutorA}?reason=ticket`, { token: s })
  assert.equal(p.status, 200)
  assert.equal(p.body.security.canViewAs, true)
  assert.ok(await app.db.main.collection('auditevents').findOne({ action: 'people.view', targetId: ids.tutorA }))
  // Admin A's current token stops working after "sign out everywhere".
  const before = app.tokens.admin(ids.adminA, ids.orgA, 'a-1')
  await new Promise((res) => setTimeout(res, 1100)) // iat has 1 s resolution
  assert.equal((await app.call('POST', `/api/superadmin/people/admin/${ids.adminA}/revoke-sessions`, { token: s, body: { reason: 'Laptop stolen' } })).status, 200)
  const out = await app.call('GET', '/api/admin/stats', { token: before })
  assert.equal(out.status, 401)
  assert.equal(out.body.code, 'SESSION_REVOKED')
  await new Promise((res) => setTimeout(res, 1100))
  assert.equal((await app.call('GET', '/api/admin/stats', { token: app.tokens.admin(ids.adminA, ids.orgA, 'a-1') })).status, 200, 'a new sign-in works')
  assert.equal((await app.call('POST', `/api/superadmin/people/teacher/${ids.tutorA}/reset-login`, { token: s, body: { reason: 'Changed Google account' } })).status, 200)
  const tutor = await app.db.admin.collection('tutors').findOne({ _id: new mongoose.Types.ObjectId(ids.tutorA) })
  assert.equal(tutor.authStatus, 'unclaimed')
  assert.equal((await app.call('POST', `/api/superadmin/people/teacher/${ids.tutorA}/resend-invite`, { token: s })).status, 200)
  assert.ok(await app.db.main.collection('outboxes').findOne({ to: 'sharma@sunrise.edu', kind: 'invite' }))
  assert.equal((await app.call('POST', `/api/superadmin/people/admin/${ids.adminA}/teleport`, { token: s })).status, 400)
})

test('families and independent learners, with an audited drill-down', async () => {
  const s = staff.support.token
  const f = await app.call('GET', '/api/superadmin/families', { token: s })
  const emails = f.body.rows.map((r) => r.email).sort()
  assert.deepEqual(emails, ['mia@home.test', 'solo@home.test'], 'school learners are not "independent"')
  assert.equal(f.body.counts.withVerifiedGuardian, 1)
  const ov = await app.call('GET', '/api/superadmin/families/learners/mia@home.test/analytics/overview?reason=ticket', { token: s })
  assert.equal(ov.status, 200)
  assert.equal(ov.body.totals.answered, 10)
  assert.equal((await app.call('GET', '/api/superadmin/families/learners/aanya@kids.test/analytics/overview', { token: s })).status, 400)
  assert.equal((await app.call('GET', '/api/superadmin/families/learners/nobody@x.test/analytics/overview', { token: s })).status, 404)
  assert.ok(await app.db.main.collection('auditevents').findOne({ action: 'people.learner.analytics', targetId: 'mia@home.test' }))
})

// ── SUP-020..022 analytics ─────────────────────────────────────────────────────
test('platform analytics: live counters, growth, learning, revenue', async () => {
  const live = await app.call('GET', '/api/superadmin/live', { token: staff.analyst ? owner : owner })
  assert.equal(live.status, 200)
  assert.ok(live.body.live.learnersNow >= 2)
  assert.equal(live.body.live.mrrCents, 300)
  const g = await app.call('GET', '/api/superadmin/platform/growth?days=14', { token: owner })
  assert.equal(g.body.growth.series.length, 14)
  assert.equal(g.body.growth.active.learners.dau, 2)
  assert.ok(g.body.growth.active.admin.dau >= 1, 'admin sign-ins counted from activity')
  assert.ok(g.body.growth.funnel.steps[0].n >= 3)
  assert.equal(g.body.growth.regions[0].region, 'Europe')
  const l = await app.call('GET', '/api/superadmin/platform/learning', { token: owner })
  assert.equal(l.body.learning.matrix.english.listen.answered, 20)
  assert.equal(l.body.learning.matrix.english.listen.accuracy, 70)
  assert.equal(l.body.learning.totals.learners, 2)
  const rv = await app.call('GET', '/api/superadmin/platform/revenue', { token: staff.finance.token })
  assert.equal(rv.body.revenue.mrrCents, 300)
  assert.equal(rv.body.revenue.arrCents, 3600)
})

// ── SUP-040..043 operations ───────────────────────────────────────────────────
test('system health: latency, CPU (steal where Linux), memory, databases, AI Teacher, alerts', async () => {
  const r = await app.call('GET', '/api/superadmin/ops/health', { token: staff.engineer.token })
  const hl = r.body.health
  assert.ok(hl.api.requests > 0)
  assert.equal(typeof hl.api.p95, 'number')
  assert.ok(hl.mem.rssMb > 0)
  assert.equal(hl.dbs.length, 3)
  assert.ok(hl.dbs.every((d) => d.state === 'connected'))
  assert.ok(hl.dbs.find((d) => d.name === 'superadmin').top.some((c) => c.name === 'staffs'))
  assert.equal(hl.ai.disabled, true)
  if (process.platform !== 'linux') assert.ok(hl.cpu === null || hl.cpu.stealPct === null)
  const { alerts } = require('../../services/systemHealth')
  const a = alerts({ cpu: { busyPct: 40, stealPct: 95 }, api: { p95: 2500, errorRate: 0, requests: 100 }, mem: { usedPct: 50 }, ai: { ok: true }, dbs: [] })
  assert.deepEqual(a.map((x) => x.key), ['cpu.steal', 'api.p95'])
})

test('jobs: list and re-run, with progress recorded', async () => {
  const e = staff.engineer.token
  const list = await app.call('GET', '/api/superadmin/ops/jobs', { token: e })
  assert.ok(list.body.jobs.some((j) => j.name === 'analytics.warm'))
  const run = await app.call('POST', '/api/superadmin/ops/jobs/analytics.warm/run', { token: e })
  assert.equal(run.status, 200)
  let status
  for (let i = 0; i < 50 && status !== 'done'; i++) {
    await new Promise((r) => setTimeout(r, 100))
    status = (await app.call('GET', `/api/superadmin/ops/jobs/runs/${run.body.runId}`, { token: e })).body.run.status
  }
  assert.equal(status, 'done')
  assert.equal((await app.call('POST', '/api/superadmin/ops/jobs/nope/run', { token: e })).status, 404)
})

test('flags: platform kill switch and plan rules change entitlements; features roll out by percentage', async () => {
  const e = staff.engineer.token
  const adminA = app.tokens.admin(ids.adminA, ids.orgA, 'a-1')
  assert.ok((await app.call('GET', '/api/entitlements', { token: adminA })).body.modules.includes('ai.teacher'))
  assert.equal((await app.call('PUT', '/api/superadmin/ops/flags/ai.teacher', { token: e, body: { kind: 'module', platform: 'off', reason: 'AI Teacher outage' } })).status, 200)
  assert.ok(!(await app.call('GET', '/api/entitlements', { token: adminA })).body.modules.includes('ai.teacher'))
  assert.ok(!(await app.call('GET', '/api/entitlements', { token: app.tokens.parent(ids.parentId) })).body.modules.includes('ai.teacher'))
  await app.call('PUT', '/api/superadmin/ops/flags/ai.teacher', { token: e, body: { kind: 'module', platform: 'default' } })
  assert.ok((await app.call('GET', '/api/entitlements', { token: adminA })).body.modules.includes('ai.teacher'))
  // A plan rule: every institute gets SSO.
  await app.call('PUT', '/api/superadmin/ops/flags/sso', { token: e, body: { kind: 'module', plans: { institute: 'on' } } })
  assert.ok((await app.call('GET', '/api/entitlements', { token: adminA })).body.modules.includes('sso'))
  const pv = await app.call('GET', '/api/superadmin/ops/flags/preview?plan=institute', { token: e })
  assert.equal(pv.body.why.sso, 'flag:plan:institute')
  // Bad input.
  assert.equal((await app.call('PUT', '/api/superadmin/ops/flags/teleport', { token: e, body: { kind: 'module' } })).status, 400)
  assert.equal((await app.call('PUT', '/api/superadmin/ops/flags/new-thing', { token: e, body: { kind: 'feature', rollout: 140 } })).status, 400)
  assert.equal((await app.call('PUT', '/api/superadmin/ops/flags/new-report', { token: e, body: { kind: 'feature', rollout: 50, orgs: { [ids.orgB]: 'on' } } })).status, 200)
  const flags = require('../../services/featureFlags')
  assert.equal(flags.bucket('new-report', 'x'), flags.bucket('new-report', 'x'), 'stable buckets')
  assert.ok(await app.db.main.collection('auditevents').findOne({ action: 'flag.update', targetId: 'ai.teacher' }))
})

test('incidents: banner on the public status, resolved goes to the log; engineers only', async () => {
  assert.equal((await app.call('GET', '/api/status')).body.status, 'operational')
  assert.equal((await app.call('POST', '/api/superadmin/ops/incidents', { token: staff.support.token, body: { title: 'x' } })).status, 403)
  assert.equal((await app.call('POST', '/api/superadmin/ops/incidents', { token: staff.engineer.token, body: { title: '' } })).status, 400)
  const c = await app.call('POST', '/api/superadmin/ops/incidents', { token: staff.engineer.token, body: { title: 'AI Teacher is slow', severity: 'major', message: 'Answers take longer than usual.' } })
  assert.equal(c.status, 200)
  const { clear } = require('../../utils/ttlCache'); clear('status:') // (the server's own cache is cleared by the route)
  const s = await app.call('GET', '/api/status')
  assert.equal(s.body.status, 'degraded')
  assert.equal(s.body.banner.title, 'AI Teacher is slow')
  await app.call('PATCH', `/api/superadmin/ops/incidents/${c.body.incident.id}`, { token: staff.engineer.token, body: { status: 'resolved', update: 'Fixed' } })
  const after = await app.call('GET', '/api/status')
  assert.equal(after.body.banner, null)
  assert.equal(after.body.recent[0].title, 'AI Teacher is slow')
})

// ── SUP-050/051 plans and billing ────────────────────────────────────────────────
test('plan catalogue: changes reach existing customers only at renewal unless forced', async () => {
  const f = staff.finance.token
  const r1 = await login(staff.finance.email, staff.finance.password)
  staff.finance.token = (await app.call('POST', '/api/superadmin/auth/2fa/verify', { body: { challengeToken: r1.body.challengeToken, recoveryCode: staff.finance.recoveryCodes[1] } })).body.token
  const fin = staff.finance.token
  // Start a real subscription for org B (solo) on solo_pro.
  assert.equal((await app.call('POST', `/api/superadmin/billing/orgs/${ids.saB}`, { token: fin, body: { plan: 'solo_pro', reason: 'Signed by email' } })).status, 200)
  const adminB = app.tokens.admin(ids.adminB, ids.orgB, 'a-2')
  assert.ok((await app.call('GET', '/api/entitlements', { token: adminB })).body.modules.includes('reports.branded'))
  assert.equal((await app.call('PUT', '/api/superadmin/billing/plans/solo_pro', { token: fin, body: { modules: ['core.learning', 'groups'] } })).status, 400, 'needs a reason')
  const save = await app.call('PUT', '/api/superadmin/billing/plans/solo_pro', { token: fin, body: { modules: ['core.learning', 'ai.teacher', 'groups', 'tests'], reason: 'Slimmer Solo Pro for new customers' } })
  assert.equal(save.status, 200)
  assert.equal(save.body.updatedSubscribers, 0)
  assert.ok((await app.call('GET', '/api/entitlements', { token: adminB })).body.modules.includes('reports.branded'), 'existing customer keeps what they bought')
  const sub = await app.db.superadmin.collection('subscriptions').findOne({ ownerId: ids.orgB })
  // Renewal applies the new version.
  assert.equal((await app.call('POST', `/api/superadmin/billing/subscriptions/${sub._id}/renew`, { token: fin, body: { reason: 'Monthly renewal' } })).status, 200)
  assert.ok(!(await app.call('GET', '/api/entitlements', { token: adminB })).body.modules.includes('reports.branded'))
  // A forced change applies at once.
  const forced = await app.call('PUT', '/api/superadmin/billing/plans/solo_pro', { token: fin, body: { modules: ['core.learning', 'ai.teacher', 'groups', 'tests', 'reports.branded'], forced: true, reason: 'Rollback: restore branded reports' } })
  assert.equal(forced.body.updatedSubscribers, 1)
  assert.ok((await app.call('GET', '/api/entitlements', { token: adminB })).body.modules.includes('reports.branded'))
  assert.equal((await app.call('PUT', '/api/superadmin/billing/plans/solo_pro', { token: fin, body: { modules: ['warp-drive'], reason: 'bad module test' } })).status, 400)
  void f
})

test('customer actions: seats, trial, credit, invoice, mark paid, pause, cancel; all audited', async () => {
  const fin = staff.finance.token
  const sub = await app.db.superadmin.collection('subscriptions').findOne({ ownerId: ids.orgA })
  const act = (a, body) => app.call('POST', `/api/superadmin/billing/subscriptions/${sub._id}/${a}`, { token: fin, body: { reason: 'Customer request by email', ...body } })
  assert.equal((await app.call('POST', `/api/superadmin/billing/subscriptions/${sub._id}/seats`, { token: fin, body: { seats: 5 } })).status, 400, 'reason required')
  assert.equal((await act('seats', { seats: -1 })).status, 400)
  assert.equal((await act('seats', { seats: 30 })).status, 200)
  const usage = await app.call('GET', '/api/billing/usage', { token: app.tokens.admin(ids.adminA, ids.orgA, 'a-1') })
  assert.equal(usage.body.usage.students.limit, 30)
  assert.equal(usage.body.usage.students.used, 2)
  assert.equal((await act('extend-trial', { days: 14 })).status, 200)
  assert.equal((await act('credit', { amountCents: 500 })).status, 200)
  const inv = await act('invoice', { amountCents: 9000, country: 'DE', vatCents: 1710 })
  assert.equal(inv.body.result.creditApplied, 500)
  const invId = inv.body.subscription.invoices[0]._id
  assert.equal((await act('mark-paid', { invoiceId: invId, method: 'po', reference: 'PO-778' })).status, 200)
  assert.equal((await act('mark-paid', { invoiceId: invId })).status, 409)
  assert.equal((await act('pause', {})).status, 200)
  assert.equal((await act('resume', {})).status, 200)
  assert.equal((await act('cancel', { cancelReason: 'Budget', atPeriodEnd: true })).status, 200)
  assert.equal((await act('teleport', {})).status, 400)
  assert.equal((await app.call('POST', `/api/superadmin/billing/subscriptions/${sub._id}/seats`, { token: staff.support.token, body: { seats: 1, reason: 'not my job' } })).status, 403)
  const actions = await app.db.main.collection('auditevents').distinct('action', { targetType: 'subscription' })
  for (const a of ['billing.seats', 'billing.extend-trial', 'billing.credit', 'billing.invoice', 'billing.mark-paid', 'billing.pause', 'billing.cancel']) assert.ok(actions.includes(a), a)
})

test('Stripe: checkout hidden without a key; webhook refuses bad signatures and applies signed events', async () => {
  assert.equal((await app.call('GET', '/api/billing/config')).body.stripe, false)
  assert.equal((await app.call('POST', '/api/billing/checkout', { token: app.tokens.admin(ids.adminA, ids.orgA, 'a-1'), body: { plan: 'institute' } })).body.code, 'BILLING_OFF')
  const event = { id: 'evt_1', type: 'checkout.session.completed', data: { object: { customer: 'cus_1', subscription: 'sub_1', currency: 'eur', amount_total: 499, metadata: { ownerType: 'parent', ownerId: ids.parentId, plan: 'family_plus', interval: 'month', seats: '1' } } } }
  const body = JSON.stringify(event)
  const bad = await fetch(`${app.url}/api/billing/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': stripe.sign(body, 'wrong-secret') }, body })
  assert.equal(bad.status, 400)
  const good = await fetch(`${app.url}/api/billing/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': stripe.sign(body, WEBHOOK_SECRET) }, body })
  assert.equal(good.status, 200)
  const sub = await app.db.superadmin.collection('subscriptions').findOne({ ownerType: 'parent', ownerId: ids.parentId })
  assert.equal(sub.status, 'active')
  assert.equal(sub.stripeSubscriptionId, 'sub_1')
  const fail = JSON.stringify({ id: 'evt_2', type: 'invoice.payment_failed', data: { object: { id: 'in_1', subscription: 'sub_1', amount_due: 499, currency: 'eur' } } })
  await fetch(`${app.url}/api/billing/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': stripe.sign(fail, WEBHOOK_SECRET) }, body: fail })
  assert.equal((await app.db.superadmin.collection('subscriptions').findOne({ stripeSubscriptionId: 'sub_1' })).status, 'past_due')
  // Old signatures (replays) are refused.
  assert.equal(stripe.verifySignature(Buffer.from(body), stripe.sign(body, WEBHOOK_SECRET, Math.floor(Date.now() / 1000) - 3600), { secret: WEBHOOK_SECRET }), null)
})

// ── SUP-030/032 content ───────────────────────────────────────────────────────
test('content: built-in banks only, translation coverage, edits audited', async () => {
  const r = await login(staff.content.email, 'x')
  assert.equal(r.status, 401)
  const tok = owner
  await app.db.main.collection('listenenglishes').insertMany([
    { id: 'LE-1', prompt: 'Which word rhymes with cat?', level: 1, uploadBatchId: null, translations: { de: { prompt: 'Welches Wort reimt sich auf Katze?' } } },
    { id: 'LE-2', prompt: 'Which sound starts "ship"?', level: 2, uploadBatchId: null, translations: {} },
    { id: 'ORG-1', prompt: 'A school\'s own question', level: 1, uploadBatchId: oid(), translations: {} },
  ])
  const banks = await app.call('GET', '/api/superadmin/content/banks?fresh=1', { token: tok })
  const le = banks.body.rows.find((b) => b.module === 'listen' && b.subject === 'english')
  assert.equal(le.builtIn, 2)
  assert.equal(le.orgUploads, 1)
  assert.equal(le.translations.de.pct, 50)
  const list = await app.call('GET', '/api/superadmin/content/banks/listen/english?missing=de', { token: tok })
  assert.deepEqual(list.body.rows.map((q) => q.id), ['LE-2'])
  assert.equal((await app.call('GET', '/api/superadmin/content/banks/listen/english/ORG-1', { token: tok })).status, 404, 'an org\'s own questions are not ours to edit')
  assert.equal((await app.call('PATCH', '/api/superadmin/content/banks/listen/english/LE-2', { token: tok, body: { level: 9 } })).status, 400)
  const ed = await app.call('PATCH', '/api/superadmin/content/banks/listen/english/LE-2', { token: tok, body: { prompt: 'Which sound does "ship" start with?', staffTags: ['Phonics', 'phonics', 'review'] } })
  assert.equal(ed.status, 200)
  assert.deepEqual(ed.body.question.staffTags, ['phonics', 'review'])
  assert.ok(await app.db.main.collection('auditevents').findOne({ action: 'content.question.update' }))
  assert.equal((await app.call('GET', '/api/superadmin/content/banks/teleport/english', { token: tok })).status, 404)
  const ai = await app.call('GET', '/api/superadmin/content/ai-teacher', { token: tok })
  assert.equal(ai.body.available, false, 'AI Teacher is off in tests; the page says so instead of failing')
})

// ── SUP-060/061 support and data rights ──────────────────────────────────────────
test('support inbox: contact + chats together; assign, note, reply, resolve', async () => {
  const s = staff.support.token
  await app.db.superadmin.collection('contactmessages').insertOne({ name: 'Mrs Head', email: 'head@sunrise.edu', role: 'admin', orgName: 'Sunrise Primary', subject: 'Cannot add teacher', message: 'The button does nothing', status: 'open', createdAt: new Date(), updatedAt: new Date() })
  await app.db.superadmin.collection('chatmessages').insertOne({ adminUid: 'a-1', orgName: 'Sunrise Primary', senderRole: 'admin', message: 'Hello support', readByAdmin: true, readBySuperadmin: false, createdAt: new Date(), updatedAt: new Date() })
  await app.db.superadmin.collection('parentchatmessages').insertOne({ parentUid: 'p-1', parentName: 'Priya', senderRole: 'parent', message: 'Link code?', readByParent: true, readBySuperadmin: false, createdAt: new Date(), updatedAt: new Date() })
  const inbox = await app.call('GET', '/api/superadmin/support/inbox', { token: s })
  assert.deepEqual(inbox.body.rows.map((r) => r.kind).sort(), ['admin_chat', 'contact', 'parent_chat'])
  const contact = inbox.body.rows.find((r) => r.kind === 'contact')
  const th = await app.call('GET', `/api/superadmin/support/threads/contact/${contact.ref}`, { token: s })
  assert.equal(th.body.links.org.id, ids.saA)
  assert.equal((await app.call('PATCH', `/api/superadmin/support/threads/contact/${contact.ref}`, { token: s, body: { assigneeId: 'me', tags: ['Bug'] } })).body.meta.assigneeName, 'Sam Support')
  assert.equal((await app.call('POST', `/api/superadmin/support/threads/contact/${contact.ref}/notes`, { token: s, body: { text: 'Reproduced on Safari' } })).status, 200)
  assert.equal((await app.call('POST', `/api/superadmin/support/threads/contact/${contact.ref}/reply`, { token: s, body: { message: '' } })).status, 400)
  assert.equal((await app.call('POST', `/api/superadmin/support/threads/contact/${contact.ref}/reply`, { token: s, body: { message: 'Fixed, please try again.' } })).status, 200)
  assert.ok(await app.db.main.collection('outboxes').findOne({ to: 'head@sunrise.edu', kind: 'support_reply' }))
  assert.equal((await app.call('POST', '/api/superadmin/support/threads/parent_chat/p-1/reply', { token: s, body: { message: 'Ask your child for the code.' } })).status, 200)
  assert.equal(await app.db.superadmin.collection('parentchatmessages').countDocuments({ parentUid: 'p-1', senderRole: 'superadmin' }), 1)
  const mine = await app.call('GET', '/api/superadmin/support/inbox?assignee=me', { token: s })
  assert.deepEqual(mine.body.rows.map((r) => r.kind), ['contact'])
  assert.equal((await app.call('GET', '/api/superadmin/support/threads/nope/x', { token: s })).status, 404)
  assert.equal((await app.call('POST', '/api/superadmin/support/threads/parent_chat/ghost/reply', { token: s, body: { message: 'hi' } })).status, 404)
})

test('data rights: queue with due dates, footprint across databases, proof required before "done"', async () => {
  const s = staff.support.token
  const due = new Date(Date.now() - 86400_000)
  const { insertedId: delId } = await app.db.main.collection('datarequests').insertOne({ subjectEmail: 'mia@home.test', subjectName: 'Mia', requestedByRole: 'parent', requestedById: ids.parentId, kind: 'delete', status: 'pending', dueAt: due, note: '', createdAt: new Date(), updatedAt: new Date() })
  const { insertedId: expId } = await app.db.main.collection('datarequests').insertOne({ subjectEmail: 'aanya@kids.test', subjectName: 'Aanya', requestedByRole: 'admin', requestedById: ids.adminA, orgId: ids.orgA, kind: 'export', status: 'pending', dueAt: new Date(Date.now() + 20 * 86400_000), note: '', createdAt: new Date(), updatedAt: new Date() })
  const q = await app.call('GET', '/api/superadmin/data-requests', { token: s })
  assert.equal(q.body.rows[0].id, String(delId))
  assert.equal(q.body.rows[0].overdue, true)
  const d = await app.call('GET', `/api/superadmin/data-requests/${delId}`, { token: s })
  assert.ok(d.body.remaining >= 2)
  assert.ok(d.body.footprint.some((x) => x.collection === 'learnerdays' && x.count === 1))
  const notYet = await app.call('PATCH', `/api/superadmin/data-requests/${delId}`, { token: s, body: { status: 'done' } })
  assert.equal(notYet.status, 409)
  assert.equal(notYet.body.code, 'DATA_REMAINS')
  assert.equal((await app.call('POST', `/api/superadmin/data-requests/${delId}/run-deletion`, { token: s })).body.code, 'NO_SERVICE')
  // (the Parent work's dataRights service deletes; here we simulate it)
  for (const c of ['learnerdays', 'children']) await app.db.main.collection(c).deleteMany({ email: 'mia@home.test' })
  const done = await app.call('PATCH', `/api/superadmin/data-requests/${delId}`, { token: s, body: { status: 'done', note: 'Deleted everywhere' } })
  assert.equal(done.status, 200)
  assert.match(done.body.request.note, /Proof of deletion: 0 records/)
  assert.ok(await app.db.main.collection('notifications').findOne({ to: `parent:${ids.parentId}`, kind: 'privacy' }))
  const exp = await fetch(`${app.url}/api/superadmin/data-requests/${expId}/export`, { headers: { authorization: `Bearer ${s}` } })
  const bundle = await exp.json()
  assert.equal(bundle.subject, 'aanya@kids.test')
  assert.ok(bundle.data['main.learnerdays'].length === 1)
  assert.ok(bundle.data['admin.students'][0].name === 'Aanya')
  assert.equal((await app.call('PATCH', `/api/superadmin/data-requests/${expId}`, { token: s, body: { status: 'rejected' } })).status, 400, 'a rejection needs a reason')
  assert.ok(await app.db.main.collection('auditevents').findOne({ action: 'data_rights.export_download', targetId: 'aanya@kids.test', orgId: ids.orgA }))
})

test('settings and outbox', async () => {
  const g = await app.call('GET', '/api/superadmin/settings/platform', { token: staff.support.token })
  assert.ok(g.body.settings['platform.languages'].value.includes('de'))
  assert.equal((await app.call('PUT', '/api/superadmin/settings/platform/platform.languages', { token: staff.support.token, body: { value: ['en'] } })).status, 403)
  assert.equal((await app.call('PUT', '/api/superadmin/settings/platform/platform.languages', { token: owner, body: { value: ['english!'] } })).status, 400)
  assert.equal((await app.call('PUT', '/api/superadmin/settings/platform/platform.languages', { token: owner, body: { value: ['en', 'de'] } })).status, 200)
  const ob = await app.call('GET', '/api/superadmin/ops/outbox?status=queued', { token: staff.support.token })
  assert.ok(ob.body.total >= 2)
  assert.equal(ob.body.smtp, false)
  assert.equal((await app.call('POST', `/api/superadmin/ops/outbox/${ob.body.rows[0].id}/retry`, { token: staff.support.token })).status, 409)
})

test('break-glass: owners can end every break-glass session, including old tokens', async () => {
  const fresh = (await login('root@example.com', 'x')).body.token
  await new Promise((r) => setTimeout(r, 1100))
  const r = await app.call('POST', '/api/superadmin/staff/break-glass/revoke', { token: owner })
  assert.equal(r.status, 200)
  assert.equal((await app.call('GET', '/api/superadmin/stats', { token: fresh })).status, 401)
  assert.equal((await app.call('GET', '/api/superadmin/stats', { token: owner })).status, 401, 'legacy token without a session id, issued before')
  void crypto
})
