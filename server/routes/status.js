// Public platform status (SUP-043): GET /api/status, no sign-in. Feeds the
// site-wide banner and the public status page. Cached for 30 seconds.
const express = require('express')
const router = express.Router()
const { cached } = require('../utils/ttlCache')

const ACTIVE = ['scheduled', 'investigating', 'identified', 'monitoring']

const publicView = (i) => ({ id: String(i._id), title: i.title, kind: i.kind, severity: i.severity, status: i.status, message: i.message, startsAt: i.startsAt, endsAt: i.endsAt, resolvedAt: i.resolvedAt, updates: (i.updates || []).map((u) => ({ at: u.at, status: u.status, message: u.message })) })

router.get('/', async (req, res) => {
  try {
    const out = await cached('status:public', 30_000, async () => {
      const Incident = require('../models/superadmin/Incident')
      const now = new Date()
      const [active, recent] = await Promise.all([
        Incident.find({ status: { $in: ACTIVE } }).sort({ startsAt: -1 }).limit(10).lean(),
        Incident.find({ status: 'resolved' }).sort({ resolvedAt: -1 }).limit(10).lean(),
      ])
      // A scheduled maintenance shows its banner from 24 h before it starts until it ends.
      const showing = active.filter((i) => i.banner && (i.kind !== 'maintenance' || new Date(i.startsAt) - now < 24 * 3600_000) && (!i.endsAt || new Date(i.endsAt) > now))
      const rank = { critical: 3, major: 2, minor: 1 }
      const top = showing.sort((a, b) => (rank[b.severity] || 0) - (rank[a.severity] || 0))[0]
      const ongoingMaintenance = active.some((i) => i.kind === 'maintenance' && new Date(i.startsAt) <= now && (!i.endsAt || new Date(i.endsAt) > now))
      const status = active.some((i) => i.kind === 'incident' && i.severity !== 'minor') ? 'degraded' : ongoingMaintenance ? 'maintenance' : active.some((i) => i.kind === 'incident') ? 'minor' : 'operational'
      return {
        status,
        banner: top ? { id: String(top._id), kind: top.kind, severity: top.severity, title: top.title, message: top.message, startsAt: top.startsAt, endsAt: top.endsAt } : null,
        active: active.map(publicView),
        recent: recent.map(publicView),
        at: now.toISOString(),
      }
    })
    res.set('Cache-Control', 'public, max-age=30')
    res.json({ success: true, ...out })
  } catch (err) {
    console.error('status error:', err)
    res.json({ success: true, status: 'unknown', banner: null, active: [], recent: [] })
  }
})

module.exports = router
