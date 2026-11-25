// The trophy room (G-516): everything a learner has won by learning with others.
//   grant(email, award) -> stored once (the same source never gives the same prize twice)
//   list(email) ; markSeen(email)
const SocialAward = require('../../models/social/SocialAward')

const lower = (s) => String(s || '').trim().toLowerCase()

async function grant(email, { kind, award = '', sourceType, sourceId, title = '', evidence = {}, at = new Date() }) {
  const key = { email: lower(email), kind, sourceType, sourceId: String(sourceId) }
  await SocialAward.updateOne(key, { $setOnInsert: { ...key, award, title, evidence, earnedAt: at } }, { upsert: true })
}

const view = (a) => ({ id: String(a._id), kind: a.kind, award: a.award || null, source: a.sourceType, sourceId: a.sourceId, title: a.title, evidence: a.evidence || {}, earnedAt: a.earnedAt, isNew: !a.seenAt })

async function list(email, { limit = 100 } = {}) {
  const rows = await SocialAward.find({ email: lower(email) }).sort({ earnedAt: -1 }).limit(limit).lean()
  const counts = {}
  for (const r of rows) counts[r.kind] = (counts[r.kind] || 0) + 1
  return { awards: rows.map(view), counts, total: rows.length }
}

async function markSeen(email) {
  await SocialAward.updateMany({ email: lower(email), seenAt: null }, { $set: { seenAt: new Date() } })
}

module.exports = { grant, list, markSeen, view }
