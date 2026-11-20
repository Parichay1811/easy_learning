const express = require('express')
const router = express.Router()
const { dashboardAuth } = require('../middleware/authMiddleware')
const superadminAuth = require('../middleware/superadminAuth')

// Re-seeding or wiping the built-in bank is for the platform owner only.
const ownerOnly = [superadminAuth, superadminAuth.requireStaffRole()]
const {
  getAllQuestions,
  getQuestionById,
  seedQuestions,
  deleteAllQuestions
} = require('../controllers/writeScienceController')

router.post('/seed', ownerOnly, seedQuestions)
router.get('/', dashboardAuth, getAllQuestions)
router.get('/:id', dashboardAuth, getQuestionById)
router.delete('/all', ownerOnly, deleteAllQuestions)

module.exports = router
