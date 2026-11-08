// Simulations of the human body and medical science for the board, from
// primary school to the end of secondary: the skeleton and muscles, the
// senses (the eye and the ear), teeth and skin, the kidneys, blood and the
// immune system, reflexes and hormones, germs and hand washing, healing,
// vaccines, X-rays, the heartbeat on an ECG, sleep, a balanced plate and the
// parts of the brain. Each is a function of time (t since it appeared,
// b.clock for the loop), so any moment can be drawn: plain canvas calls in
// the figure box (drawn in local coordinates, 800 × 700, after a translate
// to FIG), a few glows, no state between frames beyond constants cached on
// the item. BODY_SIMS says what each one is for, so a lesson's words can pick
// the right picture. The pictures explain how the body works; they give no
// health advice.

export const BODY_SIMS = {
  skeleton: { title: 'The human skeleton', keywords: ['human skeleton', 'the skeleton', 'skeletal system', '206 bones', 'bones in the body', 'skull and ribcage', 'femur', 'bones and joints'], example: {} },
  'muscle-pairs': { title: 'Muscles work in pairs', keywords: ['antagonistic pair', 'antagonistic muscles', 'biceps and triceps', 'muscles work in pairs', 'muscle contracts', 'muscles contract and relax', 'how muscles move'], example: {} },
  'eye-vision': { title: 'How the eye sees', keywords: ['how the eye works', 'human eye', 'parts of the eye', 'retina', 'cornea and lens', 'optic nerve', 'how we see', 'pupil gets'], example: {} },
  'ear-hearing': { title: 'How we hear', keywords: ['how we hear', 'human ear', 'parts of the ear', 'eardrum', 'cochlea', 'ear canal', 'auditory nerve', 'sense of hearing'], example: {} },
  teeth: { title: 'Teeth', keywords: ['types of teeth', 'incisors', 'canines and molars', 'premolars', 'tooth enamel', 'parts of a tooth', 'milk teeth', 'dentine'], example: {} },
  'skin-layers': { title: 'The layers of the skin', keywords: ['layers of the skin', 'epidermis', 'dermis', 'sweat glands', 'goosebumps', 'structure of the skin', 'sweating cools', 'skin keeps us warm'], example: {} },
  'kidney-filter': { title: 'How the kidneys clean the blood', keywords: ['kidney', 'nephron', 'filter the blood', 'filters the blood', 'urea', 'urinary system', 'excretory system', 'bladder'], example: {} },
  'immune-response': { title: 'Fighting germs: the immune system', keywords: ['immune system', 'white blood cells', 'phagocyte', 'lymphocyte', 'antibodies', 'fight infection', 'pathogens', 'immune response'], example: {} },
  'blood-cells': { title: 'What blood is made of', keywords: ['red blood cells', 'blood cells', 'platelets', 'blood plasma', 'haemoglobin', 'hemoglobin', 'what blood is made of', 'components of blood'], example: {} },
  'reflex-arc': { title: 'The reflex arc', keywords: ['reflex arc', 'reflex action', 'sensory neurone', 'motor neurone', 'relay neurone', 'sensory neuron', 'motor neuron', 'reflexes'], example: {} },
  hormones: { title: 'Hormones and glands', keywords: ['hormone', 'endocrine system', 'pituitary gland', 'thyroid', 'adrenaline', 'insulin', 'adrenal gland', 'glands release'], example: {} },
  'germs-handwashing': { title: 'Germs and hand washing', keywords: ['washing hands', 'wash your hands', 'hand washing', 'handwashing', 'how germs spread', 'spread of germs', 'soap and water', 'hygiene'], example: {} },
  'wound-healing': { title: 'How a cut heals', keywords: ['wound healing', 'blood clot', 'scab forms', 'how a cut heals', 'cut heals', 'blood clotting', 'clotting', 'healing of a wound'], example: {} },
  'vaccine-memory': { title: 'How vaccines work', keywords: ['vaccine', 'vaccination', 'immunisation', 'immunization', 'memory cells', 'secondary response', 'primary response', 'immunity'], example: {} },
  'xray-imaging': { title: 'How X-rays work', keywords: ['x-ray', 'xray', 'x ray', 'medical imaging', 'radiograph', 'broken bone', 'see inside the body'], example: {} },
  'heartbeat-ecg': { title: 'The heartbeat and the ECG', keywords: ['ecg', 'electrocardiogram', 'heart rate', 'heartbeat', 'beats per minute', 'pulse rate', 'qrs complex', 'pacemaker'], example: { bpm: 72 } },
  'sleep-cycle': { title: 'The stages of sleep', keywords: ['sleep cycle', 'stages of sleep', 'rem sleep', 'deep sleep', 'sleep stages', 'why we sleep', 'hypnogram', 'light sleep'], example: {} },
  'balanced-plate': { title: 'A balanced plate', keywords: ['balanced diet', 'food groups', 'eatwell guide', 'healthy eating plate', 'balanced plate', 'nutrients in food', 'starchy foods', 'fruit and vegetables'], example: {} },
  'brain-parts': { title: 'The parts of the brain', keywords: ['parts of the brain', 'cerebrum', 'cerebellum', 'brain stem', 'the human brain', 'frontal lobe', 'cerebral cortex', 'lobes of the brain'], example: {} },
};

export function bodySims(kit) {
  // eslint-disable-next-line no-unused-vars
  const { FIG, COLORS, HUES, FONT, glow, label, wrapLabel, rounded, arrow, clamp, easeOut, outBack, color, tint } = kit;
  const X0 = FIG.x; const Y0 = FIG.y; const W = 800; const H = 700; const MX = W / 2;
  const TAU = Math.PI * 2;
  const LINE = 'rgba(220,230,255,0.8)'; const FAINT = 'rgba(140,170,255,0.18)'; const DARK = '#070b1d';
  const BONE = 'rgba(233,238,255,0.84)';

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
  const win = (x, a, b) => clamp((x - a) / (b - a));
  const P2 = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];

  // Drawing helpers in the board's holo style, in the figure's local frame.
  const title = (ctx, text) => label(ctx, String(text), MX, 28, { size: 26, weight: 700, fill: 'ink' });
  function begin(ctx, t, it, name) {
    ctx.save(); ctx.translate(X0, Y0);
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
    ctx.fillStyle = 'rgba(5,8,22,0.78)'; ctx.strokeStyle = tint(c, 0.55); ctx.lineWidth = 1.5;
    rounded(ctx, left, y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
    label(ctx, text, left + w / 2, y + 1, { size, weight: 700, fill: c });
  }
  function arr(ctx, x0, y0, x1, y1, c, w = 5) { if (Math.hypot(x1 - x0, y1 - y0) > 4) arrow(ctx, x0, y0, x1, y1, c, w); }
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
  // A leader line from a label to the part it names.
  function lead(ctx, x0, y0, x1, y1, c = 'muted') { line(ctx, x0, y0, x1, y1, tint(c, 0.65), 1.5); dot(ctx, x1, y1, 3.5, c); }
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
  // A small germ: a rounded green body with little bumps.
  function germ(ctx, x, y, s = 1, a = 0, c = 'green') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s);
    ctx.fillStyle = tint(c, 0.75);
    for (let i = 0; i < 8; i++) { const q = (i / 8) * TAU; ctx.beginPath(); ctx.arc(Math.cos(q) * 13, Math.sin(q) * 9, 2.6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = tint(c, 0.4); ctx.strokeStyle = color(c); ctx.lineWidth = 2;
    ell(ctx, 0, 0, 12, 8); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // A Y-shaped antibody pointing its arms along angle a.
  function antibody(ctx, x, y, a, c = 'yellow', s = 1) {
    const dx = Math.cos(a) * s; const dy = Math.sin(a) * s;
    ctx.strokeStyle = color(c); ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(x - dx * 9, y - dy * 9); ctx.lineTo(x, y);
    for (const q of [-0.6, 0.6]) { ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a + q) * 9 * s, y + Math.sin(a + q) * 9 * s); }
    ctx.stroke();
  }
  // A lymphocyte: round, with a big nucleus.
  function lymph(ctx, x, y, r, c = 'purple', a = 1, memory = false) {
    ctx.fillStyle = tint(c, 0.18 * a); ctx.strokeStyle = tint(c, 0.9 * a); ctx.lineWidth = 2;
    ell(ctx, x, y, r, r); ctx.fill(); ctx.stroke();
    ctx.fillStyle = tint(c, 0.55 * a); ell(ctx, x + r * 0.08, y - r * 0.05, r * 0.72, r * 0.68); ctx.fill();
    if (memory) { ctx.strokeStyle = tint('yellow', 0.95 * a); ctx.lineWidth = 3; ell(ctx, x, y, r + 5, r + 5); ctx.stroke(); }
  }
  // A simple bone: a thick stroke with knobbly ends.
  function bone(ctx, x0, y0, x1, y1, w = 10, c = BONE) {
    ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.fillStyle = c; for (const [x, y] of [[x0, y0], [x1, y1]]) { ctx.beginPath(); ctx.arc(x, y, w * 0.72, 0, TAU); ctx.fill(); }
  }
  // A limb drawn as an outlined, tinted thick stroke along a polyline.
  function limb(ctx, pts, w, c = 'orange') {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [lw, s] of [[w + 5, tint(c, 0.6)], [w, '#14132a'], [w, tint(c, 0.14)]]) { ctx.lineWidth = lw; ctx.strokeStyle = s; poly(ctx, pts); ctx.stroke(); }
  }

  return {
    // ─── Bones and muscles ────────────────────────────────────────────────

    // A friendly skeleton, the main bones named, one elbow bending.
    skeleton(b, ctx, it, t) {
      const k = b.clock; const bend = smooth(tri(k / 2.4));
      begin(ctx, t, it, 'The human skeleton');
      const BF = tint('ink', 0.16);
      const hand = (x, y, a) => {
        const dx = Math.cos(a); const dy = Math.sin(a); const nx = -dy; const ny = dx;
        ctx.strokeStyle = BONE; ctx.lineWidth = 3.5; ctx.beginPath();
        for (let i = -1.5; i <= 1.5; i++) { const sx = x + nx * i * 5; const sy = y + ny * i * 5; const L = 21 - Math.abs(i) * 3; ctx.moveTo(sx, sy); ctx.lineTo(sx + dx * L, sy + dy * L); }
        ctx.moveTo(x - nx * 7, y - ny * 7); ctx.lineTo(x - nx * 15 + dx * 8, y - ny * 15 + dy * 8);
        ctx.stroke();
        ctx.fillStyle = BONE; ell(ctx, x, y, 8, 8); ctx.fill();
      };
      ctx.save(); ctx.globalAlpha *= after(t, 0.1, 0.6);
      // Spine behind everything.
      ctx.lineWidth = 2;
      for (let y = 160; y < 396; y += 14) { ctx.fillStyle = BF; ctx.strokeStyle = BONE; rounded(ctx, 391, y, 18, 10, 4); ctx.fill(); ctx.stroke(); }
      // Ribcage and breastbone.
      ctx.strokeStyle = BONE; ctx.lineWidth = 5;
      [54, 62, 66, 67, 64, 57].forEach((w, i) => {
        const y = 204 + i * 17;
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(400 + s * 9, y); ctx.bezierCurveTo(400 + s * w, y - 12, 400 + s * (w + 8), y + 22, 400 + s * (i < 4 ? 9 : 26 + i * 4), y + 26); ctx.stroke(); }
      });
      ctx.fillStyle = BF; ctx.strokeStyle = BONE; ctx.lineWidth = 2.5; rounded(ctx, 395, 198, 10, 86, 5); ctx.fill(); ctx.stroke();
      // Collarbones and shoulders.
      bone(ctx, 393, 192, 336, 182, 7); bone(ctx, 407, 192, 464, 182, 7);
      // Pelvis.
      ctx.fillStyle = BF; ctx.strokeStyle = BONE; ctx.lineWidth = 3;
      ell(ctx, 372, 408, 32, 22, -0.45); ctx.fill(); ctx.stroke(); ell(ctx, 428, 408, 32, 22, 0.45); ctx.fill(); ctx.stroke();
      poly(ctx, [389, 394, 411, 394, 400, 430], true); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(364, 428); ctx.quadraticCurveTo(400, 462, 436, 428); ctx.stroke();
      // Legs.
      for (const s of [-1, 1]) {
        const hx = 400 + s * 37; const kx = 400 + s * 30; const ax = 400 + s * 30;
        bone(ctx, hx, 434, kx, 536, 12);
        bone(ctx, kx, 552, ax, 630, 10); bone(ctx, kx + s * 11, 556, ax + s * 10, 626, 5);
        ctx.fillStyle = BF; ctx.strokeStyle = BONE; ctx.lineWidth = 2.5; ell(ctx, kx, 543, 9, 9); ctx.fill(); ctx.stroke();
        ell(ctx, ax + s * 6, 644, 20, 8); ctx.fill(); ctx.stroke();
      }
      // Still arm (viewer's left).
      bone(ctx, 332, 192, 314, 310, 10);
      bone(ctx, 310, 317, 299, 416, 6); bone(ctx, 320, 318, 311, 416, 5);
      hand(305, 428, Math.PI / 2 + 0.08);
      // Arm bending at the elbow.
      const ex = 486; const ey = 312; const a = lerp(1.5, -1.0, bend);
      const dx = Math.cos(a); const dy = Math.sin(a); const nx = -dy * 4.5; const ny = dx * 4.5;
      bone(ctx, 468, 192, ex, ey, 10);
      bone(ctx, ex + nx, ey + ny, ex + dx * 100 + nx, ey + dy * 100 + ny, 6); bone(ctx, ex - nx, ey - ny, ex + dx * 100 - nx, ey + dy * 100 - ny, 5);
      hand(ex + dx * 110, ey + dy * 110, a);
      // Skull.
      ctx.fillStyle = BF; ctx.strokeStyle = BONE; ctx.lineWidth = 3;
      ell(ctx, 400, 106, 42, 46); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(374, 134); ctx.quadraticCurveTo(378, 170, 400, 172); ctx.quadraticCurveTo(422, 170, 426, 134); ctx.fill(); ctx.stroke();
      ctx.fillStyle = DARK; ell(ctx, 385, 106, 10, 12); ctx.fill(); ell(ctx, 415, 106, 10, 12); ctx.fill();
      poly(ctx, [400, 117, 394, 130, 406, 130], true); ctx.fill();
      ctx.strokeStyle = tint('ink', 0.6); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(386, 146); ctx.lineTo(414, 146);
      for (let x = 389; x < 414; x += 6) { ctx.moveTo(x, 141); ctx.lineTo(x, 151); }
      ctx.stroke();
      // The moving joint glows.
      glow(ctx, COLORS.yellow, 12); ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 3; ell(ctx, ex, ey, 14, 14); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.restore();
      // Labels: left column and right column.
      const L = [['Skull', 112, 356, 110], ['Collarbone', 176, 352, 186], ['Ribcage', 240, 342, 240], ['Radius and ulna', 330, 307, 366], ['Pelvis', 402, 342, 404], ['Femur', 490, 367, 486], ['Tibia and fibula', 590, 370, 592]];
      L.forEach(([s, y, px, py], i) => {
        ctx.save(); ctx.globalAlpha *= after(t, 0.4 + i * 0.12);
        T(ctx, s, 36, y, 20, 'cyan', 'left');
        ctx.font = `700 20px ${FONT}`; const w = ctx.measureText(s).width;
        lead(ctx, 44 + w, y, px, py, 'cyan');
        ctx.restore();
      });
      const R = [['Humerus', 222, 478, 250, 'cyan'], ['Elbow joint', 300, 501, 310, 'yellow'], ['Spine', 385, 410, 382, 'cyan'], ['Kneecap', 540, 440, 543, 'cyan']];
      R.forEach(([s, y, px, py, c], i) => {
        ctx.save(); ctx.globalAlpha *= after(t, 1.2 + i * 0.12);
        T(ctx, s, 624, y, 20, c, 'left'); lead(ctx, 616, y, px, py, c);
        ctx.restore();
      });
      ctx.save(); ctx.globalAlpha *= after(t, 1.0);
      T(ctx, 'a hinge joint', 624, 326, 18, 'muted', 'left', 500);
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= after(t, 1.8);
      chip(ctx, '206 bones in an adult', 640, 628, 'yellow', 21);
      ctx.restore();
      ctx.restore();
    },

    // Biceps and triceps take turns: one contracts while the other relaxes.
    'muscle-pairs'(b, ctx, it, t) {
      const k = b.clock; const u = mod(k, 5.5) / 5.5;
      const flex = u < 0.4 ? smooth(u / 0.4) : u < 0.5 ? 1 : u < 0.9 ? 1 - smooth((u - 0.5) / 0.4) : 0;
      const bOn = u < 0.5;
      begin(ctx, t, it, 'Muscles work in pairs');
      const S = [250, 96]; const E = [250, 380];
      const a = lerp(1.2, -0.8, flex); const d = [Math.cos(a), Math.sin(a)]; const nT = [Math.sin(a), -Math.cos(a)];
      const F = (uu, v) => [E[0] + d[0] * uu + nT[0] * v, E[1] + d[1] * uu + nT[1] * v];
      function muscle(O, I, rest, c, on) {
        const L = Math.hypot(I[0] - O[0], I[1] - O[1]); const ux = (I[0] - O[0]) / L; const uy = (I[1] - O[1]) / L; const px = -uy; const py = ux;
        const th = 21 * Math.sqrt(rest / L) * (on ? 1.15 : 0.9);
        const A = [O[0] + ux * L * 0.13, O[1] + uy * L * 0.13]; const B = [O[0] + ux * L * 0.86, O[1] + uy * L * 0.86]; const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
        ctx.strokeStyle = 'rgba(233,238,255,0.8)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.lineTo(A[0], A[1]); ctx.moveTo(B[0], B[1]); ctx.lineTo(I[0], I[1]); ctx.stroke();
        ctx.fillStyle = tint(c, on ? 0.5 : 0.2); ctx.strokeStyle = color(c); ctx.lineWidth = on ? 3 : 2;
        if (on) glow(ctx, color(c), 12);
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.quadraticCurveTo(M[0] + px * th * 2, M[1] + py * th * 2, B[0], B[1]); ctx.quadraticCurveTo(M[0] - px * th * 2, M[1] - py * th * 2, A[0], A[1]);
        ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.strokeStyle = tint(c, 0.55); ctx.lineWidth = 1.2; ctx.beginPath();
        for (const f of [-0.5, 0, 0.5]) { ctx.moveTo(A[0], A[1]); ctx.quadraticCurveTo(M[0] + px * th * 2 * f, M[1] + py * th * 2 * f, B[0], B[1]); }
        ctx.stroke();
        return { M, ux, uy };
      }
      // Shoulder blade, humerus, forearm bones.
      ctx.strokeStyle = tint('ink', 0.35); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(200, 70); ctx.quadraticCurveTo(250, 62, 300, 76); ctx.stroke();
      bone(ctx, S[0], S[1], E[0], E[1], 20);
      const r0 = F(2, 6); const r1 = F(236, 6); const u0 = F(-4, -6); const u1 = F(236, -6);
      bone(ctx, r0[0], r0[1], r1[0], r1[1], 9); bone(ctx, u0[0], u0[1], u1[0], u1[1], 9);
      // Fist.
      const fz = F(252, 0);
      ctx.fillStyle = tint('orange', 0.22); ctx.strokeStyle = tint('orange', 0.85); ctx.lineWidth = 2.5; ell(ctx, fz[0], fz[1], 26, 26); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = tint('orange', 0.6); ctx.lineWidth = 2; ctx.beginPath();
      for (const v of [-10, 0, 10]) { const p0 = F(258, v); const p1 = F(274, v); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); }
      ctx.stroke();
      // The two muscles.
      const bm = muscle([272, 128], F(46, 12), 290, 'orange', bOn);
      const tm = muscle([229, 128], F(-6, -22), 280, 'purple', !bOn);
      // An arrow along the contracting muscle shows its pull.
      const mm = bOn ? bm : tm; const pull = bOn ? flex < 1 && u < 0.4 : u >= 0.5 && u < 0.9;
      if (pull) {
        const cx0 = mm.M[0] + mm.ux * 45; const cy0 = mm.M[1] + mm.uy * 45;
        arr(ctx, cx0, cy0, cx0 - mm.ux * 70, cy0 - mm.uy * 70, 'ink', 4);
      }
      // Elbow joint.
      ctx.strokeStyle = tint('yellow', 0.9); ctx.lineWidth = 2.5; ell(ctx, E[0], E[1], 13, 13); ctx.stroke();
      // Labels next to the arm.
      T(ctx, 'Biceps', 352, 165, 22, 'orange');
      T(ctx, 'Triceps', 150, 250, 22, 'purple');
      T(ctx, 'Elbow joint', 150, 430, 20, 'yellow');
      lead(ctx, 196, 418, 236, 388, 'yellow');
      T(ctx, 'Tendons join', 130, 120, 18, 'muted', 'center', 600);
      T(ctx, 'muscle to bone', 130, 144, 18, 'muted', 'center', 600);
      lead(ctx, 200, 132, 228, 124, 'muted');
      // Status cards on the right.
      const card = (y, name, c, on, sOn, sOff) => {
        ctx.save(); ctx.globalAlpha *= on ? 1 : 0.6;
        panel(ctx, 520, y, 268, 118, c, on ? 0.16 : 0.05, 16);
        T(ctx, name, 540, y + 28, 23, c, 'left');
        T(ctx, on ? 'contracts' : 'relaxes', 540, y + 62, 22, on ? 'ink' : 'muted', 'left');
        T(ctx, on ? sOn : sOff, 540, y + 93, 18, 'muted', 'left', 500);
        ctx.restore();
      };
      card(100, 'Biceps', 'orange', bOn, 'shorter and fatter', 'longer and thinner');
      card(238, 'Triceps', 'purple', !bOn, 'shorter and fatter', 'longer and thinner');
      chip(ctx, bOn ? 'The arm bends' : 'The arm straightens', 654, 410, bOn ? 'orange' : 'purple', 21);
      para(ctx, 'An antagonistic pair: when one muscle contracts, its partner relaxes', 524, 500, 262, 19, 'ink', 500, 3);
      T(ctx, 'Muscles can only pull, never push, so they work in pairs.', MX, 668, 20, 'ink', 'center', 600);
      ctx.restore();
    },

    // ─── The senses ───────────────────────────────────────────────────────

    // Light from a tree is focused by the cornea and lens onto the retina,
    // upside down; the pupil changes size with the light.
    'eye-vision'(b, ctx, it, t) {
      const k = b.clock; const L = smooth(tri(k / 6)); const p = lerp(31, 12, L);
      begin(ctx, t, it, 'How the eye sees');
      const ex = 440; const ey = 320; const R = 150;
      // Sun (bright) or moon (dim) above the tree.
      ctx.save();
      ctx.globalAlpha *= 0.35 + 0.65 * L; glow(ctx, COLORS.yellow, 12 * L);
      dot(ctx, 95, 128, 18, 'yellow'); ctx.shadowBlur = 0;
      ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i < 8; i++) { const q = (i / 8) * TAU + k * 0.3; ctx.moveTo(95 + Math.cos(q) * 25, 128 + Math.sin(q) * 25); ctx.lineTo(95 + Math.cos(q) * 35, 128 + Math.sin(q) * 35); }
      ctx.stroke(); ctx.restore();
      ctx.save(); ctx.globalAlpha *= 1 - L;
      ctx.fillStyle = tint('ink', 0.8); ctx.beginPath(); ctx.arc(95, 128, 18, 0.9, 5.4); ctx.arc(106, 121, 14, 5.0, 1.3, true); ctx.closePath(); ctx.fill();
      ctx.restore();
      // The object: a little tree.
      line(ctx, 95, 320, 95, 266, '#b7794a', 7);
      ctx.fillStyle = tint('green', 0.4); ctx.strokeStyle = COLORS.green; ctx.lineWidth = 2.5; ell(ctx, 95, 246, 26, 26); ctx.fill(); ctx.stroke();
      T(ctx, 'Object', 95, 345, 19, 'muted', 'center', 600);
      // Eyeball.
      ctx.fillStyle = tint('blue', 0.07); ctx.strokeStyle = 'rgba(220,230,255,0.75)'; ctx.lineWidth = 3;
      ell(ctx, ex, ey, R, R); ctx.fill(); ctx.stroke();
      // Cornea bulge.
      ctx.fillStyle = tint('cyan', 0.08); ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(350, 320, 82, 2.12, TAU - 2.12); ctx.fill(); ctx.stroke();
      // Retina at the back, optic nerve leaving it.
      ctx.strokeStyle = tint('orange', 0.75); ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(ex, ey, R - 7, -1.15, 1.15); ctx.stroke();
      const nerve = mkPath([574, 376, 608, 392, 642, 394, 672, 374, 700, 338]);
      ctx.strokeStyle = tint('yellow', 0.35); ctx.lineWidth = 18; poly(ctx, nerve.pts); ctx.stroke();
      ctx.strokeStyle = tint('yellow', 0.8); ctx.lineWidth = 2; poly(ctx, nerve.pts); ctx.stroke();
      // Brain.
      ctx.fillStyle = tint('purple', 0.2); ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 2.5; ell(ctx, 744, 300, 50, 42); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = tint('purple', 0.5); ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(712, 286); ctx.quadraticCurveTo(728, 274, 744, 288); ctx.quadraticCurveTo(760, 300, 778, 288); ctx.moveTo(716, 318); ctx.quadraticCurveTo(734, 306, 750, 320); ctx.stroke();
      T(ctx, 'Brain', 744, 300, 19, 'ink');
      // Light rays: from the tree top (green) and base (orange), bent at the
      // cornea and lens, meeting on the retina.
      const cornX = (y) => 350 - Math.sqrt(Math.max(0, 82 * 82 - (y - 320) ** 2));
      const IT = [577, 362]; const IB = [583, 320];
      const ray = (o, img, c, off) => {
        for (const f of [-1, 0, 1]) {
          const yc = 320 + off + f * p * 0.8; const yl = 320 + off * 0.5 + f * p * 0.62;
          const pts = [o[0], o[1], cornX(yc), yc, 335, yl, img[0], img[1]];
          ctx.strokeStyle = tint(c, 0.25 + 0.2 * L); ctx.lineWidth = 2; poly(ctx, pts); ctx.stroke();
          ctx.strokeStyle = tint(c, 0.55 + 0.4 * L); ctx.lineWidth = 3; ctx.setLineDash([12, 14]); ctx.lineDashOffset = -k * 50; poly(ctx, pts); ctx.stroke();
          ctx.setLineDash([]); ctx.lineDashOffset = 0;
        }
      };
      ray([95, 222], IT, 'green', -4); ray([95, 318], IB, 'orange', 0);
      // Iris (front of the lens) and the lens.
      ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 7; ctx.beginPath();
      ctx.moveTo(313, 320 - 66); ctx.lineTo(313, 320 - p); ctx.moveTo(313, 320 + p); ctx.lineTo(313, 320 + 66); ctx.stroke();
      ctx.fillStyle = tint('cyan', 0.22); ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 2.5; ell(ctx, 336, 320, 16, 50); ctx.fill(); ctx.stroke();
      // The upside-down image on the retina.
      line(ctx, 583, 320, 580, 342, '#d08a52', 4);
      ctx.fillStyle = tint('green', 0.6); ell(ctx, 578, 352, 9, 9); ctx.fill();
      // A signal runs along the optic nerve.
      const q = mod(k, 1.4) / 1.4; const P = at(nerve, q * nerve.total);
      dot(ctx, P.x, P.y, 7, 'yellow', 12);
      // Labels.
      T(ctx, 'Cornea', 252, 202, 20, 'cyan'); lead(ctx, 258, 216, 276, 282, 'cyan');
      T(ctx, 'Iris', 316, 140, 20, 'teal'); lead(ctx, 316, 154, 313, 258, 'teal');
      T(ctx, 'Retina', 566, 148, 20, 'orange'); lead(ctx, 560, 162, 522, 205, 'orange');
      T(ctx, 'Lens', 336, 505, 20, 'cyan'); lead(ctx, 336, 492, 336, 372, 'cyan');
      T(ctx, 'Optic nerve', 700, 440, 20, 'yellow'); lead(ctx, 686, 426, 656, 394, 'yellow');
      T(ctx, 'Image is upside down', 590, 505, 19, 'green'); lead(ctx, 584, 492, 579, 366, 'green');
      // Pupil close-up: front view.
      const px = 150; const py = 560;
      ctx.fillStyle = tint('ink', 0.1); ctx.strokeStyle = tint('ink', 0.6); ctx.lineWidth = 2; ell(ctx, px, py, 84, 50); ctx.fill(); ctx.stroke();
      ctx.fillStyle = tint('teal', 0.35); ctx.strokeStyle = COLORS.teal; ell(ctx, px, py, 40, 40); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = tint('teal', 0.6); ctx.lineWidth = 1.2; ctx.beginPath();
      for (let i = 0; i < 18; i++) { const qq = (i / 18) * TAU; ctx.moveTo(px + Math.cos(qq) * (p * 0.95 + 2), py + Math.sin(qq) * (p * 0.95 + 2)); ctx.lineTo(px + Math.cos(qq) * 38, py + Math.sin(qq) * 38); }
      ctx.stroke();
      ctx.fillStyle = DARK; ell(ctx, px, py, p * 0.95, p * 0.95); ctx.fill();
      dot(ctx, px + 8, py - 10, 4, 'rgba(255,255,255,0.8)');
      T(ctx, 'Pupil', 268, 538, 19, 'ink', 'left'); lead(ctx, 262, 538, px + 4, py - 2, 'ink');
      T(ctx, 'Iris', 268, 582, 19, 'teal', 'left'); lead(ctx, 262, 582, px + 30, py + 20, 'teal');
      chip(ctx, L > 0.5 ? 'Bright: pupil shrinks' : 'Dim: pupil widens', 150, 640, L > 0.5 ? 'yellow' : 'purple', 19);
      para(ctx, 'The cornea and lens bend light so it focuses on the retina. The image there is upside down; the brain turns it the right way up.', 342, 612, 450, 19, 'ink', 500, 3);
      ctx.restore();
    },

    // Sound waves → ear canal → eardrum → three tiny bones → cochlea →
    // auditory nerve → brain.
    'ear-hearing'(b, ctx, it, t) {
      const k = b.clock; const tt = cycle(t, 12.5, 0.8); const st = Math.min(4, Math.floor(tt / 2.5));
      begin(ctx, t, it, 'How we hear');
      const vib = Math.sin(k * 14);
      const hi = (i) => (st === i ? 1 : 0);
      // Speaker and sound waves.
      ctx.fillStyle = tint('muted', 0.3); ctx.strokeStyle = tint('ink', 0.7); ctx.lineWidth = 2;
      rounded(ctx, 34, 310, 26, 40, 5); ctx.fill(); ctx.stroke();
      poly(ctx, [60, 316, 88, 292, 88, 368, 60, 344], true); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const r = 18 + mod(k * 70 + i * 40, 160); const a = clamp(1 - r / 185);
        ctx.strokeStyle = tint('cyan', (0.45 + 0.4 * hi(0)) * a); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(96, 330, r, -0.42, 0.42); ctx.stroke();
      }
      // Outer ear and the side of the head.
      ctx.fillStyle = tint('orange', 0.24); ctx.strokeStyle = tint('orange', 0.8); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(262, 302); ctx.bezierCurveTo(230, 290, 196, 250, 206, 205); ctx.bezierCurveTo(214, 172, 252, 165, 262, 192); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(262, 358); ctx.bezierCurveTo(232, 372, 214, 410, 232, 438); ctx.bezierCurveTo(244, 452, 262, 440, 262, 424); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = tint('orange', 0.45); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(262, 150); ctx.lineTo(262, 302); ctx.moveTo(262, 358); ctx.lineTo(262, 470); ctx.stroke();
      ctx.strokeStyle = tint('orange', 0.55); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(250, 290); ctx.bezierCurveTo(222, 272, 210, 236, 222, 206); ctx.moveTo(250, 372); ctx.quadraticCurveTo(228, 392, 236, 420); ctx.stroke();
      // Ear canal, with waves moving down it.
      ctx.fillStyle = tint('cyan', 0.05 + 0.06 * hi(0)); ctx.fillRect(262, 308, 156, 44);
      ctx.strokeStyle = tint('orange', 0.7); ctx.lineWidth = 2.5; ctx.beginPath();
      ctx.moveTo(262, 306); ctx.quadraticCurveTo(340, 300, 418, 306); ctx.moveTo(262, 354); ctx.quadraticCurveTo(340, 360, 418, 354); ctx.stroke();
      for (let j = 0; j < 4; j++) {
        const x = 270 + mod(k * 70 + j * 38, 146);
        ctx.strokeStyle = tint('cyan', 0.6 * clamp((418 - x) / 40)); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 314); ctx.lineTo(x, 346); ctx.stroke();
      }
      // Middle ear space.
      ctx.fillStyle = tint('purple', 0.07); ctx.strokeStyle = tint('purple', 0.35); ctx.lineWidth = 2; rounded(ctx, 424, 262, 100, 136, 18); ctx.fill(); ctx.stroke();
      // Eardrum.
      const amp = st >= 1 ? 1 : 0.4;
      if (hi(1)) glow(ctx, COLORS.yellow, 12);
      ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(420, 292); ctx.quadraticCurveTo(428 + 9 * vib * amp, 330, 420, 368); ctx.stroke(); ctx.shadowBlur = 0;
      // Hammer, anvil, stirrup.
      const dx = 3 * vib * amp;
      ctx.save(); if (hi(2)) glow(ctx, COLORS.ink, 10);
      bone(ctx, 426 + dx * 0.8, 332, 450 + dx, 290, 6); dot(ctx, 454 + dx, 282, 10, BONE);
      dot(ctx, 475 + dx, 280, 10, BONE); bone(ctx, 475 + dx, 286, 485 + dx, 318, 6);
      ctx.strokeStyle = BONE; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(487 + dx, 320); ctx.lineTo(515 + dx, 309); ctx.moveTo(487 + dx, 320); ctx.lineTo(515 + dx, 333); ctx.moveTo(517 + dx, 304); ctx.lineTo(517 + dx, 338); ctx.stroke();
      ctx.restore();
      // Semicircular canals (balance) and the cochlea.
      ctx.strokeStyle = tint('teal', 0.55); ctx.lineWidth = 5;
      ell(ctx, 556, 256, 22, 30); ctx.stroke(); ell(ctx, 594, 236, 30, 18); ctx.stroke(); ell(ctx, 624, 270, 20, 26, 0.3); ctx.stroke();
      dot(ctx, 576, 300, 15, tint('teal', 0.3));
      const spiral = []; for (let i = 0; i <= 120; i++) { const q = (i / 120) * TAU * 2.6; const r = 58 - (i / 120) * 48; spiral.push(585 + Math.cos(q + Math.PI) * r, 352 + Math.sin(q + Math.PI) * r); }
      ctx.strokeStyle = tint('teal', 0.28 + 0.15 * hi(3)); ctx.lineWidth = 16; poly(ctx, spiral); ctx.stroke();
      ctx.strokeStyle = tint('teal', 0.85); ctx.lineWidth = 2; poly(ctx, spiral); ctx.stroke();
      const sp = mkPath(spiral); const w0 = mod(k * 160, sp.total);
      ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 7; if (st >= 3) glow(ctx, COLORS.cyan, 10);
      strokeSpan(ctx, sp, w0, Math.min(sp.total, w0 + 60)); ctx.shadowBlur = 0;
      // Auditory nerve and brain.
      const nerve = mkPath([636, 352, 660, 350, 684, 346, 704, 345]);
      ctx.strokeStyle = tint('yellow', 0.35); ctx.lineWidth = 14; poly(ctx, nerve.pts); ctx.stroke();
      ctx.fillStyle = tint('purple', 0.2 + 0.15 * hi(4)); ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 2.5; ell(ctx, 748, 345, 46, 40); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = tint('purple', 0.5); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(718, 332); ctx.quadraticCurveTo(734, 320, 750, 334); ctx.quadraticCurveTo(764, 346, 782, 334); ctx.moveTo(722, 362); ctx.quadraticCurveTo(740, 350, 758, 364); ctx.stroke();
      T(ctx, 'Brain', 748, 345, 19, 'ink');
      for (let j = 0; j < 2; j++) { const q = mod(k / 0.9 + j / 2, 1); const P = at(nerve, q * nerve.total); dot(ctx, P.x, P.y, 6, 'yellow', st >= 3 ? 10 : 0); }
      // Labels.
      T(ctx, 'Sound waves', 120, 236, 20, 'cyan');
      T(ctx, 'Outer ear', 222, 150, 20, 'orange');
      T(ctx, 'Ear canal', 340, 395, 20, 'orange');
      T(ctx, 'Eardrum', 420, 440, 20, 'yellow'); lead(ctx, 420, 426, 422, 372, 'yellow');
      T(ctx, 'Three tiny bones', 430, 214, 20, 'ink');
      T(ctx, 'hammer, anvil, stirrup', 430, 240, 18, 'muted', 'center', 600);
      T(ctx, 'Semicircular canals (balance)', 640, 176, 18, 'teal', 'center', 600);
      T(ctx, 'Cochlea', 585, 440, 20, 'teal');
      T(ctx, 'Auditory nerve', 716, 440, 20, 'yellow'); lead(ctx, 700, 426, 672, 352, 'yellow');
      const STAGE = [
        ['Sound waves travel down the ear canal', 'cyan', 'Sound is a vibration of the air. The outer ear collects it and funnels it in.'],
        ['The eardrum vibrates', 'yellow', 'The thin eardrum is pushed back and forth by the vibrating air.'],
        ['Three tiny bones pass the vibrations on', 'ink', 'The hammer, anvil and stirrup, the smallest bones in the body, make the vibrations stronger.'],
        ['The cochlea turns them into nerve signals', 'teal', 'Liquid in the coiled cochlea ripples; tiny hair cells bend and send electrical signals.'],
        ['The auditory nerve carries signals to the brain', 'purple', 'The brain works out what the sound is: a voice, music, a dog barking.'],
      ][st];
      chip(ctx, `${st + 1}. ${STAGE[0]}`, MX, 520, STAGE[1], 21);
      para(ctx, STAGE[2], 30, 588, 740, 20, 'ink', 500, 2);
      ctx.restore();
    },

    // ─── Teeth and skin ───────────────────────────────────────────────────

    // The four kinds of teeth on a lower jaw, and a molar cut in half.
    teeth(b, ctx, it, t) {
      const k = b.clock;
      const C = it._c || (it._c = (() => {
        const ecx = 215; const ecy = 445; const ax = 150; const ay = 200; const N = 400; const pts = []; let len = 0; let prev = null;
        for (let i = 0; i <= N; i++) { const a = Math.PI + (i / N) * Math.PI; const x = ecx + Math.cos(a) * ax; const y = ecy + Math.sin(a) * ay; if (prev) len += Math.hypot(x - prev[0], y - prev[1]); pts.push([x, y, len]); prev = [x, y]; }
        const types = [3, 3, 3, 2, 2, 1, 0, 0, 0, 0, 1, 2, 2, 3, 3, 3]; const size = [17, 20, 23, 30]; const gap = 3;
        const total = types.reduce((s, ty) => s + size[ty], 0) + gap * 15; const sc = (len - 20) / total;
        let d = 10; const teeth = [];
        for (const ty of types) {
          const w = size[ty] * sc; const mid = d + w / 2; let j = 0;
          while (j < N && pts[j][2] < mid) j++;
          const p0 = pts[Math.max(0, j - 2)]; const p1 = pts[Math.min(N, j + 2)];
          teeth.push({ ty, x: pts[j][0], y: pts[j][1], w, ang: Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) });
          d += w + gap * sc;
        }
        return { teeth };
      })());
      const act = Math.floor(cycle(t, 10, 0.8) / 2.5);
      const TY = [['Incisors', 'cut and bite', 'cyan'], ['Canines', 'grip and tear', 'yellow'], ['Premolars', 'crush and grind', 'green'], ['Molars', 'chew and grind', 'purple']];
      begin(ctx, t, it, 'Teeth and their jobs');
      // Gum of the lower jaw, then each tooth seen from above.
      ctx.strokeStyle = tint('red', 0.16); ctx.lineWidth = 56; ctx.beginPath(); ctx.ellipse(215, 445, 150, 200, 0, Math.PI, TAU); ctx.stroke();
      T(ctx, 'Lower jaw, seen from above', 215, 196, 18, 'muted', 'center', 600);
      C.teeth.forEach((th) => {
        const c = TY[th.ty][2]; const on = th.ty === act;
        ctx.save(); ctx.translate(th.x, th.y); ctx.rotate(th.ang);
        ctx.fillStyle = tint(c, on ? 0.55 : 0.2); ctx.strokeStyle = tint(c, on ? 1 : 0.7); ctx.lineWidth = on ? 3 : 2;
        if (on) glow(ctx, color(c), 10);
        const w = th.w;
        if (th.ty === 0) { rounded(ctx, -w * 0.47, -9, w * 0.94, 18, 6); ctx.fill(); ctx.stroke(); }
        else if (th.ty === 1) { poly(ctx, [-w * 0.48, 0, 0, -15, w * 0.48, 0, 0, 16], true); ctx.fill(); ctx.stroke(); }
        else if (th.ty === 2) { ell(ctx, 0, 0, w * 0.48, 19); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0; line(ctx, -w * 0.3, 0, w * 0.3, 0, tint(c, 0.8), 2); }
        else { rounded(ctx, -w * 0.47, -21, w * 0.94, 42, 10); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0; ctx.strokeStyle = tint(c, 0.8); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-w * 0.28, 0); ctx.lineTo(w * 0.28, 0); ctx.moveTo(0, -11); ctx.lineTo(0, 11); ctx.stroke(); }
        ctx.shadowBlur = 0; ctx.restore();
      });
      // Legend: kind of tooth and its job.
      TY.forEach(([name, job, c], i) => {
        const y = 528 + i * 38; const on = i === act;
        dot(ctx, 44, y, on ? 9 : 7, on ? c : tint(c, 0.6));
        T(ctx, name, 62, y, 20, on ? c : tint(c, 0.75), 'left', 700);
        ctx.font = `700 20px ${FONT}`; const w = ctx.measureText(name).width;
        T(ctx, `: ${job}`, 62 + w, y, 20, on ? 'ink' : 'muted', 'left', on ? 600 : 500);
      });
      // A molar cut in half.
      T(ctx, 'A molar, cut in half', 590, 112, 18, 'muted', 'center', 600);
      ctx.fillStyle = tint('muted', 0.14); ctx.strokeStyle = tint('muted', 0.4); ctx.lineWidth = 1.5; rounded(ctx, 470, 380, 236, 214, 18); ctx.fill(); ctx.stroke();
      ctx.fillStyle = tint('muted', 0.3); for (let i = 0; i < 28; i++) { ctx.beginPath(); ctx.arc(482 + rnd(i) * 212, 400 + rnd(i + 9) * 184, 3 + rnd(i + 3) * 3, 0, TAU); ctx.fill(); }
      ctx.fillStyle = tint('red', 0.28); ctx.strokeStyle = tint('red', 0.7); ctx.lineWidth = 2;
      poly(ctx, [470, 402, 470, 338]); ctx.quadraticCurveTo(490, 330, 506, 310); ctx.lineTo(674, 310); ctx.quadraticCurveTo(690, 330, 706, 338); ctx.lineTo(706, 402); ctx.closePath(); ctx.fill(); ctx.stroke();
      const tooth = () => {
        ctx.beginPath(); ctx.moveTo(508, 322); ctx.lineTo(505, 215); ctx.quadraticCurveTo(507, 152, 548, 152); ctx.quadraticCurveTo(575, 154, 590, 182); ctx.quadraticCurveTo(605, 154, 632, 152); ctx.quadraticCurveTo(673, 152, 675, 215);
        ctx.lineTo(672, 322); ctx.lineTo(660, 530); ctx.quadraticCurveTo(650, 556, 638, 532); ctx.lineTo(612, 372); ctx.quadraticCurveTo(590, 350, 568, 372); ctx.lineTo(542, 532); ctx.quadraticCurveTo(530, 556, 520, 530); ctx.closePath();
      };
      ctx.fillStyle = '#15131f'; tooth(); ctx.fill(); ctx.fillStyle = 'rgba(232,200,120,0.4)'; tooth(); ctx.fill();
      // Enamel coat on the crown.
      ctx.strokeStyle = 'rgba(240,245,255,0.92)'; ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(510, 300); ctx.lineTo(506, 215); ctx.quadraticCurveTo(507, 152, 548, 152); ctx.quadraticCurveTo(575, 154, 590, 182); ctx.quadraticCurveTo(605, 154, 632, 152); ctx.quadraticCurveTo(673, 152, 674, 215); ctx.lineTo(670, 300); ctx.stroke();
      ctx.strokeStyle = 'rgba(240,245,255,0.7)'; ctx.lineWidth = 2; tooth(); ctx.stroke();
      // Pulp with nerves and blood vessels.
      const pulse = 0.5 + 0.15 * Math.sin(k * 3);
      ctx.fillStyle = tint('red', pulse); ctx.beginPath(); ctx.moveTo(556, 330); ctx.lineTo(556, 250); ctx.quadraticCurveTo(558, 222, 576, 228); ctx.quadraticCurveTo(590, 236, 604, 228); ctx.quadraticCurveTo(622, 222, 624, 250); ctx.lineTo(624, 330); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = tint('red', pulse); ctx.lineWidth = 10; poly(ctx, [566, 326, 541, 380, 531, 528]); ctx.stroke(); poly(ctx, [614, 326, 639, 380, 649, 528]); ctx.stroke();
      ctx.lineWidth = 2;
      for (const [s, xs] of [[-1, 531], [1, 649]]) {
        ctx.strokeStyle = tint('yellow', 0.9); ctx.beginPath(); ctx.moveTo(590 + s * 10, 270); ctx.lineTo(590 + s * 26, 330); ctx.lineTo(xs - 2, 528); ctx.quadraticCurveTo(xs - 4 + s * 8, 560, xs + s * 22, 580); ctx.stroke();
        ctx.strokeStyle = tint('red', 0.95); ctx.beginPath(); ctx.moveTo(590 + s * 18, 262); ctx.lineTo(590 + s * 32, 330); ctx.lineTo(xs + 3, 528); ctx.quadraticCurveTo(xs + 6 + s * 8, 556, xs + s * 30, 570); ctx.stroke();
        for (let j = 0; j < 2; j++) { const q = mod(k * 0.35 + j * 0.5 + (s > 0 ? 0.25 : 0), 1); dot(ctx, lerp(590 + s * 26, xs, q), lerp(330, 528, q), 3.5, 'red'); }
      }
      // Labels for the cross-section.
      ctx.strokeStyle = tint('ink', 0.5); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(494, 152); ctx.lineTo(488, 152); ctx.lineTo(488, 316); ctx.lineTo(494, 316); ctx.stroke();
      T(ctx, 'Crown', 480, 234, 19, 'ink', 'right');
      const LB = [['Enamel', 168, 668, 182, 'ink'], ['Dentine', 255, 650, 260, 'yellow'], ['Pulp', 300, 616, 292, 'red'], ['Gum', 345, 692, 345, 'red'], ['Root', 450, 645, 450, 'yellow'], ['Jawbone', 560, 692, 560, 'muted']];
      LB.forEach(([s, y, px, py, c], i) => { ctx.save(); ctx.globalAlpha *= after(t, 0.5 + i * 0.15); T(ctx, s, 712, y, 19, c, 'left'); lead(ctx, 707, y, px, py, c); ctx.restore(); });
      para(ctx, 'Enamel is the hardest material in the human body', 430, 626, 340, 19, 'muted', 500, 2);
      chip(ctx, 'Adults have 32 teeth; children have 20 milk teeth', MX, 678, 'cyan', 19);
      ctx.restore();
    },

    // Skin in cross-section, switching between a hot day (sweat evaporates,
    // vessels widen) and a cold day (hairs stand up, vessels narrow).
    'skin-layers'(b, ctx, it, t) {
      const k = b.clock; const ph = mod(k, 12);
      const h = ph < 6 ? smooth(ph / 0.8) * (1 - smooth((ph - 5.2) / 0.8)) : 0; const cc = 1 - h;
      begin(ctx, t, it, 'The layers of the skin');
      const XL = 30; const XR = 520; const HX = [150, 290];
      const surf = (x) => 200 - 9 * cc * HX.reduce((s, hx) => s + Math.exp(-(((x - hx - 4) / 24) ** 2)), 0);
      // Warm or cool air above the skin.
      // Layers.
      ctx.fillStyle = tint('yellow', 0.1); ctx.fillRect(XL, 445, XR - XL, 120);
      ctx.save(); ctx.beginPath(); ctx.rect(XL, 445, XR - XL, 120); ctx.clip();
      ctx.strokeStyle = tint('yellow', 0.35); ctx.lineWidth = 1.5;
      for (let i = 0; i < 14; i++) { const x = XL + 22 + (i % 7) * 70 + (Math.floor(i / 7) % 2) * 35; const y = 475 + Math.floor(i / 7) * 58; ell(ctx, x, y, 30, 24); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = tint('red', 0.1); ctx.fillRect(XL, 255, XR - XL, 190);
      ctx.fillStyle = tint('orange', 0.28); ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(XL, 255);
      for (let x = XL; x <= XR; x += 6) ctx.lineTo(x, surf(x));
      ctx.lineTo(XR, 255); ctx.closePath(); ctx.fill();
      ctx.beginPath(); for (let x = XL; x <= XR; x += 6) { if (x === XL) ctx.moveTo(x, surf(x)); else ctx.lineTo(x, surf(x)); } ctx.stroke();
      ctx.strokeStyle = tint('orange', 0.45); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(XL, 255); ctx.lineTo(XR, 255); ctx.stroke();
      ctx.strokeStyle = tint('ink', 0.3); ctx.lineWidth = 1.5; ctx.strokeRect(XL, 200, XR - XL, 365);
      // Blood vessels: wide and bright when hot, narrow when cold.
      const vy = (x) => 292 + 10 * Math.sin((x - XL) / 38);
      ctx.strokeStyle = tint('red', 0.3 + 0.55 * h); ctx.lineWidth = lerp(4, 13, h); ctx.beginPath();
      for (let x = XL; x <= XR; x += 6) { if (x === XL) ctx.moveTo(x, vy(x)); else ctx.lineTo(x, vy(x)); }
      ctx.stroke();
      for (let i = 0; i < 9; i++) { const x = XL + mod(k * 50 * (0.5 + h) + i * 55, XR - XL); dot(ctx, x, vy(x), lerp(2.5, 5, h), 'red'); }
      if (h > 0.05) {
        ctx.save(); ctx.globalAlpha *= h; ctx.strokeStyle = tint('orange', 0.7); ctx.lineWidth = 2.5;
        for (const x0 of [70, 220, 350, 480]) { const o = mod(k * 30 + x0, 60); ctx.beginPath(); for (let j = 0; j <= 10; j++) { const y = 280 - o - j * 6; const x = x0 + 5 * Math.sin(j * 0.9 + k * 4); if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); }
        ctx.restore();
      }
      // Hairs, their follicles and the tiny muscles that lift them.
      const phi = lerp(0.62, 0.1, cc);
      HX.forEach((hx) => {
        const sx = hx; const sy = surf(hx); const up = [Math.sin(phi), -Math.cos(phi)]; const dn = [-up[0], -up[1]]; const nn = [-dn[1], dn[0]];
        const bx = sx + dn[0] * 178; const by = sy + dn[1] * 178;
        ctx.strokeStyle = tint('ink', 0.45); ctx.lineWidth = 2; ctx.beginPath();
        for (const s of [-1, 1]) { ctx.moveTo(sx + nn[0] * 7 * s, sy + nn[1] * 7 * s); ctx.lineTo(bx + nn[0] * 8 * s, by + nn[1] * 8 * s); }
        ctx.stroke();
        dot(ctx, bx, by, 10, tint('ink', 0.4));
        ctx.strokeStyle = tint('ink', 0.9); ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(sx + up[0] * 78, sy + up[1] * 78); ctx.stroke();
        const mx = sx + dn[0] * 120 - nn[0] * 9; const my = sy + dn[1] * 120 - nn[1] * 9;
        ctx.strokeStyle = tint('red', 0.45 + 0.45 * cc); ctx.lineWidth = lerp(5, 10, cc); if (cc > 0.5) glow(ctx, COLORS.red, 8);
        ctx.beginPath(); ctx.moveTo(mx, my); ctx.quadraticCurveTo(hx + 30, 280, hx + 46, 257); ctx.stroke(); ctx.shadowBlur = 0;
      });
      // Sweat gland, duct and pore.
      const gx = 410; const py = surf(gx);
      ctx.strokeStyle = tint('cyan', 0.75); ctx.lineWidth = 4; ctx.beginPath();
      for (let i = 0; i <= 40; i++) { const s = (i / 40) * TAU; const x = gx + 22 * Math.sin(3 * s); const y = 420 + 12 * Math.sin(5 * s); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke();
      ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(gx, 408); ctx.lineTo(gx, py); ctx.stroke();
      if (h > 0.05) {
        ctx.save(); ctx.globalAlpha *= h;
        for (let j = 0; j < 5; j++) { const y = 405 - mod(k * 70 + j * 42, 205); dot(ctx, gx, y, 4, 'cyan'); }
        const g = mod(k, 2) / 2; const drop = 7 * Math.sin(Math.PI * clamp(g * 1.4));
        dot(ctx, gx, py - drop * 0.6, drop, tint('cyan', 0.8));
        ctx.strokeStyle = tint('cyan', 0.6); ctx.lineWidth = 2.5;
        for (const [ox, ph0] of [[-22, 0], [0, 0.33], [22, 0.66]]) { const o = mod(k * 0.6 + ph0, 1); ctx.save(); ctx.globalAlpha *= 1 - o; ctx.beginPath(); for (let j = 0; j <= 8; j++) { const y = py - 14 - o * 70 - j * 5; const x = gx + ox + 4 * Math.sin(j * 1.1 + k * 5); if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); ctx.restore(); }
        T(ctx, 'sweat evaporates', gx, 92, 18, 'cyan', 'center', 600);
        ctx.restore();
      }
      // Hot or cold.
      const hotNow = h > 0.5;
      if (hotNow) { dot(ctx, 52, 82, 11, 'orange'); ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2.5; ctx.beginPath(); for (let i = 0; i < 8; i++) { const q = (i / 8) * TAU; ctx.moveTo(52 + Math.cos(q) * 15, 82 + Math.sin(q) * 15); ctx.lineTo(52 + Math.cos(q) * 21, 82 + Math.sin(q) * 21); } ctx.stroke(); }
      else { ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 2.5; ctx.beginPath(); for (let i = 0; i < 6; i++) { const q = (i / 6) * TAU; ctx.moveTo(52, 82); ctx.lineTo(52 + Math.cos(q) * 16, 82 + Math.sin(q) * 16); } ctx.stroke(); }
      chip(ctx, hotNow ? 'Feeling hot' : 'Feeling cold', 80, 82, hotNow ? 'orange' : 'cyan', 21, 'left');
      // Labels in a column on the right.
      const hp = [HX[1] + Math.sin(phi) * 50, surf(HX[1]) - Math.cos(phi) * 50];
      const up1 = [Math.sin(phi), -Math.cos(phi)]; const nn1 = [up1[1], -up1[0]];
      const m0 = [HX[1] - up1[0] * 120 - nn1[0] * 9, surf(HX[1]) - up1[1] * 120 - nn1[1] * 9];
      const musc = [(m0[0] + HX[1] + 46) / 2 + 4, (m0[1] + 257) / 2 - 4];
      const LB = [['Hair', 120, hp[0], hp[1], 'ink'], ['Sweat pore', 170, gx + 4, py, 'cyan'], ['Epidermis', 228, XR, 228, 'orange'], ['Blood vessels', 290, XR - 14, vy(XR - 14), 'red'],
        ['Hair muscle', 335, musc[0], musc[1], 'red'], ['Dermis', 385, XR, 385, 'red'], ['Sweat gland', 430, gx + 24, 424, 'cyan'], ['Fat layer', 505, XR, 505, 'yellow']];
      LB.forEach(([s, y, px, py2, c]) => { T(ctx, s, 548, y, 19, c, 'left'); lead(ctx, 542, y, px, py2, c); });
      para(ctx, hotNow ? 'Hot: sweat comes out of pores and evaporates, carrying heat away. Blood vessels near the surface widen, so more heat escapes.'
        : 'Cold: tiny muscles pull the hairs upright (goosebumps), trapping warm air. Blood vessels near the surface narrow, keeping heat in.', 20, 632, 760, 19, 'ink', 500, 3);
      ctx.restore();
    },

    // ─── Kidneys, blood and defence ───────────────────────────────────────

    // A kidney, and one nephron: blood filtered, useful things taken back,
    // urea and water sent to the bladder.
    'kidney-filter'(b, ctx, it, t) {
      const k = b.clock; const oy = 15;
      const C = it._c || (it._c = (() => {
        const A = [330, 170 + oy, 395, 212 + oy];
        const tub = [433, 215 + oy, 740, 215 + oy, 740, 470 + oy, 610, 470 + oy, 610, 592];
        const cap = [400, 250 + oy, 710, 250 + oy, 710, 440 + oy, 330, 440 + oy];
        return {
          tub: mkPath(tub), cap: mkPath(cap),
          kinds: [
            [mkPath([...A, 400, 250 + oy, ...cap.slice(2)]), 'rbc', 7],
            [mkPath([...A, 433, 215 + oy, 520, 215 + oy, 530, 250 + oy, ...cap.slice(2)]), 'glucose', 4],
            [mkPath([...A, 433, 215 + oy, 640, 215 + oy, 650, 250 + oy, ...cap.slice(2)]), 'water', 3],
            [mkPath([...A, 433, 215 + oy, 740, 215 + oy, 740, 340 + oy, 710, 352 + oy, ...cap.slice(4)]), 'water', 3],
            [mkPath([...A, ...tub]), 'urea', 4],
            [mkPath([...A, ...tub]), 'water', 2],
          ],
        };
      })());
      begin(ctx, t, it, 'How the kidneys clean the blood');
      // The kidney, its blood vessels, ureter and bladder.
      const kx = 150; const ky = 270;
      ctx.lineWidth = 10;
      ctx.strokeStyle = tint('red', 0.75); poly(ctx, [kx + 48, ky - 8, 250, ky - 8, 250, 96]); ctx.stroke();
      ctx.strokeStyle = tint('blue', 0.75); poly(ctx, [kx + 48, ky + 8, 278, ky + 8, 278, 96]); ctx.stroke();
      for (let i = 0; i < 3; i++) { const q = mod(k * 0.5 + i / 3, 1); dot(ctx, 250, lerp(100, ky - 8, q), 4, 'ink'); dot(ctx, 278, lerp(ky + 8, 100, q), 4, 'ink'); }
      arr(ctx, 250, 104, 250, 128, 'red', 4); arr(ctx, 278, 128, 278, 104, 'blue', 4);
      T(ctx, 'Blood in', 242, 78, 19, 'red', 'right'); T(ctx, 'Clean blood out', 286, 78, 19, 'blue', 'left');
      ctx.strokeStyle = tint('yellow', 0.7); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(kx + 40, ky + 22); ctx.bezierCurveTo(kx + 70, ky + 90, kx + 30, ky + 150, kx, ky + 205); ctx.stroke();
      for (let i = 0; i < 3; i++) { const q = mod(k * 0.4 + i / 3, 1); const x = (1 - q) ** 3 * (kx + 40) + 3 * (1 - q) ** 2 * q * (kx + 70) + 3 * (1 - q) * q * q * (kx + 30) + q ** 3 * kx; const y = (1 - q) ** 3 * (ky + 22) + 3 * (1 - q) ** 2 * q * (ky + 90) + 3 * (1 - q) * q * q * (ky + 150) + q ** 3 * (ky + 205); dot(ctx, x, y, 3.5, 'yellow'); }
      ctx.fillStyle = tint('red', 0.16); ctx.strokeStyle = COLORS.red; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(kx, ky - 130); ctx.bezierCurveTo(kx + 70, ky - 132, kx + 92, ky - 60, kx + 62, ky - 22); ctx.quadraticCurveTo(kx + 45, ky, kx + 62, ky + 22);
      ctx.bezierCurveTo(kx + 92, ky + 60, kx + 70, ky + 132, kx, ky + 130); ctx.bezierCurveTo(kx - 95, ky + 128, kx - 95, ky - 128, kx, ky - 130); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = tint('red', 0.22);
      for (const a of [-1.0, -0.5, 0, 0.5, 1.0]) {
        const dx = Math.cos(Math.PI + a); const dy = Math.sin(Math.PI + a) * 1.5; const ax = kx + 26 + dx * 22; const ay = ky + dy * 22;
        const bx = kx + 26 + dx * 78; const by = ky + dy * 70; const L = Math.hypot(bx - ax, by - ay); const px = -(by - ay) / L * 17; const py = (bx - ax) / L * 17;
        poly(ctx, [ax, ay, bx + px, by + py, bx - px, by - py], true); ctx.fill();
      }
      ctx.fillStyle = tint('yellow', 0.3); poly(ctx, [kx + 30, ky - 22, kx + 50, ky, kx + 30, ky + 22, kx + 40, ky], true); ctx.fill();
      T(ctx, 'Kidney', kx - 18, ky + 60, 20, 'ink');
      ctx.fillStyle = tint('yellow', 0.2); ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 2.5; ell(ctx, kx, ky + 245, 60, 42); ctx.fill(); ctx.stroke();
      T(ctx, 'Bladder', kx, ky + 245, 19, 'yellow');
      T(ctx, 'Ureter', 214, ky + 150, 19, 'yellow', 'left');
      // Zoom into one nephron.
      ctx.strokeStyle = tint('ink', 0.5); ctx.lineWidth = 2; ell(ctx, 120, 182, 11, 11); ctx.stroke();
      line(ctx, 130, 176, 320, 100, tint('ink', 0.3), 1.5, [5, 7]); line(ctx, 130, 190, 320, 565, tint('ink', 0.3), 1.5, [5, 7]);
      panel(ctx, 320, 100, 470, 465, 'blue', 0.05, 18);
      T(ctx, 'One nephron (each kidney has about a million)', 555, 124, 18, 'muted', 'center', 600);
      // Blood capillary: red (oxygen-rich, dirty) → blue (clean).
      ctx.lineWidth = 14; const cp = C.cap; const segs = 6;
      for (let i = 0; i < segs; i++) { const q = i / (segs - 1); ctx.strokeStyle = `rgba(${Math.round(lerp(251, 91, q))}, ${Math.round(lerp(113, 140, q))}, ${Math.round(lerp(133, 255, q))}, 0.38)`; strokeSpan(ctx, cp, (i / segs) * cp.total, ((i + 1) / segs) * cp.total + 1); }
      line(ctx, 330, 170 + oy, 395, 212 + oy, tint('red', 0.5), 12);
      line(ctx, 395, 212 + oy, 400, 250 + oy, tint('red', 0.45), 12);
      arr(ctx, 360, 440 + oy, 330, 440 + oy, 'blue', 4);
      // Tubule and collecting duct.
      ctx.strokeStyle = tint('yellow', 0.22); ctx.lineWidth = 24; poly(ctx, C.tub.pts); ctx.stroke();
      ctx.strokeStyle = tint('yellow', 0.6); ctx.lineWidth = 1.5; poly(ctx, C.tub.pts); ctx.stroke();
      // Capsule around the glomerulus.
      ctx.strokeStyle = tint('yellow', 0.85); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(395, 227, 38, -2.1, 1.75 + Math.PI * 0.5, false); ctx.stroke();
      ctx.strokeStyle = tint('red', 0.9); ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= 50; i++) { const q = (i / 50) * TAU * 3; const r = 10 + 10 * Math.sin(q * 1.7); const x = 395 + Math.cos(q) * r; const y = 227 + Math.sin(q) * r; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke();
      // Reabsorption arrows.
      for (const [x0, y0, x1, y1] of [[520, 232, 528, 254], [640, 232, 648, 254], [732, 355, 714, 362]]) arr(ctx, x0, y0, x1, y1, 'green', 3);
      // Particles.
      C.kinds.forEach(([p, kind, n], ki) => {
        for (let i = 0; i < n; i++) {
          const d = mod(k * 75 + (i / n) * p.total + ki * 37, p.total); const P = at(p, d);
          if (kind === 'rbc') { dot(ctx, P.x, P.y, 7, 'red'); dot(ctx, P.x, P.y, 2.5, 'rgba(120,20,40,0.8)'); }
          else if (kind === 'glucose') { ctx.fillStyle = COLORS.yellow; ctx.beginPath(); for (let j = 0; j < 6; j++) { const a = (j / 6) * TAU; if (j) ctx.lineTo(P.x + Math.cos(a) * 6.5, P.y + Math.sin(a) * 6.5); else ctx.moveTo(P.x + 6.5, P.y); } ctx.closePath(); ctx.fill(); }
          else if (kind === 'water') dot(ctx, P.x, P.y, 5, 'cyan');
          else { ctx.fillStyle = COLORS.orange; ctx.fillRect(P.x - 5, P.y - 5, 10, 10); }
        }
      });
      // Labels.
      T(ctx, 'Glomerulus: filters the blood', 452, 176, 19, 'red', 'left'); lead(ctx, 448, 182, 412, 214, 'red');
      T(ctx, 'Tubule takes back useful things:', 555, 320, 19, 'green');
      T(ctx, 'glucose and most of the water', 555, 346, 19, 'green', 'center', 600);
      T(ctx, 'Blood capillary', 555, 418, 18, 'purple', 'center', 600);
      T(ctx, 'Collecting duct', 624, 532, 19, 'yellow', 'left');
      T(ctx, 'Urine to the bladder', 596, 590, 19, 'yellow', 'right');
      // Legend.
      const LG = [['Blood cells: stay in the blood', 'red', 'rbc'], ['Glucose: taken back', 'yellow', 'glucose'], ['Water: most is taken back', 'cyan', 'water'], ['Urea: waste, leaves in urine', 'orange', 'urea']];
      LG.forEach(([s, c, kind], i) => {
        const x = 40 + (i % 2) * 400; const y = 636 + Math.floor(i / 2) * 36;
        if (kind === 'urea') { ctx.fillStyle = COLORS.orange; ctx.fillRect(x - 6, y - 6, 12, 12); } else dot(ctx, x, y, kind === 'rbc' ? 7 : 6, c);
        T(ctx, s, x + 18, y, 19, c, 'left', 600);
      });
      ctx.restore();
    },

    // Germs get in; a phagocyte engulfs them; a lymphocyte releases
    // antibodies that stick to germs and clump them.
    'immune-response'(b, ctx, it, t) {
      const k = b.clock; const tt = cycle(t, 13.5, 0.3);
      begin(ctx, t, it, 'Fighting germs: the immune system');
      const sc = 1 - smooth((tt - 12.8) / 0.7);
      const gate = [197, 86];
      const TG = [[150, 250], [245, 300], [175, 365], [470, 225], [565, 280], [480, 345], [610, 215]];
      const CL = [[-14, -8], [12, -10], [-6, 12], [16, 10]];
      const EAT = [6.5, 4.9, 3.4, 10.2, 10.2, 10.2, 10.2];
      const WP = [[0, 90, 480], [1.6, 90, 480], [2.6, 120, 410], [3.4, 175, 365], [4.4, 175, 365], [4.9, 245, 300], [5.9, 245, 300], [6.5, 150, 250], [7.5, 150, 250], [8.8, 330, 280], [10.2, 535, 290], [13.5, 535, 290]];
      let pi = 0; while (pi < WP.length - 2 && WP[pi + 1][0] <= tt) pi++;
      const w0 = WP[pi]; const w1 = WP[pi + 1]; const pq = smooth((tt - w0[0]) / Math.max(0.01, w1[0] - w0[0]));
      const ph = [lerp(w0[1], w1[1], pq), lerp(w0[2], w1[2], pq)];
      const germPos = (i) => {
        const en = 0.2 + i * 0.3; if (tt < en) return null;
        const q = smooth((tt - en) / 1.4);
        let p = [lerp(gate[0], TG[i][0], q) + Math.sin(k * 2 + i) * 4 * q, lerp(gate[1], TG[i][1], q) + Math.cos(k * 1.7 + i) * 4 * q];
        if (i >= 3) p = P2(p, [535 + CL[i - 3][0], 290 + CL[i - 3][1]], smooth((tt - 8.6) / 1.0));
        return p;
      };
      const lx = 655; const ly = 398;
      ctx.save(); ctx.globalAlpha *= sc;
      // Skin with a small cut, and a blood vessel below.
      ctx.fillStyle = tint('orange', 0.22); ctx.strokeStyle = tint('orange', 0.8); ctx.lineWidth = 2;
      ctx.fillRect(0, 64, 182, 40); ctx.fillRect(212, 64, 588, 40);
      line(ctx, 0, 64, 182, 64, tint('orange', 0.9), 3); line(ctx, 212, 64, 800, 64, tint('orange', 0.9), 3);
      line(ctx, 182, 64, 186, 104, tint('orange', 0.8), 2); line(ctx, 212, 64, 208, 104, tint('orange', 0.8), 2);
      T(ctx, 'Skin', 40, 126, 18, 'orange', 'left', 600);
      ctx.fillStyle = tint('red', 0.08); ctx.fillRect(0, 446, 800, 62);
      line(ctx, 0, 446, 800, 446, tint('red', 0.6), 3); line(ctx, 0, 508, 800, 508, tint('red', 0.6), 3);
      for (let i = 0; i < 10; i++) { const x = mod(i * 85 + k * 60, 860) - 30; ctx.fillStyle = tint('red', 0.6); ell(ctx, x, 466 + (i % 3) * 14, 13, 7); ctx.fill(); }
      T(ctx, 'Blood vessel', 400, 528, 18, 'red', 'center', 600);
      // Lymphocyte.
      const rel = tt > 5.2 && tt < 7.4 ? 1 + 0.06 * Math.sin(k * 10) : 1;
      lymph(ctx, lx, ly, 28 * rel, 'purple');
      T(ctx, 'Lymphocyte', 722, 350, 18, 'purple', 'center', 600);
      // Germs (and antibodies on them).
      const shrink = (i) => { const e = EAT[i]; if (tt < e) return 1; return 1 - smooth((tt - e - 0.4) / 0.6); };
      const pos = TG.map((_, i) => { let p = germPos(i); if (!p) return null; const e = EAT[i]; if (tt >= e) p = P2(p, ph, smooth((tt - e) / 0.4) * (i >= 3 ? 0.8 : 1)); return p; });
      pos.forEach((p, i) => { if (!p) return; const s = shrink(i); if (s <= 0.02) return; germ(ctx, p[0], p[1], s, i * 0.7 + Math.sin(k + i) * 0.2); });
      for (let m = 0; m < 8; m++) {
        const gi = 3 + Math.floor(m / 2); const p = pos[gi]; if (!p) continue; const s = shrink(gi); if (s <= 0.02) continue;
        const a = m % 2 ? 0.8 : -2.3; const tgt = [p[0] + Math.cos(a) * 19 * s, p[1] + Math.sin(a) * 15 * s];
        const L0 = 5.2 + m * 0.25; if (tt < L0) continue;
        const q = smooth((tt - L0) / 1.3); const P = P2([lx, ly], tgt, q);
        const dir = q < 1 ? Math.atan2(tgt[1] - ly, tgt[0] - lx) : a + Math.PI;
        antibody(ctx, P[0], P[1], dir, 'yellow', s);
      }
      // Phagocyte: a wobbly blob with a lobed nucleus, reaching for germs.
      const near = pos.findIndex((p, i) => p && tt > EAT[i] - 1.0 && tt < EAT[i] + 0.4);
      const reach = near >= 0 ? Math.atan2(pos[near][1] - ph[1], pos[near][0] - ph[0]) : 0; const rr = near >= 0 ? 1 : 0;
      ctx.fillStyle = tint('cyan', 0.16); ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let i = 0; i <= 40; i++) { const a = (i / 40) * TAU; const d = Math.cos(a - reach); const r = 34 + 3 * Math.sin(a * 5 + k * 3) + rr * 12 * Math.max(0, d) ** 4; const x = ph[0] + Math.cos(a) * r; const y = ph[1] + Math.sin(a) * r; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = tint('purple', 0.6); for (const [ox, oy] of [[-10, -6], [2, -10], [10, 2], [-2, 8]]) { ell(ctx, ph[0] + ox, ph[1] + oy, 7, 6); ctx.fill(); }
      ctx.restore();
      // Stage and legend.
      const ST = tt < 2.6 ? ['Germs get in through a cut in the skin', 'green'] : tt < 5.2 ? ['A phagocyte engulfs (swallows) germs', 'cyan'] : tt < 8.6 ? ['A lymphocyte releases antibodies that stick to germs', 'yellow']
        : tt < 10.2 ? ['Antibodies clump the germs together', 'yellow'] : tt < 11.4 ? ['The phagocyte engulfs the whole clump', 'cyan'] : ['The germs are destroyed', 'green'];
      chip(ctx, ST[0], MX, 574, ST[1], 20);
      germ(ctx, 46, 624, 0.9); T(ctx, 'Germs (bacteria)', 70, 624, 19, 'green', 'left', 600);
      ctx.fillStyle = tint('cyan', 0.2); ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 2; ell(ctx, 446, 624, 13, 13); ctx.fill(); ctx.stroke();
      T(ctx, 'Phagocyte: engulfs germs', 470, 624, 19, 'cyan', 'left', 600);
      lymph(ctx, 46, 664, 12, 'purple'); T(ctx, 'Lymphocyte: makes antibodies', 70, 664, 19, 'purple', 'left', 600);
      antibody(ctx, 446, 668, -Math.PI / 2, 'yellow', 1.1); T(ctx, 'Antibodies: stick to germs', 470, 664, 19, 'yellow', 'left', 600);
      ctx.restore();
    },

    // Blood flowing in a vessel: red cells, white cells, platelets, plasma.
    'blood-cells'(b, ctx, it, t) {
      const k = b.clock; const act = Math.floor(cycle(t, 12, 0.6) / 3);
      begin(ctx, t, it, 'What blood is made of');
      const top = 92; const bot = 372; const mid = (top + bot) / 2; const R = (bot - top) / 2 - 8;
      const sp = (y) => 105 * (1 - 0.6 * ((y - mid) / R) ** 2);
      ctx.fillStyle = tint('yellow', act === 3 ? 0.17 : 0.07); ctx.fillRect(0, top, 800, bot - top);
      ctx.save(); ctx.beginPath(); ctx.rect(0, top + 6, 800, bot - top - 12); ctx.clip();
      const dim = (ty) => (act === ty ? 1 : 0.32);
      if (act === 3) for (let i = 0; i < 40; i++) { const y = mid + (rnd(i + 300) * 2 - 1) * R; const x = mod(rnd(i + 200) * 860 + sp(y) * 1.1 * k, 860) - 30; dot(ctx, x, y, 3, ['yellow', 'ink', 'teal', 'orange'][i % 4]); }
      // Platelets.
      ctx.save(); ctx.globalAlpha *= dim(2);
      for (let i = 0; i < 14; i++) {
        const y = mid + (rnd(i + 100) * 2 - 1) * R; const x = mod(rnd(i + 140) * 880 + sp(y) * k, 880) - 40;
        ctx.fillStyle = tint('yellow', 0.85); ctx.beginPath(); for (let j = 0; j < 5; j++) { const a = (j / 5) * TAU + i; const r = 5 + 2.5 * rnd(i * 5 + j); if (j) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      // Red blood cells, tumbling: a disc with a dimple, or edge-on.
      ctx.save(); ctx.globalAlpha *= dim(0);
      for (let i = 0; i < 30; i++) {
        const y = mid + (rnd(i) * 2 - 1) * (R - 14); const x = mod(rnd(i + 40) * 900 + sp(y) * k, 900) - 50;
        const s = 0.35 + 0.65 * Math.abs(Math.cos(k * 0.8 + i * 1.7)); const rot = rnd(i + 7) * Math.PI;
        ctx.fillStyle = tint('red', 0.78); ell(ctx, x, y, 17, 17 * s, rot); ctx.fill();
        if (s > 0.6) { ctx.fillStyle = 'rgba(120,20,45,0.55)'; ell(ctx, x, y, 7, 7 * s, rot); ctx.fill(); }
        if (act === 0 && i % 2 === 0) { dot(ctx, x + 10, y - 9, 3.5, 'cyan'); dot(ctx, x + 16, y - 6, 3.5, 'cyan'); }
      }
      ctx.restore();
      // White blood cells, rolling more slowly.
      ctx.save(); ctx.globalAlpha *= dim(1);
      [[132, 0], [312, 1], [230, 2]].forEach(([y, i]) => {
        const x = mod(rnd(i + 70) * 900 + sp(y) * 0.5 * k, 900) - 50;
        ctx.fillStyle = tint('purple', 0.25); ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 2.5; ell(ctx, x, y, 26, 25); ctx.fill(); ctx.stroke();
        ctx.fillStyle = tint('purple', 0.75);
        if (i === 1) { ell(ctx, x + 2, y, 17, 16); ctx.fill(); } else for (const [ox, oy] of [[-9, -5], [3, -9], [10, 4], [-3, 8]]) { ell(ctx, x + ox, y + oy, 7, 6); ctx.fill(); }
      });
      ctx.restore();
      ctx.restore();
      // Vessel walls and the flow arrow.
      line(ctx, 0, top, 800, top, tint('red', 0.55), 12); line(ctx, 0, bot, 800, bot, tint('red', 0.55), 12);
      T(ctx, 'Blood flow', 600, 64, 19, 'muted', 'right', 600); arr(ctx, 616, 64, 760, 64, 'muted', 3);
      // Four cards; the current one glows.
      const CARDS = [['Red blood cells', 'red', 'Carry oxygen from the lungs to every cell'], ['White blood cells', 'purple', 'Fight germs and protect the body from infection'],
        ['Platelets', 'yellow', 'Tiny cell pieces that help blood clot at a cut'], ['Plasma', 'orange', 'Yellowish liquid carrying food, waste and hormones']];
      CARDS.forEach(([name, c, job], i) => {
        const x = 15 + (i % 2) * 395; const y = 402 + Math.floor(i / 2) * 145; const on = i === act;
        ctx.save(); ctx.globalAlpha *= on ? 1 : 0.65;
        if (on) glow(ctx, color(c), 14);
        panel(ctx, x, y, 375, 130, c, on ? 0.16 : 0.05, 16); ctx.shadowBlur = 0;
        const ix = x + 46; const iy = y + 65;
        if (i === 0) { ctx.fillStyle = tint('red', 0.8); ell(ctx, ix, iy, 24, 24); ctx.fill(); ctx.fillStyle = 'rgba(120,20,45,0.55)'; ell(ctx, ix, iy, 10, 10); ctx.fill(); }
        else if (i === 1) { ctx.fillStyle = tint('purple', 0.25); ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 2.5; ell(ctx, ix, iy, 26, 26); ctx.fill(); ctx.stroke(); ctx.fillStyle = tint('purple', 0.75); for (const [ox, oy] of [[-9, -5], [3, -9], [10, 4], [-3, 8]]) { ell(ctx, ix + ox, iy + oy, 7, 6); ctx.fill(); } }
        else if (i === 2) { for (const [ox, oy] of [[-10, -6], [8, -10], [2, 10]]) { ctx.fillStyle = tint('yellow', 0.85); ctx.beginPath(); for (let j = 0; j < 5; j++) { const a = (j / 5) * TAU + ox; const r = 7 + 3 * rnd(j + oy); if (j) ctx.lineTo(ix + ox + Math.cos(a) * r, iy + oy + Math.sin(a) * r); else ctx.moveTo(ix + ox + Math.cos(a) * r, iy + oy + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); } }
        else { ctx.fillStyle = tint('yellow', 0.35); ctx.strokeStyle = tint('orange', 0.8); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ix, iy - 28); ctx.quadraticCurveTo(ix + 24, iy + 2, ix + 18, iy + 14); ctx.arc(ix, iy + 10, 19, 0.2, Math.PI - 0.2); ctx.quadraticCurveTo(ix - 24, iy + 2, ix, iy - 28); ctx.fill(); ctx.stroke(); }
        T(ctx, name, x + 88, y + 34, 22, c, 'left');
        para(ctx, job, x + 88, y + 84, 275, 19, on ? 'ink' : 'muted', 500, 2, 'left');
        ctx.restore();
      });
      ctx.restore();
    },

    // ─── Nerves and hormones ──────────────────────────────────────────────

    // Hand on a hot mug: receptor → sensory neurone → relay neurone in the
    // spinal cord → motor neurone → muscle pulls the hand away; the brain is
    // told afterwards.
    'reflex-arc'(b, ctx, it, t) {
      const k = b.clock; const tt = cycle(t, 8.5, 0.3);
      const bend = tt < 3.3 ? 1 - smooth(tt / 0.6) : smooth((tt - 3.3) / 0.5);
      begin(ctx, t, it, 'The reflex arc');
      const El = [420, 588]; const al = Math.PI + lerp(0.16, 0.78, bend);
      const d = [Math.cos(al), Math.sin(al)]; const nT = [-Math.sin(al), Math.cos(al)];
      const F = (u, v) => [El[0] + d[0] * u + nT[0] * v, El[1] + d[1] * u + nT[1] * v];
      // Hot mug with steam.
      ctx.save(); glow(ctx, COLORS.orange, 14);
      ctx.fillStyle = tint('red', 0.22); ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 3; rounded(ctx, 52, 488, 88, 102, 10); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(52, 538, 22, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = tint('ink', 0.45); ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) { const x0 = 72 + i * 24; const o = mod(k * 0.7 + i * 0.3, 1); ctx.save(); ctx.globalAlpha *= Math.sin(Math.PI * o); ctx.beginPath(); for (let j = 0; j <= 10; j++) { const y = 478 - o * 30 - j * 5; const x = x0 + 5 * Math.sin(j * 0.8 + k * 3); if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); ctx.restore(); }
      T(ctx, 'Hot mug', 96, 392, 19, 'orange', 'center', 700);
      // Arm: upper arm, forearm, hand; biceps on top.
      limb(ctx, [El[0], El[1], 770, 588], 60);
      const mus = bend; ctx.fillStyle = tint('red', 0.25 + 0.4 * mus); ctx.strokeStyle = tint('red', 0.6 + 0.4 * mus); ctx.lineWidth = 2;
      if (mus > 0.5) glow(ctx, COLORS.red, 10);
      ell(ctx, 590, 566, 92 - 10 * mus, 13 + 9 * mus); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      const wr = F(200, 0); const tip = F(262, 0);
      limb(ctx, [El[0], El[1], wr[0], wr[1]], 50); limb(ctx, [wr[0], wr[1], tip[0], tip[1]], 40);
      // Spinal cord in cross-section.
      const sx = 612; const sy = 245;
      ctx.fillStyle = tint('ink', 0.07); ctx.strokeStyle = tint('ink', 0.5); ctx.lineWidth = 2; ell(ctx, sx, sy, 78, 62); ctx.fill(); ctx.stroke();
      ctx.fillStyle = tint('purple', 0.28); ctx.strokeStyle = COLORS.purple; ctx.beginPath();
      ctx.moveTo(612, 232); ctx.quadraticCurveTo(596, 212, 584, 198); ctx.quadraticCurveTo(574, 214, 590, 240); ctx.quadraticCurveTo(570, 262, 578, 290); ctx.quadraticCurveTo(600, 288, 612, 260);
      ctx.quadraticCurveTo(624, 288, 646, 290); ctx.quadraticCurveTo(654, 262, 634, 240); ctx.quadraticCurveTo(650, 214, 640, 198); ctx.quadraticCurveTo(628, 212, 612, 232); ctx.fill(); ctx.stroke();
      dot(ctx, sx, 246, 3, 'ink');
      // Nerve pathways.
      const rec = F(268, 6);
      const sens = mkPath([rec[0], rec[1], ...F(200, 12), ...F(100, 14), ...F(30, 16), 440, 550, 432, 470, 455, 330, 500, 230, 528, 200, 572, 206, 588, 216]);
      const relay = mkPath([588, 216, 600, 242, 590, 280]);
      const motor = mkPath([590, 282, 562, 300, 548, 360, 552, 470, 576, 548]);
      const brain = mkPath([sx, 183, sx, 92]);
      const prog = (a, c) => clamp((tt - a) / (c - a));
      const nerve = (p, c, q, on) => {
        ctx.strokeStyle = tint(c, on ? 0.95 : 0.55); ctx.lineWidth = on ? 5 : 4; if (on) glow(ctx, color(c), 10); poly(ctx, p.pts); ctx.stroke(); ctx.shadowBlur = 0;
        if (q > 0 && q < 1) { ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 7; strokeSpan(ctx, p, Math.max(0, q * p.total - 50), q * p.total); const P = at(p, q * p.total); dot(ctx, P.x, P.y, 8, 'ink', 14); }
      };
      ctx.fillStyle = tint('cyan', 0.3); ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 2; ell(ctx, 528, 200, 14, 10, 0.3); ctx.fill(); ctx.stroke();
      nerve(sens, 'cyan', prog(1.1, 2.1), tt > 1.1 && tt < 2.1);
      nerve(relay, 'purple', prog(2.1, 2.5), tt > 2.1 && tt < 2.5);
      nerve(motor, 'orange', prog(2.5, 3.3), tt > 2.5 && tt < 3.3);
      ctx.save(); ctx.globalAlpha *= 0.5 + 0.5 * (tt > 3.9 && tt < 5.4 ? 1 : 0);
      arr(ctx, sx, 183, sx, 90, 'ink', 4); ctx.restore();
      if (tt > 3.9 && tt < 5.4) { const P = at(brain, prog(3.9, 5.0) * brain.total); dot(ctx, P.x, P.y, 7, 'ink', 12); }
      T(ctx, 'To the brain', sx + 16, 96, 19, 'ink', 'left');
      if (tt > 4.9 && tt < 6.6) chip(ctx, 'Ouch!', sx + 120, 132, 'red', 20);
      // The receptor glows when it senses the heat.
      const hot = tt > 0.55 && tt < 1.6;
      dot(ctx, rec[0], rec[1], hot ? 8 : 5, hot ? 'yellow' : tint('yellow', 0.7), hot ? 14 : 0);
      // Labels.
      T(ctx, 'Receptor (in the skin)', 215, 652, 19, 'yellow'); lead(ctx, 215, 638, rec[0], rec[1] + 6, 'yellow');
      T(ctx, 'Sensory neurone', 400, 330, 20, 'cyan', 'right');
      T(ctx, 'Motor neurone', 566, 420, 20, 'orange', 'left');
      T(ctx, 'Spinal cord', 790, 320, 20, 'ink', 'right'); lead(ctx, 700, 312, 672, 286, 'ink');
      T(ctx, 'Relay neurone', 790, 165, 20, 'purple', 'right'); lead(ctx, 668, 174, 601, 238, 'purple');
      T(ctx, 'Muscle (effector)', 590, 652, 19, 'red');
      const ST = tt < 0.6 ? ['The hand touches a hot mug', 'orange'] : tt < 1.1 ? ['Receptors in the skin detect heat', 'yellow'] : tt < 2.1 ? ['Sensory neurone carries the impulse', 'cyan']
        : tt < 2.5 ? ['Relay neurone in the spinal cord', 'purple'] : tt < 3.3 ? ['Motor neurone carries it to a muscle', 'orange'] : tt < 3.9 ? ['The muscle contracts: hand pulls away', 'red']
          : tt < 5.4 ? ['Only then is the brain told', 'ink'] : ['Fast and automatic: no thinking needed', 'green'];
      chip(ctx, ST[0], 220, 112, ST[1], 19);
      para(ctx, 'Receptor → sensory neurone → relay neurone → motor neurone → muscle', 28, 178, 380, 19, 'muted', 500, 3);
      ctx.restore();
    },

    // Four glands release hormones into the blood; each travels to its target.
    hormones(b, ctx, it, t) {
      const k = b.clock; const act = Math.floor(cycle(t, 16, 0.6) / 4);
      const GL = [
        { name: 'Pituitary gland', hormone: 'the "master gland"', job: 'Its hormones control growth and tell other glands, like the thyroid and adrenals, what to do', c: 'purple', at: [200, 138], badge: [338, 138], routes: [[200, 138, 194, 165, 194, 184], [200, 138, 206, 170, 206, 210, 200, 230, 200, 405, 236, 412]] },
        { name: 'Thyroid gland', hormone: 'makes thyroxine', job: 'Thyroxine sets how fast the cells all over the body use energy (metabolism)', c: 'teal', at: [200, 188], badge: [338, 190], routes: [[200, 190, 200, 228, 112, 252, 92, 440], [200, 190, 200, 228, 288, 252, 308, 440], [200, 190, 200, 500, 160, 545], [200, 190, 200, 500, 240, 545]] },
        { name: 'Adrenal glands', hormone: 'make adrenaline', job: 'Adrenaline makes the heart beat faster and gets the body ready for action ("fight or flight")', c: 'orange', at: [236, 412], badge: [338, 412], routes: [[236, 412, 200, 402, 200, 290, 220, 274], [164, 412, 200, 402, 200, 290, 220, 274]] },
        { name: 'Pancreas', hormone: 'makes insulin', job: 'Insulin tells the liver and muscles to take in glucose, so blood sugar goes down', c: 'yellow', at: [226, 360], badge: [338, 360], routes: [[226, 360, 200, 352, 200, 330, 160, 322]] },
      ];
      const C = it._c || (it._c = GL.map((g) => g.routes.map(mkPath)));
      begin(ctx, t, it, 'Hormones and glands');
      // Body outline.
      ctx.fillStyle = tint('blue', 0.06); ctx.strokeStyle = tint('blue', 0.5); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(185, 166); ctx.lineTo(185, 192); ctx.quadraticCurveTo(120, 196, 100, 222); ctx.lineTo(78, 470); ctx.quadraticCurveTo(89, 488, 100, 470); ctx.lineTo(112, 300); ctx.lineTo(120, 560);
      ctx.lineTo(280, 560); ctx.lineTo(288, 300); ctx.lineTo(300, 470); ctx.quadraticCurveTo(311, 488, 322, 470); ctx.lineTo(300, 222); ctx.quadraticCurveTo(280, 196, 215, 192); ctx.lineTo(215, 166); ctx.closePath(); ctx.fill(); ctx.stroke();
      ell(ctx, 200, 116, 44, 52); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = tint('purple', 0.3); ctx.lineWidth = 2; ell(ctx, 200, 106, 33, 28); ctx.stroke();
      line(ctx, 200, 205, 200, 520, tint('red', 0.35), 6);
      // Target organs.
      const tgtOn = (i) => act === i;
      ctx.save(); ctx.translate(222, 272); ctx.scale(1 + 0.08 * (tgtOn(2) ? Math.max(0, Math.sin(k * 9)) : 0), 1); ctx.fillStyle = tint('red', tgtOn(2) ? 0.6 : 0.3); ctx.beginPath(); ctx.moveTo(0, 14); ctx.bezierCurveTo(-22, 0, -14, -18, 0, -8); ctx.bezierCurveTo(14, -18, 22, 0, 0, 14); ctx.fill(); ctx.restore();
      ctx.fillStyle = tint('muted', tgtOn(3) ? 0.5 : 0.25); ell(ctx, 152, 320, 42, 24, -0.1); ctx.fill();
      ctx.fillStyle = tint('muted', 0.25); ell(ctx, 164, 440, 13, 22); ctx.fill(); ell(ctx, 236, 440, 13, 22); ctx.fill();
      T(ctx, 'Heart', 246, 268, 18, tgtOn(2) ? 'red' : 'muted', 'left', 600);
      T(ctx, 'Liver', 150, 322, 18, tgtOn(3) ? 'ink' : 'muted', 'center', 600);
      // Glands.
      GL.forEach((g, i) => {
        const on = i === act; ctx.save(); if (on) glow(ctx, color(g.c), 14);
        ctx.fillStyle = tint(g.c, on ? 0.9 : 0.55);
        if (i === 0) { ell(ctx, 200, 138, 7, 7); ctx.fill(); }
        else if (i === 1) { ell(ctx, 191, 188, 9, 6, -0.3); ctx.fill(); ell(ctx, 209, 188, 9, 6, 0.3); ctx.fill(); }
        else if (i === 2) { for (const x of [164, 236]) { poly(ctx, [x - 11, 418, x + 11, 418, x, 404], true); ctx.fill(); } }
        else { ell(ctx, 226, 360, 34, 9, -0.15); ctx.fill(); }
        ctx.restore();
        ctx.save(); ctx.globalAlpha *= on ? 1 : 0.55;
        lead(ctx, g.badge[0] - 14, g.badge[1], i === 2 ? 248 : i === 3 ? 260 : i === 1 ? 218 : 208, i === 2 ? 412 : g.at[1], g.c);
        ctx.fillStyle = tint(g.c, 0.3); ctx.strokeStyle = color(g.c); ctx.lineWidth = 2; ell(ctx, g.badge[0], g.badge[1], 13, 13); ctx.fill(); ctx.stroke();
        T(ctx, i + 1, g.badge[0], g.badge[1] + 1, 17, 'ink');
        ctx.restore();
      });
      // Hormone molecules travelling in the blood from the active gland.
      C[act].forEach((p) => { for (let j = 0; j < 5; j++) { const d = mod(k * 70 + (j / 5) * p.total, p.total); const P = at(p, d); dot(ctx, P.x, P.y, 5, GL[act].c, 8); } });
      // Cards.
      GL.forEach((g, i) => {
        const y = 72 + i * 90; const on = i === act;
        ctx.save(); ctx.globalAlpha *= on ? 1 : 0.6;
        panel(ctx, 365, y, 425, 80, g.c, on ? 0.16 : 0.04, 14);
        ctx.fillStyle = tint(g.c, 0.3); ctx.strokeStyle = color(g.c); ctx.lineWidth = 2; ell(ctx, 392, y + 40, 14, 14); ctx.fill(); ctx.stroke();
        T(ctx, i + 1, 392, y + 41, 17, 'ink');
        T(ctx, g.name, 418, y + 27, 21, g.c, 'left'); T(ctx, g.hormone, 418, y + 56, 19, on ? 'ink' : 'muted', 'left', 500);
        ctx.restore();
      });
      panel(ctx, 365, 440, 425, 84, GL[act].c, 0.07, 14);
      para(ctx, GL[act].job, 380, 482, 395, 19, 'ink', 500, 3);
      // Nerves vs hormones: a race.
      const n = smooth(clamp(mod(k, 1.6) / 0.28)); const hq = clamp(mod(k, 6.4) / 5.5);
      T(ctx, 'Nerves', 365, 556, 20, 'cyan', 'left'); line(ctx, 480, 556, 775, 556, tint('cyan', 0.25), 3);
      dot(ctx, lerp(480, 775, n), 556, 7, 'cyan', 12);
      T(ctx, 'fast, electrical, short-lived', 480, 582, 18, 'muted', 'left', 500);
      T(ctx, 'Hormones', 365, 616, 20, 'orange', 'left'); line(ctx, 480, 616, 775, 616, tint('orange', 0.25), 3);
      dot(ctx, lerp(480, 775, hq), 616, 7, 'orange', 12);
      T(ctx, 'slower, in the blood, last longer', 480, 642, 18, 'muted', 'left', 500);
      T(ctx, 'Glands release hormones into the blood; each acts on target organs', MX, 682, 19, 'ink', 'center', 600);
      ctx.restore();
    },

    // ─── Germs, healing and vaccines ──────────────────────────────────────

    // Germs travel by touch from hand to door handle to hand; soap breaks up
    // their oily outer layer and water rinses them away.
    'germs-handwashing'(b, ctx, it, t) {
      const k = b.clock; const tt = cycle(t, 15, 0.3);
      begin(ctx, t, it, 'Germs and hand washing');
      const hand = (x, y, s, sc2 = 1) => {
        ctx.save(); ctx.translate(x, y); ctx.scale(s * sc2, sc2);
        ctx.fillStyle = tint('blue', 0.3); ctx.strokeStyle = tint('blue', 0.7); ctx.lineWidth = 2; rounded(ctx, -110, -24, 64, 48, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#16142a'; ctx.strokeStyle = tint('orange', 0.85); ctx.lineWidth = 2.5; rounded(ctx, -48, -26, 106, 52, 24); ctx.fill(); ctx.stroke();
        ctx.fillStyle = tint('orange', 0.18); rounded(ctx, -48, -26, 106, 52, 24); ctx.fill();
        ctx.strokeStyle = tint('orange', 0.5); ctx.lineWidth = 1.5; ctx.beginPath(); for (const v of [-12, 0, 12]) { ctx.moveTo(22, v); ctx.lineTo(54, v); } ctx.stroke();
        ctx.fillStyle = '#16142a'; ctx.strokeStyle = tint('orange', 0.85); ctx.lineWidth = 2.5; ell(ctx, 6, -28, 20, 9, -0.25); ctx.fill(); ctx.stroke();
        ctx.fillStyle = tint('orange', 0.18); ell(ctx, 6, -28, 20, 9, -0.25); ctx.fill();
        ctx.restore();
      };
      // ── Panel 1: germs spread by touch.
      const tp = Math.min(tt, 6.2); const on1 = tt < 6.4;
      ctx.save(); ctx.globalAlpha *= on1 ? 1 : 0.55;
      panel(ctx, 10, 60, 780, 258, 'green', 0.04, 16);
      T(ctx, '1  Germs spread by touch', 30, 86, 20, 'green', 'left');
      ctx.fillStyle = tint('muted', 0.2); ctx.strokeStyle = tint('muted', 0.6); ctx.lineWidth = 2; rounded(ctx, 376, 118, 48, 164, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = tint('yellow', 0.3); ctx.strokeStyle = COLORS.yellow; ell(ctx, 400, 200, 22, 22); ctx.fill(); ctx.stroke();
      T(ctx, 'Door handle', 400, 296, 18, 'yellow', 'center', 600);
      const ax = lerp(150, 330, smooth(tp / 1.2) - smooth((tp - 2) / 1));
      const bx = lerp(650, 470, smooth((tp - 3) / 1.2) - smooth((tp - 5) / 1));
      hand(ax, 200, 1); hand(bx, 200, -1);
      const OFF = [[-30, -8], [-10, 6], [10, -10], [24, 8], [-22, 12], [0, -2], [38, -6], [-38, 4]];
      for (let i = 0; i < 8; i++) {
        const onA = [ax + OFF[i][0], 200 + OFF[i][1]]; const kn = [400 + Math.cos(i * 2.3) * 12, 200 + Math.sin(i * 2.3) * 12]; const onB = [bx - OFF[i][0], 200 + OFF[i][1]];
        let p = onA;
        if (i < 5) { const q1 = smooth((tp - 1.2 - i * 0.12) / 0.4); p = P2(onA, kn, q1); }
        if (i < 3) { const q2 = smooth((tp - 4.2 - i * 0.15) / 0.4); p = P2(p, onB, q2); }
        germ(ctx, p[0], p[1], 0.8, i + k * 0.5);
      }
      ctx.restore();
      // ── Panel 2: soap and water.
      const bt = clamp(tt - 6.4, 0, 8.6); const on2 = tt >= 6.4;
      ctx.save(); ctx.globalAlpha *= on2 ? 1 : 0.55;
      panel(ctx, 10, 332, 780, 358, 'cyan', 0.04, 16);
      T(ctx, '2  Soap and water wash them away', 30, 358, 20, 'cyan', 'left');
      const wet = bt > 0 && bt < 1; const rinse = bt > 4.5 && bt < 6.5; const soap = bt >= 1 && bt < 4.8; const clean = bt >= 6.5;
      // Tap, water and sink.
      ctx.strokeStyle = tint('muted', 0.8); ctx.lineWidth = 14; poly(ctx, [40, 398, 172, 398, 172, 416]); ctx.stroke();
      ctx.lineWidth = 6; line(ctx, 100, 398, 100, 382, tint('muted', 0.8), 6); line(ctx, 86, 380, 114, 380, tint('muted', 0.8), 6);
      if (wet || rinse) { ctx.fillStyle = tint('cyan', 0.3); ctx.fillRect(165, 424, 14, 216); ctx.strokeStyle = tint('cyan', 0.8); ctx.lineWidth = 2; ctx.setLineDash([10, 12]); ctx.lineDashOffset = -k * 120; ctx.beginPath(); ctx.moveTo(172, 424); ctx.lineTo(172, 640); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0; }
      ctx.strokeStyle = tint('muted', 0.7); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(40, 600); ctx.quadraticCurveTo(172, 690, 304, 600); ctx.stroke();
      ctx.fillStyle = tint('muted', 0.5); ell(ctx, 172, 645, 14, 4); ctx.fill();
      const hx = 150 + (soap ? 7 * Math.sin(k * 12) : 0);
      hand(hx, 520, 1, 1.1);
      // Germs on the hand: broken up by soap, washed off by water.
      for (let i = 0; i < 7; i++) {
        let p = [hx + OFF[i][0] * 1.1 + 6, 520 + OFF[i][1] * 1.1]; const off = smooth((bt - 4.6 - i * 0.18) / 0.8);
        if (off >= 1) continue;
        p = P2(p, [172 + (i - 3) * 6, 642], off);
        ctx.save(); ctx.globalAlpha *= 1 - off * 0.7;
        if (bt > 3 && bt < 4.6 + i * 0.18) { ctx.strokeStyle = tint('green', 0.8); ctx.lineWidth = 2; for (let j = 0; j < 4; j++) { const a = (j / 4) * TAU + i; ctx.beginPath(); ctx.arc(p[0] + Math.cos(a) * 4, p[1] + Math.sin(a) * 4, 4, a - 0.6, a + 0.6); ctx.stroke(); } }
        else germ(ctx, p[0], p[1], 0.75, i);
        ctx.restore();
      }
      if (soap || (bt >= 4.8 && bt < 6)) {
        const fadeB = soap ? smooth((bt - 1) / 0.6) : 1 - smooth((bt - 4.8) / 1);
        ctx.save(); ctx.globalAlpha *= fadeB; ctx.strokeStyle = 'rgba(230,240,255,0.75)'; ctx.lineWidth = 2;
        for (let i = 0; i < 14; i++) { const r = 5 + 8 * rnd(i); const x = hx - 50 + rnd(i + 20) * 120 + 3 * Math.sin(k * 3 + i); const y = 492 + rnd(i + 40) * 56 + (bt > 4.8 ? (bt - 4.8) * 60 : 0); ell(ctx, x, y, r, r); ctx.stroke(); }
        ctx.restore();
      }
      if (clean) { ctx.fillStyle = COLORS.yellow; for (let i = 0; i < 3; i++) { const s = 6 + 4 * Math.sin(k * 5 + i * 2); const x = 120 + i * 50; const y = 470 - (i % 2) * 14; poly(ctx, [x, y - s * 2, x + s * 0.5, y - s * 0.5, x + s * 2, y, x + s * 0.5, y + s * 0.5, x, y + s * 2, x - s * 0.5, y + s * 0.5, x - s * 2, y, x - s * 0.5, y - s * 0.5], true); ctx.fill(); } }
      // Timer.
      const secs = Math.round(20 * clamp((bt - 1) / 3.5));
      ctx.strokeStyle = tint('muted', 0.3); ctx.lineWidth = 8; ell(ctx, 390, 470, 42, 42); ctx.stroke();
      ctx.strokeStyle = COLORS.cyan; ctx.beginPath(); ctx.arc(390, 470, 42, -Math.PI / 2, -Math.PI / 2 + TAU * (secs / 20)); ctx.stroke();
      T(ctx, secs, 390, 464, 30, 'ink'); T(ctx, 'seconds', 390, 492, 16, 'muted', 'center', 500);
      T(ctx, !on2 ? 'Wet hands' : wet ? 'Wet hands' : soap ? 'Soap and scrub' : rinse ? 'Rinse' : clean ? 'Clean!' : 'Rinse', 390, 538, 20, clean ? 'yellow' : 'cyan');
      // Close-up of one germ and soap.
      const ix = 630; const iy = 510; const ir = 140;
      ctx.save(); ctx.beginPath(); ctx.arc(ix, iy, ir, 0, TAU); ctx.clip();
      ctx.fillStyle = 'rgba(7,11,29,0.85)'; ctx.fillRect(ix - ir, iy - ir, ir * 2, ir * 2);
      const br = smooth((bt - 2.6) / 1.6); const wa = smooth((bt - 4.6) / 1.6);
      const sh = [wa * 70, wa * 170];
      ctx.save(); ctx.globalAlpha *= 1 - br;
      ctx.fillStyle = tint('green', 0.25); ell(ctx, ix, iy, 30, 30); ctx.fill();
      ctx.strokeStyle = COLORS.green; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i <= 30; i++) { const a = i * 0.6; const r = 6 + i * 0.6; const x = ix + Math.cos(a) * r * 0.9; const y = iy + Math.sin(a) * r * 0.7; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
      ctx.restore();
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU; const piece = Math.floor(i / 3); const pa = ((piece + 0.5) / 6) * TAU;
        const x = ix + Math.cos(a) * 46 + Math.cos(pa) * 70 * br + sh[0]; const y = iy + Math.sin(a) * 46 + Math.sin(pa) * 70 * br + sh[1];
        ctx.strokeStyle = tint('yellow', 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * 6, y - Math.sin(a) * 6); ctx.lineTo(x - Math.cos(a) * 15, y - Math.sin(a) * 15); ctx.stroke();
        dot(ctx, x, y, 6, tint('yellow', 0.85));
      }
      for (let i = 0; i < 12; i++) {
        let ha = (i / 12) * TAU + 0.2; if (Math.abs(mod(ha + Math.PI / 2 + Math.PI, TAU) - Math.PI) < 0.45) ha += 0.6;
        const home = [ix + Math.cos(ha) * 112, iy + Math.sin(ha) * 108];
        const ta = (i / 12) * TAU + 0.13; const piece = Math.floor((mod(ta, TAU) / TAU) * 6); const pa = ((piece + 0.5) / 6) * TAU;
        const att = [ix + Math.cos(ta) * 60 + Math.cos(pa) * 70 * br + sh[0], iy + Math.sin(ta) * 60 + Math.sin(pa) * 70 * br + sh[1]];
        const q = smooth((bt - 1 - i * 0.06) / 1.3); const P = P2(home, att, q); const face = q > 0.5 ? ta + Math.PI : Math.atan2(iy - P[1], ix - P[0]);
        ctx.strokeStyle = tint('blue', 0.9); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(P[0] + Math.cos(face) * 18, P[1] + Math.sin(face) * 18); ctx.stroke();
        dot(ctx, P[0], P[1], 6, 'blue');
      }
      ctx.restore();
      ctx.strokeStyle = tint('cyan', 0.7); ctx.lineWidth = 2; ell(ctx, ix, iy, ir, ir); ctx.stroke();
      T(ctx, 'Soap molecules', 690, 352, 18, 'blue', 'center', 700);
      const cap = !on2 || bt < 1 ? 'A germ and its oily outer layer' : bt < 2.6 ? 'Soap sticks to its oily layer' : bt < 4.6 ? 'Its outer layer breaks apart' : bt < 6.4 ? 'Water washes the bits away' : 'The germ is destroyed';
      T(ctx, cap, ix, 672, 18, 'ink', 'center', 600);
      ctx.restore();
      ctx.restore();
    },

    // A small cut heals: blood fills it, platelets make a clot, the clot
    // dries into a scab, new skin grows underneath, the scab falls off.
    'wound-healing'(b, ctx, it, t) {
      const k = b.clock; const tt = mod(t, 16);
      const st = tt < 2.5 ? 0 : tt < 5.5 ? 1 : tt < 8.5 ? 2 : tt < 12.5 ? 3 : 4;
      begin(ctx, t, it, 'How a cut heals');
      ctx.save(); ctx.globalAlpha *= t < 16 ? 1 : smooth(tt / 0.5) * (1 - smooth((tt - 15.4) / 0.6));
      const XL = 150; const XR = 770; const SY = 210; const EY = 255; const DY = 405; const FY = 470; const NX = 460;
      const heal = smooth((tt - 8.5) / 3.8);
      const notch = (depth, half) => { ctx.moveTo(NX - half, SY); ctx.lineTo(NX - half * 0.25, depth); ctx.lineTo(NX + half * 0.25, depth); ctx.lineTo(NX + half, SY); ctx.closePath(); };
      const nd = lerp(348, SY + 1, heal); const nh = lerp(72, 2, heal);
      // Skin layers with the cut taken out.
      ctx.save(); ctx.beginPath(); ctx.rect(XL, SY - 2, XR - XL, FY - SY + 4); notch(348, 72); ctx.clip('evenodd');
      ctx.fillStyle = tint('orange', 0.3); ctx.fillRect(XL, SY, XR - XL, EY - SY);
      ctx.fillStyle = tint('red', 0.12); ctx.fillRect(XL, EY, XR - XL, DY - EY);
      ctx.fillStyle = tint('yellow', 0.1); ctx.fillRect(XL, DY, XR - XL, FY - DY);
      line(ctx, XL, SY, XR, SY, COLORS.orange, 3); line(ctx, XL, EY, XR, EY, tint('orange', 0.45), 1.5); line(ctx, XL, DY, XR, DY, tint('yellow', 0.35), 1.5);
      ctx.strokeStyle = tint('red', 0.55); ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(XL, 300); ctx.lineTo(XR, 300); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = tint('ink', 0.3); ctx.lineWidth = 1.5; ctx.strokeRect(XL, SY, XR - XL, FY - SY);
      // New skin growing in from below and the sides.
      if (heal > 0) {
        ctx.save(); ctx.beginPath(); notch(348, 72); notch(nd, nh); ctx.clip('evenodd');
        ctx.fillStyle = tint('red', 0.28); ctx.fillRect(NX - 80, SY, 160, 145);
        ctx.fillStyle = tint('orange', 0.35); ctx.fillRect(NX - 80, SY, 160, EY - SY);
        ctx.strokeStyle = tint('red', 0.6 - 0.4 * smooth((tt - 12.5) / 2)); ctx.lineWidth = 1.5;
        for (let r = 0; r < 9; r++) for (let c = 0; c < 10; c++) { ell(ctx, NX - 76 + c * 16 + (r % 2) * 8, 340 - r * 16, 7, 6); ctx.stroke(); }
        ctx.restore();
        ctx.save(); ctx.globalAlpha *= heal; line(ctx, NX - 40, 300, NX + 40, 300, tint('red', 0.55), 8); ctx.restore();
      }
      // Inside the open cut: blood, then a clot.
      if (heal < 1) {
        ctx.save(); ctx.beginPath(); notch(nd, nh); ctx.clip();
        const lvl = lerp(348, SY - 4, smooth(tt / 1.6));
        ctx.fillStyle = tint('red', st >= 1 ? 0.5 : 0.42); ctx.fillRect(NX - 80, lvl, 160, 360 - lvl);
        for (let i = 0; i < 9; i++) { const x = NX - 40 + rnd(i) * 80; const y = 236 + rnd(i + 9) * 100 + (st < 1 ? 3 * Math.sin(k * 2 + i) : 0); if (y > lvl) { ctx.fillStyle = tint('red', 0.85); ell(ctx, x, y, 8, 5, rnd(i) * 3); ctx.fill(); } }
        const fib = smooth((tt - 3.3) / 1.7);
        if (fib > 0) { ctx.strokeStyle = `rgba(250,240,200,${0.75 * fib})`; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i < 12; i++) { ctx.moveTo(NX - 70 + rnd(i + 30) * 140, 212 + rnd(i + 40) * 135); ctx.lineTo(NX - 70 + rnd(i + 50) * 140, 212 + rnd(i + 60) * 135); } ctx.stroke(); }
        ctx.restore();
      }
      // Platelets arrive from the cut blood vessel and stick together.
      if (tt > 2.5 && heal < 0.5) {
        ctx.save(); ctx.globalAlpha *= 1 - smooth(heal * 2);
        for (let i = 0; i < 10; i++) {
          const side = i % 2 ? 1 : -1; const from = [NX + side * 140, 300]; const to = [NX - 32 + rnd(i + 70) * 64, 225 + rnd(i + 80) * 105];
          const q = smooth((tt - 2.6 - i * 0.18) / 1.2); if (q <= 0) continue; const P = P2(from, to, q);
          ctx.fillStyle = tint('yellow', 0.9); ctx.beginPath(); for (let j = 0; j < 5; j++) { const a = (j / 5) * TAU + i; const r = 5 + 2 * rnd(i * 5 + j); if (j) ctx.lineTo(P[0] + Math.cos(a) * r, P[1] + Math.sin(a) * r); else ctx.moveTo(P[0] + Math.cos(a) * r, P[1] + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
      // White blood cells tidy up under the scab.
      if (tt > 5.8 && tt < 11) {
        ctx.save(); ctx.globalAlpha *= smooth((tt - 5.8) / 0.6) * (1 - smooth((tt - 10.4) / 0.6));
        for (let i = 0; i < 2; i++) { const x = NX - 18 + i * 34 + 6 * Math.sin(k * 1.3 + i * 2); const y = 295 + 6 * Math.cos(k * 1.1 + i); ctx.fillStyle = tint('purple', 0.35); ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 2; ell(ctx, x, y, 12, 11); ctx.fill(); ctx.stroke(); dot(ctx, x + 2, y, 5, tint('purple', 0.8)); }
        ctx.restore();
      }
      // Scab.
      const sa = smooth((tt - 5.5) / 1.0); const off = smooth((tt - 12.5) / 1.6);
      if (sa > 0 && off < 1) {
        ctx.save(); ctx.globalAlpha *= sa * (1 - off); ctx.translate(NX + 120 * off, SY - 6 - 60 * off - 6 * heal); ctx.rotate(0.5 * off);
        ctx.fillStyle = 'rgba(150,92,58,0.9)'; ctx.strokeStyle = '#d29a6a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-82, 6); ctx.quadraticCurveTo(-46, -16, 0, -14); ctx.quadraticCurveTo(46, -16, 82, 6); ctx.quadraticCurveTo(0, 30 - 18 * heal, -82, 6); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      // Layer names (left) and the stage's own labels (above).
      T(ctx, 'Epidermis', 140, 232, 18, 'orange', 'right', 600); T(ctx, 'Dermis', 140, 330, 18, 'red', 'right', 600); T(ctx, 'Fat', 140, 438, 18, 'yellow', 'right', 600);
      const tag = (s, x, y, px, py, c) => { T(ctx, s, x, y, 20, c); lead(ctx, x, y + 14, px, py, c); };
      if (st === 0) tag('Blood', 600, 130, NX + 20, 262, 'red');
      if (st === 1) { tag('Platelets', 290, 130, NX - 20, 250, 'yellow'); tag('Fibrin threads', 630, 130, NX + 22, 280, 'ink'); }
      if (st === 2) { tag('Scab', 300, 130, NX - 40, SY - 10, 'orange'); tag('White blood cells', 630, 130, NX + 18, 290, 'purple'); }
      if (st === 3) { tag('Scab', 300, 130, NX - 40, SY - 14, 'orange'); tag('New skin cells', 630, 130, NX + 30, 300, 'green'); }
      if (st === 4) tag('Healed skin', 600, 130, NX + 10, SY + 6, 'green');
      // Timeline.
      const STEPS = [['Cut', 'seconds'], ['Clot', 'minutes'], ['Scab', 'hours'], ['New skin', 'days'], ['Healed', 'a week or two']];
      const bounds = [0, 2.5, 5.5, 8.5, 12.5, 16]; const fr = clamp((tt - bounds[st]) / (bounds[st + 1] - bounds[st]));
      line(ctx, 120, 540, 680, 540, tint('muted', 0.35), 4);
      line(ctx, 120, 540, 120 + 140 * Math.min(4, st + fr), 540, COLORS.green, 4);
      STEPS.forEach(([s, w], i) => {
        const x = 120 + i * 140; const on = i === st; const done = i < st;
        dot(ctx, x, 540, on ? 13 : 10, on ? 'green' : done ? tint('green', 0.7) : tint('muted', 0.5), on ? 12 : 0);
        T(ctx, s, x, 574, 20, on ? 'green' : done ? 'ink' : 'muted');
        T(ctx, w, x, 600, 18, 'muted', 'center', 500);
      });
      const DESC = [['A small cut lets a little blood out', 'red'], ['Platelets stick together and make a clot', 'yellow'], ['The clot dries into a scab that keeps germs out', 'orange'], ['New skin cells grow underneath the scab', 'green'], ['The scab falls off: the skin is healed', 'green']][st];
      chip(ctx, DESC[0], MX, 658, DESC[1], 21);
      ctx.restore();
      ctx.restore();
    },

    // Antibodies after the first meeting with a germ (from a vaccine) and
    // after the second (the real germ): memory cells make the second fast.
    'vaccine-memory'(b, ctx, it, t) {
      const k = b.clock; const tt = cycle(t, 13, 0.5); const D = 70 * clamp(tt / 10);
      begin(ctx, t, it, 'How vaccines train the immune system');
      const g = { x: 110, y: 95, w: 640, h: 280 };
      const X = (d) => g.x + (d / 70) * g.w; const Y = (v) => g.y + g.h - v * g.h;
      const prim = (d) => { const x = d - 5; return x <= 0 ? 0 : 0.3 * (1 - Math.exp(-x / 4)) ** 4 * Math.exp(-Math.max(0, x - 10) / 7); };
      const sec = (d) => { const x = d - 41; return x <= 0 ? 0 : (1 - Math.exp(-x / 2)) ** 3 * Math.exp(-Math.max(0, x - 6) / 30); };
      const f = (d) => prim(d) + sec(d);
      // Axes.
      ctx.strokeStyle = 'rgba(140,170,255,0.12)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let i = 1; i <= 4; i++) { ctx.moveTo(g.x, Y(i / 4)); ctx.lineTo(g.x + g.w, Y(i / 4)); }
      ctx.stroke();
      arrow(ctx, g.x, g.y + g.h, g.x + g.w + 14, g.y + g.h, 'rgba(200,215,255,0.7)', 2.5);
      arrow(ctx, g.x, g.y + g.h, g.x, g.y - 14, 'rgba(200,215,255,0.7)', 2.5);
      for (let d = 0; d <= 70; d += 10) T(ctx, d, X(d), g.y + g.h + 20, 17, 'muted', 'center', 500);
      T(ctx, 'Antibodies in the blood', g.x + 10, g.y - 14, 18, 'muted', 'left', 600);
      T(ctx, 'Time (days)', g.x + g.w + 10, g.y + g.h + 46, 18, 'muted', 'right', 600);
      line(ctx, g.x, Y(0.5), g.x + g.w, Y(0.5), tint('yellow', 0.6), 2, [8, 8]);
      T(ctx, 'level that protects you', g.x + 10, Y(0.5) - 14, 18, 'yellow', 'left', 600);
      line(ctx, X(40), g.y, X(40), g.y + g.h, tint('green', 0.35), 1.5, [4, 6]);
      // Exposures.
      T(ctx, 'Vaccine', X(0), 448, 19, 'cyan'); arr(ctx, X(0) + 1, 434, X(0) + 1, 410, 'cyan', 3);
      T(ctx, 'Real germ', X(40), 448, 19, 'green'); arr(ctx, X(40), 434, X(40), 410, 'green', 3);
      // The curve, drawn up to today.
      ctx.fillStyle = tint('cyan', 0.08); ctx.beginPath(); ctx.moveTo(X(0), Y(0));
      for (let d = 0; d <= D; d += 0.5) ctx.lineTo(X(d), Y(f(d)));
      ctx.lineTo(X(D), Y(0)); ctx.closePath(); ctx.fill();
      ctx.lineWidth = 4; glow(ctx, COLORS.cyan, 8);
      for (const [a0, a1, c] of [[0, Math.min(D, 40), COLORS.cyan], [40, D, COLORS.green]]) {
        if (a1 <= a0) continue; ctx.strokeStyle = c; ctx.beginPath();
        for (let d = a0; d <= a1 + 0.01; d += 0.5) { if (d === a0) ctx.moveTo(X(d), Y(f(d))); else ctx.lineTo(X(d), Y(f(d))); }
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      dot(ctx, X(D), Y(f(D)), 7, 'ink', 12);
      if (D > 16) { ctx.save(); ctx.globalAlpha *= smooth((D - 16) / 4); T(ctx, '1st time: slow and small', X(14), Y(0.22) - 30, 19, 'cyan'); ctx.restore(); }
      if (D > 50) { ctx.save(); ctx.globalAlpha *= smooth((D - 50) / 4); T(ctx, '2nd time: fast and big', X(40) - 14, Y(0.86), 19, 'green', 'right'); ctx.restore(); }
      // Below: what the cells are doing.
      const act = D < 38 ? 0 : 1;
      const box = (x, i, c, head, sub, text) => {
        ctx.save(); ctx.globalAlpha *= act === i ? 1 : 0.45;
        panel(ctx, x, 470, 380, 220, c, act === i ? 0.1 : 0.03, 16);
        T(ctx, head, x + 190, 496, 20, c); T(ctx, sub, x + 190, 521, 18, 'muted', 'center', 500);
        para(ctx, text, x + 15, 652, 350, 18, 'ink', 500, 2);
        ctx.restore();
      };
      box(10, 0, 'cyan', '1  The vaccine', 'a harmless form of the germ', 'Lymphocytes slowly learn the germ\'s shape and make memory cells');
      box(410, 1, 'green', '2  The real germ arrives', 'memory cells know it at once', 'Lots of antibodies, fast: the germs are destroyed before you feel ill');
      // Left: three lymphocytes slowly making antibodies; memory cells appear.
      ctx.save(); ctx.globalAlpha *= act === 0 ? 1 : 0.45;
      for (let i = 0; i < 3; i++) lymph(ctx, 60 + i * 50, 580, 16, 'purple');
      const nm = Math.floor(clamp((D - 10) / 18) * 3.999);
      for (let i = 0; i < nm; i++) lymph(ctx, 240 + i * 46, 580, 14, 'purple', 1, true);
      const slow = clamp((D - 5) / 25);
      for (let i = 0; i < 4; i++) { const q = mod(k * 0.3 + i / 4, 1); antibody(ctx, 85 + i * 22 + q * 20, 560 - q * 30, -Math.PI / 2, tint('yellow', slow * (1 - q)), 1); }
      ctx.restore();
      // Right: memory cells multiply and pour out antibodies.
      ctx.save(); ctx.globalAlpha *= act === 1 ? 1 : 0.45;
      const many = 3 + Math.floor(clamp((D - 40) / 8) * 9);
      for (let i = 0; i < many; i++) lymph(ctx, 450 + (i % 6) * 34, 565 + Math.floor(i / 6) * 34, 13, 'purple', 1, i < 3);
      if (D > 41) for (let i = 0; i < 12; i++) { const q = mod(k * 0.45 + i / 12, 1); const tg = i % 2 ? [752, 556] : [760, 604]; const s0 = [655, 560 + (i % 4) * 14]; const P = P2(s0, [tg[0] - 22, tg[1] + ((i % 3) - 1) * 10], q); antibody(ctx, P[0], P[1], Math.atan2(tg[1] - s0[1], tg[0] - s0[0]), tint('yellow', 1 - q ** 4), 1); }
      germ(ctx, 752, 556, 0.8, 0.3); germ(ctx, 760, 604, 0.8, 1.2);
      ctx.restore();
      ctx.restore();
    },

    // X-rays pass through soft tissue but bone absorbs them, leaving a
    // white shadow on the picture.
    'xray-imaging'(b, ctx, it, t) {
      const k = b.clock; const q = after(t, 1.2, 3);
      begin(ctx, t, it, 'How an X-ray picture is made');
      const BN = [[345, 245, 30], [460, 240, 25]]; const SE = [400, 245, 150, 70];
      // Tube.
      panel(ctx, 290, 58, 220, 40, 'purple', 0.15, 10);
      glow(ctx, COLORS.purple, 10); line(ctx, 330, 86, 470, 86, COLORS.purple, 4); ctx.shadowBlur = 0;
      T(ctx, 'X-ray tube', 522, 78, 19, 'purple', 'left');
      T(ctx, 'X-rays', 226, 140, 20, 'cyan', 'right');
      // Faint beams and moving X-ray photons.
      for (let j = 0; j < 28; j++) {
        const x = 238 + j * 12;
        let stop = 384;
        for (const [bx, by, r] of BN) { const dx = x - bx; if (Math.abs(dx) < r) stop = Math.min(stop, by - Math.sqrt(r * r - dx * dx)); }
        line(ctx, x, 100, x, stop, tint('cyan', 0.08), 2);
        for (let m = 0; m < 3; m++) {
          const y = 100 + mod(k * 240 + rnd(j) * 290 + m * 97, 290);
          if (y > stop + 12) continue;
          if (y > stop) { dot(ctx, x, stop, 4, tint('yellow', 0.8)); continue; }
          const inTissue = ((x - SE[0]) / SE[2]) ** 2 + ((y - SE[1]) / SE[3]) ** 2 < 1;
          line(ctx, x, Math.max(100, y - 12), x, y, tint('cyan', inTissue ? 0.6 : 0.95), 2.5);
        }
      }
      // The arm in cross-section.
      ctx.fillStyle = tint('orange', 0.2); ctx.strokeStyle = tint('orange', 0.75); ctx.lineWidth = 2.5; ell(ctx, SE[0], SE[1], SE[2], SE[3]); ctx.fill(); ctx.stroke();
      for (const [bx, by, r] of BN) { ctx.fillStyle = 'rgba(235,240,255,0.88)'; ell(ctx, bx, by, r, r); ctx.fill(); ctx.fillStyle = tint('yellow', 0.45); ell(ctx, bx, by, r * 0.45, r * 0.45); ctx.fill(); }
      T(ctx, 'Soft tissue', 568, 200, 20, 'orange', 'left'); T(ctx, 'lets X-rays through', 568, 224, 18, 'muted', 'left', 500);
      T(ctx, 'Bone', 232, 244, 20, 'ink', 'right'); T(ctx, 'absorbs X-rays', 232, 268, 18, 'muted', 'right', 500); lead(ctx, 238, 252, 316, 248, 'ink');
      // Detector edge-on, glowing where X-rays arrive.
      ctx.fillStyle = tint('teal', 0.2); ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 2; ctx.fillRect(210, 384, 380, 16); ctx.strokeRect(210, 384, 380, 16);
      for (let j = 0; j < 28; j++) { const x = 238 + j * 12; const hit = BN.some(([bx, , r]) => Math.abs(x - bx) < r); if (!hit) { ctx.fillStyle = tint('cyan', 0.5 + 0.3 * Math.sin(k * 6 + j)); ctx.fillRect(x - 5, 385, 10, 6); } }
      T(ctx, 'Detector', 604, 392, 19, 'teal', 'left');
      // Guide lines down to the picture.
      for (const x of [250, 550, 315, 375, 435, 485]) line(ctx, x, 402, x, 452, tint('ink', 0.22), 1.2, [4, 6]);
      // The X-ray picture, seen from above.
      ctx.fillStyle = '#05070f'; ctx.fillRect(210, 455, 380, 185);
      ctx.fillStyle = `rgba(150,160,190,${0.32 * q})`; ctx.fillRect(250, 455, 300, 185);
      ctx.fillStyle = `rgba(240,245,255,${0.92 * q})`; rounded(ctx, 315, 462, 60, 170, 18); ctx.fill(); rounded(ctx, 435, 462, 50, 170, 16); ctx.fill();
      ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 2; ctx.strokeRect(210, 455, 380, 185);
      T(ctx, 'The X-ray picture (seen from above)', 400, 662, 19, 'teal');
      // Key.
      const KEY = [['white: bone', 'rgba(240,245,255,0.92)'], ['grey: soft tissue', 'rgba(150,160,190,0.5)'], ['black: air', '#05070f']];
      KEY.forEach(([s, c], i) => { const y = 490 + i * 40; ctx.fillStyle = c; ctx.strokeStyle = tint('ink', 0.5); ctx.lineWidth = 1; ctx.fillRect(28, y - 9, 18, 18); ctx.strokeRect(28, y - 9, 18, 18); T(ctx, s, 56, y, 18, 'ink', 'left', 500); });
      para(ctx, 'Bones block X-rays, so they show up white. Where X-rays get through, the picture goes dark.', 604, 548, 186, 18, 'muted', 500, 5);
      ctx.restore();
    },

    // The heart beating in time with a sweeping ECG trace.
    'heartbeat-ecg'(b, ctx, it, t) {
      const k = b.clock; const bpm = clamp(val(it.bpm, 72), 40, 180); const T0 = 60 / bpm; const ph = mod(k, T0) / T0;
      const ecg = (p) => 0.13 * Math.exp(-(((p - 0.12) / 0.032) ** 2)) - 0.1 * Math.exp(-(((p - 0.255) / 0.009) ** 2)) + Math.exp(-(((p - 0.28) / 0.012) ** 2)) - 0.24 * Math.exp(-(((p - 0.305) / 0.011) ** 2)) + 0.3 * Math.exp(-(((p - 0.52) / 0.055) ** 2));
      const atria = Math.exp(-(((ph - 0.17) / 0.05) ** 2)); const vent = Math.exp(-(((ph - 0.37) / 0.07) ** 2));
      begin(ctx, t, it, 'The heartbeat and the ECG');
      // Heart: atria on top, ventricles below; right side blue, left side red.
      const hx = 205;
      for (const [s, c] of [[-1, 'blue'], [1, 'red']]) {
        ctx.save(); ctx.translate(hx + s * 46, 132); ctx.scale(1 - 0.1 * atria, 1 - 0.1 * atria);
        ell(ctx, 0, 0, 44, 34); ctx.fillStyle = '#0b1026'; ctx.fill(); ctx.fillStyle = tint(c, 0.22 + 0.35 * atria); ctx.strokeStyle = color(c); ctx.lineWidth = 2.5; ctx.fill(); ctx.stroke(); ctx.restore();
      }
      ctx.strokeStyle = tint('red', 0.85); ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(hx + 6, 160); ctx.lineTo(hx + 6, 92); ctx.quadraticCurveTo(hx + 8, 70, hx + 40, 72); ctx.lineTo(hx + 96, 74); ctx.stroke();
      ctx.strokeStyle = tint('blue', 0.85); ctx.beginPath(); ctx.moveTo(hx - 70, 130); ctx.lineTo(hx - 70, 68); ctx.stroke();
      ctx.save(); ctx.translate(hx, 172); ctx.scale(1 - 0.09 * vent, 1 - 0.09 * vent);
      const vpath = () => { ctx.beginPath(); ctx.moveTo(-95, 0); ctx.bezierCurveTo(-100, 70, -40, 120, 0, 148); ctx.bezierCurveTo(40, 120, 100, 70, 95, 0); ctx.closePath(); };
      ctx.save(); vpath(); ctx.clip();
      ctx.fillStyle = tint('blue', 0.22 + 0.35 * vent); ctx.fillRect(-110, -10, 110, 170); ctx.fillStyle = tint('red', 0.22 + 0.35 * vent); ctx.fillRect(0, -10, 110, 170);
      ctx.restore();
      if (vent > 0.5) glow(ctx, COLORS.red, 12);
      ctx.strokeStyle = 'rgba(233,238,255,0.8)'; ctx.lineWidth = 2.5; vpath(); ctx.stroke(); ctx.shadowBlur = 0;
      line(ctx, 0, 0, 0, 140, tint('ink', 0.5), 3);
      ctx.restore();
      // The electrical signal: pacemaker → between the chambers → down the middle.
      let sp = null;
      if (ph < 0.22) sp = [lerp(hx - 70, hx, smooth(ph / 0.22)), lerp(112, 168, smooth(ph / 0.22))];
      else if (ph < 0.36) sp = [hx, lerp(168, 300, smooth((ph - 0.24) / 0.12))];
      if (sp) dot(ctx, sp[0], sp[1], 7, 'yellow', 14);
      T(ctx, 'Atria', 104, 128, 20, 'ink', 'right'); T(ctx, 'Ventricles', 104, 232, 20, 'ink', 'right');
      // Rate.
      T(ctx, Math.round(bpm), 575, 128, 72, 'red');
      T(ctx, 'beats per minute', 575, 186, 21, 'ink');
      T(ctx, `one beat every ${T0.toFixed(2)} seconds`, 575, 218, 18, 'muted', 'center', 500);
      para(ctx, 'Each beat starts with an electrical signal from the heart\'s own pacemaker', 385, 272, 380, 19, 'ink', 500, 2);
      // Monitor: a sweep of three beats, so each wave stays in place.
      panel(ctx, 20, 330, 760, 290, 'green', 0.04, 14);
      ctx.strokeStyle = tint('green', 0.1); ctx.lineWidth = 1; ctx.beginPath();
      for (let x = 40; x <= 760; x += 30) { ctx.moveTo(x, 345); ctx.lineTo(x, 605); }
      for (let y = 360; y <= 600; y += 30) { ctx.moveTo(30, y); ctx.lineTo(770, y); }
      ctx.stroke();
      T(ctx, 'ECG (electrocardiogram)', 40, 352, 18, 'green', 'left', 600);
      const X0m = 40; const Wm = 720; const base = 545; const amp = 130;
      const head = X0m + Wm * (mod(k, 3 * T0) / (3 * T0));
      const yAt = (x) => base - amp * ecg(mod(((x - X0m) / Wm) * 3, 1));
      ctx.strokeStyle = tint('green', 0.3); ctx.lineWidth = 2.5; ctx.beginPath(); let st = false;
      for (let x = head + 26; x <= X0m + Wm; x += 2) { if (!st) { ctx.moveTo(x, yAt(x)); st = true; } else ctx.lineTo(x, yAt(x)); }
      ctx.stroke();
      ctx.strokeStyle = COLORS.green; ctx.lineWidth = 3; glow(ctx, COLORS.green, 8); ctx.beginPath();
      for (let x = X0m; x <= head; x += 2) { if (x === X0m) ctx.moveTo(x, yAt(x)); else ctx.lineTo(x, yAt(x)); }
      ctx.stroke(); ctx.shadowBlur = 0;
      dot(ctx, head, yAt(head), 6, 'ink', 12);
      const bx = (p) => X0m + (1 + p) * (Wm / 3);
      T(ctx, 'P', bx(0.12), base - amp * 0.13 - 24, 22, 'yellow');
      T(ctx, 'QRS', bx(0.28), base - amp - 22, 22, 'red');
      T(ctx, 'T', bx(0.52), base - amp * 0.3 - 24, 22, 'cyan');
      T(ctx, 'P: atria squeeze', 135, 656, 19, 'yellow', 'center', 600);
      T(ctx, 'QRS: ventricles squeeze', 400, 656, 19, 'red', 'center', 600);
      T(ctx, 'T: ventricles relax', 665, 656, 19, 'cyan', 'center', 600);
      ctx.restore();
    },

    // A night's sleep as a hypnogram: about five 90-minute cycles.
    'sleep-cycle'(b, ctx, it, t) {
      const k = b.clock; const tt = cycle(t, 13, 0.6); const m = 480 * clamp(tt / 11);
      const SEG = [[0, 0, 5], [2, 5, 25], [3, 25, 65], [2, 65, 80], [1, 80, 90], [2, 90, 110], [3, 110, 145], [2, 145, 160], [1, 160, 180], [2, 180, 205], [3, 205, 225], [2, 225, 240], [1, 240, 270], [0, 270, 274], [2, 274, 325], [1, 325, 360], [2, 360, 405], [1, 405, 450], [2, 450, 470], [0, 470, 480]];
      const NAMES = [['Awake', 'yellow', 'Short wake-ups are normal; most are too brief to remember'], ['REM sleep', 'purple', 'Most dreaming happens here; the eyes dart about and the brain sorts memories'],
        ['Light sleep', 'cyan', 'Breathing and heartbeat slow down and muscles relax; easy to wake up'], ['Deep sleep', 'blue', 'The body grows and repairs itself; very hard to wake up']];
      begin(ctx, t, it, 'The stages of sleep');
      const g = { x: 175, y: 92, w: 590, h: 250 };
      const X = (min) => g.x + (min / 480) * g.w; const LY = (L) => g.y + 18 + L * 72;
      for (let L = 0; L < 4; L++) { line(ctx, g.x, LY(L), g.x + g.w, LY(L), 'rgba(140,170,255,0.1)', 1); T(ctx, ['Awake', 'REM', 'Light', 'Deep'][L], g.x - 14, LY(L), 19, NAMES[L][1], 'right'); }
      arrow(ctx, g.x, g.y + g.h, g.x + g.w + 14, g.y + g.h, 'rgba(200,215,255,0.7)', 2.5);
      [[0, '10 pm'], [120, '12 am'], [240, '2 am'], [360, '4 am'], [480, '6 am']].forEach(([mm, s]) => T(ctx, s, X(mm), g.y + g.h + 20, 17, 'muted', 'center', 500));
      // Cycle brackets.
      [[0, 90], [90, 180], [180, 270], [270, 360], [360, 480]].forEach(([a, c], i) => {
        ctx.strokeStyle = tint('muted', 0.5); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X(a) + 3, 84); ctx.lineTo(X(a) + 3, 78); ctx.lineTo(X(c) - 3, 78); ctx.lineTo(X(c) - 3, 84); ctx.stroke();
        T(ctx, `Cycle ${i + 1}`, (X(a) + X(c)) / 2, 64, 17, 'muted', 'center', 600);
      });
      // The hypnogram: bright where the night has reached.
      let cur = 0;
      SEG.forEach(([L, a, c], i) => {
        if (m >= a && m < c) cur = L;
        const nx = SEG[i + 1];
        const draw = (x0, x1, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(X(x0), LY(L)); ctx.lineTo(X(x1), LY(L)); ctx.stroke(); };
        if (c <= m) draw(a, c, color(NAMES[L][1]), 5); else if (a < m) { draw(a, m, color(NAMES[L][1]), 5); draw(m, c, tint('muted', 0.3), 3); } else draw(a, c, tint('muted', 0.3), 3);
        if (nx) { ctx.strokeStyle = c <= m ? tint('ink', 0.5) : tint('muted', 0.25); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(c), LY(L)); ctx.lineTo(X(c), LY(nx[0])); ctx.stroke(); }
      });
      if (m >= 480) cur = 0;
      line(ctx, X(m), g.y, X(m), g.y + g.h, tint('ink', 0.4), 1.5, [4, 5]);
      dot(ctx, X(m), LY(cur), 8, NAMES[cur][1], 14);
      // The current stage, with its brain waves.
      const [nm, c, text] = NAMES[cur];
      panel(ctx, 20, 392, 760, 168, c, 0.08, 16);
      T(ctx, nm, 45, 428, 26, c, 'left');
      para(ctx, text, 45, 492, 420, 20, 'ink', 500, 3, 'left');
      const WV = [[10, 0.3], [11, 0.26], [17, 0.12], [34, 0.045]][cur];
      ctx.strokeStyle = color(c); ctx.lineWidth = 2.5; ctx.beginPath();
      for (let x = 500; x <= 760; x += 2) { const y = 470 + WV[0] * Math.sin((x - k * 120) * WV[1]) * (cur === 2 ? 0.7 + 0.5 * Math.max(0, Math.sin((x - k * 120) * 0.02)) : 1); if (x === 500) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
      T(ctx, 'brain waves', 630, 536, 18, 'muted', 'center', 600);
      chip(ctx, 'One cycle lasts about 90 minutes', MX, 600, 'ink', 20);
      para(ctx, 'Deep sleep comes mostly early in the night; REM sleep gets longer towards morning.', 30, 656, 740, 19, 'muted', 500, 2);
      ctx.restore();
    },

    // ─── Food and the brain ───────────────────────────────────────────────

    // The food groups as shares of a plate, and what each gives the body.
    'balanced-plate'(b, ctx, it, t) {
      const k = b.clock;
      const G = [
        ['Fruit and vegetables', 'vitamins, minerals and fibre', 0.39, 'green'],
        ['Starchy foods', 'energy: bread, rice, potatoes, pasta', 0.37, 'yellow'],
        ['Protein', 'growth and repair: beans, eggs, fish, meat', 0.12, 'red'],
        ['Dairy', 'calcium for strong bones and teeth', 0.08, 'blue'],
        ['Oils and spreads', 'energy and some vitamins, in small amounts', 0.04, 'purple'],
      ];
      const act = t < 2.4 ? -1 : Math.floor(mod(t - 2.4, 15) / 3);
      begin(ctx, t, it, 'A balanced plate');
      const px = 255; const py = 375; const R = 196;
      ctx.fillStyle = tint('ink', 0.05); ctx.strokeStyle = tint('ink', 0.5); ctx.lineWidth = 3; ell(ctx, px, py, R + 18, R + 18); ctx.fill(); ctx.stroke();
      let a0 = -Math.PI / 2;
      const mids = [];
      G.forEach(([, , f, c], i) => {
        const sweep = f * TAU * after(t, 0.2 + i * 0.3, 0.6); const on = i === act; const mid = a0 + (f * TAU) / 2; mids.push(mid);
        const ox = on ? Math.cos(mid) * 14 : 0; const oy = on ? Math.sin(mid) * 14 : 0;
        if (sweep > 0.001) {
          ctx.save(); if (on) glow(ctx, color(c), 14);
          ctx.fillStyle = tint(c, on ? 0.45 : 0.24); ctx.strokeStyle = color(c); ctx.lineWidth = on ? 3 : 2;
          ctx.beginPath(); ctx.moveTo(px + ox, py + oy); ctx.arc(px + ox, py + oy, R, a0, a0 + sweep); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
        }
        a0 += f * TAU;
      });
      // Food pictures in each part.
      const at2 = (i, r, da = 0) => { const on = i === act; const a = mids[i] + da; const o = on ? 14 : 0; return [px + Math.cos(a) * (r + o) , py + Math.sin(a) * (r + o)]; };
      const show = (i) => after(t, 0.6 + i * 0.3, 0.5);
      ctx.save(); ctx.globalAlpha *= show(0);
      let [x, y] = at2(0, 110, -0.35); dot(ctx, x, y, 22, tint('red', 0.85)); line(ctx, x, y - 20, x + 3, y - 30, '#b7794a', 3); ctx.fillStyle = COLORS.green; ell(ctx, x + 12, y - 28, 9, 4, -0.5); ctx.fill();
      [x, y] = at2(0, 120, 0.35); line(ctx, x, y + 26, x, y + 4, tint('green', 0.9), 6); for (const [ox, oy] of [[-12, -4], [12, -4], [0, -16], [0, 2]]) dot(ctx, x + ox, y + oy, 11, tint('green', 0.85));
      [x, y] = at2(0, 70, 0.05); ctx.fillStyle = COLORS.orange; poly(ctx, [x - 22, y - 6, x + 22, y - 1, x - 22, y + 6], true); ctx.fill(); ctx.fillStyle = COLORS.green; ell(ctx, x - 26, y, 6, 3); ctx.fill();
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= show(1);
      [x, y] = at2(1, 100, -0.32); ctx.fillStyle = '#d8a35d'; ctx.strokeStyle = '#f0c27f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 24, y + 22); ctx.lineTo(x - 24, y - 6); ctx.arc(x, y - 6, 24, Math.PI, 0); ctx.lineTo(x + 24, y + 22); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f6e3bd'; rounded(ctx, x - 17, y - 8, 34, 26, 4); ctx.fill();
      [x, y] = at2(1, 112, 0.42); ctx.fillStyle = 'rgba(245,240,225,0.95)'; for (let i = 0; i < 9; i++) { ell(ctx, x - 16 + (i % 3) * 16, y - 10 + Math.floor(i / 3) * 10, 6, 3.5, 0.5); ctx.fill(); }
      [x, y] = at2(1, 160, 0.06); ctx.fillStyle = '#c9925a'; ell(ctx, x, y, 20, 14); ctx.fill(); ctx.fillStyle = '#7a5230'; dot(ctx, x - 6, y - 3, 2, '#7a5230'); dot(ctx, x + 5, y + 4, 2, '#7a5230');
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= show(2);
      [x, y] = at2(2, 120); ctx.fillStyle = 'rgba(245,245,250,0.95)'; ell(ctx, x, y, 18, 14, 0.4); ctx.fill(); dot(ctx, x + 2, y, 7, 'yellow');
      [x, y] = at2(2, 160, -0.1); ctx.fillStyle = '#b5652e'; for (let i = 0; i < 3; i++) { ell(ctx, x - 9 + i * 9, y + (i % 2) * 5, 5, 3.5, 0.6); ctx.fill(); }
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= show(3);
      [x, y] = at2(3, 125); ctx.fillStyle = tint('yellow', 0.9); poly(ctx, [x - 14, y + 10, x + 14, y + 10, x + 10, y - 12], true); ctx.fill(); dot(ctx, x + 2, y + 2, 2.5, '#8a6a20'); dot(ctx, x + 8, y - 4, 2, '#8a6a20');
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= show(4);
      [x, y] = at2(4, 150); ctx.fillStyle = tint('yellow', 0.85); ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.quadraticCurveTo(x + 9, y + 2, x, y + 8); ctx.quadraticCurveTo(x - 9, y + 2, x, y - 12); ctx.fill();
      ctx.restore();
      // Cards: the food group and what it gives the body.
      G.forEach(([name, gives, , c], i) => {
        const yy = 72 + i * 102; const on = i === act;
        ctx.save(); ctx.globalAlpha *= after(t, 0.4 + i * 0.25) * (act < 0 || on ? 1 : 0.6);
        panel(ctx, 490, yy, 300, 92, c, on ? 0.18 : 0.05, 14);
        dot(ctx, 512, yy + 26, 8, c);
        T(ctx, name, 530, yy + 26, 20, c, 'left');
        para(ctx, gives, 510, yy + 63, 268, 18, on ? 'ink' : 'muted', 500, 2, 'left');
        ctx.restore();
      });
      para(ctx, 'Each food group gives the body something different. Water helps everything work.', 30, 646, 740, 20, 'ink', 500, 2);
      void k;
      ctx.restore();
    },

    // The brain seen from the side, its parts lighting up in turn.
    'brain-parts'(b, ctx, it, t) {
      const k = b.clock; const act = Math.floor(cycle(t, 15.6, 0.8) / 2.6);
      const PARTS = [
        ['Frontal lobe', 'Thinking, planning, choosing and moving', 'blue', [30, 110, 'left'], [228, 200], [225, 240]],
        ['Parietal lobe', 'Touch, pain and knowing where your body is', 'teal', [585, 110, 'left'], [444, 192], [430, 220]],
        ['Occipital lobe', 'Seeing: makes sense of what the eyes see', 'purple', [612, 285, 'left'], [560, 290], [548, 290]],
        ['Temporal lobe', 'Hearing, language and memory', 'orange', [170, 455, 'center'], [272, 370], [310, 345]],
        ['Cerebellum', 'Balance and smooth, coordinated movement', 'green', [585, 445, 'left'], [524, 420], [470, 415]],
        ['Brain stem', 'Automatic jobs like breathing and heartbeat', 'red', [470, 520, 'left'], [434, 502], [420, 470]],
      ];
      const REG = [
        [60, 60, 372, 60, 360, 128, 318, 292, 200, 322, 165, 345, 165, 460, 60, 460],
        [372, 60, 512, 60, 505, 156, 498, 280, 430, 282, 318, 292, 360, 128],
        [512, 60, 720, 60, 720, 460, 490, 460, 498, 280, 505, 156],
        [165, 345, 200, 322, 318, 292, 430, 282, 498, 280, 490, 460, 165, 460],
      ];
      begin(ctx, t, it, 'The parts of the brain');
      const outline = () => { ctx.beginPath(); ctx.moveTo(112, 330); ctx.bezierCurveTo(88, 232, 160, 150, 272, 136); ctx.bezierCurveTo(385, 118, 528, 142, 572, 222); ctx.bezierCurveTo(604, 278, 592, 338, 548, 364); ctx.bezierCurveTo(505, 386, 440, 378, 405, 392); ctx.bezierCurveTo(352, 414, 262, 418, 212, 400); ctx.bezierCurveTo(162, 386, 124, 372, 112, 330); ctx.closePath(); };
      const fillA = (i) => (i === act ? 0.5 : 0.16);
      // Brain stem and cerebellum sit underneath.
      ctx.fillStyle = tint('red', fillA(5)); ctx.strokeStyle = COLORS.red; ctx.lineWidth = 2; poly(ctx, [394, 384, 442, 386, 438, 470, 432, 542, 404, 542, 398, 470], true); ctx.fill(); ctx.stroke();
      ctx.fillStyle = tint('green', fillA(4)); ctx.strokeStyle = COLORS.green; ell(ctx, 470, 404, 82, 46); ctx.fill(); ctx.stroke();
      ctx.save(); ell(ctx, 470, 404, 82, 46); ctx.clip(); ctx.strokeStyle = tint('green', 0.6); ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(470, 360 + i * 4, 90 - i * 3, 22 + i * 11, 0, 0.15, Math.PI - 0.15); ctx.stroke(); }
      ctx.restore();
      // The cerebrum, coloured by lobe.
      ctx.save(); outline(); ctx.fillStyle = '#0b1026'; ctx.fill(); ctx.clip();
      REG.forEach((r, i) => { ctx.fillStyle = tint(PARTS[i][2], fillA(i)); poly(ctx, r, true); ctx.fill(); });
      ctx.strokeStyle = 'rgba(220,230,255,0.16)'; ctx.lineWidth = 2;
      for (let i = 0; i < 9; i++) { ctx.beginPath(); for (let x = 90; x <= 610; x += 10) { const y = 150 + i * 30 + 9 * Math.sin(x * 0.045 + i * 1.7) + 6 * Math.sin(x * 0.11 + i); if (x === 90) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }
      ctx.strokeStyle = 'rgba(5,8,22,0.85)'; ctx.lineWidth = 4;
      poly(ctx, [370, 80, 360, 128, 318, 292]); ctx.stroke(); poly(ctx, [176, 338, 200, 322, 318, 292, 440, 281]); ctx.stroke(); poly(ctx, [512, 60, 505, 156, 497, 298, 490, 460]); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = 'rgba(233,238,255,0.8)'; ctx.lineWidth = 3; outline(); ctx.stroke();
      // Signals flickering in the active part.
      const cen = PARTS[act][5];
      for (let i = 0; i < 10; i++) { const a = rnd(i + act * 10) * TAU; const r = 10 + rnd(i + 50) * 38; const tw = Math.max(0, Math.sin(k * 5 + i * 1.9)); if (tw > 0.2) dot(ctx, cen[0] + Math.cos(a) * r, cen[1] + Math.sin(a) * r * 0.8, 2 + 3 * tw, 'ink', 8); }
      // Labels.
      PARTS.forEach(([name, , c, [lx, ly, al], [tx, ty]], i) => {
        const on = i === act;
        ctx.save(); ctx.globalAlpha *= on ? 1 : 0.75;
        T(ctx, name, lx, ly, on ? 21 : 20, c, al, on ? 800 : 700);
        ctx.font = `700 20px ${FONT}`; const w = ctx.measureText(name).width;
        const ex = al === 'left' ? lx + (lx < 300 ? w + 6 : -6) : lx; const ey = al === 'center' ? ly - 14 : ly;
        lead(ctx, ex, ey, tx, ty, c);
        ctx.restore();
      });
      T(ctx, 'front', 70, 300, 18, 'muted', 'center', 500); T(ctx, 'back', 640, 360, 18, 'muted', 'center', 500);
      const [nm, job, c] = PARTS[act];
      panel(ctx, 20, 572, 760, 118, c, 0.08, 16);
      T(ctx, nm, MX, 604, 24, c);
      T(ctx, job, MX, 640, 20, 'ink', 'center', 600);
      T(ctx, 'The brain has about 86 billion nerve cells', MX, 672, 18, 'muted', 'center', 500);
      ctx.restore();
    },
  };
}
