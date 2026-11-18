// The data-rights queue API for the super admin (FND-071; the queue UI is SUP-060).
//   GET  /api/superadmin/data-requests?status=pending
//   POST /api/superadmin/data-requests/:id/approve   (delete -> 'processing', erased once dueAt passes)
//   POST /api/superadmin/data-requests/:id/reject  { note }
//   POST /api/superadmin/data-requests/run-due      (erase every approved request past its grace period)
const express = require('express')
const router = express.Router()
const superadminAuth = require('../middleware/superadminAuth')
const DataRequest = require('../models/DataRequest')
const rights = require('../services/dataRights')
const { audit } = require('../utils/audit')

router.use(superadminAuth)
router.use((req, res, next) => { req.actor = { role: 'superadmin', id: req.superadmin.email, email: req.superadmin.email, name: req.superadmin.name }; next() })

const wrap = (fn) => async (req, res) => {
  try { await fn(req, res) } catch (err) { console.error('dataRequests error:', err); res.status(500).json({ success: false, message: 'Internal server error' }) }
}
const validId = (id) => /^[a-f0-9]{24}$/i.test(String(id || ''))

router.get('/', wrap(async (req, res) => {
  const f = {}
  if (['pending', 'processing', 'done', 'rejected'].includes(req.query.status)) f.status = req.query.status
  if (['export', 'delete'].includes(req.query.kind)) f.kind = req.query.kind
  const list = await DataRequest.find(f).sort({ createdAt: -1 }).limit(200).lean()
  res.json({ success: true, requests: list })
}))

router.post('/run-due', wrap(async (req, res) => {
  const done = await rights.runDueDeletions()
  for (const d of done) await audit(req, 'learner.erase', { targetType: 'data_request', targetId: d.id, meta: d.counts })
  res.json({ success: true, erased: done.length, done })
}))

router.post('/:id/approve', wrap(async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ success: false, message: 'Request not found' })
  const r = await rights.approveRequest(req.params.id, req.superadmin.email)
  if (!r) return res.status(404).json({ success: false, message: 'Request not found or already handled' })
  await audit(req, 'data_request.approve', { targetType: 'data_request', targetId: String(r._id), orgId: r.orgId || '' })
  res.json({ success: true, request: r })
}))

router.post('/:id/reject', wrap(async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ success: false, message: 'Request not found' })
  const r = await rights.rejectRequest(req.params.id, req.superadmin.email, req.body?.note)
  if (!r) return res.status(404).json({ success: false, message: 'Request not found or already handled' })
  await audit(req, 'data_request.reject', { targetType: 'data_request', targetId: String(r._id), orgId: r.orgId || '', reason: String(req.body?.note || '') })
  res.json({ success: true, request: r })
}))

module.exports = router
