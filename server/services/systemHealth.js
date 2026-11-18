// System health for the console (SUP-040 / FND-081): API latency and errors
// (utils/requestMetrics), CPU including steal time, memory, uptime, database
// sizes, the AI assistant's own /health, PM2 processes and alerts. Everything
// degrades gracefully: on macOS there is no /proc/stat, so steal is null.
const os = require('os')
const fs = require('fs')
const http = require('http')
const { execFile } = require('child_process')
const mongoose = require('mongoose')
const requestMetrics = require('../utils/requestMetrics')

// ── CPU from /proc/stat (Linux), sampled: busy %, steal %, iowait % ────────────
function readProcStat() {
  try {
    const line = fs.readFileSync('/proc/stat', 'utf8').split('\n').find((l) => l.startsWith('cpu '))
    if (!line) return null
    const [user, nice, system, idle, iowait = 0, irq = 0, softirq = 0, steal = 0] = line.trim().split(/\s+/).slice(1).map(Number)
    return { user, nice, system, idle, iowait, irq, softirq, steal, total: user + nice + system + idle + iowait + irq + softirq + steal }
  } catch { return null }
}
function readOsCpus() {
  const t = { user: 0, nice: 0, system: 0, idle: 0, irq: 0 }
  for (const c of os.cpus()) for (const k of Object.keys(t)) t[k] += c.times[k] || 0
  return { ...t, iowait: 0, softirq: 0, steal: null, total: t.user + t.nice + t.system + t.idle + t.irq }
}
const readCpu = () => readProcStat() || readOsCpus()

let last = { at: 0, sample: null }
let lastCpu = null
const history = [] // [{ at, cpu, steal, rssMb, p95, errorRate }] one per sample, 2 h

function sampleCpu() {
  const now = readCpu()
  const prev = last.sample
  last = { at: Date.now(), sample: now }
  if (!prev) return lastCpu
  const dt = now.total - prev.total
  if (dt <= 0) return lastCpu
  const idle = now.idle - prev.idle + (now.iowait - prev.iowait)
  lastCpu = {
    busyPct: Math.round(((dt - idle) / dt) * 1000) / 10,
    stealPct: now.steal == null || prev.steal == null ? null : Math.round(((now.steal - prev.steal) / dt) * 1000) / 10,
    iowaitPct: Math.round(((now.iowait - prev.iowait) / dt) * 1000) / 10,
    source: fs.existsSync('/proc/stat') ? '/proc/stat' : 'os.cpus()',
  }
  return lastCpu
}

function sample() {
  const cpu = sampleCpu()
  const m = requestMetrics.summary({ windowMs: 5 * 60_000 })
  history.push({ at: new Date().toISOString(), cpu: cpu?.busyPct ?? null, steal: cpu?.stealPct ?? null, rssMb: Math.round(process.memoryUsage().rss / 1048576), p95: m.p95, errorRate: m.errorRate })
  while (history.length > 120) history.shift()
}

// ── databases ──────────────────────────────────────────────────────────────
async function dbInfo(name, conn) {
  try {
    if (!conn || conn.readyState !== 1) return { name, state: 'disconnected' }
    const db = conn.db
    const [stats, cols] = await Promise.all([db.stats(), db.listCollections({}, { nameOnly: true }).toArray()])
    const counts = await Promise.all(cols.map(async (c) => ({ name: c.name, count: await db.collection(c.name).estimatedDocumentCount() })))
    counts.sort((a, b) => b.count - a.count)
    return { name, state: 'connected', dataMb: Math.round((stats.dataSize / 1048576) * 10) / 10, storageMb: Math.round(((stats.storageSize || 0) + (stats.indexSize || 0)) / 1048576 * 10) / 10, collections: counts.length, top: counts.slice(0, 8) }
  } catch (err) {
    return { name, state: 'error', error: err.message }
  }
}

// ── AI assistant: its own /health through the API's proxy ──────────────────
function aiHealth({ timeoutMs = 2500 } = {}) {
  const port = process.env.PORT || 5000
  const t0 = Date.now()
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port, path: '/api/ai-assistant/health', timeout: timeoutMs }, (res) => {
      let body = ''
      res.on('data', (d) => { body += d; if (body.length > 200_000) req.destroy() })
      res.on('end', () => {
        let json = null
        try { json = JSON.parse(body) } catch { /* not json */ }
        const ms = Date.now() - t0
        if (res.statusCode !== 200 || !json) return resolve({ ok: false, status: res.statusCode, latencyMs: ms, message: json?.error || 'Not available' })
        resolve({ ok: !!json.ready, status: 200, latencyMs: ms, voice: json.voice, hearing: json.hearing, llm: json.llm, model: json.model, kb: json.kb, packCount: json.packCount, tts: json.tts })
      })
    })
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0, latencyMs: Date.now() - t0, message: 'Timed out' }) })
    req.on('error', (e) => resolve({ ok: false, status: 0, latencyMs: Date.now() - t0, message: e.code || e.message }))
  })
}

// ── PM2 (if installed): processes and restart counts ─────────────────────────
function pm2() {
  return new Promise((resolve) => {
    execFile('pm2', ['jlist'], { timeout: 2000, maxBuffer: 2_000_000 }, (err, out) => {
      if (err) return resolve(null)
      try {
        resolve(JSON.parse(out).map((p) => ({ name: p.name, status: p.pm2_env?.status, restarts: p.pm2_env?.restart_time, uptimeMs: p.pm2_env?.pm_uptime ? Date.now() - p.pm2_env.pm_uptime : null, cpu: p.monit?.cpu, memMb: p.monit?.memory ? Math.round(p.monit.memory / 1048576) : null })))
      } catch { resolve(null) }
    })
  })
}

// Thresholds for alerts (an incident should show here within one sample).
const LIMITS = { stealPct: 20, cpuPct: 90, p95Ms: 2000, errorRatePct: 5, memPct: 90 }
function alerts({ cpu, api, mem, ai, dbs }) {
  const out = []
  if (cpu?.stealPct != null && cpu.stealPct >= LIMITS.stealPct) out.push({ level: 'alert', key: 'cpu.steal', text: `CPU steal is ${cpu.stealPct} % (host is starving this machine)` })
  if (cpu?.busyPct != null && cpu.busyPct >= LIMITS.cpuPct) out.push({ level: 'alert', key: 'cpu.busy', text: `CPU is ${cpu.busyPct} % busy` })
  if (api.p95 != null && api.p95 >= LIMITS.p95Ms) out.push({ level: 'attention', key: 'api.p95', text: `API p95 is ${api.p95} ms` })
  if (api.errorRate != null && api.requests >= 20 && api.errorRate >= LIMITS.errorRatePct) out.push({ level: 'alert', key: 'api.errors', text: `${api.errorRate} % of API requests failed` })
  if (mem.usedPct >= LIMITS.memPct) out.push({ level: 'attention', key: 'mem', text: `Memory is ${mem.usedPct} % used` })
  if (ai && !ai.ok && process.env.AI_ASSISTANT !== 'off') out.push({ level: 'attention', key: 'ai', text: `AI Teacher is not ready (${ai.message || ai.status})` })
  for (const d of dbs) if (d.state !== 'connected') out.push({ level: 'alert', key: `db.${d.name}`, text: `Database ${d.name} is ${d.state}` })
  return out
}

async function snapshot() {
  const cpu = sampleCpu() || lastCpu
  const mu = process.memoryUsage()
  const mem = {
    totalMb: Math.round(os.totalmem() / 1048576), freeMb: Math.round(os.freemem() / 1048576),
    usedPct: Math.round((1 - os.freemem() / os.totalmem()) * 1000) / 10,
    rssMb: Math.round(mu.rss / 1048576), heapUsedMb: Math.round(mu.heapUsed / 1048576), heapTotalMb: Math.round(mu.heapTotal / 1048576),
  }
  const api = requestMetrics.summary({ windowMs: 5 * 60_000 })
  const api15 = requestMetrics.summary({ windowMs: 15 * 60_000 })
  const [main, admin, superadmin, ai, procs, lastBackup] = await Promise.all([
    dbInfo('main', mongoose.connection),
    dbInfo('admin', require('../db/adminDb')),
    dbInfo('superadmin', require('../db/superAdminDb')),
    process.env.AI_ASSISTANT === 'off' ? Promise.resolve({ ok: false, status: 0, message: 'Turned off (AI_ASSISTANT=off)', disabled: true }) : aiHealth(),
    pm2(),
    require('../models/superadmin/GlobalSettings').findOne({ key: 'ops.lastBackup' }).lean().catch(() => null),
  ])
  const dbs = [main, admin, superadmin]
  return {
    at: new Date().toISOString(),
    host: { platform: process.platform, cpus: os.cpus().length, loadavg: os.loadavg().map((x) => Math.round(x * 100) / 100), uptimeSec: Math.round(os.uptime()) },
    process: { pid: process.pid, node: process.version, uptimeSec: Math.round(process.uptime()) },
    cpu, mem, api, api15, dbs, ai, pm2: procs,
    lastBackup: lastBackup?.value || null,
    history,
    alerts: alerts({ cpu, api, mem, ai, dbs }),
    limits: LIMITS,
  }
}

module.exports = { snapshot, sample, sampleCpu, aiHealth, alerts, LIMITS, readProcStat }
