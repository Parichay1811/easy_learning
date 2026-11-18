const jwt = require('jsonwebtoken')

// Super admin console auth (SUP-001). Accepts a staff session token (named
// staff, or the env break-glass owner) and sets:
//   req.superadmin = { email, name, role: 'superadmin', staffId, staffRole, sid, breakGlass }
//   req.actor      = { role: 'superadmin', id, email, name, staffRole } (for audit())
// Sessions can be revoked (StaffSession.revokedAt) and disabled staff are refused
// at once. A token without a session id is an older break-glass token: it is
// treated as the owner and refused if issued before `staff.breakGlassNotBefore`.
let notBefore = { at: 0, value: 0 }
async function breakGlassNotBefore() {
  if (Date.now() - notBefore.at < 10_000) return notBefore.value
  try {
    const GlobalSettings = require('../models/superadmin/GlobalSettings')
    const s = await GlobalSettings.findOne({ key: 'staff.breakGlassNotBefore' }).lean()
    notBefore = { at: Date.now(), value: s ? new Date(s.value).getTime() : 0 }
  } catch { notBefore = { at: Date.now(), value: notBefore.value } }
  return notBefore.value
}
breakGlassNotBefore.reset = () => { notBefore = { at: 0, value: 0 } }

const deny = (res, status, message, code) => res.status(status).json({ success: false, message, code })

const superadminAuth = async (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return deny(res, 401, 'No token provided')

  let payload
  try {
    payload = jwt.verify(auth.split(' ')[1], process.env.SUPERADMIN_JWT_SECRET)
  } catch {
    return deny(res, 401, 'Invalid or expired token')
  }
  if (payload.role !== 'superadmin') return deny(res, 403, 'Forbidden')

  try {
    let staffRole = 'owner'
    let staffId = ''
    let name = payload.name
    let breakGlass = true
    if (payload.sid) {
      const { sessionState } = require('../services/staffAuth')
      const { session, staff } = await sessionState(payload.sid)
      if (!session || session.revokedAt || new Date(session.expiresAt) < new Date()) return deny(res, 401, 'Your session has ended. Please sign in again.', 'SESSION_REVOKED')
      breakGlass = !!session.breakGlass
      if (!breakGlass) {
        if (!staff || staff.status !== 'active') return deny(res, 401, 'This staff account is disabled.', 'STAFF_DISABLED')
        staffRole = staff.role // the current role, so a change applies at once
        staffId = String(staff._id)
        name = staff.name
      }
    }
    if (breakGlass) {
      const nb = await breakGlassNotBefore()
      if (nb && (payload.iat || 0) * 1000 < nb) return deny(res, 401, 'Your session has ended. Please sign in again.', 'SESSION_REVOKED')
    }
    req.superadmin = { ...payload, name, staffId, staffRole, breakGlass }
    req.actor = { role: 'superadmin', id: staffId || `breakglass:${payload.email}`, email: payload.email, name, orgId: null, staffRole }
    next()
  } catch (err) {
    console.error('superadminAuth error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// Role gate for console routes: requireStaffRole('support', 'finance'). Owners pass everything.
const requireStaffRole = (...roles) => (req, res, next) => {
  const r = req.superadmin?.staffRole
  if (r === 'owner' || roles.includes(r)) return next()
  return deny(res, 403, 'Your staff role does not allow this.', 'STAFF_ROLE')
}

module.exports = superadminAuth
module.exports.requireStaffRole = requireStaffRole
module.exports.breakGlassNotBefore = breakGlassNotBefore
