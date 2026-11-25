// The Shorts feed (G-520..522) and what it learns about a learner's interests (G-521).
//
//   feed(email, { limit, exclude })   the next shorts: half from what they like, half something new
//   note(email, { id, kind, correct }) kind: view | done | like | unlike | quiz
//   setPicks(email, themes)           the themes the learner chose themselves
//   state(email)                      { picks, liked, enabled, breakEvery }
//
// Only these signals are used: the learner's own picks and hearts, and which shorts they
// watched to the end. Nothing from the rest of the site, and nothing leaves Learnigo.
const ShortsInterest = require('../../models/social/ShortsInterest')
const cfg = require('../../config/social')
const store = require('../learning/store')
const { createRng } = require('../learning/rng')
const { standing, SocialError, lower } = require('../social/guard')
const catalog = require('./catalog')

async function bandOf(email, st) {
  const profile = await store.getProfile(email)
  if (profile.ageBand) return profile.ageBand
  if (st.age != null) return st.age < 13 ? 'child' : st.age < 18 ? 'teen' : 'adult'
  return st.child ? 'child' : 'unknown'
}

const getDoc = async (email) => (await ShortsInterest.findOne({ email: lower(email) })) || new ShortsInterest({ email: lower(email) })

// How much a learner likes each theme: their own picks first, then hearts, then shorts
// finished; opening a short and swiping on counts a little against.
function weights(doc) {
  const w = new Map()
  for (const t of doc.picks || []) w.set(t, (w.get(t) || 0) + 4)
  for (const [t, c] of doc.themes || []) {
    const v = (c.likes || 0) * 3 + (c.done || 0) - Math.max(0, (c.views || 0) - (c.done || 0)) * 0.25
    if (v > 0) w.set(t, (w.get(t) || 0) + Math.min(12, v))
  }
  return w
}

function weightedPick(w, rng) {
  const entries = [...w].filter(([, v]) => v > 0)
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (!total) return null
  let x = rng.next() * total
  for (const [k, v] of entries) { x -= v; if (x <= 0) return k }
  return entries[entries.length - 1][0]
}

// Picks `n` shorts from `pool`: reviewed first, then ones with a picture, in a seeded shuffle.
function best(pool, n, rng) {
  return rng.shuffle(pool).sort((a, b) => (Number(b.reviewed) - Number(a.reviewed)) || (Number(Boolean(b.picture)) - Number(Boolean(a.picture)))).slice(0, n)
}

const publicShort = (s, liked) => ({ id: s.id, title: s.title, area: s.area, theme: s.theme, steps: s.steps, facts: s.facts, picture: s.picture, quiz: s.quiz, liked: liked.has(s.id) })

async function feed(email, { limit = cfg.shorts.page, exclude = [], seed } = {}) {
  const e = lower(email)
  const st = await standing(e)
  if (!st.shorts) throw new SocialError(403, 'Shorts are switched off for you. Ask a grown-up if you would like them on.', 'SHORTS_OFF')
  const n = Math.max(1, Math.min(cfg.shorts.maxPage, Number(limit) || cfg.shorts.page))
  const doc = await getDoc(e)
  const band = await bandOf(e, st)
  await catalog.ready()
  const all = catalog.forBand(band)
  const skip = new Set([...(doc.seen || []), ...exclude.map(String)])
  let fresh = all.filter((s) => !skip.has(s.id))
  if (fresh.length < n) fresh = all.filter((s) => !exclude.includes(s.id)) // seen everything: start over
  const rng = createRng(seed || `${e}|${Date.now()}`)
  const w = weights(doc)
  const byTheme = new Map()
  for (const s of fresh) { if (!byTheme.has(s.theme)) byTheme.set(s.theme, []); byTheme.get(s.theme).push(s) }

  const picked = []
  const take = (s) => { if (s && !picked.includes(s)) { picked.push(s); const l = byTheme.get(s.theme); l.splice(l.indexOf(s), 1) } }
  // What they like.
  const wantLiked = w.size ? Math.round(n * cfg.shorts.mix.liked) : 0
  for (let i = 0; i < wantLiked * 3 && picked.length < wantLiked; i++) {
    const t = weightedPick(w, rng)
    const pool = byTheme.get(t) || []
    if (pool.length) take(best(pool, 1, rng)[0])
  }
  // Something new: one from each other theme in turn, so the feed stays wide.
  const themes = rng.shuffle([...byTheme.keys()]).sort((a, b) => (w.get(a) || 0) - (w.get(b) || 0))
  for (let round = 0; round < 6 && picked.length < n; round++) {
    for (const t of themes) {
      if (picked.length >= n) break
      const pool = byTheme.get(t) || []
      if (pool.length) take(best(pool, 1, rng)[0])
    }
  }
  const liked = new Set((doc.liked || []).map((x) => x.id))
  // Favourites and new ones interleaved, so it never reads as two blocks.
  const fav = picked.slice(0, Math.min(wantLiked, picked.length)); const rest = picked.slice(fav.length)
  const order = []
  while (fav.length || rest.length) { if (rest.length) order.push(rest.shift()); if (fav.length) order.push(fav.shift()) }
  return {
    items: order.map((s) => publicShort(s, liked)), band, breakEvery: cfg.shorts.breakEvery,
    picks: doc.picks || [], themes: catalog.THEME_KEYS, needsPicks: !(doc.picks || []).length && !(doc.totals?.views > 0),
  }
}

// ISO week key "2026-W48" (UTC).
function weekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const year = t.getUTCFullYear()
  const week = Math.ceil(((t - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

const KINDS = ['view', 'done', 'like', 'unlike', 'quiz']

async function note(email, { id, kind, correct } = {}, now = new Date()) {
  const e = lower(email)
  if (!KINDS.includes(kind)) throw new SocialError(400, `kind must be one of ${KINDS.join(', ')}`)
  const s = (await catalog.ready()).byId.get(String(id || ''))
  if (!s) throw new SocialError(404, 'Short not found')
  const doc = await getDoc(e)
  const bump = (map, key, field, by = 1) => {
    const cur = map.get(key) || { views: 0, done: 0, likes: 0, right: 0, last: null }
    const next = { views: cur.views || 0, done: cur.done || 0, likes: cur.likes || 0, right: cur.right || 0, last: now }
    next[field] = Math.max(0, (next[field] || 0) + by)
    map.set(key, next)
  }
  const areaKey = s.area.replace(/[.$]/g, ' ') // Map keys cannot hold dots or dollars
  const both = (field, by) => { bump(doc.themes, s.theme, field, by); bump(doc.areas, areaKey, field, by) }
  if (kind === 'view') {
    both('views'); doc.totals.views += 1
    doc.seen = [...(doc.seen || []).filter((x) => x !== s.id), s.id].slice(-cfg.shorts.recentSeen)
  } else if (kind === 'done') {
    both('done'); doc.totals.done += 1
    const wk = weekKey(now)
    doc.weeks.set(wk, (doc.weeks.get(wk) || 0) + 1)
    for (const k of [...doc.weeks.keys()].sort().slice(0, -12)) doc.weeks.delete(k) // the last 12 weeks only
  } else if (kind === 'like') {
    if (!(doc.liked || []).some((x) => x.id === s.id)) {
      both('likes'); doc.totals.likes += 1
      doc.liked = [...(doc.liked || []), { id: s.id, title: s.title, theme: s.theme, at: now }].slice(-cfg.shorts.likedMax)
    }
  } else if (kind === 'unlike') {
    if ((doc.liked || []).some((x) => x.id === s.id)) {
      both('likes', -1); doc.totals.likes = Math.max(0, doc.totals.likes - 1)
      doc.liked = doc.liked.filter((x) => x.id !== s.id)
    }
  } else if (kind === 'quiz' && correct === true) both('right')
  await doc.save()
  return { ok: true }
}

async function setPicks(email, themes) {
  if (!Array.isArray(themes)) throw new SocialError(400, 'themes must be a list')
  const picks = [...new Set(themes.map(String))].filter((t) => catalog.THEME_KEYS.includes(t)).slice(0, catalog.THEME_KEYS.length)
  const doc = await getDoc(email)
  doc.picks = picks
  await doc.save()
  return { picks }
}

async function liked(email) {
  const doc = await getDoc(email)
  const { byId } = await catalog.ready()
  const ids = new Set((doc.liked || []).map((x) => x.id))
  return [...(doc.liked || [])].reverse().map((x) => byId.get(x.id)).filter(Boolean).map((s) => publicShort(s, ids))
}

module.exports = { feed, note, setPicks, liked, weights, weekKey, bandOf, KINDS }
