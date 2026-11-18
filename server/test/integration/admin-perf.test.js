// ADMIN quality bar: a 500-student school, 90 days of learning. The school
// overview answers in under 2 s and a unit drill-down in under 500 ms.
const test = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const { start } = require('./harness')

const oid = () => new mongoose.Types.ObjectId()
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(new Date())
const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
let app, A, ids = {}

test.before(async () => {
  app = await start()
  const db = app.db.admin
  const orgId = oid()
  await db.collection('organizations').insertOne({ _id: orgId, name: 'Big School', adminUid: 'big-1', adminEmail: 'head@big.test', kind: 'institute', status: 'approved' })
  await app.db.superadmin.collection('organizations').insertOne({ name: 'Big School', adminOrgId: String(orgId), adminUid: 'big-1', adminEmail: 'head@big.test', subscriptionPlan: 'free' })
  A = app.tokens.admin('1', String(orgId), 'big-1')
  const bulk = await app.call('POST', '/api/admin/units/bulk', { token: A, body: { spec: 'Grades 1-8, sections A-C' } })
  assert.equal(bulk.body.created, 32)
  const sections = await db.collection('orgunits').find({ orgId, type: 'section' }).toArray()
  ids.grade = String((await db.collection('orgunits').findOne({ orgId, name: 'Grade 4' }))._id)
  const students = []
  for (let i = 0; i < 500; i++) students.push({ _id: oid(), name: `Student ${i}`, email: `s${i}@big.test`, orgId, unitId: sections[i % sections.length]._id, batchIds: [], status: 'active' })
  await db.collection('students').insertMany(students)
  const days = []
  for (let i = 0; i < 500; i++) {
    for (let d = 0; d < 90; d++) {
      if ((i + d) % 3 === 0) continue
      const answered = 5 + ((i * 7 + d) % 20)
      days.push({ email: `s${i}@big.test`, date: addDays(today, -d), tz: 'UTC', minutes: 10 + (d % 15), sessions: 1, answered, correct: Math.floor(answered * 0.75), firstTry: 0, hints: 0, timeMsSum: 0, timedCount: 0, xp: 0, stars: 0,
        byModuleSubject: { [`read_${['english', 'maths', 'science'][i % 3]}`]: { answered, correct: Math.floor(answered * 0.75), minutes: 10 } }, byHour: { 17: answered }, devices: { phone: answered }, sources: { practice: answered } })
    }
  }
  for (let i = 0; i < days.length; i += 5000) await app.db.main.collection('learnerdays').insertMany(days.slice(i, i + 5000))
  await app.db.main.collection('learnerdays').createIndex({ email: 1, date: 1 }, { unique: true })
})
test.after(async () => { await app?.stop() })

const timed = async (route) => {
  await app.call('GET', route, { token: A }) // warm
  const t0 = performance.now()
  const r = await app.call('GET', route, { token: A })
  return { r, ms: performance.now() - t0 }
}

test('500 students: school overview < 2 s, unit drill-down < 500 ms, tree < 1 s', async () => {
  const month = `from=${addDays(today, -29)}&to=${today}`
  const ov = await timed(`/api/admin/school/overview?${month}`)
  assert.equal(ov.r.status, 200)
  assert.equal(ov.r.body.tiles.learners, 500)
  assert.ok(ov.ms < 2000, `overview took ${Math.round(ov.ms)} ms`)
  const unit = await timed(`/api/admin/units/${ids.grade}/analytics/overview?${month}`)
  assert.equal(unit.r.body.totals.learners > 0, true)
  assert.ok(unit.ms < 500, `unit drill-down took ${Math.round(unit.ms)} ms`)
  const tree = await timed('/api/admin/units')
  assert.ok(tree.ms < 1000, `tree took ${Math.round(tree.ms)} ms`)
  console.log(`overview ${Math.round(ov.ms)} ms · unit ${Math.round(unit.ms)} ms · tree ${Math.round(tree.ms)} ms`)
})
