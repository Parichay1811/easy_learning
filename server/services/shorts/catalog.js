// Shorts (G-520): the AI Teacher's topic packs as small lessons to swipe.
//
// One short = one pack: its first ideas as two or three spoken beats, a picture when the
// pack has one (a 3D render, with its loop), and one "now you try" question. Built once
// from the pack files (ai-assistant/packs), kept small in memory.
//
//   await ready()          -> { list, byId }   (cached; loads without blocking the server)
//   load()                 the same at once, blocking: for tests and tools
//   levelsFor(band)        -> which pack levels a learner of that age band sees
//   themeOf(area)          -> one of THEMES
const fs = require('fs')
const path = require('path')
const cfg = require('../../config/social')

const ROOT = path.join(__dirname, '..', '..', 'ai-assistant')

// What a learner picks from ("I like..."), and which pack areas each one covers.
const THEMES = {
  animals: ['Body and Animals', 'Biology Wonders'],
  nature: ['How Nature Works', 'Nature', 'Planet Earth', 'Environment', 'Biology', 'Earth, Space & Environmental Science'],
  space: ['Space'],
  body: ['The Human Body', 'Medicine & Health Science'],
  numbers: ['Mathematics', 'Maths for Fun'],
  words: ['English Language & Literature', 'Languages', 'Writing', 'Literature and Myth', 'Language and Words', 'Early Years & Foundations'],
  science: ['Everyday Science', 'Everyday Physics', 'Everyday Chemistry', 'Physics', 'Chemistry'],
  machines: ['Engineering', 'Technology', 'Making and Fixing', 'Architecture', 'Coding', 'Computer Science & Digital Literacy'],
  world: ['World Geography', 'World History', 'Humanities', 'Social and Human Understanding', 'Famous Lives', 'Citizenship'],
  arts: ['Music', 'Art', 'Health, PE & the Arts', 'Film and Media', 'Sport and Games', 'Cooking and Food'],
  curious: ['For Kids', 'General Knowledge', 'School Explainers', 'Learning Support', 'Skills', 'Life Skills', 'The Mind'],
}
const THEME_KEYS = Object.keys(THEMES)
const AREA_THEME = new Map(Object.entries(THEMES).flatMap(([t, areas]) => areas.map((a) => [a, t])))
const themeOf = (area) => AREA_THEME.get(area) || 'curious'

// Pack levels (ai-assistant/factory/build-packs.mjs): EY 4-5, P1 6-7, P2 8-10, L 11-14,
// M 14-16, U 16-18, E entrance exams, H university, PRO adults.
const LEVELS = {
  child: ['EY', 'P1', 'P2'],
  teen: ['P2', 'L', 'M'],
  adult: ['L', 'M', 'U', 'H', 'PRO'],
  // Age not known: the young levels, so nothing unsuitable can turn up.
  unknown: ['P1', 'P2'],
}
const levelsFor = (band) => LEVELS[band] || LEVELS.unknown

// Areas left out for children whatever the pack says (they need an adult's framing).
const NOT_FOR_CHILD = new Set(['World Religions & Sacred Books', 'Beliefs', 'Philosophy', 'Social Sciences, Philosophy & Law', 'Law for Life', 'Economics for Life', 'Careers'])

const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim()

// Words that only make sense on the AI Teacher's own page ("Tap any part, and I will tell
// you what it does"): a short has nothing to tap, so those sentences are left out.
const PAGE_ONLY = /\b(tap|click|press)\b[^.!?]*[.!?]?/i
const sentences = (text) => text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((x) => x.trim()).filter(Boolean) || []

// The first ideas of a pack as short spoken beats: whole sentences, within the size limit,
// each with what the board draws while it is said.
function beats(explain) {
  const out = []
  let used = 0
  for (const step of explain || []) {
    let list = sentences(clean(step.say)).filter((x) => !PAGE_ONLY.test(x))
    if (!list.length) continue
    if (out.length >= 3 || (out.length >= 2 && used + list.join(' ').length > cfg.shorts.maxSayChars)) break
    while (list.length > 1 && list.join(' ').length > 240) list = list.slice(0, -1)
    const say = list.join(' ')
    out.push({ say, draw: Array.isArray(step.draw) ? step.draw.filter((o) => o && typeof o.op === 'string') : [] })
    used += say.length
  }
  return out
}

function quizOf(pack) {
  const q = (pack.quiz || []).find((x) => x && Array.isArray(x.options) && x.options.length >= 2 && Number.isInteger(x.answer) && x.options[x.answer])
  if (!q) return null
  return { ask: clean(q.say || q.show), options: q.options.map((o) => clean(o.show || o.say)).slice(0, 4), answer: q.answer, why: clean(q.why) }
}

function sensitiveIds() {
  const out = new Set()
  for (const f of ['topics.json', 'topics-extra.json']) {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'factory', f), 'utf8'))
      for (const t of (j.topics || j)) if (t && t.sensitive) out.add(t.id)
    } catch { /* no catalogue: nothing is marked */ }
  }
  return out
}

// The 3D picture library, read from its manifest without importing the module (it is an
// ES module for the browser): name -> { src, loop }.
function renders() {
  const out = new Map()
  try {
    const text = fs.readFileSync(path.join(ROOT, 'shared', 'renders.js'), 'utf8')
    const re = /^\s*"([a-z0-9-]+)":\s*\{"title":"[^"]*","src":"([^"]+)"(?:,"loop":"([^"]+)")?/gm
    let m
    while ((m = re.exec(text))) out.set(m[1], { still: m[2], ...(m[3] ? { loop: m[3] } : {}) })
  } catch { /* no library: shorts have no pictures */ }
  return out
}

function toShort(pack, pics, sensitive) {
  if (!pack || !pack.id || !pack.title || sensitive.has(pack.id)) return null
  const steps = beats(pack.explain)
  if (steps.map((x) => x.say).join(' ').split(' ').length < cfg.shorts.minWords) return null
  const quiz = quizOf(pack)
  if (!quiz) return null
  const op = (pack.explain || []).flatMap((s) => s.draw || []).find((o) => o && o.op === 'image' && o.render && pics.has(o.render))
  const area = pack.area || 'General Knowledge'
  return {
    id: pack.id, title: clean(pack.title), area, theme: themeOf(area), levels: pack.levels || [],
    reviewed: pack.status === 'reviewed', steps, facts: (pack.facts || []).map(clean).filter(Boolean).slice(0, 3),
    picture: op ? pics.get(op.render) : null, quiz,
  }
}

let cache = null

function load(root = path.join(ROOT, 'packs')) {
  if (cache && cache.root === root) return cache
  const pics = renders()
  const sensitive = sensitiveIds()
  const list = []
  const walk = (dir) => {
    let entries = []
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const f of entries) {
      const p = path.join(dir, f.name)
      if (f.isDirectory()) walk(p)
      else if (f.name.endsWith('.json')) {
        try { const s = toShort(JSON.parse(fs.readFileSync(p, 'utf8')), pics, sensitive); if (s) list.push(s) } catch { /* a broken pack is skipped */ }
      }
    }
  }
  walk(root)
  cache = { root, list, byId: new Map(list.map((s) => [s.id, s])) }
  return cache
}

// The same, without holding up the server: files are read and parsed a few at a time, with
// a pause between batches, so other requests are answered while 4,000 packs load (a cold
// disk can take seconds). Everything that serves a request uses this one.
let loading = null
function ready(root = path.join(ROOT, 'packs')) {
  if (cache && cache.root === root) return Promise.resolve(cache)
  if (loading) return loading
  loading = (async () => {
    const pics = renders()
    const sensitive = sensitiveIds()
    const files = []
    const walk = async (dir) => {
      let entries = []
      try { entries = await fs.promises.readdir(dir, { withFileTypes: true }) } catch { return }
      for (const f of entries) {
        const p = path.join(dir, f.name)
        if (f.isDirectory()) await walk(p)
        else if (f.name.endsWith('.json')) files.push(p)
      }
    }
    await walk(root)
    files.sort()
    const list = []
    for (let i = 0; i < files.length; i += 40) {
      const texts = await Promise.all(files.slice(i, i + 40).map((p) => fs.promises.readFile(p, 'utf8').catch(() => null)))
      for (const text of texts) {
        if (!text) continue
        try { const short = toShort(JSON.parse(text), pics, sensitive); if (short) list.push(short) } catch { /* a broken pack is skipped */ }
      }
      await new Promise((r) => setImmediate(r))
    }
    cache = { root, list, byId: new Map(list.map((x) => [x.id, x])) }
    return cache
  })().finally(() => { loading = null })
  return loading
}

const reload = () => { cache = null }

// The shorts a learner of this age band may see.
function forBand(band) {
  const levels = new Set(levelsFor(band))
  const young = band !== 'teen' && band !== 'adult'
  return load().list.filter((s) => s.levels.some((l) => levels.has(l)) && !(young && NOT_FOR_CHILD.has(s.area)))
}

module.exports = { load, ready, reload, forBand, levelsFor, themeOf, THEMES, THEME_KEYS, toShort, beats, quizOf, NOT_FOR_CHILD }
