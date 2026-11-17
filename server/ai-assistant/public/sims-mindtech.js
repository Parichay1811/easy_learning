// Simulations for psychology and modern technology: how we learn
// (classical and operant conditioning, social learning), how groups and
// authority sway us (Asch, Milgram), how children develop (Piaget, the
// Strange Situation), how we think and feel (biases, Maslow, the stress
// response), how psychologists test ideas (experiment design); and how the
// technology around us works (chatbots predicting the next word, GPS,
// search engines, social feeds, passwords, pixels, qubits, VR and AR).
// Each is a function of time (t since it appeared, b.clock for the loop),
// so any moment can be drawn: plain canvas calls, a few glows, no state
// between frames beyond constants cached on the item. MINDTECH_SIMS says
// what each one is for, so a lesson's words can pick the right picture.

export const MINDTECH_SIMS = {
  // Psychology
  'classical-conditioning': { title: 'Classical conditioning', keywords: ['classical conditioning', "pavlov's dogs", 'pavlov dog', 'conditioned stimulus', 'conditioned response', 'unconditioned stimulus', 'neutral stimulus', 'learning by association'], example: {} },
  'operant-conditioning': { title: 'Operant conditioning', keywords: ['operant conditioning', 'skinner box', 'positive reinforcement', 'negative reinforcement', 'positive punishment', 'negative punishment', 'reinforcement and punishment'], example: {} },
  'social-learning': { title: 'Social learning theory', keywords: ['social learning theory', 'bobo doll', 'observational learning', 'learning by watching', 'role model', 'vicarious reinforcement', 'bandura'], example: {} },
  'asch-conformity': { title: 'Asch conformity study', keywords: ['asch conformity', 'asch line study', 'asch experiment', 'conformity experiment', 'peer pressure', 'group pressure', 'normative social influence'], example: {} },
  'milgram-obedience': { title: 'Milgram obedience study', keywords: ['milgram', 'obedience to authority', 'obedience study', 'electric shock experiment', 'authority figure', '450 volts'], example: {} },
  'piaget-stages': { title: "Piaget's stages of development", keywords: ["piaget's stages", 'piaget stages', 'cognitive development', 'sensorimotor stage', 'preoperational stage', 'concrete operational', 'formal operational', 'conservation task'], example: {} },
  'attachment-styles': { title: 'Attachment styles', keywords: ['attachment styles', 'attachment theory', 'strange situation', 'secure attachment', 'insecure-avoidant', 'insecure-resistant', 'ainsworth', 'bowlby'], example: {} },
  'cognitive-biases': { title: 'Cognitive biases', keywords: ['cognitive bias', 'cognitive biases', 'confirmation bias', 'anchoring bias', 'anchoring effect', 'availability heuristic', 'mental shortcuts'], example: {} },
  'maslow-needs': { title: "Maslow's hierarchy of needs", keywords: ["maslow's hierarchy", 'hierarchy of needs', 'maslow', 'self-actualisation', 'self-actualization', 'physiological needs', 'esteem needs'], example: {} },
  'stress-response': { title: 'The stress response', keywords: ['stress response', 'fight or flight', 'fight-or-flight', 'adrenaline and cortisol', 'cortisol', 'adrenal glands', 'hpa axis', 'sympathetic nervous system'], example: {} },
  'experiment-design': { title: 'Designing an experiment', keywords: ['independent variable', 'dependent variable', 'control variable', 'control variables', 'control group', 'random allocation', 'fair test', 'experimental group'], example: { question: 'Does caffeine speed up reaction time?' } },
  // Technology
  'chatbot-next-word': { title: 'How a chatbot writes', keywords: ['next word prediction', 'predicts the next word', 'large language model', 'language model', 'how chatbots work', 'chatgpt', 'ai chatbot', 'next token'], example: { prompt: 'The cat sat on the' } },
  'gps-trilateration': { title: 'How GPS finds you', keywords: ['gps', 'trilateration', 'satellite navigation', 'gps satellites', 'global positioning system', 'sat nav'], example: {} },
  'search-engine': { title: 'How a search engine works', keywords: ['search engine', 'search engines', 'web crawler', 'pagerank', 'search results', 'how google works', 'search index'], example: { query: 'pizza recipe' } },
  'social-feed': { title: 'How a social media feed is chosen', keywords: ['social media feed', 'social media algorithm', 'recommendation algorithm', 'filter bubble', 'echo chamber', 'news feed', 'for you page'], example: {} },
  'password-strength': { title: 'Password strength', keywords: ['password strength', 'strong password', 'brute force attack', 'passphrase', 'password cracking', 'secure password'], example: {} },
  'pixels-images': { title: 'Pixels and digital images', keywords: ['pixels', 'pixel', 'digital image', 'image resolution', 'rgb colour', 'rgb color', 'bitmap image', 'megapixel'], example: {} },
  'qubit-superposition': { title: 'Qubits and superposition', keywords: ['qubit', 'qubits', 'quantum computer', 'quantum computing', 'superposition', 'quantum bit', 'bloch sphere'], example: {} },
  'vr-ar': { title: 'Virtual and augmented reality', keywords: ['virtual reality', 'augmented reality', 'vr headset', 'mixed reality', 'ar app', 'vr and ar'], example: {} },
};

export function mindtechSims(kit) {
  // eslint-disable-next-line no-unused-vars
  const { FIG, COLORS, HUES, FONT, glow, label, wrapLabel, rounded, arrow, clamp, easeOut, outBack, color, tint } = kit;
  const X0 = FIG.x; const Y0 = FIG.y; const X1 = FIG.x + FIG.w; const Y1 = FIG.y + FIG.h;
  const cx = X0 + FIG.w / 2; const cy = Y0 + FIG.h / 2;
  const TAU = Math.PI * 2;
  const LINE = 'rgba(220,230,255,0.8)'; const FAINT = 'rgba(140,170,255,0.18)'; const DARK = '#070b1d';
  const MONO = 'ui-monospace, Menlo, Consolas, monospace';

  // Small tools: numbers, timing, loops.
  const val = (v, d) => { const n = Number(v); return v !== null && v !== undefined && v !== '' && Number.isFinite(n) ? n : d; };
  const mod = (a, n) => ((a % n) + n) % n;
  const smooth = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
  const lerp = (a, c, p) => a + (c - a) * p;
  const fade = (ctx, t, d = 0.5) => { const q = easeOut(clamp(t / d)); ctx.globalAlpha *= q; return q; };
  const after = (t, at, d = 0.4) => easeOut(clamp((t - at) / d));
  const cycle = (t, period, delay = 0.6) => (t < delay ? 0 : mod(t - delay, period));
  const loopN = (t, period, delay = 0.6) => (t < delay ? 0 : Math.floor((t - delay) / period));
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const commas = (n) => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const str = (v, d) => (typeof v === 'string' && v.trim() ? v.trim() : d);
  // Fades a looping picture out and in around the loop's seam.
  const seam = (ctx, t, u, P, d = 0.35) => { ctx.globalAlpha *= Math.min(clamp((P - u) / d), t < P ? 1 : clamp(u / d)); };
  // Which stage of a timeline [d0, d1, ...] time u falls in, and how far in.
  function stage(u, ds) {
    let s = 0;
    for (let i = 0; i < ds.length; i++) { if (u < s + ds[i] || i === ds.length - 1) return { k: i, f: clamp((u - s) / ds[i]), s: u - s }; s += ds[i]; }
    return { k: 0, f: 0, s: 0 };
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
  function poly(ctx, pts, close = false) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    if (close) ctx.closePath();
  }
  function panel(ctx, x, y, w, h, c = 'blue', a = 0.08, r = 16) {
    ctx.fillStyle = tint(c, a); ctx.strokeStyle = tint(c, 0.6); ctx.lineWidth = 2;
    rounded(ctx, x, y, w, h, r); ctx.fill(); ctx.stroke();
  }
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
  // The biggest font size (not below 18) at which text fits in maxW.
  function fit(ctx, text, maxW, size = 22, weight = 700) {
    for (; size > 18; size--) { ctx.font = `${weight} ${size}px ${FONT}`; if (ctx.measureText(String(text)).width <= maxW) break; }
    return size;
  }
  // A speech (or thought) bubble centred on x, y with a tail to tx, ty.
  function bubble(ctx, text, x, y, c = 'ink', size = 19, tx, ty, think = false) {
    text = String(text);
    ctx.font = `700 ${size}px ${FONT}`;
    const w = ctx.measureText(text).width + 28; const h = size + 18; const l = x - w / 2; const top = y - h / 2;
    ctx.fillStyle = 'rgba(6,10,26,0.92)'; ctx.strokeStyle = tint(c, 0.8); ctx.lineWidth = 2;
    if (tx !== undefined) {
      const below = ty > y; const by = below ? top + h : top; const bx = clamp(tx, l + 18, l + w - 18);
      if (think) {
        for (let i = 1; i <= 2; i++) { const q = i / 3; ctx.beginPath(); ctx.arc(lerp(bx, tx, q), lerp(by, ty, q), 6 - i * 1.6, 0, TAU); ctx.fill(); ctx.stroke(); }
      } else {
        ctx.beginPath(); ctx.moveTo(bx - 9, by); ctx.lineTo(lerp(bx, tx, 0.75), lerp(by, ty, 0.75)); ctx.lineTo(bx + 9, by); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    rounded(ctx, l, top, w, h, think ? h / 2 : 12); ctx.fill(); ctx.stroke();
    label(ctx, text, x, y + 1, { size, weight: 700, fill: c });
    return w;
  }
  // A simple standing (or seated) person, feet at (x, y), about 116·s tall.
  // Arm angles are from straight down; positive swings to screen-right.
  function person(ctx, x, y, s = 1, c = 'cyan', o = {}) {
    const { armL = -0.3, armR = 0.3, face = 'neutral', coat = false, seated = false, dir = 1, tear = 0, look = 0 } = o;
    const col = color(c); const lw = Math.max(2, 4.5 * s);
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = col; ctx.lineWidth = lw;
    const hipY = y - 44 * s; const shY = y - 80 * s;
    ctx.beginPath();
    if (seated) {
      ctx.moveTo(x - 4 * s, hipY); ctx.lineTo(x + 26 * s * dir, hipY); ctx.lineTo(x + 26 * s * dir, y);
      ctx.moveTo(x + 4 * s, hipY + 2 * s); ctx.lineTo(x + 32 * s * dir, hipY + 2 * s); ctx.lineTo(x + 32 * s * dir, y);
    } else {
      ctx.moveTo(x - 6 * s, hipY); ctx.lineTo(x - 13 * s, y); ctx.moveTo(x + 6 * s, hipY); ctx.lineTo(x + 13 * s, y);
    }
    ctx.stroke();
    const L = 38 * s; ctx.beginPath();
    ctx.moveTo(x - 11 * s, shY + 4 * s); ctx.lineTo(x - 11 * s + Math.sin(armL) * L, shY + 4 * s + Math.cos(armL) * L);
    ctx.moveTo(x + 11 * s, shY + 4 * s); ctx.lineTo(x + 11 * s + Math.sin(armR) * L, shY + 4 * s + Math.cos(armR) * L);
    ctx.stroke();
    ctx.lineWidth = Math.max(1.5, 2.5 * s);
    ctx.fillStyle = DARK; rounded(ctx, x - 14 * s, shY - 4 * s, 28 * s, (coat ? 54 : 42) * s, 9 * s); ctx.fill();
    ctx.fillStyle = coat ? 'rgba(225,232,250,0.6)' : tint(c, 0.34); ctx.fill(); ctx.stroke();
    const hy = y - 101 * s; const hr = 15 * s;
    ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(x, hy, hr, 0, TAU); ctx.fill();
    ctx.fillStyle = tint(c, 0.38); ctx.fill(); ctx.stroke();
    if (s >= 0.45) {
      const ex = look * 3 * s;
      ctx.fillStyle = COLORS.ink;
      for (const sx of [-5, 5]) { ctx.beginPath(); ctx.arc(x + sx * s + ex, hy - 2 * s, 1.9 * s, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = COLORS.ink; ctx.lineWidth = Math.max(1.4, 1.8 * s); ctx.beginPath();
      if (face === 'happy') ctx.arc(x + ex, hy + 2 * s, 6 * s, 0.2 * Math.PI, 0.8 * Math.PI);
      else if (face === 'sad' || face === 'cry') ctx.arc(x + ex, hy + 11 * s, 5.5 * s, 1.2 * Math.PI, 1.8 * Math.PI);
      else if (face === 'shout') { ctx.ellipse(x + ex, hy + 7 * s, 3.5 * s, 4 * s, 0, 0, TAU); }
      else { ctx.moveTo(x - 4 * s + ex, hy + 7 * s); ctx.lineTo(x + 4 * s + ex, hy + 7 * s); }
      ctx.stroke();
      if (face === 'cry') {
        ctx.fillStyle = COLORS.cyan;
        for (const sx of [-6, 6]) { const ty = hy + 2 * s + mod(tear + (sx > 0 ? 0.5 : 0), 1) * 14 * s; ctx.beginPath(); ctx.arc(x + sx * s + ex, ty, 2.2 * s, 0, TAU); ctx.fill(); }
      }
    }
    ctx.restore();
    return { hx: x, hy, hr, hand: (side) => (side > 0 ? [x + 11 * s + Math.sin(armR) * L, shY + 4 * s + Math.cos(armR) * L] : [x - 11 * s + Math.sin(armL) * L, shY + 4 * s + Math.cos(armL) * L]) };
  }
  // A heart shape centred on x, y, about 2·r wide.
  function heartPath(ctx, x, y, r) {
    ctx.beginPath(); ctx.moveTo(x, y + r * 0.9);
    ctx.bezierCurveTo(x - r * 1.3, y, x - r * 0.9, y - r * 1.1, x, y - r * 0.4);
    ctx.bezierCurveTo(x + r * 0.9, y - r * 1.1, x + r * 1.3, y, x, y + r * 0.9);
    ctx.closePath();
  }
  // Graph axes in a box with ticks [[fraction, text]] on each axis.
  function axes(ctx, g, { xTicks = [], yTicks = [], xName = '', yName = '' } = {}) {
    ctx.strokeStyle = 'rgba(140,170,255,0.12)'; ctx.lineWidth = 1; ctx.beginPath();
    for (const [f] of yTicks) { const y = g.y + g.h - f * g.h; ctx.moveTo(g.x, y); ctx.lineTo(g.x + g.w, y); }
    ctx.stroke();
    arrow(ctx, g.x, g.y + g.h, g.x + g.w + 14, g.y + g.h, 'rgba(200,215,255,0.7)', 2.5);
    arrow(ctx, g.x, g.y + g.h, g.x, g.y - 14, 'rgba(200,215,255,0.7)', 2.5);
    for (const [f, s] of yTicks) label(ctx, String(s), g.x - 10, g.y + g.h - f * g.h, { size: 18, weight: 500, fill: 'muted', align: 'right' });
    for (const [f, s] of xTicks) label(ctx, String(s), g.x + f * g.w, g.y + g.h + 20, { size: 18, weight: 500, fill: 'muted' });
    if (yName) label(ctx, yName, g.x + 10, g.y - 14, { size: 18, weight: 600, fill: 'muted', align: 'left' });
    if (xName) label(ctx, xName, g.x + g.w + 10, g.y + g.h + 24, { size: 18, weight: 600, fill: 'muted', align: 'right' });
  }
  // A stylised dog facing right, feet at (x, y); returns its mouth.
  function dog(ctx, x, y, s, c) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color(c);
    ctx.lineWidth = 7 * s; ctx.beginPath();
    for (const lx of [-46, -30, 30, 46]) { ctx.moveTo(x + lx * s, y - 44 * s); ctx.lineTo(x + lx * s, y); }
    ctx.stroke();
    ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.moveTo(x - 62 * s, y - 64 * s); ctx.quadraticCurveTo(x - 92 * s, y - 80 * s, x - 86 * s, y - 106 * s); ctx.stroke();
    ctx.lineWidth = 3 * s;
    const blob = (draw) => { ctx.beginPath(); draw(); ctx.fillStyle = DARK; ctx.fill(); ctx.fillStyle = tint(c, 0.26); ctx.fill(); ctx.stroke(); };
    blob(() => ctx.ellipse(x, y - 60 * s, 68 * s, 27 * s, 0, 0, TAU));
    blob(() => ctx.ellipse(x + 76 * s, y - 94 * s, 26 * s, 24 * s, 0, 0, TAU));
    blob(() => ctx.ellipse(x + 104 * s, y - 86 * s, 19 * s, 11 * s, 0, 0, TAU));
    ctx.beginPath(); ctx.ellipse(x + 62 * s, y - 100 * s, 9 * s, 20 * s, 0.5, 0, TAU); ctx.fillStyle = tint(c, 0.55); ctx.fill(); ctx.stroke();
    dot(ctx, x + 121 * s, y - 89 * s, 4.5 * s, 'ink');
    dot(ctx, x + 86 * s, y - 102 * s, 3.2 * s, 'ink');
    ctx.restore();
    return { mx: x + 110 * s, my: y - 76 * s };
  }

  return {
    // ─── Psychology ───────────────────────────────────────────────────────

    // Pavlov: food makes a dog drool; a bell paired with food comes to do it alone.
    'classical-conditioning'(b, ctx, it, t) {
      const P = 18; const u = cycle(t, P, 0.6);
      const ph = u < 4 ? 0 : u < 7.5 ? 1 : u < 13 ? 2 : 3;
      const q = u - [0, 4, 7.5, 13][ph];
      let bell = 0; let food = 0; let drool = 0; let trial = 0;
      if (ph === 0) { food = after(q, 0.4, 0.35) * (1 - after(q, 3.3, 0.4)); drool = smooth((q - 1) / 0.8) * (1 - smooth((q - 3.1) / 0.6)); }
      else if (ph === 1) { bell = q > 0.4 && q < 2.9 ? 1 : 0; }
      else if (ph === 2) { trial = Math.min(3, Math.floor(q / 1.83) + 1); const f = q - (trial - 1) * 1.83; bell = f < 1.2 ? 1 : 0; food = after(f, 0.3, 0.25) * (1 - after(f, 1.45, 0.25)); drool = smooth((f - 0.55) / 0.4) * (1 - smooth((f - 1.45) / 0.3)); }
      else { bell = q > 0.5 && q < 3.2 ? 1 : 0; drool = smooth((q - 1.1) / 0.8) * (1 - smooth((q - 4.3) / 0.5)); }
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || "Classical conditioning: Pavlov's dogs");
      const act = [0, 0, 1, 2][ph];
      ['Before', 'During', 'After'].forEach((s, i) => { ctx.save(); ctx.globalAlpha *= i === act ? 1 : 0.4; chip(ctx, s, cx + (i - 1) * 230, Y0 + 84, i === act ? ['cyan', 'purple', 'green'][i] : 'muted', 21); ctx.restore(); });
      for (let i = 0; i < 2; i++) arr(ctx, cx + (i - 1) * 230 + 62, Y0 + 84, cx + i * 230 - 62, Y0 + 84, tint('muted', 0.6), 3);
      // The dog, the bowl and the bell.
      const floor = Y0 + 440;
      line(ctx, X0 + 30, floor + 2, X0 + 600, floor + 2, FAINT, 3);
      const m = dog(ctx, X0 + 190, floor, 1.4, 'orange');
      ctx.save(); ctx.globalAlpha *= food;
      ctx.fillStyle = tint('red', 0.7); ctx.beginPath(); ctx.ellipse(X0 + 430, floor - 34, 30, 14, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = tint('blue', 0.35); ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(X0 + 378, floor - 30); ctx.lineTo(X0 + 482, floor - 30); ctx.lineTo(X0 + 466, floor); ctx.lineTo(X0 + 394, floor); ctx.closePath(); ctx.fill(); ctx.stroke();
      label(ctx, 'Food', X0 + 430, floor + 26, { size: 20, weight: 700, fill: 'red' });
      ctx.restore();
      const bx = X0 + 520; const by = Y0 + 190; const sw = bell ? 0.35 * Math.sin(b.clock * 16) : 0;
      line(ctx, bx - 40, by - 50, bx + 40, by - 50, 'muted', 4); line(ctx, bx, by - 50, bx, by - 36, 'muted', 3);
      ctx.save(); ctx.translate(bx, by - 36); ctx.rotate(sw);
      ctx.fillStyle = bell ? tint('yellow', 0.5) : tint('yellow', 0.18); ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-10, 4); ctx.quadraticCurveTo(-28, 10, -30, 50); ctx.lineTo(30, 50); ctx.quadraticCurveTo(28, 10, 10, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      dot(ctx, 0, 58, 7, 'yellow');
      ctx.restore();
      if (bell) {
        ctx.strokeStyle = tint('yellow', 0.8); ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) { const r = 50 + i * 16 + mod(b.clock * 40, 16); for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(bx, by, r, sd < 0 ? Math.PI - 0.45 : -0.45, sd < 0 ? Math.PI + 0.45 : 0.45); ctx.stroke(); } }
      }
      label(ctx, 'Bell', bx, by + 70, { size: 20, weight: 700, fill: 'yellow' });
      // Saliva: drops from the mouth and a meter.
      if (drool > 0.2) {
        for (let i = 0; i < 3; i++) {
          const p = mod(b.clock * 1.4 + i / 3, 1); const y = lerp(m.my + 6, floor - 4, p * p);
          ctx.save(); ctx.globalAlpha *= drool * (1 - p * 0.6); ctx.fillStyle = COLORS.cyan;
          ctx.beginPath(); ctx.ellipse(m.mx - 4, y, 4.5, 7, 0, 0, TAU); ctx.fill(); ctx.restore();
        }
      }
      const mx = X0 + 660; const mt = Y0 + 160; const mh = 270;
      label(ctx, 'Saliva', mx, Y0 + 132, { size: 20, weight: 700, fill: 'cyan' });
      ctx.fillStyle = DARK; ctx.strokeStyle = tint('cyan', 0.7); ctx.lineWidth = 2.5; rounded(ctx, mx - 24, mt, 48, mh, 14); ctx.fill(); ctx.stroke();
      const lvl = 0.04 + drool * 0.9;
      ctx.fillStyle = tint('cyan', 0.6); rounded(ctx, mx - 18, mt + mh - 6 - lvl * (mh - 12), 36, lvl * (mh - 12), 10); ctx.fill();
      label(ctx, 'lots', mx + 34, mt + 16, { size: 18, weight: 500, fill: 'muted', align: 'left' });
      label(ctx, 'none', mx + 34, mt + mh - 14, { size: 18, weight: 500, fill: 'muted', align: 'left' });
      const L1 = ['Food → salivation', 'Bell → no salivation', 'Bell + food → salivation', 'Bell alone → salivation!'][ph];
      const L2 = ['unconditioned stimulus → unconditioned response (a reflex)', 'the bell is a neutral stimulus: it means nothing yet', `pairing, trial ${trial}: the dog links the bell with food`, 'conditioned stimulus → conditioned response (learned)'][ph];
      const c = ['red', 'muted', 'purple', 'green'][ph];
      label(ctx, L1, cx, Y0 + 530, { size: 28, weight: 800, fill: c });
      label(ctx, L2, cx, Y0 + 574, { size: 20, weight: 500, fill: 'ink' });
      label(ctx, "Pavlov's dogs: learning by association", cx, Y0 + 640, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // A Skinner box: presses earn food, so they come faster; the four consequences.
    'operant-conditioning'(b, ctx, it, t) {
      const P = 14; const u = cycle(t, P, 0.6);
      const C = it._c || (it._c = (() => { const ts = []; let x = 1.3; let d = 2.0; while (x < 12.6) { ts.push(x); x += d; d = Math.max(0.42, d * 0.76); } return { ts }; })());
      const { ts } = C;
      let n = 0; while (n < ts.length && ts[n] <= u) n++;
      const prev = n ? ts[n - 1] : 0; const next = n < ts.length ? ts[n] : P + 1.2;
      const qq = clamp((u - prev) / (next - prev)); const away = Math.min(1, (next - prev) / 2.2) * Math.sin(qq * Math.PI);
      let rear = 0; for (const tp of ts) rear = Math.max(rear, 1 - Math.abs(u - tp) / 0.28);
      rear = smooth(rear);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Operant conditioning: the Skinner box');
      // The box.
      const L = X0 + 20; const T = Y0 + 80; const W = 380; const H = 300; const floor = T + H - 34;
      panel(ctx, L, T, W, H, 'blue', 0.06);
      label(ctx, 'Skinner box', L + 20, T + 28, { size: 20, weight: 700, fill: 'blue', align: 'left' });
      label(ctx, `presses: ${n}`, L + W - 18, T + 28, { size: 20, weight: 700, fill: 'cyan', align: 'right' });
      ctx.strokeStyle = 'rgba(140,170,255,0.35)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let x = L + 20; x < L + W - 10; x += 22) { ctx.moveTo(x, floor); ctx.lineTo(x + 10, floor + 12); }
      ctx.stroke(); line(ctx, L + 10, floor, L + W - 10, floor, LINE, 2.5);
      // Lever, light, chute and tray on the right wall.
      const wx = L + W; const press = rear > 0.6 ? 1 : 0;
      const lit = n && u - prev < 0.45;
      if (lit) { ctx.fillStyle = tint('yellow', 0.25); ctx.beginPath(); ctx.arc(wx - 30, T + 90, 30, 0, TAU); ctx.fill(); }
      dot(ctx, wx - 30, T + 90, 12, lit ? 'yellow' : DARK); ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(wx - 30, T + 90, 12, 0, TAU); ctx.stroke();
      line(ctx, wx - 4, T + 200, wx - 44, T + 200 + press * 12, 'ink', 6);
      label(ctx, 'lever', wx - 50, T + 176, { size: 18, weight: 600, fill: 'muted', align: 'right' });
      ctx.fillStyle = tint('orange', 0.3); ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2;
      rounded(ctx, wx - 62, floor - 14, 54, 14, 4); ctx.fill(); ctx.stroke();
      if (n && u - prev < 1.0) {
        const pq = clamp((u - prev - 0.1) / 0.3); const py = lerp(T + 130, floor - 20, pq * pq);
        ctx.save(); ctx.globalAlpha *= clamp((1.0 - (u - prev)) / 0.25); dot(ctx, wx - 35, py, 7, 'orange');
        if (pq >= 1) label(ctx, 'food!', wx - 35, floor - 46, { size: 19, weight: 800, fill: 'orange' });
        ctx.restore();
      }
      // The rat: wanders off, comes back, rears up to press.
      const rx = L + 270 - 170 * away;
      ctx.save(); ctx.translate(rx, floor); ctx.rotate(-rear * 0.78);
      ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(2, -10); ctx.quadraticCurveTo(-30, 2, -58, -12); ctx.stroke();
      ctx.fillStyle = DARK; ctx.beginPath(); ctx.ellipse(32, -17, 34, 16, 0, 0, TAU); ctx.fill(); ctx.fillStyle = tint('ink', 0.3); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(70, -21, 15, 10, 0.15, 0, TAU); ctx.fillStyle = DARK; ctx.fill(); ctx.fillStyle = tint('ink', 0.3); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(60, -33, 7, 0, TAU); ctx.fillStyle = tint('red', 0.45); ctx.fill(); ctx.stroke();
      dot(ctx, 74, -24, 2.4, 'ink'); dot(ctx, 85, -20, 3, 'red');
      ctx.beginPath(); ctx.moveTo(50, -2); ctx.lineTo(54, 0); ctx.moveTo(18, -2); ctx.lineTo(14, 0); ctx.stroke();
      ctx.restore();
      // Cumulative record: the line gets steeper as presses come faster.
      const g = { x: X0 + 480, y: Y0 + 120, w: 280, h: 220 };
      axes(ctx, g, { xName: 'time', yName: 'total presses' });
      ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 3.5; ctx.beginPath();
      let px = g.x; let py = g.y + g.h; ctx.moveTo(px, py);
      for (let i = 0; i < n; i++) { px = g.x + (ts[i] / P) * g.w; ctx.lineTo(px, py); py -= g.h / ts.length; ctx.lineTo(px, py); }
      ctx.lineTo(g.x + (Math.min(u, P) / P) * g.w, py); ctx.stroke();
      if (n > ts.length * 0.6) label(ctx, 'steeper = pressing faster', g.x + 16, g.y + 22, { size: 18, weight: 600, fill: 'cyan', align: 'left' });
      // The four consequences.
      const CELLS = [['Positive reinforcement', 'add something good → does it more', 'green', 'A food pellet for pressing → presses more'], ['Negative reinforcement', 'remove something bad → does it more', 'teal', 'Pressing switches off a loud noise → presses more'], ['Positive punishment', 'add something bad → does it less', 'orange', 'A telling-off after misbehaving → does it less'], ['Negative punishment', 'lose something good → does it less', 'red', 'Phone taken away after misbehaving → does it less']];
      const k = Math.floor(cycle(t, 12, 1) / 3) % 4;
      CELLS.forEach(([name, sub, c], i) => {
        const x = X0 + 10 + (i % 2) * 395; const y = Y0 + 418 + Math.floor(i / 2) * 96;
        ctx.save(); ctx.globalAlpha *= (i === k ? 1 : 0.5) * after(t, 0.5 + i * 0.15);
        panel(ctx, x, y, 385, 86, c, i === k ? 0.2 : 0.06, 14);
        label(ctx, name, x + 192, y + 27, { size: 21, weight: 800, fill: c });
        label(ctx, sub, x + 192, y + 60, { size: 18, weight: 500, fill: 'ink' });
        ctx.restore();
      });
      label(ctx, CELLS[k][3], cx, Y0 + 634, { size: 20, weight: 700, fill: CELLS[k][2] });
      label(ctx, 'B. F. Skinner: behaviour is shaped by its consequences', cx, Y0 + 672, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Bandura's Bobo doll: a child watches a model hit the doll, then copies.
    'social-learning'(b, ctx, it, t) {
      const P = 16; const u = cycle(t, P, 0.6);
      const F = Y0 + 380; const bx = X0 + 570;
      const AH = [1.4, 2.8, 4.2, 5.6]; const CH = [11.0, 12.1, 13.2];
      const armFor = (hits) => { let a = 0.35; for (const h of hits) { const d = u - h; if (d > -0.45 && d < 0) a = lerp(0.35, 2.7, smooth((d + 0.45) / 0.3)); else if (d >= 0 && d < 0.6) a = lerp(1.55, 0.35, smooth((d - 0.12) / 0.4)); } return a; };
      let tilt = 0; for (const h of [...AH, ...CH]) if (u > h) tilt += 0.42 * Math.exp(-(u - h) * 2.2) * Math.sin((u - h) * 8);
      const k = u < 7 ? 0 : u < 9.6 ? 1 : u < 13.8 ? 2 : 3;
      ctx.save(); fade(ctx, t); seam(ctx, t, u, P);
      title(ctx, it.label || "Social learning: Bandura's Bobo doll");
      chip(ctx, u < 7.5 ? '1. Watching a model' : '2. Later, alone with the doll', cx, Y0 + 84, u < 7.5 ? 'cyan' : 'orange', 21);
      line(ctx, X0 + 30, F + 2, X1 - 30, F + 2, FAINT, 3);
      // Bobo: a weighted clown that rocks back up.
      ctx.save(); ctx.translate(bx, F); ctx.rotate(tilt);
      ctx.lineWidth = 3; ctx.strokeStyle = COLORS.red;
      ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(0, -46, 46, 0, TAU); ctx.fill(); ctx.fillStyle = tint('red', 0.4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(0, -118, 27, 0, TAU); ctx.fill(); ctx.fillStyle = tint('ink', 0.25); ctx.fill(); ctx.stroke();
      dot(ctx, 0, -114, 6, 'red'); dot(ctx, -9, -124, 2.6, 'ink'); dot(ctx, 9, -124, 2.6, 'ink');
      ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -112, 11, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
      ctx.restore();
      label(ctx, 'Bobo doll', bx + 60, F - 150, { size: 19, weight: 700, fill: 'red', align: 'left' });
      // The adult model, with a mallet.
      const aA = clamp(1 - (u - 7) / 0.8);
      if (aA > 0) {
        ctx.save(); ctx.globalAlpha *= aA;
        const arm = armFor(AH);
        const pp = person(ctx, X0 + 455, F, 1.3, 'purple', { armR: arm, face: u > 1 && u < 6.5 ? 'shout' : 'neutral', look: 1 });
        const [hx, hy] = pp.hand(1); const ang = Math.PI / 2 - arm;
        ctx.save(); ctx.translate(hx, hy); ctx.rotate(-ang);
        line(ctx, 0, 0, 34, 0, 'ink', 4);
        ctx.fillStyle = tint('orange', 0.6); ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2; rounded(ctx, 30, -12, 16, 24, 4); ctx.fill(); ctx.stroke();
        ctx.restore();
        label(ctx, 'adult model', X0 + 455, F + 30, { size: 19, weight: 700, fill: 'purple' });
        ctx.restore();
      }
      // The child: watches, remembers, then walks over and copies.
      const chx = lerp(X0 + 140, X0 + 488, smooth((u - 9.6) / 1.2));
      if (u < 7) { ctx.save(); ctx.globalAlpha *= 0.6; line(ctx, X0 + 154, F - 86, X0 + 440, F - 128, 'cyan', 2, [6, 7]); ctx.restore(); }
      person(ctx, chx, F, 0.85, 'cyan', { armR: armFor(CH), face: u > 10.8 && u < 13.6 ? 'shout' : 'neutral', look: 1 });
      label(ctx, 'child', chx, F + 30, { size: 19, weight: 700, fill: 'cyan' });
      if (u > 7 && u < 9.8) {
        ctx.save(); ctx.globalAlpha *= after(u, 7.1) * clamp((9.8 - u) / 0.3);
        ctx.fillStyle = 'rgba(6,10,26,0.92)'; ctx.strokeStyle = tint('purple', 0.8); ctx.lineWidth = 2;
        for (const [x, y, r] of [[X0 + 160, F - 110, 5], [X0 + 175, F - 132, 8]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke(); }
        ctx.beginPath(); ctx.ellipse(X0 + 230, F - 190, 72, 46, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = tint('red', 0.5); ctx.beginPath(); ctx.arc(X0 + 252, F - 178, 15, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(X0 + 252, F - 204, 9, 0, TAU); ctx.fill();
        person(ctx, X0 + 214, F - 164, 0.4, 'purple', { armR: 1.6 });
        ctx.restore();
      }
      // Bandura's four processes.
      const PR = [['Attention', 'cyan'], ['Retention', 'purple'], ['Reproduction', 'orange'], ['Motivation', 'green']];
      PR.forEach(([s, c], i) => { ctx.save(); ctx.globalAlpha *= i === k ? 1 : 0.4; chip(ctx, s, cx + (i - 1.5) * 196, Y0 + 452, i === k ? c : 'muted', 19); ctx.restore(); });
      for (let i = 0; i < 3; i++) arr(ctx, cx + (i - 1.5) * 196 + 80, Y0 + 452, cx + (i - 0.5) * 196 - 80, Y0 + 452, tint('muted', 0.6), 3);
      const CAP = [['Attention: the child watches closely', 'the adult hits and shouts at the Bobo doll'], ['Retention: the child remembers what they saw', 'a mental picture of the actions is stored'], ['Reproduction: the child can copy the actions', 'children who saw aggression often copied it'], ['Motivation: a reason to copy', 'seeing a model rewarded makes copying more likely']];
      label(ctx, CAP[k][0], cx, Y0 + 522, { size: 22, weight: 700, fill: PR[k][1] });
      label(ctx, CAP[k][1], cx, Y0 + 560, { size: 20, weight: 500, fill: 'ink' });
      label(ctx, "Bandura's Bobo doll study (1961): learning by watching others", cx, Y0 + 636, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Asch: which line matches? The actors all give the same wrong answer.
    'asch-conformity'(b, ctx, it, t) {
      const P = 17; const u = cycle(t, P, 0.6); const conform = loopN(t, P, 0.6) % 2 === 0;
      ctx.save(); fade(ctx, t); seam(ctx, t, u, P);
      title(ctx, it.label || "Asch's conformity study");
      // The two cards.
      const base = Y0 + 262;
      panel(ctx, X0 + 40, Y0 + 72, 210, 230, 'ink', 0.05, 12);
      label(ctx, 'Standard line', X0 + 145, Y0 + 98, { size: 19, weight: 700, fill: 'ink' });
      line(ctx, X0 + 145, base, X0 + 145, base - 110, 'ink', 7);
      panel(ctx, X0 + 290, Y0 + 72, 470, 230, 'ink', 0.05, 12);
      label(ctx, 'Comparison lines', X0 + 525, Y0 + 98, { size: 19, weight: 700, fill: 'ink' });
      const LS = [['A', 80], ['B', 110], ['C', 145]];
      LS.forEach(([n, h], i) => {
        const x = X0 + 400 + i * 125; const good = n === 'B' && u > 9.3;
        line(ctx, x, base, x, base - h, good ? 'green' : 'ink', 7);
        label(ctx, n, x + 26, base - 12, { size: 22, weight: 800, fill: good ? 'green' : 'muted' });
      });
      // Seven people around a table; number six is the only real participant.
      const PT = 5; const ty = Y0 + 452;
      const ansAt = (i) => (i < PT ? 1.0 + i * 0.8 : i === PT ? 7.6 : 8.4);
      for (let i = 0; i < 7; i++) {
        const x = X0 + 100 + i * 100; const me = i === PT; const c = me ? 'cyan' : 'purple';
        ctx.fillStyle = DARK; ctx.strokeStyle = color(c); ctx.lineWidth = 2.5;
        rounded(ctx, x - 26, ty - 46, 52, 40, 14); ctx.fill(); ctx.fillStyle = tint(c, 0.3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(x, ty - 66, 18, 0, TAU); ctx.fill(); ctx.fillStyle = tint(c, 0.4); ctx.fill(); ctx.stroke();
        if (u > ansAt(i)) {
          const said = me ? (conform ? 'A' : 'B') : 'A';
          ctx.save(); ctx.globalAlpha *= after(u, ansAt(i), 0.25);
          bubble(ctx, said, x, Y0 + 340, me ? (conform ? 'orange' : 'green') : 'red', 21, x, ty - 86);
          ctx.restore();
        } else if (me && u > 5.0) {
          ctx.save(); ctx.globalAlpha *= after(u, 5.0, 0.3);
          bubble(ctx, '?', x, Y0 + 340, 'cyan', 21, x, ty - 86, true);
          ctx.restore();
        }
      }
      ctx.fillStyle = tint('blue', 0.25); ctx.strokeStyle = tint('blue', 0.7); ctx.lineWidth = 2; rounded(ctx, X0 + 50, ty - 8, 700, 14, 6); ctx.fill(); ctx.stroke();
      label(ctx, 'actors (confederates)', X0 + 300, ty + 30, { size: 18, weight: 600, fill: 'purple' });
      label(ctx, 'real participant', X0 + 600, ty + 30, { size: 18, weight: 700, fill: 'cyan' });
      // Captions, then the results.
      if (u < 9.4) {
        const cap = u < 5 ? ['Everyone answers out loud, in turn', 'the answer is clearly B, yet every actor says A']
          : u < 7.6 ? ["The participant's dilemma", 'trust your own eyes, or go along with the group?']
            : conform ? ['Goes along with the group: “A”', 'wanting to fit in can beat what we see'] : ['Stays independent: “B”', 'about a quarter of people never conformed at all'];
        label(ctx, cap[0], cx, Y0 + 535, { size: 24, weight: 700, fill: u < 7.6 ? 'ink' : conform ? 'orange' : 'green' });
        label(ctx, cap[1], cx, Y0 + 575, { size: 20, weight: 500, fill: 'muted' });
      } else {
        const R = [['Conformed at least once', 0.75, '75%', 'orange'], ['Conforming answers (critical trials)', 0.37, '37%', 'red'], ['Alone, with no group', 0.01, 'under 1%', 'green']];
        R.forEach(([s, p, v, c], i) => {
          const y = Y0 + 522 + i * 40; const a = after(u, 9.5 + i * 0.5, 0.5);
          ctx.save(); ctx.globalAlpha *= a;
          label(ctx, s, X0 + 40, y, { size: 19, weight: 600, fill: 'ink', align: 'left' });
          ctx.fillStyle = tint(c, 0.15); rounded(ctx, X0 + 440, y - 12, 260, 24, 8); ctx.fill();
          ctx.fillStyle = tint(c, 0.75); rounded(ctx, X0 + 440, y - 12, Math.max(4, 260 * p * a), 24, 8); ctx.fill();
          label(ctx, v, X0 + 450 + Math.max(4, 260 * p * a), y, { size: 20, weight: 800, fill: c, align: 'left' });
          ctx.restore();
        });
      }
      label(ctx, 'Asch (1951): actors gave the same wrong answer on 12 of 18 trials', cx, Y0 + 660, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Milgram: the 'teacher' is told to give ever-bigger shocks; most obey.
    'milgram-obedience'(b, ctx, it, t) {
      const P = 20; const u = cycle(t, P, 0.6);
      const T = (i) => 0.8 + i * 0.3 + (i >= 10 ? 2.4 : 0) + (i >= 20 ? 2.4 : 0);
      let n = 0; while (n < 30 && T(n) <= u) n++;
      const v = n * 15;
      ctx.save(); fade(ctx, t); seam(ctx, t, u, P);
      title(ctx, it.label || "Milgram's obedience study");
      const F = Y0 + 345; const wall = X0 + 545;
      line(ctx, X0 + 20, F + 2, X1 - 20, F + 2, FAINT, 3);
      line(ctx, wall, Y0 + 70, wall, F, 'muted', 6);
      label(ctx, 'next room', X1 - 24, Y0 + 92, { size: 18, weight: 600, fill: 'muted', align: 'right' });
      // Experimenter, teacher at a small generator, learner strapped in a chair.
      const worried = v >= 150;
      person(ctx, X0 + 115, F, 1.15, 'muted', { coat: true, armL: -0.2, armR: 0.25, look: 1 });
      label(ctx, 'experimenter', X0 + 115, F + 28, { size: 19, weight: 700, fill: 'muted' });
      ctx.strokeStyle = tint('muted', 0.7); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X0 + 300, F - 48); ctx.lineTo(X0 + 340, F - 48); ctx.moveTo(X0 + 320, F - 48); ctx.lineTo(X0 + 320, F); ctx.stroke();
      person(ctx, X0 + 320, F, 1.1, 'cyan', { seated: true, armR: 1.25, face: worried ? 'sad' : 'neutral', look: 1 });
      label(ctx, 'teacher (real participant)', X0 + 330, F + 28, { size: 19, weight: 700, fill: 'cyan' });
      ctx.fillStyle = tint('yellow', 0.18); ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 2.5; rounded(ctx, X0 + 400, F - 86, 110, 44, 6); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 8; i++) dot(ctx, X0 + 412 + i * 12.5, F - 64, 3.5, i < Math.ceil(n / 4) ? 'yellow' : 'muted');
      line(ctx, X0 + 420, F - 42, X0 + 420, F, 'muted', 3); line(ctx, X0 + 490, F - 42, X0 + 490, F, 'muted', 3);
      ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = tint('yellow', 0.6); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X0 + 510, F - 70); ctx.quadraticCurveTo(X0 + 580, F - 150, X0 + 622, F - 62); ctx.stroke(); ctx.restore();
      const shake = v >= 150 && v < 330 && u < T(29) + 0.5 ? Math.sin(b.clock * 30) * 2 : 0;
      ctx.strokeStyle = tint('muted', 0.7); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X0 + 690, F - 110); ctx.lineTo(X0 + 690, F); ctx.moveTo(X0 + 690, F - 48); ctx.lineTo(X0 + 640, F - 48); ctx.lineTo(X0 + 640, F); ctx.stroke();
      person(ctx, X0 + 668 + shake, F, 1.1, 'orange', { seated: true, dir: -1, armL: -0.9, armR: 0.1, face: v >= 75 && v < 330 ? 'sad' : 'neutral', look: -1 });
      dot(ctx, X0 + 624 + shake, F - 60, 5, 'yellow');
      label(ctx, 'learner (an actor)', X0 + 670, F + 28, { size: 19, weight: 700, fill: 'orange' });
      // Protests, hesitation and the experimenter's prods.
      const learnerSays = v >= 330 ? ['(silence)', 'muted'] : v >= 300 ? ['(bangs on the wall)', 'red'] : v >= 150 ? ['Let me out of here!', 'red'] : v >= 75 ? ['Ugh!', 'orange'] : null;
      if (learnerSays && u < 14.8) bubble(ctx, learnerSays[0], X0 + 668, Y0 + 140, learnerSays[1], 19, X0 + 665, F - 124);
      const say = (from, to) => u > from && u < to;
      if (say(3.7, 4.9)) bubble(ctx, 'I don’t want to go on…', X0 + 340, Y0 + 172, 'cyan', 19, X0 + 325, F - 124);
      if (say(9.2, 10.3)) bubble(ctx, 'Should I stop?', X0 + 330, Y0 + 172, 'cyan', 19, X0 + 325, F - 124);
      if (say(4.9, 6.2)) bubble(ctx, 'Please continue.', X0 + 150, Y0 + 118, 'ink', 19, X0 + 118, F - 136);
      if (say(10.3, 11.6)) bubble(ctx, 'The experiment requires that you continue.', X0 + 268, Y0 + 118, 'ink', 19, X0 + 118, F - 136);
      // The shock generator: 30 switches, 15 V to 450 V.
      const gy = Y0 + 398;
      panel(ctx, X0 + 20, gy, 760, 96, 'yellow', 0.05, 12);
      ctx.fillStyle = DARK; ctx.strokeStyle = tint('yellow', 0.7); ctx.lineWidth = 2; rounded(ctx, X0 + 34, gy + 14, 130, 68, 10); ctx.fill(); ctx.stroke();
      label(ctx, `${v} V`, X0 + 99, gy + 49, { size: 32, weight: 800, fill: v >= 375 ? 'red' : v >= 150 ? 'orange' : 'yellow' });
      for (let i = 0; i < 30; i++) {
        const x = X0 + 192 + i * 19.3; const on = i < n; const c = i >= 28 ? 'red' : i >= 22 ? 'orange' : 'yellow';
        ctx.fillStyle = on ? tint(c, 0.85) : tint(c, 0.12); ctx.strokeStyle = tint(c, on ? 1 : 0.5); ctx.lineWidth = 1.5;
        rounded(ctx, x - 6, gy + 18, 12, 32, 3); ctx.fill(); ctx.stroke();
      }
      label(ctx, '15 V', X0 + 186, gy + 72, { size: 18, weight: 600, fill: 'yellow', align: 'left' });
      label(ctx, '450 V', X0 + 758, gy + 72, { size: 18, weight: 700, fill: 'red', align: 'right' });
      label(ctx, 'danger', X0 + 192 + 23 * 19.3, gy + 72, { size: 18, weight: 600, fill: 'orange' });
      if (u < 14.8) {
        const cap = v < 150 ? ['Each wrong answer: a “shock” 15 V higher than the last', 'the teacher is told it is a study of learning and punishment']
          : v < 300 ? ['The learner protests; the experimenter calmly insists', 'most teachers were stressed, yet kept going when told to']
            : ['At 300 V the learner bangs on the wall, then goes silent', 'the experimenter says silence counts as a wrong answer'];
        label(ctx, cap[0], cx, Y0 + 535, { size: 22, weight: 700, fill: 'ink' });
        label(ctx, cap[1], cx, Y0 + 573, { size: 19, weight: 500, fill: 'muted' });
      } else {
        ctx.save(); ctx.globalAlpha *= after(u, 14.8);
        glow(ctx, COLORS.orange, 10); label(ctx, '65% went all the way to 450 V', cx, Y0 + 532, { size: 30, weight: 800, fill: 'orange' }); ctx.shadowBlur = 0;
        label(ctx, '26 of 40 men · every one of them reached 300 V', cx, Y0 + 574, { size: 20, weight: 600, fill: 'ink' });
        ctx.restore();
      }
      label(ctx, 'Milgram (1963): no real shocks — the learner was an actor', cx, Y0 + 630, { size: 19, weight: 600, fill: 'green' });
      label(ctx, 'Today this deception and distress would be judged unethical', cx, Y0 + 665, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Piaget's four stages, and the conservation-of-liquid task.
    'piaget-stages'(b, ctx, it, t) {
      const P = 16; const u = cycle(t, P, 0.6); const k = Math.min(3, Math.floor(u / 4));
      const ST = [['Sensorimotor', '0–2 years', 'cyan', 'Senses and actions; learns object permanence'], ['Preoperational', '2–7 years', 'purple', 'Pretend play and egocentric; can’t yet conserve'], ['Concrete operational', '7–11 years', 'green', 'Logical about real, concrete things; can conserve'], ['Formal operational', '11+ years', 'orange', 'Abstract and hypothetical thinking']];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || "Piaget's stages of cognitive development");
      ST.forEach(([name, age, c], i) => {
        const x = X0 + 30 + i * 187; const w = 177; const y = Y0 + 70; const on = i === k;
        ctx.save(); ctx.globalAlpha *= after(t, 0.2 + i * 0.2) * (on ? 1 : 0.55);
        panel(ctx, x, y, w, 118, c, on ? 0.24 : 0.08, 14);
        ctx.font = `800 20px ${FONT}`;
        const lines = ctx.measureText(name).width > w - 16 ? name.split(' ') : [name];
        lines.forEach((l, j) => { const s = fit(ctx, l, w - 14, 20, 800); label(ctx, l, x + w / 2, y + (lines.length > 1 ? 32 + j * 25 : 44), { size: s, weight: 800, fill: c }); });
        label(ctx, age, x + w / 2, y + 94, { size: 19, weight: 600, fill: 'ink' });
        ctx.restore();
        if (on) { ctx.fillStyle = color(c); ctx.beginPath(); ctx.moveTo(x + w / 2 - 10, y + 126); ctx.lineTo(x + w / 2 + 10, y + 126); ctx.lineTo(x + w / 2, y + 138); ctx.closePath(); ctx.fill(); }
      });
      chip(ctx, ST[k][3], cx, Y0 + 228, ST[k][2], 20);
      // Conservation: equal glasses; one is poured into a tall thin glass.
      const base = Y0 + 540; const GA = [X0 + 90, base]; const GBhome = [X0 + 220, base]; const GC = [X0 + 380, base];
      const wW = 90; const wH = 100; const lvl0 = 66; const tW = 50; const tH = 180; const tLvl = (lvl0 * wW) / tW;
      const lift = smooth((u - 2) / 1); const tip = smooth((u - 3) / 0.6); const drain = smooth((u - 3.6) / 2); const back = smooth((u - 5.8) / 0.8);
      const glass = (x, y, w, h, fillH, c) => {
        ctx.fillStyle = tint(c, 0.55); ctx.fillRect(x - w / 2 + 3, y - fillH, w - 6, fillH);
        ctx.strokeStyle = LINE; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w / 2, y - h); ctx.stroke();
      };
      glass(GA[0], GA[1], wW, wH, lvl0, 'cyan');
      glass(GC[0], GC[1], tW, tH, tLvl * drain, 'cyan');
      // Glass B: lifted, tipped over C, then put back empty.
      const pour = [X0 + 330, Y0 + 300];
      const gx = lerp(lerp(GBhome[0], pour[0], lift), GBhome[0], back); const gyc = lerp(lerp(GBhome[1] - wH / 2, pour[1], lift), GBhome[1] - wH / 2, back);
      const ang = 1.65 * tip * (1 - back);
      ctx.save(); ctx.translate(gx, gyc); ctx.rotate(ang);
      ctx.beginPath(); ctx.rect(-wW / 2 + 3, -wH / 2, wW - 6, wH - 3); ctx.rotate(-ang); ctx.translate(-gx, -gyc); ctx.save(); ctx.clip();
      const left = 1 - drain; const surf = lerp(gyc - 16, gyc - 13, ang / 1.65) + drain * 62;
      if (left > 0.02) { ctx.fillStyle = tint('cyan', 0.55); ctx.fillRect(gx - 80, surf, 160, 120); }
      ctx.restore(); ctx.restore();
      ctx.save(); ctx.translate(gx, gyc); ctx.rotate(ang);
      ctx.strokeStyle = LINE; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-wW / 2, -wH / 2); ctx.lineTo(-wW / 2, wH / 2); ctx.lineTo(wW / 2, wH / 2); ctx.lineTo(wW / 2, -wH / 2); ctx.stroke();
      ctx.restore();
      if (u > 3.6 && u < 5.7) { ctx.strokeStyle = tint('cyan', 0.7); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(gx + 46, gyc + 46); ctx.lineTo(GC[0], base - tLvl * drain); ctx.stroke(); }
      line(ctx, X0 + 30, base + 2, X0 + 450, base + 2, FAINT, 3);
      // Two children answer.
      if (u > 7) {
        const rows = [[7.2, 'Age 5, preoperational', '“The tall one has more!”', 'purple', 'red'], [9.2, 'Age 8, concrete stage', '“It’s still the same!”', 'green', 'green']];
        rows.forEach(([at0, who, said, c, c2], i) => {
          const y = Y0 + 380 + i * 110;
          ctx.save(); ctx.globalAlpha *= after(u, at0, 0.4);
          person(ctx, X0 + 500, y + 34, 0.55, c, { face: i ? 'happy' : 'neutral' });
          label(ctx, who, X0 + 532, y - 10, { size: 18, weight: 700, fill: c, align: 'left' });
          label(ctx, said, X0 + 532, y + 18, { size: fit(ctx, said, X1 - X0 - 545, 21, 700), weight: 700, fill: c2, align: 'left' });
          ctx.restore();
        });
      }
      const cap = u < 2 ? 'Two identical glasses hold the same amount of water' : u < 6.8 ? 'Pour one into a tall, thin glass…' : '…which has more? Conservation: the amount stays the same';
      label(ctx, cap, cx, Y0 + 598, { size: 21, weight: 700, fill: 'ink' });
      label(ctx, 'Piaget: children think differently at each stage, not just less', cx, Y0 + 645, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // The Strange Situation: how three kinds of infant react to separation and reunion.
    'attachment-styles'(b, ctx, it, t) {
      const P = 15; const u = cycle(t, P, 0.6);
      const ep = u < 3 ? 0 : u < 5.5 ? 1 : u < 9 ? 2 : 3; const es = u - [0, 3, 5.5, 9][ep];
      ctx.save(); fade(ctx, t); seam(ctx, t, u, P);
      title(ctx, it.label || 'Attachment styles: the Strange Situation');
      const EP = ['Play', 'Stranger in', 'Mother leaves', 'Reunion'];
      EP.forEach((s, i) => { ctx.save(); ctx.globalAlpha *= i === ep ? 1 : 0.4; chip(ctx, `${i + 1} ${s}`, cx + (i - 1.5) * 192, Y0 + 82, i === ep ? 'yellow' : 'muted', 19); ctx.restore(); });
      const TY = [['Secure', 'about 66% of infants', 'green'], ['Insecure-avoidant', 'about 22%', 'orange'], ['Insecure-resistant', 'about 12%', 'purple']];
      const STATUS = [
        ['Plays, checks back with mother', 'Wary but friendly with the stranger', 'Upset when mother leaves', 'Seeks comfort, soon calm again'],
        ['Plays, takes little notice of mother', 'Treats the stranger much like mother', 'Shows little distress', 'Ignores or avoids mother'],
        ['Clings; explores little', 'Fearful of the stranger', 'Very distressed', 'Wants contact but resists it; hard to soothe'],
      ];
      const DIST = [[0.05, 0.3, 0.8, lerp(0.8, 0.1, smooth(es / 1.6))], [0.05, 0.08, 0.15, 0.1], [0.3, 0.65, 1, 0.9]];
      TY.forEach(([name, pct, c], i) => {
        const px = X0 + 12 + i * 263; const pw = 250; const top = Y0 + 118;
        ctx.save(); ctx.globalAlpha *= after(t, 0.2 + i * 0.2);
        panel(ctx, px, top, pw, 444, c, 0.07, 16);
        label(ctx, name, px + pw / 2, top + 30, { size: fit(ctx, name, pw - 16, 21, 800), weight: 800, fill: c });
        label(ctx, pct, px + pw / 2, top + 58, { size: 18, weight: 500, fill: 'muted' });
        const F = top + 250;
        line(ctx, px + 12, F + 2, px + pw - 12, F + 2, FAINT, 2);
        // Toys.
        for (let j = 0; j < 3; j++) { ctx.fillStyle = tint(HUES[j + 2], 0.6); ctx.fillRect(px + 150 + j * 17, F - 14, 14, 14); }
        // Mother: present, leaves, comes back.
        const mLeave = ep === 2 ? smooth(es / 1.2) : 0; const mBack = ep === 3 ? 1 - smooth(es / 1.0) : 0;
        const mx = px + 50 - 30 * Math.max(mLeave, mBack); const mA = 1 - smooth(Math.max(mLeave, mBack) * 1.6);
        // Infant position and mood.
        let ix = px + 132; let face = 'happy'; let shake = 0;
        if (i === 0) { if (ep === 1) face = 'neutral'; if (ep === 2) face = 'cry'; if (ep === 3) { ix = lerp(ix, px + 88, smooth((es - 0.6) / 1)); face = es > 2 ? 'happy' : 'cry'; } }
        if (i === 1) { face = 'neutral'; if (ep === 3) ix = lerp(ix, px + 172, smooth((es - 0.8) / 1)); }
        if (i === 2) { ix = px + 104; face = ep === 0 ? 'neutral' : ep === 1 ? 'sad' : 'cry'; if (ep === 2) shake = Math.sin(b.clock * 26) * 2.5; if (ep === 3) { ix = px + 104 - 14 * smooth((es - 0.6) / 0.7) + 16 * Math.max(0, Math.sin((es - 1.3) * 3)) * (es > 1.3 ? 1 : 0); shake = Math.sin(b.clock * 22) * 1.5; } }
        if (mA > 0.02) { ctx.save(); ctx.globalAlpha *= mA; person(ctx, mx, F, 0.82, 'blue', { armR: ep === 3 && i === 0 ? 1.1 : 0.3, face: 'happy', look: 1 }); ctx.restore(); }
        if (ep === 1 || ep === 2) {
          const sx = ep === 1 ? lerp(px + 270, px + 212, smooth(es / 1)) : px + 212;
          ctx.save(); ctx.globalAlpha *= ep === 1 ? smooth(es / 0.6) : 1; person(ctx, sx, F, 0.82, 'muted', { look: -1 }); ctx.restore();
        }
        person(ctx, ix + shake, F, 0.5, c, { face, tear: b.clock * 1.4, look: i === 1 && ep === 3 ? 1 : -1, armL: i === 0 && ep === 3 && es > 1.5 ? -1.2 : -0.4, armR: 0.4 });
        // What the infant does now, and how distressed.
        para(ctx, STATUS[i][ep], px + 12, top + 318, pw - 24, 18, 'ink', 600, 3);
        const d = DIST[i][ep];
        label(ctx, 'distress', px + 16, top + 404, { size: 18, weight: 500, fill: 'muted', align: 'left' });
        ctx.fillStyle = tint('red', 0.12); rounded(ctx, px + 100, top + 396, 132, 16, 8); ctx.fill();
        ctx.fillStyle = tint('red', 0.75); rounded(ctx, px + 100, top + 396, Math.max(6, 132 * d), 16, 8); ctx.fill();
        ctx.restore();
      });
      label(ctx, "Ainsworth's Strange Situation (1978)", cx, Y0 + 598, { size: 20, weight: 700, fill: 'ink' });
      label(ctx, 'Bowlby: a secure base gives a child confidence to explore', cx, Y0 + 634, { size: 18, weight: 500, fill: 'muted' });
      label(ctx, 'A fourth type, disorganised, was added later (Main and Solomon)', cx, Y0 + 666, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Confirmation bias, anchoring and availability, one after another.
    'cognitive-biases'(b, ctx, it, t) {
      const P = 27; const u = cycle(t, P, 0.6); const k = Math.min(2, Math.floor(u / 9)); const s = u - k * 9;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Cognitive biases: mental shortcuts');
      ['Confirmation bias', 'Anchoring', 'Availability'].forEach((n, i) => { ctx.save(); ctx.globalAlpha *= i === k ? 1 : 0.4; chip(ctx, n, cx + (i - 1) * 255, Y0 + 82, i === k ? ['green', 'orange', 'purple'][i] : 'muted', 20); ctx.restore(); });
      ctx.save(); ctx.globalAlpha *= Math.min(clamp(s / 0.4) + (t < 1.2 ? 1 : 0), clamp((9 - s) / 0.4), 1);
      if (k === 0) {
        // Evidence falls on a filter: only what agrees gets through.
        chip(ctx, 'agrees with me', X0 + 170, Y0 + 140, 'green', 19); chip(ctx, 'disagrees', X0 + 640, Y0 + 140, 'red', 19);
        const fy = Y0 + 320; const fl = X0 + 300; const fr = X0 + 600;
        ctx.save(); ctx.setLineDash([14, 8]); line(ctx, fl, fy, fr, fy, 'yellow', 6); ctx.restore();
        label(ctx, 'what I', fl - 16, fy - 13, { size: 19, weight: 700, fill: 'yellow', align: 'right' });
        label(ctx, 'already believe', fl - 16, fy + 13, { size: 19, weight: 700, fill: 'yellow', align: 'right' });
        const jl = X0 + 360; const jt = Y0 + 410; const jw = 180; const jh = 150;
        ctx.strokeStyle = LINE; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(jl, jt); ctx.lineTo(jl, jt + jh); ctx.lineTo(jl + jw, jt + jh); ctx.lineTo(jl + jw, jt); ctx.stroke();
        label(ctx, 'my belief', jl + jw + 20, jt + 55, { size: 19, weight: 700, fill: 'green', align: 'left' });
        label(ctx, 'feels proven', jl + jw + 20, jt + 82, { size: 19, weight: 700, fill: 'green', align: 'left' });
        const PAT = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0];
        let g = 0;
        PAT.forEach((good, j) => {
          const lt = 0.3 + j * 0.5; const tau = s - lt; if (tau < 0) return;
          const x0 = X0 + 320 + rnd(j * 3.1) * 260; const tHit = 0.62; const c = good ? 'green' : 'red';
          let x = x0; let y; let a = 1;
          if (tau < tHit) y = Y0 + 170 + 150 * (tau / tHit) ** 2;
          else if (good) { const gi = g; const q = smooth((tau - tHit) / 0.45); x = lerp(x0, jl + 22 + (gi % 6) * 27, q); y = lerp(fy, jt + jh - 16 - Math.floor(gi / 6) * 27, q); }
          else { const tb = tau - tHit; const vx = x0 < (fl + fr) / 2 ? -230 : 230; x = x0 + vx * tb; y = fy - 240 * tb + 520 * tb * tb; a = clamp(1 - tb / 1.1); }
          if (good) g++;
          if (a <= 0) return;
          ctx.save(); ctx.globalAlpha *= a; dot(ctx, x, y, 12, c); ctx.restore();
        });
        label(ctx, 'Confirmation bias: we notice evidence that fits what we think', cx, Y0 + 602, { size: 21, weight: 700, fill: 'green' });
        label(ctx, '…and filter out or forget evidence that doesn’t', cx, Y0 + 640, { size: 19, weight: 500, fill: 'ink' });
      } else if (k === 1) {
        // A 'random' wheel number pulls people's estimates toward it.
        const B = s >= 4.5; const ss = B ? s - 4.5 : s; const anchor = B ? 65 : 10; const guess = B ? 45 : 25;
        const wx = X0 + 160; const wy = Y0 + 262; const R = 86;
        const spin = (1 - (1 - clamp(ss / 1.8)) ** 3) * 9 + (B ? 2 : 0);
        for (let i = 0; i < 12; i++) { ctx.fillStyle = tint(HUES[i % 6], i % 2 ? 0.35 : 0.6); ctx.beginPath(); ctx.moveTo(wx, wy); ctx.arc(wx, wy, R, spin + (i / 12) * TAU, spin + ((i + 1) / 12) * TAU); ctx.closePath(); ctx.fill(); }
        ctx.strokeStyle = LINE; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(wx, wy, R, 0, TAU); ctx.stroke();
        ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(wx, wy, 40, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = COLORS.ink; ctx.beginPath(); ctx.moveTo(wx - 12, wy - R - 18); ctx.lineTo(wx + 12, wy - R - 18); ctx.lineTo(wx, wy - R + 6); ctx.closePath(); ctx.fill();
        if (ss > 1.8) label(ctx, String(anchor), wx, wy + 1, { size: 32, weight: 800, fill: 'orange' });
        label(ctx, B ? 'Group 2' : 'Group 1', wx, wy + R + 30, { size: 20, weight: 700, fill: 'muted' });
        const tx = X0 + 300;
        label(ctx, 'What % of UN countries are in Africa?', tx, Y0 + 180, { size: 21, weight: 700, fill: 'ink', align: 'left' });
        if (ss > 1.9) label(ctx, `First: is it more or less than ${anchor}%?`, tx, Y0 + 228, { size: 20, weight: 600, fill: 'orange', align: 'left' });
        if (ss > 2.6) label(ctx, 'Then: your best guess?', tx, Y0 + 270, { size: 20, weight: 600, fill: 'ink', align: 'left' });
        if (ss > 3.2) label(ctx, `Typical (median) guess: ${guess}%`, tx, Y0 + 318, { size: 24, weight: 800, fill: 'cyan', align: 'left' });
        // Number line 0–100%.
        const nl = X0 + 80; const nr = X1 - 60; const ny = Y0 + 470; const X = (p) => nl + (p / 100) * (nr - nl);
        line(ctx, nl, ny, nr, ny, LINE, 3);
        for (let p = 0; p <= 100; p += 10) line(ctx, X(p), ny - 6, X(p), ny + 6, LINE, 2);
        for (let p = 0; p <= 100; p += 20) label(ctx, `${p}%`, X(p), ny + 24, { size: 18, weight: 500, fill: 'muted' });
        const marks = (an, gu, a, gq) => {
          ctx.save(); ctx.globalAlpha *= a;
          ctx.fillStyle = COLORS.orange; ctx.beginPath(); ctx.moveTo(X(an) - 9, ny - 26); ctx.lineTo(X(an) + 9, ny - 26); ctx.lineTo(X(an), ny - 10); ctx.closePath(); ctx.fill();
          label(ctx, `anchor ${an}`, X(an), ny - 42, { size: 18, weight: 700, fill: 'orange' });
          if (gq > 0) {
            const gx = X(lerp(an, gu, smooth(gq)));
            ctx.fillStyle = COLORS.cyan; ctx.beginPath(); ctx.moveTo(gx - 9, ny + 52); ctx.lineTo(gx + 9, ny + 52); ctx.lineTo(gx, ny + 37); ctx.closePath(); ctx.fill();
            label(ctx, `guess ${gu}%`, gx, ny + 70, { size: 18, weight: 700, fill: 'cyan' });
          }
          ctx.restore();
        };
        if (B) marks(10, 25, 0.35, 1);
        if (ss > 1.9) marks(anchor, guess, 1, (ss - 3.2) / 0.8);
        label(ctx, 'Anchoring: the first number we see drags our estimate toward it', cx, Y0 + 602, { size: 21, weight: 700, fill: 'orange' });
        label(ctx, 'Tversky and Kahneman (1974): a “random” 10 or 65 shifted the guesses', cx, Y0 + 640, { size: 18, weight: 500, fill: 'muted' });
      } else {
        // Vivid news feels common; the real risks are the other way round.
        label(ctx, 'News you remember', X0 + 195, Y0 + 140, { size: 19, weight: 600, fill: 'muted' });
        const HL = ['PLANE CRASH!', 'SHARK ATTACK!', 'PLANE CRASH!', 'AIR DISASTER!'];
        HL.forEach((h, j) => {
          const a = after(s, 0.3 + j * 0.6, 0.35); if (a <= 0) return;
          const y = Y0 + 190 + j * 64;
          ctx.save(); ctx.globalAlpha *= a; ctx.translate(X0 + 195, y); ctx.rotate((rnd(j + 4) - 0.5) * 0.08); ctx.scale(lerp(1.3, 1, a), lerp(1.3, 1, a));
          ctx.fillStyle = 'rgba(233,238,255,0.12)'; ctx.strokeStyle = tint('red', 0.8); ctx.lineWidth = 2; rounded(ctx, -150, -24, 300, 48, 8); ctx.fill(); ctx.stroke();
          label(ctx, h, 0, 1, { size: 23, weight: 800, fill: 'red' });
          ctx.restore();
        });
        const g = { x: X0 + 430, y: Y0 + 190, w: 330, h: 235 };
        chip(ctx, 'how risky it feels', X0 + 595, Y0 + 128, 'purple', 18); chip(ctx, 'real risk per mile', X0 + 595, Y0 + 166, 'cyan', 18);
        line(ctx, g.x, g.y + g.h, g.x + g.w, g.y + g.h, LINE, 2.5);
        [['Flying', 0.85, 0.06], ['Driving', 0.35, 0.85]].forEach(([n, feel, real], j) => {
          const gx = g.x + 40 + j * 165;
          const f1 = after(s, 3, 0.9) * feel; const f2 = after(s, 4.8, 0.9) * real;
          ctx.fillStyle = tint('purple', 0.6); ctx.fillRect(gx, g.y + g.h - f1 * g.h, 50, f1 * g.h);
          ctx.fillStyle = tint('cyan', 0.6); ctx.fillRect(gx + 60, g.y + g.h - f2 * g.h, 50, f2 * g.h);
          label(ctx, n, gx + 55, g.y + g.h + 24, { size: 20, weight: 700, fill: 'ink' });
        });
        label(ctx, 'Availability heuristic: easy-to-recall events feel more likely', cx, Y0 + 602, { size: 21, weight: 700, fill: 'purple' });
        label(ctx, 'Per mile, driving is far riskier than flying; crashes just make bigger news', cx, Y0 + 640, { size: 18, weight: 500, fill: 'ink' });
      }
      ctx.restore();
      label(ctx, 'Everyone has these biases; knowing them helps us think more clearly', cx, Y0 + 674, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Maslow's pyramid built from the bottom up.
    'maslow-needs'(b, ctx, it, t) {
      const P = 15; const u = cycle(t, P, 0.6);
      const TI = [['Physiological', 'food, water, sleep, warmth', 'red'], ['Safety', 'security, health, a home', 'orange'], ['Love and belonging', 'friends, family, feeling accepted', 'green'], ['Esteem', 'respect, confidence, achievement', 'cyan'], ['Self-actualisation', 'becoming the best you can be', 'purple']];
      const KIND = ['Basic need: the body', 'Basic need: feeling safe', 'Psychological need: other people', 'Psychological need: feeling valued', 'Self-fulfilment: growing as a person'];
      const hi = u < 6.5 ? Math.min(4, Math.floor((u - 0.3) / 1.2)) : Math.min(4, Math.floor((u - 6.5) / 1.6));
      ctx.save(); fade(ctx, t); seam(ctx, t, u, P);
      title(ctx, it.label || "Maslow's hierarchy of needs");
      const bot = Y0 + 530; const th = 84;
      TI.forEach(([name, ex, c], k) => {
        const a = after(u, 0.3 + k * 1.2, 0.5); if (a <= 0) return;
        const y1 = bot - k * th - (1 - a) * 30; const y0 = y1 - th + 4;
        const hb = 360 - k * 46; const ht = 360 - (k + 1) * 46;
        const on = k === hi;
        ctx.save(); ctx.globalAlpha *= a;
        ctx.fillStyle = tint(c, on ? 0.42 : 0.2); ctx.strokeStyle = color(c); ctx.lineWidth = on ? 3.5 : 2;
        poly(ctx, [cx - hb + 4, y1, cx + hb - 4, y1, cx + ht + 4, y0, cx - ht - 4, y0], true); ctx.fill(); ctx.stroke();
        label(ctx, name, cx, y0 + th * 0.34, { size: 22, weight: 800, fill: on ? 'ink' : c });
        label(ctx, ex, cx, y0 + th * 0.68, { size: fit(ctx, ex, ht * 2 - 20, 19, 500), weight: 500, fill: 'ink' });
        ctx.restore();
      });
      if (hi >= 0) chip(ctx, KIND[hi], cx, Y0 + 572, TI[hi][2], 21);
      label(ctx, 'Maslow (1943): lower needs usually come before higher ones', cx, Y0 + 628, { size: 19, weight: 600, fill: 'ink' });
      label(ctx, 'Not a strict ladder: people can work on several needs at once', cx, Y0 + 664, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Stressor → hypothalamus → adrenal glands → adrenaline and cortisol → recovery.
    'stress-response'(b, ctx, it, t) {
      const P = 18; const u = cycle(t, P, 0.6);
      const k = u < 2 ? 0 : u < 6 ? 1 : u < 10 ? 2 : u < 13 ? 3 : 4;
      const bpm = 70 + 50 * smooth((u - 3) / 3) * (1 - smooth((u - 13) / 4));
      ctx.save(); fade(ctx, t); seam(ctx, t, u, P);
      title(ctx, it.label || 'The stress response: fight or flight');
      // A body with the parts that matter.
      const bx = X0 + 220; const hy = Y0 + 165;
      ctx.strokeStyle = tint('blue', 0.7); ctx.lineWidth = 3; ctx.fillStyle = tint('blue', 0.08);
      ctx.beginPath(); ctx.arc(bx, hy, 38, 0, TAU); ctx.fill(); ctx.stroke();
      rounded(ctx, bx - 16, hy + 34, 32, 22, 6); ctx.fill();
      rounded(ctx, bx - 62, hy + 50, 124, 225, 40); ctx.fill(); ctx.stroke();
      ctx.lineCap = 'round'; ctx.lineWidth = 14; ctx.strokeStyle = tint('blue', 0.3); ctx.beginPath();
      ctx.moveTo(bx - 66, hy + 80); ctx.lineTo(bx - 86, hy + 230); ctx.moveTo(bx + 66, hy + 80); ctx.lineTo(bx + 86, hy + 230);
      ctx.moveTo(bx - 28, hy + 280); ctx.lineTo(bx - 32, hy + 370); ctx.moveTo(bx + 28, hy + 280); ctx.lineTo(bx + 32, hy + 370); ctx.stroke();
      const hyp = [bx + 4, hy - 4]; const pit = [bx + 6, hy + 16]; const heart = [bx + 18, hy + 112]; const adL = [bx - 28, hy + 200]; const adR = [bx + 28, hy + 200];
      // Kidneys with the adrenal glands on top.
      for (const [x, y] of [adL, adR]) {
        ctx.fillStyle = tint('purple', 0.3); ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + 22, 12, 19, 0, 0, TAU); ctx.fill(); ctx.stroke();
        const lit = (k === 1 && u > 3) || k === 2 || k === 3;
        ctx.fillStyle = lit ? COLORS.yellow : tint('yellow', 0.4); ctx.beginPath(); ctx.moveTo(x - 11, y + 4); ctx.lineTo(x, y - 9); ctx.lineTo(x + 11, y + 4); ctx.closePath(); ctx.fill();
      }
      const beat = 1 + 0.12 * Math.max(0, Math.sin(b.clock * (bpm / 60) * TAU)) ** 8;
      ctx.save(); ctx.translate(heart[0], heart[1]); ctx.scale(beat, beat); heartPath(ctx, 0, 0, 17); ctx.fillStyle = tint('red', 0.7); ctx.fill(); ctx.restore();
      const hypLit = u > 0.8 && k < 4;
      dot(ctx, hyp[0], hyp[1], hypLit ? 9 : 6, hypLit ? 'yellow' : 'muted', hypLit ? 10 : 0);
      dot(ctx, pit[0], pit[1], 5, k === 2 ? 'orange' : 'muted');
      label(ctx, 'Hypothalamus', bx + 50, hy - 14, { size: 18, weight: 600, fill: 'yellow', align: 'left' });
      label(ctx, 'Pituitary', bx + 50, hy + 16, { size: 18, weight: 600, fill: 'orange', align: 'left' });
      line(ctx, heart[0] + 20, heart[1], bx + 96, heart[1], tint('red', 0.6), 2); label(ctx, 'Heart', bx + 102, heart[1], { size: 18, weight: 600, fill: 'red', align: 'left' });
      line(ctx, adR[0] + 14, adR[1], bx + 96, adR[1], tint('purple', 0.7), 2); label(ctx, 'Adrenal', bx + 102, adR[1] - 11, { size: 18, weight: 600, fill: 'purple', align: 'left' });
      label(ctx, 'glands', bx + 102, adR[1] + 11, { size: 18, weight: 600, fill: 'purple', align: 'left' });
      // The stressor.
      ctx.save(); ctx.globalAlpha *= after(u, 0.2) * (k === 4 ? 0.4 : 1);
      chip(ctx, 'A big exam!', X0 + 84, Y0 + 86, 'red', 20);
      arr(ctx, X0 + 110, Y0 + 106, bx - 30, hy - 10, 'red', 3);
      ctx.restore();
      // Fast route: nerves → adrenal medulla → adrenaline; slow route: pituitary → cortisol.
      const fast = mkPath([hyp[0], hyp[1], bx, hy + 50, bx, hy + 180, adL[0], adL[1]]);
      const slow = mkPath([pit[0], pit[1], bx + 44, hy + 70, bx + 44, hy + 180, adR[0], adR[1]]);
      ctx.save(); ctx.globalAlpha *= 0.35; ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 2; strokeSpan(ctx, fast, 0, fast.total); ctx.strokeStyle = COLORS.orange; strokeSpan(ctx, slow, 0, slow.total); ctx.restore();
      const pulse = (p, c, q) => { if (q <= 0 || q >= 1) return; const pt = at(p, q * p.total); dot(ctx, pt.x, pt.y, 7, c, 10); };
      if (k === 1) pulse(fast, 'yellow', (u - 2) / 1.2);
      if (k === 2) pulse(slow, 'orange', (u - 6) / 1.6);
      const flow = (from, c, t0, t1, n) => {
        if (u < t0 || u > t1 + 1.5) return;
        const fa = Math.min(clamp((u - t0) / 0.4), clamp((t1 + 1.5 - u) / 0.6));
        for (let j = 0; j < n; j++) {
          const p = mod(b.clock * 0.5 + j / n, 1); const ang = j * 2.4;
          const x = lerp(from[0], bx + Math.cos(ang) * 48, p); const y = lerp(from[1], hy + 120 + Math.sin(ang) * 100, p);
          ctx.save(); ctx.globalAlpha *= fa * (1 - p * 0.5); dot(ctx, x, y, 4.5, c); ctx.restore();
        }
      };
      flow(adL, 'yellow', 3.2, 10, 10); flow(adR, 'orange', 7.6, 12, 10);
      if (u > 3.2 && u < 11) label(ctx, 'adrenaline', bx - 70, hy + 300, { size: 18, weight: 700, fill: 'yellow', align: 'right' });
      if (u > 7.6 && u < 13) label(ctx, 'cortisol', bx + 70, hy + 300, { size: 18, weight: 700, fill: 'orange', align: 'left' });
      // Heart-rate monitor.
      const mx = X0 + 480; const mw = 310; const my = Y0 + 80;
      panel(ctx, mx, my, mw, 160, 'red', 0.06, 14);
      label(ctx, 'Heart rate', mx + 16, my + 24, { size: 18, weight: 600, fill: 'muted', align: 'left' });
      label(ctx, `${Math.round(bpm)} bpm`, mx + mw - 16, my + 26, { size: 26, weight: 800, fill: 'red', align: 'right' });
      ctx.strokeStyle = COLORS.red; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let i = 0; i <= 140; i++) {
        const x = mx + 14 + (i / 140) * (mw - 28); const tau = b.clock - (1 - i / 140) * 3;
        const ph = mod(tau * (bpm / 60), 1); const spike = ph < 0.04 ? -Math.sin((ph / 0.04) * Math.PI) * 48 : ph < 0.08 ? Math.sin(((ph - 0.04) / 0.04) * Math.PI) * 12 : 0;
        const y = my + 112 + spike;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.stroke();
      // The body's changes, then recovery.
      const rec = k === 4;
      label(ctx, rec ? 'Rest and digest' : 'Fight or flight', mx + mw / 2, Y0 + 278, { size: 22, weight: 800, fill: rec ? 'green' : 'orange' });
      const FX = rec ? ['Heart rate slows', 'Breathing calms', 'Digestion restarts', 'Muscles relax'] : ['Heart beats faster', 'Faster breathing', 'Glucose released for energy', 'Muscles ready to act', 'Digestion slows down'];
      FX.forEach((f, j) => {
        const a = rec ? after(u, 13.4 + j * 0.4) : after(u, (j < 2 ? 4 : 8) + j * 0.5) * (1 - after(u, 12.8, 0.5));
        if (a <= 0) return;
        ctx.save(); ctx.globalAlpha *= a; chip(ctx, f, mx + mw / 2, Y0 + 322 + j * 44, rec ? 'green' : 'orange', 18); ctx.restore();
      });
      const CAP = ['1. The brain spots a stressor', '2. Fast: nerves → adrenal glands → adrenaline', '3. Slower: pituitary hormone → adrenal glands → cortisol', '4. The body is ready to fight or run', '5. Recovery: the body calms back down'];
      label(ctx, CAP[k], cx, Y0 + 578, { size: 22, weight: 700, fill: ['red', 'yellow', 'orange', 'orange', 'green'][k] });
      label(ctx, 'Short-term stress helps us act; ongoing stress needs rest and support', cx, Y0 + 626, { size: 18, weight: 500, fill: 'ink' });
      label(ctx, 'Fast: SAM pathway (adrenaline) · Slower: HPA axis (cortisol)', cx, Y0 + 660, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // A fair test: random groups, one variable changed, one measured, the rest fixed.
    'experiment-design'(b, ctx, it, t) {
      const P = 17; const u = cycle(t, P, 0.6);
      const k = u < 3 ? 0 : u < 6.5 ? 1 : u < 9.5 ? 2 : u < 12.5 ? 3 : 4;
      const C = it._c || (it._c = (() => { const ord = Array.from({ length: 12 }, (_, i) => i).sort((a, c) => rnd(a * 7.3 + 1) - rnd(c * 7.3 + 1)); const slot = []; ord.forEach((p, r) => { slot[p] = r; }); return { slot }; })());
      ctx.save(); fade(ctx, t); seam(ctx, t, u, P);
      title(ctx, it.label || 'Designing a fair experiment');
      chip(ctx, str(it.question, 'Does caffeine speed up reaction time?'), cx, Y0 + 84, 'ink', 21);
      const iv = str(it.iv, 'caffeine'); const dv = str(it.dv, 'reaction time');
      // Two group boxes.
      const boxes = [[X0 + 20, 'Control: water', 'blue'], [X0 + 410, `Experimental: ${iv}`, 'orange']];
      boxes.forEach(([x, name, c], i) => {
        ctx.save(); ctx.globalAlpha *= after(u, 2.4 + i * 0.2);
        panel(ctx, x, Y0 + 262, 370, 166, c, 0.07, 14);
        label(ctx, name, x + 185, Y0 + 288, { size: fit(ctx, name, 340, 21, 700), weight: 700, fill: c });
        ctx.restore();
      });
      // Twelve volunteers, randomly allocated.
      for (let p = 0; p < 12; p++) {
        const r = C.slot[p]; const grp = r % 2; const j = Math.floor(r / 2);
        const sx = cx + ((p % 6) - 2.5) * 62; const sy = Y0 + 175 + Math.floor(p / 6) * 60;
        const tx = boxes[grp][0] + 45 + j * 56; const ty = Y0 + 410;
        const q = smooth((u - 3.1 - r * 0.22) / 0.6);
        const x = lerp(sx, tx, q); const y = lerp(sy, ty, q) - Math.sin(q * Math.PI) * 30;
        const c = q < 0.5 ? 'ink' : boxes[grp][2];
        person(ctx, x, y, 0.42, c, { face: 'happy' });
        if (u > 6.5 && q >= 1) { ctx.fillStyle = tint(grp ? 'orange' : 'blue', 0.75); ctx.fillRect(x + 12, y - 34, 9, 12); }
      }
      // Variables appear in the space the volunteers left.
      const VAR = [[6.5, 'IV', `what we change: ${iv} or water`, 'orange'], [9.5, 'DV', `what we measure: ${dv}`, 'cyan'], [12.5, 'Controls', 'kept the same: test, time of day, drink size', 'green']];
      VAR.forEach(([t0, tag, text, c], i) => {
        const a = after(u, t0, 0.5); if (a <= 0) return;
        const y = Y0 + 140 + i * 44;
        ctx.save(); ctx.globalAlpha *= a;
        ctx.font = `800 20px ${FONT}`; const tw = ctx.measureText(tag).width;
        ctx.font = `500 19px ${FONT}`; const w = tw + 16 + ctx.measureText(text).width; const l = cx - w / 2;
        label(ctx, tag, l, y, { size: 20, weight: 800, fill: c, align: 'left' });
        label(ctx, text, l + tw + 16, y, { size: 19, weight: 500, fill: 'ink', align: 'left' });
        ctx.restore();
      });
      // Results: mean reaction time per group (made-up numbers).
      if (u > 9.6) {
        [[0, 312, 'blue'], [1, 268, 'orange']].forEach(([i, ms, c]) => {
          const x = boxes[i][0]; const a = after(u, 9.8 + i * 0.4, 0.8);
          label(ctx, 'mean', x + 14, Y0 + 452, { size: 18, weight: 500, fill: 'muted', align: 'left' });
          ctx.fillStyle = tint(c, 0.65); rounded(ctx, x + 70, Y0 + 442, (ms / 312) * 210 * a, 20, 8); ctx.fill();
          label(ctx, `${Math.round(ms * a)} ms`, x + 80 + (ms / 312) * 210 * a, Y0 + 452, { size: 19, weight: 700, fill: c, align: 'left' });
        });
      }
      const CAP = [['Ask a question; predict the answer (a hypothesis)', '12 volunteers take part'], ['Random allocation into two groups', 'chance decides, so the groups start out alike'], ['Change one thing: the independent variable', 'the control group gives a fair comparison'], ['Measure the result: the dependent variable', `the ${iv} group reacted faster on average`], ['Keep everything else the same: control variables', 'then a difference is likely caused by the IV']];
      label(ctx, CAP[k][0], cx, Y0 + 534, { size: 22, weight: 700, fill: ['ink', 'purple', 'orange', 'cyan', 'green'][k] });
      label(ctx, CAP[k][1], cx, Y0 + 572, { size: 19, weight: 500, fill: 'ink' });
      label(ctx, 'Made-up results, for illustration. More people make results more reliable.', cx, Y0 + 640, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // ─── Technology ───────────────────────────────────────────────────────

    // A language model scores every possible next word and adds one at a time.
    'chatbot-next-word'(b, ctx, it, t) {
      const C = it._c || (it._c = (() => {
        const custom = Array.isArray(it.steps) && it.steps.length && typeof it.prompt === 'string';
        const prompt = custom ? it.prompt : 'The cat sat on the';
        const steps = custom ? it.steps.slice(0, 4).map((s) => ({ opts: (s.options || s).slice(0, 5).map(([w, p]) => [String(w), Number(p) || 0]), pick: val(s.pick, 0) }))
          : [
            { opts: [['mat', 0.41], ['floor', 0.18], ['sofa', 0.14], ['windowsill', 0.08], ['roof', 0.04]], pick: 0 },
            { opts: [['and', 0.33], ['.', 0.29], ['all', 0.07], ['while', 0.06], [',', 0.05]], pick: 0 },
            { opts: [['purred', 0.36], ['slept', 0.21], ['watched', 0.13], ['yawned', 0.09], ['waited', 0.05]], pick: 1 },
          ];
        return { prompt, steps };
      })());
      const SD = 4.4; const n = C.steps.length; const P = n * SD + 3.2; const u = cycle(t, P, 0.6);
      const k = Math.min(n - 1, Math.floor(u / SD)); const s = u - k * SD; const done = u >= n * SD;
      const st = C.steps[k];
      const words = C.steps.slice(0, done ? n : k + (s > 4.0 ? 1 : 0)).map((x) => x.opts[x.pick][0]);
      const join = (ws) => ws.reduce((acc, w) => (/^[.,!?;:]$/.test(w) ? acc + w : `${acc} ${w}`), '');
      ctx.save(); fade(ctx, t); seam(ctx, t, u, P);
      title(ctx, it.label || 'How a chatbot writes: next-word prediction');
      // The text so far.
      panel(ctx, X0 + 20, Y0 + 70, 760, 104, 'blue', 0.08, 16);
      label(ctx, 'the text so far', X0 + 40, Y0 + 92, { size: 18, weight: 500, fill: 'muted', align: 'left' });
      const gen = join(words); const size = fit(ctx, C.prompt + gen + '  ', 700, 30, 600);
      ctx.font = `600 ${size}px ${FONT}`; const pw = ctx.measureText(C.prompt).width; const gw = ctx.measureText(gen).width;
      label(ctx, C.prompt, X0 + 44, Y0 + 134, { size, weight: 600, fill: 'ink', align: 'left' });
      label(ctx, gen, X0 + 44 + pw, Y0 + 134, { size, weight: 700, fill: 'cyan', align: 'left' });
      if (mod(b.clock, 1) < 0.55) line(ctx, X0 + 50 + pw + gw, Y0 + 116, X0 + 50 + pw + gw, Y0 + 152, 'cyan', 3);
      // The model: a small network lighting up.
      panel(ctx, X0 + 20, Y0 + 212, 270, 262, 'purple', 0.07, 16);
      arr(ctx, X0 + 155, Y0 + 176, X0 + 155, Y0 + 208, 'muted', 3);
      const LAY = [4, 5, 4]; const nx = (l) => X0 + 70 + l * 85; const ny = (l, i) => Y0 + 290 + (i - (LAY[l] - 1) / 2) * 34;
      const wave = !done && s < 1.2 ? s / 1.2 : -1;
      ctx.strokeStyle = 'rgba(167,139,250,0.25)'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let l = 0; l < 2; l++) for (let i = 0; i < LAY[l]; i++) for (let j = 0; j < LAY[l + 1]; j++) { ctx.moveTo(nx(l), ny(l, i)); ctx.lineTo(nx(l + 1), ny(l + 1, j)); }
      ctx.stroke();
      for (let l = 0; l < 3; l++) for (let i = 0; i < LAY[l]; i++) {
        const on = wave >= 0 && Math.abs(wave * 2.4 - l) < 0.5 && rnd(l * 9 + i + k * 3) > 0.25;
        dot(ctx, nx(l), ny(l, i), on ? 10 : 8, on ? 'yellow' : 'purple', on ? 8 : 0);
      }
      label(ctx, 'language model', X0 + 155, Y0 + 412, { size: 20, weight: 800, fill: 'purple' });
      label(ctx, 'learned from lots of text', X0 + 155, Y0 + 442, { size: 18, weight: 500, fill: 'muted' });
      arr(ctx, X0 + 294, Y0 + 300, X0 + 330, Y0 + 300, 'muted', 3);
      // Probabilities for the next word.
      const flying = !done && s > 3.1 && s < 4.0;
      ctx.save(); ctx.globalAlpha *= flying ? 0.15 : 1; label(ctx, 'Next word?', X0 + 345, Y0 + 222, { size: 21, weight: 800, fill: 'ink', align: 'left' }); ctx.restore();
      const grow = done ? 1 : smooth((s - 1) / 1.3); const choose = !done && s > 2.4;
      if (choose && st.pick !== 0) label(ctx, 'not always the top word', X1 - 22, Y0 + 222, { size: 18, weight: 600, fill: 'orange', align: 'right' });
      const sh = done ? C.steps[n - 1] : st;
      sh.opts.forEach(([w, p], i) => {
        const y = Y0 + 266 + i * 46; const picked = (choose || done) && i === sh.pick;
        ctx.save(); ctx.globalAlpha *= done ? 0.45 : 1;
        if (picked) { ctx.fillStyle = tint('cyan', 0.16); rounded(ctx, X0 + 335, y - 20, 445, 40, 10); ctx.fill(); }
        label(ctx, w === '.' ? '. (full stop)' : w === ',' ? ', (comma)' : w, X0 + 348, y, { size: fit(ctx, w, 130, 22, 700), weight: 700, fill: picked ? 'cyan' : 'ink', align: 'left' });
        const bw = 190 * (p / sh.opts[0][1]) * grow;
        ctx.fillStyle = tint(picked ? 'cyan' : 'blue', 0.7); rounded(ctx, X0 + 500, y - 11, Math.max(3, bw), 22, 7); ctx.fill();
        label(ctx, `${Math.round(p * 100 * grow)}%`, X0 + 510 + bw, y, { size: 19, weight: 700, fill: picked ? 'cyan' : 'muted', align: 'left' });
        ctx.restore();
      });
      // The chosen word flies up to the end of the text.
      if (!done && s > 3.2 && s < 4.0) {
        const q = smooth((s - 3.2) / 0.8); const w = st.opts[st.pick][0];
        const x = lerp(X0 + 348, X0 + 52 + pw + gw, q); const y = lerp(Y0 + 266 + st.pick * 46, Y0 + 134, q);
        label(ctx, w, x, y, { size: 26, weight: 800, fill: 'cyan', align: 'left' });
      }
      label(ctx, 'It predicts a likely next word from patterns in its training text', cx, Y0 + 526, { size: 20, weight: 700, fill: 'ink' });
      label(ctx, 'It doesn’t look facts up, so it can sound sure and still be wrong', cx, Y0 + 566, { size: 19, weight: 600, fill: 'orange' });
      label(ctx, done ? 'One word at a time, again and again: that’s the whole reply' : 'Then it adds the word and predicts again (really, word pieces called tokens)', cx, Y0 + 624, { size: 18, weight: 500, fill: done ? 'cyan' : 'muted' });
      label(ctx, 'Percentages here are made up to illustrate', cx, Y0 + 658, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Distance circles from satellites meet at the phone; a 4th fixes the clock.
    'gps-trilateration'(b, ctx, it, t) {
      const P = 20; const u = cycle(t, P, 0.6);
      const k = u < 3.5 ? 0 : u < 6.5 ? 1 : u < 9.5 ? 2 : u < 13 ? 3 : u < 17 ? 4 : 5;
      const ph = [X0 + 430, Y0 + 506];
      const S = [[X0 + 110, Y0 + 170], [X0 + 300, Y0 + 105], [X0 + 590, Y0 + 120], [X0 + 735, Y0 + 245]];
      const D = S.map(([x, y]) => Math.hypot(x - ph[0], y - ph[1]));
      const T0 = [0.3, 3.5, 6.5, 13];
      const err = k === 3 ? 26 * smooth((u - 9.7) / 1.2) : k === 4 ? 26 * (1 - smooth((u - 14.4) / 1.6)) : 0;
      ctx.save(); fade(ctx, t); seam(ctx, t, u, P);
      title(ctx, it.label || 'How GPS finds you');
      ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0 + 56, FIG.w, 492); ctx.clip();
      // Earth.
      ctx.fillStyle = tint('blue', 0.14); ctx.strokeStyle = tint('cyan', 0.6); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, Y0 + 525 + 1500, 1500, 0, TAU); ctx.fill(); ctx.stroke();
      // Distance circles.
      S.forEach(([x, y], i) => {
        if (u < T0[i]) return;
        const tau = u - T0[i]; const grow = clamp(tau / 1.2); const c = HUES[i];
        const r = D[i] * grow + (grow >= 1 ? err : 0);
        ctx.save();
        if (grow < 1) { ctx.strokeStyle = tint(c, 0.9); ctx.lineWidth = 4; glow(ctx, color(c), 8); }
        else { ctx.strokeStyle = tint(err > 3 ? 'red' : c, 0.75); ctx.lineWidth = 2.5; ctx.setLineDash([10, 8]); }
        ctx.beginPath(); ctx.arc(x, y, Math.max(1, r), 0, TAU); ctx.stroke();
        ctx.restore();
      });
      // Two circles cross at two points.
      if (k === 1 && u > 4.7) {
        const [x1, y1] = S[0]; const [x2, y2] = S[1]; const r1 = D[0]; const r2 = D[1];
        const d = Math.hypot(x2 - x1, y2 - y1); const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d); const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
        const mx = x1 + (a * (x2 - x1)) / d; const my = y1 + (a * (y2 - y1)) / d;
        for (const sg of [-1, 1]) { const px = mx + (sg * h * (y2 - y1)) / d; const py = my - (sg * h * (x2 - x1)) / d; ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, 13, 0, TAU); ctx.stroke(); label(ctx, '?', px + 24, py - 16, { size: 22, weight: 800, fill: 'yellow' }); }
      }
      ctx.restore();
      // Satellites.
      S.forEach(([x, y], i) => {
        const a = after(u, T0[i] - 0.3, 0.4) || (i < 3 && k === 5 ? 1 : 0); if (a <= 0) return;
        ctx.save(); ctx.globalAlpha *= a;
        ctx.fillStyle = tint('cyan', 0.35); ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 2;
        ctx.fillRect(x - 40, y - 8, 26, 16); ctx.strokeRect(x - 40, y - 8, 26, 16); ctx.fillRect(x + 14, y - 8, 26, 16); ctx.strokeRect(x + 14, y - 8, 26, 16);
        ctx.fillStyle = DARK; rounded(ctx, x - 13, y - 13, 26, 26, 5); ctx.fill(); ctx.strokeStyle = COLORS.ink; ctx.stroke();
        label(ctx, String(i + 1), x, y + 1, { size: 18, weight: 800, fill: 'ink' });
        ctx.restore();
      });
      // The phone.
      const fix = k >= 4 && err < 1;
      if (fix) { glow(ctx, COLORS.green, 14); }
      ctx.fillStyle = DARK; ctx.strokeStyle = fix ? COLORS.green : COLORS.ink; ctx.lineWidth = 2.5; rounded(ctx, ph[0] - 10, ph[1] - 30, 20, 34, 4); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      if (k === 2 || fix) dot(ctx, ph[0], ph[1] - 13, 5, fix ? 'green' : 'cyan');
      if (fix) label(ctx, 'You are here', ph[0] + 22, ph[1] - 44, { size: 20, weight: 800, fill: 'green', align: 'left' });
      if (k === 3 && u > 10.6) label(ctx, 'clock off: circles miss', ph[0] + 26, ph[1] - 50, { size: 19, weight: 700, fill: 'red', align: 'left' });
      const CAP = [['Satellite 1: travel time × light speed = distance', 'so you are somewhere on this circle (a sphere in 3-D)'], ['Two satellites: the circles cross at two points', 'one is here; the other is far off the picture, up in space'], ['Three satellites: one point, if clocks were perfect', 'your position is where all three meet'], ['But the phone’s clock is not that precise', 'a millionth of a second off ≈ 300 m wrong, so circles miss'], ['A 4th satellite lets the phone correct its clock', 'four unknowns (x, y, z and time) need at least 4 satellites'], ['Position fixed!', 'four unknowns (x, y, z and time) need at least 4 satellites']];
      label(ctx, CAP[k][0], cx, Y0 + 578, { size: 22, weight: 700, fill: k === 3 ? 'red' : k >= 4 ? 'green' : 'ink' });
      label(ctx, CAP[k][1], cx, Y0 + 616, { size: 19, weight: 500, fill: 'ink' });
      label(ctx, 'GPS satellites carry atomic clocks and orbit about 20,200 km up', cx, Y0 + 664, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Crawl, index, rank: pages with more links from others come first.
    'search-engine'(b, ctx, it, t) {
      const P = 18; const u = cycle(t, P, 0.6);
      const k = u < 6 ? 0 : u < 10 ? 1 : u < 13.5 ? 2 : 3;
      const N = { A: [X0 + 85, Y0 + 125], B: [X0 + 265, Y0 + 112], C: [X0 + 175, Y0 + 262], D: [X0 + 355, Y0 + 240], E: [X0 + 75, Y0 + 400], F: [X0 + 235, Y0 + 418], G: [X0 + 370, Y0 + 400] };
      const LINKS = ['AB', 'AC', 'BC', 'BD', 'DC', 'DG', 'DF', 'GF', 'FC', 'FE', 'EC'];
      const inc = {}; for (const l of LINKS) inc[l[1]] = (inc[l[1]] || 0) + 1;
      const CRAWL = 'ABDGFEC';
      const C = it._c || (it._c = { path: mkPath(CRAWL.split('').flatMap((n) => N[n])) });
      const crawlQ = clamp((u - 0.4) / 5.2);
      const visited = new Set(); for (let i = 0; i < CRAWL.length; i++) if (crawlQ * (CRAWL.length - 1) >= i - 0.02) visited.add(CRAWL[i]);
      const query = str(it.query, 'pizza recipe');
      ctx.save(); fade(ctx, t); seam(ctx, t, u, P);
      title(ctx, it.label || 'How a search engine works');
      // Links between pages.
      for (const l of LINKS) {
        const [x0, y0] = N[l[0]]; const [x1, y1] = N[l[1]]; const a = Math.atan2(y1 - y0, x1 - x0);
        const lit = k === 3 && l[1] === 'C';
        arr(ctx, x0 + Math.cos(a) * 36, y0 + Math.sin(a) * 36, x1 - Math.cos(a) * 40, y1 - Math.sin(a) * 40, lit ? tint('yellow', 0.85) : 'rgba(140,170,255,0.45)', lit ? 3.5 : 2.5);
      }
      // Pages.
      for (const [n, [x, y]] of Object.entries(N)) {
        const sc = k === 3 ? 1 + 0.07 * (inc[n] || 0) * after(u, 13.6, 0.8) : 1; const seen = visited.has(n) || k > 0;
        const w = 46 * sc; const h = 56 * sc; const c = seen ? 'cyan' : 'muted';
        ctx.fillStyle = DARK; ctx.strokeStyle = color(c); ctx.lineWidth = 2.5;
        poly(ctx, [x - w / 2, y - h / 2, x + w / 2 - 12, y - h / 2, x + w / 2, y - h / 2 + 12, x + w / 2, y + h / 2, x - w / 2, y + h / 2], true); ctx.fill();
        ctx.fillStyle = tint(c, seen ? 0.3 : 0.1); ctx.fill(); ctx.stroke();
        label(ctx, n, x, y + 1, { size: 22 * Math.min(sc, 1.2), weight: 800, fill: seen ? 'ink' : 'muted' });
        if (k === 3) label(ctx, String(inc[n] || 0), x + w / 2 + 6, y - h / 2 - 2, { size: 18, weight: 800, fill: 'yellow', align: 'left' });
      }
      // The crawler.
      if (k === 0 && crawlQ < 1) {
        const p = at(C.path, smooth(crawlQ * (CRAWL.length - 1) % 1) / (CRAWL.length - 1) * C.path.total + Math.floor(crawlQ * (CRAWL.length - 1)) / (CRAWL.length - 1) * C.path.total);
        ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI + 0.4 + Math.sin(b.clock * 12 + i) * 0.15; ctx.beginPath(); ctx.moveTo(p.x - Math.cos(a) * 18, p.y - Math.sin(a) * 14); ctx.lineTo(p.x + Math.cos(a) * 18, p.y + Math.sin(a) * 14); ctx.stroke(); }
        dot(ctx, p.x, p.y, 9, 'yellow', 8);
        label(ctx, 'crawler', p.x + 14, p.y - 46, { size: 18, weight: 700, fill: 'yellow', align: 'left' });
      }
      // The index.
      const IX = [['pizza', 'A, C, F'], ['recipe', 'C, D, F'], ['pasta', 'B, D'], ['oven', 'E, G']];
      panel(ctx, X0 + 440, Y0 + 72, 340, 196, 'purple', k === 1 ? 0.14 : 0.06, 14);
      label(ctx, 'Index', X0 + 460, Y0 + 98, { size: 20, weight: 800, fill: 'purple', align: 'left' });
      IX.forEach(([w, pages], i) => {
        const a = k === 0 ? 0 : after(u, 6.2 + i * 0.7, 0.4); if (a <= 0) return;
        const y = Y0 + 136 + i * 36; const hit = k >= 2 && query.toLowerCase().split(/\s+/).includes(w);
        ctx.save(); ctx.globalAlpha *= a;
        label(ctx, w, X0 + 462, y, { size: 20, weight: 700, fill: hit ? 'yellow' : 'ink', align: 'left' });
        label(ctx, `→ ${pages}`, X0 + 580, y, { size: 20, weight: 600, fill: hit ? 'yellow' : 'cyan', align: 'left' });
        ctx.restore();
      });
      // Search box and results.
      ctx.fillStyle = DARK; ctx.strokeStyle = tint('ink', 0.6); ctx.lineWidth = 2; rounded(ctx, X0 + 440, Y0 + 290, 340, 48, 24); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = COLORS.muted; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(X0 + 466, Y0 + 312, 8, 0, TAU); ctx.moveTo(X0 + 472, Y0 + 318); ctx.lineTo(X0 + 480, Y0 + 326); ctx.stroke();
      const typed = k < 2 ? '' : query.slice(0, Math.ceil(query.length * clamp((u - 10.2) / 1.6)));
      label(ctx, typed || 'search…', X0 + 492, Y0 + 314, { size: 21, weight: 600, fill: typed ? 'ink' : 'muted', align: 'left' });
      const RES = [['C', 'both words'], ['F', 'both words'], ['D', 'one word']];
      if (k === 3) RES.forEach(([n, why], i) => {
        const a = after(u, 13.8 + i * 0.5, 0.4); if (a <= 0) return;
        const y = Y0 + 372 + i * 50;
        ctx.save(); ctx.globalAlpha *= a;
        panel(ctx, X0 + 440, y - 21, 340, 42, i === 0 ? 'green' : 'blue', i === 0 ? 0.18 : 0.08, 10);
        label(ctx, `${i + 1}.  Page ${n}`, X0 + 456, y, { size: 20, weight: 800, fill: i === 0 ? 'green' : 'ink', align: 'left' });
        label(ctx, `${why} · ${inc[n]} link${inc[n] === 1 ? '' : 's'} in`, X0 + 766, y, { size: 18, weight: 500, fill: 'muted', align: 'right' });
        ctx.restore();
      });
      ['1 Crawl', '2 Index', '3 Rank'].forEach((s, i) => { const on = i === Math.min(2, k === 3 ? 2 : k === 2 ? 2 : k); ctx.save(); ctx.globalAlpha *= on ? 1 : 0.4; chip(ctx, s, cx + (i - 1) * 220, Y0 + 520, on ? ['yellow', 'purple', 'green'][i] : 'muted', 20); ctx.restore(); });
      for (let i = 0; i < 2; i++) arr(ctx, cx + (i - 1) * 220 + 62, Y0 + 520, cx + i * 220 - 62, Y0 + 520, tint('muted', 0.6), 3);
      const CAP = ['A crawler follows links from page to page', 'Every word is stored with the pages that contain it', 'You search: the index finds matching pages fast', 'Relevant pages with more links from others rank higher'];
      label(ctx, CAP[k], cx, Y0 + 574, { size: 21, weight: 700, fill: 'ink' });
      label(ctx, 'PageRank idea: a link is like a vote; votes from popular pages count more', cx, Y0 + 622, { size: 18, weight: 500, fill: 'muted' });
      label(ctx, 'Real search engines weigh many more signals, like relevance and quality', cx, Y0 + 656, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Posts scored by predicted interest, sorted into a feed; the filter bubble.
    'social-feed'(b, ctx, it, t) {
      const P = 17; const u = cycle(t, P, 0.6);
      const k = u < 4 ? 0 : u < 8 ? 1 : u < 11.5 ? 2 : 3;
      const POSTS = [['Cooking', 'orange', 0.5, 0.4, 0.2], ['Football', 'green', 0.9, 0.8, 0.6], ['News', 'blue', 0.3, 0.35, 0.1], ['Gaming', 'purple', 0.6, 0.7, 0.3], ['Music', 'cyan', 0.55, 0.3, 0.8]];
      const score = POSTS.map(([, , l, w, f]) => Math.round(100 * (0.4 * l + 0.4 * w + 0.2 * f)));
      const order = POSTS.map((_, i) => i).sort((a, c) => score[c] - score[a]); const rank = []; order.forEach((p, r) => { rank[p] = r; });
      const L = X0 + 10; const row = (i) => Y0 + 140 + i * 78;
      const phL = X0 + 515; const phW = 250;
      ctx.save(); fade(ctx, t); seam(ctx, t, u, P);
      title(ctx, it.label || 'How a social media feed is chosen');
      // The phone.
      ctx.fillStyle = DARK; ctx.strokeStyle = tint('ink', 0.7); ctx.lineWidth = 3; rounded(ctx, phL, Y0 + 72, phW, 466, 30); ctx.fill(); ctx.stroke();
      label(ctx, 'Your feed', phL + phW / 2, Y0 + 95, { size: 18, weight: 700, fill: 'muted' });
      const learn = k >= 2 ? smooth((u - 9) / 2) : 0;
      // Post cards: scored in the list, then flown into the feed.
      const listA = k < 3 ? 1 : 1 - smooth((u - 11.5) / 0.5);
      if (k === 0 || u < 4.5) {
        ctx.save(); ctx.globalAlpha *= 1 - smooth((u - 4) / 0.5);
        [['likes', 190], ['watch', 270], ['friends', 350], ['score', 418]].forEach(([h, x]) => label(ctx, h, L + x, Y0 + 100, { size: 18, weight: 600, fill: 'muted' }));
        ctx.restore();
      }
      POSTS.forEach(([name, c, l, w, f], i) => {
        const fly = k === 0 ? 0 : smooth((u - 4 - rank[i] * 0.35) / 0.9);
        const x = lerp(L, phL + 14, fly); const y = lerp(row(i), row(rank[i]) + 8, fly); const cw = lerp(450, phW - 28, fly);
        // After learning, lower slots turn into more football.
        const turn = rank[i] > 0 && rank[i] < 4 ? smooth(learn * 1.4 - rank[i] * 0.15) : 0;
        const cc = turn > 0.5 ? 'green' : c; const nm = turn > 0.5 ? 'Football' : name;
        if (fly <= 0 && listA <= 0) return;
        ctx.save(); if (fly < 1) ctx.globalAlpha *= Math.max(listA, fly > 0 ? 1 : 0);
        ctx.fillStyle = tint(cc, 0.12); ctx.strokeStyle = tint(cc, 0.6); ctx.lineWidth = 2; rounded(ctx, x, y - 32, cw, 64, 12); ctx.fill(); ctx.stroke();
        ctx.fillStyle = color(cc); rounded(ctx, x, y - 32, 10, 64, 5); ctx.fill();
        label(ctx, nm, x + 22, y, { size: 20, weight: 700, fill: cc, align: 'left' });
        if (fly < 0.3) {
          ctx.save(); ctx.globalAlpha *= 1 - fly / 0.3;
          [[l, 190], [w, 270], [f, 350]].forEach(([v, bx], j) => { const g = smooth((u - 0.4 - j * 0.4) / 1); ctx.fillStyle = tint(HUES[j], 0.75); ctx.fillRect(L + bx - 12, y + 22 - 40 * v * g, 24, 40 * v * g); });
          label(ctx, String(Math.round(score[i] * smooth((u - 2) / 1.4))), L + 418, y, { size: 24, weight: 800, fill: 'ink' });
          ctx.restore();
        } else {
          label(ctx, String(turn > 0.5 ? score[order[0]] - 1 - rank[i] * 2 : score[i]), x + cw - 14, y, { size: 19, weight: 700, fill: 'muted', align: 'right' });
        }
        if (k === 2 && rank[i] === 0) {
          const a = after(u, 8.3, 0.4); ctx.save(); ctx.globalAlpha *= a;
          heartPath(ctx, x + cw - 64, y - 2, 10); ctx.fillStyle = COLORS.red; ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      });
      // What the scores mean, then what the app learns.
      if (k === 1 || k === 2) {
        const a = k === 1 ? smooth((u - 6.2) / 0.4) * clamp((8 - u) / 0.3) : smooth((u - 8.1) / 0.4) * clamp((11.5 - u) / 0.4);
        ctx.save(); ctx.globalAlpha *= a;
        if (k === 1) {
          label(ctx, 'score =', X0 + 40, Y0 + 170, { size: 22, weight: 800, fill: 'ink', align: 'left' });
          [['40% · chance you like it', 0], ['40% · predicted watch time', 1], ['20% · how close the poster is', 2]].forEach(([s2, j]) => label(ctx, `${j ? '+ ' : ''}${s2}`, X0 + 60, Y0 + 214 + j * 40, { size: 20, weight: 600, fill: HUES[j], align: 'left' }));
          arr(ctx, X0 + 300, Y0 + 400, X0 + 500, Y0 + 400, 'cyan', 4);
          label(ctx, 'sorted, highest first', X0 + 400, Y0 + 372, { size: 19, weight: 700, fill: 'cyan' });
        } else {
          person(ctx, X0 + 150, Y0 + 400, 1.2, 'ink', { face: 'happy', armR: 1.2, look: 1 });
          ctx.fillStyle = DARK; ctx.strokeStyle = COLORS.green; ctx.lineWidth = 2.5; rounded(ctx, X0 + 196, Y0 + 268, 36, 60, 6); ctx.fill(); ctx.stroke();
          label(ctx, 'watched to the end', X0 + 260, Y0 + 220, { size: 19, weight: 700, fill: 'green', align: 'left' });
          label(ctx, '→ model updates:', X0 + 260, Y0 + 300, { size: 19, weight: 600, fill: 'ink', align: 'left' });
          label(ctx, 'more football', X0 + 260, Y0 + 328, { size: 19, weight: 700, fill: 'green', align: 'left' });
        }
        ctx.restore();
      }
      // The filter bubble.
      if (k === 3) {
        const a = smooth((u - 11.7) / 0.6); const bx = X0 + 240; const by = Y0 + 320; const R = 140;
        ctx.save(); ctx.globalAlpha *= a;
        ctx.fillStyle = tint('green', 0.08); ctx.strokeStyle = tint('green', 0.7); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bx, by, R, 0, TAU); ctx.fill(); ctx.stroke();
        person(ctx, bx, by + 50, 0.8, 'ink', { face: 'neutral' });
        for (let j = 0; j < 8; j++) { const an = b.clock * 0.6 + (j / 8) * TAU; dot(ctx, bx + Math.cos(an) * 100, by + Math.sin(an) * 100, 9, 'green'); }
        for (let j = 0; j < 6; j++) {
          const an = (j / 6) * TAU + 0.5; const ph = mod(b.clock * 0.5 + j / 6, 1); const r = R + 20 + 60 * Math.abs(Math.cos(ph * Math.PI));
          dot(ctx, bx + Math.cos(an) * r, by + Math.sin(an) * r, 9, ['orange', 'blue', 'purple', 'cyan', 'red', 'yellow'][j]);
        }
        chip(ctx, 'filter bubble', bx, by - R - 10, 'green', 19);
        ctx.restore();
      }
      const CAP = ['Each post is scored: will you like it, watch it, know the poster?', 'The highest scores go to the top of your feed', 'You watch football → the app shows you more football', 'Filter bubble: more of the same, fewer other views'];
      label(ctx, CAP[k], cx, Y0 + 574, { size: 21, weight: 700, fill: ['ink', 'cyan', 'green', 'green'][k] });
      label(ctx, 'Feeds are tuned to keep you watching, not to give a balanced view', cx, Y0 + 622, { size: 18, weight: 500, fill: 'ink' });
      label(ctx, 'Following varied sources shows you the wider picture', cx, Y0 + 656, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Guesses needed grow exponentially with length and character types.
    'password-strength'(b, ctx, it, t) {
      const P = 14; const u = cycle(t, P, 0.6); const RATE = 1e10;
      const PW = [['sunset', 26, 6, '6 lowercase · 26⁶ ≈ 309 million'], ['Sunset', 52, 6, '6 letters, mixed case · 52⁶ ≈ 20 billion'], ['sunset42', 36, 8, '8 letters + digits · 36⁸ ≈ 2.8 trillion'], ['Sun$et42!xQz', 95, 12, '12, all character types · 95¹² ≈ 5 × 10²³'], ['maple river cloud tiger lamp quiet', 7776, 6, '6 random words · 7776⁶ ≈ 2 × 10²³']];
      const human = (sec) => {
        if (sec < 1) return 'instantly'; if (sec < 60) return `${Math.round(sec)} seconds`; if (sec < 3600) return `${Math.round(sec / 60)} minutes`; if (sec < 86400) return `${Math.round(sec / 3600)} hours`;
        const y = sec / 3.156e7; if (y < 1) return `${Math.round(sec / 86400)} days`; if (y < 1e6) return `${commas(Number(y.toPrecision(2)))} years`; if (y < 1e9) return `${(y / 1e6).toFixed(1)} million years`; return `${(y / 1e9).toFixed(1)} billion years`;
      };
      const bl = X0 + 440; const bw = X1 - 24 - bl; const fr = (sec) => clamp((Math.log10(Math.max(sec, 0.01)) + 2) / 16);
      ctx.save(); fade(ctx, t); seam(ctx, t, u, P);
      title(ctx, it.label || 'Password strength: time to guess it');
      PW.forEach(([pw, set, len, info], i) => {
        const t0 = 0.4 + i * 1.5; const a = after(u, t0, 0.3); if (a <= 0) return;
        const y = Y0 + 108 + i * 82; const sec = set ** len / RATE; const f = fr(sec) * smooth((u - t0 - 0.4) / 0.8);
        const c = sec < 3600 ? 'red' : sec < 3.156e7 ? 'orange' : 'green';
        ctx.save(); ctx.globalAlpha *= a;
        const shown = pw.slice(0, Math.ceil(pw.length * clamp((u - t0) / 0.5)));
        ctx.font = `700 22px ${MONO}`;
        label(ctx, shown, X0 + 24, y - 14, { size: i === 4 ? 19 : 22, weight: 700, fill: 'ink', align: 'left' });
        label(ctx, info, X0 + 24, y + 16, { size: 18, weight: 500, fill: 'muted', align: 'left' });
        ctx.fillStyle = tint(c, 0.12); rounded(ctx, bl, y + 4, bw, 16, 8); ctx.fill();
        ctx.fillStyle = tint(c, 0.8); rounded(ctx, bl, y + 4, Math.max(8, bw * f), 16, 8); ctx.fill();
        if (u > t0 + 1.1) label(ctx, human(sec), X1 - 24, y - 16, { size: 21, weight: 800, fill: c, align: 'right' });
        ctx.restore();
      });
      // Log-scale ticks: every step is ten times longer.
      const ty = Y0 + 506;
      for (const [s, n] of [[1, '1 s'], [3600, '1 hour'], [3.156e7, '1 year'], [3.156e13, '1M years']]) {
        const x = bl + fr(s) * bw; line(ctx, x, ty - 16, x, ty - 8, 'muted', 2);
        label(ctx, n, s > 1e10 ? x + 4 : x, ty + 6, { size: 18, weight: 500, fill: 'muted', align: s > 1e10 ? 'right' : 'center' });
      }
      label(ctx, 'log scale', bl - 12, ty + 6, { size: 18, weight: 500, fill: 'muted', align: 'right' });
      const late = u > 8.2;
      label(ctx, late ? 'Long passphrases of random words: strong and easy to remember' : 'Each extra character multiplies the number of guesses', cx, Y0 + 562, { size: 21, weight: 700, fill: late ? 'green' : 'ink' });
      label(ctx, 'Time to try every combination at 10 billion guesses a second', cx, Y0 + 616, { size: 18, weight: 500, fill: 'muted' });
      label(ctx, 'Use a different password for each site; a password manager helps', cx, Y0 + 652, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Zoom into an image until the pixels show, each one three numbers.
    'pixels-images'(b, ctx, it, t) {
      const P = 14; const u = cycle(t, P, 0.6);
      const scene = (x, y) => {
        let r = lerp(40, 120, y); let g = lerp(80, 170, y); let bl = lerp(180, 240, y);
        const ds = Math.hypot(x - 0.74, y - 0.27);
        if (ds < 0.13) { r = 255; g = Math.round(205 - ds * 160); bl = Math.round(60 - ds * 180); }
        if (y > 0.72 + 0.06 * Math.sin(x * 6)) { r = 50; g = Math.round(170 - (y - 0.7) * 120); bl = 80; }
        if (x > 0.17 && x < 0.43 && y > 0.56 && y < 0.82) { r = 200; g = 75; bl = 60; if (x > 0.26 && x < 0.34 && y > 0.68) { r = 90; g = 50; bl = 30; } }
        if (y > 0.4 && y <= 0.56 && Math.abs(x - 0.3) < (y - 0.4) * 1.05) { r = 120; g = 50; bl = 45; }
        return [Math.round(r), Math.round(g), Math.round(bl)];
      };
      const C = it._c || (it._c = (() => {
        const grid = (n) => { const out = []; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) out.push(scene((i + 0.5) / n, (j + 0.5) / n)); return out; };
        return { g48: grid(48), small: [8, 16, 32].map(grid) };
      })());
      const N = 48; const S = 400; const L = X0 + 30; const T = Y0 + 76; const TX = 39; const TY = 12;
      const z = 1 + 7 * smooth((u - 3) / 3) * (1 - smooth((u - 11) / 2.2));
      const vx = lerp(N / 2, TX + 0.5, smooth((z - 1) / 2)); const vy = lerp(N / 2, TY + 0.5, smooth((z - 1) / 2));
      const cs = (S / N) * z; const ox = L + S / 2 - vx * cs; const oy = T + S / 2 - vy * cs;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Pixels: how a digital image is stored');
      ctx.save(); ctx.beginPath(); ctx.rect(L, T, S, S); ctx.clip();
      const i0 = Math.max(0, Math.floor((L - ox) / cs)); const i1 = Math.min(N - 1, Math.ceil((L + S - ox) / cs));
      const j0 = Math.max(0, Math.floor((T - oy) / cs)); const j1 = Math.min(N - 1, Math.ceil((T + S - oy) / cs));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const [r, g, bl] = C.g48[j * N + i]; ctx.fillStyle = `rgb(${r},${g},${bl})`; ctx.fillRect(ox + i * cs, oy + j * cs, cs + 0.6, cs + 0.6); }
      if (cs > 14) {
        ctx.strokeStyle = `rgba(5,8,22,${clamp((cs - 14) / 20) * 0.8})`; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = i0; i <= i1 + 1; i++) { ctx.moveTo(ox + i * cs, T); ctx.lineTo(ox + i * cs, T + S); }
        for (let j = j0; j <= j1 + 1; j++) { ctx.moveTo(L, oy + j * cs); ctx.lineTo(L + S, oy + j * cs); }
        ctx.stroke();
      }
      const zoomed = z > 6;
      if (zoomed) { ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 4; glow(ctx, COLORS.ink, 8); ctx.strokeRect(ox + TX * cs, oy + TY * cs, cs, cs); ctx.shadowBlur = 0; }
      ctx.restore();
      ctx.strokeStyle = tint('ink', 0.6); ctx.lineWidth = 2; ctx.strokeRect(L, T, S, S);
      // The highlighted pixel's numbers.
      const [r, g, bl] = C.g48[TY * N + TX];
      if (zoomed) {
        ctx.save(); ctx.globalAlpha *= clamp((z - 6) / 1);
        ctx.fillStyle = `rgb(${r},${g},${bl})`; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2; rounded(ctx, L, T + S + 18, 44, 44, 8); ctx.fill(); ctx.stroke();
        [['R', r, 'red'], ['G', g, 'green'], ['B', bl, 'blue']].forEach(([n, v, c], i) => chip(ctx, `${n} ${v}`, L + 120 + i * 112, T + S + 40, c, 21));
        ctx.restore();
      } else label(ctx, '48 × 48 = 2,304 pixels', L + S / 2, T + S + 40, { size: 20, weight: 700, fill: 'ink' });
      // The same picture at three resolutions.
      label(ctx, 'Resolution', X0 + 620, Y0 + 78, { size: 19, weight: 700, fill: 'muted' });
      [8, 16, 32].forEach((n, k) => {
        const x = X0 + 480; const y = Y0 + 100 + k * 128; const s = 104; const px = s / n; const g = C.small[k];
        ctx.save(); ctx.globalAlpha *= after(t, 0.3 + k * 0.3);
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const [rr, gg, bb] = g[j * n + i]; ctx.fillStyle = `rgb(${rr},${gg},${bb})`; ctx.fillRect(x + i * px, y + j * px, px + 0.5, px + 0.5); }
        ctx.strokeStyle = tint('ink', 0.5); ctx.lineWidth = 1.5; ctx.strokeRect(x, y, s, s);
        label(ctx, `${n} × ${n}`, x + 122, y + 38, { size: 22, weight: 800, fill: 'ink', align: 'left' });
        label(ctx, `${commas(n * n)} pixels`, x + 122, y + 68, { size: 18, weight: 500, fill: 'muted', align: 'left' });
        ctx.restore();
      });
      label(ctx, 'more pixels, more detail', X0 + 620, Y0 + 484, { size: 19, weight: 700, fill: 'cyan' });
      const cap = u < 3 ? 'A digital image is a grid of tiny squares: pixels' : !zoomed ? 'Zoom in and the squares appear…' : 'Each pixel is one colour, stored as three numbers';
      label(ctx, cap, cx, Y0 + 586, { size: 22, weight: 700, fill: 'ink' });
      label(ctx, 'Red, green and blue each go from 0 to 255: 3 bytes per pixel', cx, Y0 + 626, { size: 18, weight: 500, fill: 'muted' });
      label(ctx, 'A 12-megapixel photo is about 36 MB before compression', cx, Y0 + 660, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // A bit is 0 or 1; a qubit is a spinning coin until it is measured.
    'qubit-superposition'(b, ctx, it, t) {
      const P = 16; const u = cycle(t, P, 0.6); const n = loopN(t, P, 0.6);
      const k = u < 4 ? 0 : u < 8 ? 1 : u < 10.5 ? 2 : u < 14 ? 3 : 4;
      const measured = u >= 8 && u < 10.5;
      const th0 = 1.15 + 0.45 * Math.sin(b.clock * 0.7); const p0 = Math.cos(th0 / 2) ** 2;
      const outcome = rnd(n + 3) < 0.7 ? 0 : 1;
      ctx.save(); fade(ctx, t); seam(ctx, t, u, P);
      title(ctx, it.label || 'Qubits and superposition');
      const PAN = [[X0 + 10, 'Bit', 'cyan'], [X0 + 280, 'Qubit', 'purple'], [X0 + 550, 'Bloch sphere', 'yellow']];
      PAN.forEach(([x, name, c]) => { panel(ctx, x, Y0 + 72, 240, 320, c, 0.06, 16); label(ctx, name, x + 120, Y0 + 100, { size: 22, weight: 800, fill: c }); });
      const coin = (x, y, sx, face, c) => {
        ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.04, Math.abs(sx)), 1);
        ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(0, 0, 62, 0, TAU); ctx.fill(); ctx.fillStyle = tint(c, 0.3); ctx.fill();
        ctx.strokeStyle = color(c); ctx.lineWidth = 4; ctx.stroke();
        ctx.restore();
        if (Math.abs(sx) > 0.25) { ctx.save(); ctx.translate(x, y); ctx.scale(Math.abs(sx), 1); label(ctx, String(face), 0, 2, { size: 50, weight: 800, fill: c }); ctx.restore(); }
      };
      // Bit: definitely 0 or 1, flipping now and then.
      const fl = Math.floor(b.clock / 2.2); const fq = mod(b.clock, 2.2);
      coin(X0 + 130, Y0 + 230, fq < 0.3 ? Math.cos((fq / 0.3) * Math.PI) : 1, fq < 0.15 ? (fl + 1) % 2 : fl % 2, 'cyan');
      label(ctx, '0 or 1, never both', X0 + 130, Y0 + 362, { size: 18, weight: 600, fill: 'ink' });
      // Qubit: spinning, until measured.
      const spin = measured ? 1 : Math.cos(b.clock * 9);
      coin(X0 + 400, Y0 + 230, spin, measured ? outcome : spin > 0 ? 0 : 1, 'purple');
      label(ctx, measured ? `measured: ${outcome}` : 'a mix of 0 and 1', X0 + 400, Y0 + 362, { size: 18, weight: 600, fill: measured ? 'yellow' : 'ink' });
      // Bloch sphere: the arrow's angle sets the odds.
      const bx = X0 + 660; const by = Y0 + 236; const R = 88;
      ctx.strokeStyle = tint('yellow', 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx, by, R, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(bx, by, R, 22, 0, 0, Math.PI); ctx.stroke();
      ctx.save(); ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.ellipse(bx, by, R, 22, 0, Math.PI, TAU); ctx.stroke(); line(ctx, bx, by - R, bx, by + R, tint('yellow', 0.4), 1.5); ctx.restore();
      label(ctx, '|0⟩', bx + 12, by - R - 12, { size: 20, weight: 800, fill: 'ink', align: 'left' });
      label(ctx, '|1⟩', bx + 12, by + R + 12, { size: 20, weight: 800, fill: 'ink', align: 'left' });
      const th = measured ? lerp(th0, outcome ? Math.PI : 0, smooth((u - 8) / 0.4)) : th0; const phi = b.clock * 1.3;
      const ax = bx + R * Math.sin(th) * Math.cos(phi); const ay = by - R * Math.cos(th) + 22 * Math.sin(th) * Math.sin(phi);
      glow(ctx, COLORS.yellow, 8); arr(ctx, bx, by, ax, ay, 'yellow', 4); ctx.shadowBlur = 0; dot(ctx, bx, by, 4, 'yellow');
      const pp = measured ? 1 - outcome : p0;
      label(ctx, `chance of 0: ${Math.round(pp * 100)}%`, bx, Y0 + 362, { size: 18, weight: 600, fill: 'ink' });
      // Two qubits: four states at once, until measured.
      const top = Y0 + 412;
      panel(ctx, X0 + 10, top, 780, 160, 'blue', k >= 3 ? 0.1 : 0.04, 16);
      label(ctx, '2 qubits', X0 + 40, top + 60, { size: 22, weight: 800, fill: 'blue', align: 'left' });
      label(ctx, '4 states at once', X0 + 40, top + 92, { size: 18, weight: 500, fill: 'muted', align: 'left' });
      const pick = 2; const col = k === 4;
      ['|00⟩', '|01⟩', '|10⟩', '|11⟩'].forEach((s, j) => {
        const x = X0 + 300 + j * 125; const g = k >= 3 ? smooth((u - 10.6) / 1) : 0.25;
        const v = col ? lerp(0.25, j === pick ? 1 : 0, smooth((u - 14) / 0.4)) : 0.25 * (k >= 3 ? g : 1) * (1 + (k >= 3 ? 0.06 * Math.sin(b.clock * 5 + j * 1.7) : 0));
        const base = top + 124; const h = 92 * v;
        if (j === 0) { ctx.save(); ctx.globalAlpha *= k >= 3 ? 1 : 0.4; line(ctx, X0 + 250, base - 92, X1 - 30, base - 92, FAINT, 1.5, [5, 6]); line(ctx, X0 + 250, base, X1 - 30, base, tint('muted', 0.5), 2); ctx.restore(); }
        ctx.save(); ctx.globalAlpha *= k >= 3 ? 1 : 0.4;
        ctx.fillStyle = tint(HUES[j], 0.7); rounded(ctx, x - 30, base - h, 60, Math.max(2, h), 6); ctx.fill();
        label(ctx, s, x, base + 22, { size: 20, weight: 700, fill: 'ink' });
        label(ctx, `${Math.round((col ? v : 0.25) * 100)}%`, x, base - h - 14, { size: 18, weight: 600, fill: 'muted' });
        ctx.restore();
      });
      const CAP = ['A bit is 0 or 1; a qubit can be in a superposition of both', 'The arrow’s angle sets the chance of reading 0 or 1', 'Measuring forces a definite answer: 0 or 1', '2 qubits: a superposition of 4 states at once', '…but measuring still gives just one of them'];
      label(ctx, CAP[k], cx, Y0 + 608, { size: 21, weight: 700, fill: k === 2 || k === 4 ? 'yellow' : 'ink' });
      label(ctx, 'n qubits hold 2ⁿ possibilities; algorithms use interference to find answers', cx, Y0 + 652, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // VR: a screen per eye that follows your head. AR: a phone adds an object to a real table.
    'vr-ar'(b, ctx, it, t) {
      const P = 12; const u = cycle(t, P, 0.6); const vr = u < 6;
      const yaw = 0.55 * Math.sin(b.clock * 0.8); const pan = 46 * Math.sin(b.clock * 0.6);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Virtual and augmented reality');
      // VR panel.
      ctx.save(); ctx.globalAlpha *= vr ? 1 : 0.55;
      panel(ctx, X0 + 10, Y0 + 72, 380, 492, 'cyan', vr ? 0.1 : 0.04, 16);
      label(ctx, 'VR: virtual reality', X0 + 200, Y0 + 100, { size: 21, weight: 800, fill: 'cyan' });
      [[X0 + 35, -1, 'left eye'], [X0 + 210, 1, 'right eye']].forEach(([sx, eye, name]) => {
        const sy = Y0 + 128; const sw = 155; const sh = 110;
        ctx.save(); ctx.beginPath(); rounded(ctx, sx, sy, sw, sh, 10); ctx.clip();
        ctx.fillStyle = '#0b1638'; ctx.fillRect(sx, sy, sw, sh);
        const off = -yaw * 150;
        dot(ctx, sx + sw / 2 + off * 0.3 + 50, sy + 30, 12, 'yellow');
        ctx.fillStyle = tint('purple', 0.6);
        poly(ctx, [sx - 200 + off * 0.5, sy + sh, sx - 120 + off * 0.5, sy + 50, sx - 40 + off * 0.5, sy + sh, sx + 10 + off * 0.5, sy + 60, sx + 90 + off * 0.5, sy + sh, sx + 150 + off * 0.5, sy + 45, sx + 230 + off * 0.5, sy + sh, sx + 300 + off * 0.5, sy + 55, sx + 380 + off * 0.5, sy + sh], true); ctx.fill();
        const qx = sx + sw / 2 + off - eye * 8; const qy = sy + 64;
        ctx.fillStyle = tint('cyan', 0.75); ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 1.5;
        poly(ctx, [qx - 18, qy - 8, qx, qy - 18, qx + 18, qy - 8, qx, qy + 2], true); ctx.fill(); ctx.stroke();
        ctx.fillStyle = tint('blue', 0.8); poly(ctx, [qx - 18, qy - 8, qx, qy + 2, qx, qy + 22, qx - 18, qy + 12], true); ctx.fill(); ctx.stroke();
        ctx.fillStyle = tint('blue', 0.55); poly(ctx, [qx + 18, qy - 8, qx, qy + 2, qx, qy + 22, qx + 18, qy + 12], true); ctx.fill(); ctx.stroke();
        ctx.restore();
        ctx.strokeStyle = tint('cyan', 0.7); ctx.lineWidth = 2; rounded(ctx, sx, sy, sw, sh, 10); ctx.stroke();
        label(ctx, name, sx + sw / 2, sy + sh + 20, { size: 18, weight: 600, fill: 'muted' });
      });
      // The head turning, wearing the headset.
      const hx = X0 + 200; const hy = Y0 + 368; const sh = Math.sin(yaw) * 26;
      ctx.save(); ctx.globalAlpha *= 0.5; line(ctx, hx - 30 + sh, hy - 30, X0 + 112, Y0 + 262, 'cyan', 2, [5, 6]); line(ctx, hx + 30 + sh, hy - 30, X0 + 288, Y0 + 262, 'cyan', 2, [5, 6]); ctx.restore();
      ctx.fillStyle = DARK; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx, hy, 48, 0, TAU); ctx.fill(); ctx.fillStyle = tint('ink', 0.15); ctx.fill(); ctx.stroke();
      ctx.fillStyle = tint('cyan', 0.6); ctx.strokeStyle = COLORS.cyan; rounded(ctx, hx - 44 + sh, hy - 24, 88, 34, 10); ctx.fill(); ctx.stroke();
      line(ctx, hx - 48, hy - 8, hx - 44 + sh, hy - 8, 'cyan', 4); line(ctx, hx + 48, hy - 8, hx + 44 + sh, hy - 8, 'cyan', 4);
      ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx + sh * 0.9, hy + 24, 9, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
      ctx.strokeStyle = tint('yellow', 0.85); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx, hy, 66, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5); ctx.stroke();
      const tipA = -Math.PI / 2 + (yaw > 0 ? 0.5 : -0.5);
      dot(ctx, hx + Math.cos(tipA) * 66, hy + Math.sin(tipA) * 66, 6, 'yellow');
      para(ctx, 'One screen per eye, slightly different views: your brain sees depth', X0 + 25, Y0 + 466, 350, 18, 'ink', 500, 2);
      para(ctx, 'Sensors track your head, so the view turns with you', X0 + 25, Y0 + 526, 350, 18, 'cyan', 600, 2);
      ctx.restore();
      // AR panel.
      ctx.save(); ctx.globalAlpha *= vr ? 0.55 : 1;
      panel(ctx, X0 + 410, Y0 + 72, 380, 492, 'orange', vr ? 0.04 : 0.1, 16);
      label(ctx, 'AR: augmented reality', X0 + 600, Y0 + 100, { size: 21, weight: 800, fill: 'orange' });
      const table = (a) => {
        ctx.fillStyle = tint('orange', 0.18 * a); ctx.strokeStyle = tint('orange', 0.7 * a); ctx.lineWidth = 2.5;
        poly(ctx, [X0 + 485, Y0 + 350, X0 + 715, Y0 + 350, X0 + 750, Y0 + 386, X0 + 450, Y0 + 386], true); ctx.fill(); ctx.stroke();
        line(ctx, X0 + 470, Y0 + 386, X0 + 470, Y0 + 446, tint('orange', 0.7 * a), 5); line(ctx, X0 + 730, Y0 + 386, X0 + 730, Y0 + 446, tint('orange', 0.7 * a), 5);
      };
      table(0.6);
      label(ctx, 'real table', X0 + 760, Y0 + 466, { size: 18, weight: 600, fill: 'muted', align: 'right' });
      const pL = X0 + 530 + pan; const pT = Y0 + 186; const pW = 140; const pH = 236;
      ctx.fillStyle = DARK; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 3; rounded(ctx, pL, pT, pW, pH, 18); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.beginPath(); rounded(ctx, pL + 8, pT + 14, pW - 16, pH - 28, 10); ctx.clip();
      ctx.fillStyle = 'rgba(40,52,90,0.9)'; ctx.fillRect(pL, pT, pW, pH);
      table(1.3);
      const qx = X0 + 600; const qy = Y0 + 340;
      glow(ctx, COLORS.green, 12);
      ctx.fillStyle = tint('green', 0.85); poly(ctx, [qx - 24, qy - 12, qx, qy - 24, qx + 24, qy - 12, qx, qy], true); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = tint('green', 0.6); poly(ctx, [qx - 24, qy - 12, qx, qy, qx, qy + 26, qx - 24, qy + 14], true); ctx.fill();
      ctx.fillStyle = tint('teal', 0.45); poly(ctx, [qx + 24, qy - 12, qx, qy, qx, qy + 26, qx + 24, qy + 14], true); ctx.fill();
      ctx.restore();
      label(ctx, 'virtual cube, only on screen', X0 + 600, Y0 + 156, { size: 18, weight: 700, fill: 'green' });
      para(ctx, 'The camera shows the real world; graphics are added on top, anchored to the table', X0 + 425, Y0 + 520, 350, 18, 'ink', 500, 3);
      ctx.restore();
      label(ctx, vr ? 'VR replaces what you see with a virtual world' : 'AR adds virtual things to the real world', cx, Y0 + 606, { size: 22, weight: 800, fill: vr ? 'cyan' : 'orange' });
      label(ctx, 'Both track movement many times a second so the picture keeps up', cx, Y0 + 648, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },
  };
}
