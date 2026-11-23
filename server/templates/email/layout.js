// HTML email building blocks (FND-061). Real mail clients (Gmail, Outlook,
// Apple Mail) ignore <style> and flexbox, so everything is a table with inline
// styles, 600 px wide, with system fonts and a plain-text twin.
const { t } = require('../../i18n/emails')
const COMPANY = { name: 'Futuresight Analytics Limited', url: 'https://futuresightanalytics.eu/', site: 'futuresightanalytics.eu', email: 'info@futuresightanalytics.eu' }

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const FONT = "'Fredoka','Segoe UI',Helvetica,Arial,sans-serif"
const C = { ink: '#1f2937', soft: '#4b5563', faint: '#6b7280', line: '#e5e7eb', canvas: '#f6f8fc', card: '#ffffff', brand: '#4f46c8', good: '#2e7d32', warn: '#b45309', tile: '#f3f4ff' }

const appUrl = (path = '') => `${(process.env.PUBLIC_APP_URL || (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0]).replace(/\/$/, '')}${path}`

function button(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px"><tr><td bgcolor="${C.brand}" style="border-radius:999px">`
    + `<a href="${esc(href)}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px">${esc(label)}</a>`
    + '</td></tr></table>'
}

// Up to 4 tiles in one row (2 x 2 would need media queries Gmail drops; 4 narrow cells read fine on phones).
function tiles(items) {
  const cells = items.map((x) => `<td width="${Math.floor(100 / items.length)}%" valign="top" style="padding:4px">`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.tile};border-radius:14px"><tr><td style="padding:14px 10px;font-family:${FONT};text-align:center">`
    + `<div style="font-size:19px;line-height:24px;font-weight:700;color:${C.ink}">${esc(x.value)}</div>`
    + `<div style="font-size:12px;line-height:16px;color:${C.soft};margin-top:4px">${esc(x.label)}</div>`
    + (x.delta ? `<div style="font-size:12px;line-height:16px;margin-top:4px;color:${x.up ? C.good : C.warn}">${x.up ? '&#9650;' : '&#9660;'} ${esc(x.delta)}</div>` : '')
    + '</td></tr></table></td>').join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0"><tr>${cells}</tr></table>`
}

const para = (text, { size = 16, color = C.ink, bold = false, margin = '0 0 12px' } = {}) =>
  `<p style="margin:${margin};font-family:${FONT};font-size:${size}px;line-height:${Math.round(size * 1.5)}px;color:${color};${bold ? 'font-weight:600;' : ''}">${esc(text)}</p>`

const callout = (title, text) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0;border-left:4px solid ${C.brand};background:#faf9ff"><tr><td style="padding:14px 16px;font-family:${FONT}">`
  + `<div style="font-size:13px;font-weight:700;color:${C.brand};text-transform:uppercase;letter-spacing:0.04em">${esc(title)}</div>`
  + `<div style="font-size:16px;line-height:24px;color:${C.ink};margin-top:6px">${esc(text)}</div></td></tr></table>`

const divider = () => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${C.line};height:16px;line-height:16px;font-size:0">&nbsp;</td></tr></table>`

// The full document. `content` is HTML built from the helpers above.
function layout({ locale = 'en', title, preheader = '', content, unsubscribeUrl = '', why = '', logoUrl = '', orgName = '', settingsUrl = appUrl('/') }) {
  const brandCell = logoUrl
    ? `<img src="${esc(logoUrl)}" alt="${esc(orgName)}" height="40" style="display:block;height:40px;max-width:200px;border:0">`
    : `<span style="font-family:${FONT};font-size:22px;font-weight:700;color:${C.brand}">Learnigo</span>`
  return `<!doctype html><html lang="${esc(locale)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>`
    + `<body style="margin:0;padding:0;background:${C.canvas}">`
    + `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.canvas}"><tr><td align="center" style="padding:24px 12px">`
    + `<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">`
    + `<tr><td style="padding:0 8px 16px">${brandCell}</td></tr>`
    + `<tr><td style="background:${C.card};border-radius:20px;padding:28px 24px">${content}</td></tr>`
    + `<tr><td style="padding:20px 8px;font-family:${FONT};font-size:12px;line-height:18px;color:${C.faint}">`
    + `${esc(why || t(locale, 'common.footer_why'))}<br>`
    + (unsubscribeUrl ? `<a href="${esc(unsubscribeUrl)}" style="color:${C.faint};text-decoration:underline">${esc(t(locale, 'common.unsubscribe'))}</a> &middot; ` : '')
    + `<a href="${esc(settingsUrl)}" style="color:${C.faint};text-decoration:underline">${esc(t(locale, 'common.settings'))}</a><br>`
    // Who sends this (Learnigo is a Futuresight Analytics product) and where to write back.
    + `Learnigo &middot; ${COMPANY.name} &middot; <a href="${COMPANY.url}" style="color:${C.faint};text-decoration:underline">${COMPANY.site}</a> &middot; <a href="mailto:${COMPANY.email}" style="color:${C.faint};text-decoration:underline">${COMPANY.email}</a>`
    + '</td></tr></table></td></tr></table></body></html>'
}

// Where each role's dashboard lives (links in emails).
const DASHBOARD = { parent: '/parent-dashboard', teacher: '/teacher-dashboard', admin: '/admin-dashboard', superadmin: '/superadmin-dashboard', student: '/dashboard' }
const dashboardUrl = (role, query = '') => appUrl(`${DASHBOARD[role] || '/'}${query}`)

module.exports = { dashboardUrl, esc, layout, button, tiles, para, callout, divider, appUrl, C, FONT }
