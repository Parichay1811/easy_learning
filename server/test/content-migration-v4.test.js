// Content v4 DB migration against the in-memory MongoDB harness (never a real database):
// seed the v3 bank + a teacher upload → dry run → up → verify → idempotent re-run → the API
// serves stage, everyday and the narration in the requested language → down → exactly as before.
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')
const mongoose = require('mongoose')
const { start } = require('./integration/harness')
const { plan, up, down, summary, targets, verify, MIGRATION } = require('../scripts/migrations/2026-11-21-content-v4')

const { EJSON } = mongoose.mongo.BSON
const V4 = ['stage', 'everyday', 'narration']

test('content v4 migration: dry run, up, verify, idempotent, served fields, down', { timeout: 180000 }, async () => {
  const app = await start()
  const backupRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'content-v4-'))
  try {
    const db = app.db.main.db
    const created = new Date('2026-11-20T10:00:00Z')
    // v3 state: every question except the everyday pool, without the v4 fields.
    let seeded = 0
    for (const t of targets()) {
      const { questions } = require(`../data/${t.file}`)
      const old = questions.filter((q) => !/-E00-/.test(q.id)).map((q) => {
        const d = JSON.parse(JSON.stringify(q))
        for (const k of V4) delete d[k]
        if (d.translations) for (const l of Object.keys(d.translations)) delete d.translations[l].narration
        d.qa = { ...d.qa, version: 3, reviewed: '2026-11-20' }
        return { ...d, status: 'approved', uploadBatchId: null, submittedBy: null, createdAt: created, updatedAt: created }
      })
      seeded += old.length
      await db.collection(t.collection).insertMany(old)
    }
    const sr = targets().find((t) => t.file === 'science_read.json').collection
    const batch = new mongoose.Types.ObjectId()
    // A teacher upload that happens to use a new everyday id: must be left alone.
    await db.collection(sr).insertOne({ id: 'SCI-RD-E00-Q01', question: 'Teacher copy', answer: 'y', uploadBatchId: batch, status: 'approved', createdAt: created })
    const snapshot = async () => {
      const out = {}
      for (const t of targets()) out[t.collection] = EJSON.stringify(await db.collection(t.collection).find({}).sort({ id: 1 }).toArray(), { relaxed: false })
      return out
    }
    const before = await snapshot()

    // Dry run
    const p = summary(await plan(db))
    assert.equal(p.updated, seeded, 'every existing bank question gains the v4 fields')
    assert.equal(p.skipped, 1, 'the teacher upload sharing a bank id is skipped')
    assert.equal(p.inserted, 47, '48 everyday items minus the one id a teacher upload holds')
    assert.match(p.text, /fields updated: .*stage/)
    assert.deepEqual(await snapshot(), before, 'a dry run writes nothing')

    // Up
    const r = await up(db, { backupRoot, now: new Date('2026-11-21T10:00:00Z') })
    assert.ok(r.backupDir && fs.existsSync(path.join(r.backupDir, 'manifest.json')))
    assert.equal(JSON.parse(fs.readFileSync(path.join(r.backupDir, 'manifest.json'), 'utf8')).migration, MIGRATION)
    const q = await db.collection(sr).findOne({ id: 'SCI-RD-T02-Q01' })
    assert.equal(q.stage, 2)
    assert.equal(q.everyday, false)
    assert.equal(q.narration.status, 'authored')
    assert.equal(q.translations.de.narration.status, 'templated')
    assert.equal(q.qa.version, 4)
    assert.deepEqual(q.createdAt, created, 'documents are updated in place, not replaced')
    const sl = targets().find((t) => t.file === 'science_listen.json').collection
    const ev = await db.collection(sl).findOne({ id: 'SCI-LIS-E00-Q01' })
    assert.equal(ev.everyday, true)
    assert.equal(ev.stage, 0)
    assert.equal(ev.status, 'approved')
    assert.equal(ev.uploadBatchId, null)
    assert.equal((await db.collection(sr).findOne({ id: 'SCI-RD-E00-Q01' })).question, 'Teacher copy')
    const v = await verify(db)
    assert.deepEqual(v.missing, ['SCI-RD-E00-Q01'], 'only the id held by a teacher upload is not a bank document')
    assert.equal(v.withStage, v.questions)
    assert.equal(v.everyday, 47)
    assert.ok(v.withNarration >= v.questions - 11, 'every served question has narration (excluded ones need none)')
    assert.ok(v.translatedNarration > 16000)

    // Idempotent
    const again = await up(db, { backupRoot })
    assert.equal(again.backupDir, null)
    assert.equal(again.updated + again.inserted, 0)

    // The API serves stage, everyday and narration in the requested language.
    const token = app.tokens.student('solo@example.com')
    const de = await app.call('GET', '/api/listen/science?lang=de', { token })
    assert.equal(de.status, 200)
    const item = de.body.data.find((x) => x.id === 'SCI-LIS-E00-Q01')
    assert.ok(item, 'an everyday item is served')
    assert.equal(item.everyday, true)
    assert.equal(item.stage, 0)
    assert.equal(item.lang, 'de')
    assert.equal(item.narration.status, 'templated')
    assert.ok(!/\b(the|listen|tap)\b/i.test(item.narration.text), 'German narration, no English')
    const en = await app.call('GET', '/api/listen/science/SCI-LIS-E00-Q01', { token })
    assert.equal(en.body.data.narration.status, 'authored')
    assert.equal(en.body.data.narration.text, require('../data/science_listen.json').questions.find((x) => x.id === 'SCI-LIS-E00-Q01').narration.text)

    // Down: exactly the original documents, inserted ones gone, teacher uploads untouched.
    const d = await down(db, r.backupDir)
    assert.equal(d.restored, seeded)
    assert.equal(d.removed, 47)
    assert.deepEqual(await snapshot(), before)
  } finally {
    fs.rmSync(backupRoot, { recursive: true, force: true })
    await app.stop()
  }
})
