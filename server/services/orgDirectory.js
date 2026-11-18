// Every organisation on one table (SUP-010) with its health score (SUP-023).
// Built from rollups and counts only (LearnerDay for the last 7 days, ActorDay,
// Student/Tutor counts, subscriptions), cached for a few minutes, then
// filtered, sorted and paged in memory: orgs number in the thousands at most.
const { cached } = require('../utils/ttlCache')
const { addDays } = require('../analytics/queries')

const TTL = 3 * 60_000
const FREE_MAIL = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.in', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com', 'gmx.de', 'gmx.net', 'web.de', 'mail.com', 'rediffmail.com', 'yandex.com', 'zoho.com'])

const clamp01 = (x) => Math.max(0, Math.min(1, x))
const utcToday = () => new Date().toISOString().slice(0, 10)

// 0-100. Engagement (active learners / learners) 40 %, teacher activity 25 %,
// parents linked 20 %, open support load 15 %. Null for an org with no learners yet.
function healthScore({ students, active7, tutors, activeTutors, linkedParents, openTickets }) {
  if (!students) return null
  const engagement = clamp01(active7 / students)
  const teachers = tutors ? clamp01(activeTutors / tutors) : 0
  const parents = clamp01(linkedParents / students)
  const support = 1 - clamp01((openTickets || 0) / 3)
  return Math.round(100 * (0.4 * engagement + 0.25 * teachers + 0.2 * parents + 0.15 * support))
}

async function buildRows() {
  const SAOrg = require('../models/superadmin/Organization')
  const Org = require('../models/admin/Organization')
  const Student = require('../models/admin/Student')
  const Tutor = require('../models/admin/Tutor')
  const LearnerDay = require('../models/analytics/LearnerDay')
  const ActorDay = require('../models/superadmin/ActorDay')
  const Subscription = require('../models/superadmin/Subscription')
  const ContactMessage = require('../models/ContactMessage')
  const ChatMessage = require('../models/superadmin/ChatMessage')
  const Child = require('../models/Child')
  const { PLANS, LEGACY } = require('../config/plans')

  const today = utcToday()
  const since7 = addDays(today, -7)
  const since14 = addDays(today, -14)
  const [saOrgs, adminOrgs, students, tutorCounts, active7Emails, adminDays, teacherDays, subs, openContacts, unreadChats] = await Promise.all([
    SAOrg.find().lean(),
    Org.find().select('kind status createdAt').lean(),
    Student.find({ status: 'active' }).select('email orgId parentIds').lean(),
    Tutor.aggregate([{ $group: { _id: '$orgId', n: { $sum: 1 } } }]),
    LearnerDay.distinct('email', { date: { $gte: since7 }, $or: [{ answered: { $gt: 0 } }, { minutes: { $gte: 3 } }] }),
    ActorDay.aggregate([{ $match: { role: 'admin' } }, { $group: { _id: '$orgId', last: { $max: '$date' } } }]),
    ActorDay.aggregate([{ $match: { role: 'teacher', date: { $gte: since14 } } }, { $group: { _id: { org: '$orgId', id: '$id' } } }, { $group: { _id: '$_id.org', n: { $sum: 1 } } }]),
    Subscription.find({ ownerType: 'org' }).select('ownerId plan status seats priceCents interval trialEndsAt periodEnd').lean(),
    ContactMessage.aggregate([{ $match: { status: { $ne: 'resolved' } } }, { $group: { _id: '$email', n: { $sum: 1 } } }]),
    ChatMessage.aggregate([{ $match: { senderRole: 'admin', readBySuperadmin: false } }, { $group: { _id: '$adminUid', n: { $sum: 1 } } }]),
  ])
  const verifiedChildEmails = new Set(await Child.distinct('email', { linkStatus: 'verified', email: { $in: students.map((s) => s.email).filter(Boolean) } }))

  const active = new Set(active7Emails)
  const byOrg = new Map()
  for (const s of students) {
    const k = String(s.orgId)
    const o = byOrg.get(k) || { students: 0, active7: 0, linkedParents: 0 }
    o.students++
    if (s.email && active.has(s.email)) o.active7++
    if ((s.parentIds || []).length || (s.email && verifiedChildEmails.has(s.email))) o.linkedParents++
    byOrg.set(k, o)
  }
  const map = (arr, key = '_id', val = 'n') => new Map(arr.map((x) => [String(x[key]), x[val]]))
  const tutorsBy = map(tutorCounts)
  const lastAdminBy = map(adminDays, '_id', 'last')
  const activeTutorsBy = map(teacherDays)
  const subBy = new Map(subs.map((s) => [String(s.ownerId), s]))
  const contactsBy = map(openContacts)
  const chatsBy = map(unreadChats)
  const adminOrgBy = new Map(adminOrgs.map((o) => [String(o._id), o]))

  return saOrgs.map((sa) => {
    const id = String(sa.adminOrgId || '')
    const ao = adminOrgBy.get(id)
    const kind = ao?.kind || sa.kind || 'institute'
    const c = byOrg.get(id) || { students: 0, active7: 0, linkedParents: 0 }
    const sub = subBy.get(id) || null
    const plan = sub?.plan || (sa.plan && PLANS[sa.plan] ? sa.plan : kind === 'solo' ? (['pro', 'enterprise'].includes(sa.subscriptionPlan) ? 'solo_pro' : 'solo_free') : (LEGACY[sa.subscriptionPlan] || 'institute'))
    const seatLimit = sub?.seats || PLANS[plan]?.limits?.students || null
    const tutors = tutorsBy.get(id) || 0
    const activeTutors = activeTutorsBy.get(id) || 0
    const openTickets = (contactsBy.get(String(sa.adminEmail || '').toLowerCase()) || 0) + (chatsBy.get(String(sa.adminUid)) || 0)
    const lastAdminLogin = lastAdminBy.get(id) || null
    const score = healthScore({ students: c.students, active7: c.active7, tutors, activeTutors, linkedParents: c.linkedParents, openTickets })
    const flags = []
    if (sa.suspendedAt) flags.push('suspended')
    if (sa.status === 'pending') flags.push('pending_approval')
    if (seatLimit && c.students > seatLimit) flags.push('over_limit')
    if (sub?.status === 'past_due') flags.push('payment_failed')
    if (c.students >= 5 && c.active7 / c.students < 0.2) flags.push('low_engagement')
    if (sa.status === 'approved' && (!lastAdminLogin || lastAdminLogin < addDays(today, -30))) flags.push('admin_inactive')
    if (sub?.status === 'trialing' && sub.trialEndsAt && new Date(sub.trialEndsAt) - Date.now() < 7 * 86400_000) flags.push('trial_ending')
    const domain = String(sa.adminEmail || '').split('@')[1] || ''
    return {
      id: String(sa._id), adminOrgId: id, name: sa.name, kind, type: sa.type, status: sa.status, country: sa.country || '',
      adminEmail: sa.adminEmail, adminName: sa.adminName, adminUid: sa.adminUid, emailDomain: domain, freeMail: FREE_MAIL.has(domain),
      plan, subscriptionStatus: sub?.status || sa.subscriptionStatus || 'active', seatsUsed: c.students, seatLimit,
      learners: c.students, active7: c.active7, tutors, activeTutors, linkedParents: c.linkedParents, openTickets,
      health: score, flags, lastAdminLogin, createdAt: sa.createdAt, suspendedAt: sa.suspendedAt || null,
    }
  })
}

const rows = () => cached('directory:rows', TTL, buildRows)

const SORTS = {
  name: (a, b) => a.name.localeCompare(b.name),
  created: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  health: (a, b) => (a.health ?? 101) - (b.health ?? 101),
  learners: (a, b) => b.learners - a.learners,
  active: (a, b) => b.active7 - a.active7,
}

async function query({ q = '', kind = '', status = '', plan = '', flag = '', country = '', sort = 'created', page = 1, limit = 25 } = {}) {
  let list = await rows()
  const needle = String(q).trim().toLowerCase()
  if (needle) list = list.filter((r) => r.name.toLowerCase().includes(needle) || String(r.adminEmail).includes(needle) || r.adminOrgId === needle || r.id === needle)
  if (kind) list = list.filter((r) => r.kind === kind)
  if (status === 'suspended') list = list.filter((r) => r.suspendedAt)
  else if (status) list = list.filter((r) => r.status === status)
  if (plan) list = list.filter((r) => r.plan === plan)
  if (flag) list = list.filter((r) => r.flags.includes(flag))
  if (country) list = list.filter((r) => r.country.toLowerCase() === String(country).toLowerCase())
  list = [...list].sort(SORTS[sort] || SORTS.created)
  const size = Math.min(200, Math.max(1, Number(limit) || 25))
  const p = Math.max(1, Number(page) || 1)
  const all = await rows()
  return {
    total: list.length, page: p, limit: size, rows: list.slice((p - 1) * size, p * size),
    facets: {
      kinds: { institute: all.filter((r) => r.kind === 'institute').length, solo: all.filter((r) => r.kind === 'solo').length },
      flags: ['over_limit', 'payment_failed', 'low_engagement', 'admin_inactive', 'pending_approval', 'suspended', 'trial_ending'].reduce((o, f) => ({ ...o, [f]: all.filter((r) => r.flags.includes(f)).length }), {}),
    },
    all: list,
  }
}

module.exports = { rows, query, healthScore, FREE_MAIL }
