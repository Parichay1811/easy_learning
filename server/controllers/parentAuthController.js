const jwt = require('jsonwebtoken')
const { identityFromRequest } = require('../utils/firebaseToken')
const ParentAccount = require('../models/ParentAccount')
const { linkSchoolChildren } = require('../utils/parentLinks')

const googleSignIn = async (req, res) => {
  try {
    // Identity comes from the verified Firebase token, never from the request body.
    const identity = await identityFromRequest(req, res)
    if (!identity) return
    const { uid, email, name, photoURL } = identity

    let parent = await ParentAccount.findOne({ uid })
    if (!parent) {
      parent = await ParentAccount.create({ uid, email, name: name || '', photoURL: photoURL || '' })
    } else {
      parent.name = name || parent.name
      parent.photoURL = photoURL || parent.photoURL
      await parent.save()
    }

    // The school's invite is the verification (ADM-022): link the children every
    // school listed for this verified email. Never blocks sign-in.
    try { await linkSchoolChildren(parent) } catch (err) { console.error('linkSchoolChildren failed:', err.message) }

    const token = jwt.sign(
      { id: parent._id, uid: parent.uid, email: parent.email, name: parent.name, role: 'parent' },
      process.env.PARENT_JWT_SECRET,
      { expiresIn: process.env.PARENT_JWT_EXPIRES_IN || '7d' }
    )

    res.json({
      success: true,
      token,
      parent: { id: parent._id, uid: parent.uid, email: parent.email, name: parent.name, photoURL: parent.photoURL },
    })
  } catch (err) {
    console.error('parentAuth googleSignIn error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getMe = async (req, res) => {
  try {
    const parent = await ParentAccount.findById(req.parent.id)
    if (!parent) return res.status(404).json({ success: false, message: 'Parent not found' })
    res.json({ success: true, parent })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { googleSignIn, getMe }
