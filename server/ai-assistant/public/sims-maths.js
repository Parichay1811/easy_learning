// Maths pictures for the board, from the first counting lesson to university:
// number bonds, place value, arrays and the clock for the youngest; fractions,
// ratio, graphs, geometry and trigonometry in the middle years; statistics,
// calculus, complex numbers, matrices and algorithms at the top. Each one is a
// single idea that builds itself while the step is spoken (on t) and then
// keeps moving on the board clock, so the student sees the idea at work, with
// the real numbers on screen. A function of time only, plain canvas calls:
// cheap enough for 60 fps on a phone. board.js passes its drawing kit in.

export const MATHS_SIMS = {
  'number-bonds': { title: 'Number bonds', keywords: ['number bonds', 'number bond', 'bonds to 10', 'pairs that make 10', 'make ten', 'part whole model'], example: { n: 10 } },
  'place-value': { title: 'Place value', keywords: ['place value', 'hundreds tens and ones', 'tens and ones', 'value of the digit', 'hundreds column', 'tens column'], example: { n: 347 } },
  arrays: { title: 'Arrays and multiplication', keywords: ['array', 'arrays', 'rows of', 'rows and columns', 'repeated addition', 'times tables'], example: { r: 3, c: 4 } },
  'fraction-wall': { title: 'Fraction wall', keywords: ['fraction wall', 'unit fraction', 'unit fractions', 'comparing fractions', 'ordering fractions'], example: {} },
  'equivalent-fractions': { title: 'Equivalent fractions', keywords: ['equivalent fractions', 'equivalent fraction', 'simplify fractions', 'simplest form', 'same fraction'], example: { n: 1, d: 2 } },
  'percent-grid': { title: 'Percentages on a hundred square', keywords: ['percentage', 'percentages', 'percent', 'per cent', 'hundred square', 'out of 100'], example: { p: 37 } },
  'ratio-bar': { title: 'Sharing in a ratio', keywords: ['ratio', 'share in the ratio', 'divide in a ratio', 'bar model', 'proportion'], example: { a: 2, b: 3, total: 40 } },
  'negative-numbers': { title: 'Negative numbers', keywords: ['negative numbers', 'negative number', 'below zero', 'minus numbers', 'integers', 'temperature drops'], example: { start: 3, change: -7 } },
  'order-of-operations': { title: 'Order of operations', keywords: ['order of operations', 'bidmas', 'bodmas', 'pemdas', 'brackets first'], example: { expr: '3 + 4 × (6 − 2)²' } },
  'linear-graph': { title: 'Straight-line graphs', keywords: ['straight line graph', 'y = mx + c', 'gradient', 'y-intercept', 'linear graph', 'linear function'], example: { m: 2, c: 1 } },
  quadratic: { title: 'Quadratic graphs', keywords: ['quadratic', 'parabola', 'roots of the quadratic', 'turning point', 'axis of symmetry', 'completing the square'], example: { a: 1, b: -2, c: -3 } },
  simultaneous: { title: 'Simultaneous equations', keywords: ['simultaneous equations', 'simultaneous', 'point of intersection', 'solve both equations', 'pair of equations'], example: { m1: 2, c1: -1, m2: -1, c2: 5 } },
  inequality: { title: 'Inequalities', keywords: ['inequality', 'inequalities', 'less than or equal', 'greater than or equal', 'shaded region', 'open circle'], example: { lo: -2, hi: 3, loIn: false, hiIn: true, m: 2, c: 1, sign: '<' } },
  exponential: { title: 'Exponential growth and decay', keywords: ['exponential', 'exponential growth', 'exponential decay', 'doubling', 'half-life', 'halving'], example: { r: 2 } },
  'transformations-graph': { title: 'Transforming graphs', keywords: ['graph transformations', 'transforming graphs', 'f(x) + a', 'f(x + a)', 'stretch of the graph', 'translation of the graph'], example: { f: 'x^2' } },
  sequence: { title: 'Sequences and the nth term', keywords: ['nth term', 'sequence', 'arithmetic sequence', 'term-to-term', 'linear sequence', 'pattern of dots'], example: { d: 3, c: 1 } },
  pythagoras: { title: "Pythagoras' theorem", keywords: ['pythagoras', 'hypotenuse', 'a squared plus b squared', 'pythagorean', 'right-angled triangle'], example: { a: 3, b: 4 } },
  'angles-parallel': { title: 'Angles in parallel lines', keywords: ['parallel lines', 'corresponding angles', 'alternate angles', 'co-interior', 'transversal', 'vertically opposite'], example: { angle: 65 } },
  'polygon-angles': { title: 'Angles in polygons', keywords: ['interior angles', 'sum of interior angles', 'polygon', 'exterior angles', 'hexagon', 'pentagon'], example: { n: 6 } },
  'circle-theorem': { title: 'Circle theorem: angle at the centre', keywords: ['circle theorem', 'circle theorems', 'angle at the centre', 'angle at the circumference', 'subtended', 'same segment'], example: { angle: 50 } },
  transformations: { title: 'Transformations of shapes', keywords: ['translation', 'rotation', 'reflection', 'enlargement', 'mirror line', 'centre of rotation', 'transformations'], example: {} },
  'circle-area': { title: 'Area of a circle', keywords: ['area of a circle', 'pi r squared', 'πr²', 'circumference', 'radius', 'sectors'], example: { r: 3 } },
  'volume-prism': { title: 'Volume of a prism', keywords: ['volume', 'prism', 'cylinder', 'cross-section', 'cross section', 'cubic centimetres'], example: { shape: 'triangle' } },
  'similar-shapes': { title: 'Similar shapes', keywords: ['similar shapes', 'similar triangles', 'scale factor', 'area scale factor', 'enlarged by'], example: { k: 2 } },
  'trig-ratios': { title: 'Trigonometric ratios', keywords: ['sohcahtoa', 'soh cah toa', 'trigonometric ratios', 'opposite side', 'adjacent side', 'sin cos tan', 'right-angled trigonometry'], example: { angle: 37 } },
  'unit-circle': { title: 'The unit circle', keywords: ['unit circle', 'sine wave', 'cosine wave', 'sine graph', 'radians', 'periodic function'], example: {} },
  'sine-cosine-rule': { title: 'Sine rule and cosine rule', keywords: ['sine rule', 'cosine rule', 'non-right-angled', 'law of sines', 'law of cosines'], example: { a: 7, b: 5, c: 8 } },
  bearings: { title: 'Bearings', keywords: ['bearing', 'bearings', 'three-figure bearing', 'clockwise from north', 'compass'], example: { bearing: 65 } },
  'probability-tree': { title: 'Probability tree diagram', keywords: ['tree diagram', 'probability tree', 'independent events', 'multiply the probabilities', 'dependent events', 'and rule'], example: { p: 0.3, q: 0.6 } },
  'relative-frequency': { title: 'Relative frequency', keywords: ['relative frequency', 'experimental probability', 'theoretical probability', 'flip a coin', 'roll a dice', 'number of trials'], example: { mode: 'coin' } },
  'histogram-boxplot': { title: 'Histogram and box plot', keywords: ['box plot', 'box and whisker', 'quartile', 'interquartile range', 'histogram', 'median'], example: { data: [4, 7, 8, 11, 12, 13, 15, 16, 18, 19, 21, 23, 24, 28, 33] } },
  scatter: { title: 'Scatter graphs and correlation', keywords: ['scatter graph', 'scatter plot', 'correlation', 'line of best fit', 'positive correlation', 'negative correlation'], example: {} },
  'normal-distribution': { title: 'Normal distribution', keywords: ['normal distribution', 'bell curve', 'standard deviation', 'z-score', '68%', '95%'], example: { mean: 100, sd: 15 } },
  derivative: { title: 'The derivative', keywords: ['derivative', 'differentiation', 'differentiate', 'gradient of the curve', 'tangent to the curve', 'rate of change', 'dy/dx'], example: { f: 'x^3 - 3x' } },
  integral: { title: 'The integral as an area', keywords: ['integral', 'integration', 'integrate', 'area under the curve', 'riemann sum', 'definite integral'], example: { f: '0.5x^2 + 1', a: 0, b: 3 } },
  limits: { title: 'Limits', keywords: ['limit', 'limits', 'tends to', 'as x approaches', 'approaches', 'continuity'], example: { f: '(x^2 - 1)/(x - 1)', a: 1 } },
  'complex-plane': { title: 'Complex numbers on the Argand diagram', keywords: ['complex number', 'complex numbers', 'argand diagram', 'imaginary', 'modulus', 'real part'], example: { re: 3, im: 2 } },
  'matrix-transform': { title: 'Matrices as transformations', keywords: ['matrix', 'matrices', 'determinant', 'linear transformation', 'transformation matrix', 'eigenvector'], example: { m: [[2, 1], [0, 1]] } },
  'speed-distance-time': { title: 'Speed, distance and time', keywords: ['speed distance time', 'distance-time graph', 'distance time graph', 'average speed', 'km/h', 'travel graph'], example: {} },
  'compound-interest': { title: 'Simple and compound interest', keywords: ['compound interest', 'simple interest', 'interest rate', 'per annum', 'depreciation', 'savings account'], example: { P: 1000, r: 10, n: 8 } },
  clock: { title: 'Telling the time', keywords: ['telling the time', "o'clock", 'half past', 'quarter past', 'quarter to', 'minute hand', 'hour hand'], example: { time: '3:40' } },
  'shortest-path': { title: "Shortest path (Dijkstra's algorithm)", keywords: ['shortest path', 'dijkstra', 'weighted graph', 'shortest route', 'network', 'graph theory'], example: {} },
  'newton-raphson': { title: 'Newton–Raphson method', keywords: ['newton-raphson', 'newton raphson', 'iterative method', 'iteration', 'numerical method', 'approximate root'], example: { f: 'x^2 - 2', x0: 3 } },
  counting: { title: 'Counting in tens and ones', keywords: ['counting', 'count to', 'ten frame', 'how many', 'count in tens', 'count the objects'], example: { n: 23 } },
};

const TAU = Math.PI * 2;
const MINUS = '−';
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻', '−': '⁻', n: 'ⁿ', x: 'ˣ' };
const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉', '+': '₊', n: 'ₙ' };
const sup = (s) => String(s).replace(/./g, (ch) => SUP[ch] ?? ch);
const sub = (s) => String(s).replace(/./g, (ch) => SUB[ch] ?? ch);
// Numbers as a teacher writes them: no trailing zeros, a real minus sign.
const fmt = (n, dp = 2) => {
  if (!Number.isFinite(n)) return n > 0 ? '∞' : n < 0 ? `${MINUS}∞` : '?';
  let r = +n.toFixed(dp);
  if (Math.abs(r) < 1e-12) r = 0;
  return String(r).replace('-', MINUS);
};
const fix = (n, dp = 2) => (Math.abs(n) < 0.5 * 10 ** -dp ? 0 : n).toFixed(dp).replace('-', MINUS);
const num = (v, d) => { if (v == null || v === '') return d; const x = typeof v === 'string' ? parseFloat(v.replace(MINUS, '-')) : +v; return Number.isFinite(x) ? x : d; };
const group = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const money = (x, unit = '£') => { const [i, d] = Math.abs(x).toFixed(2).split('.'); return `${x < 0 ? MINUS : ''}${unit}${group(i)}.${d}`; };
// Deterministic pseudo-random in [0, 1) from an index: the same toss every frame.
const rnd = (i, s = 0) => {
  let h = (Math.imul(i + 1, 374761393) + Math.imul(s + 7, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
// A term of a polynomial in x, signs written properly: poly([[1, 2], [-2, 1], [-3, 0]]) = "x² − 2x − 3".
const poly = (cs, dp = 2) => {
  let out = '';
  for (const [k, p] of cs) {
    if (Math.abs(k) < 1e-12) continue;
    const a = Math.abs(k);
    const sign = k < 0 ? (out ? ` ${MINUS} ` : MINUS) : out ? ' + ' : '';
    const coef = p === 0 || Math.abs(a - 1) > 1e-12 ? fmt(a, dp) : '';
    out += sign + coef + (p === 0 ? '' : p === 1 ? 'x' : `x${sup(p)}`);
  }
  return out || '0';
};
const pretty = (s) => String(s).replace(/\s+/g, ' ').replace(/\*\*/g, '^').replace(/\^\(?(-?\d+)\)?/g, (_, d) => sup(d)).replace(/(\d)\s*\*\s*(\d)/g, '$1 × $2').replace(/\*/g, '').replace(/-/g, MINUS);

// A tiny safe expression compiler for f(x): + − × ÷ ^, brackets, implicit
// multiplication (2x, 3sin(x)), sin cos tan exp ln log sqrt abs, pi, e.
// Recursive descent, no eval. Returns a function of x or null.
function compile(src) {
  if (typeof src === 'function') return src;
  const s = String(src ?? '').toLowerCase().replace(/^\s*(y|f\(x\))\s*=/, '').replace(/\s+/g, '').replace(/[×·]/g, '*').replace(/÷/g, '/')
    .replace(/[−–]/g, '-').replace(/²/g, '^2').replace(/³/g, '^3').replace(/π/g, 'pi').replace(/√/g, 'sqrt').replace(/\*\*/g, '^');
  if (!s || s.length > 80) return null;
  let i = 0;
  const NAMES = ['sqrt', 'sin', 'cos', 'tan', 'exp', 'abs', 'ln', 'log', 'pi', 'x', 'e'];
  const FN = { sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, exp: Math.exp, abs: Math.abs, ln: Math.log, log: Math.log10 };
  const fail = () => { throw new Error('bad expression'); };
  const startsAtom = () => /[0-9.a-z(]/.test(s[i] || '');
  function expr() { let l = term(); while (s[i] === '+' || s[i] === '-') { const op = s[i++]; const a = l; const b = term(); l = op === '+' ? (x) => a(x) + b(x) : (x) => a(x) - b(x); } return l; }
  function term() {
    let l = unary();
    for (;;) {
      if (s[i] === '*' || s[i] === '/') { const op = s[i++]; const a = l; const b = unary(); l = op === '*' ? (x) => a(x) * b(x) : (x) => a(x) / b(x); }
      else if (startsAtom()) { const a = l; const b = power(); l = (x) => a(x) * b(x); }
      else return l;
    }
  }
  function unary() { if (s[i] === '-') { i++; const a = unary(); return (x) => -a(x); } if (s[i] === '+') { i++; return unary(); } return power(); }
  function power() { const a = atom(); if (s[i] === '^') { i++; const b = unary(); return (x) => a(x) ** b(x); } return a; }
  function atom() {
    if (s[i] === '(') { i++; const e = expr(); if (s[i] !== ')') fail(); i++; return e; }
    const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
    if (m) { i += m[0].length; const v = +m[0]; return () => v; }
    const name = NAMES.find((n) => s.startsWith(n, i));
    if (!name) fail();
    i += name.length;
    if (name === 'x') return (x) => x;
    if (name === 'pi') return () => Math.PI;
    if (name === 'e') return () => Math.E;
    const f = FN[name]; const arg = atom();
    return (x) => f(arg(x));
  }
  try { const f = expr(); if (i !== s.length) return null; f(0.5); return f; } catch { return null; }
}
const slope = (f, x) => { const h = 1e-4 * Math.max(1, Math.abs(x)); return (f(x + h) - f(x - h)) / (2 * h); };

// An arithmetic expression worked step by step in BIDMAS order: the line
// before each step, which part is worked out, the rule, and the result.
const OPW = { I: 'Indices', D: 'Division', M: 'Multiplication', A: 'Addition', S: 'Subtraction' };
const OPS = { '*': '×', '/': '÷', '-': MINUS, '+': '+', '(': '(', ')': ')' };
function bidmas(src) {
  const s = String(src ?? '').replace(/\s+/g, '').replace(/[×x*·]/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/²/g, '^2').replace(/³/g, '^3').replace(/[[{]/g, '(').replace(/[\]}]/g, ')');
  if (!s || s.length > 60) return null;
  const toks = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    const prev = toks[toks.length - 1];
    const unary = ch === '-' && (!prev || (prev.o && prev.o !== ')'));
    const m = /^-?\d+(\.\d+)?/.exec(s.slice(i));
    if (m && (ch !== '-' || unary)) {
      if (prev && (prev.v != null || prev.o === ')')) toks.push({ o: '*' });
      toks.push({ v: +m[0] }); i += m[0].length; continue;
    }
    if ('+-*/^()'.includes(ch)) {
      if (ch === '(' && prev && (prev.v != null || prev.o === ')')) toks.push({ o: '*' });
      toks.push({ o: ch }); i++; continue;
    }
    return null;
  }
  const steps = [];
  const clone = () => toks.map((tk) => ({ ...tk }));
  for (let guard = 0; guard < 40; guard++) {
    if (toks.length === 1 && toks[0].v != null) { steps.push({ toks: clone() }); break; }
    let l = -1; let r = -1;
    for (let k = 0; k < toks.length; k++) { if (toks[k].o === '(') l = k; if (toks[k].o === ')') { r = k; break; } }
    if ((l >= 0) !== (r >= 0) || r < l) return null;
    const lo = l + 1; const hi = r >= 0 ? r : toks.length;
    if (r >= 0 && hi - lo === 1) {
      const v = toks[lo]; if (v.v == null) return null;
      v.par = v.v < 0 && toks[r + 1]?.o === '^';
      toks.splice(r, 1); toks.splice(l, 1); continue;
    }
    let j = -1;
    for (let k = hi - 1; k >= lo; k--) if (toks[k].o === '^') { j = k; break; }
    if (j < 0) for (let k = lo; k < hi; k++) if (toks[k].o === '*' || toks[k].o === '/') { j = k; break; }
    if (j < 0) for (let k = lo; k < hi; k++) if (toks[k].o === '+' || toks[k].o === '-') { j = k; break; }
    if (j < 1 || toks[j - 1].v == null || toks[j + 1]?.v == null) return null;
    const a = toks[j - 1].v; const b = toks[j + 1].v; const op = toks[j].o;
    const v = op === '^' ? a ** b : op === '*' ? a * b : op === '/' ? a / b : op === '+' ? a + b : a - b;
    if (!Number.isFinite(v)) return null;
    const rule = { '^': 'I', '*': 'M', '/': 'D', '+': 'A', '-': 'S' }[op];
    const work = op === '^' ? `${fmt(a, 3)}${sup(fmt(b, 3))}` : `${fmt(a, 3)} ${OPS[op]} ${fmt(b, 3)}`;
    steps.push({ toks: clone(), hi: [j - 1, j + 1], rule, br: l >= 0, say: `${l >= 0 ? 'Brackets first' : OPW[rule]}: ${work} = ${fmt(v, 3)}` });
    toks.forEach((tk) => delete tk.res);
    toks.splice(j - 1, 3, { v: +v.toFixed(10), res: true });
  }
  return steps.length > 1 && steps.length <= 9 ? steps : null;
}

// Dijkstra on a small weighted network, recorded step by step for the picture.
function dijkstra(nodes, edges, from, to) {
  const n = nodes.length;
  const dist = Array(n).fill(Infinity); const prev = Array(n).fill(-1); const done = Array(n).fill(false);
  dist[from] = 0;
  const steps = [];
  for (let k = 0; k < n; k++) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || dist[u] === Infinity) break;
    done[u] = true;
    const relaxed = [];
    edges.forEach(([p, q, w], e) => {
      const v = p === u ? q : q === u ? p : -1;
      if (v < 0 || done[v]) return;
      relaxed.push(e);
      if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
    });
    steps.push({ u, dist: dist.slice(), relaxed, done: done.slice() });
  }
  const route = [];
  for (let v = to; v >= 0; v = prev[v]) route.unshift(v);
  return { steps, route, total: dist[to] };
}

export function mathsSims(kit) {
  const { FIG, COLORS, HUES, FONT, glow, label, wrapLabel, rounded, arrow, clamp, easeOut, outBack, color, tint } = kit;
  const cx = FIG.x + FIG.w / 2;
  const cy = FIG.y + FIG.h / 2;
  const RX = FIG.x + FIG.w;
  const BY = FIG.y + FIG.h;
  const BG = '#050816';
  const S = {};

  // Time: entrances on t, loops on the clock, everything a function of time.
  const ramp = (t, a = 0, d = 0.4) => easeOut(clamp((t - a) / d));
  const pop = (t, a = 0, d = 0.4) => outBack(clamp((t - a) / d));
  const inOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
  const loop = (clock, period) => (((clock % period) + period) % period) / period;
  const slot = (clock, n, dur) => { const s = loop(clock, n * dur) * n; const i = Math.min(n - 1, Math.floor(s)); return { i, f: s - i }; };
  const edge = (f, d = 0.1) => Math.min(clamp(f / d), clamp((1 - f) / d));
  const hold = (f, a, b, c, d) => inOut(clamp((f - a) / (b - a))) * (1 - inOut(clamp((f - c) / (d - c))));
  const lerp = (a, b, p) => a + (b - a) * p;
  const alpha = (ctx, a) => { ctx.globalAlpha *= clamp(a); };

  // Drawing bits.
  const title = (ctx, text, fill = 'ink', size = 26, y = FIG.y + 34) => label(ctx, text, cx, y, { size, weight: 700, fill });
  const dot = (ctx, x, y, r, c) => { ctx.fillStyle = color(c); ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); ctx.fill(); };
  const ring = (ctx, x, y, r, c, w = 3, fill = BG) => { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); if (fill) { ctx.fillStyle = fill; ctx.fill(); } ctx.strokeStyle = color(c); ctx.lineWidth = w; ctx.stroke(); };
  const seg = (ctx, x0, y0, x1, y1, c, w = 2, dash) => { ctx.strokeStyle = color(c); ctx.lineWidth = w; if (dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); if (dash) ctx.setLineDash([]); };
  const path = (ctx, pts, close = true) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); if (close) ctx.closePath(); };
  const shape = (ctx, pts, c, a = 0.3, w = 3) => { path(ctx, pts); ctx.fillStyle = tint(c, a); ctx.fill(); ctx.strokeStyle = color(c); ctx.lineWidth = w; ctx.stroke(); };
  const panel = (ctx, x, y, w, h, c = 'rgba(140,170,255,0.22)') => { ctx.fillStyle = 'rgba(255,255,255,0.035)'; ctx.strokeStyle = c; ctx.lineWidth = 1.5; rounded(ctx, x, y, w, h, 14); ctx.fill(); ctx.stroke(); };
  // A line of text in coloured pieces, centred on x: [['3²', 'blue'], [' + ', 'ink'], ...].
  const parts = (ctx, list, x, y, size = 26, weight = 700, align = 'center') => {
    ctx.font = `${weight} ${size}px ${FONT}`;
    const ws = list.map(([s]) => ctx.measureText(String(s)).width);
    const W = ws.reduce((a, w) => a + w, 0);
    let px = align === 'center' ? x - W / 2 : align === 'right' ? x - W : x;
    list.forEach(([s, c], i) => { label(ctx, String(s), px, y, { size, weight, fill: c || 'ink', align: 'left' }); px += ws[i]; });
    return W;
  };
  // A curly brace from x0 to x1 at y, its tip pointing up (dir −1) or down (dir 1).
  const brace = (ctx, x0, x1, y, dir, c, w = 2.5) => {
    const d = 10 * dir; const xm = (x0 + x1) / 2; const k = Math.min(12, (x1 - x0) / 4);
    ctx.strokeStyle = color(c); ctx.lineWidth = w; ctx.beginPath();
    ctx.moveTo(x0, y); ctx.quadraticCurveTo(x0, y + d, x0 + k, y + d); ctx.lineTo(xm - k, y + d); ctx.quadraticCurveTo(xm, y + d, xm, y + 2 * d);
    ctx.quadraticCurveTo(xm, y + d, xm + k, y + d); ctx.lineTo(x1 - k, y + d); ctx.quadraticCurveTo(x1, y + d, x1, y); ctx.stroke();
  };
  // An angle mark: a filled wedge with an arc, from a0 to a1 (canvas radians).
  const wedge = (ctx, x, y, r, a0, a1, c, fa = 0.25, ccw = false) => {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, a0, a1, ccw); ctx.closePath(); ctx.fillStyle = tint(c, fa); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, a0, a1, ccw); ctx.strokeStyle = color(c); ctx.lineWidth = 3; ctx.stroke();
  };
  const rightMark = (ctx, x, y, ux, uy, vx, vy, s = 18, c = 'rgba(220,230,255,0.8)') => { path(ctx, [[x + ux * s, y + uy * s], [x + ux * s + vx * s, y + uy * s + vy * s], [x + vx * s, y + vy * s]], false); ctx.strokeStyle = color(c); ctx.lineWidth = 2; ctx.stroke(); };

  // Axes in a box: px/py map data to the board; nice ticks on both.
  const axes = (box, x0, x1, y0, y1) => ({ box, x0, x1, y0, y1, px: (x) => box.x + ((x - x0) / (x1 - x0)) * box.w, py: (y) => box.y + box.h - ((y - y0) / (y1 - y0)) * box.h, ux: (dx) => (dx / (x1 - x0)) * box.w, uy: (dy) => (dy / (y1 - y0)) * box.h });
  const nice = (lo, hi, n = 5) => { const span = hi - lo || 1; const step0 = span / n; const p = 10 ** Math.floor(Math.log10(step0)); const step = [1, 2, 5, 10].map((m) => m * p).find((s) => s >= step0 - 1e-12); const out = []; for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10)); return out; };
  function drawAxes(ctx, a, { xt, yt, grid = true, xName = '', yName = '', fx = (v) => fmt(v), fy = (v) => fmt(v), left = false } = {}) {
    const { box } = a;
    xt = xt || nice(a.x0, a.x1, 8); yt = yt || nice(a.y0, a.y1, 6);
    if (grid) {
      ctx.strokeStyle = 'rgba(140,170,255,0.12)'; ctx.lineWidth = 1; ctx.beginPath();
      for (const x of xt) { ctx.moveTo(a.px(x), box.y); ctx.lineTo(a.px(x), box.y + box.h); }
      for (const y of yt) { ctx.moveTo(box.x, a.py(y)); ctx.lineTo(box.x + box.w, a.py(y)); }
      ctx.stroke();
    }
    const zy = a.y0 <= 0 && a.y1 >= 0 ? a.py(0) : box.y + box.h;
    const zx = !left && a.x0 <= 0 && a.x1 >= 0 ? a.px(0) : box.x;
    ctx.strokeStyle = 'rgba(200,215,255,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(box.x, zy); ctx.lineTo(box.x + box.w, zy); ctx.moveTo(zx, box.y); ctx.lineTo(zx, box.y + box.h); ctx.stroke();
    const cross = zx > box.x + 1 && zy < box.y + box.h - 1;
    for (const x of xt) if (!(cross && Math.abs(x) < 1e-9)) label(ctx, fx(x), a.px(x), zy + 18, { size: 17, weight: 500, fill: 'muted' });
    for (const y of yt) if (!(cross && Math.abs(y) < 1e-9)) label(ctx, fy(y), zx - 9, a.py(y), { size: 17, weight: 500, fill: 'muted', align: 'right' });
    if (cross) label(ctx, '0', zx - 9, zy + 16, { size: 17, weight: 500, fill: 'muted', align: 'right' });
    if (xName) label(ctx, xName, box.x + box.w, zy - 16, { size: 19, weight: 600, fill: 'muted', align: 'right' });
    if (yName) label(ctx, yName, zx + 10, box.y + 4, { size: 19, weight: 600, fill: 'muted', align: 'left' });
  }
  // The graph of f between from and to, clipped to the box.
  function plot(ctx, a, f, c, w = 4, from = a.x0, to = a.x1, n = 160, glw = 14) {
    const { box } = a; const span = a.y1 - a.y0;
    if (to <= from) return;
    ctx.save();
    ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip();
    if (glw) glow(ctx, color(c), glw);
    ctx.strokeStyle = color(c); ctx.lineWidth = w; ctx.lineJoin = 'round';
    ctx.beginPath();
    let pen = false;
    for (let i = 0; i <= n; i++) {
      const x = from + ((to - from) * i) / n; const y = f(x);
      if (!Number.isFinite(y) || y < a.y0 - span || y > a.y1 + span) { pen = false; continue; }
      if (pen) ctx.lineTo(a.px(x), a.py(y)); else { ctx.moveTo(a.px(x), a.py(y)); pen = true; }
    }
    ctx.stroke();
    ctx.restore();
  }
  const clipBox = (ctx, box) => { ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip(); };
  // y-range of f over [x0, x1], trimmed of spikes.
  const yRange = (f, x0, x1, pad = 0.12) => {
    const ys = [];
    for (let i = 0; i <= 120; i++) { const y = f(x0 + ((x1 - x0) * i) / 120); if (Number.isFinite(y)) ys.push(y); }
    ys.sort((p, q) => p - q);
    let lo = ys.length ? ys[Math.floor(ys.length * 0.02)] : -5; let hi = ys.length ? ys[Math.ceil(ys.length * 0.98) - 1] : 5;
    lo = Math.min(lo, 0); hi = Math.max(hi, 0);
    const p = (hi - lo) * pad || 1;
    return [lo - p, hi + p];
  };

  // ——— Early years and number ———

  // Number bonds: a bar of n splits into two parts that always make n.
  S['number-bonds'] = (b, ctx, it, t) => {
    const n = clamp(Math.round(num(it.n, 10)), 2, 20);
    // The split walks 0 → n → 0, resting on each whole number: a seamless loop.
    const P = 2 * n; const s = loop(b.clock, P * 1.5) * P; const i = Math.floor(s); const f = s - i;
    const at = (k) => (k <= n ? k : 2 * n - k);
    const v = lerp(at(i), at(i + 1), inOut(clamp((f - 0.6) / 0.4)));
    const k = Math.round(v);
    const x0 = FIG.x + 40; const W = FIG.w - 80; const cw = W / n; const y0 = FIG.y + 90; const h = 96;
    ctx.save();
    alpha(ctx, ramp(t, 0, 0.4));
    title(ctx, `Number bonds to ${n}`);
    const xd = x0 + v * cw;
    ctx.fillStyle = tint('blue', 0.3); ctx.fillRect(x0, y0, xd - x0, h);
    ctx.fillStyle = tint('orange', 0.3); ctx.fillRect(xd, y0, x0 + W - xd, h);
    ctx.strokeStyle = 'rgba(220,230,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let j = 0; j <= n; j++) { ctx.moveTo(x0 + j * cw, y0); ctx.lineTo(x0 + j * cw, y0 + h); }
    ctx.rect(x0, y0, W, h); ctx.stroke();
    for (let j = 0; j < n; j++) dot(ctx, x0 + (j + 0.5) * cw, y0 + h / 2, Math.min(cw * 0.32, 24) * pop(t, 0.1 + j * 0.05, 0.35), j + 0.5 < v ? 'blue' : 'orange');
    glow(ctx, COLORS.yellow, 16); seg(ctx, xd, y0 - 14, xd, y0 + h + 14, 'yellow', 5); ctx.shadowBlur = 0;
    ctx.restore();
    // The part–whole model: the whole on top, the two parts below.
    const q = ramp(t, 0.7, 0.5);
    if (q <= 0) return;
    ctx.save();
    alpha(ctx, q);
    const wy = FIG.y + 330; const py = FIG.y + 500;
    seg(ctx, cx, wy, cx - 190, py, 'rgba(220,230,255,0.5)', 3); seg(ctx, cx, wy, cx + 190, py, 'rgba(220,230,255,0.5)', 3);
    glow(ctx, COLORS.cyan, 18); ring(ctx, cx, wy, 66, 'cyan', 4); ctx.shadowBlur = 0;
    ring(ctx, cx - 190, py, 60, 'blue', 4); ring(ctx, cx + 190, py, 60, 'orange', 4);
    label(ctx, String(n), cx, wy + 2, { size: 44, weight: 800, fill: 'cyan' });
    label(ctx, String(k), cx - 190, py + 2, { size: 42, weight: 800, fill: 'blue' });
    label(ctx, String(n - k), cx + 190, py + 2, { size: 42, weight: 800, fill: 'orange' });
    parts(ctx, [[k, 'blue'], [' + ', 'ink'], [n - k, 'orange'], [` = ${n}`, 'ink']], cx, BY - 110, 40, 800);
    if (n <= 10) {
      const gw = (FIG.w - 60) / (n + 1);
      for (let j = 0; j <= n; j++) label(ctx, `${j}+${n - j}`, FIG.x + 30 + gw * (j + 0.5), BY - 36, { size: 18, weight: j === k ? 800 : 500, fill: j === k ? 'yellow' : 'muted' });
    }
    ctx.restore();
  };

  // Place value: each digit drops into its column and becomes base-ten blocks.
  S['place-value'] = (b, ctx, it, t) => {
    const n = clamp(Math.round(num(it.n, 347)), 0, 9999);
    const ds = String(n).split('').map(Number); const k = ds.length;
    const ONE = ['one', 'ten', 'hundred', 'thousand']; const HEAD = ['Ones', 'Tens', 'Hundreds', 'Thousands']; const HUE = ['green', 'orange', 'blue', 'purple'];
    const colW = Math.min(230, (FIG.w - 40) / k); const x0 = cx - (k * colW) / 2;
    const boxY = FIG.y + 110; const boxH = 92; const blkY = boxY + boxH + 22;
    const done = 0.4 + k * 0.35 + 0.9;
    const hl = t > done ? slot(b.clock, k, 2.4) : null;
    label(ctx, String(n), cx, FIG.y + 36, { size: 46, weight: 800, fill: 'muted' });
    ds.forEach((d, j) => {
      const pl = k - 1 - j; const c = HUE[pl]; const x = x0 + j * colW; const mx = x + colW / 2; const val = d * 10 ** pl;
      const on = hl && hl.i === j ? edge(hl.f, 0.12) : 0;
      ctx.save();
      alpha(ctx, ramp(t, 0.1 + j * 0.1, 0.4));
      ctx.fillStyle = tint(c, 0.07 + 0.08 * on); rounded(ctx, x + 6, boxY - 40, colW - 12, BY - 90 - (boxY - 40), 14); ctx.fill();
      ctx.strokeStyle = tint(c, 0.35 + 0.5 * on); ctx.lineWidth = 2; ctx.stroke();
      label(ctx, colW < 200 && pl === 3 ? 'Th' : HEAD[pl], mx, boxY - 18, { size: 20, weight: 700, fill: c });
      ctx.strokeStyle = tint(c, 0.6); rounded(ctx, x + 22, boxY, colW - 44, boxH, 12); ctx.stroke();
      ctx.restore();
      // The digit slides down from the number into its box.
      const p = inOut(clamp((t - 0.4 - j * 0.35) / 0.5));
      if (p > 0) {
        const tx = cx + (j - (k - 1) / 2) * 30;
        if (on > 0.5) glow(ctx, color(c), 16);
        label(ctx, String(d), lerp(tx, mx, p), lerp(FIG.y + 36, boxY + boxH / 2 + 2, p), { size: Math.round(lerp(46, 62, p)), weight: 800, fill: c });
        ctx.shadowBlur = 0;
      }
      // Base-ten blocks: cubes, rods, flats and big cubes.
      const t0 = 0.9 + j * 0.35;
      const sc = Math.min(1, (colW - 16) / 214);
      for (let i = 0; i < d; i++) {
        const q = pop(t, t0 + i * 0.07, 0.3);
        if (q <= 0) break;
        ctx.save();
        ctx.fillStyle = tint(c, 0.35); ctx.strokeStyle = color(c); ctx.lineWidth = 1.5;
        if (pl === 0) { const s = 26; const gx = mx - 51 + (i % 3) * 34 + 4; const gy = blkY + 20 + Math.floor(i / 3) * 34; ctx.translate(gx + s / 2, gy + s / 2); ctx.scale(q, q); ctx.fillRect(-s / 2, -s / 2, s, s); ctx.strokeRect(-s / 2, -s / 2, s, s); }
        else if (pl === 1) { const w = 14; const hh = 130; const gx = mx - (Math.min(d, 9) * 20) / 2 + i * 20 + 3; ctx.translate(gx + w / 2, blkY + 10 + hh / 2); ctx.scale(q, q); ctx.fillRect(-w / 2, -hh / 2, w, hh); ctx.beginPath(); for (let u = 0; u <= 10; u++) { ctx.moveTo(-w / 2, -hh / 2 + u * 13); ctx.lineTo(w / 2, -hh / 2 + u * 13); } ctx.moveTo(-w / 2, -hh / 2); ctx.lineTo(-w / 2, hh / 2); ctx.moveTo(w / 2, -hh / 2); ctx.lineTo(w / 2, hh / 2); ctx.stroke(); }
        else if (pl === 2) { const s = 60 * sc; const st = 70 * sc; const gx = mx - 1.5 * st + (i % 3) * st + (st - s) / 2; const gy = blkY + 6 + Math.floor(i / 3) * st; ctx.translate(gx + s / 2, gy + s / 2); ctx.scale(q, q); ctx.fillRect(-s / 2, -s / 2, s, s); ctx.beginPath(); for (let u = 0; u <= 10; u++) { const o = -s / 2 + (u * s) / 10; ctx.moveTo(o, -s / 2); ctx.lineTo(o, s / 2); ctx.moveTo(-s / 2, o); ctx.lineTo(s / 2, o); } ctx.stroke(); }
        else { const s = 46 * sc; const o = 12 * sc; const st = 66 * sc; const gx = mx - 1.5 * st + (i % 3) * st + 4; const gy = blkY + 14 + Math.floor(i / 3) * st; ctx.translate(gx + s / 2, gy + s / 2); ctx.scale(q, q); ctx.fillRect(-s / 2, -s / 2, s, s); ctx.strokeRect(-s / 2, -s / 2, s, s); path(ctx, [[-s / 2, -s / 2], [-s / 2 + o, -s / 2 - o], [s / 2 + o, -s / 2 - o], [s / 2 + o, s / 2 - o], [s / 2, s / 2], [s / 2, -s / 2]]); ctx.stroke(); }
        ctx.restore();
      }
      if (t > t0 + d * 0.07 + 0.2) {
        ctx.save();
        alpha(ctx, ramp(t, t0 + d * 0.07 + 0.2, 0.4));
        const text = on > 0.3 ? `${d} ${ONE[pl]}${d === 1 ? '' : 's'} = ${val}` : String(val);
        label(ctx, text, mx, BY - 118, { size: on > 0.3 ? 20 : 26, weight: 700, fill: c });
        ctx.restore();
      }
    });
    if (t > done - 0.3) {
      ctx.save();
      alpha(ctx, ramp(t, done - 0.3, 0.5));
      const list = [];
      ds.forEach((d, j) => { const pl = k - 1 - j; if (list.length) list.push([' + ', 'muted']); list.push([d * 10 ** pl, HUE[pl]]); });
      list.push([` = ${n}`, 'ink']);
      parts(ctx, list, cx, BY - 46, 30, 800);
      ctx.restore();
    }
  };

  // Arrays: rows of dots build up, then rows and columns are counted in turn.
  S.arrays = (b, ctx, it, t) => {
    const r = clamp(Math.round(num(it.r, 3)), 1, 10); const c = clamp(Math.round(num(it.c, 4)), 1, 12);
    const sp = Math.min(78, 620 / c, 400 / r); const rad = sp * 0.3;
    const gx = cx - ((c - 1) * sp) / 2; const gy = FIG.y + 340 - ((r - 1) * sp) / 2;
    const built = 0.3 + r * 0.35 + c * 0.05;
    const live = ramp(t, built + 0.2, 0.4);
    const md = slot(b.clock, 2, 5.5); const e = edge(md.f, 0.08) * live;
    const lines = md.i === 0 ? r : c; const each = md.i === 0 ? c : r;
    const lit = clamp(Math.floor(md.f * (lines + 2.5)), 0, lines);
    for (let L = 0; L < lit; L++) {
      ctx.fillStyle = tint('purple', 0.22 * e); ctx.strokeStyle = tint('purple', 0.7 * e); ctx.lineWidth = 2;
      if (md.i === 0) rounded(ctx, gx - sp * 0.45, gy + L * sp - sp * 0.45, (c - 1) * sp + sp * 0.9, sp * 0.9, sp * 0.3);
      else rounded(ctx, gx + L * sp - sp * 0.45, gy - sp * 0.45, sp * 0.9, (r - 1) * sp + sp * 0.9, sp * 0.3);
      ctx.fill(); ctx.stroke();
    }
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) {
      const p = pop(t, 0.3 + i * 0.35 + j * 0.05, 0.35);
      if (p > 0) dot(ctx, gx + j * sp, gy + i * sp, rad * p, HUES[i % HUES.length]);
    }
    ctx.save();
    alpha(ctx, ramp(t, 0.2, 0.4));
    title(ctx, md.i === 0 || live < 0.5 ? `${r} row${r === 1 ? '' : 's'} of ${c}` : `${c} column${c === 1 ? '' : 's'} of ${r}`);
    ctx.restore();
    if (live <= 0) return;
    ctx.save();
    alpha(ctx, e);
    if (lit) label(ctx, lines <= 6 ? `${Array(lit).fill(each).join(' + ')} = ${lit * each}` : `${lit} × ${each} = ${lit * each}`, cx, BY - 120, { size: 26, weight: 700, fill: 'purple' });
    ctx.restore();
    ctx.save();
    alpha(ctx, live);
    parts(ctx, md.i === 0 ? [[r, 'ink'], [' × ', 'muted'], [c, 'ink'], [` = ${r * c}`, 'cyan']] : [[c, 'ink'], [' × ', 'muted'], [r, 'ink'], [` = ${r * c}`, 'cyan']], cx, BY - 50, 36, 800);
    ctx.restore();
  };

  // The fraction wall: rows of unit fractions, equivalent pieces lighting up.
  S['fraction-wall'] = (b, ctx, it, t) => {
    const DS = [1, 2, 3, 4, 5, 6, 8, 10, 12];
    const x0 = FIG.x + 40; const W = FIG.w - 80; const rh = 50; const gap = 7; const y0 = FIG.y + 80;
    const TG = [[1, 2, 'purple'], [1, 3, 'cyan'], [3, 4, 'orange'], [2, 5, 'green']];
    const sl = slot(b.clock, TG.length, 4.5); const [p, q, hue] = TG[sl.i];
    const e = edge(sl.f, 0.1) * ramp(t, 1.8, 0.5);
    title(ctx, 'Fraction wall');
    const xl = x0 + (W * p) / q; const yb = y0 + DS.length * (rh + gap);
    if (e > 0) { ctx.save(); alpha(ctx, e); glow(ctx, color(hue), 14); seg(ctx, xl, y0 - 12, xl, yb + 4, hue, 3, [8, 6]); ctx.restore(); }
    DS.forEach((d, r) => {
      const a = ramp(t, 0.1 + r * 0.15, 0.4);
      if (a <= 0) return;
      ctx.save();
      alpha(ctx, a); ctx.translate((1 - a) * -40, 0);
      const y = y0 + r * (rh + gap); const w = W / d; const rowHue = HUES[r % HUES.length];
      const lit = d % q === 0 ? (p * d) / q : 0;
      for (let j = 0; j < d; j++) {
        const on = j < lit && e > 0.02;
        rounded(ctx, x0 + j * w + 2, y, w - 4, rh, 8);
        ctx.fillStyle = tint(rowHue, 0.15); ctx.fill();
        if (on) { ctx.fillStyle = tint(hue, 0.5 * e); ctx.fill(); }
        ctx.strokeStyle = on && e > 0.5 ? color(hue) : tint(rowHue, 0.6); ctx.lineWidth = 1.5; ctx.stroke();
        label(ctx, d === 1 ? '1' : `1/${d}`, x0 + j * w + w / 2, y + rh / 2, { size: 18, weight: 600, fill: on && e > 0.5 ? 'ink' : 'muted' });
      }
      ctx.restore();
    });
    if (e <= 0) return;
    ctx.save();
    alpha(ctx, e);
    const chain = DS.filter((d) => d % q === 0).map((d) => `${(p * d) / q}/${d}`);
    label(ctx, chain.join(' = '), cx, BY - 36, { size: 26, weight: 700, fill: hue });
    ctx.restore();
  };

  // Equivalent fractions: one bar re-cut into more pieces, the shaded part unchanged.
  S['equivalent-fractions'] = (b, ctx, it, t) => {
    const d = clamp(Math.round(num(it.d, 2)), 1, 12); const n = clamp(Math.round(num(it.n, 1)), 0, d);
    const KS = d <= 4 ? [1, 2, 4] : [1, 2, 3]; const KM = d <= 4 ? 4 : 6;
    const SEQ = [...KS, KS[1]];
    const sl = slot(b.clock, SEQ.length, 3.2); const k0 = SEQ[sl.i]; const k1 = SEQ[(sl.i + 1) % SEQ.length];
    const e = inOut(clamp((sl.f - 0.72) / 0.28));
    const k = e > 0.5 ? k1 : k0;
    const x0 = FIG.x + 60; const W = FIG.w - 120; const y0 = FIG.y + 100; const h = 120;
    const q = ramp(t, 0, 0.5);
    ctx.save();
    alpha(ctx, q);
    title(ctx, 'Same amount, more pieces');
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(x0, y0, W, h);
    const sw = (W * n) / d * ramp(t, 0.3, 0.6);
    glow(ctx, COLORS.purple, 16); ctx.fillStyle = tint('purple', 0.55); ctx.fillRect(x0, y0, sw, h); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(220,230,255,0.85)'; ctx.lineWidth = 3; ctx.strokeRect(x0, y0, W, h);
    const D = d * KM;
    for (let m = 1; m < D; m++) {
      const a0 = m % (KM / k0) === 0 ? 1 : 0; const a1 = m % (KM / k1) === 0 ? 1 : 0;
      const a = lerp(a0, a1, e);
      if (a < 0.01) continue;
      const x = x0 + (W * m) / D; const drop = !a0 && a1 ? (1 - a) * -26 : 0;
      ctx.save(); alpha(ctx, a); seg(ctx, x, y0 + drop, x, y0 + h + drop, 'rgba(220,230,255,0.9)', m % (KM) === 0 ? 3 : 2); ctx.restore();
    }
    ctx.restore();
    // n/d = nk/dk, with the ×k on top and bottom.
    const fy = FIG.y + 400;
    const frac = (x, top, bot, size, c1, c2) => {
      label(ctx, String(top), x, fy - size * 0.62, { size, weight: 800, fill: c1 });
      ctx.fillStyle = COLORS.ink; ctx.fillRect(x - size * 0.7, fy - 2, size * 1.4, 4);
      label(ctx, String(bot), x, fy + size * 0.66, { size, weight: 800, fill: c2 });
    };
    ctx.save();
    alpha(ctx, ramp(t, 0.8, 0.5));
    frac(cx - 180, n, d, 52, 'purple', 'cyan');
    label(ctx, '=', cx, fy, { size: 52, weight: 800, fill: 'ink' });
    frac(cx + 180, n * k, d * k, 52, 'purple', 'cyan');
    arrow(ctx, cx - 120, fy - 74, cx + 120, fy - 74, 'orange', 3);
    arrow(ctx, cx - 120, fy + 78, cx + 120, fy + 78, 'orange', 3);
    label(ctx, `× ${k}`, cx, fy - 100, { size: 24, weight: 700, fill: 'orange' });
    label(ctx, `× ${k}`, cx, fy + 104, { size: 24, weight: 700, fill: 'orange' });
    const list = [];
    KS.forEach((kk, i) => { if (i) list.push([' = ', 'muted']); list.push([`${n * kk}/${d * kk}`, kk === k ? 'yellow' : 'muted']); });
    parts(ctx, list, cx, BY - 44, 32, 800);
    ctx.restore();
  };

  // Percentages: a hundred square fills to p squares, each square 1%.
  S['percent-grid'] = (b, ctx, it, t) => {
    const p = clamp(Math.round(num(it.p, 37)), 0, 100);
    const cs = 48; const x0 = FIG.x + 30; const y0 = FIG.y + 110;
    const f = p * inOut(clamp((t - 0.4) / 2.2)); const full = Math.floor(f);
    title(ctx, 'A hundred squares: each one is 1%');
    ctx.save();
    alpha(ctx, ramp(t, 0, 0.4));
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(x0, y0, cs * 10, cs * 10);
    for (let i = 0; i < Math.ceil(f); i++) {
      const row = Math.floor(i / 10); const col = i % 10;
      const a = i < full ? 1 : f - full;
      const s = 0.5 + 0.18 * Math.sin(b.clock * 2.4 - (row + col) * 0.45);
      ctx.fillStyle = tint('purple', s * a); ctx.fillRect(x0 + col * cs + 2, y0 + row * cs + 2, cs - 4, cs - 4);
    }
    ctx.strokeStyle = 'rgba(200,215,255,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let j = 0; j <= 10; j++) { ctx.moveTo(x0 + j * cs, y0); ctx.lineTo(x0 + j * cs, y0 + cs * 10); ctx.moveTo(x0, y0 + j * cs); ctx.lineTo(x0 + cs * 10, y0 + j * cs); }
    ctx.stroke();
    glow(ctx, COLORS.purple, 14); ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 3; ctx.strokeRect(x0, y0, cs * 10, cs * 10); ctx.shadowBlur = 0;
    ctx.restore();
    const px = FIG.x + 660; const shown = Math.round(f);
    label(ctx, `${shown}%`, px, FIG.y + 190, { size: 64, weight: 800, fill: 'purple' });
    label(ctx, `${shown} out of 100`, px, FIG.y + 262, { size: 24, weight: 600, fill: 'ink' });
    if (t > 2.6) {
      ctx.save();
      alpha(ctx, ramp(t, 2.6, 0.5));
      const g = ((x, y) => { while (y) [x, y] = [y, x % y]; return x; })(p, 100) || 1;
      label(ctx, `= ${p}/100`, px, FIG.y + 350, { size: 28, weight: 700, fill: 'cyan' });
      label(ctx, `= ${fmt(p / 100)}`, px, FIG.y + 410, { size: 28, weight: 700, fill: 'teal' });
      if (g > 1) label(ctx, `= ${p / g}/${100 / g}`, px, FIG.y + 470, { size: 28, weight: 700, fill: 'orange' });
      ctx.restore();
    }
  };

  // Sharing in a ratio with a bar model: equal parts, the value of one part, each share.
  S['ratio-bar'] = (b, ctx, it, t) => {
    const A = clamp(Math.round(num(it.a, 2)), 1, 12); const Bq = clamp(Math.round(num(it.b, 3)), 1, 12); const total = num(it.total, 40);
    const n = A + Bq; const per = total / n;
    const nameA = String(it.nameA ?? 'A'); const nameB = String(it.nameB ?? 'B');
    const x0 = FIG.x + 60; const W = FIG.w - 120; const bw = W / n; const y0 = FIG.y + 210; const h = 100;
    parts(ctx, [['Share ', 'ink'], [fmt(total), 'yellow'], [' in the ratio ', 'ink'], [A, 'blue'], [' : ', 'ink'], [Bq, 'orange']], cx, FIG.y + 34, 26, 700);
    ctx.save();
    alpha(ctx, ramp(t, 0.2, 0.5));
    brace(ctx, x0, x0 + W, y0 - 14, -1, 'yellow');
    label(ctx, fmt(total), cx, y0 - 62, { size: 30, weight: 800, fill: 'yellow' });
    ctx.restore();
    const hl = t > 2.6 ? slot(b.clock, 2, 3) : null;
    for (let j = 0; j < n; j++) {
      const a = pop(t, 0.6 + j * 0.07, 0.35);
      if (a <= 0) continue;
      const c = j < A ? 'blue' : 'orange';
      ctx.save();
      ctx.translate(x0 + j * bw + bw / 2, y0 + h / 2); ctx.scale(1, a);
      rounded(ctx, -bw / 2 + 3, -h / 2, bw - 6, h, 10); ctx.fillStyle = tint(c, 0.32); ctx.fill(); ctx.strokeStyle = color(c); ctx.lineWidth = 2.5; ctx.stroke();
      ctx.restore();
      if (t > 1.5 && bw >= 40) { ctx.save(); alpha(ctx, ramp(t, 1.5, 0.4)); label(ctx, fmt(per), x0 + j * bw + bw / 2, y0 + h / 2, { size: bw >= 60 ? 26 : 20, weight: 700, fill: 'ink' }); ctx.restore(); }
    }
    if (hl) {
      const on = hl.i === 0; const e = edge(hl.f, 0.15);
      ctx.save(); alpha(ctx, e * ramp(t, 2.6, 0.4)); glow(ctx, color(on ? 'blue' : 'orange'), 18);
      ctx.strokeStyle = color(on ? 'blue' : 'orange'); ctx.lineWidth = 4;
      rounded(ctx, x0 + (on ? 0 : A * bw) - 2, y0 - 4, (on ? A : Bq) * bw + 4, h + 8, 12); ctx.stroke();
      ctx.restore();
    }
    if (t > 1.3) {
      ctx.save(); alpha(ctx, ramp(t, 1.3, 0.4));
      label(ctx, `${fmt(total)} ÷ ${n} parts = ${fmt(per)} in each part`, cx, y0 + h + 56, { size: 24, weight: 600, fill: 'ink' });
      ctx.restore();
    }
    if (t > 2.0) {
      ctx.save(); alpha(ctx, ramp(t, 2.0, 0.5));
      const yb = y0 + h + 104;
      brace(ctx, x0 + 3, x0 + A * bw - 3, yb, 1, 'blue'); brace(ctx, x0 + A * bw + 3, x0 + W - 3, yb, 1, 'orange');
      const xa = clamp(x0 + (A * bw) / 2, FIG.x + 140, RX - 140); const xb = clamp(x0 + A * bw + (Bq * bw) / 2, FIG.x + 140, RX - 140);
      const clash = Math.abs(xb - xa) < 270;
      label(ctx, `${nameA}: ${A} × ${fmt(per)} = ${fmt(A * per)}`, xa, yb + 52, { size: 24, weight: 700, fill: 'blue' });
      label(ctx, `${nameB}: ${Bq} × ${fmt(per)} = ${fmt(Bq * per)}`, xb, yb + (clash ? 96 : 52), { size: 24, weight: 700, fill: 'orange' });
      label(ctx, `${fmt(A * per)} + ${fmt(Bq * per)} = ${fmt(total)}`, cx, BY - 40, { size: 26, weight: 700, fill: 'yellow' });
      ctx.restore();
    }
  };

  // Negative numbers: hops along a number line across zero, and back again.
  S['negative-numbers'] = (b, ctx, it, t) => {
    const s0 = Math.round(num(it.start, 3)); const ch = Math.round(num(it.change, -7)) || -1; const end = s0 + ch;
    const span = Math.min(20, Math.max(10, Math.abs(s0) + 2, Math.abs(end) + 2));
    const lo = -span; const hi = span;
    const x0 = FIG.x + 50; const x1 = RX - 50; const y = FIG.y + 380;
    const px = (v) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
    const q = ramp(t, 0, 0.5);
    ctx.save();
    alpha(ctx, q);
    ctx.fillStyle = tint('blue', 0.1); ctx.fillRect(x0, y - 150, px(0) - x0, 220);
    ctx.fillStyle = tint('orange', 0.1); ctx.fillRect(px(0), y - 150, x1 - px(0), 220);
    label(ctx, 'negative: below zero', x0 + 10, y + 110, { size: 20, weight: 600, fill: 'blue', align: 'left' });
    label(ctx, 'positive: above zero', x1 - 10, y + 110, { size: 20, weight: 600, fill: 'orange', align: 'right' });
    seg(ctx, x0, y, x1, y, 'rgba(220,230,255,0.85)', 4);
    const every = hi - lo > 24 ? 5 : hi - lo > 14 ? 2 : 1;
    ctx.strokeStyle = 'rgba(220,230,255,0.85)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let v = lo; v <= hi; v++) { const big = v % every === 0; ctx.moveTo(px(v), y - (big ? 12 : 7)); ctx.lineTo(px(v), y + (big ? 12 : 7)); }
    ctx.stroke();
    for (let v = lo; v <= hi; v += 1) if (v % every === 0) label(ctx, fmt(v), px(v), y + 34, { size: v === 0 ? 24 : 18, weight: v === 0 ? 800 : 500, fill: v === 0 ? 'yellow' : 'muted' });
    ctx.restore();
    // Forward hops, a rest, the inverse hops back, a rest: a seamless loop.
    const hops = Math.abs(ch); const unit = hops <= 12; const H = unit ? hops : 1; const step = unit ? 1 : hops; const hd = unit ? 0.5 : 1.6;
    const fw = H * hd; const P = 2 * fw + 3.2;
    const tau = loop(b.clock, P) * P;
    const back = tau >= fw + 1.6; const lt = back ? tau - fw - 1.6 : tau;
    const prog = clamp(lt / hd, 0, H); const hi0 = Math.min(H - 1, Math.floor(prog)); const fr = prog >= H ? 1 : inOut(prog - Math.floor(prog));
    const from = back ? end : s0; const dir = Math.sign(back ? -ch : ch);
    const c = (ch < 0) !== back ? 'red' : 'green';
    const hgt = unit ? 46 : 130;
    const g = ramp(t, 0.6, 0.5);
    ctx.save();
    alpha(ctx, g);
    ctx.strokeStyle = color(c); ctx.lineWidth = 3; ctx.setLineDash([7, 6]);
    const doneHops = prog >= H ? H : Math.floor(prog);
    for (let k = 0; k <= Math.min(H - 1, doneHops); k++) {
      const a = px(from + dir * k * step); const z = px(from + dir * (k + 1) * step); const part = k < doneHops ? 1 : fr;
      if (part <= 0) continue;
      ctx.beginPath();
      if (z > a) ctx.ellipse((a + z) / 2, y, (z - a) / 2, hgt, 0, Math.PI, Math.PI + part * Math.PI);
      else ctx.ellipse((a + z) / 2, y, (a - z) / 2, hgt, 0, 0, -part * Math.PI, true);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    const pos = from + dir * step * (prog >= H ? H : hi0 + fr);
    const lift = prog >= H ? 0 : Math.sin(fr * Math.PI) * hgt;
    glow(ctx, color(c), 18); dot(ctx, px(pos), y - lift, 13, c); ctx.shadowBlur = 0;
    label(ctx, fmt(Math.round(pos)), px(pos), y - lift - 34, { size: 24, weight: 800, fill: c });
    ctx.restore();
    const landed = prog >= H;
    const a = back ? end : s0; const opMinus = back ? ch > 0 : ch < 0;
    parts(ctx, [[fmt(a), 'ink'], [opMinus ? ` ${MINUS} ` : ' + ', c], [hops, c], [' = ', 'ink'], [landed ? fmt(back ? s0 : end) : '?', 'yellow']], cx, FIG.y + 70, 40, 800);
  };

  // BIDMAS: the expression worked one operation at a time, the rule lit.
  S['order-of-operations'] = (b, ctx, it, t) => {
    const steps = (it._st ||= [bidmas(it.expr ?? '3 + 4 × (6 − 2)²') || bidmas('3 + 4 × (6 − 2)²')])[0];
    const n = steps.length; const work = n - 1;
    const RC = { B: 'purple', I: 'cyan', D: 'orange', M: 'orange', A: 'green', S: 'green' };
    const LV = { B: 0, I: 1, D: 2, M: 2, A: 3, S: 3 };
    const built = 0.3 + n * 0.5;
    const act = t < built ? clamp(Math.floor((t - 0.3) / 0.5), 0, work - 1) : slot(b.clock, work, 1.8).i;
    const cur = steps[act];
    ['B', 'I', 'D', 'M', 'A', 'S'].forEach((ch, k) => {
      const x = cx + (k - 2.5) * 76; const y = FIG.y + 44;
      const on = ch === cur.rule || (ch === 'B' && cur.br) ? 1 : LV[ch] === LV[cur.rule] ? 0.35 : 0;
      ctx.save();
      if (on === 1) glow(ctx, color(RC[ch]), 16);
      rounded(ctx, x - 30, y - 30, 60, 60, 12); ctx.fillStyle = tint(RC[ch], 0.1 + 0.4 * on); ctx.fill();
      ctx.strokeStyle = on ? color(RC[ch]) : 'rgba(140,170,255,0.3)'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.shadowBlur = 0;
      label(ctx, ch, x, y + 2, { size: 30, weight: 800, fill: on ? 'ink' : 'muted' });
      ctx.restore();
    });
    label(ctx, cur.say, cx, FIG.y + 112, { size: 22, weight: 700, fill: RC[cur.br ? 'B' : cur.rule] });
    const gap = Math.min(84, 540 / n); const big = n <= 7;
    steps.forEach((st, i) => {
      const a = ramp(t, 0.3 + i * 0.5, 0.4);
      if (a <= 0) return;
      ctx.save();
      alpha(ctx, a);
      const y = FIG.y + (big ? 180 : 165) + i * gap; const last = i === n - 1;
      if (last) glow(ctx, COLORS.yellow, 16);
      exprLine(ctx, st.toks, y, (last ? 38 : 32) - (big ? 0 : 6), st.hi, RC[st.br ? 'B' : st.rule], i === act ? 1 : 0.3, i > 0);
      ctx.restore();
    });
  };
  const exprLine = (ctx, toks, y, size, hi, hc, strength, prefix) => {
    const pcs = [];
    if (prefix) pcs.push({ s: '= ', k: -1, c: 'muted' });
    toks.forEach((tk, k) => {
      if (tk.o === '^') return;
      let s = tk.v != null ? (tk.par ? `(${fmt(tk.v, 3)})` : fmt(tk.v, 3)) : OPS[tk.o];
      if (tk.o && '+-*/'.includes(tk.o)) s = ` ${s} `;
      pcs.push({ s, k, sp: toks[k - 1]?.o === '^', c: tk.res ? 'yellow' : 'ink' });
    });
    let W = 0;
    for (const p of pcs) { p.size = p.sp ? Math.round(size * 0.62) : size; ctx.font = `600 ${p.size}px ${FONT}`; p.w = ctx.measureText(p.s).width; p.x = W; W += p.w; }
    const x0 = cx - W / 2;
    if (hi && strength > 0) {
      const inR = pcs.filter((p) => p.k >= hi[0] && p.k <= hi[1]);
      if (inR.length) {
        const a = inR[0]; const z = inR[inR.length - 1];
        ctx.save();
        rounded(ctx, x0 + a.x - 8, y - size * 0.78, z.x + z.w - a.x + 16, size * 1.56, 10);
        ctx.fillStyle = tint(hc, 0.28 * strength); ctx.fill();
        alpha(ctx, strength); ctx.strokeStyle = color(hc); ctx.lineWidth = 2.5; ctx.stroke();
        ctx.restore();
      }
    }
    pcs.forEach((p) => label(ctx, p.s, x0 + p.x, p.sp ? y - size * 0.34 : y, { size: p.size, weight: 600, fill: p.c, align: 'left' }));
  };

  // Counting: objects pop up, then gather into ten-frames; tens counted, then ones.
  S.counting = (b, ctx, it, t) => {
    const n = clamp(Math.round(num(it.n, 23)), 1, 99); const tens = Math.floor(n / 10); const ones = n % 10;
    const cell = 28; const fw = cell * 5; const fh = cell * 2; const gapF = 18;
    const F = tens + (ones ? 1 : 0);
    const frame = (k) => { const row = Math.floor(k / 5); const cnt = Math.min(5, F - row * 5); const col = k % 5; return [cx - (cnt * fw + (cnt - 1) * gapF) / 2 + col * (fw + gapF), FIG.y + 470 + row * (fh + 34)]; };
    const order = (it._co ||= Array.from({ length: 120 }, (_, i) => i).sort((p, q) => rnd(p, 3) - rnd(q, 3)));
    const moveAt = 1.2 + 0.25 * Math.min(n, 30) / 30;
    const settled = moveAt + 0.8 + F * 0.12;
    title(ctx, 'How many are there?');
    for (let k = 0; k < F; k++) {
      const [fx, fy] = frame(k);
      ctx.save(); alpha(ctx, ramp(t, moveAt - 0.3 + k * 0.08, 0.4));
      ctx.strokeStyle = 'rgba(200,215,255,0.45)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let j = 0; j <= 5; j++) { ctx.moveTo(fx + j * cell, fy); ctx.lineTo(fx + j * cell, fy + fh); }
      for (let j = 0; j <= 2; j++) { ctx.moveTo(fx, fy + j * cell); ctx.lineTo(fx + fw, fy + j * cell); }
      ctx.stroke();
      ctx.restore();
    }
    // Counting on the clock once they have settled: each ten, then each one.
    const steps = tens + ones; const P = steps * 0.75 + 2.4;
    const live = ramp(t, settled, 0.4);
    const tau = loop(b.clock, P) * P; const si = Math.floor(tau / 0.75);
    const count = si < tens ? (si + 1) * 10 : si < steps ? tens * 10 + (si - tens) + 1 : n;
    if (live > 0 && si < tens) {
      const [fx, fy] = frame(si);
      ctx.save(); alpha(ctx, live); glow(ctx, COLORS.yellow, 18); ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 4; rounded(ctx, fx - 5, fy - 5, fw + 10, fh + 10, 8); ctx.stroke(); ctx.restore();
    }
    for (let i = 0; i < n; i++) {
      const p = pop(t, 0.1 + (i * 1.0) / n, 0.3);
      if (p <= 0) break;
      const cI = order[i]; const sx = FIG.x + 70 + (cI % 12) * 60 + (rnd(i, 5) - 0.5) * 18; const sy = FIG.y + 100 + Math.floor(cI / 12) * 30 + (rnd(i, 6) - 0.5) * 10;
      const k = Math.floor(i / 10); const j = i % 10; const [fx, fy] = frame(k);
      const m = inOut(clamp((t - moveAt - k * 0.12) / 0.8));
      const x = lerp(sx, fx + ((j % 5) + 0.5) * cell, m); const y = lerp(sy, fy + (Math.floor(j / 5) + 0.5) * cell, m);
      const lit = live > 0 && si >= tens && i < count && i >= tens * 10;
      const r = 11 * p * (lit ? 1.2 : 1);
      dot(ctx, x, y, r, 'red');
      ctx.fillStyle = COLORS.green; ctx.beginPath(); ctx.ellipse(x + r * 0.35, y - r * 1.05, r * 0.45, r * 0.22, -0.5, 0, TAU); ctx.fill();
      dot(ctx, x - r * 0.35, y - r * 0.3, r * 0.22, 'rgba(255,255,255,0.55)');
    }
    if (live > 0) {
      ctx.save();
      alpha(ctx, live);
      glow(ctx, COLORS.cyan, 22);
      label(ctx, String(count), cx, FIG.y + 250, { size: 110, weight: 800, fill: 'cyan' });
      ctx.shadowBlur = 0;
      parts(ctx, [[tens, 'orange'], [` ten${tens === 1 ? '' : 's'} and `, 'ink'], [ones, 'green'], [` one${ones === 1 ? '' : 's'} = `, 'ink'], [n, 'cyan']], cx, BY - 40, 30, 800);
      ctx.restore();
    }
  };

  // Telling the time: the hands move on, the digital time and the words follow.
  S.clock = (b, ctx, it, t) => {
    const mt = String(it.time ?? '3:40').match(/(\d{1,2})\s*[:.]\s*(\d{2})/);
    const m0 = mt ? (+mt[1] % 12) * 60 + clamp(+mt[2], 0, 59) : 220;
    const OFF = [0, 170, 355, 555, 720];
    // Starts on the asked time; then four jumps that add up to 12 hours, so it loops.
    const sl = slot(Math.max(0, t - 1), 4, 4.5); const mv = inOut(clamp((sl.f - 0.72) / 0.28));
    const M = m0 + lerp(OFF[sl.i], OFF[sl.i + 1], mv);
    const ox = FIG.x + 300; const oy = cy + 30; const R = 250;
    const mins = Math.floor((M % 60) + 1e-6); const hrs = Math.floor((M % 720) / 60 + 1e-9);
    const ma = ((M % 60) / 60) * TAU - Math.PI / 2; const ha = ((M % 720) / 720) * TAU - Math.PI / 2;
    const q = pop(t, 0, 0.5);
    title(ctx, 'What time is it?');
    ctx.save();
    ctx.translate(ox, oy); ctx.scale(q, q);
    glow(ctx, COLORS.cyan, 22); ring(ctx, 0, 0, R, 'cyan', 6, 'rgba(10,16,36,0.9)'); ctx.shadowBlur = 0;
    const still = 1 - Math.sin(mv * Math.PI);
    if (still > 0.05) {
      ctx.save(); alpha(ctx, still);
      if (mins <= 30) wedge(ctx, 0, 0, R - 40, -Math.PI / 2, ma, 'green', 0.16); else wedge(ctx, 0, 0, R - 40, ma, Math.PI * 1.5, 'orange', 0.16);
      ctx.restore();
    }
    ctx.strokeStyle = 'rgba(220,230,255,0.75)'; ctx.beginPath();
    for (let i = 0; i < 60; i++) { const a = (i / 60) * TAU; const r0 = i % 5 ? R - 16 : R - 30; ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * (R - 6), Math.sin(a) * (R - 6)); }
    ctx.lineWidth = 2.5; ctx.stroke();
    for (let h = 1; h <= 12; h++) { const a = (h / 12) * TAU - Math.PI / 2; label(ctx, String(h), Math.cos(a) * (R - 62), Math.sin(a) * (R - 62) + 1, { size: 28, weight: 700, fill: 'ink' }); }
    ctx.lineCap = 'round';
    glow(ctx, COLORS.orange, 14); seg(ctx, 0, 0, Math.cos(ha) * R * 0.5, Math.sin(ha) * R * 0.5, 'orange', 14);
    glow(ctx, COLORS.cyan, 14); seg(ctx, 0, 0, Math.cos(ma) * R * 0.8, Math.sin(ma) * R * 0.8, 'cyan', 8);
    ctx.shadowBlur = 0;
    dot(ctx, 0, 0, 12, 'ink');
    ctx.restore();
    const px = FIG.x + 680;
    ctx.save();
    alpha(ctx, ramp(t, 0.4, 0.5));
    panel(ctx, px - 110, FIG.y + 210, 220, 100, 'rgba(34,211,238,0.5)');
    label(ctx, `${hrs || 12}:${String(mins).padStart(2, '0')}`, px, FIG.y + 262, { size: 56, weight: 800, fill: 'cyan' });
    ctx.restore();
    if (t > 0.8) {
      ctx.save();
      alpha(ctx, ramp(t, 0.8, 0.5) * still);
      wrapLabel(ctx, timeWords(hrs || 12, mins), px - 115, FIG.y + 380, 230, 26, 'center', 'ink', 700);
      label(ctx, mins <= 30 ? 'past the hour' : 'to the next hour', px, FIG.y + 450, { size: 20, weight: 600, fill: mins <= 30 ? 'green' : 'orange' });
      label(ctx, 'short hand: hours', px, FIG.y + 530, { size: 19, weight: 600, fill: 'orange' });
      label(ctx, 'long hand: minutes', px, FIG.y + 562, { size: 19, weight: 600, fill: 'cyan' });
      ctx.restore();
    }
  };

  // ——— Algebra and graphs ———

  // y = mx + c: the line, its gradient triangle and intercept; m and c take turns to change.
  S['linear-graph'] = (b, ctx, it, t) => {
    const m = num(it.m, 2); const c = num(it.c, 1);
    const ym = Math.min(30, Math.max(6, Math.ceil(Math.abs(c) + Math.abs(m) * 2.5 + 1)));
    const a = (it._a ||= axes({ x: FIG.x + 70, y: FIG.y + 90, w: FIG.w - 110, h: FIG.h - 170 }, -5, 5, -ym, ym));
    const s = loop(b.clock, 12) * 12; const amp = ramp(t, 2.4, 0.8);
    const mN = s >= 3 && s < 6 ? m + 1.2 * Math.sin((TAU * (s - 3)) / 3) * amp : m;
    const cN = s >= 9 ? c + 2 * Math.sin((TAU * (s - 9)) / 3) * amp : c;
    const mS = mN === m ? m : +mN.toFixed(1); const cS = cN === c ? c : +cN.toFixed(1);
    ctx.save(); alpha(ctx, ramp(t, 0, 0.4));
    drawAxes(ctx, a, { xt: [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5], yt: nice(-ym, ym, 6), xName: 'x', yName: 'y' });
    ctx.restore();
    const f = (x) => mN * x + cN;
    plot(ctx, a, f, 'cyan', 4.5, -5, -5 + 10 * clamp((t - 0.3) / 1), 40);
    const eq = [['y = ', 'ink']];
    if (mS) eq.push([mS === 1 ? '' : mS === -1 ? MINUS : fmt(mS), 'orange'], ['x', 'ink']);
    if (cS || !mS) eq.push([mS ? (cS < 0 ? ` ${MINUS} ` : ' + ') : '', 'ink'], [mS ? fmt(Math.abs(cS)) : fmt(cS), 'yellow']);
    parts(ctx, eq, cx, FIG.y + 36, 36, 800);
    if (t < 1.3) return;
    ctx.save();
    alpha(ctx, ramp(t, 1.3, 0.5));
    // The gradient triangle: along 1, up m.
    const X1 = a.px(1); const X2 = a.px(2); const Y1 = a.py(f(1)); const Y2 = a.py(f(2));
    ctx.save(); clipBox(ctx, a.box);
    ctx.fillStyle = tint('orange', 0.12); path(ctx, [[X1, Y1], [X2, Y1], [X2, Y2]]); ctx.fill();
    seg(ctx, X1, Y1, X2, Y1, 'green', 4); seg(ctx, X2, Y1, X2, Y2, 'orange', 4);
    ctx.restore();
    label(ctx, '1', (X1 + X2) / 2, Y1 + (mN >= 0 ? 22 : -22), { size: 22, weight: 700, fill: 'green' });
    label(ctx, fmt(mS), X2 + 12, clamp((Y1 + Y2) / 2, a.box.y + 12, a.box.y + a.box.h - 12), { size: 22, weight: 700, fill: 'orange', align: 'left' });
    // The intercept.
    const yc = a.py(cN);
    if (yc > a.box.y && yc < a.box.y + a.box.h) {
      glow(ctx, COLORS.yellow, 14); dot(ctx, a.px(0), yc, 9, 'yellow'); ctx.shadowBlur = 0;
      label(ctx, `(0, ${fmt(cS)})`, a.px(0) - 14, yc - 20, { size: 21, weight: 700, fill: 'yellow', align: 'right' });
    }
    label(ctx, `gradient = rise ÷ run = ${fmt(mS)} ÷ 1 = ${fmt(mS)}`, cx, BY - 28, { size: 24, weight: 700, fill: 'orange' });
    ctx.restore();
  };

  // A quadratic: roots, vertex and axis of symmetry; then a changes and they move.
  S.quadratic = (b, ctx, it, t) => {
    const a0 = num(it.a, 1) || 1; const B = num(it.b, -2); const C = num(it.c, -3);
    const a = (it._a ||= (() => {
      const xv = -B / (2 * a0); const yv = C - (B * B) / (4 * a0); const d = B * B - 4 * a0 * C;
      const hw = Math.min(12, Math.max(4, d > 0 ? Math.sqrt(d) / Math.abs(a0) / 2 + 1.5 : 4));
      const x0 = Math.floor(xv - hw); const x1 = Math.ceil(xv + hw); const ext = Math.abs(a0) * hw * hw * 0.75;
      const [y0, y1] = a0 > 0 ? [Math.min(0, yv) - 1.5, Math.max(yv + ext, 2)] : [Math.min(yv - ext, -2), Math.max(0, yv) + 1.5];
      return axes({ x: FIG.x + 70, y: FIG.y + 90, w: FIG.w - 110, h: FIG.h - 190 }, x0, x1, y0, y1);
    })());
    const s = loop(b.clock, 12) * 12;
    const aN = s >= 6 && s < 10 ? a0 * (1 + 0.45 * Math.sin((TAU * (s - 6)) / 4) * ramp(t, 2.6, 0.8)) : a0;
    const aS = aN === a0 ? a0 : +aN.toFixed(2);
    const f = (x) => aN * x * x + B * x + C;
    const xv = -B / (2 * aN); const yv = f(xv); const disc = B * B - 4 * aN * C;
    ctx.save(); alpha(ctx, ramp(t, 0, 0.4)); drawAxes(ctx, a, { xName: 'x', yName: 'y' }); ctx.restore();
    plot(ctx, a, f, 'purple', 4.5, a.x0, a.x0 + (a.x1 - a.x0) * clamp((t - 0.3) / 1.2), 160);
    label(ctx, `y = ${poly([[aS, 2], [B, 1], [C, 0]])}`, cx, FIG.y + 36, { size: 34, weight: 800, fill: 'purple' });
    const zy = a.py(clamp(0, a.y0, a.y1));
    if (t > 1.5) {
      ctx.save(); alpha(ctx, ramp(t, 1.5, 0.4));
      const X = a.px(xv);
      ctx.save(); clipBox(ctx, a.box); seg(ctx, X, a.box.y, X, a.box.y + a.box.h, 'teal', 2.5, [8, 7]); ctx.restore();
      label(ctx, `x = ${fmt(xv)}`, X + 10, a.box.y + 14, { size: 20, weight: 700, fill: 'teal', align: 'left' });
      ctx.restore();
    }
    if (t > 1.8) {
      ctx.save(); alpha(ctx, ramp(t, 1.8, 0.4));
      const X = a.px(xv); const Y = a.py(yv);
      glow(ctx, COLORS.orange, 14); dot(ctx, X, Y, 9 * pop(t, 1.8, 0.4), 'orange'); ctx.shadowBlur = 0;
      label(ctx, `vertex (${fmt(xv)}, ${fmt(yv)})`, X + 14, Y + (aN > 0 ? 30 : -30), { size: 20, weight: 700, fill: 'orange', align: X > cx + 120 ? 'right' : 'left' });
      ctx.restore();
    }
    if (t > 2.1) {
      ctx.save(); alpha(ctx, ramp(t, 2.1, 0.4));
      if (disc >= 0) {
        const rs = [(-B - Math.sqrt(disc)) / (2 * aN), (-B + Math.sqrt(disc)) / (2 * aN)].sort((p, q) => p - q);
        rs.forEach((r, i) => {
          if (i && Math.abs(r - rs[0]) < 1e-9) return;
          glow(ctx, COLORS.green, 12); dot(ctx, a.px(r), zy, 8, 'green'); ctx.shadowBlur = 0;
          const edgeR = i && a.px(r) > RX - 110; const edgeL = !i && a.px(r) < FIG.x + 110;
          const right = edgeL || (i && !edgeR);
          label(ctx, `(${fmt(r)}, 0)`, a.px(r) + (right ? 10 : -10), zy + (aN > 0 ? 42 : -26), { size: 20, weight: 700, fill: 'green', align: right ? 'left' : 'right' });
        });
      }
      label(ctx, `b² − 4ac = ${fmt(disc)}: ${disc > 1e-9 ? 'two roots' : disc > -1e-9 ? 'one repeated root' : 'no real roots'}`, cx, BY - 30, { size: 22, weight: 700, fill: 'green' });
      ctx.restore();
    }
  };

  // Simultaneous equations: two lines, and the one point on both.
  S.simultaneous = (b, ctx, it, t) => {
    const m1 = num(it.m1, 2); const c1 = num(it.c1, -1); const m2 = num(it.m2, -1); const c2 = num(it.c2, 5);
    const par = Math.abs(m1 - m2) < 1e-9;
    const xs = par ? 0 : (c2 - c1) / (m1 - m2); const ys = m1 * xs + c1;
    const a = (it._a ||= (() => { const x0 = Math.floor(clamp(xs, -50, 50)) - 5; const y0 = Math.floor(clamp(ys, -50, 50)) - 6; return axes({ x: FIG.x + 70, y: FIG.y + 110, w: FIG.w - 110, h: FIG.h - 200 }, x0, x0 + 10, y0, y0 + 12); })());
    const f1 = (x) => m1 * x + c1; const f2 = (x) => m2 * x + c2;
    ctx.save(); alpha(ctx, ramp(t, 0, 0.4)); drawAxes(ctx, a, { xName: 'x', yName: 'y' }); ctx.restore();
    label(ctx, `y = ${poly([[m1, 1], [c1, 0]])}`, cx - 180, FIG.y + 36, { size: 30, weight: 800, fill: 'blue' });
    label(ctx, `y = ${poly([[m2, 1], [c2, 0]])}`, cx + 180, FIG.y + 36, { size: 30, weight: 800, fill: 'orange' });
    plot(ctx, a, f1, 'blue', 4.5, a.x0, a.x0 + (a.x1 - a.x0) * clamp((t - 0.3) / 0.8), 40);
    plot(ctx, a, f2, 'orange', 4.5, a.x0, a.x0 + (a.x1 - a.x0) * clamp((t - 0.9) / 0.8), 40);
    if (par) { if (t > 1.8) label(ctx, Math.abs(c1 - c2) < 1e-9 ? 'The same line: infinitely many solutions' : 'Parallel lines never meet: no solution', cx, BY - 34, { size: 24, weight: 700, fill: 'red' }); return; }
    // A probe sweeps across: the two points meet only at the solution.
    const g = ramp(t, 2.4, 0.5);
    if (g > 0) {
      const xp = clamp(xs + 3.5 * Math.sin((TAU * b.clock) / 7), a.x0, a.x1);
      ctx.save(); alpha(ctx, g * 0.9); clipBox(ctx, a.box);
      seg(ctx, a.px(xp), a.box.y, a.px(xp), a.box.y + a.box.h, 'rgba(200,215,255,0.25)', 1.5);
      seg(ctx, a.px(xp), a.py(f1(xp)), a.px(xp), a.py(f2(xp)), 'red', 2.5, [5, 5]);
      dot(ctx, a.px(xp), a.py(f1(xp)), 7, 'blue'); dot(ctx, a.px(xp), a.py(f2(xp)), 7, 'orange');
      ctx.restore();
    }
    if (t > 1.8) {
      const X = a.px(xs); const Y = a.py(ys);
      ctx.save(); alpha(ctx, ramp(t, 1.8, 0.4));
      seg(ctx, X, Y, X, a.py(clamp(0, a.y0, a.y1)), 'green', 2, [6, 6]); seg(ctx, X, Y, a.px(clamp(0, a.x0, a.x1)), Y, 'green', 2, [6, 6]);
      const pulse = 1 + 0.25 * Math.sin(b.clock * 4);
      glow(ctx, COLORS.green, 20); dot(ctx, X, Y, 10 * pop(t, 1.8, 0.4), 'green'); ctx.shadowBlur = 0;
      ring(ctx, X, Y, 18 * pulse, 'green', 2, null);
      const right = X > RX - 200;
      const mid = (Math.atan2(-a.uy(m1), a.ux(1)) + Math.atan2(-a.uy(m2), a.ux(1))) / 2 + (right ? Math.PI : 0);
      label(ctx, `(${fmt(xs)}, ${fmt(ys)})`, X + Math.cos(mid) * 30, Y + Math.sin(mid) * 30, { size: 24, weight: 800, fill: 'green', align: right ? 'right' : 'left' });
      label(ctx, `Solution: x = ${fmt(xs)}, y = ${fmt(ys)} fits both equations`, cx, BY - 32, { size: 24, weight: 700, fill: 'green' });
      ctx.restore();
    }
  };

  // Inequalities: on a number line (open and closed circles) and as a region of a graph.
  S.inequality = (b, ctx, it, t) => {
    const lo = num(it.lo, -2); const hi = Math.max(lo, num(it.hi, 3)); const loIn = !!it.loIn; const hiIn = it.hiIn == null ? true : !!it.hiIn;
    const m = num(it.m, 2); const c = num(it.c, 1);
    const SIGN = { '<': '<', '<=': '≤', '≤': '≤', '>': '>', '>=': '≥', '≥': '≥' }; const NEG = { '<': '≥', '≤': '>', '>': '≤', '≥': '<' };
    const sg = SIGN[String(it.sign ?? '<')] || '<';
    const L = Math.min(20, Math.max(6, Math.ceil(Math.abs(lo)) + 2, Math.ceil(Math.abs(hi)) + 2));
    const x0 = FIG.x + 50; const x1 = RX - 50; const y = FIG.y + 120;
    const px = (v) => x0 + ((v + L) / (2 * L)) * (x1 - x0);
    label(ctx, `${fmt(lo)} ${loIn ? '≤' : '<'} x ${hiIn ? '≤' : '<'} ${fmt(hi)}`, cx, FIG.y + 40, { size: 30, weight: 800, fill: 'cyan' });
    ctx.save();
    alpha(ctx, ramp(t, 0, 0.4));
    seg(ctx, x0, y, x1, y, 'rgba(220,230,255,0.8)', 3);
    ctx.strokeStyle = 'rgba(220,230,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let v = -L; v <= L; v++) { ctx.moveTo(px(v), y - 9); ctx.lineTo(px(v), y + 9); }
    ctx.stroke();
    const every = L > 10 ? 5 : L > 7 ? 2 : 1;
    for (let v = -L; v <= L; v++) if (v % every === 0) label(ctx, fmt(v), px(v), y + 30, { size: 18, weight: 500, fill: 'muted' });
    const q = inOut(clamp((t - 0.3) / 0.7));
    glow(ctx, COLORS.cyan, 16); seg(ctx, px(lo), y, lerp(px(lo), px(hi), q), y, 'cyan', 9); ctx.shadowBlur = 0;
    if (q > 0) { if (loIn) dot(ctx, px(lo), y, 11, 'cyan'); else ring(ctx, px(lo), y, 10, 'cyan', 4); }
    if (q >= 1) { if (hiIn) dot(ctx, px(hi), y, 11, 'cyan'); else ring(ctx, px(hi), y, 10, 'cyan', 4); }
    const ints = []; for (let k = Math.ceil(lo); k <= Math.floor(hi); k++) if ((loIn || k > lo) && (hiIn || k < hi)) ints.push(fmt(k));
    if (t > 1.1 && ints.length && ints.length <= 12) { alpha(ctx, ramp(t, 1.1, 0.4)); label(ctx, `whole numbers: ${ints.join(', ')}`, cx, y + 66, { size: 20, weight: 600, fill: 'muted' }); }
    ctx.restore();
    // The region y < mx + c on a graph, a test point wandering in and out.
    const a = (it._a ||= axes({ x: FIG.x + 70, y: FIG.y + 250, w: FIG.w - 110, h: FIG.h - 300 }, -5, 5, -5, 5));
    if (t < 1.2) return;
    ctx.save();
    alpha(ctx, ramp(t, 1.2, 0.5));
    drawAxes(ctx, a, { xt: [-4, -2, 0, 2, 4], yt: [-4, -2, 0, 2, 4] });
    const below = sg === '<' || sg === '≤';
    const pts = []; for (let i = 0; i <= 40; i++) { const x = -5 + i / 4; pts.push([a.px(x), a.py(clamp(m * x + c, -5, 5))]); }
    ctx.save(); clipBox(ctx, a.box);
    path(ctx, [...pts, [a.px(5), a.py(below ? -5 : 5)], [a.px(-5), a.py(below ? -5 : 5)]]); ctx.fillStyle = tint('green', 0.2); ctx.fill();
    ctx.setLineDash(sg === '<' || sg === '>' ? [10, 8] : []); path(ctx, [[a.px(-5), a.py(m * -5 + c)], [a.px(5), a.py(m * 5 + c)]], false); ctx.strokeStyle = COLORS.green; ctx.lineWidth = 3.5; ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    panel(ctx, a.box.x + 10, a.box.y + 8, 210, 44, 'rgba(52,211,153,0.5)');
    label(ctx, `y ${sg} ${poly([[m, 1], [c, 0]])}`, a.box.x + 115, a.box.y + 31, { size: 22, weight: 800, fill: 'green' });
    const u = loop(b.clock, 10);
    const X = +(3.6 * Math.sin(TAU * u)).toFixed(1); const Y = +(3.6 * Math.sin(2 * TAU * u + 0.6)).toFixed(1);
    const rhs = m * X + c; const ok = sg === '<' ? Y < rhs : sg === '≤' ? Y <= rhs : sg === '>' ? Y > rhs : Y >= rhs;
    const col = ok ? 'green' : 'red';
    glow(ctx, color(col), 14); dot(ctx, a.px(X), a.py(Y), 9, col); ctx.shadowBlur = 0;
    const right = X > 1;
    label(ctx, `(${fmt(X, 1)}, ${fmt(Y, 1)}): ${fmt(Y, 1)} ${ok ? sg : NEG[sg]} ${fmt(rhs)} ${ok ? '✓' : '✗'}`, a.px(X) + (right ? -16 : 16), a.py(Y) - 22, { size: 20, weight: 700, fill: col, align: right ? 'right' : 'left' });
    ctx.restore();
  };

  // Exponential growth and decay: ×r and ÷r at every step of 1.
  S.exponential = (b, ctx, it, t) => {
    const r = clamp(num(it.r, 2), 1.2, 4); const N = 4; const top = r ** N;
    const a = (it._a ||= axes({ x: FIG.x + 90, y: FIG.y + 120, w: FIG.w - 140, h: FIG.h - 200 }, 0, N + 0.5, 0, top * 1.15));
    const g = (x) => r ** x; const d = (x) => top * r ** -x;
    const half = r === 2;
    ctx.save(); alpha(ctx, ramp(t, 0, 0.4)); drawAxes(ctx, a, { xt: [0, 1, 2, 3, 4], yt: nice(0, top * 1.15, 5), xName: 'x' }); ctx.restore();
    parts(ctx, [[`y = ${fmt(r)}ˣ`, 'orange'], [half ? '   doubles each step' : `   ×${fmt(r)} each step`, 'muted']], cx, FIG.y + 30, 24, 700);
    parts(ctx, [[`y = ${fmt(top)} × (${half ? '½' : `1/${fmt(r)}`})ˣ`, 'cyan'], [half ? '   halves each step' : `   ÷${fmt(r)} each step`, 'muted']], cx, FIG.y + 66, 24, 700);
    plot(ctx, a, g, 'orange', 4.5, 0, (N + 0.5) * clamp((t - 0.3) / 1.2), 120);
    plot(ctx, a, d, 'cyan', 4.5, 0, (N + 0.5) * clamp((t - 0.6) / 1.2), 120);
    if (t < 1.8) return;
    const sl = slot(b.clock, N, 2.2); const k = sl.i; const e = edge(sl.f, 0.12) * ramp(t, 2.2, 0.4);
    for (let i = 0; i <= N; i++) {
      const p = pop(t, 1.8 + i * 0.08, 0.3);
      const on = i === k || i === k + 1;
      dot(ctx, a.px(i), a.py(g(i)), (on ? 8 : 6) * p, 'orange'); dot(ctx, a.px(i), a.py(d(i)), (on ? 8 : 6) * p, 'cyan');
    }
    if (e <= 0) return;
    ctx.save();
    alpha(ctx, e);
    const X = a.px(k + 1);
    seg(ctx, a.px(k), a.py(g(k)), X, a.py(g(k)), 'orange', 2, [5, 5]); seg(ctx, X, a.py(g(k)), X, a.py(g(k + 1)), 'orange', 2.5);
    seg(ctx, a.px(k), a.py(d(k)), X, a.py(d(k)), 'cyan', 2, [5, 5]); seg(ctx, X, a.py(d(k)), X, a.py(d(k + 1)), 'cyan', 2.5);
    label(ctx, `×${fmt(r)}:  ${fmt(g(k))} → ${fmt(g(k + 1))}`, a.px(2.25), a.box.y + 24, { size: 22, weight: 700, fill: 'orange' });
    label(ctx, `÷${fmt(r)}:  ${fmt(d(k))} → ${fmt(d(k + 1))}`, a.px(2.25), a.box.y + 58, { size: 22, weight: 700, fill: 'cyan' });
    ctx.restore();
  };

  // Graph transformations: f(x) + a, f(x + a), af(x), f(ax), −f(x), one after another.
  S['transformations-graph'] = (b, ctx, it, t) => {
    const G = (it._g ||= (() => {
      const src = String(it.f ?? 'x^2'); const f = compile(src) || ((x) => x * x);
      const trig = /sin|cos/.test(src); const X = trig ? 2 * Math.PI : 5;
      let [y0, y1] = /^\s*x\s*(\^\s*2|²)\s*$/.test(src) || !compile(src) ? [-6, 9] : trig ? [-3, 3] : yRange(f, -X / 2, X / 2, 0.1);
      if (!trig && compile(src) && !/^\s*x\s*(\^\s*2|²)\s*$/.test(src)) { y0 -= 2.5; y1 += 2.5; }
      return { f, name: compile(src) ? pretty(src) : 'x²', a: axes({ x: FIG.x + 70, y: FIG.y + 120, w: FIG.w - 110, h: FIG.h - 200 }, -X, X, y0, y1) };
    })());
    const { f, a } = G; const f1 = f(1);
    const MODES = [
      { name: 'f(x) + 2', say: 'translate up 2', g: (x, s) => f(x) + 2 * s, P: (s) => [1, f1 + 2 * s], c: 'orange' },
      { name: 'f(x + 2)', say: 'translate left 2', g: (x, s) => f(x + 2 * s), P: (s) => [1 - 2 * s, f1], c: 'green' },
      { name: '2f(x)', say: 'stretch vertically, scale factor 2', g: (x, s) => (1 + s) * f(x), P: (s) => [1, (1 + s) * f1], c: 'cyan' },
      { name: 'f(2x)', say: 'stretch horizontally, scale factor ½', g: (x, s) => f((1 + s) * x), P: (s) => [1 / (1 + s), f1], c: 'teal' },
      { name: `${MINUS}f(x)`, say: 'reflect in the x-axis', g: (x, s) => (1 - 2 * s) * f(x), P: (s) => [1, (1 - 2 * s) * f1], c: 'red' },
    ];
    const sl = slot(Math.max(0, t - 0.8), MODES.length, 4.2); const md = MODES[sl.i];
    const s = hold(sl.f, 0.08, 0.38, 0.8, 0.98) * ramp(t, 1, 0.3);
    ctx.save(); alpha(ctx, ramp(t, 0, 0.4)); drawAxes(ctx, a, { xName: 'x', yName: 'y', fx: (v) => fmt(v, 1) }); ctx.restore();
    ctx.save(); ctx.setLineDash([9, 8]); plot(ctx, a, f, 'rgba(200,215,255,0.55)', 3, a.x0, a.x1, 160, 0); ctx.restore();
    plot(ctx, a, (x) => md.g(x, s), md.c, 4.5, a.x0, a.x0 + (a.x1 - a.x0) * clamp((t - 0.2) / 1), 160);
    parts(ctx, [['y = ', 'ink'], [md.name, md.c]], cx, FIG.y + 34, 34, 800);
    label(ctx, md.say, cx, FIG.y + 76, { size: 22, weight: 600, fill: 'muted' });
    label(ctx, `dashed: y = f(x) = ${G.name}`, cx, BY - 28, { size: 21, weight: 600, fill: 'muted' });
    if (s > 0.05) {
      const [ax, ay] = md.P(0); const [bx, by] = md.P(s);
      if (Number.isFinite(ay) && Number.isFinite(by)) {
        ctx.save(); clipBox(ctx, a.box);
        dot(ctx, a.px(ax), a.py(ay), 7, 'rgba(200,215,255,0.8)');
        if (Math.hypot(a.px(bx) - a.px(ax), a.py(by) - a.py(ay)) > 16) arrow(ctx, a.px(ax), a.py(ay), a.px(bx), a.py(by), md.c, 3);
        glow(ctx, color(md.c), 12); dot(ctx, a.px(bx), a.py(by), 8, md.c); ctx.shadowBlur = 0;
        ctx.restore();
      }
    }
  };

  // Sequences: growing dot patterns, the difference, and the nth term.
  S.sequence = (b, ctx, it, t) => {
    const d = clamp(Math.round(num(it.d, 3)), 1, 6); const c = clamp(Math.round(num(it.c, 1)), 1 - d, 6);
    const sp = 24; const yc = FIG.y + 250;
    const term = (n) => d * n + c;
    const hl = t > 2.6 ? slot(b.clock, 4, 1.4) : null;
    title(ctx, 'Growing patterns');
    for (let n = 1; n <= 4; n++) {
      const t0 = 0.3 + (n - 1) * 0.5;
      const xc = FIG.x + 100 + (n - 1) * 200;
      const extraCols = c > 0 ? Math.ceil(c / d) : 0;
      const w = (n + extraCols - 1) * sp; const xl = xc - w / 2; const yt = yc - ((d - 1) * sp) / 2;
      ctx.save(); alpha(ctx, ramp(t, t0, 0.3));
      label(ctx, `n = ${n}`, xc, FIG.y + 110, { size: 20, weight: 600, fill: 'muted' });
      ctx.restore();
      const on = hl && hl.i === n - 1 ? edge(hl.f, 0.2) : 0;
      for (let col = 0; col < n; col++) for (let row = 0; row < d; row++) {
        const p = pop(t, t0 + (col * d + row) * 0.02, 0.3);
        if (p <= 0) continue;
        const x = xl + (extraCols + col) * sp; const y = yt + row * sp;
        const removed = c < 0 && col === 0 && row < -c;
        if (removed) { ring(ctx, x, y, 7 * p, 'rgba(200,215,255,0.4)', 2, null); continue; }
        const isNew = n > 1 && col === n - 1;
        if (isNew && on > 0.3) glow(ctx, COLORS.green, 12);
        dot(ctx, x, y, 8 * p, isNew ? 'green' : 'blue');
        ctx.shadowBlur = 0;
      }
      for (let i = 0; i < Math.max(0, c); i++) { const p = pop(t, t0, 0.3); dot(ctx, xl + Math.floor(i / d) * sp, yt + (i % d) * sp, 8 * p, 'orange'); }
      ctx.save(); alpha(ctx, ramp(t, t0 + 0.3, 0.3));
      label(ctx, String(term(n)), xc, FIG.y + 380, { size: 34, weight: 800, fill: 'cyan' });
      if (n > 1) { label(ctx, `+${d}`, xc - 100, FIG.y + 428, { size: 22, weight: 700, fill: 'green' }); arrow(ctx, xc - 160, FIG.y + 400, xc - 40, FIG.y + 400, 'green', 2.5); }
      ctx.restore();
    }
    if (t < 2.4) return;
    ctx.save();
    alpha(ctx, ramp(t, 2.4, 0.5));
    const nth = poly([[d, 1], [c, 0]]).replace(/x/g, 'n');
    glow(ctx, COLORS.cyan, 14); label(ctx, `nth term = ${nth}`, cx, FIG.y + 520, { size: 36, weight: 800, fill: 'cyan' }); ctx.shadowBlur = 0;
    label(ctx, `up ${d} each time → ${d}n, then ${c < 0 ? MINUS : '+'} ${Math.abs(c)} to start at ${term(1)}`, cx, FIG.y + 580, { size: 22, weight: 600, fill: 'muted' });
    label(ctx, `100th term = ${d} × 100 ${c < 0 ? MINUS : '+'} ${Math.abs(c)} = ${term(100)}`, cx, BY - 40, { size: 26, weight: 700, fill: 'orange' });
    ctx.restore();
  };

  // ——— Geometry and trigonometry ———

  // Pythagoras: a square on each side; the two small squares pour into the big one.
  S.pythagoras = (b, ctx, it, t) => {
    const A = clamp(num(it.a, 3), 0.5, 40); const Bv = clamp(num(it.b, 4), 0.5, 40); const Cv = Math.hypot(A, Bv);
    const whole = Number.isInteger(A) && Number.isInteger(Bv) && Math.abs(Cv - Math.round(Cv)) < 1e-9 && A * A + Bv * Bv <= 400;
    const s = Math.min(700 / (A + 2 * Bv), 520 / (2 * A + Bv));
    const ox = FIG.x + (FIG.w - s * (A + 2 * Bv)) / 2 + s * Bv; const oy = FIG.y + 80 + s * (A + Bv);
    const P = (x, y) => [ox + x * s, oy + y * s];
    const Cp = P(0, 0); const Ap = P(A, 0); const Bp = P(0, -Bv); const V = [Bv * s, -A * s];
    // A square grows out of its side: base corners fixed, outer corners slide out.
    const square = (b0, b1, o1, o0, c, g, grid, n) => {
      if (g <= 0) return;
      const q1 = [lerp(b1[0], o1[0], g), lerp(b1[1], o1[1], g)]; const q0 = [lerp(b0[0], o0[0], g), lerp(b0[1], o0[1], g)];
      shape(ctx, [b0, b1, q1, q0], c, 0.22, 3);
      if (grid && g > 0.98 && n <= 20) {
        ctx.strokeStyle = tint(c, 0.45); ctx.lineWidth = 1; ctx.beginPath();
        for (let i = 1; i < n; i++) { const f = i / n; ctx.moveTo(lerp(b0[0], b1[0], f), lerp(b0[1], b1[1], f)); ctx.lineTo(lerp(o0[0], o1[0], f), lerp(o0[1], o1[1], f)); ctx.moveTo(lerp(b0[0], o0[0], f), lerp(b0[1], o0[1], f)); ctx.lineTo(lerp(b1[0], o1[0], f), lerp(b1[1], o1[1], f)); }
        ctx.stroke();
      }
    };
    const gA = ramp(t, 0.4, 0.5); const gB = ramp(t, 0.7, 0.5); const gC = ramp(t, 1.0, 0.6);
    square(P(0, 0), P(A, 0), P(A, A), P(0, A), 'blue', gA, Number.isInteger(A), A);
    square(P(0, 0), P(0, -Bv), P(-Bv, -Bv), P(-Bv, 0), 'orange', gB, Number.isInteger(Bv), Bv);
    square(Ap, Bp, [Bp[0] + V[0], Bp[1] + V[1]], [Ap[0] + V[0], Ap[1] + V[1]], 'purple', gC, whole, Math.round(Cv));
    ctx.save();
    alpha(ctx, ramp(t, 0, 0.4));
    shape(ctx, [Cp, Ap, Bp], 'ink', 0.12, 3.5);
    rightMark(ctx, Cp[0], Cp[1], 1, 0, 0, -1, 18);
    ctx.restore();
    // The pour, on a 9 s loop: cell by cell when c is whole, a rising fill otherwise.
    const g = ramp(t, 2.3, 0.5);
    const tau = loop(b.clock, 9) * 9;
    const fadeOut = 1 - clamp((tau - 7.2) / 1);
    if (g > 0 && whole) {
      const c = Math.round(Cv); const N = A * A + Bv * Bv;
      const u = [(-A / Cv) * s, (-Bv / Cv) * s]; const v = [V[0] / Cv, V[1] / Cv];
      const th0 = Math.atan2(u[1], u[0]); const th = th0 - (Math.PI / 2) * Math.round(th0 / (Math.PI / 2));
      ctx.save();
      alpha(ctx, g * fadeOut);
      for (let k = 0; k < N; k++) {
        const st = 1 + (k / N) * 2.5;
        if (tau < st) break;
        const m = inOut(clamp((tau - st) / 1));
        const src = k < A * A ? P((k % A) + 0.5, Math.floor(k / A) + 0.5) : P(-((k - A * A) % Bv) - 0.5, -Math.floor((k - A * A) / Bv) - 0.5);
        const p = k % c; const q = Math.floor(k / c);
        const dst = [Ap[0] + (p + 0.5) * u[0] + (q + 0.5) * v[0], Ap[1] + (p + 0.5) * u[1] + (q + 0.5) * v[1]];
        ctx.save();
        ctx.translate(lerp(src[0], dst[0], m), lerp(src[1], dst[1], m)); ctx.rotate(th * m);
        ctx.fillStyle = tint(k < A * A ? 'blue' : 'orange', 0.75); ctx.fillRect(-s / 2 + 2, -s / 2 + 2, s - 4, s - 4);
        ctx.restore();
      }
      ctx.restore();
    } else if (g > 0) {
      const fill = inOut(clamp((tau - 1) / 3.5)); const fb = (A * A) / (Cv * Cv);
      const strip = (q0, q1, c) => { if (q1 <= q0) return; path(ctx, [[Ap[0] + V[0] * q0, Ap[1] + V[1] * q0], [Bp[0] + V[0] * q0, Bp[1] + V[1] * q0], [Bp[0] + V[0] * q1, Bp[1] + V[1] * q1], [Ap[0] + V[0] * q1, Ap[1] + V[1] * q1]]); ctx.fillStyle = tint(c, 0.6); ctx.fill(); };
      ctx.save(); alpha(ctx, g * fadeOut);
      strip(0, Math.min(fill, fb), 'blue'); strip(fb, Math.max(fb, fill), 'orange');
      ctx.restore();
    }
    // Areas in the squares, lengths on the sides, the sum underneath.
    const area = (x, y, side, c, gg) => { if (gg > 0.9) label(ctx, side * s >= 110 ? `${fmt(side)}² = ${fmt(side * side)}` : fmt(side * side), x, y, { size: side * s >= 110 ? 24 : 22, weight: 800, fill: c }); };
    area(...P(A / 2, A / 2), A, 'blue', gA);
    area(...P(-Bv / 2, -Bv / 2), Bv, 'orange', gB);
    if (gC > 0.9) tag(ctx, (Ap[0] + Bp[0] + V[0]) / 2, (Ap[1] + Bp[1] + V[1]) / 2, Cv * s >= 110 ? `${fmt(Cv)}² = ${fmt(Cv * Cv)}` : fmt(Cv * Cv), 'purple', 24);
    if (t > 1.6) {
      ctx.save(); alpha(ctx, ramp(t, 1.6, 0.5));
      const S2 = A * A + Bv * Bv;
      if (whole) parts(ctx, [[`${A}²`, 'blue'], [' + ', 'ink'], [`${Bv}²`, 'orange'], [' = ', 'ink'], [A * A, 'blue'], [' + ', 'ink'], [Bv * Bv, 'orange'], [` = ${S2} = `, 'ink'], [`${Math.round(Cv)}²`, 'purple']], cx, BY - 40, 32, 800);
      else parts(ctx, [[`${fmt(A)}²`, 'blue'], [' + ', 'ink'], [`${fmt(Bv)}²`, 'orange'], [` = ${fmt(S2)},  c = √${fmt(S2)} ≈ `, 'ink'], [fmt(Cv), 'purple']], cx, BY - 40, 28, 800);
      ctx.restore();
    }
    title(ctx, 'a² + b² = c²', 'ink', 28);
  };

  // Parallel lines and a transversal: corresponding, alternate, co-interior, vertically opposite.
  S['angles-parallel'] = (b, ctx, it, t) => {
    const th = clamp(Math.round(num(it.angle, 65)), 25, 155); const r = (th * Math.PI) / 180;
    const y1 = FIG.y + 230; const y2 = FIG.y + 450; const dd = (y2 - y1) / (2 * Math.tan(r));
    const P1 = [cx + dd, y1]; const P2 = [cx - dd, y2];
    const len = Math.hypot(P1[0] - P2[0], P1[1] - P2[1]); const ux = (P1[0] - P2[0]) / len; const uy = (P1[1] - P2[1]) / len;
    const SECT = { TR: [-r, 0, th], BR: [0, Math.PI - r, 180 - th], BL: [Math.PI - r, Math.PI, th], TL: [Math.PI, TAU - r, 180 - th] };
    const MODES = [
      { name: 'Corresponding angles are equal', pairs: [[0, 'TR'], [1, 'TR']], cs: ['orange', 'orange'] },
      { name: 'Alternate angles are equal', pairs: [[0, 'BL'], [1, 'TR']], cs: ['orange', 'orange'] },
      { name: 'Co-interior angles add up to 180°', pairs: [[0, 'BR'], [1, 'TR']], cs: ['cyan', 'orange'] },
      { name: 'Vertically opposite angles are equal', pairs: [[0, 'TR'], [0, 'BL']], cs: ['orange', 'orange'] },
    ];
    const sl = slot(Math.max(0, t - 1.2), MODES.length, 3.8); const md = MODES[sl.i]; const e = edge(sl.f, 0.1) * ramp(t, 1.2, 0.4);
    ctx.save();
    alpha(ctx, ramp(t, 0, 0.5));
    for (const y of [y1, y2]) {
      seg(ctx, FIG.x + 30, y, RX - 30, y, 'rgba(220,230,255,0.85)', 4);
      ctx.strokeStyle = 'rgba(220,230,255,0.85)'; ctx.lineWidth = 3; ctx.beginPath();
      for (const dx of [0, 14]) { ctx.moveTo(FIG.x + 110 + dx, y - 9); ctx.lineTo(FIG.x + 120 + dx, y); ctx.lineTo(FIG.x + 110 + dx, y + 9); }
      ctx.stroke();
    }
    glow(ctx, COLORS.blue, 12);
    seg(ctx, P2[0] - ux * 160, P2[1] - uy * 160, P1[0] + ux * 160, P1[1] + uy * 160, 'blue', 4);
    ctx.shadowBlur = 0;
    ctx.restore();
    if (e <= 0) return;
    ctx.save();
    alpha(ctx, e);
    md.pairs.forEach(([pi, key], i) => {
      const [x, y] = pi ? P2 : P1; const [a0, a1, size] = SECT[key]; const c = md.cs[i];
      glow(ctx, color(c), 12); wedge(ctx, x, y, 52, a0, a1, c, 0.35); ctx.shadowBlur = 0;
      const mid = (a0 + a1) / 2;
      label(ctx, `${size}°`, x + Math.cos(mid) * 88, y + Math.sin(mid) * 88, { size: 26, weight: 800, fill: c });
    });
    const [p, q] = md.pairs.map(([, key]) => SECT[key][2]);
    label(ctx, md.name, cx, FIG.y + 40, { size: 26, weight: 700, fill: 'ink' });
    parts(ctx, md.cs[0] === md.cs[1] ? [[`${p}°`, md.cs[0]], [' = ', 'ink'], [`${q}°`, md.cs[1]]] : [[`${p}°`, md.cs[0]], [' + ', 'ink'], [`${q}°`, md.cs[1]], [' = 180°', 'ink']], cx, BY - 50, 36, 800);
    ctx.restore();
  };

  // Interior angles of a polygon: split from one vertex into n − 2 triangles of 180°.
  const PNAME = { 3: 'Triangle', 4: 'Quadrilateral', 5: 'Pentagon', 6: 'Hexagon', 7: 'Heptagon', 8: 'Octagon', 9: 'Nonagon', 10: 'Decagon', 11: 'Hendecagon', 12: 'Dodecagon' };
  S['polygon-angles'] = (b, ctx, it, t) => {
    const fixed = it.n != null;
    const sl = fixed ? null : slot(b.clock, 6, 4.5);
    const n = fixed ? clamp(Math.round(num(it.n, 6)), 3, 12) : 3 + sl.i;
    const lt = fixed ? t : sl.f * 4.5; const e = (fixed ? 1 : edge(sl.f, 0.05)) * ramp(t, 0, 0.4);
    const R = 230; const ox = cx; const oy = cy + 10;
    const V = Array.from({ length: n }, (_, k) => { const a = Math.PI / 2 + Math.PI / n + (k * TAU) / n; return [ox + Math.cos(a) * R, oy + Math.sin(a) * R]; });
    ctx.save();
    alpha(ctx, e);
    for (let i = 1; i <= n - 2; i++) {
      const q = ramp(lt, 0.4 + (i - 1) * (1.6 / Math.max(1, n - 2)), 0.35);
      if (q <= 0) break;
      const c = HUES[(i - 1) % HUES.length];
      ctx.save(); alpha(ctx, q);
      shape(ctx, [V[0], V[i], V[i + 1]], c, 0.3, 2.5);
      if (n <= 8) label(ctx, '180°', (V[0][0] + V[i][0] + V[i + 1][0]) / 3, (V[0][1] + V[i][1] + V[i + 1][1]) / 3, { size: 20, weight: 700, fill: 'ink' });
      ctx.restore();
    }
    glow(ctx, COLORS.ink, 10); path(ctx, V); ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 4; ctx.stroke(); ctx.shadowBlur = 0;
    glow(ctx, COLORS.yellow, 14); dot(ctx, V[0][0], V[0][1], 9, 'yellow'); ctx.shadowBlur = 0;
    label(ctx, `${PNAME[n]}: ${n} sides → ${n - 2} triangle${n === 3 ? '' : 's'}`, cx, FIG.y + 34, { size: 26, weight: 700, fill: 'ink' });
    if (lt > 2.1) {
      alpha(ctx, ramp(lt, 2.1, 0.4));
      parts(ctx, [[`(${n} − 2)`, 'cyan'], [' × 180° = ', 'ink'], [`${(n - 2) * 180}°`, 'yellow']], cx, BY - 66, 34, 800);
      label(ctx, `each angle of a regular ${PNAME[n].toLowerCase()}: ${(n - 2) * 180}° ÷ ${n} = ${fmt(((n - 2) * 180) / n, 1)}°`, cx, BY - 22, { size: 21, weight: 600, fill: 'muted' });
    }
    ctx.restore();
  };

  // The angle at the centre is twice the angle at the circumference, wherever P is.
  S['circle-theorem'] = (b, ctx, it, t) => {
    const th = clamp(num(it.angle, 50), 15, 85); const c = (2 * th * Math.PI) / 180;
    const ox = cx; const oy = cy + 30; const R = 235;
    const aA = Math.PI / 2 + c / 2; const aB = Math.PI / 2 - c / 2;
    const A = [ox + Math.cos(aA) * R, oy + Math.sin(aA) * R]; const B = [ox + Math.cos(aB) * R, oy + Math.sin(aB) * R];
    const half = Math.PI - c / 2;
    const pa = -Math.PI / 2 + 0.72 * half * Math.sin((TAU * b.clock) / 9) * ramp(t, 1.8, 1);
    const P = [ox + Math.cos(pa) * R, oy + Math.sin(pa) * R];
    ctx.save();
    alpha(ctx, ramp(t, 0, 0.4));
    glow(ctx, COLORS.cyan, 14); ring(ctx, ox, oy, R, 'cyan', 3, null); ctx.shadowBlur = 0;
    seg(ctx, A[0], A[1], B[0], B[1], 'rgba(200,215,255,0.35)', 2);
    ctx.restore();
    const q1 = ramp(t, 0.4, 0.5);
    ctx.save(); alpha(ctx, q1);
    seg(ctx, ox, oy, A[0], A[1], 'purple', 4); seg(ctx, ox, oy, B[0], B[1], 'purple', 4);
    wedge(ctx, ox, oy, 46, aB, aA, 'purple', 0.3);
    label(ctx, `${fmt(2 * th, 1)}°`, ox, oy + 76, { size: 26, weight: 800, fill: 'purple' });
    ctx.restore();
    const q2 = ramp(t, 0.9, 0.5);
    let atP = 0;
    if (q2 > 0) {
      ctx.save(); alpha(ctx, q2);
      seg(ctx, P[0], P[1], A[0], A[1], 'orange', 4); seg(ctx, P[0], P[1], B[0], B[1], 'orange', 4);
      const fA = Math.atan2(A[1] - P[1], A[0] - P[0]); const fB = Math.atan2(B[1] - P[1], B[0] - P[0]);
      let d = fB - fA; d = ((d + Math.PI) % TAU + TAU) % TAU - Math.PI;
      atP = Math.abs(d) * 180 / Math.PI;
      wedge(ctx, P[0], P[1], 40, fA, fA + d, 'orange', 0.3, d < 0);
      const mid = fA + d / 2;
      label(ctx, `${fmt(atP, 1)}°`, P[0] + Math.cos(mid) * 72, P[1] + Math.sin(mid) * 72, { size: 24, weight: 800, fill: 'orange' });
      glow(ctx, COLORS.orange, 14); dot(ctx, P[0], P[1], 8, 'orange'); ctx.shadowBlur = 0;
      ctx.restore();
    }
    for (const [pt, ang, name] of [[A, aA, 'A'], [B, aB, 'B'], [P, pa, 'P']]) label(ctx, name, ox + Math.cos(ang) * (R + 24), oy + Math.sin(ang) * (R + 24), { size: 22, weight: 700, fill: 'ink' });
    dot(ctx, ox, oy, 6, 'ink'); label(ctx, 'O', ox, oy - 20, { size: 22, weight: 700, fill: 'ink' });
    label(ctx, 'Angle at the centre = 2 × angle at the circumference', cx, FIG.y + 30, { size: 24, weight: 700, fill: 'ink' });
    if (t > 1.4) { ctx.save(); alpha(ctx, ramp(t, 1.4, 0.4)); parts(ctx, [[`${fmt(2 * th, 1)}°`, 'purple'], [' = 2 × ', 'ink'], [`${fmt(atP || th, 1)}°`, 'orange']], cx, BY - 26, 32, 800); ctx.restore(); }
  };

  // Transformations: translate, rotate, reflect and enlarge a triangle, in turn.
  S.transformations = (b, ctx, it, t) => {
    const u = 40; const ox = cx; const oy = FIG.y + 90 + 7 * u;
    const W = ([x, y]) => [ox + x * u, oy - y * u];
    const tri = [[1, 1], [4, 1], [1, 3]];
    const MODES = [
      { name: `Translation by the vector (${MINUS}6, ${MINUS}4)`, rule: '6 left and 4 down', c: 'orange', at: ([x, y], s) => [x - 6 * s, y - 4 * s] },
      { name: 'Rotation 90° clockwise about (0, 0)', rule: `(x, y) → (y, ${MINUS}x)`, c: 'purple', at: ([x, y], s) => { const r = (-s * Math.PI) / 2; return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)]; } },
      { name: 'Reflection in the mirror line x = 0', rule: `(x, y) → (${MINUS}x, y)`, c: 'green', at: ([x, y], s) => [x * Math.cos(Math.PI * s), y] },
      { name: 'Enlargement, scale factor 2, centre (0, 0)', rule: '(x, y) → (2x, 2y)', c: 'cyan', at: ([x, y], s) => [x * (1 + s), y * (1 + s)] },
    ];
    const sl = slot(Math.max(0, t - 1), MODES.length, 4.6); const md = MODES[sl.i];
    const s = hold(sl.f, 0.1, 0.45, 0.82, 0.97) * ramp(t, 1, 0.3); const e = edge(sl.f, 0.05) * ramp(t, 0.8, 0.4);
    ctx.save();
    alpha(ctx, ramp(t, 0, 0.4));
    ctx.strokeStyle = 'rgba(140,170,255,0.13)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = -8; x <= 8; x++) { ctx.moveTo(ox + x * u, oy - 7 * u); ctx.lineTo(ox + x * u, oy + 7 * u); }
    for (let y = -7; y <= 7; y++) { ctx.moveTo(ox - 8 * u, oy + y * u); ctx.lineTo(ox + 8 * u, oy + y * u); }
    ctx.stroke();
    seg(ctx, ox - 8 * u, oy, ox + 8 * u, oy, 'rgba(200,215,255,0.55)', 2); seg(ctx, ox, oy - 7 * u, ox, oy + 7 * u, 'rgba(200,215,255,0.55)', 2);
    for (let v = -6; v <= 6; v += 2) if (v) { label(ctx, fmt(v), ox + v * u, oy + 16, { size: 17, weight: 500, fill: 'muted' }); label(ctx, fmt(v), ox - 8, oy - v * u, { size: 17, weight: 500, fill: 'muted', align: 'right' }); }
    ctx.restore();
    // Helpers for each transformation: mirror line, centre, rays, arrows.
    if (e > 0) {
      ctx.save(); alpha(ctx, e);
      if (sl.i === 2) { glow(ctx, COLORS.green, 14); seg(ctx, ox, oy - 7 * u, ox, oy + 7 * u, 'green', 4, [12, 8]); ctx.shadowBlur = 0; }
      if (sl.i === 1 || sl.i === 3) { glow(ctx, color(md.c), 14); dot(ctx, ox, oy, 8, md.c); ctx.shadowBlur = 0; }
      if (sl.i === 1 && s > 0.02) { ctx.strokeStyle = color(md.c); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(ox, oy, 2.2 * u, -Math.atan2(1, 4), -Math.atan2(1, 4) + (s * Math.PI) / 2); ctx.stroke(); }
      if (sl.i === 3) tri.forEach((p) => { const [x, y] = W(md.at(p, 1)); seg(ctx, ox, oy, x, y, 'rgba(34,211,238,0.5)', 1.5, [6, 6]); });
      if (sl.i === 0 && s > 0.1) tri.forEach((p) => { const [x0, y0] = W(p); const [x1, y1] = W(md.at(p, s)); if (Math.hypot(x1 - x0, y1 - y0) > 20) arrow(ctx, x0, y0, x1, y1, 'rgba(255,159,67,0.6)', 2); });
      ctx.restore();
    }
    ctx.save();
    alpha(ctx, ramp(t, 0.3, 0.4));
    shape(ctx, tri.map(W), 'blue', 0.3, 3);
    tri.forEach((p, i) => { const [x, y] = W(p); label(ctx, 'ABC'[i], x + (i === 1 ? 14 : -14), y + (i === 2 ? -14 : 14), { size: 18, weight: 700, fill: 'blue' }); });
    ctx.restore();
    if (e > 0) {
      ctx.save(); alpha(ctx, e);
      const img = tri.map((p) => md.at(p, s));
      glow(ctx, color(md.c), 14); shape(ctx, img.map(W), md.c, 0.35, 3.5); ctx.shadowBlur = 0;
      if (s > 0.9) img.forEach((p, i) => { const [x, y] = W(p); label(ctx, `${'ABC'[i]}′`, x + 14, y - 14, { size: 18, weight: 700, fill: md.c }); });
      label(ctx, md.name, cx, FIG.y + 30, { size: 24, weight: 700, fill: md.c });
      label(ctx, md.rule, cx, FIG.y + 66, { size: 21, weight: 600, fill: 'muted' });
      ctx.restore();
    }
  };

  // Area of a circle: cut into sectors, laid head to tail, it becomes a rectangle πr by r.
  S['circle-area'] = (b, ctx, it, t) => {
    const r = num(it.r, 3); const R = 130; const ccx = cx; const ccy = FIG.y + 200;
    const NS = [8, 16, 32]; const sl = slot(b.clock, 3, 6.5); const n = NS[sl.i];
    const mv = hold(sl.f, 0.12, 0.42, 0.8, 0.97) * ramp(t, 0.8, 0.6);
    const w = TAU / n; const chord = 2 * R * Math.sin(w / 2); const half = n / 2;
    const Wd = (half + 0.5) * chord; const x0 = cx - Wd / 2; const yTop = FIG.y + 400;
    const q = pop(t, 0, 0.5);
    title(ctx, 'Area of a circle');
    label(ctx, `${n} sectors`, RX - 20, FIG.y + 62, { size: 20, weight: 600, fill: 'muted', align: 'right' });
    if (mv > 0.02) { ctx.save(); ctx.setLineDash([6, 8]); ring(ctx, ccx, ccy, R, 'rgba(200,215,255,0.35)', 2, null); ctx.restore(); }
    ctx.save();
    ctx.translate(ccx, ccy); ctx.scale(q, q); ctx.translate(-ccx, -ccy);
    for (let i = 0; i < n; i++) {
      const up = i < half; const k = up ? i : i - half;
      let dr = (up ? Math.PI / 2 : -Math.PI / 2) - (i + 0.5) * w; dr = ((dr + Math.PI) % TAU + TAU) % TAU - Math.PI;
      const ax = up ? x0 + (k + 0.5) * chord : x0 + (k + 1) * chord; const ay = up ? yTop : yTop + R;
      ctx.save();
      ctx.translate(lerp(ccx, ax, mv), lerp(ccy, ay, mv)); ctx.rotate(dr * mv);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, i * w, (i + 1) * w); ctx.closePath();
      ctx.fillStyle = tint(up ? 'blue' : 'orange', 0.45); ctx.fill(); ctx.strokeStyle = 'rgba(233,238,255,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    if (mv <= 0.02) { ctx.save(); alpha(ctx, ramp(t, 0.5, 0.4)); seg(ctx, ccx, ccy, ccx + R, ccy, 'yellow', 3); label(ctx, 'r', ccx + R / 2, ccy - 16, { size: 24, weight: 800, fill: 'yellow' }); ctx.restore(); }
    const lab = clamp((mv - 0.7) / 0.3);
    if (lab > 0) {
      ctx.save(); alpha(ctx, lab);
      brace(ctx, x0, x0 + Wd, yTop + R + 12, 1, 'yellow');
      label(ctx, 'πr  (half the circumference)', cx, yTop + R + 54, { size: 22, weight: 700, fill: 'yellow' });
      seg(ctx, x0 - 18, yTop, x0 - 18, yTop + R, 'cyan', 3);
      label(ctx, 'r', x0 - 34, yTop + R / 2, { size: 26, weight: 800, fill: 'cyan' });
      ctx.restore();
    }
    if (t > 1.6) {
      ctx.save(); alpha(ctx, ramp(t, 1.6, 0.5));
      parts(ctx, [['Area ≈ ', 'ink'], ['πr', 'yellow'], [' × ', 'ink'], ['r', 'cyan'], [' = πr²', 'ink']], cx, BY - 70, 30, 800);
      label(ctx, `r = ${fmt(r)}: π × ${fmt(r)}² ≈ ${fmt(Math.PI * r * r)}`, cx, BY - 28, { size: 22, weight: 600, fill: 'muted' });
      ctx.restore();
    }
  };

  // Volume of a prism: the cross-section slides back, leaving a slice every unit.
  S['volume-prism'] = (b, ctx, it, t) => {
    const fixed = it.shape === 'triangle' || it.shape === 'cylinder' ? it.shape : null;
    const sl = fixed ? { i: 0, f: loop(t, 7.5) } : slot(t, 2, 7.5);
    const kind = fixed || (sl.i === 0 ? 'triangle' : 'cylinder'); const f = sl.f; const e = edge(f, 0.04);
    const u = 44; const L = kind === 'triangle' ? 10 : 8; const dv = [Math.cos(Math.PI / 6) * u * 0.55, -Math.sin(Math.PI / 6) * u * 0.55];
    const area = kind === 'triangle' ? 6 : 9 * Math.PI;
    const O = kind === 'triangle' ? [cx - (4 * u + L * dv[0]) / 2, FIG.y + 480] : [cx - (6 * u + L * dv[0]) / 2 + 3 * u, FIG.y + 430];
    const sec = (x, y) => { ctx.beginPath(); if (kind === 'triangle') { ctx.moveTo(x, y); ctx.lineTo(x + 4 * u, y); ctx.lineTo(x + 2 * u, y - 3 * u); ctx.closePath(); } else ctx.arc(x, y, 3 * u, 0, TAU); };
    const p = inOut(clamp((f - 0.15) / 0.45)); const D = p * L;
    ctx.save();
    alpha(ctx, e);
    label(ctx, kind === 'triangle' ? 'Triangular prism' : 'Cylinder', cx, FIG.y + 30, { size: 26, weight: 700, fill: 'ink' });
    label(ctx, kind === 'triangle' ? 'cross-section A = ½ × 4 × 3 = 6 cm²' : 'cross-section A = π × 3² ≈ 28.27 cm²', cx, FIG.y + 70, { size: 22, weight: 700, fill: 'purple' });
    // Slices left behind, back to front, then the sliding cross-section.
    for (let j = Math.floor(D); j >= 1; j--) { sec(O[0] + dv[0] * j, O[1] + dv[1] * j); ctx.fillStyle = tint('purple', 0.08); ctx.fill(); ctx.strokeStyle = tint('purple', 0.45); ctx.lineWidth = 1.5; ctx.stroke(); }
    const verts = kind === 'triangle' ? [[0, 0], [4 * u, 0], [2 * u, -3 * u]] : [[0.5 * 3 * u, 0.866 * 3 * u], [-0.5 * 3 * u, -0.866 * 3 * u]];
    ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2.5; ctx.beginPath();
    for (const [vx, vy] of verts) { ctx.moveTo(O[0] + vx, O[1] + vy); ctx.lineTo(O[0] + vx + dv[0] * D, O[1] + vy + dv[1] * D); }
    ctx.stroke();
    if (p >= 1) { sec(O[0] + dv[0] * L, O[1] + dv[1] * L); ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2.5; ctx.stroke(); }
    sec(O[0], O[1]); ctx.fillStyle = tint('purple', 0.35); ctx.fill(); ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 3; ctx.stroke();
    if (p > 0 && p < 1) { glow(ctx, COLORS.cyan, 18); sec(O[0] + dv[0] * D, O[1] + dv[1] * D); ctx.fillStyle = tint('cyan', 0.3); ctx.fill(); ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 3; ctx.stroke(); ctx.shadowBlur = 0; }
    // Dimensions.
    if (kind === 'triangle') {
      label(ctx, '4 cm', O[0] + 2 * u, O[1] + 24, { size: 20, weight: 700, fill: 'ink' });
      seg(ctx, O[0] + 2 * u, O[1], O[0] + 2 * u, O[1] - 3 * u, 'rgba(233,238,255,0.6)', 2, [5, 5]);
      label(ctx, '3 cm', O[0] + 2 * u - 10, O[1] - 1.5 * u, { size: 20, weight: 700, fill: 'ink', align: 'right' });
    } else {
      seg(ctx, O[0], O[1], O[0] + 3 * u, O[1], 'yellow', 3);
      label(ctx, '3 cm', O[0] + 1.5 * u, O[1] + 20, { size: 20, weight: 700, fill: 'yellow' });
    }
    if (D > 0.5) {
      const bx = kind === 'triangle' ? O[0] + 4 * u : O[0] + 0.5 * 3 * u; const by = kind === 'triangle' ? O[1] : O[1] + 0.866 * 3 * u;
      label(ctx, `${fmt(D, 0)} cm`, bx + (dv[0] * D) / 2 + 16, by + (dv[1] * D) / 2 + 18, { size: 20, weight: 700, fill: 'cyan', align: 'left' });
    }
    if (p >= 1) {
      alpha(ctx, clamp((f - 0.6) / 0.08));
      const V = area * L;
      label(ctx, kind === 'triangle' ? `V = A × length = 6 × 10 = ${fmt(V)} cm³` : `V = A × length ≈ 28.27 × 8 ≈ ${fmt(V)} cm³`, cx, BY - 40, { size: 28, weight: 800, fill: 'cyan' });
    }
    ctx.restore();
  };

  // Similar shapes: lengths × k, areas × k² (k² small copies tile the big one).
  S['similar-shapes'] = (b, ctx, it, t) => {
    const k = clamp(num(it.k, 2), 1.5, 4); const kint = Number.isInteger(k);
    const u = Math.min(56, 640 / (4 + 4 * k), 400 / (3 * k)); const gap = 70;
    const total = (4 + 4 * k) * u + gap; const xs = cx - total / 2; const base = FIG.y + 540;
    const tri = (x, y, sc) => [[x, y], [x + 4 * u * sc, y], [x, y - 3 * u * sc]];
    const sides = (pts, sc, c) => {
      const [p0, p1, p2] = pts;
      label(ctx, fmt(4 * sc), (p0[0] + p1[0]) / 2, p0[1] + 24, { size: 22, weight: 700, fill: c });
      label(ctx, fmt(3 * sc), p0[0] - 12, (p0[1] + p2[1]) / 2, { size: 22, weight: 700, fill: c, align: 'right' });
      label(ctx, fmt(5 * sc), (p1[0] + p2[0]) / 2 + 14, (p1[1] + p2[1]) / 2 - 14, { size: 22, weight: 700, fill: c, align: 'left' });
    };
    label(ctx, `Similar triangles: scale factor ${fmt(k)}`, cx, FIG.y + 30, { size: 26, weight: 700, fill: 'ink' });
    const S0 = tri(xs, base, 1);
    ctx.save(); alpha(ctx, ramp(t, 0, 0.4));
    shape(ctx, S0, 'blue', 0.3, 3); rightMark(ctx, xs, base, 1, 0, 0, -1, 14);
    sides(S0, 1, 'blue');
    label(ctx, 'A = 6', xs + (4 * u) / 3, base - u, { size: 20, weight: 700, fill: 'blue' });
    ctx.restore();
    const g = inOut(clamp((t - 0.6) / 1));
    if (g <= 0) return;
    const bx0 = xs + 4 * u + gap;
    const Bt = tri(lerp(xs, bx0, g), base, lerp(1, k, g));
    glow(ctx, COLORS.orange, 14); shape(ctx, Bt, 'orange', 0.22, 3.5); ctx.shadowBlur = 0;
    if (g < 1) return;
    rightMark(ctx, bx0, base, 1, 0, 0, -1, 18);
    // The tiling: k² copies of the small triangle light up one by one.
    if (kint && t > 2) {
      const tiles = [];
      for (let j = 0; j < k; j++) for (let i = 0; i + j < k; i++) {
        const Q = (a, c2) => [bx0 + a * 4 * u, base - c2 * 3 * u];
        tiles.push([Q(i, j), Q(i + 1, j), Q(i, j + 1)]);
        if (i + j <= k - 2) tiles.push([Q(i + 1, j), Q(i, j + 1), Q(i + 1, j + 1)]);
      }
      const tau = loop(b.clock, 7) * 7; const lit = Math.min(tiles.length, Math.floor(clamp((tau - 0.6) / 3.2) * tiles.length + 0.999));
      const fa = (1 - clamp((tau - 6) / 0.8)) * ramp(t, 2, 0.4);
      ctx.save(); alpha(ctx, fa);
      tiles.forEach((tp, i) => { path(ctx, tp); if (i < lit) { ctx.fillStyle = tint('purple', 0.35); ctx.fill(); } ctx.strokeStyle = tint('purple', 0.8); ctx.lineWidth = 1.5; ctx.stroke(); });
      if (lit) label(ctx, `${lit} of ${tiles.length} small triangles`, bx0, base - 3 * k * u - 26, { size: 21, weight: 700, fill: 'purple', align: 'left' });
      ctx.restore();
    }
    ctx.save(); alpha(ctx, ramp(t, 1.6, 0.4));
    sides(Bt, k, 'orange');
    label(ctx, `A = ${fmt(6 * k * k)}`, bx0 + (4 * k * u) / 3, base - k * u, { size: 22, weight: 700, fill: 'orange' });
    parts(ctx, [[`lengths × ${fmt(k)}`, 'orange'], ['     ', 'ink'], [`area × ${fmt(k)}² = × ${fmt(k * k)}`, 'purple']], cx, BY - 74, 28, 800);
    label(ctx, `6 × ${fmt(k * k)} = ${fmt(6 * k * k)}`, cx, BY - 30, { size: 24, weight: 700, fill: 'muted' });
    ctx.restore();
  };

  // SOH CAH TOA: a right triangle with hypotenuse 10 and a sweeping angle.
  S['trig-ratios'] = (b, ctx, it, t) => {
    const base = clamp(num(it.angle, 37), 15, 70);
    const deg = clamp(base + 16 * Math.sin((TAU * b.clock) / 10) * ramp(t, 2.2, 1), 12, 76);
    const dI = Math.round(deg); const th = (deg * Math.PI) / 180; const tI = (dI * Math.PI) / 180;
    const H = 10; const u = 40; const Ax = FIG.x + 70; const Ay = FIG.y + 470;
    const Cx = Ax + H * Math.cos(th) * u; const By = Ay - H * Math.sin(th) * u;
    const opp = H * Math.sin(tI); const adj = H * Math.cos(tI);
    const SOH = [['S', 'ink'], ['O', 'orange'], ['H', 'purple'], ['   ', 'ink'], ['C', 'ink'], ['A', 'green'], ['H', 'purple'], ['   ', 'ink'], ['T', 'ink'], ['O', 'orange'], ['A', 'green']];
    parts(ctx, SOH, cx, FIG.y + 30, 30, 800);
    ctx.save();
    alpha(ctx, ramp(t, 0, 0.5));
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; path(ctx, [[Ax, Ay], [Cx, Ay], [Cx, By]]); ctx.fill();
    glow(ctx, COLORS.purple, 12); seg(ctx, Ax, Ay, Cx, By, 'purple', 5); ctx.shadowBlur = 0;
    seg(ctx, Ax, Ay, Cx, Ay, 'green', 5); seg(ctx, Cx, Ay, Cx, By, 'orange', 5);
    rightMark(ctx, Cx, Ay, -1, 0, 0, -1, 18);
    wedge(ctx, Ax, Ay, 58, -th, 0, 'yellow', 0.25);
    label(ctx, `${dI}°`, Ax + Math.cos(-th / 2) * 92, Ay + Math.sin(-th / 2) * 92, { size: 24, weight: 800, fill: 'yellow' });
    ctx.save(); ctx.translate((Ax + Cx) / 2, (Ay + By) / 2); ctx.rotate(-th);
    label(ctx, `hypotenuse ${H}`, 0, -20, { size: 22, weight: 700, fill: 'purple' });
    ctx.restore();
    label(ctx, `opposite ${fix(opp)}`, Cx + 14, (Ay + By) / 2, { size: 22, weight: 700, fill: 'orange', align: 'left' });
    label(ctx, `adjacent ${fix(adj)}`, Math.max(FIG.x + 100, (Ax + Cx) / 2), Ay + 26, { size: 22, weight: 700, fill: 'green' });
    ctx.restore();
    const rows = [
      ['sin', 'O', 'orange', 'H', 'purple', opp, H],
      ['cos', 'A', 'green', 'H', 'purple', adj, H],
      ['tan', 'O', 'orange', 'A', 'green', opp, adj],
    ];
    rows.forEach(([fn, n1, c1, n2, c2, v1, v2], i) => {
      const a = ramp(t, 0.8 + i * 0.35, 0.4);
      if (a <= 0) return;
      ctx.save(); alpha(ctx, a);
      parts(ctx, [[`${fn} `, 'ink'], [`${dI}°`, 'yellow'], [' = ', 'ink'], [n1, c1], ['/', 'ink'], [n2, c2], [' = ', 'ink'], [fix(v1), c1], [' ÷ ', 'ink'], [fix(v2), c2], [` = ${fix(v1 / v2, 3)}`, 'ink']], cx, FIG.y + 560 + i * 55, 24, 700);
      ctx.restore();
    });
  };

  // The unit circle: a point goes round; its height traces sine, its across traces cosine.
  S['unit-circle'] = (b, ctx, it, t) => {
    const R = 120; const ox = FIG.x + 170; const oy = FIG.y + 200;
    const gx0 = FIG.x + 330; const GW = 300; const cy0 = FIG.y + 350; const GH = 300;
    const th = TAU * loop(b.clock, 9);
    const sx = (w) => gx0 + (w / TAU) * GW; const cyv = (w) => cy0 + (w / TAU) * GH;
    ctx.save();
    alpha(ctx, ramp(t, 0, 0.5));
    seg(ctx, ox - R - 20, oy, ox + R + 20, oy, 'rgba(200,215,255,0.5)', 1.5); seg(ctx, ox, oy - R - 20, ox, oy + R + 20, 'rgba(200,215,255,0.5)', 1.5);
    glow(ctx, COLORS.cyan, 12); ring(ctx, ox, oy, R, 'cyan', 3, null); ctx.shadowBlur = 0;
    ctx.restore();
    const g = ramp(t, 0.5, 0.5);
    ctx.save();
    alpha(ctx, g);
    seg(ctx, gx0, oy, gx0 + GW + 10, oy, 'rgba(200,215,255,0.5)', 1.5); seg(ctx, ox, cy0, ox, cy0 + GH + 10, 'rgba(200,215,255,0.5)', 1.5);
    ['90°', '180°', '270°', '360°'].forEach((s, i) => {
      const w = ((i + 1) * TAU) / 4;
      seg(ctx, sx(w), oy - 6, sx(w), oy + 6, 'rgba(200,215,255,0.6)', 1.5); label(ctx, s, sx(w), oy + R + 22, { size: 17, weight: 500, fill: 'muted' });
      seg(ctx, ox - 6, cyv(w), ox + 6, cyv(w), 'rgba(200,215,255,0.6)', 1.5); label(ctx, s, ox - R - 10, cyv(w), { size: 17, weight: 500, fill: 'muted', align: 'right' });
    });
    // Faint full waves, then a bright trail behind the moving point.
    const wave = (fx, fy, from, to, c, w, n) => {
      ctx.strokeStyle = color(c); ctx.lineWidth = w; ctx.beginPath();
      let prev = Infinity;
      for (let i = 0; i <= n; i++) { const p = from + ((to - from) * i) / n; const m = ((p % TAU) + TAU) % TAU; if (m < prev) ctx.moveTo(fx(m), fy(m)); else ctx.lineTo(fx(m), fy(m)); prev = m; }
      ctx.stroke();
    };
    wave(sx, (m) => oy - R * Math.sin(m), 0, TAU * 0.9999, 'rgba(255,159,67,0.25)', 2, 90);
    wave((m) => ox + R * Math.cos(m), cyv, 0, TAU * 0.9999, 'rgba(91,140,255,0.3)', 2, 90);
    wave(sx, (m) => oy - R * Math.sin(m), th - 1.5 * Math.PI, th, 'orange', 4, 70);
    wave((m) => ox + R * Math.cos(m), cyv, th - 1.5 * Math.PI, th, 'blue', 4, 70);
    ctx.restore();
    const px = ox + R * Math.cos(th); const py = oy - R * Math.sin(th);
    ctx.save();
    alpha(ctx, ramp(t, 0.3, 0.4));
    ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(ox, oy, 28, 0, -th, true); ctx.stroke();
    seg(ctx, ox, oy, px, py, 'ink', 3);
    seg(ctx, ox, oy, px, oy, 'blue', 5); seg(ctx, px, oy, px, py, 'orange', 5);
    seg(ctx, px, py, sx(th), py, 'rgba(255,159,67,0.6)', 1.5, [5, 5]); seg(ctx, px, py, px, cyv(th), 'rgba(91,140,255,0.6)', 1.5, [5, 5]);
    glow(ctx, COLORS.yellow, 16); dot(ctx, px, py, 9, 'yellow'); ctx.shadowBlur = 0;
    dot(ctx, sx(th), py, 7, 'orange'); dot(ctx, px, cyv(th), 7, 'blue');
    ctx.restore();
    ctx.save();
    alpha(ctx, g);
    label(ctx, 'sin θ', gx0 + GW, oy - R - 16, { size: 21, weight: 700, fill: 'orange', align: 'right' });
    label(ctx, 'cos θ', ox + R + 12, cy0 + GH, { size: 21, weight: 700, fill: 'blue', align: 'left' });
    const lx = FIG.x + 430;
    label(ctx, `θ = ${Math.round((th * 180) / Math.PI) % 360}°`, lx, FIG.y + 420, { size: 30, weight: 800, fill: 'yellow', align: 'left' });
    label(ctx, `sin θ = ${fix(Math.sin(th))}`, lx, FIG.y + 470, { size: 26, weight: 700, fill: 'orange', align: 'left' });
    label(ctx, `cos θ = ${fix(Math.cos(th))}`, lx, FIG.y + 516, { size: 26, weight: 700, fill: 'blue', align: 'left' });
    label(ctx, 'point = (cos θ, sin θ)', lx, FIG.y + 566, { size: 20, weight: 600, fill: 'muted', align: 'left' });
    label(ctx, 'cos²θ + sin²θ = 1', lx, FIG.y + 600, { size: 20, weight: 600, fill: 'muted', align: 'left' });
    ctx.restore();
  };

  // Sine rule or cosine rule? What you know decides; each case worked with numbers.
  S['sine-cosine-rule'] = (b, ctx, it, t) => {
    let a = num(it.a, 7); let bb = num(it.b, 5); let c = num(it.c, 8);
    if (!(a + bb > c && a + c > bb && bb + c > a)) { a = 7; bb = 5; c = 8; }
    const A = Math.acos((bb * bb + c * c - a * a) / (2 * bb * c)); const B = Math.acos((a * a + c * c - bb * bb) / (2 * a * c)); const C = Math.PI - A - B;
    const D = (r) => fmt((r * 180) / Math.PI, 1);
    const Cu = [bb * Math.cos(A), bb * Math.sin(A)];
    const minX = Math.min(0, Cu[0]); const maxX = Math.max(c, Cu[0]);
    const s = Math.min(560 / (maxX - minX), 230 / Cu[1]);
    const X = (x) => cx - ((maxX - minX) * s) / 2 + (x - minX) * s; const Y = (y) => FIG.y + 340 - y * s;
    const Pv = { A: [X(0), Y(0)], B: [X(c), Y(0)], C: [X(Cu[0]), Y(Cu[1])] };
    const CASES = [
      { name: 'Cosine rule: find a side', why: 'You know two sides and the angle between them', c: 'cyan', ks: ['b', 'c'], ka: ['A'], us: 'a', ua: null,
        f: 'a² = b² + c² − 2bc cos A', sub: `a² = ${fmt(bb)}² + ${fmt(c)}² − 2 × ${fmt(bb)} × ${fmt(c)} × cos ${D(A)}° = ${fmt(a * a)}`, ans: `a = ${fmt(a)}` },
      { name: 'Cosine rule: find an angle', why: 'You know all three sides', c: 'teal', ks: ['a', 'b', 'c'], ka: [], us: null, ua: 'A',
        f: 'cos A = (b² + c² − a²) ÷ 2bc', sub: `cos A = (${fmt(bb * bb)} + ${fmt(c * c)} − ${fmt(a * a)}) ÷ ${fmt(2 * bb * c)} = ${fmt(Math.cos(A), 3)}`, ans: `A = ${D(A)}°` },
      { name: 'Sine rule', why: 'You know a side and its opposite angle, and one more', c: 'purple', ks: ['a', 'b'], ka: ['A'], us: null, ua: 'B',
        f: 'a ÷ sin A = b ÷ sin B', sub: `sin B = ${fmt(bb)} × sin ${D(A)}° ÷ ${fmt(a)} = ${fmt((bb * Math.sin(A)) / a, 3)}`, ans: `B = ${D(B)}°` },
    ];
    const sl = slot(Math.max(0, t - 0.6), 3, 6.5); const cs = CASES[sl.i]; const e = edge(sl.f, 0.05) * ramp(t, 0.6, 0.4); const lt = sl.f * 6.5;
    const reveal = lt > 4;
    ctx.save();
    alpha(ctx, ramp(t, 0, 0.5));
    glow(ctx, COLORS.blue, 10); shape(ctx, [Pv.A, Pv.B, Pv.C], 'blue', 0.12, 3.5); ctx.shadowBlur = 0;
    const G = [(Pv.A[0] + Pv.B[0] + Pv.C[0]) / 3, (Pv.A[1] + Pv.B[1] + Pv.C[1]) / 3];
    for (const k of ['A', 'B', 'C']) { const [x, y] = Pv[k]; const dx = x - G[0]; const dy = y - G[1]; const d = Math.hypot(dx, dy) || 1; label(ctx, k, x + (dx / d) * 24, y + (dy / d) * 24, { size: 24, weight: 800, fill: 'ink' }); }
    ctx.restore();
    if (e <= 0) return;
    ctx.save();
    alpha(ctx, e);
    const SIDE = { a: ['B', 'C', a], b: ['A', 'C', bb], c: ['A', 'B', c] };
    for (const k of ['a', 'b', 'c']) {
      const [p, q, v] = SIDE[k]; const mx = (Pv[p][0] + Pv[q][0]) / 2; const my = (Pv[p][1] + Pv[q][1]) / 2;
      const dx = mx - G[0]; const dy = my - G[1]; const d = Math.hypot(dx, dy) || 1;
      const known = cs.ks.includes(k); const unk = cs.us === k;
      const text = known || (unk && reveal) ? `${k} = ${fmt(v)}` : unk ? `${k} = ?` : k;
      label(ctx, text, mx + (dx / d) * 30, my + (dy / d) * 30, { size: 22, weight: 700, fill: known ? 'green' : unk ? 'orange' : 'muted' });
    }
    const ANG = { A: [A, 'B', 'C'], B: [B, 'A', 'C'], C: [C, 'A', 'B'] };
    for (const k of [...cs.ka, cs.ua].filter(Boolean)) {
      const [val, n1, n2] = ANG[k]; const [x, y] = Pv[k];
      const f1 = Math.atan2(Pv[n1][1] - y, Pv[n1][0] - x); const f2 = Math.atan2(Pv[n2][1] - y, Pv[n2][0] - x);
      let d = f2 - f1; d = ((d + Math.PI) % TAU + TAU) % TAU - Math.PI;
      const known = cs.ka.includes(k); const col = known ? 'green' : 'orange';
      wedge(ctx, x, y, 34, f1, f1 + d, col, 0.3, d < 0);
      const mid = f1 + d / 2;
      label(ctx, known || reveal ? `${D(val)}°` : '?', x + Math.cos(mid) * 62, y + Math.sin(mid) * 62, { size: 20, weight: 700, fill: col });
    }
    const line = (text, y, size, fill, at, weight = 700) => { if (lt > at) { ctx.save(); alpha(ctx, ramp(lt, at, 0.4)); label(ctx, text, cx, y, { size, weight, fill }); ctx.restore(); } };
    line(cs.name, FIG.y + 440, 28, cs.c, 0);
    line(cs.why, FIG.y + 484, 20, 'muted', 0.3, 600);
    line(cs.f, FIG.y + 540, 26, 'ink', 1.0);
    line(cs.sub, FIG.y + 594, 21, 'ink', 2.2, 600);
    line(cs.ans, FIG.y + 650, 30, 'orange', 4);
    ctx.restore();
    label(ctx, 'Sine rule or cosine rule?', cx, FIG.y + 30, { size: 26, weight: 700, fill: 'ink' });
  };

  // Bearings: from North, clockwise, always three figures.
  S.bearings = (b, ctx, it, t) => {
    const list = it.bearing != null ? [clamp(Math.round(num(it.bearing, 65)), 0, 359)] : [65, 150, 290];
    const sl = slot(Math.max(0, t - 0.4), list.length, 5.5); const br = list[sl.i];
    const sweep = inOut(clamp((sl.f * 5.5 - 0.4) / 1.6)); const e = edge(sl.f, 0.05) * ramp(t, 0.4, 0.3);
    const ox = cx; const oy = cy + 10; const R = 210;
    const pad = (v) => String(Math.round(v) % 360).padStart(3, '0');
    title(ctx, 'Bearings: clockwise from North');
    ctx.save();
    alpha(ctx, ramp(t, 0, 0.5));
    ring(ctx, ox, oy, R, 'rgba(200,215,255,0.6)', 2.5, 'rgba(10,16,36,0.6)');
    ctx.strokeStyle = 'rgba(200,215,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let d = 0; d < 360; d += 10) { const a = (d * Math.PI) / 180; const r0 = d % 90 === 0 ? R - 26 : d % 30 === 0 ? R - 18 : R - 10; ctx.moveTo(ox + Math.sin(a) * r0, oy - Math.cos(a) * r0); ctx.lineTo(ox + Math.sin(a) * R, oy - Math.cos(a) * R); }
    ctx.stroke();
    [['N', 0, 'red'], ['E', 90, 'muted'], ['S', 180, 'muted'], ['W', 270, 'muted']].forEach(([s, d, c]) => { const a = (d * Math.PI) / 180; label(ctx, s, ox + Math.sin(a) * (R + 26), oy - Math.cos(a) * (R + 26), { size: s === 'N' ? 28 : 22, weight: 800, fill: c }); });
    glow(ctx, COLORS.red, 14); arrow(ctx, ox, oy, ox, oy - R + 34, 'red', 5); ctx.shadowBlur = 0;
    dot(ctx, ox, oy, 7, 'ink'); label(ctx, 'A', ox - 20, oy + 20, { size: 22, weight: 800, fill: 'ink' });
    ctx.restore();
    if (e <= 0) return;
    ctx.save();
    alpha(ctx, e);
    const ar = (br * Math.PI) / 180; const bx = ox + Math.sin(ar) * (R - 40); const by = oy - Math.cos(ar) * (R - 40);
    glow(ctx, COLORS.orange, 14); arrow(ctx, ox, oy, bx, by, 'orange', 5); ctx.shadowBlur = 0;
    dot(ctx, bx, by, 9, 'orange'); label(ctx, 'B', bx + Math.sin(ar) * 26, by - Math.cos(ar) * 26, { size: 24, weight: 800, fill: 'orange' });
    const now = br * sweep;
    if (now > 0.5) {
      wedge(ctx, ox, oy, 74, -Math.PI / 2, -Math.PI / 2 + (now * Math.PI) / 180, 'yellow', 0.2);
      const mid = -Math.PI / 2 + (now * Math.PI) / 360;
      label(ctx, `${pad(now)}°`, ox + Math.cos(mid) * 118, oy + Math.sin(mid) * 118, { size: 28, weight: 800, fill: 'yellow' });
    }
    if (sweep >= 1) {
      label(ctx, `Bearing of B from A = ${pad(br)}°`, cx, BY - 56, { size: 26, weight: 800, fill: 'yellow' });
      label(ctx, `back bearing (A from B) = ${pad(br)}° ${br < 180 ? '+' : MINUS} 180° = ${pad((br + 180) % 360)}°`, cx, BY - 20, { size: 20, weight: 600, fill: 'muted' });
    }
    ctx.restore();
  };

  // ——— Probability and statistics ———

  const tag = (ctx, x, y, text, c, size = 22) => {
    ctx.font = `700 ${size}px ${FONT}`;
    const w = ctx.measureText(text).width + 24;
    rounded(ctx, x - w / 2, y - size * 0.8, w, size * 1.6, size * 0.8); ctx.fillStyle = BG; ctx.fill(); ctx.strokeStyle = color(c); ctx.lineWidth = 2; ctx.stroke();
    label(ctx, text, x, y + 1, { size, weight: 700, fill: c });
  };

  // A probability tree: branches build, then each path multiplies along to a leaf.
  S['probability-tree'] = (b, ctx, it, t) => {
    const p = clamp(num(it.p, 0.3), 0, 1); const q = clamp(num(it.q, 0.6), 0, 1);
    const nA = String(it.A ?? 'A'); const nB = String(it.B ?? 'B');
    const root = [FIG.x + 50, cy + 10];
    const s1 = [[FIG.x + 300, cy - 150], [FIG.x + 300, cy + 170]];
    const lv = [[FIG.x + 520, cy - 230], [FIG.x + 520, cy - 70], [FIG.x + 520, cy + 90], [FIG.x + 520, cy + 250]];
    const BR = [[root, s1[0], p, 'cyan'], [root, s1[1], 1 - p, 'cyan'], [s1[0], lv[0], q, 'purple'], [s1[0], lv[1], 1 - q, 'purple'], [s1[1], lv[2], q, 'purple'], [s1[1], lv[3], 1 - q, 'purple']];
    const leafP = [p * q, p * (1 - q), (1 - p) * q, (1 - p) * (1 - q)];
    const live = ramp(t, 2.8, 0.4);
    const sl = slot(b.clock, 4, 2.6); const path4 = [sl.i < 2 ? 0 : 1, 2 + sl.i]; const e = edge(sl.f, 0.08) * live;
    BR.forEach(([P0, P1, pr, c], i) => {
      const t0 = i < 2 ? 0.2 + i * 0.15 : 0.9 + (i - 2) * 0.15; const g = ramp(t, t0, 0.5);
      if (g <= 0) return;
      const on = path4.includes(i) && e > 0;
      const x1 = lerp(P0[0], P1[0], g); const y1 = lerp(P0[1], P1[1], g);
      if (on) { ctx.save(); alpha(ctx, e); glow(ctx, COLORS.yellow, 16); seg(ctx, P0[0], P0[1], x1, y1, 'yellow', 7); ctx.restore(); }
      seg(ctx, P0[0], P0[1], x1, y1, c, 3.5);
      if (g >= 1) { const up = P1[1] < P0[1]; label(ctx, fmt(pr, 3), (P0[0] + P1[0]) / 2, (P0[1] + P1[1]) / 2 + (up ? -22 : 22), { size: 22, weight: 700, fill: c }); }
    });
    dot(ctx, root[0], root[1], 8 * pop(t, 0, 0.3), 'ink');
    s1.forEach((P, i) => { if (t > 0.6 + i * 0.15) tag(ctx, P[0], P[1], i ? `not ${nA}` : nA, 'cyan'); });
    lv.forEach((P, i) => {
      if (t < 1.4 + i * 0.15) return;
      ctx.save(); alpha(ctx, ramp(t, 1.4 + i * 0.15, 0.3));
      tag(ctx, P[0], P[1], i % 2 ? `not ${nB}` : nB, 'purple');
      const on = sl.i === i && e > 0.3;
      label(ctx, `${fmt(i < 2 ? p : 1 - p, 3)} × ${fmt(i % 2 ? 1 - q : q, 3)} = ${fmt(leafP[i], 4)}`, P[0] + 58, P[1], { size: 19, weight: on ? 800 : 600, fill: on ? 'yellow' : 'ink', align: 'left' });
      ctx.restore();
    });
    label(ctx, 'Multiply along the branches', cx, FIG.y + 30, { size: 26, weight: 700, fill: 'ink' });
    if (live > 0) {
      // A token travels down the lit path.
      const k = clamp(sl.f / 0.6) * 0.86; const [s0, s2] = path4.map((i) => BR[i]);
      const pt = k < 0.5 ? [lerp(s0[0][0], s0[1][0], k * 2), lerp(s0[0][1], s0[1][1], k * 2)] : [lerp(s2[0][0], s2[1][0], k * 2 - 1), lerp(s2[0][1], s2[1][1], k * 2 - 1)];
      ctx.save(); alpha(ctx, e); glow(ctx, COLORS.yellow, 16); dot(ctx, pt[0], pt[1], 9, 'yellow'); ctx.shadowBlur = 0;
      const nm = `P(${sl.i < 2 ? nA : `not ${nA}`} and ${sl.i % 2 ? `not ${nB}` : nB})`;
      label(ctx, `${nm} = ${fmt(leafP[sl.i], 4)}`, cx, BY - 50, { size: 26, weight: 800, fill: 'yellow' });
      ctx.restore();
      ctx.save(); alpha(ctx, live);
      label(ctx, `all four add to ${leafP.map((v) => fmt(v, 4)).join(' + ')} = 1`, cx, BY - 14, { size: 19, weight: 600, fill: 'muted' });
      ctx.restore();
    }
  };

  // Relative frequency: toss after toss, the experimental fraction settles on the theory.
  S['relative-frequency'] = (b, ctx, it, t) => {
    const dice = String(it.mode ?? 'coin') === 'dice'; const p = dice ? 1 / 6 : 0.5; const N = 200; const seed = Math.round(num(it.seed, 1));
    const D = (it._rf ||= (() => { const out = []; const cum = []; let s = 0; for (let i = 0; i < N; i++) { const r = rnd(i, seed); const v = dice ? 1 + Math.floor(r * 6) : r < 0.5 ? 1 : 0; out.push(v); s += dice ? (v === 6 ? 1 : 0) : v; cum.push(s); } return { out, cum }; })());
    const P = 16; const u = loop(Math.max(0, t - 0.6), P);
    const n = Math.max(1, Math.ceil(N * clamp(u / 0.78) ** 1.7));
    const fa = Math.min(clamp(u / 0.03), clamp((1 - u) / 0.06)) * ramp(t, 0.6, 0.3);
    const k = D.cum[n - 1]; const last = D.out[n - 1];
    const a = (it._a ||= axes({ x: FIG.x + 90, y: FIG.y + 210, w: FIG.w - 130, h: FIG.h - 290 }, 0, N, 0, dice ? 0.5 : 1));
    label(ctx, dice ? 'Roll a dice: how often is it a six?' : 'Toss a coin: how often is it heads?', cx, FIG.y + 30, { size: 26, weight: 700, fill: 'ink' });
    ctx.save(); alpha(ctx, ramp(t, 0, 0.4));
    drawAxes(ctx, a, { xt: [0, 50, 100, 150, 200], yt: dice ? [0, 0.1, 0.2, 0.3, 0.4, 0.5] : [0, 0.25, 0.5, 0.75, 1], xName: 'number of trials', yName: 'relative frequency' });
    seg(ctx, a.box.x, a.py(p), a.box.x + a.box.w, a.py(p), 'yellow', 2.5, [10, 8]);
    label(ctx, dice ? 'theory 1/6 ≈ 0.167' : 'theory 0.5', a.box.x + a.box.w, a.py(p) - 18, { size: 20, weight: 700, fill: 'yellow', align: 'right' });
    ctx.restore();
    if (fa <= 0) return;
    ctx.save();
    alpha(ctx, fa);
    ctx.save(); clipBox(ctx, a.box); glow(ctx, COLORS.cyan, 10); ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.beginPath();
    for (let i = 0; i < n; i++) { const x = a.px(i + 1); const y = a.py(D.cum[i] / (i + 1)); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
    dot(ctx, a.px(n), a.py(Math.min(a.y1, k / n)), 7, 'cyan');
    // The latest toss.
    const ix = FIG.x + 90; const iy = FIG.y + 115;
    if (dice) {
      ctx.save(); ctx.translate(ix, iy); glow(ctx, color(last === 6 ? 'green' : 'blue'), 14); rounded(ctx, -40, -40, 80, 80, 14); ctx.fillStyle = tint(last === 6 ? 'green' : 'blue', 0.3); ctx.fill(); ctx.strokeStyle = color(last === 6 ? 'green' : 'blue'); ctx.lineWidth = 3; ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();
      label(ctx, String(last), ix, iy + 2, { size: 44, weight: 800, fill: 'ink' });
    } else {
      ctx.save(); ctx.translate(ix, iy); glow(ctx, color(last ? 'yellow' : 'muted'), 14); ring(ctx, 0, 0, 42, last ? 'yellow' : 'muted', 4, last ? 'rgba(251,191,36,0.25)' : 'rgba(147,160,196,0.2)'); ctx.shadowBlur = 0; ctx.restore();
      label(ctx, last ? 'H' : 'T', ix, iy + 2, { size: 40, weight: 800, fill: last ? 'yellow' : 'ink' });
    }
    label(ctx, `${dice ? 'Sixes' : 'Heads'}: ${k} out of ${n} ${dice ? 'rolls' : 'tosses'}`, FIG.x + 160, iy - 20, { size: 26, weight: 700, fill: 'ink', align: 'left' });
    label(ctx, `relative frequency = ${k} ÷ ${n} = ${fix(k / n, 3)}`, FIG.x + 160, iy + 22, { size: 22, weight: 700, fill: 'cyan', align: 'left' });
    ctx.restore();
  };

  // Data → histogram → box plot: the sorted data gives the quartiles.
  S['histogram-boxplot'] = (b, ctx, it, t) => {
    const H = (it._h ||= (() => {
      let data = (Array.isArray(it.data) ? it.data : String(it.data ?? '').split(/[,\s]+/)).map(Number).filter(Number.isFinite).slice(0, 40);
      if (data.length < 5) data = [4, 7, 8, 11, 12, 13, 15, 16, 18, 19, 21, 23, 24, 28, 33];
      data.sort((p, q) => p - q);
      const n = data.length; const med = (arr) => { const m = arr.length; return m % 2 ? arr[(m - 1) / 2] : (arr[m / 2 - 1] + arr[m / 2]) / 2; };
      const lo = data[0]; const hi = data[n - 1];
      const w = num(it.w, 0) > 0 ? num(it.w, 5) : [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000].find((c) => (hi - lo) / c <= 7.5) || 1000;
      const x0 = Math.floor(lo / w) * w; const x1 = (Math.floor(hi / w) + 1) * w; const nb = Math.round((x1 - x0) / w);
      const freq = Array(nb).fill(0); const stack = data.map((d) => { const k = Math.min(nb - 1, Math.floor((d - x0) / w)); return [k, freq[k]++]; });
      const half = Math.floor(n / 2);
      return { data, n, lo, hi, w, x0, x1, nb, freq, stack, q1: med(data.slice(0, half)), q2: med(data), q3: med(data.slice(Math.ceil(n / 2))), half };
    })());
    const { data, n, lo, hi, w, x0, x1, nb, freq, stack, q1, q2, q3 } = H;
    const bx = FIG.x + 70; const bw = FIG.w - 110; const px = (v) => bx + ((v - x0) / (x1 - x0)) * bw;
    const base = FIG.y + 300; const hs = Math.min(40, 190 / Math.max(...freq));
    label(ctx, 'Data → histogram → box plot', cx, FIG.y + 30, { size: 26, weight: 700, fill: 'ink' });
    ctx.save(); alpha(ctx, ramp(t, 0, 0.4));
    seg(ctx, bx, base, bx + bw, base, 'rgba(200,215,255,0.55)', 2);
    for (let k = 0; k <= nb; k++) label(ctx, fmt(x0 + k * w), px(x0 + k * w), base + 18, { size: 17, weight: 500, fill: 'muted' });
    ctx.restore();
    const bwid = (px(x0 + w) - px(x0));
    data.forEach((d, i) => {
      const p = pop(t, 0.2 + (i * 1.2) / n, 0.3);
      if (p <= 0) return;
      const [k, j] = stack[i];
      const x = px(x0 + k * w) + 4; const y = base - (j + 1) * hs;
      ctx.fillStyle = tint(HUES[k % HUES.length], 0.55); ctx.fillRect(x, y + 1 + (1 - p) * -30, bwid - 8, hs - 2);
    });
    if (t > 1.5) {
      ctx.save(); alpha(ctx, ramp(t, 1.5, 0.4));
      freq.forEach((f, k) => { if (!f) return; ctx.strokeStyle = color(HUES[k % HUES.length]); ctx.lineWidth = 2.5; ctx.strokeRect(px(x0 + k * w) + 2, base - f * hs, bwid - 4, f * hs); label(ctx, String(f), px(x0 + (k + 0.5) * w), base - f * hs - 14, { size: 18, weight: 700, fill: 'ink' }); });
      ctx.restore();
    }
    // The sorted data, quartile values coloured.
    const sy = FIG.y + 372; const yb = FIG.y + 480;
    const role = (i) => { const m = n % 2 ? [(n - 1) / 2] : [n / 2 - 1, n / 2]; if (m.includes(i)) return 'yellow'; const h = H.half; const lowM = h % 2 ? [(h - 1) / 2] : [h / 2 - 1, h / 2]; if (lowM.includes(i)) return 'cyan'; const off = Math.ceil(n / 2); if (lowM.map((v) => v + off).includes(i)) return 'cyan'; return 'muted'; };
    if (t > 1.8 && n <= 24) {
      ctx.save(); alpha(ctx, ramp(t, 1.8, 0.4));
      const gw = (FIG.w - 80) / n;
      data.forEach((d, i) => { const c = role(i); label(ctx, fmt(d), FIG.x + 40 + gw * (i + 0.5), sy, { size: 18, weight: c === 'muted' ? 500 : 800, fill: c }); });
      ctx.restore();
    }
    if (t < 2.2) return;
    ctx.save();
    alpha(ctx, ramp(t, 2.2, 0.5));
    seg(ctx, bx, yb + 92, bx + bw, yb + 92, 'rgba(200,215,255,0.55)', 2);
    for (let k = 0; k <= nb; k++) { seg(ctx, px(x0 + k * w), yb + 86, px(x0 + k * w), yb + 98, 'rgba(200,215,255,0.55)', 2); label(ctx, fmt(x0 + k * w), px(x0 + k * w), yb + 114, { size: 17, weight: 500, fill: 'muted' }); }
    const hl = t > 2.9 ? slot(b.clock, 4, 2.2) : null;
    if (hl) {
      const ed = [lo, q1, q2, q3, hi]; const xa = px(ed[hl.i]); const xz = px(ed[hl.i + 1]);
      ctx.save(); alpha(ctx, edge(hl.f, 0.12)); ctx.fillStyle = tint('yellow', 0.18); ctx.fillRect(xa, yb - 40, xz - xa, 80);
      if (xz - xa > 44) label(ctx, '25%', (xa + xz) / 2, hl.i === 0 || hl.i === 3 ? yb - 22 : yb + 2, { size: 20, weight: 800, fill: 'yellow' });
      ctx.restore();
    }
    seg(ctx, px(lo), yb, px(q1), yb, 'ink', 3); seg(ctx, px(q3), yb, px(hi), yb, 'ink', 3);
    seg(ctx, px(lo), yb - 18, px(lo), yb + 18, 'ink', 3); seg(ctx, px(hi), yb - 18, px(hi), yb + 18, 'ink', 3);
    glow(ctx, COLORS.cyan, 12); ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 3; ctx.strokeRect(px(q1), yb - 32, px(q3) - px(q1), 64); ctx.shadowBlur = 0;
    ctx.fillStyle = tint('cyan', 0.12); ctx.fillRect(px(q1), yb - 32, px(q3) - px(q1), 64);
    seg(ctx, px(q2), yb - 32, px(q2), yb + 32, 'yellow', 4);
    label(ctx, `median = ${fmt(q2)}`, px(q2), yb - 54, { size: 21, weight: 800, fill: 'yellow' });
    label(ctx, `Q1 = ${fmt(q1)}`, px(q1), yb + 54, { size: 21, weight: 800, fill: 'cyan' });
    label(ctx, `Q3 = ${fmt(q3)}`, px(q3), yb + 54, { size: 21, weight: 800, fill: 'cyan' });
    label(ctx, `min ${fmt(lo)}`, px(lo) - 10, yb, { size: 18, weight: 600, fill: 'muted', align: 'right' });
    label(ctx, `max ${fmt(hi)}`, px(hi) + 10, yb, { size: 18, weight: 600, fill: 'muted', align: 'left' });
    label(ctx, `IQR = Q3 − Q1 = ${fmt(q3)} − ${fmt(q1)} = ${fmt(q3 - q1)}`, cx, BY - 26, { size: 24, weight: 800, fill: 'cyan' });
    ctx.restore();
  };

  // Scatter graphs: the line of best fit and r, as the data changes between kinds.
  S.scatter = (b, ctx, it, t) => {
    const N = 18;
    const SETS = (it._sc ||= ['positive', 'negative', 'none'].map((kind, s0) => Array.from({ length: N }, (_, i) => {
      const s = kind === 'none' ? 9 : s0;
      const x = 0.6 + (9 * (i + 0.2 + 0.6 * rnd(i, 11 + s))) / N; const e = rnd(i, 21 + s) + rnd(i, 31 + s) - 1;
      const y = kind === 'positive' ? 1.2 + 0.78 * x + 1.6 * e : kind === 'negative' ? 9.2 - 0.74 * x + 1.6 * e : 5 + 3.6 * e;
      return [x, clamp(y, 0.3, 9.7)];
    })));
    const fixedK = ['positive', 'negative', 'none'].indexOf(String(it.kind));
    const sl = fixedK >= 0 ? { i: fixedK, f: 0 } : slot(b.clock, 3, 5.5);
    const mv = fixedK >= 0 ? 0 : inOut(clamp((sl.f - 0.78) / 0.22));
    const A = SETS[sl.i]; const Bn = SETS[(sl.i + 1) % 3];
    const pts = A.map((p, i) => [lerp(p[0], Bn[i][0], mv), lerp(p[1], Bn[i][1], mv)]);
    let mx = 0; let my = 0; for (const [x, y] of pts) { mx += x / N; my += y / N; }
    let sxx = 0; let sxy = 0; let syy = 0; for (const [x, y] of pts) { sxx += (x - mx) ** 2; sxy += (x - mx) * (y - my); syy += (y - my) ** 2; }
    const m = sxy / sxx; const c = my - m * mx; const r = sxy / Math.sqrt(sxx * syy);
    const a = (it._a ||= axes({ x: FIG.x + 70, y: FIG.y + 110, w: FIG.w - 110, h: FIG.h - 180 }, 0, 10, 0, 10));
    ctx.save(); alpha(ctx, ramp(t, 0, 0.4)); drawAxes(ctx, a, { xt: [0, 2, 4, 6, 8, 10], yt: [0, 2, 4, 6, 8, 10], xName: 'x', yName: 'y' }); ctx.restore();
    pts.forEach(([x, y], i) => { const p = pop(t, 0.2 + i * 0.05, 0.3); if (p > 0) { dot(ctx, a.px(x), a.py(y), 8 * p, 'cyan'); ring(ctx, a.px(x), a.py(y), 8 * p, 'rgba(233,238,255,0.6)', 1.5, null); } });
    const ar = Math.abs(r);
    const strength = ar > 0.7 ? 'strong' : ar > 0.4 ? 'moderate' : ar > 0.2 ? 'weak' : '';
    const desc = strength ? `${strength} ${r > 0 ? 'positive' : 'negative'} correlation` : 'no correlation';
    const col = !strength ? 'muted' : r > 0 ? 'green' : 'orange';
    if (t > 1.3) {
      const q = ramp(t, 1.3, 0.6);
      ctx.save(); alpha(ctx, q); clipBox(ctx, a.box);
      if (strength) { glow(ctx, color(col), 14); seg(ctx, a.px(0), a.py(c), a.px(0) + (a.px(10) - a.px(0)) * q, a.py(c + m * 10 * q), col, 4); ctx.shadowBlur = 0; }
      else seg(ctx, a.px(0), a.py(c), a.px(10), a.py(c + m * 10), 'rgba(200,215,255,0.4)', 2.5, [8, 8]);
      ring(ctx, a.px(mx), a.py(my), 9, 'yellow', 3, null);
      ctx.restore();
      ctx.save(); alpha(ctx, q);
      label(ctx, `mean point (${fmt(mx, 1)}, ${fmt(my, 1)})`, a.px(mx) + 14, a.py(my) + (m > 0 ? 26 : -26), { size: 18, weight: 700, fill: 'yellow', align: 'left' });
      label(ctx, `line of best fit: y = ${poly([[m, 1], [c, 0]])}`, cx, BY - 22, { size: 22, weight: 700, fill: strength ? col : 'muted' });
      ctx.restore();
    }
    label(ctx, `r = ${fix(r)}: ${desc}`, cx, FIG.y + 34, { size: 28, weight: 800, fill: col });
  };

  // The normal distribution: 68% within 1σ, 95% within 2σ, 99.7% within 3σ.
  S['normal-distribution'] = (b, ctx, it, t) => {
    const mu = num(it.mean, 100); const sd = Math.max(1e-6, num(it.sd, 15));
    const pdf = (z) => Math.exp((-z * z) / 2) / Math.sqrt(TAU);
    const a = (it._a ||= axes({ x: FIG.x + 40, y: FIG.y + 150, w: FIG.w - 80, h: FIG.h - 270 }, -3.6, 3.6, 0, 0.42));
    const BANDS = [[3, 'purple', '99.7%'], [2, 'blue', '95%'], [1, 'teal', '68%']];
    const sl = slot(b.clock, 3, 3.2); const hk = 1 + sl.i; const e = edge(sl.f, 0.1) * ramp(t, 2.6, 0.4);
    const band = (k, c, fa) => {
      ctx.beginPath(); ctx.moveTo(a.px(-k), a.py(0));
      for (let i = 0; i <= 40; i++) { const z = -k + (2 * k * i) / 40; ctx.lineTo(a.px(z), a.py(pdf(z))); }
      ctx.lineTo(a.px(k), a.py(0)); ctx.closePath(); ctx.fillStyle = tint(c, fa); ctx.fill();
    };
    BANDS.forEach(([k, c]) => { const g = ramp(t, 1.4 + (3 - k) * 0.4, 0.4); if (g > 0) { ctx.save(); alpha(ctx, g); band(k, c, 0.28 + (k === hk ? 0.25 * e : 0)); ctx.restore(); } });
    ctx.save(); alpha(ctx, ramp(t, 0, 0.4));
    seg(ctx, a.box.x, a.py(0), a.box.x + a.box.w, a.py(0), 'rgba(200,215,255,0.6)', 2);
    for (let z = -3; z <= 3; z++) { seg(ctx, a.px(z), a.py(0) - 6, a.px(z), a.py(0) + 6, 'rgba(200,215,255,0.6)', 2); label(ctx, fmt(mu + z * sd), a.px(z), a.py(0) + 22, { size: 18, weight: z ? 500 : 800, fill: z ? 'muted' : 'ink' }); label(ctx, z ? `${z > 0 ? '+' : MINUS}${Math.abs(z)}σ` : 'μ', a.px(z), a.py(0) + 46, { size: 17, weight: 500, fill: 'muted' }); }
    ctx.restore();
    plot(ctx, a, pdf, 'cyan', 4, -3.6, -3.6 + 7.2 * clamp((t - 0.2) / 1), 120);
    if (t > 1.2) { ctx.save(); alpha(ctx, ramp(t, 1.2, 0.4)); seg(ctx, a.px(0), a.py(0), a.px(0), a.py(pdf(0)), 'rgba(233,238,255,0.6)', 2, [6, 6]); ctx.restore(); }
    label(ctx, `Normal distribution: mean μ = ${fmt(mu)}, σ = ${fmt(sd)}`, cx, FIG.y + 30, { size: 24, weight: 700, fill: 'ink' });
    if (e > 0) {
      const [k, c, pct] = BANDS[3 - hk];
      ctx.save(); alpha(ctx, e);
      const y = Math.min(a.py(pdf(k)) - 16, a.py(0) - 40);
      arrow(ctx, a.px(0), y, a.px(-k), y, c, 3); arrow(ctx, a.px(0), y, a.px(k), y, c, 3);
      glow(ctx, color(c), 14); label(ctx, pct, a.px(0), a.py(0.12), { size: 36, weight: 800, fill: '#ffffff' }); ctx.shadowBlur = 0;
      label(ctx, `${pct} of values lie within ${k}σ of the mean: ${fmt(mu - k * sd)} to ${fmt(mu + k * sd)}`, cx, FIG.y + 72, { size: 21, weight: 700, fill: c });
      ctx.restore();
    }
  };

  // ——— Calculus ———

  // The derivative: a tangent slides along f, its slope traced out as f′ below.
  S.derivative = (b, ctx, it, t) => {
    const G = (it._g ||= (() => {
      const src = String(it.f ?? 'x^3 - 3x'); const g = compile(src); const dflt = !g || /^\s*x\s*\^\s*3\s*-\s*3\s*x\s*$/.test(src);
      const f = g || ((x) => x ** 3 - 3 * x); const X = clamp(num(it.range, 2.5), 0.5, 50); const d = (x) => slope(f, x);
      const [y0, y1] = yRange(f, -X, X, 0.12); const [d0, d1] = yRange(d, -X, X, 0.15);
      return { f, d, X, dflt, name: dflt ? 'x³ − 3x' : pretty(src), a: axes({ x: FIG.x + 70, y: FIG.y + 90, w: FIG.w - 110, h: 300 }, -X, X, y0, y1), g: axes({ x: FIG.x + 70, y: FIG.y + 450, w: FIG.w - 110, h: 220 }, -X, X, d0, d1) };
    })());
    const { f, d, X, a, g } = G;
    const x0 = 0.85 * X * Math.sin((TAU * b.clock) / 12); const m = d(x0);
    ctx.save(); alpha(ctx, ramp(t, 0, 0.4)); drawAxes(ctx, a, { xName: 'x' }); ctx.restore();
    plot(ctx, a, f, 'purple', 4.5, -X, -X + 2 * X * clamp((t - 0.2) / 1), 160);
    label(ctx, `f(x) = ${G.name}`, a.box.x + 10, a.box.y - 14, { size: 22, weight: 700, fill: 'purple', align: 'left' });
    if (t < 0.8) return;
    ctx.save(); alpha(ctx, ramp(t, 0.8, 0.4));
    drawAxes(ctx, g, { xName: 'x' });
    plot(ctx, g, d, 'rgba(255,159,67,0.3)', 2.5, -X, X, 120, 0);
    plot(ctx, g, d, 'orange', 4, -X, x0, 120);
    label(ctx, G.dflt ? 'f′(x) = 3x² − 3  (the gradient function)' : 'f′(x): the gradient function', g.box.x + 10, g.box.y - 14, { size: 21, weight: 700, fill: 'orange', align: 'left' });
    ctx.restore();
    if (t < 1.2) return;
    ctx.save(); alpha(ctx, ramp(t, 1.2, 0.4));
    const X0 = a.px(x0); const Y0 = a.py(f(x0)); const flat = Math.abs(m) < 0.06; // a turning point means the gradient is (about) zero
    const dx = a.ux(1); const dy = -a.uy(m); const L = Math.hypot(dx, dy) || 1;
    const tc = flat ? 'green' : 'yellow';
    ctx.save(); clipBox(ctx, a.box); glow(ctx, color(tc), 14); seg(ctx, X0 - (dx / L) * 170, Y0 - (dy / L) * 170, X0 + (dx / L) * 170, Y0 + (dy / L) * 170, tc, 3.5); ctx.restore();
    const gy = g.py(m);
    seg(ctx, X0, Y0, X0, gy, 'rgba(233,238,255,0.35)', 1.5, [5, 6]);
    dot(ctx, X0, Y0, 8, tc); glow(ctx, COLORS.orange, 12); dot(ctx, X0, gy, 8, 'orange'); ctx.shadowBlur = 0;
    label(ctx, flat ? `gradient at x = ${fix(x0)} is ${fix(m)}: a turning point` : `gradient at x = ${fix(x0)} is ${fix(m)}`, cx, FIG.y + 26, { size: 24, weight: 800, fill: tc });
    ctx.restore();
  };

  // The integral: more and more rectangles, their total closing in on the area.
  S.integral = (b, ctx, it, t) => {
    const G = (it._g ||= (() => {
      const src = String(it.f ?? '0.5x^2 + 1'); const g = compile(src); const f = g || ((x) => 0.5 * x * x + 1);
      const A = num(it.a, 0); let B = num(it.b, 3); if (!(B > A)) B = A + 3;
      let s = 0; const n = 400; const h = (B - A) / n;
      for (let i = 0; i <= n; i++) s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * f(A + i * h);
      const pad = (B - A) * 0.15; const [y0, y1] = yRange(f, A - pad, B + pad, 0.12);
      return { f, A, B, exact: (s * h) / 3, name: g ? pretty(src) : '0.5x² + 1', a: axes({ x: FIG.x + 80, y: FIG.y + 150, w: FIG.w - 120, h: FIG.h - 240 }, A - pad, B + pad, y0, y1) };
    })());
    const { f, A, B, a } = G;
    const SEQ = [2, 4, 8, 16, 32, 64, 32, 16, 8, 4];
    const sl = slot(Math.max(0, t - 1.4), SEQ.length, 1.6); const n = SEQ[sl.i]; const q = ramp(t, 1.4, 0.4) * (0.55 + 0.45 * easeOut(clamp(sl.f / 0.25)));
    const w = (B - A) / n; let sum = 0;
    ctx.save(); alpha(ctx, ramp(t, 0, 0.4)); drawAxes(ctx, a, { xName: 'x' }); ctx.restore();
    ctx.save(); alpha(ctx, q); clipBox(ctx, a.box);
    for (let i = 0; i < n; i++) {
      const x = A + i * w; const y = f(x); sum += y * w;
      const X0 = a.px(x); const X1 = a.px(x + w); const Y = a.py(y); const Z = a.py(0);
      ctx.fillStyle = tint('teal', 0.32); ctx.fillRect(X0, Math.min(Y, Z), X1 - X0, Math.abs(Z - Y));
      if (n <= 32) { ctx.strokeStyle = tint('teal', 0.9); ctx.lineWidth = 1.5; ctx.strokeRect(X0, Math.min(Y, Z), X1 - X0, Math.abs(Z - Y)); }
    }
    ctx.restore();
    plot(ctx, a, f, 'purple', 4.5, a.x0, a.x0 + (a.x1 - a.x0) * clamp((t - 0.2) / 1), 160);
    for (const v of [A, B]) seg(ctx, a.px(v), a.box.y, a.px(v), a.box.y + a.box.h, 'rgba(233,238,255,0.4)', 1.5, [6, 6]);
    label(ctx, `∫ from ${fmt(A)} to ${fmt(B)} of ${G.name} dx`, cx, FIG.y + 30, { size: 26, weight: 800, fill: 'purple' });
    if (t > 1.4) {
      ctx.save(); alpha(ctx, ramp(t, 1.4, 0.4));
      label(ctx, `${n} rectangles: total area = ${fix(sum, 3)}`, cx, FIG.y + 72, { size: 24, weight: 700, fill: 'teal' });
      label(ctx, `exact area = ${fmt(G.exact, 4)}   (gap ${fix(G.exact - sum, 3)})`, cx, FIG.y + 108, { size: 21, weight: 600, fill: 'ink' });
      ctx.restore();
    }
  };

  // Limits: from both sides, x closes in on a and f(x) closes in on the limit.
  S.limits = (b, ctx, it, t) => {
    const G = (it._g ||= (() => {
      const src = String(it.f ?? '(x^2 - 1)/(x - 1)'); const g = compile(src); const f = g || ((x) => (x * x - 1) / (x - 1)); const a0 = num(it.a, 1);
      const L = +((f(a0 - 1e-6) + f(a0 + 1e-6)) / 2).toPrecision(6);
      const [y0, y1] = yRange(f, a0 - 3, a0 + 3, 0.15);
      return { f, a0, L, name: g ? pretty(src) : '(x² − 1)/(x − 1)', undef: !Number.isFinite(f(a0)), a: axes({ x: FIG.x + 70, y: FIG.y + 130, w: FIG.w - 110, h: FIG.h - 300 }, a0 - 3, a0 + 3, y0, y1) };
    })());
    const { f, a0, L, a } = G;
    const P = 10; const u = loop(Math.max(0, t - 1), P);
    const h = 1.5 * 0.002 ** clamp(u / 0.8); const fa = Math.min(clamp(u / 0.04), clamp((1 - u) / 0.08)) * ramp(t, 1, 0.3);
    const dp = clamp(Math.ceil(-Math.log10(h)) + 1, 1, 5);
    ctx.save(); alpha(ctx, ramp(t, 0, 0.4)); drawAxes(ctx, a, { xName: 'x', yName: 'y' }); ctx.restore();
    plot(ctx, a, f, 'purple', 4.5, a.x0, a.x0 + (a.x1 - a.x0) * clamp((t - 0.2) / 1), 161);
    const HX = a.px(a0); const HY = a.py(L);
    if (t > 0.9) { ring(ctx, HX, HY, 8, 'ink', 3); label(ctx, `limit ${fmt(L, 4)}`, HX - 14, HY - 26, { size: 20, weight: 700, fill: 'ink', align: 'right' }); }
    label(ctx, `As x → ${fmt(a0)}, ${G.name} → ${fmt(L, 4)}`, cx, FIG.y + 30, { size: 26, weight: 800, fill: 'purple' });
    if (G.undef) label(ctx, `At x = ${fmt(a0)} itself it is undefined (0 ÷ 0): the hole`, cx, FIG.y + 70, { size: 20, weight: 600, fill: 'muted' });
    if (fa <= 0) return;
    ctx.save(); alpha(ctx, fa);
    const zy = a.py(clamp(0, a.y0, a.y1)); const zx = a.px(clamp(0, a.x0, a.x1));
    [[a0 - h, 'blue', 1], [a0 + h, 'orange', -1]].forEach(([x, c, dir], i) => {
      const y = f(x); const X = a.px(x); const Y = a.py(y);
      seg(ctx, X, Y, X, zy, c, 1.5, [5, 5]); seg(ctx, X, Y, zx, Y, c, 1.5, [5, 5]);
      glow(ctx, color(c), 12); dot(ctx, X, Y, 8, c); ctx.shadowBlur = 0;
      if (Math.abs(X - HX) > 40) arrow(ctx, X, Y - 26, X + dir * 30, Y - 26, c, 3);
      label(ctx, `x = ${fix(x, dp)}    f(x) = ${fix(y, dp)}`, cx, BY - 74 + i * 40, { size: 23, weight: 700, fill: c });
    });
    ctx.restore();
  };

  // ——— Complex numbers, matrices, algorithms ———

  // The Argand diagram: multiplying by i turns z a quarter turn anticlockwise.
  S['complex-plane'] = (b, ctx, it, t) => {
    const re = num(it.re, 3); const im = num(it.im, 2); const mod = Math.hypot(re, im);
    const M = Math.min(20, Math.max(5, Math.ceil(mod) + 1));
    const a = (it._a ||= axes({ x: cx - 270, y: FIG.y + 70, w: 540, h: 540 }, -M, M, -M, M));
    const cstr = (x, y) => { const X = Math.round(x * 100) / 100; const Y = Math.round(y * 100) / 100; let s = X ? fmt(X) : ''; if (Y) { const yy = Math.abs(Y) === 1 ? '' : fmt(Math.abs(Y)); s += s ? `${Y < 0 ? ` ${MINUS} ` : ' + '}${yy}i` : `${Y < 0 ? MINUS : ''}${yy}i`; } return s || '0'; };
    const Z = [[re, im], [-im, re], [-re, -im], [im, -re]]; const NM = ['z', 'iz', `${MINUS}z`, `${MINUS}iz`];
    const sl = slot(Math.max(0, t - 1.2), 4, 2.8); const rot = inOut(clamp((sl.f - 0.5) / 0.4)) * ramp(t, 1.2, 0.1);
    const ang0 = Math.atan2(im, re) + (sl.i * Math.PI) / 2; const ang = ang0 + (rot * Math.PI) / 2;
    const zr = mod * Math.cos(ang); const zi = mod * Math.sin(ang);
    ctx.save(); alpha(ctx, ramp(t, 0, 0.4)); drawAxes(ctx, a, { xName: 'Re', yName: 'Im' }); ctx.restore();
    const ox = a.px(0); const oy = a.py(0); const rp = a.ux(mod);
    ctx.save(); alpha(ctx, ramp(t, 0.4, 0.4));
    ctx.setLineDash([6, 8]); ring(ctx, ox, oy, rp, 'rgba(200,215,255,0.35)', 2, null); ctx.setLineDash([]);
    Z.forEach(([x, y], k) => { dot(ctx, a.px(x), a.py(y), 6, 'rgba(167,139,250,0.7)'); const al = Math.atan2(y, x); label(ctx, NM[k], a.px(x) + Math.cos(al) * 26, a.py(y) - Math.sin(al) * 26, { size: 19, weight: 700, fill: 'purple' }); });
    ctx.restore();
    if (rot > 0.01) { ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ox, oy, rp, -ang0, -ang, true); ctx.stroke(); }
    ctx.save(); alpha(ctx, ramp(t, 0.6, 0.4));
    glow(ctx, COLORS.cyan, 16); arrow(ctx, ox, oy, a.px(zr), a.py(zi), 'cyan', 5); ctx.shadowBlur = 0;
    glow(ctx, COLORS.yellow, 14); dot(ctx, a.px(zr), a.py(zi), 9, 'yellow'); ctx.shadowBlur = 0;
    if (rot < 0.02 || rot > 0.98) label(ctx, cstr(zr, zi), a.px(zr) + Math.cos(ang) * 44, a.py(zi) - Math.sin(ang) * 44 + (Math.sin(ang) > 0 ? -10 : 10), { size: 22, weight: 800, fill: 'yellow' });
    ctx.restore();
    label(ctx, `z = ${cstr(re, im)},   |z| = √${fmt(re * re + im * im)} ≈ ${fmt(mod)}`, cx, FIG.y + 30, { size: 24, weight: 700, fill: 'ink' });
    if (t > 1.2) {
      const [p0, q0] = Z[sl.i]; const [p1, q1] = Z[(sl.i + 1) % 4];
      ctx.save(); alpha(ctx, ramp(t, 1.2, 0.4));
      label(ctx, `i × (${cstr(p0, q0)}) = ${cstr(p1, q1)}`, cx, BY - 66, { size: 28, weight: 800, fill: 'cyan' });
      label(ctx, `× i turns any number 90° anticlockwise, because i² = ${MINUS}1`, cx, BY - 26, { size: 20, weight: 600, fill: 'muted' });
      ctx.restore();
    }
  };

  // A 2×2 matrix moves the plane: î and ĵ go to its columns; area scales by the determinant.
  S['matrix-transform'] = (b, ctx, it, t) => {
    const given = (() => { const m = it.m; if (!Array.isArray(m)) return null; const f = m.flat(); return f.length === 4 && f.every((v) => Number.isFinite(+v)) ? f.map(Number) : null; })();
    const LIST = given ? [given] : [[2, 0, 0, 1], [1, 1, 0, 1], [0, -1, 1, 0], [1, 0, 0, -1], [3, 1, 1, 2]];
    const sl = slot(Math.max(0, t - 0.8), LIST.length, 6.5); const [p, q, r, s2] = LIST[sl.i];
    const k = hold(sl.f, 0.15, 0.45, 0.85, 0.98) * ramp(t, 0.8, 0.3);
    const m = [lerp(1, p, k), lerp(0, q, k), lerp(0, r, k), lerp(1, s2, k)];
    const T = (x, y) => [m[0] * x + m[1] * y, m[2] * x + m[3] * y];
    const a = (it._a ||= axes({ x: cx - 240, y: FIG.y + 50, w: 480, h: 480 }, -4, 4, -4, 4));
    const P = (x, y) => { const [u, v] = T(x, y); return [a.px(u), a.py(v)]; };
    ctx.save(); alpha(ctx, ramp(t, 0, 0.4));
    ctx.strokeStyle = 'rgba(140,170,255,0.12)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = -4; i <= 4; i++) { ctx.moveTo(a.px(i), a.box.y); ctx.lineTo(a.px(i), a.box.y + a.box.h); ctx.moveTo(a.box.x, a.py(i)); ctx.lineTo(a.box.x + a.box.w, a.py(i)); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(140,170,255,0.3)'; ctx.lineWidth = 1.5; ctx.strokeRect(a.box.x, a.box.y, a.box.w, a.box.h);
    ctx.restore();
    ctx.save(); clipBox(ctx, a.box);
    ctx.strokeStyle = 'rgba(91,140,255,0.45)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = -8; i <= 8; i++) { const [x0, y0] = P(i, -8); const [x1, y1] = P(i, 8); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); const [x2, y2] = P(-8, i); const [x3, y3] = P(8, i); ctx.moveTo(x2, y2); ctx.lineTo(x3, y3); }
    ctx.stroke();
    { const [x0, y0] = P(-8, 0); const [x1, y1] = P(8, 0); const [x2, y2] = P(0, -8); const [x3, y3] = P(0, 8); seg(ctx, x0, y0, x1, y1, 'rgba(220,230,255,0.75)', 2); seg(ctx, x2, y2, x3, y3, 'rgba(220,230,255,0.75)', 2); }
    shape(ctx, [P(0, 0), P(1, 0), P(1, 1), P(0, 1)], 'yellow', 0.3, 2.5);
    glow(ctx, COLORS.orange, 12); arrow(ctx, a.px(0), a.py(0), ...P(1, 0), 'orange', 5);
    glow(ctx, COLORS.green, 12); arrow(ctx, a.px(0), a.py(0), ...P(0, 1), 'green', 5); ctx.shadowBlur = 0;
    ctx.restore();
    const [ix, iy] = P(1, 0); const [jx, jy] = P(0, 1);
    label(ctx, 'î', ix + 16, iy - 14, { size: 24, weight: 800, fill: 'orange' }); label(ctx, 'ĵ', jx + 16, jy - 14, { size: 24, weight: 800, fill: 'green' });
    // The matrix, the determinant and what it means.
    const mx = FIG.x + 110; const my = BY - 80;
    ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(mx - 50, my - 48); ctx.lineTo(mx - 62, my - 48); ctx.lineTo(mx - 62, my + 48); ctx.lineTo(mx - 50, my + 48);
    ctx.moveTo(mx + 50, my - 48); ctx.lineTo(mx + 62, my - 48); ctx.lineTo(mx + 62, my + 48); ctx.lineTo(mx + 50, my + 48); ctx.stroke();
    label(ctx, fmt(p), mx - 26, my - 22, { size: 28, weight: 800, fill: 'orange' }); label(ctx, fmt(q), mx + 26, my - 22, { size: 28, weight: 800, fill: 'green' });
    label(ctx, fmt(r), mx - 26, my + 24, { size: 28, weight: 800, fill: 'orange' }); label(ctx, fmt(s2), mx + 26, my + 24, { size: 28, weight: 800, fill: 'green' });
    const det = p * s2 - q * r; const now = m[0] * m[3] - m[1] * m[2];
    const tx = FIG.x + 200;
    label(ctx, `det = ${fmt(p)} × ${fmt(s2)} − ${fmt(q)} × ${fmt(r)} = ${fmt(det)}`, tx, my - 34, { size: 24, weight: 800, fill: 'yellow', align: 'left' });
    label(ctx, Math.abs(det) < 1e-9 ? 'squashed flat: every area becomes 0' : det < 0 ? `areas × ${fmt(-det)}, and the plane is flipped over` : `every area is multiplied by ${fmt(det)}`, tx, my + 2, { size: 21, weight: 600, fill: 'ink', align: 'left' });
    label(ctx, `yellow square's area now: ${fix(Math.abs(now))}`, tx, my + 36, { size: 19, weight: 600, fill: 'muted', align: 'left' });
  };

  // Speed, distance and time: a journey and its distance–time graph; speed is the gradient.
  S['speed-distance-time'] = (b, ctx, it, t) => {
    const PTS = [[0, 0], [1, 60], [1.5, 60], [2.5, 100], [4.5, 0]];
    const a = (it._a ||= axes({ x: FIG.x + 90, y: FIG.y + 210, w: 450, h: 370 }, 0, 4.5, 0, 120));
    const P = 13; const u = loop(Math.max(0, t - 1), P) * P; const tau = clamp(u / 9) * 4.5; const trace = 1 - clamp((u - 11.4) / 1);
    let si = 0; while (si < PTS.length - 2 && tau >= PTS[si + 1][0]) si++;
    const [t0, d0] = PTS[si]; const [t1, d1] = PTS[si + 1];
    const dist = lerp(d0, d1, clamp((tau - t0) / (t1 - t0)));
    label(ctx, 'Speed = distance ÷ time', cx, FIG.y + 28, { size: 26, weight: 700, fill: 'ink' });
    // The road with the car on it.
    const ry = FIG.y + 120; const rx = (d) => a.box.x + (d / 120) * a.box.w;
    seg(ctx, rx(0), ry + 22, rx(120), ry + 22, 'rgba(200,215,255,0.5)', 3);
    label(ctx, 'home', rx(0), ry + 46, { size: 18, weight: 600, fill: 'muted' }); label(ctx, '100 km', rx(100), ry + 46, { size: 18, weight: 600, fill: 'muted' });
    seg(ctx, rx(100), ry + 14, rx(100), ry + 30, 'rgba(200,215,255,0.5)', 2);
    ctx.save(); ctx.translate(rx(dist), ry); if (d1 < d0) ctx.scale(-1, 1);
    glow(ctx, COLORS.cyan, 12); rounded(ctx, -24, -6, 48, 20, 6); ctx.fillStyle = COLORS.cyan; ctx.fill(); rounded(ctx, -12, -16, 26, 12, 4); ctx.fill(); ctx.shadowBlur = 0;
    dot(ctx, -13, 15, 6, 'ink'); dot(ctx, 13, 15, 6, 'ink');
    ctx.restore();
    ctx.save(); alpha(ctx, ramp(t, 0, 0.4));
    drawAxes(ctx, a, { xt: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5], yt: [0, 20, 40, 60, 80, 100, 120], xName: 'time (h)', yName: 'distance (km)' });
    path(ctx, PTS.map(([x, y]) => [a.px(x), a.py(y)]), false); ctx.strokeStyle = 'rgba(34,211,238,0.25)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
    ctx.save(); alpha(ctx, trace * ramp(t, 1, 0.3));
    const done = PTS.filter(([x]) => x <= tau).map(([x, y]) => [a.px(x), a.py(y)]);
    path(ctx, [...done, [a.px(tau), a.py(dist)]], false); glow(ctx, COLORS.cyan, 12); ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 4.5; ctx.stroke(); ctx.shadowBlur = 0;
    // The current part: its rise over run is the speed.
    seg(ctx, a.px(t0), a.py(d0), a.px(t1), a.py(d0), 'orange', 2, [6, 6]); seg(ctx, a.px(t1), a.py(d0), a.px(t1), a.py(d1), 'orange', 2, [6, 6]);
    dot(ctx, a.px(tau), a.py(dist), 8, 'yellow');
    const dd = Math.abs(d1 - d0); const dt = t1 - t0; const v = dd / dt;
    label(ctx, dd ? `${fmt(dd)} km ÷ ${fmt(dt)} h = ${fmt(v)} km/h${d1 < d0 ? ', driving home' : ''}` : `stopped for ${fmt(dt)} h: speed 0 km/h (flat line)`, cx, BY - 66, { size: 24, weight: 800, fill: 'orange' });
    label(ctx, 'steeper line = faster; flat line = not moving', cx, BY - 26, { size: 20, weight: 600, fill: 'muted' });
    ctx.restore();
    // The formula triangle.
    const fx = FIG.x + 690; const ft = FIG.y + 230; const fb = FIG.y + 420;
    ctx.save(); alpha(ctx, ramp(t, 0.5, 0.4));
    path(ctx, [[fx, ft], [fx + 115, fb], [fx - 115, fb]]); ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fill(); ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 3; ctx.stroke();
    seg(ctx, fx - 58, (ft + fb) / 2 + 8, fx + 58, (ft + fb) / 2 + 8, 'purple', 3); seg(ctx, fx, (ft + fb) / 2 + 8, fx, fb, 'purple', 3);
    label(ctx, 'D', fx, ft + 70, { size: 34, weight: 800, fill: 'cyan' });
    label(ctx, 'S', fx - 42, fb - 38, { size: 30, weight: 800, fill: 'orange' }); label(ctx, 'T', fx + 42, fb - 38, { size: 30, weight: 800, fill: 'green' });
    label(ctx, 'S = D ÷ T', fx, fb + 44, { size: 24, weight: 800, fill: 'orange' });
    label(ctx, 'D = S × T', fx, fb + 82, { size: 21, weight: 600, fill: 'muted' });
    label(ctx, 'T = D ÷ S', fx, fb + 116, { size: 21, weight: 600, fill: 'muted' });
    ctx.restore();
  };

  // Simple against compound interest, year by year.
  S['compound-interest'] = (b, ctx, it, t) => {
    const P0 = Math.max(1, num(it.P, 1000)); const r = num(it.r, 10); const n = clamp(Math.round(num(it.n, 8)), 1, 12); const cur = String(it.unit ?? '£');
    const simple = (k) => P0 * (1 + (r * k) / 100); const comp = (k) => P0 * (1 + r / 100) ** k;
    const top = Math.max(simple(n), comp(n), P0) * 1.1;
    const a = (it._a ||= axes({ x: FIG.x + 110, y: FIG.y + 170, w: FIG.w - 140, h: FIG.h - 270 }, -0.5, n + 0.5, 0, top));
    const yt = nice(0, top, 5);
    ctx.save(); alpha(ctx, ramp(t, 0, 0.4));
    drawAxes(ctx, a, { left: true, xt: Array.from({ length: n + 1 }, (_, i) => i), yt, fy: (v) => `${cur}${group(String(Math.round(v)))}` });
    label(ctx, 'year', a.box.x + a.box.w, a.box.y + a.box.h + 40, { size: 18, weight: 600, fill: 'muted', align: 'right' });
    ctx.restore();
    parts(ctx, [['■ ', 'blue'], ['simple interest', 'ink'], ['      ■ ', 'orange'], [`compound interest (${fmt(r)}% a year)`, 'ink']], cx, FIG.y + 30, 22, 700);
    const bw = a.ux(1) * 0.36;
    const built = 0.3 + 2 + 0.4;
    const hl = t > built ? slot(b.clock, n + 1, 1.6) : null;
    for (let k = 0; k <= n; k++) {
      const g = ramp(t, 0.3 + (k * 2) / n, 0.4);
      if (g <= 0) break;
      const X = a.px(k); const Z = a.py(0);
      const on = hl && hl.i === k ? edge(hl.f, 0.1) : 0;
      for (const [v, c, dx] of [[simple(k), 'blue', -bw - 1], [comp(k), 'orange', 1]]) {
        const Y = lerp(Z, a.py(v), g);
        ctx.fillStyle = tint(c, 0.45 + 0.3 * on); ctx.fillRect(X + dx, Y, bw, Z - Y);
        if (on > 0.5) { glow(ctx, color(c), 14); ctx.strokeStyle = color(c); ctx.lineWidth = 2.5; ctx.strokeRect(X + dx, Y, bw, Z - Y); ctx.shadowBlur = 0; }
      }
    }
    if (hl) {
      const k = hl.i;
      ctx.save(); alpha(ctx, edge(hl.f, 0.1));
      label(ctx, `Year ${k}: simple ${cur}${fmt(P0)} + ${k} × ${cur}${fmt((P0 * r) / 100)} = ${money(simple(k), cur)}`, cx, FIG.y + 76, { size: 21, weight: 700, fill: 'blue' });
      label(ctx, `compound ${cur}${fmt(P0)} × ${fmt(1 + r / 100, 4)}${sup(k)} = ${money(comp(k), cur)}`, cx, FIG.y + 112, { size: 21, weight: 700, fill: 'orange' });
      ctx.restore();
    }
    if (t > built) {
      ctx.save(); alpha(ctx, ramp(t, built, 0.4));
      label(ctx, `after ${n} years compound earns ${money(comp(n) - simple(n), cur)} more`, cx, BY - 22, { size: 22, weight: 700, fill: 'orange' });
      ctx.restore();
    }
  };

  // Dijkstra's algorithm on a small network: visit the nearest, update neighbours, repeat.
  const NET = { names: 'ABCDEF', pos: [[0.05, 0.5], [0.34, 0.12], [0.3, 0.88], [0.66, 0.18], [0.64, 0.84], [0.95, 0.5]], edges: [[0, 1, 4], [0, 2, 2], [1, 2, 1], [1, 3, 5], [2, 3, 8], [2, 4, 10], [3, 4, 2], [3, 5, 6], [4, 5, 3]] };
  const DJ = dijkstra(NET.pos, NET.edges, 0, 5);
  S['shortest-path'] = (b, ctx, it, t) => {
    const XY = NET.pos.map(([x, y]) => [FIG.x + 40 + x * (FIG.w - 80), FIG.y + 140 + y * (FIG.h - 290)]);
    const n = DJ.steps.length; const SD = 1.4; const P = n * SD + 3.6;
    const u = loop(Math.max(0, t - 1.2), P) * P; const live = ramp(t, 1.2, 0.3);
    const fa = 1 - clamp((u - (P - 0.6)) / 0.6);
    const j = Math.min(n, Math.floor(u / SD)); const fj = (u - j * SD) / SD;
    const st = live > 0 && j < n ? DJ.steps[j] : null;
    const finished = live > 0 && j >= n;
    const init = NET.pos.map((_, i) => (i ? Infinity : 0));
    const dist = live <= 0 ? init : finished ? DJ.steps[n - 1].dist : fj > 0.45 ? st.dist : j ? DJ.steps[j - 1].dist : init;
    const done = live <= 0 ? [] : finished ? DJ.steps[n - 1].done : st.done;
    const onRoute = (e) => { const [p, q] = NET.edges[e]; const ip = DJ.route.indexOf(p); const iq = DJ.route.indexOf(q); return ip >= 0 && iq >= 0 && Math.abs(ip - iq) === 1; };
    label(ctx, "Dijkstra's algorithm: shortest route from A to F", cx, FIG.y + 30, { size: 24, weight: 700, fill: 'ink' });
    NET.edges.forEach(([p, q, w], e) => {
      const g = ramp(t, 0.2 + e * 0.06, 0.4);
      if (g <= 0) return;
      const [x0, y0] = XY[p]; const [x1, y1] = XY[q];
      const lit = st && st.relaxed.includes(e) && fj > 0.2; const best = finished && onRoute(e);
      ctx.save(); alpha(ctx, g * (best ? fa : 1));
      if (best) { glow(ctx, COLORS.yellow, 18); seg(ctx, x0, y0, x1, y1, 'yellow', 7); ctx.shadowBlur = 0; }
      else seg(ctx, x0, y0, x1, y1, lit ? 'cyan' : 'rgba(200,215,255,0.45)', lit ? 4.5 : 3);
      ctx.restore();
      const mx = (x0 + x1) / 2; const my = (y0 + y1) / 2;
      ctx.save(); alpha(ctx, g);
      dot(ctx, mx, my, 15, BG); label(ctx, String(w), mx, my + 1, { size: 20, weight: 700, fill: best && fa > 0.5 ? 'yellow' : lit ? 'cyan' : 'muted' });
      ctx.restore();
    });
    XY.forEach(([x, y], i) => {
      const p = pop(t, 0.1 + i * 0.08, 0.35);
      if (p <= 0) return;
      const cur = st && st.u === i; const vis = done[i];
      ctx.save(); ctx.translate(x, y); ctx.scale(p, p);
      if (cur) glow(ctx, COLORS.yellow, 20);
      ring(ctx, 0, 0, 26, cur ? 'yellow' : vis ? 'green' : 'rgba(200,215,255,0.7)', 3.5, vis ? 'rgba(52,211,153,0.2)' : BG);
      ctx.shadowBlur = 0;
      label(ctx, NET.names[i], 0, 1, { size: 24, weight: 800, fill: cur ? 'yellow' : 'ink' });
      ctx.restore();
      if (live > 0) { ctx.save(); alpha(ctx, live); label(ctx, dist[i] === Infinity ? '∞' : String(dist[i]), x, y + (y < cy ? -44 : 44), { size: 22, weight: 800, fill: dist[i] === Infinity ? 'muted' : 'cyan' }); ctx.restore(); }
    });
    if (live <= 0) return;
    ctx.save(); alpha(ctx, live * (finished ? fa : 1));
    if (finished) label(ctx, `Shortest A → F = ${DJ.total}: ${DJ.route.map((i) => NET.names[i]).join(' → ')}`, cx, BY - 40, { size: 26, weight: 800, fill: 'yellow' });
    else label(ctx, `Visit ${NET.names[st.u]} (nearest, ${dist[st.u]}): update the distances of its neighbours`, cx, BY - 40, { size: 21, weight: 700, fill: 'ink' });
    ctx.restore();
  };

  // Newton–Raphson: follow the tangent down to the axis, again and again, to the root.
  S['newton-raphson'] = (b, ctx, it, t) => {
    const G = (it._g ||= (() => {
      const src = String(it.f ?? 'x^2 - 2'); const g = compile(src); const f = g || ((x) => x * x - 2);
      let x = num(it.x0, 3); const xs = [x];
      for (let k = 0; k < 5; k++) { const d = slope(f, x); if (!Number.isFinite(d) || Math.abs(d) < 1e-12) break; const nx = x - f(x) / d; if (!Number.isFinite(nx) || Math.abs(nx) > 1e6) break; xs.push(nx); if (Math.abs(nx - x) < 1e-7) break; x = nx; }
      const show = xs.filter((v) => Math.abs(v - xs[0]) < 50);
      const lo = Math.min(0, ...show) - 0.5; const hi = Math.max(...show) + 0.6;
      const [y0, y1] = yRange(f, lo, hi, 0.1);
      return { f, xs: show, name: g ? pretty(src) : 'x² − 2', a: axes({ x: FIG.x + 70, y: FIG.y + 90, w: FIG.w - 110, h: FIG.h - 250 }, lo, hi, y0, y1) };
    })());
    const { f, xs, a } = G; const K = xs.length - 1;
    const SD = 1.6; const P = Math.max(1, K) * SD + 2.8;
    const u = loop(Math.max(0, t - 1), P) * P; const live = ramp(t, 1, 0.3); const fa = 1 - clamp((u - (P - 0.6)) / 0.6);
    const j = Math.min(K, Math.floor(u / SD)); const fj = clamp((u - j * SD) / SD);
    ctx.save(); alpha(ctx, ramp(t, 0, 0.4)); drawAxes(ctx, a, { xName: 'x', yName: 'y' }); ctx.restore();
    plot(ctx, a, f, 'purple', 4.5, a.x0, a.x0 + (a.x1 - a.x0) * clamp((t - 0.2) / 1), 160);
    label(ctx, `Newton–Raphson: solve ${G.name} = 0`, cx, FIG.y + 30, { size: 26, weight: 800, fill: 'ink' });
    if (live <= 0 || K < 1) return;
    const zy = a.py(clamp(0, a.y0, a.y1));
    ctx.save(); alpha(ctx, live * fa); clipBox(ctx, a.box);
    for (let k = 0; k <= Math.min(j, K - 1); k++) {
      const cur = k === j; const xk = xs[k]; const yk = f(xk); const xn = xs[k + 1];
      const p1 = cur ? clamp(fj / 0.3) : 1; const p2 = cur ? clamp((fj - 0.3) / 0.4) : 1;
      ctx.save(); alpha(ctx, cur ? 1 : 0.35);
      seg(ctx, a.px(xk), zy, a.px(xk), lerp(zy, a.py(yk), p1), 'rgba(233,238,255,0.7)', 2, [6, 6]);
      if (p2 > 0) { glow(ctx, COLORS.yellow, cur ? 12 : 0); seg(ctx, a.px(xk), a.py(yk), lerp(a.px(xk), a.px(xn), p2), lerp(a.py(yk), zy, p2), 'yellow', 3); ctx.shadowBlur = 0; }
      dot(ctx, a.px(xk), a.py(yk), 7, 'yellow');
      ctx.restore();
    }
    ctx.restore();
    ctx.save(); alpha(ctx, live * fa);
    const shownN = j + (fj > 0.7 || j >= K ? 2 : 1);
    for (let k = 0; k < Math.min(shownN, xs.length); k++) {
      if (k === shownN - 1) glow(ctx, COLORS.green, 12); dot(ctx, a.px(xs[k]), zy, 7, k === shownN - 1 ? 'green' : 'rgba(52,211,153,0.5)'); ctx.shadowBlur = 0;
      label(ctx, `x${sub(k)} = ${fmt(xs[k], 5)}`, Math.max(a.box.x + 24, a.px(clamp(0, a.x0, a.x1)) + 40), a.box.y + 22 + k * 32, { size: 22, weight: 700, fill: k === shownN - 1 ? 'green' : 'muted', align: 'left' });
    }
    label(ctx, `x${sub('n+1')} = x${sub('n')} − f(x${sub('n')}) ÷ f′(x${sub('n')})`, cx, BY - 72, { size: 26, weight: 800, fill: 'ink' });
    if (j < K) { const xk = xs[j]; const br = (v) => (v < 0 ? `(${fmt(v, 4)})` : fmt(v, 4)); label(ctx, `x${sub(j + 1)} = ${fmt(xk, 4)} − ${br(f(xk))} ÷ ${br(slope(f, xk))} = ${fmt(xs[j + 1], 5)}`, cx, BY - 30, { size: 21, weight: 700, fill: 'yellow' }); }
    else label(ctx, `root ≈ ${fmt(xs[K], 6)}  (f = ${fix(f(xs[K]), 6)})`, cx, BY - 30, { size: 22, weight: 800, fill: 'green' });
    ctx.restore();
  };

  return S;
}

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];
const words = (n) => (n < 20 ? ONES[n] : n % 10 ? `${TENS[Math.floor(n / 10)]}-${ONES[n % 10]}` : TENS[n / 10]);
// The time in words, as a child says it: "twenty to four", "quarter past nine".
function timeWords(h, m) {
  const H = (x) => ONES[((((x - 1) % 12) + 12) % 12) + 1];
  const mins = (k) => (k % 5 ? `${words(k)} minute${k === 1 ? '' : 's'}` : words(k));
  if (m === 0) return `${H(h)} o'clock`;
  if (m === 15) return `quarter past ${H(h)}`;
  if (m === 30) return `half past ${H(h)}`;
  if (m === 45) return `quarter to ${H(h + 1)}`;
  return m < 30 ? `${mins(m)} past ${H(h)}` : `${mins(60 - m)} to ${H(h + 1)}`;
}
