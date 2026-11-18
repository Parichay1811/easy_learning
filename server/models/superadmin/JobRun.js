const mongoose = require('mongoose')
const superAdminDb = require('../../db/superAdminDb')

// One run of a registered background job (services/jobs.js, SUP-041).
const schema = new mongoose.Schema({
  job: { type: String, required: true, index: true },
  status: { type: String, enum: ['running', 'done', 'failed'], default: 'running' },
  trigger: { type: String, default: 'schedule' }, // schedule | manual
  by: { type: String, default: '' },
  progress: { type: Number, default: 0 },
  message: { type: String, default: '' },
  error: { type: String, default: '' },
  result: { type: mongoose.Schema.Types.Mixed },
  startedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date, default: null },
}, { versionKey: false })
schema.index({ startedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 })

module.exports = superAdminDb.models.JobRun || superAdminDb.model('JobRun', schema)
