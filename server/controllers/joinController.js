// Public join flow (TCH-011): /join/:code. Anyone may look up what a code joins; joining
// needs a signed-in student (joins themselves) or parent (joins one of their VERIFIED children).
// Also the optional public tutor page (TCH-082).
const Batch = require('../models/admin/Batch')
const Student = require('../models/admin/Student')
const Parent = require('../models/admin/Parent')
const Tutor = require('../models/admin/Tutor')
const Organization = require('../models/admin/Organization')
const TeacherProfile = require('../models/admin/TeacherProfile')
const Child = require('../models/Child')
const batchService = require('../services/batchService')
const { childAccess } = require('../utils/guardianLink')
const { entitlementsFor } = require('../utils/entitlements')
const { getOrgPolicy } = require('../utils/orgPolicy')
const { notify } = require('../utils/notify')
const { audit } = require('../utils/audit')
const { HttpError, handle, idStr } = require('../services/teacherContext')

const normCode = (c) => String(c || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)

// A light per-IP limit on code lookups so codes can't be guessed quickly.
const hits = new Map()
function rateLimit(req, res, next) {
  const key = req.ip || 'x'
  const now = Date.now()
  const h = (hits.get(key) || []).filter((t) => now - t < 60000)
  h.push(now)
  hits.set(key, h)
  if (hits.size > 5000) hits.clear()
  if (h.length > 40) return res.status(429).json({ success: false, message: 'Too many tries. Wait a minute and try again.' })
  next()
}

async function branding(org) {
  const ent = await entitlementsFor({ role: 'teacher', orgId: String(org._id) })
  const branded = ent.modules.includes('reports.branded')
  return { name: org.name, kind: org.kind || 'institute', logoUrl: branded ? org.logoUrl || '' : '', brandColor: branded ? org.brandColor || '' : '' }
}

async function groupForCode(code) {
  const c = normCode(code)
  if (c.length < 4) throw new HttpError(404, "We couldn't find a group with that code. Check the code with your teacher.")
  const batch = await Batch.findOne({ joinCode: c, status: 'active' })
  if (!batch || batch.joinEnabled === false) throw new HttpError(404, "We couldn't find a group with that code. Check the code with your teacher.")
  const org = await Organization.findById(batch.orgId).lean()
  if (!org || org.status !== 'approved') throw new HttpError(404, "We couldn't find a group with that code. Check the code with your teacher.")
  if (org.kind !== 'solo' && !(await getOrgPolicy(org._id)).teachersCreateGroups) throw new HttpError(403, 'Joining with a code is turned off at this school. Your teacher or school admin can add you.')
  return { batch, org }
}

// GET /api/join/:code
const lookup = handle(async (req, res) => {
  const { batch, org } = await groupForCode(req.params.code)
  const teacher = await Tutor.findById(batch.createdByTutorId || batch.tutorIds[0]).select('name').lean()
  res.json({
    success: true,
    group: { name: batch.name, emoji: batch.emoji || '', color: batch.color || '', gradeBand: batch.gradeBand || '', full: batch.maxStudents != null && batch.studentIds.length >= batch.maxStudents },
    org: await branding(org),
    teacher: teacher ? { name: teacher.name } : null,
  })
})

// POST /api/join/:code { childId? } (signed in)
const join = handle(async (req, res) => {
  const { batch, org } = await groupForCode(req.params.code)
  const actor = req.actor
  let learner
  if (actor.role === 'student') {
    learner = { email: String(actor.email || '').toLowerCase(), name: actor.name || String(actor.email).split('@')[0] }
  } else if (actor.role === 'parent') {
    const child = req.body?.childId ? await Child.findOne({ _id: req.body.childId, parentId: actor.id }).catch(() => null) : null
    if (!child) throw new HttpError(400, 'Choose which of your children is joining')
    const access = childAccess(child)
    if (!access.ok) throw new HttpError(access.status, access.message, { code: access.code })
    learner = { email: child.email, name: child.name, child }
  } else {
    throw new HttpError(403, 'Sign in as a student or a parent to join a group.')
  }
  if (!learner.email) throw new HttpError(400, 'This learner has no sign-in email yet.')

  let student = await Student.findOne({ orgId: batch.orgId, email: learner.email })
  if (student && batch.studentIds.some((id) => idStr(id) === idStr(student._id))) {
    return res.json({ success: true, alreadyMember: true, group: { name: batch.name }, org: { name: org.name } })
  }
  if (batch.maxStudents != null && batch.studentIds.length >= batch.maxStudents) throw new HttpError(409, 'This group is full. Ask your teacher to make room.')

  let created = false
  if (!student || student.status !== 'active') {
    const ent = await entitlementsFor({ role: 'teacher', orgId: String(batch.orgId) })
    const max = ent.limits?.students
    if (max != null && (await Student.countDocuments({ orgId: batch.orgId, status: 'active' })) >= max) {
      throw new HttpError(402, 'This class is full on its current plan. Let your teacher know.', { code: 'PLAN_LIMIT', limit: 'students' })
    }
    if (!student) { student = await Student.create({ name: learner.name, email: learner.email, orgId: batch.orgId }); created = true }
    else { student.status = 'active'; await student.save() }
  }
  try {
    await batchService.addStudentsToBatch(batch._id, [student._id])
  } catch (err) {
    if (created) await Student.deleteOne({ _id: student._id })
    throw err
  }

  // A parent who joined their child is that child's parent in this workspace, already linked.
  if (actor.role === 'parent') {
    let p = await Parent.findOne({ orgId: batch.orgId, email: String(actor.email).toLowerCase() })
    if (!p) p = new Parent({ orgId: batch.orgId, email: actor.email, name: actor.name || String(actor.email).split('@')[0], studentIds: [], consentGiven: true })
    if (!p.studentIds.some((id) => idStr(id) === idStr(student._id))) p.studentIds.push(student._id)
    await p.save()
    await Student.updateOne({ _id: student._id }, { $addToSet: { parentIds: p._id } })
  }

  await notify(batch.tutorIds.map((id) => ({ role: 'teacher', id: String(id) })), {
    kind: 'group.joined', title: `${learner.name} joined ${batch.name}`, body: actor.role === 'parent' ? 'Added by their parent with your join code.' : 'Joined with your join code.', link: '/teacher-dashboard',
  })
  await audit(req, 'group.join', { targetType: 'group', targetId: batch._id, orgId: batch.orgId, meta: { studentId: String(student._id), via: actor.role } })
  res.status(201).json({ success: true, joined: true, group: { name: batch.name }, org: { name: org.name } })
})

// GET /api/join/tutor/:slug: a tutor's public page, only when they published it.
const tutorPage = handle(async (req, res) => {
  const slug = String(req.params.slug || '').toLowerCase().slice(0, 40)
  const profile = await TeacherProfile.findOne({ slug, publicEnabled: true }).lean()
  if (!profile) throw new HttpError(404, 'Page not found')
  const [tutor, org] = await Promise.all([Tutor.findById(profile.tutorId).select('name photoURL status authStatus').lean(), Organization.findById(profile.orgId).lean()])
  if (!tutor || tutor.authStatus === 'disabled' || !org || org.kind !== 'solo' || org.status !== 'approved') throw new HttpError(404, 'Page not found')
  let joinCode = null
  if (profile.publicGroupId) {
    const g = await Batch.findOne({ _id: profile.publicGroupId, orgId: org._id, status: 'active' }).select('joinCode joinEnabled').lean()
    if (g?.joinCode && g.joinEnabled !== false) joinCode = g.joinCode
  }
  res.json({
    success: true,
    tutor: { name: tutor.name, photoURL: tutor.photoURL || '' },
    org: await branding(org),
    profile: { headline: profile.headline, bio: profile.bio, subjects: profile.subjects, grades: profile.grades, country: profile.country, testimonials: (profile.testimonials || []).map((t) => ({ quote: t.quote, by: t.by })) },
    joinCode,
  })
})

module.exports = { lookup, join, tutorPage, rateLimit, normCode }
