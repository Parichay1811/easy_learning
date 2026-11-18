// Seats (ADM-025 / FND-031): active students count as seats. Bought seats come
// from the super admin Organization (`seats`, set by billing) or the plan's
// `limits.students`; with neither, the school is unlimited. At 90 % we warn;
// at 100 % adding students is refused with a clear message. Learning itself is
// never blocked: nothing here runs on learner routes.
const WARN_AT = 90

const deps = {
  async counts(orgId) {
    const Student = require('../models/admin/Student')
    const SAOrg = require('../models/superadmin/Organization')
    const { entitlementsFor } = require('./entitlements')
    const [used, sa, ent] = await Promise.all([
      Student.countDocuments({ orgId, status: 'active' }),
      SAOrg.findOne({ adminOrgId: String(orgId) }).lean(),
      entitlementsFor({ role: 'admin', orgId: String(orgId) }),
    ])
    return { used, sa, ent }
  },
}

function seatState(used, bought) {
  if (!bought) return { used, bought: null, free: null, percent: null, state: 'unlimited' }
  const percent = Math.round((used / bought) * 100)
  return { used, bought, free: Math.max(0, bought - used), percent, state: used >= bought ? 'full' : percent >= WARN_AT ? 'warning' : 'ok' }
}

async function seatInfo(orgId) {
  const { used, sa, ent } = await deps.counts(orgId)
  const bought = Number(sa?.seats) > 0 ? Number(sa.seats) : (Number(ent?.limits?.students) > 0 ? Number(ent.limits.students) : null)
  return seatState(used, bought)
}

// null when `adding` more active students fit, otherwise the error body to send (409).
async function assertSeats(orgId, adding = 1) {
  const s = await seatInfo(orgId)
  if (s.bought == null || s.used + adding <= s.bought) return null
  return {
    code: 'SEATS_FULL', seats: s,
    message: s.free > 0
      ? `Only ${s.free} of your ${s.bought} seats are free, and this adds ${adding} students. Buy more seats or mark leavers first.`
      : `All ${s.bought} seats are in use. Buy more seats or mark leavers to add students. Learning carries on for everyone already in.`,
  }
}

module.exports = { seatInfo, seatState, assertSeats, WARN_AT, deps }
