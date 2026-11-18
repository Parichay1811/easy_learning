const crypto = require('crypto')
const AuditEvent = require('../models/AuditEvent')

const digest = (e, prev) => crypto.createHash('sha256').update(JSON.stringify([prev, e.at.toISOString(), e.actorRole, e.actorId, e.action, e.targetType, e.targetId, e.orgId, e.reason, e.meta || null])).digest('hex')

// audit(req, 'learner.view', { targetType:'learner', targetId, orgId, reason, meta }). Never throws.
async function audit(req, action, { targetType = '', targetId = '', orgId = '', reason = '', meta } = {}) {
  try {
    const a = req.actor || {}
    const last = await AuditEvent.findOne().sort({ at: -1, _id: -1 }).select('hash').lean()
    const e = new AuditEvent({
      actorRole: a.role || 'system', actorId: a.id || '', actorEmail: a.email || '', action, targetType, targetId: String(targetId || ''),
      orgId: String(orgId || a.orgId || ''), reason, meta, ip: req.ip || '', prevHash: last?.hash || '',
    })
    e.hash = digest(e, e.prevHash)
    await e.save()
    return e
  } catch (err) {
    console.error('audit failed:', err.message)
    return null
  }
}

// True when the chain from `events` (oldest first) is intact.
const verifyChain = (events) => events.every((e, i) => e.hash === digest(e, e.prevHash) && (i === 0 || e.prevHash === events[i - 1].hash))

module.exports = { audit, verifyChain, digest }
