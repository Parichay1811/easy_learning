// A tiny registry for background jobs (SUP-041). Anyone can register a job:
//
//   const jobs = require('../services/jobs')
//   jobs.register('digests.weekly', {
//     description: 'Weekly parent digest emails',
//     everyMs: 24 * 3600_000,               // optional schedule (not in tests)
//     run: async ({ progress, log }) => { progress(50, 'half way'); return { sent: 12 } },
//   })
//
// Each run is stored as a JobRun (status, progress, message, error, result) so
// the console can list jobs, see their last runs and re-run them. A job never
// runs twice at once in this process. Heavy work should spawn a child process
// from inside `run` (FND-080); this registry only schedules and records.
const registry = new Map()
const running = new Set()
const timers = []
let started = false

function register(name, { description = '', everyMs = 0, run, firstDelayMs } = {}) {
  if (typeof run !== 'function') throw new Error(`job ${name}: run() is required`)
  registry.set(name, { name, description, everyMs, run, firstDelayMs })
  if (started && everyMs) schedule(registry.get(name))
}

const JobRun = () => require('../models/superadmin/JobRun')

async function runJob(name, { trigger = 'manual', by = '' } = {}) {
  const job = registry.get(name)
  if (!job) throw Object.assign(new Error('Unknown job'), { status: 404 })
  if (running.has(name)) throw Object.assign(new Error('This job is already running'), { status: 409 })
  running.add(name)
  const doc = await JobRun().create({ job: name, trigger, by })
  let lastWrite = 0
  const progress = (pct, message = '') => {
    doc.progress = Math.max(0, Math.min(100, Math.round(pct)))
    if (message) doc.message = String(message).slice(0, 300)
    if (Date.now() - lastWrite > 1000) { lastWrite = Date.now(); JobRun().updateOne({ _id: doc._id }, { progress: doc.progress, message: doc.message }).catch(() => {}) }
  }
  const log = (message) => progress(doc.progress, message)
  const finished = (async () => {
    try {
      const result = await job.run({ progress, log, by, trigger })
      await JobRun().updateOne({ _id: doc._id }, { status: 'done', progress: 100, result: result ?? null, finishedAt: new Date(), message: doc.message })
    } catch (err) {
      await JobRun().updateOne({ _id: doc._id }, { status: 'failed', error: String(err?.message || err).slice(0, 1000), finishedAt: new Date() }).catch(() => {})
    } finally {
      running.delete(name)
    }
  })()
  return { runId: String(doc._id), finished }
}

function schedule(job) {
  const tick = () => runJob(job.name, { trigger: 'schedule' }).catch(() => {})
  const first = setTimeout(() => { tick(); const t = setInterval(tick, job.everyMs); t.unref(); timers.push(t) }, job.firstDelayMs ?? Math.min(job.everyMs, 60_000))
  first.unref()
  timers.push(first)
}

// Called once when the server starts listening. Schedules are off in tests.
function startScheduler() {
  if (started || process.env.NODE_ENV === 'test' || process.env.JOBS === 'off' || process.env.SCHEDULER === 'off') return
  started = true
  for (const job of registry.values()) if (job.everyMs) schedule(job)
}

function stopScheduler() { for (const t of timers) { clearTimeout(t); clearInterval(t) } timers.length = 0; started = false }

const list = () => [...registry.values()].map((j) => ({ name: j.name, description: j.description, everyMs: j.everyMs, running: running.has(j.name) }))
const has = (name) => registry.has(name)

module.exports = { register, runJob, startScheduler, stopScheduler, list, has }
