// Player cards (G-506): the only thing one learner sees of another.
//   ensureCard(email, name)   -> the learner's card (made on first use)
//   updateCard(email, patch)  -> nickname, avatar and the learner's own switches
//   publicView(card, opts)    -> { id, nick: { a, n, text }, avatar, name? }; never an email
const crypto = require('crypto')
const PlayerCard = require('../../models/social/PlayerCard')
const cfg = require('../../config/social')
const { SocialError, lower } = require('./guard')

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const nickText = (a, n) => `${cap(a)} ${cap(n)}`

// "Aanya Rao" -> "Aanya". An email-like or empty name gives ''.
function firstNameOf(name) {
  const first = String(name || '').trim().split(/\s+/)[0] || ''
  return /@/.test(first) ? '' : first.slice(0, 30)
}

function newCode() {
  const abc = cfg.friends.codeAlphabet
  const bytes = crypto.randomBytes(cfg.friends.codeLength)
  let out = ''
  for (let i = 0; i < cfg.friends.codeLength; i++) out += abc[bytes[i] % abc.length]
  return out
}

const pick = (list) => list[crypto.randomInt(list.length)]

async function ensureCard(email, name = '') {
  const e = lower(email)
  const found = await PlayerCard.findOne({ email: e })
  if (found) {
    // The account's first name can arrive later (a Google sign-in after a managed one).
    if (!found.firstName && firstNameOf(name)) { found.firstName = firstNameOf(name); await found.save() }
    return found
  }
  for (let i = 0; i < 6; i++) {
    try {
      const nickN = pick(cfg.NICK_N)
      return await PlayerCard.create({ email: e, nickA: pick(cfg.NICK_A), nickN, avatar: cfg.AVATARS.includes(nickN) ? nickN : pick(cfg.AVATARS), firstName: firstNameOf(name), code: newCode() })
    } catch (err) {
      if (err?.code !== 11000) throw err
      const again = await PlayerCard.findOne({ email: e }) // made by a parallel request
      if (again) return again
    }
  }
  throw new SocialError(500, 'Could not make a player card. Please try again.')
}

async function updateCard(email, patch = {}) {
  const card = await ensureCard(email)
  if (patch.nickA !== undefined) { if (!cfg.NICK_A.includes(patch.nickA)) throw new SocialError(400, 'Pick a first word from the list'); card.nickA = patch.nickA }
  if (patch.nickN !== undefined) { if (!cfg.NICK_N.includes(patch.nickN)) throw new SocialError(400, 'Pick a second word from the list'); card.nickN = patch.nickN }
  if (patch.avatar !== undefined) { if (!cfg.AVATARS.includes(patch.avatar)) throw new SocialError(400, 'Pick a picture from the list'); card.avatar = patch.avatar }
  for (const k of ['friends', 'matches', 'mystery']) {
    if (patch[k] === undefined) continue
    if (typeof patch[k] !== 'boolean') throw new SocialError(400, `${k} must be true or false`)
    card[k] = patch[k]
  }
  await card.save()
  return card
}

// What another learner may see. `name: true` adds the first name (friends and team-mates,
// who know each other); strangers get the nickname and picture only.
function publicView(card, { name = false } = {}) {
  if (!card) return { id: null, nick: { a: 'kind', n: 'fox', text: 'A learner' }, avatar: 'star' }
  return {
    id: String(card._id),
    nick: { a: card.nickA, n: card.nickN, text: nickText(card.nickA, card.nickN) },
    avatar: card.avatar,
    ...(name && card.firstName ? { name: card.firstName } : {}),
  }
}

// Cards for many learners at once: Map(email -> card).
async function cardsFor(emails) {
  const list = [...new Set((emails || []).map(lower).filter(Boolean))]
  if (!list.length) return new Map()
  const cards = await PlayerCard.find({ email: { $in: list } })
  return new Map(cards.map((c) => [c.email, c]))
}

module.exports = { ensureCard, updateCard, publicView, cardsFor, firstNameOf, nickText, newCode }
