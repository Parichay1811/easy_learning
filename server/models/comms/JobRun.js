const mongoose = require('mongoose')

// Scheduler bookkeeping (services/scheduler.js).
//  - kind 'lock': one per job, a lease so two processes never run a job at once.
//  - kind 'send': one per (job, period, recipient). Claimed BEFORE an email goes
//    out, so a restart or a second process can never send the same digest twice.
//  - kind 'run': one per job run, for the super admin's health view.
const schema = new mongoose.Schema({
  kind: { type: String, enum: ['lock', 'send', 'run'], required: true },
  job: { type: String, required: true },
  period: { type: String, default: '' },
  recipient: { type: String, default: '' },
  status: { type: String, default: '' },
  leaseUntil: { type: Date, default: null },
  stats: { type: mongoose.Schema.Types.Mixed, default: null },
  error: { type: String, default: '' },
}, { timestamps: true })

schema.index({ kind: 1, job: 1, period: 1, recipient: 1 }, { unique: true, partialFilterExpression: { kind: { $in: ['lock', 'send'] } } })
schema.index({ job: 1, createdAt: -1 })
schema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 400, partialFilterExpression: { kind: { $in: ['send', 'run'] } } })

module.exports = mongoose.model('JobRun', schema)
