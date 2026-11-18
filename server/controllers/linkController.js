const LinkCode = require('../models/LinkCode')
const { newCode, hashCode, CODE_TTL_MS, MAX_ACTIVE_CODES, norm } = require('../utils/guardianLink')

// POST /api/dashboard/link-code — a signed-in learner makes a one-time code to
// give to a parent. The code is shown once (only its hash is stored).
const createLinkCode = async (req, res) => {
  try {
    const email = norm(req.user.email)
    if (!email) return res.status(400).json({ success: false, message: 'Your account has no email' })

    const active = await LinkCode.countDocuments({ email, usedAt: null, expiresAt: { $gt: new Date() } })
    if (active >= MAX_ACTIVE_CODES) {
      return res.status(429).json({ success: false, message: 'You already have several codes waiting. Use one or wait for them to expire.' })
    }
    const code = newCode()
    const expiresAt = new Date(Date.now() + CODE_TTL_MS)
    await LinkCode.create({ email, codeHash: hashCode(code, email), expiresAt })
    res.status(201).json({ success: true, code, expiresAt })
  } catch (err) {
    console.error('createLinkCode error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { createLinkCode }
