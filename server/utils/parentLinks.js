// School-verified parent links (FND-012 / ADM-022). A school adds a parent (org
// `Parent` with an email and the students it is responsible for) and invites
// them. When that email signs in as a parent (verified Firebase token), every
// active org Parent record with it becomes VERIFIED Child links: the school
// already vouched for this person, so no code is needed. This connects the two
// parent systems (org Parent and ParentAccount).
const norm = (s) => String(s || '').trim().toLowerCase()

// Child.age is required; schools don't always record it, so estimate from the grade.
function estimateAge(student) {
  if (student.age) return student.age
  const n = Number(/(\d{1,2})/.exec(String(student.grade || ''))?.[1])
  return n >= 1 && n <= 13 ? n + 5 : 10
}

// Returns { created, verified, orgs } for the parent account that just signed in.
async function linkSchoolChildren(parentAccount) {
  const OrgParent = require('../models/admin/Parent')
  const OrgStudent = require('../models/admin/Student')
  const ParentInvite = require('../models/admin/ParentInvite')
  const Child = require('../models/Child')
  const email = norm(parentAccount?.email)
  const result = { created: 0, verified: 0, orgs: 0 }
  if (!email) return result
  const records = await OrgParent.find({ email, status: 'active' }).select('orgId studentIds').lean()
  if (!records.length) return result
  result.orgs = new Set(records.map((r) => String(r.orgId))).size
  const studentIds = records.flatMap((r) => r.studentIds || [])
  const students = await OrgStudent.find({ _id: { $in: studentIds }, status: 'active', email: { $nin: ['', null] } }).select('name email age grade').lean()
  const now = new Date()
  for (const s of students) {
    const childEmail = norm(s.email)
    const existing = await Child.findOne({ parentId: parentAccount._id, email: childEmail })
    if (!existing) {
      await Child.create({ parentId: parentAccount._id, name: s.name, age: estimateAge(s), email: childEmail, linkStatus: 'verified', verifiedAt: now, verifiedBy: 'school' })
      result.created++
    } else if (existing.linkStatus === 'pending' || !existing.linkStatus) {
      // A revoked link stays revoked: that was somebody's decision.
      existing.linkStatus = 'verified'; existing.verifiedAt = now; existing.verifiedBy = 'school'
      await existing.save()
      result.verified++
    }
  }
  await ParentInvite.updateMany({ email, status: { $ne: 'linked' } }, { $set: { status: 'linked', linkedAt: now } })
  return result
}

// Which of these parent emails already follow at least one of these learners
// through a verified link (whatever made it: the school, a code)? -> Set of emails.
async function linkedParentEmails(parentEmails, learnerEmails) {
  const ParentAccount = require('../models/ParentAccount')
  const Child = require('../models/Child')
  const emails = [...new Set((parentEmails || []).map(norm).filter(Boolean))]
  const learners = [...new Set((learnerEmails || []).map(norm).filter(Boolean))]
  if (!emails.length || !learners.length) return new Set()
  const accounts = await ParentAccount.find({ email: { $in: emails } }).select('email').lean()
  if (!accounts.length) return new Set()
  const linked = await Child.find({ parentId: { $in: accounts.map((a) => a._id) }, email: { $in: learners }, linkStatus: 'verified' }).select('parentId').lean()
  const ids = new Set(linked.map((c) => String(c.parentId)))
  return new Set(accounts.filter((a) => ids.has(String(a._id))).map((a) => a.email))
}

module.exports = { linkSchoolChildren, linkedParentEmails, estimateAge }
