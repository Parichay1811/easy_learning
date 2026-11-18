// Announcements (FND-052): who may send to whom, and delivery.
//   super admin: the whole platform, or a segment (roles, organisation kind, plans)
//   admin:       their own school, some of its groups or units, the parents of a grade, or staff only
//   teacher:     their own groups (and the verified parents of those students)
// Recipients are resolved again when a scheduled announcement goes out, so a
// teacher who left a group no longer reaches it.
const mongoose = require('mongoose')
const Announcement = require('../models/comms/Announcement')
const AnnouncementReceipt = require('../models/comms/AnnouncementReceipt')
const links = require('./commsLinks')
const { teachesBatch } = require('../utils/scopes')
const { notify } = require('../utils/notify')
const { entitlementsFor } = require('../utils/entitlements')
const { PLANS } = require('../config/plans')

const M = {
  ParentAccount: () => require('../models/ParentAccount'),
  Student: () => require('../models/admin/Student'),
  Batch: () => require('../models/admin/Batch'),
  Tutor: () => require('../models/admin/Tutor'),
  OrgAdmin: () => require('../models/admin/OrgAdmin'),
  Organization: () => require('../models/admin/Organization'),
}
const isId = (id) => mongoose.isValidObjectId(String(id || ''))
const fail = (status, message, code) => ({ error: { status, message, code } })

// Optional: org units (FND-017) once that model exists.
function unitModel() { try { return require('../models/admin/OrgUnit') } catch { return null } }

const AUTHORITY = {
  superadmin: ['platform', 'segment'],
  admin: ['org', 'unit', 'group', 'grade_parents', 'staff'],
  teacher: ['group'],
}

const uniq = (list) => { const seen = new Set(); return list.filter((r) => { const k = `${r.role}:${r.id}`; if (seen.has(k)) return false; seen.add(k); return true }) }
const parentsOf = async (students) => (await links.parentsOfStudents(students)).map((p) => ({ role: 'parent', id: p.parentId }))
const teachersOf = (batches) => [...new Set(batches.flatMap(links.teacherIdsOfBatch))].map((id) => ({ role: 'teacher', id }))

// Validate the audience for this author and work out the recipients.
// author = { role, id, orgId } (orgId resolved for admins). -> { recipients, label } or { error }
async function resolveAudience(author, audience = {}) {
  const res = await resolveAll(author, audience)
  if (res.error) return res
  return { ...res, recipients: res.recipients.filter((r) => !(r.role === author.role && r.id === String(author.id))) }
}

async function resolveAll(author, audience) {
  const type = audience.type
  if (!AUTHORITY[author.role]?.includes(type)) return fail(403, 'You can\'t send to this audience.', 'AUDIENCE_NOT_ALLOWED')
  const includeParents = audience.includeParents !== false
  const includeStaff = audience.includeStaff !== false
  const ids = (audience.ids || []).map(String)
  let recipients = []
  let label = ''

  if (author.role === 'superadmin') {
    const roles = audience.roles?.length ? audience.roles : ['parent', 'teacher', 'admin']
    let orgIds = null
    const familyPlans = (audience.plans || []).filter((p) => PLANS[p]?.for === 'family')
    const orgPlans = (audience.plans || []).filter((p) => PLANS[p] && PLANS[p].for !== 'family')
    if (type === 'segment' && (audience.orgKind || orgPlans.length)) {
      const orgs = await M.Organization().find({ status: 'approved', ...(audience.orgKind ? { kind: audience.orgKind } : {}) }).select('_id').lean()
      orgIds = []
      for (const o of orgs) {
        if (!orgPlans.length || orgPlans.includes((await entitlementsFor({ role: 'admin', orgId: String(o._id) })).plan)) orgIds.push(o._id)
      }
    }
    const orgFilter = orgIds ? { orgId: { $in: orgIds } } : {}
    if (roles.includes('teacher')) recipients.push(...(await M.Tutor().find({ status: 'active', ...orgFilter }).select('_id').lean()).map((t) => ({ role: 'teacher', id: String(t._id) })))
    if (roles.includes('admin')) recipients.push(...(await M.OrgAdmin().find(orgIds ? orgFilter : {}).select('_id').lean()).map((a) => ({ role: 'admin', id: String(a._id) })))
    if (roles.includes('parent')) {
      if (orgIds) recipients.push(...(await parentsOf(await M.Student().find({ status: 'active', ...orgFilter }).select('email').lean())))
      else recipients.push(...(await M.ParentAccount().find(familyPlans.length ? { plan: { $in: familyPlans } } : {}).select('_id').lean()).map((p) => ({ role: 'parent', id: String(p._id) })))
      if (orgIds && familyPlans.length) {
        const keep = new Set((await M.ParentAccount().find({ plan: { $in: familyPlans } }).select('_id').lean()).map((p) => String(p._id)))
        recipients = recipients.filter((r) => r.role !== 'parent' || keep.has(r.id))
      }
    }
    label = type === 'platform' ? 'Everyone on Learnigo' : 'A group of Learnigo users'
    return { recipients: uniq(recipients), label }
  }

  const orgId = author.orgId
  if (!orgId) return fail(403, 'No school found for your account')
  const staff = async () => [...(await M.Tutor().find({ orgId, status: 'active' }).select('_id').lean()).map((t) => ({ role: 'teacher', id: String(t._id) })), ...(await links.adminsOfOrg(orgId)).map((a) => ({ role: 'admin', id: a.id }))]

  if (type === 'group' || type === 'unit') {
    let batchIds = ids
    if (type === 'unit') {
      const OrgUnit = unitModel()
      if (!OrgUnit) return fail(400, 'School units aren\'t set up yet.', 'UNITS_UNAVAILABLE')
      const units = await OrgUnit.find({ _id: { $in: ids.filter(isId) }, orgId }).lean()
      if (units.length !== ids.length || !ids.length) return fail(404, 'Unit not found')
      const paths = units.map((u) => u.path).filter(Boolean)
      const sub = await OrgUnit.find({ orgId, $or: paths.map((p) => ({ path: { $regex: `^${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` } })) }).select('_id').lean()
      batchIds = (await M.Batch().find({ orgId, unitId: { $in: [...units.map((u) => u._id), ...sub.map((u) => u._id)] } }).select('_id').lean()).map((b) => String(b._id))
      label = units.map((u) => u.name).join(', ')
    }
    if (!batchIds.length || !batchIds.every(isId)) return fail(400, 'Choose at least one group')
    const batches = await M.Batch().find({ _id: { $in: batchIds }, orgId, status: { $ne: 'inactive' } }).lean()
    if (type === 'group' && batches.length !== batchIds.length) return fail(404, 'Group not found')
    if (author.role === 'teacher' && !batches.every((b) => teachesBatch(b, author.id))) return fail(404, 'Group not found')
    if (type === 'group') label = batches.map((b) => b.name).join(', ')
    const students = await M.Student().find({ orgId, status: 'active', batchIds: { $in: batches.map((b) => b._id) } }).select('email').lean()
    if (includeStaff) recipients.push(...teachersOf(batches))
    if (includeParents) recipients.push(...(await parentsOf(students)))
  } else if (type === 'org') {
    label = 'Everyone at school'
    if (includeStaff) recipients.push(...(await staff()))
    if (includeParents) recipients.push(...(await parentsOf(await M.Student().find({ orgId, status: 'active' }).select('email').lean())))
  } else if (type === 'grade_parents') {
    const grade = String(audience.grade || '').trim()
    if (!grade) return fail(400, 'Choose a grade')
    label = `Parents of ${grade}`
    recipients.push(...(await parentsOf(await M.Student().find({ orgId, status: 'active', grade }).select('email').lean())))
  } else if (type === 'staff') {
    label = 'All staff'
    recipients.push(...(await staff()))
  }
  return { recipients: uniq(recipients), label }
}

// The author as resolveAudience needs it (admins: their school by uid).
async function authorFor(actor) {
  if (actor.role === 'admin') return { role: 'admin', id: actor.id, orgId: await links.adminOrgId(actor) }
  if (actor.role === 'teacher') return { role: 'teacher', id: actor.id, orgId: actor.orgId && isId(actor.orgId) ? String(actor.orgId) : null }
  return { role: actor.role, id: actor.id, orgId: null }
}

// Send one announcement now, if it is due and nobody else is sending it.
async function deliver(id, { now = new Date() } = {}) {
  const a = await Announcement.findOneAndUpdate({ _id: id, status: 'scheduled', publishAt: { $lte: now } }, { status: 'sending' }, { new: true })
  if (!a) return null
  try {
    const [role, ...rest] = a.authorKey.split(':')
    const res = await resolveAudience({ role, id: rest.join(':'), orgId: a.orgId || null }, a.audience.toObject ? a.audience.toObject() : a.audience)
    const recipients = res.error ? [] : res.recipients.filter((r) => `${r.role}:${r.id}` !== a.authorKey)
    for (let i = 0; i < recipients.length; i += 200) {
      const chunk = recipients.slice(i, i + 200)
      await AnnouncementReceipt.insertMany(chunk.map((r) => ({ announcementId: a._id, to: `${r.role}:${r.id}`, role: r.role, expiresAt: a.expiresAt })), { ordered: false }).catch((e) => { if (e.code !== 11000 && !e.writeErrors) throw e })
      await notify(chunk, { kind: 'announcement', title: a.title, body: a.body.slice(0, 200), link: a.link || '' })
      await new Promise((r) => setImmediate(r))
    }
    a.status = 'sent'; a.sentAt = new Date(); a.recipientCount = await AnnouncementReceipt.countDocuments({ announcementId: a._id })
    await a.save()
    return a
  } catch (e) {
    await Announcement.updateOne({ _id: a._id }, { status: 'scheduled' })   // try again on the next tick
    throw e
  }
}

// Scheduler job: everything that is due.
async function deliverDue({ now = new Date() } = {}) {
  // A send interrupted by a restart: pick it up again (receipts are unique, so nobody gets two).
  await Announcement.updateMany({ status: 'sending', updatedAt: { $lt: new Date(now.getTime() - 10 * 60000) } }, { status: 'scheduled' })
  const due = await Announcement.find({ status: 'scheduled', publishAt: { $lte: now } }).select('_id').limit(20).lean()
  let sent = 0
  for (const d of due) if (await deliver(d._id, { now })) sent++
  return { sent }
}

module.exports = { resolveAudience, authorFor, deliver, deliverDue, AUTHORITY }
