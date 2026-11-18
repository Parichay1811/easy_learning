// Routes every signed-in role can use: who am I allowed to be, what is in my plan,
// my notifications, and the metrics dictionary.
const express = require('express')
const router = express.Router()
const { anyAuth } = require('../utils/actors')
const { entitlementsFor } = require('../utils/entitlements')
const { MODULES, PLANS } = require('../config/plans')
const n = require('../controllers/notificationController')
const { metricsDictionary } = require('../controllers/analyticsController')

router.get('/meta/metrics', metricsDictionary)
// Public: what each plan includes, for the pricing page. No prices here: those belong to billing.
router.get('/plans', (req, res) => res.json({
  success: true,
  plans: Object.entries(PLANS).map(([id, p]) => ({ id, label: p.label, for: p.for, limits: p.limits || {}, modules: p.modules.map((key) => ({ key, label: MODULES[key] })) })),
}))
router.get('/me', anyAuth, async (req, res) => {
  try {
    const ent = await entitlementsFor(req.actor)
    res.json({ success: true, actor: req.actor, entitlements: ent, modules: MODULES })
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Internal server error' }) }
})
router.get('/entitlements', anyAuth, async (req, res) => {
  try { res.json({ success: true, ...(await entitlementsFor(req.actor)) }) }
  catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Internal server error' }) }
})
router.get('/notifications', anyAuth, n.list)
router.get('/notifications/unread-count', anyAuth, n.unreadCount)
router.post('/notifications/read-all', anyAuth, n.markAllRead)
router.post('/notifications/:id/read', anyAuth, n.markRead)

module.exports = router
