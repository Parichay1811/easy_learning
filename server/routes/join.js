// Public: what a join code / tutor page shows, and joining a group (signed in).
const express = require('express')
const router = express.Router()
const { anyAuth } = require('../utils/actors')
const j = require('../controllers/joinController')

router.get('/tutor/:slug', j.rateLimit, j.tutorPage)
router.get('/:code', j.rateLimit, j.lookup)
router.post('/:code', j.rateLimit, anyAuth, j.join)

module.exports = router
