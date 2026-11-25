// Learning together, for the teacher (G-511, G-512, G-530, G-532): team matches and class
// quests in MY groups, and what my learners like to watch. Every handler resolves the
// teacher's workspace first and only touches groups they teach there (anything else is 404).
const Student = require('../models/admin/Student')
const Batch = require('../models/admin/Batch')
const TeamMatch = require('../models/social/TeamMatch')
const { context, myGroup, handle, HttpError, isId } = require('../services/teacherContext')
const teams = require('../services/social/teams')
const interests = require('../services/shorts/interests')
const { audit } = require('../utils/audit')

const lower = (s) => String(s || '').trim().toLowerCase()

// Active students of a group, in name order (those without an email cannot take part).
const studentsOf = (ctx, batch) => Student.find({ _id: { $in: batch.studentIds }, orgId: ctx.orgId, status: 'active' }).select('name email').sort({ name: 1 }).lean()

// The school can switch team matches off (OrgPolicy.competitions); a solo tutor decides alone.
function allowed(ctx) {
  if (!ctx.solo && ctx.policy.competitions === 'off') throw new HttpError(403, 'Your school has turned team matches off. Ask your school admin.', { code: 'POLICY_BLOCKED', policy: 'competitions' })
}

// One of MY matches: in my workspace, in a group I teach.
async function myMatch(ctx, id) {
  if (!isId(id)) throw new HttpError(404, 'Not found')
  const m = await TeamMatch.findOne({ _id: id, orgId: ctx.orgId })
  if (!m) throw new HttpError(404, 'Not found')
  const batch = await myGroup(ctx, m.batchId).catch(() => null)
  if (!batch) throw new HttpError(404, 'Not found')
  return { m, batch }
}

// GET /groups/:id/competitions
const list = handle(async (req, res) => {
  const ctx = await context(req)
  const batch = await myGroup(ctx, req.params.id)
  const enabled = ctx.solo || ctx.policy.competitions !== 'off'
  const students = await studentsOf(ctx, batch)
  const canJoin = students.filter((s) => s.email).length
  if (!enabled) return res.json({ success: true, enabled, running: [], ended: [], learners: students.length, canJoin })
  const rows = await TeamMatch.find({ batchId: batch._id }).sort({ status: 1, endsAt: -1 }).limit(20)
  const out = []
  for (let m of rows) { m = await teams.settleIfDue(m); out.push(await teams.forTeacher(m, students)) }
  res.json({ success: true, enabled, running: out.filter((m) => m.status === 'active'), ended: out.filter((m) => m.status === 'ended'), learners: students.length, canJoin })
})

// POST /groups/:id/competitions { title, kind: quest|teams, teams?, days?, subject?, starsPerLearnerPerDay? }
const create = handle(async (req, res) => {
  const ctx = await context(req)
  allowed(ctx)
  const batch = await myGroup(ctx, req.params.id)
  if (batch.archivedAt) throw new HttpError(409, 'This group is archived.')
  const students = await studentsOf(ctx, batch)
  const m = await teams.create(ctx, batch, students, req.body || {})
  await audit(req, 'competition.start', { targetType: 'competition', targetId: String(m._id), orgId: ctx.orgId, meta: { group: String(batch._id), kind: m.kind, teams: m.teams.length, learners: m.emails.length } })
  res.status(201).json({ success: true, competition: await teams.forTeacher(m, students) })
})

// GET /competitions/:cid
const get = handle(async (req, res) => {
  const ctx = await context(req)
  let { m, batch } = await myMatch(ctx, req.params.cid)
  m = await teams.settleIfDue(m)
  res.json({ success: true, competition: await teams.forTeacher(m, await studentsOf(ctx, batch)), group: { id: String(batch._id), name: batch.name } })
})

// POST /competitions/:cid/end: the ceremony, now.
const end = handle(async (req, res) => {
  const ctx = await context(req)
  const { m, batch } = await myMatch(ctx, req.params.cid)
  const ended = await teams.end(m, 'teacher')
  await audit(req, 'competition.end', { targetType: 'competition', targetId: String(m._id), orgId: ctx.orgId, meta: { group: String(batch._id) } })
  res.json({ success: true, competition: await teams.forTeacher(ended, await studentsOf(ctx, batch)) })
})

// GET /groups/:id/interests: what this group likes to watch (themes, never a list of children).
const groupInterests = handle(async (req, res) => {
  const ctx = await context(req)
  const batch = await myGroup(ctx, req.params.id)
  const students = await studentsOf(ctx, batch)
  res.json({ success: true, interests: await interests.forGroup(students.map((s) => lower(s.email)).filter(Boolean)) })
})

// GET /students/:id/interests: one of MY students.
const studentInterests = handle(async (req, res) => {
  const ctx = await context(req)
  if (!isId(req.params.id)) throw new HttpError(404, 'Student not found')
  const mine = await Batch.exists({ orgId: ctx.orgId, tutorIds: ctx.tutorId, studentIds: req.params.id })
  const student = mine ? await Student.findOne({ _id: req.params.id, orgId: ctx.orgId }).select('name email').lean() : null
  if (!student) throw new HttpError(404, 'Student not found')
  res.json({ success: true, interests: student.email ? await interests.forLearner(student.email) : null })
})

module.exports = { list, create, get, end, groupInterests, studentInterests }
