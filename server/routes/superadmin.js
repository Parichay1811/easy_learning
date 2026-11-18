const express = require('express')
const router = express.Router()
const analyticsMounts = require('./analyticsMounts')
const superadminAuth = require('../middleware/superadminAuth')
const { requireStaffRole: role } = superadminAuth
const validate = require('../middleware/validate')
const { superadminStudentAccess } = require('../middleware/studentDashboardAccess')
const {
  rejectOrgValidator, subscriptionValidator, settingValidator, respondContactValidator, sendChatMessageValidator,
} = require('../validators/superadminValidators')
const {
  getOrganizations, approveOrg, rejectOrg, updateSubscription,
  getOrgAdminDetail, getOrgStudents, getOrgTutors, getOrgStudentPerformance, getOrgTutorPerformance,
  getStats, getSettings, upsertSetting,
  getContactMessages, respondToContact,
} = require('../controllers/superadminController')
const {
  getStats:        getStudentDashStats,
  getActivity:     getStudentDashActivity,
  getAchievements: getStudentDashAchievements,
  getPerformance:  getStudentDashPerformance,
  getAnswers:      getStudentDashAnswers,
  getRounds:       getStudentDashRounds,
} = require('../controllers/dashboardController')
const {
  listConversations, getOrgThread, sendOrgMessage, getTotalUnreadCount,
  listParentConversations, getParentThread, sendParentMessage, getParentTotalUnreadCount,
} = require('../controllers/chatController')
const analytics = require('../controllers/analyticsController')
const { scoped } = require('../utils/scopes')
const staff = require('../controllers/superadmin/staffController')
const viewAs = require('../controllers/superadmin/viewAsController')
const auditLog = require('../controllers/superadmin/auditController')
const dir = require('../controllers/superadmin/directoryController')
const ops = require('../controllers/superadmin/opsController')
const billing = require('../controllers/superadmin/billingController')
const content = require('../controllers/superadmin/contentController')
const support = require('../controllers/superadmin/supportController')
const platform = require('../services/platformAnalytics')
const { h } = require('../controllers/superadmin/util')
require('../services/consoleJobs')

// Every console route needs a staff session. Roles (SUP-001): owner (all),
// support (orgs, people, chats, view-as, privacy), content (question banks,
// AI Teacher content), finance (plans, billing), engineer (health, flags,
// jobs, incidents), analyst (read-only analytics). Owners pass every gate.
router.use(superadminAuth)

const ANY = role('support', 'content', 'finance', 'engineer', 'analyst')
const ANALYTICS = role('analyst', 'support', 'finance', 'engineer', 'content')
const SUPPORT = role('support')

// ── Overview and live counters ─────────────────────────────────────────────────
router.get('/stats', ANY, getStats)
router.get('/live', ANY, h(async () => ({ live: await platform.live() })))

// ── Staff (owner) ───────────────────────────────────────────────────────────
router.get('/staff', role(), staff.list)
router.post('/staff', role(), staff.create)
router.patch('/staff/:id', role(), staff.update)
router.post('/staff/:id/unlock', role(), staff.unlock)
router.post('/staff/:id/reset-2fa', role(), staff.reset2fa)
router.post('/staff/:id/revoke-sessions', role(), staff.revokeAllFor)
router.delete('/staff/sessions/:sid', role(), staff.revokeSession)
router.post('/staff/break-glass/revoke', role(), staff.revokeBreakGlass)
router.put('/me/prefs', ANY, staff.savePrefs)

// ── Audit (SUP-003) ─────────────────────────────────────────────────────────
router.get('/audit', SUPPORT, auditLog.list)
router.get('/audit/export', role(), auditLog.exportCsv)
router.get('/audit/verify', SUPPORT, auditLog.verify)

// ── View as (SUP-002) ──────────────────────────────────────────────────────
router.get('/view-as', SUPPORT, viewAs.list)
router.post('/view-as', SUPPORT, viewAs.start)
router.post('/view-as/:id/end', SUPPORT, viewAs.end)

// ── Organisations (SUP-010/011/014) ─────────────────────────────────────────
router.get('/directory', role('support', 'finance', 'analyst'), dir.list)
router.get('/approvals', SUPPORT, dir.approvals)
router.put('/approvals/templates', SUPPORT, dir.saveTemplates)
router.get('/organizations', SUPPORT, getOrganizations)
router.put('/organizations/:id/approve', SUPPORT, approveOrg)
router.put('/organizations/:id/reject', SUPPORT, rejectOrgValidator, validate, rejectOrg)
router.put('/organizations/:id/subscription', role('support', 'finance'), subscriptionValidator, validate, updateSubscription)
router.get('/organizations/:id/detail', role('support', 'finance', 'analyst'), dir.detail)
router.put('/organizations/:id/overrides', role('engineer', 'support'), dir.setOverrides)
router.get('/organizations/:id/entitlements', role('engineer', 'support', 'finance'), dir.entitlementsPreview)
router.patch('/organizations/:id/profile', SUPPORT, dir.updateProfile)
router.post('/organizations/:id/suspend', SUPPORT, dir.suspend)
router.post('/organizations/:id/unsuspend', SUPPORT, dir.unsuspend)

router.get('/organizations/:id/admin', SUPPORT, getOrgAdminDetail)
router.get('/organizations/:id/students', SUPPORT, getOrgStudents)
router.get('/organizations/:id/students/:studentId/performance', SUPPORT, getOrgStudentPerformance)
router.get('/organizations/:id/students/:studentId/dashboard/stats',        SUPPORT, superadminStudentAccess, getStudentDashStats)
router.get('/organizations/:id/students/:studentId/dashboard/activity',     SUPPORT, superadminStudentAccess, getStudentDashActivity)
router.get('/organizations/:id/students/:studentId/dashboard/achievements', SUPPORT, superadminStudentAccess, getStudentDashAchievements)
router.get('/organizations/:id/students/:studentId/dashboard/performance',  SUPPORT, superadminStudentAccess, getStudentDashPerformance)
router.get('/organizations/:id/students/:studentId/dashboard/answers',      SUPPORT, superadminStudentAccess, getStudentDashAnswers)
router.get('/organizations/:id/students/:studentId/dashboard/rounds',       SUPPORT, superadminStudentAccess, getStudentDashRounds)
router.get('/organizations/:id/tutors', SUPPORT, getOrgTutors)
router.get('/organizations/:id/tutors/:tutorId/performance', SUPPORT, getOrgTutorPerformance)

// ── People and families (SUP-012/013) ─────────────────────────────────────────
router.get('/people', SUPPORT, dir.people)
router.get('/people/:role/:id', SUPPORT, dir.person)
router.post('/people/:role/:id/:action', SUPPORT, dir.personAction)
router.get('/families', SUPPORT, dir.families)
for (const name of ['overview', 'calendar', 'matrix', 'patterns', 'timeline']) {
  router.get(`/families/learners/:email/analytics/${name}`, SUPPORT, scoped(dir.forIndependentLearner), analytics[name])
}

// ── Platform analytics (SUP-020..023) ──────────────────────────────────────────
router.get('/platform/growth', ANALYTICS, h(async (req) => ({ growth: await platform.growth({ days: req.query.days }) })))
router.get('/platform/learning', ANALYTICS, h(async (req) => ({ learning: await platform.learning({ days: req.query.days }) })))
router.get('/platform/revenue', role('finance', 'analyst'), h(async () => ({ revenue: await platform.revenue() })))

// ── Operations (SUP-040..043) ───────────────────────────────────────────────
const ENG = role('engineer')
router.get('/ops/health', ENG, ops.getHealth)
router.put('/ops/backup', ENG, ops.setBackupNote)
router.get('/ops/jobs', ENG, ops.listJobs)
router.post('/ops/jobs/:name/run', ENG, ops.runJob)
router.get('/ops/jobs/runs/:id', ENG, ops.getRun)
router.get('/ops/flags', role('engineer', 'support', 'finance'), ops.listFlags)
router.get('/ops/flags/preview', role('engineer', 'support', 'finance'), ops.previewPlan)
router.put('/ops/flags/:key', ENG, ops.upsertFlag)
router.delete('/ops/flags/:key', ENG, ops.deleteFlag)
router.get('/ops/incidents', ENG, ops.listIncidents)
router.post('/ops/incidents', ENG, ops.createIncident)
router.patch('/ops/incidents/:id', ENG, ops.updateIncident)
router.get('/ops/outbox', role('engineer', 'support'), ops.listOutbox)
router.post('/ops/outbox/:id/retry', role('engineer', 'support'), ops.retryOutbox)

// ── Content (SUP-030/032) ───────────────────────────────────────────────────
const CONTENT = role('content')
router.get('/content/banks', CONTENT, content.banks)
router.get('/content/banks/:module/:subject', CONTENT, content.listQuestions)
router.get('/content/banks/:module/:subject/:id', CONTENT, content.getQuestion)
router.patch('/content/banks/:module/:subject/:id', CONTENT, content.updateQuestion)
router.get('/content/ai-teacher', CONTENT, content.aiOverview)
router.post('/content/ai-teacher/todos/done', CONTENT, content.aiTodoDone)

// ── Plans and billing (SUP-050/051) ───────────────────────────────────────────
const FIN = role('finance')
router.get('/billing/plans', role('finance', 'engineer', 'support', 'analyst'), billing.listPlans)
router.put('/billing/plans/:id', FIN, billing.savePlan)
router.get('/billing/plans/:id/history', FIN, billing.planHistory)
router.get('/billing/subscriptions', role('finance', 'support'), billing.listSubscriptions)
router.get('/billing/orgs/:id', role('finance', 'support'), billing.getOrgSubscription)
router.post('/billing/orgs/:id', FIN, billing.createOrgSubscription)
router.post('/billing/subscriptions/:id/:action', FIN, billing.action)

// ── Support inbox and data rights (SUP-060/061) ───────────────────────────────
router.get('/support/inbox', SUPPORT, support.inbox)
router.get('/support/threads/:kind/:ref', SUPPORT, support.thread)
router.patch('/support/threads/:kind/:ref', SUPPORT, support.updateThread)
router.post('/support/threads/:kind/:ref/notes', SUPPORT, support.addNote)
router.post('/support/threads/:kind/:ref/reply', SUPPORT, support.reply)
router.get('/data-requests', SUPPORT, support.listRequests)
router.get('/data-requests/:id', SUPPORT, support.getRequest)
router.patch('/data-requests/:id', SUPPORT, support.updateRequest)
router.get('/data-requests/:id/export', SUPPORT, support.exportBundle)
router.post('/data-requests/:id/run-deletion', SUPPORT, support.runDeletion)

// ── Chats, contact, settings (existing) ───────────────────────────────────────
router.get('/chat', SUPPORT, listConversations)
router.get('/chat/unread-count', SUPPORT, getTotalUnreadCount)
router.get('/chat/:id', SUPPORT, getOrgThread)
router.post('/chat/:id', SUPPORT, sendChatMessageValidator, validate, sendOrgMessage)

router.get('/parent-chat', SUPPORT, listParentConversations)
router.get('/parent-chat/unread-count', SUPPORT, getParentTotalUnreadCount)
router.get('/parent-chat/:id', SUPPORT, getParentThread)
router.post('/parent-chat/:id', SUPPORT, sendChatMessageValidator, validate, sendParentMessage)

router.get('/settings', role('engineer', 'support'), getSettings)
router.post('/settings', role(), settingValidator, validate, upsertSetting)
router.get('/settings/platform', ANY, ops.getPlatformSettings)
router.put('/settings/platform/:key', role(), ops.putPlatformSetting)

router.get('/contact', SUPPORT, getContactMessages)
router.put('/contact/:id', SUPPORT, respondContactValidator, validate, respondToContact)

// Org and student analytics (shared handlers): support and analysts.
router.use('/organizations/:id', role('support', 'analyst'))
analyticsMounts.mountSuperadmin(router)

module.exports = router
