// Content v5: money in the learner's own currency (docs/learning/TEACHING-STANDARDS.md "Regional rules").
// The bank wrote amounts in UK pence and pounds in every language ("20 Pence", "20ペンス").
// These patches write them as tokens ([[m:20]] = 20 of the small unit, [[M:45]] = 45 of the main
// unit) in English and every translation; server/utils/currency.js fills them in per learner.
// Re-runnable: tokens are never touched again; only amounts still written the old way change.

// Main unit: a symbol before the number, or the number then the currency's name in that language.
const MAJOR_WORDS = 'pounds?|libras?|livres?|sterline|sterlina|Pfund|pond|фунт(?:ов|а)?|pound|英镑|ポンド|파운드|bảng'
// Small unit: "20p", "20 pence", "20 Pence", "20 peniques", "20 pensi", "20 пенсов", "20ペンス", "20펜스", "20便士", "20 xu".
const MINOR_WORDS = 'pence|penny|peniques|penique|pensi|pens|peni|пенсов|пенса|пенни|ペンス|펜스|便士|xu'
const NUM = '(\\d+(?:[.,]\\d{1,2})?)'
const toNum = (n) => String(Number(String(n).replace(',', '.')))

// German compounds: "10-Pence-Münzen" (the filler writes "10-Cent-Münzen").
const DE_COMPOUND = new RegExp(`${NUM}-(?:Pence|Pfund)(?=-)`, 'g')

function tokenize(s, lang) {
  // Tokens already there stay as they are (their digits sit between [[ and ]], so no pattern below
  // matches them); any amount still written the old way is converted.
  if (typeof s !== 'string' || !s) return s
  let out = s
    .replace(DE_COMPOUND, (m, n) => (/Pfund/.test(m) ? `[[M:${toNum(n)}]]` : `[[m:${toNum(n)}]]`))
    .replace(new RegExp(`£\\s?${NUM}`, 'g'), (_, n) => `[[M:${toNum(n)}]]`)
    .replace(new RegExp(`${NUM}\\s?(?:${MAJOR_WORDS})(?![A-Za-zÀ-ɏА-яЁё])`, 'giu'), (_, n) => `[[M:${toNum(n)}]]`)
    .replace(new RegExp(`${NUM}\\s?(?:${MINOR_WORDS})(?![A-Za-zÀ-ɏА-яЁё])`, 'giu'), (_, n) => `[[m:${toNum(n)}]]`)
    // "17p", "20p-Münzen", "8p'ye": a number with a bare p (not a word starting with p).
    .replace(new RegExp(`${NUM}p(?![A-Za-zÀ-ɏА-яЁё])`, 'gu'), (_, n) => `[[m:${toNum(n)}]]`)
  // Vietnamese "đồng xu" is "coin"; the bare "đồng" before an amount meant a coin too.
  if (lang === 'vi') out = out.replace(/đồng \[\[m:/g, 'đồng xu [[m:')
  return out
}
// Amounts said as words in sample answers and feedback ("fifteen pence is bigger").
const SPOKEN_AMOUNTS = {
  'MA-SPK-T06-Q07': { en: /fifteen pence/i, es: /quince peniques/i, fr: /quinze pence/i, pt: /quinze pence/i, it: /quindici pence/i, de: /fünfzehn Pence/i, nl: /vijftien pence/i, ru: /пятнадцать пенсов/i, tr: /on beş peni/i, zh: /十五便士/, ja: /じゅうごペンス/, id: /lima belas pence/i, vi: /mười lăm xu/i },
}
// A currency name after an amount said in words ("forty-five pounds Saturday"): the name goes.
const LEFT_NAMES = /\s?(?:pounds?|libras?|livres?|sterline|Pfund|pond|фунтов|фунта|pound|bảng)(?![A-Za-zÀ-ɏА-яЁё])|英镑|ポンド|파운드/gu

const FIELDS = ['instruction', 'prompt', 'audio_text', 'options', 'correct_answer', 'accepted_answers', 'hints', 'worked_example', 'feedback', 'speech_scoring', 'distractor_insight']
const walk = (v, lang) => (typeof v === 'string' ? tokenize(v, lang) : Array.isArray(v) ? v.map((x) => walk(x, lang)) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, lang)])) : v)

// The coins pictured on these cards were described in words ("🪙🪙 (two 5p coins shown)"), which
// is a reading task and half the answer. Each coin is now shown with its value, in every language.
const COIN_CARDS = {
  'MA-RD-T14-Q03': '🪙 [[m:5]]   🪙 [[m:5]]',
  'MA-RD-T14-Q06': '🪙 [[m:10]]   🪙 [[m:5]]   🪙 [[m:2]]',
  'MA-RD-T14-Q08': '🪙 [[m:20]]   🪙 [[m:20]]',
  'MA-RD-T14-Q10': '🪙 [[m:10]]   🪙 [[m:10]]   🪙 [[m:5]]   🪙 [[m:2]]',
}

// Sentences where a currency name stood without a number, or a grammar ending followed the old
// unit: written again per language so they read naturally with any currency.
const REWRITE = {
  'MA-LIS-T11-Q09': { tr: { audio_text: 'Bir hayır kurumu cumartesi [[M:45]], pazar [[M:32]] topluyor, sonra malzeme için [[M:20]] harcıyor. Ne kadar para kaldı?' } },
  'MA-SPK-T13-Q09': { tr: { audio_text: 'Bir hayır kurumu cumartesi [[M:45]], pazar [[M:32]] topladı, sonra malzeme için [[M:20]] harcadı. Ne kadar para kaldı?' } },
  'MA-SPK-T14-Q08': { tr: { audio_text: 'Bir hayır kurumu cumartesi [[M:45]], pazar [[M:32]] topluyor, sonra malzeme için [[M:20]] harcıyor. Ne kadar para kaldı?' } },
  'MA-SPK-T12-Q07': { tr: { prompt: "[[m:15]]'in varken [[m:12]]'ye bir şey almaya yetecek paran olup olmadığını nasıl çözerdin?" } },
}

const isMoneyItem = (q) => {
  const txt = JSON.stringify(FIELDS.map((f) => q[f]))
  return /\[\[[mM]:|£|\d\s?p(?![\p{L}])|\d\s?(pence|pounds?)\b/iu.test(txt) || !!COIN_CARDS[q.id] || !!REWRITE[q.id]
}
// The maths items with money (English text decides; it is the same item in every language).
const fs = require('fs')
const path = require('path')
const MONEY_IDS = []
for (const f of ['math_listen.json', 'math_read.json', 'math_write.json', 'math_speak.json']) {
  const file = path.resolve(__dirname, '../../data', f)
  if (!fs.existsSync(file)) continue
  for (const q of JSON.parse(fs.readFileSync(file, 'utf8')).questions) if (isMoneyItem(q)) MONEY_IDS.push(q.id)
}

const patches = [
  {
    ids: MONEY_IDS,
    category: 'regional',
    severity: 'improve',
    reason: 'Money was in UK pence and pounds in every language (a German card said "20 Pence"). Amounts are now tokens filled in with the learner\'s own currency (euro and cent in Ireland and the EU, pounds and pence in the UK, dollars and cents in the US …), with symbols on tiles and words in sentences.',
    apply(q, h) {
      h.forEachLang(q, (t, lang) => {
        const said = SPOKEN_AMOUNTS[q.id] && SPOKEN_AMOUNTS[q.id][lang]
        if (said) {
          if (t.feedback && typeof t.feedback.correct === 'string') t.feedback = { ...t.feedback, correct: t.feedback.correct.replace(said, '[[m:15]]') }
          if (t.speech_scoring && typeof t.speech_scoring.sample_answer === 'string') t.speech_scoring = { ...t.speech_scoring, sample_answer: t.speech_scoring.sample_answer.replace(said, '[[m:15]]') }
        }
        for (const f of FIELDS) if (t[f] != null) t[f] = walk(t[f], lang)
        if (t.speech_scoring && typeof t.speech_scoring.sample_answer === 'string') t.speech_scoring = { ...t.speech_scoring, sample_answer: t.speech_scoring.sample_answer.replace(LEFT_NAMES, '') }
        if (COIN_CARDS[q.id]) t.prompt = COIN_CARDS[q.id]
        const own = REWRITE[q.id] && REWRITE[q.id][lang]
        if (own) Object.assign(t, own)
      })
    },
  },
]

module.exports = { patches, tokenize, COIN_CARDS, MONEY_IDS, MAJOR_WORDS, MINOR_WORDS }
