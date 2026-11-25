// /api/social — learning together, for the learner (controllers/socialController.js).
const express = require('express')
const router = express.Router()
const { dashboardAuth } = require('../middleware/authMiddleware')
const { rateLimit } = require('../middleware/rateLimit')
const c = require('../controllers/socialController')

router.use(dashboardAuth)

// Guessing friend codes must be hopeless: a few tries a minute per learner.
const codeLimiter = rateLimit({ windowMs: 60_000, max: 8, key: (req) => `friend:${req.user?.email || req.ip}`, message: 'Too many tries. Wait a minute and check the code with your friend.' })

router.get('/home', c.home)
router.get('/summary', c.summary)
router.get('/options', c.options)
router.get('/me', c.getMe)
router.patch('/me', c.patchMe)

router.get('/friends', c.listFriends)
router.post('/friends', codeLimiter, c.askFriend)
router.post('/friends/:id/accept', c.acceptFriend)
router.delete('/friends/:id', c.removeFriend)
router.post('/report', c.report)

router.get('/matches', c.listMatches)
router.post('/matches', c.createMatch)
router.post('/matches/mystery', c.mysteryMatch)
router.get('/matches/:id', c.getMatch)
router.get('/matches/:id/play', c.playMatch)
router.post('/matches/:id/result', c.submitMatch)

router.post('/cheers', c.sendCheer)
router.post('/cheers/seen', c.seenCheers)
router.get('/teams', c.myTeams)
router.get('/trophies', c.myTrophies)
router.post('/trophies/seen', c.seenTrophies)
router.get('/jar', c.myJar)

module.exports = router
