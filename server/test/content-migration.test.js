// Content v3 DB migration against the in-memory MongoDB harness (never a real database):
// seed the pre-v3 bank + a teacher upload → dry run → up → verify → idempotent re-run →
// the API never serves excluded questions → down → everything exactly as before.
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')
const mongoose = require('mongoose')
const { start } = require('./integration/harness')
const { plan, up, down, summary, targets } = require('../scripts/migrations/2026-11-20-content-v3')

const { EJSON } = mongoose.mongo.BSON
const V3 = ['skill', 'age_band', 'graded', 'validation', 'qa']

test('content v3 migration: dry run, up, idempotent, served filter, down', { timeout: 120000 }, async () => {
  const app = await start()
  const backupRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'content-v3-'))
  try {
    const db = app.db.main.db
    const created = new Date('2026-01-01T00:00:00Z')
    // Pre-v3 state: the original 1,800 questions without v3 fields, one known bug restored.
    for (const t of targets()) {
      const { questions } = require(`../data/${t.file}`)
      const old = questions.filter((q) => /-T\d{2}-Q\d{2}$/.test(q.id)).map((q) => {
        const d = JSON.parse(JSON.stringify(q))
        for (const k of V3) delete d[k]
        if (d.id === 'MA-RD-T05-Q08') d.prompt = '6 + 3 ? 4 + 4'
        return { ...d, status: 'approved', uploadBatchId: null, submittedBy: null, createdAt: created, updatedAt: created }
      })
      await db.collection(t.collection).insertMany(old)
    }
    const listen = targets().find((t) => t.file === 'english_listen.json').collection
    const batch = new mongoose.Types.ObjectId()
    await db.collection(listen).insertMany([
      { id: 'TEACHER-UPLOAD-1', question: 'A teacher question', answer: 'x', uploadBatchId: batch, status: 'approved', createdAt: created },
      // A teacher upload that happens to use a new bank id: must be left alone.
      { id: 'EN-LIS-F00-Q01', question: 'Teacher copy', answer: 'y', uploadBatchId: batch, status: 'approved', createdAt: created },
    ])
    const snapshot = async () => {
      const out = {}
      for (const t of targets()) out[t.collection] = EJSON.stringify(await db.collection(t.collection).find({}).sort({ id: 1 }).toArray(), { relaxed: false })
      return out
    }
    const before = await snapshot()

    // Dry run
    const p = summary(await plan(db))
    assert.equal(p.updated, 1800, 'every original question gains v3 fields')
    assert.equal(p.skipped, 1, 'the teacher upload sharing a bank id is skipped')
    const newItems = targets().reduce((n, t) => n + require(`../data/${t.file}`).questions.filter((q) => !/-T\d{2}-Q\d{2}$/.test(q.id)).length, 0)
    assert.equal(p.inserted, newItems - 1)
    assert.deepEqual(await snapshot(), before, 'a dry run writes nothing')

    // Up
    const r = await up(db, { backupRoot, now: new Date('2026-11-20T10:00:00Z') })
    assert.ok(r.backupDir && fs.existsSync(path.join(r.backupDir, 'manifest.json')))
    const rm = targets().find((t) => t.file === 'math_read.json').collection
    const fixed = await db.collection(rm).findOne({ id: 'MA-RD-T05-Q08' })
    assert.equal(fixed.prompt, '6 + 3 ? 5 + 4')
    assert.equal(fixed.qa.status, 'verified')
    assert.equal(fixed.skill, 'maths.compare-numbers')
    assert.deepEqual(fixed.createdAt, created, 'documents are updated in place, not replaced')
    const starter = await db.collection(rm).findOne({ id: 'MA-RD-F00-Q01' })
    assert.equal(starter.level, 0)
    assert.equal(starter.status, 'approved')
    assert.equal(starter.uploadBatchId, null)
    assert.deepEqual(await db.collection(listen).findOne({ id: 'TEACHER-UPLOAD-1' }, { projection: { _id: 0, createdAt: 0 } }), { id: 'TEACHER-UPLOAD-1', question: 'A teacher question', answer: 'x', uploadBatchId: batch, status: 'approved' })
    assert.equal((await db.collection(listen).findOne({ id: 'EN-LIS-F00-Q01' })).question, 'Teacher copy')

    // Idempotent
    const again = await up(db, { backupRoot })
    assert.equal(again.backupDir, null)
    assert.equal(again.updated + again.inserted, 0)

    // The API never serves excluded questions.
    const res = await app.call('GET', '/api/read/maths', { token: app.tokens.student('solo@example.com') })
    assert.equal(res.status, 200)
    const served = res.body.data.map((q) => q.id)
    assert.ok(!served.includes('MA-RD-T09-Q01'), 'excluded question is not served')
    assert.ok(served.includes('MA-RD-F00-Q01'))
    assert.ok(res.body.data.every((q) => !q.qa || q.qa.status !== 'excluded'))
    const one = await app.call('GET', '/api/read/maths/MA-RD-T09-Q01', { token: app.tokens.student('solo@example.com') })
    assert.equal(one.status, 404)

    // Down: exactly the original documents, inserted ones gone, teacher uploads untouched.
    const d = await down(db, r.backupDir)
    assert.equal(d.restored, 1800)
    assert.deepEqual(await snapshot(), before)
  } finally {
    fs.rmSync(backupRoot, { recursive: true, force: true })
    await app.stop()
  }
})
