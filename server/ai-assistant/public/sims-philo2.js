// More philosophy simulations for the board: knowledge, logic, ethics, mind,
// and the philosophy of religion, for curious teenagers and adults. Plato's
// Forms, empiricism and rationalism, Hume and Popper on induction, moral
// relativism, the Euthyphro dilemma, the first-cause and design arguments, the
// problem of evil, Pascal's wager, Ockham's razor, the brain in a vat, the liar
// and the heap, Turing's test, Hegel's dialectic, Mill's harm principle,
// Epicurus, Ubuntu, Nagasena's chariot and Avicenna's floating man. Each one
// plays in stages with a caption per stage, gives the argument and its main
// objections or rival answers fairly (open questions stay open), names its
// sources, and loops. Each is a function of time (t since it appeared,
// b.clock for the loop): plain canvas calls, a few small glows, no state
// between frames beyond constants cached on the item. PHILO2_SIMS says what
// each one is for, so a lesson's words can pick the right picture.

export const PHILO2_SIMS = {
  'plato-forms': { title: "Plato's theory of Forms", keywords: ['theory of forms', "plato's forms", 'platonic forms', 'world of forms', 'perfect circle', 'form of the good', 'platonic ideal'], example: {} },
  'empiricism-rationalism': { title: 'Empiricism and rationalism', keywords: ['empiricism and rationalism', 'empiricism vs rationalism', 'blank slate', 'tabula rasa', 'innate ideas', "locke's empiricism", 'where does knowledge come from', "kant's synthesis"], example: {} },
  'induction-swans': { title: 'The problem of induction', keywords: ['black swan', 'white swans', "hume's problem of induction", 'popper falsification', 'karl popper', 'falsifiability principle', 'inductive reasoning'], example: {} },
  'moral-relativism': { title: 'Moral relativism', keywords: ['moral relativism', 'cultural relativism', 'ethical relativism', 'moral universalism', 'moral absolutism', 'is morality relative'], example: {} },
  euthyphro: { title: 'The Euthyphro dilemma', keywords: ['euthyphro dilemma', 'euthyphro problem', 'divine command theory', 'good because god commands it', 'is it good because god commands it', 'morality and god'], example: {} },
  'first-cause': { title: 'The first-cause argument', keywords: ['first cause argument', 'first cause', 'cosmological argument', 'uncaused cause', 'unmoved mover', 'infinite regress', 'kalam argument', 'what caused god'], example: {} },
  'design-argument': { title: 'The design argument', keywords: ['design argument', 'argument from design', 'teleological argument', "paley's watch", 'watchmaker analogy', 'intelligent design', 'fine-tuning argument', 'fine tuning of the universe'], example: {} },
  'problem-of-evil': { title: 'The problem of evil', keywords: ['problem of evil', 'inconsistent triad', 'theodicy', 'free will defence', 'free will defense', 'soul-making theodicy', 'why does god allow suffering', 'epicurean paradox'], example: {} },
  'pascals-wager': { title: "Pascal's wager", keywords: ["pascal's wager", 'pascals wager', 'blaise pascal', 'wager on god', 'many gods objection', 'bet on god'], example: {} },
  'occams-razor': { title: "Ockham's razor", keywords: ["occam's razor", "ockham's razor", 'occams razor', 'law of parsimony', 'simplest explanation', 'william of ockham'], example: {} },
  'brain-in-vat': { title: 'The brain in a vat', keywords: ['brain in a vat', 'brain in vat', 'how do i know i am not dreaming', 'external world scepticism', 'external world skepticism', 'are we in a simulation', 'philosophical scepticism'], example: {} },
  'liar-paradox': { title: 'The liar paradox', keywords: ['liar paradox', 'this sentence is false', 'epimenides paradox', 'self-reference paradox', 'all cretans are liars', 'paradox of the liar'], example: {} },
  'sorites-heap': { title: 'The sorites paradox', keywords: ['sorites paradox', 'paradox of the heap', 'heap of sand', 'philosophy of vagueness', 'vague predicates', 'bald man paradox'], example: {} },
  'turing-test': { title: 'The Turing test', keywords: ['turing test', 'imitation game', 'alan turing', 'can machines think', 'machine intelligence test', 'computing machinery and intelligence'], example: {} },
  'hegel-dialectic': { title: "Hegel's dialectic", keywords: ['hegelian dialectic', "hegel's dialectic", 'thesis antithesis synthesis', 'thesis, antithesis, synthesis', 'dialectical method', 'being nothing becoming'], example: {} },
  'harm-principle': { title: "Mill's harm principle", keywords: ['harm principle', "mill's harm principle", 'on liberty', 'offence principle', 'limits of freedom', 'freedom of speech and harm', 'paternalism'], example: {} },
  'epicurus-happiness': { title: 'Epicurus on happiness', keywords: ['epicurus on happiness', 'epicurean philosophy', 'epicurean happiness', 'ataraxia', 'death is nothing to us', 'letter to menoeceus', 'simple pleasures'], example: {} },
  'ubuntu-circle': { title: 'Ubuntu: I am because we are', keywords: ['ubuntu philosophy', 'ubuntu ethics', 'i am because we are', 'umuntu ngumuntu ngabantu', 'african philosophy', 'a person is a person through other people'], example: {} },
  'chariot-no-self': { title: "Nagasena's chariot", keywords: ["nagasena's chariot", 'nagasena chariot', 'questions of king milinda', 'anatta', 'anatman', 'no-self doctrine', 'buddhist no self', 'five aggregates'], example: {} },
  'floating-man': { title: "Avicenna's floating man", keywords: ['floating man', 'flying man', "avicenna's floating man", 'ibn sina flying man', 'floating man argument', 'avicenna on the soul'], example: {} },
};

export function philo2Sims(kit) {
  // eslint-disable-next-line no-unused-vars
  const { FIG, COL, COLORS, HUES, FONT, glow, label, wrapLabel, rounded, arrow, clamp, easeOut, outBack, color, tint } = kit;
  const X0 = FIG.x; const Y0 = FIG.y; const X1 = FIG.x + FIG.w;
  const cx = X0 + FIG.w / 2;
  const TAU = Math.PI * 2;
  const INK2 = 'rgba(8,12,30,0.97)';

  // Small tools: numbers, timing, loops.
  const mod = (a, n) => ((a % n) + n) % n;
  const smooth = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
  const lerp = (a, c, p) => a + (c - a) * p;
  const fade = (ctx, t, d = 0.5) => { const q = easeOut(clamp(t / d)); ctx.globalAlpha *= q; return q; };
  const after = (t, at0, d = 0.4) => easeOut(clamp((t - at0) / d));
  const cycle = (t, period, delay = 0.6) => (t < delay ? 0 : mod(t - delay, period));
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  // Which stage of a looping scene we are in: i (index), s (seconds into it),
  // f (fraction of it), lf (fades the whole scene at the loop's seam).
  function stages(t, durs, delay = 0.6) {
    const T = durs.reduce((a, d) => a + d, 0); const u = cycle(t, T, delay);
    let i = 0; let acc = 0;
    while (i < durs.length - 1 && u >= acc + durs[i]) { acc += durs[i]; i++; }
    const s = u - acc; const n = t < delay ? 0 : Math.floor((t - delay) / T);
    const lf = Math.min(clamp(u / 0.35 + (n === 0 ? 1 : 0)), clamp((T - u) / 0.35));
    return { i, s, f: clamp(s / durs[i]), u, T, n, lf };
  }

  // Drawing helpers in the board's holo style.
  const title = (ctx, text) => label(ctx, String(text), cx, Y0 + 28, { size: 26, weight: 700, fill: 'ink' });
  function chip(ctx, text, x, y, c = 'ink', size = 20, align = 'center') {
    text = String(text);
    ctx.font = `700 ${size}px ${FONT}`;
    const w = ctx.measureText(text).width + 24; const h = size + 14;
    const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.fillStyle = 'rgba(5,8,22,0.82)'; ctx.strokeStyle = tint(c, 0.6); ctx.lineWidth = 1.5;
    rounded(ctx, left, y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
    label(ctx, text, left + w / 2, y + 1, { size, weight: 700, fill: c });
    return w;
  }
  function arr(ctx, x0, y0, x1, y1, c, w = 5) { if (Math.hypot(x1 - x0, y1 - y0) > 4) arrow(ctx, x0, y0, x1, y1, c, w); }
  function dot(ctx, x, y, r, c, blur = 0) {
    if (blur) glow(ctx, color(c), blur);
    ctx.fillStyle = color(c); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    if (blur) ctx.shadowBlur = 0;
  }
  function line(ctx, x0, y0, x1, y1, c = 'ink', w = 2, dash) {
    ctx.strokeStyle = color(c); ctx.lineWidth = w; ctx.lineCap = 'round';
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    if (dash) ctx.setLineDash([]);
  }
  function ring(ctx, x, y, r, c, w = 2, dash) {
    ctx.strokeStyle = color(c); ctx.lineWidth = w;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
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
  // A line of text in several colours: parts = [[text, colour], ...].
  function rich(ctx, parts, x, y, size = 22, weight = 600, align = 'center') {
    ctx.font = `${weight} ${size}px ${FONT}`;
    const ws = parts.map(([s]) => ctx.measureText(s).width); const W = ws.reduce((a, w) => a + w, 0);
    let px = align === 'center' ? x - W / 2 : align === 'right' ? x - W : x;
    parts.forEach(([s, c], i) => { label(ctx, s, px, y, { size, weight, fill: c, align: 'left' }); px += ws[i]; });
  }
  // The caption box for the current stage, fading in as the stage starts.
  function caption(ctx, head, text, c, s) {
    ctx.save(); ctx.globalAlpha *= after(s, 0, 0.35);
    panel(ctx, X0 + 16, Y0 + 574, FIG.w - 32, 96, c, 0.09, 14);
    label(ctx, head, cx, Y0 + 597, { size: 21, weight: 800, fill: c });
    para(ctx, text, X0 + 34, Y0 + 638, FIG.w - 68, 19, 'ink', 500, 2);
    ctx.restore();
  }
  const footer = (ctx, text) => label(ctx, text, cx, Y0 + 689, { size: 18, weight: 500, fill: 'muted' });
  function tick(ctx, x, y, s, c = 'green', w = 5) { ctx.strokeStyle = color(c); ctx.lineWidth = w; ctx.lineCap = 'round'; poly(ctx, [x - s, y, x - s * 0.3, y + s * 0.7, x + s, y - s * 0.8]); ctx.stroke(); }
  function cross(ctx, x, y, s, c = 'red', w = 5) { ctx.strokeStyle = color(c); ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s); ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.stroke(); }
  // Fades a group in with its stage: wraps draw in save/restore.
  function show(ctx, a, draw) { if (a <= 0.001) return; ctx.save(); ctx.globalAlpha *= a; draw(); ctx.restore(); }

  // A stylised stick person standing on (x, y), h tall. o: face (1 right,
  // −1 left), walk (a phase), sit, arms ('down', 'up', 'forward', 'push',
  // 'point', 'give', 'lap', 'wide'), a (alpha).
  function person(ctx, x, y, h, c = 'ink', o = {}) {
    const s = h / 100; const f = o.face || 1; const col = color(c);
    ctx.save(); ctx.translate(x, y);
    if (o.a !== undefined) ctx.globalAlpha *= o.a;
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(2.5, 7 * s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const hip = o.sit ? -30 * s : -46 * s;
    const neck = hip - 34 * s; const hr = 11 * s; const hy = neck - hr - 1.5 * s;
    ctx.beginPath();
    if (o.sit) {
      ctx.moveTo(0, hip); ctx.lineTo(f * 26 * s, hip); ctx.lineTo(f * 30 * s, 0);
      ctx.moveTo(0, hip); ctx.lineTo(f * 22 * s, hip + 3 * s); ctx.lineTo(f * 24 * s, 0);
    } else if (o.walk !== undefined) {
      const sw = Math.sin(o.walk) * 17 * s;
      for (const fx of [sw, -sw]) { ctx.moveTo(0, hip); ctx.lineTo(fx / 2 + f * 5 * s, hip / 2); ctx.lineTo(fx, 0); }
    } else {
      const sp = 10 * s;
      ctx.moveTo(0, hip); ctx.lineTo(-sp / 2, hip / 2); ctx.lineTo(-sp, 0);
      ctx.moveTo(0, hip); ctx.lineTo(sp / 2, hip / 2); ctx.lineTo(sp, 0);
    }
    ctx.moveTo(0, hip); ctx.lineTo(0, neck);
    const sh = neck + 6 * s; const A = o.arms || 'down';
    const arm = (ex, ey, hx, hy2) => { ctx.moveTo(0, sh); ctx.lineTo(ex * s, sh + ey * s); ctx.lineTo(hx * s, sh + hy2 * s); };
    if (A === 'up') { arm(-14, -16, -18, -36); arm(14, -16, 18, -36); }
    else if (A === 'forward') { arm(f * 16, 8, f * 32, 4); arm(f * 14, 12, f * 30, 10); }
    else if (A === 'push') { arm(f * 18, 2, f * 40, -2); arm(f * 16, 6, f * 38, 4); }
    else if (A === 'point') { arm(f * 18, -2, f * 36, -12); arm(-f * 6, 16, -f * 8, 32); }
    else if (A === 'give') { arm(f * 16, 12, f * 34, 16); arm(-f * 6, 16, -f * 8, 32); }
    else if (A === 'lap') { arm(f * 10, 16, f * 22, 22); arm(f * 8, 18, f * 18, 24); }
    else if (A === 'wide') { arm(-18, 4, -34, -6); arm(18, 4, 34, -6); }
    else { arm(-8, 16, -10, 34); arm(8, 16, 10, 34); }
    ctx.stroke();
    ctx.fillStyle = tint(c, 0.3); ctx.beginPath(); ctx.arc(0, hy, hr, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // A speech (or thought) bubble with its tail pointing at (tx, ty).
  function bubble(ctx, x, y, w, h, c, tx, ty, think = false) {
    ctx.fillStyle = INK2; ctx.strokeStyle = tint(c, 0.85); ctx.lineWidth = 2;
    if (tx !== undefined) {
      const bx = clamp(tx, x + 24, x + w - 24); const by = ty > y + h / 2 ? y + h : y;
      if (think) {
        for (let k = 1; k <= 3; k++) { const q = k / 4; ctx.beginPath(); ctx.arc(lerp(bx, tx, q), lerp(by, ty, q), 7 - k * 1.4, 0, TAU); ctx.fill(); ctx.stroke(); }
      } else { poly(ctx, [bx - 11, by, tx, ty, bx + 11, by], true); ctx.fill(); ctx.stroke(); }
    }
    rounded(ctx, x, y, w, h, 14); ctx.fill(); ctx.stroke();
  }
  // A head in profile (facing f), r its radius, centred on (x, y).
  function head(ctx, x, y, r, c, f = 1, a = 0.1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(f, 1);
    ctx.fillStyle = tint(c, a); ctx.strokeStyle = tint(c, 0.85); ctx.lineWidth = 3; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-0.42 * r, 1.32 * r); ctx.lineTo(-0.5 * r, 0.82 * r);
    ctx.arc(0, 0, r, 2.2, 0.25);
    ctx.lineTo(1.13 * r, 0.42 * r); ctx.lineTo(0.96 * r, 0.52 * r); ctx.lineTo(0.95 * r, 0.7 * r); ctx.lineTo(0.62 * r, 0.96 * r); ctx.lineTo(0.42 * r, 1.32 * r);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // Sense icons, about 2s across, centred on (x, y).
  function eyeIcon(ctx, x, y, s, c) {
    ctx.strokeStyle = color(c); ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(x - s, y); ctx.quadraticCurveTo(x, y - s * 0.95, x + s, y); ctx.quadraticCurveTo(x, y + s * 0.95, x - s, y); ctx.stroke();
    dot(ctx, x, y, s * 0.32, c);
  }
  function earIcon(ctx, x, y, s, c) {
    ctx.strokeStyle = color(c); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.arc(x, y - s * 0.2, s * 0.7, Math.PI * 0.95, Math.PI * 2.25); ctx.quadraticCurveTo(x + s * 0.2, y + s * 0.5, x - s * 0.05, y + s);
    ctx.moveTo(x - s * 0.2, y - s * 0.2); ctx.arc(x, y - s * 0.2, s * 0.25, Math.PI, Math.PI * 2.1); ctx.stroke();
  }
  function handIcon(ctx, x, y, s, c) {
    ctx.strokeStyle = color(c); ctx.lineWidth = 3; ctx.lineCap = 'round';
    rounded(ctx, x - s * 0.5, y - s * 0.15, s, s * 0.85, s * 0.25); ctx.stroke();
    ctx.beginPath();
    for (let j = 0; j < 4; j++) { const fx = x - s * 0.38 + j * s * 0.25; ctx.moveTo(fx, y - s * 0.15); ctx.lineTo(fx, y - s * (0.75 + (j === 1 || j === 2 ? 0.2 : 0))); }
    ctx.moveTo(x - s * 0.5, y + s * 0.2); ctx.lineTo(x - s * 0.95, y - s * 0.15); ctx.stroke();
  }
  function noseIcon(ctx, x, y, s, c) {
    ctx.strokeStyle = color(c); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(x - s * 0.1, y - s); ctx.quadraticCurveTo(x + s * 0.2, y, x + s * 0.55, y + s * 0.55); ctx.quadraticCurveTo(x + s * 0.2, y + s * 0.8, x - s * 0.35, y + s * 0.55); ctx.stroke();
  }
  // A hand-drawn circle: never quite round, never quite closed.
  function wobbly(ctx, x, y, r, seed, p, c, w = 3) {
    if (p <= 0) return;
    const end = TAU * (0.93 + 0.12 * rnd(seed)); const n = 60; const m = Math.max(1, Math.round(n * p));
    const a0 = rnd(seed + 5) * TAU; const sx = 1 + (rnd(seed + 1) - 0.5) * 0.24; const p1 = rnd(seed + 2) * TAU; const p2 = rnd(seed + 3) * TAU;
    ctx.strokeStyle = color(c); ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath();
    for (let i = 0; i <= m; i++) {
      const a = a0 + (end * i) / n; const rr = r * (1 + 0.07 * Math.sin(2 * a + p1) + 0.05 * Math.sin(3 * a + p2) + 0.025 * Math.sin(7 * a + p1)) * (1 + 0.05 * (i / n));
      const px = x + Math.cos(a) * rr * sx; const py = y + Math.sin(a) * rr;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  // A chair in side view standing on (x, y), about 0.95 s tall; imperfect unless `perfect`.
  function chair(ctx, x, y, s, seed, c, perfect = false) {
    const j = perfect ? 0 : 1; const r = (n) => j * (rnd(seed * 7 + n) - 0.5);
    const seatH = s * (0.45 + r(1) * 0.12); const d = s * (0.42 + r(2) * 0.14); const backH = s * (0.5 + r(3) * 0.3);
    const lean = r(4) * 0.18 * s; const tilt = r(5) * 0.1 * s; const fl = r(6) * 0.16 * s;
    const bx = x - d / 2; const fx = x + d / 2;
    ctx.strokeStyle = color(c); ctx.lineWidth = Math.max(3, s * 0.05); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(bx, y); ctx.lineTo(bx, y - seatH + tilt); ctx.lineTo(bx - s * 0.04 + lean, y - seatH - backH);
    ctx.moveTo(bx, y - seatH + tilt); ctx.lineTo(fx, y - seatH - tilt); ctx.lineTo(fx + fl, y);
    ctx.moveTo(bx, y - seatH * 0.35); ctx.lineTo(lerp(fx, fx + fl, 0.65), y - seatH * 0.35 - tilt * 0.3);
    ctx.stroke();
    ctx.lineWidth = Math.max(5, s * 0.09); ctx.beginPath(); ctx.moveTo(bx, y - seatH + tilt); ctx.lineTo(fx + s * 0.03, y - seatH - tilt); ctx.stroke();
  }
  // A swan facing right, floating on y (about 70 s long and 55 s tall).
  function swan(ctx, x, y, s, body, edge, beak = COLORS.orange) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const neck = () => { ctx.beginPath(); ctx.moveTo(16, -8); ctx.quadraticCurveTo(30, -26, 20, -36); ctx.quadraticCurveTo(13, -44, 22, -48); ctx.stroke(); };
    ctx.strokeStyle = edge; ctx.lineWidth = 10; neck();
    ctx.strokeStyle = body; ctx.lineWidth = 6.5; neck();
    ctx.fillStyle = body; ctx.strokeStyle = edge; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-36, -16); ctx.quadraticCurveTo(-22, -6, -6, -12); ctx.quadraticCurveTo(26, -20, 26, -4); ctx.quadraticCurveTo(20, 8, -6, 8); ctx.quadraticCurveTo(-28, 8, -36, -16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-18, -8); ctx.quadraticCurveTo(0, -16, 14, -6); ctx.stroke();
    ctx.beginPath(); ctx.arc(22, -48, 6, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = beak; poly(ctx, [26, -51, 38, -46, 26, -44], true); ctx.fill();
    ctx.restore();
  }
  // A brain seen from the side, w × h, centred on (x, y).
  function brain(ctx, x, y, w, h, c = 'red') {
    ctx.fillStyle = tint(c, 0.32); ctx.strokeStyle = tint(c, 0.95); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(x, y, w / 2, h / 2, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    for (let j = 0; j < 4; j++) {
      const yy = y - h * 0.3 + j * h * 0.2; const x0 = x - w * 0.38 + (j % 2) * 8;
      ctx.moveTo(x0, yy); ctx.bezierCurveTo(x0 + w * 0.2, yy - 10, x0 + w * 0.32, yy + 10, x0 + w * 0.5, yy); ctx.bezierCurveTo(x0 + w * 0.6, yy - 8, x0 + w * 0.7, yy + 8, x0 + w * 0.76 - (j % 2) * 8, yy);
    }
    ctx.moveTo(x, y - h / 2); ctx.quadraticCurveTo(x + 6, y, x - 2, y + h * 0.3);
    ctx.stroke();
    ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x + w * 0.12, y + h * 0.42); ctx.lineTo(x + w * 0.16, y + h * 0.72); ctx.stroke();
  }
  // A gear of n teeth, radius r, turned by a.
  function gear(ctx, x, y, r, n, a, c) {
    ctx.beginPath();
    for (let i = 0; i < n * 4; i++) { const ang = a + (i / (n * 4)) * TAU; const rr = i % 4 < 2 ? r : r * 0.8; const px = x + Math.cos(ang) * rr; const py = y + Math.sin(ang) * rr; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fillStyle = tint(c, 0.22); ctx.fill(); ctx.strokeStyle = color(c); ctx.lineWidth = 2.5; ctx.stroke();
    ring(ctx, x, y, r * 0.3, c, 2.5);
  }
  // A small tree on the ground at (x, y).
  function tree(ctx, x, y, h, c = 'green') {
    ctx.fillStyle = tint('orange', 0.55); ctx.fillRect(x - h * 0.05, y - h * 0.55, h * 0.1, h * 0.55);
    ctx.fillStyle = tint(c, 0.55); ctx.strokeStyle = tint(c, 0.9); ctx.lineWidth = 2;
    for (const [dx, dy, r] of [[0, -0.78, 0.3], [-0.2, -0.6, 0.22], [0.2, -0.6, 0.22]]) { ctx.beginPath(); ctx.arc(x + dx * h, y + dy * h, r * h, 0, TAU); ctx.fill(); ctx.stroke(); }
  }

  return {
    // ─── Knowledge and reality ───────────────────────────────────────────

    // Plato's Forms: many imperfect circles and chairs below, the perfect
    // Forms above in the light; then Aristotle's objection.
    'plato-forms'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [4.5, 5, 5.5, 5.5]);
      const CXS = [X0 + 75, X0 + 160, X0 + 245, X0 + 330]; const CY = Y0 + 420;
      const HXS = [X0 + 475, X0 + 560, X0 + 645, X0 + 730]; const HB = Y0 + 468;
      const FC = { x: cx - 150, y: Y0 + 165 }; const FH = { x: cx + 150, y: Y0 + 214 };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || "Plato's theory of Forms");
      ctx.save(); ctx.globalAlpha *= S.lf;
      const lit = S.i === 2 ? after(S.s, 0.2, 1) : S.i === 3 ? 1 : 0;
      const ari = S.i === 3 ? after(S.s, 0.4, 1) : 0;
      // Before the Forms appear: an empty, dashed space above.
      show(ctx, (1 - lit) * 0.6, () => {
        ctx.strokeStyle = tint('yellow', 0.3); ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
        rounded(ctx, X0 + 60, Y0 + 60, FIG.w - 120, 198, 18); ctx.stroke(); ctx.setLineDash([]);
        if (S.i === 0) label(ctx, '?', cx, Y0 + 160, { size: 44, weight: 800, fill: tint('yellow', 0.4) });
      });
      // The world of Forms, lit from within.
      show(ctx, lit * (1 - 0.45 * ari), () => {
        const g = ctx.createRadialGradient(cx, Y0 + 165, 20, cx, Y0 + 165, 360);
        g.addColorStop(0, tint('yellow', 0.22)); g.addColorStop(1, tint('yellow', 0.02));
        ctx.fillStyle = g; ctx.strokeStyle = tint('yellow', 0.55); ctx.lineWidth = 2;
        rounded(ctx, X0 + 60, Y0 + 60, FIG.w - 120, 198, 18); ctx.fill(); ctx.stroke();
        label(ctx, 'World of Forms: perfect, unchanging, known by reason', cx, Y0 + 84, { size: 18, weight: 700, fill: 'yellow' });
        glow(ctx, COLORS.yellow, 10 + 4 * Math.sin(k * 2));
        ring(ctx, FC.x, FC.y, 48, 'yellow', 4);
        chair(ctx, FH.x, FH.y, 100, 0, 'yellow', true);
        ctx.shadowBlur = 0;
        label(ctx, 'the Form of Circle', FC.x, Y0 + 236, { size: 18, weight: 600, fill: 'ink' });
        label(ctx, 'the Form of Chair', FH.x, Y0 + 236, { size: 18, weight: 600, fill: 'ink' });
      });
      // Light falling from each Form onto its copies.
      show(ctx, 0.55 * lit * (1 - ari), () => {
        ctx.setLineDash([6, 9]); ctx.lineDashOffset = -k * 24; ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 2;
        ctx.beginPath();
        for (const x of CXS) { ctx.moveTo(FC.x, Y0 + 258); ctx.lineTo(x, CY - 44); }
        for (const x of HXS) { ctx.moveTo(FH.x, Y0 + 258); ctx.lineTo(x, HB - 100); }
        ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
      });
      // The copies we meet with the senses.
      const pc = (j) => (S.i === 0 ? clamp((S.s - 0.3 - j * 0.9) / 0.8) : 1);
      const ph = (j) => (S.i === 0 ? 0 : S.i === 1 ? clamp((S.s - 0.3 - j * 0.9) / 0.6) : 1);
      CXS.forEach((x, j) => wobbly(ctx, x, CY, 32 + j * 2, j + 3, pc(j), 'cyan', 3));
      HXS.forEach((x, j) => show(ctx, ph(j), () => chair(ctx, x, HB - 10 * (1 - ph(j)), 84 + (j % 2) * 10, j + 11, 'teal')));
      show(ctx, ari, () => {
        for (const x of CXS) dot(ctx, x, CY, 6, 'yellow', 8);
        HXS.forEach((x, j) => dot(ctx, x, HB - 46 - (j % 2) * 4, 6, 'yellow', 8));
        chip(ctx, 'Aristotle: the form is in the things themselves', cx, Y0 + 318, 'orange', 19);
      });
      show(ctx, S.i === 1 ? after(S.s, 2.4) : 0, () => chip(ctx, 'What do all chairs share? All circles?', cx, Y0 + 165, 'blue', 20));
      show(ctx, S.i === 0 ? 1 : 1, () => label(ctx, 'World of the senses: many imperfect, changing copies', cx, Y0 + 525, { size: 18, weight: 600, fill: 'muted' }));
      const CAP = [
        ['Many circles', 'Draw a circle as carefully as you like: it is never perfect. Every real circle is a little bumpy, a little off.', 'cyan'],
        ['Many chairs', 'Chairs come in endless shapes and sizes, yet we call them all chairs. What do they share? What makes a chair a chair?', 'teal'],
        ['The Forms', 'Plato: beyond the senses is a world of perfect, eternal Forms. Each thing we see is an imperfect copy that "shares in" its Form.', 'yellow'],
        ["Aristotle's objection", 'His student Aristotle disagreed: forms exist only in things, not in a separate world. And what could "sharing in" a Form mean?', 'orange'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Plato, Republic and Phaedo; Aristotle, Metaphysics');
      ctx.restore();
    },

    // Locke's blank slate filled by the senses, Descartes's innate ideas and
    // reason, each side's challenge, and Kant combining them.
    'empiricism-rationalism'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5, 5, 5.5, 5.5]);
      const LX = X0 + 228; const RX = X0 + 590; const HY = Y0 + 255; const HR = 80;
      const C = it._c || (it._c = { marks: Array.from({ length: 16 }, (_, j) => ({ x: (rnd(j * 3 + 1) - 0.5) * 70, y: (rnd(j * 3 + 2) - 0.5) * 46, c: HUES[j % 6], kind: j % 3 })) });
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Where does knowledge come from?');
      ctx.save(); ctx.globalAlpha *= S.lf;
      // Empiricism: the senses write on a blank slate.
      show(ctx, S.i === 1 ? 0.45 : 1, () => {
        panel(ctx, X0 + 16, Y0 + 58, 368, 374, 'cyan', 0.06);
        label(ctx, 'Empiricism', X0 + 200, Y0 + 86, { size: 22, weight: 800, fill: 'cyan' });
        label(ctx, 'Locke: a blank slate', X0 + 200, Y0 + 114, { size: 18, weight: 600, fill: 'ink' });
        head(ctx, LX, HY, HR, 'cyan', -1);
        ctx.fillStyle = 'rgba(30,40,60,0.95)'; ctx.strokeStyle = tint('ink', 0.6); ctx.lineWidth = 2;
        rounded(ctx, LX - 42, HY - 30, 92, 60, 6); ctx.fill(); ctx.stroke();
        const n = S.i === 0 ? Math.floor(clamp((S.s - 0.8) / 3.4) * 16) : 16;
        for (let j = 0; j < n; j++) {
          const m = C.marks[j]; const px = LX + 4 + m.x; const py = HY + m.y;
          if (m.kind === 0) dot(ctx, px, py, 4, m.c);
          else if (m.kind === 1) line(ctx, px - 6, py + 3, px + 6, py - 3, m.c, 3);
          else ring(ctx, px, py, 4, m.c, 2);
        }
        const SENSES = [['see', Y0 + 186, eyeIcon], ['hear', Y0 + 262, earIcon], ['touch', Y0 + 338, handIcon]];
        SENSES.forEach(([name, y, icon], j) => {
          icon(ctx, X0 + 58, y - 8, 16, 'cyan');
          label(ctx, name, X0 + 58, y + 22, { size: 18, weight: 600, fill: 'cyan' });
          arr(ctx, X0 + 86, y - 8, X0 + 150, lerp(y - 8, HY, 0.6), tint('cyan', 0.7), 3);
          if (S.i === 0) { const q = mod(k * 0.9 + j * 0.33, 1); dot(ctx, lerp(X0 + 86, X0 + 178, q), lerp(y - 8, HY, q * 0.9), 4, 'yellow'); }
        });
        label(ctx, 'all ideas come from experience', X0 + 200, Y0 + 404, { size: 18, weight: 600, fill: 'cyan' });
      });
      // Rationalism: ideas already inside, and reason working on them.
      show(ctx, S.i === 0 ? 0.35 : 1, () => {
        panel(ctx, X0 + 416, Y0 + 58, 368, 374, 'purple', 0.06);
        label(ctx, 'Rationalism', X0 + 600, Y0 + 86, { size: 22, weight: 800, fill: 'purple' });
        label(ctx, 'Descartes: inborn ideas', X0 + 600, Y0 + 114, { size: 18, weight: 600, fill: 'ink' });
        head(ctx, RX, HY, HR, 'purple', 1);
        const pulse = S.i === 1 ? 0.5 + 0.5 * Math.sin(k * 4) : 0.3;
        glow(ctx, COLORS.yellow, 6 + 8 * pulse);
        ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 3;
        poly(ctx, [RX - 34, HY - 4, RX - 18, HY - 32, RX - 2, HY - 4], true); ctx.stroke();
        ctx.beginPath();
        for (let j = 0; j <= 40; j++) { const a = (j / 40) * TAU; const d = 1 + Math.sin(a) ** 2; const px = RX + 30 + (16 * Math.cos(a)) / d; const py = HY - 18 + (16 * Math.sin(a) * Math.cos(a)) / d; if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.stroke();
        label(ctx, '2 + 2 = 4', RX, HY + 26, { size: 20, weight: 800, fill: 'yellow' });
        ctx.shadowBlur = 0;
        if (S.i >= 1) {
          ctx.strokeStyle = tint('yellow', 0.6); ctx.lineWidth = 2.5; ctx.beginPath();
          for (let j = 0; j < 8; j++) { const a = (j / 8) * TAU + k * 0.4; const r0 = HR + 22 + 6 * Math.sin(k * 3 + j); ctx.moveTo(RX + Math.cos(a) * r0, HY + Math.sin(a) * r0); ctx.lineTo(RX + Math.cos(a) * (r0 + 12), HY + Math.sin(a) * (r0 + 12)); }
          ctx.stroke();
        }
        label(ctx, 'reason knows some truths first', X0 + 600, Y0 + 404, { size: 18, weight: 600, fill: 'purple' });
      });
      // Each side's challenge to the other.
      show(ctx, S.i === 2 ? after(S.s, 0.4) : 0, () => {
        panel(ctx, X0 + 16, Y0 + 448, 368, 110, 'purple', 0.08, 14);
        label(ctx, 'Rationalists ask:', X0 + 200, Y0 + 470, { size: 18, weight: 800, fill: 'purple' });
        para(ctx, 'How can the senses ever give certainty, like maths?', X0 + 32, Y0 + 516, 336, 18, 'ink', 500, 2);
        panel(ctx, X0 + 416, Y0 + 448, 368, 110, 'cyan', 0.08, 14);
        label(ctx, 'Empiricists ask:', X0 + 600, Y0 + 470, { size: 18, weight: 800, fill: 'cyan' });
        para(ctx, 'Where is any sign that newborn babies know geometry?', X0 + 432, Y0 + 516, 336, 18, 'ink', 500, 2);
      });
      // Kant: both together.
      show(ctx, S.i === 3 ? after(S.s, 0.3) : 0, () => {
        arr(ctx, X0 + 200, Y0 + 424, X0 + 300, Y0 + 452, 'yellow', 4);
        arr(ctx, X0 + 600, Y0 + 424, X0 + 500, Y0 + 452, 'yellow', 4);
        panel(ctx, X0 + 60, Y0 + 456, FIG.w - 120, 102, 'yellow', 0.1, 14);
        label(ctx, 'Kant: knowledge needs both', cx, Y0 + 482, { size: 21, weight: 800, fill: 'yellow' });
        para(ctx, 'Experience gives the content; the mind gives the form: space, time and cause.', X0 + 84, Y0 + 526, FIG.w - 168, 18, 'ink', 500, 2);
      });
      const CAP = [
        ['Empiricism', 'Locke: at birth the mind is like a blank slate. Everything we know is written on it by experience, through the senses.', 'cyan'],
        ['Rationalism', 'Descartes: some ideas, like self, number and shape, are inborn. Reason alone can prove truths the senses never could.', 'purple'],
        ['Each side pushes back', 'Rationalists: the senses can fool us and never give certainty. Empiricists: where is the evidence of inborn ideas?', 'orange'],
        ["Kant's synthesis", 'Kant: "Thoughts without content are empty, intuitions without concepts are blind." Knowledge needs experience and reason.', 'yellow'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Locke 1689 · Descartes 1641 · Kant, Critique of Pure Reason 1781');
      ctx.restore();
    },

    // White swans counted for centuries, then one black swan: Hume's problem
    // and Popper's falsification.
    'induction-swans'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5, 4.5, 5, 5.5]);
      const WY0 = Y0 + 306; const WY1 = Y0 + 446;
      const black = S.i === 2 ? smooth(S.s / 2.4) : S.i === 3 ? 1 : 0;
      const broken = S.i === 2 ? after(S.s, 2.3, 0.5) : S.i === 3 ? 1 : 0;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The problem of induction');
      ctx.save(); ctx.globalAlpha *= S.lf;
      // The lake.
      const wg = ctx.createLinearGradient(0, WY0, 0, WY1);
      wg.addColorStop(0, tint('blue', 0.26)); wg.addColorStop(1, tint('blue', 0.05));
      ctx.fillStyle = wg; ctx.fillRect(X0 + 10, WY0, FIG.w - 20, WY1 - WY0);
      ctx.strokeStyle = tint('cyan', 0.25); ctx.lineWidth = 2; ctx.beginPath();
      for (let j = 0; j < 4; j++) { const y = WY0 + 16 + j * 28; for (let x = X0 + 14; x <= X1 - 14; x += 12) { const yy = y + Math.sin(x * 0.04 + k * 1.5 + j) * 3; if (x === X0 + 14) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); } }
      ctx.stroke();
      // White swans gliding past, for ever.
      ctx.save(); ctx.beginPath(); ctx.rect(X0 + 10, Y0 + 230, FIG.w - 20, 240); ctx.clip();
      for (let j = 0; j < 6; j++) { const x = X0 - 60 + mod(k * 60 + j * 160, 960); swan(ctx, x, WY0 + 40 + Math.sin(k * 2 + j) * 2, 0.95, '#f4f6ff', 'rgba(150,165,210,0.9)'); }
      if (black > 0) {
        const bx = lerp(X0 - 80, cx + 30, black); const by = WY0 + 106 + Math.sin(k * 2) * 2;
        if (broken > 0) {
          ctx.save(); const ga = ctx.globalAlpha * broken; ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 2.5;
          for (let m = 0; m < 2; m++) { const q = mod(k * 0.6 + m * 0.5, 1); ctx.globalAlpha = ga * (1 - q); ctx.beginPath(); ctx.ellipse(bx, by + 8, 40 + q * 50, 8 + q * 8, 0, 0, TAU); ctx.stroke(); }
          ctx.restore();
        }
        swan(ctx, bx, by, 1.2, '#11131c', 'rgba(220,226,255,0.85)', COLORS.red);
      }
      ctx.restore();
      show(ctx, broken, () => label(ctx, 'a black swan!', cx + 34, WY1 + 20, { size: 19, weight: 800, fill: 'yellow' }));
      // The tally.
      panel(ctx, X0 + 24, Y0 + 62, 320, 136, 'cyan', 0.07, 14);
      label(ctx, 'white swans seen', X0 + 184, Y0 + 88, { size: 18, weight: 600, fill: 'muted' });
      const count = S.i === 0 ? 10 ** (1 + 5 * smooth(S.s / 4.6)) : 1e6 + (S.u - 5) * 731;
      label(ctx, fmt(count), X0 + 184, Y0 + 136, { size: 42, weight: 800, fill: 'ink' });
      label(ctx, 'in Europe, over centuries', X0 + 184, Y0 + 178, { size: 18, weight: 500, fill: 'muted' });
      // The conclusion, and how confident it feels.
      const conf = S.i === 0 ? smooth(S.s / 4.6) : 1 - broken;
      const shake = S.i === 1 ? Math.sin(k * 30) * 2 * after(S.s, 1.5) : broken > 0 && broken < 1 ? Math.sin(k * 40) * 4 : 0;
      chip(ctx, 'All swans are white.', X0 + 590 + shake, Y0 + 104, 'ink', 23);
      if (broken > 0) { ctx.save(); ctx.globalAlpha *= broken; line(ctx, X0 + 460, Y0 + 106, lerp(X0 + 460, X0 + 720, broken), Y0 + 102, 'red', 5); ctx.restore(); }
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; rounded(ctx, X0 + 450, Y0 + 150, 280, 14, 7); ctx.fill();
      ctx.fillStyle = broken > 0.5 ? COLORS.red : COLORS.green; rounded(ctx, X0 + 450, Y0 + 150, Math.max(6, 280 * conf), 14, 7); ctx.fill();
      label(ctx, 'how sure we feel', X0 + 590, Y0 + 184, { size: 18, weight: 600, fill: 'muted' });
      show(ctx, S.i === 1 ? after(S.s, 0.8) : 0, () => chip(ctx, 'Hume: but must the next swan be white?', cx, Y0 + 244, 'purple', 20));
      show(ctx, S.i === 2 ? after(S.s, 2.6) : 0, () => chip(ctx, '1697: black swans in Western Australia', cx, Y0 + 244, 'yellow', 20));
      show(ctx, S.i === 3 ? after(S.s, 0.4) : 0, () => {
        chip(ctx, 'Popper: test theories, try to refute them', cx, Y0 + 244, 'orange', 20);
        chip(ctx, '1,000,000 white: still no proof', X0 + 205, Y0 + 522, 'green', 19);
        chip(ctx, '1 black: refuted', X0 + 610, Y0 + 522, 'red', 19);
      });
      const CAP = [
        ['Counting swans', 'For centuries Europeans saw only white swans: thousands, then millions. Surely "all swans are white" was proven?', 'cyan'],
        ["Hume's problem", 'Hume: no number of past cases proves the next will match. Assuming nature stays the same is itself based on past cases.', 'purple'],
        ['A black swan', 'In 1697 Dutch sailors found black swans in Western Australia. One sighting overturned centuries of "proof".', 'yellow'],
        ["Popper's answer", 'Popper: science never proves theories, it tests them; one counterexample can refute. Critics: scientists rarely drop a theory at once.', 'orange'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Hume, Treatise 1739 · Popper, Logic of Scientific Discovery 1934');
      ctx.restore();
    },

    // ─── Ethics ──────────────────────────────────────────────────────────

    // One act, judged differently by three cultures; relativism, universal
    // values, and the debate between them.
    'moral-relativism'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5, 5, 5, 5.5]);
      const GX = [X0 + 140, cx, X1 - 140]; const GB = Y0 + 400; const GC = ['teal', 'orange', 'purple'];
      const V = [['respectful', 'green'], ['rude', 'red'], ['honest', 'green']];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Moral relativism');
      ctx.save(); ctx.globalAlpha *= S.lf;
      panel(ctx, X0 + 170, Y0 + 62, 460, 84, 'blue', 0.1, 14);
      label(ctx, 'Looking an elder in the eye', cx, Y0 + 94, { size: 22, weight: 800, fill: 'ink' });
      label(ctx, 'one act, different verdicts', cx, Y0 + 126, { size: 18, weight: 500, fill: 'muted' });
      GX.forEach((gx, j) => {
        // The standard each culture judges by.
        show(ctx, S.i >= 1 ? (S.i === 1 ? after(S.s, 0.3) : 1) : 0, () => {
          ctx.save(); ctx.lineDashOffset = -k * 12 * (j % 2 ? 1 : -1);
          ctx.strokeStyle = tint(GC[j], 0.7); ctx.lineWidth = 2.5; ctx.setLineDash([8, 7]);
          ctx.beginPath(); ctx.arc(gx, Y0 + 360, 90, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
          ctx.restore();
        });
        for (let m = -1; m <= 1; m++) person(ctx, gx + m * 40, GB, 74, GC[j], { face: m < 0 ? 1 : -1, arms: m === 0 && S.i === 0 ? 'point' : 'down' });
        label(ctx, `Culture ${'ABC'[j]}`, gx, Y0 + 424, { size: 18, weight: 700, fill: GC[j] });
        const va = S.i === 0 ? after(S.s, 0.8 + j * 0.8) : 1;
        show(ctx, va, () => {
          arr(ctx, cx + (j - 1) * 120, Y0 + 150, gx, Y0 + 198, tint(V[j][1], 0.7), 3);
          chip(ctx, V[j][0], gx, Y0 + 222, V[j][1], 20);
        });
      });
      show(ctx, S.i >= 2 ? (S.i === 2 ? after(S.s, 0.4) : 1) : 0, () => {
        for (const gx of GX) line(ctx, gx, Y0 + 450, gx, Y0 + 466, 'teal', 4);
        panel(ctx, X0 + 40, Y0 + 466, FIG.w - 80, 48, 'teal', 0.12, 12);
        label(ctx, 'shared core? care for children · fairness · no cruelty', cx, Y0 + 491, { size: 19, weight: 700, fill: 'teal' });
      });
      show(ctx, S.i === 3 ? after(S.s, 0.5) : 0, () => {
        chip(ctx, 'For: humility, tolerance', X0 + 200, Y0 + 543, 'green', 19);
        chip(ctx, "Against: can't condemn slavery?", X0 + 590, Y0 + 543, 'red', 19);
      });
      const CAP = [
        ['The same act', 'In some cultures, looking an elder in the eye shows honesty and respect. In others it is rude or challenging.', 'cyan'],
        ['Moral relativism', 'Relativists say right and wrong are set by each culture, with no neutral standard above them all. Herodotus noted how customs differ.', 'orange'],
        ['Universal principles?', 'Others reply that customs differ but core values recur everywhere: caring for children, fairness, not harming the innocent.', 'teal'],
        ['The debate', 'If culture decides, could anyone condemn slavery, or a reformer ever be right? Relativists reply that it teaches humility.', 'purple'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Herodotus, Histories III.38 · Ruth Benedict 1934 · James Rachels 1986');
      ctx.restore();
    },

    // Socrates' question to Euthyphro, the two horns, and the "third way".
    euthyphro(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5.5, 5, 5, 5.5]);
      const FY = Y0 + 345; const TB = Y0 + 455; const LXc = X0 + 200; const RXc = X1 - 200; const CT = Y0 + 224;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The Euthyphro dilemma');
      ctx.save(); ctx.globalAlpha *= S.lf;
      // The fork in the road.
      line(ctx, cx, TB, cx, FY, 'rgba(200,215,255,0.55)', 6);
      const branch = (tx, c, lit) => {
        ctx.strokeStyle = lit ? color(c) : 'rgba(200,215,255,0.35)'; ctx.lineWidth = lit ? 6 : 5; ctx.lineCap = 'round';
        if (lit) glow(ctx, color(c), 8);
        ctx.beginPath(); ctx.moveTo(cx, FY); ctx.quadraticCurveTo(tx, FY, tx, CT); ctx.stroke(); ctx.shadowBlur = 0;
      };
      branch(LXc, 'orange', S.i === 1); branch(RXc, 'teal', S.i === 2);
      if (S.i === 1 || S.i === 2) { const q = mod(k * 0.6, 1); const tx = S.i === 1 ? LXc : RXc; const u = 1 - q; dot(ctx, u * u * cx + 2 * u * q * tx + q * q * tx, u * u * FY + 2 * u * q * FY + q * q * CT, 6, S.i === 1 ? 'orange' : 'teal'); }
      // The two horns.
      const horn = (x, c, head, body, prob, on) => {
        show(ctx, on ? 1 : 0.45, () => {
          panel(ctx, x, Y0 + 66, 360, 158, c, on ? 0.12 : 0.04, 14);
          label(ctx, head, x + 180, Y0 + 92, { size: 20, weight: 800, fill: c });
        });
        show(ctx, on ? 1 : 0, () => {
          para(ctx, body, x + 16, Y0 + 136, 328, 18, 'ink', 500, 2);
          para(ctx, prob, x + 16, Y0 + 192, 328, 18, 'red', 600, 2);
        });
      };
      horn(X0 + 20, 'orange', 'Good because commanded', 'Then goodness is simply whatever is commanded.', 'Problem: it seems arbitrary. Could cruelty become good?', S.i === 1 || S.i === 3);
      horn(X0 + 420, 'teal', 'Commanded because good', 'Then goodness is a standard the gods follow.', 'Problem: then goodness stands apart from the gods.', S.i >= 2);
      show(ctx, S.i === 3 ? after(S.s, 0.6) : 0, () => {
        line(ctx, cx, FY, cx, Y0 + 282, 'purple', 5);
        chip(ctx, "Third way: goodness is God's nature", cx, Y0 + 262, 'purple', 19);
        show(ctx, after(S.s, 2.2), () => chip(ctx, 'Critics: then why call that nature good?', cx, Y0 + 306, 'red', 18));
      });
      // Socrates and Euthyphro.
      person(ctx, X0 + 200, Y0 + 556, 82, 'yellow', { face: 1, arms: S.i === 0 && S.s > 2 ? 'point' : 'down' });
      person(ctx, X0 + 600, Y0 + 556, 82, 'cyan', { face: -1, arms: S.i === 0 && S.s < 2 ? 'give' : 'down' });
      label(ctx, 'Socrates', X0 + 158, Y0 + 520, { size: 18, weight: 700, fill: 'yellow', align: 'right' });
      label(ctx, 'Euthyphro', X0 + 642, Y0 + 520, { size: 18, weight: 700, fill: 'cyan', align: 'left' });
      const old = S.i === 0 ? 1 : 0.6;
      show(ctx, (S.i === 0 ? after(S.s, 0.3) : 1) * old, () => {
        bubble(ctx, X0 + 440, Y0 + 364, 344, 72, 'cyan', X0 + 600, Y0 + 462);
        para(ctx, 'The holy is what the gods love.', X0 + 456, Y0 + 400, 312, 18, 'ink', 600, 2);
      });
      show(ctx, (S.i === 0 ? after(S.s, 2) : 1) * old, () => {
        bubble(ctx, X0 + 16, Y0 + 362, 356, 84, 'yellow', X0 + 200, Y0 + 462);
        para(ctx, 'Is it loved because it is holy, or holy because it is loved?', X0 + 32, Y0 + 404, 324, 18, 'ink', 600, 3);
      });
      const CAP = [
        ["Socrates' question", 'Euthyphro says holiness is what the gods love. Socrates asks: is it loved because it is holy, or holy because it is loved?', 'cyan'],
        ['Horn 1: good because commanded', 'If goodness is whatever is commanded, it seems arbitrary: had cruelty been commanded, it would have been good.', 'orange'],
        ['Horn 2: commanded because good', 'If commands follow goodness, then goodness is a standard of its own, and we might know it without asking the gods.', 'teal'],
        ['A third way?', "Some theists, following Aquinas, say goodness flows from God's own nature, so neither horn applies. Critics think the dilemma returns.", 'purple'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Plato, Euthyphro (c. 399 BCE), 10a');
      ctx.restore();
    },

    // ─── Philosophy of religion ──────────────────────────────────────────

    // A chain of causes going back; Aquinas's first cause; the objections.
    'first-cause'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5, 5.5, 5.5, 5.5]);
      const LY = Y0 + 250; const NX = [X0 + 195, X0 + 335, X0 + 475, X0 + 615, X0 + 745];
      const NL = ['Big Bang', 'stars', 'Earth', 'parents', 'you']; const NC = ['purple', 'yellow', 'teal', 'cyan', 'blue'];
      const SX = X0 + 72;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The first-cause argument');
      ctx.save(); ctx.globalAlpha *= S.lf;
      const src = S.i === 0 ? 0 : S.i === 1 ? after(S.s, 0.4, 0.8) : 1;
      // The chain: each thing caused by the one before.
      const vis = (j) => (S.i === 0 ? after(S.s, 0.3 + (4 - j) * 0.7) : 1);
      for (let j = 0; j < 4; j++) show(ctx, Math.min(vis(j), vis(j + 1)), () => arr(ctx, NX[j] + 40, LY, NX[j + 1] - 40, LY, tint('ink', 0.6), 4));
      show(ctx, src, () => arr(ctx, SX + 34, LY, NX[0] - 40, LY, 'yellow', 4));
      const xs = [SX, ...NX]; const first = src > 0.5 ? 0 : 1;
      const span = xs[5] - xs[first]; const q = mod(k * 0.35, 1);
      if (S.i > 0 || S.s > 3.8) dot(ctx, xs[first] + span * q, LY, 6, 'yellow', 8);
      NX.forEach((x, j) => show(ctx, vis(j), () => {
        ctx.fillStyle = tint(NC[j], 0.2); ctx.strokeStyle = color(NC[j]); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, LY, 36, 0, TAU); ctx.fill(); ctx.stroke();
        label(ctx, NL[j], x, LY + 60, { size: 18, weight: 700, fill: NC[j] });
      }));
      // A little picture in each link.
      NX.forEach((x, j) => show(ctx, vis(j), () => {
        if (j === 0) { ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 2.5; ctx.beginPath(); for (let m = 0; m < 10; m++) { const a = (m / 10) * TAU + k * 0.3; ctx.moveTo(x + Math.cos(a) * 6, LY + Math.sin(a) * 6); ctx.lineTo(x + Math.cos(a) * 20, LY + Math.sin(a) * 20); } ctx.stroke(); }
        else if (j === 1) { ctx.fillStyle = COLORS.yellow; ctx.beginPath(); for (let m = 0; m < 10; m++) { const a = -Math.PI / 2 + (m / 10) * TAU; const r = m % 2 ? 8 : 19; ctx.lineTo(x + Math.cos(a) * r, LY + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); }
        else if (j === 2) { ctx.fillStyle = tint('blue', 0.8); ctx.beginPath(); ctx.arc(x, LY, 18, 0, TAU); ctx.fill(); ctx.fillStyle = COLORS.green; ctx.beginPath(); ctx.ellipse(x - 5, LY - 4, 8, 6, 0.5, 0, TAU); ctx.ellipse(x + 8, LY + 7, 5, 4, 0, 0, TAU); ctx.fill(); }
        else if (j === 3) { person(ctx, x - 9, LY + 20, 40, 'cyan'); person(ctx, x + 9, LY + 20, 40, 'cyan'); }
        else person(ctx, x, LY + 20, 40, 'blue');
      }));
      // A question mark before Big Bang, then the first cause in light.
      show(ctx, S.i === 0 ? after(S.s, 3.6) : 0, () => { ring(ctx, SX, LY, 30, 'muted', 2, [5, 6]); label(ctx, '?', SX, LY + 1, { size: 26, weight: 800, fill: 'muted' }); });
      show(ctx, src, () => {
        const g = ctx.createRadialGradient(SX, LY, 4, SX, LY, 70);
        g.addColorStop(0, tint('yellow', 0.55)); g.addColorStop(1, tint('yellow', 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(SX, LY, 70, 0, TAU); ctx.fill();
        glow(ctx, COLORS.yellow, 12); dot(ctx, SX, LY, 18 + 2 * Math.sin(k * 3), 'yellow'); ctx.shadowBlur = 0;
        label(ctx, 'first cause', SX, LY + 60, { size: 18, weight: 700, fill: 'yellow' });
        label(ctx, 'uncaused', SX, LY + 84, { size: 18, weight: 500, fill: 'yellow' });
      });
      // Before the first cause: a question, or an endless line.
      show(ctx, S.i === 2 ? after(S.s, 0.4) : 0, () => {
        line(ctx, X0 + 14, LY - 46, SX - 34, LY - 14, 'red', 3, [6, 6]);
        label(ctx, '?', X0 + 22, LY - 64, { size: 26, weight: 800, fill: 'red' });
      });
      const top = [null, ['Aquinas: no endless chain, so a first cause', 'yellow'], ['What caused the first cause?', 'red'], ['Defenders: a necessary being needs no cause', 'purple']][S.i];
      if (top) show(ctx, after(S.s, 0.9), () => chip(ctx, top[0], cx, Y0 + 130, top[1], 20));
      const boxes = S.i === 2
        ? [['If everything needs a cause, so does the first cause.', 'red'], ['If something can be uncaused, why not the universe itself?', 'orange']]
        : S.i === 3 ? [['Hume: why not an endless chain, with no first link?', 'blue'], ['And why must a first cause be God, or have a mind?', 'orange']] : null;
      if (boxes) {
        show(ctx, after(S.s, 1.4), () => {
          boxes.forEach(([txt, c], j) => {
            const x = j ? X0 + 412 : X0 + 20;
            panel(ctx, x, Y0 + 370, 368, 92, c, 0.09, 14);
            para(ctx, txt, x + 18, Y0 + 416, 332, 19, 'ink', 600, 3);
          });
        });
      }
      show(ctx, S.i === 1 ? after(S.s, 2.2) : 0, () => {
        for (let j = 0; j < 6; j++) { const x = X0 + 430 - j * 70; ctx.save(); ctx.globalAlpha *= 1 - j * 0.14; ring(ctx, x, Y0 + 430, 20, 'muted', 2.5); if (j < 5) arr(ctx, x - 50, Y0 + 430, x - 24, Y0 + 430, 'muted', 3); ctx.restore(); }
        label(ctx, '…', X0 + 34, Y0 + 428, { size: 24, weight: 800, fill: 'muted' });
        cross(ctx, X0 + 260, Y0 + 430, 34, 'red', 5);
        label(ctx, 'an endless chain?', X0 + 490, Y0 + 418, { size: 19, weight: 700, fill: 'red', align: 'left' });
        label(ctx, 'Aquinas: impossible', X0 + 490, Y0 + 444, { size: 18, weight: 600, fill: 'ink', align: 'left' });
      });
      show(ctx, S.i === 3 ? after(S.s, 2.4) : 0, () => {
        line(ctx, X0 + 80, Y0 + 504, X0 + 470, Y0 + 504, 'blue', 3);
        arr(ctx, X0 + 90, Y0 + 504, X0 + 30, Y0 + 504, 'blue', 3);
        [-4, -3, -2, -1, 0].forEach((n, j) => { const x = X0 + 130 + j * 80; line(ctx, x, Y0 + 496, x, Y0 + 512, 'blue', 3); label(ctx, n < 0 ? `−${-n}` : '0', x, Y0 + 534, { size: 18, weight: 700, fill: 'blue' }); });
        label(ctx, '…', X0 + 50, Y0 + 532, { size: 20, weight: 800, fill: 'blue' });
        label(ctx, 'no first number,', X0 + 500, Y0 + 494, { size: 18, weight: 600, fill: 'blue', align: 'left' });
        label(ctx, 'yet each has one before', X0 + 500, Y0 + 518, { size: 18, weight: 600, fill: 'blue', align: 'left' });
      });
      const CAP = [
        ['A chain of causes', 'You were caused by your parents, they by theirs, and so on back: Earth, the stars, the Big Bang. Every event has a cause.', 'cyan'],
        ['The first cause', 'Aquinas: the chain cannot go back for ever, so there must be a first, uncaused cause, "and this everyone understands to be God."', 'yellow'],
        ['What caused that?', 'Critics ask: if everything needs a cause, what caused the first cause? And if something can be uncaused, why not the universe?', 'red'],
        ['The debate goes on', 'Hume asked why the chain cannot be endless. Defenders reply that a necessary being is not the kind of thing that needs a cause.', 'purple'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Aquinas, Summa Theologiae I, q.2, a.3 · Hume, Dialogues (1779)');
      ctx.restore();
    },

    // Paley's watch on the heath, the eye, Darwin's reply, and fine-tuning.
    'design-argument'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5.5, 5, 6, 6]);
      const sa = after(S.s, 0, 0.5);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The design argument');
      ctx.save(); ctx.globalAlpha *= S.lf * sa;
      if (S.i === 0) {
        // A heath: a stone, a watch, and Paley.
        line(ctx, X0 + 20, Y0 + 430, X1 - 20, Y0 + 430, tint('green', 0.6), 3);
        ctx.strokeStyle = tint('green', 0.5); ctx.lineWidth = 2; ctx.beginPath();
        for (let j = 0; j < 22; j++) { const x = X0 + 30 + j * 36 + rnd(j) * 10; ctx.moveTo(x, Y0 + 430); ctx.lineTo(x - 5, Y0 + 418); ctx.moveTo(x, Y0 + 430); ctx.lineTo(x + 4, Y0 + 416); }
        ctx.stroke();
        ctx.fillStyle = 'rgba(147,160,196,0.5)'; ctx.strokeStyle = COLORS.muted; ctx.lineWidth = 2;
        poly(ctx, [X0 + 125, Y0 + 430, X0 + 132, Y0 + 400, X0 + 160, Y0 + 384, X0 + 196, Y0 + 390, X0 + 216, Y0 + 412, X0 + 212, Y0 + 430], true); ctx.fill(); ctx.stroke();
        person(ctx, X0 + 360, Y0 + 430, 96, 'yellow', { face: 1, arms: S.s > 1.2 ? 'point' : 'down' });
        const WX = X0 + 565; const WYc = Y0 + 362;
        ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 3; ring(ctx, WX, WYc - 88, 10, 'yellow', 3);
        ctx.fillStyle = COLORS.yellow; ctx.fillRect(WX - 9, WYc - 78, 18, 14);
        ctx.fillStyle = 'rgba(12,16,34,0.95)'; ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(WX, WYc, 62, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2; ctx.beginPath();
        for (let j = 0; j < 12; j++) { const a = (j / 12) * TAU; ctx.moveTo(WX + Math.cos(a) * 50, WYc + Math.sin(a) * 50); ctx.lineTo(WX + Math.cos(a) * 56, WYc + Math.sin(a) * 56); }
        ctx.stroke();
        line(ctx, WX, WYc, WX + Math.cos(k * 0.5 - 1.6) * 30, WYc + Math.sin(k * 0.5 - 1.6) * 30, 'ink', 4);
        line(ctx, WX, WYc, WX + Math.cos(k * 3 - 1.6) * 44, WYc + Math.sin(k * 3 - 1.6) * 44, 'cyan', 2.5);
        dot(ctx, WX, WYc, 5, 'yellow');
        show(ctx, after(S.s, 1.4), () => {
          gear(ctx, X0 + 700, Y0 + 172, 32, 10, k * 0.8, 'orange');
          gear(ctx, X0 + 746, Y0 + 220, 22, 7, -k * 0.8 * (32 / 22) + 0.2, 'orange');
          label(ctx, 'parts fit together', X0 + 712, Y0 + 280, { size: 18, weight: 600, fill: 'orange' });
          line(ctx, WX + 40, WYc - 48, X0 + 676, Y0 + 190, 'orange', 2, [4, 5]);
        });
        label(ctx, 'a stone: just there', X0 + 170, Y0 + 462, { size: 18, weight: 600, fill: 'muted' });
        label(ctx, 'a watch: parts work for a purpose', X0 + 560, Y0 + 462, { size: 18, weight: 600, fill: 'yellow' });
        show(ctx, after(S.s, 2.8), () => chip(ctx, 'so: a watchmaker', X0 + 420, Y0 + 130, 'yellow', 21));
      } else if (S.i === 1) {
        // The eye as an instrument.
        const ex = X0 + 260; const ey = Y0 + 300; const R = 92;
        ctx.fillStyle = tint('ink', 0.06); ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(ex, ey, R, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(ex - R + 26, ey, 36, Math.PI * 0.68, Math.PI * 1.32); ctx.stroke();
        line(ctx, ex - R * 0.78, ey - 20, ex - R * 0.78, ey - 40, 'blue', 6); line(ctx, ex - R * 0.78, ey + 20, ex - R * 0.78, ey + 40, 'blue', 6);
        ctx.fillStyle = tint('cyan', 0.35); ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(ex - R * 0.64, ey, 11, 25, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = COLORS.red; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(ex, ey, R - 7, -1.05, 1.05); ctx.stroke();
        line(ctx, ex + R - 6, ey + 12, ex + R + 52, ey + 36, 'red', 9);
        // Light from a candle, focused upside-down on the retina.
        const ox = X0 + 60; dot(ctx, ox, ey - 40, 6, 'yellow', 8); line(ctx, ox, ey - 32, ox, ey + 34, 'orange', 6);
        ctx.save(); ctx.globalAlpha *= 0.6 + 0.4 * Math.sin(k * 4);
        ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(ox + 6, ey - 40); ctx.lineTo(ex - R * 0.64, ey - 14); ctx.lineTo(ex + R - 10, ey + 34);
        ctx.moveTo(ox + 6, ey + 34); ctx.lineTo(ex - R * 0.64, ey + 14); ctx.lineTo(ex + R - 10, ey - 38);
        ctx.stroke(); ctx.restore();
        label(ctx, 'lens', ex - R * 0.64, Y0 + 186, { size: 18, weight: 700, fill: 'cyan' });
        line(ctx, ex - R * 0.64, Y0 + 198, ex - R * 0.64, ey - 28, 'cyan', 1.5);
        label(ctx, 'retina', ex + 60, Y0 + 186, { size: 18, weight: 700, fill: 'red' });
        line(ctx, ex + 60, Y0 + 198, ex + 58, ey - 64, 'red', 1.5);
        label(ctx, 'an eye', ex, Y0 + 462, { size: 18, weight: 700, fill: 'ink' });
        // A telescope on its tripod.
        ctx.save(); ctx.translate(X0 + 625, Y0 + 300); ctx.rotate(-0.32);
        ctx.fillStyle = tint('blue', 0.25); ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 3;
        rounded(ctx, -120, -18, 240, 36, 6); ctx.fill(); ctx.stroke();
        rounded(ctx, 100, -24, 30, 48, 5); ctx.fill(); ctx.stroke();
        ctx.fillStyle = tint('cyan', 0.5); ctx.beginPath(); ctx.ellipse(130, 0, 6, 20, 0, 0, TAU); ctx.fill();
        ctx.restore();
        line(ctx, X0 + 625, Y0 + 310, X0 + 580, Y0 + 430, 'muted', 4); line(ctx, X0 + 625, Y0 + 310, X0 + 670, Y0 + 430, 'muted', 4); line(ctx, X0 + 625, Y0 + 310, X0 + 625, Y0 + 430, 'muted', 4);
        label(ctx, 'a telescope', X0 + 625, Y0 + 462, { size: 18, weight: 700, fill: 'blue' });
        show(ctx, after(S.s, 1.5), () => {
          label(ctx, '≈', X0 + 452, Y0 + 300, { size: 44, weight: 800, fill: 'yellow' });
          chip(ctx, 'Paley: an eye is built like a telescope', cx, Y0 + 104, 'cyan', 20);
        });
      } else if (S.i === 2) {
        // Darwin: eyes built in small steps, each useful.
        const xs = [X0 + 100, X0 + 250, X0 + 400, X0 + 550, X0 + 700]; const yy = Y0 + 268; const H = [0, 0.75, 1.5, 2.65, 2.65];
        const NAMES = ['light patch', 'cup', 'deeper cup', 'pinhole', 'lens eye'];
        const hi = Math.floor(mod(k * 1.1, 5));
        xs.forEach((x, j) => {
          const on = after(S.s, 0.3 + j * 0.45);
          show(ctx, on, () => {
            if (j === hi) glow(ctx, COLORS.green, 10);
            ctx.lineCap = 'round';
            if (H[j] === 0) {
              line(ctx, x, yy - 42, x, yy + 42, 'ink', 5); line(ctx, x - 6, yy - 34, x - 6, yy + 34, 'red', 4);
            } else {
              const r = j === 1 ? 58 : 46; const ox = x + (j === 1 ? 26 : 8);
              if (j >= 3) { ctx.fillStyle = tint('cyan', 0.12); ctx.beginPath(); ctx.arc(ox, yy, r, 0, TAU); ctx.fill(); }
              ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(ox, yy, r, -H[j], H[j]); ctx.stroke();
              ctx.strokeStyle = COLORS.red; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ox, yy, r - 6, -H[j] + 0.08, H[j] - 0.08); ctx.stroke();
              if (j === 4) { ctx.fillStyle = tint('cyan', 0.5); ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(ox - r + 4, yy, 8, 16, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
            }
            ctx.shadowBlur = 0;
            label(ctx, NAMES[j], x, Y0 + 344, { size: 18, weight: 700, fill: j === hi ? 'green' : 'ink' });
          });
        });
        show(ctx, after(S.s, 2.6), () => {
          arr(ctx, X0 + 60, Y0 + 386, X1 - 50, Y0 + 386, 'green', 5);
          label(ctx, 'many small steps, each one useful', cx, Y0 + 416, { size: 19, weight: 700, fill: 'green' });
        });
        show(ctx, after(S.s, 0.8), () => chip(ctx, 'Darwin: natural selection, no designer needed', cx, Y0 + 104, 'green', 20));
        show(ctx, after(S.s, 3.6), () => chip(ctx, 'Hume, earlier: is the world really like a machine?', cx, Y0 + 486, 'purple', 18));
      } else {
        // Fine-tuning: a dial with a tiny life-permitting band.
        const DX = cx; const DY = Y0 + 420; const R = 230;
        ctx.lineCap = 'butt';
        ctx.strokeStyle = 'rgba(147,160,196,0.25)'; ctx.lineWidth = 28; ctx.beginPath(); ctx.arc(DX, DY, R, Math.PI, TAU); ctx.stroke();
        const b0 = Math.PI * 1.555; const b1 = Math.PI * 1.585;
        glow(ctx, COLORS.green, 10); ctx.strokeStyle = COLORS.green; ctx.beginPath(); ctx.arc(DX, DY, R, b0, b1); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(220,230,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath();
        for (let j = 0; j <= 20; j++) { const a = Math.PI + (j / 20) * Math.PI; ctx.moveTo(DX + Math.cos(a) * (R - 22), DY + Math.sin(a) * (R - 22)); ctx.lineTo(DX + Math.cos(a) * (R - 34), DY + Math.sin(a) * (R - 34)); }
        ctx.stroke();
        const na = lerp(Math.PI * 1.1, (b0 + b1) / 2, smooth(S.s / 2)) + Math.sin(k * 3) * 0.008;
        line(ctx, DX, DY, DX + Math.cos(na) * (R - 30), DY + Math.sin(na) * (R - 30), 'yellow', 5); dot(ctx, DX, DY, 10, 'yellow');
        const la = (b0 + b1) / 2;
        label(ctx, 'life possible', DX + Math.cos(la) * (R + 34), DY + Math.sin(la) * (R + 34), { size: 18, weight: 800, fill: 'green' });
        label(ctx, 'a constant of physics', DX, DY + 30, { size: 18, weight: 600, fill: 'muted' });
        label(ctx, 'too weak', DX - R + 10, DY + 30, { size: 18, weight: 600, fill: 'muted' });
        label(ctx, 'too strong', DX + R - 10, DY + 30, { size: 18, weight: 600, fill: 'muted' });
        show(ctx, after(S.s, 2.2), () => {
          chip(ctx, 'a designer?', X0 + 130, Y0 + 500, 'yellow', 19);
          chip(ctx, 'many universes?', X0 + 372, Y0 + 500, 'cyan', 19);
          chip(ctx, 'observer selection?', X0 + 638, Y0 + 500, 'purple', 19);
        });
      }
      const CAP = [
        ["Paley's watch", 'Find a stone on a heath and it could have lain there for ever. Find a watch, and its parts working together point to a watchmaker.', 'yellow'],
        ['The eye as a watch', 'Paley: living things are even more intricate. An eye is built like a telescope, so it too must have had a designer.', 'cyan'],
        ['Natural selection', 'Darwin showed how eyes can arise in small useful steps, with no designer needed. Earlier, Hume had questioned the analogy itself.', 'green'],
        ['Fine-tuning today', 'Some constants of physics seem set just right for life. A designer? Many universes? Or could we only ever observe a life-friendly one?', 'purple'],
      ][S.i];
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= S.lf;
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, "Paley 1802 · Hume's Dialogues 1779 · Darwin's Origin of Species 1859");
      ctx.restore();
    },

    // The inconsistent triad, Epicurus' riddle, the free-will and
    // soul-making theodicies, and their objections.
    'problem-of-evil'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5, 5, 5.5, 5.5, 5.5]);
      const P = [X0 + 215, Y0 + 128]; const G = [X0 + 72, Y0 + 388]; const E = [X0 + 358, Y0 + 388];
      const sa = after(S.s, 0, 0.5);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The problem of evil');
      ctx.save(); ctx.globalAlpha *= S.lf;
      // The triad.
      const draw0 = S.i === 0 ? smooth(S.s / 1.6) : 1;
      const EDGES = [[P, G], [G, E], [E, P]];
      EDGES.forEach(([a, c], j) => {
        const hot = S.i === 1 && Math.floor(mod(k * 1.4, 3)) === j;
        ctx.strokeStyle = hot ? COLORS.red : 'rgba(200,215,255,0.7)'; ctx.lineWidth = hot ? 6 : 4;
        const q = clamp(draw0 * 3 - j);
        if (q > 0) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(lerp(a[0], c[0], q), lerp(a[1], c[1], q)); ctx.stroke(); }
      });
      const vtx = (p, c, txt, ly) => { glow(ctx, color(c), 8); dot(ctx, p[0], p[1], 11, c); ctx.shadowBlur = 0; label(ctx, txt, p[0], ly, { size: 20, weight: 800, fill: c }); };
      vtx(P, 'yellow', 'all-powerful', Y0 + 98); vtx(G, 'teal', 'all-good', Y0 + 420); vtx(E, 'red', 'evil exists', Y0 + 420);
      const note = [null, ['pick any two?', 'red'], ['evil: from free choices', 'orange'], ['evil: a means to growth', 'green'], ['logical or evidential?', 'purple']][S.i];
      if (note) show(ctx, after(S.s, 1.2), () => chip(ctx, note[0], X0 + 215, Y0 + 494, note[1], 19));
      label(ctx, '?', X0 + 215, Y0 + 302, { size: 44 + (S.i === 1 ? 6 * Math.sin(k * 5) : 0), weight: 800, fill: S.i === 1 ? 'red' : 'muted' });
      // The right-hand side changes with the stage.
      ctx.save(); ctx.globalAlpha *= sa;
      panel(ctx, X0 + 410, Y0 + 62, 374, 490, ['blue', 'red', 'orange', 'green', 'purple'][S.i], 0.06, 16);
      const RX = X0 + 597;
      if (S.i <= 1) {
        label(ctx, 'A riddle credited to Epicurus', RX, Y0 + 92, { size: 18, weight: 700, fill: 'muted' });
        const LINES = [['Willing to stop evil, but not able?', 'Then not all-powerful.', 'yellow'], ['Able, but not willing?', 'Then not all-good.', 'teal'], ['Both able and willing?', 'Then why is there evil?', 'red']];
        LINES.forEach(([q, a, c], j) => {
          const on = S.i === 0 ? after(S.s, 1 + j * 1.1) : 1;
          show(ctx, on, () => {
            label(ctx, q, RX, Y0 + 152 + j * 110, { size: 18, weight: 600, fill: 'ink' });
            label(ctx, a, RX, Y0 + 182 + j * 110, { size: 19, weight: 800, fill: c });
          });
        });
        show(ctx, S.i === 1 ? after(S.s, 1.2) : 0, () => chip(ctx, 'Can all three be true?', RX, Y0 + 500, 'red', 20));
      } else if (S.i === 2) {
        label(ctx, 'Free-will theodicy', RX, Y0 + 96, { size: 21, weight: 800, fill: 'orange' });
        label(ctx, 'Augustine', RX, Y0 + 124, { size: 18, weight: 600, fill: 'muted' });
        person(ctx, RX, Y0 + 388, 92, 'ink', { face: 1, arms: 'wide' });
        const sw = 0.5 + 0.5 * Math.sin(k * 2);
        arr(ctx, RX - 22, Y0 + 300, X0 + 500, Y0 + 246, tint('green', 0.6 + 0.4 * sw), 4);
        arr(ctx, RX + 22, Y0 + 300, X0 + 694, Y0 + 246, tint('red', 0.6 + 0.4 * (1 - sw)), 4);
        label(ctx, 'kindness', X0 + 490, Y0 + 224, { size: 18, weight: 800, fill: 'green' });
        label(ctx, 'cruelty', X0 + 704, Y0 + 224, { size: 18, weight: 800, fill: 'red' });
        label(ctx, 'a real, free choice', RX, Y0 + 414, { size: 18, weight: 600, fill: 'ink' });
        show(ctx, after(S.s, 2.6), () => chip(ctx, 'But earthquakes? Disease?', RX, Y0 + 488, 'red', 19));
      } else if (S.i === 3) {
        label(ctx, 'Soul-making theodicy', RX, Y0 + 96, { size: 21, weight: 800, fill: 'green' });
        label(ctx, 'Irenaeus; later John Hick', RX, Y0 + 124, { size: 18, weight: 600, fill: 'muted' });
        const g = smooth(S.s / 3);
        ctx.strokeStyle = tint('muted', 0.5); ctx.lineWidth = 2; ctx.beginPath();
        for (let j = 0; j < 14; j++) { const x = X0 + 450 + rnd(j) * 300; const y = Y0 + 160 + mod(k * 160 + rnd(j + 9) * 260, 260); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 12); }
        ctx.stroke();
        ctx.fillStyle = tint('orange', 0.6); ctx.fillRect(RX - 6, Y0 + 420 - 140 * g, 12, 140 * g);
        ctx.fillStyle = tint('green', 0.5); ctx.strokeStyle = COLORS.green; ctx.lineWidth = 2;
        for (const [dx, dy, r] of [[0, -150, 46], [-34, -126, 34], [34, -126, 34]]) { ctx.beginPath(); ctx.arc(RX + dx * g, Y0 + 420 + dy * g, Math.max(4, r * g), 0, TAU); ctx.fill(); ctx.stroke(); }
        line(ctx, X0 + 470, Y0 + 420, X0 + 724, Y0 + 420, tint('green', 0.6), 3);
        show(ctx, after(S.s, 2.2), () => {
          label(ctx, 'courage', X0 + 472, Y0 + 262, { size: 18, weight: 800, fill: 'green' });
          label(ctx, 'compassion', X0 + 726, Y0 + 262, { size: 18, weight: 800, fill: 'green' });
        });
        show(ctx, after(S.s, 3), () => chip(ctx, 'Why so much? Even for animals?', RX, Y0 + 488, 'red', 19));
      } else {
        label(ctx, 'Still debated', RX, Y0 + 96, { size: 21, weight: 800, fill: 'purple' });
        const BOX = [['Logical problem: do the three claims contradict? Plantinga argued they need not.', 'red'], ['Evidential problem: does so much suffering make God unlikely? (William Rowe)', 'orange'], ['Replies: free will, soul-making, and the limits of what humans can see.', 'teal']];
        BOX.forEach(([txt, c], j) => show(ctx, after(S.s, 0.4 + j * 0.7), () => {
          panel(ctx, X0 + 428, Y0 + 128 + j * 136, 338, 120, c, 0.1, 12);
          para(ctx, txt, X0 + 442, Y0 + 188 + j * 136, 310, 18, 'ink', 600, 4);
        }));
      }
      ctx.restore();
      const CAP = [
        ['The inconsistent triad', 'Many faiths hold that God is all-powerful and all-good. Yet evil and suffering exist. Can all three be true together?', 'cyan'],
        ['The tension', 'An all-good God would want to prevent evil, and an all-powerful one could. So why is there evil? Epicurus asked; Hume asked again.', 'red'],
        ['Free-will theodicy', 'Augustine: evil comes from misused free will, and real love needs real freedom. Objection: what of earthquakes and disease?', 'orange'],
        ['Soul-making theodicy', 'Irenaeus (and John Hick): hardship lets souls grow courage and compassion. Objection: why so much suffering, even for animals?', 'green'],
        ['An open question', 'Philosophers still debate whether evil disproves God, makes God less likely, or fits a bigger picture. Thoughtful people disagree.', 'purple'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Epicurus (as reported) · Augustine · Irenaeus · Hume · Mackie · Hick');
      ctx.restore();
    },

    // The 2 × 2 wager grid, the expected-value argument, and the objections.
    'pascals-wager'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5.5, 5.5, 5.5, 5.5]);
      const CX0 = [X0 + 200, X0 + 500]; const CW = 290; const RY = [Y0 + 150, Y0 + 300]; const RH = 140;
      const CELLS = [
        [['∞ gain', 'an infinite reward', 'yellow'], ['small loss', 'some time and pleasures', 'orange']],
        [['∞ loss', 'an infinite loss', 'red'], ['small gain', 'a little more freedom', 'teal']],
      ];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || "Pascal's wager");
      ctx.save(); ctx.globalAlpha *= S.lf;
      ['God exists', 'God does not exist'].forEach((h, c) => {
        panel(ctx, CX0[c], Y0 + 84, CW, 56, 'blue', 0.12, 12);
        label(ctx, h, CX0[c] + CW / 2, Y0 + 112, { size: 20, weight: 800, fill: 'ink' });
      });
      ['Believe', "Don't believe"].forEach((h, r) => {
        const hot = S.i === 1 && r === 0;
        panel(ctx, X0 + 18, RY[r], 172, RH, hot ? 'yellow' : 'blue', hot ? 0.16 : 0.08, 12);
        label(ctx, h, X0 + 104, RY[r] + RH / 2, { size: 20, weight: 800, fill: hot ? 'yellow' : 'ink' });
      });
      CELLS.forEach((row, r) => row.forEach(([big, small, c], col) => {
        const on = S.i === 0 ? after(S.s, 0.6 + (r * 2 + col) * 0.7) : 1;
        show(ctx, on, () => {
          const x = CX0[col]; const y = RY[r];
          const hot = S.i === 1 && r === 0 && col === 0;
          if (hot) glow(ctx, COLORS.yellow, 12 + 6 * Math.sin(k * 4));
          panel(ctx, x, y, CW, RH, c, hot ? 0.2 : 0.09, 12); ctx.shadowBlur = 0;
          label(ctx, big, x + CW / 2, y + 56, { size: big.startsWith('∞') ? 34 : 26, weight: 800, fill: c });
          label(ctx, small, x + CW / 2, y + 102, { size: 18, weight: 500, fill: 'ink' });
        });
      }));
      if (S.i === 1) {
        show(ctx, after(S.s, 1), () => rich(ctx, [['any chance  ×  ', 'ink'], ['∞', 'yellow'], ['  outweighs any finite gain', 'ink']], cx, Y0 + 482, 22, 700));
        show(ctx, after(S.s, 2.4), () => chip(ctx, 'Pascal: so wager that God exists', cx, Y0 + 532, 'yellow', 20));
      } else if (S.i === 2) {
        show(ctx, after(S.s, 0.6), () => {
          chip(ctx, "Faith A's God", X0 + 130, Y0 + 486, 'orange', 19);
          chip(ctx, "Faith B's God", X0 + 334, Y0 + 486, 'orange', 19);
          chip(ctx, 'a god who rewards doubt', X0 + 610, Y0 + 486, 'purple', 19);
        });
        show(ctx, after(S.s, 1.8), () => label(ctx, 'Which column is the real one?', cx, Y0 + 536, { size: 19, weight: 700, fill: 'orange' }));
      } else if (S.i === 3) {
        show(ctx, after(S.s, 0.6), () => {
          chip(ctx, 'Can you choose to believe?', X0 + 186, Y0 + 486, 'purple', 19);
          chip(ctx, 'Pascal: act as if; belief may follow', X0 + 574, Y0 + 486, 'teal', 19);
        });
        show(ctx, after(S.s, 2), () => label(ctx, 'And would God reward a calculated bet?', cx, Y0 + 536, { size: 19, weight: 600, fill: 'muted' }));
      }
      const CAP = [
        ["Pascal's wager", 'We cannot prove whether God exists, said Pascal, but we must bet with our lives either way. So compare what each bet risks.', 'cyan'],
        ['The expected value', 'If God exists, belief wins an infinite reward. Any chance at all, times infinity, beats any finite gain: so, Pascal argued, believe.', 'yellow'],
        ['Objection: many gods', 'Which God? Religions offer different gods and rewards, and an imagined god might even reward honest doubt. The grid needs many columns.', 'orange'],
        ['Objection: forced belief', 'Can you believe just by deciding to? Pascal said: act as if, and belief may follow. Critics ask whether a calculated bet is real faith.', 'purple'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Blaise Pascal, Pensées (published 1670)');
      ctx.restore();
    },

    // ─── Logic and method ────────────────────────────────────────────────

    // Two explanations: the razor shaves away the one with needless
    // assumptions, until new evidence earns them back.
    'occams-razor'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5, 5.5, 6]);
      const BY = (i) => Y0 + 232 + i * 62;
      const BL = ['A thief broke in', 'ate only the cake', 'left no trace', 'put icing on the dog'];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || "Ockham's razor");
      ctx.save(); ctx.globalAlpha *= S.lf;
      panel(ctx, X0 + 100, Y0 + 62, FIG.w - 200, 86, 'blue', 0.1, 14);
      label(ctx, 'The cake is gone.', cx + 30, Y0 + 90, { size: 22, weight: 800, fill: 'ink' });
      label(ctx, 'The dog has icing on its nose.', cx + 30, Y0 + 122, { size: 19, weight: 600, fill: 'muted' });
      // A dog's head with a dab of icing.
      const dogHead = (x, y, s) => {
        ctx.fillStyle = tint('orange', 0.45); ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(x, y, 20 * s, 17 * s, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x + 20 * s, y + 5 * s, 12 * s, 8 * s, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x - 12 * s, y - 4 * s, 7 * s, 15 * s, 0.4, 0, TAU); ctx.fillStyle = tint('orange', 0.75); ctx.fill();
        dot(ctx, x + 31 * s, y + 3 * s, 4 * s, 'ink'); dot(ctx, x + 6 * s, y - 5 * s, 3 * s, 'ink');
        dot(ctx, x + 27 * s, y - 4 * s, 5 * s, '#ffffff');
      };
      dogHead(X0 + 150, Y0 + 104, 1);
      label(ctx, 'Explanation A', X0 + 200, Y0 + 182, { size: 21, weight: 800, fill: 'cyan' });
      label(ctx, '1 assumption', X0 + 200, Y0 + 208, { size: 18, weight: 600, fill: 'muted' });
      label(ctx, 'Explanation B', X0 + 600, Y0 + 182, { size: 21, weight: 800, fill: 'orange' });
      label(ctx, '4 assumptions', X0 + 600, Y0 + 208, { size: 18, weight: 600, fill: 'muted' });
      const win = S.i === 1 ? after(S.s, 3.7) : 0;
      const doubt = S.i === 2 ? after(S.s, 1.6) : 0;
      if (win > 0) glow(ctx, COLORS.yellow, 12 * win);
      panel(ctx, X0 + 30, BY(0), 340, 50, 'cyan', 0.12 + 0.12 * win, 12); ctx.shadowBlur = 0;
      label(ctx, 'The dog ate the cake.', X0 + 200, BY(0) + 26, { size: 19, weight: 700, fill: 'ink' });
      if (win > 0) { ctx.save(); ctx.globalAlpha *= win; tick(ctx, X0 + 345, BY(0) + 25, 10, 'green', 4); ctx.restore(); }
      // A dog with a guilty nose, under A.
      ctx.save(); ctx.translate(X0 + 200, Y0 + 430);
      ctx.fillStyle = tint('orange', 0.4); ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(0, 0, 54, 24, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath();
      for (const lx of [-36, -20, 22, 38]) { ctx.moveTo(lx, 16); ctx.lineTo(lx, 50); }
      const wag = Math.sin(k * 10) * 0.5; ctx.moveTo(-52, -6); ctx.lineTo(-52 - Math.cos(wag) * 26, -6 - 20 - Math.sin(wag) * 8); ctx.stroke();
      ctx.restore();
      dogHead(X0 + 262, Y0 + 396, 1.25);
      // B's blocks: shaved by the razor, then earned back.
      const rz = S.i === 1 ? lerp(Y0 + 205, Y0 + 500, smooth((S.s - 0.4) / 3)) : -1;
      BL.forEach((txt, i) => {
        const yb = BY(i); const cutAt = 0.4 + ((yb + 25 - (Y0 + 205)) / 295) * 3;
        let q = 0;
        if (S.i === 1) q = clamp((S.s - cutAt) / 0.8);
        let back = 0;
        if (S.i === 2) back = after(S.s, 1.4 + i * 0.25, 0.6);
        const gone = S.i === 1 ? q : S.i === 2 ? 1 - back : 0;
        show(ctx, 1 - gone * 0.92, () => {
          ctx.save(); ctx.translate(X0 + 600 + gone * 18, yb + 25 + gone * gone * 50); ctx.rotate(gone * 0.12);
          panel(ctx, -170, -25, 340, 50, S.i === 2 ? 'green' : 'orange', 0.12, 12);
          label(ctx, txt, 0, 1, { size: 19, weight: 700, fill: 'ink' });
          ctx.restore();
        });
      });
      if (rz > 0 && S.s < 3.9) {
        ctx.save(); ctx.globalAlpha *= 1 - after(S.s, 3.4, 0.4); ctx.translate(X0 + 790, rz); ctx.rotate(-0.12);
        ctx.fillStyle = 'rgba(225,232,255,0.95)'; ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 2;
        poly(ctx, [-390, -6, 0, -14, 0, 10, -390, 4], true); ctx.fill(); ctx.stroke();
        ctx.fillStyle = tint('purple', 0.8); rounded(ctx, 0, -12, 40, 22, 6); ctx.fill();
        ctx.restore();
      }
      show(ctx, win, () => chip(ctx, 'Prefer A: fewest assumptions', cx, Y0 + 530, 'yellow', 20));
      show(ctx, S.i === 2 ? after(S.s, 0.5) : 0, () => chip(ctx, 'New evidence: a broken window, boot prints!', cx, Y0 + 530, 'orange', 19));
      show(ctx, doubt, () => label(ctx, '?', X0 + 350, BY(0) + 26, { size: 26, weight: 800, fill: 'orange' }));
      const CAP = [
        ['Two explanations', 'Both stories fit the facts. But A needs one assumption, while B needs four, with no evidence for any of them.', 'cyan'],
        ["Ockham's razor", 'Shave away assumptions you do not need: when explanations fit the facts equally well, prefer the one that assumes least.', 'yellow'],
        ['A rule of thumb, not a proof', 'The simplest story can be wrong. If new evidence turns up, like a broken window and boot prints, the extra assumptions earn their place.', 'orange'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, "William of Ockham (c. 1287–1347): don't multiply entities needlessly");
      ctx.restore();
    },

    // ─── Mind and machines ───────────────────────────────────────────────

    // Your world, or a brain in a vat fed the same signals? Then the replies.
    'brain-in-vat'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5, 5.5, 5, 6]);
      const JX = X0 + 545;
      // A tiny park scene (sun, tree, grass) in a box, used twice.
      const park = (x, y, w, h, sc) => {
        const g = ctx.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, tint('blue', 0.32)); g.addColorStop(1, tint('cyan', 0.1));
        ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = tint('green', 0.3); ctx.fillRect(x, y + h * 0.8, w, h * 0.2);
        dot(ctx, x + w * 0.8, y + h * 0.2, 14 * sc, 'yellow');
        tree(ctx, x + w * 0.22, y + h * 0.82, 120 * sc);
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The brain in a vat');
      ctx.save(); ctx.globalAlpha *= S.lf;
      // What you experience.
      ctx.save(); ctx.translate(0, 22);
      ctx.save(); rounded(ctx, X0 + 20, Y0 + 66, 350, 334, 16); ctx.clip();
      park(X0 + 20, Y0 + 66, 350, 334, 1.6);
      const bx = X0 + 110 + mod(k * 40, 300); const byy = Y0 + 140 + Math.sin(k * 2) * 8;
      ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(bx - 10, byy - 5); ctx.quadraticCurveTo(bx - 5, byy - 9 + Math.sin(k * 9) * 3, bx, byy); ctx.quadraticCurveTo(bx + 5, byy - 9 + Math.sin(k * 9) * 3, bx + 10, byy - 5); ctx.stroke();
      person(ctx, X0 + 230, Y0 + 336, 86, 'cyan', { face: 1, walk: k * 4 });
      ctx.restore();
      ctx.strokeStyle = tint('cyan', 0.6); ctx.lineWidth = 2; rounded(ctx, X0 + 20, Y0 + 66, 350, 334, 16); ctx.stroke();
      label(ctx, 'what you experience', X0 + 195, Y0 + 378, { size: 18, weight: 700, fill: 'ink' });
      // The vat, the brain, the computer.
      show(ctx, S.i === 0 ? 0.15 : S.i === 1 ? 0.15 + 0.85 * after(S.s, 0.2, 0.8) : 1, () => {
        ctx.fillStyle = tint('teal', 0.14); ctx.strokeStyle = 'rgba(200,230,255,0.7)'; ctx.lineWidth = 3;
        rounded(ctx, JX - 75, Y0 + 150, 150, 230, 18); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(147,160,196,0.6)'; ctx.fillRect(JX - 84, Y0 + 138, 168, 16);
        for (let j = 0; j < 7; j++) { const y = Y0 + 370 - mod(k * 40 + j * 31, 210); ring(ctx, JX - 55 + rnd(j) * 110, y, 3 + rnd(j + 3) * 3, tint('ink', 0.5), 1.5); }
        brain(ctx, JX, Y0 + 250, 104, 72, 'red');
        const PX = X0 + 690; const PY = Y0 + 286;
        ctx.fillStyle = 'rgba(12,16,34,0.95)'; ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 3;
        rounded(ctx, PX, PY, 100, 70, 8); ctx.fill(); ctx.stroke();
        ctx.save(); ctx.beginPath(); ctx.rect(PX + 6, PY + 6, 88, 58); ctx.clip(); park(PX + 6, PY + 6, 88, 58, 0.4); ctx.restore();
        ctx.fillStyle = COLORS.blue; ctx.fillRect(PX + 44, PY + 70, 12, 16); ctx.fillRect(PX + 26, PY + 86, 48, 6);
        // Wires with signals running to the brain.
        const wires = [[JX - 20, -16], [JX, 0], [JX + 20, 16]];
        wires.forEach(([wx, d], j) => {
          const p0 = [PX, PY + 50 + d * 0.6]; const c1 = [PX - 60, PY + 120]; const c2 = [wx, Y0 + 430]; const p3 = [wx, Y0 + 300];
          ctx.strokeStyle = tint(HUES[j + 1], 0.8); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], p3[0], p3[1]); ctx.stroke();
          const q = mod(k * 0.7 + j * 0.3, 1); const u = 1 - q;
          const px = u ** 3 * p0[0] + 3 * u * u * q * c1[0] + 3 * u * q * q * c2[0] + q ** 3 * p3[0];
          const py = u ** 3 * p0[1] + 3 * u * u * q * c1[1] + 3 * u * q * q * c2[1] + q ** 3 * p3[1];
          if (S.i >= 1) dot(ctx, px, py, 5, 'yellow', 6);
        });
        label(ctx, 'brain in a vat', JX, Y0 + 412, { size: 18, weight: 700, fill: 'red' });
        label(ctx, 'computer', PX + 50, Y0 + 266, { size: 18, weight: 700, fill: 'blue' });
      });
      show(ctx, S.i >= 2 ? (S.i === 2 ? after(S.s, 0.4) : 0.5) : 0, () => {
        label(ctx, '=', X0 + 420, Y0 + 232, { size: 54, weight: 800, fill: 'orange' });
        label(ctx, '?', X0 + 420, Y0 + 284, { size: 34, weight: 800, fill: 'orange' });
      });
      ctx.restore();
      show(ctx, S.i === 2 ? after(S.s, 1.2) : 0, () => chip(ctx, 'Same signals, same experience?', cx, Y0 + 490, 'orange', 20));
      show(ctx, S.i === 3 ? after(S.s, 0.5) : 0, () => {
        chip(ctx, "Putnam: a vat-brain couldn't even mean a real vat", cx, Y0 + 482, 'teal', 19);
        show(ctx, after(S.s, 1.8), () => chip(ctx, 'Others: a real world is the best explanation', cx, Y0 + 532, 'blue', 19));
      });
      const CAP = [
        ['Your world', 'You see trees, feel the sun, hear birds. All of it reaches you as signals travelling from your senses to your brain.', 'cyan'],
        ['Or a brain in a vat?', 'Imagine a scientist keeps a brain alive in a vat and feeds it exactly those signals from a computer. It would seem just the same.', 'red'],
        ['How could you tell?', 'Any test you try, pinching yourself or looking in a mirror, would arrive as more signals. Can you know you are not that brain?', 'orange'],
        ['Replies', 'Putnam: a vat-brain could not even refer to real vats, so the claim undermines itself. Others: a real world is the best explanation.', 'teal'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, "Descartes's evil demon (1641) · Putnam, Reason, Truth and History (1981)");
      ctx.restore();
    },

    // "This sentence is false": true and false chasing each other for ever.
    'liar-paradox'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [4, 6, 5, 5.5]);
      const TX = X0 + 175; const FX = X0 + 625; const NY = Y0 + 350;
      const SENT = '"This sentence is false."';
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The liar paradox');
      ctx.save(); ctx.globalAlpha *= S.lf;
      const ph0 = S.i === 1 ? S.s / 3 + S.s * S.s * 0.06 : k / 2.6; const st0 = S.i > 0 && mod(ph0, 1) >= 0.5 ? 'red' : S.i > 0 ? 'green' : 'yellow';
      panel(ctx, cx - 300, Y0 + 96, 600, 104, st0, 0.08, 16);
      const n = S.i === 0 ? Math.floor(clamp((S.s - 0.3) / 1.8) * SENT.length) : SENT.length;
      label(ctx, SENT.slice(0, n), cx, Y0 + 148, { size: 34, weight: 800, fill: 'ink' });
      // Where we are in the loop: 0–0.5 top arc (TRUE to FALSE), 0.5–1 bottom.
      const ph = S.i === 1 ? S.s / 3 + S.s * S.s * 0.06 : k / 2.6;
      const u = mod(ph, 1); const loop = S.i === 0 ? 0 : S.i === 1 ? after(S.s, 0, 0.6) : 1;
      const state = u < 0.5 ? 'TRUE' : 'FALSE';
      show(ctx, loop, () => {
        const arc = (y0, cy0, c) => { ctx.strokeStyle = tint(c, 0.75); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(TX + 50, y0); ctx.quadraticCurveTo(cx, cy0, FX - 50, y0); ctx.stroke(); };
        arc(NY - 22, Y0 + 222, 'red'); arc(NY + 22, Y0 + 478, 'green');
        arr(ctx, FX - 100, NY - 52, FX - 54, NY - 26, 'red', 4); arr(ctx, TX + 100, NY + 52, TX + 54, NY + 26, 'green', 4);
        label(ctx, 'if it is true, then it is false', cx, Y0 + 260, { size: 18, weight: 700, fill: 'red' });
        label(ctx, 'if it is false, then it is true', cx, Y0 + 446, { size: 18, weight: 700, fill: 'green' });
        const top = u < 0.5; const q = top ? u / 0.5 : (u - 0.5) / 0.5;
        const p0 = top ? [TX + 50, NY - 22] : [FX - 50, NY + 22]; const p2 = top ? [FX - 50, NY - 22] : [TX + 50, NY + 22]; const c1 = [cx, top ? Y0 + 222 : Y0 + 478];
        const w = 1 - q;
        dot(ctx, w * w * p0[0] + 2 * w * q * c1[0] + q * q * p2[0], w * w * p0[1] + 2 * w * q * c1[1] + q * q * p2[1], 9, 'yellow', 10);
      });
      const node = (x, txt, c, on) => {
        if (on) glow(ctx, color(c), 14);
        ctx.fillStyle = tint(c, on ? 0.3 : 0.1); ctx.strokeStyle = color(c); ctx.lineWidth = on ? 5 : 3;
        ctx.beginPath(); ctx.arc(x, NY, 56, 0, TAU); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
        label(ctx, txt, x, NY + 1, { size: 24, weight: 800, fill: c });
      };
      node(TX, 'TRUE', 'green', loop > 0 && state === 'TRUE'); node(FX, 'FALSE', 'red', loop > 0 && state === 'FALSE');
      show(ctx, loop, () => chip(ctx, `it is ${state}?`, cx, Y0 + 204, state === 'TRUE' ? 'green' : 'red', 18));
      show(ctx, S.i === 2 ? after(S.s, 0.6) : 0, () => {
        chip(ctx, 'Eubulides of Miletus, 4th century BCE', cx, Y0 + 494, 'orange', 19);
        show(ctx, after(S.s, 2), () => chip(ctx, 'A cousin: a Cretan says "all Cretans are liars"', cx, Y0 + 540, 'blue', 18));
      });
      show(ctx, S.i === 3 ? after(S.s, 0.6) : 0, () => {
        chip(ctx, 'neither true nor false (Kripke)', X0 + 214, Y0 + 494, 'cyan', 19);
        chip(ctx, 'both at once (Priest)', X0 + 610, Y0 + 494, 'purple', 19);
        show(ctx, after(S.s, 1.4), () => chip(ctx, 'separate levels of language (Tarski)', cx, Y0 + 540, 'teal', 19));
      });
      const CAP = [
        ['A strange sentence', 'Read it carefully. Is it true or false? Every ordinary statement is one or the other.', 'cyan'],
        ['The loop', 'If it is true, then what it says holds, so it is false. If it is false, then what it says fails, so it is true. Round and round.', 'yellow'],
        ['An ancient puzzle', 'The Greek logician Eubulides posed it in the 4th century BCE. A cousin: Epimenides the Cretan saying that all Cretans lie.', 'orange'],
        ['Ways out', 'Some say it is neither true nor false (Kripke), some that it is both (Priest); Tarski said a language cannot state its own truth.', 'purple'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Eubulides (4th c. BCE) · Tarski 1933 · Kripke 1975 · Priest 1979');
      ctx.restore();
    },

    // A heap of sand losing one grain at a time: when is it no longer a heap?
    'sorites-heap'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5, 6, 5, 5.5]);
      const HX = X0 + 245; const HB = Y0 + 430; const N0 = 420;
      const C = it._c || (it._c = (() => {
        const g = []; let i = 0;
        const hgt = (u, sc) => (Math.abs(u) >= sc ? 0 : sc * Math.cos((u * Math.PI) / (2 * sc)) ** 1.3);
        while (g.length < N0) {
          i++; const u = rnd(i) * 2 - 1; const v = rnd(i + 999);
          if (v >= hgt(u, 1)) continue;
          let lo = 0; let hi = 1;
          for (let it2 = 0; it2 < 18; it2++) { const mid = (lo + hi) / 2; if (v < hgt(u, mid)) hi = mid; else lo = mid; }
          g.push({ x: HX + u * 190, y: HB - 6 - v * 196, c: rnd(i + 77), key: hi });
        }
        g.sort((a, c) => a.key - c.key);
        return g;
      })());
      const f = S.i === 1 ? smooth(clamp((S.s - 0.3) / 5)) : S.i >= 2 ? 1 : 0;
      const Nf = Math.max(1, N0 * (1 - f) ** 1.4);
      const vis = Math.max(1, Math.floor(Nf));
      const count = S.i === 0 ? 10000 : Math.max(1, Math.round(10000 * (1 - f) ** 2.6));
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The paradox of the heap');
      ctx.save(); ctx.globalAlpha *= S.lf;
      line(ctx, X0 + 30, HB, X0 + 460, HB, 'rgba(200,215,255,0.4)', 3);
      for (const tone of [0, 1]) {
        ctx.fillStyle = tone ? tint('yellow', 0.85) : tint('orange', 0.85); ctx.beginPath();
        for (let j = 0; j < vis; j++) { const g = C[j]; if ((g.c < 0.5) !== !tone) continue; ctx.moveTo(g.x + 4.5, g.y); ctx.arc(g.x, g.y, 4.5, 0, TAU); }
        ctx.fill();
      }
      if (S.i === 1 && vis < N0 && vis > 1) {
        const g = C[vis]; const q = 1 - (Nf - vis);
        ctx.save(); ctx.globalAlpha *= 1 - q; dot(ctx, lerp(g.x, X0 + 470, q), g.y - Math.sin(q * Math.PI) * 60, 5, 'yellow'); ctx.restore();
      }
      const verdict = S.i === 0 ? ['a heap', 'green'] : count > 2000 ? ['still a heap', 'green'] : count > 40 ? ['still a heap?', 'yellow'] : ['a heap?!', 'red'];
      label(ctx, verdict[0], HX, HB + 26, { size: 20, weight: 800, fill: verdict[1] });
      // The counter.
      panel(ctx, X0 + 480, Y0 + 62, 300, 128, 'yellow', 0.07, 14);
      label(ctx, 'grains of sand', X0 + 630, Y0 + 88, { size: 18, weight: 600, fill: 'muted' });
      label(ctx, fmt(count), X0 + 630, Y0 + 140, { size: 44, weight: 800, fill: 'yellow' });
      // The argument, then the answers.
      if (S.i <= 2) {
        const ARG = [['1. 10,000 grains: a heap.', 'ink', 0, 0.6], ['2. One fewer: still a heap.', 'ink', 0, 2], ['3. Repeat, again and again…', 'ink', 1, 0.6], ['4. So 1 grain is a heap?!', 'red', 1, 4.2]];
        ARG.forEach(([txt, c, st, at0], j) => {
          const on = S.i > st ? 1 : S.i === st ? after(S.s, at0) : 0;
          show(ctx, on, () => label(ctx, txt, X0 + 490, Y0 + 236 + j * 44, { size: 19, weight: 700, fill: c, align: 'left' }));
        });
      } else {
        const ANS = [['A hidden sharp line (Williamson)', 'cyan'], ['Truth comes in degrees (fuzzy logic)', 'purple'], ['Vague words still work fine', 'teal']];
        ANS.forEach(([txt, c], j) => show(ctx, after(S.s, 0.4 + j * 0.7), () => {
          panel(ctx, X0 + 470, Y0 + 214 + j * 84, 314, 74, c, 0.1, 12);
          para(ctx, txt, X0 + 484, Y0 + 251 + j * 84, 286, 18, 'ink', 600, 2);
        }));
      }
      // Where is the line?
      show(ctx, S.i >= 2 ? (S.i === 2 ? after(S.s, 0.6) : 1) : 0, () => {
        const g = ctx.createLinearGradient(X0 + 80, 0, X1 - 80, 0);
        g.addColorStop(0, COLORS.orange); g.addColorStop(0.35, tint('orange', 0.8)); g.addColorStop(0.65, 'rgba(147,160,196,0.35)'); g.addColorStop(1, 'rgba(147,160,196,0.15)');
        ctx.fillStyle = g; rounded(ctx, X0 + 80, Y0 + 484, FIG.w - 160, 20, 10); ctx.fill();
        label(ctx, '?', cx + Math.sin(k * 1.5) * 60, Y0 + 494, { size: 24, weight: 800, fill: 'ink' });
        label(ctx, 'heap', X0 + 110, Y0 + 532, { size: 18, weight: 700, fill: 'orange' });
        label(ctx, 'borderline?', cx, Y0 + 532, { size: 18, weight: 700, fill: 'ink' });
        label(ctx, 'not a heap', X1 - 130, Y0 + 532, { size: 18, weight: 700, fill: 'muted' });
      });
      const CAP = [
        ['A heap of sand', '10,000 grains of sand clearly make a heap. And taking away a single grain can never turn a heap into a non-heap. Or can it?', 'cyan'],
        ['One grain at a time', 'Remove grains one by one. Each step seems too small to matter, yet in the end one grain is left. Is one grain a heap?', 'yellow'],
        ['Where is the line?', 'There seems to be no exact number where a heap stops being a heap, only a blurry middle. Many words work like this: tall, bald, old.', 'orange'],
        ['Answers', 'Some say a sharp line exists that we cannot know (Williamson); some that truth comes in degrees; some that vague words just work loosely.', 'purple'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Eubulides of Miletus, 4th century BCE: the sorites (heap) paradox');
      ctx.restore();
    },

    // A judge chatting by text with a hidden person and a hidden machine.
    'turing-test'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5, 6.5, 5, 6]);
      const COLA = [X0 + 24, X0 + 316]; const COLB = [X0 + 484, X1 - 24];
      const MSG = [
        { col: 2, me: true, txt: 'Breakfast today?', at: 0.3 },
        { col: 1, me: false, txt: 'Porridge with honey.', at: 1.0 },
        { col: 0, me: false, txt: 'Toast. Too much coffee.', at: 1.5 },
        { col: 2, me: true, txt: "What's 12 × 13?", at: 2.8 },
        { col: 1, me: false, txt: '156.', at: 3.1 },
        { col: 0, me: false, txt: 'Um… 156, I think?', at: 4.4 },
      ];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The Turing test');
      ctx.save(); ctx.globalAlpha *= S.lf;
      // The two hidden rooms.
      panel(ctx, X0 + 24, Y0 + 62, 292, 172, 'teal', 0.07, 14); panel(ctx, X0 + 484, Y0 + 62, 292, 172, 'purple', 0.07, 14);
      label(ctx, 'A', X0 + 48, Y0 + 88, { size: 24, weight: 800, fill: 'teal' }); label(ctx, 'B', X0 + 508, Y0 + 88, { size: 24, weight: 800, fill: 'purple' });
      person(ctx, X0 + 150, Y0 + 222, 84, 'teal', { sit: true, face: 1, arms: 'forward' });
      ctx.fillStyle = tint('orange', 0.4); ctx.fillRect(X0 + 178, Y0 + 168, 96, 8);
      ctx.fillStyle = 'rgba(12,16,34,0.95)'; ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 2; rounded(ctx, X0 + 214, Y0 + 120, 52, 40, 4); ctx.fill(); ctx.stroke();
      label(ctx, 'a person', X0 + 236, Y0 + 210, { size: 18, weight: 600, fill: 'teal' });
      ctx.fillStyle = tint('purple', 0.22); ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 2.5;
      rounded(ctx, X0 + 560, Y0 + 104, 60, 112, 6); ctx.fill(); ctx.stroke();
      for (let j = 0; j < 3; j++) dot(ctx, X0 + 576 + j * 14, Y0 + 124, 4, mod(k * 3 + j, 3) < 1.5 ? 'green' : tint('green', 0.3));
      ctx.strokeStyle = tint('purple', 0.6); ctx.lineWidth = 2; ctx.beginPath(); for (let j = 0; j < 5; j++) { ctx.moveTo(X0 + 570, Y0 + 146 + j * 12); ctx.lineTo(X0 + 610, Y0 + 146 + j * 12); } ctx.stroke();
      ctx.fillStyle = 'rgba(12,16,34,0.95)'; ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 2.5; rounded(ctx, X0 + 640, Y0 + 110, 110, 70, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = tint('green', 0.8);
      for (let j = 0; j < 4; j++) ctx.fillRect(X0 + 652, Y0 + 124 + j * 12, 30 + 50 * rnd(j + Math.floor(k * 2)), 5);
      label(ctx, 'a machine', X0 + 695, Y0 + 210, { size: 18, weight: 600, fill: 'purple' });
      // The wall: the judge sees only text.
      line(ctx, X0 + 20, Y0 + 258, X1 - 20, Y0 + 258, 'muted', 3, [10, 8]);
      chip(ctx, 'wall: the judge sees only text', cx, Y0 + 258, 'muted', 18);
      // The judge at a desk between two chat windows.
      person(ctx, cx, Y0 + 556, 118, 'yellow', { face: 1, arms: 'forward' });
      ctx.fillStyle = '#1b2140'; ctx.strokeStyle = tint('ink', 0.5); ctx.lineWidth = 2;
      rounded(ctx, cx - 64, Y0 + 508, 128, 48, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = tint('yellow', 0.5); ctx.fillRect(cx + 10, Y0 + 500, 44, 8);
      label(ctx, 'judge', cx, Y0 + 418, { size: 18, weight: 700, fill: 'yellow' });
      const cols = [COLA, COLB];
      cols.forEach(([x0, x1], j) => {
        panel(ctx, x0, Y0 + 290, x1 - x0, 262, j ? 'purple' : 'teal', 0.05, 14);
        label(ctx, j ? 'chat with B' : 'chat with A', (x0 + x1) / 2, Y0 + 312, { size: 18, weight: 700, fill: 'muted' });
      });
      const chatOn = S.i === 1 || S.i === 2;
      if (chatOn) {
        let rowA = 0; let rowB = 0;
        for (const m of MSG) {
          const on = S.i === 2 ? 1 : after(S.s, m.at, 0.3);
          const targets = m.col === 2 ? [0, 1] : [m.col];
          for (const c of targets) {
            const row = c === 0 ? rowA++ : rowB++;
            if (on <= 0) continue;
            const [x0, x1] = cols[c]; const y = Y0 + 350 + row * 46;
            ctx.save(); ctx.globalAlpha *= on;
            ctx.font = `600 18px ${FONT}`; const w = ctx.measureText(m.txt).width + 22;
            const bx = m.me ? x1 - 10 - w : x0 + 10;
            ctx.fillStyle = m.me ? tint('yellow', 0.2) : tint(c ? 'purple' : 'teal', 0.22);
            rounded(ctx, bx, y - 16, w, 32, 12); ctx.fill();
            label(ctx, m.txt, bx + w / 2, y + 1, { size: 18, weight: 600, fill: 'ink' });
            ctx.restore();
          }
        }
      }
      show(ctx, S.i === 2 ? after(S.s, 0.5) : 0, () => {
        chip(ctx, 'A or B?', cx, Y0 + 376, 'yellow', 20);
        show(ctx, after(S.s, 1.8), () => { ring(ctx, X0 + 520, Y0 + 488, 28, 'orange', 2.5); label(ctx, 'too fast?', X0 + 600, Y0 + 488, { size: 18, weight: 700, fill: 'orange', align: 'left' }); });
      });
      show(ctx, S.i === 3 ? after(S.s, 0.4) : 0, () => {
        label(ctx, 'Searle', (COLA[0] + COLA[1]) / 2, Y0 + 360, { size: 21, weight: 800, fill: 'purple' });
        para(ctx, 'Passing could be clever symbol-shuffling, with no understanding inside.', COLA[0] + 16, Y0 + 430, COLA[1] - COLA[0] - 32, 18, 'ink', 600, 4);
        show(ctx, after(S.s, 1.6), () => {
          label(ctx, 'Turing', (COLB[0] + COLB[1]) / 2, Y0 + 360, { size: 21, weight: 800, fill: 'teal' });
          para(ctx, 'We only know other people think from how they behave, too.', COLB[0] + 16, Y0 + 430, COLB[1] - COLB[0] - 32, 18, 'ink', 600, 4);
        });
      });
      const CAP = [
        ['The imitation game', 'A judge types questions to two hidden players, A and B. One is a person, the other a machine. The judge sees only their replies.', 'cyan'],
        ['The conversation', 'Both answer every question. A machine might give itself away, or it might answer just like a person, hesitations and all.', 'blue'],
        ['Can the judge tell?', 'Turing proposed: if judges cannot reliably tell the machine from the person, we should be willing to say the machine thinks.', 'yellow'],
        ['Objections and replies', 'Searle: a program could pass by shuffling symbols without understanding. Turing: we only ever judge other minds by how they behave.', 'purple'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Alan Turing, "Computing Machinery and Intelligence" (1950)');
      ctx.restore();
    },

    // ─── Society and the good life ───────────────────────────────────────

    // Thesis meets antithesis; a synthesis keeps what was true in both and
    // becomes the next thesis.
    'hegel-dialectic'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [4, 4.5, 5, 6, 5.5]);
      const T1 = [X0 + 190, Y0 + 430]; const A1 = [X0 + 610, Y0 + 430]; const S1 = [cx, Y0 + 300];
      const T2 = [X0 + 190, Y0 + 300]; const A2 = [X0 + 610, Y0 + 300]; const S2 = [cx, Y0 + 165];
      const idea = (p, c, txt, sc = 1, a = 1, dash = false) => {
        if (sc <= 0.01 || a <= 0.01) return;
        ctx.save(); ctx.globalAlpha *= a;
        ctx.fillStyle = tint(c, dash ? 0.05 : 0.2); ctx.strokeStyle = color(c); ctx.lineWidth = 3;
        if (dash) ctx.setLineDash([6, 6]);
        ctx.beginPath(); ctx.arc(p[0], p[1], 52 * sc, 0, TAU); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
        if (txt && sc > 0.6) label(ctx, txt, p[0], p[1] + 1, { size: 20, weight: 800, fill: c });
        ctx.restore();
      };
      const zap = (a, c, on) => {
        if (on <= 0) return;
        ctx.save(); ctx.globalAlpha *= on; ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 3; ctx.beginPath();
        const n = 10; for (let j = 0; j <= n; j++) { const x = lerp(a[0] + 58, c[0] - 58, j / n); const y = a[1] + (j % 2 ? -1 : 1) * (j && j < n ? 10 + 6 * Math.sin(k * 20 + j) : 0); if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.stroke(); ctx.restore();
      };
      const pos = (a, c, q) => [lerp(a[0], c[0], q), lerp(a[1], c[1], q)];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || "Hegel's dialectic");
      ctx.save(); ctx.globalAlpha *= S.lf;
      const i = S.i; const s = S.s;
      // Level one: Being, Nothing, Becoming.
      if (i <= 2) {
        const m = i === 2 ? smooth((s - 0.3) / 1.6) : 0;
        const ghost = i === 2 ? after(s, 1.8) : 0;
        idea(T1, 'blue', '', 1, 0.3 * ghost, true); idea(A1, 'orange', '', 1, 0.3 * ghost, true);
        if (ghost > 0) { ctx.save(); ctx.globalAlpha *= 0.5 * ghost; line(ctx, T1[0] + 40, T1[1] - 34, S1[0] - 44, S1[1] + 30, 'blue', 2, [5, 6]); line(ctx, A1[0] - 40, A1[1] - 34, S1[0] + 44, S1[1] + 30, 'orange', 2, [5, 6]); ctx.restore(); }
        idea(pos(T1, S1, m), 'blue', 'Being', i === 0 ? outBack(clamp(s / 0.8)) : 1, 1 - smooth((m - 0.75) / 0.25));
        if (i >= 1) idea(pos(A1, S1, m), 'orange', 'Nothing', i === 1 ? outBack(clamp((s - 0.2) / 0.8)) : 1, 1 - smooth((m - 0.75) / 0.25));
        zap(T1, A1, i === 1 ? after(s, 1.2) : 0);
        show(ctx, 1 - m, () => {
          label(ctx, 'thesis', T1[0], Y0 + 506, { size: 19, weight: 700, fill: 'blue' });
          if (i >= 1) label(ctx, 'antithesis', A1[0], Y0 + 506, { size: 19, weight: 700, fill: 'orange' });
        });
        if (i === 2) {
          const g = smooth((m - 0.7) / 0.3);
          if (g > 0) glow(ctx, COLORS.purple, 14 * g);
          idea(S1, 'purple', 'Becoming', outBack(g), g); ctx.shadowBlur = 0;
          show(ctx, g, () => label(ctx, 'synthesis', S1[0], S1[1] + 76, { size: 19, weight: 700, fill: 'purple' }));
          show(ctx, after(s, 2.4), () => chip(ctx, 'aufheben: cancel, keep, lift up', cx, Y0 + 206, 'purple', 19));
        }
      } else {
        // Level two: the synthesis becomes a new thesis, and so on.
        const m2 = i === 3 ? smooth(s / 1.2) : 1; const dim = i === 4 ? 0.8 : 1;
        ctx.save(); ctx.globalAlpha *= dim;
        // Where Becoming came from: faint ghosts below.
        const gh = i === 3 ? after(s, 0.6) : 1 - after(s, 0, 0.5);
        show(ctx, 0.45 * gh, () => {
          const G1 = [X0 + 110, Y0 + 476]; const G2 = [X0 + 270, Y0 + 476];
          idea(G1, 'blue', '', 0.62, 1, true); idea(G2, 'orange', '', 0.62, 1, true);
          label(ctx, 'Being', G1[0], G1[1] + 1, { size: 18, weight: 700, fill: 'blue' });
          label(ctx, 'Nothing', G2[0], G2[1] + 1, { size: 18, weight: 700, fill: 'orange' });
          line(ctx, G1[0] + 20, G1[1] - 32, T2[0] - 16, T2[1] + 50, 'blue', 2, [5, 6]);
          line(ctx, G2[0] - 20, G2[1] - 32, T2[0] + 16, T2[1] + 50, 'orange', 2, [5, 6]);
        });
        const merge = i === 3 ? smooth((s - 3) / 1.2) : 1;
        idea(pos(S1, T2, m2), m2 > 0.5 ? 'blue' : 'purple', 'Becoming', 1, 1 - 0.45 * merge);
        show(ctx, m2, () => label(ctx, 'new thesis', T2[0], T2[1] - 76, { size: 19, weight: 700, fill: 'blue' }));
        const a2 = i === 3 ? outBack(clamp((s - 1.2) / 0.8)) : 1;
        idea(A2, 'orange', '?', a2, 1 - 0.45 * merge);
        if (a2 > 0.5) label(ctx, 'new antithesis', A2[0], A2[1] - 76, { size: 19, weight: 700, fill: 'orange' });
        zap(T2, A2, i === 3 ? after(s, 2) * (1 - merge) : 0);
        show(ctx, merge, () => {
          line(ctx, T2[0] + 40, T2[1] - 34, S2[0] - 44, S2[1] + 30, 'purple', 2.5, [6, 6]);
          line(ctx, A2[0] - 40, A2[1] - 34, S2[0] + 44, S2[1] + 30, 'purple', 2.5, [6, 6]);
        });
        if (merge > 0) glow(ctx, COLORS.purple, 12 * merge);
        idea(S2, 'purple', '…', outBack(merge), merge); ctx.shadowBlur = 0;
        show(ctx, merge, () => label(ctx, 'richer synthesis', S2[0] + 66, S2[1], { size: 19, weight: 700, fill: 'purple', align: 'left' }));
        ctx.restore();
        show(ctx, i === 4 ? after(s, 0.4) : 0, () => {
          chip(ctx, "Hegel's own words: abstract, negative, concrete", cx, Y0 + 466, 'yellow', 19);
          show(ctx, after(s, 1.6), () => chip(ctx, 'Popper: so loose it can fit anything', cx, Y0 + 522, 'orange', 19));
        });
      }
      const CAP = [
        ['Thesis', 'Hegel\'s Logic begins with the idea of pure Being: simply "is", with nothing more said about it.', 'blue'],
        ['Antithesis', 'But pure Being, with no features at all, turns out to be the same as Nothing. Each idea passes into its opposite.', 'orange'],
        ['Synthesis', "The tension resolves into Becoming, which keeps what was true in both. Hegel's word aufheben means to cancel, keep and lift up.", 'purple'],
        ['And again', 'Each result brings its own new tension, so ideas, and for Hegel history too, climb in a spiral towards fuller understanding.', 'teal'],
        ['A later label', '"Thesis, antithesis, synthesis" is a later summary, not Hegel\'s own terms. Critics like Popper found the method too vague to test.', 'yellow'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'G. W. F. Hegel, Science of Logic (1812–16): being, nothing, becoming');
      ctx.restore();
    },

    // Mill: your freedom ends where harm to others begins; offence is not harm.
    'harm-principle'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5, 5, 5.5, 5.5]);
      const AX = X0 + 250; const BXp = X0 + 550; const CY = Y0 + 360; const R = 125; const FB = Y0 + 420;
      const reach = S.i === 1 ? smooth((S.s - 0.6) / 1.6) : 0;
      const tipX = lerp(AX + 40, BXp - 30, reach);
      const hurt = S.i === 1 && tipX > BXp - R ? after(S.s, 0.6 + 1.6 * 0.62, 0.3) : 0;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || "Mill's harm principle");
      ctx.save(); ctx.globalAlpha *= S.lf;
      const sphere = (x, c, red) => {
        const col = red > 0 ? 'red' : c;
        ctx.fillStyle = tint(col, 0.08 + 0.12 * red); ctx.strokeStyle = tint(col, 0.75); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, CY, R, 0, TAU); ctx.fill(); ctx.stroke();
      };
      sphere(AX, 'cyan', 0); sphere(BXp, 'orange', hurt * (0.6 + 0.4 * Math.sin(k * 10)));
      label(ctx, 'your freedom', AX, Y0 + 456, { size: 18, weight: 700, fill: 'cyan' });
      label(ctx, 'their freedom', BXp, Y0 + 456, { size: 18, weight: 700, fill: 'orange' });
      // You, living as you like inside your own sphere.
      const armsA = S.i === 0 ? (Math.sin(k * 3) > 0 ? 'up' : 'wide') : S.i === 1 ? 'push' : S.i === 2 ? 'point' : 'down';
      person(ctx, AX, FB, 90, 'cyan', { face: 1, arms: armsA });
      person(ctx, BXp, FB, 90, 'orange', { face: -1, arms: hurt > 0 ? 'push' : 'down' });
      if (S.i === 0) {
        show(ctx, after(S.s, 0.6), () => {
          label(ctx, '♪', AX - 72, CY - 50 + Math.sin(k * 3) * 6, { size: 30, weight: 700, fill: 'yellow' });
          ctx.fillStyle = tint('blue', 0.4); ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 2; rounded(ctx, AX + 54, CY - 62, 34, 26, 3); ctx.fill(); ctx.stroke();
          line(ctx, AX + 71, CY - 62, AX + 71, CY - 36, 'blue', 2);
          chip(ctx, 'think · speak · live your way', AX, Y0 + 184, 'cyan', 18);
        });
      }
      if (S.i === 1 && reach > 0) {
        arr(ctx, AX + 40, CY - 20, tipX, CY - 20, hurt > 0 ? 'red' : 'yellow', 6);
        show(ctx, hurt, () => {
          ctx.strokeStyle = COLORS.red; ctx.lineWidth = 3; ctx.beginPath();
          for (let j = 0; j < 8; j++) { const a = (j / 8) * TAU; ctx.moveTo(BXp - R + Math.cos(a) * 10, CY - 20 + Math.sin(a) * 10); ctx.lineTo(BXp - R + Math.cos(a) * 24, CY - 20 + Math.sin(a) * 24); }
          ctx.stroke();
          chip(ctx, 'harm to others: society may step in', cx, Y0 + 514, 'red', 19);
        });
        show(ctx, after(S.s, 0.4), () => chip(ctx, 'Power over you is justified only to prevent harm to others', cx, Y0 + 150, 'yellow', 19));
      }
      if (S.i === 2) {
        show(ctx, after(S.s, 0.3), () => { bubble(ctx, X0 + 110, Y0 + 132, 280, 70, 'cyan', AX + 8, Y0 + 318); para(ctx, 'Pineapple belongs on pizza!', X0 + 124, Y0 + 167, 252, 19, 'ink', 700, 2); });
        show(ctx, after(S.s, 1.4), () => { bubble(ctx, X0 + 430, Y0 + 132, 240, 70, 'orange', BXp - 8, Y0 + 318); para(ctx, 'How offensive!', X0 + 444, Y0 + 167, 212, 19, 'ink', 700, 2); });
        show(ctx, after(S.s, 2.6), () => chip(ctx, 'offence alone is not harm', cx, Y0 + 514, 'green', 20));
      }
      if (S.i === 3) {
        show(ctx, after(S.s, 0.4), () => chip(ctx, 'What counts as harm?', X0 + 200, Y0 + 514, 'purple', 19));
        show(ctx, after(S.s, 1.4), () => chip(ctx, 'May law protect you from yourself?', X0 + 590, Y0 + 514, 'orange', 19));
        show(ctx, after(S.s, 2.6), () => chip(ctx, 'Feinberg: serious offence may count too', cx, Y0 + 116, 'teal', 19));
        show(ctx, after(S.s, 0.4), () => { label(ctx, '?', AX, Y0 + 186, { size: 34, weight: 800, fill: 'purple' }); label(ctx, '?', BXp, Y0 + 186, { size: 34, weight: 800, fill: 'orange' }); });
      }
      const CAP = [
        ['Your sphere of liberty', 'Mill: over yourself, your own body and mind, you are sovereign. You may live, think and speak as you choose.', 'cyan'],
        ['Where harm begins', 'The only good reason for society to restrict your freedom, by law or by pressure, is to prevent harm to others.', 'red'],
        ['Offence is not harm', 'Saying something others dislike may offend them, but Mill held that offence alone is no reason to silence anyone.', 'green'],
        ['The hard questions', 'What counts as harm: hurt feelings, risks, damage? May laws protect you from yourself? Feinberg argued some offence can count.', 'purple'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'John Stuart Mill, On Liberty (1859), chapter 1');
      ctx.restore();
    },

    // Epicurus' garden: simple pleasures and friends, sorting desires, and
    // "death is nothing to us"; then the critics.
    'epicurus-happiness'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5, 6, 5.5, 5.5]);
      const sa = after(S.s, 0, 0.5);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Epicurus on happiness');
      ctx.save(); ctx.globalAlpha *= S.lf * sa;
      if (S.i === 0) {
        // The garden: friends sharing bread and water.
        line(ctx, X0 + 20, Y0 + 440, X1 - 20, Y0 + 440, tint('green', 0.6), 3);
        tree(ctx, X0 + 110, Y0 + 440, 210); tree(ctx, X0 + 735, Y0 + 440, 150);
        person(ctx, cx + 20, Y0 + 440, 104, 'teal', { face: 1, arms: Math.sin(k * 2 + 1) > 0 ? 'give' : 'down' });
        ctx.strokeStyle = tint('orange', 0.7); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(X0 + 300, Y0 + 380); ctx.lineTo(X0 + 560, Y0 + 380); ctx.stroke();
        ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X0 + 318, Y0 + 382); ctx.lineTo(X0 + 318, Y0 + 440); ctx.moveTo(X0 + 542, Y0 + 382); ctx.lineTo(X0 + 542, Y0 + 440); ctx.stroke();
        for (const sx0 of [X0 + 252, X0 + 608]) { ctx.fillStyle = tint('orange', 0.5); ctx.fillRect(sx0 - 14, Y0 + 412, 28, 6); line(ctx, sx0, Y0 + 418, sx0, Y0 + 440, tint('orange', 0.6), 3); }
        person(ctx, X0 + 252, Y0 + 440, 96, 'cyan', { sit: true, face: 1, arms: Math.sin(k * 2) > 0 ? 'forward' : 'lap' });
        person(ctx, X0 + 608, Y0 + 440, 96, 'purple', { sit: true, face: -1, arms: 'forward' });
        ctx.fillStyle = tint('orange', 0.7); ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(X0 + 360, Y0 + 368, 26, 11, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = tint('cyan', 0.4); ctx.strokeStyle = COLORS.cyan; poly(ctx, [X0 + 492, Y0 + 344, X0 + 516, Y0 + 344, X0 + 512, Y0 + 378, X0 + 496, Y0 + 378], true); ctx.fill(); ctx.stroke();
        label(ctx, 'bread, water and friends', cx, Y0 + 476, { size: 19, weight: 700, fill: 'green' });
        show(ctx, after(S.s, 1), () => {
          chip(ctx, 'ataraxia: a calm mind', X0 + 250, Y0 + 104, 'teal', 19);
          chip(ctx, 'aponia: no bodily pain', X0 + 570, Y0 + 104, 'cyan', 19);
        });
      } else if (S.i === 1) {
        // Sorting desires into three kinds.
        const BX = [X0 + 140, X0 + 395, X0 + 650];
        const BH = [['natural and', 'necessary', 'green', 'seek these'], ['natural, but', 'not needed', 'yellow', 'enjoy, need not'], ['empty desires', '(never enough)', 'red', 'avoid']];
        BX.forEach((x, j) => {
          ctx.fillStyle = tint(BH[j][2], 0.07); ctx.strokeStyle = tint(BH[j][2], 0.8); ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(x - 115, Y0 + 326); ctx.lineTo(x - 108, Y0 + 524); ctx.lineTo(x + 108, Y0 + 524); ctx.lineTo(x + 115, Y0 + 326); ctx.fill(); ctx.stroke();
          label(ctx, BH[j][0], x, Y0 + 350, { size: 18, weight: 800, fill: BH[j][2] });
          label(ctx, BH[j][1], x, Y0 + 373, { size: 18, weight: 800, fill: BH[j][2] });
          label(ctx, BH[j][3], x, Y0 + 300, { size: 18, weight: 600, fill: 'muted' });
        });
        show(ctx, after(S.s, 0.2), () => chip(ctx, 'Which desires lead to a calm life?', cx, Y0 + 104, 'ink', 20));
        const ITEMS = [['food', 0], ['friends', 0], ['fame', 2], ['shelter', 0], ['fancy feasts', 1], ['riches', 2], ['fine clothes', 1]];
        const slot = [0, 0, 0];
        ITEMS.forEach(([txt, bin], j) => {
          const sl = slot[bin]++; const t0 = 0.4 + j * 0.62; const q = clamp((S.s - t0) / 0.6);
          if (q <= 0) return;
          const tx = BX[bin]; const ty = Y0 + 414 + sl * 40;
          const x = lerp(cx, tx, smooth(q)); const y = lerp(Y0 + 100, ty, q * q);
          chip(ctx, txt, x, y, BH[bin][2], 18);
        });
      } else if (S.i === 2) {
        // Death: before birth, life, after death.
        const BY = Y0 + 300; const L0 = X0 + 260; const L1 = X0 + 540;
        ctx.fillStyle = 'rgba(147,160,196,0.14)'; rounded(ctx, X0 + 60, BY, L0 - X0 - 60, 22, 11); ctx.fill(); rounded(ctx, L1, BY, X1 - 60 - L1, 22, 11); ctx.fill();
        glow(ctx, COLORS.yellow, 10); ctx.fillStyle = tint('yellow', 0.75); rounded(ctx, L0, BY, L1 - L0, 22, 11); ctx.fill(); ctx.shadowBlur = 0;
        const wx = lerp(L0 + 20, L1 - 20, mod(k * 0.12, 1));
        person(ctx, wx, BY, 70, 'cyan', { face: 1, walk: k * 5 });
        label(ctx, 'before birth', (X0 + 60 + L0) / 2, BY + 52, { size: 18, weight: 700, fill: 'muted' });
        label(ctx, 'your life', (L0 + L1) / 2, BY + 52, { size: 18, weight: 800, fill: 'yellow' });
        label(ctx, 'after death', (L1 + X1 - 60) / 2, BY + 52, { size: 18, weight: 700, fill: 'muted' });
        label(ctx, 'no one there to suffer', (X0 + 60 + L0) / 2, BY + 78, { size: 18, weight: 500, fill: 'muted' });
        label(ctx, 'all experience', (L0 + L1) / 2, BY + 78, { size: 18, weight: 500, fill: 'ink' });
        label(ctx, 'no one there to suffer', (L1 + X1 - 60) / 2, BY + 78, { size: 18, weight: 500, fill: 'muted' });
        show(ctx, after(S.s, 0.5), () => {
          chip(ctx, 'Death is nothing to us', cx, Y0 + 116, 'purple', 24);
          label(ctx, 'where death is, we are not; where we are, death is not', cx, Y0 + 166, { size: 18, weight: 600, fill: 'ink' });
        });
        show(ctx, after(S.s, 2.6), () => {
          ctx.strokeStyle = tint('teal', 0.8); ctx.lineWidth = 3; ctx.setLineDash([6, 6]);
          ctx.beginPath(); ctx.moveTo((X0 + 60 + L0) / 2, BY + 100); ctx.quadraticCurveTo(cx, BY + 190, (L1 + X1 - 60) / 2, BY + 100); ctx.stroke(); ctx.setLineDash([]);
          chip(ctx, 'Lucretius: a mirror of the time before birth', cx, Y0 + 512, 'teal', 19);
        });
      } else {
        // The debate.
        const side = (x, c, head, items) => {
          panel(ctx, x, Y0 + 70, 368, 440, c, 0.07, 16);
          label(ctx, head, x + 184, Y0 + 100, { size: 21, weight: 800, fill: c });
          items.forEach((txt, j) => show(ctx, after(S.s, 0.5 + j * 0.8 + (x > cx ? 0.4 : 0)), () => {
            dot(ctx, x + 26, Y0 + 168 + j * 118, 5, c);
            para(ctx, txt, x + 42, Y0 + 168 + j * 118, 306, 18, 'ink', 500, 3, 'left');
          }));
        };
        side(X0 + 16, 'green', 'For Epicurus', ['Simple pleasures are enough; luxury brings worry.', 'Fear of death, not death, is what harms us.', '"Pleasure" here means calm, not wild parties.']);
        side(X0 + 416, 'orange', 'Critics', ['Thomas Nagel: death harms us by taking away future goods.', 'Mill: some pleasures, like learning, are higher.', 'A quiet life might miss great, risky goals.']);
      }
      const CAP = [
        ['The garden', 'Epicurus taught in a garden: happiness is a calm mind and a body free of pain, found in bread, water and good friends.', 'green'],
        ['Sorting desires', 'Some desires are natural and necessary, some natural but not needed, and some, like fame and riches, are empty and never satisfied.', 'yellow'],
        ['Death is nothing to us', 'While we exist, death is not here; when death is here, we are not. Lucretius added: the time before our birth never troubled us.', 'purple'],
        ['Was he right?', "Critics like Thomas Nagel say death harms us by taking away future goods. Others still find calm in Epicurus's simple way of life.", 'orange'],
      ][S.i];
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= S.lf;
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Epicurus, Letter to Menoeceus (c. 300 BCE) · Lucretius · Nagel 1970');
      ctx.restore();
    },

    // People linked in a circle: a person is a person through other people.
    'ubuntu-circle'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [4.5, 5.5, 5.5, 5.5]);
      const RC = [cx, Y0 + 315]; const RR = 185; const N = 8;
      const COLS = ['teal', 'orange', 'purple', 'cyan', 'yellow', 'green', 'blue', 'red'];
      const on = (j) => (S.i === 0 ? (j === 0 ? 1 : 0) : S.i === 1 ? (j === 0 ? 1 : after(S.s, 0.3 + j * 0.35)) : 1);
      const P = Array.from({ length: N }, (_, j) => { const a = -Math.PI / 2 + (j / N) * TAU; return [RC[0] + Math.cos(a) * RR, RC[1] + Math.sin(a) * RR, a]; });
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Ubuntu: I am because we are');
      ctx.save(); ctx.globalAlpha *= S.lf;
      // The links between neighbours, with warmth flowing round.
      for (let j = 0; j < N; j++) {
        const nj = (j + 1) % N; const a = Math.min(on(j), on(nj));
        if (a <= 0) continue;
        show(ctx, a, () => {
          const a0 = P[j][2] + 0.2; const a1 = P[j][2] + TAU / N - 0.2;
          ctx.strokeStyle = tint('yellow', 0.55); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(RC[0], RC[1], RR, a0, a1); ctx.stroke();
        });
      }
      if (S.i >= 1) {
        const full = S.i === 1 ? after(S.s, 3.4) : 1;
        show(ctx, full, () => {
          for (let m = 0; m < 3; m++) { const a = k * 0.9 + (m / 3) * TAU; dot(ctx, RC[0] + Math.cos(a) * RR, RC[1] + Math.sin(a) * RR, 6, 'yellow', 10); }
        });
      }
      P.forEach(([x, y], j) => {
        if (on(j) > 0) person(ctx, x, y + 36, 72, COLS[j], { face: x < RC[0] - 1 ? 1 : -1, arms: S.i >= 1 ? 'wide' : 'down', a: on(j) });
        else person(ctx, x, y + 36, 72, 'muted', { a: 0.15 });
      });
      // In the middle: the saying.
      if (S.i === 0) {
        label(ctx, 'I', RC[0], RC[1] - 6, { size: 40, weight: 800, fill: 'muted' });
        label(ctx, 'alone?', RC[0], RC[1] + 36, { size: 20, weight: 700, fill: 'muted' });
      } else {
        const a = S.i === 1 ? after(S.s, 2.6, 0.8) : 1;
        show(ctx, a, () => {
          label(ctx, 'I am', RC[0], RC[1] - 46, { size: 30, weight: 800, fill: 'ink' });
          label(ctx, 'because', RC[0], RC[1] - 8, { size: 24, weight: 600, fill: 'yellow' });
          label(ctx, 'we are', RC[0], RC[1] + 30, { size: 30, weight: 800, fill: 'ink' });
          label(ctx, 'Umuntu ngumuntu ngabantu', RC[0], RC[1] + 76, { size: 18, weight: 600, fill: 'teal' });
        });
      }
      show(ctx, S.i === 2 ? after(S.s, 0.6) : 0, () => {
        chip(ctx, 'dignity', X0 + 90, Y0 + 92, 'yellow', 19);
        chip(ctx, 'sharing', X1 - 90, Y0 + 92, 'green', 19);
        chip(ctx, 'forgiveness', X0 + 100, Y0 + 536, 'cyan', 19);
        chip(ctx, 'belonging', X1 - 90, Y0 + 536, 'orange', 19);
      });
      show(ctx, S.i === 3 ? after(S.s, 0.5) : 0, () => {
        chip(ctx, 'Descartes: I think, so I am', X0 + 166, Y0 + 538, 'blue', 19);
        chip(ctx, 'Ubuntu: I am because we are', X1 - 166, Y0 + 538, 'teal', 19);
        show(ctx, after(S.s, 1.8), () => chip(ctx, 'room for dissent?', X0 + 112, Y0 + 92, 'orange', 19));
      });
      const CAP = [
        ['Alone?', 'Can a person become fully human alone? Many southern African traditions answer no: we grow into persons through others.', 'cyan'],
        ['Ubuntu', '"Umuntu ngumuntu ngabantu": a person is a person through other people. Or, as John Mbiti put it: I am because we are.', 'teal'],
        ['Living it', 'Ubuntu means dignity, sharing and forgiveness. Desmond Tutu drew on it in South Africa\'s Truth and Reconciliation Commission.', 'yellow'],
        ['Self and community', 'Descartes began from the lone thinking self; Ubuntu begins from relationships. Critics ask how it protects people who dissent.', 'purple'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Nguni Bantu saying · John Mbiti (1969) · Desmond Tutu (1999)');
      ctx.restore();
    },

    // Nagasena's chariot taken apart: wheel, axle, frame, pole, yoke — where
    // is the chariot? Anatta, and the rival views.
    'chariot-no-self'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5, 6.5, 5.5, 6]);
      const ex = S.i === 1 ? smooth(S.s / 1.2) : S.i === 2 ? 1 - smooth(S.s / 1.2) : 0;
      // Each part: draw at an offset; its exploded offset and label.
      const PARTS = [
        { name: 'wheel', off: [-150, -120], lab: [X0 + 150, Y0 + 404], draw: (dx, dy) => {
          const x = X0 + 300 + dx; const y = Y0 + 420 + dy;
          ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x, y, 82, 0, TAU); ctx.stroke();
          ctx.lineWidth = 3; ctx.beginPath(); for (let j = 0; j < 8; j++) { const a = (j / 8) * TAU + k * 0.2; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 80, y + Math.sin(a) * 80); } ctx.stroke();
          dot(ctx, x, y, 10, 'orange');
        } },
        { name: 'axle', off: [-130, 100], lab: [X0 + 170, Y0 + 548], draw: (dx, dy) => { line(ctx, X0 + 214 + dx, Y0 + 420 + dy, X0 + 386 + dx, Y0 + 420 + dy, 'muted', 9); } },
        { name: 'frame', off: [70, -168], lab: [X0 + 380, Y0 + 238], draw: (dx, dy) => {
          ctx.fillStyle = tint('teal', 0.25); ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 4;
          poly(ctx, [X0 + 200 + dx, Y0 + 300 + dy, X0 + 214 + dx, Y0 + 384 + dy, X0 + 410 + dx, Y0 + 384 + dy, X0 + 424 + dx, Y0 + 300 + dy], true); ctx.fill(); ctx.stroke();
          line(ctx, X0 + 200 + dx, Y0 + 300 + dy, X0 + 180 + dx, Y0 + 270 + dy, 'teal', 4);
        } },
        { name: 'pole', off: [40, 128], lab: [X0 + 600, Y0 + 530], draw: (dx, dy) => { line(ctx, X0 + 418 + dx, Y0 + 376 + dy, X0 + 700 + dx, Y0 + 340 + dy, 'purple', 7); } },
        { name: 'yoke', off: [0, -116], lab: [X0 + 712, Y0 + 266], draw: (dx, dy) => {
          ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath();
          ctx.moveTo(X0 + 670 + dx, Y0 + 330 + dy); ctx.quadraticCurveTo(X0 + 712 + dx, Y0 + 300 + dy, X0 + 754 + dx, Y0 + 330 + dy); ctx.stroke();
        } },
      ];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || "Nagasena's chariot");
      ctx.save(); ctx.globalAlpha *= S.lf;
      line(ctx, X0 + 20, Y0 + 504, X1 - 20, Y0 + 504, 'rgba(200,215,255,0.3)', 2);
      const order = [3, 1, 2, 0, 4];
      order.forEach((pi) => { const p = PARTS[pi]; p.draw(p.off[0] * ex, p.off[1] * ex); });
      if (S.i === 1) {
        PARTS.forEach((p, j) => {
          const a = after(S.s, 1.3 + j * 0.75, 0.3);
          show(ctx, ex, () => label(ctx, `${p.name}?`, p.lab[0], p.lab[1], { size: 19, weight: 800, fill: 'ink' }));
          show(ctx, a, () => { ctx.font = `800 19px ${FONT}`; const w = ctx.measureText(`${p.name}?`).width; line(ctx, p.lab[0] - w / 2 - 6, p.lab[1], p.lab[0] + w / 2 + 6, p.lab[1], 'red', 3); });
        });
        show(ctx, after(S.s, 5.2), () => chip(ctx, 'Then where is the chariot?', X0 + 470, Y0 + 400, 'red', 20));
      }
      if (S.i === 0) {
        person(ctx, X0 + 70, Y0 + 236, 90, 'cyan', { face: 1, arms: S.s < 2 ? 'give' : 'down' });
        person(ctx, X0 + 730, Y0 + 236, 90, 'orange', { face: -1, arms: S.s >= 2 ? 'give' : 'down' });
        label(ctx, 'King Milinda', X0 + 74, Y0 + 258, { size: 18, weight: 700, fill: 'cyan' });
        label(ctx, 'Nagasena', X0 + 730, Y0 + 258, { size: 18, weight: 700, fill: 'orange' });
        show(ctx, after(S.s, 0.3), () => { bubble(ctx, X0 + 112, Y0 + 66, 320, 50, 'cyan', X0 + 84, Y0 + 150); label(ctx, 'Who are you, venerable sir?', X0 + 272, Y0 + 91, { size: 18, weight: 700, fill: 'ink' }); });
        show(ctx, after(S.s, 2), () => { bubble(ctx, X0 + 250, Y0 + 132, 440, 72, 'orange', X0 + 716, Y0 + 150); para(ctx, 'I am called Nagasena, but that is just a name: no lasting self is found.', X0 + 266, Y0 + 168, 408, 18, 'ink', 600, 2); });
      }
      if (S.i === 2) {
        show(ctx, after(S.s, 1.3), () => {
          label(ctx, '"chariot": a name for the parts working together', cx, Y0 + 238, { size: 18, weight: 700, fill: 'yellow' });
          label(ctx, '"Nagasena": a name for five changing aggregates', cx, Y0 + 76, { size: 18, weight: 700, fill: 'orange' });
          ['body', 'feelings', 'perceptions'].forEach((w, j) => show(ctx, after(S.s, 2 + j * 0.3), () => chip(ctx, w, X0 + 220 + j * 180, Y0 + 124, HUES[j], 19)));
          ['mental formations', 'consciousness'].forEach((w, j) => show(ctx, after(S.s, 2.9 + j * 0.3), () => chip(ctx, w, X0 + 290 + j * 230, Y0 + 174, HUES[j + 3], 19)));
        });
      }
      if (S.i === 3) {
        show(ctx, after(S.s, 0.4), () => chip(ctx, 'Upanishads: a true, lasting self (atman)', cx, Y0 + 96, 'cyan', 19));
        show(ctx, after(S.s, 1.4), () => chip(ctx, 'Hume, much later: a bundle of perceptions', cx, Y0 + 148, 'blue', 19));
        show(ctx, after(S.s, 2.4), () => chip(ctx, 'Who is responsible? Buddhists: continuity, like a flame', cx, Y0 + 200, 'yellow', 18));
      }
      const CAP = [
        ['King Milinda asks', 'The Greek king Milinda asks the monk his name. "Nagasena," he says, "but that is just a name: no lasting self is found."', 'cyan'],
        ['Take the chariot apart', 'Nagasena asks: is the chariot the wheel? The axle? The frame, the pole, the yoke? None of them, alone, is the chariot.', 'orange'],
        ['Just a name', '"Chariot" names the parts working together. So "Nagasena" names five changing aggregates, with no fixed self. This is anatta.', 'yellow'],
        ['Other views', 'The Upanishads teach a lasting self, atman; Hume later saw a bundle. If there is no self, who is responsible? Buddhists: continuity.', 'purple'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Milindapañha (Questions of King Milinda), c. 1st century BCE');
      ctx.restore();
    },

    // Avicenna's floating man: no senses at all, yet sure that he exists.
    'floating-man'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5.5, 5, 5.5, 5.5]);
      const FXc = X0 + 480; const FYc = Y0 + 290 + Math.sin(k * 1.2) * 8; const s = 1.2;
      const body = S.i === 2 ? 1 - 0.6 * after(S.s, 0.4, 1) : S.i === 3 ? 0.55 : 1;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || "Avicenna's floating man");
      ctx.save(); ctx.globalAlpha *= S.lf;
      // Still air: faint drifting wisps.
      ctx.strokeStyle = 'rgba(140,170,255,0.16)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let j = 0; j < 7; j++) { const y = Y0 + 90 + j * 52; const x = X0 + 260 + mod(k * 12 + rnd(j) * 400, 520); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 40, y - 8, x + 90, y); }
      ctx.stroke();
      // The man, limbs spread so nothing touches, eyes covered.
      ctx.save(); ctx.translate(FXc, FYc); ctx.rotate(Math.sin(k * 0.7) * 0.04);
      ctx.save(); ctx.globalAlpha *= body;
      if (S.i >= 2) ctx.setLineDash([8, 7]);
      ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
      ctx.moveTo(0, -52 * s); ctx.lineTo(0, 22 * s);
      ctx.moveTo(0, -44 * s); ctx.lineTo(-58 * s, -58 * s); ctx.lineTo(-108 * s, -48 * s);
      ctx.moveTo(0, -44 * s); ctx.lineTo(58 * s, -58 * s); ctx.lineTo(108 * s, -48 * s);
      ctx.moveTo(0, 22 * s); ctx.lineTo(-34 * s, 70 * s); ctx.lineTo(-52 * s, 118 * s);
      ctx.moveTo(0, 22 * s); ctx.lineTo(34 * s, 70 * s); ctx.lineTo(52 * s, 118 * s);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      const lit = S.i === 0 ? 0 : S.i === 1 ? after(S.s, 1.2, 1) : 1;
      if (lit > 0) {
        const g = ctx.createRadialGradient(0, -70 * s, 4, 0, -70 * s, 70);
        g.addColorStop(0, tint('yellow', 0.5 * lit)); g.addColorStop(1, tint('yellow', 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -70 * s, 70, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = tint('cyan', 0.3); ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, -70 * s, 16 * s, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(20,24,44,0.95)'; ctx.fillRect(-18 * s, -76 * s, 36 * s, 8 * s);
      ctx.restore();
      // The senses, switched off one by one.
      const SENSES = [['sight', eyeIcon], ['hearing', earIcon], ['touch', handIcon], ['smell', noseIcon]];
      SENSES.forEach(([name, icon], j) => {
        const y = Y0 + 120 + j * 86; const off = S.i === 0 ? after(S.s, 0.8 + j * 0.9, 0.3) : 1;
        ctx.save(); ctx.globalAlpha *= 1 - 0.5 * off;
        icon(ctx, X0 + 70, y, 18, 'cyan');
        label(ctx, name, X0 + 104, y, { size: 18, weight: 700, fill: 'ink', align: 'left' });
        ctx.restore();
        if (off > 0) { ctx.save(); ctx.globalAlpha *= off; cross(ctx, X0 + 70, y, 20, 'red', 4); ctx.restore(); }
      });
      show(ctx, S.i === 0 ? after(S.s, 4) : 0, () => chip(ctx, 'floating, touching nothing', X0 + 640, Y0 + 104, 'cyan', 18));
      show(ctx, lit, () => {
        bubble(ctx, X0 + 572, Y0 + 72, 196, 66, 'yellow', FXc + 26, FYc - 96, true);
        glow(ctx, COLORS.yellow, 8); label(ctx, 'I exist.', X0 + 670, Y0 + 106, { size: 26, weight: 800, fill: 'yellow' }); ctx.shadowBlur = 0;
      });
      show(ctx, S.i === 2 ? after(S.s, 1) : 0, () => {
        chip(ctx, 'known: I exist', X0 + 270, Y0 + 476, 'green', 19);
        chip(ctx, 'unknown: my body', X0 + 560, Y0 + 476, 'muted', 19);
        show(ctx, after(S.s, 2.2), () => chip(ctx, 'Avicenna: so the self is not the body', cx, Y0 + 528, 'yellow', 19));
      });
      show(ctx, S.i === 3 ? after(S.s, 0.5) : 0, () => {
        chip(ctx, "Knowing A but not B doesn't show A is not B", cx, Y0 + 476, 'orange', 19);
        show(ctx, after(S.s, 1.6), () => chip(ctx, 'Could anyone be aware with no senses at all?', cx, Y0 + 528, 'blue', 19));
      });
      const CAP = [
        ['Senses switched off', 'Avicenna imagined a man created in an instant, fully grown, blindfolded, floating in air, limbs apart, touching and hearing nothing.', 'cyan'],
        ['What does he know?', 'He knows nothing of the world, not even that he has a body. Yet, said Avicenna, he would still be sure of one thing: that he exists.', 'yellow'],
        ["Avicenna's conclusion", 'So the self is known directly, apart from the body: the soul is something other than the body. Descartes argued similarly six centuries later.', 'purple'],
        ['Objections', 'Knowing you exist without knowing your body does not prove you are not your body. And could anyone be aware with no senses at all?', 'orange'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Avicenna (Ibn Sina), Kitab al-Nafs (On the Soul), early 11th century');
      ctx.restore();
    },
  };
}
