---
name: seo
description: Keep Learnigo findable in search engines and AI assistants worldwide. Use when adding or renaming a public page, guide, country or language; changing page titles, descriptions or the copy of the public pages; touching src/seo/, public/locales/*/seo.json, robots.txt, the sitemap or the Nginx config; or when asked to improve search ranking, reach, hreflang, structured data or indexing.
---

# SEO for www.learnigo.eu

Learnigo is for every learner (families, teachers, private tutors, schools,
organizations, doctors and therapists), designed with dyslexia, ADHD and other
learning differences in mind. Copy leads with broad terms ("learning games for
every child", "AI teacher") and keeps inclusive design as the differentiator.

## How it fits together

- `client/src/seo/registry.js`: the single source of truth. It holds every
  public page, the languages each one is published in, the guide collections
  (learning differences, learning tools and gift ideas, who we help, countries),
  the related-links graph (`RELATED`), and the JSON-LD builders.
- `client/public/locales/<lang>/seo.json`: the words for those pages in 14
  languages: titles, descriptions, guide copy, FAQ, AR games, footer and link
  labels. English is the fallback per key.
- `client/scripts/seo-prerender.mjs` (Vite build plugin) writes one static HTML
  file per page and language (`dist/faq/index.html`, `dist/es/faq/index.html`,
  `dist/es/index.html`) with title, description, canonical, hreflang, Open Graph,
  JSON-LD and the real content. It also writes `dist/spa.html` (the app shell for
  every other route), `dist/sitemap.xml` (with hreflang alternates) and
  `dist/llms.txt`.
  **The build fails if a page is listed in a language whose seo.json doesn't
  translate it.** That failure is deliberate: hreflang must never point at a
  missing translation.
- URLs: English has no prefix; other languages use `/es/…`, `/de/…`, with the
  start page at `/es/`. The router runs under the prefix as its basename
  (`src/seo/routeLocale.js`). `<Link to="/faq">` stays correct on every language.
- `components/SEO/SEO.jsx`: public pages pass only `path`; the component reads
  the words from seo.json and the languages from the registry.
  `components/SEO/ExploreLinks.jsx` renders the related links.
- Nginx (see `DEPLOY.md`): `try_files $uri $uri/ /spa.html`, gzip for JS, CSS
  and JSON, and a one-year cache for `/assets/`.

## Recipes

**New public page**
1. Add it to `buildPages()` in `registry.js` with `kind`, `langs` and `priority`.
2. Add its `pages["/path"]` title (about 50–60 characters, CJK about 30) and
   description (120–160 characters, CJK 60–95) to `en/seo.json`, plus every
   language you list.
3. Give it 4–6 entries in `RELATED`, and link to it from 2–3 related pages.
4. In the page component, render `<SEO path="/path" />` and, for content pages,
   `<ExploreLinks path="/path" />`.

**New guide item** (a learning difference, tool guide, audience or country)
1. Add the slug to its list in `registry.js`.
2. Add the copy to `guides.<guide>.items.<slug>` (name, issue, context,
   3–6 approach lines, optional note or h1) and to `pages[...]`, in every
   language it is published in.
3. Wire up `RELATED`.
4. Countries are published in English plus the country's own languages
   (`langs`).

**New language**
1. Add it to `LANGUAGES` in `registry.js`, `SUPPORTED_LANGUAGES` in
   `src/i18n/i18n.js`, and the switcher list.
2. Translate `translation.json` and `seo.json`. Write for local search terms,
   not word for word, and keep `{{name}}` and `{{code}}`.

**Changing copy:** edit seo.json in every language, or say which ones still
need translating. Don't add medical claims. Learnigo is never "diagnostic" or
"treatment", and the tools guides name types of products, never brands.

## Check before shipping

```bash
npm run build --prefix client          # fails on missing translations
ls client/dist/es/learning-differences/dyslexia/index.html
grep -c "<url>" client/dist/sitemap.xml
```

Open a built page and check: one `<h1>`, the canonical is its own URL,
hreflang lists every language plus x-default, and the JSON-LD parses.

## After deploying

```bash
curl -s https://www.learnigo.eu/es/faq | grep -o '<title>[^<]*'     # static HTML is live
npm run seo:indexnow --prefix client                                  # ping Bing, Yandex, Naver, Seznam
```

Google picks up `sitemap.xml` from robots.txt. Resubmit it in Search Console
after big changes.
