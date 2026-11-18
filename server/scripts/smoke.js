/**
 * smoke.js: a read-only health check of a running site, for after a deploy.
 * It never signs in and never writes. It checks that the pages load, the API
 * answers, protected routes refuse strangers, and forged identities are rejected.
 *
 *   node scripts/smoke.js https://www.learnigo.eu
 *
 * Exits 1 if anything fails, so it can gate a deploy script.
 */
const base = (process.argv[2] || 'http://127.0.0.1:5000').replace(/\/$/, '')
const results = []

async function check(name, fn) {
  try { const detail = await fn(); results.push({ name, ok: true, detail }) }
  catch (err) { results.push({ name, ok: false, detail: err.message }) }
}
const get = (p, opts) => fetch(base + p, { redirect: 'manual', ...opts })
const expect = (cond, msg) => { if (!cond) throw new Error(msg) }

;(async () => {
  for (const page of ['/', '/home', '/ai-teacher', '/games', '/pricing']) {
    await check(`page ${page} loads`, async () => { const r = await get(page); expect(r.status === 200, `HTTP ${r.status}`); return r.status })
  }
  await check('API: metrics dictionary', async () => { const r = await get('/api/meta/metrics'); const j = await r.json(); expect(r.status === 200 && j.metrics?.accuracy, `HTTP ${r.status}`); return Object.keys(j.metrics).length + ' metrics' })
  await check('API: security headers', async () => { const r = await get('/api/meta/metrics'); expect(r.headers.get('x-content-type-options') === 'nosniff', 'missing nosniff'); expect(/no-store/.test(r.headers.get('cache-control') || ''), 'cacheable API response'); return 'ok' })
  await check('AI Teacher is up', async () => { const r = await get('/api/ai-assistant/health'); const j = await r.json(); expect(j.ready === true, 'not ready'); return `voice=${j.voice}` })

  // Protected routes refuse strangers.
  for (const p of ['/api/entitlements', '/api/notifications', '/api/parent/children', '/api/teacher/batches', '/api/admin/stats', '/api/superadmin/stats', '/api/dashboard/stats']) {
    await check(`protected ${p}`, async () => { const r = await get(p); expect(r.status === 401, `expected 401, got ${r.status}`); return 401 })
  }
  // Forged identities are rejected.
  for (const p of ['/api/auth/session', '/api/parent/auth/google', '/api/teacher/auth/google', '/api/admin/auth/google']) {
    await check(`forged sign-in refused ${p}`, async () => {
      const r = await get(p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ uid: 'victim', email: 'victim@example.com' }) })
      const j = await r.json().catch(() => ({}))
      expect(r.status === 400 && !j.token, `HTTP ${r.status}, token=${Boolean(j.token)}`); return 400
    })
  }
  await check('forged student cookie refused', async () => {
    const cookie = 'user_session=' + encodeURIComponent(JSON.stringify({ uid: 'x', email: 'victim@example.com' }))
    const r = await get('/api/dashboard/stats', { headers: { cookie } })
    expect(r.status === 401, `HTTP ${r.status}`); return 401
  })

  const failed = results.filter((r) => !r.ok)
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail != null ? `  (${r.detail})` : ''}`)
  console.log(`\n${results.length - failed.length}/${results.length} passed against ${base}`)
  process.exit(failed.length ? 1 : 0)
})()
