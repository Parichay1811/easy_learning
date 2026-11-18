// Stripe Checkout, Customer Portal and webhook (FND-032).
//
// UNTESTED AGAINST LIVE STRIPE. Everything here is behind env flags and is
// hidden when they are absent:
//   STRIPE_SECRET_KEY        enables Checkout and the Customer Portal
//   STRIPE_WEBHOOK_SECRET    enables POST /api/billing/webhook (signature checked)
//   STRIPE_PRICE_<PLAN>_<INTERVAL>  e.g. STRIPE_PRICE_SOLO_PRO_MONTH=price_123
//   STRIPE_TAX=on            asks Stripe Tax to compute VAT
// No Stripe SDK: the REST API is called with fetch, the signature is checked
// with crypto. The webhook handler is tested with locally signed events only.
const crypto = require('crypto')

const enabled = () => !!process.env.STRIPE_SECRET_KEY
const webhookEnabled = () => !!process.env.STRIPE_WEBHOOK_SECRET
const priceId = (plan, interval = 'month') => process.env[`STRIPE_PRICE_${String(plan).toUpperCase()}_${String(interval).toUpperCase()}`] || ''

// application/x-www-form-urlencoded with Stripe's nested keys (a[b][0]=c).
function form(obj, prefix = '', out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue
    const key = prefix ? `${prefix}[${k}]` : k
    if (typeof v === 'object') form(v, key, out)
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`)
  }
  return out.join('&')
}

async function api(path, params) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: form(params),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(json?.error?.message || 'Stripe request failed'), { status: 502 })
  return json
}

async function checkout({ ownerType, ownerId, plan, interval = 'month', seats = 1, email, successUrl, cancelUrl, trialDays = 0, customerId }) {
  const price = priceId(plan, interval)
  if (!price) throw Object.assign(new Error(`No Stripe price is configured for ${plan} (${interval}).`), { status: 400 })
  return api('/checkout/sessions', {
    mode: 'subscription',
    success_url: successUrl, cancel_url: cancelUrl,
    ...(customerId ? { customer: customerId } : { customer_email: email }),
    line_items: { 0: { price, quantity: Math.max(1, seats) } },
    subscription_data: { metadata: { ownerType, ownerId, plan, interval }, ...(trialDays ? { trial_period_days: trialDays } : {}) },
    metadata: { ownerType, ownerId, plan, interval, seats },
    allow_promotion_codes: 'true',
    ...(process.env.STRIPE_TAX === 'on' ? { automatic_tax: { enabled: 'true' }, tax_id_collection: { enabled: 'true' } } : {}),
  })
}

const portal = ({ customerId, returnUrl }) => api('/billing_portal/sessions', { customer: customerId, return_url: returnUrl })

// Stripe-Signature: t=<unix>,v1=<hex hmac of "t.payload">. 5 minutes tolerance.
function verifySignature(rawBody, header, { secret = process.env.STRIPE_WEBHOOK_SECRET, toleranceSec = 300, now = Date.now() } = {}) {
  if (!secret || !header || !rawBody) return null
  const parts = Object.fromEntries(String(header).split(',').map((p) => p.split('=')).filter((p) => p.length === 2).map(([k, v]) => [k.trim(), v.trim()]))
  const t = Number(parts.t)
  const sigs = String(header).split(',').filter((p) => p.trim().startsWith('v1=')).map((p) => p.trim().slice(3))
  if (!t || !sigs.length || Math.abs(now / 1000 - t) > toleranceSec) return null
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody.toString('utf8')}`).digest('hex')
  const ok = sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)))
  if (!ok) return null
  try { return JSON.parse(rawBody.toString('utf8')) } catch { return null }
}

const sign = (payload, secret, t = Math.floor(Date.now() / 1000)) => `t=${t},v1=${crypto.createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex')}`

const STATUS = { trialing: 'trialing', active: 'active', past_due: 'past_due', unpaid: 'past_due', incomplete: 'past_due', paused: 'paused', canceled: 'cancelled', incomplete_expired: 'cancelled' }

// Applies one verified event to our Subscription. Returns a short description.
async function applyEvent(event) {
  const Subscription = require('../../models/superadmin/Subscription')
  const planCatalog = require('../planCatalog')
  const o = event?.data?.object || {}
  const meta = o.metadata || {}
  const entry = (action, extra = {}) => ({ at: new Date(), action, by: 'stripe', meta: { event: event.id, ...extra } })
  switch (event.type) {
    case 'checkout.session.completed': {
      if (!meta.ownerType || !meta.ownerId || !meta.plan) return 'ignored: no metadata'
      const p = await planCatalog.plan(meta.plan)
      const saOrgId = meta.ownerType === 'org' ? String((await require('../../models/superadmin/Organization').findOne({ adminOrgId: meta.ownerId }).select('_id').lean())?._id || '') : ''
      await Subscription.findOneAndUpdate({ ownerType: meta.ownerType, ownerId: meta.ownerId }, {
        $set: { plan: meta.plan, status: 'active', seats: Number(meta.seats) || 0, interval: meta.interval || 'month', stripeCustomerId: o.customer || '', stripeSubscriptionId: o.subscription || '', currency: String(o.currency || 'eur').toUpperCase(), priceCents: o.amount_total || 0, planSnapshot: p ? planCatalog.snapshotOf(p) : null, planVersion: p?.version || 0, saOrgId },
        $push: { history: entry('stripe.checkout') },
      }, { upsert: true })
      return 'subscription started'
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = await Subscription.findOne({ stripeSubscriptionId: o.id })
      if (!sub) return 'ignored: unknown subscription'
      sub.status = event.type.endsWith('deleted') ? 'cancelled' : STATUS[o.status] || sub.status
      if (o.current_period_end) sub.periodEnd = new Date(o.current_period_end * 1000)
      if (o.trial_end) sub.trialEndsAt = new Date(o.trial_end * 1000)
      sub.cancelAtPeriodEnd = !!o.cancel_at_period_end
      if (sub.status === 'cancelled') sub.cancelledAt = new Date()
      const qty = o.items?.data?.[0]?.quantity
      if (qty && qty !== sub.seats) { sub.history.push(entry('seats.change', { from: sub.seats, to: qty })); sub.seats = qty }
      sub.history.push(entry(`stripe.${event.type.split('.').pop()}`, { status: sub.status }))
      await sub.save()
      return `subscription ${sub.status}`
    }
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const sub = await Subscription.findOne({ stripeSubscriptionId: o.subscription })
      if (!sub) return 'ignored: unknown subscription'
      const paid = event.type === 'invoice.paid'
      const existing = sub.invoices.find((i) => i.reference === o.id)
      const inv = existing || sub.invoices[sub.invoices.push({ number: o.number || o.id, amountCents: o.amount_due || 0, currency: String(o.currency || 'eur').toUpperCase(), reference: o.id, method: 'card', country: o.customer_address?.country || '', vatCents: o.tax || 0 }) - 1]
      inv.status = paid ? 'paid' : 'open'
      if (paid) inv.paidAt = new Date()
      if (!paid) sub.status = 'past_due'
      else if (sub.status === 'past_due') sub.status = 'active'
      sub.history.push(entry(paid ? 'invoice.paid' : 'payment.failed', { invoice: o.id }))
      await sub.save()
      return paid ? 'invoice paid' : 'payment failed'
    }
    default:
      return 'ignored'
  }
}

module.exports = { enabled, webhookEnabled, priceId, checkout, portal, verifySignature, sign, applyEvent, form }
