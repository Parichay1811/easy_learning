// The skill catalogue (server/data/skills.json: names, typical level and
// prerequisites). Optional: everything works without it, with names taken from
// the questions. Re-read when the file changes, so content updates need no restart.
const fs = require('fs')
const path = require('path')

const FILE = path.join(__dirname, '..', '..', 'data', 'skills.json')
let cache = { mtime: -1, catalog: null }

// Pure: build the lookup from the parsed JSON.
function buildCatalog(json) {
  const list = Array.isArray(json?.skills) ? json.skills : []
  const byId = new Map()
  for (const s of list) {
    if (!s || typeof s.id !== 'string') continue
    byId.set(s.id, {
      id: s.id,
      subject: s.subject || s.id.split('.')[0],
      name: typeof s.name === 'string' ? s.name : s.id,
      level: Number.isInteger(s.level) ? s.level : null,
      modes: Array.isArray(s.modes) ? s.modes : [],
      prerequisites: Array.isArray(s.prerequisites) ? s.prerequisites.filter((p) => typeof p === 'string') : [],
    })
  }
  // Skills that build on each one (for "next up").
  const next = new Map()
  for (const s of byId.values()) for (const p of s.prerequisites) { if (!next.has(p)) next.set(p, []); next.get(p).push(s.id) }
  return {
    size: byId.size,
    has: (id) => byId.has(id),
    get: (id) => byId.get(id) || null,
    name: (id, fallback) => byId.get(id)?.name || fallback || id,
    prerequisites: (id) => byId.get(id)?.prerequisites || [],
    nextSkills: (id) => next.get(id) || [],
    all: () => [...byId.values()],
  }
}

const EMPTY = buildCatalog(null)

function loadCatalog(file = FILE) {
  try {
    const { mtimeMs } = fs.statSync(file)
    if (cache.catalog && cache.mtime === mtimeMs && cache.file === file) return cache.catalog
    const catalog = buildCatalog(JSON.parse(fs.readFileSync(file, 'utf8')))
    cache = { mtime: mtimeMs, catalog, file }
    return catalog
  } catch {
    return EMPTY
  }
}

module.exports = { loadCatalog, buildCatalog, EMPTY }
