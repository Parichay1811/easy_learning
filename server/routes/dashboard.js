const express = require('express')
const router  = express.Router()
const { dashboardAuth } = require('../middleware/authMiddleware')
const {
  logSession,
  getStats,
  getActivity,
  getAchievements,
  getPerformance,
  getModuleStars,
  logAnswer,
  getAnswers,
  logRound,
  getRounds,
} = require('../controllers/dashboardController')
const { createLinkCode } = require('../controllers/linkController')

router.use(dashboardAuth)

router.post('/log-session',  logSession)
router.post('/link-code',    createLinkCode)
router.get('/stats',         getStats)
router.get('/activity',      getActivity)
router.get('/achievements',  getAchievements)
router.get('/performance',   getPerformance)
router.get('/module-stars',  getModuleStars)
router.post('/log-answer',   logAnswer)
router.get('/answers',       getAnswers)
router.post('/log-round',    logRound)
router.get('/rounds',        getRounds)

// Family: goal, healthy use, cheers, AI Teacher usage (PAR-012/042/060/061, FND-045)
const learnerFamily = require('../controllers/learnerFamilyController')
router.get('/family',               learnerFamily.getFamily)
router.post('/cheers/:id/seen',     learnerFamily.markCheerSeen)
router.get('/cheers/:id/voice',     learnerFamily.cheerVoice)
router.post('/ai-teacher-log',      learnerFamily.aiTeacherLog)

// Connect by email: requests to and from grown-ups, teachers and schools (services/linkRequests.js)
const links = require('../controllers/linkRequestController').student
router.get('/links',                 links.list)
router.post('/links',                links.create)
router.get('/links/people',          links.people)
router.post('/links/people/unlink',  links.unlink)
router.post('/links/:id/accept',     links.accept)
router.post('/links/:id/decline',    links.decline)
router.post('/links/:id/cancel',     links.cancel)

module.exports = router
