// Teacher question bank and tests, mounted at /api/teacher (server.js).
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const express = require('express')
const router = express.Router()
const teacherAuth = require('../middleware/teacherAuth')
const { requireModule } = require('../utils/entitlements')
const { handleUpload, UPLOAD_ROOT } = require('../middleware/upload')
const b = require('../controllers/teacherBankController')
const t = require('../controllers/teacherTestController')

fs.mkdirSync(path.join(UPLOAD_ROOT, 'question-images'), { recursive: true })
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype) ? cb(null, true) : cb(new Error('Only JPEG, PNG, WEBP or GIF pictures'))),
})

// Only requests for these paths are handled here; everything else falls through.
const PREFIXES = ['/bank', '/tests', '/marking', '/accommodations', '/test-groups']
router.use((req, res, next) => (PREFIXES.some((p) => req.path === p || req.path.startsWith(`${p}/`)) ? next() : next('router')))
router.use(teacherAuth, (req, res, next) => {
  req.actor = { role: 'teacher', id: String(req.teacher.id), email: req.teacher.email, name: req.teacher.name, orgId: req.teacher.orgId ? String(req.teacher.orgId) : null }
  next()
})

const author = requireModule('qbank.author')
const tests = requireModule('tests')
const advanced = requireModule('tests.advanced')
const manual = requireModule('grading.manual')

// Question bank (TCH-020..027)
router.get('/bank/meta', author, b.meta)
router.get('/bank/questions', author, b.list)
router.post('/bank/questions', author, b.create)
router.get('/bank/export.csv', author, b.exportCsv)
router.post('/bank/import', author, b.importQuestions)
router.patch('/bank/bulk', author, b.bulkUpdate)
router.post('/bank/stats', author, b.statsMany)
router.post('/bank/images', author, handleUpload(uploadImage.single('image')), b.uploadImage)
router.get('/bank/shares', author, b.myShares)
router.get('/bank/collections', author, b.listCollections)
router.post('/bank/collections', author, b.createCollection)
router.get('/bank/collections/:id', author, b.getCollection)
router.patch('/bank/collections/:id', author, b.updateCollection)
router.delete('/bank/collections/:id', author, b.deleteCollection)
router.get('/bank/questions/:module/:subject/:id', author, b.getOne)
router.put('/bank/questions/:module/:subject/:id', author, b.update)
router.delete('/bank/questions/:module/:subject/:id', author, b.archive)
router.post('/bank/questions/:module/:subject/:id/duplicate', author, b.duplicate)
router.get('/bank/questions/:module/:subject/:id/revisions', author, b.revisions)
router.get('/bank/questions/:module/:subject/:id/stats', author, b.stats)
router.post('/bank/questions/:module/:subject/:id/share', author, requireModule('qbank.share'), b.share)

// Tests and practice sets (TCH-030..035, 052, 060, 061)
router.get('/test-groups', tests, t.groups)
router.get('/tests/presets', tests, t.presets)
router.get('/tests', tests, t.list)
router.post('/tests', tests, t.create)
router.get('/tests/:id', tests, t.getOne)
router.put('/tests/:id', tests, t.update)
router.delete('/tests/:id', tests, t.archive)
router.post('/tests/:id/duplicate', tests, t.duplicate)
router.get('/tests/:id/preview', tests, t.preview)
router.post('/tests/:id/publish', tests, t.publish)
router.post('/tests/:id/remind', tests, t.remind)
router.get('/tests/:id/monitor', tests, advanced, t.monitor)
router.get('/tests/:id/results', tests, t.results)
router.get('/tests/:id/results.csv', tests, t.resultsExport)
router.get('/tests/:id/attempts/:attemptId', tests, t.attemptDetail)
router.post('/tests/:id/attempts/:attemptId/items/:itemId/mark', tests, t.markItem)
router.post('/tests/:id/release', tests, t.release)
router.get('/tests/:id/practice-progress', tests, t.practiceProgress)
router.get('/tests/:id/practice-suggestions', tests, t.practiceSuggestions)
router.post('/tests/:id/practice-suggestions/approve', tests, t.approveSuggestions)

// Marking queue (TCH-041) and accommodations (TCH-034)
router.get('/marking', tests, manual, t.markingQueue)
router.get('/accommodations', tests, advanced, t.listAccommodations)
router.put('/accommodations/:studentId', tests, advanced, t.setAccommodations)

module.exports = router
