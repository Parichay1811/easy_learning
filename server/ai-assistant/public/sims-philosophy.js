// Philosophy simulations for the board: famous thought experiments and big
// ideas, played out as little scenes for curious kids, teenagers and adults.
// Plato's cave, the trolley problem, the ship of Theseus, Zeno's Achilles,
// syllogisms and fallacies, the Socratic method, utilitarianism, Kant,
// Aristotle's mean, Rawls's veil, the prisoner's dilemma, Descartes's cogito,
// Hume on cause, the social contract, free will, mind and body, Searle's
// Chinese room, the Stoics, Confucius and Laozi, personal identity, and
// Sartre, de Beauvoir and Camus. Each one runs in stages with a caption per
// stage, presents the competing answers fairly, and loops. Each is a function
// of time (t since it appeared, b.clock for the loop): plain canvas calls, a
// few glows, no state between frames beyond constants cached on the item.
// PHILOSOPHY_SIMS says what each one is for, so a lesson's words can pick the
// right picture.

export const PHILOSOPHY_SIMS = {
  'plato-cave': { title: "Plato's cave", keywords: ["plato's cave", 'allegory of the cave', 'prisoners in the cave', 'shadows on the wall', 'theory of forms', 'form of the good'], example: {} },
  'trolley-problem': { title: 'The trolley problem', keywords: ['trolley problem', 'runaway trolley', 'footbridge dilemma', 'pull the lever', 'philippa foot', 'doing and allowing', 'judith jarvis thomson'], example: {} },
  'ship-of-theseus': { title: 'The ship of Theseus', keywords: ['ship of theseus', "theseus's ship", 'theseus paradox', 'replaced plank by plank', 'same ship', 'identity over time'], example: {} },
  'zeno-paradox': { title: "Zeno's paradox: Achilles and the tortoise", keywords: ["zeno's paradox", "zeno's paradoxes", 'zeno of elea', 'achilles and the tortoise', 'paradoxes of motion', 'dichotomy paradox'], example: {} },
  syllogism: { title: 'The syllogism', keywords: ['syllogism', 'deductive argument', 'socrates is mortal', 'all men are mortal', 'valid argument', 'sound argument', 'premises and conclusion', 'aristotelian logic'], example: {} },
  fallacies: { title: 'Logical fallacies', keywords: ['logical fallacy', 'logical fallacies', 'straw man', 'ad hominem', 'slippery slope', 'false dilemma', 'appeal to authority', 'informal fallacies'], example: {} },
  'socratic-method': { title: 'The Socratic method', keywords: ['socratic method', 'socratic questioning', 'socratic dialogue', 'socratic elenchus', 'what is courage', "plato's laches"], example: {} },
  'utilitarian-scale': { title: 'Utilitarianism', keywords: ['utilitarianism', 'greatest happiness principle', 'greatest good for the greatest number', 'jeremy bentham', 'john stuart mill', 'felicific calculus', 'consequentialism'], example: {} },
  'categorical-imperative': { title: "Kant's categorical imperative", keywords: ['categorical imperative', 'immanuel kant', "kant's ethics", 'universal law', 'means to an end', 'ends in themselves', 'deontology', 'deontological ethics'], example: {} },
  'virtue-mean': { title: "Aristotle's golden mean", keywords: ['golden mean', 'virtue ethics', 'doctrine of the mean', 'nicomachean ethics', 'courage is a virtue', 'vice of excess', 'practical wisdom'], example: {} },
  'veil-of-ignorance': { title: "Rawls's veil of ignorance", keywords: ['veil of ignorance', 'john rawls', 'original position', 'justice as fairness', 'difference principle', 'theory of justice'], example: {} },
  'prisoners-dilemma': { title: "The prisoner's dilemma", keywords: ["prisoner's dilemma", 'prisoners dilemma', 'game theory', 'tit for tat', 'tit-for-tat', 'cooperate or defect', 'payoff matrix'], example: {} },
  cogito: { title: 'I think, therefore I am', keywords: ['i think therefore i am', 'i think, therefore i am', 'cogito ergo sum', 'evil demon', 'method of doubt', 'radical doubt', 'cartesian doubt'], example: {} },
  'cause-effect-billiards': { title: 'Hume on cause and effect', keywords: ['david hume', "hume's theory of causation", 'hume on causation', 'problem of induction', 'necessary connection', 'constant conjunction', 'custom or habit'], example: {} },
  'social-contract': { title: 'The social contract', keywords: ['social contract', 'state of nature', 'thomas hobbes', 'john locke', 'nasty, brutish and short', 'nasty, brutish, and short', 'consent of the governed', 'natural rights'], example: {} },
  'free-will': { title: 'Free will and determinism', keywords: ['free will', 'causal determinism', 'compatibilism', 'hard determinism', 'could have done otherwise', 'libertarian free will'], example: {} },
  'mind-body': { title: 'The mind–body problem', keywords: ['mind-body problem', 'mind–body problem', 'mind body problem', 'dualism', 'physicalism', 'interaction problem', 'hard problem of consciousness', 'substance dualism'], example: {} },
  'chinese-room': { title: "Searle's Chinese room", keywords: ['chinese room', 'john searle', "searle's chinese room", 'strong ai', 'syntax is not semantics', 'does a computer understand'], example: {} },
  'stoic-control': { title: 'The Stoic circles of control', keywords: ['stoicism', 'stoic philosophy', 'epictetus', 'dichotomy of control', 'circle of control', 'marcus aurelius', 'what is in our control'], example: {} },
  'yin-yang-harmony': { title: 'Harmony: Laozi and Confucius', keywords: ['yin and yang', 'yin yang', 'laozi', 'lao tzu', 'confucius', 'confucianism', 'daoism', 'five relationships'], example: {} },
  'personal-identity': { title: 'Personal identity', keywords: ['personal identity', 'memory theory', "locke's memory theory", 'same person over time', 'what makes you you', 'brave officer', 'psychological continuity'], example: {} },
  existentialism: { title: 'Existentialism', keywords: ['existentialism', 'existence precedes essence', 'jean-paul sartre', 'simone de beauvoir', 'albert camus', 'myth of sisyphus', 'condemned to be free'], example: {} },
};

export function philosophySims(kit) {
  // eslint-disable-next-line no-unused-vars
  const { FIG, COL, COLORS, HUES, FONT, glow, label, wrapLabel, rounded, arrow, clamp, easeOut, outBack, color, tint } = kit;
  const X0 = FIG.x; const Y0 = FIG.y; const X1 = FIG.x + FIG.w; const Y1 = FIG.y + FIG.h;
  const cx = X0 + FIG.w / 2; const cy = Y0 + FIG.h / 2;
  const TAU = Math.PI * 2;
  const LINE = 'rgba(220,230,255,0.8)'; const FAINT = 'rgba(140,170,255,0.18)'; const DARK = '#070b1d';
  const INK2 = 'rgba(8,12,30,0.97)';

  // Small tools: numbers, timing, loops.
  const mod = (a, n) => ((a % n) + n) % n;
  const smooth = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
  const lerp = (a, c, p) => a + (c - a) * p;
  const fade = (ctx, t, d = 0.5) => { const q = easeOut(clamp(t / d)); ctx.globalAlpha *= q; return q; };
  const after = (t, at, d = 0.4) => easeOut(clamp((t - at) / d));
  const cycle = (t, period, delay = 0.6) => (t < delay ? 0 : mod(t - delay, period));
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  // Which stage of a looping scene we are in: i (index), s (seconds into it),
  // f (fraction of it), lf (fades the whole scene at the loop's seam), n (loop number).
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
  function chip(ctx, text, x, y, c = 'ink', size = 21, align = 'center') {
    text = String(text);
    ctx.font = `700 ${size}px ${FONT}`;
    const w = ctx.measureText(text).width + 24; const h = size + 14;
    const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.fillStyle = 'rgba(5,8,22,0.78)'; ctx.strokeStyle = tint(c, 0.55); ctx.lineWidth = 1.5;
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
  function line(ctx, x0, y0, x1, y1, c = LINE, w = 2, dash) {
    ctx.strokeStyle = color(c); ctx.lineWidth = w;
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

  // A stylised stick person standing on (x, y), h tall. o: face (1 right,
  // −1 left), walk (a phase), sit, crouch (0–1), lean (radians), arms
  // ('down', 'up', 'forward', 'push', 'hips', 'cower', 'point', 'shield',
  // 'give', 'lap'), pack (a backpack), a (alpha).
  function person(ctx, x, y, h, c = 'ink', o = {}) {
    const s = h / 100; const f = o.face || 1; const col = color(c);
    ctx.save(); ctx.translate(x, y);
    if (o.a !== undefined) ctx.globalAlpha *= o.a;
    if (o.lean) ctx.rotate(o.lean * f);
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(2.5, 7 * s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const cr = o.crouch || 0;
    const hip = o.sit ? -30 * s : (-46 + 18 * cr) * s;
    const neck = hip - 34 * s; const hr = 11 * s; const hy = neck - hr - 1.5 * s;
    if (o.pack) { ctx.fillStyle = tint(c, 0.35); rounded(ctx, -f * 20 * s, neck + 2 * s, 13 * s, 30 * s, 4 * s); ctx.fill(); ctx.stroke(); }
    ctx.beginPath();
    if (o.sit) {
      ctx.moveTo(0, hip); ctx.lineTo(f * 26 * s, hip); ctx.lineTo(f * 30 * s, 0);
      ctx.moveTo(0, hip); ctx.lineTo(f * 22 * s, hip + 3 * s); ctx.lineTo(f * 24 * s, 0);
    } else if (o.walk !== undefined) {
      const sw = Math.sin(o.walk) * 17 * s;
      for (const fx of [sw, -sw]) { ctx.moveTo(0, hip); ctx.lineTo(fx / 2 + f * 5 * s, hip / 2); ctx.lineTo(fx, 0); }
    } else {
      const k = f * 12 * s * cr; const sp = (10 + 6 * cr) * s;
      ctx.moveTo(0, hip); ctx.lineTo(-sp / 2 + k, hip / 2); ctx.lineTo(-sp, 0);
      ctx.moveTo(0, hip); ctx.lineTo(sp / 2 + k, hip / 2); ctx.lineTo(sp, 0);
    }
    ctx.moveTo(0, hip); ctx.lineTo(0, neck);
    const sh = neck + 6 * s; const A = o.arms || 'down';
    const arm = (ex, ey, hx, hy2) => { ctx.moveTo(0, sh); ctx.lineTo(ex * s, sh + ey * s); ctx.lineTo(hx * s, sh + hy2 * s); };
    if (A === 'up') { arm(-14, -16, -18, -36); arm(14, -16, 18, -36); }
    else if (A === 'forward') { arm(f * 16, 8, f * 32, 4); arm(f * 14, 12, f * 30, 10); }
    else if (A === 'push') { arm(f * 14, 10, f * 30, -4); arm(f * 12, 14, f * 28, 2); }
    else if (A === 'hips') { arm(-20, 12, -7, hip / s - sh / s - 2); arm(20, 12, 7, hip / s - sh / s - 2); }
    else if (A === 'cower') { arm(f * 16, -8, f * 4, -24); arm(-f * 8, -10, f * 2, -26); }
    else if (A === 'point') { arm(f * 18, -2, f * 36, -12); arm(-f * 6, 16, -f * 8, 32); }
    else if (A === 'shield') { arm(f * 16, -6, f * 8, -18); arm(-f * 6, 16, -f * 8, 32); }
    else if (A === 'give') { arm(f * 16, 12, f * 34, 16); arm(-f * 6, 16, -f * 8, 32); }
    else if (A === 'lap') { arm(f * 10, 16, f * 22, 22); arm(f * 8, 18, f * 18, 24); }
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

  return {
    // ─── Classic thought experiments ─────────────────────────────────────

    // Plato's cave: prisoners see only shadows; one is freed, climbs into the
    // sunlight (the Forms, the Good), and comes back down.
    'plato-cave'(b, ctx, it, t) {
      const k = b.clock;
      const F = Y0 + 520; const G = Y0 + 210; const WX = X0 + 100;
      const FX = X0 + 500; const FY = F - 55; const OX = X0 + 405; const OY = Y0 + 432;
      const S = stages(t, [4.5, 4.5, 4.5, 5.5, 5]);
      const C = it._c || (it._c = {
        p: mkPath([X0 + 312, F, X0 + 350, F, X0 + 372, F - 52, X0 + 398, F - 52, X0 + 425, F, X0 + 618, F, X0 + 702, G, X0 + 765, G]),
      });
      // A small shape (a puppet, or the real thing), about 24 px across at sc = 1.
      const thing = (kind, x, y, sc, fill, stroke) => {
        const P = { horse: [-11, -5, 7, -5, 11, -12, 15, -11, 13, -4, 9, 1, 9, 9, 7, 9, 6, 2, -7, 2, -8, 9, -10, 9, -10, 1, -14, 3], tree: [0, -12, 9, 4, 2, 4, 2, 10, -2, 10, -2, 4, -9, 4], bird: [-12, -2, -4, -6, 0, -2, 4, -6, 12, -2, 4, -1, 0, 4, -4, -1], jar: [-4, -11, 4, -11, 4, -8, 9, -3, 8, 8, -8, 8, -9, -3, -4, -8] }[kind];
        poly(ctx, P.map((v, i) => (i % 2 ? y + v * sc : x + v * sc)), true);
        ctx.fillStyle = fill; ctx.fill();
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
      };
      const KINDS = ['horse', 'tree', 'bird', 'jar'];
      const ki = Math.floor(k / 2.4) % 4; const bob = Math.sin(k * 2) * 3;
      const out = S.i === 3 ? after(S.s, 1.6, 1.2) : S.i === 4 ? 1 - after(S.s, 0, 1) : 0;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || "Plato's cave");
      ctx.save(); ctx.globalAlpha *= S.lf;
      // Sky, hill and rock.
      const sky = ctx.createLinearGradient(0, Y0 + 58, 0, G);
      sky.addColorStop(0, tint('blue', 0.08 + 0.24 * out)); sky.addColorStop(1, tint('cyan', 0.03 + 0.14 * out));
      ctx.fillStyle = sky; ctx.fillRect(X0 + 10, Y0 + 58, FIG.w - 20, G - Y0 - 58);
      ctx.fillStyle = 'rgba(70,80,120,0.32)'; ctx.fillRect(X0 + 10, G, FIG.w - 20, F + 40 - G);
      // The cave's inside, lit by the fire.
      ctx.beginPath(); ctx.moveTo(WX, F); ctx.lineTo(WX, Y0 + 300); ctx.quadraticCurveTo(X0 + 320, Y0 + 262, X0 + 545, Y0 + 292);
      ctx.lineTo(X0 + 600, G); ctx.lineTo(X0 + 700, G); ctx.lineTo(X0 + 622, F); ctx.closePath();
      const fl = 0.85 + 0.15 * Math.sin(k * 9) * Math.sin(k * 5.3);
      const glowF = ctx.createRadialGradient(FX, FY, 10, FX, FY, 470);
      glowF.addColorStop(0, `rgba(255,159,67,${0.34 * fl})`); glowF.addColorStop(1, 'rgba(255,159,67,0.05)');
      ctx.fillStyle = glowF; ctx.fill(); ctx.strokeStyle = 'rgba(200,215,255,0.45)'; ctx.lineWidth = 2; ctx.stroke();
      line(ctx, X0 + 10, G, X0 + 600, G, tint('green', 0.6), 3); line(ctx, X0 + 700, G, X1 - 10, G, tint('green', 0.6), 3);
      line(ctx, WX, Y0 + 302, WX, F, `rgba(255,190,130,${0.5 * fl})`, 5);
      // Outside: the sun, a tree, a real horse.
      ctx.save(); ctx.globalAlpha *= 0.35 + 0.65 * out;
      const sx = X0 + 250; const sy = Y0 + 110;
      if (out > 0.2) glow(ctx, COLORS.yellow, 22 * out);
      dot(ctx, sx, sy, 26, 'yellow'); ctx.shadowBlur = 0;
      ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 3; ctx.beginPath();
      for (let j = 0; j < 10; j++) { const a = (j / 10) * TAU + k * 0.3; ctx.moveTo(sx + Math.cos(a) * 34, sy + Math.sin(a) * 34); ctx.lineTo(sx + Math.cos(a) * 44, sy + Math.sin(a) * 44); }
      ctx.stroke();
      line(ctx, X0 + 470, G, X0 + 470, G - 34, 'orange', 6); dot(ctx, X0 + 470, G - 52, 24, tint('green', 0.85));
      thing('horse', X0 + 150, G - 21, 2.2, tint('orange', 0.7), COLORS.orange);
      ctx.restore();
      if (out > 0) {
        ctx.save(); ctx.globalAlpha *= out;
        label(ctx, 'the sun: the Form of the Good', sx + 44 + 14, sy - 4, { size: 20, weight: 700, fill: 'yellow', align: 'left' });
        label(ctx, 'real things: the Forms', X0 + 508, Y0 + 168, { size: 19, weight: 700, fill: 'green', align: 'left' });
        ctx.restore();
      }
      // The shadow on the wall, enlarged and flickering.
      ctx.save(); ctx.globalAlpha *= 0.85 * fl;
      thing(KINDS[ki], WX + 58, FY + (OY + bob - FY) * 3.2, 3.2, 'rgba(6,8,18,0.92)');
      ctx.restore();
      label(ctx, 'shadows on the wall', WX + 4, Y0 + 246, { size: 18, weight: 700, fill: 'orange', align: 'left' });
      // The low wall, the puppeteer and the puppet on its stick.
      person(ctx, X0 + 438, F, 78, 'purple', { face: -1, arms: 'forward', a: 0.75 });
      line(ctx, OX + 4, OY + bob + 8, OX + 18, F - 50, 'muted', 3);
      thing(KINDS[ki], OX, OY + bob, 1, tint('ink', 0.85), COLORS.ink);
      ctx.fillStyle = 'rgba(120,130,170,0.55)'; ctx.fillRect(X0 + 372, F - 52, 26, 52);
      // The fire.
      line(ctx, FX - 22, F - 2, FX + 22, F - 12, 'orange', 6); line(ctx, FX + 22, F - 2, FX - 22, F - 12, 'orange', 6);
      glow(ctx, COLORS.orange, 18);
      for (let j = 0; j < 3; j++) {
        const hgt = 40 + 14 * Math.sin(k * (7 + j) + j * 2); const xo = (j - 1) * 13;
        ctx.fillStyle = j === 1 ? COLORS.yellow : COLORS.orange;
        poly(ctx, [FX + xo - 11, F - 10, FX + xo + Math.sin(k * 6 + j) * 4, F - 10 - hgt, FX + xo + 11, F - 10], true); ctx.fill();
      }
      ctx.shadowBlur = 0;
      // The prisoners; the third is the one who is freed.
      for (let j = 0; j < 2; j++) {
        const x = X0 + 190 + j * 60;
        person(ctx, x, F, 80, 'blue', { sit: true, face: -1, arms: 'lap' });
        line(ctx, x - 22, F - 3, x + 16, F - 3, 'muted', 2, [4, 3]); ctx.fillStyle = COLORS.muted; ctx.fillRect(x + 14, F - 9, 5, 9);
        if (S.i === 4 && S.s > 3.5) label(ctx, 'ha ha!', x - 4, F - 104, { size: 18, weight: 700, fill: 'yellow' });
      }
      let fx = X0 + 312; let fy = F; let o = { sit: true, face: -1, arms: 'lap' };
      const walkOn = (P, d, rev) => { const q = at(P, d); fx = q.x; fy = q.y; o = { face: rev ? -1 : 1, walk: d / 9 }; };
      const P = C.p;
      if (S.i === 2) {
        if (S.s < 0.5) o = { sit: true, face: -1, arms: 'lap' };
        else if (S.s < 0.9) o = { face: -1, crouch: 1 - (S.s - 0.5) / 0.4 };
        else o = { face: 1, arms: 'shield' };
      } else if (S.i === 3) {
        if (S.s < 3.4) walkOn(P, (S.s / 3.4) * P.total);
        else { const q = at(P, P.total); fx = q.x; fy = q.y; o = { face: 1, arms: S.s > 3.8 ? 'up' : 'down' }; }
      } else if (S.i === 4) {
        if (S.s < 3.4) walkOn(P, (1 - S.s / 3.4) * P.total, true);
      }
      person(ctx, fx, fy, 80, S.i >= 2 ? 'cyan' : 'blue', o);
      if (o.sit) { line(ctx, X0 + 290, F - 3, X0 + 328, F - 3, 'muted', 2, [4, 3]); ctx.fillStyle = COLORS.muted; ctx.fillRect(X0 + 326, F - 9, 5, 9); }
      label(ctx, 'prisoners', X0 + 230, F + 22, { size: 18, weight: 700, fill: 'blue' });
      label(ctx, 'puppets', X0 + 395, F + 22, { size: 18, weight: 700, fill: 'purple' });
      label(ctx, 'fire', FX + 10, F + 22, { size: 18, weight: 700, fill: 'orange' });
      const CAP = [
        ['Chained since birth', 'Prisoners face the back wall. Behind them, people carry puppets in front of a fire. All the prisoners ever see are shadows.', 'blue'],
        ['Shadows seem real', 'They name the shadows and guess which will come next. To them, the shadows are the whole of reality.', 'orange'],
        ['One is freed', 'He turns round. The fire dazzles him, and he sees that the "things" he knew were only shadows of puppets.', 'cyan'],
        ['Out into the sunlight', 'Led up into daylight, he slowly sees real things, and at last the sun. For Plato: the Forms, and the Form of the Good.', 'yellow'],
        ['The return', 'Back in the dark he can hardly see. The others laugh at him, and refuse to be led out.', 'purple'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Plato, Republic, Book VII: the senses give shadows; reason leads to the Forms');
      ctx.restore();
    },

    // The trolley problem: a lever, five people and one; then the footbridge.
    'trolley-problem'(b, ctx, it, t) {
      const TY = Y0 + 270; const J = X0 + 320; const SB = TY + 150;
      const C = it._c || (it._c = (() => {
        const side = [X0 + 10, TY, J, TY];
        for (let j = 1; j <= 10; j++) { const q = j / 10; side.push(J + q * 210, TY + (SB - TY) * smooth(q)); }
        side.push(X1 - 10, SB);
        return { main: mkPath([X0 + 10, TY, J, TY, X1 - 10, TY]), side: mkPath(side) };
      })());
      const S = stages(t, [4, 4.5, 5, 5, 5.5, 5.5]);
      const offset = (pts, d) => {
        const out = []; const n = pts.length / 2;
        for (let i = 0; i < n; i++) {
          const i0 = Math.max(0, i - 1); const i1 = Math.min(n - 1, i + 1);
          const dx = pts[2 * i1] - pts[2 * i0]; const dy = pts[2 * i1 + 1] - pts[2 * i0 + 1]; const L = Math.hypot(dx, dy) || 1;
          out.push(pts[2 * i] - (dy / L) * d, pts[2 * i + 1] + (dx / L) * d);
        }
        return out;
      };
      const rails = (P, hl) => {
        ctx.strokeStyle = 'rgba(147,160,196,0.4)'; ctx.lineWidth = 4; ctx.beginPath();
        for (let d = 8; d < P.total; d += 22) { const q = at(P, d); const nx = -Math.sin(q.a) * 13; const ny = Math.cos(q.a) * 13; ctx.moveTo(q.x - nx, q.y - ny); ctx.lineTo(q.x + nx, q.y + ny); }
        ctx.stroke();
        ctx.strokeStyle = hl ? COLORS.yellow : 'rgba(200,215,255,0.75)'; ctx.lineWidth = 3;
        for (const d of [-7, 7]) { poly(ctx, offset(P.pts, d)); ctx.stroke(); }
      };
      const trolley = (P, d) => {
        const q = at(P, d);
        ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a);
        ctx.fillStyle = tint('orange', 0.4); ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 3;
        rounded(ctx, -38, -50, 76, 38, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = tint('cyan', 0.45); ctx.fillRect(-28, -43, 22, 14); ctx.fillRect(6, -43, 22, 14);
        dot(ctx, -21, -9, 8, 'ink'); dot(ctx, 21, -9, 8, 'ink');
        ctx.restore();
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The trolley problem');
      ctx.save(); ctx.globalAlpha *= S.lf;
      const bridge = S.i >= 4 ? after(S.s + (S.i === 5 ? 9 : 0), 0, 0.6) : 0;
      if (bridge < 1) {
        ctx.save(); ctx.globalAlpha *= 1 - bridge;
        const pulled = S.i === 2 ? smooth(S.s / 0.6) : 0;
        rails(C.side, S.i === 2); rails(C.main, S.i === 3);
        // The lever and you.
        const px = J - 18; const py = TY + 72; const ang = lerp(-0.55, 0.55, pulled);
        ctx.fillStyle = 'rgba(120,130,170,0.6)'; ctx.fillRect(px - 16, py, 32, 10);
        if (S.i === 1) glow(ctx, COLORS.yellow, 14 + 6 * Math.sin(b.clock * 6));
        line(ctx, px, py, px + Math.sin(ang) * 44, py - Math.cos(ang) * 44, 'yellow', 6); dot(ctx, px + Math.sin(ang) * 44, py - Math.cos(ang) * 44, 8, 'yellow');
        ctx.shadowBlur = 0;
        person(ctx, J - 82, TY + 126, 90, 'cyan', { face: 1, arms: 'forward' });
        label(ctx, 'you', J - 82, TY + 148, { size: 18, weight: 700, fill: 'cyan' });
        label(ctx, 'lever', px + 30, py + 22, { size: 18, weight: 700, fill: 'yellow', align: 'left' });
        // Five on the main track, one on the side track.
        const fiveC = S.i === 2 ? 'green' : S.i === 3 ? 'red' : 'yellow'; const oneC = S.i === 2 ? 'red' : S.i === 3 ? 'green' : 'yellow';
        for (let j = 0; j < 5; j++) person(ctx, X0 + 600 + j * 40, TY, 80, fiveC, { face: -1 });
        person(ctx, X0 + 690, SB, 80, oneC, { face: -1 });
        label(ctx, 'five people', X0 + 680, TY - 104, { size: 19, weight: 700, fill: fiveC });
        label(ctx, 'one person', X0 + 690, SB - 102, { size: 18, weight: 700, fill: oneC });
        // The trolley.
        let P = C.main; let d = 240;
        if (S.i === 0) d = lerp(30, 240, easeOut(S.s / 4));
        else if (S.i === 2) { P = C.side; d = lerp(240, 625, easeOut(clamp((S.s - 0.6) / 2.4))); }
        else if (S.i === 3) d = lerp(240, 520, easeOut(clamp((S.s - 0.4) / 2.4)));
        trolley(P, d);
        if (S.i === 2 || S.i === 3) {
          const yes = S.i === 2;
          ctx.save(); ctx.globalAlpha *= after(S.s, 1.6);
          chip(ctx, yes ? 'Five saved' : 'One saved', cx - 130, Y0 + 520, 'green', 22);
          chip(ctx, yes ? 'One harmed' : 'Five harmed', cx + 130, Y0 + 520, 'red', 22);
          ctx.restore();
        }
        ctx.restore();
      }
      if (bridge > 0) {
        ctx.save(); ctx.globalAlpha *= bridge;
        rails(C.main, false);
        const BY = Y0 + 180;
        ctx.fillStyle = 'rgba(120,130,170,0.5)'; ctx.fillRect(X0 + 370, BY, 200, 12); ctx.fillRect(X0 + 382, BY + 12, 14, TY - BY - 36); ctx.fillRect(X0 + 544, BY + 12, 14, TY - BY - 36);
        line(ctx, X0 + 370, BY - 34, X0 + 570, BY - 34, 'muted', 2); for (let j = 0; j < 6; j++) line(ctx, X0 + 375 + j * 38, BY - 34, X0 + 375 + j * 38, BY, 'muted', 2);
        person(ctx, X0 + 420, BY, 84, 'cyan', { face: 1, arms: S.i === 5 ? 'push' : 'down' });
        person(ctx, X0 + 492, BY, 88, 'yellow', { face: 1, pack: true });
        label(ctx, 'you', X0 + 396, BY - 64, { size: 18, weight: 700, fill: 'cyan', align: 'right' });
        label(ctx, 'a person with', X0 + 528, BY - 74, { size: 18, weight: 700, fill: 'yellow', align: 'left' });
        label(ctx, 'a heavy backpack', X0 + 528, BY - 52, { size: 18, weight: 700, fill: 'yellow', align: 'left' });
        for (let j = 0; j < 5; j++) person(ctx, X0 + 600 + j * 40, TY, 80, 'yellow', { face: -1 });
        label(ctx, 'five people', X0 + 680, TY - 104, { size: 19, weight: 700, fill: 'yellow' });
        trolley(C.main, S.i === 4 ? lerp(30, 250, easeOut(S.s / 3.5)) : 250);
        if (S.i === 5) {
          ctx.save(); ctx.globalAlpha *= after(S.s, 0.4);
          arr(ctx, X0 + 430, BY - 106, X0 + 486, BY - 106, 'red', 4);
          ctx.restore();
          ctx.save(); ctx.globalAlpha *= after(S.s, 1);
          chip(ctx, 'Using a person merely as a means?', cx, Y0 + 420, 'red', 21);
          chip(ctx, 'Most people say: don’t push', cx, Y0 + 500, 'purple', 21);
          ctx.restore();
        }
        ctx.restore();
      }
      const CAP = [
        ['A runaway trolley', 'Its brakes have failed, and it is heading for five people on the track.', 'orange'],
        ['You are next to a lever', 'Pull it and the trolley switches to a side track, where one person is standing. What should you do?', 'yellow'],
        ['Pull: judge by the outcome', 'Utilitarians weigh the consequences: five lives saved is better than one, so pull the lever.', 'green'],
        ['Don’t pull: doing vs allowing', 'Others say actively killing someone is worse than letting harm happen. Pulling makes you the cause of a death.', 'red'],
        ['The footbridge version', 'Now the only way to stop the trolley is to push a person off a bridge into its path. The numbers are the same: five for one.', 'cyan'],
        ['Why does it feel different?', 'Most people won’t push. Kant: never use a person merely as a means. There is still no agreed answer.', 'purple'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Philippa Foot (1967); Judith Jarvis Thomson added the footbridge');
      ctx.restore();
    },

    // The ship of Theseus: planks replaced one by one, the old ones rebuilt.
    'ship-of-theseus'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [2.5, 10.5, 3.5, 4.5, 4.5, 4.5]);
      const HT = Y0 + 172 + Math.sin(k * 1.5) * 3; const HB = Y0 + 420; const N = 10; const PW = 46;
      const hull = (x, y) => { ctx.beginPath(); ctx.moveTo(x - 230, y); ctx.lineTo(x + 230, y); ctx.quadraticCurveTo(x + 200, y + 80, x + 120, y + 82); ctx.lineTo(x - 120, y + 82); ctx.quadraticCurveTo(x - 200, y + 80, x - 230, y); ctx.closePath(); };
      const slotX = (j) => cx - 230 + (j + 0.5) * PW;
      const plank = (x, y, a, c) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(a);
        ctx.fillStyle = tint(c, 0.5); ctx.strokeStyle = color(c); ctx.lineWidth = 2;
        rounded(ctx, -PW / 2 + 2, -40, PW - 4, 80, 5); ctx.fill(); ctx.stroke();
        ctx.restore();
      };
      const mast = (x, y, a) => {
        ctx.save(); ctx.globalAlpha *= a;
        line(ctx, x, y, x, y - 100, 'ink', 4);
        ctx.fillStyle = tint('ink', 0.18); ctx.strokeStyle = 'rgba(220,230,255,0.7)'; ctx.lineWidth = 2;
        poly(ctx, [x + 5, y - 94, x + 5, y - 12, x + 118, y - 12], true); ctx.fill(); ctx.stroke();
        ctx.restore();
      };
      // How far each plank's swap has got (0 = old in place, 1 = new in place).
      const swap = (j) => (S.i === 0 ? 0 : S.i >= 2 ? 1 : clamp(S.s - 0.25 - j));
      const pileQ = S.i >= 3 ? 1 : S.i === 2 ? smooth((S.s - 0.4) / 2.4) : 0;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The ship of Theseus');
      ctx.save(); ctx.globalAlpha *= S.lf;
      // Water under ship A.
      ctx.strokeStyle = tint('cyan', 0.45); ctx.lineWidth = 2.5;
      for (let r = 0; r < 2; r++) { ctx.beginPath(); for (let x = X0 + 30; x <= X1 - 30; x += 8) { const y = Y0 + 268 + r * 14 + Math.sin(x / 26 + k * 2 + r) * 4; if (x === X0 + 30) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }
      // Ship A.
      const glowA = S.i === 3 || S.i === 5; const glowB = S.i === 4 || S.i === 5;
      mast(cx, HT, 1);
      ctx.save(); hull(cx, HT); ctx.clip();
      for (let j = 0; j < N; j++) {
        const q = swap(j); const x0 = cx - 230 + j * PW;
        if (q >= 0.8) { ctx.fillStyle = tint('cyan', 0.5); ctx.fillRect(x0, HT, PW, 84); } else if (q <= 0) { ctx.fillStyle = tint('orange', 0.5); ctx.fillRect(x0, HT, PW, 84); }
        line(ctx, x0, HT, x0, HT + 84, 'rgba(5,8,22,0.7)', 2);
      }
      ctx.restore();
      if (glowA) glow(ctx, COLORS.cyan, 16);
      hull(cx, HT); ctx.strokeStyle = glowA ? COLORS.cyan : 'rgba(220,230,255,0.85)'; ctx.lineWidth = 3; ctx.stroke(); ctx.shadowBlur = 0;
      // Ship B's outline, its planks loose then rebuilt.
      ctx.save(); ctx.globalAlpha *= S.i >= 1 ? 0.5 + 0.5 * pileQ : 0;
      mast(cx, HB, pileQ);
      if (glowB) glow(ctx, COLORS.orange, 16);
      hull(cx, HB); ctx.strokeStyle = pileQ >= 1 ? (glowB ? COLORS.orange : 'rgba(220,230,255,0.85)') : 'rgba(220,230,255,0.35)'; ctx.lineWidth = 3;
      if (pileQ < 1) ctx.setLineDash([8, 7]);
      ctx.stroke(); ctx.setLineDash([]); ctx.shadowBlur = 0;
      ctx.restore();
      if (pileQ >= 1) {
        ctx.save(); hull(cx, HB); ctx.clip();
        for (let j = 0; j < N; j++) { const x0 = cx - 230 + j * PW; ctx.fillStyle = tint('orange', 0.5); ctx.fillRect(x0, HB, PW, 84); line(ctx, x0, HB, x0, HB + 84, 'rgba(5,8,22,0.7)', 2); }
        ctx.restore();
        hull(cx, HB); ctx.strokeStyle = glowB ? COLORS.orange : 'rgba(220,230,255,0.85)'; ctx.lineWidth = 3; ctx.stroke();
      }
      // Planks on the move: old ones down to the pile, new ones dropping in.
      for (let j = 0; j < N; j++) {
        const q = swap(j);
        const px = cx - 170 + j * 36 + rnd(j) * 8; const py = HB + 50 - (j % 3) * 11; const pa = Math.PI / 2 + (rnd(j + 7) - 0.5) * 0.5;
        if (q > 0 && q < 1) {
          const m = smooth(q / 0.6);
          plank(lerp(slotX(j), px, m), lerp(HT + 41, py, m) - Math.sin(m * Math.PI) * 40, lerp(0, pa, m), 'orange');
          const n = smooth((q - 0.3) / 0.5);
          if (q > 0.3 && q < 0.8) plank(slotX(j), lerp(HT - 110, HT + 41, n), 0, 'cyan');
        } else if (q >= 1 && pileQ < 1) {
          plank(lerp(px, slotX(j), pileQ), lerp(py, HB + 41, pileQ), lerp(pa, 0, pileQ), 'orange');
        }
      }
      // Counter and names.
      let done = 0; for (let j = 0; j < N; j++) if (swap(j) >= 0.8) done++;
      label(ctx, 'new planks', X1 - 85, HT + 8, { size: 18, weight: 600, fill: 'muted' });
      label(ctx, `${done * 10}%`, X1 - 85, HT + 44, { size: 32, weight: 800, fill: done ? 'cyan' : 'orange' });
      label(ctx, 'Ship A', X0 + 85, HT + 40, { size: 22, weight: 800, fill: 'cyan' });
      if (S.i >= 1) label(ctx, S.i >= 2 ? 'Ship B' : 'old planks', X0 + 85, HB + 40, { size: 22, weight: 800, fill: 'orange' });
      if (glowA) { ctx.save(); ctx.globalAlpha *= after(S.s, 0.3); chip(ctx, 'A: kept sailing, every part new', cx, Y0 + 294, 'cyan', 19); ctx.restore(); }
      if (glowB) { ctx.save(); ctx.globalAlpha *= after(S.s, 0.3); chip(ctx, 'B: all the original planks', cx, Y0 + 538, 'orange', 19); ctx.restore(); }
      if (S.i === 5) label(ctx, '?', X1 - 85, HB + 40, { size: 54, weight: 800, fill: 'yellow' });
      const CAP = [
        ['The hero’s ship', 'Athens kept the ship of the hero Theseus for centuries. Whenever a plank rotted, it was replaced with a new one.', 'cyan'],
        ['Plank by plank', 'After one new plank, it’s surely the same ship. After half? After every single plank?', 'cyan'],
        ['Hobbes’s twist', 'Someone collects all the old planks and rebuilds them into a second ship. Now there are two.', 'orange'],
        ['Answer 1: Ship A', 'It changed gradually and never stopped being used and cared for as Theseus’s ship. Continuity is what counts.', 'cyan'],
        ['Answer 2: Ship B', 'It is made of the original material, put back in the original shape. The parts are what count.', 'orange'],
        ['Both? Neither?', 'Maybe "the same" has more than one meaning: same form, same material, same history. Philosophers still disagree.', 'yellow'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Told by Plutarch; Thomas Hobbes added the rebuilt ship');
      ctx.restore();
    },

    // Achilles and the tortoise: the gaps halve, and the halves add up to 1.
    'zeno-paradox'(b, ctx, it, t) {
      const TY = Y0 + 256; const xp = (p) => X0 + 70 + p * 560;
      const S = stages(t, [3, 9.5, 4.5, 5, 5]); const ZS = 1.5;
      // Physical time tau: Achilles runs 2 units per tau from 0, the tortoise
      // 1 unit per tau from 0.5; they draw level at tau = 0.5, at p = 1.
      let tau = 0; let step = 0; let steps = 0; let moving = false;
      if (S.i === 1) {
        step = Math.min(5, Math.floor(S.s / ZS)); const f = smooth((S.s - step * ZS) / (ZS * 0.75));
        tau = 0.5 * (1 - 2 ** -step) + f * 0.5 * 2 ** -(step + 1); steps = step + (f >= 1 ? 1 : 0); moving = f > 0 && f < 1;
      } else if (S.i === 2) { tau = 0.5 * (1 - 2 ** -6); steps = 6; step = 5; }
      else if (S.i >= 3) { tau = S.i === 3 ? lerp(0, 0.62, clamp((S.s - 0.3) / 3.4)) : 0.62; steps = 6; moving = S.i === 3 && tau > 0 && tau < 0.62; }
      const pA = 2 * tau; const pT = 0.5 + tau;
      const FR = ['1/2', '1/4', '1/8', '1/16', '1/32', '1/64'];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Achilles and the tortoise');
      ctx.save(); ctx.globalAlpha *= S.lf;
      dot(ctx, X0 + 40, Y0 + 86, 8, 'cyan'); label(ctx, 'Achilles', X0 + 56, Y0 + 86, { size: 19, weight: 700, fill: 'cyan', align: 'left' });
      dot(ctx, X0 + 180, Y0 + 86, 8, 'green'); label(ctx, 'tortoise', X0 + 196, Y0 + 86, { size: 19, weight: 700, fill: 'green', align: 'left' });
      if (S.i === 1 || S.i === 2) chip(ctx, `Step ${step + 1}: gap ${FR[step]}`, X1 - 120, Y0 + 86, 'yellow', 19);
      // The track, with 0 and 1 marked.
      line(ctx, X0 + 40, TY, X1 - 24, TY, LINE, 3);
      for (const [p, s] of [[0, '0'], [0.5, '1/2'], [1, '1']]) { line(ctx, xp(p), TY - 6, xp(p), TY + 10, LINE, 3); label(ctx, s, xp(p), TY + 28, { size: 18, weight: 600, fill: 'muted' }); }
      if (S.i >= 3) { line(ctx, xp(1), TY - 120, xp(1), TY, 'yellow', 2, [6, 6]); label(ctx, 'level here', xp(1), TY - 132, { size: 18, weight: 700, fill: 'yellow' }); }
      // Flags where the tortoise was at the start of each step.
      if (S.i === 1 || S.i === 2) for (let j = 1; j <= Math.min(steps, 5); j++) { const x = xp(1 - 2 ** -(j + 1)); line(ctx, x, TY, x, TY - 30, 'yellow', 2); ctx.fillStyle = COLORS.yellow; poly(ctx, [x, TY - 30, x + 12, TY - 25, x, TY - 20], true); ctx.fill(); }
      // The tortoise and Achilles.
      const tx = xp(pT);
      ctx.fillStyle = tint('green', 0.45); ctx.strokeStyle = COLORS.green; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(tx, TY - 6, 26, 20, 0, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke();
      dot(ctx, tx + 30, TY - 14, 7, 'green');
      line(ctx, tx - 16, TY - 4, tx - 20, TY + 2, 'green', 4); line(ctx, tx + 14, TY - 4, tx + 18, TY + 2, 'green', 4);
      person(ctx, xp(pA), TY - 2, 86, 'cyan', moving ? { face: 1, walk: pA * 60, lean: 0.12 } : { face: 1 });
      // The sum bar: the same 0 to 1, cut into halves.
      const BY = Y0 + 352; const BH = 42; const fillTo = S.i >= 2 ? 1 : Math.min(1, pA);
      for (let j = 0; j < 7; j++) {
        const a0 = 1 - 2 ** -j; const a1 = 1 - 2 ** -(j + 1); const e = Math.min(a1, fillTo);
        if (e > a0) { ctx.fillStyle = tint(HUES[j % HUES.length], 0.55); ctx.fillRect(xp(a0), BY, xp(e) - xp(a0), BH); }
        if (j < 6) line(ctx, xp(a1), BY, xp(a1), BY + BH, 'rgba(5,8,22,0.8)', 2);
      }
      ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.strokeRect(xp(0), BY, xp(1) - xp(0), BH);
      for (let j = 0; j < 3; j++) if (fillTo >= 1 - 2 ** -(j + 1) - 1e-6) label(ctx, FR[j], (xp(1 - 2 ** -j) + xp(1 - 2 ** -(j + 1))) / 2, BY + BH / 2 + 1, { size: 19, weight: 800, fill: 'ink' });
      label(ctx, 'distance Achilles runs', xp(0), BY - 18, { size: 18, weight: 600, fill: 'muted', align: 'left' });
      if (S.i >= 2) label(ctx, '= 1', xp(1) + 14, BY + BH / 2 + 1, { size: 24, weight: 800, fill: 'yellow', align: 'left' });
      // The series, term by term.
      const n = Math.max(1, Math.min(6, steps + (S.i === 1 ? 1 : 0)));
      const parts = [];
      for (let j = 0; j < n; j++) { if (j) parts.push([' + ', 'muted']); parts.push([FR[j], HUES[j % HUES.length]]); }
      parts.push([' + …', 'muted']); if (S.i >= 2) parts.push([' = 1', 'yellow']);
      if (S.i >= 1) rich(ctx, parts, cx, Y0 + 454, 27, 800);
      if (S.i >= 3) label(ctx, 'Each step also takes half the time of the one before', cx, Y0 + 516, { size: 19, weight: 600, fill: 'muted' });
      const CAP = [
        ['A race with a head start', 'Achilles runs twice as fast as the tortoise, so he lets it start halfway along.', 'green'],
        ['Zeno’s argument', 'To catch it, Achilles must first reach where the tortoise was. But by then it has crept ahead. There is always another gap, forever.', 'cyan'],
        ['Add up the gaps', 'He runs 1/2, then 1/4, then 1/8 … Infinitely many pieces, but together they make exactly 1, never more.', 'yellow'],
        ['He does catch up', 'The steps take less and less time too, so the total time is finite. At the line marked 1 he draws level, then passes.', 'green'],
        ['Solved, or not?', 'Mathematicians answer with limits: the series converges to 1. Some philosophers still ask how infinitely many steps can be completed.', 'purple'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Zeno of Elea (5th century BC), as reported by Aristotle');
      ctx.restore();
    },

    // ─── Logic and argument ──────────────────────────────────────────────

    // Euler circles for a valid syllogism, an invalid look-alike, and a valid
    // but unsound one.
    syllogism(b, ctx, it, t) {
      const S = stages(t, [3.5, 3.5, 4.5, 4.5, 5, 5.5]);
      const FORMS = [
        { lines: [[['All ', 'ink'], ['humans', 'blue'], [' are ', 'ink'], ['mortal', 'purple'], ['.', 'ink']], [['Socrates', 'yellow'], [' is a ', 'ink'], ['human', 'blue'], ['.', 'ink']], [['So, ', 'muted'], ['Socrates', 'yellow'], [' is ', 'ink'], ['mortal', 'purple'], ['.', 'ink']]], outer: 'mortal things', oc: 'purple', inner: 'humans', ic: 'blue', verdict: 'VALID', vc: 'green', note: 'If both premises are true, the conclusion has to be true.' },
        { lines: [[['All ', 'ink'], ['cats', 'orange'], [' are ', 'ink'], ['mortal', 'purple'], ['.', 'ink']], [['Socrates', 'yellow'], [' is ', 'ink'], ['mortal', 'purple'], ['.', 'ink']], [['So, ', 'muted'], ['Socrates', 'yellow'], [' is a ', 'ink'], ['cat', 'orange'], ['?', 'ink']]], outer: 'mortal things', oc: 'purple', inner: 'cats', ic: 'orange', verdict: 'INVALID', vc: 'red', note: 'True premises, but the conclusion does not follow from them.' },
        { lines: [[['All ', 'ink'], ['fish', 'teal'], [' can ', 'ink'], ['fly', 'cyan'], ['.', 'ink']], [['Socrates', 'yellow'], [' is a ', 'ink'], ['fish', 'teal'], ['.', 'ink']], [['So, ', 'muted'], ['Socrates', 'yellow'], [' can ', 'ink'], ['fly', 'cyan'], ['.', 'ink']]], outer: 'things that fly', oc: 'cyan', inner: 'fish', ic: 'teal', verdict: 'VALID, NOT SOUND', vc: 'orange', note: 'The form is fine, but premise 1 is false.' },
      ];
      const fi = [0, 0, 0, 1, 1, 2][S.i]; const Fm = FORMS[fi];
      const shown = fi === 0 ? S.i + 1 : 3; const first = S.i === 0 || S.i === 3 || S.i === 5;
      const lineA = (j) => (fi === 0 ? (j < S.i ? 1 : j === S.i ? after(S.s, 0.1) : 0) : first ? after(S.s, 0.2 + j * 0.6) : 1);
      const DX = X0 + 590; const DY = Y0 + 330; const R = 185;
      const inner = fi === 1 ? [X0 + 520, Y0 + 372, 92] : [X0 + 580, Y0 + 365, 105];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The syllogism');
      ctx.save(); ctx.globalAlpha *= S.lf;
      // The argument, line by line.
      const ROWS = [['premise 1', Y0 + 140, Y0 + 170], ['premise 2', Y0 + 208, Y0 + 238], ['conclusion', Y0 + 290, Y0 + 320]];
      ROWS.forEach(([name, ly, ty], j) => {
        if (j >= shown) return;
        ctx.save(); ctx.globalAlpha *= lineA(j);
        label(ctx, name, X0 + 30, ly, { size: 18, weight: 600, fill: 'muted', align: 'left' });
        rich(ctx, Fm.lines[j], X0 + 30, ty, 24, 700, 'left');
        ctx.restore();
      });
      if (shown >= 3) line(ctx, X0 + 30, Y0 + 266, X0 + 330, Y0 + 266, 'muted', 2);
      // The Euler diagram.
      const oa = fi === 0 ? after(S.i === 0 ? S.s : 9, 0.2, 0.6) : 1;
      ctx.save(); ctx.globalAlpha *= oa;
      const lit = (S.i === 2 && fi === 0) || S.i === 5;
      if (lit) glow(ctx, color(Fm.oc), 14 + 6 * Math.sin(b.clock * 4));
      ctx.fillStyle = tint(Fm.oc, 0.1); ctx.beginPath(); ctx.arc(DX, DY, R, 0, TAU); ctx.fill(); ring(ctx, DX, DY, R, Fm.oc, 3);
      ctx.shadowBlur = 0;
      label(ctx, Fm.outer, DX, DY - R + 34, { size: 21, weight: 800, fill: Fm.oc });
      ctx.restore();
      const ia = fi === 0 ? after(S.i === 0 ? S.s : 9, 1.2, 0.6) : 1;
      if (ia > 0) {
        ctx.save(); ctx.globalAlpha *= ia;
        const r = inner[2] * (fi === 0 ? easeOut(ia) : 1);
        ctx.fillStyle = tint(Fm.ic, 0.16); ctx.beginPath(); ctx.arc(inner[0], inner[1], r, 0, TAU); ctx.fill(); ring(ctx, inner[0], inner[1], r, Fm.ic, 3);
        label(ctx, Fm.inner, inner[0], inner[1] - inner[2] + 30, { size: 21, weight: 800, fill: Fm.ic });
        ctx.restore();
      }
      // Socrates.
      if (S.i >= 1) {
        let x = inner[0]; let y = inner[1] + 36; let a = 1;
        if (S.i === 1) { const q = easeOut(clamp((S.s - 0.3) / 0.8)); y = lerp(Y0 + 70, y, q); a = q; }
        if (fi === 1) {
          const out = [X0 + 690, Y0 + 400]; const inn = [inner[0], inner[1] + 30];
          const w = S.i === 3 ? 0 : smooth(0.5 - 0.5 * Math.cos(S.s * 1.6));
          x = lerp(out[0], inn[0], w); y = lerp(out[1], inn[1], w);
          if (S.i === 4) { ctx.save(); ctx.globalAlpha *= 0.5; dot(ctx, out[0], out[1], 9, 'yellow'); ring(ctx, inn[0], inn[1], 12, 'yellow', 2, [4, 4]); ctx.restore(); }
        }
        ctx.save(); ctx.globalAlpha *= a;
        dot(ctx, x, y, 11, 'yellow', lit || (S.i === 2) ? 16 : 0);
        label(ctx, 'Socrates', x, y + 28, { size: 19, weight: 800, fill: 'yellow' });
        ctx.restore();
      }
      // Verdict.
      if (shown >= 3 && (fi !== 0 || S.s > 1)) {
        ctx.save(); ctx.globalAlpha *= fi === 0 ? after(S.s, 1) : after(S.s, first ? 2 : 0);
        chip(ctx, Fm.verdict, X0 + 30, Y0 + 384, Fm.vc, 22, 'left');
        para(ctx, Fm.note, X0 + 30, Y0 + 456, 300, 19, 'ink', 500, 3, 'left');
        ctx.restore();
      }
      const CAP = [
        ['Premise 1', 'All humans are mortal: the circle of humans sits completely inside the circle of mortal things.', 'purple'],
        ['Premise 2', 'Socrates is a human: so Socrates goes inside the humans circle.', 'blue'],
        ['Conclusion', 'Then Socrates must be inside "mortal things" too. When true premises force the conclusion, the argument is valid.', 'green'],
        ['A look-alike', 'All cats are mortal. Socrates is mortal. So Socrates is a cat? It sounds similar, but check the circles.', 'orange'],
        ['Invalid', 'Socrates can be in "mortal things" without being in "cats". The premises allow both, so they prove nothing.', 'red'],
        ['Valid is not the same as true', 'This one is valid, but premise 1 is false. A sound argument is valid AND has true premises.', 'orange'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Aristotle invented the syllogism (Prior Analytics)');
      ctx.restore();
    },

    // Five common fallacies, each a little scene on a card.
    fallacies(b, ctx, it, t) {
      const k = b.clock; const CD = 6;
      const NAMES = [['Straw man', 'orange'], ['Ad hominem', 'red'], ['Slippery slope', 'purple'], ['False dilemma', 'cyan'], ['Appeal to authority', 'yellow']];
      const DEFS = [
        'Twisting someone’s argument into a weaker version that is easy to knock down, then attacking that instead.',
        'Attacking the person making the argument instead of the argument itself.',
        'Claiming one small step will lead to disaster, without showing why each step must follow.',
        'Pretending there are only two options when there are really more.',
        'Believing a claim just because someone famous says so. Experts in their own field are worth hearing; fame is not evidence.',
      ];
      const u = cycle(t, CD * 5, 0.6); const ci = Math.floor(u / CD); const s = u - ci * CD; const [name, c] = NAMES[ci];
      const lf = Math.min(clamp(s / 0.35 + (t < 0.6 + CD ? 1 : 0)), clamp((CD - s) / 0.3));
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Logical fallacies');
      // Tabs.
      ctx.font = `700 18px ${FONT}`;
      const tabs = NAMES.map(([n]) => (n === 'Appeal to authority' ? 'Authority' : n));
      const ws = tabs.map((n) => ctx.measureText(n).width + 22); const tot = ws.reduce((a, w) => a + w, 0) + 8 * 4;
      let tx = cx - tot / 2;
      tabs.forEach((n, j) => {
        const on = j === ci; const tc = NAMES[j][1];
        ctx.fillStyle = on ? tint(tc, 0.3) : 'rgba(5,8,22,0.6)'; ctx.strokeStyle = tint(tc, on ? 0.9 : 0.4); ctx.lineWidth = on ? 2.5 : 1.5;
        rounded(ctx, tx, Y0 + 66, ws[j], 30, 15); ctx.fill(); ctx.stroke();
        label(ctx, n, tx + ws[j] / 2, Y0 + 82, { size: 18, weight: 700, fill: on ? 'ink' : 'muted' });
        tx += ws[j] + 8;
      });
      ctx.save(); ctx.globalAlpha *= lf; ctx.translate((1 - after(s, 0, 0.45)) * 50, 0);
      panel(ctx, X0 + 20, Y0 + 112, FIG.w - 40, 448, c, 0.07, 18);
      label(ctx, name, cx, Y0 + 150, { size: 30, weight: 800, fill: c });
      const bub = (x, y, w, h, text, bc, tx2, ty2) => { bubble(ctx, x, y, w, h, bc, tx2, ty2); para(ctx, text, x + 14, y + h / 2, w - 28, 19, 'ink', 600, 3); };
      if (ci === 0) {
        const hit = mod(s, 1.4) < 0.35 && s > 1.5;
        person(ctx, X0 + 130, Y0 + 532, 118, 'blue', { face: 1 });
        person(ctx, X0 + 660, Y0 + 532, 118, 'red', { face: -1, arms: hit ? 'push' : 'down' });
        ctx.save(); ctx.translate(X0 + 430, Y0 + 532); ctx.rotate(hit ? -0.08 : Math.sin(k * 3) * 0.02);
        ctx.strokeStyle = 'rgba(251,191,36,0.85)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -170); ctx.moveTo(-58, -118); ctx.lineTo(58, -118); ctx.stroke();
        ctx.lineWidth = 3; ctx.beginPath(); for (const sx of [-1, 1]) for (let j = -1; j <= 1; j++) { ctx.moveTo(sx * 58, -118); ctx.lineTo(sx * 72, -118 + j * 10); } ctx.stroke();
        ctx.fillStyle = tint('yellow', 0.35); ctx.beginPath(); ctx.arc(0, -186, 18, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = tint('orange', 0.7); poly(ctx, [-30, -200, 30, -200, 10, -206, 0, -228, -10, -206], true); ctx.fill();
        chip(ctx, 'NO SCHOOL EVER', 0, -80, 'orange', 18);
        ctx.restore();
        bub(X0 + 40, Y0 + 190, 270, 96, 'We should have a bit less homework.', 'blue', X0 + 140, Y0 + 400);
        bub(X0 + 500, Y0 + 190, 270, 96, 'So you want no school at all? Ridiculous!', 'red', X0 + 650, Y0 + 400);
        label(ctx, 'the made-up version', X0 + 430, Y0 + 548, { size: 18, weight: 600, fill: 'orange' });
      } else if (ci === 1) {
        person(ctx, X0 + 150, Y0 + 532, 118, 'blue', { face: 1 });
        person(ctx, X0 + 660, Y0 + 532, 118, 'red', { face: -1, arms: 'point' });
        panel(ctx, X0 + 250, Y0 + 400, 190, 72, 'green', 0.12, 12);
        para(ctx, 'Exercise helps your heart', X0 + 260, Y0 + 436, 170, 18, 'green', 700, 2);
        label(ctx, 'the argument (ignored)', X0 + 345, Y0 + 490, { size: 18, weight: 600, fill: 'green' });
        bub(X0 + 40, Y0 + 190, 270, 96, 'Exercise is good for your heart. Here’s the research.', 'blue', X0 + 150, Y0 + 400);
        bub(X0 + 500, Y0 + 190, 270, 96, 'You can’t even run a mile, so you’re wrong!', 'red', X0 + 650, Y0 + 400);
        const q = clamp((s - 1.2) / 1.4); const P0 = [X0 + 618, Y0 + 418]; const P1 = [X0 + 420, Y0 + 300]; const P2 = [X0 + 186, Y0 + 400];
        if (q > 0) {
          const B = (v) => [(1 - v) ** 2 * P0[0] + 2 * (1 - v) * v * P1[0] + v * v * P2[0], (1 - v) ** 2 * P0[1] + 2 * (1 - v) * v * P1[1] + v * v * P2[1]];
          ctx.strokeStyle = COLORS.red; ctx.lineWidth = 4; ctx.setLineDash([10, 7]); ctx.beginPath();
          for (let j = 0; j <= 20; j++) { const p = B((j / 20) * q); if (j) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }
          ctx.stroke(); ctx.setLineDash([]);
          const e = B(q); const e0 = B(Math.max(0, q - 0.05)); arr(ctx, e0[0], e0[1], e[0], e[1], 'red', 4);
          if (q >= 1) label(ctx, 'attacks the person', X0 + 410, Y0 + 336, { size: 19, weight: 800, fill: 'red' });
        }
      } else if (ci === 2) {
        para(ctx, '“Skip one homework and your whole life will be ruined!”', X0 + 60, Y0 + 205, FIG.w - 120, 21, 'ink', 600, 2);
        const STEPS = ['Skip one task', 'Fall behind', 'Fail the year', 'Ruin your life!'];
        for (let j = 0; j < 4; j++) {
          const x = X0 + 40 + j * 185; const y = Y0 + 300 + j * 70;
          ctx.fillStyle = tint('purple', 0.14); ctx.fillRect(x, y, 185, Y0 + 556 - y);
          line(ctx, x, y, x + 185, y, 'purple', 3); if (j) line(ctx, x, y - 70, x, y, 'purple', 3);
          ctx.save(); ctx.globalAlpha *= after(s, 0.3 + j * 0.7);
          chip(ctx, STEPS[j], x + 98, y - 47, j === 3 ? 'red' : 'ink', 18);
          if (j) label(ctx, '?', x - 18, y - 34, { size: 28, weight: 800, fill: 'yellow' });
          ctx.restore();
        }
        const ph = clamp((s - 0.3) / 3.4) * 4; const j = Math.min(3, Math.floor(ph)); const f = ph - j;
        const x = X0 + 40 + j * 185 + 30 + f * 155; const y = Y0 + 300 + j * 70 + (j < 3 && f > 0.85 ? ((f - 0.85) / 0.15) ** 2 * 70 : 0);
        dot(ctx, Math.min(x, X0 + 750), y - 12, 12, 'orange', 10);
      } else if (ci === 3) {
        label(ctx, '“Either you love maths or you hate it!”', cx, Y0 + 200, { size: 22, weight: 600, fill: 'ink' });
        const FX = cx; const FY = Y0 + 450;
        person(ctx, FX, Y0 + 540, 70, 'cyan', { face: 1 });
        const hid = after(s, 2.4, 0.8);
        for (const [x, y, text, on] of [[X0 + 150, Y0 + 252, 'Love maths', 1], [X1 - 150, Y0 + 252, 'Hate maths', 1], [X0 + 320, Y0 + 316, 'Like some of it', 0], [X1 - 320, Y0 + 336, 'Still deciding', 0]]) {
          ctx.save(); ctx.globalAlpha *= on ? 1 : hid;
          ctx.strokeStyle = on ? COLORS.cyan : tint('green', 0.85); ctx.lineWidth = on ? 6 : 4; if (!on) ctx.setLineDash([9, 8]);
          ctx.beginPath(); ctx.moveTo(FX, FY); ctx.quadraticCurveTo((FX + x) / 2, FY - 70, x, y + 18); ctx.stroke(); ctx.setLineDash([]);
          chip(ctx, text, x, y, on ? 'cyan' : 'green', 19);
          ctx.restore();
        }
        if (hid > 0) { ctx.save(); ctx.globalAlpha *= hid; para(ctx, 'more options were there all along', X0 + 560, Y0 + 500, 200, 18, 'green', 700, 2); ctx.restore(); }
      } else {
        ctx.fillStyle = tint('yellow', 0.18); ctx.strokeStyle = tint('yellow', 0.7); ctx.lineWidth = 2; ctx.fillRect(X0 + 180, Y0 + 470, 140, 62); ctx.strokeRect(X0 + 180, Y0 + 470, 140, 62);
        person(ctx, X0 + 250, Y0 + 470, 118, 'yellow', { face: 1, arms: 'point' });
        ctx.fillStyle = COLORS.yellow; ctx.beginPath();
        for (let j = 0; j < 10; j++) { const r = j % 2 ? 7 : 16; const a = -Math.PI / 2 + (j / 10) * TAU; const px = X0 + 250 + Math.cos(a) * r; const py = Y0 + 318 + Math.sin(a) * r; if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.closePath(); ctx.fill();
        label(ctx, 'famous footballer', X0 + 250, Y0 + 548, { size: 18, weight: 700, fill: 'yellow' });
        bub(X0 + 360, Y0 + 186, 410, 96, 'I’m a famous footballer, and this cereal makes you smarter!', 'yellow', X0 + 300, Y0 + 330);
        for (let j = 0; j < 3; j++) person(ctx, X0 + 500 + j * 90, Y0 + 532, 72, 'blue', { face: -1, lean: Math.sin(k * 4 + j) * 0.06 });
        ctx.save(); ctx.globalAlpha *= after(s, 2.4);
        chip(ctx, 'Where’s the evidence?', X0 + 590, Y0 + 400, 'green', 19);
        ctx.restore();
      }
      ctx.restore();
      caption(ctx, name, DEFS[ci], c, t < 0.6 + CD ? s + 1 : s);
      footer(ctx, 'A fallacy is a flaw in reasoning: the conclusion might still be true');
      ctx.restore();
    },

    // A dialogue as a staircase: claim, question, better claim … (Plato's Laches).
    'socratic-method'(b, ctx, it, t) {
      const STEPS = [
        ['Laches', 'Courage is standing firm in battle, never retreating.', 'claim', 'yellow'],
        ['Socrates', 'Some soldiers retreat on purpose, then win. Not brave?', 'question', 'cyan'],
        ['Laches', 'Then courage is a kind of endurance of the soul.', 'better claim', 'yellow'],
        ['Socrates', 'Is stubborn, foolish endurance really admirable?', 'counter-example', 'cyan'],
        ['Nicias', 'Courage is knowing what is truly worth fearing.', 'better claim', 'purple'],
        ['Socrates', 'Closer, but still no definition. Let’s keep asking!', 'admit what we don’t know', 'green'],
      ];
      const CAP = [
        ['A claim', 'Two generals ask Socrates about courage. Laches offers a definition.'],
        ['A question', 'Socrates doesn’t lecture. He asks about a case the definition doesn’t fit: a counter-example.'],
        ['A better claim', 'Laches refines his idea so that it covers the new case.'],
        ['Another test', 'Socrates questions again: endurance can be foolish, and foolishness isn’t admirable.'],
        ['Another try', 'The other general, Nicias, suggests courage is a kind of wisdom about what to fear.'],
        ['Not knowing, but wiser', 'The dialogue ends without a final answer, yet everyone understands courage better than at the start.'],
      ];
      const S = stages(t, [3.8, 3.8, 3.8, 3.8, 3.8, 5.5]);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The Socratic method: what is courage?');
      ctx.save(); ctx.globalAlpha *= S.lf;
      STEPS.forEach(([who, text, role, c], j) => {
        if (j > S.i) return;
        const x = X0 + 20 + j * 20; const y = Y0 + 474 - j * 80; const w = 590; const h = 68; const on = j === S.i;
        const a = j === S.i ? after(S.s, 0, 0.5) : 1;
        ctx.save(); ctx.globalAlpha *= a * (on ? 1 : 0.62); ctx.translate(0, (1 - a) * 20);
        if (on) glow(ctx, color(c), 14);
        panel(ctx, x, y, w, h, c, on ? 0.2 : 0.08, 12); ctx.shadowBlur = 0;
        label(ctx, `${who}:`, x + 14, y + 18, { size: 18, weight: 800, fill: c, align: 'left' });
        label(ctx, role, x + w - 14, y + 18, { size: 18, weight: 600, fill: 'muted', align: 'right' });
        label(ctx, text, x + 14, y + 47, { size: 19, weight: 600, fill: 'ink', align: 'left' });
        ctx.restore();
      });
      // A meter: how close we are to a definition.
      const q = (S.i + (S.i < 5 ? S.f : 1)) / 6;
      const MX = X1 - 44; const MT = Y0 + 96; const MB = Y0 + 540;
      ctx.fillStyle = 'rgba(5,8,22,0.6)'; rounded(ctx, MX - 12, MT, 24, MB - MT, 12); ctx.fill();
      ctx.strokeStyle = tint('green', 0.6); ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = tint('green', 0.6); rounded(ctx, MX - 9, MB - 3 - (MB - MT - 6) * q * 0.85, 18, (MB - MT - 6) * q * 0.85, 9); ctx.fill();
      label(ctx, 'closer', MX, MT - 16, { size: 18, weight: 700, fill: 'green' });
      label(ctx, 'start', MX, MB + 18, { size: 18, weight: 600, fill: 'muted' });
      caption(ctx, CAP[S.i][0], CAP[S.i][1], STEPS[S.i][3], S.s);
      ctx.restore();
      footer(ctx, 'Plato’s dialogue Laches: Socrates questions two generals');
      ctx.restore();
    },

    // ─── Ethics ──────────────────────────────────────────────────────────

    // Bentham and Mill: weigh the happiness and suffering a choice brings to
    // everyone it affects.
    'utilitarian-scale'(b, ctx, it, t) {
      const S = stages(t, [6, 6, 4.5, 5, 5.5]);
      const CH = [{ name: 'Turn the empty lot into a park', v: [3, 2, 2, -1, 2, 1] }, { name: 'Turn the empty lot into a car park', v: [1, -1, -2, 3, -1, -2] }];
      const ci = S.i === 1 ? 1 : 0; const ch = CH[ci];
      const PY = Y0 + 196; const px = (j) => X0 + 120 + j * 112;
      const PIV = [cx, Y0 + 300]; const L = 230;
      // Tokens: one per point, flying from a person to a pan.
      const toks = []; ch.v.forEach((v, j) => { for (let m = 0; m < Math.abs(v); m++) toks.push({ j, pos: v > 0 }); });
      const nH = toks.filter((q) => q.pos).length; const nS = toks.length - nH;
      const live = S.i <= 1; const st = live ? S.s : 99;
      const landed = (n) => clamp((st - 0.8 - n * 0.22) / 0.55);
      let hNow = 0; let sNow = 0; toks.forEach((q, n) => { if (landed(n) >= 1) { if (q.pos) hNow++; else sNow++; } });
      const ang = clamp((sNow - hNow) * 0.03, -0.24, 0.24);
      const endL = [PIV[0] - Math.cos(ang) * L, PIV[1] - Math.sin(ang) * L]; const endR = [PIV[0] + Math.cos(ang) * L, PIV[1] + Math.sin(ang) * L];
      const panAt = (e) => [e[0], e[1] + 96];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Utilitarianism: weigh the consequences');
      ctx.save(); ctx.globalAlpha *= S.lf;
      // The people affected, with how the choice changes their happiness.
      ch.v.forEach((v, j) => {
        const shown = !live || st > 0.4 + j * 0.15;
        person(ctx, px(j), PY, 72, HUES[j % HUES.length], { face: 1 });
        if (shown) label(ctx, `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}`, px(j), PY - 96, { size: 22, weight: 800, fill: v > 0 ? 'green' : v < 0 ? 'red' : 'muted' });
      });
      chip(ctx, ch.name, cx, Y0 + 234, ci ? 'orange' : 'cyan', 20);
      // The balance.
      ctx.fillStyle = 'rgba(120,130,170,0.5)'; poly(ctx, [PIV[0], PIV[1], PIV[0] - 34, Y0 + 486, PIV[0] + 34, Y0 + 486], true); ctx.fill();
      line(ctx, endL[0], endL[1], endR[0], endR[1], 'ink', 6); dot(ctx, PIV[0], PIV[1], 8, 'yellow');
      const pans = [[endL, 'green', 'happiness', hNow], [endR, 'red', 'suffering', sNow]];
      for (const [e, c, name, n] of pans) {
        const [x, y] = panAt(e);
        line(ctx, e[0], e[1], x - 66, y, 'muted', 2); line(ctx, e[0], e[1], x + 66, y, 'muted', 2);
        ctx.fillStyle = tint(c, 0.18); ctx.strokeStyle = color(c); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x - 76, y); ctx.quadraticCurveTo(x, y + 44, x + 76, y); ctx.closePath(); ctx.fill(); ctx.stroke();
        label(ctx, `${name}: ${n}`, x, Y0 + 486, { size: 20, weight: 800, fill: c });
      }
      // Tokens settle into the pans in rows of five.
      let iH = 0; let iS = 0;
      toks.forEach((q, n) => {
        const slot = q.pos ? iH++ : iS++; const [x, y] = panAt(q.pos ? endL : endR);
        const tx = x - 48 + (slot % 5) * 24; const ty = y + 8 - Math.floor(slot / 5) * 22;
        const f = landed(n); if (f <= 0) return;
        const sx = px(q.j); const sy = PY - 96;
        const xx = lerp(sx, tx, easeOut(f)); const yy = lerp(sy, ty, f) - Math.sin(f * Math.PI) * 60;
        dot(ctx, xx, yy, 10, q.pos ? 'green' : 'red');
      });
      if (live && hNow + sNow === toks.length) {
        const net = nH - nS;
        ctx.save(); ctx.globalAlpha *= after(st, 0.8 + toks.length * 0.22 + 0.6);
        chip(ctx, `Total: ${net >= 0 ? '+' : '−'}${Math.abs(net)}`, cx, Y0 + 530, net >= 0 ? 'green' : 'red', 22);
        ctx.restore();
      }
      if (!live) {
        ctx.save(); ctx.globalAlpha *= after(S.i === 2 ? S.s : 9, 0.2);
        const net = (v) => v.reduce((x, y) => x + y, 0); const sg = (n) => `${n >= 0 ? '+' : '−'}${Math.abs(n)}`;
        chip(ctx, `Park: ${sg(net(CH[0].v))}`, cx - 130, Y0 + 530, 'green', 21); chip(ctx, `Car park: ${sg(net(CH[1].v))}`, cx + 130, Y0 + 530, 'red', 21);
        ctx.restore();
      }
      const CAP = [
        ['Choice 1: a park', 'Add up the happiness (+) and suffering (−) for everyone affected, counting each person equally.', 'cyan'],
        ['Choice 2: a car park', 'Do the same for the other choice. Drivers gain, but more people lose out.', 'orange'],
        ['The greatest good for the greatest number', 'The park brings more total happiness, so a utilitarian chooses it. Only the consequences decide.', 'green'],
        ['Bentham and Mill', 'Bentham: count pleasure and pain by how strong, how long and how many. Mill: some pleasures (like learning) are higher in quality.', 'yellow'],
        ['The critics', 'Can happiness really be measured? And could adding it up justify treating a few people unfairly for the many?', 'red'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Jeremy Bentham (1789) and John Stuart Mill, Utilitarianism (1863)');
      ctx.restore();
    },

    // Kant: universalise your maxim; treat people as ends, never merely as means.
    'categorical-imperative'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [4.5, 4.5, 5.5, 6, 5.5]);
      const gx = (c) => X0 + 130 + c * 180; const gy = (r) => Y0 + 220 + r * 120;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Kant’s categorical imperative');
      ctx.save(); ctx.globalAlpha *= S.lf;
      if (S.i === 0 || S.i === 4) {
        person(ctx, X0 + 220, Y0 + 500, 170, 'cyan', { face: 1, arms: S.i === 4 ? 'down' : 'hips' });
        bubble(ctx, X0 + 300, Y0 + 170, 440, 110, 'cyan', X0 + 250, Y0 + 300, true);
        para(ctx, S.i === 0 ? 'My rule: “I’ll lie whenever it helps me.”' : 'A murderer asks where my friend is hiding. Must I still tell the truth?', X0 + 320, Y0 + 225, 400, 21, 'ink', 700, 3);
        if (S.i === 0) {
          ctx.save(); ctx.globalAlpha *= after(S.s, 1.6);
          chip(ctx, 'Test: could EVERYONE follow it?', X0 + 520, Y0 + 380, 'yellow', 20);
          ctx.restore();
        } else {
          ctx.save(); ctx.globalAlpha *= after(S.s, 1.2);
          chip(ctx, 'Kant: never lie, even here', X0 + 530, Y0 + 370, 'purple', 20);
          chip(ctx, 'Many: saving a life matters more', X0 + 520, Y0 + 440, 'green', 20);
          ctx.restore();
        }
      } else if (S.i === 1 || S.i === 2) {
        const brk = S.i === 2 ? smooth((S.s - 0.4) / 2) : 0;
        // Links of trust between neighbours, snapping as everyone lies.
        for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
          const x = gx(c); const y = gy(r) - 40;
          const links = []; if (c < 3) links.push([gx(c + 1), y]);
          for (const [x2, y2] of links) {
            const mx = (x + x2) / 2; const my = (y + y2) / 2; const g = brk * 14;
            const ux = (x2 - x) / Math.hypot(x2 - x, y2 - y); const uy = (y2 - y) / Math.hypot(x2 - x, y2 - y);
            const col = brk > 0 ? `rgba(251,113,133,${0.9 - 0.4 * brk})` : 'rgba(52,211,153,0.75)';
            line(ctx, x + ux * 26, y + uy * 26, mx - ux * g, my - uy * g, col, 3, brk > 0 ? [6, 5] : null);
            line(ctx, mx + ux * g, my + uy * g, x2 - ux * 26, y2 - uy * 26, col, 3, brk > 0 ? [6, 5] : null);
          }
        }
        for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
          const j = r * 4 + c; const x = gx(c); const y = gy(r);
          const a = S.i === 1 ? after(S.s, 0.2 + j * 0.12) : 1;
          person(ctx, x, y, 72, HUES[j % HUES.length], { face: c < 2 ? 1 : -1, a: 0.4 + 0.6 * a });
          if (a > 0) { ctx.save(); ctx.globalAlpha *= a; chip(ctx, 'lie', x + 44, y - 82, 'red', 18); ctx.restore(); }
        }
        if (S.i === 2) { ctx.save(); ctx.globalAlpha *= after(S.s, 2.2); chip(ctx, 'No one believes anyone: lying stops working', cx, Y0 + 534, 'red', 20); ctx.restore(); }
      } else {
        // Merely a means (stepping on someone) vs as an end (a fair trade).
        panel(ctx, X0 + 20, Y0 + 80, 370, 470, 'red', 0.07, 16); panel(ctx, X0 + 410, Y0 + 80, 370, 470, 'green', 0.07, 16);
        label(ctx, 'merely as a means', X0 + 205, Y0 + 112, { size: 21, weight: 800, fill: 'red' });
        label(ctx, 'as an end', X0 + 595, Y0 + 112, { size: 21, weight: 800, fill: 'green' });
        // A person on all fours, another standing on their back to reach an apple.
        const bx = X0 + 170; const by = Y0 + 470;
        ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(bx - 40, by - 40); ctx.lineTo(bx + 30, by - 40); ctx.moveTo(bx - 40, by - 40); ctx.lineTo(bx - 44, by); ctx.moveTo(bx - 40, by - 40); ctx.lineTo(bx - 30, by);
        ctx.moveTo(bx + 30, by - 40); ctx.lineTo(bx + 26, by); ctx.moveTo(bx + 30, by - 40); ctx.lineTo(bx + 40, by); ctx.stroke();
        ctx.fillStyle = tint('blue', 0.3); ctx.beginPath(); ctx.arc(bx + 50, by - 46, 11, 0, TAU); ctx.fill(); ctx.stroke();
        person(ctx, bx - 6, by - 46, 120, 'orange', { face: 1, arms: 'up' });
        line(ctx, X0 + 330, Y0 + 150, X0 + 330, Y0 + 500, 'orange', 6); line(ctx, X0 + 330, Y0 + 246, X0 + 206, Y0 + 262, 'orange', 5);
        dot(ctx, X0 + 200, Y0 + 280, 13, 'red'); line(ctx, X0 + 200, Y0 + 262, X0 + 200, Y0 + 268, 'green', 3);
        ctx.save(); ctx.globalAlpha *= after(S.s, 1.2); cross(ctx, X0 + 80, Y0 + 170, 22, 'red', 7); ctx.restore();
        // Two people trading: bread for a coin, both agreeing.
        person(ctx, X0 + 520, Y0 + 470, 130, 'cyan', { face: 1, arms: 'give' });
        person(ctx, X0 + 680, Y0 + 470, 130, 'yellow', { face: -1, arms: 'give' });
        const sw = smooth(0.5 - 0.5 * Math.cos(k * 1.6));
        ctx.fillStyle = tint('orange', 0.7); rounded(ctx, lerp(X0 + 552, X0 + 616, sw) - 18, Y0 + 368 - 10, 36, 20, 9); ctx.fill();
        dot(ctx, lerp(X0 + 648, X0 + 584, sw), Y0 + 390, 9, 'yellow');
        ctx.save(); ctx.globalAlpha *= after(S.s, 1.2); tick(ctx, X0 + 720, Y0 + 170, 22, 'green', 7); ctx.restore();
        para(ctx, 'Using someone as a tool, without their agreement', X0 + 40, Y0 + 520, 330, 18, 'ink', 600, 2);
        para(ctx, 'A fair trade: both agree, both are respected', X0 + 430, Y0 + 520, 330, 18, 'ink', 600, 2);
      }
      const CAP = [
        ['Kant’s test', 'Before acting, state your rule (your maxim), then ask: could everyone follow this rule as a universal law?', 'cyan'],
        ['Universalise it', 'Imagine everyone, everywhere, lying whenever it helped them.', 'yellow'],
        ['It defeats itself', 'If everyone lied when it suited them, nobody would believe anyone, so lies would stop working. The rule contradicts itself.', 'red'],
        ['People are not tools', 'Kant’s second formula: treat people always as ends in themselves, never merely as means to your own goals.', 'green'],
        ['A hard case', 'Kant held that lying is always wrong, even to a murderer. Many philosophers think consequences must count here.', 'purple'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Immanuel Kant, Groundwork of the Metaphysics of Morals (1785)');
      ctx.restore();
    },

    // Aristotle's golden mean: a virtue between a vice of too little and too much.
    'virtue-mean'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [3.6, 3.6, 3.6, 3.6, 3.6, 3.6, 5.5]);
      const PAN = [
        { y: Y0 + 66, name: 'Facing danger', ends: ['cowardice', 'courage', 'recklessness'], mean: [0.42, 0.7] },
        { y: Y0 + 316, name: 'Sharing what you have', ends: ['stinginess', 'generosity', 'wastefulness'], mean: [0.36, 0.64] },
      ];
      const TX0 = X0 + 90; const TW = FIG.w - 180;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Aristotle’s golden mean');
      ctx.save(); ctx.globalAlpha *= S.lf;
      PAN.forEach((P, pi) => {
        const active = S.i === 6 || Math.floor(S.i / 3) === pi;
        let pos = (P.mean[0] + P.mean[1]) / 2;
        const mid = (P.mean[0] + P.mean[1]) / 2; const KEY = [0.1, mid, 0.92];
        if (S.i < 6 && Math.floor(S.i / 3) === pi) { const z = S.i % 3; pos = lerp(z === 0 ? mid : KEY[z - 1], KEY[z], smooth(S.s / 0.9)); }
        const zone = pos < P.mean[0] ? 0 : pos > P.mean[1] ? 2 : 1;
        const zc = ['blue', 'green', 'orange'][zone];
        ctx.save(); ctx.globalAlpha *= active ? 1 : 0.4;
        panel(ctx, X0 + 16, P.y, FIG.w - 32, 232, active ? zc : 'muted', 0.06, 16);
        label(ctx, P.name, X0 + 40, P.y + 26, { size: 20, weight: 700, fill: 'muted', align: 'left' });
        ctx.font = `700 20px ${FONT}`; chip(ctx, ['Too little', 'Just right', 'Too much'][zone], X0 + 56 + ctx.measureText(P.name).width, P.y + 26, zc, 19, 'left');
        // The track, coloured by zone.
        const ty = P.y + 184;
        const segs = [[0, P.mean[0], 'blue'], [P.mean[0], P.mean[1], 'green'], [P.mean[1], 1, 'orange']];
        for (const [a0, a1, c] of segs) { ctx.fillStyle = tint(c, c === 'green' ? 0.55 : 0.3); rounded(ctx, TX0 + a0 * TW + 2, ty - 8, (a1 - a0) * TW - 4, 16, 8); ctx.fill(); }
        label(ctx, P.ends[0], TX0, ty + 32, { size: 19, weight: zone === 0 ? 800 : 600, fill: 'blue', align: 'left' });
        label(ctx, P.ends[1], TX0 + ((P.mean[0] + P.mean[1]) / 2) * TW, ty + 32, { size: 19, weight: zone === 1 ? 800 : 600, fill: 'green' });
        label(ctx, P.ends[2], TX0 + TW, ty + 32, { size: 19, weight: zone === 2 ? 800 : 600, fill: 'orange', align: 'right' });
        const kx = TX0 + pos * TW;
        glow(ctx, color(zc), 12); dot(ctx, kx, ty, 14, zc); ctx.shadowBlur = 0; ring(ctx, kx, ty, 14, 'ink', 2.5);
        // The figure above the knob, acting out the trait.
        const fy = ty - 34;
        if (pi === 0) {
          if (zone === 0) person(ctx, kx, fy, 104, zc, { face: -1, crouch: 0.8, arms: 'cower' });
          else if (zone === 1) person(ctx, kx, fy, 104, zc, { face: 1, arms: 'hips' });
          else person(ctx, kx, fy, 104, zc, { face: 1, walk: k * 12, lean: 0.25, arms: 'forward' });
        } else {
          person(ctx, kx, fy, 104, zc, { face: 1, arms: zone === 0 ? 'lap' : 'give' });
          if (zone === 0) { ctx.fillStyle = tint('yellow', 0.6); ctx.beginPath(); ctx.arc(kx + 10, fy - 50, 12, 0, TAU); ctx.fill(); }
          const nC = zone === 1 ? 2 : zone === 2 ? 9 : 0;
          for (let j = 0; j < nC; j++) {
            const ph = mod(k * 0.8 + j / nC, 1); const sp = zone === 1 ? 70 : 50 + rnd(j) * 110; const dir = zone === 1 ? 1 : rnd(j + 3) > 0.35 ? -1 : 1;
            dot(ctx, clamp(kx + dir * (30 + ph * sp), X0 + 40, X1 - 40), fy - 64 - Math.sin(ph * Math.PI) * (zone === 1 ? 20 : 15 + rnd(j + 9) * 25) + ph * (zone === 2 ? 60 : 0), 7, 'yellow');
          }
        }
        ctx.restore();
      });
      const CAP = [
        ['Too little: cowardice', 'Running from every danger, even when something important is at stake. A vice of deficiency.', 'blue'],
        ['The mean: courage', 'Facing danger for a good reason: feeling fear, but not being ruled by it.', 'green'],
        ['Too much: recklessness', 'Rushing into danger for no good reason. A vice of excess.', 'orange'],
        ['Too little: stinginess', 'Never sharing, even when you easily could.', 'blue'],
        ['The mean: generosity', 'Giving the right amount, to the right people, at the right time.', 'green'],
        ['Too much: wastefulness', 'Throwing money around until nothing is left for what matters.', 'orange'],
        ['The golden mean', 'Each virtue sits between two vices. It isn’t always the exact middle: practical wisdom finds the right amount for the situation.', 'green'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Aristotle, Nicomachean Ethics: virtue as a mean between extremes');
      ctx.restore();
    },

    // ─── Politics and society ────────────────────────────────────────────

    // Rawls: choose the rules before you know which role you will get.
    'veil-of-ignorance'(b, ctx, it, t) {
      const S = stages(t, [5, 5.5, 5, 5.5, 5.5]);
      const ROLES = [['rich', 'yellow', 0.9], ['poor', 'blue', 0.45], ['healthy', 'green', 0.65], ['ill', 'red', 0.5]];
      const RA = [1, 0.12, 0.3, 0.08]; // winner takes most
      const RB = [0.9, 0.45, 0.65, 0.5]; // protect the worst-off
      const order = [0, 1, 2, 3].sort((p, q) => rnd(p * 7 + S.n * 13) - rnd(q * 7 + S.n * 13));
      const px = (j) => X0 + 88 + j * 96; const PY = Y0 + 330;
      const lift = S.i >= 2 ? (S.i === 2 ? smooth(S.s / 1.2) : 1) : 0;
      const flip = S.i === 2 ? clamp((S.s - 2.4) / 0.8) : S.i > 2 ? 1 : 0;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Rawls’s veil of ignorance');
      ctx.save(); ctx.globalAlpha *= S.lf;
      // The people, grey until they learn who they are.
      for (let j = 0; j < 4; j++) {
        const role = ROLES[order[j]];
        person(ctx, px(j), PY, 96, flip >= 1 ? role[1] : 'muted', { face: 1 });
      }
      // The veil.
      ctx.save(); ctx.globalAlpha *= 1 - lift;
      const vy = Y0 + 150 - lift * 80;
      ctx.fillStyle = 'rgba(167,139,250,0.30)'; ctx.beginPath(); ctx.moveTo(X0 + 36, vy);
      for (let x = X0 + 36; x <= X0 + 428; x += 14) ctx.lineTo(x, vy + 196 + Math.sin(x / 18 + b.clock * 2) * 6);
      ctx.lineTo(X0 + 428, vy); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = tint('purple', 0.8); ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = tint('purple', 0.35); ctx.lineWidth = 2; ctx.beginPath(); for (let x = X0 + 70; x < X0 + 428; x += 44) { ctx.moveTo(x, vy + 4); ctx.lineTo(x + 6, vy + 190); } ctx.stroke();
      label(ctx, 'the veil of ignorance', X0 + 232, vy - 18, { size: 19, weight: 800, fill: 'purple' });
      ctx.restore();
      // Role cards: face down, shuffled, then turned over.
      for (let j = 0; j < 4; j++) {
        let slot = j;
        if (S.i === 2 && S.s > 1 && S.s < 2.4) { const sh = Math.sin((S.s - 1) * 6 + j * 1.7); slot = j + sh * 0.6; }
        const x = X0 + 88 + slot * 96; const y = Y0 + 400; const sc = Math.abs(Math.cos(flip * Math.PI)) || 0.02; const face = flip > 0.5;
        const role = ROLES[order[j]];
        ctx.save(); ctx.translate(x, y + 36); ctx.scale(sc, 1);
        ctx.fillStyle = face ? tint(role[1], 0.25) : 'rgba(167,139,250,0.22)'; ctx.strokeStyle = face ? color(role[1]) : tint('purple', 0.8); ctx.lineWidth = 2;
        rounded(ctx, -42, -36, 84, 72, 10); ctx.fill(); ctx.stroke();
        label(ctx, face ? role[0] : '?', 0, 1, { size: face ? 19 : 28, weight: 800, fill: face ? role[1] : 'purple' });
        ctx.restore();
      }
      // The two sets of rules.
      const pick = S.i === 1 ? (S.s < 2 ? 0 : 1) : S.i >= 2 ? 1 : -1;
      const ruleCard = (y, name, vals, idx) => {
        const on = pick === idx; const c = idx ? 'green' : 'orange';
        ctx.save(); ctx.globalAlpha *= pick >= 0 && !on ? 0.55 : 1;
        if (on && idx === 1) glow(ctx, COLORS.green, 12);
        panel(ctx, X0 + 456, y, 324, 112, on ? c : 'muted', on ? 0.16 : 0.06, 14); ctx.shadowBlur = 0;
        para(ctx, name, X0 + 470, y + 56, 140, 19, c, 800, 3, 'left');
        vals.forEach((v, j) => {
          const bx = X0 + 628 + j * 36; const bh = v * 78; const rc = flip >= 1 && idx === 1 ? ROLES[j][1] : c;
          ctx.fillStyle = tint(rc, 0.6); ctx.fillRect(bx, y + 96 - bh, 24, bh);
        });
        line(ctx, X0 + 622, y + 97, X0 + 768, y + 97, 'muted', 2);
        if (on && idx === 0 && S.i === 1) label(ctx, '?', X0 + 760, y + 20, { size: 26, weight: 800, fill: 'orange' });
        ctx.restore();
      };
      label(ctx, 'Which rules?', X0 + 618, Y0 + 92, { size: 20, weight: 700, fill: 'ink' });
      ruleCard(Y0 + 112, 'Winner takes most', RA, 0);
      ruleCard(Y0 + 240, 'Protect the worst-off', RB, 1);
      if (S.i === 3) {
        ctx.save(); ctx.globalAlpha *= after(S.s, 0.6);
        chip(ctx, 'Even the worst-off have enough', X0 + 618, Y0 + 470, 'green', 19);
        ctx.restore();
      }
      if (S.i === 4) {
        ctx.save(); ctx.globalAlpha *= after(S.s, 0.4);
        chip(ctx, 'Rawls: protect the worst-off', X0 + 618, Y0 + 410, 'green', 18);
        chip(ctx, 'Harsanyi: raise the average', X0 + 618, Y0 + 462, 'orange', 18);
        chip(ctx, 'Nozick: free exchange is just', X0 + 618, Y0 + 514, 'purple', 18);
        ctx.restore();
      }
      const CAP = [
        ['Behind the veil', 'You must choose the rules for a society, but you don’t know who you’ll be in it: rich or poor, healthy or ill.', 'purple'],
        ['Choose the rules', '"Winner takes most" is a gamble: you might end up with the least. Not knowing your place, you’d want rules fair to all.', 'green'],
        ['The veil lifts', 'Now the roles are handed out at random. Who got which card?', 'yellow'],
        ['Fair to everyone', 'Under the chosen rules, inequalities are allowed only if they help the worst-off. Rawls called this the difference principle.', 'green'],
        ['Not everyone agrees', 'Harsanyi thought people behind the veil would maximise the average instead. Nozick argued fair exchanges, not patterns, make justice.', 'orange'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'John Rawls, A Theory of Justice (1971)');
      ctx.restore();
    },

    // The prisoner's dilemma: a 2 × 2 grid of years in prison, and repeated games.
    'prisoners-dilemma'(b, ctx, it, t) {
      const S = stages(t, [5, 5, 5, 5.5, 6.5]);
      const GX = X0 + 246; const GY = Y0 + 146; const CW = 262; const CH = 140;
      const PAY = [[[1, 1], [3, 0]], [[0, 3], [2, 2]]]; // [A row][B column] = [A years, B years]
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The prisoner’s dilemma');
      ctx.save(); ctx.globalAlpha *= S.lf;
      label(ctx, 'Prisoner B', GX + CW, Y0 + 74, { size: 20, weight: 800, fill: 'orange' });
      label(ctx, 'stays silent', GX + CW / 2, GY - 20, { size: 19, weight: 700, fill: 'orange' });
      label(ctx, 'betrays', GX + CW * 1.5, GY - 20, { size: 19, weight: 700, fill: 'orange' });
      label(ctx, 'Prisoner A', GX - 18, GY - 20, { size: 20, weight: 800, fill: 'blue', align: 'right' });
      label(ctx, 'stays silent', GX - 18, GY + CH / 2, { size: 19, weight: 700, fill: 'blue', align: 'right' });
      label(ctx, 'betrays', GX - 18, GY + CH * 1.5, { size: 19, weight: 700, fill: 'blue', align: 'right' });
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
        const x = GX + c * CW; const y = GY + r * CH; const [a, bb] = PAY[r][c];
        const ap = S.i === 0 ? after(S.s, 0.4 + (r * 2 + c) * 0.5) : 1;
        let hl = null;
        if (S.i === 1 && c === 0) hl = 'yellow'; if (S.i === 2 && c === 1) hl = 'yellow';
        if (S.i >= 3 && r === 1 && c === 1) hl = 'red'; if (S.i >= 3 && r === 0 && c === 0) hl = 'green';
        ctx.save(); ctx.globalAlpha *= ap;
        if (hl && S.i >= 3) glow(ctx, color(hl), 12);
        ctx.fillStyle = hl ? tint(hl, 0.14) : 'rgba(255,255,255,0.04)'; ctx.strokeStyle = hl ? color(hl) : 'rgba(200,215,255,0.5)'; ctx.lineWidth = hl ? 3 : 2;
        rounded(ctx, x + 4, y + 4, CW - 8, CH - 8, 12); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
        const yr = (n) => (n === 0 ? 'goes free' : `${n} year${n > 1 ? 's' : ''}`);
        const aBig = (S.i === 1 && c === 0) || (S.i === 2 && c === 1);
        label(ctx, `A: ${yr(a)}`, x + CW / 2, y + CH / 2 - 20, { size: aBig ? 25 : 23, weight: 800, fill: 'blue' });
        label(ctx, `B: ${yr(bb)}`, x + CW / 2, y + CH / 2 + 20, { size: 22, weight: 700, fill: 'orange' });
        ctx.restore();
      }
      if (S.i === 1 || S.i === 2) {
        const c = S.i - 1; const x = GX + c * CW + CW - 20;
        ctx.save(); ctx.globalAlpha *= after(S.s, 1);
        arr(ctx, x, GY + CH / 2 - 10, x, GY + CH * 1.5 - 22, 'yellow', 4);
        label(ctx, c === 0 ? '0 is better than 1' : '2 is better than 3', GX + CW, GY + 2 * CH + 30, { size: 20, weight: 800, fill: 'yellow' });
        ctx.restore();
      }
      if (S.i === 3) {
        ctx.save(); ctx.globalAlpha *= after(S.s, 0.6);
        label(ctx, 'both betray: 2 years each, worse for both', GX + CW, GY + 2 * CH + 30, { size: 20, weight: 800, fill: 'red' });
        ctx.restore();
      }
      if (S.i === 4) {
        // Ten rounds of tit-for-tat: B tests once, A copies, then both cooperate.
        const B = 'CCCDCCCCCC'; const A = 'CCCCDCCCCC'; const RY = Y0 + 478;
        label(ctx, 'A', X0 + 196, RY, { size: 20, weight: 800, fill: 'blue' }); label(ctx, 'B', X0 + 196, RY + 44, { size: 20, weight: 800, fill: 'orange' });
        label(ctx, 'round by round', X0 + 230, RY - 36, { size: 18, weight: 600, fill: 'muted', align: 'left' });
        for (let j = 0; j < 10; j++) {
          const a = after(S.s, 0.3 + j * 0.35, 0.3); if (a <= 0) continue;
          ctx.save(); ctx.globalAlpha *= a;
          for (const [row, str] of [[0, A], [1, B]]) {
            const ch = str[j]; const x = X0 + 240 + j * 50; const y = RY + row * 44;
            dot(ctx, x, y, 16, ch === 'C' ? tint('green', 0.85) : tint('red', 0.9));
            label(ctx, ch, x, y + 1, { size: 18, weight: 800, fill: DARK });
          }
          ctx.restore();
        }
        label(ctx, 'C = cooperate (stay silent)   D = defect (betray)', X0 + 490, RY + 80, { size: 18, weight: 600, fill: 'muted' });
      }
      const CAP = [
        ['Two prisoners, kept apart', 'Each can stay silent or betray the other. They can’t talk to each other. Fewer years in prison is better.', 'blue'],
        ['If B stays silent …', '… A gets 1 year by staying silent, but goes free by betraying. So betraying is better for A.', 'yellow'],
        ['If B betrays …', '… A gets 3 years by staying silent, 2 by betraying. Betraying is better again. B reasons the same way.', 'yellow'],
        ['The trap', 'Both betray and get 2 years each, though if both stayed silent they’d get just 1. Each choice was sensible; the result is worse for both.', 'red'],
        ['Play again and again', 'In repeated games, strategies like tit-for-tat (copy what they did last time) make cooperation pay, as Axelrod’s tournaments showed.', 'green'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Game theory: Flood and Dresher (1950); story and name by Albert Tucker');
      ctx.restore();
    },

    // ─── Knowledge, mind and reality ─────────────────────────────────────

    // Descartes doubts the senses, dreams and an evil demon until only the
    // thinking "I" is left.
    cogito(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [4.5, 5, 5, 5, 5.5, 5.5]);
      const CX = cx; const CY = Y0 + 318;
      const RINGS = [
        { r0: 185, r1: 245, c: 'blue', top: 'the senses', bot: 'a stick looks bent in water' },
        { r0: 128, r1: 185, c: 'purple', top: 'is this a dream?', bot: 'dreams feel real' },
        { r0: 80, r1: 128, c: 'red', top: 'evil demon?', bot: '2 + 3 = 5?' },
      ];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'I think, therefore I am');
      ctx.save(); ctx.globalAlpha *= S.lf;
      RINGS.forEach((R, j) => {
        // Ring j is tested in stage j + 1 and breaks away in its second half.
        const st = j + 1; const testing = S.i === st; const br = testing ? smooth((S.s - 2.2) / 1.6) : S.i > st ? 1 : 0;
        if (br > 0) ring(ctx, CX, CY, R.r1, tint(R.c, 0.3 * br), 2, [6, 8]);
        if (br >= 1) return;
        ctx.save(); ctx.globalAlpha *= 1 - br;
        const n = 8; const mid = (R.r0 + R.r1) / 2;
        for (let m = 0; m < n; m++) {
          const a0 = ((m + 0.5) / n) * TAU + 0.02; const a1 = ((m + 1.5) / n) * TAU - 0.02; const am = (a0 + a1) / 2;
          const dx = Math.cos(am) * br * 70; const dy = Math.sin(am) * br * 70;
          ctx.beginPath(); ctx.arc(CX + dx, CY + dy, R.r1, a0, a1); ctx.arc(CX + dx, CY + dy, R.r0, a1, a0, true); ctx.closePath();
          ctx.fillStyle = tint(R.c, testing ? 0.22 + 0.1 * Math.sin(k * 6) : 0.13); ctx.fill();
          ctx.strokeStyle = tint(R.c, 0.7); ctx.lineWidth = 2; ctx.stroke();
        }
        if (br < 0.2) {
          label(ctx, R.top, CX, CY - mid, { size: 19, weight: 800, fill: R.c });
          label(ctx, R.bot, CX, CY + mid, { size: 18, weight: 600, fill: 'ink' });
        }
        ctx.restore();
      });
      // Little icons on the rings while they stand.
      if (S.i === 0 || (S.i === 1 && S.s < 2.2)) {
        for (const sx of [-1, 1]) {
          const ex = CX + sx * 215; const ey = CY;
          ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ex - 18, ey); ctx.quadraticCurveTo(ex, ey - 16, ex + 18, ey); ctx.quadraticCurveTo(ex, ey + 16, ex - 18, ey); ctx.stroke();
          dot(ctx, ex, ey, 6, 'blue');
        }
      }
      if (S.i <= 1 || (S.i === 2 && S.s < 2.2)) for (const sx of [-1, 1]) label(ctx, 'z Z', CX + sx * 156, CY + Math.sin(k * 2 + sx) * 4, { size: 20, weight: 800, fill: 'purple' });
      // The core: thinking, which survives every doubt.
      const lit = S.i >= 4 ? 1 : 0.35;
      if (S.i >= 4) glow(ctx, COLORS.yellow, 16 + 8 * Math.sin(k * 3));
      ctx.fillStyle = tint('yellow', 0.12 + 0.18 * lit); ctx.beginPath(); ctx.arc(CX, CY, 78, 0, TAU); ctx.fill();
      ring(ctx, CX, CY, 78, tint('yellow', 0.4 + 0.6 * lit), 3); ctx.shadowBlur = 0;
      ctx.save(); ctx.globalAlpha *= 0.45 + 0.55 * lit;
      label(ctx, 'I think,', CX, CY - 26, { size: 22, weight: 800, fill: 'yellow' });
      label(ctx, 'therefore', CX, CY + 1, { size: 20, weight: 700, fill: 'yellow' });
      label(ctx, 'I am', CX, CY + 28, { size: 22, weight: 800, fill: 'yellow' });
      ctx.restore();
      if (S.i === 5) {
        ctx.save(); ctx.globalAlpha *= after(S.s, 0.6);
        chip(ctx, 'an "I"?', CX - 170, CY - 120, 'cyan', 20); chip(ctx, 'or just "thinking happens"?', CX + 120, CY + 130, 'orange', 20);
        ctx.restore();
      }
      const CAP = [
        ['Doubt everything', 'Descartes looked for one belief that could not possibly be doubted. He tested everything he believed.', 'cyan'],
        ['Can I trust my senses?', 'The senses sometimes fool us, like a straight stick that looks bent in water. So they can’t be the foundation.', 'blue'],
        ['Am I dreaming?', 'Dreams can feel completely real. How can I be sure I’m not dreaming right now?', 'purple'],
        ['An evil demon?', 'Imagine a powerful deceiver tricking me about everything, even maths. Even 2 + 3 = 5 could then be doubted.', 'red'],
        ['I think, therefore I am', 'But to doubt, or to be fooled, I must be thinking. And if I’m thinking, I must exist. In Latin: cogito, ergo sum.', 'yellow'],
        ['Does it prove an "I"?', 'Critics such as Lichtenberg asked whether it proves a self, or only that some thinking is going on.', 'orange'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'René Descartes, Discourse on the Method (1637), Meditations (1641)');
      ctx.restore();
    },

    // Hume: we see one ball hit another and the second move, but never the
    // "necessary connection" between them; habit makes us expect it.
    'cause-effect-billiards'(b, ctx, it, t) {
      const S = stages(t, [4.5, 5.5, 6, 6]);
      const TX0 = X0 + 40; const TY0 = Y0 + 70; const TW = FIG.w - 80; const TH = 210; const BYc = TY0 + TH / 2; const R = 22;
      // One shot: A rolls to B (0–1 s), B rolls on (1–2.2 s).
      const shot = (u) => {
        const ax = u < 1 ? lerp(TX0 + 80, TX0 + 330, u) : TX0 + 330 + Math.min(0.06, u - 1) * 40;
        const q = clamp((u - 1) / 1.2); const bx = TX0 + 330 + 2 * R + 300 * (1 - (1 - q) ** 2);
        return [ax, bx];
      };
      const ball = (x, y, c, r = R, txt) => {
        ctx.fillStyle = tint(c, 0.6); ctx.strokeStyle = color(c); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
        if (txt) label(ctx, txt, x, y + 1, { size: Math.max(18, r * 0.9), weight: 800, fill: DARK });
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Hume on cause and effect');
      ctx.save(); ctx.globalAlpha *= S.lf;
      // The table.
      ctx.fillStyle = tint('teal', 0.12); ctx.strokeStyle = tint('teal', 0.7); ctx.lineWidth = 3;
      rounded(ctx, TX0, TY0, TW, TH, 18); ctx.fill(); ctx.stroke();
      let u = 0; let reps = 0;
      if (S.i === 0) u = clamp((S.s - 0.5) / 1, 0, 3) * 1.1;
      else if (S.i === 1) u = 3;
      else if (S.i === 2) { const per = 1.1; reps = Math.floor(S.s / per); u = mod(S.s, per) / per * 2.4; }
      else u = clamp(S.s / 0.9, 0, 1);
      const [ax, bx] = shot(u);
      if (S.i === 2) {
        for (let g = 1; g <= 3; g++) { ctx.save(); ctx.globalAlpha *= 0.12 * (4 - g); ball(TX0 + 640 - g * 18, BYc, 'orange'); ctx.restore(); }
      }
      if (S.i === 3 && u >= 1) {
        // Next time: will B move? Nothing in logic forces it.
        ctx.save(); ctx.globalAlpha *= 0.5 + 0.3 * Math.sin(b.clock * 4);
        ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
        ctx.beginPath(); ctx.arc(TX0 + 640, BYc, R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        ctx.restore();
        label(ctx, '?', TX0 + 640, BYc + 1, { size: 30, weight: 800, fill: 'orange' });
      }
      ball(ax, BYc, 'ink', R, 'A'); ball(S.i === 3 ? TX0 + 330 + 2 * R : bx, BYc, 'orange', R, 'B');
      label(ctx, S.i === 2 ? `seen ${['once', 'twice', '3 times', '10 times', '100 times', '1,000 times'][Math.min(5, reps)]}` : S.i === 3 ? 'next time?' : 'one event, then another', cx, TY0 + TH - 26, { size: 19, weight: 700, fill: 'muted' });
      // Below the table: the three frames, or the mind forming a habit.
      const FY = Y0 + 330;
      if (S.i === 1 || S.i === 3) {
        const FR = [['A moves', [0.3]], ['they touch', [1]], [S.i === 3 ? 'B moves?' : 'B moves', [2.2]]];
        FR.forEach(([name, [fu]], j) => {
          const fx = X0 + 40 + j * 260; const a = S.i === 1 ? after(S.s, 0.3 + j * 0.5) : 1;
          ctx.save(); ctx.globalAlpha *= a;
          panel(ctx, fx, FY, 200, 110, 'teal', 0.08, 12);
          const [fa, fb] = shot(fu); const sx = (x) => fx + 12 + ((x - TX0) / TW) * 176;
          ball(sx(fa), FY + 50, 'ink', 9); ball(sx(fb), FY + 50, 'orange', 9);
          label(ctx, name, fx + 100, FY + 90, { size: 18, weight: 700, fill: 'ink' });
          ctx.restore();
        });
        const ga = S.i === 1 ? after(S.s, 1.8) : 1;
        ctx.save(); ctx.globalAlpha *= ga;
        arr(ctx, X0 + 246, FY + 55, X0 + 294, FY + 55, 'muted', 3);
        dot(ctx, X0 + 530, FY + 55, 22, tint('yellow', 0.25)); ring(ctx, X0 + 530, FY + 55, 22, 'yellow', 2, [4, 4]);
        label(ctx, '?', X0 + 530, FY + 56, { size: 26, weight: 800, fill: 'yellow' });
        label(ctx, 'the "necessary connection": never seen', cx, FY + 150, { size: 20, weight: 800, fill: 'yellow' });
        ctx.restore();
      } else if (S.i === 0) {
        ctx.save(); ctx.globalAlpha *= after(S.s, 2.2, 0.5);
        chip(ctx, 'A hits B', X0 + 230, FY + 60, 'ink', 21); arr(ctx, X0 + 320, FY + 60, X0 + 470, FY + 60, 'muted', 4); chip(ctx, 'B moves', X0 + 570, FY + 60, 'orange', 21);
        label(ctx, 'cause', X0 + 230, FY + 110, { size: 19, weight: 700, fill: 'muted' }); label(ctx, 'effect', X0 + 570, FY + 110, { size: 19, weight: 700, fill: 'muted' });
        ctx.restore();
      } else if (S.i === 2) {
        // A head with a thought bubble: the expectation habit builds.
        const hx = X0 + 130; const hy = Y0 + 436;
        person(ctx, hx, Y0 + 556, 120, 'cyan', { face: 1 });
        const conf = clamp((S.s - 0.4) / 4.5);
        bubble(ctx, X0 + 250, Y0 + 340, 470, 90, 'cyan', hx + 20, hy - 6, true);
        para(ctx, conf < 0.5 ? 'A hit B … and B moved.' : 'A is coming, so B WILL move!', X0 + 266, Y0 + 385, 438, 22, 'ink', 700, 2);
        label(ctx, 'strength of the habit', X0 + 250, Y0 + 476, { size: 18, weight: 600, fill: 'muted', align: 'left' });
        ctx.fillStyle = 'rgba(5,8,22,0.6)'; rounded(ctx, X0 + 250, Y0 + 494, 470, 20, 10); ctx.fill();
        ctx.fillStyle = tint('cyan', 0.7); rounded(ctx, X0 + 252, Y0 + 496, 466 * conf + 1, 16, 8); ctx.fill();
      }
      const CAP = [
        ['What we see', 'Ball A rolls and hits ball B, and B moves off. We say A caused B to move.', 'teal'],
        ['What we never see', 'Look closely: there is one event, then another. Nowhere do we see a force or a "necessary connection" linking them.', 'yellow'],
        ['Habit', 'After seeing it again and again, the mind expects B to move. Hume: our idea of cause comes from this habit, not from reason.', 'cyan'],
        ['The problem of induction', 'So we can’t prove the future will copy the past. Kant replied that the mind itself brings the idea of cause to all experience.', 'orange'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'David Hume, An Enquiry Concerning Human Understanding (1748)');
      ctx.restore();
    },

    // From the state of nature to an agreed government (Hobbes, Locke).
    'social-contract'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5.5, 5.5, 5, 5.5, 5.5]);
      const N = 8; const ECY = Y0 + 418;
      const C = { home: [[X0 + 140, Y0 + 300], [X0 + 214, Y0 + 300], [X0 + 510, Y0 + 480], [X0 + 584, Y0 + 480], [X0 + 430, Y0 + 230], [X0 + 715, Y0 + 300], [X0 + 130, Y0 + 500], [X0 + 330, Y0 + 400]] };
      const RING = [[170, -85], [310, -40], [310, 75], [170, 115], [-170, 115], [-310, 75], [-310, -40], [-170, -85]];
      const ringPos = (j) => [cx + RING[j][0], ECY + RING[j][1]];
      const gather = S.i === 2 ? smooth((S.s - 0.2) / 2.2) : S.i > 2 ? 1 : 0;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The social contract');
      ctx.save(); ctx.globalAlpha *= S.lf;
      // The government, once agreed.
      const gov = S.i >= 3 ? after(S.i === 3 ? S.s : 9, 0.2, 0.8) : 0;
      if (gov > 0) {
        ctx.save(); ctx.globalAlpha *= gov;
        const gx = cx; const gy = Y0 + 128;
        ctx.fillStyle = tint('purple', 0.25); ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 3;
        poly(ctx, [gx - 92, gy + 18, gx, gy - 26, gx + 92, gy + 18], true); ctx.fill(); ctx.stroke();
        for (let j = 0; j < 4; j++) { ctx.fillRect(gx - 74 + j * 44, gy + 24, 16, 64); ctx.strokeRect(gx - 74 + j * 44, gy + 24, 16, 64); }
        ctx.fillRect(gx - 96, gy + 90, 192, 12); ctx.strokeRect(gx - 96, gy + 90, 192, 12);
        label(ctx, 'government', gx + 112, gy + 40, { size: 19, weight: 800, fill: 'purple', align: 'left' });
        arr(ctx, gx - 40, gy + 110, gx - 40, ECY - 50, 'green', 4); label(ctx, 'protection', gx - 52, gy + 150, { size: 18, weight: 700, fill: 'green', align: 'right' });
        arr(ctx, gx + 40, ECY - 50, gx + 40, gy + 110, 'yellow', 4); label(ctx, 'consent', gx + 52, gy + 150, { size: 18, weight: 700, fill: 'yellow', align: 'left' });
        ctx.restore();
      }
      // The contract scroll.
      if (gather > 0) {
        ctx.save(); ctx.globalAlpha *= gather;
        const w = 130 * gather;
        ctx.fillStyle = tint('yellow', 0.2); ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 2.5;
        ctx.fillRect(cx - w / 2, ECY - 34, w, 68); ctx.strokeRect(cx - w / 2, ECY - 34, w, 68);
        for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + sx * w / 2, ECY, 7, 38, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
        for (let j = 0; j < 4; j++) line(ctx, cx - w / 2 + 14, ECY - 20 + j * 13, cx + w / 2 - 14 - (j === 3 ? 30 : 0), ECY - 20 + j * 13, tint('yellow', 0.7), 2);
        label(ctx, 'rules', cx, ECY + 52, { size: 18, weight: 800, fill: 'yellow' });
        ctx.restore();
      }
      // The people.
      for (let j = 0; j < N; j++) {
        const [hx, hy] = C.home[j]; const [rx, ry] = ringPos(j);
        const x = lerp(hx, rx, gather); const y = lerp(hy, ry, gather);
        const fight = S.i === 0 && j < 4;
        const pair = j % 2 === 0 ? 1 : -1;
        const jx = fight ? Math.sin(k * 7 + j) * 6 : 0;
        let o = { face: x < cx ? 1 : -1 };
        if (fight) o = { face: pair, arms: 'push', lean: 0.15 };
        else if (gather >= 1) o = { face: x < cx ? 1 : -1, arms: S.i === 2 ? 'forward' : 'down' };
        person(ctx, x + jx, y, 74, S.i >= 3 ? 'green' : S.i === 0 ? (j < 4 ? 'red' : 'muted') : 'cyan', o);
        if (S.i === 2 && gather >= 1 && S.s > 2.6) line(ctx, x + (x < cx ? 26 : -26), y - 46, cx + (x < cx ? -60 : 60), ECY, tint('yellow', 0.5), 2, [4, 4]);
      }
      if (S.i === 0) {
        // Put each fighting pair face to face.
        for (let j = 0; j < 4; j += 2) { const [x1, y1] = C.home[j]; const [x2, y2] = C.home[j + 1]; ctx.save(); ctx.globalAlpha *= 0.6 + 0.4 * Math.sin(k * 9); label(ctx, '!', (x1 + x2) / 2, Math.min(y1, y2) - 90, { size: 30, weight: 800, fill: 'red' }); ctx.restore(); }
      }
      if (S.i === 1) {
        ctx.save(); ctx.globalAlpha *= after(S.s, 0.6);
        chip(ctx, 'life', cx - 190, Y0 + 92, 'cyan', 20); chip(ctx, 'liberty', cx, Y0 + 92, 'cyan', 20); chip(ctx, 'property', cx + 190, Y0 + 92, 'cyan', 20);
        ctx.restore();
      }
      if (S.i === 4) {
        ctx.save(); ctx.globalAlpha *= after(S.s, 0.3);
        chip(ctx, 'Hobbes: a strong ruler', X0 + 140, Y0 + 84, 'orange', 18); chip(ctx, 'Locke: rulers can be replaced', X1 - 150, Y0 + 84, 'cyan', 18);
        ctx.restore();
      }
      const CAP = [
        ['Hobbes: the state of nature', 'With no government, it would be a war of all against all, and life "solitary, poor, nasty, brutish, and short".', 'red'],
        ['Locke: natural rights', 'Locke was more hopeful: even in nature people have rights to life, liberty and property, but no fair judge to protect them.', 'cyan'],
        ['The agreement', 'So people agree: give up some freedom, accept shared rules, and set up a government to enforce them.', 'yellow'],
        ['Government by consent', 'The government protects people’s safety and rights. Its right to rule comes from their consent.', 'green'],
        ['How much power?', 'Hobbes wanted a strong ruler to keep the peace. Locke said if rulers break the deal, the people may replace them.', 'purple'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Thomas Hobbes, Leviathan (1651); John Locke, Two Treatises of Government (1689)');
      ctx.restore();
    },

    // Free will: falling dominoes, a forking path, and compatibilism between.
    'free-will'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5.5, 5.5, 6, 5]);
      const PY0 = Y0 + 66; const PH = 340;
      const lit = [S.i === 0 || S.i === 3, S.i === 1 || S.i === 3, S.i >= 2];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Free will and determinism');
      ctx.save(); ctx.globalAlpha *= S.lf;
      // Left: determinism, a chain of dominoes.
      ctx.save(); ctx.globalAlpha *= lit[0] ? 1 : 0.45;
      panel(ctx, X0 + 10, PY0, 380, PH, 'orange', lit[0] ? 0.1 : 0.04, 16);
      label(ctx, 'Determinism', X0 + 200, PY0 + 30, { size: 22, weight: 800, fill: 'orange' });
      const fallT = S.i === 0 ? S.s - 0.6 : 99; const GY = PY0 + 250; const DH = 74; const GAP = 32;
      for (let j = 0; j < 9; j++) {
        const x = X0 + 42 + j * GAP; const q = clamp((fallT - j * 0.28) / 0.35);
        const maxA = j === 8 ? Math.PI / 2 - 0.05 : Math.asin(Math.min(1, (GAP - 4) / DH));
        const a = q * maxA;
        ctx.save(); ctx.translate(x + 7, GY); ctx.rotate(a);
        ctx.fillStyle = tint('orange', 0.45); ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2;
        ctx.fillRect(-14, -DH, 14, DH); ctx.strokeRect(-14, -DH, 14, DH);
        ctx.restore();
      }
      line(ctx, X0 + 30, GY, X0 + 370, GY, 'muted', 2);
      para(ctx, 'Every event is caused by the events before it', X0 + 30, PY0 + 300, 340, 18, 'ink', 600, 2);
      ctx.restore();
      // Right: a path that forks.
      ctx.save(); ctx.globalAlpha *= lit[1] ? 1 : 0.45;
      panel(ctx, X0 + 410, PY0, 380, PH, 'cyan', lit[1] ? 0.1 : 0.04, 16);
      label(ctx, 'Free choice', X0 + 600, PY0 + 30, { size: 22, weight: 800, fill: 'cyan' });
      const FX = X0 + 600; const FB = PY0 + 268; const FJ = PY0 + 178; const L = [X0 + 500, PY0 + 70]; const Rr = [X0 + 700, PY0 + 70];
      const choice = S.n % 2;
      ctx.strokeStyle = tint('cyan', 0.7); ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(FX, FB); ctx.lineTo(FX, FJ); ctx.quadraticCurveTo(FX, FJ - 40, L[0], L[1]); ctx.moveTo(FX, FJ); ctx.quadraticCurveTo(FX, FJ - 40, Rr[0], Rr[1]); ctx.stroke();
      chip(ctx, 'stay in', L[0], L[1] - 4, choice === 0 && S.i === 1 && S.s > 3.2 ? 'green' : 'cyan', 18);
      chip(ctx, 'go out', Rr[0], Rr[1] - 4, choice === 1 && S.i === 1 && S.s > 3.2 ? 'green' : 'cyan', 18);
      let wx = FX; let wy = FB; let walking = false;
      if (S.i === 1) {
        if (S.s < 1.2) { wy = lerp(FB, FJ, S.s / 1.2); walking = true; }
        else if (S.s < 2.6) wy = FJ;
        else { const q = clamp((S.s - 2.6) / 1.4) * 0.4; const T = choice ? Rr : L; const mx = FX; const my = FJ - 40; wx = (1 - q) ** 2 * FX + 2 * (1 - q) * q * mx + q * q * T[0]; wy = (1 - q) ** 2 * FJ + 2 * (1 - q) * q * my + q * q * (T[1] + 30); walking = q < 0.4; }
      }
      person(ctx, wx, wy + 10, 54, 'yellow', walking ? { face: 1, walk: k * 10 } : { face: 1 });
      if (S.i === 1 && S.s >= 1.2 && S.s < 2.6) label(ctx, '?', wx + 30, wy - 66, { size: 28, weight: 800, fill: 'yellow' });
      para(ctx, 'I could have chosen otherwise', X0 + 430, PY0 + 300, 340, 18, 'ink', 600, 2);
      ctx.restore();
      // Bottom: compatibilism.
      ctx.save(); ctx.globalAlpha *= lit[2] ? after(S.i === 2 ? S.s : 9, 0, 0.5) : 0.4;
      panel(ctx, X0 + 10, Y0 + 420, FIG.w - 20, 138, 'green', lit[2] ? 0.1 : 0.04, 16);
      label(ctx, 'Compatibilism', cx, Y0 + 448, { size: 22, weight: 800, fill: 'green' });
      para(ctx, 'Your choice is free when it comes from your own reasons and wishes, with no one forcing you, even if those reasons have causes.', X0 + 40, Y0 + 508, FIG.w - 80, 19, 'ink', 600, 2);
      ctx.restore();
      const CAP = [
        ['Determinism', 'If every event is caused by earlier ones, your choices were set long ago, like falling dominoes. Hard determinists say free will is an illusion.', 'orange'],
        ['Free will', 'Libertarians about free will say we really could have chosen otherwise: some choices are not fixed in advance.', 'cyan'],
        ['A middle view', 'Compatibilists (Hume is one) say freedom means acting on your own reasons, unforced, even in a world of causes.', 'green'],
        ['Still an open question', 'Philosophers and scientists still disagree. Which view fits how your own choices feel to you?', 'yellow'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Hard determinism · libertarian free will · compatibilism');
      ctx.restore();
    },

    // Dualism (mind and body two different things) vs physicalism (the mind
    // is what the brain does), and the hard question each faces.
    'mind-body'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5.5, 5.5, 5.5, 5.5, 5]);
      const PY0 = Y0 + 66; const PH = 410;
      const C = it._c || (it._c = (() => {
        const nodes = []; for (let j = 0; j < 13; j++) { const a = rnd(j * 5) * TAU; const r = Math.sqrt(rnd(j * 5 + 1)); nodes.push([Math.cos(a) * r * 72, Math.sin(a) * r * 44]); }
        const edges = []; for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) if (Math.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1]) < 46) edges.push([i, j]);
        return { nodes, edges };
      })());
      const litL = S.i <= 1 || S.i === 4; const litR = S.i >= 2;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The mind–body problem');
      ctx.save(); ctx.globalAlpha *= S.lf;
      // Left: dualism.
      ctx.save(); ctx.globalAlpha *= litL ? 1 : 0.4;
      panel(ctx, X0 + 10, PY0, 380, PH, 'purple', litL ? 0.1 : 0.04, 16);
      label(ctx, 'Dualism', X0 + 200, PY0 + 30, { size: 22, weight: 800, fill: 'purple' });
      person(ctx, X0 + 110, PY0 + 360, 190, 'blue', { face: 1 });
      label(ctx, 'body (physical)', X0 + 110, PY0 + 388, { size: 18, weight: 700, fill: 'blue' });
      const mx = X0 + 290; const my = PY0 + 130;
      glow(ctx, COLORS.purple, 18);
      ctx.fillStyle = tint('purple', 0.3 + 0.08 * Math.sin(k * 2));
      ctx.beginPath(); for (let j = 0; j < 7; j++) { const a = (j / 7) * TAU; ctx.moveTo(mx + Math.cos(a) * 30 + 22, my + Math.sin(a) * 22); ctx.arc(mx + Math.cos(a) * 30, my + Math.sin(a) * 22, 22, 0, TAU); } ctx.fill();
      ctx.shadowBlur = 0;
      label(ctx, 'mind', mx, my, { size: 21, weight: 800, fill: 'ink' });
      label(ctx, '(non-physical)', mx, my - 58, { size: 18, weight: 600, fill: 'purple' });
      // Two-way arrows between mind and body.
      const ia = S.i === 1;
      ctx.strokeStyle = ia ? COLORS.yellow : tint('purple', 0.8); ctx.lineWidth = 3; ctx.setLineDash(ia ? [7, 6] : []);
      ctx.beginPath(); ctx.moveTo(mx - 40, my + 30); ctx.quadraticCurveTo(X0 + 200, PY0 + 150, X0 + 132, PY0 + 196); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X0 + 140, PY0 + 226); ctx.quadraticCurveTo(X0 + 230, PY0 + 230, mx - 10, my + 92); ctx.stroke(); ctx.setLineDash([]);
      arr(ctx, X0 + 146, PY0 + 188, X0 + 130, PY0 + 198, ia ? 'yellow' : 'purple', 3); arr(ctx, mx - 18, my + 100, mx - 8, my + 90, ia ? 'yellow' : 'purple', 3);
      label(ctx, 'wills', X0 + 214, PY0 + 152, { size: 18, weight: 700, fill: ia ? 'yellow' : 'purple' });
      label(ctx, 'senses', X0 + 240, PY0 + 254, { size: 18, weight: 700, fill: ia ? 'yellow' : 'purple' });
      if (ia) label(ctx, '?', X0 + 296, PY0 + 290, { size: 44, weight: 800, fill: 'yellow' });
      ctx.restore();
      // Right: physicalism, a head with a busy brain.
      ctx.save(); ctx.globalAlpha *= litR ? 1 : 0.4;
      panel(ctx, X0 + 410, PY0, 380, PH, 'cyan', litR ? 0.1 : 0.04, 16);
      label(ctx, 'Physicalism', X0 + 600, PY0 + 30, { size: 22, weight: 800, fill: 'cyan' });
      const hx = X0 + 590; const hy = PY0 + 200;
      ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 4; ctx.fillStyle = tint('cyan', 0.08);
      ctx.beginPath(); ctx.moveTo(hx - 40, hy + 150); ctx.lineTo(hx - 40, hy + 92); ctx.bezierCurveTo(hx - 120, hy + 60, hx - 115, hy - 100, hx, hy - 105);
      ctx.bezierCurveTo(hx + 95, hy - 108, hx + 115, hy - 20, hx + 98, hy + 18); ctx.lineTo(hx + 118, hy + 52); ctx.lineTo(hx + 96, hy + 58); ctx.lineTo(hx + 92, hy + 92); ctx.lineTo(hx + 50, hy + 96); ctx.lineTo(hx + 50, hy + 150);
      ctx.fill(); ctx.stroke();
      const bx = hx - 4; const by = hy - 36;
      ctx.fillStyle = tint('red', 0.16); ctx.strokeStyle = tint('red', 0.6); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(bx, by, 86, 56, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 1.5; for (const [ex, ey] of C.edges.map(([i, j]) => [i, j])) { const p = C.nodes[ex]; const q = C.nodes[ey]; line(ctx, bx + p[0], by + p[1], bx + q[0], by + q[1], tint('cyan', 0.35), 1.5); }
      C.edges.forEach(([i, j], m) => {
        const ph = mod(k * 1.3 + rnd(m) * 3, 1.6); if (ph > 1) return;
        const p = C.nodes[i]; const q = C.nodes[j]; dot(ctx, bx + lerp(p[0], q[0], ph), by + lerp(p[1], q[1], ph), 4.5, 'yellow');
      });
      for (const [px, py] of C.nodes) dot(ctx, bx + px, by + py, 5, 'cyan');
      label(ctx, 'mind = what the', X0 + 600, PY0 + 340, { size: 19, weight: 700, fill: 'ink' });
      label(ctx, 'brain does', X0 + 600, PY0 + 366, { size: 19, weight: 700, fill: 'ink' });
      if (S.i === 3) {
        ctx.save(); ctx.globalAlpha *= after(S.s, 0.5);
        bubble(ctx, X0 + 640, PY0 + 56, 140, 70, 'yellow', hx + 60, hy - 70, true);
        para(ctx, 'why does it feel like this?', X0 + 648, PY0 + 91, 124, 18, 'yellow', 700, 2);
        ctx.restore();
      }
      ctx.restore();
      if (S.i === 4) {
        ctx.save(); ctx.globalAlpha *= after(S.s, 0.4);
        chip(ctx, 'How do they interact?', X0 + 200, Y0 + 512, 'purple', 19); chip(ctx, 'Why is it felt?', X0 + 600, Y0 + 512, 'cyan', 19);
        ctx.restore();
      }
      const CAP = [
        ['Dualism', 'Descartes: the mind is a thinking, non-physical thing; the body is a physical machine. Two different kinds of thing.', 'purple'],
        ['The interaction problem', 'Princess Elisabeth of Bohemia asked Descartes: how can something non-physical push a physical body around?', 'yellow'],
        ['Physicalism', 'Physicalists say the mind is what the brain does: thoughts and feelings are brain activity.', 'cyan'],
        ['The hard problem', 'But why does brain activity feel like anything from the inside? David Chalmers called this the hard problem of consciousness.', 'yellow'],
        ['Two views, two puzzles', 'Each view has a hard question to answer. The debate continues in philosophy and neuroscience.', 'green'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'René Descartes (1641); Elisabeth of Bohemia (1643); David Chalmers (1995)');
      ctx.restore();
    },

    // Searle's Chinese room: perfect answers by rule-following, no understanding.
    'chinese-room'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [4.5, 5.5, 4.5, 6, 6]);
      const RX0 = X0 + 250; const RX1 = X0 + 560; const RY0 = Y0 + 110; const RY1 = Y0 + 440;
      const Q = '你好吗？'; const A = '我很好！';
      const note = (x, y, text, c) => {
        ctx.fillStyle = 'rgba(240,244,255,0.92)'; ctx.strokeStyle = color(c); ctx.lineWidth = 2;
        rounded(ctx, x - 50, y - 20, 100, 40, 6); ctx.fill(); ctx.stroke();
        label(ctx, text, x, y + 1, { size: 22, weight: 700, fill: DARK });
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The Chinese room');
      ctx.save(); ctx.globalAlpha *= S.lf;
      // The room, its slots, and the people outside.
      ctx.fillStyle = 'rgba(120,130,170,0.12)'; ctx.fillRect(RX0, RY0, RX1 - RX0, RY1 - RY0);
      ctx.strokeStyle = 'rgba(200,215,255,0.8)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(RX0, RY0); ctx.lineTo(RX1, RY0); ctx.lineTo(RX1, RY0 + 210); ctx.moveTo(RX1, RY0 + 242); ctx.lineTo(RX1, RY1); ctx.lineTo(RX0, RY1); ctx.lineTo(RX0, RY0 + 222); ctx.moveTo(RX0, RY0 + 190); ctx.lineTo(RX0, RY0); ctx.stroke();
      label(ctx, 'in', RX0 - 16, RY0 + 170, { size: 18, weight: 700, fill: 'muted', align: 'right' });
      label(ctx, 'out', RX1 + 16, RY0 + 262, { size: 18, weight: 700, fill: 'muted', align: 'left' });
      person(ctx, X0 + 110, RY1, 130, 'cyan', { face: 1, arms: S.i === 0 && S.s < 1.5 ? 'give' : 'down' });
      person(ctx, X0 + 700, RY1, 130, 'cyan', { face: -1, arms: S.i >= 2 ? 'up' : 'down' });
      label(ctx, 'Chinese speakers', X0 + 405, RY1 + 40, { size: 18, weight: 700, fill: 'cyan' });
      // Inside: a desk, the rule book, the man.
      ctx.fillStyle = 'rgba(255,159,67,0.3)'; ctx.fillRect(RX0 + 120, RY0 + 250, 170, 12);
      line(ctx, RX0 + 135, RY0 + 262, RX0 + 135, RY1, 'orange', 4); line(ctx, RX0 + 275, RY0 + 262, RX0 + 275, RY1, 'orange', 4);
      person(ctx, RX0 + 80, RY1, 120, 'yellow', { sit: true, face: 1, arms: 'forward' });
      const bookLit = S.i === 1;
      if (bookLit) glow(ctx, COLORS.green, 14);
      ctx.fillStyle = tint('green', 0.35); ctx.strokeStyle = COLORS.green; ctx.lineWidth = 2.5;
      poly(ctx, [RX0 + 160, RY0 + 250, RX0 + 205, RY0 + 240, RX0 + 250, RY0 + 250, RX0 + 250, RY0 + 222, RX0 + 205, RY0 + 212, RX0 + 160, RY0 + 222], true); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0; line(ctx, RX0 + 205, RY0 + 212, RX0 + 205, RY0 + 240, 'green', 2);
      label(ctx, 'rule book', RX0 + 205, RY0 + 196, { size: 18, weight: 700, fill: 'green' });
      // The question comes in, the answer goes out.
      if (S.i === 0) { const q = smooth((S.s - 0.6) / 2.4); note(lerp(X0 + 160, RX0 + 150, q), lerp(RY0 + 240, RY0 + 206, Math.min(1, q * 1.4)), Q, 'cyan'); }
      if (S.i === 1) {
        note(RX0 + 100, RY0 + 160, Q, 'cyan');
        ctx.save(); ctx.globalAlpha *= after(S.s, 0.5);
        bubble(ctx, RX0 + 14, RY0 + 14, 282, 96, 'green');
        label(ctx, 'Rule 4,812:', RX0 + 30, RY0 + 38, { size: 18, weight: 800, fill: 'green', align: 'left' });
        rich(ctx, [['if you see ', 'ink'], [Q, 'cyan']], RX0 + 30, RY0 + 64, 19, 600, 'left');
        rich(ctx, [['send back ', 'ink'], [A, 'yellow']], RX0 + 30, RY0 + 90, 19, 600, 'left');
        ctx.restore();
        ctx.save(); ctx.globalAlpha *= after(S.s, 2.6);
        chip(ctx, '"No idea what it means!"', cx + 5, RY1 + 84, 'yellow', 19);
        ctx.restore();
      }
      if (S.i === 2) { const q = smooth((S.s - 0.3) / 2.2); note(lerp(RX0 + 230, X0 + 660, q), RY0 + 226, A, 'yellow'); if (q >= 1) tick(ctx, X0 + 740, RY0 + 150, 18, 'green', 6); }
      if (S.i >= 3) {
        ctx.save(); ctx.globalAlpha *= after(S.s, 0.4);
        chip(ctx, 'inside: symbols (syntax)', cx + 5, RY0 + 40, 'yellow', 19);
        chip(ctx, 'outside: meaning (semantics)', cx + 5, RY1 + 84, 'cyan', 19);
        ctx.restore();
      }
      if (S.i === 4) {
        ctx.save(); ctx.globalAlpha *= after(S.s, 0.4) * (0.6 + 0.4 * Math.sin(k * 3));
        ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
        rounded(ctx, RX0 - 30, RY0 - 26, RX1 - RX0 + 60, RY1 - RY0 + 46, 18); ctx.stroke(); ctx.setLineDash([]);
        ctx.restore();
        ctx.save(); ctx.globalAlpha *= after(S.s, 0.8);
        label(ctx, 'the whole system?', RX1 - 6, RY0 - 44, { size: 19, weight: 800, fill: 'purple', align: 'right' });
        ctx.restore();
      }
      const CAP = [
        ['The room', 'A man who knows no Chinese sits in a closed room. Questions written in Chinese are passed in through a slot.', 'cyan'],
        ['The rule book', 'He follows a huge rule book: "if you see these symbols, send back those symbols". He matches shapes, nothing more.', 'green'],
        ['Perfect answers', 'Outside, the answers are perfect. It seems that someone in the room understands Chinese.', 'yellow'],
        ['Searle’s point', 'Following rules for symbols (syntax) is not understanding them (semantics). A computer running a program is like the man.', 'yellow'],
        ['The replies', 'The "systems reply": perhaps the whole room understands, not the man. Searle disagreed. The debate matters for AI today.', 'purple'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'John Searle, "Minds, Brains, and Programs" (1980)');
      ctx.restore();
    },

    // ─── Ways to live ────────────────────────────────────────────────────

    // The Stoics: what I control, what I can influence, what I can't control.
    'stoic-control'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [4.5, 4.5, 4.5, 5.5, 5.5]);
      const CX = X0 + 530; const CY = Y0 + 318;
      const RINGS = [
        { r: 260, c: 'purple', name: 'I can’t control', items: [['the weather', 0, -222], ['other people’s opinions', 0, 222], ['the past', -216, 0], ['luck', 218, 0]] },
        { r: 180, c: 'cyan', name: 'I can influence', items: [['my grades', 0, -142], ['friendships', 0, 142], ['skills', -140, 0], ['health', 140, 0]] },
        { r: 100, c: 'green', name: 'I control', items: [['my choices', 0, -36], ['my effort', 0, 0], ['my attitude', 0, 36]] },
      ];
      const showN = [2, 1, 0]; // ring j (outer first) appears in stage showN[j]
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The Stoics: what is up to you?');
      ctx.save(); ctx.globalAlpha *= S.lf;
      RINGS.forEach((R, j) => {
        const on = S.i >= showN[j]; const cur = S.i === showN[j] || (S.i === 3 && j === 2);
        ctx.save(); ctx.globalAlpha *= on ? 1 : 0.35;
        if (cur && j === 2 && S.i === 3) glow(ctx, COLORS.green, 18 + 8 * Math.sin(k * 3));
        ctx.fillStyle = tint(R.c, cur ? 0.2 : 0.1); ctx.beginPath(); ctx.arc(CX, CY, R.r, 0, TAU); ctx.fill();
        ring(ctx, CX, CY, R.r, tint(R.c, cur ? 1 : 0.6), cur ? 3 : 2); ctx.shadowBlur = 0;
        ctx.restore();
      });
      RINGS.forEach((R, j) => {
        if (S.i < showN[j]) return;
        R.items.forEach(([text, dx, dy], m) => {
          const a = S.i === showN[j] ? after(S.s, 0.3 + m * 0.4) : 1;
          ctx.save(); ctx.globalAlpha *= a * (S.i === 3 && j < 2 ? 0.55 : 1);
          label(ctx, text, CX + dx, CY + dy + (1 - a) * 10, { size: j === 2 ? 20 : 19, weight: j === 2 ? 800 : 700, fill: R.c === 'purple' ? 'ink' : R.c });
          ctx.restore();
        });
      });
      // Worry drifting in from outside and turning into effort at the centre.
      if (S.i === 3) {
        for (let j = 0; j < 10; j++) {
          const ph = mod(k * 0.35 + j / 10, 1); const a = (j / 10) * TAU + 0.3; const r = lerp(250, 40, smooth(ph));
          dot(ctx, CX + Math.cos(a) * r, CY + Math.sin(a) * r * 0.95, 6, ph > 0.7 ? 'green' : 'purple');
        }
      }
      // The legend on the left.
      [['I control', 'green', 0], ['I can influence', 'cyan', 1], ['I can’t control', 'purple', 2]].forEach(([name, c, s], j) => {
        const y = Y0 + 120 + j * 52; const on = S.i >= s || S.i >= 3;
        ctx.save(); ctx.globalAlpha *= on ? 1 : 0.35;
        dot(ctx, X0 + 32, y, 10, c); label(ctx, name, X0 + 50, y, { size: 19, weight: 700, fill: c, align: 'left' });
        ctx.restore();
      });
      if (S.i === 4) {
        ctx.save(); ctx.globalAlpha *= after(S.s, 0.3);
        para(ctx, '“Some things are within our power, while others are not.”', X0 + 20, Y0 + 400, 220, 20, 'yellow', 700, 4, 'left');
        label(ctx, '— Epictetus', X0 + 20, Y0 + 486, { size: 18, weight: 600, fill: 'muted', align: 'left' });
        ctx.restore();
      }
      const CAP = [
        ['What I control', 'My own choices, effort and attitude are fully up to me.', 'green'],
        ['What I can influence', 'I can affect my grades, skills or friendships, but they don’t depend on me alone.', 'cyan'],
        ['What I can’t control', 'The weather, the past, luck and other people’s opinions are not up to me.', 'purple'],
        ['Where to put your energy', 'The Stoics: worrying about what you can’t control is wasted. Put your effort into your own choices.', 'green'],
        ['Epictetus', 'Epictetus split things into two: up to us, or not. The middle ring of influence is a modern addition to his idea.', 'yellow'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Stoicism: Epictetus (Enchiridion), Seneca, Marcus Aurelius');
      ctx.restore();
    },

    // Yin and yang turning (Laozi's balance of opposites) and Confucius's
    // harmony in relationships.
    'yin-yang-harmony'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5.5, 5, 6, 5.5]);
      const YX = X0 + 205; const YY = Y0 + 290; const R = 140;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Harmony: Laozi and Confucius');
      ctx.save(); ctx.globalAlpha *= S.lf;
      // The symbol, turning slowly.
      ctx.save(); ctx.translate(YX, YY); ctx.rotate(k * 0.4);
      glow(ctx, COLORS.cyan, 12);
      ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(233,238,255,0.88)';
      ctx.beginPath(); ctx.arc(0, 0, R, -Math.PI / 2, Math.PI / 2); ctx.arc(0, R / 2, R / 2, Math.PI / 2, -Math.PI / 2, false); ctx.arc(0, -R / 2, R / 2, Math.PI / 2, -Math.PI / 2, true); ctx.closePath(); ctx.fill();
      ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(0, R / 2, R / 7, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(233,238,255,0.88)'; ctx.beginPath(); ctx.arc(0, -R / 2, R / 7, 0, TAU); ctx.fill();
      ring(ctx, 0, 0, R, 'rgba(200,215,255,0.9)', 3);
      ctx.restore();
      label(ctx, 'yin: dark, soft, still', YX, YY + R + 34, { size: 19, weight: 700, fill: 'purple' });
      label(ctx, 'yang: bright, firm, active', YX, YY + R + 62, { size: 19, weight: 700, fill: 'yellow' });
      const RX = X0 + 420; const RW = 360;
      if (S.i <= 1) {
        label(ctx, 'Laozi: opposites need each other', RX + RW / 2, Y0 + 96, { size: 20, weight: 800, fill: 'cyan' });
        const PAIRS = [['light', 'dark'], ['active', 'still'], ['hard', 'soft'], ['full', 'empty']];
        PAIRS.forEach(([a, bb], j) => {
          const y = Y0 + 160 + j * 84; const ap = S.i === 0 ? after(S.s, 0.3 + j * 0.5) : 1; const hi = S.i === 1 && j === 2;
          ctx.save(); ctx.globalAlpha *= ap * (S.i === 1 && !hi ? 0.5 : 1);
          chip(ctx, a, RX + 70, y, 'yellow', 20); chip(ctx, bb, RX + RW - 70, y, 'purple', 20);
          const sw = Math.sin(k * 2 + j) * 6;
          arr(ctx, RX + 140 + sw, y - 7, RX + RW - 140 + sw, y - 7, 'muted', 3); arr(ctx, RX + RW - 140 - sw, y + 7, RX + 140 - sw, y + 7, 'muted', 3);
          ctx.restore();
        });
        if (S.i === 1) {
          ctx.save(); ctx.globalAlpha *= after(S.s, 0.6);
          // Water drops wearing a stone.
          const sx = RX + 100; const sy = Y0 + 512;
          ctx.fillStyle = 'rgba(147,160,196,0.5)'; ctx.beginPath(); ctx.ellipse(sx, sy, 60, 18, 0, Math.PI, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(5,8,22,0.9)'; ctx.beginPath(); ctx.ellipse(sx, sy - 2, 12 + 6 * clamp(S.s / 5), 5, 0, 0, TAU); ctx.fill();
          for (let j = 0; j < 3; j++) { const ph = mod(k * 1.2 + j / 3, 1); dot(ctx, sx, sy - 70 + ph * 66, 5, 'cyan'); }
          para(ctx, 'water wears away stone', sx + 80, sy - 36, 150, 18, 'cyan', 700, 2, 'left');
          ctx.restore();
        }
      } else {
        label(ctx, 'Confucius: harmony in relationships', RX + RW / 2, Y0 + 96, { size: 20, weight: 800, fill: 'green' });
        const RELS = [['ruler', 'subject', 'fairness', 'loyalty'], ['parent', 'child', 'kindness', 'respect'], ['friend', 'friend', 'trust', 'trust']];
        RELS.forEach(([a, bb, da, db], j) => {
          const fy = Y0 + 210 + j * 128; const ap = S.i === 2 ? after(S.s, 0.3 + j * 0.7) : 1;
          ctx.save(); ctx.globalAlpha *= ap;
          const ha = j === 1 ? 74 : 64; const hb = j === 1 ? 50 : 64;
          person(ctx, RX + 30, fy, ha, 'teal', { face: 1, arms: 'give' }); person(ctx, RX + RW - 30, fy, hb, 'orange', { face: -1, arms: 'give' });
          label(ctx, a, RX + 30, fy + 20, { size: 18, weight: 700, fill: 'teal' }); label(ctx, bb, RX + RW - 30, fy + 20, { size: 18, weight: 700, fill: 'orange' });
          arr(ctx, RX + 74, fy - 50, RX + RW - 74, fy - 50, tint('teal', 0.8), 3); arr(ctx, RX + RW - 74, fy - 28, RX + 74, fy - 28, tint('orange', 0.8), 3);
          label(ctx, da, RX + RW / 2, fy - 68, { size: 18, weight: 700, fill: 'teal' }); label(ctx, db, RX + RW / 2, fy - 10, { size: 18, weight: 700, fill: 'orange' });
          ctx.restore();
        });
        if (S.i === 3) {
          ctx.save(); ctx.globalAlpha *= after(S.s, 0.3);
          chip(ctx, 'ren: humane care', RX + RW / 2 - 90, Y0 + 548, 'green', 18); chip(ctx, 'li: proper conduct', RX + RW / 2 + 92, Y0 + 548, 'green', 18);
          ctx.restore();
        }
      }
      const CAP = [
        ['Laozi: balance of opposites', 'In the Daodejing, opposites depend on each other and keep turning into each other. Each half of the symbol holds a seed of the other.', 'cyan'],
        ['The soft and the hard', 'Laozi praised softness: water is gentle, yet it wears away stone. Harmony is balance, not one side winning.', 'cyan'],
        ['Confucius: relationships', 'Society is in harmony when each relationship is lived well, with each side caring for the other in its own way.', 'green'],
        ['Two paths to harmony', 'Confucians stress learning, roles and ritual; Daoists prefer natural, effortless action (wu wei). Critics note the old roles could be unequal.', 'yellow'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Laozi, Daodejing; Confucius, Analects: classical Chinese philosophy');
      ctx.restore();
    },

    // You at 5, 15, 40 and 80: what makes you the same person? (Locke, Reid)
    'personal-identity'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5.5, 5.5, 6, 6]);
      const AGES = [[5, 64, 'yellow', 'my red ball'], [15, 116, 'cyan', 'a big exam'], [40, 138, 'green', 'my first job'], [80, 124, 'purple', 'grandchildren']];
      const fx = (j) => X0 + 115 + j * 190; const FY = Y0 + 430; const BY = Y0 + 196;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Personal identity: are you the same person?');
      ctx.save(); ctx.globalAlpha *= S.lf;
      line(ctx, X0 + 30, FY + 2, X1 - 30, FY + 2, 'muted', 2);
      AGES.forEach(([age, h, c, mem], j) => {
        const a = S.i === 0 ? after(S.s, 0.3 + j * 0.6) : 1;
        ctx.save(); ctx.globalAlpha *= a;
        const x = fx(j);
        person(ctx, x, FY, h, c, j === 3 ? { face: 1, lean: 0.12 } : { face: 1 });
        if (j === 3) line(ctx, x + 26, FY - 70, x + 30, FY, 'muted', 4);
        label(ctx, `age ${age}`, x, FY + 26, { size: 20, weight: 800, fill: c });
        // A memory bubble.
        bubble(ctx, x - 78, BY - 26, 156, 52, c, x, FY - h - 6, true);
        label(ctx, mem, x, BY, { size: 18, weight: 700, fill: c });
        ctx.restore();
      });
      // Memory links: each age remembers the one before.
      if (S.i >= 1) {
        for (let j = 1; j < 4; j++) {
          const a = S.i === 1 ? after(S.s, 0.4 + (j - 1) * 0.7) : 1; if (a <= 0) continue;
          ctx.save(); ctx.globalAlpha *= a;
          const x1 = fx(j) - 40; const x0 = fx(j - 1) + 40;
          ctx.strokeStyle = COLORS.green; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x1, BY - 28); ctx.quadraticCurveTo((x0 + x1) / 2, BY - 82, x0, BY - 28); ctx.stroke();
          arr(ctx, x0 + 12, BY - 40, x0, BY - 28, 'green', 3);
          label(ctx, 'remembers', (x0 + x1) / 2, BY - 72, { size: 18, weight: 700, fill: 'green' });
          ctx.restore();
        }
      }
      if (S.i === 2) {
        ctx.save(); ctx.globalAlpha *= after(S.s, 0.4);
        ctx.strokeStyle = COLORS.red; ctx.lineWidth = 3; ctx.setLineDash([8, 8]);
        ctx.beginPath(); ctx.moveTo(fx(3), FY + 42); ctx.bezierCurveTo(fx(3) - 40, Y0 + 562, fx(0) + 40, Y0 + 562, fx(0), FY + 42); ctx.stroke(); ctx.setLineDash([]);
        arr(ctx, fx(0) + 10, FY + 56, fx(0), FY + 42, 'red', 3);
        chip(ctx, 'at 80: can’t remember being 5', cx, Y0 + 538, 'red', 18);
        ctx.restore();
      }
      if (S.i === 3) {
        ctx.save(); ctx.globalAlpha *= after(S.s, 0.3);
        chip(ctx, 'same living body', X0 + 150, Y0 + 520, 'cyan', 19);
        chip(ctx, 'chain of memories', cx + 10, Y0 + 520, 'green', 19);
        chip(ctx, 'no fixed self?', X1 - 130, Y0 + 520, 'purple', 19);
        ctx.restore();
      } else if (S.i === 0) {
        ctx.save(); ctx.globalAlpha *= after(S.s, 3);
        chip(ctx, 'new size, new looks, most cells replaced', cx, Y0 + 520, 'muted', 19);
        ctx.restore();
      }
      void k;
      const CAP = [
        ['One life, four ages', 'You at 5, 15, 40 and 80: a different size, different looks, most of your cells replaced. Are you still the same person?', 'cyan'],
        ['Locke: memory', 'John Locke: you are the same person as far back as your memories reach. At 15 you remember being 5.', 'green'],
        ['Reid’s puzzle', 'Thomas Reid: at 80 you may not remember being 5. Yet 80 remembers 40, who remembers 15, who remembers 5. Is that enough?', 'red'],
        ['Other answers', 'Some say you are the same living body. Others say overlapping memories are enough. Hume and Parfit doubted there is one fixed self.', 'purple'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'John Locke, Essay Concerning Human Understanding (1694 edition)');
      ctx.restore();
    },

    // Sartre's paper knife vs a person who makes themselves; Camus's Sisyphus.
    existentialism(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5.5, 6.5, 5.5, 8]);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Existentialism');
      ctx.save(); ctx.globalAlpha *= S.lf;
      const knife = (x, y, sc, c, dashed) => {
        ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
        ctx.strokeStyle = color(c); ctx.fillStyle = dashed ? 'rgba(0,0,0,0)' : tint(c, 0.35); ctx.lineWidth = 3 / sc;
        if (dashed) ctx.setLineDash([8 / sc, 6 / sc]);
        poly(ctx, [-90, -8, 40, -10, 90, 0, 40, 10, -90, 8], true); ctx.fill(); ctx.stroke();
        rounded(ctx, -140, -12, 50, 24, 8); ctx.fill(); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
      };
      if (S.i <= 2) {
        // Top: the paper knife, designed before it exists.
        const top = S.i === 0 ? 1 : 0.45;
        ctx.save(); ctx.globalAlpha *= top;
        panel(ctx, X0 + 20, Y0 + 70, 330, 190, 'blue', 0.1, 14);
        label(ctx, 'the design', X0 + 185, Y0 + 98, { size: 19, weight: 800, fill: 'blue' });
        knife(X0 + 210, Y0 + 160, 0.9, 'blue', true);
        label(ctx, 'purpose: cut paper', X0 + 185, Y0 + 226, { size: 18, weight: 700, fill: 'ink' });
        const made = S.i === 0 ? after(S.s, 1.6, 0.8) : 1;
        arr(ctx, X0 + 368, Y0 + 165, X0 + 368 + 70 * made, Y0 + 165, 'muted', 4);
        ctx.save(); ctx.globalAlpha *= made; knife(X0 + 640, Y0 + 165, 0.95, 'cyan', false); label(ctx, 'then it is made', X0 + 610, Y0 + 226, { size: 18, weight: 700, fill: 'cyan' }); ctx.restore();
        ctx.restore();
        label(ctx, 'essence first, then existence', cx, Y0 + 284, { size: 19, weight: 700, fill: S.i === 0 ? 'blue' : 'muted' });
        // Bottom: a person who exists first and shapes themselves by choices.
        const bot = S.i >= 1 ? 1 : 0.35;
        ctx.save(); ctx.globalAlpha *= bot;
        const PY = Y0 + 470; const xs = [X0 + 70, X0 + 250, X0 + 440, X0 + 630, X0 + 760];
        const ys = [PY, PY - 40, PY + 6, PY - 46, PY - 10];
        ctx.strokeStyle = tint('green', 0.7); ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(xs[0], ys[0]); for (let j = 1; j < 5; j++) ctx.lineTo(xs[j], ys[j]); ctx.stroke();
        ctx.strokeStyle = 'rgba(147,160,196,0.35)'; ctx.lineWidth = 4; ctx.setLineDash([6, 8]);
        ctx.beginPath(); for (let j = 1; j < 4; j++) { ctx.moveTo(xs[j], ys[j]); ctx.lineTo(xs[j] + 90, ys[j] + (j % 2 ? 62 : -62)); } ctx.stroke(); ctx.setLineDash([]);
        const TRAITS = [['kind', 'green'], ['curious', 'cyan'], ['brave', 'orange']];
        const prog = S.i === 1 ? clamp((S.s - 0.4) / 4.6) * 4 : S.i === 2 ? 4 : 0;
        const seg = Math.min(3, Math.floor(prog)); const f = prog - seg;
        const wx = lerp(xs[seg], xs[seg + 1], f); const wy = lerp(ys[seg], ys[seg + 1], f);
        TRAITS.forEach(([tr, c], j) => { if (prog >= j + 1) chip(ctx, tr, xs[j + 1], ys[j + 1] - 104, c, 19); });
        person(ctx, S.i >= 1 ? wx : xs[0], (S.i >= 1 ? wy : ys[0]) - 3, 72, 'yellow', S.i === 1 && prog < 4 ? { face: 1, walk: k * 10 } : { face: 1 });
        if (S.i === 2) {
          ctx.save(); ctx.globalAlpha *= after(S.s, 0.6);
          ctx.fillStyle = 'rgba(147,160,196,0.45)';
          ctx.fillRect(xs[1] + 40, ys[1] + 50, 14, 46); ctx.fillRect(xs[3] + 40, ys[3] - 92, 14, 46);
          label(ctx, 'your situation', xs[1] + 62, ys[1] + 76, { size: 18, weight: 700, fill: 'muted', align: 'left' });
          ctx.restore();
        }
        ctx.restore();
        label(ctx, 'existence first, then essence', cx, Y0 + 548, { size: 19, weight: 700, fill: S.i >= 1 ? 'green' : 'muted' });
      } else {
        // Sisyphus and his boulder, forever.
        const A = [X0 + 70, Y0 + 520]; const B = [X0 + 620, Y0 + 170];
        ctx.fillStyle = 'rgba(120,130,170,0.25)'; poly(ctx, [A[0], A[1], B[0], B[1], X1 - 30, B[1], X1 - 30, A[1] + 30, A[0], A[1] + 30], true); ctx.fill();
        line(ctx, A[0], A[1], B[0], B[1], 'rgba(220,230,255,0.8)', 4); line(ctx, B[0], B[1], X1 - 30, B[1], 'rgba(220,230,255,0.8)', 4);
        const per = 6.5; const u = mod(S.s, per);
        let q; let ph = 'push';
        if (u < 4) q = lerp(0.08, 0.92, smooth(u / 4)); else if (u < 5) { q = lerp(0.92, 0.04, ((u - 4) / 1) ** 2); ph = 'roll'; } else { q = 0.04; ph = 'walk'; }
        const ang = Math.atan2(B[1] - A[1], B[0] - A[0]); const nx = Math.sin(ang); const ny = -Math.cos(ang);
        const bx = lerp(A[0], B[0], q) - nx * 38; const by = lerp(A[1], B[1], q) + ny * 38 - 0;
        ctx.fillStyle = tint('muted', 0.55); ctx.strokeStyle = COLORS.muted; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(bx, by, 38, 0, TAU); ctx.fill(); ctx.stroke();
        const pq = ph === 'walk' ? lerp(0.92, 0.0, (u - 5) / 1.5) - 0.08 : ph === 'roll' ? 0.92 - 0.08 : q - 0.08;
        const sx = lerp(A[0], B[0], Math.max(0.01, pq)); const sy = lerp(A[1], B[1], Math.max(0.01, pq));
        person(ctx, sx, sy, 96, 'yellow', ph === 'push' ? { face: 1, lean: 0.45, arms: 'push', walk: u * 6 } : ph === 'walk' ? { face: -1, walk: u * 8 } : { face: -1, arms: 'up' });
        label(ctx, 'Sisyphus', X0 + 690, Y0 + 130, { size: 20, weight: 800, fill: 'yellow' });
        chip(ctx, '“One must imagine Sisyphus happy.”', X0 + 520, Y0 + 470, 'yellow', 20);
      }
      const CAP = [
        ['A tool is made for a purpose', 'Sartre’s example: a paper knife is designed first. Its essence (what it is for) comes before it exists.', 'blue'],
        ['A person exists first', 'For people it is the other way round: existence precedes essence. We exist first, then make ourselves through our choices.', 'green'],
        ['Free, and responsible', 'Sartre: we are "condemned to be free", with no excuses. Simone de Beauvoir stressed that our situation limits which choices are open.', 'orange'],
        ['Camus and Sisyphus', 'Camus: the world gives us no ready-made meaning (the absurd). Sisyphus pushes his boulder for ever, yet we can imagine him happy.', 'yellow'],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      ctx.restore();
      footer(ctx, 'Sartre (1946), Simone de Beauvoir (1949), Albert Camus, The Myth of Sisyphus (1942)');
      ctx.restore();
    },
  };
}
