// What the explainer engines (public/sims-explain.js) accept: their names,
// fields, icons and silhouettes (packs/EXPLAINERS.md describes them). Used
// by the checker (test/explainer-check.mjs) so hundreds of lessons written
// from data all draw.
import { RENDERS } from './renders.js';
export const ICONS = 'sun moon star cloud rain snow lightning wind rainbow drop wave ice fire smoke steam thermometer mountain volcano rock sand soil cave river ocean tree leaf seed flower root grass cactus mushroom fish bird bee butterfly ant spider frog snake dog cat horse whale elephant egg bone heart lung brain stomach kidney eye ear nose tongue hand tooth muscle blood cell dna germ person baby atom molecule magnet battery bulb plug wire switch gear wheel spring lever pulley piston pipe pump valve fan turbine motor engine car bike train plane ship rocket satellite house bridge tower factory crane computer chip phone antenna robot sensor camera clock scale ruler light sound arrow book pencil school bed bath plate apple ball music speech family toy bag shoe cup toothbrush timer calendar globe flag coin puzzle paint scissors bus shop doctor castle compass flask microscope smile headphones door chair hat shirt map crown scroll mail key gift umbrella'.split(' ');
export const BODIES = 'human human-head skeleton heart lungs eye ear tooth skin cell plant-cell neuron quadruped bird fish insect spider reptile frog whale plant flower leaf tree'.split(' ');
export const PART_KINDS = 'gear wheel piston lever spring pipe box motor fan belt weight valve magnet battery bulb coil tank propeller axle'.split(' ');
export const MOTIONS = 'spin slide swing pulse flow none'.split(' ');
export const LINK_KINDS = 'energy fluid force signal heat blood food power data'.split(' ');
export const MOODS = 'happy calm sad worried angry proud surprised scared tired excited confused frustrated'.split(' ');
export const COUNT_KINDS = 'ten-frame base-ten number-line array groups fraction-bar fraction-pie clock'.split(' ');
export const CIRCUIT_KINDS = 'cell ac resistor capacitor inductor bulb switch diode led motor fuse ammeter voltmeter block opamp npn nmos'.split(' ');
// x-circuit `layout`: "loop" (the default: a loop with parallel branches) or
// a textbook stage whose parts are matched by role, in order (? = optional).
export const CIRCUIT_LAYOUTS = ['loop', 'inverting', 'non-inverting', 'follower', 'transistor', 'common-emitter'];
const SRC = ['cell', 'ac']; const OUT_LOAD = ['resistor', 'bulb', 'led', 'voltmeter']; const C_LOAD = ['resistor', 'bulb', 'motor', 'led'];
export const CIRCUIT_ROLES = {
  inverting: [['input', SRC, 'input source'], ['R_in', ['resistor'], 'input resistor R_in'], ['R_f', ['resistor'], 'feedback resistor R_f'], ['opamp', ['opamp'], 'op-amp'], ['load', OUT_LOAD, 'output load', true]],
  'non-inverting': [['input', SRC, 'input source'], ['R_g', ['resistor'], 'resistor to ground R_g'], ['R_f', ['resistor'], 'feedback resistor R_f'], ['opamp', ['opamp'], 'op-amp'], ['load', OUT_LOAD, 'output load', true]],
  follower: [['input', SRC, 'input source'], ['opamp', ['opamp'], 'op-amp'], ['load', OUT_LOAD, 'output load', true]],
  transistor: [['supply', ['cell'], 'supply cell'], ['load', C_LOAD, 'collector/drain load'], ['transistor', ['npn', 'nmos'], 'transistor (npn or nmos)'], ['R_B', ['resistor'], 'base/gate resistor'], ['input', ['cell', 'ac', 'switch'], 'input driving the base/gate', true], ['meter', ['ammeter'], 'ammeter in the collector/drain', true]],
  'common-emitter': [['supply', ['cell'], 'supply cell'], ['R1', ['resistor'], 'upper bias resistor R1'], ['R2', ['resistor'], 'lower bias resistor R2'], ['R_C', C_LOAD, 'collector/drain load R_C'], ['transistor', ['npn', 'nmos'], 'transistor (npn or nmos)'], ['R_E', ['resistor'], 'emitter/source resistor R_E'], ['input', SRC, 'signal input', true]],
};
// Matches an x-circuit op's parts to the roles of its layout: { layout,
// roles (role name → part index, null for "loop"), problems }.
export function circuitRoles(op) {
  const layout = op.layout == null ? 'loop' : op.layout;
  if (layout === 'loop') return { layout, roles: null, problems: [] };
  const want = CIRCUIT_ROLES[layout];
  if (!want) return { layout, roles: null, problems: [`layout "${layout}" (use ${CIRCUIT_LAYOUTS.join(', ')})`] };
  const parts = Array.isArray(op.parts) ? op.parts : [];
  const roles = {}; let i = 0;
  for (const [name, kinds, what, optional] of want) {
    const p = parts[i];
    if (p && kinds.includes(p.kind)) roles[name] = i++;
    else if (!optional) return { layout, roles: null, problems: [`${layout} layout: part ${i} must be the ${what} (kind ${kinds.join(' or ')}); parts go in the order ${want.map((w) => w[2] + (w[3] ? '?' : '')).join(', ')}`] };
  }
  if (i < parts.length) return { layout, roles: null, problems: [`${layout} layout: part ${i} (${parts[i]?.kind}) has no place; parts go in the order ${want.map((w) => w[2] + (w[3] ? '?' : '')).join(', ')}`] };
  return { layout, roles, problems: [] };
}
export const SUPPORT_KINDS = 'pin roller fixed'.split(' ');
export const CURVE_TYPES = 'sine rise decay line power damped points'.split(' ');
export const ENGINES = ['x-chain', 'x-cycle', 'x-why', 'x-layers', 'x-machine', 'x-energy', 'x-forces', 'x-anatomy', 'x-graph', 'x-zoom', 'x-particles', 'x-network', 'x-wave', 'x-balance', 'x-sizes', 'x-compare', 'x-story', 'x-steps', 'x-feelings', 'x-count', 'x-word', 'x-timeline', 'x-sort', 'x-circuit', 'x-beam', 'x-plot'];

// The value of one x-plot curve at x (see packs/EXPLAINERS.md, x-plot).
// a: size (amplitude, final value or multiplier), k: rate (cycles per x
// unit for sine and damped, time constant for rise and decay, slope for
// line, power for power), c: offset, phase: degrees, tau: damped decay time.
export function plotValue(cv, x) {
  const a = cv.a ?? 1; const k = cv.k ?? 1; const c = cv.c ?? 0;
  switch (cv.type) {
    case 'sine': return c + a * Math.sin(2 * Math.PI * k * x + ((cv.phase || 0) * Math.PI) / 180);
    case 'rise': return c + a * (1 - Math.exp(-x / k));
    case 'decay': return c + a * Math.exp(-x / k);
    case 'line': return c + k * x;
    case 'power': return c + a * x ** k;
    case 'damped': return c + a * Math.exp(-x / (cv.tau ?? 1)) * Math.cos(2 * Math.PI * k * x);
    case 'points': {
      const ps = cv.points || [];
      if (!ps.length) return NaN;
      for (let i = 1; i < ps.length; i++) if (x <= ps[i][0]) { const [x0, y0] = ps[i - 1]; const [x1, y1] = ps[i]; return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0); }
      return ps[ps.length - 1][1];
    }
    default: return NaN;
  }
}

// Solves an x-beam: support reactions, shear force, bending moment and the
// deflected shape along the beam (n + 1 samples from the left end). Units:
// length in metres, point loads in kN, spread loads (udl) in kN per metre;
// moments in kN·m, positive sagging. Deflection is a shape only (EI = 1).
// `jumps` gives the shear just before and after each point load and support.
export function solveBeam(op, n = 400) {
  const L = op.length || 1;
  const loads = (op.loads || []).map((l) => (l.kind === 'udl'
    ? { kind: 'udl', x0: l.at * L, x1: (l.to ?? 1) * L, w: l.size }
    : { kind: 'point', x: l.at * L, P: l.size }));
  const total = loads.reduce((s, l) => s + (l.kind === 'udl' ? l.w * (l.x1 - l.x0) : l.P), 0);
  const momentAbout = (x) => loads.reduce((s, l) => s + (l.kind === 'udl' ? l.w * (l.x1 - l.x0) * ((l.x0 + l.x1) / 2 - x) : l.P * (l.x - x)), 0);
  const sup = op.supports || [];
  const reactions = [];
  if (sup.length === 1) {
    const x0 = sup[0].at * L;
    reactions.push({ at: sup[0].at, x: x0, force: total, moment: momentAbout(x0) });
  } else if (sup.length === 2) {
    const [a, b] = [...sup].sort((p, q) => p.at - q.at).map((s) => s.at * L);
    const Rb = momentAbout(a) / (b - a);
    reactions.push({ at: a / L, x: a, force: total - Rb }, { at: b / L, x: b, force: Rb });
  }
  // Shear and moment by walking left to right.
  const xs = []; const V = []; const M = [];
  const leftOf = (x) => {
    let v = 0; let m = 0;
    for (const r of reactions) if (r.x <= x + 1e-9) { v += r.force; m += r.force * (x - r.x); }
    // A wall at the left end resists the turning from the start; one at the
    // right end only after the last point, so the wall's own moment shows.
    if (sup.length === 1 && (reactions[0].x === 0 || reactions[0].x < x - 1e-9)) m -= reactions[0].moment;
    for (const l of loads) {
      if (l.kind === 'point' && l.x < x - 1e-9) { v -= l.P; m -= l.P * (x - l.x); }
      if (l.kind === 'udl' && l.x0 < x) { const e = Math.min(x, l.x1); const f = l.w * (e - l.x0); v -= f; m -= f * (x - (l.x0 + e) / 2); }
    }
    return [v, m];
  };
  for (let i = 0; i <= n; i++) { const x = (L * i) / n; const [v, m] = leftOf(x); xs.push(x); V.push(Math.abs(v) < 1e-9 ? 0 : v); M.push(Math.abs(m) < 1e-9 ? 0 : m); }
  // Deflection: integrate M twice, then fix the two constants with the supports.
  const h = L / n; const s1 = [0]; const s2 = [0];
  for (let i = 1; i <= n; i++) { s1.push(s1[i - 1] + ((M[i - 1] + M[i]) / 2) * h); s2.push(s2[i - 1] + ((s1[i - 1] + s1[i]) / 2) * h); }
  let y;
  if (sup.length === 1) {
    const i0 = Math.round((sup[0].at * L) / h);
    y = s2.map((v, i) => v - s2[i0] - s1[i0] * (xs[i] - xs[i0]));
  } else {
    const [ia, ib] = reactions.map((r) => Math.round(r.x / h));
    const slope = (s2[ib] - s2[ia]) / (xs[ib] - xs[ia] || 1);
    y = s2.map((v, i) => v - s2[ia] - slope * (xs[i] - xs[ia]));
  }
  const peak = (arr) => arr.reduce((b, v, i) => (Math.abs(v) > Math.abs(b.value) ? { value: v, x: xs[i] } : b), { value: 0, x: 0 });
  // Shear jumps at point loads and supports, so samples only come near the
  // value just before a jump (−17.34 for −17.44 kN); take both sides exactly.
  const snap = (v) => (Math.abs(v - Math.round(v * 1e6) / 1e6) < 1e-6 ? Math.round(v * 1e6) / 1e6 : v);
  const jumps = [...new Set([...reactions.map((r) => r.x), ...loads.filter((l) => l.kind === 'point').map((l) => l.x)])].sort((a, b) => a - b)
    .map((x) => ({ x, before: x > 0 ? snap(leftOf(x - 1e-8)[0]) : 0, after: x < L ? snap(leftOf(x + 1e-8)[0]) : 0 }));
  let maxShear = peak(V);
  for (const j of jumps) for (const v of [j.before, j.after]) if (Math.abs(v) > Math.abs(maxShear.value) + 1e-9) maxShear = { value: v, x: j.x };
  return { length: L, total, reactions, xs, V, M, y, jumps, maxShear, maxMoment: peak(M), maxDeflection: peak(y) };
}

// Problems with one explainer draw op (empty when it will draw).
export function explainerProblems(op) {
  const out = [];
  const need = (ok, msg) => { if (!ok) out.push(`${op.name}: ${msg}`); };
  const label = (s, what) => need(typeof s === 'string' && s.trim() && s.length <= 22, `${what} label "${s}" missing or over 22 characters`);
  const note = (s, what) => need(s == null || (typeof s === 'string' && s.length <= 70), `${what} note over 70 characters`);
  const icon = (s, what) => need(ICONS.includes(s), `${what} icon "${s}" is not in the icon list`);
  const list = (a, lo, hi, what) => { need(Array.isArray(a) && a.length >= lo && a.length <= hi, `${what}: ${lo} to ${hi} items`); return Array.isArray(a) ? a : []; };
  const frac = (v, what) => need(typeof v === 'number' && v >= 0 && v <= 1, `${what} must be 0 to 1`);
  const ids = (a) => new Set(a.map((p) => p.id));
  need(ENGINES.includes(op.name), 'unknown engine');
  if (op.focus != null) need(Number.isInteger(op.focus) && op.focus >= 0, 'focus must be a 0-based index');
  switch (op.name) {
    case 'x-chain': case 'x-cycle':
      for (const [i, s] of list(op.stages, 3, 7, 'stages').entries()) { label(s.label, `stage ${i}`); icon(s.icon, `stage ${i}`); note(s.note, `stage ${i}`); }
      break;
    case 'x-why':
      need(typeof op.question === 'string' && op.question.length <= 60, 'question missing or over 60 characters');
      need(typeof op.answer === 'string' && op.answer.length <= 70, 'answer missing or over 70 characters');
      for (const [i, s] of list(op.because, 2, 5, 'because').entries()) { label(s.label, `because ${i}`); icon(s.icon, `because ${i}`); note(s.note, `because ${i}`); }
      break;
    case 'x-layers': {
      const ls = list(op.layers, 3, 7, 'layers');
      for (const [i, l] of ls.entries()) { label(l.label, `layer ${i}`); note(l.note, `layer ${i}`); }
      if (op.flow) need(Number.isInteger(op.flow.from) && Number.isInteger(op.flow.to) && op.flow.from < ls.length && op.flow.to < ls.length, 'flow from/to must be layer indexes');
      break;
    }
    case 'x-machine': {
      const ps = list(op.parts, 2, 10, 'parts');
      for (const [i, p] of ps.entries()) { label(p.label, `part ${i}`); need(PART_KINDS.includes(p.kind), `part ${i} kind "${p.kind}"`); frac(p.x, `part ${i} x`); frac(p.y, `part ${i} y`); need(!p.motion || MOTIONS.includes(p.motion), `part ${i} motion "${p.motion}"`); need(typeof p.id === 'string', `part ${i} id`); }
      const known = ids(ps);
      for (const [i, l] of list(op.links || [], 0, 10, 'links').entries()) { need(known.has(l.from) && known.has(l.to), `link ${i} from/to must be part ids`); need(LINK_KINDS.includes(l.kind), `link ${i} kind "${l.kind}"`); }
      break;
    }
    case 'x-energy':
      need(op.input && typeof op.input.amount === 'number', 'input {label, amount}');
      if (op.input) label(op.input.label, 'input');
      for (const [i, o] of list(op.outputs, 2, 5, 'outputs').entries()) { label(o.label, `output ${i}`); need(typeof o.amount === 'number', `output ${i} amount`); need(typeof o.useful === 'boolean', `output ${i} useful true/false`); }
      break;
    case 'x-forces':
      icon(op.object, 'object');
      for (const [i, f] of list(op.forces, 1, 5, 'forces').entries()) { label(f.label, `force ${i}`); need(['up', 'down', 'left', 'right'].includes(f.dir) || typeof f.dir === 'number', `force ${i} dir`); need(typeof f.size === 'number' && f.size >= 1 && f.size <= 5, `force ${i} size 1-5`); }
      need(!op.motion || ['still', 'up', 'down', 'left', 'right', 'float'].includes(op.motion), 'motion');
      break;
    case 'x-anatomy':
      need(BODIES.includes(op.body), `body "${op.body}" is not a known silhouette`);
      for (const [i, p] of list(op.parts, 3, 8, 'parts').entries()) { label(p.label, `part ${i}`); frac(p.x, `part ${i} x`); frac(p.y, `part ${i} y`); note(p.note, `part ${i}`); }
      break;
    case 'x-graph':
      need(op.x && typeof op.x.label === 'string' && op.y && typeof op.y.label === 'string', 'x and y need labels');
      need(['rise', 'fall', 'peak', 's-curve', 'exponential', 'decay', 'wave', 'linear'].includes(op.shape), `shape "${op.shape}"`);
      for (const [i, m] of list(op.marks || [], 0, 4, 'marks').entries()) { frac(m.at, `mark ${i} at`); label(m.label, `mark ${i}`); }
      break;
    case 'x-zoom':
      for (const [i, l] of list(op.levels, 3, 7, 'levels').entries()) { label(l.label, `level ${i}`); icon(l.icon, `level ${i}`); note(l.note, `level ${i}`); }
      break;
    case 'x-particles':
      need(['solid', 'liquid', 'gas', 'melting', 'boiling', 'freezing', 'condensing', 'dissolving', 'diffusion'].includes(op.state), `state "${op.state}"`);
      break;
    case 'x-network': {
      const ns = list(op.nodes, 3, 8, 'nodes');
      for (const [i, n] of ns.entries()) { label(n.label, `node ${i}`); icon(n.icon, `node ${i}`); frac(n.x, `node ${i} x`); frac(n.y, `node ${i} y`); need(typeof n.id === 'string', `node ${i} id`); }
      const known = ids(ns);
      for (const [i, l] of list(op.links, 2, 12, 'links').entries()) { need(known.has(l.from) && known.has(l.to), `link ${i} from/to must be node ids`); need(LINK_KINDS.includes(l.kind), `link ${i} kind "${l.kind}"`); }
      break;
    }
    case 'x-wave':
      need(['transverse', 'longitudinal', 'water', 'light'].includes(op.kind), `kind "${op.kind}"`);
      for (const l of op.labels || []) need(['wavelength', 'amplitude', 'frequency'].includes(l), `wave label "${l}"`);
      break;
    case 'x-balance':
      for (const side of ['left', 'right']) for (const [i, w] of list(op[side], 1, 3, side).entries()) { label(w.label, `${side} ${i}`); need(w.weight >= 1 && w.weight <= 10 && w.dist >= 1 && w.dist <= 5, `${side} ${i} weight 1-10, dist 1-5`); }
      break;
    case 'x-sizes':
      for (const [i, s] of list(op.items, 2, 7, 'items').entries()) { label(s.label, `item ${i}`); icon(s.icon, `item ${i}`); need(typeof s.size === 'number' && s.size > 0, `item ${i} size`); }
      break;
    case 'x-compare':
      for (const side of ['left', 'right']) {
        const s = op[side] || {};
        label(s.title, `${side} title`); icon(s.icon, `${side}`);
        for (const p of list(s.points, 2, 4, `${side} points`)) need(typeof p === 'string' && p.length <= 40, `${side} point "${p}" over 40 characters`);
      }
      break;
    case 'x-story':
      need(op.who == null || (typeof op.who === 'string' && op.who.length <= 14), 'who over 14 characters');
      for (const [i, p] of list(op.panels, 3, 6, 'panels').entries()) { label(p.label, `panel ${i}`); note(p.note, `panel ${i}`); if (p.icon != null) icon(p.icon, `panel ${i}`); need(p.mood == null || MOODS.includes(p.mood), `panel ${i} mood "${p.mood}"`); }
      break;
    case 'x-steps': {
      const mode = op.mode || 'checklist';
      need(['checklist', 'now-next', 'first-then'].includes(mode), `mode "${op.mode}"`);
      for (const [i, s] of list(op.steps, mode === 'checklist' ? 3 : 2, mode === 'checklist' ? 8 : 2, 'steps').entries()) { label(s.label, `step ${i}`); icon(s.icon, `step ${i}`); note(s.note, `step ${i}`); }
      break;
    }
    case 'x-feelings': {
      const zs = list(op.zones, 2, 5, 'zones');
      for (const [i, z] of zs.entries()) { label(z.label, `zone ${i}`); need(MOODS.includes(z.mood), `zone ${i} mood "${z.mood}"`); note(z.note, `zone ${i}`); }
      need(op.level == null || (Number.isInteger(op.level) && op.level >= 0 && op.level < zs.length), 'level must be a zone index');
      for (const [i, t] of list(op.tools || [], 0, 4, 'tools').entries()) { label(t.label, `tool ${i}`); icon(t.icon, `tool ${i}`); }
      break;
    }
    case 'x-count': {
      const int = (v, lo, hi, what) => need(Number.isInteger(v) && v >= lo && v <= hi, `${what} must be a whole number ${lo} to ${hi}`);
      need(COUNT_KINDS.includes(op.kind), `kind "${op.kind}"`);
      need(op.sign == null || ['+', '-', '×', '÷'].includes(op.sign), `sign "${op.sign}" (use + - × ÷)`);
      if (op.label != null) label(op.label, 'count');
      const { a, b } = op;
      if (op.kind === 'ten-frame') { int(a, 0, 20, 'a'); if (b != null) { int(b, 0, 20, 'b'); need(op.sign === '-' ? b <= a : a + b <= 20, 'the answer must be 0 to 20'); } }
      if (op.kind === 'base-ten') { int(a, 1, 999, 'a'); if (b != null) { int(b, 0, 999, 'b'); const r = op.sign === '-' ? a - b : a + b; need(r >= 0 && r <= 999, 'the answer must be 0 to 999'); } }
      if (op.kind === 'number-line') { int(a, -50, 100, 'a'); if (b != null) { int(b, 0, 50, 'b'); need(op.sign === '+' || op.sign === '-', 'number-line hops need sign + or -'); const r = op.sign === '-' ? a - b : a + b; need(r >= -50 && r <= 100, 'the answer must be -50 to 100'); } need(op.step == null || (Number.isInteger(op.step) && op.step >= 1 && op.step <= 25), 'step must be 1 to 25'); }
      if (op.kind === 'array') { int(a, 1, 10, 'a (rows)'); int(b, 1, 12, 'b (columns)'); }
      if (op.kind === 'groups') { int(a, 1, 6, 'a (groups)'); int(b, 1, 10, 'b (in each group)'); }
      if (op.kind === 'fraction-bar' || op.kind === 'fraction-pie') {
        int(b, 1, 12, 'b (denominator)'); int(a, 0, Number.isInteger(b) ? b : 12, 'a (numerator)');
        if (op.compare != null) { const c = op.compare || {}; int(c.b, 1, 12, 'compare.b'); int(c.a, 0, Number.isInteger(c.b) ? c.b : 12, 'compare.a'); }
      }
      if (op.kind === 'clock') { int(a, 1, 12, 'a (hour)'); int(b, 0, 59, 'b (minutes)'); }
      break;
    }
    case 'x-word': {
      const w = typeof op.word === 'string' ? op.word : '';
      need(/^[A-Za-z']{1,14}$/.test(w), `word "${op.word}" must be 1 to 14 letters`);
      need(['sounds', 'syllables', 'build'].includes(op.mode || 'sounds'), `mode "${op.mode}"`);
      const ps = list(op.parts, 1, 7, 'parts');
      need(ps.every((p) => typeof p === 'string' && p.length >= 1 && p.length <= 8), 'parts: strings of 1 to 8 letters');
      need(ps.join('').replace(/-/g, '').toLowerCase() === w.toLowerCase(), `parts must spell "${w}" exactly`);
      if (op.icon != null) icon(op.icon, 'word');
      note(op.note, 'word');
      break;
    }
    case 'x-timeline':
      for (const [i, e] of list(op.events, 3, 8, 'events').entries()) { label(e.label, `event ${i}`); need(typeof e.when === 'string' && e.when.trim() && e.when.length <= 14, `event ${i} when missing or over 14 characters`); note(e.note, `event ${i}`); if (e.icon != null) icon(e.icon, `event ${i}`); }
      break;
    case 'x-sort':
      need(op.question == null || (typeof op.question === 'string' && op.question.length <= 60), 'question over 60 characters');
      for (const [i, g] of list(op.groups, 2, 4, 'groups').entries()) {
        label(g.label, `group ${i}`); if (g.icon != null) icon(g.icon, `group ${i}`);
        for (const it of list(g.items, 2, 5, `group ${i} items`)) need(typeof it === 'string' && it.trim() && it.length <= 18, `group ${i} item "${it}" missing or over 18 characters`);
      }
      break;
    case 'x-circuit': {
      const ps = list(op.parts, 2, 8, 'parts');
      for (const [i, p] of ps.entries()) {
        label(p.label, `part ${i}`);
        need(CIRCUIT_KINDS.includes(p.kind), `part ${i} kind "${p.kind}"`);
        need(p.value == null || (typeof p.value === 'string' && p.value.length <= 12), `part ${i} value must be a short string (≤ 12 chars), like "6 V"`);
        need(p.branch == null || (Number.isInteger(p.branch) && p.branch >= 0 && p.branch <= 3), `part ${i} branch must be 0 to 3`);
        note(p.note, `part ${i}`);
      }
      need(op.layout == null || CIRCUIT_LAYOUTS.includes(op.layout), `layout "${op.layout}" (use ${CIRCUIT_LAYOUTS.join(', ')})`);
      if (op.layout == null || op.layout === 'loop') {
        if (ps.length) need(['cell', 'ac'].includes(ps[0].kind) && !ps[0].branch, 'the first part must be the source (cell or ac) on branch 0');
        const used = [...new Set(ps.map((p) => p.branch || 0).filter((b) => b > 0))].sort();
        need(used.every((b, i) => b === i + 1), 'branches must be numbered 1, 2, 3 in order with no gaps');
        need(used.length !== 1, 'a parallel circuit needs at least 2 branches (or put everything on branch 0)');
        for (const [i, p] of ps.entries()) need(!['opamp', 'npn', 'nmos'].includes(p.kind), `part ${i} kind "${p.kind}" needs a layout (inverting, non-inverting, follower, transistor or common-emitter)`);
      } else if (CIRCUIT_LAYOUTS.includes(op.layout)) {
        for (const [i, p] of ps.entries()) need(p.branch == null, `part ${i}: no branch in the ${op.layout} layout (parts are placed by role, in order)`);
        out.push(...circuitRoles(op).problems.map((m) => `${op.name}: ${m}`));
      }
      for (const r of list(op.readouts || [], 0, 3, 'readouts')) need(typeof r === 'string' && r.length <= 24, `readout "${r}" over 24 characters`);
      need(op.flow == null || typeof op.flow === 'boolean', 'flow must be true or false');
      break;
    }
    case 'x-beam': {
      need(typeof op.length === 'number' && op.length > 0 && op.length <= 100, 'length (metres) must be a number up to 100');
      const ss = list(op.supports, 1, 2, 'supports');
      for (const [i, s] of ss.entries()) { need(SUPPORT_KINDS.includes(s.kind), `support ${i} kind "${s.kind}"`); frac(s.at, `support ${i} at`); }
      if (ss.length === 1) need(ss[0].kind === 'fixed' && (ss[0].at === 0 || ss[0].at === 1), 'one support means a cantilever: kind fixed at 0 or 1');
      if (ss.length === 2) need(ss.every((s) => s.kind !== 'fixed') && ss.some((s) => s.kind === 'pin') && ss[0].at !== ss[1].at, 'two supports: a pin and a roller (or two pins) at different places');
      for (const [i, l] of list(op.loads, 1, 4, 'loads').entries()) {
        need(['point', 'udl'].includes(l.kind), `load ${i} kind "${l.kind}" (point or udl)`);
        frac(l.at, `load ${i} at`);
        if (l.kind === 'udl') { frac(l.to, `load ${i} to`); need(l.to > l.at, `load ${i} to must be after at`); }
        need(typeof l.size === 'number' && l.size > 0 && l.size <= 1000, `load ${i} size (kN, or kN/m for udl) must be above 0`);
        if (l.label != null) label(l.label, `load ${i}`);
      }
      for (const d of [op.show].flat().filter((v) => v != null)) need(['beam', 'shear', 'moment', 'deflection'].includes(d), `show "${d}" (beam, shear, moment or deflection)`);
      break;
    }
    case 'x-plot': {
      for (const ax of ['x', 'y']) { need(op[ax] && typeof op[ax].label === 'string' && op[ax].label.length <= 22, `${ax} needs a label (≤ 22 chars)`); need(op[ax] && typeof op[ax].max === 'number', `${ax}.max must be a number`); }
      if (op.y) need(op.y.min == null || (typeof op.y.min === 'number' && op.y.min < op.y.max), 'y.min must be below y.max');
      if (op.x) need(op.x.min == null || (typeof op.x.min === 'number' && op.x.min < op.x.max), 'x.min must be below x.max');
      const x0 = op.x?.min ?? 0; const x1 = op.x?.max ?? 1;
      for (const [i, cv] of list(op.curves, 1, 3, 'curves').entries()) {
        label(cv.label, `curve ${i}`);
        need(CURVE_TYPES.includes(cv.type), `curve ${i} type "${cv.type}"`);
        if (cv.type === 'points') need(Array.isArray(cv.points) && cv.points.length >= 2 && cv.points.length <= 16 && cv.points.every((p, j) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && (cv.closed || j === 0 || p[0] >= cv.points[j - 1][0])), `curve ${i} points: 2 to 16 [x, y] pairs, x not going back (unless closed)`);
        if ((cv.type === 'rise' || cv.type === 'decay') && cv.k != null) need(cv.k > 0, `curve ${i} k (time constant) must be above 0`);
        if (cv.type !== 'points') { const ok = Array.from({ length: 21 }, (_, j) => plotValue(cv, x0 + ((x1 - x0) * j) / 20)).every(Number.isFinite); need(ok, `curve ${i} gives no number somewhere on the x range`); }
      }
      for (const [i, m] of list(op.marks || [], 0, 4, 'marks').entries()) { label(m.label, `mark ${i}`); need(typeof m.x === 'number' && m.x >= x0 && m.x <= x1, `mark ${i} x must be inside the x range`); }
      break;
    }
    default:
  }
  return out;
}

// Problems with one picture op (empty when it will draw). A 3D render
// {op:'image', render, focus?, parts?} must name an entry of
// shared/renders.js; focus is a 0-based part index; parts may pick the
// render's parts (by index or label) or give new ones ({label, x, y, note?}).
export function imageProblems(op) {
  const out = [];
  if (!op || op.op !== 'image') return out;
  if (op.render == null) {
    if (typeof op.src !== 'string' || !op.src) out.push('image: needs a src or a render');
    return out;
  }
  const r = RENDERS[op.render];
  if (!r) return [`image: render "${op.render}" is not in shared/renders.js`];
  const tag = `image ${op.render}`;
  let n = r.parts.length;
  if (op.parts != null) {
    if (!Array.isArray(op.parts) || op.parts.length < 1 || op.parts.length > 8) out.push(`${tag}: parts must be 1 to 8 items`);
    else {
      n = op.parts.length;
      op.parts.forEach((p, i) => {
        if (typeof p === 'number') { if (!Number.isInteger(p) || p < 0 || p >= r.parts.length) out.push(`${tag}: part ${i} index ${p} out of range`); }
        else if (typeof p === 'string') { if (!r.parts.some((q) => q.label.toLowerCase() === p.toLowerCase())) out.push(`${tag}: part ${i} "${p}" is not a label of this render`); }
        else if (p && typeof p === 'object') {
          if (typeof p.label !== 'string' || !p.label.trim() || p.label.length > 22) out.push(`${tag}: part ${i} label missing or over 22 characters`);
          const known = typeof p.label === 'string' && r.parts.some((q) => q.label.toLowerCase() === p.label.toLowerCase());
          for (const k of ['x', 'y']) if (p[k] == null ? !known : !(typeof p[k] === 'number' && p[k] >= 0 && p[k] <= 1)) out.push(`${tag}: part ${i} ${k} must be 0 to 1`);
          if (p.note != null && (typeof p.note !== 'string' || p.note.length > 70)) out.push(`${tag}: part ${i} note over 70 characters`);
        } else out.push(`${tag}: part ${i} must be an index, a label or {label, x, y}`);
      });
    }
  }
  if (op.focus != null && !(Number.isInteger(op.focus) && op.focus >= 0 && op.focus < n)) out.push(`${tag}: focus must be a part index, 0 to ${n - 1}`);
  return out;
}
