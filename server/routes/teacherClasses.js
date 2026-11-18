// Teacher "classes and performance" routes (TCH-010..013, TCH-050..056, TCH-080..082).
// Mounted inside routes/teacher.js, after teacherAuth. Every handler resolves the teacher's
// workspace first (services/teacherContext.js) and only touches groups they teach there.
const express = require('express')
const router = express.Router()
const { teacherActor } = require('../services/teacherContext')
const { uploadOrgLogo, handleUpload } = require('../middleware/upload')
const g = require('../controllers/teacherGroupsController')
const i = require('../controllers/teacherInsightsController')
const w = require('../controllers/teacherWorkspaceController')

router.use(teacherActor)

// Workspace, plan, branding, public page
router.get('/workspace', w.getWorkspace)
router.patch('/workspace', w.updateWorkspace)
router.post('/workspace/logo', w.requireBranding, handleUpload(uploadOrgLogo.single('logo')), w.uploadLogo)

// "Today" and my teaching summary
router.get('/today', i.today)
router.get('/summary', i.summary)

// Groups (declare fixed paths before /groups/:id)
router.get('/groups', g.listGroups)
router.post('/groups', g.createGroup)
router.get('/groups/compare', i.compareGroups)
router.post('/groups/suggested', i.createSuggestedGroup)
router.get('/groups/:id', g.getGroup)
router.patch('/groups/:id', g.updateGroup)
router.post('/groups/:id/archive', g.archiveGroup)
router.post('/groups/:id/restore', g.restoreGroup)
router.get('/groups/:id/join', g.getJoin)
router.post('/groups/:id/join', g.updateJoin)
router.post('/groups/:id/roster', g.importRoster)
router.post('/groups/:id/students/transfer', g.transferStudents)
router.get('/groups/:id/parents', g.groupParents)
router.post('/groups/:id/parents/invite', g.inviteParents)
router.get('/groups/:id/heatmap', i.heatmap)
router.get('/groups/:id/suggestions', i.suggestions)

// Student profile and private notes
router.get('/students/:id/profile', i.studentProfile)
router.get('/students/:id/notes', i.listNotes)
router.post('/students/:id/notes', i.addNote)
router.patch('/students/:id/notes/:noteId', i.updateNote)
router.delete('/students/:id/notes/:noteId', i.deleteNote)

module.exports = router
