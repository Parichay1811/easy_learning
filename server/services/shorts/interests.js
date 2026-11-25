// "What they love" for parents and teachers (G-530): a summary of one learner's Shorts
// interests, and of a whole group. Numbers and titles of lessons only.
//
//   forLearner(email) -> { hasData, picks, top, themes, areas, liked, totals, weeks, trend }
//   forGroup(emails)  -> { learners, watching, themes: [{ theme, learners, done }] }
const ShortsInterest = require('../../models/social/ShortsInterest')
const { THEME_KEYS } = require('./catalog')
const { weekKey } = require('./feed')

const lower = (s) => String(s || '').trim().toLowerCase()

// A theme's pull for one learner: finished shorts and hearts count, a pick counts too.
const pull = (c, picked) => (c?.done || 0) + (c?.likes || 0) * 2 + (picked ? 2 : 0)

function summarise(doc) {
  const picks = doc?.picks || []
  const themes = THEME_KEYS.map((t) => {
    const c = doc?.themes?.get?.(t) || doc?.themes?.[t] || {}
    return { theme: t, views: c.views || 0, done: c.done || 0, likes: c.likes || 0, right: c.right || 0, picked: picks.includes(t), score: pull(c, picks.includes(t)) }
  }).filter((t) => t.views || t.picked).sort((a, b) => b.score - a.score || b.views - a.views)
  const total = themes.reduce((s, t) => s + t.score, 0)
  for (const t of themes) t.share = total ? Math.round((t.score / total) * 100) / 100 : 0
  const areaEntries = doc?.areas ? [...(doc.areas.entries?.() || Object.entries(doc.areas))] : []
  const areas = areaEntries.map(([area, c]) => ({ area, views: c.views || 0, done: c.done || 0, likes: c.likes || 0 }))
    .filter((a) => a.done || a.likes).sort((a, b) => (b.done + b.likes * 2) - (a.done + a.likes * 2)).slice(0, 6)
  // The last 6 weeks of shorts watched to the end, oldest first.
  const weeks = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const k = weekKey(new Date(now.getTime() - i * 7 * 86400000))
    weeks.push({ week: k, done: doc?.weeks?.get?.(k) || doc?.weeks?.[k] || 0 })
  }
  const totals = { views: doc?.totals?.views || 0, done: doc?.totals?.done || 0, likes: doc?.totals?.likes || 0 }
  return {
    hasData: totals.views > 0 || picks.length > 0,
    picks, top: themes.filter((t) => t.score > 0).slice(0, 3).map((t) => t.theme), themes, areas,
    liked: [...(doc?.liked || [])].reverse().slice(0, 10).map((x) => ({ id: x.id, title: x.title, theme: x.theme, at: x.at })),
    totals, weeks,
    // Finished this week against last week: "more", "less" or "same" (never a judgement).
    trend: weeks[5].done > weeks[4].done ? 'more' : weeks[5].done < weeks[4].done ? 'less' : 'same',
  }
}

async function forLearner(email) {
  return summarise(await ShortsInterest.findOne({ email: lower(email) }))
}

// A group: how many learners have each theme among their top three ("this class loves space").
async function forGroup(emails) {
  const list = [...new Set((emails || []).map(lower).filter(Boolean))]
  const docs = list.length ? await ShortsInterest.find({ email: { $in: list } }) : []
  const count = new Map(THEME_KEYS.map((t) => [t, { theme: t, learners: 0, done: 0 }]))
  let watching = 0
  for (const d of docs) {
    const s = summarise(d)
    if (s.totals.views > 0) watching += 1
    for (const t of s.top) count.get(t).learners += 1
    for (const t of s.themes) count.get(t.theme).done += t.done
  }
  return {
    learners: list.length, watching,
    themes: [...count.values()].filter((t) => t.learners || t.done).sort((a, b) => b.learners - a.learners || b.done - a.done),
  }
}

module.exports = { forLearner, forGroup, summarise }
