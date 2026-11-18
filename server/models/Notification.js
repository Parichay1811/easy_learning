const mongoose = require('mongoose')

// A bell notification for one account (FND-050). `to` is "<role>:<id>", e.g. "parent:64f..".
const schema = new mongoose.Schema({
  to: { type: String, required: true, index: true },
  kind: { type: String, required: true },       // test_assigned, result_released, at_risk, message, announcement ...
  title: { type: String, required: true },
  body: { type: String, default: '' },
  link: { type: String, default: '' },
  readAt: { type: Date, default: null },
  email: { type: String, default: '' },          // '' | 'digest' (waits for the daily email) | 'sent' (utils/notify.js)
}, { timestamps: true })
schema.index({ to: 1, createdAt: -1 })
schema.index({ email: 1, to: 1 }, { partialFilterExpression: { email: 'digest' } })
schema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 })

module.exports = mongoose.model('Notification', schema)
