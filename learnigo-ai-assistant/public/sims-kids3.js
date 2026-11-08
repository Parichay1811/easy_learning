// Simulations for young children (about 3 to 9) about early maths, words
// and everyday life: mixing colours, the alphabet, shapes and patterns,
// adding and taking away, halves and quarters, ordering by size, measuring
// and weighing, coins, symmetry, the number line, odd and even, road
// safety, transport, music, feelings and the people who help us. Bright,
// round, friendly drawings made with canvas paths, gentle bouncy motion and
// few big words. Each is a function of time (t since it appeared, b.clock
// for the loop), so any moment can be drawn: plain canvas calls, no glow,
// no state between frames. KIDS3_SIMS says what each one is for, so a
// lesson's words can pick the right picture.

export const KIDS3_SIMS = {
  'colour-mixing': { title: 'Mixing colours', keywords: ['mixing colours', 'mixing colors', 'primary colours', 'secondary colours', 'red and yellow make orange', 'blue and yellow make green', 'red and blue make purple', 'mixing paint'], example: {} },
  'alphabet-train': { title: 'The alphabet train', keywords: ['the alphabet', 'letters of the alphabet', 'a is for apple', 'capital and small letters', 'uppercase and lowercase letters', 'letter sounds', 'learning the abc', 'alphabet for kids'], example: {} },
  'shape-hunt': { title: 'Shape hunt', keywords: ['shape hunt', 'shapes around us', 'shapes in the house', 'circle square triangle', 'rectangle and oval', '2d shapes for kids', 'names of shapes', 'how many sides does a triangle have'], example: {} },
  'pattern-maker': { title: 'What comes next?', keywords: ['repeating pattern', 'repeating patterns', 'what comes next', 'ab pattern', 'aab pattern', 'abc pattern', 'continue the pattern', 'pattern of shapes'], example: {} },
  'adding-apples': { title: 'Adding apples', keywords: ['adding up', 'adding together', 'counting on', 'addition for kids', 'how many altogether', 'plus sign', 'add two groups', 'simple addition'], example: { a: 3, b: 2 } },
  'taking-away': { title: 'Taking away', keywords: ['taking away', 'take away', 'subtraction for kids', 'how many are left', 'minus sign', 'simple subtraction', 'fly away birds', 'take away sum'], example: { total: 5, gone: 2 } },
  'sharing-halves': { title: 'Halves and quarters', keywords: ['sharing equally', 'fair shares', 'halves and quarters', 'one half', 'one quarter', 'equal parts', 'cut in half', 'share a pizza'], example: {} },
  'size-order': { title: 'Putting things in order', keywords: ['smallest to biggest', 'biggest to smallest', 'tallest to shortest', 'ordering by size', 'order of size', 'big bigger biggest', 'tall taller tallest', 'comparing sizes'], example: {} },
  'measuring-kids': { title: 'Measuring with cubes', keywords: ['measuring length', 'longer and shorter', 'measure with cubes', 'non-standard units', 'how long is it', 'longest and shortest', 'comparing lengths', 'longer than'], example: {} },
  'balance-scale-kids': { title: 'Heavier or lighter?', keywords: ['heavier and lighter', 'heavier or lighter', 'balance scale', 'comparing weight', 'which is heavier', 'weighing objects', 'same weight', 'seesaw scale'], example: {} },
  'coins-counting': { title: 'Counting coins', keywords: ['counting coins', 'counting money', 'adding coins', 'coin values', 'piggy bank', 'saving money', 'how much money', 'value of coins'], example: { coins: [10, 5, 2, 2, 1] } },
  'symmetry-butterfly': { title: 'Symmetry', keywords: ['line of symmetry', 'symmetry for kids', 'symmetrical', 'mirror image', 'symmetrical butterfly', 'fold in half', 'both sides match', 'reflective symmetry'], example: {} },
  'number-line-hop': { title: 'Hopping on a number line', keywords: ['number line', 'hop along the number line', 'jumps on a number line', 'counting forwards and backwards', 'adding on a number line', 'subtracting on a number line', 'number line to 20', 'counting in ones'], example: { add: [3, 5], take: [12, 4] } },
  'odd-even': { title: 'Odd and even', keywords: ['odd and even', 'odd and even numbers', 'even numbers', 'odd numbers', 'odd or even', 'pairs of socks', 'numbers in pairs', 'one left over'], example: {} },
  'traffic-light': { title: 'Traffic lights', keywords: ['traffic lights', 'traffic light colours', 'road safety', 'crossing the road', 'stop look and listen', 'green man', 'zebra crossing', 'red means stop'], example: {} },
  'transport-sort': { title: 'Land, sea and air', keywords: ['types of transport', 'kinds of transport', 'land sea and air', 'land water and air transport', 'vehicles for kids', 'ways to travel', 'air transport', 'water transport'], example: {} },
  'musical-instruments': { title: 'Musical instruments', keywords: ['musical instruments', 'how instruments make sound', 'high and low notes', 'high and low sounds', 'pluck the strings', 'blow a trumpet', 'hit a drum', 'play the xylophone'], example: {} },
  'feelings-faces': { title: 'Feelings', keywords: ['feelings and emotions', 'how do you feel', 'happy and sad', 'feeling angry', 'feeling scared', 'calm down breathing', 'big feelings', 'naming emotions'], example: {} },
  'community-helpers': { title: 'People who help us', keywords: ['community helpers', 'people who help us', 'jobs people do', 'firefighter', 'police officer', 'doctor and nurse', 'what does a vet do', 'people in our community'], example: {} },
};

export function kids3Sims(kit) {
  // eslint-disable-next-line no-unused-vars
  const { FIG, COLORS, FONT, label, rounded, arrow, clamp, easeOut, outBack, color, tint } = kit;
  const X0 = FIG.x; const Y0 = FIG.y; const X1 = FIG.x + FIG.w; const Y1 = FIG.y + FIG.h;
  const cx = X0 + FIG.w / 2;
  const TAU = Math.PI * 2; const PI = Math.PI;
  const PUPIL = '#1a1630'; const DARKTEXT = '#1a1630';
  const SKINS = ['#f1c27d', '#8d5524', '#e0ac69', '#c68642', '#ffdbac', '#6b4226', '#f6c9a0', '#a0673e'];

  // Small tools: numbers, timing, loops.
  const val = (v, d) => { const n = Number(v); return v !== null && v !== undefined && v !== '' && Number.isFinite(n) ? n : d; };
  const mod = (a, n) => ((a % n) + n) % n;
  const smooth = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
  const lerp = (a, c, p) => a + (c - a) * p;
  const fade = (ctx, t, d = 0.5) => { const q = easeOut(clamp(t / d)); ctx.globalAlpha *= q; return q; };
  const after = (t, at, d = 0.4) => easeOut(clamp((t - at) / d));
  const cycle = (t, period, delay = 0.6) => (t < delay ? 0 : mod(t - delay, period));
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const pop = (t, at, d = 0.5) => (t <= at ? 0 : t >= at + d ? 1 : outBack((t - at) / d));
  const bump = (f, e = 0.12) => smooth(f / e) * smooth((1 - f) / e);
  const mix = (a, c, p) => { const A = parseInt(color(a).slice(1), 16); const B = parseInt(color(c).slice(1), 16); const ch = (s) => Math.round(lerp((A >> s) & 255, (B >> s) & 255, clamp(p))); return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`; };

  // Drawing helpers.
  const title = (ctx, text) => label(ctx, String(text), cx, Y0 + 28, { size: 26, weight: 700, fill: 'ink' });
  function chip(ctx, text, x, y, c = 'ink', size = 23, align = 'center') {
    text = String(text);
    ctx.font = `700 ${size}px ${FONT}`;
    const w = ctx.measureText(text).width + 28; const h = size + 16;
    const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.fillStyle = 'rgba(5,8,22,0.8)'; ctx.strokeStyle = tint(c, 0.6); ctx.lineWidth = 2;
    rounded(ctx, left, y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
    label(ctx, text, left + w / 2, y + 1, { size, weight: 700, fill: c });
  }
  function sc(ctx, x, y, s, fn) { if (!(s > 0.001)) return; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); fn(); ctx.restore(); }
  function circ(ctx, x, y, r, fill, stroke, lw = 3) {
    ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU);
    if (fill) { ctx.fillStyle = color(fill); ctx.fill(); }
    if (stroke) { ctx.strokeStyle = color(stroke); ctx.lineWidth = lw; ctx.stroke(); }
  }
  function oval(ctx, x, y, rx, ry, rot, fill, stroke, lw = 3) {
    ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, Math.abs(rx)), Math.max(0.1, Math.abs(ry)), rot || 0, 0, TAU);
    if (fill) { ctx.fillStyle = color(fill); ctx.fill(); }
    if (stroke) { ctx.strokeStyle = color(stroke); ctx.lineWidth = lw; ctx.stroke(); }
  }
  function line(ctx, x0, y0, x1, y1, c, w = 3, dash) {
    ctx.strokeStyle = color(c); ctx.lineWidth = w; ctx.lineCap = 'round';
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    if (dash) ctx.setLineDash([]);
  }
  function poly(ctx, pts, close = true) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    if (close) ctx.closePath();
  }
  function head(ctx, x, y, ang, s, c) {
    ctx.fillStyle = color(c); ctx.beginPath();
    ctx.moveTo(x + Math.cos(ang) * s, y + Math.sin(ang) * s);
    ctx.lineTo(x + Math.cos(ang + 2.4) * s, y + Math.sin(ang + 2.4) * s);
    ctx.lineTo(x + Math.cos(ang - 2.4) * s, y + Math.sin(ang - 2.4) * s);
    ctx.closePath(); ctx.fill();
  }
  function eyes(ctx, x, y, gap, r, k = 0, seed = 0, look = 0) {
    const bl = mod(k + seed * 1.37, 4.1) < 0.13 ? 0.12 : 1;
    for (const sx of [-1, 1]) {
      const ex = x + (sx * gap) / 2;
      oval(ctx, ex, y, r, r * bl, 0, '#ffffff');
      if (bl > 0.5) { circ(ctx, ex + look * r * 0.3, y + r * 0.1, r * 0.58, PUPIL); circ(ctx, ex + look * r * 0.3 - r * 0.22, y - r * 0.14, r * 0.2, '#ffffff'); }
    }
  }
  function dotEyes(ctx, x, y, gap, r, c = PUPIL) { circ(ctx, x - gap / 2, y, r, c); circ(ctx, x + gap / 2, y, r, c); }
  function smile(ctx, x, y, w, c = PUPIL, lw = 3, open = 0) {
    ctx.strokeStyle = color(c); ctx.lineWidth = lw; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y - w * 0.3, w, 0.2 * PI, 0.8 * PI); ctx.stroke();
    if (open) { ctx.fillStyle = '#c2185b'; ctx.beginPath(); ctx.arc(x, y - w * 0.3, w * 0.98, 0.2 * PI, 0.8 * PI); ctx.closePath(); ctx.fill(); }
  }
  function frown(ctx, x, y, w, c = PUPIL, lw = 3) {
    ctx.strokeStyle = color(c); ctx.lineWidth = lw; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y + w * 0.9, w, 1.22 * PI, 1.78 * PI); ctx.stroke();
  }
  function cheeks(ctx, x, y, gap, r) { circ(ctx, x - gap / 2, y, r, 'rgba(255,120,150,0.45)'); circ(ctx, x + gap / 2, y, r, 'rgba(255,120,150,0.45)'); }
  function sun(ctx, x, y, r, k, face = true) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(k * 0.25); ctx.fillStyle = '#ffb627';
    for (let i = 0; i < 12; i++) {
      ctx.rotate(TAU / 12); const L = r * (1.45 + 0.07 * Math.sin(k * 3 + i));
      ctx.beginPath(); ctx.moveTo(r * 1.1, -r * 0.17); ctx.lineTo(L, 0); ctx.lineTo(r * 1.1, r * 0.17); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    circ(ctx, x, y, r * 1.06, 'rgba(255,200,60,0.35)');
    circ(ctx, x, y, r, '#ffd23f');
    if (face) { dotEyes(ctx, x, y - r * 0.12, r * 0.62, r * 0.1); smile(ctx, x, y + r * 0.22, r * 0.34, '#b45309', Math.max(2, r * 0.07)); cheeks(ctx, x, y + r * 0.2, r * 0.95, r * 0.13); }
  }
  function cloud(ctx, x, y, s, fill = '#eef2ff') {
    ctx.fillStyle = color(fill); ctx.beginPath();
    for (const [dx, dy, r] of [[-40, 10, 26], [-14, -10, 34], [22, -4, 30], [46, 10, 22], [2, 14, 28]]) { ctx.moveTo(x + (dx + r) * s, y + dy * s); ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU); }
    ctx.fill();
  }
  function drop(ctx, x, y, r, fill) {
    ctx.fillStyle = color(fill); ctx.beginPath(); ctx.moveTo(x, y - r * 2.1);
    ctx.bezierCurveTo(x + r * 0.35, y - r * 1.2, x + r, y - r * 0.6, x + r, y);
    ctx.arc(x, y, r, 0, PI);
    ctx.bezierCurveTo(x - r, y - r * 0.6, x - r * 0.35, y - r * 1.2, x, y - r * 2.1); ctx.fill();
  }
  function leaf(ctx, x, y, len, wid, ang, fill, vein = 'rgba(255,255,255,0.45)') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = color(fill); ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.45, -wid, len, 0); ctx.quadraticCurveTo(len * 0.45, wid, 0, 0); ctx.fill();
    if (vein) { ctx.strokeStyle = vein; ctx.lineWidth = Math.max(1.5, len * 0.025); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * 0.85, 0); ctx.stroke(); }
    ctx.restore();
  }
  function starPath(ctx, x, y, r1, r2, n = 5, rot = -PI / 2) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1; const a = rot + (i * PI) / n; const px = x + Math.cos(a) * r; const py = y + Math.sin(a) * r; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.closePath();
  }
  function heartPath(ctx, x, y, r) {
    ctx.beginPath(); ctx.moveTo(x, y + r * 0.95);
    ctx.bezierCurveTo(x - r * 1.5, y - r * 0.05, x - r * 0.75, y - r * 1.25, x, y - r * 0.42);
    ctx.bezierCurveTo(x + r * 0.75, y - r * 1.25, x + r * 1.5, y - r * 0.05, x, y + r * 0.95);
    ctx.closePath();
  }
  function tick(ctx, x, y, s, c = 'green') {
    ctx.strokeStyle = color(c); ctx.lineWidth = s * 0.22; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - s * 0.45, y); ctx.lineTo(x - s * 0.12, y + s * 0.32); ctx.lineTo(x + s * 0.5, y - s * 0.38); ctx.stroke();
  }
  function scene(ctx, x, y, w, h, top, bottom, r = 22) {
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, color(top)); g.addColorStop(1, color(bottom));
    ctx.fillStyle = g; rounded(ctx, x, y, w, h, r); ctx.fill();
  }
  function clipRect(ctx, x, y, w, h, r = 0) { rounded(ctx, x, y, w, h, r); ctx.clip(); }
  // A number sentence: [text, colour, alpha] parts side by side, centred.
  function sentence(ctx, parts, x, y, size = 52, maxW = 740) {
    const gap = () => size * 0.32;
    const width = () => { ctx.font = `800 ${size}px ${FONT}`; return parts.reduce((s, [p]) => s + ctx.measureText(String(p)).width, 0) + (parts.length - 1) * gap(); };
    let w = width();
    if (w > maxW) { size = Math.max(24, Math.floor((size * maxW) / w)); w = width(); }
    let px = x - w / 2;
    for (const [p, c, a = 1] of parts) {
      ctx.font = `800 ${size}px ${FONT}`; const pw = ctx.measureText(String(p)).width;
      if (a > 0.01) { ctx.save(); ctx.globalAlpha *= clamp(a); label(ctx, String(p), px + pw / 2, y, { size, weight: 800, fill: c }); ctx.restore(); }
      px += pw + gap();
    }
  }
  // A stacked fraction n/d centred on (x, y).
  function frac(ctx, n, d, x, y, size = 24, c = DARKTEXT) {
    label(ctx, String(n), x, y - size * 0.6, { size, weight: 800, fill: c });
    line(ctx, x - size * 0.42, y, x + size * 0.42, y, c, Math.max(2.5, size * 0.11));
    label(ctx, String(d), x, y + size * 0.64, { size, weight: 800, fill: c });
  }
  function apple(ctx, x, y, r, fill = '#ef4444') {
    ctx.fillStyle = color(fill); ctx.beginPath();
    ctx.arc(x - r * 0.38, y, r * 0.78, 0, TAU); ctx.arc(x + r * 0.38, y, r * 0.78, 0, TAU); ctx.fill();
    oval(ctx, x, y + r * 0.25, r * 0.95, r * 0.6, 0, fill);
    line(ctx, x, y - r * 0.55, x + r * 0.12, y - r * 1.05, '#6b4a2e', Math.max(2, r * 0.13));
    leaf(ctx, x + r * 0.1, y - r * 0.85, r * 0.75, r * 0.3, -0.5, '#3fbf5f', null);
    oval(ctx, x - r * 0.42, y - r * 0.3, r * 0.18, r * 0.28, 0.5, 'rgba(255,255,255,0.45)');
  }
  // A simple note symbol drawn with paths (no font glyphs).
  function note(ctx, x, y, s, c) {
    oval(ctx, x, y, 9 * s, 6.5 * s, -0.4, c);
    line(ctx, x + 8 * s, y - 2 * s, x + 8 * s, y - 34 * s, c, 3 * s);
    ctx.strokeStyle = color(c); ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(x + 8 * s, y - 34 * s); ctx.quadraticCurveTo(x + 20 * s, y - 26 * s, x + 17 * s, y - 14 * s); ctx.stroke();
  }
  // A child standing, feet at gy, h tall.
  function kid(ctx, x, gy, h, shirt = '#5b8cff', k = 0, back = false, skin = SKINS[6], hair = '#5a3a24', step = 0) {
    const u = h / 100;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3b4a7a'; ctx.lineWidth = 9 * u; ctx.beginPath();
    ctx.moveTo(x - 6 * u, gy - 32 * u); ctx.lineTo(x - 7 * u, gy - 4 * u - Math.max(0, step) * 6 * u); ctx.moveTo(x + 6 * u, gy - 32 * u); ctx.lineTo(x + 7 * u, gy - 4 * u - Math.max(0, -step) * 6 * u); ctx.stroke();
    ctx.strokeStyle = skin; ctx.lineWidth = 7 * u; ctx.beginPath();
    ctx.moveTo(x - 13 * u, gy - 58 * u); ctx.lineTo(x - 21 * u, gy - 36 * u + step * 4 * u);
    ctx.moveTo(x + 13 * u, gy - 58 * u); ctx.lineTo(x + 21 * u, gy - 36 * u - step * 4 * u); ctx.stroke();
    ctx.fillStyle = color(shirt); rounded(ctx, x - 15 * u, gy - 64 * u, 30 * u, 36 * u, 10 * u); ctx.fill();
    circ(ctx, x, gy - 80 * u, 17 * u, skin);
    ctx.fillStyle = hair; ctx.beginPath();
    if (back) ctx.arc(x, gy - 81 * u, 17.5 * u, PI * 0.95, PI * 2.05);
    else ctx.arc(x, gy - 83 * u, 17 * u, PI * 1.05, PI * 1.95);
    ctx.fill();
    if (!back) { dotEyes(ctx, x, gy - 80 * u, 12 * u, 2.2 * u); smile(ctx, x, gy - 72 * u, 5 * u, PUPIL, 2 * u); }
  }
  // A wobbly paint blob with a face.
  function blob(ctx, x, y, r, fill, k, seed = 0) {
    if (!(r > 0.5)) return;
    ctx.fillStyle = color(fill); ctx.beginPath();
    for (let j = 0; j <= 28; j++) {
      const a = (j / 28) * TAU; const rr = r * (1 + 0.06 * Math.sin(a * 3 + k * 2 + seed) + 0.04 * Math.sin(a * 5 - k * 3 + seed));
      const px = x + Math.cos(a) * rr; const py = y + Math.sin(a) * rr * 0.92;
      if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    oval(ctx, x - r * 0.4, y - r * 0.45, r * 0.18, r * 0.12, -0.5, 'rgba(255,255,255,0.5)');
    eyes(ctx, x, y - r * 0.1, r * 0.62, r * 0.17, k, seed);
    smile(ctx, x, y + r * 0.3, r * 0.26, PUPIL, Math.max(2, r * 0.06));
  }

  // ─── The alphabet's pictures, each drawn round (0, 0) in about ±40 ─────
  const WORDS = ['apple', 'ball', 'cat', 'duck', 'egg', 'fish', 'grapes', 'hat', 'igloo', 'jam', 'kite', 'leaf', 'moon', 'nest', 'orange', 'pear', 'quilt', 'rainbow', 'sun', 'tree', 'umbrella', 'van', 'watermelon', 'xylophone', 'yo-yo', 'zebra'];
  function abcObj(ctx, i, k) {
    switch (i) {
      case 0: apple(ctx, 0, 6, 32); break;
      case 1: circ(ctx, 0, 0, 34, '#3b82f6'); ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.clip(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(-40, 0, 34, -1, 1); ctx.stroke(); ctx.beginPath(); ctx.arc(40, 0, 34, PI - 1, PI + 1); ctx.stroke(); ctx.restore(); circ(ctx, -12, -14, 6, 'rgba(255,255,255,0.5)'); break;
      case 2: ctx.fillStyle = '#fb923c'; poly(ctx, [-30, -6, -26, -40, -6, -22]); ctx.fill(); poly(ctx, [30, -6, 26, -40, 6, -22]); ctx.fill(); circ(ctx, 0, 4, 30, '#fb923c'); dotEyes(ctx, 0, -2, 22, 4); ctx.fillStyle = '#f472b6'; poly(ctx, [-5, 8, 5, 8, 0, 14]); ctx.fill(); ctx.strokeStyle = PUPIL; ctx.lineWidth = 2; ctx.beginPath(); for (const s of [-1, 1]) { ctx.moveTo(s * 10, 13); ctx.lineTo(s * 34, 8); ctx.moveTo(s * 10, 16); ctx.lineTo(s * 34, 20); } ctx.stroke(); break;
      case 3: oval(ctx, 6, 14, 34, 20, 0, '#facc15'); circ(ctx, -14, -14, 17, '#facc15'); ctx.fillStyle = '#fb923c'; poly(ctx, [-28, -16, -46, -10, -28, -5]); ctx.fill(); circ(ctx, -16, -18, 3.5, PUPIL); oval(ctx, 12, 10, 16, 9, -0.3, '#eab308'); break;
      case 4: oval(ctx, 0, 2, 27, 35, 0, '#fff3dc', '#e7cfa0', 3); oval(ctx, -9, -12, 5, 9, 0.3, 'rgba(255,255,255,0.8)'); break;
      case 5: ctx.fillStyle = '#14b8a6'; poly(ctx, [22, 0, 44, -20, 44, 20]); ctx.fill(); oval(ctx, -6, 0, 32, 20, 0, '#2dd4bf'); circ(ctx, -22, -5, 4, PUPIL); line(ctx, -2, -14, -2, 14, 'rgba(255,255,255,0.5)', 3); line(ctx, 8, -12, 8, 12, 'rgba(255,255,255,0.5)', 3); break;
      case 6: line(ctx, 0, -34, 4, -42, '#6b4a2e', 4); leaf(ctx, 2, -36, 26, 10, -0.4, '#22c55e', null); for (const [gx, gy] of [[-18, -22], [0, -22], [18, -22], [-9, -4], [9, -4], [-18, 14], [0, 14], [18, 14], [-9, 30], [9, 30]].slice(0, 9)) circ(ctx, gx, gy, 11, '#8b5cf6'); circ(ctx, -4, -26, 3, 'rgba(255,255,255,0.5)'); break;
      case 7: oval(ctx, 0, 18, 42, 10, 0, '#fb923c'); ctx.fillStyle = '#fb923c'; rounded(ctx, -22, -22, 44, 42, 12); ctx.fill(); ctx.fillStyle = '#ef4444'; ctx.fillRect(-22, 4, 44, 9); break;
      case 8: ctx.fillStyle = '#dbeafe'; ctx.beginPath(); ctx.arc(0, 28, 42, PI, TAU); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 3; ctx.stroke(); ctx.lineWidth = 2.5; ctx.beginPath(); for (const yy of [14, 0, -12]) { const w = Math.sqrt(Math.max(0, 42 * 42 - (28 - yy) ** 2)); ctx.moveTo(-w, yy); ctx.lineTo(w, yy); } for (const [xx, y0, y1] of [[-22, 14, 28], [22, 14, 28], [-30, 0, 14], [0, 0, 14], [30, 0, 14], [-14, -12, 0], [14, -12, 0]]) { ctx.moveTo(xx, y0); ctx.lineTo(xx, y1); } ctx.stroke(); ctx.fillStyle = '#dbeafe'; ctx.beginPath(); ctx.arc(0, 28, 17, PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1e3a8a'; ctx.beginPath(); ctx.arc(0, 28, 11, PI, TAU); ctx.closePath(); ctx.fill(); line(ctx, -46, 29, 46, 29, '#93c5fd', 3); break;
      case 9: ctx.fillStyle = '#be123c'; rounded(ctx, -24, -14, 48, 50, 10); ctx.fill(); ctx.fillStyle = '#fde68a'; rounded(ctx, -28, -26, 56, 14, 5); ctx.fill(); ctx.fillStyle = '#ffffff'; rounded(ctx, -16, 2, 32, 18, 4); ctx.fill(); circ(ctx, 0, 11, 5, '#f43f5e'); break;
      case 10: ctx.fillStyle = '#a855f7'; poly(ctx, [0, -38, 26, -6, 0, 28, -26, -6]); ctx.fill(); line(ctx, 0, -38, 0, 28, 'rgba(255,255,255,0.6)', 2.5); line(ctx, -26, -6, 26, -6, 'rgba(255,255,255,0.6)', 2.5); ctx.strokeStyle = '#e9eeff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 28); ctx.quadraticCurveTo(12 + Math.sin(k * 3) * 6, 36, 4, 44); ctx.stroke(); ctx.fillStyle = '#f472b6'; poly(ctx, [2, 34, 12, 30, 12, 38]); ctx.fill(); break;
      case 11: leaf(ctx, -30, 26, 72, 26, -0.75, '#22c55e'); break;
      case 12: ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(0, 0, 34, -1.27, 1.27, true); ctx.quadraticCurveTo(-22, 0, 10, -32.4); ctx.closePath(); ctx.fill(); break;
      case 13: { for (const [ex, ey] of [[-16, -6], [16, -6], [0, -12]]) { oval(ctx, ex, ey, 12, 15, 0, '#7dd3fc'); circ(ctx, ex - 4, ey - 6, 2.5, '#ffffff'); } ctx.fillStyle = '#92400e'; ctx.beginPath(); ctx.ellipse(0, 4, 44, 30, 0, 0, PI); ctx.closePath(); ctx.fill(); oval(ctx, 0, 4, 44, 9, 0, '#b45309'); ctx.strokeStyle = '#d97706'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); for (let j = 0; j < 9; j++) { const a = 0.2 + j * 0.33; const x0 = Math.cos(a) * 40; const y0 = 6 + Math.sin(a) * 24; ctx.moveTo(x0 - 14, y0 - 4 + (j % 2) * 6); ctx.lineTo(x0 + 14, y0 + 2 - (j % 2) * 6); } ctx.moveTo(-50, -2); ctx.lineTo(-36, 6); ctx.moveTo(50, -2); ctx.lineTo(36, 6); ctx.stroke(); break; }
      case 14: circ(ctx, 0, 4, 32, '#fb923c'); for (let j = 0; j < 5; j++) circ(ctx, -14 + rnd(j) * 28, -8 + rnd(j + 4) * 28, 1.6, 'rgba(160,70,0,0.5)'); leaf(ctx, 2, -26, 22, 9, -0.6, '#22c55e', null); break;
      case 15: circ(ctx, 0, 14, 26, '#a3e635'); circ(ctx, 0, -10, 17, '#a3e635'); line(ctx, 0, -26, 3, -38, '#6b4a2e', 4); leaf(ctx, 3, -32, 20, 8, -0.3, '#16a34a', null); break;
      case 16: { const QC = ['#f472b6', '#facc15', '#60a5fa', '#34d399', '#fb923c', '#a78bfa', '#60a5fa', '#f472b6', '#facc15']; for (let j = 0; j < 9; j++) { ctx.fillStyle = QC[j]; ctx.fillRect(-33 + (j % 3) * 22, -33 + Math.floor(j / 3) * 22, 22, 22); } ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.strokeRect(-30, -30, 60, 60); ctx.setLineDash([]); break; }
      case 17: ['#ef4444', '#fb923c', '#facc15', '#22c55e', '#3b82f6'].forEach((c, j) => { ctx.strokeStyle = c; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 22, 38 - j * 6, PI, TAU); ctx.stroke(); }); cloud(ctx, -36, 24, 0.32, '#ffffff'); cloud(ctx, 36, 24, 0.32, '#ffffff'); break;
      case 18: sun(ctx, 0, 0, 23, k); break;
      case 19: ctx.fillStyle = '#92400e'; ctx.fillRect(-7, 6, 14, 34); for (const [tx, ty, r] of [[0, -18, 22], [-17, -2, 17], [17, -2, 17], [0, 2, 18]]) circ(ctx, tx, ty, r, '#22c55e'); circ(ctx, -6, -22, 4, '#ef4444'); circ(ctx, 10, -6, 4, '#ef4444'); break;
      case 20: ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, 2, 40, PI, TAU); for (let j = 3; j >= 0; j--) ctx.arc(-30 + j * 20, 2, 10, 0, PI, true); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#334155'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(0, 30); ctx.arc(-7, 30, 7, 0, PI); ctx.stroke(); break;
      case 21: ctx.fillStyle = '#38bdf8'; rounded(ctx, -42, -24, 84, 40, 9); ctx.fill(); ctx.fillStyle = '#e0f2fe'; rounded(ctx, 14, -18, 22, 16, 4); ctx.fill(); rounded(ctx, -12, -18, 22, 16, 4); ctx.fill(); for (const wx of [-24, 24]) { circ(ctx, wx, 18, 10, '#1f2937'); circ(ctx, wx, 18, 4, '#cbd5e1'); } break;
      case 22: ctx.fillStyle = '#16a34a'; ctx.beginPath(); ctx.arc(0, -14, 42, 0, PI); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ecfccb'; ctx.beginPath(); ctx.arc(0, -14, 36, 0, PI); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#f43f5e'; ctx.beginPath(); ctx.arc(0, -14, 32, 0, PI); ctx.closePath(); ctx.fill(); for (const [sx, sy] of [[-16, -4], [0, 4], [16, -4], [-6, 10], [8, 12]]) oval(ctx, sx, sy, 2.5, 4, 0, PUPIL); break;
      case 23: line(ctx, -40, -14, 40, -8, '#92400e', 5); line(ctx, -40, 18, 40, 10, '#92400e', 5); ['#ef4444', '#fb923c', '#facc15', '#22c55e', '#3b82f6'].forEach((c, j) => { const h = 50 - j * 6; ctx.fillStyle = c; rounded(ctx, -36 + j * 16, 2 - h / 2, 13, h, 3); ctx.fill(); }); break;
      case 24: { const yy = 12 + Math.sin(k * 3) * 5; line(ctx, 0, -40, 0, yy, '#e9eeff', 2.5); circ(ctx, 0, yy, 26, '#ec4899'); circ(ctx, 0, yy, 16, '#f9a8d4'); circ(ctx, 0, yy, 5, '#831843'); break; }
      case 25: {
        for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 15, -34); ctx.rotate(s * 0.35); oval(ctx, 0, 0, 7, 14, 0, '#ffffff', '#1f2937', 2.5); oval(ctx, 0, 2, 3, 8, 0, '#f9a8d4'); ctx.restore(); }
        ctx.fillStyle = '#1f2937'; poly(ctx, [-8, -30, -4, -46, 0, -32, 4, -46, 8, -30]); ctx.fill();
        ctx.save(); oval(ctx, 0, 0, 23, 36, 0, '#ffffff'); ctx.clip(); ctx.fillStyle = '#1f2937';
        for (const yy of [-28, -16, -4, 8]) { ctx.beginPath(); ctx.moveTo(-26, yy); ctx.quadraticCurveTo(0, yy + 7, 26, yy); ctx.lineTo(26, yy + 5); ctx.quadraticCurveTo(0, yy + 12, -26, yy + 5); ctx.closePath(); ctx.fill(); }
        ctx.restore(); oval(ctx, 0, 0, 23, 36, 0, null, '#1f2937', 2.5);
        circ(ctx, -12, -6, 6, '#ffffff', '#1f2937', 2); circ(ctx, 12, -6, 6, '#ffffff', '#1f2937', 2); circ(ctx, -11, -5, 3, PUPIL); circ(ctx, 13, -5, 3, PUPIL);
        oval(ctx, 0, 24, 17, 13, 0, '#6b7280'); oval(ctx, -6, 22, 2.5, 3.5, 0, '#111827'); oval(ctx, 6, 22, 2.5, 3.5, 0, '#111827');
        break;
      }
      default: break;
    }
  }

  // ─── Transport, each facing right ──────────────────────────────────────
  function wheel(ctx, x, y, r, spin = 0) {
    circ(ctx, x, y, r, '#1f2937'); circ(ctx, x, y, r * 0.45, '#cbd5e1');
    line(ctx, x, y, x + Math.cos(spin) * r * 0.8, y + Math.sin(spin) * r * 0.8, '#1f2937', 2);
  }
  const VEH = {
    car(ctx, x, base, spin) { ctx.fillStyle = '#ef4444'; rounded(ctx, x - 50, base - 40, 100, 28, 10); ctx.fill(); rounded(ctx, x - 28, base - 60, 54, 26, 10); ctx.fill(); ctx.fillStyle = '#bfe6ff'; rounded(ctx, x - 22, base - 55, 22, 16, 4); ctx.fill(); rounded(ctx, x + 3, base - 55, 18, 16, 4); ctx.fill(); circ(ctx, x + 46, base - 30, 4, '#fde68a'); wheel(ctx, x - 28, base - 10, 11, spin); wheel(ctx, x + 28, base - 10, 11, spin); },
    bus(ctx, x, base, spin) { ctx.fillStyle = '#facc15'; rounded(ctx, x - 80, base - 66, 160, 54, 10); ctx.fill(); ctx.fillStyle = '#bfe6ff'; for (let j = 0; j < 5; j++) { rounded(ctx, x - 70 + j * 27, base - 58, 21, 20, 4); ctx.fill(); } rounded(ctx, x + 66, base - 58, 10, 26, 3); ctx.fill(); ctx.fillStyle = '#f97316'; ctx.fillRect(x - 80, base - 32, 160, 6); circ(ctx, x + 76, base - 20, 4, '#fde68a'); wheel(ctx, x - 50, base - 10, 12, spin); wheel(ctx, x + 50, base - 10, 12, spin); },
    train(ctx, x, base, spin) {
      for (const [ox, c] of [[-110, '#3b82f6'], [-30, '#a855f7']]) { ctx.fillStyle = c; rounded(ctx, x + ox - 36, base - 58, 72, 44, 8); ctx.fill(); ctx.fillStyle = '#e0f2fe'; rounded(ctx, x + ox - 26, base - 50, 20, 16, 3); ctx.fill(); rounded(ctx, x + ox + 4, base - 50, 20, 16, 3); ctx.fill(); wheel(ctx, x + ox - 20, base - 9, 9, spin); wheel(ctx, x + ox + 20, base - 9, 9, spin); }
      ctx.fillStyle = '#22c55e'; rounded(ctx, x + 14, base - 46, 78, 34, 10); ctx.fill(); rounded(ctx, x + 12, base - 76, 38, 64, 6); ctx.fill(); ctx.fillStyle = '#1f2937'; ctx.fillRect(x + 64, base - 64, 14, 20); ctx.fillStyle = '#bfe6ff'; rounded(ctx, x + 20, base - 70, 22, 18, 4); ctx.fill(); circ(ctx, x + 92, base - 30, 5, '#fde68a');
      wheel(ctx, x + 30, base - 11, 11, spin); wheel(ctx, x + 72, base - 11, 11, spin);
    },
    boat(ctx, x, base, k) { const bob = Math.sin(k * 2) * 3; ctx.save(); ctx.translate(x, base + bob); ctx.rotate(Math.sin(k * 1.6) * 0.04); line(ctx, 0, -14, 0, -96, '#78350f', 4); ctx.fillStyle = '#ffffff'; poly(ctx, [4, -92, 4, -22, 52, -22]); ctx.fill(); ctx.fillStyle = '#fde68a'; poly(ctx, [-4, -84, -4, -22, -40, -22]); ctx.fill(); ctx.fillStyle = '#ef4444'; poly(ctx, [0, -96, 18, -90, 0, -84]); ctx.fill(); ctx.fillStyle = '#b45309'; poly(ctx, [-58, -18, 62, -18, 44, 8, -42, 8]); ctx.fill(); circ(ctx, -18, -6, 4, '#fde68a'); circ(ctx, 2, -6, 4, '#fde68a'); circ(ctx, 22, -6, 4, '#fde68a'); ctx.restore(); },
    submarine(ctx, x, y, k) { line(ctx, x + 6, y - 38, x + 6, y - 56, '#64748b', 4); line(ctx, x + 6, y - 56, x + 18, y - 56, '#64748b', 4); ctx.fillStyle = '#facc15'; rounded(ctx, x - 22, y - 42, 40, 22, 8); ctx.fill(); oval(ctx, x, y, 64, 27, 0, '#facc15'); for (const px of [-28, -4, 20]) circ(ctx, x + px, y, 7.5, '#bae6fd', '#ca8a04', 3); const pr = Math.abs(Math.sin(k * 14)); oval(ctx, x - 70, y, 5, 14 * pr + 2, 0, '#64748b'); for (let j = 0; j < 3; j++) { const q = mod(k * 0.8 + j / 3, 1); circ(ctx, x + 50 + Math.sin(q * 9 + j) * 4, y - 20 - q * 50, 3 + 3 * q, `rgba(220,240,255,${0.7 * (1 - q)})`); } },
    plane(ctx, x, y) { ctx.fillStyle = '#ef4444'; poly(ctx, [x - 66, y - 4, x - 82, y - 34, x - 64, y - 34, x - 40, y - 6]); ctx.fill(); oval(ctx, x - 4, y, 72, 16, 0, '#f8fafc'); ctx.fillStyle = '#3b82f6'; poly(ctx, [x - 8, y + 2, x + 16, y + 2, x - 18, y + 36, x - 34, y + 36]); ctx.fill(); for (let j = 0; j < 5; j++) circ(ctx, x - 30 + j * 15, y - 4, 3.6, '#60a5fa'); ctx.fillStyle = '#1e3a8a'; ctx.beginPath(); ctx.arc(x + 52, y - 3, 10, -PI / 2, 0.2); ctx.lineTo(x + 52, y); ctx.fill(); },
    helicopter(ctx, x, y, k, dir = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1); line(ctx, -20, 0, -76, -8, '#dc2626', 9); const tr = Math.abs(Math.sin(k * 20)); oval(ctx, -78, -8, 4, 14 * tr + 2, 0, '#475569'); circ(ctx, 0, 0, 27, '#ef4444'); ctx.fillStyle = '#bfe6ff'; ctx.beginPath(); ctx.arc(4, -2, 19, -1.3, 0.9); ctx.lineTo(4, -2); ctx.fill(); line(ctx, -16, 30, 22, 30, '#475569', 4); line(ctx, -8, 24, -8, 30, '#475569', 3); line(ctx, 12, 24, 12, 30, '#475569', 3); line(ctx, 0, -27, 0, -36, '#475569', 4); const rw = 30 + 40 * Math.abs(Math.cos(k * 18)); line(ctx, -rw, -37, rw, -37, '#475569', 4); ctx.restore(); },
    balloon(ctx, x, y) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, 40, PI * 0.8, PI * 0.2); ctx.lineTo(x + 12, y + 46); ctx.lineTo(x - 12, y + 46); ctx.closePath(); ctx.fillStyle = '#f43f5e'; ctx.fill(); ctx.clip(); ctx.fillStyle = '#facc15'; ctx.fillRect(x - 10, y - 50, 20, 100); ctx.fillStyle = '#60a5fa'; ctx.fillRect(x - 40, y - 50, 12, 100); ctx.fillRect(x + 28, y - 50, 12, 100); ctx.restore(); ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 11, y + 46); ctx.lineTo(x - 10, y + 60); ctx.moveTo(x + 11, y + 46); ctx.lineTo(x + 10, y + 60); ctx.stroke(); ctx.fillStyle = '#a16207'; rounded(ctx, x - 13, y + 58, 26, 18, 4); ctx.fill(); },
  };

  // ─── A grown-up helper standing, feet at gy, h tall; returns the hand ──
  function person(ctx, x, gy, h, o) {
    const u = h / 100; const hand = o.hand || [22, -42];
    ctx.lineCap = 'round';
    if (o.hair === 'long') { ctx.fillStyle = o.hairC; rounded(ctx, x - 17 * u, gy - 106 * u, 34 * u, 38 * u, 12 * u); ctx.fill(); }
    ctx.strokeStyle = o.pants; ctx.lineWidth = 10 * u; ctx.beginPath();
    ctx.moveTo(x - 7 * u, gy - 40 * u); ctx.lineTo(x - 8 * u, gy - 5 * u); ctx.moveTo(x + 7 * u, gy - 40 * u); ctx.lineTo(x + 8 * u, gy - 5 * u); ctx.stroke();
    oval(ctx, x - 10 * u, gy - 3 * u, 8 * u, 4 * u, 0, '#2a2140'); oval(ctx, x + 10 * u, gy - 3 * u, 8 * u, 4 * u, 0, '#2a2140');
    ctx.fillStyle = o.shirt; rounded(ctx, x - 17 * u, gy - 80 * u, 34 * u, o.coat ? 56 * u : 44 * u, 11 * u); ctx.fill();
    ctx.strokeStyle = o.sleeve || o.shirt; ctx.lineWidth = 8 * u; ctx.beginPath();
    ctx.moveTo(x - 14 * u, gy - 74 * u); ctx.lineTo(x - 22 * u, gy - 44 * u); ctx.moveTo(x + 14 * u, gy - 74 * u); ctx.lineTo(x + hand[0] * u, gy + hand[1] * u); ctx.stroke();
    circ(ctx, x - 22 * u, gy - 44 * u, 4.5 * u, o.skin); circ(ctx, x + hand[0] * u, gy + hand[1] * u, 4.5 * u, o.skin);
    circ(ctx, x, gy - 93 * u, 15 * u, o.skin);
    ctx.fillStyle = o.hairC;
    if (o.hair === 'curly') { for (let j = 0; j < 7; j++) { const a = PI * (1.05 + j * 0.15); circ(ctx, x + Math.cos(a) * 15 * u, gy - 95 * u + Math.sin(a) * 14 * u, 6 * u, o.hairC); } } else if (o.hair !== 'none') { ctx.beginPath(); ctx.arc(x, gy - 96 * u, 15.5 * u, PI * 1.02, PI * 1.98); ctx.fill(); }
    if (o.hair === 'bun') circ(ctx, x, gy - 112 * u, 7 * u, o.hairC);
    dotEyes(ctx, x, gy - 92 * u, 11 * u, 2 * u); smile(ctx, x, gy - 85 * u, 4.5 * u, PUPIL, 1.8 * u);
    return [x + hand[0] * u, gy + hand[1] * u];
  }

  return {
    // ─── Colours, letters, shapes and patterns ──────────────────────────

    // Two paint blobs drip into a bowl and swirl into a new colour: red and
    // yellow make orange, yellow and blue make green, blue and red make
    // purple; the primary and secondary colours light up below.
    'colour-mixing'(b, ctx, it, t) {
      const k = b.clock; const P = 5.6;
      const PAINT = { red: '#ef4444', yellow: '#facc15', blue: '#3b82f6', orange: '#fb923c', green: '#22c55e', purple: '#a855f7' };
      const MIX = [['Red', 'red', 'Yellow', 'yellow', 'Orange', 'orange'], ['Yellow', 'yellow', 'Blue', 'blue', 'Green', 'green'], ['Blue', 'blue', 'Red', 'red', 'Purple', 'purple']];
      const u = cycle(t, P * 3, 0.3); const i = Math.floor(u / P) % 3; const tau = u - i * P;
      const [nA, kA, nB, kB, nC, kC] = MIX[i]; const cA = PAINT[kA]; const cB = PAINT[kB]; const cC = PAINT[kC];
      const rowY = Y0 + 172; const XA = cx - 270; const XB = cx; const XC = cx + 270; const bx = cx; const by = Y0 + 410;
      const show = smooth(tau / 0.3) * smooth((P - tau) / 0.3);
      const pA = pop(tau, 0.05); const pB = pop(tau, 0.35); const landA = tau > 1.8; const landB = tau > 2.2;
      const m = smooth((tau - 2.3) / 1.1); const pC = pop(tau, 3.4, 0.6);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Mixing colours');
      ctx.save(); ctx.globalAlpha *= show;
      blob(ctx, XA, rowY, 54 * pA, cA, k, 1);
      label(ctx, '+', (XA + XB) / 2, rowY, { size: 60, weight: 800, fill: 'ink' });
      blob(ctx, XB, rowY, 54 * pB, cB, k, 2);
      label(ctx, '=', (XB + XC) / 2, rowY, { size: 60, weight: 800, fill: 'ink' });
      if (pC > 0) blob(ctx, XC, rowY, 60 * pC, cC, k, 3); else label(ctx, '?', XC, rowY, { size: 64, weight: 800, fill: 'muted' });
      ctx.save(); ctx.globalAlpha *= clamp(pA); label(ctx, nA, XA, rowY + 84, { size: 28, weight: 800, fill: cA }); ctx.restore();
      ctx.save(); ctx.globalAlpha *= clamp(pB); label(ctx, nB, XB, rowY + 84, { size: 28, weight: 800, fill: cB }); ctx.restore();
      if (pC > 0) { ctx.save(); ctx.globalAlpha *= clamp(pC); label(ctx, nC, XC, rowY + 84, { size: 30, weight: 800, fill: cC }); ctx.restore(); }
      // The bowl: back rim, paint, spoon, front.
      oval(ctx, bx, by, 150, 36, 0, '#c7d5ff');
      if (landA) {
        ctx.save(); oval(ctx, bx, by + 3, 134, 27, 0, cA); ctx.clip();
        if (landB) {
          ctx.translate(bx, by + 3); ctx.scale(1, 0.21);
          ctx.strokeStyle = cB; ctx.lineWidth = 30; ctx.lineCap = 'round'; ctx.beginPath();
          for (let j = 0; j <= 48; j++) { const a = j * 0.26 + k * 2.4; const r = 6 + j * 2.6; if (j) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); else ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
          ctx.stroke();
          ctx.globalAlpha *= m; ctx.fillStyle = cC; ctx.fillRect(-160, -160, 320, 320);
        }
        ctx.restore();
      }
      if (landB && tau < 4.4) { const a = k * 2.4; const sx = bx + Math.cos(a) * 60; const sy = by + 3 + Math.sin(a) * 12; line(ctx, sx, sy, sx + 70, sy - 120, '#b45309', 9); oval(ctx, sx, sy, 14, 6, 0, '#d97706'); }
      ctx.fillStyle = '#7c9cff'; ctx.beginPath(); ctx.ellipse(bx, by, 150, 36, 0, 0, PI, false); ctx.ellipse(bx, by, 150, 104, 0, PI, 0, true); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e0e7ff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(bx, by, 150, 36, 0, 0, TAU); ctx.stroke();
      oval(ctx, bx - 80, by + 52, 18, 8, -0.5, 'rgba(255,255,255,0.35)');
      // Drips flying into the bowl.
      for (const [x0, c, at, x1] of [[XA, cA, 1.0, bx - 40], [XB, cB, 1.4, bx + 40]]) {
        if (tau > at && tau < at + 0.8) { const q = smooth((tau - at) / 0.8); drop(ctx, lerp(x0, x1, q), lerp(rowY + 40, by - 4, q) - Math.sin(q * PI) * 50, 13, c); }
      }
      ctx.restore();
      // Primary and secondary colours.
      [[['red', 'yellow', 'blue'], cx - 200, 'Primary colours'], [['orange', 'green', 'purple'], cx + 200, 'Secondary colours']].forEach(([L, gx, name], s) => {
        L.forEach((key, j) => { const on = s === 0 ? key === kA || key === kB : key === kC && pC > 0.5; circ(ctx, gx + (j - 1) * 66, Y1 - 130, on ? 25 : 19, PAINT[key], on ? '#ffffff' : null, 4); });
        label(ctx, name, gx, Y1 - 86, { size: 24, weight: 800, fill: 'ink' });
      });
      chip(ctx, tau < 3.4 ? `Mix ${nA.toLowerCase()} and ${nB.toLowerCase()}…` : `${nA} and ${nB.toLowerCase()} make ${nC.toLowerCase()}!`, cx, Y1 - 32, tau < 3.4 ? 'ink' : cC, 24);
      ctx.restore();
    },

    // A train of carriages, one per letter, chugs past and stops at each:
    // a capital and a small letter with a picture and its word.
    'alphabet-train'(b, ctx, it, t) {
      const k = b.clock; const N = 28; const D = 2.1; const pitch = 214;
      const u = Math.max(0, t - 0.8); const n = Math.floor(u / D); const fr = (u - n * D) / D;
      const s = 1 + n + smooth((fr - 0.62) / 0.38);
      const cur = mod(Math.round(s), N); const L = cur >= 1 && cur <= 26 ? cur - 1 : -1; const still = fr < 0.62 || t < 0.8;
      const top = Y0 + 196; const bh = 214; const wy = top + bh + 12; const ty = wy + 20;
      const spin = -(s * pitch) / 20;
      const HUE = ['#fb7185', '#fb923c', '#facc15', '#34d399', '#38bdf8', '#a78bfa'];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The alphabet train');
      cloud(ctx, X0 + 110 + Math.sin(k * 0.3) * 12, Y0 + 98, 0.55, 'rgba(230,236,255,0.35)');
      cloud(ctx, X1 - 120 + Math.sin(k * 0.25 + 1) * 12, Y0 + 92, 0.6, 'rgba(230,236,255,0.35)');
      // Track and grass.
      ctx.fillStyle = 'rgba(52,211,153,0.2)'; ctx.fillRect(X0, ty + 4, FIG.w, 30);
      ctx.fillStyle = '#8d6e4f'; for (let j = 0; j < 22; j++) { const x = X0 + mod(j * 40 - s * pitch, 840) - 20; ctx.fillRect(x, ty - 2, 12, 14); }
      line(ctx, X0, ty, X1, ty, '#94a3b8', 5);
      ctx.save(); clipRect(ctx, X0, Y0 + 50, FIG.w, ty - Y0);
      for (let i = Math.floor(s) - 3; i <= Math.floor(s) + 3; i++) {
        const j = mod(i, N); const x = cx + (i - s) * pitch;
        if (j === 27) continue;
        if (j !== 26) line(ctx, x + (j === 0 ? 100 : 96), wy - 24, x + pitch - 96, wy - 24, '#475569', 7);
        if (j === 0) {
          // The engine, front to the left, with a face and puffs of smoke.
          for (let p = 0; p < 4; p++) { const q = mod(k * 0.7 + p / 4, 1); circ(ctx, x - 50 + q * 90, top - 6 - q * 80, 12 + q * 18, `rgba(230,236,255,${0.65 * (1 - q)})`); }
          ctx.fillStyle = '#ef4444'; rounded(ctx, x + 6, top - 10, 94, bh + 10, 14); ctx.fill();
          ctx.fillStyle = '#b91c1c'; rounded(ctx, x - 4, top - 26, 114, 20, 8); ctx.fill();
          ctx.fillStyle = '#bfe6ff'; rounded(ctx, x + 24, top + 14, 56, 50, 8); ctx.fill();
          ctx.fillStyle = '#3b82f6'; rounded(ctx, x - 104, top + 62, 124, bh - 62, 22); ctx.fill();
          ctx.fillStyle = '#2a2140'; ctx.fillRect(x - 70, top + 14, 30, 50); rounded(ctx, x - 78, top + 2, 46, 16, 6); ctx.fill();
          circ(ctx, x - 104, top + 140, 44, '#e5e7eb');
          eyes(ctx, x - 104, top + 128, 34, 9, k, 3, -0.6); smile(ctx, x - 104, top + 154, 13, PUPIL, 3); cheeks(ctx, x - 104, top + 150, 54, 6);
          wheel(ctx, x - 62, wy, 22, spin); wheel(ctx, x - 8, wy, 22, spin); wheel(ctx, x + 60, wy, 22, spin);
        } else {
          const c = HUE[(j - 1) % 6]; const on = still && j === cur;
          ctx.fillStyle = c; rounded(ctx, x - 98, top, 196, bh, 18); ctx.fill();
          if (on) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; rounded(ctx, x - 98, top, 196, bh, 18); ctx.stroke(); }
          ctx.fillStyle = '#fff8e7'; rounded(ctx, x - 84, top + 12, 168, 164, 14); ctx.fill();
          const letter = String.fromCharCode(64 + j);
          label(ctx, `${letter} ${letter.toLowerCase()}`, x, top + 46, { size: 44, weight: 800, fill: DARKTEXT });
          sc(ctx, x, top + 126, 1.0, () => abcObj(ctx, j - 1, k));
          label(ctx, WORDS[j - 1], x, top + 196, { size: 22, weight: 800, fill: DARKTEXT });
          wheel(ctx, x - 58, wy, 20, spin); wheel(ctx, x + 58, wy, 20, spin);
        }
      }
      ctx.restore();
      // What the carriage says, and the whole alphabet.
      if (L >= 0) chip(ctx, `${String.fromCharCode(65 + L)} is for ${WORDS[L]}`, cx, Y0 + 520, HUE[L % 6], 30);
      else chip(ctx, 'All aboard the alphabet train!', cx, Y0 + 520, 'ink', 28);
      for (let j = 0; j < 26; j++) {
        const x = cx + ((j % 13) - 6) * 58; const y = Y0 + 592 + Math.floor(j / 13) * 56; const on = j === L;
        if (on) circ(ctx, x, y, 24, HUE[j % 6]);
        label(ctx, String.fromCharCode(65 + j), x, y + 1, { size: on ? 30 : 26, weight: 800, fill: on ? DARKTEXT : j < L ? 'ink' : 'muted' });
      }
      ctx.restore();
    },

    // A doll's house where the shapes light up one kind at a time: circles
    // (the sun, a round window, a clock), squares, the triangle roof, the
    // rectangle door and the oval mirror.
    'shape-hunt'(b, ctx, it, t) {
      const k = b.clock; const P = 2.9;
      const SH = [['Circle', 'yellow', 'A circle is round, with no corners'], ['Square', 'cyan', 'A square has 4 equal sides'], ['Triangle', 'orange', 'A triangle has 3 sides and 3 corners'], ['Rectangle', 'green', 'A rectangle has 2 long and 2 short sides'], ['Oval', 'purple', 'An oval is like a stretched circle']];
      const on = t < 1.2 ? -1 : Math.floor(cycle(t, P * 5, 1.2) / P) % 5; const f = on < 0 ? 0 : (cycle(t, P * 5, 1.2) - on * P) / P;
      const env = on >= 0 ? bump(f, 0.12) : 0;
      const hw = 232; const wallT = Y0 + 218; const floorY = Y0 + 492;
      const ITEMS = [
        { s: 0, draw: () => sun(ctx, X0 + 82, Y0 + 104, 38, k), path: () => { ctx.beginPath(); ctx.arc(X0 + 82, Y0 + 104, 38, 0, TAU); } },
        { s: 2, draw: () => { ctx.fillStyle = '#e8524a'; poly(ctx, [cx - 272, wallT, cx, Y0 + 72, cx + 272, wallT]); ctx.fill(); ctx.strokeStyle = 'rgba(120,30,20,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); for (let j = 1; j < 5; j++) { const y = Y0 + 72 + j * 29; const w = (272 * (y - Y0 - 72)) / (wallT - Y0 - 72); ctx.moveTo(cx - w, y); ctx.lineTo(cx + w, y); } ctx.stroke(); }, path: () => poly(ctx, [cx - 272, wallT, cx, Y0 + 72, cx + 272, wallT]) },
        { s: 0, draw: () => { circ(ctx, cx, Y0 + 162, 24, '#bfe6ff', '#ffffff', 5); line(ctx, cx - 22, Y0 + 162, cx + 22, Y0 + 162, '#ffffff', 3); line(ctx, cx, Y0 + 140, cx, Y0 + 184, '#ffffff', 3); }, path: () => { ctx.beginPath(); ctx.arc(cx, Y0 + 162, 26, 0, TAU); } },
        { s: 1, draw: () => { ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - 184, Y0 + 262, 104, 104); ctx.fillStyle = '#7cc8ff'; ctx.fillRect(cx - 178, Y0 + 268, 92, 92); cloud(ctx, cx - 140, Y0 + 300, 0.3, '#ffffff'); line(ctx, cx - 132, Y0 + 268, cx - 132, Y0 + 360, '#ffffff', 5); line(ctx, cx - 178, Y0 + 314, cx - 86, Y0 + 314, '#ffffff', 5); }, path: () => { ctx.beginPath(); ctx.rect(cx - 184, Y0 + 262, 104, 104); } },
        { s: 0, draw: () => { circ(ctx, cx, Y0 + 300, 36, '#ffffff', '#f59e0b', 6); for (let j = 0; j < 12; j++) { const a = (j / 12) * TAU; circ(ctx, cx + Math.cos(a) * 27, Y0 + 300 + Math.sin(a) * 27, j % 3 ? 1.6 : 3, PUPIL); } const hA = k * 0.15 - PI / 2; const mA = k * 1.2 - PI / 2; line(ctx, cx, Y0 + 300, cx + Math.cos(hA) * 14, Y0 + 300 + Math.sin(hA) * 14, PUPIL, 4); line(ctx, cx, Y0 + 300, cx + Math.cos(mA) * 22, Y0 + 300 + Math.sin(mA) * 22, PUPIL, 3); }, path: () => { ctx.beginPath(); ctx.arc(cx, Y0 + 300, 38, 0, TAU); } },
        { s: 3, draw: () => { ctx.fillStyle = '#a0522d'; ctx.fillRect(cx - 48, Y0 + 362, 96, floorY - Y0 - 362); ctx.strokeStyle = 'rgba(60,20,0,0.35)'; ctx.lineWidth = 3; ctx.strokeRect(cx - 36, Y0 + 374, 72, 44); ctx.strokeRect(cx - 36, Y0 + 428, 72, 50); circ(ctx, cx + 32, Y0 + 432, 5, '#facc15'); }, path: () => { ctx.beginPath(); ctx.rect(cx - 48, Y0 + 362, 96, floorY - Y0 - 362); } },
        { s: 4, draw: () => { oval(ctx, cx + 150, Y0 + 318, 42, 58, 0, '#f59e0b'); oval(ctx, cx + 150, Y0 + 318, 34, 50, 0, '#cfeaff'); oval(ctx, cx + 138, Y0 + 300, 7, 18, 0.4, 'rgba(255,255,255,0.8)'); }, path: () => oval(ctx, cx + 150, Y0 + 318, 42, 58, 0) },
        { s: 1, draw: () => { ctx.fillStyle = '#38bdf8'; rounded(ctx, cx + 122, floorY - 58, 58, 58, 6); ctx.fill(); label(ctx, 'A', cx + 151, floorY - 28, { size: 32, weight: 800, fill: '#ffffff' }); }, path: () => { ctx.beginPath(); ctx.rect(cx + 122, floorY - 58, 58, 58); } },
      ];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Shape hunt');
      // The house: frame, back wall, floor and grass.
      ctx.fillStyle = 'rgba(52,211,153,0.35)'; rounded(ctx, X0 + 10, floorY + 14, FIG.w - 20, 30, 12); ctx.fill();
      ctx.fillStyle = '#d97757'; ctx.fillRect(cx - hw, wallT, hw * 2, floorY - wallT + 16);
      ctx.fillStyle = '#fde8c8'; ctx.fillRect(cx - hw + 16, wallT + 12, hw * 2 - 32, floorY - wallT - 12);
      ctx.fillStyle = '#b07a4a'; ctx.fillRect(cx - hw + 16, floorY, hw * 2 - 32, 16);
      ITEMS.forEach((o) => o.draw());
      if (env > 0.01) {
        ctx.fillStyle = `rgba(5,8,22,${0.6 * env})`; ctx.fillRect(X0, Y0 + 52, FIG.w, floorY - Y0 - 2);
        const c = SH[on][1]; const lw = 6 + 2 * Math.sin(k * 8);
        ITEMS.filter((o) => o.s === on).forEach((o) => { o.draw(); o.path(); ctx.strokeStyle = color(c); ctx.globalAlpha *= 1; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); });
      }
      // The legend of shapes.
      SH.forEach(([name, c], j) => {
        const x = cx + (j - 2) * 152; const y = Y0 + 576; const act = j === on; const s = act ? 1 + 0.2 * env : 1;
        ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
        ctx.fillStyle = act ? color(c) : tint(c, 0.35);
        if (j === 0) { ctx.beginPath(); ctx.arc(0, 0, 24, 0, TAU); } else if (j === 1) { ctx.beginPath(); ctx.rect(-22, -22, 44, 44); } else if (j === 2) poly(ctx, [-26, 20, 0, -24, 26, 20]); else if (j === 3) { ctx.beginPath(); ctx.rect(-34, -18, 68, 36); } else { ctx.beginPath(); ctx.ellipse(0, 0, 18, 26, 0, 0, TAU); }
        ctx.fill(); ctx.restore();
        label(ctx, name, x, y + 50, { size: act ? 25 : 23, weight: 800, fill: act ? c : 'muted' });
      });
      chip(ctx, on >= 0 ? SH[on][2] : 'Can you find the shapes?', cx, Y1 - 30, on >= 0 ? SH[on][1] : 'ink', 23);
      ctx.restore();
    },

    // Beads go onto a string one by one in a repeating pattern (red-blue,
    // circle-square-triangle, star-star-heart); "what comes next?" and the
    // answer pops in, then the repeating part is boxed.
    'pattern-maker'(b, ctx, it, t) {
      const P = 8.2;
      const PATS = [
        { name: 'Red, blue, red, blue…', seq: [0, 1], kinds: [['circle', '#ef4444', 'Red'], ['circle', '#3b82f6', 'Blue']], n: 8 },
        { name: 'Circle, square, triangle…', seq: [0, 1, 2], kinds: [['circle', '#facc15', 'A circle'], ['square', '#22c55e', 'A square'], ['triangle', '#a855f7', 'A triangle']], n: 9 },
        { name: 'Star, star, heart…', seq: [0, 0, 1], kinds: [['star', '#fb923c', 'A star'], ['heart', '#ec4899', 'A heart']], n: 9 },
      ];
      const u = cycle(t, P * 3, 0.3); const pi = Math.floor(u / P) % 3; const tau = u - pi * P;
      const pat = PATS[pi]; const n = pat.n; const L = pat.seq.length;
      const pitch = Math.min(88, 740 / n); const r = 30; const y = Y0 + 262;
      const xs = (j) => cx + (j - (n - 1) / 2) * pitch;
      const show = smooth(tau / 0.3) * smooth((P - tau) / 0.3);
      const bead = (kind, x, yy, rr, c) => {
        ctx.fillStyle = c;
        if (kind === 'circle') { ctx.beginPath(); ctx.arc(x, yy, rr, 0, TAU); } else if (kind === 'square') rounded(ctx, x - rr * 0.88, yy - rr * 0.88, rr * 1.76, rr * 1.76, 6); else if (kind === 'triangle') poly(ctx, [x - rr, yy + rr * 0.8, x, yy - rr, x + rr, yy + rr * 0.8]); else if (kind === 'star') starPath(ctx, x, yy, rr * 1.15, rr * 0.5); else heartPath(ctx, x, yy, rr);
        ctx.fill();
        circ(ctx, x - rr * 0.3, yy - rr * 0.3, rr * 0.16, 'rgba(255,255,255,0.55)');
      };
      const LET = 'ABC';
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'What comes next?');
      ctx.save(); ctx.globalAlpha *= show;
      label(ctx, pat.name, cx, Y0 + 110, { size: 30, weight: 800, fill: 'ink' });
      const grp = after(tau, 5.4, 0.5);
      if (grp > 0) for (let g = 0; g * L < n; g++) { const x0 = xs(g * L) - pitch / 2 + 5; const w = L * pitch - 10; ctx.fillStyle = tint(g % 2 ? 'cyan' : 'yellow', 0.12 * grp); rounded(ctx, x0, y - 58, w, 168, 18); ctx.fill(); ctx.strokeStyle = tint(g % 2 ? 'cyan' : 'yellow', 0.55 * grp); ctx.lineWidth = 2.5; ctx.stroke(); }
      line(ctx, xs(0) - pitch / 2, y, xs(n - 1) + pitch / 2, y, '#cbd5e1', 4);
      for (let j = 0; j < n; j++) {
        const kd = pat.kinds[pat.seq[j % L]]; const last = j === n - 1;
        const p = last ? pop(tau, 4.9) : pop(tau, 0.4 + j * 0.34);
        if (last && tau > 3.3 && p < 0.05) {
          const pulse = 1 + 0.08 * Math.sin(tau * 8);
          ctx.setLineDash([7, 6]); circ(ctx, xs(j), y, r * pulse, 'rgba(5,8,22,0.9)', '#e9eeff', 3); ctx.setLineDash([]);
          label(ctx, '?', xs(j), y + 2, { size: 38, weight: 800, fill: 'ink' });
        }
        if (p > 0) { sc(ctx, xs(j), y, p, () => bead(kd[0], 0, 0, r, kd[1])); ctx.save(); ctx.globalAlpha *= clamp(p); label(ctx, LET[pat.seq[j % L]], xs(j), y + 74, { size: 28, weight: 800, fill: last ? 'yellow' : 'muted' }); ctx.restore(); }
        if (last && p > 0) tick(ctx, xs(j), y - 70, 34 * clamp(p), 'green');
      }
      const ans = pat.kinds[pat.seq[(n - 1) % L]];
      if (tau < 3.3) chip(ctx, 'Watch the pattern grow…', cx, Y0 + 430, 'muted', 24);
      else if (tau < 4.9) chip(ctx, 'What comes next?', cx, Y0 + 430, 'yellow', 28);
      else chip(ctx, `${ans[2]} comes next!`, cx, Y0 + 430, ans[1], 28);
      if (grp > 0) {
        ctx.save(); ctx.globalAlpha *= grp;
        label(ctx, 'The part that repeats:', cx - 40, Y0 + 535, { size: 26, weight: 700, fill: 'ink', align: 'right' });
        pat.seq.forEach((q, j) => { const kd = pat.kinds[q]; bead(kd[0], cx + 4 + j * 60, Y0 + 535, 22, kd[1]); });
        ctx.restore();
      }
      ctx.restore();
      for (let j = 0; j < 3; j++) circ(ctx, cx + (j - 1) * 34, Y1 - 30, j === pi ? 9 : 6, j === pi ? 'yellow' : 'rgba(200,215,255,0.35)');
      ctx.restore();
    },

    // ─── Early number ───────────────────────────────────────────────────

    // Red apples then green apples drop into a basket and are counted on:
    // a + b = total.
    'adding-apples'(b, ctx, it, t) {
      const A = Math.round(clamp(val(it.a, 3), 0, 10)); const B = Math.round(clamp(val(it.b, 2), 0, 10)); const N = A + B;
      const T1 = 1.5; const DT = 0.65; const P = T1 + N * DT + 4.4;
      const tau = mod(t, P); const show = smooth(tau / 0.3) * smooth((P - tau) / 0.3);
      const grpPos = (g, j) => { const cnt = g ? B : A; const gx = g ? X1 - 178 : X0 + 178; const row = Math.floor(j / 5); const inRow = Math.min(5, cnt - row * 5); return [gx + ((j % 5) - (inRow - 1) / 2) * 50, Y0 + 150 + row * 50]; };
      const slot = (i) => [cx + ((i % 5) - 2) * 56, Y0 + 396 - Math.floor(i / 5) * 44];
      const landed = (i) => tau > T1 + i * DT + 0.5;
      const count = Array.from({ length: N }, (_, i) => i).filter(landed).length; const done = count === N;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Adding apples');
      ctx.save(); ctx.globalAlpha *= show;
      // Group numbers and plates.
      [[A, X0 + 178, '#ef4444'], [B, X1 - 178, '#4ade80']].forEach(([cnt, gx, c]) => {
        label(ctx, String(cnt), gx, Y0 + 90, { size: 40, weight: 800, fill: c });
        oval(ctx, gx, Y0 + 150 + (Math.max(1, Math.ceil(cnt / 5)) - 1) * 50 + 28, 140, 14, 0, 'rgba(200,215,255,0.22)');
      });
      // The basket: handle, inside, apples, front.
      ctx.strokeStyle = '#a8692f'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(cx, Y0 + 418, 172, PI, TAU); ctx.stroke();
      oval(ctx, cx, Y0 + 418, 175, 26, 0, '#6b3f1d');
      for (let i = N - 1; i >= 0; i--) {
        const g = i < A ? 0 : 1; const j = g ? i - A : i; const leave = T1 + i * DT; const q = smooth((tau - leave) / 0.5);
        const [x0, y0] = grpPos(g, j); const [x1, y1] = slot(i);
        const x = lerp(x0, x1, q); const y = lerp(y0, y1, q) - Math.sin(q * PI) * 80;
        apple(ctx, x, y, 22, g ? '#4ade80' : '#ef4444');
        if (landed(i)) label(ctx, String(i + 1), x, y + 4, { size: 22, weight: 800, fill: '#ffffff' });
      }
      ctx.fillStyle = '#c98a4b'; poly(ctx, [cx - 176, Y0 + 418, cx + 176, Y0 + 418, cx + 136, Y0 + 532, cx - 136, Y0 + 532]); ctx.fill();
      ctx.strokeStyle = 'rgba(110,60,20,0.45)'; ctx.lineWidth = 4; ctx.beginPath();
      for (let j = 1; j < 4; j++) { const yy = Y0 + 418 + j * 28.5; const w = 176 - j * 10; ctx.moveTo(cx - w, yy); ctx.lineTo(cx + w, yy); }
      for (let j = -4; j <= 4; j++) { ctx.moveTo(cx + j * 38, Y0 + 418); ctx.lineTo(cx + j * 30, Y0 + 532); }
      ctx.stroke();
      ctx.strokeStyle = '#8a5528'; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(cx, Y0 + 418, 176, 26, 0, 0, PI); ctx.stroke();
      // The counter.
      const lastLand = count ? T1 + (count - 1) * DT + 0.5 : -9; const bounce = 1 + 0.25 * Math.exp(-(tau - lastLand) * 6);
      label(ctx, 'Count', X1 - 86, Y0 + 400, { size: 22, weight: 700, fill: 'muted' });
      circ(ctx, X1 - 86, Y0 + 466, 46 * bounce, tint('yellow', 0.18), 'yellow', 3);
      label(ctx, String(count), X1 - 86, Y0 + 468, { size: 44 * bounce, weight: 800, fill: 'yellow' });
      sentence(ctx, [[String(A), '#ef4444'], ['+', 'ink'], [String(B), '#4ade80'], ['=', 'ink'], [done ? String(N) : '?', done ? 'yellow' : 'muted']], cx, Y0 + 595, 58);
      ctx.restore();
      chip(ctx, tau < T1 + A * DT + 0.3 ? 'Count the red apples' : !done ? 'Count on the green apples' : `${A} and ${B} make ${N}`, cx, Y1 - 32, done ? 'yellow' : 'ink', 24);
      ctx.restore();
    },

    // Birds sit on a fence; some fly away one by one: total − gone = left.
    'taking-away'(b, ctx, it, t) {
      const k = b.clock; const T = Math.round(clamp(val(it.total, 5), 1, 10)); const G = Math.round(clamp(val(it.gone, 2), 0, T)); const LEFT = T - G;
      const T1 = 1.6; const DT = 1.3; const P = T1 + G * DT + 1.2 + 3.6;
      const tau = mod(t, P); const show = smooth(tau / 0.3) * smooth((P - tau) / 0.3);
      const pitch = Math.min(120, 660 / T); const railY = Y0 + 372; const bxs = (j) => cx + (j - (T - 1) / 2) * pitch;
      const COLS = ['#60a5fa', '#f472b6', '#fbbf24', '#34d399', '#a78bfa', '#fb923c', '#22d3ee', '#f87171', '#a3e635', '#e879f9'];
      const bird = (x, y, c, flap, sit, seed) => {
        ctx.fillStyle = color(c); poly(ctx, [x - 18, y, x - 38, y - 12, x - 36, y + 8]); ctx.fill();
        if (sit) { line(ctx, x - 6, y + 18, x - 6, y + 28, '#f59e0b', 3); line(ctx, x + 6, y + 18, x + 6, y + 28, '#f59e0b', 3); }
        oval(ctx, x, y, 24, 21, 0, c); oval(ctx, x + 6, y + 6, 13, 11, 0, 'rgba(255,255,255,0.45)');
        ctx.save(); ctx.translate(x - 4, y - 2); ctx.rotate(sit ? 0.3 : -0.9 * flap); oval(ctx, -8, 0, 15, 8, 0, mix(c, '#1a1630', 0.25)); ctx.restore();
        ctx.fillStyle = '#f59e0b'; poly(ctx, [x + 21, y - 6, x + 34, y - 2, x + 21, y + 2]); ctx.fill();
        eyes(ctx, x + 10, y - 8, 0.1, 5, k, seed, 0.5);
      };
      const gone = Array.from({ length: G }, (_, m) => m).filter((m) => tau > T1 + m * DT + 0.3).length;
      const done = tau > T1 + G * DT + 1.0;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Taking away');
      sun(ctx, X1 - 78, Y0 + 104, 34, k);
      cloud(ctx, X0 + 120 + Math.sin(k * 0.3) * 10, Y0 + 110, 0.7, 'rgba(230,236,255,0.4)');
      ctx.save(); ctx.globalAlpha *= show;
      // The fence and the grass.
      ctx.fillStyle = 'rgba(52,211,153,0.3)'; rounded(ctx, X0 + 10, railY + 84, FIG.w - 20, 34, 14); ctx.fill();
      ctx.fillStyle = '#d6a76a';
      for (let x = X0 + 40; x <= X1 - 40; x += 74) { poly(ctx, [x - 11, railY + 100, x - 11, railY - 2, x, railY - 16, x + 11, railY - 2, x + 11, railY + 100]); ctx.fill(); }
      ctx.fillStyle = '#c08a4a'; ctx.fillRect(X0 + 24, railY + 2, FIG.w - 48, 14); ctx.fillRect(X0 + 24, railY + 56, FIG.w - 48, 14);
      ctx.save(); clipRect(ctx, X0, Y0 + 50, FIG.w, FIG.h - 50);
      for (let j = 0; j < T; j++) {
        const m = T - 1 - j; const x = bxs(j); const y = railY - 26;
        const flies = m < G; const leave = T1 + m * DT; const q = flies ? clamp((tau - leave) / 1.4) : 0;
        if (q <= 0) bird(x, y - Math.abs(Math.sin(k * 3 + j)) * 3, COLS[j % 10], 0, true, j);
        else {
          ctx.save(); ctx.globalAlpha *= 0.5; ctx.setLineDash([6, 6]); oval(ctx, x, y, 24, 21, 0, null, '#e9eeff', 2.5); ctx.setLineDash([]); ctx.restore();
          bird(x + 400 * q + Math.sin(q * 9) * 14, y - 300 * q * (2 - q) * 0.8, COLS[j % 10], Math.sin(k * 22), false, j);
        }
      }
      ctx.restore();
      sentence(ctx, [[String(T), 'ink'], ['−', 'ink'], [String(G), '#fb7185'], ['=', 'ink'], [done ? String(LEFT) : '?', done ? 'green' : 'muted']], cx, Y0 + 570, 58);
      ctx.restore();
      chip(ctx, tau < T1 ? `${T} birds on the fence` : !done ? `${gone} flew away…` : `${LEFT} ${LEFT === 1 ? 'bird is' : 'birds are'} left`, cx, Y1 - 32, done ? 'green' : 'ink', 24);
      ctx.restore();
    },

    // A pizza cut in half and shared by 2 friends, then in quarters and
    // shared by 4: equal parts, 1/2 and 1/4.
    'sharing-halves'(b, ctx, it, t) {
      const k = b.clock; const P = 14.6; const tau = cycle(t, P, 0.2);
      const px = cx; const py = Y0 + 318; const R = 128;
      const halvesOut = smooth((tau - 2.4) / 0.7) * (1 - smooth((tau - 6.3) / 0.7));
      const four = tau > 7.0; const quartOut = smooth((tau - 8.0) / 0.7) * (1 - smooth((tau - 13.7) / 0.6));
      const stage = tau < 2.4 ? 0 : tau < 7.0 ? 1 : 2;
      const pizza = (x, y) => {
        circ(ctx, x, y, R, '#d9913f'); circ(ctx, x, y, R * 0.86, '#e2553f'); circ(ctx, x, y, R * 0.8, '#ffd166');
        for (let j = 0; j < 11; j++) { const a = j * 2.4 + 0.4; const d = j === 0 ? 0 : R * (0.3 + 0.38 * rnd(j)); circ(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, 13, '#c0392b'); circ(ctx, x + Math.cos(a) * d - 4, y + Math.sin(a) * d - 4, 3, 'rgba(255,255,255,0.35)'); }
        for (let j = 0; j < 8; j++) { const a = j * 0.8 + 1.1; const d = R * (0.2 + 0.5 * rnd(j + 30)); leaf(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, 14, 6, a, '#2f9e44', null); }
      };
      const slice = (a0, a1, dx, dy) => { ctx.save(); ctx.translate(dx, dy); ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, R + 1, a0, a1); ctx.closePath(); ctx.clip(); pizza(px, py); ctx.restore(); };
      const tag = (x, y, d, a) => { if (a <= 0.01) return; ctx.save(); ctx.globalAlpha *= a; circ(ctx, x, y, 31, '#ffffff', '#1a1630', 3); frac(ctx, 1, d, x, y + 1, 22); ctx.restore(); };
      const friend = (x, y, seed, a, happy) => {
        if (a <= 0.01) return;
        ctx.save(); ctx.globalAlpha *= a; const s = 0.6 + 0.4 * a;
        sc(ctx, x, y, s, () => {
          ctx.fillStyle = ['#60a5fa', '#f472b6', '#34d399', '#fbbf24'][seed]; ctx.beginPath(); ctx.ellipse(0, 58, 46, 26, 0, PI, TAU); ctx.fill();
          circ(ctx, 0, 0, 42, SKINS[[0, 5, 2, 3][seed]]);
          ctx.fillStyle = ['#2b1d14', '#111827', '#7c2d12', '#3f2a1d'][seed]; ctx.beginPath(); ctx.arc(0, -4, 43, PI * 1.05, PI * 1.95); ctx.fill();
          if (seed % 2) { circ(ctx, -38, -18, 12, ctx.fillStyle); circ(ctx, 38, -18, 12, ctx.fillStyle); }
          eyes(ctx, 0, 0, 30, 7, k, seed); smile(ctx, 0, 18, happy ? 13 : 9, PUPIL, 3, happy ? 1 : 0); cheeks(ctx, 0, 14, 48, 6);
        });
        ctx.restore();
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Halves and quarters');
      const d2 = 90 * halvesOut; const d4 = 50 * quartOut;
      if (stage === 0) {
        pizza(px, py);
        if (tau > 1.6) { const q = smooth((tau - 1.6) / 0.7); line(ctx, px, py - R - 14, px, py - R - 14 + (2 * R + 28) * q, '#ffffff', 5, [12, 8]); }
      } else if (!four) {
        slice(PI / 2, PI * 1.5, -d2, 0); slice(-PI / 2, PI / 2, d2, 0);
        tag(px - d2 - R * 0.48, py, 2, smooth((halvesOut - 0.6) / 0.4)); tag(px + d2 + R * 0.48, py, 2, smooth((halvesOut - 0.6) / 0.4));
        friend(X0 + 84, py, 0, halvesOut, halvesOut > 0.9); friend(X1 - 84, py, 1, halvesOut, halvesOut > 0.9);
      } else {
        const Q = [[-PI / 2, 0], [0, PI / 2], [PI / 2, PI], [PI, PI * 1.5]];
        Q.forEach(([a0, a1]) => { const am = (a0 + a1) / 2; slice(a0, a1, Math.cos(am) * d4, Math.sin(am) * d4); });
        if (tau < 8.0) { const q = smooth((tau - 7.1) / 0.7); line(ctx, px - R - 14, py, px - R - 14 + (2 * R + 28) * q, py, '#ffffff', 5, [12, 8]); line(ctx, px, py - R, px, py + R, 'rgba(255,255,255,0.7)', 3); }
        Q.forEach(([a0, a1]) => { const am = (a0 + a1) / 2; tag(px + Math.cos(am) * (d4 + R * 0.56), py + Math.sin(am) * (d4 + R * 0.56), 4, smooth((quartOut - 0.6) / 0.4)); });
        [[X0 + 84, Y0 + 150, 0], [X1 - 84, Y0 + 150, 1], [X1 - 84, Y0 + 500, 2], [X0 + 84, Y0 + 500, 3]].forEach(([x, y, s]) => friend(x, y, s, quartOut, quartOut > 0.9));
      }
      const SAY = [['1 whole', 'ink', 'One pizza to share fairly'], ['2 halves', 'cyan', '2 friends: each gets one half'], ['4 quarters', 'orange', '4 friends: each gets one quarter']][stage];
      label(ctx, SAY[0], cx, Y0 + 538, { size: 36, weight: 800, fill: SAY[1] });
      if (stage) label(ctx, stage === 1 ? '2 equal parts make 1 whole' : '4 equal parts make 1 whole', cx, Y0 + 588, { size: 24, weight: 700, fill: 'muted' });
      chip(ctx, SAY[2], cx, Y1 - 32, SAY[1], 24);
      ctx.restore();
    },

    // Teddies of different sizes line up from smallest to biggest, then
    // towers of cubes from tallest to shortest.
    'size-order'(b, ctx, it, t) {
      const k = b.clock; const P = 8.4; const u = cycle(t, P * 2, 0.2); const st = Math.floor(u / P) % 2; const tau = u - st * P;
      const gy = Y0 + 452; const xs = (j) => cx + (j - 2) * 150;
      const show = smooth(tau / 0.3) * smooth((P - tau) / 0.3);
      const START = [3, 0, 4, 1, 2]; // which item sits in each slot at first
      const SIZES = [0.55, 0.7, 0.85, 1.0, 1.15]; const HTS = [6, 5, 4, 3, 2];
      const FUR = ['#d6a26a', '#c68642', '#e0b07a', '#b5784a', '#cf9257'];
      const TOW = ['#fb7185', '#fbbf24', '#34d399', '#38bdf8', '#a78bfa'];
      const teddy = (x, s, fur, seed) => sc(ctx, x, gy, s, () => {
        oval(ctx, -24, -14, 18, 13, 0, fur); oval(ctx, 24, -14, 18, 13, 0, fur);
        oval(ctx, 0, -62, 42, 50, 0, fur); oval(ctx, 0, -56, 26, 32, 0, 'rgba(255,240,220,0.5)');
        oval(ctx, -40, -76, 13, 24, 0.5, fur); oval(ctx, 40, -76, 13, 24, -0.5, fur);
        circ(ctx, -32, -170, 16, fur); circ(ctx, 32, -170, 16, fur); circ(ctx, -32, -170, 8, '#f9c9a8'); circ(ctx, 32, -170, 8, '#f9c9a8');
        circ(ctx, 0, -140, 42, fur); oval(ctx, 0, -124, 19, 14, 0, '#f6dcc0');
        oval(ctx, 0, -130, 7, 5, 0, PUPIL); eyes(ctx, 0, -150, 30, 7, k, seed); smile(ctx, 0, -119, 7, PUPIL, 2.5);
      });
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Putting things in order');
      ctx.save(); ctx.globalAlpha *= show;
      line(ctx, X0 + 30, gy + 2, X1 - 30, gy + 2, 'rgba(200,215,255,0.45)', 4);
      [0, 1, 2, 3, 4].forEach((r) => {
        const s0 = START.indexOf(r); const mv = smooth((tau - 1.5 - r * 0.45) / 0.8);
        const x = lerp(xs(s0), xs(r), mv); const lift = Math.sin(mv * PI) * (s0 === r ? 0 : 60);
        const p = pop(tau, 0.15 + s0 * 0.1);
        ctx.save(); ctx.translate(0, -lift);
        if (st === 0) teddy(x, SIZES[r] * p, FUR[r], r);
        else {
          const h = HTS[r];
          for (let c = 0; c < h; c++) { const q = pop(tau, 0.1 + s0 * 0.08 + c * 0.04); if (q <= 0) continue; sc(ctx, x, gy - 21 - c * 42, q, () => { ctx.fillStyle = TOW[r]; rounded(ctx, -20, -20, 40, 40, 6); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; rounded(ctx, -14, -14, 12, 12, 3); ctx.fill(); }); }
          ctx.save(); ctx.globalAlpha *= clamp(p); label(ctx, String(h), x, gy - h * 42 - 24, { size: 26, weight: 800, fill: TOW[r] }); ctx.restore();
        }
        ctx.restore();
      });
      const lab = after(tau, 4.2, 0.5);
      if (lab > 0) {
        ctx.save(); ctx.globalAlpha *= lab;
        const W = st === 0 ? ['smallest', 'biggest', 'getting bigger', 'yellow'] : ['tallest', 'shortest', 'getting shorter', 'cyan'];
        label(ctx, W[0], xs(0), gy + 34, { size: 26, weight: 800, fill: W[3] });
        label(ctx, W[1], xs(4), gy + 34, { size: 26, weight: 800, fill: W[3] });
        arrow(ctx, xs(0) - 40, gy + 86, xs(4) + 40, gy + 86, W[3], 6);
        label(ctx, W[2], cx, gy + 124, { size: 24, weight: 700, fill: 'ink' });
        ctx.restore();
      }
      ctx.restore();
      chip(ctx, tau < 4.2 ? (st === 0 ? 'Line the teddies up by size' : 'Line the towers up by height') : st === 0 ? 'small, smaller, smallest · big, bigger, biggest' : 'tall, taller, tallest · short, shorter, shortest', cx, Y1 - 32, 'ink', 22);
      ctx.restore();
    },

    // A pencil, a book and a scarf, each measured with a row of cubes from
    // the same start line, then compared: longest, shortest, longer than.
    'measuring-kids'(b, ctx, it, t) {
      const k = b.clock; const C = 62; const sx = X0 + 92;
      const ROWS = [['pencil', 5, '#fb923c'], ['book', 3, '#38bdf8'], ['scarf', 8, '#a78bfa']];
      const ys = [Y0 + 112, Y0 + 292, Y0 + 472];
      const T0 = 0.7; const RD = 2.5; const CMP = T0 + 3 * RD; const P = CMP + 7.8;
      const tau = mod(t, P); const show = smooth(tau / 0.3) * smooth((P - tau) / 0.3);
      const ci = tau > CMP ? Math.floor((tau - CMP) / 2.5) % 3 : -1;
      const HL = [[2], [1], [0, 1]][ci] || [];
      const SAY = ['The scarf is the longest', 'The book is the shortest', 'The pencil is longer than the book'];
      const draws = [
        (x0, x1, y) => { ctx.fillStyle = '#f9a8d4'; rounded(ctx, x0, y - 17, 30, 34, 8); ctx.fill(); ctx.fillStyle = '#cbd5e1'; ctx.fillRect(x0 + 24, y - 17, 16, 34); ctx.fillStyle = '#facc15'; ctx.fillRect(x0 + 40, y - 17, x1 - x0 - 92, 34); ctx.fillStyle = '#eab308'; ctx.fillRect(x0 + 40, y - 3, x1 - x0 - 92, 6); ctx.fillStyle = '#f5d0a9'; poly(ctx, [x1 - 52, y - 17, x1, y, x1 - 52, y + 17]); ctx.fill(); ctx.fillStyle = '#334155'; poly(ctx, [x1 - 16, y - 5.5, x1, y, x1 - 16, y + 5.5]); ctx.fill(); },
        (x0, x1, y) => { ctx.fillStyle = '#2563eb'; rounded(ctx, x0, y - 38, x1 - x0, 70, 8); ctx.fill(); ctx.fillStyle = '#f8fafc'; ctx.fillRect(x0 + 6, y + 26, x1 - x0 - 12, 6); ctx.fillStyle = '#1e40af'; ctx.fillRect(x0, y - 38, 18, 70); ctx.fillStyle = '#facc15'; starPath(ctx, x0 + (x1 - x0) / 2 + 8, y - 4, 18, 8); ctx.fill(); },
        (x0, x1, y) => { const SC = ['#a78bfa', '#f472b6']; const n = 10; const w = (x1 - x0 - 24) / n; for (let j = 0; j < n; j++) { ctx.fillStyle = SC[j % 2]; const wv = Math.sin(k * 2 + j * 0.7) * 4; rounded(ctx, x0 + 12 + j * w, y - 20 + wv, w + 1, 40, 4); ctx.fill(); } ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 3; ctx.beginPath(); for (let j = 0; j < 5; j++) { ctx.moveTo(x0 + 12, y - 16 + j * 8); ctx.lineTo(x0, y - 16 + j * 8); ctx.moveTo(x1 - 12, y - 16 + j * 8); ctx.lineTo(x1, y - 16 + j * 8); } ctx.stroke(); },
      ];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Measuring with cubes');
      ctx.save(); ctx.globalAlpha *= show;
      HL.forEach((r) => { ctx.fillStyle = tint('yellow', 0.1 + 0.04 * Math.sin(k * 5)); rounded(ctx, X0 + 16, ys[r] - 56, FIG.w - 32, 160, 18); ctx.fill(); });
      line(ctx, sx, Y0 + 62, sx, Y0 + 582, 'rgba(255,255,255,0.6)', 3, [10, 8]);
      label(ctx, 'start', sx, Y0 + 604, { size: 22, weight: 700, fill: 'muted' });
      ROWS.forEach(([name, n, c], r) => {
        const y = ys[r]; const p = after(tau, 0.1 + r * 0.15, 0.4);
        ctx.save(); ctx.globalAlpha *= p; draws[r](sx, sx + n * C, y - (r === 1 ? 4 : 0)); ctx.restore();
        label(ctx, name, X0 + 44, y - (r === 1 ? 4 : 0), { size: 22, weight: 800, fill: 'ink' });
        for (let j = 0; j < n; j++) {
          const q = pop(tau, T0 + r * RD + j * 0.22, 0.35); if (q <= 0) continue;
          sc(ctx, sx + j * C + C / 2, y + 74, q, () => { ctx.fillStyle = mix(c, j % 2 ? '#ffffff' : c, 0.25); rounded(ctx, -C / 2 + 2, -27, C - 4, 54, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; rounded(ctx, -10, -33, 20, 8, 3); ctx.fill(); label(ctx, String(j + 1), 0, 2, { size: 24, weight: 800, fill: DARKTEXT }); });
        }
        const lq = after(tau, T0 + r * RD + n * 0.22 + 0.2, 0.4);
        if (lq > 0) { ctx.save(); ctx.globalAlpha *= lq; label(ctx, `${n} cubes`, sx + n * C + 22, y + 75, { size: 26, weight: 800, fill: c, align: 'left' }); ctx.restore(); }
      });
      ctx.restore();
      chip(ctx, ci >= 0 ? SAY[ci] : 'Count the cubes to find out', cx, Y1 - 32, ci >= 0 ? 'yellow' : 'ink', 24);
      ctx.restore();
    },

    // A seesaw scale: an apple goes down against a feather, a book against
    // a toy car, and two blocks stay level.
    'balance-scale-kids'(b, ctx, it, t) {
      const k = b.clock; const P = 5.8;
      const PAIRS = [['Apple', 'apple', 'Feather', 'feather', -1], ['Toy car', 'car', 'Book', 'book', 1], ['Block', 'block', 'Block', 'block', 0]];
      const u = cycle(t, P * 3, 0.3); const pi = Math.floor(u / P) % 3; const tau = u - pi * P;
      const [nL, oL, nR, oR, sgn] = PAIRS[pi];
      const back = smooth((tau - 5.1) / 0.6); const tt = Math.max(0, tau - 1.3);
      const ang = sgn * 0.2 * (tau > 1.3 ? 1 - Math.exp(-2.6 * tt) * Math.cos(7 * tt) : 0) * (1 - back);
      const pvx = cx; const pvy = Y0 + 250; const L = 255;
      const OBJ = {
        apple: () => apple(ctx, 0, -32, 32),
        feather: () => { ctx.save(); ctx.translate(0, -16 - Math.abs(Math.sin(k * 2)) * 4); ctx.rotate(-0.25 + Math.sin(k * 2) * 0.05); ctx.fillStyle = '#e0e7ff'; ctx.beginPath(); ctx.moveTo(-50, 6); ctx.quadraticCurveTo(-10, -26, 50, -10); ctx.quadraticCurveTo(10, 18, -50, 6); ctx.fill(); ctx.fillStyle = '#f9a8d4'; ctx.beginPath(); ctx.moveTo(10, -10); ctx.quadraticCurveTo(30, -18, 50, -10); ctx.quadraticCurveTo(30, 0, 10, -10); ctx.fill(); line(ctx, -58, 9, 50, -10, '#94a3b8', 2.5); ctx.restore(); },
        car: () => VEH.car(ctx, 0, 0, k * 0),
        book: () => { ctx.fillStyle = '#f8fafc'; rounded(ctx, -52, -44, 104, 40, 5); ctx.fill(); ctx.fillStyle = '#2563eb'; rounded(ctx, -56, -54, 112, 14, 5); ctx.fill(); rounded(ctx, -56, -8, 112, 10, 4); ctx.fill(); ctx.fillStyle = '#1e40af'; ctx.fillRect(-56, -54, 12, 56); ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.beginPath(); for (let j = 0; j < 4; j++) { ctx.moveTo(-40, -34 + j * 8); ctx.lineTo(50, -34 + j * 8); } ctx.stroke(); },
        block: () => { ctx.fillStyle = '#f59e0b'; rounded(ctx, -30, -60, 60, 60, 8); ctx.fill(); ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 4; rounded(ctx, -22, -52, 44, 44, 5); ctx.stroke(); },
      };
      const heavier = sgn < 0 ? nL : nR;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Heavier or lighter?');
      // Stand.
      ctx.fillStyle = '#64748b'; ctx.fillRect(pvx - 10, pvy, 20, Y0 + 560 - pvy);
      ctx.fillStyle = '#94a3b8'; rounded(ctx, pvx - 110, Y0 + 556, 220, 26, 12); ctx.fill();
      ctx.fillStyle = '#475569'; poly(ctx, [pvx - 32, pvy + 34, pvx, pvy - 4, pvx + 32, pvy + 34]); ctx.fill();
      // Beam.
      ctx.save(); ctx.translate(pvx, pvy); ctx.rotate(ang); ctx.fillStyle = '#f59e0b'; rounded(ctx, -L - 14, -8, 2 * L + 28, 16, 8); ctx.fill(); ctx.restore();
      circ(ctx, pvx, pvy, 10, '#fde68a', '#b45309', 3);
      [[-1, oL, nL, 0.3], [1, oR, nR, 0.7]].forEach(([sd, o, name, at]) => {
        const ex = pvx + sd * L * Math.cos(ang); const ey = pvy + sd * L * Math.sin(ang); const yb = ey + 100;
        line(ctx, ex, ey, ex - 72, yb, '#cbd5e1', 2.5); line(ctx, ex, ey, ex + 72, yb, '#cbd5e1', 2.5);
        circ(ctx, ex, ey, 6, '#b45309');
        if (tau > at) { const q = clamp((tau - at) / 0.45); ctx.save(); ctx.globalAlpha *= 1 - back; ctx.translate(ex, yb - 2 - 150 * (1 - q * q)); OBJ[o](); ctx.restore(); }
        ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.ellipse(ex, yb, 86, 28, 0, 0, PI); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ex - 86, yb); ctx.lineTo(ex + 86, yb); ctx.stroke();
        ctx.save(); ctx.globalAlpha *= after(tau, at, 0.3) * (1 - back);
        label(ctx, name, ex, yb + 58, { size: 26, weight: 800, fill: 'ink' });
        const tq = after(tau, 2.5, 0.4);
        if (tq > 0) { ctx.globalAlpha *= tq; const w = sgn === 0 ? ['same', 'green'] : sd === sgn ? ['heavier', 'orange'] : ['lighter', 'cyan']; chip(ctx, w[0], ex, yb + 102, w[1], 24); }
        ctx.restore();
      });
      chip(ctx, tau < 2.5 ? `${nL} or ${nR.toLowerCase()}: which is heavier?` : sgn === 0 ? 'Same weight: the scale stays level' : `The ${heavier.toLowerCase()} is heavier, so its side goes down`, cx, Y1 - 32, tau < 2.5 ? 'ink' : sgn === 0 ? 'green' : 'orange', 23);
      ctx.restore();
    },

    // Coins worth 1, 2, 5 and 10 drop one by one into a piggy bank and the
    // total grows: 10 + 5 + 2 + 2 + 1 = 20.
    'coins-counting'(b, ctx, it, t) {
      const k = b.clock;
      let coins = Array.isArray(it.coins) ? it.coins.map(Number).filter((v) => [1, 2, 5, 10].includes(v)).slice(0, 7) : [];
      if (!coins.length) coins = [10, 5, 2, 2, 1];
      const n = coins.length; const T0 = 1.0; const DT = 1.25; const P = T0 + n * DT + 4;
      const tau = mod(t, P); const show = smooth(tau / 0.3) * smooth((P - tau) / 0.35);
      const STYLE = { 1: ['#d9884e', 30], 2: ['#e5a46a', 34], 5: ['#cbd5e1', 38], 10: ['#fbbf24', 42] };
      const rowY = Y0 + 112; const cxs = (j) => cx + (j - (n - 1) / 2) * 98;
      const pigX = cx - 100; const pigY = Y0 + 392; const slotX = pigX + 6; const slotY = pigY - 104;
      const d = coins.filter((_, j) => tau > T0 + j * DT + 0.7).length;
      const run = coins.slice(0, d).reduce((s, v) => s + v, 0); const total = coins.reduce((s, v) => s + v, 0);
      const lt = d ? T0 + (d - 1) * DT + 0.7 : -9; const age = tau - lt;
      const jig = d ? Math.exp(-age * 5) * Math.sin(age * 25) * 0.05 : 0;
      const coin = (x, y, v, sx = 1) => { const [c, r] = STYLE[v]; ctx.save(); ctx.translate(x, y); ctx.scale(sx, 1); circ(ctx, 0, 0, r, c); circ(ctx, 0, 0, r * 0.8, null, 'rgba(255,255,255,0.55)', 2.5); oval(ctx, -r * 0.45, -r * 0.45, r * 0.18, r * 0.1, -0.7, 'rgba(255,255,255,0.6)'); label(ctx, String(v), 0, 2, { size: r > 36 ? 32 : 28, weight: 800, fill: DARKTEXT }); ctx.restore(); };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Counting coins');
      ctx.save(); ctx.globalAlpha *= show;
      // The piggy bank.
      ctx.save(); ctx.translate(pigX, pigY + 100); ctx.rotate(jig); ctx.translate(-pigX, -pigY - 100);
      ctx.fillStyle = '#f472b6'; for (const lx of [-95, -45, 45, 95]) { rounded(ctx, pigX + lx - 14, pigY + 60, 28, 46, 8); ctx.fill(); }
      oval(ctx, pigX, pigY, 152, 104, 0, '#f9a8d4');
      oval(ctx, pigX + 20, pigY + 30, 90, 46, 0, 'rgba(255,255,255,0.18)');
      ctx.fillStyle = '#f472b6'; poly(ctx, [pigX - 96, pigY - 70, pigX - 70, pigY - 128, pigX - 44, pigY - 86]); ctx.fill();
      oval(ctx, pigX - 150, pigY + 8, 28, 36, 0, '#f472b6'); oval(ctx, pigX - 156, pigY - 2, 5, 8, 0, '#9d174d'); oval(ctx, pigX - 156, pigY + 18, 5, 8, 0, '#9d174d');
      eyes(ctx, pigX - 96, pigY - 30, 0.1, 10, k, 2, -0.6); cheeks(ctx, pigX - 70, pigY + 14, 0.1, 13);
      ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 6; ctx.beginPath(); for (let j = 0; j <= 20; j++) { const a = j * 0.5; const r = 4 + j * 0.8; const x = pigX + 162 + Math.cos(a) * r; const y = pigY - 10 + Math.sin(a) * r; if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
      ctx.fillStyle = '#831843'; rounded(ctx, slotX - 38, slotY - 6, 76, 12, 6); ctx.fill();
      ctx.restore();
      // Coins waiting and flying.
      coins.forEach((v, j) => {
        const q = clamp((tau - (T0 + j * DT)) / 0.7); if (q >= 1) return;
        const p = pop(tau, 0.1 + j * 0.1);
        if (q <= 0) { if (p > 0) sc(ctx, cxs(j), rowY + Math.sin(k * 3 + j) * 3, p, () => coin(0, 0, v)); return; }
        const e = smooth(q); const x = lerp(cxs(j), slotX, e); const y = lerp(rowY, slotY - 6, e) - Math.sin(q * PI) * 70;
        coin(x, y, v, 1 - 0.75 * e);
      });
      if (d && age < 1.1) { ctx.save(); ctx.globalAlpha *= 1 - age / 1.1; label(ctx, `+${coins[d - 1]}`, slotX + 86, slotY - 22 - age * 40, { size: 36, weight: 800, fill: 'yellow' }); ctx.restore(); }
      // The total.
      const bz = 1 + 0.22 * Math.exp(-age * 6);
      ctx.fillStyle = tint('yellow', 0.12); ctx.strokeStyle = tint('yellow', 0.6); ctx.lineWidth = 3; rounded(ctx, X1 - 214, Y0 + 300, 178, 160, 22); ctx.fill(); ctx.stroke();
      label(ctx, 'Total', X1 - 125, Y0 + 336, { size: 26, weight: 800, fill: 'ink' });
      label(ctx, String(run), X1 - 125, Y0 + 410, { size: 64 * bz, weight: 800, fill: 'yellow' });
      const parts = []; coins.forEach((v, j) => { if (j) parts.push(['+', 'ink', j < d ? 1 : 0.3]); parts.push([String(v), STYLE[v][0], j < d ? 1 : 0.3]); });
      parts.push(['=', 'ink', d === n ? 1 : 0.3]); parts.push([d === n ? String(total) : '?', d === n ? 'yellow' : 'muted']);
      sentence(ctx, parts, cx, Y0 + 588, 44);
      ctx.restore();
      chip(ctx, d === 0 ? 'Each coin shows how much it is worth' : d < n ? `${run - coins[d - 1]} + ${coins[d - 1]} = ${run}` : `${total} altogether in the piggy bank!`, cx, Y1 - 32, d === n ? 'yellow' : 'ink', 24);
      ctx.restore();
    },

    // Paint dots on one wing of a butterfly, fold it over, open it: the
    // other wing has a matching mirror pattern. The line of symmetry runs
    // down the middle.
    'symmetry-butterfly'(b, ctx, it, t) {
      const k = b.clock; const P = 10.5; const tau = cycle(t, P, 0.2);
      const bxc = cx; const byc = Y0 + 290;
      const DOTS = [[120, -92, 24, '#fb7185'], [178, -46, 15, '#facc15'], [76, -34, 13, '#22d3ee'], [168, -118, 11, '#ffffff'], [108, 86, 20, '#a78bfa'], [64, 58, 11, '#34d399'], [140, 62, 10, '#fb923c']];
      let sX = 1;
      if (tau > 3.4 && tau < 4.3) sX = Math.cos(PI * smooth((tau - 3.4) / 0.9)); else if (tau >= 4.3 && tau < 4.7) sX = -1; else if (tau >= 4.7 && tau < 5.6) sX = Math.cos(PI * (1 - smooth((tau - 4.7) / 0.9)));
      const moved = tau > 4.3; const dotFade = 1 - smooth((tau - 9.9) / 0.5);
      const hold = after(tau, 5.6, 0.4) * dotFade;
      const wing = (sd, s, dotsOn) => {
        ctx.save(); ctx.translate(bxc, byc); ctx.scale(sd * s, 1);
        oval(ctx, 126, -62, 118, 88, -0.4, null, '#1d4ed8', 9); oval(ctx, 92, 74, 78, 64, 0.45, null, '#1d4ed8', 9);
        oval(ctx, 126, -62, 118, 88, -0.4, '#7dd3fc'); oval(ctx, 92, 74, 78, 64, 0.45, '#7dd3fc');
        ctx.strokeStyle = 'rgba(29,78,216,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, -10); ctx.lineTo(200, -110); ctx.moveTo(10, 0); ctx.lineTo(210, -30); ctx.moveTo(10, 10); ctx.lineTo(130, 110); ctx.stroke();
        DOTS.forEach(([x, y, r, c], j) => { const a = dotsOn(j); if (a > 0) { ctx.save(); ctx.globalAlpha *= clamp(a); circ(ctx, x, y, r * Math.min(1.15, a), c); ctx.restore(); } });
        ctx.restore();
      };
      const leftDot = (j) => pop(tau, 0.7 + j * 0.34, 0.35) * dotFade;
      const rightDot = () => (moved ? dotFade : 0);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Symmetry');
      // The line of symmetry.
      ctx.save(); ctx.globalAlpha *= 0.4 + 0.6 * hold; line(ctx, cx, Y0 + 100, cx, Y0 + 458, 'yellow', 4, [12, 10]); ctx.restore();
      if (sX >= 0) { wing(-1, 1, leftDot); wing(1, sX, rightDot); } else { wing(-1, 1, leftDot); wing(1, sX, rightDot); }
      // Body on top.
      oval(ctx, bxc, byc + 10, 13, 70, 0, '#3b2f5c'); circ(ctx, bxc, byc - 70, 18, '#3b2f5c');
      ctx.strokeStyle = '#3b2f5c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(bxc - 6, byc - 84); ctx.quadraticCurveTo(bxc - 18, byc - 120, bxc - 34, byc - 134); ctx.moveTo(bxc + 6, byc - 84); ctx.quadraticCurveTo(bxc + 18, byc - 120, bxc + 34, byc - 134); ctx.stroke();
      circ(ctx, bxc - 34, byc - 134, 6, '#3b2f5c'); circ(ctx, bxc + 34, byc - 134, 6, '#3b2f5c');
      dotEyes(ctx, bxc, byc - 72, 14, 3, '#ffffff'); smile(ctx, bxc, byc - 62, 6, '#ffffff', 2);
      // The paintbrush while painting.
      if (tau > 0.5 && tau < 3.2) {
        const f = clamp((tau - 0.7) / 0.34); const j = Math.min(DOTS.length - 1, Math.floor(f)); const j2 = Math.min(DOTS.length - 1, j + 1); const g = smooth(f - j);
        const bxp = bxc - lerp(DOTS[j][0], DOTS[j2][0], tau > 0.7 + (DOTS.length - 1) * 0.34 ? 0 : g); const byp = byc + lerp(DOTS[j][1], DOTS[j2][1], tau > 0.7 + (DOTS.length - 1) * 0.34 ? 0 : g);
        ctx.save(); ctx.translate(bxp, byp); ctx.rotate(-0.7); line(ctx, 0, -14, 0, -96, '#b45309', 8); ctx.fillStyle = '#94a3b8'; ctx.fillRect(-6, -26, 12, 14); ctx.fillStyle = DOTS[j][3]; ctx.beginPath(); ctx.moveTo(-6, -12); ctx.quadraticCurveTo(0, 6, 6, -12); ctx.fill(); ctx.restore();
      }
      ctx.save(); ctx.globalAlpha *= 0.5 + 0.5 * hold; label(ctx, 'line of symmetry', cx, Y0 + 486, { size: 24, weight: 800, fill: 'yellow' }); ctx.restore();
      // Other things with a line of symmetry.
      [[cx - 210, 'heart'], [cx, 'star'], [cx + 210, 'A']].forEach(([x, kind]) => {
        const y = Y0 + 572;
        if (kind === 'heart') { heartPath(ctx, x, y + 2, 32); ctx.fillStyle = '#f472b6'; ctx.fill(); } else if (kind === 'star') { starPath(ctx, x, y + 4, 38, 16); ctx.fillStyle = '#facc15'; ctx.fill(); } else label(ctx, 'A', x, y + 4, { size: 70, weight: 800, fill: '#38bdf8' });
        line(ctx, x, y - 44, x, y + 46, 'ink', 3, [7, 6]);
      });
      chip(ctx, tau < 3.3 ? 'Paint spots on one wing' : tau < 4.7 ? 'Fold it over…' : tau < 5.6 ? 'Open it up!' : 'Both sides match: it is symmetrical', cx, Y1 - 32, tau < 5.6 ? 'ink' : 'yellow', 24);
      ctx.restore();
    },

    // A frog hops along a number line from 0 to 20: forward to add, back to
    // take away, counting each hop.
    'number-line-hop'(b, ctx, it, t) {
      const k = b.clock;
      const pr = (v, d) => (Array.isArray(v) && v.length >= 2 ? [Math.round(clamp(val(v[0], d[0]), 0, 20)), Math.round(clamp(val(v[1], d[1]), 0, 20))] : d);
      const [a1, a2r] = pr(it.add, [3, 5]); const a2 = Math.min(a2r, 20 - a1);
      const [s1, s2r] = pr(it.take, [12, 4]); const s2 = Math.min(s2r, s1);
      const PROB = [[a1, a2, 1], [s1, s2, -1]];
      const HOP = 0.62; const T1 = 1.4; const durs = PROB.map(([, h]) => T1 + h * HOP + 3.8);
      const P = durs[0] + durs[1]; const u = cycle(t, P, 0.2); const pi = u < durs[0] ? 0 : 1; const tau = pi ? u - durs[0] : u; const D = durs[pi];
      const [st, h, dir] = PROB[pi]; const end = st + dir * h; const col = dir > 0 ? 'green' : 'red';
      const ly = Y0 + 392; const nx = (v) => X0 + 48 + v * 35.2;
      const hopF = clamp((tau - T1) / HOP, 0, h); const done = Math.min(h, Math.floor(hopF)); const fr = done >= h ? 0 : hopF - done;
      const pos = st + dir * (done + smooth(fr)); const jump = Math.sin(PI * fr) * 70;
      const fin = tau > T1 + h * HOP + 0.2;
      const show = smooth(tau / 0.3) * smooth((D - tau) / 0.3);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Hopping on a number line');
      // The line.
      line(ctx, nx(0) - 24, ly, nx(20) + 24, ly, 'ink', 5);
      head(ctx, nx(20) + 30, ly, 0, 14, 'ink'); head(ctx, nx(0) - 30, ly, PI, 14, 'ink');
      ctx.save(); ctx.globalAlpha *= show;
      circ(ctx, nx(st), ly + 38, 20, tint('blue', 0.5));
      if (fin) circ(ctx, nx(end), ly + 38, 21, 'yellow');
      ctx.restore();
      for (let v = 0; v <= 20; v++) {
        const big = v % 5 === 0; line(ctx, nx(v), ly - (big ? 13 : 9), nx(v), ly + (big ? 13 : 9), 'ink', big ? 4 : 3);
        label(ctx, String(v), nx(v), ly + 39, { size: big ? 24 : 22, weight: big ? 800 : 700, fill: fin && v === end && show > 0.5 ? DARKTEXT : 'ink' });
      }
      ctx.save(); ctx.globalAlpha *= show;
      label(ctx, dir > 0 ? `Start at ${st}. Hop ${h} forward.` : `Start at ${st}. Hop ${h} back.`, cx, Y0 + 130, { size: 30, weight: 800, fill: col });
      // Hop arcs with counts.
      for (let m = 0; m < h; m++) {
        const pm = m < done ? 1 : m === done ? fr : 0; if (pm <= 0) continue;
        const xa = nx(st + dir * m); const xb = nx(st + dir * (m + 1)); const qx = (xa + xb) / 2; const qy = ly - 84;
        ctx.strokeStyle = color(col); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(xa, ly - 8);
        const N = 14; for (let j = 1; j <= N * pm; j++) { const s = j / N; ctx.lineTo((1 - s) * (1 - s) * xa + 2 * s * (1 - s) * qx + s * s * xb, (1 - s) * (1 - s) * (ly - 8) + 2 * s * (1 - s) * qy + s * s * (ly - 8)); }
        ctx.stroke();
        if (m < done) { head(ctx, xb, ly - 10, dir > 0 ? 1.1 : PI - 1.1, 9, col); label(ctx, String(m + 1), qx, ly - 62, { size: 22, weight: 800, fill: col }); }
      }
      ctx.restore();
      // The frog.
      sc(ctx, nx(pos), ly - 27 - jump, 0.58 * pop(t, 0.1), () => { ctx.save(); if (fr > 0) ctx.scale(1 + 0.06 * Math.sin(PI * fr), 1 - 0.06 * Math.sin(PI * fr)); oval(ctx, -38, 22, 18, 12, -0.3, '#43a047'); oval(ctx, 38, 22, 18, 12, 0.3, '#43a047'); oval(ctx, 0, 0, 44, 32, 0, '#4caf50'); oval(ctx, 0, 9, 28, 18, 0, '#c5e1a5'); circ(ctx, -22, -28, 15, '#4caf50'); circ(ctx, 22, -28, 15, '#4caf50'); eyes(ctx, 0, -29, 44, 9.5, k, 5, dir * 0.6); smile(ctx, 0, -2, 20, '#1b5e20', 3); cheeks(ctx, 0, -6, 58, 5); ctx.restore(); });
      ctx.save(); ctx.globalAlpha *= show;
      if (fin) { const q = pop(tau, T1 + h * HOP + 0.2); sc(ctx, cx, Y0 + 540, q, () => sentence(ctx, [[String(st), 'ink'], [dir > 0 ? '+' : '−', col], [String(h), col], ['=', 'ink'], [String(end), 'yellow']], 0, 0, 58)); }
      ctx.restore();
      chip(ctx, dir > 0 ? 'Adding: hop forward to bigger numbers' : 'Taking away: hop back to smaller numbers', cx, Y1 - 32, col, 23);
      ctx.restore();
    },

    // Socks on a washing line pair up: even numbers pair perfectly, odd
    // numbers leave one sock on its own. 1 to 10, colour-coded.
    'odd-even'(b, ctx, it, t) {
      const k = b.clock; const D = 2.9; const u = cycle(t, D * 10, 0.3); const n = Math.floor(u / D) % 10 + 1; const tau = u - (n - 1) * D;
      const even = n % 2 === 0; const EV = '#5b8cff'; const OD = '#ff9f43';
      const show = smooth(tau / 0.25) * smooth((D - tau) / 0.2);
      const PC = ['#f472b6', '#34d399', '#facc15', '#a78bfa', '#22d3ee'];
      const ropeY = (x) => Y0 + 182 + 14 * (1 - ((x - cx) / 400) ** 2);
      const sock = (x, y, c, face, lone) => {
        ctx.save(); ctx.translate(x, y); if (lone) ctx.rotate(Math.sin(k * 5) * 0.1);
        ctx.fillStyle = '#f1f5f9'; ctx.fillRect(-4, -10, 8, 16);
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-17, 4); ctx.lineTo(17, 4); ctx.lineTo(17, 84); ctx.lineTo(36, 84);
        ctx.quadraticCurveTo(52, 84, 52, 102); ctx.quadraticCurveTo(52, 120, 36, 120); ctx.lineTo(-4, 120); ctx.quadraticCurveTo(-17, 120, -17, 106); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(-17, 4, 34, 14); ctx.fillRect(-17, 30, 34, 7);
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(30, 120); ctx.quadraticCurveTo(52, 120, 52, 102); ctx.lineTo(40, 102); ctx.quadraticCurveTo(40, 112, 30, 112); ctx.closePath(); ctx.fill();
        dotEyes(ctx, 0, 56, 14, 3);
        if (face === 'happy') smile(ctx, 0, 70, 6, PUPIL, 2.5); else if (face === 'lone') circ(ctx, 0, 70, 4, PUPIL);
        ctx.restore();
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Odd and even');
      for (let j = 1; j <= 10; j++) {
        const x = cx + (j - 5.5) * 72; const on = j === n; const c = j % 2 ? OD : EV; const lift = on ? 6 : 0;
        ctx.fillStyle = on ? c : tint(c, 0.22); rounded(ctx, x - 31, Y0 + 66 - lift, 62, 54, 14); ctx.fill();
        if (on) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke(); }
        label(ctx, String(j), x, Y0 + 94 - lift, { size: 28, weight: 800, fill: on ? DARKTEXT : c });
      }
      // The washing line.
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 3; ctx.beginPath(); for (let x = X0 + 16; x <= X1 - 16; x += 20) { if (x === X0 + 16) ctx.moveTo(x, ropeY(x)); else ctx.lineTo(x, ropeY(x)); } ctx.stroke();
      ctx.save(); ctx.globalAlpha *= show;
      const np = Math.ceil(n / 2); const mv = smooth((tau - 0.85) / 0.6); const paired = mv > 0.95;
      for (let j = 0; j < n; j++) {
        const p = Math.floor(j / 2); const side = j % 2; const lone = !even && j === n - 1;
        const x0 = cx - 17 + (j - (n - 1) / 2) * 70; const x1 = cx - 17 + (p - (np - 1) / 2) * 136 + (lone ? 0 : side ? 20 : -20);
        const x = lerp(x0, x1, mv); const a = pop(tau, 0.05 + j * 0.06, 0.4);
        if (a > 0) sc(ctx, x, ropeY(x), a, () => sock(0, 0, PC[p % 5], paired ? (lone ? 'lone' : 'happy') : '', lone && paired));
      }
      if (paired) {
        for (let p = 0; p < np; p++) {
          const x = cx + (p - (np - 1) / 2) * 136; const lone = !even && p === np - 1;
          if (lone) label(ctx, 'left over', x, Y0 + 350, { size: 22, weight: 800, fill: OD });
          else tick(ctx, x, Y0 + 344, 30, 'green');
        }
      }
      const sq = after(tau, 1.5, 0.4);
      if (sq > 0) {
        ctx.save(); ctx.globalAlpha *= sq;
        label(ctx, `${n} is ${even ? 'even' : 'odd'}`, cx, Y0 + 442, { size: 50, weight: 800, fill: even ? EV : OD });
        label(ctx, even ? 'Every sock has a partner' : 'One sock is left over', cx, Y0 + 498, { size: 26, weight: 700, fill: 'ink' });
        ctx.restore();
      }
      ctx.restore();
      chip(ctx, 'Even: 2, 4, 6, 8, 10', cx - 190, Y1 - 48, EV, 24);
      chip(ctx, 'Odd: 1, 3, 5, 7, 9', cx + 190, Y1 - 48, OD, 24);
      ctx.restore();
    },

    // ─── Everyday life ──────────────────────────────────────────────────

    // A car stops at red, gets ready at amber and goes at green; while the
    // cars wait, the green walking figure lets a child cross the zebra
    // crossing after stop, look, listen.
    'traffic-light'(b, ctx, it, t) {
      const k = b.clock; const P = 13; const tau = cycle(t, P, 0.3);
      const ph = tau < 5.5 ? 0 : tau < 9.5 ? 1 : 2; // red, green, amber
      const xs = X0 + 330; let carX;
      if (ph === 0) carX = xs; else if (ph === 1) { const q = (tau - 5.5) / 4; carX = xs + 760 * q * q; } else { const q = (tau - 9.5) / 3.5; carX = xs - 520 * (1 - q) * (1 - q); }
      const roadT = Y0 + 372; const roadB = Y0 + 508; const base = Y0 + 470;
      const LIT = [['Stop', '#ef4444', Y0 + 106], ['Go', '#22c55e', Y0 + 226], ['Get ready', '#f59e0b', Y0 + 166]];
      const walkX = X0 + 505; let walkA = 0; let fy = Y0 + 545; let back = false; let step = 0;
      if (ph === 0) { walkA = 1 - smooth((tau - 4.9) / 0.5); if (tau > 1.8) { const q = clamp((tau - 1.8) / 3); fy = lerp(Y0 + 545, Y0 + 356, q); back = q < 1; step = q < 1 ? Math.sin(tau * 12) : 0; if (q >= 1) fy = Y0 + 356; } }
      else if (ph === 2) walkA = smooth((tau - 9.8) / 0.5);
      const look = ph === 0 && tau < 1.8 ? Math.floor(tau / 0.6) : -1;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Traffic lights');
      cloud(ctx, X0 + 110, Y0 + 300, 0.7, 'rgba(230,236,255,0.3)');
      // Pavements, road, grass.
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(X0, roadT - 40, FIG.w, 40); ctx.fillRect(X0, roadB, FIG.w, 44);
      ctx.fillStyle = '#334155'; ctx.fillRect(X0, roadT, FIG.w, roadB - roadT);
      ctx.fillStyle = 'rgba(52,211,153,0.3)'; ctx.fillRect(X0, roadB + 44, FIG.w, 48);
      ctx.fillStyle = '#f8fafc'; for (let y = roadT + 8; y < roadB - 8; y += 26) ctx.fillRect(X0 + 452, y, 108, 14);
      ctx.fillRect(X0 + 420, roadT + 2, 8, roadB - roadT - 4);
      // The car.
      ctx.save(); clipRect(ctx, X0, Y0, FIG.w, FIG.h);
      const cxp = carX; const spin = carX / 16;
      ctx.fillStyle = '#3b82f6'; rounded(ctx, cxp - 76, base - 58, 152, 40, 12); ctx.fill(); rounded(ctx, cxp - 42, base - 92, 84, 38, 12); ctx.fill();
      ctx.fillStyle = '#bfe6ff'; rounded(ctx, cxp - 34, base - 86, 32, 26, 5); ctx.fill(); rounded(ctx, cxp + 4, base - 86, 30, 26, 5); ctx.fill();
      circ(ctx, cxp + 70, base - 42, 6, '#fde68a'); circ(ctx, cxp - 72, base - 42, 6, ph === 2 || ph === 0 ? '#ff2d2d' : '#7f1d1d');
      wheel(ctx, cxp - 46, base - 14, 16, spin); wheel(ctx, cxp + 46, base - 14, 16, spin);
      eyes(ctx, cxp + 52, base - 70, 0.1, 0.1, 0); // keep car faceless
      ctx.restore();
      // Car traffic light.
      ctx.fillStyle = '#475569'; ctx.fillRect(X0 + 384, Y0 + 266, 12, roadT - Y0 - 266);
      ctx.fillStyle = '#1e293b'; rounded(ctx, X0 + 350, Y0 + 66, 80, 200, 16); ctx.fill();
      [0, 2, 1].forEach((j) => { const [, c, y] = LIT[j]; const on = ph === j; if (on) circ(ctx, X0 + 390, y, 34, tint(c, 0.25)); circ(ctx, X0 + 390, y, 25, on ? c : mix(c, '#1e293b', 0.75)); });
      label(ctx, LIT[ph][0], X0 + 334, LIT[ph][2], { size: 30, weight: 800, fill: LIT[ph][1], align: 'right' });
      // Pedestrian light.
      ctx.fillStyle = '#475569'; ctx.fillRect(X1 - 106, Y0 + 250, 12, roadT - Y0 - 250);
      ctx.fillStyle = '#1e293b'; rounded(ctx, X1 - 140, Y0 + 100, 80, 150, 16); ctx.fill();
      const man = (x, y, c, walking) => { circ(ctx, x, y - 22, 7, c); ctx.strokeStyle = color(c); ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x, y + 6); if (walking) { ctx.moveTo(x, y + 6); ctx.lineTo(x - 9, y + 22); ctx.moveTo(x, y + 6); ctx.lineTo(x + 9, y + 22); ctx.moveTo(x, y - 8); ctx.lineTo(x - 10, y + 2); ctx.moveTo(x, y - 8); ctx.lineTo(x + 10, y - 2); } else { ctx.moveTo(x - 4, y + 6); ctx.lineTo(x - 4, y + 22); ctx.moveTo(x + 4, y + 6); ctx.lineTo(x + 4, y + 22); ctx.moveTo(x - 9, y - 9); ctx.lineTo(x - 9, y + 6); ctx.moveTo(x + 9, y - 9); ctx.lineTo(x + 9, y + 6); } ctx.stroke(); };
      man(X1 - 100, Y0 + 140, ph === 0 ? '#4b1d1d' : '#ef4444', false);
      man(X1 - 100, Y0 + 210, ph === 0 ? '#22c55e' : '#14361f', true);
      label(ctx, ph === 0 ? 'Walk' : 'Wait', X1 - 156, ph === 0 ? Y0 + 210 : Y0 + 140, { size: 30, weight: 800, fill: ph === 0 ? '#22c55e' : '#ef4444', align: 'right' });
      // The child.
      if (walkA > 0.01) { ctx.save(); ctx.globalAlpha *= walkA; kid(ctx, walkX, fy, 104, '#f472b6', k, back, SKINS[1], '#111827', step); ctx.restore(); }
      ['Stop', 'Look', 'Listen'].forEach((w, j) => chip(ctx, w, cx + (j - 1) * 150, Y0 + 600, look === j ? 'yellow' : look > j || (ph === 0 && tau >= 1.8) ? 'green' : 'muted', look === j ? 26 : 23));
      chip(ctx, ph === 0 ? (tau < 1.8 ? 'Red: cars stop. Stop, look, listen…' : 'Green figure: now walk across') : ph === 1 ? 'Green: cars go. People wait.' : 'Amber: cars get ready to stop', cx, Y1 - 30, LIT[ph][1], 23);
      ctx.restore();
    },

    // Cars, buses and trains go to land, boats and submarines to the sea,
    // planes, helicopters and balloons to the air, then all move along.
    'transport-sort'(b, ctx, it, t) {
      const k = b.clock; const D = 1.9; const T0 = 0.5;
      const V = [['Car', 'land'], ['Bus', 'land'], ['Train', 'land'], ['Boat', 'sea'], ['Submarine', 'sea'], ['Plane', 'air'], ['Helicopter', 'air'], ['Hot-air balloon', 'air']];
      const P = T0 + V.length * D + 5; const tau = cycle(t, P, 0); const show = smooth(tau / 0.3) * smooth((P - tau) / 0.4);
      const LX = X0 + 132; const BW = X1 - LX;
      const BANDS = { air: [Y0 + 58, Y0 + 256, 'Air', '#7dd3fc'], land: [Y0 + 262, Y0 + 444, 'Land', '#4ade80'], sea: [Y0 + 450, Y0 + 640, 'Sea', '#3b82f6'] };
      const wrap = (ph, sp) => LX - 140 + mod(ph + sp * k, BW + 280);
      // Where each one is on its lane right now: [x, y, extra].
      const lane = [
        () => [wrap(100, 95), Y0 + 432], () => [wrap(420, 60), Y0 + 404], () => [wrap(260, 75), Y0 + 334],
        () => [wrap(60, 40), Y0 + 504], () => [wrap(380, 30), Y0 + 590],
        () => [wrap(200, 130), Y0 + 96], () => { const x = LX + 140 + 330 * (0.5 + 0.5 * Math.sin(k * 0.45)); return [x, Y0 + 214, Math.cos(k * 0.45) >= 0 ? 1 : -1]; }, () => [X1 - 92, Y0 + 152 + Math.sin(k * 0.9) * 10],
      ];
      const drawV = (i, x, y, extra) => {
        const spin = k * 8;
        if (i === 0) VEH.car(ctx, x, y, spin); else if (i === 1) VEH.bus(ctx, x, y, spin); else if (i === 2) VEH.train(ctx, x, y, spin);
        else if (i === 3) VEH.boat(ctx, x, y, k); else if (i === 4) VEH.submarine(ctx, x, y, k); else if (i === 5) VEH.plane(ctx, x, y);
        else if (i === 6) VEH.helicopter(ctx, x, y, k, extra || 1); else VEH.balloon(ctx, x, y - 30);
      };
      const ctr = [cx + 66, Y0 + 350];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Land, sea and air');
      // Bands.
      const [aT, aB] = BANDS.air; scene(ctx, LX, aT, BW, aB - aT, '#7cc8ff', '#cdeeff', 16);
      cloud(ctx, LX + 120, aT + 160, 0.5, '#ffffff'); cloud(ctx, LX + 420, aT + 60, 0.45, '#ffffff');
      const [lT, lB] = BANDS.land; ctx.fillStyle = '#4ade80'; rounded(ctx, LX, lT, BW, lB - lT, 16); ctx.fill();
      ctx.fillStyle = '#8d6e4f'; for (let x = LX + 8; x < X1; x += 26) ctx.fillRect(x, Y0 + 330, 10, 10); line(ctx, LX, Y0 + 328, X1, Y0 + 328, '#64748b', 4);
      ctx.fillStyle = '#475569'; ctx.fillRect(LX, Y0 + 362, BW, 76); ctx.fillStyle = '#f8fafc'; for (let x = LX + 10; x < X1; x += 60) ctx.fillRect(x, Y0 + 398, 30, 5);
      const [sT, sB] = BANDS.sea; scene(ctx, LX, sT, BW, sB - sT, '#38bdf8', '#1e3a8a', 16);
      ctx.fillStyle = '#bae6fd'; ctx.fillRect(LX, sT, BW, 0); ctx.fillStyle = 'rgba(205,238,255,0.85)'; ctx.beginPath(); ctx.moveTo(LX, sT + 16); ctx.lineTo(LX, sT + 8); for (let x = LX; x <= X1; x += 10) ctx.lineTo(x, sT + 8); ctx.lineTo(X1, sT + 16); ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); for (let x = LX; x <= X1; x += 8) { const y = Y0 + 506 + Math.sin(x / 22 + k * 2) * 4; if (x === LX) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
      Object.values(BANDS).forEach(([y0, y1, name, c]) => { ctx.fillStyle = tint(c, 0.22); rounded(ctx, X0, y0, 124, y1 - y0, 16); ctx.fill(); label(ctx, name, X0 + 62, (y0 + y1) / 2, { size: 28, weight: 800, fill: c === '#3b82f6' ? '#7cb4ff' : c }); });
      // Vehicles already sorted, clipped to their band.
      let current = -1;
      V.forEach(([, band], i) => {
        const ta = T0 + i * D; if (tau < ta) return;
        const [y0, y1] = BANDS[band]; const age = tau - ta;
        if (age < 1.6) { current = i; return; }
        ctx.save(); clipRect(ctx, LX, y0, BW, y1 - y0, 16); ctx.globalAlpha *= show; const [x, y, e] = lane[i](); drawV(i, x, y, e); ctx.restore();
      });
      // The one arriving: a card, then a glide to its lane.
      if (current >= 0) {
        const age = tau - (T0 + current * D); const [x1, y1, e] = lane[current]();
        if (age < 0.9) { const p = pop(age, 0, 0.35); circ(ctx, ctr[0], ctr[1], 92 * p, 'rgba(5,8,22,0.85)', '#ffffff', 3); sc(ctx, ctr[0], ctr[1] + (current === 7 ? 0 : current === 4 || current >= 5 ? 0 : 24), p * (current === 2 ? 0.6 : 1), () => drawV(current, 0, 0, 1)); }
        else { const q = smooth((age - 0.9) / 0.7); ctx.save(); ctx.globalAlpha *= show; drawV(current, lerp(ctr[0], x1, q), lerp(ctr[1], y1, q), e); ctx.restore(); }
      }
      const [nm, band] = current >= 0 ? V[current] : ['', ''];
      chip(ctx, current < 0 ? (tau > T0 ? 'Land, sea and air: every one sorted!' : 'Where does it travel?') : `A ${nm.toLowerCase()} travels ${band === 'land' ? 'on land' : band === 'sea' ? 'on the sea' : 'in the air'}`, cx, Y1 - 30, current < 0 ? 'ink' : BANDS[band][3] === '#3b82f6' ? '#7cb4ff' : BANDS[band][3], 24);
      ctx.restore();
    },

    // A drum is hit, a guitar plucked, a trumpet blown and a xylophone
    // struck, each sending out sound waves; long bars make low notes and
    // short bars high notes.
    'musical-instruments'(b, ctx, it, t) {
      const k = b.clock; const D = 3.4; const act = t < 0.5 ? -1 : Math.floor(cycle(t, D * 4, 0.5) / D) % 4;
      const PW = 385; const PH = 248;
      const PANELS = [[X0 + 5, Y0 + 60, 'Drum', 'Hit', '#fb7185'], [X0 + 410, Y0 + 60, 'Guitar', 'Pluck', '#fbbf24'], [X0 + 5, Y0 + 328, 'Trumpet', 'Blow', '#f59e0b'], [X0 + 410, Y0 + 328, 'Xylophone', 'Strike', '#34d399']];
      const waves = (sx, sy, spacing, speed, c, amt) => {
        if (amt <= 0.01) return;
        for (let j = 0; j < 8; j++) { const r = mod(k * speed + j * spacing, 110); if (r > 104) continue; ctx.strokeStyle = tint(c, (1 - r / 110) * amt); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(sx, sy, r + 8, -0.6, 0.6); ctx.stroke(); }
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Musical instruments');
      PANELS.forEach(([x, y, name, verb, c], i) => {
        const on = i === act; const amt = on ? 1 : 0.25; const ix = x + 135; const iy = y + 152;
        ctx.fillStyle = tint(c, on ? 0.15 : 0.06); rounded(ctx, x, y, PW, PH, 20); ctx.fill();
        ctx.strokeStyle = on ? color(c) : tint(c, 0.35); ctx.lineWidth = on ? 4 : 2; rounded(ctx, x, y, PW, PH, 20); ctx.stroke();
        label(ctx, name, x + 20, y + 32, { size: 26, weight: 800, fill: on ? c : 'ink', align: 'left' });
        label(ctx, `${verb}!`, x + PW - 20, y + 32, { size: 24, weight: 800, fill: on ? c : 'muted', align: 'right' });
        const hitP = mod(k, 0.7) / 0.7;
        if (i === 0) {
          const ang = on ? (hitP < 0.25 ? lerp(-0.9, 0, smooth(hitP / 0.25)) : lerp(0, -0.9, smooth((hitP - 0.25) / 0.75))) : -0.6;
          ctx.fillStyle = '#ef4444'; ctx.fillRect(ix - 72, iy - 30, 144, 80); oval(ctx, ix, iy + 50, 72, 18, 0, '#b91c1c');
          ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 3; ctx.beginPath(); for (let j = 0; j <= 6; j++) { ctx.lineTo(ix - 72 + j * 24, iy + (j % 2 ? 40 : -22)); } ctx.stroke();
          oval(ctx, ix, iy - 30, 72, 18, 0, '#fef3c7', '#d6d3d1', 3);
          const pulse = on && hitP < 0.4 ? 1 - hitP / 0.4 : 0; if (pulse > 0) oval(ctx, ix, iy - 30, 60 * (1 - pulse * 0.3), 12, 0, null, tint('yellow', pulse), 3);
          ctx.save(); ctx.translate(ix + 92, iy - 90); ctx.rotate(ang); line(ctx, 0, 0, -78, 54, '#b45309', 7); circ(ctx, -78, 54, 8, '#fde68a'); ctx.restore();
          waves(ix + 110, iy - 10, 30, 50, c, amt * (on ? 0.4 + 0.6 * (1 - hitP) : 1));
        } else if (i === 1) {
          ctx.save(); ctx.translate(ix - 10, iy + 10); ctx.rotate(-0.5);
          ctx.fillStyle = '#92400e'; rounded(ctx, 40, -9, 140, 18, 4); ctx.fill(); ctx.fillStyle = '#78350f'; rounded(ctx, 176, -14, 30, 28, 6); ctx.fill();
          circ(ctx, -26, 0, 52, '#f59e0b'); circ(ctx, 34, 0, 40, '#f59e0b'); circ(ctx, 18, 0, 15, '#451a03');
          ctx.fillStyle = '#78350f'; ctx.fillRect(-60, -16, 10, 32);
          const vib = on ? Math.exp(-hitP * 3) : 0;
          for (let s = 0; s < 4; s++) { const yy = -9 + s * 6; ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1.5 + (3 - s) * 0.5; ctx.beginPath(); ctx.moveTo(-55, yy); for (let j = 1; j <= 16; j++) { const xx = -55 + j * 16; ctx.lineTo(xx, yy + Math.sin(j * PI / 16) * Math.sin(k * 60 + s) * 4 * vib); } ctx.stroke(); }
          const fx = on ? 18 + Math.sin(hitP * PI) * 4 : 18; circ(ctx, fx, -20 + (on && hitP < 0.2 ? hitP * 60 : 12), 9, SKINS[2]);
          ctx.restore();
          waves(x + 285, iy - 20, 22, 45, c, amt * (on ? 0.3 + 0.7 * Math.exp(-hitP * 2) : 1));
        } else if (i === 2) {
          ctx.fillStyle = '#fbbf24'; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 12; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(ix - 92, iy); ctx.lineTo(ix + 54, iy); ctx.stroke();
          ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(ix - 60, iy); ctx.quadraticCurveTo(ix - 70, iy + 34, ix - 20, iy + 34); ctx.lineTo(ix + 30, iy + 34); ctx.quadraticCurveTo(ix + 50, iy + 34, ix + 50, iy); ctx.stroke();
          for (const vx of [-20, 0, 20]) { ctx.fillStyle = '#d97706'; ctx.fillRect(ix + vx - 5, iy - 30, 10, 26); circ(ctx, ix + vx, iy - 32, 7, '#fde68a'); }
          ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.moveTo(ix + 50, iy - 7); ctx.quadraticCurveTo(ix + 90, iy - 10, ix + 104, iy - 40); ctx.lineTo(ix + 104, iy + 40); ctx.quadraticCurveTo(ix + 90, iy + 10, ix + 50, iy + 7); ctx.closePath(); ctx.fill();
          oval(ctx, ix + 104, iy, 8, 40, 0, '#d97706');
          circ(ctx, ix - 98, iy, 8, '#d97706');
          if (on) for (let j = 0; j < 3; j++) { const q = mod(k * 1.5 + j / 3, 1); circ(ctx, ix - 150 + q * 50, iy + Math.sin(q * 8) * 3, 5 * (1 - q) + 2, `rgba(220,240,255,${0.8 * (1 - q)})`); }
          waves(ix + 116, iy, 18, 60, c, amt);
        } else {
          const strikeLow = Math.floor(k / 0.8) % 2 === 0; const hp = mod(k, 0.8) / 0.8;
          line(ctx, ix - 100, iy - 40, ix + 80, iy - 26, '#92400e', 6); line(ctx, ix - 100, iy + 46, ix + 80, iy + 22, '#92400e', 6);
          const BC = ['#ef4444', '#fb923c', '#facc15', '#22c55e', '#3b82f6', '#a855f7'];
          BC.forEach((bc, j) => { const h = 116 - j * 14; const bxx = ix - 90 + j * 32; const hit = on && ((strikeLow && j === 0) || (!strikeLow && j === 5)) && hp < 0.3; ctx.fillStyle = hit ? mix(bc, '#ffffff', 0.4) : bc; rounded(ctx, bxx - 12, iy + 3 - h / 2, 24, h, 5); ctx.fill(); circ(ctx, bxx, iy + 3 - h / 2 + 10, 3, '#fde68a'); circ(ctx, bxx, iy + 3 + h / 2 - 10, 3, '#fde68a'); });
          const tx = strikeLow ? ix - 90 : ix + 70; const ty = strikeLow ? iy - 40 : iy - 2; const lift = on ? (hp < 0.15 ? 0 : Math.sin(((hp - 0.15) / 0.85) * PI) * 30) : 20;
          line(ctx, tx + 50, ty - 60 - lift, tx, ty - lift, '#b45309', 5); circ(ctx, tx, ty - lift, 10, '#f8fafc');
          label(ctx, 'low', ix - 90, iy + 86, { size: 22, weight: 800, fill: on && strikeLow ? c : 'muted' });
          label(ctx, 'high', ix + 70, iy + 86, { size: 22, weight: 800, fill: on && !strikeLow ? c : 'muted' });
          waves(ix + 120, iy - 8, on ? (strikeLow ? 34 : 13) : 22, on ? (strikeLow ? 35 : 70) : 40, c, amt);
        }
        if (on) for (let j = 0; j < 2; j++) { const q = mod(k * 0.5 + j / 2, 1); ctx.save(); ctx.globalAlpha *= Math.sin(q * PI); note(ctx, x + PW - 70 + j * 30, y + PH - 30 - q * 120, 1, c); ctx.restore(); }
      });
      const SAY = ['Hit a drum: boom, boom!', 'Pluck the strings: twang!', 'Blow into a trumpet: toot!', 'Long bars play low notes, short bars high notes'];
      chip(ctx, act >= 0 ? SAY[act] : 'How do instruments make sounds?', cx, Y1 - 44, act >= 0 ? PANELS[act][4] : 'ink', 23);
      ctx.restore();
    },

    // Six friendly faces: happy, sad, angry, scared, surprised and calm,
    // with what might cause each, then a calm-down breath: in 4, out 4.
    'feelings-faces'(b, ctx, it, t) {
      const k = b.clock; const D = 2.6; const T0 = 0.6; const FT = T0 + 6 * D; const BT = 16.6; const P = FT + BT;
      const tau = cycle(t, P, 0);
      const F = [['Happy', '#fcd34d', 'playing with a friend'], ['Sad', '#7cb4ff', 'losing a favourite toy'], ['Angry', '#f87171', 'someone takes your turn'], ['Scared', '#c4b5fd', 'a loud storm at night'], ['Surprised', '#fdba74', 'a surprise party'], ['Calm', '#86efac', 'reading a quiet book']];
      const faceA = tau < FT ? smooth(tau / 0.5) : 1 - smooth((tau - FT) / 0.5);
      const brA = smooth((tau - FT - 0.3) / 0.5) * smooth((P - tau) / 0.5);
      const a = tau >= T0 && tau < FT ? Math.floor((tau - T0) / D) : -1; const fa = a >= 0 ? (tau - T0 - a * D) / D : 0;
      const face = (x, y, r, i, on) => {
        let dx = 0; let dy = 0; let s = 1;
        if (i === 0) dy = -Math.abs(Math.sin(k * 4)) * 8 * on; if (i === 2) dx = Math.sin(k * 30) * 2.5 * on; if (i === 3) dx = Math.sin(k * 40) * 1.6 * (0.3 + on); if (i === 4) s = 1 + 0.06 * Math.abs(Math.sin(k * 3)) * on; if (i === 5) dx = Math.sin(k * 1.2) * 4;
        sc(ctx, x + dx, y + dy, (r / 70) * s, () => {
          circ(ctx, 0, 0, 70, F[i][1]);
          oval(ctx, -30, -38, 12, 7, -0.5, 'rgba(255,255,255,0.4)');
          ctx.strokeStyle = PUPIL; ctx.lineWidth = 5; ctx.lineCap = 'round';
          if (i === 0) { eyes(ctx, 0, -14, 44, 10, k, 0); smile(ctx, 0, 22, 26, PUPIL, 5, 1); cheeks(ctx, 0, 12, 82, 9); }
          if (i === 1) { ctx.beginPath(); ctx.moveTo(-36, -28); ctx.lineTo(-12, -38); ctx.moveTo(36, -28); ctx.lineTo(12, -38); ctx.stroke(); eyes(ctx, 0, -12, 44, 9, k, 1); frown(ctx, 0, 30, 20, PUPIL, 5); const q = mod(k * 0.8, 1); drop(ctx, -24, 2 + q * 40, 6, `rgba(125,211,252,${1 - q})`); }
          if (i === 2) { ctx.beginPath(); ctx.moveTo(-38, -40); ctx.lineTo(-12, -26); ctx.moveTo(38, -40); ctx.lineTo(12, -26); ctx.stroke(); eyes(ctx, 0, -12, 44, 7.5, k, 2); ctx.beginPath(); ctx.moveTo(-20, 34); ctx.quadraticCurveTo(0, 22, 20, 34); ctx.stroke(); if (on > 0.5) for (const sx of [-1, 1]) { const q = mod(k * 1.2 + (sx > 0 ? 0.5 : 0), 1); circ(ctx, sx * (50 + q * 10), -66 - q * 30, 8 + q * 8, `rgba(255,255,255,${0.6 * (1 - q)})`); } }
          if (i === 3) { ctx.beginPath(); ctx.moveTo(-36, -36); ctx.quadraticCurveTo(-24, -46, -12, -40); ctx.moveTo(36, -36); ctx.quadraticCurveTo(24, -46, 12, -40); ctx.stroke(); circ(ctx, -20, -14, 13, '#ffffff'); circ(ctx, 20, -14, 13, '#ffffff'); circ(ctx, -20, -12, 4.5, PUPIL); circ(ctx, 20, -12, 4.5, PUPIL); ctx.lineWidth = 4; ctx.beginPath(); for (let j = 0; j <= 6; j++) { const xx = -21 + j * 7; const yy = 30 + (j % 2 ? -5 : 5); if (j) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); } ctx.stroke(); drop(ctx, 52, -18, 6, '#7dd3fc'); }
          if (i === 4) { ctx.beginPath(); ctx.arc(-20, -38, 12, PI * 1.15, PI * 1.85); ctx.moveTo(32, -42); ctx.arc(20, -38, 12, PI * 1.15, PI * 1.85); ctx.stroke(); circ(ctx, -20, -12, 12, '#ffffff'); circ(ctx, 20, -12, 12, '#ffffff'); circ(ctx, -20, -11, 6, PUPIL); circ(ctx, 20, -11, 6, PUPIL); oval(ctx, 0, 30, 12, 16, 0, '#7c2d12'); }
          if (i === 5) { ctx.beginPath(); ctx.arc(-20, -16, 10, 0.15 * PI, 0.85 * PI); ctx.moveTo(30, -14); ctx.arc(20, -16, 10, 0.15 * PI, 0.85 * PI); ctx.stroke(); smile(ctx, 0, 24, 16, PUPIL, 5); cheeks(ctx, 0, 10, 78, 8); }
        });
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Feelings');
      if (faceA > 0.01) {
        ctx.save(); ctx.globalAlpha *= faceA;
        F.forEach(([name, c], i) => {
          const x = cx + ((i % 3) - 1) * 250; const y = i < 3 ? Y0 + 158 : Y0 + 392; const on = i === a ? bump(fa, 0.12) : 0;
          if (on > 0.01) circ(ctx, x, y, 92, tint(c, 0.22 * on));
          face(x, y, 68 * (1 + 0.1 * on), i, on);
          label(ctx, name, x, y + 100, { size: i === a ? 28 : 26, weight: 800, fill: i === a ? c : 'ink' });
        });
        if (a >= 0) chip(ctx, `${F[a][0]}: ${F[a][2]}`, cx, Y0 + 560, F[a][1], 26);
        ctx.restore();
      }
      if (brA > 0.01) {
        ctx.save(); ctx.globalAlpha *= brA;
        const tb = Math.max(0, tau - FT - 0.5); const ph = mod(tb, 8); const inh = ph < 4; const s = inh ? smooth(ph / 4) : 1 - smooth((ph - 4) / 4);
        const r = 84 + 100 * s; const bx = cx - 50; const by = Y0 + 318;
        for (let j = 3; j >= 1; j--) circ(ctx, bx, by, r + j * 14, tint('green', 0.06 * j));
        circ(ctx, bx, by, r, tint('green', 0.3), '#86efac', 4);
        face(bx, by, 46 + 22 * s, 5, 0);
        const cnt = Math.floor(ph % 4) + 1;
        label(ctx, String(cnt), cx + 250, by - 10, { size: 88, weight: 800, fill: inh ? '#86efac' : '#7dd3fc' });
        for (let j = 0; j < 4; j++) circ(ctx, cx + 250 + (j - 1.5) * 26, by + 62, j < cnt ? 9 : 6, j < cnt ? (inh ? '#86efac' : '#7dd3fc') : 'rgba(200,215,255,0.3)');
        label(ctx, inh ? 'Breathe in…' : 'Breathe out…', cx, Y0 + 558, { size: 38, weight: 800, fill: inh ? '#86efac' : '#7dd3fc' });
        ctx.restore();
      }
      chip(ctx, tau < FT ? 'All feelings are OK' : 'Big feeling? Breathe in 4, out 4', cx, Y1 - 32, tau < FT ? 'ink' : '#86efac', 24);
      ctx.restore();
    },

    // Doctor, nurse, firefighter, police officer, teacher, farmer, builder
    // and vet, each with a tool, and what they do.
    'community-helpers'(b, ctx, it, t) {
      const k = b.clock; const D = 2.7; const a = t < 0.6 ? -1 : Math.floor(cycle(t, D * 8, 0.6) / D) % 8; const fa = a >= 0 ? (cycle(t, D * 8, 0.6) - a * D) / D : 0;
      const H = [
        ['Doctor', 'Doctors help sick people get better', { shirt: '#f8fafc', coat: true, pants: '#475569', skin: SKINS[0], hair: 'short', hairC: '#2b1d14' }, '#7dd3fc'],
        ['Nurse', 'Nurses care for people in hospital', { shirt: '#2dd4bf', pants: '#14b8a6', skin: SKINS[1], hair: 'bun', hairC: '#111827' }, '#2dd4bf'],
        ['Firefighter', 'Firefighters put out fires and rescue people', { shirt: '#374151', pants: '#374151', skin: SKINS[4], hair: 'none', hairC: '#7c2d12', hand: [30, -58] }, '#fb923c'],
        ['Police officer', 'Police officers keep people safe', { shirt: '#1e3a8a', pants: '#1e293b', skin: SKINS[3], hair: 'short', hairC: '#111827' }, '#5b8cff'],
        ['Teacher', 'Teachers help children learn', { shirt: '#a855f7', pants: '#334155', skin: SKINS[2], hair: 'long', hairC: '#3f2a1d' }, '#a78bfa'],
        ['Farmer', 'Farmers grow the food we eat', { shirt: '#ef4444', pants: '#2563eb', skin: SKINS[5], hair: 'short', hairC: '#111827' }, '#4ade80'],
        ['Builder', 'Builders make homes, schools and roads', { shirt: '#f97316', pants: '#475569', skin: SKINS[6], hair: 'none', hairC: '#7c2d12', hand: [26, -60] }, '#fbbf24'],
        ['Vet', 'Vets help sick animals get better', { shirt: '#22c55e', pants: '#16a34a', skin: SKINS[7], hair: 'curly', hairC: '#1f2937', hand: [8, -58] }, '#34d399'],
      ];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'People who help us');
      H.forEach(([name, , o, c], i) => {
        const x = X0 + 100 + (i % 4) * 200; const gy = i < 4 ? Y0 + 298 : Y0 + 558; const on = i === a ? bump(fa, 0.12) : 0;
        const p = pop(t, 0.1 + i * 0.08); const hgt = 160; const u = hgt / 100;
        if (on > 0.01) circ(ctx, x, gy - 92, 86, tint(c, 0.2 * on));
        sc(ctx, x, gy, p * (1 + 0.08 * on), () => {
          const oo = { ...o };
          if (i === 3 && on > 0.3) oo.hand = [24, -112 + Math.sin(k * 8) * 4];
          if (i === 6) oo.hand = [26 + Math.sin(k * (on ? 9 : 2)) * (on ? 8 : 2), -60 - Math.max(0, Math.sin(k * (on ? 9 : 2))) * (on ? 14 : 3)];
          const [hx, hy] = person(ctx, 0, 0, hgt, oo);
          if (i === 0) { ctx.strokeStyle = '#334155'; ctx.lineWidth = 2.5 * u; ctx.beginPath(); ctx.arc(0, -78 * u, 9 * u, 0.1, PI - 0.1); ctx.moveTo(8 * u, -76 * u); ctx.quadraticCurveTo(12 * u, -60 * u, 6 * u, -54 * u); ctx.stroke(); circ(ctx, 6 * u, -53 * u, 4 * u, '#cbd5e1'); line(ctx, -3 * u, -80 * u, 0, -50 * u, '#e2e8f0', 1.5 * u); }
          if (i === 1) { ctx.fillStyle = '#92400e'; rounded(ctx, hx - 2 * u, hy - 20 * u, 18 * u, 24 * u, 2 * u); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(hx + 1 * u, hy - 16 * u, 12 * u, 17 * u); ctx.fillStyle = '#ef4444'; ctx.fillRect(hx + 5.5 * u, hy - 13 * u, 3 * u, 9 * u); ctx.fillRect(hx + 2.5 * u, hy - 10 * u, 9 * u, 3 * u); }
          if (i === 2) { ctx.fillStyle = '#facc15'; ctx.fillRect(-17 * u, -58 * u, 34 * u, 4 * u); ctx.fillRect(-4 * u, -24 * u, 0, 0); ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, -98 * u, 17 * u, PI, TAU); ctx.fill(); ctx.fillRect(-22 * u, -99 * u, 44 * u, 5 * u); circ(ctx, 0, -106 * u, 5 * u, '#facc15'); line(ctx, -22 * u, -44 * u, hx - 4 * u, hy + 4 * u, '#b91c1c', 5 * u); ctx.fillStyle = '#94a3b8'; ctx.fillRect(hx - 2 * u, hy - 4 * u, 12 * u, 7 * u); if (on > 0.2) for (let j = 0; j < 9; j++) { const q = mod(k * 1.6 + j / 9, 1); circ(ctx, hx + 12 * u + q * 45 * u, hy - q * 30 * u + q * q * 40 * u, (2 + q * 3) * u, `rgba(125,211,252,${0.9 * (1 - q) * on})`); } }
          if (i === 3) { ctx.fillStyle = '#1e3a8a'; ctx.beginPath(); ctx.arc(0, -101 * u, 15 * u, PI, TAU); ctx.fill(); ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.ellipse(4 * u, -101 * u, 19 * u, 4 * u, 0, 0, PI); ctx.fill(); circ(ctx, 0, -108 * u, 4 * u, '#facc15'); ctx.fillStyle = '#facc15'; starPath(ctx, -8 * u, -66 * u, 5 * u, 2.2 * u); ctx.fill(); }
          if (i === 4) { ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + 18 * u, hy - 6 * u); ctx.lineTo(hx + 18 * u, hy - 26 * u); ctx.lineTo(hx, hy - 20 * u); ctx.lineTo(hx - 18 * u, hy - 26 * u); ctx.lineTo(hx - 18 * u, hy - 6 * u); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#fef3c7'; ctx.lineWidth = 1.5 * u; ctx.beginPath(); for (let j = 0; j < 3; j++) { ctx.moveTo(hx - 14 * u, hy - 20 * u + j * 4 * u); ctx.lineTo(hx - 4 * u, hy - 17 * u + j * 4 * u); ctx.moveTo(hx + 4 * u, hy - 17 * u + j * 4 * u); ctx.lineTo(hx + 14 * u, hy - 20 * u + j * 4 * u); } ctx.stroke(); }
          if (i === 5) { ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.moveTo(-10 * u, -80 * u); ctx.lineTo(-10 * u, -50 * u); ctx.moveTo(10 * u, -80 * u); ctx.lineTo(10 * u, -50 * u); ctx.stroke(); ctx.fillStyle = '#2563eb'; ctx.fillRect(-14 * u, -56 * u, 28 * u, 18 * u); ctx.fillStyle = '#facc15'; oval(ctx, 0, -104 * u, 28 * u, 6 * u, 0, '#eab308'); ctx.beginPath(); ctx.arc(0, -105 * u, 14 * u, PI, TAU); ctx.fill(); ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.4 + (on ? Math.sin(k * 6) * 0.2 : 0)); ctx.fillStyle = '#fb923c'; poly(ctx, [-5 * u, -2 * u, 5 * u, -2 * u, 0, 26 * u]); ctx.fill(); leaf(ctx, 0, -2 * u, 10 * u, 4 * u, -PI / 2 - 0.4, '#22c55e', null); leaf(ctx, 0, -2 * u, 10 * u, 4 * u, -PI / 2 + 0.4, '#22c55e', null); ctx.restore(); }
          if (i === 6) { ctx.fillStyle = '#fde047'; ctx.fillRect(-17 * u, -66 * u, 34 * u, 5 * u); ctx.fillRect(-17 * u, -50 * u, 34 * u, 5 * u); ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(0, -99 * u, 17 * u, PI, TAU); ctx.fill(); ctx.fillRect(-22 * u, -100 * u, 44 * u, 5 * u); ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.3 + (on ? Math.sin(k * 9) * 0.5 : 0)); line(ctx, 0, 6 * u, 0, -24 * u, '#92400e', 4 * u); ctx.fillStyle = '#64748b'; rounded(ctx, -9 * u, -30 * u, 18 * u, 8 * u, 2 * u); ctx.fill(); ctx.restore(); }
          if (i === 7) { const dx = hx; const dy = hy + 6 * u; circ(ctx, dx, dy, 13 * u, '#c08457'); oval(ctx, dx - 11 * u, dy - 4 * u, 5 * u, 10 * u, 0.3, '#7c4a25'); oval(ctx, dx + 11 * u, dy - 4 * u, 5 * u, 10 * u, -0.3, '#7c4a25'); dotEyes(ctx, dx, dy - 2 * u, 9 * u, 1.8 * u); oval(ctx, dx, dy + 5 * u, 3 * u, 2.2 * u, 0, PUPIL); if (on > 0.3) oval(ctx, dx + 2 * u, dy + 10 * u, 2.5 * u, 3.5 * u + Math.abs(Math.sin(k * 6)) * 2 * u, 0, '#f472b6'); circ(ctx, -22 * u, -44 * u, 4.5 * u, o.skin); }
        });
        label(ctx, name, x, gy + 30, { size: 22, weight: 800, fill: i === a ? c : 'ink' });
      });
      chip(ctx, a >= 0 ? H[a][1] : 'Who helps us in our community?', cx, Y1 - 32, a >= 0 ? H[a][3] : 'ink', 23);
      ctx.restore();
    },
  };
}
