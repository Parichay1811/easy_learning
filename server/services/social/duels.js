// Camera game duels (content v5): "challenge a friend" on one camera game, each at their own level.
//
//   create(me, { friendId, gameId })     with a friend (friends and playing together must be on)
//   recordRound(email, { duelId, gameId, stars, level, outcome })   from a finished camera round
//   list(me) ; get(me, id)
//
// Fair by design: the game's own adaptive journey gives each player their own level, and only
// the first finished round counts (stars 0-3). Everybody wins something true.
const GameDuel = require('../../models/social/GameDuel')
const PlayerCard = require('../../models/social/PlayerCard')
const cfg = require('../../config/social')
const { standing, SocialError, lower } = require('./guard')
const { ensureCard, publicView, cardsFor } = require('./cards')
const { areFriends } = require('./friends')
const awards = require('./awards')

const DAY = 86400000
const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v))
const GAME_ID = /^[a-z0-9][a-z0-9-]{1,48}$/

async function create(meEmail, { friendId, gameId } = {}, name = '') {
  const me = lower(meEmail)
  if (!GAME_ID.test(String(gameId || ''))) throw new SocialError(400, 'Pick a camera game')
  if (!isId(friendId)) throw new SocialError(404, 'Friend not found')
  const [myCard, friend] = await Promise.all([ensureCard(me, name), PlayerCard.findById(friendId)])
  if (!friend || friend.email === me || !(await areFriends(me, friend.email))) throw new SocialError(404, 'Friend not found')
  const [mine, theirs] = await Promise.all([standing(me, myCard), standing(friend.email, friend)])
  if (!mine.matches) throw new SocialError(403, 'Playing together is switched off for you. Ask a grown-up if you would like it on.', 'MATCHES_OFF')
  if (!theirs.matches) throw new SocialError(409, 'Your friend is not playing together right now.', 'FRIEND_MATCHES_OFF')
  const open = await GameDuel.countDocuments({ createdBy: me, status: 'open' })
  if (open >= cfg.duel.maxOpen) throw new SocialError(429, 'You have many challenges waiting. Play those first!', 'TOO_MANY')
  return GameDuel.create({
    gameId, emails: [me, friend.email], createdBy: me, players: [{ email: me }, { email: friend.email }],
    expiresAt: new Date(Date.now() + cfg.duel.openDays * DAY),
  })
}

async function settle(d) {
  const [a, b] = d.players
  const base = { sourceType: 'duel', sourceId: String(d._id), title: d.gameId, at: d.doneAt }
  const draw = a.stars === b.stars
  for (const [p, o] of [[a, b], [b, a]]) {
    const won = draw || p.stars > o.stars
    await awards.grant(p.email, { ...base, kind: won ? 'game_ribbon' : 'game_brave', evidence: { mine: p.stars, of: cfg.duel.maxStars, draw, game: d.gameId } })
    await awards.grant(p.email, { ...base, kind: 'award', award: 'fair_play', evidence: { game: d.gameId } })
  }
}

/**
 * A finished camera round that was played for a duel (the game page passes ?duel=<id>).
 * Only the player's first finished round of that game counts. Never throws for a stale or
 * foreign duel id: the round itself is always kept by the caller.
 */
async function recordRound(email, { duelId, gameId, stars, level, outcome } = {}) {
  if (!isId(duelId) || outcome === 'abandoned' || outcome === 'error') return null
  const me = lower(email)
  const d = await GameDuel.findOne({ _id: duelId, emails: me, status: 'open', gameId })
  if (!d) return null
  const p = d.players.find((x) => x.email === me)
  if (!p || p.playedAt) return null
  p.stars = Math.max(0, Math.min(cfg.duel.maxStars, Math.round(Number(stars) || 0)))
  p.level = Number.isFinite(Number(level)) ? Number(level) : null
  p.playedAt = new Date()
  const both = d.players.length === 2 && d.players.every((x) => x.playedAt)
  if (both) { d.status = 'done'; d.doneAt = new Date(); d.expiresAt = new Date(Date.now() + 180 * DAY) }
  await d.save()
  if (both) await settle(d)
  return d
}

// One duel as a learner sees it (the same shape as a round in matches.view, kind 'game').
function view(d, me, cards) {
  const mine = d.players.find((p) => p.email === me) || null
  const other = d.players.find((p) => p.email !== me) || null
  const played = Boolean(mine?.playedAt)
  const done = d.status === 'done'
  const out = {
    id: String(d._id), kind: 'game', gameId: d.gameId, size: cfg.duel.maxStars, createdAt: d.createdAt, byMe: d.createdBy === me,
    status: done ? 'done' : !played ? 'your_turn' : 'waiting',
    you: publicView(cards.get(me)), with: other ? publicView(cards.get(other.email), { name: true }) : null,
    me: played ? { stars: mine.stars, total: cfg.duel.maxStars, level: mine.level } : null,
  }
  if (done && other) {
    const draw = mine.stars === other.stars
    out.them = { stars: other.stars, total: cfg.duel.maxStars }
    out.result = { draw, prize: draw || mine.stars > other.stars ? 'game_ribbon' : 'game_brave', theirPrize: draw || other.stars > mine.stars ? 'game_ribbon' : 'game_brave' }
  }
  return out
}

async function list(meEmail) {
  const me = lower(meEmail)
  const rows = await GameDuel.find({ emails: me }).sort({ createdAt: -1 }).limit(30)
  const cards = await cardsFor(rows.flatMap((d) => d.emails))
  return rows.map((d) => view(d, me, cards))
}

async function get(meEmail, id) {
  const me = lower(meEmail)
  if (!isId(id)) throw new SocialError(404, 'Challenge not found')
  const d = await GameDuel.findOne({ _id: id, emails: me })
  if (!d) throw new SocialError(404, 'Challenge not found')
  return view(d, me, await cardsFor(d.emails))
}

module.exports = { create, recordRound, list, get, view }
