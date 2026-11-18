// Parent family, insight, report and privacy routes. Mounted inside the parent
// router (after parentAuth) by routes/parent.js: `require('./parentFamily')(router)`.
const fam = require('../controllers/parentFamilyController')
const ins = require('../controllers/parentInsightsController')
const { requireOwnChild } = require('../services/parentFamily')
const { requireModule } = require('../utils/entitlements')

module.exports = function mountParentFamily(router) {
  const own = requireOwnChild()
  // The report, its share links and the Year in Learnigo are Family Plus (`analytics.deep`, README §4).
  const deep = requireModule('analytics.deep')

  // Children and guardians (PAR-001, PAR-003; FND-011, FND-012, FND-013)
  router.post('/children/managed', fam.createManagedChild)
  router.post('/children/:id/managed/reset', own, fam.resetManagedChild)
  router.post('/children/:id/revoke', fam.revokeOwnLink)
  router.get('/children/:id/guardians', own, fam.listGuardians)
  router.post('/children/:id/guardians/invite', own, fam.inviteGuardian)
  router.delete('/children/:id/guardians/invites/:inviteId', own, fam.cancelInvite)
  router.delete('/children/:id/guardians/:rowId', own, fam.removeGuardian)
  router.get('/guardian-invites', fam.myInvites)
  router.post('/guardian-invites/accept', fam.acceptInvite)

  // Settings, goal, cheers (PAR-004, PAR-012, PAR-042, PAR-060, PAR-061)
  router.patch('/children/:id/settings', own, fam.updateSettings)
  router.get('/children/:id/goal', own, fam.getGoal)
  router.post('/children/:id/cheers', own, fam.sendCheer)
  router.get('/children/:id/cheers', own, fam.listCheers)

  // Deeper views (PAR-031..036, PAR-040/041, PAR-080..082)
  router.get('/children/:id/analytics/sources', own, ins.sources)
  router.get('/children/:id/analytics/trends', own, ins.trends)
  router.get('/children/:id/analytics/skills', own, ins.skills)
  router.get('/children/:id/analytics/ai-teacher', own, ins.aiTeacher)
  router.get('/children/:id/analytics/screen-time', own, ins.screenTime)
  router.get('/children/:id/analytics/ar', own, ins.ar)
  router.get('/children/:id/analytics/milestones', own, ins.milestones)
  router.get('/children/:id/analytics/year', own, deep, ins.year)
  router.get('/children/:id/answers', own, ins.answers)
  router.get('/children/:id/activity.csv', own, ins.activityCsv)

  // Report and share links (PAR-071, PAR-072)
  router.get('/children/:id/report', own, deep, ins.report)
  router.get('/children/:id/report-shares', own, ins.listShares)
  router.post('/children/:id/report-shares', own, deep, ins.createShare)
  router.delete('/children/:id/report-shares/:shareId', own, ins.revokeShare)

  // Privacy centre (PAR-090, FND-071)
  router.get('/children/:id/privacy', own, ins.privacy)
  router.get('/children/:id/export', own, ins.exportData)
  router.post('/children/:id/delete-request', own, ins.requestDelete)
  router.delete('/children/:id/delete-request/:requestId', own, ins.cancelDelete)
}
