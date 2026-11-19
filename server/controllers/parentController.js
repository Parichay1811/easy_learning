const Child = require('../models/Child')
const LinkCode = require('../models/LinkCode')
const { getPerformanceForEmail } = require('../utils/performance')
const guardian = require('../utils/guardianLink')
const { childAccess, cleanCode, hashCode, createLimiter, norm } = guardian

// Code guessing: 5 tries per parent per child per 10 minutes, and 10 per
// learner email per hour across every parent (so many accounts don't help).
const perParent = createLimiter({ max: 5, windowMs: 10 * 60 * 1000 })
const perLearner = createLimiter({ max: 10, windowMs: 60 * 60 * 1000 })
const CONSENT_VERSION = '2026-11'

const markVerified = (child, by) => {
  child.linkStatus = 'verified'
  child.verifiedAt = new Date()
  child.verifiedBy = by
  child.consentVersion = CONSENT_VERSION
  child.consentHistory = [...(child.consentHistory || []), { at: new Date(), action: 'link_verified', version: CONSENT_VERSION, by, note: by === 'school' ? 'Confirmed by the school' : 'Confirmed with the child\'s link code' }]
}

const getChildren = async (req, res) => {
  try {
    const children = await Child.find({ parentId: req.parent.id }).sort({ createdAt: -1 })
    res.json({ success: true, children })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const createChild = async (req, res) => {
  try {
    const { name, email, age } = req.body

    const dup = await Child.findOne({ parentId: req.parent.id, email: email.toLowerCase() })
    if (dup) return res.status(409).json({ success: false, message: 'A child with this email already exists' })

    // Starts pending: typing an email proves nothing. A school that already
    // linked this parent and student verifies it straight away.
    const child = new Child({ parentId: req.parent.id, name, email, age })
    if (await guardian.schoolLinkExists(req.parent.email, child.email)) markVerified(child, 'school')
    await child.save()
    res.status(201).json({ success: true, child })
  } catch (err) {
    console.error('createChild error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const updateChild = async (req, res) => {
  try {
    const { name, email, age } = req.body

    if (email) {
      const dup = await Child.findOne({ parentId: req.parent.id, email: email.toLowerCase(), _id: { $ne: req.params.id } })
      if (dup) return res.status(409).json({ success: false, message: 'A child with this email already exists' })
    }

    const child = await Child.findOne({ _id: req.params.id, parentId: req.parent.id })
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' })

    if (name !== undefined) child.name = name
    if (age !== undefined) child.age = age
    // Pointing the link at a different email is a new link, so it must be proven again.
    if (email !== undefined && norm(email) !== child.email) {
      child.email = email
      child.linkStatus = 'pending'
      child.verifiedAt = null
      child.verifiedBy = null
      if (await guardian.schoolLinkExists(req.parent.email, child.email)) markVerified(child, 'school')
    }
    await child.save()
    res.json({ success: true, child })
  } catch (err) {
    console.error('updateChild error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const deleteChild = async (req, res) => {
  try {
    const existing = await Child.findOne({ _id: req.params.id, parentId: req.parent.id })
    if (!existing) return res.status(404).json({ success: false, message: 'Child not found' })
    // A child account this parent manages can't be orphaned: delete it from the privacy centre instead.
    if (existing.managedLearnerId && existing.guardianRole !== 'co' && existing.linkStatus === 'verified'
      && !(await Child.countDocuments({ email: existing.email, linkStatus: 'verified', _id: { $ne: existing._id } }))) {
      return res.status(409).json({ success: false, message: "You manage this child's account. To remove it, use the privacy centre to delete the account." })
    }
    const child = await Child.findOneAndDelete({ _id: req.params.id, parentId: req.parent.id })
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' })
    // A request the parent sent for this child stops too, so it can't be accepted later.
    await require('../services/linkRequests').cancelForChild(req.parent.id, child._id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getChildPerformance = async (req, res) => {
  try {
    const child = await Child.findOne({ _id: req.params.id, parentId: req.parent.id })
    const access = childAccess(child)
    if (!access.ok) return res.status(access.status).json({ success: false, message: access.message, code: access.code, linkStatus: access.linkStatus })

    const performance = await getPerformanceForEmail(child.email)
    res.json({ success: true, child: { id: child._id, name: child.name, email: child.email }, performance })
  } catch (err) {
    console.error('getChildPerformance error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// POST /children/:id/verify { code } — the learner's one-time code proves the link.
const verifyChildLink = async (req, res) => {
  try {
    const child = await Child.findOne({ _id: req.params.id, parentId: req.parent.id })
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' })
    if (child.linkStatus === 'verified') return res.json({ success: true, child })

    if (!perParent.take(`${req.parent.id}:${child._id}`) || !perLearner.take(child.email)) {
      return res.status(429).json({ success: false, message: 'Too many tries. Please wait a few minutes and try again.' })
    }
    const code = cleanCode(req.body.code)
    const fail = () => res.status(400).json({ success: false, message: "That code didn't work. Check it and try again, or ask your child for a new one." })
    if (!code) return fail()

    // Atomic: the code is spent by the first parent to use it.
    const used = await LinkCode.findOneAndUpdate(
      { email: child.email, codeHash: hashCode(code, child.email), usedAt: null, expiresAt: { $gt: new Date() } },
      { usedAt: new Date(), usedBy: String(req.parent.id) },
    )
    if (!used) return fail()

    markVerified(child, 'child_code')
    await child.save()
    perParent.reset(`${req.parent.id}:${child._id}`)
    res.json({ success: true, child })
  } catch (err) {
    console.error('verifyChildLink error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { getChildren, createChild, updateChild, deleteChild, getChildPerformance, verifyChildLink }
