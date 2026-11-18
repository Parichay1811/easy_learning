// Staff sign-in for the super admin console (SUP-001 / FND-014 / FND-074):
// named accounts with roles, bcrypt passwords, TOTP for everyone, lockout,
// throttling and revocable sessions. The env account (SUPER_ADMIN_EMAIL /
// SUPER_ADMIN_PASSWORD) is a break-glass owner: it still signs in, every use is
// audited, and with SUPER_ADMIN_TOTP_SECRET set it needs a code too.
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
// Models load lazily: the throttle and challenge helpers work without a database.
const Staff = { findById: (...a) => require('../models/superadmin/Staff').findById(...a) }
const StaffSession = new Proxy({}, { get: (_, k) => { const M = require('../models/superadmin/StaffSession'); return typeof M[k] === 'function' ? M[k].bind(M) : M[k] } })

const SESSION_HOURS = Number(process.env.STAFF_SESSION_HOURS) || 12
const MAX_FAILURES = 5
const LOCK_MINUTES = 15
const CHALLENGE_MINUTES = 10

// ── throttling: attempts per IP in a sliding window ───────────────────────────
const ipHits = new Map()
function throttled(ip, { limit = Number(process.env.STAFF_LOGIN_IP_LIMIT) || 30, windowMs = 15 * 60_000, now = Date.now() } = {}) {
  const key = ip || 'unknown'
  const hits = (ipHits.get(key) || []).filter((t) => now - t < windowMs)
  hits.push(now)
  ipHits.set(key, hits)
  if (ipHits.size > 10_000) ipHits.clear() // never grows without bound
  return hits.length > limit
}

// ── the break-glass account's lockout lives in memory (it has no DB row) ─────
const breakGlass = { failures: 0, lockedUntil: 0 }
const isBreakGlassEmail = (email) => !!process.env.SUPER_ADMIN_EMAIL && String(email).toLowerCase() === process.env.SUPER_ADMIN_EMAIL.toLowerCase()
const safeEqual = (a, b) => {
  const x = crypto.createHash('sha256').update(String(a)).digest()
  const y = crypto.createHash('sha256').update(String(b)).digest()
  return crypto.timingSafeEqual(x, y)
}
const breakGlassPasswordOk = (password) => !!process.env.SUPER_ADMIN_PASSWORD && safeEqual(password, process.env.SUPER_ADMIN_PASSWORD)

function breakGlassLocked(now = Date.now()) { return breakGlass.lockedUntil > now ? new Date(breakGlass.lockedUntil) : null }
function breakGlassFail(now = Date.now()) {
  breakGlass.failures++
  if (breakGlass.failures >= MAX_FAILURES) { breakGlass.lockedUntil = now + LOCK_MINUTES * 60_000; breakGlass.failures = 0; return true }
  return false
}
function breakGlassOk() { breakGlass.failures = 0; breakGlass.lockedUntil = 0 }

// ── staff lockout, persisted ─────────────────────────────────────────────────
async function recordFailure(staff) {
  staff.failedLogins = (staff.failedLogins || 0) + 1
  let locked = false
  if (staff.failedLogins >= MAX_FAILURES) {
    staff.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000)
    staff.failedLogins = 0
    locked = true
  }
  await staff.save()
  return locked
}
const isLocked = (staff) => staff.lockedUntil && staff.lockedUntil > new Date()

// ── short-lived challenge tokens between password and code ─────────────────
// Signed with the console secret but with a different role claim, so they can
// never pass as a session token.
const CHALLENGE_ROLE = 'staff-challenge'
const signChallenge = (staffId, purpose) => jwt.sign({ role: CHALLENGE_ROLE, staffId, purpose }, process.env.SUPERADMIN_JWT_SECRET, { expiresIn: `${CHALLENGE_MINUTES}m` })
function readChallenge(token, purpose) {
  try {
    const p = jwt.verify(String(token || ''), process.env.SUPERADMIN_JWT_SECRET)
    return p.role === CHALLENGE_ROLE && p.purpose === purpose ? p : null
  } catch { return null }
}

// ── sessions ──────────────────────────────────────────────────────────────
async function issueSession({ staff, req }) {
  const bg = !staff
  const email = bg ? process.env.SUPER_ADMIN_EMAIL : staff.email
  const name = bg ? 'Break-glass owner' : staff.name
  const role = bg ? 'owner' : staff.role
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3600_000)
  const session = await StaffSession.create({
    staffId: bg ? '' : String(staff._id), email, name, role, breakGlass: bg, expiresAt,
    ip: req.ip || '', userAgent: String(req.get?.('user-agent') || '').slice(0, 200),
  })
  // `id` lets shared routes (notifications) address this person: the staff id, or the email for break-glass.
  const payload = { id: bg ? email : String(staff._id), email, role: 'superadmin', name, staffId: bg ? '' : String(staff._id), staffRole: role, sid: String(session._id), breakGlass: bg }
  const token = jwt.sign(payload, process.env.SUPERADMIN_JWT_SECRET, { expiresIn: `${SESSION_HOURS}h` })
  return { token, session, superadmin: { email, name, role: 'superadmin', staffRole: role, staffId: payload.staffId, breakGlass: bg } }
}

// Cache of session + staff state so the console does not hit the DB on every
// request; revocations in this process invalidate it at once.
const cache = new Map()
const TTL = 10_000
async function sessionState(sid) {
  const hit = cache.get(sid)
  if (hit && Date.now() - hit.at < TTL) return hit.value
  const session = await StaffSession.findById(sid).lean().catch(() => null)
  let staff = null
  if (session?.staffId) staff = await Staff.findById(session.staffId).select('name email role status').lean()
  const value = { session, staff }
  cache.set(sid, { at: Date.now(), value })
  if (cache.size > 5000) cache.clear()
  // Touch lastSeenAt at most once a minute.
  if (session && (!session.lastSeenAt || Date.now() - new Date(session.lastSeenAt) > 60_000)) {
    StaffSession.updateOne({ _id: sid }, { lastSeenAt: new Date() }).catch(() => {})
  }
  return value
}
const forget = () => cache.clear()

async function revokeSessions(filter, by) {
  const r = await StaffSession.updateMany({ ...filter, revokedAt: null }, { revokedAt: new Date(), revokedBy: by || '' })
  forget()
  return r.modifiedCount || 0
}

module.exports = {
  throttled, isBreakGlassEmail, breakGlassPasswordOk, breakGlassLocked, breakGlassFail, breakGlassOk,
  recordFailure, isLocked, signChallenge, readChallenge, issueSession, sessionState, revokeSessions, forget,
  MAX_FAILURES, LOCK_MINUTES, SESSION_HOURS, _ipHits: ipHits,
}
