// The school tree (FND-017 / ADM-010..012). Paths are id chains
// ("/<campus>/<grade>/<section>/"), so a subtree is a prefix and a move rewrites
// the prefix of every descendant. Pure helpers are exported for unit tests.
const mongoose = require('mongoose')

const lower = (s) => String(s || '').toLowerCase()
const idStr = (x) => (x == null ? null : String(x))
const validId = (x) => mongoose.isValidObjectId(x) && String(x).length === 24

// Which parent types each unit type may hang under (null = the school root).
const ALLOWED_PARENTS = {
  campus: [null],
  grade: [null, 'campus'],
  section: ['grade'],
  department: [null, 'campus'],
}

class TreeError extends Error {
  constructor(message, status = 400, code) { super(message); this.status = status; this.code = code }
}

const childPath = (parentPath, id) => `${parentPath || '/'}${id}/`
const pathIds = (path) => String(path || '').split('/').filter(Boolean)

// Units (lean, with _id and path) -> Set of ids in the subtrees of `rootIds`.
function subtreeIdSet(units, rootIds) {
  const roots = new Set((rootIds || []).map(String))
  const out = new Set()
  for (const u of units) if (pathIds(u.path).some((id) => roots.has(id))) out.add(String(u._id))
  return out
}

// Nested tree for the client, children sorted by order then name.
function buildTree(units) {
  const byId = new Map(units.map((u) => [String(u._id), { ...u, id: String(u._id), children: [] }]))
  const roots = []
  for (const n of byId.values()) {
    const parent = n.parentId && byId.get(String(n.parentId))
    if (parent) parent.children.push(n); else roots.push(n)
  }
  const sort = (list) => { list.sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name, undefined, { numeric: true })); list.forEach((c) => sort(c.children)) }
  sort(roots)
  return roots
}

// "Grades 1-8, sections A-C" | "Year 4-6 / A,B" | "Grade 1 to 3, sections A to D"
// -> { grades: ['Grade 1', ...], sections: ['A','B','C'], prefix: 'Grade' }.
function parseBulkSpec(text) {
  const s = String(text || '').trim()
  const g = /(grade|year|class|std|standard|form)s?\s*(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})/i.exec(s) || /(grade|year|class|std|standard|form)s?\s*(\d{1,2})(?!\s*(?:-|–|to))/i.exec(s)
  if (!g) throw new TreeError('Write it like "Grades 1-8, sections A-C".')
  const word = g[1].toLowerCase().startsWith('std') || g[1].toLowerCase() === 'standard' ? 'Standard' : g[1][0].toUpperCase() + g[1].slice(1).toLowerCase()
  const from = Number(g[2]), to = g[3] ? Number(g[3]) : Number(g[2])
  if (from > to || to - from > 15) throw new TreeError('Use at most 16 grades, lowest first.')
  const grades = []
  for (let n = from; n <= to; n++) grades.push({ name: `${word} ${n}`, number: n })
  let sections = []
  const range = /sections?\s*([a-z])\s*(?:-|–|to)\s*([a-z])\b/i.exec(s)
  const list = /sections?\s*((?:[a-z0-9]+\s*,\s*)+[a-z0-9]+)/i.exec(s)
  if (range) {
    const a = range[1].toUpperCase().charCodeAt(0), b = range[2].toUpperCase().charCodeAt(0)
    if (a > b || b - a > 11) throw new TreeError('Use at most 12 sections, like A-C.')
    for (let c = a; c <= b; c++) sections.push(String.fromCharCode(c))
  } else if (list) {
    sections = list[1].split(',').map((x) => x.trim()).filter(Boolean).slice(0, 12)
  }
  return { grades, sections }
}

// Section name for grade number n and letter L: "4A".
const sectionName = (grade, letter) => `${grade.number ?? ''}${letter}`

// ── Database operations ──────────────────────────────────────────────────────

const models = () => ({
  OrgUnit: require('../models/admin/OrgUnit'),
  Batch: require('../models/admin/Batch'),
  Student: require('../models/admin/Student'),
  Tutor: require('../models/admin/Tutor'),
})

async function loadUnits(orgId) {
  return models().OrgUnit.find({ orgId, archivedAt: null }).select('parentId type name path depth order subject').lean()
}

async function getUnit(orgId, unitId) {
  if (!validId(unitId)) return null
  return models().OrgUnit.findOne({ _id: unitId, orgId, archivedAt: null })
}

async function createUnit(orgId, { parentId = null, type, name, subject = '' }) {
  const { OrgUnit } = models()
  if (!ALLOWED_PARENTS[type]) throw new TreeError('Unknown unit type')
  const clean = String(name || '').trim()
  if (!clean || clean.length > 80) throw new TreeError('Give the unit a name (up to 80 characters).')
  let parent = null
  if (parentId) {
    parent = await getUnit(orgId, parentId)
    if (!parent) throw new TreeError('Parent unit not found', 404)
  }
  if (!ALLOWED_PARENTS[type].includes(parent ? parent.type : null)) {
    throw new TreeError(`A ${type} can't go ${parent ? `inside a ${parent.type}` : 'at the top of the school'}.`)
  }
  const dup = await OrgUnit.exists({ orgId, parentId: parent ? parent._id : null, archivedAt: null, name: { $regex: `^${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } })
  if (dup) throw new TreeError(`"${clean}" already exists here.`, 409)
  const _id = new mongoose.Types.ObjectId()
  const order = await OrgUnit.countDocuments({ orgId, parentId: parent ? parent._id : null })
  return OrgUnit.create({ _id, orgId, parentId: parent ? parent._id : null, type, name: clean, subject: lower(subject), path: childPath(parent?.path, _id), depth: parent ? parent.depth + 1 : 0, order })
}

// Grades and sections in one go; existing names are reused, so it is safe to repeat.
async function bulkCreate(orgId, { parentId = null, spec }) {
  const { OrgUnit } = models()
  const { grades, sections } = parseBulkSpec(spec)
  const created = []
  const existing = await OrgUnit.find({ orgId, parentId: parentId || null, type: 'grade', archivedAt: null }).lean()
  for (const g of grades) {
    let grade = existing.find((u) => lower(u.name) === lower(g.name))
    if (!grade) { grade = await createUnit(orgId, { parentId, type: 'grade', name: g.name }); created.push(grade) }
    const secs = await OrgUnit.find({ orgId, parentId: grade._id, archivedAt: null }).lean()
    for (const letter of sections) {
      const name = sectionName(g, letter)
      if (secs.some((u) => lower(u.name) === lower(name))) continue
      created.push(await createUnit(orgId, { parentId: grade._id, type: 'section', name }))
    }
  }
  return created
}

async function renameUnit(orgId, unitId, name) {
  const unit = await getUnit(orgId, unitId)
  if (!unit) throw new TreeError('Unit not found', 404)
  const clean = String(name || '').trim()
  if (!clean || clean.length > 80) throw new TreeError('Give the unit a name (up to 80 characters).')
  unit.name = clean
  await unit.save()
  return unit
}

// Move a unit (and everything under it) to a new parent, or reorder among siblings.
async function moveUnit(orgId, unitId, { parentId = null, order } = {}) {
  const { OrgUnit } = models()
  const unit = await getUnit(orgId, unitId)
  if (!unit) throw new TreeError('Unit not found', 404)
  let parent = null
  if (parentId) {
    parent = await getUnit(orgId, parentId)
    if (!parent) throw new TreeError('Target unit not found', 404)
    if (pathIds(parent.path).includes(String(unit._id))) throw new TreeError("A unit can't move inside itself.")
  }
  if (!ALLOWED_PARENTS[unit.type].includes(parent ? parent.type : null)) {
    throw new TreeError(`A ${unit.type} can't go ${parent ? `inside a ${parent.type}` : 'at the top of the school'}.`)
  }
  const oldPath = unit.path
  const newPath = childPath(parent?.path, unit._id)
  const depthShift = (parent ? parent.depth + 1 : 0) - unit.depth
  if (oldPath !== newPath) {
    const desc = await OrgUnit.find({ orgId, path: { $regex: `^${oldPath}` } }).select('path depth').lean()
    await OrgUnit.bulkWrite(desc.map((d) => ({
      updateOne: { filter: { _id: d._id }, update: { $set: { path: newPath + d.path.slice(oldPath.length), depth: d.depth + depthShift } } },
    })))
  }
  await OrgUnit.updateOne({ _id: unit._id }, { $set: { parentId: parent ? parent._id : null, ...(order != null ? { order: Number(order) || 0 } : {}) } })
  return OrgUnit.findById(unit._id).lean()
}

// Only empty units can be deleted; anything with people or groups must be moved first.
async function deleteUnit(orgId, unitId) {
  const { OrgUnit, Batch, Student, Tutor } = models()
  const unit = await getUnit(orgId, unitId)
  if (!unit) throw new TreeError('Unit not found', 404)
  const ids = (await OrgUnit.find({ orgId, path: { $regex: `^${unit.path}` } }).select('_id').lean()).map((u) => u._id)
  const [kids, groups, students, tutors] = await Promise.all([
    OrgUnit.countDocuments({ orgId, parentId: unit._id }),
    Batch.countDocuments({ orgId, unitId: { $in: ids } }),
    Student.countDocuments({ orgId, unitId: { $in: ids }, status: 'active' }),
    Tutor.countDocuments({ orgId, unitIds: { $in: ids } }),
  ])
  if (kids || groups || students || tutors) {
    throw new TreeError(`Move what is inside first: ${kids} units, ${groups} groups, ${students} students, ${tutors} teachers.`, 409, 'UNIT_NOT_EMPTY')
  }
  await OrgUnit.deleteOne({ _id: unit._id })
  return { deleted: String(unit._id) }
}

// Everything needed to count people per unit, in four small queries.
async function loadStructure(orgId) {
  const { Batch, Student, Tutor } = models()
  const [units, batches, students, tutors] = await Promise.all([
    loadUnits(orgId),
    Batch.find({ orgId }).select('name unitId tutorIds studentIds status archivedAt yearId academicYear subjects.subject').lean(),
    Student.find({ orgId, status: 'active' }).select('name email unitId batchIds grade').lean(),
    Tutor.find({ orgId }).select('name email unitIds batchIds status lastLoginAt authStatus subjectIds').lean(),
  ])
  return { units, batches, students, tutors }
}

// People inside a set of unit ids (already expanded to subtrees): homeroom
// students, students of groups that sit in those units, those groups' teachers
// and teachers placed in the units.
function membersOf(structure, unitIdSet) {
  const ids = unitIdSet instanceof Set ? unitIdSet : new Set(unitIdSet)
  const batches = structure.batches.filter((b) => b.unitId && ids.has(String(b.unitId)))
  const batchIds = new Set(batches.map((b) => String(b._id)))
  const students = structure.students.filter((s) => (s.unitId && ids.has(String(s.unitId))) || (s.batchIds || []).some((b) => batchIds.has(String(b))))
  const tutorIds = new Set()
  for (const b of batches) for (const t of b.tutorIds || []) tutorIds.add(String(t))
  for (const t of structure.tutors) if ((t.unitIds || []).some((u) => ids.has(String(u)))) tutorIds.add(String(t._id))
  return { batches, students, tutors: structure.tutors.filter((t) => tutorIds.has(String(t._id))) }
}

// Counts for every unit (including everything below it).
function unitCounts(structure) {
  const out = {}
  for (const u of structure.units) {
    const m = membersOf(structure, subtreeIdSet(structure.units, [u._id]))
    out[String(u._id)] = { students: m.students.length, teachers: m.tutors.length, groups: m.batches.length, emails: m.students.map((s) => lower(s.email)).filter(Boolean) }
  }
  return out
}

// "Grade 5 › 5B" for a unit id.
function unitLabel(units, unitId) {
  const byId = new Map(units.map((u) => [String(u._id), u]))
  const u = byId.get(String(unitId))
  if (!u) return ''
  return pathIds(u.path).map((id) => byId.get(id)?.name).filter(Boolean).join(' › ')
}

module.exports = {
  ALLOWED_PARENTS, TreeError, childPath, pathIds, subtreeIdSet, buildTree, parseBulkSpec, sectionName, validId, idStr,
  loadUnits, getUnit, createUnit, bulkCreate, renameUnit, moveUnit, deleteUnit, loadStructure, membersOf, unitCounts, unitLabel,
}
