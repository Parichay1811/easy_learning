// More biology simulations for the board, for students from 10 to 18: the
// tree of life and evolution (natural selection with peppered moths, human
// evolution, the five mass extinctions), genetics (a zoom from the body down
// to DNA bases, protein synthesis, meiosis, Punnett squares, CRISPR, cloning
// Dolly the sheep), microbes (viruses, bacteria dividing, the gut
// microbiome), the body's control systems (homeostasis), and ecology and
// plants (the nitrogen cycle, the energy pyramid, pollination,
// phototropism, symbiosis and the fungal network under a forest). Each is a
// function of time (t since it appeared, b.clock for the loop), so any moment
// can be drawn: plain canvas calls in the figure box (drawn in local
// coordinates, 800 × 700, after a translate to FIG), soft gradient glows
// instead of blur, no state between frames beyond constants cached on the
// item. BIO2_SIMS says what each one is for, so a lesson's words can pick the
// right picture.

export const BIO2_SIMS = {
  'tree-of-life': { title: 'The tree of life', keywords: ['tree of life', 'common ancestor', 'last universal common ancestor', 'evolutionary tree', 'phylogenetic tree', 'how all living things are related', 'branches of life'], example: {} },
  'natural-selection-moths': { title: 'Natural selection: the peppered moth', keywords: ['natural selection', 'peppered moth', 'peppered moths', 'survival of the fittest', 'industrial melanism', 'camouflage from predators', 'evolution by natural selection'], example: {} },
  'zoom-body-to-dna': { title: 'Zoom from the body to DNA', keywords: ['levels of organisation', 'levels of organization', 'organs tissues and cells', 'from cells to dna', 'where is dna found', 'chromosomes genes and dna', 'zoom into the body', 'cell nucleus chromosome'], example: {} },
  'protein-synthesis': { title: 'Protein synthesis', keywords: ['protein synthesis', 'transcription and translation', 'messenger rna', 'mrna codons', 'trna anticodon', 'ribosome reads the mrna', 'how proteins are made', 'triplet code'], example: {} },
  meiosis: { title: 'Meiosis', keywords: ['meiosis', 'crossing over', 'haploid cells', 'how gametes are made', 'sex cells are made', 'homologous chromosomes', 'meiosis i and ii', 'independent assortment'], example: {} },
  'punnett-square': { title: 'Punnett square', keywords: ['punnett square', 'genetic cross', 'dominant and recessive', 'monohybrid cross', 'heterozygous parents', 'genotype and phenotype', '3:1 ratio', 'mendel pea plants'], example: { trait: 'pea' } },
  'virus-replication': { title: 'How a virus replicates', keywords: ['virus replication', 'how viruses reproduce', 'lytic cycle', 'bacteriophage', 'viral replication', 'virus infects a cell', 'how a virus multiplies'], example: {} },
  'bacteria-binary-fission': { title: 'Bacteria divide: binary fission', keywords: ['binary fission', 'how bacteria reproduce', 'bacterial growth', 'bacteria divide', 'exponential growth of bacteria', 'doubling every 20 minutes', 'how bacteria multiply'], example: {} },
  'homeostasis-loop': { title: 'Homeostasis: keeping at 37 °C', keywords: ['homeostasis', 'negative feedback', 'body temperature control', 'thermoregulation', 'hypothalamus thermostat', 'sweating and shivering', 'control body temperature'], example: {} },
  'nitrogen-cycle': { title: 'The nitrogen cycle', keywords: ['nitrogen cycle', 'nitrogen fixation', 'nitrifying bacteria', 'denitrifying bacteria', 'root nodules', 'nitrates in the soil', 'nitrogen-fixing bacteria'], example: {} },
  'energy-pyramid': { title: 'The energy pyramid', keywords: ['pyramid of energy', 'energy pyramid', 'ten percent rule', '10% rule', 'trophic levels', 'energy lost between trophic levels', 'energy transfer in food chains', 'pyramid of biomass'], example: {} },
  pollination: { title: 'Pollination and seeds', keywords: ['how pollination works', 'insect pollination', 'pollen tube', 'parts of a flower', 'fertilisation in plants', 'fertilization in plants', 'stigma and anther', 'how seeds are made'], example: {} },
  phototropism: { title: 'Phototropism: growing towards light', keywords: ['phototropism', 'auxin', 'plant hormones', 'plants grow towards light', 'plant tropisms', 'shoot bends towards the light', 'plant responses to light'], example: {} },
  symbiosis: { title: 'Symbiosis: living together', keywords: ['symbiosis', 'mutualism', 'commensalism', 'parasitism', 'clownfish and anemone', 'symbiotic relationships', 'parasite and host'], example: {} },
  crispr: { title: 'CRISPR gene editing', keywords: ['crispr', 'crispr-cas9', 'crispr cas9', 'gene editing', 'genome editing', 'guide rna', 'editing dna'], example: {} },
  'human-evolution-timeline': { title: 'Human evolution', keywords: ['human evolution', 'hominins', 'homo sapiens', 'out of africa', 'walking upright', 'human ancestors', 'neanderthals', 'australopithecus'], example: {} },
  microbiome: { title: 'The gut microbiome', keywords: ['gut microbiome', 'gut bacteria', 'microbiome', 'friendly bacteria', 'good bacteria in the gut', 'gut flora', 'microbes in the gut'], example: {} },
  'cloning-dolly': { title: 'Cloning Dolly the sheep', keywords: ['dolly the sheep', 'cloning', 'nuclear transfer', 'somatic cell nuclear transfer', 'clone an animal', 'reproductive cloning', 'cloned sheep'], example: {} },
  'fungi-network': { title: 'The fungal network underground', keywords: ['mycorrhizal network', 'mycorrhiza', 'mycorrhizal fungi', 'fungal network', 'hyphae', 'wood wide web', 'mycelium', 'fungi and tree roots'], example: {} },
  'mass-extinctions': { title: 'The five mass extinctions', keywords: ['mass extinction', 'mass extinctions', 'big five extinctions', 'end-cretaceous extinction', 'extinction of the dinosaurs', 'asteroid killed the dinosaurs', 'great dying', 'permian extinction'], example: {} },
};

export function bio2Sims(kit) {
  // eslint-disable-next-line no-unused-vars
  const { FIG, COLORS, FONT, glow, label, rounded, arrow, clamp, easeOut, outBack, color, tint } = kit;
  const W = 800; const H = 700; const MX = W / 2;
  const TAU = Math.PI * 2;
  const DARK = '#070b1d';
  const PINK = '#f472b6'; const LIME = '#a3e635'; const BROWN = '#b7794a'; const SKY = '#7dd3fc'; const WHITE = '#f1f5ff'; const ROSE = '#e11d48';
  const MONO = 'ui-monospace, Menlo, Consolas, monospace';

  // Small tools: numbers, timing, loops.
  // eslint-disable-next-line no-unused-vars
  const val = (v, d) => { const n = Number(v); return v !== null && v !== undefined && v !== '' && Number.isFinite(n) ? n : d; };
  const mod = (a, n) => ((a % n) + n) % n;
  const tri = (a) => { const m = mod(a, 2); return m < 1 ? m : 2 - m; };
  const smooth = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
  const lerp = (a, c, p) => a + (c - a) * p;
  const fade = (ctx, t, d = 0.5) => { const q = easeOut(clamp(t / d)); ctx.globalAlpha *= q; return q; };
  const after = (t, at0, d = 0.4) => easeOut(clamp((t - at0) / d));
  const cycle = (t, period, delay = 0.6) => (t < delay ? 0 : mod(t - delay, period));
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const win = (x, a, b) => clamp((x - a) / (b - a));
  const cubic = (a, b, c, d, u) => { const v = 1 - u; return v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * c + u * u * u * d; };
  // A looping sequence of stages: which one is playing and how far through.
  function stages(t, durs, delay = 0.6) {
    const total = durs.reduce((a, c) => a + c, 0);
    let u = cycle(t, total, delay); const c0 = u;
    for (let i = 0; i < durs.length; i++) { if (u < durs[i]) return { i, p: u / durs[i], s: u, c: c0, total }; u -= durs[i]; }
    return { i: durs.length - 1, p: 1, s: durs[durs.length - 1], c: c0, total };
  }
  // Two colours mixed (hex in, rgb out).
  const RGB = {};
  const rgb = (c) => { const h = color(c); if (!RGB[h]) { const n = parseInt(h.replace('#', ''), 16); RGB[h] = [n >> 16, (n >> 8) & 255, n & 255]; } return RGB[h]; };
  const mix = (c1, c2, p, a = 1) => { const A = rgb(c1); const B = rgb(c2); return `rgba(${Math.round(lerp(A[0], B[0], p))},${Math.round(lerp(A[1], B[1], p))},${Math.round(lerp(A[2], B[2], p))},${a})`; };

  // Drawing helpers in the board's holo style, in the figure's local frame.
  const title = (ctx, text) => label(ctx, String(text), MX, 28, { size: 26, weight: 700, fill: 'ink' });
  function begin(ctx, t, it, name) {
    ctx.save(); ctx.translate(FIG.x, FIG.y);
    if (FIG.w !== W || FIG.h !== H) ctx.scale(FIG.w / W, FIG.h / H);
    fade(ctx, t); title(ctx, it.label || name);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  }
  const T = (ctx, s, x, y, size = 20, fill = 'ink', align = 'center', weight = 700) => label(ctx, String(s), x, y, { size, weight, fill, align });
  function chip(ctx, text, x, y, c = 'ink', size = 20, align = 'center') {
    text = String(text);
    ctx.font = `700 ${size}px ${FONT}`;
    const w = ctx.measureText(text).width + 24; const h = size + 14;
    const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.fillStyle = 'rgba(5,8,22,0.82)'; ctx.strokeStyle = tint(c, 0.6); ctx.lineWidth = 1.5;
    rounded(ctx, left, y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
    label(ctx, text, left + w / 2, y + 1, { size, weight: 700, fill: c });
  }
  function arr(ctx, x0, y0, x1, y1, c, w = 5) { if (Math.hypot(x1 - x0, y1 - y0) > 4) arrow(ctx, x0, y0, x1, y1, c, w); }
  function dot(ctx, x, y, r, c, blur = 0) {
    if (blur) glow(ctx, color(c), blur);
    ctx.fillStyle = color(c); ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); ctx.fill();
    if (blur) ctx.shadowBlur = 0;
  }
  function line(ctx, x0, y0, x1, y1, c = 'ink', w = 2, dash) {
    ctx.strokeStyle = color(c); ctx.lineWidth = w;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    if (dash) ctx.setLineDash([]);
  }
  function poly(ctx, pts, close = false) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    if (close) ctx.closePath();
  }
  function panel(ctx, x, y, w, h, c = 'blue', a = 0.08, r = 16) {
    ctx.fillStyle = tint(c, a); ctx.strokeStyle = tint(c, 0.6); ctx.lineWidth = 2;
    rounded(ctx, x, y, w, h, r); ctx.fill(); ctx.stroke();
  }
  function ell(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); }
  function lead(ctx, x0, y0, x1, y1, c = 'muted') { line(ctx, x0, y0, x1, y1, tint(c, 0.65), 1.5); dot(ctx, x1, y1, 3.5, c); }
  // A soft glow: a radial gradient disc (cheap, no blur).
  function soft(ctx, x, y, r, c, a = 0.5) {
    if (r <= 0.5 || a <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, tint(c, a)); g.addColorStop(1, tint(c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  // An organic wobbly closed shape around (x, y).
  function blob(ctx, x, y, r, k, seed = 0, wob = 0.08, n = 36, sy = 1) {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU;
      const rr = r * (1 + wob * (Math.sin(a * 3 + k * 1.3 + seed) * 0.6 + Math.sin(a * 5 - k * 0.9 + seed * 2) * 0.4));
      const px = x + Math.cos(a) * rr; const py = y + Math.sin(a) * rr * sy;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
  }
  // Drifting glowing specks for depth.
  function motes(ctx, k, n, c, box = [20, 60, 760, 520], seed = 0, size = 2.2, a = 0.35) {
    const [bx, by, bw, bh] = box;
    for (let i = 0; i < n; i++) {
      const x = bx + mod(rnd(i + seed) * bw + Math.sin(k * 0.3 + i) * 12 + k * (3 + rnd(i + 9) * 6), bw);
      const y = by + mod(rnd(i * 3 + seed + 1) * bh - k * (5 + rnd(i + 5) * 8), bh);
      const tw = 0.3 + 0.7 * Math.abs(Math.sin(k * (0.8 + rnd(i + 2)) + i));
      ctx.fillStyle = tint(c, a * tw); ctx.beginPath(); ctx.arc(x, y, size * (0.6 + rnd(i + 7)), 0, TAU); ctx.fill();
    }
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
  function strokeSpan(ctx, p, d0, d1) {
    if (d1 <= d0) return;
    const a0 = at(p, d0); const a1 = at(p, d1);
    ctx.beginPath(); ctx.moveTo(a0.x, a0.y);
    for (let i = a0.i + 1; i <= a1.i; i++) ctx.lineTo(p.pts[2 * i], p.pts[2 * i + 1]);
    ctx.lineTo(a1.x, a1.y); ctx.stroke();
  }
  // A cubic curve as points, for mkPath.
  function curvePts(x0, y0, x1, y1, x2, y2, x3, y3, n = 24) {
    const pts = [];
    for (let i = 0; i <= n; i++) { const u = i / n; pts.push(cubic(x0, x1, x2, x3, u), cubic(y0, y1, y2, y3, u)); }
    return pts;
  }
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
  // The stage caption across the bottom: a heading, a sentence, and pips.
  function caption(ctx, head, body, c = 'cyan', s = 1, i = -1, n = 0) {
    panel(ctx, 20, 598, 760, 94, c, 0.09, 16);
    for (let j = 0; j < n; j++) dot(ctx, 46 + j * 17, 620, j === i ? 5.5 : 3.5, j === i ? c : 'rgba(147,160,196,0.45)');
    ctx.save(); ctx.globalAlpha *= clamp(s / 0.35);
    T(ctx, head, MX, 620, 21, c);
    para(ctx, body, 44, 662, 712, 19, 'ink', 500, 2);
    ctx.restore();
  }
  // A simple standing person, feet at (x, y), height h.
  function person(ctx, x, y, h, c = 'cyan', a = 0.2, lw = 2.5) {
    const r = h * 0.075;
    ctx.fillStyle = tint(c, a); ctx.strokeStyle = color(c); ctx.lineWidth = lw;
    ell(ctx, x, y - h + r, r, r * 1.08); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(x - h * 0.11, y - h * 0.8, h * 0.22, h * 0.36, h * 0.06); ctx.fill(); ctx.stroke();
    for (const s of [-1, 1]) {
      ctx.lineWidth = h * 0.055; ctx.strokeStyle = tint(c, 0.5);
      ctx.beginPath(); ctx.moveTo(x + s * h * 0.12, y - h * 0.76); ctx.lineTo(x + s * h * 0.17, y - h * 0.46); ctx.stroke();
      ctx.lineWidth = h * 0.07;
      ctx.beginPath(); ctx.moveTo(x + s * h * 0.055, y - h * 0.46); ctx.lineTo(x + s * h * 0.075, y - h * 0.02); ctx.stroke();
    }
  }
  // Little icons for the branches of life.
  function icon(ctx, kind, x, y, s, c) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = tint(c, 0.3); ctx.strokeStyle = color(c); ctx.lineWidth = 2;
    if (kind === 'bact') {
      ctx.beginPath(); ctx.roundRect(-16, -7, 32, 14, 7); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(16, 0); ctx.bezierCurveTo(22, -6, 26, 6, 32, 0); ctx.stroke();
    } else if (kind === 'arch') {
      ell(ctx, 0, 0, 13, 11); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-13, 0); ctx.bezierCurveTo(-20, -8, -24, 8, -30, 2); ctx.stroke();
      dot(ctx, 3, -2, 3, c);
    } else if (kind === 'plant') {
      ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(0, -4); ctx.stroke();
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 2); ctx.quadraticCurveTo(sd * 18, -2, sd * 16, -14); ctx.quadraticCurveTo(sd * 4, -12, 0, 2); ctx.fill(); ctx.stroke(); }
    } else if (kind === 'fungi') {
      ctx.beginPath(); ctx.moveTo(-17, -1); ctx.quadraticCurveTo(-15, -17, 0, -17); ctx.quadraticCurveTo(15, -17, 17, -1); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(-5, -1, 10, 15, 3); ctx.fill(); ctx.stroke();
    } else if (kind === 'insect') {
      for (const [dx, r] of [[-12, 6], [0, 5], [11, 8]]) { ell(ctx, dx, 0, r, r * 0.8); ctx.fill(); ctx.stroke(); }
      ctx.beginPath(); for (const dx of [-4, 1, 6]) { ctx.moveTo(dx, 3); ctx.lineTo(dx - 4, 13); ctx.moveTo(dx, -3); ctx.lineTo(dx - 4, -13); } ctx.stroke();
    } else if (kind === 'fish') {
      ell(ctx, -2, 0, 16, 9); ctx.fill(); ctx.stroke();
      poly(ctx, [12, 0, 24, -9, 24, 9], true); ctx.fill(); ctx.stroke();
      dot(ctx, -10, -2, 2, c);
    } else if (kind === 'human') {
      ctx.restore(); person(ctx, x, y + 16 * s, 36 * s, c, 0.3, 2); return;
    }
    ctx.restore();
  }

  return {
    // ─── Evolution ────────────────────────────────────────────────────────

    // Branches grow from one ancestor to the living groups; light pulses
    // run up the lineages, and the stages pick out who is related to whom.
    'tree-of-life'(b, ctx, it, t) {
      const k = b.clock;
      begin(ctx, t, it, 'The tree of life');
      if (!it._tol) {
        const N = { root: [300, 540], n1: [376, 470], n2: [446, 404], n3: [516, 342], n4: [586, 288], n5: [656, 240] };
        const TY = 196;
        const E = [[N.root, N.n1, 'purple', 0.2, 9], [N.root, [80, TY], 'green', 0.4, 6], [N.n1, [190, TY], 'teal', 1.0, 6], [N.n1, N.n2, 'purple', 1.0, 8],
          [N.n2, [300, TY], LIME, 1.6, 5.5], [N.n2, N.n3, 'purple', 1.6, 7], [N.n3, [410, TY], 'orange', 2.2, 5], [N.n3, N.n4, 'purple', 2.2, 6],
          [N.n4, [520, TY], 'yellow', 2.8, 4.5], [N.n4, N.n5, 'purple', 2.8, 5], [N.n5, [620, TY], 'cyan', 3.3, 4], [N.n5, [720, TY], PINK, 3.3, 4]];
        it._tol = E.map(([a, c, col, d, w]) => { const my = (a[1] + c[1]) / 2; return { path: mkPath(curvePts(a[0], a[1], a[0], my, c[0], my, c[0], c[1])), col, d, w, to: c }; });
        it._tolN = Object.values(N);
      }
      const ED = it._tol;
      const S = stages(t, [3.6, 3.6, 3.6, 3.6, 4.2], 4.0);
      const st = t < 4.0 ? -1 : S.i;
      const LIT = [null, [1, 2], [3, 4, 5, 6, 7, 8, 9, 10, 11], [6, 7, 8, 9, 10, 11], [0, 3, 5, 7, 9, 11]][Math.max(0, st)];
      const lit = (e) => !LIT || LIT.includes(e);
      motes(ctx, k, 40, 'purple', [20, 60, 760, 520], 3, 2, 0.3);
      // Time runs up the tree.
      arr(ctx, 30, 540, 30, 230, tint('muted', 0.5), 2.5);
      ctx.save(); ctx.translate(16, 386); ctx.rotate(-Math.PI / 2); T(ctx, 'time: about 4 billion years', 0, 0, 18, 'muted', 'center', 500); ctx.restore();
      // Branches: a wide soft stroke under a bright core, growing from the root.
      ED.forEach((e, i) => {
        const g = after(t, e.d, 1.0); if (g <= 0) return;
        const on = lit(i); const L = e.path.total * g;
        ctx.strokeStyle = tint(e.col, on ? 0.18 : 0.06); ctx.lineWidth = e.w + 12; strokeSpan(ctx, e.path, 0, L);
        ctx.strokeStyle = tint(e.col, on ? 0.95 : 0.35); ctx.lineWidth = e.w; strokeSpan(ctx, e.path, 0, L);
        if (on && g >= 1) for (let j = 0; j < 2; j++) {
          const q = mod(k * 0.45 + j * 0.5 + i * 0.17, 1); const P = at(e.path, q * e.path.total);
          soft(ctx, P.x, P.y, 16, e.col, 0.7); dot(ctx, P.x, P.y, 3.5, WHITE);
        }
      });
      for (const [x, y] of it._tolN) { ctx.save(); ctx.globalAlpha *= after(t, 0.3, 0.8); dot(ctx, x, y, 6, 'purple'); dot(ctx, x, y, 3, WHITE); ctx.restore(); }
      soft(ctx, 300, 540, 40 + 6 * Math.sin(k * 2), 'purple', 0.6); dot(ctx, 300, 540, 9, WHITE);
      // The living groups at the tips.
      const TIPS = [['Bacteria', 80, 'green', 'bact', 1], ['Archaea', 190, 'teal', 'arch', 2], ['Plants', 300, LIME, 'plant', 4], ['Fungi', 410, 'orange', 'fungi', 6], ['Insects', 520, 'yellow', 'insect', 8], ['Fish', 620, 'cyan', 'fish', 10], ['Humans', 720, PINK, 'human', 11]];
      TIPS.forEach(([name, x, c, kind, e]) => {
        const g = after(t, ED[e].d + 0.9, 0.5); if (g <= 0) return;
        ctx.save(); ctx.globalAlpha *= g * (lit(e) ? 1 : 0.45);
        soft(ctx, x, 168, 34, c, lit(e) ? 0.35 : 0.1);
        icon(ctx, kind, x, 168, 1.15, c);
        T(ctx, name, x, 128, 20, c);
        ctx.restore();
      });
      // You are here.
      const yh = after(t, 4.4, 0.6);
      if (yh > 0) {
        ctx.save(); ctx.globalAlpha *= yh * (st === 4 ? 1 : 0.75);
        if (st === 4) soft(ctx, 720, 168, 50 + 8 * Math.sin(k * 4), PINK, 0.4);
        chip(ctx, 'You are here', 674, 78, PINK, 19);
        line(ctx, 712, 96, 718, 112, PINK, 2);
        ctx.restore();
      }
      ctx.save(); ctx.globalAlpha *= after(t, 0.6, 0.8);
      T(ctx, 'LUCA: the last universal common ancestor', 330, 576, 19, 'purple', 'center', 600);
      ctx.restore();
      const CAP = [
        ['One ancestor for all life', 'Every living thing descends from simple cells that lived about 4 billion years ago.', 'purple'],
        ['Microbes branched first', 'Bacteria and archaea are single cells with no nucleus. They are still everywhere.', 'green'],
        ['Cells with a nucleus', 'Plants, fungi and animals all have complex cells: they share a later ancestor.', LIME],
        ['Fungi are our closer cousins', 'Surprise: mushrooms are more closely related to animals than to plants.', 'orange'],
        ['You are here', 'Humans are one tiny twig. Every living thing is your distant relative.', PINK],
      ];
      if (st < 0) caption(ctx, 'The tree grows', 'Over billions of years one lineage split again and again into millions of species.', 'purple', t, -1, 5);
      else { const [h, s, c] = CAP[st]; caption(ctx, h, s, c, S.s, st, 5); }
      ctx.restore();
    },

    // Pale and dark peppered moths on bark that is clean, then sooty, then
    // clean again; birds take the moths they can see, and the share of dark
    // moths follows the soot over two hundred years.
    'natural-selection-moths'(b, ctx, it, t) {
      const k = b.clock; const P = 20;
      const yrAt = (tt) => lerp(1800, 2000, cycle(tt, P, 0.6) / P);
      const env = (yr) => {
        const soot = smooth((yr - 1830) / 45) * (1 - smooth((yr - 1958) / 28));
        const dark = 0.06 + 0.89 * smooth((yr - 1850) / 45) - 0.82 * smooth((yr - 1968) / 32);
        return { soot, dark };
      };
      const yr = yrAt(t); const { soot, dark } = env(yr);
      begin(ctx, t, it, 'Natural selection: the peppered moth');
      // The bark close-up.
      const BX = 30; const BY = 62; const BW = 400; const BH = 524;
      ctx.save();
      rounded(ctx, BX, BY, BW, BH, 18); ctx.clip();
      ctx.fillStyle = mix('#c9c6b2', '#24221f', soot); ctx.fillRect(BX, BY, BW, BH);
      // Lichen patches (they die off in polluted air).
      for (let i = 0; i < 16; i++) {
        const x = BX + rnd(i + 40) * BW; const y = BY + rnd(i + 70) * BH; const r = 26 + rnd(i + 90) * 40;
        ctx.fillStyle = mix('#b8c9a0', '#2e2c27', soot, 0.55 * (1 - soot * 0.9));
        blob(ctx, x, y, r, 0, i, 0.25, 20, 0.7); ctx.fill();
      }
      // Bark fissures.
      ctx.strokeStyle = mix('#8d8a78', '#121110', soot, 0.8); ctx.lineWidth = 3;
      for (let i = 0; i < 11; i++) {
        const x0 = BX + 14 + i * 37 + rnd(i) * 12; ctx.beginPath();
        for (let y = BY; y <= BY + BH; y += 14) { const x = x0 + 8 * Math.sin(y * 0.03 + i * 2) + 4 * Math.sin(y * 0.11 + i); if (y === BY) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.stroke();
      }
      // Soot haze.
      ctx.fillStyle = `rgba(20,18,16,${0.25 * soot})`; ctx.fillRect(BX, BY, BW, BH);
      // Moths.
      const MO = []; for (let i = 0; i < 12; i++) MO.push({ x: BX + 70 + (i % 3) * 128 + (rnd(i + 3) - 0.5) * 50, y: BY + 70 + Math.floor(i / 3) * 122 + (rnd(i + 8) - 0.5) * 40, a: (rnd(i + 13) - 0.5) * 0.9, thr: (((i * 7) % 12) + 0.5) / 12 });
      const shade = (m, d) => smooth((d - m.thr) / 0.05 + 0.5);
      const visible = (m, e) => Math.abs(lerp(0.85, 0.16, shade(m, e.dark)) - lerp(0.76, 0.16, e.soot)) > 0.3;
      // The bird's swoop: every 2.4 s it takes one moth that stands out.
      const SW = 2.4; const n = Math.floor(t / SW); const sp = mod(t, SW) / SW;
      const e0 = env(yrAt(n * SW)); const vis = MO.map((m, i) => i).filter((i) => visible(MO[i], e0));
      const tgt = t > 1.5 && vis.length ? vis[(n * 5) % vis.length] : -1;
      const moth = (x, y, s, ang, d, a = 1) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s); ctx.globalAlpha *= a;
        const body = mix('#ece8dc', '#1d1b18', d); const edge = mix('#8f8a7c', '#4a4640', d);
        ctx.fillStyle = body; ctx.strokeStyle = edge; ctx.lineWidth = 1;
        for (const sd of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(0, 5); ctx.quadraticCurveTo(sd * 8, 18, sd * 15, 15); ctx.quadraticCurveTo(sd * 18, 8, sd * 3, 1); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(sd * 2, -8); ctx.quadraticCurveTo(sd * 16, -12, sd * 29, -4); ctx.quadraticCurveTo(sd * 26, 6, sd * 18, 9); ctx.quadraticCurveTo(sd * 8, 8, sd * 2, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        ctx.fillStyle = mix('#3a3632', '#9a948a', d, 0.8);
        for (let j = 0; j < 10; j++) { const sd = j % 2 ? 1 : -1; dot(ctx, sd * (5 + rnd(j) * 18), -8 + rnd(j + 4) * 18, 1.4, mix('#3a3632', '#5a554e', d)); }
        ctx.fillStyle = mix('#a39d8f', '#0e0d0c', d); ell(ctx, 0, 2, 3.5, 12); ctx.fill();
        ctx.strokeStyle = edge; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-1, -9); ctx.lineTo(-7, -18); ctx.moveTo(1, -9); ctx.lineTo(7, -18); ctx.stroke();
        ctx.restore();
      };
      // Bird position.
      let bx = -100; let by = -100; let flap = Math.sin(k * 16);
      if (tgt >= 0) {
        const m = MO[tgt];
        if (sp < 0.45) { const q = smooth(sp / 0.45); bx = cubic(380, 380, m.x + 120, m.x + 36, q); by = cubic(100, 110, m.y - 140, m.y - 10, q); }
        else { const q = smooth((sp - 0.45) / 0.55); bx = cubic(m.x + 36, m.x + 50, 300, 200, q); by = cubic(m.y - 10, m.y - 70, 140, 110, q); }
      }
      MO.forEach((m, i) => {
        if (i === tgt && sp >= 0.45) return;
        const d = shade(m, dark);
        const pulse = 1 + 0.04 * Math.sin(k * 2 + i);
        moth(m.x, m.y, 1.15 * pulse, m.a, d);
        if (i === tgt && sp > 0.15) { ctx.strokeStyle = tint('red', 0.9 * win(sp, 0.15, 0.3)); ctx.lineWidth = 2.5; ell(ctx, m.x, m.y, 30, 26); ctx.stroke(); }
      });
      if (tgt >= 0) {
        const m = MO[tgt];
        ctx.save(); ctx.translate(bx, by); ctx.globalAlpha *= after(sp, 0, 0.12) * (1 - win(sp, 0.86, 1));
        ctx.scale(-1.5, 1.5);
        if (sp >= 0.45) moth(40, 2, 0.5, 0.4, shade(m, dark));
        ctx.fillStyle = '#7c8aa5'; ctx.strokeStyle = WHITE; ctx.lineWidth = 2;
        ell(ctx, 0, 0, 24, 12, -0.15); ctx.fill(); ctx.stroke();
        ell(ctx, 22, -10, 10, 9); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fbbf24'; poly(ctx, [31, -12, 42, -8, 31, -5], true); ctx.fill();
        dot(ctx, 25, -12, 2, DARK);
        ctx.fillStyle = '#5b6780'; ctx.beginPath(); ctx.moveTo(-6, -4); ctx.quadraticCurveTo(-4, -30 * flap - 6, -26, -24 * flap - 4); ctx.quadraticCurveTo(-18, -2, -6, -4); ctx.fill(); ctx.stroke();
        poly(ctx, [-22, 0, -40, -6, -38, 8], true); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      ctx.strokeStyle = tint('muted', 0.5); ctx.lineWidth = 2; rounded(ctx, BX, BY, BW, BH, 18); ctx.stroke();
      // Right column: the year, the two populations, the graph, the factory.
      const RX = 456;
      const era = yr < 1850 ? 'Before the factories' : yr < 1958 ? 'Industrial Revolution' : 'Clean Air Act (1956)';
      T(ctx, `Year ${Math.round(yr)}`, 618, 82, 28, 'yellow');
      T(ctx, era, 618, 114, 19, 'muted', 'center', 600);
      const bar = (y, name, f, c) => {
        T(ctx, name, RX, y, 19, c, 'left'); T(ctx, `${Math.round(f * 100)}%`, 780, y, 19, c, 'right');
        ctx.fillStyle = tint('muted', 0.15); rounded(ctx, RX, y + 14, 324, 20, 10); ctx.fill();
        ctx.fillStyle = tint(c, 0.85); rounded(ctx, RX, y + 14, Math.max(20, 324 * f), 20, 10); ctx.fill();
      };
      bar(150, 'Pale moths', 1 - dark, '#e7e2d3');
      bar(210, 'Dark moths', dark, '#8a8478');
      const G = { x: 500, y: 300, w: 262, h: 140 };
      T(ctx, '% of moths that are dark', RX, 274, 18, 'muted', 'left', 600);
      ctx.strokeStyle = tint('muted', 0.2); ctx.lineWidth = 1; ctx.beginPath();
      for (const f of [0, 0.5, 1]) { ctx.moveTo(G.x, G.y + G.h - f * G.h); ctx.lineTo(G.x + G.w, G.y + G.h - f * G.h); }
      ctx.stroke();
      for (const [f, s] of [[0, '0'], [0.5, '50'], [1, '100']]) T(ctx, s, G.x - 8, G.y + G.h - f * G.h, 18, 'muted', 'right', 500);
      for (const [f, s] of [[0, '1800'], [0.5, '1900'], [1, '2000']]) T(ctx, s, G.x + f * G.w, G.y + G.h + 22, 18, 'muted', 'center', 500);
      ctx.strokeStyle = tint('muted', 0.25); ctx.lineWidth = 6; ctx.beginPath();
      for (let y = 1800; y <= 2000; y += 4) { const px = G.x + ((y - 1800) / 200) * G.w; const py = G.y + G.h - env(y).soot * G.h; if (y === 1800) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.stroke();
      ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 3; ctx.beginPath();
      for (let y = 1800; y <= yr; y += 2) { const px = G.x + ((y - 1800) / 200) * G.w; const py = G.y + G.h - env(y).dark * G.h; if (y === 1800) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.stroke();
      const gx = G.x + ((yr - 1800) / 200) * G.w; const gy = G.y + G.h - dark * G.h;
      soft(ctx, gx, gy, 16, 'yellow', 0.7); dot(ctx, gx, gy, 5, 'yellow');
      // Factory with smoke.
      const FY = 584;
      ctx.fillStyle = '#1a2036'; ctx.strokeStyle = tint('muted', 0.6); ctx.lineWidth = 2;
      poly(ctx, [RX + 10, FY, RX + 10, FY - 40, RX + 60, FY - 62, RX + 60, FY - 40, RX + 110, FY - 62, RX + 110, FY - 40, RX + 160, FY - 62, RX + 160, FY], true); ctx.fill(); ctx.stroke();
      for (const cx0 of [RX + 190, RX + 236]) { ctx.beginPath(); ctx.rect(cx0, FY - 92, 22, 92); ctx.fill(); ctx.stroke(); }
      ctx.beginPath(); ctx.rect(RX + 160, FY - 40, 110, 40); ctx.fill(); ctx.stroke();
      for (let w = 0; w < 3; w++) { ctx.fillStyle = tint('yellow', 0.25 + 0.5 * soot); ctx.fillRect(RX + 26 + w * 50, FY - 26, 16, 12); }
      for (let i = 0; i < 10; i++) {
        const q = mod(k * 0.35 + i / 10, 1); const cx0 = i % 2 ? RX + 201 : RX + 247;
        const x = cx0 + q * 70 + Math.sin(q * 6 + i) * 8; const y = FY - 100 - q * 70;
        ctx.fillStyle = `rgba(150,146,140,${0.6 * soot * (1 - q)})`; ctx.beginPath(); ctx.arc(x, y, 8 + q * 16, 0, TAU); ctx.fill();
      }
      T(ctx, 'Soot', 700, FY - 22, 18, soot > 0.2 ? 'ink' : 'muted', 'center', 600);
      T(ctx, 'Soot level', G.x + G.w, G.y - 12, 18, 'muted', 'right', 500);
      const cap = yr < 1850 ? ['Clean bark covered in pale lichen', 'Pale moths are camouflaged. Birds spot and eat the rare dark ones.', 'teal']
        : yr < 1958 ? ['Factory soot blackens the trees', 'Now pale moths stand out. Dark moths survive and pass on their dark-wing gene.', 'orange']
          : ['Clean air: the bark gets paler again', 'The tables turn: pale moths survive better and become common again.', 'green'];
      caption(ctx, cap[0], cap[1], cap[2], 1, -1, 0);
      ctx.restore();
    },

    // ─── From body to molecule ───────────────────────────────────────────

    // A continuous zoom: person, heart, muscle tissue, a muscle cell, its
    // nucleus, a chromosome, a gene, and the DNA bases, with a scale bar.
    'zoom-body-to-dna'(b, ctx, it, t) {
      const k = b.clock; const F = 7; const R = 230;
      const NAMES = ['Person', 'Organ', 'Tissue', 'Cell', 'Nucleus', 'Chromosome', 'Gene', 'DNA bases'];
      const P = 20.5; const c = cycle(t, P, 0.6); const DW = 1.4; const ZM = 1.0;
      let z;
      if (c < 7 * (DW + ZM)) { const seg = Math.floor(c / (DW + ZM)); const f = c - seg * (DW + ZM); z = seg + smooth((f - DW) / ZM); } else z = 7;
      const alphaAll = (t < P ? 1 : smooth(c / 0.5)) * (1 - smooth((c - (P - 0.6)) / 0.6));
      begin(ctx, t, it, 'Zoom from the body to DNA');
      const VX = 20; const VY = 60; const VW = 592; const VH = 526; const C = [VX + VW / 2, VY + VH / 2];
      // Each level draws around (0, 0) at scale 1, its inner level at the centre.
      const LV = [
        (s) => { // person, heart at the centre
          soft(ctx, 0, 0, 260, 'cyan', 0.12);
          ctx.save(); ctx.translate(0, -40); person(ctx, 0, 300, 430, 'cyan', 0.16, 3 / s); ctx.restore();
          ctx.strokeStyle = tint('cyan', 0.35); ctx.lineWidth = 2 / s; ell(ctx, -26, -10, 36, 56); ctx.stroke(); ell(ctx, 26, -10, 36, 56); ctx.stroke();
        },
        (s) => { // heart
          soft(ctx, 0, 0, 280, 'red', 0.2);
          ctx.save(); const beat = 1 + 0.025 * Math.max(0, Math.sin(k * 7)); ctx.scale(beat, beat); ctx.rotate(-0.25);
          const g = ctx.createLinearGradient(-200, -200, 200, 200); g.addColorStop(0, '#fb7185'); g.addColorStop(1, '#9f1239');
          ctx.fillStyle = g; ctx.strokeStyle = '#fecdd3'; ctx.lineWidth = 3 / s;
          ctx.beginPath(); ctx.moveTo(10, 210); ctx.bezierCurveTo(-70, 160, -215, 70, -200, -50); ctx.bezierCurveTo(-190, -160, -70, -175, -10, -110);
          ctx.bezierCurveTo(50, -180, 185, -160, 200, -55); ctx.bezierCurveTo(215, 60, 90, 160, 10, 210); ctx.fill(); ctx.stroke();
          ctx.lineWidth = 34; ctx.strokeStyle = '#e11d48'; ctx.beginPath(); ctx.moveTo(-30, -120); ctx.bezierCurveTo(-40, -230, 70, -240, 90, -170); ctx.stroke();
          ctx.lineWidth = 26; ctx.strokeStyle = '#6366f1'; ctx.beginPath(); ctx.moveTo(40, -110); ctx.lineTo(60, -220); ctx.stroke();
          ctx.strokeStyle = 'rgba(254,205,211,0.55)'; ctx.lineWidth = 5 / s; ctx.beginPath(); ctx.moveTo(-20, -100); ctx.bezierCurveTo(-60, -10, -40, 80, 10, 190); ctx.moveTo(-90, -60); ctx.quadraticCurveTo(-140, 20, -120, 90); ctx.stroke();
          ctx.restore();
          ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2 / s; ctx.setLineDash([6 / s, 6 / s]); ell(ctx, 0, 0, 36, 36); ctx.stroke(); ctx.setLineDash([]);
        },
        (s) => { // cardiac muscle tissue
          ctx.save(); ell(ctx, 0, 0, R, R); ctx.clip();
          ctx.fillStyle = '#3b0a1a'; ctx.fillRect(-R, -R, 2 * R, 2 * R);
          for (let r = -5; r <= 5; r++) {
            const y = r * 44; const off = (r % 2) * 38;
            for (let j = -4; j <= 4; j++) {
              const x = j * 76 + off; if (r === 0 && j === 0) continue;
              ctx.fillStyle = 'rgba(251,113,133,0.4)'; ctx.strokeStyle = 'rgba(254,205,211,0.7)'; ctx.lineWidth = 1.5 / s;
              ctx.beginPath(); ctx.roundRect(x - 35, y - 18, 70, 36, 10); ctx.fill(); ctx.stroke();
              ctx.strokeStyle = 'rgba(254,205,211,0.25)'; ctx.lineWidth = 1 / s; ctx.beginPath(); for (let q = -28; q <= 28; q += 7) { ctx.moveTo(x + q, y - 14); ctx.lineTo(x + q, y + 14); } ctx.stroke();
              ctx.fillStyle = 'rgba(167,139,250,0.8)'; ell(ctx, x, y, 9, 6); ctx.fill();
            }
          }
          ctx.restore();
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2 / s; ctx.setLineDash([6 / s, 6 / s]); ctx.beginPath(); ctx.roundRect(-38, -20, 76, 40, 12); ctx.stroke(); ctx.setLineDash([]);
        },
        (s) => { // a heart muscle cell
          soft(ctx, 0, 0, 300, 'red', 0.12);
          ctx.fillStyle = 'rgba(190,24,60,0.35)'; ctx.strokeStyle = '#fda4af'; ctx.lineWidth = 3 / s;
          ctx.beginPath(); ctx.roundRect(-230, -120, 460, 240, 60); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = 'rgba(254,205,211,0.28)'; ctx.lineWidth = 6 / s;
          for (let y = -95; y <= 95; y += 22) { if (Math.abs(y) < 40) continue; ctx.beginPath(); ctx.moveTo(-205, y); ctx.lineTo(205, y); ctx.stroke(); }
          for (let i = 0; i < 14; i++) { const x = -190 + (i % 7) * 63; const y = i < 7 ? -72 : 72; ctx.fillStyle = 'rgba(251,146,60,0.75)'; ell(ctx, x + 10 * Math.sin(k + i), y, 20, 8); ctx.fill(); ctx.strokeStyle = 'rgba(255,237,213,0.6)'; ctx.lineWidth = 1 / s; ctx.stroke(); }
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2 / s; ctx.setLineDash([6 / s, 6 / s]); ell(ctx, 0, 0, 38, 38); ctx.stroke(); ctx.setLineDash([]);
        },
        (s) => { // nucleus
          soft(ctx, 0, 0, 260, 'purple', 0.25);
          ctx.fillStyle = 'rgba(76,29,149,0.55)'; ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 5 / s; ell(ctx, 0, 0, 215, 205); ctx.fill(); ctx.stroke();
          ctx.lineWidth = 2 / s; ell(ctx, 0, 0, 225, 215); ctx.stroke();
          for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU; dot(ctx, Math.cos(a) * 220, Math.sin(a) * 210, 5, '#ddd6fe'); }
          ctx.fillStyle = 'rgba(244,114,182,0.45)'; ell(ctx, -110, 90, 46, 40); ctx.fill();
          ctx.lineWidth = 4 / s;
          for (let i = 0; i < 9; i++) {
            ctx.strokeStyle = i % 2 ? 'rgba(96,165,250,0.6)' : 'rgba(244,114,182,0.55)'; ctx.beginPath();
            const a0 = rnd(i + 3) * TAU; const r0 = 70 + rnd(i) * 100;
            for (let q = 0; q <= 30; q++) { const a = a0 + q * 0.08; const rr = r0 + 14 * Math.sin(q * 0.9 + i + k * 0.5); const x = Math.cos(a) * rr; const y = Math.sin(a) * rr * 0.95; if (q) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
            ctx.stroke();
          }
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2 / s; ctx.setLineDash([6 / s, 6 / s]); ell(ctx, 0, 0, 40, 40); ctx.stroke(); ctx.setLineDash([]);
        },
        (s) => { // chromosome, the gene band at the centre
          soft(ctx, 0, 0, 260, 'blue', 0.2);
          ctx.save(); ctx.translate(-44, -75);
          for (const sd of [-1, 1]) {
            ctx.save(); ctx.rotate(sd * 0.53);
            const g = ctx.createLinearGradient(-36, 0, 36, 0); g.addColorStop(0, '#3b5bdb'); g.addColorStop(0.5, '#93c5fd'); g.addColorStop(1, '#3b5bdb');
            ctx.fillStyle = g; ctx.strokeStyle = '#dbeafe'; ctx.lineWidth = 3 / s;
            ctx.beginPath(); ctx.roundRect(-34, -196, 68, 392, 34); ctx.fill(); ctx.stroke();
            ctx.fillStyle = 'rgba(30,27,75,0.45)';
            for (const [y0, h] of [[-160, 14], [-120, 22], [-70, 10], [40, 18], [100, 12], [150, 20]]) ctx.fillRect(-34, y0, 68, h);
            ctx.restore();
          }
          ctx.restore();
          ctx.save(); ctx.translate(0, 0); ctx.rotate(-0.53);
          ctx.fillStyle = 'rgba(251,191,36,0.85)'; ctx.fillRect(-34, -14, 68, 28);
          ctx.restore();
          soft(ctx, 0, 0, 50, 'yellow', 0.45);
        },
        (s) => { // a gene: DNA wound on histones, the gene lit up
          soft(ctx, 0, 0, 260, 'yellow', 0.1);
          ctx.lineWidth = 7 / Math.max(s, 0.6);
          for (let i = -4; i <= 4; i++) {
            const x = i * 54; const y = 22 * Math.sin(i * 1.1);
            const gene = Math.abs(i) <= 1;
            ctx.fillStyle = gene ? 'rgba(251,191,36,0.35)' : 'rgba(167,139,250,0.35)'; ctx.strokeStyle = gene ? '#fde68a' : '#c4b5fd';
            ell(ctx, x, y, 21, 21); ctx.fill(); ctx.lineWidth = 2 / s; ctx.stroke();
            ctx.lineWidth = 6 / Math.max(s, 0.6); ctx.strokeStyle = gene ? '#fbbf24' : '#818cf8';
            ctx.beginPath(); ctx.arc(x, y, 25, 0.3, TAU - 0.3); ctx.stroke();
            if (i < 4) { const nx = x + 54; const ny = 22 * Math.sin((i + 1) * 1.1); ctx.beginPath(); ctx.moveTo(x + 24, y + 7); ctx.quadraticCurveTo(x + 27, (y + ny) / 2 + 34, nx - 24, ny + 7); ctx.stroke(); }
          }
        },
        (s) => { // the base pairs
          soft(ctx, 0, 0, 280, 'cyan', 0.12);
          const BASES = 'ATGCGTACCTAGGA';
          const PAIR = { A: 'T', T: 'A', G: 'C', C: 'G' }; const BC = { A: 'green', T: 'red', G: 'yellow', C: 'cyan' };
          const sh = mod(k * 10, 34);
          for (let i = -8; i <= 8; i++) {
            const x = i * 34 + sh - 17; if (x < -235 || x > 235) continue;
            const yT = -110 + 12 * Math.sin(x * 0.012 + k * 0.6); const yB = 110 + 12 * Math.sin(x * 0.012 + k * 0.6 + 1);
            const bse = BASES[mod(i - Math.floor((k * 10) / 34), BASES.length)]; const p = PAIR[bse];
            const edge = 1 - Math.abs(x) / 235;
            ctx.globalAlpha *= 1; ctx.lineWidth = 12;
            ctx.strokeStyle = tint(BC[bse], 0.35 + 0.55 * edge); ctx.beginPath(); ctx.moveTo(x, yT); ctx.lineTo(x, -4); ctx.stroke();
            ctx.strokeStyle = tint(BC[p], 0.35 + 0.55 * edge); ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x, yB); ctx.stroke();
            if (s > 0.6 && Math.abs(x) < 205) { for (const [yy, ch] of [[-56, bse], [56, p]]) { ctx.fillStyle = 'rgba(5,8,22,0.85)'; ell(ctx, x, yy, 13, 13); ctx.fill(); T(ctx, ch, x, yy + 1, 19, BC[ch], 'center', 800); } }
          }
          for (const sd of [-1, 1]) {
            ctx.strokeStyle = sd < 0 ? '#93c5fd' : '#c4b5fd'; ctx.lineWidth = 9; ctx.beginPath();
            for (let x = -235; x <= 235; x += 8) { const y = sd * 110 + 12 * Math.sin(x * 0.012 + k * 0.6 + (sd > 0 ? 1 : 0)); if (x === -235) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
            ctx.stroke();
          }
        },
      ];
      ctx.save(); ctx.globalAlpha *= alphaAll;
      ctx.save(); rounded(ctx, VX, VY, VW, VH, 20); ctx.clip();
      ctx.fillStyle = 'rgba(5,8,22,0.55)'; ctx.fillRect(VX, VY, VW, VH);
      motes(ctx, k, 30, ['cyan', 'red', 'red', 'red', 'purple', 'blue', 'yellow', 'cyan'][Math.round(z)], [VX, VY, VW, VH], 11, 2, 0.4);
      const i0 = Math.floor(z);
      for (let i = Math.max(0, i0 - 1); i <= Math.min(7, i0 + 1); i++) {
        const sc = F ** (z - i); if (sc < 0.08 || sc > 7) continue;
        const a = 1 - smooth((sc - 2.2) / 3);
        if (a <= 0) continue;
        ctx.save(); ctx.globalAlpha *= a; ctx.translate(C[0], C[1]); ctx.scale(sc, sc); LV[i](sc); ctx.restore();
      }
      ctx.restore();
      ctx.strokeStyle = tint('cyan', 0.5); ctx.lineWidth = 2; rounded(ctx, VX, VY, VW, VH, 20); ctx.stroke();
      // Scale bar.
      const j = Math.round(z); const SB = ['40 cm', '3 cm', '150 µm', '20 µm', '2 µm', '1 µm', '20 nm', '1 nm'];
      const px = 100 * F ** (z - j);
      ctx.fillStyle = 'rgba(5,8,22,0.7)'; rounded(ctx, VX + 14, VY + VH - 58, Math.max(px, 70) + 24, 46, 12); ctx.fill();
      line(ctx, VX + 26, VY + VH - 24, VX + 26 + px, VY + VH - 24, 'ink', 4);
      line(ctx, VX + 26, VY + VH - 31, VX + 26, VY + VH - 17, 'ink', 3); line(ctx, VX + 26 + px, VY + VH - 31, VX + 26 + px, VY + VH - 17, 'ink', 3);
      T(ctx, SB[j], VX + 26, VY + VH - 44, 18, 'ink', 'left', 700);
      // The ladder of levels.
      NAMES.forEach((nm, i) => {
        const y = 90 + i * 60; const on = i === j; const done = i < j;
        if (i < 7) line(ctx, 642, y + 12, 642, y + 48, tint(done ? 'cyan' : 'muted', done ? 0.8 : 0.3), 2);
        dot(ctx, 642, y, on ? 9 : 6, on ? 'yellow' : done ? 'cyan' : 'rgba(147,160,196,0.6)');
        if (on) soft(ctx, 642, y, 24, 'yellow', 0.5);
        T(ctx, nm, 660, y, on ? 20 : 19, on ? 'yellow' : done ? 'ink' : 'muted', 'left', on ? 800 : 600);
      });
      const CAP = [
        ['You', 'About 37 trillion cells. Let us zoom into the heart to find the DNA.'],
        ['An organ: the heart', 'Organs are made of several tissues working together.'],
        ['A tissue: heart muscle', 'A tissue is a group of similar cells doing one job.'],
        ['A cell: one heart muscle cell', 'Each cell has a control centre: the nucleus.'],
        ['The nucleus', 'It holds 46 chromosomes: very long DNA molecules, coiled up.'],
        ['A chromosome', 'One chromosome carries hundreds to thousands of genes.'],
        ['A gene', 'A gene is a stretch of DNA, wound around proteins called histones.'],
        ['The DNA bases', 'The code: A pairs with T, C pairs with G. About 3 billion pairs per set.'],
      ];
      ctx.restore();
      caption(ctx, CAP[j][0], CAP[j][1], ['cyan', 'red', 'red', 'red', 'purple', 'blue', 'yellow', 'cyan'][j], 1, j, 8);
      ctx.restore();
    },

    // Transcription in the nucleus, the mRNA leaving, the ribosome reading
    // codons three bases at a time while tRNAs bring amino acids, and the
    // finished chain folding into a protein.
    'protein-synthesis'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [4.6, 2.2, 10.2, 3.6], 0.6);
      begin(ctx, t, it, 'Protein synthesis');
      const COD = ['AUG', 'UUC', 'GGA', 'AAA', 'UGG', 'GAA', 'UAA'];
      const AA = ['Met', 'Phe', 'Gly', 'Lys', 'Trp', 'Glu'];
      const AC = ['UAC', 'AAG', 'CCU', 'UUU', 'ACC', 'CUU'];
      const BC = { A: 'green', U: 'red', T: 'red', G: 'yellow', C: 'cyan' };
      const AAC = ['orange', 'purple', 'teal', 'blue', PINK, LIME];
      motes(ctx, k, 26, 'teal', [300, 60, 480, 400], 5, 2, 0.3);
      // Nucleus.
      const NX = 160; const NY = 160; const NRX = 135; const NRY = 95;
      soft(ctx, NX, NY, 150, 'purple', 0.22);
      ctx.fillStyle = 'rgba(76,29,149,0.28)'; ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 3; ell(ctx, NX, NY, NRX, NRY); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 1.5; ell(ctx, NX, NY, NRX + 7, NRY + 7); ctx.stroke();
      for (const a of [-0.5, 0, 0.5, 2.6, 3.4]) { ctx.fillStyle = DARK; ell(ctx, NX + Math.cos(a) * (NRX + 3), NY + Math.sin(a) * (NRY + 3), 6, 6); ctx.fill(); }
      T(ctx, 'Nucleus', 338, 76, 19, 'purple', 'left');
      T(ctx, 'DNA (a gene)', NX, 98, 18, 'ink', 'center', 600);
      // DNA ladder with a transcription bubble at the polymerase.
      const dx0 = 52; const dx1 = 268; const step = 12;
      const px = S.i === 0 ? lerp(70, 262, smooth(S.p / 0.92)) : -99;
      for (let x = dx0; x <= dx1; x += step) {
        const open = S.i === 0 ? Math.exp(-(((x - px) / 26) ** 2)) : 0;
        const yT = 140 - 16 * open; const yB = 168 + 14 * open;
        const bi = Math.round((x - dx0) / step);
        if (open < 0.5) { ctx.strokeStyle = tint(['green', 'red', 'yellow', 'cyan'][bi % 4], 0.65); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, yT); ctx.lineTo(x, yB); ctx.stroke(); }
      }
      for (const [y0, sg] of [[140, -16], [168, 14]]) {
        ctx.strokeStyle = sg < 0 ? '#93c5fd' : '#c4b5fd'; ctx.lineWidth = 4; ctx.beginPath();
        for (let x = dx0; x <= dx1; x += 4) { const open = S.i === 0 ? Math.exp(-(((x - px) / 26) ** 2)) : 0; const y = y0 + sg * open; if (x === dx0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.stroke();
      }
      if (S.i === 0) {
        // The mRNA copy trails out of the polymerase.
        ctx.strokeStyle = PINK; ctx.lineWidth = 5; ctx.beginPath();
        for (let x = 64; x <= px; x += 4) { const y = 214 + 4 * Math.sin(x * 0.15 + k * 3) - 30 * Math.exp(-(((x - px) / 18) ** 2)); if (x === 64) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.stroke();
        soft(ctx, px, 166, 54, 'teal', 0.45);
        ctx.fillStyle = 'rgba(45,212,191,0.35)'; ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 2.5; blob(ctx, px, 166, 34, k, 2, 0.06, 28, 1.25); ctx.fill(); ctx.stroke();
        T(ctx, 'mRNA', 70, 238, 18, PINK, 'left', 700);
      }
      // The mRNA strip in the cytoplasm.
      const SX = 70; const CW = 95; const SY = 500;
      const stripA = S.i === 0 ? 0 : S.i === 1 ? win(S.p, 0.55, 1) : 1;
      if (S.i === 1) {
        const path = mkPath([160, 212, 250, 205, 295, 160, 350, 210, 420, 320, 430, 470]);
        const P = at(path, smooth(win(S.p, 0, 0.6)) * path.total);
        ctx.save(); ctx.globalAlpha *= 1 - win(S.p, 0.55, 0.8);
        ctx.strokeStyle = PINK; ctx.lineWidth = 5; ctx.beginPath();
        for (let q = -40; q <= 40; q += 4) { const x = P.x + q; const y = P.y + 8 * Math.sin(q * 0.2 + k * 6); if (q === -40) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.stroke(); soft(ctx, P.x, P.y, 40, PINK, 0.4);
        ctx.restore();
      }
      // Translation timing.
      const D = 1.46; const ts = S.i === 2 ? S.s : S.i === 3 ? 99 : -1;
      const sIdx = ts < 0 ? 0 : Math.min(6, Math.floor(ts / D)); const q = ts < 0 ? 0 : ts >= 7 * D ? 1 : (ts - sIdx * D) / D;
      const slide = sIdx < 6 ? smooth(win(q, 0.72, 1)) : 0;
      const rx = SX + CW / 2 + CW * (Math.min(sIdx, 6) + slide);
      // Ribosome large subunit (behind the strip).
      const ribA = S.i >= 2 ? (S.i === 3 ? 1 - win(S.p, 0.1, 0.5) : after(S.s, 0, 0.6)) : 0;
      const split = S.i === 3 ? smooth(win(S.p, 0, 0.5)) * 30 : 0;
      if (ribA > 0) {
        ctx.save(); ctx.globalAlpha *= ribA;
        soft(ctx, rx, 470, 92, 'blue', 0.25);
        ctx.fillStyle = 'rgba(91,140,255,0.3)'; ctx.strokeStyle = '#a5b4fc'; ctx.lineWidth = 2.5; blob(ctx, rx, 452 - split, 98, k * 0.5, 1, 0.03, 36, 0.42); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      if (stripA > 0) {
        ctx.save(); ctx.globalAlpha *= stripA;
        COD.forEach((cd, j) => {
          const x = SX + j * CW; const reading = S.i === 2 && j === sIdx;
          ctx.fillStyle = reading ? 'rgba(251,191,36,0.2)' : 'rgba(8,12,30,0.85)'; ctx.strokeStyle = reading ? COLORS.yellow : tint(PINK, 0.7); ctx.lineWidth = reading ? 2.5 : 1.5;
          rounded(ctx, x + 3, SY - 21, CW - 6, 42, 10); ctx.fill(); ctx.stroke();
          for (let m = 0; m < 3; m++) T(ctx, cd[m], x + 22 + m * 25, SY + 1, 22, BC[cd[m]], 'center', 800);
        });
        ctx.restore();
        T(ctx, 'mRNA', 20, 572, 19, PINK, 'left');
      }
      // Small subunit (in front, under the strip).
      if (ribA > 0) {
        ctx.save(); ctx.globalAlpha *= ribA;
        ctx.fillStyle = 'rgba(91,140,255,0.32)'; ctx.strokeStyle = '#a5b4fc'; ctx.lineWidth = 2.5; ell(ctx, rx, 532 + split, 92, 20); ctx.fill(); ctx.stroke();
        T(ctx, 'Ribosome', rx, 572, 19, 'blue');
        ctx.restore();
      }
      // The growing chain.
      const beadPos = (d, base) => [base - d * 46, 366 - d * 22 + 8 * Math.sin(d * 1.7 + k * 1.5)];
      const tRNA = (x, y, i, a = 1, bead = true) => {
        ctx.save(); ctx.globalAlpha *= a;
        ctx.fillStyle = 'rgba(45,212,191,0.25)'; ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 2;
        for (const [dx, dy] of [[-22, -36], [22, -36], [0, -52]]) { ell(ctx, x + dx, y + dy, 15, 13); ctx.fill(); ctx.stroke(); }
        ctx.beginPath(); ctx.roundRect(x - 12, y - 36, 24, 34, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(8,12,30,0.9)'; rounded(ctx, x - 42, y - 4, 84, 28, 8); ctx.fill(); ctx.stroke();
        for (let m = 0; m < 3; m++) T(ctx, AC[i][m], x - 25 + m * 25, y + 10, 19, BC[AC[i][m]], 'center', 800);
        if (bead) { ctx.strokeStyle = tint('ink', 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 64); ctx.lineTo(x, y - 76); ctx.stroke(); }
        ctx.restore();
      };
      const bead = (x, y, i, a = 1) => {
        ctx.save(); ctx.globalAlpha *= a;
        soft(ctx, x, y, 34, AAC[i], 0.45);
        ctx.fillStyle = tint(AAC[i], 0.4); ctx.strokeStyle = color(AAC[i]); ctx.lineWidth = 2.5; ell(ctx, x, y, 24, 24); ctx.fill(); ctx.stroke();
        T(ctx, AA[i], x, y + 1, 18, 'ink', 'center', 800);
        ctx.restore();
      };
      // A pool of tRNAs carrying amino acids, waiting in the cytoplasm.
      const poolA = S.i === 3 ? 1 - win(S.p, 0, 0.2) : 1;
      if (poolA > 0) {
        ctx.save(); ctx.globalAlpha *= 0.5 * poolA;
        const SL = [[480, 236], [612, 220], [742, 240]];
        const base = S.i === 2 ? sIdx + 1 : S.i < 2 ? 0 : 6; const sl = S.i === 2 ? smooth(win(q, 0, 0.3)) : 1;
        SL.forEach(([x, y], j) => {
          const i = base + j; if (i >= 6) return;
          const from = SL[Math.min(2, j + 1)]; const px0 = lerp(from[0], x, sl); const py0 = lerp(from[1], y, sl);
          ctx.save(); if (j === 2) ctx.globalAlpha *= sl;
          tRNA(px0, py0, i); bead(px0, py0 - 98, i);
          ctx.restore();
        });
        ctx.restore();
        T(ctx, 'Cytoplasm', 612, 64, 18, 'muted', 'center', 600);
      }
      if (S.i === 2) {
        const cx = SX + CW / 2 + CW * sIdx;
        // Old tRNA leaves, new one docks.
        if (sIdx > 0 && sIdx <= 6 && q < 0.4) { const lq = smooth(q / 0.4); tRNA(cx - CW - lq * 30, 452 + lq * 10, sIdx - 1, 1 - lq, false); }
        if (sIdx < 6) {
          const dq = smooth(win(q, 0, 0.45)); const tx = lerp(480, rx, dq); const ty = lerp(236, 452, dq);
          tRNA(tx, ty, sIdx, lerp(0.5, 1, win(q, 0, 0.15)), q < 0.5);
          if (q < 0.5) bead(tx, ty - 98, sIdx);
        } else {
          chip(ctx, 'STOP: no tRNA fits', 680, 296, 'red', 19);
        }
      }
      // Chain beads: the ones already joined.
      const chainN = S.i === 2 ? Math.min(6, sIdx + (q >= 0.5 && sIdx < 6 ? 1 : 0)) : S.i === 3 ? 6 : 0;
      const fold = S.i === 3 ? smooth(win(S.p, 0.2, 0.75)) : 0;
      if (chainN > 0) {
        const pts = [];
        for (let m = 0; m < chainN; m++) {
          const joining = S.i === 2 && q >= 0.5 && sIdx < 6; const jq = joining ? smooth(win(q, 0.5, 0.72)) : 1;
          const d = chainN - 1 - m;
          let [x, y] = beadPos(m === chainN - 1 ? d : d - 1 + jq, rx - 40);
          if (joining && m === chainN - 1) { x = lerp(rx, x, jq); y = lerp(354, y, jq); }
          if (fold > 0) { const a = (m / 6) * TAU + k * 0.3; const rr = m % 2 ? 62 : 40; const fx = 590 + Math.cos(a) * rr; const fy = 200 + Math.sin(a) * rr * 0.85; x = lerp(x, fx, fold); y = lerp(y, fy, fold); }
          pts.push([x, y, m]);
        }
        ctx.strokeStyle = tint('ink', 0.6); ctx.lineWidth = 4; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); if (fold > 0.95) ctx.closePath(); ctx.stroke();
        for (const [x, y, m] of pts) bead(x, y, m);
        if (fold > 0.5) { ctx.save(); ctx.globalAlpha *= win(fold, 0.5, 1); soft(ctx, 590, 200, 130, 'yellow', 0.2); ctx.strokeStyle = tint('yellow', 0.5); ctx.lineWidth = 2; ctx.setLineDash([8, 8]); blob(ctx, 590, 200, 96, k, 4, 0.08, 40, 0.85); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); ctx.save(); ctx.globalAlpha *= win(fold, 0.85, 1); T(ctx, 'A folded protein', 590, 310, 20, 'yellow'); ctx.restore(); }
      }
      const CAP = [
        ['1. Transcription', 'In the nucleus the DNA unzips and one gene is copied into a messenger: mRNA.', 'purple'],
        ['2. The mRNA leaves the nucleus', 'It slips out through a nuclear pore to a ribosome in the cytoplasm.', PINK],
        ['3. Translation', 'The ribosome reads the mRNA in threes. Each codon calls for one amino acid, brought by a tRNA.', 'blue'],
        ['4. The protein folds', 'At the stop codon the chain is released and folds into its working 3D shape.', 'yellow'],
      ];
      caption(ctx, CAP[S.i][0], CAP[S.i][1], CAP[S.i][2], S.s, S.i, 4);
      ctx.restore();
    },

    // Meiosis: chromosomes pair up and swap pieces, two divisions follow,
    // and four haploid cells result, each with a different mix.
    meiosis(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [2.6, 3.4, 3.4, 2.4, 3.0, 3.6], 0.6);
      begin(ctx, t, it, 'Meiosis');
      const BL = COLORS.blue; const RD = COLORS.red;
      // Duplicated chromosomes: key positions K0..K4, then single chromatids.
      const K = { Ap: [[318, 250], [340, 300], [382, 250], [205, 255], [220, 255]], Am: [[478, 350], [372, 300], [418, 250], [595, 255], [580, 255]],
        Bp: [[470, 226], [466, 300], [418, 355], [595, 350], [580, 350]], Bm: [[334, 352], [438, 300], [382, 355], [205, 350], [220, 350]] };
      const TILT = { Ap: 0.45, Am: -0.35, Bp: -0.6, Bm: 0.5 };
      const FIN = { Ap1: [118, 288], Ap2: [298, 288], Am1: [478, 288], Am2: [658, 288], Bm1: [144, 312], Bm2: [324, 312], Bp1: [504, 312], Bp2: [684, 312] };
      const LEN = { A: 92, B: 58 };
      const cross = S.i >= 2 || (S.i === 1 && S.p > 0.7);
      const swapA = S.i === 1 ? smooth(win(S.p, 0.62, 0.78)) : cross ? 1 : 0;
      const chrom = (id) => {
        let p; let tilt = 0;
        const Kp = K[id];
        if (S.i === 0) { p = Kp[0]; tilt = TILT[id]; }
        else if (S.i === 1) { const qq = smooth(win(S.p, 0, 0.5)); p = [lerp(Kp[0][0], Kp[1][0], qq), lerp(Kp[0][1], Kp[1][1], qq)]; tilt = TILT[id] * (1 - qq); }
        else if (S.i === 2) { if (S.p < 0.35) { const qq = smooth(S.p / 0.35); p = [lerp(Kp[1][0], Kp[2][0], qq), lerp(Kp[1][1], Kp[2][1], qq)]; } else { const qq = smooth((S.p - 0.35) / 0.65); p = [lerp(Kp[2][0], Kp[3][0], qq), lerp(Kp[2][1], Kp[3][1], qq)]; } }
        else if (S.i === 3) { const qq = smooth(S.p); p = [lerp(Kp[3][0], Kp[4][0], qq), lerp(Kp[3][1], Kp[4][1], qq)]; }
        else p = Kp[4];
        return { p, tilt };
      };
      // Each chromatid's colour pattern: [colour, tip colour].
      const tipA = (base, other) => mix(base === 'b' ? '#5b8cff' : '#fb7185', other === 'b' ? '#5b8cff' : '#fb7185', swapA);
      const PAT = {
        Ap1: [BL, BL], Ap2: [BL, tipA('b', 'r')], Am1: [RD, tipA('r', 'b')], Am2: [RD, RD],
        Bp1: [BL, tipA('b', 'r')], Bp2: [BL, BL], Bm1: [RD, RD], Bm2: [RD, tipA('r', 'b')],
      };
      const chromatid = (x, y, len, ang, pat, a = 1) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha *= a;
        rounded(ctx, -7.5, -len / 2, 15, len, 7.5); ctx.save(); ctx.clip();
        ctx.fillStyle = pat[0]; ctx.fillRect(-8, -len / 2, 16, len);
        ctx.fillStyle = pat[1]; ctx.fillRect(-8, len * 0.16, 16, len * 0.34 + 1);
        ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(-6, -len / 2, 4, len);
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.5; rounded(ctx, -7.5, -len / 2, 15, len, 7.5); ctx.stroke();
        ctx.restore();
      };
      // Cell membranes.
      const cellsAt = () => {
        if (S.i <= 1 || (S.i === 2 && S.p < 0.35)) return [[400, 300, 168]];
        if (S.i === 2) { const qq = smooth((S.p - 0.35) / 0.65); return [[lerp(400, 220, qq), 300, lerp(168, 138, qq)], [lerp(400, 580, qq), 300, lerp(168, 138, qq)]]; }
        if (S.i === 3) return [[220, 300, 138], [580, 300, 138]];
        const qq = S.i === 4 ? smooth(win(S.p, 0.3, 1)) : 1;
        const out = [];
        for (const c0 of [220, 580]) for (const sd of [-1, 1]) out.push([c0 + sd * 90 * qq, 300, lerp(138, 82, qq)]);
        return out;
      };
      const cells = cellsAt();
      motes(ctx, k, 30, 'teal', [20, 60, 760, 520], 21, 2, 0.25);
      for (const [x, y, r] of cells) {
        soft(ctx, x, y, r * 1.35, 'teal', 0.14);
        const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
        g.addColorStop(0, 'rgba(94,234,212,0.2)'); g.addColorStop(0.75, 'rgba(45,212,191,0.07)'); g.addColorStop(1, 'rgba(45,212,191,0.16)');
        ctx.fillStyle = g; ell(ctx, x, y, r, r); ctx.fill();
        for (let i = 0; i < 9; i++) { const a = rnd(i + x) * TAU + k * 0.1; const rr = r * (0.35 + 0.5 * rnd(i + 3)); dot(ctx, x + Math.cos(a) * rr, y + Math.sin(a) * rr, 2.5, 'rgba(167,243,208,0.35)'); }
      }
      ctx.strokeStyle = tint('teal', 0.8); ctx.lineWidth = 2.5; for (const [x, y, r] of cells) { ell(ctx, x + Math.sin(k * 1.3 + x) * 1.5, y, r, r); ctx.stroke(); }
      // Spindle fibres while chromosomes are pulled.
      const spindle = (pairs) => { ctx.strokeStyle = 'rgba(233,238,255,0.22)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (const [px0, py0, x, y] of pairs) { ctx.moveTo(px0, py0); ctx.lineTo(x, y); } ctx.stroke(); };
      // Draw the chromosomes.
      const sis = 9;
      if (S.i <= 3 || (S.i === 4 && S.p < 0.3)) {
        const sepII = S.i === 4 ? 0 : 0;
        const sp = [];
        for (const id of ['Ap', 'Am', 'Bp', 'Bm']) {
          const { p, tilt } = chrom(id); const len = LEN[id[0]];
          const dx = Math.cos(tilt) * (sis + sepII); const dy = Math.sin(tilt) * (sis + sepII);
          chromatid(p[0] - dx, p[1] - dy, len, tilt, PAT[`${id}1`]);
          chromatid(p[0] + dx, p[1] + dy, len, tilt, PAT[`${id}2`]);
          dot(ctx, p[0], p[1] - len * 0.1, 5, 'ink');
          if (S.i === 2 && S.p > 0.15) { const left = id === 'Ap' || id === 'Bm'; const c0 = cells.length > 1 ? cells[left ? 0 : 1] : cells[0]; sp.push([left ? c0[0] - c0[2] + 20 : c0[0] + c0[2] - 20, 300, p[0], p[1] - len * 0.1]); }
          if (S.i === 3 && S.p > 0.4) { const left = p[0] < 400; const c0 = cells[left ? 0 : 1]; for (const sd of [-1, 1]) sp.push([c0[0] + sd * (c0[2] - 20), 300, p[0], p[1] - len * 0.1]); }
        }
        if (sp.length) spindle(sp);
      } else {
        const qq = S.i === 4 ? smooth(win(S.p, 0.3, 1)) : 1;
        const sp = [];
        for (const id of ['Ap', 'Am', 'Bp', 'Bm']) {
          const p = K[id][4]; const len = LEN[id[0]];
          for (const n of [1, 2]) {
            const cid = `${id}${n}`; const x0 = p[0] + (n === 1 ? -sis : sis); const f = FIN[cid];
            const x = lerp(x0, f[0], qq); const y = lerp(p[1], f[1], qq);
            chromatid(x, y, len, 0, PAT[cid]);
            if (S.i === 4 && qq < 0.95) sp.push([lerp(p[0], f[0], 1) + (n === 1 ? -70 : 70) * (1 - qq), 300, x, y - len * 0.1]);
          }
        }
        if (sp.length) spindle(sp);
      }
      // Crossing over highlight.
      if (S.i === 1 && S.p > 0.5) {
        ctx.save(); ctx.globalAlpha *= win(S.p, 0.5, 0.6) * (1 - win(S.p, 0.92, 1));
        for (const x of [356, 452]) { soft(ctx, x, 316, 34, 'yellow', 0.6); ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 10, 306); ctx.lineTo(x + 10, 326); ctx.moveTo(x + 10, 306); ctx.lineTo(x - 10, 326); ctx.stroke(); }
        chip(ctx, 'Crossing over: pieces swap', 400, 176, 'yellow', 19);
        ctx.restore();
      }
      // Labels: phase at the top, chromosome counts under the cells.
      const PH = ['Before meiosis', 'Meiosis I: pairing', 'Meiosis I: pairs separate', 'Two cells', 'Meiosis II: copies separate', 'Four sex cells (gametes)'];
      chip(ctx, PH[S.i], MX, 82, ['teal', 'yellow', 'cyan', 'cyan', 'purple', 'green'][S.i], 20);
      if (S.i <= 2) T(ctx, '2n = 4: two pairs of chromosomes', MX, 500, 19, 'muted', 'center', 600);
      else if (S.i === 3) { T(ctx, 'n = 2', 220, 466, 20, 'cyan'); T(ctx, 'n = 2', 580, 466, 20, 'cyan'); T(ctx, 'each chromosome still doubled', MX, 500, 18, 'muted', 'center', 500); }
      else if (S.i === 5 || (S.i === 4 && S.p > 0.8)) {
        for (const x of [130, 310, 490, 670]) T(ctx, 'n = 2', x, 410, 20, 'green');
        chip(ctx, 'All four are genetically different', MX, 466, 'green', 20);
      }
      // Legend.
      ctx.fillStyle = BL; rounded(ctx, 236, 538, 30, 14, 7); ctx.fill(); T(ctx, 'from one parent', 276, 545, 18, 'ink', 'left', 500);
      ctx.fillStyle = RD; rounded(ctx, 446, 538, 30, 14, 7); ctx.fill(); T(ctx, 'from the other', 486, 545, 18, 'ink', 'left', 500);
      const CAP = [
        ['The DNA has been copied', 'Each chromosome is now two identical strands (chromatids). The cell has 2 pairs.', 'teal'],
        ['Partners pair up and swap pieces', 'Matching chromosomes line up together and exchange sections: crossing over.', 'yellow'],
        ['First division', 'The pairs are pulled apart, one of each pair to each new cell, mixed at random.', 'cyan'],
        ['Halfway', 'Each cell now has one chromosome from each pair: half the number.', 'cyan'],
        ['Second division', 'The two copies of each chromosome are pulled apart, like in mitosis.', 'purple'],
        ['Four haploid cells', 'Each has half the chromosomes and a unique mix: why brothers and sisters differ.', 'green'],
      ];
      caption(ctx, CAP[S.i][0], CAP[S.i][1], CAP[S.i][2], S.s, S.i, 6);
      ctx.restore();
    },

    // ─── Genetics ─────────────────────────────────────────────────────────

    // Pp × Pp: each parent's alleles split into the gametes, the four boxes
    // fill in, and the flowers they make give 3 purple : 1 white.
    'punnett-square'(b, ctx, it, t) {
      const k = b.clock;
      const eyes = /eye/i.test(String(it.trait || ''));
      const TR = eyes
        ? { D: 'B', r: 'b', dom: 'brown', rec: 'blue', dc: '#c07a3a', rc: '#3b82f6', unit: 'eyes' }
        : { D: 'P', r: 'p', dom: 'purple', rec: 'white', dc: '#b06cff', rc: '#f1f5ff', unit: 'flowers' };
      const S = stages(t, [1.8, 2.0, 4.8, 3.0, 2.6], 0.6);
      begin(ctx, t, it, 'Punnett square');
      motes(ctx, k, 26, 'purple', [20, 60, 760, 520], 7, 2, 0.25);
      const GX = 250; const GY = 214; const CS = 150;
      const pic = (x, y, r, dom, a = 1) => {
        if (a <= 0) return;
        ctx.save(); ctx.globalAlpha *= a;
        const c = dom ? TR.dc : TR.rc;
        soft(ctx, x, y, r * 1.8, c, 0.35);
        if (eyes) {
          ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = 'rgba(148,163,184,0.9)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x - r * 1.25, y); ctx.quadraticCurveTo(x, y - r * 1.15, x + r * 1.25, y); ctx.quadraticCurveTo(x, y + r * 1.15, x - r * 1.25, y); ctx.fill(); ctx.stroke();
          const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 0.55); g.addColorStop(0, tint(c, 0.6)); g.addColorStop(1, c);
          ctx.fillStyle = g; ell(ctx, x, y, r * 0.55, r * 0.55); ctx.fill();
          dot(ctx, x, y, r * 0.22, '#0b0f1e'); dot(ctx, x + r * 0.16, y - r * 0.18, r * 0.09, '#ffffff');
        } else {
          const sw = 0.06 * Math.sin(k * 1.6 + x * 0.01);
          for (let i = 0; i < 5; i++) {
            const an = (i / 5) * TAU - Math.PI / 2 + sw;
            ctx.fillStyle = dom ? 'rgba(176,108,255,0.85)' : 'rgba(241,245,255,0.92)'; ctx.strokeStyle = dom ? '#e9d5ff' : '#cbd5e1'; ctx.lineWidth = 1.5;
            ell(ctx, x + Math.cos(an) * r * 0.55, y + Math.sin(an) * r * 0.55, r * 0.5, r * 0.34, an); ctx.fill(); ctx.stroke();
          }
          dot(ctx, x, y, r * 0.2, 'yellow');
        }
        ctx.restore();
      };
      const al = (ch, x, y, size = 26, a = 1) => { ctx.save(); ctx.globalAlpha *= a; T(ctx, ch, x, y, size, ch === TR.D ? TR.dc : TR.rc, 'center', 800); ctx.restore(); };
      const COLX = [GX + CS / 2, GX + CS * 1.5]; const ROWY = [GY + CS / 2, GY + CS * 1.5];
      const G1 = [TR.D, TR.r]; const G2 = [TR.D, TR.r];
      // Parents.
      const pA = after(t, 0.6, 0.6);
      ctx.save(); ctx.globalAlpha *= pA;
      pic(400, 94, 26, true); T(ctx, `Parent 1 (${TR.D}${TR.r})`, 440, 94, 20, 'ink', 'left');
      pic(96, 352, 26, true); T(ctx, 'Parent 2', 96, 402, 19, 'ink'); T(ctx, `(${TR.D}${TR.r})`, 96, 428, 20, 'ink');
      ctx.strokeStyle = tint('muted', 0.45); ctx.lineWidth = 2; ctx.setLineDash([5, 6]); ctx.beginPath();
      ctx.moveTo(390, 122); ctx.lineTo(COLX[0], GY - 58); ctx.moveTo(410, 122); ctx.lineTo(COLX[1], GY - 58);
      ctx.moveTo(124, 340); ctx.lineTo(GX - 60, ROWY[0]); ctx.moveTo(124, 364); ctx.lineTo(GX - 60, ROWY[1]); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      // Gametes (headers).
      const gq = S.i === 0 ? 0 : S.i === 1 ? smooth(S.p / 0.8) : 1;
      const head = (x, y, ch, fx, fy) => {
        const px = lerp(fx, x, gq); const py = lerp(fy, y, gq);
        if (gq > 0.98) { ctx.fillStyle = 'rgba(5,8,22,0.85)'; ctx.strokeStyle = tint(ch === TR.D ? TR.dc : TR.rc, 0.8); ctx.lineWidth = 2; ell(ctx, x, y, 24, 24); ctx.fill(); ctx.stroke(); }
        al(ch, px, py, 26, gq > 0 ? 1 : 0);
      };
      COLX.forEach((x, i) => head(x, GY - 34, G1[i], 400, 94));
      ROWY.forEach((y, i) => head(GX - 36, y, G2[i], 96, 352));
      if (gq > 0.98) { T(ctx, 'sex cells', GX + CS, GY - 70, 18, 'muted', 'center', 500); }
      // Grid.
      ctx.strokeStyle = tint('purple', 0.7); ctx.lineWidth = 2.5; rounded(ctx, GX, GY, CS * 2, CS * 2, 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(GX + CS, GY); ctx.lineTo(GX + CS, GY + CS * 2); ctx.moveTo(GX, GY + CS); ctx.lineTo(GX + CS * 2, GY + CS); ctx.stroke();
      const ORDER = [[0, 0], [0, 1], [1, 0], [1, 1]];
      ORDER.forEach(([r, c], j) => {
        const q = S.i < 2 ? 0 : S.i === 2 ? clamp((S.s - j * 1.2) / 1.2) : 1;
        if (q <= 0) return;
        const cx = COLX[c]; const cy = ROWY[r];
        const a1 = G1[c]; const a2 = G2[r]; const dom = a1 === TR.D || a2 === TR.D;
        const pair = a2 === TR.D ? [a2, a1] : [a1, a2];
        const fq = smooth(win(q, 0, 0.5));
        if (S.i === 3 && dom) { ctx.fillStyle = tint(TR.dc, 0.12 + 0.06 * Math.sin(k * 3)); ctx.fillRect(GX + c * CS + 3, GY + r * CS + 3, CS - 6, CS - 6); }
        if (fq < 1) { al(a1, lerp(cx, cx - 14, fq), lerp(GY - 34, cy - 44, fq), 26); al(a2, lerp(GX - 36, cx + 14, fq), lerp(cy, cy - 44, fq), 26); }
        else { al(pair[0], cx - 14, cy - 44, 28); al(pair[1], cx + 14, cy - 44, 28); }
        const bq = outBack(clamp(win(q, 0.5, 0.9)));
        if (bq > 0) pic(cx, cy + 18, 34 * Math.max(0.05, bq), dom);
      });
      // Results.
      const rA = S.i >= 3 ? 1 : 0;
      if (rA) {
        panel(ctx, 584, GY, 198, CS * 2, 'purple', 0.07, 14);
        T(ctx, 'Results', 683, GY + 28, 20, 'ink');
        const rows = [[`${TR.D}${TR.D}`, true, 1], [`${TR.D}${TR.r}`, true, 2], [`${TR.r}${TR.r}`, false, 1]];
        rows.forEach(([g, dom, n], i) => {
          const y = GY + 80 + i * 56; const a = S.i > 3 ? 1 : after(S.s, i * 0.4, 0.4);
          ctx.save(); ctx.globalAlpha *= a;
          pic(612, y, 15, dom); T(ctx, g, 640, y, 22, 'ink', 'left', 800); T(ctx, `× ${n}`, 766, y, 22, dom ? TR.dc : TR.rc, 'right', 800);
          ctx.restore();
        });
        ctx.save(); ctx.globalAlpha *= S.i > 3 ? 1 : after(S.s, 1.4, 0.5);
        T(ctx, '3 : 1', 683, GY + 262, 34, 'yellow', 'center', 800);
        ctx.restore();
      }
      // Key.
      T(ctx, `${TR.D} = ${TR.dom} (dominant)`, 392, 556, 19, TR.dc, 'right', 700);
      T(ctx, `${TR.r} = ${TR.rec} (recessive)`, 412, 556, 19, TR.rc, 'left', 700);
      const CAP = [
        [`Two ${TR.dom} parents, both ${TR.D}${TR.r}`, `Each carries one ${TR.D} allele (${TR.dom}) and one hidden ${TR.r} allele (${TR.rec}).`, 'purple'],
        ['Each parent passes on one allele', `Half of each parent's sex cells carry ${TR.D}, half carry ${TR.r}.`, 'cyan'],
        ['One allele from each parent', `Fill every box. Any box with a ${TR.D} shows ${TR.dom}, because ${TR.D} is dominant.`, 'teal'],
        [`3 ${TR.dom} : 1 ${TR.rec}`, `Only ${TR.r}${TR.r} is ${TR.rec}: each child has a 1 in 4 (25%) chance of ${TR.rec} ${TR.unit}.`, 'yellow'],
        eyes ? ['A simplified model', 'Real eye colour depends on several genes, but the same rules of chance apply.', 'green']
          : ["Mendel's real count", 'In 1866 Gregor Mendel reported 705 purple to 224 white pea plants: about 3 : 1.', 'green'],
      ];
      caption(ctx, CAP[S.i][0], CAP[S.i][1], CAP[S.i][2], S.s, S.i, 5);
      ctx.restore();
    },

    // ─── Microbes ─────────────────────────────────────────────────────────

    // A bacteriophage lands on a bacterium, injects its DNA, the cell copies
    // it and builds new viruses, and the cell bursts.
    'virus-replication'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [3.0, 2.6, 3.2, 3.6, 3.4, 1.6], 0.6);
      begin(ctx, t, it, 'How a virus replicates');
      const CX = 400; const CY = 384; const RX = 330; const RY = 168;
      if (!it._vpos) {
        const pos = [];
        for (let y = 316; y <= 500; y += 92) for (let x = 130; x <= 670; x += 100) { const e = ((x - CX) / (RX - 60)) ** 2 + ((y + 30 - CY) / (RY - 30)) ** 2; if (e < 1) pos.push([x + (Math.floor((y - 316) / 92) % 2) * 50 - 25, y + 36]); }
        it._vpos = pos.filter(([x, y]) => (((x - CX) / (RX - 50)) ** 2 + ((y - 30 - CY) / (RY - 20)) ** 2) < 1);
      }
      const POS = it._vpos;
      const phage = (x, y, s, ang, full, a = 1, legs = 1) => {
        if (a <= 0) return;
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s); ctx.globalAlpha *= a;
        ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 2.2; ctx.beginPath();
        for (const sd of [-1, 1]) for (const f of [0.55, 1]) { ctx.moveTo(sd * 5, 0); ctx.lineTo(sd * (12 + 10 * f * legs), 7 + 3 * f); ctx.lineTo(sd * (16 + 14 * f * legs), 10 + 12 * legs); }
        ctx.stroke();
        ctx.fillStyle = '#a78bfa'; ctx.fillRect(-10, -3, 20, 5);
        ctx.fillStyle = 'rgba(167,139,250,0.45)'; ctx.strokeStyle = '#ddd6fe'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.rect(-5, -40, 10, 37); ctx.fill(); ctx.stroke();
        ctx.beginPath(); for (let yy = -35; yy < -4; yy += 6) { ctx.moveTo(-5, yy); ctx.lineTo(5, yy); } ctx.stroke();
        ctx.fillStyle = '#c4b5fd'; ctx.fillRect(-9, -45, 18, 5);
        const g = ctx.createLinearGradient(-24, -90, 24, -42); g.addColorStop(0, 'rgba(196,181,253,0.55)'); g.addColorStop(1, 'rgba(109,40,217,0.35)');
        ctx.fillStyle = g; ctx.strokeStyle = '#ede9fe'; ctx.lineWidth = 2;
        ctx.beginPath(); for (let i = 0; i < 6; i++) { const an = (i / 6) * TAU + Math.PI / 2; const px = Math.cos(an) * 25; const py = -68 + Math.sin(an) * 25; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(237,233,254,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -93); ctx.lineTo(0, -43); ctx.moveTo(-21, -80); ctx.lineTo(21, -56); ctx.moveTo(21, -80); ctx.lineTo(-21, -56); ctx.stroke();
        if (full > 0) { ctx.save(); ctx.globalAlpha *= full; ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 2.5; ctx.beginPath(); for (let q = 0; q <= 24; q++) { const an = q * 0.9; const rr = 6 + (q % 5) * 2.4; const px = Math.cos(an) * rr; const py = -68 + Math.sin(an) * rr; if (q) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.stroke(); ctx.restore(); }
        ctx.restore();
      };
      const squig = (x, y, len, seed, a = 1, w = 3) => {
        ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = '#fb923c'; ctx.lineWidth = w; ctx.beginPath();
        for (let q = 0; q <= 16; q++) { const u = q / 16; const px = x + (u - 0.5) * len * Math.cos(seed); const py = y + (u - 0.5) * len * Math.sin(seed) + 7 * Math.sin(u * 12 + seed * 3 + k * 2); if (q) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.stroke(); ctx.restore();
      };
      motes(ctx, k, 26, 'purple', [20, 60, 760, 520], 13, 2, 0.25);
      // The bacterium (bursting at stage 4).
      const burst = S.i === 4 ? smooth(win(S.p, 0, 0.45)) : S.i === 5 ? 1 : 0;
      const cellA = S.i === 5 ? 1 - S.p : 1;
      if (burst < 1) {
        soft(ctx, CX, CY, 380, 'green', 0.1 * (1 - burst));
        const g = ctx.createRadialGradient(CX - 80, CY - 60, 40, CX, CY, RX);
        g.addColorStop(0, 'rgba(52,211,153,0.2)'); g.addColorStop(1, 'rgba(16,185,129,0.06)');
        ctx.save(); ctx.globalAlpha *= 1 - burst;
        ctx.fillStyle = g; ell(ctx, CX, CY, RX, RY); ctx.fill();
        for (let i = 0; i < 40; i++) { const an = rnd(i + 5) * TAU; const rr = Math.sqrt(rnd(i + 9)); dot(ctx, CX + Math.cos(an) * rr * (RX - 30), CY + Math.sin(an) * rr * (RY - 24), 2.2, 'rgba(167,243,208,0.4)'); }
        ctx.restore();
      }
      // Membrane: whole, or flying apart in pieces.
      ctx.save(); ctx.globalAlpha *= cellA;
      for (let i = 0; i < 16; i++) {
        const a0 = (i / 16) * TAU; const a1 = ((i + 1) / 16) * TAU; const am = (a0 + a1) / 2;
        const off = burst * (30 + rnd(i) * 40); const dx = Math.cos(am) * off; const dy = Math.sin(am) * off * 0.7;
        ctx.save(); ctx.translate(dx, dy);
        ctx.strokeStyle = tint('green', 0.9); ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(CX, CY, RX, RY, 0, a0 + burst * 0.08, a1 - burst * 0.08); ctx.stroke();
        ctx.strokeStyle = tint('green', 0.4); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(CX, CY, RX - 9, RY - 9, 0, a0 + burst * 0.08, a1 - burst * 0.08); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      if (S.i === 4) soft(ctx, CX, CY, 320, 'orange', 0.3 * Math.sin(Math.PI * win(S.p, 0, 0.5)));
      if (burst < 0.3) T(ctx, 'Bacterium', CX - RX + 40, CY + RY - 10, 19, 'green', 'left');
      // Host DNA: a loop that gets broken up once the virus takes over.
      const hostA = S.i <= 1 ? 1 : S.i === 2 ? 1 - smooth(S.p / 0.6) : 0;
      if (hostA > 0) {
        ctx.save(); ctx.globalAlpha *= hostA; ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 3; ctx.beginPath();
        for (let q = 0; q <= 90; q++) { const an = (q / 90) * TAU; const rr = 50 + 14 * Math.sin(an * 7 + k * 0.6) + 8 * Math.sin(an * 3); const px = 250 + Math.cos(an) * rr * 1.5; const py = 420 + Math.sin(an) * rr * 0.8; if (q) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        if (S.i === 2) ctx.setLineDash([18, 10 + 30 * S.p]);
        ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        if (S.i <= 1) T(ctx, "Cell's own DNA", 250, 500, 18, '#a5b4fc', 'center', 600);
      }
      // The infecting virus.
      const land = S.i === 0 ? smooth(win(S.p, 0.05, 0.75)) : 1;
      const vx = lerp(600, CX, land) + (S.i === 0 ? 14 * Math.sin(k * 1.5) * (1 - land) : 0); const vy = lerp(162, 192, land);
      const inj = S.i === 1 ? smooth(win(S.p, 0.1, 0.9)) : S.i > 1 ? 1 : 0;
      const ghostA = S.i <= 3 ? 1 : S.i === 4 ? 1 - S.p : 0;
      phage(vx, vy, 1.3, S.i === 0 ? 0.25 * Math.sin(k * 1.2) * (1 - land) : 0, 1 - inj, ghostA, S.i === 0 ? lerp(0.5, 1, land) : 1);
      if (S.i === 0 && S.p > 0.75) { soft(ctx, CX, 214, 40, 'yellow', 0.5 * Math.sin(win(S.p, 0.75, 1) * Math.PI)); }
      // Injected DNA.
      if (S.i === 1 || S.i === 2) {
        const path = mkPath([400, 106, 400, 150, 400, 196, 404, 230, 416, 262, 432, 290, 440, 320]);
        ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 3.5;
        const len = S.i === 1 ? inj * path.total : path.total;
        ctx.save(); ctx.globalAlpha *= S.i === 2 ? 1 - smooth(S.p / 0.3) : 1;
        ctx.lineWidth = 4.5; strokeSpan(ctx, path, Math.max(0, len - 230), len); const P = at(path, len); soft(ctx, P.x, P.y, 26, 'orange', 0.7);
        ctx.restore();
      }
      // Copies of the viral DNA.
      if (S.i === 2 || (S.i === 3 && S.p < 0.85)) {
        const n = S.i === 2 ? Math.min(POS.length, 2 ** Math.floor(1 + S.p * 4.2)) : POS.length;
        for (let i = 0; i < n; i++) {
          const [x, y] = POS[i]; const born = S.i === 2 ? win(S.p * 4.2 + 1 - Math.log2(Math.max(1, i + 1)), 0, 0.4) : 1;
          const intoHead = S.i === 3 ? smooth(win(S.p, 0.6, 0.85)) : 0;
          squig(x, y - 54, 40 * (1 - intoHead * 0.75), i * 1.7, born * (1 - intoHead));
        }
      }
      // New viruses: parts appear, join, fill with DNA, then burst out.
      if (S.i >= 3) {
        POS.forEach(([x, y], i) => {
          if (S.i === 3) {
            const pa = smooth(win(S.p, i * 0.02, 0.3 + i * 0.02)); const join = smooth(win(S.p, 0.35, 0.65));
            const full = smooth(win(S.p, 0.65, 0.95));
            if (join < 1) {
              ctx.save(); ctx.globalAlpha *= pa;
              phage(x - 18 * (1 - join), y - 12 * (1 - join), 0.8, 0, full, 1, 0);
              ctx.restore();
            } else phage(x, y, 0.8, 0, full, 1, 1);
          } else if (S.i === 4) {
            const q = smooth(win(S.p, 0.1, 1)); const dx = x - CX; const dy = y - 30 - CY; const d = Math.hypot(dx, dy) || 1;
            const far = 120 + rnd(i) * 80;
            const px = clamp(x + (dx / d) * far * q, 60, 740); const py = clamp(y + (dy / d) * far * q * 0.8, 120, 560);
            phage(px, py, 0.8, (dx / d) * 0.5 * q + 0.2 * Math.sin(k * 2 + i) * q, 1, 1 - win(S.p, 0.7, 1));
          }
        });
      }
      const nNew = S.i >= 3 && S.i <= 4 ? POS.length : 0;
      if (nNew && !(S.i === 4 && S.p > 0.7)) chip(ctx, `${nNew} new viruses`, 690, 84, 'orange', 19);
      if (S.i === 5) chip(ctx, 'One virus in → many out', MX, 380, 'orange', 22);
      if (S.i <= 2 && land > 0.9) T(ctx, 'Virus', 446, 108, 19, 'purple', 'left');
      const CAP = [
        ['1. Attach', 'The virus lands on a bacterium and grips its surface with its tail fibres.', 'purple'],
        ['2. Inject', 'It injects its DNA into the cell. The empty protein coat stays outside.', 'orange'],
        ['3. Copy', "The virus DNA takes over: the cell's own machinery now copies virus DNA.", 'orange'],
        ['4. Assemble', 'The cell builds new virus heads and tails, which pack DNA and join up.', 'purple'],
        ['5. Burst out', 'The cell splits open and the new viruses spread to infect more cells.', 'red'],
        ['The cycle repeats', 'One infected cell can release a hundred or more new viruses.', 'red'],
      ];
      caption(ctx, CAP[S.i][0], CAP[S.i][1], CAP[S.i][2], S.s, S.i, 6);
      ctx.restore();
    },

    // One bacterium copies its DNA, grows and splits in two; the dish and
    // the graph show the number doubling every 20 minutes.
    'bacteria-binary-fission'(b, ctx, it, t) {
      const k = b.clock; const G = 2.4; const NG = 6; const P = NG * G + 3;
      const c = cycle(t, P, 0.6); const g = Math.min(NG, Math.floor(c / G)); const hold = g >= NG; const p = hold ? 1 : (c - g * G) / G;
      begin(ctx, t, it, 'Bacteria divide: binary fission');
      const count = hold ? 2 ** NG : 2 ** g * (p >= 0.85 ? 2 : 1);
      // Left: one cell dividing.
      panel(ctx, 30, 62, 360, 270, 'green', 0.05, 16);
      T(ctx, 'One cell dividing', 210, 86, 19, 'green');
      const capsule = (cx, cy, L, w, pinch = 0) => {
        const r = w / 2; const x0 = cx - L / 2 + r; const x1 = cx + L / 2 - r; const d = pinch * r * 0.98;
        ctx.beginPath(); ctx.moveTo(x0, cy - r);
        ctx.bezierCurveTo(cx - L * 0.18, cy - r, cx - 14, cy - r + d, cx, cy - r + d); ctx.bezierCurveTo(cx + 14, cy - r + d, cx + L * 0.18, cy - r, x1, cy - r);
        ctx.arc(x1, cy, r, -Math.PI / 2, Math.PI / 2);
        ctx.bezierCurveTo(cx + L * 0.18, cy + r, cx + 14, cy + r - d, cx, cy + r - d); ctx.bezierCurveTo(cx - 14, cy + r - d, cx - L * 0.18, cy + r, x0, cy + r);
        ctx.arc(x0, cy, r, Math.PI / 2, Math.PI * 1.5); ctx.closePath();
      };
      const cellBody = (cx, cy, L, w, pinch, a = 1) => {
        ctx.save(); ctx.globalAlpha *= a;
        soft(ctx, cx, cy, L * 0.65, 'green', 0.2);
        const gr = ctx.createLinearGradient(0, cy - w / 2, 0, cy + w / 2); gr.addColorStop(0, 'rgba(110,231,183,0.4)'); gr.addColorStop(1, 'rgba(16,185,129,0.18)');
        ctx.fillStyle = gr; ctx.strokeStyle = '#6ee7b7'; ctx.lineWidth = 3; capsule(cx, cy, L, w, pinch); ctx.fill(); ctx.stroke();
        for (let i = 0; i < 14; i++) dot(ctx, cx + (rnd(i + cx) - 0.5) * (L - w * 0.7), cy + (rnd(i + 3) - 0.5) * w * 0.6, 2, 'rgba(209,250,229,0.45)');
        ctx.strokeStyle = 'rgba(110,231,183,0.6)'; ctx.lineWidth = 2; ctx.beginPath();
        const ex = cx + L / 2; ctx.moveTo(ex, cy); for (let q = 1; q <= 10; q++) ctx.lineTo(ex + q * 4.5, cy + 6 * Math.sin(q * 0.9 - k * 8));
        ctx.stroke();
        ctx.restore();
      };
      const loop = (x, y, r, a = 1) => {
        if (a <= 0) return;
        ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3; ctx.beginPath();
        for (let q = 0; q <= 60; q++) { const an = (q / 60) * TAU; const rr = r + 5 * Math.sin(an * 6 + k); const px = x + Math.cos(an) * rr * 1.25; const py = y + Math.sin(an) * rr * 0.8; if (q) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.stroke(); soft(ctx, x, y, r * 1.6, 'cyan', 0.18); ctx.restore();
      };
      ctx.save(); rounded(ctx, 32, 100, 356, 200, 12); ctx.clip();
      const CXL = 210; const CYL = 196; const Wd = 84;
      if (p < 0.85) {
        const L = p < 0.3 ? 170 : lerp(170, 300, smooth((p - 0.3) / 0.3));
        const pinch = smooth((p - 0.6) / 0.25);
        cellBody(CXL, CYL, L, Wd, pinch);
        const rep = smooth(p / 0.3); const sep = smooth((p - 0.3) / 0.3) * 75;
        loop(CXL - sep - 4 * rep, CYL, 20); loop(CXL + sep + 4 * rep, CYL, 20, rep);
      } else {
        const sp = (p - 0.85) / 0.15; const gap = smooth(sp / 0.4) * 16; const q = smooth((sp - 0.35) / 0.65);
        const lx = lerp(CXL - 76 - gap, CXL, q); const rx = lerp(CXL + 76 + gap, CXL + 300, q);
        cellBody(lx, CYL, lerp(150, 170, q), Wd, 0); loop(lx, CYL, 20);
        cellBody(rx, CYL, 150, Wd, 0, 1 - q); loop(rx, CYL, 20, 1 - q);
      }
      ctx.restore();
      const STEP = hold ? 'Dividing again and again' : p < 0.3 ? 'The DNA is copied' : p < 0.6 ? 'The cell grows longer' : p < 0.85 ? 'A wall forms across the middle' : 'Two identical cells';
      chip(ctx, STEP, 210, 306, 'cyan', 18);
      // Right: a dish filling up.
      panel(ctx, 410, 62, 370, 270, 'yellow', 0.04, 16);
      T(ctx, count === 1 ? '1 bacterium' : `${count} bacteria`, 595, 86, 22, 'yellow', 'center', 800);
      const DX = 595; const DY = 212; const DR = 104;
      const dg = ctx.createRadialGradient(DX - 30, DY - 30, 10, DX, DY, DR); dg.addColorStop(0, 'rgba(253,230,138,0.16)'); dg.addColorStop(1, 'rgba(251,191,36,0.06)');
      ctx.fillStyle = dg; ell(ctx, DX, DY, DR, DR); ctx.fill();
      ctx.strokeStyle = 'rgba(226,232,240,0.6)'; ctx.lineWidth = 3; ell(ctx, DX, DY, DR + 6, DR + 6); ctx.stroke();
      ctx.strokeStyle = 'rgba(226,232,240,0.25)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(DX, DY, DR - 4, 3.6, 4.6); ctx.stroke();
      const spot = (j) => { const r = 11.5 * Math.sqrt(j + 0.5); const a = j * 2.39996; return [DX + Math.cos(a) * r, DY + Math.sin(a) * r, a]; };
      const nBase = hold ? 2 ** NG : 2 ** g; const splitQ = hold ? 1 : smooth((p - 0.6) / 0.3);
      const bug = (x, y, a, s = 1) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = 'rgba(110,231,183,0.75)'; ctx.strokeStyle = '#d1fae5'; ctx.lineWidth = 1; rounded(ctx, -7 * s, -3.5, 14 * s, 7, 3.5); ctx.fill(); ctx.stroke(); ctx.restore(); };
      for (let j = 0; j < nBase; j++) { const [x, y, a] = spot(j); bug(x, y, a + 0.3 * Math.sin(k + j), splitQ > 0 && splitQ < 1 && !hold ? 1 + 0.4 * splitQ : 1); }
      if (!hold && splitQ > 0) for (let j = 0; j < nBase; j++) { const [x0, y0] = spot(j); const [x1, y1, a] = spot(j + nBase); bug(lerp(x0, x1, splitQ), lerp(y0, y1, splitQ), a, 1); }
      // Graph: the number over time.
      const GR = { x: 96, y: 384, w: 640, h: 160 };
      ctx.strokeStyle = 'rgba(140,170,255,0.14)'; ctx.lineWidth = 1; ctx.beginPath();
      for (const f of [0.5, 1]) { ctx.moveTo(GR.x, GR.y + GR.h - f * GR.h); ctx.lineTo(GR.x + GR.w, GR.y + GR.h - f * GR.h); }
      ctx.stroke();
      arrow(ctx, GR.x, GR.y + GR.h, GR.x + GR.w + 16, GR.y + GR.h, 'rgba(200,215,255,0.7)', 2.5);
      arrow(ctx, GR.x, GR.y + GR.h, GR.x, GR.y - 18, 'rgba(200,215,255,0.7)', 2.5);
      for (const [f, s] of [[0, '0'], [0.5, '32'], [1, '64']]) T(ctx, s, GR.x - 10, GR.y + GR.h - f * GR.h, 18, 'muted', 'right', 500);
      for (let m = 0; m <= 6; m++) T(ctx, m === 6 ? '120 min' : String(m * 20), GR.x + (m / 6) * GR.w, GR.y + GR.h + 20, 18, 'muted', 'center', 500);
      T(ctx, 'number of bacteria', GR.x + 12, GR.y - 12, 18, 'muted', 'left', 600);
      const X = (m) => GR.x + (m / 120) * GR.w; const Y = (v) => GR.y + GR.h - (v / 64) * GR.h;
      const tm = hold ? 120 : 20 * g + 20 * Math.min(p / 0.85, 1);
      ctx.strokeStyle = tint('yellow', 0.3); ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath();
      for (let m = 0; m <= tm; m += 2) { const v = 2 ** (m / 20); if (m === 0) ctx.moveTo(X(m), Y(v)); else ctx.lineTo(X(m), Y(v)); }
      ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(X(0), Y(1));
      for (let i = 0; i < 6; i++) { const ts = (i + 1) * 20; if (ts > tm) { ctx.lineTo(X(tm), Y(2 ** i)); break; } ctx.lineTo(X(ts), Y(2 ** i)); ctx.lineTo(X(ts), Y(2 ** (i + 1))); if (i === 5) ctx.lineTo(X(tm), Y(64)); }
      ctx.stroke();
      for (let i = 0; i <= 6; i++) {
        const m = i * 20; if (m > tm + 0.01) break;
        const v = 2 ** i; dot(ctx, X(m), Y(v), 5, 'yellow');
        if (i) T(ctx, v, X(m), Y(v) - 20, 18, 'yellow', 'center', 700); else T(ctx, v, X(m) + 12, Y(v) - 16, 18, 'yellow', 'left', 700);
      }
      soft(ctx, X(tm), Y(Math.min(64, count)), 18, 'yellow', 0.6);
      const head = hold ? '1 → 64 in two hours' : `Division ${g + 1}: ${2 ** g} → ${2 ** (g + 1)}`;
      const body = hold ? 'Doubling again and again: after 7 hours one cell could become over 2 million.'
        : p < 0.3 ? 'First the cell copies its single loop of DNA.'
          : p < 0.6 ? 'The cell grows longer and the two DNA loops move apart.'
            : p < 0.85 ? 'A new wall grows across the middle and pinches the cell in two.'
              : 'Two identical daughter cells. In good conditions this takes about 20 minutes.';
      caption(ctx, head, body, hold ? 'yellow' : 'green', 1, -1, 0);
      ctx.restore();
    },

    // ─── Control systems ─────────────────────────────────────────────────

    // Body temperature drifts up, then down; the hypothalamus notices and
    // sweating or shivering bring it back to 37 °C: negative feedback.
    'homeostasis-loop'(b, ctx, it, t) {
      const k = b.clock; const HP = 9.5;
      const c = cycle(t, 2 * HP, 0.6); const hot = c < HP; const h = (c % HP) / HP;
      const devAt = (hh) => smooth(hh / 0.25) * (1 - smooth((hh - 0.42) / 0.43));
      const temp = 37 + (hot ? 1.2 : -1.2) * devAt(h);
      const st = h < 0.25 ? 0 : h < 0.4 ? 1 : h < 0.86 ? 2 : 3;
      const act = smooth((h - 0.38) / 0.07) * (1 - smooth((h - 0.84) / 0.08));
      begin(ctx, t, it, 'Homeostasis: keeping at 37 °C');
      const HC = hot ? 'orange' : 'cyan';
      // Thermometer.
      const TX = 74; const ty = (v) => 440 - (v - 35) * 72;
      ctx.fillStyle = 'rgba(5,8,22,0.8)'; ctx.strokeStyle = 'rgba(226,232,240,0.7)'; ctx.lineWidth = 2.5;
      rounded(ctx, TX - 12, 110, 24, 360, 12); ctx.fill(); ctx.stroke(); ell(ctx, TX, 480, 24, 24); ctx.fill(); ctx.stroke();
      const liq = temp > 37 ? mix('#34d399', '#fb7185', clamp((temp - 37) / 1)) : mix('#34d399', '#38bdf8', clamp((37 - temp) / 1));
      ctx.fillStyle = liq; rounded(ctx, TX - 6, ty(temp), 12, 476 - ty(temp), 6); ctx.fill(); ell(ctx, TX, 480, 17, 17); ctx.fill();
      for (let v = 35; v <= 39; v++) {
        line(ctx, TX + 14, ty(v), TX + 24, ty(v), 'rgba(226,232,240,0.6)', 2);
        T(ctx, `${v} °C`, TX + 30, ty(v), v === 37 ? 20 : 18, v === 37 ? 'green' : 'muted', 'left', v === 37 ? 800 : 500);
      }
      line(ctx, TX + 92, ty(37), 196, ty(37), tint('green', 0.6), 2, [6, 6]);
      chip(ctx, `${temp.toFixed(1)} °C`, TX, 82, temp > 37.3 ? 'red' : temp < 36.7 ? 'cyan' : 'green', 20);
      // Weather: sun or snow.
      if (hot) {
        const sa = devAt(h) * 0.7 + 0.3;
        ctx.save(); ctx.globalAlpha *= sa; soft(ctx, 418, 250, 56, 'yellow', 0.6); dot(ctx, 418, 250, 20, 'yellow');
        ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 3; ctx.beginPath();
        for (let i = 0; i < 8; i++) { const an = (i / 8) * TAU + k * 0.4; ctx.moveTo(418 + Math.cos(an) * 27, 250 + Math.sin(an) * 27); ctx.lineTo(418 + Math.cos(an) * 37, 250 + Math.sin(an) * 37); }
        ctx.stroke(); ctx.restore();
      } else {
        for (let i = 0; i < 24; i++) {
          const x = 150 + rnd(i + 2) * 300 + 12 * Math.sin(k + i); const y = 132 + mod(rnd(i + 7) * 350 + k * (30 + rnd(i) * 20), 350);
          ctx.strokeStyle = 'rgba(224,242,254,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath();
          for (let j = 0; j < 3; j++) { const an = (j / 3) * Math.PI; ctx.moveTo(x - Math.cos(an) * 5, y - Math.sin(an) * 5); ctx.lineTo(x + Math.cos(an) * 5, y + Math.sin(an) * 5); }
          ctx.stroke();
        }
      }
      // The person.
      const jit = !hot ? act * 2.6 * Math.sin(k * 55) : 0;
      const PX = 300 + jit; const FY = 476; const PH = 330;
      const skin = hot ? mix('#22d3ee', '#fb7185', act * 0.9) : mix('#22d3ee', '#93c5fd', act);
      soft(ctx, PX, 330, 190, hot ? 'red' : 'blue', 0.08 + 0.12 * act);
      person(ctx, PX, FY, PH, skin, 0.18 + 0.1 * act, 3);
      // Brain and its thermostat.
      const hy = 171; ctx.fillStyle = 'rgba(167,139,250,0.35)'; ell(ctx, PX, hy - 6, 17, 12); ctx.fill();
      const det = st === 1 ? 0.5 + 0.5 * Math.sin(k * 10) : st === 2 ? 0.4 : 0.15;
      soft(ctx, PX + 2, hy, 30, 'yellow', 0.7 * det); dot(ctx, PX + 2, hy, 5, 'yellow');
      lead(ctx, 300, 124, PX + 2, hy - 8, 'yellow');
      T(ctx, 'Hypothalamus', 300, 86, 19, 'yellow');
      T(ctx, "(the brain's thermostat)", 300, 110, 18, 'muted', 'center', 500);
      // Effectors at work.
      if (hot && act > 0) {
        for (let i = 0; i < 14; i++) {
          const sx = [PX - 18, PX + 16, PX - 52, PX + 52, PX - 10, PX + 30][i % 6] + rnd(i) * 8; const sy0 = [176, 182, 300, 300, 240, 250][i % 6];
          const q = mod(k * 0.8 + rnd(i + 3), 1); const y = sy0 + q * 60;
          ctx.save(); ctx.globalAlpha *= act * (1 - q);
          ctx.fillStyle = '#7dd3fc'; ctx.beginPath(); ctx.moveTo(sx, y - 7); ctx.quadraticCurveTo(sx + 5, y, sx, y + 4); ctx.quadraticCurveTo(sx - 5, y, sx, y - 7); ctx.fill();
          ctx.restore();
        }
        for (let i = 0; i < 4; i++) {
          const q = mod(k * 0.5 + i / 4, 1); ctx.strokeStyle = tint('orange', 0.6 * act * (1 - q)); ctx.lineWidth = 2.5; ctx.beginPath();
          const x0 = PX + [-96, -74, 74, 96][i]; for (let y = 0; y <= 40; y += 4) { const xx = x0 + 5 * Math.sin(y * 0.3 + k * 4); if (y) ctx.lineTo(xx, 330 - q * 90 - y); else ctx.moveTo(xx, 330 - q * 90 - y); }
          ctx.stroke();
        }
      }
      if (!hot && act > 0) {
        for (let i = 0; i < 18; i++) { const sd = i % 2 ? 1 : -1; const y = 230 + (i >> 1) * 8; dot(ctx, PX + sd * (PH * 0.15 + (rnd(i) - 0.5) * 6), y, 2.2 * act, 'rgba(224,242,254,0.8)'); }
        ctx.save(); ctx.globalAlpha *= act; T(ctx, 'shivering', PX, 500, 18, 'cyan', 'center', 600); ctx.restore();
      }
      if (hot && act > 0) { ctx.save(); ctx.globalAlpha *= act; T(ctx, 'sweating', PX, 500, 18, 'orange', 'center', 600); ctx.restore(); }
      // Temperature trace.
      const TR = { x: 150, y: 534, w: 300, h: 48 };
      T(ctx, 'temperature over time', TR.x, 524, 18, 'muted', 'left', 500);
      line(ctx, TR.x, TR.y + TR.h / 2, TR.x + TR.w, TR.y + TR.h / 2, tint('green', 0.5), 1.5, [5, 5]);
      ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let q = 0; q <= c; q += 0.1) { const hh = (q % HP) / HP; const v = (q < HP ? 1 : -1) * devAt(hh); const x = TR.x + (q / (2 * HP)) * TR.w; const y = TR.y + TR.h / 2 - v * TR.h * 0.42; if (q === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
      dot(ctx, TR.x + (c / (2 * HP)) * TR.w, TR.y + TR.h / 2 - (hot ? 1 : -1) * devAt(h) * TR.h * 0.42, 4.5, 'yellow');
      // The feedback loop.
      const BOX = hot
        ? [['Stimulus', 'Body warms up to 38 °C'], ['Receptors and brain', 'The hypothalamus detects the change'], ['Effectors', 'Sweat glands work; skin blood vessels widen'], ['Response', 'Heat is lost: back to 37 °C']]
        : [['Stimulus', 'Body cools down to 36 °C'], ['Receptors and brain', 'The hypothalamus detects the change'], ['Effectors', 'Muscles shiver; skin blood vessels narrow'], ['Response', 'Heat is kept: back to 37 °C']];
      const BC = ['red', 'yellow', HC, 'green'];
      BOX.forEach(([hd, tx], i) => {
        const y = 76 + i * 110; const on = i === st;
        if (on) soft(ctx, 614, y + 43, 150, BC[i], 0.16);
        panel(ctx, 478, y, 272, 86, BC[i], on ? 0.18 : 0.04, 14);
        ctx.save(); ctx.globalAlpha *= on ? 1 : 0.6;
        T(ctx, `${i + 1}. ${hd}`, 492, y + 22, 19, BC[i], 'left');
        para(ctx, tx, 492, y + 58, 248, 18, 'ink', 500, 2, 'left');
        ctx.restore();
        if (i < 3) arr(ctx, 614, y + 88, 614, y + 108, tint('muted', 0.8), 3);
      });
      ctx.strokeStyle = tint('green', 0.7); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(750, 449); ctx.lineTo(770, 449); ctx.lineTo(770, 119); ctx.stroke();
      arr(ctx, 770, 119, 754, 119, 'green', 3);
      ctx.save(); ctx.translate(788, 284); ctx.rotate(-Math.PI / 2); T(ctx, 'negative feedback', 0, 0, 18, 'green', 'center', 700); ctx.restore();
      const pq = mod(k * 0.6, 1); dot(ctx, 770, lerp(449, 119, pq), 5, 'green'); soft(ctx, 770, lerp(449, 119, pq), 14, 'green', 0.6);
      const CAP = hot
        ? [['Too hot', 'Exercise or a hot day pushes body temperature above 37 °C.'], ['The brain notices', 'Temperature receptors and the hypothalamus detect the rise.'], ['Cooling down', 'Sweat evaporates and takes heat away; wider skin vessels let heat escape.'], ['Negative feedback', 'The response reverses the change, so the body stays near 37 °C.']]
        : [['Too cold', 'Cold air pulls body temperature below 37 °C.'], ['The brain notices', 'Temperature receptors and the hypothalamus detect the fall.'], ['Warming up', 'Shivering muscles release heat; narrower skin vessels keep warm blood inside.'], ['Negative feedback', 'The response reverses the change, so the body stays near 37 °C.']];
      caption(ctx, CAP[st][0], CAP[st][1], st === 3 ? 'green' : HC, (h - [0, 0.25, 0.4, 0.86][st]) * HP, st, 4);
      ctx.restore();
    },

    // ─── Ecology ──────────────────────────────────────────────────────────

    // Nitrogen moves from the air into soil, plants, animals and back,
    // carried by bacteria (and lightning); each stage lights one path.
    'nitrogen-cycle'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [2.8, 2.8, 2.8, 2.8, 2.6, 2.8, 2.8, 2.8], 0.6);
      begin(ctx, t, it, 'The nitrogen cycle');
      const GY = 300;
      // Sky and soil.
      const sky = ctx.createLinearGradient(0, 56, 0, GY); sky.addColorStop(0, 'rgba(56,189,248,0.10)'); sky.addColorStop(1, 'rgba(56,189,248,0.02)');
      ctx.fillStyle = sky; ctx.fillRect(20, 56, 760, GY - 56);
      const soil = ctx.createLinearGradient(0, GY, 0, 588); soil.addColorStop(0, 'rgba(146,98,56,0.42)'); soil.addColorStop(1, 'rgba(82,52,30,0.5)');
      ctx.fillStyle = soil; ctx.fillRect(20, GY, 760, 288);
      ctx.strokeStyle = 'rgba(132,204,22,0.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(20, GY); ctx.lineTo(780, GY); ctx.stroke();
      for (let i = 0; i < 40; i++) { const x = 24 + i * 19; ctx.strokeStyle = 'rgba(132,204,22,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, GY); ctx.lineTo(x + 3 * Math.sin(k * 2 + i), GY - 8 - (i % 3) * 3); ctx.stroke(); }
      for (let i = 0; i < 30; i++) dot(ctx, 24 + rnd(i + 1) * 752, GY + 14 + rnd(i + 2) * 270, 2 + rnd(i) * 2, 'rgba(214,170,120,0.25)');
      // N2 molecules drifting in the air.
      for (let i = 0; i < 14; i++) {
        const x = 30 + mod(rnd(i) * 740 + k * (8 + rnd(i + 4) * 8), 740); const y = 130 + rnd(i + 9) * 120 + 8 * Math.sin(k + i); const an = k * 0.8 + i;
        for (const sd of [-1, 1]) dot(ctx, x + Math.cos(an) * 6 * sd, y + Math.sin(an) * 6 * sd, 5, 'rgba(147,197,253,0.55)');
      }
      // Cloud and lightning.
      ctx.fillStyle = 'rgba(203,213,225,0.35)'; for (const [dx, dy, r] of [[-34, 6, 24], [0, -6, 32], [34, 6, 26], [8, 14, 26]]) { ell(ctx, 600 + dx, 112 + dy, r, r * 0.8); ctx.fill(); }
      const flash = S.i === 2 ? Math.max(0, Math.sin(k * 9)) : 0.15;
      ctx.save(); ctx.globalAlpha *= 0.3 + 0.7 * flash; soft(ctx, 590, 200, 60, 'yellow', 0.5 * flash);
      ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 4; poly(ctx, [600, 132, 584, 180, 602, 184, 580, 240, 596, 244, 576, 290]); ctx.stroke(); ctx.restore();
      // Pea plant with root nodules.
      const PX0 = 140;
      ctx.strokeStyle = '#65a30d'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(PX0, GY); ctx.bezierCurveTo(PX0 - 6, 250, PX0 + 8, 210, PX0, 160); ctx.stroke();
      for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) { const y = 270 - i * 30; ctx.fillStyle = 'rgba(132,204,22,0.55)'; ctx.strokeStyle = '#a3e635'; ctx.lineWidth = 1.5; ell(ctx, PX0 + sd * 20, y, 16, 9, sd * -0.4 + 0.1 * Math.sin(k + i)); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = 'rgba(163,230,53,0.6)'; ell(ctx, PX0 + 30, 214, 7, 20, 0.4); ctx.fill();
      for (const sd of [-1, 1]) { ctx.fillStyle = 'rgba(244,244,255,0.85)'; ell(ctx, PX0 + sd * 8, 152, 9, 7); ctx.fill(); }
      ctx.strokeStyle = 'rgba(253,230,138,0.65)'; ctx.lineWidth = 2.5;
      const ROOTS = [[PX0, GY, PX0 - 4, 360, PX0 - 30, 420], [PX0, GY, PX0 + 10, 350, PX0 + 44, 410], [PX0, GY, PX0, 380, PX0 + 4, 450], [PX0 - 4, 340, PX0 - 30, 360, PX0 - 54, 380]];
      for (const [a, b0, c0, d, e, f] of ROOTS) { ctx.beginPath(); ctx.moveTo(a, b0); ctx.quadraticCurveTo(c0, d, e, f); ctx.stroke(); }
      const NOD = [[PX0 - 14, 384], [PX0 + 24, 376], [PX0 + 2, 410], [PX0 - 40, 372], [PX0 + 36, 400], [PX0 - 22, 408]];
      for (const [x, y] of NOD) { soft(ctx, x, y, 16, PINK, S.i === 1 ? 0.7 : 0.25); dot(ctx, x, y, 6, '#f9a8d4'); }
      // Rabbit.
      const RXr = 340; const RYr = 278;
      ctx.fillStyle = 'rgba(203,213,225,0.75)'; ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1.5;
      ell(ctx, RXr, RYr, 30, 19); ctx.fill(); ctx.stroke(); ell(ctx, RXr + 30, RYr - 14, 13, 11); ctx.fill(); ctx.stroke();
      ell(ctx, RXr + 26, RYr - 34, 4, 14, -0.2); ctx.fill(); ctx.stroke(); ell(ctx, RXr + 34, RYr - 33, 4, 14, 0.15); ctx.fill(); ctx.stroke();
      dot(ctx, RXr - 30, RYr - 4, 7, '#ffffff'); dot(ctx, RXr + 35, RYr - 16, 2, DARK);
      // Decomposers in the soil.
      for (let i = 0; i < 8; i++) {
        const x = 300 + rnd(i + 30) * 100; const y = 372 + rnd(i + 31) * 40; const an = rnd(i) * TAU + 0.3 * Math.sin(k + i);
        ctx.save(); ctx.translate(x, y); ctx.rotate(an); ctx.fillStyle = 'rgba(52,211,153,0.6)'; rounded(ctx, -7, -3, 14, 6, 3); ctx.fill(); ctx.restore();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i = 0; i < 6; i++) { const x0 = 290 + i * 22; ctx.moveTo(x0, 360); ctx.bezierCurveTo(x0 + 10, 380, x0 - 10, 400, x0 + 6, 420); }
      ctx.stroke();
      // Node labels.
      const box = (x, y, text, c, on) => { if (on) soft(ctx, x, y, 90, c, 0.25); chip(ctx, text, x, y, c, on ? 20 : 19); };
      const st = S.i;
      box(400, 82, 'N₂ gas: 78% of the air', 'blue', st === 0 || st === 1 || st === 2 || st === 7);
      box(300, 532, 'Ammonium (NH₄⁺)', 'orange', st === 5 || st === 6);
      box(640, 452, 'Nitrates (NO₃⁻)', 'cyan', st === 2 || st === 3 || st === 6 || st === 7);
      T(ctx, 'Root nodules', 92, 480, 18, PINK, 'center', 700);
      T(ctx, 'Pea plant', PX0 + 34, 158, 18, LIME, 'left', 700);
      T(ctx, 'Animals', 340, 222, 18, 'ink', 'center', 700);
      T(ctx, 'Decomposers', 446, 392, 18, 'green', 'left', 700);
      // The paths of the cycle.
      const PATHS = [
        null,
        mkPath(curvePts(300, 92, 120, 92, 50, 200, 96, 372)),
        mkPath(curvePts(590, 296, 600, 340, 620, 380, 630, 430)),
        mkPath([600, 474, 600, 566, 200, 566, 200, 476, 176, 446]),
        mkPath(curvePts(170, 230, 220, 230, 260, 250, 300, 268)),
        mkPath([340, 300, 340, 362]),
        mkPath(curvePts(380, 532, 470, 532, 520, 490, 560, 462)),
        mkPath(curvePts(720, 440, 790, 380, 770, 140, 520, 86)),
      ];
      const PC = [null, PINK, 'yellow', 'cyan', LIME, 'green', 'orange', 'blue'];
      PATHS.forEach((P, i) => {
        if (!P) return; const on = i === st || (st === 5 && i === 5);
        ctx.strokeStyle = tint(PC[i], on ? 0.9 : 0.22); ctx.lineWidth = on ? 4 : 2.5; ctx.setLineDash(on ? [] : [6, 8]);
        strokeSpan(ctx, P, 0, P.total - 12); ctx.setLineDash([]);
        const end = at(P, P.total); const pre = at(P, P.total - 14);
        arr(ctx, pre.x, pre.y, end.x, end.y, tint(PC[i], on ? 1 : 0.35), on ? 4 : 2.5);
        if (on) for (let j = 0; j < 5; j++) { const q = mod(k * 0.45 + j / 5, 1); const A = at(P, q * P.total); soft(ctx, A.x, A.y, 14, PC[i], 0.8); dot(ctx, A.x, A.y, 3.5, WHITE); }
      });
      if (st === 5) { const P2 = mkPath([300, 432, 300, 512]); ctx.strokeStyle = tint('green', 0.9); ctx.lineWidth = 4; strokeSpan(ctx, P2, 0, P2.total - 12); arr(ctx, 300, 500, 300, 514, 'green', 4); for (let j = 0; j < 3; j++) { const A = at(P2, mod(k * 0.45 + j / 3, 1) * P2.total); dot(ctx, A.x, A.y, 3.5, WHITE); } }
      const CAP = [
        ['Nitrogen gas: 78% of the air', "Living things need nitrogen to build proteins and DNA, but can't use N₂ gas directly.", 'blue'],
        ['Nitrogen fixation', 'Bacteria in the root nodules of peas and beans turn N₂ into ammonium the plant uses.', PINK],
        ['Lightning fixes nitrogen too', "Lightning's energy makes nitrogen oxides; rain washes them into the soil as nitrates.", 'yellow'],
        ['Roots absorb nitrates', 'Plants take up nitrates from the soil and use them to make proteins.', 'cyan'],
        ['Animals eat plants', 'The nitrogen passes along the food chain inside proteins.', LIME],
        ['Decomposers', 'Bacteria and fungi break down dead bodies and waste, releasing ammonium.', 'green'],
        ['Nitrification', 'Nitrifying bacteria turn ammonium into nitrites, then into nitrates.', 'orange'],
        ['Denitrification', 'In waterlogged soil, denitrifying bacteria turn nitrates back into N₂ gas.', 'blue'],
      ];
      caption(ctx, CAP[st][0], CAP[st][1], CAP[st][2], S.s, st, 8);
      ctx.restore();
    },

    // Energy enters with sunlight at the producers; at each level only about
    // a tenth passes up, the rest leaves as heat.
    'energy-pyramid'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [3.6, 3.6, 3.6, 3.8], 0.6);
      begin(ctx, t, it, 'The energy pyramid');
      const CX = 340; const BASE = 560; const LH = 100;
      const HW = [300, 225, 150, 75, 22];
      const LV = [['Producers: grass', '10,000 kJ', 'green'], ['Grasshoppers', '1,000 kJ', LIME], ['Frogs', '100 kJ', 'orange'], ['Snake', '10 kJ', 'red']];
      const yB = (i) => BASE - i * LH; const hwAt = (y) => { const f = (BASE - y) / LH; const i = Math.min(3, Math.floor(f)); return lerp(HW[i], HW[i + 1], f - i); };
      const focus = [[0], [0, 1], [0, 1, 2], [3]][S.i];
      motes(ctx, k, 24, 'yellow', [20, 60, 760, 520], 17, 2, 0.25);
      // Layers.
      LV.forEach(([nm, kj, c], i) => {
        const g = after(t, 0.4 + i * 0.35, 0.6); if (g <= 0) return;
        const on = focus.includes(i) && (S.i !== 1 || i === 1) && (S.i !== 2 || i < 3);
        ctx.save(); ctx.globalAlpha *= g;
        const y0 = yB(i); const y1 = yB(i + 1);
        if (on) soft(ctx, CX, (y0 + y1) / 2, HW[i] * 0.9, c, 0.18);
        const gr = ctx.createLinearGradient(0, y1, 0, y0); gr.addColorStop(0, tint(c, on ? 0.42 : 0.22)); gr.addColorStop(1, tint(c, on ? 0.2 : 0.08));
        ctx.fillStyle = gr; ctx.strokeStyle = tint(c, on ? 1 : 0.6); ctx.lineWidth = on ? 3 : 2;
        poly(ctx, [CX - HW[i], y0 - 3, CX + HW[i], y0 - 3, CX + HW[i + 1], y1 + 3, CX - HW[i + 1], y1 + 3], true); ctx.fill(); ctx.stroke();
        const my = (y0 + y1) / 2;
        if (i < 3) { T(ctx, nm, CX, my - 13, 20, c); T(ctx, kj, CX, my + 15, 19, 'ink', 'center', 600); } else { T(ctx, kj, CX, my + 22, 18, 'ink', 'center', 700); }
        ctx.restore();
      });
      // Icons: grass blades, a grasshopper, a frog, a snake.
      ctx.save(); ctx.globalAlpha *= after(t, 0.8, 0.6);
      for (let i = 0; i < 9; i++) { const x = 90 + i * 12; ctx.strokeStyle = tint('green', 0.9); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 548); ctx.quadraticCurveTo(x + 4 + 4 * Math.sin(k * 2 + i), 528, x + 8 * Math.sin(k + i), 508 - (i % 3) * 6); ctx.stroke(); }
      for (let i = 0; i < 9; i++) { const x = 500 + i * 12; ctx.strokeStyle = tint('green', 0.9); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 548); ctx.quadraticCurveTo(x + 4 + 4 * Math.sin(k * 2 + i), 528, x + 8 * Math.sin(k + i), 508 - (i % 3) * 6); ctx.stroke(); }
      ctx.fillStyle = tint(LIME, 0.6); ctx.strokeStyle = LIME; ctx.lineWidth = 2; ell(ctx, 170, 412, 22, 8, -0.1); ctx.fill(); ctx.stroke(); ell(ctx, 194, 408, 7, 6); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(170, 408); ctx.lineTo(150, 392); ctx.lineTo(140, 418); ctx.moveTo(196, 403); ctx.quadraticCurveTo(206, 386, 214, 384); ctx.stroke();
      ctx.fillStyle = tint('orange', 0.55); ctx.strokeStyle = COLORS.orange; ell(ctx, 268, 314, 22, 14); ctx.fill(); ctx.stroke(); dot(ctx, 262, 300, 5, 'orange'); dot(ctx, 278, 300, 5, 'orange'); dot(ctx, 262, 300, 2, DARK); dot(ctx, 278, 300, 2, DARK);
      ctx.strokeStyle = COLORS.red; ctx.lineWidth = 6; ctx.beginPath(); for (let x = 0; x <= 60; x += 4) { const yy = 132 + 6 * Math.sin(x * 0.15 + k * 3); if (x) ctx.lineTo(CX - 30 + x, yy); else ctx.moveTo(CX - 30 + x, yy); } ctx.stroke();
      dot(ctx, CX + 32, 132 + 6 * Math.sin(60 * 0.15 + k * 3), 6, 'red');
      T(ctx, 'Snake', CX + 50, 132, 20, 'red', 'left');
      ctx.restore();
      // The Sun and light pouring onto the producers.
      soft(ctx, 712, 104, 70, 'yellow', 0.55); dot(ctx, 712, 104, 24, 'yellow');
      T(ctx, 'Sunlight', 712, 152, 18, 'yellow', 'center', 600);
      const sunPath = mkPath(curvePts(712, 170, 760, 300, 740, 460, 630, 520));
      for (let j = 0; j < 7; j++) { const A = at(sunPath, mod(k * 0.35 + j / 7, 1) * sunPath.total); soft(ctx, A.x, A.y, 14, 'yellow', 0.7); dot(ctx, A.x, A.y, 3, WHITE); }
      // Energy packets: most leave each level as heat, a tenth rise.
      const reach = (j) => (j === 0 ? 3 : j % 20 === 0 ? 2 : j % 10 === 0 ? 1 : 0);
      for (let j = 0; j < 60; j++) {
        const tau = mod(k / 1.7 + rnd(j) * 4, 4); const lv = Math.floor(tau); const f = tau - lv; const R = reach(j);
        if (lv <= R) {
          const y = yB(lv) - 12 - f * (LH - 24); const hw = hwAt(y); const mg = Math.min(95, hw * 0.45); const x = CX + (rnd(j + 7) < 0.5 ? -1 : 1) * lerp(mg, hw * 0.82, rnd(j + 11));
          soft(ctx, x, y, 10, 'yellow', 0.7); dot(ctx, x, y, 2.6, '#fff7c2');
        } else if (lv === R + 1) {
          const y0 = yB(R) - LH * 0.55; const x0 = CX - hwAt(y0) * 0.85;
          const x = x0 - f * 90; const y = y0 - f * 40 + 6 * Math.sin(f * 14 + j);
          ctx.save(); ctx.globalAlpha *= 1 - f; soft(ctx, x, y, 10, 'red', 0.6); dot(ctx, x, y, 2.4, '#fecaca'); ctx.restore();
        }
      }
      // Ten per cent up, ninety per cent lost.
      for (let i = 0; i < 3; i++) {
        const y = yB(i + 1); const on = S.i === 1 || S.i === 3 || (S.i === 0 && false);
        ctx.save(); ctx.globalAlpha *= after(t, 1.4 + i * 0.3, 0.5) * (on ? 1 : 0.7);
        const x = CX + HW[i + 1] + 46;
        arr(ctx, x - 26, y + 24, x - 26, y - 22, 'yellow', 3);
        T(ctx, '10%', x - 10, y, 20, 'yellow', 'left', 800);
        ctx.restore();
      }
      ctx.save(); ctx.globalAlpha *= S.i >= 2 ? 1 : 0.65;
      panel(ctx, 24, 66, 226, 92, 'red', S.i === 2 ? 0.14 : 0.06, 14);
      T(ctx, 'About 90% lost', 137, 90, 20, 'red');
      para(ctx, 'at each step as heat, movement and waste', 36, 128, 202, 18, 'ink', 500, 2);
      ctx.restore();
      const CAP = [
        ['Producers capture the energy', "Plants store only about 1% of the sunlight that reaches them as food: here 10,000 kJ.", 'green'],
        ['Only about 10% passes up', 'Grasshoppers eating the grass build only about 1,000 kJ into their bodies.', LIME],
        ['Where does the other 90% go?', 'Lost as heat from respiration, used in movement, or left in parts not eaten or digested.', 'red'],
        ['Why food chains are short', 'By the top only 10 kJ is left: so there are few top predators, and rarely more than 4 or 5 levels.', 'orange'],
      ];
      caption(ctx, CAP[S.i][0], CAP[S.i][1], CAP[S.i][2], S.s, S.i, 4);
      ctx.restore();
    },

    // ─── Plants ───────────────────────────────────────────────────────────

    // A bee carries pollen from one flower to another; a pollen tube grows
    // down to an ovule, which becomes a seed inside a swelling fruit.
    pollination(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [3.0, 2.8, 2.2, 3.8, 3.8], 0.6);
      begin(ctx, t, it, 'Pollination and seeds');
      // Left: the meadow.
      const sky = ctx.createLinearGradient(0, 60, 0, 520); sky.addColorStop(0, 'rgba(125,211,252,0.10)'); sky.addColorStop(1, 'rgba(132,204,22,0.10)');
      ctx.fillStyle = sky; rounded(ctx, 20, 60, 380, 470, 18); ctx.fill();
      ctx.strokeStyle = tint('muted', 0.4); ctx.lineWidth = 1.5; ctx.stroke();
      const flower = (x, y, s, petA = 1, c = PINK) => {
        ctx.strokeStyle = '#65a30d'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y + 18 * s); ctx.quadraticCurveTo(x + 10, (y + 510) / 2, x - 4, 510); ctx.stroke();
        ctx.fillStyle = 'rgba(132,204,22,0.6)'; ell(ctx, x + 18, 420, 20, 8, -0.5); ctx.fill();
        ctx.save(); ctx.globalAlpha *= petA;
        for (let i = 0; i < 6; i++) { const an = (i / 6) * TAU + 0.05 * Math.sin(k + x); ctx.fillStyle = tint(c, 0.7); ctx.strokeStyle = tint(c, 1); ctx.lineWidth = 1.5; ell(ctx, x + Math.cos(an) * 26 * s, y + Math.sin(an) * 26 * s, 22 * s, 12 * s, an); ctx.fill(); ctx.stroke(); }
        ctx.restore();
        soft(ctx, x, y, 40 * s, 'yellow', 0.35);
        for (let i = 0; i < 6; i++) { const an = (i / 6) * TAU + 0.5; line(ctx, x, y, x + Math.cos(an) * 16 * s, y + Math.sin(an) * 16 * s, '#fde68a', 2); dot(ctx, x + Math.cos(an) * 17 * s, y + Math.sin(an) * 17 * s, 3.5 * s, 'yellow'); }
        dot(ctx, x, y, 6 * s, LIME);
      };
      const FA = [110, 236]; const FB = [300, 280];
      const fruitQ = S.i === 4 ? smooth(win(S.p, 0.3, 1)) : 0;
      flower(FA[0], FA[1], 1);
      flower(FB[0], FB[1], 1, 1 - fruitQ * 0.85);
      if (fruitQ > 0) { ctx.save(); ctx.globalAlpha *= fruitQ; ctx.fillStyle = 'rgba(74,222,128,0.65)'; ctx.strokeStyle = '#86efac'; ctx.lineWidth = 2; ell(ctx, FB[0], FB[1] + 8, 16, 22); ctx.fill(); ctx.stroke(); ctx.restore(); }
      T(ctx, 'Flower A', FA[0], 548, 18, 'muted', 'center', 600); T(ctx, 'Flower B', FB[0], 548, 18, 'muted', 'center', 600);
      // The bee.
      let bx; let by;
      if (S.i === 0) { bx = FA[0] + 10 * Math.sin(k * 3); by = FA[1] - 26 + 4 * Math.sin(k * 5); }
      else if (S.i === 1) { const q = smooth(S.p); bx = lerp(FA[0], FB[0], q); by = lerp(FA[1] - 26, FB[1] - 26, q) - Math.sin(q * Math.PI) * 70; }
      else if (S.i === 2) { bx = FB[0] + 8 * Math.sin(k * 3); by = FB[1] - 26 + 4 * Math.sin(k * 5); }
      else { const q = smooth(win(S.p, 0, 0.6)); bx = lerp(FB[0], 470, q); by = lerp(FB[1] - 26, 120, q); }
      const beeA = S.i === 3 ? 1 - win(S.p, 0.4, 0.6) : S.i === 4 ? 0 : 1;
      const pollenN = S.i === 0 ? Math.floor(S.p * 9) : S.i === 1 ? 9 : S.i === 2 ? Math.round(9 - S.p * 5) : 4;
      if (beeA > 0) {
        ctx.save(); ctx.globalAlpha *= beeA; ctx.translate(bx, by); const dir = S.i === 1 || S.i === 3 ? 1 : Math.sign(Math.cos(k * 3)) || 1; ctx.scale(dir * 1.4, 1.4);
        const fl = Math.sin(k * 40);
        ctx.fillStyle = 'rgba(224,242,254,0.55)'; ell(ctx, -2, -14, 10, 6 + 3 * fl, -0.5); ctx.fill(); ell(ctx, 6, -14, 9, 5 + 3 * fl, 0.4); ctx.fill();
        ctx.fillStyle = '#facc15'; ell(ctx, 0, 0, 17, 11); ctx.fill();
        ctx.fillStyle = '#1f2937'; for (const x of [-6, 2]) ctx.fillRect(x, -10, 4, 20);
        ell(ctx, 17, -2, 7, 7); ctx.fill(); ctx.fillStyle = '#1f2937'; poly(ctx, [-17, 0, -23, -2, -17, 3], true); ctx.fill();
        for (let i = 0; i < pollenN; i++) dot(ctx, -10 + (i % 5) * 5, 8 + Math.floor(i / 5) * 4, 2.6, '#fde047');
        ctx.restore();
        if (S.i === 1) chip(ctx, 'The bee carries pollen', 210, 96, 'yellow', 18);
      }
      // Right: inside flower B.
      panel(ctx, 418, 60, 362, 526, 'purple', 0.05, 18);
      T(ctx, 'Inside flower B', 599, 84, 19, 'purple');
      const SX = 600; const STY = 128; const OVY = 440;
      const swell = 1 + fruitQ * 0.35;
      // Petals (cut) and stamens.
      ctx.save(); ctx.globalAlpha *= 1 - fruitQ * 0.85;
      for (const sd of [-1, 1]) {
        ctx.fillStyle = tint(PINK, 0.35); ctx.strokeStyle = tint(PINK, 0.9); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(SX + sd * 60, OVY - 40); ctx.quadraticCurveTo(SX + sd * 170, OVY - 150, SX + sd * 160, OVY - 250); ctx.quadraticCurveTo(SX + sd * 110, OVY - 160, SX + sd * 40, OVY - 70); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(SX + sd * 46, OVY - 60); ctx.quadraticCurveTo(SX + sd * 80, OVY - 160, SX + sd * 92, OVY - 228); ctx.stroke();
        ctx.fillStyle = '#facc15'; ell(ctx, SX + sd * 94, OVY - 238, 9, 16, sd * 0.2); ctx.fill();
      }
      ctx.restore();
      // Carpel: stigma, style, ovary with ovules.
      soft(ctx, SX, OVY, 120 * swell, fruitQ > 0 ? 'green' : 'purple', 0.2);
      ctx.fillStyle = fruitQ > 0 ? mix('#a78bfa', '#4ade80', fruitQ, 0.35) : 'rgba(167,139,250,0.3)'; ctx.strokeStyle = fruitQ > 0 ? mix('#c4b5fd', '#86efac', fruitQ) : '#c4b5fd'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(SX - 12, STY + 18); ctx.lineTo(SX - 12, OVY - 70 * swell); ctx.bezierCurveTo(SX - 80 * swell, OVY - 60 * swell, SX - 92 * swell, OVY + 70 * swell, SX, OVY + 76 * swell);
      ctx.bezierCurveTo(SX + 92 * swell, OVY + 70 * swell, SX + 80 * swell, OVY - 60 * swell, SX + 12, OVY - 70 * swell); ctx.lineTo(SX + 12, STY + 18); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d9f99d'; ctx.strokeStyle = '#ecfccb'; for (const dx of [-16, 0, 16]) { ell(ctx, SX + dx, STY + 6, 12, 14); ctx.fill(); }
      const OV = [[SX - 34, OVY - 4], [SX + 34, OVY - 4], [SX, OVY + 40]];
      const fert = S.i === 4 ? smooth(win(S.p, 0, 0.35)) : 0;
      OV.forEach(([x, y], i) => {
        const seed = i === 2 ? fert : 0;
        ctx.fillStyle = seed > 0 ? mix('#f5f3ff', '#b7794a', seed) : 'rgba(245,243,255,0.85)'; ctx.strokeStyle = seed > 0 ? '#fde68a' : '#ddd6fe'; ctx.lineWidth = 2;
        ell(ctx, x * 1 + (x - SX) * (swell - 1), y + (y - OVY) * (swell - 1), 13 + seed * 6, 17 + seed * 6); ctx.fill(); ctx.stroke();
        if (seed > 0.5) soft(ctx, SX, OVY + 40, 40, 'yellow', 0.4 * (1 - fruitQ));
      });
      // Pollen grain on the stigma, and its tube.
      const landed = S.i >= 2 ? (S.i === 2 ? smooth(win(S.p, 0.2, 0.7)) : 1) : 0;
      if (landed > 0) {
        const gx = lerp(452, SX, landed); const gy = lerp(104, STY - 12, landed);
        soft(ctx, gx, gy, 20, 'yellow', 0.6);
        ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#a16207'; ctx.lineWidth = 1.5; ell(ctx, gx, gy, 10, 10); ctx.fill(); ctx.stroke();
        for (let i = 0; i < 8; i++) { const an = (i / 8) * TAU; dot(ctx, gx + Math.cos(an) * 10, gy + Math.sin(an) * 10, 1.6, '#a16207'); }
      }
      const tube = mkPath([SX, STY - 6, SX + 2, STY + 60, SX - 2, 250, SX + 2, OVY - 80, SX - 4, OVY - 10, SX, OVY + 22]);
      const grow = S.i === 3 ? smooth(S.p / 0.9) : S.i === 4 ? 1 : 0;
      if (grow > 0) {
        ctx.strokeStyle = 'rgba(253,224,71,0.85)'; ctx.lineWidth = 4; strokeSpan(ctx, tube, 0, grow * tube.total);
        const P = at(tube, grow * tube.total); if (S.i === 3) { soft(ctx, P.x, P.y, 18, 'yellow', 0.8); }
        if (S.i === 4 && S.p < 0.35) { const P2 = at(tube, tube.total); soft(ctx, P2.x, P2.y + 16, 46, 'yellow', 0.8 * Math.sin(Math.PI * S.p / 0.35)); }
      }
      // Labels (left side of the panel).
      const L = [['Stigma', STY + 6, SX - 30, STY + 6, 'yellow'], ['Style', 260, SX - 14, 260, 'purple'], ['Ovary', OVY - 40, SX - 64, OVY - 40, 'purple'], ['Ovule', OVY + 70, SX - 8, OVY + 46, 'ink']];
      L.forEach(([s, y, px, py, c]) => { T(ctx, s, 436, y, 18, c, 'left'); ctx.font = `700 18px ${FONT}`; const w = ctx.measureText(s).width; lead(ctx, 442 + w, y, px, py, c); });
      if (fruitQ < 0.5) { T(ctx, 'Anther', 764, OVY - 270, 18, 'yellow', 'right'); lead(ctx, 716, OVY - 262, SX + 100, OVY - 244, 'yellow'); }
      if (grow > 0 && grow < 1) { T(ctx, 'Pollen tube', 764, 300, 18, 'yellow', 'right'); lead(ctx, 666, 300, SX + 6, 300, 'yellow'); }
      if (fert > 0.6) { T(ctx, 'Seed', 764, OVY + 80, 19, BROWN, 'right'); lead(ctx, 718, OVY + 80, SX + 20, OVY + 48, BROWN); T(ctx, fruitQ > 0.5 ? 'Fruit' : '', 764, OVY - 70, 19, 'green', 'right'); }
      const CAP = [
        ['A bee visits flower A', 'It drinks nectar, and sticky pollen from the anthers rubs onto its hairy body.', 'yellow'],
        ['Off to another flower', 'The bee flies to flower B of the same kind, carrying the pollen with it.', 'yellow'],
        ['Pollination', 'Pollen rubs off onto the sticky stigma of flower B.', 'purple'],
        ['A pollen tube grows', 'The pollen grain grows a tube down through the style to an ovule.', 'yellow'],
        ['Fertilisation: a seed forms', 'The male cell joins the egg cell. The ovule becomes a seed and the ovary a fruit.', 'green'],
      ];
      caption(ctx, CAP[S.i][0], CAP[S.i][1], CAP[S.i][2], S.s, S.i, 5);
      ctx.restore();
    },

    // Light from one side: auxin gathers on the shady side, the cells there
    // grow longer and the shoot bends towards the lamp.
    phototropism(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [2.6, 3.2, 4.6, 3.6], 0.6);
      begin(ctx, t, it, 'Phototropism: growing towards light');
      const lightOn = S.i === 0 ? smooth(S.p / 0.4) : 1;
      const mig = S.i === 0 ? 0 : S.i === 1 ? smooth(S.p) : 1;
      const bend = S.i < 2 ? 0 : S.i === 2 ? smooth(S.p) : 1;
      const fadeA = S.i === 3 ? 1 - win(S.p, 0.9, 1) : S.i === 0 ? win(S.p, 0, 0.1) + (t < 1.5 ? 1 : 0) : 1;
      // Lamp and light.
      const LX = 690; const LY = 132;
      ctx.save(); ctx.globalAlpha *= lightOn;
      const beam = ctx.createLinearGradient(LX, LY, 300, 360); beam.addColorStop(0, 'rgba(253,224,71,0.30)'); beam.addColorStop(1, 'rgba(253,224,71,0.02)');
      ctx.fillStyle = beam; poly(ctx, [LX - 20, LY + 10, LX + 10, LY + 30, 330, 560, 250, 120], true); ctx.fill();
      for (let i = 0; i < 6; i++) { const q = mod(k * 0.6 + i / 6, 1); const x = lerp(LX - 10, 360, q); const y = lerp(LY + 20, 200 + i * 50, q); dot(ctx, x, y, 3, 'rgba(254,240,138,0.8)'); }
      soft(ctx, LX - 4, LY + 18, 70, 'yellow', 0.6);
      ctx.restore();
      ctx.fillStyle = '#334155'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
      poly(ctx, [LX - 30, LY - 10, LX + 30, LY - 30, LX + 40, LY + 6, LX - 14, LY + 34], true); ctx.fill(); ctx.stroke();
      line(ctx, LX + 30, LY - 18, LX + 70, LY - 60, '#94a3b8', 4); line(ctx, LX + 70, LY - 60, LX + 70, 560, '#94a3b8', 4);
      ctx.fillStyle = '#334155'; rounded(ctx, LX + 40, 556, 60, 12, 6); ctx.fill(); ctx.stroke();
      T(ctx, 'Light', LX - 60, LY - 40, 19, 'yellow', 'center');
      // Pot and soil.
      ctx.fillStyle = '#9a3412'; ctx.strokeStyle = '#fdba74'; ctx.lineWidth = 2;
      poly(ctx, [236, 506, 364, 506, 350, 584, 250, 584], true); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#44291a'; ctx.fillRect(240, 500, 120, 10);
      // The shoot: two columns of cells along a bending spine.
      ctx.save(); ctx.globalAlpha *= clamp(fadeA);
      const N = 11; const W = 40; const L0 = 34;
      let x = 300; let y = 504; let th = -Math.PI / 2;
      const nodes = [[x, y, th]];
      const zone = (i) => Math.exp(-(((i - 7) / 2.4) ** 2));
      const lens = [];
      for (let i = 0; i < N; i++) {
        const ext = 0.3 * bend * zone(i) * mig;
        const lL = L0 * (1 + ext); const lR = L0;
        lens.push([lL, lR]);
        const dth = (lL - lR) / W;
        const thm = th + dth / 2; const L = (lL + lR) / 2;
        x += Math.cos(thm) * L; y += Math.sin(thm) * L; th += dth;
        nodes.push([x, y, th]);
      }
      const side = (n, s) => { const [px, py, a] = n; return [px + Math.sin(a) * (W / 2) * s, py - Math.cos(a) * (W / 2) * s]; };
      for (let i = 0; i < N; i++) {
        const a = nodes[i]; const c = nodes[i + 1];
        for (const s of [1, -1]) {
          const shady = s === 1; const p0 = side(a, s); const p1 = side(c, s);
          const auxL = shady ? lerp(0.25, 1, mig) : lerp(0.25, 0.05, mig);
          const zw = zone(i);
          ctx.fillStyle = shady ? mix('#34d399', '#a3e635', auxL * zw * 0.8, 0.32 + 0.2 * zw * auxL) : 'rgba(52,211,153,0.26)';
          ctx.strokeStyle = 'rgba(209,250,229,0.75)'; ctx.lineWidth = 1.5;
          poly(ctx, [a[0], a[1], p0[0], p0[1], p1[0], p1[1], c[0], c[1]], true); ctx.fill(); ctx.stroke();
          // Auxin dots inside the cell.
          const nd = Math.round(3 * auxL * (0.4 + zw));
          for (let j = 0; j < nd; j++) { const u = 0.25 + 0.5 * rnd(i * 7 + j + (s > 0 ? 0 : 50)); const v = 0.3 + 0.4 * rnd(i * 3 + j + 9); const ax = lerp(lerp(a[0], c[0], u), lerp(p0[0], p1[0], u), v); const ay = lerp(lerp(a[1], c[1], u), lerp(p0[1], p1[1], u), v); dot(ctx, ax, ay, 2.8, 'yellow'); }
        }
      }
      const tip = nodes[N];
      ctx.fillStyle = 'rgba(52,211,153,0.45)'; ctx.strokeStyle = 'rgba(209,250,229,0.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(tip[0], tip[1], W / 2, tip[2] - Math.PI / 2, tip[2] + Math.PI / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      soft(ctx, tip[0] + Math.cos(tip[2]) * 8, tip[1] + Math.sin(tip[2]) * 8, 30, 'yellow', 0.35 + 0.25 * Math.sin(k * 4));
      // Auxin moving across the tip towards the shady side.
      if (S.i === 1) for (let j = 0; j < 6; j++) { const q = mod(S.p * 2 + j / 6, 1); const from = side(nodes[N - 1], -0.8); const to = side(nodes[N - 4 + (j % 3)], 0.6); const px = lerp(from[0], to[0], q); const py = lerp(from[1], to[1], q); soft(ctx, px, py, 10, 'yellow', 0.8); dot(ctx, px, py, 3, '#fef08a'); }
      ctx.restore();
      // Labels on the left, leading to the shoot.
      const tipP = [tip[0], tip[1]]; const shade1 = side(nodes[N - 2], 0.5); const zoneP = side(nodes[7], 0.6);
      const L = [['Tip makes auxin', 132, tipP, 'yellow', 0], ['Auxin gathers on the shady side', 262, shade1, 'yellow', 1], ['Shady-side cells grow longer', 392, zoneP, LIME, 2]];
      L.forEach(([s, ly, P, c, i]) => {
        const on = S.i === i || (S.i === 3 && i === 2);
        ctx.save(); ctx.globalAlpha *= on ? 1 : 0.55;
        para(ctx, s, 30, ly, 170, 19, c, 700, 2, 'left');
        lead(ctx, 206, ly, P[0], P[1], c);
        ctx.restore();
      });
      ctx.save(); ctx.globalAlpha *= 0.9;
      dot(ctx, 470, 470, 5, 'yellow'); T(ctx, '= auxin (a plant hormone)', 484, 470, 18, 'ink', 'left', 500);
      ctx.restore();
      const CAP = [
        ['Light from one side', 'The shoot tip senses that the light is coming from the right.', 'yellow'],
        ['Auxin moves to the shady side', 'The tip makes a hormone called auxin, which gathers on the side away from the light.', 'yellow'],
        ['Shady-side cells grow longer', 'Auxin makes cells stretch, so the shady side grows faster than the lit side.', LIME],
        ['The shoot bends towards the light', 'More light for photosynthesis. Growing towards light is called phototropism.', 'green'],
      ];
      caption(ctx, CAP[S.i][0], CAP[S.i][1], CAP[S.i][2], S.s, S.i, 4);
      ctx.restore();
    },

    // Three ways of living together: clownfish and anemone (both gain),
    // barnacles on a whale (one gains, one unaffected), a tick on a dog (one
    // gains, one harmed).
    symbiosis(b, ctx, it, t) {
      const k = b.clock; const SP = 6;
      const c = cycle(t, SP * 3, 0.6); const sc = Math.floor(c / SP); const sp = (c - sc * SP) / SP;
      const sa = t < 1.2 ? 1 : smooth(sp / 0.08) * (1 - smooth((sp - 0.94) / 0.06));
      begin(ctx, t, it, 'Symbiosis: living together');
      const VX = 20; const VY = 60; const VW = 760; const VH = 380;
      ctx.save(); rounded(ctx, VX, VY, VW, VH, 18); ctx.clip();
      ctx.save(); ctx.globalAlpha *= sa;
      if (sc < 2) {
        const sea = ctx.createLinearGradient(0, VY, 0, VY + VH); sea.addColorStop(0, 'rgba(14,116,144,0.55)'); sea.addColorStop(1, 'rgba(8,47,73,0.75)');
        ctx.fillStyle = sea; ctx.fillRect(VX, VY, VW, VH);
        for (let i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(186,230,253,0.05)'; poly(ctx, [120 + i * 150 + 30 * Math.sin(k * 0.4 + i), VY, 170 + i * 150 + 30 * Math.sin(k * 0.4 + i), VY, 90 + i * 150, VY + VH, 40 + i * 150, VY + VH], true); ctx.fill(); }
        for (let i = 0; i < 16; i++) { const x = VX + rnd(i + 3) * VW; const y = VY + VH - mod(rnd(i) * VH + k * (20 + rnd(i + 1) * 20), VH); ctx.strokeStyle = 'rgba(224,242,254,0.4)'; ctx.lineWidth = 1.2; ell(ctx, x + 3 * Math.sin(k * 2 + i), y, 3 + rnd(i) * 3, 3 + rnd(i) * 3); ctx.stroke(); }
      } else {
        const gr = ctx.createLinearGradient(0, VY, 0, VY + VH); gr.addColorStop(0, 'rgba(56,189,248,0.16)'); gr.addColorStop(0.7, 'rgba(56,189,248,0.04)'); gr.addColorStop(0.7, 'rgba(101,163,13,0.3)'); gr.addColorStop(1, 'rgba(63,98,18,0.45)');
        ctx.fillStyle = gr; ctx.fillRect(VX, VY, VW, VH);
      }
      if (sc === 0) {
        // Anemone and clownfish.
        const AX = 400; const AY = 420;
        ctx.fillStyle = 'rgba(190,24,93,0.6)'; ell(ctx, AX, AY, 110, 26); ctx.fill();
        for (let i = 0; i < 46; i++) {
          const u = i / 45; const bx = AX - 100 + u * 200; const len = 120 + 50 * Math.sin(u * Math.PI) + rnd(i) * 30;
          const sw = 26 * Math.sin(k * 1.4 + i * 0.4); const ex = bx + (u - 0.5) * 120 + sw; const ey = AY - len;
          ctx.strokeStyle = i % 2 ? 'rgba(244,114,182,0.85)' : 'rgba(192,132,252,0.8)'; ctx.lineWidth = 7;
          ctx.beginPath(); ctx.moveTo(bx, AY - 6); ctx.quadraticCurveTo(bx + (u - 0.5) * 40 - sw * 0.4, AY - len * 0.55, ex, ey); ctx.stroke();
          soft(ctx, ex, ey, 12, PINK, 0.6); dot(ctx, ex, ey, 4, '#fbcfe8');
        }
        const fish = (x, y, dir, s) => {
          ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
          ctx.fillStyle = '#fb923c'; ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 2;
          poly(ctx, [-40, 0, -58, -16, -56, 16], true); ctx.fill(); ctx.stroke();
          ell(ctx, 0, 0, 44, 22); ctx.fill(); ctx.stroke();
          ctx.save(); ell(ctx, 0, 0, 44, 22); ctx.clip();
          for (const sx of [-24, 2, 26]) { ctx.fillStyle = '#ffffff'; ctx.fillRect(sx - 5, -24, 10, 48); ctx.strokeStyle = '#111827'; ctx.lineWidth = 2; ctx.strokeRect(sx - 5, -24, 10, 48); }
          ctx.restore();
          ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 2; ell(ctx, 0, 0, 44, 22); ctx.stroke();
          dot(ctx, 30, -6, 4.5, '#ffffff'); dot(ctx, 31, -6, 2.4, '#111827');
          ctx.restore();
        };
        const fx = AX + 150 * Math.sin(k * 0.7); const fy = 250 + 50 * Math.sin(k * 1.4); const fdir = Math.cos(k * 0.7) >= 0 ? 1 : -1;
        fish(fx, fy, fdir, 1.15);
        const f2x = AX - 60 + 70 * Math.sin(k * 0.9 + 2); const f2y = 340 + 25 * Math.sin(k * 1.8); fish(f2x, f2y, Math.cos(k * 0.9 + 2) >= 0 ? 1 : -1, 0.85);
      } else if (sc === 1) {
        // A humpback whale carrying barnacles.
        const wx = 400 + 40 * Math.sin(k * 0.3); const wy = 250 + 14 * Math.sin(k * 0.6);
        ctx.save(); ctx.translate(wx, wy);
        const gr = ctx.createLinearGradient(0, -80, 0, 80); gr.addColorStop(0, '#334155'); gr.addColorStop(1, '#1e293b');
        ctx.fillStyle = gr; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(-300, -10); ctx.bezierCurveTo(-250, -86, 60, -96, 200, -40); ctx.bezierCurveTo(260, -14, 290, 0, 320, -36);
        ctx.lineTo(352, -56 + 10 * Math.sin(k)); ctx.lineTo(338, -4); ctx.lineTo(356, 40 + 10 * Math.sin(k)); ctx.lineTo(318, 18);
        ctx.bezierCurveTo(280, 30, 240, 46, 160, 56); ctx.bezierCurveTo(20, 76, -220, 84, -300, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(203,213,225,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 6; i++) { ctx.moveTo(-280 + i * 14, 22 + i * 4); ctx.bezierCurveTo(-200, 50 + i * 4, -60, 60 + i * 2, 40, 58 + i); } ctx.stroke();
        ctx.fillStyle = '#334155'; ctx.strokeStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(-150, 40); ctx.bezierCurveTo(-120, 120 + 10 * Math.sin(k * 0.8), -40, 160 + 10 * Math.sin(k * 0.8), -20, 150); ctx.bezierCurveTo(-60, 110, -90, 70, -110, 46); ctx.closePath(); ctx.fill(); ctx.stroke();
        dot(ctx, -220, -18, 5, '#e2e8f0');
        const BAR = [[-288, 4], [-276, 16], [-262, 26], [-250, 30], [-232, 38], [-270, -24], [-256, -34], [-80, 128], [-62, 140], [-44, 146], [-98, 110]];
        for (const [bx0, by0] of BAR) { ctx.fillStyle = '#e5e7eb'; ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1.2; poly(ctx, [bx0 - 7, by0 + 5, bx0 + 7, by0 + 5, bx0 + 3, by0 - 6, bx0 - 3, by0 - 6], true); ctx.fill(); ctx.stroke(); dot(ctx, bx0, by0 - 5, 2, '#475569'); }
        ctx.restore();
        // A magnified barnacle combing food from the water.
        const IX = 690; const IY = 360;
        ctx.fillStyle = 'rgba(5,8,22,0.75)'; ctx.strokeStyle = tint('cyan', 0.7); ctx.lineWidth = 2; ell(ctx, IX, IY, 60, 60); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e5e7eb'; ctx.strokeStyle = '#94a3b8'; poly(ctx, [IX - 34, IY + 34, IX + 34, IY + 34, IX + 16, IY - 6, IX - 16, IY - 6], true); ctx.fill(); ctx.stroke();
        const ext = Math.max(0, Math.sin(k * 3));
        ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i < 5; i++) { const an = -Math.PI / 2 + (i - 2) * 0.35; ctx.moveTo(IX, IY - 6); ctx.quadraticCurveTo(IX + Math.cos(an) * 20, IY - 6 + Math.sin(an) * 30 * ext, IX + Math.cos(an + 0.4) * 30 * ext, IY - 6 + Math.sin(an + 0.4) * 40 * ext); }
        ctx.stroke();
        T(ctx, 'feeding', IX, IY + 48, 18, 'muted', 'center', 600);
      } else {
        // A dog with a tick, and the tick magnified.
        const DX = 262; const DY = 330;
        ctx.save(); ctx.translate(DX, DY);
        ctx.fillStyle = '#b45309'; ctx.strokeStyle = '#fcd34d'; ctx.lineWidth = 2;
        const wag = Math.sin(k * 6) * 0.5;
        ctx.save(); ctx.translate(-120, -30); ctx.rotate(-0.9 + wag); ctx.beginPath(); ctx.roundRect(-6, -60, 12, 60, 6); ctx.fill(); ctx.stroke(); ctx.restore();
        for (const lx of [-100, -66, 70, 104]) { ctx.beginPath(); ctx.roundRect(lx - 9, 10, 18, 76, 8); ctx.fill(); ctx.stroke(); }
        ell(ctx, 0, 0, 140, 56); ctx.fill(); ctx.stroke();
        ell(ctx, 150, -62, 46, 40); ctx.fill(); ctx.stroke();
        ell(ctx, 192, -50, 30, 20); ctx.fill(); ctx.stroke();
        dot(ctx, 218, -56, 7, '#111827');
        ctx.fillStyle = '#78350f'; ell(ctx, 128, -84, 18, 34, 0.5); ctx.fill(); ctx.stroke();
        dot(ctx, 166, -72, 5, '#111827'); dot(ctx, 168, -74, 1.6, '#ffffff');
        ctx.restore();
        const tkx = DX + 106; const tky = DY - 40;
        dot(ctx, tkx, tky, 6, '#1f2937'); ctx.strokeStyle = 'rgba(248,113,113,0.9)'; ctx.lineWidth = 2; ell(ctx, tkx, tky, 13, 13); ctx.stroke();
        // Inset.
        const IX = 664; const IY = 176;
        line(ctx, tkx + 12, tky - 8, IX - 70, IY + 36, tint('red', 0.6), 1.5);
        ctx.fillStyle = 'rgba(5,8,22,0.8)'; ctx.strokeStyle = tint('red', 0.7); ctx.lineWidth = 2; ell(ctx, IX, IY, 84, 84); ctx.fill(); ctx.stroke();
        ctx.save(); ell(ctx, IX, IY, 83, 83); ctx.clip();
        ctx.fillStyle = 'rgba(180,83,9,0.5)'; ctx.fillRect(IX - 90, IY + 30, 180, 60);
        ctx.strokeStyle = 'rgba(252,211,77,0.5)'; ctx.lineWidth = 2; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(IX - 80 + i * 20, IY + 30); ctx.lineTo(IX - 74 + i * 20, IY + 10); ctx.stroke(); }
        const fill = 0.5 + 0.5 * Math.sin(k * 0.8);
        ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 3; ctx.beginPath(); for (const sd of [-1, 1]) for (let j = 0; j < 4; j++) { ctx.moveTo(IX + sd * 12, IY - 4 + j * 8); ctx.lineTo(IX + sd * (34 + fill * 8), IY - 14 + j * 12); } ctx.stroke();
        ctx.fillStyle = mix('#57534e', '#7f1d1d', fill); ctx.strokeStyle = '#a8a29e'; ctx.lineWidth = 2; ell(ctx, IX, IY - 6, 22 + fill * 14, 26 + fill * 16); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#292524'; ell(ctx, IX, IY + 26, 10, 9); ctx.fill();
        ctx.restore();
        T(ctx, 'tick drinking blood', IX, IY + 104, 18, 'red', 'center', 600);
      }
      // Who gains and who loses.
      const WHO = [[['Clownfish  +', 'safe among stinging tentacles', 'orange'], ['Anemone  +', 'cleaned, fed scraps, guarded', PINK]],
        [['Barnacles  +', 'a free ride to food-rich water', '#e5e7eb'], ['Whale  0', 'not helped or harmed', 'cyan']],
        [['Tick  +', 'a meal of blood', 'red'], ['Dog  −', 'loses blood, may catch a disease', 'yellow']]][sc];
      T(ctx, WHO[0][0], 40, 92, 22, WHO[0][2], 'left', 800); T(ctx, WHO[0][1], 40, 118, 18, 'ink', 'left', 500);
      if (sc !== 2) { T(ctx, WHO[1][0], 760, 92, 22, WHO[1][2], 'right', 800); T(ctx, WHO[1][1], 760, 118, 18, 'ink', 'right', 500); }
      else { T(ctx, WHO[1][0], 40, 410, 22, WHO[1][2], 'left', 800); T(ctx, WHO[1][1], 40, 432, 18, 'ink', 'left', 500); }
      ctx.restore();
      ctx.restore();
      ctx.strokeStyle = tint('muted', 0.4); ctx.lineWidth = 1.5; rounded(ctx, VX, VY, VW, VH, 18); ctx.stroke();
      // Cards.
      const CARDS = [['Mutualism', '+  +', 'both benefit', 'green'], ['Commensalism', '+  0', 'one gains, other unaffected', 'cyan'], ['Parasitism', '+  −', 'one gains, other is harmed', 'red']];
      CARDS.forEach(([nm, sg, d, cc], i) => {
        const x = 20 + i * 258; const on = i === sc;
        if (on) soft(ctx, x + 122, 520, 150, cc, 0.14);
        panel(ctx, x, 452, 244, 134, cc, on ? 0.18 : 0.04, 16);
        ctx.save(); ctx.globalAlpha *= on ? 1 : 0.55;
        T(ctx, nm, x + 122, 478, 21, cc); T(ctx, sg, x + 122, 516, 30, 'ink', 'center', 800); para(ctx, d, x + 12, 558, 220, 18, 'ink', 500, 2);
        ctx.restore();
      });
      const CAP = [
        ['Mutualism: clownfish and sea anemone', "The anemone's stings protect the clownfish; the fish chases off anemone-eating fish."],
        ['Commensalism: barnacles on a whale', 'Barnacles get carried to food-rich water; the whale is barely affected.'],
        ['Parasitism: a tick on a dog', 'The tick feeds on the dog’s blood and can pass on diseases such as Lyme disease.'],
      ];
      caption(ctx, CAP[sc][0], CAP[sc][1], CARDS[sc][3], sp * SP, sc, 3);
      ctx.restore();
    },

    // ─── Biotechnology ───────────────────────────────────────────────────

    // Cas9 carries a guide RNA along the DNA, finds the matching target next
    // to a PAM, cuts both strands, and a new piece of DNA is repaired in.
    crispr(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [3.4, 2.8, 2.0, 2.8, 3.0, 2.6], 0.6);
      begin(ctx, t, it, 'CRISPR gene editing');
      motes(ctx, k, 30, 'purple', [20, 60, 760, 520], 29, 2, 0.25);
      const TY = 334; const BY = 394; const CUT = 450; const STEP = 30;
      const TGT = 'GACTTCAG'; const PAM = 'AGG';
      const COMP = { A: 'T', T: 'A', G: 'C', C: 'G' };
      const BC = { A: 'green', T: 'red', U: 'red', G: 'yellow', C: 'cyan' };
      const casX = S.i === 0 ? lerp(212, CUT + 30, smooth(S.p / 0.9)) : CUT + 30;
      const unzip = S.i === 1 ? smooth(win(S.p, 0.2, 0.8)) : S.i === 2 ? 1 : S.i === 3 ? 1 - smooth(win(S.p, 0.1, 0.6)) : 0;
      const cut = S.i >= 2 ? 1 : 0;
      const sep = S.i === 3 ? smooth(win(S.p, 0, 0.5)) * 36 : S.i >= 4 ? 36 : 0;
      const casA = S.i <= 2 ? after(t, 0.4, 0.6) : S.i === 3 ? 1 - smooth(win(S.p, 0.2, 0.7)) : 0;
      const casY = S.i === 3 ? -smooth(win(S.p, 0.2, 0.7)) * 90 : 0;
      const newIn = S.i === 3 ? smooth(win(S.p, 0.45, 1)) : S.i >= 4 ? 1 : 0;
      const edited = S.i === 4 ? smooth(win(S.p, 0.3, 0.9)) : S.i === 5 ? 1 : 0;
      // Region of the target bases: indices of rungs.
      const x0 = CUT - 4.5 * STEP; // first target base: Cas9 cuts 3 bases before the PAM
      const lift = (x) => (x > x0 - 20 && x < x0 + 8 * STEP + 10 ? unzip * 64 * smooth(win(x, x0 - 24, x0 + 6)) * (1 - smooth(win(x, x0 + 8 * STEP - 6, x0 + 8 * STEP + 20))) : 0);
      const wob = (x, ph) => 7 * Math.sin(x * 0.028 + k * 0.8 + ph);
      const xs = (x) => x + (x < CUT ? -sep : sep);
      const baseAt = (i) => { const idx = Math.round((i - x0) / STEP); if (idx >= 0 && idx < 8) return TGT[idx]; if (idx >= 8 && idx < 11) return PAM[idx - 8]; return 'ACGTTGCA'[mod(idx, 8)]; };
      // Backbones (two halves when cut).
      const strand = (y0, ph, isTop, c) => {
        const segs = cut ? [[-20, CUT - 8], [CUT + 8, 820]] : [[-20, 820]];
        for (const [a, bb] of segs) {
          ctx.strokeStyle = c; ctx.lineWidth = 8; ctx.beginPath();
          for (let x = a; x <= bb; x += 6) { const y = y0 + wob(x, ph) - (isTop ? lift(x) : 0); const X = xs(x); if (x === a) ctx.moveTo(X, y); else ctx.lineTo(X, y); }
          ctx.stroke();
        }
      };
      // Rungs and letters.
      ctx.save(); ctx.globalAlpha *= S.i === 5 ? 1 - win(S.p, 0.82, 1) : 1;
      ctx.save(); ctx.beginPath(); ctx.rect(20, 56, 760, 540); ctx.clip();
      for (let i = x0 - 14 * STEP; i <= 820; i += STEP) {
        const bse = baseAt(i); const cmp = COMP[bse]; const yT = TY + wob(i, 0) - lift(i); const yB = BY + wob(i, 1.2);
        const X = xs(i); const open = lift(i) > 10;
        ctx.lineWidth = 7;
        if (!open) {
          ctx.strokeStyle = tint(BC[bse], 0.7); ctx.beginPath(); ctx.moveTo(X, yT + 4); ctx.lineTo(X, (yT + yB) / 2); ctx.stroke();
          ctx.strokeStyle = tint(BC[cmp], 0.7); ctx.beginPath(); ctx.moveTo(X, (yT + yB) / 2); ctx.lineTo(X, yB - 4); ctx.stroke();
        } else {
          ctx.strokeStyle = tint(BC[bse], 0.7); ctx.beginPath(); ctx.moveTo(X, yT + 4); ctx.lineTo(X, yT + 18); ctx.stroke();
          ctx.strokeStyle = tint(BC[cmp], 0.7); ctx.beginPath(); ctx.moveTo(X, yB - 4); ctx.lineTo(X, yB - 18); ctx.stroke();
        }
        const inWin = i >= x0 && i < x0 + 11 * STEP;
        if (inWin && (S.i >= 1 || casX > x0)) { ctx.fillStyle = 'rgba(5,8,22,0.8)'; ell(ctx, X, BY + 36, 12, 12); ctx.fill(); T(ctx, cmp, X, BY + 37, 18, BC[cmp], 'center', 800); }
      }
      strand(TY, 0, true, '#93c5fd'); strand(BY, 1.2, false, '#c4b5fd');
      ctx.restore();
      // PAM and target marks.
      if (S.i >= 1 || casX > x0) {
        ctx.save(); ctx.globalAlpha *= S.i >= 1 ? 1 : 0.6;
        const pamX = xs(x0 + 9 * STEP);
        T(ctx, 'PAM', pamX, BY + 72, 18, 'orange', 'center', 800);
        line(ctx, xs(x0) - 10, BY + 54, xs(x0 + 7 * STEP) + 10, BY + 54, tint('yellow', 0.7), 2);
        T(ctx, 'target', (xs(x0) + xs(x0 + 7 * STEP)) / 2, BY + 72, 18, 'yellow', 'center', 700);
        ctx.restore();
      }
      // Cas9 with its guide RNA.
      if (casA > 0) {
        ctx.save(); ctx.globalAlpha *= casA; ctx.translate(0, casY);
        soft(ctx, casX - 30, 352, 150, 'purple', 0.28);
        ctx.fillStyle = 'rgba(167,139,250,0.22)'; ctx.strokeStyle = 'rgba(221,214,254,0.9)'; ctx.lineWidth = 2.5;
        blob(ctx, casX - 28, 352, 162, k, 3, 0.05, 48, 0.68); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(196,181,253,0.12)'; blob(ctx, casX - 40, 318, 70, k * 1.2, 6, 0.08, 30, 0.7); ctx.fill();
        // Guide RNA: scaffold loop on top, spacer pairing with the target.
        ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 5; ctx.beginPath();
        ctx.moveTo(casX + 90, 300); ctx.bezierCurveTo(casX + 130, 260, casX + 60, 236, casX + 30, 270); ctx.bezierCurveTo(casX + 10, 290, casX + 60, 300, casX + 96, 300); ctx.stroke();
        const gy = S.i >= 1 ? lerp(300, BY - 32, unzip) : 300;
        const gOff = casX - CUT - 30; ctx.beginPath(); ctx.moveTo(casX + 96, 300); ctx.quadraticCurveTo(casX + 120, gy, xs(x0 + 7 * STEP) + 14 + gOff, gy); ctx.lineTo(xs(x0) - 14 + gOff, gy); ctx.stroke();
        for (let j = 0; j < 8; j++) {
          const X = xs(x0 + j * STEP) + (casX - CUT - 30); const r = TGT[j] === 'T' ? 'U' : TGT[j];
          if (unzip > 0.6) { ctx.strokeStyle = tint(BC[r], 0.7); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(X, gy + 4); ctx.lineTo(X, BY - 18); ctx.stroke(); }
          ctx.fillStyle = 'rgba(5,8,22,0.85)'; ell(ctx, X, gy - 18, 11, 11); ctx.fill();
          T(ctx, r, X, gy - 17, 18, BC[r], 'center', 800);
        }
        ctx.restore();
        ctx.save(); ctx.globalAlpha *= casA;
        chip(ctx, 'Cas9 protein', casX - 110, 196 + casY, 'purple', 19);
        T(ctx, 'guide RNA', casX + 124, 224 + casY, 19, 'orange', 'left'); lead(ctx, casX + 120, 234 + casY, casX + 98, 262 + casY, 'orange');
        ctx.restore();
      }
      // The cut.
      if (S.i === 2) {
        const fl = Math.sin(Math.PI * clamp(S.p / 0.6));
        soft(ctx, CUT, 360, 90, 'yellow', 0.7 * fl);
        ctx.strokeStyle = tint('yellow', 0.9 * fl); ctx.lineWidth = 3; ctx.beginPath();
        for (let i = 0; i < 10; i++) { const an = (i / 10) * TAU + k; ctx.moveTo(CUT + Math.cos(an) * 20, 360 + Math.sin(an) * 20); ctx.lineTo(CUT + Math.cos(an) * (36 + 20 * fl), 360 + Math.sin(an) * (36 + 20 * fl)); }
        ctx.stroke();
        chip(ctx, 'Snip! Both strands cut', CUT, 496, 'yellow', 19);
      }
      // New DNA piece.
      if (newIn > 0) {
        const ny = lerp(150, 0, newIn) * (S.i === 3 ? 1 : 0);
        ctx.save(); ctx.globalAlpha *= S.i === 3 ? win(S.p, 0.45, 0.6) : 1;
        if (edited > 0) soft(ctx, CUT, 364, 120, 'green', 0.4 * edited);
        for (const [y0, ph] of [[TY, 0], [BY, 1.2]]) {
          ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 8; ctx.beginPath();
          for (let x = CUT - 44; x <= CUT + 44; x += 4) { const y = y0 + wob(x, ph) - ny; if (x === CUT - 44) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
          ctx.stroke();
        }
        for (const [dx, ch] of [[-15, 'T'], [15, 'A']]) {
          ctx.strokeStyle = 'rgba(74,222,128,0.8)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(CUT + dx, TY + wob(CUT + dx, 0) - ny + 4); ctx.lineTo(CUT + dx, BY + wob(CUT + dx, 1.2) - ny - 4); ctx.stroke();
          if (S.i >= 4) { ctx.fillStyle = 'rgba(5,8,22,0.85)'; ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 1.5; ell(ctx, CUT + dx, BY + 36, 12, 12); ctx.fill(); ctx.stroke(); T(ctx, ch, CUT + dx, BY + 37, 18, 'green', 'center', 800); }
        }
        if (S.i === 3) T(ctx, 'New DNA', CUT, TY - 40 - ny, 19, 'green');
        ctx.restore();
      }
      if (S.i >= 4 && edited > 0.5) { ctx.save(); ctx.globalAlpha *= win(edited, 0.5, 1); chip(ctx, 'Gene edited', CUT, 250, 'green', 21); ctx.restore(); }
      T(ctx, 'DNA', 760, 300, 19, 'blue', 'right');
      ctx.restore();
      const CAP = [
        ['Cas9 searches the DNA', 'A guide RNA, built to match one gene, rides inside the Cas9 protein as it scans.', 'purple'],
        ['A match!', 'Next to a short PAM signal, the DNA unzips and the guide RNA pairs with its target.', 'orange'],
        ['Snip', 'Cas9 cuts both strands of the DNA at exactly that spot.', 'yellow'],
        ['The cell repairs the cut', 'Scientists can supply a new piece of DNA carrying the change they want.', 'green'],
        ['The new piece is stitched in', "The cell's own repair enzymes join it into the gene: the DNA is edited.", 'green'],
        ['Gene edited', 'Used in research, and in approved treatments for sickle cell disease.', 'green'],
      ];
      caption(ctx, CAP[S.i][0], CAP[S.i][1], CAP[S.i][2], S.s, S.i, 6);
      ctx.restore();
    },

    // ─── Human story ─────────────────────────────────────────────────────

    // Seven million years of hominins on a timeline, a walker standing
    // taller as time passes, then Homo sapiens spreading out of Africa.
    'human-evolution-timeline'(b, ctx, it, t) {
      const k = b.clock; const P = 21; const SW = 12;
      const c = cycle(t, P, 0.6); const mya = c < SW ? 7 * (1 - c / SW) : 0; const mapQ = c < SW ? 0 : clamp((c - SW) / 6);
      begin(ctx, t, it, 'Human evolution');
      const X = (m) => 210 + ((7 - m) / 7) * 556;
      const SPP = [['Sahelanthropus', 7.0, 6.6, 'muted'], ['Ardipithecus', 5.8, 4.4, 'teal'], ['Australopithecus', 4.2, 1.9, 'green'], ['Homo habilis', 2.4, 1.4, 'yellow'], ['Homo erectus', 1.9, 0.11, 'orange'], ['Neanderthals', 0.4, 0.04, 'purple'], ['Homo sapiens', 0.3, 0, PINK]];
      const RY = (i) => 104 + i * 34;
      // Grid and axis.
      ctx.strokeStyle = 'rgba(140,170,255,0.12)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let m = 0; m <= 7; m++) { ctx.moveTo(X(m), 88); ctx.lineTo(X(m), 330); }
      ctx.stroke();
      line(ctx, 210, 330, 770, 330, 'rgba(200,215,255,0.6)', 2);
      for (let m = 7; m >= 0; m--) T(ctx, m === 0 ? 'today' : String(m), X(m), 348, 18, 'muted', 'center', 500);
      T(ctx, 'million years ago', 24, 348, 18, 'muted', 'left', 600);
      // Species bars, growing as the cursor passes.
      SPP.forEach(([nm, a, z, col], i) => {
        const y = RY(i); const on = mya <= a;
        T(ctx, nm, 24, y, 18, on ? col : 'rgba(147,160,196,0.5)', 'left', 700);
        if (!on) return;
        const end = Math.max(z, mya); const x0 = X(a); const x1 = Math.max(X(end), x0 + 6);
        ctx.fillStyle = tint(col, 0.25); ctx.strokeStyle = color(col); ctx.lineWidth = 2; rounded(ctx, x0, y - 10, x1 - x0, 20, 10); ctx.fill(); ctx.stroke();
        if (end === mya && mya > z) soft(ctx, x1, y, 18, col, 0.7);
      });
      // Cursor.
      if (c < SW + 0.4) {
        const cx = X(mya);
        line(ctx, cx, 86, cx, 330, tint('yellow', 0.8), 2);
        const txt = mya >= 1 ? `${mya.toFixed(1)} million years ago` : mya > 0.01 ? `${Math.round(mya * 1000)},000 years ago` : 'today';
        chip(ctx, txt, clamp(cx, 160, 650), 68, 'yellow', 18);
      }
      // A walker who stands taller as time goes on.
      const up = smooth((7 - mya) / 3.6); const tall = smooth((4.2 - mya) / 2.6); const brain = mya > 3 ? lerp(360, 450, (7 - mya) / 4) : mya > 2 ? lerp(450, 610, 3 - mya) : mya > 1.5 ? lerp(610, 900, (2 - mya) / 0.5) : mya > 0.3 ? lerp(900, 1350, (1.5 - mya) / 1.2) : 1350;
      panel(ctx, 20, 372, 372, 214, 'teal', 0.05, 16);
      const WX = 130; const WY = 562; const Hh = lerp(112, 160, tall); const lean = lerp(0.85, 0.04, up);
      const g = k * 5; const swing = Math.sin(g);
      ctx.strokeStyle = 'rgba(226,232,240,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(36, WY); ctx.lineTo(376, WY); ctx.stroke();
      {
        const hip = [WX, WY - Hh * 0.47]; const legL = Hh * 0.47;
        const sh = [hip[0] + Math.sin(lean) * Hh * 0.33, hip[1] - Math.cos(lean) * Hh * 0.33];
        const hr = lerp(9, 13, smooth((3 - mya) / 3)) * (Hh / 150);
        const head = [sh[0] + Math.sin(lean * 1.1) * hr * 1.8, sh[1] - Math.cos(lean) * hr * 1.6];
        const armL = lerp(Hh * 0.5, Hh * 0.38, up);
        ctx.strokeStyle = 'rgba(45,212,191,0.9)'; ctx.lineCap = 'round';
        for (const sd of [1, -1]) {
          const a = sd * swing * 0.45; const knee = [hip[0] + Math.sin(a) * legL * 0.5, hip[1] + Math.cos(a) * legL * 0.5];
          const foot = [knee[0] + Math.sin(a - Math.max(0, -sd * swing) * 0.4) * legL * 0.5, WY];
          ctx.globalAlpha = sd > 0 ? 1 : 0.55; ctx.lineWidth = Hh * 0.075; poly(ctx, [hip[0], hip[1], knee[0], knee[1], foot[0], foot[1]]); ctx.stroke();
          const aa = -sd * swing * 0.5 + lean * 0.6; const hand = [sh[0] + Math.sin(aa) * armL, sh[1] + Math.cos(aa) * armL];
          ctx.lineWidth = Hh * 0.05; poly(ctx, [sh[0], sh[1], (sh[0] + hand[0]) / 2 + 3, (sh[1] + hand[1]) / 2, hand[0], Math.min(hand[1], WY - 2)]); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.lineWidth = Hh * 0.13; ctx.beginPath(); ctx.moveTo(hip[0], hip[1]); ctx.lineTo(sh[0], sh[1]); ctx.stroke();
        ctx.fillStyle = 'rgba(45,212,191,0.35)'; ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 2.5; ell(ctx, head[0], head[1], hr * 1.1, hr); ctx.fill(); ctx.stroke();
        soft(ctx, head[0], head[1] - hr * 0.2, hr * 2.4, 'purple', 0.3 * (brain / 1350));
      }
      T(ctx, 'Brain size', 250, 404, 18, 'muted', 'left', 600);
      T(ctx, `about ${Math.round(brain / 10) * 10} cm³`, 250, 428, 19, 'purple', 'left', 800);
      T(ctx, 'Posture', 250, 466, 18, 'muted', 'left', 600);
      T(ctx, up < 0.35 ? 'partly upright' : up < 0.8 ? 'walking upright' : 'fully upright', 250, 490, 19, 'teal', 'left', 800);
      T(ctx, 'Height', 250, 528, 18, 'muted', 'left', 600);
      T(ctx, `about ${lerp(1.1, 1.7, tall).toFixed(1)} m`, 250, 552, 19, 'cyan', 'left', 800);
      // The world map: Homo sapiens spreads out of Africa.
      panel(ctx, 404, 372, 376, 214, 'blue', 0.05, 16);
      const MX0 = 410; const MW = 364; const MY0 = 380; const MH = 200;
      const pr = (lon, lat) => [MX0 + ((lon + 20) / 360) * MW, MY0 + ((78 - lat) / 136) * MH];
      const LAND = [
        [[-17, 21], [-10, 35], [10, 37], [32, 31], [43, 12], [51, 12], [40, -5], [40, -15], [35, -25], [20, -35], [15, -28], [12, -5], [9, 4], [-8, 5], [-17, 14]],
        [[-10, 36], [-9, 44], [-2, 48], [-5, 58], [10, 60], [25, 71], [60, 70], [100, 76], [140, 72], [180, 68], [190, 66], [170, 60], [140, 52], [130, 40], [122, 30], [110, 20], [105, 10], [98, 15], [90, 22], [80, 10], [72, 20], [60, 25], [50, 30], [36, 36], [28, 40], [20, 40], [10, 44], [3, 43]],
        [[114, -22], [122, -18], [131, -12], [137, -12], [142, -11], [146, -19], [153, -28], [150, -37], [140, -38], [132, -32], [118, -35], [114, -27]],
        [[195, 65], [220, 70], [260, 72], [280, 70], [300, 55], [285, 45], [280, 30], [265, 28], [263, 20], [270, 15], [277, 9], [255, 22], [245, 32], [235, 45], [225, 58], [205, 58]],
        [[280, 9], [300, 10], [310, 0], [325, -7], [320, -22], [302, -38], [292, -55], [285, -50], [288, -30], [280, -5]],
      ];
      LAND.forEach((pts, i) => {
        ctx.fillStyle = i === 0 ? mix('#2dd4bf', '#f472b6', mapQ > 0 ? 1 : mya < 0.3 ? 0.6 : 0, 0.35) : 'rgba(148,163,184,0.18)';
        ctx.strokeStyle = i === 0 ? 'rgba(244,114,182,0.7)' : 'rgba(148,163,184,0.45)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); pts.forEach(([lo, la], j) => { const [x, y] = pr(lo, la); if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      const AF = pr(36, 2);
      if (mya < 0.3 || mapQ > 0) { soft(ctx, AF[0], AF[1], 26 + 4 * Math.sin(k * 3), PINK, 0.7); dot(ctx, AF[0], AF[1], 4, WHITE); }
      const ROUTES = [[[36, 2], [44, 28], [30, 42], [12, 50]], [[36, 2], [48, 24], [75, 22], [105, 14], [125, -8], [135, -24]], [[36, 2], [48, 24], [85, 35], [120, 45], [165, 62], [200, 62], [245, 45], [275, 20], [295, -15]]];
      const LBL = [['45,000', 12, 50, 'left'], ['50,000', 135, -24, 'right'], ['15,000+', 295, -15, 'right']];
      if (mapQ > 0) {
        ROUTES.forEach((rt, i) => {
          const pts = []; rt.forEach(([lo, la]) => pts.push(...pr(lo, la)));
          const path = mkPath(pts); const q = smooth(win(mapQ, i * 0.12, 0.45 + i * 0.2));
          if (q <= 0) return;
          ctx.strokeStyle = tint(PINK, 0.9); ctx.lineWidth = 3; ctx.setLineDash([7, 6]); ctx.lineDashOffset = -k * 20; strokeSpan(ctx, path, 0, q * path.total); ctx.setLineDash([]); ctx.lineDashOffset = 0;
          const A = at(path, q * path.total); soft(ctx, A.x, A.y, 14, PINK, 0.8); dot(ctx, A.x, A.y, 3.5, WHITE);
          if (q > 0.98) { const [, lo, la, al] = LBL[i]; const [x, y] = pr(lo, la); T(ctx, LBL[i][0], i === 0 ? x + 8 : x - 8, y + (i === 0 ? -12 : 4), 18, 'ink', al, 700); }
        });
      }
      T(ctx, mapQ > 0 ? 'Out of Africa (years ago)' : 'Africa: where it all began', 592, 388, 18, mapQ > 0 ? PINK : 'muted', 'center', 700);
      // Captions follow the story.
      let cap;
      if (mapQ > 0.75) cap = ['A bush, not a ladder', 'Many kinds of human lived at the same time. Only Homo sapiens survives today.', 'teal'];
      else if (mapQ > 0) cap = ['Out of Africa', 'From about 60,000 years ago, modern humans spread across the whole world.', PINK];
      else if (mya > 5.5) cap = ['About 7 million years ago', 'Our line split from the line leading to chimpanzees. The first hominins lived in Africa.', 'muted'];
      else if (mya > 3.8) cap = ['Ardipithecus: partly upright', 'About 4.4 million years ago: it could climb trees and walk on two legs.', 'teal'];
      else if (mya > 2.5) cap = ['Australopithecus walked upright', '"Lucy" lived 3.2 million years ago; fossil footprints show upright walking.', 'green'];
      else if (mya > 1.9) cap = ['Homo habilis: stone tools', 'Bigger brains, and simple stone tools for cutting meat and cracking bones.', 'yellow'];
      else if (mya > 0.35) cap = ['Homo erectus: tall, and used fire', 'The first hominin known to spread out of Africa, about 2 million years ago.', 'orange'];
      else cap = ['Homo sapiens appears', 'Our species evolved in Africa about 300,000 years ago, alongside Neanderthals.', PINK];
      caption(ctx, cap[0], cap[1], cap[2], 1, -1, 0);
      ctx.restore();
    },

    // ─── Microbes and us ─────────────────────────────────────────────────

    // Inside the gut: trillions of microbes drifting, and the four big jobs
    // they do for us, one at a time.
    microbiome(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [3.8, 3.8, 3.8, 3.8], 0.6);
      begin(ctx, t, it, 'The gut microbiome');
      // A person with the gut glowing.
      person(ctx, 100, 286, 208, 'cyan', 0.12, 2.5);
      ctx.strokeStyle = tint('orange', 0.85); ctx.lineWidth = 5; ctx.beginPath();
      for (let q = 0; q <= 60; q++) { const an = q * 0.42; const rr = 6 + q * 0.32; const x = 100 + Math.cos(an) * rr * 1.2; const y = 176 + Math.sin(an) * rr * 0.8; if (q) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke(); soft(ctx, 100, 176, 44, 'orange', 0.45 + 0.15 * Math.sin(k * 2));
      ctx.strokeStyle = tint('orange', 0.35); ctx.lineWidth = 1.5; ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.moveTo(124, 162); ctx.lineTo(196, 70); ctx.moveTo(124, 190); ctx.lineTo(196, 418); ctx.stroke(); ctx.setLineDash([]);
      T(ctx, '38 trillion', 100, 318, 24, 'yellow', 'center', 800);
      para(ctx, 'gut bacteria: about as many as your own body cells', 22, 382, 156, 18, 'ink', 500, 4);
      // Inside the intestine.
      const BX = 196; const BY0 = 66; const BW = 584; const BH = 354;
      ctx.save(); rounded(ctx, BX, BY0, BW, BH, 18); ctx.clip();
      ctx.fillStyle = 'rgba(12,6,24,0.75)'; ctx.fillRect(BX, BY0, BW, BH);
      const wall = (y0, dir) => {
        const gr = ctx.createLinearGradient(0, y0, 0, y0 + dir * 50); gr.addColorStop(0, 'rgba(244,114,182,0.55)'); gr.addColorStop(1, 'rgba(190,24,93,0.25)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(BX, y0 - dir * 40);
        for (let x = BX; x <= BX + BW; x += 8) ctx.lineTo(x, y0 + dir * (34 + 10 * Math.sin(x * 0.05 + k * 0.6) + 6 * Math.sin(x * 0.13)));
        ctx.lineTo(BX + BW, y0 - dir * 40); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(251,207,232,0.7)'; ctx.lineWidth = 2; ctx.beginPath();
        for (let x = BX; x <= BX + BW; x += 8) { const y = y0 + dir * (34 + 10 * Math.sin(x * 0.05 + k * 0.6) + 6 * Math.sin(x * 0.13)); if (x === BX) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.stroke();
      };
      wall(BY0 + 8, 1); wall(BY0 + BH - 8, -1);
      // Immune cells waiting under the lower wall.
      for (let i = 0; i < 6; i++) { const x = BX + 50 + i * 96; const y = BY0 + BH - 22; const on = S.i === 3; soft(ctx, x, y, 26, 'purple', on ? 0.6 + 0.3 * Math.sin(k * 4 + i) : 0.2); ctx.fillStyle = 'rgba(167,139,250,0.55)'; ctx.strokeStyle = '#ddd6fe'; ctx.lineWidth = 1.5; ell(ctx, x, y, 13, 13); ctx.fill(); ctx.stroke(); dot(ctx, x + 2, y - 1, 6, 'rgba(76,29,149,0.8)'); }
      // Fibre strands drifting through.
      const fib = S.i === 0 ? S.p : 0;
      for (let i = 0; i < 5; i++) {
        const x = BX + mod(i * 130 + k * 22, BW + 100) - 50; const y = BY0 + 120 + i * 40 % 160;
        const pieces = S.i === 0 ? 1 + Math.floor(fib * 4) : 1;
        for (let j = 0; j < pieces; j++) {
          const gap = (j - (pieces - 1) / 2) * 16 * fib; ctx.strokeStyle = 'rgba(132,204,22,0.75)'; ctx.lineWidth = 4; ctx.beginPath();
          for (let q = 0; q <= 8; q++) { const u = (j + q / 8) / pieces; const px = x - 40 + u * 80 + gap; const py = y + 8 * Math.sin(u * 8 + i); if (q) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
          ctx.stroke();
        }
      }
      // The microbes.
      const COLS = ['cyan', 'green', 'purple', 'yellow', 'teal', 'blue'];
      const germX = S.i === 2 ? BX + lerp(-30, 160, smooth(win(S.p, 0, 0.45))) - lerp(0, 150, smooth(win(S.p, 0.55, 1))) : -99;
      for (let i = 0; i < 46; i++) {
        let x = BX + mod(rnd(i) * BW + k * (14 + rnd(i + 1) * 16), BW + 40) - 20; let y = BY0 + 110 + rnd(i + 2) * 150 + 12 * Math.sin(k * 0.8 + i);
        if (S.i === 2 && x < BX + 260) { const d = Math.hypot(x - germX, y - 190); if (d < 90) { x += (x - germX) / d * 6; } }
        const c0 = COLS[i % 6]; const an = k * 0.5 + i;
        soft(ctx, x, y, 18, c0, 0.25);
        ctx.save(); ctx.translate(x, y); ctx.rotate(an);
        ctx.fillStyle = tint(c0, 0.55); ctx.strokeStyle = color(c0); ctx.lineWidth = 1.5;
        const kind = i % 3;
        if (kind === 0) { rounded(ctx, -10, -4, 20, 8, 4); ctx.fill(); ctx.stroke(); }
        else if (kind === 1) { for (const dx of [-7, 0, 7]) { ell(ctx, dx, 0, 4, 4); ctx.fill(); ctx.stroke(); } }
        else { ctx.beginPath(); for (let q = 0; q <= 10; q++) { const px = -12 + q * 2.4; const py = 4 * Math.sin(q * 1.1 + k * 3); if (q) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.lineWidth = 3; ctx.strokeStyle = color(c0); ctx.stroke(); }
        ctx.restore();
      }
      // Stage effects.
      if (S.i === 0) for (let j = 0; j < 14; j++) { const q = mod(k * 0.5 + j / 14, 1); const x = BX + 40 + rnd(j + 4) * (BW - 80); const y = lerp(BY0 + 200, BY0 + 56, q); ctx.save(); ctx.globalAlpha *= 1 - q; soft(ctx, x, y, 10, 'orange', 0.8); dot(ctx, x, y, 3, '#fed7aa'); ctx.restore(); }
      if (S.i === 1) for (let j = 0; j < 10; j++) { const q = mod(k * 0.4 + j / 10, 1); const x = BX + 40 + rnd(j + 14) * (BW - 80); const y = lerp(BY0 + 240, BY0 + 60, q); ctx.save(); ctx.globalAlpha *= Math.sin(q * Math.PI); soft(ctx, x, y, 16, 'yellow', 0.7); T(ctx, j % 2 ? 'K' : 'B', x, y, 18, 'yellow', 'center', 800); ctx.restore(); }
      if (S.i === 2) {
        const gy = 190; const ga = 1 - win(S.p, 0.8, 1);
        ctx.save(); ctx.globalAlpha *= ga; soft(ctx, germX, gy, 40, 'red', 0.6);
        ctx.fillStyle = 'rgba(251,113,133,0.6)'; ctx.strokeStyle = '#fb7185'; ctx.lineWidth = 2;
        ctx.beginPath(); for (let i = 0; i <= 24; i++) { const an = (i / 24) * TAU; const rr = i % 2 ? 14 : 22; const px = germX + Math.cos(an + k) * rr; const py = gy + Math.sin(an + k) * rr; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.closePath(); ctx.fill(); ctx.stroke();
        T(ctx, 'harmful germ', germX, gy + 40, 18, 'red', 'center', 700);
        ctx.restore();
      }
      if (S.i === 3) for (let j = 0; j < 6; j++) { const x = BX + 50 + j * 96; const q = mod(k * 0.7 + j * 0.3, 1); ctx.strokeStyle = tint('purple', 0.8 * (1 - q)); ctx.lineWidth = 2; ell(ctx, x, BY0 + BH - 22, 14 + q * 30, 14 + q * 30); ctx.stroke(); }
      ctx.restore();
      ctx.strokeStyle = tint('orange', 0.5); ctx.lineWidth = 2; rounded(ctx, BX, BY0, BW, BH, 18); ctx.stroke();
      T(ctx, 'Inside the large intestine', BX + BW / 2, BY0 + 26, 18, 'ink', 'center', 700);
      // Job cards.
      const JOBS = [['Digest fibre', 'fibre we cannot break down', 'green'], ['Make vitamins', 'vitamin K and some B vitamins', 'yellow'], ['Block bad germs', 'no room for harmful microbes', 'red'], ['Train immunity', 'teach defences what is harmless', 'purple']];
      JOBS.forEach(([nm, d, cc], i) => {
        const x = 20 + i * 192; const on = i === S.i;
        if (on) soft(ctx, x + 91, 510, 120, cc, 0.16);
        panel(ctx, x, 436, 182, 150, cc, on ? 0.18 : 0.04, 16);
        ctx.save(); ctx.globalAlpha *= on ? 1 : 0.55;
        T(ctx, nm, x + 91, 466, 20, cc); para(ctx, d, x + 12, 530, 158, 18, 'ink', 500, 3);
        ctx.restore();
      });
      const CAP = [
        ['Digesting fibre', 'Gut bacteria break down fibre we cannot digest, making fatty acids that feed the gut wall.', 'green'],
        ['Making vitamins', 'Some gut bacteria make vitamins we absorb, such as vitamin K and some B vitamins.', 'yellow'],
        ['Crowding out harmful germs', 'With the space and food already taken, harmful microbes struggle to settle in.', 'red'],
        ['Training the immune system', 'Friendly microbes help the immune system learn what to attack and what to leave alone.', 'purple'],
      ];
      caption(ctx, CAP[S.i][0], CAP[S.i][1], CAP[S.i][2], S.s, S.i, 4);
      ctx.restore();
    },

    // ─── Cloning ──────────────────────────────────────────────────────────

    // An udder cell's nucleus goes into an emptied egg, the embryo grows in
    // a surrogate mother, and Dolly is born in 1996.
    'cloning-dolly'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [3.0, 3.4, 2.8, 3.0, 2.6, 4.0], 0.6);
      begin(ctx, t, it, 'Cloning Dolly the sheep');
      const sheep = (x, y, s, face, glowC) => {
        ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
        if (glowC) soft(ctx, 0, 0, 80, glowC, 0.45);
        ctx.strokeStyle = '#1c1917'; ctx.lineWidth = 6; for (const lx of [-26, -12, 14, 28]) { ctx.beginPath(); ctx.moveTo(lx, 14); ctx.lineTo(lx + Math.sin(k * 2 + lx) * 1.5, 44); ctx.stroke(); }
        ctx.fillStyle = '#f1f5f9'; ctx.strokeStyle = 'rgba(203,213,225,0.9)'; ctx.lineWidth = 1.5;
        for (let i = 0; i < 11; i++) { const an = (i / 11) * TAU; ell(ctx, Math.cos(an) * 34, Math.sin(an) * 18, 15, 13); ctx.fill(); ctx.stroke(); }
        ell(ctx, 0, 0, 38, 22); ctx.fill();
        ctx.fillStyle = face; ctx.strokeStyle = face === '#f5f5f4' ? '#a8a29e' : '#57534e';
        ell(ctx, 46, -12, 13, 16, 0.4); ctx.fill(); ctx.stroke();
        ell(ctx, 38, -24, 8, 4, -0.5); ctx.fill(); ctx.stroke(); ell(ctx, 56, -22, 8, 4, 0.5); ctx.fill(); ctx.stroke();
        dot(ctx, 44, -14, 2.2, face === '#f5f5f4' ? '#1c1917' : '#f5f5f4'); dot(ctx, 52, -14, 2.2, face === '#f5f5f4' ? '#1c1917' : '#f5f5f4');
        ctx.restore();
      };
      const WHITE_F = '#f5f5f4'; const BLACK_F = '#1c1917';
      const SA = [130, 150]; const SB = [400, 150]; const SC = [670, 150];
      sheep(SA[0], SA[1], 1.1, WHITE_F, S.i === 0 || S.i === 5 ? 'cyan' : null);
      sheep(SB[0], SB[1], 1.1, BLACK_F, S.i === 1 ? 'orange' : null);
      sheep(SC[0], SC[1], 1.1, BLACK_F, S.i === 4 ? PINK : null);
      T(ctx, 'Sheep A', SA[0], 222, 19, 'cyan'); T(ctx, 'white face', SA[0], 246, 18, 'muted', 'center', 500);
      T(ctx, 'Sheep B', SB[0], 222, 19, 'orange'); T(ctx, 'black face', SB[0], 246, 18, 'muted', 'center', 500);
      T(ctx, 'Sheep C', SC[0], 222, 19, PINK); T(ctx, 'black face', SC[0], 246, 18, 'muted', 'center', 500);
      // The lab dish.
      const DX = 400; const DY = 420; const DR = 122;
      soft(ctx, DX, DY, 170, 'cyan', 0.12);
      ctx.fillStyle = 'rgba(14,30,60,0.6)'; ctx.strokeStyle = 'rgba(186,230,253,0.6)'; ctx.lineWidth = 3; ell(ctx, DX, DY, DR, DR); ctx.fill(); ctx.stroke();
      T(ctx, 'In the lab', DX, DY - DR - 18, 18, 'muted', 'center', 600);
      const cell = (x, y, r, nucC, nucR, a = 1, nucOff = [0, 0]) => {
        ctx.save(); ctx.globalAlpha *= a;
        ctx.fillStyle = 'rgba(254,243,199,0.25)'; ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 2; ell(ctx, x, y, r, r); ctx.fill(); ctx.stroke();
        if (nucC) { soft(ctx, x + nucOff[0], y + nucOff[1], nucR * 2, nucC, 0.5); ctx.fillStyle = tint(nucC, 0.7); ctx.strokeStyle = color(nucC); ell(ctx, x + nucOff[0], y + nucOff[1], nucR, nucR); ctx.fill(); ctx.stroke(); }
        ctx.restore();
      };
      // Travel paths into the dish.
      if (S.i === 0) { const q = smooth(win(S.p, 0.1, 0.8)); cell(lerp(SA[0] + 10, DX - 60, q), lerp(SA[1] + 20, DY, q), lerp(10, 26, q), 'cyan', lerp(4, 10, q)); if (q > 0.9) { T(ctx, 'udder cell', DX - 60, DY + 46, 18, 'cyan', 'center', 600); } }
      const eggX = DX + 30; const eggR = 52;
      const nucOut = S.i === 1 ? smooth(win(S.p, 0.45, 0.95)) : S.i > 1 ? 1 : 0;
      if (S.i >= 1 && S.i <= 2) {
        const q = S.i === 1 ? smooth(win(S.p, 0, 0.4)) : 1;
        const ex = lerp(SB[0], eggX, q); const ey = lerp(SB[1] + 20, DY, q); const er = lerp(14, eggR, q);
        cell(ex, ey, er, nucOut < 1 ? 'orange' : null, er * 0.24, 1, [nucOut * 60, 0]);
        if (S.i === 1 && S.p > 0.35) {
          const tipX = eggX + eggR - 8 + 10 * (1 - win(S.p, 0.35, 0.45));
          ctx.fillStyle = 'rgba(186,230,253,0.25)'; ctx.strokeStyle = 'rgba(186,230,253,0.85)'; ctx.lineWidth = 2;
          poly(ctx, [tipX, DY - 6, tipX + 120, DY - 14, tipX + 120, DY + 14, tipX, DY + 6], true); ctx.fill(); ctx.stroke();
          if (nucOut > 0) { ctx.fillStyle = tint('orange', 0.7); ell(ctx, eggX + nucOut * 90, DY, 10, 6); ctx.fill(); }
          T(ctx, 'nucleus removed', DX + 60, DY + 74, 18, 'orange', 'center', 600);
        }
        if (S.i === 1) cell(DX - 60, DY, 26, 'cyan', 10);
      }
      if (S.i === 2) {
        const mv = smooth(win(S.p, 0.15, 0.6)); const merge = smooth(win(S.p, 0.55, 0.95));
        const ux = lerp(DX - 60, eggX - eggR + 8, mv);
        cell(ux, DY, 26 * (1 - merge * 0.8), 'cyan', 10 * (1 - merge), 1 - merge);
        if (merge > 0) { ctx.save(); ctx.globalAlpha *= merge; soft(ctx, eggX, DY, 30, 'cyan', 0.6); ctx.fillStyle = tint('cyan', 0.75); ell(ctx, eggX, DY, 13, 13); ctx.fill(); ctx.restore(); }
        if (S.p > 0.3 && S.p < 0.7) {
          const fl = Math.max(0, Math.sin(k * 30)); ctx.strokeStyle = tint('yellow', 0.9 * fl); ctx.lineWidth = 3;
          for (const sd of [-1, 1]) poly(ctx, [eggX - eggR - 4, DY + sd * 34, eggX - eggR + 10, DY + sd * 20, eggX - eggR - 2, DY + sd * 12, eggX - eggR + 12, DY + sd * 2]); ctx.stroke();
          T(ctx, 'electric pulse', DX - 20, DY - 76, 18, 'yellow', 'center', 700);
        }
      }
      // Embryo dividing.
      const embryo = (x, y, r, n, a = 1) => {
        ctx.save(); ctx.globalAlpha *= a;
        ctx.strokeStyle = 'rgba(254,243,199,0.7)'; ctx.lineWidth = 2; ell(ctx, x, y, r, r); ctx.stroke();
        const cr = n === 1 ? r * 0.85 : n === 2 ? r * 0.5 : n === 4 ? r * 0.44 : r * 0.36;
        for (let i = 0; i < n; i++) {
          const an = (i / n) * TAU + 0.3; const off = n === 1 ? 0 : n === 2 ? r * 0.42 : n === 4 ? r * 0.42 : r * (i % 2 ? 0.56 : 0.3);
          const px = x + Math.cos(an) * off; const py = y + Math.sin(an) * off;
          ctx.fillStyle = 'rgba(254,243,199,0.35)'; ctx.strokeStyle = '#fde68a'; ell(ctx, px, py, cr, cr); ctx.fill(); ctx.stroke();
          dot(ctx, px, py, Math.max(2, cr * 0.28), tint('cyan', 0.8));
        }
        ctx.restore();
      };
      if (S.i === 3) { const n = 2 ** Math.min(3, Math.floor(S.p * 4)); embryo(eggX - 10, DY, eggR, n); T(ctx, `${n} cell${n > 1 ? 's' : ''}`, eggX - 10, DY + 76, 18, 'yellow', 'center', 700); }
      if (S.i === 4) { const q = smooth(win(S.p, 0.05, 0.85)); embryo(lerp(eggX - 10, SC[0] - 6, q), lerp(DY, SC[1] + 8, q), lerp(eggR, 14, q), 8, 1 - win(S.p, 0.85, 1)); }
      // Dolly.
      if (S.i === 5) {
        const q = outBack(clamp(S.p / 0.3));
        ctx.save(); ctx.globalAlpha *= clamp(S.p / 0.2);
        sheep(664, 432, 0.95 * Math.max(0.1, q), WHITE_F, 'cyan');
        chip(ctx, 'Dolly', 664, 500, 'cyan', 22);
        T(ctx, 'born 5 July 1996', 664, 534, 18, 'ink', 'center', 600);
        ctx.restore();
        ctx.save(); ctx.globalAlpha *= win(S.p, 0.3, 0.5);
        ctx.strokeStyle = tint('cyan', 0.8); ctx.lineWidth = 2.5; ctx.setLineDash([8, 8]); ctx.lineDashOffset = -k * 20;
        ctx.beginPath(); ctx.moveTo(SA[0], 268); ctx.bezierCurveTo(100, 560, 520, 600, 612, 470); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
        T(ctx, 'same DNA as Sheep A', 150, 300, 19, 'cyan', 'left', 700);
        ctx.restore();
        sheep(SC[0], SC[1], 1.1, BLACK_F, null);
      }
      const CAP = [
        ['1. A body cell from Sheep A', 'Scientists took an ordinary cell from the udder of a white-faced Finn Dorset ewe.', 'cyan'],
        ['2. An egg cell from Sheep B', 'Its own nucleus was sucked out, leaving an empty egg with none of its own DNA.', 'orange'],
        ['3. Fusing the two', "An electric pulse fused the udder cell with the empty egg: now it has Sheep A's nucleus.", 'yellow'],
        ['4. An embryo grows', 'The egg began dividing, 1, 2, 4, 8 cells, just like a normal fertilised egg.', 'yellow'],
        ['5. Into a surrogate mother', 'The embryo was placed in the womb of Sheep C, a black-faced ewe.', PINK],
        ['6. Dolly, born in 1996', 'A white-faced lamb, a clone of Sheep A: the first mammal cloned from an adult cell.', 'cyan'],
      ];
      caption(ctx, CAP[S.i][0], CAP[S.i][1], CAP[S.i][2], S.s, S.i, 6);
      ctx.restore();
    },

    // ─── Under the forest ────────────────────────────────────────────────

    // Mushrooms above, a glowing web of hyphae below wrapping tree roots;
    // sugar flows one way, water and minerals the other.
    'fungi-network'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [3.2, 3.4, 3.2, 3.4, 3.4, 3.8], 0.6);
      begin(ctx, t, it, 'The fungal network underground');
      const GY = 262;
      if (!it._fn) {
        const roots = []; const tips = [];
        const grow = (x, y, a, len, depth, tree) => {
          const x1 = x + Math.cos(a) * len; const y1 = y + Math.sin(a) * len;
          roots.push([x, y, x1, y1, depth, tree]);
          if (depth < 3) { grow(x1, y1, a - 0.45 - rnd(x1) * 0.2, len * 0.68, depth + 1, tree); grow(x1, y1, a + 0.4 + rnd(y1) * 0.2, len * 0.68, depth + 1, tree); } else tips.push([x1, y1, tree]);
        };
        grow(170, GY, Math.PI / 2 - 0.5, 70, 0, 0); grow(170, GY, Math.PI / 2 + 0.5, 70, 0, 0); grow(170, GY, Math.PI / 2, 80, 1, 0);
        grow(640, GY, Math.PI / 2 - 0.4, 50, 1, 1); grow(640, GY, Math.PI / 2 + 0.4, 50, 1, 1);
        const hy = [];
        const thread = (ax, ay, bx, by, seed) => { const pts = []; const n = 14; for (let i = 0; i <= n; i++) { const u = i / n; pts.push(lerp(ax, bx, u) + (rnd(seed + i) - 0.5) * 22 * Math.sin(u * Math.PI), lerp(ay, by, u) + (rnd(seed + i + 50) - 0.5) * 26 * Math.sin(u * Math.PI) + 14 * Math.sin(u * Math.PI)); } return mkPath(pts); };
        const A = tips.filter((p) => p[2] === 0); const B = tips.filter((p) => p[2] === 1);
        const MUSH = [[318, GY + 4], [372, GY + 4], [452, GY + 4]];
        A.forEach((p, i) => { const q = B[i % B.length]; hy.push({ path: thread(p[0], p[1], q[0], q[1], i * 13), main: true, d: i * 0.08 }); });
        A.forEach((p, i) => { const m = MUSH[i % 3]; if (i % 2 === 0) hy.push({ path: thread(p[0], p[1], m[0], m[1], 200 + i * 7), main: false, d: 0.2 + i * 0.05 }); });
        for (let i = 0; i < 26; i++) { const x = 60 + rnd(i + 300) * 680; const y = GY + 40 + rnd(i + 301) * 250; const an = rnd(i + 302) * TAU; const L = 30 + rnd(i + 303) * 50; hy.push({ path: thread(x, y, x + Math.cos(an) * L, y + Math.sin(an) * L, 400 + i), main: false, d: 0.3 + rnd(i) * 0.6 }); }
        it._fn = { roots, tips, hy, MUSH };
      }
      const { roots, tips, hy, MUSH } = it._fn;
      // Sky and soil.
      const sky = ctx.createLinearGradient(0, 56, 0, GY); sky.addColorStop(0, 'rgba(56,189,248,0.10)'); sky.addColorStop(1, 'rgba(132,204,22,0.08)');
      ctx.fillStyle = sky; ctx.fillRect(20, 56, 760, GY - 56);
      const soil = ctx.createLinearGradient(0, GY, 0, 588); soil.addColorStop(0, 'rgba(120,72,40,0.5)'); soil.addColorStop(1, 'rgba(40,24,14,0.7)');
      ctx.fillStyle = soil; ctx.fillRect(20, GY, 760, 588 - GY);
      ctx.strokeStyle = 'rgba(132,204,22,0.75)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(20, GY); ctx.lineTo(780, GY); ctx.stroke();
      for (let i = 0; i < 34; i++) dot(ctx, 24 + rnd(i + 60) * 752, GY + 10 + rnd(i + 61) * 316, 1.5 + rnd(i) * 2, 'rgba(214,170,120,0.2)');
      // Trees.
      const tree = (x, s, glowC) => {
        ctx.fillStyle = '#78350f'; ctx.strokeStyle = '#d6a77a'; ctx.lineWidth = 2;
        poly(ctx, [x - 14 * s, GY, x - 9 * s, GY - 110 * s, x + 9 * s, GY - 110 * s, x + 14 * s, GY], true); ctx.fill(); ctx.stroke();
        if (glowC) soft(ctx, x, GY - 140 * s, 110 * s, glowC, 0.25);
        for (const [dx, dy, r] of [[0, -150, 52], [-40, -122, 38], [40, -120, 40], [-20, -180, 36], [26, -176, 34]]) { ctx.fillStyle = 'rgba(34,197,94,0.55)'; ctx.strokeStyle = 'rgba(134,239,172,0.8)'; ell(ctx, x + dx * s, GY + dy * s + 3 * Math.sin(k + dx) * s, r * s, r * s * 0.9); ctx.fill(); ctx.stroke(); }
      };
      tree(170, 0.95, S.i === 3 || S.i === 5 ? 'yellow' : null);
      tree(640, 0.55, null);
      ctx.fillStyle = 'rgba(15,23,42,0.35)'; ell(ctx, 640, GY - 88, 60, 50); ctx.fill();
      // Mushrooms with spores.
      MUSH.forEach(([x], i) => {
        const s = [1, 0.8, 1.15][i]; const on = S.i === 0;
        if (on) soft(ctx, x, GY - 30 * s, 50, 'orange', 0.4);
        ctx.fillStyle = '#fef3c7'; ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(x - 6 * s, GY - 30 * s, 12 * s, 30 * s, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ea580c'; ctx.strokeStyle = '#fdba74'; ctx.beginPath(); ctx.moveTo(x - 28 * s, GY - 28 * s); ctx.quadraticCurveTo(x - 26 * s, GY - 56 * s, x, GY - 56 * s); ctx.quadraticCurveTo(x + 26 * s, GY - 56 * s, x + 28 * s, GY - 28 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
        for (const [dx, dy] of [[-12, -42], [6, -48], [16, -36]]) dot(ctx, x + dx * s, GY + dy * s, 3 * s, '#fff7ed');
        if (on) for (let j = 0; j < 6; j++) { const q = mod(k * 0.4 + j / 6 + i * 0.3, 1); dot(ctx, x + (rnd(j + i) - 0.5) * 40 + q * 30, GY - 60 * s - q * 70, 2, `rgba(254,215,170,${0.8 * (1 - q)})`); }
      });
      // Roots.
      for (const [x0, y0, x1, y1, d] of roots) { ctx.strokeStyle = 'rgba(214,167,122,0.85)'; ctx.lineWidth = Math.max(1.5, 7 - d * 1.7); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
      // Hyphae web.
      const reveal = S.i === 0 ? 0.25 : S.i === 1 ? lerp(0.25, 1, smooth(S.p / 0.85)) : 1;
      const hyOn = S.i === 1;
      for (const h of hy) {
        const q = clamp((reveal - h.d * 0.6) / 0.5); if (q <= 0) continue;
        ctx.strokeStyle = h.main ? `rgba(240,249,255,${hyOn ? 0.18 : 0.1})` : 'rgba(240,249,255,0.06)'; ctx.lineWidth = h.main ? 7 : 5; strokeSpan(ctx, h.path, 0, q * h.path.total);
        ctx.strokeStyle = h.main ? `rgba(240,249,255,${hyOn ? 0.95 : 0.75})` : 'rgba(226,232,240,0.5)'; ctx.lineWidth = h.main ? 1.8 : 1.2; strokeSpan(ctx, h.path, 0, q * h.path.total);
      }
      // Mycorrhiza: fungus wrapped round the root tips.
      for (const [x, y] of tips) { const on = S.i === 2; soft(ctx, x, y, on ? 22 : 12, 'cyan', on ? 0.6 + 0.2 * Math.sin(k * 4 + x) : 0.25); ctx.strokeStyle = 'rgba(240,249,255,0.7)'; ctx.lineWidth = 1.2; ell(ctx, x, y, 6, 6); ctx.stroke(); }
      // Trades along the main threads.
      const sugar = S.i === 3 || S.i === 5; const water = S.i === 4 || S.i === 5;
      hy.filter((h) => h.main).forEach((h, i) => {
        for (let j = 0; j < 3; j++) {
          if (sugar) { const q = mod(k * 0.18 + j / 3 + i * 0.11, 1); const A = at(h.path, q * h.path.total); soft(ctx, A.x, A.y, 11, 'orange', 0.8); dot(ctx, A.x, A.y, 3, '#fed7aa'); }
          if (water) { const q = 1 - mod(k * 0.2 + j / 3 + i * 0.13 + 0.15, 1); const A = at(h.path, q * h.path.total); soft(ctx, A.x, A.y, 11, 'cyan', 0.8); dot(ctx, A.x, A.y, 3, '#cffafe'); }
        }
      });
      if (sugar) for (let j = 0; j < 5; j++) { const q = mod(k * 0.4 + j / 5, 1); dot(ctx, 170 + (j - 2) * 3, lerp(GY - 120, GY + 20, q), 3, 'rgba(253,186,116,0.9)'); }
      // Labels.
      T(ctx, 'Mushrooms', 385, 150, 19, 'orange'); T(ctx, '(the fruit of the fungus)', 385, 174, 18, 'muted', 'center', 500);
      T(ctx, 'Big tree', 244, 88, 18, 'green', 'left', 700);
      T(ctx, 'Seedling in shade', 640, 140, 18, 'green', 'center', 700);
      T(ctx, 'Tree roots', 60, 300, 18, '#d6a77a', 'left', 700);
      chip(ctx, 'Hyphae: threads of fungus', 560, 552, 'ink', 18);
      ctx.save(); ctx.globalAlpha *= sugar || water ? 1 : 0.5;
      dot(ctx, 44, 552, 5, 'orange'); T(ctx, 'sugar', 56, 552, 18, 'orange', 'left', 700);
      dot(ctx, 132, 552, 5, 'cyan'); T(ctx, 'water and minerals', 144, 552, 18, 'cyan', 'left', 700);
      ctx.restore();
      const CAP = [
        ['A mushroom is only the fruit', 'It releases spores. The real fungus is hidden underground.', 'orange'],
        ['Hyphae: threads of fungus', 'A web of tiny threads spreads through the soil. All together they make the mycelium.', 'ink'],
        ['Mycorrhiza: fungus and roots', 'The hyphae wrap around and into tree root tips, joining fungus and plant.', 'cyan'],
        ['Trees pay with sugar', 'Trees send some of the sugar they make by photosynthesis to the fungus.', 'orange'],
        ['Fungi pay with water and minerals', 'The far-reaching hyphae bring back water, phosphorus and nitrogen for the roots.', 'cyan'],
        ['A network under the forest', 'It can link many trees. Scientists are still finding out how much they share.', 'green'],
      ];
      caption(ctx, CAP[S.i][0], CAP[S.i][1], CAP[S.i][2], S.s, S.i, 6);
      ctx.restore();
    },

    // ─── Deep time ───────────────────────────────────────────────────────

    // 540 million years of the variety of life, with five sharp drops and
    // recoveries; the asteroid that ended the age of dinosaurs strikes.
    'mass-extinctions'(b, ctx, it, t) {
      const k = b.clock; const SW = 15; const P = 19.5;
      const EV = [[445, 'Ordovician', '85%', 'An ice age: seas fell and turned cold', 'ice'], [372, 'Devonian', '75%', 'The oceans lost much of their oxygen', 'ocean'], [252, 'Permian', '90%', "Huge eruptions in Siberia: the 'Great Dying'", 'volcano'], [201, 'Triassic', '80%', 'Eruptions as the supercontinent Pangaea split', 'volcano'], [66, 'Cretaceous', '76%', 'An asteroid hit Mexico: the dinosaurs (except birds) died out', 'asteroid']];
      if (!it._mx) {
        const cum = [0]; let tot = 0;
        for (let m = 540; m > 0; m--) { let s = 1; for (const [e] of EV) s -= 0.8 * Math.exp(-(((m - e) / 10) ** 2)); tot += 1 / Math.max(0.15, s); cum.push(tot); }
        it._mx = cum.map((v) => v / tot);
      }
      const c = cycle(t, P, 0.6); const u = clamp(c / SW);
      let lo = 0; let hi = 540; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (it._mx[mid] < u) lo = mid; else hi = mid; }
      const m = 540 - lo - (it._mx[hi] - it._mx[lo] > 0 ? (u - it._mx[lo]) / (it._mx[hi] - it._mx[lo]) : 0);
      begin(ctx, t, it, 'The five mass extinctions');
      const G = { x: 80, y: 122, w: 680, h: 252 };
      const X = (mm) => G.x + ((540 - mm) / 540) * G.w;
      const D = [[540, 0.06], [500, 0.32], [460, 0.5], [446, 0.55], [443, 0.3], [420, 0.42], [380, 0.56], [373, 0.58], [370, 0.34], [340, 0.4], [300, 0.46], [260, 0.52], [253, 0.54], [250, 0.12], [235, 0.26], [205, 0.4], [202, 0.42], [199, 0.24], [170, 0.38], [120, 0.56], [80, 0.72], [67, 0.76], [65, 0.44], [45, 0.68], [20, 0.86], [0, 0.95]];
      const div = (mm) => { for (let i = 1; i < D.length; i++) if (mm >= D[i][0]) { const [a0, v0] = D[i - 1]; const [a1, v1] = D[i]; return lerp(v0, v1, (a0 - mm) / (a0 - a1)); } return D[D.length - 1][1]; };
      const Y = (v) => G.y + G.h - v * G.h;
      // Grid, eras and axis.
      ctx.strokeStyle = 'rgba(140,170,255,0.12)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let mm = 500; mm >= 0; mm -= 100) { ctx.moveTo(X(mm), G.y); ctx.lineTo(X(mm), G.y + G.h); }
      ctx.stroke();
      [[541, 252, 'Palaeozoic', 'teal'], [252, 66, 'Mesozoic', 'green'], [66, 0, 'Cenozoic', 'yellow']].forEach(([a, z, nm, cc]) => {
        ctx.fillStyle = tint(cc, 0.16); ctx.fillRect(X(Math.min(540, a)), G.y + G.h + 6, X(z) - X(Math.min(540, a)) - 2, 26);
        T(ctx, nm, (X(Math.min(540, a)) + X(z)) / 2, G.y + G.h + 19, 18, cc, 'center', 700);
      });
      for (let mm = 500; mm >= 0; mm -= 100) T(ctx, String(mm), X(mm), G.y + G.h + 48, 18, 'muted', 'center', 500);
      T(ctx, 'millions of years ago', G.x - 60, G.y + G.h + 74, 18, 'muted', 'left', 600);
      T(ctx, 'variety of life', G.x + 8, G.y + 12, 18, 'muted', 'left', 600);
      // The curve so far.
      const gr = ctx.createLinearGradient(0, G.y, 0, G.y + G.h); gr.addColorStop(0, 'rgba(45,212,191,0.4)'); gr.addColorStop(1, 'rgba(45,212,191,0.03)');
      ctx.beginPath(); ctx.moveTo(X(540), Y(0));
      for (let mm = 540; mm >= m; mm -= 1) ctx.lineTo(X(mm), Y(div(mm)));
      ctx.lineTo(X(m), Y(div(m))); ctx.lineTo(X(m), Y(0)); ctx.closePath(); ctx.fillStyle = gr; ctx.fill();
      ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 3; ctx.beginPath();
      for (let mm = 540; mm >= m; mm -= 1) { if (mm === 540) ctx.moveTo(X(mm), Y(div(mm))); else ctx.lineTo(X(mm), Y(div(mm))); }
      ctx.lineTo(X(m), Y(div(m))); ctx.stroke();
      soft(ctx, X(m), Y(div(m)), 18, 'teal', 0.8); dot(ctx, X(m), Y(div(m)), 4, WHITE);
      line(ctx, X(m), G.y, X(m), G.y + G.h, tint('yellow', 0.4), 1.5);
      // Life icons as their time comes.
      const icons = [[500, 'trilobites'], [400, 'fish'], [150, 'dinosaurs'], [30, 'mammals']];
      icons.forEach(([mm, kind]) => {
        if (m > mm) return; const x = X(mm); const y = G.y + G.h - 22; ctx.save(); ctx.globalAlpha *= 0.85;
        ctx.fillStyle = 'rgba(226,232,240,0.6)'; ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5;
        if (kind === 'trilobites') { ell(ctx, x, y, 10, 14); ctx.fill(); ctx.stroke(); ctx.beginPath(); for (let j = -8; j <= 8; j += 5) { ctx.moveTo(x - 10, y + j); ctx.lineTo(x + 10, y + j); } ctx.stroke(); }
        else if (kind === 'fish') { ell(ctx, x, y, 15, 7); ctx.fill(); ctx.stroke(); poly(ctx, [x + 13, y, x + 22, y - 7, x + 22, y + 7], true); ctx.fill(); }
        else if (kind === 'dinosaurs') { ell(ctx, x, y, 16, 9); ctx.fill(); ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(226,232,240,0.6)'; ctx.beginPath(); ctx.moveTo(x + 10, y - 4); ctx.quadraticCurveTo(x + 20, y - 14, x + 18, y - 26); ctx.moveTo(x - 14, y); ctx.lineTo(x - 30, y + 4); ctx.moveTo(x - 6, y + 6); ctx.lineTo(x - 6, y + 16); ctx.moveTo(x + 6, y + 6); ctx.lineTo(x + 6, y + 16); ctx.stroke(); }
        else { ell(ctx, x, y + 2, 12, 7); ctx.fill(); ctx.stroke(); ell(ctx, x + 12, y - 3, 6, 5); ctx.fill(); ctx.stroke(); }
        ctx.restore();
      });
      // Extinction markers.
      let last = -1;
      EV.forEach(([e, nm], i) => {
        const x = X(e); const row = [0, 1, 0, 1, 0][i]; const passed = m <= e;
        if (passed) last = i;
        ctx.save(); ctx.globalAlpha *= passed ? 1 : 0.35;
        line(ctx, x, G.y - 4 - (row ? 0 : 22), x, G.y + G.h, tint('red', passed ? 0.6 : 0.3), 1.5, [5, 5]);
        T(ctx, `${i + 1} ${nm}`, x, row ? 98 : 74, 18, passed ? 'red' : 'muted', 'center', 700);
        if (passed) { const fl = clamp(1 - (e - m) / 20); if (fl > 0) soft(ctx, x, Y(div(e + 1)), 40, 'red', 0.7 * fl); }
        ctx.restore();
      });
      // The asteroid streaks in near 66 million years ago.
      if (m < 90 && m > 40) {
        const q = clamp((90 - m) / 24); const tx = X(66); const ty = Y(div(67));
        if (q < 1) { const ax = lerp(tx - 120, tx, q); const ay = lerp(G.y + 30, ty, q); ctx.strokeStyle = 'rgba(253,186,116,0.7)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ax - 50, ay - 30); ctx.lineTo(ax, ay); ctx.stroke(); soft(ctx, ax, ay, 18, 'orange', 0.9); dot(ctx, ax, ay, 6, '#fed7aa'); }
        else { const f = clamp((66 - m) / 26); soft(ctx, tx, ty, 30 + f * 80, 'orange', 0.8 * (1 - f)); }
      }
      // Info card.
      const CY = 466;
      panel(ctx, 20, CY, 760, 120, last >= 0 ? 'red' : 'teal', 0.07, 16);
      if (last < 0) {
        T(ctx, 'The Cambrian explosion', 44, CY + 34, 22, 'teal', 'left', 800);
        para(ctx, 'About 540 million years ago animals with shells and skeletons appear, and life in the sea booms.', 44, CY + 80, 560, 18, 'ink', 500, 2, 'left');
      } else {
        const [e, nm, pc, cause, kind] = EV[last];
        T(ctx, `${last + 1}. End-${nm} · ${e} million years ago`, 44, CY + 30, 21, 'red', 'left', 800);
        T(ctx, `About ${pc} of species lost`, 44, CY + 64, 20, 'ink', 'left', 700);
        para(ctx, cause, 44, CY + 96, 560, 18, 'muted', 500, 1, 'left');
        // A tiny picture of the cause.
        const ix = 700; const iy = CY + 60;
        if (kind === 'ice') { ctx.strokeStyle = SKY; ctx.lineWidth = 3; ctx.beginPath(); for (let j = 0; j < 3; j++) { const an = (j / 3) * Math.PI + k * 0.3; ctx.moveTo(ix - Math.cos(an) * 30, iy - Math.sin(an) * 30); ctx.lineTo(ix + Math.cos(an) * 30, iy + Math.sin(an) * 30); } ctx.stroke(); }
        else if (kind === 'ocean') { for (let j = 0; j < 3; j++) { ctx.strokeStyle = tint('blue', 0.8 - j * 0.2); ctx.lineWidth = 3; ctx.beginPath(); for (let x = -40; x <= 40; x += 4) { const y = iy - 14 + j * 14 + 5 * Math.sin(x * 0.15 + k * 2 + j); if (x === -40) ctx.moveTo(ix + x, y); else ctx.lineTo(ix + x, y); } ctx.stroke(); } T(ctx, 'O₂ ↓', ix, iy + 34, 18, 'blue', 'center', 800); }
        else if (kind === 'volcano') { ctx.fillStyle = '#57534e'; poly(ctx, [ix - 44, iy + 40, ix - 10, iy - 14, ix + 10, iy - 14, ix + 44, iy + 40], true); ctx.fill(); for (let j = 0; j < 5; j++) { const q = mod(k * 0.8 + j / 5, 1); soft(ctx, ix + (rnd(j) - 0.5) * 20, iy - 18 - q * 30, 10 + q * 10, 'orange', 0.7 * (1 - q)); } }
        else { soft(ctx, ix, iy, 36, 'orange', 0.6); ctx.strokeStyle = 'rgba(253,186,116,0.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ix + 40, iy - 34); ctx.lineTo(ix + 8, iy - 6); ctx.stroke(); dot(ctx, ix, iy, 12, '#fdba74'); }
      }
      const done = c >= SW;
      const cap = done ? ['After each disaster, life recovered', 'New groups spread into the empty spaces. Many scientists warn a sixth extinction may be starting.', 'teal']
        : last < 0 ? ['Life gets going', 'The line shows how many kinds of sea animals there were over time.', 'teal']
          : last === 4 ? ['The end of the dinosaurs', '66 million years ago an asteroid about 10 km wide struck. Mammals then took over.', 'orange']
            : ['A mass extinction', 'Most species vanish in a short time, then over millions of years life recovers.', 'red'];
      caption(ctx, cap[0], cap[1], cap[2], 1, -1, 0);
      ctx.restore();
    },
  };
}
