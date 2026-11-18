// Who is calling? (FND-010, interim). Each role still has its own login and
// token; this reads whichever one is present and returns one shape, so shared
// routes (notifications, entitlements, messaging) work for every role.
const jwt = require('jsonwebtoken')

const TRIES = [
  { secret: 'PARENT_JWT_SECRET', role: 'parent', claim: 'parent' },
  { secret: 'ADMIN_JWT_SECRET', role: 'admin', claim: 'org_admin' },
  // School staff (ADM-023): coordinator / office / viewer. NOT 'admin', so requireRole('admin') refuses them.
  { secret: 'ADMIN_JWT_SECRET', role: 'staff', claim: 'org_staff' },
  { secret: 'TEACHER_JWT_SECRET', role: 'teacher', claim: 'teacher' },
  { secret: 'SUPERADMIN_JWT_SECRET', role: 'superadmin', claim: 'superadmin' },
]

function actorFromRequest(req) {
  const auth = req.headers?.authorization
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7)
    for (const t of TRIES) {
      if (!process.env[t.secret]) continue
      try {
        const p = jwt.verify(token, process.env[t.secret])
        if (p.role === t.claim) return { role: t.role, id: String(p.id || p.email), email: p.email, name: p.name, orgId: p.orgId ? String(p.orgId) : null, uid: p.uid, ...(p.staffRole ? { staffRole: p.staffRole, staffId: String(p.staffId) } : {}) }
      } catch { /* try the next role */ }
    }
    if (process.env.JWT_SECRET) {
      try {
        const p = jwt.verify(token, process.env.JWT_SECRET)
        if (!p.role) return { role: 'student', id: String(p.id || p.email), email: p.email, name: p.name, orgId: null }
      } catch { /* not a student token */ }
    }
  }
  const signed = req.signedCookies?.user_session
  if (signed) {
    try {
      const u = JSON.parse(signed)
      if (u?.email) return { role: 'student', id: String(u.uid || u.email), email: u.email, name: u.name || '', orgId: null }
    } catch { /* ignore */ }
  }
  return null
}

// Express middleware: 401 unless somebody is signed in, otherwise sets req.actor.
function anyAuth(req, res, next) {
  const actor = actorFromRequest(req)
  if (!actor) return res.status(401).json({ success: false, message: 'Not signed in' })
  req.actor = actor
  next()
}

// Role gate for shared routes: authorize('admin', 'teacher')
const requireRole = (...roles) => (req, res, next) => {
  if (!req.actor || !roles.includes(req.actor.role)) return res.status(403).json({ success: false, message: 'Not allowed' })
  next()
}

module.exports = { actorFromRequest, anyAuth, requireRole }
