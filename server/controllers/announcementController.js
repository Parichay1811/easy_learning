// Announcements (FND-052): compose, my feed, read receipts, read-rate report.
const mongoose = require('mongoose')
const Announcement = require('../models/comms/Announcement')
const AnnouncementReceipt = require('../models/comms/AnnouncementReceipt')
const svc = require('../services/announcements')
const { entitlementsFor } = require('../utils/entitlements')
const { contactsFor } = require('../utils/recipients')
const { audit } = require('../utils/audit')

const me = (req) => `${req.actor.role}:${req.actor.id}`
const isId = (id) => mongoose.isValidObjectId(String(id || ''))
const err500 = (res, e) => { console.error('announcement error:', e); res.status(500).json({ success: false, message: 'Internal server error' }) }
const pageSize = (q, d = 20, max = 50) => Math.min(Math.max(Number(q) || d, 1), max)
const date = (v) => (v && !Number.isNaN(Date.parse(v)) ? new Date(v) : null)

const view = (a, extra = {}) => ({
  id: String(a._id), title: a.title, body: a.body, link: a.link, label: a.label, authorRole: a.authorRole, authorName: a.authorName,
  publishAt: a.publishAt, expiresAt: a.expiresAt, sentAt: a.sentAt, ...extra,
})

// POST /api/announcements { title, body, link?, audience: { type, ids?, grade?, includeParents?, includeStaff?, roles?, orgKind?, plans? }, publishAt?, expiresAt? }
const compose = async (req, res) => {
  try {
    if (!svc.AUTHORITY[req.actor.role]) return res.status(403).json({ success: false, message: 'Not allowed' })
    const title = String(req.body.title || '').trim().slice(0, 140)
    const body = String(req.body.body || '').trim().slice(0, 5000)
    if (!title || !body) return res.status(400).json({ success: false, message: 'A title and a message are needed' })
    const link = String(req.body.link || '').trim()
    if (link && !/^(\/[^\s]*|https:\/\/[^\s]+)$/.test(link)) return res.status(400).json({ success: false, message: 'The link must start with / or https://' })
    const publishAt = date(req.body.publishAt) || new Date()
    const expiresAt = date(req.body.expiresAt)
    if (expiresAt && expiresAt <= publishAt) return res.status(400).json({ success: false, message: 'It must expire after it is published' })
    if (publishAt > new Date(Date.now() + 366 * 86400000)) return res.status(400).json({ success: false, message: 'Schedule within the next year' })
    const author = await svc.authorFor(req.actor)
    if (author.role !== 'superadmin') {
      if (!author.orgId) return res.status(403).json({ success: false, message: 'No school found for your account' })
      const ent = await entitlementsFor({ role: 'admin', orgId: author.orgId })
      if (!ent.modules.includes('comms')) return res.status(402).json({ success: false, code: 'MODULE_LOCKED', module: 'comms', message: 'Announcements aren\'t part of your plan.' })
    }
    const aud = req.body.audience || {}
    const audience = {
      type: aud.type, ids: Array.isArray(aud.ids) ? aud.ids.map(String).slice(0, 50) : [], grade: String(aud.grade || '').slice(0, 40),
      includeParents: aud.includeParents !== false, includeStaff: aud.includeStaff !== false,
      roles: Array.isArray(aud.roles) ? aud.roles.filter((r) => ['parent', 'teacher', 'admin'].includes(r)) : [],
      orgKind: ['solo', 'institute'].includes(aud.orgKind) ? aud.orgKind : '', plans: Array.isArray(aud.plans) ? aud.plans.map(String).slice(0, 10) : [],
    }
    const resolved = await svc.resolveAudience(author, audience)
    if (resolved.error) return res.status(resolved.error.status).json({ success: false, message: resolved.error.message, code: resolved.error.code })
    if (req.body.dryRun) return res.json({ success: true, recipients: resolved.recipients.length, label: resolved.label })
    const authorName = req.actor.role === 'superadmin' ? 'Learnigo' : req.actor.name ||(await contactsFor([req.actor])).get(me(req))?.name || ''
    const a = await Announcement.create({ authorKey: me(req), authorRole: req.actor.role, authorName, orgId: author.orgId || '', audience, label: resolved.label, title, body, link, publishAt, expiresAt })
    await audit(req, 'announcement.create', { targetType: 'announcement', targetId: a._id, orgId: author.orgId || '', meta: { audience: audience.type, recipients: resolved.recipients.length } })
    const sent = publishAt <= new Date() ? await svc.deliver(a._id) : null
    const fresh = sent || a
    res.status(201).json({ success: true, announcement: view(fresh, { status: fresh.status, recipientCount: fresh.recipientCount }) })
  } catch (e) { err500(res, e) }
}

// GET /api/announcements: my inbox, newest first, not expired.
const feed = async (req, res) => {
  try {
    const to = me(req)
    const limit = pageSize(req.query.limit)
    const now = new Date()
    const q = { to, $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }
    if (req.query.before && !Number.isNaN(Date.parse(req.query.before))) q.createdAt = { $lt: new Date(req.query.before) }
    const [rows, unread] = await Promise.all([
      AnnouncementReceipt.find(q).sort({ createdAt: -1 }).limit(limit + 1).lean(),
      AnnouncementReceipt.countDocuments({ to, readAt: null, $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }),
    ])
    const more = rows.length > limit
    const page = rows.slice(0, limit)
    const anns = new Map((await Announcement.find({ _id: { $in: page.map((r) => r.announcementId) }, status: 'sent' }).lean()).map((a) => [String(a._id), a]))
    const items = page.filter((r) => anns.has(String(r.announcementId))).map((r) => view(anns.get(String(r.announcementId)), { readAt: r.readAt, receivedAt: r.createdAt }))
    res.json({ success: true, items, unread, nextBefore: more ? page[page.length - 1].createdAt : null })
  } catch (e) { err500(res, e) }
}

const markRead = async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ success: false, message: 'Not found' })
    const r = await AnnouncementReceipt.updateOne({ announcementId: req.params.id, to: me(req), readAt: null }, { readAt: new Date() })
    res.json({ success: true, updated: r.modifiedCount })
  } catch (e) { err500(res, e) }
}

// Who may see an announcement's report: its author, an admin of its school, the super admin.
async function canManage(req, a) {
  if (req.actor.role === 'superadmin') return true
  if (a.authorKey === me(req)) return true
  if (req.actor.role === 'admin' && a.orgId) {
    const { adminOrgId } = require('../services/commsLinks')
    return (await adminOrgId(req.actor)) === a.orgId
  }
  return false
}

// GET /api/announcements/sent: what I sent (admins: everything sent at their school).
const sent = async (req, res) => {
  try {
    if (!svc.AUTHORITY[req.actor.role]) return res.status(403).json({ success: false, message: 'Not allowed' })
    const limit = pageSize(req.query.limit)
    const page = Math.max(Number(req.query.page) || 1, 1)
    let q = { authorKey: me(req) }
    if (req.actor.role === 'admin') {
      const { adminOrgId } = require('../services/commsLinks')
      const orgId = await adminOrgId(req.actor)
      q = orgId ? { orgId } : q
    }
    const [rows, total] = await Promise.all([Announcement.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Announcement.countDocuments(q)])
    const reads = await AnnouncementReceipt.aggregate([{ $match: { announcementId: { $in: rows.map((r) => r._id) } } }, { $group: { _id: '$announcementId', total: { $sum: 1 }, read: { $sum: { $cond: [{ $ne: ['$readAt', null] }, 1, 0] } } } }])
    const by = new Map(reads.map((r) => [String(r._id), r]))
    const items = rows.map((a) => { const r = by.get(String(a._id)) || { total: 0, read: 0 }; return view(a, { status: a.status, recipientCount: r.total, readCount: r.read, readRate: r.total ? Math.round((r.read / r.total) * 100) : null, mine: a.authorKey === me(req) }) })
    res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) })
  } catch (e) { err500(res, e) }
}

// GET /api/announcements/:id/report: read rate overall and by role; names of who hasn't read (school announcements only).
const report = async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ success: false, message: 'Not found' })
    const a = await Announcement.findById(req.params.id).lean()
    if (!a || !(await canManage(req, a))) return res.status(404).json({ success: false, message: 'Not found' })
    const byRole = await AnnouncementReceipt.aggregate([{ $match: { announcementId: a._id } }, { $group: { _id: '$role', total: { $sum: 1 }, read: { $sum: { $cond: [{ $ne: ['$readAt', null] }, 1, 0] } } } }])
    const total = byRole.reduce((s, r) => s + r.total, 0), read = byRole.reduce((s, r) => s + r.read, 0)
    let notYetRead = []
    if (a.orgId) {
      const unread = await AnnouncementReceipt.find({ announcementId: a._id, readAt: null }).limit(200).lean()
      const contacts = await contactsFor(unread.map((r) => { const [role, ...id] = r.to.split(':'); return { role, id: id.join(':') } }))
      notYetRead = unread.map((r) => ({ role: r.role, name: contacts.get(r.to)?.name || '' }))
    }
    res.json({
      success: true, announcement: view(a, { status: a.status }),
      total, read, readRate: total ? Math.round((read / total) * 100) : null,
      byRole: Object.fromEntries(byRole.map((r) => [r._id, { total: r.total, read: r.read }])), notYetRead,
    })
  } catch (e) { err500(res, e) }
}

// DELETE /api/announcements/:id: cancel a scheduled one, or withdraw a sent one (hidden from feeds).
const cancel = async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ success: false, message: 'Not found' })
    const a = await Announcement.findById(req.params.id)
    if (!a || !(await canManage(req, a))) return res.status(404).json({ success: false, message: 'Not found' })
    if (a.status === 'sending') return res.status(409).json({ success: false, message: 'It is being sent right now. Try again in a minute.' })
    if (a.status === 'sent') { a.expiresAt = new Date(); await AnnouncementReceipt.updateMany({ announcementId: a._id }, { expiresAt: a.expiresAt }) }
    else a.status = 'cancelled'
    await a.save()
    await audit(req, 'announcement.cancel', { targetType: 'announcement', targetId: a._id, orgId: a.orgId })
    res.json({ success: true, status: a.status })
  } catch (e) { err500(res, e) }
}

// GET /api/announcements/audiences: what this person may send to (groups etc.), for the composer.
const audiences = async (req, res) => {
  try {
    if (!svc.AUTHORITY[req.actor.role]) return res.status(403).json({ success: false, message: 'Not allowed' })
    const author = await svc.authorFor(req.actor)
    const out = { types: svc.AUTHORITY[req.actor.role], groups: [], grades: [], units: [] }
    if (author.orgId) {
      const Batch = require('../models/admin/Batch')
      const Student = require('../models/admin/Student')
      const { teachesBatch } = require('../utils/scopes')
      let batches = await Batch.find({ orgId: author.orgId, status: { $ne: 'inactive' } }).select('name tutorIds directTutorIds subjects').lean()
      if (author.role === 'teacher') batches = batches.filter((b) => teachesBatch(b, author.id))
      out.groups = batches.map((b) => ({ id: String(b._id), name: b.name }))
      if (author.role === 'admin') {
        out.grades = (await Student.distinct('grade', { orgId: author.orgId, status: 'active' })).filter(Boolean).sort()
        try { out.units = (await require('../models/admin/OrgUnit').find({ orgId: author.orgId }).select('name path').lean()).map((u) => ({ id: String(u._id), name: u.name, path: u.path })) } catch { /* units not built yet */ }
      }
    }
    res.json({ success: true, ...out })
  } catch (e) { err500(res, e) }
}

module.exports = { compose, feed, markRead, sent, report, cancel, audiences }
