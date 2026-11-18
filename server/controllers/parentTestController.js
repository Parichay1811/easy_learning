// GET /api/parent/children/:id/tests : a verified child's tests (for PAR-051).
// Shape:
// { success, child: { name },
//   assigned:  [{ testId, title, kind, teacher, opensAt, closesAt, phase, status: 'not_started'|'in_progress' }],
//   upcoming:  [ ...same, phase 'upcoming' ],
//   results:   [{ testId, title, kind, teacher, submittedAt, percent, passed, late, attempts, comments: [string] }] }
// Results appear only once released to the student (testRules.isReleased); scores never leak earlier.
const Child = require('../models/Child')
const Test = require('../models/tests/Test')
const TestAttempt = require('../models/tests/TestAttempt')
const { childAccess } = require('../utils/guardianLink')
const engine = require('../utils/testEngine')
const R = require('../utils/testRules')
const bank = require('../utils/questionBank')
const { countedAttempt } = require('../utils/testAnalysis')

const childTests = async (req, res) => {
  try {
    if (req.parent?.role !== 'parent' || !bank.isId(req.params.id)) return res.status(404).json({ success: false, message: 'Child not found' })
    const child = await Child.findOne({ _id: req.params.id, parentId: req.parent.id })
    const access = childAccess(child)
    if (!access.ok) return res.status(access.status).json({ success: false, message: access.message, code: access.code })
    const email = engine.lower(child.email)
    const now = new Date()
    await engine.sweepExpired({ studentEmail: email }, now)
    const assigned = [], upcoming = [], results = []
    const seen = new Set()
    for (const student of await engine.studentRecords(email)) {
      for (const { test } of await engine.assignmentsFor(student)) {
        if (seen.has(String(test._id))) continue
        seen.add(String(test._id))
        const attempts = await TestAttempt.find({ testId: String(test._id), studentEmail: email }).lean()
        const base = { testId: String(test._id), title: test.title, kind: test.kind, teacher: test.ownerName || '', opensAt: test.rules?.opensAt || null, closesAt: test.rules?.closesAt || null }
        const released = attempts.filter((a) => R.isReleased(test, a, now))
        const c = countedAttempt(released, test.rules?.counts || 'best')
        if (c) {
          results.push({ ...base, submittedAt: c.submittedAt, percent: c.percent, passed: c.passed, late: c.late, needsMarking: c.needsMarking, attempts: attempts.filter((a) => a.status !== 'in_progress').length,
            comments: c.items.map((i) => i.manual?.comment).filter(Boolean) })
          continue
        }
        const phase = R.windowState(test.rules, now).phase
        const finished = attempts.some((a) => a.status !== 'in_progress')
        const row = { ...base, phase, status: finished ? 'waiting_for_result' : attempts.some((a) => a.status === 'in_progress') ? 'in_progress' : 'not_started' }
        if (phase === 'upcoming') upcoming.push(row)
        else if (phase !== 'closed' || finished) assigned.push(row)
      }
    }
    results.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    res.json({ success: true, child: { name: child.name }, assigned, upcoming, results })
  } catch (err) {
    console.error('parent.childTests error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { childTests, Test }
