// Sign-in must come from a verified Firebase token, never from the request body.
const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { fakeRes } = require('./helpers')
const ft = require('../utils/firebaseToken')

const PROJECT = 'learningo-c9ac4'
const keyA = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
const keyB = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
const pem = (k) => k.publicKey.export({ type: 'spki', format: 'pem' })

ft.deps.fetchCerts = async () => ({ certs: { kidA: pem(keyA) }, ttlMs: 60000 })

const sign = (claims = {}, { key = keyA, kid = 'kidA', alg = 'RS256' } = {}) =>
  jwt.sign(
    { email: 'Aanya@Example.com', email_verified: true, name: 'Aanya', picture: 'p.png', ...claims },
    key.privateKey,
    { algorithm: alg, keyid: kid, audience: PROJECT, issuer: `https://securetoken.google.com/${PROJECT}`, subject: 'uid-1', expiresIn: '1h', ...(claims._opts || {}) },
  )

test('a valid token gives the verified identity (email lower-cased)', async () => {
  const id = await ft.verifyFirebaseIdToken(sign())
  assert.deepEqual(id, { uid: 'uid-1', email: 'aanya@example.com', name: 'Aanya', photoURL: 'p.png' })
})

test('rejects: missing, malformed, wrong key, unknown kid, none-alg', async () => {
  await assert.rejects(ft.verifyFirebaseIdToken(undefined), (e) => e.status === 400)
  await assert.rejects(ft.verifyFirebaseIdToken('not.a.jwt'), (e) => e.status === 401)
  await assert.rejects(ft.verifyFirebaseIdToken(sign({}, { key: keyB })), (e) => e.status === 401) // forged signature
  await assert.rejects(ft.verifyFirebaseIdToken(sign({}, { kid: 'other' })), (e) => e.status === 401)
  const none = jwt.sign({ email: 'a@b.co' }, '', { algorithm: 'none', subject: 'x' })
  await assert.rejects(ft.verifyFirebaseIdToken(none), (e) => e.status === 401)
})

test('rejects: another project, another issuer, expired', async () => {
  const other = jwt.sign({ email: 'a@b.co' }, keyA.privateKey, { algorithm: 'RS256', keyid: 'kidA', audience: 'someone-elses-app', issuer: 'https://securetoken.google.com/someone-elses-app', subject: 'u', expiresIn: '1h' })
  await assert.rejects(ft.verifyFirebaseIdToken(other), (e) => e.status === 401)
  const expired = jwt.sign({ email: 'a@b.co' }, keyA.privateKey, { algorithm: 'RS256', keyid: 'kidA', audience: PROJECT, issuer: `https://securetoken.google.com/${PROJECT}`, subject: 'u', expiresIn: -10 })
  await assert.rejects(ft.verifyFirebaseIdToken(expired), (e) => e.status === 401)
})

test('rejects: no email, unverified email', async () => {
  const noEmail = jwt.sign({}, keyA.privateKey, { algorithm: 'RS256', keyid: 'kidA', audience: PROJECT, issuer: `https://securetoken.google.com/${PROJECT}`, subject: 'u', expiresIn: '1h' })
  await assert.rejects(ft.verifyFirebaseIdToken(noEmail), (e) => e.status === 401)
  await assert.rejects(ft.verifyFirebaseIdToken(sign({ email_verified: false })), (e) => e.status === 403)
})

test('a certificate outage fails closed (503), not open', async () => {
  const before = ft.deps.fetchCerts
  ft.deps.fetchCerts = async () => { throw new Error('offline') }
  // a kid that is not cached forces a fetch
  await assert.rejects(ft.verifyFirebaseIdToken(sign({}, { kid: 'fresh-kid' })), (e) => e.status === 503)
  ft.deps.fetchCerts = before
})

test('sign-in endpoints ignore uid/email in the body: no token, no session', async () => {
  const { googleSignIn: parent } = require('../controllers/parentAuthController')
  const { googleSignIn: admin } = require('../controllers/adminAuthController')
  const { googleSignIn: teacher } = require('../controllers/teacherAuthController')
  const { setSession } = require('../controllers/authController')
  for (const handler of [parent, admin, teacher, setSession]) {
    const res = fakeRes()
    res.cookie = () => assert.fail('no cookie may be set without a verified token')
    await handler({ body: { uid: 'victim-uid', email: 'victim@example.com', name: 'x' }, cookies: {} }, res)
    assert.equal(res.statusCode, 400)
    assert.ok(!res.body.token)
  }
})
