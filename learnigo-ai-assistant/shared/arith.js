// Plain arithmetic, worked out in code, never by a model: "what is 7 times 8",
// "20% of 150", "half of 30", "3/4 + 1/8", "square root of 49", "-5 + 3".
// Fractions stay exact (3/4 + 1/8 is 7/8), and a one-step sum comes with the
// easy way to see it ("7 groups of 8").
//   parseArith('what is 7 times 8') -> { expr, value, ... } or null
//   arithPlan(parsed) -> a lesson plan { kind: 'solve', steps }
import { fmt, sayNum } from './numbers.js';

// ---- exact fractions ----
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
function frac(n, d = 1) {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null;
  if (!Number.isInteger(n) || !Number.isInteger(d)) return { n: n / d, d: 1, approx: true };
  const g = gcd(n, d) * Math.sign(d);
  return { n: n / g, d: d / g };
}
const value = (f) => f.n / f.d;
const OPS = {
  '+': (a, b) => (a.approx || b.approx ? frac(value(a) + value(b)) : frac(a.n * b.d + b.n * a.d, a.d * b.d)),
  '-': (a, b) => (a.approx || b.approx ? frac(value(a) - value(b)) : frac(a.n * b.d - b.n * a.d, a.d * b.d)),
  '*': (a, b) => (a.approx || b.approx ? frac(value(a) * value(b)) : frac(a.n * b.n, a.d * b.d)),
  '/': (a, b) => (b.n === 0 ? null : a.approx || b.approx ? frac(value(a) / value(b)) : frac(a.n * b.d, a.d * b.n)),
  '^': (a, b) => {
    if (b.d !== 1 || Math.abs(b.n) > 12 || a.approx) return frac(value(a) ** value(b));
    const p = Math.abs(b.n);
    const f = frac(a.n ** p, a.d ** p);
    return b.n < 0 ? OPS['/'](frac(1), f) : f;
  },
};

// Tokens to a value: numbers, + - * / ^, brackets and sqrt, usual precedence.
function evaluate(tokens) {
  let i = 0;
  const peek = () => tokens[i];
  function primary() {
    const t = tokens[i++];
    if (t === '(') { const v = sum(); if (tokens[i++] !== ')') throw new Error(')'); return v; }
    if (t === 'sqrt') { const v = power(); if (!v || value(v) < 0) throw new Error('sqrt'); return frac(Math.sqrt(value(v))); }
    if (t === '-') { const v = power(); return v && OPS['-'](frac(0), v); }
    if (typeof t === 'number') return t % 1 ? decimal(t) : frac(t);
    throw new Error(`unexpected ${t}`);
  }
  function power() { const b = primary(); if (peek() === '^') { i++; return OPS['^'](b, power()); } return b; }
  function product() { let v = power(); while (peek() === '*' || peek() === '/') { const op = tokens[i++]; v = v && OPS[op](v, power()); } return v; }
  function sum() { let v = product(); while (peek() === '+' || peek() === '-') { const op = tokens[i++]; v = v && OPS[op](v, product()); } return v; }
  const v = sum();
  if (i !== tokens.length || !v) return null;
  return v;
}
// 0.25 -> 1/4 exactly (up to 6 decimals).
function decimal(x) {
  const places = Math.min(6, (String(x).split('.')[1] || '').length);
  return frac(Math.round(x * 10 ** places), 10 ** places);
}

// ---- words to tokens ----
const ASK = /^(?:(?:so|ok(?:ay)?|hey|please|teacher)\s+)*(?:what(?:'s| is)|whats|how much is|calculate|work out|can you (?:work out|calculate|tell me)|tell me|find|solve|do)\s+/;
const PHRASES = [
  [/\b(\d+(?:\.\d+)?)\s*(?:%|percent|per cent)\s+of\b/g, '( $1 / 100 ) *'],
  [/\b(?:a\s+)?half of\b/g, '1 / 2 *'], [/\b(?:a\s+)?quarter of\b/g, '1 / 4 *'], [/\b(?:a\s+)?third of\b/g, '1 / 3 *'],
  [/\bdouble\b/g, '2 *'], [/\btriple\b/g, '3 *'],
  [/\b(?:the\s+)?square root of\b/g, 'sqrt'], [/\bsquared\b/g, '^ 2'], [/\bcubed\b/g, '^ 3'],
  [/\bto the power of\b|\bto the\b|\braised to\b/g, '^'],
  [/\bsubtract (-?[\d.]+) from (-?[\d.]+)/g, '$2 - $1'], [/\btake (-?[\d.]+) (?:away )?from (-?[\d.]+)/g, '$2 - $1'],
  [/\badd (-?[\d.]+) (?:and|to) (-?[\d.]+)/g, '$1 + $2'],
  [/\bmultiplied by\b|\btimes\b|\bx\b|×|\*/g, '*'], [/\bdivided by\b|\bover\b|÷|\//g, '/'],
  [/\bplus\b|\badd\b|\+/g, '+'], [/\bminus\b|\btake away\b|−/g, '-'],
];

export function parseArith(text) {
  let t = String(text || '').toLowerCase().replace(/[?!.]+\s*$/, '').replace(/[“”"]/g, '').replace(/(\d),(?=\d{3}\b)/g, '$1').trim();
  t = t.replace(ASK, '').replace(/\s*=\s*$/, '').trim();
  if (!/\d/.test(t)) return null;
  const said = t;
  t = t.replace(/\b(\d+)\s*\/\s*(\d+) of\b/g, '( $1 / $2 ) *'); // "1/3 of 12"
  for (const [re, to] of PHRASES) t = t.replace(re, ` ${to} `);
  t = t.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').replace(/(\d)-(?=\d)/g, '$1 - ').replace(/\s+/g, ' ').trim();
  const parts = t.split(' ');
  // Only numbers and maths: any other word ("7 x 8 garden") is not a sum.
  if (!parts.every((p) => /^-?\d+(\.\d+)?$/.test(p) || ['+', '-', '*', '/', '^', '(', ')', 'sqrt'].includes(p))) return null;
  const tokens = parts.flatMap((p) => (/^-\d/.test(p) ? ['-', Number(p.slice(1))] : /^\d/.test(p) ? [Number(p)] : [p]));
  const nums = tokens.filter((x) => typeof x === 'number');
  const ops = tokens.filter((x) => typeof x === 'string' && x !== '(' && x !== ')');
  // A number alone, or a minus sign alone, is not a sum to work out.
  if (!ops.length || ops.every((o) => o === '-') && nums.length === 1) return null;
  // Fractions ("3/4 + 1/8") are answered as fractions; decimals as decimals.
  // One number over another on its own ("12 / 5") is a division.
  const fractions = ops.includes('/') && nums.every(Number.isInteger) && !said.includes('divided') && tokens.length > 3;
  const zero = tokens.some((x, i) => x === '/' && tokens[i + 1] === 0);
  if (zero) return { said, tokens, result: null, fractions, zero };
  let result;
  try { result = evaluate(tokens); } catch { return null; }
  if (!result) return null;
  return { said, tokens, result, fractions };
}

// ---- saying it ----
const WORD = { '+': 'plus', '-': 'minus', '*': 'times', '/': 'divided by', '^': 'to the power of' };
const SIGN = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^' };
const minus = (t) => String(t).replace(/^-/, '−');
const showFrac = (f, asFraction) => minus(f.approx || f.d === 1 || !asFraction ? fmt(value(f), 4) : `${f.n}/${f.d}`);
const sayFrac = (f, asFraction) => {
  if (f.approx || f.d === 1 || !asFraction) return sayNum(value(f), 4);
  return `${f.n < 0 ? 'minus ' : ''}${Math.abs(f.n)} over ${f.d}`;
};
// The sum as words and as symbols, with "a / b" as one fraction when the
// question was in fractions, brackets kept ("3 plus 4, all times 2") and
// powers of 2 and 3 said the usual way ("5 squared").
function pieces(tokens, fractions) {
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    const x = tokens[i];
    if (fractions && typeof x === 'number' && tokens[i + 1] === '/' && typeof tokens[i + 2] === 'number' && tokens[i - 1] !== '^') {
      out.push({ w: `${x}/${tokens[i + 2]}`, s: `${x} over ${tokens[i + 2]}` });
      i += 2;
    } else if (x === '^' && (tokens[i + 1] === 2 || tokens[i + 1] === 3)) {
      out.push({ w: tokens[i + 1] === 2 ? '²' : '³', s: tokens[i + 1] === 2 ? 'squared' : 'cubed', tight: true });
      i++;
    } else if (typeof x === 'number') out.push({ w: fmt(x, 6), s: sayNum(x, 6) });
    else if (x === 'sqrt') out.push({ w: '√', s: 'the square root of', open: true });
    else if (x === '(') out.push({ w: '(', s: '', open: true });
    else if (x === ')') out.push({ w: ')', s: typeof tokens[i + 1] === 'string' && tokens[i + 1] !== ')' ? ', all' : '', tight: true });
    else if (x === '-' && (i === 0 || typeof tokens[i - 1] === 'string' && tokens[i - 1] !== ')')) out.push({ w: '−', s: 'minus', open: true });
    else out.push({ w: SIGN[x] || x, s: WORD[x] || x });
  }
  return out;
}
const written = (tokens, fractions) => pieces(tokens, fractions).reduce((acc, p, i, all) => acc + (i && !p.tight && !all[i - 1].open ? ' ' : '') + p.w, '');
const spoken = (tokens, fractions) => pieces(tokens, fractions).map((p) => p.s).join(' ').replace(/ ,/g, ',').replace(/\s+/g, ' ').trim();

// The easy way to see a one-step sum of two numbers, if there is one.
function howTo(tokens, r, fractions) {
  const [a, op, b] = tokens;
  // a/b + c/d: the same bottom number first.
  if (fractions && tokens.length === 7 && tokens[1] === '/' && tokens[5] === '/' && ['+', '-'].includes(tokens[3])) {
    const [n1, , d1, sign, n2, , d2] = tokens;
    if (d1 === d2) return `The bottom numbers are the same, so ${sign === '+' ? 'add' : 'take away'} the top numbers: ${n1} ${WORD[sign]} ${n2} is ${n1 + (sign === '+' ? n2 : -n2)}.`;
    const l = (d1 * d2) / gcd(d1, d2);
    const [t1, t2] = [n1 * (l / d1), n2 * (l / d2)];
    const moved = [d1 !== l && `${n1}/${d1} is ${t1}/${l}`, d2 !== l && `${n2}/${d2} is ${t2}/${l}`].filter(Boolean).join(', and ');
    return `To ${sign === '+' ? 'add' : 'take away'} fractions, make the bottom numbers the same. Both go into ${l}: ${moved}. Then ${t1} ${WORD[sign]} ${t2} is ${t1 + (sign === '+' ? t2 : -t2)}, over ${l}.`;
  }
  if (tokens[0] === 'sqrt' && typeof tokens[1] === 'number' && tokens.length === 2) {
    const n = tokens[1];
    const root = Math.sqrt(n);
    return Number.isInteger(root) ? `The square root of ${n} is the number that times itself makes ${n}. ${root} times ${root} is ${n}.` : `No whole number times itself makes ${n}, so its square root is a decimal, about ${fmt(root, 3)}.`;
  }
  if (tokens.length !== 3 || typeof a !== 'number' || typeof b !== 'number') return '';
  const res = sayFrac(r, fractions);
  if (op === '+' && a >= 0 && b >= 0 && b <= 20 && Number.isInteger(b)) return `Start at ${fmt(a)} and count on ${fmt(b)}: you land on ${res}.`;
  if (op === '-' && a >= 0 && b >= 0 && b <= 20 && Number.isInteger(b)) return `Start at ${fmt(a)} and count back ${fmt(b)}: you land on ${res}.`;
  if (op === '*' && Number.isInteger(a) && Number.isInteger(b) && a > 0 && b > 0 && a <= 12 && b <= 12) return `Think of it as ${a} groups of ${b}. Count them up and there are ${res}.`;
  if (op === '/' && Number.isInteger(a) && Number.isInteger(b) && b > 0 && a % b === 0 && a >= 0) return `Share ${a} into ${b} equal groups, and each group gets ${res}.`;
  if (op === '^' && b === 2) return `${fmt(a)} squared means ${fmt(a)} times ${fmt(a)}, which is ${res}.`;
  return '';
}

export function arithPlan({ said, tokens, result, fractions, zero }) {
  if (zero) {
    return {
      kind: 'solve', title: 'Dividing by zero', context: { offer: 'test' },
      steps: [{ say: `That one has no answer: you cannot divide by zero. Sharing something into zero groups does not make sense, because there are no groups to put anything in.`,
        draw: [{ op: 'clear' }, { op: 'title', text: 'Dividing by zero' }, { op: 'formula', text: `${written(tokens, false)} = ?` }, { op: 'note', text: 'No answer: you cannot share into 0 groups.' }] }],
    };
  }
  const answer = sayFrac(result, fractions);
  const pct = said.match(/^(\d+(?:\.\d+)?)\s*(?:%|percent|per cent) of (\d+(?:\.\d+)?)$/);
  const part = said.match(/^(?:a\s+)?(half|quarter|third) of (\d+(?:\.\d+)?)$/);
  const fracOf = said.match(/^(\d+)\s*\/\s*(\d+) of (\d+(?:\.\d+)?)$/);
  const words = spoken(tokens, fractions);
  let say = `${words}${words.includes(', all') ? ',' : ''} is ${answer}.`;
  let tip = howTo(tokens, result, fractions);
  if (pct) {
    say = `${pct[1]} percent of ${pct[2]} is ${answer}.`;
    tip = `Percent means out of a hundred. One percent of ${pct[2]} is ${fmt(pct[2] / 100, 4)}, so ${pct[1]} percent is ${pct[1]} times that.`;
  } else if (fracOf) {
    const [, n, d, m] = fracOf;
    say = `${n}/${d} of ${m} is ${answer}.`;
    tip = `Split ${m} into ${d} equal parts, and each part is ${fmt(m / d, 4)}. ${n === '1' ? 'One part' : `${n} parts`} make${n === '1' ? 's' : ''} ${answer}.`;
  } else if (part) {
    const into = { half: 2, quarter: 4, third: 3 }[part[1]];
    say = `A ${part[1]} of ${part[2]} is ${answer}.`;
    tip = `A ${part[1]} means splitting into ${into} equal parts: ${part[2]} divided by ${into}.`;
  }
  const decimalToo = fractions && !result.approx && result.d !== 1 ? ` That is about ${fmt(value(result), 3)} as a decimal.` : '';
  const shown = showFrac(result, fractions);
  return {
    kind: 'solve', title: 'Working it out', context: { offer: 'test' },
    steps: [{
      say: `${say.charAt(0).toUpperCase()}${say.slice(1)} ${tip}${decimalToo}`.replace(/\s+/g, ' ').trim(),
      draw: [{ op: 'clear' }, { op: 'title', text: 'Working it out' },
        { op: 'formula', text: `${pct ? `${pct[1]}% of ${pct[2]}` : part ? `${part[1]} of ${part[2]}` : fracOf ? `${fracOf[1]}/${fracOf[2]} of ${fracOf[3]}` : written(tokens, fractions)} = ${shown}` },
        { op: 'bignum', value: shown.slice(0, 16), label: decimalToo ? `about ${fmt(value(result), 3)}` : 'the answer' }],
    }],
  };
}
