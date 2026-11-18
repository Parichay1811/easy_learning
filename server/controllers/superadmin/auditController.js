// Platform-wide audit log (SUP-003): search by actor, organisation, learner or
// action; export; and check the hash chain end to end (tamper evidence).
const AuditEvent = require('../../models/AuditEvent')
const SAOrg = require('../../models/superadmin/Organization')
const { audit, digest } = require('../../utils/audit')
const { h, paging, rx, sendCsv, isId } = require('./util')

async function buildFilter(qs) {
  const f = {}
  if (qs.actor) { const r = rx(qs.actor); f.$or = [{ actorEmail: r }, { actorId: String(qs.actor) }] }
  if (qs.org) {
    let orgId = String(qs.org)
    if (isId(orgId)) { const sa = await SAOrg.findById(orgId).select('adminOrgId').lean(); if (sa?.adminOrgId) orgId = sa.adminOrgId }
    f.orgId = orgId
  }
  if (qs.action) f.action = new RegExp(`^${String(qs.action).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
  if (qs.actorRole) f.actorRole = String(qs.actorRole)
  if (qs.target) { const r = rx(qs.target); f.$and = [...(f.$and || []), { $or: [{ targetId: String(qs.target) }, { targetId: r }, { 'meta.targetEmail': r }, { 'meta.email': r }] }] }
  if (qs.q) { const r = rx(qs.q); f.$and = [...(f.$and || []), { $or: [{ action: r }, { reason: r }, { actorEmail: r }, { targetId: r }] }] }
  if (qs.from || qs.to) {
    f.at = {}
    if (/^\d{4}-\d{2}-\d{2}$/.test(qs.from || '')) f.at.$gte = new Date(`${qs.from}T00:00:00Z`)
    if (/^\d{4}-\d{2}-\d{2}$/.test(qs.to || '')) f.at.$lte = new Date(`${qs.to}T23:59:59.999Z`)
  }
  return f
}

const list = h(async (req) => {
  const { limit, skip, page } = paging(req.query, { def: 50 })
  const filter = await buildFilter(req.query)
  const [total, events, actions] = await Promise.all([
    AuditEvent.countDocuments(filter),
    AuditEvent.find(filter).sort({ at: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    AuditEvent.distinct('action'),
  ])
  return { total, page, limit, events: events.map(({ prevHash, ...e }) => ({ ...e, id: String(e._id), hash: e.hash?.slice(0, 12) })), actions: actions.sort() }
})

const COLUMNS = ['at', 'actorRole', 'actorEmail', 'actorId', 'action', 'targetType', 'targetId', 'orgId', 'reason', 'ip', 'meta', 'hash'].map((key) => ({ key }))
const exportCsv = async (req, res) => {
  try {
    const filter = await buildFilter(req.query)
    const events = await AuditEvent.find(filter).sort({ at: -1, _id: -1 }).limit(50_000).lean()
    await audit(req, 'audit.export', { targetType: 'audit', meta: { filter: req.query, rows: events.length } })
    sendCsv(res, `learnigo-audit-${new Date().toISOString().slice(0, 10)}.csv`, events, COLUMNS)
  } catch (err) {
    console.error('audit export error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// Walks the whole chain oldest first. Reports the first event whose hash does
// not match its content or whose link to the one before is broken.
const verify = h(async (req) => {
  const t0 = Date.now()
  let prev = null
  let checked = 0
  let firstBreak = null
  const cursor = AuditEvent.find().sort({ at: 1, _id: 1 }).lean().cursor()
  for await (const e of cursor) {
    const contentOk = e.hash === digest(e, e.prevHash)
    const linkOk = prev === null ? true : e.prevHash === prev.hash
    if (!contentOk || !linkOk) {
      firstBreak = { id: String(e._id), at: e.at, action: e.action, problem: !contentOk ? 'The event was changed after it was written.' : 'An event before this one is missing or was changed.' }
      break
    }
    prev = e
    checked++
  }
  const total = await AuditEvent.estimatedDocumentCount()
  await audit(req, 'audit.verify', { targetType: 'audit', meta: { ok: !firstBreak, checked } })
  return { ok: !firstBreak, checked, total, firstBreak, ms: Date.now() - t0 }
})

module.exports = { list, exportCsv, verify, buildFilter }
