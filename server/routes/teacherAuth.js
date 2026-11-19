const express = require('express')
const router = express.Router()
const { googleSignIn, getMe, listWorkspaces, switchWorkspace, soloSignup } = require('../controllers/teacherAuthController')
const teacherAuth = require('../middleware/teacherAuth')

router.post('/google', googleSignIn)
router.post('/solo', soloSignup)
router.get('/me', teacherAuth, getMe)
router.get('/workspaces', teacherAuth, listWorkspaces)
router.post('/switch', teacherAuth, switchWorkspace)

// The /teach page, signed in with Google (no workspace needed): school invitations and
// "ask my school to add me" (controllers/linkRequestController.js `hub`).
const hub = require('../controllers/linkRequestController').hub
router.post('/invites', hub.list)
router.post('/invites/:id/accept', hub.accept)
router.post('/invites/:id/decline', hub.decline)
router.post('/join-school', hub.joinSchool)
router.post('/join-school/:id/cancel', hub.cancel)

module.exports = router
