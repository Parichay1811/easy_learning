// Content v5 DB migration against the in-memory MongoDB harness (never a real database):
// seed a v4-like bank (v1 narration, no cues, UK money) → dry run → up → verify → idempotent →
// the API serves v2 narration with cues and money in the learner's currency (X-Currency) → down.
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')
const mongoose = require('mongoose')
const { start } = require('./integration/harness')
const { plan, up, down, summary, targets, verify, MIGRATION } = require('../scripts/migrations/2026-11-26-content-v5')

const { EJSON } = mongoose.mongo.BSON
const oldMoney = (v) => JSON.parse(JSON.stringify(v).replace(/\[\[m:(\d+)\]\]/g, '$1p').replace(/\[\[M:(\d+)\]\]/g, '£$1'))

test('content v5 migration: dry run, up, verify, idempotent, served v2 narration and money, down', { timeout: 180000 }, async () => {
  const app = await start()
  const backupRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'content-v5-'))
  try {
    const db = app.db.main.db
    const created = new Date('2026-11-21T10:00:00Z')
    // v4-like state: narration v1 without cues, money in pence and pounds.
    let seeded = 0
    for (const t of targets()) {
      const { questions } = require(`../data/${t.file}`)
      const old = questions.map((q) => {
        const d = oldMoney(q)
        const v1 = (n) => (n ? { text: n.text, style: 'calm', v: 1, status: n.status } : n)
        d.narration = v1(d.narration)
        if (d.translations) for (const l of Object.keys(d.translations)) d.translations[l].narration = v1(d.translations[l].narration)
        d.qa = { ...d.qa, version: 4 }
        return { ...d, status: 'approved', uploadBatchId: null, submittedBy: null, createdAt: created, updatedAt: created }
      })
      seeded += old.length
      await db.collection(t.collection).insertMany(old)
    }
    const snapshot = async () => {
      const out = {}
      for (const t of targets()) out[t.collection] = EJSON.stringify(await db.collection(t.collection).find({}).sort({ id: 1 }).toArray(), { relaxed: false })
      return out
    }
    const before = await snapshot()

    const p = summary(await plan(db))
    assert.equal(p.inserted, 0)
    assert.ok(p.updated >= 1950, `${p.updated} questions updated`)
    assert.match(p.text, /fields updated: .*narration/)
    assert.deepEqual(await snapshot(), before, 'a dry run writes nothing')

    const r = await up(db, { backupRoot, now: new Date('2026-11-26T10:00:00Z') })
    assert.equal(JSON.parse(fs.readFileSync(path.join(r.backupDir, 'manifest.json'), 'utf8')).migration, MIGRATION)
    const v = await verify(db)
    assert.equal(v.missing.length, 0)
    assert.equal(v.narrationV2, v.questions - v.excluded, 'every served question has a v2 script')
    assert.equal(v.withCues, v.narrationV2)
    assert.ok(v.translatedV2 > 16000)
    assert.ok(v.moneyTokens >= 20, `${v.moneyTokens} money items carry tokens`)
    const again = await up(db, { backupRoot })
    assert.equal(again.updated + again.inserted, 0, 'idempotent')

    // Served: German v2 script with the English cues; money in the learner's currency.
    const token = app.tokens.student('solo@example.com')
    const de = await app.call('GET', '/api/listen/maths?lang=de', { token, headers: { 'x-currency': 'EUR' } })
    assert.equal(de.status, 200)
    const coins = de.body.data.find((x) => x.id === 'MA-LIS-T12-Q01')
    assert.equal(coins.narration.v, 2)
    assert.ok(coins.narration.cues.length >= 1)
    assert.ok(coins.options.every((o) => !/\[\[|p$/.test(o)), JSON.stringify(coins.options))
    assert.ok(coins.options.some((o) => /ct|€/.test(o)), JSON.stringify(coins.options))
    const gb = await app.call('GET', '/api/listen/maths/MA-LIS-T12-Q01', { token, headers: { 'x-currency': 'GBP' } })
    assert.ok(gb.body.data.options.every((o) => /p$/.test(o)), JSON.stringify(gb.body.data.options))
    assert.match(gb.body.data.audio_text, /pence/)

    const d = await down(db, r.backupDir)
    assert.ok(d.restored >= 1950)
    assert.deepEqual(await snapshot(), before)
  } finally {
    fs.rmSync(backupRoot, { recursive: true, force: true })
    await app.stop()
  }
})
