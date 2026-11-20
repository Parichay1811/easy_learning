// Data rights (FND-071, PAR-090): export everything we hold about a learner,
// and erase a learner across all three databases after a 30-day grace period.
//
//   exportLearner(email)                 -> a JSON-able object (no secrets, no hashes)
//   requestDeletion({ email, name, by }) -> DataRequest (kind 'delete', pending, dueAt +30 d)
//   cancelDeletion(id, by)               -> while still pending
//   approveRequest(id, by) / rejectRequest(id, by, note)  (super admin queue, SUP-060)
//   runDueDeletions(now)                 -> erases learners whose approved request is due
//   eraseLearner(email)                  -> the cascade itself; returns counts
const mongoose = require('mongoose')
const DataRequest = require('../models/DataRequest')

const GRACE_DAYS = 30
const lower = (s) => String(s || '').trim().toLowerCase()

// Every collection keyed by the learner's email, in the main database.
function mainCollections() {
  return {
    learnerDays: require('../models/analytics/LearnerDay'),
    learningEvents: require('../models/analytics/LearningEvent'),
    answers: require('../models/StudentAnswer'),
    rounds: require('../models/StudentRound'),
    activity: require('../models/StudentActivity'),
    achievements: require('../models/StudentAchievement'),
    arSessions: require('../models/ARSession'),
    linkCodes: require('../models/LinkCode'),
    // Adaptive learning (services/learning): levels, settings, goals, per-skill mastery.
    learningProfile: require('../models/learning/LearnerProfile'),
    skillMastery: require('../models/learning/SkillMastery'),
  }
}

async function exportLearner(email) {
  const e = lower(email)
  const Child = require('../models/Child')
  const ManagedLearner = require('../models/ManagedLearner')
  const Cheer = require('../models/Cheer')
  const ReportShare = require('../models/ReportShare')
  const Student = require('../models/admin/Student')
  const Organization = require('../models/admin/Organization')
  const cols = mainCollections()
  const out = { format: 'learnigo-learner-export/1', exportedAt: new Date().toISOString(), learnerEmail: e }

  const managed = await ManagedLearner.findOne({ email: e }).select('-loginCodeHash -pictureHash -failedLogins -lockedUntil').lean()
  if (managed) out.managedAccount = managed
  out.guardians = (await Child.find({ email: e }).select('-__v').lean()).map((c) => ({
    linkId: String(c._id), name: c.name, age: c.age, grade: c.grade, linkStatus: c.linkStatus, verifiedBy: c.verifiedBy, verifiedAt: c.verifiedAt,
    role: c.guardianRole, weeklyGoal: c.weeklyGoal, healthyUse: c.healthyUse, consentHistory: c.consentHistory, createdAt: c.createdAt,
  }))
  const schoolRows = await Student.find({ email: e }).lean()
  const orgs = await Organization.find({ _id: { $in: schoolRows.map((s) => s.orgId) } }).select('name').lean()
  const orgName = Object.fromEntries(orgs.map((o) => [String(o._id), o.name]))
  out.schools = schoolRows.map((s) => ({ school: orgName[String(s.orgId)] || '', name: s.name, grade: s.grade, status: s.status, since: s.createdAt }))

  for (const [key, M] of Object.entries(cols)) {
    let qry = M.find({ email: e }).select('-__v')
    if (key === 'linkCodes') qry = qry.select('-codeHash')
    out[key] = await qry.lean()
  }
  out.cheers = await Cheer.find({ learnerEmail: e }).select('-voice -__v').lean()
  out.reportShares = await ReportShare.find({ learnerEmail: e }).select('-tokenHash -__v').lean()
  out.dataRequests = await DataRequest.find({ subjectEmail: e }).select('-__v').lean()
  out.counts = Object.fromEntries(Object.entries(out).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, v.length]))
  return out
}

// How many records of each kind we hold (for the privacy centre), without loading them.
async function countLearner(email) {
  const e = lower(email)
  const out = {}
  for (const [key, M] of Object.entries(mainCollections())) out[key] = await M.countDocuments({ email: e })
  out.cheers = await require('../models/Cheer').countDocuments({ learnerEmail: e })
  return out
}

// The cascade. Learning data and the learner's own account go; the school's
// roster row is detached (the school keeps a record that a pupil existed only
// as an anonymised row, so its own counts don't silently break).
async function eraseLearner(email) {
  const e = lower(email)
  if (!e) throw new Error('No learner')
  const counts = {}
  for (const [key, M] of Object.entries(mainCollections())) counts[key] = (await M.deleteMany({ email: e })).deletedCount
  const Child = require('../models/Child')
  const ManagedLearner = require('../models/ManagedLearner')
  const Cheer = require('../models/Cheer')
  const ReportShare = require('../models/ReportShare')
  const GuardianInvite = require('../models/GuardianInvite')
  const Student = require('../models/admin/Student')
  const Parent = require('../models/admin/Parent')
  const Batch = require('../models/admin/Batch')
  counts.cheers = (await Cheer.deleteMany({ learnerEmail: e })).deletedCount
  counts.reportShares = (await ReportShare.deleteMany({ learnerEmail: e })).deletedCount
  counts.guardianInvites = (await GuardianInvite.deleteMany({ learnerEmail: e })).deletedCount
  counts.guardianLinks = (await Child.deleteMany({ email: e })).deletedCount
  counts.managedAccount = (await ManagedLearner.deleteMany({ email: e })).deletedCount
  const users = mongoose.models.User || require('../models/User')
  counts.account = (await users.deleteMany({ email: e })).deletedCount

  const schoolRows = await Student.find({ email: e }).select('_id')
  const ids = schoolRows.map((s) => s._id)
  if (ids.length) {
    await Parent.updateMany({ studentIds: { $in: ids } }, { $pull: { studentIds: { $in: ids } } })
    await Batch.updateMany({ studentIds: { $in: ids } }, { $pull: { studentIds: { $in: ids } } })
    await Student.updateMany({ _id: { $in: ids } }, { $set: { name: 'Deleted learner', email: '', status: 'inactive', batchIds: [], parentIds: [], tutorIds: [] } })
  }
  counts.schoolRowsAnonymised = ids.length
  return counts
}

async function requestDeletion({ email, name, byRole, byId, orgId = null, note = '' }) {
  const e = lower(email)
  const open = await DataRequest.findOne({ subjectEmail: e, kind: 'delete', status: { $in: ['pending', 'processing'] } })
  if (open) return { request: open, existing: true }
  const request = await DataRequest.create({
    subjectEmail: e, subjectName: name || '', requestedByRole: byRole, requestedById: String(byId), orgId,
    kind: 'delete', status: 'pending', dueAt: new Date(Date.now() + GRACE_DAYS * 86400000), note: String(note || '').slice(0, 500),
  })
  return { request, existing: false }
}

async function cancelDeletion(id, byId) {
  const r = await DataRequest.findOne({ _id: id, kind: 'delete', status: 'pending' })
  if (!r) return null
  r.status = 'rejected'
  r.resolvedAt = new Date()
  r.resolvedBy = String(byId)
  r.note = `${r.note ? `${r.note} · ` : ''}Cancelled by the guardian during the grace period`.slice(0, 500)
  await r.save()
  return r
}

async function approveRequest(id, by) {
  const r = await DataRequest.findOne({ _id: id, status: 'pending' })
  if (!r) return null
  if (r.kind === 'export') { r.status = 'done'; r.resolvedAt = new Date() } else r.status = 'processing'
  r.resolvedBy = String(by || '')
  await r.save()
  return r
}

async function rejectRequest(id, by, note = '') {
  const r = await DataRequest.findOne({ _id: id, status: { $in: ['pending', 'processing'] } })
  if (!r) return null
  r.status = 'rejected'; r.resolvedAt = new Date(); r.resolvedBy = String(by || ''); if (note) r.note = String(note).slice(0, 500)
  await r.save()
  return r
}

// Run by a daily job (scripts/process-data-requests.js) or the super admin queue.
async function runDueDeletions(now = new Date()) {
  const due = await DataRequest.find({ kind: 'delete', status: 'processing', dueAt: { $lte: now } })
  const done = []
  for (const r of due) {
    const counts = await eraseLearner(r.subjectEmail)
    r.status = 'done'; r.resolvedAt = new Date(); r.result = counts
    await r.save()
    done.push({ id: String(r._id), counts })
  }
  return done
}

module.exports = { GRACE_DAYS, exportLearner, countLearner, eraseLearner, requestDeletion, cancelDeletion, approveRequest, rejectRequest, runDueDeletions }
