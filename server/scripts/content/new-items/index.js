// All new (v3) items by bank file: level-0 foundation items for every subject × mode, and the
// level 6-8 maths stretch set. Each entry: { spec, question } (question = full bank shape).
const { buildItem, translationIndex } = require('./build')

const SOURCES = [
  require('./foundation-english'),
  require('./foundation-maths'),
  require('./foundation-science'),
]
let stretch = null
try { stretch = require('./stretch-maths') } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e }
if (stretch) SOURCES.push(stretch)

function buildNewItems(banks) {
  const idx = translationIndex(banks)
  const out = {}
  for (const src of SOURCES) {
    for (const [file, specs] of Object.entries(src)) {
      if (!Array.isArray(specs)) continue
      const bank = banks.find((b) => b.file === file)
      if (!bank) throw new Error(`new items for unknown bank ${file}`)
      out[file] = out[file] || []
      for (const spec of specs) out[file].push({ spec, question: buildItem(spec, { bank, idx }) })
    }
  }
  return out
}

module.exports = { buildNewItems }
