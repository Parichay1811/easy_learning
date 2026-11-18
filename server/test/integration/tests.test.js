// Question bank and tests end to end (TCH-020..061): authoring and review,
// tests with rules, the student player, marking, release, analytics and the
// guarantees: no score before release, no reading someone else's attempt,
// timing enforced by the server, other schools unreachable.
const test = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const { start } = require('./harness')

let app, ids, tok
const oid = () => new mongoose.Types.ObjectId()
const future = (h) => new Date(Date.now() + h * 3600 * 1000).toISOString()
const past = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString()

test.before(async () => {
  app = await start()
  const { admin, main, superadmin } = app.db
  const orgA = oid(), orgB = oid(), solo = oid(), noBank = oid(), batchA = oid(), batchSolo = oid()
  const tA = oid(), tOther = oid(), tB = oid(), tSolo = oid(), tNoBank = oid()
  await admin.collection('organizations').insertMany([
    { _id: orgA, name: 'Sunrise', adminUid: 'a-A', adminEmail: 'a@a.test', kind: 'institute', status: 'approved' },
    { _id: orgB, name: 'Other', adminUid: 'a-B', adminEmail: 'b@b.test', kind: 'institute', status: 'approved' },
    { _id: solo, name: 'Ms Rao', adminUid: 'a-S', adminEmail: 's@s.test', kind: 'solo', status: 'approved' },
    { _id: noBank, name: 'Locked', adminUid: 'a-N', adminEmail: 'n@n.test', kind: 'institute', status: 'approved' },
  ])
  await superadmin.collection('organizations').insertMany([
    { _id: oid(), name: 'Sunrise', adminOrgId: String(orgA), subscriptionPlan: 'free' },
    { _id: oid(), name: 'Other', adminOrgId: String(orgB), subscriptionPlan: 'free' },
    { _id: oid(), name: 'Ms Rao', adminOrgId: String(solo), subscriptionPlan: 'free' },
    { _id: oid(), name: 'Locked', adminOrgId: String(noBank), subscriptionPlan: 'free', featureOverrides: ['-qbank.author', '-tests'] },
  ])
  // Signed-in teacher records (a Tutor with authStatus 'active' is what sign-in leaves behind).
  await admin.collection('tutors').insertMany([
    { _id: tA, name: 'Mr Sharma', email: 'ta@a.test', uid: 't-A', orgId: orgA, status: 'active', authStatus: 'active' },
    { _id: tSolo, name: 'Ms Rao', email: 'rao@s.test', uid: 't-S', orgId: solo, status: 'active', authStatus: 'active' },
  ])
  await admin.collection('batches').insertMany([
    { _id: batchA, name: 'Year 5', orgId: orgA, tutorIds: [tA], directTutorIds: [tA], subjects: [], studentIds: [], status: 'active' },
    { _id: batchSolo, name: 'Evening', orgId: solo, tutorIds: [tSolo], directTutorIds: [tSolo], subjects: [], studentIds: [], status: 'active' },
  ])
  const students = [
    { _id: oid(), name: 'Aanya', email: 'aanya@kids.test', orgId: orgA, batchIds: [batchA], status: 'active' },
    { _id: oid(), name: 'Ravi', email: 'ravi@kids.test', orgId: orgA, batchIds: [batchA], status: 'active' },
    { _id: oid(), name: 'Excluded', email: 'ex@kids.test', orgId: orgA, batchIds: [batchA], status: 'active' },
    { _id: oid(), name: 'Outsider', email: 'out@kids.test', orgId: orgA, batchIds: [], status: 'active' },
    { _id: oid(), name: 'Zed', email: 'zed@kids.test', orgId: orgB, batchIds: [], status: 'active' },
    { _id: oid(), name: 'Lina', email: 'lina@kids.test', orgId: solo, batchIds: [batchSolo], status: 'active' },
  ]
  // 28 more classmates for the "30 students" item analysis.
  for (let i = 0; i < 28; i++) students.push({ _id: oid(), name: `Kid ${i}`, email: `kid${i}@kids.test`, orgId: orgA, batchIds: [batchA], status: 'active' })
  await admin.collection('students').insertMany(students)
  const parentId = oid()
  await main.collection('children').insertMany([{ _id: oid(), parentId, name: 'Aanya', age: 9, email: 'aanya@kids.test', linkStatus: 'verified' }])
  const child = await main.collection('children').findOne({ parentId })
  // Learnigo (seed) content: one question in read/maths
  await main.collection('readmaths').insertOne({ id: 'MA-1', interaction: 'tap_mcq', instruction: 'Seed question', prompt: '2+2', options: ['3', '4'], correct_answer: '4', accepted_answers: ['4'], status: 'approved', uploadBatchId: null, submittedBy: null, level: 1 })
  const sid = (email) => String(students.find((s) => s.email === email)._id)
  ids = { orgA: String(orgA), orgB: String(orgB), solo: String(solo), noBank: String(noBank), batchA: String(batchA), batchSolo: String(batchSolo), parentId: String(parentId), childId: String(child._id), sid, students }
  tok = {
    tA: app.tokens.teacher(String(tA), ids.orgA, 'ta@school.test'),
    tOther: app.tokens.teacher(String(tOther), ids.orgA, 'tother@school.test'),
    tB: app.tokens.teacher(String(tB), ids.orgB, 'tb@other.test'),
    tSolo: app.tokens.teacher(String(tSolo), ids.solo, 'rao@solo.test'),
    tNoBank: app.tokens.teacher(String(tNoBank), ids.noBank, 'n@locked.test'),
    adminA: app.tokens.admin('1', ids.orgA, 'a-A'),
    parent: app.tokens.parent(ids.parentId),
    s: (email) => app.tokens.student(email, email.split('@')[0]),
  }
})
test.after(async () => { await app?.stop() })

const Q = {
  mcq: { module: 'read', subject: 'maths', interaction: 'tap_mcq', instruction: 'Pick the sum', prompt: '3 + 4', options: ['6', '7', '8'], correct_answer: '7', hints: ['Count on'], feedback: { correct: 'Yes!', incorrect: 'Try counting on.' }, skillIds: ['addition'], difficulty: 2, gradeBand: '3-5' },
  multi: { module: 'read', subject: 'maths', interaction: 'multi_select', instruction: 'Tap the even numbers', options: ['2', '3', '4', '5'], correct_answer: ['2', '4'], skillIds: ['even-odd'], difficulty: 3 },
  long: { module: 'write', subject: 'english', interaction: 'typed_long', instruction: 'Describe your weekend', correct_answer: 'Any sentence about the weekend', skillIds: ['writing'] },
}
let qids = {}
const ref = (k) => ({ kind: 'question', module: Q[k].module, subject: Q[k].subject, questionId: qids[k] })
const approveAll = async () => {
  const pending = await app.call('GET', '/api/admin/questions/uploads?status=pending', { token: tok.adminA })
  for (const b of pending.body.batches) await app.call('POST', `/api/admin/questions/uploads/${b._id}/approve`, { token: tok.adminA })
  return pending.body.batches.length
}

test('editor: institute questions go to the admin review queue; tags, versions, scope', async () => {
  const bad = await app.call('POST', '/api/teacher/bank/questions', { token: tok.tA, body: { ...Q.mcq, correct_answer: '9' } })
  assert.equal(bad.status, 400)
  assert.ok(bad.body.errors.some((e) => e.field === 'correct_answer'))
  for (const k of Object.keys(Q)) {
    const r = await app.call('POST', '/api/teacher/bank/questions', { token: tok.tA, body: Q[k] })
    assert.equal(r.status, 201, JSON.stringify(r.body))
    assert.equal(r.body.status, 'pending')
    qids[k] = r.body.question._id
  }
  // the other teacher at the same school can't see it until approved; the other school never
  const path = `/api/teacher/bank/questions/read/maths/${qids.mcq}`
  assert.equal((await app.call('GET', path, { token: tok.tOther })).status, 404)
  assert.equal((await app.call('GET', path, { token: tok.tB })).status, 404)
  const mine = await app.call('GET', '/api/teacher/bank/questions?scope=mine&skill=addition', { token: tok.tA })
  assert.equal(mine.body.total, 1)
  assert.equal(mine.body.questions[0].difficulty, 2)
  assert.equal(await approveAll(), 3)
  assert.equal((await app.call('GET', path, { token: tok.tOther })).status, 200)
  const school = await app.call('GET', '/api/teacher/bank/questions?scope=school', { token: tok.tOther })
  assert.equal(school.body.total, 3)
  assert.equal((await app.call('GET', '/api/teacher/bank/questions?scope=school', { token: tok.tB })).body.total, 0)
  const learnigo = await app.call('GET', '/api/teacher/bank/questions?scope=learnigo&q=seed', { token: tok.tB })
  assert.equal(learnigo.body.total, 1)
  // only the author edits; an edit makes version 2, keeps the old content, and goes back to review
  assert.equal((await app.call('PUT', path, { token: tok.tOther, body: Q.mcq })).status, 404)
  const ed = await app.call('PUT', path, { token: tok.tA, body: { ...Q.mcq, prompt: '3 + 4 = ?' } })
  assert.equal(ed.status, 200)
  assert.equal(ed.body.version, 2)
  assert.equal(ed.body.status, 'pending')
  const revs = await app.call('GET', `${path}/revisions`, { token: tok.tA })
  assert.equal(revs.body.revisions[0].content.prompt, '3 + 4')
  // tag-only edits stay approved
  await approveAll()
  const tagOnly = await app.call('PUT', path, { token: tok.tA, body: { ...Q.mcq, prompt: '3 + 4 = ?', difficulty: 1 } })
  assert.equal(tagOnly.body.status, 'approved')
  // duplicate into my own bank
  const dup = await app.call('POST', `${path}/duplicate`, { token: tok.tOther, body: {} })
  assert.equal(dup.status, 201)
  assert.equal(dup.body.question.mine, true)
  assert.equal((await app.call('POST', `${path}/duplicate`, { token: tok.tB, body: {} })).status, 404)
})

test('solo teachers are auto-approved; locked plans get 402', async () => {
  const r = await app.call('POST', '/api/teacher/bank/questions', { token: tok.tSolo, body: Q.mcq })
  assert.equal(r.status, 201)
  assert.equal(r.body.status, 'approved')
  const locked = await app.call('GET', '/api/teacher/bank/questions', { token: tok.tNoBank })
  assert.equal(locked.status, 402)
  assert.equal(locked.body.code, 'MODULE_LOCKED')
  assert.equal((await app.call('GET', '/api/teacher/tests', { token: tok.tNoBank })).status, 402)
  // advanced features need tests.advanced (solo free has none)
  const pool = await app.call('POST', '/api/teacher/tests', { token: tok.tSolo, body: { title: 'Pool', sections: [{ items: [{ kind: 'pool', pool: { source: 'mine', count: 2 } }] }] } })
  assert.equal(pool.status, 402)
  assert.equal(pool.body.module, 'tests.advanced')
  assert.equal((await app.call('GET', '/api/teacher/bank/questions', {})).status, 401)
  assert.equal((await app.call('GET', '/api/teacher/bank/questions', { token: tok.s('aanya@kids.test') })).status, 401)
})

test('CSV import (dry run + insert), export with audit, bulk grid edit, collections, sharing', async () => {
  const csv = 'interaction,instruction,options,correct_answer,skills,difficulty\ntap_mcq,Which is a fruit?,apple|car,apple,fruit,1\ntap_mcq,Broken,a|b,c,,\ntrue_false,The sun is hot,,True,science,1'
  const dry = await app.call('POST', '/api/teacher/bank/import', { token: tok.tSolo, body: { module: 'read', subject: 'science', text: csv, dryRun: true } })
  assert.equal(dry.body.valid, 2)
  assert.equal(dry.body.rowErrors[0].row, 3)
  const ins = await app.call('POST', '/api/teacher/bank/import', { token: tok.tSolo, body: { module: 'read', subject: 'science', text: csv } })
  assert.equal(ins.status, 201)
  assert.equal(ins.body.inserted, 2)
  const res = await fetch(`${app.url}/api/teacher/bank/export.csv?scope=mine`, { headers: { authorization: `Bearer ${tok.tSolo}` } })
  const text = await res.text()
  assert.match(text, /Which is a fruit\?/)
  assert.ok(await app.db.main.collection('auditevents').findOne({ action: 'question.export' }))
  const list = await app.call('GET', '/api/teacher/bank/questions?scope=mine&subject=science', { token: tok.tSolo })
  const target = list.body.questions[0]
  const bulk = await app.call('PATCH', '/api/teacher/bank/bulk', { token: tok.tSolo, body: { updates: [{ module: target.module, subject: target.subject, id: target._id, set: { difficulty: 4, skillIds: ['plants'] } }, { module: 'read', subject: 'maths', id: qids.mcq, set: { difficulty: 5 } }] } })
  assert.equal(bulk.body.saved, 1) // the second one is someone else's
  const col = await app.call('POST', '/api/teacher/bank/collections', { token: tok.tSolo, body: { name: 'Science starters' } })
  const add = await app.call('PATCH', `/api/teacher/bank/collections/${col.body.collection._id}`, { token: tok.tSolo, body: { add: [{ module: target.module, subject: target.subject, questionId: target._id }] } })
  assert.equal(add.body.collection.items.length, 1)
  assert.equal((await app.call('GET', `/api/teacher/bank/collections/${col.body.collection._id}`, { token: tok.tA })).status, 404)
  // sharing to the public bank needs qbank.share (not on Solo Free)
  assert.equal((await app.call('POST', `/api/teacher/bank/questions/${target.module}/${target.subject}/${target._id}/share`, { token: tok.tSolo, body: {} })).status, 402)
  const sh = await app.call('POST', `/api/teacher/bank/questions/read/maths/${qids.multi}/share`, { token: tok.tA, body: { note: 'Nice one' } })
  assert.equal(sh.status, 201)
  assert.equal((await app.call('POST', `/api/teacher/bank/questions/read/maths/${qids.multi}/share`, { token: tok.tA, body: {} })).status, 409)
})

let testId, attemptA
test('builder and assign: unapproved questions block publishing; assignment scope is enforced', async () => {
  // a fresh pending question in the test blocks publishing
  const pend = await app.call('POST', '/api/teacher/bank/questions', { token: tok.tA, body: { ...Q.mcq, instruction: 'Pending one' } })
  const body = {
    title: 'Addition check', sections: [{ title: 'Part 1', items: [{ ...ref('mcq'), points: 2 }, { ...ref('multi'), points: 2 }, { ...ref('long'), points: 4, marking: 'manual', rubric: [{ name: 'Ideas', levels: [{ label: 'None', points: 0 }, { label: 'Some', points: 2 }, { label: 'Clear', points: 4 }] }] }, { kind: 'question', module: 'read', subject: 'maths', questionId: pend.body.question._id }] }],
    rules: { closesAt: future(48), feedback: 'after_close', attempts: 1, timezone: 'Asia/Kolkata', integrity: { logTabSwitches: true } },
  }
  const created = await app.call('POST', '/api/teacher/tests', { token: tok.tA, body })
  assert.equal(created.status, 201, JSON.stringify(created.body))
  testId = created.body.test._id
  const blocked = await app.call('POST', `/api/teacher/tests/${testId}/publish`, { token: tok.tA, body: { batchIds: [ids.batchA] } })
  assert.equal(blocked.status, 409)
  assert.equal(blocked.body.code, 'QUESTIONS_NOT_APPROVED')
  body.sections[0].items.pop()
  assert.equal((await app.call('PUT', `/api/teacher/tests/${testId}`, { token: tok.tA, body })).status, 200)
  // not my group / not my student / other org
  assert.equal((await app.call('POST', `/api/teacher/tests/${testId}/publish`, { token: tok.tA, body: { studentIds: [ids.sid('out@kids.test')] } })).status, 400)
  assert.equal((await app.call('POST', `/api/teacher/tests/${testId}/publish`, { token: tok.tOther, body: { batchIds: [ids.batchA] } })).status, 404)
  assert.equal((await app.call('GET', `/api/teacher/tests/${testId}`, { token: tok.tB })).status, 404)
  const pub = await app.call('POST', `/api/teacher/tests/${testId}/publish`, { token: tok.tA, body: { batchIds: [ids.batchA], excludedStudentIds: [ids.sid('ex@kids.test')], notifyParents: true } })
  // The teacher's Today checklist now shows the 'assign first practice' step as done.
  const todayRes = await app.call('GET', '/api/teacher/today', { token: tok.tA })
  assert.equal(todayRes.status, 200, JSON.stringify(todayRes.body))
  assert.equal(todayRes.body.checklist.practice, true)
  assert.equal(pub.status, 200)
  assert.equal(pub.body.students, 30)
  assert.ok(await app.db.main.collection('notifications').findOne({ to: 'student:aanya@kids.test', kind: 'test_assigned' }))
  assert.ok(await app.db.main.collection('notifications').findOne({ to: `parent:${ids.parentId}`, kind: 'test_assigned' }))
  const prev = await app.call('GET', `/api/teacher/tests/${testId}/preview`, { token: tok.tA })
  assert.equal(prev.body.items.length, 3)
  assert.equal(prev.body.items[2].marking, 'manual')
})

test('student: to-do list, intro, start; the answer key never reaches the browser', async () => {
  const todo = await app.call('GET', '/api/student/tests', { token: tok.s('aanya@kids.test') })
  assert.equal(todo.status, 200)
  assert.equal(todo.body.tests.length, 1)
  assert.equal(todo.body.tests[0].canStart, true)
  assert.equal((await app.call('GET', '/api/student/tests', { token: tok.s('ex@kids.test') })).body.tests.length, 0)
  for (const e of ['ex@kids.test', 'out@kids.test', 'zed@kids.test']) assert.equal((await app.call('POST', `/api/student/tests/${testId}/start`, { token: tok.s(e) })).status, 404, e)
  assert.equal((await app.call('GET', '/api/student/tests', { token: tok.tA })).status, 403)
  assert.equal((await app.call('GET', '/api/student/tests')).status, 401)
  const st = await app.call('POST', `/api/student/tests/${testId}/start`, { token: tok.s('aanya@kids.test') })
  assert.equal(st.status, 201)
  attemptA = st.body.attempt
  const json = JSON.stringify(st.body)
  for (const leak of ['correct_answer', 'accepted_answers', 'worked_example', '"feedback":{', 'Any sentence about the weekend']) assert.ok(!json.includes(leak), leak)
  assert.equal(attemptA.items.length, 3)
  assert.equal(attemptA.result, null)
  // resume returns the same attempt
  const again = await app.call('POST', `/api/student/tests/${testId}/start`, { token: tok.s('aanya@kids.test') })
  assert.equal(again.body.attempt._id, attemptA._id)
  assert.equal(again.body.resumed, true)
})

test("one student can never read or change another's attempt", async () => {
  const ravi = tok.s('ravi@kids.test')
  assert.equal((await app.call('GET', `/api/student/attempts/${attemptA._id}`, { token: ravi })).status, 404)
  const it = attemptA.items[0]
  assert.equal((await app.call('PUT', `/api/student/attempts/${attemptA._id}/items/${it.id}`, { token: ravi, body: { response: '6' } })).status, 404)
  assert.equal((await app.call('POST', `/api/student/attempts/${attemptA._id}/submit`, { token: ravi })).status, 404)
  assert.equal((await app.call('GET', `/api/teacher/tests/${testId}/attempts/${attemptA._id}`, { token: tok.tOther })).status, 404)
})

test('answers, submit, marking queue, release: no score before release, then student and parent see it', async () => {
  const t = tok.s('aanya@kids.test')
  const byType = Object.fromEntries(attemptA.items.map((i) => [i.interaction, i]))
  assert.equal((await app.call('PUT', `/api/student/attempts/${attemptA._id}/items/${byType.tap_mcq.id}`, { token: t, body: { response: ['7'] } })).status, 400)
  for (const [type, response] of [['tap_mcq', '7'], ['multi_select', ['2']], ['typed_long', 'I went to the park and played.']]) {
    const r = await app.call('PUT', `/api/student/attempts/${attemptA._id}/items/${byType[type].id}`, { token: t, body: { response, timeMs: 4000 } })
    assert.equal(r.status, 200)
    assert.equal(r.body.result, null) // after_close: no feedback now
  }
  await app.call('POST', `/api/student/attempts/${attemptA._id}/events`, { token: t, body: { type: 'tab_hidden' } })
  const sub = await app.call('POST', `/api/student/attempts/${attemptA._id}/submit`, { token: t })
  assert.equal(sub.status, 200)
  assert.equal(sub.body.attempt.status, 'submitted')
  assert.equal(sub.body.attempt.result, null)
  assert.ok(!JSON.stringify(sub.body).includes('"score":'), 'no score before release')
  assert.equal((await app.call('POST', `/api/student/tests/${testId}/start`, { token: t })).body.code, 'NO_ATTEMPTS_LEFT')
  // the parent sees it waiting, not the score
  const pv = await app.call('GET', `/api/parent/children/${ids.childId}/tests`, { token: tok.parent })
  assert.equal(pv.status, 200)
  assert.equal(pv.body.results.length, 0)
  assert.equal(pv.body.assigned[0].status, 'waiting_for_result')
  assert.equal((await app.call('GET', `/api/parent/children/${ids.childId}/tests`, { token: app.tokens.parent(String(oid())) })).status, 404)
  // analytics: auto-marked answers recorded with the test id
  const evs = await app.db.main.collection('learningevents').find({ email: 'aanya@kids.test', testId }).toArray()
  assert.equal(evs.length, 2)
  assert.ok(evs.every((e) => e.source === 'test' && e.orgId === ids.orgA))
  // teacher marks the typed answer with the rubric
  const q = await app.call('GET', `/api/teacher/marking?testId=${testId}`, { token: tok.tA })
  assert.equal(q.status, 200)
  assert.equal(q.body.queue.length, 1)
  const m = q.body.queue[0]
  assert.equal(m.response, 'I went to the park and played.')
  assert.equal((await app.call('POST', `/api/teacher/tests/${testId}/attempts/${m.attemptId}/items/${m.itemId}/mark`, { token: tok.tA, body: { score: 99 } })).status, 400)
  const mk = await app.call('POST', `/api/teacher/tests/${testId}/attempts/${m.attemptId}/items/${m.itemId}/mark`, { token: tok.tA, body: { levels: [1], comment: 'Add one more detail.' } })
  assert.equal(mk.status, 200)
  assert.equal(mk.body.item.score, 2)
  assert.equal(mk.body.attempt.score, 2 + 1 + 2) // mcq 2 + multi half of 2 + rubric 2
  assert.equal(mk.body.attempt.needsMarking, false)
  assert.equal((await app.call('GET', `/api/student/attempts/${attemptA._id}`, { token: t })).body.attempt.result, null, 'still not released')
  // release now
  const rel = await app.call('POST', `/api/teacher/tests/${testId}/release`, { token: tok.tA })
  assert.equal(rel.status, 200)
  const view = await app.call('GET', `/api/student/attempts/${attemptA._id}`, { token: t })
  assert.equal(view.body.attempt.result.percent, 63)
  assert.equal(view.body.attempt.items.find((i) => i.interaction === 'tap_mcq').result.correctAnswer, '7')
  const pv2 = await app.call('GET', `/api/parent/children/${ids.childId}/tests`, { token: tok.parent })
  assert.equal(pv2.body.results[0].percent, 63)
  assert.deepEqual(pv2.body.results[0].comments, ['Add one more detail.'])
  assert.ok(await app.db.main.collection('notifications').findOne({ to: 'student:aanya@kids.test', kind: 'result_released' }))
  assert.ok(await app.db.main.collection('notifications').findOne({ to: `parent:${ids.parentId}`, kind: 'result_released' }))
  // a correction after release is audited and the student is told
  await app.call('POST', `/api/teacher/tests/${testId}/attempts/${m.attemptId}/items/${m.itemId}/mark`, { token: tok.tA, body: { score: 4, reason: 'Re-read it' } })
  assert.ok(await app.db.main.collection('auditevents').findOne({ action: 'test.mark.correct', targetId: attemptA._id }))
  assert.ok(await app.db.main.collection('notifications').findOne({ to: 'student:aanya@kids.test', kind: 'result_updated' }))
})

test('timing is enforced by the server: total limit, per-question limit, closed and upcoming windows', async () => {
  const mk = async (rules, extra = {}) => {
    const r = await app.call('POST', '/api/teacher/tests', { token: tok.tA, body: { title: 'Timed', sections: [{ items: [ref('mcq'), ref('multi')] }], rules, ...extra } })
    assert.equal(r.status, 201, JSON.stringify(r.body))
    assert.equal((await app.call('POST', `/api/teacher/tests/${r.body.test._id}/publish`, { token: tok.tA, body: { studentIds: [ids.sid('ravi@kids.test')] } })).status, 200)
    return r.body.test._id
  }
  const ravi = tok.s('ravi@kids.test')
  // total limit: the deadline passes, the next save is refused and the attempt is handed in
  const t1 = await mk({ closesAt: future(5), timeLimit: 'total', totalMinutes: 10, feedback: 'after_submit' })
  const a1 = (await app.call('POST', `/api/student/tests/${t1}/start`, { token: ravi })).body.attempt
  assert.ok(new Date(a1.deadlineAt) - Date.now() > 9 * 60000)
  await app.db.admin.collection('testattempts').updateOne({ _id: new mongoose.Types.ObjectId(a1._id) }, { $set: { deadlineAt: new Date(Date.now() - 60000) } })
  const late = await app.call('PUT', `/api/student/attempts/${a1._id}/items/${a1.items[0].id}`, { token: ravi, body: { response: '7' } })
  assert.equal(late.status, 409)
  assert.equal(late.body.code, 'TIME_UP')
  const after = await app.db.admin.collection('testattempts').findOne({ _id: new mongoose.Types.ObjectId(a1._id) })
  assert.equal(after.status, 'auto_submitted')
  // per-question limit (tests.advanced on the institute plan)
  const t2 = await mk({ closesAt: future(5), timeLimit: 'per_question', perQuestionSeconds: 20 })
  const a2 = (await app.call('POST', `/api/student/tests/${t2}/start`, { token: ravi })).body.attempt
  assert.equal(a2.perQuestionMs, 20000)
  await app.call('POST', `/api/student/attempts/${a2._id}/open`, { token: ravi, body: { itemId: a2.items[0].id } })
  await app.db.admin.collection('testattempts').updateOne({ _id: new mongoose.Types.ObjectId(a2._id) }, { $set: { 'items.0.openedAt': new Date(Date.now() - 60000) } })
  const slow = await app.call('PUT', `/api/student/attempts/${a2._id}/items/${a2.items[0].id}`, { token: ravi, body: { response: '7' } })
  assert.equal(slow.body.code, 'QUESTION_TIME_UP')
  await app.call('POST', `/api/student/attempts/${a2._id}/open`, { token: ravi, body: { itemId: a2.items[1].id } })
  assert.equal((await app.call('POST', `/api/student/attempts/${a2._id}/open`, { token: ravi, body: { itemId: a2.items[0].id } })).body.code, 'NO_BACK')
  // not open yet / closed
  const t3 = await mk({ opensAt: future(2), closesAt: future(5) })
  assert.equal((await app.call('POST', `/api/student/tests/${t3}/start`, { token: ravi })).body.code, 'NOT_OPEN')
  const t4 = await mk({ opensAt: past(5), closesAt: past(1) })
  assert.equal((await app.call('POST', `/api/student/tests/${t4}/start`, { token: ravi })).body.code, 'CLOSED')
  // late work allowed: starts, marked late
  const t5 = await mk({ opensAt: past(5), closesAt: past(1), lateWork: 'marked' })
  const a5 = await app.call('POST', `/api/student/tests/${t5}/start`, { token: ravi })
  assert.equal(a5.status, 201)
  assert.equal(a5.body.attempt.late, true)
  // accommodations: x1.5 extra time is applied automatically
  assert.equal((await app.call('PUT', `/api/teacher/accommodations/${ids.sid('ravi@kids.test')}`, { token: tok.tA, body: { extraTime: 1.5, readAloud: true } })).status, 200)
  assert.equal((await app.call('PUT', `/api/teacher/accommodations/${ids.sid('zed@kids.test')}`, { token: tok.tA, body: { extraTime: 2 } })).status, 404)
  const t6 = await mk({ closesAt: future(5), timeLimit: 'total', totalMinutes: 20 })
  const a6 = (await app.call('POST', `/api/student/tests/${t6}/start`, { token: ravi })).body.attempt
  const mins = (new Date(a6.deadlineAt) - new Date(a6.startedAt)) / 60000
  assert.equal(Math.round(mins), 30)
  assert.equal(a6.accommodations.readAloud, true)
})

test('immediate feedback (practice style) checks and locks one question at a time', async () => {
  const r = await app.call('POST', '/api/teacher/tests', { token: tok.tA, body: { title: 'Warm-up', kind: 'practice', sections: [{ items: [ref('mcq')] }] } })
  assert.equal(r.body.test.rules.feedback, 'immediate')
  await app.call('POST', `/api/teacher/tests/${r.body.test._id}/publish`, { token: tok.tA, body: { batchIds: [ids.batchA] } })
  const t = tok.s('aanya@kids.test')
  const a = (await app.call('POST', `/api/student/tests/${r.body.test._id}/start`, { token: t })).body.attempt
  const c = await app.call('PUT', `/api/student/attempts/${a._id}/items/${a.items[0].id}`, { token: t, body: { response: '6', check: true } })
  assert.equal(c.body.result.correct, false)
  assert.equal(c.body.result.correctAnswer, '7')
  assert.equal((await app.call('PUT', `/api/student/attempts/${a._id}/items/${a.items[0].id}`, { token: t, body: { response: '7', check: true } })).body.code, 'LOCKED')
  const ev = await app.db.main.collection('learningevents').findOne({ email: 'aanya@kids.test', testId: r.body.test._id })
  assert.equal(ev.source, 'homework')
})

test('30 students: results with item analysis in well under 5 s; monitor; CSV export; other teachers locked out', async () => {
  const kids = ids.students.filter((s) => s.email.startsWith('kid'))
  await Promise.all(kids.map(async (s, i) => {
    const t = tok.s(s.email)
    const a = (await app.call('POST', `/api/student/tests/${testId}/start`, { token: t })).body.attempt
    const strong = i < 14
    for (const it of a.items) {
      const response = it.interaction === 'tap_mcq' ? (strong ? '7' : '8') : it.interaction === 'multi_select' ? (strong ? ['2', '4'] : ['3']) : 'My weekend was fun.'
      await app.call('PUT', `/api/student/attempts/${a._id}/items/${it.id}`, { token: t, body: { response, timeMs: 3000 + i * 100 } })
    }
    await app.call('POST', `/api/student/attempts/${a._id}/submit`, { token: t })
  }))
  const t0 = Date.now()
  const res = await app.call('GET', `/api/teacher/tests/${testId}/results`, { token: tok.tA })
  const ms = Date.now() - t0
  assert.equal(res.status, 200)
  assert.ok(ms < 5000, `results took ${ms} ms`)
  assert.equal(res.body.summary.assigned, 30)
  assert.equal(res.body.summary.finished, 29)
  const mcq = res.body.items.find((i) => i.interaction === 'tap_mcq')
  assert.equal(mcq.n, 29)
  assert.equal(mcq.commonWrong.answer, '8')
  assert.ok(mcq.discrimination > 0.5)
  assert.equal(res.body.items.find((i) => i.interaction === 'typed_long').pendingMarking, 28)
  assert.equal(res.body.students.find((s) => s.name === 'Aanya').integrity.tabSwitches, 1)
  assert.equal(res.body.students.find((s) => s.name === 'Ravi').status, 'not_started')
  const mon = await app.call('GET', `/api/teacher/tests/${testId}/monitor`, { token: tok.tA })
  assert.equal(mon.status, 200)
  assert.equal(mon.body.counts.finished, 29)
  assert.equal((await app.call('GET', `/api/teacher/tests/${testId}/results`, { token: tok.tOther })).status, 404)
  assert.equal((await app.call('GET', `/api/teacher/tests/${testId}/results`, { token: tok.tB })).status, 404)
  const csv = await fetch(`${app.url}/api/teacher/tests/${testId}/results.csv`, { headers: { authorization: `Bearer ${tok.tA}` } })
  assert.match(await csv.text(), /Aanya/)
  assert.ok(await app.db.main.collection('auditevents').findOne({ action: 'test.results.export', targetId: testId }))
  // question quality stats in the bank come from the same attempts
  const qs = await app.call('GET', `/api/teacher/bank/questions/read/maths/${qids.mcq}/stats`, { token: tok.tA })
  assert.equal(qs.body.stats.used, 29)
  assert.equal(qs.body.stats.commonWrong.answer, '8')
  // practice suggestions after the test, approved in one click
  const sug = await app.call('GET', `/api/teacher/tests/${testId}/practice-suggestions`, { token: tok.tA })
  assert.ok(sug.body.suggestions.length >= 14)
  const one = sug.body.suggestions[0]
  const ap = await app.call('POST', `/api/teacher/tests/${testId}/practice-suggestions/approve`, { token: tok.tA, body: { studentIds: [one.studentId] } })
  assert.equal(ap.body.created.length, 1)
  // monitor needs tests.advanced
  const soloTest = await app.call('POST', '/api/teacher/tests', { token: tok.tSolo, body: { title: 'Solo', sections: [{ items: [] }] } })
  assert.equal((await app.call('GET', `/api/teacher/tests/${soloTest.body.test._id}/monitor`, { token: tok.tSolo })).status, 402)
})
