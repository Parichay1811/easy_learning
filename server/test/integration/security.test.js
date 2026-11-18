// Abuse protection: password guessing is slowed, headers are set, limits are per client.
const test = require('node:test')
const assert = require('node:assert/strict')
const { start } = require('./harness')
const { rateLimit, accountKey } = require('../../middleware/rateLimit')

let app
test.before(async () => { app = await start() })
test.after(async () => { await app?.stop() })

test('super admin password login: the 9th wrong attempt in a window is blocked, with Retry-After', async () => {
  const codes = []
  for (let i = 0; i < 10; i++) {
    const r = await app.call('POST', '/api/superadmin/auth/login', { body: { email: 'root@example.com', password: `wrong${i}` } })
    codes.push(r.status)
  }
  assert.ok(codes.slice(0, 8).every((c) => c === 401 || c === 400), `first 8 should be refused normally, got ${codes}`)
  assert.deepEqual(codes.slice(8), [429, 429])
  const res = await fetch(`${app.url}/api/superadmin/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'root@example.com', password: 'x' }) })
  assert.equal(res.status, 429)
  assert.ok(Number(res.headers.get('retry-after')) > 0)
})

test('a different account from the same client is counted separately', async () => {
  const r = await app.call('POST', '/api/auth/login', { body: { email: 'someone.else@example.com', password: 'nope' } })
  assert.notEqual(r.status, 429)
})

test('API responses carry security headers and are not cacheable', async () => {
  const res = await fetch(`${app.url}/api/meta/metrics`)
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(res.headers.get('cache-control'), 'no-store')
  assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN')
  assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin')
})

test('limiter unit: sliding window, per key, reset', () => {
  let t = 0
  const lim = rateLimit({ windowMs: 1000, max: 2, now: () => t })
  const run = (req) => { let out = 'next'; lim(req, { set() {}, status() { return { json() { out = 429 } } } }, () => {}); return out }
  assert.equal(run({ ip: 'a' }), 'next'); assert.equal(run({ ip: 'a' }), 'next'); assert.equal(run({ ip: 'a' }), 429)
  assert.equal(run({ ip: 'b' }), 'next')
  t = 1500
  assert.equal(run({ ip: 'a' }), 'next')
  assert.equal(accountKey({ ip: '1.1.1.1', body: { email: 'A@B.co' } }), '1.1.1.1|a@b.co')
})
