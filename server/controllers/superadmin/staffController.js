// Staff accounts (SUP-001): owners add people with a role, change roles,
// disable accounts, unlock them, reset 2FA and end sessions. All audited.
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const Staff = require('../../models/superadmin/Staff')
const StaffSession = require('../../models/superadmin/StaffSession')
const GlobalSettings = require('../../models/superadmin/GlobalSettings')
const { STAFF_ROLES } = require('../../models/superadmin/Staff')
const sa = require('../../services/staffAuth')
const { breakGlassNotBefore } = require('../../middleware/superadminAuth')
const { audit } = require('../../utils/audit')
const { sendMail } = require('../../utils/mailer')
const { h, fail, needId, by } = require('./util')

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const view = (s) => ({
  id: String(s._id), email: s.email, name: s.name, role: s.role, status: s.status,
  totpEnabled: !!s.totpEnabled, mustChangePassword: !!s.mustChangePassword,
  recoveryCodesLeft: (s.recoveryCodes || []).filter((r) => !r.usedAt).length,
  locked: !!(s.lockedUntil && new Date(s.lockedUntil) > new Date()), lockedUntil: s.lockedUntil,
  lastLoginAt: s.lastLoginAt, lastLoginIp: s.lastLoginIp, createdAt: s.createdAt, createdBy: s.createdBy,
})
const tempPassword = () => crypto.randomBytes(12).toString('base64url')

const list = h(async () => {
  const [staff, sessions] = await Promise.all([
    Staff.find().sort({ role: 1, name: 1 }).lean(),
    StaffSession.find({ revokedAt: null, expiresAt: { $gt: new Date() } }).sort({ lastSeenAt: -1 }).limit(200).lean(),
  ])
  return {
    roles: STAFF_ROLES,
    staff: staff.map(view),
    sessions: sessions.map((s) => ({ id: String(s._id), staffId: s.staffId, email: s.email, name: s.name, role: s.role, breakGlass: s.breakGlass, ip: s.ip, userAgent: s.userAgent, createdAt: s.createdAt, lastSeenAt: s.lastSeenAt, expiresAt: s.expiresAt })),
    breakGlassConfigured: !!process.env.SUPER_ADMIN_EMAIL,
    breakGlassTotp: !!process.env.SUPER_ADMIN_TOTP_SECRET,
  }
})

const create = h(async (req) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const name = String(req.body?.name || '').trim()
  const role = String(req.body?.role || '')
  if (!EMAIL.test(email)) throw fail(400, 'Enter a valid email address.')
  if (!name) throw fail(400, 'Enter a name.')
  if (!STAFF_ROLES.includes(role)) throw fail(400, 'Choose a role.')
  if (sa.isBreakGlassEmail(email)) throw fail(400, 'That email is the break-glass account.')
  if (await Staff.exists({ email })) throw fail(409, 'A staff account with this email already exists.')
  const password = tempPassword()
  const staff = await Staff.create({ email, name, role, passwordHash: await bcrypt.hash(password, 12), mustChangePassword: true, createdBy: by(req) })
  await audit(req, 'staff.create', { targetType: 'staff', targetId: String(staff._id), meta: { email, role } })
  await sendMail({ to: email, kind: 'staff_invite', subject: 'Your Learnigo console account', text: `Hello ${name},\n\n${req.superadmin.name} added you to the Learnigo console as ${role}. They will give you a temporary password. Sign in at /superadmin-login, choose a new password and set up two-factor sign-in with an authenticator app.\n` })
  // The temporary password is shown once to the owner, never emailed.
  return { staff: view(staff), temporaryPassword: password }
})

const update = h(async (req) => {
  needId(req.params.id, 'Staff member')
  const staff = await Staff.findById(req.params.id)
  if (!staff) throw fail(404, 'Staff member not found')
  const changes = {}
  if (req.body.role !== undefined) {
    if (!STAFF_ROLES.includes(req.body.role)) throw fail(400, 'Choose a role.')
    if (staff.role === 'owner' && req.body.role !== 'owner' && (await Staff.countDocuments({ role: 'owner', status: 'active' })) <= 1) throw fail(400, 'Keep at least one active owner.')
    changes.role = { from: staff.role, to: req.body.role }
    staff.role = req.body.role
  }
  if (req.body.status !== undefined) {
    if (!['active', 'disabled'].includes(req.body.status)) throw fail(400, 'Unknown status.')
    if (String(staff._id) === req.superadmin.staffId && req.body.status === 'disabled') throw fail(400, 'You cannot disable your own account.')
    if (staff.role === 'owner' && req.body.status === 'disabled' && (await Staff.countDocuments({ role: 'owner', status: 'active' })) <= 1) throw fail(400, 'Keep at least one active owner.')
    changes.status = { from: staff.status, to: req.body.status }
    staff.status = req.body.status
  }
  if (req.body.name !== undefined) { changes.name = { from: staff.name, to: String(req.body.name).trim() }; staff.name = String(req.body.name).trim() }
  await staff.save()
  if (changes.status?.to === 'disabled') await sa.revokeSessions({ staffId: String(staff._id) }, by(req))
  sa.forget()
  await audit(req, 'staff.update', { targetType: 'staff', targetId: String(staff._id), meta: changes })
  return { staff: view(staff) }
})

const unlock = h(async (req) => {
  needId(req.params.id, 'Staff member')
  const staff = await Staff.findByIdAndUpdate(req.params.id, { lockedUntil: null, failedLogins: 0 }, { new: true })
  if (!staff) throw fail(404, 'Staff member not found')
  await audit(req, 'staff.unlock', { targetType: 'staff', targetId: String(staff._id) })
  return { staff: view(staff) }
})

// Lost phone: 2FA is cleared, a new temporary password is issued, all sessions end.
const reset2fa = h(async (req) => {
  needId(req.params.id, 'Staff member')
  const reason = String(req.body?.reason || '').trim()
  if (reason.length < 5) throw fail(400, 'Give a reason (at least 5 characters).')
  const staff = await Staff.findById(req.params.id)
  if (!staff) throw fail(404, 'Staff member not found')
  const password = tempPassword()
  Object.assign(staff, { totpEnabled: false, totpSecret: '', totpLastStep: -1, recoveryCodes: [], mustChangePassword: true, passwordHash: await bcrypt.hash(password, 12), lockedUntil: null, failedLogins: 0 })
  await staff.save()
  await sa.revokeSessions({ staffId: String(staff._id) }, by(req))
  await audit(req, 'staff.2fa.reset', { targetType: 'staff', targetId: String(staff._id), reason })
  return { staff: view(staff), temporaryPassword: password }
})

const revokeSession = h(async (req) => {
  needId(req.params.sid, 'Session')
  const n = await sa.revokeSessions({ _id: req.params.sid }, by(req))
  if (!n) throw fail(404, 'Session not found or already ended')
  await audit(req, 'staff.session.revoke', { targetType: 'staff_session', targetId: req.params.sid })
  return { revoked: n }
})

const revokeAllFor = h(async (req) => {
  needId(req.params.id, 'Staff member')
  const n = await sa.revokeSessions({ staffId: req.params.id }, by(req))
  await audit(req, 'staff.session.revoke_all', { targetType: 'staff', targetId: req.params.id, meta: { sessions: n } })
  return { revoked: n }
})

// Ends every break-glass session, including old tokens without a session id.
const revokeBreakGlass = h(async (req) => {
  await GlobalSettings.findOneAndUpdate({ key: 'staff.breakGlassNotBefore' }, { key: 'staff.breakGlassNotBefore', value: new Date().toISOString(), description: 'Break-glass tokens issued before this are refused' }, { upsert: true })
  const n = await sa.revokeSessions({ breakGlass: true }, by(req))
  breakGlassNotBefore.reset()
  await audit(req, 'staff.breakglass.revoke', { targetType: 'staff', targetId: process.env.SUPER_ADMIN_EMAIL || '', meta: { sessions: n } })
  return { revoked: n }
})

// Saved views for the directory and other tables (per staff member).
const savePrefs = h(async (req) => {
  if (!req.superadmin.staffId) throw fail(400, 'Saved views need a named staff account.')
  const views = Array.isArray(req.body?.savedViews) ? req.body.savedViews.slice(0, 30).map((v) => ({ name: String(v.name || '').slice(0, 60), section: String(v.section || '').slice(0, 30), query: Object.fromEntries(Object.entries(v.query || {}).slice(0, 12).map(([k, x]) => [String(k).slice(0, 30), String(x).slice(0, 100)])) })) : []
  const staff = await Staff.findByIdAndUpdate(req.superadmin.staffId, { 'prefs.savedViews': views }, { new: true }).lean()
  return { prefs: staff?.prefs || {} }
})

module.exports = { list, create, update, unlock, reset2fa, revokeSession, revokeAllFor, revokeBreakGlass, savePrefs }
