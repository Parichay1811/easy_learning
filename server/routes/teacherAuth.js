const express = require('express')
const router = express.Router()
const { googleSignIn, getMe, listWorkspaces, switchWorkspace, soloSignup } = require('../controllers/teacherAuthController')
const teacherAuth = require('../middleware/teacherAuth')

router.post('/google', googleSignIn)
router.post('/solo', soloSignup)
router.get('/me', teacherAuth, getMe)
router.get('/workspaces', teacherAuth, listWorkspaces)
router.post('/switch', teacherAuth, switchWorkspace)

module.exports = router
