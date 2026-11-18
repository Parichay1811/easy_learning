// Billing for customers (FND-031 / FND-032), mounted at /api/billing.
//   GET  /usage     admin/teacher: plan, status, seats and group usage against limits
//   GET  /config    any role: is card payment available?
//   POST /checkout  admin (org plans) or parent (family plan): a Stripe Checkout URL
//   POST /portal    admin or parent with a Stripe customer: a Customer Portal URL
//   POST /webhook   Stripe only (raw body, signature checked)
// Stripe parts are UNTESTED against live Stripe and hidden without the env keys.
const express = require('express')
const router = express.Router()
const { anyAuth, requireRole } = require('../utils/actors')
const { entitlementsFor } = require('../utils/entitlements')
const stripe = require('../services/billing/stripe')
const { audit } = require('../utils/audit')

const fail = (res, status, message, extra = {}) => res.status(status).json({ success: false, message, ...extra })
const clientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '')

router.get('/config', (req, res) => res.json({ success: true, stripe: stripe.enabled() }))

router.get('/usage', anyAuth, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const orgId = req.actor.orgId
    if (!orgId) return fail(res, 400, 'No organisation')
    const Student = require('../models/admin/Student')
    const Batch = require('../models/admin/Batch')
    const Tutor = require('../models/admin/Tutor')
    const Subscription = require('../models/superadmin/Subscription')
    const [ent, students, groups, teachers, sub] = await Promise.all([
      entitlementsFor(req.actor),
      Student.countDocuments({ orgId, status: 'active' }),
      Batch.countDocuments({ orgId, status: { $ne: 'archived' } }),
      Tutor.countDocuments({ orgId }),
      Subscription.findOne({ ownerType: 'org', ownerId: String(orgId) }).select('plan status seats interval periodEnd trialEndsAt cancelAtPeriodEnd invoices stripeCustomerId').lean(),
    ])
    const limit = (k) => (ent.limits?.[k] ? Number(ent.limits[k]) : null)
    const meter = (used, k) => ({ used, limit: limit(k), over: limit(k) != null && used > limit(k), pct: limit(k) ? Math.round((used / limit(k)) * 100) : null })
    res.json({
      success: true, plan: ent.plan, kind: ent.kind, status: sub?.status || 'active',
      usage: { students: meter(students, 'students'), groups: meter(groups, 'groups'), teachers: { used: teachers, limit: limit('teachers') } },
      period: sub ? { interval: sub.interval, periodEnd: sub.periodEnd, trialEndsAt: sub.trialEndsAt, cancelAtPeriodEnd: sub.cancelAtPeriodEnd } : null,
      openInvoices: (sub?.invoices || []).filter((i) => i.status === 'open').map((i) => ({ number: i.number, amountCents: i.amountCents, currency: i.currency, dueAt: i.dueAt })),
      stripe: stripe.enabled(), canManageCard: stripe.enabled() && !!sub?.stripeCustomerId,
    })
  } catch (err) {
    console.error('billing usage error:', err)
    fail(res, 500, 'Internal server error')
  }
})

function owner(actor) {
  if (actor.role === 'admin' && actor.orgId) return { ownerType: 'org', ownerId: String(actor.orgId) }
  if (actor.role === 'parent') return { ownerType: 'parent', ownerId: String(actor.id) }
  return null
}

router.post('/checkout', anyAuth, requireRole('admin', 'parent'), async (req, res) => {
  try {
    if (!stripe.enabled()) return fail(res, 404, 'Card payment is not available.', { code: 'BILLING_OFF' })
    const o = owner(req.actor)
    const planCatalog = require('../services/planCatalog')
    const p = await planCatalog.plan(String(req.body?.plan || ''))
    if (!o || !p || !p.active) return fail(res, 400, 'Choose a plan you can buy.')
    if ((o.ownerType === 'parent') !== (p.for === 'family')) return fail(res, 400, 'That plan is not for this account.')
    const Subscription = require('../models/superadmin/Subscription')
    const existing = await Subscription.findOne(o).select('stripeCustomerId').lean()
    const session = await stripe.checkout({
      ...o, plan: p.id, interval: req.body?.interval === 'year' ? 'year' : 'month', seats: Math.max(1, Number(req.body?.seats) || 1),
      email: req.actor.email, customerId: existing?.stripeCustomerId || undefined, trialDays: p.trialDays || 0,
      successUrl: `${clientUrl()}/${o.ownerType === 'org' ? 'admin' : 'parent'}-dashboard?billing=done`, cancelUrl: `${clientUrl()}/${o.ownerType === 'org' ? 'admin' : 'parent'}-dashboard?billing=cancelled`,
    })
    await audit(req, 'billing.checkout.start', { targetType: o.ownerType, targetId: o.ownerId, orgId: o.ownerType === 'org' ? o.ownerId : '', meta: { plan: p.id } })
    res.json({ success: true, url: session.url })
  } catch (err) {
    if (err.status) return fail(res, err.status, err.message)
    console.error('checkout error:', err)
    fail(res, 500, 'Internal server error')
  }
})

router.post('/portal', anyAuth, requireRole('admin', 'parent'), async (req, res) => {
  try {
    if (!stripe.enabled()) return fail(res, 404, 'Card payment is not available.', { code: 'BILLING_OFF' })
    const o = owner(req.actor)
    const Subscription = require('../models/superadmin/Subscription')
    const sub = o && await Subscription.findOne(o).select('stripeCustomerId').lean()
    if (!sub?.stripeCustomerId) return fail(res, 404, 'No card subscription yet.')
    const session = await stripe.portal({ customerId: sub.stripeCustomerId, returnUrl: `${clientUrl()}/${o.ownerType === 'org' ? 'admin' : 'parent'}-dashboard` })
    res.json({ success: true, url: session.url })
  } catch (err) {
    if (err.status) return fail(res, err.status, err.message)
    console.error('portal error:', err)
    fail(res, 500, 'Internal server error')
  }
})

// Mounted in server.js with express.raw() so the signature can be checked on the exact bytes.
async function webhook(req, res) {
  if (!stripe.webhookEnabled()) return res.status(404).json({ success: false })
  const event = stripe.verifySignature(req.body, req.get('stripe-signature'))
  if (!event) return res.status(400).json({ success: false, message: 'Bad signature' })
  try {
    const result = await stripe.applyEvent(event)
    req.actor = { role: 'system', id: 'stripe', email: '' }
    if (!result.startsWith('ignored')) await audit(req, 'billing.stripe.event', { targetType: 'stripe_event', targetId: event.id, meta: { type: event.type, result } })
    res.json({ received: true, result })
  } catch (err) {
    console.error('stripe webhook error:', err)
    res.status(500).json({ success: false })
  }
}

module.exports = router
module.exports.webhook = webhook
