// Learning together, for the learner (/api/social; docs/learning/GAME-ROADMAP.md Phase 5).
// Identity is always the signed-in learner (req.user.email from dashboardAuth); another
// learner is only ever named by their player card's id, never by an email.
const cfg = require('../config/social')
const PlayerCard = require('../models/social/PlayerCard')
const { standing, SocialError } = require('../services/social/guard')
const cards = require('../services/social/cards')
const friends = require('../services/social/friends')
const matches = require('../services/social/matches')
const teams = require('../services/social/teams')
const cheers = require('../services/social/cheers')
const awards = require('../services/social/awards')
const { jar } = require('../services/social/jar')
const { validTz } = require('../analytics/record')

const emailOf = (req) => String(req.user?.email || '').toLowerCase()
const tzOf = (req) => validTz(req.get?.('x-timezone') || 'UTC')
const LANG_RE = /^[a-z]{2}(-[a-z]{2})?$/

const handle = (fn) => async (req, res) => {
  try {
    if (!emailOf(req)) return res.status(401).json({ success: false, message: 'Unauthorized' })
    await fn(req, res)
  } catch (err) {
    if (err instanceof SocialError || err.status) return res.status(err.status).json({ success: false, message: err.message, ...(err.code ? { code: err.code } : {}) })
    if (err?.name === 'ValidationError' || err?.name === 'CastError') return res.status(400).json({ success: false, message: err.message })
    console.error('social route error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// My own card: the only place a friend code is ever returned.
const myCard = (card, st) => ({
  ...cards.publicView(card, { name: true }), code: card.code,
  switches: { friends: card.friends, matches: card.matches, mystery: card.mystery },
  // What is possible right now, after the grown-ups' switches.
  can: { friends: st.friends, matches: st.matches, mystery: st.mystery, shorts: st.shorts },
  // Why something is off, so the page can say it kindly: 'adult' | 'me' | null.
  off: {
    friends: !st.adult.friends ? 'adult' : card.friends === false ? 'me' : null,
    matches: !st.adult.matches ? 'adult' : card.matches === false ? 'me' : null,
    mystery: st.supervised && !st.adult.mystery ? 'adult' : card.mystery !== true ? 'me' : null,
  },
  needsAdultOk: st.needsAdultOk, supervised: st.supervised,
})

// GET /api/social/home: everything the Together page opens with, in one call.
const home = handle(async (req, res) => {
  const me = emailOf(req)
  const card = await cards.ensureCard(me, req.user.name)
  const st = await standing(me, card)
  const [fl, suggested, ml, tl, j, unseen, trophies] = await Promise.all([
    friends.list(me), st.friends ? friends.suggestions(me) : [], matches.list(me), teams.forLearner(me),
    jar(me), cheers.unseen(me), awards.list(me, { limit: 60 }),
  ])
  res.json({ success: true, me: myCard(card, st), friends: fl, suggested, matches: ml, teams: tl, jar: j, cheers: unseen, trophies })
})

// GET /api/social/summary: what is waiting, for the shortcuts on Home and the Today hub
// (one tap to a waiting round, the team, a friend request). Small, and makes nothing.
const summary = handle(async (req, res) => {
  const me = emailOf(req)
  const [ml, tl, fl, unseen] = await Promise.all([matches.list(me), teams.forLearner(me), friends.list(me), cheers.unseen(me)])
  const running = tl.find((m) => m.status === 'active')
  const mine = running?.teams.find((t) => t.key === running.myTeam)
  const turn = ml.yourTurn[0]
  res.json({
    success: true,
    round: turn ? { id: turn.id, kind: turn.kind, with: turn.with, more: ml.yourTurn.length - 1 } : null,
    requests: fl.incoming.length,
    cheers: unseen.length,
    team: mine ? { title: running.title, kind: running.kind, key: mine.key, emoji: mine.emoji, color: mine.color, stars: mine.stars, goal: mine.goal, left: Math.max(0, mine.goal - mine.stars), reached: mine.reached, single: running.teams.length === 1 } : null,
    ceremony: tl.some((m) => m.ceremony?.isNew),
    friends: fl.friends.length,
  })
})

const options = handle(async (req, res) => {
  res.json({ success: true, nickA: cfg.NICK_A, nickN: cfg.NICK_N, avatars: cfg.AVATARS, stickers: cfg.CHEER_STICKERS, lines: cfg.CHEER_LINES, matchModules: cfg.match.modules, cheersPerDay: cfg.cheers.perDay })
})

const getMe = handle(async (req, res) => {
  const card = await cards.ensureCard(emailOf(req), req.user.name)
  res.json({ success: true, me: myCard(card, await standing(emailOf(req), card)) })
})

const patchMe = handle(async (req, res) => {
  const card = await cards.updateCard(emailOf(req), req.body || {})
  res.json({ success: true, me: myCard(card, await standing(emailOf(req), card)) })
})

// ── Friends ──────────────────────────────────────────────────────────────────
const listFriends = handle(async (req, res) => {
  const me = emailOf(req)
  res.json({ success: true, ...(await friends.list(me)), suggested: await friends.suggestions(me) })
})
const askFriend = handle(async (req, res) => {
  const f = await friends.ask(emailOf(req), { code: req.body?.code, cardId: req.body?.cardId }, req.user.name)
  res.status(201).json({ success: true, status: f.status, ...(await friends.list(emailOf(req))) })
})
const acceptFriend = handle(async (req, res) => {
  const f = await friends.accept(emailOf(req), req.params.id)
  res.json({ success: true, status: f.status, ...(await friends.list(emailOf(req))) })
})
const removeFriend = handle(async (req, res) => {
  await friends.remove(emailOf(req), req.params.id)
  res.json({ success: true, ...(await friends.list(emailOf(req))) })
})

// POST /report { cardId }: "I don't want to see this nickname again" (G-518). Kept on my card only.
const report = handle(async (req, res) => {
  const id = String(req.body?.cardId || '')
  if (!/^[a-f0-9]{24}$/i.test(id)) return res.status(404).json({ success: false, message: 'Not found' })
  await cards.ensureCard(emailOf(req), req.user.name)
  await PlayerCard.updateOne({ email: emailOf(req) }, { $addToSet: { blocked: id } })
  res.json({ success: true })
})

// ── Rounds together ──────────────────────────────────────────────────────────
const listMatches = handle(async (req, res) => res.json({ success: true, ...(await matches.list(emailOf(req))) }))
const createMatch = handle(async (req, res) => {
  const b = req.body || {}
  const m = await matches.create(emailOf(req), { friendId: b.friendId, kind: b.kind, subject: String(b.subject || '').toLowerCase(), module: String(b.module || '').toLowerCase() }, req.user.name)
  res.status(201).json({ success: true, match: await matches.get(emailOf(req), m._id) })
})
const mysteryMatch = handle(async (req, res) => {
  const b = req.body || {}
  const m = await matches.mystery(emailOf(req), { subject: String(b.subject || '').toLowerCase(), module: String(b.module || '').toLowerCase() }, req.user.name)
  res.status(201).json({ success: true, match: await matches.get(emailOf(req), m._id) })
})
const getMatch = handle(async (req, res) => res.json({ success: true, match: await matches.get(emailOf(req), req.params.id) }))
const playMatch = handle(async (req, res) => {
  const lang = String(req.query.lang || '').toLowerCase()
  if (lang && !LANG_RE.test(lang)) return res.status(400).json({ success: false, message: 'lang must be a language code like "de"' })
  res.json({ success: true, ...(await matches.play(emailOf(req), req.params.id, lang)) })
})
const submitMatch = handle(async (req, res) => res.json({ success: true, match: await matches.submit(emailOf(req), req.params.id, req.body || {}) }))

// ── Cheers, teams, trophies, the jar ─────────────────────────────────────────
const sendCheer = handle(async (req, res) => {
  const b = req.body || {}
  res.status(201).json({ success: true, ...(await cheers.send(emailOf(req), { toCardId: b.to, sticker: b.sticker, line: b.line }, tzOf(req))) })
})
const seenCheers = handle(async (req, res) => res.json({ success: true, seen: await cheers.markSeen(emailOf(req), req.body?.ids) }))
const myTeams = handle(async (req, res) => res.json({ success: true, teams: await teams.forLearner(emailOf(req)) }))
const myTrophies = handle(async (req, res) => res.json({ success: true, ...(await awards.list(emailOf(req))) }))
const seenTrophies = handle(async (req, res) => { await awards.markSeen(emailOf(req)); res.json({ success: true }) })
const myJar = handle(async (req, res) => res.json({ success: true, jar: await jar(emailOf(req)) }))

module.exports = {
  home, summary, options, getMe, patchMe, listFriends, askFriend, acceptFriend, removeFriend, report,
  listMatches, createMatch, mysteryMatch, getMatch, playMatch, submitMatch,
  sendCheer, seenCheers, myTeams, myTrophies, seenTrophies, myJar, handle, emailOf,
}
