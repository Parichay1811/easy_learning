// Stay signed in until you sign out (POST /api/auth/renew).
//
// A signed-in learner, parent, teacher or school admin should not be asked to sign in
// again just because a week went by. The page sends its current, still-valid token;
// the answer is a fresh token with the same claims and a full lifetime. Because the
// tokens are stateless, a renewal checks that the account still exists and is still
// allowed in (a disabled teacher, removed school staff or deleted account cannot keep
// a session going). Never renewed: support "view as" tokens (`imp`, short on purpose)
// and Learnigo staff (super admin) sessions.
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

const FAMILIES = [
  { role: 'parent', secret: 'PARENT_JWT_SECRET', claim: 'parent', expiresEnv: 'PARENT_JWT_EXPIRES_IN',
    still: (p) => require('../models/ParentAccount').exists({ _id: p.id }) },
  { role: 'admin', secret: 'ADMIN_JWT_SECRET', claim: 'org_admin', expiresEnv: 'ADMIN_JWT_EXPIRES_IN',
    still: (p) => require('../models/admin/OrgAdmin').exists({ _id: p.id }) },
  { role: 'staff', secret: 'ADMIN_JWT_SECRET', claim: 'org_staff', expiresEnv: 'ADMIN_JWT_EXPIRES_IN',
    still: (p) => p.staffId && require('../models/admin/OrgStaff').exists({ _id: p.staffId, orgId: p.orgId, status: 'active' }) },
  { role: 'teacher', secret: 'TEACHER_JWT_SECRET', claim: 'teacher', expiresEnv: 'TEACHER_JWT_EXPIRES_IN',
    still: (p) => require('../models/admin/Tutor').exists({ _id: p.id, authStatus: { $ne: 'disabled' }, status: { $ne: 'inactive' } }) },
  { role: 'student', secret: 'JWT_SECRET', claim: undefined, expiresEnv: 'JWT_EXPIRES_IN',
    still: (p) => (p.managed
      ? require('../models/ManagedLearner').exists({ _id: p.id, status: 'active' })
      : require('../models/User').exists({ _id: p.id })) },
]

const DROP = new Set(['iat', 'exp', 'nbf', 'jti'])

function verifyAny(token) {
  for (const f of FAMILIES) {
    const secret = process.env[f.secret]
    if (!secret) continue
    let p
    try { p = jwt.verify(token, secret) } catch { continue }
    if (f.claim === undefined ? !p.role : p.role === f.claim) return { family: f, payload: p }
  }
  return null
}

async function renewSession(req, res) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const found = token && verifyAny(token)
  if (!found) return res.status(401).json({ success: false, message: 'Not signed in' })
  const { family, payload } = found
  if (payload.imp) return res.status(403).json({ success: false, message: 'Support sessions are not renewed' })
  // Students signed in with Google carry their Google id (not a database id): Google's
  // own sign-in refreshes those on every visit, so there is nothing to do here.
  if (!mongoose.isValidObjectId(String(payload.id || ''))) return res.json({ success: true, renewed: false })
  try {
    if (!(await family.still(payload))) return res.status(401).json({ success: false, message: 'This account is no longer active' })
  } catch {
    return res.status(503).json({ success: false, message: 'Try again later' })
  }
  const claims = Object.fromEntries(Object.entries(payload).filter(([k]) => !DROP.has(k)))
  const fresh = jwt.sign(claims, process.env[family.secret], { expiresIn: process.env[family.expiresEnv] || '30d' })
  return res.json({ success: true, renewed: true, role: family.role, token: fresh })
}

module.exports = { renewSession, verifyAny }
