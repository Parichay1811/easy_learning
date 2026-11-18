// TOTP against the RFC 6238 / RFC 4226 test vectors, plus secret sealing and recovery codes.
const test = require('node:test')
const assert = require('node:assert/strict')
process.env.SUPERADMIN_JWT_SECRET = process.env.SUPERADMIN_JWT_SECRET || 'unit-test-secret'
const t = require('../utils/totp')

const RFC_KEY = Buffer.from('12345678901234567890')

test('HOTP matches RFC 4226 appendix D', () => {
  const expected = ['755224', '287082', '359152', '969429', '338314', '254676', '287922', '162583', '399871', '520489']
  expected.forEach((code, i) => assert.equal(t.hotp(RFC_KEY, i), code))
})

test('TOTP (SHA-1) matches RFC 6238 appendix B, last 6 digits', () => {
  const b32 = t.base32Encode(RFC_KEY)
  assert.equal(b32, 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ')
  for (const [sec, code] of [[59, '287082'], [1111111109, '081804'], [1111111111, '050471'], [1234567890, '005924'], [2000000000, '279037'], [20000000000, '353130']]) {
    assert.equal(t.totp(b32, sec * 1000), code)
  }
})

test('verifyTotp accepts one step of drift, refuses replays and junk', () => {
  const s = t.generateSecret()
  const now = 1_700_000_000_000
  const code = t.totp(s, now - 30_000)
  const step = t.verifyTotp(s, code, { ms: now })
  assert.equal(step, t.stepAt(now) - 1)
  assert.equal(t.verifyTotp(s, code, { ms: now, afterStep: step }), null)
  assert.equal(t.verifyTotp(s, t.totp(s, now - 120_000), { ms: now }), null)
  assert.equal(t.verifyTotp(s, 'abcdef', { ms: now }), null)
  assert.equal(t.verifyTotp(s, '', { ms: now }), null)
})

test('secrets are sealed, and tampering is detected', () => {
  const sealed = t.seal('JBSWY3DPEHPK3PXP')
  assert.notEqual(sealed, 'JBSWY3DPEHPK3PXP')
  assert.equal(t.unseal(sealed), 'JBSWY3DPEHPK3PXP')
  const parts = sealed.split(':'); parts[3] = Buffer.from('xxxxxxxxxxxx').toString('base64')
  assert.throws(() => t.unseal(parts.join(':')))
})

test('recovery codes are unique and hash the same however they are typed', () => {
  const codes = t.makeRecoveryCodes(10)
  assert.equal(new Set(codes).size, 10)
  assert.match(codes[0], /^[a-z2-7]{5}-[a-z2-7]{5}$/)
  assert.equal(t.hashRecoveryCode(codes[0]), t.hashRecoveryCode(codes[0].toUpperCase().replace('-', ' ')))
})

test('otpauth URI is well formed', () => {
  const uri = t.otpauthUri({ secret: 'ABC', account: 'ana@learnigo.eu' })
  assert.match(uri, /^otpauth:\/\/totp\/Learnigo:ana%40learnigo\.eu\?secret=ABC&issuer=Learnigo/)
})
