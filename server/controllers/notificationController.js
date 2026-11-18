const Notification = require('../models/Notification')
const { addr } = require('../utils/notify')

const mine = (req) => addr(req.actor.role, req.actor.id)

const list = async (req, res) => {
  try {
    const to = mine(req)
    const [items, unread] = await Promise.all([
      Notification.find({ to }).sort({ createdAt: -1 }).limit(Math.min(Number(req.query.limit) || 30, 100)).lean(),
      Notification.countDocuments({ to, readAt: null }),
    ])
    res.json({ success: true, unread, items })
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
