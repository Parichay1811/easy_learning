// Running tests (TCH-032/033/040/042): who a test is for, starting and marking
// attempts, what a student may see, analytics, notifications and reminders.
const Student = require('../models/admin/Student')
const Batch = require('../models/admin/Batch')
const Test = require('../models/tests/Test')
const TestAssignment = require('../models/tests/TestAssignment')
const TestAttempt = require('../models/tests/TestAttempt')
const Child = require('../models/Child')
const { notify } = require('./notify')
const { recordAnswer } = require('../analytics/record')
const { scoreItem, answerKey } = require('./scoreAnswer')
const rules$ = require('./testRules')
const bank = require('./questionBank')

const lower = (s) => String(s || '').trim().toLowerCase()

// ── Who is it for ──

// Students an assignment reaches right now (group members + named students − excluded).
async function recipients(assignment) {
  const or = []
  if (assignment.batchIds?.length) or.push({ batchIds: { $in: assignment.batchIds.filter(bank.isId) } })
  if (assignment.studentIds?.length) or.push({ _id: { $in: assignment.studentIds.filter(bank.isId) } })
  if (!or.length) return []
  const excluded = new Set((assignment.excludedStudentIds || []).map(String))
  const students = await Student.find({ orgId: assignment.orgId, status: 'active', $or: or }).select('name email accommodations batchIds').lean()
  return students.filter((s) => !excluded.has(String(s._id)) && s.email)
}

// Every Student record for a signed-in learner (one per organisation they belong to).
const studentRecords = (email) => Student.find({ email: lower(email), status: 'active' }).lean()

// Active assignments that include this student, with their tests.
async function assignmentsFor(student) {
  const asg = await TestAssignment.find({
    orgId: String(student.orgId), active: true,
    $or: [{ batchIds: { $in: (student.batchIds || []).map(String) } }, { studentIds: String(student._id) }],
    excludedStudentIds: { $ne: String(student._id) },
  }).lean()
  if (!asg.length) return []
  const tests = await Test.find({ _id: { $in: asg.map((a) => a.testId).filter(bank.isId) }, orgId: String(student.orgId), status: 'published' }).lean()
  const byId = Object.fromEntries(tests.map((t) => [String(t._id), t]))
  return asg.filter((a) => byId[a.testId]).map((a) => ({ assignment: a, test: byId[a.testId] }))
}

// Linked, verified parents of these learners, as notify() recipients.
async function parentsOf(emails) {
  if (!emails.length) return []
  const kids = await Child.find({ email: { $in: emails.map(lower) }, linkStatus: 'verified' }).select('parentId').lean()
  return [...new Set(kids.map((k) => String(k.parentId)))].map((id) => ({ role: 'parent', id }))
}

// Students are addressed by their email (their sign-in id differs between Google and password logins).
const studentAddr = (email) => ({ role: 'student', id: lower(email) })

async function notifyStudents(students, msg, { parents = false, parentMsg } = {}) {
  const emails = students.map((s) => s.email || s).filter(Boolean)
  await notify(emails.map(studentAddr), msg)
  if (parents) await notify(await parentsOf(emails), parentMsg || msg)
}

// ── Starting an attempt ──

const shuffle = (arr, rand = Math.random) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

// "Fewer options" accommodation: keep the right answer and two others.
function fewerOptions(q) {
  if (!['tap_mcq', 'drag_to_blank', 'multi_select'].includes(q.interaction) || !Array.isArray(q.options) || q.options.length <= 3) return q
  const right = Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer]
  const keep = q.options.filter((o) => right.some((r) => lower(r) === lower(o)))
  const others = q.options.filter((o) => !keep.includes(o)).slice(0, Math.max(0, 3 - keep.length) || 1)
  return { ...q, options: q.options.filter((o) => keep.includes(o) || others.includes(o)) }
}

// The builder defaults typed_long / mic_record to 'manual'; without the grading.manual module everything is auto-marked.
const defaultMarking = (q, item, manualAllowed) => (manualAllowed && item.marking === 'manual' ? 'manual' : 'auto')

// Builds the frozen item list for a new attempt.
async function buildItems(test, acc = {}, { manualAllowed = true } = {}) {
  const owner = { id: test.ownerTutorId, orgId: test.orgId }
  const out = []
  const used = new Set()
  for (const it of (test.sections || []).flatMap((s) => s.items || [])) if (it.kind !== 'pool' && it.questionId) used.add(String(it.questionId))
  for (const [si, section] of (test.sections || []).entries()) {
    let rows = []
    for (const it of section.items || []) {
      if (it.kind === 'pool') {
        const drawn = await bank.drawPool(owner, it.pool || {}, used)
        drawn.forEach((d, k) => {
          used.add(String(d.doc._id))
          rows.push({ it, doc: d.doc, module: d.module, subject: d.subject, itemId: `${it._id}:${k}` })
        })
      } else {
        const doc = await bank.findQuestion(it.module, it.subject, it.questionId)
        if (!doc) continue
        rows.push({ it, doc, module: it.module, subject: it.subject, itemId: String(it._id) })
      }
    }
    if (test.rules?.shuffleQuestions && !section.fixedOrder) rows = shuffle(rows)
    for (const r of rows) {
      let q = bank.snapshot(r.doc, r.module)
      if (acc.fewerOptions) q = fewerOptions(q)
      if (test.rules?.shuffleOptions !== false && Array.isArray(q.options) && !['drag_order', 'tap_sequence', 'letter_bank'].includes(q.interaction)) q = { ...q, options: shuffle(q.options) }
      out.push({
        itemId: r.itemId, section: si, sectionTitle: section.title || '', module: r.module, subject: r.subject,
        questionId: String(r.doc._id), version: r.doc.version || 1, points: r.it.points ?? 1, partialCredit: r.it.partialCredit !== false,
        marking: defaultMarking(q, r.it, manualAllowed), rubric: r.it.rubric || [], q,
      })
    }
  }
  return out
}

// ── What the student may see ──

// The question without anything that gives the answer away.
function studentQuestion(item, rules = {}, acc = {}) {
  const q = item.q || {}
  const out = {
    id: item.itemId, interaction: q.interaction, instruction: q.instruction || '', prompt: q.prompt || '',
    image: q.image || null, audio_text: q.audio_text || null, options: Array.isArray(q.options) ? q.options : null,
  }
  if (rules.hints && Array.isArray(q.hints)) out.hints = q.hints
  if (q.interaction === 'match_pairs' && Array.isArray(q.correct_answer)) out.left = shuffle(q.correct_answer.map((p) => p[0]))
  if (q.interaction === 'sort_bins' && q.correct_answer && typeof q.correct_answer === 'object') out.bins = Object.keys(q.correct_answer)
  if (['drag_order', 'tap_sequence'].includes(q.interaction)) out.targetLength = Array.isArray(q.correct_answer) ? q.correct_answer.length : (q.options || []).length
  if (q.interaction === 'letter_bank') out.targetLength = (q.options || []).length
  return out
}

// The full student view of an attempt. Correctness only where the rules allow.
function studentAttemptView(attempt, test, now = new Date()) {
  const r = attempt.rules || {}
  const immediate = r.feedback === 'immediate'
  const released = rules$.isReleased(test, attempt, now)
  const answers = rules$.showAnswers(test, attempt, now)
  const perQ = rules$.perQuestionMs(r, attempt.accommodations)
  return {
    _id: String(attempt._id), testId: attempt.testId, attemptNo: attempt.attemptNo, status: attempt.status,
    startedAt: attempt.startedAt, deadlineAt: attempt.deadlineAt, submittedAt: attempt.submittedAt, late: attempt.late, serverNow: now,
    perQuestionMs: perQ, currentIndex: attempt.currentIndex || 0, accommodations: attempt.accommodations || {},
    rules: { feedback: r.feedback, hints: !!r.hints, listen: r.listen !== false, style: r.style, timeLimit: r.timeLimit, integrity: r.integrity || {}, passMark: r.passMark, aiTeacherLocked: !!r.aiTeacherLocked },
    items: attempt.items.map((it) => {
      const base = { ...studentQuestion(it, r, attempt.accommodations), section: it.section, sectionTitle: it.sectionTitle, points: it.points, answered: !!it.answered, response: it.response ?? null, openedAt: it.openedAt || null }
      const locked = immediate && it.checked
      if (locked) base.locked = true
      if ((immediate && it.checked) || answers) {
        base.result = { correct: !!it.correct, score: it.score ?? null, needsMarking: !!it.needsMarking, comment: it.manual?.comment || '' }
        if (answers || (immediate && it.checked && !it.needsMarking)) {
          base.result.correctAnswer = it.q?.correct_answer ?? null
          base.result.feedback = it.correct ? it.q?.feedback?.correct || '' : it.q?.feedback?.incorrect || ''
          base.result.workedExample = it.correct ? '' : it.q?.worked_example || ''
        }
      } else if (released) {
        base.result = { score: it.score ?? null, needsMarking: !!it.needsMarking, comment: it.manual?.comment || '' }
      }
      return base
    }),
    result: released ? { score: attempt.score, maxScore: attempt.maxScore, percent: attempt.percent, passed: attempt.passed, needsMarking: attempt.needsMarking } : null,
    released,
  }
}

// ── Answers, marking, finishing ──

// Marks one item from its response (auto items) and returns it.
function markItem(item) {
  const q = item.q || {}
  if (!item.answered) { Object.assign(item, { correct: false, fraction: 0, autoScore: 0, score: 0, needsMarking: false }); return item }
  const r = scoreItem(q, item.response, { points: item.points ?? 1, partialCredit: item.partialCredit !== false })
  item.correct = r.correct
  item.fraction = r.fraction
  item.autoScore = r.score
  item.responseKey = answerKey(item.response)
  if (item.marking === 'manual') {
    item.needsMarking = !item.manual || item.manual.score === undefined || item.manual.score === null
    item.score = item.needsMarking ? 0 : item.manual.score
    if (!item.needsMarking) item.correct = item.manual.score >= (item.points ?? 1) / 2
  } else {
    item.needsMarking = false
    item.score = item.manual && Number.isFinite(item.manual.score) ? item.manual.score : r.score
  }
  return item
}

function totals(attempt) {
  const max = attempt.items.reduce((s, it) => s + (it.points ?? 1), 0)
  const score = attempt.items.reduce((s, it) => s + (Number(it.score) || 0), 0)
  attempt.maxScore = Math.round(max * 100) / 100
  attempt.score = Math.round(score * 100) / 100
  attempt.percent = max ? Math.round((score / max) * 100) : 0
  attempt.needsMarking = attempt.items.some((it) => it.needsMarking)
  attempt.passed = attempt.percent >= (attempt.rules?.passMark ?? 50)
  return attempt
}

// Sends each finished answer to the shared analytics once (FND-040).
async function recordItems(attempt, test, ctx = {}) {
  const source = test.kind === 'practice' ? 'homework' : 'test'
  for (const it of attempt.items) {
    if (it.recorded || !it.answered || it.needsMarking) continue
    it.recorded = true
    await recordAnswer({
      email: attempt.studentEmail, module: it.module, subject: it.subject, correct: !!it.correct, timeMs: it.timeMs,
      testId: String(test._id), source, orgId: attempt.orgId, mode: attempt.rules?.style === 'warrior' ? 'warrior' : 'practice',
      hintsUsed: it.hintsUsed || 0, tz: ctx.tz, device: ctx.device, os: ctx.os, browser: ctx.browser,
    })
  }
}

// Ends an attempt (student submit, time-up or close). Idempotent.
async function finalize(attempt, test, { auto = false, ctx = {}, now = new Date() } = {}) {
  if (attempt.status !== 'in_progress') return attempt
  attempt.items.forEach(markItem)
  totals(attempt)
  attempt.status = auto ? 'auto_submitted' : 'submitted'
  attempt.submittedAt = now
  await recordItems(attempt, test, ctx)
  attempt.markModified('items')
  await attempt.save()
  if (rules$.isReleased(test, attempt, now) && !attempt.needsMarking) await notifyResult(test, [attempt])
  return attempt
}

// Closes attempts whose time has run out (called whenever attempts are read).
async function sweepExpired(filter = {}, now = new Date()) {
  const stale = await TestAttempt.find({ ...filter, status: 'in_progress', deadlineAt: { $ne: null, $lt: new Date(now.getTime() - rules$.GRACE_MS) } })
  if (!stale.length) return 0
  const tests = await Test.find({ _id: { $in: [...new Set(stale.map((a) => a.testId))].filter(bank.isId) } }).lean()
  const byId = Object.fromEntries(tests.map((t) => [String(t._id), t]))
  for (const a of stale) if (byId[a.testId]) await finalize(a, byId[a.testId], { auto: true, now })
  return stale.length
}

// "Your result is ready" to students (and their linked parents), once per attempt.
async function notifyResult(test, attempts) {
  const fresh = attempts.filter((a) => !a.resultNotifiedAt)
  if (!fresh.length) return
  const asg = await TestAssignment.findOne({ testId: String(test._id), active: true }).select('notifyParents').lean()
  const emails = fresh.map((a) => a.studentEmail)
  await notify(emails.map(studentAddr), { kind: 'result_released', title: `Your result for "${test.title}" is ready`, link: `/test/${test._id}` })
  // Parents always see released results of linked children (PAR-051); the reminder setting only covers reminders.
  await notify(await parentsOf(emails), { kind: 'result_released', title: `Result ready: ${test.title}`, body: asg?.notifyParents ? 'Open the test results to see how it went.' : '', link: '/parent-dashboard' })
  await TestAttempt.updateMany({ _id: { $in: fresh.map((a) => a._id) } }, { $set: { resultNotifiedAt: new Date() } })
}

// ── Reminders (open, 24 h before close, at close) ──

let lastSweep = 0
async function runReminders(now = new Date(), { force = false } = {}) {
  if (!force && Date.now() - lastSweep < 30 * 1000) return
  lastSweep = Date.now()
  try {
    await sweepExpired({}, now)
    const asgs = await TestAssignment.find({ active: true, $or: [{ 'reminders.openSentAt': null }, { 'reminders.dayBeforeSentAt': null }, { 'reminders.closeSentAt': null }] }).limit(500)
    if (!asgs.length) return
    const tests = await Test.find({ _id: { $in: asgs.map((a) => a.testId).filter(bank.isId) }, status: 'published' })
    const byId = Object.fromEntries(tests.map((t) => [String(t._id), t]))
    for (const a of asgs) {
      const test = byId[a.testId]
      if (!test || test.rules?.alwaysOpen) continue
      const r = test.rules || {}
      const opensAt = r.opensAt ? new Date(r.opensAt) : null
      const closesAt = r.closesAt ? new Date(r.closesAt) : null
      const link = `/test/${test._id}`
      if (!a.reminders.openSentAt && opensAt && opensAt <= now && (!closesAt || now < closesAt)) {
        a.reminders.openSentAt = now
        // Skip if it was already open when assigned (the assignment notice said so).
        if (opensAt > a.createdAt) await notifyStudents(await recipients(a), { kind: 'test_open', title: `"${test.title}" is open now`, link }, { parents: a.notifyParents })
      }
      if (!a.reminders.dayBeforeSentAt && closesAt && now >= new Date(closesAt.getTime() - 24 * 3600 * 1000) && now < closesAt) {
        a.reminders.dayBeforeSentAt = now
        const done = new Set((await TestAttempt.find({ testId: String(test._id), status: { $ne: 'in_progress' } }).select('studentEmail').lean()).map((x) => x.studentEmail))
        const todo = (await recipients(a)).filter((s) => !done.has(lower(s.email)))
        await notifyStudents(todo, { kind: 'test_due', title: `"${test.title}" closes in 24 hours`, link }, { parents: a.notifyParents })
      }
      if (!a.reminders.closeSentAt && closesAt && now >= closesAt) {
        a.reminders.closeSentAt = now
        const done = new Set((await TestAttempt.find({ testId: String(test._id), status: { $ne: 'in_progress' } }).select('studentEmail').lean()).map((x) => x.studentEmail))
        const missed = (await recipients(a)).filter((s) => !done.has(lower(s.email)))
        if (r.lateWork !== 'none') await notifyStudents(missed, { kind: 'test_closed', title: `"${test.title}" has closed. You can still hand it in late.`, link })
        else await notifyStudents(missed, { kind: 'test_closed', title: `"${test.title}" has closed`, link })
        // Results that were waiting for the close date.
        if (r.feedback === 'after_close' && r.release !== 'manual') {
          const finished = await TestAttempt.find({ testId: String(test._id), status: { $ne: 'in_progress' }, needsMarking: false, resultNotifiedAt: null })
          if (rules$.windowState(r, now).phase !== 'late') await notifyResult(test, finished)
        }
      }
      a.markModified('reminders')
      await a.save()
    }
  } catch (err) {
    console.error('test reminders failed:', err.message)
  }
}

module.exports = {
  recipients, studentRecords, assignmentsFor, parentsOf, notifyStudents, studentAddr, buildItems, studentQuestion, studentAttemptView,
  markItem, totals, finalize, sweepExpired, notifyResult, recordItems, runReminders, shuffle, fewerOptions, lower,
  Batch,
}
