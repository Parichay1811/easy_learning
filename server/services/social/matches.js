// The same round for two learners, each in their own time (G-508, G-515).
//
//   create(me, { friendId, kind, subject, module })  buddy | friendly, with a friend
//   mystery(me, { subject, module })                 someone new at my level (nickname only)
//   play(me, id, lang)                               the questions, until I have played
//   submit(me, id, results)                          my stars; when both have played, the result
//   list(me) ; get(me, id)
//
// Everybody wins: both learners keep every star they earned. A buddy round shows one shared
// total. A friendly or mystery match gives the higher score a ribbon and the other a "brave
// challenger" prize; a draw gives both the ribbon. There is no clock in it anywhere.
const BuddyMatch = require('../../models/social/BuddyMatch')
const PlayerCard = require('../../models/social/PlayerCard')
const cfg = require('../../config/social')
const learn = require('../../config/learning')
const store = require('../learning/store')
const { servedLevel } = require('../learning/round')
const { createRng } = require('../learning/rng')
const { normalise } = require('../learning/levelPolicy')
const { standing, SocialError, lower } = require('./guard')
const { ensureCard, publicView, cardsFor } = require('./cards')
const { areFriends } = require('./friends')
const awards = require('./awards')

const DAY = 86400000
const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v))

async function levelOf(email, subject) {
  const p = await store.getProfile(email)
  return normalise(p.levels[subject]).level
}

// Questions both learners can do: checkable ones at the lower of the two levels, spread over
// different skills. `pool` is services/learning/store.loadPool's compact metadata.
function pickItems(pool, level, size, seed) {
  const usable = pool.filter((q) => q.graded && q.qaStatus !== 'needs_review' && q._id)
  if (!usable.length) return { items: [], level: null }
  const levels = [...new Set(usable.map((q) => q.level).filter(Number.isInteger))].sort((a, b) => a - b)
  const L = servedLevel(level, levels)
  const rng = createRng(seed)
  const at = rng.shuffle(usable.filter((q) => L == null || q.level === L))
  const below = rng.shuffle(usable.filter((q) => L != null && Number.isInteger(q.level) && q.level < L))
  const rest = rng.shuffle(usable.filter((q) => L != null && (!Number.isInteger(q.level) || q.level > L)))
  const picked = []
  const skills = new Set()
  // First pass: one item per skill, so the round is varied; then fill up.
  for (const q of at) { if (picked.length < size && !skills.has(q.skill)) { picked.push(q); skills.add(q.skill) } }
  for (const q of [...at, ...below, ...rest]) { if (picked.length < size && !picked.includes(q)) picked.push(q) }
  return { items: picked.map((q) => ({ q: q.id, oid: q._id })), level: L ?? level }
}

function checkPlace({ subject, module }) {
  if (!learn.SUBJECTS.includes(subject)) throw new SocialError(400, `subject must be one of ${learn.SUBJECTS.join(', ')}`)
  if (!cfg.match.modules.includes(module)) throw new SocialError(400, `module must be one of ${cfg.match.modules.join(', ')}`)
}

async function create(meEmail, { friendId, kind = 'buddy', subject, module } = {}, name = '') {
  const me = lower(meEmail)
  if (!['buddy', 'friendly'].includes(kind)) throw new SocialError(400, 'kind must be buddy or friendly')
  checkPlace({ subject, module })
  if (!isId(friendId)) throw new SocialError(404, 'Friend not found')
  const [myCard, friend] = await Promise.all([ensureCard(me, name), PlayerCard.findById(friendId)])
  if (!friend || friend.email === me || !(await areFriends(me, friend.email))) throw new SocialError(404, 'Friend not found')
  const [mine, theirs] = await Promise.all([standing(me, myCard), standing(friend.email, friend)])
  if (!mine.matches) throw new SocialError(403, 'Playing together is switched off for you. Ask a grown-up if you would like it on.', 'MATCHES_OFF')
  if (!theirs.matches) throw new SocialError(409, 'Your friend is not playing together right now.', 'FRIEND_MATCHES_OFF')
  const open = await BuddyMatch.countDocuments({ createdBy: me, status: 'open' })
  if (open >= cfg.match.maxOpen) throw new SocialError(429, 'You have many rounds waiting. Play those first!', 'TOO_MANY')

  const [la, lb, pool] = await Promise.all([levelOf(me, subject), levelOf(friend.email, subject), store.loadPool(me, subject, module)])
  const { items, level } = pickItems(pool, Math.min(la, lb), cfg.match.size, `${me}|${friend.email}|${Date.now()}`)
  if (items.length < cfg.match.minSize) throw new SocialError(409, 'There are not enough questions for that one yet. Try another subject.', 'NO_ITEMS')
  const m = await BuddyMatch.create({
    kind, subject, module, level, items, emails: [me, friend.email], createdBy: me,
    players: [{ email: me }, { email: friend.email }], expiresAt: new Date(Date.now() + cfg.match.openDays * DAY),
  })
  return m
}

// Someone new: play a round another learner at my level already played (or leave mine for the next).
async function mystery(meEmail, { subject, module } = {}, name = '') {
  const me = lower(meEmail)
  checkPlace({ subject, module })
  const myCard = await ensureCard(me, name)
  const st = await standing(me, myCard)
  if (!st.mystery) throw new SocialError(403, 'Playing with someone new is switched off. You can still play with friends.', 'MYSTERY_OFF')
  const level = await levelOf(me, subject)
  // One I already joined and have not played yet.
  const mine = await BuddyMatch.findOne({ kind: 'mystery', status: 'open', emails: me, subject, module, players: { $elemMatch: { email: me, playedAt: null } } })
  if (mine) return mine
  const gap = cfg.match.mysteryLevelGap
  // Never someone whose nickname I reported, and never a friend (friends play buddy rounds).
  const blocked = myCard.blocked?.length ? (await PlayerCard.find({ _id: { $in: myCard.blocked.filter(isId) } }).select('email').lean()).map((c) => c.email) : []
  const waiting = await BuddyMatch.findOneAndUpdate(
    { kind: 'mystery', status: 'open', subject, module, 'emails.1': { $exists: false }, emails: { $ne: me }, createdBy: { $nin: blocked }, level: { $gte: level - gap, $lte: level + gap }, players: { $not: { $elemMatch: { playedAt: null } } } },
    { $push: { emails: me, players: { email: me } } },
    { sort: { createdAt: 1 }, new: true },
  )
  if (waiting) return waiting
  const open = await BuddyMatch.countDocuments({ createdBy: me, status: 'open', kind: 'mystery' })
  if (open >= 3) throw new SocialError(429, 'You have rounds waiting for someone new. They will be played soon!', 'TOO_MANY')
  const pool = await store.loadPool(me, subject, module)
  const picked = pickItems(pool, level, cfg.match.size, `${me}|mystery|${Date.now()}`)
  if (picked.items.length < cfg.match.minSize) throw new SocialError(409, 'There are not enough questions for that one yet. Try another subject.', 'NO_ITEMS')
  return BuddyMatch.create({
    kind: 'mystery', subject, module, level: picked.level, items: picked.items, emails: [me], createdBy: me,
    players: [{ email: me }], expiresAt: new Date(Date.now() + cfg.match.openDays * DAY),
  })
}

async function mineById(meEmail, id) {
  if (!isId(id)) throw new SocialError(404, 'Round not found')
  const m = await BuddyMatch.findOne({ _id: id, emails: lower(meEmail) })
  if (!m) throw new SocialError(404, 'Round not found')
  return m
}

// The questions, in the round's order, as a round's items (no adaptive support: it is a shared round).
async function play(meEmail, id, lang) {
  const me = lower(meEmail)
  const m = await mineById(me, id)
  const p = m.players.find((x) => x.email === me)
  if (p?.playedAt) throw new SocialError(409, 'You have played this round.', 'PLAYED')
  const st = await standing(me, await ensureCard(me))
  if (!st.matches) throw new SocialError(403, 'Playing together is switched off for you. Ask a grown-up if you would like it on.', 'MATCHES_OFF')
  const picks = m.items.map((x) => ({ _id: x.oid, id: x.q }))
  const full = await store.fullQuestions(m.subject, m.module, picks, lang)
  const items = full.map(({ question }) => ({ ...question, support: { step: 0, strategy: 'words' }, why: 'together' }))
  return { id: String(m._id), kind: m.kind, subject: m.subject, module: m.module, items }
}

// Prizes when both have played. Both always get one.
async function settle(m) {
  const [a, b] = m.players
  const title = `${m.subject}:${m.module}`
  const base = { sourceType: 'match', sourceId: String(m._id), title, at: m.doneAt }
  if (m.kind === 'buddy') {
    const evidence = { together: a.stars + b.stars, of: a.total + b.total }
    await Promise.all([a, b].map((p) => awards.grant(p.email, { ...base, kind: 'together', evidence: { ...evidence, mine: p.stars } })))
    return
  }
  const draw = a.stars === b.stars
  for (const [p, o] of [[a, b], [b, a]]) {
    const won = draw || p.stars > o.stars
    await awards.grant(p.email, { ...base, kind: won ? 'ribbon' : 'brave', evidence: { mine: p.stars, of: p.total, firstTry: p.firstTry, draw } })
  }
}

async function submit(meEmail, id, { results } = {}) {
  const me = lower(meEmail)
  const m = await mineById(me, id)
  const p = m.players.find((x) => x.email === me)
  if (!p) throw new SocialError(404, 'Round not found')
  if (p.playedAt) return view(m, me, await cardsFor(m.emails))
  if (!Array.isArray(results)) throw new SocialError(400, 'results must be a list')
  const ids = new Set(m.items.map((x) => String(x.q)))
  const seen = new Set()
  let stars = 0
  let firstTry = 0
  for (const r of results) {
    const q = String(r?.id ?? '')
    if (!ids.has(q) || seen.has(q)) continue // only this round's questions, each once
    seen.add(q)
    if (r.correct === true) { stars += 1; if (r.firstTry === true) firstTry += 1 }
  }
  p.stars = stars; p.total = m.items.length; p.firstTry = firstTry; p.playedAt = new Date(); p.seenResult = true
  const both = m.players.length === 2 && m.players.every((x) => x.playedAt)
  if (both) { m.status = 'done'; m.doneAt = new Date(); m.expiresAt = new Date(Date.now() + 180 * DAY) }
  await m.save()
  if (both) await settle(m)
  return view(m, me, await cardsFor(m.emails))
}

// One round as a learner sees it. The other learner's stars stay hidden until I have played
// (nothing to chase), and a mystery partner is a nickname and a picture, nothing else.
function view(m, me, cards) {
  const mine = m.players.find((p) => p.email === me) || null
  const other = m.players.find((p) => p.email !== me) || null
  const played = Boolean(mine?.playedAt)
  const done = m.status === 'done'
  const out = {
    id: String(m._id), kind: m.kind, subject: m.subject, module: m.module, size: m.items.length,
    createdAt: m.createdAt, byMe: m.createdBy === me, status: done ? 'done' : !played ? 'your_turn' : 'waiting',
    you: publicView(cards.get(me)),
    with: other ? publicView(cards.get(other.email), { name: m.kind !== 'mystery' }) : null,
    me: played ? { stars: mine.stars, total: mine.total, firstTry: mine.firstTry } : null,
  }
  if (done && other) {
    out.them = { stars: other.stars, total: other.total }
    if (m.kind === 'buddy') out.result = { together: mine.stars + other.stars, of: mine.total + other.total, prize: 'together' }
    else {
      const draw = mine.stars === other.stars
      out.result = { draw, prize: draw || mine.stars > other.stars ? 'ribbon' : 'brave', theirPrize: draw || other.stars > mine.stars ? 'ribbon' : 'brave' }
    }
  }
  return out
}

async function list(meEmail) {
  const me = lower(meEmail)
  const rows = await BuddyMatch.find({ emails: me }).sort({ createdAt: -1 }).limit(40)
  const cards = await cardsFor(rows.flatMap((m) => m.emails))
  const all = rows.map((m) => view(m, me, cards))
  return {
    yourTurn: all.filter((m) => m.status === 'your_turn'),
    waiting: all.filter((m) => m.status === 'waiting'),
    done: all.filter((m) => m.status === 'done').slice(0, 15),
  }
}

async function get(meEmail, id) {
  const me = lower(meEmail)
  const m = await mineById(me, id)
  return view(m, me, await cardsFor(m.emails))
}

// For a grown-up: what was played with whom, and how it went (no answers).
async function forAdult(learnerEmail, { limit = 20 } = {}) {
  const e = lower(learnerEmail)
  const rows = await BuddyMatch.find({ emails: e }).sort({ createdAt: -1 }).limit(limit)
  const cards = await cardsFor(rows.flatMap((m) => m.emails))
  return rows.map((m) => view(m, e, cards))
}

module.exports = { create, mystery, play, submit, list, get, forAdult, pickItems, view }
