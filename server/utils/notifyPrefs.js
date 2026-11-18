// Notification kinds and each account's preferences (FND-050).
//
// Every kind has a default mode:
//   instant: a bell entry now, plus an email now when the kind is email-worthy
//   digest:  a bell entry now; the email waits for the daily digest
//   off:     nothing (except kinds marked `locked`, which can't be switched off)
// Scheduled emails (weekly parent digest, teacher summary, admin summary) are
// kinds too, so the same settings page and one-tap unsubscribe control them.
const KINDS = {
  message: { label: 'New messages', email: true, default: 'instant', roles: ['parent', 'teacher', 'admin'] },
  announcement: { label: 'Announcements', email: true, default: 'instant', roles: ['parent', 'teacher', 'admin', 'student'] },
  test_assigned: { label: 'Tests and homework set', email: true, default: 'digest', roles: ['parent', 'student'] },
  result_released: { label: 'Results released', email: true, default: 'digest', roles: ['parent', 'student'] },
  at_risk: { label: 'A learner needs a nudge', email: true, default: 'digest', roles: ['parent', 'teacher', 'admin'] },
  link_request: { label: 'Link and invite requests', email: true, default: 'instant', roles: ['parent', 'teacher', 'admin'] },
  approval: { label: 'Things waiting for your approval', email: true, default: 'digest', roles: ['admin', 'superadmin'] },
  report_ready: { label: 'Reports ready', email: false, default: 'instant', roles: ['parent', 'teacher', 'admin'] },
  weekly_digest: { label: 'Weekly learning email (Sunday evening)', email: true, scheduled: true, default: 'instant', roles: ['parent'] },
  teacher_summary: { label: 'Weekly class summary (Monday morning)', email: true, scheduled: true, default: 'instant', roles: ['teacher'] },
  admin_summary: { label: 'Monthly school summary', email: true, scheduled: true, default: 'instant', roles: ['admin'] },
  security: { label: 'Security and account', email: true, default: 'instant', locked: true, roles: ['parent', 'teacher', 'admin', 'superadmin', 'student'] },
}
const MODES = ['instant', 'digest', 'off']
const OTHER = { label: 'Other updates', email: false, default: 'instant' }

const kindInfo = (kind) => KINDS[kind] || OTHER

async function getPrefDoc(owner) {
  const NotificationPref = require('../models/comms/NotificationPref')
  return NotificationPref.findOne({ owner }).lean()
}

// The mode for one kind from a pref doc (or none).
function modeFrom(doc, kind) {
  const info = kindInfo(kind)
  if (info.locked) return 'instant'
  const hit = doc?.kinds?.find((k) => k.kind === kind)
  return hit?.mode || info.default
}

// Many owners at once (notify() fan-out): Map owner -> doc.
async function prefsFor(owners) {
  const NotificationPref = require('../models/comms/NotificationPref')
  const docs = await NotificationPref.find({ owner: { $in: owners } }).lean()
  return new Map(docs.map((d) => [d.owner, d]))
}

// The settings a role sees: every kind that applies to it with the current mode.
function describe(doc, role) {
  return {
    emailOff: Boolean(doc?.emailOff),
    locale: doc?.locale || 'en',
    tz: doc?.tz || '',
    kinds: Object.entries(KINDS)
      .filter(([, k]) => !role || !k.roles || k.roles.includes(role))
      .map(([kind, k]) => ({ kind, label: k.label, email: k.email, scheduled: Boolean(k.scheduled), locked: Boolean(k.locked), default: k.default, mode: modeFrom(doc, kind) })),
  }
}

// Change some kinds' modes. Unknown kinds and locked kinds are ignored.
async function setPrefs(owner, { kinds = {}, emailOff, locale, tz } = {}) {
  const NotificationPref = require('../models/comms/NotificationPref')
  const doc = (await NotificationPref.findOne({ owner })) || new NotificationPref({ owner })
  for (const [kind, mode] of Object.entries(kinds)) {
    if (!KINDS[kind] || KINDS[kind].locked || !MODES.includes(mode)) continue
    const hit = doc.kinds.find((k) => k.kind === kind)
    if (hit) hit.mode = mode
    else doc.kinds.push({ kind, mode })
  }
  if (typeof emailOff === 'boolean') doc.emailOff = emailOff
  if (typeof locale === 'string' && /^[a-z]{2}(-[A-Z]{2})?$/.test(locale)) doc.locale = locale
  if (typeof tz === 'string' && validTz(tz)) doc.tz = tz
  await doc.save()
  return doc.toObject()
}

function validTz(tz) {
  if (!tz || tz.length > 64) return false
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true } catch { return false }
}

// Remember the browser's timezone the first time we see it, for "Sunday evening, your time".
async function rememberTz(owner, tz) {
  if (!validTz(tz)) return
  try {
    const NotificationPref = require('../models/comms/NotificationPref')
    await NotificationPref.updateOne({ owner, $or: [{ tz: '' }, { tz: null }, { tz: { $exists: false } }] }, { $set: { tz }, $setOnInsert: { owner } }, { upsert: true })
  } catch { /* a concurrent insert; fine */ }
}

module.exports = { KINDS, MODES, kindInfo, getPrefDoc, modeFrom, prefsFor, describe, setPrefs, validTz, rememberTz }
