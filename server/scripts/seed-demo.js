/**
 * Demo data (FND-090): a believable school, a solo tutor and a family with
 * ~4 months of learning activity, written straight into the three databases.
 * Used by the dev server (test/integration/dev-server.js), screenshots and sales demos.
 *
 *   const { seedDemo } = require('./seed-demo')
 *   const demo = await seedDemo({ main, admin, superadmin }, { today: '2026-11-18' })
 *
 * `main`, `admin`, `superadmin` are mongoose connections. Emails end in @demo.test.
 * Deterministic (seeded random), so screenshots are repeatable.
 */
const mongoose = require('mongoose')
const oid = () => new mongoose.Types.ObjectId()

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32 } }
const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const MODS = ['listen', 'read', 'write', 'speak']
const SUBJ = ['english', 'maths', 'science']

// One learner's rollup days. `diligence` 0-1 sets how often and how long they learn; `skill` sets accuracy.
function learnerDays(email, { today, days = 120, diligence, skill, favourite, seed }) {
  const r = rng(seed)
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i)
    const dow = (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7
    const weekend = dow >= 5
    const trend = 0.75 + 0.5 * (1 - i / days) // gently improving
    if (r() > diligence * (weekend ? 0.7 : 1) * (i < 10 ? 1 : 0.95)) continue
    const minutes = Math.round((8 + r() * 25) * trend)
    const answered = Math.round(minutes * (0.8 + r() * 0.8))
    const acc = Math.min(0.97, Math.max(0.2, skill + (r() - 0.5) * 0.2 + (1 - i / days) * 0.08))
    const byMS = {}
    let correct = 0
    for (let a = 0; a < answered; a++) {
      const m = r() < 0.5 ? favourite[0] : MODS[Math.floor(r() * 4)]
      const s = r() < 0.5 ? favourite[1] : SUBJ[Math.floor(r() * 3)]
      const key = `${m}_${s}`
      const bias = key === `${favourite[0]}_${favourite[1]}` ? 0.08 : (s === 'maths' ? -0.05 : 0)
      const ok = r() < acc + bias
      byMS[key] ||= { answered: 0, correct: 0, minutes: 0 }
      byMS[key].answered++; if (ok) { byMS[key].correct++; correct++ }
    }
    const keys = Object.keys(byMS)
    keys.forEach((k) => { byMS[k].minutes = Math.round((minutes / keys.length) * 10) / 10 })
    const hour = weekend ? 10 + Math.floor(r() * 6) : 16 + Math.floor(r() * 4)
    const byHour = { [hour]: Math.ceil(answered / 2), [hour + 1]: Math.floor(answered / 2) }
    out.push({
      email, date, tz: 'UTC', minutes, sessions: 1 + Math.floor(r() * 2), answered, correct, firstTry: Math.round(correct * 0.8), hints: Math.floor(r() * 4),
      timeMsSum: answered * (4000 + Math.floor(r() * 5000)), timedCount: answered, xp: Math.round(minutes * 3.2), stars: Math.round(answered / 4),
      byModuleSubject: byMS, byHour, devices: { [r() < 0.6 ? 'phone' : 'desktop']: answered }, sources: { practice: answered },
      firstAt: new Date(`${date}T${String(hour).padStart(2, '0')}:05:00Z`), lastAt: new Date(`${date}T${String(hour + 1).padStart(2, '0')}:40:00Z`),
    })
  }
  return out
}

function recentEvents(email, days, today, seed) {
  const r = rng(seed)
  return days.filter((d) => d.date >= addDays(today, -13)).flatMap((d) => {
    const ts = d.firstAt
    return [
      { email, ts, kind: 'session', module: 'listen', subject: 'english', minutes: Math.round(d.minutes / 2), xp: Math.round(d.xp / 2), mode: 'practice', source: 'practice', device: Object.keys(d.devices)[0], os: 'iOS', browser: 'Safari' },
      { email, ts: new Date(ts.getTime() + 20 * 60000), kind: 'round', module: 'read', subject: 'maths', stars: 6 + Math.floor(r() * 4), mode: r() < 0.3 ? 'warrior' : 'practice', source: 'practice', device: Object.keys(d.devices)[0] },
    ]
  })
}

const NAMES = ['Aanya', 'Ravi', 'Meera', 'Kabir', 'Isha', 'Arjun', 'Diya', 'Vihaan', 'Anika', 'Rohan', 'Sara', 'Ishan', 'Tara', 'Neel', 'Kiara', 'Dev', 'Myra', 'Reyansh', 'Zoya', 'Aarav', 'Navya', 'Yash', 'Pari', 'Om']

async function seedDemo({ main, admin, superadmin }, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const col = (conn, name) => conn.collection(name)
  const now = new Date()
  const orgId = oid(), soloOrgId = oid()
  const adminId = oid(), soloAdminId = oid()
  const tutors = [oid(), oid(), oid()]
  const batches = [oid(), oid(), oid()]
  const soloTutor = oid(), soloBatch = oid()

  await col(admin, 'organizations').insertMany([
    { _id: orgId, name: 'Sunrise Primary School', type: 'school', adminEmail: 'principal@demo.test', adminUid: 'demo-admin', status: 'approved', kind: 'institute', createdAt: now, updatedAt: now },
    { _id: soloOrgId, name: 'Ms Rao Tutoring', type: 'other', adminEmail: 'rao@demo.test', adminUid: 'demo-solo', status: 'approved', kind: 'solo', createdAt: now, updatedAt: now },
  ])
  await col(superadmin, 'organizations').insertMany([
    { _id: oid(), name: 'Sunrise Primary School', type: 'school', adminEmail: 'principal@demo.test', adminUid: 'demo-admin', adminOrgId: String(orgId), status: 'approved', subscriptionPlan: 'pro', subscriptionStatus: 'active', createdAt: now, updatedAt: now },
    { _id: oid(), name: 'Ms Rao Tutoring', type: 'other', adminEmail: 'rao@demo.test', adminUid: 'demo-solo', adminOrgId: String(soloOrgId), status: 'approved', subscriptionPlan: 'free', kind: 'solo', createdAt: now, updatedAt: now },
  ])
  await col(admin, 'orgadmins').insertMany([
    { _id: adminId, uid: 'demo-admin', email: 'principal@demo.test', name: 'Mrs Kapoor', orgId, role: 'admin', createdAt: now, updatedAt: now },
    { _id: soloAdminId, uid: 'demo-solo', email: 'rao@demo.test', name: 'Ms Rao', orgId: soloOrgId, role: 'admin', createdAt: now, updatedAt: now },
  ])
  const tutorDocs = [
    { _id: tutors[0], name: 'Mr Sharma', email: 'sharma@demo.test', uid: 'demo-t0', orgId, subject: 'Maths', batchIds: [batches[0], batches[2]], status: 'active', authStatus: 'active' },
    { _id: tutors[1], name: 'Ms Iyer', email: 'iyer@demo.test', uid: 'demo-t1', orgId, subject: 'English', batchIds: [batches[1]], status: 'active', authStatus: 'active' },
    { _id: tutors[2], name: 'Mr Das', email: 'das@demo.test', uid: 'demo-t2', orgId, subject: 'Science', batchIds: [batches[2]], status: 'active', authStatus: 'active' },
    { _id: soloTutor, name: 'Ms Rao', email: 'rao@demo.test', uid: 'demo-solo', orgId: soloOrgId, subject: 'Maths', batchIds: [soloBatch], status: 'active', authStatus: 'active' },
  ].map((t) => ({ ...t, createdAt: now, updatedAt: now }))
  await col(admin, 'tutors').insertMany(tutorDocs)

  // 24 school learners over three groups, plus 6 for the solo tutor.
  const students = []
  const plan = (i) => ({ diligence: [0.95, 0.85, 0.7, 0.5, 0.25][i % 5], skill: [0.88, 0.78, 0.7, 0.62, 0.5][(i * 3) % 5], favourite: [[MODS[i % 4], SUBJ[i % 3]]][0] })
  NAMES.forEach((name, i) => {
    const batch = batches[i % 3]
    students.push({ _id: oid(), name, email: `${name.toLowerCase()}@demo.test`, age: 8 + (i % 3), grade: `Year ${4 + (i % 3)}`, orgId, tutorIds: [], batchIds: [batch], parentIds: [], status: 'active', createdAt: now, updatedAt: now, _plan: plan(i), _i: i })
  })
  const soloKids = ['Lina', 'Omar', 'Hana', 'Jonas', 'Mei', 'Noah'].map((name, i) => ({ _id: oid(), name, email: `${name.toLowerCase()}@demo.test`, age: 9, grade: 'Year 5', orgId: soloOrgId, tutorIds: [soloTutor], batchIds: [soloBatch], parentIds: [], status: 'active', createdAt: now, updatedAt: now, _plan: plan(i + 7), _i: i + 30 }))
  const all = [...students, ...soloKids]
  await col(admin, 'students').insertMany(all.map(({ _plan, _i, ...s }) => s))
  await col(admin, 'batches').insertMany([
    { _id: batches[0], name: 'Year 4 Maths', orgId, tutorIds: [tutors[0]], directTutorIds: [tutors[0]], subjects: [], studentIds: students.filter((s) => s.batchIds[0].equals(batches[0])).map((s) => s._id), status: 'active', createdAt: now, updatedAt: now },
    { _id: batches[1], name: 'Year 5 English', orgId, tutorIds: [tutors[1]], directTutorIds: [tutors[1]], subjects: [], studentIds: students.filter((s) => s.batchIds[0].equals(batches[1])).map((s) => s._id), status: 'active', createdAt: now, updatedAt: now },
    { _id: batches[2], name: 'Year 6 Science', orgId, tutorIds: [tutors[2], tutors[0]], directTutorIds: [tutors[2]], subjects: [], studentIds: students.filter((s) => s.batchIds[0].equals(batches[2])).map((s) => s._id), status: 'active', createdAt: now, updatedAt: now },
    { _id: soloBatch, name: 'After-school Maths', orgId: soloOrgId, tutorIds: [soloTutor], directTutorIds: [soloTutor], subjects: [], studentIds: soloKids.map((s) => s._id), status: 'active', createdAt: now, updatedAt: now },
  ])

  // Parents: one family with two children (one verified by the school, one by code), and school-added parents.
  const familyParent = oid()
  await col(main, 'parentaccounts').insertOne({ _id: familyParent, uid: 'demo-parent', email: 'mum@demo.test', name: 'Priya Rao', photoURL: '', plan: 'free', createdAt: now, updatedAt: now })
  const aanya = students.find((s) => s.name === 'Aanya'), ravi = students.find((s) => s.name === 'Ravi')
  await col(admin, 'parents').insertOne({ _id: oid(), name: 'Priya Rao', email: 'mum@demo.test', orgId, studentIds: [aanya._id], consentGiven: true, status: 'active', createdAt: now, updatedAt: now })
  const children = [
    { _id: oid(), parentId: familyParent, name: 'Aanya', age: 9, email: aanya.email, linkStatus: 'verified', verifiedBy: 'school', verifiedAt: now, consentVersion: '2026-11', createdAt: now, updatedAt: now },
    { _id: oid(), parentId: familyParent, name: 'Ravi', age: 10, email: ravi.email, linkStatus: 'verified', verifiedBy: 'child_code', verifiedAt: now, consentVersion: '2026-11', createdAt: now, updatedAt: now },
  ]
  await col(main, 'children').insertMany(children)

  // Activity
  const days = [], events = []
  for (const s of all) {
    const d = learnerDays(s.email, { today, ...s._plan, seed: 7919 * (s._i + 1) })
    days.push(...d)
    events.push(...recentEvents(s.email, d, today, 31 * (s._i + 1)))
  }
  for (let i = 0; i < days.length; i += 1000) await col(main, 'learnerdays').insertMany(days.slice(i, i + 1000))
  for (let i = 0; i < events.length; i += 1000) await col(main, 'learningevents').insertMany(events.slice(i, i + 1000))

  const ids = (arr) => arr.map((x) => String(x))
  return {
    today,
    org: { id: String(orgId), adminId: String(adminId), adminUid: 'demo-admin', tutorIds: ids(tutors), batchIds: ids(batches), studentIds: ids(students.map((s) => s._id)) },
    solo: { orgId: String(soloOrgId), adminId: String(soloAdminId), adminUid: 'demo-solo', tutorId: String(soloTutor), batchId: String(soloBatch), studentIds: ids(soloKids.map((s) => s._id)) },
    family: { parentId: String(familyParent), parentEmail: 'mum@demo.test', childIds: ids(children.map((c) => c._id)), childEmails: [aanya.email, ravi.email], schoolStudentIds: [String(aanya._id), String(ravi._id)] },
    counts: { learners: all.length, learnerDays: days.length, events: events.length },
  }
}

module.exports = { seedDemo, learnerDays }
