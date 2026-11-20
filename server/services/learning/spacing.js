// Spaced repetition with Leitner boxes. Box 0 = learning (due now), boxes 1..5
// come back after leitnerDays[box] days. Pure.
const cfg = require('../../config/learning')

const DAY = 86400000

function dueAfter(box, now, days = cfg.leitnerDays) {
  const b = Math.max(0, Math.min(days.length - 1, box | 0))
  return new Date(now.getTime() + days[b] * DAY)
}

const isDue = (skill, now) => !!skill && skill.due != null && new Date(skill.due).getTime() <= now.getTime()

// A review the learner owes: a skill already learned once (box >= 1) whose time has come.
const isReviewDue = (skill, now) => !!skill && (skill.box || 0) >= 1 && isDue(skill, now)

// The next box and due date after one graded outcome.
//   independent correct: up one box, but only when the skill was due (so five
//     right answers in one sitting do not jump five boxes; spacing is the point);
//   assisted correct / close: same box, rescheduled from now;
//   incorrect: back to box 0 (due now), unless the skill is being parked.
function schedule({ box = 0, due = null }, outcome, now, { park = false, days = cfg.leitnerDays } = {}) {
  const max = days.length - 1
  if (park) return { box: 1, due: new Date(now.getTime() + cfg.parkDays * DAY) }
  const wasDue = due == null || new Date(due).getTime() <= now.getTime()
  if (outcome === 'independent') {
    if (!wasDue) return { box, due: due ? new Date(due) : dueAfter(box, now, days) }
    const nb = Math.min(max, box + 1)
    return { box: nb, due: dueAfter(nb, now, days) }
  }
  if (outcome === 'assisted' || outcome === 'close') return { box, due: dueAfter(box, now, days) }
  return { box: 0, due: dueAfter(0, now, days) }
}

module.exports = { schedule, dueAfter, isDue, isReviewDue, DAY }
