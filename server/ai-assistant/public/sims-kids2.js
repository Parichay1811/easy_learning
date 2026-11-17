// Simulations for young children (about 4 to 10), part two: nature and
// science. Little animals (a chick hatching, an insect's body, a spider's
// web, an ant colony, a whale breathing, animals hiding), plants (how seeds
// travel), the stuff around us (water's three states, snowflakes, pushes
// and pulls, sound), space (the planets, a trip to the Moon) and the Earth's
// big moments (earthquakes, tornadoes, fossils, habitats). Bright, round,
// friendly drawings made with canvas paths, gentle bouncy motion, few big
// words. Each is a function of time (t since it appeared, b.clock for the
// loop), so any moment can be drawn: plain canvas calls, no glow, no state
// between frames. KIDS2_SIMS says what each one is for, so a lesson's words
// can pick the right picture.

export const KIDS2_SIMS = {
  'chick-hatching': { title: 'How a chick hatches', keywords: ['how chicks hatch', 'chick hatching', 'hatching from an egg', 'life cycle of a chicken', 'chicken life cycle', 'egg tooth', 'hen sits on her eggs', 'how long for an egg to hatch'], example: {} },
  'insect-body': { title: 'Parts of an insect', keywords: ['parts of an insect', 'insect body parts', 'head thorax abdomen', 'insects have six legs', 'insect antennae', 'spiders are not insects', 'how many legs does an insect have', 'arachnid'], example: {} },
  'spider-web': { title: 'How a spider spins a web', keywords: ['how spiders spin webs', 'how do spiders make webs', 'spider silk', 'orb web', 'spinnerets', 'sticky spiral', 'spider catches a fly'], example: {} },
  'ant-colony': { title: 'Inside an ant colony', keywords: ['ant colony', 'inside an anthill', 'queen ant', 'worker ants', 'ant nest', 'how ants live', 'ant tunnels'], example: {} },
  'seed-dispersal': { title: 'How seeds travel', keywords: ['seed dispersal', 'how seeds travel', 'how seeds spread', 'dandelion seeds', 'seeds carried by the wind', 'seeds carried by animals', 'burrs stick to fur', 'pea pods pop'], example: {} },
  'states-of-water-kids': { title: 'Ice, water and steam', keywords: ['states of water', 'solid liquid gas', 'ice melts', 'water boils', 'water turns to steam', 'melting and freezing', 'states of matter for kids', 'steam turns back into water'], example: {} },
  snowflake: { title: 'How a snowflake grows', keywords: ['snowflakes', 'how snowflakes form', 'snowflake shape', 'six-sided snowflake', 'no two snowflakes are alike', 'snow crystal', 'ice crystals in clouds'], example: {} },
  'push-pull': { title: 'Pushes and pulls', keywords: ['push and pull', 'pushes and pulls', 'forces for kids', 'what is a force', 'push or pull', 'forces make things move'], example: {} },
  'sound-vibrations-kids': { title: 'Sound is a vibration', keywords: ['sound vibrations', 'how sound travels', 'sound waves for kids', 'what makes sound', 'loud and quiet sounds', 'vibrations make sound', 'how we hear sounds'], example: {} },
  'planets-parade': { title: 'The eight planets', keywords: ['planets in order', 'the eight planets', 'order of the planets', 'names of the planets', 'my very easy method', 'biggest planet', 'planets of the solar system', 'jupiter is the biggest planet'], example: {} },
  'rocket-to-moon': { title: 'A trip to the Moon', keywords: ['trip to the moon', 'going to the moon', 'moon landing', 'apollo 11', 'astronauts on the moon', 'rocket launch', 'footprints on the moon', 'how long to get to the moon'], example: {} },
  'habitats-compare': { title: 'Animals fit their homes', keywords: ['different habitats', 'animal adaptations', 'desert animals', 'arctic animals', 'rainforest animals', 'how animals adapt', 'camel hump', 'polar bear fur'], example: {} },
  'camouflage-hunt': { title: 'Animals that hide', keywords: ['camouflage', 'animal camouflage', 'how animals hide', 'chameleon changes colour', 'chameleon changes color', 'stick insect', 'arctic hare', 'flatfish'], example: {} },
  'earthquake-shake': { title: 'Why the ground shakes', keywords: ['earthquake', 'earthquakes', 'what causes earthquakes', 'tectonic plates', 'drop cover and hold on', 'earthquake safety', 'plates of the earth move'], example: {} },
  tornado: { title: 'How a tornado forms', keywords: ['tornado', 'tornadoes', 'how tornadoes form', 'twister', 'funnel cloud', 'tornado safety', 'spinning column of air'], example: {} },
  'fossil-dig': { title: 'How fossils form', keywords: ['fossils', 'how fossils form', 'palaeontologist', 'paleontologist', 'dinosaur fossils', 'dinosaur bones', 'fossil dig', 'bones turn to stone'], example: {} },
  'whale-breathing': { title: 'How whales breathe', keywords: ['how whales breathe', 'whale blowhole', 'blowhole', 'whales are mammals', 'whale spout', 'gills and lungs', 'fish breathe with gills'], example: {} },
};

export function kids2Sims(kit) {
  const { FIG, FONT, label, rounded, arrow, clamp, easeOut, outBack, color, tint } = kit;
  const X0 = FIG.x; const Y0 = FIG.y; const X1 = FIG.x + FIG.w; const Y1 = FIG.y + FIG.h;
  const cx = X0 + FIG.w / 2;
  const TAU = Math.PI * 2; const PI = Math.PI;
  const SKIN = '#f6c9a0'; const PUPIL = '#1a1630'; const HAIR = '#5a3a24'; const DARKTEXT = '#1a1630';

  // Small tools: numbers, timing, loops.
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
    ctx.fillStyle = 'rgba(5,8,22,0.82)'; ctx.strokeStyle = tint(c, 0.6); ctx.lineWidth = 2;
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
  // One eye (for side views), blinking now and then.
  function eye1(ctx, x, y, r, k = 0, seed = 0, look = 0) {
    const bl = mod(k + seed * 1.37, 4.1) < 0.13;
    if (bl) { line(ctx, x - r, y, x + r, y, PUPIL, Math.max(2, r * 0.35)); return; }
    circ(ctx, x, y, r, '#ffffff'); circ(ctx, x + look * r * 0.3, y + r * 0.08, r * 0.6, PUPIL); circ(ctx, x + look * r * 0.3 - r * 0.22, y - r * 0.16, r * 0.22, '#ffffff');
  }
  function dotEyes(ctx, x, y, gap, r, c = PUPIL) { circ(ctx, x - gap / 2, y, r, c); circ(ctx, x + gap / 2, y, r, c); }
  function smile(ctx, x, y, w, c = PUPIL, lw = 3) {
    ctx.strokeStyle = color(c); ctx.lineWidth = lw; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y - w * 0.3, w, 0.2 * PI, 0.8 * PI); ctx.stroke();
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
  // A leaf from its base (x, y), pointing along ang.
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
  // A child, feet at gy, h tall. Limb angles are directions measured from
  // straight down (0 = down, +PI/2 = towards +x, PI = up). Returns the hands.
  function kid(ctx, x, gy, h, shirt = '#5b8cff', o = {}) {
    const u = h / 100; const { legL = -0.08, legR = 0.08, armL = -0.35, armR = 0.35, back = false, hair = HAIR } = o;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3b4a7a'; ctx.lineWidth = 9 * u; ctx.beginPath();
    const feet = [];
    for (const [hx, a] of [[-6, legL], [6, legR]]) { const fx = x + hx * u + Math.sin(a) * 31 * u; const fy = gy - 34 * u + Math.cos(a) * 31 * u; ctx.moveTo(x + hx * u, gy - 34 * u); ctx.lineTo(fx, fy); feet.push([fx, fy]); }
    ctx.stroke();
    for (const [fx, fy] of feet) oval(ctx, fx + 2 * u, fy + 1 * u, 7 * u, 4.5 * u, 0, '#2a2140');
    ctx.fillStyle = color(shirt); rounded(ctx, x - 15 * u, gy - 64 * u, 30 * u, 36 * u, 10 * u); ctx.fill();
    ctx.strokeStyle = SKIN; ctx.lineWidth = 7 * u; ctx.beginPath();
    const hands = [];
    for (const [sx, a] of [[-12, armL], [12, armR]]) { const hx2 = x + sx * u + Math.sin(a) * 25 * u; const hy2 = gy - 58 * u + Math.cos(a) * 25 * u; ctx.moveTo(x + sx * u, gy - 58 * u); ctx.lineTo(hx2, hy2); hands.push([hx2, hy2]); }
    ctx.stroke();
    circ(ctx, x, gy - 80 * u, 17 * u, SKIN);
    ctx.fillStyle = color(hair); ctx.beginPath();
    if (back) ctx.arc(x, gy - 81 * u, 17.5 * u, PI * 0.95, PI * 2.05);
    else ctx.arc(x, gy - 83 * u, 17 * u, PI * 1.05, PI * 1.95);
    ctx.fill();
    if (!back) { dotEyes(ctx, x, gy - 80 * u, 12 * u, 2.2 * u); smile(ctx, x, gy - 72 * u, 5 * u, PUPIL, 2 * u); }
    return hands;
  }
  // A rounded scene panel with a top-to-bottom gradient.
  function scene(ctx, x, y, w, h, top, bottom, r = 22) {
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, color(top)); g.addColorStop(1, color(bottom));
    ctx.fillStyle = g; rounded(ctx, x, y, w, h, r); ctx.fill();
  }
  function clipRound(ctx, x, y, w, h, r = 22) { rounded(ctx, x, y, w, h, r); ctx.clip(); }
  // A card: soft fill, and a coloured rim when it is the one in focus.
  function card(ctx, x, y, w, h, c, on, r = 18) {
    ctx.fillStyle = on ? tint(c, 0.16) : 'rgba(255,255,255,0.045)'; ctx.strokeStyle = on ? color(c) : 'rgba(140,170,255,0.25)'; ctx.lineWidth = on ? 3 : 1.5;
    rounded(ctx, x, y, w, h, r); ctx.fill(); ctx.stroke();
  }
  // A row of step pills, the active one lit.
  function steps(ctx, names, cols, active, y, w = 170, gap = 186) {
    const n = names.length;
    names.forEach((nm, j) => {
      const x = cx + (j - (n - 1) / 2) * gap; const on = j === active;
      ctx.fillStyle = on ? tint(cols[j], 0.22) : 'rgba(255,255,255,0.05)';
      ctx.strokeStyle = on ? color(cols[j]) : 'rgba(140,170,255,0.25)'; ctx.lineWidth = on ? 3 : 1.5;
      rounded(ctx, x - w / 2, y - 22, w, 44, 22); ctx.fill(); ctx.stroke();
      label(ctx, nm, x, y + 1, { size: 22, weight: on ? 800 : 600, fill: on ? cols[j] : 'muted' });
    });
  }
  // A point along a polyline (flat [x0, y0, x1, y1, ...]) at distance s, with its heading.
  function along(pts, s) {
    for (let i = 0; i + 3 < pts.length; i += 2) {
      const dx = pts[i + 2] - pts[i]; const dy = pts[i + 3] - pts[i + 1]; const L = Math.hypot(dx, dy);
      if (s <= L || i + 4 >= pts.length) { const q = L ? clamp(s / L) : 0; return { x: pts[i] + dx * q, y: pts[i + 1] + dy * q, dx, dy }; }
      s -= L;
    }
    return { x: pts[0], y: pts[1], dx: 1, dy: 0 };
  }
  function pathLen(pts) { let L = 0; for (let i = 0; i + 3 < pts.length; i += 2) L += Math.hypot(pts[i + 2] - pts[i], pts[i + 3] - pts[i + 1]); return L; }
  // Puts the origin at (x, y) facing along (dx, dy), never upside down.
  function face(ctx, x, y, dx, dy) {
    ctx.translate(x, y);
    if (dx < -0.001) { ctx.scale(-1, 1); ctx.rotate(Math.atan2(dy, -dx)); } else ctx.rotate(Math.atan2(dy, Math.max(dx, 0.0001)));
  }

  // A raindrop: (x, y) is the centre of its round bottom.
  function drop(ctx, x, y, r, fill) {
    ctx.fillStyle = color(fill); ctx.beginPath(); ctx.moveTo(x, y - r * 2.1);
    ctx.bezierCurveTo(x + r * 0.35, y - r * 1.2, x + r, y - r * 0.6, x + r, y);
    ctx.arc(x, y, r, 0, PI);
    ctx.bezierCurveTo(x - r, y - r * 0.6, x - r * 0.35, y - r * 1.2, x, y - r * 2.1); ctx.fill();
  }
  // A small filled pentagon in the current fill (football patches).
  function hexDot(ctx, x, y, r) { ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = -PI / 2 + (i / 5) * TAU; if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); }

  // ─── Shared characters ─────────────────────────────────────────────────
  // A dog walking to the right, paws on y = 0.
  function dogShape(ctx, k, walk = 1) {
    ctx.lineCap = 'round';
    for (const [lx, ph, c] of [[-30, PI, '#9a5a28'], [34, 0, '#9a5a28'], [-40, 0, '#a8662f'], [24, PI, '#a8662f']]) {
      const a = Math.sin(k * 10 + ph) * 0.4 * walk; ctx.strokeStyle = c; ctx.lineWidth = 12;
      ctx.beginPath(); ctx.moveTo(lx, -42); ctx.lineTo(lx + Math.sin(a) * 36, -42 + Math.cos(a) * 36); ctx.stroke();
    }
    ctx.strokeStyle = '#c8874a'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-54, -58); ctx.quadraticCurveTo(-76, -70, -72 + Math.sin(k * 12) * 9, -94); ctx.stroke();
    oval(ctx, 0, -54, 60, 26, 0, '#c8874a');
    ctx.strokeStyle = '#b07236'; ctx.lineWidth = 3; ctx.beginPath(); for (const x of [-34, -14, 6]) { ctx.moveTo(x, -76); ctx.quadraticCurveTo(x + 6, -70, x + 2, -64); } ctx.stroke();
    circ(ctx, 60, -80, 26, '#c8874a'); oval(ctx, 82, -70, 16, 11, 0, '#e2b07a'); circ(ctx, 95, -74, 5.5, PUPIL);
    oval(ctx, 85, -58, 6, 8, 0, '#ff8fab');
    ctx.save(); ctx.translate(46, -84); ctx.rotate(0.35 + Math.sin(k * 10) * 0.08); oval(ctx, 0, 14, 9, 19, 0, '#8a5426'); ctx.restore();
    eye1(ctx, 66, -88, 5, k, 4, 1);
    line(ctx, 40, -64, 50, -56, '#ef4b4b', 6);
  }
  // A snowflake design picked by `seed`: a hexagon plate, six arms that
  // grow (ga 0..1) and matching side branches at 60 degrees.
  function flake(ctx, x, y, R, seed, plate, ga, rot, lw) {
    const nb = 2 + Math.floor(rnd(seed) * 3); const tip = rnd(seed + 9) > 0.5; const pr = R * (0.1 + 0.08 * rnd(seed + 11));
    const br = []; for (let j = 0; j < nb; j++) { const p = 0.3 + (j / nb) * 0.52 + (rnd(seed + j * 3.1) - 0.5) * 0.08; br.push([p, (0.13 + 0.25 * rnd(seed + j * 5.3)) * (1 - p * 0.5)]); }
    const B = PI / 3;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (plate > 0.01) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i * PI) / 3; const px = Math.cos(a) * pr * plate; const py = Math.sin(a) * pr * plate; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.closePath(); ctx.fillStyle = 'rgba(200,235,255,0.55)'; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.5, lw * 0.4); ctx.stroke(); }
    for (const [w, c] of [[lw + 6, 'rgba(120,190,255,0.35)'], [lw, '#f2faff']]) {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ca = Math.cos((i * PI) / 3); const sa = Math.sin((i * PI) / 3);
        const P = (px, py) => [px * ca - py * sa, px * sa + py * ca];
        if (ga <= 0.001) continue;
        const L = R * ga; let p0 = P(pr * 0.6, 0); let p1 = P(L, 0); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]);
        for (const [p, bl] of br) {
          if (ga <= p) continue; const l = R * bl * clamp((ga - p) / 0.3);
          for (const sd of [-1, 1]) { p0 = P(R * p, 0); p1 = P(R * p + Math.cos(B) * l, sd * Math.sin(B) * l); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); }
        }
        if (ga > 0.85) {
          const q = clamp((ga - 0.85) / 0.15); const tl = R * 0.09 * q;
          for (const sd of [-1, 1]) { p0 = P(L - tl * 0.6, 0); p1 = P(L - tl * 0.6 + Math.cos(tip ? 2.1 : B) * tl, sd * Math.sin(tip ? 2.1 : B) * tl); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); }
        }
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  function eggPath(ctx, x, y, rx, ry) {
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) { const a = (i / 48) * TAU; const s = Math.sin(a); const w = s < 0 ? 1 + 0.16 * s : 1; const px = x + Math.cos(a) * rx * w; const py = y + s * ry; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.closePath();
  }
  // A chick, body centred at the origin; dry 0 = wet and flat, 1 = fluffy.
  function chick(ctx, k, dry, seed = 0) {
    const c = mix('#c9a23f', '#ffe14d', dry); const c2 = mix('#b08a2c', '#ffc93c', dry);
    if (dry > 0.02) {
      ctx.fillStyle = c; ctx.beginPath();
      for (let j = 0; j < 16; j++) { const a = (j / 16) * TAU; const px = Math.cos(a) * 50; const py = Math.sin(a) * 50; ctx.moveTo(px + 11 * dry, py); ctx.arc(px, py, 11 * dry, 0, TAU); }
      for (let j = 0; j < 12; j++) { const a = (j / 12) * TAU; const px = Math.cos(a) * 34; const py = -56 + Math.sin(a) * 34; ctx.moveTo(px + 8 * dry, py); ctx.arc(px, py, 8 * dry, 0, TAU); }
      ctx.fill();
    }
    circ(ctx, 0, 0, 52, c); circ(ctx, 0, -56, 36, c);
    if (dry < 0.95) {
      ctx.save(); ctx.globalAlpha *= 1 - dry; ctx.strokeStyle = '#9c7a22'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
      for (const [x0, y0, x1, y1] of [[-30, -10, -20, 22], [22, -20, 30, 14], [-12, -78, -4, -52], [12, -80, 16, -56]]) { ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); }
      ctx.stroke(); ctx.restore();
    }
    const fl = Math.sin(k * 7) * 0.12 * dry;
    oval(ctx, -46, 8, 14, 25, 0.4 + fl, c2); oval(ctx, 46, 8, 14, 25, -0.4 - fl, c2);
    if (dry > 0.3) { ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-2, -90); ctx.quadraticCurveTo(-10, -104, -16, -100); ctx.moveTo(3, -91); ctx.quadraticCurveTo(6, -108, 14, -104); ctx.stroke(); }
    const bl = mod(k + seed, 3.7) < 0.12;
    for (const sx of [-1, 1]) { if (bl) line(ctx, sx * 14 - 5, -60, sx * 14 + 5, -60, PUPIL, 3); else { circ(ctx, sx * 14, -60, 6, PUPIL); circ(ctx, sx * 14 - 2, -62, 2.2, '#ffffff'); } }
    ctx.fillStyle = '#ff9f1c'; ctx.beginPath(); ctx.moveTo(-9, -50); ctx.lineTo(9, -50); ctx.lineTo(0, -37); ctx.closePath(); ctx.fill();
    cheeks(ctx, 0, -45, 46, 6);
  }
  // A mother hen facing left, body centred at the origin.
  function hen(ctx, k) {
    const nod = Math.sin(k * 2.4) * 3;
    ctx.fillStyle = '#efdcc4';
    for (const [a, l] of [[-0.9, 46], [-0.5, 52], [-0.1, 44]]) { ctx.save(); ctx.translate(52, -18); ctx.rotate(a); oval(ctx, l * 0.5, 0, l * 0.55, 15, 0, '#efdcc4'); ctx.restore(); }
    ctx.strokeStyle = '#ff9f1c'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath();
    for (const lx of [-16, 16]) { ctx.moveTo(lx, 48); ctx.lineTo(lx - 2, 78); ctx.moveTo(lx - 2, 78); ctx.lineTo(lx - 14, 84); ctx.moveTo(lx - 2, 78); ctx.lineTo(lx + 8, 84); }
    ctx.stroke();
    oval(ctx, 0, 0, 72, 56, 0, '#fff7ec');
    oval(ctx, 12, 6, 38, 25, -0.25, '#f0dcc3');
    ctx.save(); ctx.translate(0, nod);
    circ(ctx, -40, -30, 30, '#fff7ec'); circ(ctx, -58, -54, 30, '#fff7ec');
    circ(ctx, -70, -84, 9, '#ef4b4b'); circ(ctx, -58, -88, 10, '#ef4b4b'); circ(ctx, -46, -83, 8, '#ef4b4b');
    ctx.fillStyle = '#ff9f1c'; ctx.beginPath(); ctx.moveTo(-86, -58); ctx.lineTo(-104, -50); ctx.lineTo(-86, -43); ctx.closePath(); ctx.fill();
    oval(ctx, -84, -35, 6, 9, 0, '#ef4b4b');
    eye1(ctx, -66, -58, 7, k, 2, -1);
    circ(ctx, -60, -44, 6, 'rgba(255,120,150,0.4)');
    ctx.restore();
  }
  // A friendly insect seen from above, facing +x, thorax at the origin.
  // hl lights a part: 0 head, 1 thorax, 2 abdomen, 3 legs, 4 antennae.
  function insect(ctx, k, hl = -1, env = 0) {
    const HC = ['#fb9f43', '#22d3ee', '#a78bfa', '#34d399', '#fbbf24'];
    const legC = hl === 3 ? mix('#3b2f5c', '#34d399', env) : '#3b2f5c';
    const feet = [];
    ctx.strokeStyle = legC; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [i, hx, kx, fx] of [[0, -28, -45, -100], [1, 0, -2, 6], [2, 28, 40, 86]]) {
      for (const sd of [-1, 1]) {
        const ph = (i === 1) === (sd > 0) ? 0 : PI; const sw = Math.sin(k * 6 + ph) * 9;
        ctx.beginPath(); ctx.moveTo(hx, sd * 36); ctx.lineTo(hx + kx + sw * 0.5, sd * 100); ctx.lineTo(hx + fx + sw, sd * 136); ctx.stroke();
        feet.push([hx + fx + sw, sd * 136, i, sd]);
      }
    }
    for (const [fx, fy] of feet) circ(ctx, fx, fy, 6.5, legC);
    // Abdomen with stripes.
    oval(ctx, -150, 0, 100, 64, 0, '#b39dfa');
    ctx.save(); oval(ctx, -150, 0, 100, 64, 0, null); ctx.clip(); ctx.fillStyle = '#9580ee'; for (const x of [-205, -165, -125]) ctx.fillRect(x, -70, 15, 140); ctx.restore();
    // Wings.
    const wf = Math.sin(k * 18) * 0.04;
    ctx.fillStyle = 'rgba(225,240,255,0.4)'; ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2;
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(-78, sd * 38, 86, 28, sd * (0.3 + wf), 0, TAU); ctx.fill(); ctx.stroke(); }
    oval(ctx, 0, 0, 52, 46, 0, '#6fd6c8');
    circ(ctx, 112, 0, 48, '#ffcf6b');
    // Antennae.
    const aC = hl === 4 ? mix('#3b2f5c', '#fbbf24', env) : '#3b2f5c';
    ctx.strokeStyle = aC; ctx.lineWidth = 6;
    for (const sd of [-1, 1]) { const wy = Math.sin(k * 3 + sd) * 7; ctx.beginPath(); ctx.moveTo(140, sd * 26); ctx.quadraticCurveTo(168, sd * 92, 222, sd * 92 + wy); ctx.stroke(); circ(ctx, 222, sd * 92 + wy, 9, aC); }
    eyes(ctx, 116, -10, 38, 11, k, 1, 0.5);
    smile(ctx, 120, 22, 12, '#7a4a12', 3);
    cheeks(ctx, 116, 12, 58, 6);
    if (hl >= 0 && hl <= 2 && env > 0.01) {
      ctx.save(); ctx.globalAlpha *= env; ctx.strokeStyle = HC[hl]; ctx.lineWidth = 7; ctx.beginPath();
      if (hl === 0) ctx.arc(112, 0, 55, 0, TAU); else if (hl === 1) ctx.ellipse(0, 0, 59, 53, 0, 0, TAU); else ctx.ellipse(-150, 0, 107, 71, 0, 0, TAU);
      ctx.stroke(); ctx.restore();
    }
    return feet;
  }
  // A spider seen from above, facing +x.
  function spiderShape(ctx, k, walk = 1) {
    ctx.strokeStyle = '#2a2140'; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < 4; i++) {
      for (const sd of [-1, 1]) {
        const sw = Math.sin(k * 9 * walk + i * 1.7 + (sd > 0 ? PI : 0)) * 0.14 * walk;
        const a = sd * (0.62 + i * 0.58 + sw); const hx = 10 - i * 3; const hy = sd * 5;
        const kx = hx + Math.cos(a) * 18; const ky = hy + Math.sin(a) * 18;
        const b2 = a + (i < 2 ? -sd * 0.55 : sd * 0.55);
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.lineTo(kx + Math.cos(b2) * 20, ky + Math.sin(b2) * 20); ctx.stroke();
      }
    }
    oval(ctx, -16, 0, 16, 13, 0, '#3b2f5c'); circ(ctx, -18, -2, 4, '#7d6bb0');
    circ(ctx, 8, 0, 10, '#4a3d70');
    for (const sd of [-1, 1]) { circ(ctx, 13, sd * 4, 3, '#ffffff'); circ(ctx, 14, sd * 4, 1.6, PUPIL); }
  }
  // A worker ant from the side, facing +x, standing on y = 10.
  function ant(ctx, k, crumb = null, s = 1, seed = 0) {
    ctx.save(); ctx.scale(s, s);
    ctx.strokeStyle = '#3a1f14'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath();
    for (let i = 0; i < 3; i++) { const sw = Math.sin(k * 14 + i * 2.1 + seed) * 3.5; const hx = -4 + i * 4; ctx.moveTo(hx, 0); ctx.lineTo(hx - 4 + sw, 6); ctx.lineTo(hx - 6 + sw * 1.4, 10); }
    ctx.moveTo(14, -3); ctx.quadraticCurveTo(20, -12, 24, -11);
    ctx.stroke();
    oval(ctx, -14, -2, 10, 7, -0.15, '#5a2a1a'); circ(ctx, -1, -1, 5, '#6a3322'); circ(ctx, 10, -3, 6.5, '#6a3322');
    circ(ctx, 12, -5, 2.2, '#ffffff'); circ(ctx, 12.6, -5, 1.1, PUPIL);
    if (crumb) circ(ctx, 18, -12, 6.5, crumb);
    ctx.restore();
  }

  return {
    // ─── Little animals ──────────────────────────────────────────────────

    // A hen keeps her egg warm for 21 days; it wobbles, cracks, a chick
    // pecks a hole, the top pops off and the chick dries fluffy.
    'chick-hatching'(b, ctx, it, t) {
      const k = b.clock; const T = 14; const u = cycle(t, T, 0.6);
      const ex = cx - 30; const ey = Y0 + 300; const RX = 86; const RY = 110; const base = ey + RY; const zy = ey - 14;
      const day = Math.max(1, Math.min(21, Math.ceil(clamp(u / 3) * 21)));
      const wob = clamp((u - 3) / 1) * (1 - smooth((u - 7.3) / 0.4));
      const crack = clamp((u - 4) / 1.5); const peck = clamp((u - 5.6) / 1.6);
      const open = smooth((u - 7.5) / 0.8); const dry = smooth((u - 9) / 2.2);
      const st = u < 3 ? 0 : u < 5.6 ? 1 : u < 8.4 ? 2 : 3;
      const COL = ['orange', 'yellow', 'teal', 'green'];
      const SAY = ['The hen keeps her egg warm', 'The chick wiggles. Crack!', 'It pecks out with its egg tooth', 'Hello! It dries soft and fluffy'];
      const zig = []; for (let j = 0; j <= 8; j++) zig.push(ex - RX * 1.05 + j * ((RX * 2.1) / 8), zy + (j % 2 ? -13 : 13));
      const egg = () => { eggPath(ctx, ex, ey, RX, RY); const g = ctx.createLinearGradient(ex - RX, ey - RY, ex + RX, ey + RY); g.addColorStop(0, '#fffaf0'); g.addColorStop(1, '#ecd2b0'); ctx.fillStyle = g; ctx.fill(); for (const [dx, dy, r] of [[-30, 40, 6], [34, 10, 5], [-10, -60, 4], [44, 62, 4]]) circ(ctx, ex + dx, ey + dy, r, '#e6cba6'); };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'How a chick hatches');
      // The day counter.
      const calX = X0 + 100; const calY = Y0 + 185;
      sc(ctx, calX, calY, pop(t, 0.2) * (1 + (st === 0 && day === 21 ? 0.06 * Math.sin(k * 12) : 0)), () => {
        ctx.fillStyle = '#fff7ec'; rounded(ctx, -62, -70, 124, 140, 18); ctx.fill();
        ctx.fillStyle = '#ef5a5a'; rounded(ctx, -62, -70, 124, 40, [18, 18, 0, 0]); ctx.fill();
        label(ctx, 'Day', 0, -49, { size: 24, weight: 800, fill: '#ffffff' });
        label(ctx, String(day), 0, 18, { size: 56, weight: 800, fill: DARKTEXT });
      });
      label(ctx, 'About 21 days', calX, calY + 100, { size: 22, weight: 700, fill: 'muted' });
      // Warmth from the hen.
      if (u < 3.4) for (let j = 0; j < 3; j++) { const q = mod(k * 0.6 + j / 3, 1); ctx.save(); ctx.globalAlpha *= (1 - q) * 0.7 * (1 - smooth((u - 3) / 0.4)); oval(ctx, ex, ey + 10, RX + 18 + q * 55, RY + 16 + q * 45, 0, null, '#ffb347', 4); ctx.restore(); }
      // The hen.
      sc(ctx, X1 - 112, Y0 + 330, pop(t, 0.35), () => hen(ctx, k));
      label(ctx, 'Mother hen', X1 - 112, Y0 + 445, { size: 22, weight: 700, fill: 'muted' });
      // Nest (back).
      oval(ctx, ex, base - 16, 158, 36, 0, '#7a4f26');
      // The egg, wobbling about its bottom.
      const wa = wob * Math.sin(k * 11) * 0.14;
      ctx.save(); ctx.translate(ex, base); ctx.rotate(wa); ctx.translate(-ex, -base);
      if (open <= 0) {
        egg();
        if (crack > 0) {
          ctx.save(); eggPath(ctx, ex, ey, RX, RY); ctx.clip();
          ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath();
          const n = crack * 4;
          for (const dir of [1, -1]) { ctx.moveTo(zig[8], zig[9]); for (let j = 0; j < Math.ceil(n); j++) { const a = 4 + dir * j; const c2 = 4 + dir * (j + 1); const p = clamp(n - j); ctx.lineTo(lerp(zig[a * 2], zig[c2 * 2], p), lerp(zig[a * 2 + 1], zig[c2 * 2 + 1], p)); } }
          ctx.stroke(); ctx.restore();
        }
        if (peck > 0) {
          const hx = ex + 28; const hy = ey - 54;
          ctx.save(); eggPath(ctx, ex, ey, RX, RY); ctx.clip();
          circ(ctx, hx, hy, 16 * peck, '#3b2a1a');
          ctx.restore();
          if (peck > 0.25) { const am = Math.max(0, Math.sin(k * 9)); ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.6); ctx.fillStyle = '#ff9f1c'; ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(8 + 14 * am, 0); ctx.lineTo(-8, 6); ctx.closePath(); ctx.fill(); ctx.restore(); }
          for (let j = 0; j < 3; j++) { const q = mod(k * 1.3 + j / 3, 1); ctx.save(); ctx.globalAlpha *= (1 - q) * peck; ctx.fillStyle = '#fffaf0'; ctx.translate(hx + 20 + q * 40 + j * 8, hy - 10 + q * q * 140); ctx.rotate(q * 6 + j); poly(ctx, [-6, -5, 7, -3, 0, 7]); ctx.fill(); ctx.restore(); }
        }
      } else {
        const cyy = lerp(ey + 14, ey - 40, open) - Math.max(0, Math.sin(k * 5)) * 8 * dry;
        sc(ctx, ex, cyy, lerp(0.9, 1.04, dry), () => chick(ctx, k, dry, 1));
        ctx.save(); poly(ctx, [...zig, ex + RX + 30, base + 30, ex - RX - 30, base + 30]); ctx.clip(); egg(); ctx.restore();
        ctx.strokeStyle = '#d9bf98'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; poly(ctx, zig, false); ctx.stroke();
      }
      ctx.restore();
      // Nest (front rim).
      ctx.fillStyle = '#9c6b3c'; ctx.beginPath(); ctx.moveTo(ex - 172, base - 30); ctx.quadraticCurveTo(ex, base + 92, ex + 172, base - 30); ctx.quadraticCurveTo(ex, base + 22, ex - 172, base - 30); ctx.fill();
      ctx.strokeStyle = '#c99a5b'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
      for (let j = 0; j < 11; j++) { const x = ex - 140 + j * 28; const y = base + 4 - Math.sin((j / 10) * PI) * -18; ctx.moveTo(x - 16, y - 6 + (j % 2) * 8); ctx.lineTo(x + 16, y + 4 - (j % 2) * 8); }
      ctx.stroke();
      // The top of the shell, popping off to the side.
      if (open > 0) {
        const px = ex; const py = ey - 55;
        ctx.save(); ctx.translate(lerp(0, -185, open), lerp(0, base - 40 - py, open) - Math.sin(open * PI) * 90);
        ctx.translate(px, py); ctx.rotate(-2.9 * open); ctx.translate(-px, -py);
        poly(ctx, [...zig, ex + RX + 30, ey - RY - 30, ex - RX - 30, ey - RY - 30]); ctx.clip(); egg(); ctx.restore();
      }
      // Sounds.
      if (u > 5.8 && u < 7.6) label(ctx, 'Tap! Tap!', ex + 160, ey - 128 + Math.sin(k * 9) * 4, { size: 26, weight: 800, fill: 'yellow' });
      if (dry > 0.4) { ctx.save(); ctx.globalAlpha *= clamp((dry - 0.4) * 3) * (0.6 + 0.4 * Math.abs(Math.sin(k * 3))); label(ctx, 'Cheep!', ex + 160, ey - 128, { size: 28, weight: 800, fill: 'yellow' }); ctx.restore(); }
      steps(ctx, ['Warm', 'Crack!', 'Peck out', 'Fluffy!'], COL, st, Y0 + 560);
      chip(ctx, SAY[st], cx, Y1 - 30, COL[st]);
      ctx.restore();
    },

    // A friendly insect from above: head, thorax and abdomen, six legs on
    // the thorax and two antennae light up in turn; a spider is compared.
    'insect-body'(b, ctx, it, t) {
      const k = b.clock; const P = 2.6; const u = cycle(t, P * 5, 0.8); const st = Math.floor(u / P) % 5; const f = (u - st * P) / P; const env = bump(f, 0.12);
      const ix = cx - 50; const iy = Y0 + 232;
      const COL = ['orange', 'cyan', 'purple', 'green', 'yellow'];
      const SAY = ['The head has eyes and a mouth', 'Legs and wings join the thorax', 'The abdomen is the back part', 'Count them: 6 legs!', '2 antennae feel and smell'];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Parts of an insect');
      const s = pop(t, 0.1, 0.6);
      let feet = [];
      sc(ctx, ix, iy, s, () => { feet = insect(ctx, k, st, env); });
      ctx.save(); ctx.globalAlpha *= after(t, 0.6);
      const big = (i) => (st === i ? 1 + 0.08 * env : 1);
      label(ctx, 'Thorax', ix, iy + 1, { size: 22 * big(1), weight: 800, fill: DARKTEXT });
      label(ctx, 'Abdomen', ix - 150, iy + 1, { size: 24 * big(2), weight: 800, fill: DARKTEXT });
      line(ctx, ix + 166, iy, ix + 232, iy, st === 0 ? 'orange' : 'muted', 3);
      label(ctx, 'Head', ix + 272, iy + 1, { size: 26 * big(0), weight: 800, fill: st === 0 ? 'orange' : 'ink' });
      label(ctx, '2 antennae', ix + 238, iy - 140, { size: 24 * big(4), weight: 800, fill: st === 4 ? 'yellow' : 'ink' });
      label(ctx, '6 legs', ix - 246, iy + 150, { size: 24 * big(3), weight: 800, fill: st === 3 ? 'green' : 'ink' });
      ctx.restore();
      // Count the legs.
      if (st === 3 && s > 0.99) {
        const ORDER = [0, 2, 4, 5, 3, 1];
        const n = Math.min(6, Math.floor(f * 9));
        for (let j = 0; j < n; j++) {
          const [fx, fy, , sd] = feet[ORDER[j]]; const x = ix + fx; const y = iy + fy + sd * 30; const p = pop(u - st * P, (j / 9) * P, 0.3);
          sc(ctx, x, y, p, () => { circ(ctx, 0, 0, 17, '#34d399'); label(ctx, String(j + 1), 0, 1, { size: 22, weight: 800, fill: DARKTEXT }); });
        }
      }
      // Insect or spider?
      const cy0 = Y0 + 440; const ch = 165;
      const cards = [[X0 + 20, 'Insect', '3 parts, 6 legs', 'Has antennae', 'green'], [X0 + 410, 'Spider', '2 parts, 8 legs', 'Not an insect!', 'red']];
      cards.forEach(([x0, nm, l1, l2, c], i) => {
        ctx.save(); ctx.globalAlpha *= after(t, 0.9 + i * 0.25);
        card(ctx, x0, cy0, 370, ch, c, true);
        if (i === 0) sc(ctx, x0 + 92, cy0 + ch / 2, 0.29, () => insect(ctx, k));
        else sc(ctx, x0 + 95, cy0 + ch / 2, 1.5, () => spiderShape(ctx, k, 0.6));
        label(ctx, nm, x0 + 262, cy0 + 38, { size: 28, weight: 800, fill: c });
        label(ctx, l1, x0 + 262, cy0 + 86, { size: 22, weight: 700, fill: 'ink' });
        label(ctx, l2, x0 + 262, cy0 + 126, { size: 22, weight: 700, fill: i ? 'red' : 'muted' });
        if (i === 0) tick(ctx, x0 + 338, cy0 + 38, 22, 'green'); else cross(ctx, x0 + 338, cy0 + 38, 22, 'red');
        ctx.restore();
      });
      chip(ctx, SAY[st], cx, Y1 - 30, COL[st]);
      ctx.restore();
    },

    // A spider spins frame threads, spokes, then a sticky spiral from the
    // outside in; a fly blunders into it and sticks.
    'spider-web'(b, ctx, it, t) {
      const k = b.clock; const T = 16; const u = cycle(t, T, 0.5);
      const wx = cx; const wy = Y0 + 330; const R = 205; const N = 12; const TURNS = 7; const NS = N * TURNS;
      const fr = (i) => 0.9 + 0.17 * rnd(mod(i, N) + 3);
      const ang = (i) => -PI / 2 + (mod(i, N) / N) * TAU + (rnd(mod(i, N) + 40) - 0.5) * 0.12;
      const FLY = [wx + 108, wy - 72];
      const A = u > 12 ? 7 * Math.exp(-(u - 12) * 1.3) + 2.2 * Math.max(0, Math.sin(k * 3)) : 0;
      const P = (x, y) => { if (!A) return [x, y]; const d = Math.hypot(x - FLY[0], y - FLY[1]); return [x, y + A * Math.exp(-d / 90) * Math.sin(k * 30)]; };
      const vert = (i) => P(wx + Math.cos(ang(i)) * R * fr(i), wy + Math.sin(ang(i)) * R * fr(i));
      const spi = (j) => { const i = mod(j, N); const q = 0.92 - (0.7 * j) / NS; return P(wx + Math.cos(ang(i)) * R * fr(i) * q, wy + Math.sin(ang(i)) * R * fr(i) * q); };
      const pos = (uu) => {
        if (uu < 2) { const e = clamp(uu / 2) * N; const i = Math.floor(e); const a = vert(i); const c2 = vert(i + 1); return [lerp(a[0], c2[0], e - i), lerp(a[1], c2[1], e - i)]; }
        if (uu < 5) { const e = clamp((uu - 2) / 3) * N; const i = Math.min(N - 1, Math.floor(e)); const q = e - i; const v = vert(i); const tr = q < 0.5 ? q * 2 : 2 - q * 2; return [lerp(wx, v[0], tr), lerp(wy, v[1], tr)]; }
        if (uu < 10.5) { const e = clamp((uu - 5) / 5.5) * NS; const j = Math.min(NS - 1, Math.floor(e)); const a = spi(j); const c2 = spi(j + 1); return [lerp(a[0], c2[0], e - j), lerp(a[1], c2[1], e - j)]; }
        const end = spi(NS);
        if (uu < 11.5) { const q = smooth(uu - 10.5); return [lerp(end[0], wx, q), lerp(end[1], wy, q)]; }
        if (uu < 13) return [wx, wy];
        const q = smooth((uu - 13) / 1.6) * 0.72; return [lerp(wx, FLY[0], q), lerp(wy, FLY[1], q)];
      };
      const st = u < 2 ? 0 : u < 5 ? 1 : u < 10.5 ? 2 : 3;
      const COL = ['cyan', 'purple', 'yellow', 'red'];
      const SAY = ['Silk comes from its spinnerets', 'Spokes go out from the middle', 'A sticky spiral, round and round', 'A fly gets stuck on the sticky silk!'];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'How a spider spins a web');
      // Twigs.
      ctx.strokeStyle = '#8d6e4f'; ctx.lineCap = 'round'; ctx.lineWidth = 12;
      ctx.beginPath(); ctx.moveTo(X0 + 15, Y0 + 80); ctx.quadraticCurveTo(cx, Y0 + 58, X1 - 15, Y0 + 84); ctx.stroke();
      ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(X0 + 48, Y0 + 76); ctx.quadraticCurveTo(X0 + 40, Y0 + 330, X0 + 72, Y0 + 585); ctx.moveTo(X1 - 48, Y0 + 80); ctx.quadraticCurveTo(X1 - 40, Y0 + 330, X1 - 78, Y0 + 585); ctx.stroke();
      leaf(ctx, X0 + 150, Y0 + 72, 60, 20, -0.5, '#3fbf5f'); leaf(ctx, X1 - 170, Y0 + 74, 56, 18, -2.5, '#4caf50'); leaf(ctx, X0 + 58, Y0 + 470, 50, 17, 0.4, '#3fbf5f'); leaf(ctx, X1 - 62, Y0 + 300, 50, 17, 2.6, '#4caf50');
      // Silk.
      ctx.strokeStyle = 'rgba(236,242,255,0.9)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const fp = clamp(u / 2);
      // Anchor threads: [vertex, x, y, y is relative to the vertex].
      const ANCH = [[0, wx, Y0 + 68, false], [1, wx + 95, Y0 + 70, false], [11, wx - 95, Y0 + 70, false], [3, X1 - 52, 0, true], [9, X0 + 52, 0, true], [5, X1 - 66, 70, true], [7, X0 + 64, 70, true]];
      ctx.beginPath();
      ANCH.forEach(([i, ax, ay, rel], j) => { const q = clamp(fp * 3 - j * 0.3); if (q <= 0) return; const v = vert(i); const ty = rel ? v[1] + ay : ay; ctx.moveTo(v[0], v[1]); ctx.lineTo(lerp(v[0], ax, q), lerp(v[1], ty, q)); });
      const ne = clamp(fp * 1.25 - 0.25) * N;
      if (ne > 0) { const v0 = vert(0); ctx.moveTo(v0[0], v0[1]); for (let i = 0; i < Math.ceil(ne); i++) { const a = vert(i); const c2 = vert(i + 1); const q = clamp(ne - i); ctx.lineTo(lerp(a[0], c2[0], q), lerp(a[1], c2[1], q)); } }
      ctx.stroke();
      // Spokes.
      const sp = clamp((u - 2) / 3) * N;
      ctx.beginPath();
      for (let i = 0; i < Math.ceil(sp); i++) { const q = clamp((sp - i) * 2); const v = vert(i); const c0 = P(wx, wy); ctx.moveTo(c0[0], c0[1]); ctx.lineTo(lerp(c0[0], v[0], q), lerp(c0[1], v[1], q)); }
      ctx.stroke();
      // The sticky spiral with its droplets.
      const sn = clamp((u - 5) / 5.5) * NS;
      if (sn > 0) {
        ctx.strokeStyle = 'rgba(255,248,214,0.95)'; ctx.lineWidth = 2; ctx.beginPath();
        const s0 = spi(0); ctx.moveTo(s0[0], s0[1]);
        for (let j = 0; j < Math.ceil(sn); j++) { const a = spi(j); const c2 = spi(j + 1); const q = clamp(sn - j); ctx.lineTo(lerp(a[0], c2[0], q), lerp(a[1], c2[1], q)); }
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,240,170,0.95)'; ctx.beginPath();
        for (let j = 0; j < Math.floor(sn); j++) { const a = spi(j); const c2 = spi(j + 1); const mx = (a[0] + c2[0]) / 2; const my = (a[1] + c2[1]) / 2; ctx.moveTo(mx + 2.4, my); ctx.arc(mx, my, 2.4, 0, TAU); }
        ctx.fill();
      }
      // The fly.
      if (u > 10.3) {
        const q = smooth((u - 10.5) / 1.5); const sx = X1 - 70; const sy = Y0 + 150;
        let fx = lerp(sx, FLY[0], q) + Math.sin(q * 14) * 26 * (1 - q); let fy = lerp(sy, FLY[1], q) + Math.cos(q * 11) * 30 * (1 - q);
        if (u > 12) { const pp = P(FLY[0], FLY[1]); fx = pp[0] + Math.sin(k * 25) * 1.5; fy = pp[1]; }
        ctx.save(); ctx.globalAlpha *= clamp((u - 10.3) * 4); ctx.translate(fx, fy); ctx.rotate(u > 12 ? 0.4 : 0.1);
        const fl = Math.abs(Math.sin(k * (u > 12 ? 22 : 40)));
        ctx.fillStyle = 'rgba(220,235,255,0.75)'; ctx.beginPath(); ctx.ellipse(-4, -10, 7, 13 * (0.4 + 0.6 * fl), -0.5, 0, TAU); ctx.ellipse(6, -10, 7, 13 * (0.4 + 0.6 * fl), 0.5, 0, TAU); ctx.fill();
        oval(ctx, 0, 0, 13, 9, 0, '#2f3b4f'); circ(ctx, 13, -1, 7, '#2f3b4f'); circ(ctx, 15, -4, 3.4, '#e25555'); circ(ctx, 15, 3, 3.4, '#e25555');
        ctx.restore();
        if (u > 12.2 && u < 15.5) label(ctx, 'Stuck!', FLY[0] + 70, FLY[1] - 40, { size: 26, weight: 800, fill: 'red' });
      }
      // The spider.
      const [px, py] = pos(u); const [qx, qy] = pos(Math.max(0, u - 0.05));
      const moving = Math.hypot(px - qx, py - qy) > 0.3; const hd = moving ? Math.atan2(py - qy, px - qx) : u > 12 ? Math.atan2(FLY[1] - wy, FLY[0] - wx) : -PI / 2;
      sc(ctx, px, py, pop(t, 0.3) * 1.25, () => { ctx.rotate(hd); spiderShape(ctx, k, moving ? 1 : 0.15); });
      steps(ctx, ['Frame', 'Spokes', 'Spiral', 'Catch!'], COL, st, Y0 + 612, 160, 176);
      chip(ctx, SAY[st], cx, Y1 - 30, COL[st]);
      ctx.restore();
    },

    // A cutaway anthill: tunnels, a food store, a nursery of eggs, the
    // queen laying eggs, and workers carrying crumbs home in a line.
    'ant-colony'(b, ctx, it, t) {
      const k = b.clock; const PX = X0 + 10; const PY = Y0 + 50; const PW = FIG.w - 20; const PH = 595; const sy = Y0 + 168; const ex = X0 + 470;
      const J = [ex, sy + 88];
      const FOOD = [X0 + 175, sy + 192]; const NURS = [X0 + 650, sy + 198]; const QUEEN = [X0 + 405, sy + 380];
      const TUN = [[ex, sy - 6, J[0], J[1], ex - 60, sy + 125, FOOD[0] + 40, FOOD[1]], [J[0], J[1], ex + 90, sy + 125, NURS[0] - 40, NURS[1]], [J[0], J[1], ex + 22, sy + 200, ex - 30, sy + 300, QUEEN[0] + 10, QUEEN[1]]];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Inside an ant colony');
      ctx.save(); clipRound(ctx, PX, PY, PW, PH);
      scene(ctx, PX, PY, PW, sy - PY + 4, '#7cc8ff', '#c9ecff', 0);
      cloud(ctx, X1 - 180 + Math.sin(k * 0.3) * 20, PY + 45, 0.7, '#ffffff');
      sun(ctx, X1 - 60, PY + 40, 24, k, false);
      // Soil and pebbles.
      ctx.fillStyle = '#6b4a2e'; ctx.fillRect(PX, sy, PW, PH);
      ctx.fillStyle = '#7d5836'; for (let j = 0; j < 34; j++) { ctx.beginPath(); ctx.ellipse(PX + 20 + rnd(j) * (PW - 40), sy + 20 + rnd(j + 50) * (PH - (sy - PY) - 30), 6 + 6 * rnd(j + 9), 4, 0, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#4caf50'; ctx.fillRect(PX, sy - 4, PW, 8);
      // Mound around the entrance.
      ctx.fillStyle = '#9c6b3c'; ctx.beginPath(); ctx.moveTo(ex - 95, sy + 2); ctx.quadraticCurveTo(ex - 45, sy - 48, ex - 14, sy - 30); ctx.lineTo(ex + 14, sy - 30); ctx.quadraticCurveTo(ex + 45, sy - 48, ex + 95, sy + 2); ctx.closePath(); ctx.fill();
      // Tunnels and rooms.
      ctx.strokeStyle = '#e8c9a0'; ctx.lineWidth = 30; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const p of TUN) { poly(ctx, p, false); ctx.stroke(); }
      ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(ex, sy - 30); ctx.lineTo(ex, sy + 10); ctx.stroke();
      oval(ctx, FOOD[0], FOOD[1], 100, 48, 0, '#e8c9a0'); oval(ctx, NURS[0], NURS[1], 100, 48, 0, '#e8c9a0'); oval(ctx, QUEEN[0], QUEEN[1], 128, 58, 0, '#f0d4ac');
      // Food store: seeds and crumbs.
      for (let j = 0; j < 14; j++) { const x = FOOD[0] - 70 + rnd(j + 3) * 110; const y = FOOD[1] + 34 - rnd(j + 7) * 26 * (1 - Math.abs(x - FOOD[0] + 15) / 90); oval(ctx, x, y, 9, 6, rnd(j) * 3, j % 3 ? '#ffd27a' : '#c98a3a'); }
      // Nursery: eggs and larvae, a nurse ant.
      for (let j = 0; j < 6; j++) oval(ctx, NURS[0] - 60 + j * 15, NURS[1] + 28 - (j % 2) * 9, 6, 9, 0.3, '#fffaf0');
      for (let j = 0; j < 3; j++) { const x = NURS[0] + 22 + j * 22; ctx.save(); ctx.translate(x, NURS[1] + 24); ctx.rotate(Math.sin(k * 2 + j) * 0.15); oval(ctx, 0, 0, 10, 7, 0, '#fff3dc'); ctx.strokeStyle = '#e3cfae'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(-4, 6); ctx.moveTo(2, -6); ctx.lineTo(2, 6); ctx.stroke(); ctx.restore(); }
      { const nx = NURS[0] + Math.sin(k * 0.8) * 40; ctx.save(); ctx.translate(nx, NURS[1] - 6); if (Math.cos(k * 0.8) < 0) ctx.scale(-1, 1); ant(ctx, k, null, 1.3, 2); ctx.restore(); }
      // The queen and her eggs.
      ctx.save(); ctx.translate(QUEEN[0] - 30, QUEEN[1] + 12); ant(ctx, k * 0.2, null, 2.7, 1); ctx.restore();
      for (let j = 0; j < 7; j++) oval(ctx, QUEEN[0] + 44 + (j % 4) * 15, QUEEN[1] + 34 - Math.floor(j / 4) * 13, 6, 9, 0.2, '#fffaf0');
      { const q = mod(k / 2.5, 1); sc(ctx, QUEEN[0] + 22, QUEEN[1] + 36, pop(q * 2.5, 0.1, 0.4), () => oval(ctx, 0, 0, 6, 9, 0.2, '#fffaf0')); }
      // Crumbs on the surface and the line of workers.
      for (let j = 0; j < 6; j++) circ(ctx, PX + 50 + (j % 3) * 14, sy - 8 - Math.floor(j / 3) * 11, 7, '#ffd27a');
      const ROUTE = [PX + 92, sy - 10, ex - 70, sy - 10, ex - 34, sy - 36, ex, sy - 24, ex, J[1], ex - 60, sy + 125, FOOD[0] + 50, FOOD[1] - 4];
      const L = pathLen(ROUTE); const NA = 9;
      for (let i = 0; i < NA; i++) {
        const s = mod(k * 52 + (i * L) / NA, L); const p = along(ROUTE, s);
        ctx.save(); ctx.globalAlpha *= clamp(s / 30) * clamp((L - s) / 30); face(ctx, p.x, p.y, p.dx, p.dy); ant(ctx, k, '#ffd27a', 1.3, i); ctx.restore();
      }
      ctx.restore();
      // Labels.
      const L2 = { size: 22, weight: 800, fill: '#ffe6c2' };
      ctx.save(); ctx.globalAlpha *= after(t, 0.6);
      chip(ctx, 'Worker ants fetch food', X0 + 215, PY + 40, 'ink', 22);
      label(ctx, 'Food store', FOOD[0], FOOD[1] - 70, L2);
      label(ctx, 'Egg nursery', NURS[0], NURS[1] - 70, L2);
      label(ctx, "Queen's chamber", QUEEN[0] + 245, QUEEN[1] - 4, L2);
      label(ctx, 'Tunnels', ex + 112, sy + 268, L2);
      ctx.restore();
      chip(ctx, 'The queen lays eggs. Workers do the jobs.', cx, Y1 - 30, 'orange', 22);
      ctx.restore();
    },

    // ─── Plants and the stuff around us ──────────────────────────────────

    // Five ways seeds travel, one scene at a time: wind, animal fur,
    // water, a bird, and a pod that pops.
    'seed-dispersal'(b, ctx, it, t) {
      const k = b.clock; const D = 3.8; const u = cycle(t, D * 5, 0.6); const w = Math.floor(u / D) % 5; const f = (u - w * D) / D;
      const PX = X0 + 20; const PY = Y0 + 55; const PW = 760; const PH = 400; const gy = PY + 330;
      const COL = ['cyan', 'orange', 'blue', 'purple', 'green'];
      const NAME = ['Wind', 'Animal fur', 'Water', 'Birds', 'Pop!'];
      const SAY = ['Wind blows dandelion seeds away', 'Burrs hook onto animal fur', 'Coconuts float to new beaches', 'Birds eat berries, then drop the seeds', 'Dry pea pods pop and fling seeds'];
      // A dandelion seed with its fluffy parachute, base at (x, y).
      const para = (x, y, a, s) => {
        const tx = x + Math.cos(a) * 24 * s; const ty = y + Math.sin(a) * 24 * s;
        ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 1.6 * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty);
        for (let j = 0; j < 7; j++) { const b2 = a + (j - 3) * 0.3; ctx.moveTo(tx, ty); ctx.lineTo(tx + Math.cos(b2) * 12 * s, ty + Math.sin(b2) * 12 * s); }
        ctx.stroke(); oval(ctx, x, y, 3.5 * s, 2 * s, a, '#8a6a3a');
      };
      const burr = (x, y, r) => { ctx.strokeStyle = '#6b4f2a'; ctx.lineWidth = 2.2; ctx.beginPath(); for (let j = 0; j < 14; j++) { const a = (j / 14) * TAU; ctx.moveTo(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7); ctx.lineTo(x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.35); } ctx.stroke(); circ(ctx, x, y, r, '#9a7a46'); circ(ctx, x - r * 0.3, y - r * 0.3, r * 0.3, '#b8965a'); };
      const coconut = (x, y, r) => { circ(ctx, x, y, r, '#8a5a2b'); circ(ctx, x - r * 0.3, y - r * 0.35, r * 0.35, '#a8743e'); dotEyes(ctx, x, y - r * 0.25, r * 0.5, r * 0.13, '#4a2f14'); circ(ctx, x, y + r * 0.1, r * 0.13, '#4a2f14'); };
      const bird = (k2, flap, berry) => {
        const fl = Math.sin(k2 * 16) * flap;
        ctx.fillStyle = '#3f6fd8'; poly(ctx, [-20, -2, -40, -12, -38, 6]); ctx.fill();
        oval(ctx, 0, 0, 24, 18, 0, '#5b8cff'); oval(ctx, 4, 6, 15, 10, 0, '#cfe0ff');
        circ(ctx, 20, -12, 14, '#5b8cff');
        ctx.fillStyle = '#ff9f1c'; poly(ctx, [32, -16, 46, -11, 32, -6]); ctx.fill();
        eye1(ctx, 23, -15, 4.5, k2, 6);
        if (berry) circ(ctx, 46, -10, 6, '#e8304a');
        oval(ctx, -4, -6 - fl * 10, 18, 9, -0.5 - fl * 0.8, '#3f6fd8');
      };
      const sprout = (x, y, q) => { if (q <= 0) return; line(ctx, x, y, x, y - 30 * q, '#3fbf5f', 4); leaf(ctx, x, y - 28 * q, 22 * q, 9, -0.6, '#4caf50', null); leaf(ctx, x, y - 22 * q, 20 * q, 8, -2.5, '#66bb46', null); };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'How seeds travel');
      ctx.save(); clipRound(ctx, PX, PY, PW, PH);
      ctx.fillStyle = '#0b1230'; ctx.fillRect(PX, PY, PW, PH);
      ctx.globalAlpha *= smooth(f / 0.05) * smooth((1 - f) / 0.04);
      if (w !== 2) { scene(ctx, PX, PY, PW, PH, '#8fd3ff', '#e2f6ff', 0); ctx.fillStyle = '#6cc04a'; ctx.fillRect(PX, gy, PW, PH); ctx.fillStyle = '#5aae3c'; for (let j = 0; j < 22; j++) { const x = PX + rnd(j + 4) * PW; poly(ctx, [x - 6, gy + 4, x, gy - 12 - rnd(j) * 8, x + 6, gy + 4]); ctx.fill(); } }
      if (w === 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        for (let j = 0; j < 4; j++) { const x = PX + mod(j * 230 + k * 260, PW + 260) - 160; const y = PY + 60 + j * 55; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 90, y); ctx.arc(x + 90, y - 12, 12, PI / 2, -PI * 0.8, true); ctx.stroke(); }
        const hx = PX + 170; const hy = gy - 185;
        ctx.strokeStyle = '#4caf50'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(hx, gy); ctx.quadraticCurveTo(hx - 14, gy - 90, hx, hy); ctx.stroke();
        leaf(ctx, hx, gy, 60, 14, -2.7, '#3f9f3f', null); leaf(ctx, hx, gy, 56, 13, -0.4, '#3f9f3f', null);
        circ(ctx, hx, hy, 9, '#c9b27a');
        for (let i = 0; i < 20; i++) {
          const a = (i / 20) * TAU; const leave = 0.06 + rnd(i + 2) * 0.55; const q = clamp((f - leave) / 0.9);
          if (q <= 0) para(hx + Math.cos(a) * 6, hy + Math.sin(a) * 6, a, 1.15);
          else { const x = hx + Math.cos(a) * 20 + q * 640 + Math.sin(q * 9 + i) * 16; const y = hy + Math.sin(a) * 20 - q * 150 - Math.sin(q * 5 + i) * 26 + i * 2 * q; para(x, y + 14, -PI / 2 + Math.sin(k * 3 + i) * 0.25, 1.15); }
        }
      }
      if (w === 1) {
        const bx = PX + 300;
        ctx.strokeStyle = '#5d8a3a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(bx, gy); ctx.lineTo(bx, gy - 130); ctx.moveTo(bx, gy - 70); ctx.lineTo(bx + 34, gy - 104); ctx.moveTo(bx, gy - 90); ctx.lineTo(bx - 30, gy - 120); ctx.stroke();
        leaf(ctx, bx, gy - 30, 54, 20, -2.6, '#5d9a3a'); leaf(ctx, bx, gy - 40, 54, 20, -0.5, '#5d9a3a');
        burr(bx, gy - 136, 11); burr(bx - 32, gy - 124, 10);
        const dogX = lerp(PX - 110, PX + PW + 110, f); const on = dogX > bx + 20; const drop = f > 0.8;
        const dropX = lerp(PX - 110, PX + PW + 110, 0.8) - 18;
        ctx.save(); ctx.translate(dogX, gy + 4); dogShape(ctx, k, 1); ctx.restore();
        if (!on) burr(bx + 34, gy - 108, 11);
        else if (!drop) burr(dogX - 18, gy - 78 + Math.abs(Math.sin(k * 10)) * 2, 11);
        else { const q = smooth((f - 0.8) / 0.06); burr(dropX, lerp(gy - 78, gy - 8, q), 11); sprout(dropX + 22, gy, smooth((f - 0.9) / 0.1)); }
      }
      if (w === 2) {
        const sea = PY + 225;
        scene(ctx, PX, PY, PW, PH, '#8fd3ff', '#dff5ff', 0); sun(ctx, PX + 400, PY + 70, 32, k, true);
        const g = ctx.createLinearGradient(0, sea, 0, PY + PH); g.addColorStop(0, '#2f8fe0'); g.addColorStop(1, '#1d58a8'); ctx.fillStyle = g; ctx.fillRect(PX, sea, PW, PH);
        oval(ctx, PX + 55, sea + 6, 140, 34, 0, '#f2d48a'); oval(ctx, PX + PW - 60, sea + 6, 140, 34, 0, '#f2d48a');
        ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 13; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(PX + 60, sea - 10); ctx.quadraticCurveTo(PX + 70, sea - 80, PX + 112, sea - 140); ctx.stroke();
        for (const a of [-2.8, -2.2, -1.2, -0.5, 0.2]) leaf(ctx, PX + 112, sea - 140, 74, 18, a, '#3fae4a');
        coconut(PX + 100, sea - 128, 11); coconut(PX + 122, sea - 126, 11);
        const q1 = clamp(f / 0.12); const q2 = clamp((f - 0.12) / 0.66); const q3 = smooth((f - 0.78) / 0.1);
        let x; let y;
        if (f < 0.12) { x = lerp(PX + 112, PX + 190, q1); y = lerp(sea - 120, sea, q1 * q1); }
        else if (f < 0.78) { x = lerp(PX + 190, PX + PW - 170, q2); y = sea + Math.sin(k * 3) * 5; }
        else { x = lerp(PX + PW - 170, PX + PW - 110, q3); y = lerp(sea, sea - 16, q3); }
        coconut(x, y, 17);
        sprout(x + 4, y - 14, smooth((f - 0.88) / 0.12));
        ctx.fillStyle = 'rgba(47,143,224,0.55)'; ctx.beginPath(); ctx.moveTo(PX + 140, sea + 8); for (let xx = PX + 140; xx <= PX + PW - 140; xx += 20) ctx.lineTo(xx, sea + 6 + Math.sin(xx * 0.05 + k * 3) * 4); ctx.lineTo(PX + PW - 140, sea + 40); ctx.lineTo(PX + 140, sea + 40); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; for (let j = 0; j < 5; j++) { const xx = PX + 180 + mod(j * 120 + k * 40, 420); ctx.beginPath(); ctx.arc(xx, sea + 30 + (j % 2) * 40, 14, PI * 1.1, PI * 1.9); ctx.stroke(); }
      }
      if (w === 3) {
        const bx = PX + 130;
        for (const [dx, dy, r] of [[-40, -40, 50], [30, -46, 52], [-2, -86, 50]]) circ(ctx, bx + dx, gy + dy, r, '#3f9f3f');
        const BER = [[40, -90], [-30, -60], [20, -40], [-52, -96], [56, -50], [-8, -110]];
        BER.forEach(([dx, dy], j) => { if (j === 0 && f > 0.33) return; circ(ctx, bx + dx, gy + dy, 8, '#e8304a'); circ(ctx, bx + dx - 2, gy + dy - 3, 2.5, '#ff9aa8'); });
        let x; let y; let flap = 1;
        if (f < 0.25) { const q = smooth(f / 0.25); x = lerp(PX - 40, bx + 40, q); y = lerp(PY + 60, gy - 122, q); }
        else if (f < 0.42) { x = bx + 40; y = gy - 122 + Math.abs(Math.sin(k * 10)) * 4; flap = 0.15; }
        else { const q = smooth((f - 0.42) / 0.36); x = lerp(bx + 40, PX + 680, q); y = lerp(gy - 122, PY + 80, q) - Math.sin(q * PI) * 30; }
        ctx.save(); ctx.translate(x, y); bird(k, flap, f > 0.3 && f < 0.36); ctx.restore();
        if (f > 0.28 && f < 0.44) label(ctx, 'Yum!', bx + 40, gy - 172, { size: 26, weight: 800, fill: DARKTEXT });
        const dX = lerp(bx + 40, PX + 680, smooth((0.62 - 0.42) / 0.36)) - 6;
        if (f > 0.62) { const q = clamp((f - 0.62) / 0.12); const dy = lerp(gy - 122 - Math.sin(((0.62 - 0.42) / 0.36) * PI) * 30 + (PY + 80 - gy + 122) * smooth((0.62 - 0.42) / 0.36), gy - 6, q * q); oval(ctx, dX, dy, 5, 3.5, 0.3, '#6b4a2e'); sprout(dX, gy, smooth((f - 0.8) / 0.18)); }
      }
      if (w === 4) {
        const sx = PX + 330;
        ctx.strokeStyle = '#4caf50'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(sx, gy); ctx.bezierCurveTo(sx - 30, gy - 100, sx + 30, gy - 160, sx, PY + 90); ctx.stroke();
        leaf(ctx, sx, gy - 60, 50, 18, -2.7, '#4caf50'); leaf(ctx, sx + 4, gy - 120, 50, 18, -0.3, '#4caf50'); leaf(ctx, sx, PY + 110, 40, 14, -2.4, '#66bb46');
        ctx.strokeStyle = '#66bb46'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(sx - 28, PY + 120, 10, 0, PI * 1.6); ctx.stroke();
        const ox = sx + 6; const oy = PY + 185; const dryq = smooth(f / 0.45); const split = smooth((f - 0.55) / 0.08);
        const pc = mix('#5fc94a', '#d8b46a', dryq);
        line(ctx, sx, oy - 40, ox, oy, '#4caf50', 4);
        const shake = f > 0.43 && f < 0.56 ? Math.sin(k * 45) * 0.07 : 0;
        ctx.save(); ctx.translate(ox, oy); ctx.rotate(0.12 + shake);
        if (split < 1) for (let j = 0; j < 5; j++) circ(ctx, 28 + j * 24, 0, 10, mix('#8ee05a', '#c7d36a', dryq));
        for (const sd of [-1, 1]) { ctx.save(); ctx.rotate(sd * 0.8 * split); ctx.fillStyle = pc; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(80, sd * 44, 150, 0); ctx.closePath(); ctx.fill(); ctx.restore(); }
        ctx.restore();
        if (f > 0.55) {
          for (let j = 0; j < 5; j++) {
            const tau = (f - 0.56) * D; const x0 = ox + (28 + j * 24) * Math.cos(0.12); const y0 = oy + (28 + j * 24) * Math.sin(0.12);
            const vx = (j - 1.6) * 120 + (j % 2 ? 40 : -40); const vy = -260 - 70 * rnd(j + 1);
            const y = Math.min(gy - 9, y0 + vy * tau + 450 * tau * tau); const x = x0 + vx * Math.min(tau, (y >= gy - 9 ? 1.2 : 99));
            circ(ctx, x, y, 10, '#8ee05a'); circ(ctx, x - 3, y - 3, 3, '#c8f5a0');
          }
          if (f < 0.78) { const p = pop(f * D, 0.56 * D, 0.3); sc(ctx, ox + 90, oy - 70, p, () => { starPath(ctx, 0, 0, 52, 30, 10); ctx.fillStyle = '#ffd23f'; ctx.fill(); label(ctx, 'POP!', 0, 2, { size: 30, weight: 800, fill: DARKTEXT }); }); }
        }
      }
      ctx.restore();
      // The five ways.
      for (let j = 0; j < 5; j++) {
        const x = cx + (j - 2) * 152; const y0 = Y0 + 480; const on = j === w;
        card(ctx, x - 70, y0, 140, 116, COL[j], on);
        sc(ctx, x, y0 + 44, on ? 1.08 : 0.95, () => {
          if (j === 0) para(0, 18, -PI / 2, 1.4);
          else if (j === 1) burr(0, 0, 15);
          else if (j === 2) { coconut(0, -4, 18); ctx.strokeStyle = '#5ab0ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-34, 18); ctx.quadraticCurveTo(-17, 10, 0, 18); ctx.quadraticCurveTo(17, 26, 34, 18); ctx.stroke(); }
          else if (j === 3) { ctx.scale(0.85, 0.85); bird(k, 0.3, true); }
          else { ctx.fillStyle = '#d8b46a'; ctx.save(); ctx.translate(-34, 0); for (const sd of [-1, 1]) { ctx.save(); ctx.rotate(sd * 0.5); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(36, sd * 24, 68, 0); ctx.closePath(); ctx.fill(); ctx.restore(); } ctx.restore(); circ(ctx, -4, 0, 7, '#8ee05a'); circ(ctx, 12, 0, 7, '#8ee05a'); }
        });
        label(ctx, NAME[j], x, y0 + 94, { size: 22, weight: on ? 800 : 600, fill: on ? COL[j] : 'ink' });
      }
      chip(ctx, SAY[w], cx, Y1 - 30, COL[w]);
      ctx.restore();
    },

    // An ice cube, a beaker of water and steam, with arrows that melt,
    // boil, cool and freeze, a thermometer, and the particles of each.
    'states-of-water-kids'(b, ctx, it, t) {
      const k = b.clock; const P = 3.4; const u = cycle(t, P * 4, 0.8); const st = Math.floor(u / P) % 4; const f = (u - st * P) / P; const env = bump(f, 0.1);
      const SX = [X0 + 235, X0 + 455, X0 + 675]; const SY = Y0 + 255;
      const TEMP = [[-10, 15], [20, 100], [100, 40], [10, -10]];
      const temp = lerp(TEMP[st][0], TEMP[st][1], smooth((f - 0.1) / 0.7));
      const FROM = [0, 1, 2, 1]; const TO = [1, 2, 1, 0];
      const COL = ['orange', 'red', 'cyan', 'blue'];
      const SAY = ['Warm it up: ice melts into water', 'Heat it lots: water boils into steam', 'Steam cools back into water drops', 'Very cold: water freezes into ice'];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Ice, water and steam');
      // Thermometer.
      const TX = X0 + 52; const ty = (v) => lerp(Y0 + 470, Y0 + 132, (v + 20) / 130);
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; rounded(ctx, TX - 13, Y0 + 118, 26, 375, 13); ctx.fill(); circ(ctx, TX, Y0 + 505, 25, '#ffffff');
      const hot = mix('#5b8cff', '#ef4444', clamp((temp + 10) / 110));
      ctx.fillStyle = hot; rounded(ctx, TX - 7, ty(temp), 14, Y0 + 500 - ty(temp), 7); ctx.fill(); circ(ctx, TX, Y0 + 505, 18, hot);
      for (const [v, s] of [[0, '0°'], [100, '100°']]) { line(ctx, TX + 13, ty(v), TX + 24, ty(v), '#ffffff', 3); label(ctx, s, TX + 28, ty(v), { size: 22, weight: 700, fill: 'muted', align: 'left' }); }
      chip(ctx, `${Math.round(temp)}°C`, TX + 10, Y0 + 86, temp > 50 ? 'red' : temp > 0 ? 'orange' : 'blue', 22);
      // Arrows between the stations.
      const ARR = [[SX[0] + 70, Y0 + 132, SX[1] - 70, Y0 + 132, -28, 'melts', Y0 + 92], [SX[1] + 70, Y0 + 132, SX[2] - 70, Y0 + 132, -28, 'boils', Y0 + 92], [SX[2] - 70, Y0 + 386, SX[1] + 70, Y0 + 386, -28, 'cools', Y0 + 426], [SX[1] - 70, Y0 + 386, SX[0] + 70, Y0 + 386, -28, 'freezes', Y0 + 426]];
      ARR.forEach(([x0, y0, x1, y1, bend, word, ly], i) => {
        const on = i === st;
        ctx.save(); ctx.globalAlpha *= after(t, 0.4 + i * 0.12) * (on ? 1 : 0.45);
        curveArrow(ctx, x0, y0, x1, y1, bend, on ? COL[i] : 'muted', on ? 6 : 4);
        label(ctx, word, (x0 + x1) / 2, ly, { size: on ? 26 : 22, weight: 800, fill: on ? COL[i] : 'muted' });
        ctx.restore();
        if (on) { const q = smooth((f - 0.12) / 0.7); const dx = x1 - x0; const qx = (x0 + x1) / 2; const qy = y0 + (i < 2 ? -1 : 1) * Math.abs(bend) * 0.5 * (dx > 0 ? 1 : 1); const x = lerp(lerp(x0, qx, q), lerp(qx, x1, q), q); const y = lerp(lerp(y0, qy, q), lerp(qy, y1, q), q); circ(ctx, x, y - (i < 2 ? 14 : -14) * Math.sin(q * PI), 9, '#7cc4ff'); }
      });
      // Halos on the stations in play.
      for (let i = 0; i < 3; i++) { const on = i === FROM[st] || i === TO[st]; circ(ctx, SX[i], SY, 96, on ? tint(COL[st], 0.12 + 0.08 * env) : 'rgba(255,255,255,0.035)'); }
      // Ice cube with a face, and a puddle.
      const melt = st === 0 ? smooth(f) : st === 3 ? 1 - smooth(f) : 0;
      sc(ctx, SX[0], SY + 10, pop(t, 0.2) * (1 - 0.18 * melt), () => {
        ctx.fillStyle = '#bfe9ff'; rounded(ctx, -55, -55, 110, 110, 22); ctx.fill();
        ctx.fillStyle = '#e6f7ff'; rounded(ctx, -42, -44, 34, 16, 8); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; rounded(ctx, 30, -40, 10, 36, 5); ctx.fill();
        dotEyes(ctx, 0, -2, 34, 5, '#2a4a7a'); smile(ctx, 0, 16, 12, '#2a4a7a', 3); cheeks(ctx, 0, 12, 52, 6);
      });
      if (melt > 0.01) { oval(ctx, SX[0], SY + 72, 50 + 30 * melt, 9 + 4 * melt, 0, 'rgba(124,196,255,0.75)'); if (st === 0) { const q = mod(k * 1.4, 1); ctx.save(); ctx.globalAlpha *= 1 - q; circ(ctx, SX[0] + 30, SY + 56 + q * 14, 6, '#7cc4ff'); ctx.restore(); } }
      // Beaker of water over a flame when boiling.
      sc(ctx, SX[1], SY, pop(t, 0.35), () => {
        const boil = st === 1 ? smooth(f / 0.3) : 0;
        if (boil > 0.01) { ctx.save(); ctx.globalAlpha *= boil; for (let j = 0; j < 3; j++) { const fl = 1 + 0.15 * Math.sin(k * 14 + j * 2); ctx.fillStyle = j === 1 ? '#ffd23f' : '#ff7a3d'; ctx.beginPath(); ctx.moveTo(-24 + j * 24 - 10, 92); ctx.quadraticCurveTo(-24 + j * 24, 92 - 34 * fl, -24 + j * 24 + 10, 92); ctx.fill(); } ctx.restore(); }
        ctx.fillStyle = 'rgba(124,196,255,0.85)'; ctx.beginPath(); ctx.moveTo(-48, -10); for (let x = -48; x <= 48; x += 8) ctx.lineTo(x, -10 + Math.sin(x * 0.12 + k * (3 + boil * 6)) * (3 + boil * 3)); ctx.lineTo(44, 72); ctx.lineTo(-44, 72); ctx.closePath(); ctx.fill();
        for (let j = 0; j < 8; j++) { const q = mod(k * (0.4 + boil * 1.2) + rnd(j), 1); circ(ctx, -34 + rnd(j + 5) * 68, 66 - q * 74, 3 + 3 * boil, 'rgba(255,255,255,0.75)'); }
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-58, -64); ctx.lineTo(-50, -60); ctx.lineTo(-46, 76); ctx.lineTo(46, 76); ctx.lineTo(50, -60); ctx.lineTo(58, -64); ctx.stroke();
      });
      // Steam rising from a kettle; a cold lid catches drops when it cools.
      sc(ctx, SX[2], SY, pop(t, 0.5), () => {
        const cool = st === 2 ? smooth(f / 0.25) * (1 - smooth((f - 0.92) / 0.08)) : 0;
        for (let j = 0; j < 7; j++) { const q = mod(k * 0.45 + j / 7, 1); const x = Math.sin(q * 7 + j) * 18 + (j % 2 ? 12 : -12); const y = 6 - q * (cool > 0.3 ? 70 : 130); ctx.save(); ctx.globalAlpha *= Math.sin(q * PI) * 0.85; circ(ctx, x, y, 12 + 14 * q, '#eef4ff'); ctx.restore(); }
        ctx.fillStyle = '#c8d3ea'; rounded(ctx, -46, 26, 92, 62, 20); ctx.fill(); ctx.fillStyle = '#aab6d2'; rounded(ctx, -50, 22, 100, 12, 6); ctx.fill();
        ctx.strokeStyle = '#c8d3ea'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(40, 40); ctx.lineTo(64, 18); ctx.stroke(); ctx.beginPath(); ctx.arc(-46, 54, 18, PI * 0.5, PI * 1.5); ctx.stroke();
        dotEyes(ctx, 0, 52, 26, 4, '#3b4a7a'); smile(ctx, 0, 66, 8, '#3b4a7a', 3);
        if (cool > 0.01) {
          ctx.save(); ctx.globalAlpha *= cool;
          ctx.fillStyle = '#5b8cff'; rounded(ctx, -66, -96, 132, 14, 7); ctx.fill();
          for (let j = 0; j < 6; j++) { const x = -52 + j * 21; const q = mod(k * 0.7 + rnd(j) , 1); const y = -82 + (q > 0.6 ? (q - 0.6) * 260 : 0); ctx.save(); ctx.globalAlpha *= q > 0.6 ? 1 - (q - 0.6) * 2.5 : 1; drop(ctx, x, y + 6 * Math.min(q, 0.6) / 0.6, 3 + 3 * Math.min(1, q / 0.6), '#7cc4ff'); ctx.restore(); }
          ctx.restore();
        }
      });
      if (st === 2) label(ctx, 'cold lid', SX[2] + 112, SY - 89, { size: 22, weight: 700, fill: 'blue' });
      // Particles: packed, sliding, zooming.
      const NM = [['Solid', 'ice', 'blue'], ['Liquid', 'water', 'cyan'], ['Gas', 'steam', 'purple']];
      for (let i = 0; i < 3; i++) {
        const bx = SX[i] - 75; const by = Y0 + 450; const on = i === FROM[st] || i === TO[st];
        card(ctx, bx, by, 150, 104, NM[i][2], on, 14);
        ctx.save(); rounded(ctx, bx, by, 150, 104, 14); ctx.clip();
        if (i === 0) for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) circ(ctx, bx + 33 + c * 28 + Math.sin(k * 20 + r * 3 + c) * 1.5, by + 24 + r * 28 + Math.cos(k * 18 + c * 2 + r) * 1.5, 11, '#7cc4ff');
        if (i === 1) for (let j = 0; j < 10; j++) { const a = k * 0.8 + j * 0.63; circ(ctx, bx + 26 + mod(j * 29 + Math.sin(a) * 12, 100), by + 50 + (j % 3) * 20 + Math.cos(a * 1.3) * 6, 11, '#22d3ee'); }
        if (i === 2) for (let j = 0; j < 5; j++) { const tri = (v) => { const m = mod(v, 2); return m < 1 ? m : 2 - m; }; circ(ctx, bx + 14 + tri(k * (0.9 + j * 0.17) + j * 0.4) * 122, by + 14 + tri(k * (0.7 + j * 0.21) + j * 0.7) * 76, 10, '#a78bfa'); }
        ctx.restore();
        label(ctx, NM[i][0], SX[i], Y0 + 582, { size: 26, weight: 800, fill: on ? NM[i][2] : 'ink' });
        label(ctx, NM[i][1], SX[i], Y0 + 612, { size: 22, weight: 600, fill: 'muted' });
      }
      chip(ctx, SAY[st], cx, Y1 - 28, COL[st]);
      ctx.restore();
    },

    // A snowflake grows from a speck of dust: a six-sided plate, six arms,
    // matching branches; each loop grows a different design.
    snowflake(b, ctx, it, t) {
      const k = b.clock; const T = 9; const tt = Math.max(0, t - 0.4); const n = Math.floor(tt / T); const f = mod(tt, T) / T;
      const R = 176; const fx = cx; const fy = Y0 + 300;
      const plate = smooth((f - 0.06) / 0.12); const ga = smooth((f - 0.16) / 0.5); const out = smooth((f - 0.92) / 0.08);
      const st = f < 0.16 ? 0 : f < 0.66 ? 1 : f < 0.9 ? 2 : 3;
      const COL = ['muted', 'cyan', 'yellow', 'blue'];
      const SAY = ['A speck of dust in a cold cloud', 'Water freezes onto it', 'Count them: always 6 arms!', 'Then it falls as snow'];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'How a snowflake grows');
      // Gentle snowfall behind.
      ctx.save(); ctx.globalAlpha *= 0.3;
      for (let j = 0; j < 16; j++) { const x = X0 + 20 + mod(rnd(j) * 760 + Math.sin(k * 0.6 + j) * 20, 760); const y = Y0 + 60 + mod(rnd(j + 30) * 520 + k * (18 + 10 * rnd(j + 7)), 520); snowflake(ctx, x, y, 5 + 4 * rnd(j + 2), '#ffffff', k * 0.4 + j); }
      ctx.restore();
      // Six other snowflakes, all different.
      for (let j = 0; j < 6; j++) { const x = j < 3 ? X0 + 78 : X1 - 78; const y = Y0 + 170 + (j % 3) * 160; ctx.save(); ctx.globalAlpha *= after(t, 0.5 + j * 0.15); flake(ctx, x, y, 44, 40 + j * 7.3, 1, 1, k * 0.15 * (j % 2 ? 1 : -1) + j, 4); ctx.restore(); }
      // The big one.
      ctx.save(); ctx.globalAlpha *= 1 - out; ctx.translate(0, out * 70);
      if (st === 0 || plate < 1) { circ(ctx, fx, fy, 22 * (1 - plate) + 6, 'rgba(160,190,255,0.18)'); circ(ctx, fx, fy, 6, '#9c8a72'); }
      const rot = -PI / 2 + Math.sin(k * 0.3) * 0.08;
      flake(ctx, fx, fy, R, 1 + (n % 7) * 3.7, plate, ga, rot, 10);
      if (st >= 2) {
        for (let i = 0; i < 6; i++) {
          const a = rot + (i * PI) / 3; const p = pop(f * T, 0.66 * T + i * 0.22, 0.35);
          sc(ctx, fx + Math.cos(a) * (R + 34), fy + Math.sin(a) * (R + 34), p, () => { circ(ctx, 0, 0, 19, '#fbbf24'); label(ctx, String(i + 1), 0, 1, { size: 22, weight: 800, fill: DARKTEXT }); });
        }
      }
      ctx.restore();
      if (st === 0) label(ctx, 'dust', fx + 46, fy - 30, { size: 22, weight: 700, fill: 'muted' });
      label(ctx, 'No two are exactly alike', cx, Y0 + 585, { size: 24, weight: 700, fill: 'cyan' });
      chip(ctx, SAY[st], cx, Y1 - 30, COL[st]);
      ctx.restore();
    },

    // Four little scenes: pushing a swing, pulling a wagon, kicking a
    // ball, a magnet pulling a paper clip, each with its force arrow.
    'push-pull'(b, ctx, it, t) {
      const k = b.clock; const P = 3; const u = cycle(t, P * 4, 0.8); const act = Math.floor(u / P) % 4;
      const PW = 385; const PH = 262; const PAN = [[X0 + 10, Y0 + 55], [X0 + 405, Y0 + 55], [X0 + 10, Y0 + 332], [X0 + 405, Y0 + 332]];
      const NAME = ['Push a swing', 'Pull a wagon', 'Kick a ball', 'A magnet pulls'];
      const KIND = ['PUSH', 'PULL', 'PUSH', 'PULL'];
      const KC = (i) => (KIND[i] === 'PUSH' ? 'orange' : 'blue');
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Pushes and pulls');
      PAN.forEach(([px, py], i) => {
        const gy = py + 224; const on = i === act;
        ctx.save(); ctx.globalAlpha *= after(t, 0.15 + i * 0.15);
        ctx.save(); clipRound(ctx, px, py, PW, PH, 20);
        scene(ctx, px, py, PW, PH, i === 3 ? '#e9e4ff' : '#bfe8ff', i === 3 ? '#f7f5ff' : '#effaff', 0);
        if (i !== 3) { ctx.fillStyle = '#7ccf55'; ctx.fillRect(px, gy, PW, 60); }
        else { ctx.fillStyle = '#d9b98c'; ctx.fillRect(px, gy, PW, 60); }
        if (i === 0) {
          const ph = k * 2.4; const th = 0.55 * Math.sin(ph); const pvx = px + 255; const pvy = py + 62;
          ctx.strokeStyle = '#8d6e4f'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px + 165, gy); ctx.lineTo(px + 185, pvy); ctx.lineTo(px + 335, pvy); ctx.lineTo(px + 355, gy); ctx.stroke();
          const L = 112; const sx = pvx + Math.sin(th) * L; const sy = pvy + Math.cos(th) * L;
          line(ctx, pvx, pvy, sx - 16, sy, '#5a4a3a', 3); line(ctx, pvx, pvy, sx + 16, sy, '#5a4a3a', 3);
          ctx.save(); ctx.translate(sx, sy); ctx.rotate(-th * 0.6);
          ctx.fillStyle = '#e8524a'; rounded(ctx, -26, -4, 52, 9, 4); ctx.fill();
          ctx.strokeStyle = '#3b4a7a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(18, 0); ctx.lineTo(22, 22); ctx.stroke();
          ctx.fillStyle = '#ffd23f'; rounded(ctx, -16, -36, 22, 34, 8); ctx.fill();
          circ(ctx, -5, -48, 13, SKIN); ctx.fillStyle = HAIR; ctx.beginPath(); ctx.arc(-5, -50, 13, PI * 1.05, PI * 1.95); ctx.fill(); dotEyes(ctx, -1, -48, 9, 1.8); smile(ctx, -1, -42, 4, PUPIL, 1.8);
          ctx.restore();
          const near = smooth((-Math.sin(ph) - 0.55) / 0.3);
          kid(ctx, px + 110 + near * 14, gy, 100, '#34d399', { armL: 1.35 + near * 0.15, armR: 1.55 + near * 0.15, legL: -0.25, legR: 0.12 });
          if (Math.cos(ph) > 0.05) { const a = clamp(Math.cos(ph) * 2); ctx.save(); ctx.globalAlpha *= a; arr(ctx, sx + 30, sy - 28, sx + 100, sy - 28, 'orange', 7); ctx.restore(); }
        }
        if (i === 1) {
          ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 4; ctx.setLineDash([16, 20]); ctx.lineDashOffset = k * 80; ctx.beginPath(); ctx.moveTo(px, gy + 22); ctx.lineTo(px + PW, gy + 22); ctx.stroke(); ctx.setLineDash([]);
          const sw = Math.sin(k * 8) * 0.3;
          const hands = kid(ctx, px + 290, gy, 104, '#ff6b9a', { legL: sw, legR: -sw, armL: -0.95, armR: 0.3 });
          ctx.fillStyle = '#e8524a'; rounded(ctx, px + 50, gy - 74, 128, 42, 8); ctx.fill(); ctx.fillStyle = '#c43a33'; ctx.fillRect(px + 50, gy - 50, 128, 6);
          // A teddy rides along.
          circ(ctx, px + 112, gy - 92, 20, '#b07a4a'); circ(ctx, px + 98, gy - 110, 7, '#b07a4a'); circ(ctx, px + 126, gy - 110, 7, '#b07a4a'); oval(ctx, px + 112, gy - 86, 8, 6, 0, '#e3b98a'); dotEyes(ctx, px + 112, gy - 96, 12, 2.3);
          for (const wx of [px + 76, px + 152]) { circ(ctx, wx, gy - 18, 17, '#3b3f55'); ctx.save(); ctx.translate(wx, gy - 18); ctx.rotate(k * 5); line(ctx, -12, 0, 12, 0, '#c8d3ea', 3); line(ctx, 0, -12, 0, 12, '#c8d3ea', 3); ctx.restore(); }
          line(ctx, px + 178, gy - 56, hands[0][0], hands[0][1], '#3b3f55', 5);
          arr(ctx, px + 140, gy - 150, px + 225, gy - 150, 'blue', 7);
        }
        if (i === 2) {
          const q = mod(k, 2.4) / 2.4;
          const legR = q < 0.25 ? lerp(0.1, -0.7, smooth(q / 0.25)) : q < 0.33 ? lerp(-0.7, 1.15, (q - 0.25) / 0.08) : lerp(1.15, 0.1, smooth((q - 0.33) / 0.3));
          kid(ctx, px + 100, gy, 104, '#a78bfa', { legR, legL: -0.12, armL: -0.6, armR: 0.5 - (legR > 0.6 ? 0.3 : 0) });
          const roll = q < 0.32 ? 0 : (q - 0.32) * 2.4;
          const bx = px + 150 + roll * 260; const ba = roll * 9;
          ctx.save(); ctx.globalAlpha *= q > 0.9 ? 1 - smooth((q - 0.9) / 0.05) + (q > 0.96 ? 1 : 0) : 1;
          const bxx = q > 0.95 ? px + 150 : bx;
          ctx.translate(bxx, gy - 17); ctx.rotate(ba); circ(ctx, 0, 0, 17, '#ffffff'); ctx.fillStyle = '#2a2140'; hexDot(ctx, 0, 0, 6); for (let j = 0; j < 5; j++) { const a = (j / 5) * TAU; hexDot(ctx, Math.cos(a) * 13, Math.sin(a) * 13, 3.5); }
          ctx.restore();
          if (q > 0.31 && q < 0.6) { ctx.save(); ctx.globalAlpha *= 1 - smooth((q - 0.5) / 0.1); arr(ctx, bx - 10, gy - 62, bx + 70, gy - 62, 'orange', 7); ctx.restore(); }
        }
        if (i === 3) {
          const mx = px + 285; const my = py + 138;
          ctx.save(); ctx.globalAlpha *= 0.35; ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
          for (let j = 1; j <= 3; j++) { ctx.beginPath(); ctx.ellipse(mx - 48, my, 24 * j, 18 + 22 * j, 0, PI * 0.5, PI * 1.5); ctx.stroke(); }
          ctx.setLineDash([]); ctx.restore();
          ctx.strokeStyle = '#e8524a'; ctx.lineWidth = 30; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.arc(mx, my, 44, -PI / 2, PI / 2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(mx, my - 44); ctx.lineTo(mx - 34, my - 44); ctx.moveTo(mx, my + 44); ctx.lineTo(mx - 34, my + 44); ctx.stroke();
          ctx.fillStyle = '#d6dbe8'; ctx.fillRect(mx - 62, my - 59, 28, 30); ctx.fillRect(mx - 62, my + 29, 28, 30);
          label(ctx, 'N', mx - 48, my - 44, { size: 22, weight: 800, fill: DARKTEXT }); label(ctx, 'S', mx - 48, my + 44, { size: 22, weight: 800, fill: DARKTEXT });
          const q = mod(k, 2.8) / 2.8; const pull = q < 0.3 ? 0 : clamp((q - 0.3) / 0.28) ** 2;
          const clx = lerp(px + 60, px + 186, pull) + (pull >= 1 && q < 0.88 ? Math.sin(k * 30) * 0.8 : 0);
          ctx.save(); ctx.globalAlpha *= q > 0.9 ? 1 - smooth((q - 0.9) / 0.06) : 1;
          ctx.strokeStyle = '#7f8aa8'; ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.beginPath(); ctx.moveTo(clx + 30, my + 8); ctx.lineTo(clx - 14, my + 8); ctx.arc(clx - 14, my, 8, PI / 2, PI * 1.5); ctx.lineTo(clx + 24, my - 8); ctx.arc(clx + 24, my - 2, 6, -PI / 2, PI / 2); ctx.lineTo(clx - 6, my + 4); ctx.stroke();
          ctx.restore();
          if (q > 0.25 && q < 0.6) arr(ctx, clx + 40, my - 30, clx + 100, my - 30, 'blue', 7);
        }
        ctx.restore();
        ctx.strokeStyle = on ? color(KC(i)) : 'rgba(140,170,255,0.3)'; ctx.lineWidth = on ? 4 : 1.5; rounded(ctx, px, py, PW, PH, 20); ctx.stroke();
        label(ctx, NAME[i], px + 16, py + 26, { size: 24, weight: 800, fill: DARKTEXT, align: 'left' });
        chip(ctx, KIND[i], px + PW - 52, py + 28, KC(i), 22);
        ctx.restore();
      });
      chip(ctx, 'Push: moves it away', cx - 165, Y1 - 36, 'orange', 22);
      chip(ctx, 'Pull: brings it closer', cx + 165, Y1 - 36, 'blue', 22);
      ctx.restore();
    },

    // A drum is hit: its skin vibrates, sound waves ripple out through the
    // air to an ear. Two loud hits (big waves), then two quiet taps.
    'sound-vibrations-kids'(b, ctx, it, t) {
      const k = b.clock; const HP = 2.3; const u = cycle(t, HP * 4, 0.6); const hit = Math.floor(u / HP); const dt = u - hit * HP; const TH = 0.18;
      const loudOf = (h) => mod(h, 4) < 2; const loud = loudOf(hit); const A = loud ? 1 : 0.36;
      const DX = X0 + 170; const DY = Y0 + 290; const EX = X1 - 92; const EY = Y0 + 285;
      const W0 = DX + 95; const SPD = 330; const ARRIVE = (EX - 58 - W0) / SPD;
      const e = dt - TH; const vib = e > 0 ? A * Math.exp(-e * 3.2) * Math.sin(e * 46) : 0;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Sound is a vibration');
      // Sound waves from this hit and the last one.
      for (const [h, d] of [[hit, dt], [hit - 1, dt + HP]]) {
        const a2 = loudOf(h) ? 1 : 0.36;
        for (let j = 0; j < 4; j++) {
          const ee = d - TH - j * 0.14; if (ee <= 0) continue; const r = 30 + ee * SPD; if (r > EX - 60 - W0 + 30) continue;
          const span = 0.16 + 0.2 * a2; const al = (1 - r / 600) * (0.95 - j * 0.15);
          ctx.strokeStyle = tint('purple', al); ctx.lineWidth = 3 + 7 * a2; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.arc(W0 - 30, DY - 10, r, -span, span); ctx.stroke();
        }
      }
      label(ctx, 'Sound waves', (W0 + EX) / 2 - 20, Y0 + 152, { size: 24, weight: 800, fill: 'purple' });
      // The drum.
      sc(ctx, DX, DY, pop(t, 0.15), () => {
        ctx.fillStyle = '#e8524a'; ctx.fillRect(-88, 0, 176, 112); oval(ctx, 0, 112, 88, 24, 0, '#c43a33');
        ctx.strokeStyle = '#ffe0a3'; ctx.lineWidth = 4; ctx.beginPath(); for (let j = 0; j <= 8; j++) { const x = -88 + j * 22; ctx.moveTo(x, 6); ctx.lineTo(x + 11, 104); if (j < 8) { ctx.moveTo(x + 11, 104); ctx.lineTo(x + 22, 6); } } ctx.stroke();
        ctx.fillStyle = '#ffd23f'; ctx.fillRect(-90, -4, 180, 12); ctx.fillRect(-90, 100, 180, 12);
        ctx.fillStyle = '#fff3dc'; ctx.beginPath(); ctx.moveTo(-88, 0);
        for (let x = -88; x <= 88; x += 8) { const m = Math.cos((x / 88) * (PI / 2)); ctx.lineTo(x, -22 * Math.sqrt(Math.max(0, 1 - (x / 88) ** 2)) + vib * 14 * m); }
        for (let x = 88; x >= -88; x -= 8) { const m = Math.cos((x / 88) * (PI / 2)); ctx.lineTo(x, 22 * Math.sqrt(Math.max(0, 1 - (x / 88) ** 2)) + vib * 14 * m); }
        ctx.fill();
        if (Math.abs(vib) > 0.05) { ctx.strokeStyle = tint('yellow', clamp(Math.abs(vib) * 2)); ctx.lineWidth = 4; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * 112, 4, 16, sd > 0 ? -0.8 : PI - 0.8, sd > 0 ? 0.8 : PI + 0.8); ctx.stroke(); ctx.beginPath(); ctx.arc(sd * 112, 4, 28, sd > 0 ? -0.7 : PI - 0.7, sd > 0 ? 0.7 : PI + 0.7); ctx.stroke(); } }
      });
      // The drumstick.
      const pvx = DX + 150; const pvy = DY - 150; const aHit = Math.atan2(DY - 14 - pvy, DX + 10 - pvx);
      const raise = dt < TH ? 1 - dt / TH : smooth((dt - TH) / 0.7);
      const sa = aHit + raise * (loud ? 0.75 : 0.32); const sl = Math.hypot(DX + 10 - pvx, DY - 14 - pvy);
      line(ctx, pvx, pvy, pvx + Math.cos(sa) * sl, pvy + Math.sin(sa) * sl, '#b07a4a', 9); circ(ctx, pvx + Math.cos(sa) * sl, pvy + Math.sin(sa) * sl, 11, '#f3e3cf');
      circ(ctx, pvx, pvy, 13, SKIN);
      label(ctx, 'Drum skin vibrates', DX, DY + 164, { size: 22, weight: 700, fill: 'muted' });
      // The ear.
      const heard = dt - TH - ARRIVE; const wig = heard > 0 && heard < 0.8 ? Math.sin(heard * 40) * 3 * A * (1 - heard / 0.8) : 0;
      sc(ctx, EX + wig, EY, pop(t, 0.3), () => {
        oval(ctx, 0, 0, 52, 78, 0, SKIN);
        ctx.strokeStyle = '#e0a27a'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(4, -6, 34, PI * 0.95, PI * 2.25); ctx.stroke();
        ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(-4, 6, 14, PI * 0.9, PI * 2.0); ctx.stroke();
        circ(ctx, -14, 10, 7, '#b5714d');
        oval(ctx, 2, 58, 18, 16, 0, '#f0b48e');
      });
      label(ctx, 'Ear', EX, EY + 108, { size: 22, weight: 700, fill: 'muted' });
      if (heard > 0 && heard < 1.1) { const p = pop(heard, 0, 0.35); sc(ctx, EX, EY - 118, p, () => label(ctx, loud ? 'LOUD!' : 'quiet...', 0, 0, { size: loud ? 34 : 24, weight: 800, fill: loud ? 'red' : 'cyan' })); }
      // Loud and quiet waves.
      [[X0 + 20, 'Loud = big waves', 1, 'red'], [X0 + 410, 'Quiet = small waves', 0.32, 'cyan']].forEach(([x0, txt, amp, c], i) => {
        const on = (i === 0) === loud;
        card(ctx, x0, Y0 + 496, 370, 128, c, on);
        label(ctx, txt, x0 + 185, Y0 + 524, { size: 22, weight: 800, fill: on ? c : 'ink' });
        ctx.strokeStyle = on ? color(c) : 'rgba(200,210,240,0.5)'; ctx.lineWidth = 4; ctx.beginPath();
        for (let x = 0; x <= 320; x += 6) { const y = Y0 + 582 - Math.sin(x * 0.06 - k * 6) * 32 * amp; if (x) ctx.lineTo(x0 + 25 + x, y); else ctx.moveTo(x0 + 25, y); }
        ctx.stroke();
      });
      const say = dt < TH + 0.55 ? 'Hit the drum: its skin vibrates' : dt < TH + ARRIVE ? 'The vibrations travel through the air' : 'Your ear hears the sound!';
      chip(ctx, say, cx, Y1 - 30, loud ? 'yellow' : 'cyan');
      ctx.restore();
    },

    // ─── Space ───────────────────────────────────────────────────────────

    // The eight planets in order from the Sun, sizes roughly to scale; a
    // spotlight names each with a fact; a memory sentence underneath.
    'planets-parade'(b, ctx, it, t) {
      const k = b.clock; const ry = Y0 + 245; const P = 2.4;
      const PL = [
        ['Mercury', 2.7, X0 + 122, '#b8b0a8', 'Closest to the Sun', -1],
        ['Venus', 6.7, X0 + 158, '#f2c879', 'The hottest planet', 1],
        ['Earth', 7, X0 + 196, '#3a8dde', 'Our home!', -1],
        ['Mars', 3.7, X0 + 232, '#e2603a', 'The red planet', 1],
        ['Jupiter', 77, X0 + 323, '#d9a066', 'The biggest planet', 1],
        ['Saturn', 64, X0 + 527, '#e9cf8f', 'Famous for its rings', 1],
        ['Uranus', 28, X0 + 682, '#9fe3e8', 'It spins on its side', -1],
        ['Neptune', 27, X0 + 757, '#4a6cf0', 'Farthest and windiest', 1],
      ];
      const u = cycle(t, P * 8, 2); const ix = Math.floor(u / P) % 8; const f = (u - ix * P) / P; const env = t < 2 ? 0 : bump(f, 0.1);
      const planet = (i, x, y, r) => {
        const c = PL[i][3];
        if (i === 5) { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.22); ctx.strokeStyle = 'rgba(233,207,143,0.75)'; ctx.lineWidth = r * 0.22; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.8, r * 0.42, 0, PI, TAU); ctx.stroke(); ctx.restore(); }
        circ(ctx, x, y, Math.max(3, r), c);
        if (r > 10) {
          ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
          if (i === 4) { for (const [dy, h, bc] of [[-0.55, 0.14, '#f3d7a8'], [-0.25, 0.16, '#b5724a'], [0.08, 0.12, '#f3d7a8'], [0.38, 0.15, '#c0805a'], [0.68, 0.1, '#f3d7a8']]) { ctx.fillStyle = bc; ctx.fillRect(x - r, y + dy * r, r * 2, h * r); } oval(ctx, x + r * 0.35, y + r * 0.36, r * 0.2, r * 0.11, 0, '#d0533a'); }
          if (i === 5) { ctx.fillStyle = '#d8b874'; ctx.fillRect(x - r, y - r * 0.3, r * 2, r * 0.14); ctx.fillRect(x - r, y + r * 0.2, r * 2, r * 0.12); }
          if (i === 2) { for (const [a, d, s] of [[0.4, 0.4, 0.4], [2.5, 0.5, 0.35], [4.2, 0.45, 0.3]]) oval(ctx, x + Math.cos(a) * d * r, y + Math.sin(a) * d * r, s * r, s * r * 0.65, a, '#3fbf5f'); }
          if (i === 6 || i === 7) circ(ctx, x - r * 0.3, y - r * 0.3, r * 0.5, 'rgba(255,255,255,0.18)');
          ctx.fillStyle = 'rgba(5,8,30,0.28)'; ctx.beginPath(); ctx.arc(x + r * 0.35, y + r * 0.2, r * 1.05, 0, TAU); ctx.arc(x, y, r, 0, TAU, true); ctx.fill();
          ctx.restore();
        }
        if (i === 6) { ctx.save(); ctx.translate(x, y); ctx.rotate(1.45); ctx.strokeStyle = 'rgba(220,250,255,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.6, r * 0.3, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
        if (i === 5) { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.22); ctx.strokeStyle = 'rgba(240,218,160,0.9)'; ctx.lineWidth = r * 0.22; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.8, r * 0.42, 0, 0, PI); ctx.stroke(); ctx.restore(); }
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The eight planets');
      // Stars.
      for (let j = 0; j < 40; j++) { const tw = 0.4 + 0.6 * Math.abs(Math.sin(k * (0.8 + rnd(j) * 2) + j)); circ(ctx, X0 + 10 + rnd(j + 3) * 780, Y0 + 60 + rnd(j + 9) * 520, 1 + rnd(j + 1) * 1.6, `rgba(255,255,255,${0.25 * tw})`); }
      // The Sun's edge.
      ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0 + 60, 120, 380); ctx.clip();
      const sg = ctx.createRadialGradient(X0 - 330, ry, 300, X0 - 330, ry, 402); sg.addColorStop(0, '#ffb627'); sg.addColorStop(1, '#ffe066'); ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(X0 - 330, ry, 400, 0, TAU); ctx.fill();
      ctx.restore();
      label(ctx, 'Sun', X0 + 30, ry, { size: 22, weight: 800, fill: '#7a3d00' });
      // The parade.
      PL.forEach(([nm, r, x, , , side], i) => {
        const on = i === ix && t >= 2; const p = pop(t, 0.3 + i * 0.18, 0.5);
        const y = ry - (on ? 10 * env : 0) + Math.sin(k * 1.2 + i) * 2;
        if (p > 0.001) { ctx.save(); ctx.translate(x, y); ctx.scale(p, p); ctx.translate(-x, -y); planet(i, x, y, r); ctx.restore(); }
        if (on) { ctx.save(); ctx.globalAlpha *= env; ctx.strokeStyle = color('yellow'); ctx.lineWidth = 4; ctx.beginPath(); if (i === 5) ctx.ellipse(x, y, r * 1.95, r * 1.08, -0.1, 0, TAU); else ctx.arc(x, y, Math.max(14, r + 9), 0, TAU); ctx.stroke(); ctx.restore(); }
        // The small inner planets sit close together: Mercury's label one step higher, clear of Earth's.
        const ly = r < 10 ? ry + side * (i === 0 ? 64 : 36) : side > 0 ? ry + r + (i === 5 ? 34 : 26) : ry - r - 24;
        ctx.save(); ctx.globalAlpha *= after(t, 0.5 + i * 0.18);
        label(ctx, nm, x, ly, { size: 22, weight: on ? 800 : 700, fill: on ? 'yellow' : 'ink' });
        ctx.restore();
      });
      // The spotlight card.
      if (t >= 2) {
        const [nm, , , c, fact] = PL[ix]; const cw = 600; const cl = cx - cw / 2; const cy0 = Y0 + 468;
        card(ctx, cl, cy0 - 56, cw, 112, 'yellow', true, 22);
        sc(ctx, cl + 70, cy0, 0.85 + 0.15 * outBack(clamp(f / 0.2)), () => planet(ix, 0, 0, ix === 5 ? 26 : 36));
        label(ctx, `${ix + 1}. ${nm}`, cl + 140, cy0 - 20, { size: 30, weight: 800, fill: c === '#4a6cf0' ? '#8aa2ff' : c, align: 'left' });
        label(ctx, fact, cl + 140, cy0 + 22, { size: 24, weight: 700, fill: 'ink', align: 'left' });
      }
      // The memory sentence.
      const WORDS = ['My', 'Very', 'Easy', 'Method', 'Just', 'Speeds', 'Up', 'Naming'];
      ctx.font = `700 24px ${FONT}`; const sp = 11; const ws = WORDS.map((wd) => ctx.measureText(wd).width); const tot = ws.reduce((a, c) => a + c, 0) + sp * 7;
      let x = cx - tot / 2;
      WORDS.forEach((wd, i) => { const on = i === ix && t >= 2; label(ctx, wd, x, Y0 + 588, { size: 24, weight: on ? 800 : 700, fill: on ? 'yellow' : 'muted', align: 'left' }); ctx.font = `700 24px ${FONT}`; x += ws[i] + sp; });
      label(ctx, 'Sizes roughly to scale. Gaps are not!', cx, Y1 - 28, { size: 22, weight: 600, fill: 'muted' });
      ctx.restore();
    },

    // Countdown and lift-off, three days' flight to the Moon, the lander
    // touches down, an astronaut bounces and leaves footprints.
    'rocket-to-moon'(b, ctx, it, t) {
      const k = b.clock; const T = 16; const u = cycle(t, T, 0.4);
      const ph = u < 4.2 ? 0 : u < 9.2 ? 1 : 2;
      const PX = X0 + 10; const PY = Y0 + 55; const PW = 780; const PH = 575;
      const rocket = (flame) => {
        if (flame > 0) { const fl = 1 + 0.18 * Math.sin(k * 30); ctx.fillStyle = '#ff7a3d'; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.quadraticCurveTo(0, 70 * flame * fl, 18, 0); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(0, 40 * flame * fl, 10, 0); ctx.fill(); }
        ctx.fillStyle = '#e8524a'; poly(ctx, [-30, -10, -52, 6, -30, -60]); ctx.fill(); poly(ctx, [30, -10, 52, 6, 30, -60]); ctx.fill();
        ctx.fillStyle = '#9aa6c4'; ctx.fillRect(-20, -8, 40, 10);
        ctx.fillStyle = '#f4f6ff'; ctx.beginPath(); ctx.moveTo(-30, -6); ctx.lineTo(-30, -120); ctx.quadraticCurveTo(-28, -170, 0, -200); ctx.quadraticCurveTo(28, -170, 30, -120); ctx.lineTo(30, -6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e8524a'; ctx.beginPath(); ctx.moveTo(-24, -150); ctx.quadraticCurveTo(-18, -180, 0, -200); ctx.quadraticCurveTo(18, -180, 24, -150); ctx.closePath(); ctx.fill();
        circ(ctx, 0, -110, 15, '#3b4a7a'); circ(ctx, 0, -110, 11, '#7cc4ff'); circ(ctx, -4, -114, 4, '#d9f0ff');
        ctx.fillStyle = '#e8524a'; ctx.fillRect(-30, -50, 60, 8);
      };
      const astronaut = (k2, walk) => {
        const sw = Math.sin(k2 * 8) * 0.4 * walk;
        ctx.strokeStyle = '#e6e9f2'; ctx.lineWidth = 13; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-7, -30); ctx.lineTo(-7 + Math.sin(sw) * 26, -4); ctx.moveTo(7, -30); ctx.lineTo(7 - Math.sin(sw) * 26, -4); ctx.stroke();
        ctx.fillStyle = '#c8cedd'; rounded(ctx, -30, -74, 18, 34, 6); ctx.fill();
        ctx.fillStyle = '#f4f6ff'; rounded(ctx, -20, -78, 40, 50, 14); ctx.fill();
        ctx.strokeStyle = '#f4f6ff'; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(14, -66); ctx.lineTo(28, -46 - sw * 20); ctx.stroke();
        circ(ctx, 0, -96, 22, '#f4f6ff'); oval(ctx, 5, -96, 15, 12, 0, '#ffb627'); oval(ctx, 1, -100, 5, 3, 0, 'rgba(255,255,255,0.7)');
        ctx.fillStyle = '#e8524a'; ctx.fillRect(-12, -64, 10, 6);
      };
      const boot = (x, y, s) => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s * 0.45); ctx.fillStyle = '#8e8e9e'; rounded(ctx, -9, -20, 18, 40, 8); ctx.fill(); ctx.strokeStyle = '#a9a9b8'; ctx.lineWidth = 2.5; ctx.beginPath(); for (let j = -14; j <= 14; j += 6) { ctx.moveTo(-7, j); ctx.lineTo(7, j); } ctx.stroke(); ctx.restore(); };
      const moonBall = (x, y, r) => { circ(ctx, x, y, r, '#d9d6cf'); for (const [dx, dy, s] of [[-0.3, -0.25, 0.22], [0.35, 0.1, 0.16], [-0.05, 0.42, 0.13], [0.2, -0.45, 0.1]]) circ(ctx, x + dx * r, y + dy * r, s * r, '#b9b5ad'); };
      const earthBall = (x, y, r) => { circ(ctx, x, y, r, '#2f80ed'); ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip(); for (const [a, d, s] of [[0.3, 0.45, 0.42], [2.2, 0.5, 0.36], [3.9, 0.55, 0.3], [5.2, 0.4, 0.25]]) oval(ctx, x + Math.cos(a + k * 0.05) * d * r, y + Math.sin(a + k * 0.05) * d * r, s * r, s * r * 0.6, a, '#3fbf5f'); circ(ctx, x - r * 0.2, y - r * 0.75, r * 0.4, 'rgba(255,255,255,0.8)'); ctx.restore(); };
      const stars = () => { for (let j = 0; j < 46; j++) { const tw = 0.4 + 0.6 * Math.abs(Math.sin(k * (0.7 + rnd(j) * 2) + j)); circ(ctx, PX + rnd(j + 3) * PW, PY + rnd(j + 9) * PH, 1 + rnd(j + 1) * 1.6, `rgba(255,255,255,${0.7 * tw})`); } };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'A trip to the Moon');
      ctx.save(); clipRound(ctx, PX, PY, PW, PH);
      ctx.fillStyle = '#070b1f'; ctx.fillRect(PX, PY, PW, PH);
      ctx.globalAlpha *= ph === 0 ? smooth((4.2 - u) / 0.3) : ph === 1 ? smooth((u - 4.2) / 0.3) * smooth((9.2 - u) / 0.3) : smooth((u - 9.2) / 0.3) * smooth((16 - u) / 0.3);
      if (ph === 0) {
        const up = u < 2 ? 0 : (u - 2) ** 2 * 95; const dark = clamp(up / 500);
        scene(ctx, PX, PY, PW, PH, mix('#5fb6ff', '#0b1540', dark), mix('#c8ecff', '#2a3a7a', dark), 0);
        const gy = PY + 500; const rx = cx + 40;
        ctx.save(); ctx.translate(0, Math.min(up * 0.5, 300));
        ctx.fillStyle = '#6cc04a'; ctx.fillRect(PX, gy, PW, 200); ctx.fillStyle = '#9aa6c4'; ctx.fillRect(rx - 90, gy - 14, 180, 16);
        ctx.strokeStyle = '#e8524a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(rx - 110, gy - 14); ctx.lineTo(rx - 110, gy - 270); ctx.moveTo(rx - 80, gy - 14); ctx.lineTo(rx - 80, gy - 270); for (let y = gy - 14; y > gy - 270; y -= 32) { ctx.moveTo(rx - 110, y); ctx.lineTo(rx - 80, y - 32); } ctx.moveTo(rx - 80, gy - 200); ctx.lineTo(rx - 32, gy - 200); ctx.stroke();
        if (u > 1.7) for (let j = 0; j < 9; j++) { const q = mod(k * 0.9 + j / 9, 1); const sd = j % 2 ? 1 : -1; ctx.save(); ctx.globalAlpha *= (1 - q) * clamp((u - 1.7) * 2); circ(ctx, rx + sd * (20 + q * 150), gy - 10 - q * 30, 18 + q * 30, '#f2f4fa'); ctx.restore(); }
        ctx.restore();
        sc(ctx, rx, gy - 16 - up, 1, () => rocket(u > 1.6 ? clamp((u - 1.6) * 2) : 0));
        if (u < 2) { const n = 3 - Math.floor(u / 0.67); const q = mod(u, 0.67) / 0.67; sc(ctx, PX + 600, PY + 170, outBack(clamp(q / 0.3)), () => label(ctx, String(Math.max(1, n)), 0, 0, { size: 84, weight: 800, fill: '#ffffff' })); }
        else if (u < 3.4) sc(ctx, PX + 600, PY + 170, pop(u, 2, 0.4), () => label(ctx, 'Lift off!', 0, 0, { size: 48, weight: 800, fill: '#ffd23f' }));
      }
      if (ph === 1) {
        stars();
        const EXc = PX + 135; const EYc = PY + 470; const MX = PX + 650; const MY = PY + 140;
        earthBall(EXc, EYc, 110); moonBall(MX, MY, 56);
        const P0 = [PX + 215, PY + 395]; const C = [PX + 300, PY + 120]; const P1 = [MX - 66, MY + 10];
        ctx.save(); ctx.setLineDash([10, 12]); ctx.strokeStyle = 'rgba(200,215,255,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(P0[0], P0[1]); ctx.quadraticCurveTo(C[0], C[1], P1[0], P1[1]); ctx.stroke(); ctx.restore();
        const q = smooth((u - 4.5) / 4.3); const bz = (a, c2, d, s) => lerp(lerp(a, c2, s), lerp(c2, d, s), s);
        const x = bz(P0[0], C[0], P1[0], q); const y = bz(P0[1], C[1], P1[1], q); const x2 = bz(P0[0], C[0], P1[0], Math.min(1, q + 0.01)); const y2 = bz(P0[1], C[1], P1[1], Math.min(1, q + 0.01));
        const ang = Math.atan2(y2 - y, x2 - x) + PI / 2;
        sc(ctx, x, y, 0.42, () => { ctx.rotate(ang); ctx.translate(0, 100); rocket(0.6); });
        label(ctx, 'Earth', EXc, EYc - 132, { size: 24, weight: 800, fill: 'cyan' });
        label(ctx, 'Moon', MX, MY + 82, { size: 24, weight: 800, fill: '#e8e6df' });
        label(ctx, 'about 384,000 km', PX + 450, PY + 330, { size: 22, weight: 700, fill: 'muted' });
        const day = Math.min(3, 1 + Math.floor(q * 3));
        chip(ctx, `Day ${day}`, PX + 90, PY + 44, 'yellow', 26);
      }
      if (ph === 2) {
        stars();
        earthBall(PX + 140, PY + 115, 44); label(ctx, 'Earth', PX + 140, PY + 186, { size: 22, weight: 800, fill: 'cyan' });
        const gy = PY + 400;
        ctx.fillStyle = '#b9b7c2'; ctx.beginPath(); ctx.moveTo(PX, gy + 10); ctx.quadraticCurveTo(cx, gy - 30, PX + PW, gy + 10); ctx.lineTo(PX + PW, PY + PH); ctx.lineTo(PX, PY + PH); ctx.fill();
        for (const [x, y, r] of [[PX + 120, gy + 70, 46], [PX + 640, gy + 110, 38], [PX + 420, gy + 150, 28], [PX + 250, gy + 140, 20]]) { oval(ctx, x, y, r, r * 0.32, 0, '#a2a0ac'); oval(ctx, x, y - r * 0.06, r * 0.82, r * 0.22, 0, '#8f8d99'); }
        const LX = PX + 560; const land = smooth((u - 9.3) / 2);
        const ly = lerp(PY + 40, gy - 6, land);
        if (land < 1) { ctx.save(); ctx.globalAlpha *= 1 - land; ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(LX - 12, ly - 6); ctx.lineTo(LX, ly + 30); ctx.lineTo(LX + 12, ly - 6); ctx.fill(); ctx.restore(); }
        if (land > 0.98 && u < 12) for (let j = 0; j < 6; j++) { const q = clamp((u - 11.3) / 0.8); ctx.save(); ctx.globalAlpha *= (1 - q) * 0.8; circ(ctx, LX + (j - 2.5) * 22 * (1 + q * 2), gy - 4 - q * 12, 10 + q * 10, '#d6d4dd'); ctx.restore(); }
        ctx.save(); ctx.translate(LX, ly);
        ctx.strokeStyle = '#c9ccd8'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-26, -30); ctx.lineTo(-46, 0); ctx.moveTo(26, -30); ctx.lineTo(46, 0); ctx.moveTo(-52, 0); ctx.lineTo(-40, 0); ctx.moveTo(40, 0); ctx.lineTo(52, 0); ctx.stroke();
        ctx.fillStyle = '#e8b93c'; rounded(ctx, -34, -60, 68, 36, 6); ctx.fill(); ctx.fillStyle = '#d9dbe6'; poly(ctx, [-26, -60, -18, -92, 18, -92, 26, -60]); ctx.fill();
        circ(ctx, 0, -76, 8, '#3b4a7a'); ctx.strokeStyle = '#9aa0b5'; ctx.lineWidth = 3; ctx.beginPath(); for (let y = -24; y < 0; y += 6) { ctx.moveTo(-40, y); ctx.lineTo(-30, y); } ctx.stroke();
        ctx.restore();
        if (u > 11.5) {
          const q = clamp((u - 11.8) / 2.4); const ax = lerp(LX - 70, PX + 250, q); const hop = q > 0 && q < 1 ? Math.abs(Math.sin(q * PI * 5)) * 30 : 0;
          for (let j = 0; j < 5; j++) { const fq = (j + 0.5) / 5; if (q > fq + 0.02) { const fx = lerp(LX - 70, PX + 250, fq); boot(fx - 12, gy + 22, 1); boot(fx + 12, gy + 30, 1); } }
          sc(ctx, ax, gy + 14 - hop, pop(u, 11.5, 0.4) * 1.05, () => { ctx.scale(-1, 1); astronaut(k, q > 0 && q < 1 ? 1 : 0); });
          if (u > 14.2) { sc(ctx, PX + 330, gy - 120, pop(u, 14.2, 0.4), () => { ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.arc(0, 0, 62, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.stroke(); boot(0, 0, 2.4); }); line(ctx, PX + 330, gy - 58, PX + 330, gy + 4, 'rgba(255,210,63,0.7)', 3, [6, 6]); }
        }
      }
      ctx.restore();
      const say = ph === 0 ? (u < 2 ? '3, 2, 1...' : 'Lift off! The rocket roars up') : ph === 1 ? 'About 3 days to reach the Moon' : u < 11.6 ? 'The lander touches down' : u < 14.2 ? 'Bouncy steps: the Moon pulls gently' : 'No wind or rain, so footprints stay';
      chip(ctx, say, cx, Y1 - 28, ph === 0 ? 'orange' : ph === 1 ? 'yellow' : 'cyan');
      ctx.restore();
    },

    // ─── Animals and their homes ─────────────────────────────────────────

    // Desert, Arctic, rainforest and ocean side by side, each animal with
    // the body part that helps it live there.
    'habitats-compare'(b, ctx, it, t) {
      const k = b.clock; const P = 3; const u = cycle(t, P * 4, 0.8); const act = Math.floor(u / P) % 4; const env = bump((u - act * P) / P, 0.1);
      const PW = 385; const PH = 290; const PAN = [[X0 + 10, Y0 + 55], [X0 + 405, Y0 + 55], [X0 + 10, Y0 + 358], [X0 + 405, Y0 + 358]];
      const NAME = ['Desert', 'Arctic', 'Rainforest', 'Ocean'];
      const COL = ['orange', 'cyan', 'green', 'blue'];
      const FIT = ['Its hump stores fat', 'Thick fur keeps it warm', 'Its tail grips branches', 'Gills breathe in water'];
      const BG = [['#ffd27a', '#ffeccc'], ['#bcd8f5', '#eef6ff'], ['#2f8f4e', '#4fb35f'], ['#2b84d6', '#16508f']];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Animals fit their homes');
      PAN.forEach(([px, py], i) => {
        const on = i === act; const e = on ? env : 0; const gy = py + 230;
        ctx.save(); ctx.globalAlpha *= after(t, 0.15 + i * 0.18);
        ctx.save(); clipRound(ctx, px, py, PW, PH, 20);
        scene(ctx, px, py, PW, PH, BG[i][0], BG[i][1], 0);
        if (i === 0) {
          sun(ctx, px + 330, py + 70, 26, k, false);
          ctx.fillStyle = '#f0c27a'; ctx.beginPath(); ctx.moveTo(px, gy); ctx.quadraticCurveTo(px + 120, gy - 40, px + 230, gy); ctx.quadraticCurveTo(px + 320, gy - 30, px + PW, gy - 4); ctx.lineTo(px + PW, py + PH); ctx.lineTo(px, py + PH); ctx.fill();
          ctx.fillStyle = '#3f9f5a'; rounded(ctx, px + 46, gy - 86, 20, 92, 10); ctx.fill(); rounded(ctx, px + 24, gy - 64, 14, 36, 7); ctx.fill(); rounded(ctx, px + 72, gy - 72, 14, 30, 7); ctx.fill();
          const wx = px + 215 + Math.sin(k * 0.4) * 14;
          ctx.save(); ctx.translate(wx, gy + 6); ctx.scale(0.82, 0.82);
          const sw = Math.sin(k * 3) * 0.2;
          ctx.strokeStyle = '#c48a46'; ctx.lineWidth = 9; ctx.lineCap = 'round';
          for (const [lx, s2] of [[-40, sw], [-22, -sw], [30, -sw], [46, sw]]) { ctx.beginPath(); ctx.moveTo(lx, -76); ctx.lineTo(lx + Math.sin(s2) * 30, -76 + Math.cos(s2) * 76); ctx.stroke(); }
          oval(ctx, 0, -92, 64, 30, 0, '#d9a35b');
          oval(ctx, -6, -122, 36, 30, 0, mix('#d9a35b', '#ffd23f', e));
          ctx.strokeStyle = '#d9a35b'; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(48, -100); ctx.quadraticCurveTo(70, -112, 78, -150); ctx.stroke();
          oval(ctx, 94, -158, 26, 14, 0.1, '#d9a35b'); circ(ctx, 78, -170, 5, '#c48a46'); eye1(ctx, 96, -164, 4.5, k, 3, 1); smile(ctx, 110, -152, 6, '#7a4a12', 2);
          ctx.strokeStyle = '#c48a46'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-62, -96); ctx.quadraticCurveTo(-72, -80, -68, -66); ctx.stroke();
          ctx.restore();
          chip(ctx, 'hump', wx - 5, py + 82, 'orange', 22); line(ctx, wx - 5, py + 101, wx - 5, gy - 134, 'rgba(26,22,48,0.6)', 3);
        }
        if (i === 1) {
          for (let j = 0; j < 14; j++) { const x = px + mod(rnd(j) * PW + Math.sin(k + j) * 10, PW); const y = py + mod(rnd(j + 20) * PH + k * 30, PH); snowflake(ctx, x, y, 4 + 3 * rnd(j + 4), '#ffffff', k + j); }
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(px, gy - 6); ctx.lineTo(px + 260, gy - 14); ctx.lineTo(px + 290, gy + 10); ctx.lineTo(px, gy + 14); ctx.fill();
          ctx.fillStyle = '#3d7fc4'; ctx.fillRect(px, gy + 12, PW, 80); ctx.fillStyle = '#e6eef8'; poly(ctx, [px + 300, gy + 16, px + 330, gy + 4, px + 370, gy + 8, px + 380, gy + 20]); ctx.fill();
          const bx = px + 150; const by = gy - 8; const fc = mix('#f5f7ff', '#fff6c8', e);
          ctx.save(); ctx.translate(bx, by);
          for (const lx of [-46, -20, 26, 50]) { ctx.fillStyle = fc; rounded(ctx, lx - 13, -40, 26, 42, 11); ctx.fill(); }
          oval(ctx, 0, -50, 72, 40, 0, fc);
          ctx.strokeStyle = 'rgba(180,195,220,0.7)'; ctx.lineWidth = 2.5; ctx.beginPath(); for (let j = 0; j < 6; j++) { const x = -50 + j * 18; ctx.moveTo(x, -70); ctx.quadraticCurveTo(x + 6, -60, x + 2, -50); } ctx.stroke();
          const hb = Math.sin(k * 1.5) * 3;
          circ(ctx, 72, -66 + hb, 28, fc); circ(ctx, 56, -90 + hb, 8, fc); circ(ctx, 84, -92 + hb, 8, fc);
          oval(ctx, 94, -58 + hb, 14, 10, 0, '#eef0f8'); circ(ctx, 104, -62 + hb, 5, PUPIL); eye1(ctx, 78, -72 + hb, 4.5, k, 5, 1);
          ctx.restore();
          chip(ctx, 'thick fur', bx - 10, py + 90, 'cyan', 22); line(ctx, bx - 10, py + 109, bx - 10, by - 88, 'rgba(26,22,48,0.6)', 3);
        }
        if (i === 2) {
          for (const [x, r, c] of [[px + 40, 70, '#256f3c'], [px + 340, 80, '#2b7a43'], [px + 190, 60, '#317f47']]) circ(ctx, x, py + 20, r, c);
          ctx.fillStyle = '#6b4a2e'; ctx.fillRect(px + 330, py + 40, 22, PH); ctx.fillStyle = '#2a6b3c'; ctx.fillRect(px, gy + 18, PW, 60);
          ctx.strokeStyle = '#7a5434'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px + 30, py + 80); ctx.quadraticCurveTo(px + 200, py + 66, px + 340, py + 90); ctx.stroke();
          ctx.strokeStyle = '#3f9f4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px + 70, py + 80); ctx.quadraticCurveTo(px + 60, py + 160, px + 76, py + 230); ctx.moveTo(px + 300, py + 88); ctx.quadraticCurveTo(px + 310, py + 150, px + 296, py + 200); ctx.stroke();
          leaf(ctx, px + 90, py + 78, 36, 12, -0.6, '#4caf50'); leaf(ctx, px + 250, py + 82, 36, 12, -2.4, '#4caf50');
          const mx = px + 190; const my = py + 74; const swg = Math.sin(k * 1.8) * 0.22;
          ctx.save(); ctx.translate(mx, my); ctx.rotate(swg);
          ctx.strokeStyle = mix('#8a5426', '#ffd23f', e); ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, -2, 10, PI * 0.9, PI * 2.6); ctx.moveTo(10, 4); ctx.bezierCurveTo(26, 40, -24, 60, 0, 112); ctx.stroke();
          ctx.strokeStyle = '#8a5426'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-14, 92); ctx.lineTo(-30, 132); ctx.moveTo(14, 92); ctx.lineTo(30, 130); ctx.moveTo(-10, 138); ctx.lineTo(-18, 162); ctx.moveTo(10, 138); ctx.lineTo(18, 162); ctx.stroke();
          oval(ctx, 0, 120, 22, 28, 0, '#9c6233'); oval(ctx, 0, 126, 12, 16, 0, '#e8c39a');
          circ(ctx, -20, 72, 9, '#9c6233'); circ(ctx, 20, 72, 9, '#9c6233'); circ(ctx, 0, 76, 22, '#9c6233'); oval(ctx, 0, 80, 15, 13, 0, '#e8c39a');
          eyes(ctx, 0, 74, 14, 5, k, 7); smile(ctx, 0, 88, 5, '#5a3a24', 2);
          ctx.restore();
          chip(ctx, 'gripping tail', px + 310, py + 150, 'green', 22);
        }
        if (i === 3) {
          for (let j = 0; j < 4; j++) { const x = px + 30 + j * 105; ctx.strokeStyle = '#3fae5a'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x, py + PH); for (let s = 1; s <= 5; s++) ctx.lineTo(x + Math.sin(k * 1.5 + s + j) * 8, py + PH - s * 18); ctx.stroke(); }
          for (let j = 0; j < 6; j++) { const q = mod(k * 0.35 + j / 6, 1); circ(ctx, px + 120 + j * 9 + Math.sin(q * 9) * 5, py + 150 - q * 120, 3 + 3 * q, 'rgba(220,240,255,0.7)'); }
          const fx = px + 190 + Math.sin(k * 0.8) * 30; const fy = py + 150 + Math.sin(k * 1.3) * 8;
          ctx.save(); ctx.translate(fx, fy);
          ctx.fillStyle = '#ff7a3d'; ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(-86, -28 + Math.sin(k * 6) * 6); ctx.lineTo(-80, 0); ctx.lineTo(-86, 28 + Math.sin(k * 6) * 6); ctx.closePath(); ctx.fill();
          oval(ctx, 0, 0, 62, 36, 0, '#ff9f43'); ctx.fillStyle = '#ff7a3d'; poly(ctx, [-20, -32, 6, -52, 18, -32]); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-12, -34); ctx.quadraticCurveTo(-22, 0, -12, 34); ctx.stroke();
          const gl = 0.6 + 0.4 * Math.sin(k * 4); ctx.strokeStyle = mix('#c2410c', '#ffd23f', e); ctx.lineWidth = 4;
          for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.arc(30 - j * 9, 0, 18, PI * 0.62 - 0.1 * gl, PI * 1.38 + 0.1 * gl); ctx.stroke(); }
          eye1(ctx, 40, -8, 8, k, 9, 1); smile(ctx, 54, 10, 5, '#7a2e0e', 2.5);
          ctx.restore();
          chip(ctx, 'gills', fx + 22, fy + 70, 'blue', 22);
        }
        ctx.restore();
        ctx.strokeStyle = on ? color(COL[i]) : 'rgba(140,170,255,0.3)'; ctx.lineWidth = on ? 4 : 1.5; rounded(ctx, px, py, PW, PH, 20); ctx.stroke();
        chip(ctx, NAME[i], px + 12, py + 26, COL[i], 22, 'left');
        ctx.fillStyle = 'rgba(5,8,22,0.72)'; rounded(ctx, px + 8, py + PH - 46, PW - 16, 38, 14); ctx.fill();
        label(ctx, FIT[i], px + PW / 2, py + PH - 26, { size: 22, weight: on ? 800 : 700, fill: on ? COL[i] : 'ink' });
        ctx.restore();
      });
      chip(ctx, 'Each animal fits its home', cx, Y1 - 24, COL[act], 22);
      ctx.restore();
    },

    // Animals hidden in plain sight: a chameleon on a leaf, a stick insect
    // on twigs, an arctic hare in snow, a flatfish on sand; each is found.
    'camouflage-hunt'(b, ctx, it, t) {
      const k = b.clock; const D = 4.2; const u = cycle(t, D * 4, 0.6); const w = Math.floor(u / D) % 4; const f = (u - w * D) / D;
      const PX = X0 + 10; const PY = Y0 + 55; const PW = 780; const PH = 420;
      const NAME = ['Chameleon', 'Stick insect', 'Arctic hare', 'Flatfish'];
      const COL = ['green', 'orange', 'cyan', 'yellow'];
      const SAY = ['A chameleon can change its colour', 'A stick insect looks like a twig', 'White fur hides in the snow', 'A flatfish matches the sandy floor'];
      const AT = [[cx + 30, PY + 240], [cx - 40, PY + 205], [cx + 120, PY + 300], [cx - 60, PY + 260]];
      const found = smooth((f - 0.6) / 0.08);
      const outline = (fn) => { if (found <= 0.01) return; ctx.save(); ctx.globalAlpha *= found * (0.75 + 0.25 * Math.sin(k * 6)); ctx.strokeStyle = '#fff36b'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; fn(); ctx.stroke(); ctx.restore(); };
      // The animals, each drawn at the origin; mode 0 = in hiding colours.
      const cham = (x, y, s, col, roll) => {
        ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
        const body = () => { ctx.beginPath(); ctx.moveTo(-70, 0); ctx.bezierCurveTo(-70, -46, 40, -58, 62, -18); ctx.lineTo(96, -8); ctx.quadraticCurveTo(92, 14, 60, 14); ctx.bezierCurveTo(30, 30, -40, 30, -70, 0); ctx.closePath(); };
        ctx.strokeStyle = col; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-66, 4); ctx.bezierCurveTo(-110, 10, -120, 60, -92, 66); ctx.arc(-98, 54, 12, PI * 0.3, PI * 2.1); ctx.stroke();
        ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-36, 18); ctx.lineTo(-48, 40); ctx.moveTo(30, 18); ctx.lineTo(40, 40); ctx.stroke();
        body(); ctx.fillStyle = col; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 3; ctx.beginPath(); for (let j = 0; j < 4; j++) { ctx.moveTo(-40 + j * 22, -24); ctx.lineTo(-30 + j * 22, 14); } ctx.stroke();
        circ(ctx, 66, -14, 13, col); circ(ctx, 66, -14, 9, '#ffffff'); circ(ctx, 66 + Math.cos(roll) * 4, -14 + Math.sin(roll) * 4, 4.5, PUPIL);
        ctx.restore();
        return () => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); body(); ctx.restore(); };
      };
      const stick = (x, y, s, walk) => {
        ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.18);
        ctx.strokeStyle = '#8b6b3e'; ctx.lineCap = 'round'; ctx.lineWidth = 3.5; ctx.beginPath();
        for (const [lx, sd] of [[-50, 1], [-10, 1], [40, 1], [-50, -1], [-10, -1], [40, -1]]) { const sw = Math.sin(k * 8 + lx) * 6 * walk; ctx.moveTo(lx, 0); ctx.lineTo(lx + 16 + sw, sd * 26); ctx.lineTo(lx + 30 + sw, sd * 30); }
        ctx.moveTo(92, -2); ctx.lineTo(130, -20); ctx.moveTo(92, 2); ctx.lineTo(130, 16); ctx.stroke();
        ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-110, 0); ctx.lineTo(88, 0); ctx.stroke(); circ(ctx, 92, 0, 7, '#8b6b3e');
        if (walk) { circ(ctx, 95, -3, 2.4, '#ffffff'); }
        ctx.restore();
        return () => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.18); ctx.beginPath(); ctx.moveTo(-116, 0); ctx.lineTo(100, 0); ctx.restore(); };
      };
      const hare = (x, y, s) => {
        ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
        const body = () => { ctx.beginPath(); ctx.ellipse(0, 0, 56, 38, 0, 0, TAU); ctx.moveTo(78, -22); ctx.arc(52, -22, 26, 0, TAU); };
        for (const [ex, a] of [[44, -0.35], [58, -0.12]]) { ctx.save(); ctx.translate(ex, -40); ctx.rotate(a); oval(ctx, 0, -30, 9, 32, 0, '#ffffff'); ctx.beginPath(); ctx.ellipse(0, -30, 9, 32, 0, PI * 1.25, PI * 1.75); ctx.fillStyle = PUPIL; ctx.fill(); ctx.restore(); }
        body(); ctx.fillStyle = '#ffffff'; ctx.fill(); circ(ctx, -54, -6, 12, '#ffffff');
        ctx.strokeStyle = 'rgba(200,215,235,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-6, 6, 30, PI * 0.2, PI * 0.8); ctx.stroke();
        eye1(ctx, 60, -28, 5.5, k, 8, 1); circ(ctx, 77, -18, 3.5, '#ff8fab');
        ctx.restore();
        return () => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); body(); ctx.restore(); };
      };
      const flat = (x, y, s, rip) => {
        ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
        const body = () => { ctx.beginPath(); ctx.ellipse(0, 0, 92, 50, 0, 0, TAU); ctx.moveTo(-88, 0); ctx.lineTo(-128, -26); ctx.quadraticCurveTo(-118, 0, -128, 26); ctx.closePath(); };
        ctx.fillStyle = '#d6b47a'; ctx.beginPath(); for (let j = 0; j <= 24; j++) { const a = (j / 24) * TAU; const rr = 1 + 0.12 + 0.05 * Math.sin(j * 2 + k * 6 * rip); const px = Math.cos(a) * 92 * rr; const py = Math.sin(a) * 50 * rr; if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.fill();
        body(); ctx.fillStyle = '#dcbc84'; ctx.fill();
        for (let j = 0; j < 16; j++) circ(ctx, -70 + rnd(j + 60) * 140, -34 + rnd(j + 80) * 68, 4 + 4 * rnd(j + 7), j % 2 ? '#c9a46a' : '#efd6a4');
        for (const [ex, ey] of [[56, -16], [66, 6]]) { circ(ctx, ex, ey, 8, '#efd6a4'); eye1(ctx, ex, ey, 5.5, k, 11 + ey, 1); }
        ctx.restore();
        return () => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); body(); ctx.restore(); };
      };
      const scenery = (i, x0, y0, w, h) => {
        if (i === 0) {
          scene(ctx, x0, y0, w, h, '#2f7a3c', '#1f5a2c', 0);
          for (let j = 0; j < 6; j++) leaf(ctx, x0 + rnd(j + 1) * w, y0 + rnd(j + 5) * h, 120 * (h / PH), 40 * (h / PH), rnd(j + 9) * 6, j % 2 ? '#3d9446' : '#2f8a3c');
          leaf(ctx, x0 + w * 0.08, y0 + h * 0.72, w * 0.9, h * 0.36, -0.18, '#66bb46');
        } else if (i === 1) {
          scene(ctx, x0, y0, w, h, '#b9d48e', '#8fb466', 0);
          ctx.strokeStyle = '#8b6b3e'; ctx.lineCap = 'round';
          for (const [ax, ay, bx2, by2, lw] of [[0.02, 0.3, 0.6, 0.18, 12], [0.3, 0.85, 0.95, 0.55, 12], [0.55, 0.95, 0.35, 0.1, 13], [0.7, 0.25, 0.98, 0.3, 9], [0.1, 0.62, 0.42, 0.66, 9]]) { ctx.lineWidth = lw * (h / PH); ctx.beginPath(); ctx.moveTo(x0 + ax * w, y0 + ay * h); ctx.lineTo(x0 + bx2 * w, y0 + by2 * h); ctx.stroke(); }
          for (let j = 0; j < 5; j++) leaf(ctx, x0 + rnd(j + 21) * w, y0 + rnd(j + 25) * h, 50 * (h / PH), 18 * (h / PH), rnd(j) * 6, '#6aa84a');
        } else if (i === 2) {
          scene(ctx, x0, y0, w, h, '#d5e3f3', '#f4f8ff', 0);
          for (const [ax, ay, rx2, ry2] of [[0.2, 0.75, 0.35, 0.22], [0.75, 0.8, 0.4, 0.25], [0.5, 0.95, 0.6, 0.2]]) { oval(ctx, x0 + ax * w, y0 + ay * h, rx2 * w, ry2 * h, 0, '#ffffff'); oval(ctx, x0 + ax * w, y0 + ay * h + ry2 * h * 0.35, rx2 * w * 0.9, ry2 * h * 0.5, 0, '#e8eff9'); }
        } else {
          scene(ctx, x0, y0, w, h, '#9fd0e8', '#e3c58f', 0);
          ctx.fillStyle = '#e2c28c'; ctx.fillRect(x0, y0 + h * 0.3, w, h);
          for (let j = 0; j < 60; j++) circ(ctx, x0 + rnd(j + 100) * w, y0 + h * 0.32 + rnd(j + 200) * h * 0.68, (3 + 5 * rnd(j + 300)) * (h / PH), j % 3 === 0 ? '#c9a46a' : j % 3 === 1 ? '#efd6a4' : '#d1b075');
        }
      };
      const animal = (i, x, y, s, fnd) => {
        if (i === 0) { const c = fnd > 0 ? '#5fb84a' : mix('#ff9f43', '#62b844', smooth((f - 0.08) / 0.32)); return cham(x, y, s, c, k * 3 * fnd); }
        if (i === 1) return stick(x, y, s, fnd > 0 ? 1 : 0);
        if (i === 2) return hare(x, y, s);
        return flat(x, y, s, fnd);
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Animals that hide');
      ctx.save(); clipRound(ctx, PX, PY, PW, PH);
      ctx.fillStyle = '#0b1230'; ctx.fillRect(PX, PY, PW, PH);
      ctx.globalAlpha *= smooth(f / 0.05) * smooth((1 - f) / 0.04);
      scenery(w, PX, PY, PW, PH);
      const [ax, ay] = AT[w];
      const path = animal(w, ax, ay, 1.15, found);
      outline(path);
      // The magnifying glass searches, then settles on the animal.
      const sx = cx + Math.sin(k * 1.1) * 250; const sy = PY + 210 + Math.sin(k * 1.7) * 110; const set = smooth((f - 0.45) / 0.15);
      const gx = lerp(sx, ax + 10, set); const gy2 = lerp(sy, ay - 10, set);
      ctx.save(); ctx.globalAlpha *= 1 - found * 0.6;
      ctx.strokeStyle = '#3b2f5c'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(gx + 52, gy2 + 52); ctx.lineTo(gx + 96, gy2 + 96); ctx.stroke();
      circ(ctx, gx, gy2, 66, 'rgba(255,255,255,0.14)', '#3b2f5c', 9);
      ctx.restore();
      ctx.restore();
      chip(ctx, found > 0.5 ? 'Found it!' : f < 0.4 && w === 0 ? 'Watch it change colour!' : 'Can you spot it?', cx, PY + 34, found > 0.5 ? 'green' : 'ink', 24);
      // The four animals.
      for (let j = 0; j < 4; j++) {
        const x = cx + (j - 1.5) * 192; const y0 = Y0 + 495; const on = j === w; const done = j < w || (j === w && found > 0.5);
        card(ctx, x - 88, y0, 176, 118, COL[j], on);
        ctx.save(); rounded(ctx, x - 80, y0 + 8, 160, 70, 12); ctx.clip(); scenery(j, x - 80, y0 + 8, 160, 70); animal(j, x, y0 + 46, 0.36, 1); ctx.restore();
        label(ctx, NAME[j], x, y0 + 96, { size: 22, weight: on ? 800 : 600, fill: on ? COL[j] : 'ink' });
        if (done) { circ(ctx, x + 74, y0 + 10, 15, '#34d399'); tick(ctx, x + 74, y0 + 11, 16, '#0b2a1c'); }
      }
      chip(ctx, SAY[w], cx, Y1 - 30, COL[w]);
      ctx.restore();
    },

    // ─── The Earth's big moments ─────────────────────────────────────────

    // Two plates push, stick, then slip; shaking spreads from the slip and
    // a toy house wobbles; then what to do: drop, cover, hold on.
    'earthquake-shake'(b, ctx, it, t) {
      const k = b.clock; const T = 9.5; const u = cycle(t, T, 0.6); const TS = 3.6;
      const PX = X0 + 10; const PY = Y0 + 55; const PW = 780; const PH = 400; const gy = PY + 160;
      const FX0 = cx + 20; const FX1 = cx - 70; const FB = PY + PH;
      const build = u < TS ? smooth(u / TS) : 0; const since = u - TS;
      const slip = u >= TS ? 1 - smooth((u - (T - 1.2)) / 1.0) : 0;
      const amp = since > 0.35 ? 11 * Math.exp(-(since - 0.35) * 0.9) * (u < T - 1.2 ? 1 : 0) : 0;
      const st = u < TS ? 0 : since < 0.6 ? 1 : u < T - 1.6 ? 2 : 3;
      const COL = ['orange', 'red', 'yellow', 'green'];
      const SAY = ["The Earth's plates push and push", 'Snap! The plates slip', 'The shaking spreads out', 'Then it stops. Stay calm!'];
      const focus = [lerp(FX0, FX1, 0.55), lerp(gy, FB, 0.55)];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Why the ground shakes');
      ctx.save(); clipRound(ctx, PX, PY, PW, PH);
      const shx = amp ? Math.sin(k * 31) * amp * 0.5 : 0;
      scene(ctx, PX, PY, PW, gy - PY + 6, '#8fd3ff', '#d8f1ff', 0);
      cloud(ctx, PX + 600, PY + 50, 0.7, '#ffffff');
      // The plates, with rock layers that bend, then jump.
      const plate = (side) => {
        ctx.save();
        if (side < 0) poly(ctx, [PX, gy, FX0, gy, FX1, FB, PX, FB]); else poly(ctx, [FX0, gy, PX + PW, gy, PX + PW, FB, FX1, FB]);
        ctx.fillStyle = side < 0 ? '#a8754a' : '#9a6a42'; ctx.fill(); ctx.clip();
        const BANDS = ['#c48d5a', '#8a5a36', '#b98250', '#7a4e2e'];
        BANDS.forEach((c, j) => {
          const y0 = gy + 34 + j * 58; ctx.fillStyle = c; ctx.beginPath();
          for (let x = PX; x <= PX + PW; x += 20) { const fxAt = lerp(FX0, FX1, (y0 - gy) / (FB - gy)); const d = Math.abs(x - fxAt); const bend = build * 16 * Math.exp(-d / 140) * (side < 0 ? 1 : -1); const y = y0 + bend + (side > 0 ? -14 * slip : 0) + shx * 0.3; if (x === PX) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
          for (let x = PX + PW; x >= PX; x -= 20) { const fxAt = lerp(FX0, FX1, (y0 - gy) / (FB - gy)); const d = Math.abs(x - fxAt); const bend = build * 16 * Math.exp(-d / 140) * (side < 0 ? 1 : -1); ctx.lineTo(x, y0 + 26 + bend + (side > 0 ? -14 * slip : 0) + shx * 0.3); }
          ctx.fill();
        });
        ctx.restore();
      };
      plate(-1); plate(1);
      ctx.strokeStyle = '#3b2414'; ctx.lineWidth = 4; ctx.setLineDash([12, 8]); ctx.beginPath(); ctx.moveTo(FX0, gy); ctx.lineTo(FX1, FB); ctx.stroke(); ctx.setLineDash([]);
      // Push arrows.
      if (u < TS + 0.3) { ctx.save(); ctx.globalAlpha *= (0.55 + 0.45 * Math.sin(k * 6)) * clamp(u * 2) * (1 - smooth((u - TS) / 0.3)); arr(ctx, PX + 60, gy + 150, PX + 200 + build * 30, gy + 150, '#ffffff', 10); arr(ctx, PX + PW - 60, gy + 150, PX + PW - 200 - build * 30, gy + 150, '#ffffff', 10); ctx.restore(); }
      // The slip and the waves spreading out.
      if (since > 0) {
        if (since < 0.7) sc(ctx, focus[0], focus[1], pop(since, 0, 0.25) * (1 - smooth((since - 0.45) / 0.25)), () => { starPath(ctx, 0, 0, 40, 18, 8); ctx.fillStyle = '#ffd23f'; ctx.fill(); });
        for (let j = 0; j < 4; j++) { const e = since - j * 0.32; if (e <= 0 || u > T - 1.2) continue; const r = e * 260; ctx.strokeStyle = `rgba(255,236,140,${clamp(0.9 - r / 600)})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(focus[0], focus[1], r, 0, TAU); ctx.stroke(); }
      }
      // Grass, a toy house and a tree on top.
      ctx.fillStyle = '#5fbf47'; ctx.beginPath(); ctx.moveTo(PX, gy + 8); for (let x = PX; x <= PX + PW; x += 16) ctx.lineTo(x, gy - 4 + Math.sin(x * 0.06 + k * 22) * amp * 0.35); ctx.lineTo(PX + PW, gy + 8); ctx.closePath(); ctx.fill();
      const wob = amp ? Math.sin(k * 24) * amp * 0.012 : 0;
      ctx.save(); ctx.translate(PX + 175 + shx, gy - 2); ctx.rotate(wob);
      ctx.fillStyle = '#ffe2b8'; ctx.fillRect(-48, -66, 96, 66); ctx.fillStyle = '#e8524a'; poly(ctx, [-62, -62, 0, -112, 62, -62]); ctx.fill();
      ctx.fillStyle = '#9fd8ff'; ctx.fillRect(-34, -50, 22, 20); ctx.fillStyle = '#8a5a22'; ctx.fillRect(10, -40, 20, 40);
      ctx.restore();
      ctx.save(); ctx.translate(PX + 620 + shx * 0.8, gy - 2); ctx.rotate(-wob * 1.4);
      ctx.fillStyle = '#8d6e4f'; ctx.fillRect(-9, -74, 18, 76); for (const [dx, dy, r] of [[0, -110, 40], [-30, -88, 30], [30, -88, 30]]) circ(ctx, dx, dy, r, '#2e9e48');
      ctx.restore();
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= after(t, 0.5);
      chip(ctx, 'Plate', PX + 110, FB - 34, 'ink', 22); chip(ctx, 'Plate', PX + PW - 110, FB - 34, 'ink', 22);
      if (st === 0) label(ctx, 'push', PX + 130, gy + 120, { size: 24, weight: 800, fill: '#ffffff' });
      if (st === 0) label(ctx, 'push', PX + PW - 130, gy + 120, { size: 24, weight: 800, fill: '#ffffff' });
      if (st === 1) chip(ctx, 'Slip!', focus[0] + 90, focus[1] - 40, 'red', 24);
      ctx.restore();
      // What to do.
      label(ctx, 'If the ground shakes:', cx, Y0 + 478, { size: 24, weight: 800, fill: 'ink' });
      const ci = since > 0.6 && u < T - 1.2 ? Math.min(2, Math.floor((since - 0.6) / 1.4)) : -1;
      ['Drop', 'Cover', 'Hold on'].forEach((nm, j) => {
        const x = cx + (j - 1) * 262; const y0 = Y0 + 497; const on = j === ci;
        card(ctx, x - 122, y0, 244, 140, 'green', on);
        const gx = x; const gyy = y0 + 92; const jig = on && j === 2 ? Math.sin(k * 28) * 2 : 0;
        if (j > 0) { ctx.fillStyle = '#b07a4a'; ctx.fillRect(gx - 70 + jig, gyy - 58, 140, 12); ctx.fillRect(gx - 64 + jig, gyy - 48, 9, 50); ctx.fillRect(gx + 55 + jig, gyy - 48, 9, 50); }
        ctx.save(); ctx.translate(gx - 6, gyy);
        oval(ctx, -2, -16, 28, 16, 0, '#5b8cff'); circ(ctx, 26, -22, 13, SKIN); ctx.fillStyle = HAIR; ctx.beginPath(); ctx.arc(26, -24, 13, PI * 1.0, PI * 1.9); ctx.fill(); circ(ctx, 31, -21, 1.8, PUPIL);
        ctx.strokeStyle = SKIN; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath();
        if (j === 2) { ctx.moveTo(12, -22); ctx.lineTo(42, -40); ctx.lineTo(56, -40); } else if (j === 1) { ctx.moveTo(16, -26); ctx.lineTo(30, -38); ctx.lineTo(24, -36); } else { ctx.moveTo(14, -10); ctx.lineTo(18, 0); }
        ctx.stroke(); ctx.strokeStyle = '#3b4a7a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-22, -6); ctx.lineTo(-10, 2); ctx.moveTo(-26, -10); ctx.lineTo(-38, 0); ctx.stroke();
        ctx.restore();
        if (j === 0) { arr(ctx, gx + 70, gyy - 66, gx + 70, gyy - 20, 'green', 5); }
        label(ctx, nm, x, y0 + 120, { size: 24, weight: 800, fill: on ? 'green' : 'ink' });
      });
      chip(ctx, SAY[st], cx, Y1 - 24, COL[st], 22);
      ctx.restore();
    },

    // Warm, wet air rises, cool air rushes in, the air starts to spin and
    // a funnel reaches down from the storm cloud; calm safety tips below.
    tornado(b, ctx, it, t) {
      const k = b.clock; const T = 13; const u = cycle(t, T, 0.5);
      const PX = X0 + 10; const PY = Y0 + 55; const PW = 780; const PH = 480; const gy = PY + 425;
      const warm = smooth(u / 0.8) * (1 - smooth((u - 9) / 1)); const cool = smooth((u - 2.8) / 0.8) * (1 - smooth((u - 9) / 1));
      const spin = smooth((u - 5.2) / 0.8) * (1 - smooth((u - 12) / 0.8)); const grow = smooth((u - 7.6) / 2.2) * (1 - smooth((u - 11.8) / 1));
      const st = u < 2.8 ? 0 : u < 5.2 ? 1 : u < 7.6 ? 2 : u < 11.8 ? 3 : 4;
      const COL = ['orange', 'cyan', 'purple', 'yellow', 'green'];
      const SAY = ['Warm, wet air rises', 'Cool air rushes in', 'The air starts to spin', 'A spinning funnel reaches down', 'Then it slows and fades away'];
      const fx = cx + 10; const top = PY + 168; const bot = lerp(top + 20, gy, grow); const sway = Math.sin(k * 0.8) * 26 * grow;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'How a tornado forms');
      ctx.save(); clipRound(ctx, PX, PY, PW, PH);
      scene(ctx, PX, PY, PW, PH, '#6f7f9c', '#c3cedd', 0);
      ctx.fillStyle = '#7cb35a'; ctx.fillRect(PX, gy, PW, PH); ctx.fillStyle = '#6aa04a'; for (let j = 0; j < 8; j++) ctx.fillRect(PX, gy + 8 + j * 14, PW, 3);
      // A barn and a fence far away.
      ctx.fillStyle = '#c0453b'; ctx.fillRect(PX + 660, gy - 46, 64, 46); poly(ctx, [PX + 652, gy - 44, PX + 692, gy - 76, PX + 732, gy - 44]); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(PX + 684, gy - 26, 16, 26);
      ctx.strokeStyle = '#e8dcc8'; ctx.lineWidth = 3; ctx.beginPath(); for (let x = PX + 20; x < PX + 200; x += 26) { ctx.moveTo(x, gy); ctx.lineTo(x, gy - 22); } ctx.moveTo(PX + 20, gy - 14); ctx.lineTo(PX + 200, gy - 14); ctx.stroke();
      // Warm air rising.
      if (warm > 0.01) {
        ctx.save(); ctx.globalAlpha *= warm;
        for (let j = 0; j < 3; j++) {
          const x0 = PX + 190 + j * 80; ctx.strokeStyle = '#ffa24d'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.setLineDash([18, 12]); ctx.lineDashOffset = k * 50; ctx.beginPath();
          for (let s = 0; s <= 20; s++) { const y = gy - 20 - s * 11; const x = x0 + Math.sin(s * 0.6 + j) * 9 + s * 4; if (s) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
          ctx.stroke(); ctx.setLineDash([]); head(ctx, x0 + 80 + Math.sin(12 + j) * 9, gy - 246, -PI / 2 + 0.35, 14, '#ffa24d');
        }
        ctx.restore();
      }
      // Cool air rushing in.
      if (cool > 0.01) {
        ctx.save(); ctx.globalAlpha *= cool;
        for (let j = 0; j < 3; j++) { const y = PY + 260 + j * 38; ctx.strokeStyle = '#7cd3ff'; ctx.lineWidth = 6; ctx.setLineDash([22, 12]); ctx.lineDashOffset = k * 60; ctx.beginPath(); ctx.moveTo(PX + PW - 30, y); ctx.lineTo(PX + 500 - j * 20, y + 4); ctx.stroke(); ctx.setLineDash([]); head(ctx, PX + 492 - j * 20, y + 4, PI, 14, '#7cd3ff'); }
        ctx.restore();
      }
      // The funnel.
      if (grow > 0.01) {
        const tw = 92; const bw = lerp(60, 20, grow);
        ctx.save();
        const g = ctx.createLinearGradient(fx - tw, 0, fx + tw, 0); g.addColorStop(0, '#8a92a6'); g.addColorStop(0.5, '#b8bfcd'); g.addColorStop(1, '#7d8599'); ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(fx - tw, top); ctx.bezierCurveTo(fx - tw * 0.4, top + (bot - top) * 0.3, fx - bw + sway * 0.6, bot - (bot - top) * 0.3, fx - bw + sway, bot);
        ctx.lineTo(fx + bw + sway, bot); ctx.bezierCurveTo(fx + bw + sway * 0.6, bot - (bot - top) * 0.3, fx + tw * 0.4, top + (bot - top) * 0.3, fx + tw, top); ctx.closePath(); ctx.fill(); ctx.clip();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3;
        for (let j = 0; j < 9; j++) { const q = mod(j / 9 + k * 0.6, 1); const y = lerp(top, bot, q); const wdt = lerp(tw, bw, Math.pow(q, 0.7)) + 10; const xc = fx + sway * Math.pow(q, 1.5); ctx.beginPath(); ctx.ellipse(xc, y, wdt, 7, 0, 0.1, PI - 0.1); ctx.stroke(); }
        ctx.restore();
        if (grow > 0.85) { const dq = smooth((grow - 0.85) / 0.15); ctx.save(); ctx.globalAlpha *= dq; oval(ctx, fx + sway, gy - 8, 90, 22, 0, 'rgba(150,110,70,0.55)'); for (let j = 0; j < 14; j++) { const a = k * 5 + j * 0.9; const rr = 40 + rnd(j) * 60; circ(ctx, fx + sway + Math.cos(a) * rr, gy - 14 - rnd(j + 3) * 40 + Math.sin(a) * 8, 3 + rnd(j + 1) * 3, '#8a6a4a'); } ctx.restore(); }
      }
      // Spinning air under the cloud.
      if (spin > 0.01) {
        ctx.save(); ctx.globalAlpha *= spin;
        for (let j = 0; j < 3; j++) { const a0 = k * 2.4 + (j * TAU) / 3; ctx.strokeStyle = '#d7c8ff'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.ellipse(fx, PY + 200, 150, 28, 0, a0, a0 + 1.4); ctx.stroke(); const ea = a0 + 1.4; head(ctx, fx + Math.cos(ea) * 150, PY + 200 + Math.sin(ea) * 28, ea + PI / 2, 13, '#d7c8ff'); }
        ctx.restore();
      }
      // The storm cloud.
      for (const [dx, dy, r, c] of [[-300, 40, 70, '#4b5470'], [-200, 20, 80, '#545d7a'], [-90, 10, 90, '#4b5470'], [30, 0, 96, '#545d7a'], [150, 16, 86, '#4b5470'], [260, 30, 76, '#545d7a'], [360, 46, 64, '#4b5470'], [-30, 70, 80, '#5c6683'], [110, 76, 70, '#5c6683'], [-160, 74, 64, '#5c6683']]) circ(ctx, cx + dx, PY + dy, r, c);
      oval(ctx, fx, top - 8, 120, 26, 0, '#5c6683');
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= warm; chip(ctx, 'Warm air', PX + 240, gy + 26, 'orange', 22); ctx.restore();
      ctx.save(); ctx.globalAlpha *= cool; chip(ctx, 'Cool air', PX + 650, PY + 220, 'cyan', 22); ctx.restore();
      ctx.save(); ctx.globalAlpha *= spin * (1 - grow * 0.9); chip(ctx, 'Spin!', fx + 230, PY + 200, 'purple', 22); ctx.restore();
      // Calm safety card.
      card(ctx, X0 + 20, Y0 + 548, 760, 92, 'green', true);
      ctx.save(); ctx.translate(X0 + 82, Y0 + 610);
      ctx.fillStyle = '#ffe2b8'; ctx.fillRect(-34, -44, 68, 44); ctx.fillStyle = '#e8524a'; poly(ctx, [-44, -42, 0, -74, 44, -42]); ctx.fill();
      ctx.fillStyle = '#c7a27a'; ctx.fillRect(-28, -18, 56, 18); circ(ctx, 0, -10, 6, SKIN); ctx.fillStyle = '#5b8cff'; ctx.fillRect(-5, -5, 10, 5);
      ctx.restore();
      label(ctx, 'Tornadoes are rare, and we get warnings.', X0 + 140, Y0 + 576, { size: 22, weight: 700, fill: 'ink', align: 'left' });
      label(ctx, 'Safe spot: a low room inside, no windows.', X0 + 140, Y0 + 612, { size: 22, weight: 700, fill: 'green', align: 'left' });
      chip(ctx, SAY[st], cx, Y1 - 26, COL[st], 22);
      ctx.restore();
    },

    // Long ago a dinosaur lies down by a lake; mud and layers bury its
    // bones; over millions of years they turn to stone; today a
    // palaeontologist digs them out with a brush.
    'fossil-dig'(b, ctx, it, t) {
      const k = b.clock; const T = 18; const u = cycle(t, T, 0.5);
      const PX = X0 + 10; const PY = Y0 + 55; const PW = 780; const PH = 500; const gy0 = PY + 372;
      const st = u < 3.2 ? 0 : u < 5.8 ? 1 : u < 9.8 ? 2 : u < 12 ? 3 : 4;
      const COL = ['green', 'orange', 'yellow', 'purple', 'cyan'];
      const SAY = ['Long, long ago, a dinosaur lived here', 'When it died, mud covered its bones', 'Layer on layer, millions of years pass', 'Slowly the bones turn to stone', 'Today a palaeontologist digs it out!'];
      const mud = smooth((u - 4.2) / 1.2); const LAY = [0, 1, 2, 3].map((i) => smooth((u - 5.9 - i * 0.9) / 0.8));
      const LH = 34; const surf = gy0 - 26 * mud - LAY.reduce((a, c) => a + c * LH, 0);
      const stone = smooth((u - 9.9) / 1.8); const dig = smooth((u - 12.2) / 1.8);
      const bx = cx - 20; const by = gy0 - 14;
      const alive = 1 - smooth((u - 3.6) / 1); const bones = smooth((u - 3.9) / 1);
      const boneC = mix('#fff3d6', '#9a8f84', stone);
      const skeleton = () => {
        ctx.strokeStyle = boneC; ctx.fillStyle = boneC; ctx.lineCap = 'round'; ctx.lineWidth = 7;
        ctx.beginPath(); for (let j = 0; j <= 8; j++) { const x = -40 + j * 13; const y = -20 - Math.sin((j / 8) * PI) * 6; ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10, y + 18, x + 6, y + 32); } ctx.stroke();
        for (let j = 0; j < 22; j++) { const q = j / 21; const x = lerp(-210, 150, q); const y = q < 0.3 ? lerp(4, -24, q / 0.3) : q < 0.75 ? -24 - Math.sin(((q - 0.3) / 0.45) * PI) * 6 : lerp(-24, -36, (q - 0.75) / 0.25); circ(ctx, x, y, q < 0.3 ? 3 + q * 12 : 7, boneC); }
        ctx.beginPath(); ctx.moveTo(150, -36); ctx.quadraticCurveTo(178, -52, 200, -38); ctx.quadraticCurveTo(212, -26, 196, -22); ctx.quadraticCurveTo(176, -18, 160, -26); ctx.closePath(); ctx.fill(); circ(ctx, 184, -38, 5, '#5a4636');
        ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-48, -14); ctx.lineTo(-30, 8); ctx.lineTo(-8, 14); ctx.moveTo(52, -16); ctx.lineTo(68, 8); ctx.lineTo(90, 12); ctx.stroke();
        oval(ctx, -50, -16, 20, 13, 0.1, boneC);
        if (stone > 0.05) { ctx.save(); ctx.globalAlpha *= stone * (0.5 + 0.5 * Math.sin(k * 4)); for (let j = 0; j < 5; j++) { starPath(ctx, -160 + j * 80, -50 + (j % 2) * 20, 9, 3.5, 4); ctx.fillStyle = '#fff6c4'; ctx.fill(); } ctx.restore(); }
      };
      const dino = (closed) => {
        ctx.fillStyle = '#6cc04a'; ctx.beginPath(); ctx.moveTo(-60, -66); ctx.quadraticCurveTo(-150, -50, -220, -30); ctx.quadraticCurveTo(-150, -32, -60, -38); ctx.fill();
        for (const [lx, ph] of [[-44, 0], [-14, PI], [30, PI], [56, 0]]) { const sw = closed ? 0 : Math.sin(k * 6 + ph) * 6; ctx.fillStyle = '#5aae3c'; rounded(ctx, lx - 11 + sw, -50, 22, 52, 9); ctx.fill(); }
        oval(ctx, 0, -64, 82, 40, 0, '#6cc04a');
        ctx.strokeStyle = '#6cc04a'; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(56, -80); ctx.quadraticCurveTo(100, -110, 118, -160); ctx.stroke();
        oval(ctx, 134, -166, 28, 17, 0.15, '#6cc04a');
        for (const [sx, sy, r] of [[-30, -78, 8], [6, -88, 7], [30, -70, 6], [-56, -62, 6]]) circ(ctx, sx, sy, r, '#8ee05a');
        if (closed) { ctx.strokeStyle = PUPIL; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(140, -172, 5, 0.2, PI - 0.2); ctx.stroke(); } else eye1(ctx, 140, -172, 6, k, 3, 1);
        smile(ctx, 152, -160, 7, '#2f6e1f', 2.5);
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'How fossils form');
      ctx.save(); clipRound(ctx, PX, PY, PW, PH);
      scene(ctx, PX, PY, PW, PH, st >= 4 ? '#8fd3ff' : '#ffc98a', st >= 4 ? '#e2f6ff' : '#ffe9c9', 0);
      // Deep rock.
      ctx.fillStyle = '#6d5036'; ctx.fillRect(PX, gy0, PW, PH);
      ctx.fillStyle = '#7d5d40'; for (let j = 0; j < 20; j++) { ctx.beginPath(); ctx.ellipse(PX + rnd(j + 2) * PW, gy0 + 30 + rnd(j + 8) * 90, 8 + 6 * rnd(j), 5, 0, 0, TAU); ctx.fill(); }
      // Mud and the layers on top.
      let y = gy0;
      if (mud > 0) { ctx.fillStyle = '#8f7a5e'; ctx.fillRect(PX, y - 26 * mud, PW, 26 * mud + 1); y -= 26 * mud; }
      const LC = ['#b58e60', '#9c7650', '#c9a26e', '#a5805a'];
      LAY.forEach((q, i) => { if (q <= 0) return; ctx.fillStyle = LC[i]; ctx.fillRect(PX, y - LH * q, PW, LH * q + 1); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(PX, y - LH * q, PW, 4); y -= LH * q; });
      // Grass on today's surface; a lake long ago.
      if (st < 2) { ctx.fillStyle = '#2f8fe0'; ctx.fillRect(PX, gy0 - 4, 200, 12); for (let j = 0; j < 3; j++) { const fx = PX + 300 + j * 190; ctx.strokeStyle = '#3f9f3f'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(fx, gy0); ctx.quadraticCurveTo(fx - 10, gy0 - 50, fx + 8, gy0 - 80); ctx.stroke(); for (let s = 0; s < 4; s++) leaf(ctx, fx - 4 + s * 3, gy0 - 20 - s * 16, 34, 9, -2.4 + (s % 2) * 1.6, '#4caf50', null); } }
      if (st >= 2) { ctx.fillStyle = '#5fbf47'; ctx.fillRect(PX, surf - 6, PW, 8); }
      // The dig pit.
      if (dig > 0) { const pb = lerp(surf, gy0 + 26, dig); ctx.fillStyle = '#4a3424'; poly(ctx, [bx - 270, surf, bx + 330, surf, bx + 300, pb, bx - 240, pb]); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(bx - 240, pb - 6, 540, 6); }
      // The dinosaur, then its bones.
      if (alive > 0.01) { const wx = st === 0 ? lerp(bx - 260, bx, smooth(u / 2.6)) : bx; ctx.save(); ctx.globalAlpha *= alive; ctx.translate(wx, gy0 + (st === 1 ? 8 * smooth((u - 3.2) / 0.6) : 0)); dino(st >= 1); ctx.restore(); }
      if (bones > 0.01) { ctx.save(); ctx.globalAlpha *= bones; ctx.translate(bx, by); skeleton(); ctx.restore(); }
      // The palaeontologist with a brush.
      if (dig > 0.6) {
        const pp = pop(u, 13.6, 0.5); const fy = gy0 + 26; const arm = -1.75 + Math.sin(k * 7) * 0.3;
        sc(ctx, bx + 255, fy, pp, () => {
          const hands = kid(ctx, 0, 0, 104, '#e8a33c', { armL: arm, armR: 0.4, legL: -0.15, legR: 0.25 });
          ctx.fillStyle = '#c8a26a'; oval(ctx, 0, -92, 30, 7, 0, '#c8a26a'); ctx.fillRect(-15, -110, 30, 18);
          const [hx, hy] = hands[0]; const hx2 = hx - 255 * 0; ctx.save(); ctx.translate(hx2, hy); ctx.rotate(arm + PI); line(ctx, 0, 0, 0, 30, '#8a5a2b', 5); ctx.fillStyle = '#f3e3cf'; ctx.fillRect(-7, 28, 14, 12); ctx.restore();
        });
        if (u > 14) for (let j = 0; j < 5; j++) { const q = mod(k * 1.4 + j / 5, 1); ctx.save(); ctx.globalAlpha *= (1 - q) * 0.7; circ(ctx, bx + 160 + q * 30 + j * 4, by - 40 - q * 50, 5 + q * 8, '#d9c3a0'); ctx.restore(); }
      }
      ctx.restore();
      if (st === 2 || st === 3) { const p = pop(u, 6, 0.4); sc(ctx, cx, PY + 60, p, () => { chip(ctx, 'Millions of years', 30, 0, 'yellow', 24); ctx.save(); ctx.translate(-130, 0); circ(ctx, 0, 0, 18, '#fff7ec'); line(ctx, 0, 0, Math.cos(k * 4) * 12, Math.sin(k * 4) * 12, DARKTEXT, 3); line(ctx, 0, 0, Math.cos(k * 0.4) * 8, Math.sin(k * 0.4) * 8, DARKTEXT, 3); ctx.restore(); }); }
      if (st === 4 && u > 15) chip(ctx, 'A fossil!', bx - 30, surf - 40, 'cyan', 26);
      if (st >= 2) { ctx.save(); ctx.globalAlpha *= after(u, 6.2); label(ctx, 'Rock layers', PX + 90, (surf + gy0) / 2 - 6, { size: 22, weight: 800, fill: '#fff1d6' }); ctx.restore(); }
      steps(ctx, ['Long ago', 'Covered', 'Layers', 'Stone', 'Dig!'], COL, st, Y0 + 598, 140, 152);
      chip(ctx, SAY[st], cx, Y1 - 26, COL[st], 22);
      ctx.restore();
    },

    // A whale swims up, breathes out a misty spout from its blowhole,
    // breathes in, and dives, tail up; it has lungs, a fish has gills.
    'whale-breathing'(b, ctx, it, t) {
      const k = b.clock; const T = 13; const u = cycle(t, T, 0.5);
      const PX = X0 + 10; const PY = Y0 + 55; const PW = 780; const PH = 420; const wy = PY + 150;
      const KEY = [[0, PX - 170, PY + 380, -0.32], [3.4, cx - 90, wy + 30, -0.02], [7.2, cx - 40, wy + 32, 0], [8.6, cx + 60, wy + 70, 0.75], [10.4, cx + 200, PY + 330, 0.45], [13, PX + PW + 200, PY + 360, 0.05]];
      let i = 0; while (i < KEY.length - 2 && u > KEY[i + 1][0]) i++;
      const q = smooth((u - KEY[i][0]) / (KEY[i + 1][0] - KEY[i][0]));
      const wx = lerp(KEY[i][1], KEY[i + 1][1], q); const wyy = lerp(KEY[i][2], KEY[i + 1][2], q) + (u > 3.4 && u < 7.2 ? Math.sin(k * 2) * 3 : 0); const wa = lerp(KEY[i][3], KEY[i + 1][3], q);
      const st = u < 3.4 ? 0 : u < 5.5 ? 1 : u < 7.2 ? 2 : u < 10.4 ? 3 : 4;
      const COL = ['cyan', 'blue', 'green', 'purple', 'yellow'];
      const SAY = ['Up to the top to breathe air', 'Breathes out: a misty spout!', 'Breathes in fresh air', 'Holds its breath and dives', 'Whales are mammals, like us'];
      const bh = [wx + 70 * Math.cos(wa) + 44 * Math.sin(wa), wyy + 70 * Math.sin(wa) - 44 * Math.cos(wa)];
      const whale = () => {
        ctx.fillStyle = '#5b7fb8';
        ctx.beginPath(); ctx.moveTo(-150, -6); ctx.quadraticCurveTo(-180, -40, -196, -34); ctx.quadraticCurveTo(-178, -6, -150, 0); ctx.quadraticCurveTo(-178, 6, -196, 30); ctx.quadraticCurveTo(-180, 34, -150, 4); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-150, -4); ctx.bezierCurveTo(-90, -30, 0, -52, 90, -46); ctx.bezierCurveTo(150, -42, 170, -10, 160, 14); ctx.bezierCurveTo(150, 40, 60, 46, 0, 40); ctx.bezierCurveTo(-60, 34, -110, 18, -150, 4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#c9d8ee'; ctx.beginPath(); ctx.moveTo(-60, 30); ctx.bezierCurveTo(0, 46, 120, 44, 156, 18); ctx.bezierCurveTo(130, 28, 40, 30, -60, 30); ctx.fill();
        ctx.strokeStyle = 'rgba(91,127,184,0.6)'; ctx.lineWidth = 2.5; ctx.beginPath(); for (let j = 0; j < 4; j++) { ctx.moveTo(30 + j * 26, 34 - j); ctx.lineTo(70 + j * 24, 30 - j * 2); } ctx.stroke();
        ctx.fillStyle = '#4a6ba3'; ctx.beginPath(); ctx.moveTo(20, 24); ctx.quadraticCurveTo(0, 60, -30, 62); ctx.quadraticCurveTo(-10, 40, 0, 22); ctx.fill();
        eye1(ctx, 118, 0, 7, k, 5, 1); smile(ctx, 140, 18, 14, '#2a3f66', 3);
        oval(ctx, 70, -44, 7, 3.5, 0, '#2a3f66');
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'How whales breathe');
      ctx.save(); clipRound(ctx, PX, PY, PW, PH);
      scene(ctx, PX, PY, PW, wy - PY + 4, '#8fd3ff', '#d8f1ff', 0); sun(ctx, PX + 90, PY + 60, 28, k, true); cloud(ctx, PX + 600, PY + 50, 0.7, '#ffffff');
      const g = ctx.createLinearGradient(0, wy, 0, PY + PH); g.addColorStop(0, '#2b84d6'); g.addColorStop(1, '#0f3570'); ctx.fillStyle = g; ctx.fillRect(PX, wy, PW, PH);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 18; for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.moveTo(PX + 80 + j * 190 + Math.sin(k * 0.5 + j) * 20, wy); ctx.lineTo(PX + 20 + j * 190, PY + PH); ctx.stroke(); }
      for (let j = 0; j < 8; j++) { const qq = mod(k * 0.3 + rnd(j), 1); circ(ctx, PX + 40 + rnd(j + 4) * 700, PY + PH - qq * (PH - 160), 3 + 2 * rnd(j), 'rgba(220,240,255,0.35)'); }
      ctx.save(); ctx.translate(wx, wyy); ctx.rotate(wa); whale(); ctx.restore();
      // Water line in front, so the whale sits in the sea.
      ctx.fillStyle = 'rgba(43,132,214,0.45)'; ctx.beginPath(); ctx.moveTo(PX, wy + 2); for (let x = PX; x <= PX + PW; x += 16) ctx.lineTo(x, wy + Math.sin(x * 0.04 + k * 2.5) * 4); ctx.lineTo(PX + PW, wy + 22); ctx.lineTo(PX, wy + 22); ctx.fill();
      // The spout, then breathing in.
      const out = u > 3.6 && u < 5.6 ? bump((u - 3.6) / 2, 0.15) : 0;
      if (out > 0.01) for (let j = 0; j < 22; j++) { const qq = mod(k * 1.6 + j / 22, 1); const x = bh[0] + (rnd(j) - 0.5) * 70 * qq; const y = bh[1] - qq * 150; ctx.save(); ctx.globalAlpha *= (1 - qq) * out * 0.9; circ(ctx, x, y, 6 + 12 * qq, '#f4f9ff'); ctx.restore(); }
      if (u > 5.6 && u < 7.1) { for (const sd of [-1, 1]) { const qq = mod(k * 1.5, 1); ctx.save(); ctx.globalAlpha *= 1 - qq; arr(ctx, bh[0] + sd * (50 - qq * 30), bh[1] - 70 + qq * 40, bh[0] + sd * (14 - qq * 6), bh[1] - 22 + qq * 10, '#ffffff', 5); ctx.restore(); } }
      ctx.restore();
      if (u > 3.6 && u < 7.2) { chip(ctx, 'Blowhole', bh[0] + 150, bh[1] - 22, 'cyan', 22); line(ctx, bh[0] + 82, bh[1] - 18, bh[0] + 12, bh[1] - 4, 'rgba(255,255,255,0.8)', 3); }
      if (out > 0.3) label(ctx, 'Whoosh!', bh[0] - 120, bh[1] - 120, { size: 28, weight: 800, fill: '#ffffff' });
      // Lungs or gills.
      const cy0 = Y0 + 494; const chh = 140;
      [[X0 + 20, 'Whale: a mammal', 'Lungs breathe air', 'blue'], [X0 + 410, 'Fish', 'Gills breathe water', 'orange']].forEach(([x0, nm, l1, c], j) => {
        card(ctx, x0, cy0, 370, chh, c, j === 0 ? st < 4 : st === 4);
        if (j === 0) sc(ctx, x0 + 88, cy0 + 76, 0.36, whale);
        else sc(ctx, x0 + 92, cy0 + 72, 0.8, () => {
          ctx.fillStyle = '#ff7a3d'; ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(-84, -26 + Math.sin(k * 6) * 5); ctx.lineTo(-78, 0); ctx.lineTo(-84, 26 + Math.sin(k * 6) * 5); ctx.closePath(); ctx.fill();
          oval(ctx, 0, 0, 60, 34, 0, '#ff9f43'); const gl = 0.6 + 0.4 * Math.sin(k * 4); ctx.strokeStyle = '#c2410c'; ctx.lineWidth = 4;
          for (let m = 0; m < 3; m++) { ctx.beginPath(); ctx.arc(28 - m * 9, 0, 18, PI * 0.62 - 0.1 * gl, PI * 1.38 + 0.1 * gl); ctx.stroke(); }
          eye1(ctx, 38, -8, 7, k, 9, 1);
          for (let m = 0; m < 3; m++) { const qq = mod(k * 0.6 + m / 3, 1); circ(ctx, 70 + m * 4, -10 - qq * 40, 3 + 3 * qq, 'rgba(220,240,255,0.7)'); }
        });
        label(ctx, nm, x0 + 262, cy0 + 46, { size: 24, weight: 800, fill: c });
        label(ctx, l1, x0 + 262, cy0 + 94, { size: 22, weight: 700, fill: 'ink' });
      });
      chip(ctx, SAY[st], cx, Y1 - 26, COL[st], 22);
      ctx.restore();
    },
  };
}
