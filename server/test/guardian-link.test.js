// FND-001 / FND-012: a parent only sees a learner's data through a VERIFIED link.
const test = require('node:test')
const assert = require('node:assert/strict')
const { fakeRes } = require('./helpers')

const guardian = require('../utils/guardianLink')
const Child = require('../models/Child')
const LinkCode = require('../models/LinkCode')
const performance = require('../utils/performance')
const parent = require('../controllers/parentController')
const links = require('../controllers/linkController')
const { parentChildAccess } = require('../middleware/studentDashboardAccess')
const parentRoutes = require('../routes/parent')

// createChild builds a real Child, so its save() must not reach a database.
Child.prototype.save = async function () { return this }

const req = (over = {}) => ({ parent: { id: '507f1f77bcf86cd799439011', email: 'mum@example.com' }, params: { id: 'c1' }, body: {}, ...over })
const child = (over = {}) => {
  const c = new Child({ parentId: '507f1f77bcf86cd799439011', name: 'Aanya', age: 8, email: 'aanya@example.com', ...over })
  c.save = async function () { return this }
  return c
}
const stubFind = (c) => { Child.findOne = async () => c }
const noSchool = () => { guardian.schoolLinkExists = async () => false }

test('a new link is pending, and a legacy row (no status) reads as pending', () => {
  assert.equal(new Child({ name: 'x', age: 5, email: 'a@b.co', parentId: '507f1f77bcf86cd799439011' }).linkStatus, 'pending')
  assert.equal(Child.hydrate({ name: 'x', age: 5, email: 'a@b.co', parentId: '507f1f77bcf86cd799439011' }).linkStatus, 'pending')
})

test('childAccess: only verified links pass', () => {
  assert.equal(guardian.childAccess(null).status, 404)
  assert.equal(guardian.childAccess({ email: '' }).status, 404)
  for (const linkStatus of ['pending', 'revoked', undefined]) {
    const r = guardian.childAccess({ email: 'a@b.co', linkStatus })
    assert.equal(r.ok, false)
    assert.equal(r.status, 403)
    assert.equal(r.code, 'LINK_NOT_VERIFIED')
  }
  assert.deepEqual(guardian.childAccess({ email: 'a@b.co', linkStatus: 'verified' }), { ok: true })
})

test('dashboard middleware blocks a pending child and never swaps in their identity', async () => {
  stubFind(child({ linkStatus: 'pending' }))
  const res = fakeRes(); const r = req(); let called = false
  await parentChildAccess(r, res, () => { called = true })
  assert.equal(res.statusCode, 403)
  assert.equal(called, false)
  assert.equal(r.user, undefined)
})

test('dashboard middleware lets a verified child through as that learner', async () => {
  stubFind(child({ linkStatus: 'verified' }))
  const res = fakeRes(); const r = req(); let called = false
  await parentChildAccess(r, res, () => { called = true })
  assert.equal(called, true)
  assert.deepEqual(r.user, { email: 'aanya@example.com', name: 'Aanya' })
})

test('every /children/:id/dashboard/* route is behind the access check', () => {
  const dash = parentRoutes.stack.filter((l) => l.route && l.route.path.includes('/dashboard/'))
  assert.ok(dash.length >= 6)
  for (const l of dash) {
    assert.ok(l.route.stack.some((h) => h.handle === parentChildAccess), `${l.route.path} is not behind parentChildAccess`)
  }
})

test('performance endpoint: pending gets 403 and never reads the learner data', async () => {
  let read = false
  performance.getPerformanceForEmail = async () => { read = true; return {} }
  stubFind(child({ linkStatus: 'pending' }))
  const res = fakeRes()
  await parent.getChildPerformance(req(), res)
  assert.equal(res.statusCode, 403)
  assert.equal(read, false)
})

test('createChild: typing an email only makes a pending link', async () => {
  noSchool()
  Child.findOne = async () => null
  const res = fakeRes()
  await parent.createChild(req({ body: { name: 'Victim', age: 9, email: 'someone.else@example.com' } }), res)
  assert.equal(res.statusCode, 201)
  assert.equal(res.body.child.linkStatus, 'pending')
  assert.equal(res.body.child.verifiedBy, null)
})

test('createChild: a school that linked this parent and student verifies it', async () => {
  guardian.schoolLinkExists = async (p, c) => p === 'mum@example.com' && c === 'aanya@example.com'
  Child.findOne = async () => null
  const res = fakeRes()
  await parent.createChild(req({ body: { name: 'Aanya', age: 8, email: 'Aanya@Example.com' } }), res)
  assert.equal(res.body.child.linkStatus, 'verified')
  assert.equal(res.body.child.verifiedBy, 'school')
})

test('updateChild: pointing a verified link at another email resets it to pending', async () => {
  noSchool()
  const c = child({ linkStatus: 'verified', verifiedBy: 'child_code', verifiedAt: new Date() })
  Child.findOne = async (q) => (q._id === 'c1' && !q.email ? c : null)
  const res = fakeRes()
  await parent.updateChild(req({ body: { email: 'other@example.com' } }), res)
  assert.equal(res.body.child.email, 'other@example.com')
  assert.equal(res.body.child.linkStatus, 'pending')
  assert.equal(res.body.child.verifiedAt, null)
})

test('updateChild: renaming keeps a verified link verified', async () => {
  noSchool()
  const c = child({ linkStatus: 'verified', verifiedBy: 'child_code' })
  Child.findOne = async (q) => (q._id === 'c1' ? c : null)
  const res = fakeRes()
  await parent.updateChild(req({ body: { name: 'Aanya R', email: 'AANYA@example.com' } }), res)
  assert.equal(res.body.child.name, 'Aanya R')
  assert.equal(res.body.child.linkStatus, 'verified')
})

test('codes: format, cleaning and hashing', () => {
  for (let i = 0; i < 200; i++) assert.match(guardian.newCode(), /^[A-HJ-NP-Z2-9]{6}$/)
  assert.equal(guardian.cleanCode(' ab c-234 '), 'ABC234')
  assert.equal(guardian.cleanCode('ABC23'), null)
  assert.equal(guardian.cleanCode('ABC01O'), null) // 0, O and 1 are never issued
  assert.notEqual(guardian.hashCode('ABC234', 'a@b.co'), guardian.hashCode('ABC234', 'x@y.co')) // bound to the learner
  assert.equal(guardian.hashCode('ABC234', 'A@B.co'), guardian.hashCode('ABC234', 'a@b.co'))
})

test('verify: the right code verifies; a wrong or reused code does not', async () => {
  const code = 'ABC234'
  let spent = false
  LinkCode.findOneAndUpdate = async (q) => {
    const ok = !spent && q.codeHash === guardian.hashCode(code, 'aanya@example.com') && q.usedAt === null && q.expiresAt.$gt instanceof Date
    if (ok) spent = true
    return ok ? { _id: 'l1' } : null
  }
  const c = child({ linkStatus: 'pending' })
  stubFind(c)

  let res = fakeRes()
  await parent.verifyChildLink(req({ params: { id: 'v1' }, body: { code: 'ZZZZZZ' } }), res)
  assert.equal(res.statusCode, 400)
  assert.equal(c.linkStatus, 'pending')

  res = fakeRes()
  await parent.verifyChildLink(req({ params: { id: 'v1' }, body: { code: 'abc-234' } }), res)
  assert.equal(res.statusCode, 200)
  assert.equal(c.linkStatus, 'verified')
  assert.equal(c.verifiedBy, 'child_code')

  const second = child({ linkStatus: 'pending' })
  stubFind(second)
  res = fakeRes()
  await parent.verifyChildLink(req({ params: { id: 'v2' }, body: { code } }), res)
  assert.equal(res.statusCode, 400, 'a code works once')
  assert.equal(second.linkStatus, 'pending')
})

test('verify: guessing is rate limited per parent', async () => {
  LinkCode.findOneAndUpdate = async () => null
  stubFind(child({ linkStatus: 'pending', email: 'limit1@example.com' }))
  const codes = []
  for (let i = 0; i < 7; i++) {
    const res = fakeRes()
    await parent.verifyChildLink(req({ params: { id: 'rl1' }, body: { code: 'ZZZZZZ' } }), res)
    codes.push(res.statusCode)
  }
  assert.deepEqual(codes, [400, 400, 400, 400, 400, 429, 429])
})

test('verify: many parent accounts cannot out-guess the per-learner limit', async () => {
  LinkCode.findOneAndUpdate = async () => null
  stubFind(child({ linkStatus: 'pending', email: 'limit2@example.com' }))
  let blocked = 0
  for (let i = 0; i < 14; i++) {
    const res = fakeRes()
    await parent.verifyChildLink(req({ parent: { id: `p${i}`, email: 'x@y.co' }, params: { id: 'rl2' }, body: { code: 'ZZZZZZ' } }), res)
    if (res.statusCode === 429) blocked++
  }
  assert.equal(blocked, 4) // 10 allowed per learner, then blocked
})

test('limiter: the window slides', () => {
  let t = 0
  const lim = guardian.createLimiter({ max: 2, windowMs: 1000, now: () => t })
  assert.ok(lim.take('k')); assert.ok(lim.take('k')); assert.equal(lim.take('k'), false)
  t = 1001
  assert.ok(lim.take('k'))
})

test('learner link code: made once, capped at 5 waiting', async () => {
  let active = 0
  LinkCode.countDocuments = async () => active
  const made = []
  LinkCode.create = async (d) => { made.push(d) }
  let res = fakeRes()
  await links.createLinkCode({ user: { email: 'Aanya@Example.com' } }, res)
  assert.equal(res.statusCode, 201)
  assert.match(res.body.code, /^[A-HJ-NP-Z2-9]{6}$/)
  assert.equal(made[0].email, 'aanya@example.com')
  assert.ok(!('code' in made[0]), 'the plain code is never stored')
  assert.equal(made[0].codeHash, guardian.hashCode(res.body.code, 'aanya@example.com'))
  active = 5
  res = fakeRes()
  await links.createLinkCode({ user: { email: 'aanya@example.com' } }, res)
  assert.equal(res.statusCode, 429)
})
