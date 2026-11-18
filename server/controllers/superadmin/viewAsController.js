// "View as" (SUP-002): a support person sees exactly what an admin, teacher or
// parent sees. It needs a reason, lasts 30 minutes, is read-only (the platform
// guard refuses every write and side-effecting read for these tokens), is
// always audited under that organisation, and the org's admins are notified.
const jwt = require('jsonwebtoken')
const ViewAsSession = require('../../models/superadmin/ViewAsSession')
const { audit } = require('../../utils/audit')
const { notify } = require('../../utils/notify')
const { forgetViewAs } = require('../../middleware/platformGuard')
const { h, fail, needId, paging } = require('./util')

const MINUTES = 30
const TARGETS = {
  admin: { secret: 'ADMIN_JWT_SECRET', claim: 'org_admin', storageKey: 'admin_jwt', path: '/admin-dashboard', model: () => require('../../models/admin/OrgAdmin') },
  teacher: { secret: 'TEACHER_JWT_SECRET', claim: 'teacher', storageKey: 'teacher_jwt', path: '/teacher-dashboard', model: () => require('../../models/admin/Tutor') },
  parent: { secret: 'PARENT_JWT_SECRET', claim: 'parent', storageKey: 'parent_jwt', path: '/parent-dashboard', model: () => require('../../models/ParentAccount') },
}

async function notifyOrgAdmins(orgId, { title, body }) {
  if (!orgId) return
  const OrgAdmin = require('../../models/admin/OrgAdmin')
  const admins = await OrgAdmin.find({ orgId }).select('_id').lean()
  if (admins.length) await notify(admins.map((a) => ({ role: 'admin', id: String(a._id) })), { kind: 'security', title, body, link: '/admin-dashboard?section=audit' })
}

const start = h(async (req) => {
  const { targetRole, targetId } = req.body || {}
  const reason = String(req.body?.reason || '').trim()
  const t = TARGETS[targetRole]
  if (!t) throw fail(400, 'Choose who to view as: admin, teacher or parent.')
  if (reason.length < 10) throw fail(400, 'Say why you need to view as this person (at least 10 characters).', 'REASON_REQUIRED')
  needId(targetId, 'Account')
  const target = await t.model().findById(targetId).lean()
  if (!target) throw fail(404, 'Account not found')
  if (!process.env[t.secret]) throw fail(503, 'This role is not configured on this server.')
  if (targetRole === 'teacher' && target.authStatus === 'disabled') throw fail(400, 'This teacher account is disabled.')
  const orgId = target.orgId ? String(target.orgId) : ''
  const expiresAt = new Date(Date.now() + MINUTES * 60_000)
  const s = req.superadmin
  const session = await ViewAsSession.create({
    staffId: s.staffId, staffEmail: s.email, staffName: s.name, targetRole, targetId: String(target._id),
    targetName: target.name || '', targetEmail: target.email || '', orgId, reason, expiresAt, ip: req.ip || '',
  })
  const payload = {
    id: String(target._id), uid: target.uid || '', email: target.email, name: target.name || '', role: t.claim,
    ...(orgId ? { orgId } : {}),
    imp: { sid: String(session._id), staffId: s.staffId, by: s.email, byName: s.name, reason: reason.slice(0, 200) },
  }
  const token = jwt.sign(payload, process.env[t.secret], { expiresIn: `${MINUTES}m` })
  await audit(req, 'support.view_as.start', { targetType: targetRole, targetId: String(target._id), orgId, reason, meta: { sessionId: String(session._id), targetEmail: target.email, minutes: MINUTES } })
  await notifyOrgAdmins(orgId, { title: 'Learnigo support viewed your school', body: `${s.name} (Learnigo support) is viewing as ${target.name || target.email} (${targetRole}), read-only, for up to ${MINUTES} minutes. Reason: ${reason}` })
  return {
    token, storageKey: t.storageKey, path: t.path, expiresAt, sessionId: String(session._id),
    target: { role: targetRole, id: String(target._id), name: target.name || '', email: target.email || '', orgId },
  }
})

async function endSession(sessionId, actorReq) {
  const session = await ViewAsSession.findOneAndUpdate({ _id: sessionId, endedAt: null }, { endedAt: new Date() }, { new: true })
  forgetViewAs(sessionId)
  if (session) await audit(actorReq, 'support.view_as.end', { targetType: session.targetRole, targetId: session.targetId, orgId: session.orgId, meta: { sessionId: String(session._id) } })
  return session
}

// Ended from the console.
const end = h(async (req) => {
  needId(req.params.id, 'Session')
  const s = await ViewAsSession.findById(req.params.id).lean()
  if (!s) throw fail(404, 'Session not found')
  if (req.superadmin.staffRole !== 'owner' && s.staffEmail !== req.superadmin.email) throw fail(403, 'Only the person who started it, or an owner, can end it.')
  await endSession(req.params.id, req)
  return { ended: true }
})

// Ended from the orange banner, with the view-as token itself (the one write it may do).
const endFromBanner = async (req, res) => {
  try {
    const imp = req.viewAs
    if (!imp?.sid) return res.status(400).json({ success: false, message: 'Not a view-as session.' })
    req.actor = { role: 'superadmin', id: imp.staffId || `breakglass:${imp.by}`, email: imp.by, name: imp.byName, orgId: null }
    await endSession(imp.sid, req)
    res.json({ success: true })
  } catch (err) {
    console.error('view-as end error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const list = h(async (req) => {
  const { limit, skip, page } = paging(req.query, { def: 30 })
  const filter = {}
  if (req.query.orgId) filter.orgId = String(req.query.orgId)
  if (req.query.active === '1') Object.assign(filter, { endedAt: null, expiresAt: { $gt: new Date() } })
  const [total, sessions] = await Promise.all([ViewAsSession.countDocuments(filter), ViewAsSession.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()])
  return { total, page, sessions: sessions.map((s) => ({ ...s, id: String(s._id), active: !s.endedAt && new Date(s.expiresAt) > new Date() })) }
})

module.exports = { start, end, endFromBanner, list, MINUTES }
