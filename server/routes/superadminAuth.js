const express = require('express')
const router = express.Router()
const superadminAuth = require('../middleware/superadminAuth')
const c = require('../controllers/superadminAuthController')

router.post('/login', c.login)
router.post('/2fa/verify', c.verify2fa)
router.post('/2fa/setup', c.setup2fa)
router.post('/2fa/enable', c.enable2fa)

router.get('/me', superadminAuth, c.me)
router.post('/logout', superadminAuth, c.logout)
router.post('/password', superadminAuth, c.changePassword)
router.post('/2fa/recovery-codes', superadminAuth, c.newRecoveryCodes)

module.exports = router
