// Parent status per child for teachers (TCH-012) and the branded email frame (TCH-081).
const Parent = require('../models/admin/Parent')
const Child = require('../models/Child')
const ParentAccount = require('../models/ParentAccount')

const idStr = (v) => (v == null ? v : String(v))
const lower = (s) => String(s || '').toLowerCase()

// students: [{ _id, name, email }] of one org. Returns one row per student with
// status 'linked' (a parent the school/tutor added has signed in and is verified),
// 'invited' (invite sent, not linked yet) or 'none'.
async function parentStatusFor(orgId, students) {
  const ids = students.map((s) => s._id)
  const parents = await Parent.find({ orgId, studentIds: { $in: ids } }).select('name email studentIds invitedAt').lean()
  const emails = students.map((s) => lower(s.email)).filter(Boolean)
  const children = emails.length ? await Child.find({ email: { $in: emails }, linkStatus: 'verified' }).select('email parentId').lean() : []
  const accounts = children.length ? await ParentAccount.find({ _id: { $in: children.map((c) => c.parentId) } }).select('email').lean() : []
  const accountEmail = new Map(accounts.map((a) => [String(a._id), lower(a.email)]))
  // "studentEmail|parentEmail" pairs that are verified links.
  const verified = new Set(children.map((c) => `${lower(c.email)}|${accountEmail.get(String(c.parentId))}`))

  return students.map((s) => {
    const mine = parents.filter((p) => p.studentIds.some((x) => idStr(x) === idStr(s._id)))
    const list = mine.map((p) => {
      const linked = s.email && verified.has(`${lower(s.email)}|${lower(p.email)}`)
      return { id: String(p._id), name: p.name, email: p.email, status: linked ? 'linked' : p.invitedAt ? 'invited' : 'none', invitedAt: p.invitedAt || null }
    })
    const status = list.some((p) => p.status === 'linked') ? 'linked' : list.some((p) => p.status === 'invited') ? 'invited' : 'none'
    return { studentId: String(s._id), name: s.name, email: s.email || '', status, parents: list }
  })
}

const DEFAULT_COLOR = '#5b4fd6'

// Logo and colour only on plans with reports.branded; otherwise Learnigo's own look.
async function brandingFor(ctx) {
  const branded = ctx.ent.modules.includes('reports.branded')
  return {
    name: ctx.org.name,
    color: branded && ctx.org.brandColor ? ctx.org.brandColor : DEFAULT_COLOR,
    logoUrl: branded ? ctx.org.logoUrl || '' : '',
    branded,
  }
}

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

function emailShell(brand, inner) {
  const logo = brand.logoUrl ? `<img src="${escapeHtml(brand.logoUrl)}" alt="" height="40" style="height:40px;border-radius:8px;vertical-align:middle;margin-right:10px">` : ''
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#1f2937;max-width:560px;margin:0 auto">
  <div style="background:${brand.color};color:#fff;padding:16px 20px;border-radius:16px 16px 0 0;font-size:18px;font-weight:700">${logo}${escapeHtml(brand.name)}</div>
  <div style="border:1px solid #e5e7eb;border-top:0;border-radius:0 0 16px 16px;padding:20px">${inner}
  <p style="color:#6b7280;font-size:13px;margin-top:24px">Sent with Learnigo, learning made friendly for every child. If you did not expect this email you can ignore it.</p></div></div>`
}

module.exports = { parentStatusFor, brandingFor, emailShell, escapeHtml, DEFAULT_COLOR }
