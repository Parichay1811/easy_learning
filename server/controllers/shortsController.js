// Shorts for the learner (/api/shorts; G-520..522).
const feed = require('../services/shorts/feed')
const { handle, emailOf } = require('./socialController')

// GET /feed?limit=&exclude=id,id   the next shorts
const getFeed = handle(async (req, res) => {
  const exclude = String(req.query.exclude || '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 60)
  res.json({ success: true, ...(await feed.feed(emailOf(req), { limit: req.query.limit, exclude })) })
})
// POST /events { id, kind: view|done|like|unlike|quiz, correct? }
const postEvent = handle(async (req, res) => res.json({ success: true, ...(await feed.note(emailOf(req), req.body || {})) }))
// PUT /picks { themes: [] }
const putPicks = handle(async (req, res) => res.json({ success: true, ...(await feed.setPicks(emailOf(req), req.body?.themes)) }))
// GET /liked
const getLiked = handle(async (req, res) => res.json({ success: true, items: await feed.liked(emailOf(req)) }))

module.exports = { getFeed, postEvent, putPicks, getLiked }
