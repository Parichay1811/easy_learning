const Notification = require('../models/Notification')

const addr = (role, id) => `${role}:${id}`

// notify({ role:'parent', id }, { kind, title, body, link }) or an array of recipients. Never throws.
async function notify(to, { kind, title, body = '', link = '' }) {
  try {
    const list = (Array.isArray(to) ? to : [to]).filter((t) => t && t.id)
    if (!list.length) return 0
    await Notification.insertMany(list.map((t) => ({ to: addr(t.role, t.id), kind, title, body, link })))
    return list.length
  } catch (err) {
    console.error('notify failed:', err.message)
    return 0
  }
}

module.exports = { notify, addr }
