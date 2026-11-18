// Messaging between linked accounts (FND-051). Every handler runs after anyAuth
// and only ever touches threads the caller takes part in. Authorisation comes
// from services/commsLinks.js (real links + the school's messaging policy).
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const mongoose = require('mongoose')
const multer = require('multer')
const Thread = require('../models/comms/Thread')
const Message = require('../models/comms/Message')
const MessageFlag = require('../models/comms/MessageFlag')
const links = require('../services/commsLinks')
const { notify } = require('../utils/notify')
const { audit } = require('../utils/audit')
const { handleUpload } = require('../middleware/upload')

const ROLES = ['parent', 'teacher', 'admin']
const me = (req) => `${req.actor.role}:${req.actor.id}`
const isId = (id) => mongoose.isValidObjectId(String(id || ''))
const err500 = (res, e) => { console.error('messaging error:', e); res.status(500).json({ success: false, message: 'Internal server error' }) }
const sendFail = (res, f) => res.status(f.error.status).json({ success: false, message: f.error.message, code: f.error.code })
const pageSize = (q, d = 20, max = 50) => Math.min(Math.max(Number(q) || d, 1), max)

// ── Attachments: private folder, served only to participants ──────────────────
const ATTACH_DIR = path.join(__dirname, '..', 'private', 'message-attachments')
const ATTACH_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'application/pdf': '.pdf' }
const MAX_FILES = 3
const MAX_BYTES = 5 * 1024 * 1024
const uploader = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => { fs.mkdirSync(ATTACH_DIR, { recursive: true }); cb(null, ATTACH_DIR) },
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${ATTACH_TYPES[file.mimetype]}`),
  }),
  fileFilter: (req, file, cb) => (ATTACH_TYPES[file.mimetype] ? cb(null, true) : cb(new Error('Only images (JPEG, PNG, WEBP, GIF) or PDF files can be attached'))),
  limits: { fileSize: MAX_BYTES, files: MAX_FILES, fields: 10 },
})
// Multipart only when the client sends files; JSON otherwise.
const maybeUpload = (req, res, next) => (req.is('multipart/form-data') ? handleUpload(uploader.array('files', MAX_FILES))(req, res, next) : next())
const dropFiles = (req) => (req.files || []).forEach((f) => fs.unlink(f.path, () => {}))
const attachmentsFrom = (req) => (req.files || []).map((f) => ({ name: String(f.originalname || 'file').slice(0, 120), file: f.filename, type: f.mimetype, size: f.size }))

// ── Shapes sent to the client (never emails) ──────────────────────────────────
function threadView(t, key) {
  const mine = t.participants.find((p) => p.key === key)
  const other = t.participants.find((p) => p.key !== key)
  return {
    id: String(t._id), subject: t.subject, childName: t.childName, studentId: t.studentId,
    with: { key: other.key, role: other.role, name: other.name },
    lastMessageAt: t.lastMessageAt, lastPreview: t.lastPreview || '', lastFromMe: t.lastSenderKey === key,
    unread: mine?.unread || 0, messageCount: t.messageCount, status: t.status,
  }
}

function messageView(m, key, otherReadAt) {
  return {
    id: String(m._id), fromMe: m.senderKey === key, senderRole: m.senderRole,
    body: m.hidden ? '' : m.body, hidden: Boolean(m.hidden), createdAt: m.createdAt,
    attachments: m.hidden ? [] : (m.attachments || []).map((a, i) => ({ index: i, name: a.name, type: a.type, size: a.size, url: `/api/messages/attachments/${m._id}/${i}` })),
    read: m.senderKey === key ? Boolean(otherReadAt && m.createdAt <= otherReadAt) : undefined,
  }
}

const parseKey = (key) => {
  const [role, ...rest] = String(key || '').split(':')
  const id = rest.join(':')
  return ROLES.includes(role) && id ? { role, id } : null
}

async function loadMyThread(req, res) {
  if (!isId(req.params.id)) { res.status(404).json({ success: false, message: 'Conversation not found' }); return null }
  const t = await Thread.findOne({ _id: req.params.id, 'participants.key': me(req) })
  if (!t) { res.status(404).json({ success: false, message: 'Conversation not found' }); return null }
  return t
}

// Append a message to a thread, update counters and tell the other person.
async function addMessage(req, thread, { body, attachments }) {
  const key = me(req)
  const msg = await Message.create({ threadId: thread._id, orgId: thread.orgId, senderKey: key, senderRole: req.actor.role, body, attachments })
  const other = thread.participants.find((p) => p.key !== key)
  const mine = thread.participants.find((p) => p.key === key)
  const update = {
    $set: { lastMessageAt: msg.createdAt, lastSenderKey: key, lastPreview: (body || (attachments.length ? '📎' : '')).slice(0, 120), 'participants.$[me].lastReadAt': msg.createdAt, 'participants.$[me].unread': 0 },
    $inc: { messageCount: 1, 'participants.$[other].unread': 1 },
  }
  // Reply time: first staff answer to a thread a parent started (metrics only).
  if (thread.firstReplyMs == null && req.actor.role !== 'parent' && thread.startedBy !== key && thread.startedBy.startsWith('parent:')) {
    update.$set.firstReplyMs = msg.createdAt - thread.createdAt
  }
  await Thread.updateOne({ _id: thread._id }, update, { arrayFilters: [{ 'me.key': key }, { 'other.key': other.key }] })
  if (!other.muted) {
    const who = mine?.name || 'Someone'
    await notify({ role: other.role, id: other.id }, {
      kind: 'message', title: `New message from ${who}`,
      body: thread.childName ? `About ${thread.childName}` : (thread.subject || ''),
      link: `${{ parent: '/parent-dashboard', teacher: '/teacher-dashboard', admin: '/admin-dashboard' }[other.role]}?tab=messages&thread=${thread._id}`,
    })
  }
  return msg
}

const cleanBody = (b) => String(b ?? '').replace(/\r\n/g, '\n').trim().slice(0, 4000)

// ── Handlers ──────────────────────────────────────────────────────────────────

const contacts = async (req, res) => {
  try {
    let list = await links.contactsFor(req.actor)
    const q = String(req.query.q || '').trim().toLowerCase()
    if (q) list = list.filter((c) => `${c.name} ${c.childName || ''} ${c.subject || ''}`.toLowerCase().includes(q))
    const limit = pageSize(req.query.limit, 30, 100)
    const page = Math.max(Number(req.query.page) || 1, 1)
    const tz = req.get('x-timezone') || 'UTC'
    const items = list.slice((page - 1) * limit, page * limit).map(({ orgId: _o, ...c }) => ({
      ...c, canStart: c.canStart !== false,
      ...(c.officeHours ? { officeHours: c.officeHours, outsideOfficeHours: links.withinOfficeHours(c.officeHours, { tz }) === false } : {}),
    }))
    res.json({ success: true, items, total: list.length, page, pages: Math.ceil(list.length / limit) })
  } catch (e) { err500(res, e) }
}

const listThreads = async (req, res) => {
  try {
    const key = me(req)
    const limit = pageSize(req.query.limit)
    const q = { 'participants.key': key }
    if (req.query.before && !Number.isNaN(Date.parse(req.query.before))) q.lastMessageAt = { $lt: new Date(req.query.before) }
    const rows = await Thread.find(q).sort({ lastMessageAt: -1 }).limit(limit + 1).lean()
    const more = rows.length > limit
    const items = rows.slice(0, limit).map((t) => threadView(t, key))
    res.json({ success: true, items, nextBefore: more ? items[items.length - 1].lastMessageAt : null })
  } catch (e) { err500(res, e) }
}

const startThread = async (req, res) => {
  try {
    const target = parseKey(req.body.to)
    const body = cleanBody(req.body.body)
    const attachments = attachmentsFrom(req)
    if (!target) { dropFiles(req); return res.status(400).json({ success: false, message: 'Choose who to write to' }) }
    if (!body && !attachments.length) { dropFiles(req); return res.status(400).json({ success: false, message: 'Write a message first' }) }
    if (!ROLES.includes(req.actor.role)) { dropFiles(req); return res.status(403).json({ success: false, message: 'Not allowed' }) }
    const key = me(req)
    const targetKey = `${target.role}:${target.id}`
    if (targetKey === key) { dropFiles(req); return res.status(400).json({ success: false, message: 'You can\'t message yourself' }) }
    const scope = { studentId: req.body.studentId, childId: req.body.childId }
    // Reuse the conversation about the same child if there is one (then it's a reply, not a start).
    const auth0 = await links.authorize(req.actor, target, { ...scope, starting: false })
    if (auth0.error) { dropFiles(req); return sendFail(res, auth0) }
    const pairKey = `${[key, targetKey].sort().join('|')}|${auth0.studentId || ''}`
    let thread = await Thread.findOne({ pairKey })
    if (!thread) {
      const auth = await links.authorize(req.actor, target, { ...scope, starting: true })
      if (auth.error) { dropFiles(req); return sendFail(res, auth) }
      const myName = req.actor.name || (await myDisplayName(req.actor))
      try {
        thread = await Thread.create({
          orgId: auth.orgId, pairKey, studentId: auth.studentId, childId: auth.childId, childName: auth.childName,
          subject: String(req.body.subject || '').trim().slice(0, 140), startedBy: key,
          participants: [
            { key, role: req.actor.role, id: String(req.actor.id), name: myName },
            { key: targetKey, role: target.role, id: String(target.id), name: auth.targetName },
          ],
        })
      } catch (e) {
        if (e.code !== 11000) throw e
        thread = await Thread.findOne({ pairKey })   // created at the same moment by the other side
      }
    }
    const msg = await addMessage(req, thread, { body, attachments })
    const fresh = await Thread.findById(thread._id).lean()
    res.status(201).json({ success: true, thread: threadView(fresh, key), message: messageView(msg.toObject(), key, null), notice: officeNotice(auth0.officeHours, req) })
  } catch (e) { dropFiles(req); err500(res, e) }
}

function officeNotice(officeHours, req) {
  if (!officeHours) return null
  const inside = links.withinOfficeHours(officeHours, { tz: req.get('x-timezone') || 'UTC' })
  return inside === false ? { officeHours, outsideOfficeHours: true, text: `Sent. Staff usually reply during office hours (${officeHours}).` } : null
}

async function myDisplayName(actor) {
  const { contactsFor } = require('../utils/recipients')
  const c = (await contactsFor([actor])).get(`${actor.role}:${actor.id}`)
  return c?.name || { parent: 'Parent', teacher: 'Teacher', admin: 'School office' }[actor.role]
}

const getMessages = async (req, res) => {
  try {
    const thread = await loadMyThread(req, res)
    if (!thread) return
    const key = me(req)
    const limit = pageSize(req.query.limit, 30, 100)
    const q = { threadId: thread._id }
    if (req.query.before && !Number.isNaN(Date.parse(req.query.before))) q.createdAt = { $lt: new Date(req.query.before) }
    const rows = await Message.find(q).sort({ createdAt: -1 }).limit(limit + 1).lean()
    const more = rows.length > limit
    const page = rows.slice(0, limit).reverse()
    // Opening the conversation reads it.
    const now = new Date()
    await Thread.updateOne({ _id: thread._id, 'participants.key': key }, { $set: { 'participants.$.lastReadAt': now, 'participants.$.unread': 0 } })
    const other = thread.participants.find((p) => p.key !== key)
    const fresh = await Thread.findById(thread._id).lean()
    let notice = null
    if (req.actor.role === 'parent') {
      const { getOrgPolicy } = require('../utils/orgPolicy')
      notice = officeNotice((await getOrgPolicy(thread.orgId)).officeHours, req)
    }
    res.json({
      success: true, thread: threadView(fresh, key), otherLastReadAt: other.lastReadAt,
      items: page.map((m) => messageView(m, key, other.lastReadAt)), nextBefore: more ? page[0].createdAt : null, notice,
    })
  } catch (e) { err500(res, e) }
}

const reply = async (req, res) => {
  try {
    const thread = await loadMyThread(req, res)
    if (!thread) { dropFiles(req); return }
    const body = cleanBody(req.body.body)
    const attachments = attachmentsFrom(req)
    if (!body && !attachments.length) { dropFiles(req); return res.status(400).json({ success: false, message: 'Write a message first' }) }
    if (thread.status === 'closed') { dropFiles(req); return res.status(409).json({ success: false, message: 'This conversation is closed' }) }
    // The link must still exist (a revoked link or a teacher who left can't keep writing).
    const other = thread.participants.find((p) => p.key !== me(req))
    const auth = await links.authorize(req.actor, { role: other.role, id: other.id }, { studentId: thread.studentId || undefined, starting: false })
    if (auth.error) { dropFiles(req); return sendFail(res, auth) }
    const msg = await addMessage(req, thread, { body, attachments })
    res.status(201).json({ success: true, message: messageView(msg.toObject(), me(req), other.lastReadAt), notice: officeNotice(auth.officeHours, req) })
  } catch (e) { dropFiles(req); err500(res, e) }
}

const markRead = async (req, res) => {
  try {
    const thread = await loadMyThread(req, res)
    if (!thread) return
    await Thread.updateOne({ _id: thread._id, 'participants.key': me(req) }, { $set: { 'participants.$.lastReadAt': new Date(), 'participants.$.unread': 0 } })
    res.json({ success: true })
  } catch (e) { err500(res, e) }
}

const setMuted = async (req, res) => {
  try {
    const thread = await loadMyThread(req, res)
    if (!thread) return
    await Thread.updateOne({ _id: thread._id, 'participants.key': me(req) }, { $set: { 'participants.$.muted': Boolean(req.body.muted) } })
    res.json({ success: true })
  } catch (e) { err500(res, e) }
}

const unreadCount = async (req, res) => {
  try {
    const key = me(req)
    const [r] = await Thread.aggregate([
      { $match: { 'participants.key': key } }, { $unwind: '$participants' }, { $match: { 'participants.key': key } },
      { $group: { _id: null, count: { $sum: '$participants.unread' }, threads: { $sum: { $cond: [{ $gt: ['$participants.unread', 0] }, 1, 0] } } } },
    ])
    res.json({ success: true, count: r?.count || 0, threads: r?.threads || 0 })
  } catch (e) { err500(res, e) }
}

const attachment = async (req, res) => {
  try {
    if (!isId(req.params.messageId)) return res.status(404).json({ success: false, message: 'Not found' })
    const msg = await Message.findById(req.params.messageId).lean()
    if (!msg || msg.hidden) return res.status(404).json({ success: false, message: 'Not found' })
    const key = me(req)
    const thread = await Thread.findOne({ _id: msg.threadId, 'participants.key': key }).select('_id').lean()
    const moderator = req.actor.role === 'superadmin' || (req.actor.role === 'admin' && (await links.adminOrgId(req.actor)) === msg.orgId && await MessageFlag.exists({ messageId: msg._id }))
    if (!thread && !moderator) return res.status(404).json({ success: false, message: 'Not found' })
    const a = msg.attachments?.[Number(req.params.index)]
    if (!a) return res.status(404).json({ success: false, message: 'Not found' })
    const file = path.join(ATTACH_DIR, path.basename(a.file))
    if (!fs.existsSync(file)) return res.status(404).json({ success: false, message: 'File no longer available' })
    res.set({ 'Content-Type': a.type, 'Content-Disposition': `${a.type === 'application/pdf' ? 'attachment' : 'inline'}; filename="${a.name.replace(/[^\w.\- ]/g, '_')}"`, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, max-age=300' })
    fs.createReadStream(file).pipe(res)
  } catch (e) { err500(res, e) }
}

// ── Abuse reports ─────────────────────────────────────────────────────────────

const REASONS = ['abuse', 'spam', 'inappropriate', 'safety', 'other']

const flag = async (req, res) => {
  try {
    if (!isId(req.params.messageId)) return res.status(404).json({ success: false, message: 'Message not found' })
    const key = me(req)
    const msg = await Message.findById(req.params.messageId)
    const thread = msg && await Thread.findOne({ _id: msg.threadId, 'participants.key': key }).lean()
    if (!msg || !thread) return res.status(404).json({ success: false, message: 'Message not found' })
    if (msg.senderKey === key) return res.status(400).json({ success: false, message: 'You can\'t report your own message' })
    const reason = REASONS.includes(req.body.reason) ? req.body.reason : 'other'
    try {
      await MessageFlag.create({ messageId: msg._id, threadId: msg.threadId, orgId: msg.orgId, reporterKey: key, senderKey: msg.senderKey, reason, note: String(req.body.note || '').slice(0, 500) })
    } catch (e) {
      if (e.code === 11000) return res.json({ success: true, already: true })
      throw e
    }
    msg.flagged = true
    await msg.save()
    const admins = await links.adminsOfOrg(msg.orgId)
    const to = [...admins.map((a) => ({ role: 'admin', id: a.id })), ...(process.env.SUPER_ADMIN_EMAIL ? [{ role: 'superadmin', id: process.env.SUPER_ADMIN_EMAIL }] : [])]
    await notify(to, { kind: 'approval', title: 'A message was reported', body: `Reason: ${reason}. Please review it.`, link: '/admin-dashboard?tab=messages&view=reports' })
    await audit(req, 'message.flag', { targetType: 'message', targetId: msg._id, orgId: msg.orgId, reason })
    res.status(201).json({ success: true })
  } catch (e) { err500(res, e) }
}

// Admins see their own school's reports; the super admin sees all.
async function moderatorOrg(req) {
  if (req.actor.role === 'superadmin') return { all: true }
  if (req.actor.role === 'admin') { const orgId = await links.adminOrgId(req.actor); return orgId ? { orgId } : null }
  return null
}

const listFlags = async (req, res) => {
  try {
    const mod = await moderatorOrg(req)
    if (!mod) return res.status(403).json({ success: false, message: 'Not allowed' })
    const q = mod.all ? {} : { orgId: mod.orgId }
    if (['open', 'dismissed', 'actioned'].includes(req.query.status)) q.status = req.query.status
    const limit = pageSize(req.query.limit)
    const page = Math.max(Number(req.query.page) || 1, 1)
    const [rows, total] = await Promise.all([MessageFlag.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), MessageFlag.countDocuments(q)])
    const msgs = new Map((await Message.find({ _id: { $in: rows.map((r) => r.messageId) } }).lean()).map((m) => [String(m._id), m]))
    const threads = new Map((await Thread.find({ _id: { $in: rows.map((r) => r.threadId) } }).lean()).map((t) => [String(t._id), t]))
    const nameOf = (t, k) => t?.participants.find((p) => p.key === k)
    const items = rows.map((r) => {
      const m = msgs.get(String(r.messageId)); const t = threads.get(String(r.threadId))
      const sender = nameOf(t, r.senderKey), reporter = nameOf(t, r.reporterKey)
      return {
        id: String(r._id), reason: r.reason, note: r.note, status: r.status, createdAt: r.createdAt, orgId: mod.all ? r.orgId : undefined,
        message: m ? { id: String(m._id), body: m.body, hidden: m.hidden, createdAt: m.createdAt, attachments: (m.attachments || []).length } : null,
        sender: sender ? { role: sender.role, name: sender.name } : null, reporter: reporter ? { role: reporter.role, name: reporter.name } : null,
        childName: t?.childName || '',
      }
    })
    res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) })
  } catch (e) { err500(res, e) }
}

const reviewFlag = async (req, res) => {
  try {
    const mod = await moderatorOrg(req)
    if (!mod) return res.status(403).json({ success: false, message: 'Not allowed' })
    if (!isId(req.params.id)) return res.status(404).json({ success: false, message: 'Report not found' })
    const f = await MessageFlag.findOne({ _id: req.params.id, ...(mod.all ? {} : { orgId: mod.orgId }) })
    if (!f) return res.status(404).json({ success: false, message: 'Report not found' })
    const action = req.body.action
    if (!['dismiss', 'hide'].includes(action)) return res.status(400).json({ success: false, message: 'action must be dismiss or hide' })
    f.status = action === 'hide' ? 'actioned' : 'dismissed'
    f.reviewedBy = me(req); f.reviewedAt = new Date()
    await f.save()
    if (action === 'hide') await Message.updateOne({ _id: f.messageId }, { hidden: true })
    await audit(req, `message.flag.${action}`, { targetType: 'message', targetId: f.messageId, orgId: f.orgId, reason: String(req.body.reason || '') })
    res.json({ success: true, status: f.status })
  } catch (e) { err500(res, e) }
}

// ── Metrics for the school (counts and reply times, never content) ───────────

const median = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2) }

const metrics = async (req, res) => {
  try {
    if (req.actor.role !== 'admin') return res.status(403).json({ success: false, message: 'Not allowed' })
    const orgId = await links.adminOrgId(req.actor)
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization not found' })
    const ISO = /^\d{4}-\d{2}-\d{2}$/
    const to = ISO.test(req.query.to || '') ? new Date(`${req.query.to}T23:59:59.999Z`) : new Date()
    const from = ISO.test(req.query.from || '') ? new Date(`${req.query.from}T00:00:00Z`) : new Date(to.getTime() - 29 * 86400000)
    if (from > to) return res.status(400).json({ success: false, message: 'from must be before to' })
    const range = { $gte: from, $lte: to }
    const [byRole, threads, openFlags] = await Promise.all([
      Message.aggregate([{ $match: { orgId, createdAt: range } }, { $group: { _id: '$senderRole', n: { $sum: 1 } } }]),
      Thread.find({ orgId, createdAt: range }).select('startedBy firstReplyMs participants lastSenderKey createdAt').lean(),
      MessageFlag.countDocuments({ orgId, status: 'open' }),
    ])
    const fromParents = threads.filter((t) => t.startedBy.startsWith('parent:'))
    const replied = fromParents.filter((t) => t.firstReplyMs != null)
    const awaiting = await Thread.countDocuments({ orgId, lastSenderKey: /^parent:/, status: 'open' })
    // Per teacher: threads and median first reply (names only).
    const perStaff = new Map()
    for (const t of fromParents) {
      const staff = t.participants.find((p) => p.role !== 'parent')
      if (!staff) continue
      const s = perStaff.get(staff.key) || { role: staff.role, name: staff.name, threads: 0, replied: 0, replyMs: [] }
      s.threads++
      if (t.firstReplyMs != null) { s.replied++; s.replyMs.push(t.firstReplyMs) }
      perStaff.set(staff.key, s)
    }
    const hours = (ms) => (ms == null ? null : Math.round((ms / 3600000) * 10) / 10)
    res.json({
      success: true,
      range: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
      messages: { total: byRole.reduce((a, r) => a + r.n, 0), byRole: Object.fromEntries(byRole.map((r) => [r._id, r.n])) },
      threads: { started: threads.length, startedByParents: fromParents.length, replied: replied.length, awaitingReply: awaiting },
      replyTime: { medianHours: hours(median(replied.map((t) => t.firstReplyMs))), within24h: replied.length ? Math.round((replied.filter((t) => t.firstReplyMs <= 86400000).length / replied.length) * 100) : null },
      staff: [...perStaff.values()].map((s) => ({ role: s.role, name: s.name, threads: s.threads, replied: s.replied, medianReplyHours: hours(median(s.replyMs)) })).sort((a, b) => b.threads - a.threads),
      openReports: openFlags,
    })
  } catch (e) { err500(res, e) }
}

module.exports = { contacts, listThreads, startThread, getMessages, reply, markRead, setMuted, unreadCount, attachment, flag, listFlags, reviewFlag, metrics, maybeUpload, ATTACH_DIR, MAX_BYTES }
