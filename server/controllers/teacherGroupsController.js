// Teacher groups and students (TCH-010, TCH-011, TCH-012). Groups are `Batch` documents.
const crypto = require('crypto')
const Batch = require('../models/admin/Batch')
const Student = require('../models/admin/Student')
const Subject = require('../models/admin/Subject')
const Parent = require('../models/admin/Parent')
const batchService = require('../services/batchService')
const { audit } = require('../utils/audit')
const { sendMail } = require('../utils/mailer')
const { HttpError, isId, idStr, context, myGroup, canManage, assertManage, usage, assertWithinLimit, handle, appUrl } = require('../services/teacherContext')
const { parentStatusFor, brandingFor, emailShell, escapeHtml } = require('../services/teacherParents')

const COLOR = /^#[0-9a-fA-F]{6}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const clean = (s, n) => String(s ?? '').trim().slice(0, n)

const groupView = (b, ctx) => ({
  _id: b._id, name: b.name, description: b.description, gradeBand: b.gradeBand || '', color: b.color || '', emoji: b.emoji || '',
  status: b.status, archivedAt: b.archivedAt, groupKind: b.groupKind || 'class', maxStudents: b.maxStudents,
  studentCount: (b.studentIds || []).length,
  subjects: (b.subjects || []).map((a) => ({
    _id: a._id, subject: a.subject && a.subject.name ? { _id: a.subject._id, name: a.subject.name, code: a.subject.code } : a.subject,
    teacherIds: a.teacherIds, schedule: a.schedule,
  })),
  createdByMe: idStr(b.createdByTutorId) === idStr(ctx.tutorId),
  canManage: canManage(ctx, b),
  createdAt: b.createdAt,
})

// ── Groups ──────────────────────────────────────────────────────────────────

// GET /groups?archived=1
const listGroups = handle(async (req, res) => {
  const ctx = await context(req)
  const all = await Batch.find({ orgId: ctx.orgId, tutorIds: ctx.tutorId }).populate('subjects.subject', 'name code').sort({ createdAt: 1 })
  const archived = req.query.archived === '1'
  const groups = all.filter((b) => (archived ? b.status !== 'active' : b.status === 'active')).map((b) => groupView(b, ctx))
  const subjects = await Subject.find({ orgId: ctx.orgId, status: 'active' }).select('name code').sort({ name: 1 }).lean()
  res.json({
    success: true, groups, subjects, archivedCount: all.filter((b) => b.status !== 'active').length,
    canCreateGroups: ctx.canCreateGroups, limits: ctx.ent.limits || {}, usage: await usage(ctx.orgId), plan: ctx.ent.plan,
  })
})

async function subjectAssignments(ctx, subjectIds, existing = []) {
  const ids = [...new Set((Array.isArray(subjectIds) ? subjectIds : []).filter(isId).map(String))].slice(0, 12)
  const found = await Subject.find({ _id: { $in: ids }, orgId: ctx.orgId }).select('_id').lean()
  if (found.length !== ids.length) throw new HttpError(400, 'Unknown subject')
  const keep = new Map(existing.map((a) => [idStr(a.subject?._id || a.subject), a]))
  return ids.map((id) => {
    const prev = keep.get(id)
    if (prev) {
      const teacherIds = prev.teacherIds.some((t) => idStr(t) === idStr(ctx.tutorId)) ? prev.teacherIds : [...prev.teacherIds, ctx.tutorId]
      return { _id: prev._id, subject: id, teacherIds, schedule: prev.schedule }
    }
    return { subject: id, teacherIds: [ctx.tutorId], schedule: [] }
  })
}

function readGroupFields(body, { partial }) {
  const out = {}
  if (!partial || body.name !== undefined) {
    out.name = clean(body.name, 80)
    if (!out.name) throw new HttpError(400, 'Give the group a name')
  }
  if (body.description !== undefined) out.description = clean(body.description, 300)
  if (body.gradeBand !== undefined) out.gradeBand = clean(body.gradeBand, 40)
  if (body.emoji !== undefined) out.emoji = [...clean(body.emoji, 16)].slice(0, 2).join('')
  if (body.color !== undefined) {
    if (body.color && !COLOR.test(body.color)) throw new HttpError(400, 'Colour must look like #3d9bff')
    out.color = body.color || ''
  }
  if (body.maxStudents !== undefined) {
    const n = body.maxStudents === null || body.maxStudents === '' ? null : Number(body.maxStudents)
    if (n !== null && (!Number.isInteger(n) || n < 1 || n > 500)) throw new HttpError(400, 'Class size must be between 1 and 500')
    out.maxStudents = n
  }
  return out
}

// GET /groups/:id: one of my groups with its roster and what I may do with it.
const getGroup = handle(async (req, res) => {
  const ctx = await context(req)
  const batch = await myGroup(ctx, req.params.id)
  await batch.populate('subjects.subject', 'name code')
  const students = await Student.find({ _id: { $in: batch.studentIds }, orgId: ctx.orgId }).select('name email grade age status').sort({ name: 1 }).lean()
  const others = await Batch.find({ orgId: ctx.orgId, tutorIds: ctx.tutorId, status: 'active', _id: { $ne: batch._id } }).select('name emoji color').sort({ name: 1 }).lean()
  const subjects = await Subject.find({ orgId: ctx.orgId, status: 'active' }).select('name code').sort({ name: 1 }).lean()
  res.json({
    success: true,
    group: groupView(batch, ctx),
    students: students.map((x) => ({ id: String(x._id), name: x.name, email: x.email || '', grade: x.grade || '', age: x.age, status: x.status })),
    otherGroups: others.map((o) => ({ id: String(o._id), name: o.name, emoji: o.emoji || '', color: o.color || '' })),
    subjects,
    permissions: { canManage: canManage(ctx, batch), canAddNewStudents: ctx.canAddNewStudents, isSolo: ctx.solo },
    tutorId: String(ctx.tutorId),
  })
})

// POST /groups { name, subjectIds[], gradeBand, color, emoji, description, maxStudents }
const createGroup = handle(async (req, res) => {
  const ctx = await context(req)
  if (!ctx.canCreateGroups) throw new HttpError(403, 'Your school has not turned on teacher-created groups. Ask your admin to add the group for you.', { code: 'POLICY_BLOCKED' })
  await assertWithinLimit(ctx, 'groups', 1)
  const fields = readGroupFields(req.body || {}, { partial: false })
  const subjects = await subjectAssignments(ctx, req.body?.subjectIds)
  const batch = await Batch.create({
    ...fields, orgId: ctx.orgId, directTutorIds: [ctx.tutorId], tutorIds: [ctx.tutorId], subjects,
    createdByTutorId: ctx.tutorId, groupKind: 'class', subject: '',
  })
  await batchService.syncBatchDerivedFields(batch._id)
  await batchService.recomputeTutorDerivedFields(ctx.tutorId)
  const fresh = await Batch.findById(batch._id).populate('subjects.subject', 'name code')
  res.status(201).json({ success: true, group: groupView(fresh, ctx) })
})

// PATCH /groups/:id
const updateGroup = handle(async (req, res) => {
  const ctx = await context(req)
  const batch = await myGroup(ctx, req.params.id)
  assertManage(ctx, batch)
  const fields = readGroupFields(req.body || {}, { partial: true })
  if (fields.maxStudents != null && fields.maxStudents < batch.studentIds.length) throw new HttpError(400, `This group already has ${batch.studentIds.length} students`)
  Object.assign(batch, fields)
  if (req.body?.subjectIds !== undefined) batch.subjects = await subjectAssignments(ctx, req.body.subjectIds, batch.subjects)
  await batch.save()
  await batchService.syncBatchDerivedFields(batch._id)
  await batchService.recomputeTutorDerivedFields(ctx.tutorId)
  const fresh = await Batch.findById(batch._id).populate('subjects.subject', 'name code')
  res.json({ success: true, group: groupView(fresh, ctx) })
})

// POST /groups/:id/archive and /restore. Archiving keeps everything; it just hides the group.
const archiveGroup = handle(async (req, res) => {
  const ctx = await context(req)
  const batch = await myGroup(ctx, req.params.id)
  assertManage(ctx, batch)
  batch.status = 'inactive'
  batch.archivedAt = new Date()
  await batch.save()
  await audit(req, 'group.archive', { targetType: 'group', targetId: batch._id, orgId: ctx.orgId, meta: { name: batch.name } })
  res.json({ success: true, group: groupView(batch, ctx) })
})

const restoreGroup = handle(async (req, res) => {
  const ctx = await context(req)
  const batch = await myGroup(ctx, req.params.id)
  assertManage(ctx, batch)
  if (batch.status !== 'active' && batch.groupKind !== 'practice') await assertWithinLimit(ctx, 'groups', 1)
  batch.status = 'active'
  batch.archivedAt = null
  await batch.save()
  res.json({ success: true, group: groupView(batch, ctx) })
})

// ── Join code, QR, invite link (TCH-011) ────────────────────────────────────

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const newCode = () => Array.from(crypto.randomBytes(6), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')

async function assignCode(batch) {
  for (let i = 0; i < 5; i++) {
    batch.joinCode = newCode()
    try { await batch.save(); return batch } catch (err) { if (err.code !== 11000) throw err }
  }
  throw new HttpError(500, 'Could not make a join code, please try again')
}

const joinInfo = (batch) => ({ code: batch.joinCode, enabled: batch.joinEnabled !== false, url: `${appUrl()}/join/${batch.joinCode}`, path: `/join/${batch.joinCode}` })

// GET /groups/:id/join
const getJoin = handle(async (req, res) => {
  const ctx = await context(req)
  const batch = await myGroup(ctx, req.params.id)
  if (!ctx.canAddNewStudents) throw new HttpError(403, 'Your school adds students to groups. Ask your admin.', { code: 'POLICY_BLOCKED' })
  if (!batch.joinCode) await assignCode(batch)
  res.json({ success: true, join: joinInfo(batch) })
})

// POST /groups/:id/join { reset?: true, enabled?: bool }
const updateJoin = handle(async (req, res) => {
  const ctx = await context(req)
  const batch = await myGroup(ctx, req.params.id)
  if (!ctx.canAddNewStudents) throw new HttpError(403, 'Your school adds students to groups. Ask your admin.', { code: 'POLICY_BLOCKED' })
  if (typeof req.body?.enabled === 'boolean') batch.joinEnabled = req.body.enabled
  if (req.body?.reset || !batch.joinCode) await assignCode(batch)
  else await batch.save()
  res.json({ success: true, join: joinInfo(batch) })
})

// ── Roster import: paste or upload CSV, preview (dry run), then apply ───────

// rows: [{ name, email, grade, age, parentEmail, parentName }] (the client parses the CSV).
async function planImport(ctx, batch, rows) {
  if (!Array.isArray(rows) || !rows.length) throw new HttpError(400, 'Add at least one student')
  if (rows.length > 500) throw new HttpError(400, 'Up to 500 students at a time')
  const emails = rows.map((r) => clean(r.email, 120).toLowerCase()).filter(Boolean)
  const existing = await Student.find({ orgId: ctx.orgId, email: { $in: emails } }).lean()
  const byEmail = new Map(existing.map((s) => [s.email, s]))
  const inGroup = new Set(batch.studentIds.map(idStr))
  const seen = new Set()
  const out = rows.map((r, i) => {
    const row = { row: i + 1, name: clean(r.name, 80), email: clean(r.email, 120).toLowerCase(), grade: clean(r.grade, 30), age: r.age === '' || r.age == null ? null : Number(r.age), parentEmail: clean(r.parentEmail, 120).toLowerCase(), parentName: clean(r.parentName, 80) }
    const err = (message) => ({ ...row, status: 'error', message })
    if (!row.name) return err('Name is missing')
    if (row.email && !EMAIL.test(row.email)) return err('Email does not look right')
    if (row.parentEmail && !EMAIL.test(row.parentEmail)) return err('Parent email does not look right')
    if (row.age !== null && (!Number.isInteger(row.age) || row.age < 3 || row.age > 25)) return err('Age must be a whole number from 3 to 25')
    if (row.email) {
      if (seen.has(row.email)) return err('This email appears twice in the list')
      seen.add(row.email)
      const s = byEmail.get(row.email)
      if (s) return { ...row, studentId: String(s._id), status: inGroup.has(String(s._id)) ? 'in_group' : 'existing', message: inGroup.has(String(s._id)) ? 'Already in this group' : 'Already in your workspace: will be added to the group' }
    }
    return { ...row, status: 'new', message: row.email ? 'New student' : 'New student without email: they can sign in once login cards are available' }
  })
  const summary = { new: 0, existing: 0, in_group: 0, error: 0 }
  out.forEach((r) => { summary[r.status]++ })
  return { rows: out, summary }
}

// POST /groups/:id/roster { rows, dryRun, inviteParents }
const importRoster = handle(async (req, res) => {
  const ctx = await context(req)
  const batch = await myGroup(ctx, req.params.id)
  const plan = await planImport(ctx, batch, req.body?.rows)
  const adding = plan.summary.new + plan.summary.existing
  const { new: fresh } = plan.summary
  if (fresh > 0 && !ctx.canAddNewStudents) throw new HttpError(403, 'Your school adds new students. Ask your admin, or only list students already in your school.', { code: 'POLICY_BLOCKED' })

  // Problems the teacher should see in the preview rather than as an error.
  const problems = []
  const max = ctx.ent.limits?.students
  const u = await usage(ctx.orgId)
  if (max != null && u.students + fresh > max) problems.push({ code: 'PLAN_LIMIT', limit: 'students', max, current: u.students, attempted: fresh, message: `Your plan includes up to ${max} students. You have ${u.students}; this would add ${fresh}.` })
  if (batch.maxStudents != null && batch.studentIds.length + adding > batch.maxStudents) problems.push({ code: 'CAPACITY', max: batch.maxStudents, current: batch.studentIds.length, attempted: adding, message: `This group holds ${batch.maxStudents} students.` })

  if (req.body?.dryRun !== false) return res.json({ success: true, dryRun: true, ...plan, problems, usage: u, limits: ctx.ent.limits || {} })
  if (plan.summary.error) throw new HttpError(400, 'Fix the rows marked in red first', { rows: plan.rows })
  const limitProblem = problems.find((p) => p.code === 'PLAN_LIMIT')
  if (limitProblem) throw new HttpError(402, limitProblem.message, { ...limitProblem, plan: ctx.ent.plan })
  const cap = problems.find((p) => p.code === 'CAPACITY')
  if (cap) throw new HttpError(409, cap.message, { capacity: cap })

  const created = []
  for (const r of plan.rows.filter((x) => x.status === 'new')) {
    const s = await Student.create({ name: r.name, email: r.email, grade: r.grade, age: r.age, orgId: ctx.orgId })
    created.push(s)
    r.studentId = String(s._id)
  }
  const ids = plan.rows.filter((r) => r.status === 'new' || r.status === 'existing').map((r) => r.studentId)
  try {
    if (ids.length) await batchService.addStudentsToBatch(batch._id, ids)
  } catch (err) {
    await Student.deleteMany({ _id: { $in: created.map((s) => s._id) } })
    throw err
  }

  let invited = 0
  if (req.body?.inviteParents) {
    const invites = plan.rows.filter((r) => r.parentEmail && r.studentId).map((r) => ({ studentId: r.studentId, email: r.parentEmail, name: r.parentName }))
    const fresh = await Batch.findById(batch._id)
    if (invites.length) invited = (await inviteParentsFor(req, ctx, fresh, invites)).filter((x) => x.status === 'invited').length
  }
  await audit(req, 'roster.import', { targetType: 'group', targetId: batch._id, orgId: ctx.orgId, meta: { created: created.length, added: ids.length, invited } })
  res.json({ success: true, dryRun: false, created: created.length, added: ids.length, invited, ...plan })
})

// POST /groups/:id/students/transfer { studentIds, toGroupId, mode: 'move'|'copy' }
const transferStudents = handle(async (req, res) => {
  const ctx = await context(req)
  const from = await myGroup(ctx, req.params.id)
  const to = await myGroup(ctx, req.body?.toGroupId)
  if (String(from._id) === String(to._id)) throw new HttpError(400, 'Pick a different group')
  const mode = req.body?.mode === 'copy' ? 'copy' : 'move'
  const inFrom = new Set(from.studentIds.map(idStr))
  const ids = [...new Set((req.body?.studentIds || []).map(String))].filter((id) => inFrom.has(id))
  if (!ids.length) throw new HttpError(400, 'Choose students from this group')
  if (mode === 'move' && !canManage(ctx, from) && !ctx.canAddNewStudents) throw new HttpError(403, 'This group is managed by your school admin.')
  await batchService.addStudentsToBatch(to._id, ids)
  if (mode === 'move') for (const id of ids) await batchService.removeStudentFromBatch(from._id, id)
  await audit(req, `roster.${mode}`, { targetType: 'group', targetId: from._id, orgId: ctx.orgId, meta: { to: String(to._id), count: ids.length } })
  res.json({ success: true, mode, count: ids.length })
})

// ── Parents (TCH-012) ───────────────────────────────────────────────────────

// GET /groups/:id/parents: each child with their parents and Linked / Invited / None.
const groupParents = handle(async (req, res) => {
  const ctx = await context(req)
  const batch = await myGroup(ctx, req.params.id)
  const students = await Student.find({ _id: { $in: batch.studentIds }, orgId: ctx.orgId }).select('name email parentIds').sort({ name: 1 }).lean()
  const rows = await parentStatusFor(ctx.orgId, students)
  const counts = { linked: 0, invited: 0, none: 0 }
  rows.forEach((r) => { counts[r.status]++ })
  res.json({ success: true, students: rows, counts })
})

async function inviteParentsFor(req, ctx, batch, invites) {
  const inGroup = new Set(batch.studentIds.map(idStr))
  const students = await Student.find({ _id: { $in: invites.map((i) => i.studentId).filter(isId) }, orgId: ctx.orgId })
  const byId = new Map(students.map((s) => [String(s._id), s]))
  const brand = await brandingFor(ctx)
  const results = []
  for (const inv of invites.slice(0, 200)) {
    const email = clean(inv.email, 120).toLowerCase()
    const student = byId.get(String(inv.studentId))
    if (!student || !inGroup.has(String(student._id))) { results.push({ studentId: inv.studentId, email, status: 'error', message: 'Student not in this group' }); continue }
    if (!EMAIL.test(email)) { results.push({ studentId: inv.studentId, email, status: 'error', message: 'Email does not look right' }); continue }
    let parent = await Parent.findOne({ orgId: ctx.orgId, email })
    if (!parent) parent = new Parent({ orgId: ctx.orgId, email, name: clean(inv.name, 80) || email.split('@')[0], studentIds: [] })
    if (!parent.studentIds.some((id) => idStr(id) === String(student._id))) parent.studentIds.push(student._id)
    parent.invitedAt = new Date()
    parent.invitedByTutorId = ctx.tutorId
    parent.status = 'active'
    await parent.save()
    await Student.updateOne({ _id: student._id }, { $addToSet: { parentIds: parent._id } })

    const link = `${appUrl()}/parent-login`
    const childBit = student.email
      ? `<p>After you sign in, add <b>${escapeHtml(student.name)}</b> with the email <b>${escapeHtml(student.email)}</b>. Because ${escapeHtml(brand.name)} already connected you, the link is confirmed straight away.</p>`
      : `<p>${escapeHtml(student.name)} does not have a sign-in email yet. ${escapeHtml(ctx.tutor.name)} will share how to connect soon.</p>`
    await sendMail({
      to: email,
      kind: 'parent_invite',
      subject: `${ctx.tutor.name} invited you to follow ${student.name}'s learning on Learnigo`,
      html: emailShell(brand, `
        <p>Hello${parent.name ? ` ${escapeHtml(parent.name)}` : ''},</p>
        <p><b>${escapeHtml(ctx.tutor.name)}</b> at <b>${escapeHtml(brand.name)}</b> invited you to see how <b>${escapeHtml(student.name)}</b> is learning in <b>${escapeHtml(batch.name)}</b>: time spent, what is going well and what to practise next.</p>
        <p><a href="${link}" style="display:inline-block;padding:12px 20px;border-radius:12px;background:${brand.color};color:#fff;text-decoration:none;font-weight:600">Sign in as a parent</a></p>
        <p>Use Google with this email address: <b>${escapeHtml(email)}</b>.</p>
        ${childBit}`),
    })
    results.push({ studentId: String(student._id), email, status: 'invited' })
  }
  return results
}

// POST /groups/:id/parents/invite { invites: [{ studentId, email, name }] }
const inviteParents = handle(async (req, res) => {
  const ctx = await context(req)
  const batch = await myGroup(ctx, req.params.id)
  const invites = Array.isArray(req.body?.invites) ? req.body.invites : []
  if (!invites.length) throw new HttpError(400, 'Add at least one parent email')
  if (invites.length > 200) throw new HttpError(400, 'Up to 200 invites at a time')
  const results = await inviteParentsFor(req, ctx, batch, invites)
  const sent = results.filter((r) => r.status === 'invited').length
  await audit(req, 'parents.invite', { targetType: 'group', targetId: batch._id, orgId: ctx.orgId, meta: { sent, failed: results.length - sent } })
  res.json({ success: true, sent, results })
})

module.exports = {
  listGroups, getGroup, createGroup, updateGroup, archiveGroup, restoreGroup,
  getJoin, updateJoin, importRoster, transferStudents, groupParents, inviteParents,
  planImport, newCode,
}
