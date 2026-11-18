// Express rate limits for shared routes (messages, announcements, API keys).
// In memory: we run one API process, so a Map is enough (same as link codes).
const { createLimiter } = require('./guardianLink')

const all = []

// rateLimit({ max: 30, windowMs: 60_000, key: (req) => req.actor.id })
function rateLimit({ max, windowMs, key, message = 'Too many requests. Please wait a moment and try again.' }) {
  const limiter = createLimiter({ max, windowMs })
  all.push(limiter)
  const mw = (req, res, next) => {
    const k = key ? key(req) : (req.actor ? `${req.actor.role}:${req.actor.id}` : req.ip)
    if (!limiter.take(String(k))) {
      res.set('Retry-After', String(Math.ceil(windowMs / 1000)))
      return res.status(429).json({ success: false, code: 'RATE_LIMITED', message })
    }
    next()
  }
  mw.limiter = limiter
  return mw
}

module.exports = { rateLimit }
