// Read-only, organisation-scoped API keys and the /api/v1 endpoints they open
// (FND-062, module `api.export`). Keys look like `lk_<prefix>_<secret>`; only a
// SHA-256 hash is stored and the full key is shown once.
const crypto = require('crypto')
const mongoose = require('mongoose')
const ApiKey = require('../models/comms/ApiKey')
const { audit } = require('../utils/audit')
const { entitlementsFor } = require('../utils/entitlements')
const { adminOrgId } = require('../services/commsLinks')
const { createLimiter } = require('../utils/guardianLink')

const SCOPES = ['learners:read', 'summaries:read']
const MAX_KEYS = 10
const hash = (s) => crypto.createHash('sha256').update(s).digest('hex')
const err500 = (res, e) => { console.error('api key error:', e); res.status(500).json({ success: false, message: 'Internal server error' }) }
const view = (k) => ({ id: String(k._id), name: k.name, prefix: k.prefix, scopes: k.scopes, createdAt: k.createdAt, lastUsedAt: k.lastUsedAt, useCount: k.useCount, revoked: Boolean(k.revokedAt) })

async function orgFor(req, res) {
  if (req.actor.role !== 'admin') { res.status(403).json({ success: false, message: 'Not allowed' }); return null }
  const orgId = await adminOrgId(req.actor)
  if (!orgId) { res.status(400).json({ success: false, message: 'Organization not found' }); return null }
  return orgId
}

const list = async (req, res) => {
  try {
    const orgId = await orgFor(req, res)
    if (!orgId) return
    res.json({ success: true, items: (await ApiKey.find({ orgId }).sort({ createdAt: -1 }).lean()).map(view), scopes: SCOPES })
  } catch (e) { err500(res, e) }
}

const create = async (req, res) => {
  try {
    const orgId = await orgFor(req, res)
    if (!orgId) return
    const name = String(req.body.name || '').trim().slice(0, 80)
    const scopes = Array.isArray(req.body.scopes) ? [...new Set(req.body.scopes)].filter((s) => SCOPES.includes(s)) : []
    if (!name) return res.status(400).json({ success: false, message: 'Give the key a name' })
    if (!scopes.length) return res.status(400).json({ success: false, message: `Choose at least one scope: ${SCOPES.join(', ')}` })
    if (await ApiKey.countDocuments({ orgId, revokedAt: null }) >= MAX_KEYS) return res.status(409).json({ success: false, message: `At most ${MAX_KEYS} active keys` })
    const prefix = crypto.randomBytes(6).toString('hex')
    const secret = crypto.randomBytes(24).toString('base64url')
    const key = `lk_${prefix}_${secret}`
    const doc = await ApiKey.create({ orgId, name, prefix, hash: hash(key), scopes, createdBy: `admin:${req.actor.id}` })
    await audit(req, 'apikey.create', { targetType: 'apikey', targetId: doc._id, orgId, meta: { name, scopes } })
    res.status(201).json({ success: true, key, apiKey: view(doc), message: 'Copy this key now. It will not be shown again.' })
  } catch (e) { err500(res, e) }
}

const revoke = async (req, res) => {
  try {
    const orgId = await orgFor(req, res)
    if (!orgId) return
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'Key not found' })
    const doc = await ApiKey.findOneAndUpdate({ _id: req.params.id, orgId, revokedAt: null }, { revokedAt: new Date() }, { new: true })
    if (!doc) return res.status(404).json({ success: false, message: 'Key not found' })
    await audit(req, 'apikey.revoke', { targetType: 'apikey', targetId: doc._id, orgId })
    res.json({ success: true })
  } catch (e) { err500(res, e) }
}

// ── /api/v1: authenticated by an API key ───────────────────────────────────────
const limiter = createLimiter({ max: Number(process.env.API_KEY_RATE_PER_MIN) || 60, windowMs: 60_000 })

const keyAuth = (scope) => async (req, res, next) => {
  try {
    const auth = req.get('authorization') || ''
    const raw = req.get('x-api-key') || (auth.startsWith('Bearer lk_') ? auth.slice(7) : '')
    const m = /^lk_([a-f0-9]{12})_[\w-]{20,}$/.exec(raw)
    if (!m) return res.status(401).json({ success: false, message: 'Missing or malformed API key' })
    const doc = await ApiKey.findOne({ prefix: m[1] })
    const ok = doc && !doc.revokedAt && crypto.timingSafeEqual(Buffer.from(doc.hash), Buffer.from(hash(raw)))
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid API key' })
    if (!doc.scopes.includes(scope)) return res.status(403).json({ success: false, message: `This key lacks the ${scope} scope` })
    if (!limiter.take(doc.prefix)) { res.set('Retry-After', '60'); return res.status(429).json({ success: false, code: 'RATE_LIMITED', message: 'Rate limit: 60 requests per minute' }) }
    // The school's plan must still include the API.
    const ent = await entitlementsFor({ role: 'admin', orgId: doc.orgId })
    if (!ent.modules.includes('api.export')) return res.status(402).json({ success: false, code: 'MODULE_LOCKED', module: 'api.export', message: 'The data API isn\'t part of this plan.' })
    await ApiKey.updateOne({ _id: doc._id }, { lastUsedAt: new Date(), $inc: { useCount: 1 } })
    req.apiKey = doc
    req.actor = { role: 'apikey', id: doc.prefix, name: doc.name, orgId: doc.orgId }
    next()
  } catch (e) { err500(res, e) }
}

const page = (req) => ({ limit: Math.min(Math.max(Number(req.query.limit) || 100, 1), 500), page: Math.max(Number(req.query.page) || 1, 1) })

// GET /api/v1/learners?page=&limit=
const v1Learners = async (req, res) => {
  try {
    const Student = require('../models/admin/Student')
    const Batch = require('../models/admin/Batch')
    const { limit, page: p } = page(req)
    const filter = { orgId: req.apiKey.orgId, status: 'active' }
    const [rows, total, batches] = await Promise.all([
      Student.find(filter).sort({ _id: 1 }).skip((p - 1) * limit).limit(limit).select('name email grade batchIds createdAt').lean(),
      Student.countDocuments(filter),
      Batch.find({ orgId: req.apiKey.orgId }).select('name').lean(),
    ])
    const groupName = new Map(batches.map((b) => [String(b._id), b.name]))
    await audit(req, 'api.learners', { targetType: 'organization', targetId: req.apiKey.orgId, orgId: req.apiKey.orgId, meta: { page: p, rows: rows.length } })
    res.json({
      success: true, page: p, limit, total, pages: Math.ceil(total / limit),
      data: rows.map((s) => ({ id: String(s._id), name: s.name, email: s.email || null, grade: s.grade || null, groups: (s.batchIds || []).map((id) => ({ id: String(id), name: groupName.get(String(id)) || null })), createdAt: s.createdAt })),
    })
  } catch (e) { err500(res, e) }
}

// GET /api/v1/daily-summaries?from=YYYY-MM-DD&to=YYYY-MM-DD&page=&limit=  (max 93 days)
const v1DailySummaries = async (req, res) => {
  try {
    const q = require('../analytics/queries')
    const Student = require('../models/admin/Student')
    const LearnerDay = require('../models/analytics/LearnerDay')
    let range
    try { range = q.parseRange({ from: req.query.from, to: req.query.to, cmp: 'none' }) } catch (e) { return res.status(400).json({ success: false, message: e.message }) }
    if (range.days > 93) return res.status(400).json({ success: false, message: 'At most 93 days per request' })
    const students = await Student.find({ orgId: req.apiKey.orgId, status: 'active', email: { $ne: '' } }).select('email').lean()
    const idByEmail = new Map(students.map((s) => [String(s.email).toLowerCase(), String(s._id)]))
    const { limit, page: p } = page(req)
    const filter = { email: { $in: [...idByEmail.keys()] }, date: { $gte: range.from, $lte: range.to } }
    const [rows, total] = await Promise.all([
      LearnerDay.find(filter).sort({ date: 1, email: 1 }).skip((p - 1) * limit).limit(limit).select('email date minutes sessions answered correct firstTry xp').lean(),
      LearnerDay.countDocuments(filter),
    ])
    await audit(req, 'api.daily_summaries', { targetType: 'organization', targetId: req.apiKey.orgId, orgId: req.apiKey.orgId, meta: { from: range.from, to: range.to, page: p, rows: rows.length } })
    res.json({
      success: true, range: { from: range.from, to: range.to }, page: p, limit, total, pages: Math.ceil(total / limit),
      data: rows.map((d) => ({ learnerId: idByEmail.get(d.email), date: d.date, minutes: Math.round((d.minutes || 0) * 10) / 10, sessions: d.sessions || 0, answered: d.answered || 0, correct: d.correct || 0, accuracy: d.answered ? Math.round((d.correct / d.answered) * 100) : null, xp: d.xp || 0 })),
    })
  } catch (e) { err500(res, e) }
}

module.exports = { list, create, revoke, keyAuth, v1Learners, v1DailySummaries, SCOPES }
