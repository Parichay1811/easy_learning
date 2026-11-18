// ADMIN: bulk import, parent invitations (and the parent sign-in that links them),
// seats, moves/leavers/transfers, policies, privacy, audit and the review queue.
const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { start } = require('./harness')

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } })
const idToken = (uid, email, name = 'Person') => jwt.sign({ sub: uid, email, email_verified: true, name }, privateKey, { algorithm: 'RS256', keyid: 'test-kid', audience: 'learningo-c9ac4', issuer: 'https://securetoken.google.com/learningo-c9ac4', expiresIn: '1h' })
const oid = () => new mongoose.Types.ObjectId()

let app, A, B
const ids = {}

async function upload(token, filename, text, kind = 'students') {
  const fd = new FormData()
  fd.append('kind', kind)
  fd.append('file', new Blob([text], { type: 'text/csv' }), filename)
  const r = await fetch(`${app.url}/api/admin/import/upload`, { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: fd })
  return { status: r.status, body: await r.json() }
}

test.before(async () => {
  app = await start({ env: { TEST_FIREBASE_PUBLIC_KEY: publicKey }, preload: [require.resolve('./fake-firebase')] })
  const orgA = oid(), orgB = oid()
  await app.db.admin.collection('organizations').insertMany([
    { _id: orgA, name: 'Sunrise', adminUid: 'a-1', adminEmail: 'head@sunrise.test', kind: 'institute', status: 'approved' },
    { _id: orgB, name: 'Other School', adminUid: 'a-2', adminEmail: 'head@other.test', kind: 'institute', status: 'approved' },
  ])
  await app.db.superadmin.collection('organizations').insertMany([
    { name: 'Sunrise', adminOrgId: String(orgA), adminUid: 'a-1', adminEmail: 'head@sunrise.test', status: 'approved', subscriptionPlan: 'free' },
    { name: 'Other School', adminOrgId: String(orgB), adminUid: 'a-2', adminEmail: 'head@other.test', status: 'approved', subscriptionPlan: 'free' },
  ])
  Object.assign(ids, { orgA: String(orgA), orgB: String(orgB) })
  A = app.tokens.admin('1', ids.orgA, 'a-1')
  B = app.tokens.admin('2', ids.orgB, 'a-2')
})
test.after(async () => { if (process.env.SHOW_LOG) console.log(app?.log()); await app?.stop() })

const CSV = [
  'Student ID,Full Name,E-mail,Year,Section,Parent Email,Parent 2 Email',
  'S1,Aarav Shah,aarav@kids.test,4,A,neha@home.test,',
  'S2,Bina Rao,bina@kids.test,4,B,ravi@home.test,',
  'S3,Chen Li,CHEN@kids.test,5,A,,',
  'S4,Dup Email,aarav@kids.test,5,A,,',
  'S5,Bad Mail,not-an-email,5,A,,',
  'S6,No Grade,,,,"neha@home.test; mum2@home.test",',
  'S7,,x@kids.test,5,A,,',
].join('\n')

test('import: map columns, dry run finds duplicates and bad emails, import, re-import updates', async () => {
  const up = await upload(A, 'students.csv', CSV)
  assert.equal(up.status, 201)
  assert.equal(up.body.rowCount, 7)
  assert.equal(up.body.mapping.name, 1)
  assert.equal(up.body.mapping.email, 2)
  assert.equal(up.body.mapping.grade, 3)
  assert.equal(up.body.mapping.externalId, 0)
  const pv = await app.call('POST', `/api/admin/import/${up.body.importId}/preview`, { token: A, body: { kind: 'students', mapping: up.body.mapping } })
  assert.equal(pv.status, 200)
  assert.deepEqual(pv.body.summary, { total: 7, create: 4, update: 0, skip: 3, warnings: 1, parents: 3 })
  const errs = pv.body.rows.filter((r) => r.errors.length).map((r) => r.errors[0])
  assert.ok(errs.some((e) => e.includes('Duplicate email')))
  assert.ok(errs.some((e) => e.includes('not a valid email')))
  assert.ok(errs.some((e) => e.includes('Name is missing')))
  assert.ok(pv.body.newUnits.includes('Grade 4') && pv.body.newUnits.includes('4A'))
  // nothing is written by the dry run
  assert.equal(await app.db.admin.collection('students').countDocuments({}), 0)
  // another school can't use this upload
  assert.equal((await app.call('POST', `/api/admin/import/${up.body.importId}/preview`, { token: B, body: { kind: 'students', mapping: up.body.mapping } })).status, 404)
  const go = await app.call('POST', `/api/admin/import/${up.body.importId}/commit`, { token: A, body: { kind: 'students', mapping: up.body.mapping } })
  assert.equal(go.status, 200)
  assert.equal(go.body.result.created, 4)
  assert.equal(go.body.result.parentsCreated, 3)
  assert.equal((await app.call('POST', `/api/admin/import/${up.body.importId}/commit`, { token: A, body: { kind: 'students', mapping: up.body.mapping } })).status, 409)
  const aarav = await app.db.admin.collection('students').findOne({ email: 'aarav@kids.test' })
  const s4a = await app.db.admin.collection('orgunits').findOne({ _id: aarav.unitId })
  assert.equal(s4a.name, '4A')
  ids.aarav = String(aarav._id)
  const neha = await app.db.admin.collection('parents').findOne({ email: 'neha@home.test' })
  assert.equal(neha.studentIds.length, 2, 'one parent, two children')
  // re-import with a changed name: updates, never duplicates
  const again = await upload(A, 'students.csv', CSV.replace('Aarav Shah', 'Aarav K. Shah'))
  const pv2 = await app.call('POST', `/api/admin/import/${again.body.importId}/preview`, { token: A, body: { kind: 'students', mapping: again.body.mapping } })
  assert.equal(pv2.body.summary.create, 0)
  assert.equal(pv2.body.summary.update, 4)
  await app.call('POST', `/api/admin/import/${again.body.importId}/commit`, { token: A, body: { kind: 'students', mapping: again.body.mapping } })
  assert.equal(await app.db.admin.collection('students').countDocuments({ orgId: new mongoose.Types.ObjectId(ids.orgA) }), 4)
  assert.equal((await app.db.admin.collection('students').findOne({ _id: aarav._id })).name, 'Aarav K. Shah')
  assert.equal(await app.db.admin.collection('parents').countDocuments({}), 3)
  // audited
  const ev = await app.db.main.collection('auditevents').find({ action: 'people.import', orgId: ids.orgA }).toArray()
  assert.equal(ev.length, 2)
  // bad files
  assert.equal((await upload(A, 'x.pdf', 'hello')).status, 400)
  assert.equal((await upload(A, 'empty.csv', 'Name\n')).status, 400)
  // a missing required mapping
  assert.equal((await app.call('POST', `/api/admin/import/${again.body.importId}/preview`, { token: A, body: { kind: 'students', mapping: { email: 2 } } })).status, 400)
})

test('import: teachers by email, with subjects and units', async () => {
  const csv = 'Name,Email,Subjects,Units\nAsha Mehta,asha@sunrise.test,Maths; Science,Grade 4 › 4A\nBad,,Maths,\n'
  const up = await upload(A, 'teachers.csv', csv, 'teachers')
  const pv = await app.call('POST', `/api/admin/import/${up.body.importId}/preview`, { token: A, body: { kind: 'teachers', mapping: up.body.mapping } })
  assert.deepEqual([pv.body.summary.create, pv.body.summary.skip], [1, 1])
  const go = await app.call('POST', `/api/admin/import/${up.body.importId}/commit`, { token: A, body: { kind: 'teachers', mapping: up.body.mapping } })
  assert.equal(go.body.result.created, 1)
  const t = await app.db.admin.collection('tutors').findOne({ email: 'asha@sunrise.test' })
  assert.equal(t.unitIds.length, 1)
  assert.equal(t.subjectIds.length, 2)
  ids.asha = String(t._id)
  const up2 = await upload(A, 'teachers.csv', csv, 'teachers')
  const pv2 = await app.call('POST', `/api/admin/import/${up2.body.importId}/preview`, { token: A, body: { kind: 'teachers', mapping: up2.body.mapping } })
  assert.equal(pv2.body.summary.update, 1)
})

test('parent invitations: bulk invite, status, and sign-in with that email links verified children', async () => {
  // A parent who already has a pending link they typed themselves, and an inactive school parent record.
  const pending = oid()
  await app.db.main.collection('parentaccounts').insertOne({ _id: pending, uid: 'uid-ravi', email: 'ravi@home.test', name: 'Ravi', plan: 'free' })
  await app.db.main.collection('children').insertOne({ parentId: pending, name: 'Bina', age: 9, email: 'bina@kids.test', linkStatus: 'pending' })
  await app.db.admin.collection('parents').insertOne({ name: 'Old', email: 'old@home.test', orgId: new mongoose.Types.ObjectId(ids.orgA), studentIds: [new mongoose.Types.ObjectId(ids.aarav)], status: 'inactive' })

  const inv = await app.call('POST', '/api/admin/invites', { token: A, body: { all: true, onlyNew: true } })
  assert.equal(inv.status, 200)
  assert.equal(inv.body.invited, 3)
  assert.equal(inv.body.queued, 3)
  assert.equal(inv.body.linked, 1, 'ravi already had a parent login: linked at once')
  const mail = await app.db.main.collection('outboxes').find({ kind: 'invite' }).toArray()
  assert.equal(mail.length, 3)
  assert.ok(mail.find((m) => m.to === 'neha@home.test').html.includes('Aarav'))
  const bina = await app.db.main.collection('children').findOne({ parentId: pending })
  assert.equal(bina.linkStatus, 'verified')
  assert.equal(bina.verifiedBy, 'school')
  const list = await app.call('GET', '/api/admin/invites', { token: A })
  assert.equal(list.body.counts.invited, 2)
  assert.equal(list.body.counts.linked, 1)
  // another school sees none of these parents
  assert.equal((await app.call('GET', '/api/admin/invites', { token: B })).body.total, 0)
  assert.equal((await app.call('POST', '/api/admin/invites', { token: B, body: { all: true } })).body.invited, 0)

  // Neha signs in as a parent with the invited (verified) email: both children appear, verified.
  const forged = await app.call('POST', '/api/parent/auth/google', { body: { email: 'neha@home.test' } })
  assert.equal(forged.status, 400)
  const s = await app.call('POST', '/api/parent/auth/google', { body: { idToken: idToken('uid-neha', 'neha@home.test', 'Neha') } })
  assert.equal(s.status, 200)
  const kids = await app.db.main.collection('children').find({ parentId: new mongoose.Types.ObjectId(s.body.parent.id) }).toArray()
  assert.equal(kids.length, 1, 'only children with a learning email can be linked')
  assert.equal(kids[0].linkStatus, 'verified')
  const ov = await app.call('GET', `/api/parent/children/${kids[0]._id}/analytics/overview`, { token: s.body.token })
  assert.equal(ov.status, 200)
  assert.equal((await app.call('GET', '/api/admin/invites', { token: A })).body.counts.linked, 2)
  // signing in again doesn't duplicate
  await app.call('POST', '/api/parent/auth/google', { body: { idToken: idToken('uid-neha', 'neha@home.test', 'Neha') } })
  assert.equal(await app.db.main.collection('children').countDocuments({ parentId: new mongoose.Types.ObjectId(s.body.parent.id) }), 1)
  // an inactive school parent record links nothing
  const old = await app.call('POST', '/api/parent/auth/google', { body: { idToken: idToken('uid-old', 'old@home.test') } })
  assert.equal(await app.db.main.collection('children').countDocuments({ parentId: new mongoose.Types.ObjectId(old.body.parent.id) }), 0)
  // a revoked link stays revoked
  await app.db.main.collection('children').updateOne({ parentId: pending }, { $set: { linkStatus: 'revoked' } })
  await app.call('POST', '/api/parent/auth/google', { body: { idToken: idToken('uid-ravi', 'ravi@home.test') } })
  assert.equal((await app.db.main.collection('children').findOne({ parentId: pending })).linkStatus, 'revoked')
})

test('seats: warning at 90 %, adding blocked at 100 %, rejoining needs a seat', async () => {
  await app.db.superadmin.collection('organizations').updateOne({ adminOrgId: ids.orgA }, { $set: { seats: 5 } })
  let s = await app.call('GET', '/api/admin/seats', { token: A })
  assert.deepEqual([s.body.seats.used, s.body.seats.bought, s.body.seats.state], [4, 5, 'ok'])
  const one = await app.call('POST', '/api/admin/students', { token: A, body: { name: 'Fifth', email: 'fifth@kids.test' } })
  assert.equal(one.status, 201)
  s = await app.call('GET', '/api/admin/seats', { token: A })
  assert.equal(s.body.seats.state, 'full')
  const six = await app.call('POST', '/api/admin/students', { token: A, body: { name: 'Sixth', email: 'sixth@kids.test' } })
  assert.equal(six.status, 409)
  assert.equal(six.body.code, 'SEATS_FULL')
  assert.ok(six.body.message.includes('Buy more seats'))
  const up = await upload(A, 'more.csv', 'Name,Email\nNew One,new1@kids.test\n')
  const pv = await app.call('POST', `/api/admin/import/${up.body.importId}/preview`, { token: A, body: { kind: 'students', mapping: up.body.mapping } })
  assert.equal(pv.body.seatProblem.code, 'SEATS_FULL')
  assert.equal((await app.call('POST', `/api/admin/import/${up.body.importId}/commit`, { token: A, body: { kind: 'students', mapping: up.body.mapping } })).status, 409)
  // learning is never blocked
  assert.equal((await app.call('POST', '/api/dashboard/log-answer', { token: app.tokens.student('aarav@kids.test'), body: { module: 'read', subject: 'maths', correct: true, timeTaken: 3 } })).status, 200)
  // a leaver frees a seat; their rejoining then needs one
  const left = await app.call('POST', `/api/admin/students/${ids.aarav}/leave`, { token: A, body: { reason: 'Moved city' } })
  assert.equal(left.status, 200)
  assert.equal((await app.call('POST', `/api/admin/students/${ids.aarav}/leave`, { token: A, body: {} })).status, 409)
  assert.equal((await app.call('POST', '/api/admin/students', { token: A, body: { name: 'Sixth', email: 'sixth@kids.test' } })).status, 201)
  const back = await app.call('POST', `/api/admin/students/${ids.aarav}/rejoin`, { token: A })
  assert.equal(back.status, 409)
  const hist = await app.call('GET', `/api/admin/students/${ids.aarav}/history`, { token: A })
  assert.equal(hist.body.history[0].kind, 'leave')
  const leavers = await app.call('GET', '/api/admin/people/students?status=left', { token: A })
  assert.equal(leavers.body.students[0].leaveReason, 'Moved city')
  await app.db.superadmin.collection('organizations').updateOne({ adminOrgId: ids.orgA }, { $unset: { seats: 1 } })
  assert.equal((await app.call('POST', `/api/admin/students/${ids.aarav}/rejoin`, { token: A })).status, 200)
})

test('transfer a teacher\'s groups to another teacher', async () => {
  const orgA = new mongoose.Types.ObjectId(ids.orgA)
  const other = oid(), batch = oid()
  await app.db.admin.collection('tutors').insertOne({ _id: other, name: 'Mr New', email: 'new@sunrise.test', orgId: orgA, batchIds: [], studentIds: [], status: 'active' })
  await app.db.admin.collection('batches').insertOne({ _id: batch, name: '4A Maths', orgId: orgA, directTutorIds: [new mongoose.Types.ObjectId(ids.asha)], tutorIds: [new mongoose.Types.ObjectId(ids.asha)], subjects: [], studentIds: [], status: 'active' })
  assert.equal((await app.call('POST', `/api/admin/tutors/${ids.asha}/transfer`, { token: B, body: { toTutorId: String(other) } })).status, 404)
  const r = await app.call('POST', `/api/admin/tutors/${ids.asha}/transfer`, { token: A, body: { toTutorId: String(other) } })
  assert.equal(r.status, 200)
  assert.equal(r.body.moved, 1)
  const b = await app.db.admin.collection('batches').findOne({ _id: batch })
  assert.deepEqual(b.tutorIds.map(String), [String(other)])
})

test('policies: validated, saved, separate per school; branding; audited; integrity checked; per-school log', async () => {
  const get = await app.call('GET', '/api/admin/policies', { token: A })
  assert.equal(get.body.policy.teachersCreateGroups, false)
  for (const body of [{ messaging: 'sometimes' }, { retentionYears: 50 }, { teachersCreateGroups: 'yes' }, {}]) {
    assert.equal((await app.call('PUT', '/api/admin/policies', { token: A, body })).status, 400, JSON.stringify(body))
  }
  const put = await app.call('PUT', '/api/admin/policies', { token: A, body: { teachersCreateGroups: true, messaging: 'both', retentionYears: 3, officeHours: 'Mon-Fri 3-5 pm' } })
  assert.equal(put.status, 200)
  assert.equal(put.body.policy.retentionYears, 3)
  // B's policies are separate
  assert.equal((await app.call('GET', '/api/admin/policies', { token: B })).body.policy.teachersCreateGroups, false)
  // branding
  assert.equal((await app.call('PUT', '/api/admin/branding', { token: A, body: { primaryColor: 'blue' } })).status, 400)
  const br = await app.call('PUT', '/api/admin/branding', { token: A, body: { primaryColor: '#123abc', reportFooter: 'Sunrise · Learning together' } })
  assert.equal(br.body.branding.primaryColor, '#123abc')
  // audit log: filtered by org, export, chain intact
  const log = await app.call('GET', '/api/admin/audit', { token: A })
  assert.ok(log.body.events.some((e) => e.action === 'policy.update'))
  assert.ok(log.body.events.every((e) => e.orgId === ids.orgA))
  assert.equal(log.body.integrity.intact, true)
  const other = await app.call('GET', '/api/admin/audit', { token: B })
  assert.ok(!other.body.events.some((e) => e.orgId === ids.orgA))
  const csv = await fetch(`${app.url}/api/admin/audit?format=csv`, { headers: { authorization: `Bearer ${A}` } })
  assert.equal(csv.status, 200)
  assert.ok((await csv.text()).startsWith('at,actor_role'))
  // tampering is detected
  await app.db.main.collection('auditevents').updateOne({ action: 'policy.update', orgId: ids.orgA }, { $set: { reason: 'edited later' } })
  assert.equal((await app.call('GET', '/api/admin/audit', { token: A })).body.integrity.intact, false)
})

test('data protection: sign the DPA in the app, record consent', async () => {
  const p = await app.call('GET', '/api/admin/privacy', { token: A })
  assert.equal(p.body.dpa.needsSigning, true)
  assert.equal((await app.call('POST', '/api/admin/privacy/dpa', { token: A, body: { accept: false } })).status, 400)
  assert.equal((await app.call('POST', '/api/admin/privacy/dpa', { token: A, body: { accept: true, version: 'old', signerName: 'Mrs K', signerRole: 'Principal' } })).status, 409)
  const sign = await app.call('POST', '/api/admin/privacy/dpa', { token: A, body: { accept: true, version: p.body.dpa.currentVersion, signerName: 'Mrs Kapoor', signerRole: 'Principal' } })
  assert.equal(sign.status, 200)
  const after = await app.call('GET', '/api/admin/privacy', { token: A })
  assert.equal(after.body.dpa.needsSigning, false)
  assert.equal(after.body.dpa.signerName, 'Mrs Kapoor')
  const rec = await app.call('POST', '/api/admin/privacy/consents', { token: A, body: { studentIds: [ids.aarav], basis: 'guardian', givenBy: 'Neha Shah' } })
  assert.equal(rec.body.recorded, 1)
  assert.equal((await app.call('POST', '/api/admin/privacy/consents', { token: B, body: { studentIds: [ids.aarav], basis: 'guardian' } })).status, 404)
  const prof = await app.call('GET', `/api/admin/students/${ids.aarav}/profile`, { token: A })
  assert.equal(prof.body.consent[0].basis, 'guardian')
  const setup = await app.call('GET', '/api/admin/setup', { token: A })
  assert.ok(setup.body.steps.find((s) => s.key === 'dpa').done)
  assert.ok(setup.body.percent > 50)
})

test('review queue: SLA, notes, bulk approve, coordinators see only their subjects', async () => {
  const old = new Date(Date.now() - 5 * 86400000)
  const base = { submittedByTutorId: ids.asha, submittedByName: 'Asha', submittedByEmail: 'asha@sunrise.test', orgName: 'Sunrise', originalFilename: 'q.xlsx', originalFileUrl: '/x', rowCount: 3, status: 'pending', rejectionHistory: [], reviewNotes: [], tags: [] }
  const ins = await app.db.superadmin.collection('questionuploadbatches').insertMany([
    { ...base, module: 'read', subject: 'maths', orgId: ids.orgA, createdAt: old, updatedAt: old },
    { ...base, module: 'read', subject: 'english', orgId: ids.orgA, createdAt: new Date(), updatedAt: new Date() },
    { ...base, module: 'read', subject: 'maths', orgId: ids.orgB, createdAt: new Date(), updatedAt: new Date() },
  ])
  const [mathsId, englishId, otherId] = Object.values(ins.insertedIds).map(String)
  const q = await app.call('GET', '/api/admin/review', { token: A })
  assert.equal(q.body.pending, 2)
  assert.equal(q.body.overdue, 1)
  assert.equal((await app.call('POST', `/api/admin/review/${otherId}/notes`, { token: A, body: { text: 'x' } })).status, 404)
  const note = await app.call('POST', `/api/admin/review/${mathsId}/notes`, { token: A, body: { text: 'Question 2 has two right answers.' } })
  assert.equal(note.body.notes.length, 1)
  // a maths coordinator
  await app.call('POST', '/api/admin/staff', { token: A, body: { email: 'hod@sunrise.test', role: 'coordinator', subjects: ['maths'] } })
  const H = (await app.call('POST', '/api/admin/auth/google', { body: { idToken: idToken('uid-hod', 'hod@sunrise.test') } })).body.token
  const hq = await app.call('GET', '/api/admin/review', { token: H })
  assert.deepEqual(hq.body.items.map((i) => i.subject), ['maths'])
  assert.equal((await app.call('GET', `/api/admin/review/${englishId}`, { token: H })).status, 404)
  const bulk = await app.call('POST', '/api/admin/review/bulk', { token: H, body: { ids: [mathsId, englishId, otherId], action: 'approve' } })
  assert.deepEqual([bulk.body.updated, bulk.body.skipped], [1, 2])
  assert.equal((await app.db.superadmin.collection('questionuploadbatches').findOne({ _id: ins.insertedIds[2] })).status, 'pending', "other school's upload untouched")
  assert.equal((await app.call('POST', '/api/admin/review/bulk', { token: A, body: { ids: [englishId], action: 'reject' } })).status, 400, 'a reason is needed')
  const bank = await app.call('GET', '/api/admin/bank', { token: A })
  assert.equal(bank.body.items.length, 1)
  const tag = await app.call('PUT', `/api/admin/bank/${mathsId}/tags`, { token: A, body: { tags: ['Fractions', 'grade 4'] } })
  assert.deepEqual(tag.body.tags, ['fractions', 'grade 4'])
  assert.equal((await app.call('GET', '/api/admin/bank?tag=fractions', { token: A })).body.items.length, 1)
})

test('status banner: approval, plan and seats', async () => {
  const s = await app.call('GET', '/api/admin/status', { token: A })
  assert.equal(s.body.org.status, 'approved')
  assert.equal(s.body.plan.id, 'institute')
  assert.equal(s.body.seats.state, 'unlimited')
  assert.equal((await app.call('GET', '/api/admin/status')).status, 401)
  assert.equal((await app.call('GET', '/api/admin/status', { token: app.tokens.teacher('x', ids.orgA) })).status, 401)
})
