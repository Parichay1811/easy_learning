const { identityFromRequest } = require('../utils/firebaseToken')
const Tutor = require('../models/admin/Tutor')
const ws = require('../services/teacherWorkspaces')

const { signTeacherToken } = ws

// One Google account may be a teacher in several workspaces (TCH-003). Sign-in enters the
// one they asked for (`tutorId`), or the one they used last, and returns the full list so
// the client can offer a choice. `needsChoice` is true when there is more than one and the
// client did not pick.
const googleSignIn = async (req, res) => {
  try {
    // Identity comes from the verified Firebase token, never from the request body.
    const identity = await identityFromRequest(req, res)
    if (!identity) return
    const { uid, email, name, photoURL } = identity

    const all = await Tutor.find({ email: email.toLowerCase() }).sort({ lastLoginAt: -1, createdAt: 1 })
    if (!all.length) {
      // A school may have invited this email already (services/linkRequests.js): say so,
      // and the /teach page shows the invitation to accept.
      const LinkRequest = require('../models/LinkRequest')
      const pendingInvites = await LinkRequest.countDocuments({ toRole: 'teacher', toEmail: email.toLowerCase(), kind: 'staff', status: 'pending', expiresAt: { $gt: new Date() } })
      return res.status(404).json({
        success: false, code: 'NO_TEACHER_ACCOUNT', canStartSolo: true, pendingInvites,
        message: pendingInvites
          ? 'A school invited you to teach on Learnigo. Tap “Start your own free workspace” below, then “Invited by a school?” at the top of that page, and accept the invitation in one tap.'
          : "We couldn't find a teacher account for this email. If your school uses Learnigo, ask your school admin to add you with this email (or ask them yourself from the teacher start page). If you teach privately, you can start your own free workspace.",
      })
    }
    const usable = all.filter((t) => t.authStatus !== 'disabled' && (!t.uid || t.uid === uid))
    if (!usable.length) {
      if (all.some((t) => t.authStatus === 'disabled')) {
        return res.status(403).json({ success: false, code: 'TEACHER_DISABLED', message: 'Your teacher account has been disabled. Contact your organization admin.' })
      }
      return res.status(403).json({ success: false, code: 'OTHER_ACCOUNT', message: 'This email is already linked to a different account.' })
    }

    const wanted = req.body?.tutorId ? usable.find((t) => String(t._id) === String(req.body.tutorId)) : null
    if (req.body?.tutorId && !wanted) return res.status(404).json({ success: false, message: 'Workspace not found' })
    const tutor = wanted || usable[0]

    const token = await ws.enterWorkspace(tutor, { uid, name, photoURL })
    const workspaces = await ws.workspacesFor(email, uid)
    res.json({
      success: true,
      token,
      adminToken: await ws.soloAdminTokenFor(tutor),
      teacher: ws.teacherView(tutor),
      workspaces,
      needsChoice: !wanted && workspaces.length > 1,
    })
  } catch (err) {
    console.error('teacherAuth googleSignIn error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getMe = async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.teacher.id).populate('orgId', 'name')
    if (!tutor) return res.status(404).json({ success: false, message: 'Teacher not found' })
    res.json({ success: true, teacher: tutor })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// GET /api/teacher/auth/workspaces: every workspace this signed-in teacher can switch to.
const listWorkspaces = async (req, res) => {
  try {
    const workspaces = await ws.workspacesFor(req.teacher.email, req.teacher.uid)
    res.json({ success: true, current: String(req.teacher.id), workspaces })
  } catch (err) {
    console.error('listWorkspaces error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// POST /api/teacher/auth/switch { tutorId }: enter another of MY workspaces. The target must
// carry the same (verified-at-sign-in) email and must not belong to another Google account.
const switchWorkspace = async (req, res) => {
  try {
    const tutor = await Tutor.findOne({ _id: req.body?.tutorId, email: String(req.teacher.email).toLowerCase() }).catch(() => null)
    if (!tutor) return res.status(404).json({ success: false, message: 'Workspace not found' })
    if (tutor.authStatus === 'disabled') return res.status(403).json({ success: false, message: 'This teacher account has been disabled.' })
    if (tutor.uid && req.teacher.uid && tutor.uid !== req.teacher.uid) return res.status(403).json({ success: false, message: 'This workspace belongs to a different account.' })
    const token = await ws.enterWorkspace(tutor, { uid: req.teacher.uid })
    res.json({ success: true, token, adminToken: await ws.soloAdminTokenFor(tutor), teacher: ws.teacherView(tutor), workspaces: await ws.workspacesFor(tutor.email, req.teacher.uid) })
  } catch (err) {
    console.error('switchWorkspace error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// POST /api/teacher/auth/solo { idToken, name, workspaceName, subjects[], grades[], country }
// "I teach privately" (TCH-001). Public route; identity from the verified Firebase token.
const soloSignup = async (req, res) => {
  try {
    const identity = await identityFromRequest(req, res)
    if (!identity) return
    const out = await ws.createSoloWorkspace(identity, req.body || {})
    res.status(out.created ? 201 : 200).json({
      success: true, created: out.created, token: out.token, adminToken: out.adminToken,
      teacher: ws.teacherView(out.tutor),
      org: { id: out.org._id, name: out.org.name, kind: 'solo' },
      workspaces: await ws.workspacesFor(identity.email, identity.uid),
    })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    console.error('soloSignup error:', err)
    res.status(500).json({ success: false, message: 'We could not create your workspace. Please try again.' })
  }
}

module.exports = { googleSignIn, getMe, listWorkspaces, switchWorkspace, soloSignup, signTeacherToken }
