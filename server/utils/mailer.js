// sendMail({ to, subject, text, html, kind }) -> { id, status }. Never throws.
// Configure SMTP with SMTP_URL (smtps://user:pass@host:465) or SMTP_HOST/SMTP_PORT/
// SMTP_USER/SMTP_PASS, and MAIL_FROM. Without SMTP the message stays in the Outbox.
const Outbox = require('../models/Outbox')

let transport
const deps = {
  transport() {
    if (transport !== undefined) return transport
    const url = process.env.SMTP_URL
    const host = process.env.SMTP_HOST
    if (!url && !host) return (transport = null)
    const nodemailer = require('nodemailer')
    transport = nodemailer.createTransport(url || {
      host, port: Number(process.env.SMTP_PORT) || 587, secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
    return transport
  },
}

const FROM = () => process.env.MAIL_FROM || 'Learnigo <no-reply@learnigo.eu>'
const stripHtml = (h) => String(h || '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

async function sendMail({ to, subject, text, html, kind = 'general', headers }) {
  try {
    const doc = await Outbox.create({ to, subject, html: html || '', text: text || stripHtml(html), kind })
    const t = deps.transport()
    if (!t) return { id: String(doc._id), status: 'queued' }
    try {
      await t.sendMail({ from: FROM(), to: doc.to, subject, text: doc.text, html: html || undefined, headers })
      doc.status = 'sent'; doc.sentAt = new Date(); await doc.save()
    } catch (err) {
      doc.status = 'failed'; doc.error = String(err.message).slice(0, 300); await doc.save()
    }
    return { id: String(doc._id), status: doc.status }
  } catch (err) {
    console.error('sendMail failed:', err.message)
    return { id: null, status: 'failed' }
  }
}

module.exports = { sendMail, deps }
