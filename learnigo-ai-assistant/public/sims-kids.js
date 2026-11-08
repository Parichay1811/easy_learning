// Simulations for young children (about 4 to 10): life cycles (butterfly,
// frog, a seed growing), the Earth and sky (day and night, seasons, weather,
// clouds, rainbows, shadows, twinkling stars, the Moon's phases), animals
// (homes, night animals, bees, dinosaurs, the ocean's zones), the senses,
// sorting and comparing (recycling, opposites, floating and sinking,
// magnets) and the calendar. Bright, round, friendly drawings made with
// canvas paths, gentle bouncy motion, few big words. Each is a function of
// time (t since it appeared, b.clock for the loop), so any moment can be
// drawn: plain canvas calls, almost no glow, no state between frames beyond
// constants cached on the item. KIDS_SIMS says what each one is for, so a
// lesson's words can pick the right picture.

export const KIDS_SIMS = {
  'butterfly-life-cycle': { title: 'Life cycle of a butterfly', keywords: ['life cycle of a butterfly', 'butterfly life cycle', 'chrysalis', 'caterpillar', 'metamorphosis', 'pupa', 'cocoon'], example: {} },
  'frog-life-cycle': { title: 'Life cycle of a frog', keywords: ['life cycle of a frog', 'frog life cycle', 'frogspawn', 'tadpole', 'tadpoles', 'froglet', 'amphibian life cycle'], example: {} },
  'plant-growth': { title: 'How a seed grows', keywords: ['how a seed grows', 'how plants grow', 'seed germination', 'germination', 'what plants need to grow', 'seed to flower', 'growing a plant'], example: { days: 60 } },
  'day-night': { title: 'Day and night', keywords: ['day and night', 'night and day', 'earth spins', 'earth rotates', 'rotation of the earth', 'why is it dark at night', '24 hours in a day'], example: {} },
  seasons: { title: 'Why we have seasons', keywords: ['four seasons', 'why we have seasons', 'seasons change', 'tilt of the earth', "earth's tilt", 'axial tilt', 'summer and winter'], example: {} },
  'kids-weather': { title: 'Types of weather', keywords: ['types of weather', 'kinds of weather', 'weather symbols', 'weather forecast', 'sunny day', 'rainy day', 'snowy day', 'windy day'], example: {} },
  'five-senses': { title: 'The five senses', keywords: ['five senses', '5 senses', 'sense of smell', 'sense of touch', 'sense of taste', 'sense of hearing', 'sense of sight'], example: {} },
  'dinosaur-sizes': { title: 'How big were dinosaurs?', keywords: ['dinosaur', 'dinosaurs', 'tyrannosaurus', 't. rex', 'triceratops', 'brachiosaurus', 'velociraptor', 'how big were dinosaurs'], example: {} },
  'ocean-zones': { title: 'Zones of the ocean', keywords: ['ocean zones', 'layers of the ocean', 'deep sea', 'sunlight zone', 'twilight zone', 'midnight zone', 'anglerfish', 'deep ocean'], example: {} },
  'animal-homes': { title: 'Animal homes', keywords: ['animal homes', 'where animals live', 'animal habitats', 'bird nest', 'rabbit burrow', 'beehive', 'spider web', 'fox den'], example: {} },
  'nocturnal-animals': { title: 'Nocturnal animals', keywords: ['nocturnal animals', 'nocturnal', 'animals at night', 'awake at night', 'night animals', 'owls hunt at night', 'bats at night'], example: {} },
  'bee-honey': { title: 'How bees make honey', keywords: ['how bees make honey', 'honey bees', 'honeybee', 'honeycomb', 'nectar', 'pollination', 'pollinate', 'bees and flowers'], example: {} },
  'leaves-colour': { title: 'Why leaves change colour', keywords: ['leaves change colour', 'leaves change color', 'autumn leaves', 'fall leaves', 'why leaves fall', 'leaves turn red', 'leaves turn yellow', 'carotenoids'], example: {} },
  'star-twinkle': { title: 'Why stars twinkle', keywords: ['why stars twinkle', 'stars twinkle', 'twinkling stars', 'twinkle twinkle', 'atmospheric turbulence', 'planets do not twinkle'], example: {} },
  'clouds-form': { title: 'How clouds form', keywords: ['how clouds form', 'how are clouds made', 'what are clouds made of', 'cloud formation', 'water droplets in clouds', 'where does rain come from', 'warm air rises', 'condenses on dust'], example: {} },
  'recycling-sort': { title: 'Sort the recycling', keywords: ['recycling', 'recycle', 'recycling bins', 'sorting rubbish', 'sorting waste', 'compost bin', 'reduce reuse recycle'], example: {} },
  opposites: { title: 'Opposites', keywords: ['opposites', 'opposite words', 'big and small', 'hot and cold', 'fast and slow', 'full and empty', 'antonyms'], example: {} },
  'calendar-weeks': { title: 'Days, weeks and months', keywords: ['days of the week', 'months of the year', 'how many days in a week', 'how many months in a year', 'reading a calendar', 'weekdays and weekend', 'calendar for kids'], example: {} },
  'floating-sinking': { title: 'Floating and sinking', keywords: ['floating and sinking', 'float or sink', 'sink or float', 'why things float', 'why do things float', 'objects that float', 'buoyancy for kids'], example: {} },
  rainbow: { title: 'How a rainbow forms', keywords: ['rainbow', 'rainbows', 'colours of the rainbow', 'colors of the rainbow', 'how rainbows form', 'roygbiv', 'white light splits'], example: {} },
  shadows: { title: 'Shadows through the day', keywords: ['shadows', 'shadow length', 'how shadows form', 'shadows change during the day', 'long shadow', 'sun moves across the sky', 'sundial'], example: {} },
  'magnets-kids': { title: 'Magnets', keywords: ['magnets', 'magnetic materials', 'magnets attract', 'like poles repel', 'unlike poles attract', 'what do magnets pick up', 'north and south poles of a magnet'], example: {} },
  'moon-phases': { title: 'Phases of the Moon', keywords: ['phases of the moon', 'moon phases', 'lunar phases', 'crescent moon', 'waxing and waning', 'gibbous', 'why the moon changes shape'], example: {} },
};

export function kidsSims(kit) {
  // eslint-disable-next-line no-unused-vars
  const { FIG, COLORS, FONT, glow, label, rounded, arrow, clamp, easeOut, outBack, color, tint } = kit;
  const X0 = FIG.x; const Y0 = FIG.y; const X1 = FIG.x + FIG.w; const Y1 = FIG.y + FIG.h;
  const cx = X0 + FIG.w / 2; const cy = Y0 + FIG.h / 2;
  const TAU = Math.PI * 2; const PI = Math.PI;
  const SKIN = '#f6c9a0'; const PUPIL = '#1a1630'; const HAIR = '#5a3a24'; const DARKTEXT = '#1a1630';

  // Small tools: numbers, timing, loops.
  const val = (v, d) => { const n = Number(v); return v !== null && v !== undefined && v !== '' && Number.isFinite(n) ? n : d; };
  const mod = (a, n) => ((a % n) + n) % n;
  const smooth = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
  const lerp = (a, c, p) => a + (c - a) * p;
  const fade = (ctx, t, d = 0.5) => { const q = easeOut(clamp(t / d)); ctx.globalAlpha *= q; return q; };
  const after = (t, at, d = 0.4) => easeOut(clamp((t - at) / d));
  const cycle = (t, period, delay = 0.6) => (t < delay ? 0 : mod(t - delay, period));
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  // A bouncy pop from 0 to 1 starting at `at`.
  const pop = (t, at, d = 0.5) => (t <= at ? 0 : t >= at + d ? 1 : outBack((t - at) / d));
  // 0 → 1 → 0 across a stage (f in 0..1), easing in and out at the edges.
  const bump = (f, e = 0.12) => smooth(f / e) * smooth((1 - f) / e);
  // Mix two hex colours.
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
  function arr(ctx, x0, y0, x1, y1, c, w = 5) { if (Math.hypot(x1 - x0, y1 - y0) > 4) arrow(ctx, x0, y0, x1, y1, c, w); }
  // An arrowhead at (x, y) pointing along ang.
  function head(ctx, x, y, ang, s, c) {
    ctx.fillStyle = color(c); ctx.beginPath();
    ctx.moveTo(x + Math.cos(ang) * s, y + Math.sin(ang) * s);
    ctx.lineTo(x + Math.cos(ang + 2.4) * s, y + Math.sin(ang + 2.4) * s);
    ctx.lineTo(x + Math.cos(ang - 2.4) * s, y + Math.sin(ang - 2.4) * s);
    ctx.closePath(); ctx.fill();
  }
  // A gently curved arrow from (x0, y0) to (x1, y1), bowed by `bend` px.
  function curveArrow(ctx, x0, y0, x1, y1, bend, c, w = 5) {
    const dx = x1 - x0; const dy = y1 - y0; const L = Math.hypot(dx, dy) || 1;
    const qx = (x0 + x1) / 2 - (dy / L) * bend; const qy = (y0 + y1) / 2 + (dx / L) * bend;
    const ang = Math.atan2(y1 - qy, x1 - qx); const hs = 8 + w * 1.6;
    ctx.strokeStyle = color(c); ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(qx, qy, x1 - Math.cos(ang) * hs * 0.6, y1 - Math.sin(ang) * hs * 0.6); ctx.stroke();
    head(ctx, x1, y1, ang, hs, c);
  }
  // Cute eyes: whites, pupils and a shine; they blink now and then.
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
  function cheeks(ctx, x, y, gap, r) { circ(ctx, x - gap / 2, y, r, 'rgba(255,120,150,0.45)'); circ(ctx, x + gap / 2, y, r, 'rgba(255,120,150,0.45)'); }
  // A smiling Sun with turning rays.
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
  // A raindrop: (x, y) is the centre of its round bottom.
  function drop(ctx, x, y, r, fill) {
    ctx.fillStyle = color(fill); ctx.beginPath(); ctx.moveTo(x, y - r * 2.1);
    ctx.bezierCurveTo(x + r * 0.35, y - r * 1.2, x + r, y - r * 0.6, x + r, y);
    ctx.arc(x, y, r, 0, PI);
    ctx.bezierCurveTo(x - r, y - r * 0.6, x - r * 0.35, y - r * 1.2, x, y - r * 2.1); ctx.fill();
  }
  // A leaf from its base (x, y), pointing along ang.
  function leaf(ctx, x, y, len, wid, ang, fill, vein = 'rgba(255,255,255,0.45)') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = color(fill); ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.45, -wid, len, 0); ctx.quadraticCurveTo(len * 0.45, wid, 0, 0); ctx.fill();
    if (vein) { ctx.strokeStyle = vein; ctx.lineWidth = Math.max(1.5, len * 0.025); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * 0.85, 0); ctx.stroke(); }
    ctx.restore();
  }
  function flower(ctx, x, y, r, petal, n = 6, centre = '#ffd23f', spin = 0) {
    ctx.fillStyle = color(petal);
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU + spin; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.5, r * 0.32, a, 0, TAU); ctx.fill(); }
    circ(ctx, x, y, r * 0.38, centre);
  }
  function starPath(ctx, x, y, r1, r2, n = 5, rot = -PI / 2) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1; const a = rot + (i * PI) / n; const px = x + Math.cos(a) * r; const py = y + Math.sin(a) * r; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.closePath();
  }
  function tick(ctx, x, y, s, c = 'green') {
    ctx.strokeStyle = color(c); ctx.lineWidth = s * 0.22; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - s * 0.45, y); ctx.lineTo(x - s * 0.12, y + s * 0.32); ctx.lineTo(x + s * 0.5, y - s * 0.38); ctx.stroke();
  }
  function cross(ctx, x, y, s, c = 'red') {
    ctx.strokeStyle = color(c); ctx.lineWidth = s * 0.22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - s * 0.35, y - s * 0.35); ctx.lineTo(x + s * 0.35, y + s * 0.35); ctx.moveTo(x + s * 0.35, y - s * 0.35); ctx.lineTo(x - s * 0.35, y + s * 0.35); ctx.stroke();
  }
  function snowflake(ctx, x, y, r, c = '#ffffff', rot = 0) {
    ctx.strokeStyle = color(c); ctx.lineWidth = Math.max(1.5, r * 0.18); ctx.lineCap = 'round'; ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = rot + (i * PI) / 3; const ex = x + Math.cos(a) * r; const ey = y + Math.sin(a) * r;
      ctx.moveTo(x, y); ctx.lineTo(ex, ey);
      const mx = x + Math.cos(a) * r * 0.6; const my = y + Math.sin(a) * r * 0.6;
      ctx.moveTo(mx, my); ctx.lineTo(mx + Math.cos(a + 0.8) * r * 0.3, my + Math.sin(a + 0.8) * r * 0.3);
      ctx.moveTo(mx, my); ctx.lineTo(mx + Math.cos(a - 0.8) * r * 0.3, my + Math.sin(a - 0.8) * r * 0.3);
    }
    ctx.stroke();
  }
  // A child standing, feet at gy, h tall.
  function kid(ctx, x, gy, h, shirt = '#5b8cff', k = 0, wave = false, back = false) {
    const u = h / 100;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3b4a7a'; ctx.lineWidth = 9 * u; ctx.beginPath();
    ctx.moveTo(x - 6 * u, gy - 32 * u); ctx.lineTo(x - 7 * u, gy - 4 * u); ctx.moveTo(x + 6 * u, gy - 32 * u); ctx.lineTo(x + 7 * u, gy - 4 * u); ctx.stroke();
    ctx.strokeStyle = SKIN; ctx.lineWidth = 7 * u; ctx.beginPath();
    ctx.moveTo(x - 13 * u, gy - 58 * u); ctx.lineTo(x - 21 * u, gy - 36 * u);
    const wa = wave ? -2.1 + Math.sin(k * 6) * 0.35 : 1.2;
    ctx.moveTo(x + 13 * u, gy - 58 * u); ctx.lineTo(x + 13 * u + Math.cos(wa) * 24 * u, gy - 58 * u + Math.sin(wa) * 24 * u); ctx.stroke();
    ctx.fillStyle = color(shirt); rounded(ctx, x - 15 * u, gy - 64 * u, 30 * u, 36 * u, 10 * u); ctx.fill();
    circ(ctx, x, gy - 80 * u, 17 * u, SKIN);
    ctx.fillStyle = HAIR; ctx.beginPath();
    if (back) ctx.arc(x, gy - 81 * u, 17.5 * u, PI * 0.95, PI * 2.05);
    else ctx.arc(x, gy - 83 * u, 17 * u, PI * 1.05, PI * 1.95);
    ctx.fill();
    if (!back) { dotEyes(ctx, x, gy - 80 * u, 12 * u, 2.2 * u); smile(ctx, x, gy - 72 * u, 5 * u, PUPIL, 2 * u); }
  }
  // A rounded scene panel with a top-to-bottom gradient.
  function scene(ctx, x, y, w, h, top, bottom, r = 22) {
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, color(top)); g.addColorStop(1, color(bottom));
    ctx.fillStyle = g; rounded(ctx, x, y, w, h, r); ctx.fill();
  }
  function clipRound(ctx, x, y, w, h, r = 22) { rounded(ctx, x, y, w, h, r); ctx.clip(); }
  function hexPath(ctx, x, y, r) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + PI / 6; const px = x + Math.cos(a) * r; const py = y + Math.sin(a) * r; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.closePath(); }
  // A stage marker for a cycle: a soft disc behind the active drawing.
  function halo(ctx, x, y, r, c, a) { circ(ctx, x, y, r, 'rgba(255,255,255,0.035)'); if (a > 0.01) circ(ctx, x, y, r, tint(c, a)); }

  // ─── Shared characters ─────────────────────────────────────────────────
  function butterflyShape(ctx, k, flapSpeed = 5, wingA = '#ff8a3d', wingB = '#a78bfa') {
    const flap = 0.25 + 0.75 * Math.abs(Math.cos(k * flapSpeed));
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.scale(sd * flap, 1);
      oval(ctx, 30, -18, 34, 26, -0.5, wingA); oval(ctx, 24, 20, 22, 18, 0.5, wingB);
      circ(ctx, 38, -24, 7, '#fff3c4'); circ(ctx, 26, 22, 5, '#fff3c4'); circ(ctx, 18, -10, 4, '#fff3c4');
      ctx.restore();
    }
    oval(ctx, 0, 2, 7, 28, 0, '#3b2f5c'); circ(ctx, 0, -28, 9, '#3b2f5c');
    ctx.strokeStyle = '#3b2f5c'; ctx.lineWidth = 2.5; ctx.beginPath();
    ctx.moveTo(-3, -35); ctx.quadraticCurveTo(-10, -50, -16, -52); ctx.moveTo(3, -35); ctx.quadraticCurveTo(10, -50, 16, -52); ctx.stroke();
    circ(ctx, -16, -52, 3, '#3b2f5c'); circ(ctx, 16, -52, 3, '#3b2f5c');
    dotEyes(ctx, 0, -29, 8, 1.8, '#ffffff');
  }
  function frogShape(ctx, k, tail = 0, seed = 0) {
    if (tail > 0) { ctx.fillStyle = '#3d8b40'; ctx.beginPath(); ctx.moveTo(-10, 20); ctx.quadraticCurveTo(-30 - 40 * tail, 34, -40 - 50 * tail, 24 + Math.sin(k * 6) * 6 * tail); ctx.quadraticCurveTo(-30 - 30 * tail, 22, -10, 8); ctx.fill(); }
    oval(ctx, -38, 22, 18, 12, -0.3, '#43a047'); oval(ctx, 38, 22, 18, 12, 0.3, '#43a047');
    oval(ctx, 0, 0, 44, 32, 0, '#4caf50'); oval(ctx, 0, 9, 28, 18, 0, '#c5e1a5');
    circ(ctx, -22, -28, 15, '#4caf50'); circ(ctx, 22, -28, 15, '#4caf50');
    eyes(ctx, 0, -29, 44, 9.5, k, seed);
    smile(ctx, 0, -2, 20, '#1b5e20', 3); cheeks(ctx, 0, -6, 58, 5);
    oval(ctx, -20, 30, 9, 5, 0, '#388e3c'); oval(ctx, 20, 30, 9, 5, 0, '#388e3c');
  }
  function beeShape(ctx, k, pollen = false, wingSpeed = 30) {
    const fl = 0.35 + 0.65 * Math.abs(Math.sin(k * wingSpeed));
    ctx.fillStyle = 'rgba(225,240,255,0.8)';
    ctx.beginPath(); ctx.ellipse(-5, -14, 9, 15 * fl, -0.4, 0, TAU); ctx.ellipse(7, -14, 9, 15 * fl, 0.4, 0, TAU); ctx.fill();
    ctx.save(); oval(ctx, 0, 0, 20, 13, 0, '#ffc93c'); ctx.clip();
    ctx.fillStyle = '#2a2140'; ctx.fillRect(-9, -14, 6, 28); ctx.fillRect(3, -14, 6, 28); ctx.restore();
    circ(ctx, 21, -2, 9, '#2a2140'); circ(ctx, 24, -4, 2.2, '#ffffff');
    head(ctx, -24, 0, PI, 6, '#2a2140');
    if (pollen) { circ(ctx, -4, 14, 5, '#ff9f1c'); circ(ctx, 8, 14, 5, '#ff9f1c'); }
  }
  // The Earth seen from above, with land that turns by `spin` radians.
  function globe(ctx, x, y, r, spin = 0) {
    circ(ctx, x, y, r, '#2f80ed');
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
    ctx.translate(x, y); ctx.rotate(spin);
    ctx.fillStyle = '#3fbf5f';
    for (const [a, d, s] of [[0.3, 0.55, 0.42], [1.9, 0.5, 0.36], [3.4, 0.6, 0.4], [4.6, 0.3, 0.3], [5.6, 0.7, 0.25]]) {
      const px = Math.cos(a) * d * r; const py = Math.sin(a) * d * r;
      ctx.beginPath(); ctx.ellipse(px, py, s * r, s * r * 0.6, a, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(px + s * r * 0.5, py + s * r * 0.3, s * r * 0.5, s * r * 0.4, a + 1, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  return {
    // ─── Life cycles ─────────────────────────────────────────────────────

    // Egg on a leaf → caterpillar munching and growing → chrysalis →
    // butterfly, round a cycle of arrows.
    'butterfly-life-cycle'(b, ctx, it, t) {
      const k = b.clock; const P = 3.2; const u = cycle(t, P * 4, 1); const st = Math.floor(u / P) % 4; const f = (u - st * P) / P;
      const ox = cx; const oy = Y0 + 350;
      const POS = [[ox, oy - 200], [ox + 250, oy], [ox, oy + 200], [ox - 250, oy]];
      const NAME = ['Egg', 'Caterpillar', 'Chrysalis', 'Butterfly'];
      const COL = ['yellow', 'green', 'orange', 'purple'];
      const SAY = ['A tiny egg is laid on a leaf', 'The caterpillar eats and grows', 'It changes inside a chrysalis', 'A butterfly comes out and flies!'];
      const ARROWS = [[ox + 78, oy - 150, ox + 175, oy - 62], [ox + 175, oy + 82, ox + 82, oy + 150], [ox - 82, oy + 150, ox - 175, oy + 82], [ox - 175, oy - 62, ox - 78, oy - 150]];
      const STAGE = [
        () => {
          leaf(ctx, -72, 14, 144, 46, -0.1, '#3fbf5f');
          for (const [ex, ey] of [[-24, 4], [0, -1], [24, 1]]) { const w = Math.sin(k * 7 + ex) * 0.12; oval(ctx, ex, ey - 6, 9, 12, w, '#fff6d8'); circ(ctx, ex - 3, ey - 11, 2.5, '#ffffff'); }
        },
        () => {
          leaf(ctx, -80, 40, 160, 40, 0.02, '#3fbf5f');
          const on = st === 1; const g = on ? lerp(0.7, 1.08, smooth(f / 0.85)) : 1;
          ctx.save(); ctx.scale(g, g);
          for (let j = 0; j < 6; j++) { const x = -52 + j * 18; const y = 14 - Math.abs(Math.sin(k * 5 - j * 0.9)) * (on ? 8 : 3); circ(ctx, x, y, 14, j % 2 ? '#8ee05a' : '#5fc94a'); circ(ctx, x, y + 13, 3, '#2f7d32'); circ(ctx, x - 3, y - 6, 3, '#ffe066'); }
          const hy = 6 - Math.abs(Math.sin(k * 5 - 6 * 0.9)) * (on ? 8 : 3);
          ctx.strokeStyle = '#2f7d32'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(52, hy - 14); ctx.lineTo(46, hy - 32); ctx.moveTo(64, hy - 14); ctx.lineTo(70, hy - 32); ctx.stroke();
          circ(ctx, 46, hy - 32, 3.5, '#ffd23f'); circ(ctx, 70, hy - 32, 3.5, '#ffd23f');
          circ(ctx, 58, hy, 17, '#7bd84f'); eyes(ctx, 58, hy - 4, 15, 5, k, 2);
          const m = on ? 0.3 + 0.7 * Math.abs(Math.sin(k * 9)) : 0.4;
          oval(ctx, 60, hy + 8, 5, 3 * m + 1, 0, '#2f7d32');
          ctx.restore();
        },
        () => {
          line(ctx, -62, -54, 62, -54, '#8d6e4f', 9);
          leaf(ctx, 40, -56, 40, 14, -0.6, '#3fbf5f', null);
          ctx.save(); ctx.translate(0, -52);
          ctx.rotate(Math.sin(k * 1.6) * 0.06 + (st === 2 && f > 0.7 ? Math.sin(k * 24) * 0.06 : 0));
          line(ctx, 0, 0, 0, 10, '#e9e2cf', 2.5);
          ctx.fillStyle = '#9ccc65'; ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(32, 26, 34, 82, 0, 114); ctx.bezierCurveTo(-34, 82, -32, 26, 0, 8); ctx.fill();
          ctx.strokeStyle = 'rgba(60,110,40,0.55)'; ctx.lineWidth = 2.5; ctx.beginPath();
          for (const yy of [40, 60, 80]) { ctx.moveTo(-22, yy); ctx.quadraticCurveTo(0, yy + 8, 22, yy); }
          ctx.stroke();
          for (const [gx, gy] of [[-9, 30], [9, 30], [0, 96]]) circ(ctx, gx, gy, 3, '#ffd23f');
          ctx.restore();
        },
        () => {
          const on = st === 3; const fly = on ? smooth((f - 0.3) / 0.35) * (1 - smooth((f - 0.82) / 0.16)) : 0;
          ctx.save(); ctx.translate(Math.sin(k * 1.3) * 8 + fly * Math.sin(k * 2.4) * 34, Math.cos(k * 1.7) * 6 - fly * 46);
          butterflyShape(ctx, k, on ? 9 : 4);
          ctx.restore();
        },
      ];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Life cycle of a butterfly');
      ARROWS.forEach(([x0, y0, x1, y1], i) => {
        const on = i === st;
        ctx.save(); ctx.globalAlpha *= after(t, 0.5 + i * 0.15) * (on ? 1 : 0.5);
        curveArrow(ctx, x0, y0, x1, y1, -30, on ? COL[(i + 1) % 4] : 'muted', on ? 6 : 4);
        ctx.restore();
      });
      ctx.save(); ctx.globalAlpha *= 0.85;
      label(ctx, 'Round and', ox, oy - 15, { size: 23, weight: 700, fill: 'muted' });
      label(ctx, 'round!', ox, oy + 15, { size: 23, weight: 700, fill: 'muted' });
      ctx.restore();
      POS.forEach(([x, y], i) => {
        const on = i === st; const env = on ? bump(f) : 0;
        halo(ctx, x, y, 80, COL[i], 0.16 * env);
        sc(ctx, x, y, pop(t, 0.15 + i * 0.25) * (0.94 + 0.16 * env), STAGE[i]);
        label(ctx, NAME[i], x, y + 74, { size: on ? 27 : 24, weight: on ? 800 : 700, fill: on ? COL[i] : 'ink' });
      });
      chip(ctx, SAY[st], cx, Y1 - 30, COL[st]);
      ctx.restore();
    },

    // Frogspawn → tadpole → tadpole with legs → froglet → frog.
    'frog-life-cycle'(b, ctx, it, t) {
      const k = b.clock; const P = 3; const u = cycle(t, P * 5, 1); const st = Math.floor(u / P) % 5; const f = (u - st * P) / P;
      const POS = [[cx, Y0 + 150], [X0 + 655, Y0 + 300], [X0 + 560, Y0 + 535], [X0 + 240, Y0 + 535], [X0 + 145, Y0 + 300]];
      const NAME = ['Frogspawn', 'Tadpole', 'Tadpole with legs', 'Froglet', 'Frog'];
      const COL = ['cyan', 'blue', 'purple', 'teal', 'green'];
      const SAY = ['Frogspawn: eggs in jelly', 'A tadpole swims with its tail', 'Back legs grow, then front legs', 'A froglet: its tail shrinks away', 'A grown frog lays new eggs'];
      const tadpole = (legs, arms) => {
        const w = Math.sin(k * 9);
        ctx.fillStyle = '#7d6bb0'; ctx.beginPath(); ctx.moveTo(-6, -8);
        ctx.quadraticCurveTo(-34, -6 + w * 8, -62, w * 14); ctx.quadraticCurveTo(-34, 6 + w * 8, -6, 8); ctx.fill();
        if (legs) { ctx.strokeStyle = '#7d6bb0'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-8, 8); ctx.lineTo(-20, 22); ctx.lineTo(-30, 20); ctx.moveTo(-8, -8); ctx.lineTo(-20, -22); ctx.lineTo(-30, -20); ctx.stroke(); }
        if (arms) { ctx.beginPath(); ctx.moveTo(14, 12); ctx.lineTo(20, 24); ctx.moveTo(14, -12); ctx.lineTo(20, -24); ctx.stroke(); }
        oval(ctx, 10, 0, 22, 17, 0, '#8f7cc4'); eyes(ctx, 20, -2, 14, 4.5, k, 3 + legs);
        smile(ctx, 26, 6, 5, '#ffffff', 2);
      };
      const STAGE = [
        () => {
          for (let j = 0; j < 11; j++) {
            const a = j * 2.4; const d = j === 0 ? 0 : 16 + (j % 3) * 9; const x = Math.cos(a) * d * 1.4 + Math.sin(k * 2 + j) * 1.5; const y = Math.sin(a) * d * 0.8;
            circ(ctx, x, y, 13, 'rgba(200,235,255,0.35)', 'rgba(220,245,255,0.7)', 2); circ(ctx, x + 1, y + 1, 4.5, '#1f1a33'); circ(ctx, x - 5, y - 5, 2.5, 'rgba(255,255,255,0.8)');
          }
        },
        () => { ctx.save(); ctx.translate(Math.sin(k * 1.5) * 10, Math.sin(k * 2.2) * 5); tadpole(false, false); ctx.restore(); },
        () => { ctx.save(); ctx.translate(Math.sin(k * 1.4) * 10, Math.sin(k * 2) * 5); tadpole(true, f > 0.45 || st !== 2); ctx.restore(); },
        () => { ctx.save(); ctx.scale(0.62, 0.62); frogShape(ctx, k, st === 3 ? lerp(0.9, 0.35, smooth(f)) : 0.6, 7); ctx.restore(); },
        () => { const hop = st === 4 ? Math.max(0, Math.sin(k * 4)) * 18 : 0; ctx.save(); ctx.translate(0, -hop); frogShape(ctx, k, 0, 11); ctx.restore(); },
      ];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Life cycle of a frog');
      // The pond in the middle.
      ctx.save(); ctx.globalAlpha *= after(t, 0.2, 0.6);
      oval(ctx, cx, Y0 + 385, 125, 58, 0, tint('blue', 0.35));
      for (let j = 0; j < 2; j++) { const q = mod(k * 0.35 + j / 2, 1); oval(ctx, cx - 30, Y0 + 385, 20 + 70 * q, 8 + 26 * q, 0, null, `rgba(200,230,255,${0.5 * (1 - q)})`, 2); }
      ctx.fillStyle = '#3fbf5f'; ctx.beginPath(); ctx.ellipse(cx + 55, Y0 + 395, 30, 13, 0, 0.4, TAU - 0.1); ctx.lineTo(cx + 55, Y0 + 395); ctx.fill();
      flower(ctx, cx + 62, Y0 + 388, 9, '#ff8fb8', 6);
      label(ctx, 'Pond', cx - 30, Y0 + 386, { size: 22, weight: 700, fill: '#cfe6ff' });
      ctx.restore();
      const ARROWS = [[cx + 95, Y0 + 185, cx + 180, Y0 + 245], [X0 + 625, Y0 + 385, X0 + 595, Y0 + 465], [X0 + 465, Y0 + 535, X0 + 335, Y0 + 535], [X0 + 205, Y0 + 465, X0 + 175, Y0 + 385], [X0 + 220, Y0 + 245, cx - 95, Y0 + 185]];
      ARROWS.forEach(([x0, y0, x1, y1], i) => {
        const on = i === st;
        ctx.save(); ctx.globalAlpha *= after(t, 0.5 + i * 0.15) * (on ? 1 : 0.5);
        curveArrow(ctx, x0, y0, x1, y1, -18, on ? COL[(i + 1) % 5] : 'muted', on ? 6 : 4);
        ctx.restore();
      });
      POS.forEach(([x, y], i) => {
        const on = i === st; const env = on ? bump(f) : 0;
        halo(ctx, x, y, 66, COL[i], 0.16 * env);
        sc(ctx, x, y, pop(t, 0.15 + i * 0.22) * (0.94 + 0.16 * env), STAGE[i]);
        label(ctx, NAME[i], x, y + 64, { size: on ? 26 : 23, weight: on ? 800 : 700, fill: on ? COL[i] : 'ink' });
      });
      chip(ctx, SAY[st], cx, Y1 - 30, COL[st]);
      ctx.restore();
    },

    // A seed in the soil with water and sunlight: roots, a shoot, leaves,
    // then a flower, with a day counter.
    'plant-growth'(b, ctx, it, t) {
      const k = b.clock; const T = 15; const g = clamp(cycle(t, T, 0.6) / (T - 2.5));
      const days = Math.max(1, Math.round(g * val(it.days, 60)));
      const root = smooth((g - 0.06) / 0.4); const shoot = smooth((g - 0.2) / 0.42); const lv = smooth((g - 0.42) / 0.33); const fl = clamp((g - 0.78) / 0.2);
      const st = g < 0.12 ? 0 : g < 0.26 ? 1 : g < 0.45 ? 2 : g < 0.78 ? 3 : 4;
      const STAGE = [['Seed', 'yellow'], ['Roots grow down', 'orange'], ['A shoot grows up', 'teal'], ['Leaves open', 'green'], ['A flower!', 'red']];
      const gy = Y0 + 430; const sx = cx; const sy = gy + 52;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'How a seed grows');
      // Soil.
      ctx.fillStyle = '#6b4a2e'; rounded(ctx, X0 + 10, gy, FIG.w - 20, Y1 - gy - 8, 22); ctx.fill();
      ctx.fillStyle = '#7d5836'; for (let j = 0; j < 26; j++) { ctx.beginPath(); ctx.ellipse(X0 + 30 + rnd(j) * (FIG.w - 60), gy + 20 + rnd(j + 50) * (Y1 - gy - 50), 6 + 5 * rnd(j + 9), 4, 0, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#4caf50'; ctx.fillRect(X0 + 22, gy - 4, FIG.w - 44, 8);
      label(ctx, 'Soil', X0 + 40, gy + 40, { size: 24, weight: 700, fill: '#f3d9b1', align: 'left' });
      // Sunlight and rain.
      sun(ctx, X0 + 95, Y0 + 115, 42, k);
      label(ctx, 'Sunlight', X0 + 95, Y0 + 205, { size: 23, weight: 800, fill: 'yellow' });
      if (lv > 0.05) {
        ctx.save(); ctx.globalAlpha *= lv * 0.7;
        for (let j = 0; j < 3; j++) { const q = mod(k * 0.6 + j / 3, 1); ctx.strokeStyle = `rgba(255,214,90,${1 - q})`; ctx.lineWidth = 4; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(X0 + 150, Y0 + 150 + j * 25); ctx.lineTo(lerp(X0 + 150, sx - 70, 1), lerp(Y0 + 150 + j * 25, gy - 200 + j * 30, 1)); ctx.stroke(); }
        ctx.setLineDash([]); ctx.restore();
      }
      cloud(ctx, X1 - 115, Y0 + 105, 1.05, '#dfe6ff');
      for (let j = 0; j < 9; j++) { const x = X1 - 165 + rnd(j + 3) * 100; const top = Y0 + 140; const y = top + mod(rnd(j) * 300 + k * 230, gy - top - 10); drop(ctx, x, y, 5, '#5ab0ff'); }
      label(ctx, 'Water', X1 - 200, Y0 + 100, { size: 23, weight: 800, fill: '#7cc4ff', align: 'right' });
      // Roots.
      if (root > 0) {
        ctx.strokeStyle = '#f3e3c3'; ctx.lineCap = 'round';
        ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(sx, sy + 8);
        for (let j = 1; j <= 10; j++) { const q = (j / 10) * root; ctx.lineTo(sx + Math.sin(j * 1.3) * 8, sy + 8 + q * 140); }
        ctx.stroke();
        ctx.lineWidth = 3; ctx.beginPath();
        for (const [d, sd, L] of [[0.3, -1, 60], [0.4, 1, 70], [0.6, -1, 50], [0.7, 1, 55], [0.85, -1, 30]]) {
          const q = clamp((root - d * 0.8) / 0.4); if (q <= 0) continue;
          const y0 = sy + 8 + d * 140 * root; ctx.moveTo(sx, y0); ctx.quadraticCurveTo(sx + sd * L * 0.5 * q, y0 + 6, sx + sd * L * q, y0 + 26 * q);
        }
        ctx.stroke();
      }
      // The seed.
      const swell = 1 + 0.18 * smooth(g / 0.1);
      oval(ctx, sx, sy, 22 * swell, 15 * swell, 0.25, '#c8913c');
      line(ctx, sx - 12, sy - 4, sx + 12, sy + 4, '#8a5a22', 2.5);
      // Stem, leaves and flower.
      const H = 290 * shoot; const sw = Math.sin(k * 1.2) * 8 * shoot;
      const topX = sx + sw; const topY = gy - H;
      if (shoot > 0) {
        ctx.strokeStyle = '#4caf50'; ctx.lineWidth = 9; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(sx, sy - 10); ctx.quadraticCurveTo(sx - sw, gy - H * 0.5, topX, topY); ctx.stroke();
        const sp = (q) => [lerp(lerp(sx, sx - sw, q), lerp(sx - sw, topX, q), q), lerp(lerp(sy - 10, gy - H * 0.5, q), lerp(gy - H * 0.5, topY, q), q)];
        const s1 = clamp((shoot - 0.15) / 0.3) * (1 - 0.3 * lv);
        if (s1 > 0) { const [x, y] = sp(0.55); leaf(ctx, x, y, 34 * s1, 14 * s1, -2.6, '#8ee05a', null); leaf(ctx, x, y, 34 * s1, 14 * s1, -0.5, '#8ee05a', null); }
        for (const [q, sd, d] of [[0.62, -1, 0], [0.72, 1, 0.2], [0.84, -1, 0.4], [0.9, 1, 0.55]]) {
          const s = outBack(clamp((lv - d) / 0.45)); if (s <= 0.01) continue;
          const [x, y] = sp(q); leaf(ctx, x, y, 78 * s, 30 * s, sd < 0 ? PI + 0.5 + Math.sin(k * 1.5 + q) * 0.06 : -0.5 + Math.sin(k * 1.5 + q) * 0.06, '#3fbf5f');
        }
        if (fl > 0) { const s = outBack(fl); flower(ctx, topX, topY - 4, 46 * s, '#ff6b9a', 7, '#ffd23f', k * 0.2); dotEyes(ctx, topX, topY - 6, 12 * s, 2.2 * s); smile(ctx, topX, topY + 2, 6 * s, PUPIL, 2); }
        else { const s = clamp((g - 0.6) / 0.18); if (s > 0) oval(ctx, topX, topY - 8 * s, 10 * s, 15 * s, 0, '#e85d8a'); }
      }
      chip(ctx, `Day ${days}`, X0 + 100, Y0 + 375, 'cyan', 26);
      chip(ctx, STAGE[st][0], X1 - 140, gy + 50, STAGE[st][1], 24);
      chip(ctx, 'Water and sunlight help it grow', cx, Y1 - 34, 'green', 22);
      ctx.restore();
    },

    // ─── Earth and sky ───────────────────────────────────────────────────

    // The Earth (seen from above the North Pole) spinning in sunlight; a
    // home goes round into night and back; one spin is 24 hours.
    'day-night'(b, ctx, it, t) {
      const k = b.clock; const T = val(it.period, 14); const u = mod(t / T - 1 / 6, 1);
      const spin = -TAU * u; const a = PI + spin; // screen angle of the home
      const hour = mod(12 + 24 * u, 24); const hh = Math.floor(hour);
      const tstr = hh === 12 ? '12 noon' : hh === 0 ? '12 midnight' : `${hh % 12} ${hh < 12 ? 'am' : 'pm'}`;
      const day = Math.cos(a) < 0; const sunUp = -Math.cos(a);
      const ex = cx + 115; const ey = Y0 + 395; const R = 148;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Day and night');
      // Sun and its light.
      sun(ctx, X0 + 100, ey - 10, 52, k);
      for (let j = -1; j <= 1; j++) { const y = ey + j * 95; ctx.save(); ctx.globalAlpha *= 0.8; ctx.setLineDash([14, 12]); ctx.lineDashOffset = -k * 40; line(ctx, X0 + 185, y, ex - R - 30, y, '#ffd23f', 4); ctx.setLineDash([]); head(ctx, ex - R - 22, y, 0, 13, '#ffd23f'); ctx.restore(); }
      // Earth with its night half.
      globe(ctx, ex, ey, R, spin);
      ctx.save(); ctx.beginPath(); ctx.arc(ex, ey, R + 1, 0, TAU); ctx.clip();
      const gr = ctx.createLinearGradient(ex - 18, 0, ex + 30, 0); gr.addColorStop(0, 'rgba(6,8,30,0)'); gr.addColorStop(1, 'rgba(6,8,30,0.66)');
      ctx.fillStyle = gr; ctx.fillRect(ex - 18, ey - R - 2, R + 22, 2 * R + 4); ctx.restore();
      circ(ctx, ex, ey, R, null, 'rgba(200,225,255,0.5)', 2);
      // The home on the surface.
      const hx = ex + Math.cos(a) * R; const hy = ey + Math.sin(a) * R;
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(a + PI / 2);
      ctx.fillStyle = '#ffe2b8'; ctx.fillRect(-18, -30, 36, 30);
      ctx.fillStyle = '#e8524a'; poly(ctx, [-24, -28, 0, -50, 24, -28]); ctx.fill();
      ctx.fillStyle = day ? '#9fd8ff' : '#ffd23f'; ctx.fillRect(-12, -22, 10, 10);
      ctx.fillStyle = '#8a5a22'; ctx.fillRect(4, -18, 9, 18);
      ctx.restore();
      if (!day) circ(ctx, hx, hy, 8, 'rgba(255,215,90,0.25)');
      label(ctx, 'Day side', ex - 100, ey - R - 62, { size: 24, weight: 800, fill: 'yellow' });
      label(ctx, 'Night side', ex + 100, ey - R - 62, { size: 24, weight: 800, fill: '#9fb4ff' });
      // Spin arrow.
      ctx.strokeStyle = color('cyan'); ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(ex, ey, R + 32, 1.35, 0.45, true); ctx.stroke();
      head(ctx, ex + Math.cos(0.4) * (R + 32), ey + Math.sin(0.4) * (R + 32), 0.4 - PI / 2, 14, 'cyan');
      label(ctx, 'Spins', ex + R + 20, ey + R + 34, { size: 23, weight: 800, fill: 'cyan', align: 'left' });
      // What the sky looks like at home.
      const ix = X0 + 20; const iy = Y0 + 500; const iw = 210; const ih = 120;
      const skyA = sunUp > 0.12 ? '#5ec8ff' : sunUp > -0.12 ? '#ff9e6b' : '#0d1640'; const skyB = sunUp > 0.12 ? '#bdeeff' : sunUp > -0.12 ? '#ffd38a' : '#26306a';
      ctx.save(); scene(ctx, ix, iy, iw, ih, skyA, skyB, 18); clipRound(ctx, ix, iy, iw, ih, 18);
      if (sunUp > -0.12) sun(ctx, ix + 105, iy + ih - 20 - 70 * Math.max(0, sunUp), 20, k);
      else { circ(ctx, ix + 150, iy + 40, 18, '#f4f1de'); circ(ctx, ix + 158, iy + 34, 16, '#26306a'); for (let j = 0; j < 9; j++) { starPath(ctx, ix + 15 + rnd(j) * 120, iy + 12 + rnd(j + 7) * 60, 5, 2); ctx.fillStyle = `rgba(255,246,200,${0.5 + 0.5 * Math.sin(k * 3 + j)})`; ctx.fill(); } }
      ctx.fillStyle = '#2e7d4f'; ctx.fillRect(ix, iy + ih - 22, iw, 22);
      ctx.restore();
      const homeSay = sunUp > 0.12 ? ['Daytime at home', 'yellow'] : sunUp < -0.12 ? ['Night-time at home', '#9fb4ff'] : hour < 12 ? ['Sunrise at home', 'orange'] : ['Sunset at home', 'orange'];
      chip(ctx, homeSay[0], ix + iw / 2, iy + ih + 32, homeSay[1], 22);
      chip(ctx, tstr, X0 + 105, Y0 + 80, 'ink', 26);
      chip(ctx, 'One spin = 24 hours', X1 - 150, Y0 + 80, 'cyan', 23);
      ctx.restore();
    },

    // The tilted Earth going round the Sun: when the northern half leans
    // towards the Sun it is summer there; a tree shows the season.
    seasons(b, ctx, it, t) {
      const k = b.clock; const T = val(it.period, 16); const u = mod(t / T, 1);
      const phi = -PI / 2 - TAU * u; const ox = cx; const oy = Y0 + 400; const rx = 228; const ry = 110;
      const ex = ox + rx * Math.cos(phi); const ey = oy + ry * Math.sin(phi); const R = 46;
      const si = Math.round(u * 4) % 4;
      const SEAS = [['Spring', 'green'], ['Summer', 'yellow'], ['Autumn', 'orange'], ['Winter', '#9fd0ff']];
      const SAY = ['Spring: neither half leans to the Sun', 'North leans towards the Sun: summer', 'Autumn: neither half leans to the Sun', 'North leans away from the Sun: winter'];
      const TILT = 23.5 * PI / 180;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Why we have seasons');
      const drawEarth = () => {
        sc(ctx, ex, ey, pop(t, 0.3), () => {
          globe(ctx, 0, 0, R, k * 0.8);
          const sa = Math.atan2(oy - ey, ox - ex);
          ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R + 0.5, 0, TAU); ctx.clip(); ctx.rotate(sa);
          ctx.fillStyle = 'rgba(6,8,30,0.6)'; ctx.fillRect(-R - 2, -R - 2, R + 2, 2 * R + 4); ctx.restore();
          ctx.save(); ctx.rotate(TILT);
          ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -R - 18); ctx.lineTo(0, R + 18); ctx.stroke();
          ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,240,180,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-R, 0); ctx.lineTo(R, 0); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, -R + 5, 14, 6, 0, 0, TAU); ctx.fill();
          line(ctx, 0, -R - 18, 0, -R - 36, '#ffffff', 2.5); ctx.fillStyle = '#fb7185'; poly(ctx, [0, -R - 36, 16, -R - 31, 0, -R - 25]); ctx.fill();
          ctx.restore();
        });
      };
      ctx.save(); ctx.setLineDash([8, 10]); ctx.strokeStyle = 'rgba(200,215,255,0.4)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(ox, oy, rx, ry, 0, 0, TAU); ctx.stroke(); ctx.restore();
      if (Math.sin(phi) < 0) drawEarth();
      sun(ctx, ox, oy, 52, k);
      if (Math.sin(phi) >= 0) drawEarth();
      // Season names at the four places on the orbit.
      const LAB = [[ox, oy - ry - 108, 'center'], [ox - rx - 56, oy, 'right'], [ox, oy + ry + 82, 'center'], [ox + rx + 56, oy, 'left']];
      LAB.forEach(([x, y, al], i) => { const on = i === si; label(ctx, SEAS[i][0], x, y, { size: on ? 26 : 23, weight: on ? 800 : 700, fill: on ? SEAS[i][1] : 'muted', align: al }); });
      // A tree in the north showing the season.
      const tx = X0 + 72; const ty = Y1 - 70;
      ctx.save(); ctx.translate(tx, ty); ctx.scale(1.15, 1.15); ctx.translate(-tx, -ty);
      line(ctx, tx - 50, ty, tx + 50, ty, si === 3 ? '#e8f0ff' : '#3fbf5f', 6);
      line(ctx, tx, ty, tx, ty - 60, '#8d6e4f', 10);
      if (si === 3) {
        ctx.strokeStyle = '#8d6e4f'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(tx, ty - 45); ctx.lineTo(tx - 28, ty - 88); ctx.moveTo(tx, ty - 55); ctx.lineTo(tx + 26, ty - 92); ctx.moveTo(tx, ty - 60); ctx.lineTo(tx, ty - 100); ctx.stroke();
        for (let j = 0; j < 6; j++) snowflake(ctx, tx - 50 + rnd(j) * 100, ty - 120 + mod(rnd(j + 4) * 110 + k * 30, 110), 5, '#ffffff', k);
      } else {
        const CAN = ['#5fd068', '#2e9e48', '#ff9f43'][si];
        for (const [dx, dy, r] of [[0, -100, 34], [-26, -80, 26], [26, -80, 26]]) circ(ctx, tx + dx, ty + dy, r, CAN);
        if (si === 0) for (let j = 0; j < 7; j++) circ(ctx, tx - 36 + rnd(j) * 72, ty - 122 + rnd(j + 3) * 60, 5, '#ffb3d1');
        if (si === 2) for (let j = 0; j < 4; j++) { const q = mod(k * 0.4 + j / 4, 1); leaf(ctx, tx - 30 + j * 20 + Math.sin(q * 6) * 10, ty - 70 + q * 66, 14, 6, q * 6, j % 2 ? '#e8524a' : '#ffb627', null); }
      }
      ctx.restore();
      label(ctx, 'In the north', tx, ty + 28, { size: 22, weight: 700, fill: 'muted' });
      // The key idea.
      ctx.fillStyle = 'rgba(5,8,22,0.6)'; ctx.strokeStyle = tint('purple', 0.6); ctx.lineWidth = 2; rounded(ctx, X1 - 262, Y0 + 52, 250, 82, 16); ctx.fill(); ctx.stroke();
      label(ctx, 'The tilt makes seasons,', X1 - 137, Y0 + 78, { size: 22, weight: 700, fill: 'purple' });
      label(ctx, 'not the distance!', X1 - 137, Y0 + 108, { size: 22, weight: 700, fill: 'purple' });
      chip(ctx, SAY[si], cx + 50, Y1 - 28, SEAS[si][1], 22);
      ctx.restore();
    },

    // Sunny, cloudy, rainy, snowy, windy and stormy scenes in turn, with
    // the weather symbol and word.
    'kids-weather'(b, ctx, it, t) {
      const k = b.clock; const P = 3.4; const NAME = ['Sunny', 'Cloudy', 'Rainy', 'Snowy', 'Windy', 'Stormy'];
      const pick = NAME.findIndex((n) => String(it.kind || it.value || '').toLowerCase().startsWith(n.toLowerCase().slice(0, 4)));
      const u = cycle(t, P * 6, 0.5); const i0 = pick >= 0 ? pick : Math.floor(u / P) % 6; const f = pick >= 0 ? 0.5 : (u - i0 * P) / P;
      const COL = ['yellow', '#c7d3e3', 'blue', '#e3ecf8', 'teal', 'purple'];
      const SAY = ['The Sun is shining', 'Clouds cover the sky', 'Rain falls from grey clouds', 'Snow falls when it is very cold', 'The wind pushes the trees', 'Thunder and lightning!'];
      const SKY = [['#4fb8f5', '#bdeeff'], ['#8aa3c2', '#d1dbe8'], ['#56708e', '#94a8c0'], ['#9fb5d6', '#e8eef8'], ['#5ab4e2', '#c9ecff'], ['#1e2440', '#4b5578']];
      const px = X0 + 40; const py = Y0 + 52; const pw = FIG.w - 80; const ph = 340; const gy = py + ph - 62;
      const icon = (j, x, y, s) => {
        sc(ctx, x, y, s, () => {
          if (j === 0) sun(ctx, 0, 0, 22, k, false);
          else if (j === 1) { circ(ctx, 14, -12, 14, '#ffd23f'); cloud(ctx, -4, 6, 0.55, '#e6ecf5'); }
          else if (j === 2) { cloud(ctx, 0, -6, 0.55, '#c5cfdc'); for (let q = 0; q < 3; q++) drop(ctx, -16 + q * 16, 28, 4, '#5ab0ff'); }
          else if (j === 3) snowflake(ctx, 0, 0, 24, '#ffffff', k * 0.5);
          else if (j === 4) { ctx.strokeStyle = '#bdf3ea'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-28, -10); ctx.lineTo(12, -10); ctx.arc(12, -18, 8, PI / 2, -PI * 0.9, true); ctx.moveTo(-28, 4); ctx.lineTo(22, 4); ctx.moveTo(-20, 18); ctx.lineTo(8, 18); ctx.arc(8, 26, 8, -PI / 2, PI * 0.9); ctx.stroke(); }
          else { cloud(ctx, 0, -8, 0.55, '#7b829b'); ctx.fillStyle = '#ffd23f'; poly(ctx, [2, 4, -10, 22, -1, 22, -8, 38, 12, 16, 3, 16, 10, 4]); ctx.fill(); }
        });
      };
      const draw = (i, alpha) => {
        ctx.save(); ctx.globalAlpha *= alpha;
        scene(ctx, px, py, pw, ph, SKY[i][0], SKY[i][1]); clipRound(ctx, px, py, pw, ph);
        if (i === 5 && mod(k, 2.6) < 0.12) { ctx.fillStyle = 'rgba(255,255,230,0.45)'; ctx.fillRect(px, py, pw, ph); }
        const snowy = i === 3;
        ctx.fillStyle = snowy ? '#f4f8ff' : i === 5 ? '#2f5d3e' : '#4caf50';
        ctx.beginPath(); ctx.moveTo(px, gy + 20); ctx.quadraticCurveTo(px + pw * 0.3, gy - 30, px + pw * 0.6, gy + 6); ctx.quadraticCurveTo(px + pw * 0.85, gy + 30, px + pw, gy - 4); ctx.lineTo(px + pw, py + ph); ctx.lineTo(px, py + ph); ctx.closePath(); ctx.fill();
        // A house and a tree on the hill.
        const hx = px + 150; const hy = gy + 2;
        ctx.fillStyle = '#ffe2b8'; ctx.fillRect(hx - 40, hy - 55, 80, 55); ctx.fillStyle = snowy ? '#ffffff' : '#e8524a'; poly(ctx, [hx - 52, hy - 52, hx, hy - 92, hx + 52, hy - 52]); ctx.fill();
        ctx.fillStyle = i === 5 ? '#ffd23f' : '#9fd8ff'; ctx.fillRect(hx - 28, hy - 42, 18, 16); ctx.fillStyle = '#8a5a22'; ctx.fillRect(hx + 8, hy - 34, 16, 34);
        const tX = px + pw - 150; const bend = i === 4 ? 0.18 + 0.1 * Math.sin(k * 3) : i === 5 ? 0.08 * Math.sin(k * 4) : 0.02 * Math.sin(k);
        ctx.save(); ctx.translate(tX, gy + 4); ctx.rotate(bend);
        ctx.fillStyle = '#8d6e4f'; ctx.fillRect(-9, -90, 18, 92);
        for (const [dx, dy, r] of [[0, -125, 44], [-32, -100, 32], [32, -100, 32]]) circ(ctx, dx, dy, r, snowy ? '#e8f0ff' : '#2e9e48');
        ctx.restore();
        if (i === 0) { sun(ctx, px + pw - 330, py + 95, 52, k); cloud(ctx, px + 120 + mod(k * 15, pw), py + 60, 0.6, '#ffffff'); }
        if (i === 1) { circ(ctx, px + pw / 2 + 20, py + 80, 40, '#ffd23f'); for (let j = 0; j < 4; j++) cloud(ctx, px + mod(j * 210 + k * 18, pw + 200) - 80, py + 70 + (j % 2) * 55, 1 + 0.2 * (j % 2), j % 2 ? '#e6ecf5' : '#cfd8e6'); }
        if (i === 2 || i === 5) {
          for (let j = 0; j < 3; j++) cloud(ctx, px + 140 + j * 220, py + 55 + (j % 2) * 20, 1.25, i === 5 ? '#4b5068' : '#b9c3d2');
          for (let j = 0; j < (i === 5 ? 36 : 26); j++) { const x = px + rnd(j) * pw; const y = py + 90 + mod(rnd(j + 40) * 300 + k * (i === 5 ? 420 : 300), ph - 90); drop(ctx, x - (i === 5 ? (y - py) * 0.15 : 0), y, 4.5, '#7cc4ff'); }
          if (i === 2) for (let j = 0; j < 2; j++) { const q = mod(k * 0.8 + j / 2, 1); oval(ctx, px + 330 + j * 120, gy + 30, 10 + 30 * q, 4 + 9 * q, 0, null, `rgba(200,230,255,${1 - q})`, 2); }
          if (i === 5 && mod(k, 2.6) < 0.35) { ctx.fillStyle = '#fff36b'; const lx = px + 420; poly(ctx, [lx, py + 75, lx - 40, py + 160, lx - 8, py + 160, lx - 34, py + 250, lx + 34, py + 135, lx + 2, py + 135, lx + 28, py + 75]); ctx.fill(); }
        }
        if (i === 3) {
          for (let j = 0; j < 30; j++) { const x = px + mod(rnd(j) * pw + Math.sin(k + j) * 20, pw); const y = py + mod(rnd(j + 30) * ph + k * 40, ph); snowflake(ctx, x, y, 4 + 4 * rnd(j + 2), '#ffffff', k + j); }
          const sx = px + 360; circ(ctx, sx, gy + 8, 34, '#ffffff'); circ(ctx, sx, gy - 42, 25, '#ffffff'); dotEyes(ctx, sx, gy - 48, 14, 3); head(ctx, sx + 14, gy - 40, 0, 10, '#ff9f43');
          ctx.fillStyle = '#e8524a'; ctx.fillRect(sx - 24, gy - 24, 48, 9);
        }
        if (i === 4) {
          ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
          for (let j = 0; j < 4; j++) { const x = px + mod(j * 190 + k * 260, pw + 200) - 150; const y = py + 70 + j * 45; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 90, y); ctx.arc(x + 90, y - 12, 12, PI / 2, -PI * 0.8, true); ctx.stroke(); }
          for (let j = 0; j < 7; j++) { const q = mod(k * 0.5 + rnd(j), 1); leaf(ctx, px + pw - 200 - q * 500, py + 120 + rnd(j + 9) * 140 + Math.sin(q * 12) * 20, 22, 9, q * 10, j % 2 ? '#8ee05a' : '#ffb627', null); }
          const kx = px + 400 + Math.sin(k * 1.3) * 20; const ky = py + 90 + Math.sin(k * 1.7) * 12;
          ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(kx, ky + 40); ctx.quadraticCurveTo(kx - 60, gy - 20, px + 250, gy - 20); ctx.stroke();
          ctx.fillStyle = '#fb7185'; poly(ctx, [kx, ky - 40, kx + 28, ky, kx, ky + 40, kx - 28, ky]); ctx.fill(); ctx.fillStyle = '#ffd23f'; poly(ctx, [kx, ky - 40, kx + 28, ky, kx, ky]); ctx.fill();
        }
        ctx.restore();
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Types of weather');
      draw(i0, 1);
      if (f > 0.86 && pick < 0) draw((i0 + 1) % 6, smooth((f - 0.86) / 0.14));
      // Big word with its symbol.
      const s = 0.9 + 0.1 * outBack(clamp(f / 0.2));
      icon(i0, cx - 125, py + ph + 50, 0.95);
      label(ctx, NAME[i0], cx + 25, py + ph + 52, { size: 40 * s, weight: 800, fill: COL[i0] });
      // The forecast strip.
      for (let j = 0; j < 6; j++) {
        const x = cx + (j - 2.5) * 122; const y = py + ph + 135; const on = j === i0;
        ctx.fillStyle = on ? tint('cyan', 0.18) : 'rgba(255,255,255,0.04)'; ctx.strokeStyle = on ? color('cyan') : 'rgba(140,170,255,0.25)'; ctx.lineWidth = on ? 3 : 1.5;
        rounded(ctx, x - 54, y - 42, 108, 116, 16); ctx.fill(); ctx.stroke();
        icon(j, x, y, on ? 0.9 : 0.78);
        label(ctx, NAME[j], x, y + 52, { size: 22, weight: on ? 800 : 600, fill: on ? 'ink' : 'muted' });
      }
      chip(ctx, SAY[i0], cx, Y1 - 24, COL[i0], 22);
      ctx.restore();
    },

    // ─── Me and other animals ────────────────────────────────────────────

    // A child's face: eyes, ears, nose, tongue and skin light up in turn,
    // each with something to see, hear, smell, taste or touch.
    'five-senses'(b, ctx, it, t) {
      const k = b.clock; const P = 2.8; const u = cycle(t, P * 5, 0.8); const si = Math.floor(u / P) % 5; const f = (u - si * P) / P;
      const S = [['See', 'blue', 'Eyes see a rainbow'], ['Hear', 'purple', 'Ears hear a bell ring'], ['Smell', 'orange', 'The nose smells a flower'], ['Taste', 'red', 'The tongue tastes ice cream'], ['Touch', 'teal', 'Skin feels a soft teddy']];
      const fx = cx; const fy = Y0 + 265; const R = 112;
      const env = bump(f, 0.1); const ps = outBack(clamp(f / 0.22)) * (1 - smooth((f - 0.9) / 0.1));
      const C = color(S[si][1]);
      const icon = (j, x, y, s) => sc(ctx, x, y, s, () => {
        if (j === 0) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.quadraticCurveTo(0, -24, 26, 0); ctx.quadraticCurveTo(0, 24, -26, 0); ctx.fill(); circ(ctx, 0, 0, 10, '#4f8cff'); circ(ctx, 0, 0, 5, PUPIL); circ(ctx, -3, -3, 2, '#ffffff'); }
        else if (j === 1) { ctx.strokeStyle = SKIN; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(2, -4, 15, PI * 1.05, PI * 2.6); ctx.stroke(); circ(ctx, 4, -2, 5, '#e8a87c'); }
        else if (j === 2) { ctx.fillStyle = SKIN; ctx.beginPath(); ctx.moveTo(0, -24); ctx.quadraticCurveTo(8, 2, 18, 12); ctx.quadraticCurveTo(0, 22, -18, 12); ctx.quadraticCurveTo(-8, 2, 0, -24); ctx.fill(); circ(ctx, -7, 12, 3.5, '#b07a5a'); circ(ctx, 7, 12, 3.5, '#b07a5a'); }
        else if (j === 3) { oval(ctx, 0, 0, 26, 17, 0, '#c2185b'); oval(ctx, 0, 7, 13, 11, 0, '#ff8fab'); line(ctx, 0, 1, 0, 10, '#e05a80', 2); }
        else { ctx.strokeStyle = SKIN; ctx.lineCap = 'round'; ctx.lineWidth = 8; ctx.beginPath(); for (let q = 0; q < 4; q++) { ctx.moveTo(-10 + q * 7, -6); ctx.lineTo(-13 + q * 8.5, -28 + Math.abs(q - 1.5) * 4); } ctx.moveTo(-12, 6); ctx.lineTo(-24, -6); ctx.stroke(); ctx.fillStyle = SKIN; rounded(ctx, -16, -10, 30, 28, 10); ctx.fill(); }
      });
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The five senses');
      // The face.
      for (const sd of [-1, 1]) { circ(ctx, fx + sd * R * 0.98, fy + 8, 24, SKIN); circ(ctx, fx + sd * R * 0.98, fy + 8, 11, '#e8a87c'); }
      circ(ctx, fx, fy, R, SKIN);
      ctx.fillStyle = HAIR; ctx.beginPath(); ctx.arc(fx, fy - 6, R + 5, PI * 1.03, PI * 1.97);
      ctx.quadraticCurveTo(fx + R * 0.55, fy - R * 0.5, fx + R * 0.1, fy - R * 0.62); ctx.quadraticCurveTo(fx - R * 0.45, fy - R * 0.45, fx - R - 3, fy - 16); ctx.fill();
      const look = si === 0 ? -1 : si === 1 ? 1 : si === 2 ? -0.6 : si === 4 ? 0.8 : 0;
      eyes(ctx, fx, fy - 8, 78, 17, k, 1, look);
      oval(ctx, fx, fy + 24, 11, 15, 0, '#eeb38a');
      cheeks(ctx, fx, fy + 30, 140, 13);
      if (si === 3) { smile(ctx, fx, fy + 64, 28, '#7a2e2e', 4, 1); oval(ctx, fx, fy + 74, 13, 10 + 3 * Math.sin(k * 6), 0, '#ff8fab'); }
      else smile(ctx, fx, fy + 64, 28, '#7a2e2e', 4);
      // The lit sense.
      ctx.save(); ctx.globalAlpha *= env; ctx.strokeStyle = C; ctx.lineWidth = 5;
      if (si === 0) { rounded(ctx, fx - 70, fy - 36, 140, 56, 28); ctx.stroke(); }
      if (si === 1) { for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(fx + sd * R * 0.98, fy + 8, 34, 0, TAU); ctx.stroke(); } }
      if (si === 2) { ctx.beginPath(); ctx.arc(fx, fy + 24, 26, 0, TAU); ctx.stroke(); }
      if (si === 3) { ctx.beginPath(); ctx.arc(fx, fy + 62, 36, 0, TAU); ctx.stroke(); }
      ctx.restore();
      // What the sense meets.
      ctx.save(); ctx.globalAlpha *= clamp(ps * 1.2);
      if (si === 0) {
        const rx = X0 + 125; const ry = Y0 + 172;
        ['#fb7185', '#ff9f43', '#fbbf24', '#34d399', '#5b8cff', '#a78bfa'].forEach((c, j) => { ctx.strokeStyle = c; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(rx, ry, (88 - j * 7) * ps, PI, TAU); ctx.stroke(); });
        cloud(ctx, rx - 82, ry + 4, 0.4, '#ffffff'); cloud(ctx, rx + 82, ry + 4, 0.4, '#ffffff');
        ctx.setLineDash([8, 10]); line(ctx, fx - 50, fy - 22, rx + 70, ry + 34, tint('blue', 0.8), 3); ctx.setLineDash([]);
      }
      if (si === 1) {
        const bx = X1 - 100; const by = Y0 + 250; const sw = Math.sin(k * 7) * 0.35;
        ctx.save(); ctx.translate(bx, by - 50); ctx.rotate(sw); ctx.scale(ps, ps);
        ctx.fillStyle = '#ffc93c'; ctx.beginPath(); ctx.moveTo(-8, 8); ctx.quadraticCurveTo(-34, 14, -36, 70); ctx.lineTo(36, 70); ctx.quadraticCurveTo(34, 14, 8, 8); ctx.closePath(); ctx.fill();
        circ(ctx, 0, 8, 10, '#ffc93c'); circ(ctx, Math.sin(k * 7 + 1) * 10, 76, 9, '#c98a1a'); ctx.fillStyle = '#e8a91c'; ctx.fillRect(-38, 62, 76, 9);
        ctx.restore();
        for (let j = 0; j < 3; j++) { const q = mod(k * 0.9 + j / 3, 1); ctx.strokeStyle = tint('purple', 1 - q); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(bx - 30 - q * 70, by, 18 + q * 22, PI * 0.72, PI * 1.28); ctx.stroke(); }
      }
      if (si === 2) {
        const flx = X0 + 105; const fly = Y0 + 290;
        line(ctx, flx, fly, flx, fly + 90 * ps, '#3fbf5f', 6); leaf(ctx, flx, fly + 60, 34 * ps, 13, -0.6, '#3fbf5f', null);
        flower(ctx, flx, fly, 34 * ps, '#ff6b9a', 7, '#ffd23f', k * 0.3);
        for (let j = 0; j < 3; j++) {
          const q = mod(k * 0.5 + j / 3, 1); ctx.strokeStyle = tint('orange', 0.9 * Math.sin(q * PI)); ctx.lineWidth = 4; ctx.beginPath();
          for (let m = 0; m <= 10; m++) { const p = clamp(q - 0.25 + m * 0.025); const x = lerp(flx + 30, fx - 26, p); const y = lerp(fly - 10, fy + 20, p) - Math.sin(p * PI) * 70 + Math.sin(m * 1.2 + k * 5) * 5; if (m) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
          ctx.stroke();
        }
      }
      if (si === 3) sc(ctx, X0 + 130, Y0 + 430, ps, () => {
        ctx.fillStyle = '#e0a458'; poly(ctx, [-32, -6, 32, -6, 0, 82]); ctx.fill();
        ctx.strokeStyle = '#b57a34'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-20, 8); ctx.lineTo(14, 50); ctx.moveTo(20, 8); ctx.lineTo(-14, 50); ctx.stroke();
        circ(ctx, 0, -14, 30, '#9be7c4'); circ(ctx, 0, -50, 26, '#ff9ec4'); circ(ctx, 4, -80, 8, '#e8524a');
        dotEyes(ctx, 0, -52, 14, 3); smile(ctx, 0, -44, 6, PUPIL, 2);
      });
      if (si === 4) {
        const tx = X1 - 105; const ty = Y0 + 395;
        sc(ctx, tx, ty, ps, () => {
          circ(ctx, 0, 62, 42, '#b07a4a'); circ(ctx, -26, -28, 13, '#b07a4a'); circ(ctx, 26, -28, 13, '#b07a4a'); circ(ctx, -26, -28, 7, '#e3b98a'); circ(ctx, 26, -28, 7, '#e3b98a');
          circ(ctx, 0, 0, 36, '#c48a56'); oval(ctx, 0, 12, 15, 11, 0, '#e3b98a'); oval(ctx, 0, 7, 6, 4, 0, '#3b2a20'); dotEyes(ctx, 0, -8, 26, 4);
          smile(ctx, 0, 18, 5, '#3b2a20', 2); circ(ctx, 0, 62, 22, '#e3b98a');
        });
        const hx = tx - 95 + Math.sin(k * 3) * 6; const hy = ty + 40;
        ctx.save(); ctx.globalAlpha *= ps; icon(4, hx, hy, 1.25); ctx.restore();
        for (let j = 0; j < 3; j++) { const q = mod(k * 1.2 + j / 3, 1); starPath(ctx, hx + 12 + j * 18, hy - 50 - q * 20, 7, 3, 4); ctx.fillStyle = tint('teal', 1 - q); ctx.fill(); }
      }
      ctx.restore();
      if (si === 4) { ctx.save(); ctx.globalAlpha *= env; ctx.strokeStyle = C; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(X1 - 200 + Math.sin(k * 3) * 6, Y0 + 430, 44, 0, TAU); ctx.stroke(); ctx.restore(); }
      chip(ctx, S[si][2], cx, Y0 + 508, S[si][1], 24);
      // The five sense cards.
      for (let j = 0; j < 5; j++) {
        const x = cx + (j - 2) * 148; const y = Y0 + 615; const on = j === si; const lift = on ? 8 * env : 0;
        ctx.fillStyle = on ? tint(S[j][1], 0.2) : 'rgba(255,255,255,0.04)'; ctx.strokeStyle = on ? color(S[j][1]) : 'rgba(140,170,255,0.25)'; ctx.lineWidth = on ? 3 : 1.5;
        rounded(ctx, x - 66, y - 54 - lift, 132, 112, 18); ctx.fill(); ctx.stroke();
        icon(j, x, y - 20 - lift, on ? 1.05 : 0.9);
        label(ctx, S[j][0], x, y + 30 - lift, { size: 24, weight: on ? 800 : 600, fill: on ? S[j][1] : 'ink' });
      }
      ctx.restore();
    },

    // T. rex, Triceratops, Brachiosaurus and Velociraptor beside a child
    // and a bus, all drawn to the same scale.
    'dinosaur-sizes'(b, ctx, it, t) {
      const k = b.clock; const s = 22; const gA = Y0 + 365; const gB = Y0 + 615;
      const draw = (x0, gy, at, fn, i) => {
        const p = pop(t, at, 0.6); if (p <= 0.001) return;
        ctx.save(); ctx.translate(x0, gy); ctx.scale(s, -s * p * (1 + 0.012 * Math.sin(k * 2 + i)));
        fn(); ctx.restore();
      };
      const eye = (x, y, r) => { circ(ctx, x, y, r, '#ffffff'); circ(ctx, x + r * 0.2, y, r * 0.55, PUPIL); };
      const legs = (L, c) => { ctx.fillStyle = c; for (const [lx, w, h] of L) { rounded(ctx, lx, 0, w, h, Math.min(w, h) * 0.3); ctx.fill(); } };
      const brachio = () => {
        legs([[6.3, 1.1, 5], [12.0, 1.15, 5.5]], '#8b6fe0');
        ctx.fillStyle = '#a78bfa';
        ctx.beginPath(); ctx.moveTo(0, 4.3); ctx.quadraticCurveTo(3, 5.0, 5.5, 6.5); ctx.lineTo(5.8, 4.3); ctx.quadraticCurveTo(3, 4.0, 0, 4.3); ctx.fill();
        ctx.beginPath(); ctx.ellipse(9.5, 5.6, 5, 2.4, 0.08, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(12.0, 7.3); ctx.quadraticCurveTo(16.8, 9.0, 19.7, 12.0); ctx.lineTo(20.8, 11.4); ctx.quadraticCurveTo(17.6, 7.6, 14.3, 4.8); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.ellipse(20.6, 11.95, 1.35, 0.68, 0.12, 0, TAU); ctx.fill();
        legs([[5.4, 1.15, 4.6], [11.0, 1.2, 5.4]], '#a78bfa');
        ctx.fillStyle = '#c4b5fd'; ctx.beginPath(); ctx.ellipse(9.8, 4.4, 3.4, 0.8, 0.05, 0, TAU); ctx.fill();
        eye(20.95, 12.15, 0.24);
      };
      const trex = () => {
        legs([[6.9, 0.65, 2.2]], '#22b07f');
        ctx.fillStyle = '#34d399';
        ctx.beginPath(); ctx.moveTo(0, 3.4); ctx.quadraticCurveTo(2.5, 3.9, 5, 4.7); ctx.lineTo(5.3, 3.0); ctx.quadraticCurveTo(2.5, 3.1, 0, 3.4); ctx.fill();
        ctx.beginPath(); ctx.ellipse(6.6, 3.8, 2.4, 1.3, -0.12, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(8.2, 4.8); ctx.quadraticCurveTo(9.4, 5.3, 10.5, 5.1); ctx.lineTo(10.4, 4.0); ctx.quadraticCurveTo(9.4, 3.7, 8.6, 3.1); ctx.fill();
        rounded(ctx, 10.1, 4.0, 1.9, 1.2, 0.45); ctx.fill();
        ctx.beginPath(); ctx.ellipse(6.1, 2.8, 0.95, 1.3, 0.25, 0, TAU); ctx.fill();
        poly(ctx, [5.7, 2.0, 6.6, 2.2, 6.6, 0.25, 6.0, 0.25]); ctx.fill();
        ctx.beginPath(); ctx.ellipse(6.6, 0.18, 0.75, 0.2, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#34d399'; ctx.lineWidth = 0.28; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(8.3, 3.6); ctx.lineTo(8.9, 3.1); ctx.lineTo(9.1, 3.3); ctx.stroke();
        ctx.fillStyle = '#ffffff'; for (let j = 0; j < 4; j++) poly(ctx, [10.5 + j * 0.35, 4.25, 10.68 + j * 0.35, 4.25, 10.6 + j * 0.35, 4.0]), ctx.fill();
        ctx.fillStyle = '#a7f3d0'; ctx.beginPath(); ctx.ellipse(6.8, 3.0, 1.7, 0.5, -0.1, 0, TAU); ctx.fill();
        eye(11.2, 4.85, 0.2);
      };
      const trike = () => {
        legs([[3.6, 0.55, 1.6], [5.9, 0.55, 1.6]], '#e8862a');
        ctx.fillStyle = '#ff9f43';
        ctx.beginPath(); ctx.moveTo(0, 2.0); ctx.quadraticCurveTo(1.5, 2.3, 2.6, 2.8); ctx.lineTo(2.8, 1.6); ctx.quadraticCurveTo(1.5, 1.8, 0, 2.0); ctx.fill();
        ctx.beginPath(); ctx.ellipse(4.4, 2.0, 2.3, 1.15, 0, 0, TAU); ctx.fill();
        legs([[2.9, 0.6, 1.6], [5.2, 0.6, 1.6]], '#ff9f43');
        ctx.fillStyle = '#ffc078'; ctx.beginPath(); ctx.ellipse(6.95, 2.6, 0.75, 1.15, -0.45, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ff9f43'; poly(ctx, [6.6, 2.6, 7.7, 2.5, 8.95, 1.55, 8.6, 1.25, 7.2, 1.15, 6.6, 1.8]); ctx.fill();
        ctx.fillStyle = '#fff3c4'; poly(ctx, [7.55, 2.35, 7.95, 2.5, 8.95, 3.25]); ctx.fill(); poly(ctx, [8.3, 1.85, 8.55, 1.85, 8.62, 2.35]); ctx.fill();
        eye(7.75, 2.1, 0.17);
      };
      const raptor = () => {
        ctx.fillStyle = '#22d3ee';
        poly(ctx, [0, 0.66, 0.95, 0.68, 0.95, 0.5, 0, 0.6]); ctx.fill();
        ctx.beginPath(); ctx.ellipse(1.15, 0.56, 0.32, 0.17, -0.2, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(1.62, 0.8, 0.24, 0.1, 0.1, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 0.08; ctx.beginPath(); ctx.moveTo(1.35, 0.6); ctx.lineTo(1.5, 0.78); ctx.moveTo(1.1, 0.45); ctx.lineTo(1.04, 0.22); ctx.lineTo(1.16, 0); ctx.moveTo(1.2, 0.45); ctx.lineTo(1.22, 0.22); ctx.lineTo(1.32, 0); ctx.stroke();
      };
      const bus = () => {
        ctx.fillStyle = '#fbbf24'; rounded(ctx, 0, 0.35, 12, 2.8, 0.4); ctx.fill();
        ctx.fillStyle = '#bfe6ff'; for (let j = 0; j < 6; j++) { rounded(ctx, 1.4 + j * 1.6, 1.75, 1.2, 0.95, 0.15); ctx.fill(); }
        rounded(ctx, 11.1, 1.4, 0.75, 1.3, 0.15); ctx.fill();
        ctx.fillStyle = '#e8862a'; ctx.fillRect(0.2, 1.3, 11.6, 0.18);
        for (const wx of [2.4, 9.6]) { circ(ctx, wx, 0.5, 0.52, '#2a2140'); circ(ctx, wx, 0.5, 0.22, '#9aa3b8'); }
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'How big were dinosaurs?');
      line(ctx, X0 + 10, gA, X1 - 10, gA, '#6b8f5a', 4); line(ctx, X0 + 10, gB, X1 - 10, gB, '#6b8f5a', 4);
      draw(X0 + 15, gA, 0.3, brachio, 0);
      draw(X0 + 15, gB, 0.6, bus, 1);
      draw(X0 + 293, gB, 0.9, trex, 2);
      draw(X0 + 571, gB, 1.2, trike, 3);
      draw(X0 + 690, gA, 1.5, raptor, 4);
      const kidX = X0 + 610;
      sc(ctx, kidX, gA, pop(t, 1.8), () => kid(ctx, 0, 0, 1.2 * s, '#fb7185', k, true));
      ctx.save(); ctx.globalAlpha *= after(t, 2);
      label(ctx, 'You', kidX, gA - 62, { size: 24, weight: 800, fill: 'yellow' });
      head(ctx, kidX, gA - 34, PI / 2, 9, 'yellow');
      ctx.restore();
      const L = (text, x, y, at) => { ctx.save(); ctx.globalAlpha *= after(t, at); label(ctx, text, x, y, { size: 22, weight: 700, fill: 'ink' }); ctx.restore(); };
      L('Brachiosaurus 22 m', X0 + 15 + 11 * s, gA + 28, 0.5);
      L('Velociraptor 2 m', X0 + 712, gA + 28, 1.6);
      L('School bus 12 m', X0 + 15 + 6 * s, gB + 28, 0.8);
      L('T. rex 12 m', X0 + 293 + 6 * s, gB + 28, 1.1);
      L('Triceratops 9 m', X0 + 571 + 4.5 * s, gB + 28, 1.4);
      // Scale bar and the big date.
      const bx = X1 - 240; const by = Y0 + 178;
      line(ctx, bx, by, bx + 10 * s, by, 'ink', 3); line(ctx, bx, by - 8, bx, by + 8, 'ink', 3); line(ctx, bx + 10 * s, by - 8, bx + 10 * s, by + 8, 'ink', 3);
      label(ctx, '10 metres', bx + 5 * s, by - 22, { size: 22, weight: 700, fill: 'muted' });
      ctx.fillStyle = 'rgba(5,8,22,0.6)'; ctx.strokeStyle = tint('orange', 0.6); ctx.lineWidth = 2; rounded(ctx, X1 - 262, Y0 + 50, 250, 84, 16); ctx.fill(); ctx.stroke();
      label(ctx, 'Dinosaurs died out', X1 - 137, Y0 + 76, { size: 22, weight: 700, fill: 'orange' });
      label(ctx, '66 million years ago', X1 - 137, Y0 + 107, { size: 22, weight: 800, fill: 'yellow' });
      chip(ctx, 'All drawn to the same scale', cx, Y1 - 30, 'muted', 22);
      ctx.restore();
    },

    // The sunlit, twilight and midnight zones, with animals in each and a
    // submarine diving down and back.
    'ocean-zones'(b, ctx, it, t) {
      const k = b.clock; const sY = Y0 + 66; const b1 = Y0 + 240; const b2 = Y0 + 445; const fl = Y1 - 16;
      const xL = X0 + 10; const xR = X1 - 10;
      const depth = (y) => (y < b1 ? 200 * (y - sY) / (b1 - sY) : y < b2 ? 200 + 800 * (y - b1) / (b2 - b1) : 1000 + 3000 * (y - b2) / (fl - b2));
      const fish = (x, y, sz, c, dir) => { ctx.save(); ctx.translate(x, y); ctx.scale(dir * sz, sz); ctx.fillStyle = color(c); poly(ctx, [-18, 0, -32, -12, -32, 12]); ctx.fill(); oval(ctx, 0, 0, 22, 13, 0, c); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(-6, -11, 5, 22); circ(ctx, 12, -3, 4, '#ffffff'); circ(ctx, 13, -3, 2.2, PUPIL); ctx.restore(); };
      const jelly = (x, y, c, ph) => {
        const sq = 1 + 0.12 * Math.sin(k * 2.4 + ph);
        circ(ctx, x, y, 46, tint(c, 0.12));
        ctx.strokeStyle = tint(c, 0.7); ctx.lineWidth = 3; ctx.beginPath();
        for (let j = 0; j < 5; j++) { const tx = x - 20 + j * 10; ctx.moveTo(tx, y); for (let m = 1; m <= 6; m++) ctx.lineTo(tx + Math.sin(k * 3 + j + m) * 4, y + m * 9); }
        ctx.stroke();
        ctx.fillStyle = tint(c, 0.75); ctx.beginPath(); ctx.ellipse(x, y, 28 * sq, 24 / sq, 0, PI, TAU); ctx.closePath(); ctx.fill();
        dotEyes(ctx, x, y - 8, 14, 2.6, '#ffffff'); smile(ctx, x, y - 2, 4, '#ffffff', 2);
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Zones of the ocean');
      sun(ctx, X1 - 38, Y0 + 30, 17, k, false);
      ctx.save(); clipRound(ctx, xL, sY, xR - xL, fl - sY, 18);
      const gr = ctx.createLinearGradient(0, sY, 0, fl);
      gr.addColorStop(0, '#45b6f0'); gr.addColorStop((b1 - sY) / (fl - sY), '#1d68b0'); gr.addColorStop((b2 - sY) / (fl - sY), '#0f2c63'); gr.addColorStop(1, '#03061a');
      ctx.fillStyle = gr; ctx.fillRect(xL, sY, xR - xL, fl - sY);
      // Sunbeams fading with depth.
      for (let j = 0; j < 4; j++) { const x = X0 + 260 + j * 150 + Math.sin(k * 0.5 + j) * 20; const g2 = ctx.createLinearGradient(0, sY, 0, b1 + 40); g2.addColorStop(0, 'rgba(255,255,220,0.22)'); g2.addColorStop(1, 'rgba(255,255,220,0)'); ctx.fillStyle = g2; poly(ctx, [x, sY, x + 40, sY, x + 10, b1 + 40, x - 40, b1 + 40]); ctx.fill(); }
      ctx.strokeStyle = 'rgba(220,245,255,0.8)'; ctx.lineWidth = 4; ctx.beginPath();
      for (let x = xL; x <= xR; x += 10) { const y = sY + 4 + Math.sin(x / 30 + k * 2) * 3; if (x === xL) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
      line(ctx, xL, b1, xR, b1, 'rgba(255,255,255,0.3)', 2, [10, 10]); line(ctx, xL, b2, xR, b2, 'rgba(255,255,255,0.3)', 2, [10, 10]);
      // Sea floor.
      ctx.fillStyle = '#2b2740'; ctx.beginPath(); ctx.moveTo(xL, fl); ctx.lineTo(xL, fl - 26); for (let x = xL; x <= xR; x += 40) ctx.lineTo(x, fl - 22 - Math.sin(x / 50) * 8); ctx.lineTo(xR, fl); ctx.closePath(); ctx.fill();
      // Sunlit animals.
      for (let j = 0; j < 4; j++) { const x = X0 + 830 - mod(k * 55 + j * 34, 640); fish(x, Y0 + 125 + (j % 2) * 26 + Math.sin(k * 3 + j) * 4, 0.95, j % 2 ? '#ff9f43' : '#ffc93c', -1); }
      const tX = X0 + 240 + mod(k * 30, 640); const tY = Y0 + 195 + Math.sin(k * 1.2) * 6;
      ctx.save(); ctx.translate(tX, tY); const fp = Math.sin(k * 3) * 0.4;
      oval(ctx, 18, -12, 14, 6, -0.6 + fp, '#6fcf7f'); oval(ctx, 18, 12, 14, 6, 0.6 - fp, '#6fcf7f'); oval(ctx, -20, -10, 9, 5, 0.6, '#6fcf7f'); oval(ctx, -20, 10, 9, 5, -0.6, '#6fcf7f');
      oval(ctx, 0, 0, 30, 20, 0, '#4caf50'); ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 2; hexPath(ctx, 0, 0, 10); ctx.stroke();
      circ(ctx, 34, 0, 10, '#6fcf7f'); circ(ctx, 38, -3, 2.5, PUPIL); ctx.restore();
      // Twilight animals.
      jelly(X0 + 270, Y0 + 300 + Math.sin(k * 0.9) * 14, 'purple', 0);
      jelly(X0 + 720, Y0 + 330 + Math.sin(k * 0.8 + 2) * 14, '#ff8fb8', 2);
      const lx = X0 + 820 - mod(k * 40, 560); const ly = Y0 + 395;
      fish(lx, ly, 0.7, '#6f86b8', -1); for (let j = 0; j < 3; j++) circ(ctx, lx - 6 + j * 8, ly + 6, 2.5, `rgba(140,240,255,${0.6 + 0.4 * Math.sin(k * 5 + j)})`);
      // Midnight: an anglerfish with its glowing lure.
      const ax = X0 + 300 + Math.sin(k * 0.6) * 30; const ay = Y0 + 560 + Math.sin(k * 0.9) * 8;
      ctx.save(); ctx.translate(ax, ay);
      ctx.strokeStyle = '#7a6f9a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, -32); ctx.quadraticCurveTo(30, -70, 62, -52); ctx.stroke();
      const glowA = 0.6 + 0.4 * Math.sin(k * 3);
      circ(ctx, 62, -50, 22, `rgba(160,255,230,${0.18 * glowA})`); circ(ctx, 62, -50, 12, `rgba(160,255,230,${0.35 * glowA})`); circ(ctx, 62, -50, 6, '#d9fff5');
      ctx.fillStyle = '#4b4266'; poly(ctx, [-40, 0, -64, -20, -64, 20]); ctx.fill();
      oval(ctx, 0, 0, 46, 36, 0, '#5a4f7a');
      ctx.fillStyle = '#ffffff'; for (let j = 0; j < 5; j++) poly(ctx, [16 + j * 6, 8, 19 + j * 6, 8, 17.5 + j * 6, 16]), ctx.fill();
      ctx.strokeStyle = '#2a2140'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, 8); ctx.quadraticCurveTo(30, 14, 44, 4); ctx.stroke();
      circ(ctx, 22, -12, 8, '#ffffff'); circ(ctx, 24, -12, 4.5, PUPIL);
      ctx.restore();
      for (let j = 0; j < 14; j++) { const x = X0 + 220 + rnd(j) * 560; const y = b2 + 20 + rnd(j + 9) * (fl - b2 - 60); circ(ctx, x, y, 2.5, `rgba(140,240,255,${0.3 + 0.5 * Math.max(0, Math.sin(k * 2 + j * 1.7))})`); }
      // The submarine.
      const q = mod(t / 14, 1); const dive = q < 0.5 ? smooth(q / 0.45) : 1 - smooth((q - 0.5) / 0.45);
      const subX = X0 + 520; const subY = lerp(sY + 50, fl - 70, dive);
      if (subY > b1 - 20) { const a = clamp((subY - b1 + 20) / 120) * 0.35; ctx.fillStyle = `rgba(255,250,200,${a})`; poly(ctx, [subX + 48, subY + 4, subX + 230, subY - 40, subX + 230, subY + 70]); ctx.fill(); }
      ctx.save(); ctx.translate(subX, subY); ctx.rotate(Math.sin(k * 1.4) * 0.04);
      oval(ctx, -56, 0, 6, 16 * Math.abs(Math.cos(k * 12)), 0, '#ffb627');
      ctx.fillStyle = '#ffc93c'; rounded(ctx, -12, -42, 34, 22, 8); ctx.fill(); line(ctx, 8, -42, 8, -56, '#ffc93c', 4); line(ctx, 8, -56, 20, -56, '#ffc93c', 4);
      oval(ctx, 0, 0, 52, 27, 0, '#ffd23f');
      for (const wx of [-22, 2, 26]) { circ(ctx, wx, -2, 9, '#9fdcff'); circ(ctx, wx, -2, 9, null, '#e8a91c', 3); }
      ctx.restore();
      ctx.restore();
      // Zone names and depths.
      const Z = [['Sunlit zone', '0–200 m', 'yellow', (sY + b1) / 2], ['Twilight zone', '200–1,000 m', '#c4b5fd', (b1 + b2) / 2], ['Midnight zone', '1,000–4,000 m', '#93c5fd', (b2 + fl) / 2]];
      Z.forEach(([n, d, c, y], i) => {
        ctx.save(); ctx.globalAlpha *= after(t, 0.3 + i * 0.3);
        ctx.fillStyle = 'rgba(5,8,22,0.55)'; rounded(ctx, xL + 10, y - 38, 186, 76, 14); ctx.fill();
        label(ctx, n, xL + 22, y - 14, { size: 24, weight: 800, fill: c, align: 'left' });
        label(ctx, d, xL + 22, y + 16, { size: 22, weight: 600, fill: 'ink', align: 'left' });
        ctx.restore();
      });
      chip(ctx, `${Math.round(depth(subY) / 10) * 10} m deep`, subX, subY - 82 < sY + 6 ? subY + 60 : subY - 82, 'yellow', 22);
      ctx.restore();
    },

    // Nest, burrow, hive, web, den and pond, each popping in with the
    // animal that lives there.
    'animal-homes'(b, ctx, it, t) {
      const k = b.clock;
      const H = [['Nest', 'a bird', 'orange'], ['Burrow', 'a rabbit', 'yellow'], ['Hive', 'bees', 'yellow'], ['Web', 'a spider', 'purple'], ['Den', 'a fox', 'orange'], ['Pond', 'a frog', 'cyan']];
      const tw = 246; const th = 272; const gap = 12; const x0 = cx - (3 * tw + 2 * gap) / 2;
      const hi = t > 3.5 ? Math.floor((t - 3.5) / 1.6) % 6 : -1;
      const DRAW = [
        () => {
          ctx.strokeStyle = '#8d6e4f'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-110, 40); ctx.lineTo(110, 20); ctx.stroke();
          leaf(ctx, 70, 24, 40, 14, -0.8, '#3fbf5f', null); leaf(ctx, -80, 37, 36, 13, 2.4, '#3fbf5f', null);
          const hop = Math.max(0, Math.sin(k * 3)) * 6;
          circ(ctx, 0, -6 - hop, 30, '#5b8cff'); circ(ctx, 20, -30 - hop, 18, '#5b8cff'); oval(ctx, -8, -2 - hop, 18, 11, -0.3, '#8fb3ff');
          head(ctx, 44, -30 - hop, 0, 9, '#ff9f43'); circ(ctx, 25, -35 - hop, 4, PUPIL); circ(ctx, 24, -36 - hop, 1.4, '#ffffff');
          ctx.fillStyle = '#a8763e'; ctx.beginPath(); ctx.ellipse(0, 18, 58, 26, 0, 0, PI); ctx.lineTo(-58, 8); ctx.lineTo(58, 8); ctx.fill();
          ctx.strokeStyle = '#7a5228'; ctx.lineWidth = 3; ctx.beginPath(); for (let j = 0; j < 7; j++) { ctx.moveTo(-54 + j * 16, 10 + (j % 2) * 6); ctx.lineTo(-40 + j * 16, 34 - (j % 2) * 8); } ctx.stroke();
        },
        () => {
          ctx.fillStyle = '#7d5836'; rounded(ctx, -115, -40, 230, 140, 14); ctx.fill(); ctx.fillStyle = '#4caf50'; ctx.fillRect(-115, -46, 230, 10);
          ctx.strokeStyle = '#3e2a18'; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-80, -40); ctx.quadraticCurveTo(-60, 30, 10, 45); ctx.stroke();
          oval(ctx, 40, 50, 56, 32, 0, '#3e2a18');
          const tw2 = Math.sin(k * 4) * 0.12;
          oval(ctx, 34, 26, 7, 22, -0.2 + tw2, '#e8e2f0'); oval(ctx, 50, 26, 7, 22, 0.2 - tw2, '#e8e2f0');
          oval(ctx, 30, 62, 26, 20, 0, '#d9d2e6'); circ(ctx, 44, 50, 17, '#e8e2f0'); dotEyes(ctx, 44, 47, 12, 2.6); circ(ctx, 44, 54, 2.6, '#ff8fb8'); circ(ctx, 6, 66, 8, '#ffffff');
        },
        () => {
          ctx.strokeStyle = '#8d6e4f'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-110, -78); ctx.lineTo(110, -86); ctx.stroke(); line(ctx, 0, -80, 0, -62, '#8d6e4f', 4);
          for (let j = 0; j < 5; j++) oval(ctx, 0, -50 + j * 22, 30 + j * 9 - (j === 4 ? 14 : 0), 13, 0, j % 2 ? '#f0b429' : '#ffc93c');
          oval(ctx, 0, 30, 10, 9, 0, '#5a3a14');
          for (let j = 0; j < 3; j++) { const a = k * 1.6 + (j * TAU) / 3; sc(ctx, Math.cos(a) * 80, -6 + Math.sin(a * 1.3) * 36, 0.65, () => { ctx.save(); if (Math.sin(a) > 0) ctx.scale(-1, 1); beeShape(ctx, k + j); ctx.restore(); }); }
        },
        () => {
          const wx = 0; const wy = -4;
          ctx.strokeStyle = 'rgba(235,240,255,0.75)'; ctx.lineWidth = 2; ctx.beginPath();
          for (let j = 0; j < 8; j++) { const a = (j / 8) * TAU + 0.2; ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(a) * 95, wy + Math.sin(a) * 82); }
          for (let r = 18; r <= 90; r += 14) for (let j = 0; j <= 8; j++) { const a = (j / 8) * TAU + 0.2; const px = wx + Math.cos(a) * r; const py = wy + Math.sin(a) * r * 0.86; if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
          ctx.stroke();
          const dy = Math.sin(k * 1.5) * 6;
          ctx.strokeStyle = '#2a2140'; ctx.lineWidth = 3.5; ctx.beginPath();
          for (const sd of [-1, 1]) for (let j = 0; j < 4; j++) { const a = -0.9 + j * 0.6; ctx.moveTo(wx, wy + dy); ctx.lineTo(wx + sd * Math.cos(a) * 20, wy + dy + Math.sin(a) * 14 - 6); ctx.lineTo(wx + sd * Math.cos(a) * 32, wy + dy + Math.sin(a) * 26 + 4); }
          ctx.stroke();
          circ(ctx, wx, wy + dy + 6, 14, '#3b2f5c'); circ(ctx, wx, wy + dy - 10, 10, '#3b2f5c'); eyes(ctx, wx, wy + dy - 11, 9, 3.6, k, 4);
        },
        () => {
          ctx.fillStyle = '#5c7a3a'; ctx.beginPath(); ctx.moveTo(-118, 80); ctx.quadraticCurveTo(-60, -90, 30, -60); ctx.quadraticCurveTo(110, -40, 118, 80); ctx.closePath(); ctx.fill();
          oval(ctx, 0, 40, 58, 42, 0, '#2a2016');
          const pk = 4 * Math.sin(k * 2);
          ctx.fillStyle = '#ff8a3d'; poly(ctx, [-30, 20 + pk, -22, -16 + pk, -6, 10 + pk]); ctx.fill(); poly(ctx, [30, 20 + pk, 22, -16 + pk, 6, 10 + pk]); ctx.fill();
          ctx.fillStyle = '#ff8a3d'; poly(ctx, [-34, 14 + pk, 34, 14 + pk, 0, 64 + pk]); ctx.fill();
          ctx.fillStyle = '#ffffff'; poly(ctx, [-30, 22 + pk, -6, 34 + pk, 0, 64 + pk]); ctx.fill(); poly(ctx, [30, 22 + pk, 6, 34 + pk, 0, 64 + pk]); ctx.fill();
          circ(ctx, 0, 62 + pk, 5, PUPIL); eyes(ctx, 0, 28 + pk, 26, 5, k, 6);
        },
        () => {
          oval(ctx, 0, 30, 110, 46, 0, '#2f80ed'); oval(ctx, 0, 30, 110, 46, 0, null, '#5fb3ff', 3);
          for (let j = 0; j < 2; j++) { const q = mod(k * 0.5 + j / 2, 1); oval(ctx, -50, 36, 12 + 36 * q, 5 + 14 * q, 0, null, `rgba(200,230,255,${0.8 * (1 - q)})`, 2); }
          ctx.fillStyle = '#3fbf5f'; ctx.beginPath(); ctx.ellipse(30, 36, 44, 17, 0, 0.35, TAU - 0.15); ctx.lineTo(30, 36); ctx.fill();
          line(ctx, -100, 0, -100, -60, '#6b8f3a', 4); oval(ctx, -100, -66, 6, 14, 0, '#8d6e4f'); line(ctx, -84, 4, -82, -44, '#6b8f3a', 4); oval(ctx, -82, -50, 5, 12, 0, '#8d6e4f');
          const hop = Math.max(0, Math.sin(k * 2.5)) * 10;
          sc(ctx, 30, 6 - hop, 0.55, () => frogShape(ctx, k, 0, 9));
        },
      ];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Animal homes');
      H.forEach(([home, who, c], i) => {
        const col = i % 3; const row = Math.floor(i / 3); const x = x0 + col * (tw + gap); const y = Y0 + 52 + row * (th + gap);
        const p = pop(t, 0.3 + i * 0.45, 0.6); const on = i === hi;
        ctx.save(); ctx.globalAlpha *= clamp(p * 2);
        ctx.fillStyle = on ? tint(c, 0.16) : 'rgba(255,255,255,0.05)'; ctx.strokeStyle = on ? color(c) : 'rgba(140,170,255,0.28)'; ctx.lineWidth = on ? 3 : 1.5;
        rounded(ctx, x, y, tw, th, 20); ctx.fill(); ctx.stroke();
        ctx.save(); clipRound(ctx, x, y, tw, th - 74, 20);
        sc(ctx, x + tw / 2, y + 104, p * (on ? 1 + 0.05 * Math.sin(k * 5) : 1), DRAW[i]);
        ctx.restore();
        label(ctx, home, x + tw / 2, y + th - 50, { size: 27, weight: 800, fill: c });
        label(ctx, `home of ${who}`, x + tw / 2, y + th - 20, { size: 22, weight: 600, fill: 'ink' });
        ctx.restore();
      });
      chip(ctx, 'Every animal needs a safe home', cx, Y1 - 28, 'green', 22);
      ctx.restore();
    },

    // A moonlit scene with an owl, a bat, a fox and a hedgehog, their eyes
    // shining: awake at night, asleep in the day.
    'nocturnal-animals'(b, ctx, it, t) {
      const k = b.clock; const px = X0 + 10; const py = Y0 + 50; const pw = FIG.w - 20; const ph = FIG.h - 128; const gy = py + ph - 70;
      const shine = (x, y, r, c) => { circ(ctx, x, y, r * 2.2, tint(c, 0.22)); circ(ctx, x, y, r, c); circ(ctx, x - r * 0.3, y - r * 0.3, r * 0.3, '#ffffff'); };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Nocturnal animals');
      ctx.save(); scene(ctx, px, py, pw, ph, '#0a1238', '#1f2c62', 24); clipRound(ctx, px, py, pw, ph, 24);
      for (let j = 0; j < 34; j++) { const x = px + 20 + rnd(j) * (pw - 40); const y = py + 15 + rnd(j + 50) * (ph * 0.55); if (x > X1 - 200 && y < py + 170) continue; const a = 0.4 + 0.6 * Math.abs(Math.sin(k * 1.5 + j)); ctx.fillStyle = `rgba(255,248,210,${a})`; starPath(ctx, x, y, 4 + 2 * rnd(j + 3), 1.6, 4); ctx.fill(); }
      const mx = X1 - 110; const my = py + 82;
      circ(ctx, mx, my, 70, 'rgba(255,248,210,0.08)'); circ(ctx, mx, my, 48, '#f4f1de'); circ(ctx, mx - 14, my - 12, 8, '#e3dec5'); circ(ctx, mx + 16, my + 14, 6, '#e3dec5');
      ctx.strokeStyle = '#8a8470'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(mx - 14, my - 2, 6, PI * 0.1, PI * 0.9); ctx.moveTo(mx + 20, my - 2); ctx.arc(mx + 14, my - 2, 6, PI * 0.1, PI * 0.9); ctx.stroke(); smile(ctx, mx, my + 18, 8, '#8a8470', 3);
      // Hills.
      ctx.fillStyle = '#16301f'; ctx.beginPath(); ctx.moveTo(px, gy + 10); ctx.quadraticCurveTo(px + pw * 0.3, gy - 40, px + pw * 0.55, gy); ctx.quadraticCurveTo(px + pw * 0.8, gy + 30, px + pw, gy - 20); ctx.lineTo(px + pw, py + ph); ctx.lineTo(px, py + ph); ctx.closePath(); ctx.fill();
      // Tree and owl.
      const tX = X0 + 120;
      ctx.fillStyle = '#3a2a22'; ctx.fillRect(tX - 16, py + 190, 32, gy - py - 170);
      ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tX, py + 280); ctx.lineTo(tX + 120, py + 262); ctx.stroke();
      for (const [dx, dy, r] of [[0, 120, 72], [-50, 165, 48], [50, 160, 52], [10, 200, 50]]) circ(ctx, tX + dx, py + dy, r, '#1c3a2a');
      const ox = tX + 95; const oy = py + 226; const turn = Math.sin(k * 0.7) * 0.15;
      oval(ctx, ox, oy, 30, 38, 0, '#8d6e4f'); oval(ctx, ox, oy + 8, 19, 26, 0, '#c9a27a');
      ctx.save(); ctx.translate(ox, oy - 34); ctx.rotate(turn);
      ctx.fillStyle = '#8d6e4f'; poly(ctx, [-26, -12, -20, -36, -8, -18]); ctx.fill(); poly(ctx, [26, -12, 20, -36, 8, -18]); ctx.fill();
      circ(ctx, 0, 0, 28, '#8d6e4f'); circ(ctx, -12, 0, 13, '#e8d5b5'); circ(ctx, 12, 0, 13, '#e8d5b5');
      const blink = mod(k, 5) < 0.15;
      if (blink) { line(ctx, -19, 0, -5, 0, PUPIL, 3); line(ctx, 5, 0, 19, 0, PUPIL, 3); } else { shine(-12, 0, 8, '#ffd23f'); shine(12, 0, 8, '#ffd23f'); circ(ctx, -12, 0, 4, PUPIL); circ(ctx, 12, 0, 4, PUPIL); }
      head(ctx, 0, 16, PI / 2, 7, '#ff9f43');
      ctx.restore();
      line(ctx, ox - 10, oy + 36, ox - 10, oy + 44, '#ff9f43', 4); line(ctx, ox + 10, oy + 36, ox + 10, oy + 44, '#ff9f43', 4);
      // Bat.
      const bx = cx + 30 + Math.sin(k * 0.55) * 150; const by = py + 150 + Math.sin(k * 1.3) * 26; const fl = Math.sin(k * 10);
      ctx.save(); ctx.translate(bx, by); ctx.fillStyle = '#4a3f66';
      for (const sd of [-1, 1]) { ctx.save(); ctx.scale(sd, 1); ctx.beginPath(); ctx.moveTo(6, -2); ctx.quadraticCurveTo(30, -26 - fl * 16, 56, -10 - fl * 20); ctx.quadraticCurveTo(46, -2, 44, 6 - fl * 6); ctx.quadraticCurveTo(34, 0, 28, 8 - fl * 4); ctx.quadraticCurveTo(18, 2, 6, 10); ctx.closePath(); ctx.fill(); ctx.restore(); }
      oval(ctx, 0, 2, 11, 15, 0, '#4a3f66'); ctx.fillStyle = '#4a3f66'; poly(ctx, [-9, -8, -6, -22, -2, -10]); ctx.fill(); poly(ctx, [9, -8, 6, -22, 2, -10]); ctx.fill();
      circ(ctx, -4, -3, 2.6, '#ff9ec4'); circ(ctx, 4, -3, 2.6, '#ff9ec4');
      ctx.restore();
      // Hedgehog.
      const hx = X0 + 330 + Math.sin(k * 0.4) * 14; const hy = gy + 40;
      ctx.fillStyle = '#6b4a2e'; ctx.beginPath();
      for (let j = 0; j <= 14; j++) { const a = PI + (j / 14) * PI; const r = j % 2 ? 46 : 36; const x = hx - 6 + Math.cos(a) * r; const y = hy + Math.sin(a) * r * 0.8; if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d9b38c'; ctx.beginPath(); ctx.moveTo(hx + 20, hy); ctx.quadraticCurveTo(hx + 30, hy - 26, hx + 52, hy - 4); ctx.lineTo(hx + 20, hy); ctx.fill();
      circ(ctx, hx + 53 + Math.sin(k * 6) * 1.5, hy - 4, 4, PUPIL); shine(hx + 34, hy - 12, 4, '#9cff8a'); circ(ctx, hx + 34, hy - 12, 2, PUPIL);
      // Fox walking to and fro.
      const fq = mod(k * 0.08, 1); const dir = fq < 0.5 ? 1 : -1; const fxp = X0 + 520 + 180 * (fq < 0.5 ? smooth(fq * 2) : 1 - smooth((fq - 0.5) * 2)); const fyp = gy + 30;
      ctx.save(); ctx.translate(fxp, fyp); ctx.scale(dir, 1); const st = Math.sin(k * 8);
      ctx.strokeStyle = '#d9662b'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); for (const [lx, ph] of [[-22, 0], [-12, PI], [16, PI], [26, 0]]) { ctx.moveTo(lx, 4); ctx.lineTo(lx + Math.sin(ph) * st * 6, 28); } ctx.stroke();
      ctx.fillStyle = '#ff8a3d'; ctx.beginPath(); ctx.moveTo(-30, -4); ctx.quadraticCurveTo(-70, -30, -88, -6); ctx.quadraticCurveTo(-64, 8, -30, 8); ctx.fill(); circ(ctx, -86, -6, 9, '#ffffff');
      oval(ctx, 0, 0, 36, 15, 0, '#ff8a3d');
      poly(ctx, [26, -6, 56, -14, 62, 2, 40, 10]); ctx.fill(); poly(ctx, [32, -10, 36, -32, 46, -14]); ctx.fill(); poly(ctx, [42, -12, 50, -32, 56, -12]); ctx.fill();
      ctx.fillStyle = '#ffffff'; poly(ctx, [40, 4, 62, 2, 48, 10]); ctx.fill(); circ(ctx, 63, 1, 3, PUPIL);
      shine(46, -6, 4.5, '#b6ff6b'); circ(ctx, 47, -6, 2.2, PUPIL);
      ctx.restore();
      ctx.restore();
      // Names.
      const N = (text, x, y, at) => { ctx.save(); ctx.globalAlpha *= after(t, at); chip(ctx, text, x, y, 'yellow', 22); ctx.restore(); };
      N('Owl', ox + 70, oy - 6, 0.6); N('Bat', bx, by - 48, 0.9); N('Hedgehog', hx, hy - 66, 1.2); N('Fox', fxp, fyp - 62, 1.5);
      chip(ctx, 'Awake at night, asleep in the day', cx, Y1 - 36, 'cyan', 23);
      ctx.restore();
    },

    // Bees fly from flowers to the hive with nectar (and pollen on their
    // legs), store it in honeycomb and fan their wings to dry it into honey.
    'bee-honey'(b, ctx, it, t) {
      const k = b.clock; const P = 3.4; const u = cycle(t, P * 4, 0.8); const st = Math.floor(u / P) % 4; const f = (u - st * P) / P;
      const SAY = ['Bees sip sweet nectar from flowers', 'Pollen sticks to their legs and helps flowers make seeds', 'At the hive they store the nectar in honeycomb', 'Fanning wings dries the nectar into honey'];
      const COL = ['orange', 'yellow', 'cyan', 'yellow'];
      const gY = Y0 + 600; const FL = [[X0 + 85, Y0 + 470, '#ff6b9a'], [X0 + 200, Y0 + 520, '#a78bfa'], [X0 + 315, Y0 + 470, '#5b8cff']];
      const hx = X0 + 465; const hy = Y0 + 150; const hw = 315; const hh = 380; const ent = [hx + 6, Y0 + 470];
      if (!it._bp) it._bp = (() => { const pts = [FL[0][0], FL[0][1] - 26, FL[1][0], FL[1][1] - 26, FL[2][0], FL[2][1] - 26, X0 + 400, Y0 + 400, ent[0], ent[1], ent[0] + 70, ent[1], ent[0], ent[1] - 4, X0 + 330, Y0 + 280, X0 + 150, Y0 + 300, FL[0][0], FL[0][1] - 26]; const cum = [0]; for (let i = 2; i < pts.length; i += 2) cum.push(cum[cum.length - 1] + Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1])); return { pts, cum, total: cum[cum.length - 1] }; })();
      const BP = it._bp;
      const along = (d) => { d = mod(d, BP.total); let i = 1; while (i < BP.cum.length - 1 && BP.cum[i] < d) i++; const q = (d - BP.cum[i - 1]) / (BP.cum[i] - BP.cum[i - 1] || 1); return { x: lerp(BP.pts[2 * i - 2], BP.pts[2 * i], q), y: lerp(BP.pts[2 * i - 1], BP.pts[2 * i + 1], q), dx: BP.pts[2 * i] - BP.pts[2 * i - 2], i }; };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'How bees make honey');
      // Ground and flowers.
      ctx.fillStyle = '#2e7d4f'; rounded(ctx, X0 + 10, gY, 380, 26, 12); ctx.fill();
      FL.forEach(([x, y, c], i) => {
        line(ctx, x, y, x, gY, '#3fbf5f', 6); leaf(ctx, x, y + 70, 36, 14, -0.5 - i * 0.2, '#3fbf5f', null); leaf(ctx, x, y + 95, 32, 12, PI + 0.5, '#3fbf5f', null);
        const lit = st === 1 && mod(k * 2 + i, 3) < 1.5;
        flower(ctx, x, y, 38, c, 7, lit ? '#fff36b' : '#ffd23f', Math.sin(k + i) * 0.1);
        for (let j = 0; j < 6; j++) circ(ctx, x - 8 + rnd(j + i * 7) * 16, y - 8 + rnd(j + i * 9) * 16, 2.4, '#ff9f1c');
      });
      if (st === 0) { ctx.save(); ctx.globalAlpha *= bump(f); chip(ctx, 'Nectar', FL[1][0], FL[1][1] - 78, 'orange', 23); ctx.restore(); }
      // The hive, cut open to show the honeycomb.
      ctx.fillStyle = '#c98a1a'; rounded(ctx, hx, hy, hw, hh, 40); ctx.fill();
      ctx.fillStyle = '#5a3a14'; rounded(ctx, hx + 14, hy + 14, hw - 28, hh - 28, 30); ctx.fill();
      const r = 22; const dx = r * Math.sqrt(3); const cols = 7; const rows = 9;
      ctx.save(); clipRound(ctx, hx + 14, hy + 14, hw - 28, hh - 28, 30);
      let n = 0;
      for (let rr = 0; rr < rows; rr++) for (let cc = 0; cc < cols; cc++) {
        const x = hx + 36 + cc * dx + (rr % 2) * dx / 2; const y = hy + 40 + rr * r * 1.5; n++;
        const old = rr < 3; const mine = rr >= 3 && rr < 7;
        const fillQ = old ? 1 : mine ? (st === 2 ? clamp(f * 1.6 - (n % 9) * 0.05) : st === 3 ? 1 : 0) : 0;
        const ripe = old ? 1 : mine ? (st === 3 ? smooth(f * 1.3) : 0) : 0;
        hexPath(ctx, x, y, r - 2); ctx.fillStyle = '#3a2408'; ctx.fill();
        if (fillQ > 0) { hexPath(ctx, x, y, (r - 4) * Math.sqrt(fillQ)); ctx.fillStyle = mix('#fff2a8', '#f59e0b', ripe); ctx.fill(); }
        if (old) { hexPath(ctx, x, y, r - 5); ctx.fillStyle = 'rgba(255,240,200,0.45)'; ctx.fill(); }
        hexPath(ctx, x, y, r - 1); ctx.strokeStyle = '#f0b429'; ctx.lineWidth = 2.5; ctx.stroke();
      }
      ctx.restore();
      oval(ctx, ent[0], ent[1], 12, 18, 0, '#1a1006');
      // Bees on the comb, fanning when it is time to dry the nectar.
      for (let j = 0; j < 2; j++) {
        const bx2 = hx + 110 + j * 110; const by2 = hy + hh - 70 - j * 120; const fan = st === 3;
        sc(ctx, bx2, by2, 0.95, () => beeShape(ctx, k + j, false, fan ? 60 : 12));
        if (fan) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; for (let m = 0; m < 3; m++) { const q = mod(k * 1.5 + m / 3, 1); ctx.beginPath(); ctx.arc(bx2 - 10, by2 - 30 - q * 40, 12 + q * 10, PI * 1.15, PI * 1.85); ctx.stroke(); } }
      }
      // Flying bees.
      for (let j = 0; j < 3; j++) {
        const p = along(k * 70 + j * BP.total / 3); const inside = p.i === 5 || p.i === 6 || ((p.i === 4 || p.i === 7) && Math.hypot(p.x - ent[0], p.y - ent[1]) < 16);
        if (inside) continue;
        ctx.save(); ctx.translate(p.x, p.y + Math.sin(k * 6 + j) * 4); if (p.dx < 0) ctx.scale(-1, 1);
        beeShape(ctx, k + j * 0.3, p.i >= 1 && p.i <= 4);
        ctx.restore();
        if (st === 1 && j === 0) { ctx.save(); ctx.globalAlpha *= bump(f); chip(ctx, 'Pollen', p.x, p.y + 44, 'yellow', 22); ctx.restore(); }
      }
      label(ctx, 'Honeycomb', hx + hw / 2, hy - 22, { size: 24, weight: 800, fill: 'yellow' });
      if (st === 3) { ctx.save(); ctx.globalAlpha *= bump(f); chip(ctx, 'Honey!', hx + hw / 2, hy + 120, 'yellow', 24); ctx.restore(); }
      chip(ctx, SAY[st], cx, Y1 - 50, COL[st], 22);
      ctx.restore();
    },

    // ─── Nature's changes ────────────────────────────────────────────────

    // A leaf through the year: the green fades in autumn, the hidden yellow
    // and orange show, some red is made, the leaf falls; a new one grows.
    'leaves-colour'(b, ctx, it, t) {
      const k = b.clock; const T = 15; const u = cycle(t, T, 0.6);
      const green = u < 3 ? 1 : u < 6.5 ? 1 - smooth((u - 3) / 3.5) : 0;
      const red = u < 5.5 ? 0 : smooth((u - 5.5) / 3);
      const fall = u < 8.5 ? 0 : clamp((u - 8.5) / 3);
      const grow = u < 12.3 ? 0 : smooth((u - 12.3) / 2.6);
      const st = u < 3 ? 0 : u < 5.5 ? 1 : u < 8.5 ? 2 : u < 11.5 ? 3 : 4;
      const SEASON = [['Summer', 'green'], ['Autumn', 'orange'], ['Autumn', 'orange'], ['Autumn', 'orange'], ['Winter, then spring', 'cyan']];
      const SAY = ['Summer: lots of green hides the yellow', 'Days get shorter: the green fades', 'Hidden yellow shows; some leaves make red', 'The tree lets the old leaf fall', 'In spring a new green leaf grows'];
      const bx = X0 + 250; const by = Y0 + 122; const gY = Y0 + 600;
      const bigLeaf = (x, y, ang, s, g, r) => {
        const L = 270 * s; const W = 170 * s;
        leaf(ctx, x, y, L, W, ang, mix('#ffc83d', '#ff9a2e', r * 0.6), null);
        if (g > 0.01) { ctx.save(); ctx.globalAlpha *= g; leaf(ctx, x, y, L, W, ang, '#2fb84f', null); ctx.restore(); }
        if (r > 0.01) { ctx.save(); ctx.globalAlpha *= r * 0.85; leaf(ctx, x, y, L, W, ang, '#d93a2b', null); ctx.restore(); }
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.strokeStyle = 'rgba(255,255,230,0.55)'; ctx.lineWidth = Math.max(1.5, 4 * s); ctx.lineCap = 'round'; ctx.beginPath();
        ctx.moveTo(-14 * s, 0); ctx.lineTo(L * 0.9, 0);
        for (let j = 1; j <= 4; j++) { const p = j * L * 0.18; ctx.moveTo(p, 0); ctx.lineTo(p + L * 0.12, -W * 0.3 * (1 - j * 0.12)); ctx.moveTo(p, 0); ctx.lineTo(p + L * 0.12, W * 0.3 * (1 - j * 0.12)); }
        ctx.stroke(); ctx.restore();
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Why leaves change colour');
      // Ground with old leaves.
      ctx.fillStyle = '#3b5d34'; rounded(ctx, X0 + 10, gY, 430, 30, 14); ctx.fill();
      for (let j = 0; j < 7; j++) leaf(ctx, X0 + 40 + j * 55, gY + 4, 36, 16, -0.3 + rnd(j) * 0.6 - (j % 2) * PI, ['#e8524a', '#ffb627', '#ff8a3d'][j % 3], null);
      // Branch.
      ctx.strokeStyle = '#7a5532'; ctx.lineCap = 'round'; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(X0 + 5, Y0 + 92); ctx.quadraticCurveTo(X0 + 220, Y0 + 100, X0 + 420, Y0 + 84); ctx.stroke();
      ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(bx - 10, Y0 + 98); ctx.lineTo(bx, by); ctx.stroke();
      const sway = Math.sin(k * 1.4) * 0.05;
      if (fall === 0) bigLeaf(bx, by, PI / 2 + sway, 1, green, red);
      else if (u < 13.8) {
        const q = smooth(fall); const lx = lerp(bx, X0 + 105, q) + Math.sin(fall * 8) * 60 * (1 - fall); const ly = lerp(by, gY - 22, q);
        const ang = lerp(PI / 2, -0.06, q) + Math.sin(fall * 9) * 0.5 * (1 - fall);
        ctx.save(); ctx.globalAlpha *= 1 - smooth((u - 12.8) / 1); bigLeaf(lx, ly, ang, 1, 0, red); ctx.restore();
      }
      if (grow > 0) { oval(ctx, bx, by + 6, 6, 9, 0, '#7cc95a'); bigLeaf(bx, by, PI / 2 + sway, grow, 1, 0); }
      else if (fall > 0) oval(ctx, bx, by + 4, 6, 9, 0, '#8d6e4f');
      // What colours are in the leaf.
      const g = grow > 0 ? 1 : fall > 0 ? 0 : green; const rr = grow > 0 ? 0 : red;
      const ROWS = [['Green', 'chlorophyll', '#2fb84f', g], ['Yellow and orange', 'there all along', '#ffb627', 1], ['Red', 'made by some trees', '#e8452c', rr]];
      const rx = X0 + 470;
      chip(ctx, SEASON[st][0], X1 - 165, Y0 + 92, SEASON[st][1], 26);
      ROWS.forEach(([n, sub, c, v], i) => {
        const y = Y0 + 190 + i * 125;
        circ(ctx, rx + 22, y - 14, 18, c);
        label(ctx, n, rx + 52, y - 26, { size: 24, weight: 800, fill: c, align: 'left' });
        label(ctx, sub, rx + 52, y + 2, { size: 22, weight: 600, fill: 'muted', align: 'left' });
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; rounded(ctx, rx + 4, y + 26, 300, 18, 9); ctx.fill();
        if (v > 0.01) { ctx.fillStyle = c; rounded(ctx, rx + 4, y + 26, Math.max(18, 300 * v), 18, 9); ctx.fill(); }
      });
      chip(ctx, SAY[st], cx, Y1 - 34, SEASON[st][1], 22);
      ctx.restore();
    },

    // Starlight wobbles through moving air, so a star twinkles; a planet's
    // wider light averages out and shines steadily.
    'star-twinkle'(b, ctx, it, t) {
      const k = b.clock; const Lx = X0 + 200; const Rx = X0 + 600; const topY = Y0 + 92; const a0 = Y0 + 170; const a1 = Y0 + 410; const eyeY = Y0 + 520;
      const wob = (y, ph) => { const q = clamp((y - a0) / (a1 - a0)); return (Math.sin(k * 2.3 + y / 37 + ph) * 0.6 + Math.sin(k * 3.7 - y / 23 + ph * 1.7) * 0.4) * 22 * q; };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Why stars twinkle');
      scene(ctx, X0 + 10, Y0 + 50, FIG.w - 20, FIG.h - 120, '#070d2e', '#1a2558');
      for (let j = 0; j < 16; j++) { const x = X0 + 30 + rnd(j) * (FIG.w - 60); const y = Y0 + 62 + rnd(j + 30) * 80; if (Math.abs(x - Lx) < 70 || Math.abs(x - Rx) < 90) continue; circ(ctx, x, y, 1.8, 'rgba(255,250,220,0.6)'); }
      // Moving air.
      for (let j = 0; j < 5; j++) {
        const y = a0 + (j + 0.5) * (a1 - a0) / 5; ctx.strokeStyle = `rgba(120,210,255,${0.13 + 0.05 * (j % 2)})`; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.beginPath();
        for (let x = X0 + 30; x <= X1 - 30; x += 20) { const yy = y + Math.sin(x / 55 + k * (1.2 + j * 0.35) + j) * 10; if (x === X0 + 30) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
        ctx.stroke();
      }
      for (let j = 0; j < 4; j++) { const q = mod(k * 0.25 + j / 4, 1); const y = a0 + 20 + j * 55; const x = X0 + 330 + q * 140; arr(ctx, x, y, x + 40, y, `rgba(160,225,255,${0.7 * Math.sin(q * PI)})`, 3); }
      label(ctx, 'Moving air', cx, (a0 + a1) / 2 + 6, { size: 26, weight: 800, fill: '#9fe3ff' });
      // The star: one tiny point of light.
      const end = wob(a1, 0) * 2.4; const bright = clamp(1 - Math.abs(end) / 30);
      ctx.strokeStyle = '#fff1a8'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(Lx, topY + 16);
      for (let y = a0; y <= a1; y += 8) ctx.lineTo(Lx + wob(y, 0), y);
      ctx.lineTo(Lx + end, eyeY - 18); ctx.stroke();
      starPath(ctx, Lx, topY, 22, 5, 4); ctx.fillStyle = '#fff6c8'; ctx.fill(); circ(ctx, Lx, topY, 5, '#ffffff');
      label(ctx, 'Star', Lx - 36, topY - 4, { size: 26, weight: 800, fill: 'yellow', align: 'right' });
      label(ctx, 'a tiny dot', Lx - 36, topY + 32, { size: 22, weight: 600, fill: 'muted', align: 'right' });
      // The planet: a small disc, many rays.
      for (let j = 0; j < 5; j++) {
        const off = (j - 2) * 9; ctx.strokeStyle = 'rgba(255,214,160,0.75)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(Rx + off, topY + 22);
        for (let y = a0; y <= a1; y += 8) ctx.lineTo(Rx + off + wob(y, j * 1.9), y);
        ctx.lineTo(Rx + off * 0.3, eyeY - 18); ctx.stroke();
      }
      ctx.save(); circ(ctx, Rx, topY, 24, '#e8b07a'); ctx.clip(); ctx.fillStyle = '#c47a45'; ctx.fillRect(Rx - 30, topY - 10, 60, 6); ctx.fillRect(Rx - 30, topY + 6, 60, 5); ctx.restore();
      label(ctx, 'Planet', Rx + 38, topY - 4, { size: 26, weight: 800, fill: 'orange', align: 'left' });
      label(ctx, 'a tiny disc', Rx + 38, topY + 32, { size: 22, weight: 600, fill: 'muted', align: 'left' });
      // Your eyes and what you see.
      for (const x of [Lx, Rx]) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - 34, eyeY); ctx.quadraticCurveTo(x, eyeY - 30, x + 34, eyeY); ctx.quadraticCurveTo(x, eyeY + 30, x - 34, eyeY); ctx.fill(); circ(ctx, x, eyeY, 12, '#4f8cff'); circ(ctx, x, eyeY, 6, PUPIL); circ(ctx, x - 4, eyeY - 4, 2.5, '#ffffff'); }
      const sz = 10 + 16 * bright;
      circ(ctx, Lx - 70, eyeY + 80, sz * 1.6, `rgba(255,240,170,${0.15 * bright})`); starPath(ctx, Lx - 70, eyeY + 80, sz, sz * 0.3, 4); ctx.fillStyle = `rgba(255,246,200,${0.35 + 0.65 * bright})`; ctx.fill();
      label(ctx, 'Twinkles!', Lx - 40, eyeY + 80, { size: 26, weight: 800, fill: 'yellow', align: 'left' });
      circ(ctx, Rx - 92, eyeY + 80, 16, '#e8b07a');
      label(ctx, 'Shines steadily', Rx - 66, eyeY + 80, { size: 26, weight: 800, fill: 'orange', align: 'left' });
      chip(ctx, 'Moving air bends starlight this way and that', cx, Y1 - 28, 'cyan', 22);
      ctx.restore();
    },

    // Warm air rises and cools; water vapour turns into droplets on specks
    // of dust; the droplets make a cloud, then join and fall as rain.
    'clouds-form'(b, ctx, it, t) {
      const k = b.clock; const P = 2.8; const u = cycle(t, P * 5, 0.6); const st = Math.floor(u / P) % 5; const f = (u - st * P) / P;
      const SAY = ['The Sun warms the ground and the air', 'Warm air rises up', 'High up, the air gets colder', 'Water vapour turns into droplets on dust', 'Droplets join, get heavy and fall as rain'];
      const COL = ['orange', 'red', 'cyan', 'blue', 'blue'];
      const gy = Y1 - 150; const cY = Y0 + 178; const cX = cx - 10;
      const cloudQ = st < 3 ? 0 : st === 3 ? smooth(f / 0.8) : 1;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'How clouds form');
      // Thermometer of the air.
      const tb = ctx.createLinearGradient(0, Y0 + 100, 0, gy - 20); tb.addColorStop(0, '#5fd3ff'); tb.addColorStop(1, '#ff7a45');
      ctx.fillStyle = tb; rounded(ctx, X0 + 28, Y0 + 100, 24, gy - Y0 - 120, 12); ctx.fill();
      label(ctx, 'Cold', X0 + 64, Y0 + 116, { size: 24, weight: 800, fill: 'cyan', align: 'left' });
      label(ctx, 'Warm', X0 + 64, gy - 34, { size: 24, weight: 800, fill: 'orange', align: 'left' });
      sun(ctx, X1 - 85, Y0 + 92, 38, k);
      // Ground and a lake.
      ctx.fillStyle = '#3c7d4a'; rounded(ctx, X0 + 10, gy, FIG.w - 20, 72, 18); ctx.fill();
      oval(ctx, X0 + 640, gy + 32, 110, 20, 0, '#2f80ed');
      if (st === 0 || st === 1) {
        ctx.save(); ctx.globalAlpha *= st === 0 ? bump(f) : 0.4;
        ctx.strokeStyle = '#ffb36b'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        for (let j = 0; j < 6; j++) { const x = X0 + 160 + j * 95; const q = mod(k * 0.6 + j * 0.3, 1); ctx.beginPath(); for (let m = 0; m <= 8; m++) { const y = gy - 6 - q * 40 - m * 6; const xx = x + Math.sin(m + k * 5) * 5; if (m) ctx.lineTo(xx, y); else ctx.moveTo(xx, y); } ctx.stroke(); }
        ctx.restore();
      }
      // Rising bubbles of air, warm at the bottom and cold at the top.
      for (let j = 0; j < 5; j++) {
        const q = mod(k * 0.17 + j / 5, 1); const y = lerp(gy - 30, cY + 70, q); const x = cx - 130 + j * 62 + Math.sin(q * 6 + j) * 12; const r = 24 + q * 8;
        ctx.save(); ctx.globalAlpha *= (st === 4 ? 0.3 : 0.9) * Math.sin(q * PI) * after(t, 0.4);
        const c = mix('#ff9f43', '#5fd3ff', q); circ(ctx, x, y, r, null, c, 4); ctx.save(); ctx.globalAlpha *= 0.3; circ(ctx, x, y, r - 2, c); ctx.restore();
        head(ctx, x, y - 6, -PI / 2, 9, '#ffffff'); line(ctx, x, y, x, y + 12, '#ffffff', 3);
        for (let m = 0; m < 3; m++) circ(ctx, x + Math.cos(m * 2.1 + k) * r * 0.6, y + Math.sin(m * 2.1 + k) * r * 0.6, 3, '#9fd8ff');
        ctx.restore();
      }
      if (st === 2) { ctx.save(); ctx.globalAlpha *= bump(f); chip(ctx, 'Colder up here', cx + 200, cY + 80, 'cyan', 22); ctx.restore(); }
      // The cloud and the rain.
      if (st === 4) for (let j = 0; j < 18; j++) { const x = cX - 95 + rnd(j) * 190; const y = cY + 50 + mod(rnd(j + 7) * 400 + k * 300, gy - cY - 60); drop(ctx, x, y, 5, '#7cc4ff'); }
      if (cloudQ > 0) {
        const s = 1.55 * (st === 3 ? outBack(cloudQ) : 1); const c = st === 4 ? '#aeb8ca' : '#eef2ff';
        cloud(ctx, cX, cY, s, c);
        if (st === 3) for (let j = 0; j < 14; j++) circ(ctx, cX - 70 + rnd(j) * 140, cY - 20 + rnd(j + 3) * 50, 3, 'rgba(90,170,255,0.8)');
        dotEyes(ctx, cX, cY + 2, 30, 4); smile(ctx, cX, cY + 16, 8, PUPIL, 3);
      }
      // Close-up of one droplet forming on a speck of dust.
      if (st >= 2) {
        const mx = X1 - 112; const my = Y0 + 370; const R = 80; const a = st === 2 ? smooth(f / 0.5) : 1;
        ctx.save(); ctx.globalAlpha *= a;
        line(ctx, mx - R * 0.7, my - R * 0.7, cX + 110, cY + 30, 'rgba(200,215,255,0.5)', 2, [6, 6]);
        circ(ctx, mx, my, R, '#0b1232', '#cfe0ff', 5); line(ctx, mx + R * 0.7, my + R * 0.7, mx + R * 1.05, my + R * 1.05, '#cfe0ff', 9);
        ctx.save(); ctx.beginPath(); ctx.arc(mx, my, R - 3, 0, TAU); ctx.clip();
        const grow = st === 2 ? 0 : st === 3 ? smooth(f) : 1;
        if (grow > 0) { circ(ctx, mx, my, 12 + 34 * grow, 'rgba(90,170,255,0.55)'); circ(ctx, mx - 10 * grow, my - 12 * grow, 6 * grow, 'rgba(255,255,255,0.6)'); }
        ctx.fillStyle = '#a8763e'; poly(ctx, [mx - 9, my - 6, mx + 2, my - 11, mx + 10, my - 3, mx + 7, my + 8, mx - 6, my + 9]); ctx.fill();
        for (let j = 0; j < 9; j++) { const q = mod(k * 0.5 + rnd(j), 1); const a2 = j * 0.7 + k * 0.3; const d = lerp(R - 8, 14 + 30 * grow, q); circ(ctx, mx + Math.cos(a2) * d, my + Math.sin(a2) * d, 4, '#7cc4ff'); }
        ctx.restore();
        label(ctx, 'Dust + water', mx, my + R + 32, { size: 22, weight: 700, fill: 'ink' });
        label(ctx, '= a droplet', mx, my + R + 60, { size: 22, weight: 700, fill: '#7cc4ff' });
        ctx.restore();
      }
      chip(ctx, SAY[st], cx, Y1 - 34, COL[st], 22);
      ctx.restore();
    },

    // ─── Sorting and comparing ───────────────────────────────────────────

    // A bottle, a can, a newspaper, a banana peel, a box and an apple core
    // each drop into the right bin.
    'recycling-sort'(b, ctx, it, t) {
      const k = b.clock;
      const BINS = [['Plastic', '#fbbf24'], ['Metal', '#a9b8cc'], ['Paper', '#6f9bff'], ['Compost', '#34d399']];
      const ITEMS = [['Bottle', 0], ['Can', 1], ['Newspaper', 2], ['Banana peel', 3], ['Box', 2], ['Apple core', 3]];
      const D = 2.5; const u = cycle(t, D * ITEMS.length + 0.8, 0.6); const n = Math.floor(u / D); const f = (u - n * D) / D;
      const bw = 150; const bTop = Y0 + 405; const bH = 195; const bxs = [0, 1, 2, 3].map((j) => X0 + 110 + j * 193);
      const sx = cx; const sy = Y0 + 185;
      const DRAWI = [
        () => { ctx.fillStyle = 'rgba(127,211,255,0.85)'; rounded(ctx, -17, -20, 34, 58, 10); ctx.fill(); ctx.fillRect(-8, -34, 16, 16); ctx.fillStyle = '#fb7185'; rounded(ctx, -10, -44, 20, 11, 3); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(-17, 0, 34, 14); },
        () => { ctx.fillStyle = '#d5dce6'; ctx.fillRect(-20, -28, 40, 58); oval(ctx, 0, -28, 20, 6, 0, '#eef2f7'); oval(ctx, 0, 30, 20, 6, 0, '#b8c2d0'); ctx.fillStyle = '#fb7185'; ctx.fillRect(-20, -12, 40, 22); circ(ctx, 0, -1, 6, '#ffffff'); },
        () => { ctx.fillStyle = '#f1f1f1'; ctx.fillRect(-34, -26, 68, 52); ctx.fillStyle = '#3b3f55'; ctx.fillRect(-28, -20, 56, 9); ctx.fillStyle = '#9aa3b8'; for (let j = 0; j < 4; j++) { ctx.fillRect(-28, -4 + j * 7, 26, 3); ctx.fillRect(2, -4 + j * 7, 26, 3); } },
        () => { ctx.fillStyle = '#ffd23f'; for (const a of [-0.9, 0, 0.9]) { ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(-6, 10); ctx.quadraticCurveTo(-14, -14, 0, -34); ctx.quadraticCurveTo(14, -14, 6, 10); ctx.fill(); ctx.restore(); } oval(ctx, 0, 14, 10, 12, 0, '#f0c020'); ctx.fillStyle = '#6b4a2e'; ctx.fillRect(-4, 22, 8, 10); },
        () => { ctx.fillStyle = '#d9a56a'; poly(ctx, [-30, -16, -14, -30, 34, -30, 18, -16]); ctx.fill(); ctx.fillStyle = '#c8955a'; ctx.fillRect(-30, -16, 48, 44); ctx.fillStyle = '#a8763e'; poly(ctx, [18, -16, 34, -30, 34, 14, 18, 28]); ctx.fill(); ctx.fillStyle = '#e9d3a6'; ctx.fillRect(-12, -16, 10, 44); },
        () => { ctx.fillStyle = '#e8524a'; ctx.beginPath(); ctx.ellipse(0, -22, 22, 12, 0, PI, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, 24, 22, 12, 0, 0, PI); ctx.fill(); ctx.fillStyle = '#fff1d6'; ctx.beginPath(); ctx.moveTo(-20, -22); ctx.quadraticCurveTo(-6, 0, -20, 24); ctx.lineTo(20, 24); ctx.quadraticCurveTo(6, 0, 20, -22); ctx.closePath(); ctx.fill(); oval(ctx, -4, 0, 3, 5, 0, '#5a3a24'); oval(ctx, 4, 2, 3, 5, 0, '#5a3a24'); line(ctx, 0, -32, 3, -44, '#6b4a2e', 4); },
      ];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Sort the recycling');
      const cur = n < ITEMS.length ? ITEMS[n] : null;
      BINS.forEach(([name, c], j) => {
        const x = bxs[j]; const hit = cur && cur[1] === j && f > 0.58 ? (f - 0.58) / 0.42 : -1;
        const open = cur && cur[1] === j && f > 0.25 && f < 0.62 ? smooth((f - 0.25) / 0.12) : 0;
        const wob = hit >= 0 ? Math.sin(hit * 16) * (1 - hit) * 0.07 : 0;
        ctx.save(); ctx.translate(x, bTop + bH); ctx.rotate(wob);
        ctx.fillStyle = c; poly(ctx, [-bw / 2 + 6, -bH + 22, bw / 2 - 6, -bH + 22, bw / 2 - 18, 0, -bw / 2 + 18, 0]); ctx.fill();
        ctx.save(); ctx.translate(-bw / 2, -bH + 10); ctx.rotate(-0.5 * open); ctx.fillStyle = mix(c, '#1a1630', 0.25); rounded(ctx, 0, -12, bw, 24, 10); ctx.fill(); ctx.restore();
        eyes(ctx, 0, -bH + 66, 40, 10, k, j, cur ? (bxs[cur[1]] - x) / 400 : 0);
        smile(ctx, 0, -bH + 98, 12, DARKTEXT, 3, hit >= 0 ? 1 : 0);
        label(ctx, name, 0, -42, { size: 24, weight: 800, fill: DARKTEXT });
        ctx.restore();
        if (hit >= 0) tick(ctx, x, bTop - 48, 46 * outBack(clamp(hit / 0.4)), 'green');
      });
      if (cur) {
        const [name, j] = cur; const appear = outBack(clamp(f / 0.18)); const fly = smooth((f - 0.25) / 0.33);
        const x = lerp(sx, bxs[j], fly); const y = lerp(sy + Math.sin(k * 3) * 6 * (1 - fly), bTop + 6, fly) - Math.sin(fly * PI) * 80;
        if (f < 0.58) sc(ctx, x, y, appear * (1.25 - 0.45 * fly), () => { ctx.rotate(fly * 3); DRAWI[n](); });
        if (f < 0.58) chip(ctx, name, sx, Y0 + 92, 'ink', 26);
        chip(ctx, f < 0.58 ? 'Which bin?' : `${name} goes in ${BINS[j][0]}`, cx, Y1 - 40, f < 0.58 ? 'muted' : BINS[j][1], 23);
      } else chip(ctx, 'All sorted!', cx, Y1 - 40, 'green', 23);
      ctx.restore();
    },

    // Big and small, hot and cold, fast and slow, up and down, full and
    // empty, day and night, side by side.
    opposites(b, ctx, it, t) {
      const k = b.clock; const P = 3.4;
      const PAIRS = [['Big', 'Small', 'orange', 'yellow'], ['Hot', 'Cold', 'red', 'cyan'], ['Fast', 'Slow', 'red', 'green'], ['Up', 'Down', 'purple', 'blue'], ['Full', 'Empty', 'orange', 'muted'], ['Day', 'Night', 'yellow', '#9fb4ff']];
      const u = cycle(t, P * 6, 0.5); const i = Math.floor(u / P) % 6; const f = (u - i * P) / P;
      const alpha = smooth(f / 0.1) * smooth((1 - f) / 0.07);
      const pw = 372; const ph = 390; const py = Y0 + 58; const PX = [X0 + 18, X0 + 410];
      const glass = (x, y, full) => {
        if (full) { ctx.save(); ctx.beginPath(); ctx.moveTo(x - 58, y - 90); ctx.lineTo(x + 58, y - 90); ctx.lineTo(x + 46, y + 100); ctx.lineTo(x - 46, y + 100); ctx.closePath(); ctx.clip(); ctx.fillStyle = '#ffa733'; ctx.beginPath(); ctx.moveTo(x - 70, y + 110); for (let xx = -70; xx <= 70; xx += 10) ctx.lineTo(x + xx, y - 72 + Math.sin(xx / 14 + k * 4) * 4); ctx.lineTo(x + 70, y + 110); ctx.closePath(); ctx.fill(); for (let j = 0; j < 5; j++) circ(ctx, x - 30 + rnd(j) * 60, y + 90 - mod(rnd(j + 3) * 180 + k * 40, 160), 4, 'rgba(255,255,255,0.5)'); ctx.restore(); }
        ctx.strokeStyle = 'rgba(220,240,255,0.9)'; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - 58, y - 90); ctx.lineTo(x - 46, y + 100); ctx.lineTo(x + 46, y + 100); ctx.lineTo(x + 58, y - 90); ctx.stroke();
        line(ctx, x - 36, y - 60, x - 30, y + 60, 'rgba(255,255,255,0.35)', 5);
      };
      const thermo = (x, y, lvl, c) => { ctx.fillStyle = 'rgba(255,255,255,0.9)'; rounded(ctx, x - 9, y - 80, 18, 100, 9); ctx.fill(); circ(ctx, x, y + 26, 16, 'rgba(255,255,255,0.9)'); circ(ctx, x, y + 26, 11, c); ctx.fillStyle = color(c); rounded(ctx, x - 4, y + 18 - 92 * lvl, 8, 92 * lvl, 4); ctx.fill(); };
      const SC = [
        [(x, y) => { const sq = Math.abs(Math.sin(k * 2.5)); circ(ctx, x, y + 40 - sq * 14, 118, '#ff9f43'); eyes(ctx, x, y + 10 - sq * 14, 70, 18, k, 1); smile(ctx, x, y + 64 - sq * 14, 30, PUPIL, 5); cheeks(ctx, x, y + 50 - sq * 14, 130, 14); },
          (x, y) => { const hop = Math.abs(Math.sin(k * 4)) * 60; circ(ctx, x, y + 126 - hop, 30, '#ffd23f'); eyes(ctx, x, y + 118 - hop, 22, 6, k, 2); smile(ctx, x, y + 134 - hop, 8, PUPIL, 3); }],
        [(x, y) => { thermo(x + 120, y - 30, 0.92, '#fb7185'); ctx.fillStyle = '#e8524a'; rounded(ctx, x - 90, y - 20, 140, 130, 24); ctx.fill(); ctx.strokeStyle = '#e8524a'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(x + 52, y + 44, 30, -PI / 2, PI / 2); ctx.stroke(); oval(ctx, x - 20, y - 20, 70, 10, 0, '#6b3b1f'); eyes(ctx, x - 20, y + 36, 40, 9, k, 3); smile(ctx, x - 20, y + 68, 12, PUPIL, 3); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; for (let j = 0; j < 3; j++) { const q = mod(k * 0.6 + j / 3, 1); ctx.strokeStyle = `rgba(255,255,255,${0.7 * Math.sin(q * PI)})`; ctx.beginPath(); for (let m = 0; m <= 8; m++) { const yy = y - 40 - q * 60 - m * 8; const xx = x - 50 + j * 30 + Math.sin(m * 0.9 + k * 3) * 7; if (m) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); } ctx.stroke(); } },
          (x, y) => { thermo(x + 120, y - 30, 0.12, '#5fd3ff'); const sh = Math.sin(k * 30) * 2; ctx.fillStyle = 'rgba(190,235,255,0.92)'; rounded(ctx, x - 80 + sh, y - 30, 140, 140, 26); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; rounded(ctx, x - 64 + sh, y - 16, 36, 20, 8); ctx.fill(); eyes(ctx, x - 10 + sh, y + 30, 44, 10, k, 4); ctx.strokeStyle = PUPIL; ctx.lineWidth = 3; ctx.beginPath(); for (let m = 0; m <= 6; m++) ctx.lineTo(x - 30 + sh + m * 7, y + 66 + (m % 2) * 5); ctx.stroke(); for (let j = 0; j < 6; j++) snowflake(ctx, x - 140 + rnd(j) * 220, y - 150 + mod(rnd(j + 5) * 300 + k * 40, 300), 8, '#ffffff', k); }],
        [(x, y) => { const cxp = x - 230 + mod(k * 420, 460); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(cxp - 70 - j * 10, y + 50 + j * 20); ctx.lineTo(cxp - 140 - j * 10, y + 50 + j * 20); ctx.stroke(); } ctx.fillStyle = '#fb7185'; rounded(ctx, cxp - 62, y + 40, 124, 46, 14); ctx.fill(); rounded(ctx, cxp - 34, y + 12, 66, 36, 12); ctx.fill(); ctx.fillStyle = '#bfe6ff'; rounded(ctx, cxp - 24, y + 18, 22, 22, 5); ctx.fill(); rounded(ctx, cxp + 4, y + 18, 22, 22, 5); ctx.fill(); for (const w of [-34, 34]) { circ(ctx, cxp + w, y + 88, 16, '#2a2140'); circ(ctx, cxp + w, y + 88, 6, '#c7d0dc'); } line(ctx, x - 170, y + 106, x + 170, y + 106, 'rgba(255,255,255,0.3)', 3); },
          (x, y) => { const sxp = x - 110 + mod(k * 14, 220); line(ctx, x - 170, y + 106, x + 170, y + 106, 'rgba(255,255,255,0.3)', 3); ctx.fillStyle = '#9be58a'; ctx.beginPath(); ctx.moveTo(sxp - 60, y + 104); ctx.quadraticCurveTo(sxp, y + 92, sxp + 56, y + 104); ctx.closePath(); ctx.fill(); circ(ctx, sxp + 50, y + 82, 16, '#9be58a'); line(ctx, sxp + 46, y + 70, sxp + 40, y + 44, '#9be58a', 4); line(ctx, sxp + 56, y + 70, sxp + 62, y + 44, '#9be58a', 4); circ(ctx, sxp + 40, y + 44, 5, PUPIL); circ(ctx, sxp + 62, y + 44, 5, PUPIL); ctx.fillStyle = '#c98a5a'; ctx.beginPath(); ctx.arc(sxp - 8, y + 70, 38, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8a5a34'; ctx.lineWidth = 5; ctx.beginPath(); for (let m = 0; m < 40; m++) { const a = m * 0.42; const r = 32 - m * 0.75; ctx.lineTo(sxp - 8 + Math.cos(a) * r, y + 70 + Math.sin(a) * r); } ctx.stroke(); smile(ctx, sxp + 52, y + 90, 5, PUPIL, 2); }],
        [(x, y) => { const q = mod(k * 0.3, 1); const by = y + 140 - q * 300; ctx.save(); ctx.globalAlpha *= Math.sin(q * PI); line(ctx, x, by + 52, x + Math.sin(k * 3) * 8, by + 120, 'rgba(255,255,255,0.8)', 2); oval(ctx, x, by, 44, 54, 0, '#a78bfa'); ctx.fillStyle = '#a78bfa'; poly(ctx, [x - 8, by + 56, x + 8, by + 56, x, by + 46]); ctx.fill(); dotEyes(ctx, x, by - 6, 22, 4.5); smile(ctx, x, by + 14, 10, PUPIL, 3); ctx.restore(); arr(ctx, x - 120, y + 80, x - 120, y - 80, 'purple', 8); },
          (x, y) => { const q = mod(k * 0.55, 1); const yy = y - 140 + 250 * Math.min(1, (q / 0.6) ** 2) - (q > 0.6 ? Math.sin(((q - 0.6) / 0.4) * PI) * 50 : 0); circ(ctx, x, yy, 34, '#5b8cff'); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, yy, 34, -0.8, 0.8); ctx.stroke(); ctx.beginPath(); ctx.arc(x, yy, 34, PI - 0.8, PI + 0.8); ctx.stroke(); line(ctx, x - 170, y + 145, x + 170, y + 145, 'rgba(255,255,255,0.3)', 3); arr(ctx, x + 120, y - 80, x + 120, y + 80, 'blue', 8); }],
        [(x, y) => glass(x, y, true), (x, y) => glass(x, y, false)],
        [(x, y) => { sun(ctx, x, y - 20, 70, k); cloud(ctx, x - 100 + Math.sin(k * 0.5) * 20, y + 120, 0.8, '#ffffff'); },
          (x, y) => { circ(ctx, x, y - 20, 70, '#f4f1de'); circ(ctx, x + 30, y - 40, 62, '#16204f'); for (let j = 0; j < 12; j++) { ctx.fillStyle = `rgba(255,248,210,${0.4 + 0.6 * Math.abs(Math.sin(k * 2 + j))})`; starPath(ctx, x - 160 + rnd(j) * 320, y - 170 + rnd(j + 9) * 330, 7, 2.6, 5); ctx.fill(); } }],
      ];
      const BG = [null, null, null, null, null, [['#5ec8ff', '#bdeeff'], ['#0a1238', '#1f2c62']]];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Opposites');
      ctx.save(); ctx.globalAlpha *= alpha;
      for (let s = 0; s < 2; s++) {
        const x = PX[s]; const c = PAIRS[i][2 + s];
        if (BG[i]) scene(ctx, x, py, pw, ph, BG[i][s][0], BG[i][s][1], 24); else { ctx.fillStyle = tint(c === 'muted' ? 'blue' : c, 0.08); rounded(ctx, x, py, pw, ph, 24); ctx.fill(); }
        ctx.strokeStyle = color(c); ctx.lineWidth = 3; rounded(ctx, x, py, pw, ph, 24); ctx.stroke();
        ctx.save(); clipRound(ctx, x, py, pw, ph, 24); sc(ctx, x + pw / 2, py + ph / 2, 0.9 + 0.1 * outBack(clamp(f / 0.25)), () => SC[i][s](0, 0)); ctx.restore();
        label(ctx, PAIRS[i][s], x + pw / 2, py + ph + 50, { size: 42, weight: 800, fill: c });
      }
      ctx.strokeStyle = color('ink'); ctx.lineWidth = 5; line(ctx, cx - 26, py + ph + 50, cx + 26, py + ph + 50, 'ink', 5); head(ctx, cx - 36, py + ph + 50, PI, 13, 'ink'); head(ctx, cx + 36, py + ph + 50, 0, 13, 'ink');
      ctx.restore();
      for (let j = 0; j < 6; j++) circ(ctx, cx + (j - 2.5) * 34, py + ph + 112, j === i ? 9 : 6, j === i ? 'yellow' : 'rgba(200,215,255,0.35)');
      chip(ctx, `${PAIRS[i][0]} is the opposite of ${PAIRS[i][1].toLowerCase()}`, cx, Y1 - 34, 'ink', 23);
      ctx.restore();
    },

    // The seven days of the week with today moving along, and the twelve
    // months round a wheel coloured by season.
    'calendar-weeks'(b, ctx, it, t) {
      const k = b.clock; const south = /south/i.test(String(it.hemisphere || ''));
      const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const SEAS = [['Winter', '#7cc4ff'], ['Spring', '#34d399'], ['Summer', '#fbbf24'], ['Autumn', '#ff9f43']];
      const seasonOf = (m) => (Math.floor(((m + 1) % 12) / 3) + (south ? 2 : 0)) % 4;
      const day = Math.floor(Math.max(0, t - 0.5) / 1.1) % 7; const mq = Math.max(0, t - 0.8) / 1.3; const mon = Math.floor(mq) % 12; const mf = mq - Math.floor(mq);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Days, weeks and months');
      // The week.
      const dw = 100; const dg = 8; const dx0 = cx - (7 * dw + 6 * dg) / 2; const dy = Y0 + 82;
      DAYS.forEach((d, j) => {
        const x = dx0 + j * (dw + dg); const on = j === day; const wk = j >= 5; const p = pop(t, 0.1 + j * 0.08); const lift = on ? 6 : 0;
        ctx.save(); ctx.globalAlpha *= clamp(p * 2);
        ctx.fillStyle = on ? color(wk ? 'orange' : 'cyan') : wk ? tint('orange', 0.18) : tint('blue', 0.16); rounded(ctx, x, dy - 26 - lift, dw, 52, 16); ctx.fill();
        label(ctx, d, x + dw / 2, dy - lift, { size: 24, weight: 800, fill: on ? DARKTEXT : wk ? 'orange' : 'ink' });
        ctx.restore();
      });
      const tx = dx0 + day * (dw + dg) + dw / 2;
      label(ctx, 'Today', tx, dy + 46, { size: 22, weight: 800, fill: 'yellow' });
      label(ctx, '7 days = 1 week', cx, dy + 92, { size: 24, weight: 700, fill: 'muted' });
      // The year wheel.
      const wx = cx; const wy = Y0 + 440; const R1 = 180; const R0 = 106;
      for (let m = 0; m < 12; m++) {
        const a0 = -PI / 2 + (m - 0.5) * (TAU / 12); const a1 = a0 + TAU / 12; const am = (a0 + a1) / 2; const on = m === mon;
        const off = on ? 10 * Math.sin(Math.min(1, mf * 4) * PI / 2) : 0; const ox = Math.cos(am) * off; const oy = Math.sin(am) * off;
        const c = SEAS[seasonOf(m)][1]; const p = after(t, 0.4 + m * 0.05);
        ctx.save(); ctx.globalAlpha *= p;
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(wx + ox, wy + oy, R1, a0 + 0.012, a1 - 0.012); ctx.arc(wx + ox, wy + oy, R0, a1 - 0.012, a0 + 0.012, true); ctx.closePath(); ctx.fill();
        if (!on) { ctx.fillStyle = 'rgba(5,8,22,0.25)'; ctx.fill(); } else { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke(); }
        label(ctx, MON[m], wx + ox + Math.cos(am) * (R0 + R1) / 2, wy + oy + Math.sin(am) * (R0 + R1) / 2, { size: on ? 24 : 22, weight: 800, fill: DARKTEXT });
        ctx.restore();
      }
      // A little sun runs round the year.
      const aS = -PI / 2 + (mq % 12) * (TAU / 12); sun(ctx, wx + Math.cos(aS) * (R1 + 22), wy + Math.sin(aS) * (R1 + 22), 11, k, false);
      label(ctx, '12 months', wx, wy - 14, { size: 30, weight: 800, fill: 'ink' });
      label(ctx, '= 1 year', wx, wy + 22, { size: 24, weight: 700, fill: 'muted' });
      const SL = [[wx, wy - R1 - 46, 'center'], [wx + R1 + 40, wy, 'left'], [wx, wy + R1 + 46, 'center'], [wx - R1 - 40, wy, 'right']];
      for (let q = 0; q < 4; q++) { const si = (q + (south ? 2 : 0)) % 4; const on = seasonOf(mon) === si; label(ctx, SEAS[si][0], SL[q][0], SL[q][1], { size: on ? 26 : 23, weight: 800, fill: on ? SEAS[si][1] : tint('ink', 0.55), align: SL[q][2] }); }
      label(ctx, south ? 'Seasons in the south' : 'Seasons in the north', X1 - 16, Y1 - 18, { size: 22, weight: 600, fill: 'muted', align: 'right' });
      ctx.restore();
    },

    // Wood, a stone, an apple, a coin, a ball and a key dropped into water:
    // some float, some sink.
    'floating-sinking'(b, ctx, it, t) {
      const k = b.clock;
      const OBJ = [['Wood', true, 17, 2], ['Stone', false, 22], ['Apple', true, 26, 8], ['Coin', false, 22], ['Ball', true, 28, -10], ['Key', false, 13]];
      const tl = X0 + 25; const tr = X1 - 25; const top = Y0 + 95; const rim = Y0 + 238; const wy = Y0 + 290; const bot = Y0 + 545;
      const T = 11.5; const u = cycle(t, T, 0.3); const out = 1 - smooth((u - (T - 0.7)) / 0.6);
      const xs = OBJ.map((_, i) => tl + 62 + i * 125);
      const DRAW = [
        () => { ctx.fillStyle = '#c8955a'; rounded(ctx, -34, -17, 68, 34, 6); ctx.fill(); ctx.strokeStyle = '#9a6a38'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-26, -6); ctx.quadraticCurveTo(0, -12, 26, -4); ctx.moveTo(-26, 6); ctx.quadraticCurveTo(0, 0, 26, 8); ctx.stroke(); },
        () => { ctx.fillStyle = '#8a8fa3'; ctx.beginPath(); ctx.moveTo(-30, 6); ctx.quadraticCurveTo(-28, -20, -2, -22); ctx.quadraticCurveTo(30, -20, 30, 4); ctx.quadraticCurveTo(26, 22, 0, 22); ctx.quadraticCurveTo(-28, 22, -30, 6); ctx.fill(); circ(ctx, -10, -8, 4, '#a3a8bb'); circ(ctx, 10, 6, 3, '#6f7488'); },
        () => { circ(ctx, 0, 2, 26, '#e8524a'); circ(ctx, -9, -6, 6, 'rgba(255,255,255,0.35)'); line(ctx, 0, -22, 3, -34, '#6b4a2e', 4); leaf(ctx, 3, -30, 18, 8, -0.4, '#3fbf5f', null); },
        () => { circ(ctx, 0, 0, 22, '#f0b429'); circ(ctx, 0, 0, 16, null, '#c98a1a', 3); label(ctx, '1', 0, 1, { size: 22, weight: 800, fill: '#a86d10' }); },
        () => { circ(ctx, 0, 0, 28, '#ffffff'); ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 28, 0, TAU); ctx.clip(); ['#fb7185', '#fbbf24', '#5b8cff'].forEach((c, j) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 30, j * 2.1 + k * 0.5, j * 2.1 + 1.05 + k * 0.5); ctx.closePath(); ctx.fill(); }); ctx.restore(); circ(ctx, 0, 0, 6, '#ffffff'); },
        () => { ctx.strokeStyle = '#f0b429'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(-18, 0, 11, 0, TAU); ctx.stroke(); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(30, 0); ctx.moveTo(22, 0); ctx.lineTo(22, 9); ctx.moveTo(30, 0); ctx.lineTo(30, 10); ctx.stroke(); },
      ];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Floating and sinking');
      // Tank.
      ctx.fillStyle = 'rgba(200,225,255,0.05)'; rounded(ctx, tl, rim, tr - tl, bot - rim + 12, 18); ctx.fill();
      const pos = OBJ.map(([, floats, h, depth], i) => {
        const tau = u - (0.5 + i * 1.3); const x = xs[i];
        if (tau < 0) return { x, y: top + Math.sin(k * 2 + i) * 4, s: -1 };
        if (tau < 0.45) return { x, y: top + (wy - top) * (tau / 0.45) ** 2, s: -1 };
        const s = tau - 0.45;
        if (floats) return { x, y: wy + depth + 22 * Math.exp(-3 * s) * Math.cos(6 * s), s };
        return { x: x + Math.sin(s * 5) * 4 * (1 - clamp(s / 1.3)), y: lerp(wy + 10, bot - h, smooth(s / 1.4)), s };
      });
      pos.forEach((p, i) => { ctx.save(); ctx.globalAlpha *= out; sc(ctx, p.x, p.y, 1, DRAW[i]); ctx.restore(); });
      // Water over the objects.
      ctx.save(); rounded(ctx, tl, rim, tr - tl, bot - rim + 12, 18); ctx.clip();
      ctx.fillStyle = 'rgba(60,150,255,0.38)'; ctx.beginPath(); ctx.moveTo(tl, bot + 20);
      for (let x = tl; x <= tr; x += 12) ctx.lineTo(x, wy + Math.sin(x / 28 + k * 2) * 3);
      ctx.lineTo(tr, bot + 20); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(200,235,255,0.9)'; ctx.lineWidth = 3; ctx.beginPath();
      for (let x = tl; x <= tr; x += 12) { const y = wy + Math.sin(x / 28 + k * 2) * 3; if (x === tl) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke(); ctx.restore();
      ctx.strokeStyle = 'rgba(210,230,255,0.75)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tl, rim); ctx.lineTo(tl, bot - 6); ctx.quadraticCurveTo(tl, bot + 12, tl + 18, bot + 12); ctx.lineTo(tr - 18, bot + 12); ctx.quadraticCurveTo(tr, bot + 12, tr, bot - 6); ctx.lineTo(tr, rim); ctx.stroke();
      // Splashes, names and results.
      pos.forEach((p, i) => {
        if (p.s >= 0 && p.s < 0.8) { const q = p.s / 0.8; oval(ctx, xs[i], wy, 12 + 46 * q, 4 + 10 * q, 0, null, `rgba(220,240,255,${1 - q})`, 3); for (let j = 0; j < 4; j++) { const a = -PI / 2 + (j - 1.5) * 0.5; drop(ctx, xs[i] + Math.cos(a) * 60 * q, wy - Math.sin(-a) * 50 * q + 120 * q * q, 4, `rgba(160,210,255,${1 - q})`); } }
        const [name, floats] = OBJ[i];
        label(ctx, name, xs[i], bot + 46, { size: 24, weight: 800, fill: 'ink' });
        if (p.s > 0.7) { ctx.save(); ctx.globalAlpha *= out * after(p.s, 0.7); label(ctx, floats ? 'floats' : 'sinks', xs[i], bot + 76, { size: 22, weight: 800, fill: floats ? 'green' : 'red' }); ctx.restore(); }
      });
      chip(ctx, 'Light for their size: float. Heavy for their size: sink.', cx, Y1 - 24, 'cyan', 22);
      ctx.restore();
    },

    // Sunlight enters a raindrop, bends and splits into seven colours, and
    // comes back out; a rainbow arcs across the rain with the Sun behind you.
    rainbow(b, ctx, it, t) {
      const k = b.clock;
      const RB = [['Red', '#ff4d4d'], ['Orange', '#ff9f1c'], ['Yellow', '#ffe14d'], ['Green', '#3ddc84'], ['Blue', '#4d8bff'], ['Indigo', '#6a5cff'], ['Violet', '#b26bff']];
      const px = X0 + 10; const py = Y0 + 50; const pw = FIG.w - 20; const ph = 300; const gy = py + ph - 46;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'How a rainbow forms');
      // The sky scene.
      ctx.save(); scene(ctx, px, py, pw, ph, '#5aa9e0', '#c4e4f7', 22); clipRound(ctx, px, py, pw, ph, 22);
      cloud(ctx, X1 - 105, py + 52, 1.0, '#8d9ab3'); cloud(ctx, X1 - 200, py + 40, 0.8, '#a3aec4');
      ctx.strokeStyle = 'rgba(120,150,200,0.55)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let j = 0; j < 16; j++) { const x = X1 - 250 + rnd(j) * 220; const y = py + 80 + mod(rnd(j + 5) * 200 + k * 220, gy - py - 80); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 12); }
      ctx.stroke();
      const rcx = X0 + 525; const sweep = after(t, 0.5, 1.4);
      RB.forEach(([, c], j) => { ctx.strokeStyle = c; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(rcx, gy, 200 - j * 9, PI, PI + PI * sweep); ctx.stroke(); });
      ctx.fillStyle = '#3c8d4f'; ctx.fillRect(px, gy, pw, ph);
      sun(ctx, X0 + 62, py + 58, 30, k);
      for (let j = 0; j < 2; j++) { ctx.setLineDash([10, 10]); ctx.lineDashOffset = -k * 30; line(ctx, X0 + 100, py + 80 + j * 40, X0 + 290, py + 150 + j * 50, 'rgba(255,240,160,0.9)', 3); ctx.setLineDash([]); head(ctx, X0 + 296, py + 152 + j * 50, Math.atan2(70 + j * 10, 190), 10, 'rgba(255,240,160,0.9)'); }
      kid(ctx, X0 + 175, gy + 10, 96, '#fb7185', k, false, true);
      ctx.restore();
      label(ctx, 'Sun behind you', X0 + 114, py + 38, { size: 22, weight: 800, fill: DARKTEXT, align: 'left' });
      // Inside one raindrop.
      const dx = X0 + 470; const dy = Y0 + 528; const R = 102;
      const yE = dy - R * 0.55; const xE = dx - Math.sqrt(R * R - (R * 0.55) ** 2);
      circ(ctx, dx, dy, R, 'rgba(120,190,255,0.22)', 'rgba(170,215,255,0.85)', 4);
      circ(ctx, dx - 40, dy - 44, 14, 'rgba(255,255,255,0.35)');
      ctx.save(); ctx.setLineDash([16, 10]); ctx.lineDashOffset = -k * 50; line(ctx, X0 + 20, yE, xE, yE, '#ffffff', 6); ctx.restore();
      RB.forEach(([, c], j) => {
        const a = after(t, 1 + j * 0.1, 0.4); if (a <= 0) return;
        const bA = 0.08 - j * 0.05; const xA = 2.05 + j * 0.035;
        const Bx = dx + R * Math.cos(bA); const By = dy + R * Math.sin(bA); const Xx = dx + R * Math.cos(xA); const Xy = dy + R * Math.sin(xA);
        const out = (52 - j * 3.3) * PI / 180; const L = 92 * a;
        ctx.strokeStyle = c; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(xE, yE); ctx.lineTo(Bx, By); ctx.lineTo(Xx, Xy); ctx.lineTo(Xx - Math.cos(out) * L, Xy + Math.sin(out) * L); ctx.stroke();
      });
      label(ctx, 'Sunlight', X0 + 22, yE - 26, { size: 24, weight: 800, fill: 'ink', align: 'left' });
      label(ctx, 'Raindrop', dx + R + 16, dy - R + 6, { size: 24, weight: 800, fill: '#9fd0ff', align: 'left' });
      ['It bends and', 'splits into', '7 colours'].forEach((s, j) => label(ctx, s, X0 + 22, Y0 + 585 + j * 30, { size: 22, weight: 700, fill: j === 2 ? 'yellow' : 'ink', align: 'left' }));
      RB.forEach(([n, c], j) => { ctx.save(); ctx.globalAlpha *= after(t, 1.2 + j * 0.1); circ(ctx, X1 - 128, Y0 + 470 + j * 30, 8, c); label(ctx, n, X1 - 112, Y0 + 471 + j * 30, { size: 22, weight: 700, fill: c, align: 'left' }); ctx.restore(); });
      ctx.restore();
    },

    // The Sun crosses the sky: a tree's shadow is long in the morning,
    // short at midday and long the other way in the evening.
    shadows(b, ctx, it, t) {
      const k = b.clock; const T = val(it.period, 13); const u = mod(t / T + 0.03, 1);
      const day = clamp(u / 0.93); const al = 0.16 + day * (PI - 0.32); const fadeN = smooth((u - 0.93) / 0.035) * (1 - smooth((u - 0.965) / 0.035));
      const gy = Y0 + 512; const Rx = 330; const Ry = 330;
      const sx = cx - Rx * Math.cos(al); const sy = gy - Ry * Math.sin(al); const lowSun = 1 - smooth(Math.sin(al) / 0.55);
      const hour = 6 + 12 * (al - 0.16) / (PI - 0.32); const hh = Math.round(hour);
      const part = hour < 10.5 ? ['Morning', 'Morning: a long shadow'] : hour < 13.5 ? ['Midday', 'Midday: a short shadow'] : hour < 16 ? ['Afternoon', 'Afternoon: the shadow grows again'] : ['Evening', 'Evening: a long shadow, the other way'];
      const Lf = clamp(Math.cos(al) / Math.max(Math.sin(al), 0.2), -1.3, 1.3);
      const tree = (trunk, leafC) => {
        ctx.fillStyle = trunk; ctx.fillRect(-14, -125, 28, 125);
        ctx.fillStyle = leafC; ctx.beginPath(); for (const [x, y, r] of [[0, -178, 62], [-46, -140, 44], [46, -140, 44]]) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); } ctx.fill();
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Shadows through the day');
      ctx.save(); scene(ctx, X0 + 10, Y0 + 50, FIG.w - 20, gy - Y0 - 30, mix('#4fb8f5', '#ff8f5a', lowSun * 0.85), mix('#c4ecff', '#ffd59a', lowSun), 22);
      ctx.fillStyle = `rgba(5,8,30,${0.6 * fadeN})`; rounded(ctx, X0 + 10, Y0 + 50, FIG.w - 20, gy - Y0 - 30, 22); ctx.fill(); ctx.restore();
      ctx.save(); ctx.setLineDash([8, 12]); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, gy, Rx, Ry, 0, PI + 0.16, TAU - 0.16); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.globalAlpha *= 1 - fadeN; sun(ctx, sx, sy, 32, k); ctx.restore();
      // Ground.
      ctx.fillStyle = '#3c8d4f'; rounded(ctx, X0 + 10, gy - 6, FIG.w - 20, Y1 - 60 - gy, 18); ctx.fill();
      // The shadow, then the tree.
      ctx.save(); ctx.globalAlpha *= (1 - fadeN) * after(t, 0.3); ctx.transform(1, 0, Lf, 0.12, cx, gy + 4); ctx.scale(1, -1); tree('rgba(10,30,20,0.55)', 'rgba(10,30,20,0.55)'); ctx.restore();
      ctx.save(); ctx.translate(cx, gy); tree('#8d6e4f', '#2e9e48'); ctx.restore();
      circ(ctx, cx - 18, gy - 190, 7, '#e8524a'); circ(ctx, cx + 24, gy - 160, 7, '#e8524a'); circ(ctx, cx - 40, gy - 135, 7, '#e8524a');
      label(ctx, 'Sunrise', X0 + 26, gy + 48, { size: 22, weight: 700, fill: '#e8ffe8', align: 'left' });
      label(ctx, 'Sunset', X1 - 26, gy + 48, { size: 22, weight: 700, fill: '#e8ffe8', align: 'right' });
      const tip = cx + Lf * 237;
      if (Math.abs(tip - cx) > 30) arr(ctx, cx, gy + 80, tip, gy + 80, 'yellow', 5); else { line(ctx, cx - 30, gy + 80, cx + 30, gy + 80, 'yellow', 5); }
      label(ctx, Math.abs(Lf) > 0.6 ? 'Long shadow' : 'Short shadow', cx + Math.sign(Lf || 1) * Math.max(80, Math.abs(tip - cx) / 2) * (Math.abs(Lf) > 0.6 ? 1 : 0), gy + 108, { size: 23, weight: 800, fill: 'yellow' });
      chip(ctx, `${hh > 12 ? hh - 12 : hh} ${hh >= 12 ? 'pm' : 'am'}  ·  ${part[0]}`, X0 + 130, Y0 + 88, 'ink', 24);
      chip(ctx, part[1], cx, Y1 - 26, 'yellow', 22);
      ctx.restore();
    },

    // A magnet sweeps over a paper clip, a nail, wood, plastic and a copper
    // coin; then poles: different poles pull, the same poles push.
    'magnets-kids'(b, ctx, it, t) {
      const k = b.clock; const T = 9; const u = cycle(t, T, 0.5);
      const ITEMS = [['Paper clip', true], ['Nail', true], ['Wood', false], ['Plastic', false], ['Copper coin', false]];
      const xs = ITEMS.map((_, i) => X0 + 105 + i * 150); const restY = Y0 + 290; const tipY = Y0 + 172;
      const mx = lerp(X0 + 40, X1 - 40, smooth(clamp(u / 7.2)) * 0.15 + clamp(u / 7.2) * 0.85); 
      const DRAW = [
        () => { ctx.strokeStyle = '#d5dce6'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-6, 22); ctx.lineTo(-6, -16); ctx.arc(0, -16, 6, PI, 0); ctx.lineTo(6, 16); ctx.arc(0, 16, 10, 0, PI); ctx.lineTo(-10, -20); ctx.arc(0, -20, 10, PI, 0); ctx.lineTo(10, 10); ctx.stroke(); },
        () => { ctx.fillStyle = '#9aa3b8'; ctx.fillRect(-4, -22, 8, 40); poly(ctx, [-4, 18, 4, 18, 0, 30]); ctx.fill(); ctx.fillRect(-12, -28, 24, 7); },
        () => { ctx.fillStyle = '#c8955a'; rounded(ctx, -28, -20, 56, 40, 6); ctx.fill(); ctx.strokeStyle = '#9a6a38'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-20, -6); ctx.quadraticCurveTo(0, -12, 20, -4); ctx.moveTo(-20, 8); ctx.quadraticCurveTo(0, 2, 20, 10); ctx.stroke(); },
        () => { ctx.fillStyle = '#fb7185'; rounded(ctx, -30, -12, 60, 32, 5); ctx.fill(); for (let j = 0; j < 3; j++) { rounded(ctx, -24 + j * 18, -22, 12, 12, 3); ctx.fill(); } },
        () => { circ(ctx, 0, 0, 22, '#d9824a'); circ(ctx, 0, 0, 16, null, '#a85a2a', 3); label(ctx, '2', 0, 1, { size: 22, weight: 800, fill: '#7a3a14' }); },
      ];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Magnets');
      line(ctx, X0 + 20, restY + 34, X1 - 20, restY + 34, '#8d6e4f', 6);
      ITEMS.forEach(([name, mag], i) => {
        const x = xs[i]; const near = clamp(1 - Math.abs(mx - x) / 60);
        let px = x; let py = restY; let a = 1;
        if (mag) {
          const lift = u < 8.1 ? smooth((mx - (x - 70)) / 45) : 0;
          const sx = mx + (i === 0 ? -24 : 24); const sy = tipY + 30;
          px = lerp(x, sx, lift); py = lerp(restY, sy, lift);
          a = u < 8.1 ? (lift > 0.5 ? 1 - smooth((u - 7.7) / 0.4) : 1) : smooth((u - 8.1) / 0.6);
          if (lift > 0.05 && lift < 0.95) { ctx.strokeStyle = 'rgba(255,220,120,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(px, py - 24); ctx.lineTo(sx, tipY + 4); ctx.stroke(); ctx.setLineDash([]); }
        } else py += Math.sin(k * 20) * 1.5 * near;
        ctx.save(); ctx.globalAlpha *= a; sc(ctx, px, py, 1.15, DRAW[i]); ctx.restore();
        label(ctx, name, x, restY + 64, { size: 22, weight: 700, fill: 'ink' });
        const done = mx > x + 30 && u < 8.4;
        if (done) { const p = outBack(clamp((mx - x - 30) / 40)); if (mag) tick(ctx, x, restY + 100, 34 * p, 'green'); else cross(ctx, x, restY + 100, 30 * p, 'red'); }
      });
      // The horseshoe magnet.
      ctx.save(); ctx.globalAlpha *= smooth(u / 0.4) * (1 - smooth((u - 8.4) / 0.5)); ctx.translate(mx, tipY);
      ctx.lineCap = 'butt'; ctx.strokeStyle = '#e8524a'; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(-26, -24); ctx.lineTo(-26, -66); ctx.arc(0, -66, 26, PI, 0); ctx.lineTo(26, -24); ctx.stroke();
      ctx.fillStyle = '#dfe5ee'; ctx.fillRect(-39, -24, 26, 24); ctx.fillRect(13, -24, 26, 24);
      label(ctx, 'N', -26, -46, { size: 22, weight: 800, fill: '#ffffff' }); label(ctx, 'S', 26, -46, { size: 22, weight: 800, fill: '#ffffff' });
      ctx.restore();
      chip(ctx, 'Magnets pull things made of iron or steel', cx, Y0 + 428, 'cyan', 22);
      // Poles.
      const bar = (x, left, right, w = 140, h = 44) => { const y = 0; ctx.fillStyle = left === 'N' ? '#fb7185' : '#5b8cff'; rounded(ctx, x, y - h / 2, w / 2, h, [10, 0, 0, 10]); ctx.fill(); ctx.fillStyle = right === 'N' ? '#fb7185' : '#5b8cff'; rounded(ctx, x + w / 2, y - h / 2, w / 2, h, [0, 10, 10, 0]); ctx.fill(); label(ctx, left, x + w / 4, y + 1, { size: 24, weight: 800, fill: '#ffffff' }); label(ctx, right, x + (3 * w) / 4, y + 1, { size: 24, weight: 800, fill: '#ffffff' }); };
      const q = mod(k / 4, 1);
      const pull = q < 0.45 ? 160 * (1 - (q / 0.45) ** 2) : q < 0.85 ? 0 : 160 * smooth((q - 0.85) / 0.15);
      const push = q < 0.4 ? lerp(4, 160, easeOut(q / 0.4)) : q < 0.75 ? 160 : lerp(160, 4, smooth((q - 0.75) / 0.25));
      const rows = [[Y0 + 482, 'Different poles pull together', 'green', pull, ['N', 'S', 'N', 'S'], 'Pull!'], [Y0 + 590, 'The same poles push apart', 'orange', push, ['N', 'S', 'S', 'N'], 'Push!']];
      rows.forEach(([y, text, c, gap, P, word], r) => {
        label(ctx, text, X0 + 20, y, { size: 24, weight: 800, fill: c, align: 'left' });
        const my = y + 50;
        ctx.save(); ctx.translate(0, my); bar(cx - gap / 2 - 140, P[0], P[1]); bar(cx + gap / 2, P[2], P[3]); ctx.restore();
        if (gap > 40) { if (r === 0) { arr(ctx, cx - gap / 2 + 6, my, cx - 8, my, c, 4); arr(ctx, cx + gap / 2 - 6, my, cx + 8, my, c, 4); } else { arr(ctx, cx - 8, my, cx - gap / 2 + 4, my, c, 4); arr(ctx, cx + 8, my, cx + gap / 2 - 4, my, c, 4); } }
        const show = r === 0 ? (gap < 6 ? 1 : 0) : (q < 0.4 ? 1 - q / 0.4 : 0);
        if (show > 0) { ctx.save(); ctx.globalAlpha *= show; label(ctx, word, X1 - 70, my, { size: 26, weight: 800, fill: c }); ctx.restore(); }
      });
      ctx.restore();
    },

    // The Moon going round the Earth, lit by the Sun on one side, and how
    // much of its bright half we see from Earth: the eight phases.
    'moon-phases'(b, ctx, it, t) {
      const k = b.clock; const T = val(it.period, 16); const u = mod(t / T, 1); const e = TAU * u; const south = /south/i.test(String(it.hemisphere || ''));
      const NAMES = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
      const idx = Math.round(u * 8) % 8;
      const phase = (x, y, r, el) => {
        circ(ctx, x, y, r, '#2a3157');
        const c = Math.cos(el); const wax = mod(el, TAU) < PI; const rx = Math.max(0.01, r * Math.abs(c));
        ctx.save(); ctx.translate(x, y); if (south) ctx.scale(-1, 1);
        ctx.fillStyle = '#f4f1de'; ctx.beginPath();
        if (wax) { ctx.arc(0, 0, r, -PI / 2, PI / 2); ctx.ellipse(0, 0, rx, r, 0, PI / 2, c > 0 ? -PI / 2 : PI * 1.5, c > 0); }
        else { ctx.arc(0, 0, r, PI / 2, PI * 1.5); ctx.ellipse(0, 0, rx, r, 0, PI * 1.5, c > 0 ? PI / 2 : PI * 2.5, c > 0); }
        ctx.closePath(); if (c < 0.999) ctx.fill();
        ctx.restore();
        circ(ctx, x, y, r, null, 'rgba(240,240,220,0.35)', 2);
      };
      const ex = X0 + 270; const ey = Y0 + 320; const R = 152;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Phases of the Moon');
      label(ctx, 'Sunlight', X0 + 14, Y0 + 70, { size: 24, weight: 800, fill: 'yellow', align: 'left' });
      for (let j = -2; j <= 2; j++) { const y = ey + j * 70; ctx.save(); ctx.setLineDash([10, 8]); ctx.lineDashOffset = -k * 30; line(ctx, X0 + 12, y, X0 + 62, y, '#ffd23f', 4); ctx.restore(); head(ctx, X0 + 72, y, 0, 11, '#ffd23f'); }
      ctx.save(); ctx.setLineDash([6, 10]); ctx.strokeStyle = 'rgba(200,215,255,0.4)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(ex, ey, R, 0, TAU); ctx.stroke(); ctx.restore();
      globe(ctx, ex, ey, 46, -k * 0.6);
      ctx.save(); ctx.beginPath(); ctx.arc(ex, ey, 46.5, 0, TAU); ctx.clip(); ctx.fillStyle = 'rgba(6,8,30,0.6)'; ctx.fillRect(ex, ey - 48, 48, 96); ctx.restore();
      label(ctx, 'Earth', ex, ey + 70, { size: 22, weight: 700, fill: 'muted' });
      const phi = PI - e; const mxp = ex + R * Math.cos(phi); const myp = ey + R * Math.sin(phi);
      circ(ctx, mxp, myp, 24, '#2a3157'); ctx.fillStyle = '#f4f1de'; ctx.beginPath(); ctx.arc(mxp, myp, 24, PI / 2, PI * 1.5); ctx.closePath(); ctx.fill();
      label(ctx, 'Moon', mxp - Math.cos(phi) * 52, myp - Math.sin(phi) * 46, { size: 22, weight: 700, fill: 'ink' });
      // What we see from Earth.
      const vx = X1 - 150; const vy = Y0 + 255;
      label(ctx, 'From Earth we see:', vx, Y0 + 138, { size: 22, weight: 700, fill: 'muted' });
      circ(ctx, vx, vy, 92, 'rgba(244,241,222,0.06)');
      phase(vx, vy, 80, e);
      chip(ctx, NAMES[idx], vx, Y0 + 372, 'yellow', 23);
      label(ctx, `Day ${Math.max(1, Math.round(u * 29.5))} of about 29`, vx, Y0 + 420, { size: 22, weight: 600, fill: 'muted' });
      for (let j = 0; j < 8; j++) { const x = cx + (j - 3.5) * 92; const y = Y0 + 562; if (j === idx) circ(ctx, x, y, 37, null, 'yellow', 4); phase(x, y, 28, (j / 8) * TAU); }
      chip(ctx, 'The Moon goes round the Earth in about a month', cx, Y1 - 30, 'cyan', 22);
      ctx.restore();
    },
  };
}
