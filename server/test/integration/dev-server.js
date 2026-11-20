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
  console.log(`Demo ready: ${app.url}  (tokens + ids in server/tmp/demo.json)  ${JSON.stringify(demo.counts)}  bank questions: ${bank}`)
  process.on('SIGINT', async () => { await app.stop(); process.exit(0) })
})().catch((e) => { console.error(e); process.exit(1) })
