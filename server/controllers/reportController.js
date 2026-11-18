// Report data endpoints (FND-060) and learner-table exports (FND-062).
// Who may see what comes from utils/scopes.js, exactly like the dashboards.
const scopes = require('../utils/scopes')
const { buildReport } = require('../services/reportData')
const { exportRows } = require('../utils/exporter')
const { audit } = require('../utils/audit')
const q = require('../analytics/queries')

// [role, kind, resolver(req) -> scope]
const RESOLVERS = {
  'parent/child': ['parent', 'learner', (req) => scopes.forParentChild(req.actor, req.params.id)],
  'teacher/batch': ['teacher', 'group', (req) => scopes.forTeacherBatch(req.actor, req.params.id)],
  'teacher/student': ['teacher', 'learner', (req) => scopes.forTeacherStudent(req.actor, req.params.id)],
  'teacher/all': ['teacher', 'group', (req) => scopes.forTeacherAll(req.actor)],
  'admin/org': ['admin', 'org', (req) => scopes.forAdmin(req.actor)],
  'admin/batch': ['admin', 'group', (req) => scopes.forAdmin(req.actor, { batchId: req.params.id })],
  'admin/student': ['admin', 'learner', (req) => scopes.forAdmin(req.actor, { studentId: req.params.id })],
  'superadmin/org': ['superadmin', 'org', (req) => scopes.forSuperadminOrg(req.params.id)],
}

async function resolve(req, res, name) {
  const [role, kind, fn] = RESOLVERS[name]
  if (req.actor.role !== role) { res.status(403).json({ success: false, message: 'Not allowed' }); return null }
  const mongoose = require('mongoose')
  if (req.params.id && !mongoose.isValidObjectId(req.params.id)) { res.status(404).json({ success: false, message: 'Not found' }); return null }
  const scope = await fn(req)
  if (scope.error) { res.status(scope.error.status).json({ success: false, message: scope.error.message, code: scope.error.code }); return null }
  scope.tz = req.get('x-timezone') || req.query.tz || 'UTC'
  if (!scope.orgId && role === 'teacher') scope.orgId = req.actor.orgId
  if (name === 'admin/batch') {
    // forAdmin with an unknown batch just returns nobody; make that a 404.
    const Batch = require('../models/admin/Batch')
    if (!(await Batch.exists({ _id: req.params.id, orgId: scope.orgId }))) { res.status(404).json({ success: false, message: 'Group not found' }); return null }
    const b = await Batch.findById(req.params.id).select('name').lean()
    scope.who = b.name
  }
  return { scope, kind, role }
}

const report = (name) => async (req, res) => {
  try {
    const r = await resolve(req, res, name)
    if (!r) return
    const data = await buildReport(r.scope, r.kind, { ...req.query, tz: r.scope.tz })
    if (r.role === 'superadmin') await audit(req, 'report.view', { targetType: 'organization', targetId: req.params.id, orgId: r.scope.orgId })
    res.json({ success: true, report: data })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    console.error('report error:', err); res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// The learner table of a group/school report as CSV or XLSX.
const exportLearners = (name) => async (req, res) => {
  try {
    const r = await resolve(req, res, name)
    if (!r) return
    const { range, rows } = await q.perLearner(r.scope.emails, { from: req.query.from, to: req.query.to, tz: r.scope.tz })
    const names = r.scope.names || {}
    await exportRows(req, res, {
      filename: `${r.scope.who || 'learners'}-${range.from}-to-${range.to}`, format: req.query.format, sheetName: 'Learners',
      columns: [
        { key: 'name', header: 'Learner', width: 24, value: (x) => names[x.email] || x.email.split('@')[0] },
        { key: 'minutes', header: 'Minutes', value: (x) => Math.round(x.minutes) },
        { key: 'answered', header: 'Questions answered' },
        { key: 'accuracy', header: 'Accuracy %' },
        { key: 'activeDays', header: 'Active days' },
        { key: 'consistency', header: 'Consistency %' },
        { key: 'engagement', header: 'Engagement (0-100)' },
        { key: 'lastActive', header: 'Last active' },
        { key: 'atRisk', header: 'Needs a nudge', value: (x) => (x.atRisk ? 'yes' : 'no') },
      ],
      rows,
      audit: { action: 'export.learners', targetType: r.kind, targetId: req.params.id || r.scope.orgId || '', orgId: r.scope.orgId, meta: { from: range.from, to: range.to } },
    })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    console.error('export error:', err); if (!res.headersSent) res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { report, exportLearners, RESOLVERS }
