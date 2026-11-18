// POST /api/auth/managed-login { loginCode, picture } -> a student JWT (FND-011).
// Rate limited by IP and by code; the answer never says whether the code exists.
const jwt = require('jsonwebtoken')
const { createLimiter } = require('../utils/guardianLink')
const { verifyManagedLogin, cleanLoginCode, PICTURES, PICTURE_LENGTH } = require('../services/managedLearners')
const { audit } = require('../utils/audit')

const perIp = createLimiter({ max: 20, windowMs: 15 * 60 * 1000 })
const perCode = createLimiter({ max: 6, windowMs: 15 * 60 * 1000 })

const NO_MATCH = "That code and those pictures don't match. Ask your grown-up to check your card."
const TOO_MANY = 'Too many tries. Please take a little break and try again in 15 minutes.'

async function managedLogin(req, res) {
  try {
    const { loginCode, picture } = req.body || {}
    const code = cleanLoginCode(loginCode) || String(loginCode || '').slice(0, 20)
    if (!perIp.take(req.ip || 'ip') || !perCode.take(code)) return res.status(429).json({ success: false, message: TOO_MANY })

    const learner = await verifyManagedLogin(loginCode, picture)
    if (!learner) return res.status(401).json({ success: false, message: NO_MATCH })

    perCode.reset(code)
    const token = jwt.sign(
      { id: String(learner._id), email: learner.email, name: learner.name, managed: true },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    )
    req.actor = { role: 'student', id: String(learner._id), email: learner.email, name: learner.name }
    await audit(req, 'learner.managed_login', { targetType: 'learner', targetId: String(learner._id), orgId: learner.orgId || '' })
    res.json({ success: true, token, user: { id: String(learner._id), name: learner.name, email: learner.email, avatar: learner.avatar, managed: true } })
  } catch (err) {
    console.error('managedLogin error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// The picture alphabet, so clients can draw the grid.
const managedPictures = (req, res) => res.json({ success: true, pictures: PICTURES, length: PICTURE_LENGTH })

module.exports = { managedLogin, managedPictures }
