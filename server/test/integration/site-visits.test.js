// Website visits (client/src/seo/visits.js → POST /api/visit → console
// Analytics → Growth → Website visits): counts only, no cookie, no identifier.
const test = require('node:test')
const assert = require('node:assert/strict')
const { start } = require('./harness')

let app
test.before(async () => { app = await start() })
test.after(async () => { await app?.stop?.() })

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
// As the site sends it: text/plain, no cookies.
const beacon = (body, headers = {}) => fetch(`${app.url}/api/visit`, { method: 'POST', headers: { 'content-type': 'text/plain', 'user-agent': UA, ...headers }, body: JSON.stringify(body) })

test('beacons add up to visits per source, page and campaign, and store nothing about the visitor', async () => {
  // A parent finds a guide on Google, reads another, then opens the parent sign-in.
  assert.equal((await beacon({ p: '/help-at-home/mixing-up-b-and-d', l: 'en', e: 1, t: 'view', r: 'www.google.ie' })).status, 204)
  await beacon({ p: '/learning-differences/dyslexia', l: 'en', e: 0, t: 'view', r: 'www.google.ie' })
  await beacon({ p: '/parent-login', l: 'en', e: 0, t: 'start', r: 'www.google.ie' })
  // A YouTube video link with campaign tags, in Spanish.
  await beacon({ p: '/', l: 'es', e: 1, t: 'view', r: 'www.youtube.com', s: 'youtube', m: 'video', c: 'video_launch' })
  // Not counted: a bot, an opted-out browser, an app screen, broken JSON.
  await beacon({ p: '/faq', l: 'en', e: 1, t: 'view' }, { 'user-agent': 'Googlebot/2.1' })
  await beacon({ p: '/faq', l: 'en', e: 1, t: 'view' }, { 'sec-gpc': '1' })
  await beacon({ p: '/dashboard', l: 'en', e: 1, t: 'view' })
  assert.equal((await fetch(`${app.url}/api/visit`, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{nope' })).status, 204)
  // The writes happen after the 204 (the first one also loads the page list), so wait for them.
  const rows = () => app.db.main.collection('sitevisitdays').find().toArray()
  let docs = []
  for (let i = 0; i < 50 && docs.length < 4; i++) { await new Promise((r) => setTimeout(r, 200)); docs = await rows() }
  await new Promise((r) => setTimeout(r, 300))
  docs = await rows()
  assert.equal(docs.length, 4)
  const FIELDS = new Set(['_id', 'date', 'path', 'lang', 'source', 'channel', 'campaign', 'views', 'entries', 'starts'])
  for (const d of docs) for (const k of Object.keys(d)) assert.ok(FIELDS.has(k), `unexpected field ${k}`)

  const res = await app.call('GET', '/api/superadmin/platform/visits?days=30', { token: app.tokens.superadmin() })
  assert.equal(res.status, 200)
  const V = res.body.visits
  assert.deepEqual({ visits: V.totals.visits, views: V.totals.views, starts: V.totals.starts }, { visits: 2, views: 3, starts: 1 })
  assert.equal(V.totals.startRate, 50)
  assert.deepEqual(V.sources.find((s) => s.source === 'google'), { source: 'google', channel: 'search', visits: 1, views: 2, starts: 1 })
  assert.deepEqual(V.campaigns, [{ campaign: 'video_launch', source: 'youtube', visits: 1, views: 1, starts: 0 }])
  assert.deepEqual(V.landing.map((l) => `${l.lang}${l.path}`).sort(), ['en/help-at-home/mixing-up-b-and-d', 'es/'])
  assert.equal(V.series.length, 30)
})

test('only console staff can read the numbers', async () => {
  const res = await app.call('GET', '/api/superadmin/platform/visits')
  assert.equal(res.status, 401)
})
