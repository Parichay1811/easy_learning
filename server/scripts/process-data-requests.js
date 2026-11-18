// Erases learners whose approved deletion request has passed its 30-day grace
// period (FND-071). Run daily, e.g. from cron:
//   node scripts/process-data-requests.js            (dry run: lists what is due)
//   node scripts/process-data-requests.js --apply    (erases and marks them done)
require('dotenv').config()
const mongoose = require('mongoose')
require('../db/adminDb')
require('../db/superAdminDb')
const DataRequest = require('../models/DataRequest')
const { runDueDeletions } = require('../services/dataRights')

;(async () => {
  await mongoose.connect(process.env.MONGODB_URI)
  if (!process.argv.includes('--apply')) {
    const due = await DataRequest.find({ kind: 'delete', status: 'processing', dueAt: { $lte: new Date() } }).lean()
    console.log(`${due.length} deletion(s) due. Re-run with --apply to erase them.`)
    due.forEach((r) => console.log(`  ${r._id}  ${r.subjectName || ''}  due ${r.dueAt.toISOString()}`))
  } else {
    const done = await runDueDeletions()
    console.log(`Erased ${done.length} learner(s).`)
    done.forEach((d) => console.log(`  ${d.id}  ${JSON.stringify(d.counts)}`))
  }
  await mongoose.disconnect()
  process.exit(0)
})().catch((e) => { console.error(e); process.exit(1) })
