// POST /api/visit: one view of a public page, or an arrival on a sign-in
// screen, sent by the site (client/src/seo/visits.js). Adds one to that day's
// totals (models/analytics/SiteVisitDay.js). No cookie is read or set and no IP
// address or browser detail is kept: the request is used only to add to a count.
// Always answers 204, so it tells a caller nothing.
const express = require('express')
const path = require('path')
const { pathToFileURL } = require('url')
const { rateLimit } = require('../middleware/rateLimit')
const SiteVisitDay = require('../models/analytics/SiteVisitDay')
const { classify, tag } = require('../analytics/visitSource')

const router = express.Router()

const START_PATHS = ['/login', '/parent-login', '/teacher-login']
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|python|curl|wget|httpclient|java\/|go-http|node-fetch|axios/i

// The pages that may be counted, in the languages each is published in: the
// site's own page list (client/src/seo/registry.js), so a made-up address is
// never stored.
let allowed = null
let warned = false
async function allowedPages() {
  if (!allowed) {
    allowed = (async () => {
      const file = path.join(__dirname, '..', '..', 'client', 'src', 'seo', 'registry.js')
      const { PAGES, LANG_CODES } = await import(pathToFileURL(file).href)
      const set = new Set()
      for (const page of PAGES) for (const lang of page.langs) set.add(`${lang}|${page.path}`)
      for (const p of START_PATHS) for (const lang of LANG_CODES) set.add(`${lang}|${p}`)
      return set
    })().catch((err) => {
      if (!warned) console.error('[visits] could not read the page list (client/src/seo/registry.js); visits are not counted:', err.message)
      warned = true
      allowed = null
      return new Set()
    })
  }
  return allowed
}

function parse(body) {
  if (body && typeof body === 'object') return body
  try { return JSON.parse(String(body || '')) } catch { return null }
}

/** The day's counters to add for one beacon, or null when it is not counted. */
async function toUpdate(b, headers = {}) {
  if (!b || typeof b.p !== 'string' || typeof b.l !== 'string') return null
  if (BOT.test(headers['user-agent'] || '')) return null
  if (headers['sec-gpc'] === '1' || headers.dnt === '1') return null
  const lang = tag(b.l, 5)
  const page = String(b.p).slice(0, 120)
  if (!(await allowedPages()).has(`${lang}|${page}`)) return null
  const str = (v) => (typeof v === 'string' ? v.slice(0, 200) : '')
  const { source, channel } = classify({ r: str(b.r), s: str(b.s), m: str(b.m) })
  const isStart = b.t === 'start' && START_PATHS.includes(page)
  const entry = b.e === 1 || b.e === '1'
  return {
    key: { date: new Date().toISOString().slice(0, 10), path: page, lang, source, channel, campaign: tag(str(b.c), 60) },
    inc: { [isStart ? 'starts' : 'views']: 1, ...(entry ? { entries: 1 } : {}) },
  }
}

router.post('/', rateLimit({ windowMs: 60_000, max: 60 }), express.text({ type: () => true, limit: '2kb' }), async (req, res) => {
  res.status(204).end()
  try {
    const u = await toUpdate(parse(req.body), req.headers)
    if (u) await SiteVisitDay.updateOne(u.key, { $inc: u.inc }, { upsert: true })
  } catch (err) {
    if (err?.code !== 11000) console.error('[visits]', err.message)
  }
})

module.exports = router
module.exports.toUpdate = toUpdate
