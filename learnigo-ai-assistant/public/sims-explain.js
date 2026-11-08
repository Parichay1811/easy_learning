// Interactive explainers for the board: a few generic engines that draw
// hundreds of "how and why" lessons from data (packs/EXPLAINERS.md is the
// spec, shared/explainer-spec.js the same in code). A lesson pack puts one
// on the board with a draw op such as
//   { "op": "sim", "name": "x-chain", "stages": [ … ], "focus": 1 }
// and every field of the op arrives here as `it`.
//
// All engines share the same habits:
// - every labelled element is a button: it registers a tap target in
//   b.hits whose text (its `ask`, or "Tell me about the …") the board turns
//   into a spoken question to the teacher;
// - `focus` (a 0-based index) highlights one element; without it the
//   highlight walks through them every few seconds;
// - each one is a pure function of time (t since it appeared, b.clock
//   running); only layout is cached on the item (`it._lay`);
// - data comes from hundreds of authors, so nothing here throws on missing
//   or odd fields: unknown icons get a neutral glyph, unknown bodies a
//   generic outline, long lists are cut to what the spec allows and long
//   text ends in "…".
// Everything is drawn in the figure box, in its local frame (800 × 700,
// after a translate to FIG); tap targets are given back in board pixels.
// EXPLAIN_SIMS has no keywords: lessons choose these engines by name.

// The engineering engines take their numbers from the spec itself
// (solveBeam, plotValue), so the board shows exactly what writers compute.
// Like figures.js this is a browser module importing from /shared/; node
// tools load it with that prefix pointed at the shared folder (see
// lib/sims-meta.mjs, test/explainer-render.mjs, test/sim-harness.mjs).
import { solveBeam, plotValue, circuitRoles } from '/shared/explainer-spec.js';

// The spec's lists (kept in step with shared/explainer-spec.js).
const ICONS = 'sun moon star cloud rain snow lightning wind rainbow drop wave ice fire smoke steam thermometer mountain volcano rock sand soil cave river ocean tree leaf seed flower root grass cactus mushroom fish bird bee butterfly ant spider frog snake dog cat horse whale elephant egg bone heart lung brain stomach kidney eye ear nose tongue hand tooth muscle blood cell dna germ person baby atom molecule magnet battery bulb plug wire switch gear wheel spring lever pulley piston pipe pump valve fan turbine motor engine car bike train plane ship rocket satellite house bridge tower factory crane computer chip phone antenna robot sensor camera clock scale ruler light sound arrow book pencil school bed bath plate apple ball music speech family toy bag shoe cup toothbrush timer calendar globe flag coin puzzle paint scissors bus shop doctor castle compass flask microscope smile headphones door chair hat shirt map crown scroll mail key gift umbrella'.split(' ');
const MOODS = 'happy calm sad worried angry proud surprised scared tired excited confused frustrated'.split(' ');
const COUNT_KINDS = 'ten-frame base-ten number-line array groups fraction-bar fraction-pie clock'.split(' ');
const BODIES = 'human human-head skeleton heart lungs eye ear tooth skin cell plant-cell neuron quadruped bird fish insect spider reptile frog whale plant flower leaf tree'.split(' ');
const PART_KINDS = 'gear wheel piston lever spring pipe box motor fan belt weight valve magnet battery bulb coil tank propeller axle'.split(' ');
const LINK_KINDS = 'energy fluid force signal heat blood food power data'.split(' ');

export const EXPLAIN_SIMS = {
  'x-chain': {
    title: 'Explainer: a process in order', keywords: [],
    example: {
      title: 'How rain forms',
      stages: [
        { label: 'Sun heats the sea', icon: 'sun', note: 'Warmth from the Sun heats the surface of the sea.' },
        { label: 'Water evaporates', icon: 'steam', note: 'Water turns into invisible vapour and rises.' },
        { label: 'Vapour cools', icon: 'thermometer', note: 'High up the air is cold, so the vapour cools.' },
        { label: 'Clouds form', icon: 'cloud', note: 'The vapour condenses into tiny droplets: a cloud.' },
        { label: 'Rain falls', icon: 'rain', note: 'Droplets join, grow heavy and fall as rain.' },
      ],
    },
  },
  'x-cycle': {
    title: 'Explainer: a cycle', keywords: [],
    example: {
      title: 'The water cycle',
      stages: [
        { label: 'Evaporation', icon: 'sun', note: 'The Sun warms seas and lakes; water rises as vapour.' },
        { label: 'Condensation', icon: 'cloud', note: 'Vapour cools high up and forms clouds.' },
        { label: 'Precipitation', icon: 'rain', note: 'Water falls back down as rain, snow or hail.' },
        { label: 'Collection', icon: 'river', note: 'Rivers carry the water back to the sea.' },
        { label: 'Transpiration', icon: 'tree', note: 'Plants also breathe water vapour out of their leaves.' },
      ],
    },
  },
  'x-why': {
    title: 'Explainer: why it happens', keywords: [],
    example: {
      question: 'Why is the sky blue?',
      because: [
        { label: 'Sunlight mixes colours', icon: 'sun', note: 'White sunlight holds every colour of the rainbow.' },
        { label: 'Air scatters light', icon: 'molecule', note: 'Tiny air molecules bounce light in all directions.' },
        { label: 'Blue scatters most', icon: 'wave', note: 'Short blue waves are scattered far more than red.' },
        { label: 'Blue reaches our eyes', icon: 'eye', note: 'Scattered blue comes at us from every part of the sky.' },
      ],
      answer: 'Blue light is scattered all over the sky, so the sky looks blue.',
    },
  },
  'x-layers': {
    title: 'Explainer: layers', keywords: [],
    example: {
      title: 'Layers of the atmosphere',
      layers: [
        { label: 'Exosphere', note: 'The thin edge of space, where satellites orbit.', size: 1.1 },
        { label: 'Thermosphere', note: 'Very hot thin air where auroras glow.', size: 1.2 },
        { label: 'Mesosphere', note: 'The coldest layer; meteors burn up here.', size: 1 },
        { label: 'Stratosphere', note: 'Holds the ozone layer that blocks UV light.', size: 1 },
        { label: 'Troposphere', note: 'Where we live and where all weather happens.', size: 0.9 },
      ],
      flow: { label: 'Heat escapes', from: 4, to: 0 },
    },
  },
  'x-machine': {
    title: 'Explainer: a machine', keywords: [],
    example: {
      title: "A bicycle's chain drive",
      parts: [
        { id: 'pedal', kind: 'lever', x: 0.14, y: 0.22, label: 'Pedals', motion: 'swing', size: 0.9 },
        { id: 'ring', kind: 'gear', x: 0.27, y: 0.66, size: 1.35, label: 'Chainring', motion: 'spin', speed: 0.8 },
        { id: 'sprocket', kind: 'gear', x: 0.6, y: 0.66, size: 0.7, label: 'Rear sprocket' },
        { id: 'wheel', kind: 'wheel', x: 0.83, y: 0.3, size: 1.5, label: 'Back wheel' },
      ],
      links: [
        { from: 'pedal', to: 'ring', kind: 'force', label: 'Your push' },
        { from: 'ring', to: 'sprocket', kind: 'force', label: 'Chain' },
        { from: 'sprocket', to: 'wheel', kind: 'energy', label: 'Same axle' },
      ],
    },
  },
  'x-energy': {
    title: 'Explainer: energy in and out', keywords: [],
    example: {
      title: "Where a car's fuel energy goes",
      input: { label: 'Chemical energy', amount: 100 },
      outputs: [
        { label: 'Movement', amount: 25, useful: true },
        { label: 'Heat', amount: 68, useful: false },
        { label: 'Sound', amount: 7, useful: false },
      ],
    },
  },
  'x-forces': {
    title: 'Explainer: forces', keywords: [],
    example: {
      title: 'Forces on a plane',
      object: 'plane',
      forces: [
        { label: 'Lift', dir: 'up', size: 4 },
        { label: 'Weight', dir: 'down', size: 4 },
        { label: 'Thrust', dir: 'right', size: 3 },
        { label: 'Drag', dir: 'left', size: 2 },
      ],
      motion: 'right',
    },
  },
  'x-anatomy': {
    title: 'Explainer: a labelled body', keywords: [],
    example: {
      title: 'Parts of a fish',
      body: 'fish',
      parts: [
        { label: 'Eye', x: 0.84, y: 0.42, note: 'Fish eyes see well under water but have no eyelids.' },
        { label: 'Gills', x: 0.72, y: 0.5, note: 'Gills take oxygen out of the water.' },
        { label: 'Dorsal fin', x: 0.46, y: 0.1, note: 'The fin on the back keeps the fish upright.' },
        { label: 'Tail fin', x: 0.07, y: 0.5, note: 'The tail sweeps side to side to push the fish along.' },
        { label: 'Scales', x: 0.45, y: 0.52, note: 'Overlapping scales protect the skin.' },
        { label: 'Pectoral fin', x: 0.62, y: 0.7, note: 'Side fins steer, brake and help it hover.' },
      ],
    },
  },
  'x-graph': {
    title: 'Explainer: how one thing changes another', keywords: [],
    example: {
      title: 'A cup of tea cooling',
      x: { label: 'Time' }, y: { label: 'Temperature' }, shape: 'decay',
      marks: [{ at: 0.08, label: 'Just poured' }, { at: 0.85, label: 'Room temperature' }],
    },
  },
  'x-zoom': {
    title: 'Explainer: zooming through sizes', keywords: [],
    example: {
      title: 'Zooming into your hand',
      levels: [
        { label: 'You', icon: 'person', note: 'About 1.7 metres tall.' },
        { label: 'Your hand', icon: 'hand', note: 'About 20 centimetres long.' },
        { label: 'Skin cells', icon: 'cell', note: 'Each cell is about 30 micrometres wide.' },
        { label: 'DNA', icon: 'dna', note: 'Coiled inside the nucleus of each cell.' },
        { label: 'Atoms', icon: 'atom', note: 'Far smaller still: about 0.1 nanometres.' },
      ],
    },
  },
  'x-particles': { title: 'Explainer: particles', keywords: [], example: { title: 'Ice melting', state: 'melting' } },
  'x-network': {
    title: 'Explainer: a network of flows', keywords: [],
    example: {
      title: 'How electricity reaches homes',
      nodes: [
        { id: 'plant', label: 'Power station', icon: 'factory', x: 0.1, y: 0.25 },
        { id: 'wind', label: 'Wind farm', icon: 'turbine', x: 0.1, y: 0.8 },
        { id: 'grid', label: 'Pylons', icon: 'tower', x: 0.48, y: 0.5 },
        { id: 'home', label: 'Homes', icon: 'house', x: 0.88, y: 0.2 },
        { id: 'school', label: 'Schools', icon: 'computer', x: 0.88, y: 0.82 },
      ],
      links: [
        { from: 'plant', to: 'grid', kind: 'power' },
        { from: 'wind', to: 'grid', kind: 'power' },
        { from: 'grid', to: 'home', kind: 'power', label: '230 V' },
        { from: 'grid', to: 'school', kind: 'power' },
        { from: 'home', to: 'plant', kind: 'data', label: 'Meter readings' },
      ],
    },
  },
  'x-wave': { title: 'Explainer: waves', keywords: [], example: { title: 'A transverse wave', kind: 'transverse', labels: ['wavelength', 'amplitude', 'frequency'], note: 'The wave carries energy along; the rope only moves up and down.' } },
  'x-balance': {
    title: 'Explainer: moments and balance', keywords: [],
    example: { title: 'A balanced seesaw', left: [{ label: 'Child', weight: 4, dist: 3 }], right: [{ label: 'Dad', weight: 6, dist: 2 }] },
  },
  'x-sizes': {
    title: 'Explainer: comparing sizes', keywords: [],
    example: {
      title: 'How tall are they?', unit: 'm',
      items: [{ label: 'Cat', size: 0.3, icon: 'cat' }, { label: 'Dog', size: 0.6, icon: 'dog' }, { label: 'Horse', size: 1.6, icon: 'horse' }, { label: 'Person', size: 1.8, icon: 'person' }, { label: 'Elephant', size: 3.2, icon: 'elephant' }],
    },
  },
  'x-compare': {
    title: 'Explainer: two things side by side', keywords: [],
    example: {
      title: 'Solar or coal?',
      left: { title: 'Solar power', icon: 'sun', points: ['Never runs out', 'No smoke when running', 'Only works in daylight'] },
      right: { title: 'Coal power', icon: 'factory', points: ['Will run out one day', 'Releases carbon dioxide', 'Works day and night'] },
      verdict: 'Solar is cleaner; coal is steadier but polluting.',
    },
  },
  'x-story': {
    title: 'Explainer: a social story', keywords: [],
    example: {
      title: 'When the fire bell rings',
      who: 'Sam',
      panels: [
        { label: 'The bell rings', icon: 'sound', mood: 'scared', note: 'The fire bell is very loud. Sam jumps.' },
        { label: 'Cover your ears', icon: 'headphones', mood: 'worried', note: 'Sam covers his ears and walks with the class.' },
        { label: 'Line up outside', icon: 'family', mood: 'calm', note: 'Everyone lines up on the playground.' },
        { label: 'Back to class', icon: 'school', mood: 'proud', note: 'Sam did it! The bell keeps everyone safe.' },
      ],
    },
  },
  'x-steps': {
    title: 'Explainer: a routine, step by step', keywords: [],
    example: {
      title: 'Washing your hands',
      mode: 'checklist',
      steps: [
        { label: 'Wet your hands', icon: 'drop', note: 'Use warm running water.' },
        { label: 'Add soap', icon: 'bath', note: 'One squirt is enough.' },
        { label: 'Rub for 20 seconds', icon: 'timer', note: 'Backs, fingers and thumbs too.' },
        { label: 'Rinse', icon: 'wave', note: 'Wash all the bubbles away.' },
        { label: 'Dry your hands', icon: 'hand', note: 'Use a clean towel.' },
      ],
    },
  },
  'x-feelings': {
    title: 'Explainer: a feelings meter', keywords: [],
    example: {
      title: 'How big is my feeling?',
      zones: [
        { label: 'Calm', mood: 'calm', note: 'My body feels relaxed. I am ready to learn.' },
        { label: 'Worried', mood: 'worried', note: 'Butterflies in my tummy.' },
        { label: 'Frustrated', mood: 'frustrated', note: 'My face feels hot and my hands go tight.' },
        { label: 'Angry', mood: 'angry', note: 'A very big feeling. Time to stop.' },
      ],
      level: 2,
      tools: [{ label: 'Deep breaths', icon: 'wind' }, { label: 'Quiet corner', icon: 'chair' }, { label: 'Ask for help', icon: 'speech' }],
    },
  },
  'x-count': { title: 'Explainer: counting and number pictures', keywords: [], example: { title: 'Adding with tens and ones', kind: 'base-ten', a: 47, b: 38, sign: '+' } },
  'x-word': {
    title: 'Explainer: a word in sounds and parts', keywords: [],
    example: { word: 'ship', parts: ['sh', 'i', 'p'], mode: 'sounds', icon: 'ship', note: 'Three sounds: sh, i, p. Blend them: ship!' },
  },
  'x-timeline': {
    title: 'Explainer: events in time order', keywords: [],
    example: {
      title: 'A frog grows up',
      events: [
        { label: 'Frogspawn', when: 'Day 1', icon: 'egg', note: 'A frog lays hundreds of eggs in a pond.' },
        { label: 'Tadpole hatches', when: 'Week 1', icon: 'fish', note: 'Tiny tadpoles swim and breathe with gills.' },
        { label: 'Back legs grow', when: 'Week 6', icon: 'drop', note: 'Legs appear and the tail starts to shrink.' },
        { label: 'Froglet', when: 'Week 10', icon: 'frog', note: 'It breathes air and climbs out of the water.' },
        { label: 'Adult frog', when: 'Week 16', icon: 'leaf', note: 'Fully grown, ready to lay eggs of its own.' },
      ],
    },
  },
  'x-sort': {
    title: 'Explainer: sorting into groups', keywords: [],
    example: {
      title: 'Living or not living?',
      question: 'Does it grow, feed and breathe?',
      groups: [
        { label: 'Living', icon: 'leaf', items: ['Tree', 'Dog', 'Mushroom', 'Bee'] },
        { label: 'Never alive', icon: 'rock', items: ['Rock', 'Water', 'Plastic cup', 'Coin'] },
      ],
    },
  },
  'x-circuit': {
    title: 'Explainer: a circuit with moving current', keywords: [],
    example: {
      title: 'Two resistors in parallel',
      parts: [
        { kind: 'cell', label: 'Battery', value: '12 V', note: 'Current leaves the + terminal and returns to the − one.' },
        { kind: 'switch', label: 'Switch', note: 'Closed, so current can flow all the way round.' },
        { kind: 'ammeter', label: 'Total current', value: '9 A', note: 'All the current from the battery passes through here.' },
        { kind: 'resistor', label: 'Resistor 1', value: '4 Ω', branch: 1, note: '12 V across 4 Ω drives 3 A through this branch.' },
        { kind: 'resistor', label: 'Resistor 2', value: '2 Ω', branch: 2, note: 'Half the resistance, so twice the current: 6 A.' },
      ],
      readouts: ['I₁ = 12 ÷ 4 = 3 A', 'I₂ = 12 ÷ 2 = 6 A', 'I = 3 + 6 = 9 A'],
    },
  },
  'x-beam': {
    title: 'Explainer: a loaded beam', keywords: [],
    example: {
      title: 'A simply supported beam',
      length: 6,
      supports: [{ kind: 'pin', at: 0 }, { kind: 'roller', at: 1 }],
      loads: [{ kind: 'point', at: 0.5, size: 10 }],
      show: ['beam', 'shear', 'moment'],
    },
  },
  'x-plot': {
    title: 'Explainer: a graph with real numbers', keywords: [],
    example: {
      title: 'A capacitor charging and discharging',
      x: { label: 'Time (s)', max: 5 }, y: { label: 'Voltage (V)', max: 12 },
      curves: [{ label: 'Charging', type: 'rise', a: 12, k: 1 }, { label: 'Discharging', type: 'decay', a: 12, k: 1 }],
      marks: [{ x: 1, label: 'One time constant' }],
    },
  },
};

export function explainSims(kit) {
  // eslint-disable-next-line no-unused-vars
  const { FIG, COLORS, FONT, glow, label, rounded, clamp, easeOut, outBack, color, tint } = kit;
  const X0 = FIG.x; const Y0 = FIG.y; const W = 800; const H = 700; const MX = W / 2;
  const TAU = Math.PI * 2; const PI = Math.PI;
  const DARK = '#070b1d'; const LINE = 'rgba(220,230,255,0.8)'; const FAINT = 'rgba(140,170,255,0.18)';
  const HUE6 = ['blue', 'cyan', 'purple', 'teal', 'orange', 'green', 'yellow', 'red'];
  // Extra natural colours (hex, so tint() can fade them).
  const BROWN = '#c08a5a'; const PINK = '#f472b6'; const SKIN = '#f2b48c'; const GREY = '#93a0c4'; const WHITE = '#e9eeff'; const LEAF = '#4ade80'; const SKY = '#7dd3fc'; const BONE = '#e8e2cf';
  const HINT_Y = 678; // the "tap any part" chip
  const BOTTOM = 652; // content stays above this

  // ─── Small tools ──────────────────────────────────────────────────────
  const num = (v, d) => { const n = typeof v === 'string' ? parseFloat(v) : Number(v); return v !== null && v !== undefined && v !== '' && typeof v !== 'boolean' && Number.isFinite(n) ? n : d; };
  const str = (v, d = '') => (v === null || v === undefined ? d : typeof v === 'string' ? v.trim() || d : typeof v === 'number' ? String(v) : typeof v === 'object' ? str(v.label ?? v.title ?? v.text ?? v.name, d) : d);
  const arr = (v, max) => (Array.isArray(v) ? v.filter((x) => x !== null && x !== undefined) : v && typeof v === 'object' ? [v] : typeof v === 'string' && v.trim() ? [v] : []).slice(0, max);
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : typeof v === 'string' ? { label: v } : {});
  const mod = (a, n) => ((a % n) + n) % n;
  const smooth = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
  const lerp = (a, c, p) => a + (c - a) * p;
  const after = (t, at, d = 0.45) => easeOut(clamp((t - at) / d));
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const tri = (a) => { const m = mod(a, 2); return m < 1 ? m : 2 - m; };
  const fmt = (n) => {
    if (!Number.isFinite(n)) return '?';
    const a = Math.abs(n);
    const s = a >= 1000 ? Math.round(n).toLocaleString('en-GB') : a >= 100 ? String(Math.round(n)) : a >= 10 ? String(+n.toFixed(1)) : a >= 1 ? String(+n.toFixed(2)) : String(+n.toPrecision(2));
    return s.replace('-', '−');
  };
  const hueOf = (v, i) => { const c = typeof v === 'string' ? v.trim() : ''; return COLORS[c] ? c : /^#[0-9a-f]{6}$/i.test(c) ? c : HUE6[mod(i, 6)]; };
  // The words a tap asks the teacher.
  const askOf = (e, lab) => {
    const a = str(e && e.ask);
    if (a) return a;
    const l = str(lab, 'this part');
    return `Tell me about the ${/^[A-Z][a-z]/.test(l) ? l[0].toLowerCase() + l.slice(1) : l}`;
  };
  function hit(b, text, x, y, w, h) {
    if (b && Array.isArray(b.hits) && w > 0 && h > 0) b.hits.push({ i: text, x: X0 + x, y: Y0 + y, w, h });
  }
  const integer = (v) => { const n = num(v, NaN); return Number.isInteger(n) ? n : null; };

  // The highlighted element: a fixed `focus`, or one walking through them.
  function focusOf(it, n, t, start = 1.2, period = 2.5) {
    const f = integer(it.focus);
    if (f !== null && f >= 0 && f < n) return { fixed: true, k: f, e: (i) => (i === f ? 1 : 0), dim: (i) => (i === f ? 1 : 0.55), shown: [f, 1] };
    if (n <= 0) return { fixed: false, k: -1, e: () => 0, dim: () => 1, shown: [-1, 0] };
    const u = Math.max(0, t - start) / period;
    const k = Math.floor(u) % n; const fr = u - Math.floor(u); const prev = (k + n - 1) % n;
    const a = t < start ? smooth((t - start + 0.3) / 0.3) : smooth(fr / 0.18);
    const e = (i) => (i === k ? a : i === prev && u >= 1 ? 1 - a : 0);
    // the element to tell about now (the one fading out until the next is brighter)
    const shown = e(k) >= e(prev) || n === 1 ? [k, e(k)] : [prev, e(prev)];
    return { fixed: false, k, e, dim: (i) => 0.86 + 0.14 * e(i), shown };
  }

  // ─── Text that fits ───────────────────────────────────────────────────
  // Lines of text for a width, shrinking from `size` down to `min` and then
  // ending in "…"; cached by text, font and width.
  const FITS = new Map();
  function fitLines(ctx, text, maxW, size = 20, weight = 600, maxLines = 1, min = 18) {
    text = String(text ?? '').replace(/\s+/g, ' ').trim();
    const key = `${text}|${maxW | 0}|${size}|${weight}|${maxLines}|${min}`;
    const got = FITS.get(key);
    if (got) return got;
    if (FITS.size > 3000) FITS.clear();
    let out = null;
    for (let s = size; s >= min; s -= 1) {
      ctx.font = `${weight} ${s}px ${FONT}`;
      const lines = wrapWords(ctx, text, maxW);
      if (lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxW)) { out = { size: s, lines }; break; }
    }
    if (!out) {
      ctx.font = `${weight} ${min}px ${FONT}`;
      const lines = wrapWords(ctx, text, maxW).slice(0, maxLines);
      const full = wrapWords(ctx, text, maxW).length > maxLines;
      const lastI = lines.length - 1;
      let last = lines[lastI] || '';
      if (full || ctx.measureText(last).width > maxW) {
        while (last.length > 1 && ctx.measureText(`${last}…`).width > maxW) last = last.slice(0, -1);
        last = `${last.replace(/[\s,;:.–-]+$/, '')}…`;
      }
      lines[lastI] = last;
      out = { size: min, lines: lines.map((l, i) => (i < lastI && ctx.measureText(l).width > maxW ? cut(ctx, l, maxW) : l)) };
    }
    out.w = 0;
    ctx.font = `${weight} ${out.size}px ${FONT}`;
    for (const l of out.lines) out.w = Math.max(out.w, ctx.measureText(l).width);
    out.h = out.lines.length * out.size * 1.22;
    FITS.set(key, out);
    return out;
  }
  function cut(ctx, s, maxW) { while (s.length > 1 && ctx.measureText(`${s}…`).width > maxW) s = s.slice(0, -1); return `${s}…`; }
  function wrapWords(ctx, text, maxW) {
    const lines = []; let line = '';
    for (const word of text.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > maxW) { lines.push(line); line = word; } else line = next;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }
  // Draws fitted text centred on y; returns the fit (size, lines, w, h).
  function text(ctx, s, x, y, maxW, { size = 20, weight = 600, fill = 'ink', align = 'center', lines = 1, min = 18, base = 'middle' } = {}) {
    const f = fitLines(ctx, s, maxW, size, weight, lines, min);
    ctx.font = `${weight} ${f.size}px ${FONT}`;
    ctx.textAlign = align; ctx.textBaseline = base; ctx.fillStyle = color(fill);
    const lh = f.size * 1.22;
    for (let i = 0; i < f.lines.length; i++) ctx.fillText(f.lines[i], x, y + (i - (f.lines.length - 1) / 2) * lh);
    return f;
  }
  const measure = (ctx, s, maxW, size = 20, weight = 600, lines = 1, min = 18) => fitLines(ctx, s, maxW, size, weight, lines, min);

  // ─── Drawing helpers in the board's holo style ────────────────────────
  function begin(ctx, t, it) {
    ctx.save(); ctx.translate(X0, Y0);
    ctx.globalAlpha *= easeOut(clamp(t / 0.5));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const tt = str(it.title);
    if (tt) {
      text(ctx, tt, MX, 26, 740, { size: 28, weight: 700, min: 20 });
      return 62;
    }
    return 46;
  }
  function chip(ctx, s, x, y, c = 'ink', size = 18, align = 'center', maxW = 360) {
    const f = fitLines(ctx, s, maxW - 24, size, 700, 1, Math.min(size, 16));
    const w = f.w + 24; const h = f.size + 14;
    const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.fillStyle = 'rgba(5,8,22,0.82)'; ctx.strokeStyle = tint(c, 0.6); ctx.lineWidth = 1.5;
    rounded(ctx, left, y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
    ctx.font = `700 ${f.size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color(c);
    ctx.fillText(f.lines[0], left + w / 2, y + 1);
    return { x: left, y: y - h / 2, w, h };
  }
  function hint(ctx, t, b, msg = 'Tap any part to learn more') {
    if (!b || !Array.isArray(b.hits)) { /* still show it on dev sheets */ }
    const a = after(t, 1.6, 0.6);
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a * 0.92;
    ctx.font = `600 18px ${FONT}`;
    const w = ctx.measureText(msg).width + 58; const h = 32;
    ctx.fillStyle = 'rgba(5,8,22,0.7)'; ctx.strokeStyle = tint('cyan', 0.35); ctx.lineWidth = 1.2;
    rounded(ctx, MX - w / 2, HINT_Y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
    // A little tapping finger.
    const fx = MX - w / 2 + 22; const pr = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.strokeStyle = tint('cyan', 0.5 + 0.4 * pr); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(fx, HINT_Y - 3, 4 + pr * 5, 0, TAU); ctx.stroke();
    ctx.fillStyle = color('cyan'); ctx.beginPath(); ctx.arc(fx, HINT_Y - 3, 3.2, 0, TAU); ctx.fill();
    ctx.fillStyle = color('muted'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(msg, fx + 16, HINT_Y + 1);
    ctx.restore();
  }
  // The highlighted element's note, as a caption over the bottom.
  function caption(ctx, s, y, c = 'ink', a = 1, maxW = 720) {
    if (!s || a <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= a;
    text(ctx, s, MX, y, maxW, { size: 20, weight: 500, fill: c, lines: 2, min: 18 });
    ctx.restore();
  }
  function dot(ctx, x, y, r, c, blur = 0) {
    if (blur) glow(ctx, color(c), blur);
    ctx.fillStyle = color(c); ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); ctx.fill();
    if (blur) ctx.shadowBlur = 0;
  }
  function line(ctx, x0, y0, x1, y1, c = LINE, w = 2, dash) {
    ctx.strokeStyle = color(c); ctx.lineWidth = w;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    if (dash) ctx.setLineDash([]);
  }
  function head(ctx, x, y, ang, s, c) {
    ctx.fillStyle = color(c); ctx.beginPath();
    ctx.moveTo(x + Math.cos(ang) * s, y + Math.sin(ang) * s);
    ctx.lineTo(x + Math.cos(ang + 2.5) * s, y + Math.sin(ang + 2.5) * s);
    ctx.lineTo(x + Math.cos(ang - 2.5) * s, y + Math.sin(ang - 2.5) * s);
    ctx.closePath(); ctx.fill();
  }
  function ell(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, Math.abs(rx)), Math.max(0.1, Math.abs(ry)), rot, 0, TAU); }
  function panel(ctx, x, y, w, h, c = 'blue', a = 0.08, r = 16, sa = 0.5) {
    ctx.fillStyle = tint(c, a); ctx.strokeStyle = tint(c, sa); ctx.lineWidth = 2;
    rounded(ctx, x, y, w, h, r); ctx.fill(); ctx.stroke();
  }
  // A path (flat [x0, y0, x1, y1, …]) with its length, and points along it.
  function mkPath(pts) {
    const cum = [0];
    for (let i = 2; i < pts.length; i += 2) cum.push(cum[cum.length - 1] + Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]));
    return { pts, cum, total: cum[cum.length - 1] || 1 };
  }
  function at(p, d) {
    d = clamp(d, 0, p.total);
    let lo = 1; let hi = p.cum.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (p.cum[m] < d) lo = m + 1; else hi = m; }
    const i = Math.max(1, lo);
    const s = p.cum[i] - p.cum[i - 1] || 1; const q = (d - p.cum[i - 1]) / s;
    const x0 = p.pts[2 * i - 2]; const y0 = p.pts[2 * i - 1]; const x1 = p.pts[2 * i]; const y1 = p.pts[2 * i + 1];
    return { x: x0 + (x1 - x0) * q, y: y0 + (y1 - y0) * q, a: Math.atan2(y1 - y0, x1 - x0), i: i - 1 };
  }
  function strokePath(ctx, p, d0 = 0, d1 = p.total) {
    if (d1 <= d0) return;
    const a0 = at(p, d0); const a1 = at(p, d1);
    ctx.beginPath(); ctx.moveTo(a0.x, a0.y);
    for (let i = a0.i + 1; i <= a1.i; i++) ctx.lineTo(p.pts[2 * i], p.pts[2 * i + 1]);
    ctx.lineTo(a1.x, a1.y); ctx.stroke();
  }
  // Points of a quadratic curve as a flat list.
  function quadPts(x0, y0, qx, qy, x1, y1, n = 18) {
    const out = [];
    for (let i = 0; i <= n; i++) { const s = i / n; const u = 1 - s; out.push(u * u * x0 + 2 * u * s * qx + s * s * x1, u * u * y0 + 2 * u * s * qy + s * s * y1); }
    return out;
  }
  // A flowing arrow along a path: a faint bed, moving dashes, a head.
  function flowArrow(ctx, p, c, t, { w = 4, speed = 40, headS = 13, alpha = 1, dash = [14, 12], reveal = 1 } = {}) {
    const end = p.total * clamp(reveal);
    if (end < 2) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.strokeStyle = tint(c, 0.22); ctx.lineWidth = w + 4; strokePath(ctx, p, 0, Math.max(0, end - headS * 0.8));
    ctx.strokeStyle = color(c); ctx.lineWidth = w; ctx.setLineDash(dash); ctx.lineDashOffset = -t * speed;
    strokePath(ctx, p, 0, Math.max(0, end - headS * 0.8));
    ctx.setLineDash([]); ctx.lineDashOffset = 0;
    const e = at(p, end); const b0 = at(p, Math.max(0, end - 4));
    head(ctx, e.x, e.y, Math.atan2(e.y - b0.y, e.x - b0.x), headS, c);
    ctx.restore();
  }
  // A round badge holding an icon.
  function badge(ctx, x, y, r, iconName, c, e = 0, t = 0, dimA = 1) {
    ctx.save(); ctx.globalAlpha *= dimA;
    const s = 1 + 0.1 * e;
    if (e > 0.05) {
      glow(ctx, color(c), 18 * e);
      ctx.strokeStyle = tint(c, 0.9 * e); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, r * s + 7, 0, TAU); ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = 'rgba(8,12,30,0.88)'; ctx.beginPath(); ctx.arc(x, y, r * s, 0, TAU); ctx.fill();
    ctx.fillStyle = tint(c, 0.1 + 0.12 * e); ctx.fill();
    ctx.strokeStyle = tint(c, 0.55 + 0.4 * e); ctx.lineWidth = 2.5; ctx.stroke();
    drawIcon(ctx, iconName, x, y, r * s * 1.28, t);
    ctx.restore();
  }
  // Places label boxes next to things without overlapping: each item is
  // {x, y, hw, hh (the thing's half size), w, h (the label box)}.
  function placeLabels(items, bounds, extra = []) {
    const boxes = items.map((o) => ({ x: o.x - o.hw, y: o.y - o.hh, w: o.hw * 2, h: o.hh * 2 })).concat(extra);
    const placed = [];
    const over = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    for (const o of items) {
      const g = 8;
      const cands = [
        [o.x - o.w / 2, o.y + o.hh + g], [o.x - o.w / 2, o.y - o.hh - g - o.h],
        [o.x + o.hw + g, o.y - o.h / 2], [o.x - o.hw - g - o.w, o.y - o.h / 2],
        [o.x + o.hw * 0.6, o.y + o.hh + g], [o.x - o.hw * 0.6 - o.w, o.y + o.hh + g],
        [o.x + o.hw * 0.6, o.y - o.hh - g - o.h], [o.x - o.hw * 0.6 - o.w, o.y - o.hh - g - o.h],
        [o.x - o.w / 2, o.y + o.hh + g + o.h], [o.x - o.w / 2, o.y - o.hh - g - o.h * 2],
      ];
      let best = null; let bestS = Infinity;
      cands.forEach(([x, y], ci) => {
        const bx = clamp(x, bounds.x, bounds.x + bounds.w - o.w); const by = clamp(y, bounds.y, bounds.y + bounds.h - o.h);
        const r = { x: bx, y: by, w: o.w, h: o.h };
        let s = ci * 4 + (Math.abs(bx - x) + Math.abs(by - y)) * 3;
        for (const bb of boxes) s += over(r, bb) * 2;
        for (const pp of placed) s += over(r, pp) * 6;
        if (s < bestS) { bestS = s; best = r; }
      });
      placed.push(best);
    }
    return placed;
  }
  // A spot for a link's label chip (w × h) beside its path, clear of what
  // is already taken; null when every spot would cover something.
  function placeChip(path, w, h, taken, top, bottom = 640) {
    const over = (a, c) => Math.max(0, Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x)) * Math.max(0, Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y));
    let best = null; let bs = Infinity;
    for (const f of [0.5, 0.38, 0.62, 0.28, 0.72]) {
      const m = at(path, path.total * f);
      const nx = -Math.sin(m.a); const ny = Math.cos(m.a);
      const side = Math.abs(nx) * (w / 2) + Math.abs(ny) * (h / 2) + 8;
      for (const off of [0, side, -side, side + 16, -side - 16]) {
        const r = { x: clamp(m.x + nx * off - w / 2, 8, 792 - w), y: clamp(m.y + ny * off - h / 2, top, bottom - h), w, h };
        let s = Math.abs(f - 0.5) * 40 + Math.abs(off) * 0.15;
        for (const q of taken) s += over(r, q) * 3;
        if (s < bs) { bs = s; best = r; }
      }
    }
    let cover = 0; for (const q of taken) cover += over(best, q);
    return cover > w * h * 0.12 ? null : best;
  }
  // Spreads labels on one side so they never overlap: wanted centres y,
  // heights h, kept inside [lo, hi]; returns the centres.
  function spread(ys, hs, lo, hi, gap = 8) {
    const n = ys.length; const out = ys.slice();
    for (let pass = 0; pass < 40; pass++) {
      let moved = false;
      for (let i = 1; i < n; i++) {
        const need = (hs[i - 1] + hs[i]) / 2 + gap;
        if (out[i] - out[i - 1] < need) { const d = (need - (out[i] - out[i - 1])) / 2; out[i - 1] -= d; out[i] += d; moved = true; }
      }
      for (let i = 0; i < n; i++) out[i] = clamp(out[i], lo + hs[i] / 2, hi - hs[i] / 2);
      if (!moved) break;
    }
    for (let i = 1; i < n; i++) out[i] = Math.max(out[i], out[i - 1] + (hs[i - 1] + hs[i]) / 2 + gap * 0.5);
    return out;
  }

  // ─── Icons ────────────────────────────────────────────────────────────
  // Every icon of the spec as a little holo picture, drawn in a 64 × 64 box
  // centred on the origin (scaled to the size asked for), in its natural
  // colour. A few move gently with t (rays turn, blades spin, hands tick).
  let X = null; // the context while an icon draws
  const LW = 3;
  const bp = () => X.beginPath();
  function P(...p) { X.beginPath(); X.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) X.lineTo(p[i], p[i + 1]); }
  function PC(...p) { P(...p); X.closePath(); }
  function C(x, y, r) { X.beginPath(); X.arc(x, y, Math.max(0.1, r), 0, TAU); }
  function E(x, y, rx, ry, rot = 0) { X.beginPath(); X.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); }
  function RR(x, y, w, h, r) { X.beginPath(); X.roundRect(x, y, w, h, r); }
  function F(c, a = 0.28) { X.fillStyle = tint(c, a); X.fill(); }
  function SOL(c) { X.fillStyle = color(c); X.fill(); }
  function S(c, w = LW, a = 1) { X.strokeStyle = a < 1 ? tint(c, a) : color(c); X.lineWidth = w; X.stroke(); }
  function FS(c, a = 0.28, w = LW) { F(c, a); S(c, w); }
  function L(x0, y0, x1, y1, c, w = LW) { P(x0, y0, x1, y1); S(c, w); }
  function Q(x0, y0, qx, qy, x1, y1) { X.beginPath(); X.moveTo(x0, y0); X.quadraticCurveTo(qx, qy, x1, y1); }
  function cloudPath(x, y, k = 1) {
    X.beginPath();
    X.moveTo(x - 22 * k, y + 10 * k);
    X.arc(x - 16 * k, y + 1 * k, 9 * k, PI * 0.6, PI * 1.45);
    X.arc(x - 3 * k, y - 7 * k, 13 * k, PI * 1.1, PI * 1.85);
    X.arc(x + 13 * k, y - 1 * k, 10 * k, PI * 1.35, PI * 0.35);
    X.closePath();
  }
  function gearPath(r, teeth, depth, rot = 0) {
    X.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a = rot + (i / teeth) * TAU; const st = TAU / teeth;
      const pts = [[a - st * 0.5, r - depth], [a - st * 0.3, r - depth], [a - st * 0.2, r], [a + st * 0.2, r], [a + st * 0.3, r - depth]];
      for (const [q, rr] of pts) { const px = Math.cos(q) * rr; const py = Math.sin(q) * rr; if (i === 0 && q === pts[0][0]) X.moveTo(px, py); else X.lineTo(px, py); }
    }
    X.closePath();
  }
  function star5(x, y, r1, r2, rot = -PI / 2) { X.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? r2 : r1; const a = rot + (i / 10) * TAU; if (i) X.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else X.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } X.closePath(); }
  function wheelArt(x, y, r, rot, c, spokes = 6) {
    C(x, y, r); S(c, LW + 1.5);
    C(x, y, r * 0.8); S(c, 1.5, 0.6);
    for (let i = 0; i < spokes; i++) { const a = rot + (i / spokes) * TAU; L(x, y, x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, c, 1.6); }
    C(x, y, r * 0.18); SOL(c);
  }
  function dropPath(x, y, k = 1) { X.beginPath(); X.moveTo(x, y - 14 * k); X.bezierCurveTo(x + 5 * k, y - 6 * k, x + 9 * k, y - 1 * k, x + 9 * k, y + 4 * k); X.arc(x, y + 4 * k, 9 * k, 0, PI); X.bezierCurveTo(x - 9 * k, y - 1 * k, x - 5 * k, y - 6 * k, x, y - 14 * k); X.closePath(); }
  function leafPath(x0, y0, x1, y1, wd) {
    const mx = (x0 + x1) / 2; const my = (y0 + y1) / 2; const dx = x1 - x0; const dy = y1 - y0; const l = Math.hypot(dx, dy) || 1; const nx = -dy / l * wd; const ny = dx / l * wd;
    X.beginPath(); X.moveTo(x0, y0); X.quadraticCurveTo(mx + nx, my + ny, x1, y1); X.quadraticCurveTo(mx - nx, my - ny, x0, y0); X.closePath();
  }
  function heartPath(x, y, k) {
    X.beginPath(); X.moveTo(x, y + 20 * k);
    X.bezierCurveTo(x - 30 * k, y, x - 20 * k, y - 24 * k, x, y - 10 * k);
    X.bezierCurveTo(x + 20 * k, y - 24 * k, x + 30 * k, y, x, y + 20 * k); X.closePath();
  }
  const ICON_ART = {
    sun(t) { X.save(); X.rotate(t * 0.3); for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; L(Math.cos(a) * 19, Math.sin(a) * 19, Math.cos(a) * (i % 2 ? 26 : 29), Math.sin(a) * (i % 2 ? 26 : 29), 'yellow', 3.2); } X.restore(); C(0, 0, 14); X.fillStyle = tint('yellow', 0.9); X.fill(); C(0, 0, 14); S('orange', 2); },
    moon() { X.beginPath(); X.arc(0, 0, 21, PI * 0.3, PI * 1.7); X.quadraticCurveTo(-4, 0, Math.cos(PI * 0.3) * 21, Math.sin(PI * 0.3) * 21); X.closePath(); FS('#fde68a', 0.55); C(-9, 6, 2.5); F('#fde68a', 0.7); C(-12, -5, 1.8); F('#fde68a', 0.7); },
    star(t) { const k = 1 + 0.06 * Math.sin(t * 3); star5(0, 2, 26 * k, 11 * k); FS('yellow', 0.55); },
    cloud() { cloudPath(1, 4, 1.15); FS(WHITE, 0.3); },
    rain(t) { cloudPath(1, -6, 1); FS(SKY, 0.28); for (let i = 0; i < 3; i++) { const y = 12 + mod(t * 26 + i * 7, 16); const x = -12 + i * 11; X.save(); X.globalAlpha *= 1 - mod(t * 26 + i * 7, 16) / 18; L(x, y, x - 3, y + 7, 'blue', 3); X.restore(); } },
    snow(t) { X.save(); X.rotate(t * 0.2); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; const cx = Math.cos(a); const sy = Math.sin(a); L(0, 0, cx * 26, sy * 26, SKY, 3); for (const s of [-1, 1]) L(cx * 15, sy * 15, cx * 15 + Math.cos(a + s * 0.8) * 8, sy * 15 + Math.sin(a + s * 0.8) * 8, SKY, 2.5); } X.restore(); C(0, 0, 4); SOL(WHITE); },
    lightning(t) { cloudPath(1, -10, 0.95); FS(GREY, 0.3); const f = mod(t, 1.6) < 0.12 ? 0.95 : 0.7; PC(2, 0, -8, 16, 0, 16, -5, 30, 11, 10, 3, 10, 9, 0); X.fillStyle = tint('yellow', f); X.fill(); S('yellow', 2); },
    wind(t) { const o = Math.sin(t * 2) * 2; for (const [y, l, c] of [[-12, 34, 1], [0, 44, 1], [12, 28, 0.8]]) { X.beginPath(); X.moveTo(-26 + o, y); X.lineTo(-26 + l * 0.7 + o, y); X.arc(-26 + l * 0.7 + o, y - 5, 5, PI / 2, -PI * 0.9, true); S('cyan', 3, c); } },
    rainbow() { [['red', 26], ['orange', 21], ['yellow', 16], ['green', 11], ['blue', 6]].forEach(([c, r]) => { X.beginPath(); X.arc(0, 12, r, PI, 0); S(c, 4.2); }); cloudPath(-20, 16, 0.45); SOL(WHITE); cloudPath(20, 16, 0.45); SOL(WHITE); },
    drop() { dropPath(0, -2, 1.75); FS('blue', 0.4); X.beginPath(); X.arc(-1, 7, 8, PI * 0.95, PI * 1.35); S(WHITE, 2.5, 0.7); },
    wave(t) { const o = Math.sin(t * 2) * 1.5; X.beginPath(); X.moveTo(-28, 18); X.bezierCurveTo(-24, -8 + o, 0, -24, 16, -14); X.bezierCurveTo(26, -8, 22, 4, 12, 2); X.bezierCurveTo(6, -6, 0, 2, 6, 10); X.bezierCurveTo(10, 16, 20, 18, 28, 18); X.closePath(); FS('blue', 0.4); L(-28, 24, 28, 24, 'cyan', 2.5); },
    ice() { PC(-18, -6, 4, -14, 22, -6, 0, 2); FS(SKY, 0.45); PC(-18, -6, 0, 2, 0, 26, -18, 18); FS(SKY, 0.3); PC(0, 2, 22, -6, 22, 18, 0, 26); FS(SKY, 0.18); L(-12, 2, -12, 12, WHITE, 2.5); },
    fire(t) { const f = Math.sin(t * 9) * 1.5; X.beginPath(); X.moveTo(0, -28 + f); X.bezierCurveTo(10, -14, 22, -6, 20, 10); X.bezierCurveTo(18, 24, 6, 28, 0, 28); X.bezierCurveTo(-8, 28, -20, 22, -20, 8); X.bezierCurveTo(-20, -4, -10, -6, -8, -16); X.bezierCurveTo(-4, -8, -2, -12, 0, -28 + f); X.closePath(); FS('orange', 0.55); X.beginPath(); X.moveTo(0, 2 - f); X.bezierCurveTo(8, 10, 10, 16, 8, 21); X.bezierCurveTo(6, 27, -6, 27, -8, 21); X.bezierCurveTo(-10, 14, -4, 10, 0, 2 - f); SOL('yellow'); },
    smoke(t) { for (let i = 0; i < 4; i++) { const p = mod(t * 0.35 + i / 4, 1); C(Math.sin(p * 6 + i) * 6, 24 - p * 50, 7 + p * 9); X.save(); X.globalAlpha *= 1 - p * 0.8; FS(GREY, 0.35, 2.5); X.restore(); } },
    steam(t) { for (let i = -1; i <= 1; i++) { X.beginPath(); for (let k = 0; k <= 12; k++) { const y = 24 - k * 4.4; const x = i * 13 + Math.sin(k * 0.8 - t * 4 + i) * 4; if (k) X.lineTo(x, y); else X.moveTo(x, y); } S(WHITE, 3.2, 0.85); } },
    thermometer(t) { RR(-6, -28, 12, 42, 6); FS(WHITE, 0.15); C(0, 18, 10); FS('red', 0.85); const lv = 4 + 6 * (0.5 + 0.5 * Math.sin(t * 1.5)); X.fillStyle = color('red'); X.fillRect(-2.5, -8 - lv, 5, 26 + lv - 8 + 8); for (let i = 0; i < 4; i++) L(7, -22 + i * 8, 12, -22 + i * 8, WHITE, 1.6); },
    mountain() { PC(-30, 24, -8, -16, 4, 2, 12, -8, 30, 24); FS('teal', 0.3); PC(-15, -3, -8, -16, -1, -3, -5, -6, -9, -2); SOL(WHITE); PC(8, -3, 12, -8, 17, -1); SOL(WHITE); },
    volcano(t) { PC(-30, 26, -9, -8, 9, -8, 30, 26); FS(BROWN, 0.45); PC(-9, -8, -4, -4, 0, -9, 5, -4, 9, -8); SOL('orange'); for (let i = 0; i < 3; i++) { const p = mod(t * 0.5 + i / 3, 1); C(-3 + i * 3 + Math.sin(p * 5) * 3, -12 - p * 18, 4 + p * 6); X.save(); X.globalAlpha *= 1 - p; F(GREY, 0.6); X.restore(); } X.beginPath(); X.moveTo(-4, -6); X.quadraticCurveTo(-8, 6, -14, 12); S('orange', 3); },
    rock() { PC(-26, 18, -22, -2, -10, -16, 8, -18, 22, -6, 28, 12, 18, 22, -14, 22); FS(GREY, 0.35); P(-10, -16, -4, 2, 22, -6); S(GREY, 2, 0.7); L(-4, 2, -14, 22, GREY, 2); },
    sand() { X.beginPath(); X.moveTo(-30, 22); X.quadraticCurveTo(-8, -18, 30, 22); X.closePath(); FS('#e9c46a', 0.45); for (let i = 0; i < 10; i++) { C(-16 + rnd(i) * 32, 4 + rnd(i + 9) * 15, 1.5); SOL('#fde68a'); } L(-30, 24, 30, 24, '#e9c46a', 2); },
    soil() { X.beginPath(); X.moveTo(-28, -8); X.quadraticCurveTo(-14, -14, 0, -8); X.quadraticCurveTo(14, -2, 28, -8); X.lineTo(28, 24); X.lineTo(-28, 24); X.closePath(); FS(BROWN, 0.45); for (let i = 0; i < 7; i++) { E(-20 + rnd(i * 3) * 40, 2 + rnd(i + 2) * 18, 3, 2); F(BROWN, 0.9); } P(0, -9, 0, -22); S(LEAF, 3); leafPath(0, -18, 10, -24, 4); SOL(LEAF); leafPath(0, -16, -9, -21, 3.5); SOL(LEAF); },
    cave() { PC(-30, 24, -18, -10, -4, -22, 12, -16, 30, 24); FS(BROWN, 0.35); X.beginPath(); X.moveTo(-12, 24); X.quadraticCurveTo(-12, -4, 2, -4); X.quadraticCurveTo(14, -4, 14, 24); X.closePath(); SOL(DARK); S(BROWN, 2.5); },
    river(t) { X.beginPath(); X.moveTo(-14, -28); X.bezierCurveTo(20, -14, -24, 6, 10, 28); X.lineTo(26, 28); X.bezierCurveTo(-8, 6, 34, -14, 2, -28); X.closePath(); FS('blue', 0.45); X.save(); X.setLineDash([5, 7]); X.lineDashOffset = -t * 16; X.beginPath(); X.moveTo(-6, -28); X.bezierCurveTo(28, -14, -16, 6, 18, 28); S(SKY, 2, 0.8); X.restore(); },
    ocean(t) { for (let r = 0; r < 3; r++) { X.beginPath(); for (let k = 0; k <= 16; k++) { const x = -30 + k * 3.75; const y = -12 + r * 14 + Math.sin(k * 0.9 + t * 2 + r) * 3; if (k) X.lineTo(x, y); else X.moveTo(x, y); } X.lineTo(30, 28); X.lineTo(-30, 28); X.closePath(); F('blue', 0.18 + r * 0.12); S('cyan', 2.4, 0.9 - r * 0.2); } },
    tree() { RR(-4, 2, 8, 26, 2); FS(BROWN, 0.7); C(0, -10, 18); FS('green', 0.42); C(-11, -2, 10); FS('green', 0.42); C(11, -2, 10); FS('green', 0.42); C(-5, -16, 3); F(WHITE, 0.25); },
    leaf() { leafPath(-24, 22, 22, -24, 15); FS('green', 0.45); L(-24, 22, 18, -20, 'green', 2.4); for (let i = 1; i < 4; i++) { const px = -24 + i * 10.5; const py = 22 - i * 10.5; L(px, py, px + 9, py + 1, 'green', 1.6); L(px, py, px - 1, py - 9, 'green', 1.6); } L(-24, 22, -29, 27, 'green', 2.6); },
    seed() { E(0, 6, 12, 17, 0.4); FS(BROWN, 0.6); L(-4, -6, 4, 18, BROWN, 1.6); Q(2, -10, 4, -22, 0, -28); S(LEAF, 3); leafPath(2, -20, 14, -24, 4); SOL(LEAF); },
    flower(t) { P(0, 4, 0, 30); S('green', 3); leafPath(0, 22, 13, 14, 4); SOL(LEAF); X.save(); X.translate(0, -8); X.rotate(Math.sin(t) * 0.08); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; E(Math.cos(a) * 11, Math.sin(a) * 11, 9, 6, a); FS(PINK, 0.5, 2); } C(0, 0, 7); FS('yellow', 0.9, 2); X.restore(); },
    root() { L(-30, -16, 30, -16, BROWN, 2); P(0, -30, 0, -16); S(LEAF, 3); X.beginPath(); X.moveTo(0, -16); X.bezierCurveTo(2, 0, -3, 12, 0, 28); S('#e8d5b5', 3.5); for (const [a, b, c, d] of [[1, -6, -16, 6], [0, 2, 14, 12], [-1, 12, -12, 24], [0, 18, 10, 28]]) { Q(a, b, (a + c) / 2, b + 2, c, d); S('#e8d5b5', 2.2); } },
    grass(t) { const sw = Math.sin(t * 2) * 2; for (let i = 0; i < 7; i++) { const x = -24 + i * 8; const h = 30 + rnd(i) * 18; Q(x - 3, 26, x, 0, x + 4 + sw * (i % 2 ? 1 : -1), 26 - h); X.quadraticCurveTo(x + 2, 4, x + 3, 26); X.closePath(); FS('green', 0.6, 1.6); } },
    cactus() { RR(-7, -26, 14, 52, 7); FS('green', 0.45); X.beginPath(); X.moveTo(-7, 4); X.lineTo(-16, 4); X.quadraticCurveTo(-20, 4, -20, 0); X.lineTo(-20, -12); S('green', 7); X.beginPath(); X.moveTo(7, -4); X.lineTo(15, -4); X.quadraticCurveTo(19, -4, 19, -8); X.lineTo(19, -18); S('green', 7); L(-16, 26, 16, 26, '#e9c46a', 3); for (let i = 0; i < 4; i++) L(-2, -18 + i * 10, 2, -18 + i * 10, LEAF, 1.5); },
    mushroom() { X.beginPath(); X.moveTo(-28, 0); X.quadraticCurveTo(-26, -26, 0, -26); X.quadraticCurveTo(26, -26, 28, 0); X.closePath(); FS('red', 0.6); for (const [x, y, r] of [[-12, -12, 4], [4, -18, 3.5], [14, -8, 3], [-2, -6, 2.5]]) { C(x, y, r); SOL(WHITE); } X.beginPath(); X.moveTo(-8, 0); X.quadraticCurveTo(-10, 18, -10, 26); X.lineTo(10, 26); X.quadraticCurveTo(10, 18, 8, 0); X.closePath(); FS(BONE, 0.6); },
    fish(t) { const w = Math.sin(t * 5) * 3; X.beginPath(); X.moveTo(26, 0); X.quadraticCurveTo(10, -18, -12, -4); X.lineTo(-28, -14 + w); X.lineTo(-24, 0); X.lineTo(-28, 14 + w); X.lineTo(-12, 4); X.quadraticCurveTo(10, 18, 26, 0); X.closePath(); FS('orange', 0.5); C(14, -3, 3); SOL(DARK); X.beginPath(); X.arc(6, 0, 8, -1, 1); S('orange', 2); },
    bird(t) { const f = Math.sin(t * 6) * 6; E(-2, 6, 18, 12, -0.15); FS('cyan', 0.45); C(16, -6, 9); FS('cyan', 0.45); PC(24, -8, 32, -5, 24, -3); SOL('orange'); C(18, -8, 2); SOL(DARK); PC(-6, 2, 6, 4, -14, -10 - f); FS('cyan', 0.6, 2); PC(-18, 4, -30, -2, -28, 10); FS('cyan', 0.5, 2); L(-2, 18, -4, 26, 'orange', 2.5); L(4, 18, 4, 26, 'orange', 2.5); },
    bee(t) { const f = Math.abs(Math.sin(t * 14)); E(-6, -14, 9, 12 * (0.6 + 0.4 * f), -0.4); FS(WHITE, 0.3, 2); E(8, -14, 9, 12 * (0.6 + 0.4 * f), 0.4); FS(WHITE, 0.3, 2); E(0, 6, 16, 12); FS('yellow', 0.8); X.save(); E(0, 6, 16, 12); X.clip(); for (const x of [-6, 4]) { X.fillStyle = DARK; X.fillRect(x, -8, 5, 28); } X.restore(); E(0, 6, 16, 12); S('yellow', 2.5); C(18, 4, 6); FS(DARK, 0.9, 2); PC(-16, 6, -24, 6, -16, 9); SOL(DARK); },
    butterfly(t) { const f = 0.55 + 0.45 * Math.abs(Math.cos(t * 4)); X.save(); X.scale(f, 1); for (const s of [-1, 1]) { E(s * 14, -9, 14, 13, s * 0.4); FS('purple', 0.5); E(s * 11, 12, 10, 9, -s * 0.4); FS(PINK, 0.5); C(s * 15, -10, 3.5); SOL(WHITE); } X.restore(); RR(-2.5, -16, 5, 34, 2.5); SOL(DARK); RR(-2.5, -16, 5, 34, 2.5); S(WHITE, 1.5, 0.5); Q(-1, -16, -6, -26, -10, -28); S(WHITE, 1.6); Q(1, -16, 6, -26, 10, -28); S(WHITE, 1.6); },
    ant(t) { const w = Math.sin(t * 8) * 3; for (let i = -1; i <= 1; i++) { L(i * 6, 0, i * 9 - 4, -14 + (i === 0 ? w : -w), 'red', 2); L(i * 6, 0, i * 9 - 4, 14 + (i === 0 ? -w : w), 'red', 2); } E(-17, 0, 10, 8); FS('red', 0.6); E(0, 0, 7, 5.5); FS('red', 0.6); C(14, 0, 7); FS('red', 0.6); Q(18, -4, 24, -14, 30, -14); S('red', 1.8); Q(18, 4, 24, 14, 30, 14); S('red', 1.8); },
    spider(t) { const w = Math.sin(t * 5) * 2; for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const a = -0.9 + i * 0.6; X.beginPath(); X.moveTo(0, 0); X.quadraticCurveTo(s * 16, -6 + i * 6 + w, s * (22 + i * 2), -16 + i * 12 + w * s); X.lineTo(s * (27 + i), -10 + i * 14 + a * 0); S('purple', 2.2); } E(0, 6, 11, 13); FS('purple', 0.55); C(0, -10, 7); FS('purple', 0.55); C(-3, -12, 1.5); SOL(WHITE); C(3, -12, 1.5); SOL(WHITE); },
    frog(t) { const b = Math.sin(t * 3) * 1; E(0, 8, 26, 16 + b); FS('green', 0.5); C(-13, -9, 8); FS('green', 0.5); C(13, -9, 8); FS('green', 0.5); C(-13, -9, 4); SOL(DARK); C(13, -9, 4); SOL(DARK); C(-12, -10, 1.3); SOL(WHITE); C(14, -10, 1.3); SOL(WHITE); X.beginPath(); X.arc(0, 6, 14, 0.25 * PI, 0.75 * PI); S(DARK, 2.5); C(-16, 10, 3); F(PINK, 0.6); C(16, 10, 3); F(PINK, 0.6); },
    snake(t) { const o = Math.sin(t * 3) * 3; X.beginPath(); X.moveTo(-28, 20); X.bezierCurveTo(-28, 0 + o, -6, 0 + o, -6, 10); X.bezierCurveTo(-6, 24, 16, 22, 14, 4); X.bezierCurveTo(12, -10, -4, -12, 4, -20); S('green', 8); X.beginPath(); X.moveTo(-28, 20); X.bezierCurveTo(-28, 0 + o, -6, 0 + o, -6, 10); X.bezierCurveTo(-6, 24, 16, 22, 14, 4); X.bezierCurveTo(12, -10, -4, -12, 4, -20); X.setLineDash([3, 5]); S('yellow', 2.5); X.setLineDash([]); E(8, -22, 8, 6, -0.4); FS('green', 0.8, 2); C(10, -24, 1.6); SOL(DARK); P(15, -24, 21, -26, 24, -24); S('red', 1.6); P(21, -26, 24, -28); S('red', 1.6); },
    dog(t) { const e = Math.sin(t * 3) * 0.08; E(0, 2, 18, 20); FS(BROWN, 0.45); X.save(); X.translate(-16, -10); X.rotate(0.3 + e); E(0, 10, 6, 14); FS(BROWN, 0.8); X.restore(); X.save(); X.translate(16, -10); X.rotate(-0.3 - e); E(0, 10, 6, 14); FS(BROWN, 0.8); X.restore(); C(-7, -4, 2.6); SOL(DARK); C(7, -4, 2.6); SOL(DARK); E(0, 10, 9, 7); F(BONE, 0.6); E(0, 6, 4, 3); SOL(DARK); P(0, 9, 0, 13); S(DARK, 2); X.beginPath(); X.arc(-3, 13, 3, 0, PI * 0.9); S(DARK, 1.6); X.beginPath(); X.arc(3, 13, 3, PI * 0.1, PI); S(DARK, 1.6); },
    cat(t) { PC(-20, -6, -18, -28, -4, -16); FS('orange', 0.5); PC(20, -6, 18, -28, 4, -16); FS('orange', 0.5); E(0, 4, 22, 20); FS('orange', 0.45); const bl = mod(t, 3.5) < 0.12 ? 0.2 : 1; E(-8, 0, 3.5, 4.5 * bl); SOL('green'); E(8, 0, 3.5, 4.5 * bl); SOL('green'); PC(-3, 8, 3, 8, 0, 11); SOL(PINK); for (const s of [-1, 1]) for (const k of [-1, 1]) L(s * 6, 12, s * 26, 10 + k * 4, WHITE, 1.2); },
    horse(t) { const n = Math.sin(t * 2) * 0.05; X.save(); X.rotate(n); X.beginPath(); X.moveTo(-14, 28); X.lineTo(-12, 4); X.bezierCurveTo(-14, -12, -4, -24, 4, -26); X.lineTo(8, -32); X.lineTo(10, -24); X.bezierCurveTo(18, -20, 24, -6, 26, 4); X.quadraticCurveTo(26, 10, 18, 10); X.quadraticCurveTo(12, 6, 8, 2); X.lineTo(6, 28); X.closePath(); FS(BROWN, 0.5); X.beginPath(); X.moveTo(-12, 2); X.bezierCurveTo(-18, -10, -10, -22, 2, -26); S('#5b3a1e', 5); C(8, -14, 2.2); SOL(DARK); C(22, 5, 1.5); SOL(DARK); X.restore(); },
    whale(t) { const s = mod(t * 0.7, 1); X.beginPath(); X.moveTo(28, 4); X.bezierCurveTo(28, -14, 4, -16, -10, -8); X.quadraticCurveTo(-20, -4, -24, -14); X.lineTo(-30, -18); X.lineTo(-28, -6); X.lineTo(-30, 4); X.lineTo(-22, -2); X.quadraticCurveTo(-14, 16, 8, 16); X.quadraticCurveTo(28, 16, 28, 4); X.closePath(); FS('blue', 0.45); P(0, 8, 24, 8); S(SKY, 1.6, 0.6); C(16, -2, 2); SOL(DARK); for (const dx of [-4, 0, 4]) { X.save(); X.globalAlpha *= 1 - s; dropPath(10 + dx * 1.5 * (0.5 + s), -18 - s * 10, 0.35); SOL(SKY); X.restore(); } },
    elephant(t) { const tr = Math.sin(t * 1.5) * 4; E(-20, -2, 12, 16); FS(GREY, 0.45); E(20, -2, 12, 16); FS(GREY, 0.45); E(0, -6, 15, 16); FS(GREY, 0.5); X.beginPath(); X.moveTo(-5, 4); X.bezierCurveTo(-6, 18, -2, 26, 6 + tr, 28); X.lineTo(8 + tr, 24); X.bezierCurveTo(4, 22, 4, 14, 5, 4); X.closePath(); FS(GREY, 0.6); C(-6, -8, 2.2); SOL(DARK); C(6, -8, 2.2); SOL(DARK); Q(-9, 2, -12, 10, -8, 14); S(WHITE, 2.4); Q(9, 2, 12, 10, 8, 14); S(WHITE, 2.4); },
    egg() { X.beginPath(); X.moveTo(0, -28); X.bezierCurveTo(16, -28, 22, 4, 20, 12); X.bezierCurveTo(18, 24, 8, 28, 0, 28); X.bezierCurveTo(-8, 28, -18, 24, -20, 12); X.bezierCurveTo(-22, 4, -16, -28, 0, -28); X.closePath(); FS(BONE, 0.45); X.beginPath(); X.arc(-6, -6, 10, PI * 1.05, PI * 1.4); S(WHITE, 2.5, 0.8); },
    bone() { X.save(); X.rotate(-0.6); RR(-18, -5, 36, 10, 4); FS(BONE, 0.6); for (const s of [-1, 1]) { C(s * 20, -6, 7); FS(BONE, 0.6); C(s * 20, 6, 7); FS(BONE, 0.6); } RR(-18, -4, 36, 8, 3); SOL(tint(BONE, 0.6)); X.restore(); },
    heart(t) { const p = 1 + 0.07 * Math.max(0, Math.sin(t * 7)) ** 6; heartPath(0, 2, 1.1 * p); FS('red', 0.6); X.beginPath(); X.arc(-10, -6, 6, PI * 1.1, PI * 1.6); S(WHITE, 2.4, 0.7); },
    lung(t) { const b = 1 + 0.05 * Math.sin(t * 2); P(0, -28, 0, -10); S(PINK, 4); P(0, -10, -7, -4); S(PINK, 3); P(0, -10, 7, -4); S(PINK, 3); for (const s of [-1, 1]) { X.save(); X.translate(s * 4, 0); X.scale(b, b); X.beginPath(); X.moveTo(s * 4, -12); X.bezierCurveTo(s * 24, -18, s * 28, 10, s * 24, 22); X.quadraticCurveTo(s * 14, 28, s * 4, 22); X.closePath(); FS(PINK, 0.45); X.restore(); } },
    brain() { for (const s of [-1, 1]) { X.beginPath(); X.moveTo(0, -20); X.bezierCurveTo(s * 14, -26, s * 28, -16, s * 26, -2); X.bezierCurveTo(s * 30, 10, s * 20, 22, s * 8, 20); X.quadraticCurveTo(s * 2, 22, 0, 18); X.closePath(); FS(PINK, 0.4); Q(s * 4, -12, s * 14, -16, s * 18, -6); S(PINK, 2); Q(s * 6, 2, s * 16, -2, s * 22, 6); S(PINK, 2); Q(s * 4, 10, s * 10, 14, s * 16, 12); S(PINK, 2); } L(0, -20, 0, 18, PINK, 2); P(4, 18, 6, 28); S(PINK, 4); },
    stomach() { X.beginPath(); X.moveTo(-8, -28); X.lineTo(-6, -16); X.bezierCurveTo(-26, -10, -24, 22, 2, 22); X.bezierCurveTo(14, 22, 24, 16, 26, 8); X.lineTo(20, 4); X.bezierCurveTo(18, 12, 4, 14, 2, 4); X.bezierCurveTo(0, -4, 8, -12, 2, -18); X.lineTo(0, -28); X.closePath(); FS(PINK, 0.45); Q(-12, 0, -4, 10, 8, 10); S(PINK, 1.6, 0.6); },
    kidney() { X.beginPath(); X.moveTo(4, -24); X.bezierCurveTo(-20, -30, -26, 4, -14, 20); X.bezierCurveTo(-6, 30, 12, 26, 10, 12); X.bezierCurveTo(8, 4, 0, 2, 6, -6); X.bezierCurveTo(12, -12, 16, -20, 4, -24); X.closePath(); FS('#e07a5f', 0.5); Q(6, -2, 16, 6, 22, 28); S('yellow', 2.5); Q(8, -6, 18, -10, 28, -10); S('red', 2.5); Q(8, 2, 18, 2, 28, 0); S('blue', 2.5); },
    eye(t) { const bl = mod(t, 4) < 0.12 ? 0.15 : 1; X.save(); X.scale(1, bl); X.beginPath(); X.moveTo(-28, 0); X.quadraticCurveTo(0, -24, 28, 0); X.quadraticCurveTo(0, 24, -28, 0); X.closePath(); FS(WHITE, 0.25); C(Math.sin(t * 0.7) * 3, 0, 11); FS('cyan', 0.6); C(Math.sin(t * 0.7) * 3, 0, 5); SOL(DARK); C(Math.sin(t * 0.7) * 3 - 4, -4, 2.2); SOL(WHITE); X.restore(); },
    ear() { X.beginPath(); X.moveTo(-4, 24); X.bezierCurveTo(-14, 22, -10, 10, -14, 2); X.bezierCurveTo(-22, -14, -10, -28, 4, -28); X.bezierCurveTo(20, -28, 24, -12, 18, 0); X.bezierCurveTo(12, 10, 8, 14, 8, 20); X.quadraticCurveTo(6, 28, -4, 24); X.closePath(); FS(SKIN, 0.45); X.beginPath(); X.moveTo(-2, 8); X.bezierCurveTo(-8, -6, -4, -18, 6, -18); X.bezierCurveTo(14, -18, 14, -6, 8, -2); X.quadraticCurveTo(2, 2, 4, 8); S(SKIN, 2.4); },
    nose() { X.beginPath(); X.moveTo(-2, -28); X.bezierCurveTo(-4, -10, -10, 4, -16, 12); X.bezierCurveTo(-20, 18, -12, 24, -6, 20); X.quadraticCurveTo(0, 26, 6, 20); X.bezierCurveTo(12, 24, 20, 18, 16, 12); X.bezierCurveTo(10, 4, 4, -10, 2, -28); S(SKIN, 3); E(-8, 16, 3.5, 2.2); SOL('#9a5b3c'); E(8, 16, 3.5, 2.2); SOL('#9a5b3c'); },
    tongue(t) { const w = Math.sin(t * 3) * 2; X.beginPath(); X.moveTo(-26, -10); X.quadraticCurveTo(0, -2, 26, -10); X.quadraticCurveTo(0, 6, -26, -10); FS(PINK, 0.25); X.beginPath(); X.moveTo(-14, -6); X.lineTo(-14, 10); X.bezierCurveTo(-14, 28 + w, 14, 28 + w, 14, 10); X.lineTo(14, -6); X.closePath(); FS(PINK, 0.7); L(0, -2, 0, 16 + w * 0.5, '#be185d', 2); },
    hand(t) { const w = Math.sin(t * 2) * 0.06; X.save(); X.rotate(w); RR(-14, -2, 28, 28, 9); FS(SKIN, 0.5); for (let i = 0; i < 4; i++) { RR(-14 + i * 7.3, -28 + (i === 0 || i === 3 ? 6 : 0) + (i === 3 ? 3 : 0), 6.2, 30, 3.1); FS(SKIN, 0.5, 2.2); } X.save(); X.translate(-14, 10); X.rotate(-0.8); RR(-3.5, -20, 7, 22, 3.5); FS(SKIN, 0.5, 2.2); X.restore(); X.restore(); },
    tooth() { X.beginPath(); X.moveTo(-20, -18); X.bezierCurveTo(-22, -30, -6, -30, 0, -24); X.bezierCurveTo(6, -30, 22, -30, 20, -18); X.bezierCurveTo(18, -6, 16, 0, 14, 10); X.lineTo(10, 28); X.quadraticCurveTo(6, 30, 4, 24); X.lineTo(0, 8); X.lineTo(-4, 24); X.quadraticCurveTo(-6, 30, -10, 28); X.lineTo(-14, 10); X.bezierCurveTo(-16, 0, -18, -6, -20, -18); X.closePath(); FS(WHITE, 0.35); X.beginPath(); X.arc(-8, -16, 6, PI * 1.1, PI * 1.6); S(WHITE, 2, 0.8); },
    muscle(t) { const f = 0.5 + 0.5 * Math.sin(t * 2.5); X.beginPath(); X.moveTo(-30, -2); X.bezierCurveTo(-22, -10 - 8 * f, -2, -18 - 6 * f, 6, -8); X.lineTo(7, -18); X.quadraticCurveTo(5, -30, 15, -30); X.quadraticCurveTo(26, -29, 23, -17); X.lineTo(21, 8); X.quadraticCurveTo(19, 18, 6, 17); X.lineTo(-30, 15); X.closePath(); FS(SKIN, 0.5); X.beginPath(); X.moveTo(-22, 2); X.bezierCurveTo(-16, -8 - 6 * f, 0, -10 - 4 * f, 4, 0); S('red', 2.2, 0.8); L(10, -24, 18, -24, SKIN, 1.6); },
    blood(t) { for (const [x, y, r, a] of [[-9, -8, 15, 0.3 + t * 0.2], [11, 10, 13, -0.4 - t * 0.15]]) { X.save(); X.translate(x, y); X.rotate(a); E(0, 0, r, r * 0.82); FS('red', 0.6); E(0, 0, r * 0.45, r * 0.35); F('#7f1d1d', 0.7); X.restore(); } },
    cell(t) { X.beginPath(); for (let i = 0; i <= 24; i++) { const a = (i / 24) * TAU; const r = 26 + Math.sin(a * 3 + t) * 2; if (i) X.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.85); else X.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.85); } X.closePath(); FS('green', 0.22); C(-3, -2, 9); FS('purple', 0.55); C(-3, -2, 3); SOL('purple'); E(14, 8, 6, 3.5, 0.5); FS('orange', 0.5, 2); for (let i = 0; i < 5; i++) { C(-16 + rnd(i) * 30, 10 + rnd(i + 5) * 6 - (i % 2) * 22, 1.6); SOL(GREY); } },
    dna(t) { for (let i = 0; i <= 12; i++) { const y = -28 + i * 4.67; const a = i * 0.55 + t * 1.5; const x1 = Math.sin(a) * 14; const x2 = -x1; if (i % 2 === 0) L(x1, y, x2, y, i % 4 ? 'cyan' : 'orange', 2); } for (const s of [1, -1]) { X.beginPath(); for (let i = 0; i <= 24; i++) { const y = -28 + i * 2.33; const x = s * Math.sin(i * 0.275 + t * 1.5) * 14; if (i) X.lineTo(x, y); else X.moveTo(x, y); } S(s > 0 ? 'purple' : 'blue', 3.4); } },
    germ(t) { X.save(); X.rotate(t * 0.4); for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; L(Math.cos(a) * 17, Math.sin(a) * 17, Math.cos(a) * 25, Math.sin(a) * 25, 'green', 2.5); C(Math.cos(a) * 26, Math.sin(a) * 26, 3); SOL('green'); } X.restore(); C(0, 0, 18); FS('green', 0.45); C(-6, -4, 3); F(WHITE, 0.5); C(5, 5, 4); F(DARK, 0.4); },
    person() { C(0, -15, 10); FS('blue', 0.45); X.beginPath(); X.moveTo(-22, 28); X.bezierCurveTo(-22, 4, -12, -1, 0, -1); X.bezierCurveTo(12, -1, 22, 4, 22, 28); X.closePath(); FS('blue', 0.45); },
    baby(t) { C(0, 2, 22); FS(SKIN, 0.5); Q(-2, -20, 4, -28, 8, -22); S('#9a5b3c', 2.5); const bl = mod(t, 3) < 0.15; if (bl) { L(-11, -1, -5, -1, DARK, 2); L(5, -1, 11, -1, DARK, 2); } else { C(-8, -1, 2.6); SOL(DARK); C(8, -1, 2.6); SOL(DARK); } X.beginPath(); X.arc(0, 8, 6, 0.2 * PI, 0.8 * PI); S(DARK, 2); C(-13, 7, 3.5); F(PINK, 0.5); C(13, 7, 3.5); F(PINK, 0.5); },
    atom(t) { for (let i = 0; i < 3; i++) { E(0, 0, 28, 10, (i * PI) / 3); S('cyan', 2, 0.75); const a = t * 2 + i * 2.1; const ex = Math.cos(a) * 28; const ey = Math.sin(a) * 10; const r = (i * PI) / 3; C(ex * Math.cos(r) - ey * Math.sin(r), ex * Math.sin(r) + ey * Math.cos(r), 3.4); SOL('yellow'); } C(0, 0, 6); FS('orange', 0.9, 2); },
    molecule(t) { const w = Math.sin(t * 2) * 1.5; const a = [[-14, 8 + w], [6, -4], [22, 10 - w], [6, -22]]; L(a[0][0], a[0][1], a[1][0], a[1][1], WHITE, 3); L(a[1][0], a[1][1], a[2][0], a[2][1], WHITE, 3); L(a[1][0], a[1][1], a[3][0], a[3][1], WHITE, 3); C(a[1][0], a[1][1], 11); FS('red', 0.7); C(a[0][0], a[0][1], 8); FS(WHITE, 0.6); C(a[2][0], a[2][1], 8); FS(WHITE, 0.6); C(a[3][0], a[3][1], 7); FS('teal', 0.7); },
    magnet() { X.beginPath(); X.moveTo(-22, 22); X.lineTo(-22, -4); X.arc(0, -4, 22, PI, 0); X.lineTo(22, 22); X.lineTo(10, 22); X.lineTo(10, -4); X.arc(0, -4, 10, 0, PI, true); X.lineTo(-10, 22); X.closePath(); FS('red', 0.5); X.fillStyle = color(WHITE); X.fillRect(-22, 12, 12, 10); X.fillRect(10, 12, 12, 10); label(X, 'N', -16, 18, { size: 9, weight: 800, fill: 'red' }); label(X, 'S', 16, 18, { size: 9, weight: 800, fill: 'blue' }); },
    battery(t) { RR(-26, -12, 46, 24, 4); FS('green', 0.15); RR(20, -6, 6, 12, 2); SOL('green'); const n = 1 + Math.floor(mod(t * 1.5, 4)); for (let i = 0; i < 4; i++) { RR(-22 + i * 10.5, -8, 8, 16, 2); F('green', i < n ? 0.85 : 0.15); } },
    bulb(t) { const g = 0.6 + 0.3 * Math.sin(t * 3); C(0, -8, 22); X.fillStyle = tint('yellow', 0.12 * g); X.fill(); X.beginPath(); X.moveTo(-8, 12); X.bezierCurveTo(-8, 4, -18, -2, -18, -12); X.arc(0, -12, 18, PI, 0); X.bezierCurveTo(18, -2, 8, 4, 8, 12); X.closePath(); X.fillStyle = tint('yellow', 0.35 + 0.35 * g); X.fill(); S('yellow', 2.5); P(-5, 10, -3, -10, 0, -6, 3, -10, 5, 10); S('orange', 2); RR(-9, 12, 18, 12, 3); FS(GREY, 0.5, 2); L(-8, 17, 8, 17, GREY, 1.5); P(-4, 24, 0, 28, 4, 24); S(GREY, 2); },
    plug() { RR(-14, -12, 28, 24, 6); FS(WHITE, 0.25); L(-6, -12, -6, -26, GREY, 4); L(6, -12, 6, -26, GREY, 4); X.beginPath(); X.moveTo(0, 12); X.bezierCurveTo(0, 22, 14, 18, 18, 28); S(DARK, 5); X.beginPath(); X.moveTo(0, 12); X.bezierCurveTo(0, 22, 14, 18, 18, 28); S(GREY, 3); },
    wire(t) { X.beginPath(); X.moveTo(-26, 14); X.bezierCurveTo(-14, -26, 6, 30, 18, -10); S('red', 5); X.save(); X.setLineDash([3, 9]); X.lineDashOffset = -t * 20; X.beginPath(); X.moveTo(-26, 14); X.bezierCurveTo(-14, -26, 6, 30, 18, -10); S('yellow', 2.6); X.restore(); L(-26, 14, -30, 22, 'orange', 2.5); L(18, -10, 24, -20, 'orange', 2.5); },
    switch(t) { const on = mod(t, 3) > 1.5; RR(-28, 8, 56, 10, 4); FS(GREY, 0.3); C(-16, 4, 4); FS(WHITE, 0.6); C(16, 4, 4); FS(WHITE, 0.6); const a = on ? 0 : -0.5; X.save(); X.translate(-16, 4); X.rotate(a); L(0, 0, 32, 0, 'teal', 4); X.restore(); if (on) { C(16, 4, 7); S('yellow', 1.5, 0.7); } },
    gear(t) { X.save(); X.rotate(t * 0.8); gearPath(26, 10, 6); FS('cyan', 0.3); C(0, 0, 8); S('cyan', 2.5); C(0, 0, 3); SOL('cyan'); X.restore(); },
    wheel(t) { wheelArt(0, 0, 25, t * 1.5, GREY, 8); },
    spring(t) { const k = 1 + 0.18 * Math.sin(t * 3); X.beginPath(); X.moveTo(0, -28); for (let i = 0; i <= 10; i++) X.lineTo(i % 2 ? 14 : -14, -22 + i * 4.4 * k); X.lineTo(0, -22 + 10 * 4.4 * k + 4); S('cyan', 3); L(-12, -28, 12, -28, GREY, 3); },
    lever(t) { const a = Math.sin(t * 1.5) * 0.18; PC(-7, 22, 7, 22, 0, 10); FS('orange', 0.5); X.save(); X.translate(0, 8); X.rotate(a); RR(-30, -3, 60, 6, 2); FS('orange', 0.6, 2); RR(-28, -16, 12, 12, 2); FS(GREY, 0.6, 2); X.restore(); L(-24, 24, 24, 24, GREY, 2); },
    pulley(t) { L(-14, -28, 14, -28, GREY, 3); L(0, -28, 0, -16, GREY, 2.5); X.save(); X.translate(0, -6); X.rotate(t); C(0, 0, 11); FS('cyan', 0.25); L(-11, 0, 11, 0, 'cyan', 1.5); L(0, -11, 0, 11, 'cyan', 1.5); X.restore(); const h = Math.sin(t) * 5; L(-11, -6, -11, 10 - h, WHITE, 2); L(11, -6, 11, 14 + h, WHITE, 2); RR(4, 14 + h, 14, 12, 2); FS(GREY, 0.6, 2); L(-11, 10 - h, -16, 20 - h, SKIN, 3); },
    piston(t) { const y = Math.sin(t * 3) * 7; RR(-14, -28, 28, 44, 3); S(GREY, 3); X.fillStyle = tint('orange', 0.25); X.fillRect(-12, -26, 24, 12 + y); RR(-12, -14 + y, 24, 10, 2); FS('cyan', 0.6, 2); L(0, -4 + y, 0, 26, 'cyan', 4); C(0, 26, 3); SOL('cyan'); },
    pipe(t) { X.beginPath(); X.moveTo(-28, -8); X.lineTo(4, -8); X.quadraticCurveTo(14, -8, 14, 2); X.lineTo(14, 28); S('teal', 14); X.beginPath(); X.moveTo(-28, -8); X.lineTo(4, -8); X.quadraticCurveTo(14, -8, 14, 2); X.lineTo(14, 28); X.save(); X.setLineDash([4, 8]); X.lineDashOffset = -t * 18; S(SKY, 3); X.restore(); RR(-30, -16, 5, 16, 1); SOL('teal'); RR(6, 22, 16, 5, 1); SOL('teal'); },
    pump(t) { C(-4, 4, 16); FS('blue', 0.3); X.save(); X.translate(-4, 4); X.rotate(t * 3); for (let i = 0; i < 4; i++) { X.rotate(TAU / 4); L(0, 0, 11, 4, 'blue', 2.5); } X.restore(); RR(8, -16, 18, 10, 2); FS('blue', 0.4, 2); RR(-28, 18, 48, 8, 2); FS(GREY, 0.4, 2); },
    valve(t) { PC(-24, -10, 0, 4, -24, 18); FS('red', 0.45); PC(24, -10, 0, 4, 24, 18); FS('red', 0.45); L(0, 4, 0, -16, GREY, 3); X.save(); X.translate(0, -18); X.scale(1, 0.4); X.rotate(t); C(0, 0, 12); S('red', 3.5); L(-12, 0, 12, 0, 'red', 2); X.restore(); L(-30, 4, -24, 4, 'teal', 6); L(24, 4, 30, 4, 'teal', 6); },
    fan(t) { C(0, 0, 28); S(GREY, 2, 0.6); X.save(); X.rotate(t * 5); for (let i = 0; i < 3; i++) { X.rotate(TAU / 3); X.beginPath(); X.moveTo(0, 0); X.bezierCurveTo(8, -6, 24, -8, 22, 4); X.quadraticCurveTo(12, 8, 0, 0); FS('cyan', 0.45, 2); } X.restore(); C(0, 0, 4.5); SOL(WHITE); },
    turbine(t) { PC(-3, -6, 3, -6, 5, 30, -5, 30); FS(WHITE, 0.4, 2); X.save(); X.translate(0, -8); X.rotate(t * 1.6); for (let i = 0; i < 3; i++) { X.rotate(TAU / 3); X.beginPath(); X.moveTo(0, 0); X.quadraticCurveTo(4, -12, 0, -24); X.quadraticCurveTo(-3, -12, 0, 0); FS(WHITE, 0.6, 2); } X.restore(); C(0, -8, 3); SOL(WHITE); },
    motor(t) { RR(-24, -16, 36, 32, 6); FS('orange', 0.35); for (let i = 0; i < 4; i++) L(-18 + i * 8, -12, -18 + i * 8, 12, 'orange', 1.4); RR(12, -4, 16, 8, 2); FS(GREY, 0.6, 2); X.save(); X.translate(28, 0); X.rotate(t * 6); L(0, -9, 0, 9, WHITE, 2.4); X.restore(); RR(-20, 16, 28, 6, 2); FS(GREY, 0.5, 2); },
    engine(t) { RR(-24, -8, 44, 28, 3); FS(GREY, 0.35); RR(-18, -20, 32, 12, 2); FS(GREY, 0.45); for (let i = 0; i < 3; i++) { const y = Math.sin(t * 6 + i * 2) * 2; RR(-15 + i * 10, -27 + y, 6, 7, 1); FS('orange', 0.6, 1.5); } RR(20, -2, 8, 14, 2); FS(GREY, 0.5, 2); RR(-30, 0, 6, 12, 2); FS(GREY, 0.5, 2); C(-4, 6, 6); S(WHITE, 2, 0.7); },
    car(t) { X.beginPath(); X.moveTo(-28, 10); X.lineTo(-28, 0); X.quadraticCurveTo(-26, -4, -18, -5); X.lineTo(-10, -16); X.lineTo(10, -16); X.lineTo(18, -5); X.quadraticCurveTo(28, -4, 29, 2); X.lineTo(29, 10); X.closePath(); FS('red', 0.45); PC(-8, -13, -1, -13, -1, -5, -14, -5); F(SKY, 0.6); PC(2, -13, 8, -13, 14, -5, 2, -5); F(SKY, 0.6); wheelArt(-16, 12, 7, t * 4, WHITE, 4); wheelArt(17, 12, 7, t * 4, WHITE, 4); },
    bike(t) { wheelArt(-17, 10, 12, t * 3, 'cyan', 6); wheelArt(17, 10, 12, t * 3, 'cyan', 6); P(-17, 10, -4, 10, 8, -6, -8, -6, -17, 10); S('cyan', 2.6); P(-4, 10, -10, -10); S('cyan', 2.6); L(-14, -10, -6, -10, WHITE, 3); P(8, -6, 17, 10); S('cyan', 2.6); P(8, -6, 6, -14, 12, -14); S(WHITE, 2.6); },
    train(t) { RR(-28, -6, 40, 22, 3); FS('blue', 0.4); RR(4, -22, 18, 38, 3); FS('blue', 0.5); RR(8, -18, 10, 9, 2); F(SKY, 0.7); RR(-22, -14, 8, 8, 1); FS(GREY, 0.6, 2); for (const x of [-20, -6, 14]) wheelArt(x, 18, 6, t * 4, WHITE, 4); L(-30, 25, 30, 25, GREY, 2); for (let i = 0; i < 2; i++) { const p = mod(t * 0.6 + i / 2, 1); C(-18 + p * 4, -18 - p * 12, 3 + p * 4); X.save(); X.globalAlpha *= 1 - p; F(WHITE, 0.5); X.restore(); } },
    plane() { X.beginPath(); X.moveTo(0, -28); X.quadraticCurveTo(4, -24, 4, -14); X.lineTo(4, -6); X.lineTo(28, 6); X.lineTo(28, 10); X.lineTo(4, 4); X.lineTo(3, 18); X.lineTo(11, 24); X.lineTo(11, 27); X.lineTo(0, 24); X.lineTo(-11, 27); X.lineTo(-11, 24); X.lineTo(-3, 18); X.lineTo(-4, 4); X.lineTo(-28, 10); X.lineTo(-28, 6); X.lineTo(-4, -6); X.lineTo(-4, -14); X.quadraticCurveTo(-4, -24, 0, -28); X.closePath(); FS(WHITE, 0.35); },
    ship(t) { const b = Math.sin(t * 2) * 1.5; X.save(); X.translate(0, b); PC(-28, 4, 28, 4, 20, 18, -22, 18); FS('blue', 0.5); RR(-14, -8, 24, 12, 2); FS(WHITE, 0.4, 2); RR(-2, -22, 9, 14, 1); FS('red', 0.6, 2); for (const x of [-10, -3]) { C(x, -2, 2); SOL(SKY); } X.restore(); X.beginPath(); for (let k = 0; k <= 12; k++) { const x = -30 + k * 5; const y = 22 + Math.sin(k + t * 3) * 1.5; if (k) X.lineTo(x, y); else X.moveTo(x, y); } S('cyan', 2); },
    rocket(t) { const f = 0.8 + 0.2 * Math.sin(t * 20); X.beginPath(); X.moveTo(0, 18); X.lineTo(-5, 18 + 10 * f); X.lineTo(0, 22 + 8 * f); X.lineTo(5, 18 + 10 * f); X.closePath(); SOL('orange'); X.beginPath(); X.moveTo(0, -30); X.bezierCurveTo(12, -20, 11, 0, 9, 16); X.lineTo(-9, 16); X.bezierCurveTo(-11, 0, -12, -20, 0, -30); X.closePath(); FS(WHITE, 0.35); PC(-9, 4, -18, 18, -9, 16); FS('red', 0.6, 2); PC(9, 4, 18, 18, 9, 16); FS('red', 0.6, 2); C(0, -10, 5); FS(SKY, 0.6, 2); },
    satellite(t) { X.save(); X.rotate(Math.sin(t * 0.8) * 0.1); RR(-7, -7, 14, 14, 2); FS(GREY, 0.5); for (const s of [-1, 1]) { L(s * 7, 0, s * 11, 0, GREY, 2); RR(s > 0 ? 11 : -29, -7, 18, 14, 1); FS('blue', 0.45, 2); L(s * 20, -7, s * 20, 7, SKY, 1.2); } X.beginPath(); X.arc(0, -14, 6, PI * 1.15, PI * 1.85); S(WHITE, 2.4); L(0, -7, 0, -13, WHITE, 2); X.restore(); for (let i = 1; i <= 2; i++) { X.beginPath(); X.arc(0, -14, 6 + i * 6 + mod(t * 6, 6), PI * 1.3, PI * 1.7); S('cyan', 1.6, 0.7 - i * 0.2); } },
    house() { PC(-26, -2, 0, -26, 26, -2); FS('orange', 0.5); RR(-20, -2, 40, 28, 2); FS(WHITE, 0.2); RR(-5, 10, 10, 16, 2); FS(BROWN, 0.7, 2); RR(-16, 4, 8, 8, 1); FS(SKY, 0.6, 1.6); RR(8, 4, 8, 8, 1); FS(SKY, 0.6, 1.6); RR(12, -22, 6, 10, 1); FS('orange', 0.5, 2); },
    bridge() { L(-30, 6, 30, 6, 'orange', 4); for (const x of [-16, 16]) { L(x, -20, x, 24, 'orange', 3.5); } X.beginPath(); X.moveTo(-30, -6); X.quadraticCurveTo(-23, 4, -16, -20); X.quadraticCurveTo(0, 10, 16, -20); X.quadraticCurveTo(23, 4, 30, -6); S(WHITE, 2); for (let i = -12; i <= 12; i += 4) { const y = -20 + (1 - (i / 16) ** 2) * 15 * 1; L(i, Math.min(5, y + 5), i, 5, WHITE, 1.2); } X.beginPath(); for (let k = 0; k <= 12; k++) { const x = -30 + k * 5; const y = 24 + Math.sin(k) * 1.5; if (k) X.lineTo(x, y); else X.moveTo(x, y); } S('blue', 2); },
    tower() { P(-18, 28, -4, -24, 4, -24, 18, 28); S(GREY, 3); P(-4, -24, 0, -32, 4, -24); S(GREY, 2.5); for (const [y, w] of [[14, 15], [0, 11], [-12, 7]]) L(-w, y, w, y, GREY, 2.2); P(-15, 14, 11, 0, -11, 0, 7, -12); S(GREY, 1.4, 0.7); P(15, 14, -11, 0); S(GREY, 1.4, 0.7); X.beginPath(); X.arc(0, 28, 10, PI, 0); S(GREY, 2.5); },
    factory(t) { PC(-28, 26, -28, -2, -14, -12, -14, -2, 0, -12, 0, -2, 14, -12, 14, 26); FS(GREY, 0.35); RR(16, -22, 10, 48, 1); FS(GREY, 0.45); for (const x of [-22, -8, 6]) { RR(x, 6, 7, 7, 1); F('yellow', 0.7); } for (let i = 0; i < 3; i++) { const p = mod(t * 0.4 + i / 3, 1); C(21 + p * 6, -26 - p * 10, 3 + p * 4); X.save(); X.globalAlpha *= 1 - p; F(WHITE, 0.45); X.restore(); } },
    crane(t) { const s = Math.sin(t) * 4; L(-12, 28, -12, -24, 'yellow', 4); L(-24, -20, 28, -20, 'yellow', 3.5); P(-12, -30, -24, -20); S('yellow', 2); P(-12, -30, 22, -20); S('yellow', 1.6); RR(-24, -18, 8, 8, 1); FS(GREY, 0.6, 2); L(14 + s, -20, 14 + s, 8, WHITE, 1.4); RR(8 + s, 8, 12, 10, 1); FS('orange', 0.5, 2); for (let y = 20; y > -18; y -= 8) L(-15, y, -9, y - 6, 'yellow', 1.2); L(-24, 28, 4, 28, GREY, 3); },
    computer(t) { RR(-28, -24, 56, 36, 3); FS('cyan', 0.12); RR(-24, -20, 48, 28, 2); F('cyan', 0.18 + 0.05 * Math.sin(t * 2)); for (let i = 0; i < 3; i++) L(-18, -14 + i * 7, -18 + 14 + rnd(i) * 22, -14 + i * 7, 'cyan', 2); P(-4, 12, -6, 22, 6, 22, 4, 12); S('cyan', 2.5); L(-14, 24, 14, 24, 'cyan', 3); },
    chip() { RR(-17, -17, 34, 34, 4); FS('green', 0.35); RR(-8, -8, 16, 16, 2); S('green', 2); for (let i = 0; i < 4; i++) { const p = -12 + i * 8; L(p, -17, p, -25, GREY, 2.4); L(p, 17, p, 25, GREY, 2.4); L(-17, p, -25, p, GREY, 2.4); L(17, p, 25, p, GREY, 2.4); } },
    phone(t) { RR(-15, -28, 30, 56, 6); FS(WHITE, 0.2); RR(-11, -21, 22, 38, 2); F('cyan', 0.25 + 0.08 * Math.sin(t * 2)); C(0, 22, 2.6); S(WHITE, 1.6); L(-4, -24.5, 4, -24.5, WHITE, 1.6); for (let i = 0; i < 3; i++) { RR(-8, -16 + i * 11, 16, 7, 2); F('cyan', 0.5); } },
    antenna(t) { P(-12, 28, 0, -12, 12, 28); S(GREY, 3); L(-7, 14, 7, 14, GREY, 2); L(-4, 4, 4, 4, GREY, 2); C(0, -14, 4); SOL('red'); for (let i = 1; i <= 2; i++) { const r = 6 + i * 7 + mod(t * 8, 7); for (const s of [-1, 1]) { X.beginPath(); X.arc(0, -14, r, s > 0 ? -0.6 : PI - 0.6, s > 0 ? 0.6 : PI + 0.6); S('cyan', 2, 0.85 - i * 0.25); } } },
    robot(t) { L(0, -22, 0, -28, GREY, 2); C(0, -29, 3); SOL('red'); RR(-16, -22, 32, 20, 5); FS('cyan', 0.3); const bl = mod(t, 3) < 0.12 ? 1 : 4; E(-7, -13, 4, bl); SOL('yellow'); E(7, -13, 4, bl); SOL('yellow'); L(-6, -6, 6, -6, 'cyan', 2); RR(-14, 0, 28, 22, 4); FS('cyan', 0.25); C(0, 10, 4); F('orange', 0.6 + 0.3 * Math.sin(t * 4)); L(-14, 6, -24, 14 + Math.sin(t * 3) * 3, 'cyan', 4); L(14, 6, 24, 14 - Math.sin(t * 3) * 3, 'cyan', 4); L(-7, 22, -7, 28, 'cyan', 4); L(7, 22, 7, 28, 'cyan', 4); },
    sensor(t) { RR(-26, -12, 22, 24, 4); FS('green', 0.3); C(-15, 0, 6); FS(DARK, 0.6, 2); C(-15, 0, 2.5); SOL('green'); for (let i = 0; i < 3; i++) { const r = 8 + mod(t * 14 + i * 9, 27); X.beginPath(); X.arc(-4, 0, r, -0.7, 0.7); S('green', 2.2, Math.max(0, 1 - r / 36)); } },
    camera(t) { RR(-28, -14, 56, 34, 5); FS(WHITE, 0.2); RR(-12, -22, 18, 8, 2); FS(WHITE, 0.3, 2); C(0, 3, 12); FS(DARK, 0.6); C(0, 3, 7); F('cyan', 0.6); C(-3, 0, 2.5); SOL(WHITE); RR(16, -10, 7, 5, 1); F('yellow', mod(t, 3) < 0.15 ? 1 : 0.5); },
    clock(t) { C(0, 0, 26); FS(WHITE, 0.15); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; L(Math.cos(a) * 21, Math.sin(a) * 21, Math.cos(a) * (i % 3 ? 23 : 19), Math.sin(a) * (i % 3 ? 23 : 19), WHITE, i % 3 ? 1.4 : 2.4); } const m = t * 0.6; L(0, 0, Math.cos(m - PI / 2) * 18, Math.sin(m - PI / 2) * 18, 'cyan', 2.4); L(0, 0, Math.cos(m / 12 - PI / 2 + 1) * 12, Math.sin(m / 12 - PI / 2 + 1) * 12, WHITE, 3.4); C(0, 0, 2.5); SOL('cyan'); },
    scale(t) { const a = Math.sin(t * 1.2) * 0.12; L(0, -24, 0, 24, 'yellow', 3); L(-12, 26, 12, 26, 'yellow', 3.5); C(0, -24, 3); SOL('yellow'); X.save(); X.translate(0, -20); X.rotate(a); L(-24, 0, 24, 0, 'yellow', 3); X.restore(); for (const s of [-1, 1]) { const px = Math.cos(a) * 24 * s; const py = -20 + Math.sin(a) * 24 * s; L(px, py, px - 8, py + 16, 'yellow', 1.3); L(px, py, px + 8, py + 16, 'yellow', 1.3); X.beginPath(); X.moveTo(px - 11, py + 16); X.quadraticCurveTo(px, py + 24, px + 11, py + 16); X.closePath(); FS('yellow', 0.4, 2); } },
    ruler() { X.save(); X.rotate(-0.6); RR(-30, -8, 60, 16, 2); FS('yellow', 0.35); for (let i = 0; i <= 10; i++) L(-27 + i * 5.4, -8, -27 + i * 5.4, i % 5 ? -3 : 1, 'yellow', 1.6); X.restore(); },
    light(t) { X.save(); X.rotate(-0.5); const g = 0.25 + 0.1 * Math.sin(t * 3); PC(6, -6, 32, -18, 32, 18, 6, 6); X.fillStyle = tint('yellow', g); X.fill(); for (const y of [-12, 0, 12]) L(10, y * 0.3, 30, y, 'yellow', 2); RR(-26, -6, 24, 12, 3); FS(GREY, 0.5); PC(-2, -6, 6, -9, 6, 9, -2, 6); FS(GREY, 0.6, 2); X.restore(); },
    sound(t) { PC(-26, -8, -16, -8, -2, -20, -2, 20, -16, 8, -26, 8); FS('purple', 0.45); for (let i = 0; i < 3; i++) { const r = 8 + i * 8 + mod(t * 10, 8) * 0.4; X.beginPath(); X.arc(0, 0, r, -0.8, 0.8); S('purple', 2.6, 0.95 - i * 0.25); } },
    arrow(t) { const o = Math.sin(t * 3) * 2; X.save(); X.translate(o, 0); PC(-26, -7, 6, -7, 6, -18, 28, 0, 6, 18, 6, 7, -26, 7); FS('cyan', 0.45); X.restore(); },
    // Everyday things for younger learners (school, home, feelings).
    book(t) { const f = Math.sin(t * 1.4) * 2; PC(0, -16, -28, -22, -28, 20, 0, 26); FS('blue', 0.4); PC(0, -16, 28, -22, 28, 20, 0, 26); FS('blue', 0.4); L(0, -16, 0, 26, 'blue', 2.5); for (let i = 0; i < 3; i++) { L(-22, -10 + i * 9, -6, -7 + i * 9, WHITE, 2); L(6, -7 + i * 9 + f * 0.2, 22, -10 + i * 9, WHITE, 2); } },
    pencil(t) { X.save(); X.rotate(-0.75 + Math.sin(t * 2) * 0.04); RR(-22, -6, 36, 12, 2); FS('yellow', 0.6); RR(-28, -6, 7, 12, 2); FS(PINK, 0.7); PC(14, -6, 28, 0, 14, 6); FS(SKIN, 0.7, 2.4); PC(24, -2, 28, 0, 24, 2); SOL(DARK); L(-20, 0, 12, 0, 'orange', 1.4); X.restore(); },
    school() { PC(-30, -4, 0, -22, 30, -4); FS('red', 0.45); RR(-26, -4, 52, 30, 2); FS('orange', 0.25); RR(-6, 8, 12, 18, 2); FS(BROWN, 0.7, 2); for (const x of [-20, 12]) { RR(x, 2, 8, 8, 1); FS(SKY, 0.6, 1.6); } C(0, -10, 4); FS(WHITE, 0.5, 2); L(0, -22, 0, -32, GREY, 2); PC(0, -32, 10, -29, 0, -26); SOL('red'); },
    bed() { RR(-30, -14, 8, 38, 2); FS(BROWN, 0.6); RR(22, 0, 8, 24, 2); FS(BROWN, 0.6); RR(-24, 2, 48, 12, 3); FS('blue', 0.45); RR(-22, -6, 14, 9, 4); FS(WHITE, 0.6, 2); X.beginPath(); X.moveTo(-6, 2); X.quadraticCurveTo(8, -4, 24, 2); S('blue', 2.5); },
    bath(t) { X.beginPath(); X.moveTo(-28, -2); X.lineTo(28, -2); X.lineTo(24, 14); X.quadraticCurveTo(22, 20, 14, 20); X.lineTo(-14, 20); X.quadraticCurveTo(-22, 20, -24, 14); X.closePath(); FS(WHITE, 0.3); L(-20, 20, -22, 27, GREY, 3); L(20, 20, 22, 27, GREY, 3); P(-22, -2, -22, -22, -14, -22); S(GREY, 3); for (let i = 0; i < 4; i++) { const p = mod(t * 0.4 + i / 4, 1); C(-8 + i * 7 + Math.sin(p * 6) * 2, -6 - p * 22, 3 + p * 2); X.save(); X.globalAlpha *= 1 - p; S(SKY, 1.8); X.restore(); } },
    plate() { E(0, 4, 30, 18); FS(WHITE, 0.25); E(0, 4, 20, 12); S(WHITE, 1.8, 0.6); C(-6, 2, 6); FS('green', 0.6, 2); E(8, 4, 7, 5); FS('orange', 0.6, 2); L(-34, -16, -34, 20, GREY, 2.5); L(34, -16, 34, 20, GREY, 2.5); },
    apple() { X.beginPath(); X.moveTo(0, -12); X.bezierCurveTo(-14, -22, -28, -10, -24, 6); X.bezierCurveTo(-20, 22, -8, 28, 0, 22); X.bezierCurveTo(8, 28, 20, 22, 24, 6); X.bezierCurveTo(28, -10, 14, -22, 0, -12); X.closePath(); FS('red', 0.6); P(0, -12, 2, -24); S(BROWN, 3); leafPath(2, -20, 16, -26, 5); SOL(LEAF); X.beginPath(); X.arc(-12, -2, 6, PI * 1.1, PI * 1.6); S(WHITE, 2.4, 0.7); },
    ball(t) { const b = Math.abs(Math.sin(t * 3)) * 5; X.save(); X.translate(0, -b + 2); C(0, 0, 24); FS('orange', 0.5); X.beginPath(); X.moveTo(-24, 0); X.quadraticCurveTo(0, 12, 24, 0); S(WHITE, 2.2, 0.8); X.beginPath(); X.moveTo(0, -24); X.quadraticCurveTo(-10, 0, 0, 24); S(WHITE, 2.2, 0.8); X.restore(); E(0, 28, 16 - b, 3); F(GREY, 0.3); },
    music(t) { const o = Math.sin(t * 2.5) * 2; X.save(); X.translate(0, o); E(-14, 18, 8, 6, -0.4); FS('purple', 0.7); E(14, 12, 8, 6, -0.4); FS('purple', 0.7); L(-7, 16, -7, -18, 'purple', 3); L(21, 10, 21, -24, 'purple', 3); PC(-7, -18, 21, -24, 21, -14, -7, -8); FS('purple', 0.8, 2); X.restore(); },
    speech(t) { X.beginPath(); X.moveTo(-28, -14); X.quadraticCurveTo(-28, -24, -18, -24); X.lineTo(18, -24); X.quadraticCurveTo(28, -24, 28, -14); X.lineTo(28, 6); X.quadraticCurveTo(28, 16, 18, 16); X.lineTo(-4, 16); X.lineTo(-16, 28); X.lineTo(-14, 16); X.lineTo(-18, 16); X.quadraticCurveTo(-28, 16, -28, 6); X.closePath(); FS('cyan', 0.25); for (let i = 0; i < 3; i++) { C(-12 + i * 12, -4, 3.5 * (0.7 + 0.3 * Math.max(0, Math.sin(t * 4 - i)))); SOL('cyan'); } },
    family() { for (const [x, y, r, c] of [[-16, -12, 8, 'blue'], [16, -12, 8, 'purple'], [0, 4, 6, 'orange']]) { C(x, y, r); FS(c, 0.45, 2.4); X.beginPath(); X.moveTo(x - r * 1.6, y + r * 3.6); X.bezierCurveTo(x - r * 1.6, y + r * 1.2, x - r, y + r * 1.1, x, y + r * 1.1); X.bezierCurveTo(x + r, y + r * 1.1, x + r * 1.6, y + r * 1.2, x + r * 1.6, y + r * 3.6); X.closePath(); FS(c, 0.45, 2.4); } },
    toy(t) { const w = Math.sin(t * 2) * 0.12; X.save(); X.rotate(w); RR(-18, -2, 36, 22, 4); FS('red', 0.5); RR(-10, -18, 20, 16, 3); FS('yellow', 0.5); C(-4, -10, 2); SOL(DARK); C(4, -10, 2); SOL(DARK); X.restore(); for (const x of [-12, 12]) { C(x, 22, 6); FS(GREY, 0.6, 2.4); } },
    bag() { X.beginPath(); X.arc(0, -12, 10, PI, 0); S(BROWN, 4); RR(-22, -12, 44, 38, 6); FS('orange', 0.45); RR(-14, 4, 28, 14, 3); FS('orange', 0.6, 2); L(-14, -6, 14, -6, 'orange', 2); },
    shoe() { X.beginPath(); X.moveTo(-26, 14); X.lineTo(-26, -14); X.lineTo(-10, -14); X.quadraticCurveTo(-6, -2, 8, 0); X.quadraticCurveTo(28, 2, 28, 14); X.closePath(); FS('blue', 0.45); RR(-28, 14, 58, 8, 3); FS(WHITE, 0.6, 2); for (let i = 0; i < 3; i++) L(-16 + i * 6, -6 + i * 3, -10 + i * 6, -10 + i * 3, WHITE, 2); },
    cup(t) { X.beginPath(); X.moveTo(-18, -12); X.lineTo(18, -12); X.lineTo(14, 24); X.lineTo(-14, 24); X.closePath(); FS(WHITE, 0.3); X.beginPath(); X.arc(20, 4, 9, -PI / 2, PI / 2); S(WHITE, 3); E(0, -12, 18, 4); F(BROWN, 0.6); for (let i = -1; i <= 1; i++) { X.beginPath(); for (let k = 0; k <= 6; k++) { const y = -16 - k * 3; const x = i * 8 + Math.sin(k - t * 4 + i) * 2; if (k) X.lineTo(x, y); else X.moveTo(x, y); } S(WHITE, 2, 0.6); } },
    toothbrush(t) { const s = Math.sin(t * 6) * 3; X.save(); X.translate(s, 0); X.rotate(-0.5); RR(-30, -4, 40, 8, 4); FS('cyan', 0.5); RR(8, -6, 22, 4, 1); FS(WHITE, 0.4, 1.6); for (let i = 0; i < 6; i++) L(10 + i * 3.6, -6, 10 + i * 3.6, -16, WHITE, 2); E(19, -18, 9, 4); F(WHITE, 0.8); X.restore(); },
    timer(t) { C(0, 4, 24); FS(WHITE, 0.15); RR(-6, -28, 12, 6, 2); FS(GREY, 0.6, 2); const p = mod(t * 0.15, 1); X.beginPath(); X.moveTo(0, 4); X.arc(0, 4, 20, -PI / 2, -PI / 2 + TAU * (1 - p)); X.closePath(); X.fillStyle = tint('red', 0.55); X.fill(); C(0, 4, 3); SOL(WHITE); },
    calendar() { RR(-26, -20, 52, 46, 5); FS(WHITE, 0.2); RR(-26, -20, 52, 14, 5); FS('red', 0.6); for (const x of [-14, 14]) L(x, -26, x, -14, GREY, 3.5); for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { RR(-20 + c * 11, -2 + r * 9, 7, 6, 1); F(r === 1 && c === 2 ? 'red' : WHITE, r === 1 && c === 2 ? 0.9 : 0.4); } },
    globe(t) { C(0, -4, 24); FS('blue', 0.35); X.save(); C(0, -4, 24); X.clip(); const o = mod(t * 6, 48) - 24; for (const dx of [o, o - 48, o + 48]) { X.beginPath(); X.moveTo(dx - 12, -20); X.quadraticCurveTo(dx + 4, -18, dx + 2, -6); X.quadraticCurveTo(dx - 8, 4, dx - 2, 14); X.lineTo(dx - 14, 4); X.closePath(); F('green', 0.7); E(dx + 14, -2, 6, 9); F('green', 0.7); } X.restore(); C(0, -4, 24); S('blue', 2.5); L(0, 20, 0, 26, GREY, 3); L(-12, 27, 12, 27, GREY, 3.5); },
    flag(t) { L(-22, -28, -22, 28, GREY, 3.5); X.beginPath(); X.moveTo(-22, -26); for (let k = 0; k <= 10; k++) X.lineTo(-22 + k * 4.8, -26 + Math.sin(k * 0.7 - t * 4) * 3 * (k / 10)); for (let k = 10; k >= 0; k--) X.lineTo(-22 + k * 4.8, -2 + Math.sin(k * 0.7 - t * 4) * 3 * (k / 10)); X.closePath(); FS('red', 0.55); },
    coin(t) { const k = Math.abs(Math.cos(t * 1.2)) * 0.6 + 0.4; X.save(); X.scale(k, 1); C(0, 0, 24); FS('yellow', 0.55); C(0, 0, 17); S('yellow', 2, 0.7); X.restore(); if (k > 0.6) label(X, '1', 0, 1, { size: 22, weight: 800, fill: 'yellow' }); },
    puzzle() { X.beginPath(); X.moveTo(-22, -22); X.lineTo(-6, -22); X.arc(0, -22, 6, PI, 0); X.lineTo(22, -22); X.lineTo(22, -6); X.arc(22, 0, 6, -PI / 2, PI / 2); X.lineTo(22, 22); X.lineTo(6, 22); X.arc(0, 22, 6, 0, PI, true); X.lineTo(-22, 22); X.lineTo(-22, 6); X.arc(-22, 0, 6, PI / 2, -PI / 2, true); X.closePath(); FS('green', 0.45); },
    paint(t) { X.beginPath(); X.moveTo(0, -24); X.bezierCurveTo(22, -26, 30, -4, 24, 10); X.bezierCurveTo(18, 24, 4, 20, 2, 12); X.bezierCurveTo(0, 4, -10, 10, -16, 14); X.bezierCurveTo(-30, 18, -30, -20, 0, -24); X.closePath(); FS(BONE, 0.4); for (const [x, y, c] of [[-14, -8, 'red'], [-2, -14, 'yellow'], [12, -12, 'green'], [16, 2, 'blue']]) { C(x, y, 5); SOL(c); } X.save(); X.rotate(Math.sin(t * 2) * 0.05); L(-8, 30, 8, 2, BROWN, 3.5); X.restore(); },
    scissors(t) { const a = 0.18 + 0.14 * Math.abs(Math.sin(t * 3)); for (const s of [-1, 1]) { X.save(); X.rotate(s * a); L(0, 0, 28, 0, GREY, 4); C(-14, s * 6, 7); FS('red', 0.4, 3); L(-8, s * 3, 0, 0, 'red', 3); X.restore(); } C(0, 0, 2.5); SOL(WHITE); },
    bus(t) { RR(-28, -20, 56, 36, 6); FS('yellow', 0.5); for (let i = 0; i < 4; i++) { RR(-24 + i * 12, -15, 9, 10, 2); F(SKY, 0.7); } RR(20, -15, 5, 22, 1); F(SKY, 0.5); L(-28, 4, 28, 4, 'orange', 2); for (const x of [-16, 16]) wheelArt(x, 17, 7, t * 3, GREY, 4); },
    shop() { RR(-26, -6, 52, 32, 2); FS(WHITE, 0.2); for (let i = 0; i < 6; i++) { PC(-28 + i * 9.4, -20, -18.6 + i * 9.4, -20, -18.6 + i * 9.4, -6, -28 + i * 9.4, -6); F(i % 2 ? WHITE : 'red', i % 2 ? 0.5 : 0.7); } X.beginPath(); for (let i = 0; i < 6; i++) X.arc(-23.3 + i * 9.4, -6, 4.7, 0, PI); S('red', 2); RR(-6, 8, 12, 18, 1); FS(BROWN, 0.6, 2); RR(-22, 4, 12, 10, 1); FS(SKY, 0.5, 1.6); RR(10, 4, 12, 10, 1); FS(SKY, 0.5, 1.6); },
    doctor() { C(0, -14, 11); FS(SKIN, 0.55); X.beginPath(); X.moveTo(-24, 28); X.bezierCurveTo(-24, 4, -12, -1, 0, -1); X.bezierCurveTo(12, -1, 24, 4, 24, 28); X.closePath(); FS(WHITE, 0.45); X.beginPath(); X.moveTo(-8, 0); X.quadraticCurveTo(-10, 16, 0, 16); X.quadraticCurveTo(8, 16, 8, 6); S(GREY, 2.4); C(8, 6, 3); SOL(GREY); RR(-17, 12, 10, 10, 1); F('red', 0.15); L(-12, 13, -12, 21, 'red', 2.6); L(-16, 17, -8, 17, 'red', 2.6); },
    castle(t) { RR(-28, -14, 14, 40, 1); FS(GREY, 0.4); RR(14, -14, 14, 40, 1); FS(GREY, 0.4); RR(-14, -4, 28, 30, 1); FS(GREY, 0.3); for (const x0 of [-28, 14]) for (let i = 0; i < 3; i++) { RR(x0 + i * 5, -20, 4, 6, 0.5); FS(GREY, 0.4, 1.6); } X.beginPath(); X.moveTo(-6, 26); X.lineTo(-6, 12); X.arc(0, 12, 6, PI, 0); X.lineTo(6, 26); X.closePath(); FS(BROWN, 0.7, 2); L(0, -4, 0, -26, GREY, 2); X.beginPath(); X.moveTo(0, -26); X.lineTo(12, -23 + Math.sin(t * 3) * 1.5); X.lineTo(0, -20); X.closePath(); SOL('red'); },
    compass(t) { C(0, 0, 26); FS(WHITE, 0.15); C(0, 0, 21); S(WHITE, 1.4, 0.5); X.save(); X.rotate(Math.sin(t * 1.3) * 0.25); PC(0, -20, 6, 0, -6, 0); SOL('red'); PC(0, 20, 6, 0, -6, 0); SOL(WHITE); X.restore(); C(0, 0, 3); SOL(DARK); label(X, 'N', 0, -31, { size: 11, weight: 800, fill: 'red' }); },
    flask(t) { X.beginPath(); X.moveTo(-6, -26); X.lineTo(-6, -8); X.lineTo(-24, 22); X.quadraticCurveTo(-26, 28, -18, 28); X.lineTo(18, 28); X.quadraticCurveTo(26, 28, 24, 22); X.lineTo(6, -8); X.lineTo(6, -26); X.closePath(); FS(WHITE, 0.15); X.save(); X.clip(); X.beginPath(); X.moveTo(-30, 8 + Math.sin(t * 2) * 1.5); X.quadraticCurveTo(0, 4, 30, 8 - Math.sin(t * 2) * 1.5); X.lineTo(30, 30); X.lineTo(-30, 30); X.closePath(); F('green', 0.6); X.restore(); L(-10, -26, 10, -26, WHITE, 3); for (let i = 0; i < 3; i++) { const p = mod(t * 0.6 + i / 3, 1); C(-6 + i * 6, 22 - p * 18, 2.2); X.save(); X.globalAlpha *= 1 - p; S(WHITE, 1.5); X.restore(); } },
    microscope() { RR(-24, 22, 40, 6, 2); FS(GREY, 0.5); X.beginPath(); X.moveTo(10, 22); X.quadraticCurveTo(22, 4, 6, -6); S(GREY, 4); X.save(); X.translate(-2, -10); X.rotate(-0.5); RR(-6, -18, 12, 30, 3); FS(WHITE, 0.4); RR(-8, -22, 16, 6, 2); FS(GREY, 0.6, 2); X.restore(); RR(-20, 10, 26, 4, 1); FS(GREY, 0.6, 2); C(-8, 6, 3); SOL('cyan'); },
    smile() { C(0, 0, 26); FS('yellow', 0.45); C(-9, -6, 3.2); SOL(DARK); C(9, -6, 3.2); SOL(DARK); X.beginPath(); X.arc(0, 2, 14, 0.2 * PI, 0.8 * PI); S(DARK, 3.2); C(-15, 6, 4); F(PINK, 0.5); C(15, 6, 4); F(PINK, 0.5); },
    headphones(t) { X.beginPath(); X.arc(0, 4, 24, PI, 0); S(GREY, 5); for (const s of [-1, 1]) { RR(s > 0 ? 16 : -30, 0, 14, 22, 5); FS('purple', 0.55); } for (let i = 1; i <= 2; i++) { const r = 4 + i * 4 + mod(t * 6, 4); X.save(); X.globalAlpha *= 0.7 - i * 0.2; X.beginPath(); X.arc(0, 14, r, -0.6 - PI / 2, 0.6 - PI / 2); S('purple', 2); X.restore(); } },
    door() { RR(-18, -28, 36, 56, 3); FS(BROWN, 0.5); RR(-12, -22, 24, 18, 2); S(BROWN, 2, 0.7); RR(-12, 2, 24, 20, 2); S(BROWN, 2, 0.7); C(11, 2, 3); SOL('yellow'); L(-26, 28, 26, 28, GREY, 2.5); },
    chair() { RR(-16, -28, 32, 30, 4); FS('orange', 0.45); RR(-20, 2, 40, 8, 2); FS('orange', 0.6); L(-16, 10, -18, 28, BROWN, 3.5); L(16, 10, 18, 28, BROWN, 3.5); L(-10, 10, -10, 24, BROWN, 2.5); L(10, 10, 10, 24, BROWN, 2.5); },
    hat() { E(0, 14, 30, 9); FS('blue', 0.5); X.beginPath(); X.moveTo(-18, 12); X.lineTo(-16, -14); X.quadraticCurveTo(0, -22, 16, -14); X.lineTo(18, 12); X.closePath(); FS('blue', 0.45); X.beginPath(); X.moveTo(-17, 2); X.quadraticCurveTo(0, 6, 17, 2); X.lineTo(17.5, 8); X.quadraticCurveTo(0, 12, -17.5, 8); X.closePath(); SOL('red'); },
    shirt() { PC(-10, -24, -28, -14, -22, 0, -16, -4, -16, 26, 16, 26, 16, -4, 22, 0, 28, -14, 10, -24, 0, -16); FS('teal', 0.45); for (let i = 0; i < 3; i++) { C(0, -6 + i * 9, 1.8); SOL(WHITE); } },
    map() { PC(-28, -18, -10, -24, 10, -18, 28, -24, 28, 20, 10, 26, -10, 20, -28, 26); FS('#e9c46a', 0.35); L(-10, -24, -10, 20, '#e9c46a', 1.6); L(10, -18, 10, 26, '#e9c46a', 1.6); X.save(); X.setLineDash([4, 4]); X.beginPath(); X.moveTo(-20, 14); X.quadraticCurveTo(-6, -10, 14, 4); S('red', 2.2); X.restore(); L(12, -10, 20, -2, 'red', 3); L(20, -10, 12, -2, 'red', 3); },
    crown(t) { PC(-26, 18, -28, -14, -14, 0, 0, -22, 14, 0, 28, -14, 26, 18); FS('yellow', 0.55); RR(-26, 14, 52, 8, 2); FS('yellow', 0.7, 2); for (const [x, y, c] of [[-28, -16, 'red'], [0, -24, 'cyan'], [28, -16, 'red']]) { C(x, y, 3.5 + 0.6 * Math.sin(t * 3)); SOL(c); } C(0, 6, 3.5); SOL('purple'); },
    scroll() { RR(-20, -20, 40, 40, 2); FS(BONE, 0.4); for (const y of [-22, 22]) { E(0, y, 24, 5); FS(BROWN, 0.6, 2); } for (let i = 0; i < 4; i++) L(-12, -10 + i * 7, i === 3 ? 4 : 12, -10 + i * 7, BROWN, 1.8); },
    mail(t) { const b = Math.sin(t * 2) * 1.5; X.save(); X.translate(0, b); RR(-28, -18, 56, 38, 4); FS(WHITE, 0.25); P(-28, -16, 0, 6, 28, -16); S(WHITE, 2.6); L(-28, 20, -6, 0, WHITE, 1.6); L(28, 20, 6, 0, WHITE, 1.6); C(18, -10, 5); SOL('red'); X.restore(); },
    key(t) { X.save(); X.rotate(-0.6 + Math.sin(t * 1.5) * 0.06); C(-16, 0, 11); FS('yellow', 0.4); C(-16, 0, 4); SOL(DARK); RR(-5, -3, 32, 6, 2); FS('yellow', 0.6, 2); L(18, 3, 18, 11, 'yellow', 4); L(24, 3, 24, 9, 'yellow', 4); X.restore(); },
    gift(t) { const l = Math.max(0, Math.sin(t * 2)) * 3; RR(-24, -6, 48, 32, 3); FS('purple', 0.45); X.save(); X.translate(0, -l); RR(-27, -16, 54, 11, 3); FS('purple', 0.6); X.restore(); RR(-4, -16 - l, 8, 42 + l, 1); SOL('yellow'); for (const s of [-1, 1]) { E(s * 8, -21 - l, 8, 5, s * 0.5); FS('yellow', 0.5, 2.4); } },
    umbrella(t) { X.save(); X.rotate(Math.sin(t * 1.5) * 0.06); X.beginPath(); X.moveTo(-28, 0); X.quadraticCurveTo(-26, -26, 0, -26); X.quadraticCurveTo(26, -26, 28, 0); for (let i = 3; i >= 0; i--) X.quadraticCurveTo(-28 + (i + 0.5) * 14, -6, -28 + i * 14, 0); X.closePath(); FS('red', 0.5); L(0, -26, 0, 20, GREY, 3); X.beginPath(); X.arc(-5, 20, 5, 0, PI); S(GREY, 3); X.restore(); for (let i = 0; i < 3; i++) { const y = 10 + mod(t * 30 + i * 9, 20); L(-26 + i * 26, y - 30, -28 + i * 26, y - 24, 'blue', 2); } },
  };
  // A neutral glyph for an icon name we do not know: its first letter.
  function unknownIcon(name) {
    RR(-24, -24, 48, 48, 14); FS('muted', 0.2, 2.5);
    label(X, (String(name || '?').trim()[0] || '?').toUpperCase(), 0, 2, { size: 28, weight: 700, fill: 'ink' });
  }
  // Draws an icon centred at (x, y) about s pixels across.
  function drawIcon(ctx, name, x, y, s, t = 0) {
    if (!(s > 1)) return;
    const prev = X; X = ctx;
    const key = typeof name === 'string' ? name.trim().toLowerCase() : '';
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 64, s / 64);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const fn = ICON_ART[key] || ICON_ART[ALIAS[key]];
    try { if (fn) fn(t); else unknownIcon(key); } catch { /* a broken icon leaves a blank */ }
    ctx.restore(); X = prev;
  }
  // Near names authors may reach for.
  const ALIAS = { lungs: 'lung', water: 'drop', sea: 'ocean', earth: 'soil', planet: 'moon', flame: 'fire', heat: 'fire', energy: 'lightning', electricity: 'lightning', bacteria: 'germ', virus: 'germ', human: 'person', people: 'person', man: 'person', woman: 'person', child: 'baby', boy: 'person', girl: 'person', building: 'house', home: 'house', city: 'house', lamp: 'bulb', torch: 'light', speaker: 'sound', music: 'sound', time: 'clock', weight: 'scale', laptop: 'computer', mobile: 'phone', bicycle: 'bike', boat: 'ship', airplane: 'plane', aeroplane: 'plane', lorry: 'car', truck: 'car', bus: 'car', plant: 'leaf', bug: 'ant', insect: 'ant', worm: 'snake', bones: 'bone', blood_cell: 'blood', teeth: 'tooth', microchip: 'chip', processor: 'chip', wifi: 'antenna', signal: 'antenna', radio: 'antenna', windmill: 'turbine', cog: 'gear', storm: 'lightning', ice_cube: 'ice', vapour: 'steam', vapor: 'steam', hill: 'mountain', stone: 'rock', ground: 'soil', mouth: 'tongue', arm: 'muscle', skeleton: 'bone' };
  const ICON_NAMES = ICONS;

  // ─── Silhouettes for x-anatomy ────────────────────────────────────────
  // Each body is drawn in its own box, 100 units tall and 100 × a wide (a is
  // its width / height), from the top left; a part's x, y (0 to 1) are
  // fractions of that box, so a label lands on the drawing itself.
  let U = 1; // one screen pixel in body units
  const BW = (px) => px * U;
  // A smooth closed (or open) curve through points [x0, y0, x1, y1, …].
  function smoothPoly(p, closed = true) {
    const n = p.length / 2;
    X.beginPath();
    if (n < 3) { P(...p); return; }
    if (closed) {
      X.moveTo((p[0] + p[2]) / 2, (p[1] + p[3]) / 2);
      for (let i = 1; i <= n; i++) {
        const a = i % n; const b = (i + 1) % n;
        X.quadraticCurveTo(p[2 * a], p[2 * a + 1], (p[2 * a] + p[2 * b]) / 2, (p[2 * a + 1] + p[2 * b + 1]) / 2);
      }
      X.closePath();
    } else {
      X.moveTo(p[0], p[1]);
      for (let i = 1; i < n - 1; i++) X.quadraticCurveTo(p[2 * i], p[2 * i + 1], (p[2 * i] + p[2 * i + 2]) / 2, (p[2 * i + 1] + p[2 * i + 3]) / 2);
      X.lineTo(p[2 * n - 2], p[2 * n - 1]);
    }
  }
  // A symmetric outline: the right half as offsets from the centre line.
  function mirrored(cx, half) {
    const out = [];
    for (let i = 0; i < half.length; i += 2) out.push(cx + half[i], half[i + 1]);
    for (let i = half.length - 2; i >= 0; i -= 2) out.push(cx - half[i], half[i + 1]);
    return out;
  }
  const bodyFS = (c, a = 0.2, w = 2.6) => { F(c, a); S(c, BW(w), 0.9); };
  const bodyS = (c, w = 2, a = 0.8) => S(c, BW(w), a);
  const bL = (x0, y0, x1, y1, c, w = 2, a = 0.8) => { P(x0, y0, x1, y1); S(c, BW(w), a); };
  function spiral(cx, cy, r, turns = 2.5) { X.beginPath(); for (let i = 0; i <= 60; i++) { const q = i / 60; const a = q * turns * TAU; const rr = r * (1 - q * 0.85); if (i) X.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); else X.moveTo(cx + rr, cy); } }
  const HUMAN_HALF = [0, 15.5, 3.2, 16.2, 4, 18.5, 9, 19.8, 12.6, 21.8, 14.4, 26, 15, 33, 15.8, 42, 16.6, 50, 17.6, 55, 16.8, 59.5, 14.6, 59.5, 13.8, 55, 13.2, 48, 12.4, 40, 11.4, 32, 10.4, 30, 10, 37, 9, 45, 10, 53, 9.8, 64, 9.2, 74, 8.4, 79, 8.8, 87, 7.4, 94, 9.8, 97.5, 8.6, 99.2, 3, 99.2, 2.8, 94, 3, 86, 2.4, 78, 1.8, 66, 0.8, 59, 0, 58.5];
  const BODY_ART = {
    human: { a: 0.46, c: 'cyan', draw(t) {
      smoothPoly(mirrored(23, HUMAN_HALF)); bodyFS('cyan', 0.16);
      E(23, 8.2, 6.6, 7.6); bodyFS('cyan', 0.16);
      Q(14, 21.5, 23, 24, 32, 21.5); bodyS('cyan', 1.4, 0.4);
      Q(17, 30, 23, 33, 29, 30); bodyS('cyan', 1.2, 0.3);
      C(23, 47, 0.7); F('cyan', 0.6);
      bL(23, 25, 23, 44, 'cyan', 1, 0.25);
      const b = 0.5 + 0.5 * Math.sin(t * 2.4);
      C(26, 31, 2.4 + b * 0.6); F('red', 0.25 + 0.2 * b);
    } },
    'human-head': { a: 0.85, c: 'cyan', draw(t) {
      X.beginPath(); X.moveTo(31, 62); X.lineTo(31, 74); X.bezierCurveTo(20, 80, 4, 84, 1, 100); X.lineTo(84, 100); X.bezierCurveTo(81, 84, 65, 80, 54, 74); X.lineTo(54, 62); X.closePath(); bodyFS('cyan', 0.12);
      E(18.5, 40, 4, 8); bodyFS('cyan', 0.18); E(66.5, 40, 4, 8); bodyFS('cyan', 0.18);
      E(42.5, 36, 24, 30); bodyFS('cyan', 0.16);
      X.beginPath(); X.moveTo(18.6, 30); X.bezierCurveTo(18, 8, 34, 4, 42.5, 5); X.bezierCurveTo(56, 4, 68, 10, 66.4, 30); X.bezierCurveTo(60, 18, 50, 14, 40, 16); X.bezierCurveTo(30, 18, 22, 22, 18.6, 30); X.closePath(); F('cyan', 0.28);
      const bl = mod(t, 4.2) < 0.13 ? 0.15 : 1;
      for (const ex of [33, 52]) { E(ex, 36, 5, 2.8 * bl); F(WHITE, 0.5); if (bl > 0.5) { C(ex, 36, 1.9); SOL('blue'); } Q(ex - 5, 31, ex, 29, ex + 5, 31); bodyS('cyan', 1.4, 0.6); }
      X.beginPath(); X.moveTo(42.5, 38); X.lineTo(40, 48); X.quadraticCurveTo(42.5, 50, 45, 48); bodyS('cyan', 1.4, 0.6);
      X.beginPath(); X.moveTo(36, 55.5); X.quadraticCurveTo(42.5, 59, 49, 55.5); bodyS(PINK, 2, 0.8);
    } },
    skeleton: { a: 0.46, c: BONE, draw(t) {
      const B = BONE; const w = 2.6;
      // limbs
      for (const s of [-1, 1]) {
        const x = (v) => 23 + s * v;
        bL(x(10), 20.5, x(13.4), 39.5, B, 3.2, 0.9); bL(x(13.6), 40.5, x(15.4), 55, B, 2, 0.85); bL(x(12.6), 41, x(14.2), 55.5, B, 2, 0.85);
        for (let i = 0; i < 4; i++) bL(x(14.6), 56, x(14 + i * 1.1), 61 + (i === 0 || i === 3 ? -1 : 0), B, 1.3, 0.8);
        bL(x(5.8), 57.5, x(7.6), 77.5, B, 3.4, 0.9); C(x(7.4), 78.8, 1.4); F(B, 0.7);
        bL(x(7.4), 80.5, x(6.8), 94.5, B, 2.6, 0.9); bL(x(8.8), 80.5, x(8.4), 94, B, 1.4, 0.75);
        P(x(6.8), 95.5, x(7.6), 98.6, x(10.6), 98.6); S(B, BW(2.2), 0.85);
        C(x(10), 20.5, 1.4); F(B, 0.8); C(x(13.5), 40, 1.2); F(B, 0.8);
        bL(23, 19.5, x(10.6), 20, B, 2, 0.85); // clavicle
      }
      // spine
      for (let i = 0; i < 15; i++) { RR(21.6, 16.2 + i * 2.65, 2.8, 2, 0.6); F(B, 0.75); }
      // ribs
      for (let i = 0; i < 6; i++) {
        const y = 22 + i * 3.4; const wd = 9.6 - Math.abs(i - 2.2) * 0.75;
        for (const s of [-1, 1]) { X.beginPath(); X.moveTo(23 + s * 1.2, y); X.quadraticCurveTo(23 + s * (wd + 1.2), y - 0.5, 23 + s * wd, y + 4.6); bodyS(B, 1.5, 0.8); }
      }
      RR(22.2, 21, 1.6, 13, 0.8); F(B, 0.6);
      // pelvis
      X.beginPath(); X.moveTo(23, 52); X.bezierCurveTo(19, 50.5, 14, 50.5, 14.2, 54); X.bezierCurveTo(14.4, 57.5, 18, 59.5, 21, 59.5); X.lineTo(25, 59.5); X.bezierCurveTo(28, 59.5, 31.6, 57.5, 31.8, 54); X.bezierCurveTo(32, 50.5, 27, 50.5, 23, 52); X.closePath(); bodyFS(B, 0.3, w * 0.8);
      C(19.6, 56, 1.3); SOL(DARK); C(26.4, 56, 1.3); SOL(DARK);
      // skull
      E(23, 7.6, 6.2, 6.8); bodyFS(B, 0.35, w * 0.8);
      RR(19.6, 11.6, 6.8, 4.2, 1.6); bodyFS(B, 0.35, 1.6);
      E(20.6, 7.6, 1.8, 2); SOL(DARK); E(25.4, 7.6, 1.8, 2); SOL(DARK);
      PC(23, 9.4, 22, 11.2, 24, 11.2); SOL(DARK);
      for (let i = 0; i < 4; i++) bL(21 + i * 1.35, 12.6, 21 + i * 1.35, 14.6, DARK, 0.8, 0.8);
      void t;
    } },
    heart: { a: 0.9, c: 'red', draw(t) {
      const beat = Math.max(0, Math.sin(t * 6.5)) ** 4;
      X.save(); X.translate(50, 62); X.scale(1 + 0.025 * beat, 1 + 0.025 * beat); X.translate(-50, -62);
      // vessels: vena cava, aorta, pulmonary artery
      X.beginPath(); X.moveTo(24, 40); X.lineTo(24, 1); bodyS('blue', 9, 0.75);
      X.beginPath(); X.moveTo(48, 36); X.lineTo(48, 15); X.quadraticCurveTo(48, 5, 59, 5); X.quadraticCurveTo(71, 5, 72, 16); X.lineTo(72, 30); bodyS('red', 9, 0.9);
      for (const x of [53, 59, 65]) bL(x, 5, x + (x - 59) * 0.25, 0.5, 'red', 3, 0.85);
      X.beginPath(); X.moveTo(58, 40); X.quadraticCurveTo(52, 20, 34, 18); bodyS('purple', 8, 0.85);
      bL(34, 18, 28, 12, 'purple', 4, 0.7); bL(34, 18, 28, 24, 'purple', 4, 0.7);
      const outline = () => { X.beginPath(); X.moveTo(30, 34); X.bezierCurveTo(14, 30, 4, 48, 10, 62); X.bezierCurveTo(16, 76, 38, 90, 58, 99); X.bezierCurveTo(72, 88, 90, 70, 88, 50); X.bezierCurveTo(86, 36, 76, 30, 66, 33); X.bezierCurveTo(56, 27, 42, 28, 30, 34); X.closePath(); };
      outline(); F('red', 0.12);
      X.save(); outline(); X.clip();
      X.fillStyle = tint('blue', 0.18); X.fillRect(0, 0, 49, 100);
      X.fillStyle = tint('red', 0.2); X.fillRect(49, 0, 41, 100);
      X.restore();
      outline(); S('red', BW(2.8), 0.9);
      E(20, 44, 11, 9, -0.3); bodyS('blue', 1.4, 0.45);
      X.beginPath(); X.moveTo(49, 31); X.bezierCurveTo(46, 50, 47, 72, 56, 97); bodyS(WHITE, 1.6, 0.45);
      X.beginPath(); X.moveTo(9, 55); X.quadraticCurveTo(48, 48, 88, 52); bodyS(WHITE, 1.4, 0.35);
      for (const [x, y] of [[30, 52], [68, 51]]) { P(x - 4, y - 0.5, x, y + 3, x + 4, y - 0.5); bodyS(WHITE, 1.4, 0.7); }
      X.beginPath(); X.moveTo(62, 40); X.quadraticCurveTo(74, 60, 64, 86); bodyS('red', 1, 0.3);
      X.restore();
    } },
    lungs: { a: 1, c: PINK, draw(t) {
      const br = 1 + 0.03 * Math.sin(t * 1.8);
      RR(46, 0, 8, 31, 3); bodyFS(WHITE, 0.15, 1.6);
      for (let y = 4; y < 30; y += 4) bL(46.5, y, 53.5, y, WHITE, 1, 0.5);
      X.save(); X.translate(50, 60); X.scale(br, br); X.translate(-50, -60);
      smoothPoly([44, 26, 36, 21, 25, 26, 15, 40, 10, 60, 8, 80, 12, 92, 24, 95, 36, 91, 44, 85, 46, 60, 45, 40]); bodyFS(PINK, 0.24);
      smoothPoly([56, 26, 64, 21, 75, 26, 85, 40, 90, 60, 92, 80, 88, 92, 76, 95, 66, 93, 60, 86, 64, 76, 56, 68, 54, 50, 55, 38]); bodyFS(PINK, 0.24);
      for (const s of [-1, 1]) {
        const x = (v) => 50 + s * v;
        P(50, 31, x(12), 40, x(20), 52); S(WHITE, BW(3), 0.6);
        P(x(12), 40, x(24), 44, x(32), 46); S(WHITE, BW(1.6), 0.45);
        P(x(20), 52, x(26), 62, x(30), 74); S(WHITE, BW(1.6), 0.45);
        P(x(20), 52, x(16), 66, x(18), 82); S(WHITE, BW(1.6), 0.45);
        P(x(26), 62, x(34), 64); S(WHITE, BW(1.2), 0.4);
        P(x(16), 66, x(10), 72); S(WHITE, BW(1.2), 0.4);
      }
      X.restore();
      Q(3, 99, 50, 86 - 3 * Math.sin(t * 1.8), 97, 99); bodyS('orange', 1.8, 0.6);
    } },
    eye: { a: 1.25, c: 'cyan', draw(t) {
      C(70, 50, 40); bodyFS(WHITE, 0.08, 2.6);
      X.beginPath(); X.arc(70, 50, 36.5, -1.25, 1.25); S('orange', BW(5), 0.6);
      X.beginPath(); X.moveTo(105, 46); X.quadraticCurveTo(116, 47, 125, 44); X.lineTo(125, 60); X.quadraticCurveTo(116, 57, 105, 55); X.closePath(); bodyFS('yellow', 0.35, 1.6);
      X.beginPath(); X.moveTo(34, 29); X.quadraticCurveTo(16, 50, 34, 71); bodyFS(SKY, 0.15, 2.4);
      bL(36, 31, 36, 43, 'teal', 4, 0.9); bL(36, 57, 36, 69, 'teal', 4, 0.9);
      E(42, 50, 6, 13); bodyFS('cyan', 0.35, 1.8);
      bL(42, 37, 38, 31, GREY, 1.4, 0.7); bL(42, 63, 38, 69, GREY, 1.4, 0.7);
      X.save(); X.setLineDash([BW(10), BW(8)]); X.lineDashOffset = -t * 30 * U;
      P(0, 40, 42, 41, 106, 55); S('yellow', BW(2), 0.75); P(0, 60, 42, 59, 106, 45); S('yellow', BW(2), 0.75);
      X.restore();
      C(106.5, 50, 1.8); F('yellow', 0.8);
    } },
    ear: { a: 1.3, c: SKIN, draw(t) {
      X.beginPath(); X.moveTo(52, 0); X.lineTo(130, 0); X.lineTo(130, 100); X.lineTo(52, 100); X.quadraticCurveTo(56, 76, 52, 66); X.lineTo(56, 40); X.quadraticCurveTo(50, 22, 52, 0); X.closePath(); F(BONE, 0.07);
      smoothPoly([22, 6, 9, 18, 4, 38, 7, 58, 13, 74, 21, 86, 29, 82, 27, 68, 30, 58, 36, 52, 31, 42, 27, 28, 31, 16]); bodyFS(SKIN, 0.3);
      Q(20, 18, 13, 38, 20, 62); bodyS(SKIN, 1.5, 0.6);
      X.beginPath(); X.moveTo(33, 46); X.lineTo(59, 47); X.lineTo(59, 55); X.lineTo(33, 57); X.closePath(); bodyFS(SKIN, 0.18, 1.6);
      const v = Math.sin(t * 9) * 0.6;
      E(60 + v, 51, 1.4, 7.5); bodyFS(PINK, 0.6, 1.6);
      E(70, 52, 10, 12); F(WHITE, 0.05);
      E(64.5, 47, 2, 3, 0.3); bodyFS(BONE, 0.6, 1.2); E(69, 44.5, 2.2, 2.6); bodyFS(BONE, 0.6, 1.2);
      P(71, 46, 74, 50, 77, 50); S(BONE, BW(1.8), 0.9); P(74, 50, 74, 53); S(BONE, BW(1.6), 0.9);
      for (const [x, y, r] of [[85, 25, 7], [95, 30, 6], [86, 37, 5.5]]) { C(x, y, r); bodyS('purple', 3, 0.7); }
      spiral(92, 56, 11); bodyS('orange', 3.4, 0.8);
      X.beginPath(); X.moveTo(101, 52); X.quadraticCurveTo(112, 48, 129, 46); bodyS('yellow', 3.6, 0.85);
      X.beginPath(); X.moveTo(72, 63); X.quadraticCurveTo(80, 80, 92, 98); bodyS(SKIN, 3.5, 0.5);
      for (let i = 0; i < 3; i++) { const p = mod(t * 0.9 + i / 3, 1); C(34 + p * 24, 51, 1.3); X.save(); X.globalAlpha *= Math.sin(p * PI); F('cyan', 0.9); X.restore(); }
    } },
    tooth: { a: 0.62, c: WHITE, draw(t) {
      X.fillStyle = tint(BROWN, 0.16); X.fillRect(0, 52, 62, 48);
      for (let i = 0; i < 12; i++) { C(rnd(i) * 62, 56 + rnd(i + 20) * 42, 1.2); F(BROWN, 0.35); }
      X.beginPath(); X.moveTo(0, 36); X.quadraticCurveTo(6, 33, 11, 37); X.lineTo(51, 37); X.quadraticCurveTo(56, 33, 62, 36); X.lineTo(62, 56); X.lineTo(0, 56); X.closePath(); F(PINK, 0.3);
      const outline = () => { X.beginPath(); X.moveTo(10, 30); X.bezierCurveTo(8, 12, 14, 4, 20, 6); X.quadraticCurveTo(26, 10, 31, 6); X.quadraticCurveTo(36, 10, 42, 6); X.bezierCurveTo(48, 4, 54, 12, 52, 30); X.lineTo(50, 40); X.bezierCurveTo(49, 60, 47, 84, 42, 97); X.quadraticCurveTo(39, 100, 37, 96); X.bezierCurveTo(36, 80, 35, 62, 31, 54); X.bezierCurveTo(27, 62, 26, 80, 25, 96); X.quadraticCurveTo(23, 100, 20, 97); X.bezierCurveTo(15, 84, 13, 60, 12, 40); X.closePath(); };
      outline(); F(BONE, 0.35);
      X.beginPath(); X.moveTo(10, 30); X.bezierCurveTo(8, 12, 14, 4, 20, 6); X.quadraticCurveTo(26, 10, 31, 6); X.quadraticCurveTo(36, 10, 42, 6); X.bezierCurveTo(48, 4, 54, 12, 52, 30); X.lineTo(51, 36); X.quadraticCurveTo(46, 30, 44, 18); X.quadraticCurveTo(31, 14, 18, 18); X.quadraticCurveTo(16, 30, 11, 36); X.closePath(); F(WHITE, 0.55);
      outline(); S(WHITE, BW(2.4), 0.9);
      const p = 0.55 + 0.2 * Math.sin(t * 2);
      X.beginPath(); X.moveTo(23, 26); X.quadraticCurveTo(31, 20, 39, 26); X.lineTo(41, 44); X.bezierCurveTo(41, 64, 40, 80, 39, 92); X.lineTo(37.5, 92); X.bezierCurveTo(37, 76, 35, 58, 31, 50); X.bezierCurveTo(27, 58, 25, 76, 24.5, 92); X.lineTo(23, 92); X.bezierCurveTo(22, 80, 21, 64, 21, 44); X.closePath(); X.fillStyle = tint('red', p); X.fill(); S('red', BW(1.4), 0.9);
    } },
    skin: { a: 1.2, c: SKIN, draw(t) {
      const top = (x) => 11 + Math.sin(x * 0.25) * 1.2;
      X.beginPath(); X.moveTo(0, 100); for (let x = 0; x <= 120; x += 4) X.lineTo(x, top(x)); X.lineTo(120, 100); X.closePath(); F('yellow', 0.12);
      X.beginPath(); X.moveTo(0, 66); for (let x = 0; x <= 120; x += 4) X.lineTo(x, top(x)); X.lineTo(120, 66); X.closePath(); F(PINK, 0.16);
      X.beginPath(); X.moveTo(0, 26); for (let x = 0; x <= 120; x += 4) X.lineTo(x, top(x)); X.lineTo(120, 26); X.closePath(); F(SKIN, 0.4);
      X.beginPath(); for (let x = 0; x <= 120; x += 4) { if (x) X.lineTo(x, top(x)); else X.moveTo(x, top(x)); } bodyS(SKIN, 2.4, 0.9);
      bL(0, 26, 120, 26, SKIN, 1.2, 0.5); bL(0, 66, 120, 66, 'yellow', 1.2, 0.4);
      for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) { C(4 + i * 14 + (j % 2) * 7, 74 + j * 9, 4.4); bodyS('yellow', 1, 0.4); }
      // blood vessels and capillary loops
      X.beginPath(); X.moveTo(0, 52); X.bezierCurveTo(30, 46, 60, 58, 120, 50); bodyS('red', 2.4, 0.7);
      X.beginPath(); X.moveTo(0, 57); X.bezierCurveTo(30, 52, 60, 63, 120, 55); bodyS('blue', 2.4, 0.7);
      for (const x of [58, 104]) { X.beginPath(); X.moveTo(x, 53); X.quadraticCurveTo(x - 2, 30, x + 2, 28); X.quadraticCurveTo(x + 6, 30, x + 4, 55); bodyS('red', 1.2, 0.6); }
      // hair in its follicle
      X.beginPath(); X.moveTo(26, 62); X.quadraticCurveTo(24, 40, 30, 12); bodyS(SKIN, 6, 0.35);
      E(26, 62, 3.6, 4.4); bodyFS('orange', 0.35, 1.4);
      X.beginPath(); X.moveTo(26, 60); X.quadraticCurveTo(25, 36, 31, 12); X.quadraticCurveTo(34, 4, 40, 0); bodyS('#9a5b3c', 2.4, 0.95);
      bL(28, 46, 38, 38, 'red', 1.6, 0.5);
      // sweat gland and its duct
      X.beginPath(); for (let i = 0; i <= 30; i++) { const a = i * 0.9; const x = 84 + Math.cos(a) * 5 + i * 0.12; const y = 76 + Math.sin(a) * 3; if (i) X.lineTo(x, y); else X.moveTo(x, y); } bodyS(SKY, 1.8, 0.8);
      X.beginPath(); X.moveTo(86, 72); X.bezierCurveTo(80, 52, 92, 36, 86, 12); bodyS(SKY, 1.6, 0.8);
      const p = mod(t * 0.5, 1); C(86, 12 - p * 7, 1.6 * (1 - p * 0.5)); X.save(); X.globalAlpha *= 1 - p; F(SKY, 0.9); X.restore();
      // a nerve ending
      X.beginPath(); X.moveTo(120, 62); X.bezierCurveTo(108, 60, 70, 44, 64, 34); bodyS('yellow', 1.6, 0.8); C(64, 33, 1.8); F('yellow', 0.8);
    } },
    cell: { a: 1.25, c: 'purple', draw(t) {
      const pts = []; for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; const r = 1 + 0.05 * Math.sin(a * 3 + t * 0.8) + 0.04 * Math.cos(a * 5 - t * 0.6); pts.push(62.5 + Math.cos(a) * 59 * r, 50 + Math.sin(a) * 46 * r); }
      smoothPoly(pts); bodyFS('cyan', 0.1, 2.8);
      for (let i = 0; i < 26; i++) { C(16 + rnd(i) * 94, 14 + rnd(i + 40) * 72, 0.9); F(GREY, 0.7); }
      X.beginPath(); for (let k = 0; k < 3; k++) { X.moveTo(76 + k * 4, 32); X.bezierCurveTo(86 + k * 4, 40, 74 + k * 4, 52, 84 + k * 4, 64); } bodyS('teal', 1.5, 0.6);
      for (let k = 0; k < 4; k++) { X.beginPath(); X.arc(96, 50 - 0 + k * 0, 6 + k * 2.6, PI * 0.65, PI * 1.35); bodyS('yellow', 1.8, 0.65); }
      E(52, 48, 17, 14); bodyFS('purple', 0.28, 2.4); E(52, 48, 15, 12); bodyS('purple', 1, 0.4); C(55, 45, 5); F('purple', 0.75);
      for (const [x, y, rx, ry, r] of [[92, 26, 9, 4.6, 0.4], [30, 76, 9, 4.6, -0.3], [100, 72, 8, 4.2, 0.8]]) { E(x, y, rx, ry, r); bodyFS('orange', 0.4, 1.6); X.save(); X.translate(x, y); X.rotate(r); P(-6, 0, -4, -2.5, -2, 2.5, 0, -2.5, 2, 2.5, 4, -2.5, 6, 0); S('orange', BW(1.1), 0.8); X.restore(); }
      C(26, 34, 5); bodyFS(SKY, 0.25, 1.2); C(76, 82, 3.2); bodyFS('red', 0.3, 1.2);
    } },
    'plant-cell': { a: 1.3, c: 'green', draw(t) {
      RR(3, 3, 124, 94, 10); bodyFS('green', 0.12, 4.5);
      RR(9, 9, 112, 82, 7); bodyS(LEAF, 1.4, 0.6);
      smoothPoly([42, 20, 80, 16, 104, 22, 108, 50, 104, 78, 74, 84, 44, 80, 38, 50]); bodyFS(SKY, 0.22, 1.8);
      E(25, 31, 11, 10); bodyFS('purple', 0.3, 2); C(27, 29, 3.6); F('purple', 0.75);
      const ch = [[18, 60, 0.3], [22, 80, -0.2], [56, 88, 0.1], [92, 88, -0.1], [114, 62, 1.4], [114, 28, 1.6], [64, 12, 0.05], [96, 12, -0.1]];
      for (const [x, y, r] of ch) { const w = Math.sin(t * 0.8 + x) * 0.6; E(x + w, y, 7, 3.6, r); bodyFS('green', 0.55, 1.4); X.save(); X.translate(x + w, y); X.rotate(r); for (const d of [-3, 0, 3]) bL(d, -1.8, d, 1.8, LEAF, 0.9, 0.8); X.restore(); }
      E(30, 50, 6, 3, 0.5); bodyFS('orange', 0.4, 1.2);
    } },
    neuron: { a: 2.2, c: 'yellow', draw(t) {
      const dend = [[22, 44, 10, 30], [10, 30, 2, 26], [10, 30, 8, 16], [20, 42, 16, 22], [16, 22, 12, 8], [16, 22, 24, 10], [22, 56, 8, 66], [8, 66, 2, 62], [8, 66, 4, 80], [24, 58, 18, 80], [18, 80, 10, 92], [18, 80, 26, 94], [34, 40, 40, 22], [40, 22, 36, 8], [40, 22, 50, 14], [34, 60, 42, 82], [42, 82, 38, 96], [42, 82, 52, 90]];
      for (const [a, b, c, d] of dend) { P(a, b, c, d); S('purple', BW(2.4), 0.75); }
      smoothPoly([30, 36, 38, 40, 42, 50, 38, 60, 30, 64, 22, 60, 18, 50, 22, 40]); bodyFS('purple', 0.3, 2.4);
      C(30, 50, 5); F('purple', 0.8);
      bL(42, 50, 182, 50, 'yellow', 2.2, 0.8);
      for (let i = 0; i < 6; i++) { RR(50 + i * 21.5, 45, 18, 10, 5); bodyFS('yellow', 0.3, 1.6); }
      const ends = [[182, 50, 198, 34], [198, 34, 210, 28], [198, 34, 206, 42], [182, 50, 204, 54], [182, 50, 196, 68], [196, 68, 208, 76], [196, 68, 206, 64]];
      for (const [a, b, c, d] of ends) { P(a, b, c, d); S('yellow', BW(2), 0.8); }
      for (const [x, y] of [[210, 28], [206, 42], [204, 54], [208, 76], [206, 64]]) { C(x, y, 2.6); bodyFS('orange', 0.6, 1.2); }
      const p = mod(t * 0.45, 1); const x = 42 + p * 140;
      glow(X, color('cyan'), 10); C(x, 50, 3.4); F('cyan', 0.95); X.shadowBlur = 0;
    } },
    quadruped: { a: 1.55, c: BROWN, draw(t) {
      const sw = Math.sin(t * 3) * 3;
      X.beginPath(); X.moveTo(26, 38); X.quadraticCurveTo(10, 40 + sw, 4, 22 + sw); bodyS(BROWN, 5, 0.7);
      bL(104, 60, 100, 96, BROWN, 6, 0.4); bL(46, 60, 50, 96, BROWN, 6, 0.4);
      smoothPoly([24, 34, 60, 29, 96, 30, 112, 26, 120, 13, 128, 7, 136, 7, 146, 14, 153, 22, 151, 29, 139, 31, 128, 36, 118, 46, 115, 58, 117, 66, 119, 92, 123, 98, 111, 98, 108, 70, 100, 60, 70, 62, 44, 60, 38, 66, 41, 92, 45, 98, 33, 98, 30, 72, 24, 58, 22, 44]); bodyFS(BROWN, 0.25);
      PC(129, 9, 132, 0.5, 138, 9); bodyFS(BROWN, 0.5, 1.6);
      C(141, 15, 1.8); SOL(DARK); C(151.5, 22.5, 1.3); SOL(DARK);
      X.beginPath(); X.moveTo(146, 28); X.quadraticCurveTo(142, 30, 138, 28); bodyS(DARK, 1.2, 0.6);
    } },
    bird: { a: 1.15, c: 'cyan', draw(t) {
      X.beginPath(); X.moveTo(14, 86); X.lineTo(112, 84); bodyS(BROWN, 4, 0.8);
      bL(56, 72, 54, 85, 'orange', 2.2, 0.9); bL(64, 72, 64, 85, 'orange', 2.2, 0.9);
      for (const x of [54, 64]) { P(x - 4, 87, x, 85, x + 4, 87); S('orange', BW(1.6), 0.9); }
      X.beginPath(); X.moveTo(36, 60); X.lineTo(6, 84); X.lineTo(12, 88); X.lineTo(42, 68); X.closePath(); bodyFS('blue', 0.35, 2);
      smoothPoly([40, 56, 46, 38, 62, 30, 76, 34, 86, 46, 84, 62, 72, 74, 56, 76, 44, 70]); bodyFS('cyan', 0.25);
      C(81, 26, 13); bodyFS('cyan', 0.25);
      PC(93, 22, 109, 28, 93, 32); bodyFS('orange', 0.7, 1.6);
      const bl = mod(t, 3.8) < 0.12; if (bl) bL(83, 22, 89, 22, DARK, 1.6, 1); else { C(86, 22, 2.6); SOL(DARK); C(85.3, 21.2, 0.8); SOL(WHITE); }
      const f = Math.sin(t * 2) * 1;
      X.beginPath(); X.moveTo(48, 44); X.bezierCurveTo(60, 40 + f, 76, 46, 74, 56); X.bezierCurveTo(66, 66, 50, 68, 34, 66); X.closePath(); bodyFS('blue', 0.35, 1.8);
      for (let i = 0; i < 3; i++) { Q(46 + i * 8, 50 + i * 2, 50 + i * 8, 58, 44 + i * 8, 64); bodyS(WHITE, 1, 0.35); }
      E(70, 58, 9, 10); F(WHITE, 0.12);
    } },
    fish: { a: 2.1, c: 'orange', draw(t) {
      const w = Math.sin(t * 4) * 5;
      X.beginPath(); X.moveTo(46, 50); X.lineTo(8, 16 + w); X.quadraticCurveTo(20, 50 + w * 0.5, 8, 84 + w); X.closePath(); bodyFS('orange', 0.35);
      for (let i = 1; i < 5; i++) bL(44, 50, 12 + i * 1.2, 16 + w + i * 16.5 - (i > 2 ? 0 : 0), 'orange', 1, 0.4);
      X.beginPath(); X.moveTo(88, 24); X.bezierCurveTo(94, 6, 112, 0, 128, 3); X.bezierCurveTo(136, 8, 140, 14, 140, 20); X.closePath(); bodyFS('orange', 0.4, 2);
      X.beginPath(); X.moveTo(72, 70); X.lineTo(62, 88); X.lineTo(88, 75); X.closePath(); bodyFS('orange', 0.4, 1.8);
      X.beginPath(); X.moveTo(110, 77); X.lineTo(100, 94); X.lineTo(120, 80); X.closePath(); bodyFS('orange', 0.4, 1.8);
      const body = () => { X.beginPath(); X.moveTo(199, 52); X.bezierCurveTo(182, 22, 120, 14, 72, 30); X.bezierCurveTo(56, 36, 46, 44, 40, 50); X.bezierCurveTo(46, 56, 56, 65, 72, 70); X.bezierCurveTo(120, 86, 182, 82, 199, 52); X.closePath(); };
      body(); F('orange', 0.24);
      X.save(); body(); X.clip();
      X.strokeStyle = tint('yellow', 0.35); X.lineWidth = BW(1);
      for (let c = 0; c < 9; c++) for (let r = 0; r < 7; r++) { const x = 64 + c * 9 + (r % 2) * 4.5; const y = 26 + r * 8; X.beginPath(); X.arc(x, y, 4.6, -PI * 0.5, PI * 0.5); X.stroke(); }
      X.fillStyle = tint(WHITE, 0.12); X.beginPath(); X.ellipse(130, 66, 60, 10, -0.05, 0, TAU); X.fill();
      X.restore();
      body(); S('orange', BW(2.6), 0.95);
      Q(156, 30, 146, 52, 156, 73); bodyS('red', 2.2, 0.8); Q(150, 34, 141, 52, 150, 69); bodyS('red', 1.2, 0.5);
      X.save(); X.translate(140, 62); X.rotate(0.5 + Math.sin(t * 3) * 0.15); X.beginPath(); X.moveTo(0, 0); X.quadraticCurveTo(-8, 14, -20, 16); X.quadraticCurveTo(-12, 6, -6, -2); X.closePath(); bodyFS('yellow', 0.45, 1.6); X.restore();
      C(176, 42, 5.5); bodyFS(WHITE, 0.6, 1.4); C(177, 42, 2.8); SOL(DARK); C(175.8, 40.8, 0.9); SOL(WHITE);
      Q(199, 52, 194, 57, 188, 56); bodyS(DARK, 1.6, 0.7);
      for (let i = 0; i < 3; i++) { const p = mod(t * 0.5 + i / 3, 1); C(202 + p * 4 + Math.sin(p * 9) * 1.5, 46 - p * 40, 1.4 + p * 2); X.save(); X.globalAlpha *= 1 - p; bodyS(SKY, 1.2, 0.8); X.restore(); }
    } },
    insect: { a: 0.95, c: 'yellow', draw(t) {
      const cx = 47.5; const f = Math.sin(t * 2.2) * 0.08;
      for (const s of [-1, 1]) {
        const x = (v) => cx + s * v;
        for (const pts of [[6, 29, 18, 21, 24, 9], [7, 33, 23, 38, 34, 46], [6, 38, 20, 54, 28, 74]]) { P(x(pts[0]), pts[1], x(pts[2]), pts[3], x(pts[4]), pts[5]); S('yellow', BW(2.2), 0.85); }
        X.beginPath(); X.moveTo(x(3), 11); X.quadraticCurveTo(x(8), 2, x(16), 1); bodyS('yellow', 1.6, 0.85);
        X.save(); X.translate(x(5), 34); X.rotate(s * (0.42 + f)); E(s * 7, 16, 8, 21); bodyFS(SKY, 0.15, 1.4); bL(s * 3, 2, s * 8, 32, SKY, 0.8, 0.5); X.restore();
      }
      E(cx, 64, 12, 23); bodyFS('yellow', 0.3);
      for (let i = 0; i < 4; i++) { const y = 52 + i * 8; const hw = Math.sqrt(Math.max(0, 1 - ((y - 64) / 23) ** 2)) * 12; bL(cx - hw, y, cx + hw, y, 'orange', 1.6, 0.6); }
      E(cx, 33, 8.5, 9.5); bodyFS('yellow', 0.35);
      C(cx, 15, 7); bodyFS('yellow', 0.35);
      E(cx - 5.5, 13, 2.6, 3.4); F(DARK, 0.85); E(cx + 5.5, 13, 2.6, 3.4); F(DARK, 0.85);
    } },
    spider: { a: 1.15, c: 'purple', draw(t) {
      const cx = 57.5;
      for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
        const w = Math.sin(t * 3 + i * 1.3 + s) * 1.2;
        const ax = cx + s * 9; const ay = 33 + i * 3.2;
        const kx = cx + s * (27 + i * 3); const ky = [14, 26, 42, 54][i] - 8 + w;
        const fx = cx + s * (50 - i * 2); const fy = [6, 28, 66, 92][i] + w;
        P(ax, ay, kx, ky, fx, fy); S('purple', BW(2.4), 0.85); C(kx, ky, 1.3); F('purple', 0.9);
      }
      E(cx, 70, 17, 22); bodyFS('purple', 0.3);
      for (let i = 0; i < 3; i++) { C(cx - 6, 62 + i * 8, 1.8); F('red', 0.6); C(cx + 6, 62 + i * 8, 1.8); F('red', 0.6); }
      E(cx, 38, 12, 13); bodyFS('purple', 0.35);
      for (const s of [-1, 1]) { P(cx + s * 4, 26, cx + s * 9, 20, cx + s * 12, 14); S('purple', BW(2), 0.8); P(cx + s * 2.5, 27, cx + s * 3, 22); S('purple', BW(2.4), 0.9); }
      for (const [dx, dy, r] of [[-2.2, 31, 1.5], [2.2, 31, 1.5], [-5.5, 32.5, 1.1], [5.5, 32.5, 1.1]]) { C(cx + dx, dy, r); SOL(WHITE); }
    } },
    reptile: { a: 2.1, c: 'green', draw(t) {
      const w = Math.sin(t * 2) * 3;
      bL(156, 58, 146, 80, 'green', 5, 0.4); bL(112, 58, 122, 80, 'green', 5, 0.4);
      X.beginPath(); X.moveTo(208, 46); X.quadraticCurveTo(204, 32, 190, 30); X.quadraticCurveTo(178, 30, 168, 36); X.quadraticCurveTo(136, 26, 100, 32); X.quadraticCurveTo(66, 38, 40, 52 + w); X.quadraticCurveTo(18, 62 + w, 2, 68 + w * 1.5); X.quadraticCurveTo(22, 70 + w, 44, 62 + w * 0.5); X.quadraticCurveTo(72, 58, 100, 61); X.quadraticCurveTo(136, 64, 168, 60); X.quadraticCurveTo(186, 60, 198, 56); X.quadraticCurveTo(208, 53, 208, 46); X.closePath(); bodyFS('green', 0.28);
      for (const [x0, y0, x1, y1, x2, y2] of [[162, 59, 176, 80, 186, 92], [106, 60, 92, 80, 82, 92]]) { P(x0, y0, x1, y1, x2, y2); S('green', BW(6), 0.85); for (const d of [-5, 0, 5]) bL(x2, y2, x2 + d, y2 + 6, 'green', 1.8, 0.85); }
      for (let i = 0; i < 12; i++) { C(66 + i * 9, 39 - Math.sin(i * 0.35) * 4, 1.6); F('yellow', 0.6); }
      for (let i = 0; i < 8; i++) { C(90 + i * 9, 50, 1.1); F('yellow', 0.35); }
      C(192, 38, 2.6); SOL(DARK); C(191.3, 37.3, 0.8); SOL(WHITE);
      X.beginPath(); X.moveTo(208, 47); X.quadraticCurveTo(200, 50, 186, 48); bodyS(DARK, 1.2, 0.6);
      if (mod(t, 2.4) < 0.3) { P(208, 47, 218, 47, 222, 44); S('red', BW(1.6), 0.9); }
    } },
    frog: { a: 1.2, c: 'green', draw(t) {
      const b = Math.sin(t * 3) * 0.8;
      smoothPoly([110, 54, 102, 38, 90, 28, 72, 30, 50, 38, 30, 50, 20, 66, 26, 80, 44, 87, 70, 87, 94, 80, 106, 68]); bodyFS('green', 0.28);
      E(98, 66, 9, 7 + b); F('yellow', 0.2);
      E(42, 70, 21, 13, -0.45); bodyFS('green', 0.34, 2.2);
      X.beginPath(); X.moveTo(26, 80); X.quadraticCurveTo(36, 92, 54, 93); bodyS('green', 5, 0.85);
      X.beginPath(); X.moveTo(54, 93); X.lineTo(80, 96); bodyS('green', 3.4, 0.85);
      for (const d of [-4, 0, 4]) bL(80, 96, 88, 96 + d * 0.8, 'green', 1.6, 0.85);
      X.beginPath(); X.moveTo(90, 78); X.lineTo(94, 95); bodyS('green', 4.5, 0.85); for (const d of [-3, 0, 3]) bL(94, 95, 98 + d, 98.5, 'green', 1.4, 0.85);
      C(86, 26, 9.5); bodyFS('green', 0.42); E(87, 26, 5, 3.2); SOL(DARK); C(85.5, 24.5, 1.2); SOL(WHITE);
      C(70, 42, 6); bodyFS('orange', 0.28, 1.4);
      X.beginPath(); X.moveTo(110, 55); X.quadraticCurveTo(96, 58, 82, 51); bodyS(DARK, 1.4, 0.6);
      C(108, 46, 1.2); SOL(DARK);
      for (const [x, y, r] of [[52, 46, 3.2], [40, 58, 2.4], [62, 38, 2.2], [58, 56, 2]]) { C(x, y, r); F('teal', 0.6); }
    } },
    whale: { a: 2.4, c: 'blue', draw(t) {
      const w = Math.sin(t * 1.5) * 4;
      X.beginPath(); X.moveTo(30, 50); X.lineTo(4, 30 + w); X.quadraticCurveTo(10, 46, 14, 52); X.quadraticCurveTo(10, 58, 4, 74 + w); X.lineTo(30, 55); X.closePath(); bodyFS('blue', 0.35);
      X.beginPath(); X.moveTo(237, 54); X.bezierCurveTo(232, 24, 186, 15, 140, 19); X.quadraticCurveTo(92, 24, 52, 40); X.quadraticCurveTo(36, 46, 26, 51); X.quadraticCurveTo(40, 58, 62, 63); X.quadraticCurveTo(130, 78, 200, 78); X.quadraticCurveTo(232, 74, 237, 54); X.closePath(); bodyFS('blue', 0.25);
      PC(98, 25, 110, 12, 116, 22); bodyFS('blue', 0.4, 1.6);
      X.save(); X.translate(176, 70); X.rotate(0.6 + Math.sin(t * 1.5) * 0.1); E(-8, 10, 6, 16, 0.3); bodyFS('blue', 0.4, 1.6); X.restore();
      for (let i = 0; i < 5; i++) { X.beginPath(); X.moveTo(232 - i * 2, 64 + i * 2.4); X.quadraticCurveTo(200, 70 + i * 2, 160, 70 + i * 1.5); bodyS(SKY, 1, 0.45); }
      X.beginPath(); X.moveTo(237, 56); X.quadraticCurveTo(220, 62, 198, 60); bodyS(DARK, 1.6, 0.6);
      C(200, 52, 2.4); SOL(DARK);
      E(188, 19.5, 2.6, 1.2); F(DARK, 0.8);
      for (let i = 0; i < 6; i++) { const p = mod(t * 0.7 + i / 6, 1); const a = -PI / 2 + (i - 2.5) * 0.22; C(188 + Math.cos(a) * p * 14, 18 + Math.sin(a) * p * 16, 1.4); X.save(); X.globalAlpha *= 1 - p; F(SKY, 0.9); X.restore(); }
    } },
    plant: { a: 0.7, c: 'green', draw(t) {
      X.fillStyle = tint(BROWN, 0.22); X.fillRect(0, 68, 70, 32); bL(0, 68, 70, 68, BROWN, 2, 0.8);
      for (const [a, b, c, d] of [[35, 68, 22, 84], [22, 84, 12, 96], [22, 84, 26, 98], [35, 68, 48, 82], [48, 82, 58, 94], [48, 82, 44, 97], [35, 68, 35, 92]]) { P(a, b, c, d); S('#e8d5b5', BW(2.2), 0.8); }
      const sw = Math.sin(t * 1.2) * 0.04;
      X.save(); X.translate(35, 68); X.rotate(sw); X.translate(-35, -68);
      X.beginPath(); X.moveTo(35, 68); X.bezierCurveTo(33, 50, 37, 30, 35, 14); bodyS('green', 3.4, 0.9);
      for (const [x0, y0, x1, y1, wd] of [[35, 52, 12, 42, 8], [35, 44, 58, 32, 8], [35, 32, 16, 22, 6]]) { leafPath(x0, y0, x1, y1, wd); bodyFS('green', 0.4, 1.6); bL(x0, y0, x1, y1, LEAF, 1, 0.6); }
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; E(35 + Math.cos(a) * 6.5, 10 + Math.sin(a) * 6.5, 5, 3.4, a); bodyFS(PINK, 0.5, 1.2); }
      C(35, 10, 3.6); bodyFS('yellow', 0.9, 1);
      X.restore();
    } },
    flower: { a: 0.8, c: PINK, draw(t) {
      const sw = Math.sin(t * 1.3) * 0.5;
      X.beginPath(); X.moveTo(40, 100); X.quadraticCurveTo(41, 80, 40, 62); bodyS('green', 3.4, 0.9);
      leafPath(40, 86, 14, 76, 6); bodyFS('green', 0.4, 1.6);
      X.beginPath(); X.moveTo(36, 46); X.bezierCurveTo(30, 20, 40, 8, 40, 8); X.bezierCurveTo(40, 8, 50, 20, 44, 46); X.closePath(); bodyFS(PINK, 0.2, 1.4);
      for (const s of [-1, 1]) { X.beginPath(); X.moveTo(40 + s * 4, 58); X.bezierCurveTo(40 + s * 20, 58, 40 + s * (36 + sw), 40, 40 + s * (34 + sw), 18); X.bezierCurveTo(40 + s * 26, 28, 40 + s * 14, 40, 40 + s * 6, 50); X.closePath(); bodyFS(PINK, 0.42); }
      for (const s of [-1, 1]) { X.beginPath(); X.moveTo(40 + s * 3, 62); X.quadraticCurveTo(40 + s * 14, 60, 40 + s * 20, 68); X.quadraticCurveTo(40 + s * 10, 66, 40 + s * 2, 64); X.closePath(); bodyFS('green', 0.55, 1.4); }
      E(40, 60, 8, 3.6); bodyFS('green', 0.4, 1.4);
      for (const [x1, y1] of [[22, 24], [30, 30], [50, 30], [58, 24]]) { X.beginPath(); X.moveTo(40 + (x1 - 40) * 0.12, 56); X.quadraticCurveTo(40 + (x1 - 40) * 0.5, 44, x1, y1); bodyS('yellow', 1.4, 0.9); E(x1, y1 - 1.6, 2.4, 3.4, (x1 - 40) * 0.02); bodyFS('orange', 0.8, 1); }
      E(40, 50, 6, 7); bodyFS('teal', 0.4, 1.6); for (const [dx, dy] of [[-2, 49], [2, 49], [0, 53]]) { C(40 + dx, dy, 1.3); F(WHITE, 0.8); }
      bL(40, 43, 40, 22, 'teal', 2.2, 0.9); E(40, 20, 5, 2.6); bodyFS('teal', 0.6, 1.4);
    } },
    leaf: { a: 0.75, c: 'green', draw(t) {
      X.save(); X.translate(37.5, 100); X.rotate(Math.sin(t * 1.1) * 0.03); X.translate(-37.5, -100);
      const outline = () => { X.beginPath(); X.moveTo(37.5, 2); X.bezierCurveTo(70, 20, 72, 62, 37.5, 84); X.bezierCurveTo(3, 62, 5, 20, 37.5, 2); X.closePath(); };
      outline(); bodyFS('green', 0.3);
      bL(37.5, 84, 37.5, 100, 'green', 3.4, 0.9); bL(37.5, 5, 37.5, 84, LEAF, 2, 0.85);
      for (let i = 0; i < 6; i++) { const y = 16 + i * 10.5; const hw = 25 - Math.abs(i - 2.4) * 4.4; for (const s of [-1, 1]) { X.beginPath(); X.moveTo(37.5, y + 8); X.quadraticCurveTo(37.5 + s * hw * 0.5, y + 4, 37.5 + s * hw, y); bodyS(LEAF, 1.2, 0.6); } }
      X.restore();
    } },
    tree: { a: 0.85, c: 'green', draw(t) {
      X.fillStyle = tint(BROWN, 0.14); X.fillRect(0, 78, 85, 22); bL(0, 78, 85, 78, BROWN, 2, 0.7);
      for (const [a, b, c, d] of [[40, 78, 18, 90], [18, 90, 8, 96], [44, 78, 66, 92], [66, 92, 78, 96], [42, 78, 42, 99], [42, 78, 28, 96], [44, 78, 56, 98]]) { P(a, b, c, d); S(BROWN, BW(2.4), 0.7); }
      X.beginPath(); X.moveTo(33, 79); X.quadraticCurveTo(38, 70, 38, 40); X.lineTo(47, 40); X.quadraticCurveTo(47, 70, 52, 79); X.closePath(); bodyFS(BROWN, 0.5, 2);
      for (let i = 0; i < 4; i++) bL(40 + i * 2, 50 + i * 6, 41 + i * 2, 56 + i * 6, BROWN, 1, 0.6);
      const sw = Math.sin(t * 1) * 0.6;
      X.save(); X.translate(sw, 0);
      for (const [a, b, c, d] of [[42, 46, 24, 30], [44, 44, 62, 28], [42, 40, 40, 18]]) { P(a, b, c, d); S(BROWN, BW(2.6), 0.8); }
      const blobs = [[42, 26, 20], [23, 34, 14], [62, 32, 15], [31, 16, 13], [54, 14, 13]];
      X.beginPath(); for (const [x, y, r] of blobs) { X.moveTo(x + r, y); X.arc(x, y, r, 0, TAU); } F('green', 0.32);
      for (const [x, y, r] of blobs) { C(x, y, r); bodyS('green', 2, 0.55); }
      for (let i = 0; i < 4; i++) { C(22 + rnd(i) * 40, 14 + rnd(i + 3) * 24, 2); F('red', 0.6); }
      X.restore();
    } },
  };
  const BODY_ALIAS = { body: 'human', person: 'human', man: 'human', woman: 'human', head: 'human-head', face: 'human-head', brain: 'human-head', bones: 'skeleton', lung: 'lungs', 'animal-cell': 'cell', plantcell: 'plant-cell', 'plant cell': 'plant-cell', nerve: 'neuron', neurone: 'neuron', dog: 'quadruped', cat: 'quadruped', horse: 'quadruped', cow: 'quadruped', mammal: 'quadruped', animal: 'quadruped', bee: 'insect', ant: 'insect', butterfly: 'insect', beetle: 'insect', lizard: 'reptile', snake: 'reptile', crocodile: 'reptile', toad: 'frog', dolphin: 'whale', shark: 'fish', teeth: 'tooth' };
  const GENERIC_BODY = { a: 0.9, c: 'muted', draw(t) {
    const pts = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; const r = 1 + 0.06 * Math.sin(a * 3 + t * 0.6); pts.push(45 + Math.cos(a) * 42 * r, 50 + Math.sin(a) * 46 * r); }
    smoothPoly(pts); X.save(); X.setLineDash([BW(8), BW(6)]); bodyFS('muted', 0.12, 2.4); X.restore();
  } };
  const SIDE_VIEW = new Set([BODY_ART.quadruped, BODY_ART.bird, BODY_ART.fish, BODY_ART.reptile, BODY_ART.frog, BODY_ART.whale]);
  function bodyOf(name) {
    const k = typeof name === 'string' ? name.trim().toLowerCase() : '';
    return BODY_ART[k] || BODY_ART[BODY_ALIAS[k]] || GENERIC_BODY;
  }
  // Draws a body into the box (x, y, w, h) (w / h should be its aspect).
  function drawBody(ctx, body, x, y, w, h, t) {
    const prev = X; X = ctx;
    const k = h / 100;
    U = 1 / k;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    try { body.draw(t); } catch { /* a broken drawing leaves the rest */ }
    ctx.restore(); X = prev; void w;
  }

  // ─── Shared item reading ──────────────────────────────────────────────
  // Stage-like items: {label, icon, note, ask, color}, from objects or strings.
  function stagesOf(v, max, word = 'Step') {
    return arr(v, max).map((s, i) => {
      const o = obj(s);
      return { label: str(o.label ?? o.title ?? o.name, `${word} ${i + 1}`), icon: str(o.icon), note: str(o.note ?? o.text), ask: o.ask, c: hueOf(o.color, i) };
    });
  }
  function nothing(ctx, msg = 'Nothing to show yet') { text(ctx, msg, MX, 330, 600, { size: 22, fill: 'muted', weight: 500 }); }

  // ─── Faces for feelings ───────────────────────────────────────────────
  // A simple, friendly face for each mood of the spec, drawn in a 64 × 64
  // box like the icons (so the same small tools draw it). It blinks now and
  // then; the face never moves fast.
  const MOOD_HUE = { happy: 'yellow', calm: 'green', sad: 'blue', worried: 'purple', angry: 'red', proud: 'orange', surprised: 'cyan', scared: 'purple', tired: 'blue', excited: 'orange', confused: 'teal', frustrated: 'red' };
  const MOOD_WORD = { happy: 'Happy', calm: 'Calm', sad: 'Sad', worried: 'Worried', angry: 'Angry', proud: 'Proud', surprised: 'Surprised', scared: 'Scared', tired: 'Tired', excited: 'Excited', confused: 'Confused', frustrated: 'Frustrated' };
  const MOOD_ALIAS = { glad: 'happy', joy: 'happy', joyful: 'happy', cheerful: 'happy', relaxed: 'calm', okay: 'calm', ok: 'calm', fine: 'calm', peaceful: 'calm', upset: 'sad', unhappy: 'sad', lonely: 'sad', nervous: 'worried', anxious: 'worried', mad: 'angry', cross: 'angry', furious: 'angry', shocked: 'surprised', afraid: 'scared', frightened: 'scared', sleepy: 'tired', bored: 'tired', thrilled: 'excited', puzzled: 'confused', annoyed: 'frustrated', grumpy: 'frustrated' };
  const moodOf = (v, d = null) => { const k = typeof v === 'string' ? v.trim().toLowerCase() : ''; return MOODS.includes(k) ? k : MOOD_ALIAS[k] || d; };
  function face(ctx, mood, x, y, s, t = 0, { skin = 'yellow', ink = DARK, glowC = null } = {}) {
    if (!(s > 1)) return;
    const m = moodOf(mood, 'calm');
    const prev = X; X = ctx;
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 64, s / 64);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    try {
      if (glowC) glow(ctx, color(glowC), 16);
      C(0, 0, 28); X.fillStyle = color(skin); X.fill(); X.shadowBlur = 0;
      X.fillStyle = 'rgba(255,255,255,0.18)'; E(-9, -13, 11, 7, -0.4); X.fill();
      C(0, 0, 28); S(ink, 2.2, 0.35);
      const blink = mod(t + rnd(s) * 3, 4.2) < 0.13;
      const dotEyes = (r = 3.6, dy = -5) => { for (const sx of [-10, 10]) { if (blink) L(sx - 4, dy, sx + 4, dy, ink, 2.6); else { C(sx, dy, r); SOL(ink); C(sx + r * 0.35, dy - r * 0.4, r * 0.32); SOL(WHITE); } } };
      const brows = (inner, outer, y0 = -14) => { for (const sx of [-1, 1]) L(sx * 5, y0 + inner, sx * 15, y0 + outer, ink, 2.8); };
      const cheeks = (a = 0.35) => { for (const sx of [-1, 1]) { E(sx * 17, 6, 5, 3.4); X.fillStyle = tint(PINK, a); X.fill(); } };
      const arcEyes = (up) => { for (const sx of [-10, 10]) { X.beginPath(); if (up) X.arc(sx, -3, 5, PI * 1.15, PI * 1.85); else X.arc(sx, -7, 5, PI * 0.15, PI * 0.85); S(ink, 2.8); } };
      switch (m) {
        case 'happy': dotEyes(); cheeks(); X.beginPath(); X.arc(0, 4, 13, 0.15 * PI, 0.85 * PI); S(ink, 3.2); break;
        case 'calm': arcEyes(false); cheeks(0.22); X.beginPath(); X.arc(0, 6, 8, 0.25 * PI, 0.75 * PI); S(ink, 2.8); break;
        case 'sad': dotEyes(3.2, -4); brows(-4, 1, -12); X.beginPath(); X.arc(0, 20, 9, 1.2 * PI, 1.8 * PI); S(ink, 3); { const d = mod(t * 0.5, 1); X.save(); X.globalAlpha *= 1 - d * 0.6; dropPath(-13, 4 + d * 10, 0.4); F(SKY, 0.9); X.restore(); } break;
        case 'worried': dotEyes(3.4, -4); brows(-5, 0, -13); X.beginPath(); X.moveTo(-9, 13); X.bezierCurveTo(-5, 9, -2, 15, 1, 12); X.bezierCurveTo(4, 9, 6, 14, 9, 11); S(ink, 2.8); break;
        case 'angry': dotEyes(3.2, -3); brows(4, -3, -12); X.beginPath(); X.arc(0, 19, 9, 1.25 * PI, 1.75 * PI); S(ink, 3.2); break;
        case 'proud': arcEyes(true); cheeks(0.4); X.beginPath(); X.arc(0, 5, 12, 0.12 * PI, 0.88 * PI); X.closePath(); X.fillStyle = tint('red', 0.55); X.fill(); S(ink, 2.8); { const k = 0.8 + 0.2 * Math.sin(t * 2.5); star5(33, -26, 6 * k, 2.6 * k); SOL('yellow'); } break;
        case 'surprised': for (const sx of [-10, 10]) { C(sx, -5, 6.5); SOL(WHITE); S(ink, 2); C(sx, -4, 3); SOL(ink); } brows(-3, -2, -17); E(0, 13, 5, 7); SOL(ink); break;
        case 'scared': for (const sx of [-10, 10]) { C(sx, -5, 6); SOL(WHITE); S(ink, 2); C(sx, -5, 2.4); SOL(ink); } brows(-5, 0, -16); P(-10, 14, -6, 10, -2, 14, 2, 10, 6, 14, 10, 10); S(ink, 2.6); { X.save(); X.globalAlpha *= 0.6 + 0.4 * Math.sin(t * 2); dropPath(22, -12, 0.45); F(SKY, 0.9); X.restore(); } break;
        case 'tired': for (const sx of [-10, 10]) { X.beginPath(); X.arc(sx, -6, 5, 0, PI); X.closePath(); SOL(ink); L(sx - 6, -6, sx + 6, -6, ink, 2.6); } L(-6, 12, 6, 12, ink, 2.8); { const p = mod(t * 0.4, 1); X.save(); X.globalAlpha *= Math.sin(p * PI); label(X, 'z', 30 + p * 6, -22 - p * 12, { size: 13 + p * 6, weight: 800, fill: WHITE }); X.restore(); } break;
        case 'excited': for (const sx of [-10, 10]) { const k = 0.9 + 0.15 * Math.sin(t * 4); star5(sx, -6, 6.5 * k, 3 * k); SOL(ink); } cheeks(0.45); X.beginPath(); X.moveTo(-13, 5); X.lineTo(13, 5); X.arc(0, 5, 13, 0, PI); X.closePath(); X.fillStyle = color(ink); X.fill(); E(0, 13, 6, 3.2); F('red', 0.8); break;
        case 'confused': dotEyes(3.4, -4); L(-15, -12, -5, -12, ink, 2.8); L(5, -16, 15, -13, ink, 2.8); X.beginPath(); X.moveTo(-9, 13); X.quadraticCurveTo(-3, 8, 1, 12); X.quadraticCurveTo(5, 16, 10, 10); S(ink, 2.8); { const b = Math.sin(t * 2) * 2; label(X, '?', 35, -26 + b, { size: 22, weight: 800, fill: WHITE }); } break;
        case 'frustrated': dotEyes(3, -3); brows(5, -1, -12); RR(-10, 8, 20, 9, 3); SOL(WHITE); S(ink, 2.4); L(-10, 12.5, 10, 12.5, ink, 1.6); for (const xx of [-4, 1, 6]) L(xx - 1, 8, xx - 1, 17, ink, 1.4); { const p = mod(t * 0.6, 1); X.save(); X.globalAlpha *= 1 - p; for (const sx of [-1, 1]) { C(sx * (33 + p * 4), -20 - p * 8, 3 + p * 3); S(WHITE, 2); } X.restore(); } break;
        default:
      }
    } catch { /* a face that fails leaves the head */ }
    ctx.restore(); X = prev;
  }
  // The child of a social story: the same figure in every panel, its face
  // and arms showing the mood. (x, y) is the feet; h the height.
  function child(ctx, x, y, h, mood, t = 0, shirt = 'blue') {
    if (!(h > 4)) return;
    const m = moodOf(mood, 'calm');
    const k = h / 100; const bob = Math.sin(t * 1.6) * 1.2 * k;
    ctx.save(); ctx.translate(x, y - bob); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const lw = Math.max(2, 7 * k);
    // legs
    ctx.strokeStyle = color('#3b4a7a'); ctx.lineWidth = lw * 1.3;
    ctx.beginPath(); ctx.moveTo(-8 * k, -36 * k); ctx.lineTo(-10 * k, -3 * k); ctx.moveTo(8 * k, -36 * k); ctx.lineTo(10 * k, -3 * k); ctx.stroke();
    ctx.fillStyle = color(WHITE); for (const s of [-1, 1]) { ell(ctx, s * 12 * k, -2 * k, 8 * k, 4 * k); ctx.fill(); }
    // arms by mood (angles from the shoulder, down = 0)
    const sw = Math.sin(t * 3) * 0.15;
    const A = { happy: [0.5, 0.5], excited: [2.5 + sw, 2.5 - sw], proud: [2.2, 0.9], surprised: [1.9, 1.9], scared: [2.6, 2.6], sad: [0.12, 0.12], tired: [0.08, 0.08], angry: [0.7, 0.7], frustrated: [0.7, 0.7], worried: [1.2, 1.2], confused: [0.3, 2.4], calm: [0.3, 0.3] }[m] || [0.3, 0.3];
    ctx.strokeStyle = color(SKIN); ctx.lineWidth = lw;
    for (const [i, s] of [[0, -1], [1, 1]]) {
      const a = A[i]; const sx = s * 14 * k; const sy = -64 * k; const len = 26 * k;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + s * Math.sin(a) * len, sy + Math.cos(a) * len); ctx.stroke();
      ctx.fillStyle = color(SKIN); ctx.beginPath(); ctx.arc(sx + s * Math.sin(a) * len, sy + Math.cos(a) * len, lw * 0.75, 0, TAU); ctx.fill();
    }
    // body: a T-shirt
    ctx.fillStyle = color(shirt); ctx.strokeStyle = tint(WHITE, 0.4); ctx.lineWidth = 1.5;
    rounded(ctx, -16 * k, -68 * k, 32 * k, 36 * k, 9 * k); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.16)'; rounded(ctx, -12 * k, -64 * k, 9 * k, 26 * k, 4 * k); ctx.fill();
    // head: hair behind, then the face, then a fringe
    ctx.fillStyle = color('#5b3a29'); ell(ctx, 0, -85 * k, 22.5 * k, 21.5 * k); ctx.fill();
    face(ctx, m, 0, -82 * k, 46 * k, t, { skin: SKIN });
    ctx.fillStyle = color('#5b3a29'); ctx.beginPath();
    ctx.ellipse(0, -98 * k, 19 * k, 7 * k, 0, PI, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-19 * k, -98 * k); ctx.quadraticCurveTo(-4 * k, -91 * k, 6 * k, -97 * k); ctx.quadraticCurveTo(12 * k, -92 * k, 19 * k, -98 * k); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ─── x-chain: a process in order ──────────────────────────────────────
  function layChain(ctx, it, top) {
    const st = stagesOf(it.stages, 7);
    const n = st.length;
    const loop = it.loop === true || it.loop === 'true';
    const two = n >= 5;
    const k = two ? Math.ceil(n / 2) : n;
    const r = two ? 48 : n <= 3 ? 58 : 52;
    const hasNotes = st.some((s) => s.note);
    const bottom = hasNotes ? 560 : 610;
    const span = bottom - top;
    const colW = 720 / Math.max(1, k);
    const rowY = two ? [top + span * 0.26, top + span * 0.72] : [top + span * (loop ? 0.56 : 0.46)];
    st.forEach((s, i) => {
      if (!two || i < k) { s.x = 40 + (i + 0.5) * colW; s.y = rowY[0]; s.row = 0; } else {
        const m = n - k; const j = i - k; // right to left, centred under the top row
        const x0 = MX + ((m - 1) / 2) * colW;
        s.x = x0 - j * colW; s.y = rowY[1]; s.row = 1;
      }
      s.r = r; s.lw = Math.min(colW - 14, 210);
      s.fit = measure(ctx, s.label, s.lw, 21, 700, 2, 18);
    });
    // The arrows between stages, as paths.
    const segs = [];
    const link = (a, b) => {
      if (a.row === b.row) {
        const d = Math.sign(b.x - a.x) || 1;
        return mkPath([a.x + d * (a.r + 8), a.y, b.x - d * (b.r + 12), b.y]);
      }
      // A U-turn round the side, clear of the labels.
      const side = b.row > a.row ? 1 : -1; // right when going down
      const ex = side > 0 ? Math.max(a.x, b.x) + a.r : Math.min(a.x, b.x) - a.r;
      const bulge = ex + side * Math.min(62, side > 0 ? 792 - ex : ex - 8);
      return mkPath(quadPts(side > 0 ? a.x + a.r + 6 : a.x - a.r - 6, a.y, bulge, (a.y + b.y) / 2 + (b.y - a.y) * 0.02, side > 0 ? b.x + b.r + 12 : b.x - b.r - 12, b.y, 22));
    };
    for (let i = 0; i < n - 1; i++) segs.push(link(st[i], st[i + 1]));
    if (loop && n >= 3) {
      const a = st[n - 1]; const b = st[0];
      if (a.row === b.row) {
        const yy = a.y - a.r - 10; const peak = Math.max(top + 6, yy - 120);
        segs.push(mkPath(quadPts(a.x, yy, (a.x + b.x) / 2, peak - (yy - peak) * 0.0 - 40, b.x, yy - 6, 26)));
      } else segs.push(link(a, b));
    }
    return { st, n, segs, loop: loop && n >= 3, hasNotes };
  }
  function drawChain(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layChain(ctx, it, top));
    const { st, n, segs } = L;
    if (!n) { nothing(ctx); ctx.restore(); return; }
    const intro = 0.3 + n * 0.22 + 0.4;
    const F = focusOf(it, n, t, intro);
    const appear = (i) => outBack(clamp((t - 0.25 - i * 0.22) / 0.5));
    // arrows
    segs.forEach((p, i) => {
      const rev = clamp((t - 0.45 - i * 0.22) / 0.5);
      const toI = i < n - 1 ? i + 1 : 0;
      flowArrow(ctx, p, st[toI].c, t, { w: 4, reveal: rev, alpha: 0.55 + 0.45 * Math.max(F.e(i), F.e(toI)) });
    });
    // the travelling token: it waits at a stage, then runs to the next
    if (t > intro - 0.6) {
      const u = Math.max(0, t - intro + 0.6) / 2.5;
      const k = Math.floor(u) % n; const fr = u - Math.floor(u);
      const seg = k < n - 1 ? segs[k] : L.loop ? segs[n - 1] : null;
      if (fr > 0.5 && seg) {
        const q = smooth((fr - 0.5) / 0.5); const pt = at(seg, q * seg.total);
        const c = st[(k + 1) % n].c;
        glow(ctx, color(c), 16); dot(ctx, pt.x, pt.y, 8, c); ctx.shadowBlur = 0; dot(ctx, pt.x, pt.y, 3.5, WHITE);
        ctx.save();
        for (let j = 1; j <= 4; j++) { const tp = at(seg, Math.max(0, q * seg.total - j * 9)); ctx.globalAlpha *= 0.75; dot(ctx, tp.x, tp.y, 7 - j * 1.2, c); }
        ctx.restore();
      }
    }
    // stages
    st.forEach((s, i) => {
      const p = appear(i);
      if (p <= 0.01) return;
      const e = F.e(i);
      ctx.save(); ctx.globalAlpha *= clamp(p) * F.dim(i);
      ctx.translate(s.x, s.y); ctx.scale(p, p); ctx.translate(-s.x, -s.y);
      badge(ctx, s.x, s.y, s.r, s.icon, s.c, e, t);
      // step number
      const nx = s.x - s.r * 0.74; const ny = s.y - s.r * 0.74;
      dot(ctx, nx, ny, 13, s.c); label(ctx, String(i + 1), nx, ny + 1, { size: 15, weight: 800, fill: DARK });
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= clamp(p) * F.dim(i);
      const ly = s.y + s.r + 16 + s.fit.h / 2;
      text(ctx, s.label, s.x, ly, s.lw, { size: 21, weight: 700, lines: 2, fill: e > 0.5 ? s.c : 'ink' });
      ctx.restore();
      hit(b, askOf(s, s.label), s.x - s.lw / 2, s.y - s.r - 8, s.lw, s.r * 2 + 24 + s.fit.h);
    });
    if (L.hasNotes && F.k >= 0) {
      const [k, a] = F.shown;
      if (k >= 0) caption(ctx, st[k].note, 605, 'ink', a * after(t, intro - 0.6));
    }
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-cycle: a cycle that repeats ────────────────────────────────────
  function layCycle(ctx, it, top) {
    const st = stagesOf(it.stages, 7);
    const n = st.length;
    const r = n >= 6 ? 36 : 40; const lab = 54;
    const cy = (top + 604) / 2;
    const Ry = Math.min(185, ((604 - top) - 2 * (r + 12 + lab)) / 2);
    const Rx = Math.min(275, Ry * 1.55);
    st.forEach((s, i) => {
      s.a = -PI / 2 + (i / n) * TAU;
      s.x = MX + Math.cos(s.a) * Rx; s.y = cy + Math.sin(s.a) * Ry; s.r = r;
      s.lw = Math.min(190, n >= 6 ? 170 : 200);
      s.fit = measure(ctx, s.label, s.lw, 20, 700, 2, 18);
      s.above = Math.sin(s.a) < -0.6;
      s.ly = s.above ? s.y - r - 12 - s.fit.h / 2 : s.y + r + 12 + s.fit.h / 2;
    });
    // ring arcs between stages, as paths
    const segs = st.map((s, i) => {
      const a0 = s.a; const a1 = st[(i + 1) % n].a + (i === n - 1 ? TAU : 0);
      const gap = (r + 12) / ((Rx + Ry) / 2);
      const pts = [];
      for (let k = 0; k <= 24; k++) { const a = lerp(a0 + gap, a1 - gap - 0.03, k / 24); pts.push(MX + Math.cos(a) * Rx, cy + Math.sin(a) * Ry); }
      return mkPath(pts);
    });
    return { st, n, segs, cx: MX, cy, Rx, Ry, inner: Math.min(Rx - r - 40, 200) };
  }
  function drawCycle(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layCycle(ctx, it, top));
    const { st, n, segs, cy, Rx, Ry } = L;
    if (!n) { nothing(ctx); ctx.restore(); return; }
    const intro = 0.3 + n * 0.2 + 0.4;
    const F = focusOf(it, n, t, intro);
    // faint ring and flowing arcs
    ctx.strokeStyle = FAINT; ctx.lineWidth = 2; ell(ctx, MX, cy, Rx, Ry); ctx.stroke();
    segs.forEach((p, i) => flowArrow(ctx, p, st[(i + 1) % n].c, t, { w: 4, reveal: clamp((t - 0.4 - i * 0.2) / 0.5), alpha: 0.5 + 0.5 * Math.max(F.e(i), F.e((i + 1) % n)) }));
    // particles circulating round the ring
    if (t > 0.8) {
      const m = 3 * n;
      for (let j = 0; j < m; j++) {
        const a = -PI / 2 + ((j / m) + t * 0.05) * TAU;
        const x = MX + Math.cos(a) * Rx; const y = cy + Math.sin(a) * Ry;
        let near = false; for (const s of st) if (Math.hypot(x - s.x, y - s.y) < s.r + 10) { near = true; break; }
        if (near) continue;
        const ai = Math.floor(mod((a + PI / 2) / TAU, 1) * n);
        dot(ctx, x, y, 3.2, st[ai % n].c);
      }
    }
    st.forEach((s, i) => {
      const p = outBack(clamp((t - 0.25 - i * 0.2) / 0.5));
      if (p <= 0.01) return;
      const e = F.e(i);
      ctx.save(); ctx.globalAlpha *= clamp(p) * F.dim(i);
      ctx.translate(s.x, s.y); ctx.scale(p, p); ctx.translate(-s.x, -s.y);
      badge(ctx, s.x, s.y, s.r, s.icon, s.c, e, t);
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= clamp(p) * F.dim(i);
      ctx.fillStyle = 'rgba(5,8,22,0.8)'; rounded(ctx, s.x - s.fit.w / 2 - 8, s.ly - s.fit.h / 2 - 4, s.fit.w + 16, s.fit.h + 8, 10); ctx.fill();
      text(ctx, s.label, s.x, s.ly, s.lw, { size: 20, weight: 700, lines: 2, fill: e > 0.5 ? s.c : 'ink' });
      ctx.restore();
      const y0 = Math.min(s.y - s.r, s.ly - s.fit.h / 2) - 4; const y1 = Math.max(s.y + s.r, s.ly + s.fit.h / 2) + 4;
      hit(b, askOf(s, s.label), s.x - s.lw / 2, y0, s.lw, y1 - y0);
    });
    // the highlighted stage, told in the middle of the ring
    if (F.k >= 0) {
      const s = st[F.shown[0]] || st[F.k]; const a = F.shown[1] * after(t, intro - 0.5);
      if (a > 0.01) {
        ctx.save(); ctx.globalAlpha *= a;
        const w = L.inner * 2;
        const hasNote = !!s.note;
        drawIcon(ctx, s.icon, MX, cy - (hasNote ? 62 : 30), 62, t);
        text(ctx, s.label, MX, cy + (hasNote ? -8 : 28), w, { size: 26, weight: 700, fill: s.c });
        if (hasNote) text(ctx, s.note, MX, cy + 46, w, { size: 19, weight: 500, fill: 'ink', lines: 3, min: 18 });
        ctx.restore();
      }
    }
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-why: a question and its chain of "because" ─────────────────────
  function layWhy(ctx, it, top) {
    const bc = stagesOf(it.because, 5, 'Reason');
    const n = bc.length;
    const qH = 66; const aH = 74; const gap = 26;
    const avail = 646 - top;
    const boxH = clamp((avail - qH - aH - (n + 1) * gap) / Math.max(1, n), 46, 84);
    const total = qH + aH + n * boxH + (n + 1) * gap;
    let y = top + Math.max(0, (avail - total) / 2);
    const q = { y, h: qH }; y += qH + gap;
    bc.forEach((s) => { s.y = y; s.h = boxH; y += boxH + gap; });
    const ans = { y, h: aH };
    return { bc, n, q, ans, boxH, x: 70, w: 660 };
  }
  function drawWhy(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layWhy(ctx, it, top));
    const { bc, n, q, ans, x, w, boxH } = L;
    const question = str(it.question, 'Why?'); const answer = str(it.answer);
    const tB = (i) => 0.9 + i * 0.85; const tA = tB(n) + 0.2; const intro = tA + 0.8;
    const F = focusOf(it, n, t, intro);
    // question bubble
    {
      const p = after(t, 0.15, 0.5);
      ctx.save(); ctx.globalAlpha *= p; ctx.translate(0, (1 - p) * -16);
      panel(ctx, x, q.y, w, q.h, 'yellow', 0.1, q.h / 2, 0.7);
      dot(ctx, x + 36, q.y + q.h / 2, 21, 'yellow'); label(ctx, '?', x + 36, q.y + q.h / 2 + 1, { size: 28, weight: 800, fill: DARK });
      text(ctx, question, x + 70 + (w - 90) / 2, q.y + q.h / 2, w - 100, { size: 25, weight: 700, lines: 2, min: 18 });
      ctx.restore();
      hit(b, question, x, q.y, w, q.h);
    }
    // connectors with a pulse running down them
    const conn = [];
    let prevY = q.y + q.h;
    for (let i = 0; i <= n; i++) {
      const nextY = i < n ? bc[i].y : ans.y;
      conn.push([prevY, nextY]);
      prevY = i < n ? bc[i].y + bc[i].h : 0;
    }
    conn.forEach(([y0, y1], i) => {
      const show = i < n ? after(t, tB(i) - 0.2, 0.3) : after(t, tA - 0.2, 0.3);
      if (show <= 0) return;
      ctx.save(); ctx.globalAlpha *= show;
      line(ctx, MX, y0 + 3, MX, y1 - 9, tint('muted', 0.7), 2.5);
      head(ctx, MX, y1 - 3, PI / 2, 9, 'muted');
      label(ctx, i < n ? 'because' : 'so', MX + 14, (y0 + y1) / 2, { size: 16, weight: 600, fill: 'muted', align: 'left' });
      ctx.restore();
    });
    if (t > intro) {
      const per = 0.55; const per0 = (n + 1) * per + 1.4;
      const u = mod(t - intro, per0); const j = Math.floor(u / per);
      if (j <= n) { const [y0, y1] = conn[j]; const yy = lerp(y0, y1, smooth((u - j * per) / per)); glow(ctx, color('yellow'), 12); dot(ctx, MX, yy, 5, 'yellow'); ctx.shadowBlur = 0; }
    }
    // because boxes dropping in
    bc.forEach((s, i) => {
      const p = clamp((t - tB(i)) / 0.55);
      if (p <= 0) return;
      const e = F.e(i);
      ctx.save(); ctx.globalAlpha *= easeOut(p) * F.dim(i); ctx.translate(0, (1 - outBack(p)) * -36);
      if (e > 0.05) { glow(ctx, color(s.c), 14 * e); }
      panel(ctx, x, s.y, w, s.h, s.c, 0.08 + 0.1 * e, 14, 0.45 + 0.45 * e);
      ctx.shadowBlur = 0;
      const r = Math.min(s.h * 0.38, 28);
      badge(ctx, x + 18 + r, s.y + s.h / 2, r, s.icon, s.c, 0, t);
      const tx = x + 36 + r * 2; const tw = w - (tx - x) - 18;
      const showNote = s.note && boxH >= 56;
      text(ctx, s.label, tx, s.y + s.h / 2 - (showNote ? 12 : 0), tw, { size: 21, weight: 700, align: 'left', fill: e > 0.5 ? s.c : 'ink' });
      if (showNote) text(ctx, s.note, tx, s.y + s.h / 2 + 15, tw, { size: 18, weight: 500, align: 'left', fill: 'muted', min: 16 });
      ctx.restore();
      hit(b, askOf(s, s.label), x, s.y, w, s.h);
    });
    // the answer
    {
      const p = clamp((t - tA) / 0.6);
      if (p > 0) {
        ctx.save(); ctx.globalAlpha *= easeOut(p); ctx.translate(MX, ans.y + ans.h / 2); ctx.scale(lerp(0.9, 1, outBack(p)), lerp(0.9, 1, outBack(p))); ctx.translate(-MX, -(ans.y + ans.h / 2));
        glow(ctx, color('green'), 10 + 6 * Math.sin(t * 2)); panel(ctx, x, ans.y, w, ans.h, 'green', 0.14, 18, 0.8); ctx.shadowBlur = 0;
        dot(ctx, x + 36, ans.y + ans.h / 2, 20, 'green');
        ctx.strokeStyle = DARK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 27, ans.y + ans.h / 2); ctx.lineTo(x + 34, ans.y + ans.h / 2 + 7); ctx.lineTo(x + 46, ans.y + ans.h / 2 - 7); ctx.stroke();
        text(ctx, answer || 'That is why.', x + 70 + (w - 90) / 2, ans.y + ans.h / 2, w - 100, { size: 22, weight: 700, lines: 2, min: 18, fill: 'ink' });
        ctx.restore();
        hit(b, 'Can you explain that answer?', x, ans.y, w, ans.h);
      }
    }
    if (ans.y + ans.h < HINT_Y - 22) hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-layers: a cutaway of layers ────────────────────────────────────
  const LAYER_HUES = ['cyan', 'teal', 'blue', 'purple', 'orange', 'red', 'yellow'];
  function layLayers(ctx, it, top) {
    const ls = arr(it.layers, 7).map((l, i) => {
      const o = obj(l);
      return { label: str(o.label ?? o.name, `Layer ${i + 1}`), note: str(o.note), ask: o.ask, c: typeof o.color === 'string' && (COLORS[o.color] || /^#[0-9a-f]{6}$/i.test(o.color)) ? o.color : LAYER_HUES[i % 7], size: clamp(num(o.size ?? o.thickness, 1), 0.15, 8) };
    });
    const n = ls.length;
    const radial = it.radial === true || it.radial === 'true';
    const hasNotes = ls.some((l) => l.note);
    const bottom = hasNotes ? 572 : 630;
    const S = ls.reduce((a, l) => a + l.size, 0) || 1;
    const fl = obj(it.flow); const from = integer(fl.from); const to = integer(fl.to);
    const flow = from !== null && to !== null && from >= 0 && to >= 0 && from < n && to < n && from !== to ? { label: str(fl.label), from, to, c: hueOf(fl.color, 0) === 'blue' && !fl.color ? 'yellow' : hueOf(fl.color, 6) } : null;
    if (flow && !fl.color) flow.c = 'yellow';
    const labX = radial ? 560 : 500; const labW = 790 - labX - 4;
    if (!radial) {
      const x0 = 46; const x1 = 380; const dx = 40; const dy = 24;
      const y0 = top + 14 + dy; const Ht = bottom - y0;
      const mins = 26; let hs = ls.map((l) => (l.size / S) * Ht);
      const lack = hs.reduce((a, h) => a + Math.max(0, mins - h), 0);
      const extra = hs.reduce((a, h) => a + Math.max(0, h - mins), 0) || 1;
      hs = hs.map((h) => (h < mins ? mins : h - (h - mins) / extra * lack));
      let y = y0;
      ls.forEach((l, i) => { l.y0 = y; l.y1 = y + hs[i]; y = l.y1; l.fit = measure(ctx, l.label, labW, 21, 700, 1, 18); });
      const ly = spread(ls.map((l) => (l.y0 + l.y1) / 2 - dy / 2), ls.map(() => 34), top + 4, bottom + 10, 4);
      ls.forEach((l, i) => { l.ly = ly[i]; });
      return { ls, n, radial, flow, hasNotes, x0, x1, dx, dy, labX, labW, bottom };
    }
    const cy = (top + bottom) / 2 + 4; const R = Math.min(250, (bottom - top) / 2 - 6); const cx = 40 + R;
    let cum = 0;
    ls.forEach((l) => { l.ro = R * (1 - cum / S); cum += l.size; l.ri = R * (1 - cum / S); l.fit = measure(ctx, l.label, labW, 21, 700, 1, 18); });
    ls.forEach((l, i) => {
      const a = n > 1 ? lerp(-0.95, 0.95, i / (n - 1)) : 0;
      const rm = (l.ro + l.ri) / 2; l.a = a; l.px = cx + Math.cos(a) * rm; l.py = cy + Math.sin(a) * rm;
      if (i === n - 1 && l.ri < 1) { l.px = cx + Math.cos(a) * l.ro * 0.45; l.py = cy + Math.sin(a) * l.ro * 0.45; }
    });
    const ly = spread(ls.map((l) => l.py), ls.map(() => 34), top + 4, bottom + 10, 6);
    ls.forEach((l, i) => { l.ly = ly[i]; });
    return { ls, n, radial, flow, hasNotes, cx, cy, R, labX, labW, bottom };
  }
  function layerTexture(ctx, i, x, y, w, h, c) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = tint(c, 0.35);
    const kind = i % 3;
    for (let k = 0; k < 40; k++) {
      const px = x + rnd(k + i * 50) * w; const py = y + rnd(k * 3 + i * 7) * h;
      if (kind === 0) ctx.fillRect(px, py, 2.2, 2.2); else if (kind === 1) ctx.fillRect(px, py, 9, 1.6); else { ctx.beginPath(); ctx.arc(px, py, 2.4, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }
  function drawLayers(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layLayers(ctx, it, top));
    const { ls, n } = L;
    if (!n) { nothing(ctx); ctx.restore(); return; }
    const intro = 0.3 + n * 0.18 + 0.5;
    const F = focusOf(it, n, t, intro);
    if (!L.radial) {
      const { x0, x1, dx, dy } = L;
      ls.forEach((l, i) => {
        const p = clamp((t - 0.2 - i * 0.18) / 0.5);
        if (p <= 0) return;
        const e = F.e(i); const off = (1 - easeOut(p)) * -50;
        ctx.save(); ctx.globalAlpha *= easeOut(p) * F.dim(i); ctx.translate(0, off);
        const a = 0.26 + 0.24 * e;
        // front face
        ctx.fillStyle = tint(l.c, a); ctx.fillRect(x0, l.y0, x1 - x0, l.y1 - l.y0);
        layerTexture(ctx, i, x0, l.y0, x1 - x0, l.y1 - l.y0, l.c);
        // right face
        ctx.beginPath(); ctx.moveTo(x1, l.y0); ctx.lineTo(x1 + dx, l.y0 - dy); ctx.lineTo(x1 + dx, l.y1 - dy); ctx.lineTo(x1, l.y1); ctx.closePath();
        ctx.fillStyle = tint(l.c, a * 0.6); ctx.fill();
        if (i === 0) { ctx.beginPath(); ctx.moveTo(x0, l.y0); ctx.lineTo(x0 + dx, l.y0 - dy); ctx.lineTo(x1 + dx, l.y0 - dy); ctx.lineTo(x1, l.y0); ctx.closePath(); ctx.fillStyle = tint(l.c, a * 1.25); ctx.fill(); ctx.strokeStyle = tint(l.c, 0.8); ctx.lineWidth = 1.5; ctx.stroke(); }
        ctx.strokeStyle = tint(l.c, 0.55 + 0.4 * e); ctx.lineWidth = 1.5 + e * 1.5;
        ctx.beginPath(); ctx.moveTo(x0, l.y1); ctx.lineTo(x1, l.y1); ctx.lineTo(x1 + dx, l.y1 - dy); ctx.stroke();
        if (e > 0.05) { glow(ctx, color(l.c), 14 * e); ctx.strokeStyle = tint(l.c, 0.9 * e); ctx.lineWidth = 2.5; ctx.strokeRect(x0, l.y0, x1 - x0, l.y1 - l.y0); ctx.shadowBlur = 0; }
        // leader and label
        const mx = x1 + dx / 2; const my = (l.y0 + l.y1) / 2 - dy / 2;
        line(ctx, mx + 4, my, L.labX - 10, l.ly, tint(l.c, 0.7), 1.5); dot(ctx, mx + 4, my, 3.5, l.c);
        text(ctx, l.label, L.labX, l.ly, L.labW, { size: 21, weight: 700, align: 'left', fill: e > 0.5 ? l.c : 'ink' });
        ctx.restore();
        hit(b, askOf(l, l.label), x0, l.y0, L.labX + L.labW - x0, l.y1 - l.y0);
        hit(b, askOf(l, l.label), L.labX - 6, l.ly - 17, L.labW, 34);
      });
      ctx.strokeStyle = 'rgba(220,230,255,0.35)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(x0, ls[0].y0, x1 - x0, ls[n - 1].y1 - ls[0].y0);
      if (L.flow && t > intro - 0.4) {
        const f = L.flow; const a0 = ls[f.from]; const a1 = ls[f.to];
        const fx = (x0 + x1) / 2 + 20; const y0 = (a0.y0 + a0.y1) / 2; const y1 = (a1.y0 + a1.y1) / 2;
        const p = mkPath([fx, y0, fx, y1]);
        flowArrow(ctx, p, f.c, t, { w: 6, headS: 16, reveal: after(t, intro - 0.4, 0.8), dash: [16, 10], speed: 50 });
        for (let k = 0; k < 4; k++) { const q = mod(t * 0.35 + k / 4, 1); const pt = at(p, q * p.total); dot(ctx, pt.x - 34 + Math.sin(q * 9 + k) * 6, pt.y, 4, f.c); dot(ctx, pt.x + 34 - Math.sin(q * 9 + k) * 6, pt.y, 4, f.c); }
        if (f.label) chip(ctx, f.label, fx, (y0 + y1) / 2, f.c, 18, 'center', 280);
      }
    } else {
      const { cx, cy, R } = L;
      ls.forEach((l, i) => {
        const p = outBack(clamp((t - 0.2 - (n - 1 - i) * 0.16) / 0.55));
        if (p <= 0.01) return;
        const e = F.e(i);
        ctx.save(); ctx.globalAlpha *= clamp(p) * F.dim(i);
        ctx.beginPath(); ctx.arc(cx, cy, Math.max(0.1, l.ro * p), 0, TAU);
        ctx.fillStyle = DARK; ctx.fill();
        ctx.fillStyle = tint(l.c, 0.3 + 0.25 * e); ctx.fill();
        if (e > 0.05) { glow(ctx, color(l.c), 16 * e); }
        ctx.strokeStyle = tint(l.c, 0.7 + 0.3 * e); ctx.lineWidth = 2 + e * 2; ctx.stroke(); ctx.shadowBlur = 0;
        ctx.restore();
      });
      // a soft highlight on the sphere
      ctx.save(); ctx.globalAlpha *= after(t, 0.6, 0.6);
      const sheen = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.05, cx - R * 0.4, cy - R * 0.45, R * 0.9);
      sheen.addColorStop(0, 'rgba(255,255,255,0.16)'); sheen.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = sheen; ctx.fill(); ctx.restore();
      ls.forEach((l, i) => {
        const p = after(t, 0.4 + (n - 1 - i) * 0.16, 0.5);
        if (p <= 0) return;
        const e = F.e(i);
        ctx.save(); ctx.globalAlpha *= p * F.dim(i);
        line(ctx, l.px, l.py, L.labX - 10, l.ly, tint(l.c, 0.8), 1.6); dot(ctx, l.px, l.py, 4, e > 0.3 ? WHITE : l.c);
        text(ctx, l.label, L.labX, l.ly, L.labW, { size: 21, weight: 700, align: 'left', fill: e > 0.5 ? l.c : 'ink' });
        ctx.restore();
        hit(b, askOf(l, l.label), L.labX - 6, l.ly - 17, L.labW, 34);
        hit(b, askOf(l, l.label), l.px - 16, l.py - 16, 32, 32);
      });
      if (L.flow && t > intro - 0.4) {
        const f = L.flow; const a0 = ls[f.from]; const a1 = ls[f.to];
        const ang = PI * 1.18; const r0 = (a0.ro + a0.ri) / 2; const r1 = (a1.ro + a1.ri) / 2;
        const p = mkPath([cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0, cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1]);
        flowArrow(ctx, p, f.c, t, { w: 6, headS: 16, reveal: after(t, intro - 0.4, 0.8), speed: 50 });
        if (f.label) { const m = at(p, p.total / 2); chip(ctx, f.label, clamp(m.x, 110, cx + R - 80), m.y + (m.y > cy ? 34 : -34), f.c, 18, 'center', 260); }
      }
    }
    if (L.hasNotes && F.shown[0] >= 0) caption(ctx, ls[F.shown[0]].note, L.radial ? 622 : 612, 'ink', F.shown[1] * after(t, intro - 0.4));
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-machine: a working machine ─────────────────────────────────────
  const KIND_HUE = { gear: 'cyan', wheel: GREY, piston: GREY, lever: 'orange', spring: 'teal', pipe: 'teal', box: 'blue', motor: 'orange', fan: 'cyan', belt: GREY, weight: GREY, valve: 'red', magnet: 'red', battery: 'green', bulb: 'yellow', coil: 'orange', tank: 'blue', propeller: WHITE, axle: GREY };
  const KIND_BOX = { gear: [1, 1], wheel: [1, 1], piston: [0.55, 1.1], lever: [1.55, 0.75], spring: [0.5, 1], pipe: [1.45, 0.38], box: [1, 0.8], motor: [1.15, 0.7], fan: [1, 1], belt: [1.65, 0.8], weight: [0.7, 0.95], valve: [1.25, 0.95], magnet: [0.9, 0.95], battery: [1.1, 0.55], bulb: [0.7, 1.05], coil: [1.35, 0.6], tank: [0.9, 1.1], propeller: [1.1, 1.1], axle: [1.55, 0.3] };
  const NATURAL = { gear: 'spin', wheel: 'spin', fan: 'spin', propeller: 'spin', motor: 'spin', axle: 'spin', belt: 'flow', pipe: 'flow', piston: 'slide', lever: 'swing', spring: 'pulse', bulb: 'pulse', coil: 'flow', tank: 'flow', valve: 'none', box: 'none', weight: 'none', magnet: 'pulse', battery: 'pulse' };
  const ROTATES = new Set(['gear', 'wheel', 'fan', 'propeller', 'motor', 'axle']);
  const LINK_HUE = { energy: 'yellow', fluid: 'blue', force: 'orange', signal: 'green', heat: 'red', blood: '#ef4444', food: 'green', power: 'yellow', data: 'cyan' };
  const linkHue = (k) => LINK_HUE[typeof k === 'string' ? k.trim().toLowerCase() : ''] || 'muted';
  const GEAR_P = 15; const GEAR_D = 7;
  function layMachine(ctx, it, top) {
    const raw = arr(it.parts, 10);
    const n0 = raw.length;
    const A = { x: 24, y: top + 14, w: 752, h: 600 - top - 14 };
    const shrink = n0 > 6 ? 0.88 : n0 > 4 ? 1.08 : 1.22;
    const ps = raw.map((r0, i) => {
      const o = obj(r0);
      let kind = str(o.kind).toLowerCase(); if (!PART_KINDS.includes(kind)) kind = 'box';
      const m = str(o.motion).toLowerCase();
      const motion = ['spin', 'slide', 'swing', 'pulse', 'flow', 'none'].includes(m) ? m : NATURAL[kind] || 'none';
      const R = 44 * clamp(num(o.size, 1), 0.4, 2.2) * shrink;
      const p = { id: str(o.id, `p${i}`), kind, label: str(o.label, kind[0].toUpperCase() + kind.slice(1)), ask: o.ask, motion, explicit: !!m, speed: clamp(num(o.speed, 1), 0.1, 5), R, c: KIND_HUE[kind] || 'cyan', i };
      if (kind === 'gear') { p.N = Math.max(8, Math.round((TAU * R) / GEAR_P)); p.R = (p.N * GEAR_P) / TAU; }
      const [bw, bh] = KIND_BOX[kind] || [1, 1]; p.hw = bw * p.R; p.hh = bh * p.R;
      p.x = A.x + clamp(num(o.x, (i + 0.5) / Math.max(1, n0)), 0, 1) * A.w; p.y = A.y + clamp(num(o.y, 0.5), 0, 1) * A.h;
      return p;
    });
    const fit = (p) => { p.x = clamp(p.x, A.x + p.hw, A.x + A.w - p.hw); p.y = clamp(p.y, A.y + p.hh, A.y + A.h - p.hh); };
    ps.forEach(fit);
    // Gears close to each other mesh: snap them to touching.
    const fixed = new Set(); const mesh = [];
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
      const a = ps[i]; const c = ps[j];
      if (a.kind !== 'gear' || c.kind !== 'gear') continue;
      const d = Math.hypot(c.x - a.x, c.y - a.y); const want = a.R + c.R - GEAR_D;
      if (d > 1.3 * (a.R + c.R)) continue;
      const th = d > 1 ? Math.atan2(c.y - a.y, c.x - a.x) : 0;
      if (!fixed.has(j)) { c.x = a.x + Math.cos(th) * want; c.y = a.y + Math.sin(th) * want; } else if (!fixed.has(i)) { a.x = c.x - Math.cos(th) * want; a.y = c.y - Math.sin(th) * want; }
      fixed.add(i); fixed.add(j); mesh.push([i, j]);
    }
    // Links between parts, by id.
    const byId = new Map(ps.map((p) => [p.id, p]));
    const links = arr(it.links, 10).map((l0) => { const l = obj(l0); return { a: byId.get(str(l.from)), b: byId.get(str(l.to)), kind: str(l.kind).toLowerCase(), label: str(l.label), ask: l.ask }; }).filter((l) => l.a && l.b && l.a !== l.b);
    // Turning: drivers spin; meshed gears turn the other way, linked wheels the same way.
    const adj = ps.map(() => []);
    for (const [i, j] of mesh) { adj[i].push([j, 'mesh']); adj[j].push([i, 'mesh']); }
    for (const l of links) if (ROTATES.has(l.a.kind) && ROTATES.has(l.b.kind) && ['force', 'power', 'energy'].includes(l.kind)) { adj[l.a.i].push([l.b.i, 'belt']); adj[l.b.i].push([l.a.i, 'belt']); }
    const order = ps.filter((p) => p.motion === 'spin' && p.explicit).concat(ps.filter((p) => p.motion === 'spin' && !p.explicit));
    for (const d of order) {
      if (d.w !== undefined) continue;
      d.w = 1.1 * d.speed * clamp(44 / d.R, 0.5, 1.6); d.a0 = 0;
      const queue = [d];
      while (queue.length) {
        const a = queue.shift();
        for (const [j, how] of adj[a.i]) {
          const c = ps[j];
          if (c.w !== undefined || (c.explicit && c.motion !== 'spin')) continue;
          if (how === 'mesh') {
            const th = Math.atan2(c.y - a.y, c.x - a.x);
            const stc = TAU / c.N; const ratio = a.N / c.N;
            c.w = -a.w * ratio; c.a0 = th + PI - stc / 2 + ratio * (th - a.a0);
          } else { c.w = a.w * (a.R / c.R); c.a0 = 0; }
          c.motion = 'spin'; queue.push(c);
        }
      }
    }
    // Labels beside their parts, clear of each other.
    ps.forEach((p) => { p.fit = measure(ctx, p.label, 210, 20, 700, 1, 18); });
    const bounds = { x: 8, y: top, w: 784, h: 648 - top };
    const pl = placeLabels(ps.map((p) => ({ x: p.x, y: p.y, hw: p.hw + 4, hh: p.hh + 4, w: p.fit.w + 14, h: 30 })), bounds);
    ps.forEach((p, i) => { p.lb = pl[i]; });
    // Link paths, edge to edge, and their label spots.
    const taken = ps.map((p) => p.lb).concat(ps.map((p) => ({ x: p.x - p.hw, y: p.y - p.hh, w: p.hw * 2, h: p.hh * 2 })));
    for (const l of links) {
      const { a, b: c } = l;
      const th = Math.atan2(c.y - a.y, c.x - a.x);
      const edge = (p, ang) => { const ex = Math.cos(ang); const ey = Math.sin(ang); const k = 1 / Math.sqrt((ex * ex) / ((p.hw + 8) ** 2) + (ey * ey) / ((p.hh + 8) ** 2)); return [p.x + ex * k, p.y + ey * k]; };
      const [x0, y0] = edge(a, th); const [x1, y1] = edge(c, th + PI);
      const back = links.some((m) => m.a === c && m.b === a);
      const bend = back ? 34 : 0;
      const len = Math.hypot(x1 - x0, y1 - y0);
      l.skip = len < 18 || Math.hypot(c.x - a.x, c.y - a.y) < a.hw + c.hw - 4;
      const mx = (x0 + x1) / 2; const my = (y0 + y1) / 2; const nx = -(y1 - y0) / (len || 1); const ny = (x1 - x0) / (len || 1);
      l.path = mkPath(bend ? quadPts(x0, y0, mx + nx * bend, my + ny * bend, x1, y1, 16) : [x0, y0, x1, y1]);
      l.c = linkHue(l.kind);
      if (l.label && !l.skip) {
        const f = measure(ctx, l.label, 200, 18, 700, 1, 16);
        l.lb = placeChip(l.path, f.w + 24, 30, taken, top);
        if (l.lb) taken.push(l.lb);
      }
    }
    return { ps, links, n: ps.length };
  }
  // One machine part, centred on (0, 0), with its own motion.
  function drawPart(ctx, p, t, e) {
    const c = p.c; const R = p.R; const w = (p.w !== undefined ? p.w : 1.1 * p.speed);
    const sp = p.speed;
    const osc = Math.sin(t * 2.4 * sp);
    const lw = 2.5;
    const sf = (col, a = 0.22) => { ctx.fillStyle = tint(col, a); ctx.fill(); ctx.strokeStyle = tint(col, 0.9); ctx.lineWidth = lw; ctx.stroke(); };
    const spin = p.motion === 'spin';
    const ang = spin ? (p.a0 || 0) + w * t : 0;
    if (p.motion === 'swing' && p.kind !== 'lever' && p.kind !== 'weight') ctx.rotate(osc * 0.25);
    if (p.motion === 'pulse' && p.kind !== 'bulb' && p.kind !== 'spring') { const s = 1 + 0.05 * Math.sin(t * 4 * sp); ctx.scale(s, s); }
    if (p.motion === 'slide' && !['piston', 'weight', 'spring'].includes(p.kind)) ctx.translate(osc * R * 0.25, 0);
    if (spin && !ROTATES.has(p.kind) && p.kind !== 'belt') ctx.rotate(ang * 0.4);
    const flowOn = p.motion === 'flow' || p.motion === 'spin';
    switch (p.kind) {
      case 'gear': {
        ctx.save(); ctx.rotate(ang);
        X = ctx; gearPath(R, p.N, GEAR_D, 0); sf(c, 0.2);
        ctx.beginPath(); ctx.arc(0, 0, R * 0.62, 0, TAU); ctx.strokeStyle = tint(c, 0.5); ctx.lineWidth = 1.5; ctx.stroke();
        for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + PI / 4; ctx.beginPath(); ctx.arc(Math.cos(a) * R * 0.38, Math.sin(a) * R * 0.38, R * 0.12, 0, TAU); ctx.fillStyle = DARK; ctx.fill(); ctx.strokeStyle = tint(c, 0.6); ctx.stroke(); }
        ctx.beginPath(); ctx.arc(0, 0, R * 0.16, 0, TAU); sf(c, 0.6);
        ctx.fillStyle = DARK; ctx.fillRect(-2.5, -R * 0.16, 5, R * 0.1);
        ctx.restore(); break;
      }
      case 'wheel': {
        ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fillStyle = 'rgba(10,14,30,0.9)'; ctx.fill(); ctx.strokeStyle = tint(c, 0.95); ctx.lineWidth = R * 0.16; ctx.stroke();
        ctx.save(); ctx.rotate(ang);
        ctx.strokeStyle = tint(DARK, 0.9); ctx.lineWidth = 2; for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * R * 0.94, Math.sin(a) * R * 0.94); ctx.lineTo(Math.cos(a) * R * 1.06, Math.sin(a) * R * 1.06); ctx.stroke(); }
        ctx.beginPath(); ctx.arc(0, 0, R * 0.84, 0, TAU); ctx.strokeStyle = tint(c, 0.6); ctx.lineWidth = 2; ctx.stroke();
        for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * R * 0.84, Math.sin(a) * R * 0.84); ctx.strokeStyle = tint(c, 0.7); ctx.lineWidth = 1.5; ctx.stroke(); }
        ctx.beginPath(); ctx.arc(0, 0, R * 0.16, 0, TAU); sf(c, 0.7);
        ctx.restore(); break;
      }
      case 'piston': {
        const sl = p.motion === 'slide' || p.motion === 'spin' || p.motion === 'pulse' ? Math.sin(t * 2.6 * sp) : 0;
        const cw = R * 0.5; const top = -R * 1.05; const headY = top + R * 0.42 + (sl + 1) * R * 0.28;
        ctx.fillStyle = tint('orange', 0.12 + 0.3 * (1 - (sl + 1) / 2)); ctx.fillRect(-cw + 3, top + 3, cw * 2 - 6, headY - top - 3);
        ctx.strokeStyle = tint(c, 0.95); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-cw, top + R * 1.2); ctx.lineTo(-cw, top); ctx.lineTo(cw, top); ctx.lineTo(cw, top + R * 1.2); ctx.stroke();
        const ca = t * 2.6 * sp; const cr = R * 0.28; const crY = R * 0.72;
        const pinX = Math.cos(ca + PI / 2) * cr * 0.0 + Math.sin(ca) * cr * 0.6; const pinY = crY - Math.cos(ca) * cr * 0.6;
        ctx.beginPath(); ctx.arc(0, crY, cr, 0, TAU); sf(c, 0.15);
        ctx.strokeStyle = tint('cyan', 0.9); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, headY + R * 0.15); ctx.lineTo(pinX, pinY); ctx.stroke();
        ctx.fillStyle = color('cyan'); ctx.beginPath(); ctx.arc(pinX, pinY, 4, 0, TAU); ctx.fill();
        rounded(ctx, -cw + 3, headY - R * 0.15, cw * 2 - 6, R * 0.3, 4); sf('cyan', 0.45);
        ctx.strokeStyle = tint('cyan', 0.5); ctx.lineWidth = 1.5; for (const d of [-0.06, 0.04]) { ctx.beginPath(); ctx.moveTo(-cw + 4, headY + d * R); ctx.lineTo(cw - 4, headY + d * R); ctx.stroke(); }
        break;
      }
      case 'lever': {
        const a = p.motion === 'swing' || p.motion === 'slide' || p.motion === 'pulse' ? osc * 0.22 : p.motion === 'spin' ? 0 : 0;
        ctx.beginPath(); ctx.moveTo(-R * 0.32, R * 0.68); ctx.lineTo(R * 0.32, R * 0.68); ctx.lineTo(0, 0); ctx.closePath(); sf(GREY, 0.3);
        ctx.save(); ctx.rotate(a);
        rounded(ctx, -R * 1.5, -R * 0.09, R * 3, R * 0.18, 4); sf(c, 0.35);
        rounded(ctx, -R * 1.45, -R * 0.52, R * 0.42, R * 0.42, 5); sf(GREY, 0.4);
        ctx.restore();
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fillStyle = color(WHITE); ctx.fill();
        const ex = Math.cos(a) * R * 1.3; const ey = Math.sin(a) * R * 1.3;
        if (p.motion === 'swing') { head(ctx, ex + Math.sin(a) * 0, ey - R * 0.2 + (osc > 0 ? 6 : 0), PI / 2, 10, 'orange'); line(ctx, ex, ey - R * 0.62, ex, ey - R * 0.3, 'orange', 3); }
        break;
      }
      case 'spring': {
        const k = p.motion === 'none' ? 0 : Math.sin(t * 3 * sp);
        const y0 = -R; const y1 = R * 0.62 + k * R * 0.22; const coils = 8;
        line(ctx, -R * 0.55, y0, R * 0.55, y0, GREY, 4);
        ctx.beginPath(); ctx.moveTo(0, y0);
        for (let i = 0; i <= coils * 2; i++) ctx.lineTo(i === 0 || i === coils * 2 ? 0 : (i % 2 ? 1 : -1) * R * 0.42, y0 + 6 + ((y1 - y0 - 12) * i) / (coils * 2));
        ctx.lineTo(0, y1); ctx.strokeStyle = tint(c, 0.95); ctx.lineWidth = 3.5; ctx.stroke();
        rounded(ctx, -R * 0.4, y1, R * 0.8, R * 0.24, 4); sf(GREY, 0.45);
        break;
      }
      case 'pipe': {
        const hw = R * 1.45; const hh = R * 0.3;
        rounded(ctx, -hw, -hh, hw * 2, hh * 2, hh * 0.6); sf(c, 0.14);
        for (const s of [-1, 1]) { rounded(ctx, s * hw - (s > 0 ? 8 : 0), -hh - 6, 8, hh * 2 + 12, 2); sf(c, 0.5); }
        if (flowOn) { ctx.save(); ctx.beginPath(); ctx.rect(-hw + 8, -hh + 4, hw * 2 - 16, hh * 2 - 8); ctx.clip(); for (let i = 0; i < 9; i++) { const x = -hw + mod(i * 34 + t * 60 * sp, hw * 2 + 30) - 15; head(ctx, x, 0, 0, 7, SKY); ctx.fillStyle = tint(SKY, 0.6); ctx.fillRect(x - 18, -2, 12, 4); } ctx.restore(); }
        break;
      }
      case 'box': {
        rounded(ctx, -R, -R * 0.75, R * 2, R * 1.5, 10); sf(c, 0.18);
        ctx.strokeStyle = tint(c, 0.4); ctx.lineWidth = 1.5; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-R * 0.6 + i * R * 0.14, R * 0.45); ctx.lineTo(-R * 0.6 + i * R * 0.14, R * 0.6); ctx.stroke(); }
        dot(ctx, R * 0.7, -R * 0.5, 4.5, mod(t, 1.4) < 0.7 ? 'green' : tint('green', 0.3));
        break;
      }
      case 'motor': {
        rounded(ctx, -R * 1.1, -R * 0.62, R * 1.55, R * 1.24, 10); sf(c, 0.25);
        ctx.strokeStyle = tint(c, 0.5); ctx.lineWidth = 1.5; for (let i = 0; i < 5; i++) { const x = -R * 0.95 + i * R * 0.22; ctx.beginPath(); ctx.moveTo(x, -R * 0.5); ctx.lineTo(x, R * 0.5); ctx.stroke(); }
        rounded(ctx, R * 0.45, -R * 0.11, R * 0.55, R * 0.22, 3); sf(GREY, 0.5);
        ctx.save(); ctx.translate(R * 1.02, 0); ctx.scale(0.35, 1); ctx.rotate(ang);
        ctx.beginPath(); ctx.arc(0, 0, R * 0.36, 0, TAU); sf(WHITE, 0.15);
        ctx.strokeStyle = color(WHITE); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -R * 0.34); ctx.lineTo(0, R * 0.34); ctx.stroke();
        ctx.restore();
        label(ctx, 'M', -R * 0.33, 1, { size: Math.max(14, R * 0.5), weight: 800, fill: c });
        break;
      }
      case 'fan': case 'propeller': {
        const blades = p.kind === 'fan' ? 4 : 3;
        if (p.kind === 'fan') { ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.strokeStyle = tint(c, 0.6); ctx.lineWidth = 2.5; ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, R * 0.7, 0, TAU); ctx.strokeStyle = tint(c, 0.2); ctx.lineWidth = 1.2; ctx.stroke(); }
        if (spin && Math.abs(w) > 2) { ctx.beginPath(); ctx.arc(0, 0, R * 0.95, 0, TAU); ctx.fillStyle = tint(c, 0.08); ctx.fill(); }
        ctx.save(); ctx.rotate(ang);
        for (let i = 0; i < blades; i++) {
          ctx.rotate(TAU / blades);
          ctx.beginPath(); ctx.moveTo(0, 0);
          if (p.kind === 'fan') { ctx.bezierCurveTo(R * 0.25, -R * 0.2, R * 0.86, -R * 0.32, R * 0.8, R * 0.08); ctx.quadraticCurveTo(R * 0.45, R * 0.24, 0, 0); } else { ctx.bezierCurveTo(R * 0.3, -R * 0.2, R * 1.05, -R * 0.16, R * 1.08, 0); ctx.bezierCurveTo(R * 1.0, R * 0.14, R * 0.3, R * 0.16, 0, 0); }
          sf(c, 0.4);
        }
        ctx.restore();
        ctx.beginPath(); ctx.arc(0, 0, R * 0.14, 0, TAU); sf(WHITE, 0.6);
        break;
      }
      case 'belt': {
        const r1 = R * 0.5; const r2 = R * 0.36; const xa = -R * 1.1; const xb = R * 1.15;
        const pts = [];
        for (let k = 0; k <= 12; k++) { const a = -PI / 2 + (k / 12) * PI; pts.push(xb + Math.cos(a) * (r2 + 4), Math.sin(a) * (r2 + 4)); }
        for (let k = 0; k <= 12; k++) { const a = PI / 2 + (k / 12) * PI; pts.push(xa + Math.cos(a) * (r1 + 4), Math.sin(a) * (r1 + 4)); }
        pts.push(pts[0], pts[1]);
        const bp0 = mkPath(pts);
        ctx.strokeStyle = tint(DARK, 0.9); ctx.lineWidth = 7; strokePath(ctx, bp0);
        ctx.strokeStyle = tint(c, 0.85); ctx.lineWidth = 5; ctx.setLineDash([8, 6]); ctx.lineDashOffset = flowOn ? -t * 40 * sp : 0; strokePath(ctx, bp0); ctx.setLineDash([]);
        for (const [x, r, s] of [[xa, r1, 1], [xb, r2, r1 / r2]]) {
          ctx.save(); ctx.translate(x, 0); ctx.rotate(flowOn ? t * 40 * sp / (r1 + 4) * s * 1 : 0);
          ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); sf('cyan', 0.2);
          for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85); ctx.strokeStyle = tint('cyan', 0.7); ctx.lineWidth = 2; ctx.stroke(); }
          ctx.restore();
        }
        break;
      }
      case 'weight': {
        const swing = p.motion === 'swing' ? osc * 0.3 : 0; const bob = p.motion === 'slide' || p.motion === 'pulse' ? osc * R * 0.2 : 0;
        ctx.save(); ctx.translate(0, -R * 0.95); ctx.rotate(swing);
        line(ctx, 0, 0, 0, R * 0.55 + bob, WHITE, 2);
        ctx.translate(0, R * 0.95 + bob);
        ctx.beginPath(); ctx.arc(0, -R * 0.35, R * 0.1, 0, TAU); ctx.strokeStyle = tint(c, 0.9); ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-R * 0.4, -R * 0.25); ctx.lineTo(R * 0.4, -R * 0.25); ctx.lineTo(R * 0.62, R * 0.85); ctx.lineTo(-R * 0.62, R * 0.85); ctx.closePath(); sf(c, 0.4);
        label(ctx, 'kg', 0, R * 0.32, { size: Math.max(14, R * 0.4), weight: 800, fill: DARK });
        ctx.restore();
        line(ctx, -R * 0.3, -R * 0.95, R * 0.3, -R * 0.95, GREY, 4);
        break;
      }
      case 'valve': {
        rounded(ctx, -R * 1.25, -R * 0.16, R * 2.5, R * 0.32, 4); sf('teal', 0.15);
        ctx.beginPath(); ctx.moveTo(-R * 0.5, -R * 0.42); ctx.lineTo(0, 0); ctx.lineTo(-R * 0.5, R * 0.42); ctx.closePath(); sf(c, 0.4);
        ctx.beginPath(); ctx.moveTo(R * 0.5, -R * 0.42); ctx.lineTo(0, 0); ctx.lineTo(R * 0.5, R * 0.42); ctx.closePath(); sf(c, 0.4);
        line(ctx, 0, 0, 0, -R * 0.72, GREY, 3);
        ctx.save(); ctx.translate(0, -R * 0.78); ctx.scale(1, 0.38); ctx.rotate(p.motion !== 'none' ? t * 1.5 * sp : 0);
        ctx.beginPath(); ctx.arc(0, 0, R * 0.42, 0, TAU); ctx.strokeStyle = tint(c, 0.95); ctx.lineWidth = 4; ctx.stroke();
        for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; line(ctx, 0, 0, Math.cos(a) * R * 0.42, Math.sin(a) * R * 0.42, c, 2.5); }
        ctx.restore();
        if (p.motion === 'flow' || p.motion === 'pulse') for (let i = 0; i < 6; i++) { const x = -R * 1.2 + mod(i * 20 + t * 40 * sp, R * 2.4); if (Math.abs(x) > R * 0.1) dot(ctx, x, 0, 2.5, SKY); }
        break;
      }
      case 'magnet': {
        ctx.beginPath(); ctx.moveTo(-R * 0.75, R * 0.8); ctx.lineTo(-R * 0.75, -R * 0.05); ctx.arc(0, -R * 0.05, R * 0.75, PI, 0); ctx.lineTo(R * 0.75, R * 0.8); ctx.lineTo(R * 0.33, R * 0.8); ctx.lineTo(R * 0.33, -R * 0.05); ctx.arc(0, -R * 0.05, R * 0.33, 0, PI, true); ctx.lineTo(-R * 0.33, R * 0.8); ctx.closePath();
        sf(GREY, 0.2);
        rounded(ctx, -R * 0.75, R * 0.42, R * 0.42, R * 0.38, 2); sf('red', 0.75); rounded(ctx, R * 0.33, R * 0.42, R * 0.42, R * 0.38, 2); sf('blue', 0.75);
        label(ctx, 'N', -R * 0.54, R * 0.62, { size: Math.max(13, R * 0.3), weight: 800, fill: WHITE }); label(ctx, 'S', R * 0.54, R * 0.62, { size: Math.max(13, R * 0.3), weight: 800, fill: WHITE });
        const pa = 0.35 + 0.35 * (p.motion !== 'none' ? Math.sin(t * 3 * sp) : 0.5);
        ctx.save(); ctx.setLineDash([5, 6]); ctx.lineDashOffset = -t * 20 * sp; ctx.strokeStyle = tint('purple', pa); ctx.lineWidth = 1.8;
        for (const k of [0.4, 0.7, 1.0]) { ctx.beginPath(); ctx.moveTo(-R * 0.54, R * 0.82); ctx.bezierCurveTo(-R * 0.54, R * (0.82 + k), R * 0.54, R * (0.82 + k), R * 0.54, R * 0.82); ctx.stroke(); }
        ctx.restore(); break;
      }
      case 'battery': {
        rounded(ctx, -R * 1.05, -R * 0.45, R * 1.9, R * 0.9, 8); sf(c, 0.12);
        rounded(ctx, R * 0.85, -R * 0.2, R * 0.2, R * 0.4, 3); sf(c, 0.7);
        const nOn = p.motion === 'none' ? 4 : 1 + Math.floor(mod(t * 1.4 * sp, 4));
        for (let i = 0; i < 4; i++) { rounded(ctx, -R * 0.92 + i * R * 0.44, -R * 0.32, R * 0.36, R * 0.64, 4); ctx.fillStyle = tint(c, i < nOn ? 0.7 : 0.12); ctx.fill(); }
        label(ctx, '+', R * 0.66, -R * 0.68, { size: Math.max(14, R * 0.4), weight: 800, fill: 'red' }); label(ctx, '−', -R * 0.86, -R * 0.68, { size: Math.max(14, R * 0.4), weight: 800, fill: 'blue' });
        break;
      }
      case 'bulb': {
        const g = p.motion === 'none' ? 0.7 : 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 3 * sp));
        const by = -R * 0.25; const br = R * 0.62;
        const grd = ctx.createRadialGradient(0, by, br * 0.2, 0, by, br * 2.1);
        grd.addColorStop(0, tint('yellow', 0.45 * g)); grd.addColorStop(1, tint('yellow', 0));
        ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(0, by, br * 2.1, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-br * 0.45, R * 0.45); ctx.bezierCurveTo(-br * 0.45, R * 0.2, -br, R * 0.05, -br, by); ctx.arc(0, by, br, PI, 0); ctx.bezierCurveTo(br, R * 0.05, br * 0.45, R * 0.2, br * 0.45, R * 0.45); ctx.closePath();
        ctx.fillStyle = tint('yellow', 0.2 + 0.45 * g); ctx.fill(); ctx.strokeStyle = tint('yellow', 0.95); ctx.lineWidth = 2.5; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-br * 0.3, R * 0.4); ctx.lineTo(-br * 0.2, by); for (let i = 0; i < 5; i++) ctx.lineTo(-br * 0.2 + (i + 1) * br * 0.08, by + (i % 2 ? 4 : -4)); ctx.lineTo(br * 0.3, R * 0.4); ctx.strokeStyle = tint('orange', 0.6 + 0.4 * g); ctx.lineWidth = 2; ctx.stroke();
        rounded(ctx, -br * 0.5, R * 0.45, br, R * 0.42, 4); sf(GREY, 0.45);
        for (let i = 1; i < 3; i++) line(ctx, -br * 0.5, R * 0.45 + i * R * 0.13, br * 0.5, R * 0.45 + i * R * 0.13, GREY, 1.5);
        for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; const r0 = br * 1.25; const r1 = br * (1.45 + 0.15 * g); ctx.strokeStyle = tint('yellow', 0.5 * g); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, by + Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, by + Math.sin(a) * r1); ctx.stroke(); }
        break;
      }
      case 'coil': {
        rounded(ctx, -R * 1.35, -R * 0.16, R * 2.7, R * 0.32, 3); sf(GREY, 0.3);
        const nl = 9;
        for (let i = 0; i < nl; i++) { const x = -R * 1.1 + (i * R * 2.2) / (nl - 1); ctx.beginPath(); ctx.ellipse(x, 0, R * 0.13, R * 0.52, 0.18, 0, TAU); ctx.strokeStyle = tint(c, 0.95); ctx.lineWidth = 3; ctx.stroke(); }
        if (flowOn || p.motion === 'pulse') for (let i = 0; i < nl; i++) { const q = mod(t * 1.5 * sp + i * 0.37, 1); const x = -R * 1.1 + (i * R * 2.2) / (nl - 1) + Math.sin(q * TAU) * R * 0.12; const y = Math.cos(q * TAU) * R * 0.5; if (Math.cos(q * TAU) > -2) dot(ctx, x, y, 2.6, 'yellow'); }
        line(ctx, -R * 1.1, R * 0.52, -R * 1.3, R * 0.75, c, 2.5); line(ctx, R * 1.1, R * 0.52, R * 1.3, R * 0.75, c, 2.5);
        break;
      }
      case 'tank': {
        const tw = R * 0.85; const th = R * 1.05;
        const lvl = th * (0.15 + (p.motion === 'flow' ? 0.08 * Math.sin(t * 0.8 * sp) : 0));
        ctx.save(); rounded(ctx, -tw, -th, tw * 2, th * 2, 12); ctx.clip();
        ctx.beginPath(); ctx.moveTo(-tw, lvl); for (let x = -tw; x <= tw; x += 6) ctx.lineTo(x, lvl - th * 0.0 + Math.sin(x * 0.12 + t * 3 * sp) * 3 - 0); ctx.lineTo(tw, th); ctx.lineTo(-tw, th); ctx.closePath();
        ctx.fillStyle = tint(c, 0.4); ctx.fill();
        if (p.motion !== 'none') for (let i = 0; i < 6; i++) { const q = mod(t * 0.5 * sp + rnd(i), 1); const y = th - q * (th - lvl); ctx.globalAlpha *= 1; dot(ctx, -tw * 0.7 + rnd(i + 3) * tw * 1.4, y, 2.5 + rnd(i) * 2, tint(WHITE, 0.5)); }
        ctx.restore();
        rounded(ctx, -tw, -th, tw * 2, th * 2, 12); ctx.strokeStyle = tint(c, 0.95); ctx.lineWidth = 3; ctx.stroke();
        rounded(ctx, tw, th * 0.62, R * 0.3, R * 0.2, 3); sf('teal', 0.4);
        break;
      }
      case 'axle': {
        const hw = R * 1.5; const hh = R * 0.13;
        rounded(ctx, -hw, -hh, hw * 2, hh * 2, hh); sf(c, 0.3);
        ctx.save(); rounded(ctx, -hw, -hh, hw * 2, hh * 2, hh); ctx.clip();
        const off = mod(ang * R * 0.25, 18);
        ctx.strokeStyle = tint(WHITE, 0.6); ctx.lineWidth = 2.5; for (let x = -hw - 18 + off; x < hw + 18; x += 18) { ctx.beginPath(); ctx.moveTo(x, hh); ctx.lineTo(x + 8, -hh); ctx.stroke(); }
        ctx.restore();
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * hw, 0, hh * 0.9, hh * 2.2, 0, 0, TAU); sf(c, 0.5); }
        break;
      }
      default: break;
    }
    void e;
  }
  function drawMachine(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layMachine(ctx, it, top));
    const { ps, links, n } = L;
    if (!n) { nothing(ctx); ctx.restore(); return; }
    const intro = 0.3 + n * 0.15 + 0.6;
    const F = focusOf(it, n, t, intro);
    // links under the parts
    links.forEach((l, i) => {
      if (l.skip) return;
      const rev = clamp((t - 0.6 - i * 0.12) / 0.6);
      if (rev <= 0) return;
      const hl = Math.max(F.e(l.a.i), F.e(l.b.i));
      flowArrow(ctx, l.path, l.c, t, { w: 3.5, reveal: rev, alpha: 0.6 + 0.4 * hl, dash: [10, 9], speed: 46 });
      if (rev >= 1) {
        const m = Math.max(2, Math.round(l.path.total / 70));
        for (let k = 0; k < m; k++) { const q = mod(t * 0.45 + k / m, 1); const pt = at(l.path, q * (l.path.total - 14)); dot(ctx, pt.x, pt.y, 4, l.c); }
      }
    });
    ps.forEach((p, i) => {
      const s = outBack(clamp((t - 0.25 - i * 0.15) / 0.5));
      if (s <= 0.01) return;
      const e = F.e(i);
      ctx.save(); ctx.globalAlpha *= clamp(s) * F.dim(i);
      ctx.translate(p.x, p.y); ctx.scale(s, s);
      if (e > 0.05) {
        ctx.save(); ctx.globalAlpha *= e;
        ell(ctx, 0, 0, p.hw + 14, p.hh + 14); ctx.fillStyle = tint(p.c, 0.1); ctx.fill();
        glow(ctx, color(p.c), 16); ctx.strokeStyle = tint(p.c, 0.7); ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -t * 20; ctx.stroke(); ctx.setLineDash([]); ctx.shadowBlur = 0;
        ctx.restore();
      }
      drawPart(ctx, p, t, e);
      ctx.restore();
    });
    ps.forEach((p, i) => {
      const a = after(t, 0.5 + i * 0.15, 0.4);
      if (a <= 0) return;
      const e = F.e(i); const r = p.lb;
      ctx.save(); ctx.globalAlpha *= a * F.dim(i);
      ctx.fillStyle = 'rgba(5,8,22,0.72)'; rounded(ctx, r.x, r.y, r.w, r.h, 8); ctx.fill();
      if (e > 0.3) { ctx.strokeStyle = tint(p.c, 0.8 * e); ctx.lineWidth = 1.5; ctx.stroke(); }
      text(ctx, p.label, r.x + r.w / 2, r.y + r.h / 2 + 1, r.w - 10, { size: 20, weight: 700, fill: e > 0.5 ? p.c : 'ink' });
      ctx.restore();
      const x0 = Math.min(r.x, p.x - p.hw); const y0 = Math.min(r.y, p.y - p.hh); const x1 = Math.max(r.x + r.w, p.x + p.hw); const y1 = Math.max(r.y + r.h, p.y + p.hh);
      hit(b, askOf(p, p.label), x0, y0, x1 - x0, y1 - y0);
    });
    links.forEach((l) => {
      if (!l.lb || t < 1.2) return;
      ctx.save(); ctx.globalAlpha *= after(t, 1.2, 0.5);
      const r = l.lb;
      ctx.fillStyle = 'rgba(5,8,22,0.85)'; ctx.strokeStyle = tint(l.c, 0.6); ctx.lineWidth = 1.5; rounded(ctx, r.x, r.y, r.w, r.h, r.h / 2); ctx.fill(); ctx.stroke();
      text(ctx, l.label, r.x + r.w / 2, r.y + r.h / 2 + 1, r.w - 16, { size: 18, weight: 700, fill: l.c, min: 16 });
      ctx.restore();
      if (l.ask) hit(b, str(l.ask), r.x, r.y, r.w, r.h);
    });
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-energy: energy in and where it goes ────────────────────────────
  function layEnergy(ctx, it, top) {
    const inp = obj(it.input);
    const outs = arr(it.outputs, 5).map((o0, i) => {
      const o = obj(o0);
      const useful = o.useful === true || o.useful === 'true' || (o.useful == null && i === 0);
      return { label: str(o.label, useful ? 'Useful' : 'Wasted'), amount: Math.max(0, num(o.amount, NaN)), useful, ask: o.ask };
    });
    const known = outs.filter((o) => Number.isFinite(o.amount));
    let inAmt = num(inp.amount, NaN);
    const sumKnown = known.reduce((a, o) => a + o.amount, 0);
    if (!Number.isFinite(inAmt) || inAmt <= 0) inAmt = sumKnown > 0 ? sumKnown : 100;
    const missing = outs.filter((o) => !Number.isFinite(o.amount));
    const rest = Math.max(0, inAmt - sumKnown);
    missing.forEach((o) => { o.amount = missing.length ? rest / missing.length : 0; });
    const sumOut = outs.reduce((a, o) => a + o.amount, 0) || 1;
    const unit = str(it.unit) || (inAmt === 100 ? '%' : '');
    const show = (v) => `${fmt(v)}${unit ? (/^[%°]/.test(unit) ? unit : ` ${unit}`) : ''}`;
    const useful = outs.filter((o) => o.useful).reduce((a, o) => a + o.amount, 0);
    const eff = clamp(useful / inAmt, 0, 1);
    const hasEff = outs.length > 0;
    const mid = (top + 566) / 2; const Hb = Math.min(300, (566 - top) * 0.6);
    const x0 = 40; const xs = 270; const xe = 520; const gap = 16;
    const m = outs.length;
    const hs = outs.map((o) => Math.max(5, (o.amount / sumOut) * Hb));
    const Hs = hs.reduce((a, h) => a + h, 0);
    let yIn = mid - Hs / 2; let yOut = mid - (Hs + gap * (m - 1)) / 2;
    outs.forEach((o, i) => {
      o.h = hs[i]; o.ya = yIn; yIn += o.h; o.yb = yOut; yOut += o.h + gap;
      o.c = o.useful ? (i % 2 ? 'yellow' : 'green') : 'red';
      o.text = show(o.amount);
    });
    const ly = spread(outs.map((o) => o.yb + o.h / 2), outs.map(() => 52), top + 6, 590, 6);
    outs.forEach((o, i) => { o.ly = ly[i]; });
    return { input: { label: str(inp.label, 'Energy in'), amount: inAmt, text: show(inAmt), ask: inp.ask }, outs, mid, Hs, x0, xs, xe, eff, hasEff, useful: show(useful), inText: show(inAmt) };
  }
  function ribbon(ctx, xs, ya, h, xe, yb) {
    const k = (xe - xs) * 0.5;
    ctx.beginPath(); ctx.moveTo(xs, ya); ctx.bezierCurveTo(xs + k, ya, xe - k, yb, xe, yb); ctx.lineTo(xe, yb + h); ctx.bezierCurveTo(xe - k, yb + h, xs + k, ya + h, xs, ya + h); ctx.closePath();
  }
  function drawEnergy(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layEnergy(ctx, it, top));
    const { outs, mid, Hs, x0, xs, xe } = L;
    const n = outs.length + 1;
    const intro = 1.8;
    const F = focusOf(it, n, t, intro);
    const rev = clamp(t / 1.5);
    const clipX = x0 + (xe + 30 - x0) * easeOut(rev);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, clipX, 700); ctx.clip();
    // the input band
    const eIn = F.e(0);
    ctx.save(); ctx.globalAlpha *= F.dim(0);
    ctx.fillStyle = tint('orange', 0.35 + 0.2 * eIn); ctx.fillRect(x0, mid - Hs / 2, xs - x0, Hs);
    ctx.strokeStyle = tint('orange', 0.8); ctx.lineWidth = 2; ctx.strokeRect(x0, mid - Hs / 2, xs - x0, Hs);
    ctx.restore();
    outs.forEach((o, i) => {
      const e = F.e(i + 1);
      ctx.save(); ctx.globalAlpha *= F.dim(i + 1);
      ribbon(ctx, xs, o.ya, o.h, xe, o.yb);
      ctx.fillStyle = tint(o.c, o.useful ? 0.42 + 0.25 * e : 0.2 + 0.2 * e); ctx.fill();
      ctx.strokeStyle = tint(o.c, o.useful ? 0.9 : 0.55); ctx.lineWidth = 1.5 + e; ctx.stroke();
      // arrow tip
      ctx.beginPath(); ctx.moveTo(xe, o.yb); ctx.lineTo(xe + Math.min(24, 8 + o.h * 0.3), o.yb + o.h / 2); ctx.lineTo(xe, o.yb + o.h); ctx.closePath(); ctx.fillStyle = tint(o.c, o.useful ? 0.75 : 0.4); ctx.fill();
      // flowing streaks
      ctx.save(); ribbon(ctx, xs, o.ya, o.h, xe, o.yb); ctx.clip();
      const k = (xe - xs) * 0.5; const rows = Math.max(1, Math.min(4, Math.floor(o.h / 16)));
      ctx.strokeStyle = tint(WHITE, o.useful ? 0.4 : 0.22); ctx.lineWidth = 2; ctx.setLineDash([14, 22]); ctx.lineDashOffset = -t * 60;
      for (let r = 0; r < rows; r++) { const f = (r + 0.5) / rows; const a = o.ya + o.h * f; const bb = o.yb + o.h * f; ctx.beginPath(); ctx.moveTo(x0, a); ctx.lineTo(xs, a); ctx.bezierCurveTo(xs + k, a, xe - k, bb, xe, bb); ctx.stroke(); }
      ctx.setLineDash([]); ctx.restore();
      ctx.restore();
    });
    ctx.restore();
    // input labels
    {
      const a = after(t, 0.2, 0.5);
      ctx.save(); ctx.globalAlpha *= a * F.dim(0);
      text(ctx, L.input.label, x0, mid - Hs / 2 - 24, 420, { size: 22, weight: 700, align: 'left', fill: F.e(0) > 0.5 ? 'orange' : 'ink' });
      if (Hs > 40) text(ctx, L.input.text, (x0 + xs) / 2, mid, xs - x0 - 20, { size: 30, weight: 800, fill: WHITE });
      else text(ctx, L.input.text, (x0 + xs) / 2, mid + Hs / 2 + 22, xs - x0 - 20, { size: 22, weight: 800, fill: 'orange' });
      ctx.restore();
      hit(b, askOf(L.input, L.input.label), x0, mid - Hs / 2 - 40, xs - x0, Hs + 44);
    }
    outs.forEach((o, i) => {
      const a = after(t, 1.0 + i * 0.15, 0.5);
      if (a <= 0) return;
      const e = F.e(i + 1);
      const lx = xe + 36;
      ctx.save(); ctx.globalAlpha *= a * F.dim(i + 1);
      if (Math.abs(o.ly - (o.yb + o.h / 2)) > 6) line(ctx, xe + 26, o.yb + o.h / 2, lx - 6, o.ly, tint(o.c, 0.6), 1.5);
      text(ctx, o.label, lx, o.ly - 11, 790 - lx, { size: 21, weight: 700, align: 'left', fill: e > 0.5 ? o.c : 'ink' });
      text(ctx, `${o.text} · ${o.useful ? 'useful' : 'wasted'}`, lx, o.ly + 14, 790 - lx, { size: 18, weight: 600, align: 'left', fill: o.c });
      ctx.restore();
      hit(b, askOf(o, o.label), xs + 40, Math.min(o.yb, o.ly - 26), 790 - xs - 40, Math.max(o.h, 52));
    });
    if (L.hasEff) {
      const a = after(t, 1.7, 0.6);
      ctx.save(); ctx.globalAlpha *= a;
      const y = 612; const w = 560; const x = MX - w / 2;
      panel(ctx, x, y - 30, w, 60, 'green', 0.08, 16, 0.5);
      label(ctx, `${Math.round(L.eff * 100)}%`, x + 68, y + 1, { size: 32, weight: 800, fill: 'green' });
      text(ctx, 'efficient', x + 68, y + 22, 120, { size: 16, weight: 600, fill: 'muted', min: 14 });
      text(ctx, `useful out ÷ energy in = ${L.useful} ÷ ${L.inText}`, x + 136, y, w - 150, { size: 19, weight: 600, align: 'left', fill: 'ink', min: 16 });
      ctx.restore();
      hit(b, 'Tell me about efficiency', x, y - 30, w, 60);
    }
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-forces: forces on an object ────────────────────────────────────
  const DIRS = { up: -90, down: 90, left: 180, right: 0, north: -90, south: 90, west: 180, east: 0 };
  function dirAngle(d) {
    if (typeof d === 'string' && DIRS[d.trim().toLowerCase()] !== undefined) return (DIRS[d.trim().toLowerCase()] * PI) / 180;
    const v = num(d, 0);
    return (-v * PI) / 180; // degrees anticlockwise from the right, like a maths angle
  }
  function layForces(ctx, it, top) {
    const cy = (top + 572) / 2; const r0 = 72;
    const maxL = Math.max(70, Math.min(200, cy - top - r0 - 50));
    const fs = arr(it.forces, 5).map((f0, i) => { const f = obj(f0); return { label: str(f.label, `Force ${i + 1}`), a: dirAngle(f.dir), size: clamp(num(f.size, 2), 1, 5), ask: f.ask, c: ['orange', 'cyan', 'purple', 'green', 'yellow'][i % 5] }; });
    // forces along the same line sit side by side
    fs.forEach((f, i) => { const same = fs.filter((g, j) => j < i && Math.abs(mod(g.a - f.a + PI, TAU) - PI) < 0.2).length; f.off = same ? (same % 2 ? 1 : -1) * Math.ceil(same / 2) * 26 : 0; });
    fs.forEach((f) => {
      f.len = 30 + (f.size / 5) * (maxL - 30);
      const ca = Math.cos(f.a); const sa = Math.sin(f.a);
      f.x0 = MX + ca * r0 - sa * f.off; f.y0 = cy + sa * r0 + ca * f.off;
      f.x1 = f.x0 + ca * f.len; f.y1 = f.y0 + sa * f.len;
      f.fit = measure(ctx, f.label, 170, 21, 700, 1, 18);
      f.lx = f.x1 + ca * (f.fit.w / 2 + 16); f.ly = f.y1 + sa * 22;
      f.lx = clamp(f.lx, 8 + f.fit.w / 2, 792 - f.fit.w / 2); f.ly = clamp(f.ly, top + 12, 590);
    });
    // nudge labels apart
    for (let pass = 0; pass < 20; pass++) for (let i = 0; i < fs.length; i++) for (let j = i + 1; j < fs.length; j++) {
      const a = fs[i]; const c = fs[j];
      const ox = (a.fit.w + c.fit.w) / 2 + 12 - Math.abs(a.lx - c.lx); const oy = 32 - Math.abs(a.ly - c.ly);
      if (ox > 0 && oy > 0) { const d = (oy / 2) * (a.ly <= c.ly ? -1 : 1); a.ly += d; c.ly -= d; }
    }
    let nx = 0; let ny = 0; for (const f of fs) { nx += Math.cos(f.a) * f.size; ny += Math.sin(f.a) * f.size; }
    const net = Math.hypot(nx, ny);
    const na = Math.atan2(ny, nx);
    const words = [[0, 'right'], [-PI / 2, 'up'], [PI / 2, 'down'], [PI, 'left'], [-PI, 'left']];
    let dirWord = `${Math.round(mod(-na * 180 / PI, 360))}°`;
    for (const [a, w] of words) if (Math.abs(na - a) < 0.2) dirWord = w;
    const motion = ['still', 'up', 'down', 'left', 'right', 'float'].includes(str(it.motion).toLowerCase()) ? str(it.motion).toLowerCase() : 'still';
    return { fs, cy, r0, net, na, dirWord, motion };
  }
  function drawForces(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layForces(ctx, it, top));
    const { fs, cy, r0, motion } = L;
    const n = fs.length;
    const intro = 0.6 + n * 0.3 + 0.4;
    const F = focusOf(it, n, t, intro);
    const objName = str(it.object, 'box');
    // the world moving past shows the motion
    const mv = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[motion];
    if (mv) {
      ctx.save(); ctx.globalAlpha *= 0.5 * after(t, 0.5, 0.8);
      ctx.strokeStyle = tint('muted', 0.5); ctx.lineWidth = 2;
      for (let i = 0; i < 22; i++) {
        const along = mod(rnd(i) * 900 - t * 180 * (0.8 + rnd(i + 7) * 0.5), 900) - 50; const across = top + 20 + rnd(i + 3) * (560 - top);
        const L2 = 30 + rnd(i + 5) * 40;
        if (mv[0]) { const x = mv[0] > 0 ? along : 800 - along; const y = across; if (Math.hypot(x - MX, y - cy) < r0 + 30) continue; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - mv[0] * L2, y); ctx.stroke(); } else { const y = mv[1] > 0 ? along * 0.75 + top : 700 - along * 0.75; const x = 40 + rnd(i + 3) * 720; if (y < top || y > 600 || Math.hypot(x - MX, y - cy) < r0 + 30) continue; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - mv[1] * L2); ctx.stroke(); }
      }
      ctx.restore();
    }
    const bob = motion === 'float' ? Math.sin(t * 1.6) * 8 : 0;
    const nudge = mv ? Math.sin(t * 2) * 3 : 0;
    ctx.save(); ctx.translate((mv ? mv[0] : 0) * nudge, bob + (mv ? mv[1] : 0) * nudge);
    // the object
    {
      const p = outBack(clamp((t - 0.2) / 0.5));
      ctx.save(); ctx.globalAlpha *= clamp(p);
      ctx.beginPath(); ctx.arc(MX, cy, r0 - 4, 0, TAU); ctx.fillStyle = 'rgba(8,12,30,0.8)'; ctx.fill();
      ctx.strokeStyle = tint('muted', 0.35); ctx.setLineDash([6, 8]); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
      drawIcon(ctx, objName, MX, cy, 118 * p, t);
      dot(ctx, MX, cy, 4, WHITE);
      ctx.restore();
      hit(b, askOf(it.objectAsk ? { ask: it.objectAsk } : null, `forces on the ${objName}`), MX - r0, cy - r0 + bob, r0 * 2, r0 * 2);
    }
    fs.forEach((f, i) => {
      const p = clamp((t - 0.6 - i * 0.3) / 0.5);
      if (p <= 0) return;
      const e = F.e(i); const pulse = 1 + 0.04 * e * Math.sin(t * 6);
      const x1 = f.x0 + (f.x1 - f.x0) * easeOut(p) * pulse; const y1 = f.y0 + (f.y1 - f.y0) * easeOut(p) * pulse;
      ctx.save(); ctx.globalAlpha *= F.dim(i);
      if (e > 0.05) glow(ctx, color(f.c), 14 * e);
      kit.arrow(ctx, f.x0, f.y0, x1, y1, f.c, 5 + f.size * 1.6);
      ctx.shadowBlur = 0;
      ctx.globalAlpha *= easeOut(p);
      ctx.fillStyle = 'rgba(5,8,22,0.7)'; rounded(ctx, f.lx - f.fit.w / 2 - 8, f.ly - 16, f.fit.w + 16, 32, 10); ctx.fill();
      text(ctx, f.label, f.lx, f.ly + 1, 170, { size: 21, weight: 700, fill: e > 0.5 ? f.c : 'ink' });
      ctx.restore();
      const hx = Math.min(f.x0, f.x1, f.lx - f.fit.w / 2) - 6; const hy = Math.min(f.y0, f.y1, f.ly - 16) - 6;
      const hw = Math.max(f.x0, f.x1, f.lx + f.fit.w / 2) + 6 - hx; const hh = Math.max(f.y0, f.y1, f.ly + 16) + 6 - hy;
      hit(b, askOf(f, f.label), hx, hy + bob, hw, hh);
    });
    ctx.restore();
    // the net force
    if (n) {
      const a = after(t, intro - 0.2, 0.5);
      ctx.save(); ctx.globalAlpha *= a;
      const bal = L.net < 0.25;
      const msg = bal ? 'Balanced forces: no net force' : `Net force: ${fmt(L.net)} unit${Math.abs(L.net - 1) < 0.05 ? '' : 's'} ${L.dirWord}`;
      const ch = chip(ctx, msg, MX, 608, bal ? 'green' : 'yellow', 20, 'center', 600);
      if (!bal) { ctx.save(); ctx.translate(ch.x + ch.w + 22, 608); kit.arrow(ctx, -9 * Math.cos(L.na), -9 * Math.sin(L.na), 9 * Math.cos(L.na), 9 * Math.sin(L.na), 'yellow', 3); ctx.restore(); }
      const mtxt = { still: 'The object stays still', float: 'The object floats', up: 'The object moves up', down: 'The object moves down', left: 'The object moves left', right: 'The object moves right' }[motion];
      text(ctx, mtxt, MX, 642, 600, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
      hit(b, bal ? 'Tell me about balanced forces' : 'Tell me about the net force', ch.x, ch.y, ch.w, ch.h);
    }
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-anatomy: a labelled body ───────────────────────────────────────
  function layAnatomy(ctx, it, top) {
    const body = bodyOf(it.body);
    const parts = arr(it.parts, 8).map((p0, i) => { const p = obj(p0); return { label: str(p.label, `Part ${i + 1}`), note: str(p.note), ask: p.ask, fx: clamp(num(p.x, 0.5), 0, 1), fy: clamp(num(p.y, (i + 0.5) / 8), 0, 1), c: HUE6[i % 6] }; });
    const hasNotes = parts.some((p) => p.note);
    const bottom = hasNotes ? 586 : 640;
    // Side views face right; when an author's head parts sit on the left
    // (or the tail on the right), the drawing is mirrored to match them.
    let flip = false;
    if (SIDE_VIEW.has(body)) {
      const avg = (re) => { const xs = parts.filter((p) => re.test(p.label.toLowerCase())).map((p) => p.fx); return xs.length ? xs.reduce((a, v) => a + v, 0) / xs.length : null; };
      const headX = avg(/beak|head|eye|mouth|snout|nose|gill|jaw|face|mane|\bear|tongue|brain|blowhole|teeth|tooth|horn|whisker|nostril|bill|throat|chin/);
      const tailX = avg(/tail|fluke|hind|rump|back leg|back fin/);
      flip = (headX !== null && headX < 0.45) || (headX === null && tailX !== null && tailX > 0.55);
    }
    const availH = bottom - top - 8; const maxW = 460;
    let bh = availH; let bw = bh * body.a;
    if (bw > maxW) { bw = maxW; bh = bw / body.a; }
    const bx = MX - bw / 2; const by = top + 4 + (availH - bh) / 2;
    parts.forEach((p) => { p.px = bx + p.fx * bw; p.py = by + p.fy * bh; });
    // sides: left half to the left column, right half to the right, kept balanced
    parts.forEach((p) => { p.side = p.fx < 0.5 ? -1 : 1; });
    for (let guard = 0; guard < 8; guard++) {
      const nl = parts.filter((p) => p.side < 0).length; const nr = parts.length - nl;
      if (Math.abs(nl - nr) <= 2) break;
      const from = nl > nr ? -1 : 1;
      const cand = parts.filter((p) => p.side === from).sort((a, c) => Math.abs(a.fx - 0.5) - Math.abs(c.fx - 0.5))[0];
      if (!cand) break; cand.side = -from;
    }
    const colW = Math.min(240, bx - 26);
    for (const side of [-1, 1]) {
      const ps = parts.filter((p) => p.side === side).sort((a, c) => a.py - c.py);
      ps.forEach((p) => { p.fit = measure(ctx, p.label, colW, 20, 700, 2, 18); p.h = p.fit.h + 10; });
      const ys = spread(ps.map((p) => p.py), ps.map((p) => p.h), top + 2, bottom, 8);
      ps.forEach((p, i) => { p.ly = ys[i]; p.ex = side < 0 ? bx - 14 : bx + bw + 14; p.lx = side < 0 ? p.ex - 6 : p.ex + 6; });
    }
    return { body, parts, bx, by, bw, bh, colW, hasNotes, flip };
  }
  function drawAnatomy(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layAnatomy(ctx, it, top));
    const { body, parts, bx, by, bw, bh, colW } = L;
    const n = parts.length;
    const intro = 0.9 + n * 0.18 + 0.3;
    const F = focusOf(it, n, t, intro);
    {
      const p = after(t, 0.1, 0.7);
      ctx.save(); ctx.globalAlpha *= p; ctx.translate(0, (1 - p) * 14);
      if (L.flip) { ctx.translate(bx * 2 + bw, 0); ctx.scale(-1, 1); }
      drawBody(ctx, body, bx, by, bw, bh, t);
      ctx.restore();
      // The outline itself is a button only when the lesson gives its own question
      // ("Tell me about the reptile" is not what a gecko lesson is about).
      if (it.bodyAsk) hit(b, str(it.bodyAsk), bx, by, bw, bh);
    }
    parts.forEach((p, i) => {
      const a = after(t, 0.9 + i * 0.18, 0.45);
      if (a <= 0) return;
      const e = F.e(i);
      ctx.save(); ctx.globalAlpha *= a * F.dim(i);
      // leader: from the label, a short level run, then to the spot
      const kx = p.side < 0 ? Math.min(p.ex + 18, p.px - 8) : Math.max(p.ex - 18, p.px + 8);
      ctx.strokeStyle = tint(p.c, 0.55 + 0.4 * e); ctx.lineWidth = 1.6 + e;
      ctx.beginPath(); ctx.moveTo(p.ex, p.ly); ctx.lineTo(kx, p.ly); ctx.lineTo(p.px, p.py); ctx.stroke();
      const pr = 5 + e * (2 + Math.sin(t * 5) * 1.5);
      if (e > 0.05) { ctx.beginPath(); ctx.arc(p.px, p.py, pr + 6 + 4 * mod(t * 1.2, 1), 0, TAU); ctx.strokeStyle = tint(p.c, 0.6 * e * (1 - mod(t * 1.2, 1))); ctx.lineWidth = 2; ctx.stroke(); }
      dot(ctx, p.px, p.py, pr, p.c); dot(ctx, p.px, p.py, 2, DARK);
      text(ctx, p.label, p.lx, p.ly, colW, { size: 20, weight: 700, lines: 2, align: p.side < 0 ? 'right' : 'left', fill: e > 0.5 ? p.c : 'ink' });
      ctx.restore();
      const x0 = p.side < 0 ? p.lx - p.fit.w - 6 : p.lx - 6;
      hit(b, askOf(p, p.label), x0, p.ly - p.h / 2, p.fit.w + 12, p.h);
      hit(b, askOf(p, p.label), p.px - 18, p.py - 18, 36, 36);
    });
    if (L.hasNotes && F.shown[0] >= 0) caption(ctx, parts[F.shown[0]].note, 616, 'ink', F.shown[1] * after(t, intro - 0.3));
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-graph: how one thing changes with another ──────────────────────
  const SHAPES = {
    rise: (u) => 0.08 + 0.84 * (1 - (1 - u) ** 2.2),
    fall: (u) => 0.92 - 0.84 * (1 - (1 - u) ** 2.2),
    peak: (u) => 0.08 + 0.84 * Math.exp(-(((u - 0.45) / 0.2) ** 2)),
    's-curve': (u) => 0.06 + 0.88 / (1 + Math.exp(-11 * (u - 0.5))),
    exponential: (u) => 0.06 + 0.88 * (Math.exp(3.2 * u) - 1) / (Math.exp(3.2) - 1),
    decay: (u) => 0.08 + 0.84 * Math.exp(-4 * u),
    wave: (u) => 0.5 + 0.36 * Math.sin(u * TAU * 2),
    linear: (u) => 0.9 * u, // through the origin (distance-time, Ohm's law)
  };
  const SHAPE_SAYS = {
    rise: 'Rises quickly at first, then levels off',
    fall: 'Falls quickly at first, then levels off',
    peak: 'Rises to a peak, then falls again',
    's-curve': 'Starts slowly, shoots up, then levels off',
    exponential: 'Grows faster and faster',
    decay: 'Drops fast at first, then more and more slowly',
    wave: 'Goes up and down in a repeating pattern',
    linear: 'Goes up steadily: a straight line',
  };
  function layGraph(ctx, it, top) {
    const shape = SHAPES[str(it.shape).toLowerCase()] ? str(it.shape).toLowerCase() : 'linear';
    const fn = SHAPES[shape];
    const g = { x: 116, y: top + 46, w: 610, h: 0 }; g.h = 520 - g.y;
    const pts = []; for (let i = 0; i <= 80; i++) { const u = i / 80; pts.push(g.x + u * g.w, g.y + g.h - fn(u) * g.h); }
    const marks = arr(it.marks, 4).map((m0, i) => { const m = obj(m0); return { i, at: clamp(num(m.at, (i + 1) / 5), 0, 1), label: str(m.label, `Point ${i + 1}`), ask: m.ask, c: ['yellow', 'cyan', 'purple', 'orange'][i] }; }).sort((a, c) => a.at - c.at);
    marks.forEach((m) => { m.x = g.x + m.at * g.w; m.y = g.y + g.h - fn(m.at) * g.h; m.fit = measure(ctx, m.label, 200, 19, 700, 1, 18); m.w = m.fit.w + 22; });
    // mark chips beside their points: clear of the curve, the axes and each other
    const placed = [];
    marks.forEach((m) => {
      const cands = [[0, -40], [0, 40], [-m.w / 2 - 16, -30], [m.w / 2 + 16, -30], [-m.w / 2 - 16, 30], [m.w / 2 + 16, 30], [0, -76], [0, 76], [-m.w / 2 - 16, 0], [m.w / 2 + 16, 0]];
      let best = null; let bs = Infinity;
      for (const [ci, [dx, dy]] of cands.entries()) {
        const r = { x: clamp(m.x + dx - m.w / 2, g.x + 6, 792 - m.w), y: clamp(m.y + dy, g.y - 24, g.y + g.h - 22) - 15, w: m.w, h: 30 };
        let sc = ci * 6;
        for (let i = 0; i < pts.length; i += 2) if (pts[i] > r.x - 4 && pts[i] < r.x + r.w + 4 && pts[i + 1] > r.y - 4 && pts[i + 1] < r.y + r.h + 4) sc += 60;
        for (const q of placed) sc += Math.max(0, Math.min(r.x + r.w, q.x + q.w) - Math.max(r.x, q.x)) * Math.max(0, Math.min(r.y + r.h, q.y + q.h) - Math.max(r.y, q.y));
        if (Math.abs(r.x + r.w / 2 - m.x) > m.w / 2 + 30) sc += 40;
        if (sc < bs) { bs = sc; best = r; }
      }
      m.box = best; placed.push(best);
    });
    return { g, path: mkPath(pts), fn, marks, shape, xl: str(obj(it.x).label ?? it.x, 'x'), yl: str(obj(it.y).label ?? it.y, 'y') };
  }
  function drawGraph(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layGraph(ctx, it, top));
    const { g, path, fn, marks } = L;
    const n = marks.length;
    const intro = 2.6;
    // `focus` counts marks in the order written (they are kept sorted along x)
    const fw = integer(it.focus); const fs = fw === null ? -1 : marks.findIndex((m) => m.i === fw);
    const F = focusOf({ focus: fs >= 0 ? fs : undefined }, n, t, intro);
    // axes
    ctx.save(); ctx.globalAlpha *= after(t, 0.1, 0.5);
    ctx.strokeStyle = 'rgba(140,170,255,0.1)'; ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) { const y = g.y + g.h - (i / 4) * g.h; ctx.beginPath(); ctx.moveTo(g.x, y); ctx.lineTo(g.x + g.w, y); ctx.stroke(); const x = g.x + (i / 4) * g.w; ctx.beginPath(); ctx.moveTo(x, g.y); ctx.lineTo(x, g.y + g.h); ctx.stroke(); }
    kit.arrow(ctx, g.x, g.y + g.h, g.x + g.w + 22, g.y + g.h, 'rgba(210,222,255,0.85)', 3);
    kit.arrow(ctx, g.x, g.y + g.h, g.x, g.y - 24, 'rgba(210,222,255,0.85)', 3);
    const yf = text(ctx, L.yl, g.x - 6, g.y - 40, 560, { size: 21, weight: 700, align: 'left', fill: 'cyan' });
    const xf = text(ctx, L.xl, g.x + g.w + 20, g.y + g.h + 32, 520, { size: 21, weight: 700, align: 'right', fill: 'cyan' });
    ctx.restore();
    hit(b, `Tell me about the ${L.yl.toLowerCase()} axis`, g.x - 10, g.y - 58, yf.w + 20, 36);
    hit(b, `Tell me about the ${L.xl.toLowerCase()} axis`, g.x + g.w + 20 - xf.w - 10, g.y + g.h + 14, xf.w + 20, 36);
    // the curve, drawn progressively
    const rev = clamp((t - 0.4) / 2);
    if (rev > 0) {
      const end = path.total * easeOut(rev);
      ctx.save();
      ctx.beginPath(); ctx.moveTo(g.x, g.y + g.h);
      const last = at(path, end);
      for (let i = 0; i <= last.i; i++) ctx.lineTo(path.pts[2 * i], path.pts[2 * i + 1]);
      ctx.lineTo(last.x, last.y); ctx.lineTo(last.x, g.y + g.h); ctx.closePath();
      ctx.fillStyle = tint('cyan', 0.1); ctx.fill();
      glow(ctx, color('cyan'), 10); ctx.strokeStyle = color('cyan'); ctx.lineWidth = 5; strokePath(ctx, path, 0, end); ctx.shadowBlur = 0;
      ctx.restore();
      if (rev < 1) dot(ctx, last.x, last.y, 7, WHITE);
    }
    // a dot riding the curve, with guides to both axes
    if (t > 2.6) {
      // it rides to and fro, or (with a focus) runs to the mark in focus and waits there
      const u = F.fixed ? marks[F.k].at * smooth((t - 2.6) / 1.6) : tri((t - 2.6) / 4.5);
      const x = g.x + u * g.w; const y = g.y + g.h - fn(u) * g.h;
      ctx.save(); ctx.globalAlpha *= after(t, 2.6, 0.5) * 0.9;
      line(ctx, x, y, x, g.y + g.h, tint('muted', 0.6), 1.5, [5, 6]); line(ctx, x, y, g.x, y, tint('muted', 0.6), 1.5, [5, 6]);
      dot(ctx, x, g.y + g.h, 4, 'muted'); dot(ctx, g.x, y, 4, 'muted');
      glow(ctx, color(WHITE), 12); dot(ctx, x, y, 7, WHITE); ctx.shadowBlur = 0;
      ctx.restore();
    }
    marks.forEach((m, i) => {
      const a = after(t, 1.2 + i * 0.3, 0.5);
      if (a <= 0) return;
      const e = F.e(i);
      ctx.save(); ctx.globalAlpha *= a * F.dim(i);
      line(ctx, m.x, g.y + g.h, m.x, m.y, tint(m.c, 0.8), 2, [7, 6]);
      { const r = m.box; const tx = clamp(m.x, r.x, r.x + r.w); const ty = clamp(m.y, r.y, r.y + r.h); if (Math.hypot(tx - m.x, ty - m.y) > 8) line(ctx, m.x, m.y, tx, ty, tint(m.c, 0.6), 1.5); }
      dot(ctx, m.x, m.y, 6 + 2 * e, m.c);
      const r = m.box;
      if (e > 0.05) glow(ctx, color(m.c), 12 * e);
      ctx.fillStyle = 'rgba(5,8,22,0.88)'; ctx.strokeStyle = tint(m.c, 0.6 + 0.4 * e); ctx.lineWidth = 1.5 + e; rounded(ctx, r.x, r.y, r.w, r.h, 15); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      text(ctx, m.label, r.x + r.w / 2, r.y + r.h / 2 + 1, r.w - 16, { size: 19, weight: 700, fill: m.c });
      ctx.restore();
      hit(b, askOf(m, m.label), r.x, r.y, r.w, r.h);
      hit(b, askOf(m, m.label), m.x - 14, m.y - 14, 28, 28);
    });
    caption(ctx, SHAPE_SAYS[L.shape], 598, 'muted', after(t, 2.3, 0.6));
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-zoom: zooming through levels of size ───────────────────────────
  function layZoom(ctx, it, top) {
    const lv = stagesOf(it.levels, 7, 'Level');
    const n = lv.length;
    const cy = (top + 572) / 2 + 6; const R = Math.min(222, (572 - top) / 2 - 18); const cx = 40 + R;
    const lx = 2 * R + 80; const rowH = Math.min(78, (600 - top - 10) / Math.max(1, n));
    const y0 = (top + 600) / 2 - (rowH * n) / 2;
    lv.forEach((l, i) => { l.ry = y0 + rowH * (i + 0.5); l.spot = { x: (rnd(i * 7 + 1) - 0.5) * 0.5, y: (rnd(i * 3 + 2) - 0.5) * 0.4 }; });
    return { lv, n, cx, cy, R, lx, lw: 790 - lx, rowH };
  }
  function drawZoom(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layZoom(ctx, it, top));
    const { lv, n, cx, cy, R, lx, lw, rowH } = L;
    if (!n) { nothing(ctx); ctx.restore(); return; }
    const f = integer(it.focus);
    const fixed = f !== null && f >= 0 && f < n;
    // where we are: level k, zooming into k + 1 by z
    let k = 0; let z = 0; let fadeA = 1;
    const HOLD = 1.6; const ZM = 1.3;
    if (fixed) {
      const per = ZM + 2.6; const u = mod(Math.max(0, t - 0.6), per);
      if (f === 0) { k = 0; z = 0; } else if (u < ZM) { k = f - 1; z = smooth(u / ZM); } else { k = f; z = 0; }
    } else {
      const per = n * (HOLD + ZM) + 0.8; const u = mod(Math.max(0, t - 0.6), per);
      const j = Math.floor(u / (HOLD + ZM));
      if (j >= n) { k = 0; z = 0; fadeA = smooth((u - n * (HOLD + ZM)) / 0.8); } else {
        const v = u - j * (HOLD + ZM);
        k = j;
        if (j === n - 1) { z = 0; if (v > HOLD + ZM - 0.5) fadeA = 1 - smooth((v - (HOLD + ZM - 0.5)) / 0.5); } else z = v < HOLD ? 0 : smooth((v - HOLD) / ZM);
      }
    }
    const cur = z > 0.5 && k < n - 1 ? k + 1 : k;
    // the lens
    ctx.save(); ctx.globalAlpha *= after(t, 0.1, 0.5);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = 'rgba(6,10,26,0.9)'; ctx.fill();
    ctx.save(); ctx.clip();
    const K = 5;
    const S = K ** z;
    const lvA = lv[k]; const lvB = lv[k + 1];
    const spot = { x: cx + lvA.spot.x * R, y: cy + lvA.spot.y * R };
    const u = (S - 1) / (K - 1);
    const fx = cx + (spot.x - cx) * u; const fy = cy + (spot.y - cy) * u;
    const toScr = (wx, wy) => [cx + (wx - fx) * S, cy + (wy - fy) * S];
    ctx.globalAlpha *= fadeA;
    // zoom streaks while moving between levels
    if (z > 0 && z < 1) {
      ctx.save(); ctx.globalAlpha *= Math.sin(z * PI) * 0.5; ctx.strokeStyle = tint(lvA.c, 0.6); ctx.lineWidth = 2;
      for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU + 0.2; const r0 = R * (0.25 + 0.6 * mod(z * 1.5 + rnd(i), 1)); ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * (r0 + 26), cy + Math.sin(a) * (r0 + 26)); ctx.stroke(); }
      ctx.restore();
    }
    // the parent level
    {
      const [px, py] = toScr(cx, cy);
      const a = 1 - smooth((z - 0.45) / 0.4);
      if (a > 0.01) { ctx.save(); ctx.globalAlpha *= a; const br = 1 + 0.03 * Math.sin(t * 2); drawIcon(ctx, lvA.icon, px, py, R * 1.25 * S * br, t); ctx.restore(); }
    }
    // the next level, hiding in its spot
    if (lvB) {
      const [sx, sy] = toScr(spot.x, spot.y);
      const rr = R * 0.2 * S;
      const pul = z === 0 ? 0.5 + 0.5 * Math.sin(t * 4) : 1;
      ctx.beginPath(); ctx.arc(sx, sy, rr, 0, TAU); ctx.fillStyle = `rgba(6,10,26,${0.55 + 0.4 * z})`; ctx.fill();
      ctx.strokeStyle = tint(lvB.c, 0.5 + 0.4 * pul * (1 - z)); ctx.lineWidth = 2.5; ctx.stroke();
      drawIcon(ctx, lvB.icon, sx, sy, R * 1.25 * 0.2 * S, t);
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.strokeStyle = tint(lv[cur].c, 0.85); ctx.lineWidth = 4; ctx.stroke();
    // a magnifier handle
    ctx.strokeStyle = tint('muted', 0.6); ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(cx + R * 0.72, cy + R * 0.72); ctx.lineTo(cx + R * 0.86, cy + R * 0.86); ctx.stroke();
    chip(ctx, lv[cur].label, cx, cy - R, lv[cur].c, 22, 'center', 2 * R);
    ctx.restore();
    hit(b, askOf(lv[cur], lv[cur].label), cx - R, cy - R, 2 * R, 2 * R);
    if (lv[cur].note) caption(ctx, lv[cur].note, 614, 'ink', z > 0.2 && z < 0.8 ? 0.4 : 1, 2 * R + 60 > 720 ? 720 : Math.max(420, 2 * R + 60));
    // the scale ladder
    const lineX = lx + 18;
    ctx.save(); ctx.globalAlpha *= after(t, 0.3, 0.5);
    line(ctx, lineX, lv[0].ry, lineX, lv[n - 1].ry, tint('muted', 0.5), 3);
    const my = lerp(lv[k].ry, lv[Math.min(n - 1, k + 1)].ry, z);
    lv.forEach((l, i) => {
      const on = i === cur ? 1 : 0;
      dot(ctx, lineX, l.ry, on ? 8 : 5, on ? l.c : 'muted');
      drawIcon(ctx, l.icon, lineX + 38, l.ry, Math.min(44, rowH * 0.62), 0);
      text(ctx, l.label, lineX + 66, l.ry, lw - 84, { size: 19, weight: on ? 700 : 600, align: 'left', fill: on ? l.c : 'ink' });
      hit(b, askOf(l, l.label), lx, l.ry - rowH / 2, lw, rowH);
    });
    glow(ctx, color('yellow'), 10); dot(ctx, lineX, my, 6, 'yellow'); ctx.shadowBlur = 0;
    label(ctx, 'big', lineX, lv[0].ry - rowH / 2 - 4, { size: 15, weight: 600, fill: 'muted' });
    label(ctx, 'small', lineX, lv[n - 1].ry + rowH / 2 + 6, { size: 15, weight: 600, fill: 'muted' });
    ctx.restore();
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-particles: states of matter and their changes ──────────────────
  const PSTATES = {
    solid: { chips: ['Solid'], says: 'Particles are packed in rows and only vibrate in place.' },
    liquid: { chips: ['Liquid'], says: 'Particles touch but slide past each other.' },
    gas: { chips: ['Gas'], says: 'Particles are far apart and zoom about in every direction.' },
    melting: { chips: ['Solid', 'Liquid'], from: 'solid', to: 'liquid', heat: 1, says: 'Heating makes particles vibrate more until they break free and slide.' },
    boiling: { chips: ['Liquid', 'Gas'], from: 'liquid', to: 'gas', heat: 1, says: 'Particles gain enough energy to escape from the liquid as a gas.' },
    freezing: { chips: ['Liquid', 'Solid'], from: 'liquid', to: 'solid', heat: -1, says: 'Cooling slows the particles until they lock into rows.' },
    condensing: { chips: ['Gas', 'Liquid'], from: 'gas', to: 'liquid', heat: -1, says: 'Cooled gas particles slow down and gather into a liquid.' },
    dissolving: { chips: ['Solute + solvent', 'Solution'], says: 'Solute particles break away and spread out between the solvent particles.' },
    diffusion: { chips: ['Separate', 'Mixed'], says: 'Particles spread from where there are many to where there are few.' },
  };
  function layParticles(ctx, it, top) {
    let state = str(it.state).toLowerCase(); if (!PSTATES[state]) state = 'solid';
    const S = PSTATES[state];
    const box = { x: 150, y: top + 66, w: 500, h: 0 }; box.h = 512 - box.y;
    const chips = S.chips.map((c) => ({ label: c, fit: measure(ctx, c, 220, 20, 700, 1, 18) }));
    const gapW = chips.length > 1 ? 70 : 0;
    const totalW = chips.reduce((a, c) => a + c.fit.w + 30, 0) + gapW;
    let x = MX - totalW / 2;
    chips.forEach((c) => { c.w = c.fit.w + 30; c.x = x; x += c.w + gapW; c.y = top + 22; });
    return { state, S, box, chips, label: str(it.label), says: str(it.note) || S.says };
  }
  function drawParticles(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layParticles(ctx, it, top));
    const { state, S, box, chips } = L;
    const r = 13; const sp = 2 * r + 4;
    const nC = chips.length;
    const fx = integer(it.focus); const fixed = fx !== null && fx >= 0 && fx < nC;
    // the change runs on a loop: before, changing, after, then again
    let m = 0; let fadeA = 1;
    if (nC > 1) {
      if (fixed) m = fx; else {
        const u = mod(Math.max(0, t - 0.6), 9.4);
        if (u < 2) m = 0; else if (u < 6.2) m = smooth((u - 2) / 4.2); else if (u < 8.7) m = 1; else if (u < 9.05) { m = 1; fadeA = 1 - smooth((u - 8.7) / 0.35); } else { m = 0; fadeA = smooth((u - 9.05) / 0.35); }
      }
    }
    const cur = nC > 1 ? (m < 0.5 ? 0 : 1) : 0;
    // chips: the states, with an arrow between them
    chips.forEach((c, i) => {
      const on = i === cur;
      const col = on ? (i === 0 ? 'cyan' : S.heat < 0 ? SKY : 'orange') : 'muted';
      ctx.save(); ctx.globalAlpha *= after(t, 0.2 + i * 0.2, 0.4);
      ctx.fillStyle = 'rgba(5,8,22,0.82)'; ctx.strokeStyle = tint(col, on ? 0.9 : 0.4); ctx.lineWidth = on ? 2.5 : 1.5;
      if (on) glow(ctx, color(col), 10);
      rounded(ctx, c.x, c.y - 19, c.w, 38, 19); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      text(ctx, c.label, c.x + c.w / 2, c.y + 1, c.w - 20, { size: 20, weight: 700, fill: on ? col : 'ink' });
      ctx.restore();
      hit(b, `Tell me about the ${c.label.toLowerCase()}`, c.x, c.y - 19, c.w, 38);
      if (i === 0 && nC > 1) {
        const ax = c.x + c.w + 10; const prog = nC > 1 ? m : 0;
        line(ctx, ax, c.y, ax + 50, c.y, tint('muted', 0.4), 4);
        line(ctx, ax, c.y, ax + 50 * prog, c.y, S.heat < 0 ? SKY : 'orange', 4);
        head(ctx, ax + 56, c.y, 0, 10, S.heat < 0 ? SKY : prog > 0.95 ? 'orange' : 'muted');
      }
    });
    // the container
    ctx.save(); ctx.globalAlpha *= after(t, 0.1, 0.5);
    ctx.fillStyle = 'rgba(8,12,30,0.7)'; ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeStyle = tint('muted', 0.8); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(box.x, box.y); ctx.lineTo(box.x, box.y + box.h); ctx.lineTo(box.x + box.w, box.y + box.h); ctx.lineTo(box.x + box.w, box.y); ctx.stroke();
    ctx.restore();
    hit(b, L.label ? askOf(it.ask ? it : null, L.label) : `Tell me about particles in ${state === 'gas' || state === 'solid' || state === 'liquid' ? `a ${state}` : state}`, box.x, box.y, box.w, box.h);
    // particle positions in each arrangement
    const W = box.w; const Hh = box.h; const bx = box.x; const bb = box.y + box.h;
    const latt = (i, cols = 8, s = sp, cx = bx + W / 2) => { const c = i % cols; const row = Math.floor(i / cols); const rows = Math.ceil(48 / cols); return [cx + (c - (cols - 1) / 2) * s, bb - r - 5 - (rows - 1 - row) * s]; };
    const liq = (i, h = 190, x0 = bx, w = W) => [x0 + r + 4 + (w - 2 * r - 8) * tri(rnd(i) * 2 + t * 0.05 * (0.6 + rnd(i + 9))), bb - r - 5 - (h - 2 * r) * tri(rnd(i + 3) * 2 + t * 0.045 * (0.6 + rnd(i + 5)))];
    const gas = (i, x0 = bx, w = W) => [x0 + r + 3 + (w - 2 * r - 6) * tri(rnd(i + 1) * 2 + t * 0.3 * (0.6 + rnd(i + 2))), box.y + r + 3 + (Hh - 2 * r - 6) * tri(rnd(i + 4) * 2 + t * 0.26 * (0.6 + rnd(i + 6)))];
    const posOf = (kind, i) => {
      if (kind === 'solid') { const [x, y] = latt(i); const v = 1.6 + (S.heat > 0 ? 2.4 * m : 0); return [x + Math.sin(t * 15 + i * 1.7) * v, y + Math.cos(t * 13 + i * 2.3) * v]; }
      if (kind === 'liquid') return liq(i);
      return gas(i);
    };
    ctx.save(); ctx.globalAlpha *= fadeA * after(t, 0.4, 0.5);
    const ball = (x, y, c, rr = r) => { ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fillStyle = tint(c, 0.75); ctx.fill(); ctx.strokeStyle = color(c); ctx.lineWidth = 1.5; ctx.stroke(); ctx.beginPath(); ctx.arc(x - rr * 0.35, y - rr * 0.35, rr * 0.28, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill(); };
    if (state === 'dissolving') {
      for (let i = 0; i < 40; i++) { const [x, y] = liq(i + 60, 300); ball(x, y, 'blue', r - 2); }
      for (let i = 0; i < 16; i++) {
        const [ax, ay] = latt(i, 4, 2 * r + 2); const [cx, cy] = liq(i + 7, 300);
        const d = (Math.floor(i / 4) === 0 || i % 4 === 0 || i % 4 === 3 ? 0 : 0.35) + rnd(i) * 0.25;
        const q = smooth((m - d * 0.6) / 0.4);
        ball(lerp(ax + Math.sin(t * 12 + i) * 1.5, cx, q), lerp(ay, cy, q), 'orange', r - 2);
      }
      ctx.restore();
      chip(ctx, 'Solute', box.x + 70, box.y + 26, 'orange', 18); chip(ctx, 'Solvent', box.x + box.w - 76, box.y + 26, 'blue', 18);
    } else if (state === 'diffusion') {
      const wNow = lerp(W / 2, W, m);
      for (let i = 0; i < 24; i++) { const [x, y] = gas(i, bx, wNow); ball(x, y, 'red', r - 2); }
      for (let i = 0; i < 24; i++) { const [x0, y] = gas(i + 30, bx, wNow); ball(bx + W - (x0 - bx), y, 'green', r - 2); }
      ctx.restore();
      const ba = clamp(1 - m * 4);
      if (ba > 0) { ctx.save(); ctx.globalAlpha *= ba; line(ctx, MX, box.y + 6, MX, bb, WHITE, 4, [10, 8]); ctx.restore(); }
    } else {
      const from = S.from || state; const to = S.to || state;
      for (let i = 0; i < 48; i++) {
        const row = Math.floor(i / 8);
        const d = clamp((S.heat > 0 ? row / 6 : 1 - row / 6) * 0.6 + rnd(i) * 0.35);
        const q = from === to ? 0 : smooth((m - d * 0.55) / 0.45);
        const [ax, ay] = posOf(from, i); const [cx, cy] = q > 0 ? posOf(to, i) : [ax, ay];
        const c = q < 0.5 ? (from === 'solid' ? 'blue' : from === 'gas' ? 'purple' : 'cyan') : (to === 'solid' ? 'blue' : to === 'gas' ? 'purple' : 'cyan');
        ball(lerp(ax, cx, q), lerp(ay, cy, q), c);
      }
      ctx.restore();
    }
    if (L.label) chip(ctx, L.label, MX, box.y + box.h + 22, 'cyan', 18, 'center', 420);
    // heating or cooling, and a thermometer
    if (S.heat) {
      const hot = S.heat > 0;
      const k = hot ? m : 1 - m;
      for (let i = 0; i < 4; i++) drawIcon(ctx, hot ? 'fire' : 'snow', box.x + 90 + i * 107, bb + (L.label ? 62 : 34), 34, t + i);
      const tx = box.x + box.w + 52; const ty0 = box.y + 30; const ty1 = bb - 20;
      rounded(ctx, tx - 9, ty0, 18, ty1 - ty0, 9); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill(); ctx.strokeStyle = tint(WHITE, 0.5); ctx.lineWidth = 2; ctx.stroke();
      const lv = lerp(0.25, 0.85, k);
      ctx.fillStyle = color(hot ? 'red' : SKY); ctx.fillRect(tx - 4, ty1 - (ty1 - ty0) * lv, 8, (ty1 - ty0) * lv);
      dot(ctx, tx, ty1 + 6, 13, hot ? 'red' : SKY);
      text(ctx, hot ? 'heating' : 'cooling', tx, ty0 - 18, 120, { size: 17, weight: 600, fill: hot ? 'red' : SKY, min: 15 });
    }
    caption(ctx, L.says, 612, 'ink', after(t, 0.8, 0.6));
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-network: things linked by flows ────────────────────────────────
  function layNetwork(ctx, it, top) {
    const raw = arr(it.nodes, 8);
    const n0 = raw.length;
    const r = n0 > 6 ? 34 : 38;
    const nodes = raw.map((o0, i) => {
      const o = obj(o0);
      const a = -PI / 2 + (i / Math.max(1, n0)) * TAU;
      return { id: str(o.id, `n${i}`), label: str(o.label ?? o.name, `Node ${i + 1}`), icon: str(o.icon), ask: o.ask, c: hueOf(o.color, i), r, i,
        x: 86 + clamp(num(o.x, 0.5 + 0.4 * Math.cos(a)), 0, 1) * 628, y: top + 48 + clamp(num(o.y, 0.5 + 0.4 * Math.sin(a)), 0, 1) * (536 - top - 48) };
    });
    const byId = new Map(nodes.map((p) => [p.id, p]));
    const links = arr(it.links, 12).map((l0) => { const l = obj(l0); return { a: byId.get(str(l.from)), b: byId.get(str(l.to)), kind: str(l.kind).toLowerCase(), label: str(l.label), ask: l.ask }; }).filter((l) => l.a && l.b && l.a !== l.b);
    nodes.forEach((p) => { p.fit = measure(ctx, p.label, 200, 20, 700, 1, 18); });
    const pl = placeLabels(nodes.map((p) => ({ x: p.x, y: p.y, hw: p.r + 6, hh: p.r + 6, w: p.fit.w + 14, h: 30 })), { x: 8, y: top, w: 784, h: 612 - top });
    nodes.forEach((p, i) => { p.lb = pl[i]; });
    const taken = nodes.map((p) => p.lb).concat(nodes.map((p) => ({ x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 })));
    links.forEach((l) => {
      const { a, b: c } = l;
      const back = links.some((m) => m.a === c && m.b === a);
      const dx = c.x - a.x; const dy = c.y - a.y; const d = Math.hypot(dx, dy) || 1; const nx = -dy / d; const ny = dx / d;
      const bend = back ? 38 : 0;
      const qx = (a.x + c.x) / 2 + nx * bend; const qy = (a.y + c.y) / 2 + ny * bend;
      const a0 = Math.atan2(qy - a.y, qx - a.x); const a1 = Math.atan2(qy - c.y, qx - c.x);
      const x0 = a.x + Math.cos(a0) * (a.r + 8); const y0 = a.y + Math.sin(a0) * (a.r + 8);
      const x1 = c.x + Math.cos(a1) * (c.r + 10); const y1 = c.y + Math.sin(a1) * (c.r + 10);
      l.path = mkPath(bend ? quadPts(x0, y0, qx, qy, x1, y1, 18) : [x0, y0, x1, y1]);
      l.c = linkHue(l.kind);
      if (l.label) {
        const f = measure(ctx, l.label, 200, 18, 700, 1, 16);
        l.lb = placeChip(l.path, f.w + 24, 30, taken, top, 610);
        if (l.lb) taken.push(l.lb);
      }
    });
    const kinds = [...new Set(links.map((l) => l.kind).filter((k) => LINK_KINDS.includes(k)))];
    return { nodes, links, kinds, n: nodes.length };
  }
  function drawNetwork(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layNetwork(ctx, it, top));
    const { nodes, links, n } = L;
    if (!n) { nothing(ctx); ctx.restore(); return; }
    const intro = 0.3 + n * 0.15 + 0.7;
    const F = focusOf(it, n, t, intro);
    links.forEach((l, i) => {
      const rev = clamp((t - 0.5 - i * 0.1) / 0.6);
      if (rev <= 0) return;
      const hl = Math.max(F.e(l.a.i), F.e(l.b.i));
      flowArrow(ctx, l.path, l.c, t, { w: 3.5, reveal: rev, alpha: 0.5 + 0.5 * hl, dash: [10, 10], speed: 40, headS: 12 });
      if (rev >= 1) {
        const m = Math.max(2, Math.round(l.path.total / 80));
        for (let k = 0; k < m; k++) { const q = mod(t * 0.4 + k / m + i * 0.13, 1); const pt = at(l.path, q * (l.path.total - 12)); dot(ctx, pt.x, pt.y, 4.5, l.c); }
      }
    });
    nodes.forEach((p, i) => {
      const s = outBack(clamp((t - 0.2 - i * 0.15) / 0.5));
      if (s <= 0.01) return;
      const e = F.e(i);
      ctx.save(); ctx.globalAlpha *= clamp(s) * F.dim(i);
      ctx.translate(p.x, p.y); ctx.scale(s, s); ctx.translate(-p.x, -p.y);
      badge(ctx, p.x, p.y, p.r, p.icon, p.c, e, t);
      ctx.restore();
      const a = after(t, 0.45 + i * 0.15, 0.4); const r = p.lb;
      ctx.save(); ctx.globalAlpha *= a * F.dim(i);
      ctx.fillStyle = 'rgba(5,8,22,0.72)'; rounded(ctx, r.x, r.y, r.w, r.h, 8); ctx.fill();
      text(ctx, p.label, r.x + r.w / 2, r.y + r.h / 2 + 1, r.w - 10, { size: 20, weight: 700, fill: e > 0.5 ? p.c : 'ink' });
      ctx.restore();
      const x0 = Math.min(r.x, p.x - p.r); const y0 = Math.min(r.y, p.y - p.r); const x1 = Math.max(r.x + r.w, p.x + p.r); const y1 = Math.max(r.y + r.h, p.y + p.r);
      hit(b, askOf(p, p.label), x0, y0, x1 - x0, y1 - y0);
    });
    links.forEach((l) => {
      if (!l.lb) return;
      const a = after(t, 1.1, 0.5); if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a;
      const r = l.lb;
      ctx.fillStyle = 'rgba(5,8,22,0.85)'; ctx.strokeStyle = tint(l.c, 0.6); ctx.lineWidth = 1.5; rounded(ctx, r.x, r.y, r.w, r.h, r.h / 2); ctx.fill(); ctx.stroke();
      text(ctx, l.label, r.x + r.w / 2, r.y + r.h / 2 + 1, r.w - 16, { size: 18, weight: 700, fill: l.c, min: 16 });
      ctx.restore();
      if (l.ask) hit(b, str(l.ask), r.x, r.y, r.w, r.h);
    });
    // a key to the colours of the flows
    if (L.kinds.length) {
      ctx.save(); ctx.globalAlpha *= after(t, 1.3, 0.5);
      ctx.font = `600 17px ${FONT}`;
      const ws = L.kinds.map((k) => ctx.measureText(k).width + 34);
      let x = MX - ws.reduce((a, w) => a + w, 0) / 2;
      L.kinds.forEach((k, i) => { dot(ctx, x + 9, 636, 6, linkHue(k)); label(ctx, k, x + 20, 637, { size: 17, weight: 600, fill: 'muted', align: 'left' }); x += ws[i]; });
      ctx.restore();
    }
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-wave: waves ────────────────────────────────────────────────────
  const WAVE_WORD = { transverse: 'transverse wave', longitudinal: 'longitudinal wave', water: 'water waves', light: 'light waves' };
  function drawWave(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    let kind = str(it.kind).toLowerCase(); if (!WAVE_WORD[kind]) kind = 'transverse';
    const marks = [...new Set(arr(it.labels, 3).map((s) => str(s).toLowerCase()).filter((s) => ['wavelength', 'amplitude', 'frequency'].includes(s)))];
    const note = str(it.note);
    const n = marks.length;
    const F = focusOf(it, Math.max(1, n), t, 2);
    const eOf = (name) => (n ? F.e(marks.indexOf(name)) : 0);
    const dimOf = (name) => (n ? F.dim(marks.indexOf(name)) : 1);
    const x0 = 50; const x1 = 750; const y0 = (top + 540) / 2 + 10; const A = kind === 'water' ? 62 : 84; const lam = 250;
    const kk = TAU / lam; const v = 70; const wt = kk * v * Math.max(0, t - 0.4);
    const reveal = clamp((t - 0.2) / 1.2); const xr = x0 + (x1 - x0) * easeOut(reveal);
    const yAt = (x) => y0 - A * Math.sin(kk * (x - x0) - wt);
    const ph0 = kind === 'longitudinal' ? PI : PI / 2; const crest0 = x0 + mod((ph0 + wt) / kk, lam);
    const c1 = crest0 < x0 + 0.5 * lam ? crest0 + lam : crest0; const c2 = c1 + lam; const tr = c1 + lam / 2;
    const waveC = kind === 'light' ? 'yellow' : kind === 'water' ? 'cyan' : 'cyan';
    // the wave itself
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, xr, 700); ctx.clip();
    line(ctx, x0, y0, x1, y0, tint('muted', 0.45), 1.5, [8, 8]);
    if (kind === 'transverse' || kind === 'light') {
      if (kind === 'light') {
        const proj = (x) => { const B = 0.6 * A * Math.sin(kk * (x - x0) - wt); return [x - 0.45 * B, y0 + 0.45 * B]; };
        ctx.strokeStyle = tint('cyan', 0.35); ctx.lineWidth = 1.2;
        for (let x = x0; x <= x1; x += 14) { const [px, py] = proj(x); ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(px, py); ctx.stroke(); }
        ctx.beginPath(); for (let x = x0; x <= x1; x += 4) { const [px, py] = proj(x); if (x === x0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.strokeStyle = color('cyan'); ctx.lineWidth = 3; ctx.stroke();
        ctx.strokeStyle = tint('yellow', 0.35); ctx.lineWidth = 1.2;
        for (let x = x0; x <= x1; x += 14) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, yAt(x)); ctx.stroke(); }
      }
      glow(ctx, color(waveC), 10);
      ctx.beginPath(); for (let x = x0; x <= x1; x += 4) { if (x === x0) ctx.moveTo(x, yAt(x)); else ctx.lineTo(x, yAt(x)); }
      ctx.strokeStyle = color(waveC); ctx.lineWidth = 5; ctx.stroke(); ctx.shadowBlur = 0;
      if (kind === 'transverse') {
        for (let x = x0 + 17; x < x1; x += 35) dot(ctx, x, yAt(x), 4.5, WHITE);
        const hx = x0 + 17 + 35 * 6; const hy = yAt(hx);
        line(ctx, hx, y0 - A - 4, hx, y0 + A + 4, tint('red', 0.35), 2, [4, 5]);
        dot(ctx, hx, hy, 9, 'red');
      } else {
        chip(ctx, 'Electric field', 120, top + 26, 'yellow', 17); chip(ctx, 'Magnetic field', 300, top + 26, 'cyan', 17);
      }
    } else if (kind === 'longitudinal') {
      const D = 19;
      for (let i = 0; ; i++) {
        const rx = x0 + i * 10; if (rx > x1) break;
        const x = rx + D * Math.sin(kk * (rx - x0) - wt);
        const red = i === 35;
        line(ctx, x, y0 - 64, x, y0 + 64, red ? 'red' : tint(waveC, 0.85), red ? 4 : 2.5);
      }
    } else {
      // water: the surface, a float that bobs in place, and a particle orbit
      ctx.beginPath(); ctx.moveTo(x0, 560); for (let x = x0; x <= x1; x += 5) ctx.lineTo(x, yAt(x)); ctx.lineTo(x1, 560); ctx.closePath();
      ctx.fillStyle = tint('blue', 0.28); ctx.fill();
      ctx.beginPath(); for (let x = x0; x <= x1; x += 5) { if (x === x0) ctx.moveTo(x, yAt(x)); else ctx.lineTo(x, yAt(x)); }
      glow(ctx, color('cyan'), 8); ctx.strokeStyle = color('cyan'); ctx.lineWidth = 4; ctx.stroke(); ctx.shadowBlur = 0;
      const fxp = x0 + 70; const fy = yAt(fxp);
      ctx.save(); ctx.translate(fxp, fy - 10); ctx.rotate(-Math.cos(kk * (fxp - x0) - wt) * 0.3);
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.fillStyle = tint('red', 0.8); ctx.fill(); ctx.fillStyle = WHITE; ctx.fillRect(-16, -3, 32, 6);
      ctx.restore();
      const ox = x0 + 160; const oy = y0 + A + 70; const orr = 22;
      ctx.beginPath(); ctx.arc(ox, oy, orr, 0, TAU); ctx.strokeStyle = tint(WHITE, 0.35); ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]); ctx.stroke(); ctx.setLineDash([]);
      const ph = kk * (ox - x0) - wt; dot(ctx, ox - orr * Math.cos(ph), oy - orr * Math.sin(ph), 6, WHITE);
    }
    ctx.restore();
    hit(b, it.ask ? str(it.ask) : `Tell me about ${WAVE_WORD[kind]}`, x0, y0 - A - 10, x1 - x0, 2 * A + 20);
    // direction of travel
    ctx.save(); ctx.globalAlpha *= after(t, 1.2, 0.5);
    kit.arrow(ctx, 590, 560, 720, 560, 'muted', 3);
    text(ctx, 'direction of travel', 590, 584, 200, { size: 17, weight: 600, align: 'left', fill: 'muted', min: 15 });
    ctx.restore();
    if (kind === 'longitudinal') {
      const cx0 = x0 + mod((PI + wt) / kk, lam); const cc = cx0 < x0 + 0.5 * lam ? cx0 + lam : cx0;
      ctx.save(); ctx.globalAlpha *= after(t, 1.4, 0.5);
      const c1r = chip(ctx, 'Compression', cc, y0 - 86, 'orange', 18); const c2r = chip(ctx, 'Rarefaction', cc + lam / 2, y0 + 86, 'teal', 18);
      ctx.restore();
      hit(b, 'Tell me about compressions', c1r.x, c1r.y, c1r.w, c1r.h); hit(b, 'Tell me about rarefactions', c2r.x, c2r.y, c2r.w, c2r.h);
    }
    // markers that ride with the wave (they jump back exactly one wavelength, so the picture never jumps)
    const mk = (name, fn) => { if (!marks.includes(name)) return; const a = after(t, 1.6 + marks.indexOf(name) * 0.3, 0.5); if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a * dimOf(name); const e = eOf(name); const box = fn(e); ctx.restore(); if (box) hit(b, `Tell me about the ${name}`, box.x, box.y, box.w, box.h); };
    mk('wavelength', (e) => {
      const yb = kind === 'longitudinal' ? y0 - 122 : y0 - A - 26;
      const xa = kind === 'longitudinal' ? x0 + mod((PI + wt) / kk, lam) + (x0 + mod((PI + wt) / kk, lam) < x0 + 0.5 * lam ? lam : 0) : c1;
      const xb = xa + lam;
      const c = 'yellow';
      if (e > 0.05) glow(ctx, color(c), 10 * e);
      line(ctx, xa, yb, xb, yb, c, 3); line(ctx, xa, yb - 10, xa, yb + 10, c, 3); line(ctx, xb, yb - 10, xb, yb + 10, c, 3);
      ctx.shadowBlur = 0;
      line(ctx, xa, yb + 10, xa, kind === 'longitudinal' ? y0 - 66 : yAt(xa), tint(c, 0.4), 1.5, [4, 4]);
      line(ctx, xb, yb + 10, xb, kind === 'longitudinal' ? y0 - 66 : yAt(xb), tint(c, 0.4), 1.5, [4, 4]);
      return chip(ctx, 'Wavelength', (xa + xb) / 2, yb - 24, c, 19);
    });
    mk('amplitude', (e) => {
      const c = 'orange';
      if (kind === 'longitudinal') {
        const rx = x0 + 35 * 10; const D = 19;
        if (e > 0.05) glow(ctx, color(c), 10 * e);
        line(ctx, rx - D, y0 + 120, rx + D, y0 + 120, c, 3); head(ctx, rx - D - 4, y0 + 120, PI, 8, c); head(ctx, rx + D + 4, y0 + 120, 0, 8, c);
        line(ctx, rx, y0 + 66, rx, y0 + 112, tint('red', 0.5), 1.5, [3, 4]);
        ctx.shadowBlur = 0;
        return chip(ctx, 'Amplitude', rx, y0 + 148, c, 19);
      }
      const ya = y0 + A;
      if (e > 0.05) glow(ctx, color(c), 10 * e);
      line(ctx, tr, y0, tr, ya - 4, c, 3); head(ctx, tr, ya, PI / 2, 9, c); head(ctx, tr, y0 - 2, -PI / 2, 9, c);
      ctx.shadowBlur = 0;
      return chip(ctx, 'Amplitude', tr + 74, (y0 + ya) / 2, c, 19);
    });
    mk('frequency', (e) => {
      const xf = 660; const c = 'green';
      const near = Math.min(...[-1, 0, 1, 2, 3].map((m) => Math.abs(crest0 + m * lam - xf)));
      const fl = Math.exp(-((near / 14) ** 2));
      const top0 = y0 - A - 34;
      line(ctx, xf, top0, xf, y0 + A + 20, tint(c, 0.5 + 0.5 * fl), 2.5 + 2 * fl, [6, 5]);
      // crests that have passed the post so far
      const base0 = ph0 - kk * (xf - x0);
      const count = Math.max(0, Math.floor((wt + base0) / TAU) - Math.floor(base0 / TAU));
      ctx.save(); if (fl > 0.1) glow(ctx, color(c), 14 * fl);
      dot(ctx, xf, top0, 15, tint(c, 0.25 + 0.6 * fl)); ctx.strokeStyle = color(c); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(xf, top0, 15, 0, TAU); ctx.stroke();
      ctx.restore();
      label(ctx, String(count), xf, top0 + 1, { size: 15, weight: 800, fill: WHITE });
      if (e > 0.05) glow(ctx, color(c), 10 * e);
      const r = chip(ctx, 'Frequency', xf, y0 + A + 48, c, 19, 'center');
      ctx.shadowBlur = 0;
      text(ctx, 'how many waves pass each second', xf, y0 + A + 80, 260, { size: 17, weight: 600, fill: 'muted', min: 15 });
      return r;
    });
    if (note) caption(ctx, note, 622, 'ink', after(t, 1.6, 0.6));
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-balance: moments and seesaws ───────────────────────────────────
  function layBalance(ctx, it, top) {
    const side = (v, s) => arr(v, 3).map((w0, i) => { const w = obj(w0); return { label: str(w.label, s < 0 ? `Left ${i + 1}` : `Right ${i + 1}`), weight: clamp(num(w.weight, 1), 0.5, 10), dist: clamp(num(w.dist ?? w.distance, i + 2), 0.5, 5), ask: w.ask, hide: w.hide === true, s, c: s < 0 ? 'blue' : 'purple' }; });
    const ws = side(it.left, -1).concat(side(it.right, 1));
    const ML = ws.filter((w) => w.s < 0).reduce((a, w) => a + w.weight * w.dist, 0);
    const MR = ws.filter((w) => w.s > 0).reduce((a, w) => a + w.weight * w.dist, 0);
    const py = clamp(top + 330, 350, 410); const u = 62;
    // stack boxes that share a spot
    ws.forEach((w, i) => { w.size = 32 + w.weight * 5; w.stack = ws.slice(0, i).filter((o) => o.s === w.s && Math.abs(o.dist - w.dist) < 0.6).reduce((a, o) => a + o.size, 0); w.fit = measure(ctx, w.label, 200, 19, 700, 1, 18); });
    // label rows so neighbours never overlap
    const sorted = ws.slice().sort((a, c) => a.s * a.dist - c.s * c.dist);
    const rows = [];
    sorted.forEach((w) => { const x = clamp(MX + w.s * w.dist * u, 14 + w.fit.w / 2, 786 - w.fit.w / 2); let r = 0; while ((rows[r] || []).some((o) => Math.abs(o.x - x) < (o.w + w.fit.w) / 2 + 14)) r++; (rows[r] = rows[r] || []).push({ x, w: w.fit.w }); w.row = r; });
    const diff = MR - ML; const ref = Math.max(ML, MR, 1);
    const tilt = Math.abs(diff) < 1e-6 ? 0 : clamp(diff / ref, -1, 1) * 0.2 * (0.5 + 0.5 * Math.min(1, Math.abs(diff) / ref * 3));
    return { ws, ML, MR, py, u, tilt, topAll: -14 - Math.max(0, ...ws.map((o) => o.stack + o.size)) };
  }
  function drawBalance(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layBalance(ctx, it, top));
    const { ws, ML, MR, py, u, tilt } = L;
    const n = ws.length;
    const drop = (i) => 0.3 + i * 0.25; const tStart = drop(n) + 0.3;
    const F = focusOf(it, n, t, tStart + 1);
    const tp = t - tStart;
    const ang = tp <= 0 ? 0 : tilt * (1 - Math.exp(-1.6 * tp) * Math.cos(4.2 * tp)) + (tilt === 0 ? Math.sin(t * 2) * 0.004 : 0);
    // the pivot and the ground
    ctx.save(); ctx.globalAlpha *= after(t, 0.1, 0.4);
    line(ctx, 160, py + 100, 640, py + 100, tint('muted', 0.6), 3);
    ctx.beginPath(); ctx.moveTo(MX, py + 4); ctx.lineTo(MX - 50, py + 100); ctx.lineTo(MX + 50, py + 100); ctx.closePath(); ctx.fillStyle = tint('orange', 0.25); ctx.fill(); ctx.strokeStyle = tint('orange', 0.9); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
    hit(b, 'Tell me about the pivot', MX - 50, py, 100, 100);
    ctx.save(); ctx.translate(MX, py); ctx.rotate(ang);
    rounded(ctx, -5.4 * u, -14, 10.8 * u, 14, 5); ctx.fillStyle = tint('cyan', 0.25); ctx.fill(); ctx.strokeStyle = tint('cyan', 0.9); ctx.lineWidth = 2.5; ctx.stroke();
    for (let d = 1; d <= 5; d++) for (const s of [-1, 1]) { line(ctx, s * d * u, -14, s * d * u, 0, tint(WHITE, 0.5), 1.5); label(ctx, String(d), s * d * u, 14, { size: 15, weight: 600, fill: 'muted' }); }
    dot(ctx, 0, -7, 6, WHITE);
    ws.forEach((w, i) => {
      const p = clamp((t - drop(i)) / 0.5); if (p <= 0) return;
      const e = F.e(i);
      const x = w.s * w.dist * u; const yb = -14 - w.stack - (1 - outBack(p)) * 120;
      ctx.save(); ctx.globalAlpha *= easeOut(p) * F.dim(i);
      if (e > 0.05) glow(ctx, color(w.c), 14 * e);
      rounded(ctx, x - w.size / 2, yb - w.size, w.size, w.size, 6); ctx.fillStyle = tint(w.c, 0.35 + 0.25 * e); ctx.fill(); ctx.strokeStyle = tint(w.c, 0.95); ctx.lineWidth = 2 + e; ctx.stroke(); ctx.shadowBlur = 0;
      label(ctx, w.hide ? '?' : fmt(w.weight), x, yb - w.size / 2 + 1, { size: Math.min(22, 12 + w.size * 0.2), weight: 800, fill: WHITE });
      ctx.restore();
    });
    ctx.restore();
    // labels stay upright above their boxes
    ws.forEach((w, i) => {
      const p = clamp((t - drop(i)) / 0.5); if (p <= 0) return;
      const e = F.e(i);
      const lx0 = w.s * w.dist * u; const ly0 = -14 - w.stack - w.size;
      const ca = Math.cos(ang); const sa = Math.sin(ang);
      const bx = MX + lx0 * ca - ly0 * sa; const by = py + lx0 * sa + ly0 * ca;
      const ty = py + lx0 * sa + L.topAll * ca - 24 - w.row * 30;
      const fw = w.fit.w; const lxx = clamp(bx, 14 + fw / 2, 786 - fw / 2);
      ctx.save(); ctx.globalAlpha *= easeOut(p) * F.dim(i);
      if (by - (ty + 14) > 10) line(ctx, lxx, ty + 14, bx, by - 2, tint(w.c, 0.6), 1.5);
      ctx.fillStyle = 'rgba(5,8,22,0.78)'; rounded(ctx, lxx - fw / 2 - 6, ty - 14, fw + 12, 28, 8); ctx.fill();
      if (e > 0.3) { ctx.strokeStyle = tint(w.c, 0.8 * e); ctx.lineWidth = 1.5; ctx.stroke(); }
      text(ctx, w.label, lxx, ty + 1, 200, { size: 19, weight: 700, fill: e > 0.5 ? w.c : 'ink' });
      ctx.restore();
      const hx0 = Math.min(bx - w.size / 2, lxx - fw / 2 - 6); const hx1 = Math.max(bx + w.size / 2, lxx + fw / 2 + 6);
      hit(b, askOf(w, w.label), hx0, ty - 14, hx1 - hx0, by + w.size - ty + 18);
    });
    // the moments
    if (n) {
      const a = after(t, tStart, 0.6);
      ctx.save(); ctx.globalAlpha *= a;
      // pan: a weighing scale for equations (no moments); a hidden weight shows "?" so the answer is not given away
      const pan = it.pan === true || ws.some((w) => w.hide);
      const bal = Math.abs(ML - MR) < 1e-6;
      let verdict;
      if (pan) {
        const side = (s) => ws.filter((w) => w.s === s).map((w) => (w.hide ? w.label : fmt(w.weight))).join(' + ') || '0';
        text(ctx, `${side(-1)}  ${bal ? '=' : ML > MR ? '>' : '<'}  ${side(1)}`, MX, 590, 700, { size: 24, weight: 800, fill: 'ink', min: 16 });
        verdict = bal ? 'Both sides weigh the same: it balances' : ML > MR ? 'The left side is heavier' : 'The right side is heavier';
      } else {
        const sum = (s) => ws.filter((w) => w.s === s).map((w) => `${fmt(w.weight)}×${fmt(w.dist)}`).join(' + ') || '0';
        const lt = `Left: ${sum(-1)} = ${fmt(ML)}`; const rt = `Right: ${sum(1)} = ${fmt(MR)}`;
        text(ctx, lt, 205, 590, 360, { size: 19, weight: 700, fill: 'blue', min: 16 });
        text(ctx, rt, 595, 590, 360, { size: 19, weight: 700, fill: 'purple', min: 16 });
        verdict = bal ? 'Moments are equal: it balances' : ML > MR ? 'Left moment is bigger: it turns anticlockwise' : 'Right moment is bigger: it turns clockwise';
      }
      chip(ctx, verdict, MX, 630, bal ? 'green' : 'yellow', 19, 'center', 700);
      ctx.restore();
      hit(b, 'Tell me about moments', 40, 572, 720, 76);
    }
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-sizes: comparing sizes ─────────────────────────────────────────
  function laySizes(ctx, it, top) {
    const items = arr(it.items, 7).map((s0, i) => { const s = obj(s0); return { label: str(s.label, `Item ${i + 1}`), size: Math.abs(num(s.size, 1)) || 1, icon: str(s.icon), ask: s.ask, c: HUE6[i % 6] }; });
    const n = items.length;
    const unit = str(it.unit);
    const max = Math.max(1e-9, ...items.map((s) => s.size)); const min = Math.min(...items.map((s) => s.size));
    const log = n > 1 && max / min > 40;
    const base = 520; const Hm = base - (top + 34);
    items.forEach((s) => { s.k = log ? 0.14 + 0.86 * (Math.log(s.size / min) / Math.log(max / min)) : Math.max(0.05, s.size / max); });
    let f = 1; const gap = 14; const minSlot = Math.min(104, (760 - gap * (n - 1)) / Math.max(1, n));
    for (let g = 0; g < 40; g++) { const tot = items.reduce((a, s) => a + Math.max(minSlot, s.k * Hm * f * 0.95), 0) + gap * (n - 1); if (tot <= 760) break; f *= 0.94; }
    let x = MX - (items.reduce((a, s) => a + Math.max(minSlot, s.k * Hm * f * 0.95), 0) + gap * (n - 1)) / 2;
    items.forEach((s) => { s.h = Math.max(22, s.k * Hm * f); s.slot = Math.max(minSlot, s.h * 0.95); s.x = x + s.slot / 2; x += s.slot + gap; const short = unit.length <= 6; s.val = `${fmt(s.size)}${unit && short ? (/^[%°]/.test(unit) ? unit : ` ${unit}`) : ''}`; s.fit = measure(ctx, s.label, s.slot, 20, 700, 2, 18); });
    return { items, n, base, log, min, unit, smallest: items.reduce((a, s) => (s.size < a.size ? s : a), items[0] || { size: 1 }) };
  }
  function drawSizes(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = laySizes(ctx, it, top));
    const { items, n, base } = L;
    if (!n) { nothing(ctx); ctx.restore(); return; }
    const intro = 0.3 + n * 0.2 + 0.6;
    const F = focusOf(it, n, t, intro);
    line(ctx, 20, base + 2, 780, base + 2, tint('muted', 0.6), 3);
    items.forEach((s, i) => {
      const p = outBack(clamp((t - 0.3 - i * 0.2) / 0.6));
      const e = F.e(i);
      ctx.save(); ctx.globalAlpha *= clamp(p * 2) * F.dim(i);
      if (p > 0.01) {
        const h = s.h * p;
        if (e > 0.05) { ctx.save(); ctx.globalAlpha *= e * 0.9; ell(ctx, s.x, base + 2, s.slot * 0.42, 7); ctx.fillStyle = tint(s.c, 0.35); ctx.fill(); ctx.restore(); }
        drawIcon(ctx, s.icon, s.x, base - h / 2, h * 1.08, t);
        if (e > 0.05) {
          const bx = s.x + Math.max(s.h * 0.5, 20) + 6;
          ctx.save(); ctx.globalAlpha *= e;
          line(ctx, bx, base, bx, base - h, s.c, 2.5); line(ctx, bx - 6, base - h, bx + 6, base - h, s.c, 2.5); line(ctx, bx - 6, base, bx + 6, base, s.c, 2.5);
          ctx.restore();
        }
      }
      text(ctx, s.label, s.x, base + 16 + s.fit.h / 2, s.slot, { size: 20, weight: 700, lines: 2, fill: e > 0.5 ? s.c : 'ink' });
      text(ctx, s.val, s.x, base + 30 + s.fit.h, s.slot, { size: 18, weight: 600, fill: 'muted', min: 15 });
      ctx.restore();
      hit(b, askOf(s, s.label), s.x - s.slot / 2, base - s.h - 6, s.slot, s.h + 50 + s.fit.h);
    });
    if (F.k >= 0 && n > 1) {
      const s = items[Math.max(0, F.shown[0])]; const sm = L.smallest;
      const ratio = s.size / sm.size;
      const msg = s === sm || ratio < 1.05 ? `${s.label}: the smallest here` : `${s.label} is ${fmt(ratio)}× the ${sm.label.toLowerCase()}`;
      caption(ctx, msg, 632, s.c, F.shown[1] * after(t, intro - 0.3));
    }
    if (L.log) chip(ctx, 'Squashed to fit: not to scale', 790, top + 16, 'muted', 16, 'right');
    if (L.unit.length > 6) chip(ctx, `In ${L.unit}`, 10, top + 16, 'muted', 16, 'left', L.log ? 420 : 760);
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-compare: two things side by side ───────────────────────────────
  function layCompare(ctx, it, top) {
    const side = (v, i) => { const o = obj(v); return { title: str(o.title ?? o.label, i ? 'B' : 'A'), icon: str(o.icon), ask: o.ask, points: arr(o.points, 4).map((p) => str(p)).filter(Boolean), c: i ? 'purple' : 'cyan' }; };
    const sides = [side(it.left, 0), side(it.right, 1)];
    const verdict = str(it.verdict);
    const y0 = top + 8; const y1 = verdict ? 566 : 640;
    sides.forEach((s, i) => { s.x = i ? 410 : 30; s.w = 360; s.y = y0; s.h = y1 - y0; });
    return { sides, verdict };
  }
  function drawCompare(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layCompare(ctx, it, top));
    const { sides, verdict } = L;
    const F = focusOf(it, 2, t, 1.2 + 8 * 0.45);
    const maxP = Math.max(sides[0].points.length, sides[1].points.length);
    const tP = (si, j) => 0.9 + (j * 2 + si) * 0.45;
    const tV = 0.9 + maxP * 2 * 0.45 + 0.2;
    sides.forEach((s, si) => {
      const p = after(t, 0.15 + si * 0.15, 0.5);
      const e = F.e(si);
      ctx.save(); ctx.globalAlpha *= p * F.dim(si); ctx.translate(0, (1 - p) * 20);
      if (e > 0.05) glow(ctx, color(s.c), 16 * e);
      panel(ctx, s.x, s.y, s.w, s.h, s.c, 0.07 + 0.06 * e, 18, 0.45 + 0.45 * e); ctx.shadowBlur = 0;
      badge(ctx, s.x + s.w / 2, s.y + 54, 38, s.icon, s.c, e, t);
      text(ctx, s.title, s.x + s.w / 2, s.y + 122, s.w - 30, { size: 25, weight: 700, fill: s.c });
      line(ctx, s.x + 30, s.y + 148, s.x + s.w - 30, s.y + 148, tint(s.c, 0.35), 1.5);
      const rowH = Math.min(84, (s.h - 170) / Math.max(1, s.points.length));
      s.points.forEach((pt, j) => {
        const q = after(t, tP(si, j), 0.45);
        if (q <= 0) return;
        const y = s.y + 168 + rowH * (j + 0.5) - 6;
        ctx.save(); ctx.globalAlpha *= q; ctx.translate((1 - q) * (si ? 20 : -20), 0);
        dot(ctx, s.x + 34, y, 12, tint(s.c, 0.25)); dot(ctx, s.x + 34, y, 5, s.c);
        text(ctx, pt, s.x + 56, y, s.w - 76, { size: 20, weight: 500, align: 'left', lines: 2, min: 18, fill: 'ink' });
        ctx.restore();
      });
      ctx.restore();
      hit(b, askOf(s, s.title), s.x, s.y, s.w, s.h);
    });
    // vs
    ctx.save(); ctx.globalAlpha *= after(t, 0.5, 0.4);
    dot(ctx, MX, sides[0].y + 54, 24, DARK); ctx.strokeStyle = tint('muted', 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(MX, sides[0].y + 54, 24, 0, TAU); ctx.stroke();
    label(ctx, 'vs', MX, sides[0].y + 55, { size: 19, weight: 800, fill: 'muted' });
    ctx.restore();
    if (verdict) {
      const p = after(t, tV, 0.6);
      if (p > 0) {
        ctx.save(); ctx.globalAlpha *= p; ctx.translate(0, (1 - p) * 14);
        glow(ctx, color('yellow'), 10); panel(ctx, 30, 584, 740, 58, 'yellow', 0.1, 16, 0.75); ctx.shadowBlur = 0;
        drawIcon(ctx, 'scale', 66, 613, 40, t);
        text(ctx, verdict, 96 + 330, 613, 650, { size: 21, weight: 700, lines: 2, min: 18, fill: 'ink' });
        ctx.restore();
        hit(b, 'Can you explain the verdict?', 30, 584, 740, 58);
      }
    }
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── Shared bits of the learning engines (story … sort) ───────────────
  // A rounded box that never gets a bad size or radius.
  function box(ctx, x, y, w, h, r = 12) { w = Math.max(1, w); h = Math.max(1, h); rounded(ctx, x, y, w, h, clamp(r, 0, Math.min(w, h) / 2)); }
  function card(ctx, x, y, w, h, c, e = 0, r = 18, fillA = 0.08) {
    if (e > 0.05) glow(ctx, color(c), 18 * e);
    ctx.fillStyle = 'rgba(8,12,30,0.86)'; box(ctx, x, y, w, h, r); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = tint(c, fillA + 0.1 * e); ctx.fill();
    ctx.strokeStyle = tint(c, 0.45 + 0.5 * e); ctx.lineWidth = 2 + e; ctx.stroke();
  }
  // A tick that draws itself in (p 0 to 1).
  function tick(ctx, x, y, s, p, c = 'green', w = 6) {
    if (p <= 0) return;
    const pts = mkPath([x - s * 0.5, y, x - s * 0.15, y + s * 0.38, x + s * 0.55, y - s * 0.42]);
    ctx.strokeStyle = color(c); ctx.lineWidth = w; strokePath(ctx, pts, 0, pts.total * clamp(p));
  }
  // A walk through n things with time: the one now (k), how far into it (fr),
  // and whether the whole run is done; it starts again after a rest.
  function walk(t, n, start, step, rest = 3) {
    const cyc = n * step + rest;
    const u = mod(Math.max(0, t - start), cyc);
    const k = Math.min(n, Math.floor(u / step));
    return { k, fr: k < n ? (u - k * step) / step : 1, done: k >= n, u, cyc };
  }

  // ─── x-steps: a routine, one step at a time ───────────────────────────
  function laySteps(ctx, it, top) {
    let mode = str(it.mode, 'checklist').toLowerCase().replace(/[\s_]+/g, '-');
    if (!['checklist', 'now-next', 'first-then'].includes(mode)) mode = mode.includes('then') ? 'first-then' : mode.includes('next') ? 'now-next' : 'checklist';
    let st = stagesOf(it.steps, 8);
    if (mode !== 'checklist' && st.length !== 2) mode = 'checklist';
    st = st.map((s, i) => ({ ...s, c: hueOf(arr(it.steps, 8)[i]?.color, i + 1) }));
    const n = st.length;
    if (mode === 'checklist') {
      const y0 = top + 8; const y1 = BOTTOM;
      const rowH = Math.min(96, (y1 - y0) / Math.max(1, n));
      const gy = y0 + ((y1 - y0) - rowH * n) / 2;
      const r = clamp(rowH * 0.36, 18, 32);
      st.forEach((s, i) => {
        s.y = gy + rowH * (i + 0.5); s.h = rowH - 8; s.r = r;
        s.tw = 740 - 200 - 20;
        s.fit = measure(ctx, s.label, s.tw, rowH > 70 ? 28 : 24, 700, 1, 18);
        s.nfit = s.note && rowH >= 62 ? measure(ctx, s.note, s.tw, 18, 500, 1, 16) : null;
      });
      return { mode, st, n, rowH };
    }
    const words = mode === 'now-next' ? ['Now', 'Next'] : ['First', 'Then'];
    const ch = Math.min(BOTTOM - top - 30, 430); const cy = top + 14 + (BOTTOM - top - 14 - ch) / 2;
    st.forEach((s, i) => { s.x = i ? 425 : 35; s.w = 340; s.y = cy; s.h = ch; s.word = words[i]; });
    return { mode, st, n, words };
  }
  function drawSteps(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = laySteps(ctx, it, top));
    const { st, n } = L;
    if (!n) { nothing(ctx); ctx.restore(); return; }
    const fixed = integer(it.focus);
    if (L.mode === 'checklist') {
      const intro = 0.3 + n * 0.15 + 0.4;
      // the step now: a fixed focus (the ones before it are done), or a walk
      const W = walk(t, n, intro, 2.4, 3.5);
      const hasF = fixed !== null && fixed >= 0 && fixed < n;
      const now = hasF ? fixed : W.done ? -1 : W.k;
      const doneP = (i) => (hasF ? (i < fixed ? 1 : 0) : i < W.k ? 1 : i === W.k && !W.done ? clamp((W.fr - 0.62) / 0.25) : W.done ? 1 : 0);
      // the line joining the boxes fills as steps are done
      const bx = 70;
      const y0 = st[0].y; const y1 = st[n - 1].y;
      line(ctx, bx, y0, bx, y1, tint('muted', 0.35), 4);
      let fill = 0; for (let i = 0; i < n - 1; i++) fill += clamp(doneP(i));
      if (fill > 0) line(ctx, bx, y0, bx, y0 + (y1 - y0) * Math.min(fill, n - 1) / Math.max(1, n - 1), 'green', 4);
      st.forEach((s, i) => {
        const p = after(t, 0.3 + i * 0.15, 0.5);
        if (p <= 0) return;
        const e = i === now ? (hasF ? 1 : smooth(W.fr / 0.15)) : 0;
        const d = doneP(i);
        ctx.save(); ctx.globalAlpha *= p * (now < 0 || i === now || d >= 1 ? 1 : 0.62); ctx.translate((1 - p) * -24, 0);
        card(ctx, 112, s.y - s.h / 2, 668, s.h, s.c, e, 16, d >= 1 ? 0.03 : 0.07);
        // the box and its tick
        ctx.fillStyle = DARK; box(ctx, bx - 20, s.y - 20, 40, 40, 10); ctx.fill();
        ctx.strokeStyle = d >= 1 ? color('green') : tint(s.c, 0.6 + 0.4 * e); ctx.lineWidth = 3; ctx.stroke();
        if (d > 0) { ctx.fillStyle = tint('green', 0.25 * d); ctx.fill(); tick(ctx, bx + 2, s.y - 1, 28, d, 'green', 5); } else label(ctx, String(i + 1), bx, s.y + 1, { size: 18, weight: 800, fill: 'muted' });
        badge(ctx, 160, s.y, s.r, s.icon, s.c, e, t);
        const tx = 160 + s.r + 22;
        const ly = s.nfit ? s.y - s.nfit.h / 2 - 1 : s.y;
        text(ctx, s.label, tx, ly, s.tw, { size: s.fit.size, weight: 700, align: 'left', fill: d >= 1 ? 'muted' : e > 0.5 ? s.c : 'ink', min: 18 });
        if (s.nfit) text(ctx, s.note, tx, s.y + s.fit.h / 2 + 2, s.tw, { size: 18, weight: 500, align: 'left', fill: e > 0.5 ? 'ink' : 'muted', min: 16 });
        if (e > 0.05) { ctx.save(); ctx.globalAlpha *= e; const ax = 92 + Math.sin(t * 3) * 3; head(ctx, ax + 8, s.y, 0, 11, s.c); ctx.restore(); }
        ctx.restore();
        hit(b, askOf(s, s.label), 112, s.y - s.h / 2, 668, s.h);
      });
      if (!hasF && W.done) {
        const a = clamp((W.u - n * 2.4) / 0.5) * clamp((W.cyc - W.u) / 0.4);
        if (a > 0) { ctx.save(); ctx.globalAlpha *= a; chip(ctx, 'All done!', MX, HINT_Y, 'green', 20); ctx.restore(); }
        if (a < 0.9) hint(ctx, t, b);
      } else hint(ctx, t, b);
      ctx.restore();
      return;
    }
    // Now / next or first / then: two big cards and an arrow.
    const hasF = fixed === 0 || fixed === 1;
    const W = walk(t, 2, 1.4, 3.2, 2.6);
    const now = hasF ? fixed : W.done ? 1 : W.k;
    st.forEach((s, i) => {
      const p = after(t, 0.2 + i * 0.35, 0.55);
      if (p <= 0) return;
      const e = i === now ? 1 : 0;
      const done = i < now || (!hasF && W.done && i === 1 && W.u > 2 * 3.2 + 0.6);
      ctx.save(); ctx.globalAlpha *= p * (e || done ? 1 : 0.7); ctx.translate(0, (1 - p) * 24);
      card(ctx, s.x, s.y, s.w, s.h, s.c, e, 22);
      const cx = s.x + s.w / 2;
      // the word: Now / Next, First / Then
      ctx.fillStyle = tint(s.c, 0.85); box(ctx, cx - 70, s.y - 22, 140, 44, 22); ctx.fill();
      label(ctx, s.word, cx, s.y + 1, { size: 24, weight: 800, fill: DARK });
      const r = Math.min(92, (s.h - 200) / 2.6);
      badge(ctx, cx, s.y + 60 + r, r, s.icon, s.c, e * (0.6 + 0.4 * Math.sin(t * 2) ** 2), t);
      const ly = s.y + 60 + r * 2 + 50;
      const f = text(ctx, s.label, cx, ly, s.w - 40, { size: 32, weight: 700, lines: 2, min: 20, fill: e ? s.c : 'ink' });
      if (s.note) text(ctx, s.note, cx, ly + f.h / 2 + 34, s.w - 40, { size: 20, weight: 500, lines: 2, min: 17, fill: 'muted' });
      if (done) { ctx.save(); dot(ctx, s.x + s.w - 34, s.y + 34, 22, tint('green', 0.3)); tick(ctx, s.x + s.w - 32, s.y + 34, 26, 1, 'green', 5); ctx.restore(); }
      ctx.restore();
      hit(b, askOf(s, s.label), s.x, s.y - 22, s.w, s.h + 22);
    });
    const ap = after(t, 0.6, 0.5);
    if (ap > 0) {
      ctx.save(); ctx.globalAlpha *= ap;
      const ay = st[0].y + st[0].h * 0.36; const o = Math.sin(t * 2.5) * 3;
      line(ctx, 380 + o, ay, 410 + o, ay, st[1].c, 6); head(ctx, 416 + o, ay, 0, 12, st[1].c);
      ctx.restore();
    }
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-timeline: events in time order ─────────────────────────────────
  // A line across the middle; dated nodes appear in order, their cards
  // taking turns above and below so long labels never collide.
  function layTimeline(ctx, it, top) {
    const ev = arr(it.events, 8).map((e0, i) => {
      const e = obj(e0);
      return { label: str(e.label ?? e.title, `Event ${i + 1}`), when: str(e.when ?? e.date ?? e.year, ''), note: str(e.note ?? e.text), icon: str(e.icon), ask: e.ask, c: hueOf(e.color, i) };
    });
    const n = ev.length;
    const hasNotes = ev.some((e) => e.note);
    const lineY = top + Math.round((hasNotes ? 548 : 600) - top) / 2 + 6;
    // cards alternate sides, so one may be nearly two slots wide
    let cw = 250; let x0 = 70; let slot = 0;
    for (let g = 0; g < 4; g++) { x0 = Math.max(60, 10 + cw / 2); slot = n > 1 ? (800 - 2 * x0) / (n - 1) : 0; cw = Math.min(250, n > 1 ? slot * 2 - 18 : 300); }
    const x1 = 800 - x0;
    const hasIcons = ev.some((e) => e.icon);
    ev.forEach((e, i) => {
      e.x = n > 1 ? x0 + slot * i : MX; e.up = i % 2 === 0; e.cw = cw;
      e.fit = measure(ctx, e.label, cw - 16, 22, 700, 2, 18);
      e.wfit = measure(ctx, e.when || ' ', Math.min(slot > 0 ? slot * 2 - 14 : 200, 170), 19, 800, 1, 15); // dates alternate sides too
      e.ir = hasIcons ? (n <= 4 ? 36 : 28) : 0;
      e.ch = (hasIcons ? e.ir * 2 + 12 : 0) + e.fit.h + 20; // card height
      // keep the card on the board
      e.cx = clamp(e.x, 8 + cw / 2, 792 - cw / 2);
    });
    const room = Math.min(lineY - top - 54, (hasNotes ? 572 : 640) - lineY - 54);
    const stem = clamp(room - Math.max(0, ...ev.map((e) => e.ch)), 18, 70);
    ev.forEach((e) => { e.cy = e.up ? lineY - 40 - stem - e.ch : lineY + 40 + stem; });
    return { ev, n, lineY, x0, x1, hasNotes };
  }
  function drawTimeline(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layTimeline(ctx, it, top));
    const { ev, n, lineY } = L;
    if (!n) { nothing(ctx); ctx.restore(); return; }
    const per = 0.55;
    const intro = 0.5 + n * per + 0.3;
    const F = focusOf(it, n, t, intro, 3);
    const appear = (i) => after(t, 0.5 + i * per, 0.5);
    // the line draws itself left to right, ending in an arrow (time goes on)
    const lp = clamp((t - 0.2) / (n * per + 0.3));
    const xa = 30; const xb = 770;
    line(ctx, xa, lineY, xa + (xb - xa) * lp, lineY, tint('muted', 0.55), 6);
    if (lp > 0.95) head(ctx, xb + 8, lineY, 0, 14, tint('muted', 0.8));
    // the "you are here" glow travels to the event in focus
    if (F.k >= 0 && t > intro - 0.4) {
      const [k] = F.shown;
      const e = ev[Math.max(0, k)];
      const g = 0.5 + 0.5 * Math.sin(t * 3);
      ctx.save(); ctx.globalAlpha *= after(t, intro - 0.4);
      ctx.strokeStyle = tint(e.c, 0.85); ctx.lineWidth = 6; line(ctx, xa, lineY, e.x, lineY, tint(e.c, 0.85), 6);
      dot(ctx, e.x, lineY, 20 + g * 4, tint(e.c, 0.2));
      ctx.restore();
    }
    ev.forEach((e, i) => {
      const p = appear(i);
      if (p <= 0.01) return;
      const em = F.e(i);
      ctx.save(); ctx.globalAlpha *= p * F.dim(i);
      // node and stem
      const sy0 = e.up ? lineY - 16 : lineY + 16; const sy1 = e.up ? e.cy + e.ch : e.cy;
      line(ctx, e.x, sy0, e.x + (e.cx - e.x) * 0, sy0 + (sy1 - sy0) * p, tint(e.c, 0.6 + 0.4 * em), 3);
      dot(ctx, e.x, lineY, 13 + 3 * em, e.c, em > 0.3 ? 14 * em : 0); dot(ctx, e.x, lineY, 5, DARK);
      // the date on the other side of the line
      if (e.when) {
        const wy = e.up ? lineY + 34 : lineY - 34;
        text(ctx, e.when, e.x, wy, e.wfit.w + 2, { size: e.wfit.size, weight: 800, fill: em > 0.5 ? e.c : 'muted', min: 15 });
      }
      // the card
      ctx.translate(0, (1 - p) * (e.up ? 14 : -14));
      card(ctx, e.cx - e.cw / 2, e.cy, e.cw, e.ch, e.c, em, 16);
      let y = e.cy + 10;
      if (e.ir) { if (e.icon) drawIcon(ctx, e.icon, e.cx, y + e.ir, e.ir * 2 * (1 + 0.08 * em), t); else dot(ctx, e.cx, y + e.ir, 6, tint(e.c, 0.6)); y += e.ir * 2 + 6; }
      text(ctx, e.label, e.cx, y + e.fit.h / 2 + 2, e.cw - 16, { size: e.fit.size, weight: 700, lines: 2, min: 18, fill: em > 0.5 ? e.c : 'ink' });
      ctx.restore();
      hit(b, askOf(e, e.label), e.cx - e.cw / 2, e.cy, e.cw, e.ch);
    });
    if (L.hasNotes && F.k >= 0) {
      const [k, a] = F.shown;
      const e = ev[Math.max(0, k)];
      if (e && e.note) caption(ctx, e.when ? `${e.when}: ${e.note}` : e.note, 612, 'ink', a * after(t, intro - 0.4));
    }
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-sort: sorting things into groups ───────────────────────────────
  // The items wait in a mixed-up pile, then fly one at a time into their
  // labelled bins; the bins then take turns to light up.
  function laySort(ctx, it, top) {
    const groups = arr(it.groups, 4).map((g0, i) => {
      const g = obj(g0);
      return { label: str(g.label ?? g.title, `Group ${i + 1}`), icon: str(g.icon), ask: g.ask, c: hueOf(g.color, [0, 4, 2, 5][i]), items: arr(g.items, 5).map((x) => str(x)).filter(Boolean) };
    });
    const ng = groups.length;
    const question = str(it.question);
    // every item, in a fixed mixed-up order that takes turns between groups
    const items = [];
    const most = Math.max(0, ...groups.map((g) => g.items.length));
    for (let j = 0; j < most; j++) for (let gi = 0; gi < ng; gi++) { const k = (gi + j) % ng; const g = groups[k]; if (j < g.items.length) items.push({ text: g.items[j], g: k, slot: j }); }
    const qy = top + 18;
    const pileTop = question ? qy + 36 : top + 10;
    // in the bins every chip has one letter size: one line if it stays
    // readable in the narrowest bin, else two lines
    const bw0 = ng ? (740 - 18 * (ng - 1)) / ng : 740; const bAvail = bw0 - 16 - 20;
    const B = { size: 20, lines: 1, h: 38 };
    const one = items.map((m) => measure(ctx, m.text, bAvail, 20, 600, 1, 17));
    if (one.every((f) => !f.lines[0].endsWith('…'))) { B.size = Math.min(20, ...one.map((f) => f.size)); B.h = B.size + 20; } else {
      B.lines = 2; B.size = Math.min(19, ...items.map((m) => measure(ctx, m.text, bAvail, 19, 600, 2, 15).size)); B.h = Math.round(B.size * 1.22 * 2 + 14);
    }
    // the pile: chips flowing in rows; chips shrink until pile and bins fit
    let chipH = 40; let fs = 20; let rows = [[]];
    const layPile = () => {
      let x = 0; let row = 0; rows = [[]];
      for (const m of items) { m.w = Math.min(250, measure(ctx, m.text, 230, fs, 600, 1, Math.min(fs, 13)).w + chipH * 0.7); if (x + m.w > 740 && rows[row].length) { row++; rows.push([]); x = 0; } rows[row].push(m); m.row = row; x += m.w + 12; }
    };
    for (const h of [40, 37, 34, 31, 28]) {
      chipH = h; fs = Math.round(h * 0.5); layPile();
      if (rows.length * (chipH + 8) + 22 + 70 + most * (B.h + 6) + 8 <= BOTTOM - pileTop) break;
    }
    rows.forEach((r) => { const tw = r.reduce((a, m) => a + m.w, 0) + 12 * (r.length - 1); let xx = MX - tw / 2; for (const m of r) { m.px = xx + m.w / 2; xx += m.w + 12; } });
    items.forEach((m, i) => { m.py = pileTop + chipH / 2 + m.row * (chipH + 8) + (rnd(i) - 0.5) * 4; m.rot = (rnd(i + 7) - 0.5) * 0.12; });
    const pileBottom = pileTop + rows.length * (chipH + 8);
    // the bins along the bottom
    const gap = 18; const bw = ng ? (740 - gap * (ng - 1)) / ng : 0;
    const binTop = clamp(pileBottom + 22, pileBottom + 16, BOTTOM - 120);
    groups.forEach((g, i) => { g.x = 30 + i * (bw + gap); g.w = bw; g.y = binTop; g.h = BOTTOM - binTop; g.fit = measure(ctx, g.label, bw - (g.icon ? 66 : 24), 22, 800, 2, 16); });
    const pitch = Math.min(B.h + 6, (BOTTOM - binTop - 70) / Math.max(1, most));
    if (pitch < B.h + 6) { B.h = Math.max(24, pitch - 6); B.size = Math.max(12, Math.min(B.size, Math.floor((B.h - 10) / (1.22 * B.lines)))); }
    items.forEach((m) => { const g = groups[m.g]; m.tx = g.x + g.w / 2; m.ty = g.y + 68 + pitch / 2 + m.slot * pitch; m.tw = Math.min(measure(ctx, m.text, bAvail, B.size, 600, B.lines, Math.min(B.size, 15)).w + 30, g.w - 16); });
    const tray = { x: 30, y: pileTop - 8, w: 740, h: pileBottom - pileTop + 8 };
    return { groups, ng, items, question, qy, chipH, fs, tray, B };
  }
  function drawSort(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = laySort(ctx, it, top));
    const { groups, ng, items, chipH } = L;
    if (!ng) { nothing(ctx); ctx.restore(); return; }
    if (L.question) {
      ctx.save(); ctx.globalAlpha *= after(t, 0.1, 0.5);
      text(ctx, L.question, MX, L.qy, 720, { size: 24, weight: 600, fill: 'yellow', min: 18 });
      ctx.restore();
    }
    const fly0 = 1.2; const per = clamp(9 / Math.max(1, items.length), 0.55, 0.85);
    const intro = fly0 + items.length * per + 0.4;
    const F = focusOf(it, ng, t, intro, 3);
    // the tray the mixed-up things wait in
    if (items.length) {
      const tr = L.tray;
      ctx.save(); ctx.globalAlpha *= after(t, 0.2, 0.5);
      ctx.fillStyle = 'rgba(255,255,255,0.025)'; box(ctx, tr.x, tr.y, tr.w, tr.h, 18); ctx.fill();
      ctx.setLineDash([8, 8]); ctx.strokeStyle = tint('muted', 0.35); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
      const fin = after(t, fly0 + (items.length - 1) * per + 0.8, 0.6);
      if (fin > 0) { ctx.globalAlpha *= fin; drawIcon(ctx, 'star', MX - 92, tr.y + tr.h / 2, 34, t); text(ctx, 'All sorted!', MX + 18, tr.y + tr.h / 2, 300, { size: 26, weight: 800, fill: 'green' }); }
      ctx.restore();
    }
    // the bins
    groups.forEach((g, i) => {
      const p = after(t, 0.3 + i * 0.12, 0.5);
      if (p <= 0) return;
      const e = F.e(i);
      ctx.save(); ctx.globalAlpha *= p * F.dim(i); ctx.translate(0, (1 - p) * 30);
      // an open box: back, sides, and a front lip
      if (e > 0.05) glow(ctx, color(g.c), 18 * e);
      ctx.fillStyle = tint(g.c, 0.08 + 0.08 * e); box(ctx, g.x, g.y, g.w, g.h, 18); ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = tint(g.c, 0.5 + 0.45 * e); ctx.lineWidth = 2.5 + e; ctx.stroke();
      ctx.fillStyle = tint(g.c, 0.22 + 0.2 * e); box(ctx, g.x, g.y, g.w, 60, 18); ctx.fill();
      const gx = g.x + g.w / 2;
      if (g.icon) {
        const tw = g.fit.w; const x0 = gx - (tw + 46) / 2; // icon then the name, centred together
        drawIcon(ctx, g.icon, x0 + 18, g.y + 30, 38 * (1 + 0.1 * e), t);
        text(ctx, g.label, x0 + 46 + tw / 2, g.y + 31, tw + 2, { size: g.fit.size, weight: 800, lines: 2, fill: e > 0.5 ? WHITE : g.c, min: 16 });
      } else text(ctx, g.label, gx, g.y + 31, g.w - 24, { size: g.fit.size, weight: 800, lines: 2, fill: e > 0.5 ? WHITE : g.c, min: 16 });
      ctx.restore();
      hit(b, askOf(g, g.label), g.x, g.y, g.w, 64);
    });
    // the items: waiting, flying (an arc), landed
    items.forEach((m, i) => {
      const t0 = fly0 + i * per;
      const show = after(t, 0.3 + i * 0.05, 0.4);
      if (show <= 0) return;
      const q = smooth((t - t0) / 0.7);
      const lift = Math.sin(q * PI) * 70;
      const x = lerp(m.px, m.tx, q); const y = lerp(m.py, m.ty, q) - lift;
      const w = lerp(m.w, m.tw, q);
      const g = groups[m.g];
      const e = q >= 1 ? F.e(m.g) : 0;
      const wob = q <= 0 ? Math.sin(t * 2 + i) * 1.5 : 0;
      ctx.save(); ctx.globalAlpha *= show * (q >= 1 ? 0.75 + 0.25 * F.dim(m.g) : 1);
      ctx.translate(x, y + wob); ctx.rotate(m.rot * (1 - q));
      if (q > 0 && q < 1) glow(ctx, color(g.c), 12);
      const hh = lerp(chipH, L.B.h, q);
      ctx.fillStyle = q > 0 ? 'rgba(10,16,40,0.95)' : 'rgba(16,22,48,0.95)'; box(ctx, -w / 2, -hh / 2, w, hh, Math.min(hh / 2, 22)); ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = q > 0 ? tint(g.c, 0.6 + 0.4 * e) : tint('muted', 0.55); ctx.lineWidth = 2; ctx.stroke();
      if (q < 0.5) text(ctx, m.text, 0, 1, w - chipH * 0.5, { size: L.fs, weight: 600, fill: 'ink', min: Math.min(L.fs, 13) });
      else text(ctx, m.text, 0, 1, w - 20, { size: L.B.size, weight: 600, lines: L.B.lines, fill: e > 0.5 ? g.c : 'ink', min: Math.min(L.B.size, 14) });
      ctx.restore();
      if (q >= 1) hit(b, `Why does ${m.text} go in ${g.label}?`, m.tx - m.tw / 2, m.ty - L.B.h / 2, m.tw, L.B.h);
    });
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-feelings: a feelings thermometer ───────────────────────────────
  // Zones stack up a thermometer, calm at the bottom; each has its face, its
  // name and a short note. The level rises to the zone named by `level` (or
  // walks gently up and down), and tool cards along the bottom show what
  // helps.
  const ZONE_RAMP = { 1: ['green'], 2: ['green', 'red'], 3: ['green', 'yellow', 'red'], 4: ['green', 'yellow', 'orange', 'red'], 5: ['teal', 'green', 'yellow', 'orange', 'red'] };
  function layFeelings(ctx, it, top) {
    const raw = arr(it.zones, 5);
    const n = raw.length;
    const ramp = ZONE_RAMP[n] || ['green'];
    const zones = raw.map((z0, i) => {
      const z = obj(z0);
      const mood = moodOf(z.mood, ['calm', 'worried', 'angry', 'scared', 'frustrated'][i] || 'calm');
      const c = typeof z.color === 'string' && (COLORS[z.color.trim()] || /^#[0-9a-f]{6}$/i.test(z.color.trim())) ? z.color.trim() : ramp[i] || 'green';
      return { label: str(z.label ?? z.title, MOOD_WORD[mood]), mood, note: str(z.note ?? z.text), ask: z.ask, c };
    });
    const tools = arr(it.tools, 4).map((x0, i) => { const x = obj(x0); return { label: str(x.label, `Tool ${i + 1}`), icon: str(x.icon), ask: x.ask, c: HUE6[(i + 1) % 6] }; });
    const lv = integer(it.level);
    const level = lv !== null && lv >= 0 && lv < n ? lv : null;
    const toolH = tools.length ? 112 : 0;
    const y0 = top + 12; const y1 = BOTTOM - toolH - (tools.length ? 14 : 0) - 78; // tube top and bottom (the bulb hangs below)
    const zh = (y1 - y0) / Math.max(1, n);
    zones.forEach((z, i) => {
      z.y1 = y1 - zh * i; z.y0 = z.y1 - zh; z.cy = (z.y0 + z.y1) / 2; // bottom up
      z.fit = measure(ctx, z.label, 440, zh > 90 ? 30 : 26, 800, 1, 18);
      z.nfit = z.note && zh >= 66 ? measure(ctx, z.note, 450, 19, 500, zh >= 96 ? 2 : 1, 16) : null;
    });
    const tw = tools.length ? Math.min(220, (740 - 14 * (tools.length - 1)) / tools.length) : 0;
    const tx0 = MX - (tw * tools.length + 14 * (tools.length - 1)) / 2;
    tools.forEach((x, i) => { x.x = tx0 + i * (tw + 14); x.w = tw; x.y = BOTTOM - toolH + 26; x.h = toolH - 26; x.fit = measure(ctx, x.label, tw - 74, 20, 700, 2, 16); });
    return { zones, n, tools, level, y0, y1, zh, toolTop: BOTTOM - toolH };
  }
  function drawFeelings(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layFeelings(ctx, it, top));
    const { zones, n, tools, y0, y1 } = L;
    if (!n) { nothing(ctx); ctx.restore(); return; }
    const intro = 0.4 + n * 0.25 + 0.6;
    const fixed = integer(it.focus);
    const hasF = fixed !== null && fixed >= 0 && fixed < n;
    // where the level sits: focus, else level, else a slow walk up and down
    const walkZ = () => { const u = Math.max(0, t - intro) / 3; const k = Math.floor(u) % (2 * n - 2 || 1); return n === 1 ? 0 : k < n ? k : 2 * n - 2 - k; };
    const target = hasF ? fixed : L.level !== null ? L.level : walkZ();
    const F = hasF || L.level !== null ? { e: (i) => (i === target ? 1 : 0), dim: (i) => (i === target ? 1 : 0.6) } : { e: (i) => (i === target ? 1 : 0), dim: (i) => (i === target ? 1 : 0.75) };
    // the mercury height eases towards its target zone's middle
    const tube = { x: 92, w: 52 };
    const fillTo = (k) => zones[k].cy;
    const rise = smooth((t - 0.6) / 1.6);
    let my;
    if (hasF || L.level !== null) my = lerp(y1 + 30, fillTo(target), rise);
    else {
      const u = Math.max(0, t - intro) / 3; const k0 = walkZ(); const fr = u - Math.floor(u);
      const prev = n === 1 ? 0 : (() => { const kk = (Math.floor(u) - 1 + (2 * n - 2)) % (2 * n - 2); return kk < n ? kk : 2 * n - 2 - kk; })();
      my = t < intro ? lerp(y1 + 30, fillTo(0), rise) : lerp(fillTo(prev), fillTo(k0), smooth(fr / 0.5));
    }
    my += Math.sin(t * 2) * 2;
    // tube with the zone colours behind glass
    const bx = tube.x + tube.w / 2; const by = y1 + 40; const br = 40;
    ctx.save(); ctx.globalAlpha *= after(t, 0.1, 0.5);
    zones.forEach((z, i) => { ctx.fillStyle = tint(z.c, 0.16 + 0.12 * F.e(i)); ctx.fillRect(tube.x, z.y0, tube.w, z.y1 - z.y0); });
    // mercury
    const mc = zones[target].c;
    ctx.save(); box(ctx, tube.x + 8, y0 + 6, tube.w - 16, by - y0, (tube.w - 16) / 2); ctx.clip();
    const grd = ctx.createLinearGradient(0, y1, 0, y0);
    zones.forEach((z, i) => { grd.addColorStop(clamp(i / Math.max(1, n)), color(z.c)); grd.addColorStop(clamp((i + 1) / Math.max(1, n) - 0.001), color(z.c)); });
    ctx.fillStyle = grd; ctx.fillRect(tube.x, my, tube.w, by - my);
    ctx.restore();
    ctx.strokeStyle = tint(WHITE, 0.6); ctx.lineWidth = 3; box(ctx, tube.x, y0 - 10, tube.w, by - y0, tube.w / 2); ctx.stroke();
    dot(ctx, bx, by, br, DARK); dot(ctx, bx, by, br - 7, zones[0].c); ctx.strokeStyle = tint(WHITE, 0.6); ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ell(ctx, bx - 12, by - 12, 8, 5, -0.6); ctx.fill();
    // tick marks between zones
    for (let i = 1; i < n; i++) line(ctx, tube.x + tube.w, zones[i].y1, tube.x + tube.w + 14, zones[i].y1, tint(WHITE, 0.5), 2);
    // the pointer at the level
    head(ctx, tube.x + tube.w + 24 + Math.sin(t * 3) * 2, my, PI, 14, mc);
    ctx.restore();
    // zone rows: face, name, note
    zones.forEach((z, i) => {
      const p = after(t, 0.4 + i * 0.25, 0.5);
      if (p <= 0) return;
      const e = F.e(i);
      ctx.save(); ctx.globalAlpha *= p * F.dim(i); ctx.translate((1 - p) * 30, 0);
      const rx = 186; const rw = 594; const rh = Math.min(L.zh - 10, 140);
      card(ctx, rx, z.cy - rh / 2, rw, rh, z.c, e, 18, 0.06);
      const fr = Math.min(rh * 0.36, 44) * (1 + 0.1 * e);
      face(ctx, z.mood, rx + 20 + fr, z.cy, fr * 2.2, t, { skin: z.c, glowC: e > 0.5 ? z.c : null });
      const tx = rx + 40 + fr * 2;
      const ly = z.nfit ? z.cy - z.nfit.h / 2 - 2 : z.cy;
      text(ctx, z.label, tx, ly, rw - (tx - rx) - 16, { size: z.fit.size, weight: 800, align: 'left', fill: e > 0.5 ? z.c : 'ink', min: 18 });
      if (z.nfit) text(ctx, z.note, tx, z.cy + z.fit.h / 2 + 2, rw - (tx - rx) - 16, { size: 19, weight: 500, align: 'left', lines: L.zh >= 96 ? 2 : 1, fill: e > 0.5 ? 'ink' : 'muted', min: 16 });
      ctx.restore();
      hit(b, askOf(z, z.label), rx, z.cy - rh / 2, rw, rh);
    });
    // the tools that help
    if (tools.length) {
      ctx.save(); ctx.globalAlpha *= after(t, intro - 0.3, 0.5);
      text(ctx, 'Things that help', MX, L.toolTop + 10, 400, { size: 18, weight: 700, fill: 'muted' });
      ctx.restore();
      tools.forEach((x, i) => {
        const p = after(t, intro - 0.2 + i * 0.25, 0.5);
        if (p <= 0) return;
        const e = target >= Math.ceil(n / 2) && n > 1 ? 0.35 + 0.35 * Math.max(0, Math.sin(t * 1.8 - i * 0.9)) : 0;
        ctx.save(); ctx.globalAlpha *= p; ctx.translate(0, (1 - p) * 20);
        card(ctx, x.x, x.y, x.w, x.h, x.c, e, 16, 0.06);
        drawIcon(ctx, x.icon, x.x + 36, x.y + x.h / 2, 46, t);
        text(ctx, x.label, x.x + 66 + (x.w - 74) / 2, x.y + x.h / 2, x.w - 74, { size: x.fit.size, weight: 700, lines: 2, min: 16, fill: 'ink' });
        ctx.restore();
        hit(b, askOf(x, x.label), x.x, x.y, x.w, x.h);
      });
    }
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-story: a social story in comic panels ──────────────────────────
  // The same child in every panel, its face showing the mood; the thing the
  // panel is about beside it; the label under the scene. The panel in focus
  // tells its line in a speech strip along the bottom.
  function layStory(ctx, it, top) {
    const who = str(it.who).slice(0, 14);
    let lastMood = 'calm';
    const panels = arr(it.panels, 6).map((p0, i) => {
      const p = obj(p0);
      const mood = moodOf(p.mood, null) || lastMood; lastMood = mood;
      return { label: str(p.label ?? p.title, `Part ${i + 1}`), note: str(p.note ?? p.text ?? p.say), icon: str(p.icon), mood, ask: p.ask, c: MOOD_HUE[mood] || 'blue' };
    });
    const n = panels.length;
    const cols = n <= 3 ? Math.max(1, n) : n === 4 ? 2 : 3;
    const rows = Math.ceil(n / cols) || 1;
    const stripH = 76;
    const y0 = top + 4; const y1 = BOTTOM - stripH - 10;
    const gap = 16;
    const pw = (740 - gap * (cols - 1)) / cols; const ph = Math.min((y1 - y0 - gap * (rows - 1)) / rows, pw * 1.3);
    const gy0 = y0 + (y1 - y0 - (ph * rows + gap * (rows - 1))) / 2; // the grid, centred
    panels.forEach((p, i) => {
      const r = Math.floor(i / cols); const c = i % cols;
      const inRow = r === rows - 1 ? n - r * cols : cols; // centre a short last row
      const rx = MX - (inRow * pw + (inRow - 1) * gap) / 2;
      p.x = rx + c * (pw + gap); p.y = gy0 + r * (ph + gap); p.w = pw; p.h = ph;
      p.fit = measure(ctx, p.label, pw - 56, 22, 700, 1, 16);
    });
    return { who, panels, n, stripY: Math.min(BOTTOM - stripH / 2, gy0 + rows * ph + (rows - 1) * gap + 12 + stripH / 2), stripH };
  }
  function drawStory(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layStory(ctx, it, top));
    const { panels, n } = L;
    if (!n) { nothing(ctx); ctx.restore(); return; }
    const per = 0.6;
    const intro = 0.3 + n * per + 0.3;
    const F = focusOf(it, n, t, intro, 3.6);
    panels.forEach((p, i) => {
      const a = after(t, 0.3 + i * per, 0.55);
      if (a <= 0.01) return;
      const e = F.e(i);
      ctx.save(); ctx.globalAlpha *= a; // dimmed with a veil below, so the child never turns see-through
      const s = 0.94 + 0.06 * easeOut(a);
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2); ctx.scale(s, s); ctx.translate(-p.x - p.w / 2, -p.y - p.h / 2);
      // the frame: sky tinted by the mood, a floor
      if (e > 0.05) glow(ctx, color(p.c), 18 * e);
      ctx.fillStyle = '#0c1430'; box(ctx, p.x, p.y, p.w, p.h, 16); ctx.fill(); ctx.shadowBlur = 0;
      ctx.save(); box(ctx, p.x, p.y, p.w, p.h, 16); ctx.clip();
      const sky = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
      sky.addColorStop(0, tint(p.c, 0.22)); sky.addColorStop(1, tint(p.c, 0.04));
      ctx.fillStyle = sky; ctx.fillRect(p.x, p.y, p.w, p.h);
      const labH = 44; const floor = p.y + p.h - labH - 6;
      ctx.fillStyle = tint(p.c, 0.12); ctx.fillRect(p.x, floor - 4, p.w, labH + 10);
      // the scene: child and the thing
      const sceneH = floor - p.y - 12;
      const ch = clamp(Math.min(sceneH - 30, p.w * 0.9), 30, 220);
      const hasIcon = !!p.icon;
      const cx = hasIcon ? p.x + p.w * 0.34 : p.x + p.w / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(ctx, cx, floor - 2, ch * 0.22, ch * 0.04); ctx.fill();
      child(ctx, cx, floor - 2, ch, p.mood, t + i * 0.7, 'blue');
      if (hasIcon) {
        const is = clamp(Math.min(p.w * 0.36, sceneH * 0.5), 24, 120);
        const ix = p.x + p.w * 0.76; const iy = floor - is * 0.5 - 6 - Math.sin(t * 1.5 + i) * 2;
        drawIcon(ctx, p.icon, ix, iy, is * (1 + 0.06 * e), t);
      }
      // the mood word, top right
      ctx.save(); ctx.globalAlpha *= 0.85 + 0.15 * e;
      const mw = MOOD_WORD[p.mood] || p.mood;
      ctx.font = `700 15px ${FONT}`; const mww = ctx.measureText(mw).width + 20;
      ctx.fillStyle = tint(p.c, 0.85); box(ctx, p.x + p.w - mww - 8, p.y + 8, mww, 24, 12); ctx.fill();
      label(ctx, mw, p.x + p.w - mww / 2 - 8, p.y + 21, { size: 15, weight: 700, fill: DARK });
      ctx.restore();
      const veil = 1 - F.dim(i);
      if (veil > 0.01) { ctx.fillStyle = `rgba(6,9,24,${(veil * 0.85).toFixed(3)})`; ctx.fillRect(p.x, p.y, p.w, p.h); }
      ctx.restore(); // clip
      ctx.strokeStyle = tint(p.c, 0.5 + 0.45 * e); ctx.lineWidth = 2.5 + e; box(ctx, p.x, p.y, p.w, p.h, 16); ctx.stroke();
      // number and label
      dot(ctx, p.x + 24, floor + labH / 2 + 2, 14, p.c); label(ctx, String(i + 1), p.x + 24, floor + labH / 2 + 3, { size: 16, weight: 800, fill: DARK });
      text(ctx, p.label, p.x + 44 + (p.w - 56) / 2, floor + labH / 2 + 2, p.w - 56, { size: p.fit.size, weight: 700, fill: e > 0.5 ? WHITE : F.dim(i) < 0.9 ? 'muted' : 'ink', min: 16 });
      ctx.restore();
      hit(b, askOf(p, p.label), p.x, p.y, p.w, p.h);
    });
    // the speech strip: the panel's face and its line
    if (F.k >= 0) {
      const [k, a0] = F.shown;
      const p = panels[Math.max(0, k)];
      const a = a0 * after(t, intro - 0.5, 0.5);
      if (a > 0.01) {
        const sy = L.stripY; const sh = L.stripH - 8;
        ctx.save(); ctx.globalAlpha *= a;
        card(ctx, 30, sy - sh / 2, 740, sh, p.c, 0.3, 20, 0.08);
        face(ctx, p.mood, 72, sy, 52, t, { skin: SKIN });
        const who = L.who;
        const line1 = p.note || (who ? `${who} feels ${p.mood}.` : `I feel ${p.mood}.`);
        const lead = p.note && who ? `${who}: ` : '';
        text(ctx, `${lead}${line1}`, 112 + 320, sy, 640, { size: 22, weight: 600, lines: 2, min: 18, fill: 'ink' });
        ctx.restore();
        hit(b, p.note ? askOf(p, p.label) : `Why does ${who || 'the child'} feel ${p.mood}?`, 30, sy - sh / 2, 740, sh);
      }
    }
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-word: a word in sounds, syllables or parts, then blended ───────
  // Big letter tiles, one per part, with wide letter spacing. In turn each
  // part lights up (a sound button, a clap, or its job in the word), then a
  // swoosh runs under them and the whole word appears, its parts still in
  // their colours.
  const PREFIXES = 'un re pre dis mis non in im il ir sub super over under mid inter trans de anti bi tri co ex en em out up fore semi auto micro'.split(' ');
  const SUFFIXES = 's es ed ing er est ly ful less ness ment able ible tion sion ation y ish ous ive al ist ity ise ize en ship hood ward wards'.split(' ');
  function layWord(ctx, it, top) {
    let mode = str(it.mode, 'sounds').toLowerCase();
    if (!['sounds', 'syllables', 'build'].includes(mode)) mode = /syll|clap|beat/.test(mode) ? 'syllables' : /build|morph|prefix|suffix|part/.test(mode) ? 'build' : 'sounds';
    const raw = arr(it.parts, 7).map((p) => str(p)).filter(Boolean);
    let word = str(it.word).replace(/\s+/g, '');
    let parts = raw.map((p) => ({ raw: p, s: p.replace(/-/g, '') })).filter((p) => p.s);
    if (!word) word = parts.map((p) => p.s).join('');
    word = word.slice(0, 16);
    if (word && parts.map((p) => p.s).join('').toLowerCase() !== word.toLowerCase()) {
      // parts that do not spell the word: trust the word, one chunk per letter for sounds
      parts = (mode === 'sounds' && word.length <= 7 ? [...word] : [word]).map((s) => ({ raw: s, s }));
    }
    parts = parts.slice(0, 7);
    const n = parts.length;
    // the job of each part when building: affixes from hyphens ("un-",
    // "-ly") or from the common lists; a split-e; a contraction; otherwise
    // the root (or, for a compound like sun + flower, each one a word)
    if (mode === 'build') {
      parts.forEach((p) => { p.role = /-$/.test(p.raw) ? 'prefix' : /^-/.test(p.raw) ? 'suffix' : null; });
      if (!parts.some((p) => p.role)) {
        let i0 = 0; let i1 = n - 1;
        while (i0 < i1 && PREFIXES.includes(parts[i0].s.toLowerCase())) { parts[i0].role = 'prefix'; i0++; }
        while (i1 > i0 && SUFFIXES.includes(parts[i1].s.toLowerCase())) { parts[i1].role = 'suffix'; i1--; }
      }
      parts.forEach((p, i) => {
        if (p.role) return;
        if (p.s.includes("'")) p.role = 'short for';
        else if (i === n - 1 && i > 0 && p.s.toLowerCase() === 'e') p.role = 'magic e';
      });
      const roots = parts.filter((p) => !p.role);
      roots.forEach((p, k) => { p.role = roots.length > 1 ? 'word' : 'root'; p.k = k; });
    }
    const ROLE_HUE = { prefix: 'purple', root: 'blue', suffix: 'orange', 'magic e': 'green', 'short for': 'yellow' };
    parts.forEach((p, i) => { p.c = mode === 'build' ? (p.role === 'word' ? ['blue', 'teal', 'cyan'][p.k % 3] : ROLE_HUE[p.role]) : ['cyan', 'orange', 'green', 'purple'][i % (mode === 'sounds' ? 3 : 4)]; });
    // letter size that fits the row of split tiles, with letter spacing
    const track = 0.1;
    const wOf = (s, size) => { ctx.font = `600 ${size}px ${FONT}`; let w = 0; for (const ch of s) w += ctx.measureText(ch).width + size * track; return w - size * track; };
    let size = 96;
    for (; size > 30; size -= 2) {
      const pad = size * 0.32; const gap = size * 0.34;
      const tot = parts.reduce((a, p) => a + wOf(p.s, size) + pad * 2, 0) + gap * Math.max(0, n - 1);
      const whole = wOf(word, size) + pad * 2;
      if (tot <= 740 && whole <= 740) break;
    }
    const pad = size * 0.32; const gap = size * 0.34; const th = size * 1.36;
    const icon = str(it.icon);
    const note = str(it.note);
    // the whole picture (split tiles, marks, swoosh, the word) centred in the space
    const dSw = mode === 'build' ? 44 : 36;
    const blockH = 2 * th + 54 + dSw;
    const areaTop = icon ? top + 122 : top + 12; const areaBot = note ? 588 : 640;
    const rowY = areaTop + Math.max(0, (areaBot - areaTop - blockH) / 2) + th / 2;
    let x = MX - (parts.reduce((a, p) => a + wOf(p.s, size) + pad * 2, 0) + gap * Math.max(0, n - 1)) / 2;
    parts.forEach((p) => { p.tw = wOf(p.s, size); p.w = p.tw + pad * 2; p.x = x; x += p.w + gap; });
    const markY = rowY + th / 2 + 28;
    const swY = markY + dSw;
    const wordW = wOf(word, size) + pad * 2;
    const wordY = Math.min(swY + 26 + th / 2, (note ? 586 : 630) - th / 2);
    return { mode, word, parts, n, size, pad, th, track, icon, note, rowY, markY, swY, wordY, wordW, wOf };
  }
  // Letters with wide spacing, left aligned at x, each part in its colour.
  function letters(ctx, s, x, y, size, track, fill) {
    ctx.font = `600 ${size}px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = color(fill);
    for (const ch of s) { ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + size * track; }
    return x - size * track;
  }
  function drawWord(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layWord(ctx, it, top));
    const { parts, n, size, pad, th, track, mode } = L;
    if (!n || !L.word) { nothing(ctx); ctx.restore(); return; }
    const intro = 0.4 + n * 0.18 + 0.4;
    const per = mode === 'syllables' ? 0.9 : 1.05;
    const swoosh = 1.4; const rest = 3.2;
    const cyc = n * per + swoosh + rest;
    const u = mod(Math.max(0, t - intro), cyc);
    const lit = t < intro ? -1 : u < n * per ? Math.floor(u / per) : -1;
    const litFr = lit >= 0 ? (u - lit * per) / per : 0;
    const swP = t < intro ? 0 : clamp((u - n * per) / swoosh);
    const fixed = integer(it.focus);
    const hasF = fixed !== null && fixed >= 0 && fixed < n;
    // how lit each part is: a fixed focus, its turn, or the swoosh passing it
    const ePart = (i, p) => {
      if (hasF) return i === fixed ? 1 : 0;
      let e = i === lit ? Math.sin(clamp(litFr / 0.85) * PI) ** 0.6 : 0;
      if (swP > 0 && swP < 1) { const cx = (p.x + p.w / 2 - parts[0].x) / Math.max(1, parts[n - 1].x + parts[n - 1].w - parts[0].x); e = Math.max(e, clamp(1 - Math.abs(swP * 1.1 - 0.05 - cx) * 5)); }
      return e;
    };
    // the picture
    if (L.icon) {
      const a = after(t, 0.2, 0.6);
      ctx.save(); ctx.globalAlpha *= a;
      dot(ctx, MX, top + 58, 56, tint('yellow', 0.08));
      drawIcon(ctx, L.icon, MX, top + 58 + Math.sin(t * 1.4) * 2, 96, t);
      ctx.restore();
      hit(b, `What does "${L.word}" mean?`, MX - 56, top + 2, 112, 112);
    }
    // split tiles
    parts.forEach((p, i) => {
      const a = after(t, 0.3 + i * 0.18, 0.5);
      if (a <= 0) return;
      const e = ePart(i, p);
      const lift = -10 * e;
      ctx.save(); ctx.globalAlpha *= a * (hasF && i !== fixed ? 0.6 : 1); ctx.translate(0, (1 - a) * 20 + lift);
      card(ctx, p.x, L.rowY - th / 2, p.w, th, p.c, e, Math.min(22, th * 0.2), 0.1);
      letters(ctx, p.s, p.x + pad, L.rowY + size * 0.04, size, track, e > 0.4 ? p.c : 'ink');
      ctx.restore();
      // the marker under it
      const mx = p.x + p.w / 2; const my = L.markY;
      ctx.save(); ctx.globalAlpha *= a;
      if (mode === 'sounds') {
        const c = e > 0.3 ? p.c : tint(p.c, 0.55);
        if (p.s.length > 1) { const half = Math.max(p.tw / 2 - 4, 10); line(ctx, mx - half, my, mx + half, my, c, 9 + 3 * e); } else { dot(ctx, mx, my, 9 + 4 * e, c, e > 0.3 ? 14 * e : 0); }
      } else if (mode === 'syllables') {
        const r = 12 + 6 * e;
        dot(ctx, mx, my, r, e > 0.3 ? p.c : tint(p.c, 0.5), e > 0.3 ? 16 * e : 0);
        if (i === lit && !hasF) { ctx.save(); ctx.globalAlpha *= (1 - litFr) * 0.9; ctx.strokeStyle = color(p.c); ctx.lineWidth = 3; for (let k = 0; k < 6; k++) { const ang = (k / 6) * TAU - PI / 2; const r0 = 19 + litFr * 7; line(ctx, mx + Math.cos(ang) * r0, my + Math.sin(ang) * r0, mx + Math.cos(ang) * (r0 + 7), my + Math.sin(ang) * (r0 + 7), p.c, 3); } ctx.restore(); }
      } else {
        const f = measure(ctx, p.role, p.w + 30, 20, 700, 1, 14);
        ctx.fillStyle = tint(p.c, 0.2 + 0.5 * e); box(ctx, mx - f.w / 2 - 12, my - 15, f.w + 24, 30, 15); ctx.fill();
        text(ctx, p.role, mx, my + 1, p.w + 30, { size: 20, weight: 700, fill: e > 0.4 ? WHITE : p.c, min: 14 });
      }
      ctx.restore();
      const ask = mode === 'sounds' ? `How do you say the sound "${p.s}"?` : mode === 'syllables' ? `Tell me about the syllable "${p.s}"` : p.role === 'prefix' ? `What does the prefix "${p.s}" mean?` : p.role === 'suffix' ? `What does the suffix "${p.s}" do?` : p.role === 'magic e' ? 'What does the magic e do?' : p.role === 'short for' ? `What is "${p.s}" short for?` : p.role === 'word' ? `What does "${p.s}" mean?` : `What does the root word "${p.s}" mean?`;
      hit(b, ask, p.x, L.rowY - th / 2 - 10, p.w, th + 10 + (my - L.rowY - th / 2) + 16);
    });
    // the swoosh: an arrow sweeping under the parts
    const sx0 = parts[0].x + 6; const sx1 = parts[n - 1].x + parts[n - 1].w - 6;
    const sw = mkPath(quadPts(sx0, L.swY - 6, MX, L.swY + 14, sx1, L.swY - 6, 24));
    ctx.save(); ctx.globalAlpha *= after(t, intro - 0.3, 0.5);
    ctx.strokeStyle = tint('yellow', 0.25); ctx.lineWidth = 5; strokePath(ctx, sw);
    head(ctx, sx1 + 4, L.swY - 8, -0.35, 12, tint('yellow', 0.4));
    if (swP > 0 && swP < 1) {
      ctx.strokeStyle = color('yellow'); ctx.lineWidth = 6; glow(ctx, color('yellow'), 14); strokePath(ctx, sw, 0, sw.total * swP); ctx.shadowBlur = 0;
      const pt = at(sw, sw.total * swP); dot(ctx, pt.x, pt.y, 9, 'yellow', 14);
    }
    ctx.restore();
    // the whole word, once blended
    const wa = hasF ? after(t, intro, 0.6) : after(t, intro + n * per + swoosh * 0.7, 0.6);
    if (wa > 0) {
      const gl = hasF ? 0.3 : swP > 0.7 && swP < 1 ? 1 : u > n * per + swoosh ? Math.max(0, 1 - (u - n * per - swoosh) / 1.5) : 0;
      const wx = MX - L.wordW / 2;
      ctx.save(); ctx.globalAlpha *= wa; ctx.translate(MX, L.wordY); const sc = 0.9 + 0.1 * easeOut(wa) + 0.03 * gl; ctx.scale(sc, sc); ctx.translate(-MX, -L.wordY);
      card(ctx, wx, L.wordY - th / 2, L.wordW, th, 'yellow', gl, Math.min(24, th * 0.2), 0.06);
      let x = wx + pad;
      for (const p of parts) x = letters(ctx, p.s, x, L.wordY + size * 0.04, size, track, p.c) + size * track;
      ctx.restore();
      hit(b, `What does "${L.word}" mean?`, wx, L.wordY - th / 2, L.wordW, th);
    }
    if (L.note) caption(ctx, L.note, 618, 'ink', after(t, intro, 0.6));
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-count: counting with real manipulatives ────────────────────────
  // One kind at a time (ten frames, base-ten blocks, a number line, an
  // array, groups, fraction bars and pies, a clock), with the sum along the
  // top; its answer shows once the picture has worked it out.
  const ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(' ');
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function words(n) {
    n = Math.round(n);
    if (!Number.isFinite(n)) return '';
    if (n < 0) return `minus ${words(-n)}`;
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '');
    if (n < 1000) return `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ` and ${words(n % 100)}` : ''}`;
    return String(n);
  }
  const FRAC_NAME = ['', 'whole', 'half', 'third', 'quarter', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
  function fracWords(a, b) {
    if (b === 1) return a === 1 ? 'one whole' : `${words(a)} wholes`;
    const nm = FRAC_NAME[b] || `${b}th`;
    const pl = a === 1 ? nm : nm === 'half' ? 'halves' : `${nm}s`;
    return `${words(a)} ${pl}`;
  }
  function timeWords(h, m) {
    const hh = mod(h - 1, 12) + 1; const next = mod(hh, 12) + 1;
    if (m === 0) return `${words(hh)} o'clock`;
    if (m === 15) return `quarter past ${words(hh)}`;
    if (m === 30) return `half past ${words(hh)}`;
    if (m === 45) return `quarter to ${words(next)}`;
    const mins = (k) => (k % 5 === 0 ? words(k) : `${words(k)} minute${k === 1 ? '' : 's'}`);
    return m < 30 ? `${mins(m)} past ${words(hh)}` : `${mins(60 - m)} to ${words(next)}`;
  }
  const SIGNS = { '+': '+', '-': '-', '−': '-', '–': '-', '×': '×', x: '×', X: '×', '*': '×', '÷': '÷', '/': '÷', ':': '÷' };
  function layCount(ctx, it, top) {
    const kRaw = str(it.kind).toLowerCase().replace(/[\s_]+/g, '-');
    const kind = COUNT_KINDS.includes(kRaw) ? kRaw : kRaw.includes('pie') ? 'fraction-pie' : kRaw.includes('frac') ? 'fraction-bar' : kRaw.includes('line') ? 'number-line' : kRaw.includes('frame') ? 'ten-frame' : kRaw.includes('base') || kRaw.includes('block') ? 'base-ten' : kRaw.includes('clock') || kRaw.includes('time') ? 'clock' : kRaw.includes('array') ? 'array' : kRaw.includes('group') ? 'groups' : 'ten-frame';
    const sg = SIGNS[str(it.sign)] || SIGNS[str(it.op)] || null;
    const whole = (v, d) => { const x = num(v, NaN); return Number.isFinite(x) ? Math.round(x) : d; };
    let a = whole(it.a, 0); let bb = it.b === null || it.b === undefined ? null : whole(it.b, null);
    const c = obj(it.compare);
    const L = { kind, sign: sg, label: str(it.label), top, cy0: top + 92, cy1: BOTTOM - 46 };
    if (kind === 'ten-frame') {
      a = clamp(a, 0, 20);
      let b = bb === null ? 0 : clamp(bb, 0, 20);
      const sign = bb === null ? null : sg === '-' ? '-' : '+';
      if (sign === '+') b = Math.min(b, 20 - a); else if (sign === '-') b = Math.min(b, a);
      const r = sign === '-' ? a - b : a + b;
      Object.assign(L, { a, b, sign, r, frames: Math.max(a, r) > 10 ? 2 : 1, eq: sign ? `${a} ${sign === '-' ? '−' : '+'} ${b} = ` : '', ans: sign ? String(r) : String(a) });
    } else if (kind === 'base-ten') {
      a = clamp(a, 0, 999);
      let b = bb === null ? 0 : clamp(bb, 0, 999);
      const sign = bb === null ? null : sg === '-' ? '-' : '+';
      if (sign === '+') b = Math.min(b, 999 - a); else if (sign === '-') b = Math.min(b, a);
      const r = sign === '-' ? a - b : sign === '+' ? a + b : a;
      Object.assign(L, { a, b, sign, r, eq: sign ? `${a} ${sign === '-' ? '−' : '+'} ${b} = ` : '', ans: String(r) });
    } else if (kind === 'number-line') {
      a = clamp(a, -50, 100);
      let b = bb === null ? 0 : clamp(Math.abs(bb), 0, 50);
      const sign = bb === null ? null : sg === '-' ? '-' : '+';
      const dir = sign === '-' ? -1 : 1;
      b = Math.min(b, dir > 0 ? 100 - a : a + 50);
      const r = a + dir * b;
      const step = integer(it.step);
      let hops = [];
      if (b > 0) {
        if (step && step >= 1 && step <= 25 && Math.ceil(b / step) <= 25) { for (let left = b; left > 0; left -= step) hops.push(Math.min(step, left)); } else if (b <= 10) hops = Array(b).fill(1); else { for (let left = b; left > 0; left -= 10) hops.push(Math.min(10, left)); }
      }
      const lo = Math.min(a, r); const hi = Math.max(a, r);
      const span = hi - lo;
      const u = [1, 2, 5, 10, 20].find((x) => span / x <= 14) || 20;
      let L0 = Math.floor(lo / u) * u - u; let L1 = Math.ceil(hi / u) * u + u;
      if (lo >= 0 && L0 < 0) L0 = 0;
      while ((L1 - L0) / u < 10) { if (lo >= 0 && L0 - u < 0) L1 += u; else if ((L1 - hi) <= (lo - L0)) L1 += u; else L0 -= u; }
      const lx0 = 50; const lx1 = 750;
      const xOf = (v) => lx0 + ((v - L0) / Math.max(1, L1 - L0)) * (lx1 - lx0);
      Object.assign(L, { a, b, sign, dir, r, hops, u, L0, L1, xOf, eq: sign ? `${a} ${sign === '-' ? '−' : '+'} ${b} = ` : '', ans: sign ? String(r) : String(a) });
    } else if (kind === 'array') {
      a = clamp(a, 1, 10); const b = clamp(bb === null ? 1 : bb, 1, 12);
      Object.assign(L, { a, b, r: a * b, eq: `${a} × ${b} = `, ans: String(a * b) });
    } else if (kind === 'groups') {
      a = clamp(a, 1, 6); const b = clamp(bb === null ? 1 : bb, 1, 10);
      const share = sg === '÷';
      Object.assign(L, { a, b, share, r: a * b, eq: share ? `${a * b} ÷ ${a} = ` : `${a} × ${b} = `, ans: share ? String(b) : String(a * b) });
    } else if (kind === 'fraction-bar' || kind === 'fraction-pie') {
      const b = clamp(bb === null ? 1 : bb, 1, 12); a = clamp(a, 0, b);
      let cmp = null;
      if (it.compare !== null && it.compare !== undefined && typeof it.compare === 'object') {
        const cb = clamp(whole(c.b, 1), 1, 12); const ca = clamp(whole(c.a, 0), 0, cb);
        cmp = { a: ca, b: cb };
      }
      const rel = cmp ? (a * cmp.b > cmp.a * b ? '>' : a * cmp.b < cmp.a * b ? '<' : '=') : null;
      Object.assign(L, { a, b, cmp, rel, eq: '', ans: '' });
    } else if (kind === 'clock') {
      a = mod(a - 1, 12) + 1; const b = clamp(bb === null ? 0 : bb, 0, 59);
      Object.assign(L, { a, b, eq: '', ans: `${a}:${String(b).padStart(2, '0')}` });
    }
    return L;
  }
  // The sum along the top: its answer pops in at `done` (a 0..1 progress).
  function countHeader(ctx, L, t, done) {
    if (L.label) chip(ctx, L.label, 30, L.top + 30, 'muted', 18, 'left', 220);
    if (!L.eq) return;
    ctx.font = `700 46px ${FONT}`;
    const w1 = ctx.measureText(L.eq).width; const w2 = Math.max(ctx.measureText(L.ans).width, ctx.measureText('?').width);
    const x0 = MX - (w1 + w2) / 2; const y = L.top + 30;
    ctx.save(); ctx.globalAlpha *= after(t, 0.1, 0.5);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = color('ink'); ctx.fillText(L.eq, x0, y);
    if (done < 1) { ctx.fillStyle = color('muted'); ctx.fillText('?', x0 + w1, y); } else {
      const p = after(t, L.tDone, 0.5);
      ctx.save(); ctx.translate(x0 + w1 + w2 / 2, y); ctx.scale(0.7 + 0.3 * outBack(p), 0.7 + 0.3 * outBack(p));
      glow(ctx, color('yellow'), 14 * (1 - p) + 6); ctx.fillStyle = color('yellow'); ctx.textAlign = 'center'; ctx.fillText(L.ans, 0, 0); ctx.shadowBlur = 0;
      ctx.restore();
    }
    ctx.restore();
  }
  // A round counter, like a plastic one on a table.
  function counter(ctx, x, y, r, c, a = 1) {
    if (a <= 0 || r <= 0.5) return;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, x + r * 0.08, y + r * 0.14, r, r * 0.95); ctx.fill();
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, tint(WHITE, 0.95)); g.addColorStop(0.25, color(c)); g.addColorStop(1, tint(c, 0.75));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = tint(WHITE, 0.35); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  function drawTenFrame(b, ctx, L, t) {
    const cell = 84; const fw = cell * 5; const fh = cell * 2;
    const nf = L.frames; const gapF = 30;
    const totalH = nf * fh + (nf - 1) * gapF;
    const fx = MX - fw / 2; const fy0 = (L.cy0 + L.cy1 - 60) / 2 - totalH / 2;
    const slot = (i) => { const f = Math.floor(i / 10); const k = i % 10; return { x: fx + (k % 5 + 0.5) * cell, y: fy0 + f * (fh + gapF) + (Math.floor(k / 5) + 0.5) * cell }; };
    for (let f = 0; f < nf; f++) {
      const y = fy0 + f * (fh + gapF);
      ctx.save(); ctx.globalAlpha *= after(t, 0.1 + f * 0.15, 0.5);
      ctx.fillStyle = 'rgba(8,12,30,0.8)'; box(ctx, fx - 8, y - 8, fw + 16, fh + 16, 14); ctx.fill();
      ctx.strokeStyle = tint('blue', 0.7); ctx.lineWidth = 3; ctx.stroke();
      for (let i = 1; i < 5; i++) line(ctx, fx + i * cell, y, fx + i * cell, y + fh, tint('blue', 0.45), 2);
      line(ctx, fx, y + cell, fx + fw, y + cell, tint('blue', 0.45), 2);
      ctx.restore();
      hit(b, 'How does a ten frame work?', fx - 8, y - 8, fw + 16, fh + 16);
    }
    const per = 0.16; const tA = 0.5;
    const tB = tA + L.a * per + 0.7; const perB = 0.38;
    const nB = L.sign ? L.b : 0;
    const tEnd = (L.sign ? tB + nB * perB : tA + L.a * per) + 0.3;
    L.tDone = tEnd;
    let shown = 0;
    const r = cell * 0.36;
    for (let i = 0; i < L.a; i++) {
      const p = clamp((t - tA - i * per) / 0.4);
      if (p <= 0) continue;
      const s = slot(i);
      let y = s.y - (1 - easeOut(p)) * 60; let a = Math.min(1, p * 2);
      if (L.sign === '-' && i >= L.a - nB) {
        const j = L.a - 1 - i; const q = clamp((t - tB - j * perB) / 0.5);
        if (q > 0) { y -= q * 40; a *= 1 - q; }
        if (q < 1) shown++;
        counter(ctx, s.x, y, r, 'red', a);
        if (q > 0 && q < 1) { ctx.save(); ctx.globalAlpha *= 1 - q; line(ctx, s.x - r, y - r, s.x + r, y + r, WHITE, 4); line(ctx, s.x + r, y - r, s.x - r, y + r, WHITE, 4); ctx.restore(); }
        continue;
      }
      shown++;
      counter(ctx, s.x, y, r, 'red', a);
    }
    if (L.sign === '+') for (let j = 0; j < nB; j++) {
      const p = clamp((t - tB - j * perB) / 0.45);
      if (p <= 0) continue;
      const s = slot(L.a + j);
      counter(ctx, s.x, s.y - (1 - outBack(p)) * 70, r, 'yellow', Math.min(1, p * 2));
      shown++;
    }
    // the count so far, big, under the frames
    const cy = fy0 + totalH + 58;
    const fin = t >= tEnd;
    ctx.save(); ctx.globalAlpha *= after(t, 0.4, 0.5);
    label(ctx, String(shown), MX, cy, { size: 54, weight: 800, fill: fin ? 'yellow' : 'ink' });
    ctx.restore();
    if (fin && L.sign) caption(ctx, L.sign === '-' ? `${words(L.a)} take away ${words(L.b)} leaves ${words(L.r)}` : `${words(L.a)} and ${words(L.b)} make ${words(L.r)}`, Math.min(cy + 56, 630), 'ink', after(t, tEnd, 0.6));
    else if (fin) caption(ctx, L.a === 10 ? 'Ten: a full frame!' : L.a > 10 ? `${words(L.a)}: one full ten and ${words(L.a - 10)} more` : L.a === 0 ? 'Zero: the frame is empty' : `${words(L.a)}: ${words(10 - L.a)} more would make ten`, Math.min(cy + 56, 630), 'ink', after(t, tEnd, 0.6));
    return tEnd;
  }
  function drawNumberLine(b, ctx, L, t) {
    const { xOf, hops, dir } = L;
    const maxH = Math.max(0, ...hops.map((h) => clamp(Math.abs(xOf(h) - xOf(0)) * 0.55, 26, 130)));
    const ly = Math.min(L.cy1 - 110, (L.cy0 + L.cy1) / 2 + maxH / 2 + 20);
    // the line and ticks
    ctx.save(); ctx.globalAlpha *= after(t, 0.1, 0.5);
    line(ctx, 30, ly, 770, ly, LINE, 4); head(ctx, 778, ly, 0, 12, LINE); head(ctx, 22, ly, PI, 12, LINE);
    const nT = Math.round((L.L1 - L.L0) / L.u);
    const fine = L.u === 1 ? 0 : L.u;
    for (let k = 0; k <= nT; k++) {
      const v = L.L0 + k * L.u; const x = xOf(v);
      line(ctx, x, ly - 12, x, ly + 12, LINE, 3);
      label(ctx, fmt(v), x, ly + 32, { size: 20, weight: 600, fill: 'muted' });
    }
    if (fine && fine <= 5) for (let v = L.L0; v <= L.L1; v++) if (mod(v, L.u)) line(ctx, xOf(v), ly - 6, xOf(v), ly + 6, tint('muted', 0.6), 1.5);
    ctx.restore();
    hit(b, 'How does a number line work?', 30, ly - 20, 740, 64);
    // hops: arcs above the line, one after another
    const hopDur = clamp(7 / Math.max(1, hops.length), 0.35, 0.9);
    const t0 = 1.0;
    let pos = L.a; let cur = L.a; let tokenX = xOf(L.a); let tokenY = ly - 26;
    hops.forEach((h, k) => {
      const from = pos; const to = pos + dir * h; pos = to;
      const xa = xOf(from); const xb = xOf(to); const w = Math.abs(xb - xa);
      const hh = clamp(w * 0.55, 26, 130);
      const path = mkPath(quadPts(xa, ly - 8, (xa + xb) / 2, ly - 8 - hh * 2, xb, ly - 8, 20));
      const p = clamp((t - t0 - k * hopDur) / (hopDur * 0.85));
      if (p <= 0) return;
      ctx.strokeStyle = tint(dir > 0 ? 'green' : 'orange', 0.85); ctx.lineWidth = 3.5; strokePath(ctx, path, 0, path.total * easeOut(p));
      if (p >= 1) {
        head(ctx, xb, ly - 10, dir > 0 ? 1.2 : PI - 1.2, 9, dir > 0 ? 'green' : 'orange');
        dot(ctx, xb, ly, 6, dir > 0 ? 'green' : 'orange');
        cur = to;
        if (w > 36) label(ctx, `${dir > 0 ? '+' : '−'}${h}`, (xa + xb) / 2, ly - 8 - hh - 16, { size: 19, weight: 800, fill: dir > 0 ? 'green' : 'orange' });
      } else { const q = at(path, path.total * easeOut(p)); tokenX = q.x; tokenY = q.y - 18; cur = from; }
      if (p >= 1) { tokenX = xb; tokenY = ly - 26; }
    });
    const tEnd = t0 + hops.length * hopDur + 0.2;
    L.tDone = tEnd;
    // start and end marks under the numbers
    const sx = xOf(L.a);
    ctx.save(); ctx.globalAlpha *= after(t, 0.5, 0.5);
    dot(ctx, sx, ly, 9, 'cyan');
    chip(ctx, `start ${fmt(L.a)}`, clamp(sx, 70, 730), ly + 72, 'cyan', 18);
    ctx.restore();
    if (hops.length && t >= tEnd) {
      const ex = xOf(L.r);
      ctx.save(); ctx.globalAlpha *= after(t, tEnd, 0.5);
      dot(ctx, ex, ly, 10, 'yellow', 12);
      const sxC = clamp(sx, 70, 730); let exC = clamp(ex, 70, 730);
      if (Math.abs(exC - sxC) < 130) exC = sxC + (ex >= sx ? 130 : -130);
      chip(ctx, `land on ${fmt(L.r)}`, clamp(exC, 70, 730), ly + 72, 'yellow', 18);
      ctx.restore();
    }
    // the hopper and the running total
    const hopping = hops.length > 0;
    drawIcon(ctx, 'frog', tokenX, tokenY - 4, 44, t);
    if (hopping) {
      // the running total rides above the hopper, clear of every arc
      ctx.save(); ctx.globalAlpha *= after(t, 0.8, 0.4);
      const by = ly - 8 - maxH - 52; const bx = clamp(tokenX, 60, 740);
      ctx.fillStyle = 'rgba(8,12,30,0.9)'; box(ctx, bx - 46, by - 26, 92, 52, 26); ctx.fill();
      ctx.strokeStyle = t >= tEnd ? color('yellow') : tint('green', 0.8); ctx.lineWidth = 2.5; ctx.stroke();
      label(ctx, fmt(cur), bx, by + 1, { size: 32, weight: 800, fill: t >= tEnd ? 'yellow' : 'ink' });
      ctx.restore();
    }
    return tEnd;
  }
  function drawArray(b, ctx, L, t) {
    const cell = Math.min(560 / L.b, (L.cy1 - L.cy0 - 40) / L.a, 72);
    const gw = cell * L.b; const gh = cell * L.a;
    const gx = MX - gw / 2 + 30; const gy = (L.cy0 + L.cy1) / 2 - gh / 2 + 10;
    const rowDur = clamp(6 / L.a, 0.45, 0.9);
    const t0 = 0.6;
    const r = cell * 0.36;
    for (let i = 0; i < L.a; i++) {
      for (let j = 0; j < L.b; j++) {
        const p = clamp((t - t0 - i * rowDur - j * (rowDur * 0.6 / L.b)) / 0.3);
        if (p <= 0) continue;
        counter(ctx, gx + (j + 0.5) * cell, gy + (i + 0.5) * cell, r * (0.6 + 0.4 * outBack(p)), 'cyan', Math.min(1, p * 2));
      }
      const q = after(t, t0 + i * rowDur + rowDur * 0.6, 0.35);
      if (q > 0) { ctx.save(); ctx.globalAlpha *= q; label(ctx, String((i + 1) * L.b), gx + gw + 16, gy + (i + 0.5) * cell, { size: clamp(cell * 0.45, 15, 24), weight: 700, fill: i === L.a - 1 ? 'yellow' : 'muted', align: 'left' }); ctx.restore(); }
    }
    const tEnd = t0 + L.a * rowDur + 0.3;
    L.tDone = tEnd;
    ctx.save(); ctx.globalAlpha *= after(t, 0.3, 0.5);
    text(ctx, `${L.b} in each row`, gx + gw / 2, gy - 22, Math.max(gw, 220), { size: 20, weight: 700, fill: 'cyan', min: 16 });
    const lw = gx - 30 - 20;
    text(ctx, `${L.a} row${L.a === 1 ? '' : 's'}`, gx - 20 - Math.min(lw, 110) / 2, gy + gh / 2, Math.min(lw, 110), { size: 20, weight: 700, fill: 'purple', min: 15 });
    line(ctx, gx - 10, gy, gx - 10, gy + gh, tint('purple', 0.7), 3);
    ctx.restore();
    hit(b, 'How does an array show multiplying?', gx, gy, gw, gh);
    if (t >= tEnd) caption(ctx, `${words(L.a)} row${L.a === 1 ? '' : 's'} of ${words(L.b)} make ${words(L.r)}`, 626, 'ink', after(t, tEnd, 0.6));
    return tEnd;
  }

  function drawGroups(b, ctx, L, t) {
    const n = L.a; const per = L.b; const total = n * per;
    const rowsG = n <= 4 ? 1 : 2; const inRow = Math.ceil(n / rowsG);
    const pileH = L.share ? 110 : 0;
    const gTop = L.cy0 + pileH; const gBot = L.cy1 - 40;
    const cw = 740 / inRow; const chh = (gBot - gTop) / rowsG;
    const R = Math.min(cw / 2 - 12, chh / 2 - 24, 125);
    const centre = (g) => { const r = Math.floor(g / inRow); const k = g % inRow; const m = r === rowsG - 1 ? n - r * inRow : inRow; return { x: MX + (k - (m - 1) / 2) * cw, y: gTop + (r + 0.5) * chh - 8 }; };
    const cols = [1, 1, 2, 3, 2, 3, 3, 4, 4, 3, 5][per] || 4; const rws = Math.ceil(per / cols);
    const cr = Math.min((R * 1.35) / cols / 2, (R * 1.35) / rws / 2, 30) * 0.86;
    const inSlot = (g, j) => { const c = centre(g); const pitch = cr * 2.3; const r = Math.floor(j / cols); const inR = Math.min(cols, per - r * cols); return { x: c.x + ((j % cols) - (inR - 1) / 2) * pitch, y: c.y + (r - (rws - 1) / 2) * pitch }; };
    // the plates
    for (let g = 0; g < n; g++) {
      const c = centre(g);
      ctx.save(); ctx.globalAlpha *= after(t, 0.3 + g * 0.12, 0.5);
      ctx.fillStyle = tint('purple', 0.1); ctx.beginPath(); ctx.arc(c.x, c.y, R, 0, TAU); ctx.fill();
      ctx.strokeStyle = tint('purple', 0.6); ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    }
    let tEnd;
    const colorOf = (g) => ['orange', 'cyan', 'green', 'yellow', 'red', 'blue'][g % 6];
    if (!L.share) {
      const gDur = clamp(0.3 + per * 0.12, 0.5, 1.5); const each = (gDur - 0.25) / per;
      const t0 = 0.8;
      for (let g = 0; g < n; g++) for (let j = 0; j < per; j++) {
        const p = clamp((t - t0 - g * gDur - j * each) / 0.3);
        if (p <= 0) continue;
        const s = inSlot(g, j);
        counter(ctx, s.x, s.y - (1 - easeOut(p)) * 30, cr, colorOf(g), Math.min(1, p * 2));
      }
      tEnd = t0 + n * gDur + 0.3;
    } else {
      // all the counters wait in a row at the top, then are dealt out
      const pc = Math.min(18, 700 / Math.max(1, total) / 2.3);
      const pr = Math.min(cr, pc);
      const pitch = pr * 2.3; const perRow = Math.max(1, Math.floor(720 / pitch)); const pRows = Math.ceil(total / perRow);
      const pitchY = Math.min(pitch, (pileH - 20) / Math.max(1, pRows));
      const deal = clamp(9 / total, 0.12, 0.4); const t0 = 1.0;
      for (let k = 0; k < total; k++) {
        const rr = Math.floor(k / perRow); const inR = Math.min(perRow, total - rr * perRow);
        const px = MX + ((k % perRow) - (inR - 1) / 2) * pitch; const py = L.cy0 + 6 + (rr + 0.5) * pitchY;
        const g = k % n; const j = Math.floor(k / n); const s = inSlot(g, j);
        const q = smooth((t - t0 - k * deal) / 0.45);
        const x = lerp(px, s.x, q); const y = lerp(py, s.y, q) - Math.sin(q * PI) * 40;
        counter(ctx, x, y, lerp(pr, cr, q), q > 0 ? colorOf(g) : 'muted', after(t, 0.3, 0.4));
      }
      tEnd = t0 + total * deal + 0.5;
    }
    L.tDone = tEnd;
    for (let g = 0; g < n; g++) {
      const c = centre(g);
      if (t >= tEnd) { ctx.save(); ctx.globalAlpha *= after(t, tEnd, 0.4); label(ctx, String(per), c.x, c.y + R + 18, { size: 22, weight: 800, fill: colorOf(g) }); ctx.restore(); }
      hit(b, L.share ? 'How does sharing out work?' : 'What does a group of mean?', c.x - R, c.y - R, R * 2, R * 2 + 30);
    }
    if (t >= tEnd) caption(ctx, L.share ? `${words(total)} shared between ${words(n)} is ${words(per)} each` : `${words(n)} group${n === 1 ? '' : 's'} of ${words(per)} make ${words(total)}`, 628, 'ink', after(t, tEnd, 0.6));
    return tEnd;
  }
  // A base-ten block: a flat (10 × 10), a rod (1 × 10) or a one, from its top left.
  function block(ctx, kind, x, y, cell, c, a = 1) {
    if (a <= 0.01) return;
    const w = kind === 'flat' ? cell * 10 : cell; const h = kind === 'one' ? cell : cell * 10;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.fillStyle = tint(c, 0.55); ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = tint(c, 0.95); ctx.lineWidth = 1;
    ctx.beginPath();
    if (kind !== 'one') { for (let i = 1; i < 10; i++) { ctx.moveTo(x, y + i * cell); ctx.lineTo(x + w, y + i * cell); } }
    if (kind === 'flat') for (let i = 1; i < 10; i++) { ctx.moveTo(x + i * cell, y); ctx.lineTo(x + i * cell, y + h); }
    ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x, y, w, Math.min(3, cell * 0.25));
    ctx.restore();
  }
  function drawBaseTen(b, ctx, L, t) {
    const dig = (v) => [Math.floor(v / 100), Math.floor(v / 10) % 10, v % 10];
    const [ha, ta, oa] = dig(L.a); const [hb, tb, ob] = dig(L.b);
    const hasH = Math.max(L.a, L.r, L.sign === '+' ? L.a + L.b : 0) >= 100;
    const cell = hasH ? 10 : 18;
    const C = hasH ? { h: { x: 30, w: 330 }, t: { x: 368, w: 230 }, o: { x: 606, w: 164 } } : { t: { x: 30, w: 430 }, o: { x: 470, w: 300 } };
    // the columns are as tall as their blocks can get, centred in the space
    const maxH = L.sign === '-' ? ha : ha + (L.sign ? hb : 0) + 1;
    const maxT = L.sign === '-' ? ta + 10 : ta + (L.sign ? tb : 0) + 1;
    const maxO = L.sign === '-' ? oa + 10 : oa + (L.sign ? ob : 0);
    const contentH = Math.max(cell * 10, hasH ? Math.ceil(Math.min(9, maxH) / 3) * (cell * 10 + 6) : 0, (maxT > 10 ? 2 : 1) * (cell * 10 + 12), Math.ceil(maxO / 5) * (cell + 5) + 6);
    const boxH = contentH + 38 + 44;
    const avail = L.cy1 - 70 - (L.cy0 - 4);
    const bTop = L.cy0 - 4 + Math.max(0, (avail - boxH) / 2); const bBot = bTop + Math.min(boxH, avail);
    const rTop = bTop + 38;
    // block grids centred in their columns (ones leave room on the right to line up as a ten)
    const oX = C.o.x + (C.o.w - (5 * (cell + 5) - 5 + 12 + cell)) / 2;
    const tX = C.t.x + (C.t.w - (10 * (cell + 8) - 8)) / 2;
    const hX = hasH ? C.h.x + (C.h.w - (3 * (cell * 10 + 6) - 6)) / 2 : 0;
    const sO = (k) => ({ x: oX + (k % 5) * (cell + 5), y: rTop + Math.floor(k / 5) * (cell + 5) + Math.floor(k / 10) * 6 });
    const sT = (k) => ({ x: tX + (k % 10) * (cell + 8), y: rTop + Math.floor(k / 10) * (cell * 10 + 12) });
    const sH = (k) => ({ x: hX + (k % 3) * (cell * 10 + 6), y: rTop + Math.floor(k / 3) * (cell * 10 + 6) });
    const gatherO = { x: oX + 5 * (cell + 5) + 7, y: rTop };
    // column frames, names and live digits
    const colsK = hasH ? ['h', 't', 'o'] : ['t', 'o'];
    const NAMES = { h: 'Hundreds', t: 'Tens', o: 'Ones' };
    const HUE = { h: 'purple', t: 'blue', o: 'cyan' };
    const counts = { h: 0, t: 0, o: 0 };
    ctx.save(); ctx.globalAlpha *= after(t, 0.1, 0.5);
    for (const k of colsK) {
      const c = C[k];
      ctx.fillStyle = tint(HUE[k], 0.06); box(ctx, c.x, bTop, c.w, bBot - bTop, 14); ctx.fill();
      ctx.strokeStyle = tint(HUE[k], 0.35); ctx.lineWidth = 2; ctx.stroke();
      text(ctx, NAMES[k], c.x + c.w / 2, bTop + 18, c.w - 16, { size: 20, weight: 700, fill: HUE[k], min: 15 });
      hit(b, `What does the ${NAMES[k].toLowerCase()} column mean?`, c.x, bTop, c.w, 36);
    }
    ctx.restore();
    const A = 'cyan'; const B = 'orange'; const NEW = 'green';
    const nA = ha + ta + oa; const appearA = (i) => clamp((t - 0.4 - i * 0.07) / 0.4);
    const tB = 0.4 + nA * 0.07 + 0.6;
    const nB = L.sign ? hb + tb + ob : 0; const appearB = (i) => clamp((t - tB - i * 0.07) / 0.45);
    let tEnd;
    // draw a column's resting blocks from a list of colours, with an appear progress
    const rest = (kind, list, slot, ap, skip = 0) => { list.forEach((c, k) => { if (k < skip) return; const p = ap(k); const s = slot(k - skip); block(ctx, kind, s.x, s.y + (1 - easeOut(p)) * 26, cell, c, p); }); };
    if (L.sign !== '-') {
      const H = [...Array(ha).fill(A), ...Array(L.sign ? hb : 0).fill(B)];
      const T = [...Array(ta).fill(A), ...Array(L.sign ? tb : 0).fill(B)];
      const O = [...Array(oa).fill(A), ...Array(L.sign ? ob : 0).fill(B)];
      const apH = (k) => (k < ha ? appearA(k) : appearB(k - ha));
      const apT = (k) => (k < ta ? appearA(ha + k) : appearB(hb + k - ta));
      const apO = (k) => (k < oa ? appearA(ha + ta + k) : appearB(hb + tb + k - oa));
      const tR1 = (L.sign ? tB + nB * 0.07 : 0.4 + nA * 0.07) + 0.8;
      const r1 = L.sign && O.length >= 10; const tR2 = tR1 + (r1 ? 2.4 : 0);
      const r2 = L.sign && T.length + (r1 ? 1 : 0) >= 10;
      tEnd = tR2 + (r2 ? 2.4 : 0) + 0.2;
      const p1 = r1 ? clamp((t - tR1) / 2.2) : 0; const p2 = r2 ? clamp((t - tR2) / 2.2) : 0;
      const T1 = r1 && p1 >= 1 ? [...T, NEW] : T;
      const H2 = r2 && p2 >= 1 ? [...H, NEW] : H;
      // hundreds
      if (hasH) rest('flat', H2, sH, (k) => (k < H.length ? apH(k) : 1));
      counts.h = H2.length;
      // tens: resting, or ten gathering into a flat and leaving
      if (r2 && p2 > 0 && p2 < 1) {
        const g = smooth(p2 / 0.35); const m = smooth((p2 - 0.35) / 0.2); const mv = smooth((p2 - 0.55) / 0.45);
        const dest = sH(H.length); const fx = tX;
        for (let j = 0; j < 10; j++) { const s = sT(j); block(ctx, 'rod', lerp(s.x, fx + j * cell, g), s.y, cell, T1[j], 1 - m); }
        if (m > 0) { ctx.save(); glow(ctx, color(NEW), 16 * (1 - mv)); block(ctx, 'flat', lerp(fx, dest.x, mv), lerp(rTop, dest.y, mv) - Math.sin(mv * PI) * 40, cell, NEW, m); ctx.restore(); }
        T1.slice(10).forEach((c, k) => { const s0 = sT(k + 10); const s1 = sT(k); block(ctx, 'rod', lerp(s0.x, s1.x, mv), lerp(s0.y, s1.y, mv), cell, c, 1); });
        counts.t = T1.length;
      } else if (r2 && p2 >= 1) { rest('rod', T1.slice(10), sT, () => 1); counts.t = T1.length - 10; } else {
        rest('rod', T1, sT, (k) => (k < T.length ? apT(k) : 1)); counts.t = T1.length;
      }
      // ones: resting, or ten gathering into a rod and moving to the tens
      if (r1 && p1 > 0 && p1 < 1) {
        const g = smooth(p1 / 0.35); const m = smooth((p1 - 0.35) / 0.2); const mv = smooth((p1 - 0.55) / 0.45);
        const dest = sT(T.length);
        for (let j = 0; j < 10; j++) { const s = sO(j); block(ctx, 'one', lerp(s.x, gatherO.x, g), lerp(s.y, gatherO.y + j * cell, g), cell, O[j], 1 - m); }
        if (m > 0) { ctx.save(); glow(ctx, color(NEW), 16 * (1 - mv)); block(ctx, 'rod', lerp(gatherO.x, dest.x, mv), lerp(gatherO.y, dest.y, mv) - Math.sin(mv * PI) * 50, cell, NEW, m); ctx.restore(); }
        O.slice(10).forEach((c, k) => { const s0 = sO(k + 10); const s1 = sO(k); block(ctx, 'one', lerp(s0.x, s1.x, mv), lerp(s0.y, s1.y, mv), cell, c, 1); });
        counts.o = O.length;
      } else if (r1 && p1 >= 1) { rest('one', O.slice(10), sO, () => 1); counts.o = O.length - 10; } else { rest('one', O, sO, apO); counts.o = O.length; }
      if (r1 && p1 > 0 && p1 < 0.6) chip(ctx, 'Ten ones make one ten!', MX, bBot - 24, NEW, 18);
      else if (r2 && p2 > 0 && p2 < 0.6) chip(ctx, 'Ten tens make one hundred!', MX, bBot - 24, NEW, 18);
    } else {
      // take away, exchanging a ten (or a hundred) first when there are too few
      const needO = oa < ob; const needT = ta - (needO ? 1 : 0) < tb;
      const tX0 = 0.4 + nA * 0.07 + 0.7; const tX1 = tX0 + (needT ? 2.2 : 0); const tTA = tX1 + (needO ? 2.2 : 0) + 0.2;
      tEnd = tTA + 0.6 + 3 * 0.5;
      const q0 = needT ? clamp((t - tX0) / 2) : 0; const q1 = needO ? clamp((t - tX1) / 2) : 0;
      let H = Array(ha).fill(A); let T = Array(ta).fill(A); let O = Array(oa).fill(A);
      if (needT && q0 >= 1) { H = H.slice(0, -1); T = [...T, ...Array(10).fill(NEW)]; }
      const T0 = T.length;
      if (needO && q1 >= 1) { T = T.slice(0, -1); O = [...O, ...Array(10).fill(NEW)]; }
      const gone = (col, k, len, take) => (k >= len - take ? clamp((t - tTA - { o: 0, t: 0.5, h: 1 }[col] - (len - 1 - k) * 0.06) / 0.6) : 0);
      const drawCol = (kind, list, slot, col, take, apOff) => list.forEach((c, k) => {
        const s = slot(k); const ap = k < (col === 'h' ? ha : col === 't' ? ta : oa) ? appearA(apOff + k) : 1;
        const gq = gone(col, k, list.length, take);
        block(ctx, kind, s.x, s.y + (1 - easeOut(ap)) * 26 - gq * 40, cell, gq > 0 ? B : c, ap * (1 - gq));
      });
      // hundreds (one may be breaking into ten tens)
      const Hshow = needT && q0 > 0 && q0 < 1 ? H.slice(0, -1) : H;
      if (hasH) drawCol('flat', Hshow, sH, 'h', t >= tTA ? hb : 0, 0);
      if (needT && q0 > 0 && q0 < 1) {
        const s0 = sH(ha - 1); const mid = sT(ta); const mv = smooth(q0 / 0.5); const sp = smooth((q0 - 0.55) / 0.45);
        if (sp <= 0) block(ctx, 'flat', lerp(s0.x, mid.x, mv), lerp(s0.y, mid.y, mv) - Math.sin(mv * PI) * 40, cell, NEW, 1);
        else for (let j = 0; j < 10; j++) { const d = sT(ta + j); block(ctx, 'rod', lerp(mid.x + j * cell, d.x, sp), lerp(mid.y, d.y, sp), cell, NEW, 1); }
        if (q0 < 0.6) chip(ctx, 'Swap one hundred for ten tens', MX, bBot - 24, NEW, 18);
      }
      const Tshow = needT && q0 > 0 && q0 < 1 ? Array(ta).fill(A) : needO && q1 > 0 && q1 < 1 ? T.slice(0, T0 - 1) : T;
      drawCol('rod', Tshow, sT, 't', t >= tTA ? tb : 0, ha);
      if (needO && q1 > 0 && q1 < 1) {
        const s0 = sT(T0 - 1); const mv = smooth(q1 / 0.5); const sp = smooth((q1 - 0.55) / 0.45);
        if (sp <= 0) block(ctx, 'rod', lerp(s0.x, gatherO.x, mv), lerp(s0.y, gatherO.y, mv) - Math.sin(mv * PI) * 50, cell, NEW, 1);
        else for (let j = 0; j < 10; j++) { const d = sO(oa + j); block(ctx, 'one', lerp(gatherO.x, d.x, sp), lerp(gatherO.y + j * cell, d.y, sp), cell, NEW, 1); }
        if (q1 < 0.6) chip(ctx, 'Swap one ten for ten ones', MX, bBot - 24, NEW, 18);
      }
      drawCol('one', O, sO, 'o', t >= tTA ? ob : 0, ha + ta);
      const left = (len, take, col) => len - (t >= tTA ? Array.from({ length: take }, (_, i) => gone(col, len - 1 - i, len, take) >= 1).filter(Boolean).length : 0);
      counts.h = left(Hshow.length, hb, 'h'); counts.t = left(Tshow.length, tb, 't'); counts.o = left(O.length, ob, 'o');
    }
    L.tDone = tEnd;
    // the digits under the columns
    ctx.save(); ctx.globalAlpha *= after(t, 0.6, 0.5);
    for (const k of colsK) { const c = C[k]; label(ctx, String(counts[k]), c.x + c.w / 2, bBot + 32, { size: 40, weight: 800, fill: t >= tEnd ? 'yellow' : HUE[k] }); }
    ctx.restore();
    if (t >= tEnd) {
      const [h, tt, o] = dig(L.r);
      const parts = [h ? `${h * 100}` : '', tt ? `${tt * 10}` : '', o || (!h && !tt) ? `${o}` : ''].filter(Boolean);
      caption(ctx, `${L.r} = ${parts.join(' + ')}`, Math.min(bBot + 80, 632), 'ink', after(t, tEnd, 0.6));
    }
    return tEnd;
  }

  // A fraction written the school way: a over a bar over b.
  function stacked(ctx, a, b, x, y, size, fill = 'ink') {
    label(ctx, String(a), x, y - size * 0.62, { size, weight: 800, fill });
    line(ctx, x - size * 0.55 - (String(Math.max(a, b)).length - 1) * size * 0.25, y, x + size * 0.55 + (String(Math.max(a, b)).length - 1) * size * 0.25, y, fill, Math.max(3, size * 0.08));
    label(ctx, String(b), x, y + size * 0.66, { size, weight: 800, fill });
  }
  function drawFraction(b, ctx, L, t) {
    const fr = [{ a: L.a, b: L.b, c: 'cyan' }];
    if (L.cmp) fr.push({ ...L.cmp, c: 'orange' });
    const pie = L.kind === 'fraction-pie';
    const per = (f) => clamp(3 / Math.max(1, f.a), 0.18, 0.45);
    let t0 = 0.6; for (const f of fr) { f.t0 = t0; t0 += f.a * per(f) + 0.5; }
    const tEnd = t0 + 0.1;
    L.tDone = tEnd;
    const mid = (L.cy0 + L.cy1) / 2 - (L.cmp ? 20 : 26);
    fr.forEach((f, i) => {
      const fillK = (k) => clamp((t - f.t0 - k * per(f)) / 0.35);
      const ap = after(t, 0.2 + i * 0.3, 0.5);
      ctx.save(); ctx.globalAlpha *= ap;
      if (!pie) {
        const bx = 196; const bw = 564; const bh = L.cmp ? 92 : 112;
        const by = (L.cmp ? (i ? mid + 110 : mid - 110) : mid) - bh / 2;
        const pw = bw / f.b;
        for (let k = 0; k < f.b; k++) {
          const p = k < f.a ? fillK(k) : 0;
          ctx.fillStyle = tint(f.c, 0.08); ctx.fillRect(bx + k * pw, by, pw, bh);
          if (p > 0) { ctx.fillStyle = tint(f.c, 0.75); ctx.fillRect(bx + k * pw, by + bh * (1 - easeOut(p)), pw, bh * easeOut(p)); }
        }
        ctx.strokeStyle = tint(f.c, 0.95); ctx.lineWidth = 3; ctx.strokeRect(bx, by, bw, bh);
        for (let k = 1; k < f.b; k++) line(ctx, bx + k * pw, by, bx + k * pw, by + bh, tint(WHITE, 0.8), 2.5);
        stacked(ctx, f.a, f.b, 100, by + bh / 2, L.cmp ? 38 : 46, f.c);
        // its name: under the bar, or (when comparing) under the fraction, clear of the guide lines
        if (L.cmp) text(ctx, fracWords(f.a, f.b), 100, by + bh + 16, 160, { size: 18, weight: 600, fill: 'muted', min: 14 });
        else text(ctx, fracWords(f.a, f.b), bx + bw / 2, by + bh + 24, bw, { size: 20, weight: 600, fill: 'muted', min: 16 });
        if (L.cmp && t >= tEnd) { const ex = bx + pw * f.a; ctx.save(); ctx.globalAlpha *= after(t, tEnd, 0.5); line(ctx, ex, mid - 166, ex, mid + 166, f.c, 2.5, [7, 7]); ctx.restore(); }
        hit(b, `What does ${f.a}/${f.b} mean?`, 40, by - 10, 730, bh + 48);
      } else {
        const R = L.cmp ? Math.min(140, (L.cy1 - L.cy0) / 2 - 70) : Math.min(180, (L.cy1 - L.cy0) / 2 - 20);
        const cx = L.cmp ? (i ? 590 : 210) : 480; const cy = L.cmp ? (L.cy0 + L.cy1 - 2 * R - 150) / 2 + R : mid;
        ctx.fillStyle = tint(f.c, 0.08); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
        const sa = TAU / f.b;
        for (let k = 0; k < f.a; k++) {
          const p = fillK(k);
          if (p <= 0) continue;
          ctx.fillStyle = tint(f.c, 0.75); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R * (0.85 + 0.15 * easeOut(p)), -PI / 2 + k * sa, -PI / 2 + k * sa + sa * easeOut(p)); ctx.closePath(); ctx.fill();
        }
        ctx.strokeStyle = tint(f.c, 0.95); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
        if (f.b > 1) for (let k = 0; k < f.b; k++) { const ang = -PI / 2 + k * sa; line(ctx, cx, cy, cx + Math.cos(ang) * R, cy + Math.sin(ang) * R, tint(WHITE, 0.8), 2.5); }
        if (L.cmp) {
          stacked(ctx, f.a, f.b, cx, cy + R + 62, 34, f.c);
          text(ctx, fracWords(f.a, f.b), cx, cy + R + 132, 300, { size: 20, weight: 600, fill: 'muted', min: 16 });
        } else {
          stacked(ctx, f.a, f.b, 150, cy - 20, 50, f.c);
          text(ctx, fracWords(f.a, f.b), 150, cy + 76, 220, { size: 20, weight: 600, fill: 'muted', lines: 2, min: 16 });
        }
        hit(b, `What does ${f.a}/${f.b} mean?`, cx - R, cy - R, R * 2, R * 2);
      }
      ctx.restore();
    });
    if (L.cmp && t >= tEnd) {
      const p = after(t, tEnd, 0.5);
      const rel = L.rel; const rw = rel === '>' ? 'is more than' : rel === '<' ? 'is less than' : 'is the same as';
      ctx.save(); ctx.globalAlpha *= p;
      if (pie) { const R = Math.min(140, (L.cy1 - L.cy0) / 2 - 70); label(ctx, rel, MX, (L.cy0 + L.cy1 - 2 * R - 150) / 2 + R, { size: 64, weight: 800, fill: 'yellow' }); }
      else label(ctx, rel === '>' ? '>' : rel === '<' ? '<' : '=', 100, mid, { size: 40, weight: 800, fill: 'yellow' });
      ctx.restore();
      caption(ctx, `${fracWords(L.a, L.b)} ${rw} ${fracWords(L.cmp.a, L.cmp.b)}`, 628, 'yellow', p);
    } else if (!L.cmp && t >= tEnd) caption(ctx, L.a === L.b ? `${fracWords(L.a, L.b)} make one whole` : `${words(L.a)} out of ${words(L.b)} equal parts`, 628, 'ink', after(t, tEnd, 0.6));
    return tEnd;
  }
  function drawClock(b, ctx, L, t) {
    const R = Math.min(200, (L.cy1 - L.cy0) / 2);
    const cx = 40 + R; const cy = (L.cy0 + L.cy1) / 2;
    const sweep = 0.5 + (L.b / 60) * 2.6; const t0 = 0.8;
    const m = L.b * smooth((t - t0) / sweep);
    const tEnd = t0 + sweep + 0.2;
    L.tDone = tEnd;
    ctx.save(); ctx.globalAlpha *= after(t, 0.1, 0.5);
    // the face
    ctx.fillStyle = 'rgba(8,12,30,0.9)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.fillStyle = tint(WHITE, 0.06); ctx.fill();
    ctx.strokeStyle = tint('cyan', 0.8); ctx.lineWidth = 6; ctx.stroke();
    // past / to: the part of the face the minute hand has swept
    if (m > 0.2) {
      const past = L.b <= 30;
      const a0 = -PI / 2; const a1 = -PI / 2 + (m / 60) * TAU;
      ctx.fillStyle = tint(past ? 'green' : 'orange', 0.16); ctx.beginPath(); ctx.moveTo(cx, cy);
      if (past || m <= 30) ctx.arc(cx, cy, R * 0.86, a0, a1); else ctx.arc(cx, cy, R * 0.86, a1, a0 + TAU);
      ctx.closePath(); ctx.fill();
    }
    for (let i = 0; i < 60; i++) {
      const ang = (i / 60) * TAU - PI / 2; const big = i % 5 === 0;
      line(ctx, cx + Math.cos(ang) * R * (big ? 0.86 : 0.91), cy + Math.sin(ang) * R * (big ? 0.86 : 0.91), cx + Math.cos(ang) * R * 0.95, cy + Math.sin(ang) * R * 0.95, big ? WHITE : tint(WHITE, 0.5), big ? 3.5 : 1.5);
    }
    for (let h = 1; h <= 12; h++) { const ang = (h / 12) * TAU - PI / 2; label(ctx, String(h), cx + Math.cos(ang) * R * 0.72, cy + Math.sin(ang) * R * 0.72 + 1, { size: Math.round(R * 0.16), weight: 700, fill: h === L.a ? 'yellow' : 'ink' }); }
    // hands: the short hour hand creeps on as the minute hand sweeps
    const ha = ((mod(L.a, 12) + m / 60) / 12) * TAU - PI / 2; const ma = (m / 60) * TAU - PI / 2;
    const hx = cx + Math.cos(ha) * R * 0.48; const hy = cy + Math.sin(ha) * R * 0.48;
    const mx = cx + Math.cos(ma) * R * 0.8; const my = cy + Math.sin(ma) * R * 0.8;
    line(ctx, cx, cy, hx, hy, 'purple', 14);
    line(ctx, cx, cy, mx, my, 'cyan', 8);
    dot(ctx, cx, cy, 12, WHITE); dot(ctx, cx, cy, 5, DARK);
    ctx.restore();
    hit(b, 'Which hand is the minute hand?', mx - 24, my - 24, 48, 48);
    if (Math.hypot(hx - mx, hy - my) > 50) hit(b, 'Which hand is the hour hand?', hx - 24, hy - 24, 48, 48);
    hit(b, 'How do I read a clock?', cx - R, cy - R, R * 2, R * 2);
    // the time in numbers and in words
    const rx = cx + R + 30; const rw = 770 - rx; const rcx = rx + rw / 2;
    const p = after(t, tEnd, 0.6);
    ctx.save(); ctx.globalAlpha *= after(t, 0.4, 0.5);
    card(ctx, rx, cy - 150, rw, 120, 'cyan', 0.2 * p, 20, 0.06);
    label(ctx, `${L.a}:${String(Math.floor(m)).padStart(2, '0')}`, rcx, cy - 89, { size: 68, weight: 800, fill: p > 0.5 ? 'yellow' : 'ink' });
    ctx.restore();
    hit(b, `What time is ${L.a}:${String(L.b).padStart(2, '0')}?`, rx, cy - 150, rw, 120);
    if (p > 0) {
      ctx.save(); ctx.globalAlpha *= p;
      text(ctx, timeWords(L.a, L.b), rcx, cy + 30, rw, { size: 32, weight: 700, lines: 3, min: 22, fill: 'ink' });
      if (L.b > 0 && L.b !== 30) chip(ctx, L.b < 30 ? `${L.b} minutes past` : `${60 - L.b} minutes to`, rcx, cy + 128, L.b < 30 ? 'green' : 'orange', 19, 'center', rw);
      ctx.restore();
    }
    return tEnd;
  }
  function drawCount(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layCount(ctx, it, top));
    if (!L.eq) L.cy0 = top + (L.label ? 62 : 14);
    L.tDone = Infinity;
    const draw = { 'ten-frame': drawTenFrame, 'base-ten': drawBaseTen, 'number-line': drawNumberLine, array: drawArray, groups: drawGroups, 'fraction-bar': drawFraction, 'fraction-pie': drawFraction, clock: drawClock }[L.kind];
    const tEnd = draw ? draw(b, ctx, L, t) : 0;
    countHeader(ctx, L, t, t >= tEnd ? 1 : 0);
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── Shared bits of the engineering engines (circuit, beam, plot) ─────
  // A tap target kept inside the figure.
  function hitIn(b, s, x, y, w, h) {
    const x0 = clamp(x, 0, 800); const y0 = clamp(y, 0, 700);
    hit(b, s, x0, y0, clamp(x + w, 0, 800) - x0, clamp(y + h, 0, 700) - y0);
  }
  const overlap = (a, c) => Math.max(0, Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x)) * Math.max(0, Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y));
  // A label block: up to two lines of name, then a value line.
  function drawLabelBlock(ctx, lab, box, c, e) {
    const tx = box.align === 'center' ? box.x + box.w / 2 : box.align === 'left' ? box.x : box.x + box.w;
    if (e > 0.05) {
      ctx.save(); ctx.globalAlpha *= e;
      ctx.fillStyle = 'rgba(5,8,22,0.85)'; ctx.strokeStyle = tint(c, 0.6); ctx.lineWidth = 1.5;
      rounded(ctx, box.x - 8, box.y - 4, box.w + 16, box.h + 8, 10); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    let y = box.y;
    ctx.textAlign = box.align; ctx.textBaseline = 'middle';
    if (lab.lf) {
      const f = lab.lf; ctx.font = `700 ${f.size}px ${FONT}`; ctx.fillStyle = color(e > 0.5 ? c : 'ink');
      f.lines.forEach((l, j) => ctx.fillText(l, tx, y + f.size * 1.22 * (j + 0.5) + 1));
      y += f.h;
    }
    if (lab.vf) { const f = lab.vf; ctx.font = `700 ${f.size}px ${FONT}`; ctx.fillStyle = color(c); ctx.fillText(f.lines[0], tx, y + 11); }
  }

  // ─── x-circuit: a real circuit diagram with moving current ────────────
  // A tidy rectangular schematic: the source stands on the left of the main
  // loop, branch 0's parts go round the loop, branches 1–3 are parallel
  // rungs. Values that read as volts and ohms are solved (series–parallel),
  // so the dots of conventional current move faster where more flows; a
  // capacitor on DC charges (the current dies away), an inductor's current
  // grows, AC sloshes to and fro and a diode on AC lets only half through.
  // A voltmeter stands across the part listed just before it (the source if
  // it comes first), as real voltmeters do; a branch of only a voltmeter is
  // a meter in parallel.
  const CIRCUIT_KINDS = 'cell ac resistor capacitor inductor bulb switch diode led motor fuse ammeter voltmeter block opamp npn nmos'.split(' ');
  const CK_ALIAS = { battery: 'cell', dc: 'cell', supply: 'cell', source: 'cell', mains: 'ac', generator: 'ac', alternator: 'ac', resistance: 'resistor', rheostat: 'resistor', thermistor: 'resistor', ldr: 'resistor', lamp: 'bulb', light: 'bulb', coil: 'inductor', 'op-amp': 'opamp', op_amp: 'opamp', bjt: 'npn', transistor: 'npn', mosfet: 'nmos', choke: 'inductor', key: 'switch', meter: 'ammeter', box: 'block', ic: 'block', chip: 'block' };
  const CK_HUE = { cell: 'yellow', ac: 'yellow', resistor: 'orange', capacitor: 'cyan', inductor: 'purple', bulb: WHITE, switch: 'teal', diode: 'green', led: 'red', motor: 'blue', fuse: 'orange', ammeter: 'cyan', voltmeter: 'cyan', block: 'purple', opamp: 'purple', npn: 'green', nmos: 'teal' };
  const CK_WORD = { cell: 'Cell', ac: 'AC supply', resistor: 'Resistor', capacitor: 'Capacitor', inductor: 'Inductor', bulb: 'Bulb', switch: 'Switch', diode: 'Diode', led: 'LED', motor: 'Motor', fuse: 'Fuse', ammeter: 'Ammeter', voltmeter: 'Voltmeter', block: 'Block', opamp: 'Op-amp', npn: 'Transistor', nmos: 'MOSFET' };
  // Half length along the wire, half width across it.
  const CK_ALONG = { cell: 13, ac: 24, resistor: 34, capacitor: 12, inductor: 38, bulb: 22, switch: 30, diode: 17, led: 18, motor: 24, fuse: 26, ammeter: 21, voltmeter: 21 };
  const CK_ACROSS = { cell: 24, ac: 24, resistor: 12, capacitor: 24, inductor: 14, bulb: 24, switch: 24, diode: 14, led: 28, motor: 24, fuse: 10, ammeter: 21, voltmeter: 21 };
  const CK_SERIES = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [2, 1, 0], [2, 1, 1], [2, 1, 2], [3, 1, 2], [3, 1, 3]];
  const SI_PREFIX = { p: 1e-12, n: 1e-9, u: 1e-6, 'µ': 1e-6, 'μ': 1e-6, m: 1e-3, k: 1e3, K: 1e3, M: 1e6, G: 1e9 };
  const LED_HUE = { red: 'red', green: 'green', blue: 'blue', yellow: 'yellow', orange: 'orange', white: WHITE, purple: 'purple' };
  const CK_TAU = 2.4; // seconds for a capacitor to charge (or a coil's current to grow) on the board
  const CK_W = TAU * 0.4; // AC on the board: 0.4 cycles a second, calm enough to follow
  // A reading in volts or ohms from a value such as "12 V", "2 kΩ", "4.7 ohm".
  function reading(v, unit) {
    const s = str(v).replace(/(\d),(\d{3})/g, '$1$2');
    const m = unit === 'V'
      ? s.match(/(\d+(?:\.\d+)?|\.\d+)\s*([pnuµμmkKMG]?)\s*V(?![a-zA-Z])/)
      : s.match(/(\d+(?:\.\d+)?|\.\d+)\s*([pnuµμmkKMG]?)\s*(?:Ω|Ω|[oO]hms?(?![a-zA-Z]))/);
    if (!m) return null;
    const n = parseFloat(m[1]) * (m[2] ? SI_PREFIX[m[2]] : 1);
    return Number.isFinite(n) ? n : null;
  }
  function layCircuit(ctx, it, top) {
    const parts = arr(it.parts, 8).map((p0, i) => {
      const p = obj(p0);
      const k0 = str(p.kind).toLowerCase();
      const kind = CIRCUIT_KINDS.includes(k0) ? k0 : CK_ALIAS[k0] || 'block';
      const br = integer(p.branch);
      let c = CK_HUE[kind];
      if (kind === 'led') { const w = `${str(p.label)} ${str(p.value)}`.toLowerCase().match(/red|green|blue|yellow|orange|white|purple/); if (w) c = LED_HUE[w[0]]; }
      return { i, kind, label: str(p.label, CK_WORD[kind]), value: str(p.value), branch: br !== null && br > 0 && br <= 3 ? br : 0, open: p.open === true, note: str(p.note), ask: p.ask, c };
    });
    if (!parts.length) return { empty: true };
    // a textbook stage (op-amp or transistor) when the parts fit its roles; else the loop
    const layout = str(it.layout, 'loop').toLowerCase();
    if (layout !== 'loop') { const RL = circuitRoles({ layout, parts }); if (RL.roles) return layPreset(ctx, it, top, parts, layout, RL.roles); }
    for (const p of parts) if (p.kind === 'opamp' || p.kind === 'npn' || p.kind === 'nmos') { p.kind = 'block'; p.c = CK_HUE.block; }
    const src = parts.find((p) => p.kind === 'cell' || p.kind === 'ac') || null;
    if (src) src.branch = 0;
    const ac = !!src && src.kind === 'ac';
    const others = parts.filter((p) => p !== src);
    let nums = [...new Set(others.map((p) => p.branch).filter((v) => v > 0))].sort((a, c) => a - c);
    if (nums.length === 1) { for (const p of others) p.branch = 0; nums = []; }
    const lists = [others.filter((p) => p.branch === 0), ...nums.map((v) => others.filter((p) => p.branch === v))];
    // voltmeters stand across a part instead of sitting in series with it
    const meters = [];
    lists.forEach((li, k) => {
      if (k > 0 && li.every((p) => p.kind === 'voltmeter')) return; // a meter in parallel on its own rung
      li.forEach((p, j) => {
        if (p.kind !== 'voltmeter') return;
        let target = null;
        for (let q = j - 1; q >= 0 && !target; q--) if (li[q].kind !== 'voltmeter') target = li[q];
        if (!target && k === 0 && src) target = src;
        for (let q = j + 1; q < li.length && !target; q++) if (li[q].kind !== 'voltmeter') target = li[q];
        if (target) { p.across = target; p.nth = meters.filter((m) => m.across === target).length; meters.push(p); }
      });
    });
    for (let k = 0; k < lists.length; k++) lists[k] = lists[k].filter((p) => !p.across);
    const main = lists[0]; const branches = lists.slice(1);
    const series = !branches.length;

    // ── the electrics: currents at the start (capacitors empty, coils
    //    resisting) and once settled (capacitors full, coils just wire)
    const V = src ? reading(src.value, 'V') ?? 1 : 0;
    let known = true;
    const R = (p, settled) => {
      switch (p.kind) {
        case 'resistor': case 'bulb': case 'motor': case 'block': { const r = reading(p.value, 'Ω'); if (r !== null) return r; known = false; return 1; }
        case 'switch': return p.open ? Infinity : 0;
        case 'voltmeter': return Infinity;
        case 'capacitor': if (ac) { known = false; return 1; } return settled ? Infinity : 0;
        case 'inductor': if (ac) { known = false; return 1; } return settled ? 0 : Infinity;
        default: return 0; // wires, meters, fuses, diodes (ideal, forward), extra cells
      }
    };
    const solve = (settled) => {
      const Rm = main.reduce((s, p) => s + R(p, settled), 0);
      const Rk = branches.map((li) => li.reduce((s, p) => s + R(p, settled), 0));
      if (!src || it.flow === false || !(V > 0)) return { main: 0, rungs: Rk.map(() => 0) };
      if (series) return { main: Rm === 0 ? Infinity : V / Rm, rungs: [] };
      const shorts = Rk.filter((r) => r === 0).length;
      if (shorts) { const I = Rm === 0 ? Infinity : V / Rm; return { main: I, rungs: Rk.map((r) => (r === 0 ? I / shorts : 0)) }; }
      const G = Rk.reduce((s, r) => s + (Number.isFinite(r) ? 1 / r : 0), 0);
      if (!G) return { main: 0, rungs: Rk.map(() => 0) };
      const I = V / (Rm + 1 / G); const Vp = I / G;
      return { main: I, rungs: Rk.map((r) => (Number.isFinite(r) ? Vp / r : 0)) };
    };
    const I0 = solve(false); const I1 = solve(true);
    for (const S of [I0, I1]) { // a short circuit: the board can only say "lots"
      if (!Number.isFinite(S.main)) { known = false; S.main = 1; }
      S.rungs = S.rungs.map((v) => { if (Number.isFinite(v)) return v; known = false; return 1; });
    }
    const trans = !ac && parts.some((p) => p.kind === 'capacitor' || p.kind === 'inductor');

    // ── where each part goes: top wire, rungs (the right side of a series
    //    loop is one rung), bottom wire; the source on the left going up
    let topP; let botP; let rungs;
    if (series) { const [a, c] = CK_SERIES[Math.min(7, main.length)]; topP = main.slice(0, a); rungs = [main.slice(a, a + c)]; botP = main.slice(a + c); } else { const h = Math.ceil(main.length / 2); topP = main.slice(0, h); botP = main.slice(h); rungs = branches; }
    topP.forEach((p) => { p.side = 'top'; p.ang = 0; });
    botP.forEach((p) => { p.side = 'bottom'; p.ang = PI; });
    rungs.forEach((li, k) => li.forEach((p) => { p.side = 'rung'; p.rung = k; p.ang = PI / 2; }));
    if (src) { src.side = 'source'; src.ang = -PI / 2; }
    const horiz = (q) => q.side === 'top' || q.side === 'bottom';
    for (const m of meters) { m.side = 'meter'; m.ang = m.across.ang; }
    const loose = parts.filter((p) => !p.side); // no source and stray kinds: put them on the top wire
    for (const p of loose) { p.side = 'top'; p.ang = 0; topP.push(p); }
    for (const p of parts) {
      const h = p.side === 'meter' ? horiz(p.across) : horiz(p);
      if (p.kind === 'block') {
        p.bf = measure(ctx, p.label, 128, 17, 700, 2, 13);
        p.bw = clamp(p.bf.w + 26, 84, 152); p.bh = Math.max(44, p.bf.h + 16);
        p.along = h ? p.bw / 2 : p.bh / 2; p.acr = h ? p.bh / 2 : p.bw / 2;
      } else { p.along = CK_ALONG[p.kind]; p.acr = CK_ACROSS[p.kind]; }
    }
    const labOf = (p, maxW, lines) => {
      const lf = p.kind === 'block' ? null : measure(ctx, p.label, maxW, 19, 700, lines, 15);
      const vf = p.value ? measure(ctx, p.value, maxW, 17, 700, 1, 14) : null;
      return { lf, vf, w: Math.max(lf ? lf.w : 0, vf ? vf.w : 0), h: (lf ? lf.h : 0) + (vf ? 22 : 0) };
    };
    const metersOn = (q) => meters.filter((m) => m.across === q);
    const OFF = 66; // how far a voltmeter stands off its part
    const reach = (q) => Math.max(q.along + 9, 34); // where its leads join, either side of the part
    const meterLeft = (q) => metersOn(q).reduce((w, m) => Math.max(w, OFF * (m.nth + 1) + 21 + 10 + m.lab.w + 4), 0);
    // widths: shrink the labels until everything fits across
    let G = null;
    for (const cap of [170, 150, 132, 116, 100, 86]) {
      for (const p of parts) p.lab = labOf(p, cap, 2);
      const slot = (p) => { let w = Math.max(2 * p.along + 28, p.lab.w + 30); for (const m of metersOn(p)) w = Math.max(w, m.lab.w + 30, 2 * reach(p) + 22); return w; };
      const topSum = topP.reduce((s, p) => s + slot(p), 0); const botSum = botP.reduce((s, p) => s + slot(p), 0);
      const srcIn = src ? src.acr + 14 + src.lab.w + 16 : 20;
      const left = Math.max(src ? meterLeft(src) : 0, 44);
      const rl = rungs.map((li, k) => Math.max(series && k === 0 ? 0 : 28, ...li.map(meterLeft)));
      const rr = rungs.map((li) => (li.length ? Math.max(...li.map((p) => p.acr + 12 + p.lab.w)) + 8 : 12));
      const mainW = Math.max(topSum, botSum, srcIn + rl[0] + (series ? 40 : 12), series ? 330 : 130);
      const xs = [left + mainW];
      for (let k = 1; k < rungs.length; k++) xs.push(xs[k - 1] + Math.max(120, rr[k - 1] + rl[k] + 12));
      const right = xs[xs.length - 1] + rr[rr.length - 1];
      G = { left, xs, right };
      if (right <= 794) break;
    }
    { // spread a narrow circuit out: rungs apart, the main loop wider
      const extra = Math.min(744 - G.right, series ? 110 : 260);
      if (extra > 0) { const k = G.xs.length; G.xs = G.xs.map((v, j) => v + (extra * (j + 1)) / k); G.right += extra; }
    }
    const shift = Math.max(0, (796 - G.right) / 2);
    const xL = G.left + shift; const xs = G.xs.map((v) => v + shift); const xR = xs[xs.length - 1];

    // heights: room above and below for labels and meters, the readouts and notes at the foot
    const reads = arr(it.readouts, 3).map((r) => str(r)).filter(Boolean);
    const hasNotes = parts.some((p) => p.note);
    const capY = reads.length ? 584 : 622;
    const limit = hasNotes ? capY - 30 : reads.length ? 604 : 646;
    const need = (li, outward) => Math.max(26, ...li.map((p) => (metersOn(p).length ? Math.max(...metersOn(p).map((m) => OFF * (m.nth + 1) + 21 + 8 + m.lab.h)) : outward(p))));
    const topNeed = need(topP, (p) => p.acr + 10 + p.lab.h);
    const botNeed = need(botP, (p) => p.acr + 10 + p.lab.h);
    const yTop = top + topNeed + 6; const yBot = Math.max(yTop + 200, limit - botNeed);
    const slotH = (p) => Math.max(2 * p.along + 20, p.lab.h + 10, metersOn(p).length ? 2 * reach(p) + 14 : 0);
    const rungNeed = () => Math.max(220, ...rungs.map((li) => li.reduce((s, p) => s + slotH(p), 0) + 44), src ? Math.max(2 * src.along + 60, src.lab.h + 40) : 0);
    if (rungNeed() > yBot - yTop) for (const li of rungs) for (const p of li) p.lab = labOf(p, Math.max(p.lab.w, 60), 1);
    const hgt = Math.min(yBot - yTop, Math.max(rungNeed(), series ? 300 : 340));
    const yT = yTop + (yBot - yTop - hgt) / 2; const yB = yT + hgt; const yc = (yT + yB) / 2;

    // positions
    topP.forEach((p, j) => { p.x = xL + ((xs[0] - xL) * (j + 0.5)) / topP.length; p.y = yT; });
    botP.forEach((p, j) => { p.x = xs[0] - ((xs[0] - xL) * (j + 0.5)) / botP.length; p.y = yB; });
    rungs.forEach((li, k) => {
      const tot = li.reduce((s, p) => s + slotH(p), 0); const free = (yB - yT - tot) / (li.length + 1);
      let y = yT + free;
      li.forEach((p) => { p.x = xs[k]; p.y = y + slotH(p) / 2; y += slotH(p) + free; });
    });
    if (src) { src.x = xL; src.y = yc; }
    const NRM = { top: [0, -1], bottom: [0, 1], rung: [-1, 0], source: [-1, 0] };
    const brackets = []; const joins = [];
    for (const m of meters) {
      const q = m.across; const [nx, ny] = NRM[q.side] || [0, -1]; const off = OFF * (m.nth + 1);
      const dx = Math.cos(q.ang); const dy = Math.sin(q.ang); const r = reach(q);
      const ax = q.x - dx * r; const ay = q.y - dy * r; const bx = q.x + dx * r; const by = q.y + dy * r;
      m.x = q.x + nx * off; m.y = q.y + ny * off; m.nrm = [nx, ny];
      brackets.push([ax, ay, ax + nx * off, ay + ny * off, m.x - dx * 21, m.y - dy * 21], [m.x + dx * 21, m.y + dy * 21, bx + nx * off, by + ny * off, bx, by]);
      joins.push([ax, ay], [bx, by]);
    }
    // label boxes
    for (const p of parts) {
      const { w, h } = p.lab;
      if (!w) continue;
      let x; let y; let align = 'center';
      const inward = metersOn(p).length > 0;
      if (p.side === 'top') { x = p.x - w / 2; y = inward ? p.y + p.acr + 10 : p.y - p.acr - 10 - h; }
      else if (p.side === 'bottom') { x = p.x - w / 2; y = inward ? p.y - p.acr - 10 - h : p.y + p.acr + 10; }
      else if (p.side === 'rung' || p.side === 'source') { x = p.x + p.acr + (p.side === 'source' ? 14 : 12); y = p.y - h / 2; align = 'left'; }
      else { // a voltmeter: beyond its meter, away from the circuit
        const [nx, ny] = p.nrm;
        if (ny < 0) { x = p.x - w / 2; y = p.y - 21 - 8 - h; } else if (ny > 0) { x = p.x - w / 2; y = p.y + 21 + 8; } else { x = p.x - 21 - 10 - w; y = p.y - h / 2; align = 'right'; }
        void nx;
      }
      p.box = { x: clamp(x, 4, 796 - w), y, w, h, align };
    }
    // wires: paths in the direction current flows, each with the current it carries
    const aS = src ? src.along : 0;
    const paths = [];
    const add = (pts, k) => { const pa = mkPath(pts); pa.k = k; pa.cuts = []; paths.push(pa); };
    if (series) add([xL, yc - aS, xL, yT, xR, yT, xR, yB, xL, yB, xL, yc + aS], { main: true });
    else {
      add([xL, yc - aS, xL, yT, xs[0], yT], { main: true });
      for (let k = 0; k + 1 < xs.length; k++) add([xs[k], yT, xs[k + 1], yT], { after: k });
      xs.forEach((x, k) => add([x, yT, x, yB], { rung: k }));
      for (let k = xs.length - 2; k >= 0; k--) add([xs[k + 1], yB, xs[k], yB], { after: k });
      add([xs[0], yB, xL, yB, xL, yc + aS], { main: true });
      for (let k = 0; k + 1 < xs.length; k++) joins.push([xs[k], yT], [xs[k], yB]);
    }
    const dOn = (pa, x, y) => {
      for (let i = 1; i < pa.cum.length; i++) {
        const x0 = pa.pts[2 * i - 2]; const y0 = pa.pts[2 * i - 1]; const x1 = pa.pts[2 * i]; const y1 = pa.pts[2 * i + 1];
        const len = pa.cum[i] - pa.cum[i - 1]; if (!len) continue;
        const u = ((x - x0) * (x1 - x0) + (y - y0) * (y1 - y0)) / (len * len);
        if (u < -1e-6 || u > 1 + 1e-6) continue;
        if (Math.hypot(x0 + u * (x1 - x0) - x, y0 + u * (y1 - y0) - y) < 1) return pa.cum[i - 1] + u * len;
      }
      return -1;
    };
    for (const p of parts) {
      if (p.side === 'meter' || p.side === 'source') continue;
      for (const pa of paths) { const d = dOn(pa, p.x, p.y); if (d >= 0) { p.path = pa; pa.cuts.push([d - p.along, d + p.along]); break; } }
    }
    for (const pa of paths) {
      pa.cuts.sort((a, c) => a[0] - c[0]);
      pa.gaps = []; let d = 0;
      for (const [a, c] of pa.cuts) { if (a > d) pa.gaps.push([d, a]); d = Math.max(d, c); }
      if (d < pa.total) pa.gaps.push([d, pa.total]);
    }
    // currents and dot speeds on every wire
    const cur = (pa, S) => (pa.k.main ? S.main : pa.k.rung != null ? S.rungs[pa.k.rung] ?? 0 : S.rungs.slice(pa.k.after + 1).reduce((s, v) => s + v, 0));
    const Imax = Math.max(0, ...paths.flatMap((pa) => [cur(pa, I0), cur(pa, I1)]));
    const speed = (I) => (Imax <= 0 || I <= Imax * 1e-6 ? 0 : known ? Math.max(16, (125 * I) / Imax) : 80);
    const diode = (li) => li.some((p) => p.kind === 'diode' || p.kind === 'led');
    const halfSet = (ks) => { const on = ks.filter((k) => I1.rungs[k] > 0); return on.length > 0 && on.every((k) => diode(branches[k])); };
    for (const pa of paths) {
      pa.I0 = cur(pa, I0); pa.I1 = cur(pa, I1); pa.v0 = speed(pa.I0); pa.v1 = speed(pa.I1);
      const ks = pa.k.rung != null ? [pa.k.rung] : pa.k.main ? branches.map((_, k) => k) : branches.map((_, k) => k).filter((k) => k > pa.k.after);
      pa.half = ac && (diode(main) || (!series && halfSet(ks)));
    }
    // how bright each bulb can get (by power when the values are known)
    const pw = (p, I) => I * I * (known ? reading(p.value, 'Ω') ?? 1 : 1);
    const bulbs = parts.filter((p) => (p.kind === 'bulb' || p.kind === 'led') && p.path);
    const Pmax = Math.max(1e-12, ...bulbs.map((p) => Math.max(pw(p, p.path.I0), pw(p, p.path.I1))));
    return { parts, src, ac, known, trans, paths, brackets, joins, reads, capY, hasNotes, pw, Pmax, yT, yB, xL, xR, series, n: parts.length };
  }
  // One schematic symbol, drawn along +x (the way current flows) then turned into place.
  function drawSymbol(ctx, p, t, st) {
    const a = p.along; const e = st.e;
    const col = tint(p.c, 0.8 + 0.2 * e);
    const L2 = (x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
    ctx.save(); ctx.translate(p.x, p.y);
    if (e > 0.05) glow(ctx, color(p.c), 16 * e);
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3 + e; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (p.kind === 'block') {
      ctx.fillStyle = 'rgba(8,12,30,0.92)'; rounded(ctx, -p.bw / 2, -p.bh / 2, p.bw, p.bh, 10); ctx.fill();
      ctx.fillStyle = tint(p.c, 0.14 + 0.12 * e); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      const f = p.bf; ctx.font = `700 ${f.size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color(e > 0.5 ? p.c : 'ink');
      f.lines.forEach((l, j) => ctx.fillText(l, 0, (j - (f.lines.length - 1) / 2) * f.size * 1.22 + 1));
      ctx.restore();
      return;
    }
    ctx.rotate(p.ang);
    switch (p.kind) {
      case 'resistor': {
        ctx.beginPath(); ctx.moveTo(-a, 0); ctx.lineTo(-a + 6, 0);
        const n = 6; const w = (2 * a - 12) / n;
        for (let i = 0; i < n; i++) ctx.lineTo(-a + 6 + w * (i + 0.5), i % 2 ? 11 : -11);
        ctx.lineTo(a - 6, 0); ctx.lineTo(a, 0); ctx.stroke();
        break;
      }
      case 'capacitor': {
        L2(-a, 0, -5, 0); L2(5, 0, a, 0);
        ctx.lineWidth = 4 + e; L2(-5, -22, -5, 22); L2(5, -22, 5, 22);
        if (Math.abs(st.q) > 0.03) { ctx.fillStyle = tint(p.c, 0.25 * Math.abs(st.q)); ctx.fillRect(-4, -21, 8, 42); }
        break;
      }
      case 'inductor': {
        const r = (2 * a - 8) / 8;
        ctx.beginPath(); ctx.moveTo(-a, 0); ctx.lineTo(-a + 4, 0);
        for (let i = 0; i < 4; i++) ctx.arc(-a + 4 + r * (2 * i + 1), 0, r, PI, 0);
        ctx.lineTo(a, 0); ctx.stroke();
        break;
      }
      case 'bulb': {
        const br = clamp(st.bright);
        if (br > 0.02) {
          ctx.save(); ctx.shadowBlur = 0;
          const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 46);
          g.addColorStop(0, tint('yellow', 0.55 * br)); g.addColorStop(1, tint('yellow', 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 46, 0, TAU); ctx.fill();
          glow(ctx, color('yellow'), 24 * br);
          ctx.fillStyle = tint('yellow', 0.2 + 0.6 * br); ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); ctx.fill();
          ctx.restore();
        } else { ctx.fillStyle = 'rgba(8,12,30,0.9)'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); ctx.fill(); }
        ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); ctx.stroke();
        ctx.lineWidth = 2.5; L2(-14, -14, 14, 14); L2(-14, 14, 14, -14);
        break;
      }
      case 'switch': {
        const k = a - 4;
        ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(-k, 0, 4, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(k, 0, 4, 0, TAU); ctx.stroke();
        ctx.lineWidth = 3.5 + e;
        const ang = p.open ? -0.5 : 0; const len = 2 * k;
        L2(-k + 3, 0, -k + Math.cos(ang) * len, Math.sin(ang) * len);
        break;
      }
      case 'diode': case 'led': {
        L2(-a, 0, -11, 0); L2(10, 0, a, 0);
        const lit = p.kind === 'led' ? clamp(st.bright) : 0;
        ctx.beginPath(); ctx.moveTo(-11, -12); ctx.lineTo(-11, 12); ctx.lineTo(10, 0); ctx.closePath();
        ctx.fillStyle = tint(p.c, 0.22 + 0.6 * lit); ctx.fill(); ctx.stroke();
        L2(10, -12, 10, 12);
        if (p.kind === 'led') {
          if (lit > 0.05) glow(ctx, color(p.c), 22 * lit);
          ctx.lineWidth = 2.2;
          for (const o of [-4, 6]) { L2(o, -15, o + 9, -25); head(ctx, o + 10, -26.5, -0.84, 6, tint(p.c, 0.6 + 0.4 * Math.max(lit, 0.3))); }
        }
        break;
      }
      case 'motor': {
        ctx.fillStyle = 'rgba(8,12,30,0.9)'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 2.5; ctx.strokeStyle = tint(p.c, 0.55);
        for (let k = 0; k < 3; k++) { const q = st.spin + (k * TAU) / 3; ctx.beginPath(); ctx.arc(0, 0, 16, q, q + 0.7); ctx.stroke(); }
        break;
      }
      case 'fuse': {
        ctx.fillStyle = 'rgba(8,12,30,0.9)'; rounded(ctx, -a + 4, -9, 2 * a - 8, 18, 4); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 2; L2(-a, 0, a, 0);
        break;
      }
      case 'ammeter': case 'voltmeter': case 'ac': {
        const r = p.kind === 'ac' ? 22 : 20;
        ctx.fillStyle = 'rgba(8,12,30,0.9)'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
        ctx.fillStyle = tint(p.c, 0.08 + 0.12 * e); ctx.fill(); ctx.stroke();
        break;
      }
      case 'cell': {
        L2(-a, 0, -5, 0); L2(5, 0, a, 0);
        ctx.lineWidth = 7; L2(-5, -11, -5, 11);
        ctx.lineWidth = 3 + e; L2(5, -22, 5, 22);
        break;
      }
      default:
    }
    ctx.restore();
    // upright marks
    const up = (lx, ly) => [p.x + lx * Math.cos(p.ang) - ly * Math.sin(p.ang), p.y + lx * Math.sin(p.ang) + ly * Math.cos(p.ang)];
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (p.kind === 'ammeter' || p.kind === 'voltmeter' || p.kind === 'motor') {
      ctx.font = `800 20px ${FONT}`; ctx.fillStyle = color(e > 0.3 ? p.c : WHITE);
      ctx.fillText(p.kind === 'ammeter' ? 'A' : p.kind === 'voltmeter' ? 'V' : 'M', p.x, p.y + 1);
    } else if (p.kind === 'cell') {
      const [x, y] = up(15, 17); ctx.font = `800 18px ${FONT}`; ctx.fillStyle = color(p.c); ctx.fillText('+', x, y);
    } else if (p.kind === 'ac') {
      ctx.strokeStyle = tint(p.c, 0.9); ctx.lineWidth = 2.5; ctx.beginPath();
      for (let i = 0; i <= 24; i++) { const u = i / 24; const x = p.x - 13 + 26 * u; const y = p.y - 7 * Math.sin(u * TAU); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke();
    } else if (p.kind === 'capacitor' && Math.abs(st.q) > 0.03) {
      ctx.globalAlpha *= clamp(Math.abs(st.q) * 1.4); ctx.font = `800 17px ${FONT}`;
      const s = st.q > 0 ? 1 : -1;
      let [x, y] = up(-13 * s, 28); ctx.fillStyle = color('red'); ctx.fillText('+', x, y);
      [x, y] = up(13 * s, 28); ctx.fillStyle = color('blue'); ctx.fillText('−', x, y);
    }
    ctx.restore();
  }
  function drawCircuit(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layCircuit(ctx, it, top));
    if (L.empty) { nothing(ctx, 'A circuit needs some parts'); ctx.restore(); return; }
    if (L.preset) { drawPreset(b, ctx, it, t, L); ctx.restore(); return; }
    const F = focusOf(it, L.n, t, 1.8, 2.6);
    const s = Math.max(0, t - 1);
    const decay = L.trans ? Math.exp(-s / CK_TAU) : 0;
    const Inow = (pa) => (pa ? pa.I1 + (pa.I0 - pa.I1) * decay : 0);
    const travel = (pa) => {
      if (L.ac) {
        const amp = pa.v1 / CK_W; const ph = CK_W * s;
        if (!pa.half) return amp * Math.sin(ph);
        const m = mod(ph, TAU);
        return amp * (2 * Math.floor(ph / TAU) + (m < PI ? 1 - Math.cos(m) : 2));
      }
      return L.trans ? pa.v1 * s + (pa.v0 - pa.v1) * CK_TAU * (1 - decay) : pa.v1 * s;
    };
    // the wires, cut where the parts sit
    ctx.save(); ctx.globalAlpha *= after(t, 0.05, 0.6);
    ctx.strokeStyle = 'rgba(205,216,255,0.82)'; ctx.lineWidth = 3;
    for (const pa of L.paths) for (const [d0, d1] of pa.gaps) strokePath(ctx, pa, d0, d1);
    ctx.lineWidth = 2.5; ctx.strokeStyle = tint('cyan', 0.6);
    for (const br of L.brackets) { ctx.beginPath(); ctx.moveTo(br[0], br[1]); for (let i = 2; i < br.length; i += 2) ctx.lineTo(br[i], br[i + 1]); ctx.stroke(); }
    for (const [x, y] of L.joins) dot(ctx, x, y, 5.5, WHITE);
    ctx.restore();
    // the current: dots of conventional current, + to −
    const dotsA = after(t, 0.8, 0.6);
    if (dotsA > 0) {
      ctx.save(); ctx.globalAlpha *= dotsA;
      for (const pa of L.paths) {
        const moving = pa.v0 > 0 || pa.v1 > 0;
        const nD = Math.max(1, Math.round(pa.total / 34)); const gap = pa.total / nD;
        const d = moving ? travel(pa) : 0;
        const lvl = L.ac ? 1 : moving ? clamp(0.35 + 0.65 * (pa.v1 + (pa.v0 - pa.v1) * decay) / Math.max(pa.v0, pa.v1, 1)) : 0.5;
        ctx.globalAlpha = dotsA * lvl * (moving ? 1 : 0.9);
        if (moving) glow(ctx, color('yellow'), 9);
        ctx.fillStyle = moving ? color('yellow') : tint('yellow', 0.55);
        for (let k = 0; k < nD; k++) {
          const pos = mod(k * gap + d, pa.total);
          if (pa.cuts.some(([c0, c1]) => pos > c0 - 5 && pos < c1 + 5)) continue;
          if (pa.k.main && (pos < 5 || pos > pa.total - 5)) continue;
          const q = at(pa, pos);
          ctx.beginPath(); ctx.arc(q.x, q.y, moving ? 4.6 : 3.6, 0, TAU); ctx.fill();
        }
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }
    // nothing flowing round a plain loop: say so in the middle of it
    if (L.src && L.series && !L.paths.some((pa) => pa.v0 > 0 || pa.v1 > 0)) {
      const msg = it.flow === false ? 'No current flowing' : L.parts.some((p) => p.kind === 'switch' && p.open) ? 'Switch open: no current' : 'No current flows';
      ctx.font = `700 18px ${FONT}`; const w = ctx.measureText(msg).width + 26;
      const x0 = L.src.box ? L.src.box.x + L.src.box.w + 18 : L.xL + 40;
      const cx = Math.max((L.xL + L.xR) / 2, x0 + w / 2);
      if (cx + w / 2 < L.xR - 14) { ctx.save(); ctx.globalAlpha *= after(t, 1.2, 0.6); chip(ctx, msg, cx, (L.yT + L.yB) / 2, 'muted', 18); ctx.restore(); }
    }
    // the parts
    for (const p of L.parts) {
      const a = after(t, 0.15 + p.i * 0.1, 0.5);
      if (a <= 0) continue;
      const I = Inow(p.path);
      const st = { e: F.e(p.i), bright: 0, spin: 0, q: 0 };
      if ((p.kind === 'bulb' || p.kind === 'led') && p.path) st.bright = Math.sqrt(clamp(L.pw(p, I) / L.Pmax)) * (p.path.half ? 0.75 : 1) * smooth((t - 0.9) / 0.6);
      if (p.kind === 'motor' && p.path) st.spin = L.ac ? (p.path.v1 * s) / 18 : travel(p.path) / 18;
      if (p.kind === 'capacitor' && p.path) st.q = L.ac ? Math.sin(CK_W * s - PI / 2) * (p.path.v1 > 0 ? 1 : 0) : p.path.I0 > 0 ? 1 - decay : 0;
      if (p.kind === 'capacitor' && !p.path && L.trans) st.q = 0;
      ctx.save(); ctx.globalAlpha *= a * F.dim(p.i);
      drawSymbol(ctx, p, t, st);
      if (p.box) drawLabelBlock(ctx, p.lab, p.box, p.c, st.e);
      ctx.restore();
      const r = Math.max(p.along, p.acr) + 6;
      hitIn(b, askOf(p, p.label), p.x - r, p.y - r, 2 * r, 2 * r);
      if (p.box) hitIn(b, askOf(p, p.label), p.box.x - 6, p.box.y - 4, p.box.w + 12, p.box.h + 8);
    }
    circuitFoot(b, ctx, t, L, F);
    ctx.restore();
  }
  // Readouts in a panel at the foot, the highlighted part's note, the hint.
  function circuitFoot(b, ctx, t, L, F) {
    // readouts in a panel at the foot
    if (L.reads.length) {
      const a = after(t, 1.3, 0.6);
      const x0 = 40; const w = 720; const y0 = 612; const h = 38; const cw = w / L.reads.length;
      ctx.save(); ctx.globalAlpha *= a;
      ctx.fillStyle = 'rgba(5,8,22,0.8)'; rounded(ctx, x0, y0, w, h, 12); ctx.fill();
      ctx.fillStyle = tint('cyan', 0.06); ctx.fill(); ctx.strokeStyle = tint('cyan', 0.4); ctx.lineWidth = 1.5; ctx.stroke();
      L.reads.forEach((r, i) => {
        const cx = x0 + cw * (i + 0.5);
        if (i) line(ctx, x0 + cw * i, y0 + 8, x0 + cw * i, y0 + h - 8, tint('cyan', 0.3), 1.5);
        const f = fitLines(ctx, r, cw - 20, 19, 700, 1, 14);
        const k = f.lines[0].indexOf('=');
        ctx.font = `700 ${f.size}px ${FONT}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        let x = cx - ctx.measureText(f.lines[0]).width / 2;
        if (k > 0) { const l = f.lines[0].slice(0, k + 1); ctx.fillStyle = color('muted'); ctx.fillText(l, x, y0 + h / 2 + 1); x += ctx.measureText(l).width; ctx.fillStyle = color('yellow'); ctx.fillText(f.lines[0].slice(k + 1), x, y0 + h / 2 + 1); } else { ctx.fillStyle = color('ink'); ctx.fillText(f.lines[0], x, y0 + h / 2 + 1); }
        hitIn(b, `Where does ${r} come from?`, x0 + cw * i, y0, cw, h);
      });
      ctx.restore();
    }
    if (L.hasNotes && F.k >= 0) {
      const [k, a] = F.shown; const p = L.parts.find((q) => q.i === k);
      if (p && p.note) caption(ctx, p.note, L.capY, 'ink', a * after(t, 1.4, 0.5));
    }
    hint(ctx, t, b);
  }
  // ─── x-circuit stages: op-amps and transistors drawn the textbook way ─
  // `layout` names a stage whose parts are matched by role (circuitRoles in
  // the spec). Each layout below is a fixed drawing in the figure box: wires
  // as polylines, grounds, junction dots, and current paths whose speeds come
  // from the stage worked out with its values (golden rules for op-amps, βI_B
  // for a BJT, no gate current for a MOSFET).
  const ckLab = (ctx, p, maxW, lines = 2) => {
    const lf = measure(ctx, p.label, maxW, 19, 700, lines, 15);
    const vf = p.value ? measure(ctx, p.value, maxW, 17, 700, 1, 14) : null;
    return { lf, vf, w: Math.max(lf.w, vf ? vf.w : 0), h: lf.h + (vf ? 22 : 0) };
  };
  function layPreset(ctx, it, top, parts, layout, roles) {
    const R = (name) => (roles[name] != null ? parts[roles[name]] : null);
    const wires = []; const grounds = []; const joins = []; const terms = []; const flows = []; const decor = [];
    const reads = arr(it.readouts, 3).map((r) => str(r)).filter(Boolean);
    const hasNotes = parts.some((p) => p.note);
    const capY = reads.length ? 584 : 622;
    const ohm = (p) => (p ? reading(p.value, 'Ω') : null);
    const volt = (p) => (p ? reading(p.value, 'V') : null);
    const boxOf = (p, side, gap) => {
      const { w, h } = p.lab; const g = gap ?? p.acr + 10;
      let x; let y; let align = 'center';
      if (side === 'above') { x = p.x - w / 2; y = p.y - g - h; } else if (side === 'below') { x = p.x - w / 2; y = p.y + g; } else if (side === 'right') { x = p.x + g; y = p.y - h / 2; align = 'left'; } else { x = p.x - g - w; y = p.y - h / 2; align = 'right'; }
      return { x: clamp(x, 4, 796 - w), y, w, h, align };
    };
    // a standard part on a wire, its label on one side
    const put = (p, x, y, ang, side, maxW = 150) => {
      if (!p) return;
      Object.assign(p, { x, y, ang, along: CK_ALONG[p.kind] ?? 30, acr: CK_ACROSS[p.kind] ?? 20 });
      p.lab = ckLab(ctx, p, maxW); p.box = boxOf(p, side);
    };
    const flow = (pts, I, osc) => flows.push({ pts, I, osc });
    let vout = null; let outAt = null; let on = true; let gate = false;
    const src0 = parts[0]; const ac = src0 && src0.kind === 'ac';
    if (layout === 'inverting' || layout === 'non-inverting' || layout === 'follower') {
      const inv = layout === 'inverting';
      const cy = inv ? 300 : 270; const lx = 360; const tx = 500; const hh = 70;
      const yTop = cy - 38; const yBot = cy + 38; // the pins
      const ox = 560; const outX = 660; const gy = inv ? 470 : 510; const sx = inv ? 100 : 110;
      const src = R('input'); const op = R('opamp'); const load = R('load'); const rf = R('R_f');
      const rin = R('R_in'); const rg = R('R_g');
      const Vin = volt(src);
      // the op-amp: − on top for the inverting amp (input there), + on top otherwise
      Object.assign(op, { x: (lx + tx) / 2, y: cy, ang: 0, along: 70, acr: 70, tri: { lx, tx, cy, hh, minusTop: inv } });
      op.lab = ckLab(ctx, op, 170); op.box = boxOf(op, inv ? 'below' : 'above', hh + 12);
      if (inv) {
        const ax = 300; const yf = 180;
        put(src, sx, 370, -PI / 2, 'right', 150); put(rin, 200, yTop, 0, 'below'); put(rf, 430, yf, 0, 'above');
        wires.push([sx, gy, sx, yTop, lx, yTop], [ax, yTop, ax, yf, ox, yf, ox, cy], [lx, yBot, 330, yBot, 330, gy]);
        grounds.push([sx, gy], [330, gy]); joins.push([ax, yTop]);
        const Ri = ohm(rin); const Rf = ohm(rf);
        const Iin = Vin != null && Ri ? Vin / Ri : null;
        vout = Vin != null && Ri && Rf ? -Vin * (Rf / Ri) : null;
        flow([sx, gy, sx, yTop, ax, yTop, ax, yf, ox, yf, ox, cy, tx, cy], Iin ?? 1, ac);
        if (load) { const RL = ohm(load); flow([outX, gy, outX, cy, tx, cy], vout != null && RL ? Math.abs(vout) / RL : 1, ac); }
      } else {
        put(src, sx, 380, -PI / 2, 'right', 150);
        wires.push([sx, gy, sx, yTop, lx, yTop]);
        grounds.push([sx, gy]);
        if (layout === 'non-inverting') {
          const ax = 300; const ay = 400;
          put(rf, 430, ay, 0, 'below'); put(rg, ax, 455, PI / 2, 'left', 140);
          wires.push([lx, yBot, ax, yBot, ax, ay], [ax, ay, ox, ay, ox, cy], [ax, ay, ax, gy]);
          grounds.push([ax, gy]); joins.push([ax, ay]);
          const Rg = ohm(rg); const Rf = ohm(rf);
          vout = Vin != null && Rg && Rf != null ? Vin * (1 + Rf / Rg) : null;
          flow([tx, cy, ox, cy, ox, ay, ax, ay, ax, gy], Vin != null && Rg ? Vin / Rg : 1, ac);
        } else {
          wires.push([lx, yBot, 320, yBot, 320, 380, ox, 380, ox, cy]);
          vout = Vin;
        }
        if (load) { const RL = ohm(load); flow([tx, cy, outX, cy, outX, gy], vout != null && RL ? Math.abs(vout) / RL : 1, ac); }
      }
      wires.push([tx, cy, outX, cy]); joins.push([ox, cy]);
      if (load) { put(load, outX, inv ? 385 : 390, PI / 2, 'right', 110); wires.push([outX, cy, outX, gy]); grounds.push([outX, gy]); } else terms.push([outX, cy]);
      outAt = [outX + (load ? 12 : 16), cy - (load ? 24 : 0)];
    } else {
      // transistor stages: the supply rail on top, the load down to the collector/drain
      const ce = layout === 'common-emitter';
      const sup = R('supply'); const q = R('transistor'); const inp = R('input');
      const mos = q.kind === 'nmos';
      const rail = ce ? 120 : 130; const gy = ce ? 530 : 520; const sx = 80;
      const tx = 520; const ty = ce ? 330 : 360; const cx = tx + 20; const bx = tx - 40;
      const Vcc = volt(sup) ?? 9;
      const beta = (() => { const m = str(q.value).match(/(?:β|beta|hFE|h_FE)\s*[=≈:]?\s*(\d+(?:\.\d+)?)/i); return m ? +m[1] : 100; })();
      Object.assign(q, { x: tx, y: ty, ang: 0, along: 44, acr: 44, cx, bx, mos });
      q.lab = ckLab(ctx, q, 150); q.box = { ...boxOf(q, 'right', 0), x: cx + 34 + 12, align: 'left' };
      put(sup, sx, (rail + gy) / 2, -PI / 2, 'right', ce && inp ? 100 : 130);
      grounds.push([sx, gy], [cx, gy]);
      let Ic; let Ib; let Idiv = 0;
      if (!ce) {
        const load = R('load'); const rb = R('R_B'); const meter = R('meter');
        const ix = 250;
        put(load, cx, meter ? 195 : 210, PI / 2, 'right', 140);
        if (meter) put(meter, cx, 268, PI / 2, 'right', 140);
        put(rb, 370, ty, 0, 'above');
        wires.push([sx, gy, sx, rail, cx, rail, cx, ty - 50], [cx, ty + 50, cx, gy], [ix, ty, bx, ty]);
        let Vin = Vcc; let feed;
        if (inp && inp.kind !== 'switch') {
          put(inp, ix, 440, -PI / 2, 'right', 140);
          wires.push([ix, gy, ix, ty]); grounds.push([ix, gy]);
          Vin = volt(inp) ?? (inp.kind === 'ac' ? 1 : Vcc);
          feed = [ix, gy, ix, ty, bx, ty];
        } else {
          if (inp) put(inp, ix, 236, PI / 2, 'right', 140);
          wires.push([ix, rail, ix, ty]); joins.push([ix, rail]);
          if (inp && inp.open) on = false;
          feed = [ix, rail, ix, ty, bx, ty];
        }
        if (Vin <= (mos ? 2 : 0.7) && !(inp && inp.kind === 'ac')) on = false;
        const RB = ohm(rb); const RL = ohm(load);
        Ib = mos ? 0 : RB ? Math.max(0, Vin - 0.7) / RB : 1;
        Ic = mos ? (RL ? Vcc / RL : 1) : RB ? beta * Ib : 100;
        if (!mos && RL) Ic = Math.min(Ic, Vcc / RL);
        if (!on) { Ib = 0; Ic = 0; }
        flow([sx, gy, sx, rail, cx, rail, cx, ty - 50], Ic, false);
        flow([cx, ty + 50, cx, gy], Ic, false);
        if (!mos) flow(feed, Ib, inp && inp.kind === 'ac');
        gate = mos && on;
      } else {
        const r1 = R('R1'); const r2 = R('R2'); const rc = R('R_C'); const re = R('R_E');
        const dx = 330;
        put(r1, dx, 205, PI / 2, 'right', 140); put(r2, dx, 440, PI / 2, 'right', 140);
        put(rc, cx, 205, PI / 2, 'right', 140); put(re, cx, 445, PI / 2, 'right', 140);
        wires.push([sx, gy, sx, rail, cx, rail, cx, ty - 50], [dx, rail, dx, gy], [dx, ty, bx, ty], [cx, ty + 50, cx, gy]);
        grounds.push([dx, gy]); joins.push([dx, rail], [dx, ty]);
        if (inp) {
          const ix = 200;
          put(inp, ix, 440, -PI / 2, 'left', 90);
          wires.push([ix, gy, ix, ty, dx, ty]); grounds.push([ix, gy]);
          decor.push({ kind: 'capacitor', x: 265, y: ty, ang: 0, along: 12, acr: 24, c: 'cyan' });
        }
        const R1 = ohm(r1); const R2 = ohm(r2); const RE = ohm(re); const RC = ohm(rc);
        const known = R1 && R2 && RE;
        const VB = known ? (Vcc * R2) / (R1 + R2) : Vcc / 4;
        const IE = known ? Math.max(0, VB - (mos ? 2 : 0.7)) / RE : 1;
        Ic = RC ? Math.min(IE, Vcc / (RC + (RE || 0))) : IE;
        Ib = mos ? 0 : Ic / beta; Idiv = known ? Vcc / (R1 + R2) : Ic / 8;
        if (it.flow === false || IE <= 0) { on = false; Ic = 0; Ib = 0; Idiv = it.flow === false ? 0 : Idiv; }
        flow([sx, gy, sx, rail, dx, rail], Ic + Idiv, false);
        flow([dx, rail, cx, rail, cx, ty - 50], Ic, false);
        flow([cx, ty + 50, cx, gy], Ic + Ib, false);
        flow([dx, rail, dx, ty], Idiv + Ib, false);
        flow([dx, ty, dx, gy], Idiv, false);
        if (!mos) flow([dx, ty, bx, ty], Ib, false);
        if (inp && inp.kind === 'ac' && on) flow([200, gy, 200, ty, dx - 26, ty], Math.max(Ib, Idiv) * 0.6, true);
        gate = mos && on;
      }
    }
    if (it.flow === false) { on = false; for (const f of flows) f.I = 0; gate = false; }
    // speeds: the biggest current runs at 120 px/s, small ones never quite stop
    const Imax = Math.max(0, ...flows.map((f) => f.I));
    for (const f of flows) {
      f.pa = mkPath(f.pts);
      f.v = Imax > 0 && f.I > Imax * 1e-6 ? Math.max(14, (120 * f.I) / Imax) : 0;
      f.small = f.v > 0 && f.I < Imax * 0.12;
    }
    // where parts sit on wires and paths (no wire or dots there)
    const placed = parts.filter((p) => p.lab && !p.tri && p.kind !== 'npn' && p.kind !== 'nmos').concat(decor);
    const dOn = (pa, x, y) => {
      for (let i = 1; i < pa.cum.length; i++) {
        const x0 = pa.pts[2 * i - 2]; const y0 = pa.pts[2 * i - 1]; const x1 = pa.pts[2 * i]; const y1 = pa.pts[2 * i + 1];
        const len = pa.cum[i] - pa.cum[i - 1]; if (!len) continue;
        const u = ((x - x0) * (x1 - x0) + (y - y0) * (y1 - y0)) / (len * len);
        if (u < -1e-6 || u > 1 + 1e-6) continue;
        if (Math.hypot(x0 + u * (x1 - x0) - x, y0 + u * (y1 - y0) - y) < 1) return pa.cum[i - 1] + u * len;
      }
      return -1;
    };
    const cutsOf = (pa) => placed.map((p) => { const d = dOn(pa, p.x, p.y); return d >= 0 ? [d - p.along, d + p.along] : null; }).filter(Boolean).sort((a, c) => a[0] - c[0]);
    const W = wires.map((pts) => { const pa = mkPath(pts); const cuts = cutsOf(pa); const gaps = []; let d = 0; for (const [a, c] of cuts) { if (a > d) gaps.push([d, a]); d = Math.max(d, c); } if (d < pa.total) gaps.push([d, pa.total]); return { pa, gaps }; });
    for (const f of flows) { f.cuts = cutsOf(f.pa); f.on = placed.filter((p) => dOn(f.pa, p.x, p.y) >= 0); }
    // the output tag: V out, worked out when the values allow
    let tag = null;
    if (outAt) {
      const s = vout != null && Number.isFinite(vout) ? `V out = ${fmt(+vout.toPrecision(3))} V${ac ? ' peak' : ''}` : 'V out';
      const f = measure(ctx, s, 130, 17, 700, 1, 13);
      tag = { s, f, x: outAt[0], y: outAt[1], w: Math.min(f.w + 22, 790 - outAt[0]) };
    }
    return { preset: layout, parts, n: parts.length, wires: W, grounds, joins, terms, flows, decor, tag, on, gate, ac, reads, capY, hasNotes };
  }
  // The op-amp: a triangle with − and + inputs and its output at the tip.
  function drawOpamp(ctx, p, e) {
    const { lx, tx, cy, hh, minusTop } = p.tri;
    if (e > 0.05) glow(ctx, color(p.c), 16 * e);
    ctx.fillStyle = 'rgba(8,12,30,0.92)'; ctx.beginPath(); ctx.moveTo(lx, cy - hh); ctx.lineTo(tx, cy); ctx.lineTo(lx, cy + hh); ctx.closePath(); ctx.fill();
    ctx.fillStyle = tint(p.c, 0.12 + 0.12 * e); ctx.fill();
    ctx.strokeStyle = tint(p.c, 0.85 + 0.15 * e); ctx.lineWidth = 3 + e; ctx.lineJoin = 'round'; ctx.stroke(); ctx.shadowBlur = 0;
    ctx.font = `800 24px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = color('cyan'); ctx.fillText(minusTop ? '−' : '+', lx + 18, cy - 37);
    ctx.fillStyle = color('red'); ctx.fillText(minusTop ? '+' : '−', lx + 18, cy + 39);
  }
  // A transistor: an npn BJT (arrow on the emitter) or an n-channel MOSFET (insulated gate).
  function drawTransistor(ctx, p, e, on, gate, t) {
    const { x: tx, y: ty, cx, bx, mos } = p;
    const col = tint(p.c, 0.85 + 0.15 * e);
    const L2 = (a, b2, c, d) => { ctx.beginPath(); ctx.moveTo(a, b2); ctx.lineTo(c, d); ctx.stroke(); };
    if (e > 0.05) glow(ctx, color(p.c), 16 * e);
    ctx.fillStyle = 'rgba(8,12,30,0.9)'; ctx.beginPath(); ctx.arc(tx + 8, ty, 36, 0, TAU); ctx.fill();
    ctx.fillStyle = tint(p.c, 0.06 + 0.1 * e); ctx.fill();
    ctx.strokeStyle = tint(p.c, 0.55 + 0.3 * e); ctx.lineWidth = 2; ctx.stroke(); ctx.shadowBlur = 0;
    ctx.strokeStyle = col; ctx.lineWidth = 3 + e; ctx.lineCap = 'round';
    if (!mos) {
      L2(bx, ty, tx - 8, ty); // base lead
      ctx.lineWidth = 5 + e; L2(tx - 8, ty - 20, tx - 8, ty + 20);
      ctx.lineWidth = 3 + e;
      L2(tx - 8, ty - 9, cx, ty - 28); L2(cx, ty - 28, cx, ty - 50);
      L2(tx - 8, ty + 9, cx, ty + 28); L2(cx, ty + 28, cx, ty + 50);
      const a = Math.atan2(28 - 9, cx - (tx - 8));
      head(ctx, tx - 8 + (cx - tx + 8) * 0.78, ty + 9 + 19 * 0.78, a, 10, tint(p.c, 0.95));
    } else {
      const gx = tx - 16; const chx = tx - 4;
      L2(bx, ty, gx, ty); // gate lead
      ctx.lineWidth = 4 + e; L2(gx, ty - 24, gx, ty + 24); // the gate plate, insulated from the channel
      ctx.lineWidth = 4 + e; for (const [a0, a1] of [[-26, -12], [-6, 6], [12, 26]]) L2(chx, ty + a0, chx, ty + a1);
      ctx.lineWidth = 3 + e;
      L2(chx, ty - 19, cx, ty - 19); L2(cx, ty - 19, cx, ty - 50);
      L2(chx, ty + 19, cx, ty + 19); L2(cx, ty + 19, cx, ty + 50);
      L2(chx + 2, ty, cx, ty); L2(cx, ty, cx, ty + 19);
      head(ctx, chx + 3, ty, PI, 9, tint(p.c, 0.95));
      if (gate) { // a charged gate: + on the plate, a channel of − drawn up under it
        const pulse = 0.75 + 0.25 * Math.sin(t * 3);
        ctx.save(); glow(ctx, color('yellow'), 12 * pulse); ctx.strokeStyle = tint('yellow', 0.9); ctx.lineWidth = 4; L2(gx, ty - 24, gx, ty + 24); ctx.restore();
        ctx.font = `800 13px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = color('red'); for (const dy of [-15, 15]) ctx.fillText('+', gx - 8, ty + dy);
        ctx.fillStyle = color('blue'); ctx.fillRect(chx + 3, ty - 26, 3, 52);
      }
    }
    ctx.font = `700 14px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color('muted');
    const [b1, c1, e1] = mos ? ['G', 'D', 'S'] : ['B', 'C', 'E'];
    ctx.fillText(b1, bx + 2, ty - 14); ctx.fillText(c1, cx + 13, ty - 42); ctx.fillText(e1, cx + 13, ty + 42);
    if (!on) { ctx.font = `700 15px ${FONT}`; ctx.fillStyle = color('muted'); ctx.fillText('off', tx - 22, ty + 46); }
  }
  function groundAt(ctx, x, y) {
    ctx.strokeStyle = 'rgba(205,216,255,0.82)'; ctx.lineWidth = 2.5;
    for (const [w, dy] of [[26, 0], [16, 6], [7, 12]]) { ctx.beginPath(); ctx.moveTo(x - w / 2, y + dy); ctx.lineTo(x + w / 2, y + dy); ctx.stroke(); }
  }
  function drawPreset(b, ctx, it, t, L) {
    const F = focusOf(it, L.n, t, 1.8, 2.6);
    const s = Math.max(0, t - 1);
    // wires, grounds, junctions, open terminals
    ctx.save(); ctx.globalAlpha *= after(t, 0.05, 0.6);
    ctx.strokeStyle = 'rgba(205,216,255,0.82)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const w of L.wires) for (const [d0, d1] of w.gaps) strokePath(ctx, w.pa, d0, d1);
    for (const [x, y] of L.grounds) groundAt(ctx, x, y);
    for (const [x, y] of L.joins) dot(ctx, x, y, 5.5, WHITE);
    for (const [x, y] of L.terms) { ctx.fillStyle = DARK; ctx.strokeStyle = WHITE; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill(); ctx.stroke(); }
    for (const d of L.decor) drawSymbol(ctx, d, t, { e: 0, bright: 0, spin: 0, q: 0 });
    ctx.restore();
    // current dots: thin and slow where the current is small
    const dotsA = after(t, 0.8, 0.6);
    if (dotsA > 0) {
      ctx.save(); ctx.globalAlpha *= dotsA;
      for (const f of L.flows) {
        if (!(f.v > 0)) continue;
        const pa = f.pa; const nD = Math.max(1, Math.round(pa.total / (f.small ? 46 : 34))); const gap = pa.total / nD;
        const d = f.osc ? (f.v / CK_W) * Math.sin(CK_W * s) : f.v * s;
        glow(ctx, color('yellow'), f.small ? 5 : 9); ctx.fillStyle = color('yellow');
        for (let k = 0; k < nD; k++) {
          const pos = mod(k * gap + d, pa.total);
          if (f.cuts.some(([c0, c1]) => pos > c0 - 5 && pos < c1 + 5) || pos < 4 || pos > pa.total - 4) continue;
          const q = at(pa, pos); ctx.beginPath(); ctx.arc(q.x, q.y, f.small ? 3.2 : 4.6, 0, TAU); ctx.fill();
        }
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }
    // the parts
    for (const p of L.parts) {
      const a = after(t, 0.15 + p.i * 0.1, 0.5); if (a <= 0) continue;
      const e = F.e(p.i);
      ctx.save(); ctx.globalAlpha *= a * F.dim(p.i);
      if (p.tri) drawOpamp(ctx, p, e);
      else if (p.kind === 'npn' || p.kind === 'nmos') drawTransistor(ctx, p, e, L.on, L.gate, t);
      else {
        const lit = L.on && (p.kind === 'bulb' || p.kind === 'led' || p.kind === 'motor') && L.flows.some((f) => f.v > 0 && f.on.includes(p));
        drawSymbol(ctx, p, t, { e, bright: lit ? smooth((t - 0.9) / 0.6) : 0, spin: lit ? s * 6 : 0, q: 0 });
      }
      if (p.box) drawLabelBlock(ctx, p.lab, p.box, p.c, e);
      ctx.restore();
      const r = p.tri ? 72 : Math.max(p.along, p.acr) + 6;
      hitIn(b, askOf(p, p.label), p.x - r, p.y - r, 2 * r, 2 * r);
      if (p.box) hitIn(b, askOf(p, p.label), p.box.x - 6, p.box.y - 4, p.box.w + 12, p.box.h + 8);
    }
    // the output node's tag
    if (L.tag) {
      const g = L.tag; const a = after(t, 1.2, 0.6);
      ctx.save(); ctx.globalAlpha *= a;
      ctx.fillStyle = 'rgba(5,8,22,0.88)'; ctx.strokeStyle = tint('green', 0.7); ctx.lineWidth = 1.5;
      rounded(ctx, g.x, g.y - 15, g.w, 30, 15); ctx.fill(); ctx.stroke();
      text(ctx, g.s, g.x + g.w / 2, g.y + 1, g.w - 14, { size: g.f.size, weight: 700, fill: 'green', min: 13 });
      ctx.restore();
      hitIn(b, `Where does ${g.s} come from?`, g.x, g.y - 15, g.w, 30);
    }
    circuitFoot(b, ctx, t, L, F);
  }

  // ─── x-beam: a loaded beam, worked out ────────────────────────────────
  // The beam with its supports and loads; the reactions, shear force,
  // bending moment and deflected shape come from solveBeam (the same numbers
  // writers get from shared/explainer-spec.js). Diagrams share the beam's
  // x-scale; bending moment is drawn positive (sagging) up.
  const BEAM_DIAG = { shear: 'shear', sfd: 'shear', 'shear force': 'shear', moment: 'moment', bmd: 'moment', bending: 'moment', 'bending moment': 'moment', deflection: 'deflection', deflected: 'deflection', 'deflected shape': 'deflection', sag: 'deflection' };
  const BEAM_INFO = {
    shear: { title: 'Shear force', sub: 'V (kN)', c: 'cyan', unit: 'kN', ask: 'Tell me about the shear force diagram' },
    moment: { title: 'Bending moment', sub: 'M (kN·m)', c: 'purple', unit: 'kN·m', ask: 'Tell me about the bending moment diagram' },
    deflection: { title: 'Deflection', sub: 'shape, exaggerated', c: 'teal', unit: '', ask: 'Tell me about the deflected shape' },
  };
  function layBeam(ctx, it, top) {
    const len = clamp(num(it.length, 6), 0.1, 1000);
    let sup = arr(it.supports, 2).map((s0, i) => { const s = obj(s0); const k = str(s.kind).toLowerCase(); return { i, kind: ['pin', 'roller', 'fixed'].includes(k) ? k : 'pin', at: clamp(num(s.at, i ? 1 : 0), 0, 1), ask: s.ask }; });
    if (!sup.length) sup = [{ i: 0, kind: 'pin', at: 0 }, { i: 1, kind: 'roller', at: 1 }];
    if (sup.length === 1) sup = [{ i: sup[0].i, kind: 'fixed', at: sup[0].at < 0.5 ? 0 : 1, ask: sup[0].ask }];
    else {
      sup = sup.map((s) => (s.kind === 'fixed' ? { ...s, kind: 'pin' } : s));
      if (Math.abs(sup[0].at - sup[1].at) < 0.02) { sup[0].at = 0; sup[1].at = 1; }
    }
    const loads = arr(it.loads, 4).map((l0, i) => {
      const l = obj(l0);
      const udl = /udl|uniform|spread|distributed/.test(str(l.kind).toLowerCase());
      let a = clamp(num(l.at, udl ? 0 : 0.5), 0, 1); let to = udl ? clamp(num(l.to, 1), 0, 1) : null;
      if (udl) { if (to < a) [a, to] = [to, a]; if (to - a < 0.02) { to = Math.min(1, a + 0.1); a = to - 0.1; } }
      const size = clamp(Math.abs(num(l.size, 1)) || 1, 1e-6, 1e6);
      const unit = udl ? 'kN/m' : 'kN';
      const lab = str(l.label);
      const txt = lab ? (/\d/.test(lab) ? lab : `${lab}: ${fmt(size)} ${unit}`) : `${fmt(size)} ${unit}`;
      return { i, kind: udl ? 'udl' : 'point', at: a, to, size, unit, txt, label: lab || `${txt} ${udl ? 'spread load' : 'point load'}`, ask: l.ask };
    });
    const sol = solveBeam({ length: len, supports: sup.map((s) => ({ kind: s.kind, at: s.at })), loads: loads.map((l) => (l.kind === 'udl' ? { kind: 'udl', at: l.at, to: l.to, size: l.size } : { kind: 'point', at: l.at, size: l.size })) }, 400);
    const want = [it.show].flat().map((v) => BEAM_DIAG[str(v).toLowerCase()]).filter(Boolean);
    const diags = ['shear', 'moment', 'deflection'].filter((d) => want.includes(d));
    const nd = diags.length;
    const wallL = sup.length === 1 && sup[0].at === 0; const wallR = sup.length === 1 && sup[0].at === 1;
    const bx0 = wallL ? 150 : 132; const bx1 = wallR ? 668 : 686;
    const px = (xm) => bx0 + (xm / len) * (bx1 - bx0);
    // load labels in rows, so neighbours never overlap
    // (arrows start just under the label row, so labels slide sideways with a leader)
    loads.forEach((l) => { l.cx = px(((l.kind === 'udl' ? (l.at + l.to) / 2 : l.at)) * len); l.fit = measure(ctx, l.txt, 240, 19, 700, 1, 15); l.w = l.fit.w + 14; });
    const byX = loads.slice().sort((p, q) => p.cx - q.cx);
    const nRows = byX.reduce((s, l) => s + l.w + 12, 0) > 780 ? 2 : 1;
    for (let r = 0; r < nRows; r++) {
      const row = byX.filter((_, j) => j % nRows === r);
      const xs = spread(row.map((l) => l.cx), row.map((l) => l.w), 6, 794, 12);
      row.forEach((l, j) => { l.row = r; l.lx = xs[j]; });
    }
    const aLen = nd === 0 ? 96 : nd === 1 ? 74 : 60;
    const panelH = nRows * 27 + aLen + 136;
    const py = nd === 0 ? top + Math.max(10, (652 - top - panelH) / 2 - 10) : top + 4;
    const yb = py + nRows * 27 + aLen; // the beam's top face
    const gy = yb + 16 + 30; // the ground under the supports
    loads.forEach((l) => { l.ly = py + 13 + (nRows - 1 - l.row) * 27; });
    // supports, left to right A, B; their reactions
    const sorted = sup.slice().sort((p, q) => p.at - q.at);
    sorted.forEach((s, k) => {
      s.x = px(s.at * len); s.name = sup.length === 2 ? 'AB'[k] : '';
      const r = sol.reactions[k] || { force: 0, moment: 0 };
      s.force = r.force; s.moment = r.moment || 0;
      s.out = sup.length === 1 ? (s.at === 0 ? 1 : -1) : k === 0 ? -1 : 1; // which side its labels go
      s.rtxt = `${s.name ? `R${s.name}` : 'R'} = ${fmt(Math.abs(s.force))} kN`;
      s.mtxt = sup.length === 1 ? `M = ${fmt(Math.abs(s.moment))} kN·m` : '';
    });
    // the diagrams under the beam
    const dTop = py + panelH + 6;
    const dh = nd ? Math.min(nd === 1 ? 250 : 210, (646 - dTop - 12 * (nd - 1)) / nd) : 0;
    const D = diags.map((kind, k) => {
      const info = BEAM_INFO[kind];
      let vals = kind === 'shear' ? sol.V : kind === 'moment' ? sol.M : sol.y; let xsA = sol.xs;
      if (kind === 'shear' && sol.jumps) { // both sides of every jump, exactly
        const P = sol.xs.map((x, i) => [x, sol.V[i]]).filter(([x]) => !sol.jumps.some((j) => Math.abs(j.x - x) < 1e-9));
        for (const j of sol.jumps) P.push([j.x, j.before, 0], [j.x, j.after, 1]);
        P.sort((p, q) => p[0] - q[0] || (p[2] ?? 0.5) - (q[2] ?? 0.5));
        xsA = P.map((p) => p[0]); vals = P.map((p) => p[1]);
      }
      const y0 = dTop + k * (dh + 12);
      const vmax = Math.max(0, ...vals); const vmin = Math.min(0, ...vals);
      const big = Math.max(vmax, -vmin);
      const eps = big * 1e-6 || 1e-12;
      const hasP = vmax > eps; const hasN = vmin < -eps;
      const pt = hasP ? 30 : 8; const pb = hasN ? 30 : 8;
      const range = vmax - vmin;
      const sc = range > eps ? (dh - pt - pb) / range : 0;
      const zy = range > eps ? y0 + pt + vmax * sc : y0 + dh / 2;
      const yOf = (v) => zy - v * sc;
      // peak labels: the middle of a flat top, with its place along the beam
      const peakOf = (sign) => {
        const ext = sign > 0 ? vmax : vmin;
        const tol = Math.max(eps, Math.abs(ext) * 1e-4);
        let i0 = -1; let i1 = -1;
        vals.forEach((v, i) => { if (Math.abs(v - ext) <= tol) { if (i0 < 0) i0 = i; i1 = i; } });
        const xm0 = xsA[i0]; const xm1 = xsA[i1]; const im = Math.round((i0 + i1) / 2);
        const flat = xm1 - xm0 > len * 0.03;
        let s;
        if (kind === 'shear') s = `${fmt(ext)} kN`;
        else if (kind === 'moment') s = flat ? `${fmt(ext)} kN·m, ${fmt(xm0)}–${fmt(xm1)} m` : `${fmt(ext)} kN·m at ${fmt(xsA[im])} m`;
        else s = `Max deflection at ${fmt(xsA[im])} m`;
        const f = measure(ctx, s, 300, 17, 700, 1, 14);
        const w = f.w + 12; const x = px((xm0 + xm1) / 2);
        return { s, f, w, x, lx: clamp(x, bx0 - 8 + w / 2, 794 - w / 2), y: yOf(ext), up: sign > 0 };
      };
      const peaks = [];
      if (kind === 'deflection') { const pk = Math.abs(vmin) >= vmax ? -1 : 1; if (pk > 0 ? hasP : hasN) peaks.push(peakOf(pk)); }
      else { if (hasP) peaks.push(peakOf(1)); if (hasN) peaks.push(peakOf(-1)); }
      const pts = []; vals.forEach((v, i) => pts.push(px(xsA[i]), yOf(v)));
      return { kind, info, y0, h: dh, zy, sc, vals, pts, peaks };
    });
    // the length line under it all, with the places of the supports and loads
    const marksM = [...new Set([0, len, ...sup.map((s) => s.at * len), ...loads.flatMap((l) => (l.kind === 'udl' ? [l.at * len, l.to * len] : [l.at * len]))].map((v) => +v.toFixed(3)))].sort((p, q) => p - q);
    const ticks = []; let lastX = -99;
    for (const v of marksM) { const x = px(v); if (x - lastX >= 34 || v === len) { if (v === len && x - lastX < 34) ticks.pop(); ticks.push({ v, x }); lastX = x; } }
    return { len, sup, sorted, loads, sol, diags: D, nd, bx0, bx1, px, py, yb, gy, aLen, nRows, panelH, wallL, wallR, ticks, n: loads.length + sup.length };
  }
  function hatch(ctx, x0, y0, x1, y1, dx, dy, step = 9) {
    // short slanted strokes along a line, on one side
    const len = Math.hypot(x1 - x0, y1 - y0); const n = Math.max(1, Math.floor(len / step));
    ctx.beginPath();
    for (let i = 0; i <= n; i++) { const u = i / n; const x = x0 + (x1 - x0) * u; const y = y0 + (y1 - y0) * u; ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); }
    ctx.stroke();
  }
  function drawBeam(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layBeam(ctx, it, top));
    const { loads, sorted, bx0, bx1, yb, gy, px } = L;
    const nL = loads.length;
    const tLoads = 0.6; const tReact = tLoads + nL * 0.25 + 0.35; const tDiag = tReact + 0.5;
    const F = focusOf(it, L.n, t, tDiag + L.nd * 0.6 + 0.6, 2.8);
    const eOf = (k) => F.e(k); const dimOf = (k) => F.dim(k);
    // the beam
    const ba = after(t, 0.05, 0.5);
    ctx.save(); ctx.globalAlpha *= ba;
    const g = ctx.createLinearGradient(0, yb, 0, yb + 16);
    g.addColorStop(0, '#c9d3ee'); g.addColorStop(0.45, '#8c99bd'); g.addColorStop(1, '#4b5675');
    ctx.fillStyle = g; rounded(ctx, bx0, yb, bx1 - bx0, 16, 3); ctx.fill();
    ctx.strokeStyle = tint(WHITE, 0.55); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
    hitIn(b, 'Tell me about the beam', bx0, yb - 4, bx1 - bx0, 24);
    // supports and reactions
    sorted.forEach((s) => {
      const k = nL + s.i; const e = eOf(k);
      const a = after(t, 0.3, 0.5);
      ctx.save(); ctx.globalAlpha *= a * dimOf(k);
      const c = 'orange';
      if (e > 0.05) glow(ctx, color(c), 14 * e);
      ctx.strokeStyle = tint(c, 0.85 + 0.15 * e); ctx.lineWidth = 2.5 + e; ctx.fillStyle = tint(c, 0.18 + 0.15 * e);
      if (s.kind === 'fixed') {
        const wx = s.at === 0 ? bx0 : bx1; const o = s.at === 0 ? -1 : 1;
        ctx.lineWidth = 4 + e; line(ctx, wx, yb - 44, wx, gy + 18, tint(c, 0.9 + 0.1 * e), 4 + e);
        ctx.lineWidth = 2; hatch(ctx, wx, yb - 40, wx, gy + 14, o * 12, 10, 10);
      } else {
        const by = yb + 16;
        const th = s.kind === 'roller' ? 19 : 30;
        ctx.beginPath(); ctx.moveTo(s.x, by); ctx.lineTo(s.x - 17, by + th); ctx.lineTo(s.x + 17, by + th); ctx.closePath(); ctx.fill(); ctx.stroke();
        dot(ctx, s.x, by + 1, 4, WHITE);
        if (s.kind === 'roller') { for (const o of [-9, 9]) { ctx.beginPath(); ctx.arc(s.x + o, by + th + 5.5, 5, 0, TAU); ctx.stroke(); } }
        ctx.shadowBlur = 0;
        line(ctx, s.x - 26, gy, s.x + 26, gy, tint(c, 0.8), 2.5);
        ctx.strokeStyle = tint(c, 0.55); ctx.lineWidth = 1.6; hatch(ctx, s.x - 24, gy, s.x + 24, gy, -7, 8, 8);
        if (s.name) text(ctx, s.name, s.x + s.out * 32, by + 14, 30, { size: 20, weight: 800, fill: e > 0.5 ? c : 'muted' });
      }
      ctx.restore();
      // the reaction it gives
      const ra = after(t, tReact, 0.6);
      let rb = null;
      if (ra > 0) {
        ctx.save(); ctx.globalAlpha *= ra * dimOf(k);
        const rc = 'green';
        const x = s.kind === 'fixed' ? (s.at === 0 ? bx0 + 56 : bx1 - 56) : s.x;
        const yTop = s.kind === 'fixed' ? yb + 22 : gy + 6; const yBot = yTop + 42;
        const grow = easeOut(ra);
        if (Math.abs(s.force) > 1e-9) {
          if (s.force > 0) kit.arrow(ctx, x, yBot, x, yBot - (yBot - yTop) * grow, color(rc), 5);
          else kit.arrow(ctx, x, yTop, x, yTop + (yBot - yTop) * grow, color(rc), 5);
        }
        const lines2 = s.mtxt ? [s.rtxt, s.mtxt] : [s.rtxt];
        const al = s.out < 0 ? 'right' : 'left';
        const lx = x + s.out * 14;
        ctx.font = `700 18px ${FONT}`;
        const w = Math.max(...lines2.map((q) => ctx.measureText(q).width));
        const ly = (yTop + yBot) / 2;
        lines2.forEach((q, j) => text(ctx, q, lx, ly + (j - (lines2.length - 1) / 2) * 22, 220, { size: 18, weight: 700, align: al, fill: j ? 'purple' : rc, min: 14 }));
        rb = { x: al === 'right' ? lx - w : lx, y: ly - lines2.length * 11, w, h: lines2.length * 22 };
        // a wall also resists turning: a curved moment arrow beside it
        if (s.kind === 'fixed' && Math.abs(s.moment) > 1e-9) {
          const wx = s.at === 0 ? bx0 : bx1; const cy = yb + 8; const r = 30;
          const o = s.at === 0 ? 1 : -1; // the beam side
          // anticlockwise when the loads would turn the beam clockwise about the wall
          const anti = s.moment > 0;
          const a0 = o > 0 ? 0.25 : PI - 0.25; const a1 = o > 0 ? 1.35 : PI - 1.35;
          const [from, to] = anti === (o > 0) ? [a1, a0] : [a0, a1];
          ctx.strokeStyle = color('purple'); ctx.lineWidth = 4;
          const span = (to - from) * grow;
          ctx.beginPath(); ctx.arc(wx, cy, r, from, from + span, span < 0); ctx.stroke();
          if (grow > 0.9) { const ea = from + span; const dir = span < 0 ? -1 : 1; head(ctx, wx + Math.cos(ea) * r, cy + Math.sin(ea) * r, ea + (dir * PI) / 2, 11, 'purple'); }
        }
        ctx.restore();
      }
      const sx = s.kind === 'fixed' ? (s.at === 0 ? bx0 - 30 : bx1 - 10) : s.x - 30;
      hitIn(b, askOf(s, s.kind === 'fixed' ? 'fixed support' : `${s.kind} support${s.name ? ` at ${s.name}` : ''}`), sx, yb + 14, 40 + (s.kind === 'fixed' ? 0 : 20), gy - yb + 6);
      if (rb) hitIn(b, str(s.ask) || (s.kind === 'fixed' ? 'How do we work out the reactions at the wall?' : `How do we work out the reaction at ${s.name || 'the support'}?`), rb.x - 6, rb.y - 4, rb.w + 12, rb.h + 8);
    });
    // the loads
    loads.forEach((l) => {
      const p = clamp((t - tLoads - l.i * 0.25) / 0.5); if (p <= 0) return;
      const e = eOf(l.i); const c = l.kind === 'udl' ? 'yellow' : 'red';
      const drop = (1 - easeOut(p)) * 26;
      ctx.save(); ctx.globalAlpha *= easeOut(p) * dimOf(l.i); ctx.translate(0, -drop);
      if (e > 0.05) glow(ctx, color(c), 14 * e);
      const tail = l.ly + 15;
      let hb;
      if (l.kind === 'point') {
        const x = px(l.at * L.len);
        kit.arrow(ctx, x, tail, x, yb - 2, tint(c, 0.85 + 0.15 * e), 5 + e);
        if (Math.abs(l.lx - x) > 4) line(ctx, x, tail, l.lx, tail - 2, tint(c, 0.5), 1.5);
        hb = { x: x - 16, y: tail, w: 32, h: yb - tail };
      } else {
        const x0 = px(l.at * L.len); const x1 = px(l.to * L.len); const barY = yb - L.aLen * 0.62;
        ctx.fillStyle = tint(c, 0.1 + 0.08 * e); ctx.fillRect(x0, barY, x1 - x0, yb - barY);
        line(ctx, x0, barY, x1, barY, tint(c, 0.9), 3 + e);
        const nA = Math.max(2, Math.round((x1 - x0) / 28)) + 1;
        for (let j = 0; j < nA; j++) { const x = x0 + ((x1 - x0) * j) / (nA - 1); kit.arrow(ctx, x, barY, x, yb - 2, tint(c, 0.85 + 0.15 * e), 2.6); }
        if (tail < barY - 4) line(ctx, l.lx, tail, l.lx, barY, tint(c, 0.35), 1.5, [4, 5]);
        hb = { x: x0, y: barY, w: x1 - x0, h: yb - barY };
      }
      ctx.shadowBlur = 0;
      text(ctx, l.txt, l.lx, l.ly, l.w, { size: l.fit.size, weight: 700, fill: e > 0.4 ? c : 'ink', min: 14 });
      ctx.restore();
      hitIn(b, askOf(l, l.label), hb.x, hb.y, hb.w, hb.h);
      hitIn(b, askOf(l, l.label), l.lx - l.w / 2, l.ly - 13, l.w, 26);
    });
    // the length, with the places that matter
    {
      const a = after(t, 0.4, 0.5);
      const y = gy + 66;
      ctx.save(); ctx.globalAlpha *= a;
      line(ctx, bx0, y, bx1, y, tint('muted', 0.7), 1.5);
      head(ctx, bx0, y, PI, 9, tint('muted', 0.8)); head(ctx, bx1, y, 0, 9, tint('muted', 0.8));
      for (const tk of L.ticks) { line(ctx, tk.x, y - 6, tk.x, y + 6, tint('muted', 0.7), 1.5); text(ctx, fmt(tk.v), tk.x, y + 17, 50, { size: 14, weight: 600, fill: 'muted', min: 12 }); }
      const s = `${fmt(L.len)} m`;
      ctx.font = `700 18px ${FONT}`; const w = ctx.measureText(s).width + 16;
      const mid = (bx0 + bx1) / 2;
      const clash = L.ticks.some((tk) => Math.abs(tk.x - mid) < w / 2 + 2);
      const ly = clash ? y - 14 : y;
      ctx.fillStyle = 'rgba(7,11,29,0.95)'; ctx.fillRect(mid - w / 2, ly - 11, w, 22);
      text(ctx, s, mid, ly + 1, w, { size: 18, weight: 700, fill: 'ink' });
      ctx.restore();
      hitIn(b, 'Tell me about the span of the beam', bx0, y - 14, bx1 - bx0, 36);
    }
    // the diagrams
    L.diags.forEach((d, k) => {
      const t0 = tDiag + k * 0.6;
      const a = after(t, t0, 0.4); if (a <= 0) return;
      const rev = easeOut(clamp((t - t0) / 1.3));
      const { info, y0, h, zy } = d;
      ctx.save(); ctx.globalAlpha *= a;
      ctx.fillStyle = 'rgba(140,170,255,0.035)'; rounded(ctx, 8, y0, 784, h, 12); ctx.fill();
      ctx.strokeStyle = 'rgba(140,170,255,0.12)'; ctx.lineWidth = 1; ctx.stroke();
      const tf = measure(ctx, info.title, 106, 17, 700, 2, 14); const sf = measure(ctx, info.sub, 106, 14, 500, 2, 12);
      const ty = y0 + h / 2 - (tf.h + sf.h + 4) / 2;
      text(ctx, info.title, 64, ty + tf.h / 2, 106, { size: 17, weight: 700, fill: info.c, lines: 2, min: 14 });
      text(ctx, info.sub, 64, ty + tf.h + 4 + sf.h / 2, 106, { size: 14, weight: 500, fill: 'muted', lines: 2, min: 12 });
      line(ctx, bx0, zy, bx1, zy, tint(WHITE, 0.45), 1.5);
      const xr = bx0 + (bx1 - bx0) * rev;
      ctx.save(); ctx.beginPath(); ctx.rect(bx0 - 2, y0, xr - bx0 + 4, h); ctx.clip();
      if (d.kind === 'deflection') {
        const u = Math.max(0, t - t0);
        const amp = 1 - Math.exp(-1.6 * u) * Math.cos(4.5 * u);
        line(ctx, bx0, zy, bx1, zy, tint(WHITE, 0.35), 2, [6, 6]);
        ctx.beginPath(); for (let i = 0; i < d.pts.length; i += 2) { const y = zy + (d.pts[i + 1] - zy) * amp; if (i) ctx.lineTo(d.pts[i], y); else ctx.moveTo(d.pts[i], y); }
        glow(ctx, color(info.c), 10); ctx.strokeStyle = color(info.c); ctx.lineWidth = 7; ctx.stroke(); ctx.shadowBlur = 0;
        ctx.strokeStyle = tint(WHITE, 0.5); ctx.lineWidth = 1.5; ctx.stroke();
        for (const s of sorted) { if (s.kind === 'fixed') line(ctx, s.at === 0 ? bx0 : bx1, zy - 16, s.at === 0 ? bx0 : bx1, zy + 16, tint('orange', 0.8), 4); else { ctx.fillStyle = tint('orange', 0.7); ctx.beginPath(); ctx.moveTo(s.x, zy + 3); ctx.lineTo(s.x - 8, zy + 15); ctx.lineTo(s.x + 8, zy + 15); ctx.closePath(); ctx.fill(); } }
      } else {
        // soft fills: positive and negative tints, then the outline
        for (const sign of [1, -1]) {
          ctx.beginPath(); ctx.moveTo(d.pts[0], zy);
          for (let i = 0; i < d.pts.length; i += 2) ctx.lineTo(d.pts[i], sign > 0 ? Math.min(zy, d.pts[i + 1]) : Math.max(zy, d.pts[i + 1]));
          ctx.lineTo(d.pts[d.pts.length - 2], zy); ctx.closePath();
          ctx.fillStyle = tint(sign > 0 ? 'green' : 'red', 0.2); ctx.fill();
        }
        ctx.beginPath(); ctx.moveTo(d.pts[0], zy);
        for (let i = 0; i < d.pts.length; i += 2) ctx.lineTo(d.pts[i], d.pts[i + 1]);
        ctx.lineTo(d.pts[d.pts.length - 2], zy);
        glow(ctx, color(info.c), 8); ctx.strokeStyle = color(info.c); ctx.lineWidth = 3; ctx.stroke(); ctx.shadowBlur = 0;
      }
      ctx.restore();
      // peak values
      const pa = after(t, t0 + 1.1, 0.5);
      if (pa > 0) {
        ctx.save(); ctx.globalAlpha *= pa;
        for (const pk of d.peaks) {
          const u = Math.max(0, t - t0);
          const y = d.kind === 'deflection' ? zy + (pk.y - zy) * (1 - Math.exp(-1.6 * u) * Math.cos(4.5 * u)) : pk.y;
          dot(ctx, pk.x, y, 4.5, info.c);
          const ly = pk.up ? y - 15 : y + 15;
          text(ctx, pk.s, pk.lx, ly, pk.w, { size: pk.f.size, weight: 700, fill: 'ink', min: 14 });
        }
        ctx.restore();
      }
      ctx.restore();
      hitIn(b, info.ask, 8, y0, 784, h);
    });
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── x-plot: a true graph with numbers ────────────────────────────────
  // Real axes with tick numbers; curves from a formula (plotValue in the
  // spec) or from points draw themselves on; a closed points curve is
  // filled and its enclosed area given (the work of a P–V cycle).
  const CURVE_TYPES = 'sine rise decay line power damped points'.split(' ');
  const PLOT_HUE = ['cyan', 'orange', 'purple'];
  function niceStep(range, target) {
    const raw = range / Math.max(1, target); const p = 10 ** Math.floor(Math.log10(raw)); const f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }
  function axisTicks(lo, hi, target) {
    const st = niceStep(hi - lo, target);
    const i0 = Math.ceil(lo / st - 1e-9); const i1 = Math.floor(hi / st + 1e-9);
    let d = 0; while (d < 8 && Math.abs(Math.round(st * 10 ** d) - st * 10 ** d) > 1e-6 * 10 ** d) d++;
    const vals = []; for (let i = i0; i <= i1 && vals.length < 40; i++) vals.push(i * st);
    const txt = (v) => { const s = Math.abs(v) >= 1e4 ? Number(v.toFixed(d)).toLocaleString('en-GB', { maximumFractionDigits: d }) : v.toFixed(d); return (Math.abs(v) < st * 1e-9 ? (0).toFixed(d) : s).replace('-', '−'); };
    return { st, vals, txt };
  }
  const unitOf = (s) => { const m = str(s).match(/\(([^()]{1,12})\)\s*$/) || str(s).match(/[,/]\s*([^,/]{1,8})$/); return m ? m[1].trim() : ''; };
  function areaUnit(xl, yl) {
    const xu = unitOf(xl); const yu = unitOf(yl);
    if (!xu || !yu) return '';
    if (/^m(³|\^3|3)$/.test(xu)) { const J = { Pa: 'J', kPa: 'kJ', MPa: 'MJ', 'N/m²': 'J' }[yu]; if (J) return J; }
    if (/^(L|l|litres?|liters?)$/.test(xu)) { const J = { Pa: 'mJ', kPa: 'J', MPa: 'kJ', bar: '100 J' }[yu]; if (J && J !== '100 J') return J; }
    return `${yu}·${xu}`;
  }
  // Rounded corners through points: a monotone cubic when x only grows (no
  // overshoot, so a stress–strain curve never bends backwards), otherwise a
  // centripetal Catmull–Rom (no loops or cusps), measured in the points' own box.
  function smoothPoints(P, closed) {
    const n = P.length; const out = [];
    if (!closed && P.every((p, j) => !j || p[0] > P[j - 1][0])) {
      const d = []; for (let j = 0; j < n - 1; j++) d.push((P[j + 1][1] - P[j][1]) / (P[j + 1][0] - P[j][0]));
      const m = P.map((_, j) => (j === 0 ? d[0] : j === n - 1 ? d[n - 2] : d[j - 1] * d[j] <= 0 ? 0 : (d[j - 1] + d[j]) / 2));
      for (let j = 0; j < n - 1; j++) {
        if (d[j] === 0) { m[j] = 0; m[j + 1] = 0; continue; }
        const a = m[j] / d[j]; const c = m[j + 1] / d[j]; const q = a * a + c * c;
        if (q > 9) { const k = 3 / Math.sqrt(q); m[j] = k * a * d[j]; m[j + 1] = k * c * d[j]; }
      }
      for (let j = 0; j < n - 1; j++) {
        const [x0, y0] = P[j]; const [x1, y1] = P[j + 1]; const h = x1 - x0;
        for (let k = 0; k < 12; k++) { const u = k / 12; const u2 = u * u; const u3 = u2 * u; out.push([x0 + h * u, (2 * u3 - 3 * u2 + 1) * y0 + (u3 - 2 * u2 + u) * h * m[j] + (-2 * u3 + 3 * u2) * y1 + (u3 - u2) * h * m[j + 1]]); }
      }
      out.push(P[n - 1]);
      return out;
    }
    const xs = P.map((p) => p[0]); const ys = P.map((p) => p[1]);
    const sx = Math.max(...xs) - Math.min(...xs) || 1; const sy = Math.max(...ys) - Math.min(...ys) || 1;
    const get = (j) => (closed ? P[mod(j, n)] : j < 0 ? [2 * P[0][0] - P[1][0], 2 * P[0][1] - P[1][1]] : j >= n ? [2 * P[n - 1][0] - P[n - 2][0], 2 * P[n - 1][1] - P[n - 2][1]] : P[j]);
    const gap = (a, c) => Math.max(1e-6, Math.sqrt(Math.hypot((c[0] - a[0]) / sx, (c[1] - a[1]) / sy)));
    const segs = closed ? n : n - 1;
    for (let j = 0; j < segs; j++) {
      const p0 = get(j - 1); const p1 = get(j); const p2 = get(j + 1); const p3 = get(j + 2);
      const t1 = gap(p0, p1); const t2 = t1 + gap(p1, p2); const t3 = t2 + gap(p2, p3);
      const mix = (a, c, ta, tc, tt) => [0, 1].map((q) => ((tc - tt) * a[q] + (tt - ta) * c[q]) / (tc - ta));
      for (let k = 0; k < 12; k++) {
        const tt = t1 + ((t2 - t1) * k) / 12;
        const a1 = mix(p0, p1, 0, t1, tt); const a2 = mix(p1, p2, t1, t2, tt); const a3 = mix(p2, p3, t2, t3, tt);
        const b1 = mix(a1, a2, 0, t2, tt); const b2 = mix(a2, a3, t1, t3, tt);
        out.push(mix(b1, b2, t1, t2, tt));
      }
    }
    out.push(closed ? P[0] : P[n - 1]);
    return out;
  }
  function layPlot(ctx, it, top) {
    const xa = obj(it.x); const ya = obj(it.y);
    const curves = arr(it.curves, 3).map((c0, i) => {
      const c = obj(c0);
      const ty0 = str(c.type).toLowerCase();
      const points = (Array.isArray(c.points) ? c.points : []).filter((p) => Array.isArray(p) && p.length >= 2 && Number.isFinite(+p[0]) && Number.isFinite(+p[1])).slice(0, 16).map((p) => [+p[0], +p[1]]);
      const type = CURVE_TYPES.includes(ty0) ? ty0 : points.length >= 2 ? 'points' : 'line';
      const nb = (v) => { const n = num(v, NaN); return Number.isFinite(n) ? n : undefined; };
      return { i, type, label: str(c.label, `Curve ${i + 1}`), a: nb(c.a), k: nb(c.k), c: nb(c.c), phase: nb(c.phase), tau: nb(c.tau), points, closed: c.closed === true && points.length >= 3, smooth: c.smooth === true, ask: c.ask, hue: PLOT_HUE[i] };
    }).filter((c) => c.type !== 'points' || c.points.length >= 2);
    const ptsX = curves.flatMap((c) => (c.type === 'points' ? c.points.map((p) => p[0]) : []));
    let x0 = num(xa.min, NaN); let x1 = num(xa.max, NaN);
    if (!Number.isFinite(x0)) x0 = ptsX.length ? Math.min(0, ...ptsX) : 0;
    if (!Number.isFinite(x1)) x1 = ptsX.length ? Math.max(...ptsX) : x0 + 10;
    if (!(x1 > x0)) x1 = x0 + 1;
    // samples in data units
    const N = 360;
    for (const c of curves) {
      if (c.type !== 'points') { c.data = []; for (let j = 0; j <= N; j++) { const x = x0 + ((x1 - x0) * j) / N; const y = plotValue(c, x); c.data.push([x, Number.isFinite(y) ? y : NaN]); } }
      else if (c.smooth) c.data = smoothPoints(c.points, c.closed);
      else c.data = c.closed ? [...c.points, c.points[0]] : c.points;
    }
    const ys = curves.flatMap((c) => c.data.map((p) => p[1]).filter(Number.isFinite));
    const dMax = ys.length ? Math.max(...ys) : 1; const dMin = ys.length ? Math.min(...ys) : 0;
    let y1 = num(ya.max, NaN); let y0 = num(ya.min, NaN);
    const up = (v) => { const st = niceStep(v, 5); return st * Math.ceil(v / st - 1e-9); };
    if (!Number.isFinite(y1)) y1 = dMax > 0 ? up(dMax) : 1;
    if (!Number.isFinite(y0)) y0 = dMin < -1e-12 ? -up(-dMin) : 0;
    if (y0 >= y1) { if (Number.isFinite(num(ya.min, NaN))) y1 = y0 + Math.abs(y0 || 1); else y0 = y1 - Math.abs(y1 || 1); }
    // the legend along the top, in one or two rows
    const leg = curves.map((c) => { const f = measure(ctx, c.label, 230, 18, 700, 1, 14); return { c, f, w: f.w + 54 }; });
    const lrows = [[]]; let rw = 0;
    for (const l of leg) { if (rw + l.w > 760 && lrows[lrows.length - 1].length) { lrows.push([]); rw = 0; } lrows[lrows.length - 1].push(l); rw += l.w + 12; }
    lrows.forEach((row, r) => { const tw = row.reduce((s, l) => s + l.w, 0) + 12 * (row.length - 1); let x = MX - tw / 2; for (const l of row) { l.x = x; l.y = top + 6 + r * 38; x += l.w + 12; } });
    // plot box: room on the left for the y numbers and label, below for the x ones
    const gy0 = top + lrows.length * 38 + 26;
    const gh = 588 - gy0;
    const yt = axisTicks(y0, y1, clamp(Math.round(gh / 62), 3, 8));
    ctx.font = `600 16px ${FONT}`;
    const tw = Math.max(...yt.vals.map((v) => ctx.measureText(yt.txt(v)).width), 10);
    const g = { x: 40 + 10 + tw + 10, y: gy0, w: 0, h: gh };
    g.w = 800 - 34 - g.x;
    if (it.equal === true) { // the same pixels per unit both ways (a circle stays round), the box centred
      const k = Math.min(g.w / (x1 - x0), g.h / (y1 - y0));
      const w = (x1 - x0) * k; const h = (y1 - y0) * k;
      g.x += (g.w - w) / 2; g.y += (g.h - h) / 2; g.w = w; g.h = h;
    }
    const xt = axisTicks(x0, x1, clamp(Math.round(g.w / 95), 3, 9));
    const PX = (v) => g.x + ((v - x0) / (x1 - x0)) * g.w;
    const PY = (v) => g.y + g.h - ((v - y0) / (y1 - y0)) * g.h;
    // pixel paths, split where the formula gives no number
    for (const c of curves) {
      c.runs = []; let run = [];
      for (const [x, y] of c.data) {
        if (!Number.isFinite(y)) { if (run.length >= 4) c.runs.push(run); run = []; continue; }
        run.push(PX(x), clamp(PY(y), g.y - 4000, g.y + g.h + 4000));
      }
      if (run.length >= 4) c.runs.push(run);
      c.paths = c.runs.map((r) => mkPath(r));
      c.total = c.paths.reduce((s, p) => s + p.total, 0) || 1;
      c.inside = []; // the curve every 6 px inside the box, for keeping labels off it
      for (const pa of c.paths) for (let d = 0; d <= pa.total; d += 6) { const q = at(pa, d); if (q.y >= g.y - 2 && q.y <= g.y + g.h + 2) c.inside.push(q.x, q.y); }
      if (c.closed) {
        const P = c.points; let A = 0; let cx = 0; let cy = 0;
        for (let j = 0; j < P.length; j++) { const [xa0, ya0] = P[j]; const [xb, yb0] = P[(j + 1) % P.length]; const cr = xa0 * yb0 - xb * ya0; A += cr; cx += (xa0 + xb) * cr; cy += (ya0 + yb0) * cr; }
        A /= 2;
        const mean = (q) => P.reduce((s, p) => s + p[q], 0) / P.length;
        const [mx, my] = Math.abs(A) > 1e-12 ? [cx / (6 * A), cy / (6 * A)] : [mean(0), mean(1)];
        const u = areaUnit(str(xa.label), str(ya.label));
        const s = `Area ≈ ${fmt(Math.abs(A))}${u ? ` ${u}` : ''}`;
        const f = measure(ctx, s, 260, 17, 700, 1, 14);
        // an area means something (work, energy lost) unless both axes share a unit or the plot is a drawing
        const xu = unitOf(str(xa.label)); const yu = unitOf(str(ya.label));
        if (!(it.equal === true || (xu && xu === yu))) {
          // the chip goes inside the loop, clear of its outline (a thin loop's centroid sits on the line)
          const w = f.w + 22; const poly = c.runs[0] || [];
          const inPoly = (x, y) => { let k = false; for (let i = 0, j = poly.length - 2; i < poly.length; j = i, i += 2) { const xi = poly[i]; const yi = poly[i + 1]; const xj = poly[j]; const yj = poly[j + 1]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi) k = !k; } return k; };
          const cx0 = PX(mx); const cy0 = PY(my); let best = null; let bs = Infinity;
          for (let gx = g.x + w / 2 + 4; gx <= g.x + g.w - w / 2 - 4; gx += 16) for (let gy = g.y + 20; gy <= g.y + g.h - 20; gy += 12) {
            let sc = Math.hypot(gx - cx0, gy - cy0) * 0.25 + (inPoly(gx, gy) ? 0 : 120);
            for (let j = 0; j < c.inside.length; j += 2) if (Math.abs(c.inside[j] - gx) < w / 2 + 6 && Math.abs(c.inside[j + 1] - gy) < 21) sc += 60;
            if (sc < bs) { bs = sc; best = [gx, gy]; }
          }
          c.area = { s, f, w, h: 30, x: best ? best[0] : cx0, y: best ? best[1] : cy0 };
        }
        // which way round: an arrow mid-edge on a plain cycle, four along a smooth or many-sided one
        if (!c.smooth && P.length <= 6) c.arrows = P.map((p, j) => { const q = P[(j + 1) % P.length]; return { x: (PX(p[0]) + PX(q[0])) / 2, y: (PY(p[1]) + PY(q[1])) / 2, a: Math.atan2(PY(q[1]) - PY(p[1]), PX(q[0]) - PX(p[0])) }; });
        else c.arrows = c.paths.length ? [0.125, 0.375, 0.625, 0.875].map((f) => { const q = at(c.paths[0], c.paths[0].total * f); return { x: q.x, y: q.y, a: q.a }; }) : [];
        c.arrows = c.arrows.filter((ar) => ar.y > g.y && ar.y < g.y + g.h);
      }
    }
    // marks: a dashed line up to a dot on the first curve, the label beside it clear of every curve
    const first = curves[0];
    const taken = curves.filter((c) => c.area).map((c) => ({ x: c.area.x - c.area.w / 2, y: c.area.y - 15, w: c.area.w, h: 30 }));
    const marks = arr(it.marks, 4).map((m0, i) => {
      const m = obj(m0);
      const xv = clamp(num(m.x, x0 + ((x1 - x0) * (i + 1)) / 5), x0, x1);
      let yv = first && !first.closed ? plotValue(first, xv) : NaN;
      if (!(Number.isFinite(yv) && yv >= y0 && yv <= y1)) yv = NaN;
      return { i, xv, yv, x: PX(xv), y: Number.isFinite(yv) ? PY(yv) : g.y, has: Number.isFinite(yv), label: str(m.label, `x = ${xt.txt(xv)}`), ask: m.ask };
    });
    const allPts = curves.flatMap((c) => c.inside);
    const lines = marks.map((m) => ({ x: m.x - 3, y: m.y, w: 6, h: g.y + g.h - m.y }));
    marks.forEach((m) => {
      const f = measure(ctx, m.label, 220, 17, 700, 1, 14); const w = f.w + 20; const h = 28;
      m.f = f; m.w = w;
      const ys2 = [m.has ? m.y - 30 : g.y + 18, g.y + 18, g.y + 50, m.has ? m.y + 30 : g.y + 82, g.y + 82, g.y + g.h - 20, g.y + g.h - 52];
      let best = null; let bs = Infinity;
      ys2.forEach((cy, yi) => {
        [m.x, m.x + w / 2 + 8, m.x - w / 2 - 8].forEach((cx, xi) => {
          const r = { x: clamp(cx - w / 2, g.x + 4, g.x + g.w - w - 2), y: clamp(cy - h / 2, g.y + 2, g.y + g.h - h - 2), w, h };
          let sc = yi * 3 + xi * 5;
          for (let j = 0; j < allPts.length; j += 2) if (allPts[j] > r.x - 4 && allPts[j] < r.x + r.w + 4 && allPts[j + 1] > r.y - 4 && allPts[j + 1] < r.y + r.h + 4) sc += 40;
          for (const q of taken) sc += overlap(r, q) * 2;
          lines.forEach((q, j) => { sc += overlap(r, q) * (j === m.i ? 1 : 3); });
          if (m.has && Math.abs(r.y + h / 2 - m.y) > 120) sc += 20;
          if (sc < bs) { bs = sc; best = r; }
        });
      });
      m.box = best; taken.push(best);
    });
    const xl = str(xa.label ?? it.x, 'x'); const yl = str(ya.label ?? it.y, 'y');
    return { curves, leg, marks, g, xt, yt, x0, x1, y0, y1, PX, PY, xl, yl, ylx: Math.max(26, g.x - tw - 30), n: curves.length };
  }
  function drawPlot(b, ctx, it, t) {
    const top = begin(ctx, t, it);
    const L = it._lay || (it._lay = layPlot(ctx, it, top));
    const { g, xt, yt, curves, marks } = L;
    if (!curves.length) { nothing(ctx, 'No curve to plot'); ctx.restore(); return; }
    const start = (i) => 0.6 + i * 0.6; const dur = 1.8;
    const intro = start(curves.length - 1) + dur;
    const F = focusOf(it, curves.length, t, intro, 3);
    // grid, axes and numbers
    ctx.save(); ctx.globalAlpha *= after(t, 0.05, 0.5);
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(140,170,255,0.11)';
    ctx.beginPath();
    for (const v of xt.vals) { const x = L.PX(v); ctx.moveTo(x, g.y); ctx.lineTo(x, g.y + g.h); }
    for (const v of yt.vals) { const y = L.PY(v); ctx.moveTo(g.x, y); ctx.lineTo(g.x + g.w, y); }
    ctx.stroke();
    if (L.y0 < 0 && L.y1 > 0) line(ctx, g.x, L.PY(0), g.x + g.w, L.PY(0), tint(WHITE, 0.45), 1.6);
    if (L.x0 < 0 && L.x1 > 0) line(ctx, L.PX(0), g.y, L.PX(0), g.y + g.h, tint(WHITE, 0.45), 1.6);
    line(ctx, g.x, g.y + g.h, g.x + g.w + 14, g.y + g.h, 'rgba(210,222,255,0.85)', 2.5);
    line(ctx, g.x, g.y + g.h, g.x, g.y - 14, 'rgba(210,222,255,0.85)', 2.5);
    head(ctx, g.x + g.w + 20, g.y + g.h, 0, 10, 'rgba(210,222,255,0.85)'); head(ctx, g.x, g.y - 20, -PI / 2, 10, 'rgba(210,222,255,0.85)');
    ctx.font = `600 16px ${FONT}`; ctx.fillStyle = color('muted');
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const v of xt.vals) { const x = L.PX(v); line(ctx, x, g.y + g.h, x, g.y + g.h + 6, 'rgba(210,222,255,0.7)', 1.5); ctx.fillStyle = color('muted'); ctx.fillText(xt.txt(v), x, g.y + g.h + 10); }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const v of yt.vals) { const y = L.PY(v); line(ctx, g.x - 6, y, g.x, y, 'rgba(210,222,255,0.7)', 1.5); ctx.fillStyle = color('muted'); ctx.fillText(yt.txt(v), g.x - 10, y + 1); }
    const xf = text(ctx, L.xl, g.x + g.w / 2, g.y + g.h + 46, g.w, { size: 20, weight: 700, fill: 'cyan', min: 15 });
    ctx.save(); ctx.translate(L.ylx, g.y + g.h / 2); ctx.rotate(-PI / 2);
    const yf = text(ctx, L.yl, 0, 0, g.h, { size: 20, weight: 700, fill: 'cyan', min: 15 });
    ctx.restore();
    ctx.restore();
    hitIn(b, `Tell me about the ${L.xl.toLowerCase()} axis`, g.x + g.w / 2 - xf.w / 2 - 8, g.y + g.h + 32, xf.w + 16, 30);
    hitIn(b, `Tell me about the ${L.yl.toLowerCase()} axis`, L.ylx - 16, g.y + g.h / 2 - yf.w / 2 - 8, 32, yf.w + 16);
    // the curves draw themselves on
    ctx.save(); ctx.beginPath(); ctx.rect(g.x - 1, g.y - 1, g.w + 2, g.h + 2); ctx.clip();
    curves.forEach((c, i) => {
      const p = easeOut(clamp((t - start(i)) / dur)); if (p <= 0) return;
      const e = F.e(i); const dimA = F.fixed ? F.dim(i) : 1;
      ctx.save(); ctx.globalAlpha *= dimA;
      if (c.closed && c.paths.length) {
        const fa = after(t, start(i) + dur * 0.8, 0.6);
        if (fa > 0) { const r = c.runs[0]; ctx.beginPath(); ctx.moveTo(r[0], r[1]); for (let j = 2; j < r.length; j += 2) ctx.lineTo(r[j], r[j + 1]); ctx.closePath(); ctx.fillStyle = tint(c.hue, (0.1 + 0.08 * e) * fa); ctx.fill(); }
      }
      if (e > 0.05) glow(ctx, color(c.hue), 12 * e);
      ctx.strokeStyle = color(c.hue); ctx.lineWidth = 3.5 + 1.5 * e;
      let front = null;
      if (c.type === 'points') {
        let left = c.total * p;
        for (const pa of c.paths) { const d = Math.min(left, pa.total); if (d > 0) { strokePath(ctx, pa, 0, d); front = at(pa, d); } left -= pa.total; if (left <= 0) break; }
      } else {
        const xr = g.x + g.w * p;
        ctx.save(); ctx.beginPath(); ctx.rect(g.x - 2, g.y - 2000, xr - g.x + 2, g.h + 4000); ctx.clip();
        for (const pa of c.paths) strokePath(ctx, pa, 0, pa.total);
        ctx.restore();
        if (p < 1) { for (const pa of c.paths) for (let j = 0; j + 2 < pa.pts.length; j += 2) if (pa.pts[j] <= xr && pa.pts[j + 2] >= xr) { const u = (xr - pa.pts[j]) / (pa.pts[j + 2] - pa.pts[j] || 1); front = { x: xr, y: pa.pts[j + 1] + (pa.pts[j + 3] - pa.pts[j + 1]) * u }; } }
      }
      ctx.shadowBlur = 0;
      if (p < 1 && front) dot(ctx, front.x, front.y, 6, WHITE, 10);
      if (c.closed && p >= 1) for (const ar of c.arrows) head(ctx, ar.x + Math.cos(ar.a) * 6, ar.y + Math.sin(ar.a) * 6, ar.a, 11, c.hue);
      ctx.restore();
    });
    // a dot riding the curve in focus
    if (t > intro && F.k >= 0) {
      const [k, a] = F.shown; const c = curves[k];
      if (c && !c.closed && c.paths.length) {
        const pa = c.paths[0]; const q = at(pa, pa.total * tri((t - intro) / 7));
        if (q.y >= g.y && q.y <= g.y + g.h) { ctx.save(); ctx.globalAlpha *= a * after(t, intro, 0.6); dot(ctx, q.x, q.y, 7, WHITE, 12); ctx.restore(); }
      }
    }
    ctx.restore();
    // marks
    marks.forEach((m, i) => {
      const a = after(t, 1.4 + i * 0.3, 0.5); if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a;
      line(ctx, m.x, g.y + g.h, m.x, m.has ? m.y : g.y, tint('yellow', 0.75), 2, [7, 6]);
      if (m.has) dot(ctx, m.x, m.y, 6, 'yellow', 8);
      const r = m.box;
      ctx.fillStyle = 'rgba(5,8,22,0.9)'; ctx.strokeStyle = tint('yellow', 0.6); ctx.lineWidth = 1.5;
      rounded(ctx, r.x, r.y, r.w, r.h, 14); ctx.fill(); ctx.stroke();
      text(ctx, m.label, r.x + r.w / 2, r.y + r.h / 2 + 1, r.w - 14, { size: m.f.size, weight: 700, fill: 'yellow', min: 14 });
      ctx.restore();
      hitIn(b, askOf(m, m.label), r.x, r.y, r.w, r.h);
      if (m.has) hitIn(b, askOf(m, m.label), m.x - 14, m.y - 14, 28, 28);
    });
    // enclosed areas
    curves.forEach((c, i) => {
      if (!c.area) return;
      const a = after(t, start(i) + dur + 0.2, 0.5); if (a <= 0) return;
      const r = c.area;
      ctx.save(); ctx.globalAlpha *= a;
      ctx.fillStyle = 'rgba(5,8,22,0.85)'; ctx.strokeStyle = tint(c.hue, 0.7); ctx.lineWidth = 1.5;
      rounded(ctx, r.x - r.w / 2, r.y - 15, r.w, 30, 15); ctx.fill(); ctx.stroke();
      text(ctx, r.s, r.x, r.y + 1, r.w - 12, { size: r.f.size, weight: 700, fill: c.hue, min: 14 });
      ctx.restore();
      hitIn(b, c.ask ? str(c.ask) : `What does the area inside the ${c.label.toLowerCase()} mean?`, r.x - r.w / 2, r.y - 15, r.w, 30);
    });
    // the legend
    L.leg.forEach((l, i) => {
      const a = after(t, start(i), 0.5); if (a <= 0) return;
      const e = F.e(i); const c = l.c;
      ctx.save(); ctx.globalAlpha *= a * (F.fixed ? F.dim(i) : 1);
      if (e > 0.05) glow(ctx, color(c.hue), 12 * e);
      ctx.fillStyle = 'rgba(5,8,22,0.85)'; ctx.strokeStyle = tint(c.hue, 0.45 + 0.5 * e); ctx.lineWidth = 1.5 + e;
      rounded(ctx, l.x, l.y, l.w, 30, 15); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      line(ctx, l.x + 12, l.y + 15, l.x + 38, l.y + 15, c.hue, 4);
      text(ctx, c.label, l.x + 46, l.y + 16, l.w - 54, { size: l.f.size, weight: 700, align: 'left', fill: e > 0.5 ? c.hue : 'ink', min: 14 });
      ctx.restore();
      hitIn(b, askOf(c, c.label), l.x, l.y, l.w, 30);
    });
    // taps along each curve too
    curves.forEach((c) => {
      const pts = c.inside; const step = Math.max(2, Math.floor(pts.length / 2 / 8)) * 2;
      for (let j = 0; j < pts.length; j += step) hitIn(b, askOf(c, c.label), pts[j] - 12, pts[j + 1] - 12, 24, 24);
    });
    hint(ctx, t, b);
    ctx.restore();
  }

  // ─── The engines ──────────────────────────────────────────────────────
  // Each one is wrapped so a surprise in the data never breaks the board.
  const ENGINES = {
    'x-chain': drawChain, 'x-cycle': drawCycle, 'x-why': drawWhy, 'x-layers': drawLayers, 'x-machine': drawMachine, 'x-energy': drawEnergy,
    'x-forces': drawForces, 'x-anatomy': drawAnatomy, 'x-graph': drawGraph, 'x-zoom': drawZoom, 'x-particles': drawParticles, 'x-network': drawNetwork,
    'x-wave': drawWave, 'x-balance': drawBalance, 'x-sizes': drawSizes, 'x-compare': drawCompare,
    'x-steps': drawSteps, 'x-timeline': drawTimeline, 'x-sort': drawSort, 'x-feelings': drawFeelings, 'x-story': drawStory, 'x-word': drawWord, 'x-count': drawCount,
    'x-circuit': drawCircuit, 'x-beam': drawBeam, 'x-plot': drawPlot,
  };
  const out = {};
  for (const [name, fn] of Object.entries(ENGINES)) {
    out[name] = (b, ctx, it, t) => {
      it = it && typeof it === 'object' ? it : {};
      t = Number.isFinite(t) ? Math.max(0, t) : 0;
      if (it._broken) { ctx.save(); ctx.translate(X0, Y0); nothing(ctx, '…'); ctx.restore(); return; }
      ctx.save();
      try { fn(b || {}, ctx, it, t); } catch (e) { it._broken = true; throw e; } finally { ctx.restore(); }
    };
  }
  // For development pages (not enumerable, so the board and the contact
  // sheet see only the engines): every icon and silhouette by name.
  Object.defineProperty(out, 'dev', { enumerable: false, value: { icons: ICON_NAMES, bodies: BODIES, drawIcon, drawBody: (ctx, name, x, y, w, h, t) => drawBody(ctx, bodyOf(name), x, y, w, h, t), aspect: (name) => bodyOf(name).a } });
  return out;
}
