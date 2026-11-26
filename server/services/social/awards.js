// The trophy room (G-516): everything a learner has won by learning with others.
//   grant(email, award) -> stored once (the same source never gives the same prize twice)
//   list(email) ; markSeen(email)
const SocialAward = require('../../models/social/SocialAward')

const lower = (s) => String(s || '').trim().toLowerCase()

async function grant(email, { kind, award = '', sourceType, sourceId, title = '', evidence = {}, at = new Date() }) {
  const key = { email: lower(email), kind, sourceType, sourceId: String(sourceId) }
  const r = await SocialAward.updateOne(key, { $setOnInsert: { ...key, award, title, evidence, earnedAt: at } }, { upsert: true })
  if (r.upsertedCount && sourceType !== 'milestone') await milestones(email, { at })
}

// Milestones of learning with others (config MILESTONES): granted once each, the moment the
// real count is reached. Nothing is ever taken away.
async function milestones(email, { at = new Date() } = {}) {
  const e = lower(email)
  const cfg = require('../../config/social')
  const have = new Set((await SocialAward.find({ email: e, sourceType: 'milestone' }).select('sourceId').lean()).map((r) => r.sourceId))
  for (const m of cfg.MILESTONES) {
    if (have.has(m.key)) continue
    const n = m.cheers
      ? await require('../../models/social/PeerCheer').countDocuments({ from: e })
      : await SocialAward.countDocuments({ email: e, kind: { $in: m.kinds } })
    if (n >= m.count) await grant(e, { kind: 'award', award: m.key, sourceType: 'milestone', sourceId: m.key, evidence: { count: n }, at })
  }
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

module.exports = { grant, milestones, list, markSeen, view }
