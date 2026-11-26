// Content v5: the clinician + educator review (docs/learning/TEACHING-STANDARDS.md), as patches.
// Each bank's reviewed fixes live in review-v5/<bank>.json:
//   [{ id, category, severity, problem, evidence, fix: { level, instruction, prompt, audio_text, options,
//      correct_answer, accepted_answers, hint, hints, picture, interaction, skill, sample_answer, exclude },
//      translations?: { <lang>: { <field>: value } } }]
// How a fix reaches every language of a translated (maths/science) item:
//   - level, picture, skill, exclude: the item itself (the same in every language);
//   - a value with no words (emoji, numerals, symbols, money tokens): the same in every language;
//   - words: English, plus `translations` for every language. Without them the fix is held back
//     (deferred) rather than leaving English and the other languages saying different things,
//     except accepted answers and hints, which each language keeps on its own (English may improve alone).
// "interaction": "letter_bank" turns a typed word into letter tiles, in each language from its own answer.
const fs = require('fs')
const path = require('path')

const DIR = path.resolve(__dirname, 'review-v5')
const LANGS = ['es', 'fr', 'pt', 'it', 'de', 'nl', 'ru', 'tr', 'zh', 'ja', 'ko', 'id', 'vi']
const TEXT_FIELDS = ['instruction', 'prompt', 'audio_text', 'options', 'correct_answer', 'accepted_answers', 'hints', 'sample_answer']
// Spell the picture's name with letter tiles (for science words, where spelling is not the point).
const TILES_INSTRUCTION = {
  en: 'Look at the picture. Tap the letters to spell its name.',
  es: 'Mira el dibujo. Toca las letras para escribir su nombre.',
  fr: "Regarde l'image. Touche les lettres pour écrire son nom.",
  pt: 'Olhe a figura. Toque nas letras para escrever o nome.',
  it: "Guarda l'immagine. Tocca le lettere per scrivere il nome.",
  de: 'Schau das Bild an. Tippe die Buchstaben für den Namen.',
  nl: 'Kijk naar het plaatje. Tik op de letters om de naam te maken.',
  ru: 'Посмотри на картинку. Нажимай буквы, чтобы написать название.',
  tr: 'Resme bak. Adını yazmak için harflere dokun.',
  zh: '看图片。点字来拼出它的名字。',
  ja: 'えを みてね。もじを タップして なまえを つくろう。',
  ko: '그림을 보세요. 글자를 눌러 이름을 만들어요.',
  id: 'Lihat gambarnya. Ketuk huruf untuk menulis namanya.',
  vi: 'Nhìn hình. Chạm vào các chữ để viết tên của nó.',
}

const hasWords = (v) => {
  const s = JSON.stringify(v ?? '').replace(/\[\[[mM]:[\d.]+\]\]/g, '').replace(/\\u[0-9a-f]{4}/gi, '')
  return /\p{L}{2,}/u.test(s.replace(/\p{Extended_Pictographic}/gu, ''))
}
const graphemes = (s) => (typeof Intl !== 'undefined' && Intl.Segmenter ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(String(s))].map((g) => g.segment) : [...String(s)])
// The answer's letters in a fixed jumbled order (the widget shuffles again on screen).
function tilesOf(word, seed) {
  const g = graphemes(String(word).trim()).filter((x) => x.trim())
  let h = 0
  for (const c of String(seed)) h = (h * 31 + c.codePointAt(0)) >>> 0
  const out = g.slice()
  for (let i = out.length - 1; i > 0; i--) { h = (h * 1103515245 + 12345) >>> 0; const j = h % (i + 1); [out[i], out[j]] = [out[j], out[i]] }
  return out
}

function setField(t, field, value) {
  if (field === 'hints') t.hints = [].concat(value)
  else if (field === 'sample_answer') t.speech_scoring = { ...(t.speech_scoring || {}), sample_answer: value }
  else t[field] = value
}

// Rules the review data must follow whatever a reviewer proposed (the bank's own invariants):
//   - everyday-pool items (*-E00-*) stay at level 0-1 (that is what the pool is);
//   - a picture-only prompt on a maths starter item is dropped: the audit counts the pictures as
//     the answer, and "See it with pictures" already draws the sum;
//   - an accepted answer the checker cannot read ("28-13=15, 15+6=21": two equations) is dropped.
function sanitize(r) {
  const fix = { ...(r.fix || {}) }
  if (/-E00-/.test(r.id)) delete fix.level
  // The maths stretch items (*-S06/S07/S08-*) are levels 6-8 by definition.
  if (/-S0[6-8]-/.test(r.id) && Number.isInteger(fix.level) && (fix.level < 6 || fix.level > 8)) delete fix.level
  if (/^MA-[A-Z]+-F00-/.test(r.id) && typeof fix.prompt === 'string' && /^\p{Extended_Pictographic}+$/u.test(fix.prompt.replace(/\s/g, ''))) delete fix.prompt
  if (Array.isArray(fix.accepted_answers)) fix.accepted_answers = fix.accepted_answers.filter((a) => !/=.*,.*=/.test(String(a)))
  return Object.keys(fix).length ? { ...r, fix } : null
}

function load() {
  if (!fs.existsSync(DIR)) return []
  const out = []
  for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.json')).sort()) {
    for (const r of JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'))) { const c = sanitize(r); if (c) out.push({ ...c, bank: f }) }
  }
  return out
}

// The bank's own translations of every English instruction, hint and option list, so a fix that
// reuses wording the bank already has reaches every language without new translation.
let knownCache = null
function known() {
  if (knownCache) return knownCache
  knownCache = new Map()
  const dataDir = path.resolve(__dirname, '../../data')
  for (const f of fs.readdirSync(dataDir).filter((x) => /^(math|science)_\w+\.json$/.test(x))) {
    for (const q of JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8')).questions) {
      if (!q.translations) continue
      for (const field of ['instruction']) {
        const en = q[field]
        if (typeof en !== 'string' || knownCache.has(`${field}|${en}`)) continue
        const tr = {}
        for (const l of LANGS) if (q.translations[l] && typeof q.translations[l][field] === 'string') tr[l] = q.translations[l][field]
        if (Object.keys(tr).length === LANGS.length) knownCache.set(`${field}|${en}`, tr)
      }
    }
  }
  return knownCache
}

const deferred = []
function toPatch(r) {
  const fix = { ...(r.fix || {}) }
  if (fix.hint !== undefined && fix.hints === undefined) { fix.hints = [fix.hint]; delete fix.hint }
  return {
    ids: [r.id],
    category: `v5_${r.category}`,
    severity: r.severity === 'blocking' ? 'blocking' : 'improve',
    reason: [r.problem, r.evidence].filter(Boolean).join(' '),
    apply(q, h) {
      if (fix.exclude) { h.exclude(q, r.problem); return }
      if (Number.isInteger(fix.level)) q.level = fix.level
      if (fix.skill) q.skill = fix.skill
      if (fix.picture) q.image = { ...(q.image || { mode: 'emoji', generation_prompt: null }), mode: 'emoji', emoji: fix.picture }
      const translated = !!q.translations
      const applied = new Set()
      for (const field of TEXT_FIELDS) {
        if (fix[field] === undefined) continue
        const neutral = !hasWords(fix[field])
        const tr = { ...(r.translations || {}) }
        const reuse = known().get(`${field}|${fix[field]}`)
        if (reuse) for (const l of LANGS) tr[l] = { ...(tr[l] || {}), ...(tr[l] && tr[l][field] !== undefined ? {} : { [field]: reuse[l] }) }
        if (translated && !neutral && !LANGS.every((l) => !q.translations[l] || (tr[l] && tr[l][field] !== undefined))) {
          // Extra accepted answers and better hints are each language's own: English can
          // improve on its own. Anything learners see side by side waits for its translations.
          if (field === 'accepted_answers' || field === 'hints') { setField(q, field, fix[field]); applied.add(field); continue }
          deferred.push(`${r.id} ${field}`)
          continue
        }
        h.forEachLang(q, (t, lang) => setField(t, field, lang === 'en' || neutral ? fix[field] : tr[lang][field]))
        applied.add(field)
      }
      // New options or a new key: the answer, the accepted answers and the old tile lists follow.
      if ((applied.has('options') || applied.has('correct_answer')) && !applied.has('accepted_answers')) {
        const neutralOptions = applied.has('options') && !hasWords(fix.options)
        h.forEachLang(q, (t, lang) => {
          // Options with no words are the same in every language, so the key is too.
          if (lang !== 'en' && neutralOptions && !applied.has('correct_answer')) t.correct_answer = q.correct_answer
          const ca = lang === 'en' ? q.correct_answer : (t.correct_answer ?? q.correct_answer)
          if (typeof ca === 'string') t.accepted_answers = [ca]
          else if ('accepted_answers' in t) delete t.accepted_answers
        })
      }
      if (applied.has('options')) for (const k of ['letter_tiles', 'word_tiles', 'number_tiles']) delete q[k]
      if (fix.interaction === 'drag_to_blank') {
        // Drag one choice into the gap (symbols such as < > =): no symbol keyboard needed.
        q.interaction = 'drag_to_blank'
        h.forEachLang(q, (t) => { if (typeof (t.correct_answer ?? q.correct_answer) === 'string') t.accepted_answers = [String(t.correct_answer ?? q.correct_answer)] })
      }
      if (fix.interaction === 'letter_bank') {
        q.interaction = 'letter_bank'
        q.validation = { ...(q.validation || {}), method: 'text', tiles: true, spelling_strict: false }
        h.forEachLang(q, (t, lang) => {
          const answer = String(t.correct_answer ?? q.correct_answer)
          t.options = tilesOf(answer, q.id)
          t.accepted_answers = [answer]
          if (TILES_INSTRUCTION[lang] && fix.instruction === undefined) t.instruction = TILES_INSTRUCTION[lang]
        })
      }
    },
  }
}

const patches = load().map(toPatch)
// Reviewed checking rules (speech keywords, numbers), applied after rules.js derives the defaults.
const validationOverrides = new Map(load().filter((r) => r.fix && r.fix.validation).map((r) => [r.id, r.fix.validation]))
module.exports = { patches, deferred, validationOverrides, load, tilesOf, hasWords, TILES_INSTRUCTION }
