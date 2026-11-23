const jwt = require('jsonwebtoken')
const { identityFromRequest } = require('../utils/firebaseToken')
const OrgAdmin = require('../models/admin/OrgAdmin')
const { staffForSignIn } = require('../utils/staffSignIn')

const googleSignIn = async (req, res) => {
  try {
    // Identity comes from the verified Firebase token, never from the request body.
    const identity = await identityFromRequest(req, res)
    if (!identity) return
    const { uid, email, name, photoURL } = identity

    let admin = await OrgAdmin.findOne({ uid })
    if (!admin) {
      admin = await OrgAdmin.create({ uid, email, name: name || '', photoURL: photoURL || '' })
    } else {
      admin.name = name || admin.name
      admin.photoURL = photoURL || admin.photoURL
      await admin.save()
    }

    // Staff roles (ADM-023): somebody who doesn't run a school of their own but was
    // added as staff by a school (matched by this verified email) works in that school.
    const staff = await staffForSignIn({ uid, email, name })
    if (staff) {
      const token = jwt.sign(
        { id: admin._id, uid: admin.uid, email: admin.email, name: admin.name, orgId: staff.orgId, staffId: staff._id, staffRole: staff.role, role: 'org_staff' },
        process.env.ADMIN_JWT_SECRET,
        { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '30d' }
      )
      return res.json({
        success: true,
        token,
        admin: { id: admin._id, uid: admin.uid, email: admin.email, name: admin.name, photoURL: admin.photoURL, orgId: staff.orgId, staffRole: staff.role },
      })
    }

    const token = jwt.sign(
      { id: admin._id, uid: admin.uid, email: admin.email, name: admin.name, orgId: admin.orgId, role: 'org_admin' },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '30d' }
    )

    res.json({
      success: true,
      token,
      admin: { id: admin._id, uid: admin.uid, email: admin.email, name: admin.name, photoURL: admin.photoURL, orgId: admin.orgId },
    })
  } catch (err) {
    console.error('adminAuth googleSignIn error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getMe = async (req, res) => {
  try {
    const admin = await OrgAdmin.findById(req.admin.id).populate('orgId')
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' })
    res.json({ success: true, admin })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { googleSignIn, getMe }
