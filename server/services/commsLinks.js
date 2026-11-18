// Who may message whom (FND-051), derived from real links only:
//   parent  <-> teacher  the teacher teaches the parent's VERIFIED child, in that child's school
//   parent  <-> admin    the parent's VERIFIED child is a student of the admin's school
//   teacher <-> admin    same school
// The school's messaging policy (getOrgPolicy(orgId).messaging) then decides:
//   off            no parent <-> staff messages at all
//   parent_starts  parents start conversations; teachers can only reply (admins may start)
//   both           anyone linked can start
// and the school's plan must include the `comms` module.
const mongoose = require('mongoose')
const { teachesBatch } = require('../utils/scopes')
const { getOrgPolicy } = require('../utils/orgPolicy')
const { entitlementsFor } = require('../utils/entitlements')

const M = {
  Child: () => require('../models/Child'),
  ParentAccount: () => require('../models/ParentAccount'),
  Student: () => require('../models/admin/Student'),
  Batch: () => require('../models/admin/Batch'),
  Tutor: () => require('../models/admin/Tutor'),
  OrgAdmin: () => require('../models/admin/OrgAdmin'),
  Organization: () => require('../models/admin/Organization'),
}
const isId = (id) => mongoose.isValidObjectId(String(id || ''))
const lower = (s) => String(s || '').trim().toLowerCase()
const keyOf = (role, id) => `${role}:${id}`
const fail = (status, message, code) => ({ error: { status, message, code } })

// The school an admin runs (by uid first, like utils/scopes.js).
async function adminOrgId(actor) {
  const Organization = M.Organization()
  const org = actor.uid ? await Organization.findOne({ adminUid: actor.uid }).select('_id').lean() : null
  if (org) return String(org._id)
  if (actor.orgId && isId(actor.orgId)) return String(actor.orgId)
  return null
}

// Org of any staff actor.
async function staffOrgId(actor) {
  if (actor.role === 'admin') return adminOrgId(actor)
  if (actor.role === 'teacher') return actor.orgId && isId(actor.orgId) ? String(actor.orgId) : null
  return null
}

// Every admin account of a school (the founding admin and any added later).
async function adminsOfOrg(orgId) {
  if (!isId(orgId)) return []
  const org = await M.Organization().findById(orgId).select('adminUid').lean()
  const docs = await M.OrgAdmin().find({ $or: [{ orgId }, ...(org?.adminUid ? [{ uid: org.adminUid }] : [])] }).select('name').lean()
  return docs.map((d) => ({ role: 'admin', id: String(d._id), name: d.name || 'School office' }))
}

const teacherIdsOfBatch = (b) => [...new Set([...(b.tutorIds || []), ...(b.directTutorIds || []), ...(b.subjects || []).flatMap((s) => s.teacherIds || [])].map(String))]

// A parent's verified children that are students of a school:
// [{ childId, childName, studentId, studentName, orgId, batchIds }]
async function parentLinks(parentId) {
  if (!isId(parentId)) return []
  const children = await M.Child().find({ parentId, linkStatus: 'verified' }).select('name email').lean()
  if (!children.length) return []
  const byEmail = new Map(children.map((c) => [lower(c.email), c]))
  const students = await M.Student().find({ email: { $in: [...byEmail.keys()] }, status: 'active' }).select('name email orgId batchIds').lean()
  return students.map((s) => {
    const c = byEmail.get(lower(s.email))
    return { childId: String(c._id), childName: c.name, studentId: String(s._id), studentName: s.name, orgId: String(s.orgId), batchIds: (s.batchIds || []).map(String) }
  })
}

// Teachers who teach this student (active groups in the student's own school).
async function teachersOfStudent(link) {
  if (!link.batchIds.length) return []
  const batches = await M.Batch().find({ _id: { $in: link.batchIds }, orgId: link.orgId, status: { $ne: 'inactive' } }).lean()
  const ids = [...new Set(batches.flatMap(teacherIdsOfBatch))]
  if (!ids.length) return []
  const tutors = await M.Tutor().find({ _id: { $in: ids }, orgId: link.orgId, status: 'active' }).select('name subject').lean()
  return tutors.map((t) => ({ role: 'teacher', id: String(t._id), name: t.name, subject: t.subject || '', groups: batches.filter((b) => teachesBatch(b, t._id)).map((b) => b.name) }))
}

// Students a teacher teaches (in their own school).
async function studentsOfTeacher(teacherId, orgId) {
  const batches = (await M.Batch().find({ orgId, status: { $ne: 'inactive' } }).lean()).filter((b) => teachesBatch(b, teacherId))
  if (!batches.length) return []
  return M.Student().find({ orgId, status: 'active', batchIds: { $in: batches.map((b) => b._id) } }).select('name email batchIds').lean()
}

// Parents with a VERIFIED link to any of these students: [{ parentId, parentName, childId, studentId, studentName }]
async function parentsOfStudents(students) {
  const byEmail = new Map(students.filter((s) => s.email).map((s) => [lower(s.email), s]))
  if (!byEmail.size) return []
  const children = await M.Child().find({ email: { $in: [...byEmail.keys()] }, linkStatus: 'verified' }).select('parentId email name').lean()
  const parents = await M.ParentAccount().find({ _id: { $in: [...new Set(children.map((c) => String(c.parentId)))] } }).select('name').lean()
  const names = new Map(parents.map((p) => [String(p._id), p.name || 'Parent']))
  return children.filter((c) => names.has(String(c.parentId))).map((c) => {
    const s = byEmail.get(lower(c.email))
    return { parentId: String(c.parentId), parentName: names.get(String(c.parentId)), childId: String(c._id), studentId: String(s._id), studentName: s.name }
  })
}

const orgHasComms = async (orgId) => (await entitlementsFor({ role: 'admin', orgId })).modules.includes('comms')

// People this actor may message, each with the child the conversation would be about.
// Never includes email addresses.
async function contactsFor(actor) {
  const out = []
  const push = (c) => out.push({ key: keyOf(c.role, c.id), ...c })
  if (actor.role === 'parent') {
    for (const link of await parentLinks(actor.id)) {
      const policy = await getOrgPolicy(link.orgId)
      if (policy.messaging === 'off' || !(await orgHasComms(link.orgId))) continue
      const child = { childId: link.childId, studentId: link.studentId, childName: link.childName }
      for (const t of await teachersOfStudent(link)) push({ ...t, orgId: link.orgId, ...child, officeHours: policy.officeHours || '' })
      for (const a of await adminsOfOrg(link.orgId)) push({ ...a, orgId: link.orgId, ...child, officeHours: policy.officeHours || '' })
    }
    return out
  }
  const orgId = await staffOrgId(actor)
  if (!orgId || !(await orgHasComms(orgId))) return out
  const policy = await getOrgPolicy(orgId)
  if (actor.role === 'teacher') {
    for (const a of await adminsOfOrg(orgId)) push({ ...a, orgId })
    if (policy.messaging !== 'off') {
      const canStart = policy.messaging === 'both'
      for (const p of await parentsOfStudents(await studentsOfTeacher(actor.id, orgId))) {
        push({ role: 'parent', id: p.parentId, name: p.parentName, orgId, childId: p.childId, studentId: p.studentId, childName: p.studentName, canStart })
      }
    }
  } else if (actor.role === 'admin') {
    const tutors = await M.Tutor().find({ orgId, status: 'active' }).select('name subject').lean()
    for (const t of tutors) push({ role: 'teacher', id: String(t._id), name: t.name, subject: t.subject || '', orgId })
    if (policy.messaging !== 'off') {
      const students = await M.Student().find({ orgId, status: 'active' }).select('name email').lean()
      for (const p of await parentsOfStudents(students)) push({ role: 'parent', id: p.parentId, name: p.parentName, orgId, childId: p.childId, studentId: p.studentId, childName: p.studentName })
    }
  }
  return out
}

// May `actor` talk to `target` ({ role, id }) about `studentId` (optional)?
// `starting` = opening a new conversation (policy parent_starts applies).
// -> { ok, orgId, studentId, childId, childName, targetName, policy } or { error }
async function authorize(actor, target, { studentId, childId, starting = false } = {}) {
  const pair = [actor.role, target.role].sort().join('-')
  if (!['parent-teacher', 'admin-parent', 'admin-teacher'].includes(pair)) return fail(403, 'You can\'t message this person here.', 'NOT_LINKED')
  if (!isId(target.id) || (actor.role !== 'superadmin' && !isId(actor.id))) return fail(404, 'Person not found')

  if (pair === 'admin-teacher') {
    const orgId = await staffOrgId(actor)
    if (!orgId) return fail(403, 'No school found for your account')
    let targetName = ''
    if (target.role === 'teacher') {
      const t = await M.Tutor().findOne({ _id: target.id, orgId, status: 'active' }).select('name').lean()
      if (!t) return fail(404, 'Person not found')
      targetName = t.name
    } else {
      const a = (await adminsOfOrg(orgId)).find((x) => x.id === String(target.id))
      if (!a) return fail(404, 'Person not found')
      targetName = a.name
    }
    if (!(await orgHasComms(orgId))) return fail(402, 'Messages aren\'t part of this school\'s plan.', 'MODULE_LOCKED')
    return { ok: true, orgId, studentId: '', childId: '', childName: '', targetName }
  }

  // A parent is involved: find the verified child that links the two.
  const parentId = actor.role === 'parent' ? actor.id : target.id
  const staff = actor.role === 'parent' ? target : actor
  const links = (await parentLinks(parentId)).filter((l) => (!studentId || l.studentId === String(studentId)) && (!childId || l.childId === String(childId)))
  let match = null
  let targetName = ''
  for (const link of links) {
    if (staff.role === 'teacher') {
      if (actor.role === 'teacher' && String(actor.orgId) !== link.orgId) continue
      const t = (await teachersOfStudent(link)).find((x) => x.id === String(staff.id))
      if (t) { match = link; targetName = actor.role === 'parent' ? t.name : ''; break }
    } else {
      const orgId = actor.role === 'admin' ? await adminOrgId(actor) : link.orgId
      if (orgId !== link.orgId) continue
      const a = (await adminsOfOrg(link.orgId)).find((x) => x.id === String(staff.id))
      if (a) { match = link; targetName = actor.role === 'parent' ? a.name : ''; break }
    }
  }
  if (!match) return fail(404, 'Person not found', 'NOT_LINKED')
  if (actor.role !== 'parent') {
    const p = await M.ParentAccount().findById(parentId).select('name').lean()
    targetName = p?.name || 'Parent'
  }
  if (!(await orgHasComms(match.orgId))) return fail(402, 'Messages aren\'t part of this school\'s plan.', 'MODULE_LOCKED')
  const policy = await getOrgPolicy(match.orgId)
  if (policy.messaging === 'off') return fail(403, 'This school has turned off messages between parents and staff.', 'MESSAGING_OFF')
  if (starting && policy.messaging === 'parent_starts' && actor.role === 'teacher') return fail(403, 'At this school, parents start conversations. You can reply once they write.', 'PARENT_STARTS')
  return { ok: true, orgId: match.orgId, studentId: match.studentId, childId: match.childId, childName: match.studentName || match.childName, targetName, officeHours: policy.officeHours || '' }
}

// "Mon-Fri 08:00-16:00", "Mon-Thu 8:30-15:30", "08:00-16:00". -> true/false, or null when not understood.
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
function withinOfficeHours(spec, { tz = 'UTC', now = new Date() } = {}) {
  const m = String(spec || '').trim().toLowerCase().match(/^(?:([a-z]{3})\s*[-–]\s*([a-z]{3})\s+)?(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})$/)
  if (!m) return null
  let parts
  try { parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now) } catch { return null }
  const get = (type) => parts.find((p) => p.type === type)?.value
  const day = DAYS.indexOf(get('weekday').toLowerCase().slice(0, 3))
  const minutes = Number(get('hour')) * 60 + Number(get('minute'))
  if (m[1]) {
    const a = DAYS.indexOf(m[1]), b = DAYS.indexOf(m[2])
    if (a < 0 || b < 0) return null
    const inDays = a <= b ? day >= a && day <= b : day >= a || day <= b
    if (!inDays) return false
  }
  const start = Number(m[3]) * 60 + Number(m[4]), end = Number(m[5]) * 60 + Number(m[6])
  return minutes >= start && minutes < end
}

module.exports = { contactsFor, authorize, adminsOfOrg, adminOrgId, staffOrgId, parentLinks, teachersOfStudent, studentsOfTeacher, parentsOfStudents, withinOfficeHours, orgHasComms, keyOf, teacherIdsOfBatch }
