// A single notification as an email, and the daily digest of several (FND-050).
const { t } = require('../../i18n/emails')
const { layout, button, para, divider, appUrl, dashboardUrl, esc, FONT, C } = require('./layout')

const absolute = (link, role) => (!link ? dashboardUrl(role) : /^https?:\/\//.test(link) ? link : appUrl(link.startsWith('/') ? link : `/${link}`))

function instantEmail({ locale = 'en', role, name, title, body, link, unsubscribeUrl }) {
  const content = para(name ? t(locale, 'common.hi', { name }) : t(locale, 'common.hi_anon'))
    + para(title, { size: 20, bold: true })
    + (body ? para(body, { color: C.soft }) : '')
    + button(absolute(link, role), t(locale, 'common.open'))
  const html = layout({ locale, title, preheader: body || title, content, unsubscribeUrl, settingsUrl: dashboardUrl(role) })
  const text = [name ? t(locale, 'common.hi', { name }) : t(locale, 'common.hi_anon'), '', title, body, '', absolute(link, role), '', unsubscribeUrl ? `${t(locale, 'common.unsubscribe')}: ${unsubscribeUrl}` : ''].filter((x) => x != null).join('\n')
  return { subject: t(locale, 'notify.subject', { title }), html, text }
}

function dailyEmail({ locale = 'en', role, name, items, unsubscribeUrl }) {
  const rows = items.slice(0, 20).map((n) => `<tr><td style="padding:10px 0;border-bottom:1px solid ${C.line};font-family:${FONT}">`
    + `<a href="${esc(absolute(n.link, role))}" style="font-size:16px;font-weight:600;color:${C.ink};text-decoration:none">${esc(n.title)}</a>`
    + (n.body ? `<div style="font-size:14px;line-height:20px;color:${C.soft};margin-top:2px">${esc(n.body)}</div>` : '')
    + '</td></tr>').join('')
  const content = para(name ? t(locale, 'common.hi', { name }) : t(locale, 'common.hi_anon'))
    + para(t(locale, 'daily.intro'), { color: C.soft })
    + divider()
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`
    + button(dashboardUrl(role), t(locale, 'common.open'))
  const subject = t(locale, 'daily.subject', { count: items.length })
  const text = [t(locale, 'daily.intro'), '', ...items.slice(0, 20).map((n) => `- ${n.title}${n.body ? `: ${n.body}` : ''}`), '', dashboardUrl(role), unsubscribeUrl ? `${t(locale, 'common.unsubscribe')}: ${unsubscribeUrl}` : ''].join('\n')
  return { subject, html: layout({ locale, title: subject, preheader: items[0]?.title || '', content, unsubscribeUrl, settingsUrl: dashboardUrl(role) }), text }
}

module.exports = { instantEmail, dailyEmail, absolute }
