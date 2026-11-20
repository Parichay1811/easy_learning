const express = require('express')
const router = express.Router()
const { dashboardAuth } = require('../middleware/authMiddleware')
const superadminAuth = require('../middleware/superadminAuth')

// Re-seeding or wiping the built-in bank is for the platform owner only.
const ownerOnly = [superadminAuth, superadminAuth.requireStaffRole()]
const {
  getAllItems,
  getItemById,
  seedItems,
  deleteAllItems
} = require('../controllers/writeEnglishController')

router.post('/seed', ownerOnly, seedItems)
router.get('/', dashboardAuth, getAllItems)
router.get('/:id', dashboardAuth, getItemById)
router.delete('/all', ownerOnly, deleteAllItems)

module.exports = router
