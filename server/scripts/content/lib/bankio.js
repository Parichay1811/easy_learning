// Loads and saves the 12 question-bank files without reformatting them.
// The files come from two writers: Python's json.dump (English: indent 2, floats such as
// "mastery_weight": 1.0) and Node (maths/science: indent 1). We detect the indent and which
// keys hold integer-valued floats in the original text, and write the same way, so a diff
// only shows the fields that really changed.
const fs = require('fs')
const path = require('path')

const DATA_DIR = path.resolve(__dirname, '../../../data')
const SUBJECTS = [['english', 'english'], ['maths', 'math'], ['science', 'science']]
const MODULES = ['listen', 'read', 'write', 'speak']
// [subject, module, file]
const BANKS = []
for (const [subject, prefix] of SUBJECTS) for (const module of MODULES) BANKS.push({ subject, module, file: `${prefix}_${module}.json` })

function detectFormat(raw) {
  const m = raw.match(/^\{\n( +)"/)
  const indent = m ? m[1].length : 2
  // Keys whose integer values were written as floats ("1.0") by Python.
  const floatKeys = new Set()
  const intKeys = new Set()
  JSON.parse(raw, function reviver(key, value, ctx) {
    if (typeof value === 'number' && ctx && typeof ctx.source === 'string') {
      if (Number.isInteger(value) && /[.eE]/.test(ctx.source)) floatKeys.add(key)
      else if (Number.isInteger(value)) intKeys.add(key)
    }
    return value
  })
  if (!floatKeys.size && !intKeys.size) {
    // Node < 21 has no reviver source text: fall back to scanning for `"key": 1.0`.
    for (const m of raw.matchAll(/"([^"]+)": -?\d+\.0(?=[,\n])/g)) floatKeys.add(m[1])
  }
  for (const k of intKeys) floatKeys.delete(k)
  return { indent, floatKeys: [...floatKeys], trailingNewline: raw.endsWith('\n') }
}

function serialize(data, format) {
  let out = JSON.stringify(data, null, format.indent)
  for (const key of format.floatKeys) {
    const re = new RegExp(`("${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}": )(-?\\d+)(?=[,\\n])`, 'g')
    out = out.replace(re, '$1$2.0')
  }
  return out + (format.trailingNewline ? '\n' : '')
}

function loadBank(file) {
  const full = path.join(DATA_DIR, file)
  const raw = fs.readFileSync(full, 'utf8')
  return { file, full, raw, data: JSON.parse(raw), format: detectFormat(raw) }
}

function saveBank(bank) {
  const text = serialize(bank.data, bank.format)
  if (text !== bank.raw) fs.writeFileSync(bank.full, text)
  return text !== bank.raw
}

function loadAll() {
  return BANKS.map((b) => ({ ...b, ...loadBank(b.file) }))
}

module.exports = { DATA_DIR, BANKS, MODULES, loadBank, saveBank, loadAll, serialize, detectFormat }
