/**
 * FND-042 backfill: fill the optional tag fields on existing questions from what
 * they already carry. Only sets fields that are missing; never overwrites.
 *
 *   difficulty        <- level (1-5), else difficulty_band (easy 2, medium 3, hard 4)
 *   skillIds          <- academic.skill / academic.curriculum_strand (slugged)
 *   estimatedSeconds  <- telemetry.expected_response_time_ms / 1000
 *   orgId             <- the org of the question's upload batch (teacher uploads)
 *
 *   node scripts/backfill-question-tags.js            # dry run: counts only
 *   node scripts/backfill-question-tags.js --apply    # write
 */
require('dotenv').config()
const mongoose = require('mongoose')

const BAND = { easy: 2, happy: 2, medium: 3, hard: 4, stretch: 5 }
const slug = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

// What to $set on one question doc (pure, tested in test/question-tags.test.js).
function tagPatch(q, batchOrg) {
  const set = {}
  if (q.difficulty == null) {
    const lvl = Number(q.level)
    const d = Number.isInteger(lvl) && lvl >= 1 && lvl <= 5 ? lvl : BAND[String(q.difficulty_band || '').toLowerCase()]
    if (d) set.difficulty = d
  }
  if (!Array.isArray(q.skillIds) || !q.skillIds.length) {
    const skills = [q.academic?.skill, q.academic?.curriculum_strand].map(slug).filter(Boolean)
    if (skills.length) set.skillIds = [...new Set(skills)]
  }
  if (q.estimatedSeconds == null && Number(q.telemetry?.expected_response_time_ms) > 0) set.estimatedSeconds = Math.round(q.telemetry.expected_response_time_ms / 1000)
  if (!q.orgId && q.uploadBatchId && batchOrg) set.orgId = String(batchOrg)
  if (q.version == null) set.version = 1
  return set
}

async function run({ apply }) {
  require('../db/adminDb')
  const QuestionUploadBatch = require('../models/superadmin/QuestionUploadBatch')
  const { questionModels } = require('../utils/questionModels')
  await mongoose.connect(process.env.MONGODB_URI)
  const batches = Object.fromEntries((await QuestionUploadBatch.find().select('orgId').lean()).map((b) => [String(b._id), b.orgId]))
  let seen = 0, changed = 0
  for (const bySubject of Object.values(questionModels)) {
    for (const Model of Object.values(bySubject)) {
      const ops = []
      for await (const q of Model.find().lean().cursor()) {
        seen++
        const set = tagPatch(q, q.uploadBatchId ? batches[String(q.uploadBatchId)] : null)
        if (Object.keys(set).length) { changed++; ops.push({ updateOne: { filter: { _id: q._id }, update: { $set: set } } }) }
        if (apply && ops.length >= 500) await Model.bulkWrite(ops.splice(0))
      }
      if (apply && ops.length) await Model.bulkWrite(ops)
      console.log(`${Model.modelName}: done`)
    }
  }
  console.log(`${seen} questions, ${changed} ${apply ? 'updated' : 'would be updated (dry run, add --apply)'}`)
  await mongoose.disconnect()
  process.exit(0)
}

if (require.main === module) run({ apply: process.argv.includes('--apply') }).catch((e) => { console.error(e); process.exit(1) })

module.exports = { tagPatch }
