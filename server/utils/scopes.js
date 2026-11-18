// "Which learners may this person look at?" (FND-020). Each helper checks the
// permission AND returns the analytics scope { emails, who, names, tz } for
// controllers/analyticsController.js, or { error: {status, message} }.
// Role routes call one of these, set req.analyticsScope, then use a shared handler.
const { childAccess } = require('./guardianLink')

const fail = (status, message, extra = {}) => ({ error: { status, message, ...extra } })
const lower = (s) => String(s || '').toLowerCase()

async function forParentChild(parent, childId) {
  const Child = require('../models/Child')
  const child = await Child.findOne({ _id: childId, parentId: parent.id })
  const access = childAccess(child)
  if (!access.ok) return fail(access.status, access.message, { code: access.code })
  return { emails: [lower(child.email)], who: child.name, names: { [lower(child.email)]: child.name } }
}

// The organisation an admin runs.
async function adminOrg(admin) {
  const Organization = require('../models/admin/Organization')
  return Organization.findOne(admin.uid ? { adminUid: admin.uid } : { _id: admin.orgId })
}

const toScope = (students, who) => ({
  emails: students.map((s) => lower(s.email)).filter(Boolean),
  who,
  names: Object.fromEntries(students.filter((s) => s.email).map((s) => [lower(s.email), s.name])),
})

// Is this teacher assigned to this batch (whole batch, or one of its subjects)?
const teachesBatch = (batch, teacherId) => {
  const id = String(teacherId)
  return (batch.tutorIds || []).some((x) => String(x) === id)
    || (batch.directTutorIds || []).some((x) => String(x) === id)
    || (batch.subjects || []).some((s) => (s.teacherIds || []).some((x) => String(x) === id))
}

async function forTeacherBatch(teacher, batchId) {
  const Batch = require('../models/admin/Batch')
  const Student = require('../models/admin/Student')
  const batch = await Batch.findOne({ _id: batchId, orgId: teacher.orgId })
  if (!batch || !teachesBatch(batch, teacher.id)) return fail(404, 'Group not found')
  const students = await Student.find({ orgId: teacher.orgId, batchIds: batch._id, status: 'active' }).select('name email')
  return toScope(students, batch.name)
}

// Every student in any group the teacher is assigned to.
async function forTeacherAll(teacher) {
  const Batch = require('../models/admin/Batch')
  const Student = require('../models/admin/Student')
  const batches = (await Batch.find({ orgId: teacher.orgId })).filter((b) => teachesBatch(b, teacher.id))
  const students = await Student.find({ orgId: teacher.orgId, batchIds: { $in: batches.map((b) => b._id) }, status: 'active' }).select('name email')
  return toScope(students, 'Your students')
}

// A teacher looking at one of their own students (any group they teach).
async function forTeacherStudent(teacher, studentId) {
  const all = await forTeacherAll(teacher)
  const Student = require('../models/admin/Student')
  const s = await Student.findOne({ _id: studentId, orgId: teacher.orgId }).select('name email')
  if (!s || !s.email || !all.emails.includes(lower(s.email))) return fail(404, 'Student not found')
  return toScope([s], s.name)
}

// Admin: the whole school, one unit (its whole subtree, ADM-010), one group, or
// one student, never another school's. Staff with units (`admin.staff.unitIds`,
// set by utils/orgAccess.js) are limited to those subtrees: anything outside is 404.
async function forAdmin(admin, { batchId, studentId, unitId } = {}) {
  const Student = require('../models/admin/Student')
  const Batch = require('../models/admin/Batch')
  const { loadUnits, subtreeIdSet, validId } = require('./orgUnits')
  const org = await adminOrg(admin)
  if (!org) return fail(400, 'Organization not found')
  for (const id of [batchId, studentId, unitId]) if (id && !validId(id)) return fail(404, 'Not found')
  const filter = { orgId: org._id, status: 'active' }
  const restrict = admin.staff?.unitIds?.length ? admin.staff.unitIds : null
  let who = studentId ? null : batchId ? 'The group' : org.name
  if (unitId || restrict) {
    const units = await loadUnits(org._id)
    const allowed = restrict ? subtreeIdSet(units, restrict) : null
    let ids = allowed
    if (unitId) {
      const unit = units.find((u) => String(u._id) === String(unitId))
      if (!unit || (allowed && !allowed.has(String(unitId)))) return fail(404, 'Unit not found')
      ids = subtreeIdSet(units, [unitId])
      who = unit.name
    }
    if (batchId && allowed) {
      const b = await Batch.findOne({ _id: batchId, orgId: org._id }).select('unitId').lean()
      if (!b || !b.unitId || !allowed.has(String(b.unitId))) return fail(404, 'Group not found')
    }
    const inUnits = await Batch.find({ orgId: org._id, unitId: { $in: [...ids] } }).distinct('_id')
    filter.$or = [{ unitId: { $in: [...ids] } }, { batchIds: { $in: inUnits } }]
  }
  if (batchId) filter.batchIds = batchId
  if (studentId) filter._id = studentId
  const students = await Student.find(filter).select('name email')
  if (studentId && !students.length) return fail(404, 'Student not found')
  // School holidays don't break a student's streak if the school wishes (ADM-062).
  const skipDates = studentId ? await require('./schoolCalendar').streakSkipDates(org._id) : undefined
  return { ...toScope(students, studentId ? students[0].name : who), orgId: String(org._id), ...(skipDates ? { skipDates } : {}) }
}

// Super admin: any organisation (by its superadmin id) or the whole platform.
async function forSuperadminOrg(saOrgId, { studentId } = {}) {
  const SAOrg = require('../models/superadmin/Organization')
  const Student = require('../models/admin/Student')
  const sa = await SAOrg.findById(saOrgId)
  if (!sa || !sa.adminOrgId) return fail(404, 'Organization not found')
  const filter = { orgId: sa.adminOrgId, status: 'active' }
  if (studentId) filter._id = studentId
  const students = await Student.find(filter).select('name email')
  if (studentId && !students.length) return fail(404, 'Student not found')
  return { ...toScope(students, studentId ? students[0].name : sa.name), orgId: String(sa.adminOrgId) }
}

// Middleware factory: resolve a scope, answer the error or set req.analyticsScope.
const scoped = (resolver) => async (req, res, next) => {
  try {
    const scope = await resolver(req)
    if (scope.error) return res.status(scope.error.status).json({ success: false, message: scope.error.message, code: scope.error.code })
    scope.tz = req.get('x-timezone') || req.query.tz || 'UTC'
    req.analyticsScope = scope
    next()
  } catch (err) {
    console.error('scope error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { forParentChild, forTeacherBatch, forTeacherAll, forTeacherStudent, forAdmin, forSuperadminOrg, teachesBatch, scoped }
