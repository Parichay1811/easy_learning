// Cheers between friends and team-mates (G-507): a sticker and a line from fixed lists.
//   send(me, { toCardId, sticker, line }, tz) ; unseen(email) ; markSeen(email, ids)
const PeerCheer = require('../../models/social/PeerCheer')
const PlayerCard = require('../../models/social/PlayerCard')
const TeamMatch = require('../../models/social/TeamMatch')
const cfg = require('../../config/social')
const { todayIn } = require('../../analytics/queries')
const { standing, SocialError, lower } = require('./guard')
const { publicView, cardsFor, ensureCard } = require('./cards')
const { areFriends } = require('./friends')

// Team-mates: in the same team of a match that is running (or ended in the last week).
async function sameTeam(x, y) {
  const since = new Date(Date.now() - 7 * 86400000)
  const rows = await TeamMatch.find({ emails: { $all: [x, y] }, $or: [{ status: 'active' }, { endedAt: { $gte: since } }] }).select('teams.members').lean()
  return rows.some((m) => m.teams.some((t) => t.members.includes(x) && t.members.includes(y)))
}

async function send(meEmail, { toCardId, sticker, line } = {}, tz = 'UTC') {
  const me = lower(meEmail)
  if (!cfg.CHEER_STICKERS.includes(sticker)) throw new SocialError(400, 'Pick a sticker from the list')
  if (!cfg.CHEER_LINES.includes(line)) throw new SocialError(400, 'Pick a line from the list')
  if (!/^[a-f0-9]{24}$/i.test(String(toCardId))) throw new SocialError(404, 'Not found')
  const [to, myCard] = await Promise.all([PlayerCard.findById(toCardId), ensureCard(me)])
  if (!to || to.email === me) throw new SocialError(404, 'Not found')
  const st = await standing(me, myCard)
  if (!st.friends) throw new SocialError(403, 'Cheers are switched off for you.', 'FRIENDS_OFF')
  if (!(await areFriends(me, to.email)) && !(await sameTeam(me, to.email))) throw new SocialError(404, 'Not found')
  const day = todayIn(tz)
  const sent = await PeerCheer.countDocuments({ from: me, day })
  if (sent >= cfg.cheers.perDay) throw new SocialError(429, `You have sent ${cfg.cheers.perDay} cheers today. More tomorrow!`, 'CHEER_LIMIT')
  const row = await PeerCheer.create({ from: me, to: to.email, sticker, line, day })
  // Kind words count too: the "cheer giver" milestone (config MILESTONES).
  await require('./awards').milestones(me)
  return { id: String(row._id), left: cfg.cheers.perDay - sent - 1 }
}

async function unseen(email) {
  const e = lower(email)
  const rows = await PeerCheer.find({ to: e, seenAt: null }).sort({ createdAt: -1 }).limit(cfg.cheers.maxUnseen).lean()
  const cards = await cardsFor(rows.map((r) => r.from))
  return rows.map((r) => ({ id: String(r._id), sticker: r.sticker, line: r.line, from: publicView(cards.get(r.from), { name: true }), at: r.createdAt }))
}

async function markSeen(email, ids) {
  const list = (Array.isArray(ids) ? ids : []).filter((id) => /^[a-f0-9]{24}$/i.test(String(id))).slice(0, 50)
  if (!list.length) return 0
  const r = await PeerCheer.updateMany({ _id: { $in: list }, to: lower(email), seenAt: null }, { $set: { seenAt: new Date() } })
  return r.modifiedCount || 0
}

// For a grown-up: how many cheers, never who said what beyond the fixed sticker and line.
async function countsFor(email, since) {
  const e = lower(email)
  const [given, received] = await Promise.all([
    PeerCheer.countDocuments({ from: e, createdAt: { $gte: since } }),
    PeerCheer.countDocuments({ to: e, createdAt: { $gte: since } }),
  ])
  return { given, received }
}

// Days in the window on which each learner cheered a team-mate (one team-spirit star a day).
async function cheerDays(emails, from, to) {
  const rows = await PeerCheer.aggregate([
    { $match: { from: { $in: emails }, to: { $in: emails }, createdAt: { $gte: from, $lt: to } } },
    { $group: { _id: { from: '$from', day: '$day' }, n: { $sum: 1 } } },
    { $group: { _id: '$_id.from', days: { $sum: 1 }, cheers: { $sum: '$n' } } },
  ])
  return new Map(rows.map((r) => [r._id, { days: r.days, cheers: r.cheers }]))
}

module.exports = { send, unseen, markSeen, countsFor, cheerDays, sameTeam }
