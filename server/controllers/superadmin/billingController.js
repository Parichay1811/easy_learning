// Plans and billing (SUP-050 / SUP-051 / FND-032): the plan catalogue editor
// and customer actions on subscriptions. Every change is audited with a reason.
const PlanOverride = require('../../models/superadmin/PlanOverride')
const Subscription = require('../../models/superadmin/Subscription')
const SAOrg = require('../../models/superadmin/Organization')
const Student = require('../../models/admin/Student')
const { MODULES } = require('../../config/plans')
const planCatalog = require('../../services/planCatalog')
const { audit } = require('../../utils/audit')
const { clear } = require('../../utils/ttlCache')
const { h, fail, needId, paging, rx, by } = require('./util')

const CURRENCY = /^[A-Z]{3}$/
const PLAN_ID = /^[a-z][a-z0-9_]{1,30}$/

// ── SUP-050 catalogue ─────────────────────────────────────────────────────────
const listPlans = h(async () => {
  const plans = await planCatalog.plans()
  const counts = await Subscription.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: { plan: '$plan', version: '$planVersion' }, n: { $sum: 1 } } }])
  return {
    plans: Object.values(plans).map((p) => ({ ...p, subscribers: counts.filter((c) => c._id.plan === p.id).reduce((s, c) => s + c.n, 0), onOlderVersion: counts.filter((c) => c._id.plan === p.id && (c._id.version || 0) < p.version).reduce((s, c) => s + c.n, 0) })),
    modules: MODULES,
  }
})

function cleanPlanChanges(b) {
  const c = {}
  if (b.label !== undefined) c.label = String(b.label).trim().slice(0, 60)
  if (b.for !== undefined) { if (!['family', 'solo', 'institute'].includes(b.for)) throw fail(400, 'for is family, solo or institute.'); c.for = b.for }
  if (b.modules !== undefined) {
    if (!Array.isArray(b.modules)) throw fail(400, 'modules must be a list.')
    const bad = b.modules.filter((m) => !MODULES[m])
    if (bad.length) throw fail(400, `Unknown module: ${bad.join(', ')}`)
    c.modules = [...new Set(b.modules)]
  }
  if (b.limits !== undefined) {
    if (!b.limits || typeof b.limits !== 'object' || Array.isArray(b.limits)) throw fail(400, 'limits must be an object.')
    c.limits = {}
    for (const [k, v] of Object.entries(b.limits)) { if (v === null || v === '') continue; const n = Number(v); if (!Number.isFinite(n) || n < 0) throw fail(400, `Limit ${k} must be a number.`); c.limits[k] = n }
  }
  if (b.prices !== undefined) {
    if (!b.prices || typeof b.prices !== 'object') throw fail(400, 'prices must be an object.')
    c.prices = {}
    for (const [cur, p] of Object.entries(b.prices)) {
      if (!CURRENCY.test(cur)) throw fail(400, `Unknown currency ${cur}.`)
      const month = Number(p?.month ?? 0), year = Number(p?.year ?? 0)
      if (!(month >= 0 && year >= 0)) throw fail(400, 'Prices are cents, 0 or more.')
      c.prices[cur] = { month: Math.round(month), year: Math.round(year), perSeat: !!p?.perSeat }
    }
  }
  if (b.trialDays !== undefined) { const n = Number(b.trialDays); if (!(n >= 0 && n <= 90)) throw fail(400, 'Trial is 0 to 90 days.'); c.trialDays = Math.round(n) }
  if (b.active !== undefined) c.active = !!b.active
  if (b.coupons !== undefined) {
    if (!Array.isArray(b.coupons)) throw fail(400, 'coupons must be a list.')
    c.coupons = b.coupons.slice(0, 50).map((x) => {
      const code = String(x.code || '').trim().toUpperCase()
      const percentOff = Number(x.percentOff)
      if (!/^[A-Z0-9_-]{3,30}$/.test(code)) throw fail(400, 'Coupon codes are 3-30 letters or digits.')
      if (!(percentOff > 0 && percentOff <= 100)) throw fail(400, 'percentOff is 1 to 100.')
      return { code, percentOff, months: Math.max(0, Number(x.months) || 0), expiresAt: x.expiresAt ? new Date(x.expiresAt) : null }
    })
  }
  return c
}

const savePlan = h(async (req) => {
  const id = String(req.params.id)
  if (!PLAN_ID.test(id)) throw fail(400, 'Plan ids are lower-case letters, digits and _.')
  const reason = String(req.body?.reason || '').trim()
  if (reason.length < 5) throw fail(400, 'Say what changed and why (at least 5 characters).')
  const changes = cleanPlanChanges(req.body || {})
  const existing = await planCatalog.plan(id)
  if (!existing && !changes.modules) throw fail(400, 'A new plan needs a list of modules.')
  const forced = req.body?.forced === true
  const { plan, updatedSubscribers } = await planCatalog.save(id, changes, { forced, by: by(req), note: reason })
  clear('platform:')
  await audit(req, forced ? 'plan.update.forced' : 'plan.update', { targetType: 'plan', targetId: id, reason, meta: { version: plan.version, changes, updatedSubscribers } })
  return { plan, updatedSubscribers, appliesTo: forced ? 'everyone now' : 'new customers now, existing customers at renewal' }
})

const planHistory = h(async (req) => {
  const versions = await PlanOverride.find({ plan: String(req.params.id) }).sort({ version: -1 }).limit(50).lean()
  return { versions: versions.map((v) => ({ ...v, id: String(v._id) })) }
})

// ── SUP-051 subscriptions ────────────────────────────────────────────────────
const view = (s) => s && ({ ...s, id: String(s._id) })

const listSubscriptions = h(async (req) => {
  const { limit, skip, page } = paging(req.query, { def: 30 })
  const f = {}
  if (req.query.status) f.status = String(req.query.status)
  if (req.query.plan) f.plan = String(req.query.plan)
  if (req.query.q) {
    const orgs = await SAOrg.find({ name: rx(req.query.q) }).select('adminOrgId').lean()
    f.ownerId = { $in: orgs.map((o) => o.adminOrgId) }
  }
  const [total, subs] = await Promise.all([Subscription.countDocuments(f), Subscription.find(f).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean()])
  const names = new Map((await SAOrg.find({ adminOrgId: { $in: subs.map((s) => s.ownerId) } }).select('name adminOrgId').lean()).map((o) => [o.adminOrgId, { name: o.name, saOrgId: String(o._id) }]))
  return { total, page, rows: subs.map((s) => ({ ...view(s), org: names.get(s.ownerId) || null, history: undefined })) }
})

async function orgSub(saOrgId) {
  needId(saOrgId, 'Organization')
  const sa = await SAOrg.findById(saOrgId).lean()
  if (!sa || !sa.adminOrgId) throw fail(404, 'Organization not found')
  const sub = await Subscription.findOne({ ownerType: 'org', ownerId: sa.adminOrgId })
  return { sa, sub }
}

const getOrgSubscription = h(async (req) => {
  const { sa, sub } = await orgSub(req.params.id)
  const seatsUsed = await Student.countDocuments({ orgId: sa.adminOrgId, status: 'active' })
  return { subscription: sub ? view(sub.toObject()) : null, seatsUsed }
})

const addMonths = (d, n) => { const x = new Date(d); x.setUTCMonth(x.getUTCMonth() + n); return x }
const periodEndFor = (start, interval) => addMonths(start, interval === 'year' ? 12 : 1)

// Create (start) a subscription for an org: plan, seats, interval, optional trial.
const createOrgSubscription = h(async (req) => {
  const { sa, sub } = await orgSub(req.params.id)
  if (sub && sub.status !== 'cancelled') throw fail(409, 'This organisation already has a subscription.')
  const reason = String(req.body?.reason || '').trim()
  if (reason.length < 5) throw fail(400, 'Give a reason (at least 5 characters).')
  const planId = String(req.body?.plan || '')
  const p = await planCatalog.plan(planId)
  if (!p) throw fail(400, 'Unknown plan.')
  if (p.for === 'family') throw fail(400, 'That is a family plan.')
  const interval = req.body?.interval === 'year' ? 'year' : 'month'
  const seats = Math.max(0, Math.round(Number(req.body?.seats) || 0))
  const currency = CURRENCY.test(req.body?.currency || '') ? req.body.currency : 'EUR'
  const trialDays = req.body?.trialDays !== undefined ? Math.max(0, Math.min(90, Number(req.body.trialDays) || 0)) : 0
  const now = new Date()
  const doc = {
    ownerType: 'org', ownerId: sa.adminOrgId, saOrgId: String(sa._id), plan: planId, planVersion: p.version, planSnapshot: planCatalog.snapshotOf(p),
    status: trialDays ? 'trialing' : 'active', seats, interval, currency, priceCents: planCatalog.priceFor(p, { currency, interval, seats }),
    periodStart: now, periodEnd: trialDays ? new Date(now.getTime() + trialDays * 86400_000) : periodEndFor(now, interval), trialEndsAt: trialDays ? new Date(now.getTime() + trialDays * 86400_000) : null,
    country: sa.country || '', cancelledAt: null, cancelReason: '', pendingChange: null,
    history: [...(sub?.history || []), { at: now, action: trialDays ? 'trial.start' : 'subscription.start', by: by(req), meta: { plan: planId, seats, reason } }],
  }
  const saved = sub ? await Subscription.findByIdAndUpdate(sub._id, doc, { new: true }) : await Subscription.create(doc)
  clear('platform:'); clear('directory:')
  await audit(req, 'billing.subscription.start', { targetType: 'subscription', targetId: String(saved._id), orgId: sa.adminOrgId, reason, meta: { plan: planId, seats, interval, trialDays } })
  return { subscription: view(saved.toObject()) }
})

// One endpoint per customer action, all with a reason.
const ACTIONS = {
  async 'change-plan'(sub, b) {
    const p = await planCatalog.plan(String(b.plan || ''))
    if (!p) throw fail(400, 'Unknown plan.')
    const seats = b.seats !== undefined ? Math.max(0, Math.round(Number(b.seats) || 0)) : sub.seats
    if (b.effective === 'renewal') { sub.pendingChange = { plan: p.id, seats, at: sub.periodEnd }; return { plan: p.id, at: 'renewal' } }
    const from = sub.plan
    Object.assign(sub, { plan: p.id, planVersion: p.version, planSnapshot: planCatalog.snapshotOf(p), seats, priceCents: planCatalog.priceFor(p, { currency: sub.currency, interval: sub.interval, seats }), pendingChange: null })
    return { from, to: p.id, at: 'now' }
  },
  async seats(sub, b) {
    const n = Math.round(Number(b.seats))
    if (!(n >= 0 && n <= 100000)) throw fail(400, 'Seats must be 0 or more.')
    const from = sub.seats
    sub.seats = n
    const p = await planCatalog.plan(sub.plan)
    sub.priceCents = planCatalog.priceFor(sub.planSnapshot?.prices ? { prices: sub.planSnapshot.prices } : p, { currency: sub.currency, interval: sub.interval, seats: n })
    sub.history.push({ at: new Date(), action: 'seats.change', by: '', meta: { from, to: n } })
    return { from, to: n }
  },
  async 'extend-trial'(sub, b) {
    const days = Math.round(Number(b.days))
    if (!(days >= 1 && days <= 90)) throw fail(400, 'Extend by 1 to 90 days.')
    const base = sub.trialEndsAt && new Date(sub.trialEndsAt) > new Date() ? new Date(sub.trialEndsAt) : new Date()
    sub.trialEndsAt = new Date(base.getTime() + days * 86400_000)
    sub.periodEnd = sub.trialEndsAt
    sub.status = 'trialing'
    return { trialEndsAt: sub.trialEndsAt }
  },
  async 'end-trial'(sub) {
    if (sub.status !== 'trialing') throw fail(400, 'Not in a trial.')
    sub.status = 'active'; sub.trialEndsAt = null; sub.periodStart = new Date(); sub.periodEnd = periodEndFor(new Date(), sub.interval)
    sub.history.push({ at: new Date(), action: 'trial.converted', by: '', meta: {} })
    return { status: 'active' }
  },
  async credit(sub, b) {
    const c = Math.round(Number(b.amountCents))
    if (!(c > 0 && c <= 10_000_000)) throw fail(400, 'Credit is a positive amount in cents.')
    sub.creditCents = (sub.creditCents || 0) + c
    return { creditCents: sub.creditCents }
  },
  async invoice(sub, b) {
    const amount = Math.round(Number(b.amountCents ?? sub.priceCents))
    if (!(amount >= 0)) throw fail(400, 'Amount must be 0 or more cents.')
    const applied = Math.min(sub.creditCents || 0, amount)
    sub.creditCents = (sub.creditCents || 0) - applied
    const number = `LG-${new Date().getUTCFullYear()}-${String(Date.now()).slice(-6)}`
    sub.invoices.push({ number, amountCents: amount - applied, currency: sub.currency, status: amount - applied === 0 ? 'paid' : 'open', dueAt: b.dueAt ? new Date(b.dueAt) : new Date(Date.now() + 30 * 86400_000), paidAt: amount - applied === 0 ? new Date() : null, method: applied ? 'credit' : 'invoice', reference: String(b.reference || '').slice(0, 80), country: String(b.country || sub.country || '').slice(0, 2).toUpperCase(), vatCents: Math.max(0, Math.round(Number(b.vatCents) || 0)) })
    return { number, amountCents: amount - applied, creditApplied: applied }
  },
  async 'mark-paid'(sub, b) {
    const inv = sub.invoices.id(String(b.invoiceId || ''))
    if (!inv) throw fail(404, 'Invoice not found')
    if (inv.status === 'paid') throw fail(409, 'Already paid.')
    inv.status = 'paid'; inv.paidAt = new Date(); inv.method = ['po', 'invoice', 'bank', 'card'].includes(b.method) ? b.method : 'invoice'
    if (b.reference) inv.reference = String(b.reference).slice(0, 80)
    if (sub.status === 'past_due' && !sub.invoices.some((i) => i.status === 'open')) sub.status = 'active'
    return { invoice: inv.number }
  },
  async pause(sub) {
    if (!['active', 'past_due', 'trialing'].includes(sub.status)) throw fail(400, 'Only a running subscription can be paused.')
    sub.status = 'paused'; sub.pausedAt = new Date()
    return { status: 'paused' }
  },
  async resume(sub) {
    if (sub.status !== 'paused') throw fail(400, 'Not paused.')
    sub.status = 'active'; sub.pausedAt = null
    return { status: 'active' }
  },
  async cancel(sub, b) {
    if (sub.status === 'cancelled') throw fail(400, 'Already cancelled.')
    sub.cancelReason = String(b.cancelReason || b.reason || '').slice(0, 200)
    if (b.atPeriodEnd) { sub.cancelAtPeriodEnd = true; return { at: sub.periodEnd } }
    sub.status = 'cancelled'; sub.cancelledAt = new Date()
    return { status: 'cancelled' }
  },
  // Renewal: start the next period, apply a booked plan change and the current catalogue version.
  async renew(sub) {
    if (sub.cancelAtPeriodEnd) { sub.status = 'cancelled'; sub.cancelledAt = new Date(); return { status: 'cancelled' } }
    const next = sub.pendingChange || { plan: sub.plan, seats: sub.seats }
    const p = await planCatalog.plan(next.plan)
    if (!p) throw fail(400, 'The plan no longer exists.')
    Object.assign(sub, { plan: p.id, seats: next.seats, planVersion: p.version, planSnapshot: planCatalog.snapshotOf(p), priceCents: planCatalog.priceFor(p, { currency: sub.currency, interval: sub.interval, seats: next.seats }), pendingChange: null, periodStart: new Date(), periodEnd: periodEndFor(new Date(), sub.interval) })
    if (sub.status === 'trialing') { sub.status = 'active'; sub.trialEndsAt = null; sub.history.push({ at: new Date(), action: 'trial.converted', by: '', meta: {} }) }
    return { plan: p.id, version: p.version }
  },
}

const action = h(async (req) => {
  needId(req.params.id, 'Subscription')
  const name = String(req.params.action)
  const fn = ACTIONS[name]
  if (!fn) throw fail(400, 'Unknown action')
  const reason = String(req.body?.reason || '').trim()
  if (reason.length < 5) throw fail(400, 'Give a reason (at least 5 characters).')
  const sub = await Subscription.findById(req.params.id)
  if (!sub) throw fail(404, 'Subscription not found')
  const result = await fn(sub, req.body || {})
  sub.history.push({ at: new Date(), action: name, by: by(req), meta: { ...result, reason } })
  // seats.change entries need the actor too
  for (const e of sub.history) if (!e.by) e.by = by(req)
  await sub.save()
  clear('platform:'); clear('directory:')
  await audit(req, `billing.${name}`, { targetType: 'subscription', targetId: String(sub._id), orgId: sub.ownerType === 'org' ? sub.ownerId : '', reason, meta: result })
  return { subscription: view(sub.toObject()), result }
})

module.exports = { listPlans, savePlan, planHistory, listSubscriptions, getOrgSubscription, createOrgSubscription, action, ACTIONS }
