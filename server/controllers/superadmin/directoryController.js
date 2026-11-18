// Everyone on the platform (SUP-010..014): the organisations directory, one
// organisation in detail, the approval queue with hints and SLA timers,
// suspension, cross-role people search with per-person actions, and families
// and independent learners. Viewing a person's profile is audited.
const SAOrg = require('../../models/superadmin/Organization')
const AdminOrg = require('../../models/admin/Organization')
const OrgAdmin = require('../../models/admin/OrgAdmin')
const Student = require('../../models/admin/Student')
const Tutor = require('../../models/admin/Tutor')
const Parent = require('../../models/admin/Parent')
const Batch = require('../../models/admin/Batch')
const ParentAccount = require('../../models/ParentAccount')
const Child = require('../../models/Child')
const User = require('../../models/User')
const LearnerDay = require('../../models/analytics/LearnerDay')
const ActorDay = require('../../models/superadmin/ActorDay')
const AuditEvent = require('../../models/AuditEvent')
const ContactMessage = require('../../models/ContactMessage')
const ChatMessage = require('../../models/superadmin/ChatMessage')
const Subscription = require('../../models/superadmin/Subscription')
const GlobalSettings = require('../../models/superadmin/GlobalSettings')
const SessionRevocation = require('../../models/superadmin/SessionRevocation')
const { MODULES } = require('../../config/plans')
const directory = require('../../services/orgDirectory')
const { entitlementsFor } = require('../../utils/entitlements')
const { resolveModules } = require('../../services/featureFlags')
const planCatalog = require('../../services/planCatalog')
const platformGuard = require('../../middleware/platformGuard')
const { audit } = require('../../utils/audit')
const { sendMail } = require('../../utils/mailer')
const { clear } = require('../../utils/ttlCache')
const { h, fail, needId, paging, rx, sendCsv, by } = require('./util')

// ── SUP-010 directory ────────────────────────────────────────────────────────
const DIR_COLUMNS = [
  { key: 'name' }, { key: 'kind' }, { key: 'status' }, { key: 'country' }, { key: 'plan' }, { key: 'subscriptionStatus' },
  { key: 'seatsUsed' }, { key: 'seatLimit' }, { key: 'active7', label: 'activeLearners7d' }, { key: 'tutors' }, { key: 'health' },
  { key: 'flags', get: (r) => r.flags.join(' ') }, { key: 'lastAdminLogin' }, { key: 'adminEmail' }, { key: 'createdAt' },
]

const list = h(async (req, res) => {
  const out = await directory.query(req.query)
  if (req.query.format === 'csv') {
    await audit(req, 'org.directory.export', { targetType: 'directory', meta: { filter: req.query, rows: out.all.length } })
    sendCsv(res, `learnigo-organisations-${new Date().toISOString().slice(0, 10)}.csv`, out.all, DIR_COLUMNS)
    return undefined
  }
  const { all, ...rest } = out
  return rest
})

async function saOrgOr404(id) {
  needId(id, 'Organization')
  const sa = await SAOrg.findById(id).lean()
  if (!sa) throw fail(404, 'Organization not found')
  return sa
}

// ── SUP-011 organisation detail ─────────────────────────────────────────────
const detail = h(async (req) => {
  const sa = await saOrgOr404(req.params.id)
  const orgId = sa.adminOrgId || null
  const row = (await directory.rows()).find((r) => r.id === String(sa._id)) || null
  const [adminOrg, admins, batches, studentCount, tutorCount, parentCount, sub, contacts, chatCount, auditEvents, units] = await Promise.all([
    orgId ? AdminOrg.findById(orgId).lean() : null,
    orgId ? OrgAdmin.find({ orgId }).select('name email designation createdAt').lean() : [],
    orgId ? Batch.find({ orgId }).select('name status studentIds tutorIds directTutorIds unitId').lean() : [],
    orgId ? Student.countDocuments({ orgId, status: 'active' }) : 0,
    orgId ? Tutor.countDocuments({ orgId }) : 0,
    orgId ? Parent.countDocuments({ orgId }) : 0,
    orgId ? Subscription.findOne({ ownerType: 'org', ownerId: String(orgId) }).lean() : null,
    ContactMessage.find({ email: String(sa.adminEmail || '').toLowerCase() }).sort({ createdAt: -1 }).limit(10).select('subject status createdAt').lean(),
    ChatMessage.countDocuments({ adminUid: sa.adminUid }),
    orgId ? AuditEvent.find({ orgId: String(orgId) }).sort({ at: -1 }).limit(30).lean() : [],
    // Org units (FND-017) if the Admin work has added them; read-only here.
    orgId ? loadUnits(orgId) : [],
  ])
  const lastAdminLogins = admins.length ? await ActorDay.aggregate([{ $match: { role: 'admin', id: { $in: admins.map((a) => String(a._id)) } } }, { $group: { _id: '$id', last: { $max: '$date' } } }]) : []
  const lastBy = new Map(lastAdminLogins.map((x) => [x._id, x.last]))
  const plan = row?.plan || 'institute'
  const catalog = await planCatalog.plan(plan)
  const explained = await resolveModules({ planModules: sub?.planSnapshot?.modules || catalog?.modules || [], plan, overrides: sa.featureOverrides || [], MODULES })
  return {
    org: { ...sa, id: String(sa._id), kind: adminOrg?.kind || sa.kind || 'institute' },
    row,
    admins: admins.map((a) => ({ ...a, id: String(a._id), lastLogin: lastBy.get(String(a._id)) || null })),
    tree: { units, batches: batches.map((b) => ({ id: String(b._id), name: b.name, status: b.status, students: (b.studentIds || []).length, teachers: new Set([...(b.tutorIds || []), ...(b.directTutorIds || [])].map(String)).size, unitId: b.unitId ? String(b.unitId) : null })) },
    people: { students: studentCount, teachers: tutorCount, parents: parentCount, admins: admins.length },
    billing: sub ? { ...sub, id: String(sub._id) } : null,
    support: { contacts, chatMessages: chatCount },
    audit: auditEvents.map(({ prevHash, hash, ...e }) => ({ ...e, id: String(e._id) })),
    entitlements: { plan, modules: explained.modules, why: explained.why, overrides: sa.featureOverrides || [], allModules: MODULES },
  }
})

async function loadUnits(orgId) {
  try {
    const adminDb = require('../../db/adminDb')
    const OrgUnit = adminDb.models.OrgUnit
    if (!OrgUnit) return []
    return (await OrgUnit.find({ orgId }).select('name type path parentId').sort({ path: 1 }).limit(500).lean()).map((u) => ({ ...u, id: String(u._id) }))
  } catch { return [] }
}

// Feature overrides for one org (SUP-042): ['tests.advanced', '-sso'].
const setOverrides = h(async (req) => {
  const sa = await saOrgOr404(req.params.id)
  const list = Array.isArray(req.body?.featureOverrides) ? req.body.featureOverrides.map(String) : null
  if (!list) throw fail(400, 'featureOverrides must be a list.')
  const bad = list.filter((o) => !MODULES[o.replace(/^-/, '')])
  if (bad.length) throw fail(400, `Unknown module: ${bad.join(', ')}`)
  const clean = [...new Set(list)]
  await SAOrg.updateOne({ _id: sa._id }, { featureOverrides: clean })
  clear('directory:')
  await audit(req, 'org.overrides.update', { targetType: 'organization', targetId: String(sa._id), orgId: sa.adminOrgId, reason: String(req.body?.reason || ''), meta: { from: sa.featureOverrides || [], to: clean } })
  return { featureOverrides: clean }
})

// Effective entitlements preview for an org (what its admin would get now).
const entitlementsPreview = h(async (req) => {
  const sa = await saOrgOr404(req.params.id)
  if (!sa.adminOrgId) throw fail(400, 'This organisation has no workspace yet.')
  return { entitlements: await entitlementsFor({ role: 'admin', orgId: sa.adminOrgId }) }
})

// Country / website for reporting (the org's own profile stays the admin's).
const updateProfile = h(async (req) => {
  const sa = await saOrgOr404(req.params.id)
  const set = {}
  if (req.body.country !== undefined) set.country = String(req.body.country).trim().slice(0, 56)
  if (req.body.website !== undefined) set.website = String(req.body.website).trim().slice(0, 200)
  await SAOrg.updateOne({ _id: sa._id }, set)
  clear('directory:')
  await audit(req, 'org.profile.update', { targetType: 'organization', targetId: String(sa._id), orgId: sa.adminOrgId, meta: set })
  return { org: { ...sa, ...set } }
})

// ── SUP-014 approvals, suspension ──────────────────────────────────────────────
const SLA_HOURS = 48
const DEFAULT_TEMPLATES = [
  { key: 'unverifiable', text: 'We could not verify that you represent this organisation. Please register with your school email address or add your school website.' },
  { key: 'incomplete', text: 'Some details are missing. Please add the full address and a phone number we can reach, then resubmit.' },
  { key: 'duplicate', text: 'This organisation is already registered on Learnigo. Please ask its admin to add you.' },
  { key: 'not_eligible', text: 'Learnigo for Institutes is for schools and learning centres. For private tutoring, please use a Solo workspace.' },
]

async function templates() {
  const s = await GlobalSettings.findOne({ key: 'approval.rejectionTemplates' }).lean()
  return Array.isArray(s?.value) && s.value.length ? s.value : DEFAULT_TEMPLATES
}

function hints(sa, all) {
  const domain = String(sa.adminEmail || '').split('@')[1] || ''
  const free = directory.FREE_MAIL.has(domain)
  const words = String(sa.name || '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3)
  const siteHost = (() => { try { return sa.website ? new URL(/^https?:/.test(sa.website) ? sa.website : `https://${sa.website}`).hostname.replace(/^www\./, '') : '' } catch { return '' } })()
  const out = []
  out.push(free ? { level: 'attention', key: 'free_mail', text: `Signed up with a free email (${domain}).` } : { level: 'good', key: 'org_domain', text: `Signed up with an organisation email (${domain}).` })
  if (!free && words.some((w) => domain.includes(w))) out.push({ level: 'good', key: 'domain_matches_name', text: 'The email domain matches the organisation name.' })
  if (siteHost) out.push(siteHost.endsWith(domain) || domain.endsWith(siteHost) ? { level: 'good', key: 'domain_matches_site', text: `Email domain matches the website (${siteHost}).` } : { level: 'attention', key: 'site_mismatch', text: `Website ${siteHost} does not match the email domain.` })
  else out.push({ level: 'info', key: 'no_website', text: 'No website given.' })
  const phone = String(sa.phone || '').replace(/[^\d+]/g, '')
  out.push(phone.length >= 8 ? { level: 'good', key: 'phone', text: `Phone given (${sa.phone}).` } : { level: 'attention', key: 'no_phone', text: 'No usable phone number.' })
  if (!sa.address) out.push({ level: 'attention', key: 'no_address', text: 'No address given.' })
  const dupes = all.filter((o) => String(o._id) !== String(sa._id) && (o.name.trim().toLowerCase() === sa.name.trim().toLowerCase() || o.adminEmail === sa.adminEmail))
  if (dupes.length) out.push({ level: 'alert', key: 'duplicate', text: `Looks like ${dupes.map((d) => `"${d.name}" (${d.status})`).join(', ')}.` })
  if ((sa.rejectionHistory || []).length) out.push({ level: 'info', key: 'resubmitted', text: `Rejected ${sa.rejectionHistory.length} time(s) before; last reason: "${sa.rejectionHistory[sa.rejectionHistory.length - 1].reason}".` })
  return out
}

const approvals = h(async (req) => {
  const status = req.query.status || 'pending'
  const all = await SAOrg.find().select('name adminEmail status').lean()
  const filter = status === 'all' ? {} : { status }
  const orgs = await SAOrg.find(filter).sort({ updatedAt: 1 }).limit(200).lean()
  const now = Date.now()
  const rows = orgs.map((o) => {
    // The clock starts when it was (re)submitted.
    const since = new Date(o.status === 'pending' ? o.updatedAt || o.createdAt : o.createdAt)
    const hoursWaiting = Math.round((now - since) / 3600_000)
    return { ...o, id: String(o._id), hints: hints(o, all), sla: { hoursWaiting, targetHours: SLA_HOURS, state: o.status !== 'pending' ? 'done' : hoursWaiting >= SLA_HOURS ? 'overdue' : hoursWaiting >= SLA_HOURS * 0.75 ? 'due_soon' : 'ok', dueAt: new Date(since.getTime() + SLA_HOURS * 3600_000) } }
  })
  return { rows, templates: await templates(), slaHours: SLA_HOURS }
})

const saveTemplates = h(async (req) => {
  const list = Array.isArray(req.body?.templates) ? req.body.templates.slice(0, 20).map((t, i) => ({ key: String(t.key || `t${i}`).slice(0, 40), text: String(t.text || '').trim().slice(0, 600) })).filter((t) => t.text.length >= 5) : null
  if (!list) throw fail(400, 'templates must be a list.')
  await GlobalSettings.findOneAndUpdate({ key: 'approval.rejectionTemplates' }, { key: 'approval.rejectionTemplates', value: list, description: 'Templated rejection reasons (SUP-014)' }, { upsert: true })
  await audit(req, 'settings.rejection_templates', { targetType: 'settings', meta: { count: list.length } })
  return { templates: list }
})

const suspend = h(async (req) => {
  const sa = await saOrgOr404(req.params.id)
  const reason = String(req.body?.reason || '').trim()
  if (reason.length < 5) throw fail(400, 'Give a reason (at least 5 characters).')
  await SAOrg.updateOne({ _id: sa._id }, { suspendedAt: new Date(), suspendReason: reason, suspendedBy: by(req), appealNote: '' })
  await platformGuard.refresh()
  clear('directory:')
  await audit(req, 'org.suspend', { targetType: 'organization', targetId: String(sa._id), orgId: sa.adminOrgId, reason })
  if (sa.adminEmail) await sendMail({ to: sa.adminEmail, kind: 'org_suspended', subject: `${sa.name} is suspended on Learnigo`, text: `Your Learnigo workspace "${sa.name}" has been suspended.\n\nReason: ${reason}\n\nStudents can keep learning. To appeal, reply to this email or use the contact form.` })
  return { suspended: true }
})

const unsuspend = h(async (req) => {
  const sa = await saOrgOr404(req.params.id)
  const note = String(req.body?.note || '').trim()
  await SAOrg.updateOne({ _id: sa._id }, { suspendedAt: null, suspendReason: '', suspendedBy: '', appealNote: note })
  await platformGuard.refresh()
  clear('directory:')
  await audit(req, 'org.unsuspend', { targetType: 'organization', targetId: String(sa._id), orgId: sa.adminOrgId, reason: note })
  return { suspended: false }
})

// ── SUP-012 people search ───────────────────────────────────────────────────
const ROLE_MODELS = {
  admin: { model: OrgAdmin, fields: 'name email uid orgId createdAt' },
  teacher: { model: Tutor, fields: 'name email uid orgId authStatus status lastLoginAt createdAt' },
  student: { model: Student, fields: 'name email orgId status batchIds parentIds createdAt' },
  org_parent: { model: Parent, fields: 'name email orgId status studentIds createdAt' },
  parent: { model: ParentAccount, fields: 'name email uid plan createdAt' },
  learner: { model: User, fields: 'name email createdAt' },
}

async function orgNames(ids) {
  const list = [...new Set(ids.filter(Boolean).map(String))]
  if (!list.length) return new Map()
  const sas = await SAOrg.find({ adminOrgId: { $in: list } }).select('name adminOrgId').lean()
  return new Map(sas.map((s) => [s.adminOrgId, { name: s.name, saOrgId: String(s._id) }]))
}

const people = h(async (req) => {
  const q = String(req.query.q || '').trim()
  const roles = req.query.role ? [req.query.role] : Object.keys(ROLE_MODELS)
  if (q.length < 2) throw fail(400, 'Type at least 2 characters.')
  const r = rx(q)
  const idMatch = /^[a-f0-9]{24}$/i.test(q)
  const results = await Promise.all(roles.filter((x) => ROLE_MODELS[x]).map(async (role) => {
    const { model, fields } = ROLE_MODELS[role]
    const filter = idMatch ? { _id: q } : { $or: [{ name: r }, { email: r }] }
    const docs = await model.find(filter).select(fields).limit(25).lean()
    return docs.map((d) => ({ role, id: String(d._id), name: d.name, email: d.email, orgId: d.orgId ? String(d.orgId) : null, status: d.status || d.authStatus || 'active', plan: d.plan, createdAt: d.createdAt }))
  }))
  const rows = results.flat()
  const orgs = await orgNames(rows.map((x) => x.orgId))
  const emails = rows.map((x) => x.email).filter(Boolean)
  const lastLearn = new Map((await LearnerDay.aggregate([{ $match: { email: { $in: emails } } }, { $group: { _id: '$email', last: { $max: '$date' } } }])).map((x) => [x._id, x.last]))
  const lastSeen = new Map((await ActorDay.aggregate([{ $match: { id: { $in: rows.map((x) => x.id) } } }, { $group: { _id: '$id', last: { $max: '$date' } } }])).map((x) => [x._id, x.last]))
  return { rows: rows.map((x) => ({ ...x, org: x.orgId ? orgs.get(x.orgId) || null : null, lastActive: [lastLearn.get(x.email), lastSeen.get(x.id)].filter(Boolean).sort().pop() || null })) }
})

const ROLE_FOR_REVOKE = { admin: 'admin', teacher: 'teacher', parent: 'parent', student: 'student', learner: 'student' }

const person = h(async (req) => {
  const { role, id } = req.params
  const m = ROLE_MODELS[role]
  if (!m) throw fail(400, 'Unknown role')
  needId(id, 'Person')
  const doc = await m.model.findById(id).lean()
  if (!doc) throw fail(404, 'Person not found')
  const email = String(doc.email || '').toLowerCase()
  const orgs = await orgNames([doc.orgId])
  const [guardians, children, schoolParents, groups, lastLearn, activeDays, revocation, auditEvents] = await Promise.all([
    email && ['student', 'learner'].includes(role) ? Child.find({ email }).select('parentId linkStatus verifiedBy verifiedAt name').lean() : [],
    role === 'parent' ? Child.find({ parentId: doc._id }).select('name email linkStatus verifiedBy').lean() : [],
    role === 'student' ? Parent.find({ studentIds: doc._id }).select('name email').lean() : [],
    role === 'student' && doc.batchIds?.length ? Batch.find({ _id: { $in: doc.batchIds } }).select('name').lean() : role === 'teacher' && doc.batchIds?.length ? Batch.find({ _id: { $in: doc.batchIds } }).select('name').lean() : [],
    email ? LearnerDay.findOne({ email }).sort({ date: -1 }).select('date').lean() : null,
    ActorDay.find({ id: String(doc._id) }).sort({ date: -1 }).limit(1).lean(),
    SessionRevocation.findOne({ role: ROLE_FOR_REVOKE[role] || role, id: String(doc._id) }).lean(),
    AuditEvent.find({ $or: [{ targetId: String(doc._id) }, ...(email ? [{ targetId: email }] : [])] }).sort({ at: -1 }).limit(20).lean(),
  ])
  const guardianAccounts = guardians.length ? await ParentAccount.find({ _id: { $in: guardians.map((g) => g.parentId) } }).select('name email').lean() : []
  await audit(req, 'people.view', { targetType: role, targetId: String(doc._id), orgId: doc.orgId ? String(doc.orgId) : '', reason: String(req.query.reason || ''), meta: { email } })
  const { passwordHash, ...safe } = doc
  return {
    person: { ...safe, id: String(doc._id), role, org: doc.orgId ? orgs.get(String(doc.orgId)) || null : null },
    links: {
      guardians: guardians.map((g) => ({ ...g, parent: guardianAccounts.find((p) => String(p._id) === String(g.parentId)) || null })),
      children, schoolParents, groups: groups.map((g) => ({ id: String(g._id), name: g.name })),
    },
    activity: { lastLearning: lastLearn?.date || null, lastSignIn: activeDays[0]?.date || null },
    security: { authStatus: doc.authStatus || null, signedOutBefore: revocation?.before || null, canViewAs: ['admin', 'teacher', 'parent'].includes(role) },
    audit: auditEvents.map(({ prevHash, hash, ...e }) => ({ ...e, id: String(e._id) })),
  }
})

// Actions: revoke sessions (any role), reset login (teacher: unlink the Google
// account so the next sign-in links again), resend invite (teacher, org parent).
const personAction = h(async (req) => {
  const { role, id, action } = req.params
  const m = ROLE_MODELS[role]
  if (!m) throw fail(400, 'Unknown role')
  needId(id, 'Person')
  const doc = await m.model.findById(id).lean()
  if (!doc) throw fail(404, 'Person not found')
  const reason = String(req.body?.reason || '').trim()
  const orgId = doc.orgId ? String(doc.orgId) : ''
  if (action === 'revoke-sessions') {
    const r = ROLE_FOR_REVOKE[role]
    if (!r) throw fail(400, 'This kind of account has no sessions to end.')
    // Learners sign in by email (several login methods), so their key is the email.
    const key = r === 'student' ? String(doc.email || '').toLowerCase() : String(doc._id)
    if (!key) throw fail(400, 'This learner has no email to sign out.')
    await SessionRevocation.findOneAndUpdate({ role: r, id: key }, { role: r, id: key, before: new Date(), by: by(req), reason }, { upsert: true })
    await platformGuard.refresh()
    await audit(req, 'people.revoke_sessions', { targetType: role, targetId: String(doc._id), orgId, reason })
    return { done: true, message: 'Signed out everywhere. They can sign in again.' }
  }
  if (action === 'reset-login') {
    if (role !== 'teacher') throw fail(400, 'Login reset is for teachers (Google sign-in). Admins and parents sign in with Google directly.')
    await Tutor.updateOne({ _id: doc._id }, { uid: '', authStatus: 'unclaimed' })
    await SessionRevocation.findOneAndUpdate({ role: 'teacher', id: String(doc._id) }, { role: 'teacher', id: String(doc._id), before: new Date(), by: by(req), reason }, { upsert: true })
    await platformGuard.refresh()
    await audit(req, 'people.reset_login', { targetType: role, targetId: String(doc._id), orgId, reason })
    return { done: true, message: 'Their next Google sign-in will link again.' }
  }
  if (action === 'resend-invite') {
    if (!['teacher', 'org_parent'].includes(role)) throw fail(400, 'Invites are for teachers and school parents.')
    const org = (await orgNames([orgId])).get(orgId)
    const link = role === 'teacher' ? '/teacher-login' : '/parent-login'
    await sendMail({ to: doc.email, kind: 'invite', subject: `You're invited to ${org?.name || 'your school'} on Learnigo`, text: `Hello ${doc.name},\n\n${org?.name || 'Your school'} uses Learnigo. Sign in with this email address at ${link} to get started.\n` })
    await audit(req, 'people.resend_invite', { targetType: role, targetId: String(doc._id), orgId })
    return { done: true, message: 'Invite sent (or queued in the Outbox).' }
  }
  throw fail(400, 'Unknown action')
})

// ── SUP-013 families and independent learners ────────────────────────────────
const families = h(async (req) => {
  const { limit, page, skip } = paging(req.query, { def: 25 })
  const orgEmails = new Set((await Student.distinct('email')).filter(Boolean))
  const [users, children, active30] = await Promise.all([
    User.find().select('name email createdAt').lean(),
    Child.find().select('name email parentId linkStatus createdAt').lean(),
    LearnerDay.aggregate([{ $match: { date: { $gte: new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10) } } }, { $group: { _id: '$email', minutes: { $sum: '$minutes' }, last: { $max: '$date' } } }]),
  ])
  const learners = new Map()
  for (const u of users) if (!orgEmails.has(u.email)) learners.set(u.email, { email: u.email, name: u.name, createdAt: u.createdAt, source: 'self', guardians: [] })
  for (const c of children) {
    if (orgEmails.has(c.email)) continue
    const l = learners.get(c.email) || { email: c.email, name: c.name, createdAt: c.createdAt, source: 'family', guardians: [] }
    l.guardians.push({ parentId: String(c.parentId), linkStatus: c.linkStatus })
    learners.set(c.email, l)
  }
  const act = new Map(active30.map((a) => [a._id, a]))
  let rows = [...learners.values()].map((l) => ({ ...l, minutes30: Math.round(act.get(l.email)?.minutes || 0), lastActive: act.get(l.email)?.last || null }))
  if (req.query.q) { const r = rx(req.query.q); rows = rows.filter((l) => r.test(l.email) || r.test(l.name || '')) }
  rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const parentIds = [...new Set(rows.slice(skip, skip + limit).flatMap((l) => l.guardians.map((g) => g.parentId)))]
  const parents = new Map((await ParentAccount.find({ _id: { $in: parentIds } }).select('name email plan').lean()).map((p) => [String(p._id), p]))
  const byMonth = {}
  for (const l of learners.values()) { const k = new Date(l.createdAt || Date.now()).toISOString().slice(0, 7); byMonth[k] = (byMonth[k] || 0) + 1 }
  const all = [...learners.values()]
  return {
    total: rows.length, page, limit,
    counts: { learners: all.length, withVerifiedGuardian: all.filter((l) => l.guardians.some((g) => g.linkStatus === 'verified')).length, active30: all.filter((l) => act.has(l.email)).length, parents: await ParentAccount.countDocuments(), familyPlus: await ParentAccount.countDocuments({ plan: 'family_plus' }) },
    growth: Object.entries(byMonth).sort().slice(-12).map(([month, n]) => ({ month, n })),
    rows: rows.slice(skip, skip + limit).map((l) => ({ ...l, guardians: l.guardians.map((g) => ({ ...g, parent: parents.get(g.parentId) ? { name: parents.get(g.parentId).name, email: parents.get(g.parentId).email, plan: parents.get(g.parentId).plan } : null })) })),
  }
})

// Scope resolver for the shared analytics handlers: one independent learner,
// with a reason, audited (the same profile drill-down as everywhere else).
async function forIndependentLearner(req) {
  const email = String(req.params.email || '').toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: { status: 404, message: 'Learner not found' } }
  if (await Student.exists({ email })) return { error: { status: 400, message: 'This learner belongs to an organisation: open them from that organisation.' } }
  const known = (await User.exists({ email })) || (await Child.exists({ email }))
  if (!known) return { error: { status: 404, message: 'Learner not found' } }
  await audit(req, 'people.learner.analytics', { targetType: 'learner', targetId: email, reason: String(req.query.reason || ''), meta: { path: req.path.split('/').pop() } })
  return { emails: [email], who: email.split('@')[0], names: { [email]: email.split('@')[0] } }
}

module.exports = { list, detail, setOverrides, entitlementsPreview, updateProfile, approvals, saveTemplates, suspend, unsuspend, people, person, personAction, families, forIndependentLearner, DEFAULT_TEMPLATES }
