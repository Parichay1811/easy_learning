// ADMIN: the school tree, unit analytics, staff roles and isolation.
// The isolation rules come first: one school never sees another, and a
// coordinator never sees outside their units.
const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { start } = require('./harness')

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } })
const idToken = (uid, email, name = 'Person') => jwt.sign({ sub: uid, email, email_verified: true, name }, privateKey, { algorithm: 'RS256', keyid: 'test-kid', audience: 'learningo-c9ac4', issuer: 'https://securetoken.google.com/learningo-c9ac4', expiresIn: '1h' })
const oid = () => new mongoose.Types.ObjectId()
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(new Date())
const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }

let app, A, B, ids = {}
const unitByName = async (name, orgId = ids.orgA) => app.db.admin.collection('orgunits').findOne({ name, orgId: new mongoose.Types.ObjectId(orgId) })

test.before(async () => {
  app = await start({ env: { TEST_FIREBASE_PUBLIC_KEY: publicKey }, preload: [require.resolve('./fake-firebase')] })
  const db = app.db.admin
  const orgA = oid(), orgB = oid()
  await db.collection('organizations').insertMany([
    { _id: orgA, name: 'Sunrise', adminUid: 'a-1', adminEmail: 'head@sunrise.test', kind: 'institute', status: 'approved' },
    { _id: orgB, name: 'Other School', adminUid: 'a-2', adminEmail: 'head@other.test', kind: 'institute', status: 'approved' },
  ])
  await app.db.superadmin.collection('organizations').insertMany([
    { name: 'Sunrise', adminOrgId: String(orgA), adminUid: 'a-1', adminEmail: 'head@sunrise.test', status: 'approved', subscriptionPlan: 'free' },
    { name: 'Other School', adminOrgId: String(orgB), adminUid: 'a-2', adminEmail: 'head@other.test', status: 'approved', subscriptionPlan: 'free' },
  ])
  ids.orgA = String(orgA); ids.orgB = String(orgB)
  A = app.tokens.admin('1', ids.orgA, 'a-1')
  B = app.tokens.admin('2', ids.orgB, 'a-2')
})
test.after(async () => { if (process.env.SHOW_LOG) console.log(app?.log()); await app?.stop() })

test('tree: bulk create, rename, move a subtree, refuse bad moves', async () => {
  const bulk = await app.call('POST', '/api/admin/units/bulk', { token: A, body: { spec: 'Grades 4-5, sections A-B' } })
  assert.equal(bulk.status, 201)
  assert.equal(bulk.body.created, 6)
  const again = await app.call('POST', '/api/admin/units/bulk', { token: A, body: { spec: 'Grades 4-5, sections A-B' } })
  assert.equal(again.body.created, 0, 'repeating is safe')
  const g4 = await unitByName('Grade 4'), g5 = await unitByName('Grade 5'), s4a = await unitByName('4A'), s5b = await unitByName('5B')
  Object.assign(ids, { g4: String(g4._id), g5: String(g5._id), s4a: String(s4a._id), s4b: String((await unitByName('4B'))._id), s5a: String((await unitByName('5A'))._id), s5b: String(s5b._id) })
  assert.equal(s4a.path, `/${ids.g4}/${ids.s4a}/`)
  const campus = await app.call('POST', '/api/admin/units', { token: A, body: { type: 'campus', name: 'Main campus' } })
  assert.equal(campus.status, 201)
  ids.campus = String(campus.body.unit._id)
  // move Grade 5 (with its sections) under the campus: the whole subtree follows
  const mv = await app.call('PATCH', `/api/admin/units/${ids.g5}`, { token: A, body: { parentId: ids.campus } })
  assert.equal(mv.status, 200)
  assert.equal((await unitByName('5B')).path, `/${ids.campus}/${ids.g5}/${ids.s5b}/`)
  assert.equal((await unitByName('5B')).depth, 2)
  assert.equal((await app.call('PATCH', `/api/admin/units/${ids.campus}`, { token: A, body: { parentId: ids.g5 } })).status, 400, 'not inside itself')
  assert.equal((await app.call('PATCH', `/api/admin/units/${ids.g4}`, { token: A, body: { parentId: ids.s5b } })).status, 400, 'a grade cannot go in a section')
  const ren = await app.call('PATCH', `/api/admin/units/${ids.s4a}`, { token: A, body: { name: '4A Sunflowers' } })
  assert.equal(ren.body.unit.name, '4A Sunflowers')
  await app.call('PATCH', `/api/admin/units/${ids.s4a}`, { token: A, body: { name: '4A' } })
  // another school can't touch it
  assert.equal((await app.call('PATCH', `/api/admin/units/${ids.s4a}`, { token: B, body: { name: 'hacked' } })).status, 404)
  assert.equal((await app.call('DELETE', `/api/admin/units/${ids.s4a}`, { token: B })).status, 404)
  assert.equal((await app.call('POST', '/api/admin/units', { token: B, body: { type: 'section', name: 'X', parentId: ids.g4 } })).status, 404)
  const treeB = await app.call('GET', '/api/admin/units', { token: B })
  assert.deepEqual(treeB.body.tree, [])
})

test('people in units, counts, unit analytics; no cross-school reach', async () => {
  const db = app.db.admin
  const orgA = new mongoose.Types.ObjectId(ids.orgA), orgB = new mongoose.Types.ObjectId(ids.orgB)
  const tutor4 = oid(), tutor5 = oid(), batch5 = oid()
  ids.tutor4 = String(tutor4); ids.tutor5 = String(tutor5); ids.batch5 = String(batch5)
  const st = (name, unit, extra = {}) => ({ _id: oid(), name, email: `${name.toLowerCase()}@kids.test`, orgId: orgA, unitId: new mongoose.Types.ObjectId(unit), batchIds: [], status: 'active', ...extra })
  const students = [st('Asha', ids.s4a), st('Ben', ids.s4a), st('Cara', ids.s4b), st('Dev', ids.s5a, { batchIds: [batch5] }), st('Eli', ids.s5b, { batchIds: [batch5] })]
  await db.collection('students').insertMany([...students, { _id: oid(), name: 'Zed', email: 'zed@kids.test', orgId: orgB, status: 'active', batchIds: [] }])
  for (const s of students) ids[s.name] = String(s._id)
  await db.collection('tutors').insertMany([
    { _id: tutor4, name: 'Ms Four', email: 'four@sunrise.test', orgId: orgA, unitIds: [new mongoose.Types.ObjectId(ids.g4)], batchIds: [], status: 'active', authStatus: 'active', lastLoginAt: new Date() },
    { _id: tutor5, name: 'Mr Five', email: 'five@sunrise.test', orgId: orgA, unitIds: [], batchIds: [batch5], status: 'active', authStatus: 'unclaimed' },
  ])
  await db.collection('batches').insertOne({ _id: batch5, name: 'Grade 5 Maths', orgId: orgA, unitId: new mongoose.Types.ObjectId(ids.g5), tutorIds: [tutor5], directTutorIds: [tutor5], subjects: [], studentIds: [students[3]._id, students[4]._id], status: 'active' })
  // learning: grade 4 active with good accuracy, grade 5 a little, Eli nothing
  const day = (email, date, answered, correct, minutes, subject = 'maths') => ({ email, date, tz: 'UTC', minutes, sessions: 1, answered, correct, firstTry: correct, hints: 0, timeMsSum: 0, timedCount: 0, xp: 0, stars: 0, byModuleSubject: { [`read_${subject}`]: { answered, correct, minutes } }, byHour: { 17: answered }, devices: { phone: answered }, sources: { practice: answered } })
  const days = []
  for (let i = 0; i < 6; i++) {
    days.push(day('asha@kids.test', addDays(today, -i), 10, 9, 20), day('ben@kids.test', addDays(today, -i), 10, 7, 15, 'english'))
    days.push(day('asha@kids.test', addDays(today, -7 - i), 10, 6, 20))
  }
  days.push(day('dev@kids.test', today, 10, 5, 10), day('cara@kids.test', addDays(today, -1), 4, 2, 5, 'science'))
  await app.db.main.collection('learnerdays').insertMany(days)

  const t = await app.call('GET', '/api/admin/units', { token: A })
  assert.equal(t.status, 200)
  const find = (nodes, id) => { for (const n of nodes) { if (n.id === id) return n; const f = find(n.children, id); if (f) return f } return null }
  assert.deepEqual(find(t.body.tree, ids.g4).counts, { students: 3, teachers: 1, groups: 0 })
  assert.deepEqual(find(t.body.tree, ids.g5).counts, { students: 2, teachers: 1, groups: 1 })
  assert.deepEqual(find(t.body.tree, ids.campus).counts, { students: 2, teachers: 1, groups: 1 })
  assert.ok(find(t.body.tree, ids.g4).health.engagement > find(t.body.tree, ids.g5).health.engagement)

  const ov = await app.call('GET', `/api/admin/units/${ids.g4}/analytics/overview`, { token: A })
  assert.equal(ov.status, 200)
  assert.equal(ov.body.totals.learners, 3) // Asha, Ben, Cara learned this week
  assert.equal(ov.body.totals.answered, 124)
  const sec = await app.call('GET', `/api/admin/units/${ids.s4b}/analytics/learners`, { token: A })
  assert.deepEqual(sec.body.learners.map((l) => l.name), ['Cara'])
  const viaQuery = await app.call('GET', `/api/admin/analytics/learners?unitId=${ids.g5}`, { token: A })
  assert.deepEqual(viaQuery.body.learners.map((l) => l.name).sort(), ['Dev', 'Eli'])
  // the old whole-school endpoint is unchanged
  assert.equal((await app.call('GET', '/api/admin/analytics/learners', { token: A })).body.learners.length, 5)
  // another school's admin
  assert.equal((await app.call('GET', `/api/admin/units/${ids.g4}/analytics/overview`, { token: B })).status, 404)
  assert.equal((await app.call('GET', `/api/admin/analytics/overview?unitId=${ids.g4}`, { token: B })).status, 404)
  assert.equal((await app.call('GET', `/api/admin/units/${ids.g4}/people`, { token: B })).status, 404)
  assert.equal((await app.call('GET', `/api/admin/students/${ids.Asha}/profile`, { token: B })).status, 404)
  assert.equal((await app.call('POST', `/api/admin/students/${ids.Asha}/move`, { token: B, body: { toUnitId: ids.s4b } })).status, 404)
  assert.equal((await app.call('GET', '/api/admin/units/not-an-id/analytics/overview', { token: A })).status, 404)
  // not empty: can't delete
  const del = await app.call('DELETE', `/api/admin/units/${ids.s4a}`, { token: A })
  assert.equal(del.status, 409)
  assert.equal(del.body.code, 'UNIT_NOT_EMPTY')
})

test('staff: coordinator signs in with a verified email and never sees outside their units', async () => {
  const add = await app.call('POST', '/api/admin/staff', { token: A, body: { email: 'Coord@Sunrise.test', name: 'Coord', role: 'coordinator', unitIds: [ids.g4] } })
  assert.equal(add.status, 201)
  ids.coordStaff = String(add.body.staff._id)
  assert.equal((await app.call('POST', '/api/admin/staff', { token: B, body: { email: 'x@other.test', role: 'viewer', unitIds: [ids.g4] } })).status, 404, "other school's unit")
  assert.equal((await app.call('PATCH', `/api/admin/staff/${ids.coordStaff}`, { token: B, body: { role: 'office' } })).status, 404)
  // sign in: body identity is ignored, the verified token decides
  const forged = await app.call('POST', '/api/admin/auth/google', { body: { email: 'coord@sunrise.test', uid: 'x' } })
  assert.equal(forged.status, 400)
  const signin = await app.call('POST', '/api/admin/auth/google', { body: { idToken: idToken('uid-coord', 'coord@sunrise.test', 'Coord') } })
  assert.equal(signin.status, 200)
  assert.equal(signin.body.admin.staffRole, 'coordinator')
  const C = signin.body.token
  ids.C = C
  const me = await app.call('GET', '/api/admin/access', { token: C })
  assert.equal(me.body.role, 'coordinator')
  assert.ok(me.body.perms.includes('analytics.read'))

  const t = await app.call('GET', '/api/admin/units', { token: C })
  assert.deepEqual(t.body.tree.map((n) => n.name), ['Grade 4'])
  assert.equal(t.body.unplaced, null)
  // inside: yes
  assert.equal((await app.call('GET', `/api/admin/units/${ids.s4a}/analytics/overview`, { token: C })).status, 200)
  assert.equal((await app.call('GET', `/api/admin/students/${ids.Asha}/analytics/overview`, { token: C })).status, 200)
  assert.equal((await app.call('GET', `/api/admin/students/${ids.Asha}/dashboard/stats`, { token: C })).status, 200)
  const school = await app.call('GET', '/api/admin/analytics/learners', { token: C })
  assert.deepEqual(school.body.learners.map((l) => l.name).sort(), ['Asha', 'Ben', 'Cara'])
  const ov = await app.call('GET', '/api/admin/school/overview', { token: C })
  assert.equal(ov.status, 200)
  assert.equal(ov.body.tiles.learners, 3)
  const people = await app.call('GET', '/api/admin/people/students', { token: C })
  assert.deepEqual(people.body.students.map((s) => s.name).sort(), ['Asha', 'Ben', 'Cara'])
  // outside: never
  for (const route of [
    `/api/admin/units/${ids.g5}/analytics/overview`, `/api/admin/analytics/overview?unitId=${ids.g5}`, `/api/admin/analytics/overview?batchId=${ids.batch5}`,
    `/api/admin/students/${ids.Dev}/analytics/overview`, `/api/admin/students/${ids.Dev}/dashboard/stats`, `/api/admin/students/${ids.Dev}/performance`,
    `/api/admin/students/${ids.Dev}/profile`, `/api/admin/units/${ids.g5}/people`, `/api/admin/people/students?unitId=${ids.g5}`,
    `/api/admin/students/${ids.Dev}/history`,
  ]) assert.equal((await app.call('GET', route, { token: C })).status, 404, route)
  assert.equal((await app.call('POST', `/api/admin/students/${ids.Dev}/move`, { token: C, body: { toUnitId: ids.s4a } })).status, 404)
  assert.equal((await app.call('POST', `/api/admin/students/${ids.Asha}/move`, { token: C, body: { toUnitId: ids.s5a } })).status, 404, 'cannot move a student out of their units')
  const cmp = await app.call('GET', `/api/admin/school/compare?items=unit:${ids.s4a},unit:${ids.s5a}`, { token: C })
  assert.equal(cmp.status, 404)
  const teachers = await app.call('GET', '/api/admin/school/teachers', { token: C })
  assert.deepEqual(teachers.body.teachers.map((x) => x.name), ['Ms Four'])
  // whole-school and admin-only pages are refused
  for (const [m, route] of [['GET', '/api/admin/students'], ['GET', '/api/admin/tutors'], ['GET', '/api/admin/batches'], ['GET', '/api/admin/parents'], ['GET', '/api/admin/chat'], ['POST', '/api/admin/org'],
    ['GET', '/api/admin/questions/uploads'], ['PUT', '/api/admin/policies'], ['GET', '/api/admin/audit'], ['GET', '/api/admin/staff'], ['POST', '/api/admin/units'], ['GET', '/api/admin/billing'], ['POST', '/api/admin/import/upload'], ['POST', '/api/admin/invites']]) {
    const r = await app.call(m, route, { token: C, body: m === 'GET' ? undefined : {} })
    assert.equal(r.status, 403, `${m} ${route}`)
  }
  // inside their units they can move a student between sections
  const mv = await app.call('POST', `/api/admin/students/${ids.Ben}/move`, { token: C, body: { toUnitId: ids.s4b, reason: 'Friend group' } })
  assert.equal(mv.status, 200)
  const hist = await app.call('GET', `/api/admin/students/${ids.Ben}/history`, { token: C })
  assert.equal(hist.body.history[0].to, 'Grade 4 › 4B')
  // the shared actor is 'staff', not 'admin'
  const ent = await app.call('GET', '/api/me', { token: C })
  assert.equal(ent.body.actor.role, 'staff')
  assert.ok(ent.body.entitlements.modules.includes('org.analytics'))
})

test('staff: office staff manage people but see no analytics; viewers only read analytics; removal is immediate', async () => {
  await app.call('POST', '/api/admin/staff', { token: A, body: { email: 'office@sunrise.test', role: 'office' } })
  await app.call('POST', '/api/admin/staff', { token: A, body: { email: 'board@sunrise.test', role: 'viewer' } })
  const O = (await app.call('POST', '/api/admin/auth/google', { body: { idToken: idToken('uid-office', 'office@sunrise.test') } })).body.token
  const V = (await app.call('POST', '/api/admin/auth/google', { body: { idToken: idToken('uid-board', 'board@sunrise.test') } })).body.token
  assert.equal((await app.call('GET', '/api/admin/students', { token: O })).status, 200)
  assert.equal((await app.call('GET', '/api/admin/students', { token: O })).body.students.length, 5, 'legacy list is the right school')
  assert.equal((await app.call('GET', '/api/admin/invites', { token: O })).status, 200)
  for (const route of ['/api/admin/analytics/overview', '/api/admin/school/overview', `/api/admin/students/${ids.Asha}/analytics/overview`, `/api/admin/students/${ids.Asha}/dashboard/stats`, `/api/admin/units/${ids.g4}/analytics/overview`, '/api/admin/review']) {
    assert.equal((await app.call('GET', route, { token: O })).status, 403, route)
  }
  assert.equal((await app.call('GET', '/api/admin/school/overview', { token: V })).status, 200)
  assert.equal((await app.call('GET', '/api/admin/units', { token: V })).status, 200)
  for (const [m, route] of [['GET', '/api/admin/students'], ['GET', '/api/admin/people/students'], ['POST', `/api/admin/students/${ids.Asha}/leave`], ['PATCH', `/api/admin/units/${ids.g4}`], ['POST', '/api/admin/units/bulk']]) {
    assert.equal((await app.call(m, route, { token: V, body: m === 'GET' ? undefined : {} })).status, 403, `${m} ${route}`)
  }
  // removing (or disabling) staff ends access on the next request
  const list = await app.call('GET', '/api/admin/staff', { token: A })
  const board = list.body.staff.find((s) => s.email === 'board@sunrise.test')
  await app.call('PATCH', `/api/admin/staff/${board._id}`, { token: A, body: { status: 'disabled' } })
  const r = await app.call('GET', '/api/admin/school/overview', { token: V })
  assert.equal(r.status, 401)
  assert.equal(r.body.code, 'STAFF_REVOKED')
  // the change is in the audit log
  const log = await app.call('GET', '/api/admin/audit?action=staff', { token: A })
  assert.ok(log.body.events.some((e) => e.action === 'staff.role_change'))
  // someone who runs their own school stays its admin even if listed as staff elsewhere
  await app.call('POST', '/api/admin/staff', { token: A, body: { email: 'head@other.test', role: 'viewer' } })
  const own = await app.call('POST', '/api/admin/auth/google', { body: { idToken: idToken('a-2', 'head@other.test') } })
  assert.equal(own.body.admin.staffRole, undefined)
})

test('module gate: a school without org.tree keeps working flat', async () => {
  await app.db.superadmin.collection('organizations').updateOne({ adminOrgId: ids.orgB }, { $set: { featureOverrides: ['-org.tree', '-staff.roles'] } })
  const r = await app.call('GET', '/api/admin/units', { token: B })
  assert.equal(r.status, 402)
  assert.equal(r.body.code, 'MODULE_LOCKED')
  assert.equal((await app.call('POST', '/api/admin/units/bulk', { token: B, body: { spec: 'Grades 1-2' } })).status, 402)
  assert.equal((await app.call('GET', `/api/admin/units/${ids.g4}/analytics/overview`, { token: B })).status, 402)
  assert.equal((await app.call('GET', '/api/admin/staff', { token: B })).status, 402)
  assert.equal((await app.call('GET', '/api/admin/batches', { token: B })).status, 200)
  assert.equal((await app.call('GET', '/api/admin/analytics/overview', { token: B })).status, 200)
  const ov = await app.call('GET', '/api/admin/school/overview', { token: B })
  assert.equal(ov.status, 200)
  assert.equal(ov.body.sunburst.kind, 'groups')
})

test('school analytics: overview tiles, heatmap, teachers, compare, lists, usage', async () => {
  const t0 = Date.now()
  const ov = await app.call('GET', '/api/admin/school/overview', { token: A })
  assert.equal(ov.status, 200)
  assert.ok(Date.now() - t0 < 2000)
  assert.equal(ov.body.tiles.learners, 5)
  assert.equal(ov.body.tiles.activeLearners, 4)
  assert.equal(ov.body.tiles.activePct, 80)
  assert.equal(ov.body.tiles.testsAvailable, false)
  assert.ok(ov.body.story.includes('80 % of students were active this week'))
  assert.equal(ov.body.heatmap.rowsAre, 'grade')
  const g4 = ov.body.heatmap.rows.find((r) => r.name === 'Grade 4')
  assert.equal(g4.cells.maths.answered, 60)
  assert.equal(g4.cells.maths.accuracy, 90)
  assert.equal(ov.body.sunburst.kind, 'tree')
  const teachers = await app.call('GET', '/api/admin/school/teachers', { token: A })
  assert.deepEqual(teachers.body.teachers.map((x) => x.name), ['Mr Five', 'Ms Four'], 'sorted by name, not ranked')
  const five = teachers.body.teachers.find((x) => x.name === 'Mr Five')
  assert.equal(five.students, 2)
  assert.equal(five.tests, 0)
  const cmp = await app.call('GET', `/api/admin/school/compare?items=unit:${ids.g4},unit:${ids.g5},batch:${ids.batch5}`, { token: A })
  assert.equal(cmp.status, 200)
  assert.equal(cmp.body.items.length, 3)
  assert.ok(cmp.body.notes.length >= 1)
  const periods = await app.call('GET', `/api/admin/school/compare?items=unit:${ids.s4a}@${addDays(today, -6)}..${today},unit:${ids.s4a}@${addDays(today, -13)}..${addDays(today, -7)}`, { token: A })
  assert.equal(periods.body.items[0].accuracy, 90)
  assert.equal(periods.body.items[1].accuracy, 60)
  assert.equal((await app.call('GET', '/api/admin/school/compare?items=unit:x', { token: A })).status, 400)
  const lists = await app.call('GET', '/api/admin/school/lists', { token: A })
  assert.equal(lists.body.atRiskCount, 1)
  assert.equal(lists.body.atRisk[0].students[0].name, 'Eli')
  assert.deepEqual(lists.body.atRisk[0].students[0].teachers, ['Mr Five'])
  assert.equal(lists.body.wins[0].name, 'Asha')
  assert.equal(lists.body.wins[0].accuracyDelta, 30)
  const usage = await app.call('GET', '/api/admin/school/usage', { token: A })
  assert.equal(usage.body.teachers.total, 2)
  assert.equal(usage.body.teachers.active7, 1)
  assert.ok(usage.body.features.practice > 0)
  assert.equal(usage.body.learners.series.length, 7)
  const tests = await app.call('GET', '/api/admin/school/tests', { token: A })
  assert.equal(tests.body.testsAvailable, false)
  const profile = await app.call('GET', `/api/admin/students/${ids.Dev}/profile`, { token: A })
  assert.equal(profile.body.student.unit, 'Main campus › Grade 5 › 5A')
  assert.equal(profile.body.groups[0].teachers[0], 'Mr Five')
})

test('school calendar: holidays keep a student\'s streak (if the school wishes)', async () => {
  // Asha: active the last 6 days, then a gap of 1 day (-6 is the 7th day back? she has -0..-5 and -7..-12)
  const ov = async () => (await app.call('GET', `/api/admin/students/${ids.Asha}/analytics/overview`, { token: A })).body.streak
  assert.equal((await ov()).current, 6)
  const year = await app.call('POST', '/api/admin/years', { token: A, body: { name: 'This year', start: addDays(today, -200), end: addDays(today, 150), terms: [{ name: 'Term 1', start: addDays(today, -60), end: addDays(today, 30) }], events: [{ kind: 'holiday', name: 'Diwali', start: addDays(today, -6), end: addDays(today, -6) }] } })
  assert.equal(year.status, 201)
  ids.year = String(year.body.year._id)
  assert.equal((await ov()).current, 12, 'the holiday bridges the gap')
  await app.call('PUT', '/api/admin/policies', { token: A, body: { holidaysKeepStreak: false } })
  assert.equal((await ov()).current, 6)
  await app.call('PUT', '/api/admin/policies', { token: A, body: { holidaysKeepStreak: true } })
  // validation
  assert.equal((await app.call('POST', '/api/admin/years', { token: A, body: { name: 'Bad', start: '2027-01-01', end: '2026-01-01' } })).status, 400)
  assert.equal((await app.call('POST', '/api/admin/years', { token: A, body: { name: 'Overlap', start: addDays(today, -10), end: addDays(today, 10) } })).status, 409)
  // terms drive "vs previous term"
  const term = year.body.year.terms[0]._id
  const byTerm = await app.call('GET', `/api/admin/school/overview?termId=${term}`, { token: A })
  assert.equal(byTerm.status, 200)
  assert.equal(byTerm.body.range.term.name, 'Term 1')
})

test('promotion: 4A -> 5A in bulk, with a repeater and a leaver; old groups archived and read-only', async () => {
  const next = await app.call('POST', '/api/admin/years', { token: A, body: { name: 'Next year', start: addDays(today, 151), end: addDays(today, 500) } })
  const sug = await app.call('GET', '/api/admin/promotion/suggest', { token: A })
  const m4a = sug.body.mapping.find((m) => m.fromUnitId === ids.s4a)
  assert.equal(m4a.toUnitId, ids.s5a)
  const m5a = sug.body.mapping.find((m) => m.fromUnitId === ids.s5a)
  assert.equal(m5a.action, 'leave', 'top grade leaves')
  const body = { toYearId: next.body.year._id, mapping: [{ ...m4a, action: 'promote' }, { ...m5a, action: 'leave' }], exceptions: [{ studentId: ids.Asha, action: 'repeat' }], archiveGroups: true }
  const prev = await app.call('POST', '/api/admin/promotion/preview', { token: A, body })
  assert.equal(prev.status, 200)
  assert.deepEqual(prev.body.summary, { repeat: 1, leave: 1 })
  assert.equal((await app.call('POST', '/api/admin/promotion/preview', { token: B, body })).status, 402, 'other school has no tree module')
  const apply = await app.call('POST', '/api/admin/promotion/apply', { token: A, body })
  assert.equal(apply.status, 200)
  const dev = await app.db.admin.collection('students').findOne({ name: 'Dev' })
  assert.equal(dev.status, 'inactive')
  const asha = await app.db.admin.collection('students').findOne({ name: 'Asha' })
  assert.equal(String(asha.unitId), ids.s4a)
  assert.ok(apply.body.archived >= 1)
  const edit = await app.call('PATCH', `/api/admin/batches/${ids.batch5}`, { token: A, body: { name: 'Renamed' } })
  assert.equal(edit.status, 409)
  assert.equal(edit.body.code, 'GROUP_ARCHIVED')
  assert.equal((await app.call('GET', `/api/admin/batches/${ids.batch5}`, { token: A })).status, 200, 'still readable')
  const years = await app.call('GET', '/api/admin/years', { token: A })
  assert.equal(years.body.years.find((y) => y.name === 'Next year').status, 'current')
})
