// Notification preferences per account and kind (FND-050) and one-tap unsubscribe (FND-061).
const prefs = require('../utils/notifyPrefs')
const { readToken } = require('../utils/unsubscribe')
const { t } = require('../i18n/emails')
const { esc } = require('../templates/email/layout')

const owner = (req) => `${req.actor.role}:${req.actor.id}`

const get = async (req, res) => {
  try {
    const tz = req.get('x-timezone')
    if (tz) await prefs.rememberTz(owner(req), tz)
    res.json({ success: true, ...prefs.describe(await prefs.getPrefDoc(owner(req)), req.actor.role), modes: prefs.MODES })
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Internal server error' }) }
}

// PUT { kinds: { message: 'instant', at_risk: 'digest', weekly_digest: 'off' }, emailOff?, locale?, tz? }
const put = async (req, res) => {
  try {
    const { kinds = {}, emailOff, locale, tz } = req.body || {}
    if (typeof kinds !== 'object' || Array.isArray(kinds)) return res.status(400).json({ success: false, message: 'kinds must be an object' })
    for (const [k, mode] of Object.entries(kinds)) {
      if (!prefs.KINDS[k]) return res.status(400).json({ success: false, message: `Unknown kind: ${k}` })
      if (!prefs.MODES.includes(mode)) return res.status(400).json({ success: false, message: `Mode must be one of ${prefs.MODES.join(', ')}` })
    }
    if (tz != null && tz !== '' && !prefs.validTz(tz)) return res.status(400).json({ success: false, message: 'Unknown timezone' })
    const doc = await prefs.setPrefs(owner(req), { kinds, emailOff, locale, tz })
    res.json({ success: true, ...prefs.describe(doc, req.actor.role), modes: prefs.MODES })
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Internal server error' }) }
}

const page = (title, body, ok) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>`
  + '<body style="margin:0;background:#f6f8fc;font-family:\'Segoe UI\',Helvetica,Arial,sans-serif;color:#1f2937">'
  + '<main style="max-width:480px;margin:48px auto;padding:32px 24px;background:#fff;border-radius:20px;box-shadow:0 4px 20px rgba(0,0,0,.06)">'
  + `<p style="font-size:40px;margin:0" aria-hidden="true">${ok ? '&#9989;' : '&#9888;&#65039;'}</p><h1 style="font-size:24px;margin:12px 0">${esc(title)}</h1><p style="font-size:16px;line-height:24px;color:#4b5563">${esc(body)}</p></main></body></html>`

// GET (link in the email) or POST (RFC 8058 one-click from the mail client): ?t=<signed token>
const unsubscribe = async (req, res) => {
  try {
    const tok = readToken(req.query.t || req.body?.t)
    if (!tok || (!prefs.KINDS[tok.kind] && tok.kind !== 'all') || prefs.KINDS[tok.kind]?.locked) {
      return res.status(400).type('html').send(page(t('en', 'unsub.bad_title'), t('en', 'unsub.bad_body'), false))
    }
    const doc = tok.kind === 'all' ? await prefs.setPrefs(tok.owner, { emailOff: true }) : await prefs.setPrefs(tok.owner, { kinds: { [tok.kind]: 'off' } })
    const locale = doc.locale || 'en'
    const label = tok.kind === 'all' ? 'Learnigo' : prefs.KINDS[tok.kind].label
    if (req.method === 'POST') return res.json({ success: true })
    res.type('html').send(page(t(locale, 'unsub.done_title'), t(locale, 'unsub.done_body', { label }), true))
  } catch (e) { console.error(e); res.status(500).type('html').send(page('Something went wrong', 'Please try again later.', false)) }
}

module.exports = { get, put, unsubscribe }
