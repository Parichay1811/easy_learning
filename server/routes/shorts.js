// /api/shorts — the Shorts feed, for the learner (controllers/shortsController.js).
const express = require('express')
const router = express.Router()
const { dashboardAuth } = require('../middleware/authMiddleware')
const c = require('../controllers/shortsController')

router.use(dashboardAuth)
router.get('/feed', c.getFeed)
router.post('/events', c.postEvent)
router.put('/picks', c.putPicks)
router.get('/liked', c.getLiked)

module.exports = router
