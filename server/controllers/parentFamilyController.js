// Parent: managed children, co-guardians, link revoking, first-run settings,
// goals and cheers (PAR-001, PAR-003, PAR-004, PAR-012, PAR-042, PAR-060, PAR-061;
// FND-011, FND-013). Every route is behind parentAuth; child routes go through
// requireOwnChild (services/parentFamily.js), so only a VERIFIED link is used.
const crypto = require('crypto')
const Child = require('../models/Child')
const ParentAccount = require('../models/ParentAccount')
const GuardianInvite = require('../models/GuardianInvite')
const Cheer = require('../models/Cheer')
const { createManagedLearner, resetManagedLogin } = require('../services/managedLearners')
const fam = require('../services/parentFamily')
const { createLimiter, norm } = require('../utils/guardianLink')
const { audit } = require('../utils/audit')
const { notify } = require('../utils/notify')
const { sendMail } = require('../utils/mailer')

const ok = (res, body = {}, status = 200) => res.status(status).json({ success: true, ...body })
const bad = (res, status, message, extra = {}) => res.status(status).json({ success: false, message, ...extra })
const handle = (fn) => async (req, res) => {
  try { await fn(req, res) } catch (err) {
    if (err.status) return bad(res, err.status, err.message)
    console.error('parentFamily error:', err)
    bad(res, 500, 'Internal server error')
  }
}
const actorOf = (req) => (req.actor = req.actor || { role: 'parent', id: String(req.parent.id), email: req.parent.email, name: req.parent.name })
const consent = (action, req, note = '') => ({ at: new Date(), action, version: fam.CONSENT_VERSION, by: norm(req.parent.email), note })
const clientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '')

// ── Managed learners (FND-011) ───────────────────────────────────────────────

const AVATARS = ['🦁', '🐼', '🦊', '🐸', '🐵', '🦄', '🐙', '🐯', '🐨', '🐰', '🐻', '🐧']

// POST /children/managed { name, age, avatar } -> { child, loginCode, picturePassword }
const createManagedChild = handle(async (req, res) => {
  const name = String(req.body?.name || '').trim()
  const age = Number(req.body?.age)
  if (name.length < 1 || name.length > 60) return bad(res, 400, 'Please enter a first name (up to 60 letters).')
  if (!Number.isInteger(age) || age < 2 || age > 18) return bad(res, 400, 'Age must be between 2 and 18.')
  const avatar = AVATARS.includes(req.body?.avatar) ? req.body.avatar : AVATARS[0]
  const count = await Child.countDocuments({ parentId: req.parent.id, managedLearnerId: { $ne: null } })
  if (count >= 10) return bad(res, 429, 'You can create up to 10 child accounts.')

  const { learner, loginCode, picturePassword } = await createManagedLearner({ name, age, avatar, createdByRole: 'parent', createdById: req.parent.id })
  const child = await Child.create({
    parentId: req.parent.id, name, age, email: learner.email, avatar, managedLearnerId: learner._id,
    linkStatus: 'verified', verifiedAt: new Date(), verifiedBy: 'parent_created', consentVersion: fam.CONSENT_VERSION,
    guardianRole: 'primary', consentHistory: [consent('created_child_account', req), consent('guardian_consent', req)],
  })
  await audit(actorOf(req) && req, 'learner.managed_create', { targetType: 'learner', targetId: String(learner._id), meta: { childId: String(child._id) } })
  ok(res, { child, loginCode, picturePassword }, 201)
})

// POST /children/:id/managed/reset -> a new login code and pictures (the old ones stop working)
const resetManagedChild = handle(async (req, res) => {
  const child = req.child
  if (!child.managedLearnerId) return bad(res, 400, 'This child signs in with their own account.')
  if (child.guardianRole === 'co') return bad(res, 403, 'Only the guardian who manages this account can make a new login card.')
  const { loginCode, picturePassword } = await resetManagedLogin(child.managedLearnerId)
  await audit(req, 'learner.managed_reset', { targetType: 'learner', targetId: String(child.managedLearnerId) })
  ok(res, { loginCode, picturePassword })
})

// ── Revoking a link (FND-012) ────────────────────────────────────────────────

// POST /children/:id/revoke : stop seeing this child. Data stays with the child.
const revokeOwnLink = handle(async (req, res) => {
  const child = await Child.findOne({ _id: req.params.id, parentId: req.parent.id })
  if (!child) return bad(res, 404, 'Child not found')
  if (child.linkStatus === 'revoked') return ok(res, { child })
  if (child.managedLearnerId && child.guardianRole !== 'co' && child.linkStatus === 'verified') {
    const others = await Child.countDocuments({ email: child.email, linkStatus: 'verified', _id: { $ne: child._id } })
    if (!others) return bad(res, 409, "You manage this child's account, so removing your link would leave nobody looking after it. Use the privacy centre to delete the account instead.")
  }
  child.linkStatus = 'revoked'
  child.revokedAt = new Date()
  child.revokedBy = 'self'
  child.consentHistory.push(consent('link_revoked', req, 'Removed by this guardian'))
  await child.save()
  await audit(actorOf(req) && req, 'guardian.revoke', { targetType: 'child_link', targetId: String(child._id) })
  ok(res, { child })
})

// ── Co-guardians (FND-013) ───────────────────────────────────────────────────

const inviteLimiter = createLimiter({ max: 10, windowMs: 24 * 60 * 60 * 1000 })
const INVITE_TTL = 14 * 24 * 60 * 60 * 1000
const hashToken = (t) => crypto.createHash('sha256').update(`guardian|${t}`).digest('hex')
const isPrimary = (row) => row.guardianRole !== 'co'

// GET /children/:id/guardians
const listGuardians = handle(async (req, res) => {
  const rows = await Child.find({ email: req.child.email, linkStatus: 'verified' }).sort({ verifiedAt: 1, createdAt: 1 })
  const parents = await ParentAccount.find({ _id: { $in: rows.map((r) => r.parentId) } }).select('name email')
  const pmap = Object.fromEntries(parents.map((p) => [String(p._id), p]))
  const invites = isPrimary(req.child)
    ? await GuardianInvite.find({ learnerEmail: req.child.email, status: 'pending', expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 })
    : []
  ok(res, {
    youArePrimary: isPrimary(req.child),
    guardians: rows.map((r) => ({
      id: String(r._id), name: pmap[String(r.parentId)]?.name || '', email: pmap[String(r.parentId)]?.email || '',
      you: String(r.parentId) === String(req.parent.id), role: r.guardianRole || 'primary', verifiedBy: r.verifiedBy, since: r.verifiedAt || r.createdAt,
      removable: isPrimary(req.child) && r.guardianRole === 'co' && r.verifiedBy !== 'school' && String(r.parentId) !== String(req.parent.id),
    })),
    invites: invites.map((i) => ({ id: String(i._id), email: i.email, sentAt: i.createdAt, expiresAt: i.expiresAt })),
  })
})

// POST /children/:id/guardians/invite { email }
const inviteGuardian = handle(async (req, res) => {
  if (!isPrimary(req.child)) return bad(res, 403, 'Only the main guardian can invite others.')
  const email = norm(req.body?.email)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return bad(res, 400, 'Please enter a valid email address.')
  if (email === norm(req.parent.email)) return bad(res, 400, "That's your own email.")
  if (!inviteLimiter.take(String(req.parent.id))) return bad(res, 429, 'You have sent a lot of invites today. Please try again tomorrow.')
  const already = await Child.findOne({ email: req.child.email, linkStatus: 'verified', parentId: { $in: (await ParentAccount.find({ email }).select('_id')).map((p) => p._id) } })
  if (already) return bad(res, 409, 'That person can already see this child.')
  await GuardianInvite.updateMany({ learnerEmail: req.child.email, email, status: 'pending' }, { status: 'cancelled' })

  const token = crypto.randomBytes(24).toString('base64url')
  const invite = await GuardianInvite.create({
    learnerEmail: req.child.email, childName: req.child.name, fromChildId: req.child._id, fromParentId: req.parent.id,
    fromName: req.parent.name || '', email, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + INVITE_TTL),
  })
  const link = `${clientUrl()}/parent-login?invite=${token}`
  const from = req.parent.name || 'A parent'
  await sendMail({
    to: email, kind: 'guardian_invite',
    subject: `${from} invited you to follow ${req.child.name}'s learning on Learnigo`,
    html: `<p>Hello,</p><p>${escapeHtml(from)} invited you to see how ${escapeHtml(req.child.name)} is learning on Learnigo.</p><p><a href="${link}">Accept the invitation</a> (sign in with this email address: ${escapeHtml(email)}).</p><p>The invitation is valid for 14 days. If you weren't expecting it, you can ignore this email.</p>`,
  })
  const existing = await ParentAccount.findOne({ email }).select('_id')
  if (existing) notify({ role: 'parent', id: String(existing._id) }, { kind: 'guardian_invite', title: `${from} invited you to follow ${req.child.name}`, body: 'Open Family → Requests to accept.', link: '/parent-dashboard?tab=family&pane=requests' })
  await audit(req, 'guardian.invite', { targetType: 'child_link', targetId: String(req.child._id), meta: { email } })
  ok(res, { invite: { id: String(invite._id), email, expiresAt: invite.expiresAt } }, 201)
})

// DELETE /children/:id/guardians/invites/:inviteId
const cancelInvite = handle(async (req, res) => {
  const inv = await GuardianInvite.findOne({ _id: req.params.inviteId, learnerEmail: req.child.email, status: 'pending' })
  if (!inv || !isPrimary(req.child)) return bad(res, 404, 'Invite not found')
  inv.status = 'cancelled'
  await inv.save()
  await audit(req, 'guardian.invite_cancel', { targetType: 'child_link', targetId: String(req.child._id), meta: { email: inv.email } })
  ok(res)
})

// DELETE /children/:id/guardians/:rowId : the main guardian removes a co-guardian.
const removeGuardian = handle(async (req, res) => {
  if (!isPrimary(req.child)) return bad(res, 403, 'Only the main guardian can remove others.')
  if (!/^[a-f0-9]{24}$/i.test(req.params.rowId)) return bad(res, 404, 'Guardian not found')
  const row = await Child.findOne({ _id: req.params.rowId, email: req.child.email, linkStatus: 'verified' })
  if (!row || String(row.parentId) === String(req.parent.id)) return bad(res, 404, 'Guardian not found')
  if (row.guardianRole !== 'co') return bad(res, 403, 'You can only remove guardians you invited.')
  if (row.verifiedBy === 'school') return bad(res, 403, "This guardian was linked by the school. Ask the school to change it.")
  row.linkStatus = 'revoked'
  row.revokedAt = new Date()
  row.revokedBy = `guardian:${req.parent.id}`
  row.consentHistory.push(consent('link_revoked', req, 'Removed by the main guardian'))
  await row.save()
  notify({ role: 'parent', id: String(row.parentId) }, { kind: 'guardian_removed', title: `Your access to ${row.name}'s learning was removed`, body: 'The main guardian removed your link.', link: '/parent-dashboard' })
  await audit(req, 'guardian.remove', { targetType: 'child_link', targetId: String(row._id) })
  ok(res)
})

// GET /guardian-invites : invitations waiting for MY email.
const myInvites = handle(async (req, res) => {
  const list = await GuardianInvite.find({ email: norm(req.parent.email), status: 'pending', expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 })
  ok(res, { invites: list.map((i) => ({ id: String(i._id), childName: i.childName, fromName: i.fromName, sentAt: i.createdAt, expiresAt: i.expiresAt })) })
})

// POST /guardian-invites/accept { inviteId } or { token }
const acceptInvite = handle(async (req, res) => {
  const me = norm(req.parent.email)
  const { inviteId, token } = req.body || {}
  let inv = null
  if (token) inv = await GuardianInvite.findOne({ tokenHash: hashToken(String(token)) })
  else if (/^[a-f0-9]{24}$/i.test(String(inviteId || ''))) inv = await GuardianInvite.findById(inviteId)
  if (!inv || inv.status !== 'pending' || inv.expiresAt < new Date()) return bad(res, 404, 'This invitation is no longer valid. Ask for a new one.')
  // Bound to the email it was sent to: a forwarded link does not work for someone else.
  if (inv.email !== me) return bad(res, 403, `This invitation was sent to another email address. Sign in with ${maskEmail(inv.email)} to accept it.`)
  const from = await Child.findOne({ _id: inv.fromChildId, linkStatus: 'verified' })
  if (!from) return bad(res, 410, 'The guardian who invited you no longer has access, so this invitation has expired.')

  let row = await Child.findOne({ parentId: req.parent.id, email: inv.learnerEmail })
  if (!row) row = new Child({ parentId: req.parent.id, name: from.name, age: from.age, email: inv.learnerEmail, avatar: from.avatar })
  Object.assign(row, fam.learnerSettingsFrom(from), {
    linkStatus: 'verified', verifiedAt: new Date(), verifiedBy: 'co_guardian', consentVersion: fam.CONSENT_VERSION,
    guardianRole: 'co', invitedByParentId: inv.fromParentId, revokedAt: null, revokedBy: '', managedLearnerId: from.managedLearnerId || null,
  })
  row.consentHistory.push(consent('co_guardian_linked', req, `Invited by ${inv.fromName || 'the main guardian'}`))
  await row.save()
  inv.status = 'accepted'
  inv.acceptedAt = new Date()
  await inv.save()
  notify({ role: 'parent', id: String(inv.fromParentId) }, { kind: 'guardian_joined', title: `${req.parent.name || inv.email} can now follow ${row.name}'s learning`, link: '/parent-dashboard?tab=family&pane=grownups' })
  await audit(actorOf(req) && req, 'guardian.accept', { targetType: 'child_link', targetId: String(row._id), meta: { inviteId: String(inv._id) } })
  ok(res, { child: row })
})

// ── Settings (PAR-004, PAR-012, PAR-042, PAR-060) ────────────────────────────

// PATCH /children/:id/settings
const updateSettings = handle(async (req, res) => {
  const { out, errors } = fam.cleanSettings(req.body)
  if (errors.length) return bad(res, 400, errors[0], { errors })
  const child = req.child
  for (const k of ['age', 'name', 'avatar', 'onboardedAt']) if (out[k] !== undefined) child[k] = out[k]
  for (const k of fam.LEARNER_FIELDS) if (out[k] !== undefined) child[k] = out[k]
  if (out.notifyPrefs) child.notifyPrefs = { ...(child.notifyPrefs?.toObject?.() || child.notifyPrefs || {}), ...out.notifyPrefs }
  await child.save()
  await fam.syncLearnerSettings(child.email, out)
  if (out.healthyUse) await audit(req, 'learner.healthy_use_change', { targetType: 'learner', targetId: String(child._id), meta: out.healthyUse })
  ok(res, { child })
})

// GET /children/:id/goal : the goal ring for this week.
const getGoal = handle(async (req, res) => {
  const tz = req.get('x-timezone') || req.query.tz || 'UTC'
  const goal = req.child.weeklyGoal
  // Without a goal the week is still shown, measured against a gentle default (20 min on 5 days).
  ok(res, { goal, progress: await fam.goalProgress(req.child.email, goal || { minutesPerDay: 20, daysPerWeek: 5 }, safeTz(tz)) })
})

// ── Cheers (PAR-061) ─────────────────────────────────────────────────────────

const STICKERS = ['star', 'trophy', 'heart', 'rocket', 'rainbow', 'thumbs', 'party', 'medal', 'sun', 'hug']
const cheerLimiter = createLimiter({ max: 20, windowMs: 24 * 60 * 60 * 1000 })
const VOICE_TYPES = /^audio\/(webm|ogg|mp4|mpeg|aac|x-m4a)(;.*)?$/
const MAX_VOICE = 64 * 1024

// POST /children/:id/cheers { sticker, message, voice?: base64, voiceType? }
const sendCheer = handle(async (req, res) => {
  const { sticker, message = '', voice, voiceType = '' } = req.body || {}
  if (!STICKERS.includes(sticker)) return bad(res, 400, 'Pick a sticker.')
  const text = String(message).trim()
  if (text.length > 140) return bad(res, 400, 'Keep the message under 140 characters.')
  let buf = null
  if (voice) {
    if (!VOICE_TYPES.test(String(voiceType))) return bad(res, 400, 'Unsupported voice note format.')
    buf = Buffer.from(String(voice), 'base64')
    if (!buf.length || buf.length > MAX_VOICE) return bad(res, 400, 'The voice note is too long. Keep it under 15 seconds.')
  }
  if (!cheerLimiter.take(`${req.parent.id}:${req.child.email}`)) return bad(res, 429, "That's a lot of cheering for one day! Try again tomorrow.")
  const me = await ParentAccount.findById(req.parent.id).select('name').lean()
  const cheer = await Cheer.create({
    learnerEmail: req.child.email, fromParentId: req.parent.id, fromName: String(me?.name || req.parent.name || '').split(' ')[0],
    sticker, message: text, voice: buf, voiceType: buf ? String(voiceType).split(';')[0] : '', hasVoice: Boolean(buf),
  })
  ok(res, { cheer: { id: String(cheer._id), sticker, message: text, hasVoice: cheer.hasVoice, createdAt: cheer.createdAt, seenAt: null } }, 201)
})

// GET /children/:id/cheers
const listCheers = handle(async (req, res) => {
  const list = await Cheer.find({ learnerEmail: req.child.email, fromParentId: req.parent.id }).sort({ createdAt: -1 }).limit(20)
  ok(res, { cheers: list.map((c) => ({ id: String(c._id), sticker: c.sticker, message: c.message, hasVoice: c.hasVoice, createdAt: c.createdAt, seenAt: c.seenAt })) })
})

// ── helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])) }
function maskEmail(e) { const [u, d] = String(e).split('@'); return `${u.slice(0, 2)}…@${d}` }
function safeTz(tz) { try { new Intl.DateTimeFormat('en', { timeZone: tz }); return tz } catch { return 'UTC' } }

module.exports = {
  createManagedChild, resetManagedChild, revokeOwnLink, listGuardians, inviteGuardian, cancelInvite, removeGuardian,
  myInvites, acceptInvite, updateSettings, getGoal, sendCheer, listCheers, STICKERS, AVATARS, safeTz,
}
