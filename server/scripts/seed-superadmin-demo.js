// Extra demo data for the super admin console (screenshots, sales demos):
// a pending institute, independent learners, subscriptions and invoices,
// support conversations, data-rights requests, an incident and a flag.
// Called by test/integration/dev-server.js after seed-demo.js.
const mongoose = require('mongoose')

const oid = () => new mongoose.Types.ObjectId()
const daysAgo = (n) => new Date(Date.now() - n * 86400_000)

async function seedSuperadminDemo({ main, admin, superadmin }, demo) {
  const now = new Date()
  const pendingOrg = oid()
  await admin.collection('organizations').insertOne({ _id: pendingOrg, name: 'Maple Leaf Academy', type: 'school', adminEmail: 'maple.academy@gmail.com', adminUid: 'demo-maple', status: 'pending', kind: 'institute', createdAt: daysAgo(3), updatedAt: daysAgo(3) })
  await superadmin.collection('organizations').insertOne({ name: 'Maple Leaf Academy', type: 'school', adminEmail: 'maple.academy@gmail.com', adminName: 'R. Maple', adminUid: 'demo-maple', adminOrgId: String(pendingOrg), status: 'pending', subscriptionPlan: 'free', phone: '', address: 'Leeds', country: 'GB', featureOverrides: [], rejectionHistory: [{ reason: 'Please register with your school email address.', rejectedAt: daysAgo(6) }], createdAt: daysAgo(9), updatedAt: daysAgo(3) })
  await superadmin.collection('organizations').updateOne({ adminOrgId: demo.org.id }, { $set: { country: 'DE', adminName: 'Mrs Kapoor', phone: '+49 30 1234567', address: 'Berlin' } })
  await superadmin.collection('organizations').updateOne({ adminOrgId: demo.solo.orgId }, { $set: { country: 'IN' } })
  const saSchool = await superadmin.collection('organizations').findOne({ adminOrgId: demo.org.id })
  const saSolo = await superadmin.collection('organizations').findOne({ adminOrgId: demo.solo.orgId })

  // Subscriptions: the school on Institute (20 seats for 24 learners: over its limit), the tutor on Solo Pro (trial).
  await superadmin.collection('subscriptions').insertMany([
    { ownerType: 'org', ownerId: demo.org.id, saOrgId: String(saSchool._id), plan: 'institute', planVersion: 0, planSnapshot: null, status: 'active', seats: 20, currency: 'EUR', interval: 'year', priceCents: 60000, periodStart: daysAgo(120), periodEnd: new Date(Date.now() + 245 * 86400_000), creditCents: 0, country: 'DE',
      invoices: [{ _id: oid(), number: 'LG-2026-000101', amountCents: 60000, currency: 'EUR', status: 'paid', dueAt: daysAgo(90), paidAt: daysAgo(95), method: 'po', reference: 'PO-4471', country: 'DE', vatCents: 11400 }, { _id: oid(), number: 'LG-2026-000188', amountCents: 6000, currency: 'EUR', status: 'open', dueAt: new Date(Date.now() + 10 * 86400_000), method: 'invoice', reference: 'Extra seats', country: 'DE', vatCents: 1140 }],
      history: [{ at: daysAgo(120), action: 'subscription.start', by: 'demo', meta: {} }], createdAt: daysAgo(120), updatedAt: now },
    { ownerType: 'org', ownerId: demo.solo.orgId, saOrgId: String(saSolo._id), plan: 'solo_pro', planVersion: 0, planSnapshot: null, status: 'trialing', seats: 0, currency: 'EUR', interval: 'month', priceCents: 1299, periodStart: daysAgo(9), periodEnd: new Date(Date.now() + 5 * 86400_000), trialEndsAt: new Date(Date.now() + 5 * 86400_000), creditCents: 0, country: 'IN', invoices: [], history: [{ at: daysAgo(9), action: 'trial.start', by: 'demo', meta: {} }], createdAt: daysAgo(9), updatedAt: now },
  ])

  // Independent learners and a family on Family Plus.
  const famParent = oid()
  await main.collection('parentaccounts').insertOne({ _id: famParent, uid: 'demo-parent-2', email: 'jonas.dad@demo.test', name: 'Jonas Becker', plan: 'family_plus', createdAt: daysAgo(40), updatedAt: now })
  await main.collection('children').insertOne({ _id: oid(), parentId: famParent, name: 'Mila', age: 8, email: 'mila@home.test', linkStatus: 'verified', verifiedBy: 'child_code', verifiedAt: daysAgo(38), createdAt: daysAgo(40), updatedAt: now })
  await main.collection('users').insertMany([
    { _id: oid(), name: 'Sam Learner', email: 'sam@home.test', passwordHash: 'x', createdAt: daysAgo(20), updatedAt: now },
    { _id: oid(), name: 'Ivy', email: 'ivy@home.test', passwordHash: 'x', createdAt: daysAgo(70), updatedAt: now },
  ])
  const { learnerDays } = require('./seed-demo')
  const today = new Date().toISOString().slice(0, 10)
  for (const [email, i] of [['mila@home.test', 1], ['sam@home.test', 2], ['ivy@home.test', 3]]) {
    const days = learnerDays(email, { today, days: 40, diligence: 0.8 - i * 0.15, skill: 0.75, favourite: ['read', 'english'], seed: 991 * i }).map((d) => ({ ...d, tz: ['Europe/Berlin', 'Asia/Kolkata', 'America/New_York'][i - 1] }))
    if (days.length) await main.collection('learnerdays').insertMany(days)
  }

  // Support: a contact message, an unread admin chat, a parent chat.
  await superadmin.collection('contactmessages').insertMany([
    { name: 'Mrs Kapoor', email: 'principal@demo.test', role: 'admin', orgName: 'Sunrise Primary School', subject: 'Cannot add a second campus', message: 'We are opening a second building in January. How do we add it?', status: 'open', reply: '', createdAt: daysAgo(1), updatedAt: daysAgo(1) },
    { name: 'Visitor', email: 'curious@example.com', role: 'other', subject: 'Pricing for 300 pupils?', message: 'Do you offer a discount for schools?', status: 'open', reply: '', createdAt: new Date(Date.now() - 3 * 3600_000), updatedAt: now },
  ])
  await superadmin.collection('chatmessages').insertMany([
    { adminUid: 'demo-admin', orgName: 'Sunrise Primary School', senderRole: 'admin', message: 'Hello! Our Year 5 report shows no minutes for last week.', readByAdmin: true, readBySuperadmin: false, createdAt: new Date(Date.now() - 2 * 3600_000), updatedAt: now },
  ])
  await superadmin.collection('parentchatmessages').insertOne({ parentUid: 'demo-parent', parentName: 'Priya Rao', senderRole: 'parent', message: 'How do I link my son? He has a code.', readByParent: true, readBySuperadmin: false, createdAt: new Date(Date.now() - 5 * 3600_000), updatedAt: now })

  // Data rights: one overdue delete, one fresh export.
  await main.collection('datarequests').insertMany([
    { subjectEmail: 'ivy@home.test', subjectName: 'Ivy', requestedByRole: 'parent', requestedById: String(famParent), kind: 'delete', status: 'processing', dueAt: daysAgo(2), note: '', createdAt: daysAgo(32), updatedAt: now },
    { subjectEmail: demo.family.childEmails[0], subjectName: 'Aanya', requestedByRole: 'parent', requestedById: demo.family.parentId, kind: 'export', status: 'pending', dueAt: new Date(Date.now() + 27 * 86400_000), note: '', createdAt: daysAgo(3), updatedAt: now },
  ])

  // Ops: a resolved incident, a planned maintenance and a feature rollout.
  await superadmin.collection('incidents').insertMany([
    { title: 'AI Teacher answers were slow', kind: 'incident', severity: 'major', status: 'resolved', message: 'A crash-looping process pushed CPU steal to 95 %.', banner: false, startsAt: daysAgo(6), resolvedAt: daysAgo(6), updates: [{ at: daysAgo(6), status: 'investigating', message: 'Looking into slow answers', by: 'demo' }, { at: daysAgo(6), status: 'resolved', message: 'Restarted and fixed the loop', by: 'demo' }], createdAt: daysAgo(6), updatedAt: daysAgo(6) },
    { title: 'Database upgrade', kind: 'maintenance', severity: 'minor', status: 'scheduled', message: 'Learnigo may be unavailable for up to 15 minutes.', banner: true, startsAt: new Date(Date.now() + 20 * 3600_000), endsAt: new Date(Date.now() + 20.5 * 3600_000), updates: [], createdAt: now, updatedAt: now },
  ])
  await superadmin.collection('featureflags').insertMany([
    { key: 'tests.advanced', kind: 'module', description: 'Pilot: question pools for all institutes', platform: 'default', plans: { institute: 'on' }, orgs: {}, rollout: 0, updatedBy: 'demo', createdAt: daysAgo(4), updatedAt: daysAgo(4) },
    { key: 'new-report-pdf', kind: 'feature', description: 'New PDF report layout', platform: 'default', plans: {}, orgs: {}, rollout: 25, updatedBy: 'demo', createdAt: daysAgo(2), updatedAt: daysAgo(2) },
  ])
  // Sign-in activity for the last two weeks (admins, teachers, parents).
  const actorDays = []
  for (let i = 0; i < 14; i++) {
    const date = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10)
    if (i % 2 === 0) actorDays.push({ role: 'admin', id: demo.org.adminId, orgId: demo.org.id, date, firstAt: now })
    for (const [k, tid] of demo.org.tutorIds.entries()) if ((i + k) % 3 !== 0) actorDays.push({ role: 'teacher', id: tid, orgId: demo.org.id, date, firstAt: now })
    if (i % 3 === 0) actorDays.push({ role: 'parent', id: demo.family.parentId, orgId: '', date, firstAt: now })
  }
  await superadmin.collection('actordays').insertMany(actorDays)
  // Named staff (demo passwords only; real staff are added in the console or with scripts/create-staff.js).
  const bcrypt = require('bcryptjs')
  const totp = require('../utils/totp')
  // The secret is sealed with the server's key; the demo server uses the test harness secret.
  process.env.SUPERADMIN_JWT_SECRET = process.env.SUPERADMIN_JWT_SECRET || 'test-superadmin-secret'
  const hash = bcrypt.hashSync('demo-password-123', 10)
  await superadmin.collection('staffs').insertMany([
    { email: 'ada@learnigo.test', name: 'Ada Owner', role: 'owner', status: 'active', passwordHash: hash, mustChangePassword: false, totpSecret: totp.seal('JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'), totpEnabled: true, totpLastStep: -1, recoveryCodes: [], failedLogins: 0, lastLoginAt: daysAgo(1), lastLoginIp: '10.0.0.4', prefs: {}, createdAt: daysAgo(30), updatedAt: now },
    { email: 'sam@learnigo.test', name: 'Sam Support', role: 'support', status: 'active', passwordHash: hash, mustChangePassword: false, totpSecret: '', totpEnabled: false, totpLastStep: -1, recoveryCodes: [], failedLogins: 0, lastLoginAt: null, prefs: {}, createdAt: daysAgo(2), updatedAt: now },
  ])
  return { pendingOrg: String(pendingOrg) }
}

module.exports = { seedSuperadminDemo }
