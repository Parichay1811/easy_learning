// Our nginx sets X-Real-IP (not X-Forwarded-For) on /api/. Express's `trust proxy` reads
// X-Forwarded-For, so without this every visitor would look like 127.0.0.1 and share one
// rate limit. Only a request arriving from this machine (nginx) may name the client;
// anything else keeps its socket address, so the header can't be spoofed from outside.
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

function realIp(req, res, next) {
  const real = req.headers['x-real-ip']
  if (real && !req.headers['x-forwarded-for'] && LOOPBACK.has(req.socket?.remoteAddress)) {
    req.headers['x-forwarded-for'] = String(real).split(',')[0].trim()
  }
  next()
}

module.exports = { realIp, LOOPBACK }
