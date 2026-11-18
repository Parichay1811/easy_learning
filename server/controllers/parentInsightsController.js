// Parent: deeper views, the report and its share links, and the privacy centre
// (PAR-031..036, PAR-040/041, PAR-062, PAR-071/072, PAR-080..082, PAR-090, FND-071).
// Every child route sits behind requireOwnChild (a VERIFIED link of this parent).
const crypto = require('crypto')
const q = require('../analytics/queries')
const ins = require('../services/parentInsights')
const rights = require('../services/dataRights')
const ReportShare = require('../models/ReportShare')
const DataRequest = require('../models/DataRequest')
const Child = require('../models/Child')
const ParentAccount = require('../models/ParentAccount')
const LearningEvent = require('../models/analytics/LearningEvent')
const { audit } = require('../utils/audit')
const { safeTz } = require('./parentFamilyController')

const ok = (res, body = {}, status = 200) => res.status(status).json({ success: true, ...body })
const bad = (res, status, message, extra = {}) => res.status(status).json({ success: false, message, ...extra })
const handle = (fn) => async (req, res) => {
  try { await fn(req, res) } catch (err) {
    if (err.status) return bad(res, err.status, err.message)
    console.error('parentInsights error:', err)
    bad(res, 500, 'Internal server error')
  }
}
const tzOf = (req) => safeTz(req.get('x-timezone') || req.query.tz || 'UTC')
const rangeOf = (req, cmp = 'prev') => q.parseRange({ from: req.query.from, to: req.query.to, cmp: req.query.cmp || cmp, tz: tzOf(req) })

// ── Deeper views ─────────────────────────────────────────────────────────────
const sources = handle(async (req, res) => ok(res, await ins.bySource(req.child.email, rangeOf(req, 'none'))))
const trends = handle(async (req, res) => ok(res, await ins.trends(req.child.email, rangeOf(req))))
const skills = handle(async (req, res) => ok(res, await ins.skills(req.child.email, rangeOf(req, 'none'))))
const aiTeacher = handle(async (req, res) => ok(res, await ins.aiTeacher(req.child.email, rangeOf(req, 'none'))))
const screenTime = handle(async (req, res) => ok(res, await ins.screenTime(req.child.email, rangeOf(req, 'none'))))
const ar = handle(async (req, res) => ok(res, await ins.arSummary(req.child.email, rangeOf(req, 'none'))))
const milestones = handle(async (req, res) => ok(res, { milestones: await ins.milestones(req.child.email) }))

const year = handle(async (req, res) => {
  const tz = tzOf(req)
  const y = Number(req.query.year) || Number(q.todayIn(tz).slice(0, 4))
  if (y < 2020 || y > 2100) return bad(res, 400, 'Unknown year')
  ok(res, { child: { name: req.child.name, avatar: req.child.avatar }, ...(await ins.yearInReview(req.child.email, y, tz)) })
})

// GET /children/:id/answers?filter=wrong|hint|slow|all&limit&before
const answers = handle(async (req, res) => {
  const filter = ['wrong', 'hint', 'slow', 'all'].includes(req.query.filter) ? req.query.filter : 'all'
  ok(res, await ins.answers(req.child.email, { filter, limit: req.query.limit, before: req.query.before }))
})

// GET /children/:id/activity.csv?from&to : the usage log as CSV (audited export).
const csvCell = (v) => {
  const s = v == null ? '' : String(v)
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s // no formula injection in spreadsheets
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}
const activityCsv = handle(async (req, res) => {
  const range = rangeOf(req, 'none')
  const rows = await LearningEvent.find({ email: req.child.email, ts: { $gte: new Date(`${range.from}T00:00:00Z`), $lte: new Date(`${range.to}T23:59:59Z`) } }).sort({ ts: -1 }).limit(5000).lean()
  const head = ['time', 'kind', 'module', 'subject', 'topic', 'result', 'minutes', 'stars', 'mode', 'device']
  const lines = [head.join(',')].concat(rows.map((e) => [
    e.ts.toISOString(), e.kind, e.module, e.subject, e.title || e.topic, e.correct == null ? '' : e.correct ? 'correct' : 'not yet', e.minutes, e.stars, e.mode || e.source, e.device,
  ].map(csvCell).join(',')))
  await audit(req, 'learner.export_activity', { targetType: 'learner', targetId: String(req.child._id), meta: { from: range.from, to: range.to, rows: rows.length } })
  res.set('Content-Type', 'text/csv; charset=utf-8')
  res.set('Content-Disposition', `attachment; filename="learnigo-activity-${range.from}-to-${range.to}.csv"`)
  res.send(lines.join('\n'))
})

// ── Report (PAR-071) and share links (PAR-072) ───────────────────────────────
const report = handle(async (req, res) => {
  const tz = tzOf(req)
  const data = await ins.buildReport({ email: req.child.email, name: req.child.name, from: req.query.from, to: req.query.to, tz })
  await audit(req, 'learner.report_view', { targetType: 'learner', targetId: String(req.child._id), meta: { from: data.range.from, to: data.range.to } })
  ok(res, { report: { ...data, child: { name: req.child.name, avatar: req.child.avatar, grade: req.child.grade } } })
})

const SHARE_DAYS = 7
const hashShare = (t) => crypto.createHash('sha256').update(`report|${t}`).digest('hex')
const shareView = (s) => ({ id: String(s._id), from: s.from, to: s.to, label: s.label, expiresAt: s.expiresAt, revokedAt: s.revokedAt, views: s.views, lastViewedAt: s.lastViewedAt, createdAt: s.createdAt, active: !s.revokedAt && s.expiresAt > new Date() })

// POST /children/:id/report-shares { from, to, label }
const createShare = handle(async (req, res) => {
  const range = q.parseRange({ from: req.body?.from, to: req.body?.to, cmp: 'none', tz: tzOf(req) })
  const active = await ReportShare.countDocuments({ parentId: req.parent.id, revokedAt: null, expiresAt: { $gt: new Date() } })
  if (active >= 20) return bad(res, 429, 'You have many active links. Revoke some before making a new one.')
  const token = crypto.randomBytes(24).toString('base64url')
  const share = await ReportShare.create({
    tokenHash: hashShare(token), childId: req.child._id, parentId: req.parent.id, learnerEmail: req.child.email, childName: req.child.name,
    from: range.from, to: range.to, tz: tzOf(req), label: String(req.body?.label || '').trim().slice(0, 60), expiresAt: new Date(Date.now() + SHARE_DAYS * 86400000),
  })
  await audit(req, 'report.share_create', { targetType: 'report_share', targetId: String(share._id), meta: { childId: String(req.child._id), from: range.from, to: range.to } })
  ok(res, { share: shareView(share), token, path: `/shared-report/${token}` }, 201)
})

const listShares = handle(async (req, res) => {
  const list = await ReportShare.find({ parentId: req.parent.id, childId: req.child._id }).sort({ createdAt: -1 }).limit(30)
  ok(res, { shares: list.map(shareView) })
})

const revokeShare = handle(async (req, res) => {
  if (!/^[a-f0-9]{24}$/i.test(req.params.shareId)) return bad(res, 404, 'Link not found')
  const s = await ReportShare.findOne({ _id: req.params.shareId, parentId: req.parent.id, childId: req.child._id })
  if (!s) return bad(res, 404, 'Link not found')
  if (!s.revokedAt) { s.revokedAt = new Date(); await s.save() }
  await audit(req, 'report.share_revoke', { targetType: 'report_share', targetId: String(s._id) })
  ok(res, { share: shareView(s) })
})

// GET /api/public/report/:token : anyone with the link, read-only, only that report.
const publicReport = async (req, res) => {
  try {
    const token = String(req.params.token || '')
    const gone = () => bad(res, 404, 'This link has expired or was turned off. Ask the parent for a new one.')
    if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return gone()
    const s = await ReportShare.findOne({ tokenHash: hashShare(token) })
    if (!s || s.revokedAt || s.expiresAt <= new Date()) return gone()
    // The link stops working the moment the parent loses access to the child.
    const link = await Child.findOne({ _id: s.childId, parentId: s.parentId, linkStatus: 'verified' })
    if (!link) return gone()
    const data = await ins.buildReport({ email: s.learnerEmail, name: link.name, from: s.from, to: s.to, tz: s.tz })
    s.views += 1; s.lastViewedAt = new Date(); await s.save()
    req.actor = { role: 'public_link', id: String(s._id), email: '', name: '' }
    await audit(req, 'report.share_view', { targetType: 'report_share', targetId: String(s._id) })
    res.set('Cache-Control', 'no-store')
    res.set('X-Robots-Tag', 'noindex')
    ok(res, { report: { ...data, child: { name: link.name.split(' ')[0], avatar: link.avatar } }, expiresAt: s.expiresAt, shared: true })
  } catch (err) {
    console.error('publicReport error:', err)
    bad(res, 500, 'Internal server error')
  }
}

// ── Privacy centre (PAR-090, FND-070, FND-071) ───────────────────────────────

// GET /children/:id/privacy
const privacy = handle(async (req, res) => {
  const email = req.child.email
  const Student = require('../models/admin/Student')
  const Organization = require('../models/admin/Organization')
  const Batch = require('../models/admin/Batch')
  const Tutor = require('../models/admin/Tutor')
  const rows = await Child.find({ email, linkStatus: 'verified' }).sort({ verifiedAt: 1 })
  const parents = await ParentAccount.find({ _id: { $in: rows.map((r) => r.parentId) } }).select('name email')
  const pmap = Object.fromEntries(parents.map((p) => [String(p._id), p]))
  const schoolRows = await Student.find({ email, status: 'active' }).lean()
  const orgs = await Organization.find({ _id: { $in: schoolRows.map((s) => s.orgId) } }).select('name kind').lean()
  const batchIds = schoolRows.flatMap((s) => s.batchIds || [])
  const batches = await Batch.find({ _id: { $in: batchIds } }).select('name tutorIds directTutorIds orgId').lean()
  const tutorIds = batches.flatMap((b) => [...(b.tutorIds || []), ...(b.directTutorIds || [])])
  const tutors = await Tutor.find({ _id: { $in: tutorIds } }).select('name subject').lean()
  const tmap = Object.fromEntries(tutors.map((t) => [String(t._id), t]))
  const exp = { counts: await rights.countLearner(email) }
  const requests = await DataRequest.find({ subjectEmail: email }).sort({ createdAt: -1 }).limit(10).lean()
  ok(res, {
    stored: [
      { key: 'profile', label: 'Profile', detail: 'First name, age, grade and avatar', count: 1 },
      { key: 'learning', label: 'Learning activity', detail: 'Questions answered, right or not, time taken, module and subject', count: (exp.counts.answers || 0) + (exp.counts.learningEvents || 0) },
      { key: 'daily', label: 'Daily summaries', detail: 'Minutes, accuracy and devices per day (kept for the charts)', count: exp.counts.learnerDays || 0 },
      { key: 'rounds', label: 'Rounds, stars and badges', detail: 'Results of each round and the badges earned', count: (exp.counts.rounds || 0) + (exp.counts.achievements || 0) },
      { key: 'games', label: 'Movement games', detail: 'Game results such as reaction time and accuracy (no video is ever stored)', count: exp.counts.arSessions || 0 },
      { key: 'family', label: 'Family messages', detail: 'Cheers and voice notes from guardians', count: exp.counts.cheers || 0 },
    ],
    notStored: ['Camera images or video', 'What your child types or says to the AI Teacher (only the lesson topic)', 'Advertising or tracking data'],
    whoCanSee: [
      ...rows.map((r) => ({ kind: 'guardian', name: pmap[String(r.parentId)]?.name || 'Guardian', you: String(r.parentId) === String(req.parent.id), since: r.verifiedAt || r.createdAt, how: r.verifiedBy })),
      ...schoolRows.map((s) => ({ kind: 'school', name: orgs.find((o) => String(o._id) === String(s.orgId))?.name || 'School', since: s.createdAt, how: 'school_roster' })),
      ...batches.flatMap((b) => [...new Set([...(b.tutorIds || []), ...(b.directTutorIds || [])].map(String))].map((tid) => ({ kind: 'teacher', name: tmap[tid]?.name || 'Teacher', subject: tmap[tid]?.subject || '', group: b.name }))),
    ],
    consentHistory: rows.flatMap((r) => (r.consentHistory || []).map((c) => ({ ...c.toObject?.() || c, guardian: pmap[String(r.parentId)]?.name || '' })))
      .concat(req.child.verifiedAt && !(req.child.consentHistory || []).length ? [{ at: req.child.verifiedAt, action: 'link_verified', version: req.child.consentVersion, by: req.parent.email, guardian: req.parent.name || '' }] : [])
      .sort((a, b) => new Date(b.at) - new Date(a.at)),
    requests: requests.map((r) => ({ id: String(r._id), kind: r.kind, status: r.status, createdAt: r.createdAt, dueAt: r.dueAt, resolvedAt: r.resolvedAt, note: r.note })),
    youArePrimary: req.child.guardianRole !== 'co',
    managed: Boolean(req.child.managedLearnerId),
    schoolLinked: schoolRows.length > 0,
    graceDays: rights.GRACE_DAYS,
  })
})

// GET /children/:id/export : everything, as a JSON download (audited).
const exportData = handle(async (req, res) => {
  const data = await rights.exportLearner(req.child.email)
  await DataRequest.create({ subjectEmail: req.child.email, subjectName: req.child.name, requestedByRole: 'parent', requestedById: String(req.parent.id), kind: 'export', status: 'done', resolvedAt: new Date(), resolvedBy: 'automatic', result: data.counts })
  await audit(req, 'learner.export', { targetType: 'learner', targetId: String(req.child._id), meta: data.counts })
  const safe = req.child.name.replace(/[^A-Za-z0-9]+/g, '-').toLowerCase() || 'child'
  res.set('Content-Type', 'application/json; charset=utf-8')
  res.set('Content-Disposition', `attachment; filename="learnigo-${safe}-data-${new Date().toISOString().slice(0, 10)}.json"`)
  res.send(JSON.stringify({ ...data, child: { name: req.child.name, age: req.child.age } }, null, 2))
})

// POST /children/:id/delete-request { reason }
const requestDelete = handle(async (req, res) => {
  if (req.child.guardianRole === 'co') return bad(res, 403, 'Only the main guardian can ask to delete the account.')
  if (String(req.body?.confirm || '').trim().toLowerCase() !== req.child.name.trim().toLowerCase()) return bad(res, 400, "Type your child's name to confirm.")
  const Student = require('../models/admin/Student')
  const school = await Student.findOne({ email: req.child.email, status: 'active' }).select('orgId')
  const { request, existing } = await rights.requestDeletion({
    email: req.child.email, name: req.child.name, byRole: 'parent', byId: req.parent.id, orgId: school ? String(school.orgId) : null,
    note: [String(req.body?.reason || '').trim().slice(0, 300), school ? 'Linked to a school: the school will be asked to confirm.' : ''].filter(Boolean).join(' · '),
  })
  if (!existing) await audit(req, 'learner.delete_request', { targetType: 'learner', targetId: String(req.child._id), orgId: school ? String(school.orgId) : '', meta: { requestId: String(request._id) } })
  ok(res, { request: { id: String(request._id), status: request.status, dueAt: request.dueAt }, existing }, existing ? 200 : 201)
})

// DELETE /children/:id/delete-request/:requestId : cancel during the grace period.
const cancelDelete = handle(async (req, res) => {
  if (!/^[a-f0-9]{24}$/i.test(req.params.requestId)) return bad(res, 404, 'Request not found')
  const r = await DataRequest.findOne({ _id: req.params.requestId, subjectEmail: req.child.email, kind: 'delete' })
  if (!r) return bad(res, 404, 'Request not found')
  const done = await rights.cancelDeletion(r._id, req.parent.id)
  if (!done) return bad(res, 409, 'This request can no longer be cancelled here. Please contact support.')
  await audit(req, 'learner.delete_cancel', { targetType: 'learner', targetId: String(req.child._id), meta: { requestId: String(r._id) } })
  ok(res)
})

module.exports = {
  sources, trends, skills, aiTeacher, screenTime, ar, milestones, year, answers, activityCsv,
  report, createShare, listShares, revokeShare, publicReport, privacy, exportData, requestDelete, cancelDelete,
}
