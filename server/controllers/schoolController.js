// The school's structure and people (ADM-010..012, ADM-020..025, ADM-023).
// Every handler runs after adminAuth + orgContext + permit(...) (routes/adminSchool.js),
// so req.org is the caller's own school and req.staff limits staff to their units.
const mongoose = require('mongoose')
const OrgUnit = require('../models/admin/OrgUnit')
const AcademicYear = require('../models/admin/AcademicYear')
const OrgStaff = require('../models/admin/OrgStaff')
const StudentMove = require('../models/admin/StudentMove')
const ParentInvite = require('../models/admin/ParentInvite')
const ImportSession = require('../models/admin/ImportSession')
const Student = require('../models/admin/Student')
const Parent = require('../models/admin/Parent')
const Tutor = require('../models/admin/Tutor')
const Batch = require('../models/admin/Batch')
const tree = require('../utils/orgUnits')
const roster = require('../utils/rosterImport')
const { allowedUnits, studentInScope, can, PERMS, ROLE_LABELS } = require('../utils/orgAccess')
const { seatInfo, assertSeats } = require('../utils/seats')
const { cleanYear } = require('../utils/schoolCalendar')
const { entitlementsFor } = require('../utils/entitlements')
const { audit } = require('../utils/audit')
const { sendMail } = require('../utils/mailer')
const { linkedParentEmails } = require('../utils/parentLinks')
const q = require('../analytics/queries')

const { validId } = tree
const lower = (s) => String(s || '').trim().toLowerCase()
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const h = (fn) => async (req, res) => {
  try { await fn(req, res) } catch (err) {
    const status = err.status || err.statusCode
    if (status) return res.status(status).json({ success: false, message: err.message, ...(typeof err.code === 'string' ? { code: err.code } : {}) })
    console.error('school error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
const bad = (message, status = 400, code) => Object.assign(new Error(message), { status, code })
const treeOn = async (req) => (await entitlementsFor(req.actor)).modules.includes('org.tree')

// ── Who am I here (the client hides what the role can't do) ───────────────────
const access = h(async (req, res) => {
  const ent = await entitlementsFor(req.actor)
  const role = req.actor.role === 'admin' ? 'admin' : req.staff.role
  res.json({
    success: true, role, roleLabel: ROLE_LABELS[role],
    perms: role === 'admin' ? ['*'] : PERMS[role], unitIds: req.staff?.unitIds || [], subjects: req.staff?.subjects || [],
    modules: ent.modules, plan: ent.plan, kind: ent.kind,
    org: { id: String(req.org._id), name: req.org.name, status: req.org.status, logoUrl: req.org.logoUrl, kind: req.org.kind },
  })
})

// ── Tree ──────────────────────────────────────────────────────────────────────

// The tree with counts and a 14-day engagement health bar per node (ADM-010/011).
const getTree = h(async (req, res) => {
  const structure = await tree.loadStructure(req.org._id)
  const allowed = await allowedUnits(req)
  const counts = tree.unitCounts(structure)
  const range = q.parseRange({ tz: req.query.tz, cmp: 'none', from: q.addDays(q.todayIn(req.query.tz || 'UTC'), -13) })
  const allEmails = [...new Set(Object.values(counts).flatMap((c) => c.emails))]
  const per = await q.perEmailTotals(allEmails, range.from, range.to)
  const health = Object.fromEntries(q.rollupGroups(Object.entries(counts).map(([key, c]) => ({ key, emails: c.emails })), per, range.days).map((r) => [r.key, { engagement: r.engagement, activePct: r.activePct }]))
  let units = structure.units
  if (allowed) units = units.filter((u) => allowed.has(String(u._id)))
  const nodes = units.map((u) => ({ ...u, counts: { students: counts[String(u._id)].students, teachers: counts[String(u._id)].teachers, groups: counts[String(u._id)].groups }, health: health[String(u._id)] }))
  // Staff see their own subtrees as roots.
  const roots = tree.buildTree(nodes.map((n) => (allowed && n.parentId && !allowed.has(String(n.parentId)) ? { ...n, parentId: null } : n)))
  const unplaced = allowed ? null : {
    students: structure.students.filter((s) => !s.unitId).length,
    groups: structure.batches.filter((b) => !b.unitId && !b.archivedAt).length,
  }
  res.json({ success: true, tree: roots, unplaced, range: { from: range.from, to: range.to }, canEdit: req.actor.role === 'admin' })
})

const createUnit = h(async (req, res) => {
  const unit = await tree.createUnit(req.org._id, req.body || {})
  await audit(req, 'unit.create', { targetType: 'unit', targetId: unit._id, orgId: req.org._id, meta: { name: unit.name, type: unit.type } })
  res.status(201).json({ success: true, unit })
})

const bulkCreateUnits = h(async (req, res) => {
  const created = await tree.bulkCreate(req.org._id, { parentId: req.body?.parentId || null, spec: req.body?.spec })
  await audit(req, 'unit.bulk_create', { targetType: 'unit', orgId: req.org._id, meta: { spec: String(req.body?.spec || '').slice(0, 100), created: created.length } })
  res.status(201).json({ success: true, created: created.length, units: created })
})

const updateUnit = h(async (req, res) => {
  const { name, parentId, order, subject } = req.body || {}
  let unit
  if (parentId !== undefined || order !== undefined) unit = await tree.moveUnit(req.org._id, req.params.id, { parentId: parentId || null, order })
  if (name !== undefined) unit = await tree.renameUnit(req.org._id, req.params.id, name)
  if (subject !== undefined) { unit = await tree.getUnit(req.org._id, req.params.id); if (!unit) throw bad('Unit not found', 404); unit.subject = lower(subject).slice(0, 40); await unit.save() }
  if (!unit) throw bad('Nothing to change')
  await audit(req, 'unit.update', { targetType: 'unit', targetId: req.params.id, orgId: req.org._id, meta: { name, parentId, order } })
  res.json({ success: true, unit })
})

const deleteUnit = h(async (req, res) => {
  const out = await tree.deleteUnit(req.org._id, req.params.id)
  await audit(req, 'unit.delete', { targetType: 'unit', targetId: req.params.id, orgId: req.org._id })
  res.json({ success: true, ...out })
})

// Students, teachers and groups in one unit's subtree (ADM-011).
const unitPeople = h(async (req, res) => {
  const structure = await tree.loadStructure(req.org._id)
  const allowed = await allowedUnits(req)
  const unit = structure.units.find((u) => String(u._id) === String(req.params.id))
  if (!unit || (allowed && !allowed.has(String(unit._id)))) throw bad('Unit not found', 404)
  const m = tree.membersOf(structure, tree.subtreeIdSet(structure.units, [unit._id]))
  const label = (id) => (id ? tree.unitLabel(structure.units, id) : '')
  res.json({
    success: true,
    unit: { ...unit, label: label(unit._id) },
    students: m.students.map((s) => ({ _id: s._id, name: s.name, email: s.email, unitId: s.unitId, unit: label(s.unitId) })),
    teachers: m.tutors.map((t) => ({ _id: t._id, name: t.name, email: t.email, lastLoginAt: t.lastLoginAt })),
    groups: m.batches.map((b) => ({ _id: b._id, name: b.name, students: (b.studentIds || []).length, archived: Boolean(b.archivedAt) })),
  })
})

// Put students, groups or teachers into a unit.
const assignToUnit = h(async (req, res) => {
  const unit = await tree.getUnit(req.org._id, req.params.id)
  const allowed = await allowedUnits(req)
  if (!unit || (allowed && !allowed.has(String(unit._id)))) throw bad('Unit not found', 404)
  const ids = (list) => (Array.isArray(list) ? list.filter(validId).slice(0, 2000) : [])
  const { studentIds, batchIds, tutorIds } = req.body || {}
  const out = { students: 0, groups: 0, teachers: 0 }
  if (ids(studentIds).length) {
    if (!can(req, 'people.move')) throw bad("Your role can't move students.", 403)
    const students = await Student.find({ _id: { $in: ids(studentIds) }, orgId: req.org._id }).lean()
    for (const s of students) {
      if (!(await studentInScope(req, s))) continue
      if (String(s.unitId || '') === String(unit._id)) continue
      await Student.updateOne({ _id: s._id }, { $set: { unitId: unit._id } })
      await StudentMove.create({ orgId: req.org._id, studentId: s._id, kind: 'move', fromUnitId: s.unitId || null, toUnitId: unit._id, by: req.actor.email })
      out.students++
    }
  }
  if (ids(batchIds).length || ids(tutorIds).length) {
    if (!can(req, 'people.write')) throw bad("Your role can't change groups or teachers.", 403)
    out.groups = (await Batch.updateMany({ _id: { $in: ids(batchIds) }, orgId: req.org._id }, { $set: { unitId: unit._id } })).modifiedCount
    out.teachers = (await Tutor.updateMany({ _id: { $in: ids(tutorIds) }, orgId: req.org._id }, { $addToSet: { unitIds: unit._id } })).modifiedCount
  }
  if (req.body?.removeTutorIds?.length) {
    if (!can(req, 'people.write')) throw bad("Your role can't change teachers.", 403)
    await Tutor.updateMany({ _id: { $in: ids(req.body.removeTutorIds) }, orgId: req.org._id }, { $pull: { unitIds: unit._id } })
  }
  await audit(req, 'unit.assign', { targetType: 'unit', targetId: unit._id, orgId: req.org._id, meta: out })
  res.json({ success: true, ...out })
})

// ── Academic years and promotion (ADM-012 / FND-018) ───────────────────────────

const listYears = h(async (req, res) => {
  const years = await AcademicYear.find({ orgId: req.org._id }).sort({ start: -1 }).lean()
  res.json({ success: true, years })
})

const createYear = h(async (req, res) => {
  const c = cleanYear(req.body)
  if (c.error) throw bad(c.error)
  const overlap = await AcademicYear.exists({ orgId: req.org._id, start: { $lte: c.value.end }, end: { $gte: c.value.start } })
  if (overlap) throw bad('This year overlaps another academic year.', 409)
  const first = !(await AcademicYear.exists({ orgId: req.org._id }))
  const year = await AcademicYear.create({ ...c.value, orgId: req.org._id, status: first ? 'current' : 'planning' })
  await audit(req, 'year.create', { targetType: 'year', targetId: year._id, orgId: req.org._id, meta: { name: year.name } })
  res.status(201).json({ success: true, year })
})

const updateYear = h(async (req, res) => {
  const year = validId(req.params.id) && await AcademicYear.findOne({ _id: req.params.id, orgId: req.org._id })
  if (!year) throw bad('Year not found', 404)
  const c = cleanYear({ name: year.name, start: year.start, end: year.end, terms: year.terms, events: year.events, ...req.body })
  if (c.error) throw bad(c.error)
  const overlap = await AcademicYear.exists({ orgId: req.org._id, _id: { $ne: year._id }, start: { $lte: c.value.end }, end: { $gte: c.value.start } })
  if (overlap) throw bad('This year overlaps another academic year.', 409)
  Object.assign(year, c.value)
  if (req.body?.status === 'current') {
    await AcademicYear.updateMany({ orgId: req.org._id, status: 'current', _id: { $ne: year._id } }, { $set: { status: 'planning' } })
    year.status = 'current'
  }
  await year.save()
  await audit(req, 'year.update', { targetType: 'year', targetId: year._id, orgId: req.org._id })
  res.json({ success: true, year })
})

// Suggested mapping: section "4A" of Grade 4 -> section "5A" of Grade 5; the top grade leaves.
function suggestMapping(units) {
  const grades = units.filter((u) => u.type === 'grade').map((g) => ({ ...g, number: Number(/(\d{1,2})/.exec(g.name)?.[1]) })).filter((g) => g.number)
  const sections = units.filter((u) => u.type === 'section')
  const out = []
  const top = Math.max(...grades.map((g) => g.number), -Infinity)
  for (const g of grades) {
    const nexts = grades.filter((x) => x.number === g.number + 1)
    const next = nexts.find((x) => String(x.parentId || '') === String(g.parentId || '')) || nexts[0]
    for (const s of sections.filter((x) => String(x.parentId) === String(g._id))) {
      const letter = s.name.replace(/^\d+\s*/, '')
      const target = next && sections.find((x) => String(x.parentId) === String(next._id) && x.name.replace(/^\d+\s*/, '').toLowerCase() === letter.toLowerCase())
      out.push({ fromUnitId: String(s._id), from: `${g.name} › ${s.name}`, toUnitId: target ? String(target._id) : null, to: target ? `${next.name} › ${target.name}` : null, action: g.number === top ? 'leave' : target ? 'promote' : 'choose' })
    }
  }
  return out.sort((a, b) => a.from.localeCompare(b.from, undefined, { numeric: true }))
}

const promotionSuggest = h(async (req, res) => {
  const units = await tree.loadUnits(req.org._id)
  const years = await AcademicYear.find({ orgId: req.org._id }).sort({ start: 1 }).lean()
  res.json({ success: true, mapping: suggestMapping(units), years })
})

// Builds the promotion plan; the same function runs for the preview and the real thing.
async function promotionPlan(req) {
  const { mapping = [], exceptions = [], toYearId } = req.body || {}
  const units = await tree.loadUnits(req.org._id)
  const unitIds = new Set(units.map((u) => String(u._id)))
  if (toYearId && !(validId(toYearId) && await AcademicYear.exists({ _id: toYearId, orgId: req.org._id }))) throw bad('Choose the new academic year.', 404)
  const map = new Map()
  for (const m of Array.isArray(mapping) ? mapping : []) {
    if (!unitIds.has(String(m.fromUnitId))) throw bad('A section in the plan is not part of your school.', 404)
    if (m.action === 'promote' && !unitIds.has(String(m.toUnitId))) throw bad('Choose where each section goes.')
    map.set(String(m.fromUnitId), m)
  }
  const exc = new Map((Array.isArray(exceptions) ? exceptions : []).filter((e) => validId(e.studentId)).map((e) => [String(e.studentId), e]))
  const students = await Student.find({ orgId: req.org._id, status: 'active', unitId: { $in: [...map.keys()] } }).select('name unitId batchIds').lean()
  const rows = students.map((s) => {
    const m = map.get(String(s.unitId))
    const e = exc.get(String(s._id))
    let action = e?.action || (m.action === 'leave' ? 'leave' : m.action === 'promote' ? 'promote' : 'stay')
    let toUnitId = action === 'promote' ? m.toUnitId : action === 'move' ? e?.toUnitId : action === 'repeat' ? String(s.unitId) : null
    if ((action === 'move' || action === 'promote') && !unitIds.has(String(toUnitId))) { action = 'stay'; toUnitId = null }
    return { studentId: String(s._id), name: s.name, fromUnitId: String(s.unitId), from: tree.unitLabel(units, s.unitId), action, toUnitId, to: toUnitId ? tree.unitLabel(units, toUnitId) : '' }
  })
  const summary = rows.reduce((acc, r) => { acc[r.action] = (acc[r.action] || 0) + 1; return acc }, {})
  return { rows, summary, toYearId }
}

const promotionPreview = h(async (req, res) => {
  const plan = await promotionPlan(req)
  const groups = await Batch.countDocuments({ orgId: req.org._id, archivedAt: null, ...(req.body?.fromYearId && validId(req.body.fromYearId) ? { yearId: req.body.fromYearId } : {}) })
  res.json({ success: true, ...plan, groupsToArchive: req.body?.archiveGroups ? groups : 0 })
})

const promotionApply = h(async (req, res) => {
  const plan = await promotionPlan(req)
  const now = new Date()
  const by = req.actor.email
  const moves = []
  for (const r of plan.rows) {
    if (r.action === 'stay') continue
    if (r.action === 'leave') {
      await Student.updateOne({ _id: r.studentId }, { $set: { status: 'inactive', leftAt: now, leaveReason: 'Left at the end of the year' } })
    } else if (r.action !== 'repeat') {
      await Student.updateOne({ _id: r.studentId }, { $set: { unitId: r.toUnitId } })
    }
    moves.push({ orgId: req.org._id, studentId: r.studentId, kind: r.action === 'move' ? 'move' : r.action, fromUnitId: r.fromUnitId, toUnitId: r.toUnitId, yearId: plan.toYearId || null, reason: 'Promotion', by, at: now })
  }
  if (moves.length) await StudentMove.insertMany(moves)
  let archived = 0
  if (req.body?.archiveGroups) {
    const filter = { orgId: req.org._id, archivedAt: null, ...(req.body.fromYearId && validId(req.body.fromYearId) ? { yearId: req.body.fromYearId } : {}) }
    archived = (await Batch.updateMany(filter, { $set: { archivedAt: now, status: 'inactive' } })).modifiedCount
  }
  if (plan.toYearId) {
    await AcademicYear.updateMany({ orgId: req.org._id, status: 'current', _id: { $ne: plan.toYearId } }, { $set: { status: 'archived' } })
    await AcademicYear.updateOne({ _id: plan.toYearId }, { $set: { status: 'current', promotedAt: now } })
  }
  await audit(req, 'year.promote', { targetType: 'year', targetId: plan.toYearId || '', orgId: req.org._id, meta: { ...plan.summary, archived } })
  res.json({ success: true, summary: plan.summary, archived })
})

// ── People list (scoped) ──────────────────────────────────────────────────────

const listStudents = h(async (req, res) => {
  const structure = await tree.loadStructure(req.org._id)
  const allowed = await allowedUnits(req)
  const status = req.query.status === 'left' ? 'inactive' : 'active'
  let students = status === 'active' ? structure.students : await Student.find({ orgId: req.org._id, status: 'inactive' }).select('name email unitId batchIds grade leftAt leaveReason').lean()
  if (req.query.unitId) {
    if (!validId(req.query.unitId) || (allowed && !allowed.has(String(req.query.unitId)))) throw bad('Unit not found', 404)
    const m = tree.membersOf({ ...structure, students }, tree.subtreeIdSet(structure.units, [req.query.unitId]))
    students = m.students
  } else if (allowed) {
    students = tree.membersOf({ ...structure, students }, allowed).students
  }
  const search = lower(req.query.q)
  if (search) students = students.filter((s) => lower(s.name).includes(search) || lower(s.email).includes(search))
  const ids = students.map((s) => s._id)
  const parents = await Parent.find({ orgId: req.org._id, studentIds: { $in: ids }, status: 'active' }).select('email studentIds').lean()
  const invites = new Map((await ParentInvite.find({ orgId: req.org._id }).lean()).map((i) => [String(i.parentId), i.status]))
  const linked = await linkedParentEmails(parents.map((p) => p.email), students.map((s) => s.email))
  const byStudent = new Map()
  for (const p of parents) for (const sid of p.studentIds || []) {
    const k = String(sid); if (!byStudent.has(k)) byStudent.set(k, [])
    byStudent.get(k).push({ email: p.email, status: linked.has(p.email) ? 'linked' : invites.get(String(p._id)) || 'not_invited' })
  }
  const batches = new Map(structure.batches.map((b) => [String(b._id), b.name]))
  res.json({
    success: true,
    total: students.length,
    students: students.slice(0, 2000).map((s) => ({
      _id: s._id, name: s.name, email: s.email, grade: s.grade, unitId: s.unitId, unit: s.unitId ? tree.unitLabel(structure.units, s.unitId) : '',
      groups: (s.batchIds || []).map((b) => batches.get(String(b))).filter(Boolean), parents: byStudent.get(String(s._id)) || [], leftAt: s.leftAt, leaveReason: s.leaveReason,
    })),
  })
})

// ── Moves, leavers, transfers (ADM-024) ──────────────────────────────────────

// Leave a group; "not in this group" is fine (rosters can lag behind the student record).
async function leaveBatch(batchId, studentId) {
  const batchService = require('../services/batchService')
  try { await batchService.removeStudentFromBatch(batchId, studentId) } catch (err) { if (err.statusCode !== 404) throw err }
  await Student.updateOne({ _id: studentId }, { $pull: { batchIds: batchId } })
}

async function loadStudentInScope(req) {
  const s = validId(req.params.id) && await Student.findOne({ _id: req.params.id, orgId: req.org._id })
  if (!s || !(await studentInScope(req, s))) throw bad('Student not found', 404)
  return s
}

const moveStudent = h(async (req, res) => {
  const s = await loadStudentInScope(req)
  const { toUnitId, addBatchIds = [], removeBatchIds = [], reason = '' } = req.body || {}
  let unit = null
  if (toUnitId) {
    unit = await tree.getUnit(req.org._id, toUnitId)
    const allowed = await allowedUnits(req)
    if (!unit || (allowed && !allowed.has(String(unit._id)))) throw bad('Unit not found', 404)
  }
  const add = (await Batch.find({ _id: { $in: addBatchIds.filter(validId) }, orgId: req.org._id, archivedAt: null }).select('_id').lean()).map((b) => b._id)
  const remove = removeBatchIds.filter(validId)
  if (!unit && !add.length && !remove.length) throw bad('Choose a section or a group.')
  const batchService = require('../services/batchService')
  for (const b of remove) await leaveBatch(b, s._id)
  for (const b of add) await batchService.addStudentsToBatch(b, [String(s._id)])
  const fromUnitId = s.unitId
  if (unit) await Student.updateOne({ _id: s._id }, { $set: { unitId: unit._id } })
  const move = await StudentMove.create({ orgId: req.org._id, studentId: s._id, kind: 'move', fromUnitId: fromUnitId || null, toUnitId: unit?._id || fromUnitId || null, fromBatchIds: remove, toBatchIds: add, reason: String(reason).slice(0, 300), by: req.actor.email })
  await audit(req, 'student.move', { targetType: 'student', targetId: s._id, orgId: req.org._id, meta: { toUnitId, add: add.length, remove: remove.length } })
  res.json({ success: true, move })
})

const studentHistory = h(async (req, res) => {
  const s = await loadStudentInScope(req)
  const units = await tree.loadUnits(req.org._id)
  const moves = await StudentMove.find({ orgId: req.org._id, studentId: s._id }).sort({ at: -1 }).lean()
  const batchNames = new Map((await Batch.find({ orgId: req.org._id }).select('name').lean()).map((b) => [String(b._id), b.name]))
  res.json({
    success: true,
    history: moves.map((m) => ({ ...m, from: m.fromUnitId ? tree.unitLabel(units, m.fromUnitId) : '', to: m.toUnitId ? tree.unitLabel(units, m.toUnitId) : '', added: (m.toBatchIds || []).map((b) => batchNames.get(String(b))).filter(Boolean), removed: (m.fromBatchIds || []).map((b) => batchNames.get(String(b))).filter(Boolean) })),
  })
})

// A leaver keeps their data (retention policy) but frees the seat and leaves their groups.
const markLeaver = h(async (req, res) => {
  const s = await loadStudentInScope(req)
  if (s.status === 'inactive') throw bad('Already marked as left.', 409)
  const batchService = require('../services/batchService')
  const from = [...(s.batchIds || [])]
  for (const b of from) await leaveBatch(b, s._id)
  await Student.updateOne({ _id: s._id }, { $set: { status: 'inactive', leftAt: new Date(), leaveReason: String(req.body?.reason || '').slice(0, 200) } })
  await StudentMove.create({ orgId: req.org._id, studentId: s._id, kind: 'leave', fromUnitId: s.unitId || null, fromBatchIds: from, reason: String(req.body?.reason || '').slice(0, 300), by: req.actor.email })
  await audit(req, 'student.leave', { targetType: 'student', targetId: s._id, orgId: req.org._id, reason: String(req.body?.reason || '').slice(0, 200) })
  res.json({ success: true })
})

const rejoin = h(async (req, res) => {
  const s = validId(req.params.id) && await Student.findOne({ _id: req.params.id, orgId: req.org._id, status: 'inactive' })
  if (!s || !(await studentInScope(req, s))) throw bad('Student not found', 404)
  const full = await assertSeats(req.org._id, 1)
  if (full) return res.status(409).json({ success: false, ...full })
  await Student.updateOne({ _id: s._id }, { $set: { status: 'active', leftAt: null, leaveReason: '' } })
  await StudentMove.create({ orgId: req.org._id, studentId: s._id, kind: 'rejoin', toUnitId: s.unitId || null, by: req.actor.email })
  await audit(req, 'student.rejoin', { targetType: 'student', targetId: s._id, orgId: req.org._id })
  res.json({ success: true })
})

// Hand all (or some) of a teacher's groups to another teacher.
const transferTeacher = h(async (req, res) => {
  const from = validId(req.params.id) && await Tutor.findOne({ _id: req.params.id, orgId: req.org._id })
  const to = validId(req.body?.toTutorId) && await Tutor.findOne({ _id: req.body.toTutorId, orgId: req.org._id })
  if (!from || !to) throw bad('Teacher not found', 404)
  if (String(from._id) === String(to._id)) throw bad('Choose a different teacher.')
  const only = Array.isArray(req.body?.batchIds) && req.body.batchIds.length ? req.body.batchIds.filter(validId).map(String) : null
  const batches = await Batch.find({ orgId: req.org._id, archivedAt: null, $or: [{ directTutorIds: from._id }, { 'subjects.teacherIds': from._id }] })
  const batchService = require('../services/batchService')
  let moved = 0
  for (const b of batches) {
    if (only && !only.includes(String(b._id))) continue
    const swap = (list) => { const out = list.filter((x) => String(x) !== String(from._id)); if (!out.some((x) => String(x) === String(to._id))) out.push(to._id); return out }
    if (b.directTutorIds.some((x) => String(x) === String(from._id))) b.directTutorIds = swap(b.directTutorIds)
    for (const s of b.subjects) if (s.teacherIds.some((x) => String(x) === String(from._id))) s.teacherIds = swap(s.teacherIds)
    await b.save()
    await batchService.syncBatchDerivedFields(b._id)
    moved++
  }
  if (batchService.recomputeTutorDerivedFields) { await batchService.recomputeTutorDerivedFields(from._id); await batchService.recomputeTutorDerivedFields(to._id) }
  await audit(req, 'teacher.transfer', { targetType: 'teacher', targetId: from._id, orgId: req.org._id, meta: { to: String(to._id), groups: moved } })
  res.json({ success: true, moved })
})

const seats = h(async (req, res) => res.json({ success: true, seats: await seatInfo(req.org._id) }))

// ── Bulk import (ADM-020) ────────────────────────────────────────────────────

const importUpload = h(async (req, res) => {
  if (!req.file) throw bad('Choose a .csv or .xlsx file.')
  const { headers, rows } = await roster.parseUpload(req.file.buffer, req.file.originalname)
  const s = await ImportSession.create({ orgId: req.org._id, createdBy: req.actor.email, filename: req.file.originalname.slice(0, 120), headers, rows })
  const kind = req.body?.kind === 'teachers' ? 'teachers' : 'students'
  res.status(201).json({ success: true, importId: s._id, filename: s.filename, headers, rowCount: rows.length, sample: rows.slice(0, 8), mapping: roster.autoMapping(headers, kind), fields: roster.FIELDS })
})

async function loadImport(req) {
  const s = validId(req.params.id) && await ImportSession.findOne({ _id: req.params.id, orgId: req.org._id })
  if (!s) throw bad('This upload has expired. Upload the file again.', 404)
  const kind = req.body?.kind === 'teachers' ? 'teachers' : req.body?.kind === 'students' ? 'students' : null
  if (!kind) throw bad('Choose students or teachers.')
  const mapping = {}
  for (const [k, v] of Object.entries(req.body?.mapping || {})) if (v !== '' && v != null && Number(v) >= 0 && Number(v) < s.headers.length) mapping[k] = Number(v)
  return { s, kind, mapping }
}

async function existingFor(req, kind) {
  if (kind === 'teachers') return { teachers: await Tutor.find({ orgId: req.org._id }).select('email').lean() }
  return { students: await Student.find({ orgId: req.org._id }).select('name email externalId grade status').lean() }
}

const importPreview = h(async (req, res) => {
  const { s, kind, mapping } = await loadImport(req)
  const plan = roster.validateRows(kind, s.rows, mapping, await existingFor(req, kind))
  const seat = kind === 'students' ? await seatInfo(req.org._id) : null
  const seatProblem = kind === 'students' ? await assertSeats(req.org._id, plan.summary.create) : null
  // Units the import would create (tree schools only).
  let newUnits = []
  if (kind === 'students' && await treeOn(req)) {
    const units = await tree.loadUnits(req.org._id)
    const names = new Set(units.map((u) => lower(u.name)))
    newUnits = [...new Set(plan.rows.filter((r) => r.action !== 'skip').flatMap((r) => [r.values.grade, r.values.section]).filter((n) => n && !names.has(lower(n))))].slice(0, 100)
  }
  const ordered = [...plan.rows].sort((a, b) => (b.errors.length - a.errors.length) || (b.warnings.length - a.warnings.length) || (a.row - b.row))
  res.json({ success: true, kind, summary: plan.summary, rows: ordered.slice(0, 1000), seats: seat, seatProblem, newUnits, committed: Boolean(s.committedAt) })
})

const importCommit = h(async (req, res) => {
  const { s, kind, mapping } = await loadImport(req)
  if (s.committedAt) throw bad('This file was already imported. Upload it again to re-import.', 409)
  const plan = roster.validateRows(kind, s.rows, mapping, await existingFor(req, kind))
  if (kind === 'students') {
    const full = await assertSeats(req.org._id, plan.summary.create)
    if (full) return res.status(409).json({ success: false, ...full })
  }
  const opts = { treeEnabled: await treeOn(req), by: req.actor.email }
  const result = kind === 'students' ? await roster.applyStudents(req.org, plan, opts) : await roster.applyTeachers(req.org, plan, opts)
  s.committedAt = new Date(); s.result = result; await s.save()
  await audit(req, 'people.import', { targetType: kind, targetId: s._id, orgId: req.org._id, meta: { filename: s.filename, rows: plan.summary.total, created: result.created, updated: result.updated, skipped: result.skipped } })
  res.json({ success: true, kind, result })
})

const importTemplate = h(async (req, res) => {
  const kind = req.query.kind === 'teachers' ? 'teachers' : 'students'
  const csv = kind === 'teachers'
    ? 'Name,Email,Phone,Subjects,Units\nAsha Mehta,asha.mehta@school.example,,Maths; Science,Grade 5 › 5A; Grade 5 › 5B\n'
    : 'Student id,Name,Email,Grade,Section,Age,Parent name,Parent email,Second parent email\nS001,Aarav Shah,aarav@school.example,4,A,9,Neha Shah,neha.shah@example.com,\n'
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="learnigo-${kind}-template.csv"`)
  res.send(csv)
})

// ── Parent invitations (ADM-022) ─────────────────────────────────────────────

async function inviteRows(req) {
  const structure = await tree.loadStructure(req.org._id)
  const allowed = await allowedUnits(req)
  const scoped = allowed ? new Set(tree.membersOf(structure, allowed).students.map((s) => String(s._id))) : null
  const parents = await Parent.find({ orgId: req.org._id, status: 'active' }).select('name email studentIds').lean()
  const invites = new Map((await ParentInvite.find({ orgId: req.org._id }).lean()).map((i) => [String(i.parentId), i]))
  const names = new Map(structure.students.map((s) => [String(s._id), s.name]))
  const linked = await linkedParentEmails(parents.map((p) => p.email), structure.students.map((s) => s.email))
  return parents
    .filter((p) => !scoped || (p.studentIds || []).some((id) => scoped.has(String(id))))
    .map((p) => {
      const inv = invites.get(String(p._id))
      return { parentId: String(p._id), name: p.name, email: p.email, children: (p.studentIds || []).map((id) => names.get(String(id))).filter(Boolean), status: linked.has(p.email) ? 'linked' : inv?.status || 'not_invited', sends: inv?.sends || 0, lastSentAt: inv?.lastSentAt || null, linkedAt: inv?.linkedAt || null }
    })
}

const listInvites = h(async (req, res) => {
  const rows = await inviteRows(req)
  const counts = rows.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc }, {})
  res.json({ success: true, parents: rows, counts, total: rows.length })
})

const inviteHtml = ({ school, children, link }) => `
<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#1f2937;max-width:520px">
  <p>Hello,</p>
  <p><strong>${esc(school)}</strong> uses Learnigo and invites you to follow ${children.length ? `<strong>${esc(children.join(', '))}</strong>'s` : "your child's"} learning.</p>
  <p>Sign in with <strong>this email address</strong> and you are connected straight away. No code needed.</p>
  <p><a href="${esc(link)}" style="display:inline-block;background:#3d9bff;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold">Open Learnigo</a></p>
  <p style="color:#6b7280;font-size:14px">If you weren't expecting this, you can ignore this email.</p>
</div>`

// Send (or resend) invites: { parentIds } | { studentIds } | { all: true, onlyNew: true }.
const sendInvites = h(async (req, res) => {
  const { parentIds, studentIds, all, onlyNew } = req.body || {}
  let rows = await inviteRows(req)
  if (Array.isArray(parentIds)) { const set = new Set(parentIds.map(String)); rows = rows.filter((r) => set.has(r.parentId)) } else if (Array.isArray(studentIds)) {
    const parents = await Parent.find({ orgId: req.org._id, studentIds: { $in: studentIds.filter(validId) } }).select('_id').lean()
    const set = new Set(parents.map((p) => String(p._id)))
    rows = rows.filter((r) => set.has(r.parentId))
  } else if (!all) throw bad('Choose who to invite.')
  if (onlyNew) rows = rows.filter((r) => r.status === 'not_invited' || r.status === 'bounced')
  rows = rows.filter((r) => r.status !== 'linked' || !onlyNew)
  if (rows.length > 2000) throw bad('Invite at most 2,000 parents at a time.')
  const ParentAccount = require('../models/ParentAccount')
  const { linkSchoolChildren } = require('../utils/parentLinks')
  const base = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '')
  const out = { sent: 0, queued: 0, bounced: 0, linked: 0 }
  for (const r of rows) {
    if (!EMAIL.test(r.email)) {
      await ParentInvite.updateOne({ orgId: req.org._id, parentId: r.parentId }, { $set: { email: r.email, status: 'bounced', lastSentAt: new Date() }, $inc: { sends: 1 } }, { upsert: true })
      out.bounced++; continue
    }
    const link = `${base}/parent-login?invite=1&email=${encodeURIComponent(r.email)}`
    const mail = await sendMail({ to: r.email, kind: 'invite', subject: `${req.org.name} invites you to follow your child's learning`, html: inviteHtml({ school: req.org.name, children: r.children, link }) })
    const status = mail.status === 'failed' ? 'bounced' : 'invited'
    await ParentInvite.updateOne({ orgId: req.org._id, parentId: r.parentId }, { $set: { email: r.email, status: r.status === 'linked' ? 'linked' : status, lastSentAt: new Date(), outboxId: mail.id || '' }, $inc: { sends: 1 } }, { upsert: true })
    if (status === 'bounced') out.bounced++; else if (mail.status === 'sent') out.sent++; else out.queued++
    // Already has a parent login with this (verified) email: link now.
    const account = await ParentAccount.findOne({ email: r.email })
    if (account) { await linkSchoolChildren(account); out.linked++ }
  }
  await audit(req, 'parents.invite', { targetType: 'parent', orgId: req.org._id, meta: { count: rows.length, ...out } })
  res.json({ success: true, invited: rows.length, ...out })
})

// ── Staff roles (ADM-023) ────────────────────────────────────────────────────

const listStaff = h(async (req, res) => {
  const units = await tree.loadUnits(req.org._id)
  const staff = await OrgStaff.find({ orgId: req.org._id }).sort({ createdAt: -1 }).lean()
  res.json({ success: true, roles: Object.keys(PERMS).map((k) => ({ key: k, label: ROLE_LABELS[k], perms: PERMS[k] })), staff: staff.map((s) => ({ ...s, units: (s.unitIds || []).map((id) => ({ id: String(id), label: tree.unitLabel(units, id) })) })) })
})

async function cleanStaff(req, body, existing) {
  const out = {}
  if (!existing || body.email !== undefined) {
    const email = lower(body.email)
    if (!EMAIL.test(email)) throw bad('Enter a valid email address.')
    if (email === lower(req.org.adminEmail)) throw bad('That is the admin account already.')
    out.email = email
  }
  if (body.name !== undefined) out.name = String(body.name || '').trim().slice(0, 80)
  if (!existing || body.role !== undefined) {
    if (!PERMS[body.role]) throw bad('Choose coordinator, office staff or viewer.')
    out.role = body.role
  }
  if (body.unitIds !== undefined) {
    const ids = (Array.isArray(body.unitIds) ? body.unitIds : []).filter(validId)
    const found = await OrgUnit.countDocuments({ _id: { $in: ids }, orgId: req.org._id })
    if (found !== ids.length) throw bad('A chosen unit is not part of your school.', 404)
    out.unitIds = ids
  }
  if (body.subjects !== undefined) out.subjects = (Array.isArray(body.subjects) ? body.subjects : []).map(lower).filter(Boolean).slice(0, 20)
  if (body.status !== undefined) { if (!['active', 'disabled'].includes(body.status)) throw bad('Unknown status'); out.status = body.status }
  return out
}

const addStaff = h(async (req, res) => {
  const v = await cleanStaff(req, req.body || {})
  if (await OrgStaff.exists({ orgId: req.org._id, email: v.email })) throw bad('This person is already on your staff list.', 409)
  const staff = await OrgStaff.create({ ...v, orgId: req.org._id, invitedBy: req.actor.email })
  const base = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '')
  await sendMail({ to: staff.email, kind: 'invite', subject: `You have been added to ${req.org.name} on Learnigo`, html: `<p>${esc(req.org.name)} added you as <strong>${esc(ROLE_LABELS[staff.role])}</strong>.</p><p>Sign in with this email at <a href="${esc(base)}/admin-login">${esc(base)}/admin-login</a>.</p>` })
  await audit(req, 'staff.add', { targetType: 'staff', targetId: staff._id, orgId: req.org._id, meta: { email: staff.email, role: staff.role, units: staff.unitIds.length } })
  res.status(201).json({ success: true, staff })
})

const updateStaff = h(async (req, res) => {
  const staff = validId(req.params.id) && await OrgStaff.findOne({ _id: req.params.id, orgId: req.org._id })
  if (!staff) throw bad('Staff member not found', 404)
  const v = await cleanStaff(req, req.body || {}, staff)
  const before = { role: staff.role, units: staff.unitIds.map(String), status: staff.status }
  Object.assign(staff, v)
  await staff.save()
  await audit(req, 'staff.role_change', { targetType: 'staff', targetId: staff._id, orgId: req.org._id, meta: { before, after: { role: staff.role, units: staff.unitIds.map(String), status: staff.status } } })
  res.json({ success: true, staff })
})

const removeStaff = h(async (req, res) => {
  const staff = validId(req.params.id) && await OrgStaff.findOneAndDelete({ _id: req.params.id, orgId: req.org._id })
  if (!staff) throw bad('Staff member not found', 404)
  await audit(req, 'staff.remove', { targetType: 'staff', targetId: staff._id, orgId: req.org._id, meta: { email: staff.email, role: staff.role } })
  res.json({ success: true })
})

module.exports = {
  access, getTree, createUnit, bulkCreateUnits, updateUnit, deleteUnit, unitPeople, assignToUnit,
  listYears, createYear, updateYear, promotionSuggest, promotionPreview, promotionApply, suggestMapping,
  listStudents, moveStudent, studentHistory, markLeaver, rejoin, transferTeacher, seats,
  importUpload, importPreview, importCommit, importTemplate,
  listInvites, sendInvites, listStaff, addStaff, updateStaff, removeStaff,
  _internals: { mongoose },
}
