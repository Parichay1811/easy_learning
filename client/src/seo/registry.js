/**
 * The public, indexable pages of the site and the languages each one is
 * published in.
 *
 * Plain ES module with no browser or React imports: the app reads it at run
 * time (components/SEO, the guide pages, the router's language prefix) and the
 * build reads it in Node (scripts/seo-prerender.mjs writes one static HTML file
 * per page and language, the sitemap and llms.txt from it).
 *
 * The words live in public/locales/<lang>/seo.json. A page is listed in a
 * language here only when that file translates all of the page's main content,
 * because hreflang must only point at real translations. The build checks it.
 *
 * URLs: English has no prefix (/faq); every other language has one (/es/faq,
 * and /es/ for the start page). English is also the x-default.
 */

export const SITE_URL = 'https://www.learnigo.eu'
export const SITE_NAME = 'Learnigo'
export const DEFAULT_LANG = 'en'

// Order matches the language switcher. ogLocale is the Open Graph locale.
export const LANGUAGES = [
  { code: 'en', ogLocale: 'en_US', native: 'English' },
  { code: 'es', ogLocale: 'es_ES', native: 'Español' },
  { code: 'pt', ogLocale: 'pt_BR', native: 'Português' },
  { code: 'fr', ogLocale: 'fr_FR', native: 'Français' },
  { code: 'it', ogLocale: 'it_IT', native: 'Italiano' },
  { code: 'de', ogLocale: 'de_DE', native: 'Deutsch' },
  { code: 'nl', ogLocale: 'nl_NL', native: 'Nederlands' },
  { code: 'ru', ogLocale: 'ru_RU', native: 'Русский' },
  { code: 'tr', ogLocale: 'tr_TR', native: 'Türkçe' },
  { code: 'zh', ogLocale: 'zh_CN', native: '中文' },
  { code: 'ja', ogLocale: 'ja_JP', native: '日本語' },
  { code: 'ko', ogLocale: 'ko_KR', native: '한국어' },
  { code: 'id', ogLocale: 'id_ID', native: 'Bahasa Indonesia' },
  { code: 'vi', ogLocale: 'vi_VN', native: 'Tiếng Việt' },
]
export const LANG_CODES = LANGUAGES.map((l) => l.code)
const ALL = LANG_CODES
const PREFIXED = new Set(LANG_CODES.filter((c) => c !== DEFAULT_LANG))

// ── Guide collections (their words are in seo.json under guides.<kind>.items) ──

export const LEARNING_DIFFERENCES = [
  { slug: 'dyslexia', code: 'READ', wiki: 'https://en.wikipedia.org/wiki/Dyslexia' },
  { slug: 'adhd', code: 'FOCUS', wiki: 'https://en.wikipedia.org/wiki/Attention_deficit_hyperactivity_disorder' },
  { slug: 'dyscalculia', code: 'MATH', wiki: 'https://en.wikipedia.org/wiki/Dyscalculia' },
  { slug: 'dysgraphia', code: 'WRITE', wiki: 'https://en.wikipedia.org/wiki/Dysgraphia' },
  { slug: 'dyspraxia', code: 'MOVE', wiki: 'https://en.wikipedia.org/wiki/Developmental_coordination_disorder' },
  { slug: 'autism-spectrum', code: 'ASD', wiki: 'https://en.wikipedia.org/wiki/Autism' },
]

// audienceType feeds schema.org Audience.
export const AUDIENCES = [
  { slug: 'parents', code: 'HOME', audienceType: 'Parents' },
  { slug: 'teachers', code: 'CLASS', audienceType: 'Teachers' },
  { slug: 'tutors', code: 'TUTOR', audienceType: 'Private tutors and tuition centres' },
  { slug: 'schools', code: 'SCHOOL', audienceType: 'Schools' },
  { slug: 'ngos', code: 'ORG', audienceType: 'NGOs and organizations' },
  { slug: 'doctors', code: 'CLINIC', audienceType: 'Physicians' },
  { slug: 'therapists', code: 'CARE', audienceType: 'Therapists' },
]

// Gift and learning-tool guides (buyer-intent searches). difference links each
// one to its learning-difference guide.
export const LEARNING_TOOLS = [
  { slug: 'every-child', code: 'ALL' },
  { slug: 'dyslexia', code: 'READ', difference: 'dyslexia' },
  { slug: 'adhd', code: 'FOCUS', difference: 'adhd' },
  { slug: 'autism-spectrum', code: 'ASD', difference: 'autism-spectrum' },
  { slug: 'dyscalculia', code: 'MATH', difference: 'dyscalculia' },
  { slug: 'dysgraphia', code: 'WRITE', difference: 'dysgraphia' },
  { slug: 'dyspraxia', code: 'MOVE', difference: 'dyspraxia' },
  { slug: 'classroom', code: 'CLASS' },
]

// langs: the languages (besides English) a country guide is written in, the
// country's own. Every other language would only repeat the English page.
export const COUNTRIES = [
  { slug: 'united-states', code: 'US', langs: [] },
  { slug: 'united-kingdom', code: 'GB', langs: [] },
  { slug: 'india', code: 'IN', langs: [] },
  { slug: 'canada', code: 'CA', langs: ['fr'] },
  { slug: 'australia', code: 'AU', langs: [] },
  { slug: 'ireland', code: 'IE', langs: [] },
  { slug: 'new-zealand', code: 'NZ', langs: [] },
  { slug: 'south-africa', code: 'ZA', langs: [] },
  { slug: 'nigeria', code: 'NG', langs: [] },
  { slug: 'philippines', code: 'PH', langs: [] },
  { slug: 'singapore', code: 'SG', langs: [] },
  { slug: 'united-arab-emirates', code: 'AE', langs: [] },
  { slug: 'germany', code: 'DE', langs: ['de'] },
  { slug: 'austria', code: 'AT', langs: ['de'] },
  { slug: 'switzerland', code: 'CH', langs: ['de', 'fr', 'it'] },
  { slug: 'france', code: 'FR', langs: ['fr'] },
  { slug: 'belgium', code: 'BE', langs: ['fr', 'nl'] },
  { slug: 'netherlands', code: 'NL', langs: ['nl'] },
  { slug: 'spain', code: 'ES', langs: ['es'] },
  { slug: 'mexico', code: 'MX', langs: ['es'] },
  { slug: 'colombia', code: 'CO', langs: ['es'] },
  { slug: 'argentina', code: 'AR', langs: ['es'] },
  { slug: 'chile', code: 'CL', langs: ['es'] },
  { slug: 'italy', code: 'IT', langs: ['it'] },
  { slug: 'portugal', code: 'PT', langs: ['pt'] },
  { slug: 'brazil', code: 'BR', langs: ['pt'] },
  { slug: 'russia', code: 'RU', langs: ['ru'] },
  { slug: 'turkey', code: 'TR', langs: ['tr'] },
  { slug: 'china', code: 'CN', langs: ['zh'] },
  { slug: 'japan', code: 'JP', langs: ['ja'] },
  { slug: 'south-korea', code: 'KR', langs: ['ko'] },
  { slug: 'indonesia', code: 'ID', langs: ['id'] },
  { slug: 'vietnam', code: 'VN', langs: ['vi'] },
]

// ── Pages ──
// kind picks the structured data and the static body the build writes.
// parent is the breadcrumb parent. priority orders the sitemap and llms.txt.

const GUIDE_ROOTS = {
  differences: '/learning-differences',
  tools: '/learning-tools',
  audiences: '/who-we-help',
  countries: '/learning-support-by-country',
}

function buildPages() {
  const pages = [
    { path: '/', kind: 'start', langs: ALL, priority: 1 },
    { path: '/ai-teacher', kind: 'app', langs: ALL, priority: 0.9 },
    { path: '/games', kind: 'app', langs: ALL, priority: 0.8 },
    { path: '/ar-learning-games', kind: 'arGames', langs: ALL, priority: 0.8 },
    { path: '/home', kind: 'app', langs: ALL, priority: 0.6 },
    { path: '/subject/english', kind: 'subject', langs: ALL, priority: 0.7, parent: '/home' },
    { path: '/subject/maths', kind: 'subject', langs: ALL, priority: 0.7, parent: '/home' },
    { path: '/subject/science', kind: 'subject', langs: ALL, priority: 0.7, parent: '/home' },
    { path: GUIDE_ROOTS.differences, kind: 'guideIndex', guide: 'differences', langs: ALL, priority: 0.9 },
    ...LEARNING_DIFFERENCES.map((d) => ({
      path: `${GUIDE_ROOTS.differences}/${d.slug}`, kind: 'guide', guide: 'differences', item: d,
      langs: ALL, priority: 0.9, parent: GUIDE_ROOTS.differences,
    })),
    { path: GUIDE_ROOTS.tools, kind: 'guideIndex', guide: 'tools', langs: ALL, priority: 0.8 },
    ...LEARNING_TOOLS.map((t) => ({
      path: `${GUIDE_ROOTS.tools}/${t.slug}`, kind: 'guide', guide: 'tools', item: t,
      langs: ALL, priority: 0.8, parent: GUIDE_ROOTS.tools,
    })),
    { path: GUIDE_ROOTS.audiences, kind: 'guideIndex', guide: 'audiences', langs: ALL, priority: 0.8 },
    ...AUDIENCES.map((a) => ({
      path: `${GUIDE_ROOTS.audiences}/${a.slug}`, kind: 'guide', guide: 'audiences', item: a,
      langs: ALL, priority: 0.8, parent: GUIDE_ROOTS.audiences,
    })),
    { path: '/faq', kind: 'faq', langs: ALL, priority: 0.7 },
    { path: '/about-us', kind: 'about', langs: ALL, priority: 0.6 },
    { path: '/contact-us', kind: 'contact', langs: ALL, priority: 0.5 },
    { path: GUIDE_ROOTS.countries, kind: 'guideIndex', guide: 'countries', langs: [DEFAULT_LANG], priority: 0.6 },
    ...COUNTRIES.map((c) => ({
      path: `${GUIDE_ROOTS.countries}/${c.slug}`, kind: 'guide', guide: 'countries', item: c,
      langs: [DEFAULT_LANG, ...c.langs], priority: 0.6, parent: GUIDE_ROOTS.countries,
    })),
    { path: '/pricing', kind: 'pricing', langs: [DEFAULT_LANG], priority: 0.6 },
    { path: '/policy', kind: 'legal', langs: [DEFAULT_LANG], priority: 0.2 },
    { path: '/terms-and-conditions', kind: 'legal', langs: [DEFAULT_LANG], priority: 0.2 },
  ]
  return pages
}

export const PAGES = buildPages()
const BY_PATH = new Map(PAGES.map((p) => [p.path, p]))

export const GUIDES = {
  differences: { root: GUIDE_ROOTS.differences, items: LEARNING_DIFFERENCES },
  tools: { root: GUIDE_ROOTS.tools, items: LEARNING_TOOLS },
  audiences: { root: GUIDE_ROOTS.audiences, items: AUDIENCES },
  countries: { root: GUIDE_ROOTS.countries, items: COUNTRIES },
}

// ── The link graph ──
// Every public page links to the pages a reader of it is most likely to need
// next, across the clusters: a learning difference ↔ its tools and gift ideas ↔
// the adults who help ↔ the part of the app that practises it. The pages render
// these links ("Keep exploring"), and their JSON-LD lists them as relatedLink.

const D = (s) => `${GUIDE_ROOTS.differences}/${s}`
const T = (s) => `${GUIDE_ROOTS.tools}/${s}`
const A = (s) => `${GUIDE_ROOTS.audiences}/${s}`
const HUBS = [GUIDE_ROOTS.differences, GUIDE_ROOTS.tools, GUIDE_ROOTS.audiences, '/ai-teacher', '/games']

const RELATED = {
  '/': HUBS,
  '/home': ['/subject/english', '/subject/maths', '/subject/science', '/ai-teacher', '/games', T('every-child')],
  '/ai-teacher': ['/subject/maths', '/subject/science', '/subject/english', D('dyslexia'), A('parents'), A('teachers')],
  '/games': ['/ar-learning-games', D('adhd'), D('dyspraxia'), A('therapists'), T('adhd')],
  '/ar-learning-games': ['/games', D('dyspraxia'), D('adhd'), D('autism-spectrum'), A('therapists'), T('dyspraxia')],
  '/subject/english': [D('dyslexia'), D('dysgraphia'), T('dyslexia'), '/ai-teacher', '/subject/maths'],
  '/subject/maths': [D('dyscalculia'), T('dyscalculia'), '/ai-teacher', '/subject/science', A('tutors')],
  '/subject/science': ['/ai-teacher', '/subject/english', '/subject/maths', T('every-child'), A('teachers')],
  '/faq': [GUIDE_ROOTS.differences, GUIDE_ROOTS.tools, GUIDE_ROOTS.audiences, A('parents'), A('doctors'), '/contact-us'],
  '/about-us': [GUIDE_ROOTS.audiences, GUIDE_ROOTS.differences, '/faq', '/contact-us'],
  '/contact-us': [A('schools'), A('tutors'), A('ngos'), '/faq'],
  '/pricing': [A('parents'), A('teachers'), A('tutors'), A('schools'), '/faq'],
  [GUIDE_ROOTS.differences]: [GUIDE_ROOTS.tools, GUIDE_ROOTS.audiences, GUIDE_ROOTS.countries, '/faq'],
  [GUIDE_ROOTS.tools]: [GUIDE_ROOTS.differences, A('parents'), A('teachers'), '/games', '/ai-teacher'],
  [GUIDE_ROOTS.audiences]: [GUIDE_ROOTS.differences, GUIDE_ROOTS.tools, GUIDE_ROOTS.countries, '/pricing'],
  [GUIDE_ROOTS.countries]: [GUIDE_ROOTS.differences, GUIDE_ROOTS.tools, GUIDE_ROOTS.audiences],
  [D('dyslexia')]: [T('dyslexia'), '/subject/english', '/ai-teacher', A('parents'), A('teachers'), A('doctors')],
  [D('adhd')]: [T('adhd'), '/games', '/ar-learning-games', A('parents'), A('teachers'), A('doctors')],
  [D('dyscalculia')]: [T('dyscalculia'), '/subject/maths', '/ai-teacher', A('parents'), A('teachers'), A('tutors')],
  [D('dysgraphia')]: [T('dysgraphia'), '/subject/english', A('therapists'), A('parents'), A('teachers')],
  [D('dyspraxia')]: [T('dyspraxia'), '/ar-learning-games', A('therapists'), A('doctors'), A('parents')],
  [D('autism-spectrum')]: [T('autism-spectrum'), '/ar-learning-games', A('therapists'), A('doctors'), A('parents')],
  [T('every-child')]: ['/', '/ai-teacher', '/games', A('parents'), T('classroom'), GUIDE_ROOTS.differences],
  [T('dyslexia')]: [D('dyslexia'), '/subject/english', '/ai-teacher', A('parents'), T('dysgraphia')],
  [T('adhd')]: [D('adhd'), '/games', '/ar-learning-games', A('parents'), T('every-child')],
  [T('autism-spectrum')]: [D('autism-spectrum'), '/ar-learning-games', A('therapists'), A('parents'), T('every-child')],
  [T('dyscalculia')]: [D('dyscalculia'), '/subject/maths', A('parents'), A('tutors'), T('every-child')],
  [T('dysgraphia')]: [D('dysgraphia'), '/subject/english', A('therapists'), T('dyslexia'), T('dyspraxia')],
  [T('dyspraxia')]: [D('dyspraxia'), '/ar-learning-games', A('therapists'), T('dysgraphia'), T('every-child')],
  [T('classroom')]: [A('teachers'), A('schools'), A('tutors'), GUIDE_ROOTS.differences, T('every-child')],
  [A('parents')]: [T('every-child'), GUIDE_ROOTS.differences, '/ai-teacher', '/games', '/faq'],
  [A('teachers')]: [T('classroom'), A('schools'), A('tutors'), GUIDE_ROOTS.differences, '/ai-teacher'],
  [A('tutors')]: [A('teachers'), T('classroom'), '/subject/maths', '/subject/english', '/ai-teacher'],
  [A('schools')]: [A('teachers'), T('classroom'), A('ngos'), GUIDE_ROOTS.differences, '/pricing'],
  [A('ngos')]: [A('schools'), GUIDE_ROOTS.countries, GUIDE_ROOTS.differences, T('every-child')],
  [A('doctors')]: [A('therapists'), D('dyslexia'), D('adhd'), D('dyspraxia'), D('autism-spectrum'), '/ar-learning-games'],
  [A('therapists')]: [A('doctors'), '/ar-learning-games', D('dyspraxia'), D('autism-spectrum'), T('dyspraxia')],
}
const COUNTRY_RELATED = [GUIDE_ROOTS.differences, D('dyslexia'), GUIDE_ROOTS.tools, A('parents'), A('teachers'), A('schools')]

/**
 * The pages linked from `path`, as page records, limited to pages published in
 * `lang` (so a Spanish page links to Spanish pages).
 */
export function relatedPages(path, lang = DEFAULT_LANG) {
  const p = normalizePath(path)
  const page = pageFor(p)
  if (!page) return []
  const targets = RELATED[p] || (page.guide === 'countries' ? COUNTRY_RELATED : HUBS)
  return targets
    .map((t) => pageFor(t))
    .filter((t) => t && t.path !== p && t.langs.includes(lang))
}

export function pageFor(path) {
  return BY_PATH.get(normalizePath(path)) || null
}

/** Languages a path is published in (English only for unknown paths). */
export function langsFor(path) {
  return pageFor(path)?.langs || [DEFAULT_LANG]
}

export function normalizePath(path) {
  if (!path) return '/'
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, '')
  return clean || '/'
}

/** The URL path of `path` in `lang`: /faq → /es/faq, / → /es/. */
export function localizedPath(path, lang) {
  const p = normalizePath(path)
  if (!lang || lang === DEFAULT_LANG) return p
  return p === '/' ? `/${lang}/` : `/${lang}${p}`
}

export function absoluteUrl(path, lang) {
  return `${SITE_URL}${localizedPath(path, lang)}`
}

/** Splits a browser pathname into its language prefix (if any) and the app path. */
export function splitLocale(pathname) {
  const m = /^\/([a-z]{2})(?=\/|$)(.*)$/.exec(pathname || '/')
  if (m && PREFIXED.has(m[1])) return { lang: m[1], path: normalizePath(m[2] || '/') }
  return { lang: null, path: normalizePath(pathname) }
}

// ── Words ──

function isObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v)
}

/** Deep-merges a language's seo.json over the English one (English fills gaps). */
export function mergeSeo(base, over) {
  if (!isObject(over)) return base
  const out = { ...base }
  for (const [k, v] of Object.entries(over)) {
    out[k] = isObject(v) && isObject(base?.[k]) ? mergeSeo(base[k], v) : v
  }
  return out
}

export function fill(template, vars) {
  return String(template ?? '').replace(/\{\{(\w+)\}\}/g, (_, k) => (vars?.[k] ?? ''))
}

/** The H1 of a guide page: the item's own heading, or the guide's template. */
export function guideHeading(guide, item) {
  return item?.h1 || fill(guide?.itemH1, { name: item?.name })
}

/** Title and description of a page in a merged seo bundle. */
export function pageMeta(seo, path) {
  return seo?.pages?.[normalizePath(path)] || null
}

// ── Structured data (JSON-LD) ──

export const ORG_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`
export const APP_ID = `${SITE_URL}/#app`

/** Site-wide graph: who runs the site and what the product is. */
export function siteGraph(seo, lang = DEFAULT_LANG) {
  const s = seo?.site || {}
  return [
    {
      '@type': 'EducationalOrganization',
      '@id': ORG_ID,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png`, width: 1254, height: 514 },
      description: s.orgDescription,
      areaServed: 'Worldwide',
      knowsLanguage: LANG_CODES,
      contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', url: `${SITE_URL}/contact-us`, availableLanguage: LANG_CODES },
    },
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description: s.siteDescription,
      inLanguage: LANG_CODES,
      publisher: { '@id': ORG_ID },
    },
    {
      '@type': 'WebApplication',
      '@id': APP_ID,
      name: SITE_NAME,
      url: absoluteUrl('/', lang),
      description: s.appDescription,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Any (web browser)',
      browserRequirements: 'Requires JavaScript. Camera games need a webcam.',
      inLanguage: LANG_CODES,
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR', description: s.offer },
      audience: [
        { '@type': 'EducationalAudience', educationalRole: 'student' },
        { '@type': 'EducationalAudience', educationalRole: 'parent' },
        { '@type': 'EducationalAudience', educationalRole: 'teacher' },
      ],
      publisher: { '@id': ORG_ID },
    },
  ]
}

function breadcrumbs(seo, page, lang) {
  const trail = []
  for (let p = page; p; p = p.parent ? pageFor(p.parent) : null) trail.unshift(p)
  if (trail.length < 2 && page.path === '/') return null
  const items = [{ name: SITE_NAME, url: absoluteUrl('/', lang) }]
  for (const p of trail) {
    if (p.path === '/') continue
    const pl = p.langs.includes(lang) ? lang : DEFAULT_LANG
    items.push({ name: crumbName(seo, p), url: absoluteUrl(p.path, pl) })
  }
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  }
}

/** The short name of a page, for breadcrumbs and link lists. */
export function crumbName(seo, page) {
  if (page.kind === 'guide') return seo?.guides?.[page.guide]?.items?.[page.item.slug]?.name || page.item.slug
  if (page.kind === 'guideIndex') return seo?.ui?.nav?.[page.guide] || seo?.ui?.footer?.[page.guide] || seo?.guides?.[page.guide]?.h1 || page.path
  return seo?.pages?.[page.path]?.name || seo?.pages?.[page.path]?.h1 || page.path
}

/** The page's own JSON-LD graph, in `lang` (seo is that language's merged bundle). */
export function pageGraph(seo, path, lang) {
  const page = pageFor(path)
  if (!page) return null
  const meta = pageMeta(seo, page.path) || {}
  const url = absoluteUrl(page.path, lang)
  const related = relatedPages(page.path, lang).map((r) => absoluteUrl(r.path, lang))
  const base = {
    '@id': `${url}#webpage`,
    url,
    name: meta.title,
    description: meta.description,
    inLanguage: lang,
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORG_ID },
    ...(related.length ? { relatedLink: related } : {}),
  }
  const graph = []
  if (page.kind === 'guide') {
    const g = seo?.guides?.[page.guide] || {}
    const item = g.items?.[page.item.slug] || {}
    const diff = page.guide === 'tools' && page.item.difference
      ? LEARNING_DIFFERENCES.find((d) => d.slug === page.item.difference)
      : page.guide === 'differences' ? page.item : null
    const diffName = diff ? seo?.guides?.differences?.items?.[diff.slug]?.name : null
    const about = diff
      ? { '@type': 'Thing', name: diffName, sameAs: diff.wiki }
      : page.guide === 'countries'
        ? { '@type': 'Country', name: item.name }
        : undefined
    graph.push({
      ...base,
      '@type': 'WebPage',
      mainEntity: {
        '@type': 'Article',
        headline: guideHeading(g, item),
        description: item.issue,
        inLanguage: lang,
        about,
        audience: page.guide === 'audiences' ? { '@type': 'Audience', audienceType: page.item.audienceType } : undefined,
        author: { '@id': ORG_ID },
        publisher: { '@id': ORG_ID },
        mainEntityOfPage: url,
      },
    })
  } else if (page.kind === 'guideIndex') {
    const g = seo?.guides?.[page.guide] || {}
    graph.push({
      ...base,
      '@type': 'CollectionPage',
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: GUIDES[page.guide].items.map((it, i) => {
          const child = pageFor(`${page.path}/${it.slug}`)
          const cl = child.langs.includes(lang) ? lang : DEFAULT_LANG
          return { '@type': 'ListItem', position: i + 1, name: g.items?.[it.slug]?.name, url: absoluteUrl(child.path, cl) }
        }),
      },
    })
  } else if (page.kind === 'faq') {
    graph.push({
      ...base,
      '@type': 'FAQPage',
      mainEntity: (seo?.faq?.items || []).map((q) => ({
        '@type': 'Question',
        name: q.q,
        acceptedAnswer: { '@type': 'Answer', text: q.a },
      })),
    })
  } else {
    const type = { about: 'AboutPage', contact: 'ContactPage' }[page.kind] || 'WebPage'
    graph.push({ ...base, '@type': type, ...(page.kind === 'start' || page.kind === 'app' ? { about: { '@id': APP_ID } } : {}) })
  }
  const crumbs = breadcrumbs(seo, page, lang)
  if (crumbs) graph.push(crumbs)
  return { '@context': 'https://schema.org', '@graph': graph }
}
