// Growth achievements: badges for learning, never for time, speed, streaks or
// rankings (config.achievements; the thresholds are starting hypotheses). Pure.
//
// Each badge is awarded once, from a logged answer, with the evidence behind it
// (numbers only) stored next to it in StudentAchievement. Keys:
// learn.achievement.<id>.name | .desc | .evidence (English texts below).
// "Brilliant comeback" is the brief's name: it praises the comeback (a process),
// not the person.
const cfg = require('../../config/learning')
const { render } = require('./feedback')

const A = cfg.achievements

// desc: {{count}} is the badge's threshold from config (params.count), so a changed threshold needs no new text.
const GROWTH = [
  { id: 'growth_first_discovery', icon: '🔭', name: 'First discovery', desc: 'Answer your first everyday discovery question.', count: 1, evidence: 'Answered a discovery question on {{date}}.' },
  { id: 'growth_concept_explorer', icon: '🧭', name: 'Concept explorer', desc: 'Try {{count}} different skills.', count: A.conceptExplorer, evidence: 'Tried {{skills}} different skills.' },
  { id: 'growth_comeback', icon: '🌱', name: 'Brilliant comeback', desc: 'Get a skill right after it was tricky.', count: A.comebackMisses, evidence: '{{skillName}} came right after {{misses}} tries that did not work out.' },
  { id: 'growth_three_mastered', icon: '🏅', name: 'Three concepts mastered', desc: 'Master {{count}} skills, each shown on different questions and remembered on a later day.', count: A.threeMastered, evidence: 'Mastered {{mastered}} skills.' },
  { id: 'growth_curious', icon: '💡', name: 'Curious thinker', desc: 'Answer discovery questions on {{count}} different days.', count: A.curious, evidence: 'Answered discovery questions on {{days}} different days.' },
  { id: 'growth_problem_solver', icon: '⭐', name: 'Problem-solving star', desc: 'Solve {{count}} questions that ask you to use or explain an idea, right first time without a hint.', count: A.problemSolver, evidence: 'Solved {{solved}} questions that ask you to use or explain an idea, right first time.' },
  { id: 'growth_review_champion', icon: '🔁', name: 'Review champion', desc: 'Remember {{count}} skills when they come back for review.', count: A.reviewChampion, evidence: 'Remembered {{reviews}} reviews correctly.' },
]
const BY_ID = new Map(GROWTH.map((g) => [g.id, g]))
const GROWTH_IDS = GROWTH.map((g) => g.id)

/**
 * Which badges are earned now (and not before).
 * stats: { discoveries, discoveryDays, firstDiscoveryDate, skillsTried, mastered, solved, reviewsRight,
 *          comeback: { skill, skillName, misses } | null }
 * earned: Set of badge ids already held
 * -> [{ id, params }]
 */
function newlyEarned(stats, earned = new Set()) {
  const out = []
  const add = (id, params) => { if (!earned.has(id)) out.push({ id, params }) }
  if ((stats.discoveries || 0) >= 1 && stats.firstDiscoveryDate) add('growth_first_discovery', { date: stats.firstDiscoveryDate })
  if ((stats.skillsTried || 0) >= A.conceptExplorer) add('growth_concept_explorer', { skills: stats.skillsTried })
  if (stats.comeback && stats.comeback.misses >= A.comebackMisses) add('growth_comeback', { skill: stats.comeback.skill, skillName: stats.comeback.skillName, misses: stats.comeback.misses })
  if ((stats.mastered || 0) >= A.threeMastered) add('growth_three_mastered', { mastered: stats.mastered })
  if ((stats.discoveryDays || 0) >= A.curious) add('growth_curious', { days: stats.discoveryDays, discoveries: stats.discoveries || 0 })
  if ((stats.solved || 0) >= A.problemSolver) add('growth_problem_solver', { solved: stats.solved })
  if ((stats.reviewsRight || 0) >= A.reviewChampion) add('growth_review_champion', { reviews: stats.reviewsRight })
  return out
}

// What the learn reply and the achievements list show for one badge.
function badgeView(id, params = {}) {
  const g = BY_ID.get(id)
  if (!g) return null
  return {
    id, icon: g.icon,
    key: `learn.achievement.${id}.name`, params, text: g.name,
    desc: { key: `learn.achievement.${id}.desc`, params: { count: g.count }, text: render(g.desc, { count: g.count }) },
    evidence: { key: `learn.achievement.${id}.evidence`, params, text: render(g.evidence, params) },
  }
}

// The entries of the achievements list (dashboardController.ACHIEVEMENTS shape).
const listEntries = () => GROWTH.map((g) => ({ id: g.id, name: g.name, icon: g.icon, description: render(g.desc, { count: g.count }), category: 'growth', xp: 0 }))

module.exports = { GROWTH, GROWTH_IDS, newlyEarned, badgeView, listEntries }
