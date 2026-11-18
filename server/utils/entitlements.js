// Which feature modules may this person use? (FND-030) Resolved from the plan
// (family, solo or institute) plus per-organisation overrides.
const { PLANS, LEGACY, MODULES } = require('../config/plans')

// Overridable in tests; loaded lazily because these models need their databases.
const deps = {
  orgFor: async (orgId) => {
    const Org = require('../models/admin/Organization')
    const SAOrg = require('../models/superadmin/Organization')
    const [org, sa] = await Promise.all([Org.findById(orgId).lean(), SAOrg.findOne({ adminOrgId: orgId }).lean()])
    return { org, sa }
  },
  // The org's subscription, if billing has one (SUP-051): its plan and frozen snapshot win.
  subscriptionFor: async (orgId) => {
    const Subscription = require('../models/superadmin/Subscription')
    return Subscription.findOne({ ownerType: 'org', ownerId: String(orgId), status: { $ne: 'cancelled' } }).lean()
  },
  parentPlan: async (parentId) => {
    const ParentAccount = require('../models/ParentAccount')
    const p = await ParentAccount.findById(parentId).select('plan').lean()
    return p?.plan || 'free'
  },
}

const applyOverrides = (set, overrides = []) => {
  for (const o of overrides) {
    if (o.startsWith('-')) set.delete(o.slice(1))
    else if (MODULES[o]) set.add(o)
  }
  return set
}

async function entitlementsFor(actor) {
  if (!actor) return { plan: 'free', modules: [...PLANS.free.modules], limits: {} }
  if (actor.role === 'superadmin') return { plan: 'all', modules: Object.keys(MODULES), limits: {} }
  if (actor.role === 'parent') {
    const plan = PLANS[await deps.parentPlan(actor.id)] ? await deps.parentPlan(actor.id) : 'free'
    const catalog = (await require('../services/planCatalog').plan(plan)) || PLANS[plan]
    const { modules } = await require('../services/featureFlags').resolveModules({ planModules: catalog.modules, plan, MODULES })
    return { plan, modules, limits: catalog.limits || {} }
  }
  if ((actor.role === 'admin' || actor.role === 'teacher') && actor.orgId) {
    const [{ org, sa }, sub] = await Promise.all([deps.orgFor(actor.orgId), deps.subscriptionFor(actor.orgId).catch(() => null)])
    const solo = org?.kind === 'solo'
    let plan = sub?.plan || (sa?.plan && PLANS[sa.plan] ? sa.plan : null)
    if (!plan) plan = solo ? (sa?.subscriptionPlan === 'pro' || sa?.subscriptionPlan === 'enterprise' ? 'solo_pro' : 'solo_free') : (LEGACY[sa?.subscriptionPlan] || 'institute')
    // Plan catalogue edits (SUP-050) and module flags (SUP-042) apply here; a subscriber keeps its snapshot until renewal.
    const catalog = (await require('../services/planCatalog').plan(plan)) || PLANS[plan] || PLANS.institute
    const bought = sub?.planSnapshot || catalog
    const { modules } = await require('../services/featureFlags').resolveModules({ planModules: bought.modules, plan, overrides: sa?.featureOverrides, MODULES })
    const limits = { ...(bought.limits || {}), ...(sub?.seats ? { students: sub.seats } : {}) }
    return { plan, kind: solo ? 'solo' : 'institute', modules, limits, ...(sub ? { status: sub.status } : {}) }
  }
  return { plan: 'free', modules: [...PLANS.free.modules], limits: {} }
}

// Express: requireModule('tests') answers 402 with a friendly upgrade payload.
const requireModule = (key) => async (req, res, next) => {
  try {
    const ent = await entitlementsFor(req.actor)
    if (ent.modules.includes(key)) { req.entitlements = ent; return next() }
    res.status(402).json({ success: false, code: 'MODULE_LOCKED', module: key, message: `${MODULES[key] || key} isn't part of your plan.`, plan: ent.plan })
  } catch (err) {
    console.error('requireModule error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { entitlementsFor, requireModule, deps, applyOverrides }
