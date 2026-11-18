// A small in-memory rate limiter (FND-074). One API process, so memory is enough;
// no extra dependency. Counts requests per key in a sliding window and answers 429
// with Retry-After. Keys default to the client IP (set `trust proxy` so that is the
// real client behind nginx, not 127.0.0.1).
function rateLimit({ windowMs, max, key = (req) => req.ip, message = 'Too many requests. Please slow down and try again shortly.', now = Date.now } = {}) {
  const hits = new Map()
  const sweep = setInterval(() => {
    const t = now()
    for (const [k, list] of hits) { const live = list.filter((x) => t - x < windowMs); live.length ? hits.set(k, live) : hits.delete(k) }
  }, Math.max(windowMs, 60000))
  sweep.unref?.()

  const middleware = (req, res, next) => {
    const k = key(req)
    if (k == null) return next()
    const t = now()
    const list = (hits.get(k) || []).filter((x) => t - x < windowMs)
    if (list.length >= max) {
      hits.set(k, list)
      res.set('Retry-After', String(Math.max(1, Math.ceil((windowMs - (t - list[0])) / 1000))))
      return res.status(429).json({ success: false, message })
    }
    list.push(t)
    hits.set(k, list)
    next()
  }
  middleware.reset = (k) => hits.delete(k)
  return middleware
}

// Per client AND per account, so one attacker cannot lock out everyone, and one account
// cannot be hammered from many addresses without hitting its own limit as well.
const accountKey = (req) => `${req.ip}|${String(req.body?.email || '').toLowerCase().slice(0, 120)}`

module.exports = { rateLimit, accountKey }
