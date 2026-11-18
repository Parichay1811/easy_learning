// A learner's consent history (FND-070): parents for their own children,
// admins for students of their school, the super admin for anyone (audited).
const mongoose = require('mongoose')
const consent = require('../utils/consent')
const { audit } = require('../utils/audit')
const { adminOrgId } = require('../services/commsLinks')

const isId = (id) => mongoose.isValidObjectId(String(id || ''))
const err500 = (res, e) => { console.error('consent error:', e); res.status(500).json({ success: false, message: 'Internal server error' }) }

// -> { email, name, childId?, studentId?, orgId? } or null (not yours / not found)
async function subjectFor(req, { childId, studentId }) {
  const a = req.actor
  if (a.role === 'parent' && isId(childId)) {
    const Child = require('../models/Child')
    const c = await Child.findOne({ _id: childId, parentId: a.id }).select('name email').lean()
    return c && { email: c.email, name: c.name, childId: String(c._id) }
  }
  if ((a.role === 'admin' || a.role === 'superadmin') && isId(studentId)) {
    const Student = require('../models/admin/Student')
    const filter = { _id: studentId }
    if (a.role === 'admin') { const orgId = await adminOrgId(a); if (!orgId) return null; filter.orgId = orgId }
    const s = await Student.findOne(filter).select('name email orgId').lean()
    return s && s.email ? { email: s.email, name: s.name, studentId: String(s._id), orgId: String(s.orgId) } : null
  }
  return null
}

const history = async (req, res) => {
  try {
    const subject = await subjectFor(req, req.query)
    if (!subject) return res.status(404).json({ success: false, message: 'Learner not found' })
    const rows = await consent.consentHistory(subject.email, { limit: Number(req.query.limit) || 100 })
    if (req.actor.role === 'superadmin') await audit(req, 'consent.view', { targetType: 'learner', targetId: subject.studentId, orgId: subject.orgId })
    const latest = {}
    for (const r of rows) if (!latest[r.purpose]) latest[r.purpose] = r.status
    res.json({ success: true, learner: { name: subject.name }, current: latest, items: rows.map(consent.publicView), policyVersion: consent.CURRENT_POLICY_VERSION })
  } catch (e) { err500(res, e) }
}

// POST { childId | studentId, purpose, status: 'given'|'withdrawn' }
const record = async (req, res) => {
  try {
    if (!['parent', 'admin'].includes(req.actor.role)) return res.status(403).json({ success: false, message: 'Not allowed' })
    const subject = await subjectFor(req, req.body)
    if (!subject) return res.status(404).json({ success: false, message: 'Learner not found' })
    const r = await consent.recordConsent(req, {
      subjectEmail: subject.email, subjectName: subject.name, childId: subject.childId, studentId: subject.studentId, orgId: subject.orgId,
      purpose: req.body.purpose, status: req.body.status || 'given',
      legalBasis: req.actor.role === 'admin' ? (req.body.legalBasis || 'public_task') : 'consent',
      method: req.actor.role === 'admin' ? 'school_dpa' : 'settings',
    })
    if (r.error) return res.status(400).json({ success: false, message: r.error })
    await audit(req, `consent.${r.status}`, { targetType: 'learner', targetId: subject.studentId || subject.childId, orgId: subject.orgId, meta: { purpose: r.purpose, policyVersion: r.policyVersion } })
    res.status(201).json({ success: true, record: consent.publicView(r) })
  } catch (e) { err500(res, e) }
}

module.exports = { history, record }
