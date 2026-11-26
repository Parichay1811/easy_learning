// Camera game badges (content v5): earned from real rounds only, each once, with the numbers
// behind it. Never for time, speed or days in a row: for trying games, climbing a level, and
// keeping going after a round that did not work out (a slow-but-right round is a cleared level).
const ARSession = require('../models/ARSession')
const StudentAchievement = require('../models/StudentAchievement')

const BADGES = [
  { id: 'game_first', icon: '🎮', name: 'First camera game', description: 'Finish your first camera game.' },
  { id: 'game_explorer', icon: '🧭', name: 'Game explorer', description: 'Play 5 different camera games.' },
  { id: 'game_all_rounder', icon: '🗺️', name: 'All-round mover', description: 'Play camera games from 4 different groups.' },
  { id: 'game_level_3', icon: '🪜', name: 'Climbing up', description: 'Clear level 3 in a camera game.' },
  { id: 'game_level_5', icon: '🏔️', name: 'Top level', description: 'Clear level 5 in a camera game.' },
  { id: 'game_kept_going', icon: '🌱', name: 'Kept going', description: 'Clear a level after a round that did not work out.' },
]

const grant = (email, id, evidence) => StudentAchievement.updateOne(
  { email, achievementId: id },
  { $setOnInsert: { email, achievementId: id, earnedAt: new Date(), evidence } },
  { upsert: true },
)

// doc: the round just saved (gameId, group, level, levelCleared, outcome).
async function check(email, doc) {
  if (!doc || doc.outcome === 'abandoned' || doc.outcome === 'error') return []
  const e = String(email).toLowerCase()
  const done = { email: e, outcome: { $nin: ['abandoned', 'error'] } }
  const [games, groups, top] = await Promise.all([
    ARSession.distinct('gameId', done),
    ARSession.distinct('group', { ...done, group: { $ne: null } }),
    ARSession.find({ ...done, levelCleared: true }).sort({ level: -1 }).limit(1).select('level').lean(),
  ])
  const best = top[0]?.level || 0
  const out = []
  const add = async (id, evidence) => { const r = await grant(e, id, evidence); if (r.upsertedCount) out.push(id) }
  if (games.length >= 1) await add('game_first', { game: doc.gameId })
  if (games.length >= 5) await add('game_explorer', { games: games.length })
  if (groups.length >= 4) await add('game_all_rounder', { groups: groups.length })
  if (best >= 3) await add('game_level_3', { level: best })
  if (best >= 5) await add('game_level_5', { level: best })
  if (doc.levelCleared && Number.isFinite(doc.level)) {
    const before = await ARSession.exists({ ...done, gameId: doc.gameId, level: doc.level, levelCleared: { $ne: true }, startedAt: { $lt: doc.startedAt } })
    if (before) await add('game_kept_going', { game: doc.gameId, level: doc.level })
  }
  return out
}

const listEntries = () => BADGES.map((b) => ({ id: b.id, name: b.name, icon: b.icon, description: b.description, category: 'games', xp: 0 }))

module.exports = { BADGES, check, listEntries }
