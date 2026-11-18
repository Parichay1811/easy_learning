// School-wide analytics (ADM-040..046). Same numbers as every other role:
// learners in scope come from utils/scopes.js forAdmin (which applies staff
// unit limits), and every figure is summed from LearnerDay via analytics/queries.js.
const q = require('../analytics/queries')
const { buildInsights } = require('../analytics/insights')
const { forAdmin } = require('../utils/scopes')
const tree = require('../utils/orgUnits')
const { allowedUnits, studentInScope } = require('../utils/orgAccess')
const { termsAround } = require('../utils/schoolCalendar')
const { masteryLevel, pct, SUBJECTS } = require('../utils/metrics')

const lower = (s) => String(s || '').toLowerCase()
const bad = (message, status = 400) => Object.assign(new Error(message), { status })
const h = (fn) => async (req, res) => {
  try { res.json({ success: true, ...(await fn(req)) }) } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    console.error('school analytics error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// Optional models other features add later (tests). Feature detection, never a crash.
function optionalModel(...paths) {
  for (const p of paths) { try { return require(p) } catch { /* not built yet */ } }
  return null
}
const testModel = () => optionalModel('../models/Test', '../models/tests/Test', '../models/admin/Test')

async function scopeOf(req, opts = {}) {
  const scope = await forAdmin(req.admin, opts)
  if (scope.error) throw bad(scope.error.message, scope.error.status)
  return scope
}

// Range from the query, or a whole academic term (?termId=) compared with the term before it.
async function rangeOf(req) {
  const tz = req.get('x-timezone') || req.query.tz || 'UTC'
  if (req.query.termId) {
    const AcademicYear = require('../models/admin/AcademicYear')
    const years = await AcademicYear.find({ orgId: req.org._id }).lean()
    const { all } = termsAround(years, q.todayIn(tz))
    const i = all.findIndex((t) => t.id === String(req.query.termId))
    if (i < 0) throw bad('Term not found', 404)
    const term = all[i]
    const today = q.todayIn(tz)
    const to = term.end < today ? term.end : today
    const range = q.parseRange({ from: term.start, to, cmp: 'none', tz })
    const before = all[i - 1]
    if (before) range.prev = { from: before.start, to: q.addDays(before.start, Math.min(range.days, q.daysBetween(before.start, before.end) + 1) - 1) }
    range.term = { id: term.id, name: term.name, previous: before ? before.name : null }
    return { range, tz }
  }
  return { range: q.parseRange({ ...req.query, tz }), tz }
}

// Units in scope + who is in each (for the sunburst, heatmap and lists).
async function structureFor(req, scope) {
  const structure = await tree.loadStructure(req.org._id)
  const allowed = await allowedUnits(req)
  const inScope = new Set(scope.emails)
  const units = allowed ? structure.units.filter((u) => allowed.has(String(u._id))) : structure.units
  const groups = units.map((u) => {
    const m = tree.membersOf(structure, tree.subtreeIdSet(structure.units, [u._id]))
    return { key: String(u._id), name: u.name, type: u.type, parentId: u.parentId ? String(u.parentId) : null, emails: m.students.map((s) => lower(s.email)).filter((e) => e && inScope.has(e)) }
  })
  return { structure, units, groups }
}

const rangeWords = (range) => (range.term ? `in ${range.term.name}` : range.days === 1 ? 'today' : range.days === 7 ? 'this week' : `in the last ${range.days} days`)

// ADM-040 School overview: story, tiles, sunburst, grade x subject heatmap, trends.
const overview = h(async (req) => {
  const unitId = req.query.unitId || undefined
  const scope = await scopeOf(req, { unitId })
  const { range, tz } = await rangeOf(req)
  const emails = scope.emails
  const [curDays, prevDays, perCur, subjCur, subjPrev, learnersRes, sizes] = await Promise.all([
    q.fetchDays(emails, range.from, range.to),
    range.prev ? q.fetchDays(emails, range.prev.from, range.prev.to) : [],
    q.perEmailTotals(emails, range.from, range.to),
    q.perEmailSubjects(emails, range.from, range.to),
    range.prev ? q.perEmailSubjects(emails, range.prev.from, range.prev.to) : new Map(),
    q.perLearner(emails, { from: range.from, to: range.to, tz }),
    structureFor(req, scope),
  ])
  const cur = q.totals(curDays, range.days)
  const prev = range.prev ? q.totals(prevDays, range.days) : null
  const n = emails.length
  const active = [...perCur.values()].filter((r) => r.activeDays > 0).length
  // Mastery: share of (learner, subject) pairs at Practising or Mastered.
  let pairs = 0, good = 0
  for (const subj of subjCur.values()) for (const v of Object.values(subj)) {
    const level = masteryLevel(v.answered, pct(v.correct, v.answered))
    if (level === 'not_started') continue
    pairs++; if (level === 'practising' || level === 'mastered') good++
  }
  const Child = require('../models/Child')
  const linked = n ? (await Child.distinct('email', { email: { $in: emails }, linkStatus: 'verified' })).length : 0
  const Test = testModel()
  const atRisk = learnersRes.rows.filter((r) => r.atRisk).length
  const tiles = {
    learners: n,
    activePct: pct(active, n),
    activeLearners: active,
    minutesPerStudent: n ? Math.round((cur.minutes / n) * 10) / 10 : null,
    prevMinutesPerStudent: prev && n ? Math.round((prev.minutes / n) * 10) / 10 : null,
    accuracy: cur.accuracy, prevAccuracy: prev?.accuracy ?? null,
    masteryPct: pct(good, pairs),
    testsCompleted: null, testsAvailable: Boolean(Test),
    atRisk,
    parentsLinkedPct: pct(linked, n), parentsLinked: linked,
  }

  // Sunburst (units sized by students, coloured by engagement); flat groups when there is no tree.
  const { structure, units, groups } = sizes
  let sunburst
  if (units.length) {
    const rolled = new Map(q.rollupGroups(groups, perCur, range.days).map((r) => [r.key, r]))
    const nodes = units.map((u) => ({ id: String(u._id), name: u.name, type: u.type, parentId: u.parentId ? String(u.parentId) : null, learners: rolled.get(String(u._id))?.learners || 0, engagement: rolled.get(String(u._id))?.engagement ?? null, activePct: rolled.get(String(u._id))?.activePct ?? null }))
    sunburst = { kind: 'tree', nodes: tree.buildTree(nodes.map((x) => ({ ...x, _id: x.id, order: 0 }))).map(strip) }
  } else {
    const inScope = new Set(emails)
    const byBatch = structure.batches.filter((b) => !b.archivedAt).map((b) => ({ key: String(b._id), name: b.name, emails: structure.students.filter((s) => (s.batchIds || []).some((x) => String(x) === String(b._id))).map((s) => lower(s.email)).filter((e) => inScope.has(e)) }))
    sunburst = { kind: 'groups', nodes: q.rollupGroups(byBatch, perCur, range.days).map((r) => ({ id: r.key, name: r.name, learners: r.learners, engagement: r.engagement, activePct: r.activePct, children: [] })) }
  }

  // Grade x subject heatmap (grades, else sections, else groups), with change vs the previous period.
  const gradeGroups = groups.filter((g) => g.type === 'grade')
  const rowsSource = gradeGroups.length ? gradeGroups : groups.filter((g) => g.type === 'section').length ? groups.filter((g) => g.type === 'section') : sunburst.kind === 'groups'
    ? structure.batches.filter((b) => !b.archivedAt).map((b) => ({ key: String(b._id), name: b.name, emails: structure.students.filter((s) => (s.batchIds || []).some((x) => String(x) === String(b._id))).map((s) => lower(s.email)) }))
    : []
  const prevGrid = new Map(q.subjectGrid(rowsSource, subjPrev).map((r) => [r.key, r.cells]))
  const heatmap = {
    rowsAre: gradeGroups.length ? 'grade' : groups.some((g) => g.type === 'section') ? 'section' : 'group',
    subjects: SUBJECTS,
    rows: q.subjectGrid(rowsSource, subjCur).map((r) => ({
      id: r.key, name: r.name, learners: rowsSource.find((x) => x.key === r.key).emails.length,
      cells: Object.fromEntries(SUBJECTS.map((s) => [s, { ...r.cells[s], prevAccuracy: prevGrid.get(r.key)?.[s]?.accuracy ?? null, delta: r.cells[s].accuracy != null && prevGrid.get(r.key)?.[s]?.accuracy != null ? r.cells[s].accuracy - prevGrid.get(r.key)[s].accuracy : null }])),
    })),
  }

  // The story: active share, the biggest dip (with enough answers), and who needs a nudge.
  let dip = null
  for (const r of heatmap.rows) for (const s of SUBJECTS) {
    const c = r.cells[s]
    if (c.delta != null && c.answered >= 20 && (!dip || c.delta < dip.delta)) dip = { row: r.name, subject: s, delta: c.delta }
  }
  const parts = [n ? `${tiles.activePct ?? 0} % of students were active ${rangeWords(range)}` : 'No students in this view yet']
  if (dip && dip.delta <= -5) parts.push(`${dip.row} ${dip.subject[0].toUpperCase()}${dip.subject.slice(1)} dipped ${-dip.delta} points`)
  if (n) parts.push(atRisk ? `${atRisk} ${atRisk === 1 ? 'student needs' : 'students need'} a nudge` : 'nobody needs a nudge')
  const story = `${parts.join('; ')}.`

  const matrix = q.matrix(curDays)
  const patterns = q.patterns(curDays)
  return {
    who: scope.who, range, tiles, story, dip,
    totals: cur, previous: prev,
    insights: buildInsights({ cur, prev, matrix, patterns, streak: null, who: scope.who, rangeDays: range.days }),
    series: q.series(curDays, range), prevSeries: range.prev ? q.series(prevDays, { ...range, from: range.prev.from, to: range.prev.to }) : null,
    sunburst, heatmap, matrix,
  }
})
const strip = (n) => ({ id: n.id, name: n.name, type: n.type, learners: n.learners, engagement: n.engagement, activePct: n.activePct, children: (n.children || []).map(strip) })

// Teachers in scope, with the groups they teach.
function teachersInScope(structure, allowed) {
  if (!allowed) return structure.tutors
  return tree.membersOf(structure, allowed).tutors
}
const teachesBatch = (b, id) => (b.tutorIds || []).some((x) => String(x) === String(id))

// ADM-041 Teacher overview: support, not ranking. Default sort by name, with class context.
const teachers = h(async (req) => {
  const { range } = await rangeOf(req)
  const prevRange = range.prev || { from: q.addDays(range.from, -range.days), to: q.addDays(range.from, -1) }
  const structure = await tree.loadStructure(req.org._id)
  const allowed = await allowedUnits(req)
  const list = teachersInScope(structure, allowed)
  const emailsOf = (batches) => {
    const ids = new Set(batches.map((b) => String(b._id)))
    return [...new Set(structure.students.filter((s) => (s.batchIds || []).some((x) => ids.has(String(x)))).map((s) => lower(s.email)).filter(Boolean))]
  }
  const rows0 = list.map((t) => {
    const batches = structure.batches.filter((b) => !b.archivedAt && teachesBatch(b, t._id))
    return { t, batches, emails: emailsOf(batches) }
  })
  const all = [...new Set(rows0.flatMap((r) => r.emails))]
  const [cur, prev] = await Promise.all([q.perEmailTotals(all, range.from, range.to), q.perEmailTotals(all, prevRange.from, prevRange.to)])
  const QUB = require('../models/superadmin/QuestionUploadBatch')
  const uploads = await QUB.aggregate([
    { $match: { orgId: String(req.org._id) } },
    { $group: { _id: '$submittedByTutorId', uploads: { $sum: 1 }, questions: { $sum: '$rowCount' }, approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$rowCount', 0] } }, reviewed: { $sum: { $cond: [{ $ne: ['$status', 'pending'] }, '$rowCount', 0] } } } },
  ])
  const up = new Map(uploads.map((u) => [String(u._id), u]))
  const Test = testModel()
  const testCounts = new Map()
  if (Test) {
    try {
      const rows = await Test.aggregate([{ $match: { orgId: { $in: [req.org._id, String(req.org._id)] } } }, { $group: { _id: { $ifNull: ['$createdBy', '$tutorId'] }, n: { $sum: 1 } } }])
      for (const r of rows) testCounts.set(String(r._id), r.n)
    } catch { /* different shape: leave empty */ }
  }
  const pooled = (map, emails) => {
    let a = 0, c = 0
    for (const e of emails) { const r = map.get(e); if (r) { a += r.answered || 0; c += r.correct || 0 } }
    return a >= 20 ? pct(c, a) : null
  }
  const rows = rows0.map(({ t, batches, emails }) => {
    const [g] = q.rollupGroups([{ key: String(t._id), emails }], cur, range.days)
    const nowAcc = pooled(cur, emails), thenAcc = pooled(prev, emails)
    const u = up.get(String(t._id))
    return {
      id: String(t._id), name: t.name, email: t.email, status: t.status,
      groups: batches.map((b) => ({ id: String(b._id), name: b.name })), students: emails.length,
      engagement: g.engagement, activePct: g.activePct, minutesPerStudent: g.minutesPerLearner,
      accuracy: nowAcc, startingAccuracy: thenAcc, growth: nowAcc != null && thenAcc != null ? nowAcc - thenAcc : null,
      questions: u ? u.questions : 0, approvalRate: u && u.reviewed ? pct(u.approved, u.reviewed) : null,
      tests: Test ? (testCounts.get(String(t._id)) || 0) : 0, testsAvailable: Boolean(Test),
      markingTurnaround: null, parentReplyTime: null,
      lastActive: t.lastLoginAt || null, signedIn: t.authStatus === 'active',
    }
  }).sort((a, b) => a.name.localeCompare(b.name))
  return { range, previous: prevRange, teachers: rows, note: 'Growth compares each class with itself over the previous period. Class size and starting level are shown for context: this is for support, not ranking.' }
})

// Resolve "unit:<id>", "batch:<id>", "teacher:<id>", "school", optionally "@YYYY-MM-DD..YYYY-MM-DD".
async function compareItem(req, structure, allowed, spec) {
  const [what, period] = String(spec).split('@')
  const [kind, id] = what.split(':')
  let name, emails
  const inScopeEmails = async () => (await scopeOf(req)).emails
  if (kind === 'school') { emails = await inScopeEmails(); name = allowed ? 'My units' : req.org.name }
  else if (kind === 'unit') {
    const u = structure.units.find((x) => String(x._id) === id)
    if (!u || (allowed && !allowed.has(id))) throw bad('Unit not found', 404)
    emails = tree.membersOf(structure, tree.subtreeIdSet(structure.units, [id])).students.map((s) => lower(s.email)).filter(Boolean)
    name = tree.unitLabel(structure.units, id)
  } else if (kind === 'batch') {
    const b = structure.batches.find((x) => String(x._id) === id)
    if (!b || (allowed && !(b.unitId && allowed.has(String(b.unitId))))) throw bad('Group not found', 404)
    emails = structure.students.filter((s) => (s.batchIds || []).some((x) => String(x) === id)).map((s) => lower(s.email)).filter(Boolean)
    name = b.name
  } else if (kind === 'teacher') {
    const t = teachersInScope(structure, allowed).find((x) => String(x._id) === id)
    if (!t) throw bad('Teacher not found', 404)
    const ids = new Set(structure.batches.filter((b) => !b.archivedAt && teachesBatch(b, id)).map((b) => String(b._id)))
    emails = structure.students.filter((s) => (s.batchIds || []).some((x) => ids.has(String(x)))).map((s) => lower(s.email)).filter(Boolean)
    name = t.name
  } else throw bad('Compare units, groups, teachers or the school.')
  let range = null
  if (period) {
    const [from, to] = period.split('..')
    range = q.parseRange({ from, to, cmp: 'none' })
  }
  return { key: spec, kind, name, emails: [...new Set(emails)], range }
}

// ADM-042 Compare: two or more units, groups, teachers or periods side by side, normalised.
const compare = h(async (req) => {
  const items = String(req.query.items || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (items.length < 2 || items.length > 6) throw bad('Choose 2 to 6 things to compare.')
  const { range } = await rangeOf(req)
  const structure = await tree.loadStructure(req.org._id)
  const allowed = await allowedUnits(req)
  const resolved = []
  for (const spec of items) resolved.push(await compareItem(req, structure, allowed, spec))
  const out = []
  for (const it of resolved) {
    const r = it.range || range
    const [per, subj] = await Promise.all([q.perEmailTotals(it.emails, r.from, r.to), q.perEmailSubjects(it.emails, r.from, r.to)])
    const [row] = q.rollupGroups([{ key: it.key, emails: it.emails }], per, r.days)
    const [grid] = q.subjectGrid([{ key: it.key, emails: it.emails }], subj)
    out.push({ ...row, name: it.name, kind: it.kind, range: { from: r.from, to: r.to, days: r.days }, subjects: grid.cells })
  }
  const sizes = out.map((o) => o.learners).filter((n) => n > 0)
  const notes = []
  if (sizes.length && Math.max(...sizes) >= 2 * Math.min(...sizes)) notes.push('Group sizes differ a lot, so figures are per student.')
  if (sizes.some((n) => n < 10)) notes.push('Small groups (under 10) swing easily: one student can move the numbers a lot.')
  return { range, items: out, notes }
})

// Section label and teachers per student, for the lists.
function contextFor(structure) {
  const byEmail = new Map()
  for (const s of structure.students) {
    const teachers = structure.batches.filter((b) => (s.batchIds || []).some((x) => String(x) === String(b._id))).flatMap((b) => b.tutorIds || [])
    const names = [...new Set(teachers.map((id) => structure.tutors.find((t) => String(t._id) === String(id))?.name).filter(Boolean))]
    byEmail.set(lower(s.email), { id: String(s._id), name: s.name, unitId: s.unitId ? String(s.unitId) : null, unit: s.unitId ? tree.unitLabel(structure.units, s.unitId) : (s.grade || ''), teachers: names, teacherIds: [...new Set(teachers.map(String))] })
  }
  return byEmail
}

// ADM-043 At-risk (grouped by unit, with teacher and reason) and wins (biggest improvers).
const lists = h(async (req) => {
  const scope = await scopeOf(req, { unitId: req.query.unitId || undefined })
  const { range, tz } = await rangeOf(req)
  const prevRange = range.prev || { from: q.addDays(range.from, -range.days), to: q.addDays(range.from, -1) }
  const structure = await tree.loadStructure(req.org._id)
  const ctx = contextFor(structure)
  const [{ rows }, cur, prev] = await Promise.all([
    q.perLearner(scope.emails, { from: range.from, to: range.to, tz }),
    q.perEmailTotals(scope.emails, range.from, range.to),
    q.perEmailTotals(scope.emails, prevRange.from, prevRange.to),
  ])
  const atRisk = rows.filter((r) => r.atRisk).map((r) => ({ ...ctx.get(r.email), email: r.email, reason: r.riskReason, lastActive: r.lastActive, accuracy: r.accuracy, minutes: r.minutes }))
  const groups = new Map()
  for (const r of atRisk) { const k = r.unit || 'Not in a class'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r) }
  const growth = q.growthRows(scope.emails, cur, prev)
  const wins = growth
    .filter((g) => (g.accuracyDelta != null && g.accuracyDelta >= 5) || (g.minutesDelta >= 30 && g.prevMinutes > 0))
    .map((g) => ({ ...ctx.get(g.email), email: g.email, accuracy: g.accuracy, accuracyDelta: g.accuracyDelta, minutes: g.minutes, minutesDelta: g.minutesDelta, why: g.accuracyDelta != null && g.accuracyDelta >= 5 ? 'accuracy_up' : 'time_up' }))
    .sort((a, b) => ((b.accuracyDelta ?? 0) - (a.accuracyDelta ?? 0)) || (b.minutesDelta - a.minutesDelta))
    .slice(0, 20)
  return {
    range, previous: prevRange,
    atRisk: [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })).map(([unit, students]) => ({ unit, students })),
    atRiskCount: atRisk.length, wins,
  }
})

// ADM-044 Usage and adoption: learners active per day, devices, peak hours, features, staff and parents.
const usage = h(async (req) => {
  const scope = await scopeOf(req)
  const { range } = await rangeOf(req)
  const days = await q.fetchDays(scope.emails, range.from, range.to)
  const patterns = q.patterns(days)
  const structure = await tree.loadStructure(req.org._id)
  const allowed = await allowedUnits(req)
  const tutors = teachersInScope(structure, allowed)
  const now = Date.now()
  const within = (d, n) => d && now - new Date(d).getTime() <= n * 86400000
  const Parent = require('../models/admin/Parent')
  const ParentInvite = require('../models/admin/ParentInvite')
  const OrgStaff = require('../models/admin/OrgStaff')
  const [parents, invites, staff] = await Promise.all([
    Parent.countDocuments({ orgId: req.org._id, status: 'active' }),
    ParentInvite.aggregate([{ $match: { orgId: req.org._id } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
    allowed ? [] : OrgStaff.find({ orgId: req.org._id }).select('role lastLoginAt status').lean(),
  ])
  const inv = Object.fromEntries(invites.map((i) => [i._id, i.n]))
  const Child = require('../models/Child')
  const linkedLearners = scope.emails.length ? (await Child.distinct('email', { email: { $in: scope.emails }, linkStatus: 'verified' })).length : 0
  return {
    range,
    learners: { total: scope.emails.length, series: q.activeSeries(days, range), activeInRange: new Set(days.filter((d) => (d.answered || 0) > 0 || (d.minutes || 0) >= q.ACTIVE_MINUTES).map((d) => d.email)).size },
    devices: patterns.devices, heat: patterns.heat, bestHour: patterns.bestHour,
    features: q.featureUse(days),
    teachers: { total: tutors.length, signedIn: tutors.filter((t) => t.authStatus === 'active').length, active7: tutors.filter((t) => within(t.lastLoginAt, 7)).length, active30: tutors.filter((t) => within(t.lastLoginAt, 30)).length, neverSignedIn: tutors.filter((t) => !t.lastLoginAt).map((t) => ({ id: String(t._id), name: t.name })).slice(0, 50) },
    parents: { total: parents, invited: (inv.invited || 0) + (inv.bounced || 0) + (inv.linked || 0), linked: inv.linked || 0, bounced: inv.bounced || 0, learnersWithLinkedParent: linkedLearners },
    staff: { total: staff.length, active30: staff.filter((s) => within(s.lastLoginAt, 30)).length },
  }
})

// ADM-045 Test and question analytics: tests need the test models (TEACHER work); the
// question bank half works today from reviewed uploads.
const tests = h(async (req) => {
  const QUB = require('../models/superadmin/QuestionUploadBatch')
  const byStatus = await QUB.aggregate([{ $match: { orgId: String(req.org._id) } }, { $group: { _id: { status: '$status', subject: '$subject', module: '$module' }, uploads: { $sum: 1 }, questions: { $sum: '$rowCount' } } }])
  return { testsAvailable: Boolean(testModel()), questionBank: byStatus.map((r) => ({ ...r._id, uploads: r.uploads, questions: r.questions })) }
})

// ADM-046 Student profile (school context). Learning analytics come from the shared
// /students/:id/analytics/* endpoints; this adds where they are in the school.
const studentProfile = h(async (req) => {
  const Student = require('../models/admin/Student')
  const s = tree.validId(req.params.id) && await Student.findOne({ _id: req.params.id, orgId: req.org._id }).lean()
  if (!s || !(await studentInScope(req, s))) throw bad('Student not found', 404)
  const structure = await tree.loadStructure(req.org._id)
  const Parent = require('../models/admin/Parent')
  const ParentInvite = require('../models/admin/ParentInvite')
  const StudentMove = require('../models/admin/StudentMove')
  const ConsentRecord = require('../models/admin/ConsentRecord')
  const Child = require('../models/Child')
  const [parents, moves, consent] = await Promise.all([
    Parent.find({ orgId: req.org._id, studentIds: s._id }).select('name email status').lean(),
    StudentMove.find({ orgId: req.org._id, studentId: s._id }).sort({ at: -1 }).limit(20).lean(),
    ConsentRecord.find({ orgId: req.org._id, studentId: s._id }).sort({ at: -1 }).limit(5).lean(),
  ])
  const invites = new Map((await ParentInvite.find({ orgId: req.org._id, parentId: { $in: parents.map((p) => p._id) } }).lean()).map((i) => [String(i.parentId), i.status]))
  const linkedEmails = s.email ? new Set((await Child.find({ email: s.email, linkStatus: 'verified' }).select('parentId').lean()).map((c) => String(c.parentId))) : new Set()
  const groups = structure.batches.filter((b) => (s.batchIds || []).some((x) => String(x) === String(b._id)))
  const tutorName = (id) => structure.tutors.find((t) => String(t._id) === String(id))?.name
  return {
    student: { id: String(s._id), name: s.name, email: s.email, age: s.age, grade: s.grade, status: s.status, leftAt: s.leftAt, externalId: s.externalId, unitId: s.unitId, unit: s.unitId ? tree.unitLabel(structure.units, s.unitId) : '' },
    groups: groups.map((b) => ({ id: String(b._id), name: b.name, teachers: (b.tutorIds || []).map(tutorName).filter(Boolean), archived: Boolean(b.archivedAt) })),
    parents: parents.map((p) => ({ id: String(p._id), name: p.name, email: p.email, status: invites.get(String(p._id)) || 'not_invited' })),
    linkedParentAccounts: linkedEmails.size,
    history: moves.map((m) => ({ kind: m.kind, at: m.at, from: m.fromUnitId ? tree.unitLabel(structure.units, m.fromUnitId) : '', to: m.toUnitId ? tree.unitLabel(structure.units, m.toUnitId) : '', reason: m.reason })),
    consent,
    teacherNotes: null,
  }
})

module.exports = { overview, teachers, compare, lists, usage, tests, studentProfile, testModel }
