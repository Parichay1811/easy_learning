// Draws every explainer op of every lesson pack through its engine
// (public/sims-explain.js) on a fake canvas, at several moments and with
// and without `focus`, so a crash shows up with the pack it came from.
// Synthetic ops then hit every icon, silhouette, part kind, motion, link
// kind, shape, state and wave, circuit part, beam layout and curve type,
// plus odd and missing fields.
//   node test/explainer-render.mjs              every pack under packs/
//   node test/explainer-render.mjs packs/HOWN   one folder or file
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ICONS, BODIES, PART_KINDS, MOTIONS, LINK_KINDS, MOODS, ENGINES, CIRCUIT_KINDS, CURVE_TYPES, explainerProblems } from '../shared/explainer-spec.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

// A canvas context that accepts every call, counts draws and checks that
// save and restore stay paired.
function fakeCtx() {
  let draws = 0; let depth = 0; let minDepth = 0;
  const gradient = { addColorStop() {} };
  const target = {
    canvas: { width: 1600, height: 900 },
    measureText: (t) => ({ width: String(t).length * 11 }),
    createLinearGradient: () => gradient, createRadialGradient: () => gradient, createConicGradient: () => gradient,
    createPattern: () => ({}), getImageData: () => ({ data: new Uint8ClampedArray(4) }), isPointInPath: () => false,
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }), getLineDash: () => [],
    save: () => { depth++; }, restore: () => { depth--; minDepth = Math.min(minDepth, depth); },
  };
  return new Proxy(target, {
    get(t, k) {
      if (k === 'draws') return draws;
      if (k === 'depth') return depth;
      if (k === 'minDepth') return minDepth;
      if (k in t) return t[k];
      if (/^(fill|stroke|draw|clear)/.test(String(k))) return (...a) => { for (const v of a) if (typeof v === 'number' && !Number.isFinite(v)) throw new Error(`${String(k)} got ${v}`); draws++; };
      return () => {};
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

const FIG = { x: 60, y: 120, w: 800, h: 700 };
const COLORS = { ink: '#e9eeff', muted: '#93a0c4', cyan: '#22d3ee', blue: '#5b8cff', orange: '#ff9f43', green: '#34d399', red: '#fb7185', purple: '#a78bfa', yellow: '#fbbf24', teal: '#2dd4bf', surface: 'rgba(255,255,255,0.05)', line: 'rgba(140,170,255,0.18)' };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const color = (c) => COLORS[c] || c || COLORS.ink;
const tint = (c, a) => {
  const hex = color(c).replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) throw new Error(`tint got "${c}"`);
  const n = parseInt(hex, 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
const kit = {
  FIG, COL: { x: 920, y: 150, w: 620 }, COLORS, HUES: ['blue', 'cyan', 'purple', 'teal', 'orange', 'green'], FONT: 'Lexend, sans-serif',
  glow: (ctx, c, b) => { ctx.shadowColor = c; ctx.shadowBlur = b; },
  label: (ctx, text) => { if (typeof text !== 'string' && typeof text !== 'number') throw new Error(`label got ${typeof text}`); ctx.fillText(String(text), 0, 0); },
  wrapLabel: (ctx, text) => { ctx.fillText(String(text ?? ''), 0, 0); },
  rounded: (ctx, x, y, w, h) => { for (const v of [x, y, w, h]) if (!Number.isFinite(v)) throw new Error(`rounded got ${v}`); ctx.beginPath(); },
  arrow: (ctx, x0, y0, x1, y1) => { for (const v of [x0, y0, x1, y1]) if (!Number.isFinite(v)) throw new Error(`arrow got ${v}`); ctx.stroke(); },
  clamp, easeOut: (p) => 1 - (1 - p) ** 3, outBack: (p) => { const c = 1.6; return 1 + (c + 1) * (p - 1) ** 3 + c * (p - 1) ** 2; },
  color, tint,
};

// A browser module: its /shared/ imports are pointed at the shared folder.
const src = fs.readFileSync(path.join(root, 'public', 'sims-explain.js'), 'utf8').replace(/from\s+'\/shared\//g, `from '${pathToFileURL(path.join(root, 'shared')).href}/`);
const mod = await import(`data:text/javascript;base64,${Buffer.from(src).toString('base64')}`);
const sims = mod.explainSims(kit);
const TIMES = [0, 0.3, 1, 2.2, 4, 7.5, 13, 31];

// Runs one op; returns problems (empty when it drew cleanly).
function run(op) {
  const out = [];
  const draw = sims[op.name];
  if (!draw) return [`no engine ${op.name}`];
  for (const focus of [undefined, 0, 2, 99]) {
    const it = { ...op, ...(focus === undefined ? {} : { focus }) };
    if (focus === undefined && op.focus !== undefined) it.focus = op.focus;
    let drew = 0;
    for (const t of TIMES) {
      const ctx = fakeCtx(); const b = { clock: t + 50, hits: [] };
      const t0 = performance.now();
      try { draw(b, ctx, it, t); } catch (e) { out.push(`crash at t=${t} focus=${focus}: ${e.stack.split('\n').slice(0, 2).join(' | ')}`); break; }
      const ms = performance.now() - t0;
      if (ms > 25 && t > 0) out.push(`slow: ${ms.toFixed(1)} ms at t=${t}`);
      if (ctx.depth !== 0 || ctx.minDepth < 0) out.push(`save/restore unbalanced at t=${t}`);
      drew = Math.max(drew, ctx.draws);
      for (const h of b.hits) {
        if (typeof h.i !== 'string' || !h.i.trim()) out.push(`hit without words at t=${t}`);
        if (![h.x, h.y, h.w, h.h].every(Number.isFinite)) out.push(`hit with bad box at t=${t}`);
        else if (h.x < FIG.x - 2 || h.y < FIG.y - 2 || h.x + h.w > FIG.x + FIG.w + 2 || h.y + h.h > FIG.y + FIG.h + 2) out.push(`hit "${h.i}" outside the figure at t=${t}`);
      }
      if (t >= 13 && !op._odd && op.name !== 'x-particles' && op.name !== 'x-graph' && !b.hits.length) out.push('no tap targets');
    }
    if (!drew) out.push('draws nothing');
  }
  return [...new Set(out)];
}

let ops = 0; let bad = 0;
const report = (where, op, problems) => { ops++; if (problems.length) { bad++; console.log(`${where} ${op.name}:\n  ${problems.slice(0, 6).join('\n  ')}`); } };

// 1. Every explainer op in the packs.
const target = path.resolve(process.argv[2] || path.join(root, 'packs'));
const files = [];
(function walk(p) {
  if (!fs.existsSync(p)) return;
  if (fs.statSync(p).isDirectory()) for (const f of fs.readdirSync(p)) walk(path.join(p, f));
  else if (p.endsWith('.json')) files.push(p);
})(target);
let packs = 0;
for (const f of files) {
  let pack;
  try { pack = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; }
  const steps = [...(pack.figure || []).map((o) => ['figure', o]), ...(pack.explain || []).flatMap((s, i) => (s.draw || []).map((o) => [`step ${i + 1}`, o]))];
  const xs = steps.filter(([, o]) => o?.op === 'sim' && /^x-/.test(o.name || ''));
  if (!xs.length) continue;
  packs++;
  for (const [where, op] of xs) report(`${pack.id || path.basename(f)} (${where})`, op, run(op));
}
console.log(`packs: ${packs} with explainers, ${ops} ops drawn`);
const packOps = ops; const packBad = bad;

// 2. Synthetic ops that reach every corner of the spec.
const syn = [];
const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
for (const g of chunk(ICONS, 7)) syn.push({ name: 'x-chain', stages: g.map((icon) => ({ label: icon, icon, note: `A note about ${icon}.` })) });
for (const g of chunk(ICONS, 7)) syn.push({ name: 'x-sizes', items: g.map((icon, i) => ({ label: icon, icon, size: i + 1 })) });
syn.push({ name: 'x-chain', stages: [{ label: 'A', icon: 'sun' }, { label: 'B', icon: 'rain' }, { label: 'C', icon: 'ice' }], loop: true });
syn.push({ name: 'x-chain', stages: ICONS.slice(0, 6).map((icon) => ({ label: icon, icon })), loop: true });
for (const body of BODIES.concat(['dragon', '', null])) syn.push({ name: 'x-anatomy', body, parts: [{ label: 'One', x: 0.2, y: 0.2, note: 'n' }, { label: 'Two', x: 0.8, y: 0.3 }, { label: 'Three', x: 0.5, y: 0.9 }, { label: 'A rather long label!!', x: 0.1, y: 0.95 }, { label: 'Five', x: 0.9, y: 0.9 }, { label: 'Six', x: 0.6, y: 0.1 }, { label: 'Seven', x: 0.3, y: 0.5 }, { label: 'Eight', x: 0.7, y: 0.6 }] });
for (const g of chunk(PART_KINDS, 5)) for (const motion of MOTIONS.concat([undefined, 'wobble'])) syn.push({ name: 'x-machine', parts: g.map((kind, i) => ({ id: kind, kind, x: 0.1 + i * 0.2, y: 0.3 + (i % 2) * 0.4, label: kind, motion, size: 0.6 + i * 0.3, speed: 1 + i })), links: g.slice(1).map((k, i) => ({ from: g[i], to: k, kind: LINK_KINDS[i % LINK_KINDS.length], label: LINK_KINDS[i % LINK_KINDS.length] })) });
syn.push({ name: 'x-machine', parts: [{ id: 'a', kind: 'gear', x: 0.3, y: 0.5, size: 1.2, label: 'Big gear', motion: 'spin' }, { id: 'b', kind: 'gear', x: 0.5, y: 0.5, size: 0.7, label: 'Small gear' }, { id: 'c', kind: 'gear', x: 0.6, y: 0.3, size: 0.5, label: 'Tiny' }, { id: 'd', kind: 'gear', x: 0.5, y: 0.5, label: 'Same spot' }], links: [{ from: 'a', to: 'b', kind: 'force' }, { from: 'b', to: 'a', kind: 'force' }, { from: 'zz', to: 'a', kind: 'nope' }] });
for (const kinds of chunk(LINK_KINDS, 4)) syn.push({ name: 'x-network', nodes: ICONS.slice(0, 8).map((icon, i) => ({ id: `n${i}`, label: icon, icon, x: (i % 4) / 3, y: Math.floor(i / 4) })), links: kinds.flatMap((kind, i) => [{ from: `n${i}`, to: `n${i + 4}`, kind, label: kind }, { from: `n${i + 4}`, to: `n${i}`, kind }]) });
for (const shape of ['rise', 'fall', 'peak', 's-curve', 'exponential', 'decay', 'wave', 'linear', 'zigzag']) syn.push({ name: 'x-graph', x: { label: 'Time' }, y: { label: 'Speed' }, shape, marks: [{ at: 0.1, label: 'Start' }, { at: 0.12, label: 'Right after' }, { at: 0.5, label: 'Middle' }, { at: 1, label: 'End' }] });
for (const state of ['solid', 'liquid', 'gas', 'melting', 'boiling', 'freezing', 'condensing', 'dissolving', 'diffusion', 'plasma']) syn.push({ name: 'x-particles', state, label: state });
for (const kind of ['transverse', 'longitudinal', 'water', 'light', 'radio']) syn.push({ name: 'x-wave', kind, labels: ['wavelength', 'amplitude', 'frequency', 'colour'], note: 'A note.' });
syn.push({ name: 'x-layers', radial: true, layers: ['Crust', 'Mantle', 'Outer core', 'Inner core'].map((label, i) => ({ label, size: [0.3, 3, 2, 1.2][i], note: 'x' })), flow: { label: 'Heat', from: 3, to: 1 } });
syn.push({ name: 'x-layers', layers: Array.from({ length: 9 }, (_, i) => ({ label: `Layer ${i}`, size: i === 2 ? 0.05 : 1, color: i === 1 ? 'red' : i === 3 ? '#123456' : 'nope' })), flow: { from: 0, to: 40 } });
syn.push({ name: 'x-energy', input: { label: 'Electrical', amount: 100 }, outputs: [{ label: 'Light', amount: 10, useful: true }, { label: 'Heat', amount: 88, useful: false }, { label: 'Sound', amount: 2, useful: false }, { label: 'Tiny', amount: 0, useful: false }, { label: 'Missing' }] });
syn.push({ name: 'x-energy', input: { label: 'Food', amount: 2000 }, unit: 'kJ', outputs: [{ label: 'Moving', amount: 500, useful: true }, { label: 'Warmth', amount: 1500, useful: false }] });
syn.push({ name: 'x-forces', object: 'car', forces: [{ label: 'Push', dir: 'right', size: 5 }, { label: 'Friction', dir: 'left', size: 2 }, { label: 'Second push', dir: 'right', size: 1 }, { label: 'Angled', dir: 45, size: 3 }, { label: 'Weight', dir: 'down', size: 4 }, { label: 'Extra', dir: 'up', size: 9 }], motion: 'right' });
for (const motion of ['still', 'up', 'down', 'left', 'float', 'sideways']) syn.push({ name: 'x-forces', object: 'rocket', forces: [{ label: 'Thrust', dir: 'up', size: 4 }, { label: 'Weight', dir: 'down', size: 4 }], motion });
syn.push({ name: 'x-balance', left: [{ label: 'Child', weight: 4, dist: 3 }, { label: 'Bag', weight: 1, dist: 3 }, { label: 'Cat', weight: 2, dist: 1 }], right: [{ label: 'Dad', weight: 10, dist: 5 }, { label: 'Box', weight: 3, dist: 4.5 }, { label: 'Cup', weight: 1, dist: 4 }] });
syn.push({ name: 'x-sizes', unit: 'km', items: [{ label: 'Atom', size: 1e-13, icon: 'atom' }, { label: 'Earth', size: 12742, icon: 'moon' }, { label: 'Sun', size: 1392700, icon: 'sun' }] });
syn.push({ name: 'x-why', question: 'Why do we have seasons, really, truly, honestly and for sure?', because: ICONS.slice(0, 7).map((icon) => ({ label: `Because of ${icon}`, icon, note: 'Some note text that is long enough to need cutting off at the end.' })), answer: 'Because the Earth is tilted on its axis as it goes round the Sun all year.' });
syn.push({ name: 'x-zoom', levels: ICONS.slice(20, 29).map((icon) => ({ label: icon, icon, note: `About ${icon}` })) });
syn.push({ name: 'x-compare', left: { title: 'Left side with a long title', icon: 'cat', points: ['One', 'Two', 'Three', 'Four', 'Five'] }, right: { title: 'Right', icon: 'unknown-icon', points: ['A point that is quite a lot longer than forty characters in all'] }, verdict: 'They are different.' });
// The learning engines: every mood, count kind, word mode and steps mode.
for (const g of chunk(MOODS, 6)) syn.push({ name: 'x-story', who: 'Sam', panels: g.map((mood, i) => ({ label: `Feeling ${mood}`, mood, icon: ICONS[100 + i], note: `Sam feels ${mood} now.` })) });
syn.push({ name: 'x-story', panels: [{ label: 'One' }, { label: 'Two', mood: 'happy' }, { label: 'A label of 22 letters!', icon: 'umbrella' }] });
for (const g of chunk(MOODS, 4)) syn.push({ name: 'x-feelings', zones: g.map((mood) => ({ label: mood, mood, note: 'How this feels in my body.' })), level: 1, tools: ICONS.slice(-4).map((icon) => ({ label: icon, icon })) });
syn.push({ name: 'x-feelings', zones: MOODS.slice(0, 5).map((mood, i) => ({ label: mood, mood, color: i ? 'red' : '#123456' })) });
syn.push({ name: 'x-steps', mode: 'checklist', steps: ICONS.slice(-8).map((icon) => ({ label: `Use the ${icon}`, icon, note: 'A short note.' })) });
for (const mode of ['now-next', 'first-then']) syn.push({ name: 'x-steps', mode, steps: [{ label: 'Work', icon: 'pencil' }, { label: 'Play', icon: 'ball', note: 'Outside.' }] });
syn.push({ name: 'x-timeline', events: Array.from({ length: 8 }, (_, i) => ({ label: `Event number ${i}`, when: `${1900 + i * 15}`, icon: i % 2 ? ICONS[i] : undefined, note: 'What happened then.' })) });
syn.push({ name: 'x-timeline', events: [{ label: 'Wake', when: '7:00' }, { label: 'School', when: '9:00' }, { label: 'Home', when: '15:30' }] });
syn.push({ name: 'x-sort', question: 'Which are nouns and which are verbs?', groups: ['Nouns', 'Verbs', 'Adjectives', 'Adverbs'].map((label, i) => ({ label, icon: ICONS[120 + i], items: Array.from({ length: 5 }, (_, j) => `Word ${i}-${j} longish`.slice(0, 18)) })) });
syn.push({ name: 'x-sort', groups: [{ label: 'Living', items: ['Tree', 'Dog'] }, { label: 'Not living', items: ['Rock', 'Cup'] }] });
for (const mode of ['sounds', 'syllables', 'build']) {
  syn.push({ name: 'x-word', word: 'unhappily', parts: ['un-', 'happi', '-ly'], mode, icon: 'smile', note: 'Not in a happy way.' });
  syn.push({ name: 'x-word', word: 'transportation', parts: ['trans', 'por', 'ta', 'tion'], mode });
  syn.push({ name: 'x-word', word: 'a', parts: ['a'], mode });
}
const COUNTS = [['ten-frame', 0], ['ten-frame', 20], ['ten-frame', 7, 5, '+'], ['ten-frame', 12, 12, '-'], ['base-ten', 1], ['base-ten', 999], ['base-ten', 47, 38, '+'], ['base-ten', 199, 800, '+'], ['base-ten', 100, 1, '-'], ['base-ten', 305, 178, '-'],
  ['number-line', -50], ['number-line', 100, 50, '-'], ['number-line', 0, 50, '+', { step: 1 }], ['number-line', 27, 15, '+'], ['number-line', 3, 8, '-', { step: 3 }], ['array', 1, 1], ['array', 10, 12], ['groups', 6, 10, '×'], ['groups', 1, 1, '÷'], ['groups', 6, 10, '÷'],
  ['fraction-bar', 0, 1], ['fraction-bar', 12, 12, null, { compare: { a: 1, b: 2 } }], ['fraction-pie', 3, 8], ['fraction-pie', 1, 3, null, { compare: { a: 0, b: 12 } }], ['clock', 12, 0], ['clock', 3, 15], ['clock', 9, 45], ['clock', 11, 59]];
for (const [kind, a, b, sign, extra] of COUNTS) syn.push({ name: 'x-count', kind, a, ...(b != null ? { b } : {}), ...(sign ? { sign } : {}), label: 'Count', ...(extra || {}) });
// The engineering engines: every circuit kind, series and 2- and 3-branch
// parallel, open switches, AC with capacitors and diodes, meters; beams of
// every support layout and load mix with every diagram; every curve type.
const P = (kind, label, value, more = {}) => ({ kind, label, ...(value ? { value } : {}), ...more });
for (const g of chunk(CIRCUIT_KINDS.filter((k) => !['cell', 'ac', 'opamp', 'npn', 'nmos'].includes(k)), 6)) {
  syn.push({ name: 'x-circuit', parts: [P('cell', 'Battery', '6 V'), ...g.map((k) => P(k, k, k === 'resistor' ? '3 Ω' : '1 unit', { note: `The ${k}.` }))], readouts: ['I = 2 A', 'V = 6 V'] });
  syn.push({ name: 'x-circuit', parts: [P('ac', 'Mains', '230 V'), ...g.map((k, i) => P(k, `A ${k} part`, '', { branch: (i % 3) + 1 }))], flow: true });
}
syn.push({ name: 'x-circuit', parts: [P('cell', 'Cell', '1.5 V'), P('bulb', 'Bulb')] });
syn.push({ name: 'x-circuit', parts: [P('cell', 'Battery', '12 V'), P('switch', 'Switch', '', { open: true }), P('resistor', 'R', '4 Ω'), P('ammeter', 'Ammeter')], readouts: ['I = 0 A'] });
syn.push({ name: 'x-circuit', parts: [P('cell', 'Battery', '12 V'), P('ammeter', 'A1'), P('resistor', 'R1', '4 Ω', { branch: 1 }), P('resistor', 'R2', '2 kΩ', { branch: 2 }), P('bulb', 'Lamp', '6 Ω', { branch: 3 }), P('switch', 'S3', '', { branch: 3, open: true })], readouts: ['I1 = 3 A', 'I2 = 6 mA', 'I3 = 0 A'] });
syn.push({ name: 'x-circuit', parts: [P('ac', 'AC supply', '12 V'), P('diode', 'Diode'), P('resistor', 'Load', '100 Ω'), P('capacitor', 'Smoothing', '470 µF'), P('voltmeter', 'Output', '11 V')] });
syn.push({ name: 'x-circuit', parts: [P('cell', 'Battery', '9 V'), P('voltmeter', 'Across battery'), P('resistor', 'R', '1 kΩ'), P('capacitor', 'C', '1000 µF'), P('voltmeter', 'Across C')], readouts: ['τ = RC = 1 s'] });
syn.push({ name: 'x-circuit', parts: [P('cell', 'Supply', '5 V'), P('resistor', 'R1', '1 Ω', { branch: 1 }), P('voltmeter', 'V1', '', { branch: 1 }), P('voltmeter', 'Meter', '', { branch: 2 })], flow: false });
syn.push({ name: 'x-circuit', parts: [P('cell', 'A battery with a long', '12 V DC'), P('block', 'Rectifier and filter'), P('block', 'Op-amp ×10', '×10'), P('led', 'Green LED', '2 V'), P('motor', 'Fan motor', '12 Ω'), P('inductor', 'Choke', '10 mH'), P('fuse', 'Fuse', '3 A'), P('ammeter', 'Meter', '1 A')] });
syn.push({ name: 'x-circuit', parts: [P('cell', 'B', '6 V'), P('resistor', 'R1', '2 Ω', { branch: 1 }), P('resistor', 'R2', '2 Ω', { branch: 1 }), P('resistor', 'R3', '2 Ω', { branch: 1 }), P('resistor', 'R4', '2 Ω', { branch: 1 }), P('resistor', 'R5', '2 Ω', { branch: 1 }), P('ammeter', 'Short', '', { branch: 2 })] });
// op-amp and transistor stages (layout), each with and without its optional parts
for (const [layout, base, opt] of [
  ['inverting', [P('cell', 'Input', '0.5 V'), P('resistor', 'R_in', '10 kΩ'), P('resistor', 'R_f', '100 kΩ'), P('opamp', 'Op-amp', 'gain 10⁵')], [P('led', 'Out LED')]],
  ['inverting', [P('ac', 'Signal', '1 V'), P('resistor', 'R_in'), P('resistor', 'R_f'), P('opamp', 'A long op-amp label!')], [P('voltmeter', 'V out')]],
  ['non-inverting', [P('cell', 'Input', '0.5 V'), P('resistor', 'R_g', '10 kΩ'), P('resistor', 'R_f', '90 kΩ'), P('opamp', 'Op-amp')], [P('resistor', 'Load', '1 kΩ')]],
  ['follower', [P('ac', 'Sensor', '2 V'), P('opamp', 'Buffer')], [P('bulb', 'Lamp', '100 Ω')]],
  ['transistor', [P('cell', 'Supply', '9 V'), P('resistor', 'R_C', '2 kΩ'), P('npn', 'NPN', 'β = 150'), P('resistor', 'R_B', '100 kΩ')], [P('cell', 'Drive', '0.3 V'), P('ammeter', 'I_C')]],
  ['transistor', [P('cell', 'Supply', '12 V'), P('motor', 'Fan'), P('nmos', 'MOSFET'), P('resistor', 'R_G', '100 Ω')], [P('switch', 'Switch', '', { open: true }), P('ammeter', 'A')]],
  ['transistor', [P('cell', 'Supply', '5 V'), P('led', 'LED'), P('nmos', 'MOSFET'), P('resistor', 'R_G')], [P('ac', 'Signal', '3 V')]],
  ['common-emitter', [P('cell', 'Vcc', '12 V'), P('resistor', 'R1', '33 kΩ'), P('resistor', 'R2', '10 kΩ'), P('resistor', 'R_C', '2.7 kΩ'), P('npn', 'NPN', 'β = 100'), P('resistor', 'R_E', '1 kΩ')], [P('ac', 'Mic', '10 mV')]],
  ['common-emitter', [P('cell', 'Vdd', '15 V'), P('resistor', 'R1'), P('resistor', 'R2'), P('bulb', 'Lamp'), P('nmos', 'MOSFET'), P('resistor', 'R_S')], []],
]) {
  syn.push({ name: 'x-circuit', layout, parts: base, readouts: ['A = 1', 'B = 2'] });
  if (opt.length) syn.push({ name: 'x-circuit', layout, parts: base.concat(opt), flow: layout === 'transistor' ? false : undefined });
}
for (const sup of [[{ kind: 'pin', at: 0 }, { kind: 'roller', at: 1 }], [{ kind: 'pin', at: 0 }, { kind: 'roller', at: 0.7 }], [{ kind: 'roller', at: 0.2 }, { kind: 'pin', at: 0.8 }], [{ kind: 'pin', at: 0 }, { kind: 'pin', at: 1 }], [{ kind: 'fixed', at: 0 }], [{ kind: 'fixed', at: 1 }]]) {
  for (const show of ['beam', 'shear', 'moment', 'deflection', ['shear', 'moment'], ['shear', 'moment', 'deflection'], ['beam', 'deflection']]) {
    syn.push({ name: 'x-beam', length: 6, supports: sup, loads: [{ kind: 'point', at: 0.5, size: 10 }, { kind: 'udl', at: 0, to: 1, size: 5, label: '5 kN/m' }], show });
  }
  syn.push({ name: 'x-beam', length: 8, supports: sup, loads: [{ kind: 'point', at: 0, size: 3 }, { kind: 'point', at: 0.33, size: 12, label: 'Wheel load W' }, { kind: 'point', at: 0.36, size: 12 }, { kind: 'udl', at: 0.5, to: 1, size: 2.5 }], show: ['shear', 'moment', 'deflection'] });
}
syn.push({ name: 'x-beam', length: 100, supports: [{ kind: 'pin', at: 0.1 }, { kind: 'roller', at: 0.9 }], loads: [{ kind: 'point', at: 1, size: 1000 }], show: 'moment' });
syn.push({ name: 'x-beam', length: 0.5, supports: [{ kind: 'fixed', at: 0 }], loads: [{ kind: 'udl', at: 0.9, to: 1, size: 0.01 }], show: ['deflection'] });
for (const type of CURVE_TYPES) syn.push({ name: 'x-plot', x: { label: 'Time (s)', max: 10 }, y: { label: 'Value', max: 5, min: -5 }, curves: [{ label: type, type, a: 4, k: type === 'line' ? 0.5 : 1.3, c: 0.5, phase: 30, tau: 3, points: [[0, -2], [3, 4], [6, -1], [10, 2]] }], marks: [{ x: 2, label: 'A mark' }, { x: 2.3, label: 'Close by' }] });
syn.push({ name: 'x-plot', x: { label: 'Time (ms)', max: 20 }, y: { label: 'Voltage (V)', max: 12, min: -12 }, curves: [{ label: 'Supply', type: 'sine', a: 10, k: 0.05 }, { label: 'Lagging 90°', type: 'sine', a: 6, k: 0.05, phase: -90 }, { label: 'Damped', type: 'damped', a: 11, k: 0.2, tau: 6 }], marks: [{ x: 5, label: 'Peak' }, { x: 10, label: 'Zero crossing' }, { x: 15, label: 'Trough' }, { x: 20, label: 'One cycle' }] });
syn.push({ name: 'x-plot', x: { label: 'Volume (m³)', max: 0.5 }, y: { label: 'Pressure (kPa)', max: 600 }, curves: [{ label: 'Cycle', type: 'points', points: [[0.1, 500], [0.4, 500], [0.4, 100], [0.1, 100]], closed: true }] });
syn.push({ name: 'x-plot', x: { label: 'Volume (m³)', max: 1 }, y: { label: 'Pressure (bar)', max: 10 }, curves: [{ label: 'Otto cycle', type: 'points', points: [[0.1, 8], [0.2, 4], [0.8, 1], [0.8, 0.5], [0.3, 1.5], [0.1, 3]], closed: true, smooth: true }] });
syn.push({ name: 'x-plot', x: { label: 'Strain', max: 0.3, min: -0.05 }, y: { label: 'Stress (MPa)', max: 400, min: -100 }, curves: [{ label: 'Steel', type: 'points', points: [[-0.05, -80], [0, 0], [0.002, 250], [0.05, 260], [0.2, 400], [0.3, 350]] }, { label: 'Aluminium', type: 'points', points: [[0, 0], [0.004, 280], [0.15, 310]], smooth: true }], marks: [{ x: 0.002, label: 'Yield point' }] });
syn.push({ name: 'x-plot', x: { label: 'x', max: 4 }, y: { label: 'y', max: 100000 }, curves: [{ label: 'Power law', type: 'power', a: 1000, k: 3.2 }, { label: 'Fast decay', type: 'decay', a: 90000, k: 0.05 }] });
syn.push({ name: 'x-plot', equal: true, x: { label: 'σ (MPa)', max: 80 }, y: { label: 'τ (MPa)', max: 40, min: -40 }, curves: [{ label: 'Mohr circle', type: 'points', closed: true, smooth: true, points: Array.from({ length: 16 }, (_, i) => [40 + 30 * Math.cos((i * Math.PI) / 8), 30 * Math.sin((i * Math.PI) / 8)]) }], marks: [{ x: 10, label: 'σ min' }] });
syn.push({ name: 'x-plot', equal: true, x: { label: 'x', max: 1000 }, y: { label: 'y', max: 1 }, curves: [{ label: 'Flat', type: 'line', k: 0.001 }] });
syn.push({ name: 'x-plot', x: { label: 'x', max: 1e-3 }, y: { label: 'y', max: 2e-3 }, curves: [{ label: 'Tiny', type: 'line', k: 2 }] });
// …and each of those is a valid op by the spec (so the engines are tested on what writers may send).
const LEARN = new Set(['x-story', 'x-steps', 'x-feelings', 'x-count', 'x-word', 'x-timeline', 'x-sort', 'x-circuit', 'x-beam', 'x-plot']);
for (const op of syn.filter((o) => LEARN.has(o.name))) { const p = explainerProblems(op); if (p.length) report('synthetic (not valid by the spec)', op, p); }
// Odd and missing fields: nothing may throw.
syn.push({ name: 'x-circuit', _odd: true, parts: [{ kind: 'cell', label: 'B' }, { kind: 'opamp', label: 'Op' }, { kind: 'npn', label: 'Q' }] }, { name: 'x-circuit', _odd: true, layout: 'inverting', parts: [{ kind: 'cell', label: 'B' }, { kind: 'opamp', label: 'Op' }] }, { name: 'x-circuit', _odd: true, layout: 'transistor', parts: [{ kind: 'cell' }, { kind: 'resistor' }, { kind: 'nmos' }, { kind: 'resistor' }, { kind: 'switch', open: true }] });
for (const name of ENGINES) {
  syn.push({ name, _odd: true });
  syn.push({ name, _odd: true, stages: 'oops', because: 5, layers: [null, 3, 'Top'], parts: [{}], links: [{}], nodes: [{}], items: [{ size: -3 }], left: 'L', right: null, input: 7, outputs: [1, 2], forces: [{ dir: 'sideways', size: 'big' }], levels: [{}], x: 3, y: null, marks: 'm', focus: -1, title: { a: 1 } });
  syn.push({ name, _odd: name !== 'x-chain' && name !== 'x-cycle', title: 'Title', stages: [{ label: 'One', icon: 'sun' }], focus: '1' });
}
for (const op of syn) report('synthetic', op, run(op));
console.log(`synthetic: ${ops - packOps} ops drawn, ${bad - packBad} with problems`);
console.log(`${ops} explainer ops, ${bad} with problems`);
process.exitCode = bad ? 1 : 0;
