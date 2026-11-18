// Feature flags and module switches (SUP-042), read by entitlementsFor and by
// any feature that wants a gradual rollout:
//
//   const flags = require('../services/featureFlags')
//   if (await flags.isOn('new-report-pdf', { orgId, plan, actorId })) { ... }
//
// Module precedence, from weakest to strongest:
//   plan modules -> module flag for that plan -> module flag 'on' for the platform
//   -> the org's featureOverrides -> module flag 'off' for the platform (a kill switch).
const crypto = require('crypto')
const FeatureFlag = () => require('../models/superadmin/FeatureFlag')

let cache = { at: 0, flags: [] }
let loading = null
const TTL = 30_000

async function load() {
  const flags = await FeatureFlag().find().lean()
  cache = { at: Date.now(), flags }
  return flags
}
async function all() {
  if (Date.now() - cache.at < TTL) return cache.flags
  if (!loading) loading = load().catch(() => cache.flags).finally(() => { loading = null })
  return loading
}
const invalidate = () => { cache = { at: 0, flags: [] } }

// Stable 0-99 bucket for a key and a subject (org or person), so a 20 % rollout
// always picks the same 20 %.
const bucket = (key, subject) => parseInt(crypto.createHash('sha1').update(`${key}:${subject}`).digest('hex').slice(0, 8), 16) % 100

async function isOn(key, { orgId = '', plan = '', actorId = '' } = {}) {
  const f = (await all()).find((x) => x.key === key && x.kind === 'feature')
  if (!f) return false
  if (orgId && f.orgs?.[orgId]) return f.orgs[orgId] === 'on'
  if (plan && f.plans?.[plan]) return f.plans[plan] === 'on'
  if (f.platform === 'on') return true
  if (f.platform === 'off') return false
  const subject = orgId || actorId
  return !!subject && (f.rollout || 0) > 0 && bucket(key, subject) < f.rollout
}

// Steps used by entitlementsFor. `explain` collects why each module is on or off.
async function moduleRules() { return (await all()).filter((f) => f.kind === 'module') }

async function resolveModules({ planModules, plan, overrides = [], MODULES }) {
  const rules = await moduleRules()
  const why = {}
  const set = new Set(planModules)
  for (const m of planModules) why[m] = 'plan'
  for (const r of rules) {
    const v = r.plans?.[plan]
    if (v === 'on') { set.add(r.key); why[r.key] = `flag:plan:${plan}` }
    if (v === 'off') { set.delete(r.key); why[r.key] = `flag:plan:${plan}:off` }
  }
  for (const r of rules) if (r.platform === 'on') { set.add(r.key); why[r.key] = 'flag:platform' }
  for (const o of overrides || []) {
    if (o.startsWith('-')) { set.delete(o.slice(1)); why[o.slice(1)] = 'override:off' } else if (MODULES[o]) { set.add(o); why[o] = 'override' }
  }
  for (const r of rules) if (r.platform === 'off') { set.delete(r.key); why[r.key] = 'flag:platform:off' }
  return { modules: [...set], why }
}

module.exports = { isOn, all, invalidate, resolveModules, bucket }
