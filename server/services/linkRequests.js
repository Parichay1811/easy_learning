// Connect two accounts by email (models/LinkRequest.js): one person types the
// other's email, the other taps Accept or Decline. One flow for every role:
// parent <-> learner, teacher <-> learner, school <-> teacher, school -> learner.
//
// Rules that hold for every kind:
//   - only someone signed in with the invited email, in the invited role, can
//     answer (anyone else gets the same 404 as for a request that doesn't exist);
//   - nothing is shared before Accept (no child link is verified, nobody joins a
//     group or a school);
//   - requests expire after 14 days; the sender can cancel while it waits;
//   - creating requests is rate limited per sender and per recipient;
//   - the answer to "send" never reveals whether the email has an account.
// The recipient gets a bell notification (utils/notify.js, which also emails per
// their preferences) when they have an account, otherwise one email (utils/mailer.js,
// Outbox when no SMTP) telling them how to join; the request waits for them.
const mongoose = require('mongoose')
const LinkRequest = require('../models/LinkRequest')
const Child = require('../models/Child')
const ParentAccount = require('../models/ParentAccount')
const Organization = require('../models/admin/Organization')
const OrgAdmin = require('../models/admin/OrgAdmin')
const Tutor = require('../models/admin/Tutor')
const Student = require('../models/admin/Student')
const Batch = require('../models/admin/Batch')
const batchService = require('./batchService')
const { norm, createLimiter, schoolLinkExists } = require('../utils/guardianLink')
const { notify } = require('../utils/notify')
const { sendMail } = require('../utils/mailer')

const DAY = 24 * 60 * 60 * 1000
const TTL_MS = 14 * DAY
const PURGE_AFTER_MS = 60 * DAY
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CONSENT_VERSION = '2026-11'

// 20 new requests per sender per hour; 10 per recipient (from anybody) per day.
const limits = {
  sender: createLimiter({ max: 20, windowMs: 60 * 60 * 1000 }),
  recipient: createLimiter({ max: 10, windowMs: DAY }),
}

class LinkError extends Error {
  constructor(status, message, extra = {}) { super(message); this.status = status; Object.assign(this, extra) }
}
const fail = (status, message, extra) => { throw new LinkError(status, message, extra) }

const isId = (v) => mongoose.isValidObjectId(v) && String(v).length === 24
const idStr = (v) => (v == null ? v : String(v))
const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n)
const firstName = (s) => clean(s, 80).split(/\s+/)[0] || ''
const isManagedEmail = (e) => /@managed\.learnigo\.invalid$/.test(String(e || ''))

// What the API calls the other side -> the role that answers.
const TO = { student: 'student', child: 'student', learner: 'student', parent: 'parent', grownup: 'parent', teacher: 'teacher', school: 'admin', admin: 'admin' }
// Who may ask whom, and what kind of link it makes.
const ROUTES = {
  parent: { student: 'family' },
  student: { parent: 'family', teacher: 'class' },
  teacher: { student: 'class', admin: 'staff' },
  admin: { teacher: 'staff', student: 'enrol' },
}

// The requests a sender sees as theirs. Learners and teachers are found by email
// (a teacher may have several workspaces; a learner's id depends on how they signed in).
function sentBy(me) {
  if (me.role === 'parent') return { fromRole: 'parent', fromId: String(me.id) }
  if (me.role === 'admin') return { fromRole: 'admin', orgId: String(me.orgId) }
  return { fromRole: me.role, fromEmail: me.email }
}
const isSender = (r, me) => Object.entries(sentBy(me)).every(([k, v]) => String(r[k]) === v)
const isRecipient = (r, me) => r.toRole === me.role && r.toEmail === me.email

const expired = (r, now = new Date()) => r.status === 'pending' && r.expiresAt <= now
const statusOf = (r) => (expired(r) ? 'expired' : r.status)

// What either side sees. Only what the sender chose to share.
function view(r, me) {
  const incoming = me ? isRecipient(r, me) : false
  return {
    id: String(r._id), kind: r.kind, direction: incoming ? 'incoming' : 'outgoing', status: statusOf(r),
    from: { role: r.fromRole, name: r.fromName || '', email: r.fromEmail },
    to: { role: r.toRole, email: r.toEmail, name: r.toName || '' },
    org: r.orgName ? { id: r.orgId, name: r.orgName } : null,
    group: r.groupId ? { id: r.groupId, name: r.groupName } : null,
    child: r.kind === 'family' ? { id: r.childId || null, name: r.childName || '', age: r.childAge || null } : null,
    createdAt: r.createdAt, expiresAt: r.expiresAt, respondedAt: r.respondedAt,
  }
}

// ── Sending ─────────────────────────────────────────────────────────────────

// me: { role, id, email, name, orgId?, orgName?, teacherCtx? }. body: { to, email, name?, age?, groupId? }
async function createRequest(me, body = {}) {
  const toRole = TO[String(body.to || '').toLowerCase()]
  const kind = ROUTES[me.role]?.[toRole]
  if (!kind) fail(400, 'You can’t send that kind of request.')
  const email = norm(body.email)
  if (!EMAIL.test(email) || email.length > 200) fail(400, 'Please type a whole email address, like name@example.com.')
  if (isManagedEmail(email)) fail(400, 'That learner signs in with a login card, so they have no email. Their grown-up can add you instead.')
  if (email === norm(me.email)) fail(400, 'That’s your own email. Type the other person’s email.')
  if (me.role === 'student' && isManagedEmail(me.email)) fail(403, 'Ask your grown-up to connect you.')

  const draft = {
    kind, fromRole: me.role, fromId: String(me.id), fromEmail: norm(me.email), fromName: clean(me.name, 80),
    toRole, toEmail: email, toName: clean(body.name, 80),
  }
  const prep = await PREP[`${me.role}>${toRole}`](me, body, draft)
  if (prep?.done) return prep.done

  // The same request is already waiting: hand it back instead of sending another.
  const same = await LinkRequest.findOne({
    ...sentBy(me), kind, toRole, toEmail: email, status: 'pending', expiresAt: { $gt: new Date() },
    ...(draft.groupId ? { groupId: draft.groupId } : {}), ...(draft.childId ? { childId: draft.childId } : {}),
  })
  if (same) return { status: 200, request: view(same, me), duplicate: true }

  if (!limits.sender.take(`${me.role}:${norm(me.email)}`)) fail(429, 'You’ve sent a lot of requests. Please wait an hour and try again.', { code: 'RATE_LIMITED' })
  if (!limits.recipient.take(`${toRole}:${email}`)) fail(429, 'This person has had a lot of requests today. Please try again tomorrow.', { code: 'RATE_LIMITED' })

  if (prep?.commit) await prep.commit()
  const now = Date.now()
  const doc = await LinkRequest.create({ ...draft, expiresAt: new Date(now + TTL_MS), purgeAt: new Date(now + TTL_MS + PURGE_AFTER_MS) })
  await deliver(doc)
  return { status: 201, request: view(doc, me) }
}

// Per direction: check the request makes sense and fill in where it leads.
const PREP = {
  // A parent asks to follow a learner. Their Child row starts (or stays) pending.
  async 'parent>student'(me, body, draft) {
    const name = clean(body.name, 60)
    const age = Number(body.age)
    if (!name) fail(400, 'Please type your child’s first name.')
    if (!Number.isInteger(age) || age < 1 || age > 25) fail(400, 'Please give your child’s age.')
    let child = await Child.findOne({ parentId: me.id, email: draft.toEmail })
    if (child?.linkStatus === 'verified') fail(409, `${child.name} is already linked to you.`, { code: 'ALREADY_LINKED' })
    if (!child) child = new Child({ parentId: me.id, name, age, email: draft.toEmail })
    else Object.assign(child, { name, age, linkStatus: 'pending', revokedAt: null, revokedBy: '' })
    // A school that already linked this parent and learner vouches for it: done.
    if (await schoolLinkExists(me.email, draft.toEmail)) {
      verify(child, 'school', me.email, 'Confirmed by the school')
      await child.save()
      return { done: { status: 201, linked: true, child } }
    }
    // Saved only once the request itself is allowed (rate limits), so a refused
    // request leaves no waiting card behind. The id exists already.
    Object.assign(draft, { childId: String(child._id), childName: name, childAge: age, toName: name })
    return { commit: () => child.save() }
  },

  // A learner asks a grown-up to follow them.
  async 'student>parent'(me, body, draft) {
    const age = body.age === undefined || body.age === '' || body.age === null ? null : Number(body.age)
    if (age !== null && (!Number.isInteger(age) || age < 3 || age > 25)) fail(400, 'Age must be a number from 3 to 25.')
    const parent = await ParentAccount.findOne({ email: draft.toEmail }).select('_id').lean()
    if (parent && await Child.exists({ parentId: parent._id, email: draft.fromEmail, linkStatus: 'verified' })) {
      fail(409, 'This grown-up already follows your learning.', { code: 'ALREADY_LINKED' })
    }
    Object.assign(draft, { childName: firstName(me.name) || draft.fromEmail.split('@')[0], childAge: age })
  },

  // A learner asks a teacher to add them to their class. The teacher picks the group on Accept.
  async 'student>teacher'() {},

  // A teacher invites a learner into one of their groups.
  async 'teacher>student'(me, body, draft) {
    const { myGroup } = require('./teacherContext')
    const ctx = me.teacherCtx
    if (!ctx) fail(403, 'Sign in to your teacher workspace first.')
    const batch = await myGroup(ctx, body.groupId)
    if (batch.status !== 'active') fail(400, 'This group is archived. Pick an active group.')
    const student = await Student.findOne({ orgId: ctx.orgId, email: draft.toEmail }).select('status').lean()
    if (student && batch.studentIds.some((id) => idStr(id) === idStr(student._id))) fail(409, 'This learner is already in the group.', { code: 'ALREADY_LINKED' })
    if ((!student || student.status !== 'active') && !ctx.canAddNewStudents) {
      fail(403, 'Your school adds new students. Ask your admin, or invite learners who are already in your school.', { code: 'POLICY_BLOCKED' })
    }
    Object.assign(draft, { orgId: String(ctx.orgId), orgName: ctx.org.name, groupId: String(batch._id), groupName: batch.name })
  },

  // A teacher asks a school (its admin's email) to add them as a teacher.
  async 'teacher>admin'(me, body, draft) {
    const admin = await OrgAdmin.findOne({ email: draft.toEmail }).select('orgId').lean()
    const org = admin?.orgId ? await Organization.findById(admin.orgId).select('name kind').lean() : null
    if (org && org.kind !== 'solo' && await Tutor.exists({ orgId: org._id, email: draft.fromEmail, status: 'active', authStatus: { $ne: 'disabled' } })) {
      fail(409, `You already teach at ${org.name}.`, { code: 'ALREADY_LINKED' })
    }
    // The school's name is only shown back to the teacher once the school answers.
  },

  // A school invites a teacher.
  async 'admin>teacher'(me, body, draft) {
    const org = await schoolOf(me)
    const tutor = await Tutor.findOne({ orgId: org._id, email: draft.toEmail }).select('status authStatus').lean()
    if (tutor && tutor.status === 'active' && tutor.authStatus !== 'disabled') fail(409, 'This person already teaches at your school.', { code: 'ALREADY_LINKED' })
    Object.assign(draft, { orgId: String(org._id), orgName: org.name })
  },

  // A school invites a learner (and, optionally, into one of its groups).
  async 'admin>student'(me, body, draft) {
    const org = await schoolOf(me)
    Object.assign(draft, { orgId: String(org._id), orgName: org.name })
    if (body.groupId) {
      if (!isId(body.groupId)) fail(404, 'Group not found')
      const batch = await Batch.findOne({ _id: body.groupId, orgId: org._id, status: 'active' }).select('name studentIds').lean()
      if (!batch) fail(404, 'Group not found')
      Object.assign(draft, { groupId: String(batch._id), groupName: batch.name })
    }
    const student = await Student.findOne({ orgId: org._id, email: draft.toEmail }).select('status batchIds').lean()
    if (student?.status === 'active' && (!draft.groupId || (student.batchIds || []).some((id) => idStr(id) === draft.groupId))) {
      fail(409, 'This learner is already in your school.', { code: 'ALREADY_LINKED' })
    }
  },
}

async function schoolOf(me) {
  const org = me.org || (me.orgId && isId(me.orgId) ? await Organization.findById(me.orgId).lean() : null)
  if (!org) fail(400, 'Register your organization first', { code: 'NO_ORG' })
  return org
}

// ── Answering ───────────────────────────────────────────────────────────────

async function findFor(me, id, side) {
  if (!isId(id)) fail(404, 'We couldn’t find that request.')
  const r = await LinkRequest.findById(id)
  if (!r || !(side === 'to' ? isRecipient(r, me) : isSender(r, me))) fail(404, 'We couldn’t find that request.')
  return r
}

function assertOpen(r) {
  if (r.status !== 'pending') fail(409, r.status === 'cancelled' ? 'This request was cancelled.' : 'This request was already answered.', { code: 'NOT_PENDING', requestStatus: r.status })
  if (expired(r)) fail(410, 'This request has expired. Ask them to send a new one.', { code: 'EXPIRED' })
}

// Accept: do what the request asked, then tell the sender.
async function acceptRequest(me, id, body = {}) {
  const r = await findFor(me, id, 'to')
  assertOpen(r)
  // Claim it first, so two taps (or two devices) can't both run it.
  const claimed = await LinkRequest.findOneAndUpdate({ _id: r._id, status: 'pending' }, { $set: { status: 'accepted', respondedAt: new Date() } }, { new: true })
  if (!claimed) fail(409, 'This request was already answered.', { code: 'NOT_PENDING' })
  let result
  try {
    result = await EFFECT[`${r.fromRole}>${r.toRole}`](claimed, me, body)
  } catch (err) {
    await LinkRequest.updateOne({ _id: r._id }, { $set: { status: 'pending', respondedAt: null } })
    throw err
  }
  claimed.result = result.saved || null
  if (result.patch) Object.assign(claimed, result.patch)
  await claimed.save()
  await tellSender(claimed, 'accepted', me)
  return { request: view(claimed, me), ...result.out }
}

async function declineRequest(me, id) {
  const r = await findFor(me, id, 'to')
  assertOpen(r)
  r.status = 'declined'
  r.respondedAt = new Date()
  await r.save()
  await tellSender(r, 'declined', me)
  return { request: view(r, me) }
}

async function cancelRequest(me, id) {
  const r = await findFor(me, id, 'from')
  if (r.status !== 'pending') fail(409, 'This request was already answered.', { code: 'NOT_PENDING' })
  r.status = 'cancelled'
  r.respondedAt = new Date()
  await r.save()
  // A parent who cancels "add my child" doesn't want the waiting card either.
  if (r.kind === 'family' && r.fromRole === 'parent' && r.childId) {
    await Child.deleteOne({ _id: r.childId, parentId: r.fromId, linkStatus: 'pending' })
  }
  return { request: view(r, me) }
}

function verify(child, by, email, note) {
  child.linkStatus = 'verified'
  child.verifiedAt = new Date()
  child.verifiedBy = by
  child.consentVersion = CONSENT_VERSION
  child.revokedAt = null
  child.revokedBy = ''
  child.consentHistory = [...(child.consentHistory || []), { at: new Date(), action: 'link_verified', version: CONSENT_VERSION, by: norm(email), note }]
}

// The learner joins a school / workspace (and a group). Plan limits and seats apply.
async function enrol({ orgId, groupId, email, name }) {
  const org = isId(orgId) ? await Organization.findById(orgId).lean() : null
  if (!org || org.status === 'rejected') fail(410, 'This school or class isn’t on Learnigo any more.', { code: 'GONE' })
  const batch = groupId ? await Batch.findOne({ _id: groupId, orgId: org._id, status: 'active' }) : null
  if (groupId && !batch) fail(410, 'This class isn’t open any more. Ask your teacher for a new invitation.', { code: 'GONE' })
  let student = await Student.findOne({ orgId: org._id, email })
  if (batch && student?.status === 'active' && batch.studentIds.some((x) => idStr(x) === idStr(student._id))) {
    return { studentId: String(student._id), orgName: org.name, groupName: batch.name, already: true }
  }
  if (batch && batch.maxStudents != null && batch.studentIds.length >= batch.maxStudents) fail(409, 'This class is full. Ask your teacher to make room.', { code: 'CAPACITY' })
  let created = false
  if (!student || student.status !== 'active') {
    const { entitlementsFor } = require('../utils/entitlements')
    const ent = await entitlementsFor({ role: 'teacher', orgId: String(org._id) })
    const max = ent.limits?.students
    if (max != null && (await Student.countDocuments({ orgId: org._id, status: 'active' })) >= max) {
      fail(402, 'This class is full on its current plan. Let your teacher know.', { code: 'PLAN_LIMIT', limit: 'students' })
    }
    if (org.kind !== 'solo') {
      const seats = await require('../utils/seats').assertSeats(org._id, 1)
      if (seats) fail(409, 'The school has no free places right now. Let your teacher know.', { code: 'SEATS_FULL' })
    }
    if (!student) { student = await Student.create({ name: clean(name, 80) || email.split('@')[0], email, orgId: org._id }); created = true }
    else { student.status = 'active'; student.leftAt = null; await student.save() }
  }
  if (batch) {
    try { await batchService.addStudentsToBatch(batch._id, [student._id]) } catch (err) {
      if (created) await Student.deleteOne({ _id: student._id })
      if (err.statusCode) fail(err.statusCode, err.message)
      throw err
    }
  }
  return { studentId: String(student._id), orgName: org.name, groupName: batch?.name || '', created }
}

// A teacher accepting a learner: which of their groups? The one they chose, their only
// one, or (a brand-new workspace with no group yet) a first group made for them.
async function groupForTeacher(ctx, groupId) {
  const { myGroup, assertWithinLimit } = require('./teacherContext')
  if (groupId) {
    const b = await myGroup(ctx, groupId)
    if (b.status !== 'active') fail(400, 'This group is archived. Pick an active group.')
    return b
  }
  const mine = await Batch.find({ orgId: ctx.orgId, tutorIds: ctx.tutorId, status: 'active' }).limit(2)
  if (mine.length === 1) return mine[0]
  if (mine.length > 1) fail(400, 'Choose which group they join.', { code: 'CHOOSE_GROUP' })
  if (!ctx.canCreateGroups) fail(400, 'You don’t have a group yet. Ask your school admin to add you to one.', { code: 'NO_GROUP' })
  await assertWithinLimit(ctx, 'groups', 1)
  const batch = await Batch.create({ name: 'My students', emoji: '🌱', orgId: ctx.orgId, directTutorIds: [ctx.tutorId], tutorIds: [ctx.tutorId], subjects: [], createdByTutorId: ctx.tutorId, groupKind: 'class', subject: '' })
  await batchService.syncBatchDerivedFields(batch._id)
  await batchService.recomputeTutorDerivedFields(ctx.tutorId)
  return batch
}

// The Tutor row for this person in this school (new, re-activated, or already there).
async function joinStaff(orgId, { email, name }) {
  const org = isId(orgId) ? await Organization.findById(orgId).lean() : null
  if (!org || org.status === 'rejected') fail(410, 'This school isn’t on Learnigo any more.', { code: 'GONE' })
  const { ensureTutorIndexes } = require('./teacherWorkspaces')
  await ensureTutorIndexes()
  let tutor = await Tutor.findOne({ orgId: org._id, email })
  if (tutor?.authStatus === 'disabled') fail(403, 'Your account at this school is switched off. Ask the school admin.', { code: 'TEACHER_DISABLED' })
  if (!tutor) tutor = await Tutor.create({ name: clean(name, 80) || email.split('@')[0], email, orgId: org._id, authStatus: 'unclaimed' })
  else if (tutor.status !== 'active') { tutor.status = 'active'; await tutor.save() }
  return { tutor, org }
}

const EFFECT = {
  // The learner said yes to a parent: their Child row is verified.
  async 'parent>student'(r, me) {
    if (!(await ParentAccount.exists({ _id: r.fromId }))) fail(410, 'This grown-up’s account is gone.', { code: 'GONE' })
    let child = (r.childId && isId(r.childId) ? await Child.findOne({ _id: r.childId, parentId: r.fromId }) : null)
      || await Child.findOne({ parentId: r.fromId, email: me.email })
    if (!child) child = new Child({ parentId: r.fromId, name: r.childName || firstName(me.name) || 'Learner', age: r.childAge || 9, email: me.email })
    if (child.linkStatus !== 'verified') verify(child, 'child_request', me.email, 'Accepted by the learner')
    await child.save()
    return { saved: { childId: String(child._id) }, patch: { childId: String(child._id) }, out: { linked: true } }
  },

  // A grown-up said yes to a learner: a verified Child row for them.
  async 'student>parent'(r, me, body) {
    const age = body.age === undefined || body.age === '' || body.age === null ? null : Number(body.age)
    if (age !== null && (!Number.isInteger(age) || age < 1 || age > 25)) fail(400, 'Age must be a number from 1 to 25.')
    let child = await Child.findOne({ parentId: me.id, email: r.fromEmail })
    if (!child) child = new Child({ parentId: me.id, name: r.childName || r.fromEmail.split('@')[0], age: age || r.childAge || 9, email: r.fromEmail })
    else if (age) child.age = age
    if (child.linkStatus !== 'verified') verify(child, 'child_request', me.email, 'Asked for by the learner')
    await child.save()
    return { saved: { childId: String(child._id) }, out: { child } }
  },

  // A learner said yes to a teacher's group.
  async 'teacher>student'(r, me) {
    const out = await enrol({ orgId: r.orgId, groupId: r.groupId, email: me.email, name: me.name || r.toName })
    return { saved: { studentId: out.studentId }, out: { joined: true, org: { name: out.orgName }, group: { name: out.groupName } } }
  },

  // A teacher said yes to a learner: into the chosen group of the workspace they're in.
  async 'student>teacher'(r, me, body) {
    const ctx = me.teacherCtx
    if (!ctx) fail(403, 'Sign in to your teacher workspace to add learners.', { code: 'NEEDS_WORKSPACE' })
    const batch = await groupForTeacher(ctx, body.groupId)
    const existing = await Student.findOne({ orgId: ctx.orgId, email: r.fromEmail }).select('status').lean()
    if ((!existing || existing.status !== 'active') && !ctx.canAddNewStudents) {
      fail(403, 'Your school adds new students. Ask your admin to add this learner.', { code: 'POLICY_BLOCKED' })
    }
    const out = await enrol({ orgId: String(ctx.orgId), groupId: String(batch._id), email: r.fromEmail, name: r.fromName })
    return {
      saved: { studentId: out.studentId },
      patch: { orgId: String(ctx.orgId), orgName: ctx.org.name, groupId: String(batch._id), groupName: batch.name },
      out: { joined: true, group: { id: String(batch._id), name: batch.name } },
    }
  },

  // A teacher said yes to a school.
  async 'admin>teacher'(r, me) {
    const { tutor, org } = await joinStaff(r.orgId, { email: me.email, name: me.name || r.toName })
    return { saved: { tutorId: String(tutor._id) }, out: { tutorId: String(tutor._id), org: { id: String(org._id), name: org.name } } }
  },

  // A school said yes to a teacher.
  async 'teacher>admin'(r, me) {
    const org = await schoolOf(me)
    const { tutor } = await joinStaff(String(org._id), { email: r.fromEmail, name: r.fromName })
    return { saved: { tutorId: String(tutor._id) }, patch: { orgId: String(org._id), orgName: org.name }, out: { tutorId: String(tutor._id) } }
  },

  // A learner said yes to a school.
  async 'admin>student'(r, me) {
    const out = await enrol({ orgId: r.orgId, groupId: r.groupId, email: me.email, name: me.name || r.toName })
    return { saved: { studentId: out.studentId }, out: { joined: true, org: { name: out.orgName }, group: out.groupName ? { name: out.groupName } : null } }
  },
}

// ── Lists ───────────────────────────────────────────────────────────────────

// { incoming: waiting for me, outgoing: what I sent in the last 30 days }
async function listFor(me) {
  const now = new Date()
  const [incoming, outgoing] = await Promise.all([
    LinkRequest.find({ toRole: me.role, toEmail: me.email, status: 'pending', expiresAt: { $gt: now } }).sort({ createdAt: -1 }).limit(50),
    LinkRequest.find({ ...sentBy(me), createdAt: { $gt: new Date(now - 30 * DAY) } }).sort({ createdAt: -1 }).limit(50),
  ])
  return { incoming: incoming.map((r) => view(r, me)), outgoing: outgoing.map((r) => view(r, me)) }
}

// A learner's people: grown-ups who follow them, and their classes.
async function peopleOf(me) {
  const rows = await Child.find({ email: me.email, linkStatus: 'verified' }).select('parentId verifiedAt managedLearnerId').lean()
  const parents = await ParentAccount.find({ _id: { $in: rows.map((r) => r.parentId) } }).select('name').lean()
  const pname = new Map(parents.map((p) => [String(p._id), p.name]))
  const managed = isManagedEmail(me.email)
  const guardians = rows.map((r) => ({ id: String(r._id), name: firstName(pname.get(String(r.parentId))) || 'A grown-up', since: r.verifiedAt, canRemove: !managed }))

  const students = await Student.find({ email: me.email, status: 'active' }).select('_id orgId').lean()
  const classes = []
  if (students.length) {
    const batches = await Batch.find({ studentIds: { $in: students.map((s) => s._id) }, status: 'active' }).select('name emoji orgId createdByTutorId tutorIds').lean()
    const orgs = await Organization.find({ _id: { $in: [...new Set(batches.map((b) => String(b.orgId)))] } }).select('name kind').lean()
    const omap = new Map(orgs.map((o) => [String(o._id), o]))
    const tutors = await Tutor.find({ _id: { $in: batches.map((b) => b.createdByTutorId || b.tutorIds?.[0]).filter(Boolean) } }).select('name').lean()
    const tmap = new Map(tutors.map((t) => [String(t._id), t.name]))
    for (const b of batches) {
      const org = omap.get(String(b.orgId))
      if (!org) continue
      classes.push({ id: String(b._id), name: b.name, emoji: b.emoji || '', teacher: tmap.get(String(b.createdByTutorId || b.tutorIds?.[0])) || '', org: org.name, canLeave: org.kind === 'solo' })
    }
  }
  return { guardians, classes }
}

// A learner stops a grown-up following them, or leaves a private tutor's group.
async function unlinkFor(me, { type, id } = {}) {
  if (!isId(id)) fail(404, 'Not found')
  if (type === 'parent') {
    if (isManagedEmail(me.email)) fail(403, 'Ask your grown-up to change this.')
    const row = await Child.findOne({ _id: id, email: me.email, linkStatus: 'verified' })
    if (!row) fail(404, 'Not found')
    row.linkStatus = 'revoked'
    row.revokedAt = new Date()
    row.revokedBy = 'learner'
    row.consentHistory.push({ at: new Date(), action: 'link_revoked', version: CONSENT_VERSION, by: me.email, note: 'Removed by the learner' })
    await row.save()
    await notify({ role: 'parent', id: String(row.parentId) }, { kind: 'link_request', title: `${firstName(me.name) || 'Your child'} stopped sharing their learning with you`, body: 'You can ask again from your Family page.', link: '/parent-dashboard?tab=family' }, { email: false })
    return { removed: true }
  }
  if (type === 'class') {
    const batch = await Batch.findOne({ _id: id, status: 'active' })
    const org = batch ? await Organization.findById(batch.orgId).select('kind').lean() : null
    const student = batch ? await Student.findOne({ orgId: batch.orgId, email: me.email, _id: { $in: batch.studentIds } }) : null
    if (!batch || !org || !student) fail(404, 'Not found')
    if (org.kind !== 'solo') fail(403, 'This class belongs to your school. Ask your teacher if you need to change it.', { code: 'SCHOOL_CLASS' })
    await batchService.removeStudentFromBatch(batch._id, student._id)
    await notify(batch.tutorIds.map((t) => ({ role: 'teacher', id: String(t) })), { kind: 'link_request', title: `${firstName(me.name) || 'A learner'} left ${batch.name}`, link: '/teacher-dashboard' }, { email: false })
    return { removed: true }
  }
  fail(400, 'Unknown link')
}

// ── Telling people ──────────────────────────────────────────────────────────

const appUrl = (p) => `${(process.env.PUBLIC_APP_URL || String(process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0]).replace(/\/$/, '')}${p}`
const WHERE = {
  student: '/dashboard?tab=people',
  parent: '/parent-dashboard?tab=family&pane=requests',
  teacher: '/teach?invite=1',
  admin: '/admin-school/people?pane=requests',
}

// The words for the recipient. `who` is how the sender appears.
function messageFor(r) {
  const who = r.fromName ? `${r.fromName} (${r.fromEmail})` : r.fromEmail
  const at = r.orgName ? ` at ${r.orgName}` : ''
  switch (`${r.fromRole}>${r.toRole}`) {
    case 'parent>student': return { title: `${r.fromName || 'A grown-up'} wants to follow your learning`, body: `${who} asked to see how your learning is going on Learnigo. Open Learnigo, go to Dashboard → My people and tap Accept. If you don’t know them, tap No thanks and tell a grown-up.` }
    case 'student>parent': return { title: `${r.fromName || 'A learner'} asked you to follow their learning`, body: `${who} would like you to see their progress on Learnigo. Tap Accept on your Family page. It’s free.` }
    case 'teacher>student': return { title: `${r.fromName || 'Your teacher'} invited you to join ${r.groupName}`, body: `${who}${at} invited you to their class on Learnigo. Open Learnigo, go to Dashboard → My people and tap Join.` }
    case 'student>teacher': return { title: `${r.fromName || 'A learner'} asked to join your class`, body: `${who} would like to join your class on Learnigo. Accept and choose their group.` }
    case 'admin>teacher': return { title: `${r.orgName} invited you to teach on Learnigo`, body: `${who} invited you to join ${r.orgName} as a teacher. Sign in with Google using this email and tap Accept.` }
    case 'teacher>admin': return { title: `${r.fromName || 'A teacher'} asked to teach at your school`, body: `${who} would like to join your school on Learnigo as a teacher. Accept to add them.` }
    case 'admin>student': return { title: `${r.orgName} invited you to join on Learnigo`, body: `${who} invited you to ${r.orgName}${r.groupName ? `, in ${r.groupName}` : ''}. Open Learnigo, go to Dashboard → My people and tap Join.` }
    default: return { title: 'You have a new request on Learnigo', body: '' }
  }
}

// The recipient's account(s) for a bell entry, if they have one.
async function accountsOf(role, email) {
  if (role === 'parent') { const p = await ParentAccount.findOne({ email }).select('_id').lean(); return p ? [{ role, id: String(p._id) }] : [] }
  if (role === 'admin') { const a = await OrgAdmin.findOne({ email }).select('_id').lean(); return a ? [{ role, id: String(a._id) }] : [] }
  if (role === 'teacher') {
    const t = await Tutor.findOne({ email, authStatus: { $ne: 'disabled' } }).sort({ lastLoginAt: -1 }).select('_id').lean()
    return t ? [{ role, id: String(t._id) }] : []
  }
  return [] // learners: found by email in their own inbox; they get the email below
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const SIGN_UP = {
  student: 'New to Learnigo? It’s free: sign in with this email address and the request will be waiting under My people.',
  parent: 'New to Learnigo? It’s free: sign in as a parent with Google using this email address and the request will be waiting on your Family page.',
  teacher: 'New to Learnigo? It’s free: open the link, sign in with Google using this email address, and the invitation will be waiting.',
  admin: 'New to Learnigo? It’s free: sign in at the school login with this email address and the request will be waiting on your Teachers page.',
}

async function deliver(r) {
  try {
    const { title, body } = messageFor(r)
    const link = WHERE[r.toRole]
    const accounts = await accountsOf(r.toRole, r.toEmail)
    if (accounts.length) {
      await notify(accounts, { kind: 'link_request', title, body, link })
      return
    }
    const { layout, para, button } = require('../templates/email/layout')
    const html = layout({
      title, preheader: body,
      content: para('Hello,') + para(title, { size: 20, bold: true }) + para(body) + button(appUrl(link), 'Open Learnigo')
        + para(SIGN_UP[r.toRole], { size: 14 }) + para('The request is valid for 14 days. If you weren’t expecting it, you can ignore this email.', { size: 13 }),
      why: 'You got this email because someone typed your address on Learnigo to connect with you.',
    })
    const text = [title, '', body, '', appUrl(link), '', SIGN_UP[r.toRole], 'The request is valid for 14 days.'].join('\n')
    await sendMail({ to: r.toEmail, subject: title, html, text, kind: 'link_request' })
  } catch (err) {
    console.error('link request delivery failed:', err.message)
  }
}

// Tell the sender how it went (a bell entry; learners see it in their list).
async function tellSender(r, outcome, me) {
  try {
    const name = firstName(me.name) || r.toName || r.toEmail
    const yes = outcome === 'accepted'
    const words = {
      'parent>student': yes ? [`${name} accepted: you can now follow their learning`, '/parent-dashboard?tab=home'] : [`${name} didn’t accept your request`, '/parent-dashboard?tab=family'],
      'teacher>student': yes ? [`${name} joined ${r.groupName}`, '/teacher-dashboard'] : [`${name} didn’t join ${r.groupName}`, '/teacher-dashboard'],
      'admin>teacher': yes ? [`${name} joined ${r.orgName} as a teacher`, '/admin-school/teachers'] : [`${name} didn’t accept your invitation`, '/admin-school/teachers'],
      'admin>student': yes ? [`${name} joined ${r.orgName}`, '/admin-school/people'] : [`${name} didn’t accept your invitation`, '/admin-school/people'],
      'teacher>admin': yes ? [`${r.orgName} added you as a teacher`, '/teacher-login'] : ['The school didn’t accept your request', '/teach?invite=1'],
    }[`${r.fromRole}>${r.toRole}`]
    if (!words) return // learners see the answer in their own list
    let to
    if (r.fromRole === 'teacher') to = await accountsOf('teacher', r.fromEmail)
    else if (r.fromRole === 'admin') to = isId(r.fromId) ? [{ role: 'admin', id: r.fromId }] : []
    else to = [{ role: r.fromRole, id: r.fromId }]
    if (to.length) await notify(to, { kind: 'link_request', title: words[0], link: words[1] }, { email: yes })
    else if (r.fromRole === 'teacher' && yes) {
      await sendMail({ to: r.fromEmail, kind: 'link_request', subject: words[0], text: `${words[0]}. Sign in with Google at ${appUrl('/teacher-login')} using ${r.fromEmail}.`, html: `<p>${esc(words[0])}.</p><p><a href="${esc(appUrl('/teacher-login'))}">Sign in with Google</a> using ${esc(r.fromEmail)}.</p>` })
    }
  } catch (err) {
    console.error('link request answer notice failed:', err.message)
  }
}

// A parent removed a child card: requests for it stop too.
async function cancelForChild(parentId, childId) {
  await LinkRequest.updateMany({ fromRole: 'parent', fromId: String(parentId), childId: String(childId), status: 'pending' }, { $set: { status: 'cancelled', respondedAt: new Date() } })
}

module.exports = {
  createRequest, acceptRequest, declineRequest, cancelRequest, listFor, peopleOf, unlinkFor, cancelForChild,
  LinkError, limits, TTL_MS, view, messageFor,
}
