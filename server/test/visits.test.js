const test = require('node:test')
const assert = require('node:assert/strict')
const { classify } = require('../analytics/visitSource')
const { toUpdate } = require('../routes/visits')

const UA = { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' }

test('referrers are named by where they come from', () => {
  assert.deepEqual(classify({ r: 'www.google.ie' }), { source: 'google', channel: 'search' })
  assert.deepEqual(classify({ r: 'gemini.google.com' }), { source: 'gemini', channel: 'ai' })
  assert.deepEqual(classify({ r: 'chatgpt.com' }), { source: 'chatgpt', channel: 'ai' })
  assert.deepEqual(classify({ r: 'm.youtube.com' }), { source: 'youtube', channel: 'video' })
  assert.deepEqual(classify({ r: 'lnkd.in' }), { source: 'linkedin', channel: 'social' })
  assert.deepEqual(classify({ r: 'mail.google.com' }), { source: 'gmail', channel: 'email' })
  assert.deepEqual(classify({ r: 'www.dyslexia.ie' }), { source: 'dyslexia.ie', channel: 'referral' })
  assert.deepEqual(classify({ r: '' }), { source: 'direct', channel: 'direct' })
  assert.deepEqual(classify({ r: '(internal)' }), { source: 'internal', channel: 'internal' })
})

test('campaign tags win over the referrer, and are cleaned', () => {
  assert.deepEqual(classify({ r: 'www.youtube.com', s: 'YouTube', m: 'video' }), { source: 'youtube', channel: 'video' })
  assert.deepEqual(classify({ s: 'news letter<script>' }), { source: 'news-letter-script', channel: 'campaign' })
})

test('a public page view is counted, with its source and campaign', async () => {
  const u = await toUpdate({ p: '/help-at-home/phonics-at-home', l: 'en', e: 1, t: 'view', r: 'www.bing.com', c: 'Winter_2026' }, UA)
  assert.equal(u.key.path, '/help-at-home/phonics-at-home')
  assert.equal(u.key.source, 'bing')
  assert.equal(u.key.campaign, 'winter_2026')
  assert.deepEqual(u.inc, { views: 1, entries: 1 })
})

test('a sign-in screen counts as a start, in any language', async () => {
  const u = await toUpdate({ p: '/parent-login', l: 'es', e: 0, t: 'start', r: '' }, UA)
  assert.deepEqual(u.inc, { starts: 1 })
})

test('pages that are not public in that language, bots and opted-out browsers are not counted', async () => {
  assert.equal(await toUpdate({ p: '/dashboard', l: 'en', t: 'view' }, UA), null)
  assert.equal(await toUpdate({ p: '/made-up-page', l: 'en', t: 'view' }, UA), null)
  assert.equal(await toUpdate({ p: '/help-at-home', l: 'es', t: 'view' }, UA), null) // English only for now
  assert.equal(await toUpdate({ p: '/faq', l: 'en', t: 'view' }, { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }), null)
  assert.equal(await toUpdate({ p: '/faq', l: 'en', t: 'view' }, { ...UA, 'sec-gpc': '1' }), null)
  assert.ok(await toUpdate({ p: '/faq', l: 'de', t: 'view' }, UA))
})
