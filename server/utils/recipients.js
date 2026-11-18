// Turn "<role>:<id>" addresses into contact details, server-side only. Emails
// found here are used to send mail and are never returned to other users.
const mongoose = require('mongoose')

const isId = (id) => mongoose.isValidObjectId(id)

async function lookup(role, ids) {
  const list = [...new Set(ids.map(String))]
  if (!list.length) return []
  if (role === 'superadmin') return list.map((id) => ({ id, email: id.includes('@') ? id : '', name: 'Super Admin' }))
  const valid = list.filter(isId)
  if (!valid.length) return []
  const model = {
    parent: () => require('../models/ParentAccount'),
    teacher: () => require('../models/admin/Tutor'),
    admin: () => require('../models/admin/OrgAdmin'),
  }[role]
  if (!model) return []
  const docs = await model().find({ _id: { $in: valid } }).select('email name').lean()
  return docs.map((d) => ({ id: String(d._id), email: d.email || '', name: d.name || '' }))
}

// [{role, id}] -> Map "<role>:<id>" -> { email, name }
async function contactsFor(recipients) {
  const byRole = {}
  for (const r of recipients) (byRole[r.role] ||= []).push(r.id)
  const out = new Map()
  for (const [role, ids] of Object.entries(byRole)) {
    for (const d of await lookup(role, ids)) out.set(`${role}:${d.id}`, { email: d.email, name: d.name })
  }
  return out
}

module.exports = { contactsFor }
