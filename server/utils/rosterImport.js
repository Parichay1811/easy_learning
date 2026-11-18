// Bulk import of students and teachers from CSV/XLSX (ADM-020).
// parse -> map columns -> validate (dry run) -> apply. Re-importing the same
// file updates people instead of duplicating them: students match on the
// school's own id, then email, then name + grade + section; teachers on email.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_ROWS = 5000
const norm = (s) => String(s ?? '').trim()
const lower = (s) => norm(s).toLowerCase()

const FIELDS = {
  students: [
    { key: 'name', label: 'Name', required: true, synonyms: ['name', 'student name', 'full name', 'student', 'pupil', 'learner'] },
    { key: 'firstName', label: 'First name', synonyms: ['first name', 'firstname', 'given name', 'forename'] },
    { key: 'lastName', label: 'Last name', synonyms: ['last name', 'lastname', 'surname', 'family name'] },
    { key: 'email', label: 'Email', synonyms: ['email', 'student email', 'e-mail', 'mail', 'login'] },
    { key: 'externalId', label: 'School id', synonyms: ['id', 'student id', 'admission no', 'admission number', 'roll no', 'roll number', 'upn', 'school id'] },
    { key: 'campus', label: 'Campus', synonyms: ['campus', 'site', 'branch'] },
    { key: 'grade', label: 'Grade / Year', synonyms: ['grade', 'year', 'class', 'standard', 'std', 'year group', 'form'] },
    { key: 'section', label: 'Section', synonyms: ['section', 'division', 'div', 'homeroom', 'tutor group', 'stream'] },
    { key: 'age', label: 'Age', synonyms: ['age'] },
    { key: 'parentName', label: 'Parent name', synonyms: ['parent name', 'guardian name', 'parent', 'guardian', 'mother name', 'father name'] },
    { key: 'parentEmail', label: 'Parent email(s)', synonyms: ['parent email', 'guardian email', 'parent emails', 'parent e-mail', 'mother email', 'father email', 'parent 1 email'] },
    { key: 'parent2Email', label: 'Second parent email', synonyms: ['parent 2 email', 'parent2 email', 'second parent email', 'guardian 2 email'] },
  ],
  teachers: [
    { key: 'name', label: 'Name', required: true, synonyms: ['name', 'teacher name', 'full name', 'teacher', 'staff name'] },
    { key: 'email', label: 'Email', required: true, synonyms: ['email', 'teacher email', 'e-mail', 'mail', 'work email'] },
    { key: 'phone', label: 'Phone', synonyms: ['phone', 'mobile', 'phone number', 'tel'] },
    { key: 'subjects', label: 'Subjects', synonyms: ['subjects', 'subject', 'teaches'] },
    { key: 'units', label: 'Units (grades / sections)', synonyms: ['units', 'unit', 'sections', 'classes', 'grades', 'department', 'departments'] },
  ],
}

// ── Parsing ─────────────────────────────────────────────────────────────────

// RFC 4180-ish CSV: quotes, escaped quotes, commas/semicolons/tabs, CRLF.
function parseCsv(text) {
  const src = String(text || '').replace(/^﻿/, '')
  const firstLine = src.split(/\r?\n/, 1)[0] || ''
  const delim = [',', ';', '\t'].map((d) => [d, firstLine.split(d).length]).sort((a, b) => b[1] - a[1])[0][0]
  const rows = []
  let row = [], cell = '', quoted = false
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++ } else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"' && cell === '') quoted = true
    else if (c === delim) { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += c
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((x) => norm(x) !== ''))
}

async function parseXlsx(buffer) {
  const ExcelJS = require('exceljs')
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)
  const ws = wb.worksheets[0]
  if (!ws) return []
  const rows = []
  ws.eachRow({ includeEmpty: false }, (r) => {
    const vals = []
    for (let c = 1; c <= ws.columnCount; c++) {
      const v = r.getCell(c).value
      vals.push(v == null ? '' : typeof v === 'object' ? (v.text ?? v.result ?? (v.hyperlink ? String(v.hyperlink).replace(/^mailto:/, '') : v instanceof Date ? v.toISOString().slice(0, 10) : '')) : String(v))
    }
    rows.push(vals.map((x) => String(x)))
  })
  return rows.filter((r) => r.some((x) => norm(x) !== ''))
}

// -> { headers, rows } or throws { status: 400 }.
async function parseUpload(buffer, filename = '') {
  const ext = lower(filename).split('.').pop()
  let table
  if (ext === 'xlsx') table = await parseXlsx(buffer)
  else if (ext === 'csv' || ext === 'txt') table = parseCsv(buffer.toString('utf8'))
  else throw Object.assign(new Error('Upload a .csv or .xlsx file.'), { status: 400 })
  if (table.length < 2) throw Object.assign(new Error('The file needs a header row and at least one person.'), { status: 400 })
  if (table.length - 1 > MAX_ROWS) throw Object.assign(new Error(`At most ${MAX_ROWS} rows per file. Split the file and import twice.`), { status: 400 })
  const width = Math.max(...table.map((r) => r.length))
  const headers = table[0].map((h, i) => norm(h) || `Column ${i + 1}`)
  while (headers.length < width) headers.push(`Column ${headers.length + 1}`)
  const rows = table.slice(1).map((r) => headers.map((_, i) => norm(r[i]).slice(0, 300)))
  return { headers, rows }
}

// Best guess of which column holds which field: { field: columnIndex }.
function autoMapping(headers, kind) {
  const map = {}
  const used = new Set()
  const h = headers.map((x) => lower(x).replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' '))
  for (const f of FIELDS[kind] || []) {
    const i = h.findIndex((x, idx) => !used.has(idx) && f.synonyms.includes(x))
    if (i >= 0) { map[f.key] = i; used.add(i) }
  }
  return map
}

// ── Validation (the dry run) ────────────────────────────────────────────────

const splitList = (s) => norm(s).split(/[;,|/]+|\s+and\s+/i).map((x) => x.trim()).filter(Boolean)

// "5" -> "Grade 5"; "Year 4" stays. Numbers drive section names ("4A").
function gradeName(raw) {
  const v = norm(raw)
  if (!v) return ''
  return /^\d{1,2}$/.test(v) ? `Grade ${v}` : v
}
function sectionNameFor(grade, raw) {
  const v = norm(raw)
  if (!v) return ''
  const n = /(\d{1,2})/.exec(grade)?.[1]
  return /^[A-Za-z]{1,2}$/.test(v) && n ? `${n}${v.toUpperCase()}` : v
}

// What the flat Student.grade field holds: "Grade 4 4A" (also the re-import match key).
const gradeLabel = (v) => (v.section ? `${v.grade} ${v.section}`.trim() : v.grade)

function valueOf(row, mapping, key) {
  const i = mapping[key]
  return i == null || i === '' || i < 0 ? '' : norm(row[Number(i)])
}

// existing: { students: [{ _id, name, email, externalId, grade, unitLabel }], teachers: [{ _id, email }] }
// -> { rows: [{ row, values, action, matchId, errors, warnings }], summary }
function validateRows(kind, rows, mapping, existing = {}) {
  const fields = FIELDS[kind]
  if (!fields) throw Object.assign(new Error('Choose students or teachers.'), { status: 400 })
  const missing = fields.filter((f) => f.required && mapping[f.key] == null && !(kind === 'students' && f.key === 'name' && mapping.firstName != null))
  if (missing.length) throw Object.assign(new Error(`Map a column to: ${missing.map((f) => f.label).join(', ')}.`), { status: 400 })

  const seenEmail = new Map(), seenExt = new Map(), seenKey = new Map()
  const byEmail = new Map(), byExt = new Map(), byKey = new Map()
  for (const s of existing.students || []) {
    if (s.email) byEmail.set(lower(s.email), s)
    if (s.externalId) byExt.set(lower(s.externalId), s)
    byKey.set(`${lower(s.name)}|${lower(s.grade)}`, s)
  }
  const tByEmail = new Map((existing.teachers || []).map((t) => [lower(t.email), t]))

  const out = rows.map((row, idx) => {
    const v = {}
    for (const f of fields) v[f.key] = valueOf(row, mapping, f.key)
    if (kind === 'students' && !v.name) v.name = [v.firstName, v.lastName].filter(Boolean).join(' ')
    const errors = [], warnings = []
    if (!v.name) errors.push('Name is missing')
    if (v.name.length > 100) errors.push('Name is too long')
    if (v.email && !EMAIL.test(v.email)) errors.push(`"${v.email}" is not a valid email`)
    v.email = lower(v.email)
    let action = 'create', matchId = null
    if (kind === 'students') {
      v.grade = gradeName(v.grade)
      v.section = sectionNameFor(v.grade, v.section)
      if (!v.grade) warnings.push('No grade: the student is added without a class')
      if (v.section && !v.grade) errors.push('A section needs a grade')
      if (v.age && !(Number(v.age) >= 3 && Number(v.age) <= 25)) { warnings.push('Age ignored (3 to 25 only)'); v.age = '' }
      const parentEmails = [...splitList(v.parentEmail), ...splitList(v.parent2Email)].map(lower)
      v.parentEmails = [...new Set(parentEmails)]
      for (const p of v.parentEmails) if (!EMAIL.test(p)) errors.push(`Parent email "${p}" is not valid`)
      if (v.email && v.parentEmails.includes(v.email)) errors.push("The parent's email is the same as the student's")
      const key = `${lower(v.name)}|${lower(gradeLabel(v))}`
      if (v.externalId && seenExt.has(lower(v.externalId))) errors.push(`Duplicate school id (also row ${seenExt.get(lower(v.externalId))})`)
      else if (v.email && seenEmail.has(v.email)) errors.push(`Duplicate email (also row ${seenEmail.get(v.email)})`)
      else if (!v.email && !v.externalId && seenKey.has(key)) warnings.push(`Same name and grade as row ${seenKey.get(key)}`)
      if (v.externalId) seenExt.set(lower(v.externalId), idx + 2)
      if (v.email) seenEmail.set(v.email, idx + 2)
      seenKey.set(key, idx + 2)
      const match = (v.externalId && byExt.get(lower(v.externalId))) || (v.email && byEmail.get(v.email)) || (!v.email && !v.externalId && byKey.get(key))
      if (match) {
        action = 'update'; matchId = String(match._id)
        if (!v.externalId && !v.email) warnings.push('Matched an existing student by name and grade')
        if (v.email && match.email && lower(match.email) !== v.email && byEmail.get(v.email) && String(byEmail.get(v.email)._id) !== matchId) errors.push('This email belongs to another student')
      }
    } else {
      if (!v.email) errors.push('Email is missing (teachers sign in with it)')
      else if (seenEmail.has(v.email)) errors.push(`Duplicate email (also row ${seenEmail.get(v.email)})`)
      if (v.email) seenEmail.set(v.email, idx + 2)
      v.subjectList = splitList(v.subjects)
      v.unitList = norm(v.units).split(/[;|]+/).map((x) => x.trim()).filter(Boolean)
      const match = v.email && tByEmail.get(v.email)
      if (match) { action = 'update'; matchId = String(match._id) }
    }
    if (errors.length) action = 'skip'
    return { row: idx + 2, values: v, action, matchId, errors, warnings }
  })
  const summary = {
    total: out.length,
    create: out.filter((r) => r.action === 'create').length,
    update: out.filter((r) => r.action === 'update').length,
    skip: out.filter((r) => r.action === 'skip').length,
    warnings: out.filter((r) => r.warnings.length).length,
    parents: kind === 'students' ? new Set(out.filter((r) => r.action !== 'skip').flatMap((r) => r.values.parentEmails)).size : 0,
  }
  return { rows: out, summary }
}

// ── Apply ───────────────────────────────────────────────────────────────────

// Finds or creates campus/grade/section units for a student row (tree schools).
function unitResolver(orgId, units, { create }) {
  const { createUnit } = require('./orgUnits')
  const cache = new Map()
  const find = (parentId, type, name) => units.find((u) => String(u.parentId || '') === String(parentId || '') && u.type === type && lower(u.name) === lower(name))
  const ensure = async (parentId, type, name) => {
    let u = find(parentId, type, name)
    if (!u && create) { u = (await createUnit(orgId, { parentId, type, name })).toObject(); units.push(u) }
    return u || null
  }
  return async ({ campus, grade, section }) => {
    const key = `${lower(campus)}|${lower(grade)}|${lower(section)}`
    if (cache.has(key)) return cache.get(key)
    let parent = null
    if (campus) parent = await ensure(null, 'campus', campus)
    let gradeUnit = grade ? await ensure(parent?._id || null, 'grade', grade) : null
    // A grade that exists under a campus is fine to find without naming the campus.
    if (!gradeUnit && grade && !campus) gradeUnit = units.find((u) => u.type === 'grade' && lower(u.name) === lower(grade)) || null
    const sectionUnit = gradeUnit && section ? await ensure(gradeUnit._id, 'section', section) : null
    const result = sectionUnit || gradeUnit || null
    cache.set(key, result)
    return result
  }
}

async function applyStudents(org, plan, { treeEnabled, by }) {
  const Student = require('../models/admin/Student')
  const Parent = require('../models/admin/Parent')
  const { loadUnits } = require('./orgUnits')
  const units = treeEnabled ? await loadUnits(org._id) : []
  const resolve = unitResolver(org._id, units, { create: true })
  const res = { created: 0, updated: 0, skipped: 0, parentsCreated: 0, parentsLinked: 0, unitsUsed: 0, errors: [] }
  const parentCache = new Map((await Parent.find({ orgId: org._id }).lean()).map((p) => [lower(p.email), p]))
  const usedUnits = new Set()
  for (const r of plan.rows) {
    if (r.action === 'skip') { res.skipped++; continue }
    const v = r.values
    try {
      const unit = treeEnabled && v.grade ? await resolve({ campus: v.campus, grade: v.grade, section: v.section }) : null
      if (unit) usedUnits.add(String(unit._id))
      const set = { name: v.name, grade: gradeLabel(v) }
      if (v.email) set.email = v.email
      if (v.externalId) set.externalId = v.externalId
      if (v.age) set.age = Number(v.age)
      if (unit) set.unitId = unit._id
      let student
      if (r.action === 'update') {
        student = await Student.findOneAndUpdate({ _id: r.matchId, orgId: org._id }, { $set: set }, { new: true })
        if (student) res.updated++
      }
      if (!student) { student = await Student.create({ ...set, orgId: org._id }); res.created++ }
      for (const pe of v.parentEmails || []) {
        let p = parentCache.get(pe)
        if (!p) {
          p = (await Parent.create({ name: v.parentName || pe.split('@')[0], email: pe, orgId: org._id, studentIds: [student._id] })).toObject()
          parentCache.set(pe, p); res.parentsCreated++
        } else if (!(p.studentIds || []).some((x) => String(x) === String(student._id))) {
          await Parent.updateOne({ _id: p._id }, { $addToSet: { studentIds: student._id }, ...(p.status === 'inactive' ? { $set: { status: 'active' } } : {}) })
          p.studentIds = [...(p.studentIds || []), student._id]; res.parentsLinked++
        }
        await Student.updateOne({ _id: student._id }, { $addToSet: { parentIds: p._id } })
      }
    } catch (err) {
      res.errors.push({ row: r.row, message: err.message })
    }
  }
  res.unitsUsed = usedUnits.size
  void by
  return res
}

async function applyTeachers(org, plan, { treeEnabled }) {
  const Tutor = require('../models/admin/Tutor')
  const Subject = require('../models/admin/Subject')
  const { loadUnits, unitLabel } = require('./orgUnits')
  const units = treeEnabled ? await loadUnits(org._id) : []
  const labels = units.map((u) => ({ id: u._id, name: lower(u.name), label: lower(unitLabel(units, u._id)) }))
  const subjects = await Subject.find({ orgId: org._id }).lean()
  const res = { created: 0, updated: 0, skipped: 0, subjectsCreated: 0, unknownUnits: [], errors: [] }
  const subjectId = async (name) => {
    let s = subjects.find((x) => lower(x.name) === lower(name) || (x.code && lower(x.code) === lower(name)))
    if (!s) { s = (await Subject.create({ name, orgId: org._id })).toObject(); subjects.push(s); res.subjectsCreated++ }
    return s._id
  }
  for (const r of plan.rows) {
    if (r.action === 'skip') { res.skipped++; continue }
    const v = r.values
    try {
      const subjectIds = []
      for (const name of v.subjectList || []) subjectIds.push(await subjectId(name.slice(0, 60)))
      const unitIds = []
      for (const name of v.unitList || []) {
        const n = lower(name).replace(/\s*[>›/]\s*/g, ' › ')
        const u = labels.find((x) => x.label === n) || labels.find((x) => x.name === n)
        if (u) unitIds.push(u.id); else if (treeEnabled) res.unknownUnits.push({ row: r.row, unit: name })
      }
      const set = { name: v.name, ...(v.phone ? { phone: v.phone } : {}), ...(v.subjectList?.length ? { subject: v.subjectList.join(', ') } : {}) }
      const add = { ...(subjectIds.length ? { subjectIds: { $each: subjectIds } } : {}), ...(unitIds.length ? { unitIds: { $each: unitIds } } : {}) }
      if (r.action === 'update') {
        const t = await Tutor.findOneAndUpdate({ _id: r.matchId, orgId: org._id }, { $set: set, ...(Object.keys(add).length ? { $addToSet: add } : {}) }, { new: true })
        if (t) { res.updated++; continue }
      }
      await Tutor.create({ ...set, email: v.email, orgId: org._id, subjectIds, unitIds })
      res.created++
    } catch (err) {
      res.errors.push({ row: r.row, message: err.code === 11000 ? 'A teacher with this email already exists' : err.message })
    }
  }
  return res
}

module.exports = { FIELDS, MAX_ROWS, gradeLabel, parseCsv, parseUpload, autoMapping, validateRows, gradeName, sectionNameFor, applyStudents, applyTeachers, unitResolver }
