// Verifies a Firebase ID token the way Firebase documents it, with no extra
// dependency: RS256 signature against Google's published certificates, issuer
// and audience for OUR project, not expired. Sign-in endpoints must take the
// identity from the verified claims, never from the request body: before this,
// anyone could sign in as any email by sending it.
const jwt = require('jsonwebtoken')

// The project id is public (it ships in the client bundle). Override per environment if needed.
const projectId = () => process.env.FIREBASE_PROJECT_ID || 'learningo-c9ac4'
const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'

let cache = { certs: null, until: 0 }

// Overridable in tests.
const deps = {
  async fetchCerts() {
    const res = await fetch(CERTS_URL)
    if (!res.ok) throw new Error(`certs ${res.status}`)
    const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1]) || 3600
    return { certs: await res.json(), ttlMs: maxAge * 1000 }
  },
  now: () => Date.now(),
}
// Integration tests boot the real server in a child process and sign their own tokens:
// they pass the matching certificates here. Ignored outside NODE_ENV=test.
if (process.env.NODE_ENV === 'test' && process.env.FIREBASE_TEST_CERTS) {
  deps.fetchCerts = async () => ({ certs: JSON.parse(process.env.FIREBASE_TEST_CERTS), ttlMs: 3600000 })
}

async function certFor(kid) {
  if (!cache.certs || deps.now() > cache.until || !cache.certs[kid]) {
    const { certs, ttlMs } = await deps.fetchCerts()
    cache = { certs, until: deps.now() + ttlMs }
  }
  return cache.certs[kid]
}

class AuthError extends Error {
  constructor(message, status = 401) { super(message); this.status = status }
}

// Returns { uid, email, name, photoURL } from a valid token, or throws AuthError.
async function verifyFirebaseIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') throw new AuthError('A sign-in token is required', 400)
  const decoded = jwt.decode(idToken, { complete: true })
  if (!decoded || decoded.header.alg !== 'RS256' || !decoded.header.kid) throw new AuthError('Invalid sign-in token')
  let cert
  try { cert = await certFor(decoded.header.kid) } catch { throw new AuthError('Could not verify sign-in right now. Please try again.', 503) }
  if (!cert) throw new AuthError('Invalid sign-in token')
  let claims
  try {
    claims = jwt.verify(idToken, cert, {
      algorithms: ['RS256'],
      audience: projectId(),
      issuer: `https://securetoken.google.com/${projectId()}`,
      clockTimeout: 0,
    })
  } catch {
    throw new AuthError('Your sign-in expired or is not valid. Please sign in again.')
  }
  if (!claims.sub || !claims.email) throw new AuthError('Invalid sign-in token')
  if (claims.email_verified === false) throw new AuthError('Please verify your email address first.', 403)
  return { uid: claims.sub, email: String(claims.email).toLowerCase(), name: claims.name || '', photoURL: claims.picture || '' }
}

// Express helper: reads req.body.idToken and answers 4xx itself on failure.
async function identityFromRequest(req, res) {
  try {
    return await verifyFirebaseIdToken(req.body && req.body.idToken)
  } catch (err) {
    res.status(err.status || 401).json({ success: false, message: err.message })
    return null
  }
}

module.exports = { verifyFirebaseIdToken, identityFromRequest, AuthError, deps }
