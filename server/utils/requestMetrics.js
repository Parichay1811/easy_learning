// In-process API request metrics for the system health page (SUP-040 / FND-081).
// A fixed ring buffer of the last few thousand requests: duration, status and
// time. No dependency, O(1) per request, and p50/p95/error rate are computed
// only when the health page asks for them.
const SIZE = 5000
const durations = new Float64Array(SIZE)
const statuses = new Uint16Array(SIZE)
const times = new Float64Array(SIZE)
const routes = new Array(SIZE)
let next = 0
let count = 0
const startedAt = Date.now()
let total = 0
let totalErrors = 0

function record(ms, status, at = Date.now(), route = '') {
  durations[next] = ms
  statuses[next] = status
  times[next] = at
  routes[next] = route
  next = (next + 1) % SIZE
  if (count < SIZE) count++
  total++
  if (status >= 500) totalErrors++
}

// Express middleware. The AI assistant's long streaming answers are left out:
// they have their own health endpoint and would drown the API's own numbers.
function middleware(req, res, next) {
  if (!req.originalUrl.startsWith('/api/') || req.originalUrl.startsWith('/api/ai-assistant')) return next()
  const t0 = process.hrtime.bigint()
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - t0) / 1e6
    // Group by the first two path segments so the slow-route table stays readable.
    const route = `${req.method} ${req.originalUrl.split('?')[0].split('/').slice(0, 4).join('/')}`
    record(ms, res.statusCode, Date.now(), route)
  })
  next()
}

const quantile = (sorted, q) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : null)
const round = (n) => (n == null ? null : Math.round(n * 10) / 10)

// Summary of the requests in the last `windowMs`.
function summary({ windowMs = 5 * 60_000, now = Date.now() } = {}) {
  const ds = []
  let errors = 0
  const byRoute = new Map()
  for (let i = 0; i < count; i++) {
    if (now - times[i] > windowMs) continue
    ds.push(durations[i])
    if (statuses[i] >= 500) errors++
    const r = byRoute.get(routes[i]) || { route: routes[i], n: 0, ms: 0, max: 0 }
    r.n++; r.ms += durations[i]; r.max = Math.max(r.max, durations[i])
    byRoute.set(routes[i], r)
  }
  ds.sort((a, b) => a - b)
  const slowest = [...byRoute.values()].map((r) => ({ route: r.route, count: r.n, avgMs: round(r.ms / r.n), maxMs: round(r.max) }))
    .sort((a, b) => b.avgMs - a.avgMs).slice(0, 8)
  return {
    windowMinutes: Math.round(windowMs / 60_000),
    requests: ds.length,
    perMinute: round(ds.length / (windowMs / 60_000)),
    p50: round(quantile(ds, 0.5)),
    p95: round(quantile(ds, 0.95)),
    p99: round(quantile(ds, 0.99)),
    errorRate: ds.length ? round((errors / ds.length) * 100) : null,
    errors,
    slowest,
    sinceStart: { requests: total, errors: totalErrors, since: new Date(startedAt).toISOString() },
  }
}

const reset = () => { next = 0; count = 0; total = 0; totalErrors = 0 }

module.exports = { middleware, record, summary, reset }
