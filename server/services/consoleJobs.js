// The super admin console's own background jobs, registered with
// services/jobs.js (SUP-041). Loaded once by routes/superadmin.js.
const path = require('path')
const { execFile } = require('child_process')
const jobs = require('./jobs')
const { notify } = require('../utils/notify')

const staffWith = async (...roles) => {
  const Staff = require('../models/superadmin/Staff')
  return (await Staff.find({ status: 'active', role: { $in: ['owner', ...roles] } }).select('_id').lean()).map((s) => ({ role: 'superadmin', id: String(s._id) }))
}

// Keeps the heavy platform numbers warm so the console opens fast.
jobs.register('analytics.warm', {
  description: 'Pre-computes platform growth, learning, revenue and the organisation directory (cached 5 min).',
  everyMs: 4 * 60_000,
  run: async ({ progress }) => {
    const pa = require('./platformAnalytics')
    const { clear } = require('../utils/ttlCache')
    clear('platform:'); clear('directory:')
    progress(10, 'directory'); await require('./orgDirectory').rows()
    progress(35, 'growth'); await pa.growth({ days: 30 })
    progress(65, 'learning'); await pa.learning({ days: 30 })
    progress(85, 'revenue'); await pa.revenue()
    await pa.live()
    return { warmed: ['directory', 'growth', 'learning', 'revenue', 'live'] }
  },
})

// Samples CPU/steal/latency every minute and tells engineers about new alerts (once an hour per alert).
const lastAlert = new Map()
jobs.register('health.sample', {
  description: 'Samples CPU (with steal), memory and API latency every minute and alerts engineers.',
  everyMs: 60_000,
  firstDelayMs: 5_000,
  run: async () => {
    const health = require('./systemHealth')
    health.sample()
    const snap = await health.snapshot()
    const fresh = snap.alerts.filter((a) => a.level === 'alert' && Date.now() - (lastAlert.get(a.key) || 0) > 3600_000)
    if (fresh.length) {
      for (const a of fresh) lastAlert.set(a.key, Date.now())
      await notify(await staffWith('engineer'), { kind: 'alert', title: 'Platform alert', body: fresh.map((a) => a.text).join(' · '), link: '/superadmin-dashboard?section=health' })
    }
    return { alerts: snap.alerts.length, notified: fresh.length }
  },
})

// Daily: organisation health scores; support hears about a drop of 15+ points.
jobs.register('orgHealth.snapshot', {
  description: 'Stores each organisation\'s health score and alerts support when one drops by 15 points or more.',
  everyMs: 24 * 3600_000,
  run: async () => {
    const GlobalSettings = require('../models/superadmin/GlobalSettings')
    const rows = await require('./orgDirectory').rows()
    const prev = (await GlobalSettings.findOne({ key: 'ops.orgHealth.last' }).lean())?.value || {}
    const now = Object.fromEntries(rows.filter((r) => r.health != null).map((r) => [r.id, r.health]))
    const drops = rows.filter((r) => r.health != null && prev[r.id] != null && prev[r.id] - r.health >= 15)
    await GlobalSettings.findOneAndUpdate({ key: 'ops.orgHealth.last' }, { key: 'ops.orgHealth.last', value: now, description: 'Last organisation health scores (SUP-023)' }, { upsert: true })
    if (drops.length) await notify(await staffWith('support'), { kind: 'alert', title: `${drops.length} organisation(s) need attention`, body: drops.slice(0, 5).map((d) => `${d.name}: ${prev[d.id]} → ${d.health}`).join(' · '), link: '/superadmin-dashboard?section=orgs' })
    return { scored: Object.keys(now).length, drops: drops.length }
  },
})

// Daily: data-rights requests close to or past their due date.
jobs.register('dataRights.due', {
  description: 'Reminds support of data-rights requests due within 5 days or overdue.',
  everyMs: 24 * 3600_000,
  run: async () => {
    const DataRequest = require('../models/DataRequest')
    const soon = await DataRequest.countDocuments({ status: { $in: ['pending', 'processing'] }, dueAt: { $lt: new Date(Date.now() + 5 * 86400_000) } })
    if (soon) await notify(await staffWith('support'), { kind: 'privacy', title: `${soon} data request(s) due soon or overdue`, body: 'GDPR requests must be completed within 30 days.', link: '/superadmin-dashboard?section=privacy' })
    return { dueSoon: soon }
  },
})

// Manual: build LearnerDay rollups from old history, in a separate low-priority process (FND-080).
jobs.register('rollups.backfill', {
  description: 'Builds learning rollups from older history (scripts/backfill-learner-days.js --apply) in a child process.',
  run: ({ progress }) => new Promise((resolve, reject) => {
    progress(5, 'started')
    const script = path.join(__dirname, '..', 'scripts', 'backfill-learner-days.js')
    const child = execFile(process.execPath, [script, '--apply'], { cwd: path.join(__dirname, '..'), timeout: 30 * 60_000, maxBuffer: 5_000_000 }, (err, out) => {
      if (err) return reject(new Error(String(err.message).slice(0, 500)))
      resolve({ output: String(out).slice(-1500) })
    })
    try { require('os').setPriority(child.pid, 15) } catch { /* not allowed: fine */ }
  }),
})

// Hourly when SMTP is set: send queued Outbox mail (oldest 50).
jobs.register('outbox.send', {
  description: 'Sends queued emails from the Outbox when SMTP is configured.',
  everyMs: 3600_000,
  run: async () => {
    if (!(process.env.SMTP_URL || process.env.SMTP_HOST)) return { skipped: 'SMTP not configured' }
    const Outbox = require('../models/Outbox')
    const { sendMail } = require('../utils/mailer')
    const queued = await Outbox.find({ status: 'queued' }).sort({ createdAt: 1 }).limit(50).lean()
    let sent = 0
    for (const m of queued) {
      const r = await sendMail({ to: m.to, subject: m.subject, html: m.html, text: m.text, kind: m.kind })
      if (r.status === 'sent') { sent++; await Outbox.deleteOne({ _id: m._id }) }
    }
    return { queued: queued.length, sent }
  },
})

module.exports = jobs
