// One guard in front of every /api route (mounted once in server.js). It reads
// whichever role token is present and enforces the platform-wide rules that no
// single role router can:
//   1. "View as" tokens (SUP-002) are READ-ONLY: any method other than
//      GET/HEAD/OPTIONS is refused (403 VIEW_AS_READ_ONLY), as are GET routes
//      with side effects (chat threads mark messages read). An ended or expired
//      view-as session is refused too.
//   2. Revoked sessions (SUP-012 / FND-074): tokens of an account issued
//      before its SessionRevocation are refused (401 SESSION_REVOKED).
//   3. Suspended organisations (SUP-014 / SUP-062): their admins and teachers
//      get 403 ORG_SUSPENDED, except a few reads to show the notice.
//   4. Activity: the first request of each account each day is recorded in
//      ActorDay (DAU/WAU/MAU by role, last admin login). View-as never counts.
const jwt = require('jsonwebtoken')

const SECRET_FOR = { parent: 'PARENT_JWT_SECRET', org_admin: 'ADMIN_JWT_SECRET', teacher: 'TEACHER_JWT_SECRET', superadmin: 'SUPERADMIN_JWT_SECRET' }
const ROLE_FOR = { parent: 'parent', org_admin: 'admin', teacher: 'teacher', superadmin: 'superadmin' }
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS'])
// GETs that write (mark-as-read) are closed to view-as as well.
// GETs that change something (marking messages read) or show private messages: refused while viewing as someone.
const SIDE_EFFECT_GETS = [
  /^\/api\/(admin|parent|teacher)\/chat\/?$/, /^\/api\/(admin|parent|teacher)\/messages\/[^/]+\/?$/,
  /^\/api\/messages\/threads\/[^/]+\/messages\/?$/, /^\/api\/messages\/attachments\//,
]
const VIEW_AS_END = '/api/view-as/end'
const SUSPENDED_ALLOWED = [/^\/api\/admin\/(org|profile)\/?$/, /^\/api\/(me|status|entitlements)\/?$/, /^\/api\/notifications/]

const lazy = (p) => () => require(p)
const models = {
  ActorDay: lazy('../models/superadmin/ActorDay'),
  SessionRevocation: lazy('../models/superadmin/SessionRevocation'),
  ViewAsSession: lazy('../models/superadmin/ViewAsSession'),
  SAOrg: lazy('../models/superadmin/Organization'),
}

// ── caches (one process; refreshed every 30 s and at once on local changes) ──
const state = { revocations: new Map(), suspended: new Set(), loadedAt: 0, loading: null }
async function load() {
  const [revs, orgs] = await Promise.all([
    models.SessionRevocation().find().select('role id before').lean(),
    models.SAOrg().find({ suspendedAt: { $ne: null } }).select('adminOrgId').lean(),
  ])
  state.revocations = new Map(revs.map((r) => [`${r.role}:${r.id}`, new Date(r.before).getTime()]))
  state.suspended = new Set(orgs.map((o) => String(o.adminOrgId)).filter(Boolean))
  state.loadedAt = Date.now()
}
async function fresh() {
  if (Date.now() - state.loadedAt < 30_000) return
  if (!state.loading) state.loading = load().catch((e) => { console.error('platformGuard load:', e.message); state.loadedAt = Date.now() }).finally(() => { state.loading = null })
  await state.loading
}
const refresh = () => { state.loadedAt = 0; return fresh() }

const viewAsCache = new Map()
async function viewAsEnded(sid) {
  const hit = viewAsCache.get(sid)
  if (hit && Date.now() - hit.at < 5000) return hit.ended
  const s = await models.ViewAsSession().findById(sid).select('endedAt expiresAt').lean().catch(() => null)
  const ended = !s || !!s.endedAt || new Date(s.expiresAt) < new Date()
  viewAsCache.set(sid, { at: Date.now(), ended })
  if (viewAsCache.size > 2000) viewAsCache.clear()
  return ended
}
const forgetViewAs = (sid) => viewAsCache.delete(String(sid))

// ── activity ───────────────────────────────────────────────────────────────
let seenDay = ''
const seen = new Set()
function recordActivity(role, id, orgId) {
  if (!id) return
  const date = new Date().toISOString().slice(0, 10)
  if (date !== seenDay) { seen.clear(); seenDay = date }
  const key = `${role}:${id}`
  if (seen.has(key)) return
  seen.add(key)
  models.ActorDay().updateOne({ role, id, date }, { $setOnInsert: { orgId: orgId || '', firstAt: new Date() } }, { upsert: true }).catch(() => seen.delete(key))
}

function readToken(req) {
  const auth = req.headers.authorization
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7)
    const claims = jwt.decode(token)
    if (!claims || typeof claims !== 'object') return null
    const secretName = claims.role ? SECRET_FOR[claims.role] : 'JWT_SECRET'
    if (!secretName || !process.env[secretName]) return null
    try {
      const p = jwt.verify(token, process.env[secretName])
      return { payload: p, role: claims.role ? ROLE_FOR[claims.role] : 'student', id: String(p.staffId || p.id || p.email || '') }
    } catch { return null } // the role's own middleware answers 401
  }
  const signed = req.signedCookies?.user_session
  if (signed) {
    try {
      const u = JSON.parse(signed)
      if (u?.email) return { payload: {}, role: 'student', id: String(u.uid || u.email), cookie: true }
    } catch { /* ignore */ }
  }
  return null
}

const deny = (res, status, code, message) => res.status(status).json({ success: false, code, message })

async function platformGuard(req, res, next) {
  if (!req.path.startsWith('/api/')) return next()
  const who = readToken(req)
  if (!who) return next()
  try {
    const p = who.payload
    if (p.imp) {
      const isEnd = req.method === 'POST' && req.path === VIEW_AS_END
      if (!SAFE.has(req.method) && !isEnd) return deny(res, 403, 'VIEW_AS_READ_ONLY', 'You are viewing as this person, read-only. Changes are not possible.')
      if (SIDE_EFFECT_GETS.some((re) => re.test(req.path))) return deny(res, 403, 'VIEW_AS_PRIVATE', 'Messages are not shown while viewing as someone.')
      if (!isEnd && await viewAsEnded(p.imp.sid)) return deny(res, 401, 'VIEW_AS_ENDED', 'This view-as session has ended.')
      req.viewAs = { ...p.imp, role: who.role, id: who.id }
      return next()
    }
    await fresh()
    // Learners are keyed by email (they have several ways to sign in).
    const before = state.revocations.get(`${who.role}:${who.role === 'student' ? String(p.email || '').toLowerCase() : who.id}`)
    if (before && !who.cookie && (p.iat || 0) * 1000 < before) return deny(res, 401, 'SESSION_REVOKED', 'You have been signed out. Please sign in again.')
    const orgId = p.orgId ? String(p.orgId) : ''
    if (orgId && (who.role === 'admin' || who.role === 'teacher') && state.suspended.has(orgId) && !SUSPENDED_ALLOWED.some((re) => re.test(req.path))) {
      return deny(res, 403, 'ORG_SUSPENDED', 'This organisation is suspended. Contact Learnigo support.')
    }
    recordActivity(who.role, who.id, orgId)
    next()
  } catch (err) {
    console.error('platformGuard error:', err)
    next()
  }
}

module.exports = platformGuard
module.exports.refresh = refresh
module.exports.forgetViewAs = forgetViewAs
module.exports.SIDE_EFFECT_GETS = SIDE_EFFECT_GETS
