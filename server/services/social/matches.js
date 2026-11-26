// The same round for two learners, each in their own time (G-508, G-515).
//
//   create(me, { friendId, kind, subject, module })  buddy | friendly, with a friend
//   mystery(me, { subject, module })                 someone new at my level (nickname only)
//   play(me, id, lang)                               the questions, until I have played
//   submit(me, id, results)                          my stars; when both have played, the result
//   list(me) ; get(me, id)
//
// Everybody wins: both learners keep every star they earned. A buddy round shows one shared
// total. A friendly or mystery match is a fair duel (content v5): each learner answers their own
// questions at their own level, so a stronger player is not handed easy questions and a newer one
// is not handed hard ones. The higher score gets a ribbon and the other a "brave challenger"
// prize; a draw gives both the ribbon; and both get one true award for how they played
// (sharp first tries, or seeing the match through). There is no clock in it anywhere.
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
async function adultishOf(email) {
  const p = await store.getProfile(email)
  return p.ageBand === 'teen' || p.ageBand === 'adult'
}

// Questions that suit playing with someone else (content v5): checkable now (graded, verified),
// quick to answer on any device (no open writing, no microphone, no transfer-stage projects),
// and never the silly young-child items when a teen or adult is playing.
const SOCIAL_WIDGETS = new Set(['tap_mcq', 'true_false', 'multi_select', 'drag_to_blank', 'drag_order', 'tap_sequence', 'match_pairs', 'sort_bins', 'letter_bank', 'typed_short'])
const suitsTogether = (q, { adultish = false } = {}) => q.graded && q.qaStatus !== 'needs_review' && q._id
  && (!q.interaction || SOCIAL_WIDGETS.has(q.interaction)) && !(Number.isInteger(q.stage) && q.stage >= 5) && !(adultish && q.ageBand === 'young')

// Questions for one level, spread over different skills. `pool` is services/learning/store.loadPool's
// compact metadata. A buddy round uses the lower of the two levels (one shared round); a fair duel
// calls this once per player at their own level.
function pickItems(pool, level, size, seed, { adultish = false } = {}) {
  const usable = pool.filter((q) => suitsTogether(q, { adultish }))
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

  const [la, lb, pool, aa, ab] = await Promise.all([levelOf(me, subject), levelOf(friend.email, subject), store.loadPool(me, subject, module), adultishOf(me), adultishOf(friend.email)])
  const adultish = aa || ab
  const seed = `${me}|${friend.email}|${Date.now()}`
  const { items, level } = pickItems(pool, Math.min(la, lb), cfg.match.size, seed, { adultish })
  if (items.length < cfg.match.minSize) throw new SocialError(409, 'There are not enough questions for that one yet. Try another subject.', 'NO_ITEMS')
  const players = [{ email: me }, { email: friend.email }]
  if (kind === 'friendly') {
    // A fair duel: each at their own level, the same number of questions.
    const mine = pickItems(pool, la, items.length, `${seed}|a`, { adultish })
    const theirs = pickItems(pool, lb, items.length, `${seed}|b`, { adultish })
    const n = Math.min(mine.items.length, theirs.items.length)
    if (n >= cfg.match.minSize) {
      players[0] = { email: me, own: mine.items.slice(0, n), level: mine.level }
      players[1] = { email: friend.email, own: theirs.items.slice(0, n), level: theirs.level }
    }
  }
  const m = await BuddyMatch.create({
    kind, subject, module, level, items, emails: [me, friend.email], createdBy: me,
    players, expiresAt: new Date(Date.now() + cfg.match.openDays * DAY),
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
  const pool = await store.loadPool(me, subject, module)
  const adultish = await adultishOf(me)
  if (waiting) {
    // A fair duel: my own questions at my level, as many as the round has.
    const mine = pickItems(pool, level, waiting.items.length, `${me}|mystery|${waiting._id}`, { adultish })
    if (mine.items.length === waiting.items.length) {
      const p = waiting.players.find((x) => x.email === me)
      p.own = mine.items
      p.level = mine.level
      await waiting.save()
    }
    return waiting
  }
  const open = await BuddyMatch.countDocuments({ createdBy: me, status: 'open', kind: 'mystery' })
  if (open >= 3) throw new SocialError(429, 'You have rounds waiting for someone new. They will be played soon!', 'TOO_MANY')
  const picked = pickItems(pool, level, cfg.match.size, `${me}|mystery|${Date.now()}`, { adultish })
  if (picked.items.length < cfg.match.minSize) throw new SocialError(409, 'There are not enough questions for that one yet. Try another subject.', 'NO_ITEMS')
  return BuddyMatch.create({
    kind: 'mystery', subject, module, level: picked.level, items: picked.items, emails: [me], createdBy: me,
    players: [{ email: me, own: picked.items, level: picked.level }], expiresAt: new Date(Date.now() + cfg.match.openDays * DAY),
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
  const picks = (p?.own?.length ? p.own : m.items).map((x) => ({ _id: x.oid, id: x.q }))
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
    // And one true award for how they played: sharp first tries, or seeing the match through.
    const sharp = p.firstTry > 0 && p.firstTry >= Math.ceil(p.total / 2)
    await awards.grant(p.email, { ...base, kind: 'award', award: sharp ? 'sharp_first_try' : 'fair_play', evidence: sharp ? { noHint: p.firstTry } : { of: p.total } })
  }
}

async function submit(meEmail, id, { results } = {}) {
  const me = lower(meEmail)
  const m = await mineById(me, id)
  const p = m.players.find((x) => x.email === me)
  if (!p) throw new SocialError(404, 'Round not found')
  if (p.playedAt) return view(m, me, await cardsFor(m.emails))
  if (!Array.isArray(results)) throw new SocialError(400, 'results must be a list')
  const ids = new Set((p.own?.length ? p.own : m.items).map((x) => String(x.q)))
  const seen = new Set()
  let stars = 0
  let firstTry = 0
  for (const r of results) {
    const q = String(r?.id ?? '')
    if (!ids.has(q) || seen.has(q)) continue // only this round's questions, each once
    seen.add(q)
    if (r.correct === true) { stars += 1; if (r.firstTry === true) firstTry += 1 }
  }
  p.stars = stars; p.total = (p.own?.length ? p.own : m.items).length; p.firstTry = firstTry; p.playedAt = new Date(); p.seenResult = true
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
  // Camera game duels sit in the same lists (kind "game"), newest first.
  const games = await require('./duels').list(me)
  const all = [...rows.map((m) => view(m, me, cards)), ...games].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
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

module.exports = { create, mystery, play, submit, list, get, forAdult, pickItems, suitsTogether, view }
