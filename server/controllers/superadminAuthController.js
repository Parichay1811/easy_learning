// Console sign-in (SUP-001 / FND-014). Steps:
//   POST /login { email, password }
//     -> { token }                                  break-glass env owner (no TOTP configured)
//     -> { step: 'totp', challengeToken }           staff with 2FA (or break-glass with SUPER_ADMIN_TOTP_SECRET)
//     -> { step: 'setup', setupToken, mustChangePassword }  staff without 2FA yet: must set it up now
//   POST /2fa/setup  { setupToken }                     -> { secret, otpauthUri }
//   POST /2fa/enable { setupToken, code, newPassword? } -> { token, recoveryCodes }
//   POST /2fa/verify { challengeToken, code | recoveryCode } -> { token }
const bcrypt = require('bcryptjs')
const Staff = require('../models/superadmin/Staff')
const sa = require('../services/staffAuth')
const totp = require('../utils/totp')
const { audit } = require('../utils/audit')
const { notify } = require('../utils/notify')

const bad = (res, status, message, extra = {}) => res.status(status).json({ success: false, message, ...extra })
const as = (req, actor) => { req.actor = { role: 'superadmin', orgId: null, ...actor }; return req }
const lockedReply = (res, until) => bad(res, 423, `Too many attempts. This account is locked until ${until.toISOString().slice(11, 16)} UTC.`, { code: 'LOCKED', lockedUntil: until })
const GENERIC = 'Invalid credentials'
const DUMMY_HASH = bcrypt.hashSync('no-such-staff-account', 10)

async function warnOwners(title, body) {
  const owners = await Staff.find({ role: 'owner', status: 'active' }).select('_id').lean().catch(() => [])
  if (owners.length) await notify(owners.map((o) => ({ role: 'superadmin', id: String(o._id) })), { kind: 'security', title, body, link: '/superadmin-dashboard?section=staff' })
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') return bad(res, 400, 'Email and password are required')
    if (sa.throttled(req.ip)) return bad(res, 429, 'Too many sign-in attempts from this network. Try again in 15 minutes.', { code: 'THROTTLED' })
    const lower = email.trim().toLowerCase()

    // Break-glass owner from env.
    if (sa.isBreakGlassEmail(lower)) {
      const until = sa.breakGlassLocked()
      if (until) return lockedReply(res, until)
      if (!sa.breakGlassPasswordOk(password)) {
        if (sa.breakGlassFail()) {
          await audit(as(req, { id: `breakglass:${lower}`, email: lower }), 'staff.locked', { targetType: 'staff', targetId: lower, reason: 'Too many failed sign-ins' })
          await warnOwners('Break-glass account locked', 'Too many failed sign-ins to the env owner account.')
        }
        return bad(res, 401, GENERIC)
      }
      if (process.env.SUPER_ADMIN_TOTP_SECRET) return res.json({ success: true, step: 'totp', challengeToken: sa.signChallenge('breakglass', 'totp') })
      sa.breakGlassOk()
      const out = await sa.issueSession({ staff: null, req })
      await audit(as(req, { id: `breakglass:${lower}`, email: lower, name: 'Break-glass owner' }), 'staff.login.breakglass', { targetType: 'staff', targetId: lower })
      await warnOwners('Break-glass sign-in', `The env owner account signed in from ${req.ip || 'unknown'}.`)
      return res.json({ success: true, token: out.token, superadmin: out.superadmin })
    }

    const staff = await Staff.findOne({ email: lower })
    if (!staff || staff.status !== 'active') {
      await bcrypt.compare(password, DUMMY_HASH) // same time either way, so emails can't be probed
      return bad(res, 401, GENERIC)
    }
    if (sa.isLocked(staff)) return lockedReply(res, staff.lockedUntil)
    if (!(await bcrypt.compare(password, staff.passwordHash))) {
      if (await sa.recordFailure(staff)) {
        await audit(as(req, { id: String(staff._id), email: staff.email, name: staff.name }), 'staff.locked', { targetType: 'staff', targetId: String(staff._id), reason: 'Too many failed sign-ins' })
        return lockedReply(res, staff.lockedUntil)
      }
      return bad(res, 401, GENERIC)
    }
    if (!staff.totpEnabled) return res.json({ success: true, step: 'setup', setupToken: sa.signChallenge(String(staff._id), 'setup'), mustChangePassword: staff.mustChangePassword })
    return res.json({ success: true, step: 'totp', challengeToken: sa.signChallenge(String(staff._id), 'totp') })
  } catch (err) {
    console.error('staff login error:', err)
    bad(res, 500, 'Internal server error')
  }
}

async function finish(req, res, staff, extra = {}) {
  staff.failedLogins = 0
  staff.lockedUntil = null
  staff.lastLoginAt = new Date()
  staff.lastLoginIp = req.ip || ''
  await staff.save()
  const out = await sa.issueSession({ staff, req })
  await audit(as(req, { id: String(staff._id), email: staff.email, name: staff.name, staffRole: staff.role }), 'staff.login', { targetType: 'staff', targetId: String(staff._id), meta: { twoFactor: extra.method || 'totp' } })
  return res.json({ success: true, token: out.token, superadmin: out.superadmin, ...extra.body })
}

const verify2fa = async (req, res) => {
  try {
    const { challengeToken, code, recoveryCode } = req.body || {}
    if (sa.throttled(req.ip)) return bad(res, 429, 'Too many attempts. Try again in 15 minutes.', { code: 'THROTTLED' })
    const ch = sa.readChallenge(challengeToken, 'totp')
    if (!ch) return bad(res, 401, 'This sign-in step has expired. Start again.', { code: 'CHALLENGE_EXPIRED' })

    if (ch.staffId === 'breakglass') {
      const until = sa.breakGlassLocked()
      if (until) return lockedReply(res, until)
      if (!process.env.SUPER_ADMIN_TOTP_SECRET || totp.verifyTotp(process.env.SUPER_ADMIN_TOTP_SECRET, code) == null) {
        sa.breakGlassFail()
        return bad(res, 401, 'That code is not right.', { code: 'BAD_CODE' })
      }
      sa.breakGlassOk()
      const out = await sa.issueSession({ staff: null, req })
      const email = process.env.SUPER_ADMIN_EMAIL
      await audit(as(req, { id: `breakglass:${email}`, email, name: 'Break-glass owner' }), 'staff.login.breakglass', { targetType: 'staff', targetId: email, meta: { twoFactor: 'totp' } })
      await warnOwners('Break-glass sign-in', `The env owner account signed in from ${req.ip || 'unknown'}.`)
      return res.json({ success: true, token: out.token, superadmin: out.superadmin })
    }

    const staff = await Staff.findById(ch.staffId)
    if (!staff || staff.status !== 'active' || !staff.totpEnabled) return bad(res, 401, 'This sign-in step has expired. Start again.', { code: 'CHALLENGE_EXPIRED' })
    if (sa.isLocked(staff)) return lockedReply(res, staff.lockedUntil)

    if (recoveryCode) {
      const h = totp.hashRecoveryCode(recoveryCode)
      const rc = staff.recoveryCodes.find((r) => r.hash === h && !r.usedAt)
      if (!rc) {
        if (await sa.recordFailure(staff)) return lockedReply(res, staff.lockedUntil)
        return bad(res, 401, 'That recovery code is not valid or was already used.', { code: 'BAD_CODE' })
      }
      rc.usedAt = new Date()
      const left = staff.recoveryCodes.filter((r) => !r.usedAt).length
      return finish(req, res, staff, { method: 'recovery_code', body: { recoveryCodesLeft: left } })
    }

    const step = totp.verifyTotp(totp.unseal(staff.totpSecret), code, { afterStep: staff.totpLastStep })
    if (step == null) {
      if (await sa.recordFailure(staff)) return lockedReply(res, staff.lockedUntil)
      return bad(res, 401, 'That code is not right.', { code: 'BAD_CODE' })
    }
    staff.totpLastStep = step
    return finish(req, res, staff, { method: 'totp' })
  } catch (err) {
    console.error('verify2fa error:', err)
    bad(res, 500, 'Internal server error')
  }
}

const setup2fa = async (req, res) => {
  try {
    const ch = sa.readChallenge(req.body?.setupToken, 'setup')
    if (!ch) return bad(res, 401, 'This set-up step has expired. Sign in again.', { code: 'CHALLENGE_EXPIRED' })
    const staff = await Staff.findById(ch.staffId)
    if (!staff || staff.status !== 'active' || staff.totpEnabled) return bad(res, 401, 'This set-up step has expired. Sign in again.', { code: 'CHALLENGE_EXPIRED' })
    const secret = totp.generateSecret()
    staff.totpSecret = totp.seal(secret)
    await staff.save()
    res.json({ success: true, secret, account: staff.email, otpauthUri: totp.otpauthUri({ secret, account: staff.email }) })
  } catch (err) {
    console.error('setup2fa error:', err)
    bad(res, 500, 'Internal server error')
  }
}

const enable2fa = async (req, res) => {
  try {
    const { setupToken, code, newPassword } = req.body || {}
    const ch = sa.readChallenge(setupToken, 'setup')
    if (!ch) return bad(res, 401, 'This set-up step has expired. Sign in again.', { code: 'CHALLENGE_EXPIRED' })
    const staff = await Staff.findById(ch.staffId)
    if (!staff || staff.status !== 'active' || staff.totpEnabled || !staff.totpSecret) return bad(res, 400, 'Start the set-up again.', { code: 'SETUP_MISSING' })
    if (staff.mustChangePassword) {
      if (typeof newPassword !== 'string' || newPassword.length < 12) return bad(res, 400, 'Choose a new password of at least 12 characters.', { code: 'WEAK_PASSWORD' })
      if (await bcrypt.compare(newPassword, staff.passwordHash)) return bad(res, 400, 'The new password must be different.', { code: 'WEAK_PASSWORD' })
    }
    const step = totp.verifyTotp(totp.unseal(staff.totpSecret), code)
    if (step == null) {
      if (await sa.recordFailure(staff)) return lockedReply(res, staff.lockedUntil)
      return bad(res, 401, 'That code is not right. Check the time on your phone and try again.', { code: 'BAD_CODE' })
    }
    if (staff.mustChangePassword) { staff.passwordHash = await bcrypt.hash(newPassword, 12); staff.mustChangePassword = false }
    const codes = totp.makeRecoveryCodes(10)
    staff.recoveryCodes = codes.map((c) => ({ hash: totp.hashRecoveryCode(c) }))
    staff.totpEnabled = true
    staff.totpLastStep = step
    await audit(as(req, { id: String(staff._id), email: staff.email, name: staff.name, staffRole: staff.role }), 'staff.2fa.enabled', { targetType: 'staff', targetId: String(staff._id) })
    return finish(req, res, staff, { method: 'totp', body: { recoveryCodes: codes } })
  } catch (err) {
    console.error('enable2fa error:', err)
    bad(res, 500, 'Internal server error')
  }
}

// Signed-in: who am I, and sign out (ends this session server-side).
const me = async (req, res) => {
  const s = req.superadmin
  let staff = null
  if (s.staffId) {
    const doc = await Staff.findById(s.staffId).select('email name role lastLoginAt recoveryCodes totpEnabled prefs').lean()
    if (doc) staff = { email: doc.email, name: doc.name, role: doc.role, lastLoginAt: doc.lastLoginAt, totpEnabled: doc.totpEnabled, recoveryCodesLeft: (doc.recoveryCodes || []).filter((r) => !r.usedAt).length, prefs: doc.prefs || {} }
  }
  res.json({ success: true, superadmin: { email: s.email, name: s.name, staffId: s.staffId, staffRole: s.staffRole, breakGlass: s.breakGlass, sid: s.sid || null }, staff })
}

const logout = async (req, res) => {
  if (req.superadmin.sid) await sa.revokeSessions({ _id: req.superadmin.sid }, req.superadmin.email)
  await audit(req, 'staff.logout', { targetType: 'staff', targetId: req.superadmin.staffId || req.superadmin.email })
  res.json({ success: true })
}

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {}
    if (!req.superadmin.staffId) return bad(res, 400, 'The break-glass password lives in the server environment.')
    if (typeof newPassword !== 'string' || newPassword.length < 12) return bad(res, 400, 'Choose a new password of at least 12 characters.', { code: 'WEAK_PASSWORD' })
    const staff = await Staff.findById(req.superadmin.staffId)
    if (!staff || !(await bcrypt.compare(String(currentPassword || ''), staff.passwordHash))) return bad(res, 401, 'Your current password is not right.')
    staff.passwordHash = await bcrypt.hash(newPassword, 12)
    staff.mustChangePassword = false
    await staff.save()
    // Every other session of this person ends.
    await sa.revokeSessions({ staffId: String(staff._id), _id: { $ne: req.superadmin.sid } }, staff.email)
    await audit(req, 'staff.password.changed', { targetType: 'staff', targetId: String(staff._id) })
    res.json({ success: true })
  } catch (err) {
    console.error('changePassword error:', err)
    bad(res, 500, 'Internal server error')
  }
}

const newRecoveryCodes = async (req, res) => {
  try {
    if (!req.superadmin.staffId) return bad(res, 400, 'Not available for the break-glass account.')
    const staff = await Staff.findById(req.superadmin.staffId)
    if (!staff?.totpEnabled) return bad(res, 400, 'Set up two-factor sign-in first.')
    const step = totp.verifyTotp(totp.unseal(staff.totpSecret), req.body?.code, { afterStep: staff.totpLastStep })
    if (step == null) return bad(res, 401, 'That code is not right.', { code: 'BAD_CODE' })
    const codes = totp.makeRecoveryCodes(10)
    staff.recoveryCodes = codes.map((c) => ({ hash: totp.hashRecoveryCode(c) }))
    staff.totpLastStep = step
    await staff.save()
    await audit(req, 'staff.2fa.recovery_codes', { targetType: 'staff', targetId: String(staff._id) })
    res.json({ success: true, recoveryCodes: codes })
  } catch (err) {
    console.error('newRecoveryCodes error:', err)
    bad(res, 500, 'Internal server error')
  }
}

module.exports = { login, verify2fa, setup2fa, enable2fa, me, logout, changePassword, newRecoveryCodes }
