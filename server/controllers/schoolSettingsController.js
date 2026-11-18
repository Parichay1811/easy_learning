// School settings and governance: setup wizard and status (ADM-001/002), policies
// (ADM-060 / FND-022), branding (ADM-061), billing view (ADM-080), data protection
// (ADM-081), audit log (ADM-082), and the question review queue (ADM-050/051).
const OrgPolicy = require('../models/admin/OrgPolicy')
const ConsentRecord = require('../models/admin/ConsentRecord')
const Student = require('../models/admin/Student')
const Parent = require('../models/admin/Parent')
const AuditEvent = require('../models/AuditEvent')
const QUB = require('../models/superadmin/QuestionUploadBatch')
const { getOrgPolicy, DEFAULTS } = require('../utils/orgPolicy')
const { entitlementsFor } = require('../utils/entitlements')
const { seatInfo } = require('../utils/seats')
const { audit, digest } = require('../utils/audit')
const { validId } = require('../utils/orgUnits')
const { getQuestionModel } = require('../utils/questionModels')
const { PLANS } = require('../config/plans')

const bad = (message, status = 400, code) => Object.assign(new Error(message), { status, code })
const h = (fn) => async (req, res) => {
  try { const out = await fn(req, res); if (out !== undefined) res.json({ success: true, ...out }) } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message, ...(err.code ? { code: err.code } : {}) })
    console.error('school settings error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
const DPA_VERSION = '2026-11'
const HEX = /^#[0-9a-f]{6}$/i

// ── ADM-002 status banner and ADM-001 setup wizard ─────────────────────────────

const status = h(async (req) => {
  const SAOrg = require('../models/superadmin/Organization')
  const [sa, ent, seats] = await Promise.all([SAOrg.findOne({ adminOrgId: String(req.org._id) }).lean(), entitlementsFor(req.actor), seatInfo(req.org._id)])
  const trialEnds = sa?.trialEndsAt ? new Date(sa.trialEndsAt) : null
  return {
    org: { status: req.org.status, rejectionReason: req.org.rejectionReason, name: req.org.name },
    plan: { id: ent.plan, label: PLANS[ent.plan]?.label || ent.plan, status: sa?.subscriptionStatus || 'active' },
    trialDaysLeft: trialEnds ? Math.max(0, Math.ceil((trialEnds - Date.now()) / 86400000)) : null,
    seats,
  }
})

const setup = h(async (req) => {
  const OrgUnit = require('../models/admin/OrgUnit')
  const Tutor = require('../models/admin/Tutor')
  const Batch = require('../models/admin/Batch')
  const ParentInvite = require('../models/admin/ParentInvite')
  const orgId = req.org._id
  const ent = await entitlementsFor(req.actor)
  const [units, students, tutors, assigned, parents, invites, policy] = await Promise.all([
    OrgUnit.countDocuments({ orgId }), Student.countDocuments({ orgId, status: 'active' }), Tutor.countDocuments({ orgId }),
    Batch.countDocuments({ orgId, archivedAt: null, 'tutorIds.0': { $exists: true } }), Parent.countDocuments({ orgId, status: 'active' }),
    ParentInvite.countDocuments({ orgId }), OrgPolicy.findOne({ orgId }).lean(),
  ])
  const steps = [
    { key: 'profile', done: req.org.status === 'approved', detail: req.org.status },
    ...(ent.modules.includes('org.tree') ? [{ key: 'structure', done: units > 0, detail: units }] : []),
    { key: 'people', done: students > 0 && tutors > 0, detail: { students, tutors } },
    { key: 'assign', done: assigned > 0, detail: assigned },
    { key: 'parents', done: parents > 0 && invites > 0, detail: { parents, invites }, optional: parents === 0 },
    { key: 'policies', done: Boolean(policy), detail: null },
    { key: 'dpa', done: Boolean(policy?.dpaAcceptedAt), detail: null },
  ]
  const done = steps.filter((s) => s.done).length
  return { steps, done, total: steps.length, percent: Math.round((done / steps.length) * 100) }
})

// ── ADM-060 policies ──────────────────────────────────────────────────────────

const POLICY_FIELDS = {
  messaging: (v) => ['off', 'parent_starts', 'both'].includes(v) || 'Messaging is off, parent starts, or both.',
  officeHours: (v) => (typeof v === 'string' && v.length <= 120) || 'Office hours: up to 120 characters.',
  teachersCreateGroups: (v) => typeof v === 'boolean' || 'Choose yes or no.',
  parentsSeeClassAverage: (v) => typeof v === 'boolean' || 'Choose yes or no.',
  leaderboards: (v) => ['off', 'group'].includes(v) || 'Leaderboards are off or within a group.',
  aiTeacherInSchoolHours: (v) => typeof v === 'boolean' || 'Choose on or off.',
  activityVisibility: (v) => ['assigned', 'school_hours', 'all'].includes(v) || 'Choose assigned work, school hours or all.',
  retentionYears: (v) => (Number.isInteger(v) && v >= 0 && v <= 10) || 'Keep data 0 to 10 years after a student leaves.',
  holidaysKeepStreak: (v) => typeof v === 'boolean' || 'Choose yes or no.',
  reviewSlaDays: (v) => (Number.isInteger(v) && v >= 1 && v <= 30) || 'Review within 1 to 30 days.',
}

const getPolicies = h(async (req) => ({ policy: await getOrgPolicy(req.org._id), defaults: DEFAULTS, kind: req.org.kind }))

const updatePolicies = h(async (req) => {
  const set = {}
  for (const [k, v] of Object.entries(req.body || {})) {
    if (!POLICY_FIELDS[k]) continue
    const ok = POLICY_FIELDS[k](v)
    if (ok !== true) throw bad(ok)
    set[k] = typeof v === 'string' ? v.trim() : v
  }
  if (!Object.keys(set).length) throw bad('Nothing to change.')
  const before = await getOrgPolicy(req.org._id)
  await OrgPolicy.updateOne({ orgId: req.org._id }, { $set: set }, { upsert: true })
  const changed = Object.fromEntries(Object.keys(set).filter((k) => before[k] !== set[k]).map((k) => [k, { from: before[k], to: set[k] }]))
  await audit(req, 'policy.update', { targetType: 'policy', targetId: req.org._id, orgId: req.org._id, meta: changed })
  return { policy: await getOrgPolicy(req.org._id) }
})

// ── ADM-061 branding (module reports.branded) ─────────────────────────────────

const updateBranding = h(async (req) => {
  const b = req.body || {}
  const set = {}
  for (const k of ['primaryColor', 'accentColor']) if (b[k] !== undefined) {
    if (b[k] !== '' && !HEX.test(b[k])) throw bad('Colours look like #3d9bff.')
    set[`branding.${k}`] = b[k]
  }
  const lim = { reportHeader: 200, reportFooter: 200, welcomeMessage: 400 }
  for (const [k, max] of Object.entries(lim)) if (b[k] !== undefined) {
    if (typeof b[k] !== 'string' || b[k].length > max) throw bad(`Keep it under ${max} characters.`)
    set[`branding.${k}`] = b[k].trim()
  }
  if (!Object.keys(set).length) throw bad('Nothing to change.')
  await OrgPolicy.updateOne({ orgId: req.org._id }, { $set: set }, { upsert: true })
  await audit(req, 'branding.update', { targetType: 'policy', targetId: req.org._id, orgId: req.org._id, meta: Object.keys(set) })
  return { branding: (await getOrgPolicy(req.org._id)).branding, logoUrl: req.org.logoUrl }
})

// ── ADM-080 billing (read only; changes are made by Learnigo) ────────────────

const billing = h(async (req) => {
  const SAOrg = require('../models/superadmin/Organization')
  const [sa, ent, seats] = await Promise.all([SAOrg.findOne({ adminOrgId: String(req.org._id) }).lean(), entitlementsFor(req.actor), seatInfo(req.org._id)])
  return {
    plan: { id: ent.plan, label: PLANS[ent.plan]?.label || ent.plan, modules: ent.modules },
    status: sa?.subscriptionStatus || 'active',
    seats,
    renewsAt: sa?.periodEnd || sa?.renewalAt || null,
    trialEndsAt: sa?.trialEndsAt || null,
    vatId: sa?.vatId || '',
    invoices: Array.isArray(sa?.invoices) ? sa.invoices.slice(-12) : [],
  }
})

// ── ADM-081 data protection ──────────────────────────────────────────────────

const privacy = h(async (req) => {
  const policy = await getOrgPolicy(req.org._id)
  const [students, records, guardianConsent] = await Promise.all([
    Student.countDocuments({ orgId: req.org._id, status: 'active' }),
    ConsentRecord.aggregate([{ $match: { orgId: req.org._id, withdrawnAt: null } }, { $group: { _id: '$studentId' } }, { $count: 'n' }]),
    Parent.aggregate([{ $match: { orgId: req.org._id, consentGiven: true, status: 'active' } }, { $unwind: '$studentIds' }, { $group: { _id: '$studentIds' } }, { $count: 'n' }]),
  ])
  let requests = null
  try {
    const DataRequest = require('../models/DataRequest')
    requests = await DataRequest.find({ orgId: { $in: [req.org._id, String(req.org._id)] } }).sort({ createdAt: -1 }).limit(50).lean()
  } catch { /* DataRequest is built by the Parent work; until then there is nothing to show */ }
  return {
    dpa: { currentVersion: DPA_VERSION, acceptedAt: policy.dpaAcceptedAt, acceptedBy: policy.dpaAcceptedBy, version: policy.dpaVersion, signerName: policy.dpaSignerName, signerRole: policy.dpaSignerRole, needsSigning: !policy.dpaAcceptedAt || policy.dpaVersion !== DPA_VERSION },
    retentionYears: policy.retentionYears,
    consent: { students, withRecord: records[0]?.n || 0, guardianConsent: guardianConsent[0]?.n || 0, coveredByDpa: policy.dpaAcceptedAt ? students : 0 },
    requests,
  }
})

const signDpa = h(async (req) => {
  const { signerName, signerRole, accept, version } = req.body || {}
  if (accept !== true) throw bad('Tick the box to accept the agreement.')
  if (version !== DPA_VERSION) throw bad('A newer version of the agreement is available. Reload the page.', 409)
  const name = String(signerName || '').trim(), role = String(signerRole || '').trim()
  if (name.length < 2 || name.length > 100) throw bad('Type your full name to sign.')
  if (role.length < 2 || role.length > 80) throw bad('Add your role, for example Principal.')
  const at = new Date()
  await OrgPolicy.updateOne({ orgId: req.org._id }, { $set: { dpaAcceptedAt: at, dpaAcceptedBy: req.actor.email, dpaVersion: DPA_VERSION, dpaSignerName: name, dpaSignerRole: role } }, { upsert: true })
  await audit(req, 'dpa.sign', { targetType: 'policy', targetId: req.org._id, orgId: req.org._id, meta: { version: DPA_VERSION, name, role } })
  return { acceptedAt: at, version: DPA_VERSION }
})

// Record consent for students: { studentIds, basis, givenBy, version, note } or withdraw: { withdraw: true }.
const recordConsent = h(async (req) => {
  const { studentIds, basis, givenBy = '', version = DPA_VERSION, note = '', withdraw } = req.body || {}
  const ids = (Array.isArray(studentIds) ? studentIds : []).filter(validId).slice(0, 2000)
  if (!ids.length) throw bad('Choose students.')
  const found = await Student.find({ _id: { $in: ids }, orgId: req.org._id }).select('_id').lean()
  if (found.length !== ids.length) throw bad('A chosen student is not in your school.', 404)
  if (withdraw) {
    const r = await ConsentRecord.updateMany({ orgId: req.org._id, studentId: { $in: ids }, withdrawnAt: null }, { $set: { withdrawnAt: new Date() } })
    await audit(req, 'consent.withdraw', { targetType: 'student', orgId: req.org._id, meta: { students: ids.length } })
    return { withdrawn: r.modifiedCount }
  }
  if (!['school_dpa', 'guardian', 'learner'].includes(basis)) throw bad('Choose the legal basis.')
  await ConsentRecord.insertMany(found.map((s) => ({ orgId: req.org._id, studentId: s._id, basis, givenBy: String(givenBy).slice(0, 120), version: String(version).slice(0, 40), note: String(note).slice(0, 300), recordedBy: req.actor.email })))
  await audit(req, 'consent.record', { targetType: 'student', orgId: req.org._id, meta: { students: found.length, basis } })
  return { recorded: found.length }
})

// ── ADM-082 audit log ─────────────────────────────────────────────────────────

function auditFilter(req) {
  const f = { orgId: String(req.org._id) }
  if (req.query.action) f.action = { $regex: `^${String(req.query.action).replace(/[^a-z_.]/gi, '')}` }
  if (req.query.actor) f.actorEmail = String(req.query.actor).toLowerCase().slice(0, 120)
  const at = {}
  if (/^\d{4}-\d{2}-\d{2}$/.test(req.query.from || '')) at.$gte = new Date(`${req.query.from}T00:00:00Z`)
  if (/^\d{4}-\d{2}-\d{2}$/.test(req.query.to || '')) at.$lte = new Date(`${req.query.to}T23:59:59Z`)
  if (Object.keys(at).length) f.at = at
  return f
}

// Each event's own hash must match its contents, and the event it points back to
// must exist (it may belong to another school, so only its existence is checked).
async function verifyOrgEvents(events) {
  const okHash = events.filter((e) => e.hash === digest(e, e.prevHash))
  const prev = [...new Set(events.map((e) => e.prevHash).filter(Boolean))]
  const found = new Set((await AuditEvent.find({ hash: { $in: prev } }).select('hash').lean()).map((e) => e.hash))
  const broken = events.filter((e) => e.hash !== digest(e, e.prevHash) || (e.prevHash && !found.has(e.prevHash)))
  return { checked: events.length, intact: broken.length === 0, hashOk: okHash.length, broken: broken.map((e) => String(e._id)).slice(0, 20) }
}

const auditLog = h(async (req, res) => {
  const f = auditFilter(req)
  const limit = Math.min(Number(req.query.limit) || 100, 500)
  if (req.query.format === 'csv') {
    const rows = await AuditEvent.find(f).sort({ at: -1 }).limit(5000).lean()
    await audit(req, 'audit.export', { targetType: 'audit', orgId: req.org._id, meta: { rows: rows.length } })
    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = ['at,actor_role,actor_email,action,target_type,target_id,reason,ip', ...rows.map((e) => [e.at.toISOString(), e.actorRole, e.actorEmail, e.action, e.targetType, e.targetId, e.reason, e.ip].map(cell).join(','))].join('\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"')
    res.send(csv)
    return undefined
  }
  const events = await AuditEvent.find(f).sort({ at: -1, _id: -1 }).limit(limit).lean()
  const actions = await AuditEvent.distinct('action', { orgId: String(req.org._id) })
  return { events: events.map(({ prevHash, hash, ...e }) => ({ ...e, hash: hash.slice(0, 12) })), actions: actions.sort(), integrity: await verifyOrgEvents(events) }
})

// ── ADM-050 question review queue (coordinators review their own subjects) ───

const reviewFilter = (req) => {
  const f = { orgId: String(req.org._id) }
  if (req.staff?.subjects?.length) f.subject = { $in: req.staff.subjects }
  if (req.query.status) f.status = String(req.query.status)
  if (req.query.subject) f.subject = req.staff?.subjects?.length && !req.staff.subjects.includes(req.query.subject) ? '__none__' : String(req.query.subject)
  if (req.query.module) f.module = String(req.query.module)
  return f
}

const reviewQueue = h(async (req) => {
  const policy = await getOrgPolicy(req.org._id)
  const sla = policy.reviewSlaDays
  const items = await QUB.find(reviewFilter(req)).sort({ status: 1, createdAt: 1 }).limit(300).lean()
  const now = Date.now()
  const rows = items.map((b) => {
    const waitingDays = b.status === 'pending' ? Math.floor((now - new Date(b.createdAt).getTime()) / 86400000) : null
    return { ...b, waitingDays, overdue: waitingDays != null && waitingDays >= sla }
  })
  return { slaDays: sla, items: rows, pending: rows.filter((r) => r.status === 'pending').length, overdue: rows.filter((r) => r.overdue).length }
})

async function reviewItem(req, id) {
  const b = validId(id) && await QUB.findOne({ ...reviewFilter({ ...req, query: {} }), _id: id })
  if (!b) throw bad('Upload not found', 404)
  return b
}

const reviewDetail = h(async (req) => {
  const b = await reviewItem(req, req.params.id)
  const Model = getQuestionModel(b.module, b.subject)
  const rows = Model ? await Model.find({ uploadBatchId: b._id }).sort({ id: 1 }).limit(500).lean() : []
  return { batch: b, rows }
})

const addNote = h(async (req) => {
  const text = String(req.body?.text || '').trim()
  if (!text || text.length > 1000) throw bad('Write a note (up to 1,000 characters).')
  const b = await reviewItem(req, req.params.id)
  b.reviewNotes.push({ by: req.actor.email, text, at: new Date() })
  await b.save()
  return { notes: b.reviewNotes }
})

async function setStatus(req, b, status, reason = '') {
  const Model = getQuestionModel(b.module, b.subject)
  if (!Model) throw bad('Unknown module/subject')
  b.status = status; b.reviewedAt = new Date(); b.reviewedBy = req.actor.email
  if (status === 'rejected') { b.rejectionReason = reason; b.rejectionHistory.push({ reason, rejectedAt: new Date() }) } else b.rejectionReason = ''
  await b.save()
  await Model.updateMany({ uploadBatchId: b._id }, { $set: { status } })
}

const bulkReview = h(async (req) => {
  const { ids, action, reason = '' } = req.body || {}
  if (!['approve', 'reject'].includes(action)) throw bad('Approve or reject.')
  const list = (Array.isArray(ids) ? ids : []).filter(validId).slice(0, 200)
  if (!list.length) throw bad('Choose uploads.')
  if (action === 'reject' && String(reason).trim().length < 3) throw bad('Say why, so the teacher can fix it.')
  const items = await QUB.find({ ...reviewFilter({ ...req, query: {} }), _id: { $in: list } })
  for (const b of items) await setStatus(req, b, action === 'approve' ? 'approved' : 'rejected', String(reason).trim().slice(0, 500))
  await audit(req, `questions.bulk_${action}`, { targetType: 'question_upload', orgId: req.org._id, meta: { count: items.length } })
  return { updated: items.length, skipped: list.length - items.length }
})

// ── ADM-051 school bank: approved uploads, with tags ─────────────────────────

const bank = h(async (req) => {
  const f = { ...reviewFilter({ ...req, query: { subject: req.query.subject, module: req.query.module } }), status: 'approved' }
  if (req.query.tag) f.tags = String(req.query.tag).toLowerCase()
  const items = await QUB.find(f).sort({ reviewedAt: -1 }).limit(300).select('module subject submittedByName rowCount tags reviewedAt originalFilename batchIds').lean()
  const tags = await QUB.distinct('tags', { orgId: String(req.org._id), status: 'approved' })
  return { items, tags: tags.sort(), questions: items.reduce((n, b) => n + (b.rowCount || 0), 0) }
})

const tagBank = h(async (req) => {
  const b = await reviewItem(req, req.params.id)
  const tags = (Array.isArray(req.body?.tags) ? req.body.tags : []).map((t) => String(t).trim().toLowerCase()).filter((t) => t && t.length <= 30).slice(0, 12)
  b.tags = [...new Set(tags)]
  await b.save()
  return { tags: b.tags }
})

module.exports = {
  status, setup, getPolicies, updatePolicies, updateBranding, billing, privacy, signDpa, recordConsent, auditLog,
  reviewQueue, reviewDetail, addNote, bulkReview, bank, tagBank, verifyOrgEvents, DPA_VERSION,
}
