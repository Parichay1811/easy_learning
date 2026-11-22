// The adaptive journey end to end (docs/learning/ADAPTIVE.md "Journey"): rounds with
// probes, roundId and target; resume after a new session; misconception explanations;
// welcome / next / discovery / journey / decisions; growth badges; the evidence block for
// guardians and teachers with their access rules; the decision log in export, erase and
// the support footprint; retired time-of-day badges.
const test = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const { start } = require('./harness')

let app
const oid = () => new mongoose.Types.ObjectId()
const ids = {}
const S = {}

const BLOOM = { 1: 'remember', 2: 'understand', 3: 'apply', 4: 'analyze' }
const q = (id, level, skill, stage, extra = {}) => ({
  _id: oid(), id, subject: 'Math', module: 'Read', interaction: 'tap_mcq', level, status: 'approved', uploadBatchId: null,
  instruction: `How many? (${id})`, prompt: '🍎🍎🍎', options: ['2', '3', '4'], correct_answer: '3', accepted_answers: ['3'],
  hints: ['Count each one.'], distractor_insight: { 4: 'counted one apple twice', 2: 'skipped one apple' },
  worked_example: `Touch each apple once as you count (${id}).`,
  analysis: { parent_note: `Counting each thing once (${id}).`, teacher_action_if_missed: `Count together (${id}).` },
  cognition: { bloom: BLOOM[stage] || 'remember' }, skill,
  translations: { de: { instruction: `Wie viele? (${id})`, worked_example: `Berühre jeden Apfel einmal (${id}).` } },
  ...extra,
})

test.before(async () => {
  app = await start()
  const { main, admin } = app.db
  await main.collection('readmaths').insertMany([
    // a skill with stages 1..3 (for probes, mastery evidence and the mini challenge)
    ...[1, 1, 2, 2, 3, 3].map((st, i) => q(`J-CNT-${i}`, 1, 'maths.j-count', st)),
    // a practice-only transfer item (stage 5, ungraded): never counts towards stages or challenges
    q('J-CNT-T', 1, 'maths.j-count', 4, { stage: 5, graded: false }),
    // a second skill (misconceptions)
    ...[1, 2, 2, 3].map((st, i) => q(`J-ADD-${i}`, 1, 'maths.j-add', st)),
    // a third and an easier level
    ...[1, 2, 3].map((st, i) => q(`J-SUB-${i}`, 1, 'maths.j-sub', st)),
    ...[1, 1, 2].map((st, i) => q(`J-L0-${i}`, 0, 'maths.j-warm', st)),
    // the everyday-curiosity pool
    ...[0, 1, 2].map((i) => q(`J-EV-${i}`, 0, 'maths.j-everyday', 0, {
      everyday: true, stage: 0, instruction: `You share 6 sweets between 2 friends (${i}).`,
      narration: { text: `You have 6 sweets and 2 friends (${i}).`, style: 'curious', v: 1, status: 'authored' },
      translations: { de: { instruction: `Du teilst 6 Bonbons (${i}).`, narration: { text: `Du hast 6 Bonbons und 2 Freunde (${i}).`, style: 'curious', v: 1, status: 'templated' } } },
    })),
  ])
  await main.collection('readsciences').insertMany([
    { ...q('J-SC-EV-0', 0, 'science.j-weather', 0, { everyday: true, stage: 0, subject: 'Science', narration: { text: 'It is raining. What do you take?', style: 'curious', v: 1, status: 'authored' }, translations: { de: { instruction: 'Es regnet.', narration: { text: 'Du hast 1 Schirm (Regen).', style: 'curious', v: 1, status: 'templated' } } } }), options: ['Umbrella', 'Sunglasses'], correct_answer: 'Umbrella', accepted_answers: ['Umbrella'], interaction: 'true_false' },
    // an excluded everyday item: never a discovery
    q('J-EV-X', 0, 'maths.j-everyday', 0, { everyday: true, stage: 0, qa: { status: 'excluded' } }),
  ])

  // Two families: mum has a verified link to Ana; dad (another family) to his own child; a stranger's pending link to Ana.
  const mum = oid(), dad = oid(), stranger = oid(), childAna = oid(), childBen = oid(), childPending = oid()
  await main.collection('parentaccounts').insertMany([
    { _id: mum, uid: 'p-mum', email: 'mum@family.test', name: 'Priya', plan: 'family_plus' },
    { _id: dad, uid: 'p-dad', email: 'dad@other.test', name: 'Tom', plan: 'free' },
    { _id: stranger, uid: 'p-x', email: 'x@other.test', name: 'X', plan: 'free' },
  ])
  await main.collection('children').insertMany([
    { _id: childAna, parentId: mum, name: 'Ana', age: 8, email: 'jana@kids.test', linkStatus: 'verified', verifiedBy: 'child_code', guardianRole: 'primary' },
    { _id: childBen, parentId: dad, name: 'Ben', age: 9, email: 'jben@kids.test', linkStatus: 'verified', verifiedBy: 'child_code', guardianRole: 'primary' },
    { _id: childPending, parentId: stranger, name: 'Ana?', age: 8, email: 'jana@kids.test', linkStatus: 'pending' },
  ])
  // A school: t1 teaches the group with Sam; t2 is in the school but not the group.
  const org = oid(), g1 = oid(), t1 = oid(), t2 = oid(), sam = oid()
  await admin.collection('organizations').insertOne({ _id: org, name: 'Sunrise', kind: 'institute', status: 'approved', adminUid: 'adm', adminEmail: 'head@s.test' })
  const tutor = (_id, email) => ({ _id, name: email, email, orgId: org, uid: `g-${email}`, authStatus: 'active', status: 'active', batchIds: [], studentIds: [], subjectIds: [] })
  await admin.collection('tutors').insertMany([tutor(t1, 't1@s.test'), tutor(t2, 't2@s.test')])
  await admin.collection('students').insertOne({ _id: sam, name: 'Sam', email: 'jsam@kids.test', orgId: org, batchIds: [g1], tutorIds: [], parentIds: [], status: 'active' })
  await admin.collection('batches').insertOne({ _id: g1, name: 'Y3', orgId: org, tutorIds: [t1], directTutorIds: [t1], subjects: [], studentIds: [sam], status: 'active' })
  // The school's own questions: an older flat upload with a NUMERIC id (no interaction, level, skill or stage)
  // and a question-bank upload without level or stage (skill from skillIds).
  const upload = oid()
  await app.db.superadmin.collection('questionuploadbatches').insertOne({ _id: upload, module: 'read', subject: 'maths', orgId: String(org), status: 'approved', batchIds: [String(g1)], createdAt: new Date() })
  await main.collection('readmaths').insertMany([
    { _id: oid(), id: 9101, title: 'Halves', content: 'Half of 18 is…', question: 'Choose the answer', option1: '8', option2: '9', option3: '6', answer: '9', status: 'approved', uploadBatchId: upload },
    { _id: oid(), id: '9102', interaction: 'tap_mcq', instruction: 'Which fraction is the biggest?', options: ['1/2', '1/4', '1/8'], correct_answer: '1/2', skillIds: ['comparing fractions'], status: 'approved', uploadBatchId: upload },
  ])
  Object.assign(ids, { mum: String(mum), dad: String(dad), stranger: String(stranger), childAna: String(childAna), childBen: String(childBen), childPending: String(childPending), org: String(org), t1: String(t1), t2: String(t2), sam: String(sam) })
  for (const e of ['jana', 'jben', 'jres', 'jmis', 'jdis', 'jband', 'jold', 'jsam', 'jnew']) S[e] = app.tokens.student(`${e}@kids.test`, e === 'jana' ? 'Ana Maria' : e)
})
test.after(async () => { await app?.stop() })

const P = () => ({ mum: app.tokens.parent(ids.mum, 'mum@family.test'), dad: app.tokens.parent(ids.dad, 'dad@other.test'), stranger: app.tokens.parent(ids.stranger, 'x@other.test') })
const T = () => ({ t1: app.tokens.teacher(ids.t1, ids.org, 't1@s.test'), t2: app.tokens.teacher(ids.t2, ids.org, 't2@s.test') })
const answer = (token, body) => app.call('POST', '/api/dashboard/log-answer', { token, headers: { 'x-timezone': 'UTC' }, body: { module: 'read', subject: 'maths', question: 'q', userAnswer: '3', correctAnswer: '3', xpEarned: 10, mode: 'practice', firstTry: true, hintsUsed: 0, ...body } })
const right = (token, questionId, extra = {}) => answer(token, { status: 'correct', correct: true, questionId, ...extra })
const wrong = (token, questionId, extra = {}) => answer(token, { status: 'incorrect', correct: false, questionId, userAnswer: '4', ...extra })

test('the new endpoints need a signed-in learner', async () => {
  for (const [m, p] of [['GET', '/api/learn/welcome'], ['GET', '/api/learn/next'], ['GET', '/api/learn/discovery'], ['GET', '/api/learn/journey'], ['GET', '/api/learn/decisions'], ['DELETE', '/api/learn/round/resume?subject=maths&module=read']]) {
    assert.equal((await app.call(m, p)).status, 401, `${m} ${p}`)
    assert.equal((await app.call(m, p, { token: P().mum })).status, 401, `parent token on ${m} ${p}`)
  }
  for (const bad of ['/api/learn/welcome?lang=german!', '/api/learn/decisions?limit=0', '/api/learn/decisions?limit=500', '/api/learn/round?subject=maths&module=read&mode=race', '/api/learn/next?lang=x_y']) {
    assert.equal((await app.call('GET', bad, { token: S.jnew })).status, 400, bad)
  }
  assert.equal((await app.call('DELETE', '/api/learn/round/resume?subject=art&module=read', { token: S.jnew })).status, 400)
})

test('a first-time learner: welcome "first", explore next, an empty journey and decision log; GETs write nothing', async () => {
  const w = await app.call('GET', '/api/learn/welcome?lang=de', { token: S.jnew })
  assert.equal(w.status, 200)
  assert.deepEqual([w.body.kind, w.body.calm, w.body.message.key, w.body.actions[0].type], ['first', false, `learn.welcome.first.${w.body.message.key.split('.').pop()}`, 'start'])
  assert.equal(w.body.message.params.name, 'jnew')
  const calm = await app.call('GET', '/api/learn/welcome?calm=1', { token: S.jnew })
  assert.deepEqual([calm.body.calm, calm.body.message.key], [true, 'learn.welcome.first.calm'])
  const n = await app.call('GET', '/api/learn/next', { token: S.jnew })
  assert.ok(n.body.items.length >= 1 && n.body.items.length <= 6)
  assert.ok(n.body.items.every((i) => ['discovery', 'explore'].includes(i.kind)), JSON.stringify(n.body.items.map((i) => i.kind)))
  const j = await app.call('GET', '/api/learn/journey', { token: S.jnew })
  assert.equal(j.status, 200)
  assert.deepEqual(Object.keys(j.body.subjects), ['english', 'maths', 'science'])
  const m = j.body.subjects.maths
  assert.deepEqual([m.level, m.ceiling, m.reached, m.stages.length], [1, 1, null, 6])
  assert.deepEqual(m.stages[2], { stage: 2, name: 'understanding', skills: 4, practiceOnly: 0, attempted: 0, mastered: 0 })
  assert.deepEqual(m.stages[5], { stage: 5, name: 'transfer', skills: 0, practiceOnly: 1, attempted: 0, mastered: 0 }, 'stage 5: nothing graded yet')
  assert.deepEqual(j.body.maths, m, 'also keyed by subject at the top level')
  const d = await app.call('GET', '/api/learn/decisions', { token: S.jnew })
  assert.deepEqual(d.body.decisions, [])
  assert.equal(await app.db.main.collection('learnerprofiles').countDocuments({ email: 'jnew@kids.test' }), 0, 'nothing stored by looking')
})

test('round: roundId, target band, stages, probes for skills never seen; a mini challenge needs a strong skill', async () => {
  const r = await app.call('GET', '/api/learn/round?subject=maths&module=read&seed=r1', { token: S.jnew })
  assert.equal(r.status, 200)
  assert.match(r.body.roundId, /^[a-f0-9]{12}$/)
  assert.deepEqual(r.body.target, { low: 0.75, high: 0.9, recent: null, n: 0, tilt: 'hold' })
  assert.equal(r.body.mode, null)
  for (const it of r.body.items) {
    assert.ok(Number.isInteger(it.stage), it.id)
    assert.ok(['probe', 'new', 'prerequisite', 'practice'].includes(it.why), it.why)
  }
  assert.ok(r.body.items.some((x) => x.why === 'probe'))
  const again = await app.call('GET', '/api/learn/round?subject=maths&module=read&seed=r1', { token: S.jnew })
  assert.deepEqual(again.body.items.map((x) => x.id), r.body.items.map((x) => x.id), 'deterministic per seed')
  assert.notEqual(again.body.roundId, r.body.roundId, 'a new round id each time')
  const ch = await app.call('GET', '/api/learn/round?subject=maths&module=read&mode=challenge', { token: S.jnew })
  assert.deepEqual([ch.status, ch.body.items.length, ch.body.challenge, ch.body.mode], [200, 0, null, 'challenge'])
  const disc = await app.call('GET', '/api/learn/round?subject=maths&module=read&mode=discovery&lang=de', { token: S.jnew })
  assert.ok(disc.body.items.length >= 1 && disc.body.items.every((x) => x.why === 'discovery' && x.everyday === true && x.stage === 0))
  assert.ok(disc.body.items.every((x) => x.id !== 'J-EV-X'), 'never an excluded item')
  assert.ok(disc.body.items.every((x) => /^Du hast/.test(x.narration.text) && x.narration.status === 'templated'), 'localized narration passed through unchanged')
})

test('resume: an unfinished round comes back after a new session, same items, same order, from where it stopped', async () => {
  const r = await app.call('GET', '/api/learn/round?subject=maths&module=read&size=6&seed=res', { token: S.jres })
  const ids6 = r.body.items.map((x) => x.id)
  for (let i = 0; i < 3; i++) {
    const a = await right(S.jres, ids6[i], { roundId: r.body.roundId, position: i })
    assert.deepEqual(a.body.learn.round, { roundId: r.body.roundId, position: i, answered: i + 1, total: 6, done: false })
  }
  // A new session: a fresh token, another round fetched meanwhile (not answered).
  const later = app.tokens.student('jres@kids.test', 'jres')
  await app.call('GET', '/api/learn/round?subject=maths&module=read&seed=other', { token: later })
  const res = await app.call('GET', '/api/learn/round?subject=maths&module=read&resume=1&lang=de', { token: later })
  assert.equal(res.status, 200)
  assert.deepEqual([res.body.resume, res.body.position, res.body.roundId], [true, 3, r.body.roundId])
  assert.deepEqual(res.body.items.map((x) => x.id), ids6)
  assert.deepEqual(res.body.answered, ids6.slice(0, 3))
  assert.match(res.body.items[0].instruction, /^Wie viele/, 'in the language asked for now')
  assert.ok(res.body.target && res.body.items.every((x) => x.support && x.why))
  // welcome and next know about it
  const w = await app.call('GET', '/api/learn/welcome', { token: later })
  assert.equal(w.body.kind, 'unfinished')
  assert.deepEqual([w.body.actions[0].type, w.body.actions[0].href], ['continue', '/module/read/maths?resume=1'])
  const n = await app.call('GET', '/api/learn/next', { token: later })
  assert.deepEqual([n.body.items[0].kind, n.body.items[0].why.params.answered, n.body.items[0].why.params.total], ['continue', 3, 6])
  // "Start fresh"
  const del = await app.call('DELETE', '/api/learn/round/resume?subject=maths&module=read', { token: later })
  assert.deepEqual([del.status, del.body.dropped], [200, true])
  const fresh = await app.call('GET', '/api/learn/round?subject=maths&module=read&resume=1', { token: later })
  assert.equal(fresh.body.resume, false)
  assert.notEqual(fresh.body.roundId, r.body.roundId)
  // Finishing a round clears it.
  let last
  for (const [i, it] of fresh.body.items.entries()) last = await right(later, it.id, { roundId: fresh.body.roundId, position: i })
  assert.equal(last.body.learn.round.done, true)
  assert.equal((await app.call('GET', '/api/learn/round?subject=maths&module=read&resume=1', { token: later })).body.resume, false)
  // Only question ids are kept for it.
  const prof = await app.db.main.collection('learnerprofiles').findOne({ email: 'jres@kids.test' })
  assert.ok(!JSON.stringify(prof.rounds).includes('Wie viele') && !JSON.stringify(prof.rounds).includes('How many'))
})

test('probe: a confident first answer at stage >= 2 raises the starting mastery and is logged as a decision', async () => {
  const a = await right(S.jana, 'J-CNT-2') // stage 2, first contact
  assert.equal(a.body.learn.probe, 'confident')
  assert.equal(a.body.learn.stage, 2)
  assert.ok(a.body.learn.mastery >= 0.6)
  const row = await app.db.main.collection('skillmasteries').findOne({ email: 'jana@kids.test', skill: 'maths.j-count' })
  assert.deepEqual([row.box, row.probe.state, row.rightItems, row.topStage, row.stageAvail], [1, 'confident', ['J-CNT-2'], 2, 3])
  const d = await app.call('GET', '/api/learn/decisions?limit=5', { token: S.jana })
  const probe = d.body.decisions.find((x) => x.type === 'probe')
  assert.deepEqual([probe.skill, probe.reason.key, probe.reason.params.stage], ['maths.j-count', 'learn.decision.probe_confident', 2])
  assert.match(probe.reason.text, /confident start/)
  // a weak start: two misses -> gentle, with support
  await wrong(S.jana, 'J-SUB-0')
  const w2 = await wrong(S.jana, 'J-SUB-1')
  assert.equal(w2.body.learn.probe, 'gentle')
  assert.ok(w2.body.learn.supportStep >= 1)
})

test('misconception: the same mix-up twice brings an explanation now and with the next item of that skill', async () => {
  await wrong(S.jmis, 'J-ADD-0', { misconception: 'counted one apple twice', supportStep: 0 })
  const second = await wrong(S.jmis, 'J-ADD-1', { misconception: 'counted one apple twice', lang: 'de' })
  const ex = second.body.learn.explain
  assert.ok(ex, JSON.stringify(second.body.learn))
  assert.deepEqual([ex.skill, ex.source, ex.text, ex.lang], ['maths.j-add', 'worked_example', 'Berühre jeden Apfel einmal (J-ADD-1).', 'de'])
  assert.equal(ex.lead.key, 'learn.explain.lead_skill')
  const r = await app.call('GET', '/api/learn/round?subject=maths&module=read&seed=m1', { token: S.jmis })
  const first = r.body.items.find((x) => x.support.skill === 'maths.j-add')
  assert.ok(first, JSON.stringify(r.body.items.map((x) => [x.id, x.why])))
  assert.equal(first.support.strategy, 'misconception')
  assert.deepEqual([first.support.explain.skill, first.support.explain.text], ['maths.j-add', 'Touch each apple once as you count (J-ADD-1).'])
  assert.equal(r.body.items.filter((x) => x.support.strategy === 'misconception').length, 1, 'only the first item of that skill')
  const d = await app.call('GET', '/api/learn/decisions', { token: S.jmis })
  assert.ok(d.body.decisions.some((x) => x.type === 'misconception_explained' && x.reason.params.count === 2))
  // shown with the next item: done
  await right(S.jmis, first.id)
  const r2 = await app.call('GET', '/api/learn/round?subject=maths&module=read&seed=m2', { token: S.jmis })
  assert.ok(!r2.body.items.some((x) => x.support.strategy === 'misconception'))
  // the log holds no misconception text
  const raw = JSON.stringify(await app.db.main.collection('learningdecisions').find({ email: 'jmis@kids.test' }).toArray())
  assert.ok(!raw.includes('apple'))
})

test('discovery: one everyday question a day, the same all day; answering it earns "First discovery" with its evidence', async () => {
  const d1 = await app.call('GET', '/api/learn/discovery?lang=de', { token: S.jdis })
  assert.equal(d1.status, 200)
  assert.match(d1.body.date, /^\d{4}-\d{2}-\d{2}$/)
  assert.equal(d1.body.item.everyday, true)
  assert.deepEqual([d1.body.item.stage, d1.body.item.why, d1.body.answered, d1.body.mode, d1.body.message.key], [0, 'discovery', false, 'discovery', 'learn.discovery.intro'])
  assert.ok(['maths', 'science'].includes(d1.body.subject) && d1.body.module === 'read')
  assert.match(d1.body.item.narration.text, /^Du hast/, 'the narration in the language asked for, passed through')
  assert.equal(d1.body.item.lang, 'de')
  assert.notEqual(d1.body.item.id, 'J-EV-X')
  const d2 = await app.call('GET', '/api/learn/discovery', { token: S.jdis })
  assert.equal(d2.body.item.id, d1.body.item.id, 'deterministic for the day')
  const a = await answer(S.jdis, { subject: d1.body.subject, questionId: d1.body.item.id, status: 'correct', correct: true, mode: 'discovery' })
  const badge = a.body.learn.achievements.find((x) => x.id === 'growth_first_discovery')
  assert.ok(badge, JSON.stringify(a.body.learn.achievements))
  assert.deepEqual([badge.key, badge.text, badge.evidence.key], ['learn.achievement.growth_first_discovery.name', 'First discovery', 'learn.achievement.growth_first_discovery.evidence'])
  assert.equal(badge.evidence.params.date, d1.body.date)
  const again = await answer(S.jdis, { subject: d1.body.subject, questionId: d1.body.item.id, status: 'correct', correct: true, mode: 'discovery' })
  assert.deepEqual(again.body.learn.achievements, [], 'once')
  const d3 = await app.call('GET', '/api/learn/discovery', { token: S.jdis })
  assert.deepEqual([d3.body.item.id, d3.body.answered, d3.body.message.key], [d1.body.item.id, true, 'learn.discovery.done'])
  const n = await app.call('GET', '/api/learn/next', { token: S.jdis })
  assert.ok(!n.body.items.some((x) => x.kind === 'discovery'), 'answered today: not offered again')
  const list = await app.call('GET', '/api/dashboard/achievements', { token: S.jdis })
  const g = list.body.data.find((x) => x.id === 'growth_first_discovery')
  assert.deepEqual([g.category, g.earned, g.evidence.params.date], ['growth', true, d1.body.date])
  assert.equal(list.body.data.filter((x) => x.category === 'growth').length, 7)
  assert.ok(list.body.data.find((x) => x.id === 'growth_curious' && !x.earned && x.desc.key === 'learn.achievement.growth_curious.desc'))
})

test('band: a run of misses tilts the next round easier (logged once, with the numbers)', async () => {
  for (let i = 0; i < 8; i++) await wrong(S.jband, `J-CNT-${i % 6}`)
  const r = await app.call('GET', '/api/learn/round?subject=maths&module=read&seed=b', { token: S.jband })
  assert.deepEqual(r.body.target, { low: 0.75, high: 0.9, recent: 0, n: 8, tilt: 'easier' })
  const d = await app.call('GET', '/api/learn/decisions?limit=50', { token: S.jband })
  const tilts = d.body.decisions.filter((x) => x.type === 'band_tilt')
  assert.equal(tilts.length, 1)
  assert.match(tilts[0].reason.text, /0% right over the last 8 answers, below the 75-90% target, so the next rounds are a little easier/)
})

test('mini challenge: 3 items one stage up on a strong skill', async () => {
  // jana: maths.j-count started confident at stage 2; two more right answers on other items
  await right(S.jana, 'J-CNT-0')
  await right(S.jana, 'J-CNT-3')
  const row = await app.db.main.collection('skillmasteries').findOne({ email: 'jana@kids.test', skill: 'maths.j-count' })
  assert.equal(row.topStage, 2)
  const ch = await app.call('GET', '/api/learn/round?subject=maths&module=read&mode=challenge&skill=maths.j-count', { token: S.jana })
  assert.equal(ch.status, 200)
  assert.deepEqual(ch.body.challenge, { skill: 'maths.j-count', stage: 3 })
  assert.ok(ch.body.items.length >= 1 && ch.body.items.length <= 3)
  assert.ok(ch.body.items.every((x) => x.why === 'challenge' && x.stage >= 3 && x.support.skill === 'maths.j-count'))
  // a miss in a challenge never counts against anything
  const before = (await app.call('GET', '/api/learn/profile', { token: S.jana })).body.skills.find((s) => s.id === 'maths.j-count')
  const miss = await wrong(S.jana, ch.body.items[0].id, { mode: 'challenge' })
  assert.deepEqual([miss.body.learn.counted, miss.body.learn.notCounted], [false, 'challenge'])
  const after = (await app.call('GET', '/api/learn/profile', { token: S.jana })).body.skills.find((s) => s.id === 'maths.j-count')
  assert.deepEqual(after, before)
})

test('evidence for guardians: baseline, now, stages, decisions; only a verified guardian of this child', async () => {
  // ten graded answers: the baseline is stored once
  for (let i = 0; i < 10; i++) await answer(S.jana, { status: i % 3 ? 'correct' : 'incorrect', correct: !!(i % 3), questionId: `J-ADD-${i % 4}` })
  const url = `/api/parent/children/${ids.childAna}/learning`
  const g = await app.call('GET', url, { token: P().mum })
  assert.equal(g.status, 200)
  const ev = g.body.evidence
  for (const k of ['baseline', 'current', 'byStage', 'stageReached', 'independence', 'retention', 'misconceptions', 'activity', 'insights', 'decisions']) assert.ok(k in ev, k)
  assert.equal(ev.baseline.maths.source, 'first_attempts')
  assert.equal(ev.baseline.maths.n, 10)
  assert.equal(typeof ev.baseline.maths.accuracy, 'number')
  assert.ok(ev.current.maths.n >= 10 && ev.current.maths.level === 1)
  assert.ok(ev.byStage[2].attempts >= 1)
  assert.ok(ev.stageReached.some((s) => s.subject === 'maths' && s.stage >= 2))
  assert.ok(ev.decisions.some((d) => d.type === 'probe' && d.reason.text))
  for (const i of ev.insights) {
    assert.ok(i.key.startsWith('learn.insight.'))
    for (const n of i.text.match(/\d+/g) || []) assert.ok(JSON.stringify(i.params).includes(n), `${i.text} cites ${n}`)
  }
  assert.ok(!/minutes|timeTaken|iq/i.test(JSON.stringify(ev)), 'no time, no IQ')
  // another family, a pending link, a learner or teacher token: no
  assert.equal((await app.call('GET', url, { token: P().dad })).status, 404, "another family's child")
  assert.equal((await app.call('GET', `/api/parent/children/${ids.childPending}/learning`, { token: P().stranger })).status, 403)
  assert.equal((await app.call('GET', url, { token: S.jana })).status, 401)
  assert.equal((await app.call('GET', url, { token: T().t1 })).status, 401)
  const ben = await app.call('GET', `/api/parent/children/${ids.childBen}/learning`, { token: P().dad })
  assert.equal(ben.status, 200)
  assert.deepEqual(ben.body.evidence.decisions, [], "dad sees his own child's (empty) log, nothing of Ana's")
  assert.ok(!JSON.stringify(ben.body).includes('J-ADD'))
})

test('evidence for teachers: only students in their groups; a level they set is logged', async () => {
  await right(S.jsam, 'J-CNT-0') // Sam is a school learner: no Learnigo questions, so this is not counted
  const url = '/api/teacher/students/jsam@kids.test/learning'
  assert.equal((await app.call('GET', url, { token: T().t2 })).status, 404, 'same school, not their group')
  assert.equal((await app.call('GET', `/api/teacher/students/jana@kids.test/learning`, { token: T().t1 })).status, 404, 'not a student of this school')
  const put = await app.call('PUT', url, { token: T().t1, body: { levels: { maths: { level: 2 } } } })
  assert.equal(put.status, 200)
  const d = put.body.evidence.decisions.find((x) => x.type === 'level_set')
  assert.deepEqual([d.reason.key, d.reason.params.from, d.reason.params.to], ['learn.decision.set_by_teacher', 1, 2])
  const mine = await app.call('GET', '/api/learn/decisions', { token: S.jsam })
  assert.ok(mine.body.decisions.some((x) => x.type === 'level_set'), 'the learner sees it too')
})

test('a school learner: answers on their teachers\' questions count (numeric ids of older uploads; no level, skill or stage)', async () => {
  const r = await app.call('GET', '/api/learn/round?subject=maths&module=read&seed=s1', { token: S.jsam })
  assert.equal(r.status, 200)
  assert.deepEqual(r.body.items.map((x) => String(x.id)).sort(), ['9101', '9102'], 'only their school\'s questions')
  assert.ok(r.body.items.every((x) => x.stage === null))
  const legacy = r.body.items.find((x) => String(x.id) === '9101')
  assert.equal(legacy.support.skill, 'maths.general')
  const pos = r.body.items.indexOf(legacy)
  // the client sends the id as it got it (a number here)
  const a = await answer(S.jsam, { questionId: legacy.id, status: 'correct', correct: true, roundId: r.body.roundId, position: pos })
  assert.equal(a.status, 200)
  assert.ok(a.body.learn, 'not null')
  assert.deepEqual([a.body.learn.counted, a.body.learn.skill, a.body.learn.stage, a.body.learn.round.answered], [true, 'maths.general', null, 1])
  const asText = await answer(S.jsam, { questionId: '9101', status: 'incorrect', correct: false })
  assert.equal(asText.body.learn.counted, true, 'the same question by its id as text')
  const bank = await right(S.jsam, '9102')
  assert.deepEqual([bank.body.learn.counted, bank.body.learn.skill], [true, 'maths.comparing-fractions'])
  assert.equal((await answer(S.jsam, { questionId: 'J-CNT-0', status: 'correct', correct: true })).body.learn, null, 'never a question outside their school')
  const stored = await app.db.main.collection('studentanswers').findOne({ email: 'jsam@kids.test', questionId: '9101' })
  assert.ok(stored, 'the answer history keeps the id as text')
  const t = await app.call('GET', '/api/teacher/students/jsam@kids.test/learning', { token: T().t1 })
  assert.ok(t.body.skills.some((x) => x.id === 'maths.general' && x.attempts === 2))
  assert.equal(t.body.evidence.current.maths.n, 3)
  assert.equal(t.body.evidence.activity.explored, 2)
})

test('activities chosen: a round opened from "What next?" or a challenge counts once; a discovery once a day', async () => {
  const before = (await app.db.main.collection('learnerprofiles').findOne({ email: 'jdis@kids.test' }))?.growth?.chosen || 0
  const r = await app.call('GET', '/api/learn/round?subject=maths&module=read&size=3&seed=c1&source=next', { token: S.jdis })
  for (const [i, it] of r.body.items.entries()) await right(S.jdis, it.id, { roundId: r.body.roundId, position: i })
  const plain = await app.call('GET', '/api/learn/round?subject=maths&module=read&size=3&seed=c2', { token: S.jdis })
  await right(S.jdis, plain.body.items[0].id, { roundId: plain.body.roundId, position: 0 })
  const after = (await app.db.main.collection('learnerprofiles').findOne({ email: 'jdis@kids.test' })).growth.chosen
  assert.equal(after - before, 1, 'the "next" round once; the plain round not')
  assert.equal((await app.call('GET', '/api/learn/round?subject=maths&module=read&source=elsewhere', { token: S.jdis })).status, 400)
  const kid = oid()
  await app.db.main.collection('children').insertOne({ _id: kid, parentId: new mongoose.Types.ObjectId(ids.mum), name: 'Dis', age: 8, email: 'jdis@kids.test', linkStatus: 'verified', verifiedBy: 'child_code' })
  const g = await app.call('GET', `/api/parent/children/${kid}/learning`, { token: P().mum })
  assert.equal(g.body.evidence.activity.chosen, after)
  assert.ok(after >= 2, 'the discovery answered earlier counted too')
})

test('a learner from before baselines: computed from their answer history, then stored on the next answer', async () => {
  const t = (d) => new Date(Date.now() - d * 86400000)
  await app.db.main.collection('studentanswers').insertMany(Array.from({ length: 12 }, (_, i) => ({ email: 'jold@kids.test', module: 'read', subject: 'maths', question: 'q', userAnswer: 'x', correctAnswer: 'y', correct: i < 4, mode: 'practice', timestamp: t(30 - i), questionId: `J-CNT-${i % 6}`, hintsUsed: 0, xpEarned: 0 })))
  await app.db.main.collection('skillmasteries').insertOne({ email: 'jold@kids.test', skill: 'maths.j-count', subject: 'maths', attempts: 12, correct: 4, mastery: 0.3, box: 0, supportStep: 1 })
  // a guardian link so the view can be read
  const kid = oid()
  await app.db.main.collection('children').insertOne({ _id: kid, parentId: new mongoose.Types.ObjectId(ids.mum), name: 'Old', age: 10, email: 'jold@kids.test', linkStatus: 'verified', verifiedBy: 'child_code' })
  const g = await app.call('GET', `/api/parent/children/${kid}/learning`, { token: P().mum })
  assert.deepEqual(g.body.evidence.baseline.maths, { level: 1, accuracy: 0.4, n: 10, at: g.body.evidence.baseline.maths.at, source: 'first_attempts' })
  assert.equal(await app.db.main.collection('learnerprofiles').countDocuments({ email: 'jold@kids.test' }), 0, 'reading does not store it')
  await right(S.jold, 'J-CNT-1')
  const prof = await app.db.main.collection('learnerprofiles').findOne({ email: 'jold@kids.test' })
  assert.deepEqual([prof.baseline.maths.n, prof.baseline.maths.accuracy, prof.baseline.maths.source], [10, 0.4, 'first_attempts'])
  // their old skill row is not probed
  const row = await app.db.main.collection('skillmasteries').findOne({ email: 'jold@kids.test', skill: 'maths.j-count' })
  assert.equal(row.probe, undefined)
})

test('time-of-day badges are no longer awarded; ones already earned stay visible', async () => {
  const late = await app.call('POST', '/api/dashboard/log-session', { token: S.jben, body: { module: 'read', subject: 'maths', durationMinutes: 5, startTime: '2026-11-20T22:30:00Z' } })
  assert.equal(late.status, 200)
  assert.ok(!late.body.newAchievements.includes('night_owl'))
  const early = await app.call('POST', '/api/dashboard/log-session', { token: S.jben, body: { module: 'read', subject: 'maths', durationMinutes: 5, startTime: '2026-11-20T05:30:00Z' } })
  assert.ok(!early.body.newAchievements.includes('early_bird'))
  let list = await app.call('GET', '/api/dashboard/achievements', { token: S.jben })
  assert.ok(!list.body.data.some((x) => x.id === 'night_owl' || x.id === 'early_bird'), 'not offered as a goal')
  await app.db.main.collection('studentachievements').insertOne({ email: 'jben@kids.test', achievementId: 'night_owl', earnedAt: new Date('2026-01-01') })
  list = await app.call('GET', '/api/dashboard/achievements', { token: S.jben })
  assert.deepEqual(list.body.data.filter((x) => x.id === 'night_owl').map((x) => x.earned), [true])
})

test('privacy: the decision log is in the export, the support footprint, and erased with the learner', async () => {
  const exp = await app.call('GET', `/api/parent/children/${ids.childAna}/export`, { token: P().mum })
  assert.equal(exp.status, 200)
  assert.ok(exp.body.learningDecisions.length >= 1)
  assert.equal(exp.body.counts.learningDecisions, exp.body.learningDecisions.length)
  assert.ok(exp.body.learningDecisions.every((d) => typeof d.reason === 'string' && Object.values(d.evidence || {}).every((v) => typeof v === 'number')))
  const { insertedId } = await app.db.main.collection('datarequests').insertOne({ subjectEmail: 'jana@kids.test', subjectName: 'Ana', requestedByRole: 'parent', requestedById: ids.mum, kind: 'delete', status: 'processing', dueAt: new Date(Date.now() - 1000), note: '', createdAt: new Date(), updatedAt: new Date() })
  const view = await app.call('GET', `/api/superadmin/data-requests/${insertedId}`, { token: app.tokens.superadmin() })
  const fp = view.body.footprint.find((f) => f.collection === 'learningdecisions')
  assert.ok(fp && fp.count >= 1, JSON.stringify(view.body.footprint))
  const run = await app.call('POST', `/api/superadmin/data-requests/${insertedId}/run-deletion`, { token: app.tokens.superadmin() })
  assert.equal(run.status, 200, JSON.stringify(run.body))
  assert.equal(await app.db.main.collection('learningdecisions').countDocuments({ email: 'jana@kids.test' }), 0)
  assert.equal(await app.db.main.collection('learnerprofiles').countDocuments({ email: 'jana@kids.test' }), 0)
  const after = await app.call('GET', `/api/superadmin/data-requests/${insertedId}`, { token: app.tokens.superadmin() })
  assert.equal(after.body.footprint.find((f) => f.collection === 'learningdecisions').count, 0)
})

test('reset personalisation forgets the decision log too', async () => {
  assert.ok(await app.db.main.collection('learningdecisions').countDocuments({ email: 'jmis@kids.test' }) > 0)
  const r = await app.call('DELETE', '/api/learn/profile', { token: S.jmis })
  assert.equal(r.status, 200)
  assert.equal(await app.db.main.collection('learningdecisions').countDocuments({ email: 'jmis@kids.test' }), 0)
})

test('no engine errors were logged along the way', () => {
  assert.ok(!/learning engine error|learn route error|learning plan error/.test(app.log()), app.log().split('\n').filter((l) => /learn/.test(l)).join('\n'))
})
