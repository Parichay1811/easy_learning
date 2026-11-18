// The learner's tests (TCH-033), mounted at /api/student (server.js).
// Students sign in with a JWT (Authorization) or the signed session cookie.
const express = require('express')
const router = express.Router()
const { anyAuth, requireRole } = require('../utils/actors')
const s = require('../controllers/studentTestController')

router.use(anyAuth, requireRole('student'))

router.get('/tests', s.todo)
router.get('/tests/:testId', s.intro)
router.post('/tests/:testId/start', s.start)
router.get('/attempts/:attemptId', s.getAttempt)
router.post('/attempts/:attemptId/open', s.openItem)
router.put('/attempts/:attemptId/items/:itemId', s.saveAnswer)
router.post('/attempts/:attemptId/events', s.logEvent)
router.post('/attempts/:attemptId/submit', s.submit)

module.exports = router
