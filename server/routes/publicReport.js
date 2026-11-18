// Public, read-only report links (PAR-072). No sign-in: the unguessable token is
// the permission, and it only ever opens that one report while it is live.
const express = require('express')
const router = express.Router()
const { createLimiter } = require('../utils/guardianLink')
const { publicReport } = require('../controllers/parentInsightsController')

const limiter = createLimiter({ max: 60, windowMs: 10 * 60 * 1000 })
router.use((req, res, next) => (limiter.take(req.ip || 'ip') ? next() : res.status(429).json({ success: false, message: 'Too many requests' })))
router.get('/report/:token', publicReport)

module.exports = router
