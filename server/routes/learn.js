// /api/learn — the learner's adaptive learning (controllers/learnController.js).
const express = require('express')
const router = express.Router()
const { dashboardAuth } = require('../middleware/authMiddleware')
const c = require('../controllers/learnController')

router.use(dashboardAuth)

router.get('/profile', c.getProfile)
router.put('/profile', c.putProfile)
router.delete('/profile', c.deleteProfile)
router.post('/suggestions/:id', c.answerSuggestion)
router.get('/round', c.getRound)
router.get('/baseline', c.getBaseline)
router.post('/baseline', c.postBaseline)
router.get('/companion', c.getCompanion)

module.exports = router
