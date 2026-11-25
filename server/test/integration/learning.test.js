// The adaptive learning engine end to end (docs/learning/ADAPTIVE.md): the
// learner's /api/learn endpoints, log-answer feeding the engine (old and new
// bodies), guardian and teacher learning plans with their access rules,
// question visibility for school learners, privacy (minimisation, export, erase).
const test = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const { start } = require('./harness')

let app
const oid = () => new mongoose.Types.ObjectId()
const ids = {}
const S = {} // learner tokens

const q = (id, level, skill, extra = {}) => ({
  _id: oid(), id, subject: 'Math', module: 'Read', interaction: 'tap_mcq', level, status: 'approved', uploadBatchId: null,
  instruction: `How many? (${id})`, prompt: '🍎🍎🍎', options: ['2', '3', '4'], correct_answer: '3', accepted_answers: ['3'],
  hints: ['Count each one.', 'Touch each apple.'], distractor_insight: { 4: 'counted one apple twice', 2: 'skipped one apple' },
  analysis: { parent_note: `Counting each thing once shows a steady count (${id}).`, teacher_action_if_missed: `Count together, touching each apple once (${id}).` },
  ...(skill ? { skill } : {}),
  translations: { de: { instruction: `Wie viele? (${id})`, hints: ['Zähle jeden.'] } },
  ...extra,
})

test.before(async () => {
  app = await start()
  const { main, admin, superadmin } = app.db
  const orgA = oid(), orgB = oid(), g1 = oid(), upload = oid()
  const t1 = oid(), t2 = oid(), tB = oid(), tOff = oid(), sam = oid(), lone = oid()
  Object.assign(ids, { orgA: String(orgA), orgB: String(orgB), g1: String(g1), t1: String(t1), t2: String(t2), tB: String(tB), tOff: String(tOff), sam: String(sam), upload })

  // Learnigo's questions (visible to learners outside any school).
  await main.collection('readmaths').insertMany([
    ...[1, 2, 3, 4].map((i) => q(`T-RM-1-A-${i}`, 1, 'maths.test-adding')),
    ...[1, 2, 3, 4].map((i) => q(`T-RM-1-B-${i}`, 1, null, { academic: { skill: 'Test counting objects' } })),
    ...[1, 2, 3].map((i) => q(`T-RM-0-C-${i}`, 0, 'maths.test-count-to-5')),
    ...[1, 2, 3, 4].map((i) => q(`T-RM-2-D-${i}`, 2, 'maths.test-adding-20')),
    ...[1, 2].map((i) => q(`T-RM-3-E-${i}`, 3, 'maths.test-take-away')),
    q('T-RM-1-X', 1, 'maths.test-adding', { qa: { status: 'excluded' } }),
    q('T-RM-1-OPEN', 1, 'maths.test-talk', { interaction: 'typed_long', correct_answer: 'open' }),
    // A school's own questions (only its groups see them).
    q('T-ORG-1', 1, 'maths.school-sums', { uploadBatchId: upload }),
    q('T-ORG-2', 2, 'maths.school-sums', { uploadBatchId: upload }),
  ])
  await main.collection('speakenglishes').insertMany([
    { _id: oid(), id: 'T-SE-1', interaction: 'mic_record', level: 1, status: 'approved', uploadBatchId: null, instruction: 'Say soap', correct_answer: 'soap', speech_scoring: { expected_keywords: ['soap'] } },
    { _id: oid(), id: 'T-SE-OPEN', interaction: 'mic_record', level: 1, status: 'approved', uploadBatchId: null, instruction: 'Tell me about your day', correct_answer: '', speech_scoring: { expected_keywords: [] } },
  ])
  await superadmin.collection('questionuploadbatches').insertOne({ _id: upload, module: 'read', subject: 'maths', orgId: String(orgA), status: 'approved', batchIds: [String(g1)], createdAt: new Date() })

  // A school with one group: t1 teaches it; t2 is in the school but not the group; tOff is disabled; tB is elsewhere.
  await admin.collection('organizations').insertMany([
    { _id: orgA, name: 'Sunrise School', kind: 'institute', status: 'approved', adminUid: 'adm-a', adminEmail: 'head@a.test' },
    { _id: orgB, name: 'Other School', kind: 'institute', status: 'approved', adminUid: 'adm-b', adminEmail: 'head@b.test' },
  ])
  const tutor = (_id, orgId, email, authStatus = 'active') => ({ _id, name: email, email, orgId, uid: `g-${email}`, authStatus, status: 'active', batchIds: [], studentIds: [], subjectIds: [] })
  await admin.collection('tutors').insertMany([tutor(t1, orgA, 't1@a.test'), tutor(t2, orgA, 't2@a.test'), tutor(tB, orgB, 'tb@b.test'), tutor(tOff, orgA, 'off@a.test', 'disabled')])
  await admin.collection('students').insertMany([
    { _id: sam, name: 'Sam Lee', email: 'sam@kids.test', orgId: orgA, batchIds: [g1], tutorIds: [], parentIds: [], status: 'active' },
    { _id: lone, name: 'Lone', email: 'lone@kids.test', orgId: orgA, batchIds: [], tutorIds: [], parentIds: [], status: 'active' },
  ])
  await admin.collection('batches').insertOne({ _id: g1, name: 'Year 3', orgId: orgA, tutorIds: [t1, tOff], directTutorIds: [t1, tOff], subjects: [], studentIds: [sam], status: 'active' })

  // Parents: mum has a verified link to Ana; a stranger has a pending one.
  const mum = oid(), stranger = oid(), childAna = oid(), childPending = oid()
  await main.collection('parentaccounts').insertMany([
    { _id: mum, uid: 'p-mum', email: 'mum@family.test', name: 'Priya', plan: 'family_plus' },
    { _id: stranger, uid: 'p-x', email: 'x@other.test', name: 'Stranger', plan: 'free' },
  ])
  await main.collection('children').insertMany([
    { _id: childAna, parentId: mum, name: 'Ana', age: 8, email: 'ana@kids.test', linkStatus: 'verified', verifiedBy: 'child_code', guardianRole: 'primary' },
    { _id: childPending, parentId: stranger, name: 'Ana?', age: 8, email: 'ana@kids.test', linkStatus: 'pending' },
  ])
  Object.assign(ids, { mum: String(mum), stranger: String(stranger), childAna: String(childAna), childPending: String(childPending) })

  for (const e of ['ana', 'bea', 'lvl', 'down', 'tim1', 'tim2', 'sam', 'lone']) S[e] = app.tokens.student(`${e}@kids.test`, e === 'ana' ? 'Ana Maria Rao' : e)
})
test.after(async () => { await app?.stop() })

const P = () => ({ mum: app.tokens.parent(ids.mum, 'mum@family.test'), stranger: app.tokens.parent(ids.stranger, 'x@other.test') })
const T = () => ({
  t1: app.tokens.teacher(ids.t1, ids.orgA, 't1@a.test'), t2: app.tokens.teacher(ids.t2, ids.orgA, 't2@a.test'),
  tB: app.tokens.teacher(ids.tB, ids.orgB, 'tb@b.test'), off: app.tokens.teacher(ids.tOff, ids.orgA, 'off@a.test'),
})
const answer = (token, body, tz = 'UTC') => app.call('POST', '/api/dashboard/log-answer', { token, headers: { 'x-timezone': tz }, body: { module: 'read', subject: 'maths', question: 'q', userAnswer: '3', correctAnswer: '3', xpEarned: 10, timeTaken: 5, mode: 'practice', ...body } })

test('every learner endpoint needs a signed-in learner', async () => {
  for (const [m, p] of [['GET', '/api/learn/profile'], ['PUT', '/api/learn/profile'], ['DELETE', '/api/learn/profile'], ['POST', '/api/learn/suggestions/abcdef'], ['GET', '/api/learn/round?subject=maths&module=read'], ['GET', '/api/learn/baseline?subject=maths&module=read'], ['POST', '/api/learn/baseline'], ['GET', '/api/learn/companion']]) {
    assert.equal((await app.call(m, p, { body: m === 'GET' ? undefined : {} })).status, 401, `${m} ${p}`)
    assert.equal((await app.call(m, p, { token: P().mum, body: m === 'GET' ? undefined : {} })).status, 401, `parent token on ${m} ${p}`)
  }
})

test('a new learner: default profile, content ceilings, nothing stored yet', async () => {
  const r = await app.call('GET', '/api/learn/profile', { token: S.ana })
  assert.equal(r.status, 200)
  const m = r.body.profile.levels.maths
  assert.deepEqual([m.level, m.source, m.locked, m.status, m.accuracy, m.attempts, m.ceiling], [1, 'default', false, 'new', null, 0, 3])
  assert.equal(r.body.profile.levels.english.ceiling, 1)
  assert.equal(r.body.profile.pace, 'steady')
  assert.deepEqual(r.body.profile.baselineDone, { english: false, maths: false, science: false })
  assert.deepEqual(r.body.skills, [])
  assert.equal(r.body.next.reason, 'new')
  assert.equal(await app.db.main.collection('learnerprofiles').countDocuments({ email: 'ana@kids.test' }), 0, 'a GET writes nothing')
})

test('round: level-appropriate, translated, deterministic per seed, never excluded items; bad queries are 400', async () => {
  const r = await app.call('GET', '/api/learn/round?subject=maths&module=read&lang=de&size=8&seed=abc', { token: S.ana })
  assert.equal(r.status, 200)
  assert.equal(r.body.items.length, 8)
  assert.equal(r.body.level, 1)
  assert.equal(r.body.ceiling, 3)
  for (const it of r.body.items) {
    assert.ok(it.level <= 1, it.id)
    assert.ok(['new', 'probe', 'practice', 'prerequisite', 'review', 'stretch'].includes(it.why))
    assert.ok(Number.isInteger(it.support.step) && it.support.strategy)
    assert.notEqual(it.id, 'T-RM-1-X')
    assert.ok(!it.id.startsWith('T-ORG'), 'school questions are not Learnigo questions')
    assert.equal(it.lang, 'de')
    assert.match(it.instruction, /^Wie viele\?/)
    assert.equal(it.translations, undefined)
  }
  const again = await app.call('GET', '/api/learn/round?subject=maths&module=read&lang=de&size=8&seed=abc', { token: S.ana })
  assert.deepEqual(again.body.items.map((i) => i.id), r.body.items.map((i) => i.id))
  for (const bad of ['subject=history&module=read', 'subject=maths&module=draw', 'subject=maths&module=read&size=50', 'subject=maths&module=read&lang=german!']) {
    assert.equal((await app.call('GET', `/api/learn/round?${bad}`, { token: S.ana })).status, 400, bad)
  }
  const empty = await app.call('GET', '/api/learn/round?subject=science&module=read', { token: S.ana })
  assert.deepEqual([empty.status, empty.body.items.length, empty.body.ceiling], [200, 0, null])
})

test('round respects school visibility exactly like the question endpoint', async () => {
  const sam = await app.call('GET', '/api/learn/round?subject=maths&module=read&seed=1', { token: S.sam })
  assert.deepEqual(sam.body.items.map((i) => i.id), ['T-ORG-1'], 'only their school\'s questions, at their level')
  assert.equal(sam.body.ceiling, 2)
  const today = await app.call('GET', '/api/read/maths', { token: S.sam })
  assert.deepEqual(today.body.data.map((x) => x.id).sort(), ['T-ORG-1', 'T-ORG-2'])
  const lone = await app.call('GET', '/api/learn/round?subject=maths&module=read', { token: S.lone })
  assert.equal(lone.body.items.length, 0, 'a school learner never sees Learnigo questions, even with none of their own')
})

test('log-answer: the old body still works and feeds the engine; the new body adds status, hints, support', async () => {
  const before = await app.db.main.collection('studentanswers').countDocuments({ email: 'ana@kids.test' })
  const old = await answer(S.ana, { correct: true, questionId: 'T-RM-1-B-1', topic: 'number sense', userAnswer: 'PRIVATE-ANSWER-123' })
  assert.equal(old.status, 200)
  assert.equal(old.body.success, true)
  assert.equal(old.body.learn.counted, true)
  assert.equal(old.body.learn.skill, 'maths.test-counting-objects')
  assert.ok(old.body.learn.mastery > 0)
  assert.equal(typeof old.body.learn.message.key, 'string')
  assert.equal(typeof old.body.learn.message.text, 'string')
  assert.equal(await app.db.main.collection('studentanswers').countDocuments({ email: 'ana@kids.test' }), before + 1, 'the answer history is kept as before')

  // Three misses on one skill: pictures, then step by step, then an easier item first.
  const steps = []
  for (let i = 0; i < 3; i++) {
    const r = await answer(S.ana, { status: 'incorrect', correct: false, firstTry: true, hintsUsed: 0, supportStep: steps.length, questionId: `T-RM-1-A-${i + 1}`, misconception: i === 0 ? 'counted one apple twice' : 'my own words here' })
    steps.push([r.body.learn.supportStep, r.body.learn.strategy, r.body.learn.message.key])
  }
  assert.deepEqual(steps, [[1, 'visual', 'tryPictures'], [2, 'guided', 'tryTogether'], [3, 'simpler', 'easierFirst']])
  const easier = steps[2]
  assert.ok(easier)
  const msg = (await answer(S.ana, { status: 'close', reason: 'spelling', correct: false, firstTry: true, questionId: 'T-RM-1-A-4' })).body.learn.message
  assert.equal(msg.key, 'closeSpelling')

  // The round now puts an easier item right before the skill it prepares.
  const r = await app.call('GET', '/api/learn/round?subject=maths&module=read&size=10&seed=x', { token: S.ana })
  const i = r.body.items.findIndex((x) => x.why === 'prerequisite' && x.support.for === 'maths.test-adding')
  assert.ok(i >= 0, JSON.stringify(r.body.items.map((x) => [x.id, x.why])))
  assert.equal(r.body.items[i].level, 0)
  assert.equal(r.body.items[i + 1].support.skill, 'maths.test-adding')
  assert.equal(r.body.items[i + 1].support.strategy, 'guided')

  // Data minimisation: no raw answers, only the question's own insight text.
  const prof = await app.db.main.collection('learnerprofiles').findOne({ email: 'ana@kids.test' })
  const skills = await app.db.main.collection('skillmasteries').find({ email: 'ana@kids.test' }).toArray()
  const stored = JSON.stringify({ prof, skills })
  assert.ok(!stored.includes('PRIVATE-ANSWER-123'))
  assert.ok(!stored.includes('my own words here'))
  assert.ok(stored.includes('counted one apple twice'))
  assert.ok(!/timeTaken|timeMs/.test(stored), 'no time measurements')

  const p = await app.call('GET', '/api/learn/profile', { token: S.ana })
  const adding = p.body.skills.find((s) => s.id === 'maths.test-adding')
  assert.deepEqual([adding.supportStep, adding.state, adding.attempts], [3, 'learning', 4])
  assert.deepEqual(p.body.needsPractice.find((x) => x.skill === 'maths.test-adding').misconception, 'counted one apple twice')
  assert.equal(p.body.next.reason, 'practice')
  // The learner sees the same weekly totals as their grown-ups.
  assert.equal(p.body.history.length, 1)
  assert.equal(p.body.history[0].attempts, 5)
  assert.ok(p.body.history[0].accuracy > 0 && p.body.history[0].accuracy < 1)
})

test('"Practise now": a round centred on one skill; an easier item first when it needs support', async () => {
  const r = await app.call('GET', '/api/learn/round?subject=maths&module=read&skill=maths.test-counting-objects&seed=pn', { token: S.ana })
  assert.equal(r.status, 200)
  assert.equal(r.body.focus, 'maths.test-counting-objects')
  const own = r.body.items.filter((x) => x.support.skill === 'maths.test-counting-objects')
  for (const id of ['T-RM-1-B-2', 'T-RM-1-B-3', 'T-RM-1-B-4']) assert.ok(own.some((x) => x.id === id), id)
  // B-1 was just answered, so in this small pool it can only come back as a last-resort repeat.
  assert.ok(r.body.items.length >= 6, 'topped up with the normal mix')
  const sup = await app.call('GET', '/api/learn/round?subject=maths&module=read&skill=maths.test-adding&seed=pn', { token: S.ana })
  assert.ok(sup.body.items.some((x) => x.why === 'prerequisite' && x.support.for === 'maths.test-adding'))
  const unknown = await app.call('GET', '/api/learn/round?subject=maths&module=read&skill=maths.no-such-skill&seed=pn', { token: S.ana })
  const normal = await app.call('GET', '/api/learn/round?subject=maths&module=read&seed=pn', { token: S.ana })
  assert.deepEqual([unknown.status, unknown.body.focus], [200, null])
  assert.deepEqual(unknown.body.items.map((x) => x.id), normal.body.items.map((x) => x.id))
  for (const bad of ['Maths.Adding', 'maths adding', '<script>', 'x'.repeat(81)]) {
    assert.equal((await app.call('GET', `/api/learn/round?subject=maths&module=read&skill=${encodeURIComponent(bad)}`, { token: S.ana })).status, 400, bad)
  }
})

test('log-answer: uncertain, ungraded, timed and unknown answers never count', async () => {
  const before = await app.db.main.collection('studentanswers').countDocuments({ email: 'bea@kids.test' })
  const unheard = await answer(S.bea, { module: 'speak', subject: 'english', questionId: 'T-SE-1', status: 'uncertain', reason: 'no_speech', correct: false })
  assert.equal(unheard.body.learn.counted, false)
  assert.equal(unheard.body.learn.message.key, 'noSpeech')
  assert.equal(await app.db.main.collection('studentanswers').countDocuments({ email: 'bea@kids.test' }), before, 'not stored as right or wrong')
  const oldMic = await answer(S.bea, { module: 'speak', subject: 'english', questionId: 'T-SE-1', correct: true })
  assert.equal(oldMic.body.learn.counted, false, 'old clients counted a failed microphone as right')
  assert.equal(oldMic.body.learn.notCounted, 'uncertain')
  const open = await answer(S.bea, { module: 'speak', subject: 'english', questionId: 'T-SE-OPEN', status: 'ungraded', correct: true })
  assert.deepEqual([open.body.learn.counted, open.body.learn.message.key], [false, 'practiceOnly'])
  // The same open question in a Warrior round: "not scored", never "just for practice, there is no wrong answer".
  const openWarrior = await answer(S.bea, { module: 'speak', subject: 'english', questionId: 'T-SE-OPEN', status: 'ungraded', correct: true, mode: 'warrior' })
  assert.equal(openWarrior.body.learn.counted, false)
  assert.ok(['warriorNotScored', 'warriorOpen'].includes(openWarrior.body.learn.message.key), openWarrior.body.learn.message.key)
  assert.match(openWarrior.body.learn.message.text, /(isn't|aren't) scored/)
  assert.doesNotMatch(openWarrior.body.learn.message.text, /practice|no wrong answer/i)
  const openText = await answer(S.bea, { questionId: 'T-RM-1-OPEN', status: 'incorrect', correct: false })
  assert.equal(openText.body.learn.notCounted, 'ungraded')
  const timed = await answer(S.bea, { questionId: 'T-RM-1-A-1', status: 'incorrect', correct: false, mode: 'warrior' })
  assert.deepEqual([timed.body.learn.counted, timed.body.learn.notCounted], [false, 'mode'])
  const unknown = await answer(S.bea, { questionId: 'NOPE-1', status: 'correct', correct: true })
  assert.deepEqual([unknown.status, unknown.body.learn], [200, null])
  const excluded = await answer(S.bea, { questionId: 'T-RM-1-X', status: 'incorrect', correct: false })
  assert.equal(excluded.body.learn.counted, false)
  const p = await app.call('GET', '/api/learn/profile', { token: S.bea })
  assert.equal(p.body.skills.length, 0)
  assert.equal(p.body.profile.levels.english.attempts, 0)
})

test('response time never changes anything', async () => {
  const seq = ['correct', 'incorrect', 'correct', 'correct', 'close']
  const out = {}
  for (const [who, timeTaken] of [['tim1', 2], ['tim2', 900]]) {
    for (const [i, status] of seq.entries()) await answer(S[who], { status, correct: status === 'correct', firstTry: true, timeTaken, questionId: `T-RM-1-A-${(i % 4) + 1}` })
    const p = await app.call('GET', '/api/learn/profile', { token: S[who] })
    out[who] = { skills: p.body.skills.map(({ due, ...s }) => s), level: p.body.profile.levels.maths }
  }
  assert.deepEqual(out.tim1, out.tim2)
})

test('advance: 12 strong answers at the level over two days moves the level up by one', async () => {
  let last
  for (let i = 0; i < 12; i++) {
    // Two time zones 25 h apart: the same moment is on two different local days.
    const tz = i < 6 ? 'Pacific/Kiritimati' : 'Pacific/Pago_Pago'
    last = await answer(S.lvl, { status: 'correct', correct: true, firstTry: true, hintsUsed: 0, questionId: `T-RM-1-${i % 2 ? 'A' : 'B'}-${(i % 4) + 1}` }, tz)
    if (i < 11) assert.equal(last.body.learn.levelChange, undefined, `no move after ${i + 1}`)
  }
  assert.deepEqual(last.body.learn.levelChange, { subject: 'maths', from: 1, to: 2 })
  assert.equal(last.body.learn.message.key, 'levelUp')
  assert.equal(last.body.learn.message.params.level, 2)
  const p = await app.call('GET', '/api/learn/profile', { token: S.lvl })
  assert.deepEqual([p.body.profile.levels.maths.level, p.body.profile.levels.maths.source, p.body.profile.levels.maths.attempts], [2, 'engine', 0])
  // A new level starts fresh: nothing above it is served.
  const r = await app.call('GET', '/api/learn/round?subject=maths&module=read&seed=z', { token: S.lvl })
  assert.ok(r.body.items.every((x) => x.level <= 2))
})

test('struggling: never moved down automatically; a suggestion the learner can accept or decline', async () => {
  const put = await app.call('PUT', '/api/learn/profile', { token: S.down, body: { levels: { maths: 2 } } })
  assert.equal(put.status, 200)
  assert.deepEqual([put.body.profile.levels.maths.level, put.body.profile.levels.maths.source], [2, 'self'])
  for (let i = 0; i < 12; i++) {
    const r = await answer(S.down, { status: 'incorrect', correct: false, firstTry: true, questionId: `T-RM-2-D-${(i % 4) + 1}` }, i < 6 ? 'Pacific/Kiritimati' : 'Pacific/Pago_Pago')
    assert.equal(r.body.learn.levelChange, undefined)
  }
  let p = await app.call('GET', '/api/learn/profile', { token: S.down })
  assert.equal(p.body.profile.levels.maths.level, 2)
  assert.equal(p.body.profile.levels.maths.status, 'support')
  const down = p.body.profile.suggestions.find((s) => s.type === 'level_down')
  assert.ok(down, JSON.stringify(p.body.profile.suggestions))
  assert.deepEqual([down.subject, down.level, down.to, down.key], ['maths', 2, 1, 'levelDown'])
  assert.match(down.text, /level 1/)
  assert.ok(p.body.profile.suggestions.some((s) => s.type === 'break'), 'many misses in one sitting: a break is offered')
  assert.equal((await app.call('POST', '/api/learn/suggestions/abcdef123456', { token: S.down, body: { accept: true } })).status, 404)
  assert.equal((await app.call('POST', `/api/learn/suggestions/${down.id}`, { token: S.down, body: { accept: 'yes' } })).status, 400)
  const ok = await app.call('POST', `/api/learn/suggestions/${down.id}`, { token: S.down, body: { accept: true } })
  assert.equal(ok.status, 200)
  assert.deepEqual(ok.body.levelChange, { subject: 'maths', from: 2, to: 1 })
  assert.deepEqual([ok.body.profile.levels.maths.level, ok.body.profile.levels.maths.source], [1, 'self'])
  const brk = ok.body.profile.suggestions.find((s) => s.type === 'break')
  p = await app.call('POST', `/api/learn/suggestions/${brk.id}`, { token: S.down, body: { accept: false } })
  assert.ok(!p.body.profile.suggestions.some((s) => s.type === 'break' || s.type === 'level_down'))
  // Missing again after the skill was parked: ask a grown-up to look at it together.
  const review = p.body.profile.suggestions.find((s) => s.type === 'review')
  assert.deepEqual([review.skill, review.params.skill.id], ['maths.test-adding-20', 'maths.test-adding-20'])
  const parked = p.body.skills.find((s) => s.id === 'maths.test-adding-20')
  assert.deepEqual([parked.supportStep, parked.strategy], [4, 'reassess'])
  const r = await app.call('GET', '/api/learn/round?subject=maths&module=read&seed=p', { token: S.down })
  assert.ok(!r.body.items.some((x) => x.support.skill === 'maths.test-adding-20'), 'a parked skill rests until tomorrow')
})

test('learner settings: validated strictly', async () => {
  const ok = await app.call('PUT', '/api/learn/profile', { token: S.bea, body: { pace: 'brisk', ageBand: 'teen', supports: { font: 'readable', timer: 'off', speakInstead: 'type' }, goals: [{ text: 'Read every day', subject: 'english', target: 5 }] } })
  assert.equal(ok.status, 200)
  assert.deepEqual([ok.body.profile.pace, ok.body.profile.ageBand, ok.body.profile.supports.font, ok.body.profile.goals[0].text, ok.body.profile.goals[0].by], ['brisk', 'teen', 'readable', 'Read every day', 'learner'])
  for (const body of [{ levels: { maths: 9 } }, { levels: { maths: 2.5 } }, { supports: { diagnosis: 'x' } }, { supports: { voiceRate: 4 } }, { pace: 'fast' }, { role: 'admin' }, { levels: { maths: { level: 2, locked: true } } }]) {
    const r = await app.call('PUT', '/api/learn/profile', { token: S.bea, body })
    assert.equal(r.status, 400, JSON.stringify(body))
  }
})

test('baseline: one item per level, placement from the answers; optional', async () => {
  const b = await app.call('GET', '/api/learn/baseline?subject=maths&module=read&seed=q', { token: S.bea })
  assert.equal(b.status, 200)
  assert.deepEqual(b.body.items.map((x) => x.level), [0, 1, 2, 3])
  assert.ok(b.body.items.every((x) => !['T-RM-1-X', 'T-RM-1-OPEN'].includes(x.id)))
  const results = b.body.items.map((x) => ({ questionId: x.id, level: x.level, status: x.level <= 1 ? 'correct' : 'incorrect' }))
  const r = await app.call('POST', '/api/learn/baseline', { token: S.bea, body: { subject: 'maths', results } })
  assert.equal(r.status, 200)
  assert.equal(r.body.level, 1)
  const p = await app.call('GET', '/api/learn/profile', { token: S.bea })
  assert.deepEqual([p.body.profile.levels.maths.level, p.body.profile.levels.maths.source, p.body.profile.baselineDone.maths], [1, 'baseline', true])
  // The level written by the client is ignored: levels come from the questions.
  const lie = await app.call('POST', '/api/learn/baseline', { token: S.bea, body: { subject: 'maths', results: [{ questionId: 'T-RM-0-C-1', level: 8, status: 'correct' }] } })
  assert.equal(lie.body.level, 0)
  for (const body of [{ subject: 'art', results }, { subject: 'maths', results: [] }, { subject: 'maths', results: [{ questionId: 'x', status: 'great' }] }, { subject: 'maths', results: [{ questionId: 'NOPE', status: 'correct' }] }]) {
    assert.equal((await app.call('POST', '/api/learn/baseline', { token: S.bea, body })).status, 400, JSON.stringify(body))
  }
})

test('guardian learning plan: verified guardians only, strict input, audit-logged; locks bind the learner', async () => {
  const url = `/api/parent/children/${ids.childAna}/learning`
  assert.equal((await app.call('GET', url)).status, 401)
  assert.equal((await app.call('GET', url, { token: S.ana })).status, 401, 'a learner token is not a parent token')
  assert.equal((await app.call('GET', url, { token: T().t1 })).status, 401, 'a teacher token is not a parent token')
  const pending = await app.call('GET', `/api/parent/children/${ids.childPending}/learning`, { token: P().stranger })
  assert.deepEqual([pending.status, pending.body.code], [403, 'LINK_NOT_VERIFIED'])
  assert.equal((await app.call('PUT', `/api/parent/children/${ids.childPending}/learning`, { token: P().stranger, body: { pace: 'gentle' } })).status, 403)
  assert.equal((await app.call('GET', url, { token: P().stranger })).status, 404, "someone else's child")
  assert.equal((await app.call('GET', '/api/parent/children/not-an-id/learning', { token: P().mum })).status, 404)

  const g = await app.call('GET', url, { token: P().mum })
  assert.equal(g.status, 200)
  assert.ok(g.body.skills.some((s) => s.id === 'maths.test-adding'))
  const diff = g.body.difficulties.find((d) => d.skill === 'maths.test-adding' && d.misconception === 'counted one apple twice')
  assert.equal(diff.count, 1)
  assert.equal(diff.parentNote, 'Counting each thing once shows a steady count (T-RM-1-A-1).', 'from the question behind it')
  assert.equal(diff.teacherAction, 'Count together, touching each apple once (T-RM-1-A-1).')
  assert.ok(g.body.history[0].attempts >= 5)
  assert.ok(g.body.history[0].accuracy >= 0 && g.body.history[0].accuracy <= 1)

  for (const body of [{ levels: { maths: { level: 12 } } }, { levels: { maths: { locked: 'yes' } } }, { supports: { diagnosis: 'dyslexia' } }, { overrides: [{ type: 'hold_level' }] }, { overrides: [{ type: 'lower_level', subject: 'maths' }] }, { notes: 'x' }]) {
    assert.equal((await app.call('PUT', url, { token: P().mum, body })).status, 400, JSON.stringify(body))
  }
  const put = await app.call('PUT', url, { token: P().mum, body: { levels: { maths: { level: 2, locked: true } }, pace: 'gentle', supports: { font: 'dyslexic' }, overrides: [{ type: 'focus_skill', skill: 'maths.test-adding' }], goals: [{ text: 'Practise ten minutes', subject: 'maths', target: 10 }] } })
  assert.equal(put.status, 200, JSON.stringify(put.body))
  const m = put.body.profile.levels.maths
  assert.deepEqual([m.level, m.source, m.locked], [2, 'guardian', true])
  assert.deepEqual(put.body.profile.overrides, [{ type: 'focus_skill', subject: null, skill: 'maths.test-adding', by: 'guardian' }])
  assert.equal(put.body.profile.goals[0].by, 'guardian')
  assert.deepEqual([m.lockedBy, m.setBy], ['guardian', { role: 'guardian', name: 'Parent' }])
  // Locking without changing the level: the source stays, and who locked it (and when) is recorded.
  const lockOnly = await app.call('PUT', url, { token: P().mum, body: { levels: { english: { locked: true } } } })
  const en = lockOnly.body.profile.levels.english
  assert.deepEqual([en.level, en.source, en.locked, en.lockedBy, en.setBy], [1, 'default', true, 'guardian', { role: 'guardian', name: 'Parent' }])
  assert.ok(Date.now() - new Date(en.setAt).getTime() < 60_000)
  assert.ok(!JSON.stringify(lockOnly.body.profile.levels).includes('@'), 'no emails')
  const unlock = await app.call('PUT', url, { token: P().mum, body: { levels: { english: { locked: false } } } })
  assert.deepEqual([unlock.body.profile.levels.english.locked, unlock.body.profile.levels.english.lockedBy], [false, null])
  const learnerSees = await app.call('GET', '/api/learn/profile', { token: S.ana })
  assert.deepEqual([learnerSees.body.profile.levels.maths.lockedBy, learnerSees.body.profile.levels.maths.setBy.role], ['guardian', 'guardian'])
  const ev = await app.db.main.collection('auditevents').findOne({ action: 'learning.update', actorRole: 'parent', targetId: ids.childAna })
  assert.ok(ev)
  assert.deepEqual(ev.meta.levels.maths, { from: 1, to: 2, locked: true })

  // The learner cannot change a locked level, accept a level suggestion, or re-place themselves.
  const mine = await app.call('PUT', '/api/learn/profile', { token: S.ana, body: { levels: { maths: 3 } } })
  assert.deepEqual([mine.status, mine.body.code], [409, 'LEVEL_LOCKED'])
  const base = await app.call('POST', '/api/learn/baseline', { token: S.ana, body: { subject: 'maths', results: [{ questionId: 'T-RM-0-C-1', status: 'correct' }] } })
  assert.equal(base.status, 409)
  // ...but can still tick a grown-up's goal as done (and not delete it).
  const gid = put.body.profile.goals[0].id
  const tick = await app.call('PUT', '/api/learn/profile', { token: S.ana, body: { goals: [{ id: gid, text: 'Practise ten minutes', done: true }] } })
  assert.equal(tick.status, 200)
  assert.deepEqual([tick.body.profile.goals.length, tick.body.profile.goals[0].done, tick.body.profile.goals[0].by], [1, true, 'guardian'])
  const gone = await app.call('PUT', '/api/learn/profile', { token: S.ana, body: { goals: [] } })
  assert.equal(gone.body.profile.goals.length, 1, "a grown-up's goal stays")
})

test('teacher learning plan: only a teacher of one of the student\'s groups', async () => {
  const url = '/api/teacher/students/sam@kids.test/learning'
  assert.equal((await app.call('GET', url)).status, 401)
  assert.equal((await app.call('GET', url, { token: S.sam })).status, 401)
  assert.equal((await app.call('GET', url, { token: P().mum })).status, 401)
  assert.equal((await app.call('GET', url, { token: T().t2 })).status, 404, 'same school, not their group')
  assert.equal((await app.call('GET', url, { token: T().tB })).status, 404, 'another school')
  assert.equal((await app.call('GET', url, { token: T().off })).status, 403, 'a disabled teacher account')
  assert.equal((await app.call('GET', '/api/teacher/students/ana@kids.test/learning', { token: T().t1 })).status, 404, 'not a student of this school')
  assert.equal((await app.call('GET', '/api/teacher/students/lone@kids.test/learning', { token: T().t1 })).status, 404, 'in the school, not in my groups')
  const g = await app.call('GET', url, { token: T().t1 })
  assert.equal(g.status, 200)
  assert.equal(g.body.profile.levels.maths.ceiling, 2, "the school's own questions set the ceiling")
  assert.equal((await app.call('GET', `/api/teacher/students/${ids.sam}/learning`, { token: T().t1 })).status, 200, 'by student id too')
  assert.equal((await app.call('PUT', url, { token: T().t1, body: { levels: { english: { level: -1 } } } })).status, 400)
  const put = await app.call('PUT', url, { token: T().t1, body: { levels: { english: { level: 3, locked: true } }, overrides: [{ type: 'hold_level', subject: 'maths' }] } })
  assert.equal(put.status, 200)
  assert.deepEqual([put.body.profile.levels.english.level, put.body.profile.levels.english.source, put.body.profile.levels.english.locked, put.body.profile.levels.maths.held], [3, 'teacher', true, true])
  assert.deepEqual([put.body.profile.levels.english.lockedBy, put.body.profile.levels.english.setBy], ['teacher', { role: 'teacher', name: 'Teacher' }])
  assert.ok(await app.db.main.collection('auditevents').findOne({ action: 'learning.update', actorRole: 'teacher', targetId: ids.sam, orgId: ids.orgA }))
  assert.equal((await app.call('PUT', url, { token: T().t2, body: { pace: 'brisk' } })).status, 404)
})

test('companion summary for the AI Teacher: skills, levels, strategy; no free text, no email', async () => {
  const c = await app.call('GET', '/api/learn/companion', { token: S.ana })
  assert.equal(c.status, 200)
  assert.equal(c.body.name, 'Ana')
  assert.deepEqual(c.body.levels, { english: 1, maths: 2, science: 1 })
  assert.ok(c.body.focus.some((f) => f.skill === 'maths.test-adding' && f.strategy === 'simpler'))
  assert.ok(['words', 'visual', 'guided'].includes(c.body.prefers))
  const raw = JSON.stringify(c.body)
  assert.ok(!raw.includes('ana@kids.test'))
  assert.ok(!raw.includes('Practise ten minutes'), 'no goal text')
  assert.ok(!raw.includes('counted one apple twice'), 'no misconception text')
})

test('reset personalisation: what the engine learned goes, answer history and grown-up locks stay', async () => {
  const answersBefore = await app.db.main.collection('studentanswers').countDocuments({ email: 'ana@kids.test' })
  const r = await app.call('DELETE', '/api/learn/profile', { token: S.ana })
  assert.equal(r.status, 200)
  assert.ok(r.body.removed.skills >= 2)
  assert.deepEqual(r.body.skills, [])
  assert.deepEqual([r.body.profile.levels.maths.level, r.body.profile.levels.maths.locked], [2, true])
  assert.equal(r.body.profile.overrides.length, 1)
  assert.equal(r.body.profile.levels.english.source, 'default')
  assert.equal(await app.db.main.collection('skillmasteries').countDocuments({ email: 'ana@kids.test' }), 0)
  assert.equal(await app.db.main.collection('studentanswers').countDocuments({ email: 'ana@kids.test' }), answersBefore)
})

test('privacy: learning data is in the data export and erased with the learner', async () => {
  await answer(S.ana, { status: 'correct', correct: true, firstTry: true, questionId: 'T-RM-1-B-2' })
  const exp = await app.call('GET', `/api/parent/children/${ids.childAna}/export`, { token: P().mum })
  assert.equal(exp.status, 200)
  assert.equal(exp.body.learningProfile.length, 1)
  assert.ok(exp.body.skillMastery.length >= 1)
  assert.ok(exp.body.counts.learningProfile === 1)
  const { insertedId } = await app.db.main.collection('datarequests').insertOne({ subjectEmail: 'ana@kids.test', subjectName: 'Ana', requestedByRole: 'parent', requestedById: ids.mum, kind: 'delete', status: 'processing', dueAt: new Date(Date.now() - 1000), note: '', createdAt: new Date(), updatedAt: new Date() })
  const run = await app.call('POST', `/api/superadmin/data-requests/${insertedId}/run-deletion`, { token: app.tokens.superadmin() })
  assert.equal(run.status, 200, JSON.stringify(run.body))
  assert.equal(await app.db.main.collection('learnerprofiles').countDocuments({ email: 'ana@kids.test' }), 0)
  assert.equal(await app.db.main.collection('skillmasteries').countDocuments({ email: 'ana@kids.test' }), 0)
})

test('no engine errors were logged along the way', () => {
  assert.ok(!/learning engine error|learn route error|learning plan error/.test(app.log()), app.log().split('\n').filter((l) => /learn/.test(l)).join('\n'))
})
