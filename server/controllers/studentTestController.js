// The student's side of tests and practice sets (TCH-033): the "To do" list,
// the intro card, and the player (start/resume, autosave, time limits, submit).
// Every attempt is looked up by id AND the signed-in student's email, so one
// student can never read or change another's work. All timing is checked here.
const Test = require('../models/tests/Test')
const TestAssignment = require('../models/tests/TestAssignment')
const TestAttempt = require('../models/tests/TestAttempt')
const LearnerDay = require('../models/analytics/LearnerDay')
const { contextFrom } = require('../analytics/record')
const { entitlementsFor } = require('../utils/entitlements')
const engine = require('../utils/testEngine')
const R = require('../utils/testRules')
const bank = require('../utils/questionBank')

const fail = (res, status, message, extra = {}) => res.status(status).json({ success: false, message, ...extra })
const oops = (res, err, where) => { console.error(`${where} error:`, err); fail(res, 500, 'Internal server error') }
const me = (req) => engine.lower(req.actor.email)

// The test, if one of this learner's active assignments includes it.
async function access(req, testId) {
  if (!bank.isId(testId)) return null
  for (const student of await engine.studentRecords(me(req))) {
    const hit = (await engine.assignmentsFor(student)).find((x) => String(x.test._id) === String(testId))
    if (hit) return { ...hit, student }
  }
  return null
}

async function myAttempt(req, id) {
  if (!bank.isId(id)) return null
  return TestAttempt.findOne({ _id: id, studentEmail: me(req) })
}

const plainTest = (test) => ({
  _id: String(test._id), title: test.title, description: test.description, kind: test.kind, teacher: test.ownerName || '',
  questionCount: (test.sections || []).reduce((n, s) => n + (s.items || []).reduce((m, it) => m + (it.kind === 'pool' ? it.pool?.count || 1 : 1), 0), 0),
  target: test.target?.module || test.target?.aiTopic ? test.target : null,
  rules: (({ alwaysOpen, opensAt, closesAt, timezone, timeLimit, totalMinutes, perQuestionSeconds, attempts, counts, hints, listen, aiTeacherLocked, feedback, release, style, passMark, lateWork, lateUntil, integrity }) =>
    ({ alwaysOpen, opensAt, closesAt, timezone, timeLimit, totalMinutes, perQuestionSeconds, attempts, counts, hints, listen, aiTeacherLocked, feedback, release, style, passMark, lateWork, lateUntil, integrity }))(test.rules || {}),
})

// GET /api/student/tests : the "To do" list.
const todo = async (req, res) => {
  try {
    engine.runReminders()
    const now = new Date()
    await engine.sweepExpired({ studentEmail: me(req) }, now)
    const out = []
    for (const student of await engine.studentRecords(me(req))) {
      for (const { test, assignment } of await engine.assignmentsFor(student)) {
        const attempts = await TestAttempt.find({ testId: String(test._id), studentEmail: me(req) }).select('status attemptNo percent submittedAt needsMarking').lean()
        const done = attempts.filter((a) => a.status !== 'in_progress')
        const inProgress = attempts.find((a) => a.status === 'in_progress')
        const w = R.windowState(test.rules, now)
        const allowed = test.rules?.attempts || 0
        const released = done.filter((a) => R.isReleased(test, a, now))
        let progress = null
        if (test.kind === 'practice' && test.target?.module) {
          const key = `${test.target.module}_${test.target.subject || 'english'}`
          const days = await LearnerDay.find({ email: me(req), date: { $gte: assignment.createdAt.toISOString().slice(0, 10) } }).select('byModuleSubject').lean()
          progress = { minutes: Math.round(days.reduce((s, d) => s + (d.byModuleSubject?.[key]?.minutes || 0), 0) * 10) / 10, goal: test.target.minutes || null }
        }
        out.push({
          ...plainTest(test), assignedAt: assignment.createdAt, phase: w.phase, dueAt: test.rules?.closesAt || null,
          attemptsUsed: done.length, attemptsAllowed: allowed, inProgressId: inProgress ? String(inProgress._id) : null,
          canStart: !!inProgress || ((w.phase === 'open' || w.phase === 'late') && (allowed === 0 || done.length < allowed)),
          finished: done.length > 0, best: released.length ? Math.max(...released.map((a) => a.percent)) : null, waitingForResult: done.length > 0 && !released.length,
          progress,
        })
      }
    }
    const rank = (t) => (t.inProgressId ? 0 : t.canStart && !t.finished ? 1 : t.phase === 'upcoming' ? 2 : 3)
    out.sort((a, b) => rank(a) - rank(b) || new Date(a.dueAt || 8.64e15) - new Date(b.dueAt || 8.64e15))
    res.json({ success: true, tests: out, now })
  } catch (err) { oops(res, err, 'student.todo') }
}

// GET /api/student/tests/:testId : the intro card.
const intro = async (req, res) => {
  try {
    const a = await access(req, req.params.testId)
    if (!a) return fail(res, 404, 'Test not found')
    const now = new Date()
    await engine.sweepExpired({ studentEmail: me(req), testId: String(a.test._id) }, now)
    const attempts = await TestAttempt.find({ testId: String(a.test._id), studentEmail: me(req) }).sort({ attemptNo: 1 })
    const done = attempts.filter((x) => x.status !== 'in_progress')
    const inProgress = attempts.find((x) => x.status === 'in_progress')
    const w = R.windowState(a.test.rules, now)
    const allowed = a.test.rules?.attempts || 0
    res.json({
      success: true, test: plainTest(a.test), phase: w.phase, now,
      accommodations: a.student.accommodations || {},
      attemptsUsed: done.length, attemptsAllowed: allowed, inProgressId: inProgress ? String(inProgress._id) : null,
      canStart: !!inProgress || ((w.phase === 'open' || w.phase === 'late') && (allowed === 0 || done.length < allowed)),
      late: w.phase === 'late',
      attempts: done.map((x) => {
        const released = R.isReleased(a.test, x, now)
        return { _id: String(x._id), attemptNo: x.attemptNo, submittedAt: x.submittedAt, late: x.late, released, percent: released ? x.percent : null, passed: released ? x.passed : null, needsMarking: released ? x.needsMarking : null }
      }),
    })
  } catch (err) { oops(res, err, 'student.intro') }
}

// POST /api/student/tests/:testId/start : start a new attempt or resume the open one.
const start = async (req, res) => {
  try {
    const a = await access(req, req.params.testId)
    if (!a) return fail(res, 404, 'Test not found')
    const now = new Date()
    const { test, student, assignment } = a
    await engine.sweepExpired({ studentEmail: me(req), testId: String(test._id) }, now)
    const existing = await TestAttempt.findOne({ testId: String(test._id), studentEmail: me(req), status: 'in_progress' })
    if (existing) return res.json({ success: true, attempt: engine.studentAttemptView(existing, test, now), resumed: true })
    const w = R.windowState(test.rules, now)
    if (w.phase === 'upcoming') return fail(res, 403, 'This test has not opened yet', { code: 'NOT_OPEN', opensAt: w.opensAt })
    if (w.phase === 'closed') return fail(res, 403, 'This test has closed', { code: 'CLOSED' })
    const used = await TestAttempt.countDocuments({ testId: String(test._id), studentEmail: me(req) })
    const allowed = test.rules?.attempts || 0
    if (allowed && used >= allowed) return fail(res, 403, 'You have used all your tries', { code: 'NO_ATTEMPTS_LEFT' })
    const acc = (student.accommodations && { extraTime: student.accommodations.extraTime || 1, readAloud: !!student.accommodations.readAloud, largerText: !!student.accommodations.largerText, fewerOptions: !!student.accommodations.fewerOptions }) || {}
    const owner = await entitlementsFor({ role: 'teacher', orgId: test.orgId })
    const items = await engine.buildItems(test, acc, { manualAllowed: owner.modules.includes('grading.manual') })
    if (!items.length && !(test.target?.module || test.target?.aiTopic)) return fail(res, 409, 'This test has no questions yet. Tell your teacher.')
    const rules = { ...(test.rules || {}) }
    try {
      const attempt = await TestAttempt.create({
        orgId: test.orgId, testId: String(test._id), assignmentId: String(assignment._id), studentId: String(student._id), studentEmail: me(req), studentName: student.name,
        attemptNo: used + 1, startedAt: now, deadlineAt: R.attemptDeadline(rules, now, acc), late: w.phase === 'late', rules, accommodations: acc, items, lastSeenAt: now,
      })
      res.status(201).json({ success: true, attempt: engine.studentAttemptView(attempt, test, now) })
    } catch (err) {
      // Two taps on "Start" at once: the unique index lets only one through.
      if (err.code === 11000) {
        const again = await TestAttempt.findOne({ testId: String(test._id), studentEmail: me(req), status: 'in_progress' })
        if (again) return res.json({ success: true, attempt: engine.studentAttemptView(again, test, now), resumed: true })
      }
      throw err
    }
  } catch (err) { oops(res, err, 'student.start') }
}

async function attemptAndTest(req, res) {
  const attempt = await myAttempt(req, req.params.attemptId)
  if (!attempt) { fail(res, 404, 'Attempt not found'); return {} }
  const test = await Test.findOne({ _id: attempt.testId, orgId: attempt.orgId }).lean()
  if (!test) { fail(res, 404, 'Test not found'); return {} }
  return { attempt, test }
}

// Time is up (or past the close): finish it and say so.
async function closeIfExpired(req, res, attempt, test, now) {
  if (attempt.status === 'in_progress' && R.pastDeadline(attempt, now)) {
    await engine.finalize(attempt, test, { auto: true, ctx: contextFrom(req), now })
    fail(res, 409, "Time's up. Your answers were handed in.", { code: 'TIME_UP', attempt: engine.studentAttemptView(attempt, test, now) })
    return true
  }
  return false
}

// GET /api/student/attempts/:attemptId
const getAttempt = async (req, res) => {
  try {
    const { attempt, test } = await attemptAndTest(req, res)
    if (!attempt) return
    const now = new Date()
    if (attempt.status === 'in_progress' && R.pastDeadline(attempt, now)) await engine.finalize(attempt, test, { auto: true, ctx: contextFrom(req), now })
    res.json({ success: true, attempt: engine.studentAttemptView(attempt, test, now), test: plainTest(test) })
  } catch (err) { oops(res, err, 'student.attempt') }
}

// POST /api/student/attempts/:attemptId/open { itemId } : the student is now looking at this question.
const openItem = async (req, res) => {
  try {
    const { attempt, test } = await attemptAndTest(req, res)
    if (!attempt) return
    const now = new Date()
    if (attempt.status !== 'in_progress') return fail(res, 409, 'This attempt is finished', { code: 'FINISHED' })
    if (await closeIfExpired(req, res, attempt, test, now)) return
    const idx = attempt.items.findIndex((x) => x.itemId === String(req.body?.itemId))
    if (idx < 0) return fail(res, 404, 'Question not found')
    // Per-question limits: one question at a time, forwards only.
    if (attempt.rules?.timeLimit === 'per_question' && idx < (attempt.currentIndex || 0)) return fail(res, 409, 'You cannot go back in this test', { code: 'NO_BACK' })
    const it = attempt.items[idx]
    if (!it.openedAt) it.openedAt = now
    attempt.currentIndex = idx
    attempt.lastSeenAt = now
    attempt.markModified('items')
    await attempt.save()
    res.json({ success: true, itemId: it.itemId, openedAt: it.openedAt, serverNow: now, perQuestionMs: R.perQuestionMs(attempt.rules, attempt.accommodations) })
  } catch (err) { oops(res, err, 'student.open') }
}

const validResponse = (interaction, r) => {
  if (r === null || r === undefined) return true
  if (JSON.stringify(r).length > 6000) return false
  switch (interaction) {
    case 'tap_mcq': case 'true_false': case 'drag_to_blank': case 'typed_short': case 'typed_long': return typeof r === 'string'
    case 'letter_bank': return typeof r === 'string' || (Array.isArray(r) && r.every((x) => typeof x === 'string'))
    case 'multi_select': case 'drag_order': case 'tap_sequence': return Array.isArray(r) && r.every((x) => typeof x === 'string')
    case 'match_pairs': return Array.isArray(r) && r.every((p) => Array.isArray(p) && p.length === 2 && p.every((x) => typeof x === 'string'))
    case 'sort_bins': return typeof r === 'object' && !Array.isArray(r) && Object.values(r).every((v) => Array.isArray(v) && v.every((x) => typeof x === 'string'))
    case 'mic_record': return typeof r === 'object' && !Array.isArray(r) && typeof (r.transcript ?? '') === 'string'
    default: return false
  }
}

// PUT /api/student/attempts/:attemptId/items/:itemId { response, timeMs?, hintsUsed?, check? }
// Autosave. With immediate feedback, `check: true` marks and locks the question.
const saveAnswer = async (req, res) => {
  try {
    const { attempt, test } = await attemptAndTest(req, res)
    if (!attempt) return
    const now = new Date()
    if (attempt.status !== 'in_progress') return fail(res, 409, 'This attempt is finished', { code: 'FINISHED' })
    if (await closeIfExpired(req, res, attempt, test, now)) return
    const it = attempt.items.find((x) => x.itemId === req.params.itemId)
    if (!it) return fail(res, 404, 'Question not found')
    const immediate = attempt.rules?.feedback === 'immediate'
    if (immediate && it.checked) return fail(res, 409, 'You already answered this one', { code: 'LOCKED' })
    if (!it.openedAt) it.openedAt = now
    if (R.itemExpired(attempt, it, now)) return fail(res, 409, "Time's up for this question", { code: 'QUESTION_TIME_UP' })
    let response = req.body?.response
    if (it.q?.interaction === 'letter_bank' && Array.isArray(response)) response = response.join('')
    if (typeof response === 'string') response = response.slice(0, 4000)
    if (it.q?.interaction === 'mic_record' && response && typeof response === 'object') response = { transcript: String(response.transcript || '').slice(0, 2000) }
    if (!validResponse(it.q?.interaction, response)) return fail(res, 400, 'That answer could not be saved')
    const serverMs = now - new Date(it.openedAt)
    const clientMs = Number(req.body?.timeMs)
    it.response = response
    it.answered = response !== null && response !== undefined && response !== '' && !(Array.isArray(response) && !response.length)
    it.savedAt = now
    it.timeMs = Math.max(0, Math.min(Number.isFinite(clientMs) && clientMs > 0 ? clientMs : serverMs, serverMs + 1000))
    if (attempt.rules?.hints) it.hintsUsed = Math.min(5, Math.max(0, Number(req.body?.hintsUsed) || 0))
    attempt.lastSeenAt = now
    let result = null
    if (immediate && req.body?.check && it.answered) {
      engine.markItem(it)
      it.checked = true
      await engine.recordItems({ ...attempt.toObject(), items: [it] }, test, contextFrom(req))
      result = it.needsMarking
        ? { needsMarking: true }
        : { correct: !!it.correct, score: it.score, correctAnswer: it.q?.correct_answer ?? null, feedback: it.correct ? it.q?.feedback?.correct || '' : it.q?.feedback?.incorrect || '', workedExample: it.correct ? '' : it.q?.worked_example || '' }
    }
    attempt.markModified('items')
    await attempt.save()
    res.json({ success: true, savedAt: now, answered: it.answered, result })
  } catch (err) { oops(res, err, 'student.save') }
}

// POST /api/student/attempts/:attemptId/events { type, itemId } : light integrity log (never penalised).
const EVENT_TYPES = new Set(['tab_hidden', 'paste', 'fullscreen_exit', 'resume'])
const logEvent = async (req, res) => {
  try {
    const type = String(req.body?.type || '')
    if (!EVENT_TYPES.has(type)) return fail(res, 400, 'Unknown event')
    const attempt = await myAttempt(req, req.params.attemptId)
    if (!attempt) return fail(res, 404, 'Attempt not found')
    if (attempt.status !== 'in_progress') return res.json({ success: true })
    const integ = attempt.rules?.integrity || {}
    const wanted = type === 'resume' || (type === 'tab_hidden' && integ.logTabSwitches) || (type === 'paste' && integ.logPaste) || (type === 'fullscreen_exit' && integ.fullscreen)
    if (wanted && (attempt.events || []).length < 500) {
      await TestAttempt.updateOne({ _id: attempt._id }, { $push: { events: { type, at: new Date(), itemId: String(req.body?.itemId || '').slice(0, 40) } } })
    }
    res.json({ success: true })
  } catch (err) { oops(res, err, 'student.event') }
}

// POST /api/student/attempts/:attemptId/submit
const submit = async (req, res) => {
  try {
    const { attempt, test } = await attemptAndTest(req, res)
    if (!attempt) return
    const now = new Date()
    if (attempt.status !== 'in_progress') return res.json({ success: true, attempt: engine.studentAttemptView(attempt, test, now), already: true })
    const auto = R.pastDeadline(attempt, now)
    await engine.finalize(attempt, test, { auto, ctx: contextFrom(req), now })
    res.json({ success: true, attempt: engine.studentAttemptView(attempt, test, now) })
  } catch (err) { oops(res, err, 'student.submit') }
}

module.exports = { todo, intro, start, getAttempt, openItem, saveAnswer, logEvent, submit, access, TestAssignment }
