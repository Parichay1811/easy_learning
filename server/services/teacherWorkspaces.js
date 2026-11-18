// Teacher workspaces (TCH-001/003, FND-015): one Google account can be a Tutor in several
// organisations (a school by day, their own Solo workspace in the evening). This file
// signs the tokens, lists the workspaces and creates a Solo workspace.
const jwt = require('jsonwebtoken')
const Tutor = require('../models/admin/Tutor')
const OrgAdmin = require('../models/admin/OrgAdmin')
const Organization = require('../models/admin/Organization')
const SAOrganization = require('../models/superadmin/Organization')
const Subject = require('../models/admin/Subject')
const TeacherProfile = require('../models/admin/TeacherProfile')
const batchService = require('./batchService')

// Same shape as teacherAuthController.signTeacherToken (kept there for the existing callers).
const signTeacherToken = (tutor) => jwt.sign(
  { id: tutor._id, uid: tutor.uid, email: tutor.email, name: tutor.name, orgId: tutor.orgId, role: 'teacher' },
  process.env.TEACHER_JWT_SECRET,
  { expiresIn: process.env.TEACHER_JWT_EXPIRES_IN || '7d' }
)

// Same shape as adminAuthController's token.
const signAdminToken = (admin) => jwt.sign(
  { id: admin._id, uid: admin.uid, email: admin.email, name: admin.name, orgId: admin.orgId, role: 'org_admin' },
  process.env.ADMIN_JWT_SECRET,
  { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '7d' }
)

// Tutor.uid used to be unique across all organisations, which made a second workspace
// impossible. The model now declares {orgId, uid}; drop the old index once per process.
let indexChecked = null
function ensureTutorIndexes() {
  if (!indexChecked) {
    indexChecked = (async () => {
      try {
        const indexes = await Tutor.collection.indexes()
        if (indexes.some((i) => i.name === 'uid_1' && i.unique)) await Tutor.collection.dropIndex('uid_1')
      } catch { /* collection may not exist yet: nothing to drop */ }
    })()
  }
  return indexChecked
}

// Every workspace this person may enter as a teacher (not disabled, not claimed by another account).
async function workspacesFor(email, uid) {
  const tutors = await Tutor.find({ email: String(email).toLowerCase() }).sort({ lastLoginAt: -1, createdAt: 1 }).lean()
  const usable = tutors.filter((t) => t.authStatus !== 'disabled' && (!t.uid || !uid || t.uid === uid))
  const orgs = await Organization.find({ _id: { $in: usable.map((t) => t.orgId) } }).select('name kind logoUrl brandColor status').lean()
  const byId = new Map(orgs.map((o) => [String(o._id), o]))
  return usable.filter((t) => byId.has(String(t.orgId))).map((t) => {
    const o = byId.get(String(t.orgId))
    return {
      tutorId: String(t._id), orgId: String(o._id), name: o.name, kind: o.kind || 'institute',
      logoUrl: o.logoUrl || '', brandColor: o.brandColor || '', lastLoginAt: t.lastLoginAt || null,
    }
  })
}

// Claim a Tutor row for this Google account and sign them in to it.
async function enterWorkspace(tutor, { uid, name, photoURL } = {}) {
  await ensureTutorIndexes()
  if (uid) tutor.uid = uid
  tutor.authStatus = 'active'
  if (photoURL) tutor.photoURL = photoURL
  if (name && !tutor.name) tutor.name = name
  tutor.lastLoginAt = new Date()
  await tutor.save()
  return signTeacherToken(tutor)
}

// The Solo owner's admin token (questions, settings), only for their own Solo workspace.
async function soloAdminTokenFor(tutor) {
  const org = await Organization.findById(tutor.orgId).select('kind').lean()
  if (org?.kind !== 'solo') return null
  const admin = await OrgAdmin.findOne({ email: tutor.email, orgId: tutor.orgId })
  return admin ? signAdminToken(admin) : null
}

const teacherView = (t) => ({ id: t._id, uid: t.uid, email: t.email, name: t.name, photoURL: t.photoURL, orgId: t.orgId })

const DEFAULT_CODES = new Set(['english', 'maths', 'science'])
const clean = (s, n = 80) => String(s || '').trim().slice(0, n)
const cleanList = (list, n = 40, max = 12) => [...new Set((Array.isArray(list) ? list : []).map((x) => clean(x, n)).filter(Boolean))].slice(0, max)

const inFlight = new Set()

// "I teach privately": an approved Solo organisation (both copies), an OrgAdmin and a Tutor
// for the same person, default subjects. Idempotent: an existing Solo workspace is returned.
// Anything created is removed again if a later step fails.
async function createSoloWorkspace(identity, input = {}) {
  const { uid, email, name: googleName, photoURL } = identity
  await ensureTutorIndexes()

  // Already has a Solo workspace? Sign them in to it.
  const mine = await Tutor.find({ email }).lean()
  if (mine.length) {
    const solo = await Organization.findOne({ _id: { $in: mine.map((t) => t.orgId) }, kind: 'solo' })
    if (solo) {
      const tutor = await Tutor.findOne({ email, orgId: solo._id })
      if (tutor.authStatus === 'disabled') throw Object.assign(new Error('This workspace has been disabled. Contact Learnigo support.'), { status: 403 })
      if (tutor.uid && tutor.uid !== uid) throw Object.assign(new Error('This email is already linked to a different account.'), { status: 403 })
      const token = await enterWorkspace(tutor, { uid, photoURL })
      return { created: false, org: solo, tutor, token, adminToken: await soloAdminTokenFor(tutor) }
    }
  }

  if (inFlight.has(email)) throw Object.assign(new Error('Your workspace is already being created. Please wait a moment.'), { status: 409 })
  inFlight.add(email)
  const created = []
  try {
    const personName = clean(input.name || googleName || email.split('@')[0], 60)
    const workspaceName = clean(input.workspaceName, 80) || `${personName}'s tutoring`

    // An OrgAdmin row is unique by email and uid. If this person already runs a school, the
    // Solo workspace gets its own admin uid so the two never mix (no admin token then).
    let admin = await OrgAdmin.findOne({ $or: [{ uid }, { email }] })
    const reuseAdmin = admin && !admin.orgId
    const ownAdmin = !admin || reuseAdmin
    const adminUid = ownAdmin ? uid : `solo:${uid}`

    const org = await Organization.create({
      kind: 'solo', name: workspaceName, type: 'other', adminEmail: email, adminUid, status: 'approved',
      address: clean(input.country, 60),
    })
    created.push(() => Organization.deleteOne({ _id: org._id }))

    const sa = await SAOrganization.create({
      kind: 'solo', plan: 'solo_free', name: workspaceName, type: 'other', adminEmail: email, adminName: personName, adminUid,
      adminOrgId: String(org._id), status: 'approved', approvedAt: new Date(), approvedBy: 'self-signup (solo)',
      subscriptionPlan: 'free', subscriptionStatus: 'active', address: clean(input.country, 60),
    })
    created.push(() => SAOrganization.deleteOne({ _id: sa._id }))

    if (!admin) {
      admin = await OrgAdmin.create({ uid, email, name: personName, photoURL: photoURL || '', orgId: org._id, designation: 'other', designationOther: 'Private tutor' })
      const id = admin._id
      created.push(() => OrgAdmin.deleteOne({ _id: id }))
    } else if (reuseAdmin) {
      admin.orgId = org._id
      await admin.save()
      const id = admin._id
      created.push(() => OrgAdmin.updateOne({ _id: id }, { orgId: null }))
    }

    await batchService.ensureDefaultSubjects(org._id)
    created.push(() => Subject.deleteMany({ orgId: org._id }))
    const subjects = cleanList(input.subjects)
    const extra = subjects.filter((s) => !DEFAULT_CODES.has(s.toLowerCase()))
    for (const s of extra) {
      await Subject.updateOne({ orgId: org._id, name: s }, { $setOnInsert: { orgId: org._id, name: s, isDefault: false } }, { upsert: true, collation: { locale: 'en', strength: 2 } })
    }

    const tutor = await Tutor.create({
      name: personName, email, orgId: org._id, uid, photoURL: photoURL || '', authStatus: 'active', status: 'active',
      subject: subjects.join(', ').slice(0, 120), lastLoginAt: new Date(),
    })
    created.push(() => Tutor.deleteOne({ _id: tutor._id }))

    await TeacherProfile.create({ orgId: org._id, tutorId: tutor._id, country: clean(input.country, 60), subjects, grades: cleanList(input.grades) })

    return {
      created: true, org, tutor, token: signTeacherToken(tutor),
      adminToken: ownAdmin ? signAdminToken(admin) : null,
    }
  } catch (err) {
    for (const undo of created.reverse()) { try { await undo() } catch { /* best effort */ } }
    throw err
  } finally {
    inFlight.delete(email)
  }
}

module.exports = { signTeacherToken, signAdminToken, ensureTutorIndexes, workspacesFor, enterWorkspace, soloAdminTokenFor, teacherView, createSoloWorkspace }
