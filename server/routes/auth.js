const express = require('express')
const router = express.Router()
const { setSession, getSession, clearSession, register, login } = require('../controllers/authController')

// Firebase / Google OAuth session cookie routes
router.post('/session', setSession)
router.get('/session', getSession)
router.delete('/session', clearSession)

// Manual JWT auth routes
router.post('/register', register)
router.post('/login', login)

// Managed learners (no email): login code + picture password (FND-011)
const { managedLogin, managedPictures } = require('../controllers/managedLoginController')
router.post('/managed-login', managedLogin)
router.get('/managed-pictures', managedPictures)

// Stay signed in until sign-out: a still-valid token is swapped for a fresh one (any role
// but Learnigo staff), after checking the account is still active.
const { renewSession } = require('../controllers/sessionRenewController')
const { rateLimit } = require('../middleware/rateLimit')
router.post('/renew', rateLimit({ windowMs: 60_000, max: 30 }), renewSession)

module.exports = router
