// The metrics dictionary (FND-041): one definition of every number the
// dashboards show, so Parent, Teacher, Admin and Super Admin always agree.
// `GET /api/meta/metrics` serves this to the client for tooltips.
const MASTERY_MIN_ANSWERS = 5

const METRICS = {
  activeTime: { label: 'Active time', unit: 'min', help: 'Time spent learning. Idle gaps are not counted.' },
  activeDays: { label: 'Active days', unit: 'days', help: 'Days with at least one answered question or 3 minutes of learning.' },
  streak: { label: 'Streak', unit: 'days', help: 'Days in a row with learning, in the learner\'s own timezone.' },
  accuracy: { label: 'Accuracy', unit: '%', help: 'Correct answers divided by answers given.' },
  speed: { label: 'Speed', unit: 'sec', help: 'Average time to answer a question.' },
  mastery: { label: 'Mastery', unit: 'level', help: `Not started (under ${MASTERY_MIN_ANSWERS} answers), Learning (below 50 %), Practising (50 to 79 %), Mastered (80 % and over).` },
  growth: { label: 'Growth', unit: 'pts', help: 'Change compared with the previous period of the same length.' },
  consistency: { label: 'Consistency', unit: '%', help: 'Active days divided by days in the period.' },
  engagement: { label: 'Engagement', unit: '0-100', help: 'A mix of consistency (50 %), time against a 20 min a day goal (30 %) and answers given (20 %).' },
  atRisk: { label: 'Needs a nudge', unit: 'flag', help: 'No learning for 7 days, or accuracy down more than 15 points over two weeks.' },
}

const MODULES = ['listen', 'read', 'write', 'speak']
const SUBJECTS = ['english', 'maths', 'science']

const pct = (num, den) => (den > 0 ? Math.round((num / den) * 100) : null)

function masteryLevel(answered, accuracy) {
  if (!answered || answered < MASTERY_MIN_ANSWERS || accuracy == null) return 'not_started'
  if (accuracy >= 80) return 'mastered'
  if (accuracy >= 50) return 'practising'
  return 'learning'
}

// 0-100 from consistency, time against 20 min a day and answers (about 10 a day is full marks).
function engagementScore({ activeDays, days, minutes, answered }) {
  if (!days) return null
  const consistency = Math.min(1, activeDays / days)
  const time = Math.min(1, minutes / (20 * days))
  const work = Math.min(1, answered / (10 * days))
  return Math.round((consistency * 0.5 + time * 0.3 + work * 0.2) * 100)
}

module.exports = { METRICS, MODULES, SUBJECTS, MASTERY_MIN_ANSWERS, pct, masteryLevel, engagementScore }
