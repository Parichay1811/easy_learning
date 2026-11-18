/**
 * Demo school structure (ADMIN.md): puts the demo school's students into a
 * tree (Year 4-6, sections A-B), places the groups in their year, adds an
 * academic year with terms and a holiday, a coordinator for Year 4, parents
 * with invitation states and a couple of question uploads to review.
 *
 *   const { seedSchoolTree } = require('./seed-school-tree')
 *   await seedSchoolTree({ main, admin, superadmin }, demo)   // demo = seedDemo(...) result
 */
const mongoose = require('mongoose')
const oid = () => new mongoose.Types.ObjectId()
const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }

async function seedSchoolTree({ main, admin, superadmin }, demo) {
  const orgId = new mongoose.Types.ObjectId(demo.org.id)
  const now = new Date()
  const units = []
  const campus = oid()
  units.push({ _id: campus, orgId, parentId: null, type: 'campus', name: 'Main campus', path: `/${campus}/`, depth: 0, order: 0 })
  const sections = {}
  ;[4, 5, 6].forEach((n, gi) => {
    const g = oid()
    units.push({ _id: g, orgId, parentId: campus, type: 'grade', name: `Year ${n}`, path: `/${campus}/${g}/`, depth: 1, order: gi })
    sections[n] = { grade: g, list: [] }
    ;['A', 'B'].forEach((l, si) => {
      const s = oid()
      units.push({ _id: s, orgId, parentId: g, type: 'section', name: `${n}${l}`, path: `/${campus}/${g}/${s}/`, depth: 2, order: si })
      sections[n].list.push(s)
    })
  })
  const maths = oid()
  units.push({ _id: maths, orgId, parentId: null, type: 'department', name: 'Maths department', subject: 'maths', path: `/${maths}/`, depth: 0, order: 1 })
  await admin.collection('orgunits').insertMany(units.map((u) => ({ ...u, archivedAt: null, subject: u.subject || '', createdAt: now, updatedAt: now })))

  const students = await admin.collection('students').find({ orgId }).toArray()
  let k = 0
  for (const s of students) {
    const n = Number(/(\d+)/.exec(s.grade || '')?.[1]) || 4
    const target = sections[n] ? sections[n].list[k++ % 2] : null
    if (target) await admin.collection('students').updateOne({ _id: s._id }, { $set: { unitId: target, externalId: `S${String(k).padStart(3, '0')}` } })
  }
  const batches = await admin.collection('batches').find({ orgId }).toArray()
  for (const b of batches) {
    const n = Number(/Year (\d)/.exec(b.name)?.[1])
    if (sections[n]) await admin.collection('batches').updateOne({ _id: b._id }, { $set: { unitId: sections[n].grade } })
  }
  await admin.collection('tutors').updateOne({ _id: new mongoose.Types.ObjectId(demo.org.tutorIds[0]) }, { $set: { unitIds: [maths], lastLoginAt: new Date(Date.now() - 2 * 86400000) } })
  await admin.collection('tutors').updateOne({ _id: new mongoose.Types.ObjectId(demo.org.tutorIds[1]) }, { $set: { lastLoginAt: new Date(Date.now() - 9 * 86400000) } })

  const today = demo.today
  await admin.collection('academicyears').insertOne({
    orgId, name: '2026-27', start: addDays(today, -80), end: addDays(today, 230), status: 'current', promotedAt: null,
    terms: [{ _id: oid(), name: 'Autumn term', start: addDays(today, -80), end: addDays(today, 30) }, { _id: oid(), name: 'Spring term', start: addDays(today, 45), end: addDays(today, 140) }],
    events: [{ _id: oid(), kind: 'holiday', name: 'Diwali break', start: addDays(today, -26), end: addDays(today, -22) }, { _id: oid(), kind: 'exam', name: 'Mid-term checks', start: addDays(today, 10), end: addDays(today, 14) }],
    createdAt: now, updatedAt: now,
  })
  // An earlier year so "vs previous term" has something to compare with.
  await admin.collection('academicyears').insertOne({
    orgId, name: '2025-26', start: addDays(today, -445), end: addDays(today, -81), status: 'archived', promotedAt: null,
    terms: [{ _id: oid(), name: 'Summer term', start: addDays(today, -200), end: addDays(today, -110) }], events: [], createdAt: now, updatedAt: now,
  })

  const staffId = oid()
  await admin.collection('orgstaffs').insertOne({ _id: staffId, orgId, email: 'coordinator@demo.test', name: 'Mr Mehta', role: 'coordinator', unitIds: [sections[4].grade], subjects: ['maths'], status: 'active', uid: 'demo-coord', lastLoginAt: now, createdAt: now, updatedAt: now })

  // School parents with invitation states.
  const some = students.slice(2, 10)
  const parentDocs = some.map((s, i) => ({ _id: oid(), name: `Parent of ${s.name}`, email: `parent.${s.name.toLowerCase()}@home.test`, orgId, studentIds: [s._id], consentGiven: i % 2 === 0, status: 'active', createdAt: now, updatedAt: now }))
  await admin.collection('parents').insertMany(parentDocs)
  await admin.collection('parentinvites').insertMany(parentDocs.slice(0, 6).map((p, i) => ({ orgId, parentId: p._id, email: p.email, status: i < 3 ? 'linked' : i === 5 ? 'bounced' : 'invited', sends: 1, lastSentAt: now, linkedAt: i < 3 ? now : null, createdAt: now, updatedAt: now })))

  // Question uploads waiting for review (one overdue).
  const base = { submittedByTutorId: demo.org.tutorIds[0], submittedByName: 'Mr Sharma', submittedByEmail: 'sharma@demo.test', orgId: String(orgId), orgName: 'Sunrise Primary School', batchIds: [demo.org.batchIds[0]], originalFilename: 'fractions.xlsx', originalFileUrl: '/uploads/question-uploads/x.xlsx', skippedRowCount: 0, rowErrors: [], rejectionReason: '', rejectionHistory: [], reviewedBy: '', reviewedAt: null, tags: [], reviewNotes: [] }
  const up1 = oid(), up2 = oid()
  await superadmin.collection('questionuploadbatches').insertMany([
    { ...base, _id: up1, module: 'read', subject: 'maths', rowCount: 3, status: 'pending', createdAt: new Date(Date.now() - 5 * 86400000), updatedAt: now },
    { ...base, _id: up2, module: 'read', subject: 'english', rowCount: 2, status: 'pending', submittedByName: 'Ms Iyer', submittedByTutorId: demo.org.tutorIds[1], createdAt: new Date(Date.now() - 86400000), updatedAt: now },
  ])
  const q = (uploadBatchId, i, title, content, question, opts, answer, emoji) => ({ id: 9000 + i, title, content, question, option1: opts[0], option2: opts[1], option3: opts[2], answer, emoji, status: 'pending', uploadBatchId, submittedBy: demo.org.tutorIds[0], createdAt: now, updatedAt: now })
  await main.collection('readmaths').insertMany([
    q(up1, 1, 'Fractions', 'Riya ate 1/4 of a pizza and Sam ate 2/4.', 'How much did they eat together?', ['3/4', '3/8', '1/2'], '3/4', '🍕'),
    q(up1, 2, 'Halves', 'Half of 18 is…', 'Choose the answer', ['8', '9', '6'], '9', '🍎'),
    q(up1, 3, 'Thirds', 'One third of 12 is…', 'Choose the answer', ['3', '4', '6'], '4', '🍫'),
  ])
  await main.collection('readenglishes').insertMany([
    q(up2, 4, 'Rhymes', 'Which word rhymes with "cat"?', 'Pick one', ['hat', 'dog', 'cup'], 'hat', '🐱'),
    q(up2, 5, 'Plurals', 'One mouse, two…', 'Pick one', ['mouses', 'mice', 'mousen'], 'mice', '🐭'),
  ])
  return { staffId: String(staffId) }
}

module.exports = { seedSchoolTree }
