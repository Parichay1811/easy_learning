// Spoken numbers and units. Whisper may write "seven point five" or "7.5";
// the router wants digits, and the voice wants text it can read aloud.
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };

const bare = (w = '') => w.replace(/[^a-z]/g, '');
const tail = (w = '') => w.match(/[^a-z]*$/)[0];
const isNumWord = (w) => ONES.includes(w) || w in TENS || w === 'hundred' || w === 'thousand';
const digitWord = (w) => { const i = ONES.indexOf(w); return i >= 0 && i < 10 ? i : -1; };

// "a garden twelve by seven point five metres" -> "a garden 12 by 7.5 metres".
// "minus three" becomes "-3" unless it follows a number ("four minus one" is a sum).
// Number words in a row that do not make one number stay apart ("three
// four" is 3 4, not 7), and "the one with..." is a word, not 1.
const PICKS_ONE = new Set(['the', 'this', 'that', 'which', 'each', 'every', 'another', 'any', 'no', 'other', 'a']);
// What may follow what inside one number: "twenty one", "two hundred and five".
const NEXT = {
  digit: new Set([null, 'tens', 'hundred', 'thousand', 'and']),
  teen: new Set([null, 'hundred', 'thousand', 'and']),
  tens: new Set([null, 'hundred', 'thousand', 'and']),
  hundred: new Set(['digit', 'teen', 'tens']),
  thousand: new Set([null, 'digit', 'teen', 'tens', 'hundred']),
};
const kindOf = (w) => (w in TENS ? 'tens' : w === 'hundred' || w === 'thousand' ? w : ONES.indexOf(w) >= 10 ? 'teen' : 'digit');

export function wordsToDigits(text) {
  const words = text.toLowerCase().replace(/([a-z])-([a-z])/g, '$1 $2').split(/\s+/).filter(Boolean);
  const out = [];
  let i = 0;
  while (i < words.length) {
    const first = bare(words[i]);
    const pronoun = first === 'one' && PICKS_ONE.has(bare(words[i - 1])) && !isNumWord(bare(words[i + 1]));
    if (!isNumWord(first) || pronoun) { out.push(words[i]); i++; continue; }
    let total = 0;
    let cur = 0;
    let end = i;
    let punct = '';
    let last = null;
    while (end < words.length) {
      const w = bare(words[end]);
      if (isNumWord(w)) {
        const kind = kindOf(w);
        if (!NEXT[kind].has(last) || w === 'zero' && last) break;
        if (kind === 'tens') cur += TENS[w];
        else if (kind === 'hundred') cur = (cur || 1) * 100;
        else if (kind === 'thousand') { total += (cur || 1) * 1000; cur = 0; }
        else cur += ONES.indexOf(w);
        last = kind;
      } else if (w === 'and' && end > i && isNumWord(bare(words[end + 1])) && (cur >= 100 || total)) last = 'and';
      else break;
      punct = tail(words[end]);
      end++;
      if (punct) break;
    }
    let value = String(total + cur);
    if (!punct && bare(words[end]) === 'point' && digitWord(bare(words[end + 1])) >= 0) {
      let digits = '';
      let j = end + 1;
      while (j < words.length && digitWord(bare(words[j])) >= 0) {
        digits += digitWord(bare(words[j]));
        punct = tail(words[j]);
        j++;
        if (punct) break;
      }
      value += '.' + digits;
      end = j;
    }
    if (!punct && bare(words[end]) === 'and' && bare(words[end + 1]) === 'a' && bare(words[end + 2]) === 'half') {
      value = String(Number(value) + 0.5);
      punct = tail(words[end + 2]);
      end += 3;
    }
    out.push(value + punct);
    i = end;
  }
  const merged = [];
  for (let k = 0; k < out.length; k++) {
    const prev = merged[merged.length - 1];
    if (/^(minus|negative)$/.test(out[k]) && /^\d/.test(out[k + 1] || '') && !/\d[,.]?$/.test(prev || '')) merged.push(`-${out[++k]}`);
    else merged.push(out[k]);
  }
  return merged.join(' ');
}

// 7.50 -> "7.5", 2.999 -> "3". Rounds to dp decimals; a small number keeps
// two significant figures instead (0.075, not 0.08; 0.0016, not 0).
export function fmt(n, dp = 2) {
  if (Math.abs(n) < 1e-9) return '0';
  if (Math.abs(n) < 0.1) return String(Number(n.toPrecision(2)));
  const r = Math.round(n * 10 ** dp) / 10 ** dp;
  return String(Object.is(r, -0) ? 0 : r);
}

// What the voice reads: "minus 3" instead of "-3".
export function sayNum(n, dp = 2) {
  return n < 0 ? `minus ${fmt(-n, dp)}` : fmt(n, dp);
}

const UNIT_WORDS = [
  [/^(mm|millimet(re|er)s?)$/, 'mm'], [/^(cm|centimet(re|er)s?)$/, 'cm'], [/^(km|kilomet(re|er)s?)$/, 'km'],
  [/^(m|met(re|er)s?)$/, 'm'], [/^(inch|inches)$/, 'in'], [/^(ft|feet|foot)$/, 'ft'], [/^(yd|yards?)$/, 'yd'],
];
const UNIT_NAMES = {
  mm: ['mm', 'millimetres'], cm: ['cm', 'centimetres'], m: ['m', 'metres'], km: ['km', 'kilometres'],
  in: ['in', 'inches'], ft: ['ft', 'feet'], yd: ['yd', 'yards'],
};

export function parseUnit(word = '') {
  const w = word.toLowerCase();
  return UNIT_WORDS.find(([re]) => re.test(w))?.[1] || null;
}

// Short and spoken names of a unit, and of its square.
export function units(u) {
  const [short, long] = UNIT_NAMES[u] || ['', 'units'];
  return { key: UNIT_NAMES[u] ? u : null, short, long, sq: short ? `${short}²` : 'sq units', sqLong: `square ${long}` };
}
