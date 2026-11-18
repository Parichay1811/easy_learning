// Plans are lists of feature modules (FND-030). Selling a different mix is a
// config change, and the super admin can switch single modules on or off for one
// organisation (featureOverrides). Prices live with billing, not here.
const MODULES = {
  'core.learning': 'Learning modules and games',
  'ai.teacher': 'AI Teacher',
  'family.link': 'Link a parent and their children',
  'analytics.basic': 'Progress overview (last 90 days)',
  'analytics.deep': 'Full history, skill maps, patterns and yearly views',
  'groups': 'Groups of students',
  'qbank.author': 'Write and import your own questions',
  'qbank.share': 'Share questions with the Learnigo community',
  'tests': 'Tests with rules',
  'tests.advanced': 'Question pools, accommodations, live monitor',
  'grading.manual': 'Mark typed and spoken answers',
  'reports.branded': 'Reports with your logo',
  'comms': 'Messages and announcements',
  'comms.policy': 'Messaging policies and office hours',
  'org.tree': 'Campus, grade and section structure',
  'org.campus': 'Several campuses',
  'org.analytics': 'School-wide analytics',
  'staff.roles': 'Coordinators and staff roles',
  'sso': 'Single sign-on',
  'api.export': 'Data export and API',
}

const FREE = ['core.learning', 'ai.teacher', 'family.link', 'analytics.basic']
const SOLO = ['groups', 'qbank.author', 'tests', 'comms']

const PLANS = {
  free: { label: 'Free', for: 'family', modules: FREE },
  family_plus: { label: 'Family Plus', for: 'family', modules: [...FREE, 'analytics.deep'] },
  solo_free: { label: 'Solo Free', for: 'solo', modules: [...FREE, ...SOLO], limits: { groups: 1, students: 15 } },
  solo_pro: { label: 'Solo Pro', for: 'solo', modules: [...FREE, ...SOLO, 'analytics.deep', 'qbank.share', 'tests.advanced', 'grading.manual', 'reports.branded'], limits: {} },
  institute: {
    label: 'Institute', for: 'institute',
    modules: [...FREE, ...SOLO, 'analytics.deep', 'qbank.share', 'tests.advanced', 'grading.manual', 'reports.branded', 'comms.policy', 'org.tree', 'org.analytics', 'staff.roles'],
    limits: {},
  },
  enterprise: { label: 'Enterprise', for: 'institute', modules: Object.keys(MODULES), limits: {} },
}

// Plans the old superadmin enum (free/basic/pro/enterprise) maps to, until billing sets real ones.
const LEGACY = { free: 'institute', basic: 'institute', pro: 'institute', enterprise: 'enterprise' }

module.exports = { MODULES, PLANS, LEGACY }
