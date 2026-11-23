const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { identityFromRequest } = require('../utils/firebaseToken')

// ── Session cookie helpers (used by Firebase / Google OAuth flow) ─────────────

const COOKIE_NAME = 'user_session'
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000 // 30 days, renewed on every visit (stay signed in until sign-out)

const setSession = async (req, res) => {
  // Identity comes from the verified Firebase token, never from the request body.
  const identity = await identityFromRequest(req, res)
  if (!identity) return
  const { uid, email, name, photoURL } = identity

  const sessionData = { uid, email, name, photoURL }

  // Signed, so the cookie can't be forged: dashboardAuth only trusts a valid signature.
  res.cookie(COOKIE_NAME, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    signed: true,
  })

  const token = jwt.sign(
    { id: uid, email, name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  )

  res.json({ success: true, message: 'Session set', token })
}

const getSession = (req, res) => {
  const raw = req.signedCookies && req.signedCookies[COOKIE_NAME]
  if (!raw) return res.json({ success: true, user: null })

  try {
    const user = JSON.parse(raw)
    res.json({ success: true, user })
  } catch {
    res.json({ success: true, user: null })
  }
}

const clearSession = (req, res) => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax', signed: true })
  res.json({ success: true, message: 'Session cleared' })
}

// ── Manual JWT auth (email / password) ───────────────────────────────────────

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email is already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, passwordHash })

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    )

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (err) {
    console.error('register error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    )

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (err) {
    console.error('login error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { setSession, getSession, clearSession, register, login }
