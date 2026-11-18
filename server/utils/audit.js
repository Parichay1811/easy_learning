const crypto = require('crypto')
const AuditEvent = require('../models/AuditEvent')

const digest = (e, prev) => crypto.createHash('sha256').update(JSON.stringify([prev, e.at.toISOString(), e.actorRole, e.actorId, e.action, e.targetType, e.targetId, e.orgId, e.reason, e.meta || null])).digest('hex')

// Writes are queued one after another so two events at the same moment can't
// both link to the same previous hash (which would look like a broken chain).
let tail = Promise.resolve()
const audit = (...args) => {
  const run = tail.then(() => write(...args))
  tail = run.catch(() => null)
  return run
}

// Stored exactly as it will be read back, so the hash still matches later:
// no undefined values, dates and ids as strings, no empty objects (Mongo drops them).
function plain(v) {
  if (v === undefined) return undefined
  const strip = (x) => {
    if (!x || typeof x !== 'object' || Array.isArray(x)) return x
    for (const k of Object.keys(x)) { x[k] = strip(x[k]); if (x[k] && typeof x[k] === 'object' && !Array.isArray(x[k]) && !Object.keys(x[k]).length) delete x[k] }
    return x
  }
  const out = strip(JSON.parse(JSON.stringify(v)))
  return out && typeof out === 'object' && !Array.isArray(out) && !Object.keys(out).length ? undefined : out
}

// audit(req, 'learner.view', { targetType:'learner', targetId, orgId, reason, meta }). Never throws.
async function write(req, action, { targetType = '', targetId = '', orgId = '', reason = '', meta } = {}) {
  try {
    meta = plain(meta)
    reason = String(reason || '')
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
