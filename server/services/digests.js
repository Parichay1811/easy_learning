// Scheduled emails (FND-061), run by services/scheduler.js:
//   parentWeekly       Sunday from 18:00 in the parent's timezone, one email for all VERIFIED children
//   teacherWeekly      Monday from 07:00, last week per group
//   adminMonthly       the 1st from 08:00, last month for the school
//   notificationDaily  from 17:00, the bell items whose preference is "daily digest"
// Each recipient is claimed in JobRun ('send', job, period, recipient) BEFORE the
// email goes out, so a restart or a second process never sends twice. People
// are processed in small batches with yields so a 2-vCPU server stays responsive.
const JobRun = require('../models/comms/JobRun')
const q = require('../analytics/queries')
const { buildInsights, buildStory } = require('../analytics/insights')
const prefsLib = require('../utils/notifyPrefs')
const { unsubscribeUrl } = require('../utils/unsubscribe')
const { firstNameInitial } = require('../utils/minimise')
const tpl = require('../templates/email/digests')
const { dailyEmail } = require('../templates/email/notification')
const { dashboardUrl } = require('../templates/email/layout')

const deps = { sendMail: (...a) => require('../utils/mailer').sendMail(...a) }
const BATCH = 20
const pause = (ms = 0) => new Promise((r) => (ms ? setTimeout(r, ms) : setImmediate(r)))

// Local calendar facts for a timezone: { date: 'YYYY-MM-DD', dow: 0 (Sun) .. 6, hour }
function localParts(tz, now = new Date()) {
  let parts
  try { parts = new Intl.DateTimeFormat('en-US', { timeZone: tz || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now) } catch { return localParts('UTC', now) }
  const get = (k) => parts.find((p) => p.type === k)?.value
  return { date: `${get('year')}-${get('month')}-${get('day')}`, dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')), hour: Number(get('hour')) }
}

// Claim (job, period, recipient). true = ours to send; false = someone already did.
async function claim(job, period, recipient) {
  try { await JobRun.create({ kind: 'send', job, period, recipient, status: 'claimed' }); return true }
  catch (e) { if (e.code === 11000) return false; throw e }
}
const markSent = (job, period, recipient, status) => JobRun.updateOne({ kind: 'send', job, period, recipient }, { status })

async function alreadyDone(job, period, recipients) {
  const rows = await JobRun.find({ kind: 'send', job, period, recipient: { $in: recipients } }).select('recipient').lean()
  return new Set(rows.map((r) => r.recipient))
}

const unsubHeaders = (url) => ({ 'List-Unsubscribe': `<${url}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' })

// Iterate a Mongo query in pages of BATCH (by _id), yielding between pages.
async function* inBatches(Model, filter, select) {
  let last = null
  for (;;) {
    const rows = await Model.find(last ? { ...filter, _id: { $gt: last } } : filter).sort({ _id: 1 }).limit(BATCH).select(select).lean()
    if (!rows.length) return
    yield rows
    last = rows[rows.length - 1]._id
    await pause(Number(process.env.DIGEST_BATCH_PAUSE_MS) || 25)
  }
}

// Which people in this batch are due: preference not off, email not paused, right local time.
async function due(role, kind, rows, when) {
  const owners = rows.map((r) => `${role}:${r._id}`)
  const prefs = await prefsLib.prefsFor(owners)
  const out = []
  for (const r of rows) {
    const owner = `${role}:${r._id}`
    const pref = prefs.get(owner)
    if (pref?.emailOff || prefsLib.modeFrom(pref, kind) === 'off' || !r.email) continue
    const tz = pref?.tz || 'UTC'
    const local = localParts(tz, when.now)
    const period = when.period(local)
    if (!period) continue
    out.push({ row: r, owner, tz, local, period, locale: pref?.locale || 'en' })
  }
  if (!out.length) return out
  const done = new Set()
  for (const period of new Set(out.map((x) => x.period))) for (const k of await alreadyDone(kind, period, out.filter((x) => x.period === period).map((x) => x.owner))) done.add(`${period}|${k}`)
  return out.filter((x) => !done.has(`${x.period}|${x.owner}`))
}

const hourFrom = (env, d) => { const h = Number(process.env[env]); return Number.isInteger(h) && h >= 0 && h < 24 ? h : d }

// ── Parent: Sunday evening ────────────────────────────────────────────────────
async function parentWeekly({ now = new Date() } = {}) {
  const ParentAccount = require('../models/ParentAccount')
  const Child = require('../models/Child')
  const hour = hourFrom('DIGEST_PARENT_HOUR', 18)
  const stats = { checked: 0, sent: 0, skipped: 0 }
  const when = { now, period: (l) => (l.dow === 0 && l.hour >= hour ? l.date : null) }
  for await (const rows of inBatches(ParentAccount, {}, 'email name')) {
    stats.checked += rows.length
    for (const d of await due('parent', 'weekly_digest', rows, when)) {
      // Only verified links: a pending or revoked child never appears in an email.
      const kids = await Child.find({ parentId: d.row._id, linkStatus: 'verified' }).select('name email').lean()
      if (!kids.length) { stats.skipped++; continue }
      const children = []
      for (const k of kids) {
        const o = await q.overview([k.email], { from: q.addDays(d.local.date, -6), to: d.local.date, cmp: 'prev', tz: d.tz })
        const matrix = q.matrix(o.days)
        const patterns = q.patterns(o.days)
        const streak = await q.streak(k.email, d.tz)
        const first = String(k.name || '').split(' ')[0] || 'Your child'
        children.push({ name: first, cur: o.cur, prev: o.prev, insights: buildInsights({ cur: o.cur, prev: o.prev, matrix, patterns, streak, who: first, rangeDays: 7 }), url: dashboardUrl('parent', `?child=${k._id}`) })
      }
      if (!(await claim('weekly_digest', d.period, d.owner))) continue
      const unsub = unsubscribeUrl(d.owner, 'weekly_digest')
      const mail = tpl.parentWeeklyEmail({ locale: d.locale, name: d.row.name, children, unsubscribeUrl: unsub })
      const r = await deps.sendMail({ to: d.row.email, ...mail, kind: 'digest:parent_weekly', headers: unsubHeaders(unsub) })
      await markSent('weekly_digest', d.period, d.owner, r.status)
      stats.sent++
    }
  }
  return stats
}

// ── Teacher: Monday morning ───────────────────────────────────────────────────
async function teacherWeekly({ now = new Date() } = {}) {
  const Tutor = require('../models/admin/Tutor')
  const Batch = require('../models/admin/Batch')
  const Student = require('../models/admin/Student')
  const { teachesBatch } = require('../utils/scopes')
  const hour = hourFrom('DIGEST_TEACHER_HOUR', 7)
  const stats = { checked: 0, sent: 0, skipped: 0 }
  const when = { now, period: (l) => (l.dow === 1 && l.hour >= hour ? l.date : null) }
  for await (const rows of inBatches(Tutor, { status: 'active' }, 'email name orgId')) {
    stats.checked += rows.length
    for (const d of await due('teacher', 'teacher_summary', rows, when)) {
      const batches = (await Batch.find({ orgId: d.row.orgId, status: { $ne: 'inactive' } }).lean()).filter((b) => teachesBatch(b, d.row._id))
      if (!batches.length) { stats.skipped++; continue }
      const to = q.addDays(d.local.date, -1), from = q.addDays(d.local.date, -7)
      const groups = []
      for (const b of batches) {
        const students = await Student.find({ orgId: d.row.orgId, batchIds: b._id, status: 'active' }).select('name email').lean()
        const emails = students.map((s) => String(s.email || '').toLowerCase()).filter(Boolean)
        const { rows: lr } = await q.perLearner(emails, { from, to, tz: d.tz })
        const name = new Map(students.map((s) => [String(s.email || '').toLowerCase(), s.name]))
        const answered = lr.reduce((s, r) => s + r.answered, 0), correct = lr.reduce((s, r) => s + r.correct, 0)
        groups.push({
          name: b.name, learners: students.length, active: lr.filter((r) => r.activeDays > 0).length,
          minutes: lr.reduce((s, r) => s + r.minutes, 0), accuracy: answered ? Math.round((correct / answered) * 100) : null,
          nudge: lr.filter((r) => r.atRisk).slice(0, 8).map((r) => firstNameInitial(name.get(r.email))),
        })
      }
      if (!(await claim('teacher_summary', d.period, d.owner))) continue
      const unsub = unsubscribeUrl(d.owner, 'teacher_summary')
      const mail = tpl.teacherWeeklyEmail({ locale: d.locale, name: d.row.name, groups, unsubscribeUrl: unsub })
      const r = await deps.sendMail({ to: d.row.email, ...mail, kind: 'digest:teacher_weekly', headers: unsubHeaders(unsub) })
      await markSent('teacher_summary', d.period, d.owner, r.status)
      stats.sent++
    }
  }
  return stats
}

// ── Admin: the first of the month ─────────────────────────────────────────────
async function adminMonthly({ now = new Date() } = {}) {
  const OrgAdmin = require('../models/admin/OrgAdmin')
  const Organization = require('../models/admin/Organization')
  const Student = require('../models/admin/Student')
  const { brandFor } = require('./reportData')
  const hour = hourFrom('DIGEST_ADMIN_HOUR', 8)
  const stats = { checked: 0, sent: 0, skipped: 0 }
  const prevMonth = (date) => { const d = new Date(`${date.slice(0, 7)}-01T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7) }
  const when = { now, period: (l) => (l.date.endsWith('-01') && l.hour >= hour ? prevMonth(l.date) : null) }
  const cache = new Map()   // one computation per school per month, shared by its admins
  for await (const rows of inBatches(OrgAdmin, { orgId: { $ne: null } }, 'email name orgId')) {
    stats.checked += rows.length
    for (const d of await due('admin', 'admin_summary', rows, when)) {
      const orgId = String(d.row.orgId)
      const ck = `${orgId}|${d.period}`
      if (!cache.has(ck)) {
        const org = await Organization.findById(orgId).select('name').lean()
        const students = await Student.find({ orgId, status: 'active' }).select('email').lean()
        const emails = students.map((s) => s.email).filter(Boolean)
        const from = `${d.period}-01`
        const end = new Date(`${from}T12:00:00Z`); end.setUTCMonth(end.getUTCMonth() + 1); end.setUTCDate(0)
        const to = end.toISOString().slice(0, 10)
        const o = await q.overview(emails, { from, to, cmp: 'prev', tz: d.tz })
        const { rows: lr } = await q.perLearner(emails, { from, to, tz: d.tz })
        const brand = await brandFor(orgId)
        const month = new Intl.DateTimeFormat(d.locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${from}T12:00:00Z`))
        cache.set(ck, org && {
          org: org.name, month, learners: students.length, active: lr.filter((r) => r.activeDays > 0).length,
          minutesPerLearner: students.length ? Math.round(o.cur.minutes / students.length) : 0, accuracy: o.cur.accuracy,
          atRisk: lr.filter((r) => r.atRisk).length, story: buildStory({ cur: o.cur, prev: o.prev, who: 'Your learners', rangeLabel: `in ${month}` }), logoUrl: brand?.logoUrl || '',
        })
      }
      const s = cache.get(ck)
      if (!s || !s.learners) { stats.skipped++; continue }
      if (!(await claim('admin_summary', d.period, d.owner))) continue
      const unsub = unsubscribeUrl(d.owner, 'admin_summary')
      const mail = tpl.adminMonthlyEmail({ locale: d.locale, name: d.row.name, s, unsubscribeUrl: unsub })
      const r = await deps.sendMail({ to: d.row.email, ...mail, kind: 'digest:admin_monthly', headers: unsubHeaders(unsub) })
      await markSent('admin_summary', d.period, d.owner, r.status)
      stats.sent++
    }
  }
  return stats
}

// ── Daily digest of bell notifications set to "daily digest" ─────────────────
async function notificationDaily({ now = new Date() } = {}) {
  const Notification = require('../models/Notification')
  const { contactsFor } = require('../utils/recipients')
  const hour = hourFrom('DIGEST_DAILY_HOUR', 17)
  const stats = { owners: 0, sent: 0 }
  const owners = await Notification.distinct('to', { email: 'digest' })
  for (let i = 0; i < owners.length; i += BATCH) {
    const chunk = owners.slice(i, i + BATCH)
    const prefs = await prefsLib.prefsFor(chunk)
    const recips = chunk.map((o) => { const [role, ...id] = o.split(':'); return { role, id: id.join(':'), owner: o } })
    const contacts = await contactsFor(recips)
    for (const r of recips) {
      stats.owners++
      const pref = prefs.get(r.owner)
      const local = localParts(pref?.tz || 'UTC', now)
      if (local.hour < hour) continue
      const pending = await Notification.find({ to: r.owner, email: 'digest' }).sort({ createdAt: -1 }).limit(50).lean()
      const unread = pending.filter((p) => !p.readAt)   // already seen in the app: no need to email
      const c = contacts.get(r.owner)
      const clear = () => Notification.updateMany({ _id: { $in: pending.map((p) => p._id) } }, { email: 'sent' })
      if (!unread.length || !c?.email || pref?.emailOff) { await clear(); continue }
      // One digest a day; anything arriving after today's went out waits for tomorrow's.
      if (!(await claim('notification_daily', local.date, r.owner))) continue
      await clear()
      const unsub = unsubscribeUrl(r.owner, 'all')
      const mail = dailyEmail({ locale: pref?.locale || 'en', role: r.role, name: c.name, items: unread, unsubscribeUrl: unsub })
      const res = await deps.sendMail({ to: c.email, ...mail, kind: 'digest:daily', headers: unsubHeaders(unsub) })
      await markSent('notification_daily', local.date, r.owner, res.status)
      stats.sent++
    }
    await pause(25)
  }
  return stats
}

module.exports = { parentWeekly, teacherWeekly, adminMonthly, notificationDaily, localParts, claim, deps }
