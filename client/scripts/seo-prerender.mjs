/**
 * Static HTML for every public page, in every language it is published in.
 *
 * The site is a client-rendered React app, so the HTML a crawler downloads is
 * the same empty shell for every URL. Google renders JavaScript, but Bing,
 * Yandex, Baidu, Naver and AI answer engines mostly read the HTML as served.
 * After `vite build`, this plugin writes, from src/seo/registry.js and
 * public/locales/<lang>/seo.json:
 *
 *   dist/<path>/index.html      one per page and language (/faq, /es/faq, /es/),
 *                               with its own title, description, canonical,
 *                               hreflang links, Open Graph tags and JSON-LD, and
 *                               the page's words inside #root (React replaces
 *                               them when it starts)
 *   dist/spa.html               the plain app shell, for every other route
 *                               (Nginx falls back to it; see DEPLOY.md)
 *   dist/sitemap.xml            every page and language, with hreflang alternates
 *   dist/llms.txt               a plain-text map of the site for AI assistants
 *
 * The build fails if a page is listed in a language whose seo.json does not
 * translate it, so hreflang never points at a missing translation.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  DEFAULT_LANG, GUIDES, LANGUAGES, PAGES, SITE_NAME, SITE_URL,
  absoluteUrl, crumbName, fill, guideHeading, localizedPath, mergeSeo, normalizePath,
  pageFor, pageGraph, pageMeta, relatedPages, siteGraph,
} from '../src/seo/registry.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const CLIENT = path.resolve(HERE, '..')

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const json = (data) => JSON.stringify(data).replace(/</g, '\\u003c')
const ogLocale = (lang) => LANGUAGES.find((l) => l.code === lang)?.ogLocale || 'en_US'
const native = (lang) => LANGUAGES.find((l) => l.code === lang)?.native || lang

// ── Words ──

function loadBundles(localesDir) {
  const raw = {}
  for (const { code } of LANGUAGES) {
    const file = path.join(localesDir, code, 'seo.json')
    raw[code] = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
  }
  const merged = {}
  for (const { code } of LANGUAGES) merged[code] = code === DEFAULT_LANG ? raw[code] : mergeSeo(raw[DEFAULT_LANG], raw[code])
  return { raw, merged }
}

/** Every (page, language) pair must be translated in that language's own file. */
function checkTranslations(raw) {
  const missing = []
  for (const page of PAGES) {
    for (const lang of page.langs) {
      const b = raw[lang] || {}
      const need = [[`pages.${page.path}`, b.pages?.[page.path]?.title && b.pages?.[page.path]?.description]]
      if (page.kind === 'guide') need.push([`guides.${page.guide}.items.${page.item.slug}`, b.guides?.[page.guide]?.items?.[page.item.slug]?.issue])
      if (page.kind === 'guide' || page.kind === 'guideIndex') need.push([`guides.${page.guide}.h1`, b.guides?.[page.guide]?.h1])
      if (page.kind === 'faq') need.push(['faq.items', b.faq?.items?.length])
      if (page.kind === 'arGames') need.push(['arGames.groups', b.arGames?.groups?.length])
      for (const [key, ok] of need) if (!ok) missing.push(`${lang}: ${key}`)
    }
  }
  if (missing.length) {
    throw new Error(`seo-prerender: these pages are listed in a language whose seo.json does not translate them (src/seo/registry.js):\n  ${missing.slice(0, 30).join('\n  ')}`)
  }
}

// ── The static page body ──

function link(p, lang, seo) {
  const pl = p.langs.includes(lang) ? lang : DEFAULT_LANG
  return `<a href="${esc(localizedPath(p.path, pl))}">${esc(crumbName(seo, p))}</a>`
}

function list(items) {
  return items.length ? `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>` : ''
}

function mainContent(page, lang, seo) {
  const meta = pageMeta(seo, page.path) || {}
  const ui = seo.ui || {}
  if (page.kind === 'guide') {
    const g = seo.guides[page.guide]
    const item = g.items[page.item.slug]
    return `<p class="lgs-eyebrow">${esc(fill(g.itemEyebrow, { code: page.item.code, name: item.name }))}</p>
<h1>${esc(guideHeading(g, item))}</h1>
<p class="lgs-lead">${esc(item.issue)}</p>
<h2>${esc(g.contextTitle)}</h2>
<p>${esc(item.context)}</p>
<h2>${esc(g.approachTitle)}</h2>
${list((item.approach || []).map(esc))}
<aside><strong>${esc(fill(g.noteTitle, { name: item.name }))}</strong><p>${esc(item.note || g.note || ui.note)}</p></aside>`
  }
  if (page.kind === 'guideIndex') {
    const g = seo.guides[page.guide]
    const cards = GUIDES[page.guide].items.map((it) => {
      const child = pageFor(`${page.path}/${it.slug}`)
      const item = g.items?.[it.slug]
      if (!item) return ''
      const cl = child.langs.includes(lang) ? lang : DEFAULT_LANG
      return `<h3><a href="${esc(localizedPath(child.path, cl))}">${esc(item.name)}</a></h3><p>${esc(item.issue)}</p>`
    })
    return `<p class="lgs-eyebrow">${esc(g.eyebrow)}</p>
<h1>${esc(g.h1)}</h1>
<p class="lgs-lead">${esc(g.lead)}</p>
<h2>${esc(g.introTitle)}</h2>
<p>${esc(g.intro)}</p>
<section aria-label="${esc(g.gridLabel)}">${cards.join('\n')}</section>`
  }
  if (page.kind === 'faq') {
    const f = seo.faq
    return `<h1>${esc(f.h1)}</h1>
<p class="lgs-lead">${esc(f.lead)}</p>
${(f.items || []).map((q) => `<h2>${esc(q.q)}</h2><p>${esc(q.a)}</p>`).join('\n')}`
  }
  if (page.kind === 'arGames') {
    const a = seo.arGames
    return `<p class="lgs-eyebrow">${esc(a.eyebrow)}</p>
<h1>${esc(a.h1)}</h1>
<p class="lgs-lead">${esc(a.lead)}</p>
<h2>${esc(a.howTitle)}</h2>
<p>${esc(a.how)}</p>
${list((a.groups || []).map((g) => `<strong>${esc(g.name)}</strong>: ${esc(g.blurb)}`))}
<h2>${esc(a.domainsTitle)}</h2>
<p>${esc(a.domains)}</p>
<aside><strong>${esc(a.noteTitle)}</strong><p>${esc(ui.note)}</p></aside>`
  }
  return `<h1>${esc(meta.h1 || meta.title)}</h1>
<p class="lgs-lead">${esc(meta.lead || meta.description)}</p>
${list((meta.points || []).map(esc))}`
}

function staticBody(page, lang, seo) {
  const ui = seo.ui || {}
  const nav = ['/learning-differences', '/learning-tools', '/who-we-help', '/ai-teacher', '/games', '/faq']
    .map((p) => pageFor(p)).filter(Boolean).map((p) => link(p, lang, seo))

  const trail = []
  for (let p = page.parent ? pageFor(page.parent) : null; p; p = p.parent ? pageFor(p.parent) : null) trail.unshift(p)
  const crumbs = page.path === '/' ? '' : `<nav class="lgs-crumbs" aria-label="${esc(ui.breadcrumb)}"><a href="${esc(localizedPath('/', lang))}">${SITE_NAME}</a>${trail.map((p) => ` › ${link(p, lang, seo)}`).join('')} › <span>${esc(crumbName(seo, page))}</span></nav>`

  const related = relatedPages(page.path, lang).map((p) => link(p, lang, seo))
  const otherLangs = page.langs.filter((l) => l !== lang)
    .map((l) => `<a href="${esc(localizedPath(page.path, l))}" hreflang="${l}" lang="${l}">${esc(native(l))}</a>`)
  const homes = LANGUAGES.filter((l) => l.code !== lang)
    .map((l) => `<a href="${esc(localizedPath('/', l.code))}" hreflang="${l.code}" lang="${l.code}">${esc(l.native)}</a>`)
  const more = [['/about-us', ui.footer?.about], ['/contact-us', ui.footer?.contact], ['/learning-support-by-country', ui.footer?.countries], ['/pricing', ui.footer?.pricing], ['/policy', ui.footer?.privacy], ['/terms-and-conditions', ui.footer?.terms]]
    .map(([p, label]) => { const pg = pageFor(p); const pl = pg.langs.includes(lang) ? lang : DEFAULT_LANG; return `<a href="${esc(localizedPath(p, pl))}">${esc(label)}</a>` })

  return `<div class="lgs" lang="${lang}">
<header class="lgs-head"><a class="lgs-brand" href="${esc(localizedPath('/', lang))}">${SITE_NAME}</a><nav>${nav.join(' ')}</nav></header>
<main>
${crumbs}
${mainContent(page, lang, seo)}
<p><a class="lgs-cta" href="${esc(localizedPath('/', lang))}">${esc(ui.openApp)} →</a></p>
${related.length ? `<nav aria-label="${esc(ui.explore)}"><h2>${esc(ui.explore)}</h2>${list(related)}</nav>` : ''}
</main>
<footer>
${otherLangs.length ? `<p><strong>${esc(ui.footer?.thisPage)}:</strong> ${otherLangs.join(' · ')}</p>` : ''}
<p><strong>${esc(ui.footer?.languages)}:</strong> ${homes.join(' · ')}</p>
<p>${more.join(' · ')}</p>
</footer>
</div>`
}

// Matches the app's dark navy page (src/index.css), so the hand-over to React is calm.
const CSS = `<style id="lgs-css">.lgs{max-width:960px;margin:0 auto;padding:20px 18px 48px;color:#e3ecf7;font:17px/1.65 Fredoka,system-ui,sans-serif}.lgs a{color:#7fd8e6}.lgs-head{display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;margin-bottom:18px}.lgs-head nav{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:.95rem}.lgs-brand{font-weight:700;font-size:1.4rem;text-decoration:none;color:#fff!important}.lgs h1{color:#fff;font-size:clamp(1.8rem,5vw,2.8rem);line-height:1.15;margin:.3em 0}.lgs h2,.lgs h3{color:#a8ecf5;margin-top:1.6em}.lgs-eyebrow{color:#ffd166;font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:.8rem}.lgs-lead{font-size:1.15rem;color:#f3f7fb}.lgs-crumbs{font-size:.9rem;color:#b9c7d8}.lgs aside{margin:1.5em 0;padding:14px 18px;background:rgba(245,159,0,.12);border-left:5px solid #f59f00}.lgs-cta{font-weight:700}.lgs footer{margin-top:2.5em;font-size:.92rem;color:#b9c7d8;border-top:1px solid rgba(255,255,255,.16);padding-top:1em}</style>`

// Removes the static body as the page starts if the URL is not this page's own
// (Nginx serving the file for another route), so it never flashes there.
const guard = (ownPath) => `<script>(function(){var p=location.pathname.replace(/\\/+$/,"")||"/";if(p!==${JSON.stringify(ownPath)}){var r=document.getElementById("root");if(r)r.textContent="";document.querySelectorAll('link[rel="canonical"],link[rel="alternate"][hreflang],script[data-learnigo-schema]').forEach(function(e){e.remove()})}})()</script>`

// ── HTML documents ──

function setMeta(html, attr, key, value) {
  const re = new RegExp(`<meta\\s+${attr}="${key.replace(/[:.]/g, '\\$&')}"\\s+content="[^"]*"\\s*/?>`)
  const tag = `<meta ${attr}="${key}" content="${esc(value)}" />`
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`)
}

function siteSchema(seo, lang) {
  return `<script type="application/ld+json" id="learnigo-site-schema">${json({ '@context': 'https://schema.org', '@graph': siteGraph(seo, lang) })}</script>`
}

function withSiteSchema(html, seo, lang) {
  return html.replace(/<script type="application\/ld\+json" id="learnigo-site-schema">[\s\S]*?<\/script>/, siteSchema(seo, lang))
}

function renderPage(template, page, lang, seo) {
  const meta = pageMeta(seo, page.path)
  const url = absoluteUrl(page.path, lang)
  let html = template.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`)
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`)
  html = setMeta(html, 'name', 'description', meta.description)
  html = setMeta(html, 'property', 'og:title', meta.title)
  html = setMeta(html, 'property', 'og:description', meta.description)
  html = setMeta(html, 'property', 'og:url', url)
  html = setMeta(html, 'property', 'og:locale', ogLocale(lang))
  html = setMeta(html, 'property', 'og:type', page.kind === 'guide' ? 'article' : 'website')
  html = setMeta(html, 'name', 'twitter:title', meta.title)
  html = setMeta(html, 'name', 'twitter:description', meta.description)
  html = withSiteSchema(html, seo, lang)

  const head = [`<link rel="canonical" href="${esc(url)}" />`]
  if (page.langs.length > 1) {
    for (const l of page.langs) head.push(`<link rel="alternate" hreflang="${l}" href="${esc(absoluteUrl(page.path, l))}" />`)
    head.push(`<link rel="alternate" hreflang="x-default" href="${esc(absoluteUrl(page.path, DEFAULT_LANG))}" />`)
  }
  head.push(`<script type="application/ld+json" data-learnigo-schema="true">${json(pageGraph(seo, page.path, lang))}</script>`)
  head.push(CSS)
  html = html.replace('</head>', `    ${head.join('\n    ')}\n  </head>`)

  const own = normalizePath(localizedPath(page.path, lang))
  return html.replace('<div id="root"></div>', `<div id="root">${staticBody(page, lang, seo)}</div>\n    ${guard(own)}`)
}

function outFile(dist, page, lang) {
  const rel = localizedPath(page.path, lang).replace(/^\/|\/$/g, '')
  return path.join(dist, rel, 'index.html')
}

// ── Sitemap and llms.txt ──

function gitDate(file) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], { cwd: CLIENT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    return out || null
  } catch {
    return null
  }
}

function sitemap(localesDir) {
  const today = new Date().toISOString().slice(0, 10)
  const lastmod = Object.fromEntries(LANGUAGES.map(({ code }) => {
    const dates = [gitDate(path.join(localesDir, code, 'seo.json')), gitDate(path.join(CLIENT, 'src', 'seo', 'registry.js'))].filter(Boolean).sort()
    return [code, dates.at(-1) || today]
  }))
  const urls = []
  for (const page of [...PAGES].sort((a, b) => b.priority - a.priority)) {
    for (const lang of page.langs) {
      const alts = page.langs.length > 1
        ? [...page.langs.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${esc(absoluteUrl(page.path, l))}"/>`),
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(absoluteUrl(page.path, DEFAULT_LANG))}"/>`].join('\n') + '\n'
        : ''
      urls.push(`  <url>\n    <loc>${esc(absoluteUrl(page.path, lang))}</loc>\n    <lastmod>${lastmod[lang]}</lastmod>\n${alts}  </url>`)
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`
}

function llmsTxt(seo) {
  const line = (p, text) => `- [${crumbName(seo, p)}](${absoluteUrl(p.path, DEFAULT_LANG)}): ${text}`
  const section = (title, guide) => {
    const g = seo.guides[guide]
    return [`## ${title}`, '', line(pageFor(GUIDES[guide].root), g.lead),
      ...GUIDES[guide].items.map((it) => line(pageFor(`${GUIDES[guide].root}/${it.slug}`), g.items[it.slug].issue)), ''].join('\n')
  }
  const app = ['/', '/ai-teacher', '/games', '/ar-learning-games', '/subject/english', '/subject/maths', '/subject/science', '/pricing', '/faq', '/about-us', '/contact-us']
    .map((p) => line(pageFor(p), pageMeta(seo, p).description))
  return [
    `# ${SITE_NAME}`,
    '',
    `> ${seo.site.siteDescription}`,
    '',
    `${seo.site.appDescription} ${seo.site.offer} It works in a web browser in ${LANGUAGES.length} languages (${LANGUAGES.map((l) => l.native).join(', ')}); every page below also exists in those languages under /<language>/ (for example ${absoluteUrl('/faq', 'es')}). ${seo.ui.note}`,
    '',
    '## The app',
    '',
    ...app,
    '',
    section('Learning differences', 'differences'),
    section('Learning tools and gift ideas', 'tools'),
    section('Who Learnigo helps', 'audiences'),
    section('Learning support by country', 'countries'),
    '## Questions and answers',
    '',
    ...(seo.faq.items || []).map((q) => `- ${q.q} ${q.a}`),
    '',
  ].join('\n')
}

// ── Plugin ──

export default function seoPrerender() {
  let outDir
  return {
    name: 'learnigo-seo-prerender',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const indexFile = path.join(outDir, 'index.html')
      if (!fs.existsSync(indexFile)) return
      const localesDir = path.join(CLIENT, 'public', 'locales')
      const { raw, merged } = loadBundles(localesDir)
      checkTranslations(raw)

      const template = fs.readFileSync(indexFile, 'utf8')
      if (!template.includes('<div id="root"></div>')) throw new Error('seo-prerender: index.html has no empty <div id="root"></div>')

      // The app shell for every other route (dashboards, games, tutor pages…).
      fs.writeFileSync(path.join(outDir, 'spa.html'), withSiteSchema(template, merged[DEFAULT_LANG], DEFAULT_LANG))

      let count = 0
      for (const page of PAGES) {
        for (const lang of page.langs) {
          const file = outFile(outDir, page, lang)
          fs.mkdirSync(path.dirname(file), { recursive: true })
          fs.writeFileSync(file, renderPage(template, page, lang, merged[lang]))
          count++
        }
      }
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap(localesDir))
      fs.writeFileSync(path.join(outDir, 'llms.txt'), llmsTxt(merged[DEFAULT_LANG]))
      console.log(`seo-prerender: ${count} pages in ${LANGUAGES.length} languages, sitemap.xml, llms.txt`)
    },
  }
}
