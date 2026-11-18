// Who is this teacher, in which workspace, and what may they do there? Shared by the
// teacher "classes and performance" routes (TCH-010..013, TCH-050..056, TCH-080..082).
const mongoose = require('mongoose')
const Tutor = require('../models/admin/Tutor')
const Batch = require('../models/admin/Batch')
const Student = require('../models/admin/Student')
const Organization = require('../models/admin/Organization')
const { entitlementsFor } = require('../utils/entitlements')
const { getOrgPolicy } = require('../utils/orgPolicy')
const { PLANS } = require('../config/plans')

class HttpError extends Error {
  constructor(status, message, extra = {}) { super(message); this.status = status; Object.assign(this, extra) }
}

const isId = (v) => mongoose.isValidObjectId(v) && String(v).length === 24
const idStr = (v) => (v == null ? v : String(v))

// The teacher middleware gives req.teacher (from the token); shared helpers want req.actor.
function teacherActor(req, res, next) {
  const t = req.teacher
  req.actor = { role: 'teacher', id: String(t.id), email: t.email, name: t.name, orgId: t.orgId ? String(t.orgId) : null, uid: t.uid }
  next()
}

// Loaded once per request: the Tutor row, the workspace, plan and policy.
async function context(req) {
  if (req.teacherCtx) return req.teacherCtx
  const tutor = await Tutor.findOne({ _id: req.teacher.id, orgId: req.teacher.orgId })
  if (!tutor || tutor.authStatus === 'disabled') throw new HttpError(403, 'Your teacher account is not active in this workspace.')
  const [org, ent, policy] = await Promise.all([
    Organization.findById(tutor.orgId).lean(),
    entitlementsFor(req.actor),
    getOrgPolicy(tutor.orgId),
  ])
  if (!org) throw new HttpError(404, 'Workspace not found')
  const solo = org.kind === 'solo'
  req.teacherCtx = {
    tutor, org, ent, policy, solo,
    orgId: org._id,
    tutorId: tutor._id,
    // Solo tutors run everything. School teachers create groups and add new students only
    // when the school allows it (FND-022 teachersCreateGroups).
    canCreateGroups: solo || !!policy.teachersCreateGroups,
    canAddNewStudents: solo || !!policy.teachersCreateGroups,
  }
  return req.teacherCtx
}

// A group this teacher teaches, in this workspace. Anything else is a 404 (never 403, so
// group ids in other schools or of other teachers reveal nothing).
async function myGroup(ctx, id) {
  if (!isId(id)) throw new HttpError(404, 'Group not found')
  const batch = await Batch.findOne({ _id: id, orgId: ctx.orgId, tutorIds: ctx.tutorId })
  if (!batch) throw new HttpError(404, 'Group not found')
  return batch
}

// Rename, recolour, archive: Solo tutors for any group they teach; school teachers only for
// groups they created themselves (admin-made groups stay the admin's).
const canManage = (ctx, batch) => ctx.solo || idStr(batch.createdByTutorId) === idStr(ctx.tutorId)

function assertManage(ctx, batch) {
  if (!canManage(ctx, batch)) throw new HttpError(403, 'This group is managed by your school admin.')
}

async function myGroups(ctx, { includeArchived = false } = {}) {
  const filter = { orgId: ctx.orgId, tutorIds: ctx.tutorId }
  if (!includeArchived) filter.status = 'active'
  return Batch.find(filter).sort({ createdAt: 1 })
}

// FND-031: usage against the plan's limits. Practice groups (TCH-055) are temporary and don't count.
async function usage(orgId) {
  const [groups, students] = await Promise.all([
    Batch.countDocuments({ orgId, status: 'active', groupKind: { $ne: 'practice' } }),
    Student.countDocuments({ orgId, status: 'active' }),
  ])
  return { groups, students }
}

const LIMIT_WORDS = { groups: 'groups', students: 'students' }

// Throws a friendly 402 when adding `adding` more would pass the plan's limit.
async function assertWithinLimit(ctx, key, adding = 1) {
  const max = ctx.ent.limits?.[key]
  if (max == null || adding <= 0) return
  const current = (await usage(ctx.orgId))[key]
  if (current + adding > max) {
    const label = PLANS[ctx.ent.plan]?.label || ctx.ent.plan
    throw new HttpError(402, `${label} includes up to ${max} ${LIMIT_WORDS[key] || key}. You have ${current}. Upgrade to add more.`, {
      code: 'PLAN_LIMIT', limit: key, max, current, attempted: adding, plan: ctx.ent.plan,
    })
  }
}

// Express glue: async handler that turns HttpError/ServiceError into JSON.
const handle = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next)
  } catch (err) {
    if (err.status || err.statusCode) {
      const { status, statusCode, message, ...extra } = err
      return res.status(status || statusCode).json({ success: false, message, ...JSON.parse(JSON.stringify(extra)) })
    }
    if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ success: false, message: err.message })
    console.error('teacher route error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const safeTz = (tz) => {
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz || 'UTC' }); return tz || 'UTC' } catch { return 'UTC' }
}

const appUrl = () => (process.env.PUBLIC_APP_URL || String(process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0]).replace(/\/$/, '')

module.exports = { HttpError, isId, idStr, teacherActor, context, myGroup, myGroups, canManage, assertManage, usage, assertWithinLimit, handle, safeTz, appUrl }
