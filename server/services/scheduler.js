// A tiny interval scheduler for background jobs (FND-061). Started from
// server.js with one line; `SCHEDULER=off` disables it (it is also off under
// NODE_ENV=test unless SCHEDULER=on, so tests trigger jobs explicitly).
//
//  - Jittered ticks, so several servers (or restarts) don't fire together.
//  - A lease per job in JobRun, so two processes never run the same job at once.
//  - Jobs are idempotent per period themselves (services/digests.js claims every
//    recipient before sending), so a restart never double-sends.
//  - Work is light: batches of 20 with yields; nothing runs on page loads.
const JobRun = require('../models/comms/JobRun')

const MIN = 60 * 1000
const JOBS = {
  announcements: { everyMs: MIN, lease: 5 * MIN, run: (o) => require('./announcements').deliverDue(o), label: 'Send scheduled announcements' },
  notification_daily: { everyMs: 15 * MIN, lease: 30 * MIN, run: (o) => require('./digests').notificationDaily(o), label: 'Daily email of digest notifications' },
  parent_weekly: { everyMs: 15 * MIN, lease: 60 * MIN, run: (o) => require('./digests').parentWeekly(o), label: 'Weekly parent email (Sunday evening)' },
  teacher_weekly: { everyMs: 15 * MIN, lease: 60 * MIN, run: (o) => require('./digests').teacherWeekly(o), label: 'Weekly teacher summary (Monday morning)' },
  admin_monthly: { everyMs: 30 * MIN, lease: 60 * MIN, run: (o) => require('./digests').adminMonthly(o), label: 'Monthly school summary' },
}

const state = { timer: null, running: new Set(), last: {}, started: false }
const jitter = (ms) => Math.floor(Math.random() * ms)

// Take the job's lease. false when another process holds it.
async function lock(job, leaseMs, now = new Date()) {
  try {
    const r = await JobRun.findOneAndUpdate(
      { kind: 'lock', job, period: '', recipient: '', $or: [{ leaseUntil: null }, { leaseUntil: { $lt: now } }] },
      { $set: { leaseUntil: new Date(now.getTime() + leaseMs), status: 'running' } },
      { upsert: true, new: true },
    )
    return Boolean(r)
  } catch (e) {
    if (e.code === 11000) return false
    throw e
  }
}
const unlock = (job) => JobRun.updateOne({ kind: 'lock', job, period: '', recipient: '' }, { $set: { leaseUntil: null, status: 'idle' } })

// Run one job now. `now` lets tests (and a super admin "run now") pick the clock.
async function runJob(name, { now = new Date() } = {}) {
  const job = JOBS[name]
  if (!job) throw Object.assign(new Error('Unknown job'), { status: 404 })
  if (state.running.has(name)) return { skipped: 'already running' }
  state.running.add(name)
  const startedAt = new Date()
  try {
    if (!(await lock(name, job.lease))) return { skipped: 'locked by another process' }
    try {
      const stats = await job.run({ now })
      await JobRun.create({ kind: 'run', job: name, status: 'ok', stats: { ...stats, ms: Date.now() - startedAt } })
      return stats
    } catch (e) {
      await JobRun.create({ kind: 'run', job: name, status: 'error', error: String(e.message).slice(0, 300) })
      throw e
    } finally {
      await unlock(name)
    }
  } finally {
    state.running.delete(name)
    state.last[name] = Date.now()
  }
}

async function tick() {
  for (const [name, job] of Object.entries(JOBS)) {
    if (Date.now() - (state.last[name] || 0) < job.everyMs) continue
    await runJob(name).catch((e) => console.error(`job ${name} failed:`, e.message))
  }
}

function schedule() {
  state.timer = setTimeout(async () => {
    try { await tick() } finally { if (state.started) schedule() }
  }, 30 * 1000 + jitter(15 * 1000))
  state.timer.unref?.()
}

function startScheduler() {
  const env = process.env.SCHEDULER
  if (env === 'off' || (process.env.NODE_ENV === 'test' && env !== 'on') || state.started) return false
  state.started = true
  // Stagger the first run of each job so a restart doesn't do everything at once.
  for (const name of Object.keys(JOBS)) state.last[name] = Date.now() - JOBS[name].everyMs + 60 * 1000 + jitter(60 * 1000)
  schedule()
  console.log('Scheduler started')
  return true
}

function stopScheduler() { state.started = false; clearTimeout(state.timer) }

// For the super admin's health view.
async function status() {
  const runs = await JobRun.aggregate([
    { $match: { kind: 'run' } }, { $sort: { createdAt: -1 } },
    { $group: { _id: '$job', at: { $first: '$createdAt' }, status: { $first: '$status' }, stats: { $first: '$stats' }, error: { $first: '$error' } } },
  ])
  const by = new Map(runs.map((r) => [r._id, r]))
  return Object.entries(JOBS).map(([name, j]) => ({ name, label: j.label, everyMinutes: j.everyMs / MIN, lastRun: by.get(name) || null, running: state.running.has(name) }))
}

module.exports = { startScheduler, stopScheduler, runJob, status, JOBS, lock }
