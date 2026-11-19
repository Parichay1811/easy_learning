// "Connect by email" requests for every role (services/linkRequests.js). Each role
// mounts the same five routes behind its own sign-in middleware:
//
//   GET  …/links                 { incoming, outgoing } (+ teacher/admin: groups to pick from)
//   POST …/links                 { to, email, name?, age?, groupId? } -> send a request
//   POST …/links/:id/accept      { age? (parent), groupId? (teacher) }
//   POST …/links/:id/decline
//   POST …/links/:id/cancel      (the sender)
//
// learner: /api/dashboard/links (+ GET /links/people, POST /links/people/unlink)
// parent:  /api/parent/links      teacher: /api/teacher/links      school: /api/admin/links
// Teachers without a workspace yet (a school invited them) answer on the /teach page,
// signed in with Google: /api/teacher/auth/invites (see `hub` below).
const svc = require('../services/linkRequests')
const Batch = require('../models/admin/Batch')
const Tutor = require('../models/admin/Tutor')
const { norm } = require('../utils/guardianLink')
const { audit } = require('../utils/audit')

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res)
  } catch (err) {
    const status = err.status || err.statusCode
    if (status && Number.isInteger(status)) {
      const extra = Object.fromEntries(Object.entries(err).filter(([k]) => !['status', 'statusCode', 'message', 'stack'].includes(k)))
      return res.status(status).json({ success: false, message: err.message, ...JSON.parse(JSON.stringify(extra)) })
    }
    if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ success: false, message: 'Please check the details and try again.' })
    console.error('link request error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// Who is asking, in one shape, per role.
const ME = {
  student: async (req) => ({ role: 'student', id: String(req.user.id || req.user.email), email: norm(req.user.email), name: req.user.name || '' }),
  parent: async (req) => {
    // The name as it is now (the token keeps the one from sign-in).
    const p = await require('../models/ParentAccount').findById(req.parent.id).select('name').lean().catch(() => null)
    return { role: 'parent', id: String(req.parent.id), email: norm(req.parent.email), name: p?.name || req.parent.name || '' }
  },
  teacher: async (req) => {
    const { context } = require('../services/teacherContext')
    const ctx = await context(req)
    return { role: 'teacher', id: String(ctx.tutorId), email: norm(ctx.tutor.email), name: ctx.tutor.name || '', orgId: String(ctx.orgId), teacherCtx: ctx }
  },
  admin: async (req) => {
    if (!req.org) throw Object.assign(new Error('Register your organization first'), { status: 400, code: 'NO_ORG' })
    return { role: 'admin', id: String(req.actor.id), email: norm(req.actor.email), name: req.actor.name || '', orgId: String(req.org._id), org: req.org }
  },
}

// Extra things a list needs to be useful: the groups a teacher or school can pick.
const EXTRA = {
  teacher: async (me) => {
    const ctx = me.teacherCtx
    const groups = await Batch.find({ orgId: ctx.orgId, tutorIds: ctx.tutorId, status: 'active' }).select('name emoji').sort({ createdAt: 1 }).lean()
    return { groups: groups.map((g) => ({ id: String(g._id), name: g.name, emoji: g.emoji || '' })), canAddNewStudents: ctx.canAddNewStudents, canCreateGroups: ctx.canCreateGroups, solo: ctx.solo }
  },
  admin: async (me) => {
    const groups = await Batch.find({ orgId: me.orgId, status: 'active' }).select('name emoji').sort({ name: 1 }).limit(300).lean()
    return { groups: groups.map((g) => ({ id: String(g._id), name: g.name, emoji: g.emoji || '' })) }
  },
}

const actorFrom = (req, me) => { req.actor = req.actor || { role: me.role, id: me.id, email: me.email, name: me.name, orgId: me.orgId || null } }

function forRole(role) {
  const meOf = ME[role]
  return {
    list: handle(async (req, res) => {
      const me = await meOf(req)
      res.json({ success: true, ...(await svc.listFor(me)), ...(EXTRA[role] ? await EXTRA[role](me) : {}) })
    }),
    create: handle(async (req, res) => {
      const me = await meOf(req)
      const { status, ...out } = await svc.createRequest(me, req.body || {})
      actorFrom(req, me)
      if (!out.duplicate) await audit(req, 'link.request', { targetType: 'link_request', targetId: out.request?.id || '', orgId: me.orgId || '', meta: { kind: out.request?.kind, to: out.request?.to?.role, linked: Boolean(out.linked) } })
      res.status(status).json({ success: true, ...out })
    }),
    accept: handle(async (req, res) => {
      const me = await meOf(req)
      const out = await svc.acceptRequest(me, req.params.id, req.body || {})
      actorFrom(req, me)
      await audit(req, 'link.accept', { targetType: 'link_request', targetId: req.params.id, orgId: out.request?.org?.id || me.orgId || '', meta: { kind: out.request?.kind } })
      if (role === 'teacher' && out.tutorId) {
        // A teacher who joined another school: they can switch to it from the workspace menu.
        const ws = require('../services/teacherWorkspaces')
        out.workspaces = await ws.workspacesFor(me.email, req.teacher?.uid)
      }
      res.json({ success: true, ...out })
    }),
    decline: handle(async (req, res) => {
      const me = await meOf(req)
      const out = await svc.declineRequest(me, req.params.id)
      actorFrom(req, me)
      await audit(req, 'link.decline', { targetType: 'link_request', targetId: req.params.id, meta: { kind: out.request?.kind } })
      res.json({ success: true, ...out })
    }),
    cancel: handle(async (req, res) => {
      const me = await meOf(req)
      const out = await svc.cancelRequest(me, req.params.id)
      actorFrom(req, me)
      await audit(req, 'link.cancel', { targetType: 'link_request', targetId: req.params.id, meta: { kind: out.request?.kind } })
      res.json({ success: true, ...out })
    }),
  }
}

const student = {
  ...forRole('student'),
  // GET /api/dashboard/links/people: the grown-ups who follow me and my classes.
  people: handle(async (req, res) => res.json({ success: true, ...(await svc.peopleOf(await ME.student(req))) })),
  // POST /api/dashboard/links/people/unlink { type: 'parent' | 'class', id }
  unlink: handle(async (req, res) => {
    const me = await ME.student(req)
    const out = await svc.unlinkFor(me, req.body || {})
    actorFrom(req, me)
    await audit(req, 'link.unlink', { targetType: req.body?.type === 'class' ? 'group' : 'child_link', targetId: String(req.body?.id || ''), meta: { by: 'learner' } })
    res.json({ success: true, ...out })
  }),
}

// ── The /teach page: a teacher signed in with Google, maybe without any workspace yet ──
// POST /api/teacher/auth/invites                { idToken }  -> { me, incoming, outgoing, hasWorkspace }
// POST /api/teacher/auth/invites/:id/accept     { idToken }  -> signs them in to that school
// POST /api/teacher/auth/invites/:id/decline    { idToken }
// POST /api/teacher/auth/join-school            { idToken, email }  -> ask a school (its admin's email)
// POST /api/teacher/auth/join-school/:id/cancel { idToken }
async function hubMe(req, res) {
  const { identityFromRequest } = require('../utils/firebaseToken')
  const identity = await identityFromRequest(req, res)
  if (!identity) return null
  return { role: 'teacher', id: identity.email, email: norm(identity.email), name: identity.name || '', identity }
}

const hub = {
  list: handle(async (req, res) => {
    const me = await hubMe(req, res)
    if (!me) return
    const lists = await svc.listFor(me)
    const hasWorkspace = Boolean(await Tutor.exists({ email: me.email, authStatus: { $ne: 'disabled' } }))
    res.json({ success: true, me: { email: me.email, name: me.name }, hasWorkspace, ...lists })
  }),
  accept: handle(async (req, res) => {
    const me = await hubMe(req, res)
    if (!me) return
    const out = await svc.acceptRequest(me, req.params.id, {})
    req.actor = { role: 'teacher', id: out.tutorId || me.email, email: me.email, name: me.name }
    await audit(req, 'link.accept', { targetType: 'link_request', targetId: req.params.id, orgId: out.org?.id || '', meta: { kind: out.request?.kind, via: 'google' } })
    if (!out.tutorId) return res.json({ success: true, ...out })
    // Signed straight in to the school they just joined.
    const ws = require('../services/teacherWorkspaces')
    const tutor = await Tutor.findById(out.tutorId)
    if (tutor.uid && tutor.uid !== me.identity.uid) return res.status(403).json({ success: false, message: 'This email is already linked to a different account.' })
    const token = await ws.enterWorkspace(tutor, { uid: me.identity.uid, name: me.name, photoURL: me.identity.photoURL })
    res.json({ success: true, ...out, token, adminToken: await ws.soloAdminTokenFor(tutor), teacher: ws.teacherView(tutor), workspaces: await ws.workspacesFor(me.email, me.identity.uid) })
  }),
  decline: handle(async (req, res) => {
    const me = await hubMe(req, res)
    if (!me) return
    res.json({ success: true, ...(await svc.declineRequest(me, req.params.id)) })
  }),
  joinSchool: handle(async (req, res) => {
    const me = await hubMe(req, res)
    if (!me) return
    const { status, ...out } = await svc.createRequest(me, { to: 'school', email: req.body?.email })
    req.actor = { role: 'teacher', id: me.email, email: me.email, name: me.name }
    if (!out.duplicate) await audit(req, 'link.request', { targetType: 'link_request', targetId: out.request?.id || '', meta: { kind: 'staff', to: 'admin', via: 'google' } })
    res.status(status).json({ success: true, ...out })
  }),
  cancel: handle(async (req, res) => {
    const me = await hubMe(req, res)
    if (!me) return
    res.json({ success: true, ...(await svc.cancelRequest(me, req.params.id)) })
  }),
}

module.exports = { student, parent: forRole('parent'), teacher: forRole('teacher'), admin: forRole('admin'), hub, handle }
