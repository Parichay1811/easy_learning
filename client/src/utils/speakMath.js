// Makes maths (and other symbols) speakable BEFORE the text goes to a voice.
// A voice reads "7 − 2 = ?" symbol by symbol ("seven, minus sign, two, equals
// sign, question mark"); a teacher says "seven minus two equals what?".
//
//   speakMath("3 + 5")            -> "three plus five"
//   speakMath("7 − 2 = ?")        -> "seven minus two equals what?"
//   speakMath("3/4 of £2.50")     -> "three quarters of two pounds fifty"
//   speakMath("7 − 2 = ?", "de")  -> "7 minus 2 ist gleich wie viel?"
//
// English turns numbers into words too. In the other languages numbers stay as
// digits (the voice reads them in its own language) and only the operators,
// "equals", fractions, percentages and money words are translated; a decimal
// point becomes the language's decimal comma where that is how it is written.
// Emoji are dropped (a voice would read "red apple red apple…").
//
// Pure (no DOM), so `node --test` checks it: src/utils/speakMath.test.mjs.

/* ── English numbers ────────────────────────────────────────────────────── */

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const SCALES = [[1e12, "trillion"], [1e9, "billion"], [1e6, "million"], [1e3, "thousand"]];

function under1000(n) {
  const parts = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} hundred`);
    n %= 100;
    if (n) parts.push("and");
  }
  if (n >= 20) parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ""));
  else if (n > 0 || !parts.length) parts.push(ONES[n]);
  return parts.join(" ");
}

/** 42 -> "forty-two", 1005 -> "one thousand and five" (British style). */
export function numberToWords(value) {
  let n = Math.floor(Math.abs(Number(value)));
  if (!Number.isFinite(n)) return String(value);
  if (n === 0) return "zero";
  const parts = [];
  for (const [size, word] of SCALES) {
    if (n >= size) {
      parts.push(`${under1000(Math.floor(n / size))} ${word}`);
      n %= size;
    }
  }
  if (n) parts.push((parts.length && n < 100 ? "and " : "") + under1000(n));
  return (Number(value) < 0 ? "negative " : "") + parts.join(" ");
}

const ORDINAL_SPECIAL = { one: "first", two: "second", three: "third", five: "fifth", eight: "eighth", nine: "ninth", twelve: "twelfth" };
/** 1 -> "first", 21 -> "twenty-first", 100 -> "one hundredth". */
export function ordinalWords(value) {
  const words = numberToWords(value);
  return words.replace(/(\w+)$/, (w) => {
    if (ORDINAL_SPECIAL[w]) return ORDINAL_SPECIAL[w];
    if (w.endsWith("y")) return `${w.slice(0, -1)}ieth`;
    return `${w}th`;
  });
}

/** "2.05" -> "two point zero five" (digits after the point one by one). */
function decimalWords(str) {
  const [int, frac] = String(str).split(".");
  const whole = numberToWords(Number(int || 0));
  if (!frac) return whole;
  return `${whole} point ${[...frac].map((d) => ONES[Number(d)]).join(" ")}`;
}

/* ── Words for every voice language ─────────────────────────────────────── */

// den: words for the denominator, [one part, several parts]. one: how "1" is
// said before a fraction word. pct(n): a percentage. frac(a, b): when the
// language says the denominator first (ja, ko, zh, tr). cmp: a comparison
// written in the language's own order.
const L = {
  en: {
    plus: "plus", minus: "minus", times: "times", div: "divided by", eq: "equals", what: "what", neg: "negative",
    lt: "is less than", gt: "is greater than", le: "is less than or equal to", ge: "is greater than or equal to",
    ne: "does not equal", approx: "is about", sq: "squared", cu: "cubed", deg: "degrees", and: "and", over: "over", blank: "blank",
    pct: (n) => `${n} percent`, one: "one",
    den: { 2: ["half", "halves"], 3: ["third", "thirds"], 4: ["quarter", "quarters"], 5: ["fifth", "fifths"], 6: ["sixth", "sixths"],
      7: ["seventh", "sevenths"], 8: ["eighth", "eighths"], 9: ["ninth", "ninths"], 10: ["tenth", "tenths"], 11: ["eleventh", "elevenths"],
      12: ["twelfth", "twelfths"], 20: ["twentieth", "twentieths"], 100: ["hundredth", "hundredths"] },
    half: "a half",
    money: { "£": ["pound", "pounds", "penny", "pence"], $: ["dollar", "dollars", "cent", "cents"], "€": ["euro", "euros", "cent", "cents"] },
  },
  es: {
    plus: "más", minus: "menos", times: "por", div: "entre", eq: "es igual a", what: "cuánto", neg: "menos",
    lt: "es menor que", gt: "es mayor que", le: "es menor o igual que", ge: "es mayor o igual que", ne: "no es igual a",
    approx: "es aproximadamente", sq: "al cuadrado", cu: "al cubo", deg: "grados", and: "y", over: "entre",
    pct: (n) => `${n} por ciento`, one: "un", comma: true, half: "medio",
    den: { 2: ["medio", "medios"], 3: ["tercio", "tercios"], 4: ["cuarto", "cuartos"], 5: ["quinto", "quintos"], 6: ["sexto", "sextos"],
      7: ["séptimo", "séptimos"], 8: ["octavo", "octavos"], 9: ["noveno", "novenos"], 10: ["décimo", "décimos"], 100: ["centésimo", "centésimos"] },
    money: { "£": "libras", $: "dólares", "€": "euros" },
  },
  fr: {
    plus: "plus", minus: "moins", times: "fois", div: "divisé par", eq: "égale", what: "combien", neg: "moins",
    lt: "est plus petit que", gt: "est plus grand que", le: "est inférieur ou égal à", ge: "est supérieur ou égal à", ne: "n'est pas égal à",
    approx: "est environ", sq: "au carré", cu: "au cube", deg: "degrés", and: "et", over: "sur",
    pct: (n) => `${n} pour cent`, one: "un", comma: true, half: "demi",
    den: { 2: ["demi", "demis"], 3: ["tiers", "tiers"], 4: ["quart", "quarts"], 5: ["cinquième", "cinquièmes"], 6: ["sixième", "sixièmes"],
      7: ["septième", "septièmes"], 8: ["huitième", "huitièmes"], 9: ["neuvième", "neuvièmes"], 10: ["dixième", "dixièmes"], 100: ["centième", "centièmes"] },
    money: { "£": "livres", $: "dollars", "€": "euros" },
  },
  pt: {
    plus: "mais", minus: "menos", times: "vezes", div: "dividido por", eq: "é igual a", what: "quanto", neg: "menos",
    lt: "é menor que", gt: "é maior que", le: "é menor ou igual a", ge: "é maior ou igual a", ne: "é diferente de",
    approx: "é aproximadamente", sq: "ao quadrado", cu: "ao cubo", deg: "graus", and: "e", over: "sobre",
    pct: (n) => `${n} por cento`, one: "um", comma: true, half: "meio",
    den: { 2: ["meio", "meios"], 3: ["terço", "terços"], 4: ["quarto", "quartos"], 5: ["quinto", "quintos"], 6: ["sexto", "sextos"],
      7: ["sétimo", "sétimos"], 8: ["oitavo", "oitavos"], 9: ["nono", "nonos"], 10: ["décimo", "décimos"], 100: ["centésimo", "centésimos"] },
    money: { "£": "libras", $: "dólares", "€": "euros" },
  },
  it: {
    plus: "più", minus: "meno", times: "per", div: "diviso", eq: "uguale", what: "quanto", neg: "meno",
    lt: "è minore di", gt: "è maggiore di", le: "è minore o uguale a", ge: "è maggiore o uguale a", ne: "è diverso da",
    approx: "è circa", sq: "al quadrato", cu: "al cubo", deg: "gradi", and: "e", over: "fratto",
    pct: (n) => `${n} per cento`, one: "un", comma: true, half: "mezzo",
    den: { 2: ["mezzo", "mezzi"], 3: ["terzo", "terzi"], 4: ["quarto", "quarti"], 5: ["quinto", "quinti"], 6: ["sesto", "sesti"],
      7: ["settimo", "settimi"], 8: ["ottavo", "ottavi"], 9: ["nono", "noni"], 10: ["decimo", "decimi"], 100: ["centesimo", "centesimi"] },
    money: { "£": "sterline", $: "dollari", "€": "euro" },
  },
  de: {
    plus: "plus", minus: "minus", times: "mal", div: "geteilt durch", eq: "ist gleich", what: "wie viel", neg: "minus",
    lt: "ist kleiner als", gt: "ist größer als", le: "ist kleiner oder gleich", ge: "ist größer oder gleich", ne: "ist ungleich",
    approx: "ist ungefähr", sq: "hoch zwei", cu: "hoch drei", deg: "Grad", and: "und", over: "durch",
    pct: (n) => `${n} Prozent`, one: "ein", comma: true, half: "ein halb",
    den: { 2: ["halb", "Halbe"], 3: ["Drittel", "Drittel"], 4: ["Viertel", "Viertel"], 5: ["Fünftel", "Fünftel"], 6: ["Sechstel", "Sechstel"],
      7: ["Siebtel", "Siebtel"], 8: ["Achtel", "Achtel"], 9: ["Neuntel", "Neuntel"], 10: ["Zehntel", "Zehntel"], 100: ["Hundertstel", "Hundertstel"] },
    money: { "£": "Pfund", $: "Dollar", "€": "Euro" },
  },
  nl: {
    plus: "plus", minus: "min", times: "keer", div: "gedeeld door", eq: "is", what: "hoeveel", neg: "min",
    lt: "is kleiner dan", gt: "is groter dan", le: "is kleiner dan of gelijk aan", ge: "is groter dan of gelijk aan", ne: "is niet gelijk aan",
    approx: "is ongeveer", sq: "kwadraat", cu: "tot de derde macht", deg: "graden", and: "en", over: "gedeeld door",
    pct: (n) => `${n} procent`, one: "een", comma: true, half: "een half",
    den: { 2: ["half", "halve"], 3: ["derde", "derde"], 4: ["kwart", "kwart"], 5: ["vijfde", "vijfde"], 6: ["zesde", "zesde"],
      7: ["zevende", "zevende"], 8: ["achtste", "achtste"], 9: ["negende", "negende"], 10: ["tiende", "tiende"], 100: ["honderdste", "honderdste"] },
    money: { "£": "pond", $: "dollar", "€": "euro" },
  },
  ru: {
    plus: "плюс", minus: "минус", times: "умножить на", div: "разделить на", eq: "равно", what: "сколько", neg: "минус",
    lt: "меньше", gt: "больше", le: "меньше или равно", ge: "больше или равно", ne: "не равно",
    approx: "примерно равно", sq: "в квадрате", cu: "в кубе", deg: "градусов", and: "и", over: "разделить на",
    pct: (n) => `${n} процентов`, one: "одна", two: "две", comma: true, half: "одна вторая",
    den: { 2: ["вторая", "вторых"], 3: ["третья", "третьих"], 4: ["четвёртая", "четвёртых"], 5: ["пятая", "пятых"], 6: ["шестая", "шестых"],
      7: ["седьмая", "седьмых"], 8: ["восьмая", "восьмых"], 9: ["девятая", "девятых"], 10: ["десятая", "десятых"], 100: ["сотая", "сотых"] },
    money: { "£": "фунтов", $: "долларов", "€": "евро" },
  },
  tr: {
    plus: "artı", minus: "eksi", times: "çarpı", div: "bölü", eq: "eşittir", what: "kaç", neg: "eksi",
    lt: "küçüktür", gt: "büyüktür", le: "küçük eşittir", ge: "büyük eşittir", ne: "eşit değildir",
    approx: "yaklaşık", sq: "kare", cu: "küp", deg: "derece", and: "tam", over: "bölü",
    pct: (n) => `yüzde ${n}`, comma: true,
    // "dörtte üç": the denominator first, with its locative ending.
    frac: (a, b) => {
      const loc = { 2: "ikide", 3: "üçte", 4: "dörtte", 5: "beşte", 6: "altıda", 7: "yedide", 8: "sekizde", 9: "dokuzda", 10: "onda", 100: "yüzde" }[b];
      return loc ? `${loc} ${a}` : `${a} bölü ${b}`;
    },
    money: { "£": "sterlin", $: "dolar", "€": "avro" },
  },
  ja: {
    plus: "たす", minus: "ひく", times: "かける", div: "わる", eq: "は", what: "いくつ", neg: "マイナス",
    ne: "は等しくない", approx: "はおよそ", sq: "の二乗", cu: "の三乗", deg: "度", and: "と", over: "わる",
    pct: (n) => `${n}パーセント`, frac: (a, b) => `${b}分の${a}`,
    cmp: { lt: (a, b) => `${a}は${b}より小さい`, gt: (a, b) => `${a}は${b}より大きい`, le: (a, b) => `${a}は${b}以下`, ge: (a, b) => `${a}は${b}以上` },
    money: { "£": "ポンド", $: "ドル", "€": "ユーロ" },
  },
  ko: {
    plus: "더하기", minus: "빼기", times: "곱하기", div: "나누기", eq: "는", what: "얼마", neg: "마이너스",
    ne: "는 같지 않다", approx: "는 약", sq: "의 제곱", cu: "의 세제곱", deg: "도", and: "와", over: "나누기",
    pct: (n) => `${n}퍼센트`, frac: (a, b) => `${b}분의 ${a}`,
    cmp: { lt: (a, b) => `${a}는 ${b}보다 작다`, gt: (a, b) => `${a}는 ${b}보다 크다`, le: (a, b) => `${a}는 ${b} 이하`, ge: (a, b) => `${a}는 ${b} 이상` },
    money: { "£": "파운드", $: "달러", "€": "유로" },
  },
  zh: {
    plus: "加", minus: "减", times: "乘以", div: "除以", eq: "等于", what: "多少", neg: "负",
    lt: "小于", gt: "大于", le: "小于或等于", ge: "大于或等于", ne: "不等于", approx: "约等于", sq: "的平方", cu: "的立方", deg: "度",
    and: "又", over: "除以",
    pct: (n) => `百分之${n}`, frac: (a, b) => `${b}分之${a}`,
    money: { "£": "英镑", $: "美元", "€": "欧元" },
  },
  id: {
    plus: "tambah", minus: "kurang", times: "kali", div: "bagi", eq: "sama dengan", what: "berapa", neg: "negatif",
    lt: "kurang dari", gt: "lebih dari", le: "kurang dari atau sama dengan", ge: "lebih dari atau sama dengan", ne: "tidak sama dengan",
    approx: "kira-kira", sq: "kuadrat", cu: "pangkat tiga", deg: "derajat", and: "", over: "per",
    pct: (n) => `${n} persen`, comma: true,
    frac: (a, b) => {
      const one = { 2: "setengah", 3: "sepertiga", 4: "seperempat" }[b];
      if (Number(a) === 1 && one) return one;
      const part = { 3: "pertiga", 4: "perempat" }[b];
      return part ? `${a} ${part}` : `${a} per ${b}`;
    },
    money: { "£": "pound", $: "dolar", "€": "euro" },
  },
  vi: {
    plus: "cộng", minus: "trừ", times: "nhân", div: "chia", eq: "bằng", what: "mấy", neg: "âm",
    lt: "bé hơn", gt: "lớn hơn", le: "bé hơn hoặc bằng", ge: "lớn hơn hoặc bằng", ne: "không bằng",
    approx: "xấp xỉ", sq: "bình phương", cu: "lập phương", deg: "độ", and: "và", over: "phần",
    pct: (n) => `${n} phần trăm`, comma: true, frac: (a, b) => `${a} phần ${b}`,
    money: { "£": "bảng", $: "đô la", "€": "euro" },
  },
};

/** The languages speakMath knows the words of. */
export const SPEAK_MATH_LANGS = Object.keys(L);

const base = (lang) => String(lang || "en").split(/[-_]/)[0].toLowerCase();

/* ── Pieces ─────────────────────────────────────────────────────────────── */

const EMOJI = /\p{Extended_Pictographic}(\u{FE0F}|[\u{1F3FB}-\u{1F3FF}])?(\u{200D}\p{Extended_Pictographic}\u{FE0F}?)*|[\u{1F1E6}-\u{1F1FF}]{2}|\u{FE0F}|\u{200D}/gu;
const UNICODE_FRACTIONS = { "½": "1/2", "⅓": "1/3", "⅔": "2/3", "¼": "1/4", "¾": "3/4", "⅕": "1/5", "⅖": "2/5", "⅗": "3/5", "⅘": "4/5", "⅙": "1/6", "⅚": "5/6", "⅛": "1/8", "⅜": "3/8", "⅝": "5/8", "⅞": "7/8", "⅒": "1/10" };
const BLANK = "(?:_{1,}|□|☐|▢|\\?)";
// Something a sign can stand between: a number, a blank, or a bracket.
const OPERAND_END = /[\d)?_□☐▢\uE001\uE003]$/;

function fractionWords(a, b, W, lang) {
  const n = Number(a);
  const d = Number(b);
  if (W.frac) return W.frac(a, b);
  const den = W.den?.[d];
  if (lang === "en") {
    if (!den) return `${numberToWords(n)} over ${numberToWords(d)}`;
    return `${numberToWords(n)} ${n === 1 ? den[0] : den[1]}`;
  }
  if (!den) return `${a} ${W.over} ${b}`;
  const num = n === 1 ? W.one || a : n === 2 && W.two ? W.two : a;
  return `${num} ${n === 1 ? den[0] : den[1]}`;
}

function mixedWords(whole, a, b, W, lang) {
  const n = Number(a);
  const d = Number(b);
  if (lang === "en") {
    const w = numberToWords(Number(whole));
    if (n === 1 && d === 2) return `${w} and a half`;
    if (n === 1 && d === 4) return `${w} and a quarter`;
    return `${w} and ${fractionWords(a, b, W, lang)}`;
  }
  if (n === 1 && d === 2 && W.half) {
    // "2 y medio", "2 et demi", "2 und ein halb"
    return `${whole} ${W.and} ${W.half}`.replace(/\s+/g, " ");
  }
  return `${whole} ${W.and} ${fractionWords(a, b, W, lang)}`.replace(/\s+/g, " ");
}

function moneyWords(sym, amount, W, lang) {
  const [int, frac = ""] = amount.replace(",", ".").split(".");
  const major = Number(int || 0);
  const minor = frac ? Number(frac.padEnd(2, "0").slice(0, 2)) : 0;
  if (lang === "en") {
    const [one, many, oneMinor, manyMinor] = W.money[sym];
    if (!major && minor) return `${numberToWords(minor)} ${minor === 1 ? oneMinor : manyMinor}`;
    const main = `${numberToWords(major)} ${major === 1 ? one : many}`;
    return minor ? `${main} ${numberToWords(minor)}` : main;
  }
  const word = W.money?.[sym] || "";
  const sep = W.comma ? "," : ".";
  const shown = frac ? `${major}${sep}${String(minor).padStart(2, "0")}` : String(major);
  return `${shown} ${word}`.trim();
}

function timeWords(h, m, suffix) {
  const hour = numberToWords(Number(h));
  const mm = Number(m);
  let out;
  if (mm === 0) out = `${hour} o'clock`;
  else if (mm < 10) out = `${hour} oh ${numberToWords(mm)}`;
  else out = `${hour} ${numberToWords(mm)}`;
  if (suffix) out = `${out.replace(" o'clock", "")} ${/p/i.test(suffix) ? "p m" : "a m"}`;
  return out;
}

/* ── The whole job ──────────────────────────────────────────────────────── */

/**
 * Text a voice can read naturally, in `lang` (two letters or a BCP 47 tag).
 * Unknown languages get English words for symbols only where safe (none):
 * their text is just cleaned of emoji and art.
 */
export function speakMath(input, lang = "en") {
  let s = String(input ?? "");
  if (!s.trim()) return "";
  const code = base(lang);
  const W = L[code];
  const en = code === "en";

  // 1. Tidy: emoji, number-line art, odd spaces and dashes.
  s = s.replace(/\u00A0|\u202F/g, " ")
    .replace(EMOJI, " ")
    .replace(/\|?-{3,}\|?/g, " ")
    .replace(/\s*\|\s*/g, " ")
    .replace(/…/g, "...");
  if (!W) return s.replace(/\s+/g, " ").trim();

  // 2. Unicode fractions (2½ -> 2 1/2) and powers.
  s = s.replace(/(\d)?([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞⅒])/g, (_, d, f) => (d ? `${d} ${UNICODE_FRACTIONS[f]}` : UNICODE_FRACTIONS[f]));
  s = s.replace(/\s*(?:²|\^2\b)/g, ` ${W.sq}`).replace(/\s*(?:³|\^3\b)/g, ` ${W.cu}`);

  // 3. English thousands separators: 1,000 -> 1000.
  if (en) s = s.replace(/\b\d{1,3}(?:,\d{3})+(?![\d,])/g, (m) => m.replace(/,/g, ""));

  // 4. Money: £2.50, $3, €4.10, 50p.
  s = s.replace(/([£$€])\s?(\d+(?:[.,]\d{1,2})?)(?!\d)/g, (_, sym, amt) => moneyWords(sym, amt, W, code));
  if (en) s = s.replace(/\b(\d+)\s?p\b/g, (_, n) => `${numberToWords(Number(n))} ${Number(n) === 1 ? "penny" : "pence"}`);

  // 5. Clock times (English only: other voices read "3:30" themselves).
  if (en) s = s.replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b(\s?(?:am|pm|a\.m\.|p\.m\.))?/gi, (_, h, m, suf) => timeWords(h, m, suf && suf.trim()));

  // 6. Percentages.
  s = s.replace(/(\d+(?:[.,]\d+)?)\s?%/g, (_, n) => W.pct(n));

  // 7. Mixed numbers and fractions (not dates such as 12/05/2024: kept as written).
  s = s.replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/g, "$1\uE002$2\uE002$3");
  s = s.replace(/(?<![\d/])(\d+)\s+(\d{1,3})\/(\d{1,3})(?![\d/])/g, (m, w, a, b) => (Number(a) < Number(b) ? mixedWords(w, a, b, W, code) : m));
  s = s.replace(/(?<![\d/.])(\d{1,3})\/(\d{1,3})(?![\d/])/g, (_, a, b) => fractionWords(a, b, W, code));

  // 8. Negative numbers: a minus sign right before a number, with no number
  //    before it ("-3", "= −4", "(−2)"). Otherwise it is "take away".
  s = s.replace(/([-−–])(?=\d)/g, (m, _sign, offset, str) => {
    const before = str.slice(0, offset).trimEnd();
    if (OPERAND_END.test(before)) return m;
    if (before && /\p{L}$/u.test(before) && str[offset - 1] !== " ") return m; // a word joined by a hyphen
    // After a word ("then −5 more", "it is -3 degrees") it is said "minus";
    // at the start, after "=", a bracket or another sign it is "negative".
    if (before && /[\p{L}]$/u.test(before)) return `${W.minus} `;
    return `${W.neg} `;
  });

  // 9. Blanks and "?" standing for a missing number: "3 + _ = 5", "7 − 2 = ?".
  const op = "[-−–+×÷*=<>≤≥≠≈]";
  // (\uE003 marks a "?", which keeps its question mark: "equals what?")
  s = s.replace(new RegExp(`(${op})\\s*(${BLANK})(?=(\\s*${op})?)(?=\\s|$|[.,;!)]|${op})`, "g"),
    (_m, o, b, more) => `${o} ${b.trim() === "?" && !more ? "\uE003" : "\uE001"}`);
  s = s.replace(new RegExp(`(^|[\\s(])${BLANK}(?=\\s*${op})`, "g"), (_m, pre) => `${pre}\uE001 `);
  // A blank in a sentence ("I ___ happy.") is said as "blank" in English and a pause elsewhere.
  s = s.replace(/_{2,}|□|☐|▢/g, en ? ` ${W.blank} ` : " … ");

  // "Is 5 > 3?" -> "Is five greater than three?" (not "is is greater than").
  if (en) s = s.replace(/\b([Ii]s|[Aa]re)\s+([^\s<>]+)\s*([<>])\s*/g, (_m, v, a, o) => `${v} ${a} ${o === "<" ? "less" : "greater"} than `);

  // 10. Comparisons written in another order (ja, ko).
  if (W.cmp) {
    const cmpOps = { "<": "lt", ">": "gt", "≤": "le", "≥": "ge" };
    s = s.replace(/([^\s<>≤≥]+)\s*([<>≤≥])\s*([^\s<>≤≥]+)/g, (m, a, o, b) => W.cmp[cmpOps[o]](a, b));
  }

  // 11. Signs between operands.
  const between = (sym, word) => {
    s = s.replace(new RegExp(`([\\d)\\uE001\\uE003])\\s*${sym}\\s*(?=[\\d(\\uE001\\uE003]|${W.neg}\\b)`, "gu"), `$1 ${word} `);
  };
  between("[−–]", W.minus);
  between("-", W.minus);
  between("[×✕*]", W.times);
  between("x", W.times);
  between("÷", W.div);
  between("/", W.div);
  s = s.replace(/\s*\+\s*/g, ` ${W.plus} `);
  s = s.replace(/\s*−\s*(?=\S)/g, ` ${W.minus} `);
  s = s.replace(/\s*[×✕]\s*/g, ` ${W.times} `).replace(/\s*÷\s*/g, ` ${W.div} `);
  s = s.replace(/\s*≠\s*/g, ` ${W.ne} `).replace(/\s*≈\s*/g, ` ${W.approx} `);
  if (!W.cmp) {
    s = s.replace(/\s*≤\s*/g, ` ${W.le} `).replace(/\s*≥\s*/g, ` ${W.ge} `)
      .replace(/\s*<\s*/g, ` ${W.lt} `).replace(/\s*>\s*/g, ` ${W.gt} `);
  }
  s = s.replace(/\s*=\s*/g, ` ${W.eq} `);
  // "= ?" at the end: "equals what?" (the question mark keeps the voice asking).
  s = s.replace(/\uE003/g, `${W.what}?`).replace(/\uE001(\s*)$/g, `${W.what}?$1`).replace(/\uE001/g, W.what);
  s = s.replace(/(\S)\s+\?/g, "$1?").replace(/\?\?+/g, "?");

  if (en) s = s.replace(/π/g, " pi ").replace(/√\s*/g, " the square root of ");

  // 12. Degrees and (English) units after a number.
  s = s.replace(/\s?°\s?C\b/g, en ? " degrees Celsius" : ` ${W.deg} Celsius`).replace(/\s?°\s?F\b/g, en ? " degrees Fahrenheit" : ` ${W.deg} Fahrenheit`).replace(/\s?°/g, ` ${W.deg}`);
  if (en) {
    const UNITS = { cm: ["centimetre", "centimetres"], mm: ["millimetre", "millimetres"], km: ["kilometre", "kilometres"], kg: ["kilogram", "kilograms"], ml: ["millilitre", "millilitres"], m: ["metre", "metres"], g: ["gram", "grams"] };
    s = s.replace(/\b(\d+(?:\.\d+)?)\s?(cm|mm|km|kg|ml|m|g)\b(?!')/g, (_, n, u) => `${n} ${Number(n) === 1 ? UNITS[u][0] : UNITS[u][1]}`);
  }

  // 13. Numbers: words in English; the decimal comma elsewhere.
  if (en) {
    s = s.replace(/\b(\d+)(st|nd|rd|th)\b/gi, (_, n) => ordinalWords(Number(n)));
    s = s.replace(/(?<![\w.])(\d+\.\d+|\d+)(?![\w])/g, (m) => (m.includes(".") ? decimalWords(m) : numberToWords(Number(m))));
  } else if (W.comma) {
    s = s.replace(/(\d)\.(\d)/g, "$1,$2");
  }

  return s.replace(/\uE002/g, "/").replace(/\s+([,.;:!?])/g, "$1").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").replace(/\s+/g, " ").trim();
}

/* ── Text into sentences (for the narrator) ─────────────────────────────── */

const MAX_SENTENCE = 400;

/** Splits text into sentences (decimals such as 2.5 and "Mr." are not ends). */
export function splitSentences(text) {
  const out = [];
  const push = (b) => { if (b.trim()) out.push(b.trim()); };
  for (const line of String(text || "").split(/\n+/)) {
    const chars = [...line];
    let buf = "";
    for (let i = 0; i < chars.length; i += 1) {
      const c = chars[i];
      buf += c;
      let next = chars[i + 1];
      if (/[。！？]/.test(c)) {
        if (!next || !/[。！？」』）]/.test(next)) { push(buf); buf = ""; }
        continue;
      }
      if (!/[.!?]/.test(c)) continue;
      // A closing quote or bracket stays with its sentence.
      while (next && /["”’»)\]]/.test(next)) { buf += next; i += 1; next = chars[i + 1]; }
      if (next !== undefined && !/\s/.test(next)) continue; // 2.5, e.g, "?!"
      if (c === "." && /(?:^|\s)(?:mr|mrs|ms|dr|st|vs|etc|e\.g|i\.e)\.$/i.test(buf.trim())) continue;
      push(buf);
      buf = "";
    }
    push(buf);
  }
  // Very short bits ("Oh!") join the next sentence; very long ones split at commas.
  const joined = [];
  for (const s of out) {
    const prev = joined[joined.length - 1];
    if (prev && prev.length < 4) joined[joined.length - 1] = `${prev} ${s}`;
    else joined.push(s);
  }
  return joined.flatMap((s) => {
    if (s.length <= MAX_SENTENCE) return [s];
    const pieces = [];
    let cur = "";
    for (const w of s.split(/(?<=[,;:])\s+/)) {
      if ((cur + " " + w).length > MAX_SENTENCE && cur) { pieces.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w;
    }
    if (cur) pieces.push(cur);
    return pieces;
  });
}

export default speakMath;

