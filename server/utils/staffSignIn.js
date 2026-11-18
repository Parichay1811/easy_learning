// Staff sign-in (ADM-023). Called from the admin Google sign-in with the
// VERIFIED identity (never the request body). A person who runs their own
// school always signs in as its admin; otherwise an active OrgStaff row with
// this email makes them staff of that school.
async function staffForSignIn({ uid, email, name }) {
  const Organization = require('../models/admin/Organization')
  const OrgStaff = require('../models/admin/OrgStaff')
  if (!email) return null
  if (await Organization.exists({ adminUid: uid })) return null
  const staff = await OrgStaff.findOne({ email: String(email).toLowerCase(), status: 'active' }).sort({ createdAt: 1 })
  if (!staff) return null
  if (!(await Organization.exists({ _id: staff.orgId }))) return null
  staff.uid = uid
  staff.lastLoginAt = new Date()
  if (!staff.name && name) staff.name = name
  await staff.save()
  try {
    const { audit } = require('./audit')
    await audit({ actor: { role: 'staff', id: String(staff._id), email: staff.email, orgId: String(staff.orgId) }, ip: '' }, 'staff.signin', { targetType: 'staff', targetId: staff._id, orgId: staff.orgId })
  } catch { /* audit never blocks sign-in */ }
  return staff
}

module.exports = { staffForSignIn }
