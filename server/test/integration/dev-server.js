// A running demo: the real server on a fixed port, an in-memory MongoDB filled with
// demo data, and tokens for every role. For developing and screenshotting dashboards.
//
//   cd server && DEV_PORT=5061 DEV_CLIENT_PORT=5241 node test/integration/dev-server.js   (leave it running)
//   cd client && VITE_API_BASE_URL=http://127.0.0.1:5061/api npx vite --port 5241 --strictPort
// (defaults: API 5055, client 5231; pick your own ports if several people run it)
//
// Sign a browser in by putting a token in localStorage (keys: parent_jwt, teacher_jwt,
// admin_jwt, superadmin_jwt, jwt_token for a student). Tokens are written to
// server/tmp/demo.json together with the ids.
const fs = require('fs')
const path = require('path')
const { start } = require('./harness')
const { seedDemo } = require('../../scripts/seed-demo')

// Learning history for the adaptive journey (welcome back, what next, journey map, evidence,
// decisions, growth badges): the REAL engine in this process, on simulated days, through the same
// functions the API uses (rounds composed by the engine, answers through processAnswer).
//   sam.solo@demo.test (token student_solo, no school: the whole bank): about three weeks of
//     practice in maths, English and science, a skill that was tricky, then came right, an
//     unfinished maths round from two hours ago (welcome = "unfinished"; "Start fresh" shows the next kind);
//     also linked to the demo parent (mum@demo.test) as a verified child "Sam", so the parent's
//     learning view has a child with evidence.
//   Aanya (token student, a school learner: her teachers' questions only): a week of maths, for the
//     teacher's student view (no stages: teacher uploads carry none).
async function demoHistory(app, demo) {
  const base = `mongodb://${app.db.main.host}:${app.db.main.port}`
  Object.assign(process.env, { MONGODB_URI: `${base}/main`, ADMIN_MONGODB_URI: `${base}/admin`, SUPERADMIN_MONGODB_URI: `${base}/superadmin` })
  const mongoose = require('mongoose')
  await mongoose.connect(process.env.MONGODB_URI)
  const { processAnswer } = require('../../services/learning/engine')
  const actions = require('../../services/learning/actions')
  const { createRng } = require('../../services/learning/rng')
  const StudentAnswer = require('../../models/StudentAnswer')
  const StudentRound = require('../../models/StudentRound')
  const StudentActivity = require('../../models/StudentActivity')
  const rng = createRng('demo-history')
  const DAY = 86400000
  const now = Date.now()
  const counts = { answers: 0, rounds: 0 }

  // One round composed by the engine at a simulated time, answered item by item.
  let tricky = null
  let trickyInsight = null
  async function playRound(email, subject, module, at, { ability, size = 8, stopAfter = null }) {
    const r = await actions.round(email, { subject, module, size, seed: `${email}-${at}` }, new Date(at))
    let right = 0
    for (const [i, it] of r.items.entries()) {
      if (stopAfter != null && i >= stopAfter) break
      const t = new Date(at + (i + 1) * 50_000)
      const p = ability(it, t)
      const x = rng.next()
      const outcome = x < p ? 'independent' : x < p + (1 - p) * 0.4 ? 'assisted' : 'incorrect'
      const insight = it.distractor_insight && typeof it.distractor_insight === 'object' ? Object.values(it.distractor_insight).find((v) => typeof v === 'string') : null
      const body = {
        module, subject, questionId: it.id, status: outcome === 'incorrect' ? 'incorrect' : 'correct', correct: outcome !== 'incorrect',
        firstTry: outcome === 'independent', hintsUsed: outcome === 'assisted' ? 1 : 0, supportStep: it.support?.step ?? 0,
        roundId: r.roundId, position: i, mode: 'practice',
        ...(outcome === 'incorrect' && insight ? { misconception: it.support?.skill === tricky && Object.values(it.distractor_insight).includes(trickyInsight) ? trickyInsight : insight } : {}),
      }
      await StudentAnswer.create({ email, module, subject, question: String(it.instruction || '').slice(0, 200), userAnswer: '', correctAnswer: '', correct: body.correct, xpEarned: body.correct ? 10 : 0, mode: 'practice', questionId: it.id, hintsUsed: body.hintsUsed, timestamp: t })
      await processAnswer(email, body, { tz: 'UTC', now: t })
      if (body.correct) right++
      counts.answers++
    }
    if (stopAfter == null && r.items.length) {
      counts.rounds++
      await StudentRound.create({ email, module, subject, mode: 'practice', stars: right, totalStars: right, completedAt: new Date(at + (r.items.length + 1) * 50_000) })
      const day = new Date(at); day.setUTCHours(0, 0, 0, 0)
      await StudentActivity.updateOne({ email, date: day }, { $inc: { totalSessions: 1, totalXP: right * 10, totalMinutes: 5 }, $push: { sessions: { startTime: new Date(at), endTime: new Date(at + 400_000), durationMinutes: 5, module, subject, xpEarned: right * 10, score: Math.round((right / r.items.length) * 100) } } }, { upsert: true })
    }
    return r
  }

  // ── Sam (solo): three weeks, with a tricky maths skill that comes right in the second week ──
  const sam = 'sam.solo@demo.test'
  // The tricky skill: a level-1 maths reading skill whose questions share a misconception (so a
  // repeated mix-up, and its explanation, really happens).
  const { getQuestionModel } = require('../../utils/questionModels')
  const { deriveSkill } = require('../../services/learning/questionMeta')
  const docs = await getQuestionModel('read', 'maths').find({ level: 1, status: 'approved', uploadBatchId: null }).select('id skill skillIds academic.skill distractor_insight').lean()
  const shared = new Map()
  for (const d of docs) for (const t of Object.values(d.distractor_insight || {})) if (typeof t === 'string') { const k = `${deriveSkill(d, 'maths')}|${t}`; shared.set(k, [...(shared.get(k) || []), d.id]) }
  const best = [...shared].sort((a, b) => b[1].length - a[1].length)[0]
  if (best) { const cut = best[0].indexOf('|'); tricky = best[0].slice(0, cut); trickyInsight = best[0].slice(cut + 1) }
  const trickyItems = best ? best[1] : []
  const samAbility = (it, t) => {
    const subjectBase = { english: 0.84, maths: 0.78, science: 0.72 }[it.subject === 'Math' ? 'maths' : String(it.subject || '').toLowerCase()] ?? 0.78
    const stage = Number.isInteger(it.stage) ? it.stage : 2
    if (it.support?.skill === tricky) return t.getTime() < now - 10 * DAY ? 0.25 : 0.85
    return Math.max(0.3, Math.min(0.95, subjectBase - Math.max(0, stage - 2) * 0.1))
  }
  const plan = [
    [21, 'maths', 'read'], [21, 'english', 'listen'], [20, 'maths', 'read'], [19, 'science', 'read'], [18, 'maths', 'write'],
    [17, 'english', 'read'], [16, 'maths', 'read'], [14, 'maths', 'read'], [14, 'english', 'listen'], [13, 'science', 'read'],
    [11, 'maths', 'read'], [10, 'maths', 'write'], [9, 'english', 'read'], [8, 'maths', 'read'], [7, 'science', 'listen'],
    [6, 'maths', 'read'], [5, 'english', 'listen'], [4, 'maths', 'read'], [3, 'maths', 'write'], [2, 'english', 'read'], [1, 'maths', 'read'],
  ]
  for (const [daysAgo, subject, module] of plan) {
    const at = now - daysAgo * DAY + (16 - (daysAgo % 3)) * 3600_000 - now % 3600_000
    await playRound(sam, subject, module, at, { ability: samAbility })
    // today's discovery on some days (when the bank has everyday items)
    if (daysAgo % 5 === 0) {
      const d = await actions.discovery(sam, { tz: 'UTC' }, new Date(at + 3600_000))
      if (d.item) {
        const t = new Date(at + 3600_000)
        await StudentAnswer.create({ email: sam, module: d.module, subject: d.subject, question: 'discovery', correct: true, mode: 'discovery', questionId: d.item.id, timestamp: t })
        await processAnswer(sam, { module: d.module, subject: d.subject, questionId: d.item.id, status: 'correct', correct: true, firstTry: true, hintsUsed: 0, mode: 'discovery' }, { tz: 'UTC', now: t })
      }
    }
  }
  // An unfinished maths round from two hours ago (3 of 8 answered).
  await playRound(sam, 'maths', 'read', now - 2 * 3600_000, { ability: samAbility, stopAfter: 3 })
  // An hour ago, the same mix-up again on the tricky skill until an explanation is due: its next item brings it.
  let explained = false
  for (let k = 0; k < 4 && !explained && trickyItems.length; k++) {
    const id = trickyItems[k % trickyItems.length]
    const t = new Date(now - 3600_000 + k * 60_000)
    await StudentAnswer.create({ email: sam, module: 'read', subject: 'maths', question: '', correct: false, mode: 'practice', questionId: id, timestamp: t })
    const out = await processAnswer(sam, { module: 'read', subject: 'maths', questionId: id, status: 'incorrect', correct: false, firstTry: true, hintsUsed: 0, misconception: trickyInsight, mode: 'practice' }, { tz: 'UTC', now: t })
    explained = !!out?.explain
    counts.answers++
  }
  await app.db.main.collection('children').insertOne({
    _id: new mongoose.Types.ObjectId(), parentId: new mongoose.Types.ObjectId(demo.family.parentId), name: 'Sam', age: 9, email: sam,
    linkStatus: 'verified', verifiedBy: 'child_code', verifiedAt: new Date(), consentVersion: '2026-11', createdAt: new Date(), updatedAt: new Date(),
  })

  // ── Aanya (school learner): a week of her teachers' maths questions ──
  const aanya = demo.family.childEmails[0]
  for (const daysAgo of [7, 6, 4, 3, 1]) {
    await playRound(aanya, 'maths', 'read', now - daysAgo * DAY - 5 * 3600_000, { ability: () => 0.7, size: 6 })
  }
  await mongoose.disconnect()
  return { ...counts, trickySkill: tricky, explanationPending: explained }
}

;(async () => {
  const app = await start({ port: Number(process.env.DEV_PORT) || 5055, clientUrl: `https://localhost:${process.env.DEV_CLIENT_PORT || 5231},http://localhost:5173` })
  const demo = await seedDemo(app.db)
  const school = await require('../../scripts/seed-school-tree').seedSchoolTree(app.db, demo)
  await require('../../scripts/seed-superadmin-demo').seedSuperadminDemo(app.db, demo)
  // Questions and tests through the real API (TCH-020..052), so tests, results and the parent School tab have content.
  await require('../../scripts/seed-demo-tests').seedDemoTests(app, demo)
  // The real built-in question bank (server/data), so rounds, placement and the
  // adaptive engine have content. Teacher uploads seeded above are kept.
  const { questionModels } = require('../../utils/questionModels')
  const FILE = { english: 'english', maths: 'math', science: 'science' }
  let bank = 0
  for (const [mod, bySubject] of Object.entries(questionModels)) {
    for (const [subject, Shared] of Object.entries(bySubject)) {
      // The server runs in its own process: write through this process's connection.
      const Model = app.db.main.models[Shared.modelName] || app.db.main.model(Shared.modelName, Shared.schema)
      const file = path.join(__dirname, '..', '..', 'data', `${FILE[subject]}_${mod}.json`)
      const { questions } = JSON.parse(fs.readFileSync(file, 'utf8'))
      const have = new Set((await Model.find().select('id').lean()).map((q) => String(q.id)))
      bank += (await Model.insertMany(questions.filter((q) => !have.has(String(q.id))))).length
    }
  }
  const history = await demoHistory(app, demo)
  const t = app.tokens
  const out = {
    api: `${app.url}/api`,
    ids: demo,
    tokens: {
      parent: t.parent(demo.family.parentId, demo.family.parentEmail),
      teacher: t.teacher(demo.org.tutorIds[0], demo.org.id, 'sharma@demo.test'),
      teacher2: t.teacher(demo.org.tutorIds[1], demo.org.id, 'iyer@demo.test'),
      admin: t.admin(demo.org.adminId, demo.org.id, demo.org.adminUid),
      solo: t.admin(demo.solo.adminId, demo.solo.orgId, demo.solo.adminUid),
      soloTeacher: t.teacher(demo.solo.tutorId, demo.solo.orgId, 'rao@demo.test'),
      superadmin: t.superadmin(),
      coordinator: t.staff('demo-coord-admin', demo.org.id, school.staffId, 'coordinator', 'coordinator@demo.test'),
      student: t.student(demo.family.childEmails[0], 'Aanya'),
      // A learner with no school: sees the whole built-in bank.
      student_solo: t.student('sam.solo@demo.test', 'Sam'),
    },
  }
  fs.mkdirSync(path.join(__dirname, '..', '..', 'tmp'), { recursive: true })
  fs.writeFileSync(path.join(__dirname, '..', '..', 'tmp', 'demo.json'), JSON.stringify(out, null, 2))
  console.log(`Demo ready: ${app.url}  (tokens + ids in server/tmp/demo.json)  ${JSON.stringify(demo.counts)}  bank questions: ${bank}  learning history: ${JSON.stringify(history)}`)
  process.on('SIGINT', async () => { await app.stop(); process.exit(0) })
})().catch((e) => { console.error(e); process.exit(1) })
