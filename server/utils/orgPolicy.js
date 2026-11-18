// getOrgPolicy(orgId) -> the organisation's policy with defaults filled in. Solo
// workspaces (kind 'solo') always allow their own groups and messaging.
// Features a policy governs must ask here (or mount requirePolicy) before acting.
const DEFAULTS = {
  messaging: 'parent_starts', officeHours: '', teachersCreateGroups: false, parentsSeeClassAverage: false,
  leaderboards: 'off', aiTeacherInSchoolHours: true, activityVisibility: 'assigned', retentionYears: 2,
  dpaAcceptedAt: null, dpaAcceptedBy: '', dpaVersion: '', dpaSignerName: '', dpaSignerRole: '',
  holidaysKeepStreak: true, reviewSlaDays: 3,
  branding: { primaryColor: '', accentColor: '', reportHeader: '', reportFooter: '', welcomeMessage: '' },
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
  if (!orgId) return { ...DEFAULTS, branding: { ...DEFAULTS.branding } }
  const { policy, solo } = await deps.load(orgId)
  const merged = { ...DEFAULTS, ...(policy || {}), branding: { ...DEFAULTS.branding, ...(policy?.branding || {}) } }
  if (solo) { merged.teachersCreateGroups = true; merged.messaging = policy?.messaging === 'off' ? 'off' : 'both' }
  return merged
}

// What a policy decides for one action. Keys and the values that allow it:
//   'teachersCreateGroups'  teachers may create their own groups
//   'parentsSeeClassAverage' parents see class averages
//   'leaderboards'           leaderboards inside a group
//   'aiTeacherInSchoolHours' learners may use the AI Teacher in school hours
//   'parentStartsMessage'    a parent may start a thread with a teacher
//   'teacherStartsMessage'   a teacher may start a thread with a parent
const RULES = {
  teachersCreateGroups: (p) => p.teachersCreateGroups === true,
  parentsSeeClassAverage: (p) => p.parentsSeeClassAverage === true,
  leaderboards: (p) => p.leaderboards === 'group',
  aiTeacherInSchoolHours: (p) => p.aiTeacherInSchoolHours !== false,
  parentStartsMessage: (p) => p.messaging === 'parent_starts' || p.messaging === 'both',
  teacherStartsMessage: (p) => p.messaging === 'both',
}

async function policyAllows(orgId, rule) {
  if (!RULES[rule]) throw new Error(`Unknown policy rule ${rule}`)
  return RULES[rule](await getOrgPolicy(orgId))
}

// Express: requirePolicy('teachersCreateGroups') answers 403 { code: 'POLICY_BLOCKED' }.
// The org comes from req.actor.orgId (set by anyAuth / role middleware).
const requirePolicy = (rule, orgIdOf = (req) => req.actor?.orgId || req.teacher?.orgId || req.admin?.orgId) => async (req, res, next) => {
  try {
    if (await policyAllows(orgIdOf(req), rule)) return next()
    res.status(403).json({ success: false, code: 'POLICY_BLOCKED', policy: rule, message: 'Your school has turned this off. Ask your school admin.' })
  } catch (err) {
    console.error('requirePolicy error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { getOrgPolicy, policyAllows, requirePolicy, RULES, DEFAULTS, deps }
