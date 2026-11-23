/**
 * Tells IndexNow search engines (Bing, Yandex, Naver, Seznam, Yep) that the
 * public pages changed, so they recrawl them now instead of on their own
 * schedule. Run after a deploy that changes public pages:
 *
 *   npm run seo:indexnow --prefix client            (every public URL)
 *   npm run seo:indexnow --prefix client -- /faq /es/faq   (just these paths)
 *
 * The key is the file public/<key>.txt, served at the site root, which proves
 * the site owns the key.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PAGES, SITE_URL, absoluteUrl } from '../src/seo/registry.js'

const PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')
const keyFile = fs.readdirSync(PUBLIC).find((f) => /^[0-9a-f]{32}\.txt$/.test(f))
if (!keyFile) throw new Error('No IndexNow key file (32 hex characters + .txt) in client/public/')
const key = fs.readFileSync(path.join(PUBLIC, keyFile), 'utf8').trim()

const args = process.argv.slice(2)
const urlList = args.length
  ? args.map((p) => new URL(p, SITE_URL).href)
  : PAGES.flatMap((page) => page.langs.map((lang) => absoluteUrl(page.path, lang)))

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(SITE_URL).host, key, keyLocation: `${SITE_URL}/${keyFile}`, urlList }),
})
console.log(`IndexNow: ${urlList.length} URLs → HTTP ${res.status} ${res.statusText}`)
if (!res.ok && res.status !== 202) {
  console.log(await res.text())
  process.exit(1)
}
