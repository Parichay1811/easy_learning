// getOrgPolicy(orgId) -> the organisation's policy with defaults filled in. Solo
// workspaces (kind 'solo') always allow their own groups and messaging.
const DEFAULTS = {
  messaging: 'parent_starts', officeHours: '', teachersCreateGroups: false, parentsSeeClassAverage: false,
  leaderboards: 'off', aiTeacherInSchoolHours: true, activityVisibility: 'assigned', retentionYears: 2,
  dpaAcceptedAt: null, dpaAcceptedBy: '',
}

const deps = {
  load: async (orgId) => {
    const OrgPolicy = require('../models/admin/OrgPolicy')
    const Organization = require('../models/admin/Organization')
    const [policy, org] = await Promise.all([OrgPolicy.findOne({ orgId }).lean(), Organization.findById(orgId).select('kind').lean()])
    return { policy, solo: org?.kind === 'solo' }
  },
}

async function getOrgPolicy(orgId) {
  if (!orgId) return { ...DEFAULTS }
  const { policy, solo } = await deps.load(orgId)
  const merged = { ...DEFAULTS, ...(policy || {}) }
  if (solo) { merged.teachersCreateGroups = true; merged.messaging = policy?.messaging === 'off' ? 'off' : 'both' }
  return merged
}

module.exports = { getOrgPolicy, DEFAULTS, deps }
