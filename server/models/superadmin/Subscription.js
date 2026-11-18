const mongoose = require('mongoose')
const superAdminDb = require('../../db/superAdminDb')

// Who pays for what (FND-032 / SUP-051). ownerType 'org' uses the adminDb org id
// as ownerId; 'parent' uses the ParentAccount id. Written by the console's
// customer actions and, when Stripe is configured, by the Stripe webhook.
const invoice = new mongoose.Schema({
  number: { type: String, required: true },
  amountCents: { type: Number, required: true },
  currency: { type: String, default: 'EUR' },
  status: { type: String, enum: ['open', 'paid', 'void'], default: 'open' },
  dueAt: { type: Date, default: null },
  paidAt: { type: Date, default: null },
  method: { type: String, default: '' }, // card | invoice | po | credit
  reference: { type: String, default: '' },
  country: { type: String, default: '' },
  vatCents: { type: Number, default: 0 },
}, { _id: true, timestamps: true })

const schema = new mongoose.Schema({
  ownerType: { type: String, enum: ['org', 'parent'], required: true },
  ownerId: { type: String, required: true },
  saOrgId: { type: String, default: '' },
  plan: { type: String, required: true },
  planVersion: { type: Number, default: 0 },
  // What the customer bought, frozen until renewal (catalogue changes do not touch it unless forced).
  planSnapshot: { type: mongoose.Schema.Types.Mixed, default: null }, // { modules, limits, prices }
  status: { type: String, enum: ['trialing', 'active', 'past_due', 'paused', 'cancelled'], default: 'active' },
  seats: { type: Number, default: 0 },
  currency: { type: String, default: 'EUR' },
  interval: { type: String, enum: ['month', 'year'], default: 'month' },
  priceCents: { type: Number, default: 0 }, // per interval, all seats
  periodStart: { type: Date, default: Date.now },
  periodEnd: { type: Date, default: null },
  trialEndsAt: { type: Date, default: null },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  cancelReason: { type: String, default: '' },
  cancelledAt: { type: Date, default: null },
  pausedAt: { type: Date, default: null },
  creditCents: { type: Number, default: 0 },
  // A plan change booked for the next renewal: { plan, seats, at, by }.
  pendingChange: { type: mongoose.Schema.Types.Mixed, default: null },
  country: { type: String, default: '' },
  stripeCustomerId: { type: String, default: '' },
  stripeSubscriptionId: { type: String, default: '' },
  invoices: { type: [invoice], default: [] },
  history: { type: [{ at: { type: Date, default: Date.now }, action: String, by: String, meta: mongoose.Schema.Types.Mixed }], default: [] },
}, { timestamps: true, minimize: false })
schema.index({ ownerType: 1, ownerId: 1 }, { unique: true })
schema.index({ status: 1 })

module.exports = superAdminDb.models.Subscription || superAdminDb.model('Subscription', schema)
