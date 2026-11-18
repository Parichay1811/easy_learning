const Notification = require('../models/Notification')
const { addr } = require('../utils/notify')

const mine = (req) => addr(req.actor.role, req.actor.id)

const list = async (req, res) => {
  try {
    const to = mine(req)
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100)
    const q = { to }
    if (req.query.before && !Number.isNaN(Date.parse(req.query.before))) q.createdAt = { $lt: new Date(req.query.before) }   // next page
    if (req.query.unread === '1') q.readAt = null
    const [rows, unread] = await Promise.all([
      Notification.find(q).sort({ createdAt: -1 }).limit(limit + 1).select('-email').lean(),
      Notification.countDocuments({ to, readAt: null }),
    ])
    const items = rows.slice(0, limit)
    res.json({ success: true, unread, items, nextBefore: rows.length > limit ? items[items.length - 1].createdAt : null })
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Internal server error' }) }
}

const unreadCount = async (req, res) => {
  try { res.json({ success: true, count: await Notification.countDocuments({ to: mine(req), readAt: null }) }) }
  catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Internal server error' }) }
}

const markRead = async (req, res) => {
  try {
    await Notification.updateOne({ _id: req.params.id, to: mine(req), readAt: null }, { readAt: new Date() })
    res.json({ success: true })
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Internal server error' }) }
}

const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ to: mine(req), readAt: null }, { readAt: new Date() })
    res.json({ success: true })
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Internal server error' }) }
}

module.exports = { list, unreadCount, markRead, markAllRead }
