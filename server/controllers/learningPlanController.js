// A learner's learning plan as their guardian or teacher sees and adjusts it:
//   GET/PUT /api/parent/children/:childId/learning     (VERIFIED guardian link only)
//   GET/PUT /api/teacher/students/:studentEmail/learning (a student in a group this teacher teaches)
// The learner is resolved to their learning email the same way the existing
// parent and teacher views do (utils/guardianLink.childAccess, utils/scopes.forTeacherAll).
// Every change is audit-logged.
const mongoose = require('mongoose')
const actions = require('../services/learning/actions')
const validate = require('../services/learning/validate')
const { audit } = require('../utils/audit')
const { childAccess } = require('../utils/guardianLink')

const lower = (s) => String(s || '').trim().toLowerCase()
const isId = (v) => mongoose.isValidObjectId(v) && String(v).length === 24

class AccessError extends Error {
  constructor(status, message, extra = {}) { super(message); this.status = status; this.extra = extra }
}

// A verified guardian of this child, or 403/404.
async function parentTarget(req) {
  const Child = require('../models/Child')
  if (!isId(req.params.childId) || !isId(req.parent?.id)) throw new AccessError(404, 'Child not found')
  const child = await Child.findOne({ _id: req.params.childId, parentId: req.parent.id })
  const access = childAccess(child)
  if (!access.ok) throw new AccessError(access.status, access.message, { code: access.code, linkStatus: access.linkStatus })
  req.actor = { role: 'parent', id: String(req.parent.id), email: req.parent.email || '' }
  return { email: lower(child.email), role: 'guardian', name: req.parent.name || '', targetId: String(child._id), orgId: '' }
}

// A student in a group this (active) teacher teaches, by email or student id; else 404.
async function teacherTarget(req) {
  const Tutor = require('../models/admin/Tutor')
  const Student = require('../models/admin/Student')
  const { forTeacherAll } = require('../utils/scopes')
  const t = req.teacher || {}
  if (!isId(t.id) || !isId(t.orgId)) throw new AccessError(403, 'Your teacher account is not active in this workspace.')
  const tutor = await Tutor.findOne({ _id: t.id, orgId: t.orgId }).select('authStatus').lean()
  if (!tutor || tutor.authStatus === 'disabled') throw new AccessError(403, 'Your teacher account is not active in this workspace.')
  const key = String(req.params.studentEmail || '').trim()
  const student = isId(key)
    ? await Student.findOne({ _id: key, orgId: t.orgId }).select('email').lean()
    : await Student.findOne({ email: lower(key), orgId: t.orgId }).select('email').lean()
  if (!student?.email) throw new AccessError(404, 'Student not found')
  const mine = await forTeacherAll(t)
  if (!mine.emails.includes(lower(student.email))) throw new AccessError(404, 'Student not found')
  req.actor = { role: 'teacher', id: String(t.id), email: t.email || '', orgId: String(t.orgId) }
  return { email: lower(student.email), role: 'teacher', name: t.name || '', targetId: String(student._id), orgId: String(t.orgId) }
}

const handle = (resolve, fn) => async (req, res) => {
  try {
    const target = await resolve(req)
    await fn(req, res, target)
  } catch (err) {
    if (err instanceof AccessError) return res.status(err.status).json({ success: false, message: err.message, ...err.extra })
    if (err instanceof actions.LearnError) return res.status(err.status).json({ success: false, message: err.message, ...(err.code ? { code: err.code } : {}) })
    console.error('learning plan error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

async function read(req, res, target) {
  res.json({ success: true, ...(await actions.adultView(target.email)) })
}

async function write(req, res, target) {
  const { value, errors } = validate.adultUpdate(req.body, target.role)
  if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors })
  const result = await actions.adultUpdate(target.email, value, target.role, { name: target.name })
  await audit(req, 'learning.update', {
    targetType: 'learner', targetId: target.targetId, orgId: target.orgId,
    meta: { fields: Object.keys(value), levels: result.levels, overrides: value.overrides?.length, by: target.role },
  })
  res.json({ success: true, ...(await actions.adultView(target.email)) })
}

module.exports = {
  getChildLearning: handle(parentTarget, read),
  putChildLearning: handle(parentTarget, write),
  getStudentLearning: handle(teacherTarget, read),
  putStudentLearning: handle(teacherTarget, write),
}
