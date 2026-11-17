/**
 * Serves the AI voice assistant's browser app at /ai-assistant/ as part of this
 * site.
 *
 * The assistant (server/ai-assistant/) is one module with two halves:
 *   - its API runs inside the Express server at /api/ai-assistant/*,
 *   - its browser app is plain ES modules (no bundling needed) in
 *     server/ai-assistant/public/ plus the code it shares with the server in
 *     server/ai-assistant/shared/.
 *
 * Those browser files stay next to the server code that reads them (the server
 * loads the simulation files for their metadata), so instead of copying them
 * into client/public/ this plugin maps them into the site:
 *   - `vite` (dev): served straight from the source folders, so edits show on
 *     reload,
 *   - `vite build`: copied into dist/ai-assistant/, so Nginx serves them like
 *     any other static file and only /api/ is proxied to Express.
 *
 * What it uses from the client (GSAP, the world-atlas map data and the site's
 * Fredoka typeface) are client dependencies, mapped in from client/node_modules.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const CLIENT = path.resolve(HERE, '..')
const ASSISTANT = path.resolve(CLIENT, '..', 'server', 'ai-assistant')
const BASE = '/ai-assistant/'

// [URL prefix under BASE, source folder, files to ship in a build (null = all)]
const MOUNTS = [
  ['vendor/gsap/', path.join(CLIENT, 'node_modules', 'gsap', 'dist'), ['gsap.min.js', 'Flip.min.js']],
  ['vendor/world/', path.join(CLIENT, 'node_modules', 'world-atlas'), ['countries-110m.json', 'countries-50m.json']],
  // The site's own typeface, so the assistant reads as part of the same site.
  ['vendor/fredoka/', path.join(CLIENT, 'node_modules', '@fontsource', 'fredoka', 'files'),
    [400, 500, 600, 700].flatMap((w) => [`fredoka-latin-${w}-normal.woff2`, `fredoka-latin-ext-${w}-normal.woff2`])],
  ['shared/', path.join(ASSISTANT, 'shared'), null],
  ['', path.join(ASSISTANT, 'public'), null],
]
// Developer-only pages (render and simulation galleries): served in dev, not shipped.
const DEV_ONLY = new Set(['dev'])

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
}

// The file a request path maps to, or null.
function resolveFile(pathname) {
  let rel = pathname.slice(BASE.length)
  if (rel === '' || rel.endsWith('/')) rel += 'index.html'
  for (const [prefix, dir, only] of MOUNTS) {
    if (!rel.startsWith(prefix)) continue
    const name = rel.slice(prefix.length)
    if (only && !only.includes(name)) continue
    const file = path.join(dir, name)
    if (!file.startsWith(dir + path.sep)) return null
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return file
  }
  return null
}

function serve(req, res, file) {
  const size = fs.statSync(file).size
  const headers = {
    'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
    'Accept-Ranges': 'bytes',
  }
  // The 3D render loops are videos fetched in ranges; Safari needs this to play them.
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '')
  if (range) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]))
    const end = range[1] && range[2] ? Math.min(size - 1, Number(range[2])) : size - 1
    if (start >= size || start > end) {
      res.writeHead(416, { 'Content-Range': `bytes */${size}` })
      return res.end()
    }
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 })
    return fs.createReadStream(file, { start, end }).pipe(res)
  }
  res.writeHead(200, { ...headers, 'Content-Length': size })
  fs.createReadStream(file).pipe(res)
}

function copyDir(from, to, skip = new Set()) {
  fs.mkdirSync(to, { recursive: true })
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue
    const src = path.join(from, entry.name)
    const dest = path.join(to, entry.name)
    if (entry.isDirectory()) copyDir(src, dest)
    else if (entry.isFile()) fs.copyFileSync(src, dest)
  }
}

export default function aiAssistantStatic() {
  let outDir
  return {
    name: 'learnigo-ai-assistant-static',

    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = decodeURIComponent((req.url || '').split('?')[0])
        if (pathname === BASE.slice(0, -1)) {
          res.writeHead(301, { Location: BASE })
          return res.end()
        }
        if (!pathname.startsWith(BASE)) return next()
        const file = resolveFile(pathname)
        if (!file) {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          return res.end('Not found')
        }
        serve(req, res, file)
      })
    },

    closeBundle() {
      if (!outDir || !fs.existsSync(outDir)) return
      const target = path.join(outDir, 'ai-assistant')
      fs.rmSync(target, { recursive: true, force: true })
      for (const [prefix, dir, only] of [...MOUNTS].reverse()) {
        const dest = path.join(target, prefix)
        if (!fs.existsSync(dir)) {
          throw new Error(`AI assistant: ${dir} is missing (run npm install in client/)`)
        }
        if (only) {
          fs.mkdirSync(dest, { recursive: true })
          for (const name of only) fs.copyFileSync(path.join(dir, name), path.join(dest, name))
        } else copyDir(dir, dest, prefix === '' ? DEV_ONLY : undefined)
      }
    },
  }
}
