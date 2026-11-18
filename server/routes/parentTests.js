// A parent's view of a verified child's tests, mounted at /api/parent (server.js).
const express = require('express')
const router = express.Router()
const parentAuth = require('../middleware/parentAuth')
const { childTests } = require('../controllers/parentTestController')

router.get('/children/:id/tests', parentAuth, childTests)

module.exports = router
