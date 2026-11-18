// Time-based one-time passwords (RFC 6238, HOTP from RFC 4226) with Node's own
// crypto, for staff two-factor sign-in (SUP-001 / FND-014). Works with any
// authenticator app (Google Authenticator, 1Password, Authy...): SHA-1, 6 digits,
// 30-second steps. Secrets are stored encrypted (AES-256-GCM), never in clear.
const crypto = require('crypto')

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const STEP = 30
const DIGITS = 6

function base32Encode(buf) {
  let bits = 0, value = 0, out = ''
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) { out += ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5 }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31]
  return out
}

function base32Decode(str) {
  const clean = String(str || '').toUpperCase().replace(/[\s=-]/g, '')
  let bits = 0, value = 0
  const out = []
  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch)
    if (idx < 0) throw new Error('Invalid base32 character')
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8 }
  }
  return Buffer.from(out)
}

const generateSecret = (bytes = 20) => base32Encode(crypto.randomBytes(bytes))

// HOTP(K, C) = Truncate(HMAC-SHA-1(K, C)) mod 10^digits
function hotp(secret, counter, digits = DIGITS) {
  const key = Buffer.isBuffer(secret) ? secret : base32Decode(secret)
  const msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(BigInt(counter))
  const h = crypto.createHmac('sha1', key).update(msg).digest()
  const off = h[h.length - 1] & 0x0f
  const code = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3]
  return String(code % 10 ** digits).padStart(digits, '0')
}

const stepAt = (ms = Date.now()) => Math.floor(ms / 1000 / STEP)
const totp = (secret, ms = Date.now()) => hotp(secret, stepAt(ms))

// Returns the matched time step (so the caller can refuse a replay of the same
// code), or null. Accepts one step of clock drift either way.
function verifyTotp(secret, code, { ms = Date.now(), window = 1, afterStep = -1 } = {}) {
  const c = String(code || '').replace(/\s/g, '')
  if (!/^\d{6}$/.test(c)) return null
  const now = stepAt(ms)
  for (let w = -window; w <= window; w++) {
    const s = now + w
    if (s <= afterStep) continue
    const expected = hotp(secret, s)
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(c))) return s
  }
  return null
}

const otpauthUri = ({ secret, account, issuer = 'Learnigo' }) =>
  `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${DIGITS}&period=${STEP}`

// Encryption of stored secrets. Key: STAFF_TOTP_KEY, or derived from the super admin JWT secret.
const keyBytes = () => crypto.createHash('sha256').update(`totp:${process.env.STAFF_TOTP_KEY || process.env.SUPERADMIN_JWT_SECRET || ''}`).digest()
function seal(plain) {
  const iv = crypto.randomBytes(12)
  const c = crypto.createCipheriv('aes-256-gcm', keyBytes(), iv)
  const enc = Buffer.concat([c.update(String(plain), 'utf8'), c.final()])
  return `v1:${iv.toString('base64')}:${c.getAuthTag().toString('base64')}:${enc.toString('base64')}`
}
function unseal(sealed) {
  const [v, iv, tag, enc] = String(sealed || '').split(':')
  if (v !== 'v1') throw new Error('Unknown secret format')
  const d = crypto.createDecipheriv('aes-256-gcm', keyBytes(), Buffer.from(iv, 'base64'))
  d.setAuthTag(Buffer.from(tag, 'base64'))
  return Buffer.concat([d.update(Buffer.from(enc, 'base64')), d.final()]).toString('utf8')
}

// Recovery codes: shown once, stored as SHA-256 hashes, each usable once.
const formatCode = (raw) => `${raw.slice(0, 5)}-${raw.slice(5, 10)}`
function makeRecoveryCodes(n = 10) {
  return Array.from({ length: n }, () => formatCode(base32Encode(crypto.randomBytes(7)).slice(0, 10).toLowerCase()))
}
const hashRecoveryCode = (code) => crypto.createHash('sha256').update(String(code || '').toLowerCase().replace(/[\s-]/g, '')).digest('hex')

module.exports = { base32Encode, base32Decode, generateSecret, hotp, totp, verifyTotp, stepAt, otpauthUri, seal, unseal, makeRecoveryCodes, hashRecoveryCode, STEP }
