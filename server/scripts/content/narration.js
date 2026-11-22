#!/usr/bin/env node
// Narration scripts for every question (content v4). Re-runnable and idempotent.
//
//   node scripts/content/narration.js --from <dir>   merge authored English scripts from <dir>/<bankfile>.json
//                                                     ({ "<id>": { "text", "style" } }) into the repo store
//                                                     scripts/content/narration/authored/<bankfile>.json, after
//                                                     checking every rule; then rebuild the bank files
//   node scripts/content/narration.js                rebuild only (same as derive-metadata.js)
//   node scripts/content/narration.js --report       coverage per language (authored / templated / reviewed)
//   add --dry to write nothing.
//
// What ends up in the bank (derive-metadata.js calls applyNarration() for every served question):
//   q.narration                    English: the authored script (status authored, or reviewed once a person has
//                                  checked it), else a templated one (status templated)
//   q.translations[lang].narration every translated language: templated from server/data/narration-phrases.json
//                                  (intro + the item's own translated instruction / prompt / options + outro),
//                                  the first variant that passes every rule (lib/narration-rules.js)
// English-subject questions are not translated (they teach English), so they carry English narration only.
const fs = require('fs')
const path = require('path')
const { checkNarration, ctxOf, stripPicto, wordCount, STYLES } = require('./lib/narration-rules')
const { applyQuestionTranslation } = require('../../utils/applyQuestionTranslation')

const PHRASES_FILE = path.resolve(__dirname, '../../data/narration-phrases.json')
const AUTHORED_DIR = path.resolve(__dirname, 'narration/authored')
const LANGS = ['es', 'fr', 'pt', 'it', 'de', 'nl', 'ru', 'tr', 'zh', 'ja', 'ko', 'id', 'vi']
const CHOICE = new Set(['tap_mcq', 'true_false', 'drag_to_blank', 'multi_select'])
const PICTO = /\p{Extended_Pictographic}/u
const clone = (x) => JSON.parse(JSON.stringify(x))

let phrasesCache = null
function phrases() {
  if (!phrasesCache) phrasesCache = JSON.parse(fs.readFileSync(PHRASES_FILE, 'utf8'))
  return phrasesCache
}

// Deterministic small hash of the id: picks the intro/outro variant (same index in every language).
function hash(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.codePointAt(0)) >>> 0; return h }

// Style for an item without an authored script.
function deriveStyle(q, module) {
  if (q.everyday) return 'curious'
  if ((q.level || 0) >= 6 || q.stage === 5) return 'challenge'
  if (module === 'listen') return 'calm'
  if (/story|word_problem|two_step|passage|multistep/.test(String(q.question_type))) return 'story'
  if (q.stage === 4) return 'detective'
  if (q.stage === 3) return 'adventure'
  if (q.stage === 1) return 'calm'
  return 'curious'
}

const endWith = (s, P) => { const t = String(s).trim(); return !t ? '' : /[.?!。？！…:;]$/u.test(t) ? t : t + P.end }

// The pieces a templated narration may use, in this language.
function pieces(qL, lang, { module, subject }) {
  const P = phrases().languages[lang]
  const it = qL.interaction
  const instruction = endWith(String(qL.instruction || '').replace(/\s+/g, ' '), P)
  let prompt = ''
  if ((module === 'write' || module === 'speak') && !(subject === 'english' && module === 'write') && typeof qL.prompt === 'string') {
    const p = qL.prompt.replace(/\s+/g, ' ').trim()
    if (p && !PICTO.test(p) && /[\p{L}\p{N}]/u.test(p) && !/[|→]|->/.test(p)) {
      let withGap = p.replace(/\s*_{2,}\s*/g, (m) => (/^\s/.test(m) && P.join ? ' … ' : '…')).replace(/\s+([.?!。？！])/gu, '$1').replace(/…[.。]/g, '…').trim()
      if (!P.join && withGap.endsWith('…')) withGap += P.end
      prompt = endWith(withGap.charAt(0).toLocaleUpperCase(lang) + withGap.slice(1), P)
    }
  }
  let options = ''
  if (CHOICE.has(it) && it !== 'true_false' && module !== 'listen' && module !== 'read' && Array.isArray(qL.options) && qL.options.length > 1) {
    const texts = qL.options.map((o) => (typeof o === 'string' ? stripPicto(o) : ''))
    if (texts.every((t) => t && !PICTO.test(t))) {
      const multi = it === 'multi_select'
      const last = multi ? P.options.last_multi : P.options.last
      const list = texts.length === 1 ? texts[0] : texts.slice(0, -1).join(P.options.sep) + last + texts[texts.length - 1]
      options = (multi ? P.options.frame_multi : P.options.frame).replace('{list}', list)
    }
  }
  return { P, instruction, prompt, options, read: module === 'read' ? P.read : '' }
}

// Templated narration for one question in one language (qL = the question in that language).
function buildTemplated(qL, lang, { style, module, subject, baseInstruction, id }) {
  const { P, instruction, prompt, options, read } = pieces(qL, lang, { module, subject })
  const S = P.styles[style]
  const k = hash(id || qL.id)
  const intro = S.intros[k % S.intros.length]
  const outro = S.outros[k % S.outros.length]
  const join = (parts) => parts.filter(Boolean).join(P.join)
  const candidates = [
    [intro, instruction, prompt, options, read, outro],
    [intro, instruction, prompt, options, read],
    [intro, instruction, prompt, read],
    [intro, instruction, options, read],
    [intro, instruction, read, outro],
    [intro, instruction, read],
    [instruction, read],
    [intro, read, P.fallback],
    [P.fallback],
  ]
  const seen = new Set()
  for (const c of candidates) {
    const text = join(c)
    if (!text || seen.has(text)) continue
    seen.add(text)
    const n = { text, style, v: 1, status: 'templated' }
    if (!checkNarration(qL, n, { lang, module, subject, baseInstruction }).length) return n
  }
  throw new Error(`${qL.id} ${lang}: no templated narration passes the rules`)
}

// ── Authored English scripts (repo store) ──
let authoredCache = null
function loadAuthored() {
  if (authoredCache) return authoredCache
  authoredCache = {}
  if (fs.existsSync(AUTHORED_DIR)) for (const f of fs.readdirSync(AUTHORED_DIR).filter((x) => x.endsWith('.json')).sort()) {
    Object.assign(authoredCache, JSON.parse(fs.readFileSync(path.join(AUTHORED_DIR, f), 'utf8')))
  }
  return authoredCache
}
function resetCaches() { authoredCache = null; phrasesCache = null }

// Writes narration onto a (served) bank question: English + every translation.
// spec = the new-item spec (everyday items carry their own English script).
function applyNarration(q, { subject, module, spec } = {}) {
  const ctx = ctxOf(q, { subject, module })
  const store = loadAuthored()[q.id]
  const own = store || (spec && spec.narration ? { ...spec.narration, status: spec.narration.status || 'authored' } : null)
  let en = null
  if (own && own.text) {
    const cand = { text: own.text.trim(), style: own.style, v: 1, status: own.status || 'authored' }
    // An authored script that breaks a rule is never served: it falls back to a templated one
    // (narration.js --from reports it, and the store only ever holds scripts that passed).
    if (!checkNarration(q, cand, { lang: 'en', ...ctx }).length) en = cand
  }
  const style = en ? en.style : deriveStyle(q, ctx.module)
  if (!en) en = buildTemplated(q, 'en', { style, ...ctx, baseInstruction: q.instruction, id: q.id })
  q.narration = en
  if (q.translations) for (const lang of LANGS) {
    const t = q.translations[lang]
    if (!t) continue
    delete t.narration
    const qL = applyQuestionTranslation(clone(q), lang)
    t.narration = buildTemplated(qL, lang, { style, ...ctx, baseInstruction: q.instruction, id: q.id })
  }
  return q
}
function clearNarration(q) {
  delete q.narration
  if (q.translations) for (const lang of Object.keys(q.translations)) if (q.translations[lang]) delete q.translations[lang].narration
}

// ── Merge authored scripts from the writers' folder into the repo store ──
function merge(fromDir, { banks, dry = false, storeDir = AUTHORED_DIR } = {}) {
  const { loadAll } = require('./lib/bankio')
  banks = banks || loadAll()
  const report = { files: 0, accepted: 0, unchanged: 0, rejected: [], unknown: [], excluded: [] }
  if (!dry) fs.mkdirSync(storeDir, { recursive: true })
  for (const b of banks) {
    const src = path.join(fromDir, b.file)
    if (!fs.existsSync(src)) continue
    report.files++
    const incoming = JSON.parse(fs.readFileSync(src, 'utf8'))
    const storeFile = path.join(storeDir, b.file)
    const store = fs.existsSync(storeFile) ? JSON.parse(fs.readFileSync(storeFile, 'utf8')) : {}
    const byId = new Map(b.data.questions.map((q) => [q.id, q]))
    for (const [id, entry] of Object.entries(incoming)) {
      const q = byId.get(id)
      if (!q) { report.unknown.push(`${b.file} ${id}`); continue }
      if (q.qa && q.qa.status === 'excluded') { report.excluded.push(id); continue }
      const text = String((entry && entry.text) || '').trim()
      const cand = { text, style: entry && entry.style, v: 1, status: 'authored' }
      const problems = checkNarration(q, cand, { lang: 'en', subject: b.subject, module: b.module })
      if (problems.length) { report.rejected.push(`${id}: ${problems.join('; ')}`); delete store[id]; continue }
      const prev = store[id]
      const status = prev && prev.text === text && prev.status === 'reviewed' ? 'reviewed' : 'authored'
      if (prev && prev.text === text && prev.style === cand.style && prev.status === status) { report.unchanged++; continue }
      store[id] = { text, style: cand.style, status }
      report.accepted++
    }
    const sorted = Object.fromEntries(Object.keys(store).sort().map((k) => [k, store[k]]))
    if (!dry) fs.writeFileSync(storeFile, JSON.stringify(sorted, null, 1) + '\n')
  }
  resetCaches()
  return report
}

// Coverage: per language, how many served items have authored / templated / reviewed narration.
function coverage(banks) {
  const out = { en: { authored: 0, templated: 0, reviewed: 0, missing: 0 } }
  for (const l of LANGS) out[l] = { authored: 0, templated: 0, reviewed: 0, missing: 0 }
  const bySubject = {}
  for (const b of banks) for (const q of b.data.questions) {
    if (q.qa && q.qa.status === 'excluded') continue
    const s = (bySubject[b.subject] = bySubject[b.subject] || { authored: 0, templated: 0, reviewed: 0, missing: 0 })
    const st = q.narration && q.narration.status
    out.en[st || 'missing']++
    s[st || 'missing']++
    if (q.translations) for (const l of LANGS) out[l][(q.translations[l] && q.translations[l].narration && q.translations[l].narration.status) || 'missing']++
  }
  return { byLang: out, englishBySubject: bySubject }
}

// Exported before the CLI block: the CLI requires derive-metadata.js, which requires this file.
module.exports = { applyNarration, clearNarration, buildTemplated, deriveStyle, merge, coverage, loadAuthored, resetCaches, phrases, LANGS, STYLES, wordCount }

if (require.main === module) {
  const args = process.argv.slice(2)
  const dry = args.includes('--dry')
  const from = args.includes('--from') ? path.resolve(args[args.indexOf('--from') + 1]) : null
  if (from) {
    const r = merge(from, { dry })
    console.log(`Merged authored narration from ${from}: ${r.files} file(s), ${r.accepted} new/changed, ${r.unchanged} unchanged, ${r.rejected.length} rejected, ${r.unknown.length} unknown id(s), ${r.excluded.length} for excluded items (skipped).`)
    for (const x of r.rejected) console.log(`  REJECTED ${x}`)
    for (const x of r.unknown) console.log(`  UNKNOWN ${x}`)
  }
  const { run } = require('./derive-metadata')
  const { banks, wouldChange, changed } = run({ dry })
  console.log(dry ? `Dry run: bank files that would change: ${wouldChange.length ? wouldChange.join(', ') : 'nothing'}` : `Rebuilt narration: wrote ${changed} bank file(s).`)
  const c = coverage(banks)
  console.log('Narration coverage (served items):')
  for (const [l, v] of Object.entries(c.byLang)) console.log(`  ${l.padEnd(3)} authored ${String(v.authored).padStart(4)}  reviewed ${String(v.reviewed).padStart(3)}  templated ${String(v.templated).padStart(4)}  missing ${v.missing}`)
  if (args.includes('--report')) console.log('English by subject:', JSON.stringify(c.englishBySubject))
}

