// Teacher performance views (TCH-050..056) and the student profile with private notes (TCH-013).
// Every number comes from the shared analytics layer (analytics/queries.js); this file only
// decides WHO is in scope (the teacher's own groups in this workspace) and shapes the answer.
const Batch = require('../models/admin/Batch')
const Student = require('../models/admin/Student')
const TeacherNote = require('../models/admin/TeacherNote')
const LearnerDay = require('../models/analytics/LearnerDay')
const QuestionUploadBatch = require('../models/superadmin/QuestionUploadBatch')
const q = require('../analytics/queries')
const { buildStory } = require('../analytics/insights')
const { MODULES, SUBJECTS } = require('../utils/metrics')
const batchService = require('../services/batchService')
const { HttpError, isId, idStr, context, myGroup, myGroups, handle, safeTz } = require('../services/teacherContext')
const { parentStatusFor } = require('../services/teacherParents')
const { findingsInput } = require('../services/arFindingRows')

const lower = (s) => String(s || '').toLowerCase()
const tzOf = (req) => safeTz(req.get('x-timezone') || req.query.tz)
const CELLS = SUBJECTS.flatMap((s) => MODULES.map((m) => ({ key: `${m}_${s}`, module: m, subject: s })))
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// Students (active) in the given groups, with a lowercase email -> student map.
async function studentsIn(ctx, groups) {
  const ids = [...new Set(groups.flatMap((g) => g.studentIds.map(String)))]
  const students = await Student.find({ _id: { $in: ids }, orgId: ctx.orgId, status: 'active' }).select('name email grade').sort({ name: 1 }).lean()
  const byEmail = new Map(students.filter((s) => s.email).map((s) => [lower(s.email), s]))
  return { students, byEmail, emails: [...byEmail.keys()] }
}

const groupsOf = (groups, studentId) => groups.filter((g) => g.studentIds.some((x) => idStr(x) === idStr(studentId))).map((g) => ({ id: String(g._id), name: g.name, emoji: g.emoji || '', color: g.color || '' }))

function weekdayAndTime(tz) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date())
  const get = (t) => parts.find((p) => p.type === t)?.value
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
  return { dow, now: `${get('hour')}:${get('minute')}` }
}

// GET /today: today's classes, who needs attention, recent wins, getting-started checklist.
const today = handle(async (req, res) => {
  const ctx = await context(req)
  const tz = tzOf(req)
  const groups = await Batch.find({ orgId: ctx.orgId, tutorIds: ctx.tutorId, status: 'active' }).populate('subjects.subject', 'name').lean()
  const { dow, now } = weekdayAndTime(tz)
  const classes = []
  for (const g of groups) {
    for (const a of g.subjects || []) {
      for (const slot of a.schedule || []) {
        if (slot.dayOfWeek !== dow) continue
        classes.push({
          groupId: String(g._id), groupName: g.name, emoji: g.emoji || '', color: g.color || '', subject: a.subject?.name || '',
          startTime: slot.startTime, endTime: slot.endTime, studentCount: (g.studentIds || []).length,
          state: slot.endTime <= now ? 'done' : slot.startTime <= now ? 'now' : 'later',
        })
      }
    }
  }
  classes.sort((a, b) => a.startTime.localeCompare(b.startTime))

  const { students, byEmail, emails } = await studentsIn(ctx, groups)
  const end = q.todayIn(tz)
  const [cur, prev, ov, recent] = await Promise.all([
    q.perLearner(emails, { tz, to: end }),
    q.perLearner(emails, { tz, from: q.addDays(end, -13), to: q.addDays(end, -7) }),
    q.overview(emails, { tz, to: end }),
    emails.length ? LearnerDay.exists({ email: { $in: emails }, date: { $gte: q.addDays(end, -30) } }) : null,
  ])
  const prevBy = new Map(prev.rows.map((r) => [r.email, r]))
  const who = (email) => byEmail.get(email)
  const attention = cur.rows.filter((r) => r.atRisk && who(r.email)).map((r) => ({
    studentId: String(who(r.email)._id), name: who(r.email).name, reason: r.riskReason, lastActive: r.lastActive, accuracy: r.accuracy,
    groups: groupsOf(groups, who(r.email)._id),
  }))
  const wins = []
  for (const r of cur.rows) {
    const s = who(r.email)
    if (!s) continue
    const p = prevBy.get(r.email)
    if (r.answered >= 10 && p?.accuracy != null && r.accuracy != null && r.accuracy - p.accuracy >= 10) {
      wins.push({ studentId: String(s._id), name: s.name, kind: 'accuracy_up', value: Math.round(r.accuracy - p.accuracy), accuracy: r.accuracy })
    } else if (r.activeDays >= 5) {
      wins.push({ studentId: String(s._id), name: s.name, kind: 'consistent', value: r.activeDays })
    } else if (r.answered >= 40 && r.accuracy >= 85) {
      wins.push({ studentId: String(s._id), name: s.name, kind: 'high_accuracy', value: r.accuracy })
    }
  }
  wins.sort((a, b) => (a.kind === 'accuracy_up' ? -1 : 0) - (b.kind === 'accuracy_up' ? -1 : 0) || b.value - a.value)

  // Checklist step 3: a test or practice set this teacher has published (assigned).
  const Test = require('../models/tests/Test')
  const assignedSomething = Boolean(await Test.exists({ orgId: String(ctx.orgId), ownerTutorId: String(ctx.tutorId), status: 'published' }))
  res.json({
    success: true, tz, date: end, weekday: dow,
    classes,
    attention: attention.slice(0, 12), attentionCount: attention.length,
    wins: wins.slice(0, 6),
    week: { totals: ov.cur, previous: ov.prev, deltas: ov.deltas, series: q.series(ov.days, ov.range).points.map((p) => p.minutes), story: buildStory({ cur: ov.cur, prev: ov.prev, who: 'Your students', rangeLabel: 'in the last 7 days' }) },
    counts: { groups: groups.length, students: students.length, studentsWithoutEmail: students.filter((s) => !s.email).length },
    checklist: {
      group: groups.length > 0,
      students: students.length > 0,
      practice: assignedSomething,
      results: !!recent,
      dismissed: false,
    },
  })
})

// Student x (subject x module) grid for one group (TCH-051 heatmap, TCH-053 coverage).
async function groupGrid(ctx, req, batch) {
  const tz = tzOf(req)
  const range = q.parseRange({ ...req.query, cmp: 'none', tz })
  const students = await Student.find({ _id: { $in: batch.studentIds }, orgId: ctx.orgId, status: 'active' }).select('name email').sort({ name: 1 }).lean()
  const emails = students.map((s) => lower(s.email)).filter(Boolean)
  const [days, perL] = await Promise.all([q.fetchDays(emails, range.from, range.to), q.perLearner(emails, { ...req.query, tz })])
  const byEmail = new Map()
  for (const d of days) { if (!byEmail.has(d.email)) byEmail.set(d.email, []); byEmail.get(d.email).push(d) }
  const risk = new Map(perL.rows.map((r) => [r.email, r]))
  const rows = students.map((s) => {
    const mine = byEmail.get(lower(s.email)) || []
    const m = q.matrix(mine)
    const t = q.totals(mine, range.days)
    const cells = Object.fromEntries(CELLS.map((c) => {
      const v = m[c.subject][c.module]
      return [c.key, { answered: v.answered, accuracy: v.accuracy, minutes: v.minutes, mastery: v.mastery }]
    }))
    const r = risk.get(lower(s.email))
    return {
      studentId: String(s._id), name: s.name, email: lower(s.email), hasEmail: !!s.email, cells,
      totals: { answered: t.answered, accuracy: t.accuracy, minutes: Math.round(t.minutes), activeDays: t.activeDays },
      atRisk: !!r?.atRisk, riskReason: r?.riskReason || null,
    }
  })
  rows.sort((a, b) => Number(b.atRisk) - Number(a.atRisk) || a.name.localeCompare(b.name))
  const columns = CELLS.map((c) => {
    const touched = rows.filter((r) => r.cells[c.key].answered > 0).length
    const mastered = rows.filter((r) => r.cells[c.key].mastery === 'mastered').length
    return { ...c, touched, mastered, of: rows.length }
  })
  return { range, rows, columns, matrix: q.matrix(days) }
}

// GET /groups/:id/heatmap
const heatmap = handle(async (req, res) => {
  const ctx = await context(req)
  const batch = await myGroup(ctx, req.params.id)
  const grid = await groupGrid(ctx, req, batch)
  res.json({ success: true, group: { id: String(batch._id), name: batch.name }, ...grid })
})

// GET /groups/compare: the teacher's own groups side by side (TCH-051 "compare with my other groups").
const compareGroups = handle(async (req, res) => {
  const ctx = await context(req)
  const tz = tzOf(req)
  const groups = (await myGroups(ctx)).filter((g) => g.groupKind !== 'practice')
  const out = []
  for (const g of groups) {
    const students = await Student.find({ _id: { $in: g.studentIds }, orgId: ctx.orgId, status: 'active' }).select('email').lean()
    const emails = students.map((s) => lower(s.email)).filter(Boolean)
    const o = await q.overview(emails, { ...req.query, tz })
    out.push({
      id: String(g._id), name: g.name, emoji: g.emoji || '', color: g.color || '', students: students.length,
      activeLearners: o.cur.learners, minutesPerStudent: students.length ? Math.round(o.cur.minutes / students.length) : null,
      accuracy: o.cur.accuracy, accuracyDelta: o.deltas?.accuracy ?? null, engagement: o.cur.engagement, answered: o.cur.answered,
    })
  }
  res.json({ success: true, range: q.parseRange({ ...req.query, tz }), groups: out })
})

// GET /groups/:id/suggestions: "these 4 students are all stuck on Read · Maths" (TCH-055).
const suggestions = handle(async (req, res) => {
  const ctx = await context(req)
  const batch = await myGroup(ctx, req.params.id)
  const { rows } = await groupGrid(ctx, req, batch)
  const need = rows.length < 8 ? 2 : 3
  const list = []
  for (const c of CELLS) {
    const stuck = rows.filter((r) => r.cells[c.key].answered >= 5 && r.cells[c.key].accuracy != null && r.cells[c.key].accuracy < 60)
    if (stuck.length >= need) {
      list.push({
        module: c.module, subject: c.subject, title: `${cap(c.module)} · ${cap(c.subject)}`,
        students: stuck.map((r) => ({ id: r.studentId, name: r.name, accuracy: r.cells[c.key].accuracy })).sort((a, b) => a.accuracy - b.accuracy),
      })
    }
  }
  list.sort((a, b) => b.students.length - a.students.length)
  res.json({ success: true, suggestions: list.slice(0, 6) })
})

// POST /groups/suggested { fromGroupId, studentIds, module, subject }: a temporary practice group.
const createSuggestedGroup = handle(async (req, res) => {
  const ctx = await context(req)
  if (!ctx.canCreateGroups) throw new HttpError(403, 'Your school has not turned on teacher-created groups.', { code: 'POLICY_BLOCKED' })
  const from = await myGroup(ctx, req.body?.fromGroupId)
  const inFrom = new Set(from.studentIds.map(idStr))
  const ids = [...new Set((req.body?.studentIds || []).map(String))].filter((id) => inFrom.has(id))
  if (!ids.length) throw new HttpError(400, 'Choose students from the group')
  const m = MODULES.includes(req.body?.module) ? req.body.module : null
  const s = SUBJECTS.includes(req.body?.subject) ? req.body.subject : null
  const title = m && s ? `${cap(m)} · ${cap(s)}` : 'Extra practice'
  const batch = await Batch.create({
    name: `Practice: ${title} (${from.name})`.slice(0, 80), orgId: ctx.orgId, directTutorIds: [ctx.tutorId], tutorIds: [ctx.tutorId],
    createdByTutorId: ctx.tutorId, groupKind: 'practice', emoji: '🎯', color: from.color || '', gradeBand: from.gradeBand || '',
    description: `Made from ${from.name} for students who need more practice on ${title}.`,
  })
  await batchService.addStudentsToBatch(batch._id, ids)
  await batchService.recomputeTutorDerivedFields(ctx.tutorId)
  res.status(201).json({ success: true, group: { _id: batch._id, name: batch.name, groupKind: 'practice', studentCount: ids.length } })
})

// GET /summary: "my teaching summary" (TCH-056), what the admin will see about me (ADM-041).
// testsCreated is 0 until the tests module exists; replyTimeHours is null until messaging exists.
const summary = handle(async (req, res) => {
  const ctx = await context(req)
  const tz = tzOf(req)
  const groups = (await myGroups(ctx)).filter((g) => g.groupKind !== 'practice')
  const { students, emails } = await studentsIn(ctx, groups)
  const o = await q.overview(emails, { ...req.query, tz })
  const uploads = await QuestionUploadBatch.aggregate([
    { $match: { submittedByTutorId: String(ctx.tutorId), orgId: String(ctx.orgId) } },
    { $group: { _id: '$status', rows: { $sum: '$rowCount' } } },
  ])
  const qBy = Object.fromEntries(uploads.map((u) => [u._id, u.rows]))
  res.json({
    success: true,
    range: o.range,
    groups: groups.length,
    students: students.length,
    activeStudents: o.cur.learners,
    minutesPerStudent: students.length ? Math.round(o.cur.minutes / students.length) : null,
    accuracy: o.cur.accuracy,
    growth: o.deltas?.accuracy ?? null,
    engagement: o.cur.engagement,
    questionsContributed: (qBy.approved || 0) + (qBy.pending || 0) + (qBy.rejected || 0),
    questionsApproved: qBy.approved || 0,
    testsCreated: 0,
    replyTimeHours: null,
    notes: {
      testsCreated: 'Counts tests once the tests module (TCH-030) is built.',
      replyTimeHours: 'Shown once messaging (TCH-070) is built.',
    },
  })
})

// ── Student profile (TCH-013) ───────────────────────────────────────────────

// A student in one of MY groups in this workspace, or 404.
async function myStudent(ctx, id) {
  if (!isId(id)) throw new HttpError(404, 'Student not found')
  const groups = await Batch.find({ orgId: ctx.orgId, tutorIds: ctx.tutorId, studentIds: id }).select('name emoji color status').lean()
  if (!groups.length) throw new HttpError(404, 'Student not found')
  const student = await Student.findOne({ _id: id, orgId: ctx.orgId }).lean()
  if (!student) throw new HttpError(404, 'Student not found')
  return { student, groups }
}

const noteView = (n) => ({ _id: n._id, body: n.body, pinned: n.pinned, createdAt: n.createdAt, updatedAt: n.updatedAt })

// Camera games (AR) for the profile: this period's rounds and the equal period's before
// them, for the shared findings engine (client/src/ar/insights/findings.js). `?arDays=`
// picks the period (7..120, default 28). Only ever read AFTER myStudent() has said this
// student is in one of my groups: the same check as every other part of the profile.
const AR_DAYS = { min: 7, max: 120, def: 28 }
function cameraGamesFor(student, req) {
  if (!student.email) return null
  const asked = parseInt(req.query.arDays)
  const days = Number.isFinite(asked) ? Math.min(Math.max(asked, AR_DAYS.min), AR_DAYS.max) : AR_DAYS.def
  return findingsInput(lower(student.email), { to: q.todayIn(tzOf(req)), days })
}

// GET /students/:id/profile[?arDays=28]
const studentProfile = handle(async (req, res) => {
  const ctx = await context(req)
  const { student, groups } = await myStudent(ctx, req.params.id)
  const [[parents], notes, cameraGames] = await Promise.all([
    parentStatusFor(ctx.orgId, [student]),
    TeacherNote.find({ orgId: ctx.orgId, tutorId: ctx.tutorId, studentId: student._id }).sort({ pinned: -1, createdAt: -1 }).limit(100).lean(),
    cameraGamesFor(student, req),
  ])
  res.json({
    success: true,
    student: { id: String(student._id), name: student.name, email: student.email || '', grade: student.grade, age: student.age, status: student.status },
    groups: groups.map((g) => ({ id: String(g._id), name: g.name, emoji: g.emoji || '', color: g.color || '', archived: g.status !== 'active' })),
    parents,
    notes: notes.map(noteView),
    hasAnalytics: !!student.email,
    cameraGames,
  })
})

const noteBody = (b) => {
  const body = String(b ?? '').trim()
  if (!body) throw new HttpError(400, 'Write something first')
  if (body.length > 2000) throw new HttpError(400, 'Notes can be up to 2,000 characters')
  return body
}

// POST /students/:id/notes { body, pinned }
const addNote = handle(async (req, res) => {
  const ctx = await context(req)
  const { student } = await myStudent(ctx, req.params.id)
  const note = await TeacherNote.create({ orgId: ctx.orgId, tutorId: ctx.tutorId, studentId: student._id, body: noteBody(req.body?.body), pinned: !!req.body?.pinned })
  res.status(201).json({ success: true, note: noteView(note) })
})

// GET /students/:id/notes
const listNotes = handle(async (req, res) => {
  const ctx = await context(req)
  const { student } = await myStudent(ctx, req.params.id)
  const notes = await TeacherNote.find({ orgId: ctx.orgId, tutorId: ctx.tutorId, studentId: student._id }).sort({ pinned: -1, createdAt: -1 }).limit(100).lean()
  res.json({ success: true, notes: notes.map(noteView) })
})

// PATCH /students/:id/notes/:noteId { body?, pinned? } and DELETE: only my own notes.
async function myNote(ctx, req) {
  if (!isId(req.params.noteId)) throw new HttpError(404, 'Note not found')
  const note = await TeacherNote.findOne({ _id: req.params.noteId, studentId: req.params.id, orgId: ctx.orgId, tutorId: ctx.tutorId })
  if (!note) throw new HttpError(404, 'Note not found')
  return note
}

const updateNote = handle(async (req, res) => {
  const ctx = await context(req)
  const note = await myNote(ctx, req)
  if (req.body?.body !== undefined) note.body = noteBody(req.body.body)
  if (typeof req.body?.pinned === 'boolean') note.pinned = req.body.pinned
  await note.save()
  res.json({ success: true, note: noteView(note) })
})

const deleteNote = handle(async (req, res) => {
  const ctx = await context(req)
  const note = await myNote(ctx, req)
  await note.deleteOne()
  res.json({ success: true })
})

module.exports = { today, heatmap, compareGroups, suggestions, createSuggestedGroup, summary, studentProfile, addNote, listNotes, updateNote, deleteNote }
