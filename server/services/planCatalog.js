// The plan catalogue (SUP-050): config/plans.js plus the super admin's edits
// (PlanOverride, versioned). Customers keep the snapshot they bought
// (Subscription.planSnapshot) until renewal; a forced change updates them now.
const { PLANS, MODULES } = require('../config/plans')

// Placeholder list prices in cents until the owners set real ones in the console.
const DEFAULT_PRICES = {
  free: { EUR: { month: 0, year: 0, perSeat: false } },
  family_plus: { EUR: { month: 499, year: 4900, perSeat: false } },
  solo_free: { EUR: { month: 0, year: 0, perSeat: false } },
  solo_pro: { EUR: { month: 1299, year: 12900, perSeat: false } },
  institute: { EUR: { month: 300, year: 3000, perSeat: true } },
  enterprise: { EUR: { month: 0, year: 0, perSeat: true, custom: true } },
}

const PlanOverride = () => require('../models/superadmin/PlanOverride')
let cache = { at: 0, plans: null }
const TTL = 30_000

async function load() {
  const latest = await PlanOverride().aggregate([{ $sort: { plan: 1, version: -1 } }, { $group: { _id: '$plan', doc: { $first: '$$ROOT' } } }])
  const out = {}
  for (const [id, p] of Object.entries(PLANS)) {
    out[id] = { id, label: p.label, for: p.for, modules: [...p.modules], limits: { ...(p.limits || {}) }, prices: DEFAULT_PRICES[id] || {}, trialDays: ['solo_pro', 'institute'].includes(id) ? 14 : 0, active: true, coupons: [], version: 0, source: 'config' }
  }
  for (const { _id: id, doc } of latest) {
    const base = out[id] || { id, label: id, for: doc.for || 'institute', modules: [], limits: {}, prices: {}, trialDays: 0, active: true, coupons: [] }
    out[id] = {
      ...base,
      label: doc.label || base.label,
      for: doc.for || base.for,
      modules: doc.modules ? doc.modules.filter((m) => MODULES[m]) : base.modules,
      limits: doc.limits ?? base.limits,
      prices: doc.prices && Object.keys(doc.prices).length ? doc.prices : base.prices,
      trialDays: doc.trialDays ?? base.trialDays,
      active: doc.active !== false,
      coupons: doc.coupons || [],
      version: doc.version,
      updatedAt: doc.createdAt,
      updatedBy: doc.by,
      note: doc.note,
      source: 'override',
    }
  }
  cache = { at: Date.now(), plans: out }
  return out
}

async function plans() {
  if (cache.plans && Date.now() - cache.at < TTL) return cache.plans
  return load()
}
const plan = async (id) => (await plans())[id] || null
const invalidate = () => { cache = { at: 0, plans: null } }

const snapshotOf = (p) => ({ modules: [...p.modules], limits: { ...(p.limits || {}) }, prices: p.prices, version: p.version, label: p.label })

// Save a new version of a plan. Returns { plan, updatedSubscribers }.
async function save(id, changes, { forced = false, by = '', note = '' } = {}) {
  const current = await plan(id)
  const last = await PlanOverride().findOne({ plan: id }).sort({ version: -1 }).lean()
  const doc = await PlanOverride().create({
    plan: id, version: (last?.version || 0) + 1, by, note, forced,
    label: changes.label ?? current?.label ?? id,
    for: changes.for ?? current?.for ?? 'institute',
    modules: changes.modules ?? current?.modules ?? [],
    limits: changes.limits ?? current?.limits ?? {},
    prices: changes.prices ?? current?.prices ?? {},
    trialDays: changes.trialDays ?? current?.trialDays ?? 0,
    active: changes.active ?? current?.active ?? true,
    coupons: changes.coupons ?? current?.coupons ?? [],
  })
  invalidate()
  const fresh = await plan(id)
  let updatedSubscribers = 0
  if (forced) {
    const Subscription = require('../models/superadmin/Subscription')
    const r = await Subscription.updateMany({ plan: id, status: { $ne: 'cancelled' } }, {
      $set: { planSnapshot: snapshotOf(fresh), planVersion: doc.version },
      $push: { history: { at: new Date(), action: 'plan.forced_update', by, meta: { version: doc.version } } },
    })
    updatedSubscribers = r.modifiedCount || 0
  }
  return { plan: fresh, updatedSubscribers }
}

// List price for a subscription (cents per interval).
function priceFor(p, { currency = 'EUR', interval = 'month', seats = 0 } = {}) {
  const pr = p?.prices?.[currency]
  if (!pr) return 0
  const unit = pr[interval] ?? (interval === 'year' ? (pr.month || 0) * 12 : 0)
  return pr.perSeat ? unit * Math.max(1, seats || 0) : unit
}

module.exports = { plans, plan, save, invalidate, snapshotOf, priceFor, DEFAULT_PRICES }
