// ADMIN pure helpers: tree paths, bulk specs, rollups, streak holidays, CSV and
// roster validation, seats, calendar and policy rules. No database needed.
const test = require('node:test')
const assert = require('node:assert/strict')
const tree = require('../utils/orgUnits')
const q = require('../analytics/queries')
const roster = require('../utils/rosterImport')
const { seatState } = require('../utils/seats')
const cal = require('../utils/schoolCalendar')
const policy = require('../utils/orgPolicy')
const { estimateAge } = require('../utils/parentLinks')
const { fakeRes } = require('./helpers')

test('tree: bulk spec parsing', () => {
  const a = tree.parseBulkSpec('Grades 1-8, sections A-C')
  assert.equal(a.grades.length, 8)
  assert.equal(a.grades[0].name, 'Grade 1')
  assert.deepEqual(a.sections, ['A', 'B', 'C'])
  assert.equal(tree.sectionName(a.grades[3], 'B'), '4B')
  assert.deepEqual(tree.parseBulkSpec('Year 4 to 6, sections Red, Blue').sections, ['Red', 'Blue'])
  assert.equal(tree.parseBulkSpec('Grade 3').grades.length, 1)
  assert.deepEqual(tree.parseBulkSpec('Grades 1-2').sections, [])
  assert.throws(() => tree.parseBulkSpec('lots of classes'), /Grades 1-8/)
  assert.throws(() => tree.parseBulkSpec('Grades 1-30'), /16/)
})

test('tree: subtrees, nested tree and labels from id paths', () => {
  const u = [
    { _id: 'c', parentId: null, path: '/c/', name: 'Campus', order: 0 },
    { _id: 'g', parentId: 'c', path: '/c/g/', name: 'Grade 4', order: 0 },
    { _id: 's2', parentId: 'g', path: '/c/g/s2/', name: '4B', order: 1 },
    { _id: 's1', parentId: 'g', path: '/c/g/s1/', name: '4A', order: 0 },
    { _id: 'x', parentId: null, path: '/x/', name: 'Grade 9', order: 1 },
  ]
  assert.deepEqual([...tree.subtreeIdSet(u, ['g'])].sort(), ['g', 's1', 's2'])
  assert.deepEqual([...tree.subtreeIdSet(u, ['s1', 'x'])].sort(), ['s1', 'x'])
  const t = tree.buildTree(u)
  assert.deepEqual(t.map((n) => n.name), ['Campus', 'Grade 9'])
  assert.deepEqual(t[0].children[0].children.map((n) => n.name), ['4A', '4B'])
  assert.equal(tree.unitLabel(u, 's2'), 'Campus › Grade 4 › 4B')
  const structure = { units: u, batches: [{ _id: 'b1', unitId: 's1', tutorIds: ['t1'] }], students: [{ _id: 'p1', email: 'a@x', unitId: 's2', batchIds: [] }, { _id: 'p2', email: 'b@x', unitId: null, batchIds: ['b1'] }, { _id: 'p3', email: 'c@x', unitId: 'x', batchIds: [] }], tutors: [{ _id: 't1' }, { _id: 't2', unitIds: ['g'] }] }
  const m = tree.membersOf(structure, tree.subtreeIdSet(u, ['g']))
  assert.deepEqual(m.students.map((s) => s._id).sort(), ['p1', 'p2'])
  assert.deepEqual(m.tutors.map((t2) => t2._id).sort(), ['t1', 't2'])
  assert.equal(tree.unitCounts(structure).c.students, 2)
})

test('streak: school holidays bridge a gap but do not count as days', () => {
  const active = new Set(['2026-11-10', '2026-11-11', '2026-11-13', '2026-11-14'])
  assert.deepEqual(q.streakFrom(active, '2026-11-14'), { current: 2, longest: 2, lastActive: '2026-11-14' })
  const s = q.streakFrom(active, '2026-11-14', ['2026-11-12'])
  assert.equal(s.current, 4)
  assert.equal(s.longest, 4)
  // a holiday today, and yesterday active: still alive
  assert.equal(q.streakFrom(new Set(['2026-11-13']), '2026-11-14', new Set(['2026-11-14'])).current, 1)
  // holidays alone are not a streak
  assert.equal(q.streakFrom(new Set(), '2026-11-14', ['2026-11-13', '2026-11-14']).current, 0)
})

test('rollups: groups, subject grid, growth, features, active series', () => {
  const per = new Map([
    ['a@x', { minutes: 140, answered: 70, correct: 63, activeDays: 7 }],
    ['b@x', { minutes: 0, answered: 0, correct: 0, activeDays: 0 }],
  ])
  const [r] = q.rollupGroups([{ key: 'g', name: '4A', emails: ['A@x', 'b@x'] }], per, 7)
  assert.equal(r.learners, 2)
  assert.equal(r.activeLearners, 1)
  assert.equal(r.activePct, 50)
  assert.equal(r.minutesPerLearner, 70)
  assert.equal(r.accuracy, 90)
  assert.equal(r.name, '4A')
  assert.equal(r.engagement, 50) // half the class at full engagement
  assert.equal(q.rollupGroups([{ key: 'e', emails: [] }], per, 7)[0].engagement, null)
  const subj = new Map([['a@x', { maths: { answered: 10, correct: 5, minutes: 3 } }], ['b@x', { maths: { answered: 10, correct: 9, minutes: 1 }, art: { answered: 1, correct: 1 } }]])
  const [gr] = q.subjectGrid([{ key: 'g', emails: ['a@x', 'b@x'] }], subj)
  assert.equal(gr.cells.maths.accuracy, 70)
  assert.equal(gr.cells.english.accuracy, null)
  const g = q.growthRows(['a@x', 'b@x'], per, new Map([['a@x', { minutes: 40, answered: 20, correct: 10 }]]))
  assert.equal(g[0].accuracyDelta, 40)
  assert.equal(g[0].minutesDelta, 100)
  assert.equal(g[1].accuracyDelta, null)
  assert.deepEqual(q.featureUse([{ sources: { practice: 3, test: 1 } }, { sources: { practice: 2 } }]), { practice: 5, test: 1 })
  const series = q.activeSeries([{ email: 'a', date: '2026-11-02', answered: 1 }, { email: 'b', date: '2026-11-02', minutes: 1 }], { from: '2026-11-01', days: 3 })
  assert.deepEqual(series.map((x) => x.learners), [0, 1, 0])
})

test('csv: quotes, delimiters, BOM', () => {
  const rows = roster.parseCsv('﻿Name;Email\r\n"Shah, Aarav";a@x\n"Say ""hi""";\n\n')
  assert.deepEqual(rows, [['Name', 'Email'], ['Shah, Aarav', 'a@x'], ['Say "hi"', '']])
  assert.deepEqual(roster.autoMapping(['Pupil', 'E-Mail', 'Year Group', 'Div'], 'students'), { name: 0, email: 1, grade: 2, section: 3 })
})

test('roster: validation, matching and grade/section names', () => {
  assert.equal(roster.gradeName('4'), 'Grade 4')
  assert.equal(roster.sectionNameFor('Grade 4', 'b'), '4B')
  assert.equal(roster.sectionNameFor('Year 4', 'Red'), 'Red')
  const rows = [['S1', 'Asha', 'asha@x.test', '4', 'A'], ['S2', 'Ben', '', '4', 'A'], ['', 'Asha Two', 'asha@x.test', '4', 'B']]
  const mapping = { externalId: 0, name: 1, email: 2, grade: 3, section: 4 }
  const existing = { students: [{ _id: 'old1', name: 'Ben', email: '', externalId: 's2', grade: 'Grade 4 4A' }] }
  const v = roster.validateRows('students', rows, mapping, existing)
  assert.deepEqual(v.rows.map((r) => r.action), ['create', 'update', 'skip'])
  assert.equal(v.rows[1].matchId, 'old1')
  assert.throws(() => roster.validateRows('students', rows, { email: 2 }), /Name/)
  const t = roster.validateRows('teachers', [['T', 'T@X.test', 'Maths, Science']], { name: 0, email: 1, subjects: 2 }, { teachers: [{ _id: 't1', email: 't@x.test' }] })
  assert.equal(t.rows[0].action, 'update')
  assert.deepEqual(t.rows[0].values.subjectList, ['Maths', 'Science'])
})

test('seats: states', () => {
  assert.equal(seatState(10, null).state, 'unlimited')
  assert.equal(seatState(80, 100).state, 'ok')
  assert.equal(seatState(90, 100).state, 'warning')
  assert.deepEqual([seatState(100, 100).state, seatState(100, 100).free], ['full', 0])
})

test('calendar: year validation and terms', () => {
  assert.ok(cal.cleanYear({ name: '', start: '2026-09-01', end: '2027-07-01' }).error)
  assert.ok(cal.cleanYear({ name: 'Y', start: '2026-09-01', end: '2027-07-01', terms: [{ name: 'T1', start: '2026-09-01', end: '2026-12-20' }, { name: 'T2', start: '2026-12-01', end: '2027-03-01' }] }).error.includes('overlap'))
  assert.ok(cal.cleanYear({ name: 'Y', start: '2026-09-01', end: '2027-07-01', events: [{ name: 'Trip', start: '2026-10-01', end: '2026-10-02', kind: 'party' }] }).error)
  const ok = cal.cleanYear({ name: 'Y', start: '2026-09-01', end: '2027-07-01', terms: [{ name: 'T2', start: '2027-01-05', end: '2027-03-30' }, { name: 'T1', start: '2026-09-01', end: '2026-12-20' }] })
  assert.deepEqual(ok.value.terms.map((t) => t.name), ['T1', 'T2'])
  const around = cal.termsAround([{ name: 'Y', terms: ok.value.terms.map((t, i) => ({ ...t, _id: `t${i}` })) }], '2027-02-01')
  assert.equal(around.current.name, 'T2')
  assert.equal(around.previous.name, 'T1')
  assert.equal(cal.datesBetween('2026-12-30', '2027-01-02').length, 4)
})

test('policy: rules and requirePolicy middleware', async () => {
  const orig = policy.deps.load
  policy.deps.load = async () => ({ policy: { teachersCreateGroups: false, messaging: 'parent_starts' }, solo: false })
  assert.equal(await policy.policyAllows('o', 'teachersCreateGroups'), false)
  assert.equal(await policy.policyAllows('o', 'parentStartsMessage'), true)
  assert.equal(await policy.policyAllows('o', 'teacherStartsMessage'), false)
  const res = fakeRes()
  let called = false
  await policy.requirePolicy('teachersCreateGroups')({ actor: { orgId: 'o' } }, res, () => { called = true })
  assert.equal(called, false)
  assert.equal(res.statusCode, 403)
  assert.equal(res.body.code, 'POLICY_BLOCKED')
  policy.deps.load = async () => ({ policy: { teachersCreateGroups: false }, solo: true })
  await policy.requirePolicy('teachersCreateGroups')({ teacher: { orgId: 'o' } }, fakeRes(), () => { called = true })
  assert.equal(called, true, 'solo tutors always run their own groups')
  await assert.rejects(policy.policyAllows('o', 'nope'))
  policy.deps.load = orig
})

test('parent links: child age from the school record', () => {
  assert.equal(estimateAge({ age: 7 }), 7)
  assert.equal(estimateAge({ grade: 'Grade 4 4A' }), 9)
  assert.equal(estimateAge({}), 10)
})
