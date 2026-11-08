// World religions and sacred books for the board: when the faiths began,
// their symbols, scriptures, stories, teachings, festivals and places of
// worship, for students aged 8 to 18. Every tradition is described in its own
// terms ("Hindus believe…", "the story tells…") with the same care and the
// same visual weight; no faith is ranked or judged. God and the prophets are
// never pictured: the scenes use symbols, light, books, places and
// architecture, and epic heroes appear only as small, dignified silhouettes.
// Each scene runs in stages with a caption per stage and loops. Each is a
// function of time (t since it appeared, b.clock for the loop): plain canvas
// calls, a few soft gradients, no state between frames beyond constants cached
// on the item. FAITH_SIMS says what each one is for, so a lesson's words can
// pick the right picture.

export const FAITH_SIMS = {
  'religions-timeline': { title: 'When the world religions began', keywords: ['world religions timeline', 'history of religions', 'oldest religion', 'when did religions begin', 'major world religions', 'origins of religion', 'founders of religions'], example: {} },
  'religion-symbols': { title: 'Symbols of the world religions', keywords: ['religious symbols', 'symbols of religions', 'star of david', 'dharma wheel', 'crescent and star', 'khanda symbol', 'om symbol', 'jain ahimsa hand'], example: {} },
  'sacred-books-shelf': { title: 'Sacred books of the world', keywords: ['sacred books', 'holy books', 'sacred texts', 'religious scriptures', 'scriptures of world religions', 'holy scriptures', 'world scriptures'], example: {} },
  'gita-chariot': { title: 'The Bhagavad Gita', keywords: ['bhagavad gita', 'krishna and arjuna', "arjuna's chariot", 'battle of kurukshetra', 'karma yoga', 'bhakti yoga', 'jnana yoga', 'song of god'], example: {} },
  'ramayana-journey': { title: 'The Ramayana', keywords: ['the ramayana', 'rama and sita', 'hanuman finds sita', 'return to ayodhya', 'rama setu', 'story of diwali', 'ravana king of lanka'], example: {} },
  'mahabharata-family': { title: 'The Mahabharata', keywords: ['the mahabharata', 'pandavas and kauravas', 'five pandava brothers', 'hundred kauravas', 'kuru dynasty', 'sage vyasa', 'kurukshetra war'], example: {} },
  'eightfold-path': { title: 'The Eightfold Path', keywords: ['eightfold path', 'noble eightfold path', 'four noble truths', 'middle way', 'teachings of the buddha', 'right mindfulness', 'right speech'], example: {} },
  'five-pillars': { title: 'The Five Pillars of Islam', keywords: ['five pillars of islam', 'five pillars', 'shahada declaration', 'salah prayer', 'zakat charity', 'sawm fasting', 'hajj pilgrimage', 'five daily prayers'], example: {} },
  'ten-commandments': { title: 'The Ten Commandments', keywords: ['ten commandments', 'tablets of stone', 'moses at mount sinai', 'exodus 20', 'deuteronomy 5', 'keep the sabbath', 'the decalogue'], example: {} },
  'sikh-gurus': { title: 'The ten Sikh Gurus', keywords: ['ten sikh gurus', 'sikh gurus', 'guru nanak', 'guru gobind singh', 'five ks', 'the five ks', 'guru granth sahib as guru', 'the khalsa'], example: {} },
  'samsara-cycle': { title: 'Samsara: the cycle of rebirth', keywords: ['cycle of rebirth', 'wheel of samsara', 'karma and rebirth', 'law of karma', 'cycle of birth and death', 'liberation from rebirth', 'moksha and nirvana', 'belief in reincarnation'], example: {} },
  'festivals-of-light': { title: 'Festivals of light', keywords: ['festivals of light', 'festival of lights', 'diwali lamps', 'diwali diyas', 'hanukkah menorah', 'eight nights of hanukkah', 'vesak lanterns', 'religious festivals'], example: {} },
  'places-of-worship': { title: 'Places of worship', keywords: ['places of worship', 'hindu temple', 'inside a synagogue', 'sikh gurdwara', 'buddhist stupa', 'parts of a mosque', 'parts of a church', 'features of a mandir'], example: {} },
  'golden-rule': { title: 'The Golden Rule', keywords: ['golden rule', 'treat others as you want to be treated', 'do unto others', 'ethic of reciprocity', 'love your neighbour', 'shared values of religions'], example: {} },
  'abrahamic-family': { title: 'The Abrahamic faiths', keywords: ['abrahamic religions', 'abrahamic faiths', 'judaism christianity and islam', 'father abraham', 'prophet ibrahim', 'people of the book', 'monotheistic religions'], example: {} },
  'creation-stories': { title: 'Creation stories', keywords: ['creation stories', 'creation story', 'creation myths', 'genesis creation', 'seven days of creation', 'brahma vishnu shiva', 'norse creation', 'big bang and evolution'], example: {} },
  'upanishad-atman': { title: 'Atman and Brahman', keywords: ['atman and brahman', 'the upanishads', 'tat tvam asi', 'ultimate reality brahman', 'the self atman', 'advaita vedanta', 'you are that'], example: {} },
  'tao-water': { title: 'The Tao: be like water', keywords: ['tao te ching', 'the tao', 'wu wei', 'be like water', 'taoist teachings', 'daoist teachings', 'soft overcomes hard'], example: {} },
  'quran-structure': { title: 'How the Quran is arranged', keywords: ['114 surahs', 'surahs of the quran', 'structure of the quran', 'al-fatiha', 'meccan and medinan', 'chapters of the quran', 'revelation of the quran'], example: {} },
  'bible-library': { title: 'The Bible: a library of books', keywords: ['books of the bible', 'old testament', 'new testament', '66 books', 'the bible library', 'gospels and letters', 'canon of the bible'], example: {} },
};

export function faithSims(kit) {
  // eslint-disable-next-line no-unused-vars
  const { FIG, COL, COLORS, HUES, FONT, glow, label, wrapLabel, rounded, arrow, clamp, easeOut, outBack, color, tint } = kit;
  const X0 = FIG.x; const Y0 = FIG.y; const X1 = FIG.x + FIG.w; const Y1 = FIG.y + FIG.h;
  const cx = X0 + FIG.w / 2; const cy = Y0 + FIG.h / 2;
  const TAU = Math.PI * 2;
  const LINE = 'rgba(220,230,255,0.8)'; const DARK = '#070b1d';
  const INK2 = 'rgba(8,12,30,0.94)';
  const DEVA = "'Kohinoor Devanagari', 'Noto Sans Devanagari', 'Nirmala UI', 'Mangal', 'Devanagari Sangam MN', serif";
  // A warm palette (hex, so tint() works on it).
  const GOLD = '#ffd27a'; const SAFF = '#ff9a3c'; const FLAME = '#ffe7a3'; const CREAM = '#fff4dc'; const ROSE = '#ff8fa3';
  const CLAY = '#c8643c'; const WOOD = '#8a5a34'; const STONE = '#c9c1ae'; const NIGHT = '#141a33'; const JADE = '#4fd1a5';
  const SKY = '#7cc4ff'; const LILAC = '#c4a7ff'; const SAND = '#e8c48a';

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

  // Drawing helpers in the board's holo style, warmed up.
  const title = (ctx, text) => label(ctx, String(text), cx, Y0 + 28, { size: 26, weight: 700, fill: 'ink' });
  function chip(ctx, text, x, y, c = 'ink', size = 20, align = 'center') {
    text = String(text);
    ctx.font = `700 ${size}px ${FONT}`;
    const w = ctx.measureText(text).width + 24; const h = size + 14;
    const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.fillStyle = 'rgba(5,8,22,0.8)'; ctx.strokeStyle = tint(c, 0.6); ctx.lineWidth = 1.5;
    rounded(ctx, left, y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
    label(ctx, text, left + w / 2, y + 1, { size, weight: 700, fill: c });
    return w;
  }
  function dot(ctx, x, y, r, c) { ctx.fillStyle = color(c); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
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
  // A smooth curve sampled into a polyline (quadratic from a through ctrl to b).
  function qpts(ax, ay, qx, qy, bx, by, n = 24) {
    const out = [];
    for (let i = 0; i <= n; i++) { const u = i / n; const v = 1 - u; out.push(v * v * ax + 2 * v * u * qx + u * u * bx, v * v * ay + 2 * v * u * qy + u * u * by); }
    return out;
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
    return out.length;
  }
  // A line of text in several colours: parts = [[text, colour, weight?], ...].
  function rich(ctx, parts, x, y, size = 20, weight = 600, align = 'center') {
    const ws = parts.map(([s, , w]) => { ctx.font = `${w || weight} ${size}px ${FONT}`; return ctx.measureText(s).width; });
    const W = ws.reduce((a, w) => a + w, 0);
    let px = align === 'center' ? x - W / 2 : align === 'right' ? x - W : x;
    parts.forEach(([s, c, w], i) => { label(ctx, s, px, y, { size, weight: w || weight, fill: c, align: 'left' }); px += ws[i]; });
    return W;
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

  // ─── Light: halos, flames, lamps and candles ──────────────────────────
  // A soft round glow (a radial gradient, much cheaper than shadowBlur).
  function halo(ctx, x, y, r, c = GOLD, a = 0.45) {
    if (r <= 0 || a <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, tint(c, a)); g.addColorStop(0.45, tint(c, a * 0.35)); g.addColorStop(1, tint(c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  // The board panel's backdrop, washed with a warm or cool light.
  function backdrop(ctx, top = '#1b2350', bottom = '#3a2a1a', a = 0.55, y0 = Y0 + 52, y1 = Y0 + 566) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, tint(top, a)); g.addColorStop(1, tint(bottom, a));
    ctx.fillStyle = g; rounded(ctx, X0 + 8, y0, FIG.w - 16, y1 - y0, 16); ctx.fill();
  }
  // A flickering flame standing on (x, y), h tall.
  function flame(ctx, x, y, h, k, seed = 0, a = 1, haloA = 0.42) {
    if (a <= 0) return;
    const f = 0.88 + 0.12 * Math.sin(k * 9.1 + seed * 3.7) * Math.sin(k * 5.3 + seed);
    const sway = Math.sin(k * 3.3 + seed * 2.1) * h * 0.08;
    const H = h * f; const w = h * 0.36;
    ctx.save(); ctx.globalAlpha *= a;
    halo(ctx, x, y - H * 0.45, h * 2.3, SAFF, haloA * f);
    ctx.fillStyle = '#ffb347';
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.bezierCurveTo(x - w, y - H * 0.15, x - w * 0.55 + sway * 0.4, y - H * 0.7, x + sway, y - H);
    ctx.bezierCurveTo(x + w * 0.55 + sway * 0.4, y - H * 0.7, x + w, y - H * 0.15, x, y);
    ctx.fill();
    ctx.fillStyle = FLAME;
    ctx.beginPath(); ctx.moveTo(x, y - H * 0.05);
    ctx.bezierCurveTo(x - w * 0.5, y - H * 0.2, x - w * 0.25 + sway * 0.3, y - H * 0.55, x + sway * 0.7, y - H * 0.72);
    ctx.bezierCurveTo(x + w * 0.25 + sway * 0.3, y - H * 0.55, x + w * 0.5, y - H * 0.2, x, y - H * 0.05);
    ctx.fill();
    ctx.restore();
  }
  // A clay diya (oil lamp), s wide, sitting on (x, y).
  function diya(ctx, x, y, s, k, seed = 0, lit = 1) {
    ctx.fillStyle = CLAY;
    ctx.beginPath(); ctx.moveTo(x - s / 2, y - s * 0.22);
    ctx.quadraticCurveTo(x - s * 0.45, y + s * 0.05, x, y + s * 0.06);
    ctx.quadraticCurveTo(x + s * 0.45, y + s * 0.05, x + s * 0.62, y - s * 0.3);
    ctx.lineTo(x + s * 0.3, y - s * 0.22); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e38b4f'; ctx.beginPath(); ctx.ellipse(x - s * 0.02, y - s * 0.22, s * 0.48, s * 0.08, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7a3a1c'; ctx.beginPath(); ctx.ellipse(x - s * 0.02, y - s * 0.22, s * 0.36, s * 0.05, 0, 0, TAU); ctx.fill();
    if (lit > 0) flame(ctx, x + s * 0.5, y - s * 0.3, s * 0.55, k, seed, lit, 0.38);
  }
  // A candle, h tall and w wide, standing on (x, y).
  function candle(ctx, x, y, h, w, body, k, seed = 0, lit = 1) {
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, tint(body, 0.75)); g.addColorStop(0.5, color(body)); g.addColorStop(1, tint(body, 0.6));
    ctx.fillStyle = g; ctx.fillRect(x - w / 2, y - h, w, h);
    line(ctx, x, y - h, x, y - h - 5, '#3a2a1a', 2);
    if (lit > 0) flame(ctx, x, y - h - 4, Math.max(15, w * 2), k, seed, lit, 0.4);
  }
  // An n-pointed star path.
  function starPath(ctx, x, y, n, r1, r2, rot = -Math.PI / 2) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1; const a = rot + (i / (n * 2)) * TAU; if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    ctx.closePath();
  }
  // A little open book, w wide, centred on (x, y).
  function openBook(ctx, x, y, w, c = CREAM, edge = GOLD) {
    const h = w * 0.36;
    ctx.fillStyle = tint(edge, 0.9);
    poly(ctx, [x - w / 2 - 4, y - h / 2 + 4, x, y + h / 2 + 6, x + w / 2 + 4, y - h / 2 + 4, x + w / 2 + 4, y + h / 2 + 2, x, y + h / 2 + 10, x - w / 2 - 4, y + h / 2 + 2], true); ctx.fill();
    for (const s of [-1, 1]) {
      ctx.fillStyle = color(c);
      ctx.beginPath(); ctx.moveTo(x, y - h / 2 + 6);
      ctx.quadraticCurveTo(x + s * w * 0.25, y - h / 2 - 6, x + s * w / 2, y - h / 2);
      ctx.lineTo(x + s * w / 2, y + h / 2); ctx.quadraticCurveTo(x + s * w * 0.25, y + h / 2 - 8, x, y + h / 2 + 4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(120,90,50,0.45)'; ctx.lineWidth = 1.5;
      for (let j = 1; j <= 3; j++) { const yy = y - h / 2 + j * h / 4.2; ctx.beginPath(); ctx.moveTo(x + s * w * 0.08, yy + 2); ctx.lineTo(x + s * w * 0.42, yy - 1); ctx.stroke(); }
    }
  }

  // ─── Symbols of the faiths (drawn, never pictures of God or prophets) ──
  function symOm(ctx, x, y, r, c) {
    ctx.fillStyle = color(c); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `500 ${Math.round(r * 1.6)}px ${DEVA}`;
    ctx.fillText('ॐ', x, y + r * 0.08);
  }
  function symCross(ctx, x, y, r, c) {
    ctx.fillStyle = color(c); const w = r * 0.26;
    rounded(ctx, x - w / 2, y - r, w, r * 2, 3); ctx.fill();
    rounded(ctx, x - r * 0.62, y - r * 0.48, r * 1.24, w, 3); ctx.fill();
  }
  function symDavid(ctx, x, y, r, c) {
    ctx.strokeStyle = color(c); ctx.lineWidth = Math.max(2, r * 0.13); ctx.lineJoin = 'miter';
    for (const s of [1, -1]) {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) { const a = -s * Math.PI / 2 + (i * TAU) / 3; const px = x + Math.cos(a) * r * 0.95; const py = y + Math.sin(a) * r * 0.95; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
      ctx.closePath(); ctx.stroke();
    }
  }
  function symCrescent(ctx, x, y, r, c) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.35); ctx.fillStyle = color(c);
    const R = r; const r2 = 0.8 * r; const d = 0.38 * r;
    const xi = (R * R - r2 * r2 + d * d) / (2 * d); const yi = Math.sqrt(R * R - xi * xi);
    const a1 = Math.atan2(yi, xi); const b1 = Math.atan2(yi, xi - d); const b2 = Math.atan2(-yi, xi - d);
    ctx.beginPath(); ctx.arc(0, 0, R, a1, TAU - a1, false); ctx.arc(d, 0, r2, b2, b1, true); ctx.closePath(); ctx.fill();
    starPath(ctx, r * 0.5, 0, 5, r * 0.3, r * 0.12, -Math.PI / 2 + 0.35); ctx.fill();
    ctx.restore();
  }
  function symWheel(ctx, x, y, r, c, rot = 0, n = 8) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.strokeStyle = color(c); ctx.fillStyle = color(c); ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(2, r * 0.11); ctx.beginPath(); ctx.arc(0, 0, r * 0.74, 0, TAU); ctx.stroke();
    ctx.lineWidth = Math.max(1.5, r * 0.07); ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, TAU); ctx.stroke();
    ctx.lineWidth = Math.max(1.5, r * 0.075); ctx.beginPath();
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU; ctx.moveTo(Math.cos(a) * r * 0.16, Math.sin(a) * r * 0.16); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.stroke();
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r, r * 0.085, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.arc(0, 0, r * 0.15, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function symKhanda(ctx, x, y, r, c) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = color(c); ctx.strokeStyle = color(c);
    // The chakkar: a circle without beginning or end.
    ctx.lineWidth = Math.max(2, r * 0.12); ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.45, 0, TAU); ctx.stroke();
    // The double-edged khanda in the middle.
    poly(ctx, [0, -r, r * 0.14, -r * 0.76, r * 0.1, r * 0.4, -r * 0.1, r * 0.4, -r * 0.14, -r * 0.76], true); ctx.fill();
    ctx.fillRect(-r * 0.2, r * 0.38, r * 0.4, r * 0.07); ctx.fillRect(-r * 0.045, r * 0.45, r * 0.09, r * 0.2);
    ctx.beginPath(); ctx.arc(0, r * 0.69, r * 0.06, 0, TAU); ctx.fill();
    // Two kirpans whose hilts cross below.
    for (const s of [1, -1]) {
      ctx.save(); ctx.scale(s, 1);
      ctx.beginPath(); ctx.moveTo(r * 0.1, r * 0.74);
      ctx.quadraticCurveTo(-r * 1.08, r * 0.86, -r * 0.8, -r * 0.42);
      ctx.quadraticCurveTo(-r * 0.8, r * 0.62, r * 0.08, r * 0.63); ctx.closePath(); ctx.fill();
      ctx.lineWidth = Math.max(1.5, r * 0.07); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(r * 0.06, r * 0.6); ctx.lineTo(r * 0.14, r * 0.8); ctx.stroke();
      ctx.lineWidth = Math.max(2, r * 0.09); ctx.beginPath(); ctx.moveTo(r * 0.12, r * 0.7); ctx.lineTo(r * 0.34, r * 0.92); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
  function symYinYang(ctx, x, y, r, c, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = NIGHT; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.fillStyle = CREAM;
    ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2); ctx.arc(0, r / 2, r / 2, Math.PI / 2, -Math.PI / 2, false); ctx.arc(0, -r / 2, r / 2, Math.PI / 2, -Math.PI / 2, true); ctx.closePath(); ctx.fill();
    ctx.fillStyle = NIGHT; ctx.beginPath(); ctx.arc(0, r / 2, r / 7, 0, TAU); ctx.fill();
    ctx.fillStyle = CREAM; ctx.beginPath(); ctx.arc(0, -r / 2, r / 7, 0, TAU); ctx.fill();
    ring(ctx, 0, 0, r, c, Math.max(1.5, r * 0.06));
    ctx.restore();
  }
  function symHand(ctx, x, y, r, c) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = color(c);
    rounded(ctx, -r * 0.44, -r * 0.18, r * 0.88, r * 1.0, r * 0.3); ctx.fill();
    [[-0.42, -0.78], [-0.2, -0.95], [0.02, -0.92], [0.24, -0.74]].forEach(([fx, top]) => { rounded(ctx, fx * r, top * r, r * 0.19, -top * r, r * 0.095); ctx.fill(); });
    ctx.save(); ctx.translate(-r * 0.42, r * 0.38); ctx.rotate(-0.75); rounded(ctx, -r * 0.1, -r * 0.5, r * 0.2, r * 0.52, r * 0.1); ctx.fill(); ctx.restore();
    // The wheel of 24 spokes in the palm.
    const wy = r * 0.36; const wr = r * 0.27;
    ctx.strokeStyle = '#3a2208'; ctx.lineWidth = Math.max(1.5, r * 0.05);
    ctx.beginPath(); ctx.arc(0, wy, wr, 0, TAU); ctx.stroke();
    ctx.lineWidth = Math.max(0.8, r * 0.018); ctx.beginPath();
    for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; ctx.moveTo(Math.cos(a) * wr * 0.2, wy + Math.sin(a) * wr * 0.2); ctx.lineTo(Math.cos(a) * wr, wy + Math.sin(a) * wr); }
    ctx.stroke();
    ctx.restore();
  }
  // The Zoroastrian sacred fire in its altar vase.
  function symFire(ctx, x, y, r, c, k = 0) {
    ctx.fillStyle = color(c);
    poly(ctx, [x - r * 0.55, y - r * 0.05, x + r * 0.55, y - r * 0.05, x + r * 0.35, y + r * 0.3, x + r * 0.15, y + r * 0.35, x + r * 0.15, y + r * 0.7, x + r * 0.45, y + r * 0.85, x - r * 0.45, y + r * 0.85, x - r * 0.15, y + r * 0.7, x - r * 0.15, y + r * 0.35, x - r * 0.35, y + r * 0.3], true); ctx.fill();
    flame(ctx, x, y - r * 0.08, r * 0.95, k, 3, 1, 0.25);
  }
  function symBahai(ctx, x, y, r, c) { ctx.fillStyle = color(c); starPath(ctx, x, y, 9, r, r * 0.62); ctx.fill(); }
  function symScroll(ctx, x, y, r, c) {
    ctx.fillStyle = tint(c, 0.85); ctx.fillRect(x - r * 0.55, y - r * 0.62, r * 1.1, r * 1.24);
    ctx.fillStyle = color(c);
    for (const s of [-1, 1]) { rounded(ctx, x - r * 0.72, y + s * r * 0.66 - r * 0.1, r * 1.44, r * 0.2, r * 0.1); ctx.fill(); }
    ctx.strokeStyle = 'rgba(60,40,20,0.7)'; ctx.lineWidth = Math.max(1, r * 0.06);
    for (let j = 0; j < 3; j++) { const xx = x - r * 0.28 + j * r * 0.28; ctx.beginPath(); ctx.moveTo(xx, y - r * 0.4); ctx.lineTo(xx, y + r * 0.4); ctx.stroke(); }
  }
  function symbol(ctx, kind, x, y, r, c, k = 0) {
    if (kind === 'om') symOm(ctx, x, y, r, c);
    else if (kind === 'cross') symCross(ctx, x, y, r, c);
    else if (kind === 'david') symDavid(ctx, x, y, r, c);
    else if (kind === 'crescent') symCrescent(ctx, x, y, r, c);
    else if (kind === 'wheel') symWheel(ctx, x, y, r, c, k * 0.15);
    else if (kind === 'khanda') symKhanda(ctx, x, y, r, c);
    else if (kind === 'yinyang') symYinYang(ctx, x, y, r, c, k * 0.2);
    else if (kind === 'hand') symHand(ctx, x, y, r, c);
    else if (kind === 'fire') symFire(ctx, x, y, r, c, k);
    else if (kind === 'bahai') symBahai(ctx, x, y, r, c);
    else if (kind === 'scroll') symScroll(ctx, x, y, r, c);
  }
  // A glowing medallion to hold a symbol.
  function medal(ctx, x, y, r, c, hi = 0.5) {
    halo(ctx, x, y, r * 1.9, c, 0.18 + 0.3 * hi);
    const g = ctx.createRadialGradient(x, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, tint(c, 0.32)); g.addColorStop(1, 'rgba(10,14,36,0.95)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ring(ctx, x, y, r, tint(c, 0.55 + 0.4 * hi), 2 + hi);
  }

  return {
    // ─── The faiths side by side ─────────────────────────────────────────

    // When the major religions began, on a timeline from 2000 BCE to 2000 CE.
    'religions-timeline'(b, ctx, it, t) {
      const k = b.clock;
      const AX = X0 + 128; const YA0 = Y0 + 76; const YA1 = Y0 + 556;
      const py = (yr) => YA0 + ((yr + 2000) / 4000) * (YA1 - YA0);
      const ROWS = [
        ['Judaism', 'david', SKY, -1800, -1000, 'about 1800–1000 BCE', 'Abraham, Moses'],
        ['Hinduism', 'om', SAFF, -1500, null, 'roots about 1500 BCE', 'the Vedas'],
        ['Zoroastrianism', 'fire', '#ff7b54', -1500, -500, 'about 1500–500 BCE', 'Zoroaster'],
        ['Buddhism', 'wheel', GOLD, -500, null, 'about 500 BCE', 'the Buddha'],
        ['Jainism', 'hand', '#ffb86b', -500, null, 'about 500 BCE', 'Mahavira'],
        ['Confucianism', 'scroll', ROSE, -500, null, 'about 500 BCE', 'Confucius'],
        ['Taoism', 'yinyang', LILAC, -500, null, 'about 500 BCE', 'Laozi'],
        ['Christianity', 'cross', '#9ec5ff', 30, null, 'about 30 CE', 'Jesus'],
        ['Islam', 'crescent', JADE, 610, null, '610 CE', 'the Prophet Muhammad'],
        ['Sikhism', 'khanda', '#ffb347', 1500, null, 'about 1500 CE', 'Guru Nanak'],
        ["Baha'i Faith", 'bahai', '#9fe3ff', 1863, null, '1863 CE', "Baha'u'llah"],
      ];
      const FACT = [
        'Jews trace their faith to God’s covenant with Abraham, and to Moses, who received the Torah.',
        'Hinduism has no single founder. Its roots reach back to the Vedas, hymns of ancient India.',
        'Taught by the prophet Zoroaster (Zarathustra) in ancient Iran; his dates are very uncertain.',
        'Siddhartha Gautama became the Buddha, “the awakened one”, in northern India.',
        'Mahavira was the 24th Tirthankara (great teacher); Jains believe the teaching is far older.',
        'Confucius taught kindness, respect for family and good government in ancient China.',
        'Laozi is traditionally said to have written the Tao Te Ching in ancient China.',
        'Christianity began with the life and teaching of Jesus in Judea, around 30 CE.',
        'Muslims believe the Prophet Muhammad received the first revelation of the Quran in 610 CE, near Mecca.',
        'Guru Nanak, born in 1469 in the Punjab, was the first of the ten Sikh Gurus.',
        'Baha’u’llah announced his mission in Baghdad in 1863; Baha’is believe in the unity of all faiths.',
      ];
      const n = ROWS.length; const RX = X0 + 212; const TX = X0 + 240;
      const ry = (i) => Y0 + 92 + i * 44;
      const hi = t < 5 ? -1 : Math.floor(cycle(t, n * 3.2, 5) / 3.2);
      ctx.save(); fade(ctx, t);
      backdrop(ctx, '#18204a', '#3b2616', 0.5);
      title(ctx, it.label || 'When the world religions began');
      // The axis of time with a light travelling down it.
      line(ctx, AX, YA0, AX, YA1, 'rgba(255,220,160,0.5)', 3);
      [[-2000, '2000 BCE'], [-1000, '1000 BCE'], [0, '1 CE'], [1000, '1000 CE'], [2000, '2000 CE']].forEach(([yr, s]) => {
        line(ctx, AX - 8, py(yr), AX + 8, py(yr), 'rgba(255,220,160,0.8)', 2);
        label(ctx, s, AX - 16, py(yr), { size: 18, weight: 600, fill: yr === 0 ? GOLD : 'muted', align: 'right' });
      });
      for (const yr of [-1500, -500, 500, 1500]) line(ctx, AX - 4, py(yr), AX + 4, py(yr), 'rgba(255,220,160,0.5)', 2);
      const ly = YA0 + mod(k * 0.1, 1) * (YA1 - YA0);
      halo(ctx, AX, ly, 26, GOLD, 0.6); dot(ctx, AX, ly, 4, FLAME);
      ROWS.forEach(([name, sym, c, y0, y1, date, who], i) => {
        const a = after(t, 0.4 + i * 0.32, 0.5); if (a <= 0) return;
        const on = hi === i; const y = ry(i);
        ctx.save(); ctx.globalAlpha *= a * (hi >= 0 && !on ? 0.72 : 1);
        const ya = y1 === null ? py(y0) : py((y0 + y1) / 2);
        if (y1 !== null) { line(ctx, AX + (i === 2 ? 7 : 0), py(y0), AX + (i === 2 ? 7 : 0), py(y1), c, 6, i === 2 ? [6, 5] : undefined); }
        ctx.strokeStyle = tint(c, on ? 0.95 : 0.5); ctx.lineWidth = on ? 3 : 2;
        poly(ctx, [AX + 6, ya, AX + 26, ya, RX - 24, y]); ctx.stroke();
        dot(ctx, AX, ya, on ? 7 : 5, c);
        if (on) { ctx.fillStyle = tint(c, 0.12); rounded(ctx, RX - 26, y - 20, X1 - 14 - (RX - 26), 40, 20); ctx.fill(); }
        medal(ctx, RX, y, 17, c, on ? 1 : 0.3);
        symbol(ctx, sym, RX, y, 11.5, c, k);
        rich(ctx, [[name, c, 800], [`  ${date}`, 'ink', 500], [`  · ${who}`, 'muted', 500]], TX, y, 19, 600, 'left');
        ctx.restore();
      });
      if (hi >= 0) { const s = mod(cycle(t, n * 3.2, 5), 3.2); caption(ctx, `${ROWS[hi][0]} · ${ROWS[hi][5]}`, FACT[hi], ROWS[hi][2], s); }
      else caption(ctx, 'Four thousand years of faith', 'BCE means “before the Common Era” and CE means “Common Era”. The years count the same way as BC and AD.', GOLD, t);
      footer(ctx, 'Dates are approximate; many traditions see their roots as older still');
      ctx.restore();
    },

    // Eight symbols, each with its faith and meaning; one lit at a time.
    'religion-symbols'(b, ctx, it, t) {
      const k = b.clock;
      const SY = [
        ['om', 'Om', 'Hinduism', 'the sacred sound', SAFF, 'Om (Aum) is chanted at the start and end of prayers. Many Hindus see it as the sound of Brahman, the ultimate reality.'],
        ['cross', 'Cross', 'Christianity', 'love and new life', '#9ec5ff', 'Christians believe Jesus died on a cross and rose again three days later. The cross stands for God’s love and new life.'],
        ['david', 'Star of David', 'Judaism', 'shield of David', SKY, 'Magen David, the “shield of David”: a six-pointed star named after King David, a widely used sign of Jewish faith and identity.'],
        ['crescent', 'Crescent and star', 'Islam', 'a widely used sign', JADE, 'Widely linked with Islam but not found in the Quran. The Islamic calendar follows the moon; some Muslims see it as cultural, not religious.'],
        ['wheel', 'Dharma wheel', 'Buddhism', 'the Eightfold Path', GOLD, 'The dharmachakra stands for the Buddha’s teaching, the Dharma. Its eight spokes stand for the Noble Eightfold Path.'],
        ['khanda', 'Khanda', 'Sikhism', 'one eternal God', '#ffb347', 'A double-edged sword at the centre, a circle (chakkar) for one God without end, and two kirpans for spiritual and worldly duty.'],
        ['yinyang', 'Yin-yang', 'Taoism', 'balance of opposites', LILAC, 'Yin (dark, soft, still) and yang (bright, firm, active) flow into each other. Taoists seek balance and harmony with the Tao.'],
        ['hand', 'Ahimsa hand', 'Jainism', 'non-violence', '#ffb86b', 'The raised hand means “stop and think”: ahimsa, harming no living being. The wheel stands for the cycle of rebirth it helps to end.'],
      ];
      const S = stages(t, SY.map(() => 3.8), 1.2);
      ctx.save(); fade(ctx, t);
      backdrop(ctx, '#1a2150', '#2f2140', 0.45);
      title(ctx, it.label || 'Symbols of the world religions');
      SY.forEach(([kind, name, faith, mean, c], i) => {
        const x = X0 + 100 + (i % 4) * 200; const y = i < 4 ? Y0 + 140 : Y0 + 372;
        const a = after(t, 0.2 + i * 0.12, 0.5); const on = S.i === i && t > 1.2;
        const sc = 1 + 0.07 * (on ? smooth(S.s / 0.5) : 0);
        ctx.save(); ctx.globalAlpha *= a * (t > 1.2 && !on ? 0.78 : 1);
        const bob = Math.sin(k * 1.4 + i) * 3;
        medal(ctx, x, y + bob, 54 * sc, c, on ? 1 : 0.25);
        symbol(ctx, kind, x, y + bob, (kind === 'om' ? 38 : 34) * sc, kind === 'yinyang' ? c : on ? FLAME : c, k);
        label(ctx, name, x, y + 82, { size: 19, weight: 800, fill: on ? 'ink' : c });
        label(ctx, faith, x, y + 108, { size: 19, weight: 700, fill: c });
        label(ctx, mean, x, y + 133, { size: 18, weight: 500, fill: 'muted' });
        ctx.restore();
      });
      if (t > 1.2) { const s = SY[S.i]; caption(ctx, `${s[1]} · ${s[2]}`, s[5], s[4], S.s); }
      footer(ctx, 'Each faith has other symbols too; these are among the best known');
      ctx.restore();
    },

    // The sacred books on a glowing shelf; each in turn steps forward.
    'sacred-books-shelf'(b, ctx, it, t) {
      const k = b.clock;
      const BK = [
        ['Vedas', 'Hinduism', '#c8742a', 70, 214, 'Sanskrit', 'four Vedas; the Rig Veda has 1,028 hymns', 'Among the oldest scriptures, passed down by memory', 'om', SAFF],
        ['Bhagavad Gita', 'Hinduism', '#d99a2b', 62, 186, 'Sanskrit', '18 chapters, about 700 verses', 'Part of the epic Mahabharata', 'om', SAFF],
        ['Torah / Tanakh', 'Judaism', '#2f66c4', 80, 230, 'Hebrew (some Aramaic)', 'Torah: 5 books · Tanakh: 24 books', 'The Torah is read from a hand-written scroll', 'david', SKY],
        ['Bible', 'Christianity', '#9a3434', 78, 222, 'Hebrew, Aramaic and Greek', '66 books (Protestant), 73 (Catholic)', 'Old Testament and New Testament', 'cross', '#9ec5ff'],
        ['Quran', 'Islam', '#1d7f55', 74, 218, 'Arabic', '114 surahs, about 6,200 verses', 'Muslims believe it was revealed over about 23 years', 'crescent', JADE],
        ['Guru Granth Sahib', 'Sikhism', '#d4952a', 92, 240, 'Gurmukhi script; Punjabi and more', '1,430 angs (pages)', 'Honoured by Sikhs as the living Guru', 'khanda', '#ffb347'],
        ['Tripitaka', 'Buddhism', '#b8902a', 76, 200, 'Pali (the Pali Canon)', '“Three baskets” of texts', 'Monastic rules, teachings (suttas), philosophy', 'wheel', GOLD],
        ['Tao Te Ching', 'Taoism', '#5d8a6a', 58, 176, 'Classical Chinese', '81 short chapters', 'Traditionally said to be by Laozi', 'yinyang', LILAC],
      ];
      const SH = Y0 + 330; const G = 14;
      const S = stages(t, BK.map(() => 3.6), 1.2);
      ctx.save(); fade(ctx, t);
      backdrop(ctx, '#1c1f45', '#3a2414', 0.55, Y0 + 52, SH + 40);
      title(ctx, it.label || 'Sacred books of the world');
      // Warm light pooling on the shelf.
      halo(ctx, cx, SH - 120, 420, GOLD, 0.16 + 0.03 * Math.sin(k * 1.3));
      let x = X0 + 56;
      BK.forEach(([name, , c, w, h], i) => {
        const on = S.i === i && t > 1.2; const lift = on ? 22 * smooth(S.s / 0.5) * (1 - smooth((S.s - 3.2) / 0.4)) : 0;
        const a = after(t, i * 0.1, 0.5);
        ctx.save(); ctx.globalAlpha *= a;
        const top = SH - h - lift;
        if (on) halo(ctx, x + w / 2, top + h / 2, h * 0.75, GOLD, 0.4);
        const g = ctx.createLinearGradient(x, 0, x + w, 0);
        g.addColorStop(0, tint(c, 0.7)); g.addColorStop(0.35, color(c)); g.addColorStop(1, tint(c, 0.55));
        ctx.fillStyle = g; rounded(ctx, x, top, w, h, 5); ctx.fill();
        ctx.fillStyle = tint(GOLD, 0.85);
        for (const yy of [top + 14, top + 22, top + h - 26, top + h - 18]) ctx.fillRect(x + 4, yy, w - 8, 3);
        if (i === 5) { // a cloth covering (rumala) drawn as a soft drape
          ctx.fillStyle = tint(SAFF, 0.5); poly(ctx, [x, top + 34, x + w, top + 34, x + w, top + 70, x + w / 2, top + 84, x, top + 70], true); ctx.fill();
        }
        ctx.save(); ctx.translate(x + w / 2, top + h / 2 + 6); ctx.rotate(-Math.PI / 2);
        label(ctx, name, 0, 0, { size: 18, weight: 800, fill: CREAM });
        ctx.restore();
        ctx.restore();
        x += w + G;
      });
      // The shelf.
      const wg = ctx.createLinearGradient(0, SH, 0, SH + 26);
      wg.addColorStop(0, '#b07a48'); wg.addColorStop(1, '#5a3418');
      ctx.fillStyle = wg; rounded(ctx, X0 + 30, SH, FIG.w - 60, 22, 4); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(X0 + 40, SH + 22, FIG.w - 80, 8);
      // The card for the book that has stepped forward.
      if (t > 1.2) {
        const [name, faith, , , , lang, size, note, sym, fc] = BK[S.i];
        ctx.save(); ctx.globalAlpha *= after(S.s, 0.1, 0.4) * S.lf;
        panel(ctx, X0 + 16, Y0 + 392, FIG.w - 32, 240, fc, 0.08, 18);
        medal(ctx, X0 + 104, Y0 + 512, 50, fc, 0.8);
        symbol(ctx, sym, X0 + 104, Y0 + 512, sym === 'om' ? 36 : 32, fc, k);
        label(ctx, name, X0 + 184, Y0 + 432, { size: 28, weight: 800, fill: fc, align: 'left' });
        [['Faith', faith], ['Language', lang], ['Size', size]].forEach(([kk, v], j) => {
          rich(ctx, [[`${kk}   `, 'muted', 600], [v, 'ink', 700]], X0 + 184, Y0 + 480 + j * 36, 20, 600, 'left');
        });
        label(ctx, note, X0 + 184, Y0 + 594, { size: 19, weight: 500, fill: GOLD, align: 'left' });
        ctx.restore();
      }
      footer(ctx, 'Each community treats its scripture with great care and respect');
      ctx.restore();
    },

    // ─── Hindu scriptures and epics ──────────────────────────────────────

    // Arjuna's chariot between two armies; his doubt, Krishna's teaching,
    // the 18 chapters and the three paths.
    'gita-chariot'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5, 5.5, 6, 6, 6.5]);
      const HZ = Y0 + 300; const GY = Y0 + 372; const SB = Y0 + 392;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The Bhagavad Gita');
      // Dawn over the field of Kurukshetra.
      ctx.save(); rounded(ctx, X0 + 8, Y0 + 52, FIG.w - 16, SB - Y0 - 52, 16); ctx.clip();
      const sky = ctx.createLinearGradient(0, Y0 + 52, 0, HZ);
      sky.addColorStop(0, '#1d2252'); sky.addColorStop(0.6, '#6a3f62'); sky.addColorStop(1, '#ff9a5a');
      ctx.fillStyle = sky; ctx.fillRect(X0 + 8, Y0 + 52, FIG.w - 16, HZ - Y0 - 52);
      halo(ctx, cx + 40, HZ, 300, GOLD, 0.5);
      ctx.fillStyle = tint(FLAME, 0.9); ctx.beginPath(); ctx.arc(cx + 40, HZ, 46, Math.PI, TAU); ctx.fill();
      const gr = ctx.createLinearGradient(0, HZ, 0, SB);
      gr.addColorStop(0, '#6b4a34'); gr.addColorStop(1, '#2a1c16');
      ctx.fillStyle = gr; ctx.fillRect(X0 + 8, HZ, FIG.w - 16, SB - HZ);
      // Two armies as rows of silhouettes with spears and pennants.
      const army = (x0, x1, side, fl) => {
        for (let row = 0; row < 2; row++) {
          const y = HZ + 6 + row * 20; const sc = row ? 1.15 : 0.8; const step = row ? 13 : 10;
          ctx.fillStyle = row ? '#1a1226' : '#2b1d33'; ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1.5;
          for (let x = x0; x < x1; x += step) {
            const j = Math.round(x * 7 + row * 13); const h = (16 + rnd(j) * 5) * sc;
            ctx.beginPath(); ctx.arc(x, y - h, 3.4 * sc, 0, TAU); ctx.fill();
            ctx.fillRect(x - 3 * sc, y - h + 3 * sc, 6 * sc, h - 3 * sc);
            if (rnd(j + 1) > 0.45) { ctx.beginPath(); ctx.moveTo(x + 4 * sc, y - 2); ctx.lineTo(x + 4 * sc + side * 2, y - h - 16 * sc); ctx.stroke(); }
          }
        }
        for (let j = 0; j < 4; j++) {
          const x = lerp(x0 + 14, x1 - 14, j / 3); const wv = Math.sin(k * 3 + j) * 3;
          line(ctx, x, HZ + 26, x, HZ - 40, '#2b1d33', 2.5);
          ctx.fillStyle = tint(fl, 0.85); poly(ctx, [x, HZ - 40, x + side * 22, HZ - 33 + wv, x, HZ - 26], true); ctx.fill();
        }
      };
      army(X0 + 22, X0 + 238, 1, GOLD);
      army(X1 - 238, X1 - 22, -1, ROSE);
      ctx.restore();
      label(ctx, 'Pandava army', X0 + 130, Y0 + 82, { size: 19, weight: 800, fill: GOLD });
      label(ctx, 'Kaurava army', X1 - 130, Y0 + 82, { size: 19, weight: 800, fill: ROSE });
      // Horses (four, side by side), reins, then the chariot.
      const horse = (x, y, s, c, ph) => {
        ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineCap = 'round';
        ctx.lineWidth = 4.5 * s;
        const lg = [[-24, 0.0], [-16, 1.6], [16, 0.8], [24, 2.4]];
        ctx.beginPath(); for (const [lx, p] of lg) { const sw = Math.sin(ph + p) * 1.5; ctx.moveTo(x + lx * s, y - 26 * s); ctx.lineTo(x + (lx + sw) * s, y); } ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x, y - 32 * s, 32 * s, 13 * s, 0, 0, TAU); ctx.fill();
        const nod = Math.sin(ph) * 2;
        poly(ctx, [x + 20 * s, y - 40 * s, x + 36 * s, y - (64 + nod) * s, x + 46 * s, y - (60 + nod) * s, x + 32 * s, y - 28 * s], true); ctx.fill();
        ctx.save(); ctx.translate(x + 47 * s, y - (58 + nod) * s); ctx.rotate(0.55); ctx.beginPath(); ctx.ellipse(0, 0, 12 * s, 6 * s, 0, 0, TAU); ctx.fill(); ctx.restore();
        poly(ctx, [x + 38 * s, y - (66 + nod) * s, x + 40 * s, y - (74 + nod) * s, x + 43 * s, y - (65 + nod) * s], true); ctx.fill();
        ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.moveTo(x - 30 * s, y - 36 * s); ctx.quadraticCurveTo(x - 44 * s, y - 30 * s, x - 40 * s, y - 12 * s); ctx.stroke();
      };
      const HX = cx + 70;
      ['#cfc4b2', '#e6dccb', '#d9cfbf', '#fbf5ea'].forEach((c, j) => horse(HX + j * 24, GY - 8 + j * 4, 1, c, k * 1.5 + j));
      // The figures (simple silhouettes) behind the chariot's front.
      const fig = (x, y, h, c, o = {}) => {
        ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineCap = 'round';
        const top = o.sit ? y - h * 0.62 : y - h;
        const hr = h * 0.085; const hy = top + hr;
        ctx.beginPath(); ctx.arc(x, hy, hr, 0, TAU); ctx.fill();
        poly(ctx, [x - hr * 0.9, hy - hr * 0.5, x - hr * 0.6, hy - hr * 1.6, x, hy - hr * 2.0, x + hr * 0.6, hy - hr * 1.6, x + hr * 0.9, hy - hr * 0.5], true); ctx.fill();
        if (o.feather) { ctx.save(); ctx.translate(x + hr * 0.5, hy - hr * 2.0); ctx.rotate(0.35); ctx.beginPath(); ctx.ellipse(0, -hr * 0.6, hr * 0.32, hr * 0.75, 0, 0, TAU); ctx.fill(); ctx.restore(); }
        const sh = hy + hr * 1.3; const waist = sh + h * 0.3;
        poly(ctx, [x - h * 0.13, sh, x + h * 0.13, sh, x + h * 0.09, waist, x - h * 0.09, waist], true); ctx.fill();
        poly(ctx, [x - h * 0.1, waist, x + h * 0.1, waist, x + h * 0.14, y, x - h * 0.14, y], true); ctx.fill();
        ctx.lineWidth = h * 0.06; ctx.beginPath();
        for (const [ex, ey, hx2, hy2] of o.arms || []) { ctx.moveTo(x + Math.sign(ex) * h * 0.1, sh + 3); ctx.lineTo(x + ex * h, sh + ey * h); ctx.lineTo(x + hx2 * h, sh + hy2 * h); }
        ctx.stroke();
      };
      const BX = cx - 70; const FL = GY - 46;
      const teach = S.i >= 2; const sit = S.i === 1;
      if (teach) halo(ctx, cx + 22, FL - 60, 120, GOLD, 0.35 + 0.08 * Math.sin(k * 2));
      // Krishna, the charioteer, holding the reins (or turned to teach).
      fig(cx + 22, FL, 92, '#1d2a6a', { feather: true, arms: teach ? [[-0.2, 0.12, -0.32, 0.02], [0.18, 0.16, 0.32, 0.22]] : [[0.18, 0.16, 0.34, 0.2], [0.16, 0.2, 0.34, 0.24]] });
      ctx.strokeStyle = 'rgba(40,30,20,0.85)'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let j = 0; j < 4; j++) { ctx.moveTo(cx + 52, FL - 50); ctx.quadraticCurveTo(HX + 10, FL - 30, HX + 44 + j * 24, GY - 64 + j * 4); }
      ctx.stroke();
      // Arjuna with his bow; sitting, bow set down, in his moment of doubt.
      const AXp = cx - 40;
      if (sit) {
        fig(AXp, FL, 88, '#2a1f45', { sit: true, arms: [[0.14, 0.18, 0.06, 0.26], [-0.14, 0.18, -0.06, 0.26]] });
      } else {
        fig(AXp, FL, 96, '#2a1f45', { arms: teach ? [[0.16, 0.14, 0.2, 0.3], [-0.16, 0.16, -0.26, 0.3]] : [[0.2, 0.06, 0.34, 0.02], [-0.14, 0.18, -0.2, 0.3]] });
        const bx = AXp + (teach ? -34 : 34);
        ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(bx, FL - 104); ctx.quadraticCurveTo(bx + (teach ? -18 : 22), FL - 60, bx, FL - 14); ctx.stroke();
        line(ctx, bx, FL - 104, bx, FL - 14, 'rgba(255,240,210,0.6)', 1);
      }
      // The chariot: body, wheel, flagpole with a pennant.
      const cg = ctx.createLinearGradient(0, FL - 38, 0, FL + 10);
      cg.addColorStop(0, '#d9a441'); cg.addColorStop(1, '#7a4a1c');
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.moveTo(BX - 30, FL - 34); ctx.lineTo(cx + 40, FL - 34); ctx.quadraticCurveTo(cx + 70, FL - 30, cx + 64, FL + 4); ctx.lineTo(BX - 30, FL + 4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = tint(FLAME, 0.7); ctx.lineWidth = 2; ctx.stroke();
      line(ctx, cx + 60, FL - 4, HX + 20, GY - 30, '#5a3418', 4);
      if (sit) { ctx.strokeStyle = '#4a3420'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(BX - 26, FL - 40); ctx.quadraticCurveTo(BX + 34, FL - 58, BX + 92, FL - 38); ctx.stroke(); line(ctx, BX - 26, FL - 40, BX + 92, FL - 38, 'rgba(255,240,210,0.6)', 1); }
      line(ctx, BX - 20, FL - 34, BX - 20, Y0 + 120, '#5a3418', 4);
      const wv = Math.sin(k * 3) * 4;
      ctx.fillStyle = tint(SAFF, 0.95); poly(ctx, [BX - 20, Y0 + 120, BX + 30, Y0 + 132 + wv, BX - 20, Y0 + 146], true); ctx.fill();
      const WX = BX + 10; const WY = GY - 30;
      ctx.strokeStyle = '#4a2c14'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(WX, WY, 30, 0, TAU); ctx.stroke();
      ctx.strokeStyle = GOLD; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(WX, WY, 30, 0, TAU); ctx.stroke();
      ctx.beginPath(); for (let j = 0; j < 8; j++) { const a = (j / 8) * TAU + 0.2; ctx.moveTo(WX, WY); ctx.lineTo(WX + Math.cos(a) * 29, WY + Math.sin(a) * 29); } ctx.stroke();
      dot(ctx, WX, WY, 5, GOLD);
      // Names, only once the stage introduces them.
      ctx.save(); ctx.globalAlpha *= S.i >= 1 ? after(S.i === 1 ? S.s : 9, 0.3) : 0;
      label(ctx, 'Arjuna', cx - 50, Y0 + 196, { size: 19, weight: 800, fill: LILAC, align: 'right' });
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= S.i >= 2 ? after(S.i === 2 ? S.s : 9, 0.3) : 0;
      label(ctx, 'Krishna', cx + 46, Y0 + 196, { size: 19, weight: 800, fill: SKY, align: 'left' });
      ctx.restore();
      // The dial of 18 chapters.
      const DX = X0 + 104; const DY = Y0 + 484; const DR = 64;
      const lit = S.i < 3 ? (S.i === 2 ? 0 : 0) : S.i === 3 ? Math.floor(clamp(S.s / 4) * 18) : 18;
      for (let j = 0; j < 18; j++) {
        const a0 = -Math.PI / 2 + (j / 18) * TAU + 0.03; const a1 = a0 + TAU / 18 - 0.06;
        ctx.strokeStyle = j < lit ? GOLD : 'rgba(255,210,122,0.18)'; ctx.lineWidth = 14;
        ctx.beginPath(); ctx.arc(DX, DY, DR, a0, a1); ctx.stroke();
      }
      if (lit) halo(ctx, DX, DY, 60, GOLD, 0.18);
      label(ctx, String(S.i >= 3 ? Math.max(1, lit) : 18), DX, DY - 8, { size: 30, weight: 800, fill: GOLD });
      label(ctx, 'chapters', DX, DY + 20, { size: 18, weight: 600, fill: 'muted' });
      // What the stage is about, to the right of the dial.
      const RX = X0 + 200; const RW = X1 - 16 - RX;
      ctx.save(); ctx.globalAlpha *= after(S.s, 0.2, 0.4) * S.lf;
      if (S.i === 0) {
        chip(ctx, 'Pandavas: 5 brothers', RX + RW * 0.25, Y0 + 450, GOLD, 20);
        chip(ctx, 'Kauravas: 100 brothers', RX + RW * 0.75, Y0 + 450, ROSE, 20);
        label(ctx, 'cousins from one royal family', RX + RW / 2, Y0 + 512, { size: 20, weight: 600, fill: 'ink' });
      } else if (S.i === 1) {
        label(ctx, '“I will not fight.”', RX + RW / 2, Y0 + 446, { size: 26, weight: 800, fill: LILAC });
        para(ctx, 'He sees teachers, cousins and friends on both sides, and his heart fails him.', RX + 10, Y0 + 508, RW - 20, 19, 'ink', 500, 2);
      } else if (S.i === 2) {
        para(ctx, '“Do your duty, but let go of the fruits of your actions.”', RX + 10, Y0 + 440, RW - 20, 22, SKY, 700, 2);
        label(ctx, 'Gita 2.47 (paraphrased)', RX + RW / 2, Y0 + 488, { size: 18, weight: 500, fill: 'muted' });
        label(ctx, 'The true self (atman) is never born and never dies.', RX + RW / 2, Y0 + 526, { size: 19, weight: 600, fill: 'ink' });
      } else if (S.i === 3) {
        label(ctx, '18 chapters · about 700 verses', RX + RW / 2, Y0 + 446, { size: 24, weight: 800, fill: GOLD });
        label(ctx, 'part of the Mahabharata', RX + RW / 2, Y0 + 494, { size: 20, weight: 600, fill: 'ink' });
        label(ctx, '(in its sixth book, the Bhishma Parva)', RX + RW / 2, Y0 + 526, { size: 19, weight: 500, fill: 'muted' });
      } else {
        const Y = [['Karma yoga', 'selfless action', SAFF], ['Bhakti yoga', 'loving devotion', ROSE], ['Jnana yoga', 'knowledge', SKY]];
        const cw = (RW - 24) / 3;
        Y.forEach(([nm, mean, c], j) => {
          const x = RX + j * (cw + 12); const a = after(S.s, 0.3 + j * 0.5);
          ctx.save(); ctx.globalAlpha *= a;
          panel(ctx, x, Y0 + 404, cw, 152, c, 0.1, 14);
          const ix = x + cw / 2; const iy = Y0 + 446;
          if (j === 0) {
            ctx.strokeStyle = color(c); ctx.fillStyle = color(c); ctx.lineWidth = 4; ctx.lineCap = 'round';
            const a1 = 1.9 + k * 1.2; ctx.beginPath(); ctx.arc(ix, iy, 17, a1 - 4.6, a1); ctx.stroke();
            const hx = ix + Math.cos(a1) * 17; const hy = iy + Math.sin(a1) * 17; const ta = a1 + Math.PI / 2;
            poly(ctx, [hx + Math.cos(ta) * 9, hy + Math.sin(ta) * 9, hx + Math.cos(a1) * 7, hy + Math.sin(a1) * 7, hx - Math.cos(a1) * 7, hy - Math.sin(a1) * 7], true); ctx.fill();
          }
          else if (j === 1) { diya(ctx, ix - 4, iy + 14, 40, k, 7); }
          else openBook(ctx, ix, iy + 2, 50, CREAM, c);
          label(ctx, nm, ix, Y0 + 500, { size: 20, weight: 800, fill: c });
          label(ctx, mean, ix, Y0 + 530, { size: 18, weight: 500, fill: 'ink' });
          ctx.restore();
        });
      }
      ctx.restore();
      const CAP = [
        ['Two armies at Kurukshetra', 'In the Mahabharata, two sides of one royal family, the Pandavas and the Kauravas, face each other for war.', GOLD],
        ['Arjuna’s doubt', 'The great archer Arjuna sees people he loves in both armies. He puts down his bow and says he will not fight.', LILAC],
        ['Krishna’s teaching', 'Krishna, his charioteer, teaches him to do his duty (dharma) without clinging to results. Hindus see Krishna as an avatar of Vishnu.', SKY],
        ['The “Song of God”', 'Their conversation is the Bhagavad Gita: 18 chapters and about 700 verses, set inside the Mahabharata.', GOLD],
        ['Three paths (yogas)', 'Hindus find three paths in the Gita: karma yoga (selfless action), bhakti yoga (loving devotion) and jnana yoga (knowledge).', ROSE],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      footer(ctx, 'The Bhagavad Gita, from the Mahabharata (traditionally by Vyasa)');
      ctx.restore();
    },

    // Rama's journey: Ayodhya, the forest, Lanka, the bridge, and home to lamps.
    'ramayana-journey'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5, 5.5, 5.5, 6.5, 6.5]);
      const C = it._c || (it._c = {
        p1: mkPath(qpts(X0 + 150, Y0 + 234, X0 + 175, Y0 + 300, X0 + 268, Y0 + 312)),
        sita: mkPath(qpts(X0 + 318, Y0 + 300, X0 + 520, Y0 + 150, X0 + 650, Y0 + 470)),
        south: mkPath(qpts(X0 + 300, Y0 + 330, X0 + 360, Y0 + 440, X0 + 520, Y0 + 445)),
        leap: mkPath(qpts(X0 + 528, Y0 + 440, X0 + 600, Y0 + 300, X0 + 665, Y0 + 478)),
        home: mkPath(qpts(X0 + 680, Y0 + 476, X0 + 540, Y0 + 70, X0 + 176, Y0 + 168)),
      });
      const COAST = [X1 - 8, Y0 + 210, X0 + 700, Y0 + 300, X0 + 600, Y0 + 370, X0 + 548, Y0 + 432, X0 + 512, Y0 + 500, X0 + 500, Y0 + 566];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The Ramayana: Rama’s journey');
      ctx.save(); rounded(ctx, X0 + 8, Y0 + 52, FIG.w - 16, 514, 16); ctx.clip();
      // Land, sea and the island of Lanka.
      const land = ctx.createLinearGradient(0, Y0 + 52, 0, Y0 + 566);
      land.addColorStop(0, '#34482f'); land.addColorStop(1, '#4a3a22');
      ctx.fillStyle = land; ctx.fillRect(X0 + 8, Y0 + 52, FIG.w - 16, 514);
      for (const [mx, my, mw, mh] of [[X0 + 470, Y0 + 170, 70, 60], [X0 + 530, Y0 + 176, 90, 84], [X0 + 610, Y0 + 168, 64, 52]]) {
        ctx.fillStyle = 'rgba(30,40,30,0.55)'; poly(ctx, [mx - mw / 2, my, mx, my - mh, mx + mw / 2, my], true); ctx.fill();
        ctx.fillStyle = 'rgba(240,240,255,0.35)'; poly(ctx, [mx - mw * 0.12, my - mh * 0.76, mx, my - mh, mx + mw * 0.12, my - mh * 0.76], true); ctx.fill();
      }
      ctx.fillStyle = 'rgba(160,200,120,0.12)';
      for (let j = 0; j < 60; j++) { const gx = X0 + 20 + rnd(j + 300) * 520; const gy = Y0 + 70 + rnd(j + 400) * 480; ctx.fillRect(gx, gy, 3, 3); }
      poly(ctx, [...COAST, X1 - 8, Y0 + 566], true);
      const sea = ctx.createLinearGradient(0, Y0 + 210, 0, Y0 + 566);
      sea.addColorStop(0, '#16426a'); sea.addColorStop(1, '#0e2a4a');
      ctx.fillStyle = sea; ctx.fill();
      ctx.strokeStyle = 'rgba(160,210,255,0.35)'; ctx.lineWidth = 2;
      for (let j = 0; j < 7; j++) {
        const wx = X0 + 620 + (j % 3) * 60 + Math.sin(k * 0.8 + j) * 8; const wy = Y0 + 300 + j * 34;
        ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 10, wy - 6, wx + 20, wy); ctx.quadraticCurveTo(wx + 30, wy + 6, wx + 40, wy); ctx.stroke();
      }
      ctx.fillStyle = '#3d4a2a'; ctx.beginPath(); ctx.ellipse(X0 + 690, Y0 + 500, 64, 38, -0.3, 0, TAU); ctx.fill();
      ctx.strokeStyle = tint(SAND, 0.7); ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#5a3a3a'; // Lanka's towers
      for (let j = 0; j < 4; j++) { const x = X0 + 668 + j * 14; const h = 22 + (j % 2) * 12; ctx.fillRect(x, Y0 + 494 - h, 9, h); ctx.beginPath(); ctx.arc(x + 4.5, Y0 + 494 - h, 5, Math.PI, TAU); ctx.fill(); }
      ctx.restore();
      // Ayodhya: a palace that lights up with lamps at the end.
      const AYX = X0 + 150; const AYY = Y0 + 178;
      const homeLit = S.i === 4 ? after(S.s, 2.6, 1.2) : 0;
      halo(ctx, AYX, AYY - 30, 130, GOLD, 0.1 + 0.4 * homeLit);
      ctx.fillStyle = '#e8d2a8';
      ctx.fillRect(AYX - 60, AYY - 40, 120, 40);
      for (const [dx, h, r] of [[-48, 62, 12], [0, 84, 20], [48, 62, 12]]) { ctx.fillRect(AYX + dx - r * 0.8, AYY - h, r * 1.6, h); ctx.beginPath(); ctx.arc(AYX + dx, AYY - h, r, Math.PI, TAU); ctx.fill(); line(ctx, AYX + dx, AYY - h - r, AYX + dx, AYY - h - r - 10, '#e8d2a8', 2); }
      ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.arc(AYX, AYY, 12, Math.PI, TAU); ctx.fill();
      for (let j = 0; j < 8; j++) diya(ctx, AYX - 70 + j * 20, AYY + 16, 16, k, j, homeLit);
      label(ctx, 'Ayodhya', AYX, AYY + 40, { size: 20, weight: 800, fill: GOLD });
      // The forest.
      for (let j = 0; j < 14; j++) {
        const x = X0 + 214 + (j % 5) * 40 + (Math.floor(j / 5) % 2) * 20 + (rnd(j) - 0.5) * 14; const y = Y0 + 296 + Math.floor(j / 5) * 30 + (rnd(j + 20) - 0.5) * 10; const h = 30 + rnd(j + 40) * 16; const sw = Math.sin(k * 1.2 + j) * 2;
        line(ctx, x, y, x, y - h * 0.4, '#5a3a20', 3);
        ctx.fillStyle = j % 3 ? '#2f7a4a' : '#3f9a5a'; poly(ctx, [x - h * 0.4, y - h * 0.3, x + sw, y - h * 1.1, x + h * 0.4, y - h * 0.3], true); ctx.fill();
      }
      label(ctx, 'the forest', X0 + 236, Y0 + 384, { size: 19, weight: 800, fill: JADE });
      label(ctx, 'Lanka', X0 + 700, Y0 + 552, { size: 20, weight: 800, fill: ROSE });
      label(ctx, 'the sea', X0 + 730, Y0 + 372, { size: 18, weight: 600, fill: SKY });
      // The travellers: three small lights (Rama, Sita and Lakshmana).
      const group = (x, y, n = 3, c = GOLD) => { for (let j = 0; j < n; j++) { const gx = x + (j - (n - 1) / 2) * 11; halo(ctx, gx, y, 16, c, 0.5); dot(ctx, gx, y, 4.5, FLAME); } };
      const trail = (P, d, c, w = 4, dash) => { ctx.strokeStyle = color(c); ctx.lineWidth = w; if (dash) ctx.setLineDash(dash); strokeSpan(ctx, P, 0, d); ctx.setLineDash([]); };
      const d1 = S.i === 0 ? smooth((S.s - 0.8) / 3.4) * C.p1.total : C.p1.total;
      trail(C.p1, d1, tint(GOLD, 0.75), 4, [8, 7]);
      let gp = at(C.p1, d1); let gn = 3;
      if (S.i === 1) {
        const yr = 1 + Math.floor(clamp((S.s - 0.4) / 4.2) * 13.99);
        chip(ctx, `Year ${yr} of 14`, X0 + 486, Y0 + 300, JADE, 19);
      }
      if (S.i >= 2) {
        const ds = S.i === 2 ? smooth((S.s - 0.8) / 3.2) * C.sita.total : C.sita.total;
        ctx.save(); ctx.globalAlpha *= S.i === 2 ? 1 : 0.3;
        trail(C.sita, ds, ROSE, 3, [5, 7]);
        if (S.i === 2) { const q = at(C.sita, ds); halo(ctx, q.x, q.y, 18, ROSE, 0.55); dot(ctx, q.x, q.y, 5, CREAM); }
        ctx.restore();
        if (S.i === 2) { gn = 2; ctx.save(); ctx.globalAlpha *= after(S.s, 1.2); label(ctx, 'Sita carried away', X0 + 470, Y0 + 168, { size: 19, weight: 700, fill: ROSE }); ctx.restore(); }
        else if (S.i === 3) { const q = at(C.sita, C.sita.total); halo(ctx, q.x, q.y, 16, ROSE, 0.5); dot(ctx, q.x, q.y, 4.5, CREAM); }
      }
      if (S.i >= 3) {
        const dd = S.i === 3 ? smooth(S.s / 1.6) * C.south.total : C.south.total;
        trail(C.south, dd, tint(GOLD, 0.75), 4, [8, 7]);
        gp = at(C.south, dd); gn = 2;
        if (S.i === 3) {
          const dl = smooth((S.s - 1.4) / 1.6) * C.leap.total;
          ctx.save(); ctx.globalAlpha *= 1 - after(S.s, 5.6, 0.6);
          trail(C.leap, dl, SAFF, 3);
          if (dl > 0 && S.s < 3.4) { const q = at(C.leap, dl); halo(ctx, q.x, q.y, 22, SAFF, 0.7); dot(ctx, q.x, q.y, 5, FLAME); }
          ctx.globalAlpha *= after(S.s, 1.6);
          label(ctx, 'Hanuman’s leap', X0 + 618, Y0 + 336, { size: 19, weight: 800, fill: SAFF, align: 'left' });
          ctx.restore();
        }
        // The bridge of stones, laid one by one.
        const nb = S.i === 3 ? Math.floor(clamp((S.s - 3.2) / 2.4) * 10) : 10;
        for (let j = 0; j < nb; j++) {
          const q = j / 9; const x = lerp(X0 + 544, X0 + 632, q); const y = lerp(Y0 + 452, Y0 + 494, q);
          ctx.fillStyle = j % 2 ? '#b9ad94' : '#d8ccb0'; ctx.beginPath(); ctx.ellipse(x, y, 7, 5, 0.4, 0, TAU); ctx.fill();
        }
        if (nb > 3) label(ctx, 'stone bridge', X0 + 578, Y0 + 534, { size: 18, weight: 700, fill: SAND });
      }
      if (S.i === 4) {
        const dh = smooth((S.s - 0.6) / 2.4) * C.home.total;
        trail(C.home, dh, GOLD, 3, [6, 6]);
        gp = at(C.home, dh); gn = 3;
      }
      if (!(S.i === 2 && S.s > 3.8 && false)) group(gp.x, gp.y - 2, gn);
      const CAP = [
        ['Leaving Ayodhya', 'Prince Rama, his wife Sita and his brother Lakshmana leave the city of Ayodhya to keep a promise made by Rama’s father.', GOLD],
        ['14 years in the forest', 'They live simply in the forest for fourteen years, meeting wise sages along the way.', JADE],
        ['Sita is taken to Lanka', 'The story tells that Ravana, king of Lanka, carries Sita away across the sea to his island.', ROSE],
        ['Hanuman’s search and the bridge', 'Hanuman leaps across the sea and finds Sita. Then Rama’s army of vanaras builds a bridge of stones to Lanka.', SAFF],
        ['Return to Ayodhya', 'Rama defeats Ravana, and Rama and Sita return home. People light rows of lamps to welcome them: remembered at Diwali.', GOLD],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      footer(ctx, 'The Ramayana, traditionally composed by the sage Valmiki');
      ctx.restore();
    },

    // The Kuru family tree: Vyasa, two brothers, five Pandavas and a hundred
    // Kauravas; the 18-day war at Kurukshetra.
    'mahabharata-family'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5, 5.5, 5.5, 6.5, 6]);
      const VY = Y0 + 88; const NY = Y0 + 168; const DXn = X0 + 210; const PXn = X0 + 610;
      ctx.save(); fade(ctx, t);
      backdrop(ctx, '#1b2050', '#3a2418', 0.5);
      title(ctx, it.label || 'The Mahabharata: one family, two sides');
      const node = (x, y, w, head, sub, c, on) => {
        if (on) halo(ctx, x, y, w * 0.7, c, 0.25);
        ctx.fillStyle = 'rgba(10,12,30,0.9)'; ctx.strokeStyle = tint(c, on ? 0.95 : 0.55); ctx.lineWidth = on ? 3 : 2;
        rounded(ctx, x - w / 2, y - 30, w, 60, 14); ctx.fill(); ctx.stroke();
        label(ctx, head, x, y - 9, { size: 20, weight: 800, fill: c });
        label(ctx, sub, x, y + 15, { size: 18, weight: 500, fill: 'muted' });
      };
      // Branches.
      ctx.strokeStyle = 'rgba(255,220,160,0.55)'; ctx.lineWidth = 3;
      poly(ctx, [cx, VY + 30, cx, VY + 48, DXn, VY + 48, DXn, NY - 30]); ctx.stroke();
      poly(ctx, [cx, VY + 48, PXn, VY + 48, PXn, NY - 30]); ctx.stroke();
      node(cx, VY, 330, 'Vyasa', 'sage, storyteller and grandfather', GOLD, S.i === 0 || S.i === 4);
      node(DXn, NY, 300, 'Dhritarashtra', 'the blind king, and Queen Gandhari', ROSE, S.i === 2);
      node(PXn, NY, 280, 'Pandu', 'and Queens Kunti and Madri', SKY, S.i === 1);
      // A hundred Kauravas.
      const ka = S.i >= 2 ? (S.i === 2 ? S.s : 9) : 0;
      ctx.strokeStyle = tint(ROSE, 0.5); ctx.lineWidth = 2; poly(ctx, [DXn, NY + 30, DXn, Y0 + 228]); ctx.stroke();
      for (let j = 0; j < 100; j++) {
        const x = DXn - 90 + (j % 10) * 20; const y = Y0 + 244 + Math.floor(j / 10) * 18;
        const on = ka > 0.3 + j * 0.022;
        const fl = 0.75 + 0.25 * Math.sin(k * 4 + j * 1.7);
        dot(ctx, x, y, j === 0 ? 7 : 5, on ? tint(ROSE, j === 0 ? 1 : 0.55 + 0.35 * fl) : 'rgba(255,143,163,0.14)');
      }
      label(ctx, '100 Kauravas', DXn, Y0 + 436, { size: 20, weight: 800, fill: ROSE });
      ctx.save(); ctx.globalAlpha *= ka > 0 ? after(ka, 1.5) : 0;
      label(ctx, 'eldest: Duryodhana', DXn, Y0 + 462, { size: 18, weight: 600, fill: 'ink' });
      ctx.restore();
      // Five Pandavas.
      const PAN = [['Yudhishthira', 'eldest, truthful'], ['Bhima', 'the strong'], ['Arjuna', 'the archer'], ['Nakula', 'twin'], ['Sahadeva', 'twin']];
      const pa = S.i >= 1 ? (S.i === 1 ? S.s : 9) : 0;
      const LX = PXn - 162;
      ctx.strokeStyle = tint(SKY, 0.5); ctx.lineWidth = 2;
      poly(ctx, [PXn, NY + 30, PXn, NY + 44, LX, NY + 44, LX, Y0 + 404]); ctx.stroke();
      PAN.forEach(([nm, note], j) => {
        const y = Y0 + 244 + j * 40; const a = pa > 0 ? after(pa, 0.4 + j * 0.45) : 0;
        line(ctx, LX, y, LX + 14, y, tint(SKY, 0.5), 2);
        ctx.save(); ctx.globalAlpha *= 0.25 + 0.75 * a;
        medal(ctx, LX + 30, y, 13, SKY, a);
        flame(ctx, LX + 30, y + 6, 13, k, j, a, 0.2);
        rich(ctx, [[nm, SKY, 800], [`  ${note}`, 'muted', 500]], LX + 52, y, 19, 600, 'left');
        ctx.restore();
      });
      label(ctx, '5 Pandavas', PXn, Y0 + 436, { size: 20, weight: 800, fill: SKY });
      // Cousins.
      ctx.save(); ctx.globalAlpha *= S.i >= 2 ? 1 : 0.3;
      arrow(ctx, X0 + 340, Y0 + 330, X0 + 444, Y0 + 330, tint(GOLD, 0.7), 3); arrow(ctx, X0 + 444, Y0 + 330, X0 + 340, Y0 + 330, tint(GOLD, 0.7), 3);
      label(ctx, 'cousins', X0 + 392, Y0 + 308, { size: 18, weight: 700, fill: GOLD });
      ctx.restore();
      // The 18 days of the war.
      const days = S.i < 3 ? 0 : S.i === 3 ? Math.floor(clamp((S.s - 0.5) / 4.5) * 18) : 18;
      const bw = 32; const gx0 = cx - (18 * (bw + 4) - 4) / 2;
      ctx.save(); ctx.globalAlpha *= S.i >= 3 ? 1 : 0.4;
      label(ctx, days ? `The war at Kurukshetra: day ${days} of 18` : 'The war at Kurukshetra lasts 18 days', cx, Y0 + 498, { size: 19, weight: 700, fill: days ? SAFF : 'muted' });
      for (let j = 0; j < 18; j++) {
        const x = gx0 + j * (bw + 4); const on = j < days;
        ctx.fillStyle = on ? tint(SAFF, 0.75) : 'rgba(255,154,60,0.1)'; ctx.strokeStyle = tint(SAFF, on ? 0.95 : 0.35); ctx.lineWidth = 1.5;
        rounded(ctx, x, Y0 + 516, bw, 34, 6); ctx.fill(); ctx.stroke();
        label(ctx, String(j + 1), x + bw / 2, Y0 + 534, { size: 18, weight: 700, fill: on ? DARK : 'muted' });
      }
      ctx.restore();
      const CAP = [
        ['The Kuru family', 'The Mahabharata tells of one royal family. The sage Vyasa, said to have composed it, is also the grandfather of its heroes.', GOLD],
        ['The five Pandavas', 'Sons of King Pandu: Yudhishthira the truthful, Bhima the strong, Arjuna the archer, and the twins Nakula and Sahadeva.', SKY],
        ['The hundred Kauravas', 'Sons of King Dhritarashtra and Queen Gandhari. The eldest, Duryodhana, will not share the kingdom with his cousins.', ROSE],
        ['The war at Kurukshetra', 'After a game of dice and years of exile, the cousins fight an 18-day war. Before it begins, Krishna teaches Arjuna the Gita.', SAFF],
        ['One of the longest poems', 'About 100,000 verses in 18 books (parvas). The story tells that Vyasa spoke it aloud and Ganesha wrote it down.', GOLD],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      footer(ctx, 'The Mahabharata, traditionally composed by the sage Vyasa');
      ctx.restore();
    },

    // ─── Teachings and practices ─────────────────────────────────────────

    // A dharma wheel turning a spoke at a time, the Four Noble Truths below.
    'eightfold-path'(b, ctx, it, t) {
      const k = b.clock;
      const WX = cx; const WY = Y0 + 262; const R = 108; const LR = 146;
      const GRP = [['Wisdom', GOLD], ['Ethical conduct', JADE], ['Meditation', SKY]];
      const PATH = [
        ['Right view', 0, 'Seeing the world as it really is, and understanding the Four Noble Truths.'],
        ['Right intention', 0, 'Choosing kindness and goodwill; letting go of greed and the wish to harm.'],
        ['Right speech', 1, 'Speaking truthfully and kindly: no lies, gossip or harsh words.'],
        ['Right action', 1, 'Acting well: not harming living beings, not stealing, behaving responsibly.'],
        ['Right livelihood', 1, 'Earning a living in a way that does not harm others.'],
        ['Right effort', 2, 'Working to grow good states of mind and to let go of unhelpful ones.'],
        ['Right mindfulness', 2, 'Being fully aware of the body, feelings and thoughts, here and now.'],
        ['Right concentration', 2, 'Training the mind in calm, focused meditation.'],
      ];
      const TR = [
        ['Suffering', 'Life involves dukkha', 'Truth 1: dukkha', 'The Buddha taught that life involves suffering and dissatisfaction (dukkha), because nothing lasts for ever.'],
        ['Its cause', 'craving and clinging', 'Truth 2: its cause', 'Suffering comes from craving (tanha): wanting things to be different, and clinging to what changes.'],
        ['Its end', 'nirvana is possible', 'Truth 3: it can end', 'When craving stops, suffering ends. Buddhists call this perfect peace nirvana.'],
        ['The way', 'the Eightfold Path', 'Truth 4: the way', 'The way to end suffering is the Noble Eightfold Path: a Middle Way between too much pleasure and too much hardship.'],
      ];
      const S = stages(t, [...TR.map(() => 4), ...PATH.map(() => 3.2)]);
      const pi = S.i - 4; // which spoke is lit (-ve during the truths)
      ctx.save(); fade(ctx, t);
      backdrop(ctx, '#1d1f4d', '#3b2a17', 0.5);
      title(ctx, it.label || 'The Four Noble Truths and the Eightfold Path');
      GRP.forEach(([g, c], j) => chip(ctx, g, cx + (j - 1) * 250, Y0 + 74, c, 18));
      // Light behind the wheel.
      halo(ctx, WX, WY, 220, GOLD, 0.28 + 0.06 * Math.sin(k * 1.5));
      // The wheel turns one spoke (45°) at the start of each path stage.
      const steps = Math.max(0, pi) + (pi >= 0 ? smooth(S.s / 0.8) - 1 : 0) + S.n * 8;
      const rot = steps * (TAU / 8);
      ctx.save(); ctx.translate(WX, WY); ctx.rotate(rot);
      const rg = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R);
      rg.addColorStop(0, 'rgba(255,210,122,0.18)'); rg.addColorStop(1, 'rgba(255,210,122,0.04)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
      ctx.strokeStyle = GOLD; ctx.fillStyle = GOLD; ctx.lineCap = 'round';
      ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
      ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R - 12, 0, TAU); ctx.stroke();
      for (let j = 0; j < 8; j++) {
        const a = (j / 8) * TAU - Math.PI / 2;
        ctx.save(); ctx.rotate(a);
        poly(ctx, [24, -5, R - 8, -2.5, R - 8, 2.5, 24, 5], true); ctx.fill();
        ctx.beginPath(); ctx.arc(R + 15, 0, 7, 0, TAU); ctx.fill();
        ctx.fillRect(R, -3, 10, 6);
        ctx.restore();
      }
      ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill();
      ctx.restore();
      // The lit spoke, drawn over the wheel once it has settled.
      if (pi >= 0) {
        const a = (pi / 8) * TAU - Math.PI / 2; const q = after(S.s, 0.7, 0.4); const c = GRP[PATH[pi][1]][1];
        ctx.save(); ctx.globalAlpha *= q;
        ctx.strokeStyle = FLAME; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(WX + Math.cos(a) * 26, WY + Math.sin(a) * 26); ctx.lineTo(WX + Math.cos(a) * (R + 14), WY + Math.sin(a) * (R + 14)); ctx.stroke();
        halo(ctx, WX + Math.cos(a) * (R + 15), WY + Math.sin(a) * (R + 15), 34, c, 0.8);
        ctx.restore();
      }
      // Labels at the eight directions.
      PATH.forEach(([nm, g], j) => {
        const a = (j / 8) * TAU - Math.PI / 2; const ca = Math.cos(a); const sa = Math.sin(a);
        const x = WX + ca * LR + (Math.abs(ca) < 0.1 ? 0 : Math.sign(ca) * 6); const y = WY + (j === 0 ? -152 : j === 4 ? 152 : sa * (LR - 4));
        const align = Math.abs(ca) < 0.1 ? 'center' : ca > 0 ? 'left' : 'right';
        const on = pi === j; const c = GRP[g][1];
        ctx.save(); ctx.globalAlpha *= after(t, 0.4 + j * 0.15) * (pi >= 0 && !on ? 0.7 : 1);
        if (on) { ctx.font = `800 20px ${FONT}`; const w = ctx.measureText(nm).width + 20; const lx = align === 'center' ? x - w / 2 : align === 'left' ? x - 10 : x - w + 10; ctx.fillStyle = tint(c, 0.2); rounded(ctx, lx, y - 17, w, 34, 17); ctx.fill(); }
        label(ctx, nm, x, y, { size: on ? 20 : 19, weight: on ? 800 : 700, fill: on ? 'ink' : c, align });
        ctx.restore();
      });
      // The Four Noble Truths.
      const tw = (FIG.w - 32 - 36) / 4;
      TR.forEach(([h, sub], j) => {
        const x = X0 + 16 + j * (tw + 12); const on = S.i === j;
        ctx.save(); ctx.globalAlpha *= after(t, 0.3 + j * 0.2) * (S.i < 4 && !on ? 0.65 : 1);
        panel(ctx, x, Y0 + 452, tw, 104, j === 3 ? GOLD : 'purple', on ? 0.22 : 0.08, 14);
        dot(ctx, x + 24, Y0 + 476, 14, on ? FLAME : tint(GOLD, 0.6));
        label(ctx, String(j + 1), x + 24, Y0 + 477, { size: 18, weight: 800, fill: DARK });
        label(ctx, h, x + 46, Y0 + 477, { size: 20, weight: 800, fill: on ? 'ink' : j === 3 ? GOLD : LILAC, align: 'left' });
        para(ctx, sub, x + 12, Y0 + 522, tw - 24, 18, 'ink', 500, 2);
        ctx.restore();
      });
      if (S.i < 4) caption(ctx, TR[S.i][2], TR[S.i][3], S.i === 3 ? GOLD : LILAC, S.s);
      else caption(ctx, `${PATH[pi][0]} · ${GRP[PATH[pi][1]][0].toLowerCase()}`, PATH[pi][2], GRP[PATH[pi][1]][1], S.s);
      footer(ctx, 'The Buddha’s first teaching, at Sarnath, about 2,500 years ago');
      ctx.restore();
    },

    // The Five Pillars as five glowing columns; each pillar's scene above.
    'five-pillars'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5.5, 7, 6, 6, 6.5]);
      const P = [['Shahada', 'faith', GOLD], ['Salah', 'prayer', SKY], ['Zakat', 'charity', JADE], ['Sawm', 'fasting', LILAC], ['Hajj', 'pilgrimage', SAFF]];
      const px = (i) => cx + (i - 2) * 140;
      ctx.save(); fade(ctx, t);
      backdrop(ctx, '#162050', '#2f2416', 0.5);
      title(ctx, it.label || 'The Five Pillars of Islam');
      // A soft geometric lattice (eight-pointed stars), very faint.
      ctx.save(); ctx.globalAlpha *= 0.07; ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5;
      for (let gx = 0; gx < 7; gx++) for (let gy = 0; gy < 2; gy++) { const x = X0 + 70 + gx * 110; const y = Y0 + 360 + gy * 110; ctx.strokeRect(x - 22, y - 22, 44, 44); ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.strokeRect(-22, -22, 44, 44); ctx.restore(); }
      ctx.restore();
      // The building: roof, five pillars, steps.
      const RY = Y0 + 300;
      const rf = ctx.createLinearGradient(0, RY, 0, RY + 26);
      rf.addColorStop(0, '#f3e2bd'); rf.addColorStop(1, '#b89a64');
      ctx.fillStyle = rf; rounded(ctx, X0 + 64, RY, FIG.w - 128, 24, 6); ctx.fill();
      ctx.fillStyle = tint(GOLD, 0.8); ctx.fillRect(X0 + 74, RY + 8, FIG.w - 148, 3);
      P.forEach(([nm, mean, c], i) => {
        const x = px(i); const on = S.i === i; const a = after(t, 0.2 + i * 0.15);
        ctx.save(); ctx.globalAlpha *= a;
        if (on) halo(ctx, x, Y0 + 412, 120, c, 0.45);
        const g = ctx.createLinearGradient(x - 25, 0, x + 25, 0);
        g.addColorStop(0, on ? '#d8c08a' : '#8f8064'); g.addColorStop(0.5, on ? '#fff3d6' : '#cbbd9c'); g.addColorStop(1, on ? '#c9ad72' : '#857658');
        ctx.fillStyle = g; ctx.fillRect(x - 25, RY + 38, 50, 152);
        ctx.strokeStyle = 'rgba(80,60,30,0.25)'; ctx.lineWidth = 1.5;
        for (const fx of [-12, 0, 12]) { ctx.beginPath(); ctx.moveTo(x + fx, RY + 42); ctx.lineTo(x + fx, RY + 186); ctx.stroke(); }
        ctx.fillStyle = on ? '#fbe7bb' : '#b8a882'; ctx.fillRect(x - 35, RY + 24, 70, 14); ctx.fillRect(x - 35, RY + 190, 70, 14);
        // The pillar's emblem.
        const ey = Y0 + 412;
        dot(ctx, x, ey, 21, on ? tint(c, 0.95) : 'rgba(20,24,50,0.85)');
        const ic = on ? DARK : c;
        ctx.strokeStyle = color(ic); ctx.fillStyle = color(ic); ctx.lineWidth = 2.5;
        if (i === 0) { rounded(ctx, x - 11, ey - 9, 22, 15, 4); ctx.stroke(); poly(ctx, [x - 4, ey + 6, x - 8, ey + 12, x + 2, ey + 6], true); ctx.fill(); }
        else if (i === 1) { ctx.beginPath(); ctx.arc(x, ey + 6, 12, Math.PI, TAU); ctx.stroke(); dot(ctx, x + 6, ey - 4, 3.5, ic); line(ctx, x - 14, ey + 6, x + 14, ey + 6, ic, 2.5); }
        else if (i === 2) { for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.ellipse(x, ey + 8 - j * 6, 10, 3.5, 0, 0, TAU); ctx.fill(); } }
        else if (i === 3) symCrescent(ctx, x - 2, ey, 12, ic);
        else { ctx.fillRect(x - 9, ey - 8, 18, 18); ctx.fillStyle = on ? tint(GOLD, 1) : GOLD; ctx.fillRect(x - 9, ey - 4, 18, 3); }
        label(ctx, nm, x, Y0 + 528, { size: 20, weight: 800, fill: on ? 'ink' : c });
        label(ctx, mean, x, Y0 + 553, { size: 18, weight: 600, fill: on ? c : 'muted' });
        ctx.restore();
      });
      ctx.fillStyle = 'rgba(200,180,140,0.35)'; ctx.fillRect(X0 + 50, RY + 204, FIG.w - 100, 6);
      // The scene for the pillar in focus.
      const TY = Y0 + 64; const BY = Y0 + 290;
      ctx.save(); ctx.globalAlpha *= after(S.s, 0.1, 0.5) * S.lf;
      if (S.i === 0) {
        const w = 540; const h = 150; const sx = cx - w / 2; const sy = Y0 + 104;
        halo(ctx, cx, sy + h / 2, 300, GOLD, 0.22);
        const pg = ctx.createLinearGradient(0, sy, 0, sy + h);
        pg.addColorStop(0, '#f6e7c4'); pg.addColorStop(1, '#e2c995');
        ctx.fillStyle = pg; ctx.fillRect(sx, sy, w, h);
        ctx.fillStyle = '#9a6a34'; for (const x of [sx - 10, sx + w - 6]) { rounded(ctx, x, sy - 12, 16, h + 24, 8); ctx.fill(); }
        label(ctx, 'There is no god but God (Allah),', cx, sy + 52, { size: 23, weight: 700, fill: '#3a2610' });
        label(ctx, 'and Muhammad is His messenger.', cx, sy + 94, { size: 23, weight: 700, fill: '#3a2610' });
        label(ctx, 'The declaration of faith, in English', cx, BY - 16, { size: 18, weight: 500, fill: 'muted' });
      } else if (S.i === 1) {
        const HZ = Y0 + 254; const rx = 250; const ry = 166;
        const sa = Math.PI + clamp((S.s - 0.4) / 5.6) * Math.PI;
        const sunX = cx + Math.cos(sa) * rx; const sunY = HZ + Math.sin(sa) * ry;
        const up = clamp(-Math.sin(sa));
        const sk = ctx.createLinearGradient(0, TY, 0, HZ);
        sk.addColorStop(0, tint('#2a5aa8', 0.15 + 0.3 * up)); sk.addColorStop(1, tint(SAFF, 0.12 + 0.22 * (1 - up)));
        ctx.fillStyle = sk; rounded(ctx, X0 + 20, TY, FIG.w - 40, HZ - TY, 12); ctx.fill();
        ctx.strokeStyle = 'rgba(255,220,160,0.35)'; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
        ctx.beginPath(); ctx.ellipse(cx, HZ, rx, ry, 0, Math.PI, TAU); ctx.stroke(); ctx.setLineDash([]);
        line(ctx, X0 + 20, HZ, X1 - 20, HZ, 'rgba(255,220,160,0.6)', 2);
        halo(ctx, sunX, sunY, 70, GOLD, 0.6); dot(ctx, sunX, sunY, 16, FLAME);
        const PT = [['Fajr · dawn', Math.PI + 0.1, 0, 26], ['Dhuhr · midday', Math.PI * 1.5 + 0.08, 0, -22], ['Asr · afternoon', TAU - 0.62, 1, 0], ['Maghrib · sunset', TAU - 0.05, 0, 26]];
        PT.forEach(([nm, a, side, dy], j) => {
          const x = cx + Math.cos(a) * rx; const y = HZ + Math.sin(a) * ry; const done = sa >= a - 0.02;
          dot(ctx, x, y, done ? 7 : 5, done ? SKY : 'rgba(124,196,255,0.4)');
          if (side) label(ctx, nm, x + 16, y, { size: 18, weight: 700, fill: done ? 'ink' : 'muted', align: 'left' });
          else label(ctx, nm, x, y + dy, { size: 18, weight: 700, fill: done ? 'ink' : 'muted' });
          void j;
        });
        const night = S.s > 5.8 ? after(S.s, 5.8, 0.6) : 0;
        ctx.save(); ctx.globalAlpha *= 0.35 + 0.65 * night;
        symCrescent(ctx, X0 + 720, Y0 + 98, 15, CREAM);
        label(ctx, 'Isha · night', X0 + 720, Y0 + 128, { size: 18, weight: 700, fill: night ? 'ink' : 'muted' });
        ctx.restore();
        label(ctx, '5 prayers a day, facing Mecca', cx, HZ - 34, { size: 20, weight: 700, fill: SKY });
      } else if (S.i === 2) {
        label(ctx, 'savings', X0 + 220, Y0 + 88, { size: 19, weight: 700, fill: 'muted' });
        const fly = smooth((S.s - 1) / 2.2);
        for (let j = 0; j < 40; j++) {
          let x = X0 + 130 + (j % 10) * 20; let y = Y0 + 120 + Math.floor(j / 10) * 22;
          if (j === 39) { x = lerp(x, X0 + 600, fly); y = lerp(y, Y0 + 168, fly) - Math.sin(fly * Math.PI) * 60; halo(ctx, x, y, 26, GOLD, 0.6); }
          dot(ctx, x, y, 8, j === 39 ? FLAME : tint(GOLD, 0.55)); ring(ctx, x, y, 8, tint('#b8860b', 0.9), 1.5);
        }
        label(ctx, '1 coin in 40 = 2.5%', X0 + 220, Y0 + 228, { size: 19, weight: 800, fill: GOLD });
        // A bowl to receive the gift.
        const bg = ctx.createLinearGradient(0, Y0 + 180, 0, Y0 + 214);
        bg.addColorStop(0, '#d9a066'); bg.addColorStop(1, '#8a5530');
        ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(X0 + 556, Y0 + 182); ctx.quadraticCurveTo(X0 + 560, Y0 + 216, X0 + 600, Y0 + 216); ctx.quadraticCurveTo(X0 + 640, Y0 + 216, X0 + 644, Y0 + 182); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5a3418'; ctx.beginPath(); ctx.ellipse(X0 + 600, Y0 + 182, 44, 8, 0, 0, TAU); ctx.fill();
        label(ctx, 'to people in need', X0 + 600, Y0 + 238, { size: 19, weight: 700, fill: JADE });
        arrow(ctx, X0 + 360, Y0 + 152, X0 + 520, Y0 + 152, tint(JADE, 0.6), 3);
      } else if (S.i === 3) {
        const sk = ctx.createLinearGradient(0, TY, 0, BY);
        sk.addColorStop(0, 'rgba(18,22,60,0.9)'); sk.addColorStop(1, 'rgba(70,40,90,0.6)');
        ctx.fillStyle = sk; rounded(ctx, X0 + 20, TY, FIG.w - 40, BY - TY - 10, 12); ctx.fill();
        for (let j = 0; j < 26; j++) { const tw = 0.5 + 0.5 * Math.sin(k * 2 + j * 1.3); dot(ctx, X0 + 40 + rnd(j + 60) * 720, TY + 12 + rnd(j + 90) * 150, 1.6 + tw, `rgba(255,244,220,${0.35 + 0.5 * tw})`); }
        halo(ctx, X0 + 640, Y0 + 140, 90, CREAM, 0.3);
        symCrescent(ctx, X0 + 640, Y0 + 140, 42, CREAM);
        // A hanging lantern (fanous).
        const lx = X0 + 120; const ly = Y0 + 150 + Math.sin(k * 1.5) * 3;
        line(ctx, lx, TY, lx, ly - 34, 'rgba(255,220,160,0.6)', 2);
        halo(ctx, lx, ly, 70, SAFF, 0.5);
        ctx.fillStyle = '#b8862e'; poly(ctx, [lx - 16, ly - 30, lx + 16, ly - 30, lx + 22, ly - 10, lx + 18, ly + 22, lx - 18, ly + 22, lx - 22, ly - 10], true); ctx.fill();
        ctx.fillStyle = tint(FLAME, 0.9); poly(ctx, [lx - 12, ly - 22, lx + 12, ly - 22, lx + 15, ly - 8, lx + 12, ly + 16, lx - 12, ly + 16, lx - 15, ly - 8], true); ctx.fill();
        flame(ctx, lx, ly + 10, 16, k, 2, 1, 0.2);
        label(ctx, 'Ramadan, the 9th month', X0 + 380, Y0 + 104, { size: 23, weight: 800, fill: LILAC });
        label(ctx, 'no food or drink from dawn to sunset', X0 + 380, Y0 + 150, { size: 19, weight: 600, fill: 'ink' });
        label(ctx, 'iftar: breaking the fast at sunset', X0 + 380, Y0 + 186, { size: 19, weight: 600, fill: 'ink' });
        label(ctx, 'Eid al-Fitr celebrates the end', X0 + 380, Y0 + 222, { size: 19, weight: 600, fill: GOLD });
      } else {
        const KX = cx; const KB = Y0 + 236; const KS = 96;
        const ECX = cx + 12; const ECY = KB + 6; const erx = 200; const ery = 36;
        const pil = (front) => {
          for (let j = 0; j < 36; j++) {
            const th = -(k * 0.35) + (j / 36) * TAU; const s = Math.sin(th);
            if ((s > 0) !== front) continue;
            const r = 1 + (j % 3) * 0.08;
            dot(ctx, ECX + Math.cos(th) * erx * r, ECY + s * ery * r, front ? 4 : 3, front ? CREAM : 'rgba(255,244,220,0.55)');
          }
        };
        halo(ctx, KX, KB - 60, 200, GOLD, 0.2);
        ctx.fillStyle = 'rgba(232,196,138,0.18)'; ctx.beginPath(); ctx.ellipse(ECX, ECY, erx + 30, ery + 12, 0, 0, TAU); ctx.fill();
        pil(false);
        // The Kaaba: a simple black cube with a gold band.
        const fx = KX - KS / 2; const top = KB - KS; const sd = 34;
        ctx.fillStyle = '#16161c'; ctx.fillRect(fx, top, KS, KS);
        ctx.fillStyle = '#26262e'; poly(ctx, [fx + KS, top, fx + KS + sd, top - 14, fx + KS + sd, KB - 14, fx + KS, KB], true); ctx.fill();
        ctx.fillStyle = '#30303a'; poly(ctx, [fx, top, fx + sd, top - 14, fx + KS + sd, top - 14, fx + KS, top], true); ctx.fill();
        ctx.fillStyle = GOLD; ctx.fillRect(fx, top + 18, KS, 7);
        poly(ctx, [fx + KS, top + 18, fx + KS + sd, top + 4, fx + KS + sd, top + 11, fx + KS, top + 25], true); ctx.fill();
        pil(true);
        label(ctx, 'the Kaaba, in Mecca', X0 + 130, Y0 + 120, { size: 19, weight: 800, fill: GOLD });
        label(ctx, '7 circuits (tawaf)', X1 - 120, Y0 + 120, { size: 19, weight: 800, fill: CREAM });
        label(ctx, 'once in a lifetime, if able', cx, Y0 + 82, { size: 19, weight: 600, fill: SAFF });
      }
      ctx.restore();
      const CAP = [
        ['Shahada: the declaration of faith', 'The heart of Islam: belief in one God (Allah), and in Muhammad as God’s messenger, declared with sincere faith.', GOLD],
        ['Salah: prayer five times a day', 'Fajr (dawn), Dhuhr (midday), Asr (afternoon), Maghrib (sunset) and Isha (night), facing the Kaaba in Mecca.', SKY],
        ['Zakat: giving to those in need', 'Each year, Muslims who can afford it give 2.5% of their savings above a set amount to help the poor.', JADE],
        ['Sawm: fasting in Ramadan', 'Adults who are able fast from dawn to sunset during Ramadan. Children, the ill, travellers and the elderly need not fast.', LILAC],
        ['Hajj: pilgrimage to Mecca', 'Once in a lifetime, if they are able, Muslims travel to Mecca in the month of Dhul Hijjah and walk seven times around the Kaaba.', SAFF],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      footer(ctx, 'The Five Pillars: the core duties of Muslim life');
      ctx.restore();
    },

    // Two stone tablets with the commandments carved in short phrases.
    'ten-commandments'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [6, 5.5, 6, 6]);
      const CM = ['Have no other gods', 'Make no idols', 'Respect God’s name', 'Keep the Sabbath holy', 'Honour your parents', 'Do not murder', 'Be faithful in marriage', 'Do not steal', 'Do not lie about others', 'Do not envy (covet)'];
      ctx.save(); fade(ctx, t);
      ctx.save(); rounded(ctx, X0 + 8, Y0 + 52, FIG.w - 16, 514, 16); ctx.clip();
      const sky = ctx.createLinearGradient(0, Y0 + 52, 0, Y0 + 566);
      sky.addColorStop(0, '#1a1f4a'); sky.addColorStop(0.55, '#5a3a5a'); sky.addColorStop(1, '#c9773e');
      ctx.fillStyle = sky; ctx.fillRect(X0 + 8, Y0 + 52, FIG.w - 16, 514);
      halo(ctx, cx, Y0 + 300, 360, GOLD, 0.35 + 0.05 * Math.sin(k));
      ctx.save(); ctx.globalAlpha *= 0.12; ctx.strokeStyle = FLAME; ctx.lineWidth = 10;
      ctx.beginPath(); for (let j = 0; j < 14; j++) { const a = Math.PI + (j / 13) * Math.PI + Math.sin(k * 0.3) * 0.02; ctx.moveTo(cx + Math.cos(a) * 60, Y0 + 300 + Math.sin(a) * 60); ctx.lineTo(cx + Math.cos(a) * 520, Y0 + 300 + Math.sin(a) * 520); } ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#2a1c26'; poly(ctx, [X0 + 8, Y0 + 566, X0 + 8, Y0 + 430, X0 + 180, Y0 + 330, X0 + 300, Y0 + 380, cx, Y0 + 250, X0 + 560, Y0 + 360, X0 + 680, Y0 + 320, X1 - 8, Y0 + 420, X1 - 8, Y0 + 566], true); ctx.fill();
      ctx.restore();
      title(ctx, it.label || 'The Ten Commandments');
      // The tablets.
      const TW = 310; const TT = Y0 + 84; const TB = Y0 + 476;
      [cx - 12 - TW, cx + 12].forEach((x0, side) => {
        const g = ctx.createLinearGradient(x0, 0, x0 + TW, 0);
        g.addColorStop(0, '#8f8774'); g.addColorStop(0.3, '#cfc6b0'); g.addColorStop(0.7, '#d9d0ba'); g.addColorStop(1, '#9a917c');
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(x0 + 8, TB + 8); ctx.lineTo(x0 + 8, TT + TW / 2 + 8); ctx.arc(x0 + TW / 2 + 8, TT + TW / 2 + 8, TW / 2, Math.PI, TAU); ctx.lineTo(x0 + TW + 8, TB + 8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, TB); ctx.lineTo(x0, TT + TW / 2); ctx.arc(x0 + TW / 2, TT + TW / 2, TW / 2, Math.PI, TAU); ctx.lineTo(x0 + TW, TB); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,240,210,0.5)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.strokeStyle = 'rgba(90,80,60,0.18)'; ctx.lineWidth = 1;
        for (let j = 0; j < 9; j++) { const yy = TT + 60 + rnd(j + side * 9) * (TB - TT - 80); const xx = x0 + 20 + rnd(j + 30 + side * 9) * (TW - 80); ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 30 + rnd(j + 50) * 30, yy + 4); ctx.stroke(); }
        label(ctx, side ? 'VI – X' : 'I – V', x0 + TW / 2, TT + 70, { size: 20, weight: 800, fill: '#5a4f3a' });
        for (let j = 0; j < 5; j++) {
          const n = side * 5 + j; const y = TT + 128 + j * 60;
          const carve = S.i === 0 && S.n === 0 ? after(S.s, 0.5 + n * 0.45, 0.5) : 1;
          const hiGod = S.i === 1 && n < 4; const hiPeople = S.i === 2 && n >= 4;
          const on = hiGod || hiPeople;
          ctx.save(); ctx.globalAlpha *= carve;
          if (on) { ctx.fillStyle = tint(hiGod ? GOLD : SKY, 0.35); rounded(ctx, x0 + 14, y - 22, TW - 28, 44, 12); ctx.fill(); }
          if (S.i === 0 && carve < 1) halo(ctx, x0 + 40 + (TW - 60) * carve, y, 30, FLAME, 0.7 * (1 - carve));
          label(ctx, String(n + 1), x0 + 36, y + 1, { size: 20, weight: 800, fill: 'rgba(255,248,230,0.7)' });
          label(ctx, String(n + 1), x0 + 35, y, { size: 20, weight: 800, fill: '#4a3a22' });
          label(ctx, CM[n], x0 + 59, y + 1, { size: 19, weight: 700, fill: 'rgba(255,248,230,0.7)', align: 'left' });
          label(ctx, CM[n], x0 + 58, y, { size: 19, weight: 700, fill: '#3a3020', align: 'left' });
          ctx.restore();
        }
      });
      // Where they are written.
      ctx.save(); ctx.globalAlpha *= S.i === 3 ? 1 : 0.75;
      const sw = S.i === 3 ? 1 + 0.04 * Math.sin(k * 3) : 1;
      chip(ctx, 'Exodus 20', cx - 150, Y0 + 524, GOLD, Math.round(20 * sw));
      chip(ctx, 'Deuteronomy 5', cx + 150, Y0 + 524, GOLD, Math.round(20 * sw));
      label(ctx, 'and', cx, Y0 + 524, { size: 19, weight: 600, fill: 'ink' });
      ctx.restore();
      if (S.i === 1) chip(ctx, 'duties to God', cx - 12 - TW / 2, TT + 26, GOLD, 19);
      if (S.i === 2) chip(ctx, 'duties to other people', cx + 12 + TW / 2, TT + 26, SKY, 19);
      const CAP = [
        ['Given at Mount Sinai', 'The Torah tells that God gave Moses the Ten Commandments on two tablets of stone, on Mount Sinai.', GOLD],
        ['Duties to God', 'The first commandments are about honouring God: no other gods, no idols, respect for God’s name, and rest on the Sabbath.', GOLD],
        ['Duties to other people', 'The rest are about how to treat others: honour your parents; do not murder, steal, lie, or envy what belongs to others.', SKY],
        ['Where to find them', 'They appear twice, in Exodus 20 and Deuteronomy 5. Jews, Catholics and Protestants number them slightly differently.', GOLD],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      footer(ctx, 'Short wording; one common way of numbering them');
      ctx.restore();
    },

    // The ten Gurus as ten lamps, then the Guru Granth Sahib; the five Ks.
    'sikh-gurus'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5, 7, 5.5, 6, 7.5]);
      const GU = [['Guru Nanak', '1469–1539'], ['Guru Angad', '1539–1552'], ['Guru Amar Das', '1552–1574'], ['Guru Ram Das', '1574–1581'], ['Guru Arjan', '1581–1606'], ['Guru Hargobind', '1606–1644'], ['Guru Har Rai', '1644–1661'], ['Guru Har Krishan', '1661–1664'], ['Guru Tegh Bahadur', '1665–1675'], ['Guru Gobind Singh', '1675–1708']];
      const LX = X0 + 44; const ry = (i) => Y0 + 104 + i * 33;
      const litN = S.n > 0 ? 10 : S.i === 0 ? (S.s > 0.6 ? 1 : 0) : S.i === 1 ? 1 + Math.floor(clamp((S.s - 0.4) / 5.4) * 9.99) : 10;
      ctx.save(); fade(ctx, t);
      backdrop(ctx, '#1a1f4c', '#3a2614', 0.5);
      title(ctx, it.label || 'The ten Sikh Gurus');
      label(ctx, 'Years as Guru', X0 + 30, Y0 + 72, { size: 18, weight: 600, fill: 'muted', align: 'left' });
      line(ctx, LX, ry(0), LX, ry(10), 'rgba(255,200,120,0.4)', 2);
      GU.forEach(([nm, yrs], i) => {
        const y = ry(i); const lit = i < litN; const hi = (S.i === 2 && (i === 4 || i === 9)) || (S.i === 0 && i === 0);
        dot(ctx, LX, y + 2, 7, lit ? '#c8643c' : 'rgba(200,100,60,0.35)');
        if (lit) flame(ctx, LX, y - 3, 15, k, i, 1, 0.3);
        if (hi) { ctx.fillStyle = tint(SAFF, 0.16); rounded(ctx, LX + 14, y - 15, 300, 30, 15); ctx.fill(); }
        ctx.save(); ctx.globalAlpha *= lit ? 1 : 0.45;
        rich(ctx, [[`${i + 1}  `, 'muted', 700], [nm, lit ? '#ffcf8a' : 'muted', 800], [`  ${yrs}`, 'ink', 500]], LX + 22, y, 19, 600, 'left');
        ctx.restore();
      });
      // 1708: the scripture becomes the Guru.
      const g1708 = S.i >= 3 || S.n > 0;
      ctx.save(); ctx.globalAlpha *= g1708 ? 1 : 0.4;
      halo(ctx, LX, ry(10) + 6, g1708 ? 30 : 0, GOLD, 0.6);
      openBook(ctx, LX, ry(10) + 4, 22, CREAM, GOLD);
      rich(ctx, [['1708  ', GOLD, 800], ['the Guru Granth Sahib becomes Guru', 'ink', 600]], LX + 22, ry(10) + 4, 19, 600, 'left');
      ctx.restore();
      // The Guru Granth Sahib under its canopy.
      const BX = X0 + 610; const BY = Y0 + 262; const glowA = S.i === 3 ? 0.6 + 0.1 * Math.sin(k * 2) : 0.28;
      halo(ctx, BX, BY - 20, 190, GOLD, glowA);
      ctx.fillStyle = '#b0302c'; ctx.fillRect(BX - 130, Y0 + 92, 260, 18);
      ctx.fillStyle = GOLD;
      for (let j = 0; j < 13; j++) { ctx.beginPath(); ctx.arc(BX - 120 + j * 20, Y0 + 110, 10, 0, Math.PI); ctx.fill(); }
      line(ctx, BX - 126, Y0 + 110, BX - 126, BY + 46, '#c9a050', 3); line(ctx, BX + 126, Y0 + 110, BX + 126, BY + 46, '#c9a050', 3);
      ctx.fillStyle = '#7a4a22'; ctx.fillRect(BX - 104, BY + 26, 208, 16);
      ctx.fillRect(BX - 96, BY + 42, 10, 26); ctx.fillRect(BX + 86, BY + 42, 10, 26);
      ctx.fillStyle = '#d9822b'; poly(ctx, [BX - 112, BY + 26, BX + 112, BY + 26, BX + 104, BY + 4, BX - 104, BY + 4], true); ctx.fill();
      ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(BX - 108, BY + 20); ctx.lineTo(BX + 108, BY + 20); ctx.stroke();
      openBook(ctx, BX, BY - 18, 150, CREAM, GOLD);
      label(ctx, 'Guru Granth Sahib', BX, BY + 92, { size: 22, weight: 800, fill: GOLD });
      label(ctx, '1,430 angs · the eternal Guru', BX, BY + 120, { size: 19, weight: 600, fill: 'ink' });
      // The five Ks.
      const FK = [['Kesh', 'uncut hair'], ['Kara', 'steel bracelet'], ['Kangha', 'wooden comb'], ['Kachera', 'cotton shorts'], ['Kirpan', 'small sword']];
      const kOn = S.i === 4 ? Math.floor(clamp((S.s - 0.4) / 6) * 4.99) : -1;
      FK.forEach(([nm, mean], i) => {
        const x = X0 + 100 + i * 150; const y = Y0 + 480; const on = kOn === i;
        ctx.save(); ctx.globalAlpha *= S.i === 4 ? (i <= kOn ? 1 : 0.4) : 0.6;
        if (on) halo(ctx, x, y, 50, SAFF, 0.5);
        ctx.strokeStyle = SAND; ctx.fillStyle = SAND; ctx.lineWidth = 3; ctx.lineCap = 'round';
        if (i === 0) { ctx.fillStyle = '#e07a2a'; ctx.beginPath(); ctx.ellipse(x, y + 2, 22, 16, 0, Math.PI, TAU); ctx.lineTo(x + 22, y + 8); ctx.lineTo(x - 22, y + 8); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(120,40,10,0.6)'; ctx.lineWidth = 2; for (const d of [-8, 2]) { ctx.beginPath(); ctx.moveTo(x - 18, y + d); ctx.quadraticCurveTo(x, y + d - 10, x + 18, y + d + 4); ctx.stroke(); } }
        else if (i === 1) { ctx.strokeStyle = '#d8dde8'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, 15, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 15, -2.4, -1.4); ctx.stroke(); }
        else if (i === 2) { ctx.fillStyle = '#b8803e'; rounded(ctx, x - 18, y - 12, 36, 10, 4); ctx.fill(); for (let j = 0; j < 8; j++) ctx.fillRect(x - 16 + j * 4.4, y - 3, 2.4, 13); }
        else if (i === 3) { ctx.fillStyle = '#f2ece0'; poly(ctx, [x - 16, y - 12, x + 16, y - 12, x + 18, y + 12, x + 4, y + 12, x, y, x - 4, y + 12, x - 18, y + 12], true); ctx.fill(); }
        else { ctx.strokeStyle = '#d8dde8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 6, y + 14); ctx.quadraticCurveTo(x + 6, y - 4, x + 18, y - 14); ctx.stroke(); ctx.strokeStyle = SAND; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 18, y + 22); ctx.lineTo(x - 7, y + 13); ctx.stroke(); line(ctx, x - 13, y + 8, x - 1, y + 19, GOLD, 3); }
        label(ctx, nm, x, y + 38, { size: 19, weight: 800, fill: on ? 'ink' : SAFF });
        label(ctx, mean, x, y + 62, { size: 18, weight: 500, fill: 'muted' });
        ctx.restore();
      });
      const CAP = [
        ['Guru Nanak (1469–1539)', 'The first Guru taught that there is one God, that all people are equal, and that we should serve others (seva).', SAFF],
        ['Ten Gurus, one light', 'For about 240 years ten Gurus led the Sikhs. Sikhs believe each one carried the same divine light and teaching.', SAFF],
        ['Scripture and Khalsa', 'Guru Arjan compiled the Adi Granth in 1604. Guru Gobind Singh founded the Khalsa, the community of initiated Sikhs, in 1699.', SAFF],
        ['The eternal Guru', 'Before he died in 1708, Guru Gobind Singh named the scripture as Guru for ever: the Guru Granth Sahib, with 1,430 angs.', GOLD],
        ['The five Ks', 'Initiated (Khalsa) Sikhs wear five articles of faith: kesh, kara, kangha, kachera and kirpan.', SAFF],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      footer(ctx, 'Years shown are years as Guru (for Guru Nanak, his lifetime)');
      ctx.restore();
    },

    // The wheel of birth, life, death and rebirth, turned by karma, and the
    // way out: moksha, nirvana, kevala, mukti.
    'samsara-cycle'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5, 5, 5.5, 6, 6]);
      const WX = X0 + 252; const WY = Y0 + 310; const R = 122;
      const LX = X0 + 650; const LY = Y0 + 126;
      ctx.save(); fade(ctx, t);
      backdrop(ctx, '#191d4a', '#33201a', 0.5);
      title(ctx, it.label || 'Samsara: the cycle of rebirth');
      // The turning ring, drawn as arrows chasing round.
      const spin = k * 0.35;
      halo(ctx, WX, WY, R + 60, LILAC, 0.16);
      ctx.strokeStyle = tint(LILAC, 0.35); ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(WX, WY, R, 0, TAU); ctx.stroke();
      for (let j = 0; j < 4; j++) {
        const a0 = spin + (j / 4) * TAU + 0.32; const a1 = a0 + TAU / 4 - 0.64;
        ctx.strokeStyle = LILAC; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(WX, WY, R, a0, a1); ctx.stroke();
        const hx = WX + Math.cos(a1) * R; const hy = WY + Math.sin(a1) * R; const ta = a1 + Math.PI / 2;
        ctx.fillStyle = LILAC; poly(ctx, [hx + Math.cos(ta) * 12, hy + Math.sin(ta) * 12, hx + Math.cos(a1) * 9, hy + Math.sin(a1) * 9, hx - Math.cos(a1) * 9, hy - Math.sin(a1) * 9], true); ctx.fill();
      }
      // The four stations (fixed), with small growing-plant icons.
      const ST = [['birth', -Math.PI / 2, JADE], ['life', 0, GOLD], ['death', Math.PI / 2, '#9aa3c4'], ['rebirth', Math.PI, SKY]];
      ST.forEach(([nm, a, c], j) => {
        const x = WX + Math.cos(a) * R; const y = WY + Math.sin(a) * R;
        medal(ctx, x, y, 32, c, 0.6);
        ctx.strokeStyle = color(c); ctx.fillStyle = color(c); ctx.lineWidth = 3; ctx.lineCap = 'round';
        if (j === 0) { line(ctx, x, y + 14, x, y - 2, c, 3); ctx.beginPath(); ctx.ellipse(x - 7, y - 6, 8, 4, -0.6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 7, y - 6, 8, 4, 0.6, 0, TAU); ctx.fill(); }
        else if (j === 1) { line(ctx, x, y + 16, x, y - 4, c, 3); for (let q = 0; q < 6; q++) { const aa = (q / 6) * TAU; ctx.beginPath(); ctx.ellipse(x + Math.cos(aa) * 8, y - 8 + Math.sin(aa) * 8, 6, 4, aa, 0, TAU); ctx.fill(); } dot(ctx, x, y - 8, 4, FLAME); }
        else if (j === 2) { line(ctx, x, y + 16, x, y - 2, c, 3); ctx.beginPath(); ctx.moveTo(x, y - 2); ctx.quadraticCurveTo(x + 12, y - 8, x + 10, y + 8); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x + 9, y + 11, 5, 3, 1.2, 0, TAU); ctx.fill(); }
        else { ctx.beginPath(); ctx.ellipse(x, y + 4, 8, 6, 0, 0, TAU); ctx.fill(); halo(ctx, x, y + 2, 22, FLAME, 0.4); line(ctx, x, y - 2, x + 2, y - 12, JADE, 2.5); }
        if (j === 0 || j === 2) label(ctx, nm, x, y + (j ? 50 : -50), { size: 20, weight: 800, fill: c });
        else label(ctx, nm, x + (j === 1 ? 42 : -42), y, { size: 20, weight: 800, fill: c, align: j === 1 ? 'left' : 'right' });
      });
      // A small light travelling round the wheel.
      const sa = -Math.PI / 2 + k * 0.6;
      if (S.i < 2) { const x = WX + Math.cos(sa) * R; const y = WY + Math.sin(sa) * R; halo(ctx, x, y, 22, FLAME, 0.7); dot(ctx, x, y, 5, CREAM); }
      // Karma at the hub.
      const kar = S.i === 1 ? 1 : 0.55;
      halo(ctx, WX, WY, 80, SAFF, 0.2 + 0.25 * kar);
      ctx.fillStyle = 'rgba(12,14,36,0.92)'; ctx.beginPath(); ctx.arc(WX, WY, 54, 0, TAU); ctx.fill();
      ring(ctx, WX, WY, 54, tint(SAFF, 0.5 + 0.4 * kar), 2.5);
      ctx.save(); ctx.translate(WX, WY); ctx.rotate(-spin * 2); ctx.strokeStyle = tint(SAFF, 0.7); ctx.lineWidth = 2;
      for (let j = 0; j < 6; j++) { const a = (j / 6) * TAU; ctx.beginPath(); ctx.arc(0, 0, 46, a, a + 0.6); ctx.stroke(); }
      ctx.restore();
      label(ctx, 'karma', WX, WY - 6, { size: 22, weight: 800, fill: SAFF });
      label(ctx, 'actions', WX, WY + 18, { size: 18, weight: 500, fill: 'muted' });
      // The light of liberation, and the way out to it.
      const out = S.i >= 2 ? 1 : 0.3;
      ctx.save(); ctx.globalAlpha *= out;
      halo(ctx, LX, LY, 110, GOLD, 0.55 + 0.08 * Math.sin(k * 2));
      ctx.strokeStyle = tint(FLAME, 0.7); ctx.lineWidth = 2; ctx.beginPath();
      for (let j = 0; j < 12; j++) { const a = (j / 12) * TAU + k * 0.1; ctx.moveTo(LX + Math.cos(a) * 30, LY + Math.sin(a) * 30); ctx.lineTo(LX + Math.cos(a) * 46, LY + Math.sin(a) * 46); }
      ctx.stroke();
      dot(ctx, LX, LY, 22, FLAME);
      label(ctx, 'liberation', LX, LY + 66, { size: 20, weight: 800, fill: GOLD });
      ctx.restore();
      const wayP = it._way || (it._way = mkPath(qpts(WX + R * 0.72, WY - R * 0.72, X0 + 470, Y0 + 120, LX - 30, LY + 6)));
      if (S.i >= 2) {
        ctx.strokeStyle = tint(GOLD, 0.6); ctx.lineWidth = 3; ctx.setLineDash([6, 7]); strokeSpan(ctx, wayP, 0, wayP.total); ctx.setLineDash([]);
        const q = at(wayP, smooth(mod(k * 0.4, 1)) * wayP.total); halo(ctx, q.x, q.y, 22, FLAME, 0.7); dot(ctx, q.x, q.y, 5, CREAM);
      }
      // Four names for the way out.
      const NM = [['Hindus', 'moksha', 'release; one with Brahman', SAFF], ['Buddhists', 'nirvana', 'craving ends; perfect peace', GOLD], ['Jains', 'kevala', 'perfect knowledge, freedom', '#ffb86b'], ['Sikhs', 'mukti', 'union with God', '#ffcf8a']];
      NM.forEach(([who, word, mean, c], j) => {
        const x = X0 + 486; const y = Y0 + 224 + j * 80; const w = X1 - 16 - x;
        const on = S.i === 3 && Math.floor(clamp(S.s / 5.2) * 3.99) === j;
        ctx.save(); ctx.globalAlpha *= S.i >= 3 ? after(S.i === 3 ? S.s : 9, j * 0.35) : 0.3;
        panel(ctx, x, y, w, 70, c, on ? 0.2 : 0.08, 14);
        rich(ctx, [[`${who}: `, 'ink', 600], [word, c, 800]], x + 16, y + 22, 20, 600, 'left');
        label(ctx, mean, x + 16, y + 50, { size: 18, weight: 500, fill: 'muted', align: 'left' });
        ctx.restore();
      });
      const CAP = [
        ['Samsara: the wheel of life', 'Hindus, Buddhists, Jains and Sikhs describe life as a cycle: birth, life, death and rebirth, again and again.', LILAC],
        ['Karma turns the wheel', 'Karma means action. Kind and harmful actions shape what comes next, in this life and in future lives.', SAFF],
        ['Escaping the cycle', 'The highest goal is not a better rebirth but freedom from the cycle altogether.', GOLD],
        ['Many names for freedom', 'Hindus call it moksha, Buddhists nirvana, Jains kevala (perfect knowledge, then liberation) and Sikhs mukti.', GOLD],
        ['Different views', 'Hindus speak of the atman (self) being reborn. Buddhists describe rebirth without a fixed, unchanging self.', SKY],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      footer(ctx, 'Beliefs shared, with differences, by the faiths that began in India');
      ctx.restore();
    },

    // ─── Celebrations and places ─────────────────────────────────────────

    // Diwali, Hanukkah, Christmas and Vesak: four panels of light.
    'festivals-of-light'(b, ctx, it, t) {
      const k = b.clock;
      const PW = 380; const PH = 276;
      const PAN = [
        ['Diwali', 'Hindus, Sikhs, Jains', 'Light wins over darkness. Hindus remember Rama and Sita coming home.', SAFF, X0 + 14, Y0 + 58],
        ['Hanukkah', 'Jews', 'Eight nights recall the Temple lamp whose oil lasted eight days.', SKY, X0 + 406, Y0 + 58],
        ['Christmas', 'Christians', 'The birth of Jesus, whom Christians call the light of the world.', JADE, X0 + 14, Y0 + 346],
        ['Vesak', 'Buddhists', 'The Buddha’s birth, enlightenment and passing, honoured with lanterns.', GOLD, X0 + 406, Y0 + 346],
      ];
      const hi = t < 2 ? -1 : Math.floor(cycle(t, 16, 2) / 4);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Festivals of light');
      PAN.forEach(([nm, who, mean, c, x, y], i) => {
        const on = hi === i;
        ctx.save(); ctx.globalAlpha *= after(t, i * 0.2, 0.5);
        const g = ctx.createLinearGradient(0, y, 0, y + PH);
        g.addColorStop(0, 'rgba(14,16,40,0.95)'); g.addColorStop(1, tint(c, 0.12));
        ctx.fillStyle = g; ctx.strokeStyle = tint(c, on ? 0.95 : 0.45); ctx.lineWidth = on ? 3 : 2;
        rounded(ctx, x, y, PW, PH, 16); ctx.fill(); ctx.stroke();
        ctx.save(); rounded(ctx, x, y, PW, PH, 16); ctx.clip();
        const sx = x + PW / 2; const sy = y + 132;
        if (i === 0) {
          // Rangoli: rings of petals, turning slowly.
          halo(ctx, sx, sy, 110, SAFF, 0.3);
          const RC = ['#ff5c8a', SAFF, '#ffd23f', '#3ad1c0'];
          for (let r = 3; r >= 0; r--) {
            const n = 8 + r * 4; const rad = 18 + r * 18;
            ctx.fillStyle = RC[r];
            for (let j = 0; j < n; j++) { const a = (j / n) * TAU + (r % 2 ? 1 : -1) * k * 0.15; ctx.beginPath(); ctx.ellipse(sx + Math.cos(a) * rad, sy + Math.sin(a) * rad * 0.62, 9 - r, 5 - r * 0.6, a, 0, TAU); ctx.fill(); }
          }
          dot(ctx, sx, sy, 10, '#fff1c1');
          for (let j = 0; j < 5; j++) diya(ctx, x + 70 + j * 60, y + 214, 30, k, j);
        } else if (i === 1) {
          // A nine-branched menorah: eight candles and the shamash, night by night.
          const night = 1 + (Math.floor(Math.max(0, t - 0.5) / 1.6) % 8);
          const HY = y + 138; const sp = 36;
          halo(ctx, sx, HY - 30, 150, GOLD, 0.16 + 0.03 * night);
          ctx.strokeStyle = GOLD; ctx.lineWidth = 5; ctx.lineCap = 'round';
          for (let d = 1; d <= 4; d++) { ctx.beginPath(); ctx.ellipse(sx, HY, d * sp, d * 13, 0, 0, Math.PI); ctx.stroke(); }
          line(ctx, sx, HY - 24, sx, y + 202, GOLD, 6);
          ctx.fillStyle = GOLD; poly(ctx, [sx - 40, y + 212, sx + 40, y + 212, sx + 18, y + 200, sx - 18, y + 200], true); ctx.fill();
          for (let j = 0; j < 9; j++) {
            const hx = sx + (j - 4) * sp; const sh = j === 4; const hy = sh ? HY - 24 : HY;
            ctx.fillStyle = GOLD; ctx.fillRect(hx - 8, hy - 4, 16, 5);
            const pos = j < 4 ? j : j - 1; // 0..7 left to right (shamash skipped)
            const lit = sh || pos >= 8 - night;
            candle(ctx, hx, hy - 4, 30, 8, sh ? CREAM : '#a9c9ff', k, j, lit ? 1 : 0);
          }
          chip(ctx, `Night ${night} of 8`, x + 76, y + 64, SKY, 18);
          label(ctx, '+ the shamash', x + PW - 18, y + 64, { size: 18, weight: 600, fill: 'muted', align: 'right' });
        } else if (i === 2) {
          // A tree with lights and a star.
          halo(ctx, sx, y + 52, 90, GOLD, 0.45);
          for (let j = 0; j < 3; j++) { const ty = y + 84 + j * 40; const w = 46 + j * 30; ctx.fillStyle = j % 2 ? '#1f6b47' : '#257a52'; poly(ctx, [sx, ty - 36, sx + w, ty + 30, sx - w, ty + 30], true); ctx.fill(); }
          ctx.fillStyle = '#6a3e1e'; ctx.fillRect(sx - 9, y + 194, 18, 16);
          const LC = ['#ff6b6b', '#ffd23f', '#6bc5ff', '#ff9ff3', '#7dffb0'];
          for (let j = 0; j < 22; j++) { const tier = j % 3; const q = rnd(j + 7); const ty = y + 90 + tier * 40 + q * 22; const w = (46 + tier * 30) * ((ty - (y + 48 + tier * 40)) / 66); const lx = sx + (rnd(j + 11) * 2 - 1) * w * 0.8; const tw = 0.5 + 0.5 * Math.sin(k * 3 + j * 1.7); halo(ctx, lx, ty, 9, LC[j % 5], 0.5 * tw); dot(ctx, lx, ty, 3, LC[j % 5]); }
          ctx.fillStyle = FLAME; starPath(ctx, sx, y + 48, 5, 16, 7); ctx.fill();
        } else {
          // Hanging lanterns, gently swaying, and one rising.
          const LC = [GOLD, '#ff9a7a', '#ffd23f', '#f7a8ff', SAFF];
          for (let j = 0; j < 5; j++) {
            const lx = x + 50 + j * 70; const len = 50 + (j % 2) * 34; const sw = Math.sin(k * 1.2 + j) * 0.06;
            const ex = lx + Math.sin(sw) * len; const ey = y + 56 + Math.cos(sw) * len;
            line(ctx, lx, y + 50, ex, ey - 16, 'rgba(255,230,180,0.5)', 1.5);
            halo(ctx, ex, ey, 46, LC[j], 0.45);
            ctx.fillStyle = tint(LC[j], 0.9); ctx.beginPath(); ctx.ellipse(ex, ey, 17, 21, 0, 0, TAU); ctx.fill();
            ctx.strokeStyle = 'rgba(120,60,20,0.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(ex, ey, 8, 21, 0, 0, TAU); ctx.stroke();
            ctx.fillStyle = '#8a5530'; ctx.fillRect(ex - 7, ey - 24, 14, 5); ctx.fillRect(ex - 7, ey + 19, 14, 5);
          }
          const ry = y + 236 - mod(k * 18, 160); const rx = x + 300 + Math.sin(k * 0.8) * 10;
          halo(ctx, rx, ry, 30, SAFF, 0.5); ctx.fillStyle = tint(FLAME, 0.85); rounded(ctx, rx - 9, ry - 12, 18, 22, 5); ctx.fill();
          ctx.fillStyle = '#f2a7c3'; for (let j = 0; j < 6; j++) { const a = Math.PI + (j / 5) * Math.PI; ctx.beginPath(); ctx.ellipse(sx + Math.cos(a) * 26, y + 196 + Math.sin(a) * 12, 13, 6, a, 0, TAU); ctx.fill(); }
          dot(ctx, sx, y + 196, 7, GOLD);
        }
        ctx.restore();
        label(ctx, nm, x + 18, y + 28, { size: 22, weight: 800, fill: c, align: 'left' });
        label(ctx, who, x + PW - 16, y + 28, { size: 18, weight: 600, fill: 'muted', align: 'right' });
        ctx.fillStyle = 'rgba(8,10,28,0.7)'; rounded(ctx, x + 8, y + PH - 62, PW - 16, 54, 10); ctx.fill();
        para(ctx, mean, x + 16, y + PH - 35, PW - 32, 18, 'ink', 500, 2);
        ctx.restore();
      });
      footer(ctx, 'In many faiths, light stands for hope, goodness and new beginnings');
      ctx.restore();
    },

    // Six places of worship: one drawn large with its parts named, the rest small.
    'places-of-worship'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5.5, 5.5, 5.5, 5.5, 5.5, 5.5], 0.4);
      const WALL = '#efe3c8'; const SHADE = '#c9b48c'; const WIN = '#ffcf6b';
      const win = (x, y, w, h, a = 1) => { ctx.fillStyle = tint(WIN, 0.55 + 0.35 * a); ctx.beginPath(); ctx.moveTo(x - w / 2, y + h / 2); ctx.lineTo(x - w / 2, y - h / 2 + w / 2); ctx.arc(x, y - h / 2 + w / 2, w / 2, Math.PI, TAU); ctx.lineTo(x + w / 2, y + h / 2); ctx.closePath(); ctx.fill(); };
      // Each drawer: (x, ground y, scale). Coordinates are in local units, up is negative.
      const B = [
        { name: 'Mandir', faith: 'Hindu temple', c: SAFF,
          draw(x, g, s) {
            ctx.save(); ctx.translate(x, g); ctx.scale(s, s);
            ctx.fillStyle = SHADE; ctx.fillRect(-170, -22, 340, 22);
            ctx.fillStyle = WALL; ctx.fillRect(-150, -112, 120, 90);
            ctx.fillStyle = '#e6d4ae'; poly(ctx, [-160, -112, -20, -112, -50, -150, -130, -150], true); ctx.fill(); poly(ctx, [-130, -150, -50, -150, -76, -176, -104, -176], true); ctx.fill();
            win(-90, -62, 34, 60, 1);
            ctx.fillStyle = WALL; ctx.beginPath(); ctx.moveTo(-30, -22); ctx.lineTo(-30, -112); ctx.quadraticCurveTo(-26, -250, 36, -282); ctx.quadraticCurveTo(98, -250, 102, -112); ctx.lineTo(102, -22); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(150,110,60,0.35)'; ctx.lineWidth = 3; for (let j = 0; j < 6; j++) { const yy = -130 - j * 24; const hw = 66 - j * 8.5; ctx.beginPath(); ctx.moveTo(36 - hw, yy); ctx.lineTo(36 + hw, yy); ctx.stroke(); }
            ctx.fillStyle = '#e0c48a'; ctx.beginPath(); ctx.ellipse(36, -284, 22, 7, 0, 0, TAU); ctx.fill();
            ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(36, -298, 8, 0, TAU); ctx.fill(); ctx.fillRect(34, -312, 4, 10);
            line(ctx, 38, -300, 38, -336, '#8a5a34', 2.5); ctx.fillStyle = SAFF; poly(ctx, [38, -336, 64, -328 + Math.sin(k * 3) * 3, 38, -320], true); ctx.fill();
            halo(ctx, 36, -60, 50, WIN, 0.5); win(36, -60, 40, 70, 1);
            ctx.restore();
          },
          parts: [['kalasha and flag', 'the top finial', 36, -310, 'L', -300], ['mandapa', 'hall for worshippers', -90, -130, 'L', -120], ['shikhara', 'the tower, like a mountain', 70, -200, 'R', -220], ['garbhagriha', 'inner shrine with the murti', 52, -60, 'R', -70]],
          cap: 'Hindus visit the mandir for puja (worship) and darshan: seeing the sacred image (murti) of a deity in the inner shrine.' },
        { name: 'Church', faith: 'Christian', c: '#9ec5ff',
          draw(x, g, s) {
            ctx.save(); ctx.translate(x, g); ctx.scale(s, s);
            ctx.fillStyle = '#d9cdb4'; ctx.fillRect(-160, -120, 50, 120); ctx.fillRect(110, -120, 50, 120);
            ctx.fillStyle = WALL; ctx.fillRect(-110, -160, 220, 160);
            ctx.fillStyle = '#e2d3b0'; poly(ctx, [-120, -160, 0, -230, 120, -160], true); ctx.fill();
            ctx.fillStyle = WALL; ctx.fillRect(-28, -268, 56, 70);
            win(-10, -240, 12, 30, 0.8); win(10, -240, 12, 30, 0.8);
            ctx.fillStyle = '#d6c6a2'; poly(ctx, [-32, -268, 0, -330, 32, -268], true); ctx.fill();
            ctx.fillStyle = GOLD; ctx.fillRect(-2.5, -352, 5, 26); ctx.fillRect(-10, -344, 20, 5);
            const rw = 34; halo(ctx, 0, -120, 60, WIN, 0.4); ctx.fillStyle = tint(WIN, 0.85); ctx.beginPath(); ctx.arc(0, -120, rw, 0, TAU); ctx.fill();
            ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2.5; ctx.beginPath(); for (let j = 0; j < 8; j++) { const a = (j / 8) * TAU; ctx.moveTo(0, -120); ctx.lineTo(Math.cos(a) * rw, -120 + Math.sin(a) * rw); } ctx.stroke(); ring(ctx, 0, -120, 12, '#8a6a3a', 2.5);
            ctx.fillStyle = '#6a4424'; ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(-24, -40); ctx.arc(0, -40, 24, Math.PI, TAU); ctx.lineTo(24, 0); ctx.closePath(); ctx.fill();
            win(-70, -80, 22, 56, 0.9); win(70, -80, 22, 56, 0.9); win(-135, -70, 18, 46, 0.7); win(135, -70, 18, 46, 0.7);
            ctx.restore();
          },
          parts: [['spire and cross', 'pointing to heaven', 8, -320, 'R', -320], ['bell tower', 'calls people to worship', -22, -240, 'L', -250], ['rose window', 'stained glass', 30, -120, 'R', -140], ['nave', 'the main hall for worship', -80, -60, 'L', -60]],
          cap: 'Christians gather in church to worship, pray, sing and share Holy Communion. Many churches are built in the shape of a cross.' },
        { name: 'Mosque', faith: 'Muslim (masjid)', c: JADE,
          draw(x, g, s) {
            ctx.save(); ctx.translate(x, g); ctx.scale(s, s);
            for (const sx of [-150, 150]) {
              ctx.fillStyle = WALL; ctx.fillRect(sx - 11, -270, 22, 270);
              ctx.fillStyle = SHADE; ctx.fillRect(sx - 17, -200, 34, 8); ctx.fillRect(sx - 15, -272, 30, 8);
              ctx.fillStyle = '#e6d4ae'; poly(ctx, [sx - 11, -272, sx, -306, sx + 11, -272], true); ctx.fill();
              symCrescent(ctx, sx, -318, 8, GOLD);
            }
            ctx.fillStyle = WALL; ctx.fillRect(-120, -130, 240, 130);
            ctx.fillStyle = '#e8d8b4'; ctx.fillRect(-72, -160, 144, 32);
            const dg = ctx.createLinearGradient(-80, 0, 80, 0); dg.addColorStop(0, '#3a9a7a'); dg.addColorStop(0.5, '#6fd1ad'); dg.addColorStop(1, '#2f7f64');
            ctx.fillStyle = dg; ctx.beginPath(); ctx.moveTo(-76, -160); ctx.bezierCurveTo(-80, -230, -20, -246, 0, -268); ctx.bezierCurveTo(20, -246, 80, -230, 76, -160); ctx.closePath(); ctx.fill();
            symCrescent(ctx, 0, -284, 10, GOLD); line(ctx, 0, -268, 0, -274, GOLD, 3);
            for (const dx of [-96, 96]) { ctx.fillStyle = '#4fae8c'; ctx.beginPath(); ctx.arc(dx, -130, 20, Math.PI, TAU); ctx.fill(); }
            halo(ctx, 0, -50, 50, WIN, 0.45);
            ctx.fillStyle = '#5a3a20'; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-30, -60); ctx.quadraticCurveTo(-30, -90, 0, -104); ctx.quadraticCurveTo(30, -90, 30, -60); ctx.lineTo(30, 0); ctx.closePath(); ctx.fill();
            ctx.fillStyle = tint(WIN, 0.85); ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(-14, -52); ctx.quadraticCurveTo(-14, -70, 0, -78); ctx.quadraticCurveTo(14, -70, 14, -52); ctx.lineTo(14, -6); ctx.closePath(); ctx.fill();
            win(-76, -70, 18, 40, 0.8); win(76, -70, 18, 40, 0.8);
            ctx.restore();
          },
          parts: [['minaret', 'the call to prayer (adhan)', -150, -236, 'L', -236], ['dome', 'over the prayer hall', 40, -220, 'R', -230], ['mihrab', 'niche facing Mecca (qibla)', 0, -50, 'R', -110], ['prayer hall', 'wash first (wudu)', -100, -60, 'L', -80]],
          cap: 'Muslims gather in the mosque (masjid) to pray, especially for Friday prayers. They wash first (wudu) and face Mecca.' },
        { name: 'Synagogue', faith: 'Jewish', c: SKY,
          draw(x, g, s) {
            ctx.save(); ctx.translate(x, g); ctx.scale(s, s);
            const wg = ctx.createLinearGradient(0, -320, 0, 0); wg.addColorStop(0, '#2a2f5c'); wg.addColorStop(1, '#4a3a4a');
            ctx.fillStyle = wg; ctx.fillRect(-170, -320, 340, 320);
            ctx.fillStyle = '#5a4030'; ctx.fillRect(-170, -40, 340, 40);
            for (const dx of [-135, 135]) win(dx, -268, 26, 50, 0.7);
            // The Ark with its curtain, the tablets above, the eternal light.
            ctx.fillStyle = '#8a5a34'; ctx.fillRect(-60, -230, 120, 150);
            ctx.fillStyle = '#2f55a8'; ctx.fillRect(-50, -220, 100, 132);
            ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.strokeRect(-50, -220, 100, 132);
            symDavid(ctx, 0, -160, 18, GOLD);
            ctx.fillStyle = '#d9d0ba'; for (const dx of [-17, 17]) { ctx.beginPath(); ctx.moveTo(dx - 14, -238); ctx.lineTo(dx - 14, -254); ctx.arc(dx, -254, 14, Math.PI, TAU); ctx.lineTo(dx + 14, -238); ctx.closePath(); ctx.fill(); }
            line(ctx, 0, -320, 0, -302, '#c9a050', 2);
            halo(ctx, 0, -296, 36, '#ff6a3d', 0.6 + 0.15 * Math.sin(k * 3)); dot(ctx, 0, -296, 7, '#ff8a5a');
            // The bimah: the reading desk in front.
            ctx.fillStyle = '#a0703e'; ctx.fillRect(-90, -64, 180, 24); ctx.fillStyle = '#7a5028'; poly(ctx, [-40, -64, 40, -64, 30, -92, -30, -92], true); ctx.fill();
            ctx.fillStyle = CREAM; ctx.fillRect(-22, -96, 44, 8);
            // A seven-branched menorah to one side.
            ctx.strokeStyle = GOLD; ctx.lineWidth = 3; for (let d = 1; d <= 3; d++) { ctx.beginPath(); ctx.arc(120, -200, d * 12, 0, Math.PI); ctx.stroke(); }
            line(ctx, 120, -200, 120, -140, GOLD, 4); for (let j = -3; j <= 3; j++) flame(ctx, 120 + j * 12, -202, 8, k, j, 1, 0.15);
            ctx.restore();
          },
          parts: [['ner tamid', 'the eternal light', 0, -296, 'R', -300], ['Aron Hakodesh (Ark)', 'holds the Torah scrolls', -50, -170, 'L', -190], ['bimah', 'platform for reading Torah', -80, -52, 'L', -60], ['menorah', 'seven branches', 140, -200, 'R', -170]],
          cap: 'Jews meet in the synagogue to pray, study and read from the Torah scrolls, which are kept in the Ark.' },
        { name: 'Gurdwara', faith: 'Sikh', c: '#ffb347',
          draw(x, g, s) {
            ctx.save(); ctx.translate(x, g); ctx.scale(s, s);
            line(ctx, -150, 0, -150, -330, '#c9a050', 4);
            ctx.fillStyle = SAFF; poly(ctx, [-150, -330, -100, -316 + Math.sin(k * 3) * 4, -150, -300], true); ctx.fill();
            symKhanda(ctx, -130, -316, 8, '#1d3a8a');
            ctx.fillStyle = WALL; ctx.fillRect(-110, -150, 220, 150);
            ctx.fillStyle = '#e6d8b8'; ctx.fillRect(-120, -160, 240, 12);
            const dg = ctx.createLinearGradient(-60, 0, 60, 0); dg.addColorStop(0, '#d9a441'); dg.addColorStop(0.5, '#ffe08a'); dg.addColorStop(1, '#c08a2a');
            ctx.fillStyle = dg; ctx.beginPath(); ctx.moveTo(-56, -160); ctx.bezierCurveTo(-74, -220, -20, -232, 0, -262); ctx.bezierCurveTo(20, -232, 74, -220, 56, -160); ctx.closePath(); ctx.fill();
            ctx.fillStyle = GOLD; ctx.fillRect(-2, -282, 4, 22); ctx.beginPath(); ctx.arc(0, -284, 5, 0, TAU); ctx.fill();
            for (const dx of [-100, 100]) { ctx.fillStyle = WALL; ctx.fillRect(dx - 12, -190, 24, 30); ctx.fillStyle = '#e8c060'; ctx.beginPath(); ctx.arc(dx, -190, 14, Math.PI, TAU); ctx.fill(); }
            halo(ctx, 0, -50, 46, WIN, 0.45);
            for (const dx of [-70, 0, 70]) win(dx, -44, 30, 76, dx === 0 ? 1 : 0.85);
            ctx.fillStyle = '#e9dcc0'; ctx.fillRect(122, -70, 60, 70); ctx.fillStyle = '#b07a48'; poly(ctx, [116, -70, 152, -96, 188, -70], true); ctx.fill();
            for (let j = 0; j < 3; j++) { ctx.strokeStyle = `rgba(255,255,255,${0.25 + 0.15 * Math.sin(k * 2 + j)})`; ctx.lineWidth = 2; ctx.beginPath(); const sy = -100 - j * 12 - mod(k * 10, 12); ctx.moveTo(160, sy); ctx.quadraticCurveTo(166, sy - 6, 160, sy - 12); ctx.stroke(); }
            ctx.restore();
          },
          parts: [['Nishan Sahib', 'flag with the khanda', -150, -300, 'L', -300], ['dome', 'over the prayer hall', 40, -210, 'R', -250], ['doors on every side', 'open to all people', -70, -40, 'L', -90], ['langar hall', 'free kitchen for all', 160, -60, 'R', -70]],
          cap: 'Sikhs gather in the gurdwara, where the Guru Granth Sahib is kept. Everyone is welcome to share the free meal, langar.' },
        { name: 'Stupa', faith: 'Buddhist', c: GOLD,
          draw(x, g, s) {
            ctx.save(); ctx.translate(x, g); ctx.scale(s, s);
            ctx.fillStyle = SHADE; ctx.fillRect(-170, -30, 340, 30);
            ctx.strokeStyle = '#b39a6a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-170, -46); ctx.lineTo(170, -46); ctx.stroke();
            for (let j = -8; j <= 8; j++) { ctx.beginPath(); ctx.moveTo(j * 20, -30); ctx.lineTo(j * 20, -50); ctx.stroke(); }
            const dg = ctx.createRadialGradient(-30, -120, 10, 0, -60, 150); dg.addColorStop(0, '#fff6e2'); dg.addColorStop(1, '#d9c8a2');
            ctx.fillStyle = dg; ctx.beginPath(); ctx.moveTo(-130, -30); ctx.bezierCurveTo(-130, -210, 130, -210, 130, -30); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#d8c49a'; ctx.fillRect(-26, -192, 52, 26); ctx.strokeStyle = '#a08850'; ctx.lineWidth = 2; ctx.strokeRect(-26, -192, 52, 26);
            line(ctx, 0, -192, 0, -300, GOLD, 4);
            ctx.fillStyle = GOLD; for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.ellipse(0, -214 - j * 30, 32 - j * 8, 6, 0, 0, TAU); ctx.fill(); }
            halo(ctx, 0, -300, 24, GOLD, 0.6);
            ctx.restore();
          },
          parts: [['chattra', 'umbrellas: a sign of honour', 24, -244, 'R', -260], ['harmika', 'square railing on top', -26, -180, 'L', -200], ['dome (anda)', 'often holds relics', -90, -110, 'L', -110], ['walkway', 'to walk around clockwise', 120, -46, 'R', -60]],
          cap: 'Buddhists walk clockwise around the stupa, which often holds relics, to honour the Buddha and his teaching.' },
      ];
      ctx.save(); fade(ctx, t);
      backdrop(ctx, '#1b2252', '#3a2a1c', 0.5, Y0 + 52, Y0 + 442);
      title(ctx, it.label || 'Places of worship');
      const cur = B[S.i]; const G = Y0 + 398; const sc = S.i === 1 ? 0.9 : 0.95;
      ctx.save(); ctx.globalAlpha *= after(S.s, 0, 0.5) * S.lf;
      halo(ctx, cx, G - 150, 260, cur.c, 0.18);
      line(ctx, X0 + 40, G, X1 - 40, G, 'rgba(255,220,160,0.35)', 2);
      cur.draw(cx, G, sc);
      cur.parts.forEach(([nm, sub, px, py, side, ly], j) => {
        const a = after(S.s, 0.6 + j * 0.4); if (a <= 0) return;
        ctx.save(); ctx.globalAlpha *= a;
        const ax = cx + px * sc; const ay = G + py * sc; const lyy = G + ly * sc;
        const tx = side === 'L' ? X0 + 24 : X1 - 24;
        ctx.font = `800 19px ${FONT}`; let tw = ctx.measureText(nm).width; ctx.font = `500 18px ${FONT}`; tw = Math.max(tw, ctx.measureText(sub).width);
        const ex = side === 'L' ? Math.min(tx + tw + 12, ax - 16) : Math.max(tx - tw - 12, ax + 16);
        ctx.strokeStyle = tint(cur.c, 0.8); ctx.lineWidth = 2; poly(ctx, [ex, lyy, side === 'L' ? ex + 10 : ex - 10, lyy, ax, ay]); ctx.stroke();
        dot(ctx, ax, ay, 4.5, cur.c);
        label(ctx, nm, tx, lyy - 11, { size: 19, weight: 800, fill: cur.c, align: side === 'L' ? 'left' : 'right' });
        label(ctx, sub, tx, lyy + 13, { size: 18, weight: 500, fill: 'ink', align: side === 'L' ? 'left' : 'right' });
        ctx.restore();
      });
      label(ctx, `${cur.name} · ${cur.faith}`, cx, G + 26, { size: 22, weight: 800, fill: cur.c });
      ctx.restore();
      // The six, small, along the bottom.
      B.forEach((bb, i) => {
        const x = X0 + 80 + i * 128; const on = i === S.i;
        ctx.save(); ctx.globalAlpha *= on ? 1 : 0.55;
        if (on) { ctx.fillStyle = tint(bb.c, 0.14); rounded(ctx, x - 60, Y0 + 446, 120, 122, 12); ctx.fill(); }
        bb.draw(x, Y0 + 532, 0.24);
        label(ctx, bb.name, x, Y0 + 552, { size: 18, weight: 800, fill: on ? bb.c : 'ink' });
        ctx.restore();
      });
      caption(ctx, `Worship in the ${cur.name.toLowerCase()}`, cur.cap, cur.c, S.s);
      footer(ctx, 'Buildings vary around the world; these show common features');
      ctx.restore();
    },

    // The Golden Rule in the words of eight traditions, round a glowing circle.
    'golden-rule'(b, ctx, it, t) {
      const k = b.clock;
      const CX = cx; const CY = Y0 + 305;
      const Q = [
        ['Hindu', 'Do not do to others what would hurt you.', 'Mahabharata', SAFF],
        ['Jewish', 'What is hateful to you, do not do to others.', 'Hillel, Talmud', SKY],
        ['Christian', 'Do to others as you would have them do to you.', 'Matthew 7:12', '#9ec5ff'],
        ['Muslim', 'Wish for others what you wish for yourself.', 'Hadith (Nawawi 13)', JADE],
        ['Buddhist', 'Hurt not others in ways you would find hurtful.', 'Udanavarga 5:18', GOLD],
        ['Sikh', 'No one is my enemy, and no one a stranger.', 'Guru Granth Sahib', '#ffb347'],
        ['Confucian', 'Do not impose on others what you do not wish.', 'Analects 15:24', ROSE],
        ['Humanist', 'Treat others as you would like to be treated.', 'Humanist ethics', LILAC],
      ];
      const POS = [[X0 + 140, Y0 + 132], [cx, Y0 + 132], [X1 - 140, Y0 + 132], [X1 - 140, Y0 + 305], [X1 - 140, Y0 + 478], [cx, Y0 + 478], [X0 + 140, Y0 + 478], [X0 + 140, Y0 + 305]];
      const CW = 250; const CH = 142;
      const hi = t < 4.5 ? -1 : Math.floor(cycle(t, 8 * 2.5, 4.5) / 2.5);
      ctx.save(); fade(ctx, t);
      backdrop(ctx, '#1b1f4e', '#3a2618', 0.45);
      title(ctx, it.label || 'The Golden Rule');
      // Rays from the centre with light travelling out along them.
      Q.forEach((q, i) => {
        const [x, y] = POS[i]; const a = after(t, 0.6 + i * 0.4);
        if (a <= 0) return;
        const dx = x - CX; const dy = y - CY; const L = Math.hypot(dx, dy); const ux = dx / L; const uy = dy / L;
        const x0 = CX + ux * 84; const y0 = CY + uy * 84; const x1 = CX + ux * (L - 50); const y1 = CY + uy * (L - 50);
        ctx.save(); ctx.globalAlpha *= a;
        line(ctx, x0, y0, x1, y1, tint(q[3], hi === i ? 0.8 : 0.35), hi === i ? 3 : 2);
        const p = mod(k * 0.5 + i * 0.13, 1); halo(ctx, lerp(x0, x1, p), lerp(y0, y1, p), 14, q[3], 0.7);
        ctx.restore();
      });
      // The glowing circle.
      const pulse = 0.5 + 0.5 * Math.sin(k * 1.6);
      halo(ctx, CX, CY, 150, GOLD, 0.45 + 0.1 * pulse);
      const cg = ctx.createRadialGradient(CX, CY - 30, 10, CX, CY, 80);
      cg.addColorStop(0, '#fff2cc'); cg.addColorStop(1, '#e0a63a');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(CX, CY, 80, 0, TAU); ctx.fill();
      ['Treat others', 'as you want', 'to be treated'].forEach((s, j) => label(ctx, s, CX, CY - 24 + j * 25, { size: 20, weight: 800, fill: '#3a2208' }));
      // The cards.
      Q.forEach(([who, words, src, c], i) => {
        const [x, y] = POS[i]; const a = after(t, 0.8 + i * 0.4, 0.5); const on = hi === i;
        if (a <= 0) return;
        ctx.save(); ctx.globalAlpha *= a;
        if (on) halo(ctx, x, y, 150, c, 0.25);
        ctx.fillStyle = 'rgba(10,12,32,0.92)'; ctx.strokeStyle = tint(c, on ? 0.95 : 0.5); ctx.lineWidth = on ? 3 : 2;
        rounded(ctx, x - CW / 2, y - CH / 2, CW, CH, 14); ctx.fill(); ctx.stroke();
        label(ctx, who, x, y - CH / 2 + 19, { size: 19, weight: 800, fill: c });
        para(ctx, `“${words}”`, x - CW / 2 + 12, y + 2, CW - 24, 18, 'ink', 600, 3);
        label(ctx, src, x, y + CH / 2 - 17, { size: 18, weight: 500, fill: 'muted' });
        ctx.restore();
      });
      ctx.save(); ctx.globalAlpha *= after(t, 4);
      label(ctx, 'One idea, found in many traditions', cx, Y0 + 600, { size: 23, weight: 800, fill: GOLD });
      label(ctx, 'Love, kindness and fairness towards others', cx, Y0 + 636, { size: 19, weight: 500, fill: 'ink' });
      ctx.restore();
      footer(ctx, 'Words shortened or paraphrased from each source');
      ctx.restore();
    },

    // ─── Families of faith and big questions ─────────────────────────────

    // Abraham at the root; Judaism, Christianity and Islam as branches.
    'abrahamic-family'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5, 5.5, 5.5, 6, 6]);
      const RX = cx; const RY = Y0 + 522; const FY = Y0 + 384;
      const NODES = [
        ['Judaism', 'david', SKY, X0 + 150, Y0 + 138, 'about 1800–1000 BCE', 'Tanakh (Torah)'],
        ['Christianity', 'cross', '#9ec5ff', cx, Y0 + 100, 'about 30 CE', 'Bible'],
        ['Islam', 'crescent', JADE, X1 - 150, Y0 + 138, '610 CE', 'Quran'],
      ];
      const C = it._c || (it._c = {
        br: NODES.map(([, , , x, y], j) => mkPath(j === 1 ? qpts(RX, FY, RX + 10, (FY + y + 136) / 2, x, y + 136) : qpts(RX, FY, RX + (x - RX) * 0.3, Y0 + 300, x, y + 136))),
      });
      ctx.save(); fade(ctx, t);
      backdrop(ctx, '#171c48', '#30230f', 0.5);
      title(ctx, it.label || 'The Abrahamic faiths: one family tree');
      // Stars above: the promise of descendants as many as the stars.
      for (let j = 0; j < 30; j++) { const tw = 0.5 + 0.5 * Math.sin(k * 1.7 + j * 2.1); dot(ctx, X0 + 30 + rnd(j + 5) * 740, Y0 + 64 + rnd(j + 9) * 240, 1.2 + tw * 1.3, `rgba(255,240,200,${0.25 + 0.45 * tw})`); }
      // Roots and trunk.
      ctx.strokeStyle = tint(GOLD, 0.45); ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (const dx of [-70, -36, 36, 70]) { ctx.beginPath(); ctx.moveTo(RX, RY - 14); ctx.quadraticCurveTo(RX + dx * 0.5, RY + 10, RX + dx, RY + 30); ctx.stroke(); }
      const tg = ctx.createLinearGradient(RX - 20, 0, RX + 20, 0);
      tg.addColorStop(0, '#8a5a24'); tg.addColorStop(0.5, '#e0b060'); tg.addColorStop(1, '#7a4a1c');
      ctx.fillStyle = tg; poly(ctx, [RX - 22, RY - 10, RX - 12, FY, RX + 12, FY, RX + 22, RY - 10], true); ctx.fill();
      // Branches grow in as each faith is introduced.
      NODES.forEach(([, , c], j) => {
        const g = S.n > 0 || S.i > j + 1 ? 1 : S.i === j + 1 ? smooth(S.s / 1.4) : 0;
        if (g <= 0) return;
        ctx.strokeStyle = '#c8954a'; ctx.lineWidth = 10; ctx.lineCap = 'round'; strokeSpan(ctx, C.br[j], 0, g * C.br[j].total);
        ctx.strokeStyle = tint(c, 0.5); ctx.lineWidth = 3; strokeSpan(ctx, C.br[j], 0, g * C.br[j].total);
        for (let q = 1; q <= 5; q++) { const d = (q / 6) * C.br[j].total; if (d > g * C.br[j].total) break; const p = at(C.br[j], d); const s = q % 2 ? 1 : -1; ctx.fillStyle = tint('#5fbf7a', 0.75 + 0.2 * Math.sin(k * 2 + q + j)); ctx.beginPath(); ctx.ellipse(p.x + s * 10, p.y - 4, 9, 5, s * 0.6, 0, TAU); ctx.fill(); }
      });
      // The root: Abraham, named (never pictured).
      halo(ctx, RX, RY - 2, 120, GOLD, 0.35 + 0.08 * Math.sin(k * 1.5));
      ctx.fillStyle = 'rgba(12,12,30,0.92)'; ctx.strokeStyle = tint(GOLD, 0.95); ctx.lineWidth = 2.5;
      rounded(ctx, RX - 130, RY - 26, 260, 52, 14); ctx.fill(); ctx.stroke();
      label(ctx, 'Abraham (Ibrahim)', RX, RY - 6, { size: 21, weight: 800, fill: GOLD });
      label(ctx, 'trusted in one God', RX, RY + 15, { size: 18, weight: 500, fill: 'muted' });
      // The three faiths.
      NODES.forEach(([nm, sym, c, x, y, date, book], j) => {
        const on = S.n > 0 || S.i >= j + 1; const a = S.n > 0 || S.i > j + 1 ? 1 : S.i === j + 1 ? after(S.s, 1.1, 0.5) : 0;
        if (!on || a <= 0) return;
        ctx.save(); ctx.globalAlpha *= a;
        ctx.fillStyle = 'rgba(10,12,32,0.92)'; ctx.strokeStyle = tint(c, 0.5); ctx.lineWidth = 2;
        rounded(ctx, x - 116, y + 38, 232, 104, 14); ctx.fill(); ctx.stroke();
        medal(ctx, x, y, 40, c, S.i === j + 1 ? 1 : 0.5);
        symbol(ctx, sym, x, y, 26, c, k);
        label(ctx, nm, x, y + 60, { size: 22, weight: 800, fill: c });
        label(ctx, date, x, y + 85, { size: 18, weight: 500, fill: 'muted' });
        chip(ctx, book, x, y + 116, GOLD, 18);
        ctx.restore();
      });
      // Figures the three traditions share.
      const SH = [['Adam', -140, Y0 + 404], ['Noah (Nuh)', 140, Y0 + 404], ['Moses (Musa)', -170, Y0 + 456], ['David (Dawud)', 170, Y0 + 456]];
      const sa = S.i === 4 ? 1 : S.n > 0 ? 0.6 : 0.35;
      SH.forEach(([nm, dx, y], j) => {
        ctx.save(); ctx.globalAlpha *= sa * (S.i === 4 ? after(S.s, 0.3 + j * 0.3) : 1);
        line(ctx, RX + Math.sign(dx) * 16, y + 8, RX + dx * 0.55, y, tint(GOLD, 0.4), 2);
        chip(ctx, nm, RX + dx, y, S.i === 4 ? CREAM : 'muted', 18);
        ctx.restore();
      });
      const CAP = [
        ['Abraham, father of faith', 'Jews, Christians and Muslims all look back to Abraham (Ibrahim in Arabic), who, their scriptures tell, trusted in one God.', GOLD],
        ['Judaism', 'God’s covenant with Abraham, and the Torah given to Moses, are at the heart of Judaism. Its scripture is the Tanakh.', SKY],
        ['Christianity', 'Christianity grew from Judaism about 30 CE. Christians believe Jesus is the Son of God. The Bible includes the Hebrew scriptures.', '#9ec5ff'],
        ['Islam', 'Islam began in 610 CE. Muslims believe the Quran was revealed to the Prophet Muhammad; they honour Abraham, Moses and Jesus as prophets.', JADE],
        ['Shared roots', 'All three believe in one God and share figures such as Adam, Noah, Abraham, Moses and David. Together they are over half the world.', CREAM],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      footer(ctx, 'Monotheistic faiths: belief in one God');
      ctx.restore();
    },

    // Four creation accounts side by side, told in their own terms.
    'creation-stories'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5.5, 5.5, 6, 6]);
      const W = 380; const H = 248;
      const CARDS = [
        ['Genesis', 'Jewish and Christian scripture', 'six days of creation, then a day of rest', '#9ec5ff', X0 + 14, Y0 + 58],
        ['A Hindu picture', 'Hindu traditions', 'an endless cycle of vast ages', SAFF, X0 + 406, Y0 + 58],
        ['A Norse story', 'Old Norse myths, Iceland', 'fire and ice meet in the great void', SKY, X0 + 14, Y0 + 316],
        ['Science', 'how scientists describe it', 'evidence from light, rocks and fossils', JADE, X0 + 406, Y0 + 316],
      ];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Creation stories from around the world');
      CARDS.forEach(([nm, who, line1, c, x, y], i) => {
        const on = S.i === i;
        ctx.save(); ctx.globalAlpha *= after(t, i * 0.2, 0.5) * (on ? 1 : 0.8);
        const g = ctx.createLinearGradient(0, y, 0, y + H);
        g.addColorStop(0, 'rgba(14,16,40,0.95)'); g.addColorStop(1, tint(c, on ? 0.18 : 0.08));
        ctx.fillStyle = g; ctx.strokeStyle = tint(c, on ? 0.95 : 0.45); ctx.lineWidth = on ? 3 : 2;
        rounded(ctx, x, y, W, H, 16); ctx.fill(); ctx.stroke();
        label(ctx, nm, x + 18, y + 26, { size: 21, weight: 800, fill: c, align: 'left' });
        label(ctx, who, x + 18, y + 52, { size: 18, weight: 500, fill: 'muted', align: 'left' });
        const mx = x + W / 2; const my = y + 140;
        if (i === 0) {
          const day = on ? Math.floor(clamp((S.s - 0.3) / 4.6) * 6.99) : 6;
          for (let d = 0; d < 7; d++) {
            const tx = x + 22 + d * 49; const ty = y + 78; const lit = d <= day;
            ctx.fillStyle = lit ? tint(c, d === 6 ? 0.3 : 0.16) : 'rgba(255,255,255,0.04)'; ctx.strokeStyle = tint(c, lit ? 0.8 : 0.25); ctx.lineWidth = 1.5;
            rounded(ctx, tx, ty, 44, 92, 8); ctx.fill(); ctx.stroke();
            const ix = tx + 22; const iy = ty + 34;
            ctx.save(); ctx.globalAlpha *= lit ? 1 : 0.35;
            if (d === 0) { halo(ctx, ix, iy, 20, FLAME, 0.7); dot(ctx, ix, iy, 7, FLAME); }
            else if (d === 1) { ctx.strokeStyle = SKY; ctx.lineWidth = 2.5; for (const dy of [-6, 6]) { ctx.beginPath(); ctx.moveTo(ix - 14, iy + dy); ctx.quadraticCurveTo(ix - 7, iy + dy - 5, ix, iy + dy); ctx.quadraticCurveTo(ix + 7, iy + dy + 5, ix + 14, iy + dy); ctx.stroke(); } }
            else if (d === 2) { ctx.fillStyle = '#5fbf7a'; ctx.beginPath(); ctx.arc(ix, iy + 12, 15, Math.PI, TAU); ctx.fill(); line(ctx, ix, iy - 2, ix, iy - 12, '#7fdf9a', 2.5); ctx.beginPath(); ctx.ellipse(ix + 5, iy - 12, 5, 3, 0.5, 0, TAU); ctx.fill(); }
            else if (d === 3) { dot(ctx, ix - 6, iy + 2, 7, GOLD); symCrescent(ctx, ix + 9, iy - 8, 6, CREAM); dot(ctx, ix + 10, iy + 10, 1.8, CREAM); }
            else if (d === 4) { ctx.strokeStyle = CREAM; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ix - 10, iy - 10); ctx.quadraticCurveTo(ix - 5, iy - 15, ix, iy - 9); ctx.quadraticCurveTo(ix + 5, iy - 15, ix + 10, iy - 10); ctx.stroke(); ctx.fillStyle = SKY; ctx.beginPath(); ctx.ellipse(ix - 2, iy + 8, 8, 4, 0, 0, TAU); ctx.fill(); poly(ctx, [ix + 5, iy + 8, ix + 11, iy + 3, ix + 11, iy + 13], true); ctx.fill(); }
            else if (d === 5) { ctx.fillStyle = SAND; ctx.beginPath(); ctx.ellipse(ix - 4, iy + 4, 9, 5, 0, 0, TAU); ctx.fill(); ctx.fillRect(ix - 11, iy + 6, 2.5, 8); ctx.fillRect(ix + 1, iy + 6, 2.5, 8); ctx.beginPath(); ctx.arc(ix + 7, iy - 1, 3.5, 0, TAU); ctx.fill(); ctx.strokeStyle = CREAM; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ix + 10, iy - 12, 3, 0, TAU); ctx.moveTo(ix + 10, iy - 9); ctx.lineTo(ix + 10, iy + 2); ctx.stroke(); }
            else { halo(ctx, ix, iy, 22, LILAC, 0.6); symCrescent(ctx, ix, iy, 9, LILAC); }
            ctx.restore();
            label(ctx, String(d + 1), ix, ty + 72, { size: 18, weight: 800, fill: lit ? 'ink' : 'muted' });
          }
        } else if (i === 1) {
          const rx = x + 112; const R = 54; const rot = k * 0.5;
          const PH = [['Brahma', 'creates', GOLD], ['Vishnu', 'preserves', SKY], ['Shiva', 'dissolves', LILAC]];
          halo(ctx, rx, my, 90, SAFF, 0.3);
          PH.forEach(([, , pc], j) => { ctx.strokeStyle = pc; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(rx, my, R, -Math.PI / 2 + (j * TAU) / 3 + 0.08, -Math.PI / 2 + ((j + 1) * TAU) / 3 - 0.08); ctx.stroke(); });
          const ph = mod(rot, TAU); const pidx = Math.floor(ph / (TAU / 3));
          const lx = rx + Math.cos(ph - Math.PI / 2) * R; const ly = my + Math.sin(ph - Math.PI / 2) * R;
          halo(ctx, lx, ly, 22, FLAME, 0.9); dot(ctx, lx, ly, 6, CREAM);
          dot(ctx, rx, my, 8, FLAME);
          PH.forEach(([g, verb, pc], j) => {
            const yy = y + 100 + j * 36; const hl = pidx === j;
            rich(ctx, [[g, pc, 800], [` ${verb}`, hl ? 'ink' : 'muted', 600]], x + 196, yy, 19, 600, 'left');
          });
        } else if (i === 2) {
          // Fire, ice, the mist between, and the world tree.
          const fx = x + 70; const ix = x + W - 70;
          for (let j = 0; j < 4; j++) flame(ctx, fx - 24 + j * 16, my + 30, 34 + 14 * Math.sin(k * 2 + j), k, j, 1, 0.25);
          ctx.fillStyle = '#cfe9ff';
          for (let j = 0; j < 4; j++) { const sx2 = ix - 26 + j * 17; poly(ctx, [sx2 - 8, my + 30, sx2, my - 14 - (j % 2) * 14, sx2 + 8, my + 30], true); ctx.fill(); }
          for (let j = 0; j < 6; j++) { const q = mod(k * 0.15 + j / 6, 1); ctx.fillStyle = `rgba(220,230,255,${0.25 * Math.sin(q * Math.PI)})`; ctx.beginPath(); ctx.ellipse(mx + (j - 2.5) * 22, my + 10 - q * 50, 24, 10, 0, 0, TAU); ctx.fill(); }
          const tg = after(on ? S.s : 9, 1.2, 2.5);
          ctx.save(); ctx.globalAlpha *= tg;
          line(ctx, mx, my + 34, mx, my - 30, '#a07040', 6);
          ctx.strokeStyle = '#a07040'; ctx.lineWidth = 3; for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.moveTo(mx, my - 6); ctx.quadraticCurveTo(mx + s2 * 20, my - 20, mx + s2 * 34, my - 26); ctx.stroke(); }
          ctx.fillStyle = tint('#5fbf7a', 0.85); ctx.beginPath(); ctx.ellipse(mx, my - 44, 46, 22, 0, 0, TAU); ctx.fill();
          ctx.restore();
          label(ctx, 'fire', fx, my + 56, { size: 18, weight: 700, fill: SAFF });
          label(ctx, 'ice', ix, my + 56, { size: 18, weight: 700, fill: SKY });
          ctx.save(); ctx.globalAlpha *= tg; label(ctx, 'Yggdrasil', mx, my + 56, { size: 18, weight: 700, fill: '#7fdf9a' }); ctx.restore();
        } else {
          // The Big Bang expanding, and a branching tree of life.
          const bx = x + 96; const ph = mod(k * 0.25, 1);
          halo(ctx, bx, my, 30 + ph * 50, FLAME, 0.5 * (1 - ph));
          for (let j = 0; j < 26; j++) { const a = rnd(j + 3) * TAU; const r = (8 + rnd(j + 4) * 60) * (0.2 + 0.8 * ph); dot(ctx, bx + Math.cos(a) * r, my + Math.sin(a) * r * 0.8, 1.6 + rnd(j) * 1.4, `rgba(255,240,210,${0.9 - ph * 0.5})`); }
          label(ctx, 'Big Bang, 13.8', bx, my + 34, { size: 18, weight: 700, fill: GOLD });
          label(ctx, 'billion years ago', bx, my + 56, { size: 18, weight: 500, fill: 'muted' });
          const tx = x + 276; const ty = my + 30;
          const grow = after(on ? S.s : 9, 0.8, 3);
          const branch = (x0, y0, a, len, d) => {
            if (d > 4 || len < 6) return;
            const x1 = x0 + Math.cos(a) * len * grow; const y1 = y0 + Math.sin(a) * len * grow;
            line(ctx, x0, y0, x1, y1, tint(JADE, 0.5 + d * 0.1), Math.max(1.5, 4 - d * 0.7));
            if (d === 4) dot(ctx, x1, y1, 3, ['#7fdf9a', GOLD, SKY, ROSE][Math.floor(rnd(x1) * 4)]);
            branch(x1, y1, a - 0.45, len * 0.72, d + 1); branch(x1, y1, a + 0.45, len * 0.72, d + 1);
          };
          branch(tx, ty, -Math.PI / 2, 40, 0);
          label(ctx, 'life evolves', tx, my + 52, { size: 18, weight: 700, fill: JADE });
        }
        label(ctx, line1, x + W / 2, y + H - 22, { size: 18, weight: 600, fill: 'ink' });
        ctx.restore();
      });
      const CAP = [
        ['Genesis: told in Jewish and Christian scripture', 'God creates the world in six days, from light to living creatures and people, and rests on the seventh day.', '#9ec5ff'],
        ['A Hindu picture of creation', 'Many Hindus describe endless cycles: Brahma creates, Vishnu preserves, and Shiva dissolves, so that creation can begin again.', SAFF],
        ['A Norse story', 'Old Norse myths tell how fire and ice met in a vast, empty gap, Ginnungagap. The gods shaped the world around the great tree Yggdrasil.', SKY],
        ['How science describes it', 'The universe began expanding about 13.8 billion years ago; Earth formed about 4.5 billion years ago, and life evolved over billions of years.', JADE],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      footer(ctx, 'Different traditions and ways of knowing, side by side');
      ctx.restore();
    },

    // A drop rises from the ocean and returns: Atman and Brahman.
    'upanishad-atman'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5, 6, 6, 6.5]);
      const SEA = Y0 + 402; const DX = X0 + 470;
      ctx.save(); fade(ctx, t);
      ctx.save(); rounded(ctx, X0 + 8, Y0 + 52, FIG.w - 16, 514, 16); ctx.clip();
      const sky = ctx.createLinearGradient(0, Y0 + 52, 0, SEA);
      sky.addColorStop(0, '#1b2156'); sky.addColorStop(0.6, '#6a4a7a'); sky.addColorStop(1, '#f2a65a');
      ctx.fillStyle = sky; ctx.fillRect(X0 + 8, Y0 + 52, FIG.w - 16, SEA - Y0 - 52);
      halo(ctx, X0 + 660, Y0 + 150, 200, GOLD, 0.45);
      dot(ctx, X0 + 660, Y0 + 150, 34, FLAME);
      // Mountains and a river flowing down to the sea.
      ctx.fillStyle = '#3a3358'; poly(ctx, [X0 + 8, SEA, X0 + 8, Y0 + 250, X0 + 90, Y0 + 196, X0 + 170, Y0 + 260, X0 + 240, Y0 + 222, X0 + 330, SEA], true); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; poly(ctx, [X0 + 70, Y0 + 210, X0 + 90, Y0 + 196, X0 + 112, Y0 + 212], true); ctx.fill();
      const river = it._rv || (it._rv = mkPath([...qpts(X0 + 96, Y0 + 222, X0 + 60, Y0 + 320, X0 + 170, Y0 + 340, 14), ...qpts(X0 + 180, Y0 + 345, X0 + 280, Y0 + 360, X0 + 320, SEA, 12)]));
      ctx.strokeStyle = '#4a8ad9'; ctx.lineWidth = 7; ctx.lineCap = 'round'; strokeSpan(ctx, river, 0, river.total);
      ctx.strokeStyle = 'rgba(200,230,255,0.75)'; ctx.lineWidth = 3; ctx.setLineDash([10, 16]); ctx.lineDashOffset = -k * 30; strokeSpan(ctx, river, 0, river.total); ctx.setLineDash([]); ctx.lineDashOffset = 0;
      // The ocean.
      const sg = ctx.createLinearGradient(0, SEA, 0, Y0 + 566);
      sg.addColorStop(0, '#2a6aa8'); sg.addColorStop(1, '#0e2448');
      ctx.fillStyle = sg; ctx.fillRect(X0 + 8, SEA, FIG.w - 16, Y0 + 566 - SEA);
      const og = S.i === 0 ? 0.35 + 0.1 * Math.sin(k * 2) : 0.18;
      halo(ctx, cx, SEA + 70, 360, GOLD, og);
      ctx.strokeStyle = 'rgba(255,230,180,0.35)'; ctx.lineWidth = 2;
      for (let j = 0; j < 14; j++) { const yy = SEA + 8 + j * 9; const w = (30 - j * 1.5) * (0.6 + 0.4 * Math.sin(k * 3 + j * 1.3)); ctx.fillStyle = `rgba(255,220,150,${0.55 - j * 0.03})`; ctx.fillRect(X0 + 660 - w / 2 + Math.sin(k + j) * 4, yy, w, 2.5); }
      for (let r = 0; r < 3; r++) { const y = SEA + 16 + r * 26; ctx.beginPath(); for (let x = X0 + 8; x <= X1 - 8; x += 16) { const yy = y + Math.sin(x * 0.03 + k * 1.4 + r) * 4; if (x === X0 + 8) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); } ctx.stroke(); }
      // The drop: rises (stage 1), hovers, falls back and merges (stage 2).
      let dy = null; let ripple = -1;
      if (S.i === 1) dy = lerp(SEA - 6, Y0 + 222, smooth(S.s / 2.2)) + Math.sin(k * 2) * 4 * smooth((S.s - 2.2) / 0.5);
      else if (S.i === 2) { const f = smooth(S.s / 2.2); dy = lerp(Y0 + 222, SEA + 4, f * f); if (S.s > 2.2) { dy = null; ripple = S.s - 2.2; } }
      if (dy !== null) {
        const r = 22;
        halo(ctx, DX, dy, 70, SKY, 0.55);
        const dg = ctx.createRadialGradient(DX - 7, dy - 6, 2, DX, dy, r * 1.4);
        dg.addColorStop(0, '#e6f6ff'); dg.addColorStop(1, '#4aa3ff');
        ctx.fillStyle = dg; ctx.beginPath(); ctx.moveTo(DX, dy - r * 1.7);
        ctx.bezierCurveTo(DX + r * 0.5, dy - r, DX + r, dy - r * 0.3, DX + r, dy + r * 0.15); ctx.arc(DX, dy + r * 0.15, r, 0, Math.PI); ctx.bezierCurveTo(DX - r, dy - r * 0.3, DX - r * 0.5, dy - r, DX, dy - r * 1.7); ctx.fill();
        dot(ctx, DX - 8, dy - 4, 4, 'rgba(255,255,255,0.85)');
        if (S.i === 1) { ctx.save(); ctx.globalAlpha *= after(S.s, 2); label(ctx, 'Atman', DX + 44, dy - 12, { size: 22, weight: 800, fill: CREAM, align: 'left' }); label(ctx, 'the self in each being', DX + 44, dy + 14, { size: 18, weight: 600, fill: 'ink', align: 'left' }); ctx.restore(); }
      }
      if (ripple >= 0) for (let j = 0; j < 3; j++) { const rr = (ripple * 50 + j * 24) % 130; ctx.strokeStyle = `rgba(230,246,255,${0.7 * (1 - rr / 130)})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(DX, SEA + 6, rr, rr * 0.25, 0, 0, TAU); ctx.stroke(); }
      ctx.restore();
      title(ctx, it.label || 'Atman and Brahman: the Upanishads');
      label(ctx, 'Brahman', cx, SEA + 100, { size: 24, weight: 800, fill: GOLD });
      label(ctx, 'the one ultimate reality', cx, SEA + 128, { size: 19, weight: 600, fill: 'ink' });
      if (S.i === 2) { ctx.save(); ctx.globalAlpha *= after(S.s, 0.5); chip(ctx, 'rivers lose their names in the sea', X0 + 336, SEA - 30, SKY, 18, 'left'); ctx.restore(); }
      if (S.i === 3) {
        ctx.save(); ctx.globalAlpha *= after(S.s, 0.3, 0.6);
        ctx.fillStyle = 'rgba(10,12,32,0.82)'; ctx.strokeStyle = tint(GOLD, 0.8); ctx.lineWidth = 2;
        rounded(ctx, X0 + 300, Y0 + 84, 270, 128, 16); ctx.fill(); ctx.stroke();
        label(ctx, 'Tat tvam asi', X0 + 435, Y0 + 118, { size: 28, weight: 800, fill: GOLD });
        label(ctx, '“You are that”', X0 + 435, Y0 + 154, { size: 21, weight: 700, fill: CREAM });
        label(ctx, 'Chandogya Upanishad', X0 + 435, Y0 + 188, { size: 18, weight: 500, fill: 'muted' });
        ctx.restore();
      }
      const CAP = [
        ['Brahman: the ocean', 'The Upanishads speak of Brahman: the one ultimate reality behind and within everything, like a boundless ocean.', GOLD],
        ['Atman: the drop', 'Atman is the true self in every living being. Like a drop lifted from the sea, it can seem separate and alone.', SKY],
        ['Rivers into the sea', 'The Chandogya Upanishad says rivers flowing into the sea lose their separate names. So Atman is not apart from Brahman.', SKY],
        ['“Tat tvam asi”: You are that', 'The sage Uddalaka teaches his son Shvetaketu that the self within him is one with ultimate reality: “You are that.”', GOLD],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      footer(ctx, 'Hindu schools explain the link between Atman and Brahman in different ways');
      ctx.restore();
    },

    // Water flowing round rocks; soft wears away hard; wu wei.
    'tao-water'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5.5, 6, 6.5, 6]);
      const RT = Y0 + 300; const RB = Y0 + 480; const RM = (RT + RB) / 2;
      const ROCKS = [[X0 + 280, Y0 + 384, 44], [X0 + 575, Y0 + 400, 38]];
      // Erosion: the rocks start jagged and are worn smooth in stage 2.
      const jag = S.i < 2 ? 1 : S.i === 2 ? 1 - smooth((S.s - 0.5) / 5) : 0;
      // Where a stream line that is h away from a rock's centre passes at dx.
      const solve = (dx, h, R) => {
        const s = h < 0 ? -1 : 1; const a = Math.abs(h) + 0.5;
        let lo = Math.max(a, Math.sqrt(Math.max(0, R * R - dx * dx))); let hi = a + R;
        for (let n = 0; n < 14; n++) { const m = (lo + hi) / 2; const f = m * (1 - (R * R) / (dx * dx + m * m)) - a; if (f > 0) hi = m; else lo = m; }
        return s * (lo + hi) / 2;
      };
      const flowY = (x, lane) => { let y = lane; for (const [rx, ry, R0] of ROCKS) { const R = R0 * (1 - 0.1 * (1 - jag)) + 6; const dx = x - rx; if (Math.abs(dx) < R * 4) y += solve(dx, lane - ry, R) - (lane - ry); } return y; };
      ctx.save(); fade(ctx, t);
      ctx.save(); rounded(ctx, X0 + 8, Y0 + 52, FIG.w - 16, 514, 16); ctx.clip();
      const sky = ctx.createLinearGradient(0, Y0 + 52, 0, RT);
      sky.addColorStop(0, '#1c2350'); sky.addColorStop(1, '#4a5a7a');
      ctx.fillStyle = sky; ctx.fillRect(X0 + 8, Y0 + 52, FIG.w - 16, RT - Y0 - 52);
      halo(ctx, X0 + 640, Y0 + 120, 150, CREAM, 0.25); dot(ctx, X0 + 640, Y0 + 120, 26, '#fff2d6');
      // Misty mountains, far to near.
      [[0.35, Y0 + 230, '#5a6a8a'], [0.55, Y0 + 262, '#3f4d6e'], [0.8, Y0 + 290, '#2c3854']].forEach(([a, base, c], j) => {
        ctx.fillStyle = tint(c, a + 0.2); ctx.beginPath(); ctx.moveTo(X0 + 8, RT + 4);
        for (let x = 0; x <= 800; x += 20) { const h = 40 + 60 * Math.abs(Math.sin(x * 0.011 + j * 1.7)) + 20 * Math.sin(x * 0.037 + j); ctx.lineTo(X0 + x, base - h + 40); }
        ctx.lineTo(X1, RT + 4); ctx.closePath(); ctx.fill();
      });
      // Banks and the stream.
      ctx.fillStyle = '#2a3a2a'; ctx.fillRect(X0 + 8, RT - 6, FIG.w - 16, Y0 + 566 - RT + 6);
      const wg = ctx.createLinearGradient(0, RT, 0, RB);
      wg.addColorStop(0, '#2f6fa8'); wg.addColorStop(0.5, '#3f8fc8'); wg.addColorStop(1, '#2a5f98');
      ctx.fillStyle = wg; ctx.beginPath(); ctx.moveTo(X0 + 8, RT + 6);
      for (let x = 0; x <= 800; x += 20) ctx.lineTo(X0 + x, RT + 6 + Math.sin(x * 0.02) * 6);
      for (let x = 800; x >= 0; x -= 20) ctx.lineTo(X0 + x, RB + Math.sin(x * 0.017 + 1) * 6);
      ctx.closePath(); ctx.fill();
      // Reeds and pebbles on the near bank.
      ctx.lineCap = 'round';
      for (let j = 0; j < 16; j++) {
        const x = X0 + 470 + j * 18 + rnd(j + 70) * 8; const base = Y0 + 552; const h = 34 + rnd(j + 80) * 30; const sw = Math.sin(k * 1.3 + j * 0.7) * 6;
        ctx.strokeStyle = j % 3 ? '#4f7a4a' : '#6a9a5a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + sw * 0.3, base - h * 0.6, x + sw, base - h); ctx.stroke();
        if (j % 4 === 1) { ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.ellipse(x + sw, base - h - 6, 3, 8, sw * 0.03, 0, TAU); ctx.fill(); }
      }
      for (let j = 0; j < 7; j++) { ctx.fillStyle = `rgba(160,150,140,${0.35 + 0.2 * rnd(j + 90)})`; ctx.beginPath(); ctx.ellipse(X0 + 220 + j * 34 + rnd(j + 91) * 14, Y0 + 520 + rnd(j + 92) * 30, 8 + rnd(j + 93) * 6, 4 + rnd(j + 94) * 3, 0, 0, TAU); ctx.fill(); }
      // Flow lines bending round the rocks.
      for (let j = 0; j < 64; j++) {
        const lane = RM + ((j % 16) / 15 - 0.5) * 156 + (rnd(j) - 0.5) * 6;
        const sp = 60 + rnd(j + 1) * 40; const x = X0 + 8 + mod(k * sp + rnd(j + 2) * 800, 800);
        const x0 = x - 18;
        if (x0 < X0 + 10) continue;
        const y1 = flowY(x, lane); const y0 = flowY(x0, lane);
        ctx.strokeStyle = `rgba(220,240,255,${0.25 + 0.35 * rnd(j + 3)})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y1); ctx.stroke();
      }
      // The rocks.
      ROCKS.forEach(([rx, ry, R0], j) => {
        const R = R0 * (1 - 0.1 * (1 - jag));
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(rx + 4, ry + R * 0.55, R * 1.05, R * 0.35, 0, 0, TAU); ctx.fill();
        const rg = ctx.createRadialGradient(rx - R * 0.4, ry - R * 0.4, 2, rx, ry, R * 1.2);
        rg.addColorStop(0, '#a8a29a'); rg.addColorStop(1, '#4a4642');
        ctx.fillStyle = rg; ctx.beginPath();
        for (let q = 0; q <= 18; q++) { const a = (q / 18) * TAU; const rr = R * (1 + jag * 0.2 * (rnd(q % 18 + j * 31) - 0.5)); const px = rx + Math.cos(a) * rr; const py = ry + Math.sin(a) * rr * 0.8; if (q) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(230,246,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(rx - R * 0.9, ry, 6, R * 0.6, 0, -Math.PI / 2, Math.PI / 2, true); ctx.stroke();
      });
      ctx.restore();
      title(ctx, it.label || 'The Tao: be like water');
      chip(ctx, 'hard rock', ROCKS[0][0], RT - 24, '#c9c1ae', 18);
      chip(ctx, 'soft water', X0 + 110, RB + 34, SKY, 18);
      ctx.save(); ctx.globalAlpha *= after(S.s, 0.3, 0.5) * S.lf;
      if (S.i === 0) {
        label(ctx, 'The Tao: the Way', X0 + 300, Y0 + 104, { size: 26, weight: 800, fill: CREAM });
        label(ctx, 'the natural flow of all things', X0 + 300, Y0 + 140, { size: 20, weight: 600, fill: 'ink' });
        label(ctx, 'Tao Te Ching · 81 short chapters', X0 + 300, Y0 + 176, { size: 18, weight: 500, fill: 'muted' });
      } else if (S.i === 1) {
        label(ctx, 'Wu wei', X0 + 300, Y0 + 108, { size: 28, weight: 800, fill: SKY });
        label(ctx, 'acting without forcing', X0 + 300, Y0 + 146, { size: 21, weight: 600, fill: 'ink' });
        label(ctx, 'Water does not fight the rock. It flows round.', X0 + 300, Y0 + 182, { size: 18, weight: 500, fill: 'muted' });
      } else if (S.i === 2) {
        para(ctx, '“Nothing is softer than water, yet nothing is better at wearing away the hard.”', X0 + 60, Y0 + 124, 480, 22, CREAM, 700, 3);
        label(ctx, 'chapter 78, paraphrased', X0 + 300, Y0 + 196, { size: 18, weight: 500, fill: 'muted' });
      } else {
        para(ctx, '“The highest good is like water: it helps all things and does not compete.”', X0 + 60, Y0 + 124, 480, 22, CREAM, 700, 3);
        label(ctx, 'chapter 8, paraphrased', X0 + 300, Y0 + 196, { size: 18, weight: 500, fill: 'muted' });
      }
      ctx.restore();
      const CAP = [
        ['The Tao: the Way', 'Taoists speak of the Tao, the Way: the natural flow of all things. The Tao Te Ching, 81 short chapters, is said to be by Laozi.', CREAM],
        ['Wu wei: not forcing', 'Water does not fight the rock; it flows around it. Wu wei means acting naturally, without forcing or struggling.', SKY],
        ['Soft overcomes hard', 'Over time, soft water wears hard rock smooth. The gentle can be stronger than the forceful.', SKY],
        ['Like water', 'Water helps every living thing, settles in low places and does not compete: a picture of a humble, good life.', CREAM],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      footer(ctx, 'Tao Te Ching, traditionally by Laozi, about 2,500 years ago');
      ctx.restore();
    },

    // ─── How the scriptures are arranged ─────────────────────────────────

    // 114 surahs as bars, Meccan and Medinan; revealed over about 23 years.
    'quran-structure'(b, ctx, it, t) {
      const k = b.clock;
      const V = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6];
      const MED = new Set([2, 3, 4, 5, 8, 9, 13, 22, 24, 33, 47, 48, 49, 55, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 76, 98, 99, 110]);
      const S = stages(t, [5, 5, 5.5, 6.5, 6]);
      const BX = X0 + 40; const BW = (FIG.w - 70) / 114; const BASE = Y0 + 420; const HS = 270 / 286;
      const bx = (n) => BX + (n - 1) * BW + BW / 2;
      ctx.save(); fade(ctx, t);
      backdrop(ctx, '#151c48', '#22301f', 0.5);
      title(ctx, it.label || 'How the Quran is arranged');
      ctx.save(); ctx.globalAlpha *= 0.06; ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5;
      for (let gx = 0; gx < 7; gx++) for (let gy = 0; gy < 3; gy++) { const x = X0 + 80 + gx * 108; const y = Y0 + 110 + gy * 108; ctx.strokeRect(x - 22, y - 22, 44, 44); ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.strokeRect(-22, -22, 44, 44); ctx.restore(); }
      ctx.restore();
      const colour = S.i === 3 ? 1 : 0.55;
      V.forEach((v, j) => {
        const n = j + 1; const grow = S.n > 0 ? 1 : after(t, 0.5 + j * 0.022, 0.5);
        const h = Math.max(2, v * HS * grow); const x = bx(n);
        const med = MED.has(n); const c = med ? JADE : GOLD;
        const hl = (S.i === 1 && n === 1) || (S.i === 2 && n === 2) || (S.i === 4 && n === 96);
        if (hl) halo(ctx, x, BASE - h - 6, 40, FLAME, 0.8);
        ctx.fillStyle = hl ? FLAME : tint(c, colour * (S.i === 3 ? 1 : 0.9));
        ctx.fillRect(x - BW * 0.4, BASE - h, BW * 0.8, h);
      });
      line(ctx, BX - 4, BASE + 1, X1 - 26, BASE + 1, 'rgba(255,230,180,0.6)', 2);
      label(ctx, 'surah 1', BX - 4, BASE + 20, { size: 18, weight: 600, fill: 'muted', align: 'left' });
      label(ctx, 'surah 114', X1 - 26, BASE + 20, { size: 18, weight: 600, fill: 'muted', align: 'right' });
      label(ctx, 'bar height = number of verses', cx + 40, BASE + 20, { size: 18, weight: 500, fill: 'muted' });
      // The big facts, in the open space at the top right.
      label(ctx, '114 surahs · 6,236 verses', X1 - 30, Y0 + 96, { size: 24, weight: 800, fill: CREAM, align: 'right' });
      chip(ctx, 'Meccan: 86', X1 - 230, Y0 + 140, GOLD, 18);
      chip(ctx, 'Medinan: 28', X1 - 90, Y0 + 140, JADE, 18);
      ctx.save(); ctx.globalAlpha *= after(S.s, 0.4) * S.lf;
      if (S.i === 1) { arrow(ctx, bx(1) + 40, BASE - 60, bx(1) + 6, BASE - 16, FLAME, 3); chip(ctx, 'Al-Fatiha, “The Opening”: 7 verses', bx(1) + 40, BASE - 72, FLAME, 19, 'left'); }
      if (S.i === 2) label(ctx, 'Al-Baqarah (2): 286 verses, the longest', bx(2) + 12, Y0 + 136, { size: 19, weight: 800, fill: FLAME, align: 'left' });
      if (S.i === 2 || S.i === 3) { label(ctx, 'short surahs, e.g. Al-Ikhlas (112): 4 verses', X1 - 30, Y0 + 344, { size: 18, weight: 700, fill: CREAM, align: 'right' }); arrow(ctx, bx(112) - 10, Y0 + 358, bx(112), BASE - 14, tint(CREAM, 0.7), 2.5); }
      if (S.i === 4) { arrow(ctx, bx(96), Y0 + 300, bx(96), BASE - 30, FLAME, 3); chip(ctx, 'Surah 96, Al-Alaq: the first verses revealed', bx(96) + 24, Y0 + 284, FLAME, 19, 'right'); }
      ctx.restore();
      // Revealed over about 23 years.
      const TL = X0 + 60; const TR = X1 - 60; const tx = (yr) => TL + ((yr - 610) / 22) * (TR - TL);
      label(ctx, 'Revealed over about 23 years (610–632 CE)', cx, Y0 + 476, { size: 19, weight: 700, fill: S.i === 3 ? CREAM : 'ink' });
      ctx.save(); ctx.globalAlpha *= S.i === 3 ? 1 : 0.75;
      ctx.fillStyle = tint(GOLD, 0.85); rounded(ctx, TL, Y0 + 496, tx(622) - TL - 2, 30, 8); ctx.fill();
      ctx.fillStyle = tint(JADE, 0.85); rounded(ctx, tx(622) + 2, Y0 + 496, TR - tx(622) - 2, 30, 8); ctx.fill();
      label(ctx, 'Mecca 610–622', (TL + tx(622)) / 2, Y0 + 512, { size: 18, weight: 800, fill: DARK });
      label(ctx, 'Medina 622–632', (tx(622) + TR) / 2, Y0 + 512, { size: 18, weight: 800, fill: DARK });
      label(ctx, '622: the Hijra', tx(622), Y0 + 546, { size: 18, weight: 600, fill: 'muted' });
      ctx.restore();
      const CAP = [
        ['114 surahs', 'The Quran has 114 surahs (chapters) and 6,236 verses (ayat) in the most common count. Each bar here is one surah.', CREAM],
        ['Al-Fatiha comes first', '“The Opening” has just 7 verses. Muslims recite it in every unit (rakah) of their daily prayers.', FLAME],
        ['Then, roughly, longest to shortest', 'After Al-Fatiha, surahs run roughly from long to short. Al-Baqarah, the second, is the longest, with 286 verses.', FLAME],
        ['Meccan and Medinan', 'Muslims believe it was revealed to the Prophet Muhammad in Mecca, then in Medina, over about 23 years. Most short surahs are Meccan.', JADE],
        ['Not in the order of revelation', 'Muslims believe the first verses revealed were the opening of Surah 96, Al-Alaq (“Read!”), in a cave near Mecca.', FLAME],
      ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      footer(ctx, 'Meccan or Medinan as marked in the standard Cairo edition; scholars differ on a few');
      ctx.restore();
    },

    // The Bible as a library: Old and New Testament shelves by section.
    'bible-library'(b, ctx, it, t) {
      const k = b.clock;
      const S = stages(t, [5, 7, 6.5, 6.5]);
      const OT = [['Law', 5, '#c8742a', 'Genesis to Deuteronomy'], ['History', 12, '#3d7bd9', 'Joshua to Esther'], ['Wisdom and Poetry', 5, '#9a5ad9', 'Job to Song of Songs'], ['Prophets', 17, '#2f9a7a', 'Isaiah to Malachi']];
      const NT = [['Gospels', 4, '#d4a12a', 'Matthew, Mark, Luke, John'], ['Acts', 1, '#e06a4a', 'the first Christians'], ['Letters', 21, '#4a8ad9', 'Romans to Jude'], ['Revelation', 1, '#a33b6b', 'a vision of the future']];
      const gi = (groups, f) => Math.min(groups.length - 1, Math.floor(f * groups.length));
      const otHi = S.i === 1 ? gi(OT, clamp((S.s - 0.4) / 6.2)) : -1;
      const ntHi = S.i === 2 ? gi(NT, clamp((S.s - 0.4) / 5.8)) : -1;
      ctx.save(); fade(ctx, t);
      backdrop(ctx, '#1a1e48', '#3a2616', 0.5);
      title(ctx, it.label || 'The Bible: a library of books');
      halo(ctx, cx, Y0 + 260, 420, GOLD, 0.12);
      const shelf = (groups, x0, h, sw, plank, hi, idx0, row2) => {
        let x = x0; let n = 0;
        groups.forEach(([nm, cnt, c], g) => {
          const gx0 = x; const on = hi === g;
          for (let j = 0; j < cnt; j++) {
            const hh = h * (0.84 + 0.16 * rnd(idx0 + n)); const a = after(t, 0.3 + (idx0 + n) * 0.025, 0.4);
            ctx.save(); ctx.globalAlpha *= a * (hi >= 0 && !on ? 0.5 : 1);
            const y = plank - hh - (on ? 6 : 0);
            const gg = ctx.createLinearGradient(x, 0, x + sw, 0);
            gg.addColorStop(0, tint(c, 0.75)); gg.addColorStop(0.5, color(c)); gg.addColorStop(1, tint(c, 0.6));
            ctx.fillStyle = gg; ctx.fillRect(x, y, sw - 1.5, hh);
            ctx.fillStyle = tint(GOLD, 0.8); ctx.fillRect(x + 2, y + 8, sw - 5.5, 2); ctx.fillRect(x + 2, y + hh - 12, sw - 5.5, 2);
            ctx.restore();
            x += sw; n++;
          }
          const mid = (gx0 + x) / 2; const second = row2.includes(g);
          ctx.save(); ctx.globalAlpha *= hi >= 0 && !on ? 0.6 : 1;
          if (on) halo(ctx, mid, plank - h / 2, Math.max(60, (x - gx0) * 0.7), c, 0.35);
          label(ctx, `${nm} ${cnt}`, mid, plank + (second ? 46 : 22), { size: 18, weight: 800, fill: on ? 'ink' : c });
          ctx.restore();
          x += 12;
        });
        ctx.fillStyle = '#8a5a34'; ctx.fillRect(x0 - 14, plank, x - x0 + 16, 8);
        return x;
      };
      label(ctx, 'Old Testament · 39 books', X0 + 40, Y0 + 82, { size: 21, weight: 800, fill: GOLD, align: 'left' });
      label(ctx, 'Hebrew (some Aramaic)', X1 - 30, Y0 + 82, { size: 18, weight: 500, fill: 'muted', align: 'right' });
      shelf(OT, X0 + 64, 124, 16, Y0 + 236, otHi, 0, [2]);
      label(ctx, 'New Testament · 27 books', X0 + 40, Y0 + 324, { size: 21, weight: 800, fill: '#9ec5ff', align: 'left' });
      label(ctx, 'Greek', X1 - 30, Y0 + 324, { size: 18, weight: 500, fill: 'muted', align: 'right' });
      shelf(NT, X0 + 94, 104, 21, Y0 + 452, ntHi, 39, [1, 3]);
      // The sum.
      ctx.save(); ctx.globalAlpha *= S.i === 3 ? 1 : 0.7;
      rich(ctx, [['39', GOLD, 800], [' + ', 'ink', 600], ['27', '#9ec5ff', 800], [' = ', 'ink', 600], ['66 books', CREAM, 800]], cx, Y0 + 540, S.i === 3 ? 26 : 22, 800);
      ctx.restore();
      const CAP = S.i === 1 ? [`Old Testament: ${OT[otHi][0]} (${OT[otHi][1]})`, `${OT[otHi][3]}. Jews read these same books as the Tanakh, counted as 24 and ordered differently.`, OT[otHi][2]]
        : S.i === 2 ? [`New Testament: ${NT[ntHi][0]} (${NT[ntHi][1]})`, `${NT[ntHi][3]}. The New Testament tells of Jesus and the first Christians.`, NT[ntHi][2]]
          : [
            ['A library, not one book', 'The Bible is a collection of books written by many authors over more than a thousand years.', GOLD],
            null, null,
            ['39 + 27 = 66', 'Protestant Bibles have 66 books. Catholic Bibles have 73, with 7 more in the Old Testament; Orthodox Bibles have a few more.', CREAM],
          ][S.i];
      caption(ctx, CAP[0], CAP[1], CAP[2], S.s);
      footer(ctx, 'The order and number of books differ between traditions');
      ctx.restore();
    },

    // @@SIMS
  };
}
