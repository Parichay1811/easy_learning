#!/usr/bin/env node
// Content v4 migration: brings the bank questions stored in MongoDB (the 12 question
// collections) in line with server/data/*.json v4 — `stage` (0-5) and `everyday` on every
// question, `narration` in English and translations.<lang>.narration in every translated
// language, the 48 new everyday-curiosity items (*-E00-*), the v4 repairs (listening badges that
// showed the answer, speech keyword lists) and qa version 4. It also carries anything v3 changed,
// so a database that never ran v3 ends up the same.
//
//   node scripts/migrations/2026-11-21-content-v4.js                    dry run: print what would change
//   node scripts/migrations/2026-11-21-content-v4.js --apply            back up, then upsert
//   node scripts/migrations/2026-11-21-content-v4.js --down <backupDir> restore a backup
//   options: --uri <mongodb uri> (default MONGODB_URI from server/.env), --backup-dir <dir>
//
// Safety:
//  - Only bank questions are touched: documents matched by `id` with uploadBatchId null and no orgId.
//    A teacher upload or school question that happens to share an id is reported and skipped.
//  - Nothing is deleted on the way up (excluded questions stay, with qa.status "excluded",
//    and are filtered when served). Answer history lives in other collections and is never read
//    or written. Question ids are stable, so history keeps pointing at the same questions.
//  - --apply first writes every document it will change to <backups>/<timestamp>/<collection>.json
//    (EJSON, exact _ids) plus manifest.json listing inserted ids; --down restores those documents
//    and removes the inserted ones. Running --apply twice changes nothing the second time.
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const { BANKS } = require('../content/lib/bankio')

const { EJSON } = mongoose.mongo.BSON
const DATA_DIR = path.resolve(__dirname, '../../data')
const DEFAULT_BACKUPS = path.resolve(__dirname, '../../backups')
const MIGRATION = '2026-11-21-content-v4'
const MODULE_MODEL = { listen: 'Listen', read: 'Read', write: 'Write', speak: 'Speak' }
const SUBJECT_MODEL = { english: 'English', maths: 'Maths', science: 'Science' }

// Collection name per bank file, from the mongoose models (no connection needed).
function targets() {
  const out = []
  for (const b of BANKS) {
    const Model = require(`../../models/${MODULE_MODEL[b.module]}${SUBJECT_MODEL[b.subject]}`)
    out.push({ ...b, collection: Model.collection.collectionName })
  }
  return out
}

const stable = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((key) => [key, x[key]])) : x))
const isBankDoc = (d) => (d.uploadBatchId === null || d.uploadBatchId === undefined) && !d.orgId

// What would change. Returns per collection: { insert: [q], update: [{ doc, q, fields }], unchanged, conflicts: [ids] }.
async function plan(db) {
  const result = []
  for (const t of targets()) {
    const { questions } = JSON.parse(fs.readFileSync(path.join(DATA_DIR, t.file), 'utf8'))
    const coll = db.collection(t.collection)
    const existing = await coll.find({ id: { $in: questions.map((q) => q.id) } }).toArray()
    const byId = new Map(existing.map((d) => [d.id, d]))
    const entry = { collection: t.collection, file: t.file, insert: [], update: [], unchanged: 0, conflicts: [] }
    for (const q of questions) {
      const doc = byId.get(q.id)
      if (!doc) { entry.insert.push(q); continue }
      if (!isBankDoc(doc)) { entry.conflicts.push(q.id); continue }
      const fields = Object.keys(q).filter((k) => stable(doc[k]) !== stable(q[k]))
      if (fields.length) entry.update.push({ doc, q, fields })
      else entry.unchanged++
    }
    result.push(entry)
  }
  return result
}

function summary(p) {
  const lines = []
  let ins = 0, upd = 0, same = 0, conf = 0
  const fieldCounts = {}
  for (const e of p) {
    ins += e.insert.length; upd += e.update.length; same += e.unchanged; conf += e.conflicts.length
    for (const u of e.update) for (const f of u.fields) fieldCounts[f] = (fieldCounts[f] || 0) + 1
    lines.push(`  ${e.collection.padEnd(16)} insert ${String(e.insert.length).padStart(4)}  update ${String(e.update.length).padStart(4)}  unchanged ${String(e.unchanged).padStart(4)}${e.conflicts.length ? `  SKIPPED (not bank docs): ${e.conflicts.join(', ')}` : ''}`)
  }
  lines.push(`  total: insert ${ins}, update ${upd}, unchanged ${same}, skipped ${conf}`)
  if (Object.keys(fieldCounts).length) lines.push(`  fields updated: ${Object.entries(fieldCounts).sort((a, b) => b[1] - a[1]).map(([f, n]) => `${f} ${n}`).join(', ')}`)
  return { text: lines.join('\n'), inserted: ins, updated: upd, unchanged: same, skipped: conf }
}

async function up(db, { backupRoot = DEFAULT_BACKUPS, now = new Date() } = {}) {
  const p = await plan(db)
  const s = summary(p)
  if (!s.inserted && !s.updated) return { ...s, backupDir: null }
  const backupDir = path.join(backupRoot, now.toISOString().replace(/[:.]/g, '-'))
  fs.mkdirSync(backupDir, { recursive: true })
  const manifest = { migration: MIGRATION, created: now.toISOString(), collections: {} }
  for (const e of p) {
    if (!e.insert.length && !e.update.length) continue
    fs.writeFileSync(path.join(backupDir, `${e.collection}.json`), EJSON.stringify(e.update.map((u) => u.doc), { relaxed: false }, 1))
    manifest.collections[e.collection] = { file: `${e.collection}.json`, replaced: e.update.length, inserted: e.insert.map((q) => q.id) }
  }
  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  // Writes only after the backup is safely on disk.
  for (const e of p) {
    const coll = db.collection(e.collection)
    const ops = []
    for (const u of e.update) {
      const $set = Object.fromEntries(u.fields.map((f) => [f, u.q[f]]))
      $set.updatedAt = now
      ops.push({ updateOne: { filter: { _id: u.doc._id, id: u.q.id, uploadBatchId: null }, update: { $set } } })
    }
    for (const q of e.insert) {
      ops.push({ updateOne: {
        filter: { id: q.id },
        update: { $setOnInsert: { ...q, status: 'approved', submittedBy: null, uploadBatchId: null, orgId: null, archived: false, version: 1, createdAt: now, updatedAt: now } },
        upsert: true,
      } })
    }
    if (ops.length) await coll.bulkWrite(ops, { ordered: true })
  }
  return { ...s, backupDir }
}

// After --apply: every bank question in the database carries the v4 fields, as in the files.
async function verify(db) {
  const out = { questions: 0, withStage: 0, everyday: 0, withNarration: 0, translatedNarration: 0, missing: [] }
  for (const t of targets()) {
    const { questions } = JSON.parse(fs.readFileSync(path.join(DATA_DIR, t.file), 'utf8'))
    const docs = await db.collection(t.collection).find({ id: { $in: questions.map((q) => q.id) }, uploadBatchId: null }).project({ id: 1, stage: 1, everyday: 1, narration: 1, translations: 1, qa: 1 }).toArray()
    const byId = new Map(docs.map((d) => [d.id, d]))
    for (const q of questions) {
      const d = byId.get(q.id)
      if (!d) { out.missing.push(q.id); continue }
      out.questions++
      if (Number.isInteger(d.stage)) out.withStage++
      if (d.everyday === true) out.everyday++
      if (d.narration && d.narration.text) out.withNarration++
      if (d.translations) for (const tr of Object.values(d.translations)) if (tr && tr.narration && tr.narration.text) out.translatedNarration++
    }
  }
  return out
}

async function down(db, backupDir) {
  const manifest = JSON.parse(fs.readFileSync(path.join(backupDir, 'manifest.json'), 'utf8'))
  let restored = 0, removed = 0
  for (const [collection, info] of Object.entries(manifest.collections)) {
    const coll = db.collection(collection)
    const docs = EJSON.parse(fs.readFileSync(path.join(backupDir, info.file), 'utf8'), { relaxed: false })
    for (const d of docs) { await coll.replaceOne({ _id: d._id }, d, { upsert: true }); restored++ }
    if (info.inserted.length) {
      const r = await coll.deleteMany({ id: { $in: info.inserted }, uploadBatchId: null })
      removed += r.deletedCount
    }
  }
  return { restored, removed }
}

async function main() {
  const args = process.argv.slice(2)
  const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined }
  let uri = opt('--uri')
  if (!uri) { require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); uri = process.env.MONGODB_URI }
  if (!uri) throw new Error('No database: pass --uri or set MONGODB_URI')
  const conn = await mongoose.createConnection(uri).asPromise()
  try {
    const downDir = opt('--down')
    if (downDir) {
      const r = await down(conn.db, path.resolve(downDir))
      console.log(`Restored ${r.restored} document(s), removed ${r.removed} inserted document(s).`)
    } else if (args.includes('--apply')) {
      const r = await up(conn.db, { backupRoot: opt('--backup-dir') ? path.resolve(opt('--backup-dir')) : DEFAULT_BACKUPS })
      console.log(r.text)
      console.log(r.backupDir ? `Applied. Backup (for --down): ${r.backupDir}` : 'Nothing to change.')
      const v = await verify(conn.db)
      console.log(`Verify: ${v.questions} bank questions, ${v.withStage} with stage, ${v.everyday} everyday, ${v.withNarration} with narration, ${v.translatedNarration} translated scripts${v.missing.length ? `, MISSING ${v.missing.length}` : ''}.`)
    } else {
      console.log('Dry run (nothing written). Add --apply to back up and apply.')
      console.log(summary(await plan(conn.db)).text)
    }
  } finally {
    await conn.close()
  }
}

if (require.main === module) main().catch((err) => { console.error(err.message); process.exit(1) })

module.exports = { plan, up, down, summary, targets, verify, MIGRATION }
