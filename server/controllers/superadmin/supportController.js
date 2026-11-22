// Support, trust and safety (SUP-060, SUP-061): one inbox for contact
// messages, admin chats and parent chats with assignment, status, tags,
// canned replies and internal notes; and the data-rights queue (export and
// delete requests) with due dates, a footprint across all three databases and
// a proof of completion.
const crypto = require('crypto')
const mongoose = require('mongoose')
const ContactMessage = require('../../models/ContactMessage')
const ChatMessage = require('../../models/superadmin/ChatMessage')
const ParentChatMessage = require('../../models/ParentChatMessage')
const SupportThread = require('../../models/superadmin/SupportThread')
const SAOrg = require('../../models/superadmin/Organization')
const ParentAccount = require('../../models/ParentAccount')
const DataRequest = require('../../models/DataRequest')
const { audit } = require('../../utils/audit')
const { sendMail } = require('../../utils/mailer')
const { notify } = require('../../utils/notify')
const { clear } = require('../../utils/ttlCache')
const { h, fail, needId, paging, rx, by, staffName } = require('./util')

const KINDS = ['contact', 'admin_chat', 'parent_chat']
const CONTACT_STATUS = { open: 'open', in_progress: 'pending', resolved: 'resolved' }

// ── SUP-060 inbox ───────────────────────────────────────────────────────────
async function allThreads() {
  const [contacts, adminChats, parentChats, metas] = await Promise.all([
    ContactMessage.find().sort({ createdAt: -1 }).limit(500).lean(),
    ChatMessage.aggregate([{ $sort: { createdAt: 1 } }, { $group: { _id: '$adminUid', orgName: { $last: '$orgName' }, last: { $last: '$message' }, lastAt: { $last: '$createdAt' }, lastFrom: { $last: '$senderRole' }, unread: { $sum: { $cond: [{ $and: [{ $eq: ['$senderRole', 'admin'] }, { $eq: ['$readBySuperadmin', false] }] }, 1, 0] } }, count: { $sum: 1 } } }]),
    ParentChatMessage.aggregate([{ $sort: { createdAt: 1 } }, { $group: { _id: '$parentUid', parentName: { $last: '$parentName' }, last: { $last: '$message' }, lastAt: { $last: '$createdAt' }, lastFrom: { $last: '$senderRole' }, unread: { $sum: { $cond: [{ $and: [{ $eq: ['$senderRole', 'parent'] }, { $eq: ['$readBySuperadmin', false] }] }, 1, 0] } }, count: { $sum: 1 } } }]),
    SupportThread.find().lean(),
  ])
  const meta = new Map(metas.map((m) => [`${m.kind}:${m.ref}`, m]))
  const withMeta = (t) => {
    const m = meta.get(`${t.kind}:${t.ref}`)
    return { ...t, status: m?.status || t.status, assigneeId: m?.assigneeId || '', assigneeName: m?.assigneeName || '', tags: m?.tags || [], notes: (m?.notes || []).length }
  }
  return [
    ...contacts.map((c) => withMeta({ kind: 'contact', ref: String(c._id), title: c.subject, who: c.name, email: c.email, role: c.role, orgName: c.orgName, last: c.reply || c.message, lastAt: c.respondedAt || c.createdAt, unread: c.status === 'open' && !c.reply ? 1 : 0, status: CONTACT_STATUS[c.status] || 'open', count: c.reply ? 2 : 1 })),
    ...adminChats.map((c) => withMeta({ kind: 'admin_chat', ref: c._id, title: c.orgName || 'Organisation admin', who: c.orgName, role: 'admin', last: c.last, lastAt: c.lastAt, unread: c.unread, status: c.lastFrom === 'admin' ? 'open' : 'pending', count: c.count })),
    ...parentChats.map((c) => withMeta({ kind: 'parent_chat', ref: c._id, title: c.parentName || 'Parent', who: c.parentName, role: 'parent', last: c.last, lastAt: c.lastAt, unread: c.unread, status: c.lastFrom === 'parent' ? 'open' : 'pending', count: c.count })),
  ]
}

const inbox = h(async (req) => {
  const { limit, page, skip } = paging(req.query, { def: 30 })
  let list = await allThreads()
  const meId = req.superadmin.staffId || req.superadmin.email
  const mine = (t) => !!t.assigneeId && t.assigneeId === meId
  const counts = { open: list.filter((t) => t.status === 'open').length, pending: list.filter((t) => t.status === 'pending').length, mine: list.filter((t) => mine(t) && t.status !== 'resolved').length, unassigned: list.filter((t) => !t.assigneeId && t.status !== 'resolved').length }
  if (req.query.kind) list = list.filter((t) => t.kind === req.query.kind)
  if (req.query.status) list = list.filter((t) => t.status === req.query.status)
  if (req.query.assignee === 'me') list = list.filter(mine)
  else if (req.query.assignee === 'none') list = list.filter((t) => !t.assigneeId)
  if (req.query.q) { const r = rx(req.query.q); list = list.filter((t) => r.test(t.title || '') || r.test(t.who || '') || r.test(t.email || '') || r.test(t.last || '')) }
  list.sort((a, b) => (b.unread > 0) - (a.unread > 0) || new Date(b.lastAt) - new Date(a.lastAt))
  return { total: list.length, page, counts, rows: list.slice(skip, skip + limit) }
})

function checkKind(kind) { if (!KINDS.includes(kind)) throw fail(404, 'Unknown conversation') }

const thread = h(async (req) => {
  const { kind, ref } = req.params
  checkKind(kind)
  let messages = []
  let links = {}
  let head = {}
  if (kind === 'contact') {
    needId(ref, 'Message')
    const c = await ContactMessage.findById(ref).lean()
    if (!c) throw fail(404, 'Message not found')
    head = { title: c.subject, who: c.name, email: c.email, role: c.role, orgName: c.orgName, attachmentUrl: c.attachmentUrl, contactStatus: c.status }
    messages = [{ from: c.role, text: c.message, at: c.createdAt }, ...(c.reply ? [{ from: 'superadmin', text: c.reply, at: c.respondedAt }] : [])]
    const sa = c.orgName ? await SAOrg.findOne({ $or: [{ adminEmail: c.email }, { name: c.orgName }] }).select('_id name').lean() : await SAOrg.findOne({ adminEmail: c.email }).select('_id name').lean()
    if (sa) links.org = { id: String(sa._id), name: sa.name }
  } else if (kind === 'admin_chat') {
    const msgs = await ChatMessage.find({ adminUid: ref }).sort({ createdAt: 1 }).limit(500).lean()
    if (!msgs.length) throw fail(404, 'Conversation not found')
    await ChatMessage.updateMany({ adminUid: ref, senderRole: 'admin', readBySuperadmin: false }, { readBySuperadmin: true })
    messages = msgs.map((m) => ({ from: m.senderRole, text: m.message, at: m.createdAt }))
    const sa = await SAOrg.findOne({ adminUid: ref }).select('_id name adminEmail').lean()
    head = { title: sa?.name || msgs[msgs.length - 1].orgName, role: 'admin', email: sa?.adminEmail }
    if (sa) links.org = { id: String(sa._id), name: sa.name }
  } else {
    const msgs = await ParentChatMessage.find({ parentUid: ref }).sort({ createdAt: 1 }).limit(500).lean()
    if (!msgs.length) throw fail(404, 'Conversation not found')
    await ParentChatMessage.updateMany({ parentUid: ref, senderRole: 'parent', readBySuperadmin: false }, { readBySuperadmin: true })
    messages = msgs.map((m) => ({ from: m.senderRole, text: m.message, at: m.createdAt }))
    const p = await ParentAccount.findOne({ uid: ref }).select('_id name email').lean()
    head = { title: p?.name || msgs[msgs.length - 1].parentName, role: 'parent', email: p?.email }
    if (p) links.person = { role: 'parent', id: String(p._id), name: p.name }
  }
  const meta = await SupportThread.findOne({ kind, ref }).lean()
  return { kind, ref, head, messages, links, meta: meta ? { ...meta, id: String(meta._id) } : { status: 'open', assigneeId: '', tags: [], notes: [] } }
})

async function upsertMeta(kind, ref, update) {
  return SupportThread.findOneAndUpdate({ kind, ref }, update, { upsert: true, new: true, setDefaultsOnInsert: true }).lean()
}

const updateThread = h(async (req) => {
  const { kind, ref } = req.params
  checkKind(kind)
  const set = {}
  if (req.body.status !== undefined) { if (!['open', 'pending', 'resolved'].includes(req.body.status)) throw fail(400, 'Unknown status.'); set.status = req.body.status }
  if (req.body.assigneeId !== undefined) {
    if (req.body.assigneeId === 'me') { set.assigneeId = req.superadmin.staffId || req.superadmin.email; set.assigneeName = staffName(req) } else if (!req.body.assigneeId) { set.assigneeId = ''; set.assigneeName = '' } else {
      const Staff = require('../../models/superadmin/Staff')
      needId(req.body.assigneeId, 'Staff member')
      const s = await Staff.findById(req.body.assigneeId).select('name status').lean()
      if (!s || s.status !== 'active') throw fail(400, 'Choose an active staff member.')
      set.assigneeId = String(s._id); set.assigneeName = s.name
      await notify({ role: 'superadmin', id: String(s._id) }, { kind: 'support', title: 'A conversation was assigned to you', body: `${staffName(req)} assigned you a ${kind.replace('_', ' ')}.`, link: '/superadmin-dashboard?section=support' })
    }
  }
  if (req.body.tags !== undefined) { if (!Array.isArray(req.body.tags)) throw fail(400, 'tags must be a list.'); set.tags = [...new Set(req.body.tags.map((t) => String(t).trim().toLowerCase().slice(0, 30)).filter(Boolean))].slice(0, 10) }
  const meta = await upsertMeta(kind, ref, { $set: set })
  if (kind === 'contact' && set.status && /^[a-f0-9]{24}$/.test(ref)) await ContactMessage.updateOne({ _id: ref }, { status: set.status === 'pending' ? 'in_progress' : set.status })
  clear('platform:live')
  await audit(req, 'support.thread.update', { targetType: kind, targetId: ref, meta: set })
  return { meta }
})

const addNote = h(async (req) => {
  const { kind, ref } = req.params
  checkKind(kind)
  const text = String(req.body?.text || '').trim()
  if (!text) throw fail(400, 'Write a note.')
  const meta = await upsertMeta(kind, ref, { $push: { notes: { at: new Date(), by: staffName(req), text: text.slice(0, 2000) } } })
  return { meta }
})

const reply = h(async (req) => {
  const { kind, ref } = req.params
  checkKind(kind)
  const message = String(req.body?.message || '').trim()
  if (!message) throw fail(400, 'Write a reply.')
  if (message.length > 5000) throw fail(400, 'That reply is too long.')
  if (kind === 'contact') {
    needId(ref, 'Message')
    const c = await ContactMessage.findByIdAndUpdate(ref, { reply: message, respondedAt: new Date(), status: 'in_progress' }, { new: true }).lean()
    if (!c) throw fail(404, 'Message not found')
    await sendMail({ to: c.email, kind: 'support_reply', subject: `Re: ${c.subject}`, text: `Hello ${c.name},\n\n${message}\n\n${staffName(req)}, Learnigo support` })
  } else if (kind === 'admin_chat') {
    const sa = await SAOrg.findOne({ adminUid: ref }).select('name').lean()
    if (!sa && !(await ChatMessage.exists({ adminUid: ref }))) throw fail(404, 'Conversation not found')
    await ChatMessage.create({ adminUid: ref, orgName: sa?.name || '', senderRole: 'superadmin', message, readByAdmin: false, readBySuperadmin: true })
  } else {
    if (!(await ParentChatMessage.exists({ parentUid: ref }))) throw fail(404, 'Conversation not found')
    const p = await ParentAccount.findOne({ uid: ref }).select('name').lean()
    await ParentChatMessage.create({ parentUid: ref, parentName: p?.name || '', senderRole: 'superadmin', message, readByParent: false, readBySuperadmin: true })
  }
  const meta = await upsertMeta(kind, ref, { $set: { status: req.body?.resolve ? 'resolved' : 'pending', ...(req.body?.resolve ? {} : {}) } })
  clear('platform:live')
  await audit(req, 'support.reply', { targetType: kind, targetId: ref })
  return { meta }
})

// ── SUP-061 data-rights queue ────────────────────────────────────────────────
// Where a learner's data lives, by email, in all three databases.
const FOOTPRINT = {
  main: ['learnerdays', 'learningevents', 'studentactivities', 'studentrounds', 'studentanswers', 'studentachievements', 'arsessions', 'linkcodes', 'children', 'users', 'learnerprofiles', 'skillmasteries', 'learningdecisions'],
  admin: ['students', 'parents'],
  superadmin: ['contactmessages'],
}
async function footprint(email) {
  const conns = { main: mongoose.connection, admin: require('../../db/adminDb'), superadmin: require('../../db/superAdminDb') }
  const out = []
  for (const [db, cols] of Object.entries(FOOTPRINT)) {
    for (const col of cols) {
      let n = 0
      try { n = await conns[db].db.collection(col).countDocuments({ email }) } catch { n = 0 }
      out.push({ db, collection: col, count: n })
    }
  }
  return out
}

const view = (r) => {
  const daysLeft = r.dueAt ? Math.ceil((new Date(r.dueAt) - Date.now()) / 86400_000) : null
  return { ...r, id: String(r._id), daysLeft, overdue: ['pending', 'processing'].includes(r.status) && daysLeft != null && daysLeft < 0 }
}

const listRequests = h(async (req) => {
  const { limit, skip, page } = paging(req.query, { def: 30 })
  const f = {}
  if (req.query.status) f.status = String(req.query.status)
  else f.status = { $in: ['pending', 'processing'] }
  if (req.query.status === 'all') delete f.status
  if (req.query.kind) f.kind = String(req.query.kind)
  if (req.query.q) f.subjectEmail = rx(req.query.q)
  const [total, rows, counts] = await Promise.all([
    DataRequest.countDocuments(f), DataRequest.find(f).sort({ dueAt: 1 }).skip(skip).limit(limit).lean(),
    DataRequest.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ])
  return { total, page, rows: rows.map(view), counts: Object.fromEntries(counts.map((c) => [c._id, c.n])), service: hasService() }
})

function hasService() {
  return Object.keys(require('../../services/dataRights'))
}

const getRequest = h(async (req) => {
  needId(req.params.id, 'Request')
  const r = await DataRequest.findById(req.params.id).lean()
  if (!r) throw fail(404, 'Request not found')
  const fp = await footprint(r.subjectEmail)
  await audit(req, 'data_rights.view', { targetType: 'learner', targetId: r.subjectEmail, orgId: r.orgId || '', meta: { requestId: String(r._id) } })
  return { request: view(r), footprint: fp, remaining: fp.reduce((s, x) => s + x.count, 0), service: hasService() }
})

const updateRequest = h(async (req) => {
  needId(req.params.id, 'Request')
  const r = await DataRequest.findById(req.params.id)
  if (!r) throw fail(404, 'Request not found')
  const status = String(req.body?.status || '')
  const note = String(req.body?.note || '').trim().slice(0, 2000)
  if (!['processing', 'done', 'rejected', 'pending'].includes(status)) throw fail(400, 'Unknown status.')
  if (status === 'rejected' && note.length < 5) throw fail(400, 'Say why the request is rejected.')
  let proof = null
  if (status === 'done') {
    if (r.kind === 'delete') {
      const fp = await footprint(r.subjectEmail)
      const remaining = fp.filter((x) => x.count > 0)
      if (remaining.length) throw fail(409, `Data still exists in ${remaining.map((x) => `${x.db}.${x.collection} (${x.count})`).join(', ')}. Run the deletion first.`, 'DATA_REMAINS')
      proof = { checkedAt: new Date().toISOString(), collections: fp.length, sha256: crypto.createHash('sha256').update(JSON.stringify(fp)).digest('hex') }
    }
    r.resolvedAt = new Date()
    r.resolvedBy = by(req)
  }
  if (status === 'rejected') { r.resolvedAt = new Date(); r.resolvedBy = by(req) }
  r.status = status
  r.note = [r.note, note && `${new Date().toISOString().slice(0, 10)} ${staffName(req)}: ${note}`, proof && `Proof of deletion: 0 records in ${proof.collections} collections, checked ${proof.checkedAt}, sha256 ${proof.sha256.slice(0, 16)}`].filter(Boolean).join('\n')
  await r.save()
  clear('platform:live')
  await audit(req, `data_rights.${status}`, { targetType: 'learner', targetId: r.subjectEmail, orgId: r.orgId || '', reason: note, meta: { requestId: String(r._id), kind: r.kind, proof } })
  if (['done', 'rejected'].includes(status) && r.requestedByRole && r.requestedById) {
    await notify({ role: r.requestedByRole, id: r.requestedById }, { kind: 'privacy', title: status === 'done' ? `Your ${r.kind} request is complete` : `Your ${r.kind} request was not completed`, body: status === 'done' ? `We finished the ${r.kind} request for ${r.subjectName || r.subjectEmail}.` : note })
  }
  return { request: view(r.toObject()), proof }
})

// The full export bundle (JSON), from every database, for an export request.
const exportBundle = async (req, res) => {
  try {
    needId(req.params.id, 'Request')
    const r = await DataRequest.findById(req.params.id).lean()
    if (!r) return res.status(404).json({ success: false, message: 'Request not found' })
    let bundle
    const svc = (() => { try { return require('../../services/dataRights') } catch { return null } })()
    if (svc && typeof svc.exportLearner === 'function') bundle = await svc.exportLearner(r.subjectEmail)
    else {
      const conns = { main: mongoose.connection, admin: require('../../db/adminDb'), superadmin: require('../../db/superAdminDb') }
      bundle = { subject: r.subjectEmail, generatedAt: new Date().toISOString(), data: {} }
      for (const [db, cols] of Object.entries(FOOTPRINT)) {
        for (const col of cols) {
          const docs = await conns[db].db.collection(col).find({ email: r.subjectEmail }, { projection: { passwordHash: 0, codeHash: 0 } }).limit(20000).toArray()
          if (docs.length) bundle.data[`${db}.${col}`] = docs
        }
      }
    }
    await audit(req, 'data_rights.export_download', { targetType: 'learner', targetId: r.subjectEmail, orgId: r.orgId || '', meta: { requestId: String(r._id) } })
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="learnigo-export-${r.subjectEmail.replace(/[^a-z0-9]/gi, '_')}.json"`)
    res.send(JSON.stringify(bundle, null, 2))
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    console.error('export bundle error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// Erases a learner through services/dataRights.js (the real cascade across all three
// databases). Families get a 30-day grace period to change their mind, so a deletion
// can only run once `dueAt` has passed; approved requests also run on their own
// (daily job `dataRights.erase`).
const runDeletion = h(async (req) => {
  needId(req.params.id, 'Request')
  const r = await DataRequest.findById(req.params.id)
  if (!r) throw fail(404, 'Request not found')
  if (r.kind !== 'delete') throw fail(400, 'Only delete requests run a deletion.')
  if (r.status === 'rejected' || r.status === 'done') throw fail(409, `This request is already ${r.status}.`)
  if (r.dueAt && new Date(r.dueAt) > new Date()) {
    throw fail(409, `The family can still cancel until ${new Date(r.dueAt).toISOString().slice(0, 10)}. Approve it now; it is erased automatically after that date.`, 'GRACE_PERIOD')
  }
  const svc = require('../../services/dataRights')
  r.status = 'processing'
  await r.save()
  const result = await svc.eraseLearner(r.subjectEmail)
  r.result = result
  await r.save()
  await audit(req, 'learner.erase', { targetType: 'learner', targetId: r.subjectEmail, orgId: r.orgId || '', meta: { requestId: String(r._id), result: result ?? null } })
  return { result: result ?? null, footprint: await footprint(r.subjectEmail) }
})

// Erase every approved deletion whose grace period is over (also run daily by the job registry).
const runDue = h(async (req) => {
  const done = await require('../../services/dataRights').runDueDeletions()
  for (const d of done) await audit(req, 'learner.erase', { targetType: 'data_request', targetId: String(d.id), meta: d.counts })
  return { erased: done.length, done }
})

module.exports = { inbox, thread, updateThread, addNote, reply, listRequests, getRequest, updateRequest, exportBundle, runDeletion, runDue, footprint }
