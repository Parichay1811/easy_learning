// Learning together, for a parent (G-530, G-531): their child's friends, rounds, teams,
// cheers and prizes, the switches, and what the child likes to watch. Mounted behind
// requireOwnChild, so req.child is the caller's own verified child.
const friends = require('../services/social/friends')
const matches = require('../services/social/matches')
const teams = require('../services/social/teams')
const cheers = require('../services/social/cheers')
const awards = require('../services/social/awards')
const interests = require('../services/shorts/interests')
const { strictest } = require('../services/social/guard')
const { verifiedRows } = require('../services/parentFamily')
const { audit } = require('../utils/audit')

const handle = (fn) => async (req, res) => {
  try { await fn(req, res) } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message, ...(err.code ? { code: err.code } : {}) })
    console.error('parent together error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// GET /children/:id/together
const together = handle(async (req, res) => {
  const email = req.child.email
  const since = new Date(Date.now() - 30 * 86400000)
  const [f, m, t, c, a, rows] = await Promise.all([
    friends.forAdult(email), matches.forAdult(email), teams.forAdult(email), cheers.countsFor(email, since), awards.list(email, { limit: 40 }), verifiedRows(email),
  ])
  const mine = req.child.together?.toObject?.() || req.child.together || {}
  res.json({
    success: true,
    // My own switches, and what applies once every grown-up's choice is counted (the strictest).
    switches: { friends: mine.friends !== false, friendApproval: mine.friendApproval !== false, matches: mine.matches !== false, mystery: mine.mystery === true, shorts: mine.shorts !== false },
    inEffect: strictest(rows),
    friends: f, matches: m, teams: t, cheers: c, trophies: a,
  })
})

// POST /children/:id/together/friends/:fid/approve
const approveFriend = handle(async (req, res) => {
  const f = await friends.approveFor(req.child.email, req.params.fid, { role: 'parent', id: req.parent.id })
  await audit(req, 'learner.friend_approve', { targetType: 'learner', targetId: String(req.child._id), meta: { friendship: String(f._id) } })
  res.json({ success: true, status: f.status, friends: await friends.forAdult(req.child.email) })
})

// DELETE /children/:id/together/friends/:fid  (say no to a request, or end a friendship)
const removeFriend = handle(async (req, res) => {
  await friends.removeFor(req.child.email, req.params.fid)
  await audit(req, 'learner.friend_remove', { targetType: 'learner', targetId: String(req.child._id), meta: { friendship: String(req.params.fid) } })
  res.json({ success: true, friends: await friends.forAdult(req.child.email) })
})

// GET /children/:id/interests
const childInterests = handle(async (req, res) => {
  res.json({ success: true, interests: await interests.forLearner(req.child.email) })
})

module.exports = { together, approveFriend, removeFriend, childInterests }
