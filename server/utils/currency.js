// Money in the learner's own currency (content v5, docs/learning/TEACHING-STANDARDS.md "Regional rules").
//
// The bank writes amounts as tokens, the same in every language:
//   [[m:20]]  20 of the small unit (cent, penny, cent, kopeck…)
//   [[M:45]]  45 of the main unit (euro, pound, dollar, yen…); decimals allowed: [[M:3.50]]
// fillMoney(question, { currency, lang, country }) replaces them where the question is served:
//   - on screen (options, answers, prompt-only amounts): symbols, written the local way
//     (20c, 20p, 20¢, €45, 45 €, £45, $45, 45円)
//   - in what is spoken or read as a sentence (audio, narration, hints, feedback, prompts):
//     words ("20 cent", "20 pence", "1 penny", "45 euro", "45 рублей")
// Currencies with no small coin in daily use (yen, won, rupiah, dong, yuan) show small amounts
// in the main unit: the numbers, and so the maths, never change.
// The currency comes from the learner's country and follows the language they choose
// (client/src/utils/region.js), sent as X-Currency; the server only checks it is one it knows.

const CURRENCIES = ['EUR', 'GBP', 'USD', 'CAD', 'AUD', 'NZD', 'CHF', 'JPY', 'CNY', 'KRW', 'RUB', 'TRY', 'IDR', 'VND', 'BRL', 'INR', 'MXN']
const DEFAULT = 'EUR'
// No small coin in daily use: small amounts are shown in the main unit.
const NO_MINOR = new Set(['JPY', 'KRW', 'IDR', 'VND', 'CNY'])

// Words, by currency then language: [singular, plural] (or a plural-rule map for Russian).
const W = (one, other = one) => ({ one, other })
const RU = (one, few, many) => ({ one, few, many, other: many })
const MAJOR = {
  EUR: { en: W('euro'), de: W('Euro'), fr: W('euro', 'euros'), es: W('euro', 'euros'), it: W('euro'), nl: W('euro'), pt: W('euro', 'euros'), ru: W('евро'), tr: W('euro'), zh: W('欧元'), ja: W('ユーロ'), ko: W('유로'), id: W('euro'), vi: W('euro') },
  GBP: { en: W('pound', 'pounds') },
  USD: { en: W('dollar', 'dollars'), es: W('dólar', 'dólares') },
  CAD: { en: W('dollar', 'dollars'), fr: W('dollar', 'dollars') },
  AUD: { en: W('dollar', 'dollars') },
  NZD: { en: W('dollar', 'dollars') },
  CHF: { en: W('franc', 'francs'), de: W('Franken'), fr: W('franc', 'francs'), it: W('franco', 'franchi') },
  JPY: { en: W('yen'), ja: W('円') },
  CNY: { en: W('yuan'), zh: W('元') },
  KRW: { en: W('won'), ko: W('원') },
  RUB: { en: W('rouble', 'roubles'), ru: RU('рубль', 'рубля', 'рублей') },
  TRY: { en: W('lira'), tr: W('lira') },
  IDR: { en: W('rupiah'), id: W('rupiah') },
  VND: { en: W('dong'), vi: W('đồng') },
  BRL: { en: W('real', 'reais'), pt: W('real', 'reais') },
  INR: { en: W('rupee', 'rupees') },
  MXN: { en: W('peso', 'pesos'), es: W('peso', 'pesos') },
}
const MINOR = {
  EUR: { en: W('cent'), de: W('Cent'), fr: W('centime', 'centimes'), es: W('céntimo', 'céntimos'), it: W('centesimo', 'centesimi'), nl: W('cent'), pt: W('cêntimo', 'cêntimos'), ru: W('евроцент', 'евроцентов'), tr: W('sent'), id: W('sen'), vi: W('xu') },
  GBP: { en: W('penny', 'pence') },
  USD: { en: W('cent', 'cents'), es: W('centavo', 'centavos') },
  CAD: { en: W('cent', 'cents'), fr: W('cent', 'cents') },
  AUD: { en: W('cent', 'cents') },
  NZD: { en: W('cent', 'cents') },
  CHF: { en: W('centime', 'centimes'), de: W('Rappen'), fr: W('centime', 'centimes'), it: W('centesimo', 'centesimi') },
  RUB: { en: W('kopeck', 'kopecks'), ru: RU('копейка', 'копейки', 'копеек') },
  TRY: { en: W('kuruş'), tr: W('kuruş') },
  BRL: { en: W('centavo', 'centavos'), pt: W('centavo', 'centavos') },
  INR: { en: W('paisa', 'paise') },
  MXN: { en: W('centavo', 'centavos'), es: W('centavo', 'centavos') },
}
// How a small amount is written on a tile: "20c" in Ireland, "20 ct" in Germany, "20p", "20¢".
const MINOR_SYMBOL = {
  EUR: { en: '{n}c', de: '{n} ct', nl: '{n} ct', default: '{n} c' },
  GBP: { default: '{n}p' }, USD: { default: '{n}¢' }, CAD: { default: '{n}¢' }, AUD: { default: '{n}c' }, NZD: { default: '{n}c' },
  CHF: { de: '{n} Rp.', default: '{n} ct.' }, RUB: { default: '{n} коп.' }, TRY: { default: '{n} kr' }, BRL: { default: '{n} centavos' },
  INR: { default: '{n} paise' }, MXN: { default: '{n} ¢' },
}
// The locale used to write a main amount with its symbol (Intl), per currency and language.
const REGION = { EUR: { en: 'IE', de: 'DE', fr: 'FR', es: 'ES', it: 'IT', nl: 'NL', pt: 'PT' }, GBP: 'GB', USD: 'US', CAD: 'CA', AUD: 'AU', NZD: 'NZ', CHF: 'CH', JPY: 'JP', CNY: 'CN', KRW: 'KR', RUB: 'RU', TRY: 'TR', IDR: 'ID', VND: 'VN', BRL: 'BR', INR: 'IN', MXN: 'MX' }
const CJK = new Set(['zh', 'ja', 'ko'])

// The currencies a learner can meet in each language (client/src/utils/region.js picks one of
// these: the country's own when that language is spoken there, else the language's home currency).
// The QA gate checks every money question in each of these.
const LANG_CURRENCIES = {
  en: ['EUR', 'GBP', 'USD', 'CAD', 'AUD', 'NZD', 'INR'],
  de: ['EUR', 'CHF'], fr: ['EUR', 'CHF', 'CAD'], it: ['EUR', 'CHF'], es: ['EUR', 'USD', 'MXN'], nl: ['EUR'], pt: ['EUR', 'BRL'],
  ru: ['RUB'], tr: ['TRY'], zh: ['CNY'], ja: ['JPY'], ko: ['KRW'], id: ['IDR'], vi: ['VND'],
}

const normCurrency = (c) => (CURRENCIES.includes(String(c || '').toUpperCase()) ? String(c).toUpperCase() : DEFAULT)
const baseLang = (l) => String(l || 'en').split('-')[0].toLowerCase()
const decimals = (n) => (Number.isInteger(n) ? 0 : 2)
const plural = (forms, n, lang) => {
  if (!forms) return null
  let cat = 'other'
  try { cat = new Intl.PluralRules(lang).select(n) } catch { /* default */ }
  return forms[cat] || (n === 1 ? forms.one : forms.other) || forms.other
}
const numText = (n, lang) => {
  const d = decimals(n)
  try { return new Intl.NumberFormat(lang, { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: false }).format(n) } catch { return n.toFixed(d) }
}

// "45 euro", "1 penny", "45 рублей", "20円" (words: spoken and in sentences).
function moneyWords(n, unit, currency, lang) {
  currency = normCurrency(currency)
  lang = baseLang(lang)
  const minor = unit === 'm' && !NO_MINOR.has(currency)
  const table = minor ? MINOR[currency] : MAJOR[currency]
  const forms = table && table[lang]
  if (!forms) {
    // No words of our own for this currency in this language (a Korean page showing pounds):
    // the small unit as a symbol ("15p"), the main unit with the language's own name for it.
    if (minor) return moneySymbol(n, unit, currency, lang)
    try {
      return new Intl.NumberFormat(lang, { style: 'currency', currency, currencyDisplay: 'name', minimumFractionDigits: decimals(n), maximumFractionDigits: decimals(n), useGrouping: false }).format(n).replace(/\u00a0|\u202f/g, ' ')
    } catch { /* below */ }
  }
  const word = plural(forms || (table && table.en), n, lang) || currency
  const num = numText(n, lang)
  return CJK.has(lang) ? `${num}${word}` : `${num} ${word}`
}

// "20c", "€45", "45 €", "45円" (symbols: on tiles and answers).
function moneySymbol(n, unit, currency, lang) {
  currency = normCurrency(currency)
  lang = baseLang(lang)
  if (unit === 'm' && !NO_MINOR.has(currency)) {
    const t = MINOR_SYMBOL[currency] || {}
    return (t[lang] || t.default || '{n}').replace('{n}', numText(n, lang))
  }
  // Prices in Japan, China and Korea are written with the word: 17円, 17元, 17원.
  if (CJK.has(lang) && ['JPY', 'CNY', 'KRW'].includes(currency)) return moneyWords(n, unit, currency, lang)
  const region = typeof REGION[currency] === 'object' ? REGION[currency][lang] || 'IE' : REGION[currency]
  try {
    return new Intl.NumberFormat(`${lang}-${region}`, { style: 'currency', currency, minimumFractionDigits: decimals(n), maximumFractionDigits: decimals(n), useGrouping: false }).format(n).replace(/ | /g, ' ')
  } catch {
    return moneyWords(n, unit, currency, lang)
  }
}

const TOKEN = /\[\[([mM]):(\d+(?:\.\d+)?)\]\]/g
const ONE_TOKEN = /\[\[[mM]:\d/
const hasMoney = (v) => (typeof v === 'string' ? ONE_TOKEN.test(v) : Array.isArray(v) ? v.some(hasMoney) : v && typeof v === 'object' ? Object.values(v).some(hasMoney) : false)
// Turkish endings after an amount ("[[m:8]]'ye", "[[m:5]]'lik") follow the new word by vowel
// harmony: kuruşa, kuruşluk, kuruştu, liraya, liralık, liraydı, lirası.
function trAttach(word, raw) {
  const w = word.toLocaleLowerCase('tr')
  const vowels = w.match(/[aeıioöuü]/g) || ['e']
  const last = vowels[vowels.length - 1]
  const back = 'aıou'.includes(last)
  const I = { a: 'ı', ı: 'ı', e: 'i', i: 'i', o: 'u', u: 'u', ö: 'ü', ü: 'ü' }[last]
  const A = back ? 'a' : 'e'
  const endsVowel = /[aeıioöuü]$/.test(w)
  const hard = /[çfhkpsşt]$/.test(w)
  const r = raw.toLocaleLowerCase('tr')
  if (/^l[ıiuü]k$/.test(r)) return `${word}l${I}k`
  if (/^y?[ae]$/.test(r)) return `${word}${endsVowel ? 'y' : ''}${A}`
  if (/^y?[dt][ıiuü]$/.test(r)) return `${word}${endsVowel ? 'yd' : hard ? 't' : 'd'}${I}`
  if (/^s?[ıiuü]$/.test(r)) return `${word}${endsVowel ? 's' : ''}${I}`
  if (/^n?[ıiuü]n$/.test(r)) return `${word}${endsVowel ? 'n' : ''}${I}n`
  return `${word}'${raw}`
}

function fillText(s, how, currency, lang) {
  if (typeof s !== 'string' || !s.includes('[[')) return s
  const fill = how === 'symbol' ? moneySymbol : moneyWords
  let out = s
  // German compounds: "[[m:10]]-Münzen" -> "10-Cent-Münzen".
  if (lang === 'de') out = out.replace(/\[\[([mM]):(\d+(?:\.\d+)?)\]\]-/g, (_, u, n) => `${moneyWords(Number(n), u, currency, lang).replace(/ /g, '-')}-`)
  if (lang === 'tr') out = out.replace(/\[\[([mM]):(\d+(?:\.\d+)?)\]\]'([a-zçğıöşü]+)/gi, (_, u, n, raw) => trAttach(moneyWords(Number(n), u, currency, lang), raw))
  return out.replace(TOKEN, (_, u, n) => fill(Number(n), u, currency, lang))
}
// A tile or answer is only an amount ("[[m:15]]"): symbols. A sentence: words.
const isOnlyAmount = (s) => typeof s === 'string' && s.replace(TOKEN, '').replace(/[\s,.;:!?·•\-–]|\p{Extended_Pictographic}|\uFE0F/gu, '') === ''
const fillValue = (v, currency, lang, how) => (
  typeof v === 'string' ? fillText(v, how || (isOnlyAmount(v) ? 'symbol' : 'words'), currency, lang)
    : Array.isArray(v) ? v.map((x) => fillValue(x, currency, lang, how))
      : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fillValue(x, currency, lang, how)])) : v
)

// Answers that also count: the same amount written the other way (symbol ↔ words).
function moneyAlternatives(v, currency, lang) {
  if (typeof v !== 'string' || !isOnlyAmount(v)) return []
  return [fillText(v, 'words', currency, lang)]
}

/**
 * Fills the money tokens of a served question (any language) for one currency. Mutates and
 * returns `q`. Choice answers are filled exactly like the options, so a tapped tile always
 * matches; typed answers also accept the amount in words.
 */
function fillMoney(q, { currency, lang } = {}) {
  if (!q || !hasMoney(q)) return q
  // No currency given: the request's (X-Currency, utils/requestContext.js), else EUR.
  currency = normCurrency(currency || require('./requestContext').get().currency)
  const L = baseLang(lang || q.lang || 'en')
  const spoken = ['instruction', 'prompt', 'audio_text', 'hints', 'worked_example', 'feedback', 'narration', 'speech_scoring', 'distractor_insight']
  for (const f of spoken) if (q[f] != null) q[f] = fillValue(q[f], currency, L, f === 'prompt' ? undefined : 'words')
  for (const f of ['options', 'correct_answer', 'sequence_items', 'pairs', 'bins']) if (q[f] != null) q[f] = fillValue(q[f], currency, L)
  if (Array.isArray(q.accepted_answers)) {
    const raw = q.accepted_answers
    const filled = raw.map((a) => fillValue(a, currency, L))
    const extra = raw.flatMap((a) => moneyAlternatives(a, currency, L))
    q.accepted_answers = [...new Set([...filled, ...extra])]
  }
  q.currency = currency
  return q
}

// The currency a request asks for (X-Currency header or ?currency=), if it is one we know.
function currencyFrom(req) {
  const c = (req && ((req.get && req.get('x-currency')) || (req.query && req.query.currency))) || ''
  return normCurrency(c)
}

module.exports = { CURRENCIES, DEFAULT, NO_MINOR, LANG_CURRENCIES, fillMoney, fillText, moneyWords, moneySymbol, currencyFrom, normCurrency, hasMoney, TOKEN }
