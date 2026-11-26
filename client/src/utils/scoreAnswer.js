// Answer checker, client copy (ES module). Same rules as server/utils/scoreAnswer.js:
// the code between the SHARED CORE markers is copied from the server file by
//   node server/scripts/content/sync-checker.js
// (never edit it here; server/test/answer-check-parity.test.js fails if the copies drift).
//
// checkAnswer(question, userAnswer) -> { status: "correct"|"close"|"incorrect"|"uncertain"|"ungraded",
//   correct, score, reason?, misconception? }. isCorrect(q, a) === checkAnswer(q, a).correct.
// "close", "uncertain" and "ungraded" answers are never counted as right for mastery
// ("ungraded" has correct:true so a practice answer is never called wrong).

// ---- BEGIN SHARED CORE ----
const CHECKER_VERSION = 4

// ── Text normalisation ──
const VARIATION = /\uFE0E|\uFE0F|\u200D|\u200B|\u2060/g
function baseText(v) {
  return String(v ?? '')
    .normalize('NFKC')
    .replace(VARIATION, '')
    .replace(/[‘’‚‛′´`]/g, "'")
    .replace(/[“”„‟″«»「」]/g, '"')
    .replace(/[‐-―−﹣－]/g, '-')
    .replace(/⁄/g, '/')
    .replace(/[×✕✖]/g, '×')
    .replace(/\s+/g, ' ')
    .trim()
}
const TRAIL_PUNCT = /[\s.!?,;:。！？、…"']+$/u
const LEAD_PUNCT = /^[\s"'¡¿]+/u
// Case-insensitive, trailing punctuation and surrounding quotes ignored.
function canon(v) {
  return baseText(v).toLowerCase().replace(TRAIL_PUNCT, '').replace(LEAD_PUNCT, '').trim()
}
const KEEP = { '.': '\uE000', ',': '\uE001', ':': '\uE002', '/': '\uE003' }
const UNKEEP = { '\uE000': '.', '\uE001': ',', '\uE002': ':', '\uE003': '/', '\uE004': '-' }
// Looser: punctuation between words ignored too (keeps 7.5, 3/4, 4:30, 3+4=7 intact).
function loose(v) {
  return canon(v)
    .replace(/(\d)([.,:/])(?=\d)/g, (m, d, sep) => d + KEEP[sep])
    .replace(/(^|[\s(])-(?=\d)/g, '$1\uE004')
    .replace(/[+=<>×÷*]/g, ' $& ')
    .replace(/[^\p{L}\p{N}\p{M}\uE000-\uE004+=<>×÷*%'\s-]/gu, ' ')
    .replace(/(^|\s)['-]+|['-]+(?=\s|$)/g, ' ')
    .replace(/(\p{L})'(?=\p{L})/gu, '$1')
    .replace(/-/g, ' ')
    .replace(/[\uE000-\uE004]/g, (c) => UNKEEP[c])
    .replace(/\s+/g, ' ')
    .trim()
}
// Strict (case and punctuation matter) apart from whitespace and quote styles.
function strictText(v) {
  return baseText(v).replace(/\s+([.!?,;:])/g, '$1')
}
const stripMarks = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC')
const CJK_LANGS = new Set(['zh', 'ja'])
const isCjkText = (s) => /[぀-ヿ㐀-鿿豈-﫿]/.test(s)

function words(v) {
  const s = loose(v)
  return s ? s.split(' ') : []
}

// Optimal string alignment distance (a swap of two neighbouring letters counts as one edit).
function editDistance(a, b, max = 3) {
  if (a === b) return 0
  const al = a.length, bl = b.length
  if (Math.abs(al - bl) > max) return max + 1
  let prev2 = null, prev = Array.from({ length: bl + 1 }, (_, j) => j)
  for (let i = 1; i <= al; i++) {
    const cur = [i]
    let rowMin = i
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1)
      cur.push(v)
      if (v < rowMin) rowMin = v
    }
    if (rowMin > max) return max + 1
    prev2 = prev
    prev = cur
  }
  return prev[bl]
}

// ── Number words (0-100) in English and the 13 translation languages ──
const NUMBER_LANGS = ['en', 'es', 'fr', 'pt', 'it', 'de', 'nl', 'ru', 'tr', 'zh', 'ja', 'ko', 'id', 'vi']
const FOLD_LANGS = new Set(['es', 'fr', 'pt', 'it', 'de', 'nl', 'tr', 'id'])
function numberTable(lang) {
  const t = new Map()
  const add = (n, ...ws) => { for (const w of ws) if (w) t.set(String(w).toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim(), n) }
  const tensCompose = (tens, units, join) => {
    for (let ti = 0; ti < tens.length; ti++) {
      const T = (ti + 2) * 10
      for (const tw of [].concat(tens[ti])) {
        add(T, tw)
        for (let u = 1; u <= 9; u++) for (const uw of [].concat(units[u])) for (const j of [].concat(join(T, u))) add(T + u, j.replace('{t}', tw).replace('{u}', uw))
      }
    }
  }
  switch (lang) {
    case 'en': {
      const u = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
      u.forEach((w, i) => add(i, w))
      add(0, 'nought', 'nil', 'none')
      tensCompose(['twenty', 'thirty', ['forty', 'fourty'], 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'], u, () => ['{t} {u}', '{t}{u}'])
      add(100, 'hundred', 'one hundred', 'a hundred')
      break
    }
    case 'es': {
      const u = ['cero', ['uno', 'un', 'una'], 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve']
      u.forEach((w, i) => add(i, ...[].concat(w)))
      add(20, 'veinte')
      ;['veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'].forEach((w, i) => add(21 + i, w))
      add(21, 'veintiún', 'veintiuna')
      ;['treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'].forEach((tw, i) => {
        const T = (i + 3) * 10
        add(T, tw)
        for (let k = 1; k <= 9; k++) for (const uw of [].concat(u[k])) add(T + k, `${tw} y ${uw}`)
      })
      add(100, 'cien', 'ciento')
      break
    }
    case 'fr': {
      const u = ['zéro', ['un', 'une'], 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix sept', 'dix huit', 'dix neuf']
      u.forEach((w, i) => add(i, ...[].concat(w)))
      ;['vingt', 'trente', 'quarante', 'cinquante', 'soixante'].forEach((tw, i) => {
        const T = (i + 2) * 10
        add(T, tw)
        add(T + 1, `${tw} et un`, `${tw} et une`, `${tw} un`)
        for (let k = 2; k <= 9; k++) add(T + k, `${tw} ${u[k]}`)
      })
      for (let k = 0; k <= 9; k++) add(70 + k, k === 1 ? 'soixante et onze' : `soixante ${u[10 + k]}`)
      add(71, 'soixante onze')
      add(80, 'quatre vingts', 'quatre vingt', 'huitante', 'octante')
      for (let k = 1; k <= 9; k++) add(80 + k, `quatre vingt ${[].concat(u[k])[0]}`)
      for (let k = 0; k <= 9; k++) add(90 + k, `quatre vingt ${u[10 + k]}`)
      ;[['septante', 70], ['nonante', 90]].forEach(([tw, T]) => { add(T, tw); add(T + 1, `${tw} et un`, `${tw} un`); for (let k = 2; k <= 9; k++) add(T + k, `${tw} ${u[k]}`) })
      add(100, 'cent')
      break
    }
    case 'pt': {
      const u = ['zero', ['um', 'uma'], ['dois', 'duas'], 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', ['catorze', 'quatorze'], 'quinze', ['dezesseis', 'dezasseis'], ['dezessete', 'dezassete'], 'dezoito', ['dezenove', 'dezanove']]
      u.forEach((w, i) => add(i, ...[].concat(w)))
      ;['vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'].forEach((tw, i) => {
        const T = (i + 2) * 10
        add(T, tw)
        for (let k = 1; k <= 9; k++) for (const uw of [].concat(u[k])) add(T + k, `${tw} e ${uw}`)
      })
      add(100, 'cem', 'cento')
      break
    }
    case 'it': {
      const u = ['zero', ['uno', 'una', 'un'], 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci', 'undici', 'dodici', 'tredici', 'quattordici', 'quindici', 'sedici', 'diciassette', 'diciotto', 'diciannove']
      u.forEach((w, i) => add(i, ...[].concat(w)))
      ;['venti', 'trenta', 'quaranta', 'cinquanta', 'sessanta', 'settanta', 'ottanta', 'novanta'].forEach((tw, i) => {
        const T = (i + 2) * 10
        add(T, tw)
        const stem = tw.slice(0, -1)
        for (let k = 1; k <= 9; k++) {
          const uw = k === 1 ? 'uno' : k === 3 ? 'tré' : [].concat(u[k])[0]
          add(T + k, (k === 1 || k === 8) ? stem + uw : tw + uw, k === 3 ? `${tw}tre` : null, `${tw} ${[].concat(u[k])[0]}`)
        }
      })
      add(100, 'cento')
      break
    }
    case 'de': {
      const u = ['null', ['eins', 'ein', 'eine'], ['zwei', 'zwo'], 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn']
      u.forEach((w, i) => add(i, ...[].concat(w)))
      ;['zwanzig', ['dreißig', 'dreissig'], 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'].forEach((tws, i) => {
        const T = (i + 2) * 10
        for (const tw of [].concat(tws)) {
          add(T, tw)
          for (let k = 1; k <= 9; k++) { const uw = k === 1 ? 'ein' : [].concat(u[k])[0]; add(T + k, `${uw}und${tw}`, `${uw} und ${tw}`) }
        }
      })
      add(100, 'hundert', 'einhundert')
      break
    }
    case 'nl': {
      const u = ['nul', ['een', 'één'], 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf', 'dertien', 'veertien', 'vijftien', 'zestien', 'zeventien', 'achttien', 'negentien']
      u.forEach((w, i) => add(i, ...[].concat(w)))
      ;['twintig', 'dertig', 'veertig', 'vijftig', 'zestig', 'zeventig', 'tachtig', 'negentig'].forEach((tw, i) => {
        const T = (i + 2) * 10
        add(T, tw)
        for (let k = 1; k <= 9; k++) {
          const uw = k === 1 ? 'een' : [].concat(u[k])[0]
          const joins = uw.endsWith('e') ? ['ën', 'en'] : ['en']
          for (const j of joins) add(T + k, `${uw}${j}${tw}`)
          add(T + k, `${uw} en ${tw}`)
        }
      })
      add(100, 'honderd', 'honderd')
      break
    }
    case 'ru': {
      const u = ['ноль', ['один', 'одна', 'одно'], ['два', 'две'], 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать']
      u.forEach((w, i) => add(i, ...[].concat(w)))
      add(0, 'нуль')
      ;['двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'].forEach((tw, i) => {
        const T = (i + 2) * 10
        add(T, tw)
        for (let k = 1; k <= 9; k++) for (const uw of [].concat(u[k])) add(T + k, `${tw} ${uw}`)
      })
      add(100, 'сто')
      break
    }
    case 'tr': {
      const u = ['sıfır', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz']
      u.forEach((w, i) => add(i, w))
      ;['on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'].forEach((tw, i) => {
        const T = (i + 1) * 10
        add(T, tw)
        for (let k = 1; k <= 9; k++) add(T + k, `${tw} ${u[k]}`, `${tw}${u[k]}`)
      })
      add(100, 'yüz')
      break
    }
    case 'id': {
      const u = ['nol', ['satu', 'se'], 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan']
      u.forEach((w, i) => add(i, ...[].concat(w).filter((x) => x !== 'se')))
      add(10, 'sepuluh', 'satu puluh')
      add(11, 'sebelas', 'satu belas')
      for (let k = 2; k <= 9; k++) add(10 + k, `${u[k]} belas`)
      for (let ti = 2; ti <= 9; ti++) {
        const tw = `${u[ti]} puluh`
        add(ti * 10, tw)
        for (let k = 1; k <= 9; k++) add(ti * 10 + k, `${tw} ${[].concat(u[k])[0]}`)
      }
      add(100, 'seratus', 'satu ratus')
      break
    }
    case 'vi': {
      const u = ['không', 'một', 'hai', 'ba', ['bốn', 'tư'], 'năm', 'sáu', 'bảy', 'tám', 'chín']
      u.forEach((w, i) => { if (i) add(i, ...[].concat(w).filter((x) => x !== 'tư')) })
      add(10, 'mười')
      for (let k = 1; k <= 9; k++) add(10 + k, `mười ${k === 5 ? 'lăm' : [].concat(u[k])[0]}`)
      for (let ti = 2; ti <= 9; ti++) {
        const tw = `${[].concat(u[ti])[0]} mươi`
        add(ti * 10, tw)
        for (let k = 1; k <= 9; k++) {
          const forms = k === 1 ? ['mốt', 'một'] : k === 4 ? ['tư', 'bốn'] : k === 5 ? ['lăm', 'năm'] : [[].concat(u[k])[0]]
          for (const f of forms) add(ti * 10 + k, `${tw} ${f}`)
        }
      }
      add(100, 'một trăm', 'trăm')
      break
    }
    case 'ko': {
      const sino = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']
      add(0, '영', '공')
      for (let n = 1; n <= 99; n++) {
        const T = Math.floor(n / 10), U = n % 10
        add(n, (T ? (T > 1 ? sino[T] : '') + '십' : '') + (U ? sino[U] : ''))
      }
      add(100, '백', '일백')
      const nat = ['', ['하나', '한'], ['둘', '두'], ['셋', '세', '석'], ['넷', '네', '넉'], '다섯', '여섯', '일곱', '여덟', '아홉']
      const natTens = ['', '열', ['스물', '스무'], '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔']
      for (let T = 0; T <= 9; T++) for (let U = 0; U <= 9; U++) {
        if (!T && !U) continue
        for (const tw of [].concat(natTens[T] || '')) for (const uw of [].concat(nat[U] || '')) add(T * 10 + U, tw + uw, tw && uw ? `${tw} ${uw}` : null)
      }
      break
    }
    case 'ja': {
      const kana = [['ゼロ', 'れい', 'ぜろ'], 'いち', 'に', 'さん', ['よん', 'し'], 'ご', 'ろく', ['なな', 'しち'], 'はち', ['きゅう', 'く'], 'じゅう']
      kana.forEach((w, i) => add(i, ...[].concat(w)))
      ;['ひとつ', 'ふたつ', 'みっつ', 'よっつ', 'いつつ', 'むっつ', 'ななつ', 'やっつ', 'ここのつ', 'とお'].forEach((w, i) => add(i + 1, w))
      for (let n = 11; n <= 99; n++) {
        const T = Math.floor(n / 10), U = n % 10
        for (const tw of T > 1 ? [].concat(kana[T]) : ['']) for (const uw of U ? [].concat(kana[U]) : ['']) add(n, `${tw}じゅう${uw}`)
      }
      add(100, 'ひゃく')
      break
    }
    default: break
  }
  if (FOLD_LANGS.has(lang)) for (const [k, v] of [...t]) { const f = stripMarks(k); if (!t.has(f)) t.set(f, v) }
  return t
}
const numberTables = {}
function tableFor(lang) {
  if (!numberTables[lang]) numberTables[lang] = numberTable(lang)
  return numberTables[lang]
}
// Chinese/Japanese numerals: 七, 十二, 二十一, 一百, 两.
const CJK_DIGITS = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }
function parseCjkNumeral(s) {
  if (!/^[零〇一二两兩三四五六七八九十百]+$/.test(s)) return null
  let total = 0, cur = 0, seen = false
  for (const ch of s) {
    if (ch in CJK_DIGITS) { cur = CJK_DIGITS[ch]; seen = true } else if (ch === '十') { total += (seen ? cur : 1) * 10; cur = 0; seen = false } else if (ch === '百') { total += (seen ? cur : 1) * 100; cur = 0; seen = false }
  }
  return total + cur
}
const FRACTION_WORDS = { half: 2, halves: 2, third: 3, thirds: 3, quarter: 4, quarters: 4, fourth: 4, fourths: 4, fifth: 5, fifths: 5, sixth: 6, sixths: 6, seventh: 7, sevenths: 7, eighth: 8, eighths: 8, ninth: 9, ninths: 9, tenth: 10, tenths: 10 }

// A number written as digits: 7, -3, 7.5, 7,5 (decimal comma), 1/2, 1,250 (thousands, English only).
function parseDigits(s, lang) {
  const t = String(s).trim().replace(/\s/g, '')
  let m = t.match(/^([+-]?\d+)\/(\d+)$/)
  if (m && Number(m[2]) !== 0) return { n: Number(m[1]), d: Number(m[2]), value: Number(m[1]) / Number(m[2]), frac: true }
  if (/^[+-]?\d{1,3}(,\d{3})+$/.test(t) && (lang || 'en') === 'en') return { value: Number(t.replace(/,/g, '')) }
  m = t.match(/^([+-]?\d+)(?:[.,](\d+))?$/)
  if (m) return { value: Number(m[2] ? `${m[1]}.${m[2]}` : m[1]) }
  m = t.match(/^([+-]?\d*)[.,](\d+)$/)
  if (m) return { value: Number(`${m[1] || '0'}.${m[2]}`) }
  m = t.match(/^([+-]?\d+(?:[.,]\d+)?)%$/)
  if (m) return { value: Number(m[1].replace(',', '.')) / 100, percent: true }
  return null
}

// Turns text into tokens, replacing runs of number words with { num } tokens.
// Returns [{ w: 'word' } | { num, frac?, n?, d? }].
// Korean particles and counters that stick to a number word ("삼은", "7개를").
const KO_SUFFIX = /(개|명|마리|권|장|번|살|시|분|원)?(은|는|이|가|을|를|와|과|에|에서|의|도|로|으로|만|요|예요|이에요|입니다)?$/
function numberTokens(text, lang, { fractions = true } = {}) {
  // Punctuation between words is a boundary: "lima, sepuluh, lima belas" is 5, 10, 15 (not 5, 10, 15... 22).
  const segments = String(text ?? '').split(/[;!?、，。！？]+|,(?!\d)|(?<!\d)\.(?!\d)/)
  if (segments.length > 1) return segments.flatMap((seg) => numberTokens1(seg, lang, fractions))
  return numberTokens1(text, lang, fractions)
}
function numberTokens1(text, lang, fractions) {
  const langs = lang && lang !== 'en' ? [lang, 'en'] : ['en']
  let src = loose(text)
  if (CJK_LANGS.has(lang) || isCjkText(src)) src = src.replace(/([0-9]+(?:[./:,][0-9]+)?%?|[零〇一二两兩三四五六七八九十百]+|负|負|マイナス)/g, ' $1 ').replace(/\s+/g, ' ').trim()
  if (lang === 'ko') src = src.replace(/([0-9]+(?:[.,][0-9]+)?)(?=[\uAC00-\uD7A3])/g, '$1 ')
  if (lang === 'ja') {
    // A leading number in kana: "じゅうよんのほうが大きい" → じゅうよん | のほうが大きい
    const tab = tableFor('ja')
    for (let len = Math.min(8, src.length); len >= 1; len--) {
      const head = src.slice(0, len), rest = src.slice(len)
      if (tab.has(head) && (!rest || /^[\sのはがをもとで、。ペ個つ]/.test(rest))) { src = `${head} ${rest}`.trim(); break }
    }
  }
  const toks = src ? src.split(' ') : []
  const out = []
  for (let i = 0; i < toks.length;) {
    const d = parseDigits(toks[i], lang)
    if (d) { out.push({ num: d.value, ...d }); i++; continue }
    const cj = parseCjkNumeral(toks[i])
    if (cj !== null) { out.push({ num: cj, value: cj }); i++; continue }
    let best = null
    for (let len = Math.min(5, toks.length - i); len >= 1 && !best; len--) {
      const phrase = toks.slice(i, i + len).join(' ')
      for (const L of langs) {
        const tab = tableFor(L)
        const v = tab.get(phrase) ?? (FOLD_LANGS.has(L) ? tab.get(stripMarks(phrase)) : undefined)
        if (v !== undefined) { best = { len, v }; break }
      }
    }
    if (!best && lang === 'ko') {
      const bare = toks[i].replace(KO_SUFFIX, '')
      const v = bare && bare !== toks[i] ? tableFor('ko').get(bare) : undefined
      if (v !== undefined) best = { len: 1, v }
    }
    // English fraction words: "a half", "three quarters", "one third".
    const fw = fractions && langs.includes('en') ? FRACTION_WORDS[best ? toks[i + best.len] : toks[i]] : undefined
    if (fw) {
      const num = best ? best.v : 1
      const skip = best ? best.len + 1 : 1
      if (!(num > 1 && toks[i + (best ? best.len : 0)] === 'half')) { out.push({ num: num / fw, value: num / fw, n: num, d: fw, frac: true }); i += skip; continue }
    }
    if (best) { out.push({ num: best.v, value: best.v }); i += best.len; continue }
    out.push({ w: toks[i] })
    i++
  }
  // "minus five", "negative 5", "menos cinco", "负五": a sign word before a number that does not
  // follow another number ("seven minus two" stays a subtraction).
  for (let k = 0; k < out.length - 1; k++) {
    if (out[k].w && MINUS_WORDS.has(out[k].w) && out[k + 1].num !== undefined && !(k > 0 && out[k - 1].num !== undefined)) {
      out[k + 1] = { ...out[k + 1], num: -out[k + 1].num, value: -out[k + 1].value }
      out.splice(k, 1)
    }
  }
  // "a half" → drop the article before a fraction
  return out.filter((t, k) => !(t.w && ['a', 'an'].includes(t.w) && out[k + 1] && out[k + 1].frac))
}
const MINUS_WORDS = new Set(['minus', 'negative', 'menos', 'moins', 'meno', 'минус', 'eksi', 'âm', 'negatif', '마이너스', 'マイナス', '负', '負'])

// One number from a short answer. Returns { value, n?, d?, frac?, rest: [words] } or null.
function parseNumberAnswer(text, lang, { final = false } = {}) {
  const toks = numberTokens(text, lang)
  const nums = toks.filter((t) => t.num !== undefined)
  if (!nums.length) return null
  const pick = final ? nums[nums.length - 1] : nums.length === 1 ? nums[0] : null
  if (!pick) return { multiple: true, nums, rest: toks.filter((t) => t.w).map((t) => t.w) }
  return { ...pick, rest: toks.filter((t) => t.w).map((t) => t.w) }
}

// ── Units ──
const UNIT_ALIASES = {
  cm: ['cm', 'cms', 'centimetre', 'centimetres', 'centimeter', 'centimeters'],
  m: ['m', 'metre', 'metres', 'meter', 'meters', 'mtr'],
  km: ['km', 'kms', 'kilometre', 'kilometres', 'kilometer', 'kilometers'],
  mm: ['mm', 'millimetre', 'millimetres', 'millimeter', 'millimeters'],
  l: ['l', 'litre', 'litres', 'liter', 'liters', 'ltr', 'lt'],
  ml: ['ml', 'millilitre', 'millilitres', 'milliliter', 'milliliters', 'mls'],
  kg: ['kg', 'kgs', 'kilogram', 'kilograms', 'kilo', 'kilos'],
  g: ['g', 'gram', 'grams', 'gramme', 'grammes', 'gr'],
  // Money (content v5): one small unit and one main unit for every currency, so "17c", "17p",
  // "17¢" and "17 cent" all count wherever the learner lives (the question's currency is
  // filled in per learner, utils/currency.js). A bare "c" is a cent on a money question.
  p: ['p', 'pence', 'penny', 'pennies', 'pee', '¢', 'ct', 'cent', 'cents', 'centime', 'centimes', 'céntimo', 'céntimos', 'centimo', 'centimos', 'centesimo', 'centesimi', 'cêntimo', 'cêntimos', 'centavo', 'centavos', 'kopeck', 'kopecks', 'kopek', 'kopeks', 'копейка', 'копейки', 'копеек', 'коп', 'kuruş', 'kurus', 'kr', 'rappen', 'rp', 'paise', 'paisa', 'sen', 'sent', 'xu', 'евроцент', 'евроцентов'],
  '€': ['€', '£', '$', '¥', '￥', '₩', '₽', '₺', '₹', '₫', 'r$', 'chf', 'pound', 'pounds', 'quid', 'gbp', 'euro', 'euros', 'eur', 'dollar', 'dollars', 'usd', 'yen', 'yuan', 'won', 'rouble', 'roubles', 'ruble', 'rubles', 'lira', 'rupiah', 'dong', 'đồng', 'real', 'reais', 'rupee', 'rupees', 'franc', 'francs', 'franken', 'franchi', 'franco', 'peso', 'pesos', 'dólar', 'dólares', 'рубль', 'рубля', 'рублей', 'евро', '円', '元', '원', 'ユーロ', '유로', 'tl'],
  min: ['min', 'mins', 'minute', 'minutes'],
  h: ['h', 'hr', 'hrs', 'hour', 'hours'],
  s: ['s', 'sec', 'secs', 'second', 'seconds'],
  '°c': ['°c', 'c', 'degrees', 'degree', 'celsius'],
}
const UNIT_OF = {}
for (const [u, al] of Object.entries(UNIT_ALIASES)) for (const a of al) UNIT_OF[a] = u
// Splits "8cm", "£73", "17p", "17¢", "R$ 5", "17円" into number and unit parts before tokenising.
function splitUnits(text) {
  return baseText(text)
    .replace(/(R\$|CHF|[£€$¥￥₩₽₺₹₫])\s*(\d)/gi, '$2 $1')
    .replace(/(\d)\s*(°\s*c)\b/gi, '$1 °c')
    .replace(/(\d)([a-zA-Z]{1,12})\b/g, '$1 $2')
    .replace(/(\d)([£€$¢¥￥₩₽₺₹₫円元원])/g, '$1 $2')
}
const unitOf = (w) => UNIT_OF[String(w).toLowerCase().replace(/\.$/, '')] || null
// On a money question (one served with a currency) "c" is a cent, not degrees Celsius.
const unitIn = (q) => (w) => (q && q.currency && String(w).toLowerCase() === 'c' ? 'p' : unitOf(w))

// ── Articles, fillers and English stems ──
const ARTICLES = {
  en: ['a', 'an', 'the', 'some'], es: ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas'], fr: ['le', 'la', 'les', 'l', 'un', 'une', 'des', 'du'],
  pt: ['o', 'a', 'os', 'as', 'um', 'uma'], it: ['il', 'lo', 'la', 'i', 'gli', 'le', 'l', 'un', 'uno', 'una'], de: ['der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'einen'],
  nl: ['de', 'het', 'een'],
}
const FILLERS = ['is', 'are', 'it', "it's", 'its', 'there', 'theres', 'they', 'he', 'she', 'i', 'think', 'answer', 'my', 'equals', 'makes', 'make', 'left', 'now', 'have', 'has', 'had', 'so', 'and', 'of', 'in', 'total', 'altogether', 'all', 'together', 'will', 'be', 'get', 'gets', 'got', 'you', 'we', 'would', 'about', 'roughly', 'maybe', 'yes', 'ok', 'okay', 'um', 'erm', 'uh', '=']
const COUNTERS = ['개', '명', '마리', '권', '장', '번', '살', '시', '분', '원', 'つ', '個', '人', '匹', '本', '枚', '回', '歳', '時', '分', '円', '个', '個', '只', '本', '张', '次', '岁', '点', '块', '元']
function articleSet(lang) { return new Set([...(ARTICLES.en), ...(ARTICLES[lang] || [])]) }
function stripArticles(ws, lang) {
  const arts = articleSet(lang)
  let i = 0
  while (i < ws.length - 1 && arts.has(ws[i])) i++
  return ws.slice(i)
}
function stem(w) {
  if (w.length <= 3) return w
  for (const suf of ['ing', 'ed', 'es', 's']) {
    if (w.endsWith(suf) && w.length - suf.length >= 3) {
      let s = w.slice(0, -suf.length)
      if ((suf === 'ing' || suf === 'ed') && /([b-df-hj-np-tv-z])\1$/.test(s)) s = s.slice(0, -1)
      return s
    }
  }
  return w
}
const tolFor = (len) => (len <= 3 ? 0 : len <= 6 ? 1 : 2)
const HOMOPHONES = { to: 2, too: 2, for: 4, fore: 4, ate: 8, won: 1 }

// ── Accepted answers, distractors ──
function acceptedList(q) {
  const list = []
  if (Array.isArray(q.accepted_answers)) list.push(...q.accepted_answers)
  if (q.correct_answer !== undefined && q.correct_answer !== null && typeof q.correct_answer !== 'object') list.push(q.correct_answer)
  return [...new Set(list.filter((x) => x !== null && x !== undefined && typeof x !== 'object').map(String))]
}
function misconceptionFor(q, answer) {
  const di = q.distractor_insight
  if (!di || typeof di !== 'object' || answer === null || answer === undefined || typeof answer === 'object') return undefined
  const key = canon(answer)
  for (const [k, v] of Object.entries(di)) if (canon(k) === key && typeof v === 'string') return v
  const lk = loose(answer)
  for (const [k, v] of Object.entries(di)) if (loose(k) === lk && typeof v === 'string') return v
  return undefined
}
function questionWords(q) {
  const text = [q.instruction, q.prompt, q.audio_text].filter((x) => typeof x === 'string').join(' ')
  return new Set(words(text))
}

// ── Defaults for questions without `validation` (teacher uploads, older data) ──
function defaultValidation(q) {
  switch (q.interaction) {
    case 'tap_mcq': case 'true_false': case 'drag_to_blank': return { method: 'choice' }
    case 'multi_select': return { method: 'set' }
    case 'drag_order': case 'tap_sequence': return { method: 'sequence' }
    case 'match_pairs': return { method: 'pairs' }
    case 'sort_bins': return { method: 'bins' }
    case 'letter_bank': return Array.isArray(q.correct_answer) ? { method: 'sequence' } : { method: 'text', tiles: true, spelling_strict: true }
    case 'typed_short': case 'typed_long': {
      const acc = acceptedList(q)
      if (acc.length && acc.every((a) => parseNumberAnswer(splitUnits(a), q.lang) && !parseNumberAnswer(splitUnits(a), q.lang).multiple)) return { method: 'number', number_words: true }
      return { method: 'text' }
    }
    case 'mic_record': return { method: 'speech_keywords' }
    default: return { method: 'choice' }
  }
}

// ── Results ──
const result = (status, extra = {}) => {
  const correct = status === 'correct' || status === 'ungraded'
  const score = extra.score !== undefined ? extra.score : correct ? 1 : status === 'close' ? 0.5 : 0
  const r = { status, correct, score }
  if (extra.reason) r.reason = extra.reason
  if (extra.misconception) r.misconception = extra.misconception
  return r
}
const isBlank = (a) => a === undefined || a === null || (typeof a === 'string' && !a.trim()) || (Array.isArray(a) && a.length === 0)

// ── Comparisons for the structured widgets ──
const sameSet = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
  const as = a.map(canon).sort(), bs = b.map(canon).sort()
  return as.every((v, i) => v === bs[i])
}
const sameOrder = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => canon(v) === canon(b[i]))
const pairKey = (p) => (Array.isArray(p) ? `${canon(p[0])}||${canon(p[1])}` : '')
const samePairSet = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
  const as = a.map(pairKey).sort(), bs = b.map(pairKey).sort()
  return as.every((v, i) => v === bs[i])
}
const sameBins = (a, b) => {
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) || Array.isArray(b)) return false
  const ak = Object.keys(a).sort(), bk = Object.keys(b).sort()
  if (ak.length !== bk.length || !ak.every((k, i) => k === bk[i])) return false
  return ak.every((k) => sameSet(a[k] || [], b[k] || []))
}

// Fraction of credit (0..1) where "part right" means something.
function partialFraction(question, userAnswer) {
  const { interaction, correct_answer } = question
  const clamp = (x) => Math.max(0, Math.min(1, x))
  switch (interaction) {
    case 'multi_select': {
      if (!Array.isArray(userAnswer) || !Array.isArray(correct_answer) || !correct_answer.length) return 0
      const right = new Set(correct_answer.map(canon))
      const picked = new Set(userAnswer.map(canon))
      let hits = 0, misses = 0
      for (const p of picked) (right.has(p) ? hits++ : misses++)
      return clamp((hits - misses) / right.size)
    }
    case 'drag_order': case 'tap_sequence': {
      if (!Array.isArray(userAnswer) || !Array.isArray(correct_answer) || !correct_answer.length) return 0
      return correct_answer.filter((v, i) => canon(v) === canon(userAnswer[i])).length / correct_answer.length
    }
    case 'match_pairs': {
      if (!Array.isArray(userAnswer) || !Array.isArray(correct_answer) || !correct_answer.length) return 0
      const right = new Set(correct_answer.map(pairKey))
      const seen = new Set()
      let hits = 0
      for (const p of userAnswer) { const k = pairKey(p); if (right.has(k) && !seen.has(k)) { hits++; seen.add(k) } }
      return hits / correct_answer.length
    }
    case 'sort_bins': {
      if (!correct_answer || typeof correct_answer !== 'object' || !userAnswer || typeof userAnswer !== 'object') return 0
      const home = {}
      for (const [bin, items] of Object.entries(correct_answer)) for (const it of items || []) home[canon(it)] = bin
      const total = Object.keys(home).length
      if (!total) return 0
      let hits = 0
      for (const [bin, items] of Object.entries(userAnswer)) for (const it of (Array.isArray(items) ? items : [])) if (home[canon(it)] === bin) hits++
      return clamp(hits / total)
    }
    default: return checkAnswer(question, userAnswer).correct ? 1 : 0
  }
}

// ── Equations: "3 + 4 = 7", "7 = 4 + 3", tiles ["3","+","4","=","7"] ──
function parseEquation(text) {
  const s = baseText(text).toLowerCase().replace(/[×x*]/g, '*').replace(/÷/g, '/').replace(/\s+/g, '')
  if (!/^[0-9.+\-*/=]+$/.test(s)) return null
  const sides = s.split('=')
  if (sides.length !== 2 || !sides[0] || !sides[1]) return null
  const side = (e) => {
    const terms = []
    const re = /([+-]?)(\d+(?:\.\d+)?(?:[*/]\d+(?:\.\d+)?)*)/g
    let m, used = 0
    while ((m = re.exec(e))) {
      if (m.index !== used) return null
      used = re.lastIndex
      if (!m[1] && terms.length) return null
      const factors = m[2].split(/([*/])/)
      let v = Number(factors[0])
      for (let i = 1; i < factors.length; i += 2) v = factors[i] === '*' ? v * Number(factors[i + 1]) : v / Number(factors[i + 1])
      terms.push({ sign: m[1] === '-' ? -1 : 1, text: m[2], value: v })
    }
    if (used !== e.length || !terms.length) return null
    return terms
  }
  const L = side(sides[0]), R = side(sides[1])
  if (!L || !R) return null
  const sum = (ts) => ts.reduce((s2, t) => s2 + t.sign * t.value, 0)
  const signed = [...L.map((t) => `${t.sign > 0 ? '+' : '-'}${t.text}`), ...R.map((t) => `${t.sign > 0 ? '-' : '+'}${t.text}`)]
  const flipped = signed.map((x) => (x[0] === '+' ? '-' : '+') + x.slice(1))
  // "5 = 3 + 2" is "3 + 2 = 5" written the other way round: same terms with every sign flipped.
  return { true: Math.abs(sum(L) - sum(R)) < 1e-9, key: signed.sort().join(' '), swappedKey: L.length === 1 ? flipped.sort().join(' ') : null }
}

// ── Text answers ──
// One slip (a wrong, missing, extra or swapped letter) in exactly one word, every other word the
// same. `longEnough(expected, typed)` says whether that word is long enough for a slip to be one.
function oneSlip(expected, typed, longEnough) {
  if (expected.length !== typed.length || !expected.length) return false
  let diffs = 0
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] === typed[i]) continue
    diffs++
    if (diffs > 1 || !longEnough(expected[i], typed[i]) || /\d/.test(expected[i]) || editDistance(expected[i], typed[i], 1) !== 1) return false
  }
  return diffs === 1
}

function checkText(q, v, raw) {
  let answer = raw
  if (Array.isArray(answer)) {
    if (!v.tiles && q.interaction !== 'letter_bank') return result('incorrect', { reason: 'shape' })
    const single = answer.every((t) => [...String(t)].length <= 1)
    answer = answer.join(single && !v.equation ? '' : ' ')
  }
  if (typeof answer !== 'string' && typeof answer !== 'number') return result('incorrect', { reason: 'shape' })
  answer = String(answer)
  if (!answer.trim()) return result('incorrect', { reason: 'empty' })
  const lang = q.lang || 'en'
  const accepted = acceptedList(q)
  const miscon = misconceptionFor(q, answer)

  if (v.equation) {
    const eq = parseEquation(answer)
    if (!eq) return result('incorrect', { reason: 'equation_form', misconception: miscon })
    if (!eq.true) return result('incorrect', { reason: 'equation_false', misconception: miscon })
    if (v.tiles || v.equation === 'any_true') return result('correct')
    const keys = accepted.map(parseEquation).filter(Boolean).map((e) => e.key)
    return keys.includes(eq.key) || (eq.swappedKey && keys.includes(eq.swappedKey)) ? result('correct') : result('incorrect', { reason: 'equation_numbers' })
  }

  if (v.case_sensitive || v.punctuation_strict) {
    const s = strictText(answer)
    if (accepted.some((a) => strictText(a) === s)) return result('correct')
    // The right words: say what is really different (the capital letters, the punctuation, or both).
    const user = words(s)
    const lettersOf = (x) => baseText(x).replace(/[^\p{L}\p{N}\p{M}]/gu, '')
    const off = accepted.filter((a) => words(a).join(' ') === user.join(' ')).map((a) => {
      const capitals = lettersOf(a) !== lettersOf(s)
      const punctuation = strictText(a).toLowerCase() !== s.toLowerCase()
      return capitals && punctuation ? 'capitals_punctuation' : punctuation ? 'punctuation' : 'capitals'
    })
    if (off.length) return result('close', { reason: off.find((r) => r !== 'capitals_punctuation') || off[0] })
    // One spelling slip (a phone "correcting" Ana to Anna): close, never plain wrong. The slip may
    // be in a short name as long as one of the two spellings has four letters.
    if (!miscon && accepted.some((a) => oneSlip(words(a), user, (w, u) => Math.max(w.length, u.length) >= 4))) return result('close', { reason: 'spelling' })
    return result('incorrect', { misconception: miscon })
  }

  const norm1 = (x) => {
    let ws = words(x)
    if (v.strip_articles) ws = stripArticles(ws, lang)
    return ws
  }
  const user = norm1(answer)
  const userKey = user.join(' ')
  const accSets = accepted.map(norm1)
  if (accSets.some((a) => a.join(' ') === userKey)) return result('correct')
  if (CJK_LANGS.has(lang) && accepted.some((a) => canon(a).replace(/\s/g, '') === canon(answer).replace(/\s/g, ''))) return result('correct')

  // A known wrong answer is never rescued by the fuzzy rules below.
  const wrongs = new Set()
  if (Array.isArray(q.options)) for (const o of q.options) if (typeof o === 'string' && !accepted.some((a) => canon(a) === canon(o))) wrongs.add(norm1(o).join(' '))
  if (q.distractor_insight && typeof q.distractor_insight === 'object') for (const k of Object.keys(q.distractor_insight)) if (!accepted.some((a) => canon(a) === canon(k))) wrongs.add(norm1(k).join(' '))
  if (wrongs.has(userKey)) return result('incorrect', { misconception: miscon })

  // Numbers written as words or digits ("five" for 5) where the answer is a number.
  if (v.number_words !== false) {
    const un = parseNumberAnswer(answer, lang)
    if (un && !un.multiple && !un.rest.length) {
      for (const a of accepted) {
        const an = parseNumberAnswer(a, lang)
        if (an && !an.multiple && !an.rest.length && Math.abs(an.value - un.value) < 1e-9) return result('correct')
      }
    }
  }

  // The answer plus words echoed from the question: "the sun is hot" for "What is hot?" → "sun".
  if (v.allow_echo) {
    const qw = questionWords(q)
    const arts = articleSet(lang)
    for (const a of accSets) {
      if (!a.length) continue
      for (let i = 0; i + a.length <= user.length; i++) {
        if (user.slice(i, i + a.length).join(' ') !== a.join(' ')) continue
        const rest = [...user.slice(0, i), ...user.slice(i + a.length)]
        if (rest.every((w) => qw.has(w) || arts.has(w) || FILLERS.includes(w))) return result('correct')
      }
    }
  }

  // Spelling: one slip (a wrong, missing, extra or swapped letter) in one word of four or more letters.
  if (accSets.some((a) => oneSlip(a, user, (w) => w.length >= 4))) return v.spelling_strict ? result('close', { reason: 'spelling' }) : result('correct', { reason: 'spelling' })
  return result('incorrect', { misconception: miscon })
}

// ── Number answers ──
function checkNumber(q, v, raw) {
  if (Array.isArray(raw) || (raw && typeof raw === 'object')) return result('incorrect', { reason: 'shape' })
  const answer = String(raw ?? '')
  if (!answer.trim()) return result('incorrect', { reason: 'empty' })
  const lang = q.lang || 'en'
  const miscon = misconceptionFor(q, answer)
  const accepted = acceptedList(q)
  const expected = []
  for (const a of accepted) {
    const p = parseNumberAnswer(splitUnits(a), lang, { final: true })
    if (p && !p.multiple) expected.push({ ...p, unit: p.rest.map(unitIn(q)).find(Boolean) || null })
  }
  // Exact-ish text match first (keeps answers like "half" or "1250g" working without parsing surprises).
  if (accepted.some((a) => loose(a) === loose(answer) || loose(splitUnits(a)) === loose(splitUnits(answer)))) return result('correct')
  if (!expected.length) return checkText(q, { ...v, method: 'text' }, raw)

  const final = !!v.final_answer || /=/.test(answer)
  const user = parseNumberAnswer(splitUnits(answer), lang, { final })
  if (!user) return result('incorrect', { misconception: miscon })
  if (user.multiple) return result('incorrect', { reason: 'several_numbers', misconception: miscon })
  const userUnit = user.rest.map(unitIn(q)).find(Boolean) || null
  const usedWords = (v.number_words === false) && !/\d/.test(answer)
  const eq = (e) => {
    if (e.frac || user.frac) {
      if (Math.abs(e.value - user.value) > 1e-9) return false
      if (v.equivalent_forms === true) return true
      if (e.frac && user.frac) return v.equivalent_forms === 'fraction' || (e.n === user.n && e.d === user.d) || (e.n / e.d === user.n / user.d && e.d === user.d)
      return false
    }
    return Math.abs(e.value - user.value) < 1e-9
  }
  const hit = expected.find(eq)
  if (!hit) {
    const anyValue = expected.find((e) => Math.abs(e.value - user.value) < 1e-9)
    if (anyValue) return result('close', { reason: 'number_form' })
    return result('incorrect', { misconception: miscon || misconceptionFor(q, String(user.value)) })
  }
  if (usedWords) return result('incorrect', { reason: 'number_form' })
  // Units: right unit or none; a wrong unit is wrong; a missing required unit is close.
  const units = new Set([...(v.units || []).map((u) => unitOf(u) || String(u).toLowerCase())])
  if (hit.unit) units.add(hit.unit)
  if (userUnit && hit.unit && userUnit !== hit.unit) return result('incorrect', { reason: 'unit' })
  if (v.unit_required && hit.unit && !userUnit) return result('close', { reason: 'unit' })
  const qw = questionWords(q)
  const allowed = new Set([...(v.units || []).map((u) => String(u).toLowerCase()), ...qw, ...FILLERS, ...COUNTERS, ...articleSet(lang)])
  const extra = user.rest.filter((w) => !unitIn(q)(w) && !allowed.has(w) && !allowed.has(stem(w)) && !/^[+\-*/=×÷<>]$/.test(w))
  if (extra.length && !v.final_answer) return result('close', { reason: 'number_form' })
  return result('correct')
}

// ── Keyword groups (rubric and speech) ──
function keywordGroupsFor(q, v) {
  const lang = q.lang || 'en'
  if ((lang === 'en' || v.keywords_lang === lang) && Array.isArray(v.keywords)) return v.keywords.map((g) => [].concat(g))
  // A translated question: the English keyword lists do not apply; use the translation's own
  // expected keywords. Where the English rule is "any one of these" (or a time), they are alternatives.
  const ss = q.speech_scoring && q.speech_scoring.expected_keywords
  if (q.interaction === 'mic_record' && Array.isArray(ss) && ss.length) {
    if (lang === 'en' && !Array.isArray(v.keywords)) return ss.map((k) => [k])
    const anyOf = v.time || v.min === 1 || (Array.isArray(v.keywords) && v.keywords.length === 1)
    return anyOf ? [ss.slice()] : ss.map((k) => [k])
  }
  return null
}
function minFor(v, groups, q) {
  if (!groups || !groups.length) return 0
  const translated = q && (q.lang || 'en') !== 'en' && v.keywords_lang !== q.lang
  if (translated) return v.min !== undefined ? Math.max(1, Math.min(v.min, groups.length)) : Math.ceil(groups.length / 2)
  return Math.max(1, Math.min(groups.length, v.min !== undefined ? v.min : Math.ceil(groups.length / 2)))
}
// Word-level fuzzy match. `tokens` are numberTokens; returns index of the match end or -1.
function tokenMatches(tok, kw, lang, short, exact = false) {
  if (kw.num !== undefined) {
    if (tok.num !== undefined) return Math.abs(tok.num - kw.num) < 1e-9
    if (short && (lang === 'en') && HOMOPHONES[tok.w] === kw.num) return true
    return false
  }
  if (tok.w === undefined) return false
  const a = tok.w, b = kw.w
  if (a === b) return true
  if ((lang || 'en') === 'en' && stem(a) === stem(b)) return true
  if (FOLD_LANGS.has(lang) && stripMarks(a) === stripMarks(b)) return true
  if (exact) return false
  if (lang === 'ko') {
    // Korean: particles and endings follow the stem ("물고기는", "심다" → "심고").
    const stemKo = b.length > 1 && b.endsWith('다') ? b.slice(0, -1) : b
    if (a.startsWith(b) || (stemKo.length >= 1 && b !== stemKo && a.startsWith(stemKo))) return true
  } else if (lang && lang !== 'en') {
    // Inflected forms: "menambah" ~ "tambah", "erbij" ~ "bij", "прибавляешь" ~ "прибавить".
    const A = stripMarks(a), B = stripMarks(b)
    if (B.length >= 3 && A.includes(B)) return true
    let k = 0
    while (k < A.length && k < B.length && A[k] === B[k]) k++
    if (k >= 3 && B.length >= 4 && k >= 0.6 * B.length) return true
    if (lang === 'id') {
      // Indonesian prefixes change the first sound: tambah → menambah, kali → dikali.
      let e = 0
      while (e < A.length && e < B.length && A[A.length - 1 - e] === B[B.length - 1 - e]) e++
      if (e >= 4 && e >= 0.6 * B.length) return true
    }
  }
  const tol = tolFor([...b].length)
  return tol > 0 && editDistance(a, b, tol) <= tol
}
function findPhrase(tokens, phrase, lang, from = 0, exact = false) {
  const short = tokens.length <= 3
  for (let i = from; i + phrase.length <= tokens.length; i++) {
    let ok = true
    for (let j = 0; j < phrase.length && ok; j++) ok = tokenMatches(tokens[i + j], phrase[j], lang, short, exact)
    if (ok) return i
  }
  return -1
}
function cjkStem(k) {
  return /[㐀-鿿]/.test(k) ? k.replace(/[ぁ-ゟ]+$/, '') || k : k
}
// Counts matched groups. Each group is a list of alternatives; each alternative may be several words.
function matchGroups(text, groups, lang, { ordered = false, exact = false } = {}) {
  const tokens = numberTokens(text, lang)
  const compact = loose(text).replace(/\s/g, '')
  const cjk = CJK_LANGS.has(lang) || isCjkText(text)
  let count = 0, pos = 0
  const positions = []
  for (const g of groups) {
    let found = -1
    for (const alt of g) {
      if (cjk && isCjkText(String(alt))) {
        const k = cjkStem(loose(alt).replace(/\s/g, ''))
        const idx = compact.indexOf(k)
        if (idx >= 0) { found = idx; break }
        continue
      }
      const phrase = numberTokens(String(alt), lang).map((t) => (t.num !== undefined ? { num: t.num } : { w: t.w }))
      if (!phrase.length) continue
      const idx = findPhrase(tokens, phrase, lang, ordered ? pos : 0, exact)
      if (idx >= 0) { found = idx; break }
    }
    if (found >= 0) { count++; positions.push(found); if (ordered) pos = found + 1 }
  }
  return count
}

// "seven is bigger", "three is smaller", "the elephant is heavier than the mouse".
const MORE_WORDS = ['bigger', 'biggest', 'larger', 'largest', 'greater', 'greatest', 'more', 'most', 'higher', 'heavier', 'heaviest', 'faster', 'fastest', 'taller', 'tallest', 'hotter', 'hottest', 'longer', 'older', 'big', 'large', 'heavy', 'fast', 'tall', 'hot',
  'mayor', 'grande', 'grand', 'größer', 'groß', 'maggiore', 'maior', 'groter', 'больше', 'büyük', 'besar', 'lớn', '크다', '큰', '많다', 'más', 'plus', 'più', 'mais', 'meer', 'mehr', 'lebih']
const LESS_WORDS = ['smaller', 'smallest', 'less', 'least', 'fewer', 'lower', 'lighter', 'lightest', 'slower', 'slowest', 'shorter', 'shortest', 'colder', 'coldest', 'littler', 'younger', 'small', 'little', 'light', 'slow', 'short', 'cold', 'tiny',
  'menor', 'pequeño', 'petit', 'kleiner', 'klein', 'minore', 'piccolo', 'kleiner', 'меньше', 'küçük', 'kecil', 'nhỏ', '작다', '작은', '적다', 'menos', 'moins', 'meno', 'minder', 'weniger', 'pequeno']
function checkCompare(text, cmp, lang) {
  const toks = numberTokens(text, lang)
  const compact = loose(text).replace(/\s/g, '')
  const asTok = (x) => (typeof x === 'number' ? { num: x } : { w: loose(x) })
  const entity = (t) => {
    if ((cmp.more || []).some((m) => tokenMatches(t, asTok(m), lang, false))) return 'more'
    if ((cmp.less || []).some((m) => tokenMatches(t, asTok(m), lang, false))) return 'less'
    return null
  }
  // "plus petit", "più piccolo", "lebih kecil", "daha büyük": the word after "more" decides.
  const INTENS = ['plus', 'più', 'lebih', 'más', 'mais', 'daha', 'meer', 'more', 'hơn', 'более']
  const kindAt = (i) => {
    const t = toks[i]
    if (!t || !t.w) return null
    if (INTENS.includes(t.w) && toks[i + 1] && toks[i + 1].w) {
      const n = toks[i + 1].w
      if (LESS_WORDS.includes(n) || ['az', 'petit', 'petite', 'piccolo', 'piccola', 'kecil', 'pequeño', 'pequeña', 'pequeno', 'pequena', 'klein', 'nhỏ', 'small'].includes(n)) return 'down'
      if (MORE_WORDS.includes(n) || ['grand', 'grande', 'besar', 'groot', 'büyük', 'lớn', 'big'].includes(n)) return 'up'
    }
    if (i > 0 && toks[i - 1] && toks[i - 1].w && INTENS.includes(toks[i - 1].w)) return kindAt(i - 1)
    return MORE_WORDS.includes(t.w) ? 'up' : LESS_WORDS.includes(t.w) || t.w === 'az' ? 'down' : null
  }
  const kind = (t) => kindAt(toks.indexOf(t))
  if (cmp.equal && cmp.equal.some((e) => toks.some((t) => tokenMatches(t, asTok(e), lang, false)))) return cmp.answer === 'equal'
  let ci = toks.findIndex((t) => kind(t))
  if (ci < 0 && (isCjkText(text) || lang === 'ko' || CJK_LANGS.has(lang))) {
    // 大/小 in Chinese/Japanese, 크/작 in Korean
    const up = /大|多|高|重|快|크|커|많|높|무거|빠르|빨라/.test(compact), down = /小|少|低|轻|軽|慢|작|적|낮|가벼|느리|느려/.test(compact)
    const nums = toks.filter((t) => t.num !== undefined).map(entity)
    if (nums.length && (up || down)) return (up && !down && nums[0] === 'more') || (down && !up && nums[0] === 'less')
  }
  if (ci < 0) {
    const ents = toks.map(entity).filter(Boolean)
    return ents.length > 0 && ents.every((e) => e === 'more')
  }
  const k = kind(toks[ci])
  let subj = null
  for (let i = ci - 1; i >= 0 && !subj; i--) subj = entity(toks[i])
  for (let i = ci + 1; i < toks.length && !subj; i++) subj = entity(toks[i])
  return (k === 'up' && subj === 'more') || (k === 'down' && subj === 'less')
}

// "4:30", "half past four", "four thirty", "quarter to eleven", "3 o'clock".
function timeMatches(text, hhmm, lang) {
  const [H, M] = String(hhmm).split(':').map(Number)
  const t = loose(text).replace(/o ?clock|oclock/g, 'oclock')
  const digital = new RegExp(`(^|\\D)${H}[ .:]?${String(M).padStart(2, '0')}(\\D|$)`)
  if (digital.test(t.replace(/\s/g, ' '))) return true
  const toks = numberTokens(t, lang, { fractions: false })
  const nums = toks.map((x) => (x.num !== undefined ? x.num : x.w))
  const has = (seq) => { for (let i = 0; i + seq.length <= nums.length; i++) if (seq.every((s, j) => nums[i + j] === s)) return true; return false }
  const next = H % 12 + 1
  if (M === 0 && (has([H, 'oclock']) || (nums.length <= 2 && has([H])))) return true
  if (M === 30 && (has(['half', 'past', H]) || has([H, 30]) || has(['half', H]))) return true
  if (M === 15 && (has(['quarter', 'past', H]) || has([H, 15]))) return true
  if (M === 45 && (has(['quarter', 'to', next]) || has([H, 45]))) return true
  if (M && M < 30 && (has([M, 'past', H]) || has([M, 'minutes', 'past', H]) || has([H, M]))) return true
  if (M > 30 && (has([60 - M, 'to', next]) || has([60 - M, 'minutes', 'to', next]) || has([H, M]))) return true
  if (H === 12 && M === 0 && /noon|midday|midnight/.test(t)) return true
  return false
}

// ── Speech ──
function speechCandidates(a) {
  if (typeof a === 'string') return [a]
  const out = []
  if (a && typeof a.transcript === 'string') out.push(a.transcript)
  if (a && Array.isArray(a.alternatives)) for (const x of a.alternatives) if (typeof x === 'string') out.push(x)
  return out.filter((s) => s.trim())
}
function evaluateSpeech(q, v, text) {
  const lang = q.lang || 'en'
  if (v.time && timeMatches(text, v.time, lang)) return true
  if (v.compare) return checkCompare(text, v.compare, lang)
  if (Array.isArray(v.numbers) && v.numbers.length) {
    const nums = numberTokens(text, lang).filter((t) => t.num !== undefined).map((t) => t.num)
    if (!nums.length) {
      const toks = numberTokens(text, lang)
      if (toks.length <= 3 && lang === 'en' && toks.some((t) => HOMOPHONES[t.w] === v.numbers[v.numbers.length - 1])) return true
      return false
    }
    if (v.number_final) return Math.abs(nums[nums.length - 1] - v.numbers[v.numbers.length - 1]) < 1e-9
    if (v.ordered) {
      let i = 0, hits = 0
      for (const n of nums) if (i < v.numbers.length && Math.abs(n - v.numbers[i]) < 1e-9) { i++; hits++ } else if (i + 1 < v.numbers.length && Math.abs(n - v.numbers[i + 1]) < 1e-9) { i += 2; hits++ }
      return hits >= (v.min_numbers || v.numbers.length)
    }
    return v.numbers.every((n) => nums.some((m) => Math.abs(m - n) < 1e-9))
  }
  if (v.time && lang === 'en') return false
  const groups = keywordGroupsFor(q, v)
  if (!groups || !groups.length) return null
  let said = text
  // Rhymes: saying the prompt word itself never counts.
  if (v.not_prompt && q.prompt) { const pw = new Set(words(q.prompt)); said = words(text).filter((w) => !pw.has(w)).join(' ') }
  return matchGroups(said, groups, lang, { ordered: !!v.ordered, exact: !!(v.exact || v.not_prompt) }) >= minFor(v, groups, q)
}
function checkSpeech(q, v, a) {
  if (a && typeof a === 'object' && !Array.isArray(a)) {
    if (a.unsupported) return result('uncertain', { reason: 'unsupported' })
    if (a.error) {
      const e = String(a.error)
      return result('uncertain', { reason: e === 'not-allowed' || e === 'service-not-allowed' ? 'mic_blocked' : e === 'no-speech' ? 'no_speech' : e })
    }
  }
  const cands = speechCandidates(a)
  if (!cands.length) return result('uncertain', { reason: 'no_speech' })
  if (q.graded === false || v.method === 'speech_open') return result('ungraded')
  const lang = q.lang || 'en'
  if ((Array.isArray(v.graded_langs) && !v.graded_langs.includes(lang)) || (Array.isArray(v.ungraded_langs) && v.ungraded_langs.includes(lang))) return result('ungraded', { reason: 'no_check_in_language' })
  let any = false
  for (const c of cands) {
    const r = evaluateSpeech(q, v, c)
    if (r === null) return result('ungraded', { reason: 'no_check_in_language' })
    if (r) any = true
    if (any) break
  }
  return any ? result('correct') : result('incorrect')
}

// ── Rubric (written explanations, captions) ──
const NEGATIONS = ['not', "don't", 'dont', "doesn't", 'doesnt', "isn't", 'isnt', "aren't", 'arent', 'never', 'no', 'cannot', "can't", 'cant']
function checkRubric(q, v, raw) {
  if (typeof raw !== 'string' || !raw.trim()) return result('incorrect', { reason: 'empty' })
  const lang = q.lang || 'en'
  if (acceptedList(q).some((x) => loose(x) === loose(raw) && loose(x) !== 'open')) return result('correct')
  const groups = keywordGroupsFor(q, v)
  if (!groups) return result('ungraded', { reason: 'no_check_in_language' })
  if (v.negation_fix && lang === 'en') {
    const uw = words(raw)
    const pw = words(q.prompt).filter((w) => w.length > 2)
    if (uw.some((w) => NEGATIONS.includes(w)) && pw.length && pw.filter((w) => uw.includes(w)).length / pw.length >= 0.6) return result('correct')
  }
  if (Array.isArray(v.forbidden) && lang === 'en' && v.forbidden.some((f) => matchGroups(raw, [[f]], lang) > 0) && !words(raw).some((w) => NEGATIONS.includes(w))) return result('incorrect', { misconception: misconceptionFor(q, raw) })
  return matchGroups(raw, groups, lang, { ordered: !!v.ordered }) >= minFor(v, groups, q) ? result('correct') : result('incorrect', { misconception: misconceptionFor(q, raw) })
}

function checkAnswer(question, userAnswer) {
  const q = question || {}
  const v = q.validation && typeof q.validation === 'object' && q.validation.method ? q.validation : defaultValidation(q)
  if (q.interaction === 'mic_record' || v.method === 'speech_keywords' || v.method === 'speech_open') return checkSpeech(q, v, userAnswer)
  if (isBlank(userAnswer)) return result('incorrect', { reason: 'empty' })
  if (q.graded === false) return result('ungraded')
  const lang = q.lang || 'en'
  if ((Array.isArray(v.graded_langs) && !v.graded_langs.includes(lang)) || (Array.isArray(v.ungraded_langs) && v.ungraded_langs.includes(lang))) return result('ungraded', { reason: 'no_check_in_language' })
  switch (v.method) {
    case 'choice': {
      if (typeof userAnswer === 'object') return result('incorrect', { reason: 'shape' })
      const a = canon(userAnswer)
      if (acceptedList(q).some((x) => canon(x) === a)) return result('correct')
      return result('incorrect', { misconception: misconceptionFor(q, userAnswer) })
    }
    case 'set': return sameSet(userAnswer, q.correct_answer) ? result('correct') : result('incorrect', { score: partialFraction(q, userAnswer) })
    case 'sequence': {
      if (Array.isArray(q.correct_answer)) return sameOrder(userAnswer, q.correct_answer) ? result('correct') : result('incorrect', { score: partialFraction({ ...q, interaction: 'drag_order' }, userAnswer) })
      return checkText(q, { method: 'text', tiles: true, spelling_strict: true }, userAnswer)
    }
    case 'pairs': return samePairSet(userAnswer, q.correct_answer) ? result('correct') : result('incorrect', { score: partialFraction({ ...q, interaction: 'match_pairs' }, userAnswer) })
    case 'bins': return sameBins(userAnswer, q.correct_answer) ? result('correct') : result('incorrect', { score: partialFraction({ ...q, interaction: 'sort_bins' }, userAnswer) })
    case 'number': return checkNumber(q, v, userAnswer)
    case 'rubric': return checkRubric(q, v, userAnswer)
    case 'text': default: return checkText(q, v, userAnswer)
  }
}

function isCorrect(question, userAnswer) {
  return checkAnswer(question, userAnswer).correct
}
// ---- END SHARED CORE ----

export { checkAnswer, isCorrect, partialFraction, canon, loose, numberTokens, parseNumberAnswer, CHECKER_VERSION }
