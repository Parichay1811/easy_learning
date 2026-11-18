// Who is using the school dashboard, and what may they do? (ADM-023, FND-020)
//
// Every /api/admin request goes through `orgContext` (after adminAuth):
//   - the school owner (token role 'org_admin'): full rights in their own org.
//   - a staff member (token role 'org_staff', see adminAuthController): their
//     OrgStaff row is re-read on every request (so removing them works at once)
//     and they get the permissions of their role, limited to their units.
// It sets req.org, req.actor ({ role: 'admin' | 'staff', staffRole, orgId ... })
// and req.staff ({ role, unitIds, subjects }) for staff.
//
// New routes guard themselves with permit('perm'). Older admin routes were written
// for the owner only, so `staffLegacyGate` lets staff reach just the ones listed
// below and refuses everything else (deny by default).
const Organization = require('../models/admin/Organization')
const OrgStaff = require('../models/admin/OrgStaff')
const { subtreeIdSet, loadUnits, validId } = require('./orgUnits')
const { assertSeats } = require('./seats')

const PERMS = {
  coordinator: ['tree.read', 'people.read', 'people.move', 'analytics.read', 'questions.review', 'settings.read'],
  office: ['tree.read', 'people.read', 'people.write', 'people.move', 'people.import', 'parents.invite', 'settings.read', 'legacy.people'],
  viewer: ['tree.read', 'analytics.read', 'settings.read'],
}
const ROLE_LABELS = { admin: 'Admin', coordinator: 'Coordinator', office: 'Office staff', viewer: 'Viewer' }

const can = (req, perm) => {
  if (req.actor?.role === 'admin') return true
  if (req.actor?.role !== 'staff' || !req.staff) return false
  return (PERMS[req.staff.role] || []).includes(perm)
}

const deny = (res, status, message, code) => res.status(status).json({ success: false, message, ...(code ? { code } : {}) })

async function orgContext(req, res, next) {
  try {
    const p = req.admin || {}
    if (p.role === 'org_staff') {
      const staff = validId(p.staffId) ? await OrgStaff.findOne({ _id: p.staffId, status: 'active' }).lean() : null
      if (!staff || String(staff.orgId) !== String(p.orgId) || staff.email !== String(p.email || '').toLowerCase()) {
        return deny(res, 401, 'Your staff access has ended. Ask your school admin.', 'STAFF_REVOKED')
      }
      const org = await Organization.findById(staff.orgId)
      if (!org) return deny(res, 401, 'Organization not found')
      req.staff = { id: String(staff._id), role: staff.role, unitIds: (staff.unitIds || []).map(String), subjects: staff.subjects || [] }
      // Older controllers find the school by its owner's uid; staff act inside that school.
      req.admin = { ...p, uid: org.adminUid, orgId: String(org._id), staff: req.staff }
      req.org = org
      req.actor = { role: 'staff', staffRole: staff.role, id: String(staff._id), email: staff.email, name: staff.name || p.name || '', orgId: String(org._id) }
      return next()
    }
    const org = p.uid ? await Organization.findOne({ adminUid: p.uid }) : null
    req.org = org
    req.actor = { role: 'admin', id: String(p.id || ''), email: p.email, name: p.name, orgId: org ? String(org._id) : (p.orgId ? String(p.orgId) : null), uid: p.uid }
    next()
  } catch (err) {
    console.error('orgContext error:', err)
    deny(res, 500, 'Internal server error')
  }
}

// permit('analytics.read') for new routes: needs a registered org and the permission.
const permit = (...perms) => (req, res, next) => {
  if (!req.org) return deny(res, 400, 'Register your organization first', 'NO_ORG')
  if (!perms.every((p) => can(req, p))) return deny(res, 403, "Your role can't do this. Ask your school admin.", 'ROLE_FORBIDDEN')
  next()
}
const adminOnly = (req, res, next) => {
  if (!req.org) return deny(res, 400, 'Register your organization first', 'NO_ORG')
  if (req.actor?.role !== 'admin') return deny(res, 403, 'Only the school admin can do this.', 'ROLE_FORBIDDEN')
  next()
}

// Unit ids (subtrees expanded) a staff member is limited to; null = the whole school.
async function allowedUnits(req) {
  if (!req.staff || !req.staff.unitIds.length) return null
  if (req._allowedUnits) return req._allowedUnits
  const units = await loadUnits(req.org._id)
  req._allowedUnits = subtreeIdSet(units, req.staff.unitIds)
  return req._allowedUnits
}

// Is this student inside the caller's units? (Always true for unrestricted callers.)
async function studentInScope(req, student) {
  const allowed = await allowedUnits(req)
  if (!allowed) return true
  if (student.unitId && allowed.has(String(student.unitId))) return true
  const Batch = require('../models/admin/Batch')
  const ids = (student.batchIds || []).map(String)
  if (!ids.length) return false
  return Boolean(await Batch.exists({ _id: { $in: ids }, orgId: req.org._id, unitId: { $in: [...allowed] } }))
}

// The older routes staff may use. Anything not listed is refused for staff.
const LEGACY = [
  { re: /^GET \/org$/ }, { re: /^(GET|PATCH) \/profile$/ },
  { re: /^GET \/stats$/, perm: 'people.read' },
  { re: /^GET \/analytics\//, perm: 'analytics.read' },                       // forAdmin applies the unit scope
  { re: /^GET \/units\/[^/]+\/analytics\//, perm: 'analytics.read' },          // forAdmin applies the unit scope
  { re: /^GET \/students\/[^/]+\/analytics\//, perm: 'analytics.read' },       // forAdmin applies the unit scope
  { re: /^GET \/students\/([^/]+)\/(dashboard\/|performance$)/, perm: 'analytics.read', student: true },
  { re: /^GET \/tutors\/[^/]+\/performance$/, perm: 'analytics.read', wholeSchool: true },
  { re: /^(GET|POST|PATCH|DELETE) \/(tutors|subjects|batches|students|parents)(\/|$)/, perm: 'legacy.people', wholeSchool: true },
  { re: /^POST \/schedule\/check-conflict$/, perm: 'legacy.people', wholeSchool: true },
]

async function staffLegacyGate(req, res, next) {
  try {
    if (!req.staff) return next()
    const key = `${req.method} ${req.path}`
    const rule = LEGACY.find((r) => r.re.test(key))
    if (!rule) return deny(res, 403, "Your role can't do this. Ask your school admin.", 'ROLE_FORBIDDEN')
    if (rule.perm && !can(req, rule.perm)) return deny(res, 403, "Your role can't do this. Ask your school admin.", 'ROLE_FORBIDDEN')
    if (rule.wholeSchool && req.staff.unitIds.length) return deny(res, 403, 'This page covers the whole school. Use the People page for your units.', 'ROLE_FORBIDDEN')
    if (rule.student) {
      const Student = require('../models/admin/Student')
      const id = rule.re.exec(key)[1]
      const s = validId(id) ? await Student.findOne({ _id: id, orgId: req.org._id }).select('unitId batchIds').lean() : null
      if (!s || !(await studentInScope(req, s))) return deny(res, 404, 'Student not found')
    }
    next()
  } catch (err) {
    console.error('staffLegacyGate error:', err)
    deny(res, 500, 'Internal server error')
  }
}

// Guards that apply to everyone on the older routes: archived groups are read-only
// (ADM-012) and adding an active student needs a free seat (ADM-025).
async function legacyGuards(req, res, next) {
  try {
    if (!req.org || req.method === 'GET') return next()
    const m = /^\/batches\/([^/]+)/.exec(req.path)
    if (m && validId(m[1])) {
      const Batch = require('../models/admin/Batch')
      const b = await Batch.findOne({ _id: m[1], orgId: req.org._id }).select('archivedAt').lean()
      if (b?.archivedAt && !(req.method === 'DELETE' && req.path === `/batches/${m[1]}`)) {
        return deny(res, 409, 'This group is archived (read-only). Its reports stay available.', 'GROUP_ARCHIVED')
      }
    }
    const addsStudent = (req.method === 'POST' && req.path === '/students')
      || (req.method === 'PATCH' && /^\/students\/[^/]+$/.test(req.path) && req.body?.status === 'active')
    if (addsStudent) {
      if (req.method === 'PATCH') {
        const Student = require('../models/admin/Student')
        const id = req.path.split('/')[2]
        const s = validId(id) ? await Student.findOne({ _id: id, orgId: req.org._id }).select('status').lean() : null
        if (!s || s.status === 'active') return next()
      }
      const err = await assertSeats(req.org._id, 1)
      if (err) return res.status(409).json({ success: false, ...err })
    }
    next()
  } catch (err) {
    console.error('legacyGuards error:', err)
    deny(res, 500, 'Internal server error')
  }
}

module.exports = { PERMS, ROLE_LABELS, can, permit, adminOnly, orgContext, staffLegacyGate, legacyGuards, allowedUnits, studentInScope }
