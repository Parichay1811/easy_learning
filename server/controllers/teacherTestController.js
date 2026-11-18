// Teacher side of tests and practice sets (TCH-030..035, 040..042, 052, 060, 061).
// A teacher only ever sees tests they own, inside their own workspace, and can
// only assign them to groups they teach (or students in those groups).
const Batch = require('../models/admin/Batch')
const Student = require('../models/admin/Student')
const Test = require('../models/tests/Test')
const TestAssignment = require('../models/tests/TestAssignment')
const TestAttempt = require('../models/tests/TestAttempt')
const LearnerDay = require('../models/analytics/LearnerDay')
const { audit } = require('../utils/audit')
const { notify } = require('../utils/notify')
const { teachesBatch } = require('../utils/scopes')
const { entitlementsFor } = require('../utils/entitlements')
const bank = require('../utils/questionBank')
const engine = require('../utils/testEngine')
const R = require('../utils/testRules')
const { buildResults, resultsCsv, countedAttempt } = require('../utils/testAnalysis')

const fail = (res, status, message, extra = {}) => res.status(status).json({ success: false, message, ...extra })
const oops = (res, err, where) => { console.error(`${where} error:`, err); fail(res, 500, 'Internal server error') }
const T = (req) => ({ id: String(req.teacher.id), orgId: String(req.teacher.orgId), name: req.teacher.name || '', email: req.teacher.email || '' })
const str = (v, max) => (v === undefined || v === null ? '' : String(v).trim().slice(0, max))
const bool = (v, d = false) => (v === undefined ? d : !!v)

const PRACTICE_RULES = { alwaysOpen: true, attempts: 0, counts: 'best', feedback: 'immediate', release: 'auto', style: 'practice', hints: true, listen: true, aiTeacherLocked: false, timeLimit: 'none', passMark: 0, masteryCredit: true, shuffleQuestions: true, shuffleOptions: true }

// Starting points for the builder (TCH-030 "templates").
const PRESETS = [
  { key: 'quick_quiz', title: 'Quick quiz', description: '10 minutes, one go, results straight after.', kind: 'test', rules: { timeLimit: 'total', totalMinutes: 10, attempts: 1, feedback: 'after_submit', shuffleOptions: true } },
  { key: 'exit_ticket', title: 'Exit ticket', description: 'Three questions at the end of a lesson, with instant feedback.', kind: 'test', rules: { feedback: 'immediate', attempts: 1, hints: true } },
  { key: 'unit_test', title: 'Unit test', description: '40 minutes, shuffled, results when you release them.', kind: 'test', rules: { timeLimit: 'total', totalMinutes: 40, attempts: 1, shuffleQuestions: true, feedback: 'after_close', release: 'manual', listen: true, hints: false, aiTeacherLocked: true } },
  { key: 'warrior_challenge', title: 'Warrior challenge', description: 'Timer and stars, three tries, best counts.', kind: 'test', rules: { style: 'warrior', timeLimit: 'per_question', perQuestionSeconds: 30, attempts: 3, counts: 'best', feedback: 'after_submit' } },
  { key: 'practice', title: 'Practice set', description: 'Calm practice that counts towards mastery, not grades.', kind: 'practice', rules: PRACTICE_RULES },
]

// ── Input ──

function normaliseRules(input = {}, kind = 'test') {
  const r = { ...(kind === 'practice' ? PRACTICE_RULES : {}) }
  const enumOf = (v, list, d) => (list.includes(v) ? v : d)
  const num = (v, min, max) => (v === undefined || v === null || v === '' ? undefined : Math.min(max, Math.max(min, Number(v) || min)))
  r.timezone = str(input.timezone, 60) || 'UTC'
  try { new Intl.DateTimeFormat('en', { timeZone: r.timezone }) } catch { r.timezone = 'UTC' }
  const when = (local, iso) => (local ? R.zonedToUtc(local, r.timezone) : iso ? new Date(iso) : undefined)
  r.alwaysOpen = bool(input.alwaysOpen, r.alwaysOpen || false)
  const opensAt = when(input.opensAtLocal, input.opensAt)
  const closesAt = when(input.closesAtLocal, input.closesAt)
  const lateUntil = when(input.lateUntilLocal, input.lateUntil)
  for (const [k, v] of Object.entries({ opensAt, closesAt, lateUntil })) if (v && !Number.isNaN(v.getTime())) r[k] = v
  r.timeLimit = enumOf(input.timeLimit, ['none', 'total', 'per_question'], r.timeLimit || 'none')
  r.totalMinutes = num(input.totalMinutes, 1, 600)
  r.perQuestionSeconds = num(input.perQuestionSeconds, 5, 3600)
  r.attempts = num(input.attempts, 0, 20) ?? (r.attempts ?? 1)
  r.counts = enumOf(input.counts, ['best', 'last', 'average'], r.counts || 'best')
  r.shuffleQuestions = bool(input.shuffleQuestions, r.shuffleQuestions || false)
  r.shuffleOptions = bool(input.shuffleOptions, r.shuffleOptions ?? true)
  r.hints = bool(input.hints, r.hints || false)
  r.listen = bool(input.listen, r.listen ?? true)
  r.aiTeacherLocked = bool(input.aiTeacherLocked, r.aiTeacherLocked ?? true)
  r.feedback = enumOf(input.feedback, ['immediate', 'after_submit', 'after_close', 'never'], r.feedback || 'after_submit')
  r.release = enumOf(input.release, ['auto', 'manual'], r.release || 'auto')
  r.style = enumOf(input.style, ['practice', 'warrior'], r.style || 'practice')
  r.passMark = num(input.passMark, 0, 100) ?? (r.passMark ?? 50)
  r.masteryCredit = bool(input.masteryCredit, r.masteryCredit ?? true)
  r.lateWork = enumOf(input.lateWork, ['none', 'marked', 'until'], r.lateWork || 'none')
  const integ = input.integrity || {}
  r.integrity = { fullscreen: !!integ.fullscreen, logTabSwitches: !!integ.logTabSwitches, logPaste: !!integ.logPaste }
  if (r.alwaysOpen) { delete r.opensAt; delete r.closesAt }
  return r
}

async function normaliseSections(teacher, sections = []) {
  const out = []
  const errors = []
  for (const [si, s] of (Array.isArray(sections) ? sections : []).slice(0, 20).entries()) {
    const items = []
    for (const [ii, it] of (Array.isArray(s.items) ? s.items : []).slice(0, 100).entries()) {
      const points = Math.min(100, Math.max(0, Number(it.points ?? 1) || 0))
      const rubric = (Array.isArray(it.rubric) ? it.rubric : []).slice(0, 6).map((c) => ({
        name: str(c.name, 80), levels: (Array.isArray(c.levels) ? c.levels : []).slice(0, 6).map((l) => ({ label: str(l.label, 60), points: Math.max(0, Number(l.points) || 0) })),
      })).filter((c) => c.name && c.levels.length)
      const common = { points, partialCredit: it.partialCredit !== false, marking: it.marking === 'manual' ? 'manual' : 'auto', rubric }
      if (it._id && bank.isId(it._id)) common._id = it._id
      if (it.kind === 'pool') {
        const p = it.pool || {}
        if (p.module && !bank.MODULES.includes(p.module)) { errors.push(`Section ${si + 1}, item ${ii + 1}: unknown module`); continue }
        if (p.subject && !bank.SUBJECTS.includes(p.subject)) { errors.push(`Section ${si + 1}, item ${ii + 1}: unknown subject`); continue }
        items.push({ kind: 'pool', ...common, pool: {
          source: ['mine', 'school', 'learnigo', 'collection'].includes(p.source) ? p.source : 'mine', collectionId: str(p.collectionId, 30) || undefined,
          module: p.module || undefined, subject: p.subject || undefined, skillIds: (Array.isArray(p.skillIds) ? p.skillIds : []).map((x) => str(x, 80).toLowerCase()).filter(Boolean).slice(0, 10),
          difficultyMin: p.difficultyMin ? Math.min(5, Math.max(1, Number(p.difficultyMin))) : undefined, difficultyMax: p.difficultyMax ? Math.min(5, Math.max(1, Number(p.difficultyMax))) : undefined,
          interactions: (Array.isArray(p.interactions) ? p.interactions : []).slice(0, 12), count: Math.min(50, Math.max(1, Number(p.count) || 1)),
        } })
      } else {
        const doc = await bank.findQuestion(it.module, it.subject, it.questionId)
        if (!doc || !(await bank.canRead(teacher, doc))) { errors.push(`Section ${si + 1}, item ${ii + 1}: question not found`); continue }
        items.push({ kind: 'question', ...common, module: it.module, subject: it.subject, questionId: String(doc._id) })
      }
    }
    out.push({ title: str(s.title, 120), fixedOrder: !!s.fixedOrder, items, ...(s._id && bank.isId(s._id) ? { _id: s._id } : {}) })
  }
  return { sections: out.length ? out : [{ title: '', items: [] }], errors }
}

async function normaliseTest(teacher, body, existing) {
  const kind = body.kind === 'practice' ? 'practice' : existing?.kind || 'test'
  const title = str(body.title ?? existing?.title, 140)
  if (!title) return { error: 'Give it a title' }
  const { sections, errors } = body.sections !== undefined ? await normaliseSections(teacher, body.sections) : { sections: existing?.sections || [{ title: '', items: [] }], errors: [] }
  if (errors.length) return { error: errors[0], errors }
  const rules = body.rules !== undefined ? normaliseRules(body.rules, kind) : existing?.rules || normaliseRules({}, kind)
  const t = body.target || {}
  const target = kind === 'practice' && (t.module || t.aiTopic) ? {
    module: bank.MODULES.includes(t.module) ? t.module : undefined, subject: bank.SUBJECTS.includes(t.subject) ? t.subject : undefined,
    minutes: t.minutes ? Math.min(600, Math.max(1, Number(t.minutes))) : undefined, aiTopic: str(t.aiTopic, 120) || undefined,
  } : body.target === undefined ? existing?.target : undefined
  return { data: { kind, title, description: str(body.description ?? existing?.description, 2000), subject: str(body.subject ?? existing?.subject, 40), isTemplate: bool(body.isTemplate, existing?.isTemplate || false), sections, rules, target } }
}

const loadTest = async (req, res) => {
  const t = T(req)
  if (!bank.isId(req.params.id)) { fail(res, 404, 'Test not found'); return null }
  const test = await Test.findOne({ _id: req.params.id, orgId: t.orgId, ownerTutorId: t.id })
  if (!test) { fail(res, 404, 'Test not found'); return null }
  return test
}

// Groups the teacher teaches; and are these students in them?
async function myBatches(teacher) {
  return (await Batch.find({ orgId: teacher.orgId }).select('name tutorIds directTutorIds subjects').lean()).filter((b) => teachesBatch(b, teacher.id))
}
async function myStudentIds(teacher) {
  const batches = await myBatches(teacher)
  const students = await Student.find({ orgId: teacher.orgId, batchIds: { $in: batches.map((b) => b._id) } }).select('_id').lean()
  return new Set(students.map((s) => String(s._id)))
}

// ── CRUD ──

const presets = (req, res) => res.json({ success: true, presets: PRESETS })

const list = async (req, res) => {
  try {
    const t = T(req)
    engine.runReminders()
    const filter = { orgId: t.orgId, ownerTutorId: t.id, status: { $ne: 'archived' } }
    if (req.query.kind) filter.kind = req.query.kind === 'practice' ? 'practice' : 'test'
    if (req.query.templates === '1') filter.isTemplate = true
    const tests = await Test.find(filter).sort({ updatedAt: -1 }).limit(300).lean()
    const ids = tests.map((x) => String(x._id))
    const [asgs, agg] = await Promise.all([
      TestAssignment.find({ testId: { $in: ids }, active: true }).lean(),
      TestAttempt.aggregate([{ $match: { testId: { $in: ids }, status: { $ne: 'in_progress' } } }, { $group: { _id: '$testId', submitted: { $addToSet: '$studentEmail' }, avg: { $avg: '$percent' }, marking: { $sum: { $cond: ['$needsMarking', 1, 0] } } } }]),
    ])
    const byTest = Object.fromEntries(agg.map((a) => [a._id, a]))
    const out = []
    for (const x of tests) {
      const a = asgs.find((y) => y.testId === String(x._id))
      const assigned = a ? (await engine.recipients(a)).length : 0
      const s = byTest[String(x._id)]
      out.push({
        _id: String(x._id), title: x.title, kind: x.kind, status: x.status, isTemplate: x.isTemplate, updatedAt: x.updatedAt,
        questionCount: (x.sections || []).reduce((n, sec) => n + (sec.items || []).reduce((m, it) => m + (it.kind === 'pool' ? it.pool?.count || 1 : 1), 0), 0),
        window: R.windowState(x.rules, new Date()).phase, opensAt: x.rules?.opensAt, closesAt: x.rules?.closesAt,
        assigned, finished: s ? s.submitted.length : 0, average: s?.avg != null ? Math.round(s.avg) : null, needsMarking: s?.marking || 0,
        released: !!x.resultsReleasedAt, release: x.rules?.release, feedback: x.rules?.feedback,
      })
    }
    res.json({ success: true, tests: out })
  } catch (err) { oops(res, err, 'tests.list') }
}

async function checkAdvanced(req, data) {
  const used = R.advancedFeatures(data)
  if (!used.length) return null
  const ent = await entitlementsFor(req.actor)
  return ent.modules.includes('tests.advanced') ? null : used
}

const create = async (req, res) => {
  try {
    const t = T(req)
    let body = req.body || {}
    if (body.preset) {
      const p = PRESETS.find((x) => x.key === body.preset)
      if (p) body = { ...body, kind: body.kind || p.kind, rules: { ...p.rules, ...(body.rules || {}) } }
    }
    const { data, error, errors } = await normaliseTest(t, body)
    if (error) return fail(res, 400, error, { errors })
    const locked = await checkAdvanced(req, data)
    if (locked) return res.status(402).json({ success: false, code: 'MODULE_LOCKED', module: 'tests.advanced', message: `Your plan doesn't include ${locked.join(', ')}.` })
    const test = await Test.create({ ...data, orgId: t.orgId, ownerTutorId: t.id, ownerName: t.name })
    res.status(201).json({ success: true, test })
  } catch (err) {
    if (err.name === 'ValidationError') return fail(res, 400, err.message)
    oops(res, err, 'tests.create')
  }
}

const getOne = async (req, res) => {
  try {
    const test = await loadTest(req, res)
    if (!test) return
    const t = T(req)
    const items = {}
    for (const it of test.sections.flatMap((s) => s.items)) {
      if (it.kind === 'pool') continue
      const doc = await bank.findQuestion(it.module, it.subject, it.questionId)
      if (doc) items[String(it._id)] = bank.summary(doc, it.module, it.subject, t)
    }
    const assignment = await TestAssignment.findOne({ testId: String(test._id), active: true }).lean()
    const attempts = await TestAttempt.countDocuments({ testId: String(test._id) })
    res.json({ success: true, test, questions: items, assignment, attempts, window: R.windowState(test.rules, new Date()) })
  } catch (err) { oops(res, err, 'tests.getOne') }
}

const update = async (req, res) => {
  try {
    const test = await loadTest(req, res)
    if (!test) return
    const { data, error, errors } = await normaliseTest(T(req), req.body || {}, test.toObject())
    if (error) return fail(res, 400, error, { errors })
    const locked = await checkAdvanced(req, data)
    if (locked) return res.status(402).json({ success: false, code: 'MODULE_LOCKED', module: 'tests.advanced', message: `Your plan doesn't include ${locked.join(', ')}.` })
    if (test.status === 'published') {
      const problems = R.ruleProblems(data.rules)
      if (problems.length) return fail(res, 400, problems[0], { problems })
    }
    Object.assign(test, data)
    await test.save()
    res.json({ success: true, test })
  } catch (err) {
    if (err.name === 'ValidationError') return fail(res, 400, err.message)
    oops(res, err, 'tests.update')
  }
}

const duplicate = async (req, res) => {
  try {
    const test = await loadTest(req, res)
    if (!test) return
    const src = test.toObject()
    const copy = await Test.create({
      orgId: src.orgId, ownerTutorId: src.ownerTutorId, ownerName: src.ownerName, kind: src.kind,
      title: str(req.body?.title, 140) || `${src.title} (copy)`, description: src.description, subject: src.subject,
      isTemplate: !!req.body?.asTemplate, status: 'draft', copiedFrom: String(src._id),
      sections: src.sections.map((s) => ({ title: s.title, fixedOrder: s.fixedOrder, items: s.items.map(({ _id, ...it }) => it) })),
      rules: { ...src.rules, opensAt: undefined, closesAt: undefined, lateUntil: undefined }, target: src.target,
    })
    res.status(201).json({ success: true, test: copy })
  } catch (err) { oops(res, err, 'tests.duplicate') }
}

const archive = async (req, res) => {
  try {
    const test = await loadTest(req, res)
    if (!test) return
    test.status = 'archived'
    await test.save()
    await TestAssignment.updateMany({ testId: String(test._id) }, { $set: { active: false } })
    await audit(req, 'test.archive', { targetType: 'test', targetId: String(test._id), orgId: test.orgId })
    res.json({ success: true })
  } catch (err) { oops(res, err, 'tests.archive') }
}

// GET /tests/:id/preview: what a student would get (pools drawn once), with answers for the teacher.
const preview = async (req, res) => {
  try {
    const test = await loadTest(req, res)
    if (!test) return
    const ent = await entitlementsFor(req.actor)
    const items = await engine.buildItems(test.toObject(), {}, { manualAllowed: ent.modules.includes('grading.manual') })
    res.json({ success: true, items: items.map((it) => ({ itemId: it.itemId, section: it.section, sectionTitle: it.sectionTitle, module: it.module, subject: it.subject, points: it.points, marking: it.marking, question: it.q })) })
  } catch (err) { oops(res, err, 'tests.preview') }
}

// ── Assign and publish (TCH-032) ──

async function resolveAssignment(teacher, body = {}) {
  const batchIds = [...new Set((Array.isArray(body.batchIds) ? body.batchIds : []).map(String))].filter(bank.isId)
  const studentIds = [...new Set((Array.isArray(body.studentIds) ? body.studentIds : []).map(String))].filter(bank.isId)
  const excludedStudentIds = [...new Set((Array.isArray(body.excludedStudentIds) ? body.excludedStudentIds : []).map(String))].filter(bank.isId)
  const mine = new Set((await myBatches(teacher)).map((b) => String(b._id)))
  if (batchIds.some((b) => !mine.has(b))) return { error: 'One or more groups are not yours' }
  if (studentIds.length) {
    const allowed = await myStudentIds(teacher)
    if (studentIds.some((s) => !allowed.has(s))) return { error: 'One or more students are not in your groups' }
  }
  if (!batchIds.length && !studentIds.length) return { error: 'Choose at least one group or student' }
  return { data: { batchIds, studentIds, excludedStudentIds, notifyParents: !!body.notifyParents } }
}

// POST /tests/:id/publish { batchIds, studentIds, excludedStudentIds, notifyParents }
const publish = async (req, res) => {
  try {
    const test = await loadTest(req, res)
    if (!test) return
    const t = T(req)
    if (test.isTemplate) return fail(res, 400, 'Templates cannot be assigned. Make a copy first.')
    const problems = R.ruleProblems(test.rules)
    if (!test.rules.alwaysOpen && !test.rules.closesAt && test.kind === 'test') problems.push('Set when the test closes, or make it always open')
    if (problems.length) return fail(res, 400, problems[0], { problems })
    const items = test.sections.flatMap((s) => s.items)
    if (!items.length && !(test.kind === 'practice' && (test.target?.module || test.target?.aiTopic))) return fail(res, 400, 'Add at least one question')
    // Institute: every question students will see must have passed review.
    const notApproved = []
    for (const it of items.filter((x) => x.kind !== 'pool')) {
      const doc = await bank.findQuestion(it.module, it.subject, it.questionId)
      if (!doc || doc.status !== 'approved') notApproved.push(String(it._id))
    }
    if (notApproved.length) return fail(res, 409, 'Some questions are still waiting for review by your admin', { code: 'QUESTIONS_NOT_APPROVED', itemIds: notApproved })
    const { data, error } = await resolveAssignment(t, req.body)
    if (error) return fail(res, 400, error)
    let asg = await TestAssignment.findOne({ testId: String(test._id), active: true })
    const fresh = !asg
    if (asg) Object.assign(asg, data)
    else asg = new TestAssignment({ ...data, orgId: t.orgId, testId: String(test._id), ownerTutorId: t.id })
    await asg.save()
    test.status = 'published'
    await test.save()
    const students = await engine.recipients(asg)
    if (fresh) {
      const phase = R.windowState(test.rules, new Date()).phase
      const when = phase === 'upcoming' ? ` It opens ${new Date(test.rules.opensAt).toUTCString()}.` : ''
      const what = test.kind === 'practice' ? 'New practice' : 'New test'
      await engine.notifyStudents(students, { kind: 'test_assigned', title: `${what}: ${test.title}`, body: `From ${t.name || 'your teacher'}.${when}`, link: `/test/${test._id}` }, { parents: asg.notifyParents, parentMsg: { kind: 'test_assigned', title: `${what} for your child: ${test.title}`, body: when.trim(), link: '/parent-dashboard' } })
    }
    res.json({ success: true, test, assignment: asg, students: students.length })
  } catch (err) { oops(res, err, 'tests.publish') }
}

// POST /tests/:id/remind : a nudge to everyone who hasn't finished.
const remind = async (req, res) => {
  try {
    const test = await loadTest(req, res)
    if (!test) return
    const asg = await TestAssignment.findOne({ testId: String(test._id), active: true })
    if (!asg) return fail(res, 400, 'Assign the test first')
    const done = new Set((await TestAttempt.find({ testId: String(test._id), status: { $ne: 'in_progress' } }).select('studentEmail').lean()).map((a) => a.studentEmail))
    const todo = (await engine.recipients(asg)).filter((s) => !done.has(engine.lower(s.email)))
    await engine.notifyStudents(todo, { kind: 'test_due', title: `Reminder: ${test.title}`, body: str(req.body?.message, 200), link: `/test/${test._id}` }, { parents: !!req.body?.parents })
    res.json({ success: true, reminded: todo.length })
  } catch (err) { oops(res, err, 'tests.remind') }
}

// ── Live monitor (TCH-035) ──

const monitor = async (req, res) => {
  try {
    const test = await loadTest(req, res)
    if (!test) return
    const now = new Date()
    await engine.sweepExpired({ testId: String(test._id) }, now)
    const asg = await TestAssignment.findOne({ testId: String(test._id), active: true }).lean()
    const students = asg ? await engine.recipients(asg) : []
    const attempts = await TestAttempt.find({ testId: String(test._id) }).select('studentEmail status attemptNo startedAt deadlineAt submittedAt currentIndex lastSeenAt items.itemId items.questionId items.answered items.correct items.openedAt items.savedAt items.q.instruction items.q.estimatedSeconds items.needsMarking events').lean()
    const latest = new Map()
    for (const a of attempts) if (!latest.has(a.studentEmail) || latest.get(a.studentEmail).attemptNo < a.attemptNo) latest.set(a.studentEmail, a)
    const perItem = new Map()
    const rows = students.map((s) => {
      const a = latest.get(engine.lower(s.email))
      if (!a) return { studentId: String(s._id), name: s.name, status: 'not_started' }
      for (const it of a.items) {
        if (!perItem.has(it.questionId)) perItem.set(it.questionId, { questionId: it.questionId, instruction: it.q?.instruction || '', answered: 0, correct: 0 })
        if (it.answered && !it.needsMarking) { const p = perItem.get(it.questionId); p.answered++; if (it.correct) p.correct++ }
      }
      const answered = a.items.filter((i) => i.answered).length
      const cur = a.items[a.currentIndex || 0]
      const since = cur?.openedAt ? now - new Date(cur.openedAt) : null
      const expect = (cur?.q?.estimatedSeconds || 60) * 1000
      const stuck = a.status === 'in_progress' && !cur?.answered && since !== null && since > Math.max(3 * expect, 120000)
      const idle = a.status === 'in_progress' && a.lastSeenAt && now - new Date(a.lastSeenAt) > 120000
      return {
        studentId: String(s._id), name: s.name, status: a.status === 'in_progress' ? (stuck ? 'stuck' : idle ? 'idle' : 'working') : 'finished',
        answered, total: a.items.length, currentQuestion: (a.currentIndex || 0) + 1, secondsOnQuestion: since !== null ? Math.round(since / 1000) : null,
        startedAt: a.startedAt, submittedAt: a.submittedAt, deadlineAt: a.deadlineAt, tabSwitches: (a.events || []).filter((e) => e.type === 'tab_hidden').length,
      }
    })
    res.json({
      success: true, now, window: R.windowState(test.rules, now).phase,
      students: rows,
      counts: { notStarted: rows.filter((r) => r.status === 'not_started').length, working: rows.filter((r) => ['working', 'idle', 'stuck'].includes(r.status)).length, stuck: rows.filter((r) => r.status === 'stuck').length, finished: rows.filter((r) => r.status === 'finished').length },
      questions: [...perItem.values()].map((p) => ({ ...p, percentCorrect: p.answered ? Math.round((p.correct / p.answered) * 100) : null })),
    })
  } catch (err) { oops(res, err, 'tests.monitor') }
}

// ── Results and item analysis (TCH-052) ──

async function resultsFor(test) {
  await engine.sweepExpired({ testId: String(test._id) })
  const asg = await TestAssignment.findOne({ testId: String(test._id), active: true }).lean()
  const students = asg ? await engine.recipients(asg) : []
  const attempts = await TestAttempt.find({ testId: String(test._id) }).lean()
  // Students who took it but have since left the group still count.
  const known = new Set(students.map((s) => engine.lower(s.email)))
  const extra = [...new Set(attempts.map((a) => a.studentEmail).filter((e) => !known.has(e)))]
  const gone = extra.length ? await Student.find({ orgId: test.orgId, email: { $in: extra } }).select('name email accommodations').lean() : []
  return buildResults(test, attempts, [...students, ...gone])
}

const results = async (req, res) => {
  try {
    const test = await loadTest(req, res)
    if (!test) return
    const out = await resultsFor(test)
    res.json({ success: true, test: { _id: String(test._id), title: test.title, kind: test.kind, rules: test.rules, resultsReleasedAt: test.resultsReleasedAt, released: !!test.resultsReleasedAt }, ...out })
  } catch (err) { oops(res, err, 'tests.results') }
}

const resultsExport = async (req, res) => {
  try {
    const test = await loadTest(req, res)
    if (!test) return
    const out = await resultsFor(test)
    await audit(req, 'test.results.export', { targetType: 'test', targetId: String(test._id), orgId: test.orgId, meta: { students: out.students.length } })
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="results-${String(test.title).replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}.csv"`)
    res.send(`﻿${resultsCsv(out)}`)
  } catch (err) { oops(res, err, 'tests.export') }
}

// GET /tests/:id/attempts/:attemptId : one attempt with answers (for review and marking).
const attemptDetail = async (req, res) => {
  try {
    const test = await loadTest(req, res)
    if (!test) return
    if (!bank.isId(req.params.attemptId)) return fail(res, 404, 'Attempt not found')
    const a = await TestAttempt.findOne({ _id: req.params.attemptId, testId: String(test._id), orgId: test.orgId }).lean()
    if (!a) return fail(res, 404, 'Attempt not found')
    res.json({ success: true, attempt: a })
  } catch (err) { oops(res, err, 'tests.attempt') }
}

// POST /tests/:id/release : results visible to students and parents now (TCH-042).
const release = async (req, res) => {
  try {
    const test = await loadTest(req, res)
    if (!test) return
    test.resultsReleasedAt = new Date()
    await test.save()
    const done = await TestAttempt.find({ testId: String(test._id), status: { $ne: 'in_progress' }, needsMarking: false })
    await engine.notifyResult(test, done)
    await audit(req, 'test.results.release', { targetType: 'test', targetId: String(test._id), orgId: test.orgId, meta: { attempts: done.length } })
    res.json({ success: true, releasedAt: test.resultsReleasedAt, notified: done.length })
  } catch (err) { oops(res, err, 'tests.release') }
}

// ── Marking (TCH-040/041) ──

// GET /marking?testId= : typed and spoken answers waiting for a mark.
const markingQueue = async (req, res) => {
  try {
    const t = T(req)
    const myTests = await Test.find({ orgId: t.orgId, ownerTutorId: t.id, ...(req.query.testId && bank.isId(req.query.testId) ? { _id: req.query.testId } : {}) }).select('title').lean()
    const titles = Object.fromEntries(myTests.map((x) => [String(x._id), x.title]))
    const attempts = await TestAttempt.find({ orgId: t.orgId, testId: { $in: Object.keys(titles) }, status: { $ne: 'in_progress' }, ...(req.query.all === '1' ? {} : { needsMarking: true }) }).sort({ submittedAt: 1 }).limit(500).lean()
    const queue = []
    for (const a of attempts) {
      for (const it of a.items) {
        if (it.marking !== 'manual' || !it.answered) continue
        if (req.query.all !== '1' && !it.needsMarking) continue
        queue.push({
          attemptId: String(a._id), testId: a.testId, testTitle: titles[a.testId], itemId: it.itemId, studentName: a.studentName, studentEmail: a.studentEmail,
          submittedAt: a.submittedAt, interaction: it.q?.interaction, instruction: it.q?.instruction, prompt: it.q?.prompt, modelAnswer: it.q?.correct_answer,
          keywords: it.q?.speech_scoring?.expected_keywords || [], response: it.response, points: it.points, rubric: it.rubric || [], autoScore: it.autoScore,
          manual: it.manual || null, needsMarking: it.needsMarking,
        })
      }
    }
    res.json({ success: true, queue, quickComments: ['Great effort!', 'Check your spelling.', 'Add one more detail.', 'Read the question again.', 'Lovely clear answer.', 'Nearly there: look at the example.'] })
  } catch (err) { oops(res, err, 'tests.marking') }
}

// POST /tests/:id/attempts/:attemptId/items/:itemId/mark { score?, levels?, comment? }
const markItem = async (req, res) => {
  try {
    const test = await loadTest(req, res)
    if (!test) return
    if (!bank.isId(req.params.attemptId)) return fail(res, 404, 'Attempt not found')
    const a = await TestAttempt.findOne({ _id: req.params.attemptId, testId: String(test._id), orgId: test.orgId })
    if (!a) return fail(res, 404, 'Attempt not found')
    if (a.status === 'in_progress') return fail(res, 409, 'The student is still working on this')
    const it = a.items.find((x) => x.itemId === req.params.itemId)
    if (!it) return fail(res, 404, 'Question not found in this attempt')
    if (it.marking === 'manual') {
      const ent = await entitlementsFor(req.actor)
      if (!ent.modules.includes('grading.manual')) return res.status(402).json({ success: false, code: 'MODULE_LOCKED', module: 'grading.manual', message: 'Marking typed and spoken answers is not part of your plan.' })
    }
    const max = it.points ?? 1
    let score = req.body?.score
    const levels = Array.isArray(req.body?.levels) ? req.body.levels.map(Number) : null
    if (levels && it.rubric?.length) {
      score = it.rubric.reduce((s, c, i) => s + (Number(c.levels?.[levels[i]]?.points) || 0), 0)
    }
    score = Number(score)
    if (!Number.isFinite(score) || score < 0 || score > max) return fail(res, 400, `The mark must be between 0 and ${max}`)
    const wasReleased = R.isReleased(test, a, new Date())
    const before = { score: it.score, comment: it.manual?.comment, pending: !!it.needsMarking }
    it.manual = { score: Math.round(score * 100) / 100, comment: str(req.body?.comment, 1000), levels: levels || [], markedBy: T(req).id, markedByName: T(req).name, markedAt: new Date() }
    engine.markItem(it)
    engine.totals(a)
    a.markModified('items')
    await engine.recordItems(a, test, {})
    await a.save()
    if (wasReleased && !before.pending && before.score !== it.score) {
      await audit(req, 'test.mark.correct', { targetType: 'test_attempt', targetId: String(a._id), orgId: test.orgId, reason: str(req.body?.reason, 300), meta: { itemId: it.itemId, from: before.score, to: it.score } })
      await notify(engine.studentAddr(a.studentEmail), { kind: 'result_updated', title: `Your mark for "${test.title}" was updated`, link: `/test/${test._id}` })
    } else if (!a.needsMarking && R.isReleased(test, a, new Date())) {
      await engine.notifyResult(test, [a])
    }
    res.json({ success: true, item: { itemId: it.itemId, score: it.score, manual: it.manual }, attempt: { score: a.score, maxScore: a.maxScore, percent: a.percent, needsMarking: a.needsMarking } })
  } catch (err) { oops(res, err, 'tests.mark') }
}

// ── Accommodations (TCH-034) ──

const listAccommodations = async (req, res) => {
  try {
    const t = T(req)
    const batches = await myBatches(t)
    const filterBatch = req.query.batchId && bank.isId(req.query.batchId) ? [req.query.batchId] : batches.map((b) => b._id)
    if (req.query.batchId && !batches.some((b) => String(b._id) === req.query.batchId)) return fail(res, 404, 'Group not found')
    const students = await Student.find({ orgId: t.orgId, batchIds: { $in: filterBatch }, status: 'active' }).select('name email batchIds accommodations').sort({ name: 1 }).lean()
    res.json({ success: true, groups: batches.map((b) => ({ _id: String(b._id), name: b.name })), students })
  } catch (err) { oops(res, err, 'tests.accommodations') }
}

const setAccommodations = async (req, res) => {
  try {
    const t = T(req)
    if (!bank.isId(req.params.studentId) || !(await myStudentIds(t)).has(req.params.studentId)) return fail(res, 404, 'Student not found')
    const b = req.body || {}
    const extra = Number(b.extraTime || 1)
    if (![1, 1.25, 1.5, 2].includes(extra)) return fail(res, 400, 'Extra time is x1, x1.25, x1.5 or x2')
    const acc = { extraTime: extra, readAloud: !!b.readAloud, largerText: !!b.largerText, fewerOptions: !!b.fewerOptions, note: str(b.note, 300) }
    const s = await Student.findOneAndUpdate({ _id: req.params.studentId, orgId: t.orgId }, { $set: { accommodations: acc } }, { new: true }).select('name accommodations')
    await audit(req, 'student.accommodations', { targetType: 'student', targetId: req.params.studentId, orgId: t.orgId, meta: acc })
    res.json({ success: true, student: s })
  } catch (err) { oops(res, err, 'tests.setAccommodations') }
}

// ── Practice sets (TCH-060/061) ──

// GET /tests/:id/practice-progress : for module practice sets ("15 min of Listen · Maths").
const practiceProgress = async (req, res) => {
  try {
    const test = await loadTest(req, res)
    if (!test) return
    if (test.kind !== 'practice' || !test.target?.module) return fail(res, 400, 'Not a module practice set')
    const asg = await TestAssignment.findOne({ testId: String(test._id), active: true }).lean()
    const students = asg ? await engine.recipients(asg) : []
    const since = (asg?.createdAt || test.createdAt).toISOString().slice(0, 10)
    const key = `${test.target.module}_${test.target.subject || 'english'}`
    const days = await LearnerDay.find({ email: { $in: students.map((s) => engine.lower(s.email)) }, date: { $gte: since } }).select('email byModuleSubject').lean()
    const mins = {}
    for (const d of days) mins[d.email] = (mins[d.email] || 0) + (d.byModuleSubject?.[key]?.minutes || 0)
    res.json({ success: true, target: test.target, students: students.map((s) => ({ studentId: String(s._id), name: s.name, minutes: Math.round((mins[engine.lower(s.email)] || 0) * 10) / 10, done: (mins[engine.lower(s.email)] || 0) >= (test.target.minutes || 0) })) })
  } catch (err) { oops(res, err, 'tests.practiceProgress') }
}

// GET /tests/:id/practice-suggestions : after a test, practice on what each student missed.
async function suggestionsFor(teacher, test) {
  const attempts = await TestAttempt.find({ testId: String(test._id), status: { $ne: 'in_progress' } }).lean()
  const byStudent = new Map()
  for (const a of attempts) if (!byStudent.has(a.studentEmail) || byStudent.get(a.studentEmail).percent < a.percent) byStudent.set(a.studentEmail, a)
  const out = []
  for (const a of byStudent.values()) {
    const missed = a.items.filter((i) => !i.needsMarking && !i.correct)
    if (!missed.length) continue
    const skills = [...new Set(missed.flatMap((i) => i.q?.skillIds || []))].slice(0, 5)
    const exclude = new Set(a.items.map((i) => i.questionId))
    let picks = []
    if (skills.length) {
      for (const source of ['mine', 'school', 'learnigo']) {
        if (picks.length >= 5) break
        const drawn = await bank.drawPool(teacher, { source, skillIds: skills, count: 5 - picks.length }, exclude)
        drawn.forEach((d) => exclude.add(String(d.doc._id)))
        picks.push(...drawn.map((d) => ({ module: d.module, subject: d.subject, questionId: String(d.doc._id), instruction: d.doc.instruction || '' })))
      }
    }
    // Nothing tagged alike: practise the missed questions themselves.
    if (!picks.length) picks = missed.slice(0, 5).map((i) => ({ module: i.module, subject: i.subject, questionId: i.questionId, instruction: i.q?.instruction || '' }))
    const student = await Student.findOne({ orgId: test.orgId, email: a.studentEmail }).select('name').lean()
    if (student) out.push({ studentId: String(student._id), name: student.name, percent: a.percent, missed: missed.length, skills, questions: picks })
  }
  return out
}

const practiceSuggestions = async (req, res) => {
  try {
    const test = await loadTest(req, res)
    if (!test) return
    res.json({ success: true, suggestions: await suggestionsFor(T(req), test) })
  } catch (err) { oops(res, err, 'tests.suggestions') }
}

// POST /tests/:id/practice-suggestions/approve { studentIds: [] } : one practice set per student.
const approveSuggestions = async (req, res) => {
  try {
    const test = await loadTest(req, res)
    if (!test) return
    const t = T(req)
    const want = new Set((Array.isArray(req.body?.studentIds) ? req.body.studentIds : []).map(String))
    const allowed = await myStudentIds(t)
    const created = []
    for (const s of await suggestionsFor(t, test)) {
      if (!want.has(s.studentId) || !allowed.has(s.studentId)) continue
      const p = await Test.create({
        orgId: t.orgId, ownerTutorId: t.id, ownerName: t.name, kind: 'practice', status: 'published', title: `Practice after ${test.title}`.slice(0, 140),
        description: s.skills.length ? `Skills: ${s.skills.join(', ')}` : 'The questions you found tricky', rules: PRACTICE_RULES,
        sections: [{ title: '', items: s.questions.map((q) => ({ kind: 'question', module: q.module, subject: q.subject, questionId: q.questionId, points: 1 })) }],
        copiedFrom: String(test._id),
      })
      await TestAssignment.create({ orgId: t.orgId, testId: String(p._id), ownerTutorId: t.id, studentIds: [s.studentId] })
      const st = await Student.findById(s.studentId).select('email').lean()
      if (st?.email) await engine.notifyStudents([st], { kind: 'test_assigned', title: `New practice: ${p.title}`, link: `/test/${p._id}` })
      created.push({ studentId: s.studentId, testId: String(p._id) })
    }
    res.status(201).json({ success: true, created })
  } catch (err) { oops(res, err, 'tests.approveSuggestions') }
}

// GET /groups : the teacher's groups with students (for the assign picker).
const groups = async (req, res) => {
  try {
    const t = T(req)
    const batches = await myBatches(t)
    const students = await Student.find({ orgId: t.orgId, batchIds: { $in: batches.map((b) => b._id) }, status: 'active' }).select('name email batchIds accommodations').sort({ name: 1 }).lean()
    res.json({ success: true, groups: batches.map((b) => ({ _id: String(b._id), name: b.name, students: students.filter((s) => (s.batchIds || []).some((x) => String(x) === String(b._id))).map((s) => ({ _id: String(s._id), name: s.name, accommodations: s.accommodations })) })) })
  } catch (err) { oops(res, err, 'tests.groups') }
}

module.exports = {
  presets, list, create, getOne, update, duplicate, archive, preview, publish, remind, monitor, results, resultsExport, attemptDetail, release,
  markingQueue, markItem, listAccommodations, setAccommodations, practiceProgress, practiceSuggestions, approveSuggestions, groups,
  countedAttempt, PRACTICE_RULES,
}
