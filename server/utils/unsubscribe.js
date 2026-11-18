// One-tap unsubscribe links (FND-061). The token names the account and the
// kind of email and is signed, so nobody can switch off someone else's mail.
// It never expires: an old email's link must still work.
const crypto = require('crypto')

const secret = () => process.env.UNSUBSCRIBE_SECRET || process.env.COOKIE_SECRET || process.env.JWT_SECRET || 'dev-unsubscribe-secret'
const b64 = (s) => Buffer.from(s).toString('base64url')
const sig = (payload) => crypto.createHmac('sha256', secret()).update(`unsub|${payload}`).digest('base64url').slice(0, 32)

function makeToken(owner, kind) {
  const payload = b64(JSON.stringify([owner, kind]))
  return `${payload}.${sig(payload)}`
}

// -> { owner, kind } or null
function readToken(token) {
  const [payload, mac] = String(token || '').split('.')
  if (!payload || !mac) return null
  const expected = sig(payload)
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null
  try {
    const [owner, kind] = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (typeof owner !== 'string' || typeof kind !== 'string') return null
    return { owner, kind }
  } catch { return null }
}

const apiBase = () => (process.env.PUBLIC_API_URL || process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, '')
const unsubscribeUrl = (owner, kind) => `${apiBase()}/api/notification-prefs/unsubscribe?t=${encodeURIComponent(makeToken(owner, kind))}`

module.exports = { makeToken, readToken, unsubscribeUrl }
