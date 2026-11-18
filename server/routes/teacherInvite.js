// TCH-002: the school admin sends a teacher their invite email, naming the school and the
// teacher's groups. POST /api/admin/tutors/:id/invite (admin token, own school only).
// The Admin dashboard can call this after "Add teacher" (button not wired yet: ADMIN plan).
const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const adminAuth = require('../middleware/adminAuth')
const Organization = require('../models/admin/Organization')
const Tutor = require('../models/admin/Tutor')
const Batch = require('../models/admin/Batch')
const { sendMail } = require('../utils/mailer')
const { audit } = require('../utils/audit')
const { emailShell, escapeHtml, DEFAULT_COLOR } = require('../services/teacherParents')
const { appUrl } = require('../services/teacherContext')

router.post('/tutors/:id/invite', adminAuth, async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Register your organization first' })
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'Teacher not found' })
    const tutor = await Tutor.findOne({ _id: req.params.id, orgId: org._id })
    if (!tutor) return res.status(404).json({ success: false, message: 'Teacher not found' })
    const groups = await Batch.find({ orgId: org._id, tutorIds: tutor._id, status: 'active' }).select('name').lean()
    const list = groups.length
      ? `<p>Your groups: ${groups.map((g) => `<b>${escapeHtml(g.name)}</b>`).join(', ')}.</p>`
      : '<p>Your admin will add you to your groups soon.</p>'
    const out = await sendMail({
      to: tutor.email,
      kind: 'teacher_invite',
      subject: `${org.name} invited you to teach on Learnigo`,
      html: emailShell({ name: org.name, color: org.brandColor || DEFAULT_COLOR, logoUrl: org.logoUrl || '' }, `
        <p>Hello ${escapeHtml(tutor.name)},</p>
        <p><b>${escapeHtml(org.name)}</b> added you as a teacher on Learnigo.</p>
        ${list}
        <p><a href="${appUrl()}/teacher-login" style="display:inline-block;padding:12px 20px;border-radius:12px;background:${org.brandColor || DEFAULT_COLOR};color:#fff;text-decoration:none;font-weight:600">Open your classes</a></p>
        <p>Sign in with Google using <b>${escapeHtml(tutor.email)}</b>.</p>`),
    })
    req.actor = { role: 'admin', id: String(req.admin.id), email: req.admin.email, orgId: String(org._id) }
    await audit(req, 'teacher.invite', { targetType: 'tutor', targetId: tutor._id, orgId: org._id })
    res.json({ success: true, status: out.status })
  } catch (err) {
    console.error('teacher invite error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

module.exports = router
