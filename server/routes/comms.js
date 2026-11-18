// Shared communication, reporting and notification routes (FND-050..073).
// Mounted at /api by server.js. Every route is authenticated (anyAuth) except
// the signed unsubscribe link and /v1 (API key).
const express = require('express')
const router = express.Router()
const { anyAuth, requireRole } = require('../utils/actors')
const { requireModule } = require('../utils/entitlements')
const { rateLimit } = require('../utils/rateLimit')
const prefs = require('../controllers/notificationPrefsController')
const msg = require('../controllers/messagingController')
const ann = require('../controllers/announcementController')
const reports = require('../controllers/reportController')
const keys = require('../controllers/apiKeyController')
const consent = require('../controllers/consentController')

const staffAndParents = requireRole('parent', 'teacher', 'admin')
const perActor = (req) => `${req.actor.role}:${req.actor.id}`

// ── Notification preferences (FND-050) ────────────────────────────────────────
router.get('/notification-prefs', anyAuth, prefs.get)
router.put('/notification-prefs', anyAuth, rateLimit({ max: 30, windowMs: 60_000, key: perActor }), prefs.put)
router.get('/notification-prefs/unsubscribe', rateLimit({ max: 30, windowMs: 60_000, key: (req) => req.ip }), prefs.unsubscribe)
router.post('/notification-prefs/unsubscribe', express.urlencoded({ extended: false }), rateLimit({ max: 30, windowMs: 60_000, key: (req) => req.ip }), prefs.unsubscribe)

// ── Messaging (FND-051) ───────────────────────────────────────────────────────
const sendLimit = rateLimit({ max: 20, windowMs: 60_000, key: perActor, message: 'You are sending messages very fast. Please wait a minute.' })
const startLimit = rateLimit({ max: 10, windowMs: 60 * 60_000, key: perActor, message: 'You have started many conversations in the last hour. Please try again later.' })
router.get('/messages/contacts', anyAuth, staffAndParents, msg.contacts)
router.get('/messages/threads', anyAuth, staffAndParents, msg.listThreads)
router.post('/messages/threads', anyAuth, staffAndParents, startLimit, msg.maybeUpload, msg.startThread)
router.get('/messages/unread-count', anyAuth, msg.unreadCount)
router.get('/messages/threads/:id/messages', anyAuth, staffAndParents, msg.getMessages)
router.post('/messages/threads/:id/messages', anyAuth, staffAndParents, sendLimit, msg.maybeUpload, msg.reply)
router.post('/messages/threads/:id/read', anyAuth, staffAndParents, msg.markRead)
router.post('/messages/threads/:id/mute', anyAuth, staffAndParents, msg.setMuted)
router.get('/messages/attachments/:messageId/:index', anyAuth, msg.attachment)
router.post('/messages/:messageId/flag', anyAuth, staffAndParents, rateLimit({ max: 20, windowMs: 24 * 60 * 60_000, key: perActor }), msg.flag)
router.get('/messages/flags', anyAuth, requireRole('admin', 'superadmin'), msg.listFlags)
router.post('/messages/flags/:id', anyAuth, requireRole('admin', 'superadmin'), msg.reviewFlag)
router.get('/admin/messaging/metrics', anyAuth, requireRole('admin'), msg.metrics)

// ── Announcements (FND-052) ───────────────────────────────────────────────────
router.get('/announcements', anyAuth, ann.feed)
router.get('/announcements/sent', anyAuth, ann.sent)
router.get('/announcements/audiences', anyAuth, ann.audiences)
router.post('/announcements', anyAuth, requireRole('superadmin', 'admin', 'teacher'), rateLimit({ max: 10, windowMs: 60 * 60_000, key: perActor, message: 'You have sent many announcements in the last hour. Please try again later.' }), ann.compose)
router.post('/announcements/:id/read', anyAuth, ann.markRead)
router.get('/announcements/:id/report', anyAuth, ann.report)
router.delete('/announcements/:id', anyAuth, ann.cancel)

// ── Reports and exports (FND-060, FND-062) ───────────────────────────────────
router.get('/reports/parent/children/:id', anyAuth, reports.report('parent/child'))
router.get('/reports/teacher/batches/:id', anyAuth, reports.report('teacher/batch'))
router.get('/reports/teacher/batches/:id/learners.export', anyAuth, reports.exportLearners('teacher/batch'))
router.get('/reports/teacher/students/:id', anyAuth, reports.report('teacher/student'))
router.get('/reports/teacher/all', anyAuth, reports.report('teacher/all'))
router.get('/reports/admin/org', anyAuth, reports.report('admin/org'))
router.get('/reports/admin/org/learners.export', anyAuth, reports.exportLearners('admin/org'))
router.get('/reports/admin/batches/:id', anyAuth, reports.report('admin/batch'))
router.get('/reports/admin/batches/:id/learners.export', anyAuth, reports.exportLearners('admin/batch'))
router.get('/reports/admin/students/:id', anyAuth, reports.report('admin/student'))
router.get('/reports/superadmin/organizations/:id', anyAuth, reports.report('superadmin/org'))
router.get('/reports/superadmin/organizations/:id/learners.export', anyAuth, reports.exportLearners('superadmin/org'))

// ── API keys and the read-only data API (FND-062, `api.export`) ──────────────
router.get('/admin/api-keys', anyAuth, requireRole('admin'), requireModule('api.export'), keys.list)
router.post('/admin/api-keys', anyAuth, requireRole('admin'), requireModule('api.export'), rateLimit({ max: 10, windowMs: 60 * 60_000, key: perActor }), keys.create)
router.delete('/admin/api-keys/:id', anyAuth, requireRole('admin'), keys.revoke)
router.get('/v1/learners', keys.keyAuth('learners:read'), keys.v1Learners)
router.get('/v1/daily-summaries', keys.keyAuth('summaries:read'), keys.v1DailySummaries)

// ── Consent records (FND-070) ─────────────────────────────────────────────────
router.get('/consents', anyAuth, requireRole('parent', 'admin', 'superadmin'), consent.history)
router.post('/consents', anyAuth, requireRole('parent', 'admin'), rateLimit({ max: 30, windowMs: 60 * 60_000, key: perActor }), consent.record)

// ── Background jobs (super admin) ─────────────────────────────────────────────
router.get('/jobs', anyAuth, requireRole('superadmin'), async (req, res) => {
  try { res.json({ success: true, jobs: await require('../services/scheduler').status() }) }
  catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Internal server error' }) }
})
router.post('/jobs/:name/run', anyAuth, requireRole('superadmin'), async (req, res) => {
  try {
    // A chosen clock only in tests or when explicitly allowed (to preview a Sunday digest).
    const clockOk = process.env.NODE_ENV === 'test' || process.env.ALLOW_JOB_CLOCK === 'on'
    const now = clockOk && req.body?.now && !Number.isNaN(Date.parse(req.body.now)) ? new Date(req.body.now) : new Date()
    const { audit } = require('../utils/audit')
    await audit(req, 'job.run', { targetType: 'job', targetId: req.params.name })
    res.json({ success: true, result: await require('../services/scheduler').runJob(req.params.name, { now }) })
  } catch (e) { res.status(e.status || 500).json({ success: false, message: e.status ? e.message : 'Internal server error' }) }
})

module.exports = router
