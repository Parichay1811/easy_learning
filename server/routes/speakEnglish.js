const express = require('express')
const router = express.Router()
const { dashboardAuth } = require('../middleware/authMiddleware')
const superadminAuth = require('../middleware/superadminAuth')

// Re-seeding or wiping the built-in bank is for the platform owner only.
const ownerOnly = [superadminAuth, superadminAuth.requireStaffRole()]
const {
  getAllPrompts,
  getPromptById,
  seedPrompts,
  deleteAllPrompts
} = require('../controllers/speakEnglishController')

router.post('/seed', ownerOnly, seedPrompts)
router.get('/', dashboardAuth, getAllPrompts)
router.get('/:id', dashboardAuth, getPromptById)
router.delete('/all', ownerOnly, deleteAllPrompts)

module.exports = router
