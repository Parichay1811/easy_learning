/**
 * migrate-verify-children.js
 *
 * One-time migration for FND-001 (verified parent links). Parent links made
 * before verification existed have no linkStatus, so they now read as
 * 'pending' and show no data. This verifies the ones a school already
 * confirmed (an org Parent record with the parent's email lists a Student with
 * the child's email); everything else stays pending until the learner shares
 * a link code. Safe to re-run.
 *
 * Usage:
 *   cd server
 *   node scripts/migrate-verify-children.js            # dry run (nothing written)
 *   node scripts/migrate-verify-children.js --apply    # write the changes
 */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const mongoose = require('mongoose')

const adminDb = require('../db/adminDb')
const Child = require('../models/Child')
const ParentAccount = require('../models/ParentAccount')
const { schoolLinkExists } = require('../utils/guardianLink')

const APPLY = process.argv.includes('--apply')

async function main() {
  await mongoose.connect(process.env.MONGODB_URI)
  await adminDb.asPromise()

  // $ne 'verified' also matches rows that have no linkStatus stored at all.
  const children = await Child.find({ linkStatus: { $ne: 'verified' } })
  let verified = 0
  let staysPending = 0

  for (const child of children) {
    const parent = await ParentAccount.findById(child.parentId).select('email')
    if (parent && (await schoolLinkExists(parent.email, child.email))) {
      verified++
      if (APPLY) {
        child.linkStatus = 'verified'
        child.verifiedBy = 'school'
        child.verifiedAt = new Date()
        child.consentVersion = '2026-11'
        await child.save()
      }
    } else {
      staysPending++
      if (APPLY && !child.get('linkStatus', null, { getters: false })) {
        await Child.updateOne({ _id: child._id }, { $set: { linkStatus: 'pending' } })
      }
    }
  }

  console.log(`${APPLY ? 'Applied' : 'Dry run'}: ${children.length} unverified links checked`)
  console.log(`  verified through a school: ${verified}`)
  console.log(`  stay pending (need a link code): ${staysPending}`)
  if (!APPLY) console.log('Run again with --apply to write the changes.')
  await mongoose.disconnect()
  await adminDb.close()
}

main().catch((err) => { console.error(err); process.exit(1) })
