// Friends (G-506). Added with a friend code or from the learner's own class; there is no
// search for other children. Both learners have to agree, and for a young child with a
// grown-up linked, that grown-up says yes too (unless they turned that off).
//
//   ask(me, { code | cardId })  -> ask to be friends (or accept, when they already asked me)
//   accept / decline / remove
//   list(email)                 -> { friends, incoming, outgoing, awaiting }
//   suggestions(email)          -> class-mates who also play together (first name + initial)
//   forAdult(learnerEmail)      -> what a grown-up sees; approveFor / removeFor
const Friendship = require('../../models/social/Friendship')
const PlayerCard = require('../../models/social/PlayerCard')
const Student = require('../../models/admin/Student')
const Batch = require('../../models/admin/Batch')
const cfg = require('../../config/social')
const { notify } = require('../../utils/notify')
const { firstNameInitial } = require('../../utils/minimise')
const { standing, SocialError, lower } = require('./guard')
const { ensureCard, publicView, cardsFor } = require('./cards')

const DAY = 86400000
const pairOf = (x, y) => (x < y ? [x, y] : [y, x])
const otherOf = (f, me) => (f.a === me ? f.b : f.a)

async function activeFriendEmails(email) {
  const e = lower(email)
  const rows = await Friendship.find({ emails: e, status: 'active' }).select('a b').lean()
  return rows.map((f) => otherOf(f, e))
}

async function areFriends(x, y) {
  const [a, b] = pairOf(lower(x), lower(y))
  return Boolean(await Friendship.exists({ a, b, status: 'active' }))
}

// Tell the grown-ups of a learner that a friend is waiting for their OK.
async function askAdults(st, friendCard) {
  if (!st.parentIds.length) return
  const who = friendCard.firstName || publicView(friendCard).nick.text
  await notify(st.parentIds.map((id) => ({ role: 'parent', id })), {
    kind: 'link_request',
    title: `${who} would like to be your child's friend on Learnigo`,
    body: 'Friends can play the same round and send each other preset cheers. There is no chat. You decide.',
    link: '/parent-dashboard?tab=together',
  })
}

// Both learners agreed: friends at once, or waiting for the grown-ups who asked to approve.
async function settle(f, stA, stB, cards) {
  const awaiting = [stA, stB].filter((s) => s.needsAdultOk).map((s) => s.email)
  if (!awaiting.length) {
    f.status = 'active'; f.since = new Date(); f.awaiting = []; f.expiresAt = null
  } else {
    f.status = 'awaiting_adult'; f.awaiting = awaiting; f.expiresAt = new Date(Date.now() + cfg.friends.requestTtlDays * DAY)
  }
  await f.save()
  if (awaiting.length) {
    for (const s of [stA, stB]) if (s.needsAdultOk) await askAdults(s, cards.get(otherOf(f, s.email)))
  }
  return f
}

async function ask(meEmail, { code, cardId } = {}, name = '') {
  const me = lower(meEmail)
  const myCard = await ensureCard(me, name)
  let theirs = null
  if (code) theirs = await PlayerCard.findOne({ code: String(code).trim().toUpperCase().replace(/[^A-Z0-9]/g, '') })
  else if (cardId && /^[a-f0-9]{24}$/i.test(String(cardId))) {
    // By card: only someone from my own class (suggestions), never an id from anywhere else.
    const mates = await classmateEmails(me)
    theirs = await PlayerCard.findOne({ _id: cardId, email: { $in: mates } })
  }
  // The same answer for "no such code" and "that learner is not taking friends": a code tells nothing.
  const none = new SocialError(404, 'That friend code did not match anyone. Check it with your friend.', 'NO_MATCH')
  if (!theirs) throw none
  if (theirs.email === me) throw new SocialError(400, 'That is your own code. Share it with a friend!', 'OWN_CODE')
  const [mine, their] = await Promise.all([standing(me, myCard), standing(theirs.email, theirs)])
  if (!mine.friends) throw new SocialError(403, 'Friends are switched off for you. Ask a grown-up if you would like them on.', 'FRIENDS_OFF')
  if (!their.friends) throw none

  const [a, b] = pairOf(me, theirs.email)
  const cards = new Map([[me, myCard], [theirs.email, theirs]])
  const existing = await Friendship.findOne({ a, b })
  if (existing) {
    if (existing.status === 'pending' && existing.requestedBy !== me) return settle(existing, mine, their, cards) // they asked first: this is a yes
    return existing
  }
  const [count, open] = await Promise.all([
    Friendship.countDocuments({ emails: me, status: 'active' }),
    Friendship.countDocuments({ requestedBy: me, status: 'pending' }),
  ])
  if (count >= cfg.friends.max) throw new SocialError(409, `You can have up to ${cfg.friends.max} friends.`, 'FRIENDS_FULL')
  if (open >= cfg.friends.max) throw new SocialError(429, 'You have many requests waiting. Wait for your friends to answer.', 'TOO_MANY')
  try {
    return await Friendship.create({ a, b, emails: [a, b], requestedBy: me, status: 'pending', expiresAt: new Date(Date.now() + cfg.friends.requestTtlDays * DAY) })
  } catch (err) {
    if (err?.code === 11000) return Friendship.findOne({ a, b })
    throw err
  }
}

async function mine(meEmail, id) {
  const me = lower(meEmail)
  if (!/^[a-f0-9]{24}$/i.test(String(id))) throw new SocialError(404, 'Not found')
  const f = await Friendship.findOne({ _id: id, emails: me })
  if (!f) throw new SocialError(404, 'Not found')
  return f
}

async function accept(meEmail, id) {
  const me = lower(meEmail)
  const f = await mine(me, id)
  if (f.status !== 'pending' || f.requestedBy === me) return f
  const other = otherOf(f, me)
  const cards = await cardsFor([me, other])
  const [stMe, stOther] = await Promise.all([standing(me, cards.get(me)), standing(other, cards.get(other))])
  if (!stMe.friends) throw new SocialError(403, 'Friends are switched off for you. Ask a grown-up if you would like them on.', 'FRIENDS_OFF')
  if (!stOther.friends) { await f.deleteOne(); throw new SocialError(404, 'Not found') }
  return settle(f, stMe, stOther, cards)
}

// Decline a request, cancel my own, or stop being friends: the row simply goes.
async function remove(meEmail, id) {
  const f = await mine(meEmail, id)
  await f.deleteOne()
  return { removed: true }
}

async function list(meEmail) {
  const me = lower(meEmail)
  const rows = await Friendship.find({ emails: me }).sort({ since: -1, createdAt: -1 }).lean()
  const cards = await cardsFor(rows.map((f) => otherOf(f, me)))
  // `id` is the friendship (to accept or remove it); `cardId` is the friend (to play or cheer).
  const row = (f) => { const pv = publicView(cards.get(otherOf(f, me)), { name: true }); return { ...pv, cardId: pv.id, id: String(f._id), since: f.since || null } }
  return {
    friends: rows.filter((f) => f.status === 'active').map(row),
    incoming: rows.filter((f) => f.status === 'pending' && f.requestedBy !== me).map(row),
    outgoing: rows.filter((f) => f.status === 'pending' && f.requestedBy === me).map(row),
    // Both said yes; a grown-up still has to. `mine` = it is my grown-up we are waiting for.
    awaiting: rows.filter((f) => f.status === 'awaiting_adult').map((f) => ({ ...row(f), mine: (f.awaiting || []).includes(me) })),
  }
}

// Emails of the learners in my own active groups (never returned to a client).
async function classmateEmails(meEmail) {
  const me = lower(meEmail)
  const students = await Student.find({ email: me, status: 'active' }).select('_id').lean()
  if (!students.length) return []
  const batches = await Batch.find({ studentIds: { $in: students.map((s) => s._id) }, status: 'active', archivedAt: null }).select('studentIds').lean()
  const ids = [...new Set(batches.flatMap((b) => b.studentIds.map(String)))]
  const mates = await Student.find({ _id: { $in: ids }, status: 'active' }).select('email name').lean()
  return [...new Set(mates.map((s) => lower(s.email)).filter((e) => e && e !== me))]
}

// Class-mates who already have a player card and take friends, as "Aanya R." (they share
// a classroom, so a first name and an initial tells nothing new).
async function suggestions(meEmail) {
  const me = lower(meEmail)
  const emails = await classmateEmails(me)
  if (!emails.length) return []
  const [cards, known, students] = await Promise.all([
    PlayerCard.find({ email: { $in: emails }, friends: true }),
    Friendship.find({ emails: me }).select('a b').lean(),
    Student.find({ email: { $in: emails }, status: 'active' }).select('email name').lean(),
  ])
  const already = new Set(known.map((f) => otherOf(f, me)))
  const names = new Map(students.map((s) => [lower(s.email), s.name]))
  return cards.filter((c) => !already.has(c.email))
    .map((c) => ({ ...publicView(c), name: firstNameInitial(names.get(c.email) || c.firstName) }))
    .sort((x, y) => x.name.localeCompare(y.name)).slice(0, 40)
}

// ── For a grown-up ───────────────────────────────────────────────────────────

async function forAdult(learnerEmail) {
  const e = lower(learnerEmail)
  const rows = await Friendship.find({ emails: e }).sort({ since: -1, createdAt: -1 }).lean()
  const cards = await cardsFor(rows.map((f) => otherOf(f, e)))
  const row = (f) => ({ ...publicView(cards.get(otherOf(f, e)), { name: true }), id: String(f._id), since: f.since || null, askedAt: f.createdAt })
  return {
    friends: rows.filter((f) => f.status === 'active').map(row),
    waitingForYou: rows.filter((f) => f.status === 'awaiting_adult' && (f.awaiting || []).includes(e)).map(row),
    waitingForOthers: rows.filter((f) => f.status === 'pending' || (f.status === 'awaiting_adult' && !(f.awaiting || []).includes(e))).map(row),
  }
}

async function adultRow(learnerEmail, id) {
  const e = lower(learnerEmail)
  if (!/^[a-f0-9]{24}$/i.test(String(id))) throw new SocialError(404, 'Not found')
  const f = await Friendship.findOne({ _id: id, emails: e })
  if (!f) throw new SocialError(404, 'Not found')
  return f
}

async function approveFor(learnerEmail, id, by) {
  const e = lower(learnerEmail)
  const f = await adultRow(e, id)
  if (f.status !== 'awaiting_adult' || !(f.awaiting || []).includes(e)) return f
  f.awaiting = f.awaiting.filter((x) => x !== e)
  f.approvals.push({ learner: e, byRole: by.role, byId: String(by.id) })
  if (!f.awaiting.length) { f.status = 'active'; f.since = new Date(); f.expiresAt = null }
  await f.save()
  return f
}

async function removeFor(learnerEmail, id) {
  const f = await adultRow(learnerEmail, id)
  await f.deleteOne()
  return { removed: true }
}

module.exports = { ask, accept, remove, list, suggestions, forAdult, approveFor, removeFor, activeFriendEmails, areFriends, classmateEmails, otherOf }
