// The friends' star jar: every star a learner and their friends earn this week goes into
// one jar. It shows the total and the next mark, never who added how much, and when the
// jar passes a mark every friend who looks gets that sticker.
const cfg = require('../../config/social')
const { lower } = require('./guard')
const { activeFriendEmails } = require('./friends')
const { starsBy } = require('./stars')
const awards = require('./awards')

// Monday 00:00 UTC of this week.
function weekStart(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d
}

async function jar(email, now = new Date()) {
  const me = lower(email)
  const friends = await activeFriendEmails(me)
  const from = weekStart(now)
  const per = await starsBy([me, ...friends], from, now, { capPerDay: cfg.team.starsPerDayCap })
  let total = 0
  for (const r of per.values()) total += r.stars
  const marks = cfg.jar.milestones
  const week = from.toISOString().slice(0, 10)
  // A jar is something shared: it only fills (and gives stickers) once there is a friend.
  if (friends.length) {
    for (const m of marks.filter((x) => total >= x)) {
      await awards.grant(me, { kind: 'jar', sourceType: 'jar', sourceId: `${week}:${m}`, title: week, evidence: { stars: m, friends: friends.length } })
    }
  }
  const next = marks.find((x) => total < x) || null
  return { week, friends: friends.length, stars: total, mine: per.get(me)?.stars || 0, marks: marks.map((m) => ({ at: m, reached: total >= m })), next }
}

module.exports = { jar, weekStart }
