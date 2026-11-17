// More simulations for the board, for the subjects beyond physics and maths:
// computing (sorting, searching, binary, logic gates, the CPU, packets,
// flowcharts, variables, ciphers), biology (the heart, photosynthesis,
// respiration, food webs, DNA, mitosis, digestion, breathing, nerves,
// enzymes), chemistry (bonding, rates, electrolysis, chromatography,
// burning), earth and geography (the water and rock cycles, plates,
// volcanoes, rivers, fronts, climate graphs, the greenhouse effect),
// economics and business, and English and humanities. Each is a function of
// time (t since it appeared, b.clock for the loop), so any moment can be
// drawn: plain canvas calls, a few glows, no state between frames beyond
// constants cached on the item. MORE_SIMS says what each one is for, so a
// lesson's words can pick the right picture.

export const MORE_SIMS = {
  // Computing
  'bubble-sort': { title: 'Bubble sort', keywords: ['bubble sort', 'sorting algorithm', 'sorting algorithms', 'swap adjacent', 'sort a list'], example: { items: [5, 2, 8, 1, 9, 3, 7, 4] } },
  'binary-search': { title: 'Binary search', keywords: ['binary search', 'search algorithm', 'searching algorithm', 'halving the list', 'sorted list', 'linear search'], example: { items: [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91], target: 72 } },
  'binary-numbers': { title: 'Binary numbers', keywords: ['binary number', 'binary numbers', 'base 2', 'bits and bytes', 'convert to binary', 'denary', 'binary to denary'], example: { value: 77 } },
  'logic-gates': { title: 'Logic gates', keywords: ['logic gate', 'logic gates', 'and gate', 'or gate', 'not gate', 'truth table', 'boolean logic'], example: {} },
  'fetch-execute': { title: 'Fetch–decode–execute cycle', keywords: ['fetch-execute', 'fetch execute', 'fetch-decode-execute', 'fetch decode execute', 'program counter', 'cpu registers', 'von neumann', 'memory address register'], example: {} },
  'network-packets': { title: 'Packet switching', keywords: ['packet switching', 'data packets', 'router', 'routers', 'how the internet works', 'internet protocol'], example: { message: 'HELLO WORLD' } },
  flowchart: { title: 'Flowchart', keywords: ['flowchart', 'flow chart', 'flow diagram', 'decision symbol', 'algorithm design'], example: { items: [14, 6], limit: 10 } },
  'variables-memory': { title: 'Variables in memory', keywords: ['variables in programming', 'programming variable', 'assignment statement', 'assign a value', 'variable assignment', 'store a value in a variable'], example: { lines: ['x = 5', 'y = 3', 'x = x + y', 'y = x * 2', 'print(x, y)'] } },
  encryption: { title: 'Caesar cipher', keywords: ['encryption', 'caesar cipher', 'cipher', 'encrypt', 'decrypt', 'cryptography', 'secret code'], example: { message: 'HELLO', shift: 3 } },
  // Biology
  'heart-circulation': { title: 'The heart and circulation', keywords: ['circulatory system', 'double circulation', 'heart chambers', 'blood vessels', 'atrium', 'ventricle', 'oxygenated blood', 'deoxygenated'], example: {} },
  photosynthesis: { title: 'Photosynthesis', keywords: ['photosynthesis', 'chlorophyll', 'carbon dioxide and water', 'light energy to make glucose', 'how plants make food'], example: {} },
  respiration: { title: 'Respiration', keywords: ['aerobic respiration', 'anaerobic respiration', 'cellular respiration', 'respiration', 'mitochondria release energy', 'lactic acid'], example: { kind: 'aerobic' } },
  'food-web': { title: 'Food web', keywords: ['food web', 'food chain', 'producers and consumers', 'primary consumer', 'predator and prey', 'herbivore', 'carnivore', 'energy flow in an ecosystem'], example: {} },
  dna: { title: 'DNA double helix', keywords: ['dna', 'double helix', 'base pairs', 'nucleotide', 'genetic code', 'adenine', 'thymine', 'guanine'], example: { sequence: 'ATGCGTACCTAG' } },
  mitosis: { title: 'Mitosis', keywords: ['mitosis', 'cell division', 'prophase', 'metaphase', 'anaphase', 'telophase', 'cytokinesis', 'chromosomes'], example: {} },
  'digestive-system': { title: 'The digestive system', keywords: ['digestive system', 'digestion', 'oesophagus', 'esophagus', 'small intestine', 'large intestine', 'stomach acid', 'alimentary canal'], example: {} },
  lungs: { title: 'Breathing and gas exchange', keywords: ['breathing', 'lungs', 'gas exchange', 'alveoli', 'diaphragm', 'trachea', 'ventilation', 'inhale'], example: {} },
  neuron: { title: 'Neurons and nerve impulses', keywords: ['neuron', 'neurone', 'nerve impulse', 'nervous system', 'axon', 'synapse', 'myelin', 'nerve cell'], example: {} },
  enzymes: { title: 'Enzymes: lock and key', keywords: ['enzyme', 'enzymes', 'active site', 'lock and key', 'substrate', 'denatured', 'catalase'], example: {} },
  // Chemistry
  'ionic-bonding': { title: 'Ionic bonding', keywords: ['ionic bond', 'ionic bonding', 'ions form', 'sodium chloride', 'transfer of electrons', 'electron transfer', 'positive ion', 'negative ion'], example: { compound: 'NaCl' } },
  'covalent-bonding': { title: 'Covalent bonding', keywords: ['covalent bond', 'covalent bonding', 'shared pair', 'dot and cross', 'lone pair', 'simple molecule', 'electrons are shared'], example: { molecule: 'H2O' } },
  'collision-theory': { title: 'Collision theory', keywords: ['collision theory', 'activation energy', 'successful collisions', 'frequency of collisions', 'particles collide', 'reacting particles'], example: { factor: 'temperature' } },
  'rates-graph': { title: 'Rate of reaction graph', keywords: ['rate of reaction', 'rates of reaction', 'reaction rate', 'catalyst', 'volume of gas produced', 'speed of a reaction'], example: { compare: 'temperature' } },
  electrolysis: { title: 'Electrolysis', keywords: ['electrolysis', 'electrolyte', 'cathode', 'anode', 'electrode', 'half equation', 'half equations'], example: { compound: 'lead bromide' } },
  chromatography: { title: 'Paper chromatography', keywords: ['chromatography', 'rf value', 'solvent front', 'separating dyes', 'mobile phase', 'stationary phase'], example: {} },
  combustion: { title: 'Combustion', keywords: ['combustion', 'burning fuel', 'fire triangle', 'complete combustion', 'incomplete combustion', 'hydrocarbon fuel', 'methane burns'], example: {} },
  // Earth and geography
  'water-cycle': { title: 'The water cycle', keywords: ['water cycle', 'hydrological cycle', 'transpiration', 'clouds form', 'condensation and precipitation', 'evaporation and condensation'], example: {} },
  'rock-cycle': { title: 'The rock cycle', keywords: ['rock cycle', 'igneous', 'sedimentary', 'metamorphic', 'types of rock', 'weathering and erosion', 'magma cools'], example: {} },
  'plate-boundaries': { title: 'Plate boundaries', keywords: ['plate boundary', 'plate boundaries', 'tectonic plates', 'plate tectonics', 'convergent boundary', 'divergent boundary', 'transform fault', 'subduction'], example: {} },
  volcano: { title: 'Volcano', keywords: ['volcano', 'volcanoes', 'volcanic eruption', 'magma chamber', 'lava', 'ash cloud', 'erupt'], example: {} },
  'river-features': { title: 'River features', keywords: ['river features', 'meander', 'ox-bow lake', 'oxbow lake', 'river delta', 'source of a river', 'floodplain', 'course of a river'], example: {} },
  'weather-fronts': { title: 'Weather fronts', keywords: ['weather front', 'warm front', 'cold front', 'frontal rainfall', 'low pressure system', 'air masses', 'weather map'], example: {} },
  'climate-graph': { title: 'Climate graph', keywords: ['climate graph', 'monthly rainfall', 'temperature and rainfall', 'climate data', 'rainfall bars'], example: { place: 'London, UK' } },
  'greenhouse-effect': { title: 'The greenhouse effect', keywords: ['greenhouse effect', 'greenhouse gas', 'greenhouse gases', 'global warming', 'climate change', 'carbon emissions'], example: {} },
  // Economics and business
  'supply-demand': { title: 'Supply and demand', keywords: ['supply and demand', 'demand curve', 'supply curve', 'equilibrium price', 'market price', 'shift in demand', 'price mechanism'], example: { shift: 'demand-right' } },
  'break-even': { title: 'Break-even', keywords: ['break-even', 'break even', 'fixed costs', 'variable costs', 'total revenue', 'margin of safety'], example: { fixed: 2000, variable: 5, price: 15 } },
  inflation: { title: 'Inflation', keywords: ['inflation', 'rising prices', 'cost of living', 'consumer price index', 'purchasing power', 'cpi'], example: { start: 50 } },
  'profit-loss': { title: 'Profit and loss', keywords: ['profit and loss', 'profit', 'revenue minus costs', 'making a loss', 'net profit', 'gross profit'], example: { revenue: 12000, costs: ['Wages: 5000', 'Materials: 3000', 'Rent: 2000'] } },
  // English and humanities
  'parts-of-speech': { title: 'Parts of speech', keywords: ['parts of speech', 'word class', 'word classes', 'noun', 'verb', 'adjective', 'adverb', 'preposition'], example: { sentence: 'The quick brown fox jumps over the lazy dog.' } },
  'story-mountain': { title: 'Story mountain', keywords: ['story mountain', 'plot structure', 'rising action', 'climax of the story', 'falling action', 'exposition', 'narrative structure', 'story structure'], example: {} },
  'persuasive-techniques': { title: 'Persuasive techniques', keywords: ['persuasive techniques', 'persuasive writing', 'ethos', 'pathos', 'logos', 'rhetoric', 'persuade', 'rhetorical question'], example: {} },
  'timeline-history': { title: 'Timeline', keywords: ['timeline', 'historical events', 'chronology', 'chronological order', 'world history', 'key dates'], example: { items: ['1066: Battle of Hastings', '1215: Magna Carta', '1492: Columbus reaches the Americas', '1588: Spanish Armada'] } },
  'memory-model': { title: 'Multi-store model of memory', keywords: ['multi-store model', 'multistore model', 'short-term memory', 'long-term memory', 'sensory memory', 'atkinson and shiffrin', 'memory store', 'working memory'], example: {} },
};

export function moreSims(kit) {
  // eslint-disable-next-line no-unused-vars
  const { FIG, COL, COLORS, HUES, FONT, glow, label, wrapLabel, rounded, arrow, clamp, easeOut, outBack, color, tint } = kit;
  const X0 = FIG.x; const Y0 = FIG.y; const X1 = FIG.x + FIG.w; const Y1 = FIG.y + FIG.h;
  const cx = X0 + FIG.w / 2; const cy = Y0 + FIG.h / 2;
  const TAU = Math.PI * 2;
  const LINE = 'rgba(220,230,255,0.8)'; const FAINT = 'rgba(140,170,255,0.18)'; const DARK = '#070b1d';
  const MONO = 'ui-monospace, Menlo, Consolas, monospace';

  // Small tools: numbers, timing, loops.
  const val = (v, d) => { const n = Number(v); return v !== null && v !== undefined && v !== '' && Number.isFinite(n) ? n : d; };
  const mod = (a, n) => ((a % n) + n) % n;
  const tri = (a) => { const m = mod(a, 2); return m < 1 ? m : 2 - m; };
  const smooth = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
  const lerp = (a, c, p) => a + (c - a) * p;
  const fade = (ctx, t, d = 0.5) => { const q = easeOut(clamp(t / d)); ctx.globalAlpha *= q; return q; };
  const after = (t, at, d = 0.4) => easeOut(clamp((t - at) / d));
  const cycle = (t, period, delay = 0.6) => (t < delay ? 0 : mod(t - delay, period));
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const nums = (v, d) => { const a = Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[\s,;]+/) : []; const out = a.map(Number).filter(Number.isFinite); return out.length >= 2 ? out : d; };
  const strs = (v, d) => (Array.isArray(v) && v.length ? v.map(String) : typeof v === 'string' && v.trim() ? v.split(/\s*[;\n|]\s*/).filter(Boolean) : d);
  const commas = (n) => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const money = (n) => `${n < 0 ? '−' : ''}£${commas(n)}`;
  const fx = (n, d = 1) => (Math.abs(n) < 0.5 * 10 ** -d ? 0 : n).toFixed(d).replace('-', '−');

  // Drawing helpers in the board's holo style.
  const title = (ctx, text) => label(ctx, String(text), cx, Y0 + 28, { size: 26, weight: 700, fill: 'ink' });
  function chip(ctx, text, x, y, c = 'ink', size = 21, align = 'center') {
    text = String(text);
    ctx.font = `700 ${size}px ${FONT}`;
    const w = ctx.measureText(text).width + 24; const h = size + 14;
    const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.fillStyle = 'rgba(5,8,22,0.78)'; ctx.strokeStyle = tint(c, 0.55); ctx.lineWidth = 1.5;
    rounded(ctx, left, y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
    label(ctx, text, left + w / 2, y + 1, { size, weight: 700, fill: c });
  }
  function arr(ctx, x0, y0, x1, y1, c, w = 5) { if (Math.hypot(x1 - x0, y1 - y0) > 4) arrow(ctx, x0, y0, x1, y1, c, w); }
  function dot(ctx, x, y, r, c, blur = 0) {
    if (blur) glow(ctx, color(c), blur);
    ctx.fillStyle = color(c); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    if (blur) ctx.shadowBlur = 0;
  }
  function line(ctx, x0, y0, x1, y1, c = LINE, w = 2, dash) {
    ctx.strokeStyle = color(c); ctx.lineWidth = w;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    if (dash) ctx.setLineDash([]);
  }
  // A polyline [x0, y0, x1, y1, ...] as a path.
  function poly(ctx, pts, close = false) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    if (close) ctx.closePath();
  }
  function panel(ctx, x, y, w, h, c = 'blue', a = 0.08, r = 16) {
    ctx.fillStyle = tint(c, a); ctx.strokeStyle = tint(c, 0.6); ctx.lineWidth = 2;
    rounded(ctx, x, y, w, h, r); ctx.fill(); ctx.stroke();
  }
  // A path with its length, and the point a distance d along it.
  function mkPath(pts) {
    const cum = [0];
    for (let i = 2; i < pts.length; i += 2) cum.push(cum[cum.length - 1] + Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]));
    return { pts, cum, total: cum[cum.length - 1] || 1 };
  }
  function at(p, d) {
    d = clamp(d, 0, p.total);
    let i = 1;
    while (i < p.cum.length - 1 && p.cum[i] < d) i++;
    const s = p.cum[i] - p.cum[i - 1] || 1; const q = (d - p.cum[i - 1]) / s;
    const x0 = p.pts[2 * i - 2]; const y0 = p.pts[2 * i - 1]; const x1 = p.pts[2 * i]; const y1 = p.pts[2 * i + 1];
    return { x: x0 + (x1 - x0) * q, y: y0 + (y1 - y0) * q, a: Math.atan2(y1 - y0, x1 - x0), i: i - 1 };
  }
  // Stroke a path from distance d0 to d1.
  function strokeSpan(ctx, p, d0, d1) {
    if (d1 <= d0) return;
    const a0 = at(p, d0); const a1 = at(p, d1);
    ctx.beginPath(); ctx.moveTo(a0.x, a0.y);
    for (let i = a0.i + 1; i <= a1.i; i++) ctx.lineTo(p.pts[2 * i], p.pts[2 * i + 1]);
    ctx.lineTo(a1.x, a1.y); ctx.stroke();
  }
  // A small molecule from atoms [dx, dy, r, colour].
  function mol(ctx, x, y, atoms, a = 1) {
    for (const [dx, dy, r, c] of atoms) { ctx.fillStyle = tint(c, 0.9 * a); ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, TAU); ctx.fill(); }
  }
  const CO2 = [[-11, 0, 6, 'red'], [0, 0, 7, 'muted'], [11, 0, 6, 'red']];
  const O2 = [[-6, 0, 7, 'cyan'], [6, 0, 7, 'cyan']];
  const H2O = [[0, 0, 8, 'blue'], [-8, 7, 5, 'ink'], [8, 7, 5, 'ink']];
  function hexagon(ctx, x, y, r) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + Math.PI / 6; if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); }
  // Graph axes in a box with ticks [[fraction, text]] on each axis.
  function axes(ctx, g, { xTicks = [], yTicks = [], xName = '', yName = '', yTicks2 = [], yName2 = '', c2 = 'red', c1 = 'muted' } = {}) {
    ctx.strokeStyle = 'rgba(140,170,255,0.12)'; ctx.lineWidth = 1; ctx.beginPath();
    for (const [f] of yTicks) { const y = g.y + g.h - f * g.h; ctx.moveTo(g.x, y); ctx.lineTo(g.x + g.w, y); }
    ctx.stroke();
    arrow(ctx, g.x, g.y + g.h, g.x + g.w + 14, g.y + g.h, 'rgba(200,215,255,0.7)', 2.5);
    arrow(ctx, g.x, g.y + g.h, g.x, g.y - 14, 'rgba(200,215,255,0.7)', 2.5);
    for (const [f, s] of yTicks) label(ctx, String(s), g.x - 10, g.y + g.h - f * g.h, { size: 17, weight: 500, fill: c1, align: 'right' });
    for (const [f, s] of xTicks) label(ctx, String(s), g.x + f * g.w, g.y + g.h + 20, { size: 17, weight: 500, fill: 'muted' });
    if (yName) label(ctx, yName, g.x + 10, g.y - 14, { size: 18, weight: 600, fill: c1, align: 'left' });
    if (xName) label(ctx, xName, g.x + g.w + 10, g.y + g.h + 46, { size: 18, weight: 600, fill: 'muted', align: 'right' });
    if (yTicks2.length) {
      line(ctx, g.x + g.w, g.y + g.h, g.x + g.w, g.y - 6, 'rgba(200,215,255,0.5)', 2);
      for (const [f, s] of yTicks2) label(ctx, String(s), g.x + g.w + 10, g.y + g.h - f * g.h, { size: 17, weight: 500, fill: c2, align: 'left' });
      if (yName2) label(ctx, yName2, g.x + g.w - 10, g.y - 14, { size: 18, weight: 600, fill: c2, align: 'right' });
    }
  }

  // A tiny expression evaluator for the variables picture: numbers, strings,
  // names, + - * / % and brackets.
  function evalExpr(src, env) {
    const toks = String(src).match(/\d+(?:\.\d+)?|"[^"]*"|'[^']*'|[A-Za-z_]\w*|[-+*/()%]/g) || [];
    let i = 0;
    const peek = () => toks[i]; const next = () => toks[i++];
    function atom() {
      const tk = next();
      if (tk === undefined) return 0;
      if (tk === '(') { const v = sum(); next(); return v; }
      if (tk === '-') return -atom();
      if (/^["']/.test(tk)) return tk.slice(1, -1);
      if (/^\d/.test(tk)) return Number(tk);
      return env[tk] ?? 0;
    }
    function prod() { let v = atom(); while (peek() === '*' || peek() === '/' || peek() === '%') { const op = next(); const r = atom(); v = op === '*' ? v * r : op === '/' ? v / r : v % r; } return v; }
    function sum() { let v = prod(); while (peek() === '+' || peek() === '-') { const op = next(); const r = prod(); v = op === '+' ? v + r : v - r; } return v; }
    return sum();
  }
  const show = (v) => (typeof v === 'number' ? String(+v.toFixed(2)) : `"${v}"`);
  // Text wrapped to maxW (x is the left edge), up to `lines` lines, centred on y.
  function para(ctx, text, x, y, maxW, size = 20, fill = 'ink', weight = 500, lines = 3, align = 'center') {
    ctx.font = `${weight} ${size}px ${FONT}`;
    const out = []; let cur = '';
    for (const w of String(text).split(/\s+/)) { const test = cur ? `${cur} ${w}` : w; if (cur && ctx.measureText(test).width > maxW) { out.push(cur); cur = w; } else cur = test; }
    if (cur) out.push(cur);
    if (out.length > lines) { out.length = lines; out[lines - 1] = `${out[lines - 1].replace(/\s+\S*$/, '')}…`; }
    const lh = size * 1.25;
    out.forEach((l, i) => label(ctx, l, align === 'center' ? x + maxW / 2 : x, y + (i - (out.length - 1) / 2) * lh, { size, weight, fill, align }));
  }
  const niceStep = (span, n = 5) => { const s0 = span / n; const p = 10 ** Math.floor(Math.log10(s0)); return [1, 2, 5, 10].map((m) => m * p).find((v) => v >= s0); };
  const pounds = (n) => (Math.abs(n % 1) > 0.001 ? `£${n.toFixed(2)}` : money(n));

  return {
    // ─── Computing ────────────────────────────────────────────────────────

    // Bars compared in neighbouring pairs and swapped, pass after pass.
    'bubble-sort'(b, ctx, it, t) {
      const C = it._c || (it._c = (() => {
        const a = nums(it.items ?? it.values, [5, 2, 8, 1, 9, 3, 7, 4]).slice(0, 10).map((v) => Math.round(Math.abs(v)));
        const n = a.length; const steps = [];
        for (let p = 0; p < n - 1; p++) {
          let any = false;
          for (let j = 0; j < n - 1 - p; j++) {
            const sw = a[j] > a[j + 1];
            steps.push({ a: a.slice(), j, sw, p });
            if (sw) { const tmp = a[j]; a[j] = a[j + 1]; a[j + 1] = tmp; any = true; }
          }
          if (!any) break;
        }
        steps.push({ a: a.slice(), j: -1, sw: false, p: n, done: true });
        return { steps, n, max: Math.max(1, ...a) };
      })());
      const { steps, n, max } = C;
      const SD = 0.65; const u = cycle(t, (steps.length - 1) * SD + 3, 0.8);
      const k = Math.min(steps.length - 1, Math.floor(u / SD)); const f = (u - k * SD) / SD;
      const s = steps[k];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Bubble sort');
      const gap = Math.min(86, 720 / n); const bw = gap * 0.7; const bx = cx - (gap * (n - 1)) / 2; const base = Y0 + 540; const H = 330;
      const swapQ = s.sw ? smooth((f - 0.4) / 0.45) : 0;
      for (let i = 0; i < n; i++) {
        const v = s.a[i];
        let x = bx + i * gap; let lift = 0;
        if (s.sw && i === s.j) { x += gap * swapQ; lift = Math.sin(swapQ * Math.PI) * 34; } else if (s.sw && i === s.j + 1) x -= gap * swapQ;
        const cmp = !s.done && (i === s.j || i === s.j + 1);
        const sorted = s.done || i >= n - s.p;
        const c = cmp ? (s.sw ? 'orange' : 'yellow') : sorted ? 'green' : 'blue';
        const h = Math.max(8, (v / max) * H) * easeOut(clamp((t - i * 0.06) / 0.6));
        ctx.fillStyle = tint(c, cmp ? 0.45 : 0.25); ctx.strokeStyle = color(c); ctx.lineWidth = cmp ? 3 : 2;
        rounded(ctx, x - bw / 2, base - h - lift, bw, h, 8); ctx.fill(); ctx.stroke();
        label(ctx, String(v), x, base - h - lift - 20, { size: 22, weight: 700, fill: c });
      }
      line(ctx, bx - gap / 2 - 10, base + 2, bx + (n - 0.5) * gap + 10, base + 2, LINE, 3);
      if (!s.done) {
        const x1 = bx + s.j * gap; const x2 = x1 + gap; const c = s.sw ? 'orange' : 'yellow';
        ctx.strokeStyle = color(c); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x1, base + 16); ctx.lineTo(x1, base + 30); ctx.lineTo(x2, base + 30); ctx.lineTo(x2, base + 16); ctx.stroke();
        const A = s.a[s.j]; const B = s.a[s.j + 1];
        label(ctx, s.sw ? `${A} > ${B}, so swap them` : `${A} ≤ ${B}, leave them`, cx, base + 70, { size: 24, weight: 700, fill: c });
        chip(ctx, `Pass ${s.p + 1}`, X0 + 90, Y0 + 90, 'cyan');
        chip(ctx, `Comparison ${k + 1}`, X1 - 120, Y0 + 90, 'muted');
      } else {
        label(ctx, 'Sorted! Each pass bubbles the biggest to the end', cx, base + 70, { size: 23, weight: 700, fill: 'green' });
        chip(ctx, `${k} comparisons`, X1 - 120, Y0 + 90, 'green');
      }
      label(ctx, 'Compare neighbours; swap if the left one is bigger', cx, base + 118, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // A sorted row: look at the middle, throw away the half it cannot be in.
    'binary-search'(b, ctx, it, t) {
      const C = it._c || (it._c = (() => {
        const list = nums(it.items ?? it.values, [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91]).slice(0, 12).sort((p, q) => p - q);
        const target = val(it.target ?? it.value, 72);
        const steps = []; let lo = 0; let hi = list.length - 1;
        while (lo <= hi && steps.length < 8) {
          const mid = (lo + hi) >> 1; const v = list[mid]; const res = v === target ? 0 : v < target ? 1 : -1;
          steps.push({ lo, hi, mid, res });
          if (!res) break;
          if (res > 0) lo = mid + 1; else hi = mid - 1;
        }
        return { list, target, steps, found: steps.length > 0 && steps[steps.length - 1].res === 0 };
      })());
      const { list, target, steps, found } = C; const n = list.length;
      const SD = 2; const u = cycle(t, steps.length * SD + 2.5, 0.8);
      const k = Math.min(steps.length - 1, Math.floor(u / SD)); const f = u >= steps.length * SD ? 1 : clamp((u - k * SD) / SD);
      const s = steps[k];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Binary search');
      chip(ctx, `Find ${target}`, cx, Y0 + 92, 'cyan', 24);
      chip(ctx, `Step ${k + 1}`, X1 - 80, Y0 + 92, 'muted');
      const gap = Math.min(66, 760 / n); const bw = gap - 8; const x0 = cx - (gap * (n - 1)) / 2; const y = Y0 + 300;
      for (let i = 0; i < n; i++) {
        const x = x0 + i * gap;
        const gone = i < s.lo || i > s.hi || (f > 0.6 && s.res !== 0 && (s.res > 0 ? i <= s.mid : i >= s.mid));
        const isMid = i === s.mid && f > 0.1;
        const c = isMid ? (s.res === 0 ? 'green' : 'orange') : 'blue';
        ctx.save();
        ctx.globalAlpha *= (gone ? 0.22 : 1) * after(t, 0.1 + i * 0.04, 0.3);
        ctx.fillStyle = tint(c, isMid ? 0.45 : 0.18); ctx.strokeStyle = color(c); ctx.lineWidth = isMid ? 3.5 : 2;
        rounded(ctx, x - bw / 2, y - 34, bw, 68, 10); ctx.fill(); ctx.stroke();
        label(ctx, String(list[i]), x, y + 1, { size: bw < 50 ? 19 : 23, weight: 700, fill: 'ink' });
        label(ctx, String(i), x, y + 54, { size: 17, weight: 500, fill: 'muted' });
        ctx.restore();
      }
      const xm = x0 + s.mid * gap;
      if (f > 0.1) {
        arr(ctx, xm, y - 100, xm, y - 44, s.res === 0 ? 'green' : 'orange', 4);
        label(ctx, 'middle', xm, y - 116, { size: 19, weight: 700, fill: s.res === 0 ? 'green' : 'orange' });
      }
      // The range still in play, bracketed underneath.
      const xl = x0 + s.lo * gap - bw / 2; const xr = x0 + s.hi * gap + bw / 2;
      ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(xl, y + 76); ctx.lineTo(xl, y + 88); ctx.lineTo(xr, y + 88); ctx.lineTo(xr, y + 76); ctx.stroke();
      const narrow = xr - xl < 110;
      label(ctx, 'low', narrow ? xl - 6 : xl, y + 108, { size: 18, weight: 600, fill: 'cyan', align: narrow ? 'right' : 'left' });
      label(ctx, 'high', narrow ? xr + 6 : xr, y + 108, { size: 18, weight: 600, fill: 'cyan', align: narrow ? 'left' : 'right' });
      if (f > 0.3) {
        const v = list[s.mid];
        const text = s.res === 0 ? `${v} = ${target}: found at index ${s.mid}!` : s.res > 0 ? `${v} < ${target}: throw away the left half` : `${v} > ${target}: throw away the right half`;
        label(ctx, text, cx, Y0 + 480, { size: 24, weight: 700, fill: s.res === 0 ? 'green' : 'orange' });
      }
      if (k === steps.length - 1 && !found && f > 0.8) label(ctx, `${target} is not in the list`, cx, Y0 + 520, { size: 22, weight: 700, fill: 'red' });
      const sizes = steps.slice(0, k + 1).map((st) => st.hi - st.lo + 1);
      label(ctx, `Items left to check: ${sizes.join(' → ')}`, cx, Y0 + 560, { size: 21, weight: 600, fill: 'cyan' });
      label(ctx, 'Each check halves the list. It must be sorted first.', cx, Y0 + 620, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Eight switches with place values 128 to 1; the lit ones add up.
    'binary-numbers'(b, ctx, it, t) {
      const given = it.value !== undefined && it.value !== null && it.value !== '' && Number.isFinite(Number(it.value));
      const list = given ? [clamp(Math.round(Number(it.value)), 0, 255)] : [77, 5, 200, 255, 13];
      const P = 6.5; const tt = Math.max(0, t - 0.4); const n = list[Math.floor(tt / P) % list.length]; const u = tt % P;
      ctx.save(); fade(ctx, t);
      if (list.length > 1) ctx.globalAlpha *= clamp((P - u) / 0.35) * clamp(u / 0.2 + (tt < P ? 1 : 0));
      title(ctx, it.label || 'Binary: 8 bits make a byte');
      label(ctx, 'place values', cx, Y0 + 74, { size: 18, weight: 500, fill: 'muted' });
      const W = 92; const terms = []; let sum = 0;
      for (let i = 0; i < 8; i++) {
        const place = 128 >> i; const set = (n & place) !== 0;
        const fp = set ? smooth((u - (0.3 + i * 0.22)) / 0.2) : 0; const on = fp > 0.5;
        const x = cx + (i - 3.5) * W;
        if (on) { terms.push(place); sum += place; }
        label(ctx, String(place), x, Y0 + 112, { size: 24, weight: 700, fill: on ? 'cyan' : 'muted' });
        // Lamp
        if (on) { ctx.fillStyle = tint('yellow', 0.22); ctx.beginPath(); ctx.arc(x, Y0 + 190, 38, 0, TAU); ctx.fill(); }
        ctx.fillStyle = on ? COLORS.yellow : DARK; ctx.strokeStyle = on ? COLORS.yellow : 'rgba(147,160,196,0.6)'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(x, Y0 + 190, 24, 0, TAU); ctx.fill(); ctx.stroke();
        // Switch
        ctx.fillStyle = on ? tint('cyan', 0.35) : 'rgba(255,255,255,0.06)'; ctx.strokeStyle = on ? COLORS.cyan : 'rgba(147,160,196,0.6)'; ctx.lineWidth = 2;
        rounded(ctx, x - 22, Y0 + 250, 44, 86, 22); ctx.fill(); ctx.stroke();
        dot(ctx, x, lerp(Y0 + 314, Y0 + 272, fp), 17, on ? 'ink' : 'muted');
        label(ctx, on ? '1' : '0', x, Y0 + 392, { size: 44, weight: 800, fill: on ? 'yellow' : 'muted' });
      }
      const eq = `${terms.length ? terms.join(' + ') : '0'} = ${sum}`;
      label(ctx, eq, cx, Y0 + 480, { size: eq.length > 30 ? 25 : 30, weight: 700, fill: 'ink' });
      if (u > 2.1) {
        ctx.save(); ctx.globalAlpha *= after(u, 2.1);
        glow(ctx, COLORS.cyan, 16);
        label(ctx, `${n.toString(2).padStart(8, '0')} in binary = ${n} in denary`, cx, Y0 + 560, { size: 30, weight: 800, fill: 'cyan' });
        ctx.shadowBlur = 0; ctx.restore();
      }
      label(ctx, 'Each place is worth double the one to its right', cx, Y0 + 630, { size: 20, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // AND, OR and NOT with inputs stepping through 00, 01, 10, 11.
    'logic-gates'(b, ctx, it, t) {
      const row = Math.floor(cycle(t, 6.4, 0.8) / 1.6) % 4; const A = row >> 1; const B = row & 1;
      const pick = String(it.gate || '').toLowerCase().trim();
      const gates = [['AND', A & B], ['OR', A | B], ['NOT', 1 - A]];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Logic gates');
      const OFF = 'rgba(147,160,196,0.45)';
      gates.forEach(([name, out], g) => {
        const gy = Y0 + 150 + g * 175; const gx = X0 + 150; const w = 110; const h = 80;
        ctx.save();
        ctx.globalAlpha *= after(t, g * 0.25) * (pick && pick !== name.toLowerCase() ? 0.35 : 1);
        const ins = name === 'NOT' ? [[gy, A, 'A']] : [[gy - 22, A, 'A'], [gy + 22, B, 'B']];
        for (const [yy, v, nm] of ins) {
          line(ctx, X0 + 56, yy, gx + (name === 'OR' ? 16 : 0), yy, v ? 'yellow' : OFF, 4);
          ctx.fillStyle = v ? tint('yellow', 0.35) : DARK; ctx.strokeStyle = v ? COLORS.yellow : OFF; ctx.lineWidth = 2;
          rounded(ctx, X0 + 18, yy - 15, 38, 30, 8); ctx.fill(); ctx.stroke();
          label(ctx, String(v), X0 + 37, yy + 1, { size: 19, weight: 800, fill: v ? 'yellow' : 'muted' });
          label(ctx, nm, X0 + 84, yy - 15, { size: 18, weight: 700, fill: 'muted' });
        }
        ctx.beginPath();
        if (name === 'AND') { ctx.moveTo(gx, gy - h / 2); ctx.lineTo(gx + w / 2, gy - h / 2); ctx.arc(gx + w / 2, gy, h / 2, -Math.PI / 2, Math.PI / 2); ctx.lineTo(gx, gy + h / 2); ctx.closePath(); }
        else if (name === 'OR') { ctx.moveTo(gx, gy - h / 2); ctx.quadraticCurveTo(gx + w * 0.6, gy - h / 2, gx + w, gy); ctx.quadraticCurveTo(gx + w * 0.6, gy + h / 2, gx, gy + h / 2); ctx.quadraticCurveTo(gx + w * 0.3, gy, gx, gy - h / 2); ctx.closePath(); }
        else { ctx.moveTo(gx, gy - h / 2); ctx.lineTo(gx + w - 18, gy); ctx.lineTo(gx, gy + h / 2); ctx.closePath(); }
        ctx.fillStyle = tint('cyan', 0.14); ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 3; ctx.fill(); ctx.stroke();
        if (name === 'NOT') { ctx.beginPath(); ctx.arc(gx + w - 9, gy, 9, 0, TAU); ctx.fillStyle = DARK; ctx.fill(); ctx.stroke(); }
        label(ctx, name, gx + (name === 'NOT' ? 32 : 46), gy + 1, { size: 21, weight: 800, fill: 'ink' });
        line(ctx, gx + w, gy, X0 + 346, gy, out ? 'yellow' : OFF, 4);
        if (out) { ctx.fillStyle = tint('yellow', 0.25); ctx.beginPath(); ctx.arc(X0 + 370, gy, 34, 0, TAU); ctx.fill(); }
        ctx.fillStyle = out ? COLORS.yellow : DARK; ctx.strokeStyle = out ? COLORS.yellow : OFF; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(X0 + 370, gy, 24, 0, TAU); ctx.fill(); ctx.stroke();
        label(ctx, String(out), X0 + 370, gy + 1, { size: 22, weight: 800, fill: out ? DARK : 'muted' });
        ctx.restore();
      });
      // Truth table, the current row lit.
      const cols = [['A', 56], ['B', 56], ['AND', 80], ['OR', 80], ['NOT A', 92]];
      const tx = X0 + 425; const ty = Y0 + 150; const rh = 58;
      ctx.save(); ctx.globalAlpha *= after(t, 0.7);
      label(ctx, 'Truth table', tx + 182, Y0 + 100, { size: 22, weight: 700, fill: 'ink' });
      ctx.fillStyle = tint('yellow', 0.16); rounded(ctx, tx - 6, ty + rh * (row + 1) - rh / 2 + 2, 376, rh - 4, 10); ctx.fill();
      let x = tx;
      cols.forEach(([h, w], c) => {
        const lit = pick && h.toLowerCase().startsWith(pick);
        label(ctx, h, x + w / 2, ty, { size: 19, weight: 800, fill: lit ? 'yellow' : 'cyan' });
        for (let r = 0; r < 4; r++) {
          const a = r >> 1; const bb = r & 1; const v = [a, bb, a & bb, a | bb, 1 - a][c];
          label(ctx, String(v), x + w / 2, ty + rh * (r + 1), { size: 23, weight: 700, fill: r === row ? 'yellow' : 'ink' });
        }
        x += w;
      });
      line(ctx, tx - 6, ty + rh / 2, tx + 370, ty + rh / 2, FAINT, 2);
      ctx.restore();
      label(ctx, 'AND: both on · OR: either on · NOT: flips it', cx, Y0 + 645, { size: 20, weight: 600, fill: 'muted' });
      ctx.restore();
    },
    // The CPU fetching, decoding and executing a tiny program from memory.
    'fetch-execute'(b, ctx, it, t) {
      const PROG = ['LOAD 4', 'ADD 5', 'STORE 6', 'HALT', '7', '5', '0'];
      const IP = 5.2; const u = cycle(t, IP * 3 + 1, 0.8); const k = Math.min(2, Math.floor(u / IP)); const s = Math.min(IP, u - k * IP);
      const OPS = [4, 5, 6]; const DATA = ['7', '5', '12']; const ACC0 = [0, 7, 12]; const ACC1 = [7, 12, 12];
      const op = OPS[k];
      const regs = [
        ['PC', 'program counter', s >= 3.0 ? k + 1 : k],
        ['MAR', 'address register', s >= 4.0 ? op : s >= 0.8 ? k : k ? OPS[k - 1] : '–'],
        ['MDR', 'data register', s >= 4.5 ? DATA[k] : s >= 1.8 ? PROG[k] : k ? DATA[k - 1] : '–'],
        ['CIR', 'current instruction', s >= 2.8 ? PROG[k] : k ? PROG[k - 1] : '–'],
        ['ACC', 'accumulator', s >= 4.8 && k < 2 ? ACC1[k] : ACC0[k]],
      ];
      const regY = (i) => Y0 + 235 + i * 68; const memY = (i) => Y0 + 140 + i * 64;
      const ABx = X0 + 450; const DBx = X0 + 500; const RV = X0 + 318; const MR = X0 + 395; const ML = X0 + 552;
      const stage = s < 3.3 ? 0 : s < 4.0 ? 1 : 2;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Fetch, decode, execute');
      // CPU
      panel(ctx, X0 + 10, Y0 + 62, 400, 516, 'blue', 0.05);
      label(ctx, 'CPU', X0 + 30, Y0 + 88, { size: 22, weight: 800, fill: 'blue', align: 'left' });
      if (stage === 1) glow(ctx, COLORS.purple, 18);
      panel(ctx, X0 + 30, Y0 + 112, 175, 66, 'purple', stage === 1 ? 0.3 : 0.12, 12);
      ctx.shadowBlur = 0;
      label(ctx, 'Control unit', X0 + 117, Y0 + 145, { size: 19, weight: 700, fill: 'purple' });
      const aluOn = stage === 2 && k === 1 && s > 4.8;
      panel(ctx, X0 + 215, Y0 + 112, 175, 66, 'green', aluOn ? 0.3 : 0.12, 12);
      label(ctx, aluOn ? 'ALU: 7 + 5' : 'ALU', X0 + 302, Y0 + 145, { size: 19, weight: 700, fill: 'green' });
      regs.forEach(([name, desc, v], i) => {
        const y = regY(i);
        label(ctx, name, X0 + 40, y - 11, { size: 22, weight: 800, fill: 'cyan', align: 'left' });
        label(ctx, desc, X0 + 40, y + 15, { size: 18, weight: 500, fill: 'muted', align: 'left' });
        panel(ctx, X0 + 240, y - 24, 155, 48, 'cyan', 0.1, 10);
        label(ctx, String(v), RV, y + 1, { size: 22, weight: 700, fill: 'ink' });
      });
      // Memory
      panel(ctx, X0 + 540, Y0 + 62, 250, 516, 'orange', 0.05);
      label(ctx, 'Memory (RAM)', X0 + 665, Y0 + 92, { size: 21, weight: 800, fill: 'orange' });
      const hot = s >= 0.8 && s < 2.8 ? k : s >= 4.0 ? op : -1;
      PROG.forEach((cell, i) => {
        const y = memY(i);
        const v = i === 6 ? (k === 2 && s >= 5.1 ? '12' : '0') : cell;
        ctx.fillStyle = i === hot ? tint('yellow', 0.2) : 'rgba(255,255,255,0.04)'; ctx.strokeStyle = i === hot ? COLORS.yellow : FAINT; ctx.lineWidth = 1.5;
        rounded(ctx, X0 + 556, y - 25, 220, 50, 10); ctx.fill(); ctx.stroke();
        label(ctx, String(i), X0 + 586, y + 1, { size: 20, weight: 700, fill: 'muted' });
        label(ctx, v, X0 + 690, y + 1, { size: 22, weight: 700, fill: i < 4 ? 'ink' : 'orange' });
      });
      // Buses
      line(ctx, ABx, memY(0) - 12, ABx, memY(6) + 12, tint('cyan', 0.45), 3);
      line(ctx, DBx, memY(0) - 12, DBx, memY(6) + 12, tint('orange', 0.45), 3);
      line(ctx, MR, regY(1), ABx, regY(1), tint('cyan', 0.45), 3);
      line(ctx, MR, regY(2), DBx, regY(2), tint('orange', 0.45), 3);
      ctx.save(); ctx.translate(ABx - 14, Y0 + 470); ctx.rotate(-Math.PI / 2); label(ctx, 'address bus', 0, 0, { size: 17, weight: 600, fill: 'cyan' }); ctx.restore();
      ctx.save(); ctx.translate(DBx + 14, Y0 + 470); ctx.rotate(-Math.PI / 2); label(ctx, 'data bus', 0, 0, { size: 17, weight: 600, fill: 'orange' }); ctx.restore();
      // The token moving for this step.
      const g = (pts, q, text, c) => ({ p: mkPath(pts), q: smooth(q), text, c });
      let tok = null;
      if (s < 0.8) tok = g([RV, regY(0), RV, regY(1)], s / 0.8, String(k), 'cyan');
      else if (s < 1.8) tok = g([MR, regY(1), ABx, regY(1), ABx, memY(k), ML, memY(k)], s - 0.8, String(k), 'cyan');
      else if (s < 2.8) tok = g([ML, memY(k), DBx, memY(k), DBx, regY(2), MR, regY(2)], s - 1.8, PROG[k], 'orange');
      else if (s < 3.3) tok = g([RV, regY(2), RV, regY(3)], (s - 2.8) / 0.5, PROG[k], 'orange');
      else if (s >= 4.0 && s < 4.5) tok = g([MR, regY(1), ABx, regY(1), ABx, memY(op), ML, memY(op)], (s - 4.0) / 0.5, String(op), 'cyan');
      else if (k < 2 && s >= 4.5 && s < 4.8) tok = g([ML, memY(op), DBx, memY(op), DBx, regY(2), MR, regY(2)], (s - 4.5) / 0.3, DATA[k], 'orange');
      else if (k < 2 && s >= 4.8) tok = g([RV, regY(2), RV, regY(4)], (s - 4.8) / 0.4, k ? '+5' : '7', 'green');
      else if (k === 2 && s >= 4.5 && s < 4.8) tok = g([RV, regY(4), RV, regY(2)], (s - 4.5) / 0.3, '12', 'green');
      else if (k === 2 && s >= 4.8) tok = g([MR, regY(2), DBx, regY(2), DBx, memY(6), ML, memY(6)], (s - 4.8) / 0.3, '12', 'orange');
      if (tok) { const P = at(tok.p, tok.q * tok.p.total); glow(ctx, color(tok.c), 14); chip(ctx, tok.text, P.x, P.y, tok.c, 19); ctx.shadowBlur = 0; }
      // Stages
      ['Fetch', 'Decode', 'Execute'].forEach((name, i) => {
        const x = cx + (i - 1) * 220;
        if (i < 2) arr(ctx, x + 70, Y0 + 630, x + 150, Y0 + 630, 'muted', 3);
        if (i === stage) chip(ctx, name, x, Y0 + 630, ['cyan', 'purple', 'green'][i], 24);
        else label(ctx, name, x, Y0 + 630, { size: 22, weight: 600, fill: 'muted' });
      });
      const desc = s < 0.8 ? 'Fetch: copy the PC into the MAR' : s < 1.8 ? 'Fetch: the address goes to memory on the address bus' : s < 2.8 ? `Fetch: "${PROG[k]}" comes back on the data bus` : s < 3.3 ? 'Fetch: MDR to CIR, and the PC goes up by 1' : s < 4.0 ? `Decode: the control unit works out "${PROG[k]}"` : ['Execute: copy memory 4 (7) into the accumulator', 'Execute: the ALU adds memory 5: 7 + 5 = 12', 'Execute: store the accumulator (12) in memory 6'][k];
      label(ctx, desc, cx, Y0 + 680, { size: 20, weight: 600, fill: 'ink' });
      ctx.restore();
    },

    // A message split into numbered packets that take different routes.
    'network-packets'(b, ctx, it, t) {
      const N = { A: [X0 + 60, Y0 + 330], R1: [X0 + 220, Y0 + 190], R2: [X0 + 220, Y0 + 470], R3: [cx, Y0 + 120], R4: [cx, Y0 + 330], R5: [cx, Y0 + 540], R6: [X1 - 220, Y0 + 190], R7: [X1 - 220, Y0 + 470], B: [X1 - 60, Y0 + 330] };
      const LINKS = ['A-R1', 'A-R2', 'R1-R3', 'R1-R4', 'R2-R4', 'R2-R5', 'R3-R6', 'R4-R6', 'R4-R7', 'R5-R7', 'R6-B', 'R7-B', 'R3-R4', 'R4-R5'];
      const C = it._c || (it._c = (() => {
        const msg = String(it.message || it.value || 'HELLO WORLD').toUpperCase().slice(0, 16);
        const size = Math.ceil(msg.length / 4);
        const routes = [['A', 'R1', 'R3', 'R6', 'B'], ['A', 'R2', 'R5', 'R7', 'B'], ['A', 'R1', 'R4', 'R7', 'B'], ['A', 'R2', 'R4', 'R6', 'B']].map((r) => mkPath(r.flatMap((n) => N[n])));
        return { msg, parts: [0, 1, 2, 3].map((i) => msg.slice(i * size, (i + 1) * size)), routes };
      })());
      const starts = [0, 0.4, 0.8, 1.2]; const durs = [3.2, 2.4, 3.8, 2.6];
      const u = cycle(t, 7.5, 0.6);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Packet switching');
      ctx.strokeStyle = 'rgba(140,170,255,0.3)'; ctx.lineWidth = 3; ctx.beginPath();
      for (const l of LINKS) { const [p, q] = l.split('-'); ctx.moveTo(...N[p]); ctx.lineTo(...N[q]); }
      ctx.stroke();
      for (const r of ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7']) {
        const [x, y] = N[r];
        ctx.fillStyle = DARK; ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y, 26, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = tint('teal', 0.8); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x + 12, y); ctx.moveTo(x, y - 12); ctx.lineTo(x, y + 12); ctx.stroke();
      }
      label(ctx, 'router', N.R3[0] + 36, N.R3[1], { size: 19, weight: 600, fill: 'teal', align: 'left' });
      // Laptop A and server B.
      const [ax, ay] = N.A; const [bx2, by] = N.B;
      panel(ctx, ax - 36, ay - 34, 72, 50, 'cyan', 0.2, 6);
      ctx.fillStyle = COLORS.cyan; rounded(ctx, ax - 46, ay + 18, 92, 10, 4); ctx.fill();
      for (let i = 0; i < 3; i++) panel(ctx, bx2 - 32, by - 46 + i * 31, 64, 27, 'purple', 0.22, 6);
      label(ctx, 'Your computer', X0 + 8, ay + 100, { size: 19, weight: 600, fill: 'cyan', align: 'left' });
      label(ctx, 'Web server', X1 - 8, by - 70, { size: 19, weight: 600, fill: 'purple', align: 'right' });
      chip(ctx, C.msg, X0 + 8, Y0 + 200, 'ink', 20, 'left');
      let arrived = 0;
      C.parts.forEach((part, i) => {
        const q = clamp((u - starts[i]) / durs[i]);
        const c = HUES[i % HUES.length];
        if (q >= 1) {
          arrived++;
          const y = by + 110 + i * 38;
          ctx.fillStyle = tint(c, 0.3); ctx.strokeStyle = color(c); ctx.lineWidth = 2;
          rounded(ctx, bx2 - 50, y - 15, 100, 30, 8); ctx.fill(); ctx.stroke();
          label(ctx, `${i + 1}: ${part}`, bx2, y + 1, { size: 17, weight: 700, fill: 'ink' });
          return;
        }
        if (q <= 0) return;
        const P = at(C.routes[i], smooth(q) * C.routes[i].total);
        ctx.fillStyle = tint(c, 0.55); ctx.strokeStyle = color(c); ctx.lineWidth = 2.5;
        rounded(ctx, P.x - 18, P.y - 14, 36, 28, 7); ctx.fill(); ctx.stroke();
        label(ctx, String(i + 1), P.x, P.y + 1, { size: 19, weight: 800, fill: 'ink' });
      });
      if (arrived === 4) { glow(ctx, COLORS.green, 14); chip(ctx, C.msg, X1 - 8, Y0 + 215, 'green', 20, 'right'); ctx.shadowBlur = 0; }
      label(ctx, 'The message is split into numbered packets; each finds its own route', cx, Y0 + 625, { size: 19, weight: 600, fill: 'ink' });
      label(ctx, arrived === 4 ? 'All here: put back in order by number' : arrived ? 'Packets can arrive out of order' : 'Routers pass each packet along', cx, Y0 + 670, { size: 20, weight: 700, fill: arrived === 4 ? 'green' : 'muted' });
      ctx.restore();
    },

    // Start, input, a decision and two outputs, with a value travelling through.
    flowchart(b, ctx, it, t) {
      const vals = nums(it.items ?? it.values, [14, 6]); const lim = val(it.limit, 10);
      const RUN = 8.6; const tt = Math.max(0, t - 1); const v = vals[Math.floor(tt / RUN) % vals.length]; const u = tt % RUN; const yes = v > lim;
      const yS = Y0 + 82; const yI = Y0 + 195; const yD = Y0 + 335; const yO = Y0 + 480; const yE = Y0 + 615; const xo = 230;
      const sx = yes ? cx + xo : cx - xo;
      const keys = [[cx, yS, 0.5, 'start'], [cx, yI, 1.0, 'input'], [cx, yD, 1.1, 'dec'], [sx, yD, 0, ''], [sx, yO, 1.1, yes ? 'yes' : 'no'], [sx, yE, 0, ''], [cx + (yes ? 85 : -85), yE, 0.8, 'end']];
      // The value rests inside each shape (lit up), and is seen moving between them.
      let rem = u; let tx = cx; let ty = yS; let now = 'start'; let ta = 0;
      for (let i = 0; i < keys.length; i++) {
        const [x, y, dw, nm] = keys[i];
        if (nm) now = nm;
        if (rem < dw || i === keys.length - 1) break;
        rem -= dw;
        if (rem < 0.6) { const q = rem / 0.6; tx = lerp(x, keys[i + 1][0], q); ty = lerp(y, keys[i + 1][1], q); ta = clamp(Math.sin(Math.PI * q) * 2.2 - 1.2); break; }
        rem -= 0.6;
      }
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'A flowchart');
      const shape = (kind, x, y, text, c, i) => {
        ctx.save(); ctx.globalAlpha *= after(t, i * 0.15);
        const hl = (kind === 'oval' && ((i === 0 && now === 'start') || (i === 5 && now === 'end'))) || (i === 1 && now === 'input') || (i === 2 && now === 'dec') || (i === 3 && now === 'yes') || (i === 4 && now === 'no');
        ctx.fillStyle = tint(c, hl ? 0.32 : 0.12); ctx.strokeStyle = hl ? COLORS.yellow : color(c); ctx.lineWidth = hl ? 4 : 2.5;
        if (kind === 'oval') rounded(ctx, x - 85, y - 28, 170, 56, 28);
        else if (kind === 'para') poly(ctx, [x - 84, y - 30, x + 116, y - 30, x + 84, y + 30, x - 116, y + 30], true);
        else poly(ctx, [x, y - 72, x + 135, y, x, y + 72, x - 135, y], true);
        ctx.fill(); ctx.stroke();
        label(ctx, text, x, y + 1, { size: 20, weight: 700, fill: 'ink' });
        ctx.restore();
      };
      ctx.save(); ctx.globalAlpha *= after(t, 0.5, 0.6);
      arr(ctx, cx, yS + 28, cx, yI - 30, 'muted', 3);
      arr(ctx, cx, yI + 30, cx, yD - 72, 'muted', 3);
      for (const sgn of [1, -1]) {
        const ox = cx + sgn * xo;
        line(ctx, cx + sgn * 135, yD, ox, yD, 'rgba(147,160,196,1)', 3);
        arr(ctx, ox, yD, ox, yO - 30, 'muted', 3);
        line(ctx, ox, yO + 30, ox, yE, 'rgba(147,160,196,1)', 3);
        arr(ctx, ox, yE, cx + sgn * 85, yE, 'muted', 3);
      }
      label(ctx, 'Yes', cx + 182, yD - 18, { size: 20, weight: 800, fill: 'green' });
      label(ctx, 'No', cx - 182, yD - 18, { size: 20, weight: 800, fill: 'red' });
      label(ctx, 'start / end', cx - 100, yS, { size: 18, weight: 500, fill: 'muted', align: 'right' });
      label(ctx, 'input', cx - 128, yI, { size: 18, weight: 500, fill: 'muted', align: 'right' });
      label(ctx, 'decision', cx - 90, yD - 62, { size: 18, weight: 500, fill: 'muted', align: 'right' });
      ctx.restore();
      if (t > 1 && ta > 0) {
        ctx.save(); ctx.globalAlpha *= ta;
        glow(ctx, COLORS.orange, 14); dot(ctx, tx, ty, 19, 'orange'); ctx.shadowBlur = 0;
        label(ctx, String(v), tx, ty + 1, { size: 18, weight: 800, fill: DARK });
        ctx.restore();
      }
      shape('oval', cx, yS, 'Start', 'green', 0);
      shape('para', cx, yI, 'Input number', 'blue', 1);
      shape('diamond', cx, yD, `number > ${lim}?`, 'orange', 2);
      shape('para', cx + xo, yO, 'Output "Big"', 'blue', 3);
      shape('para', cx - xo, yO, 'Output "Small"', 'blue', 4);
      shape('oval', cx, yE, 'End', 'green', 5);
      const status = { start: 'Start', input: `Input: number = ${v}`, dec: `Is ${v} > ${lim}? ${yes ? 'Yes' : 'No'}`, yes: 'Output: Big', no: 'Output: Small', end: 'End' }[now];
      label(ctx, status, cx, Y0 + 685, { size: 24, weight: 700, fill: 'yellow' });
      ctx.restore();
    },

    // Code running line by line; named boxes in memory take their values.
    'variables-memory'(b, ctx, it, t) {
      const C = it._c || (it._c = (() => {
        const lines = strs(it.lines ?? it.items, ['x = 5', 'y = 3', 'x = x + y', 'y = x * 2', 'print(x, y)']).slice(0, 7);
        const env = {}; const order = []; const states = [];
        for (const L of lines) {
          const m = L.match(/^\s*([A-Za-z_]\w*)\s*=\s*([^=].*)$/); const pm = L.match(/^\s*print\s*\((.*)\)\s*$/);
          let ch = null; let expl = ''; let out = null;
          if (m) {
            const name = m[1];
            const sub = m[2].replace(/[A-Za-z_]\w*/g, (w) => (w in env ? show(env[w]) : w)).trim();
            const v = evalExpr(m[2], env);
            env[name] = v; if (!order.includes(name)) order.push(name);
            ch = name; expl = sub === show(v) ? `${name} gets ${show(v)}` : `${sub} = ${show(v)}, stored in ${name}`;
          } else if (pm) { out = pm[1].split(',').map((e) => { const r = evalExpr(e, env); return typeof r === 'number' ? show(r) : r; }).join(' '); expl = `print shows ${out}`; }
          states.push({ env: { ...env }, ch, expl, out });
        }
        return { lines, order: order.slice(0, 4), states };
      })());
      const { lines, order, states } = C;
      const SD = 1.6; const u = cycle(t, lines.length * SD + 2, 0.8);
      const k = Math.min(lines.length - 1, Math.floor(u / SD)); const f = u >= lines.length * SD ? 1 : (u - k * SD) / SD;
      const done = f > 0.45;
      const st = done ? states[k] : k ? states[k - 1] : { env: {}, out: null };
      let out = null; for (let i = 0; i <= (done ? k : k - 1); i++) if (states[i]?.out != null) out = states[i].out;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Variables: named boxes in memory');
      panel(ctx, X0 + 10, Y0 + 70, 400, 455, 'blue', 0.05);
      label(ctx, 'Code', X0 + 30, Y0 + 96, { size: 20, weight: 700, fill: 'blue', align: 'left' });
      lines.forEach((L, i) => {
        const y = Y0 + 140 + i * 56;
        if (i === k) { ctx.fillStyle = tint('yellow', 0.14); rounded(ctx, X0 + 22, y - 24, 376, 48, 10); ctx.fill(); }
        ctx.font = `600 ${L.length > 18 ? 22 : 26}px ${MONO}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillStyle = i === k ? COLORS.yellow : i < k ? COLORS.ink : COLORS.muted;
        ctx.fillText(L, X0 + 64, y);
        if (i === k) arr(ctx, X0 + 26, y, X0 + 54, y, 'yellow', 4);
      });
      label(ctx, 'Memory', X0 + 470, Y0 + 96, { size: 20, weight: 700, fill: 'purple', align: 'left' });
      order.forEach((name, j) => {
        const y = Y0 + 125 + j * 108; const has = name in st.env;
        const changed = done && states[k].ch === name;
        const pop = changed ? outBack(clamp((f - 0.45) / 0.25)) : 1;
        ctx.save();
        if (changed) glow(ctx, COLORS.purple, 16);
        panel(ctx, X0 + 460, y, 320, 88, 'purple', changed ? 0.26 : 0.1, 14);
        ctx.shadowBlur = 0;
        label(ctx, name.slice(0, 8), X0 + 480, y + 44, { size: name.length > 3 ? 22 : 30, weight: 800, fill: 'purple', align: 'left' });
        line(ctx, X0 + 600, y + 14, X0 + 600, y + 74, FAINT, 2);
        if (has) {
          const sv = show(st.env[name]); const txt = sv.length > 12 ? `${sv.slice(0, 11)}…` : sv;
          ctx.translate(X0 + 690, y + 44); ctx.scale(pop, pop);
          label(ctx, txt, 0, 0, { size: txt.length <= 5 ? 34 : txt.length <= 8 ? 27 : 21, weight: 800, fill: 'ink' });
        } else label(ctx, 'empty', X0 + 690, y + 44, { size: 20, weight: 500, fill: 'muted' });
        ctx.restore();
      });
      panel(ctx, X0 + 10, Y0 + 545, 400, 64, 'green', 0.08, 12);
      label(ctx, 'Output:', X0 + 30, Y0 + 577, { size: 20, weight: 700, fill: 'green', align: 'left' });
      if (out != null) label(ctx, String(out), X0 + 130, Y0 + 577, { size: 26, weight: 800, fill: 'ink', align: 'left' });
      if (done && states[k].expl) label(ctx, states[k].expl, cx, Y0 + 665, { size: 23, weight: 700, fill: 'yellow' });
      ctx.restore();
    },

    // A Caesar shift wheel: the inner ring turns, letters swap for letters.
    encryption(b, ctx, it, t) {
      const shift = mod(Math.round(val(it.shift ?? it.key, 3)), 26);
      const msg = String(it.message || it.value || 'HELLO').toUpperCase().replace(/[^A-Z ]/g, '').trim().slice(0, 12) || 'HELLO';
      const enc = (ch) => (ch === ' ' ? ' ' : String.fromCharCode(65 + ((ch.charCodeAt(0) - 65 + shift) % 26)));
      const R = 212; const r2 = 158; const wx = cx; const wy = Y0 + 300; const st = TAU / 26;
      const q = smooth((t - 0.4) / 1.4);
      const idx = t < 2.2 ? -1 : Math.floor((t - 2.2) / 1.1) % (msg.length + 2);
      const cur = idx >= 0 && idx < msg.length && msg[idx] !== ' ' ? msg.charCodeAt(idx) - 65 : -1;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || `Caesar cipher: shift ${shift}`);
      ctx.lineWidth = 50; ctx.strokeStyle = tint('blue', 0.16); ctx.beginPath(); ctx.arc(wx, wy, R, 0, TAU); ctx.stroke();
      ctx.lineWidth = 46; ctx.strokeStyle = tint('purple', 0.18); ctx.beginPath(); ctx.arc(wx, wy, r2, 0, TAU); ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = tint('blue', 0.6); ctx.beginPath(); ctx.arc(wx, wy, R + 25, 0, TAU); ctx.stroke();
      ctx.strokeStyle = tint('purple', 0.6); ctx.beginPath(); ctx.arc(wx, wy, r2 - 23, 0, TAU); ctx.stroke();
      if (cur >= 0) {
        const a = cur * st - Math.PI / 2;
        ctx.strokeStyle = tint('yellow', 0.8); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(wx + Math.cos(a) * (r2 - 30), wy + Math.sin(a) * (r2 - 30)); ctx.lineTo(wx + Math.cos(a) * (R + 30), wy + Math.sin(a) * (R + 30)); ctx.stroke();
        dot(ctx, wx + Math.cos(a) * R, wy + Math.sin(a) * R, 19, tint('yellow', 0.35));
        dot(ctx, wx + Math.cos(a) * r2, wy + Math.sin(a) * r2, 19, tint('yellow', 0.35));
      }
      for (let i = 0; i < 26; i++) {
        const a = i * st - Math.PI / 2;
        label(ctx, String.fromCharCode(65 + i), wx + Math.cos(a) * R, wy + Math.sin(a) * R, { size: 21, weight: 700, fill: i === cur ? 'yellow' : 'ink' });
        const b2 = (i - shift * q) * st - Math.PI / 2;
        const isCur = cur >= 0 && i === (cur + shift) % 26 && q >= 1;
        label(ctx, String.fromCharCode(65 + i), wx + Math.cos(b2) * r2, wy + Math.sin(b2) * r2, { size: 20, weight: 700, fill: isCur ? 'yellow' : 'purple' });
      }
      label(ctx, 'plain', wx, wy - 26, { size: 19, weight: 600, fill: 'blue' });
      label(ctx, `shift ${shift}`, wx, wy + 6, { size: 28, weight: 800, fill: 'ink' });
      label(ctx, 'secret', wx, wy + 38, { size: 19, weight: 600, fill: 'purple' });
      // The message, then its coded letters appearing one by one.
      const gap = 46; const mx = cx - ((msg.length - 1) * gap) / 2;
      label(ctx, 'plain', X0 + 20, Y0 + 585, { size: 20, weight: 600, fill: 'blue', align: 'left' });
      label(ctx, 'secret', X0 + 20, Y0 + 645, { size: 20, weight: 600, fill: 'purple', align: 'left' });
      for (let i = 0; i < msg.length; i++) {
        const x = mx + i * gap; const on = i === idx;
        label(ctx, msg[i], x, Y0 + 585, { size: 32, weight: 800, fill: on ? 'yellow' : 'ink' });
        if (idx >= i || idx < 0 && t > 2.2) label(ctx, enc(msg[i]), x, Y0 + 645, { size: 32, weight: 800, fill: on ? 'yellow' : 'purple' });
      }
      label(ctx, `To decrypt, shift back ${shift}`, cx, Y0 + 692, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },
    // ─── Biology ──────────────────────────────────────────────────────────

    // The heart's four chambers and the two loops: lungs above, body below.
    'heart-circulation'(b, ctx, it, t) {
      const k = b.clock; const xr = cx - 90; const xl = cx + 90;
      const C = it._c || (it._c = (() => {
        const pts = [cx, Y0 + 605, cx - 300, Y0 + 605, cx - 300, Y0 + 290, xr, Y0 + 290, xr, Y0 + 405, cx, Y0 + 405, cx, Y0 + 215, cx - 170, Y0 + 215, cx - 170, Y0 + 130, cx, Y0 + 130, cx + 170, Y0 + 130, cx + 170, Y0 + 215, cx + 250, Y0 + 215, cx + 250, Y0 + 290, xl, Y0 + 290, xl, Y0 + 405, cx + 300, Y0 + 405, cx + 300, Y0 + 605, cx, Y0 + 605];
        const p = mkPath(pts); return { p, dL: p.cum[9] };
      })());
      const NAMES = ['body: oxygen is given to the cells', 'vena cava: back to the heart', 'vena cava into the right atrium', 'right atrium → right ventricle', 'right ventricle → pulmonary artery', 'pulmonary artery → lungs', 'pulmonary artery → lungs', 'pulmonary artery → lungs', 'lungs: oxygen in, carbon dioxide out', 'lungs: oxygen in, carbon dioxide out', 'pulmonary vein → heart', 'pulmonary vein → heart', 'pulmonary vein → heart', 'into the left atrium', 'left atrium → left ventricle', 'left ventricle → aorta', 'aorta → body', 'body: oxygen is given to the cells'];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The heart and double circulation');
      for (const sx of [-1, 1]) { ctx.fillStyle = tint('red', 0.1); ctx.strokeStyle = tint('red', 0.55); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx + sx * 170, Y0 + 130, 112, 58, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
      label(ctx, 'Lungs', cx, Y0 + 96, { size: 22, weight: 700, fill: 'ink' });
      panel(ctx, cx - 250, Y0 + 560, 500, 86, 'orange', 0.08, 18);
      label(ctx, 'Body organs and muscles', cx, Y0 + 580, { size: 19, weight: 600, fill: 'orange' });
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 14;
      ctx.strokeStyle = tint('blue', 0.35); strokeSpan(ctx, C.p, 0, C.dL);
      ctx.strokeStyle = tint('red', 0.35); strokeSpan(ctx, C.p, C.dL, C.p.total);
      // Chambers squeeze on each beat.
      const ph = mod(k, 0.9) / 0.9; const sq = ph < 0.18 ? Math.sin((ph / 0.18) * Math.PI) : 0;
      const CH = [[xr, Y0 + 250, 80, 'blue', 'right atrium'], [xr, Y0 + 340, 130, 'blue', 'right ventricle'], [xl, Y0 + 250, 80, 'red', 'left atrium'], [xl, Y0 + 340, 130, 'red', 'left ventricle']];
      ctx.save(); ctx.translate(cx, Y0 + 360); ctx.scale(1 - 0.04 * sq, 1 - 0.04 * sq); ctx.translate(-cx, -(Y0 + 360));
      glow(ctx, color('red'), 10 + 14 * sq);
      for (const [x, y, h, c] of CH) { ctx.fillStyle = tint(c, 0.26); ctx.strokeStyle = color(c); ctx.lineWidth = 3; rounded(ctx, x - 78, y, 156, h, 16); ctx.fill(); ctx.stroke(); }
      ctx.shadowBlur = 0;
      ctx.restore();
      for (const [x, y, h, , name] of CH) label(ctx, name, x, y + (h === 80 ? 20 : h - 22), { size: 18, weight: 700, fill: 'ink' });
      if (t > 0.5) {
        for (let i = 0; i < 34; i++) {
          const d = mod((i / 34) * C.p.total + k * 70, C.p.total); const P = at(C.p, d);
          ctx.fillStyle = d < C.dL ? COLORS.blue : COLORS.red; ctx.beginPath(); ctx.arc(P.x, P.y, 6, 0, TAU); ctx.fill();
        }
        const T = at(C.p, mod(k * 70, C.p.total));
        dot(ctx, T.x, T.y, 10, 'ink', 16);
        chip(ctx, NAMES[Math.min(NAMES.length - 1, T.i)], cx, Y0 + 515, T.i >= 9 && T.i < 17 ? 'red' : 'blue', 20);
      }
      dot(ctx, cx - 250, Y0 + 682, 8, 'blue'); label(ctx, 'oxygen-poor blood', cx - 234, Y0 + 682, { size: 19, weight: 600, fill: 'blue', align: 'left' });
      dot(ctx, cx + 50, Y0 + 682, 8, 'red'); label(ctx, 'oxygen-rich blood', cx + 66, Y0 + 682, { size: 19, weight: 600, fill: 'red', align: 'left' });
      ctx.restore();
    },

    // A leaf taking in light, carbon dioxide and water; giving out oxygen.
    photosynthesis(b, ctx, it, t) {
      const k = b.clock; const lx = cx + 60; const ly = Y0 + 300; const rot = -0.3;
      const cr = Math.cos(rot); const sr = Math.sin(rot);
      const W = (x, y) => [lx + x * cr - y * sr, ly + x * sr + y * cr];
      const CO2P = [[-11, 0, 6, 'purple'], [0, 0, 7, 'muted'], [11, 0, 6, 'purple']];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Photosynthesis');
      const sxp = X0 + 75; const syp = Y0 + 95;
      ctx.strokeStyle = tint('yellow', 0.7); ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + k * 0.3; ctx.moveTo(sxp + Math.cos(a) * 50, syp + Math.sin(a) * 50); ctx.lineTo(sxp + Math.cos(a) * 64, syp + Math.sin(a) * 64); }
      ctx.stroke();
      dot(ctx, sxp, syp, 40, 'yellow', 26);
      ctx.setLineDash([14, 12]); ctx.lineDashOffset = -k * 50; ctx.strokeStyle = tint('yellow', 0.8); ctx.lineWidth = 4; ctx.beginPath();
      for (const [x, y] of [W(-150, -40), W(-30, -70), W(90, -60)]) { ctx.moveTo(sxp + 40, syp + 30); ctx.lineTo(x, y); }
      ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
      // Stem with water climbing it.
      const base = W(-260, 0); const sb = [base[0] - 50, Y0 + 565];
      ctx.strokeStyle = tint('green', 0.8); ctx.lineWidth = 10; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(sb[0], sb[1]); ctx.quadraticCurveTo(sb[0] - 10, (sb[1] + base[1]) / 2, base[0], base[1]); ctx.stroke();
      // The leaf.
      ctx.save(); ctx.translate(lx, ly); ctx.rotate(rot);
      const lg = ctx.createLinearGradient(0, -130, 0, 130); lg.addColorStop(0, 'rgba(52,211,153,0.45)'); lg.addColorStop(1, 'rgba(16,120,80,0.35)');
      ctx.beginPath(); ctx.moveTo(-260, 0); ctx.quadraticCurveTo(-40, -190, 260, 0); ctx.quadraticCurveTo(-40, 190, -260, 0); ctx.closePath();
      ctx.fillStyle = lg; ctx.fill(); glow(ctx, COLORS.green, 14); ctx.strokeStyle = COLORS.green; ctx.lineWidth = 3; ctx.stroke(); ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(200,255,220,0.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-260, 0); ctx.lineTo(240, 0);
      for (let i = -3; i <= 3; i++) { if (!i) continue; const x = i * 62; const h = 72 - Math.abs(x) * 0.17; ctx.moveTo(x - 24, 0); ctx.lineTo(x + 26, -h); ctx.moveTo(x - 24, 0); ctx.lineTo(x + 26, h); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(52,211,153,0.8)';
      for (let i = 0; i < 12; i++) { const x = -190 + 380 * rnd(i + 3); let y = (rnd(i + 40) - 0.5) * 130 * (1 - Math.abs(x) / 290); if (Math.abs(x) < 60 && Math.abs(y) < 50) y += y < 0 ? -40 : 40; ctx.beginPath(); ctx.ellipse(x, y, 10, 6, 0.4, 0, TAU); ctx.fill(); }
      ctx.restore();
      if (t > 0.8) {
        ctx.save(); ctx.globalAlpha *= after(t, 0.8, 0.6);
        for (let i = 0; i < 5; i++) {
          const q = mod(i / 5 + k * 0.25, 1); const a = Math.sin(q * Math.PI);
          ctx.fillStyle = tint('blue', 0.9 * a); ctx.beginPath(); ctx.arc(lerp(sb[0], base[0], q), lerp(sb[1], base[1], q), 7, 0, TAU); ctx.fill();
        }
        const c0 = [X0 + 25, Y0 + 330]; const c1 = W(-170, 30);
        for (let i = 0; i < 5; i++) { const q = mod(i / 5 + k * 0.2, 1); mol(ctx, lerp(c0[0], c1[0], q), lerp(c0[1], c1[1], q), CO2P, Math.sin(q * Math.PI)); }
        const o0 = W(120, -70); const o1 = [X1 - 40, Y0 + 90];
        for (let i = 0; i < 5; i++) { const q = mod(i / 5 + k * 0.2, 1); mol(ctx, lerp(o0[0], o1[0], q), lerp(o0[1], o1[1], q), O2, Math.sin(q * Math.PI)); }
        const pulse = 1 + 0.06 * Math.sin(k * 3);
        ctx.fillStyle = tint('orange', 0.3); ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 3;
        hexagon(ctx, lx, ly, 30 * pulse); ctx.fill(); ctx.stroke();
        label(ctx, 'glucose', lx, ly + 52, { size: 20, weight: 700, fill: 'orange' });
        label(ctx, 'light energy', sxp, syp + 80, { size: 20, weight: 700, fill: 'yellow' });
        label(ctx, 'carbon dioxide in', X0 + 15, Y0 + 298, { size: 19, weight: 700, fill: 'purple', align: 'left' });
        label(ctx, 'water (from the roots)', sb[0], sb[1] + 26, { size: 19, weight: 700, fill: 'blue' });
        label(ctx, 'oxygen out', X1 - 15, Y0 + 150, { size: 20, weight: 700, fill: 'cyan', align: 'right' });
        ctx.restore();
      }
      if (t > 1.6) {
        ctx.save(); ctx.globalAlpha *= after(t, 1.6, 0.5);
        label(ctx, 'carbon dioxide + water → glucose + oxygen', cx, Y0 + 648, { size: 25, weight: 800, fill: 'ink' });
        label(ctx, 'powered by light energy, trapped by chlorophyll', cx, Y0 + 686, { size: 19, weight: 500, fill: 'muted' });
        ctx.restore();
      }
      ctx.restore();
    },

    // Glucose and oxygen into a mitochondrion; carbon dioxide, water and energy out.
    respiration(b, ctx, it, t) {
      const an = /anaer/i.test(String(it.kind || it.value || '')); const k = b.clock;
      const mx = cx; const my = Y0 + 290; const rx = mx; const ry = an ? Y0 + 460 : my;
      const stream = (x0, y0, x1, y1, n, sp, draw) => { for (let i = 0; i < n; i++) { const q = mod(i / n + k * sp, 1); draw(lerp(x0, x1, q), lerp(y0, y1, q), Math.sin(q * Math.PI)); } };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || (an ? 'Anaerobic respiration' : 'Aerobic respiration'));
      ctx.fillStyle = tint('red', 0.05); ctx.strokeStyle = tint('red', 0.55); ctx.lineWidth = 3; rounded(ctx, X0 + 130, Y0 + 75, 540, 440, 110); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.globalAlpha *= an ? 0.35 : 1;
      ctx.fillStyle = tint('orange', 0.2); glow(ctx, COLORS.orange, an ? 0 : 16);
      ctx.beginPath(); ctx.ellipse(mx, my, 165, 82, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 3; ctx.stroke(); ctx.shadowBlur = 0;
      ctx.strokeStyle = tint('orange', 0.7); ctx.lineWidth = 2.5; ctx.beginPath();
      for (let x = -138; x <= 138; x += 6) { const y = Math.sin(x / 13) * 50 * Math.sqrt(Math.max(0, 1 - (x / 150) ** 2)); if (x === -138) ctx.moveTo(mx + x, my + y); else ctx.lineTo(mx + x, my + y); }
      ctx.stroke();
      ctx.restore();
      label(ctx, an ? 'Mitochondrion (not used)' : 'Mitochondrion', mx, my + 106, { size: 20, weight: 700, fill: 'orange' });
      // Energy released where the reaction happens.
      const nr = an ? 4 : 10;
      ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 4; ctx.lineCap = 'round';
      const ga = ctx.globalAlpha;
      for (let i = 0; i < nr; i++) {
        const a = (i / nr) * TAU + 0.3; if (!an && Math.abs(Math.sin(a)) > 0.55) continue;
        const q = mod(k * 0.8 + i * 0.37, 1); const r0 = an ? 20 : 170; const L = (an ? 30 : 40) * q; const sy = an ? 1 : 0.5;
        ctx.globalAlpha = ga * (1 - q); ctx.beginPath(); ctx.moveTo(rx + Math.cos(a) * (r0 + L * 0.3), ry + Math.sin(a) * (r0 + L * 0.3) * sy); ctx.lineTo(rx + Math.cos(a) * (r0 + L), ry + Math.sin(a) * (r0 + L) * sy); ctx.stroke();
      }
      ctx.globalAlpha = ga;
      const hexd = (x, y, a) => { ctx.fillStyle = tint('yellow', 0.8 * a); hexagon(ctx, x, y, 11); ctx.fill(); };
      stream(X0 + 20, Y0 + 240, rx - 120, ry - 25, 4, 0.22, hexd);
      if (!an) {
        stream(X0 + 20, Y0 + 340, rx - 120, ry + 25, 4, 0.22, (x, y, a) => mol(ctx, x, y, O2, a));
        stream(rx + 120, ry - 25, X1 - 20, Y0 + 240, 4, 0.22, (x, y, a) => mol(ctx, x, y, [[-11, 0, 6, 'purple'], [0, 0, 7, 'muted'], [11, 0, 6, 'purple']], a));
        stream(rx + 120, ry + 25, X1 - 20, Y0 + 340, 4, 0.22, (x, y, a) => mol(ctx, x, y, H2O, a));
        label(ctx, 'Energy', rx, my - 112, { size: 24, weight: 800, fill: 'yellow' });
        label(ctx, '(for moving, keeping warm, growing)', rx, Y0 + 146, { size: 18, weight: 500, fill: 'muted' });
        label(ctx, 'Oxygen', X0 + 20, Y0 + 378, { size: 21, weight: 700, fill: 'cyan', align: 'left' });
        label(ctx, 'Carbon dioxide', X1 - 20, Y0 + 205, { size: 21, weight: 700, fill: 'purple', align: 'right' });
        label(ctx, 'Water', X1 - 20, Y0 + 378, { size: 21, weight: 700, fill: 'blue', align: 'right' });
      } else {
        stream(rx + 60, ry, X1 - 20, Y0 + 460, 4, 0.22, (x, y, a) => mol(ctx, x, y, [[-10, 0, 7, 'teal'], [0, -4, 7, 'teal'], [10, 0, 7, 'teal']], a));
        label(ctx, 'a little energy', rx - 60, ry, { size: 20, weight: 700, fill: 'yellow', align: 'right' });
        label(ctx, 'Lactic acid', X1 - 20, Y0 + 492, { size: 21, weight: 700, fill: 'teal', align: 'right' });
      }
      label(ctx, 'Glucose', X0 + 20, Y0 + 205, { size: 21, weight: 700, fill: 'yellow', align: 'left' });
      label(ctx, an ? 'glucose → lactic acid (+ a little energy)' : 'glucose + oxygen → carbon dioxide + water (+ energy)', cx, Y0 + 580, { size: 24, weight: 800, fill: 'ink' });
      label(ctx, an ? 'In muscles, when there is not enough oxygen' : 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O', cx, Y0 + 626, { size: 21, weight: 600, fill: 'muted' });
      label(ctx, an ? 'Much less energy; the oxygen debt is repaid later' : 'It happens all the time, in every living cell', cx, Y0 + 672, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Who eats whom: arrows from food to eater, with energy flowing along them.
    'food-web'(b, ctx, it, t) {
      const k = b.clock;
      const LV = ['green', 'cyan', 'orange', 'red'];
      const NODES = { grass: ['Grass', '🌱', 0, 250, 510], oak: ['Oak tree', '🌳', 0, 580, 510], rabbit: ['Rabbit', '🐇', 1, 130, 360], mouse: ['Mouse', '🐭', 1, 400, 350], cat: ['Caterpillar', '🐛', 1, 660, 370], tit: ['Blue tit', '🐦', 2, 680, 210], fox: ['Fox', '🦊', 2, 150, 200], owl: ['Owl', '🦉', 3, 430, 100] };
      const EDGES = [['grass', 'rabbit'], ['grass', 'mouse'], ['oak', 'mouse'], ['oak', 'cat'], ['cat', 'tit'], ['rabbit', 'fox'], ['mouse', 'fox'], ['mouse', 'owl'], ['tit', 'owl']];
      const HW = 68; const HH = 45;
      const pos = (id) => [X0 + NODES[id][3], Y0 + NODES[id][4]];
      const edgeOf = (p, q) => { const dx = q[0] - p[0]; const dy = q[1] - p[1]; const s0 = Math.min((HW + 4) / Math.abs(dx || 1e-6), (HH + 4) / Math.abs(dy || 1e-6)); const s1 = Math.min((HW + 8) / Math.abs(dx || 1e-6), (HH + 8) / Math.abs(dy || 1e-6)); return [p[0] + dx * s0, p[1] + dy * s0, q[0] - dx * s1, q[1] - dy * s1]; };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'A food web');
      EDGES.forEach(([f, e], i) => {
        const a = after(t, 1.3 + i * 0.1); if (a <= 0) return;
        const [x0, y0, x1, y1] = edgeOf(pos(f), pos(e));
        ctx.save(); ctx.globalAlpha *= a;
        arr(ctx, x0, y0, x1, y1, tint('yellow', 0.6), 3);
        const q = mod(k * 0.45 + i * 0.37, 1);
        dot(ctx, lerp(x0, x1, q), lerp(y0, y1, q), 5, 'yellow');
        ctx.restore();
      });
      for (const id of Object.keys(NODES)) {
        const [name, icon, lv] = NODES[id]; const [x, y] = pos(id);
        const a = after(t, lv * 0.3, 0.45); if (a <= 0) continue;
        ctx.save(); ctx.globalAlpha *= a;
        panel(ctx, x - HW, y - HH, HW * 2, HH * 2, LV[lv], 0.16, 14);
        label(ctx, icon, x, y - 11, { size: 34, weight: 400, fill: 'ink' });
        label(ctx, name, x, y + 27, { size: 18, weight: 700, fill: LV[lv] });
        ctx.restore();
      }
      label(ctx, 'Arrows show energy flowing from the food to the eater', cx, Y0 + 600, { size: 20, weight: 600, fill: 'ink' });
      const legend = [['Producers', 0], ['Primary consumers', 1], ['Secondary consumers', 2], ['Top predator', 3]];
      ctx.font = `600 18px ${FONT}`;
      const widths = legend.map(([n]) => ctx.measureText(n).width + 36);
      let lx = cx - widths.reduce((s, w) => s + w, 0) / 2;
      legend.forEach(([n, lv], i) => { dot(ctx, lx + 9, Y0 + 650, 8, LV[lv]); label(ctx, n, lx + 24, Y0 + 650, { size: 18, weight: 600, fill: LV[lv], align: 'left' }); lx += widths[i]; });
      ctx.restore();
    },

    // A turning double helix, and the same strands unzipped as a ladder.
    dna(b, ctx, it, t) {
      const seq = (String(it.sequence || it.value || '').toUpperCase().replace(/[^ATCG]/g, '') || 'ATGCGTACCTAG').slice(0, 12);
      const PAIR = { A: 'T', T: 'A', C: 'G', G: 'C' }; const BC = { A: 'red', T: 'yellow', C: 'green', G: 'blue' };
      const k = b.clock; const hy = Y0 + 215; const AMP = 82; const x0 = X0 + 50; const x1 = X1 - 50; const w = (TAU * 1.8) / (x1 - x0);
      const xe = x0 + (x1 - x0) * clamp(t / 1.2);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'DNA: the double helix');
      const strand = (sgn, front) => {
        ctx.beginPath(); let pen = false;
        for (let i = 0; i <= 90; i++) {
          const x = x0 + ((x1 - x0) * i) / 90; if (x > xe) break;
          const ph = (x - x0) * w + k * 1.2; const z = sgn * Math.cos(ph); const y = hy + sgn * AMP * Math.sin(ph);
          if ((z >= 0) === front) { if (pen) ctx.lineTo(x, y); else { ctx.moveTo(x, y); pen = true; } } else pen = false;
        }
        ctx.stroke();
      };
      ctx.lineCap = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = tint('cyan', 0.3); strand(1, false); strand(-1, false);
      for (let i = 0; i < 18; i++) {
        const x = x0 + 20 + i * ((x1 - x0 - 40) / 17); if (x > xe) break;
        const ph = (x - x0) * w + k * 1.2; const y1 = hy + AMP * Math.sin(ph); const y2 = hy - AMP * Math.sin(ph); const ym = (y1 + y2) / 2;
        const B1 = seq[i % seq.length];
        line(ctx, x, y1, x, ym, BC[B1], 6); line(ctx, x, ym, x, y2, BC[PAIR[B1]], 6);
      }
      ctx.lineWidth = 7; ctx.strokeStyle = COLORS.cyan; glow(ctx, COLORS.cyan, 10); strand(1, true); strand(-1, true); ctx.shadowBlur = 0;
      label(ctx, 'sugar–phosphate backbone', x0, hy - AMP - 34, { size: 19, weight: 700, fill: 'cyan', align: 'left' });
      label(ctx, 'base pairs (the rungs)', x1, hy - AMP - 34, { size: 19, weight: 700, fill: 'ink', align: 'right' });
      label(ctx, 'Two strands twist round each other, joined by pairs of bases', cx, Y0 + 345, { size: 19, weight: 500, fill: 'muted' });
      // The ladder, unzipped.
      const gap = 56; const lx0 = cx - ((seq.length - 1) * gap) / 2; const yt = Y0 + 410; const yb = Y0 + 570; const ym = (yt + yb) / 2;
      line(ctx, lx0 - 30, yt, lx0 + (seq.length - 1) * gap + 30, yt, 'cyan', 5);
      line(ctx, lx0 - 30, yb, lx0 + (seq.length - 1) * gap + 30, yb, 'cyan', 5);
      const hi = Math.floor(k / 1.2) % seq.length;
      for (let i = 0; i < seq.length; i++) {
        const e = after(t, 0.8 + i * 0.08, 0.3); if (e <= 0) continue;
        ctx.save(); ctx.globalAlpha *= e;
        const x = lx0 + i * gap; const B1 = seq[i]; const B2 = PAIR[B1];
        ctx.fillStyle = tint(BC[B1], 0.35); ctx.strokeStyle = color(BC[B1]); ctx.lineWidth = 2;
        rounded(ctx, x - 20, yt + 4, 40, ym - yt - 6, 6); ctx.fill(); ctx.stroke();
        label(ctx, B1, x, (yt + ym) / 2 + 1, { size: 24, weight: 800, fill: 'ink' });
        ctx.fillStyle = tint(BC[B2], 0.35); ctx.strokeStyle = color(BC[B2]);
        rounded(ctx, x - 20, ym + 2, 40, yb - ym - 6, 6); ctx.fill(); ctx.stroke();
        label(ctx, B2, x, (ym + yb) / 2 + 1, { size: 24, weight: 800, fill: 'ink' });
        if (i === hi) { ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2.5; rounded(ctx, x - 26, yt - 8, 52, yb - yt + 16, 10); ctx.stroke(); }
        ctx.restore();
      }
      chip(ctx, 'A pairs with T', cx - 150, Y0 + 632, 'red', 21);
      chip(ctx, 'C pairs with G', cx + 150, Y0 + 632, 'green', 21);
      label(ctx, 'The order of the bases is the code for making proteins', cx, Y0 + 684, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // One cell becoming two, stage by stage.
    mitosis(b, ctx, it, t) {
      const STAGES = [['Interphase', 'The cell grows and copies its DNA'], ['Prophase', 'Chromosomes coil up; the nucleus breaks down'], ['Metaphase', 'Chromosomes line up across the middle'], ['Anaphase', 'Spindle fibres pull the copies apart'], ['Telophase', 'A new nucleus forms at each end'], ['Cytokinesis', 'The cell splits: two identical cells']];
      const p = cycle(t, 13.2, 0.6) / 2.2; const si = Math.min(5, Math.floor(p)); const f = smooth(p - si);
      const ox = cx; const oy = Y0 + 290; const r = 150;
      const s = si < 3 ? 0 : si === 3 ? 0.12 * r * f : si === 4 ? r * (0.12 + 0.3 * f) : r * (0.42 + 0.63 * f);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Mitosis: one cell becomes two');
      ctx.save();
      let ga = 1; if (p > 5.8) ga = clamp((6 - p) / 0.2); else if (t > 1.5 && p < 0.15) ga = p / 0.15;
      ctx.globalAlpha *= ga;
      // Cell outline: two circles that pinch apart.
      ctx.beginPath();
      if (s >= r) { ctx.arc(ox - s, oy, r, 0, TAU); ctx.moveTo(ox + s + r, oy); ctx.arc(ox + s, oy, r, 0, TAU); }
      else { const al = Math.acos(s / r); ctx.arc(ox - s, oy, r, al, TAU - al); ctx.arc(ox + s, oy, r, Math.PI + al, 3 * Math.PI - al); ctx.closePath(); }
      ctx.fillStyle = tint('teal', 0.1); ctx.fill(); ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 4; glow(ctx, COLORS.teal, 12); ctx.stroke(); ctx.shadowBlur = 0;
      // Old nucleus and loose chromatin.
      const na = si === 0 ? 1 : si === 1 ? 1 - f : 0;
      if (na > 0) {
        ctx.save(); ctx.globalAlpha *= na;
        ctx.fillStyle = tint('purple', 0.14); ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 3; if (si === 1) ctx.setLineDash([8, 7]);
        ctx.beginPath(); ctx.arc(ox, oy, r * 0.45, 0, TAU); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = tint('blue', 0.7); ctx.lineWidth = 2.5;
        for (let c = 0; c < 4; c++) { ctx.beginPath(); for (let j = 0; j <= 16; j++) { const x = ox - 40 + j * 5; const y = oy - 36 + c * 24 + Math.sin(j * 1.3 + c * 2 + b.clock) * 6; if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); }
        ctx.restore();
      }
      // Spindle fibres from the poles.
      const sa = si === 2 ? f : si === 3 ? 1 : si === 4 ? 1 - f : 0;
      const CHR = [[26, 'blue', -40, -30, -66], [26, 'orange', 35, -40, -22], [16, 'blue', -30, 40, 22], [16, 'orange', 45, 25, 66]];
      const pts = CHR.map(([len, col, sx, sy, my]) => {
        const bx = si <= 1 ? sx : si === 2 ? lerp(sx, 0, f) : 0;
        const by = si <= 1 ? sy : si === 2 ? lerp(sy, my, f) : my * (si === 3 ? 1 : si === 4 ? 1 - 0.45 * f : 0.55);
        const gap = si <= 2 ? 3 : si === 3 ? lerp(3, 0.5 * r, f) : s + 0.35 * r;
        const arm = si <= 2 ? 10 : si === 3 ? lerp(10, -14, f) : -14;
        return { len, col, bx, by, gap, arm };
      });
      if (sa > 0) {
        ctx.save(); ctx.globalAlpha *= sa * 0.8; ctx.strokeStyle = 'rgba(200,215,255,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath();
        for (const sg of [-1, 1]) { const px = ox + sg * (s + 0.88 * r); for (const c of pts) { ctx.moveTo(px, oy); ctx.lineTo(ox + c.bx + sg * c.gap, oy + c.by); } }
        ctx.stroke();
        dot(ctx, ox - (s + 0.88 * r), oy, 6, 'yellow'); dot(ctx, ox + (s + 0.88 * r), oy, 6, 'yellow');
        if (si === 2 || si === 3) label(ctx, 'spindle fibres', ox, oy - r - 26, { size: 19, weight: 600, fill: 'muted' });
        ctx.restore();
      }
      // New nuclei.
      const nn = si === 4 ? f : si === 5 ? 1 : 0;
      if (nn > 0) {
        ctx.save(); ctx.globalAlpha *= nn; ctx.fillStyle = tint('purple', 0.14); ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 3;
        for (const sg of [-1, 1]) { ctx.beginPath(); ctx.arc(ox + sg * (s + 0.35 * r), oy, 0.32 * r, 0, TAU); ctx.fill(); ctx.stroke(); }
        ctx.restore();
      }
      // Chromosomes: two chromatids each, pulled apart in anaphase.
      const ca = si === 0 ? 0 : si === 1 ? f : si === 5 ? 1 - 0.5 * f : 1;
      if (ca > 0) {
        ctx.save(); ctx.globalAlpha *= ca; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (const c of pts) for (const sg of [-1, 1]) {
          const x = ox + c.bx + sg * c.gap; const y = oy + c.by;
          ctx.strokeStyle = color(c.col); ctx.beginPath(); ctx.moveTo(x + sg * c.arm, y - c.len); ctx.lineTo(x, y); ctx.lineTo(x + sg * c.arm, y + c.len); ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();
      // Stage name, what happens, and where we are.
      chip(ctx, STAGES[si][0], cx, Y0 + 490, 'teal', 26);
      label(ctx, STAGES[si][1], cx, Y0 + 540, { size: 21, weight: 600, fill: 'ink' });
      STAGES.forEach(([name], i) => {
        const x = cx + (i - 2.5) * 132;
        label(ctx, name, x, Y0 + 600, { size: 18, weight: i === si ? 800 : 500, fill: i === si ? 'teal' : 'muted' });
        ctx.fillStyle = i === si ? COLORS.teal : i < si ? tint('teal', 0.45) : 'rgba(140,170,255,0.18)';
        rounded(ctx, x - 58, Y0 + 620, 116, 8, 4); ctx.fill();
      });
      label(ctx, 'Two cells with the same chromosomes as the first', cx, Y0 + 672, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Food travelling from mouth to anus, each organ named as it passes.
    'digestive-system'(b, ctx, it, t) {
      const bx = X0 + 250;
      const C = it._c || (it._c = (() => {
        const pts = [bx, Y0 + 112, bx, Y0 + 150, bx, Y0 + 255, bx + 20, Y0 + 278, bx + 70, Y0 + 288, bx + 100, Y0 + 312, bx + 92, Y0 + 345, bx + 52, Y0 + 360, bx + 12, Y0 + 352, bx - 12, Y0 + 372, bx - 20, Y0 + 418, bx - 95, Y0 + 430, bx + 95, Y0 + 430, bx + 95, Y0 + 462, bx - 95, Y0 + 462, bx - 95, Y0 + 494, bx + 95, Y0 + 494, bx + 95, Y0 + 526, bx - 95, Y0 + 526, bx - 150, Y0 + 545, bx - 150, Y0 + 398, bx + 160, Y0 + 398, bx + 160, Y0 + 560, bx + 40, Y0 + 585, bx + 15, Y0 + 615];
        const org = [0, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5];
        const p = mkPath(pts); const sp = [35, 130, 45, 200, 150, 60]; const T = [0];
        for (let i = 0; i < org.length; i++) T.push(T[i] + (p.cum[i + 1] - p.cum[i]) / sp[org[i]]);
        return { p, org, T, total: T[T.length - 1] };
      })());
      const { p } = C;
      const tt = cycle(t, C.total + 1.2, 0.8); let seg = C.org.length - 1; let d = p.total;
      if (tt < C.total) { seg = 0; while (seg < C.org.length - 1 && C.T[seg + 1] <= tt) seg++; d = p.cum[seg] + (p.cum[seg + 1] - p.cum[seg]) * ((tt - C.T[seg]) / (C.T[seg + 1] - C.T[seg])); }
      const organ = C.org[seg];
      const ORG = [['Mouth', 'red', bx + 14, Y0 + 110, Y0 + 108, 'Mouth: teeth chew; saliva starts to break down starch'], ['Oesophagus', 'red', bx + 10, Y0 + 200, Y0 + 195, 'Oesophagus: muscles squeeze the food down (peristalsis)'], ['Stomach', 'purple', bx + 112, Y0 + 312, Y0 + 300, 'Stomach: acid kills germs; enzymes start digesting protein'], ['Small intestine', 'yellow', bx + 100, Y0 + 478, Y0 + 495, 'Small intestine: digestion finishes; nutrients pass into the blood'], ['Large intestine', 'orange', bx + 172, Y0 + 450, Y0 + 405, 'Large intestine: water is absorbed back into the body'], ['Rectum and anus', 'orange', bx + 28, Y0 + 605, Y0 + 590, 'Rectum: waste is stored, then leaves through the anus']];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The digestive system');
      ctx.strokeStyle = FAINT; ctx.lineWidth = 2;
      rounded(ctx, bx - 200, Y0 + 128, 400, 525, 130); ctx.stroke();
      ctx.beginPath(); ctx.arc(bx, Y0 + 68, 44, 0, TAU); ctx.stroke();
      ctx.fillStyle = tint('teal', 0.22); ctx.strokeStyle = tint('teal', 0.8); ctx.beginPath(); ctx.ellipse(bx - 82, Y0 + 300, 86, 44, -0.25, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const tube = (d0, d1, w, c, a) => { ctx.lineWidth = w; ctx.strokeStyle = tint(c, a); strokeSpan(ctx, p, d0, d1); };
      tube(p.cum[18], p.cum[22], 26, 'orange', 0.35); tube(p.cum[22], p.total, 18, 'orange', 0.35);
      tube(p.cum[0], p.cum[2], 16, 'red', 0.45); tube(p.cum[2], p.cum[8], 46, 'purple', 0.35); tube(p.cum[8], p.cum[18], 14, 'yellow', 0.42);
      const span = [[0, 1], [1, 2], [2, 8], [8, 18], [18, 22], [22, 24]][organ];
      ctx.lineWidth = 3; ctx.strokeStyle = color(ORG[organ][1]); strokeSpan(ctx, p, p.cum[span[0]], p.cum[span[1]]);
      if (t > 0.8) { const P = at(p, d); dot(ctx, P.x, P.y, 11, '#d6a46b', 14); }
      const LX = X0 + 470;
      ORG.forEach(([name, c, px, py, ly], i) => {
        const on = i === organ;
        ctx.save(); ctx.globalAlpha *= after(t, 0.3 + i * 0.15) * (on ? 1 : 0.75);
        line(ctx, px, py, LX - 10, ly, tint(c, 0.6), 1.5);
        dot(ctx, px, py, 4, c);
        label(ctx, name, LX, ly, { size: on ? 23 : 20, weight: on ? 800 : 600, fill: c, align: 'left' });
        ctx.restore();
      });
      line(ctx, X0 + 74, Y0 + 238, bx - 120, Y0 + 284, tint('teal', 0.6), 1.5);
      label(ctx, 'Liver', X0 + 18, Y0 + 228, { size: 20, weight: 600, fill: 'teal', align: 'left' });
      wrapLabel(ctx, ORG[organ][5], X0 + 20, Y0 + 676, FIG.w - 40, 21, 'center', 'ink', 600);
      ctx.restore();
    },

    // Breathing in and out, with the alveolus close up.
    lungs(b, ctx, it, t) {
      const k = b.clock; const ph = mod(k, 5) / 5; const br = (1 - Math.cos(ph * TAU)) / 2; const inhale = ph < 0.5;
      const tx = X0 + 230; const dome = 70 - 45 * br; const dy0 = Y0 + 505;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Breathing and gas exchange');
      ctx.strokeStyle = tint('muted', 0.35); ctx.lineWidth = 6; ctx.lineCap = 'round';
      for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) {
        const y = Y0 + 236 + i * 56 - 8 * br;
        ctx.beginPath(); ctx.moveTo(tx + sd * 24, y); ctx.quadraticCurveTo(tx + sd * (150 + 10 * br), y - 12, tx + sd * (200 + 12 * br), y + 44 - 14 * br); ctx.stroke();
      }
      for (const sd of [-1, 1]) {
        ctx.fillStyle = tint('red', 0.24); ctx.strokeStyle = COLORS.red; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(tx + sd * 98, Y0 + 330 + 8 * br, 78 + 9 * br, 118 + 10 * br, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = tint('cyan', 0.45); ctx.lineWidth = 3; ctx.beginPath();
        const bx = tx + sd * 75; const by = Y0 + 262;
        for (const [ex, ey] of [[sd * 40, 55], [sd * 10, 100], [sd * 62, 110], [sd * 28, 130]]) { ctx.moveTo(bx, by); ctx.lineTo(bx + ex, by + ey); }
        ctx.stroke();
      }
      ctx.fillStyle = tint('cyan', 0.18); ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 2.5; rounded(ctx, tx - 15, Y0 + 90, 30, 125, 8); ctx.fill(); ctx.stroke();
      ctx.beginPath(); for (let y = Y0 + 104; y < Y0 + 210; y += 18) { ctx.moveTo(tx - 13, y); ctx.lineTo(tx + 13, y); } ctx.stroke();
      ctx.strokeStyle = tint('cyan', 0.5); ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(tx - 75, Y0 + 262); ctx.lineTo(tx, Y0 + 212); ctx.lineTo(tx + 75, Y0 + 262); ctx.stroke();
      ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 9; glow(ctx, COLORS.orange, 12);
      ctx.beginPath(); ctx.moveTo(X0 + 30, dy0); ctx.quadraticCurveTo(tx, dy0 - 2 * dome, X0 + 430, dy0); ctx.stroke(); ctx.shadowBlur = 0;
      const flow = Math.abs(Math.sin(ph * TAU));
      ctx.save(); ctx.globalAlpha *= 0.3 + 0.7 * flow;
      if (inhale) arr(ctx, tx - 52, Y0 + 80, tx - 52, Y0 + 160, 'cyan', 5); else arr(ctx, tx - 52, Y0 + 160, tx - 52, Y0 + 80, 'orange', 5);
      ctx.restore();
      label(ctx, 'Trachea', tx + 28, Y0 + 120, { size: 20, weight: 700, fill: 'cyan', align: 'left' });
      label(ctx, 'Lungs', tx - 98, Y0 + 418, { size: 22, weight: 700, fill: 'ink' });
      label(ctx, 'Diaphragm', tx, dy0 + 30, { size: 20, weight: 700, fill: 'orange' });
      // Close-up of one alveolus.
      const ix = X0 + 640; const iy = Y0 + 330; const ir = 125; const ax = ix - 25; const ay = iy - 15;
      ctx.setLineDash([6, 8]); ctx.strokeStyle = 'rgba(200,215,255,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(tx + 165, Y0 + 300); ctx.lineTo(ix - ir * 0.72, iy - ir * 0.7); ctx.moveTo(tx + 165, Y0 + 300); ctx.lineTo(ix - ir * 0.72, iy + ir * 0.7); ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); ctx.beginPath(); ctx.arc(ix, iy, ir, 0, TAU); ctx.clip();
      ctx.fillStyle = 'rgba(7,11,29,0.9)'; ctx.fillRect(ix - ir, iy - ir, ir * 2, ir * 2);
      ctx.lineWidth = 30; ctx.strokeStyle = tint('red', 0.4); ctx.beginPath(); ctx.arc(ax, ay, 92, -0.4, 2.6); ctx.stroke();
      ctx.fillStyle = tint('cyan', 0.12); ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ax, ay, 62, 0, TAU); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 6; i++) { const a = -0.4 + 3 * mod(i / 6 + k * 0.15, 1); dot(ctx, ax + Math.cos(a) * 92, ay + Math.sin(a) * 92, 7, 'red'); }
      for (let i = 0; i < 6; i++) { const a = -0.2 + i * 0.45; const q = mod(i * 0.37 + k * 0.45, 1); dot(ctx, ax + Math.cos(a) * (30 + 62 * q), ay + Math.sin(a) * (30 + 62 * q), 5, 'cyan'); }
      for (let i = 0; i < 5; i++) { const a = 0.05 + i * 0.5; const q = mod(i * 0.29 + k * 0.4, 1); dot(ctx, ax + Math.cos(a) * (92 - 62 * q), ay + Math.sin(a) * (92 - 62 * q), 5, 'purple'); }
      ctx.restore();
      ctx.strokeStyle = 'rgba(220,230,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ix, iy, ir, 0, TAU); ctx.stroke();
      label(ctx, 'Alveolus (air sac)', ix, iy - ir - 22, { size: 20, weight: 700, fill: 'ink' });
      label(ctx, 'oxygen into the blood', ix, iy + ir + 26, { size: 19, weight: 700, fill: 'cyan' });
      label(ctx, 'carbon dioxide out of it', ix, iy + ir + 54, { size: 19, weight: 700, fill: 'purple' });
      chip(ctx, inhale ? 'Breathing in' : 'Breathing out', cx, Y0 + 592, inhale ? 'cyan' : 'orange', 24);
      wrapLabel(ctx, inhale ? 'The diaphragm contracts and flattens; the ribs move up and out; air rushes in' : 'The diaphragm relaxes and domes up; the ribs move down and in; air is pushed out', X0 + 20, Y0 + 650, FIG.w - 40, 20, 'center', 'ink', 500);
      ctx.restore();
    },

    // An impulse running along a nerve cell, then across the synapse.
    neuron(b, ctx, it, t) {
      const k = b.clock; const y = Y0 + 300; const bx = X0 + 130; const ax0 = bx + 58; const ax1 = X0 + 590; const tx = X0 + 630; const nx = X0 + 700;
      const u = mod(k, 3.4) / 3.4; const ix = lerp(ax0, ax1, clamp(u / 0.6));
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'A nerve cell (neuron)');
      ctx.strokeStyle = tint('purple', 0.8); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath();
      [-2.5, -2.0, -1.4, 1.5, 2.1, 2.7].forEach((a, i) => {
        const L = 85 + 20 * rnd(i); const ex = bx + Math.cos(a) * L; const ey = y + Math.sin(a) * L;
        ctx.moveTo(bx + Math.cos(a) * 50, y + Math.sin(a) * 50); ctx.lineTo(ex, ey);
        for (const s of [-0.5, 0.5]) { ctx.moveTo(ex, ey); ctx.lineTo(ex + Math.cos(a + s) * 30, ey + Math.sin(a + s) * 30); }
      });
      ctx.stroke();
      line(ctx, ax0, y, ax1, y, tint('purple', 0.6), 10);
      const segW = (ax1 - ax0 - 20) / 5;
      for (let i = 0; i < 5; i++) { ctx.fillStyle = tint('yellow', 0.28); ctx.strokeStyle = tint('yellow', 0.8); ctx.lineWidth = 2; rounded(ctx, ax0 + 10 + i * segW + 6, y - 15, segW - 12, 30, 14); ctx.fill(); ctx.stroke(); }
      const knobs = [[tx, y - 45], [tx + 12, y], [tx, y + 45]];
      const term = u > 0.58 && u < 0.75;
      ctx.strokeStyle = tint('purple', 0.8); ctx.lineWidth = 5; ctx.beginPath();
      for (const [kx, ky] of knobs) { ctx.moveTo(ax1, y); ctx.quadraticCurveTo(ax1 + 20, ky, kx - 10, ky); }
      ctx.stroke();
      for (const [kx, ky] of knobs) dot(ctx, kx, ky, 11, term ? 'cyan' : tint('purple', 0.6));
      const fire = u > 0.88;
      if (fire) glow(ctx, COLORS.teal, 16);
      ctx.fillStyle = tint('teal', fire ? 0.4 : 0.18); ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 3;
      rounded(ctx, nx, y - 70, 30, 140, 15); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      line(ctx, nx + 30, y, X1 - 12, y - 30, tint('teal', 0.8), 5);
      line(ctx, nx + 30, y + 30, X1 - 30, y + 70, tint('teal', 0.8), 4);
      glow(ctx, COLORS.purple, 16);
      ctx.fillStyle = tint('purple', 0.3); ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(bx, y, 58, 0, TAU); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      dot(ctx, bx, y, 18, tint('purple', 0.7));
      if (u < 0.6) {
        ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 12; glow(ctx, COLORS.cyan, 18);
        ctx.beginPath(); ctx.moveTo(Math.max(ax0, ix - 30), y); ctx.lineTo(Math.min(ax1, ix + 30), y); ctx.stroke(); ctx.shadowBlur = 0;
        dot(ctx, ix, y, 8, 'ink');
      }
      if (u > 0.68 && u < 0.92) {
        const s = (u - 0.68) / 0.24;
        for (let i = 0; i < 9; i++) { const [kx, ky] = knobs[i % 3]; dot(ctx, lerp(kx + 12, nx - 3, s), ky + (rnd(i) - 0.5) * 34 * s, 4, 'green'); }
      }
      label(ctx, 'Dendrites', X0 + 14, Y0 + 150, { size: 20, weight: 700, fill: 'purple', align: 'left' });
      label(ctx, 'Cell body', bx + 76, y + 70, { size: 20, weight: 700, fill: 'purple', align: 'left' });
      label(ctx, 'Axon', (ax0 + ax1) / 2 + 60, y + 52, { size: 20, weight: 700, fill: 'purple' });
      label(ctx, 'Myelin sheath', (ax0 + ax1) / 2, y - 52, { size: 20, weight: 700, fill: 'yellow' });
      label(ctx, 'Axon terminals', tx, y - 96, { size: 19, weight: 700, fill: 'purple' });
      line(ctx, tx + 36, y + 84, tx + 36, y + 16, tint('green', 0.7), 1.5);
      label(ctx, 'Synapse', tx + 36, y + 100, { size: 19, weight: 700, fill: 'green' });
      const stage = u < 0.6 ? ['An electrical impulse travels along the axon', 'cyan'] : u < 0.88 ? ['Chemicals carry the signal across the synapse', 'green'] : ['The next neuron is triggered', 'teal'];
      chip(ctx, stage[0], cx, Y0 + 500, stage[1], 22);
      label(ctx, 'Myelin insulates the axon, so the impulse travels faster', cx, Y0 + 570, { size: 19, weight: 500, fill: 'muted' });
      label(ctx, 'Impulses can travel at over 100 metres per second', cx, Y0 + 615, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Lock and key: a substrate fits the active site and is split.
    enzymes(b, ctx, it, t) {
      const den = it.denatured === true || /denat|hot/i.test(String(it.kind || it.value || ''));
      const ecx = cx + 120; const ecy = Y0 + 300; const R = 170; const ex = ecx - Math.sqrt(R * R - 50 * 50);
      const notch = den ? [ex, ecy - 50, ex + 40, ecy - 64, ex + 72, ecy - 12, ex + 86, ecy + 30, ex + 40, ecy + 50, ex, ecy + 50] : [ex, ecy - 50, ex + 60, ecy - 50, ex + 100, ecy, ex + 60, ecy + 50, ex, ecy + 50];
      const u = cycle(t, 6.6, 0.6); const k = b.clock;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || (den ? 'A denatured enzyme' : 'Enzymes: lock and key'));
      const a0 = Math.atan2(-50, ex - ecx); const a1 = Math.atan2(50, ex - ecx);
      ctx.beginPath(); ctx.moveTo(ex, ecy - 50); ctx.arc(ecx, ecy, R, a0, a1);
      for (let i = notch.length - 2; i >= 0; i -= 2) ctx.lineTo(notch[i], notch[i + 1]);
      ctx.closePath();
      ctx.fillStyle = tint('blue', 0.24); ctx.fill(); glow(ctx, COLORS.blue, 16); ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 3; ctx.stroke(); ctx.shadowBlur = 0;
      label(ctx, 'Enzyme', ecx + 60, ecy + 4, { size: 26, weight: 800, fill: 'blue' });
      line(ctx, X0 + 336, Y0 + 160, ex + 22, ecy - 52, tint('cyan', 0.7), 1.5);
      label(ctx, den ? 'Active site: changed shape' : 'Active site', X0 + 330, Y0 + 150, { size: 19, weight: 700, fill: 'cyan', align: 'right' });
      // Where the substrate is.
      let dx = 0; let dy = 0; let rt = 0; let split = 0; let alpha = 1; let msg; let mc = 'orange';
      if (den) {
        if (u < 1.6) { const q = smooth(u / 1.6); dx = lerp(-250, -40, q); dy = 40 * (1 - q); rt = 0.5 * (1 - q); msg = 'Too hot: the active site has changed shape'; mc = 'red'; }
        else if (u < 3.2) { const q = smooth((u - 1.6) / 1.6); dx = -40 - 210 * q; dy = -60 * q; rt = -0.4 * q; msg = 'The substrate no longer fits: the enzyme is denatured'; mc = 'red'; }
        else { dx = -250; dy = -60; rt = -0.4; alpha = clamp((4.2 - u) / 1); msg = 'It cannot work again'; mc = 'red'; }
      } else if (u < 1.6) { const q = smooth(u / 1.6); dx = -250 * (1 - q); dy = 40 * (1 - q); rt = 0.5 * (1 - q); msg = 'The substrate moves to the active site'; }
      else if (u < 3.0) { dx = Math.sin(k * 40) * 1.5; msg = 'It fits: an enzyme–substrate complex'; mc = 'yellow'; }
      else if (u < 4.6) { split = smooth((u - 3.0) / 1.6); alpha = clamp((4.6 - u) / 0.4); msg = 'The substrate is broken down into products'; mc = 'green'; }
      else { alpha = 0; msg = 'The enzyme is unchanged, ready to work again'; mc = 'blue'; }
      if (alpha > 0) {
        const top = [ex - 70, ecy - 50, ex + 60, ecy - 50, ex + 100, ecy, ex - 70, ecy]; const bot = [ex - 70, ecy, ex + 100, ecy, ex + 60, ecy + 50, ex - 70, ecy + 50];
        const pcx = ex + 15; const pcy = ecy;
        [[top, -1], [bot, 1]].forEach(([pts, sg]) => {
          ctx.save(); ctx.globalAlpha *= alpha;
          ctx.translate(pcx + dx - 230 * split, pcy + dy + sg * 150 * split); ctx.rotate(rt + sg * 0.5 * split); ctx.translate(-pcx, -pcy);
          const c = split > 0 ? (sg < 0 ? 'yellow' : 'orange') : 'orange';
          ctx.fillStyle = tint(c, 0.4); ctx.strokeStyle = color(c); ctx.lineWidth = 3; ctx.lineJoin = 'round';
          poly(ctx, pts, true); ctx.fill(); ctx.stroke();
          ctx.restore();
        });
        if (split < 0.3) label(ctx, 'Substrate', ex + 15 + dx - 20, ecy + dy + 82, { size: 20, weight: 700, fill: 'orange' });
        else label(ctx, 'Products', ex + 15 - 230 * split, ecy, { size: 20, weight: 700, fill: 'green' });
      }
      chip(ctx, msg, cx, Y0 + 525, mc, 21);
      label(ctx, 'Lock and key: only a substrate of the right shape fits', cx, Y0 + 595, { size: 20, weight: 600, fill: 'muted' });
      label(ctx, 'Enzymes are biological catalysts: they speed up reactions', cx, Y0 + 640, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },
    // ─── Chemistry ────────────────────────────────────────────────────────

    // A metal atom hands its outer electrons to a non-metal: two ions attract.
    'ionic-bonding'(b, ctx, it, t) {
      const mg = /mgo|magnesium/i.test(String(it.compound || it.value || ''));
      const M = mg ? { s: 'Mg', name: 'magnesium', sh: [2, 8, 2], ion: 'Mg²⁺', ch: '2+' } : { s: 'Na', name: 'sodium', sh: [2, 8, 1], ion: 'Na⁺', ch: '+' };
      const N = mg ? { s: 'O', name: 'oxygen', sh: [2, 6], ion: 'O²⁻', ch: '2−' } : { s: 'Cl', name: 'chlorine', sh: [2, 8, 7], ion: 'Cl⁻', ch: '−' };
      const n = mg ? 2 : 1; const k = b.clock;
      const u = cycle(t, 9.5, 0.4); const tq = smooth((u - 1.3) / 1.5); const iq = smooth((u - 3.0) / 0.9);
      const R = [42, 76, 110]; const ay = Y0 + 285;
      const mx = X0 + 210 + 40 * iq; const nx = X1 - 210 - 40 * iq;
      const cross = (x, y, s = 7) => { ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s); ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.stroke(); };
      const shell = (x, rr) => { ctx.strokeStyle = 'rgba(200,215,255,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, ay, rr, 0, TAU); ctx.stroke(); };
      const nucleus = (x, s, c) => { ctx.fillStyle = tint(c, 0.35); ctx.strokeStyle = color(c); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, ay, 26, 0, TAU); ctx.fill(); ctx.stroke(); label(ctx, s, x, ay + 1, { size: 22, weight: 800, fill: 'ink' }); };
      ctx.save(); fade(ctx, t);
      if (u > 9) ctx.globalAlpha *= clamp((9.5 - u) / 0.5);
      title(ctx, it.label || 'Ionic bonding');
      const mOut = M.sh.length - 1; const nOut = N.sh.length - 1;
      M.sh.forEach((cnt, si) => {
        const a = si === mOut ? 1 - iq : 1; if (a <= 0) return;
        ctx.save(); ctx.globalAlpha *= a; shell(mx, R[si]);
        if (si < mOut) for (let j = 0; j < cnt; j++) { const g = (j / cnt) * TAU + k * 0.5 * (si % 2 ? -1 : 1); cross(mx + Math.cos(g) * R[si], ay + Math.sin(g) * R[si]); }
        ctx.restore();
      });
      const gaps = n === 1 ? [4] : [3, 4]; const slot = (j) => Math.PI + (j - 3.5) * (TAU / 8);
      N.sh.forEach((cnt, si) => {
        shell(nx, R[si]);
        if (si < nOut) for (let j = 0; j < cnt; j++) { const g = (j / cnt) * TAU + k * 0.5 * (si % 2 ? 1 : -1); dot(ctx, nx + Math.cos(g) * R[si], ay + Math.sin(g) * R[si], 6, 'cyan'); }
        else for (let j = 0; j < 8; j++) if (!gaps.includes(j)) dot(ctx, nx + Math.cos(slot(j)) * R[si], ay + Math.sin(slot(j)) * R[si], 6, 'cyan');
      });
      nucleus(mx, M.s, 'orange'); nucleus(nx, N.s, 'cyan');
      // The electrons that move.
      for (let j = 0; j < n; j++) {
        const g0 = (j - (n - 1) / 2) * 0.5;
        const sx = mx + Math.cos(g0) * R[mOut]; const sy = ay + Math.sin(g0) * R[mOut];
        const ex = nx + Math.cos(slot(gaps[j])) * R[nOut]; const ey = ay + Math.sin(slot(gaps[j])) * R[nOut];
        const x = lerp(sx, ex, tq); const y = lerp(sy, ey, tq) - 70 * Math.sin(Math.PI * tq);
        if (tq > 0 && tq < 1) { glow(ctx, COLORS.orange, 14); cross(x, y, 8); ctx.shadowBlur = 0; } else cross(x, y);
      }
      // Ions: brackets and charges.
      if (iq > 0) {
        ctx.save(); ctx.globalAlpha *= iq;
        const bracket = (x, hs, ch) => {
          ctx.strokeStyle = 'rgba(220,230,255,0.8)'; ctx.lineWidth = 3; ctx.beginPath();
          ctx.moveTo(x - hs + 12, ay - hs); ctx.lineTo(x - hs, ay - hs); ctx.lineTo(x - hs, ay + hs); ctx.lineTo(x - hs + 12, ay + hs);
          ctx.moveTo(x + hs - 12, ay - hs); ctx.lineTo(x + hs, ay - hs); ctx.lineTo(x + hs, ay + hs); ctx.lineTo(x + hs - 12, ay + hs); ctx.stroke();
          label(ctx, ch, x + hs + 6, ay - hs + 4, { size: 26, weight: 800, fill: 'yellow', align: 'left' });
        };
        bracket(mx, R[mOut - 1] + 16, M.ch); bracket(nx, R[nOut] + 16, N.ch);
        if (iq > 0.6) {
          const pulse = 4 * Math.sin(k * 5);
          const l = mx + R[mOut - 1] + 24; const r = nx - R[nOut] - 24;
          arr(ctx, (l + r) / 2 - 4 - pulse, ay, l, ay, 'yellow', 3); arr(ctx, (l + r) / 2 + 4 + pulse, ay, r, ay, 'yellow', 3);
        }
        ctx.restore();
      }
      const lab = (x, a1, a2) => { if (iq < 1) { ctx.save(); ctx.globalAlpha *= 1 - iq; label(ctx, a1, x, Y0 + 445, { size: 21, weight: 700, fill: 'ink' }); ctx.restore(); } if (iq > 0) { ctx.save(); ctx.globalAlpha *= iq; label(ctx, a2, x, Y0 + 445, { size: 21, weight: 700, fill: 'yellow' }); ctx.restore(); } };
      lab(mx, `${M.name} atom: ${M.sh.join(',')}`, `${M.ion} ion: ${M.sh.slice(0, -1).join(',')}`);
      lab(nx, `${N.name} atom: ${N.sh.join(',')}`, `${N.ion} ion: ${[...N.sh.slice(0, -1), 8].join(',')}`);
      const es = n > 1 ? 'electrons' : 'electron';
      const msg = u < 1.3 ? [`${M.name} has ${n} outer ${es}; ${N.name} needs ${n} more`, 'ink'] : u < 3.0 ? [`${M.name} gives ${n} ${es} to ${N.name}`, 'orange'] : ['Opposite charges attract: an ionic bond', 'yellow'];
      chip(ctx, msg[0], cx, Y0 + 525, msg[1], 21);
      if (iq > 0) { ctx.save(); ctx.globalAlpha *= iq; label(ctx, mg ? 'Magnesium oxide, MgO' : 'Sodium chloride, NaCl', cx, Y0 + 595, { size: 26, weight: 800, fill: 'green' }); ctx.restore(); }
      cross(cx - 250, Y0 + 660); label(ctx, `${M.name}'s electrons`, cx - 232, Y0 + 660, { size: 19, weight: 600, fill: 'orange', align: 'left' });
      dot(ctx, cx + 50, Y0 + 660, 6, 'cyan'); label(ctx, `${N.name}'s electrons`, cx + 66, Y0 + 660, { size: 19, weight: 600, fill: 'cyan', align: 'left' });
      ctx.restore();
    },

    // Dot-and-cross: outer shells overlap and electrons are shared in pairs.
    'covalent-bonding'(b, ctx, it, t) {
      const H = { s: 'H', r: 58, inner: [] }; const O = { s: 'O', r: 95, inner: [2] }; const Cc = { s: 'C', r: 95, inner: [2] }; const Nn = { s: 'N', r: 95, inner: [2] }; const Cl = { s: 'Cl', r: 95, inner: [2, 8] };
      const P2 = Math.PI / 2;
      const MOLS = {
        H2O: { name: 'Water, H₂O', c: O, lig: [[H, P2 + 0.91, 1, 0], [H, P2 - 0.91, 1, 0]], lone: [-P2 - 0.75, -P2 + 0.75], f: 'H–O–H', who: ['oxygen', 'hydrogen'] },
        CH4: { name: 'Methane, CH₄', c: Cc, lig: [[H, 0, 1, 0], [H, P2, 1, 0], [H, Math.PI, 1, 0], [H, -P2, 1, 0]], lone: [], f: 'Four C–H single bonds', who: ['carbon', 'hydrogen'] },
        NH3: { name: 'Ammonia, NH₃', c: Nn, lig: [[H, P2, 1, 0], [H, P2 + 2.09, 1, 0], [H, P2 - 2.09, 1, 0]], lone: [-P2], f: 'Three N–H single bonds', who: ['nitrogen', 'hydrogen'] },
        H2: { name: 'Hydrogen, H₂', c: H, lig: [[H, 0, 1, 0]], lone: [], f: 'H–H', who: ['left hydrogen', 'right hydrogen'] },
        HCL: { name: 'Hydrogen chloride, HCl', c: Cl, lig: [[H, 0, 1, 0]], lone: [P2, Math.PI, -P2], f: 'H–Cl', who: ['chlorine', 'hydrogen'] },
        CL2: { name: 'Chlorine, Cl₂', c: Cl, lig: [[Cl, 0, 1, 3]], lone: [P2, Math.PI, -P2], f: 'Cl–Cl', who: ['left chlorine', 'right chlorine'] },
        O2: { name: 'Oxygen, O₂', c: O, lig: [[O, 0, 2, 2]], lone: [Math.PI - 0.8, Math.PI + 0.8], f: 'O=O: a double bond', who: ['left oxygen', 'right oxygen'] },
        CO2: { name: 'Carbon dioxide, CO₂', c: Cc, lig: [[O, 0, 2, 2], [O, Math.PI, 2, 2]], lone: [], f: 'O=C=O: two double bonds', who: ['carbon', 'oxygen'] },
      };
      const raw = String(it.molecule || it.value || 'H2O');
      const byName = [['hydrogen chloride', 'HCL'], ['carbon dioxide', 'CO2'], ['water', 'H2O'], ['methane', 'CH4'], ['ammonia', 'NH3'], ['chlorine', 'CL2'], ['oxygen', 'O2'], ['hydrogen', 'H2']].find(([w]) => raw.toLowerCase().includes(w));
      const M = MOLS[byName ? byName[1] : raw.toUpperCase().replace(/[^A-Z0-9]/g, '')] || MOLS.H2O;
      const k = b.clock; const c = M.c; const R0 = c.r; const q = easeOut(clamp(t / 1.4));
      const dists = M.lig.map(([L]) => R0 + L.r - (L.r < 70 ? 38 : 50));
      const ox = cx - (M.lig.length === 1 ? dists[0] / 2 : 0); const oy = Y0 + 290;
      const cross = (x, y, s = 6) => { ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s); ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.stroke(); };
      const eDot = (x, y) => dot(ctx, x, y, 6, 'cyan');
      const atom = (x, y, A, fillC, mark) => {
        ctx.fillStyle = tint(fillC, 0.07); ctx.strokeStyle = 'rgba(200,215,255,0.5)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, A.r, 0, TAU); ctx.fill(); ctx.stroke();
        A.inner.forEach((cnt, si) => {
          const rr = 34 + si * 26; ctx.strokeStyle = 'rgba(200,215,255,0.3)'; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.stroke();
          for (let j = 0; j < cnt; j++) { const g = (j / cnt) * TAU + k * 0.4; mark(x + Math.cos(g) * rr, y + Math.sin(g) * rr); }
        });
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || M.name);
      const ligs = M.lig.map(([L, a, nb, lp], i) => { const d = dists[i] + (1 - q) * 120; return { L, a, nb, lp, d, x: ox + Math.cos(a) * d, y: oy + Math.sin(a) * d }; });
      atom(ox, oy, c, 'cyan', eDot);
      for (const g of ligs) atom(g.x, g.y, g.L, 'orange', cross);
      label(ctx, c.s, ox, oy + 1, { size: 30, weight: 800, fill: 'ink' });
      for (const g of ligs) label(ctx, g.L.s, g.x, g.y + 1, { size: 28, weight: 800, fill: 'ink' });
      // Shared pairs in the overlaps: one dot (centre atom), one cross (partner).
      const shared = []; const lones = [];
      ligs.forEach((g, i) => {
        const m = (g.d - g.L.r + R0) / 2; const ux = Math.cos(g.a); const uy = Math.sin(g.a);
        const offs = g.nb === 1 ? [-9, 9] : [-27, -9, 9, 27];
        offs.forEach((o, j) => { const jig = Math.sin(k * 3 + i + j) * 1.5; const x = ox + ux * m - uy * o + jig; const y = oy + uy * m + ux * o; if (j % 2) cross(x, y); else eDot(x, y); });
        shared.push([ox + ux * m, oy + uy * m]);
        const rel = g.lp === 3 ? [-1, 0, 1] : g.lp === 2 ? [-0.8, 0.8] : [];
        for (const r of rel) { const a = g.a + r; const px = g.x + Math.cos(a) * g.L.r; const py = g.y + Math.sin(a) * g.L.r; cross(px - Math.sin(a) * 9, py + Math.cos(a) * 9); cross(px + Math.sin(a) * 9, py - Math.cos(a) * 9); lones.push([px, py]); }
      });
      for (const a of M.lone) { const px = ox + Math.cos(a) * R0; const py = oy + Math.sin(a) * R0; eDot(px - Math.sin(a) * 9, py + Math.cos(a) * 9); eDot(px + Math.sin(a) * 9, py - Math.cos(a) * 9); lones.push([px, py]); }
      if (t > 1.6) {
        ctx.save(); ctx.globalAlpha *= after(t, 1.6, 0.5);
        const sp = shared.reduce((p, s) => (s[0] > p[0] ? s : p), shared[0]);
        line(ctx, X1 - 80, Y0 + 116, sp[0] + 10, sp[1] - 10, tint('yellow', 0.7), 1.5);
        label(ctx, 'shared pair', X1 - 20, Y0 + 100, { size: 20, weight: 700, fill: 'yellow', align: 'right' });
        if (lones.length) {
          const lp = lones.reduce((p, s) => (s[0] < p[0] ? s : p), lones[0]);
          line(ctx, X0 + 80, Y0 + 116, lp[0] - 10, lp[1] - 10, tint('muted', 0.8), 1.5);
          label(ctx, 'lone pair', X0 + 20, Y0 + 100, { size: 20, weight: 700, fill: 'muted', align: 'left' });
        }
        label(ctx, M.f, cx, Y0 + 520, { size: 32, weight: 800, fill: 'ink' });
        label(ctx, 'Each shared pair of electrons is one covalent bond', cx, Y0 + 575, { size: 21, weight: 600, fill: 'ink' });
        label(ctx, 'Now every atom has a full outer shell', cx, Y0 + 618, { size: 19, weight: 500, fill: 'muted' });
        ctx.restore();
      }
      eDot(cx - 290, Y0 + 668); label(ctx, `${M.who[0]}'s electrons`, cx - 276, Y0 + 668, { size: 19, weight: 600, fill: 'cyan', align: 'left' });
      cross(cx + 40, Y0 + 668); label(ctx, `${M.who[1]}'s electrons`, cx + 56, Y0 + 668, { size: 19, weight: 600, fill: 'orange', align: 'left' });
      ctx.restore();
    },

    // Two boxes of particles: hot (or crowded) ones collide more, and harder.
    'collision-theory'(b, ctx, it, t) {
      const conc = /conc/i.test(String(it.factor || it.kind || it.value || ''));
      const BW = 360; const BH = 340; const BY = Y0 + 110; const BXS = [X0 + 25, X0 + 415]; const r = 11; const thr = 150;
      const L = BW - 2 * r; const LH = BH - 2 * r;
      const place = (p, side, c) => { const ux = p.sx * 2 + (p.vx * c) / L; const uy = p.sy * 2 + (p.vy * c) / LH; return { x: BXS[side] + r + L * tri(ux), y: BY + r + LH * tri(uy), vx: p.vx * (mod(ux, 2) < 1 ? 1 : -1), vy: p.vy * (mod(uy, 2) < 1 ? 1 : -1), A: p.A }; };
      const C = it._c || (it._c = (() => {
        const boxes = [0, 1].map((side) => {
          const n = conc ? (side ? 10 : 5) : 7; const sp = conc ? 1.4 : side ? 2.3 : 1; const ps = [];
          for (let i = 0; i < 2 * n; i++) { const a = rnd(i * 7 + side * 101 + 3) * TAU; const v = (45 + 50 * rnd(i * 13 + side * 31 + 1)) * sp; ps.push({ A: i % 2 === 0, sx: rnd(i * 3 + side * 17 + 2), sy: rnd(i * 5 + side * 23 + 9), vx: Math.cos(a) * v, vy: Math.sin(a) * v }); }
          return ps;
        });
        // Reacting collisions per second in these exact boxes, counted offline
        // over 12 s of this motion (too slow to count in a frame).
        const rates = conc ? [1.0, 2.8] : [0.3, 2.9];
        return { boxes, rates };
      })());
      const k = b.clock;
      const HEAD = conc ? [['Low concentration', 'cyan'], ['High concentration', 'purple']] : [['Cold: slow particles', 'blue'], ['Hot: fast particles', 'red']];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Collision theory');
      [0, 1].forEach((side) => {
        const bx = BXS[side]; const [head, hc] = HEAD[side];
        panel(ctx, bx, BY, BW, BH, hc, 0.05, 14);
        label(ctx, head, bx + BW / 2, BY - 24, { size: 22, weight: 800, fill: hc });
        const P = C.boxes[side].map((p) => place(p, side, k));
        ctx.lineCap = 'round'; ctx.lineWidth = 7;
        for (const q of P) { ctx.strokeStyle = tint(q.A ? 'cyan' : 'orange', 0.25); ctx.beginPath(); ctx.moveTo(q.x - q.vx * 0.1, q.y - q.vy * 0.1); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        for (const q of P) dot(ctx, q.x, q.y, r, q.A ? 'cyan' : 'orange');
        for (let i = 0; i < P.length; i += 2) for (let j = 1; j < P.length; j += 2) {
          const dx = P[i].x - P[j].x; const dy = P[i].y - P[j].y; if (Math.abs(dx) > 2 * r + 4 || Math.abs(dy) > 2 * r + 4 || Math.hypot(dx, dy) > 2 * r + 4) continue;
          const mx = (P[i].x + P[j].x) / 2; const my = (P[i].y + P[j].y) / 2;
          if (Math.hypot(P[i].vx - P[j].vx, P[i].vy - P[j].vy) > thr) {
            ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 3; ctx.beginPath();
            for (let s = 0; s < 8; s++) { const a = (s / 8) * TAU; ctx.moveTo(mx + Math.cos(a) * 8, my + Math.sin(a) * 8); ctx.lineTo(mx + Math.cos(a) * 20, my + Math.sin(a) * 20); }
            ctx.stroke();
          } else { ctx.strokeStyle = 'rgba(200,215,255,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mx, my, 16, 0, TAU); ctx.stroke(); }
        }
        chip(ctx, `≈ ${fx(C.rates[side], 1)} reactions a second`, bx + BW / 2, BY + BH + 32, hc, 19);
      });
      // Key
      const ky = Y0 + 545;
      ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 3; ctx.beginPath();
      for (let s = 0; s < 8; s++) { const a = (s / 8) * TAU; ctx.moveTo(X0 + 40 + Math.cos(a) * 5, ky + Math.sin(a) * 5); ctx.lineTo(X0 + 40 + Math.cos(a) * 13, ky + Math.sin(a) * 13); }
      ctx.stroke();
      label(ctx, 'enough energy: they react', X0 + 62, ky, { size: 19, weight: 600, fill: 'yellow', align: 'left' });
      ctx.strokeStyle = 'rgba(200,215,255,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X0 + 410, ky, 12, 0, TAU); ctx.stroke();
      label(ctx, 'too little energy: bounce', X0 + 432, ky, { size: 19, weight: 600, fill: 'muted', align: 'left' });
      wrapLabel(ctx, conc ? 'More particles in the same space → more frequent collisions → a faster reaction' : 'Hotter → particles move faster → more frequent and more energetic collisions', X0 + 20, Y0 + 605, FIG.w - 40, 21, 'center', 'ink', 600);
      wrapLabel(ctx, 'Activation energy: the least energy a collision needs to make a reaction happen', X0 + 20, Y0 + 668, FIG.w - 40, 19, 'center', 'muted', 500);
      ctx.restore();
    },

    // Volume of gas against time, two conditions, with the gradient as the rate.
    'rates-graph'(b, ctx, it, t) {
      const kind = String(it.compare || it.kind || it.value || '').toLowerCase();
      const mode = /cat/.test(kind) ? 1 : /conc/.test(kind) ? 2 : /surface|powder|lump/.test(kind) ? 3 : 0;
      const NAMES = [['hot (50 °C)', 'cold (20 °C)'], ['with a catalyst', 'without a catalyst'], ['high concentration', 'low concentration'], ['powder (more surface)', 'lumps (less surface)']][mode];
      const KS = [0.12, 0.045]; const V = 40; const g = { x: X0 + 100, y: Y0 + 90, w: 600, h: 420 };
      const px = (s) => g.x + (s / 60) * g.w; const py = (v) => g.y + g.h - (v / 50) * g.h;
      const vol = (kk, s) => V * (1 - Math.exp(-kk * s));
      const q = clamp((t - 0.4) / 2.2); const k = b.clock;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Rate of reaction');
      axes(ctx, g, { xTicks: [0, 10, 20, 30, 40, 50, 60].map((s) => [s / 60, s]), yTicks: [0, 10, 20, 30, 40, 50].map((v) => [v / 50, v]), xName: 'time (s)', yName: 'volume of gas (cm³)' });
      const curve = (kk, c) => { ctx.strokeStyle = color(c); ctx.lineWidth = 4.5; ctx.lineJoin = 'round'; ctx.beginPath(); const m = Math.max(1, Math.round(80 * q)); for (let j = 0; j <= m; j++) { const s = (60 * q * j) / m; if (j) ctx.lineTo(px(s), py(vol(kk, s))); else ctx.moveTo(px(s), py(vol(kk, s))); } ctx.stroke(); };
      if (q > 0) { glow(ctx, COLORS.red, 12); curve(KS[0], 'red'); ctx.shadowBlur = 0; curve(KS[1], 'blue'); }
      if (q > 0.5) {
        ctx.save(); ctx.globalAlpha *= after(q, 0.5, 0.3);
        label(ctx, NAMES[0], px(6), py(45), { size: 20, weight: 700, fill: 'red', align: 'left' });
        label(ctx, NAMES[1], px(33), py(25), { size: 20, weight: 700, fill: 'blue', align: 'left' });
        ctx.restore();
      }
      if (q >= 1) {
        line(ctx, px(0), py(V), px(60), py(V), tint('green', 0.7), 2, [6, 8]);
        label(ctx, 'same final volume', px(60), py(V) + 18, { size: 18, weight: 600, fill: 'green', align: 'right' });
      }
      if (t > 2.8) {
        const s0 = 3 + mod(k * 5, 40); const v0 = vol(KS[0], s0); const slope = V * KS[0] * Math.exp(-KS[0] * s0);
        const sa = Math.max(0, s0 - 8); const sb = Math.min(60, s0 + 8);
        ctx.save(); ctx.beginPath(); ctx.rect(g.x, g.y - 10, g.w, g.h + 10); ctx.clip();
        line(ctx, px(sa), py(v0 + slope * (sa - s0)), px(sb), py(v0 + slope * (sb - s0)), 'yellow', 3);
        ctx.restore();
        dot(ctx, px(s0), py(v0), 7, 'yellow');
        chip(ctx, `gradient = rate = ${fx(slope, 1)} cm³/s at ${Math.round(s0)} s`, cx, Y0 + 600, 'yellow', 20);
      }
      label(ctx, 'Steeper line = faster reaction', cx, Y0 + 648, { size: 21, weight: 700, fill: 'ink' });
      label(ctx, 'It levels off when a reactant is used up', cx, Y0 + 688, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Ions drifting to the electrode of opposite charge and discharging there.
    electrolysis(b, ctx, it, t) {
      const key = String(it.compound || it.value || '').toLowerCase(); const k = b.clock;
      const D = /copper/.test(key)
        ? { name: 'Electrolysis of copper chloride solution', pos: 'Cu²⁺', neg: 'Cl⁻', cat: 'Cu²⁺ + 2e⁻ → Cu', an: '2Cl⁻ → Cl₂ + 2e⁻', m: 'copper coats the cathode', g: 'chlorine gas bubbles', metal: '#e08a4a', gas: 'rgba(190,240,140,0.85)', liq: 'teal', np: 5, nn: 10, pool: false }
        : /sodium/.test(key)
          ? { name: 'Electrolysis of molten sodium chloride', pos: 'Na⁺', neg: 'Cl⁻', cat: 'Na⁺ + e⁻ → Na', an: '2Cl⁻ → Cl₂ + 2e⁻', m: 'sodium metal forms', g: 'chlorine gas bubbles', metal: '#c9d2e3', gas: 'rgba(190,240,140,0.85)', liq: 'orange', np: 7, nn: 7, pool: true }
          : { name: 'Electrolysis of molten lead bromide', pos: 'Pb²⁺', neg: 'Br⁻', cat: 'Pb²⁺ + 2e⁻ → Pb', an: '2Br⁻ → Br₂ + 2e⁻', m: 'molten lead collects', g: 'brown bromine gas', metal: '#b8c2d6', gas: 'rgba(210,120,60,0.85)', liq: 'orange', np: 5, nn: 10, pool: true };
      const cxk = X0 + 262; const cxa = X0 + 538; const wy = Y0 + 100;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || D.name);
      ctx.fillStyle = tint(D.liq, 0.13); ctx.fillRect(X0 + 152, Y0 + 270, 496, 278);
      ctx.strokeStyle = 'rgba(200,215,255,0.6)'; ctx.lineWidth = 3; poly(ctx, [X0 + 150, Y0 + 230, X0 + 150, Y0 + 550, X0 + 650, Y0 + 550, X0 + 650, Y0 + 230]); ctx.stroke();
      // Circuit: battery on top, electrons flowing from anode round to cathode.
      ctx.strokeStyle = 'rgba(220,230,255,0.75)'; ctx.lineWidth = 3;
      poly(ctx, [cxk, Y0 + 170, cxk, wy, cx - 10, wy]); ctx.stroke(); poly(ctx, [cx + 10, wy, cxa, wy, cxa, Y0 + 170]); ctx.stroke();
      line(ctx, cx - 10, wy - 13, cx - 10, wy + 13, 'ink', 5); line(ctx, cx + 10, wy - 26, cx + 10, wy + 26, 'ink', 3);
      label(ctx, '−', cx - 26, wy - 26, { size: 24, weight: 800, fill: 'ink' }); label(ctx, '+', cx + 28, wy - 30, { size: 24, weight: 800, fill: 'ink' });
      const ep = mkPath([cxa, Y0 + 170, cxa, wy, cxk, wy, cxk, Y0 + 170]);
      for (let i = 0; i < 9; i++) { const P = at(ep, mod((i / 9) * ep.total + k * 60, ep.total)); if (Math.abs(P.x - cx) > 14 || P.y !== wy) dot(ctx, P.x, P.y, 4.5, 'yellow'); }
      arr(ctx, cx + 170, wy - 22, cx + 100, wy - 22, 'yellow', 3);
      label(ctx, 'electrons', cx + 180, wy - 22, { size: 18, weight: 600, fill: 'yellow', align: 'left' });
      // Electrodes and what forms on them.
      for (const [x, c] of [[cxk, 'muted'], [cxa, 'muted']]) { ctx.fillStyle = tint(c, 0.5); ctx.strokeStyle = 'rgba(220,230,255,0.8)'; ctx.lineWidth = 2; rounded(ctx, x - 12, Y0 + 170, 24, 330, 4); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = D.metal;
      const grow = 3 + 2 * Math.sin(k * 0.8);
      ctx.fillRect(cxk - 12 - grow, Y0 + 300, grow, 200); ctx.fillRect(cxk + 12, Y0 + 300, grow, 200);
      if (D.pool) { ctx.beginPath(); ctx.ellipse(cxk, Y0 + 540, 46, 8, 0, 0, TAU); ctx.fill(); }
      for (let i = 0; i < 9; i++) {
        const y = Y0 + 500 - mod(rnd(i) * 228 + k * 70, 228); const x = cxa + (i % 2 ? 20 : -20) + Math.sin(k * 3 + i) * 3;
        ctx.fillStyle = D.gas; ctx.beginPath(); ctx.arc(x, y, 5 + 3 * rnd(i + 9), 0, TAU); ctx.fill();
      }
      // Ions.
      for (let i = 0; i < D.np + D.nn; i++) {
        const pos = i < D.np; const seed = i * 1.7 + (pos ? 0 : 50);
        const q = mod(rnd(seed) + k * 0.16, 1);
        const x0 = X0 + 310 + rnd(seed + 1) * 180; const y = Y0 + 300 + rnd(seed + 2) * 220 + Math.sin(k * 2 + i) * 4;
        const x = lerp(x0, pos ? cxk + 28 : cxa - 28, q);
        const a = clamp(q / 0.1) * clamp((1 - q) / 0.12);
        ctx.save(); ctx.globalAlpha *= a;
        const c = pos ? 'red' : 'cyan';
        ctx.fillStyle = tint(c, 0.35); ctx.strokeStyle = color(c); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 14, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x + 7, y); if (pos) { ctx.moveTo(x, y - 7); ctx.lineTo(x, y + 7); } ctx.stroke();
        ctx.restore();
      }
      label(ctx, 'Cathode (−)', cxk, Y0 + 578, { size: 21, weight: 800, fill: 'ink' });
      label(ctx, 'Anode (+)', cxa, Y0 + 578, { size: 21, weight: 800, fill: 'ink' });
      label(ctx, D.cat, cxk, Y0 + 612, { size: 19, weight: 700, fill: 'red' });
      label(ctx, D.an, cxa, Y0 + 612, { size: 19, weight: 700, fill: 'cyan' });
      label(ctx, D.m, cxk, Y0 + 642, { size: 18, weight: 500, fill: 'muted' });
      label(ctx, D.g, cxa, Y0 + 642, { size: 18, weight: 500, fill: 'muted' });
      label(ctx, `${D.pos} ions go to the cathode, ${D.neg} ions to the anode`, cx, Y0 + 685, { size: 20, weight: 600, fill: 'ink' });
      ctx.restore();
    },

    // Solvent climbing the paper; the ink's dyes travel different distances.
    chromatography(b, ctx, it, t) {
      const u = cycle(t, 12, 0.3); const p = smooth((u - 0.4) / 6);
      const px0 = X0 + 60; const pw = 360; const ptop = Y0 + 70; const pbot = Y0 + 655; const base = Y0 + 560; const sol = Y0 + 600; const fin = Y0 + 120;
      const front = sol - (sol - fin) * p; const dist = Math.max(0, base - front);
      const LANES = [[px0 + 70, 'Ink X', [['blue', 0.78], ['red', 0.48], ['yellow', 0.22]]], [px0 + 180, 'Blue dye', [['blue', 0.78]]], [px0 + 290, 'Red dye', [['red', 0.48]]]];
      ctx.save(); fade(ctx, t);
      if (u > 11.4) ctx.globalAlpha *= clamp((12 - u) / 0.6);
      title(ctx, it.label || 'Paper chromatography');
      ctx.fillStyle = tint('cyan', 0.2); ctx.fillRect(px0 - 28, sol, pw + 56, Y0 + 673 - sol);
      ctx.strokeStyle = 'rgba(200,215,255,0.5)'; ctx.lineWidth = 3; poly(ctx, [px0 - 30, Y0 + 470, px0 - 30, Y0 + 675, px0 + pw + 30, Y0 + 675, px0 + pw + 30, Y0 + 470]); ctx.stroke();
      ctx.fillStyle = 'rgba(235,240,255,0.10)'; ctx.fillRect(px0, ptop, pw, pbot - ptop);
      ctx.fillStyle = tint('cyan', 0.1); ctx.fillRect(px0, front, pw, pbot - front);
      ctx.strokeStyle = 'rgba(235,240,255,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(px0, ptop, pw, pbot - ptop);
      line(ctx, px0 + 8, base, px0 + pw - 8, base, 'rgba(210,210,220,0.8)', 2, [8, 6]);
      if (dist > 30) { line(ctx, px0, front, px0 + pw, front, 'cyan', 2, [10, 6]); label(ctx, 'solvent front', px0 + pw - 10, front - 16, { size: 18, weight: 700, fill: 'cyan', align: 'right' }); }
      for (const [x, name, dyes] of LANES) {
        label(ctx, name, x, base + 21, { size: 18, weight: 700, fill: 'ink' });
        for (const [c, rf] of dyes) {
          const y = base - rf * dist; const rx = 12 + 7 * rf * p; const ry = 9 + 10 * rf * p;
          ctx.fillStyle = tint(c, 0.25); ctx.beginPath(); ctx.ellipse(x, y, rx + 5, ry + 5, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = tint(c, 0.85); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
        }
      }
      // Measuring the red dye in the ink.
      if (dist > 30) {
        const yr = base - 0.48 * dist; const m1 = px0 + pw + 22; const m2 = px0 + pw + 50;
        line(ctx, px0 + 90, yr, m2, yr, tint('red', 0.6), 1.5, [4, 5]);
        arr(ctx, m1, base, m1, front, 'cyan', 3); arr(ctx, m2, base, m2, yr, 'red', 3);
      }
      label(ctx, 'Pencil baseline', X0 + 500, base, { size: 19, weight: 600, fill: 'muted', align: 'left' });
      label(ctx, 'Solvent', X0 + 500, Y0 + 632, { size: 19, weight: 600, fill: 'cyan', align: 'left' });
      para(ctx, 'Rf = distance moved by the spot ÷ distance moved by the solvent', X0 + 490, Y0 + 150, 300, 19, 'ink', 600, 3, 'left');
      const dd = dist / 44; const sd = (0.48 * dist) / 44;
      label(ctx, `red: ${fx(sd, 1)} cm ÷ ${fx(dd, 1)} cm`, X0 + 490, Y0 + 225, { size: 20, weight: 700, fill: 'red', align: 'left' });
      label(ctx, `Rf = ${dd > 0.5 ? fx(sd / dd, 2) : '…'}`, X0 + 490, Y0 + 267, { size: 28, weight: 800, fill: 'yellow', align: 'left' });
      if (u > 6.6) {
        ctx.save(); ctx.globalAlpha *= after(u, 6.6, 0.5);
        para(ctx, 'Ink X = blue + red dyes, and an unknown yellow one', X0 + 490, Y0 + 345, 300, 20, 'green', 700, 3, 'left');
        ctx.restore();
      }
      ctx.restore();
    },

    // The fire triangle and a burning fuel's word and symbol equations.
    combustion(b, ctx, it, t) {
      const k = b.clock; const tx = X0 + 230; const fy = Y0 + 360;
      const V = [[tx, Y0 + 95], [tx - 168, Y0 + 385], [tx + 168, Y0 + 385]];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Combustion');
      const SIDES = [[0, 1, 'Heat', 'red', tx - 112, Y0 + 222, 'right'], [1, 2, 'Fuel', 'orange', tx, Y0 + 418, 'center'], [2, 0, 'Oxygen', 'cyan', tx + 112, Y0 + 222, 'left']];
      SIDES.forEach(([i, j, name, c, lx, ly, al], n) => {
        const q = after(t, n * 0.35, 0.4); if (q <= 0) return;
        const [x0, y0] = V[i]; const [x1, y1] = V[j];
        ctx.strokeStyle = color(c); ctx.lineWidth = 8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(lerp(x0, x1, q), lerp(y0, y1, q)); ctx.stroke();
        ctx.save(); ctx.globalAlpha *= q; label(ctx, name, lx, ly, { size: 24, weight: 800, fill: c, align: al }); ctx.restore();
      });
      // Logs and a flickering flame.
      ctx.fillStyle = '#7a4a2a'; ctx.save(); ctx.translate(tx, fy + 8);
      for (const a of [0.25, -0.25]) { ctx.save(); ctx.rotate(a); rounded(ctx, -70, -9, 140, 18, 8); ctx.fill(); ctx.restore(); }
      ctx.restore();
      const flame = (sc, col) => {
        const tipx = tx + Math.sin(k * 6) * 8 * sc; const tipy = fy - 185 * sc + Math.sin(k * 9) * 8 * sc; const w = 60 * sc;
        ctx.beginPath(); ctx.moveTo(tx - w, fy);
        ctx.quadraticCurveTo(tx - w * 1.1 + Math.sin(k * 7) * 6, fy - 110 * sc, tipx, tipy);
        ctx.quadraticCurveTo(tx + w * 1.1 + Math.sin(k * 8 + 1) * 6, fy - 110 * sc, tx + w, fy);
        ctx.quadraticCurveTo(tx, fy + 16 * sc, tx - w, fy); ctx.fillStyle = col; ctx.fill();
      };
      glow(ctx, COLORS.orange, 26); flame(1, 'rgba(255,120,40,0.85)'); ctx.shadowBlur = 0;
      flame(0.65, 'rgba(255,190,60,0.95)'); flame(0.35, 'rgba(255,245,200,0.95)');
      // Products rising; oxygen drawn in.
      for (let i = 0; i < 6; i++) {
        const q = mod(i / 6 + k * 0.22, 1); const x = tx + (rnd(i) - 0.5) * 90 + Math.sin(k + i) * 10; const y = fy - 175 - 110 * q;
        mol(ctx, x, y, i % 2 ? H2O : CO2, Math.sin(q * Math.PI));
      }
      for (let i = 0; i < 3; i++) { const q = mod(i / 3 + k * 0.3, 1); mol(ctx, lerp(tx + 210, tx + 50, q), fy - 30 + Math.sin(k * 2 + i) * 8, O2, Math.sin(q * Math.PI)); }
      // Equations.
      const ex = X0 + 615;
      ctx.save(); ctx.globalAlpha *= after(t, 1.0, 0.5);
      label(ctx, 'Complete combustion', ex, Y0 + 110, { size: 24, weight: 800, fill: 'orange' });
      label(ctx, 'methane + oxygen', ex, Y0 + 165, { size: 22, weight: 700, fill: 'ink' });
      label(ctx, '→ carbon dioxide + water', ex, Y0 + 200, { size: 22, weight: 700, fill: 'ink' });
      label(ctx, 'CH₄ + 2O₂ → CO₂ + 2H₂O', ex, Y0 + 250, { size: 22, weight: 700, fill: 'cyan' });
      label(ctx, 'Gives out energy: exothermic', ex, Y0 + 298, { size: 19, weight: 600, fill: 'yellow' });
      para(ctx, 'Too little oxygen: carbon monoxide (CO) and soot form instead', X0 + 470, Y0 + 372, 320, 19, 'muted', 500, 3);
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= after(t, 1.6, 0.5);
      label(ctx, 'Take away heat, fuel or oxygen and the fire goes out', cx, Y0 + 475, { size: 21, weight: 700, fill: 'ink' });
      chip(ctx, 'water cools it (heat)', cx - 258, Y0 + 530, 'red', 18);
      chip(ctx, 'fire blanket (oxygen)', cx, Y0 + 530, 'cyan', 18);
      chip(ctx, 'firebreak (fuel)', cx + 258, Y0 + 530, 'orange', 18);
      ctx.restore();
      const legend = [[CO2, 'carbon dioxide', 'muted'], [H2O, 'water', 'blue'], [O2, 'oxygen', 'cyan']];
      legend.forEach(([m, name, c], i) => { const x = X0 + 90 + i * 250; mol(ctx, x, Y0 + 610, m); label(ctx, name, x + 24, Y0 + 610, { size: 19, weight: 600, fill: c, align: 'left' }); });
      ctx.restore();
    },
    // ─── Earth and geography ──────────────────────────────────────────────

    // Sea, land, cloud and rain, with each stage lit in turn.
    'water-cycle'(b, ctx, it, t) {
      const k = b.clock; const st = Math.floor(cycle(t, 10, 1) / 2.5) % 4;
      const LAND = [X0 + 380, Y1, X0 + 380, Y0 + 545, X0 + 470, Y0 + 500, X0 + 560, Y0 + 380, X0 + 640, Y0 + 250, X0 + 700, Y0 + 330, X0 + 760, Y0 + 300, X1, Y0 + 380, X1, Y1];
      const groundY = (x) => { for (let i = 2; i < LAND.length - 4; i += 2) { const xa = LAND[i]; const xb = LAND[i + 2]; if (x >= xa && x <= xb && xb > xa) return lerp(LAND[i + 1], LAND[i + 3], (x - xa) / (xb - xa)); } return Y0 + 500; };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The water cycle');
      const sx = X0 + 75; const sy = Y0 + 90;
      ctx.strokeStyle = tint('yellow', 0.7); ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + k * 0.3; ctx.moveTo(sx + Math.cos(a) * 46, sy + Math.sin(a) * 46); ctx.lineTo(sx + Math.cos(a) * 58, sy + Math.sin(a) * 58); }
      ctx.stroke(); dot(ctx, sx, sy, 36, 'yellow', 24);
      ctx.fillStyle = tint('blue', 0.32); ctx.beginPath(); ctx.moveTo(X0, Y0 + 525);
      for (let x = 0; x <= 400; x += 20) ctx.lineTo(X0 + x, Y0 + 525 + Math.sin(x / 30 + k * 1.5) * 4);
      ctx.lineTo(X0 + 400, Y1); ctx.lineTo(X0, Y1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = tint('green', 0.22); ctx.strokeStyle = tint('green', 0.8); ctx.lineWidth = 2; poly(ctx, LAND, true); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(240,245,255,0.85)'; poly(ctx, [X0 + 615, Y0 + 290, X0 + 640, Y0 + 250, X0 + 670, Y0 + 290, X0 + 652, Y0 + 280, X0 + 640, Y0 + 292, X0 + 628, Y0 + 280], true); ctx.fill();
      // River back to the sea.
      const RIV = [X0 + 610, Y0 + 320, X0 + 565, Y0 + 415, X0 + 505, Y0 + 478, X0 + 445, Y0 + 522, X0 + 392, Y0 + 538];
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = tint('blue', 0.85); ctx.lineWidth = 8; poly(ctx, RIV); ctx.stroke();
      ctx.setLineDash([10, 14]); ctx.lineDashOffset = -k * 40; ctx.strokeStyle = 'rgba(220,240,255,0.7)'; ctx.lineWidth = 2.5; poly(ctx, RIV); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
      // Evaporation: vapour rising off the sea.
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 6; i++) {
        const q = mod(i / 6 + k * 0.2, 1); const x = X0 + 60 + i * 22; const y = Y0 + 505 - 260 * q;
        ctx.strokeStyle = tint('cyan', 0.9 * (1 - q)); ctx.beginPath();
        for (let j = 0; j <= 6; j++) { const xx = x + Math.sin(j * 1.5 + k * 4) * 4; if (j) ctx.lineTo(xx, y - j * 4); else ctx.moveTo(xx, y); }
        ctx.stroke();
      }
      // Condensation: droplets gathering into the cloud.
      for (let i = 0; i < 6; i++) { const q = mod(i / 6 + k * 0.3, 1); dot(ctx, lerp(X0 + 250 + i * 14, X0 + 470, q), lerp(Y0 + 245, Y0 + 165, q), 4, tint('cyan', 0.9 * Math.sin(q * Math.PI))); }
      const dark = st === 2;
      ctx.fillStyle = dark ? 'rgba(150,160,190,0.92)' : 'rgba(230,236,255,0.88)';
      const puff = 1 + 0.04 * Math.sin(k * 1.3);
      for (const [dx, dy, r] of [[-60, 10, 40], [-20, -15, 50], [30, -5, 45], [70, 15, 35], [0, 20, 45]]) { ctx.beginPath(); ctx.arc(X0 + 500 + dx * puff, Y0 + 150 + dy, r * puff, 0, TAU); ctx.fill(); }
      // Precipitation: rain on the hills.
      ctx.strokeStyle = tint('blue', 0.95); ctx.lineWidth = 2.5; ctx.beginPath();
      for (let i = 0; i < 14; i++) { const x = X0 + 460 + rnd(i) * 170; const top = Y0 + 195; const fall = groundY(x) - top; const y = top + mod(rnd(i + 20) * fall + k * 240, fall); ctx.moveTo(x, y); ctx.lineTo(x - 3, Math.min(y + 12, top + fall)); }
      ctx.stroke();
      // The four stages: arrows and names, one lit at a time.
      const STAGE = [['Evaporation', 'cyan', [X0 + 205, Y0 + 470, X0 + 205, Y0 + 250], [X0 + 222, Y0 + 360, 'left'], 'The Sun heats water; it evaporates into water vapour'], ['Condensation', 'purple', [X0 + 255, Y0 + 205, X0 + 400, Y0 + 168], [X0 + 500, Y0 + 78, 'center'], 'Vapour cools high up and condenses into clouds'], ['Precipitation', 'blue', [X1 - 100, Y0 + 150, X1 - 100, Y0 + 250], [X1 - 15, Y0 + 118, 'right'], 'Droplets join until they are heavy, then fall as rain or snow'], ['Collection', 'teal', [X0 + 590, Y0 + 470, X0 + 465, Y0 + 582], [X0 + 560, Y0 + 620, 'center'], 'Water runs into rivers and the sea, and the cycle repeats']];
      STAGE.forEach(([name, c, a, [lx, ly, al]], i) => {
        const on = i === st;
        ctx.save(); ctx.globalAlpha *= after(t, 0.3 + i * 0.2) * (on ? 1 : 0.45);
        if (on) glow(ctx, color(c), 14);
        arr(ctx, a[0], a[1], a[2], a[3], c, on ? 6 : 4); ctx.shadowBlur = 0;
        label(ctx, name, lx, ly, { size: on ? 25 : 21, weight: on ? 800 : 600, fill: c, align: al });
        ctx.restore();
      });
      chip(ctx, STAGE[st][4], cx, Y0 + 675, STAGE[st][1], 20);
      ctx.restore();
    },

    // Igneous, sedimentary, metamorphic and magma, joined by the processes.
    'rock-cycle'(b, ctx, it, t) {
      const k = b.clock; const st = Math.floor(cycle(t, 10, 1.2) / 2.5) % 4;
      const NODES = [['Igneous', 'granite, basalt', 'red', X0 + 190, Y0 + 180], ['Sedimentary', 'sandstone, limestone', 'yellow', X0 + 610, Y0 + 180], ['Metamorphic', 'marble, slate', 'purple', X0 + 610, Y0 + 500], ['Magma', 'molten rock underground', 'orange', X0 + 190, Y0 + 500]];
      const W = 230; const HH = 140;
      const EDGES = [[3, 0, [X0 + 190, Y0 + 430, X0 + 190, Y0 + 252], 'Cooling and crystallising', X0 + 205, Y0 + 318, 'left'], [0, 1, [X0 + 308, Y0 + 180, X0 + 492, Y0 + 180], 'Weathering, erosion, layers pressed together', X0 + 305, Y0 + 138, 'wrap'], [1, 2, [X0 + 610, Y0 + 252, X0 + 610, Y0 + 430], 'Heat and pressure', X0 + 595, Y0 + 362, 'right'], [2, 3, [X0 + 492, Y0 + 500, X0 + 308, Y0 + 500], 'Melting', X0 + 400, Y0 + 532, 'center']];
      const INFO = ['Magma cools and crystals form: igneous rock', 'Rock is broken up, carried away and laid down in layers', 'Buried rock is changed by heat and pressure', 'Deep underground, rock melts back into magma'];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The rock cycle');
      EDGES.forEach(([, to, a, text, lx, ly, al], i) => {
        const on = i === st; const c = NODES[to][2];
        ctx.save(); ctx.globalAlpha *= after(t, 0.8 + i * 0.2) * (on ? 1 : 0.45);
        arr(ctx, a[0], a[1], a[2], a[3], c, on ? 6 : 4);
        if (on) for (let j = 0; j < 3; j++) { const q = mod(k * 0.6 + j / 3, 1); dot(ctx, lerp(a[0], a[2], q), lerp(a[1], a[3], q), 6, c, j ? 0 : 12); }
        if (al === 'wrap') para(ctx, text, lx, ly, 190, 18, c, on ? 800 : 600, 3);
        else label(ctx, text, lx, ly, { size: on ? 20 : 19, weight: on ? 800 : 600, fill: c, align: al });
        ctx.restore();
      });
      NODES.forEach(([name, ex, c, x, y], i) => {
        const on = EDGES[st][1] === i;
        ctx.save(); ctx.globalAlpha *= after(t, i * 0.2, 0.45);
        if (on) glow(ctx, color(c), 16);
        panel(ctx, x - W / 2, y - HH / 2, W, HH, c, on ? 0.2 : 0.1, 16); ctx.shadowBlur = 0;
        const sx = x - W / 2 + 14; const sy = y - HH / 2 + 12; const sw = W - 28; const sh = 54;
        ctx.save(); rounded(ctx, sx, sy, sw, sh, 8); ctx.clip();
        if (i === 0) { ctx.fillStyle = 'rgba(120,110,120,0.6)'; ctx.fillRect(sx, sy, sw, sh); for (let j = 0; j < 34; j++) { ctx.fillStyle = ['#f3c6c6', '#2b2b33', '#e9e9f0', '#b88a8a'][j % 4]; ctx.fillRect(sx + rnd(j) * sw, sy + rnd(j + 40) * sh, 6 + 6 * rnd(j + 80), 5 + 5 * rnd(j + 99)); } }
        else if (i === 1) { for (let j = 0; j < 6; j++) { ctx.fillStyle = j % 2 ? 'rgba(251,191,36,0.55)' : 'rgba(214,150,80,0.55)'; ctx.fillRect(sx, sy + j * 9, sw, 9); } }
        else if (i === 2) { ctx.fillStyle = 'rgba(167,139,250,0.3)'; ctx.fillRect(sx, sy, sw, sh); ctx.strokeStyle = 'rgba(230,220,255,0.75)'; ctx.lineWidth = 3; for (let j = 0; j < 5; j++) { ctx.beginPath(); for (let xx = 0; xx <= sw; xx += 8) { const yy = sy + 6 + j * 11 + Math.sin(xx / 18 + j) * 4; if (xx) ctx.lineTo(sx + xx, yy); else ctx.moveTo(sx, yy); } ctx.stroke(); } }
        else { const gr = ctx.createLinearGradient(0, sy, 0, sy + sh); gr.addColorStop(0, '#ffb347'); gr.addColorStop(1, '#e8452c'); ctx.fillStyle = gr; ctx.fillRect(sx, sy, sw, sh); for (let j = 0; j < 7; j++) dot(ctx, sx + rnd(j) * sw, sy + sh - mod(rnd(j + 7) * sh + k * 18, sh), 3 + 2 * rnd(j + 3), 'rgba(255,240,180,0.8)'); }
        ctx.restore();
        label(ctx, name, x, y + 20, { size: 24, weight: 800, fill: c });
        label(ctx, ex, x, y + 48, { size: 18, weight: 500, fill: 'muted' });
        ctx.restore();
      });
      chip(ctx, INFO[st], cx, Y0 + 630, NODES[EDGES[st][1]][2], 20);
      label(ctx, 'Each journey round the cycle takes millions of years', cx, Y0 + 680, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Convergent, divergent and transform boundaries, each moving.
    'plate-boundaries'(b, ctx, it, t) {
      const k = b.clock; const pick = String(it.kind || it.value || '').toLowerCase();
      const ROWS = [['convergent', 'Convergent', 'plates push together', 'red'], ['divergent', 'Divergent', 'plates pull apart', 'orange'], ['transform', 'Transform', 'plates slide past each other', 'purple']];
      const xa = X0 + 20; const xb = X1 - 20; const bm = cx;
      const star = (x, y, c = 'yellow') => { ctx.strokeStyle = color(c); ctx.lineWidth = 3; ctx.beginPath(); for (let s = 0; s < 8; s++) { const a = (s / 8) * TAU; ctx.moveTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6); ctx.lineTo(x + Math.cos(a) * 18, y + Math.sin(a) * 18); } ctx.stroke(); };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Plate boundaries');
      ROWS.forEach(([key, name, what, c], i) => {
        const y0 = Y0 + 58 + i * 215;
        ctx.save(); ctx.globalAlpha *= after(t, i * 0.3) * (pick && !pick.includes(key) ? 0.3 : 1);
        label(ctx, `${name}:`, xa, y0 + 12, { size: 23, weight: 800, fill: c, align: 'left' });
        ctx.font = `800 23px ${FONT}`; const w = ctx.measureText(`${name}: `).width;
        label(ctx, what, xa + w, y0 + 12, { size: 21, weight: 600, fill: 'ink', align: 'left' });
        ctx.save(); ctx.beginPath(); ctx.rect(xa, y0 + 34, xb - xa, 158); ctx.clip();
        if (key !== 'transform') { ctx.fillStyle = tint('orange', 0.16); ctx.fillRect(xa, y0 + 118, xb - xa, 80); }
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
        if (key === 'convergent') {
          ctx.fillStyle = tint('blue', 0.45); ctx.strokeStyle = COLORS.blue; poly(ctx, [xa, y0 + 100, bm, y0 + 100, bm + 110, y0 + 196, bm + 78, y0 + 196, bm - 12, y0 + 124, xa, y0 + 124], true); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(190,150,100,0.55)'; ctx.strokeStyle = 'rgba(230,200,150,0.9)'; poly(ctx, [bm - 4, y0 + 98, bm + 40, y0 + 82, bm + 82, y0 + 52, bm + 112, y0 + 74, bm + 150, y0 + 46, bm + 200, y0 + 80, xb, y0 + 84, xb, y0 + 132, bm + 60, y0 + 132], true); ctx.fill(); ctx.stroke();
          dot(ctx, bm + 150, y0 + 48, 5 + 2 * Math.sin(k * 4), 'red');
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath();
          for (let j = 0; j < 12; j++) { const x = xa + mod(k * 25, 40) + j * 40; if (x < bm - 10) { ctx.moveTo(x, y0 + 103); ctx.lineTo(x, y0 + 121); } const x2 = xb - mod(k * 25, 40) - j * 40; if (x2 > bm + 215) { ctx.moveTo(x2, y0 + 88); ctx.lineTo(x2, y0 + 128); } }
          ctx.stroke();
          arr(ctx, xa + 70, y0 + 72, xa + 170, y0 + 72, c, 5); arr(ctx, xb - 60, y0 + 58, xb - 150, y0 + 58, c, 5);
          if (mod(k, 3) < 0.35) star(bm + 30, y0 + 130);
          label(ctx, 'one plate sinks under the other', xa + 10, y0 + 152, { size: 18, weight: 600, fill: 'muted', align: 'left' });
        } else if (key === 'divergent') {
          const gr = ctx.createLinearGradient(0, y0 + 90, 0, y0 + 196); gr.addColorStop(0, '#ffd27a'); gr.addColorStop(1, '#e8452c');
          glow(ctx, COLORS.orange, 16); ctx.fillStyle = gr; ctx.fillRect(bm - 18, y0 + 92, 36, 106); ctx.shadowBlur = 0;
          for (let j = 0; j < 6; j++) dot(ctx, bm + (rnd(j + 5) - 0.5) * 24, y0 + 196 - mod(rnd(j) * 100 + k * 40, 100), 3, 'rgba(255,240,180,0.85)');
          ctx.fillStyle = tint('blue', 0.45); ctx.strokeStyle = COLORS.blue;
          poly(ctx, [xa, y0 + 98, bm - 60, y0 + 94, bm - 18, y0 + 84, bm - 18, y0 + 122, xa, y0 + 124], true); ctx.fill(); ctx.stroke();
          poly(ctx, [xb, y0 + 98, bm + 60, y0 + 94, bm + 18, y0 + 84, bm + 18, y0 + 122, xb, y0 + 124], true); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath();
          for (let j = 0; j < 10; j++) { const d = mod(k * 25, 40) + j * 40 + 30; if (bm - d > xa) { ctx.moveTo(bm - d, y0 + 100); ctx.lineTo(bm - d, y0 + 120); } if (bm + d < xb) { ctx.moveTo(bm + d, y0 + 100); ctx.lineTo(bm + d, y0 + 120); } }
          ctx.stroke();
          arr(ctx, bm - 60, y0 + 64, bm - 170, y0 + 64, c, 5); arr(ctx, bm + 60, y0 + 64, bm + 170, y0 + 64, c, 5);
          arr(ctx, bm - 40, y0 + 182, bm - 140, y0 + 182, tint('orange', 0.8), 3); arr(ctx, bm + 40, y0 + 182, bm + 140, y0 + 182, tint('orange', 0.8), 3);
          label(ctx, 'magma rises and makes new crust', xa + 10, y0 + 152, { size: 18, weight: 600, fill: 'muted', align: 'left' });
        } else {
          const xs = X0 + 330; const W = xb - xs;
          const slip = 30 * (Math.floor(k / 3) + smooth((mod(k, 3) - 2.6) / 0.4));
          ctx.fillStyle = tint('purple', 0.22); ctx.fillRect(xs, y0 + 40, W, 72);
          ctx.fillStyle = tint('teal', 0.22); ctx.fillRect(xs, y0 + 112, W, 72);
          ctx.strokeStyle = 'rgba(233,238,255,0.75)'; ctx.lineWidth = 4; ctx.beginPath();
          for (let j = 0; j < 6; j++) { const x1 = xs + mod(j * 90 - slip, 540); const x2 = xs + mod(j * 90 + slip, 540); if (x1 < xb) { ctx.moveTo(x1, y0 + 46); ctx.lineTo(x1, y0 + 106); } if (x2 < xb) { ctx.moveTo(x2, y0 + 118); ctx.lineTo(x2, y0 + 178); } }
          ctx.stroke();
          line(ctx, xs, y0 + 112, xb, y0 + 112, 'red', 3, [10, 6]);
          arr(ctx, xb - 20, y0 + 76, xb - 120, y0 + 76, c, 5); arr(ctx, xs + 20, y0 + 148, xs + 120, y0 + 148, 'teal', 5);
          if (mod(k, 3) > 2.55) star(xs + W / 2, y0 + 112);
          para(ctx, 'Seen from above: the plates lock, then slip suddenly, causing earthquakes', xa + 4, y0 + 110, 290, 18, 'muted', 600, 3, 'left');
        }
        ctx.restore(); ctx.restore();
      });
      ctx.restore();
    },

    // A cross-section of an erupting volcano.
    volcano(b, ctx, it, t) {
      const k = b.clock; const gy = Y0 + 500; const crY = Y0 + 265; const chY = Y0 + 620; const L0 = X0 + 110; const R0 = X1 - 110;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Inside a volcano');
      ctx.fillStyle = tint('orange', 0.08); ctx.fillRect(X0, gy, FIG.w, Y1 - gy);
      ctx.strokeStyle = tint('orange', 0.22); ctx.lineWidth = 2; ctx.beginPath(); for (let j = 1; j < 5; j++) { ctx.moveTo(X0, gy + j * 40); ctx.lineTo(X1, gy + j * 40); } ctx.stroke();
      // Ash cloud.
      for (let i = 0; i < 10; i++) { const ph = mod(i / 10 + k * 0.08, 1); const x = cx + 30 + ph * 180 + Math.sin(i * 2.1) * 20; const y = crY - 55 - ph * 140; ctx.fillStyle = `rgba(125,130,148,${0.55 * (1 - ph * 0.6)})`; ctx.beginPath(); ctx.arc(x, y, 20 + 32 * ph, 0, TAU); ctx.fill(); }
      // Cone with its layers.
      ctx.fillStyle = 'rgba(150,130,120,0.35)'; ctx.strokeStyle = 'rgba(220,200,180,0.75)'; ctx.lineWidth = 3;
      poly(ctx, [L0, gy, cx - 48, crY, cx + 48, crY, R0, gy], true); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 6;
      for (let j = 1; j <= 3; j++) {
        ctx.strokeStyle = j % 2 ? tint('red', 0.35) : 'rgba(200,190,180,0.45)';
        ctx.beginPath(); ctx.moveTo(L0 + j * 55, gy); ctx.lineTo(cx - 28, crY + j * 48); ctx.moveTo(R0 - j * 55, gy); ctx.lineTo(cx + 28, crY + j * 48); ctx.stroke();
      }
      // Chamber and vent.
      const gr = ctx.createRadialGradient(cx, chY, 10, cx, chY, 170); gr.addColorStop(0, '#ffd27a'); gr.addColorStop(1, '#d9381e');
      glow(ctx, '#ff6a3d', 22); ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(cx, chY, 170, 52, 0, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,120,50,0.9)'; poly(ctx, [cx - 16, chY - 45, cx - 13, crY + 6, cx + 13, crY + 6, cx + 16, chY - 45], true); ctx.fill();
      ctx.fillStyle = 'rgba(255,220,140,0.7)'; for (let j = 0; j < 5; j++) { const y = chY - 45 - mod(rnd(j) * 300 + k * 160, chY - 45 - crY); ctx.beginPath(); ctx.arc(cx + (rnd(j + 3) - 0.5) * 12, y, 3, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(40,20,20,0.8)'; ctx.beginPath(); ctx.ellipse(cx, crY, 48, 9, 0, 0, TAU); ctx.fill();
      // Lava flows down the slopes.
      const flow = (sd, len) => { const x0 = cx + sd * 44; const x1 = lerp(x0, sd > 0 ? R0 : L0, len); const y1 = lerp(crY + 4, gy, len); ctx.strokeStyle = 'rgba(255,90,40,0.85)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(x0, crY + 4); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([16, 12]); ctx.lineDashOffset = -k * 30; ctx.strokeStyle = 'rgba(255,220,120,0.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, crY + 4); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0; };
      ctx.lineCap = 'round'; flow(1, 0.6 + 0.12 * Math.sin(k * 0.7)); flow(-1, 0.35 + 0.08 * Math.sin(k * 0.9 + 1));
      // Lava fountain.
      for (let i = 0; i < 26; i++) {
        const ph = mod(rnd(i) + k * 0.7, 1); const vx = (rnd(i + 3) - 0.5) * 180; const vy = 260 + rnd(i + 7) * 120;
        const x = cx + vx * ph; const y = crY - (vy * ph - 300 * ph * ph);
        ctx.fillStyle = i % 3 ? `rgba(255,150,50,${1 - ph * 0.5})` : `rgba(255,230,120,${1 - ph * 0.5})`; ctx.beginPath(); ctx.arc(x, y, 4 + 2 * rnd(i + 11), 0, TAU); ctx.fill();
      }
      const lead = (x0, y0, x1, y1, c) => line(ctx, x0, y0, x1, y1, tint(c, 0.7), 1.5);
      ctx.save(); ctx.globalAlpha *= after(t, 0.8, 0.5);
      lead(X0 + 366, Y0 + 96, cx + 60, Y0 + 150, 'ink'); label(ctx, 'Ash cloud', X0 + 360, Y0 + 90, { size: 21, weight: 700, fill: 'ink', align: 'right' });
      lead(X0 + 196, Y0 + 245, cx - 50, crY, 'yellow'); label(ctx, 'Crater', X0 + 190, Y0 + 245, { size: 21, weight: 700, fill: 'yellow', align: 'right' });
      const lx = lerp(cx + 48, R0, 0.45); const ly = lerp(crY, gy, 0.45);
      lead(X1 - 128, Y0 + 360, lx + 8, ly - 4, 'red'); label(ctx, 'Lava flow', X1 - 20, Y0 + 360, { size: 21, weight: 700, fill: 'red', align: 'right' });
      lead(X0 + 220, Y0 + 342, X0 + 250, Y0 + 440, 'muted'); label(ctx, 'Layers of ash and lava', X0 + 15, Y0 + 330, { size: 19, weight: 700, fill: 'muted', align: 'left' });
      lead(X1 - 118, Y0 + 560, cx + 18, Y0 + 560, 'orange'); label(ctx, 'Main vent', X1 - 20, Y0 + 560, { size: 21, weight: 700, fill: 'orange', align: 'right' });
      lead(X1 - 176, chY, cx + 172, chY, 'orange'); label(ctx, 'Magma chamber', X1 - 20, chY, { size: 21, weight: 700, fill: 'orange', align: 'right' });
      ctx.restore();
      ctx.restore();
    },

    // A river from source to mouth: waterfall, meanders, an ox-bow lake, a delta.
    'river-features'(b, ctx, it, t) {
      const k = b.clock;
      const C = it._c || (it._c = (() => {
        const S = [X0 + 90, Y0 + 95]; const E = [X1 - 170, Y1 - 150];
        const dx = E[0] - S[0]; const dy = E[1] - S[1]; const Lr = Math.hypot(dx, dy); const nx = -dy / Lr; const ny = dx / Lr;
        const amp = (s) => (s < 0.25 ? 10 : s < 0.4 ? lerp(10, 70, (s - 0.25) / 0.15) : s < 0.78 ? 70 : lerp(70, 25, clamp((s - 0.78) / 0.14)));
        const P = (s, extra = 0) => { const w = amp(s) * Math.sin(TAU * 5 * s) + extra; return [S[0] + dx * s + nx * w, S[1] + dy * s + ny * w]; };
        const pts = []; for (let i = 0; i <= 130; i++) { const [x, y] = P((i / 140)); pts.push(x, y); }
        return { P, pts, nx, ny, S, E, base: [S[0] + dx * 0.65 + nx * 112, S[1] + dy * 0.65 + ny * 112] };
      })());
      const { P, pts, nx, ny, S, E } = C;
      const FEAT = [['Source', 'Where the river starts, high in the hills'], ['Waterfall', 'Hard rock over soft rock: the soft rock wears away, the water drops'], ['Meander', 'Fast water wears away the outside bend; slow water drops sand on the inside'], ['Ox-bow lake', "A meander's neck is cut through; the old loop is left as a lake"], ['Delta', 'At the mouth the river slows and drops its sediment in a fan']];
      const fi = Math.floor(cycle(t, FEAT.length * 2.6, 1) / 2.6) % FEAT.length;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'River features');
      ctx.fillStyle = tint('blue', 0.3); poly(ctx, [X0 + 470, Y1, X1, Y0 + 380, X1, Y1], true); ctx.fill();
      ctx.fillStyle = 'rgba(150,140,140,0.4)'; poly(ctx, [X0 + 20, Y0 + 200, X0 + 95, Y0 + 68, X0 + 170, Y0 + 200], true); ctx.fill();
      ctx.fillStyle = 'rgba(240,245,255,0.85)'; poly(ctx, [X0 + 81, Y0 + 93, X0 + 95, Y0 + 68, X0 + 110, Y0 + 95], true); ctx.fill();
      // Floodplain, the river widening downstream, and the flow.
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = tint('green', 0.13); ctx.lineWidth = 80; poly(ctx, pts.slice(180)); ctx.stroke();
      for (let c = 0; c < 5; c++) { const a = c * 26; const e = Math.min(pts.length / 2 - 1, a + 27); ctx.strokeStyle = tint('blue', 0.9); ctx.lineWidth = 4 + c * 3; poly(ctx, pts.slice(a * 2, e * 2 + 2)); ctx.stroke(); }
      const D = P(130 / 140); const coast = [0.718, -0.696]; const sea = [0.696, 0.718];
      const ends = [-55, 0, 55].map((o) => [E[0] + coast[0] * o + sea[0] * 18, E[1] + coast[1] * o + sea[1] * 18]);
      ctx.fillStyle = tint('yellow', 0.3); poly(ctx, [D[0], D[1], ends[0][0], ends[0][1], ends[2][0], ends[2][1]], true); ctx.fill();
      ctx.strokeStyle = tint('blue', 0.9); ctx.lineWidth = 8; ctx.beginPath(); for (const [x, y] of ends) { ctx.moveTo(D[0], D[1]); ctx.lineTo(x, y); } ctx.stroke();
      ctx.setLineDash([10, 16]); ctx.lineDashOffset = -k * 40; ctx.strokeStyle = 'rgba(225,240,255,0.75)'; ctx.lineWidth = 2; poly(ctx, pts); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
      // Ox-bow lake beside a meander.
      const ob = C.base; const an = Math.atan2(ny, nx);
      ctx.strokeStyle = tint('cyan', 0.85); ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(ob[0], ob[1], 30, an - 1.9, an + 1.9); ctx.stroke();
      // Waterfall
      const wfp = P(0.2); ctx.strokeStyle = 'rgba(230,220,200,0.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(wfp[0] - nx * 18, wfp[1] - ny * 18); ctx.lineTo(wfp[0] + nx * 18, wfp[1] + ny * 18); ctx.stroke();
      for (let j = 0; j < 4; j++) dot(ctx, wfp[0] + (rnd(j) - 0.3) * 14, wfp[1] + 6 + mod(rnd(j + 4) * 12 + k * 20, 12), 3, 'rgba(255,255,255,0.85)');
      const mp = P(0.55);
      const LABS = [[S[0] + 22, S[1] - 14, 'left'], [wfp[0] + 26, wfp[1] - 4, 'left'], [mp[0] + 24, mp[1] - 26, 'left'], [ob[0] + nx * 58, ob[1] + ny * 58, 'center'], [X1 - 10, Y1 - 60, 'right']];
      FEAT.forEach(([name], i) => {
        const on = i === fi; const [lx, ly, al] = LABS[i];
        ctx.save(); ctx.globalAlpha *= after(t, 0.5 + i * 0.15) * (on ? 1 : 0.7);
        if (on) glow(ctx, COLORS.yellow, 12);
        label(ctx, i === 4 ? 'Delta at the mouth' : name, lx, ly, { size: on ? 23 : 20, weight: on ? 800 : 600, fill: on ? 'yellow' : 'ink', align: al });
        ctx.shadowBlur = 0; ctx.restore();
      });
      line(ctx, X1 - 120, Y1 - 76, E[0] + 6, E[1] + 16, tint('ink', 0.5), 1.5);
      panel(ctx, X0 + 430, Y0 + 70, 360, 104, 'yellow', 0.06, 14);
      label(ctx, FEAT[fi][0], X0 + 450, Y0 + 96, { size: 21, weight: 800, fill: 'yellow', align: 'left' });
      para(ctx, FEAT[fi][1], X0 + 450, Y0 + 142, 320, 18, 'ink', 500, 3, 'left');
      ctx.restore();
    },

    // A cold front catching a warm front, side on, with the map symbols.
    'weather-fronts'(b, ctx, it, t) {
      const k = b.clock; const gY = Y0 + 430; const cf = X0 + 250; const wf = X0 + 560;
      const fyW = (x) => gY - ((x - wf) / (X1 - wf)) * (gY - Y0 - 210);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Weather fronts');
      ctx.fillStyle = tint('orange', 0.14); ctx.beginPath(); ctx.moveTo(cf, gY); ctx.quadraticCurveTo(cf - 10, gY - 200, cf - 110, Y0 + 70); ctx.lineTo(X1, Y0 + 70); ctx.lineTo(X1, Y0 + 210); ctx.lineTo(wf, gY); ctx.closePath(); ctx.fill();
      ctx.fillStyle = tint('blue', 0.2); ctx.beginPath(); ctx.moveTo(X0, gY); ctx.lineTo(cf, gY); ctx.quadraticCurveTo(cf - 10, gY - 200, cf - 110, Y0 + 70); ctx.lineTo(X0, Y0 + 70); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cf, gY); ctx.quadraticCurveTo(cf - 10, gY - 200, cf - 110, Y0 + 70); ctx.stroke();
      ctx.fillStyle = tint('blue', 0.2); poly(ctx, [wf, gY, X1, Y0 + 210, X1, gY], true); ctx.fill();
      line(ctx, wf, gY, X1, Y0 + 210, 'red', 3);
      ctx.fillStyle = tint('green', 0.25); ctx.fillRect(X0, gY, FIG.w, 14);
      // Clouds: towering at the cold front, layered along the warm front.
      ctx.fillStyle = 'rgba(150,160,185,0.88)';
      for (const [dx, y, r] of [[-60, 300, 40], [-10, 290, 45], [40, 305, 35], [-30, 240, 45], [10, 200, 42], [-20, 152, 38], [36, 142, 34], [80, 132, 30], [-72, 136, 30]]) { ctx.beginPath(); ctx.arc(cf + dx, Y0 + y, r, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(195,203,225,0.8)';
      for (let x = wf + 30; x < X1 - 20; x += 55) { ctx.beginPath(); ctx.ellipse(x, fyW(x) - 34, 46, 15, 0, 0, TAU); ctx.fill(); }
      // Rain: heavy under the cold front, steady under the warm front.
      ctx.strokeStyle = tint('blue', 0.95); ctx.lineWidth = 2.5; ctx.beginPath();
      for (let i = 0; i < 16; i++) { const x = cf - 95 + rnd(i) * 150; const top = Y0 + 335; const fall = gY - top; const y = top + mod(rnd(i + 30) * fall + k * 300, fall); ctx.moveTo(x, y); ctx.lineTo(x - 3, Math.min(gY, y + 14)); }
      for (let i = 0; i < 12; i++) { const x = wf + 20 + rnd(i + 60) * 200; const top = fyW(x) - 18; const fall = gY - top; const y = top + mod(rnd(i + 90) * fall + k * 160, fall); ctx.moveTo(x, y); ctx.lineTo(x - 2, Math.min(gY, y + 9)); }
      ctx.stroke();
      ctx.save(); ctx.setLineDash([10, 10]); ctx.lineDashOffset = -k * 30; arr(ctx, wf + 60, fyW(wf + 60) - 70, wf + 230, fyW(wf + 230) - 70, 'orange', 4); ctx.restore();
      arr(ctx, cf - 150, Y0 + 405, cf - 80, Y0 + 405, 'blue', 4); arr(ctx, wf - 110, Y0 + 405, wf - 40, Y0 + 405, 'orange', 4);
      label(ctx, 'Cold air', X0 + 60, Y0 + 350, { size: 22, weight: 800, fill: 'blue' });
      label(ctx, 'Warm air', X0 + 440, Y0 + 255, { size: 22, weight: 800, fill: 'orange' });
      ctx.save(); ctx.translate(wf + 145, fyW(wf + 145) - 92); ctx.rotate(Math.atan2(-(gY - Y0 - 210), X1 - wf)); label(ctx, 'warm air rises', 0, 0, { size: 18, weight: 600, fill: 'orange' }); ctx.restore();
      label(ctx, 'Cold air', X1 - 70, Y0 + 400, { size: 20, weight: 800, fill: 'blue' });
      label(ctx, 'Cold front', X0 + 15, Y0 + 92, { size: 21, weight: 800, fill: 'blue', align: 'left' });
      label(ctx, 'Warm front', X1 - 15, Y0 + 100, { size: 21, weight: 800, fill: 'red', align: 'right' });
      // Map symbols.
      const sym = (y, warm) => {
        const x0 = X0 + 30; const x1 = X0 + 300; const c = warm ? COLORS.red : COLORS.blue; const off = mod(k * 15, 40);
        ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
        for (let x = x0 + off; x < x1 - 20; x += 40) { ctx.beginPath(); if (warm) ctx.arc(x + 10, y, 10, Math.PI, 0); else { ctx.moveTo(x, y); ctx.lineTo(x + 10, y - 16); ctx.lineTo(x + 20, y); } ctx.closePath(); ctx.fill(); }
      };
      sym(Y0 + 525, false); sym(Y0 + 600, true);
      wrapLabel(ctx, 'Cold front: heavy showers, then cooler and clearer', X0 + 325, Y0 + 520, 455, 20, 'left', 'blue', 700);
      wrapLabel(ctx, 'Warm front: long steady rain, then warmer and cloudy', X0 + 325, Y0 + 596, 455, 20, 'left', 'red', 700);
      label(ctx, 'Fronts are where warm and cold air masses meet', cx, Y0 + 670, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Rainfall bars and a temperature line across the twelve months.
    'climate-graph'(b, ctx, it, t) {
      let temps = nums(it.temps ?? it.temperature, null); let rain = nums(it.rain ?? it.rainfall, null);
      if (!temps || !rain || temps.length < 12 || rain.length < 12) { temps = [5.2, 5.3, 7.6, 9.9, 13.3, 16.5, 18.7, 18.5, 15.7, 12.0, 8.0, 5.5]; rain = [55, 41, 42, 44, 49, 45, 45, 50, 49, 69, 59, 55]; }
      temps = temps.slice(0, 12); rain = rain.slice(0, 12);
      const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const place = String(it.place || it.value || 'London, UK');
      const g = { x: X0 + 90, y: Y0 + 95, w: 600, h: 420 };
      const rmax = Math.max(60, Math.ceil((Math.max(...rain) * 1.15) / 20) * 20);
      const tmin = Math.min(0, Math.floor(Math.min(...temps) / 5) * 5); const tmax = Math.max(tmin + 10, Math.ceil((Math.max(...temps) * 1.15) / 5) * 5);
      const ry = (v) => g.y + g.h - (v / rmax) * g.h; const ty = (v) => g.y + g.h - ((v - tmin) / (tmax - tmin)) * g.h;
      const bwid = g.w / 12; const mx = (i) => g.x + (i + 0.5) * bwid;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || `Climate graph: ${place}`);
      const rstep = rmax <= 120 ? 20 : rmax <= 300 ? 50 : 100; const yT = []; for (let v = 0; v <= rmax; v += rstep) yT.push([v / rmax, v]);
      const tT = []; for (let v = tmin; v <= tmax; v += 5) tT.push([(v - tmin) / (tmax - tmin), v]);
      axes(ctx, g, { xTicks: MON.map((m, i) => [(i + 0.5) / 12, m[0]]), yTicks: yT, yName: 'Rainfall (mm)', c1: 'blue', yTicks2: tT, yName2: 'Temperature (°C)', c2: 'red' });
      const hi = t > 2.8 ? Math.floor((t - 2.8) / 1.2) % 12 : -1;
      if (hi >= 0) { ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(mx(hi) - bwid / 2, g.y, bwid, g.h); }
      for (let i = 0; i < 12; i++) {
        const q = after(t, 0.3 + i * 0.05, 0.5); const top = ry(rain[i] * q);
        ctx.fillStyle = tint('blue', i === hi ? 0.65 : 0.42); ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 1.5;
        ctx.fillRect(mx(i) - bwid * 0.31, top, bwid * 0.62, g.y + g.h - top); ctx.strokeRect(mx(i) - bwid * 0.31, top, bwid * 0.62, g.y + g.h - top);
      }
      const lq = clamp((t - 1.2) / 1.4) * 11;
      if (lq > 0) {
        glow(ctx, COLORS.red, 12); ctx.strokeStyle = COLORS.red; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(mx(0), ty(temps[0]));
        for (let i = 1; i <= Math.floor(lq); i++) ctx.lineTo(mx(i), ty(temps[i]));
        const f = lq - Math.floor(lq); if (f > 0 && lq < 11) { const i = Math.floor(lq); ctx.lineTo(lerp(mx(i), mx(i + 1), f), lerp(ty(temps[i]), ty(temps[i + 1]), f)); }
        ctx.stroke(); ctx.shadowBlur = 0;
        for (let i = 0; i <= Math.floor(lq); i++) { ctx.fillStyle = DARK; ctx.strokeStyle = COLORS.red; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(mx(i), ty(temps[i]), i === hi ? 8 : 6, 0, TAU); ctx.fill(); ctx.stroke(); }
      }
      if (hi >= 0) chip(ctx, `${MON[hi]}: ${fx(temps[hi])} °C and ${Math.round(rain[hi])} mm of rain`, cx, Y0 + 600, 'ink', 21);
      const total = Math.round(rain.reduce((s, v) => s + v, 0));
      label(ctx, `Total rainfall ${total} mm a year · temperature range ${fx(Math.max(...temps) - Math.min(...temps))} °C`, cx, Y0 + 655, { size: 20, weight: 600, fill: 'muted' });
      ctx.restore();
    },

    // Sunlight in; heat out from the ground; greenhouse gases send some back.
    'greenhouse-effect'(b, ctx, it, t) {
      const more = /more|enhanced|high|increas/i.test(String(it.level || it.kind || it.value || ''));
      const k = b.clock; const atY0 = Y0 + 220; const atY1 = Y0 + 360; const earthY = Y0 + 525;
      const gy = (x) => earthY + ((x - cx) ** 2) / 2800;
      const C = it._c || (it._c = (() => {
        const sun = [X1 - 70, Y0 + 85];
        const R = (pts, types) => ({ p: mkPath(pts), types });
        const routes = [
          R([sun[0], sun[1], X0 + 600, gy(X0 + 600), X0 + 560, Y0 + 150], [0, 0]),
          R([sun[0], sun[1], X0 + 430, gy(X0 + 430), X0 + 420, Y0 + 60], [0, 1]),
          R([sun[0], sun[1], X0 + 150, gy(X0 + 150), X0 + 200, Y0 + 280, X0 + 290, gy(X0 + 290)], [0, 1, 1]),
          R([sun[0], sun[1], X0 + 700, gy(X0 + 700), X0 + 650, Y0 + 290, X0 + 770, gy(X0 + 770)], [0, 1, 1]),
        ];
        if (more) routes.push(R([sun[0], sun[1], X0 + 520, gy(X0 + 520), X0 + 470, Y0 + 300, X0 + 360, gy(X0 + 360)], [0, 1, 1]));
        return { sun, routes };
      })());
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The greenhouse effect');
      const ag = ctx.createLinearGradient(0, atY0, 0, atY1); ag.addColorStop(0, more ? 'rgba(34,211,238,0.10)' : 'rgba(34,211,238,0.05)'); ag.addColorStop(1, more ? 'rgba(34,211,238,0.24)' : 'rgba(34,211,238,0.14)');
      ctx.fillStyle = ag; ctx.fillRect(X0, atY0, FIG.w, atY1 - atY0);
      line(ctx, X0, atY0, X1, atY0, tint('cyan', 0.45), 1.5, [8, 8]);
      label(ctx, 'Atmosphere', X0 + 14, atY0 + 18, { size: 18, weight: 700, fill: 'cyan', align: 'left' });
      const eg = ctx.createLinearGradient(0, earthY, 0, Y1); eg.addColorStop(0, 'rgba(52,211,153,0.45)'); eg.addColorStop(1, 'rgba(37,99,235,0.35)');
      ctx.fillStyle = eg; ctx.beginPath(); ctx.moveTo(X0, gy(X0)); for (let x = X0 + 20; x <= X1; x += 20) ctx.lineTo(x, gy(x)); ctx.lineTo(X1, Y1); ctx.lineTo(X0, Y1); ctx.closePath(); ctx.fill();
      // Gas molecules jiggling in the air.
      const n = more ? 18 : 9;
      for (let i = 0; i < n; i++) {
        const x = X0 + 40 + rnd(i) * 720; const y = atY0 + 26 + rnd(i + 30) * (atY1 - atY0 - 50) + Math.sin(k * 2 + i) * 4;
        mol(ctx, x, y, i % 3 === 0 ? CO2 : i % 3 === 1 ? H2O : [[0, 0, 7, 'muted'], [-9, -6, 4, 'ink'], [9, -6, 4, 'ink'], [-9, 6, 4, 'ink'], [9, 6, 4, 'ink']], 0.8);
      }
      for (const r of C.routes) { ctx.save(); ctx.globalAlpha *= 0.18; for (let s = 0; s < r.types.length; s++) { ctx.strokeStyle = r.types[s] ? COLORS.red : COLORS.yellow; ctx.lineWidth = 2; ctx.setLineDash([5, 7]); ctx.beginPath(); ctx.moveTo(r.p.pts[2 * s], r.p.pts[2 * s + 1]); ctx.lineTo(r.p.pts[2 * s + 2], r.p.pts[2 * s + 3]); ctx.stroke(); } ctx.setLineDash([]); ctx.restore(); }
      C.routes.forEach((r) => { if (r.types.length === 3) { const [x, y] = [r.p.pts[4], r.p.pts[5]]; mol(ctx, x, y, CO2, 1); } });
      // Light and heat travelling as waves.
      const [sx, sy] = C.sun;
      ctx.strokeStyle = tint('yellow', 0.7); ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + k * 0.3; ctx.moveTo(sx + Math.cos(a) * 44, sy + Math.sin(a) * 44); ctx.lineTo(sx + Math.cos(a) * 56, sy + Math.sin(a) * 56); }
      ctx.stroke(); dot(ctx, sx, sy, 34, 'yellow', 24);
      if (t > 0.6) {
        ctx.lineWidth = 3; ctx.lineCap = 'round';
        C.routes.forEach((r, ri) => {
          for (let h = 0; h < 2; h++) {
            const P = at(r.p, mod(k * 160 + ri * 211 + h * r.p.total * 0.5, r.p.total));
            const ir = r.types[Math.min(r.types.length - 1, P.i)]; const lam = ir ? 22 : 10; const amp = ir ? 7 : 5;
            const ca = Math.cos(P.a); const sa = Math.sin(P.a);
            ctx.strokeStyle = ir ? COLORS.red : COLORS.yellow; ctx.beginPath();
            for (let j = 0; j <= 12; j++) { const s = -j * 4; const w = Math.sin((s / lam) * TAU - k * 12) * amp; const x = P.x + ca * s - sa * w; const y = P.y + sa * s + ca * w; if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
            ctx.stroke();
          }
        });
      }
      label(ctx, 'Sunlight (short-wave)', X1 - 136, Y0 + 85, { size: 20, weight: 700, fill: 'yellow', align: 'right' });
      label(ctx, 'Some heat escapes to space', X0 + 405, Y0 + 100, { size: 20, weight: 700, fill: 'red', align: 'right' });
      label(ctx, 'The warm ground gives off heat (infrared)', cx, Y0 + 588, { size: 20, weight: 700, fill: 'red' });
      wrapLabel(ctx, 'Greenhouse gases (carbon dioxide, methane, water vapour) absorb heat and send some back down', X0 + 30, Y0 + 632, FIG.w - 60, 19, 'center', 'ink', 600);
      label(ctx, more ? 'More greenhouse gas → more heat trapped → global warming' : 'Without it Earth would average about −18 °C; with it, about 15 °C', cx, Y0 + 682, { size: 19, weight: 600, fill: more ? 'orange' : 'muted' });
      ctx.restore();
    },
    // ─── Economics and business ───────────────────────────────────────────

    // Demand and supply curves crossing; a shift moves the equilibrium.
    'supply-demand'(b, ctx, it, t) {
      const sh = String(it.shift || it.kind || it.value || 'demand-right').toLowerCase();
      const sup = /supply/.test(sh); const left = /left|fall|decrease|down/.test(sh);
      const g = { x: X0 + 100, y: Y0 + 85, w: 600, h: 430 };
      const px = (q) => g.x + (q / 100) * g.w; const py = (p) => g.y + g.h - (p / 12) * g.h;
      const u = cycle(t, 9, 1.4); const amt = u < 1.5 ? 0 : u < 3 ? smooth((u - 1.5) / 1.5) : u < 6.5 ? 1 : u < 8 ? 1 - smooth((u - 6.5) / 1.5) : 0;
      const d = 20 * amt * (left ? -1 : 1); const dD = sup ? 0 : d; const dS = sup ? d : 0;
      const Dm = (q, s) => 9 - 0.08 * (q - s); const Sp = (q, s) => 1 + 0.08 * (q - s);
      const Qe = 50 + (dD + dS) / 2; const Pe = Sp(Qe, dS);
      const q = clamp(t / 1.2);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Supply and demand');
      axes(ctx, g, { xTicks: [0, 20, 40, 60, 80, 100].map((v) => [v / 100, v]), yTicks: [0, 2, 4, 6, 8, 10, 12].map((v) => [v / 12, `£${v}`]), xName: 'quantity', yName: 'price' });
      const curve = (f, s, c, w, dash) => { ctx.save(); ctx.beginPath(); ctx.rect(g.x, g.y, g.w, g.h); ctx.clip(); line(ctx, px(0), py(f(0, s)), px(100 * q), py(f(100 * q, s)), c, w, dash); ctx.restore(); };
      if (amt > 0.01) { ctx.save(); ctx.globalAlpha *= 0.45; if (sup) curve(Sp, 0, 'orange', 3, [8, 8]); else curve(Dm, 0, 'blue', 3, [8, 8]); ctx.restore(); }
      glow(ctx, COLORS.blue, 10); curve(Dm, dD, 'blue', 5); ctx.shadowBlur = 0;
      glow(ctx, COLORS.orange, 10); curve(Sp, dS, 'orange', 5); ctx.shadowBlur = 0;
      if (q >= 1) {
        label(ctx, amt > 0.01 && !sup ? 'D₂' : 'D', px(Math.min(100, 92 + dD * 0.4)) + 6, py(Dm(92 + dD * 0.4, dD)) - 22, { size: 22, weight: 800, fill: 'blue' });
        label(ctx, amt > 0.01 && sup ? 'S₂' : 'S', px(88 + dS * 0.1), py(Sp(88 + dS * 0.1, dS)) - 22, { size: 22, weight: 800, fill: 'orange' });
        if (amt > 0.2) {
          const P0 = sup ? 4 : 7; const qa = sup ? (P0 - 1) / 0.08 : (9 - P0) / 0.08; const qb = qa + d;
          ctx.save(); ctx.globalAlpha *= clamp((amt - 0.2) / 0.3); arr(ctx, px(qa), py(P0), px(qb), py(P0), 'yellow', 4); ctx.restore();
        }
        line(ctx, px(Qe), py(Pe), g.x, py(Pe), tint('ink', 0.6), 2, [6, 6]);
        line(ctx, px(Qe), py(Pe), px(Qe), g.y + g.h, tint('ink', 0.6), 2, [6, 6]);
        dot(ctx, px(Qe), py(Pe), 9, 'green', 16);
        chip(ctx, `£${Pe.toFixed(2)}`, g.x + 12, py(Pe) - 22, 'green', 18, 'left');
        chip(ctx, `${Math.round(Qe)} sold`, px(Qe) + 12, g.y + g.h - 24, 'green', 18, 'left');
      }
      const msg = amt < 0.05 ? 'Equilibrium: the price where supply meets demand' : `${sup ? 'Supply' : 'Demand'} ${left ? 'falls' : 'rises'}: price ${Pe > 5.001 ? 'up' : 'down'} to £${Pe.toFixed(2)}, ${Math.round(Qe)} sold`;
      chip(ctx, msg, cx, Y0 + 600, amt < 0.05 ? 'green' : 'yellow', 21);
      label(ctx, 'Demand: what buyers want at each price · Supply: what sellers offer', cx, Y0 + 655, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Costs and revenue lines crossing at the break-even point.
    'break-even'(b, ctx, it, t) {
      const FC = Math.max(1, val(it.fixed, 2000)); const VC = Math.max(0, val(it.variable, 5)); let P = val(it.price, 15); if (P <= VC) P = VC + 1;
      const be = FC / (P - VC); const qmax = Math.max(10, Math.ceil((be * 2) / 10) * 10); const ymax = P * qmax * 1.08;
      const g = { x: X0 + 110, y: Y0 + 90, w: 600, h: 420 };
      const px = (q) => g.x + (q / qmax) * g.w; const py = (v) => g.y + g.h - (v / ymax) * g.h;
      const xs = niceStep(qmax, 5); const ys = niceStep(ymax, 5);
      const xT = []; for (let v = 0; v <= qmax + 1e-9; v += xs) xT.push([v / qmax, v]);
      const yT = []; for (let v = 0; v <= ymax + 1e-9; v += ys) yT.push([v / ymax, money(v)]);
      const q = clamp((t - 0.3) / 1.5); const k = b.clock;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Break-even');
      if (t > 1.8) {
        ctx.save(); ctx.globalAlpha *= after(t, 1.8, 0.5);
        ctx.fillStyle = tint('red', 0.18); poly(ctx, [px(0), py(FC), px(be), py(P * be), px(0), py(0)], true); ctx.fill();
        ctx.fillStyle = tint('green', 0.18); poly(ctx, [px(be), py(P * be), px(qmax), py(P * qmax), px(qmax), py(FC + VC * qmax)], true); ctx.fill();
        label(ctx, 'loss', px(be * 0.3), py(FC * 0.75), { size: 20, weight: 800, fill: 'red' });
        label(ctx, 'profit', px(be + (qmax - be) * 0.75), py((P * qmax + FC + VC * qmax) / 2), { size: 20, weight: 800, fill: 'green' });
        ctx.restore();
      }
      axes(ctx, g, { xTicks: xT, yTicks: yT, xName: 'units sold', yName: 'costs and revenue' });
      const L = (f, c, w = 5, dash) => line(ctx, px(0), py(f(0)), px(qmax * q), py(f(qmax * q)), c, w, dash);
      L(() => FC, 'purple', 3, [10, 7]); L((x) => FC + VC * x, 'red'); glow(ctx, COLORS.green, 10); L((x) => P * x, 'green'); ctx.shadowBlur = 0;
      if (q >= 1) {
        label(ctx, 'Revenue', px(qmax) - 6, py(P * qmax) + 22, { size: 20, weight: 700, fill: 'green', align: 'right' });
        label(ctx, 'Total costs', px(qmax) - 6, py(FC + VC * qmax) + 22, { size: 20, weight: 700, fill: 'red', align: 'right' });
        label(ctx, 'Fixed costs', px(qmax) - 6, py(FC) + 20, { size: 19, weight: 700, fill: 'purple', align: 'right' });
        dot(ctx, px(be), py(P * be), 9, 'yellow', 18);
        label(ctx, `Break-even: ${Math.round(be)} units`, px(be) - 14, py(P * be) - 40, { size: 21, weight: 800, fill: 'yellow', align: 'right' });
        label(ctx, money(P * be), px(be) - 14, py(P * be) - 16, { size: 19, weight: 600, fill: 'yellow', align: 'right' });
        const q0 = qmax * (0.08 + 0.84 * smooth(tri(k * 0.12))); const pr = (P - VC) * q0 - FC;
        line(ctx, px(q0), g.y + g.h, px(q0), py(P * q0), tint('ink', 0.5), 2, [4, 5]);
        chip(ctx, `At ${Math.round(q0)} units: ${pr >= 0 ? 'profit' : 'loss'} ${money(Math.abs(pr))}`, cx, Y0 + 595, pr >= 0 ? 'green' : 'red', 21);
      }
      label(ctx, 'Break-even = fixed costs ÷ (price − variable cost per unit)', cx, Y0 + 640, { size: 19, weight: 600, fill: 'ink' });
      label(ctx, `= ${money(FC)} ÷ (${pounds(P)} − ${pounds(VC)}) = ${Math.round(be)} units`, cx, Y0 + 678, { size: 20, weight: 700, fill: 'yellow' });
      ctx.restore();
    },

    // The same basket of shopping costing more, year after year.
    inflation(b, ctx, it, t) {
      const C = it._c || (it._c = (() => {
        const start = Math.max(1, val(it.start ?? it.value, 50)); const from = Math.round(val(it.from, 2015));
        // UK CPI, annual average rate 2015 to 2024 (ONS series D7G7, checked 2026-10-24).
        const rates = nums(it.rates, [0.0, 0.7, 2.7, 2.5, 1.8, 0.9, 2.6, 9.1, 7.3, 2.5]).slice(0, 12);
        const prices = []; let p = start; rates.forEach((r, i) => { if (i) p *= 1 + r / 100; prices.push(p); });
        return { start, from, rates, prices };
      })());
      const { from, rates, prices } = C; const n = prices.length;
      const SD = 1.3; const u = cycle(t, n * SD + 2.5, 0.6); const kk = Math.min(n - 1, Math.floor(u / SD)); const f = u >= n * SD ? 1 : smooth((u - kk * SD) / 0.6);
      const now = kk ? lerp(prices[kk - 1], prices[kk], f) : prices[0];
      const g = { x: X0 + 90, y: Y0 + 330, w: 640, h: 250 }; const ymax = Math.max(...prices) * 1.15;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Inflation: the same shopping costs more');
      // Basket
      const bx = X0 + 140; const by = Y0 + 200;
      ctx.fillStyle = '#c98a3d'; rounded(ctx, bx - 60, by - 88, 30, 52, 8); ctx.fill();
      ctx.fillStyle = 'rgba(240,245,255,0.9)'; ctx.fillRect(bx - 20, by - 100, 28, 64); ctx.fillStyle = COLORS.blue; ctx.fillRect(bx - 20, by - 100, 28, 12);
      dot(ctx, bx + 32, by - 52, 17, 'red'); ctx.fillStyle = COLORS.yellow; poly(ctx, [bx + 55, by - 38, bx + 85, by - 38, bx + 70, by - 70], true); ctx.fill();
      ctx.fillStyle = tint('orange', 0.3); ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 3; poly(ctx, [bx - 95, by - 40, bx + 95, by - 40, bx + 75, by + 40, bx - 75, by + 40], true); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx - 80, by - 40); ctx.quadraticCurveTo(bx, by - 150, bx + 80, by - 40); ctx.stroke();
      ctx.strokeStyle = tint('orange', 0.6); ctx.lineWidth = 2; ctx.beginPath(); for (let j = -2; j <= 2; j++) { ctx.moveTo(bx + j * 30, by - 40); ctx.lineTo(bx + j * 24, by + 40); } ctx.stroke();
      label(ctx, `In ${from + kk} this basket costs`, X0 + 290, Y0 + 110, { size: 22, weight: 600, fill: 'muted', align: 'left' });
      glow(ctx, COLORS.cyan, 16); label(ctx, `£${now.toFixed(2)}`, X0 + 290, Y0 + 165, { size: 48, weight: 800, fill: 'cyan', align: 'left' }); ctx.shadowBlur = 0;
      if (kk) chip(ctx, `prices rose ${fx(rates[kk])}% that year`, X0 + 290, Y0 + 228, rates[kk] >= 4 ? 'red' : 'orange', 20, 'left');
      else chip(ctx, 'the starting price', X0 + 290, Y0 + 228, 'muted', 20, 'left');
      const ys = niceStep(ymax, 4); const yT = []; for (let v = 0; v <= ymax; v += ys) yT.push([v / ymax, `£${v}`]);
      axes(ctx, g, { xTicks: prices.map((_, i) => [(i + 0.5) / n, String(from + i)]), yTicks: yT });
      const bwid = g.w / n;
      for (let i = 0; i < n; i++) {
        const x = g.x + (i + 0.5) * bwid; const h = (prices[i] / ymax) * g.h * (i < kk ? 1 : i === kk ? f : 0);
        ctx.strokeStyle = tint('cyan', 0.35); ctx.lineWidth = 1.5; ctx.strokeRect(x - bwid * 0.32, g.y + g.h - (prices[i] / ymax) * g.h, bwid * 0.64, (prices[i] / ymax) * g.h);
        if (h > 0) { ctx.fillStyle = tint(i === kk ? 'cyan' : 'blue', i === kk ? 0.6 : 0.35); ctx.fillRect(x - bwid * 0.32, g.y + g.h - h, bwid * 0.64, h); }
      }
      const xk = g.x + (kk + 0.5) * bwid; label(ctx, `£${now.toFixed(2)}`, xk, g.y + g.h - (now / ymax) * g.h - 16, { size: 18, weight: 700, fill: 'cyan' });
      if (u >= n * SD) chip(ctx, `Same basket: £${prices[0].toFixed(2)} in ${from} → £${prices[n - 1].toFixed(2)} in ${from + n - 1}`, cx, Y0 + 640, 'yellow', 21);
      label(ctx, 'Inflation: prices rise, so each pound buys a little less', cx, Y0 + 688, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Revenue against stacked costs; what is left is profit (or a loss).
    'profit-loss'(b, ctx, it, t) {
      const C = it._c || (it._c = (() => {
        const rev = Math.max(1, val(it.revenue ?? it.value, 12000));
        const costs = strs(it.costs ?? it.items, ['Wages: 5000', 'Materials: 3000', 'Rent: 2000']).map((s) => { const m = String(s).match(/^(.*?)[:=]\s*£?\s*([\d,.]+)/); return m ? [m[1].trim(), Number(m[2].replace(/,/g, ''))] : null; }).filter((c) => c && c[1] > 0).slice(0, 5);
        if (!costs.length) costs.push(['Costs', rev * 0.8]);
        const total = costs.reduce((s, c) => s + c[1], 0);
        const revB = rev >= total ? Math.round((total * 0.9) / 100) * 100 : Math.round((total * 1.2) / 100) * 100;
        return { rev, costs, total, revB };
      })());
      const { rev, costs, total, revB } = C;
      const u = cycle(t, 10, 2.4); const m = u < 4 ? 0 : u < 5 ? smooth(u - 4) : u < 9 ? 1 : 1 - smooth(u - 9);
      const R = lerp(rev, revB, m); const pr = R - total;
      const maxV = Math.max(rev, revB, total) * 1.1; const maxLoss = Math.max(1, total - Math.min(rev, revB));
      const sc = Math.min(340 / maxV, 120 / maxLoss); const y0 = Y0 + 460;
      const SEG = ['orange', 'purple', 'yellow', 'teal', 'cyan'];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Profit and loss');
      line(ctx, X0 + 60, y0, X1 - 40, y0, LINE, 2);
      const rq = after(t, 0.2, 0.8); const rh = R * sc * rq;
      glow(ctx, COLORS.blue, 12); ctx.fillStyle = tint('blue', 0.4); ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 2.5; rounded(ctx, X0 + 110, y0 - rh, 120, rh, 8); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      if (rq > 0.5) label(ctx, money(R), X0 + 170, y0 - rh - 20, { size: 22, weight: 800, fill: 'blue' });
      let acc = 0;
      costs.forEach(([name, v], i) => {
        const q = after(t, 0.9 + i * 0.3, 0.4); if (q <= 0) return;
        const h = v * sc * q; const top = y0 - acc - h; const c = SEG[i % SEG.length];
        ctx.fillStyle = tint(c, 0.42); ctx.strokeStyle = color(c); ctx.lineWidth = 2; ctx.fillRect(X0 + 290, top, 120, h); ctx.strokeRect(X0 + 290, top, 120, h);
        if (h > 26) label(ctx, money(v), X0 + 350, top + h / 2, { size: 18, weight: 700, fill: 'ink' });
        if (h > 20) label(ctx, name, X0 + 422, top + h / 2, { size: 18, weight: 700, fill: c, align: 'left' });
        acc += h;
      });
      if (acc > 0) label(ctx, money(total), X0 + 350, y0 - acc - 20, { size: 22, weight: 800, fill: 'orange' });
      const pq = after(t, 1.0 + costs.length * 0.3, 0.5);
      if (pq > 0) {
        const ph = Math.abs(pr) * sc * pq; const c = pr >= 0 ? 'green' : 'red';
        glow(ctx, color(c), 14); ctx.fillStyle = tint(c, 0.45); ctx.strokeStyle = color(c); ctx.lineWidth = 2.5;
        if (pr >= 0) rounded(ctx, X0 + 600, y0 - ph, 120, Math.max(1, ph), 8); else rounded(ctx, X0 + 600, y0, 120, Math.max(1, ph), 8);
        ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
        label(ctx, money(pr), X0 + 660, pr >= 0 ? y0 - ph - 20 : y0 + ph + 20, { size: 22, weight: 800, fill: c });
        line(ctx, X0 + 230, y0 - R * sc, X0 + 600, y0 - R * sc, tint('blue', 0.5), 1.5, [5, 6]);
      }
      const ny = y0 + Math.max(36, (pr < 0 ? Math.abs(pr) * sc : 0) + 48);
      label(ctx, 'Revenue', X0 + 170, ny, { size: 21, weight: 700, fill: 'blue' });
      label(ctx, 'Costs', X0 + 350, ny, { size: 21, weight: 700, fill: 'orange' });
      label(ctx, pr >= 0 ? 'Profit' : 'Loss', X0 + 660, ny, { size: 21, weight: 700, fill: pr >= 0 ? 'green' : 'red' });
      label(ctx, `Profit = revenue − costs = ${money(R)} − ${money(total)} = ${money(pr)}`, cx, Y0 + 625, { size: 21, weight: 700, fill: 'ink' });
      chip(ctx, pr >= 0 ? 'Revenue is more than costs: a profit' : 'Costs are more than revenue: a loss', cx, Y0 + 675, pr >= 0 ? 'green' : 'red', 20);
      ctx.restore();
    },

    // ─── English and humanities ───────────────────────────────────────────

    // A sentence with each word coloured and named by its word class.
    'parts-of-speech'(b, ctx, it, t) {
      const C = it._c || (it._c = (() => {
        const POS = { noun: ['blue', 'a person, place or thing'], verb: ['red', 'a doing or being word'], adjective: ['green', 'describes a noun'], adverb: ['purple', 'describes a verb: how, when or where'], pronoun: ['orange', 'stands in for a noun'], preposition: ['yellow', 'shows where or when something is'], conjunction: ['teal', 'joins words or parts of a sentence'], determiner: ['cyan', 'comes before a noun: the, a, my'] };
        const L = (s) => new Set(s.split(' '));
        const DET = L('the a an this that these those my your his her its our their some every each any no');
        const PRON = L('i me you he him she it we us they them myself yourself himself herself itself ourselves themselves mine yours hers ours theirs who');
        const PREP = L('in on at over under above below into onto from to with without by through across behind beside between near of off up down around after before during for past towards toward inside outside along');
        const CONJ = L('and but or so because although while when if yet unless since nor');
        const ADV = L('very quickly slowly quietly loudly always never often soon now then here there too really almost happily sadly carefully gently suddenly well');
        const VERB = L('is am are was were be been being has have had do does did can could will would should may might must go goes went run runs ran jump jumps jumped eat eats ate sit sits sat see sees saw play plays played like likes love loves make makes made take takes took come comes came say says said sing sings sang swim swims swam fly flies flew write writes wrote read reads walk walks walked chase chases chased bark barks barked sleep sleeps slept climb climbs found gave give gives get gets got look looks looked open opens shout shouts laugh laughs cry cries smile smiles think thinks thought know knows knew want wants help helps need needs live lives grow grows grew');
        const ADJ = L('quick brown lazy big small little tall short happy sad red blue green yellow black white old young new good bad hot cold slow fast beautiful ugly huge tiny bright dark kind brave clever funny loud quiet soft hard shiny fluffy hungry sleepy angry scary gentle tired long busy cheerful noisy wet dry heavy light warm cool sunny rainy');
        const NOUNLY = L('family fly jelly belly holly lily bully ally rally supply reply');
        const tag = (w) => {
          const x = w.toLowerCase();
          if (DET.has(x)) return 'determiner'; if (PRON.has(x)) return 'pronoun'; if (PREP.has(x)) return 'preposition'; if (CONJ.has(x)) return 'conjunction';
          if (VERB.has(x)) return 'verb'; if (ADJ.has(x)) return 'adjective'; if (ADV.has(x)) return 'adverb';
          if (/ly$/.test(x) && x.length > 4 && !NOUNLY.has(x)) return 'adverb';
          if (/(ous|ful|ive|able|ible|less|ish)$/.test(x) && x.length > 5) return 'adjective';
          if (/ed$/.test(x) && x.length > 4) return 'verb';
          return 'noun';
        };
        const src = String(it.sentence || it.value || 'The quick brown fox jumps over the lazy dog.').slice(0, 140);
        const words = src.split(/\s+/).filter(Boolean).slice(0, 16).map((raw) => {
          const m = raw.match(/^(.*?)\/([a-z]+)([.,!?;:]*)$/i);
          if (m && POS[m[2].toLowerCase()]) return { text: m[1] + m[3], pos: m[2].toLowerCase() };
          const core = raw.replace(/[^A-Za-z'’-]/g, '');
          return { text: raw, pos: core ? tag(core.replace(/['’]s$/, '')) : null };
        });
        const cats = [...new Set(words.map((w) => w.pos).filter(Boolean))];
        return { POS, words, cats, laid: null };
      })());
      const { POS, cats } = C;
      if (!C.laid) {
        const lines = [[]]; let w = 0;
        for (const wd of C.words) {
          ctx.font = `700 34px ${FONT}`; const a = ctx.measureText(wd.text).width;
          ctx.font = `600 18px ${FONT}`; const bb = wd.pos ? ctx.measureText(wd.pos).width : 0;
          const cw = Math.max(a, bb) + 24;
          if (w + cw > 750 && lines[lines.length - 1].length) { lines.push([]); w = 0; }
          lines[lines.length - 1].push({ ...wd, w: cw }); w += cw;
        }
        C.laid = lines.slice(0, 3).flatMap((ln, li) => { const tot = ln.reduce((s, x) => s + x.w, 0); let x = cx - tot / 2; return ln.map((wd) => { const o = { ...wd, x: x + wd.w / 2, y: Y0 + 150 + li * 125 }; x += wd.w; return o; }); });
      }
      const T0 = 0.4 + C.laid.length * 0.22 + 0.6;
      const hi = t > T0 && cats.length ? cats[Math.floor((t - T0) / 2.4) % cats.length] : null;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Parts of speech');
      C.laid.forEach((wd, i) => {
        const a = after(t, 0.4 + i * 0.22, 0.35); if (a <= 0) return;
        const c = wd.pos ? POS[wd.pos][0] : 'muted'; const on = hi && wd.pos === hi;
        ctx.save(); ctx.globalAlpha *= a * (hi && !on ? 0.4 : 1);
        ctx.fillStyle = tint(c, on ? 0.34 : 0.13); rounded(ctx, wd.x - wd.w / 2 + 5, wd.y - 30, wd.w - 10, 60, 10); ctx.fill();
        ctx.fillStyle = color(c); ctx.fillRect(wd.x - wd.w / 2 + 10, wd.y + 26, wd.w - 20, 4);
        label(ctx, wd.text, wd.x, wd.y, { size: 34, weight: 700, fill: 'ink' });
        if (wd.pos) label(ctx, wd.pos, wd.x, wd.y + 50, { size: 18, weight: 600, fill: c });
        ctx.restore();
      });
      cats.slice(0, 8).forEach((p, i) => {
        const x = X0 + 30 + (i % 4) * 192; const y = Y0 + 560 + Math.floor(i / 4) * 40; const c = POS[p][0];
        const count = C.words.filter((w) => w.pos === p).length;
        ctx.save(); ctx.globalAlpha *= after(t, T0 - 0.5) * (hi && hi !== p ? 0.5 : 1);
        dot(ctx, x + 8, y, 8, c); label(ctx, `${p} (${count})`, x + 24, y, { size: 19, weight: 700, fill: c, align: 'left' });
        ctx.restore();
      });
      if (hi) label(ctx, `A ${hi} ${POS[hi][1]}`, cx, Y0 + 672, { size: 23, weight: 700, fill: POS[hi][0] });
      ctx.restore();
    },

    // Exposition up to the climax and down to the resolution, a marker walking it.
    'story-mountain'(b, ctx, it, t) {
      const C = it._c || (it._c = (() => {
        const ctrl = [[X0 + 30, Y0 + 460], [X0 + 170, Y0 + 460], [X0 + 300, Y0 + 330], [X0 + 400, Y0 + 175], [X0 + 430, Y0 + 155], [X0 + 470, Y0 + 180], [X0 + 590, Y0 + 360], [X0 + 660, Y0 + 410], [X1 - 30, Y0 + 410]];
        const pts = [];
        for (let i = 0; i < ctrl.length - 1; i++) {
          const p0 = ctrl[Math.max(0, i - 1)]; const p1 = ctrl[i]; const p2 = ctrl[i + 1]; const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
          for (let s = 0; s < 10; s++) { const v = s / 10; const f = (a, c1, c2, d) => 0.5 * (2 * c1 + (-a + c2) * v + (2 * a - 5 * c1 + 4 * c2 - d) * v * v + (-a + 3 * c1 - 3 * c2 + d) * v * v * v); pts.push(f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])); }
        }
        pts.push(...ctrl[ctrl.length - 1]);
        const p = mkPath(pts);
        let top = 1; for (let i = 1; i < pts.length / 2; i++) if (pts[2 * i + 1] < pts[2 * top + 1]) top = i;
        const pk = p.cum[top] / p.total;
        const items = strs(it.items, null);
        return { p, pts, fr: [0.07, pk * 0.62, pk, pk + (1 - pk) * 0.42, 0.93], items: items && items.length >= 5 ? items.slice(0, 5) : null };
      })());
      const STAGES = [['Exposition', 'Meet the characters and the setting', 'cyan', 0, -42, 'center'], ['Rising action', 'A problem starts and the tension builds', 'blue', -26, -8, 'right'], ['Climax', 'The most exciting, tense moment', 'red', 0, -40, 'center'], ['Falling action', 'Things start to calm down', 'purple', 26, -8, 'left'], ['Resolution', 'The problem is solved: how it all ends', 'green', 0, -42, 'center']];
      const { p, pts, fr } = C;
      const u = cycle(t, 12, 1.2); const mf = clamp(u / 10.5);
      let cur = 0; for (let i = 0; i < 5; i++) if (mf >= fr[i] - 0.03) cur = i;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Story mountain');
      const dq = clamp(t / 1.2);
      ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0, FIG.w * dq + 1, FIG.h); ctx.clip();
      const mg = ctx.createLinearGradient(0, Y0 + 150, 0, Y0 + 500); mg.addColorStop(0, 'rgba(91,140,255,0.28)'); mg.addColorStop(1, 'rgba(91,140,255,0.03)');
      ctx.fillStyle = mg; poly(ctx, [...pts, X1 - 30, Y0 + 500, X0 + 30, Y0 + 500], true); ctx.fill();
      glow(ctx, COLORS.blue, 10); ctx.strokeStyle = 'rgba(220,230,255,0.9)'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; poly(ctx, pts); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.restore();
      STAGES.forEach(([name, , c, ox, oy, al], i) => {
        const P = at(p, fr[i] * p.total); const on = i === cur && t > 1.2;
        ctx.save(); ctx.globalAlpha *= after(t, 0.5 + i * 0.2);
        dot(ctx, P.x, P.y, on ? 10 : 7, c);
        label(ctx, name, P.x + ox, P.y + oy, { size: on ? 23 : 20, weight: on ? 800 : 600, fill: c, align: al });
        ctx.restore();
      });
      if (t > 1.2) {
        const M = at(p, mf * p.total);
        dot(ctx, M.x, M.y - 14, 12, 'yellow', 16);
        line(ctx, M.x, M.y - 26, M.x, M.y - 62, 'ink', 3);
        ctx.fillStyle = COLORS.yellow; poly(ctx, [M.x, M.y - 62, M.x + 24, M.y - 54, M.x, M.y - 46], true); ctx.fill();
      }
      const [name, desc, c] = STAGES[cur];
      panel(ctx, X0 + 20, Y0 + 540, FIG.w - 40, 120, c, 0.08, 16);
      label(ctx, name, cx, Y0 + 572, { size: 24, weight: 800, fill: c });
      para(ctx, C.items ? C.items[cur] : desc, X0 + 40, Y0 + 618, FIG.w - 80, 21, 'ink', 500, 2);
      ctx.restore();
    },

    // Ethos, pathos and logos as three cards with examples.
    'persuasive-techniques'(b, ctx, it, t) {
      const k = b.clock;
      const CARDS = [['Ethos', 'Trust: who is speaking', String(it.ethos || 'As a doctor for 20 years, I trust it.'), 'purple', 'experts, experience, honesty'], ['Pathos', 'Emotion: how it makes you feel', String(it.pathos || 'Imagine a puppy, cold and alone tonight.'), 'red', 'stories, vivid words, feelings'], ['Logos', 'Logic: facts and reasons', String(it.logos || '9 out of 10 users saw results in a week.'), 'blue', 'statistics, evidence, reasons']];
      const hi = t < 1.6 ? -1 : Math.floor((t - 1.6) / 2.6) % 3;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Persuasive techniques');
      CARDS.forEach(([name, sub, ex, c, uses], i) => {
        const x = X0 + 18 + i * 262; const w = 240; const on = i === hi; const y = Y0 + 70 - (on ? 10 : 0); const h = 480; const xc = x + w / 2;
        const sc = after(t, i * 0.3, 0.5); if (sc <= 0) return;
        ctx.save(); ctx.translate(xc, 0); ctx.scale(sc, 1); ctx.translate(-xc, 0);
        ctx.globalAlpha *= hi >= 0 && !on ? 0.6 : 1;
        if (on) glow(ctx, color(c), 18);
        panel(ctx, x, y, w, h, c, on ? 0.16 : 0.08, 18); ctx.shadowBlur = 0;
        const iy = y + 85;
        ctx.fillStyle = tint(c, 0.35); ctx.strokeStyle = color(c); ctx.lineWidth = 3;
        if (i === 0) { poly(ctx, [xc, iy - 42, xc + 36, iy - 28, xc + 32, iy + 12, xc, iy + 40, xc - 32, iy + 12, xc - 36, iy - 28], true); ctx.fill(); ctx.stroke(); ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(xc - 14, iy); ctx.lineTo(xc - 3, iy + 12); ctx.lineTo(xc + 16, iy - 12); ctx.stroke(); }
        else if (i === 1) { const s = 1 + 0.08 * Math.max(0, Math.sin(k * 5)); ctx.save(); ctx.translate(xc, iy); ctx.scale(s, s); ctx.beginPath(); ctx.moveTo(0, 30); ctx.bezierCurveTo(-48, -2, -30, -44, 0, -20); ctx.bezierCurveTo(30, -44, 48, -2, 0, 30); ctx.fill(); ctx.stroke(); ctx.restore(); }
        else { for (let j = 0; j < 3; j++) { const bh = 22 + j * 18; ctx.fillRect(xc - 36 + j * 26, iy + 34 - bh, 20, bh); ctx.strokeRect(xc - 36 + j * 26, iy + 34 - bh, 20, bh); } arr(ctx, xc - 40, iy + 8, xc + 36, iy - 36, c, 3); }
        label(ctx, name, xc, y + 172, { size: 32, weight: 800, fill: c });
        para(ctx, sub, x + 14, y + 222, w - 28, 19, 'ink', 600, 2);
        line(ctx, x + 30, y + 262, x + w - 30, y + 262, tint(c, 0.5), 2);
        label(ctx, 'for example', xc, y + 290, { size: 18, weight: 500, fill: 'muted' });
        para(ctx, `“${ex}”`, x + 14, y + 345, w - 28, 20, 'ink', 500, 3);
        label(ctx, 'uses', xc, y + 410, { size: 18, weight: 500, fill: 'muted' });
        para(ctx, uses, x + 14, y + 442, w - 28, 18, c, 700, 2);
        ctx.restore();
      });
      label(ctx, 'Strong persuasive writing uses all three', cx, Y0 + 598, { size: 22, weight: 700, fill: 'ink' });
      label(ctx, 'Also: rhetorical questions, the rule of three, repetition', cx, Y0 + 640, { size: 19, weight: 500, fill: 'muted' });
      label(ctx, 'Aristotle named these three appeals over 2,300 years ago', cx, Y0 + 680, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Events in order along a line, a "now" marker moving through them.
    'timeline-history'(b, ctx, it, t) {
      const C = it._c || (it._c = (() => {
        const parse = (list) => list.map((s) => { const m = String(s).match(/^\s*((?:c\.\s*)?(?:AD\s*)?(\d[\d,]*)\s*(BCE|BC|AD|CE)?)\s*[:–—-]\s*(.+)$/i); if (!m) return null; const n = Number(m[2].replace(/,/g, '')); return { year: m[1].trim(), v: /^bc/i.test(m[3] || '') ? -n : n, text: m[4].trim() }; }).filter(Boolean).sort((p, q) => p.v - q.v).slice(0, 8);
        const def = ['3200 BC: Writing begins in Sumer', '776 BC: The first Olympic Games', '1440: Gutenberg’s printing press', '1769: Watt’s improved steam engine', '1914: World War I begins', '1969: The first Moon landing', '1989: The World Wide Web is invented'];
        let rows = parse(strs(it.items, def)); if (rows.length < 2) rows = parse(def);
        return { rows };
      })());
      const { rows } = C; const n = rows.length; const ay = Y0 + 320; const gap = 660 / (n - 1); const xi = (i) => X0 + 70 + i * gap;
      const w = Math.min(200, 2 * gap - 14); const h = 96;
      const u = cycle(t, n * 1.6 + 1.5, 1.6); const pos = clamp(u / (n * 1.6)) * (n - 1); const cur = Math.min(n - 1, Math.floor(pos + 1e-6));
      const mx = lerp(xi(Math.floor(pos)), xi(Math.min(n - 1, Math.floor(pos) + 1)), smooth(pos - Math.floor(pos)));
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Timeline');
      const lq = clamp(t / 0.8);
      arr(ctx, X0 + 30, ay, lerp(X0 + 30, X1 - 20, lq), ay, 'rgba(220,230,255,0.8)', 4);
      rows.forEach((r, i) => {
        const a = after(t, 0.4 + i * 0.2); if (a <= 0) return;
        const x = xi(i); const up = i % 2 === 0; const c = HUES[i % HUES.length]; const on = t > 1.6 && i === cur;
        const bx = clamp(x - w / 2, X0 + 4, X1 - 4 - w); const by = up ? ay - 58 - h : ay + 58;
        ctx.save(); ctx.globalAlpha *= a;
        line(ctx, x, up ? ay - 12 : ay + 12, clamp(x, bx + 12, bx + w - 12), up ? by + h : by, tint(c, 0.7), 2);
        if (on) glow(ctx, color(c), 16);
        panel(ctx, bx, by, w, h, c, on ? 0.24 : 0.08, 12); ctx.shadowBlur = 0;
        dot(ctx, x, ay, on ? 12 : 8, c);
        label(ctx, r.year, bx + w / 2, by + 22, { size: 21, weight: 800, fill: c });
        para(ctx, r.text, bx + 10, by + 62, w - 20, 18, 'ink', on ? 700 : 500, 2);
        ctx.restore();
      });
      if (t > 1.6) {
        ctx.fillStyle = COLORS.yellow; poly(ctx, [mx, ay - 16, mx - 10, ay - 34, mx + 10, ay - 34], true); ctx.fill();
        label(ctx, 'now', mx, ay + 30, { size: 18, weight: 800, fill: 'yellow' });
        const r = rows[cur]; const prev = rows[cur - 1];
        chip(ctx, `${r.year}: ${r.text}`, cx, Y0 + 600, HUES[cur % HUES.length], 22);
        if (prev) { const yrs = r.v - prev.v - (prev.v < 0 && r.v > 0 ? 1 : 0); label(ctx, `${commas(yrs)} years after the one before`, cx, Y0 + 648, { size: 19, weight: 600, fill: 'muted' }); }
      }
      label(ctx, 'Events are in order, spaced evenly (not to scale)', cx, Y0 + 688, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Sensory, short-term and long-term memory, with items flowing and forgotten.
    'memory-model'(b, ctx, it, t) {
      const k = b.clock; const by = Y0 + 200; const bw = 230; const bh = 140; const lane = by + 30;
      const BX = [[X0 + 10, 'Sensory memory', 'under 2 seconds; very large', 'cyan'], [X0 + 285, 'Short-term memory', '18–30 seconds; 7 ± 2 items', 'purple'], [X0 + 560, 'Long-term memory', 'a lifetime; no known limit', 'green']];
      const xc = (i) => BX[i][0] + bw / 2;
      const C = it._c || (it._c = (() => {
        const top = [xc(0), by - 70];
        const arc = []; for (let j = 0; j <= 14; j++) { const a = Math.PI + (j / 14) * Math.PI; arc.push(xc(1) + Math.cos(a) * 60, lane - 4 + Math.sin(a) * 74); }
        const paths = [
          mkPath([...top, xc(0), lane, xc(0) + 40, lane]),
          mkPath([...top, xc(0), lane, xc(1) + 30, lane]),
          mkPath([...top, xc(0), lane, xc(2), lane]),
          mkPath([...top, xc(0), lane, xc(1) - 60, lane, ...arc, xc(1) + 60, lane, xc(2) + 20, lane]),
        ];
        return { paths };
      })());
      const FATE = [0, 0, 1, 0, 3, 0, 1, 2, 0, 3];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The multi-store model of memory');
      BX.forEach(([x, name, detail, c], i) => {
        ctx.save(); ctx.globalAlpha *= after(t, i * 0.25, 0.45);
        panel(ctx, x, by, bw, bh, c, 0.12, 14);
        line(ctx, x + 14, lane + 22, x + bw - 14, lane + 22, tint(c, 0.35), 1.5);
        label(ctx, name, x + bw / 2, by + 76, { size: 21, weight: 800, fill: c });
        para(ctx, detail, x + 12, by + 112, bw - 24, 18, 'ink', 500, 2);
        ctx.restore();
      });
      arr(ctx, xc(0), by - 70, xc(0), lane - 14, 'cyan', 4);
      label(ctx, 'information from the senses', X0 + 14, by - 88, { size: 18, weight: 600, fill: 'muted', align: 'left' });
      arr(ctx, BX[0][0] + bw + 3, lane, BX[1][0] - 3, lane, 'ink', 4); label(ctx, 'attention', (BX[0][0] + bw + BX[1][0]) / 2, by - 18, { size: 18, weight: 700, fill: 'ink' });
      arr(ctx, BX[1][0] + bw + 3, lane, BX[2][0] - 3, lane, 'ink', 4); label(ctx, 'encoding', (BX[1][0] + bw + BX[2][0]) / 2, by - 18, { size: 18, weight: 700, fill: 'ink' });
      ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(xc(1), lane - 4, 60, Math.PI + 0.35, TAU - 0.45); ctx.stroke();
      arr(ctx, xc(1) + 48, lane - 46, xc(1) + 58, lane - 22, 'purple', 3);
      label(ctx, 'rehearsal', xc(1), by - 64, { size: 18, weight: 700, fill: 'purple' });
      ctx.strokeStyle = COLORS.green; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(BX[2][0] + 30, by + bh + 4); ctx.quadraticCurveTo((BX[1][0] + bw + BX[2][0]) / 2, by + bh + 44, BX[1][0] + bw - 24, by + bh + 10); ctx.stroke();
      arr(ctx, BX[1][0] + bw - 10, by + bh + 18, BX[1][0] + bw - 26, by + bh + 8, 'green', 3);
      label(ctx, 'retrieval', (BX[1][0] + bw + BX[2][0]) / 2, by + bh + 52, { size: 18, weight: 700, fill: 'green' });
      for (let i = 0; i < 3; i++) arr(ctx, xc(i) - (i === 2 ? 40 : 0), by + bh + 4, xc(i) - (i === 2 ? 40 : 0), by + bh + 62, tint('red', 0.7), 3);
      label(ctx, 'decay', xc(0), by + bh + 84, { size: 18, weight: 600, fill: 'red' });
      label(ctx, 'displacement, decay', xc(1), by + bh + 84, { size: 18, weight: 600, fill: 'red' });
      label(ctx, 'interference', xc(2) - 40, by + bh + 84, { size: 18, weight: 600, fill: 'red' });
      label(ctx, 'forgetting', cx, by + bh + 116, { size: 19, weight: 700, fill: 'red' });
      if (t > 1) {
        for (let j = 0; j < 10; j++) {
          const ph = mod(k - j * 0.6, 6) / 6; const P = C.paths[FATE[j]]; const q = clamp(ph * 1.25);
          const pt = at(P, q * P.total); const a = Math.min(clamp(ph / 0.05), clamp((1 - ph) / 0.18));
          ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = COLORS.yellow; rounded(ctx, pt.x - 7, pt.y - 7, 14, 14, 4); ctx.fill(); ctx.restore();
        }
      }
      const FACTS = [['Attention moves information into short-term memory', 'ink'], ['Rehearsal keeps it there and helps it into long-term memory', 'purple'], ['Retrieval brings a memory back when we need it', 'green'], ['Without attention or rehearsal, information is forgotten', 'red']];
      const fi = Math.floor(cycle(t, 12, 1.5) / 3) % 4;
      chip(ctx, FACTS[fi][0], cx, Y0 + 600, FACTS[fi][1], 20);
      label(ctx, "Atkinson and Shiffrin's multi-store model (1968)", cx, Y0 + 655, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },
  };
}
