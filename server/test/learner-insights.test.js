// Unit tests for the grown-ups' "At a glance" rules (services/learnerInsights.js), no database:
// rolling periods, the minimum-evidence rule for changes, skill states, and the shape of the
// findings for one learner and for a teacher's group (no ranking, name order, reasons with numbers).
require('./helpers') // no database connections
const test = require('node:test')
const assert = require('node:assert/strict')
const { RULES, periodFor, compareShare, stateOf, buildLearner, buildGroup, tally } = require('../services/learnerInsights')

const NOW = new Date('2026-11-23T18:00:00Z') // a Monday
const P7 = periodFor(7, 'UTC', '2026-11-23')
const day = (date, o = {}) => ({ email: o.email || 'kid@x.test', date, answered: 0, correct: 0, firstTry: 0, hints: 0, minutes: 0, ...o })
const at = (iso) => new Date(`${iso}T15:00:00Z`)
// A skill row the engine would store. mastered: mastery >= 0.85, box >= 2, evidence on two items.
const skill = (o = {}) => ({ email: 'kid@x.test', skill: 'maths.counting', subject: 'maths', name: 'Counting', mastery: 0.5, attempts: 8, correct: 5, box: 0, due: null, lastAt: at('2026-11-22'), misconceptions: [], supportStep: 0, rightItems: ['a', 'b'], ...o })

test('periods are rolling windows ending today, with the same span before', () => {
  assert.deepEqual(periodFor(7, 'UTC', '2026-11-23'), { days: 7, from: '2026-11-17', to: '2026-11-23', prev: { from: '2026-11-10', to: '2026-11-16' }, today: '2026-11-23' })
  assert.equal(periodFor(28, 'UTC', '2026-11-23').from, '2026-10-27')
  assert.equal(periodFor(99, 'UTC', '2026-11-23').days, 7, 'only 7 or 28')
})

test('a change needs enough answers in both periods AND more than the normal ups and downs', () => {
  assert.equal(compareShare({ k: 9, n: 10 }, { k: 2, n: 10 }).status, 'early', 'fewer than 20 answers: too early')
  assert.equal(compareShare({ k: 15, n: 20 }, { k: 14, n: 20 }).status, 'steady', '+5 points is within the noise')
  const up = compareShare({ k: 80, n: 100 }, { k: 60, n: 100 })
  assert.equal(up.status, 'up'); assert.equal(up.diff, 20); assert.equal(up.cur, 80); assert.equal(up.prev, 60)
  // 9 points on 20 answers each is not more than twice the standard error: steady, not "down".
  assert.equal(compareShare({ k: 13, n: 20 }, { k: 15, n: 20 }).status, 'steady')
  assert.equal(compareShare({ k: 50, n: 100 }, { k: 75, n: 100 }).status, 'down')
})

test('skill states: mastered, review due, worth more practice only with enough evidence', () => {
  assert.equal(stateOf(skill({ attempts: 0 }), NOW), 'notStarted')
  assert.equal(stateOf(skill({ mastery: 0.9, box: 3, due: new Date('2026-12-01') }), NOW), 'secure')
  assert.equal(stateOf(skill({ mastery: 0.9, box: 3, due: new Date('2026-11-20') }), NOW), 'review')
  assert.equal(stateOf(skill({ mastery: 0.3, attempts: 4, correct: 1 }), NOW), 'practising', `fewer than ${RULES.minSkillTries} tries: still practising`)
  assert.equal(stateOf(skill({ mastery: 0.3, attempts: 10, correct: 4 }), NOW), 'practise')
  // Mostly right overall and no recent misses or repeated mix-up: still building, not flagged.
  assert.equal(stateOf(skill({ mastery: 0.55, attempts: 10, correct: 8, missesSinceSuccess: 0 }), NOW), 'practising')
  assert.equal(stateOf(skill({ mastery: 0.55, attempts: 10, correct: 8, missesSinceSuccess: 3 }), NOW), 'practise')
})

test('tally counts active days, first-try and answers without a hint', () => {
  const t = tally([day('2026-11-20', { answered: 10, firstTry: 6, hints: 3 }), day('2026-11-21', { minutes: 5 }), day('2026-11-22', { minutes: 1 })])
  assert.deepEqual([t.answered, t.firstTry, t.independent, t.activeDays, t.lastActive], [10, 6, 7, 2, '2026-11-21'])
})

test('one learner: wins, a skill worth practising with its evidence and note, a change, effort', () => {
  const curDays = ['2026-11-17', '2026-11-18', '2026-11-20', '2026-11-21', '2026-11-22'].map((d) => day(d, { answered: 12, firstTry: 10, hints: 1 }))
  const prevDays = ['2026-11-10', '2026-11-12'].map((d) => day(d, { answered: 15, firstTry: 6, hints: 6 }))
  const skills = [
    skill({ skill: 'maths.shapes', name: 'Naming shapes', mastery: 0.92, box: 3, due: new Date('2026-12-02'), masteredAt: at('2026-11-19'), attempts: 12, correct: 11 }),
    skill({ skill: 'maths.compare', name: 'Comparing numbers', mastery: 0.3, attempts: 14, correct: 6, supportStep: 1, missesSinceSuccess: 2,
      misconceptions: [{ text: 'picked the reversed symbol', count: 3, at: at('2026-11-21'), q: 'q1', module: 'read', resolvedAt: null }] }),
  ]
  const notes = new Map([['maths|read|q1', { parentNote: 'Use two piles of coins.', teacherAction: 'Model with a number line.' }]])
  const parent = buildLearner({ name: 'Sam Lee', audience: 'parent', period: P7, curDays, prevDays, trendDays: [...prevDays, ...curDays], skills, notes, now: NOW })
  const kinds = parent.findings.map((f) => f.kind)
  assert.deepEqual(kinds, ['win', 'practice', 'change', 'effort'])
  assert.ok(parent.findings.length >= 3 && parent.findings.length <= 5)
  const [win, practise, change, effort] = parent.findings
  assert.equal(win.key, 'mastered'); assert.deepEqual(win.params.skills, ['Naming shapes'])
  assert.equal(practise.params.skill, 'Comparing numbers')
  assert.equal(practise.next.key, 'home.practise'); assert.equal(practise.next.note, 'Use two piles of coins.')
  assert.ok(practise.evidence.some((e) => e.key === 'mixupCount' && e.params.count === 3), 'parents get the count, not the technical mix-up text')
  assert.ok(!JSON.stringify(parent).includes('reversed symbol'), 'the misconception text is for teachers only')
  assert.equal(change.key, 'firstTryUp'); assert.equal(change.params.from, 40); assert.equal(change.params.to, 83)
  assert.equal(effort.key, 'habit'); assert.equal(effort.params.days, 5)
  assert.equal(parent.measures.secure.now, 1); assert.equal(parent.measures.secure.atStart, 0)
  assert.equal(parent.trend.length, RULES.trendWeeks)

  const teacher = buildLearner({ name: 'Sam', audience: 'teacher', period: P7, curDays, prevDays, skills, notes, now: NOW })
  const tp = teacher.findings.find((f) => f.kind === 'practice')
  assert.equal(tp.next.key, 'class.practise'); assert.equal(tp.next.note, 'Model with a number line.')
  assert.ok(tp.evidence.some((e) => e.key === 'mixupText' && e.params.text === 'picked the reversed symbol'))
})

test('one learner: too early to tell, and a quiet period is not a fault', () => {
  const thin = buildLearner({ name: 'Mia', period: P7, curDays: [day('2026-11-22', { answered: 6, firstTry: 6 })], prevDays: [], now: NOW })
  const early = thin.findings.find((f) => f.kind === 'early')
  assert.ok(early, 'says "too early to tell"'); assert.equal(early.params.need, RULES.minAnswers)
  assert.ok(!thin.findings.some((f) => f.kind === 'change'), 'no change claimed on 6 answers')
  const quiet = buildLearner({ name: 'Mia', period: P7, curDays: [], prevDays: [day('2026-11-12', { answered: 30, firstTry: 20 })], now: NOW })
  const q = quiet.findings.find((f) => f.kind === 'effort')
  assert.equal(q.key, 'quiet'); assert.equal(q.next.key, 'home.restart'); assert.equal(quiet.headline.key, 'quiet')
})

test('a dip right after moving up a level is explained, not flagged as a problem', () => {
  const curDays = [day('2026-11-18', { answered: 40, firstTry: 18 })]
  const prevDays = [day('2026-11-11', { answered: 40, firstTry: 34 })]
  const out = buildLearner({ name: 'Kai', audience: 'teacher', period: P7, curDays, prevDays, decisions: [{ at: at('2026-11-17'), subject: 'maths', from: 2, to: 3 }], now: NOW })
  const c = out.findings.find((f) => f.kind === 'change')
  assert.equal(c.key, 'firstTryDownLevel'); assert.equal(c.next.key, 'class.harder')
  assert.ok(c.evidence.some((e) => e.key === 'levelUp' && e.params.to === 3))
})

test('group: check-ins with reasons, a hard skill with its shared mix-up, wins; never a ranking', () => {
  const students = ['Zoe', 'Ali', 'Mo', 'Bea'].map((n, i) => ({ id: `s${i}`, name: n, email: `${n.toLowerCase()}@x.test` }))
  const days = []
  for (const s of students.slice(0, 3)) for (const d of ['2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21']) days.push(day(d, { email: s.email, answered: 10, firstTry: 7 }))
  days.push(day('2026-11-12', { email: 'bea@x.test', answered: 10, firstTry: 7 }))
  const mix = (q) => [{ text: 'added instead of subtracting', count: 3, at: at('2026-11-20'), q, module: 'read', resolvedAt: null }]
  const skills = [
    skill({ email: 'zoe@x.test', skill: 'maths.sub', name: 'Taking away', mastery: 0.3, attempts: 12, correct: 5, misconceptions: mix('q9') }),
    skill({ email: 'ali@x.test', skill: 'maths.sub', name: 'Taking away', mastery: 0.35, attempts: 10, correct: 4, misconceptions: mix('q9') }),
    skill({ email: 'mo@x.test', skill: 'maths.sub', name: 'Taking away', mastery: 0.9, box: 3, due: new Date('2026-12-09'), attempts: 10, correct: 9, masteredAt: at('2026-11-20') }),
  ]
  const notes = new Map([['maths|read|q9', { teacherAction: 'Name the sign out loud first.' }]])
  const g = buildGroup({ period: P7, students, days, skills, notes, now: NOW })
  assert.equal(g.measures.active.cur, 3); assert.equal(g.measures.active.of, 4)
  assert.deepEqual(g.checkIns.map((c) => c.student.name), ['Bea'], 'Bea did not practise this week')
  assert.equal(g.checkIns[0].reasons[0].key, 'quiet')
  assert.equal(g.hardSkills.length, 1)
  const h = g.hardSkills[0]
  assert.deepEqual(h.students.map((x) => x.name), ['Ali', 'Zoe'], 'name order, not by score')
  assert.equal(h.findingHard, 2); assert.equal(h.practising, 3); assert.equal(h.secure, 1)
  assert.equal(h.mixup.text, 'added instead of subtracting'); assert.equal(h.action, 'Name the sign out loud first.')
  assert.equal(g.mixups.length, 0, 'the shared mix-up is named once, with its hard skill')
  assert.deepEqual(g.wins.mastered.map((m) => m.students.map((x) => x.name)), [['Mo']])
  // A hard group skill is planned for as a lesson: not repeated as a personal check-in.
  assert.ok(!g.checkIns.some((c) => c.reasons.some((r) => r.key === 'stuck')))
  for (const k of ['rank', 'position', 'score', 'leaderboard']) assert.ok(!JSON.stringify(g).includes(`"${k}"`))
})
