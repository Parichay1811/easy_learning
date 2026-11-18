// The teacher's workspace: plan, limits and usage (TCH-080, FND-031), branding (TCH-081),
// profile and the optional public tutor page (TCH-082).
const Organization = require('../models/admin/Organization')
const SAOrganization = require('../models/superadmin/Organization')
const TeacherProfile = require('../models/admin/TeacherProfile')
const Batch = require('../models/admin/Batch')
const { PLANS, MODULES } = require('../config/plans')
const { HttpError, isId, context, handle, usage } = require('../services/teacherContext')

const COLOR = /^#[0-9a-fA-F]{6}$/
const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/
const clean = (s, n) => String(s ?? '').trim().slice(0, n)
const cleanList = (list, n = 40, max = 12) => [...new Set((Array.isArray(list) ? list : []).map((x) => clean(x, n)).filter(Boolean))].slice(0, max)

async function profileFor(ctx) {
  return (await TeacherProfile.findOne({ orgId: ctx.orgId, tutorId: ctx.tutorId }).lean()) || { subjects: [], grades: [], testimonials: [] }
}

// Which plan could they move to, and what would it add? (TCH-080)
function upgradeFor(ctx) {
  if (!ctx.solo) return null
  const next = ctx.ent.plan === 'solo_free' ? 'solo_pro' : null
  if (!next) return null
  const adds = PLANS[next].modules.filter((m) => !ctx.ent.modules.includes(m))
  return { plan: next, label: PLANS[next].label, adds: adds.map((m) => ({ key: m, label: MODULES[m] })), limits: PLANS[next].limits || {}, billingAvailable: false }
}

// GET /workspace
const getWorkspace = handle(async (req, res) => {
  const ctx = await context(req)
  const profile = await profileFor(ctx)
  res.json({
    success: true,
    workspace: {
      id: String(ctx.orgId), name: ctx.org.name, kind: ctx.solo ? 'solo' : 'institute',
      logoUrl: ctx.org.logoUrl || '', brandColor: ctx.org.brandColor || '',
    },
    teacher: { id: String(ctx.tutorId), name: ctx.tutor.name, email: ctx.tutor.email },
    plan: { id: ctx.ent.plan, label: PLANS[ctx.ent.plan]?.label || ctx.ent.plan },
    modules: ctx.ent.modules,
    limits: ctx.ent.limits || {},
    usage: await usage(ctx.orgId),
    permissions: { canCreateGroups: ctx.canCreateGroups, canAddNewStudents: ctx.canAddNewStudents, canEditWorkspace: ctx.solo, branded: ctx.ent.modules.includes('reports.branded') },
    upgrade: upgradeFor(ctx),
    profile: {
      country: profile.country || '', subjects: profile.subjects || [], grades: profile.grades || [],
      checklistDismissed: !!profile.checklistDismissedAt,
      publicEnabled: !!profile.publicEnabled, slug: profile.slug || '', headline: profile.headline || '', bio: profile.bio || '',
      testimonials: (profile.testimonials || []).map((t) => ({ quote: t.quote, by: t.by })), publicGroupId: profile.publicGroupId ? String(profile.publicGroupId) : '',
    },
  })
})

// PATCH /workspace: Solo owners only. Branding fields need reports.branded (Solo Pro).
const updateWorkspace = handle(async (req, res) => {
  const ctx = await context(req)
  if (!ctx.solo) throw new HttpError(403, 'Your school admin manages the workspace settings.')
  const b = req.body || {}
  const orgUpdate = {}
  if (b.name !== undefined) {
    const name = clean(b.name, 80)
    if (!name) throw new HttpError(400, 'The workspace needs a name')
    orgUpdate.name = name
  }
  const wantsBrand = b.brandColor !== undefined || b.logoUrl !== undefined
  if (wantsBrand && !ctx.ent.modules.includes('reports.branded')) {
    throw new HttpError(402, `${MODULES['reports.branded']} isn't part of your plan.`, { code: 'MODULE_LOCKED', module: 'reports.branded', plan: ctx.ent.plan })
  }
  if (b.brandColor !== undefined) {
    if (b.brandColor && !COLOR.test(b.brandColor)) throw new HttpError(400, 'Colour must look like #5b4fd6')
    orgUpdate.brandColor = b.brandColor || ''
  }
  if (b.logoUrl !== undefined) {
    if (b.logoUrl && !/^https:\/\/\S+$/.test(b.logoUrl)) throw new HttpError(400, 'Logo must be an https link')
    orgUpdate.logoUrl = clean(b.logoUrl, 500)
  }
  if (Object.keys(orgUpdate).length) {
    // Both copies of Organization (design-guide section 4).
    await Organization.updateOne({ _id: ctx.orgId }, orgUpdate)
    await SAOrganization.updateOne({ adminOrgId: String(ctx.orgId) }, orgUpdate)
  }

  const p = {}
  let unsetSlug = false
  if (b.country !== undefined) p.country = clean(b.country, 60)
  if (b.subjects !== undefined) p.subjects = cleanList(b.subjects)
  if (b.grades !== undefined) p.grades = cleanList(b.grades)
  if (b.checklistDismissed !== undefined) p.checklistDismissedAt = b.checklistDismissed ? new Date() : null
  if (b.headline !== undefined) p.headline = clean(b.headline, 120)
  if (b.bio !== undefined) p.bio = clean(b.bio, 1200)
  if (b.testimonials !== undefined) {
    p.testimonials = (Array.isArray(b.testimonials) ? b.testimonials : []).slice(0, 6)
      .map((t) => ({ quote: clean(t?.quote, 400), by: clean(t?.by, 60) })).filter((t) => t.quote)
  }
  if (b.publicGroupId !== undefined) {
    if (b.publicGroupId && !(isId(b.publicGroupId) && await Batch.exists({ _id: b.publicGroupId, orgId: ctx.orgId, tutorIds: ctx.tutorId, status: 'active' }))) throw new HttpError(400, 'Pick one of your active groups')
    p.publicGroupId = b.publicGroupId || null
  }
  if (b.slug !== undefined) {
    const slug = clean(b.slug, 40).toLowerCase()
    if (slug && !SLUG.test(slug)) throw new HttpError(400, 'The page address can use 3 to 40 letters, numbers and dashes')
    if (slug && await TeacherProfile.exists({ slug, _id: { $ne: (await profileFor(ctx))._id } })) throw new HttpError(409, 'That page address is taken. Try another.')
    if (slug) p.slug = slug
    else unsetSlug = true
  }
  if (b.publicEnabled !== undefined) p.publicEnabled = !!b.publicEnabled
  if (Object.keys(p).length || unsetSlug) {
    await TeacherProfile.updateOne({ orgId: ctx.orgId, tutorId: ctx.tutorId }, { $set: p, ...(unsetSlug ? { $unset: { slug: 1 } } : {}) }, { upsert: true })
  }
  const prof = await profileFor(ctx)
  if (prof.publicEnabled && !prof.slug) {
    await TeacherProfile.updateOne({ _id: prof._id }, { publicEnabled: false })
    throw new HttpError(400, 'Choose a page address before publishing your page')
  }
  req.teacherCtx = null
  return getWorkspace(req, res)
})

// POST /workspace/logo (multipart "logo"): stored with the existing org-logo uploader.
const uploadLogo = handle(async (req, res) => {
  const ctx = await context(req)
  if (!ctx.solo) throw new HttpError(403, 'Your school admin manages the logo.')
  if (!req.file?.path) throw new HttpError(400, 'Choose an image')
  await Organization.updateOne({ _id: ctx.orgId }, { logoUrl: req.file.path })
  await SAOrganization.updateOne({ adminOrgId: String(ctx.orgId) }, { logoUrl: req.file.path })
  res.json({ success: true, logoUrl: req.file.path })
})

// Branding is a paid module: check before multer touches the upload.
const requireBranding = handle(async (req, res, next) => {
  const ctx = await context(req)
  if (!ctx.ent.modules.includes('reports.branded')) throw new HttpError(402, `${MODULES['reports.branded']} isn't part of your plan.`, { code: 'MODULE_LOCKED', module: 'reports.branded', plan: ctx.ent.plan })
  next()
})

module.exports = { getWorkspace, updateWorkspace, uploadLogo, requireBranding }
