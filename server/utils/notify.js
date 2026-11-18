// notify({ role:'parent', id }, { kind, title, body, link }) or an array of recipients. Never throws.
//
// Respects each recipient's preference for the kind (utils/notifyPrefs.js):
//   off      -> nothing is stored or sent
//   digest   -> a bell entry now; the email waits for the daily digest
//   instant  -> a bell entry now, and an email now when the kind is email-worthy
// Emails go out in the background through utils/mailer.js (Outbox when no SMTP),
// so a big fan-out never holds up the request. Returns the number of bell entries.
const Notification = require('../models/Notification')

const addr = (role, id) => `${role}:${id}`

// Overridable in tests.
const deps = { sendMail: (...a) => require('./mailer').sendMail(...a) }

async function notify(to, { kind, title, body = '', link = '' }, { email = true } = {}) {
  try {
    const list = (Array.isArray(to) ? to : [to]).filter((t) => t && t.id)
    if (!list.length) return 0
    const { prefsFor, modeFrom, kindInfo } = require('./notifyPrefs')
    const seen = new Set()
    const unique = list.filter((t) => { const k = addr(t.role, t.id); if (seen.has(k)) return false; seen.add(k); return true })
    const prefs = await prefsFor(unique.map((t) => addr(t.role, t.id)))
    const info = kindInfo(kind)
    const docs = []
    const now = []
    for (const t of unique) {
      const owner = addr(t.role, t.id)
      const pref = prefs.get(owner)
      const mode = modeFrom(pref, kind)
      if (mode === 'off') continue
      const emailing = email && info.email && !pref?.emailOff
      docs.push({ to: owner, kind, title, body, link, email: emailing && mode === 'digest' ? 'digest' : '' })
      if (emailing && mode === 'instant') now.push({ ...t, owner, locale: pref?.locale || 'en' })
    }
    if (docs.length) await Notification.insertMany(docs)
    if (now.length) setImmediate(() => emailNow(now, { kind, title, body, link }).catch((e) => console.error('notify email failed:', e.message)))
    return docs.length
  } catch (err) {
    console.error('notify failed:', err.message)
    return 0
  }
}

// Look up addresses server-side and send, a few at a time.
async function emailNow(recipients, { kind, title, body, link }) {
  const { contactsFor } = require('./recipients')
  const { instantEmail } = require('../templates/email/notification')
  const { unsubscribeUrl } = require('./unsubscribe')
  const contacts = await contactsFor(recipients)
  for (let i = 0; i < recipients.length; i += 10) {
    await Promise.all(recipients.slice(i, i + 10).map(async (r) => {
      const c = contacts.get(r.owner)
      if (!c?.email) return
      const unsub = unsubscribeUrl(r.owner, kind)
      const mail = instantEmail({ locale: r.locale, role: r.role, name: c.name, title, body, link, unsubscribeUrl: unsub })
      await deps.sendMail({ to: c.email, ...mail, kind: `notify:${kind}`, headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } })
    }))
    await new Promise((r) => setImmediate(r))
  }
}

module.exports = { notify, addr, deps }
