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

module.exports = router
