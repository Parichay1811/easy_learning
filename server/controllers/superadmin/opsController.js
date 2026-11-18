// Operations (SUP-040..043, SUP-070, Outbox): system health, background jobs,
// feature flags and module switches, incidents and maintenance banners, the
// queued-email Outbox and structured platform settings. Changes are audited.
const FeatureFlag = require('../../models/superadmin/FeatureFlag')
const Incident = require('../../models/superadmin/Incident')
const JobRun = require('../../models/superadmin/JobRun')
const GlobalSettings = require('../../models/superadmin/GlobalSettings')
const Outbox = require('../../models/Outbox')
const { MODULES, PLANS } = require('../../config/plans')
const health = require('../../services/systemHealth')
const jobs = require('../../services/jobs')
const flags = require('../../services/featureFlags')
const planCatalog = require('../../services/planCatalog')
const { audit } = require('../../utils/audit')
const { sendMail } = require('../../utils/mailer')
const { clear } = require('../../utils/ttlCache')
const { h, fail, needId, paging, rx, by } = require('./util')

// ── SUP-040 health ───────────────────────────────────────────────────────────
const getHealth = h(async () => ({ health: await health.snapshot() }))

const setBackupNote = h(async (req) => {
  const note = { at: req.body?.at || new Date().toISOString(), note: String(req.body?.note || '').slice(0, 300), restoreTestedAt: req.body?.restoreTestedAt || null, by: by(req) }
  await GlobalSettings.findOneAndUpdate({ key: 'ops.lastBackup' }, { key: 'ops.lastBackup', value: note, description: 'Last backup and restore test (SUP-040)' }, { upsert: true })
  await audit(req, 'ops.backup_note', { targetType: 'ops', meta: note })
  return { lastBackup: note }
})

// ── SUP-041 jobs ───────────────────────────────────────────────────────────
const listJobs = h(async () => {
  const names = jobs.list()
  const runs = await JobRun.find().sort({ startedAt: -1 }).limit(100).lean()
  return { jobs: names.map((j) => ({ ...j, runs: runs.filter((r) => r.job === j.name).slice(0, 5).map((r) => ({ ...r, id: String(r._id) })) })) }
})

const runJob = h(async (req) => {
  const name = String(req.params.name)
  if (!jobs.has(name)) throw fail(404, 'Unknown job')
  const { runId } = await jobs.runJob(name, { trigger: 'manual', by: by(req) })
  await audit(req, 'ops.job.run', { targetType: 'job', targetId: name, meta: { runId } })
  return { runId }
})

const getRun = h(async (req) => {
  needId(req.params.id, 'Run')
  const run = await JobRun.findById(req.params.id).lean()
  if (!run) throw fail(404, 'Run not found')
  return { run: { ...run, id: String(run._id) } }
})

// ── SUP-042 flags ───────────────────────────────────────────────────────────
const KEY = /^[a-z0-9][a-z0-9._-]{1,60}$/
const STATE = ['default', 'on', 'off']
const cleanStates = (obj, allowed) => {
  if (obj == null) return undefined
  if (typeof obj !== 'object' || Array.isArray(obj)) throw fail(400, 'Rules must be an object.')
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (allowed && !allowed(k)) throw fail(400, `Unknown target: ${k}`)
    if (!['on', 'off'].includes(v)) continue // 'default' removes the rule
    out[k] = v
  }
  return out
}

const listFlags = h(async () => {
  const [list, plans] = await Promise.all([FeatureFlag.find().sort({ kind: 1, key: 1 }).lean(), planCatalog.plans()])
  return { flags: list.map((f) => ({ ...f, id: String(f._id) })), modules: MODULES, plans: Object.keys(plans) }
})

const upsertFlag = h(async (req) => {
  const key = String(req.params.key || req.body?.key || '').trim()
  const kind = req.body?.kind || 'feature'
  if (!KEY.test(key)) throw fail(400, 'Use a short key: lower-case letters, digits, dots, dashes.')
  if (!['module', 'feature'].includes(kind)) throw fail(400, 'kind is module or feature.')
  if (kind === 'module' && !MODULES[key]) throw fail(400, 'That is not a plan module.')
  const before = await FeatureFlag.findOne({ key }).lean()
  if (before && before.kind !== kind) throw fail(409, 'A flag with this key exists with another kind.')
  const set = { kind, updatedBy: by(req) }
  if (req.body.description !== undefined) set.description = String(req.body.description).slice(0, 300)
  if (req.body.platform !== undefined) { if (!STATE.includes(req.body.platform)) throw fail(400, 'platform is default, on or off.'); set.platform = req.body.platform }
  const plans = await planCatalog.plans()
  const p = cleanStates(req.body.plans, (k) => !!plans[k] || !!PLANS[k]); if (p) set.plans = p
  if (kind === 'feature') {
    const o = cleanStates(req.body.orgs, (k) => /^[a-f0-9]{24}$/i.test(k)); if (o) set.orgs = o
    if (req.body.rollout !== undefined) { const r = Number(req.body.rollout); if (!(r >= 0 && r <= 100)) throw fail(400, 'rollout is 0 to 100.'); set.rollout = Math.round(r) }
  }
  const reason = String(req.body?.reason || '').trim()
  const flag = await FeatureFlag.findOneAndUpdate({ key }, { $set: set, $setOnInsert: { key } }, { upsert: true, new: true }).lean()
  flags.invalidate()
  clear('directory:')
  await audit(req, before ? 'flag.update' : 'flag.create', { targetType: 'flag', targetId: key, reason, meta: { before: before ? { platform: before.platform, plans: before.plans, orgs: before.orgs, rollout: before.rollout } : null, after: { platform: flag.platform, plans: flag.plans, orgs: flag.orgs, rollout: flag.rollout } } })
  return { flag: { ...flag, id: String(flag._id) } }
})

const deleteFlag = h(async (req) => {
  const f = await FeatureFlag.findOneAndDelete({ key: String(req.params.key) }).lean()
  if (!f) throw fail(404, 'Flag not found')
  flags.invalidate()
  await audit(req, 'flag.delete', { targetType: 'flag', targetId: f.key, meta: { was: { platform: f.platform, plans: f.plans, rollout: f.rollout } } })
  return { deleted: true }
})

// "Who gets what": effective modules for a plan (no org) with where each one comes from.
const previewPlan = h(async (req) => {
  const plan = String(req.query.plan || 'institute')
  const p = await planCatalog.plan(plan)
  if (!p) throw fail(404, 'Unknown plan')
  const overrides = String(req.query.overrides || '').split(',').map((s) => s.trim()).filter(Boolean)
  const out = await flags.resolveModules({ planModules: p.modules, plan, overrides, MODULES })
  return { plan, ...out, allModules: MODULES }
})

// ── SUP-043 incidents and maintenance ────────────────────────────────────────
const SEV = ['minor', 'major', 'critical']
const STATUS = ['scheduled', 'investigating', 'identified', 'monitoring', 'resolved']

const listIncidents = h(async (req) => {
  const { limit, skip, page } = paging(req.query, { def: 30 })
  const [total, list] = await Promise.all([Incident.countDocuments(), Incident.find().sort({ startsAt: -1 }).skip(skip).limit(limit).lean()])
  return { total, page, incidents: list.map((i) => ({ ...i, id: String(i._id) })) }
})

const createIncident = h(async (req) => {
  const b = req.body || {}
  const title = String(b.title || '').trim()
  if (title.length < 3) throw fail(400, 'Give the incident a title.')
  const kind = b.kind === 'maintenance' ? 'maintenance' : 'incident'
  const severity = SEV.includes(b.severity) ? b.severity : 'minor'
  const status = STATUS.includes(b.status) ? b.status : kind === 'maintenance' ? 'scheduled' : 'investigating'
  const startsAt = b.startsAt ? new Date(b.startsAt) : new Date()
  const endsAt = b.endsAt ? new Date(b.endsAt) : null
  if (Number.isNaN(startsAt.getTime()) || (endsAt && Number.isNaN(endsAt.getTime()))) throw fail(400, 'Dates are not valid.')
  if (endsAt && endsAt <= startsAt) throw fail(400, 'The end must be after the start.')
  const inc = await Incident.create({ title, kind, severity, status, message: String(b.message || '').slice(0, 1000), banner: b.banner !== false, startsAt, endsAt, createdBy: by(req), updates: [{ status, message: String(b.message || '').slice(0, 1000), by: by(req) }] })
  clear('status:')
  await audit(req, 'ops.incident.create', { targetType: 'incident', targetId: String(inc._id), meta: { title, kind, severity, status } })
  return { incident: { ...inc.toObject(), id: String(inc._id) } }
})

const updateIncident = h(async (req) => {
  needId(req.params.id, 'Incident')
  const inc = await Incident.findById(req.params.id)
  if (!inc) throw fail(404, 'Incident not found')
  const b = req.body || {}
  if (b.status !== undefined) { if (!STATUS.includes(b.status)) throw fail(400, 'Unknown status.'); inc.status = b.status; if (b.status === 'resolved') inc.resolvedAt = new Date() }
  if (b.severity !== undefined) { if (!SEV.includes(b.severity)) throw fail(400, 'Unknown severity.'); inc.severity = b.severity }
  if (b.banner !== undefined) inc.banner = !!b.banner
  if (b.title !== undefined) inc.title = String(b.title).trim().slice(0, 200)
  if (b.message !== undefined) inc.message = String(b.message).slice(0, 1000)
  if (b.endsAt !== undefined) inc.endsAt = b.endsAt ? new Date(b.endsAt) : null
  inc.updates.push({ status: inc.status, message: String(b.update || b.message || '').slice(0, 1000), by: by(req) })
  await inc.save()
  clear('status:')
  await audit(req, 'ops.incident.update', { targetType: 'incident', targetId: String(inc._id), meta: { status: inc.status, severity: inc.severity, banner: inc.banner } })
  return { incident: { ...inc.toObject(), id: String(inc._id) } }
})

// ── Outbox viewer ──────────────────────────────────────────────────────────
const listOutbox = h(async (req) => {
  const { limit, skip, page } = paging(req.query, { def: 30 })
  const f = {}
  if (req.query.status) f.status = String(req.query.status)
  if (req.query.kind) f.kind = String(req.query.kind)
  if (req.query.q) { const r = rx(req.query.q); f.$or = [{ to: r }, { subject: r }] }
  const [total, rows, counts, kinds] = await Promise.all([
    Outbox.countDocuments(f), Outbox.find(f).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-html').lean(),
    Outbox.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]), Outbox.distinct('kind'),
  ])
  return { total, page, rows: rows.map((r) => ({ ...r, id: String(r._id), text: String(r.text || '').slice(0, 2000) })), counts: Object.fromEntries(counts.map((c) => [c._id, c.n])), kinds, smtp: !!(process.env.SMTP_URL || process.env.SMTP_HOST) }
})

const retryOutbox = h(async (req) => {
  needId(req.params.id, 'Message')
  const m = await Outbox.findById(req.params.id).lean()
  if (!m) throw fail(404, 'Message not found')
  if (!(process.env.SMTP_URL || process.env.SMTP_HOST)) throw fail(409, 'Email sending is not configured (SMTP). The message stays queued.')
  const r = await sendMail({ to: m.to, subject: m.subject, html: m.html, text: m.text, kind: m.kind })
  await Outbox.deleteOne({ _id: m._id })
  await audit(req, 'ops.outbox.retry', { targetType: 'outbox', targetId: String(m._id), meta: { to: m.to, status: r.status } })
  return { status: r.status, id: r.id }
})

// ── SUP-070 structured platform settings ─────────────────────────────────────
const SETTINGS = {
  'platform.languages': { default: ['en', 'de', 'fr', 'es', 'hi', 'bn', 'ar'], validate: (v) => Array.isArray(v) && v.every((x) => /^[a-z]{2}(-[A-Z]{2})?$/.test(x)) && v.length > 0, label: 'Supported languages' },
  'platform.defaultOrgPolicy': { default: { messaging: 'teachers_and_parents', teachersCreateGroups: true, parentsSeeClassAverage: false, leaderboards: false, aiTeacherInSchoolHours: true, activityVisibility: 'teachers' }, validate: (v) => v && typeof v === 'object' && !Array.isArray(v), label: 'Default policy for new organisations' },
  'platform.retention': { default: { learningEventsMonths: 24, rollupsYears: 0, auditYears: 7, outboxDays: 90, inactiveAccountYears: 3 }, validate: (v) => v && typeof v === 'object' && Object.values(v).every((n) => Number.isFinite(Number(n)) && Number(n) >= 0), label: 'Retention defaults' },
  'platform.legal': { default: { terms: '2026-11', privacy: '2026-11', dpa: '2026-11' }, validate: (v) => v && typeof v === 'object' && Object.values(v).every((x) => typeof x === 'string' && x.length <= 20), label: 'Legal document versions' },
  'platform.emailTemplates': { default: { invite: { subject: "You're invited to {org} on Learnigo", body: 'Hello {name},\n\n{org} uses Learnigo. Sign in with this email address to get started.' }, digest: { subject: "{child}'s week on Learnigo", body: '{story}' } }, validate: (v) => v && typeof v === 'object' && Object.values(v).every((t) => t && typeof t.subject === 'string' && typeof t.body === 'string'), label: 'Email templates' },
  'platform.aiTeacher': { default: { name: 'Ms Lumi', voice: 'server', speed: 1, inSchoolHours: true, maxAnswerSeconds: 45 }, validate: (v) => v && typeof v === 'object' && !Array.isArray(v), label: 'AI Teacher profile' },
  'support.cannedReplies': { default: [{ key: 'thanks', text: 'Thanks for getting in touch! We are looking into this and will reply within one working day.' }, { key: 'reset', text: 'We have reset your sign-in. Please sign in again with Google using the same email address.' }], validate: (v) => Array.isArray(v) && v.every((r) => r && typeof r.text === 'string'), label: 'Canned support replies' },
}

async function readPlatformSettings() {
  const docs = await GlobalSettings.find({ key: { $in: Object.keys(SETTINGS) } }).lean()
  const byKey = new Map(docs.map((d) => [d.key, d]))
  return Object.fromEntries(Object.entries(SETTINGS).map(([k, s]) => [k, { label: s.label, value: byKey.get(k)?.value ?? s.default, isDefault: !byKey.has(k), updatedAt: byKey.get(k)?.updatedAt || null }]))
}

const getPlatformSettings = h(async () => ({ settings: await readPlatformSettings() }))

const putPlatformSetting = h(async (req) => {
  const key = String(req.params.key)
  const s = SETTINGS[key]
  if (!s) throw fail(404, 'Unknown setting')
  const value = req.body?.value
  if (!s.validate(value)) throw fail(400, `That value is not valid for "${s.label}".`)
  if (JSON.stringify(value).length > 20_000) throw fail(400, 'That value is too large.')
  const before = await GlobalSettings.findOne({ key }).lean()
  await GlobalSettings.findOneAndUpdate({ key }, { key, value, description: s.label }, { upsert: true })
  await audit(req, 'settings.update', { targetType: 'setting', targetId: key, meta: { before: before?.value ?? null, after: value } })
  return { settings: await readPlatformSettings() }
})

module.exports = {
  getHealth, setBackupNote, listJobs, runJob, getRun, listFlags, upsertFlag, deleteFlag, previewPlan,
  listIncidents, createIncident, updateIncident, listOutbox, retryOutbox, getPlatformSettings, putPlatformSetting, readPlatformSettings, SETTINGS,
}
