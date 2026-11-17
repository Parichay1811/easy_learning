// Simulations for music, art, writing and film, for students about 8 to 18:
// the treble stave and note values, the orchestra, chords on a keyboard and
// tempo; the colour wheel, one-point perspective, art movements and the
// golden ratio; sentence building, punctuation, figurative language, PEEL
// paragraphs, metre and haiku, the hero's journey and Shakespeare's Globe;
// flipbook animation at 24 frames per second and the camera's exposure
// triangle. Each is a function of time (t since it appeared, b.clock for the
// loop), so any moment can be drawn: plain canvas calls, almost no glow, no
// state between frames beyond constants cached on the item. ARTS_SIMS says
// what each one is for, so a lesson's words can pick the right picture.

export const ARTS_SIMS = {
  // Music
  'music-staff': { title: 'Notes on the treble stave', keywords: ['treble clef', 'treble stave', 'musical staff', 'reading sheet music', 'every good boy deserves', 'notes on the stave', 'lines and spaces of the stave', 'reading music notes'], example: { melody: 'E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4 D4 D4' } },
  'note-values': { title: 'Note values in a 4/4 bar', keywords: ['note values', 'whole note', 'half note', 'quarter note', 'eighth note', 'crotchet and quaver', 'minim and semibreve', 'how many beats is a note'], example: {} },
  'orchestra-seating': { title: 'Where the orchestra sits', keywords: ['orchestra seating', 'sections of the orchestra', 'instrument families', 'families of the orchestra', 'string section', 'woodwind section', 'brass section', 'percussion section'], example: {} },
  'piano-chords': { title: 'Major and minor chords', keywords: ['major chord', 'minor chord', 'c major chord', 'major and minor', 'triad chord', 'piano chords', 'major third', 'minor third'], example: {} },
  'rhythm-beats': { title: 'Tempo and beats per minute', keywords: ['beats per minute', 'tempo in music', 'metronome', 'drum beat pattern', 'keeping the beat', 'largo and presto', 'steady beat', 'fast and slow tempo'], example: {} },
  // Art
  'colour-wheel': { title: 'The colour wheel', keywords: ['colour wheel', 'color wheel', 'complementary colours', 'complementary colors', 'tertiary colours', 'warm and cool colours', 'secondary colours on the wheel', 'colour theory'], example: {} },
  'perspective-drawing': { title: 'One-point perspective', keywords: ['one-point perspective', 'one point perspective', 'vanishing point', 'horizon line', 'perspective drawing', 'orthogonal lines', 'drawing in perspective', 'linear perspective'], example: {} },
  'art-movements': { title: 'Art movements through time', keywords: ['art movements', 'art history timeline', 'renaissance art', 'baroque art', 'impressionism', 'cubism', 'surrealism', 'pop art'], example: {} },
  'golden-ratio': { title: 'The golden ratio', keywords: ['golden ratio', 'golden rectangle', 'golden spiral', 'fibonacci spiral', 'divine proportion', '1.618', 'golden angle', 'fibonacci in nature'], example: {} },
  // Writing
  'sentence-builder': { title: 'Building a sentence', keywords: ['subject verb object', 'building a sentence', 'sentence structure', 'simple sentence', 'parts of a sentence', 'expanded noun phrase', 'adding an adverb', 'what makes a sentence'], example: { subject: 'The dog', verb: 'chased', object: 'the ball', adjective: 'happy', adverb: 'quickly' } },
  'punctuation-marks': { title: 'Punctuation marks', keywords: ['punctuation marks', 'full stop', 'question mark', 'exclamation mark', 'using commas', 'apostrophe for possession', 'speech marks', 'inverted commas'], example: {} },
  'figurative-language': { title: 'Figurative language', keywords: ['figurative language', 'simile and metaphor', 'personification', 'alliteration', 'onomatopoeia', 'literary devices', 'figures of speech'], example: {} },
  'peel-paragraph': { title: 'A PEEL paragraph', keywords: ['peel paragraph', 'point evidence explain link', 'point evidence explanation', 'pee paragraph', 'paragraph structure', 'analytical paragraph', 'essay paragraph'], example: { items: ['Schools should have more PE lessons.', 'Doctors say children need about 60 minutes of exercise every day.', 'Extra PE would help pupils reach that, so they stay healthy and focused.', 'So more PE lessons would make pupils fitter and better learners.'] } },
  'poetry-rhythm': { title: 'Rhythm in poetry', keywords: ['iambic pentameter', 'syllable count', 'haiku 5-7-5', 'stressed and unstressed syllables', 'metre in poetry', 'meter in poetry', 'shall i compare thee', 'rhythm of a poem'], example: {} },
  'hero-journey': { title: "The hero's journey", keywords: ["hero's journey", 'heros journey', 'joseph campbell', 'call to adventure', 'the monomyth', 'story archetype', 'meeting the mentor', 'crossing the threshold'], example: {} },
  'globe-theatre': { title: "Shakespeare's Globe", keywords: ['globe theatre', 'the globe theatre', "shakespeare's globe", 'elizabethan theatre', 'groundlings', 'thrust stage', 'shakespeare theatre', 'wooden o'], example: {} },
  // Film and photography
  'animation-frames': { title: 'Frames per second', keywords: ['frames per second', '24 frames per second', 'flipbook animation', 'how animation works', 'frame rate', 'stop motion animation', 'persistence of vision'], example: {} },
  'camera-exposure': { title: 'The exposure triangle', keywords: ['exposure triangle', 'aperture and shutter speed', 'shutter speed', 'camera aperture', 'iso setting', 'depth of field', 'f-stop', 'motion blur'], example: {} },
};

export function artsSims(kit) {
  // eslint-disable-next-line no-unused-vars
  const { FIG, COLORS, FONT, glow, label, rounded, arrow, clamp, easeOut, outBack, color, tint } = kit;
  const X0 = FIG.x; const Y0 = FIG.y; const X1 = FIG.x + FIG.w; const Y1 = FIG.y + FIG.h;
  const cx = X0 + FIG.w / 2;
  const TAU = Math.PI * 2; const PI = Math.PI;
  const INK = '#e9eeff'; const DARK = '#0b1024';

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
  const hex = (c) => { const h = color(c); return /^#[0-9a-f]{6}$/i.test(h) ? h : '#e9eeff'; };
  const mix = (a, c, p) => { const A = parseInt(hex(a).slice(1), 16); const B = parseInt(hex(c).slice(1), 16); const ch = (s) => Math.round(lerp((A >> s) & 255, (B >> s) & 255, clamp(p))); return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`; };
  const str = (v, d) => (typeof v === 'string' && v.trim() ? v.trim() : d);
  const strs = (v, d) => (Array.isArray(v) && v.length ? v.map(String) : typeof v === 'string' && v.trim() ? v.split(/\s*[;\n|]\s*/).filter(Boolean) : d);

  // Drawing helpers.
  const title = (ctx, text) => label(ctx, String(text), cx, Y0 + 28, { size: 26, weight: 700, fill: 'ink' });
  const tw = (ctx, text, size, weight = 600) => { ctx.font = `${weight} ${size}px ${FONT}`; return ctx.measureText(String(text)).width; };
  function chip(ctx, text, x, y, c = 'ink', size = 21, align = 'center') {
    text = String(text);
    ctx.font = `700 ${size}px ${FONT}`;
    const w = ctx.measureText(text).width + 26; const h = size + 15;
    const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.fillStyle = 'rgba(5,8,22,0.82)'; ctx.strokeStyle = tint(c, 0.6); ctx.lineWidth = 2;
    rounded(ctx, left, y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
    label(ctx, text, left + w / 2, y + 1, { size, weight: 700, fill: c });
    return w;
  }
  function panel(ctx, x, y, w, h, c = 'blue', a = 0.08, r = 16, lw = 2) {
    ctx.fillStyle = tint(c, a); ctx.strokeStyle = tint(c, 0.6); ctx.lineWidth = lw;
    rounded(ctx, x, y, w, h, r); ctx.fill(); ctx.stroke();
  }
  function line(ctx, x0, y0, x1, y1, c = INK, w = 3, dash) {
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
  function arr(ctx, x0, y0, x1, y1, c, w = 4) { if (Math.hypot(x1 - x0, y1 - y0) > 4) arrow(ctx, x0, y0, x1, y1, c, w); }
  // Text wrapped to maxW (x is the left edge), up to `lines` lines, centred on y.
  function para(ctx, text, x, y, maxW, size = 20, fill = 'ink', weight = 500, lines = 3, align = 'center') {
    ctx.font = `${weight} ${size}px ${FONT}`;
    const out = []; let cur = '';
    for (const w of String(text).split(/\s+/)) { const test = cur ? `${cur} ${w}` : w; if (cur && ctx.measureText(test).width > maxW) { out.push(cur); cur = w; } else cur = test; }
    if (cur) out.push(cur);
    if (out.length > lines) { out.length = lines; out[lines - 1] = `${out[lines - 1].replace(/\s+\S*$/, '')}…`; }
    const lh = size * 1.28;
    out.forEach((l, i) => label(ctx, l, align === 'center' ? x + maxW / 2 : x, y + (i - (out.length - 1) / 2) * lh, { size, weight, fill, align }));
    return out.length;
  }
  // A row of words, centred on x, each word drawn with its own colour: [[text, colour, weight]].
  function words(ctx, parts, x, y, size = 22, gap = 0) {
    const ws = parts.map(([s, , wt]) => tw(ctx, s, size, wt || 600));
    let left = x - (ws.reduce((a, c) => a + c, 0) + gap * (parts.length - 1)) / 2;
    parts.forEach(([s, c, wt], i) => { label(ctx, s, left, y, { size, weight: wt || 600, fill: c, align: 'left' }); left += ws[i] + gap; });
  }
  // A little eighth note: head, stem and flag.
  function noteGlyph(ctx, x, y, s, c) {
    ctx.fillStyle = color(c); ctx.strokeStyle = color(c);
    ctx.beginPath(); ctx.ellipse(x, y, 7 * s, 5 * s, -0.4, 0, TAU); ctx.fill();
    ctx.lineWidth = 2.2 * s; ctx.beginPath(); ctx.moveTo(x + 6 * s, y - 1 * s); ctx.lineTo(x + 6 * s, y - 26 * s);
    ctx.quadraticCurveTo(x + 10 * s, y - 16 * s, x + 16 * s, y - 12 * s); ctx.stroke();
  }
  // A note head with stem (dir 1 = up, −1 = down), hollow or filled.
  function noteHead(ctx, x, y, c, filled = true, stem = 0, len = 62, lw = 3) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.38);
    ctx.beginPath(); ctx.ellipse(0, 0, 12.5, 8.6, 0, 0, TAU);
    if (filled) { ctx.fillStyle = color(c); ctx.fill(); } else { ctx.strokeStyle = color(c); ctx.lineWidth = 3.4; ctx.stroke(); }
    ctx.restore();
    if (stem) { const sx = stem > 0 ? x + 11.2 : x - 11.2; line(ctx, sx, y - (stem > 0 ? 2 : -2), sx, y - stem * len, c, lw); }
  }
  function trebleClef(ctx, x, yG, g, c) {
    const s = g * 0.88; const P = (px, py) => [x + px * s, yG + py * s];
    const bz = (a, b2, c2, d, e, f) => ctx.bezierCurveTo(...P(a, b2), ...P(c2, d), ...P(e, f));
    ctx.strokeStyle = color(c); ctx.fillStyle = color(c); ctx.lineWidth = Math.max(2.5, g * 0.17); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(...P(0.2, 0.1));
    bz(0.2, -0.6, -0.8, -0.5, -0.75, 0.2);
    bz(-0.7, 1.1, 1.0, 1.2, 1.05, 0.1);
    bz(1.1, -0.9, 0.0, -1.5, -0.6, -2.4);
    bz(-1.1, -3.3, -0.2, -4.6, 0.25, -5.6);
    bz(0.55, -5.0, 0.4, -4.0, -0.2, -3.0);
    bz(-0.45, -2.5, 0.5, 2.0, 0.45, 2.6);
    bz(0.4, 3.3, -0.5, 3.4, -0.55, 2.8);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(...P(-0.32, 2.75), s * 0.32, 0, TAU); ctx.fill();
  }
  // Each letter has its own colour, the way classroom bells are coloured.
  const LETTER = { C: '#ef4444', D: '#fb923c', E: '#facc15', F: '#4ade80', G: '#22d3ee', A: '#60a5fa', B: '#c084fc' };

  return {
    // ─── Music ────────────────────────────────────────────────────────────

    // The five lines and four spaces of the treble stave, then a melody
    // played note by note with its keys lit on a keyboard.
    'music-staff'(b, ctx, it, t) {
      const C = it._c || (it._c = (() => {
        const NAMES = 'CDEFGAB';
        const parse = (s) => { const m = /^([A-Ga-g])(\d)$/.exec(String(s).trim()); if (!m) return null; const L = m[1].toUpperCase(); return { L, p: NAMES.indexOf(L) + 7 * (Number(m[2]) - 4) - 2 }; };
        const src = Array.isArray(it.melody) ? it.melody : typeof it.melody === 'string' ? it.melody.split(/[\s,]+/) : [];
        let mel = src.map(parse).filter((n) => n && n.p >= -2 && n.p <= 8).slice(0, 16).map((n) => ({ ...n, d: 1 }));
        let named = false;
        if (mel.length < 3) mel = 'E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4 D4 D4'.split(' ').map(parse).map((n) => ({ ...n, d: 1 }));
        if (mel.map((n) => n.L).join('') === 'EEFGGFEDCCDEEDD') { mel[mel.length - 1].d = 2; named = true; }
        let s = 0; for (const n of mel) { n.s = s; s += n.d; }
        return { mel, beats: Math.ceil(s / 4) * 4, named: named ? 'Ode to Joy (Beethoven)' : str(it.tune, 'A melody') };
      })());
      const g = 26; const SB = Y0 + 300; const yOf = (p) => SB - (p * g) / 2;
      const SX0 = X0 + 24; const SX1 = X1 - 24;
      const BEAT = 0.42; const T0 = 5.2; const T1 = 4.6; const T2 = C.beats * BEAT + 2.2;
      const u = cycle(t, T0 + T1 + T2, 0.4);
      const ph = u < T0 ? 0 : u < T0 + T1 ? 1 : 2; const lt = ph === 0 ? u : ph === 1 ? u - T0 : u - T0 - T1;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Notes on the treble stave');
      chip(ctx, ['The lines', 'The spaces', 'Play a melody'][ph], X1 - 20, Y0 + 78, ['yellow', 'green', 'cyan'][ph], 21, 'right');
      // Stave.
      const glowLine = (i) => (ph === 0 ? [0, 2, 4, 6, 8].indexOf(i * 2) : -1);
      for (let i = 0; i < 5; i++) {
        const k = glowLine(i); const on = k >= 0 && lt > 0.5 + k * 0.75 + 0.35;
        line(ctx, SX0, yOf(i * 2), SX1, yOf(i * 2), on ? mix('#facc15', '#ffffff', 0.2) : 'rgba(220,230,255,0.75)', on ? 4 : 2.5);
      }
      if (ph === 1) for (let i = 0; i < 4; i++) { const q = after(lt, 0.5 + i * 0.75 + 0.35, 0.3); if (q > 0) { ctx.fillStyle = `rgba(74,222,128,${0.16 * q})`; ctx.fillRect(SX0 + 120, yOf(i * 2 + 2), SX1 - SX0 - 120, g); } }
      line(ctx, SX0, yOf(0), SX0, yOf(8), 'rgba(220,230,255,0.75)', 2.5);
      line(ctx, SX1, yOf(0), SX1, yOf(8), 'rgba(220,230,255,0.75)', ph === 2 ? 5 : 2.5);
      trebleClef(ctx, SX0 + 42, yOf(2), g, INK);
      // Notes for this phase: [p, letter, x, start time].
      let notes; let cur = -1;
      if (ph < 2) {
        const ps = ph === 0 ? [0, 2, 4, 6, 8] : [1, 3, 5, 7]; const Ls = ph === 0 ? 'EGBDF' : 'FACE';
        const x0 = X0 + 210; const step = (SX1 - 70 - x0) / (ps.length - 1);
        notes = ps.map((p, i) => ({ p, L: Ls[i], x: x0 + i * step, at: 0.5 + i * 0.75 }));
        notes.forEach((n, i) => { if (lt >= n.at) cur = i; });
      } else {
        line(ctx, SX0 + 100, yOf(0), SX0 + 100, yOf(8), 'rgba(220,230,255,0.0)', 1);
        label(ctx, '4', SX0 + 108, yOf(6), { size: 34, weight: 800, fill: 'ink' });
        label(ctx, '4', SX0 + 108, yOf(2), { size: 34, weight: 800, fill: 'ink' });
        const x0 = SX0 + 140; const bw = (SX1 - 16 - x0) / C.beats;
        for (let k = 4; k < C.beats; k += 4) line(ctx, x0 + k * bw - 4, yOf(0), x0 + k * bw - 4, yOf(8), 'rgba(220,230,255,0.75)', 2.5);
        notes = C.mel.map((n) => ({ ...n, x: x0 + n.s * bw + bw * 0.42, at: 0.6 + n.s * BEAT }));
        const bp = (lt - 0.6) / BEAT;
        notes.forEach((n, i) => { if (bp >= n.s && bp < n.s + n.d) cur = i; });
        if (bp >= 0 && bp < C.beats) { const px = x0 + bp * bw; ctx.fillStyle = 'rgba(34,211,238,0.13)'; ctx.fillRect(px - 16, yOf(9), 32, yOf(-3) - yOf(9)); }
      }
      notes.forEach((n, i) => {
        const q = ph < 2 ? pop(lt, n.at, 0.45) : after(lt, -0.4 + i * 0.05, 0.4);
        if (q <= 0) return;
        const y = yOf(n.p); const active = i === cur; const c = LETTER[n.L];
        const played = ph === 2 && lt >= n.at;
        const yy = ph < 2 ? y - (1 - q) * 120 : y - (active ? Math.sin(clamp((lt - n.at) / (BEAT * n.d)) * PI) * 8 : 0);
        ctx.save(); ctx.globalAlpha *= clamp(q);
        for (const lp of [-2, 10]) if ((lp < 0 && n.p <= lp) || (lp > 0 && n.p >= lp)) line(ctx, n.x - 22, yOf(lp), n.x + 22, yOf(lp), 'rgba(220,230,255,0.8)', 2.5);
        if (active) circ(ctx, n.x, yy, 22, tint(c, 0.25));
        noteHead(ctx, n.x, yy, ph < 2 || played || active ? c : '#e9eeff', !(ph === 2 && n.d >= 2), n.p < 4 ? 1 : -1, 66);
        label(ctx, n.L, n.x, SB + 68, { size: ph === 2 ? 21 : 30, weight: 800, fill: ph < 2 || played ? c : 'muted' });
        ctx.restore();
      });
      // Ripples from the sounding note.
      if (cur >= 0) { const n = notes[cur]; const f = clamp((lt - n.at) / 0.8); if (f < 1) circ(ctx, n.x, yOf(n.p), 18 + f * 34, null, tint(LETTER[n.L], 0.7 * (1 - f)), 3); }
      // The words under the stave.
      if (ph === 0) {
        const W = ['Every', 'Good', 'Boy', 'Deserves', 'Fun'];
        const q = after(lt, 4.2, 0.5);
        if (q > 0) { ctx.save(); ctx.globalAlpha *= q; const parts = []; W.forEach((w, i) => { parts.push([w[0], LETTER[w[0]], 800]); parts.push([`${w.slice(1)}${i < 4 ? ' ' : ''}`, 'ink', 500]); }); words(ctx, parts, cx, Y0 + 428, 26); ctx.restore(); }
      } else if (ph === 1) {
        const q = after(lt, 3.4, 0.5);
        if (q > 0) { ctx.save(); ctx.globalAlpha *= q; words(ctx, [['The spaces spell ', 'ink', 500], ['F', LETTER.F, 800], ['A', LETTER.A, 800], ['C', LETTER.C, 800], ['E', LETTER.E, 800]], cx, Y0 + 428, 26); ctx.restore(); }
      } else label(ctx, C.named, cx, Y0 + 428, { size: 23, weight: 700, fill: 'cyan' });
      // A keyboard from C4 to F5 lights the sounding note.
      const KEYS = 'CDEFGABCDEF'; const KW = 56; const KX = cx - (KEYS.length * KW) / 2; const KY = Y0 + 470; const KH = 140;
      const litP = cur >= 0 ? notes[cur].p : -99;
      for (let i = 0; i < KEYS.length; i++) {
        const on = i - 2 === litP; const c = LETTER[KEYS[i]];
        ctx.fillStyle = on ? mix(c, '#ffffff', 0.25) : '#f4f6ff'; ctx.strokeStyle = '#1a2040'; ctx.lineWidth = 2;
        rounded(ctx, KX + i * KW + 1, KY, KW - 2, KH, 6); ctx.fill(); ctx.stroke();
        label(ctx, KEYS[i], KX + i * KW + KW / 2, KY + KH - 20, { size: 19, weight: 700, fill: on ? '#1a1630' : c === LETTER.E ? '#b7950b' : c });
      }
      for (let i = 0; i < KEYS.length - 1; i++) if ('CDFGA'.includes(KEYS[i])) { ctx.fillStyle = '#141a33'; rounded(ctx, KX + (i + 1) * KW - 16, KY, 32, KH * 0.58, 4); ctx.fill(); }
      label(ctx, 'middle C', KX + KW / 2, KY + KH + 22, { size: 18, weight: 600, fill: 'muted' });
      const SAY = ['The 5 lines, bottom to top: E G B D F', 'The 4 spaces, bottom to top: F A C E', 'Higher on the stave = higher pitch'];
      label(ctx, SAY[ph], cx, Y1 - 46, { size: 21, weight: 600, fill: 'ink' });
      ctx.restore();
    },

    // One 4/4 bar filled four ways: 1 whole, 2 halves, 4 quarters, 8 eighths,
    // with a playhead counting the beats and each note's length as a bar.
    'note-values'(b, ctx, it, t) {
      const ROWS = [['Whole note', 4, 'purple', 'semibreve'], ['Half note', 2, 'blue', 'minim'], ['Quarter note', 1, 'green', 'crotchet'], ['Eighth note', 0.5, 'orange', 'quaver']];
      const BX0 = X0 + 262; const BX1 = X1 - 18; const BW = (BX1 - BX0 - 26) / 4;
      const xb = (s) => BX0 + 14 + s * BW;
      const BEAT = 0.9; const u = cycle(t, 4 * BEAT + 2.2, 0.8); const bp = u / BEAT;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Note values in a 4/4 bar');
      chip(ctx, '4/4 time', X0 + 20, Y0 + 82, 'cyan', 21, 'left');
      for (let i = 0; i < 4; i++) {
        const on = bp >= i && bp < i + 1 && bp < 4; const f = on ? bp - i : 1;
        const x = xb(i) + 20;
        circ(ctx, x, Y0 + 82, on ? 20 + (1 - f) * 6 : 18, on ? 'yellow' : 'rgba(147,160,196,0.25)');
        label(ctx, String(i + 1), x, Y0 + 83, { size: 20, weight: 800, fill: on ? '#1a1630' : 'muted' });
      }
      ROWS.forEach(([name, d, c, uk], r) => {
        const y = Y0 + 178 + r * 118; const q = after(t, 0.3 + r * 0.25, 0.5);
        ctx.save(); ctx.globalAlpha *= q;
        label(ctx, name, X0 + 20, y - 18, { size: 22, weight: 800, fill: c, align: 'left' });
        label(ctx, `${d === 0.5 ? '½' : d} beat${d === 1 || d === 0.5 ? '' : 's'} · ${uk}`, X0 + 20, y + 12, { size: 18, weight: 500, fill: 'muted', align: 'left' });
        line(ctx, BX0, y, BX1, y, 'rgba(220,230,255,0.6)', 2);
        line(ctx, BX0, y - 30, BX0, y + 30, 'rgba(220,230,255,0.6)', 2.5); line(ctx, BX1, y - 30, BX1, y + 30, 'rgba(220,230,255,0.6)', 2.5);
        const n = 4 / d;
        for (let k = 0; k < n; k++) {
          const s = k * d; const x0 = xb(s); const x1 = xb(s + d) - 6;
          const sounding = bp >= s && bp < s + d && bp < 4; const done = bp >= s + d && bp < 4.6;
          ctx.fillStyle = tint(c, 0.1); rounded(ctx, x0 + 2, y + 13, x1 - x0, 12, 6); ctx.fill();
          const fillTo = sounding ? (bp - s) / d : done ? 1 : 0;
          if (fillTo > 0) { ctx.fillStyle = tint(c, 0.75); rounded(ctx, x0 + 2, y + 13, (x1 - x0) * fillTo, 12, 6); ctx.fill(); }
          const hx = x0 + 20; const cc = sounding ? mix(color(c), '#ffffff', 0.35) : c;
          if (sounding) circ(ctx, hx, y, 21, tint(c, 0.28));
          noteHead(ctx, hx, y - (sounding ? 3 : 0), cc, d < 2, d < 4 ? 1 : 0, 50);
          if (d === 0.5 && k % 2 === 0) { const x2 = xb(s + d) + 20 + 11.2; ctx.fillStyle = color(cc); ctx.fillRect(hx + 11.2 - 1.5, y - 52, x2 - hx - 11.2 + 3, 7); }
        }
        // Counts under the bar.
        const counts = d === 0.5 ? ['1', '&', '2', '&', '3', '&', '4', '&'] : ['1', '2', '3', '4'];
        counts.forEach((s, k) => { const step = 4 / counts.length; const on = bp >= k * step && bp < (k + 1) * step && bp < 4; label(ctx, s, xb(k * step) + 20, y + 44, { size: 18, weight: on ? 800 : 500, fill: on ? 'yellow' : 'muted' }); });
        ctx.restore();
      });
      if (bp < 4.05) { const px = xb(Math.min(bp, 4)); line(ctx, px, Y0 + 125, px, Y0 + 560, 'rgba(251,191,36,0.75)', 3); }
      const q = after(t, 1.8, 0.6);
      ctx.save(); ctx.globalAlpha *= q;
      words(ctx, [['1 whole', 'purple', 800], [' = ', 'muted', 600], ['2 halves', 'blue', 800], [' = ', 'muted', 600], ['4 quarters', 'green', 800], [' = ', 'muted', 600], ['8 eighths', 'orange', 800]], cx, Y0 + 628, 23);
      label(ctx, 'Every bar of 4/4 time holds 4 beats', cx, Y0 + 672, { size: 20, weight: 600, fill: 'ink' });
      ctx.restore();
      ctx.restore();
    },

    // A symphony orchestra from above: strings in front of the conductor,
    // then woodwind, brass and percussion at the back, each family lit in turn.
    'orchestra-seating'(b, ctx, it, t) {
      const k = b.clock; const CY = Y0 + 545; const D = 3.2;
      const act = t < 0.8 ? -1 : Math.floor(cycle(t, D * 5, 0.8) / D);
      const R = (deg) => (deg * PI) / 180;
      // [name, family, r0, r1, a0, a1, colour]
      const SEC = [
        ['Violins I', 0, 70, 200, 180, 225], ['Violins II', 0, 70, 200, 225, 270], ['Violas', 0, 70, 200, 270, 315], ['Cellos', 0, 70, 200, 315, 360],
        ['Harp', 0, 212, 300, 182, 218], ['Basses', 0, 212, 300, 322, 358],
        ['Woodwind', 1, 212, 300, 222, 318], ['Brass', 2, 310, 388, 218, 322], ['Percussion', 3, 398, 465, 236, 304],
      ];
      const FAM = [['Strings', '#f59e0b'], ['Woodwind', '#34d399'], ['Brass', '#fbbf24'], ['Percussion', '#fb7185']];
      const FC = ['#f59e0b', '#34d399', '#facc15', '#fb7185'];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Where the orchestra sits');
      SEC.forEach(([name, f, r0, r1, a0, a1], i) => {
        const q = after(t, 0.1 + i * 0.07, 0.5); if (q <= 0) return;
        const on = act === f || act === 4; const c = FC[f];
        ctx.save(); ctx.globalAlpha *= q;
        ctx.beginPath(); ctx.arc(cx, CY, r1, R(a0), R(a1)); ctx.arc(cx, CY, r0, R(a1), R(a0), true); ctx.closePath();
        ctx.fillStyle = tint(c, on ? 0.34 : 0.1); ctx.fill(); ctx.strokeStyle = on ? c : tint(c, 0.45); ctx.lineWidth = on ? 3 : 2; ctx.stroke();
        // Players: rows of chairs away from the label band.
        const rm = (r0 + r1) / 2; const am = (a0 + a1) / 2;
        const rows = r1 - r0 > 110 ? [r0 + 16, r0 + 38, r1 - 36, r1 - 14] : [r0 + 14, r1 - 14];
        rows.forEach((rr, ri) => {
          const n = Math.max(1, Math.floor((R(a1 - a0) * rr) / 26));
          for (let j = 0; j < n; j++) {
            const a = R(a0) + ((j + 0.5) / n) * R(a1 - a0);
            const bob = on ? Math.max(0, Math.sin(k * 6 + j * 0.9 + ri)) * 2.5 : 0;
            circ(ctx, cx + Math.cos(a) * rr, CY + Math.sin(a) * rr - bob, 6.5, on ? mix(c, '#ffffff', 0.3) : tint(c, 0.6));
          }
        });
        const lr = r1 - r0 > 110 ? rm + 4 : rm;
        label(ctx, name, cx + Math.cos(R(am)) * lr, CY + Math.sin(R(am)) * lr, { size: name.length > 7 ? 18 : 20, weight: 800, fill: on ? '#ffffff' : c });
        // Notes rising from a lit family.
        if (on && act < 4) for (let j = 0; j < 2; j++) { const p = mod(k * 0.6 + j * 0.5 + i * 0.3, 1); const a = R(lerp(a0 + 6, a1 - 6, rnd(i * 7 + j + Math.floor(k * 0.6 + j * 0.5 + i * 0.3)))); ctx.save(); ctx.globalAlpha *= Math.sin(p * PI) * 0.9; noteGlyph(ctx, cx + Math.cos(a) * (r1 - 18) - 4, CY + Math.sin(a) * (r1 - 18) - p * 18, 0.8, c); ctx.restore(); }
        ctx.restore();
      });
      // The conductor and the beat of the baton.
      const bx = Math.sin(k * 3.2) * 14; const by = -Math.abs(Math.cos(k * 3.2)) * 10;
      circ(ctx, cx, CY + 6, 20, '#3b4470'); circ(ctx, cx, CY - 14, 12, '#f1c27d');
      line(ctx, cx + 14, CY + 2, cx + 30 + bx, CY - 12 + by, '#3b4470', 6);
      line(ctx, cx + 30 + bx, CY - 12 + by, cx + 52 + bx * 1.6, CY - 34 + by * 1.6, '#ffffff', 2.5);
      line(ctx, cx - 14, CY + 2, cx - 30 - bx * 0.6, CY - 8, '#3b4470', 6);
      label(ctx, 'Conductor', cx, CY + 46, { size: 19, weight: 700, fill: 'muted' });
      const INFO = [
        ['Strings: violins, violas, cellos, basses, harp', 'Bowed or plucked; the biggest family sits at the front'],
        ['Woodwind: flutes, oboes, clarinets, bassoons', 'Air blown across a hole or through a reed'],
        ['Brass: horns, trumpets, trombones, tuba', 'Players buzz their lips into a metal mouthpiece'],
        ['Percussion: timpani, drums, cymbals, xylophone', 'Struck, shaken or scraped; loud, so at the back'],
        ['All together: about 80 to 100 players', 'Quiet instruments in front, loud ones behind'],
      ];
      if (act >= 0) {
        const c = act < 4 ? FAM[act][1] : '#a78bfa';
        label(ctx, INFO[act][0], cx, Y0 + 640, { size: 21, weight: 800, fill: c });
        label(ctx, INFO[act][1], cx, Y0 + 676, { size: 19, weight: 500, fill: 'ink' });
      }
      ctx.restore();
    },

    // C major (C–E–G) and C minor (C–E♭–G) lit on a keyboard: the third
    // drops by one semitone and the mood changes.
    'piano-chords'(b, ctx, it, t) {
      const KW = 74; const KX = cx - 5 * KW; const KY = Y0 + 255; const KH = 245; const BH = 152;
      const WI = [0, -1, 1, -1, 2, 3, -1, 4, -1, 5, -1, 6];
      const BI = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 };
      const xOf = (n) => { const o = Math.floor(n / 12); const m = n % 12; return WI[m] >= 0 ? KX + (WI[m] + 7 * o + 0.5) * KW : KX + (BI[m] + 7 * o + 1) * KW; };
      const black = (n) => WI[n % 12] < 0;
      const P = 13; const u = cycle(t, P, 0.4); const minor = u >= P / 2; const lu = minor ? u - P / 2 : u;
      const third = minor ? 3 : 4;
      const NOTES = [[0, 'C', 'root', 0.4], [third, minor ? 'E♭' : 'E', minor ? 'minor third' : 'major third', 1.0], [7, 'G', 'fifth', 1.6]];
      const press = (i) => (minor && i !== 1 ? 1 : after(lu, NOTES[i][3], 0.25));
      const cMain = minor ? '#a78bfa' : '#fbbf24';
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Major and minor chords');
      label(ctx, minor ? 'C minor' : 'C major', cx, Y0 + 82, { size: 38, weight: 800, fill: cMain });
      label(ctx, minor ? 'sounds darker, sadder' : 'sounds bright, happy', cx, Y0 + 124, { size: 21, weight: 600, fill: 'ink' });
      // White keys, then black keys.
      for (let i = 0; i < 10; i++) {
        const n = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16][i]; const ni = NOTES.findIndex((q) => q[0] === n); const p = ni >= 0 ? press(ni) : 0;
        const ex = !minor ? 0 : n === 4 ? 1 - after(lu, 0.2, 0.3) : 0;
        const on = Math.max(p, ex);
        ctx.fillStyle = on > 0.05 ? mix('#f4f6ff', ni >= 0 ? cMain : '#fbbf24', on * 0.75) : '#f4f6ff'; ctx.strokeStyle = '#1a2040'; ctx.lineWidth = 2;
        rounded(ctx, KX + i * KW + 1, KY + on * 4, KW - 2, KH, 7); ctx.fill(); ctx.stroke();
        label(ctx, 'CDEFGABCDE'[i], KX + i * KW + KW / 2, KY + KH - 24 + on * 4, { size: 21, weight: 700, fill: '#2a3050' });
      }
      for (let i = 0; i < 9; i++) if ([0, 1, 3, 4, 5, 7, 8].includes(i)) {
        const n = [1, 3, 6, 8, 10, 13, 15][[0, 1, 3, 4, 5, 7, 8].indexOf(i)];
        const ni = NOTES.findIndex((q) => q[0] === n); const p = ni >= 0 ? press(ni) : 0;
        ctx.fillStyle = p > 0.05 ? mix('#141a33', cMain, p) : '#141a33';
        rounded(ctx, KX + (i + 1) * KW - 22, KY + p * 3, 44, BH, 5); ctx.fill();
      }
      // Semitone hops above the keys.
      const hops = (a, z, at, lab) => {
        const q = after(lu, at, 0.8); if (q <= 0) return;
        const nh = z - a;
        for (let s = 0; s < nh; s++) {
          const f = clamp(q * nh - s); if (f <= 0) continue;
          const x0 = xOf(a + s); const x1 = xOf(a + s + 1); const mx = (x0 + x1) / 2;
          ctx.strokeStyle = tint(cMain, 0.9); ctx.lineWidth = 3; ctx.beginPath();
          for (let j = 0; j <= 12 * f; j++) { const p = j / 12; const x = lerp(x0, x1, p); const y = KY - 14 - Math.sin(p * PI) * 26; if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
          ctx.stroke();
          if (f >= 1) label(ctx, String(s + 1), mx, KY - 52, { size: 18, weight: 700, fill: 'muted' });
        }
        if (q >= 1) label(ctx, lab, (xOf(a) + xOf(z)) / 2, KY - 90, { size: 20, weight: 800, fill: cMain });
      };
      hops(0, third, 2.2, `${third} semitones`);
      hops(third, 7, 3.4, `${7 - third} semitones`);
      // The note names and roles under the keys.
      NOTES.forEach(([n, name, role], i) => {
        const q = press(i); if (q <= 0.05) return;
        const x = xOf(n); ctx.save(); ctx.globalAlpha *= q;
        label(ctx, name, x, KY + KH + 34, { size: 26, weight: 800, fill: i === 1 ? cMain : 'ink' });
        ctx.restore();
      });
      const q1 = after(lu, 2.0, 0.5);
      ctx.save(); ctx.globalAlpha *= q1;
      label(ctx, 'root', xOf(0), KY + KH + 64, { size: 18, weight: 600, fill: 'muted' });
      label(ctx, 'fifth', xOf(7), KY + KH + 64, { size: 18, weight: 600, fill: 'muted' });
      label(ctx, 'third', xOf(third), KY + KH + 64, { size: 18, weight: 600, fill: 'muted' });
      ctx.restore();
      // The one change.
      const panelX = xOf(9) - 24; const panelY = KY + KH + 18; const PW = X1 - 10 - panelX;
      if (minor) {
        const q = after(lu, 0.2, 0.5);
        ctx.save(); ctx.globalAlpha *= q;
        panel(ctx, panelX, panelY, PW, 66, 'purple', 0.1, 14);
        label(ctx, 'E drops 1 semitone', panelX + PW / 2, panelY + 22, { size: 19, weight: 800, fill: 'purple' });
        label(ctx, 'to E♭: only one note!', panelX + PW / 2, panelY + 47, { size: 18, weight: 600, fill: 'ink' });
        ctx.restore();
        if (lu < 1.4) { const f = smooth(lu / 1.2); arr(ctx, xOf(4), KY + 40, lerp(xOf(4), xOf(3) + 6, f), KY + 40 + f * 6, 'red', 4); }
      } else {
        const q = after(lu, 4.4, 0.5);
        ctx.save(); ctx.globalAlpha *= q;
        panel(ctx, panelX, panelY, PW, 66, 'yellow', 0.08, 14);
        label(ctx, 'A triad: 3 notes', panelX + PW / 2, panelY + 22, { size: 19, weight: 800, fill: 'yellow' });
        label(ctx, 'every other white key', panelX + PW / 2, panelY + 47, { size: 18, weight: 600, fill: 'ink' });
        ctx.restore();
      }
      const q2 = after(lu, 3.6, 0.5);
      ctx.save(); ctx.globalAlpha *= q2;
      words(ctx, minor ? [['Minor', 'purple', 800], [' = 3 semitones, then 4', 'ink', 600]] : [['Major', 'yellow', 800], [' = 4 semitones, then 3', 'ink', 600]], cx, Y1 - 40, 23);
      ctx.restore();
      ctx.restore();
    },

    // A metronome and a rock drum pattern speeding up from Largo (60 BPM)
    // to Presto (180 BPM); the weight slides down the arm as it speeds up.
    'rhythm-beats'(b, ctx, it, t) {
      const SEG = [[60, 'Largo', 'slow and broad'], [90, 'Andante', 'at a walking pace'], [120, 'Allegro', 'fast and lively'], [180, 'Presto', 'very fast']];
      const SD = 4; const u = cycle(t, SD * SEG.length, 0.5);
      const si = Math.min(SEG.length - 1, Math.floor(u / SD)); const lu = u - si * SD;
      const [bpm, name, desc] = SEG[si]; const bp = (lu * bpm) / 60;
      const frac = mod(bp, 1); const tick = frac < 0.14 && t > 0.5;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Tempo: beats per minute');
      // Metronome.
      const MX = X0 + 175; const MB = Y0 + 425; const MT = Y0 + 100; const PV = MB - 52;
      poly(ctx, [MX - 105, MB, MX + 105, MB, MX + 38, MT, MX - 38, MT]);
      ctx.fillStyle = '#7c4a1e'; ctx.fill(); ctx.strokeStyle = '#3d220c'; ctx.lineWidth = 3; ctx.stroke();
      poly(ctx, [MX - 72, MB - 40, MX + 72, MB - 40, MX + 26, MT + 30, MX - 26, MT + 30]);
      ctx.fillStyle = '#f3e3c3'; ctx.fill();
      for (let i = 0; i <= 10; i++) { const y = lerp(MT + 50, MB - 70, i / 10); const hw = lerp(18, 48, (y - MT) / (MB - MT)) * 0.5; line(ctx, MX - hw, y, MX + hw, y, '#a07a4a', 2); }
      ctx.fillStyle = '#5a3412'; ctx.fillRect(MX - 112, MB, 224, 14);
      const ang = 0.42 * Math.cos(PI * bp) * (t > 0.5 ? 1 : 0);
      const L = 300; const wp = lerp(0.82, 0.42, (bpm - 60) / 120);
      const ax = Math.sin(ang); const ay = -Math.cos(ang);
      line(ctx, MX, PV, MX + ax * L, PV + ay * L, '#d1d5db', 5);
      const wx = MX + ax * L * wp; const wy = PV + ay * L * wp;
      ctx.save(); ctx.translate(wx, wy); ctx.rotate(ang); ctx.fillStyle = '#e5e7eb'; rounded(ctx, -17, -14, 34, 28, 5); ctx.fill(); ctx.fillStyle = '#9ca3af'; ctx.fillRect(-17, -2, 34, 4); ctx.restore();
      circ(ctx, MX, PV, 9, '#d1d5db');
      if (tick) { const s = 1 - frac / 0.14; const side = Math.cos(PI * bp) > 0 ? 1 : -1; const tx = MX + side * Math.sin(0.42) * L * 0.95; const ty = PV - Math.cos(0.42) * L * 0.95; circ(ctx, tx, ty, 14 + (1 - s) * 18, null, tint('yellow', s), 3); label(ctx, 'tick', tx + side * 44, ty, { size: 19, weight: 800, fill: tint('yellow', s) }); }
      // Tempo readout.
      const RX = X0 + 590;
      label(ctx, String(bpm), RX, Y0 + 128, { size: 78, weight: 800, fill: tick ? 'yellow' : 'ink' });
      label(ctx, 'BPM (beats per minute)', RX, Y0 + 186, { size: 20, weight: 700, fill: 'cyan' });
      chip(ctx, `${name}: ${desc}`, RX, Y0 + 236, ['blue', 'teal', 'orange', 'red'][si], 21);
      label(ctx, `${bpm} beats in 60 s = 1 beat every ${(60 / bpm).toFixed(2)} s`, RX, Y0 + 284, { size: 19, weight: 500, fill: 'ink' });
      const TX0 = X0 + 380; const TX1 = X1 - 34; const TY = Y0 + 340;
      const tx = (v) => lerp(TX0, TX1, (v - 40) / 160);
      line(ctx, TX0, TY, TX1, TY, 'rgba(140,170,255,0.35)', 8);
      const prev = SEG[mod(si - 1, SEG.length)][0]; const mv = lerp(si === 0 ? 60 : prev, bpm, smooth(lu / 0.6));
      ctx.lineCap = 'round'; line(ctx, TX0, TY, tx(mv), TY, 'cyan', 8);
      SEG.forEach(([v]) => { line(ctx, tx(v), TY - 12, tx(v), TY + 12, 'rgba(220,230,255,0.6)', 2); label(ctx, String(v), tx(v), TY + 32, { size: 18, weight: 600, fill: v === bpm ? 'ink' : 'muted' }); });
      label(ctx, 'slow', TX0, TY - 26, { size: 18, weight: 600, fill: 'muted', align: 'left' });
      label(ctx, 'fast', TX1, TY - 26, { size: 18, weight: 600, fill: 'muted', align: 'right' });
      circ(ctx, tx(mv), TY, 13, 'cyan', '#0b1024', 3);
      // Drum pattern: 8 steps of eighth notes.
      const GX = X0 + 160; const GW = X1 - 16 - GX; const CW = GW / 8; const GY = Y0 + 466;
      const step = Math.floor(bp * 2) % 8; const sf = mod(bp * 2, 1);
      const PAT = [['Hi-hat', [1, 1, 1, 1, 1, 1, 1, 1], '#22d3ee'], ['Snare', [0, 0, 1, 0, 0, 0, 1, 0], '#fb7185'], ['Kick drum', [1, 0, 0, 0, 1, 1, 0, 0], '#fbbf24']];
      ['1', '&', '2', '&', '3', '&', '4', '&'].forEach((s, i) => label(ctx, s, GX + (i + 0.5) * CW, GY, { size: 20, weight: i === step ? 800 : 500, fill: i === step ? 'yellow' : 'muted' }));
      PAT.forEach(([nm, pat, c], r) => {
        const y = GY + 28 + r * 56;
        label(ctx, nm, X0 + 14, y + 22, { size: 20, weight: 700, fill: c, align: 'left' });
        pat.forEach((h, i) => {
          const on = i === step; const hitNow = on && h;
          ctx.fillStyle = h ? (hitNow ? mix(c, '#ffffff', 0.5 * (1 - sf)) : tint(c, 0.45)) : 'rgba(140,170,255,0.08)';
          rounded(ctx, GX + i * CW + 4, y + (hitNow ? -2 * (1 - sf) : 0), CW - 8, 44, 9); ctx.fill();
          if (on) { ctx.strokeStyle = 'rgba(251,191,36,0.9)'; ctx.lineWidth = 2.5; rounded(ctx, GX + i * CW + 4, y, CW - 8, 44, 9); ctx.stroke(); }
        });
      });
      label(ctx, 'Faster tempo: the same pattern, squeezed into less time', cx, Y1 - 22, { size: 19, weight: 500, fill: 'ink' });
      ctx.restore();
    },

    // ─── Art ──────────────────────────────────────────────────────────────

    // A 12-part colour wheel: primaries, secondaries, tertiaries, then the
    // complementary pairs opposite each other, then warm and cool halves.
    'colour-wheel'(b, ctx, it, t) {
      const W = [['Yellow', '#fdd835', 0], ['Yellow-orange', '#ffb300', 2], ['Orange', '#fb8c00', 1], ['Red-orange', '#f4511e', 2], ['Red', '#e53935', 0], ['Red-violet', '#c2185b', 2], ['Violet', '#8e24aa', 1], ['Blue-violet', '#5e35b1', 2], ['Blue', '#1e88e5', 0], ['Blue-green', '#00897b', 2], ['Green', '#43a047', 1], ['Yellow-green', '#9ccc65', 2]];
      const WY = Y0 + 340; const RO = 212; const RI = 106;
      const DUR = [4, 4.5, 4.5, 7.2, 4.2]; const TOT = DUR.reduce((a, c) => a + c, 0);
      let u = cycle(t, TOT, 1.2); let ph = 0; while (ph < DUR.length - 1 && u >= DUR[ph]) { u -= DUR[ph]; ph++; }
      if (t < 1.2) { ph = -1; u = t; }
      const pair = ph === 3 ? Math.min(5, Math.floor(u / 1.2)) : -1;
      const MIX2 = [['Red', 'Yellow', 'Orange', 2], ['Yellow', 'Blue', 'Green', 10], ['Blue', 'Red', 'Violet', 6]];
      const mixI = ph === 1 ? Math.min(2, Math.floor(u / 1.5)) : -1;
      const MIX3 = [['Yellow', 'Orange', 1], ['Red', 'Orange', 3], ['Red', 'Violet', 5], ['Blue', 'Violet', 7], ['Blue', 'Green', 9], ['Yellow', 'Green', 11]];
      const triI = ph === 2 ? Math.min(5, Math.floor(u / 0.75)) : -1;
      const lit = (i) => {
        if (ph < 0) return 1;
        if (ph === 0 || ph === 1) return W[i][2] === ph ? 1 : W[i][2] < ph ? 0.55 : 0.15;
        if (ph === 2) return 1;
        if (ph === 3) return i === pair || i === pair + 6 ? 1 : 0.15;
        return 1;
      };
      const ang = (i) => -PI / 2 + (i * TAU) / 12;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The colour wheel');
      W.forEach(([, c], i) => {
        const grow = ph < 0 ? after(t, i * 0.08, 0.4) : 1; if (grow <= 0) return;
        const L = lit(i); const popR = L >= 1 && ph !== 2 && ph !== 4 ? 10 : ph === 2 && W[i][2] === 2 ? 8 : 0;
        const a0 = ang(i) - PI / 12; const a1 = ang(i) + PI / 12;
        const ro = RI + (RO - RI) * grow + popR; const ri = RI + popR * 0.3;
        ctx.beginPath(); ctx.arc(cx, WY, ro, a0, a1); ctx.arc(cx, WY, ri, a1, a0, true); ctx.closePath();
        ctx.fillStyle = L >= 1 ? c : mix(c, '#0b1024', 1 - L); ctx.fill();
        ctx.strokeStyle = DARK; ctx.lineWidth = 3; ctx.stroke();
      });
      // Labels around the outside for the colours in play.
      const tagA = (i, text, c, size = 20) => {
        const a = ang(i); const rr = RO + 30; const ca = Math.cos(a);
        const x = cx + Math.cos(a) * rr; const y = WY + Math.sin(a) * rr + (Math.abs(ca) < 0.3 ? Math.sign(Math.sin(a)) * 6 : 0);
        label(ctx, text, x, y, { size, weight: 800, fill: c, align: Math.abs(ca) < 0.3 ? 'center' : ca > 0 ? 'left' : 'right' });
      };
      let head = 'The colour wheel'; let sub = '12 colours in a circle'; let cap1 = ''; let cap2 = ''; let hc = 'ink';
      if (ph === 0) {
        W.forEach(([n, c, k], i) => { if (k === 0) tagA(i, n, mix(c, '#ffffff', 0.15)); });
        head = 'Primary'; sub = 'cannot be mixed'; hc = 'yellow';
        cap1 = 'Red, yellow and blue: every other colour comes from these'; cap2 = 'They sit evenly spaced, a third of the way round';
      } else if (ph === 1) {
        W.forEach(([n, c, k], i) => { if (k === 1) tagA(i, n, mix(c, '#ffffff', 0.15)); });
        head = 'Secondary'; sub = 'primary + primary'; hc = 'orange';
        const [p, q, r] = MIX2[mixI];
        cap1 = `${p} + ${q} = ${r}`; cap2 = 'Each secondary sits between its two primaries';
      } else if (ph === 2) {
        W.forEach(([n, c, k], i) => { if (k === 2 && (MIX3.findIndex((m) => m[2] === i) <= triI)) tagA(i, n, mix(c, '#ffffff', 0.2), 19); });
        head = 'Tertiary'; sub = 'primary + secondary'; hc = 'red';
        const [p, q, i3] = MIX3[triI]; cap1 = `${p} + ${q} = ${W[i3][0]}`; cap2 = 'Mix a primary with the secondary next to it';
      } else if (ph === 3) {
        const A = W[pair]; const B = W[pair + 6];
        tagA(pair, A[0], mix(A[1], '#ffffff', 0.15)); tagA(pair + 6, B[0], mix(B[1], '#ffffff', 0.15));
        head = 'Complementary'; sub = 'opposite pairs'; hc = 'cyan';
        cap1 = `${A[0]} and ${B[0]} sit opposite`; cap2 = 'Side by side, complementary colours make each other pop';
      } else if (ph === 4) {
        const q = after(u, 0.2, 0.6);
        ctx.save(); ctx.globalAlpha *= q;
        ctx.strokeStyle = 'rgba(233,238,255,0.8)'; ctx.lineWidth = 3; ctx.setLineDash([8, 8]);
        ctx.beginPath(); ctx.moveTo(cx, WY - RO - 16); ctx.lineTo(cx, WY - RI - 4); ctx.moveTo(cx, WY + RI + 4); ctx.lineTo(cx, WY + RO + 16); ctx.stroke(); ctx.setLineDash([]);
        label(ctx, 'Warm', cx + RO + 22, WY, { size: 28, weight: 800, fill: '#ff9f43', align: 'left' });
        label(ctx, 'Cool', cx - RO - 22, WY, { size: 28, weight: 800, fill: '#5b8cff', align: 'right' });
        ctx.restore();
        head = 'Warm & cool'; sub = 'two halves'; hc = 'orange';
        cap1 = 'Warm colours (reds, oranges, yellows) seem to come closer'; cap2 = 'Cool colours (greens, blues, violets) seem calm and far away';
      } else { cap1 = 'Colours arranged in a circle show how they mix'; }
      label(ctx, head, cx, WY - 14, { size: head.length > 10 ? 22 : 28, weight: 800, fill: hc });
      label(ctx, sub, cx, WY + 20, { size: 18, weight: 600, fill: 'muted' });
      if (cap1) label(ctx, cap1, cx, Y0 + 640, { size: 22, weight: 700, fill: 'ink' });
      if (cap2) label(ctx, cap2, cx, Y0 + 678, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // One-point perspective drawn step by step: horizon, vanishing point,
    // orthogonals, a road, a building and fence posts shrinking into the distance.
    'perspective-drawing'(b, ctx, it, t) {
      const P = 15.5; const u = cycle(t, P, 0.2); const out = 1 - smooth((u - (P - 0.7)) / 0.6);
      const HY = Y0 + 270; const VX = cx; const G = Y0 + 620 - HY;
      const pr = (X, Y, z) => [VX + X / z, HY + Y / z];
      const FX0 = X0 + 16; const FX1 = X1 - 16; const FY0 = Y0 + 62; const FY1 = Y0 + 620;
      const S = [0.3, 1.3, 2.0, 3.0, 4.2, 5.1, 6.0, 6.9, 7.8];
      const st = S.reduce((a, s, i) => (u >= s ? i : a), -1);
      const q = (i, d = 0.8) => after(u, S[i], d);
      const colour = q(8, 1.0);
      const cons = 1 - 0.75 * colour;
      ctx.save(); fade(ctx, t); ctx.globalAlpha *= out;
      title(ctx, it.label || 'One-point perspective');
      // Paper.
      ctx.fillStyle = mix('#141b38', '#9fd3ff', colour * 0.75); rounded(ctx, FX0, FY0, FX1 - FX0, HY - FY0, [14, 14, 0, 0]); ctx.fill();
      ctx.fillStyle = mix('#10162e', '#7ccf8a', colour * 0.7); rounded(ctx, FX0, HY, FX1 - FX0, FY1 - HY, [0, 0, 14, 14]); ctx.fill();
      ctx.save(); rounded(ctx, FX0, FY0, FX1 - FX0, FY1 - FY0, 14); ctx.clip();
      const pen = 'rgba(233,238,255,0.92)';
      const strokeQ = (pts, p, c = pen, w = 3) => { if (p <= 0) return; ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.beginPath(); const n = pts.length / 2; const segs = (n - 1) * p; ctx.moveTo(pts[0], pts[1]); for (let i = 1; i < n; i++) { const f = clamp(segs - (i - 1)); if (f <= 0) break; ctx.lineTo(lerp(pts[2 * i - 2], pts[2 * i], f), lerp(pts[2 * i - 1], pts[2 * i + 1], f)); } ctx.stroke(); };
      // Orthogonals (construction lines).
      if (q(2) > 0) {
        ctx.save(); ctx.globalAlpha *= cons; ctx.setLineDash([7, 7]);
        const targets = [[-170, -140], [-170, G], [-150, G], [150, G], [260, G], [260, G - 110], [-400, -140], [-400, G]];
        targets.forEach(([X, Y], i) => { const [x1, y1] = pr(X * 1.6, Y * 1.6, 1); const f = clamp(q(2, 0.9) * 1.4 - i * 0.05); ctx.strokeStyle = 'rgba(251,113,133,0.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(VX, HY); ctx.lineTo(lerp(VX, x1, f), lerp(HY, y1, f)); ctx.stroke(); });
        ctx.setLineDash([]); ctx.restore();
      }
      // Road.
      if (q(3) > 0) {
        const [ax, ay] = pr(-150, G, 1); const [bx2] = pr(150, G, 1);
        if (colour > 0) { ctx.save(); ctx.globalAlpha *= colour; poly(ctx, [ax, ay, bx2, ay, VX, HY]); ctx.fillStyle = '#4b5263'; ctx.fill(); ctx.restore(); }
        strokeQ([ax, ay, VX, HY], q(3)); strokeQ([bx2, ay, VX, HY], q(3));
        for (const a of [1, 1.6, 2.6, 4.2, 6.8, 11]) {
          const f = clamp(q(3, 1.2) * 1.3 - a * 0.03); if (f <= 0) continue;
          const z0 = a; const z1 = a * 1.28; const p0 = pr(-7, G, z0); const p1 = pr(7, G, z0); const p2 = pr(7, G, z1); const p3 = pr(-7, G, z1);
          ctx.save(); ctx.globalAlpha *= f; poly(ctx, [...p0, ...p1, ...p2, ...p3]); ctx.fillStyle = colour > 0.5 ? '#fde68a' : pen; ctx.fill(); ctx.restore();
        }
      }
      // Fence posts on the right: the same height, smaller with distance.
      if (q(6) > 0) {
        const zs = [1, 1.3, 1.7, 2.2, 2.9, 3.8, 5, 6.6];
        zs.forEach((z, i) => {
          const f = clamp(q(6, 1.0) * 1.6 - i * 0.1); if (f <= 0) return;
          const [x, yb] = pr(270, G, z); const [, yt] = pr(270, G - 120, z); const w = 16 / z;
          ctx.save(); ctx.globalAlpha *= f;
          ctx.fillStyle = colour > 0.3 ? mix('#e9eeff', '#8b5a2b', colour) : 'rgba(233,238,255,0.85)'; ctx.fillRect(x - w / 2, yt, w, yb - yt);
          if (i) { const [px, pyb] = pr(270, G - 80, zs[i - 1]); const [, pyt] = pr(270, G - 80, z); line(ctx, px, pyb, x, pyt, colour > 0.3 ? mix('#e9eeff', '#8b5a2b', colour) : pen, Math.max(1.5, 5 / z)); }
          ctx.restore();
        });
      }
      // The far building, then the near building.
      const building = (Xf, Xs, Ytop, z0, z1, p0, p1, p2, hue) => {
        if (p0 <= 0) return;
        const A = pr(Xf, Ytop, z0); const B = pr(Xs, Ytop, z0); const Cc = pr(Xs, G, z0); const D = pr(Xf, G, z0);
        const E = pr(Xs, Ytop, z1); const F = pr(Xs, G, z1);
        if (colour > 0) {
          ctx.save(); ctx.globalAlpha *= colour;
          poly(ctx, [...A, ...B, ...Cc, ...D]); ctx.fillStyle = hue[0]; ctx.fill();
          if (p1 > 0) { poly(ctx, [...B, ...E, ...F, ...Cc]); ctx.fillStyle = hue[1]; ctx.fill(); }
          ctx.restore();
        } else {
          poly(ctx, [...A, ...B, ...Cc, ...D]); ctx.fillStyle = '#141b38'; ctx.fill();
          if (p1 > 0) { poly(ctx, [...B, ...E, ...F, ...Cc]); ctx.fillStyle = '#141b38'; ctx.fill(); }
        }
        strokeQ([...D, ...A, ...B, ...Cc, ...D], p0);
        if (p1 > 0) { strokeQ([...B, ...E], p1); strokeQ([...Cc, ...F], p1); strokeQ([...E, ...F], clamp(p1 * 2 - 1)); }
        if (p2 > 0) {
          ctx.save(); ctx.globalAlpha *= p2;
          const wc = colour > 0.4 ? '#fde68a' : 'rgba(233,238,255,0.7)';
          // Front windows.
          const cols = Math.max(1, Math.round((Xs - Xf) / 75));
          for (let r = 0; Ytop + 40 + r * 70 < G - 80; r++) for (let c = 0; c < cols; c++) {
            const wx0 = Xf + ((c + 0.25) / cols) * (Xs - Xf); const wx1 = Xf + ((c + 0.75) / cols) * (Xs - Xf); const y0 = Ytop + 40 + r * 70;
            const a = pr(wx0, y0, z0); const bb = pr(wx1, y0 + 38, z0); ctx.fillStyle = wc; ctx.fillRect(a[0], a[1], bb[0] - a[0], bb[1] - a[1]);
          }
          // Side windows recede.
          const n = Math.max(1, Math.floor((z1 - z0) / 0.32));
          for (let r = 0; Ytop + 40 + r * 70 < G - 80; r++) for (let c = 0; c < n; c++) {
            const za = z0 + (c + 0.3) * ((z1 - z0) / n); const zb = za + 0.4 * ((z1 - z0) / n); const y0 = Ytop + 40 + r * 70;
            poly(ctx, [...pr(Xs, y0, za), ...pr(Xs, y0, zb), ...pr(Xs, y0 + 38, zb), ...pr(Xs, y0 + 38, za)]); ctx.fillStyle = wc; ctx.fill();
          }
          ctx.restore();
        }
      };
      building(-380, -170, -260, 2.9, 4.4, q(4), q(5), q(5, 1.2), ['#6d5bd0', '#4c3fa3']);
      building(-410, -170, -140, 1, 2.6, q(4), q(5), q(5, 1.2), ['#e07a5f', '#b4573f']);
      ctx.restore();
      // Horizon and vanishing point on top.
      strokeQ([FX0, HY, FX1, HY], q(0), 'rgba(34,211,238,0.95)', 3);
      if (q(0) >= 1) label(ctx, 'Horizon line = eye level', FX1 - 14, HY - 20, { size: 20, weight: 700, fill: colour > 0.5 ? '#0b3b4a' : 'cyan', align: 'right' });
      if (q(1) > 0) {
        const s = pop(u, S[1], 0.5);
        circ(ctx, VX, HY, 9 * s, 'red', '#ffffff', 2);
        ctx.save(); ctx.globalAlpha *= clamp(s);
        line(ctx, VX, Y0 + 112, VX, HY - 16, colour > 0.5 ? 'rgba(11,16,36,0.6)' : 'rgba(251,113,133,0.8)', 2, [5, 6]);
        label(ctx, 'Vanishing point', VX, Y0 + 96, { size: 20, weight: 800, fill: colour > 0.5 ? '#9f1239' : 'red' });
        ctx.restore();
      }
      const CAP = ['Draw the horizon line at eye level', 'Put a vanishing point on the horizon', 'Orthogonals: lines that run to the vanishing point', 'The road edges follow two orthogonals', 'Front faces are flat rectangles', 'Side walls shrink back towards the point', 'Same-size posts look smaller further away', 'Add colour: every receding line meets at one point'];
      const ci = clamp(st, 0, 7);
      if (st >= 0) chip(ctx, `${ci + 1}. ${CAP[ci]}`, cx, Y0 + 664, ['cyan', 'red', 'red', 'ink', 'orange', 'orange', 'yellow', 'green'][ci], 20);
      ctx.restore();
    },

    // Seven art movements down a timeline, each with a tiny painting in its style.
    'art-movements'(b, ctx, it, t) {
      const k = b.clock;
      const MV = [
        ['c. 1400–1600', 'Renaissance', 'Leonardo, Michelangelo: perspective, real faces', '#fbbf24'],
        ['c. 1600–1750', 'Baroque', 'Caravaggio, Rembrandt: drama, light and dark', '#f97316'],
        ['c. 1790–1850', 'Romanticism', 'Turner, Friedrich: wild nature, big feelings', '#60a5fa'],
        ['1870s–1880s', 'Impressionism', 'Monet, Renoir: quick dabs, outdoor light', '#34d399'],
        ['1907–1920s', 'Cubism', 'Picasso, Braque: many viewpoints at once', '#a8a29e'],
        ['1920s–1950s', 'Surrealism', 'Dalí, Magritte: dreams, impossible scenes', '#c084fc'],
        ['1950s–1960s', 'Pop Art', 'Warhol, Lichtenstein: comics, adverts, dots', '#fb7185'],
      ];
      const RH = 86; const RY = (i) => Y0 + 94 + i * RH;
      const act = t < 1.8 ? -1 : Math.floor(cycle(t, MV.length * 2.4, 1.8) / 2.4);
      const FW = 132; const FH = 70; const FXL = X1 - FW - 12;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Art movements through time');
      const LX = X0 + 150;
      line(ctx, LX, RY(0) - 30, LX, RY(0) - 30 + (RY(6) - RY(0) + 60) * after(t, 0, 1.4), 'rgba(140,170,255,0.45)', 4);
      const mini = (i, x, y, w, h) => {
        ctx.save(); rounded(ctx, x, y, w, h, 6); ctx.clip();
        if (i === 0) {
          ctx.fillStyle = '#cfe3f0'; ctx.fillRect(x, y, w, h);
          const hy = y + h * 0.45; const vx = x + w / 2;
          ctx.fillStyle = '#e8d3a8'; ctx.fillRect(x, hy, w, h - (hy - y));
          ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1.2; ctx.beginPath();
          for (let j = -6; j <= 6; j++) { ctx.moveTo(vx, hy); ctx.lineTo(vx + j * 26, y + h); }
          for (let j = 1; j <= 5; j++) { const yy = hy + (h * 0.55) * (1 - 1 / (1 + j * 0.6)) * 1.6; if (yy < y + h) { ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); } }
          ctx.stroke();
          ctx.fillStyle = '#b8a07a'; ctx.fillRect(x + 8, y, 14, h); ctx.fillRect(x + w - 22, y, 14, h);
          ctx.strokeStyle = '#b8a07a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(vx, y + 30, w / 2 - 15, PI, TAU); ctx.stroke();
          ctx.fillStyle = '#7a3b2e'; ctx.beginPath(); ctx.moveTo(vx - 9, y + h * 0.78); ctx.lineTo(vx + 9, y + h * 0.78); ctx.lineTo(vx + 4, y + h * 0.5); ctx.lineTo(vx - 4, y + h * 0.5); ctx.fill(); circ(ctx, vx, y + h * 0.44, 4.5, '#e0b48a');
        } else if (i === 1) {
          ctx.fillStyle = '#120a05'; ctx.fillRect(x, y, w, h);
          const fl = 0.85 + 0.15 * Math.sin(k * 9) * Math.sin(k * 5.3);
          const g = ctx.createRadialGradient(x + w * 0.42, y + h * 0.4, 2, x + w * 0.42, y + h * 0.4, 60 * fl);
          g.addColorStop(0, 'rgba(255,214,140,0.9)'); g.addColorStop(1, 'rgba(255,214,140,0)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
          ctx.fillStyle = '#8b1e1e'; ctx.beginPath(); ctx.moveTo(x + w * 0.42 - 22, y + h); ctx.quadraticCurveTo(x + w * 0.42, y + h * 0.45, x + w * 0.42 + 26, y + h); ctx.fill();
          circ(ctx, x + w * 0.42, y + h * 0.42, 9, '#e8b98a');
          ctx.fillStyle = '#fff3c4'; ctx.fillRect(x + w * 0.78 - 2, y + h * 0.5, 4, 14); circ(ctx, x + w * 0.78, y + h * 0.47, 3 * fl, '#ffb020');
        } else if (i === 2) {
          const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, '#3b3355'); g.addColorStop(1, '#8a7f9e'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
          if (mod(k, 3.1) < 0.12) { line(ctx, x + w * 0.7, y, x + w * 0.62, y + h * 0.3, '#fffbe0', 2); line(ctx, x + w * 0.62, y + h * 0.3, x + w * 0.68, y + h * 0.45, '#fffbe0', 2); }
          const tilt = Math.sin(k * 1.6) * 0.18; const sx = x + w * 0.45; const sy = y + h * 0.62 + Math.sin(k * 1.6 + 1) * 2;
          ctx.save(); ctx.translate(sx, sy); ctx.rotate(tilt); ctx.fillStyle = '#2a1a0e'; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.lineTo(11, 6); ctx.lineTo(-11, 6); ctx.fill(); line(ctx, 0, 0, 0, -20, '#2a1a0e', 2); ctx.fillStyle = '#e8e1cf'; ctx.beginPath(); ctx.moveTo(1, -19); ctx.lineTo(13, -4); ctx.lineTo(1, -4); ctx.fill(); ctx.restore();
          for (let L = 0; L < 3; L++) { ctx.fillStyle = ['#1e4a5a', '#245c6e', '#2d7086'][L]; ctx.beginPath(); ctx.moveTo(x, y + h); for (let j = 0; j <= 20; j++) { const xx = x + (j / 20) * w; ctx.lineTo(xx, y + h * (0.66 + L * 0.11) + Math.sin(j * 0.9 + k * (2 + L) + L) * 3.5); } ctx.lineTo(x + w, y + h); ctx.fill(); }
        } else if (i === 3) {
          ctx.fillStyle = '#5b7a99'; ctx.fillRect(x, y, w, h);
          for (let j = 0; j < 70; j++) { const r1 = rnd(j * 3 + 1); const r2 = rnd(j * 3 + 2); const sh = Math.sin(k * 2 + j) * 1.5; ctx.fillStyle = ['#8fb0c9', '#3f5e7d', '#a6c4b8', '#6d8fa8', '#c9b28f'][j % 5]; ctx.fillRect(x + r1 * w + sh, y + r2 * h, 9, 3); }
          const sy = y + h * 0.36; circ(ctx, x + w * 0.62, sy, 8, '#ff6a2a');
          for (let j = 0; j < 6; j++) { ctx.fillStyle = `rgba(255,120,50,${0.85 - j * 0.12})`; ctx.fillRect(x + w * 0.62 - 7 + Math.sin(k * 3 + j) * 3, sy + 14 + j * 7, 14 - j, 3); }
          ctx.fillStyle = '#1e2c3d'; ctx.beginPath(); ctx.ellipse(x + w * 0.3, y + h * 0.72, 12, 3, 0, 0, TAU); ctx.fill(); line(ctx, x + w * 0.3, y + h * 0.72, x + w * 0.3 + 6, y + h * 0.56, '#1e2c3d', 1.5);
        } else if (i === 4) {
          ctx.fillStyle = '#c8b99a'; ctx.fillRect(x, y, w, h);
          const sh = Math.sin(k * 0.8) * 3;
          const P = [[[0.1, 0.1], [0.5, 0.0], [0.45, 0.6], [0.05, 0.7], '#8a7356'], [[0.4, 0.15], [0.9, 0.2], [0.8, 0.85], [0.35, 0.7], '#6e6a62'], [[0.2, 0.5], [0.6, 0.4], [0.7, 1.0], [0.15, 0.95], '#a38b62'], [[0.6, 0.0], [1.0, 0.05], [0.95, 0.5], [0.65, 0.45], '#4d4a44']];
          P.forEach(([a, b2, c2, d, col], j) => { ctx.fillStyle = col; ctx.globalAlpha *= 0.85; ctx.beginPath(); ctx.moveTo(x + a[0] * w + sh * (j % 2 ? 1 : -1), y + a[1] * h); ctx.lineTo(x + b2[0] * w, y + b2[1] * h); ctx.lineTo(x + c2[0] * w - sh, y + c2[1] * h); ctx.lineTo(x + d[0] * w, y + d[1] * h); ctx.fill(); ctx.globalAlpha /= 0.85; });
          circ(ctx, x + w * 0.42, y + h * 0.55, 11, '#2b2620'); ctx.strokeStyle = '#2b2620'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + w * 0.42 + 4, y + h * 0.55, 20, -1.2, 1.2); ctx.stroke();
          line(ctx, x + w * 0.5, y + h * 0.5, x + w * 0.92, y + h * 0.2, '#2b2620', 4);
        } else if (i === 5) {
          const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, '#6fa8dc'); g.addColorStop(0.55, '#f6d7a7'); g.addColorStop(1, '#d9a066'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
          line(ctx, x + 20, y + h, x + 30, y + h * 0.4, '#5a3d1e', 3); line(ctx, x + 30, y + h * 0.4, x + 70, y + h * 0.32, '#5a3d1e', 2.5);
          const drip = 6 + Math.sin(k * 1.5) * 4;
          ctx.fillStyle = '#e8d38a'; ctx.strokeStyle = '#8a6d1e'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(x + 38, y + h * 0.36); ctx.quadraticCurveTo(x + 58, y + h * 0.18, x + 74, y + h * 0.33);
          ctx.quadraticCurveTo(x + 80, y + h * 0.55 + drip, x + 72, y + h * 0.62 + drip); ctx.quadraticCurveTo(x + 62, y + h * 0.5, x + 52, y + h * 0.52); ctx.quadraticCurveTo(x + 42, y + h * 0.46, x + 38, y + h * 0.36); ctx.fill(); ctx.stroke();
          line(ctx, x + 58, y + h * 0.36, x + 62, y + h * 0.28, '#3b2a10', 1.5); line(ctx, x + 58, y + h * 0.36, x + 66, y + h * 0.4, '#3b2a10', 1.5);
          ctx.fillStyle = '#7a5230'; ctx.beginPath(); ctx.ellipse(x + w * 0.78, y + h * 0.82, 16, 4, 0, 0, TAU); ctx.fill();
          circ(ctx, x + w * 0.78, y + h * 0.62 + Math.sin(k * 1.2) * 3, 8, '#f3f0e6');
        } else {
          ctx.fillStyle = '#ffe14d'; ctx.fillRect(x, y, w, h);
          for (let r = 0; r < 9; r++) for (let c = 0; c < 17; c++) circ(ctx, x + c * 8 + (r % 2) * 4, y + r * 8 + 2, 2.2 + 0.6 * Math.sin(k * 3 + c * 0.5 + r * 0.4), '#ff4d6d');
          const s = 1 + 0.08 * Math.sin(k * 4);
          ctx.save(); ctx.translate(x + w * 0.5, y + h * 0.5); ctx.scale(s, s);
          ctx.beginPath(); for (let j = 0; j < 20; j++) { const a = (j / 20) * TAU; const rr = j % 2 ? 20 : 33; if (j) ctx.lineTo(Math.cos(a) * rr * 1.3, Math.sin(a) * rr * 0.9); else ctx.moveTo(Math.cos(a) * rr * 1.3, Math.sin(a) * rr * 0.9); } ctx.closePath();
          ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#111111'; ctx.lineWidth = 2.5; ctx.stroke();
          label(ctx, 'POP!', 0, 1, { size: 20, weight: 900, fill: '#e11d48' });
          ctx.restore();
        }
        ctx.restore();
      };
      MV.forEach(([yr, name, info, c], i) => {
        const q = after(t, 0.2 + i * 0.18, 0.5); if (q <= 0) return;
        const y = RY(i); const on = i === act;
        ctx.save(); ctx.globalAlpha *= q; ctx.translate((1 - q) * 30, 0);
        if (on) { ctx.fillStyle = tint(c, 0.12); rounded(ctx, X0 + 4, y - RH / 2 + 4, FIG.w - 8, RH - 8, 14); ctx.fill(); }
        label(ctx, yr, X0 + 8, y, { size: 18, weight: 600, fill: on ? 'ink' : 'muted', align: 'left' });
        circ(ctx, LX, y, on ? 11 : 8, c, DARK, 3);
        label(ctx, name, LX + 24, y - 15, { size: 22, weight: 800, fill: c, align: 'left' });
        label(ctx, info, LX + 24, y + 15, { size: 18, weight: 500, fill: on ? 'ink' : 'muted', align: 'left' });
        mini(i, FXL, y - FH / 2, FW, FH);
        ctx.strokeStyle = on ? c : '#a88b4a'; ctx.lineWidth = on ? 4 : 3; rounded(ctx, FXL - 2, y - FH / 2 - 2, FW + 4, FH + 4, 7); ctx.stroke();
        ctx.restore();
      });
      label(ctx, 'Each new movement pushed against the one before', cx, Y1 - 26, { size: 19, weight: 600, fill: 'ink' });
      ctx.restore();
    },

    // A golden rectangle cut into squares with its spiral, the ratio 1.618
    // from Fibonacci numbers, and the same growth in a shell and a sunflower.
    'golden-ratio'(b, ctx, it, t) {
      const PHI = (1 + Math.sqrt(5)) / 2; const k = b.clock;
      const GW = 466; const GH = GW / PHI; const GX = X0 + 26; const GY = Y0 + 100;
      const P = 16; const u = cycle(t, P, 0.2);
      const HUE = ['#fbbf24', '#fb923c', '#f472b6', '#a78bfa', '#60a5fa', '#22d3ee', '#34d399', '#a3e635', '#fbbf24', '#fb923c'];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The golden ratio');
      // Squares and spiral.
      let r = { x: GX, y: GY, w: GW, h: GH };
      const sq = [];
      for (let i = 0; i < 9; i++) {
        const m = i % 4; let s; let x; let y; let ccx; let ccy;
        if (m === 0) { s = r.h; x = r.x; y = r.y; ccx = r.x + s; ccy = r.y + s; r = { x: r.x + s, y: r.y, w: r.w - s, h: r.h }; } else if (m === 1) { s = r.w; x = r.x; y = r.y; ccx = r.x; ccy = r.y + s; r = { x: r.x, y: r.y + s, w: r.w, h: r.h - s }; } else if (m === 2) { s = r.h; x = r.x + r.w - s; y = r.y; ccx = x; ccy = r.y; r = { x: r.x, y: r.y, w: r.w - s, h: r.h }; } else { s = r.w; x = r.x; y = r.y + r.h - s; ccx = r.x + s; ccy = y; r = { x: r.x, y: r.y, w: r.w, h: r.h - s }; }
        sq.push({ s, x, y, ccx, ccy, a0: PI + (m * PI) / 2 });
      }
      sq.forEach((S, i) => {
        const q = after(u, 0.4 + i * 0.45, 0.4); if (q <= 0) return;
        ctx.save(); ctx.globalAlpha *= q;
        ctx.fillStyle = tint(HUE[i], 0.16); ctx.fillRect(S.x, S.y, S.s, S.s);
        ctx.strokeStyle = tint(HUE[i], 0.85); ctx.lineWidth = 2; ctx.strokeRect(S.x, S.y, S.s, S.s);
        ctx.restore();
      });
      ctx.strokeStyle = 'rgba(233,238,255,0.85)'; ctx.lineWidth = 3; ctx.strokeRect(GX, GY, GW, GH);
      const sp = clamp((u - 1.2) / 4.5) * sq.length;
      ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      sq.forEach((S, i) => { const f = clamp(sp - i); if (f <= 0) return; ctx.beginPath(); ctx.arc(S.ccx, S.ccy, S.s, S.a0, S.a0 + (PI / 2) * f); ctx.stroke(); });
      // a and b over the top edge.
      const br = (x0, x1, y, text, c) => { line(ctx, x0 + 3, y + 8, x0 + 3, y, c, 2); line(ctx, x0 + 3, y, x1 - 3, y, c, 2); line(ctx, x1 - 3, y, x1 - 3, y + 8, c, 2); label(ctx, text, (x0 + x1) / 2, y - 16, { size: 22, weight: 800, fill: c }); };
      const qa = after(u, 0.6, 0.5);
      ctx.save(); ctx.globalAlpha *= qa;
      br(GX, GX + GH, GY - 14, 'a', 'yellow'); br(GX + GH, GX + GW, GY - 14, 'b', 'orange');
      ctx.restore();
      // The ratio and Fibonacci.
      const RX = X0 + 520; const RW = X1 - 10 - RX; const mx = RX + RW / 2;
      label(ctx, 'φ ≈ 1.618', mx, GY + 20, { size: 40, weight: 800, fill: '#fde68a' });
      label(ctx, '(a + b) ÷ a = a ÷ b', mx, GY + 70, { size: 20, weight: 600, fill: 'ink' });
      const F = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55];
      const fi = 2 + Math.min(5, Math.floor(clamp((u - 1) / 9) * 6));
      label(ctx, 'Fibonacci: add the last two', mx, GY + 122, { size: 18, weight: 600, fill: 'muted' });
      words(ctx, F.slice(0, 8).map((n, i) => [`${n}${i < 7 ? ', ' : ''}`, i === fi || i === fi - 1 ? 'yellow' : 'ink', i === fi || i === fi - 1 ? 800 : 500]), mx, GY + 152, 19);
      {
        const ratio = F[fi] / F[fi - 1];
        label(ctx, `${F[fi]} ÷ ${F[fi - 1]} = ${ratio.toFixed(3)}`, mx, GY + 200, { size: 26, weight: 800, fill: Math.abs(ratio - PHI) < 0.01 ? 'green' : 'cyan' });
      }
      label(ctx, 'the ratios get closer to φ', mx, GY + 238, { size: 18, weight: 500, fill: 'muted' });
      // Shell and sunflower.
      const PY = Y0 + 410; const PH = 262; const PW = (FIG.w - 36) / 2;
      panel(ctx, X0 + 12, PY, PW, PH, 'orange', 0.06, 16);
      panel(ctx, X0 + 24 + PW, PY, PW, PH, 'yellow', 0.06, 16);
      const SX = X0 + 12 + PW / 2 + 14; const SY = PY + 112; const bS = Math.log(PHI) / (PI / 2); const a = 92;
      const sr = (th) => a * Math.exp(bS * th);
      ctx.save(); ctx.translate(SX, SY); ctx.rotate(-0.3);
      ctx.beginPath();
      for (let th = -4 * PI; th <= 0; th += 0.08) { const rr = sr(th); ctx.lineTo(Math.cos(th) * rr, Math.sin(th) * rr * 0.92); }
      for (let th = 0; th >= -2 * PI; th -= 0.08) { const rr = sr(th - 2 * PI); ctx.lineTo(Math.cos(th) * rr, Math.sin(th) * rr * 0.92); }
      ctx.closePath();
      const gS = ctx.createRadialGradient(0, 0, 4, 0, 0, a); gS.addColorStop(0, '#fff7e6'); gS.addColorStop(1, '#f2c48d'); ctx.fillStyle = gS; ctx.fill();
      ctx.strokeStyle = '#9a5b2c'; ctx.lineWidth = 2.5; ctx.stroke();
      for (let th = -0.2; th > -2 * PI; th -= PI / 7) { const r1 = sr(th); const r0 = sr(th - 2 * PI); ctx.strokeStyle = 'rgba(160,82,45,0.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(Math.cos(th) * r0, Math.sin(th) * r0 * 0.92); ctx.quadraticCurveTo(Math.cos(th + 0.25) * (r0 + r1) / 2, Math.sin(th + 0.25) * (r0 + r1) / 2 * 0.92, Math.cos(th) * r1, Math.sin(th) * r1 * 0.92); ctx.stroke(); }
      const tr = mod(k * 0.5, 1);
      ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 3; ctx.beginPath();
      for (let th = -4 * PI; th <= -4 * PI + tr * 4 * PI; th += 0.06) { const rr = sr(th); ctx.lineTo(Math.cos(th) * rr, Math.sin(th) * rr * 0.92); }
      ctx.stroke();
      ctx.restore();
      label(ctx, 'Shell: a spiral that keeps', X0 + 12 + PW / 2, PY + PH - 46, { size: 18, weight: 700, fill: 'orange' });
      label(ctx, 'its shape as it grows', X0 + 12 + PW / 2, PY + PH - 22, { size: 18, weight: 700, fill: 'orange' });
      const FXc = X0 + 24 + PW * 1.5; const FYc = PY + 102; const N = 300;
      const shown = Math.floor(N * clamp((u - 0.5) / 7));
      for (let j = 0; j < 22; j++) { const aa = (j / 22) * TAU + k * 0.05; ctx.save(); ctx.translate(FXc + Math.cos(aa) * 78, FYc + Math.sin(aa) * 78); ctx.rotate(aa); ctx.fillStyle = j % 2 ? '#fbbf24' : '#f59e0b'; ctx.beginPath(); ctx.ellipse(5, 0, 13, 6, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      circ(ctx, FXc, FYc, 72, '#3b2410');
      const GA = PI * (3 - Math.sqrt(5));
      for (let n = 1; n <= shown; n++) { const rr = 3.95 * Math.sqrt(n); const aa = n * GA; const arm = n % 21 === Math.floor(k * 2) % 21; circ(ctx, FXc + Math.cos(aa) * rr, FYc + Math.sin(aa) * rr, 2.6, arm ? '#fde68a' : mix('#a16207', '#4a2c0f', n / N)); }
      label(ctx, 'Sunflower: each new seed', FXc, PY + PH - 46, { size: 18, weight: 700, fill: 'yellow' });
      label(ctx, 'turns 137.5°, the golden angle', FXc, PY + PH - 22, { size: 18, weight: 700, fill: 'yellow' });
      ctx.restore();
    },

    // ─── Writing ──────────────────────────────────────────────────────────

    // Subject, verb and object blocks click together into a sentence; then
    // an adjective slides into the subject and an adverb before the verb.
    'sentence-builder'(b, ctx, it, t) {
      const DET = /^(the|a|an|my|our|his|her|their|this|that|your|its)$/i;
      const C = it._c || (it._c = (() => {
        let S = str(it.subject, ''); let V = str(it.verb, ''); let O = str(it.object, '');
        if (!(S && V && O) && typeof it.sentence === 'string') {
          const w = it.sentence.replace(/[.!?]+\s*$/, '').trim().split(/\s+/);
          const si = DET.test(w[0] || '') ? 2 : 1;
          if (w.length > si + 1) { S = w.slice(0, si).join(' '); V = w[si]; O = w.slice(si + 1).join(' '); }
        }
        if (!(S && V && O)) { S = 'The dog'; V = 'chased'; O = 'the ball'; }
        S = S[0].toUpperCase() + S.slice(1); O = O.replace(/[.!?]+$/, '');
        const sw = S.split(/\s+/); const hasDet = sw.length > 1 && DET.test(sw[0]);
        let adj = str(it.adjective, 'happy'); if (!hasDet) adj = adj[0].toUpperCase() + adj.slice(1);
        return { det: hasDet ? sw[0] : '', noun: hasDet ? sw.slice(1).join(' ') : S, V, O, adj, adv: str(it.adverb, 'quickly'), pic: /^the dog$/i.test(S) && /^chased$/i.test(V) && /^the ball$/i.test(O) };
      })());
      const k = b.clock; const P = 13.5; const u = cycle(t, P, 0.2); const out = 1 - smooth((u - (P - 0.6)) / 0.5);
      const T = { S: 0.3, V: 1.5, O: 2.7, D: 3.9, A: 5.4, Av: 7.2, R: 9.0 };
      const stage = u < T.V ? 0 : u < T.O ? 1 : u < T.D ? 2 : u < T.A ? 3 : u < T.Av ? 4 : u < T.R ? 5 : 6;
      const CB = { S: '#5b8cff', V: '#ff9f43', O: '#34d399', A: '#a78bfa', Av: '#2dd4bf', D: '#fbbf24' };
      // Sizes: shrink the font if the full sentence would not fit.
      let FS = 30; const pad = 18; const gap = 12;
      const full = () => 2 * pad + (C.det ? tw(ctx, C.det, FS, 700) + 10 : 0) + tw(ctx, C.adj, FS - 4, 700) + 34 + tw(ctx, C.noun, FS, 700) + gap + tw(ctx, C.adv, FS, 700) + 2 * pad + gap + tw(ctx, C.V, FS, 700) + 2 * pad + gap + tw(ctx, C.O, FS, 700) + 2 * pad + gap + 40;
      while (FS > 20 && full() > FIG.w - 100) FS -= 2;
      const slot = (at) => smooth((u - at) / 0.45);
      const aQ = smooth((u - T.A - 0.2) / 0.6); const vQ = smooth((u - T.Av - 0.2) / 0.6);
      const wDet = C.det ? tw(ctx, C.det, FS, 700) + 10 : 0; const wAdjB = tw(ctx, C.adj, FS - 4, 700) + 24; const wNoun = tw(ctx, C.noun, FS, 700);
      const blocks = [
        { id: 'S', w: 2 * pad + wDet + aQ * (wAdjB + 10) + wNoun, f: slot(T.S), at: T.S, role: 'Subject', c: CB.S },
        { id: 'Av', w: tw(ctx, C.adv, FS, 700) + 2 * pad, f: vQ, at: T.Av + 0.3, role: 'Adverb', c: CB.Av, above: true },
        { id: 'V', w: tw(ctx, C.V, FS, 700) + 2 * pad, f: slot(T.V), at: T.V, role: 'Verb', c: CB.V },
        { id: 'O', w: tw(ctx, C.O, FS, 700) + 2 * pad, f: slot(T.O), at: T.O, role: 'Object', c: CB.O },
        { id: 'D', w: 40, f: slot(T.D), at: T.D, role: 'Full stop', c: CB.D },
      ];
      const total = blocks.reduce((a, B) => a + (B.w + gap) * B.f, 0) - gap;
      let x = cx - total / 2; const RY = Y0 + 172; const BH = 60;
      ctx.save(); fade(ctx, t); ctx.globalAlpha *= out;
      title(ctx, it.label || 'Building a sentence');
      blocks.forEach((B) => {
        const fly = pop(u, B.at + 0.05, 0.55); const bx = x; x += (B.w + gap) * B.f;
        if (fly <= 0.01) return;
        const y = RY - (1 - Math.min(1, fly)) * 110;
        ctx.save(); ctx.globalAlpha *= clamp(fly);
        ctx.fillStyle = tint(B.c, 0.22); ctx.strokeStyle = B.c; ctx.lineWidth = 3;
        rounded(ctx, bx, y - BH / 2, B.w, BH, 14); ctx.fill(); ctx.stroke();
        if (B.id === 'S') {
          let tx = bx + pad;
          if (C.det) { const capOn = stage === 3; label(ctx, C.det[0], tx, y, { size: FS, weight: 700, fill: capOn ? 'yellow' : 'ink', align: 'left' }); label(ctx, C.det.slice(1), tx + tw(ctx, C.det[0], FS, 700), y, { size: FS, weight: 700, fill: 'ink', align: 'left' }); tx += wDet; }
          if (aQ > 0.01) {
            const ay = y - (1 - pop(u, T.A + 0.4, 0.5)) * 120;
            ctx.save(); ctx.globalAlpha *= clamp(aQ * 1.5);
            ctx.fillStyle = tint(CB.A, 0.35); ctx.strokeStyle = CB.A; ctx.lineWidth = 2.5; rounded(ctx, tx, ay - (BH - 16) / 2, wAdjB * aQ, BH - 16, 10); ctx.fill(); ctx.stroke();
            if (aQ > 0.6) label(ctx, C.adj, tx + 12, ay, { size: FS - 4, weight: 700, fill: '#ffffff', align: 'left' });
            ctx.restore();
            tx += aQ * (wAdjB + 10);
          }
          label(ctx, C.noun, tx, y, { size: FS, weight: 700, fill: 'ink', align: 'left' });
        } else {
          const text = B.id === 'D' ? '.' : B.id === 'V' ? C.V : B.id === 'O' ? C.O : C.adv;
          if (B.id !== 'Av' || vQ > 0.6) label(ctx, text, bx + B.w / 2, y + (B.id === 'D' ? -6 : 0), { size: B.id === 'D' ? FS + 10 : FS, weight: B.id === 'D' ? 900 : 700, fill: B.id === 'D' ? CB.D : 'ink' });
        }
        // Role label under (or over) the block.
        const ry = B.above ? RY - 54 : RY + 52;
        if (B.id !== 'Av' || vQ > 0.8) label(ctx, B.role, bx + B.w / 2, ry, { size: 19, weight: 700, fill: B.c });
        if (B.id === 'S' && aQ > 0.8) label(ctx, 'Adjective', bx + pad + wDet + wAdjB / 2, RY - 54, { size: 19, weight: 700, fill: CB.A });
        if (B.id === 'S' && stage === 3 && C.det) label(ctx, 'Capital letter', bx + pad + 8, RY - 54, { size: 19, weight: 700, fill: 'yellow', align: 'left' });
        // A click as it lands.
        const ck = (u - B.at - 0.45) / 0.35;
        if (ck > 0 && ck < 1 && B.id !== 'S') { ctx.strokeStyle = tint('yellow', 1 - ck); ctx.lineWidth = 3; for (let j = 0; j < 4; j++) { const a = -PI / 2 + (j - 1.5) * 0.5; ctx.beginPath(); ctx.moveTo(bx - gap / 2 + Math.cos(a) * (36 + ck * 10), RY + Math.sin(a) * (36 + ck * 10) * 0.9); ctx.lineTo(bx - gap / 2 + Math.cos(a) * (48 + ck * 16), RY + Math.sin(a) * (48 + ck * 16) * 0.9); ctx.stroke(); } }
        ctx.restore();
      });
      // The picture: the dog chases the ball (or the three questions for other sentences).
      const gy = Y0 + 515;
      if (C.pic) {
        const sp = 7 + 8 * vQ; const ph = k * sp; const bob = -Math.abs(Math.sin(ph)) * 6;
        ctx.strokeStyle = 'rgba(140,170,255,0.35)'; ctx.lineWidth = 3; ctx.setLineDash([26, 22]); ctx.lineDashOffset = k * sp * 12;
        ctx.beginPath(); ctx.moveTo(X0 + 40, gy); ctx.lineTo(X1 - 40, gy); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
        const dx = cx - 120; const dy = gy + bob;
        if (vQ > 0) for (let j = 0; j < 3; j++) { const len = 40 + j * 16; const xx = dx - 100 - mod(k * 300 + j * 50, 60); line(ctx, xx, dy - 84 + j * 24, xx + len, dy - 84 + j * 24, tint(CB.Av, 0.8 * vQ), 4); }
        [-40, -22, 28, 46].forEach((lx, j) => { const sw = Math.sin(ph + (j % 2 ? PI : 0) + (j > 1 ? 0.6 : 0)) * 0.55; line(ctx, dx + lx, dy - 44, dx + lx + Math.sin(sw) * 26, dy - 4, '#8a5a2b', 9); });
        const wag = Math.sin(k * (8 + 10 * aQ)) * 0.5;
        line(ctx, dx - 56, dy - 66, dx - 56 - Math.cos(0.9 + wag) * 34, dy - 66 - Math.sin(0.9 + wag) * 34, '#b5763b', 8);
        oval(ctx, dx, dy - 58, 66, 30, 0, '#c68642');
        circ(ctx, dx + 68, dy - 92, 30, '#d4945a');
        oval(ctx, dx + 94, dy - 82, 19, 13, 0, '#e8b98a');
        circ(ctx, dx + 110, dy - 87, 6, '#2b1d14');
        oval(ctx, dx + 52, dy - 104, 11, 23, 0.5, '#7a4a24');
        circ(ctx, dx + 78, dy - 101, 5, '#1a1630'); circ(ctx, dx + 76, dy - 103, 1.8, '#ffffff');
        if (aQ > 0.5) { ctx.fillStyle = '#f472b6'; oval(ctx, dx + 98, dy - 68, 6, 8, 0, '#f472b6'); ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(dx + 96, dy - 80, 9, 0.15 * PI, 0.85 * PI); ctx.stroke(); } else line(ctx, dx + 88, dy - 74, dx + 104, dy - 74, '#2b1d14', 2.5);
        const bx = cx + 150; const by = gy - 20 - Math.abs(Math.sin(ph * 0.5)) * 90;
        oval(ctx, bx, gy - 2, 20 * (1 - (gy - 20 - by) / 200), 5, 0, 'rgba(0,0,0,0.35)');
        circ(ctx, bx, by, 20, '#ef4444'); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bx, by, 14, -2.2 + ph * 0.5, -0.9 + ph * 0.5); ctx.stroke();
      } else {
        const Q = [['Who or what?', CB.S], ['Does what?', CB.V], ['To whom or what?', CB.O]];
        Q.forEach(([q, c], i) => { const qx = cx + (i - 1) * 250; const qa = after(u, [T.S, T.V, T.O][i] + 0.3, 0.4); ctx.save(); ctx.globalAlpha *= qa; chip(ctx, q, qx, Y0 + 380, c, 21); if (i < 2) arr(ctx, qx + 95, Y0 + 380, qx + 150, Y0 + 380, 'muted', 3); ctx.restore(); });
      }
      const CAP = [
        ['Subject: who or what the sentence is about', CB.S], ['Verb: the action, what the subject does', CB.V], ['Object: who or what the action happens to', CB.O],
        ['Capital letter + full stop = a complete sentence', CB.D], [`Adjective: describes a noun (what kind of ${C.noun.toLowerCase()}?)`, CB.A], ['Adverb: describes a verb (how did it happen?)', CB.Av],
        ['Subject + verb + object, then add detail', 'ink'],
      ];
      if (u > T.S + 0.3) { label(ctx, CAP[stage][0], cx, Y0 + 606, { size: 22, weight: 800, fill: CAP[stage][1] }); }
      if (stage === 6) label(ctx, 'Adjectives and adverbs make a sentence more vivid', cx, Y0 + 648, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Six punctuation marks, and how each one changes what a sentence means.
    'punctuation-marks'(b, ctx, it, t) {
      const k = b.clock;
      const M = [['.', 'Full stop', '#60a5fa'], ['?', 'Question mark', '#fbbf24'], ['!', 'Exclamation mark', '#fb7185'], [',', 'Comma', '#34d399'], ['’', 'Apostrophe', '#a78bfa'], ['“ ”', 'Speech marks', '#22d3ee']];
      const D = 4.4; const v = cycle(t, D * 6, 1.0); const act = t < 1.0 ? -1 : Math.floor(v / D); const lu = v - act * D;
      const TW = 242; const TH = 74; const L0 = cx - (3 * TW + 2 * 14) / 2;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Punctuation marks');
      M.forEach(([g, name, c], i) => {
        const q = after(t, 0.15 + i * 0.1, 0.4); if (q <= 0) return;
        const x = L0 + (i % 3) * (TW + 14); const y = Y0 + 62 + Math.floor(i / 3) * (TH + 12); const on = i === act;
        ctx.save(); ctx.globalAlpha *= q;
        panel(ctx, x, y, TW, TH, c, on ? 0.24 : 0.06, 14, on ? 3 : 2);
        if (g === '.') circ(ctx, x + 36, y + TH / 2 + 10, 8, c); else label(ctx, g, x + 36, y + TH / 2 + (g === ',' ? -14 : g === '’' || g.startsWith('“') ? 10 : 0), { size: g.length > 1 ? 44 : g === ',' ? 66 : 54, weight: 900, fill: c });
        const avail = TW - 78; const size = tw(ctx, name, 20, 700) > avail ? 18 : 20;
        label(ctx, name, x + 70, y + TH / 2, { size, weight: 700, fill: on ? '#ffffff' : 'ink', align: 'left' });
        ctx.restore();
      });
      // Draw a run of text pieces centred on x; one piece may pop in.
      const run = (parts, y, size = 36, popI = -1, popQ = 1) => {
        const ws = parts.map(([s]) => tw(ctx, s, size, 700)); const tot = ws.reduce((a, c) => a + c * 1, 0);
        let left = cx - tot / 2; const pos = [];
        parts.forEach(([s, c], i) => {
          pos.push([left, ws[i]]);
          if (i === popI) { if (popQ > 0.01) { ctx.save(); ctx.translate(left + ws[i] / 2, y); ctx.scale(popQ, popQ); label(ctx, s, 0, 0, { size: size + 6, weight: 900, fill: c }); ctx.restore(); } } else label(ctx, s, left, y, { size, weight: 700, fill: c, align: 'left' });
          left += ws[i];
        });
        return pos;
      };
      const tick = (x, y, good) => { ctx.strokeStyle = good ? '#34d399' : '#fb7185'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); if (good) { ctx.moveTo(x - 12, y); ctx.lineTo(x - 3, y + 10); ctx.lineTo(x + 14, y - 12); } else { ctx.moveTo(x - 11, y - 11); ctx.lineTo(x + 11, y + 11); ctx.moveTo(x + 11, y - 11); ctx.lineTo(x - 11, y + 11); } ctx.stroke(); };
      const face = (x, y, r, mood) => {
        circ(ctx, x, y, r, '#fcd34d'); const e = r * 0.32;
        if (mood === 1) { line(ctx, x - e - 8, y - r * 0.45, x - e + 6, y - r * 0.52, '#3b2a10', 3); }
        circ(ctx, x - e, y - r * 0.18, mood === 2 ? 5 : 4, '#1a1630'); circ(ctx, x + e, y - r * 0.18, mood === 2 ? 5 : 4, '#1a1630');
        ctx.strokeStyle = '#1a1630'; ctx.lineWidth = 3;
        if (mood === 0) { ctx.beginPath(); ctx.arc(x, y + r * 0.05, r * 0.4, 0.25 * PI, 0.75 * PI); ctx.stroke(); } else if (mood === 1) { circ(ctx, x, y + r * 0.38, r * 0.14, null, '#1a1630', 3); } else { ctx.beginPath(); ctx.arc(x, y + r * 0.08, r * 0.5, 0.05 * PI, 0.95 * PI); ctx.closePath(); ctx.fillStyle = '#9f1239'; ctx.fill(); ctx.stroke(); }
      };
      if (act >= 0 && act <= 2) {
        const [g, , c] = M[act]; const pq = pop(lu, 0.35, 0.45);
        const pos = run([['We won the match', 'ink'], [g, c]], Y0 + 400, 40, 1, pq);
        const x0 = pos[0][0]; const x1 = pos[1][0] + pos[1][1];
        // The voice: falls for a statement, rises for a question, jumps for a shout.
        const pitch = (p) => (act === 0 ? 10 - 18 * smooth((p - 0.7) / 0.3) + 6 * Math.sin(p * PI) : act === 1 ? -6 * Math.sin(p * PI * 0.8) - 32 * smooth((p - 0.65) / 0.35) + 6 : -14 - 14 * Math.abs(Math.sin(p * PI * 2.2)) - 10 * smooth((p - 0.8) / 0.2));
        const dq = clamp((lu - 0.6) / 1.0); const py = Y0 + 318;
        if (dq > 0) {
          ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath();
          for (let j = 0; j <= 40 * dq; j++) { const p = j / 40; const xx = lerp(x0, x1, p); const yy = py + pitch(p); if (j) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); }
          ctx.stroke();
          if (dq >= 1) { const ye = py + pitch(1); const yb = py + pitch(0.95); arr(ctx, lerp(x0, x1, 0.95), yb, x1 + 6, ye + (ye - yb) * 0.3, c, 4); }
          label(ctx, 'voice', x0 - 16, py + pitch(0), { size: 18, weight: 600, fill: 'muted', align: 'right' });
        }
        const fq = pop(lu, 1.0, 0.5);
        if (fq > 0) { ctx.save(); ctx.translate(cx, Y0 + 492); ctx.scale(fq, fq); face(0, 0, 36, act); ctx.restore(); }
        const MEAN = ['A statement: it tells you something', 'A question: it asks something', 'Strong feeling: surprise, joy or a shout'];
        label(ctx, MEAN[act], cx, Y0 + 568, { size: 22, weight: 800, fill: c });
        label(ctx, 'Same words, different mark, different meaning', cx, Y0 + 610, { size: 19, weight: 500, fill: 'muted' });
      } else if (act === 3) {
        const c = M[3][2];
        run([["Let's eat Grandma!", 'ink']], Y0 + 330, 36); tick(cx - 200, Y0 + 330, false);
        label(ctx, 'Uh-oh: Grandma is dinner!', cx, Y0 + 372, { size: 19, weight: 600, fill: 'red' });
        const cq = pop(lu, 0.7, 0.5);
        ctx.save(); ctx.globalAlpha *= after(lu, 0.3, 0.4);
        run([["Let's eat", 'ink'], [',', c], [' Grandma!', 'ink']], Y0 + 450, 36, 1, cq); tick(cx - 218, Y0 + 450, true);
        if (cq >= 1) label(ctx, 'Calling Grandma to come and eat', cx, Y0 + 492, { size: 19, weight: 600, fill: 'green' });
        ctx.restore();
        label(ctx, 'A comma marks a pause and can change the meaning', cx, Y0 + 568, { size: 22, weight: 800, fill: c });
      } else if (act === 4) {
        const c = M[4][2]; const q1 = pop(lu, 0.4, 0.5); const q2 = pop(lu, 1.4, 0.5);
        run([['the dog', 'ink'], ['’', c], ['s bone', 'ink']], Y0 + 330, 36, 1, q1);
        if (q1 >= 1) label(ctx, 'belonging: the bone belongs to the dog', cx, Y0 + 372, { size: 19, weight: 600, fill: c });
        ctx.save(); ctx.globalAlpha *= after(lu, 1.0, 0.4);
        run([['do not  →  don', 'ink'], ['’', c], ['t', 'ink']], Y0 + 450, 36, 1, q2);
        if (q2 >= 1) label(ctx, 'a missing letter: the apostrophe replaces the o', cx, Y0 + 492, { size: 19, weight: 600, fill: c });
        ctx.restore();
        label(ctx, 'Apostrophes show belonging or a missing letter', cx, Y0 + 568, { size: 22, weight: 800, fill: c });
      } else if (act === 5) {
        const c = M[5][2];
        const pos = run([['Sam said, ', 'ink'], ['“', c], ['Let’s go!', 'yellow'], ['”', c]], Y0 + 400, 38, -1);
        const bq = after(lu, 1.0, 0.5);
        if (bq > 0) {
          const bx0 = pos[1][0] - 2; const bx1 = pos[3][0] + pos[3][1] + 10;
          ctx.save(); ctx.globalAlpha *= bq; ctx.strokeStyle = c; ctx.lineWidth = 3;
          rounded(ctx, bx0, Y0 + 368, bx1 - bx0, 64, 18); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(bx0 + 28, Y0 + 432); ctx.lineTo(bx0 + 10, Y0 + 456); ctx.lineTo(bx0 + 48, Y0 + 432); ctx.stroke();
          label(ctx, 'the exact words spoken', (bx0 + bx1) / 2, Y0 + 336, { size: 19, weight: 700, fill: c });
          ctx.restore();
        }
        const wv = Math.sin(k * 6) * 0.5 + 0.5;
        const sx = pos[0][0] + 60; circ(ctx, sx, Y0 + 470, 16, '#f1c27d'); circ(ctx, sx - 5, Y0 + 467, 2.5, '#1a1630'); circ(ctx, sx + 5, Y0 + 467, 2.5, '#1a1630'); oval(ctx, sx, Y0 + 476, 5, 2 + wv * 3, 0, '#9f1239');
        ctx.fillStyle = '#22d3ee'; rounded(ctx, sx - 16, Y0 + 488, 32, 34, 10); ctx.fill();
        label(ctx, 'Speech marks go round what someone says', cx, Y0 + 568, { size: 22, weight: 800, fill: c });
        label(ctx, 'The ! stays inside the closing speech mark', cx, Y0 + 610, { size: 19, weight: 500, fill: 'muted' });
      }
      ctx.restore();
    },

    // Five devices, each acted out: simile, metaphor, personification,
    // alliteration and onomatopoeia.
    'figurative-language'(b, ctx, it, t) {
      const k = b.clock;
      const S = (w) => [['S', 'purple', 800], [w, 'ink', 600]];
      const DEV = [
        ['Simile', '#fbbf24', [['Her smile was ', 'ink'], ['as bright as', 'yellow', 800], [' the sun.', 'ink']], 'Compares two things using "like" or "as"', 'Look for: like… or as… as'],
        ['Metaphor', '#fb923c', [['The classroom ', 'ink'], ['was a zoo', 'orange', 800], ['.', 'ink']], 'Says one thing IS another, to compare them', 'Look for: is or was + something it is not'],
        ['Personification', '#34d399', [['The wind ', 'ink'], ['whispered', 'green', 800], [' through the trees.', 'ink']], 'Gives human actions to something that is not human', 'Look for: things acting like people'],
        ['Alliteration', '#a78bfa', [...S('even '), ['s', 'purple', 800], ['illy ', 'ink'], ['s', 'purple', 800], ['nakes ', 'ink'], ['s', 'purple', 800], ['lid ', 'ink'], ['s', 'purple', 800], ['lowly.', 'ink']], 'Words close together start with the same sound', 'Look for: repeated first sounds'],
        ['Onomatopoeia', '#22d3ee', [['Buzz', 'cyan', 800], [' went the bee, then ', 'ink'], ['BANG', 'cyan', 800], [' went the drum!', 'ink']], 'A word that sounds like the noise it names', 'Look for: sound words'],
      ];
      const D = 4.6; const v = cycle(t, D * 5, 0.8); const act = t < 0.8 ? 0 : Math.floor(v / D); const lu = t < 0.8 ? t : v - act * D;
      const [, c, ex, def, look] = DEV[act];
      const PX = X0 + 238; const PY = Y0 + 62; const PW = X1 - 8 - PX; const PH = 352;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Figurative language');
      DEV.forEach(([name, dc], i) => {
        const y = Y0 + 96 + i * 71; const on = i === act;
        panel(ctx, X0 + 6, y - 26, 218, 52, dc, on ? 0.26 : 0.06, 26, on ? 3 : 2);
        label(ctx, name, X0 + 115, y, { size: name.length > 12 ? 19 : 21, weight: 800, fill: on ? '#ffffff' : dc });
        if (on) { ctx.fillStyle = dc; poly(ctx, [X0 + 228, y - 10, X0 + 236, y, X0 + 228, y + 10]); ctx.fill(); }
      });
      const sq = after(lu, 0, 0.4);
      ctx.save(); ctx.globalAlpha *= sq;
      panel(ctx, PX, PY, PW, PH, c, 0.07, 18);
      ctx.save(); rounded(ctx, PX, PY, PW, PH, 18); ctx.clip();
      const mx = PX + PW / 2; const my = PY + PH / 2;
      if (act === 0) {
        const pulse = 0.5 + 0.5 * Math.sin(k * 3);
        const fx = PX + PW * 0.19; const sx = PX + PW * 0.81; const yy = my + 10;
        circ(ctx, fx, yy, 72 + pulse * 8, 'rgba(251,191,36,0.13)');
        ctx.fillStyle = '#5b3a1e'; ctx.beginPath(); ctx.arc(fx, yy - 6, 64, PI, TAU); ctx.fill(); ctx.fillRect(fx - 64, yy - 6, 16, 62); ctx.fillRect(fx + 48, yy - 6, 16, 62);
        circ(ctx, fx, yy + 4, 54, '#e0ac69');
        circ(ctx, fx - 19, yy - 8, 5.5, '#1a1630'); circ(ctx, fx + 19, yy - 8, 5.5, '#1a1630');
        circ(ctx, fx - 30, yy + 14, 8, 'rgba(255,120,150,0.5)'); circ(ctx, fx + 30, yy + 14, 8, 'rgba(255,120,150,0.5)');
        ctx.beginPath(); ctx.arc(fx, yy + 8, 26, 0.1 * PI, 0.9 * PI); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#7a2e1e'; ctx.lineWidth = 3; ctx.stroke();
        circ(ctx, sx, yy, 72 + pulse * 8, 'rgba(251,191,36,0.13)');
        ctx.save(); ctx.translate(sx, yy); ctx.rotate(k * 0.4); ctx.fillStyle = '#fbbf24';
        for (let j = 0; j < 12; j++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(50, -8); ctx.lineTo(70 + pulse * 5, 0); ctx.lineTo(50, 8); ctx.fill(); }
        ctx.restore(); circ(ctx, sx, yy, 47, '#fcd34d');
        label(ctx, 'as bright as', mx, yy - 22, { size: 21, weight: 800, fill: 'yellow' });
        arr(ctx, mx - 40, yy + 12, mx - 64, yy + 12, 'yellow', 4); arr(ctx, mx + 40, yy + 12, mx + 64, yy + 12, 'yellow', 4); line(ctx, mx - 44, yy + 12, mx + 44, yy + 12, 'yellow', 4);
      } else if (act === 1) {
        ctx.fillStyle = '#1f4d3a'; rounded(ctx, PX + 60, PY + 28, PW - 120, 96, 8); ctx.fill(); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 6; ctx.stroke();
        label(ctx, 'Quiet please!', mx, PY + 76, { size: 26, weight: 700, fill: 'rgba(240,240,230,0.85)' });
        const deskY = PY + PH - 60;
        for (let j = 0; j < 3; j++) {
          const ax = PX + PW * (0.2 + j * 0.3); ctx.fillStyle = '#a0703c'; ctx.fillRect(ax - 62, deskY, 124, 14); ctx.fillRect(ax - 54, deskY + 14, 8, 40); ctx.fillRect(ax + 46, deskY + 14, 8, 40);
          const hop = Math.abs(Math.sin(k * 4 + j * 1.3)) * 40; const ay = deskY - 44 - hop;
          if (j === 0) { circ(ctx, ax - 36, ay - 6, 15, '#8b5a2b'); circ(ctx, ax + 36, ay - 6, 15, '#8b5a2b'); circ(ctx, ax, ay, 40, '#8b5a2b'); oval(ctx, ax, ay + 10, 26, 22, 0, '#e8c39e'); circ(ctx, ax - 12, ay - 6, 5, '#1a1630'); circ(ctx, ax + 12, ay - 6, 5, '#1a1630'); ctx.strokeStyle = '#5a3412'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ax, ay + 12, 11, 0.1 * PI, 0.9 * PI); ctx.stroke(); } else if (j === 1) {
            const flap = Math.sin(k * 14) * 0.6; ctx.save(); ctx.translate(ax, ay); oval(ctx, 0, 6, 30, 38, 0, '#22c55e'); ctx.save(); ctx.rotate(-0.4 - flap); oval(ctx, -30, 0, 26, 10, 0, '#ef4444'); ctx.restore(); ctx.save(); ctx.rotate(0.4 + flap); oval(ctx, 30, 0, 26, 10, 0, '#3b82f6'); ctx.restore(); circ(ctx, 0, -28, 22, '#22c55e'); circ(ctx, 8, -32, 5, '#ffffff'); circ(ctx, 9, -32, 2.5, '#1a1630'); ctx.fillStyle = '#fbbf24'; poly(ctx, [16, -30, 34, -22, 16, -16]); ctx.fill(); ctx.restore();
          } else { for (let m = 0; m < 14; m++) { const a = (m / 14) * TAU; circ(ctx, ax + Math.cos(a) * 34, ay + Math.sin(a) * 34, 16, m % 2 ? '#d97706' : '#b45309'); } circ(ctx, ax, ay, 34, '#fbbf24'); circ(ctx, ax - 12, ay - 6, 5, '#1a1630'); circ(ctx, ax + 12, ay - 6, 5, '#1a1630'); oval(ctx, ax, ay + 10, 8, 6, 0, '#7c2d12'); const roar = Math.max(0, Math.sin(k * 4 + j * 1.3)); oval(ctx, ax, ay + 22, 10, 3 + roar * 6, 0, '#7c2d12'); }
        }
      } else if (act === 2) {
        const tx = PX + PW * 0.72; const ty = PY + PH - 30; const sway = Math.sin(k * 2.2) * 0.07;
        ctx.save(); ctx.translate(tx, ty); ctx.rotate(sway);
        ctx.fillStyle = '#7a4a24'; poly(ctx, [-16, 0, 16, 0, 9, -150, -9, -150]); ctx.fill();
        for (const [ox, oy, r] of [[0, -200, 70], [-56, -160, 52], [56, -160, 52], [-36, -232, 46], [36, -232, 46]]) circ(ctx, ox, oy, r, '#16a34a');
        circ(ctx, -18, -190, 6, '#14532d'); circ(ctx, 18, -190, 6, '#14532d'); ctx.strokeStyle = '#14532d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -172, 12, 0.15 * PI, 0.85 * PI); ctx.stroke();
        ctx.restore();
        const wx = PX + PW * 0.2; const wy = PY + 120;
        ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); for (const [dx2, dy2, r] of [[-44, 10, 34], [-10, -16, 44], [34, -4, 38], [60, 16, 28], [6, 22, 34]]) { ctx.moveTo(wx + dx2 + r, wy + dy2); ctx.arc(wx + dx2, wy + dy2, r, 0, TAU); } ctx.fill();
        circ(ctx, wx - 10, wy - 4, 5, '#1a1630'); circ(ctx, wx + 22, wy - 4, 5, '#1a1630'); circ(ctx, wx + 46, wy + 14, 8, '#475569');
        ctx.strokeStyle = 'rgba(186,230,253,0.85)'; ctx.lineWidth = 4; ctx.setLineDash([30, 18]); ctx.lineDashOffset = -k * 80;
        for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(wx + 60, wy + 14 + j * 22); ctx.bezierCurveTo(wx + 140, wy - 10 + j * 30, wx + 200, wy + 60 + j * 20, tx - 70, wy + 40 + j * 34); ctx.stroke(); }
        ctx.setLineDash([]); ctx.lineDashOffset = 0;
        label(ctx, 'shhh…', wx + 150, wy + 150, { size: 24, weight: 700, fill: 'rgba(186,230,253,0.9)' });
        for (let j = 0; j < 4; j++) { const p = mod(k * 0.35 + j / 4, 1); ctx.save(); ctx.translate(lerp(tx - 40, PX + 40, p), PY + 80 + j * 60 + Math.sin(p * 9) * 18); ctx.rotate(p * 8); oval(ctx, 0, 0, 9, 5, 0, '#4ade80'); ctx.restore(); }
      } else if (act === 3) {
        const n = 26; const amp = 30; const L0 = PX + 50; const L1 = PX + PW - 90; const yb = my + 40;
        const ys = (p) => yb + Math.sin(p * TAU * 1.5 - k * 4) * amp;
        for (let j = 0; j < n; j++) { const p = j / (n - 1); circ(ctx, lerp(L0, L1, p), ys(p), 10 + p * 9, j % 2 ? '#7c3aed' : '#a78bfa'); }
        const hx = L1 + 26; const hy = ys(1);
        oval(ctx, hx, hy, 30, 22, 0, '#8b5cf6'); circ(ctx, hx + 8, hy - 9, 6, '#ffffff'); circ(ctx, hx + 9, hy - 9, 3, '#1a1630');
        const fl = Math.sin(k * 10) > 0 ? 1 : 0.4; line(ctx, hx + 28, hy + 4, hx + 28 + 22 * fl, hy + 4, '#ef4444', 3); line(ctx, hx + 28 + 22 * fl, hy + 4, hx + 34 + 24 * fl, hy - 2, '#ef4444', 2); line(ctx, hx + 28 + 22 * fl, hy + 4, hx + 34 + 24 * fl, hy + 10, '#ef4444', 2);
        for (let j = 0; j < 7; j++) { const p = mod(k * 0.3 + j / 7, 1); ctx.save(); ctx.globalAlpha *= Math.sin(p * PI); label(ctx, j % 2 ? 's' : 'S', PX + 70 + j * 72, PY + 150 - p * 100, { size: 30, weight: 800, fill: 'purple' }); ctx.restore(); }
      } else {
        const bx = PX + PW * 0.28 + Math.sin(k * 1.6) * 80; const by = my - 10 + Math.sin(k * 3.2) * 50;
        ctx.strokeStyle = 'rgba(34,211,238,0.35)'; ctx.lineWidth = 2; ctx.setLineDash([6, 8]); ctx.beginPath();
        for (let j = 0; j <= 30; j++) { const tt = k - j * 0.04; const xx = PX + PW * 0.28 + Math.sin(tt * 1.6) * 80; const yy = my - 10 + Math.sin(tt * 3.2) * 50; if (j) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); } ctx.stroke(); ctx.setLineDash([]);
        const wf = Math.sin(k * 40) * 0.5;
        oval(ctx, bx - 6, by - 18, 12, 18, -0.5 + wf, 'rgba(219,234,254,0.85)'); oval(ctx, bx + 6, by - 18, 12, 18, 0.5 - wf, 'rgba(219,234,254,0.85)');
        oval(ctx, bx, by, 24, 16, 0, '#facc15'); ctx.fillStyle = '#1a1630'; ctx.fillRect(bx - 8, by - 15, 6, 30); ctx.fillRect(bx + 4, by - 15, 6, 30); circ(ctx, bx + 22, by - 3, 4, '#1a1630');
        label(ctx, 'BUZZ', bx, by - 52, { size: 26, weight: 900, fill: 'yellow' });
        const dx = PX + PW * 0.74; const dy = my + 60; const hp = mod(k, 1.1) / 1.1; const hit = hp < 0.3;
        ctx.fillStyle = '#dc2626'; ctx.fillRect(dx - 70, dy - 30, 140, 76); oval(ctx, dx, dy + 46, 70, 16, 0, '#991b1b'); oval(ctx, dx, dy - 30, 70, 16, 0, '#fef3c7', '#d6d3d1', 3);
        ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 3; ctx.beginPath(); for (let j = 0; j <= 6; j++) ctx.lineTo(dx - 70 + j * 23.3, dy + (j % 2 ? 38 : -20)); ctx.stroke();
        ctx.save(); ctx.translate(dx + 70, dy - 110); ctx.rotate(hit ? -0.9 * smooth(hp / 0.3) : -0.9 + 0.9 * smooth((hp - 0.3) / 0.7)); line(ctx, 0, 0, -60, 70, '#b45309', 7); circ(ctx, -60, 70, 8, '#fde68a'); ctx.restore();
        const bq = hp < 0.5 ? 1 - hp / 0.5 : 0;
        if (bq > 0) {
          ctx.save(); ctx.translate(dx - 10, dy - 110); ctx.scale(0.7 + 0.4 * (1 - bq), 0.7 + 0.4 * (1 - bq)); ctx.globalAlpha *= bq;
          ctx.beginPath(); for (let j = 0; j < 22; j++) { const a = (j / 22) * TAU; const rr = j % 2 ? 34 : 54; if (j) ctx.lineTo(Math.cos(a) * rr * 1.3, Math.sin(a) * rr * 0.8); else ctx.moveTo(Math.cos(a) * rr * 1.3, Math.sin(a) * rr * 0.8); } ctx.closePath();
          ctx.fillStyle = '#fef08a'; ctx.fill(); ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 3; ctx.stroke();
          label(ctx, 'BANG!', 0, 2, { size: 28, weight: 900, fill: '#dc2626' });
          ctx.restore();
        }
      }
      ctx.restore();
      ctx.restore();
      const eq = after(lu, 0.4, 0.5);
      ctx.save(); ctx.globalAlpha *= eq;
      words(ctx, ex.map(([s2, c2, w2]) => [s2, c2, w2 || 600]), cx, Y0 + 470, 26);
      label(ctx, def, cx, Y0 + 520, { size: 20, weight: 600, fill: 'ink' });
      chip(ctx, look, cx, Y0 + 582, c, 20);
      ctx.restore();
      label(ctx, 'Figurative: not meant word for word, but it paints a picture', cx, Y1 - 40, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Point, Evidence, Explain, Link: four blocks build a paragraph.
    'peel-paragraph'(b, ctx, it, t) {
      const ROWS = [['P', 'Point', 'Make your claim', '#5b8cff'], ['E', 'Evidence', 'Back it up with a fact, quote or example', '#34d399'], ['E', 'Explain', 'Say how the evidence proves your point', '#ff9f43'], ['L', 'Link', 'Link back to your point or the question', '#a78bfa']];
      const TXT = strs(it.items, null);
      const SENT = TXT && TXT.length >= 4 ? TXT.slice(0, 4) : ['Schools should have more PE lessons.', 'Doctors say children need about 60 minutes of exercise every day.', 'Extra PE would help pupils reach that, so they stay healthy and focused.', 'So more PE lessons would make pupils fitter and better learners.'];
      const P = 15; const u = cycle(t, P, 0.2); const out = 1 - smooth((u - (P - 0.6)) / 0.5);
      const RH = 116; const RY = (i) => Y0 + 64 + i * (RH + 10);
      ctx.save(); fade(ctx, t); ctx.globalAlpha *= out;
      title(ctx, it.label || 'A PEEL paragraph');
      ROWS.forEach(([L, name, hint, c], i) => {
        const at = 0.3 + i * 2.6; const q = after(u, at, 0.45); if (q <= 0) return;
        const y = RY(i);
        ctx.save(); ctx.globalAlpha *= q; ctx.translate(-(1 - q) * 40, 0);
        ctx.fillStyle = tint(c, 0.85); rounded(ctx, X0 + 8, y, 120, RH, 16); ctx.fill();
        label(ctx, L, X0 + 68, y + 46, { size: 50, weight: 900, fill: '#ffffff' });
        label(ctx, name, X0 + 68, y + 92, { size: 19, weight: 800, fill: '#ffffff' });
        panel(ctx, X0 + 140, y, X1 - 8 - (X0 + 140), RH, c, 0.07, 16);
        label(ctx, hint, X0 + 160, y + 24, { size: 18, weight: 700, fill: c, align: 'left' });
        // The sentence appears word by word.
        const ws = SENT[i].split(/\s+/); const n = Math.ceil(ws.length * clamp((u - at - 0.4) / 1.6));
        if (n > 0) para(ctx, ws.slice(0, n).join(' '), X0 + 160, y + 72, X1 - 30 - (X0 + 160), 21, 'ink', 500, 2, 'left');
        ctx.restore();
      });
      // The finished paragraph as coloured lines of text.
      const fq = after(u, 11.2, 0.6);
      if (fq > 0) {
        ctx.save(); ctx.globalAlpha *= fq;
        label(ctx, 'Put together: one clear, convincing paragraph', cx, Y0 + 586, { size: 20, weight: 700, fill: 'ink' });
        const LW = 620; const LX = cx - LW / 2; let lx = LX; let ly = Y0 + 618;
        SENT.forEach((s, i) => {
          let len = s.length * 4.2;
          while (len > 0) {
            const room = LX + LW - lx; const seg = Math.min(room, len);
            ctx.fillStyle = tint(ROWS[i][3], 0.8); rounded(ctx, lx, ly - 6, Math.max(4, seg - 6), 12, 6); ctx.fill();
            lx += seg; len -= seg; if (lx >= LX + LW - 1) { lx = LX; ly += 22; }
          }
          lx += 6;
        });
        ctx.restore();
      }
      ctx.restore();
    },

    // Iambic pentameter: a ball bounces da-DUM five times over Shakespeare's
    // line; below, a haiku's syllables are counted 5-7-5.
    'poetry-rhythm'(b, ctx, it, t) {
      const SYL = ['Shall', 'I', 'com', 'pare', 'thee', 'to', 'a', 'sum', 'mer’s', 'day?'];
      const SW = 74; const SX = (i) => cx - (SW * SYL.length) / 2 + SW * (i + 0.5); const SY = Y0 + 196;
      const ST = 0.46; const u1 = cycle(t, SYL.length * ST + 2.4, 0.5); const pos = u1 / ST;
      const cur = Math.min(SYL.length - 1, Math.floor(pos));
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Rhythm in poetry');
      label(ctx, 'Iambic pentameter: da-DUM × 5', cx, Y0 + 74, { size: 23, weight: 800, fill: 'orange' });
      label(ctx, 'Shakespeare, Sonnet 18', cx, Y0 + 104, { size: 18, weight: 500, fill: 'muted' });
      SYL.forEach((s, i) => {
        const strong = i % 2 === 1; const said = pos >= i && u1 < SYL.length * ST + 1.6;
        const lift = cur === i && pos < SYL.length ? Math.sin(clamp(pos - i) * PI) * (strong ? 6 : 3) : 0;
        label(ctx, s, SX(i), SY - lift, { size: strong ? 28 : 24, weight: strong ? 800 : 500, fill: strong ? (said ? 'orange' : 'ink') : said ? 'ink' : 'muted' });
        label(ctx, strong ? 'DUM' : 'da', SX(i), SY + 40, { size: strong ? 19 : 18, weight: strong ? 800 : 500, fill: strong ? 'orange' : 'muted' });
      });
      for (let f = 0; f < 5; f++) {
        const x0 = SX(f * 2) - SW / 2 + 8; const x1 = SX(f * 2 + 1) + SW / 2 - 8; const on = pos >= f * 2 + 1;
        ctx.strokeStyle = on ? 'rgba(255,159,67,0.9)' : 'rgba(147,160,196,0.45)'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x0, SY + 60); ctx.lineTo(x0, SY + 68); ctx.lineTo(x1, SY + 68); ctx.lineTo(x1, SY + 60); ctx.stroke();
        label(ctx, `foot ${f + 1}`, (x0 + x1) / 2, SY + 88, { size: 18, weight: 600, fill: on ? 'orange' : 'muted' });
      }
      // The bouncing ball: a small hop onto da, a big one onto DUM.
      if (pos < SYL.length) {
        const i = Math.floor(pos); const f = pos - i; const from = i === 0 ? SX(0) - SW : SX(i - 1);
        const x = lerp(from, SX(i), smooth(f * 1.15)); const hgt = i % 2 ? 62 : 30;
        const y = SY - 34 - Math.sin(clamp(f * 1.15) * PI) * hgt;
        circ(ctx, x, y, 11, i % 2 ? 'orange' : 'cyan');
      }
      const cnt = Math.min(10, Math.floor(pos) + 1);
      label(ctx, `${pos < SYL.length ? cnt : 10} / 10 syllables, 5 iambs`, cx, SY + 124, { size: 20, weight: 700, fill: 'ink' });
      line(ctx, X0 + 40, Y0 + 350, X1 - 40, Y0 + 350, 'rgba(140,170,255,0.25)', 2);
      // Haiku.
      label(ctx, 'Haiku: 3 lines of 5, 7, 5 syllables', cx, Y0 + 392, { size: 23, weight: 800, fill: 'green' });
      const HK = [[['Soft'], ['rain'], ['on'], ['the'], ['roof']], [['my'], ['cat'], ['is'], ['dream', 'ing'], ['of'], ['fish']], [['the'], ['ket', 'tle'], ['hums'], ['low']]];
      const HT = 0.38; const u2 = cycle(t, 17 * HT + 3.2, 1.0); let gi = 0;
      HK.forEach((wordsL, li) => {
        const y = Y0 + 450 + li * 72; const size = 28;
        const flat = []; wordsL.forEach((w, wi) => w.forEach((s2, si) => flat.push([s2, wi, si === w.length - 1])));
        const widths = flat.map(([s2, , last]) => tw(ctx, s2, size, 600) + (last ? 16 : 4));
        let x = cx - 40 - widths.reduce((a, c) => a + c, 0) / 2; let n = 0;
        flat.forEach(([s2, , last], j) => {
          const on = u2 >= 0.4 + gi * HT; if (on) n++;
          label(ctx, s2, x, y, { size, weight: 600, fill: on ? 'ink' : 'muted', align: 'left' });
          const w0 = tw(ctx, s2, size, 600);
          circ(ctx, x + w0 / 2, y + 26, on ? 5 : 3.5, on ? 'green' : 'rgba(147,160,196,0.4)');
          if (!last) label(ctx, '·', x + w0 + 2, y, { size, weight: 600, fill: 'muted', align: 'center' });
          x += widths[j]; gi++;
        });
        const target = [5, 7, 5][li];
        circ(ctx, X1 - 70, y, 24, n === target ? 'green' : 'rgba(52,211,153,0.15)', 'green', 2);
        label(ctx, String(n), X1 - 70, y + 1, { size: 24, weight: 800, fill: n === target ? '#06281c' : 'green' });
      });
      label(ctx, 'Tap one beat for each syllable as you read', cx, Y1 - 32, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Campbell's hero's journey as a circle: from the ordinary world through
    // the threshold into the unknown, and back home changed.
    'hero-journey'(b, ctx, it, t) {
      const k = b.clock;
      const ST = [
        ['Ordinary world', 'Everyday life before the adventure'],
        ['Call to|adventure', 'A problem or message calls the hero away'],
        ['Meeting the|mentor', 'A wise guide gives advice or a gift'],
        ['Crossing the|threshold', 'The hero leaves the known world behind'],
        ['Trials, allies|and enemies', 'Tests to pass, friends to make, foes to face'],
        ['The ordeal', 'The greatest danger: facing the deepest fear'],
        ['The reward', 'The hero wins the prize or the truth'],
        ['The road|back', 'Heading home, often chased or tested again'],
        ['Return with|the elixir', 'Home again, changed, with something to share'],
      ];
      const CY = Y0 + 340; const R = 194; const D = 2.5;
      const ang = (i) => ((-90 + i * 40) * PI) / 180;
      const v = cycle(t, D * ST.length + 1.2, 1.0); const si = t < 1.0 ? -1 : Math.min(ST.length - 1, Math.floor(v / D));
      const lu = si < 0 ? 0 : v - si * D; const mv = smooth(lu / 0.9);
      const heroA = si < 0 ? ang(0) : lerp(si === 0 ? ang(0) - (40 * PI) / 180 * (v < D ? 0 : 1) : ang(si - 1), ang(si), mv);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || "The hero's journey");
      // Known world above, unknown below.
      ctx.fillStyle = 'rgba(251,191,36,0.10)'; ctx.beginPath(); ctx.arc(cx, CY, R, PI, TAU); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(167,139,250,0.14)'; ctx.beginPath(); ctx.arc(cx, CY, R, 0, PI); ctx.closePath(); ctx.fill();
      label(ctx, 'Known world', cx, CY - 78, { size: 22, weight: 800, fill: 'yellow' });
      label(ctx, 'Unknown world', cx, CY + 78, { size: 22, weight: 800, fill: 'purple' });
      line(ctx, cx - R - 14, CY, cx + R + 14, CY, 'rgba(233,238,255,0.6)', 2, [8, 8]);
      label(ctx, 'threshold', cx, CY - 18, { size: 18, weight: 600, fill: 'muted' });
      ctx.strokeStyle = 'rgba(140,170,255,0.35)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, CY, R, 0, TAU); ctx.stroke();
      if (si >= 0) { ctx.strokeStyle = 'rgba(34,211,238,0.85)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, CY, R, ang(0), Math.max(ang(0) + 0.001, heroA)); ctx.stroke(); }
      ST.forEach(([name], i) => {
        const a = ang(i); const x = cx + Math.cos(a) * R; const y = CY + Math.sin(a) * R; const on = i === si; const done = si > i;
        const c = Math.sin(a) < -0.05 || i === 0 || i === 8 || i === 7 ? '#fbbf24' : '#a78bfa';
        circ(ctx, x, y, on ? 18 : 14, on ? c : done ? tint(c, 0.6) : '#1a2148', c, 3);
        label(ctx, String(i + 1), x, y + 1, { size: 18, weight: 800, fill: on ? '#1a1630' : 'ink' });
        const ca = Math.cos(a); const sa = Math.sin(a); const rr = R + 28;
        const lx = cx + ca * rr; const ly = CY + sa * rr;
        const align = Math.abs(ca) < 0.2 ? 'center' : ca > 0 ? 'left' : 'right';
        const lines = name.split('|'); const off = Math.abs(ca) < 0.2 ? sa * 10 : Math.abs(ca) < 0.5 ? sa * 14 : 0;
        lines.forEach((ln, j) => label(ctx, ln, lx, ly + off + (j - (lines.length - 1) / 2) * 23, { size: 19, weight: on ? 800 : 600, fill: on ? c : 'ink', align }));
      });
      // The hero walking round.
      const hx = cx + Math.cos(heroA) * (R - 38); const hy = CY + Math.sin(heroA) * (R - 38); const step = Math.sin(k * 10) * 2;
      ctx.save(); ctx.translate(hx, hy - 4 + (mv < 1 ? step : 0));
      ctx.fillStyle = '#ef4444'; poly(ctx, [-11, -4, 11, -4, 16, 22, -16, 22]); ctx.fill();
      circ(ctx, 0, -14, 10, '#f1c27d'); ctx.fillStyle = '#5b3a1e'; ctx.beginPath(); ctx.arc(0, -17, 10, PI, TAU); ctx.fill();
      ctx.restore();
      if (si >= 0) {
        const [name, desc] = ST[si]; const c = si === 0 || si >= 7 ? 'yellow' : 'purple';
        label(ctx, `${si + 1}. ${name.replace('|', ' ')}`, cx, Y0 + 630, { size: 23, weight: 800, fill: c });
        label(ctx, desc, cx, Y0 + 668, { size: 19, weight: 500, fill: 'ink' });
      } else label(ctx, 'A pattern found in myths, films and novels', cx, Y0 + 650, { size: 20, weight: 600, fill: 'ink' });
      ctx.restore();
    },

    // A cutaway of Shakespeare's Globe (1599): thatched galleries round an
    // open yard, the thrust stage under the heavens, groundlings standing.
    'globe-theatre'(b, ctx, it, t) {
      const k = b.clock; const KQ = 0.42; const CY = Y0 + 436; const RO = 300; const RI = 214; const RM = (RO + RI) / 2; const H = 172;
      const pt = (X, Z, h) => [cx + X, CY + Z * KQ - h];
      const ring = (r, h, a0, a1, n = 40) => { const out2 = []; for (let j = 0; j <= n; j++) { const a = lerp(a0, a1, j / n); out2.push(...pt(Math.cos(a) * r, Math.sin(a) * r, h)); } return out2; };
      const rev = (p) => { const o = []; for (let j = p.length - 2; j >= 0; j -= 2) o.push(p[j], p[j + 1]); return o; };
      const hl = t < 1.4 ? -1 : Math.floor(cycle(t, 2.6 * 5, 1.4) / 2.6);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || "Shakespeare's Globe");
      // Back roof: outer slope, then the inner slope facing us.
      poly(ctx, [...ring(RM, H + 40, PI, TAU), ...rev(ring(RO, H, PI, TAU))]); ctx.fillStyle = '#9c7a3c'; ctx.fill();
      poly(ctx, [...ring(RI, H, PI, TAU), ...rev(ring(RM, H + 40, PI, TAU))]); ctx.fillStyle = hl === 0 ? '#e8c46e' : '#cfa75a'; ctx.fill();
      ctx.strokeStyle = 'rgba(120,90,40,0.5)'; ctx.lineWidth = 1.5; for (let j = 1; j < 24; j++) { const a = PI + (j / 24) * PI; ctx.beginPath(); ctx.moveTo(...pt(Math.cos(a) * RI, Math.sin(a) * RI, H)); ctx.lineTo(...pt(Math.cos(a) * RM, Math.sin(a) * RM, H + 40)); ctx.stroke(); }
      // Inner face of the back galleries, three tiers with people.
      poly(ctx, [...ring(RI, 0, PI, TAU), ...rev(ring(RI, H, PI, TAU))]); ctx.fillStyle = '#4a2f1a'; ctx.fill();
      for (let tier = 0; tier < 3; tier++) {
        const h0 = tier * (H / 3);
        for (let j = 0; j < 56; j++) {
          const a = PI + ((j + 0.5) / 56) * PI; const X = Math.cos(a) * RI; if (tier < 2 && Math.abs(X) < 104) continue;
          const bob = Math.sin(k * 2 + j * 1.7 + tier) * 1.2;
          const [hx, hy] = pt(X, Math.sin(a) * RI, h0 + 30 + bob); circ(ctx, hx, hy, 5, ['#f1c27d', '#c68642', '#e0ac69', '#8d5524'][(j + tier) % 4]);
          const [bx2, by2] = pt(X, Math.sin(a) * RI, h0 + 18); ctx.fillStyle = ['#7c2d12', '#1e3a8a', '#365314', '#581c87', '#713f12'][(j * 3 + tier) % 5]; ctx.fillRect(bx2 - 5, by2 - 6, 10, 10);
        }
        const rail = ring(RI, h0 + 14, PI, TAU); ctx.strokeStyle = '#8b5e34'; ctx.lineWidth = 3; poly(ctx, rail, false); ctx.stroke();
        if (tier) { ctx.strokeStyle = '#2b1a0c'; ctx.lineWidth = 3; poly(ctx, ring(RI, h0, PI, TAU), false); ctx.stroke(); }
      }
      for (let j = 0; j <= 16; j++) { const a = PI + (j / 16) * PI; const X = Math.cos(a) * RI; const Z = Math.sin(a) * RI; line(ctx, ...pt(X, Z, 0), ...pt(X, Z, H), '#6b4423', 3); }
      // The tiring house behind the stage: doors and a balcony.
      const ta0 = PI * 1.5 - 0.5; const ta1 = PI * 1.5 + 0.5;
      poly(ctx, [...ring(RI, 0, ta0, ta1, 12), ...rev(ring(RI, (H * 2) / 3, ta0, ta1, 12))]); ctx.fillStyle = '#d9c7a3'; ctx.fill();
      ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 2.5; poly(ctx, ring(RI, H / 3, ta0, ta1, 12), false); ctx.stroke();
      for (const X of [-60, 60]) { const Z = -Math.sqrt(RI * RI - X * X); const [dx, dy] = pt(X, Z, 0); ctx.fillStyle = '#3b2412'; ctx.beginPath(); ctx.moveTo(dx - 13, dy); ctx.lineTo(dx - 13, dy - 34); ctx.arc(dx, dy - 34, 13, PI, TAU); ctx.lineTo(dx + 13, dy); ctx.fill(); }
      for (let j = 0; j < 5; j++) { const X = -48 + j * 24; const Z = -Math.sqrt(RI * RI - X * X); const [hx, hy] = pt(X, Z, H / 3 + 26); circ(ctx, hx, hy, 5, j % 2 ? '#e0ac69' : '#f1c27d'); }
      // The yard.
      poly(ctx, ring(RI, 0, 0, TAU, 60)); ctx.fillStyle = '#5a4630'; ctx.fill();
      // The thrust stage, actors, pillars and the heavens.
      const SX = 118; const ZB = -196; const ZF = -58; const SH = 34;
      poly(ctx, [...pt(-SX, ZB, SH), ...pt(SX, ZB, SH), ...pt(SX, ZF, SH), ...pt(-SX, ZF, SH)]); ctx.fillStyle = hl === 3 ? '#d6a062' : '#b07d45'; ctx.fill();
      poly(ctx, [...pt(-SX, ZF, 0), ...pt(SX, ZF, 0), ...pt(SX, ZF, SH), ...pt(-SX, ZF, SH)]); ctx.fillStyle = '#6e4a26'; ctx.fill();
      ctx.strokeStyle = 'rgba(60,35,15,0.5)'; ctx.lineWidth = 1.5; for (let j = 1; j < 8; j++) { ctx.beginPath(); ctx.moveTo(...pt(-SX + j * 29.5, ZB, SH)); ctx.lineTo(...pt(-SX + j * 29.5, ZF, SH)); ctx.stroke(); }
      for (let a2 = 0; a2 < 2; a2++) {
        const X = Math.sin(k * 0.7 + a2 * 2.4) * 66; const Z = -150 + a2 * 40; const [ax, ay] = pt(X, Z, SH);
        ctx.fillStyle = a2 ? '#1d4ed8' : '#b91c1c'; poly(ctx, [ax - 9, ay, ax + 9, ay, ax + 6, ay - 30, ax - 6, ay - 30]); ctx.fill();
        circ(ctx, ax, ay - 37, 7, '#f1c27d');
        const arm = Math.sin(k * 3 + a2) * 0.6; line(ctx, ax + 5, ay - 26, ax + 5 + Math.cos(-0.6 + arm) * 14, ay - 26 + Math.sin(-0.6 + arm) * 14, a2 ? '#1d4ed8' : '#b91c1c', 3);
      }
      for (const X of [-88, 88]) { const [px0, py0] = pt(X, -104, SH); const [, py1] = pt(X, -104, 170); ctx.fillStyle = '#c9b48a'; ctx.fillRect(px0 - 6, py1, 12, py0 - py1); }
      poly(ctx, [...pt(-128, -218, 202), ...pt(128, -218, 202), ...pt(128, -96, 172), ...pt(-128, -96, 172)]); ctx.fillStyle = hl === 1 ? '#a87443' : '#8a5a2b'; ctx.fill();
      poly(ctx, [...pt(-128, -96, 172), ...pt(128, -96, 172), ...pt(128, -96, 158), ...pt(-128, -96, 158)]); ctx.fillStyle = '#1e3a8a'; ctx.fill();
      for (let j = 0; j < 9; j++) { const [sx, sy] = pt(-112 + j * 28, -96, 165); circ(ctx, sx, sy, 2.2, '#fde68a'); }
      poly(ctx, [...pt(-36, -170, 200), ...pt(36, -170, 200), ...pt(36, -170, 230), ...pt(-36, -170, 230)]); ctx.fillStyle = '#d9c7a3'; ctx.fill();
      poly(ctx, [...pt(-42, -170, 230), ...pt(42, -170, 230), ...pt(0, -190, 250)]); ctx.fillStyle = '#9c7a3c'; ctx.fill();
      const [fx, fy] = pt(0, -190, 250); line(ctx, fx, fy, fx, fy - 34, '#e5e7eb', 3);
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(fx, fy - 34); for (let j = 0; j <= 8; j++) ctx.lineTo(fx + j * 5, fy - 34 + Math.sin(k * 5 - j * 0.7) * 3 * (j / 8)); for (let j = 8; j >= 0; j--) ctx.lineTo(fx + j * 5, fy - 20 + Math.sin(k * 5 - j * 0.7) * 3 * (j / 8)); ctx.fill();
      // Groundlings standing round the stage.
      const G = it._g || (it._g = (() => { const o = []; for (let j = 0; o.length < 70 && j < 400; j++) { const a = rnd(j) * TAU; const r = Math.sqrt(rnd(j + 999)) * (RI - 22); const X = Math.cos(a) * r; const Z = Math.sin(a) * r; if (Math.abs(X) < SX + 12 && Z < ZF + 14) continue; o.push([X, Z, j]); } return o.sort((p, q) => p[1] - q[1]); })());
      G.forEach(([X, Z, j]) => { const bob = Math.max(0, Math.sin(k * 3 + j)) * 2; const [bx2, by2] = pt(X, Z, 12 + bob); ctx.fillStyle = hl === 2 ? ['#b45309', '#15803d', '#1d4ed8', '#9f1239'][j % 4] : ['#78350f', '#14532d', '#1e3a8a', '#701a35'][j % 4]; oval(ctx, bx2, by2, 9, 10, 0, ctx.fillStyle); const [hx, hy] = pt(X, Z, 27 + bob); circ(ctx, hx, hy, 6, ['#f1c27d', '#c68642', '#e0ac69', '#8d5524'][j % 4]); });
      // The front galleries, cut away low.
      poly(ctx, [...ring(RI, 0, 0, PI), ...rev(ring(RO, 0, 0, PI))]); ctx.fillStyle = '#3b2414'; ctx.fill();
      poly(ctx, [...ring(RI, 0, 0, PI), ...rev(ring(RI, 22, 0, PI))]); ctx.fillStyle = '#6b4423'; ctx.fill();
      poly(ctx, [...ring(RO, 0, 0, PI), ...rev(ring(RO, 22, 0, PI))]); ctx.fillStyle = '#e6dcc4'; ctx.fill();
      poly(ctx, ring(RO, 22, 0, PI), false); ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 2; ctx.stroke();
      // Sections through the galleries at both sides: three floors and the roof.
      for (const s of [-1, 1]) {
        const p0 = pt(s * RI, 0, 0); const p1 = pt(s * RO, 0, 0); const p2 = pt(s * RO, 0, H); const p3 = pt(s * RI, 0, H);
        poly(ctx, [...p0, ...p1, ...p2, ...p3]); ctx.fillStyle = hl === 4 ? '#8a5f37' : '#6e4a2a'; ctx.fill();
        for (let tier = 1; tier < 3; tier++) line(ctx, p0[0], p0[1] - tier * (H / 3), p1[0], p1[1] - tier * (H / 3), '#2b1a0c', 4);
        for (let tier = 0; tier < 3; tier++) for (let st = 0; st < 3; st++) { const bxx = lerp(p0[0], p1[0], 0.25 + st * 0.25); const byy = p0[1] - tier * (H / 3) - 8 - st * 7; ctx.fillStyle = '#a07a4a'; ctx.fillRect(bxx - 10, byy, 20, 5); circ(ctx, bxx, byy - 12, 5, ['#f1c27d', '#c68642', '#e0ac69'][(tier + st) % 3]); }
        ctx.strokeStyle = '#2b1a0c'; ctx.lineWidth = 2.5; poly(ctx, [...p0, ...p1, ...p2, ...p3]); ctx.stroke();
        poly(ctx, [...p3, ...p2, ...pt(s * RM, 0, H + 40)]); ctx.fillStyle = '#cfa75a'; ctx.fill(); ctx.stroke();
      }
      // Labels with leader lines.
      const tagL = (i, lines2, lx, ly, align, tx, ty) => {
        const on = hl === i; const c = on ? 'yellow' : 'ink';
        ctx.strokeStyle = on ? 'rgba(251,191,36,0.9)' : 'rgba(233,238,255,0.45)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(lx + (align === 'left' ? 60 : align === 'right' ? -60 : 0), ly + (align === 'center' ? -22 : 16)); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]);
        circ(ctx, tx, ty, 4, on ? 'yellow' : '#e9eeff');
        lines2.forEach((s, j) => label(ctx, s, lx, ly + j * 24, { size: j ? 18 : 21, weight: j ? 500 : 800, fill: j ? (on ? 'ink' : 'muted') : c, align }));
      };
      const rp = pt(Math.cos(PI * 1.18) * (RI + 30), Math.sin(PI * 1.18) * (RI + 30), H + 14);
      tagL(0, ['Thatched roof', 'over the galleries'], X0 + 12, Y0 + 82, 'left', rp[0], rp[1]);
      const hp2 = pt(120, -100, 178);
      tagL(1, ['The heavens', 'a roof over the stage'], X1 - 12, Y0 + 82, 'right', hp2[0], hp2[1]);
      const gp = pt(-150, 70, 27);
      tagL(2, ['Groundlings', '1 penny to stand'], X0 + 110, Y0 + 610, 'center', gp[0], gp[1]);
      const sp2 = pt(40, ZF, 18);
      tagL(3, ['Thrust stage', 'crowd on three sides'], cx, Y0 + 610, 'center', sp2[0], sp2[1]);
      const gp2 = pt(RM + 10, 0, H / 2);
      tagL(4, ['Galleries', 'seats cost more'], X1 - 110, Y0 + 610, 'center', gp2[0], gp2[1]);
      label(ctx, 'Built 1599 on Bankside, London: the "wooden O"', cx, Y1 - 22, { size: 19, weight: 600, fill: 'muted' });
      ctx.restore();
    },

    // ─── Film and photography ─────────────────────────────────────────────

    // A flipbook of a bouncing ball shown at 4, 12 and 24 frames per second:
    // the more frames each second, the smoother the motion.
    'animation-frames'(b, ctx, it, t) {
      const k = b.clock; const FPS = [4, 12, 24]; const PD = 4.6;
      const v = cycle(t, PD * 3, 0.5); const pi = Math.floor(v / PD); const fps = FPS[pi]; const stepN = 24 / fps;
      const fi = (Math.floor(k * fps) * stepN) % 12;
      // Frame i of 12: one bounce, squashed on the ground, stretched when fast.
      const ballAt = (i, x, y, w, h, s = 1) => {
        const p = i / 12; const up = 4 * p * (1 - p); const gy = y + h - 10 * s; const R = Math.min(w, h) * 0.13;
        const sq = i === 0 ? [1.35, 0.7] : i === 1 || i === 11 ? [0.85, 1.2] : [1, 1];
        const by = gy - R * sq[1] - up * (h - 2.6 * R - 14 * s);
        oval(ctx, x + w / 2, gy + 2 * s, R * (1.1 - up * 0.5), R * 0.25, 0, 'rgba(0,0,0,0.25)');
        oval(ctx, x + w / 2, by, R * sq[0], R * sq[1], 0, '#fb7185'); oval(ctx, x + w / 2 - R * 0.35, by - R * 0.35, R * 0.25, R * 0.18, -0.5, 'rgba(255,255,255,0.7)');
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Frames per second');
      // Film strip of 12 frames.
      const FW = 56; const GAPF = 6; const SX0 = cx - (12 * (FW + GAPF) - GAPF) / 2; const SY0 = Y0 + 64; const SH = 104;
      ctx.fillStyle = '#111827'; rounded(ctx, SX0 - 14, SY0, 12 * (FW + GAPF) - GAPF + 28, SH, 8); ctx.fill();
      for (let j = 0; j < 30; j++) { const hx = SX0 - 6 + j * 25.6; ctx.fillStyle = '#374151'; rounded(ctx, hx, SY0 + 7, 12, 9, 2); ctx.fill(); rounded(ctx, hx, SY0 + SH - 16, 12, 9, 2); ctx.fill(); }
      for (let i = 0; i < 12; i++) {
        const x = SX0 + i * (FW + GAPF); const y = SY0 + 24; const used = i % stepN === 0; const on = i === fi;
        ctx.fillStyle = used ? '#f8fafc' : '#475569'; ctx.fillRect(x, y, FW, SH - 48);
        ctx.save(); ctx.globalAlpha *= used ? 1 : 0.35; ballAt(i, x, y, FW, SH - 48, 0.4); ctx.restore();
        if (on) { ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 4; ctx.strokeRect(x - 2, y - 2, FW + 4, SH - 44); }
        label(ctx, String(i + 1), x + FW / 2, SY0 + SH + 18, { size: 18, weight: on ? 800 : 500, fill: on ? 'yellow' : used ? 'ink' : 'rgba(147,160,196,0.5)' });
      }
      // The flipbook.
      const BX = X0 + 40; const BY = Y0 + 236; const BW = 330; const BH = 250;
      for (let j = 5; j >= 1; j--) { ctx.fillStyle = j % 2 ? '#e2e8f0' : '#cbd5e1'; rounded(ctx, BX + j * 5, BY + j * 5, BW, BH, 10); ctx.fill(); }
      ctx.fillStyle = '#f8fafc'; rounded(ctx, BX, BY, BW, BH, 10); ctx.fill();
      ballAt(fi, BX + 40, BY + 20, BW - 80, BH - 30, 1);
      const ff = mod(k * fps, 1);
      if (fps < 24 || ff < 0.5) { const lift = 1 - ff; ctx.fillStyle = `rgba(241,245,249,${0.9 * lift})`; poly(ctx, [BX + BW, BY + BH, BX + BW - 70 * lift, BY + BH - 60 * lift, BX + BW - 30 * lift, BY + BH]); ctx.fill(); ctx.strokeStyle = `rgba(100,116,139,${lift})`; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.fillStyle = '#1f2937'; ctx.fillRect(BX, BY + BH - 2, BW, 8);
      label(ctx, `frame ${fi + 1}`, BX + 14, BY + 22, { size: 18, weight: 700, fill: '#475569', align: 'left' });
      // The rate.
      const RX = X0 + 590;
      label(ctx, String(fps), RX, Y0 + 290, { size: 80, weight: 800, fill: ['red', 'orange', 'green'][pi] });
      label(ctx, 'frames per second', RX, Y0 + 350, { size: 21, weight: 700, fill: 'ink' });
      chip(ctx, ['Jerky', 'Better', 'Smooth: the film standard'][pi], RX, Y0 + 400, ['red', 'orange', 'green'][pi], 20);
      label(ctx, `each picture shows for 1/${fps} s`, RX, Y0 + 450, { size: 19, weight: 600, fill: 'ink' });
      label(ctx, `≈ ${(1 / fps).toFixed(2)} seconds`, RX, Y0 + 478, { size: 19, weight: 500, fill: 'muted' });
      // One second, cut into frames.
      const LX0 = X0 + 30; const LW = FIG.w - 60; const LY = Y0 + 572; const LH = 44;
      label(ctx, `1 second = ${fps} frames`, cx, LY - 30, { size: 21, weight: 800, fill: ['red', 'orange', 'green'][pi] });
      const cur = Math.floor(mod(k, 1) * fps);
      for (let i = 0; i < fps; i++) {
        const cw = LW / fps; const x = LX0 + i * cw;
        ctx.fillStyle = i < cur ? tint(['red', 'orange', 'green'][pi], 0.55) : i === cur ? '#fbbf24' : 'rgba(140,170,255,0.12)';
        rounded(ctx, x + 2, LY, cw - 4, LH, Math.min(8, cw / 3)); ctx.fill();
      }
      label(ctx, 'Pictures shown fast enough blend into movement', cx, Y1 - 34, { size: 19, weight: 500, fill: 'ink' });
      ctx.restore();
    },

    // Aperture, shutter speed and ISO sliders change a photo's brightness,
    // background blur, motion blur and grain: the exposure triangle.
    'camera-exposure'(b, ctx, it, t) {
      const k = b.clock;
      // [f-number, shutter 1/x, ISO, caption, slider changed]
      const KEY = [
        [5.6, 250, 100, 'Balanced: not too dark, not too bright', -1],
        [2, 250, 100, 'Wide aperture (small f-number): brighter, blurry background', 0],
        [16, 250, 100, 'Narrow aperture (big f-number): darker, everything sharp', 0],
        [5.6, 1000, 100, 'Fast shutter: freezes the runner, but darker', 1],
        [5.6, 30, 100, 'Slow shutter: brighter, but the runner blurs', 1],
        [5.6, 250, 1600, 'High ISO: brighter, but the photo turns grainy', 2],
        [2.8, 1000, 100, 'Balance all three: sharp runner, soft background', -1],
      ];
      const D = 3.6; const v = cycle(t, D * KEY.length, 0.4); const ki = Math.floor(v / D); const lu = v - ki * D;
      const A = KEY[mod(ki - 1, KEY.length)]; const B = KEY[ki]; const m = smooth(lu / 1.0);
      const lg = (a, c) => 2 ** lerp(Math.log2(a), Math.log2(c), m);
      const N = lg(A[0], B[0]); const S = lg(A[1], B[1]); const ISO = lg(A[2], B[2]);
      const ev = 2 * Math.log2(5.6 / N) + Math.log2(250 / S) + Math.log2(ISO / 100);
      const near = (list, x) => list.reduce((p, c) => (Math.abs(Math.log2(c / x)) < Math.abs(Math.log2(p / x)) ? c : p));
      const Nd = near([1.8, 2, 2.8, 4, 5.6, 8, 11, 16], N); const Sd = near([1000, 500, 250, 125, 60, 30, 15], S); const Id = near([100, 200, 400, 800, 1600, 3200], ISO);
      const bgBlur = clamp((Math.log2(16 / N) - 1.5) / 3.5) * 9; const mBlur = clamp(Math.log2(500 / S) / 4) * 60; const grain = clamp(Math.log2(ISO / 200) / 3);
      const PX = X0 + 30; const PY = Y0 + 60; const PW = FIG.w - 60; const PH = 300;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The exposure triangle');
      ctx.save(); rounded(ctx, PX, PY, PW, PH, 12); ctx.clip();
      const sky = ctx.createLinearGradient(0, PY, 0, PY + PH); sky.addColorStop(0, '#7cc4f2'); sky.addColorStop(0.65, '#cfeaf7'); sky.addColorStop(0.66, '#7cbf6a'); sky.addColorStop(1, '#4f9a45');
      ctx.fillStyle = sky; ctx.fillRect(PX, PY, PW, PH);
      // Background: hills and trees, softened when the aperture is wide.
      const bg = () => {
        ctx.fillStyle = '#6aa8c9'; ctx.beginPath(); ctx.moveTo(PX, PY + 190); for (let j = 0; j <= 16; j++) ctx.lineTo(PX + (j / 16) * PW, PY + 150 + Math.sin(j * 1.3) * 22 + Math.sin(j * 0.5) * 18); ctx.lineTo(PX + PW, PY + 200); ctx.lineTo(PX, PY + 200); ctx.fill();
        for (let j = 0; j < 9; j++) { const x = PX + 40 + j * 86 + (j % 2) * 20; const y = PY + 196; ctx.fillStyle = '#5b3a1e'; ctx.fillRect(x - 4, y - 30, 8, 32); circ(ctx, x, y - 46, 24 + (j % 3) * 4, j % 2 ? '#2f7d32' : '#3f8f3a'); }
        circ(ctx, PX + PW - 90, PY + 60, 30, '#fff3b0');
      };
      if (bgBlur < 0.5) bg(); else { const n = 6; ctx.save(); ctx.globalAlpha *= 0.5; bg(); ctx.restore(); for (let j = 0; j < n; j++) { const a = (j / n) * TAU; ctx.save(); ctx.translate(Math.cos(a) * bgBlur, Math.sin(a) * bgBlur); ctx.globalAlpha *= 0.22; bg(); ctx.restore(); } }
      // The runner, smeared along the motion when the shutter is slow.
      const rx = PX + mod(k * 140, PW + 160) - 80; const ry = PY + 262;
      const runner = (x, a) => {
        const ph = k * 9; ctx.save(); ctx.globalAlpha *= a;
        const legA = Math.sin(ph) * 0.7; const legB = -legA;
        line(ctx, x, ry - 40, x + Math.sin(legA) * 30, ry, '#1f2937', 7); line(ctx, x, ry - 40, x + Math.sin(legB) * 30, ry, '#334155', 7);
        line(ctx, x, ry - 40, x + 6, ry - 82, '#dc2626', 13);
        line(ctx, x + 4, ry - 74, x + 4 + Math.sin(legB) * 24, ry - 52, '#e0ac69', 6); line(ctx, x + 4, ry - 74, x + 4 + Math.sin(legA) * 24, ry - 52, '#c68642', 6);
        circ(ctx, x + 8, ry - 96, 12, '#e0ac69');
        ctx.restore();
      };
      if (mBlur < 3) runner(rx, 1); else { const n = 7; for (let j = n; j >= 0; j--) runner(rx - (j / n) * mBlur, j === 0 ? 0.55 : 0.16); }
      // Brightness, then grain.
      if (ev > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(0.72, ev * 0.17)})`; ctx.fillRect(PX, PY, PW, PH); } else if (ev < 0) { ctx.fillStyle = `rgba(0,0,8,${Math.min(0.82, -ev * 0.22)})`; ctx.fillRect(PX, PY, PW, PH); }
      if (grain > 0.02) { const seed = Math.floor(k * 14); const n = Math.floor(grain * 520); for (let j = 0; j < n; j++) { const r1 = rnd(seed * 7.3 + j * 1.91); const r2 = rnd(seed * 3.1 + j * 2.37); ctx.fillStyle = j % 2 ? `rgba(255,255,255,${0.4 * grain})` : `rgba(0,0,0,${0.45 * grain})`; ctx.fillRect(PX + r1 * PW, PY + r2 * PH, 3, 3); } }
      ctx.restore();
      // Viewfinder corners.
      ctx.strokeStyle = 'rgba(233,238,255,0.9)'; ctx.lineWidth = 3;
      for (const [x, y, sx, sy] of [[PX + 14, PY + 14, 1, 1], [PX + PW - 14, PY + 14, -1, 1], [PX + 14, PY + PH - 14, 1, -1], [PX + PW - 14, PY + PH - 14, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x, y + sy * 22); ctx.lineTo(x, y); ctx.lineTo(x + sx * 22, y); ctx.stroke(); }
      // Exposure meter.
      const MX0 = cx - 180; const MX1 = cx + 180; const MY = Y0 + 392;
      for (let s = -3; s <= 3; s++) { const x = lerp(MX0, MX1, (s + 3) / 6); line(ctx, x, MY - (s ? 6 : 10), x, MY + (s ? 6 : 10), s ? 'rgba(220,230,255,0.6)' : 'ink', s ? 2 : 3); label(ctx, s > 0 ? `+${s}` : s < 0 ? `−${-s}` : '0', x, MY + 24, { size: 18, weight: s ? 500 : 800, fill: s ? 'muted' : 'ink' }); }
      line(ctx, MX0, MY, MX1, MY, 'rgba(220,230,255,0.45)', 2);
      label(ctx, 'too dark', MX0 - 14, MY, { size: 18, weight: 600, fill: 'muted', align: 'right' });
      label(ctx, 'too bright', MX1 + 14, MY, { size: 18, weight: 600, fill: 'muted', align: 'left' });
      const mxv = lerp(MX0, MX1, (clamp(ev, -3.4, 3.4) + 3) / 6); const okc = Math.abs(ev) < 0.6 ? '#34d399' : '#fbbf24';
      ctx.fillStyle = okc; poly(ctx, [mxv, MY - 4, mxv - 9, MY - 20, mxv + 9, MY - 20]); ctx.fill();
      // Sliders.
      const ROWS = [
        ['Aperture', `f/${Nd}`, (Math.log2(N) - Math.log2(1.8)) / (Math.log2(16) - Math.log2(1.8)), N <= 2.9 ? 'wide: more light, blurry background' : N >= 10 ? 'narrow: less light, all in focus' : 'medium opening', '#fbbf24'],
        ['Shutter', `1/${Sd} s`, (Math.log2(1000) - Math.log2(S)) / (Math.log2(1000) - Math.log2(15)), S >= 500 ? 'fast: freezes motion, less light' : S <= 60 ? 'slow: more light, motion blur' : 'medium speed', '#22d3ee'],
        ['ISO', `ISO ${Id}`, (Math.log2(ISO) - Math.log2(100)) / 5, ISO >= 700 ? 'high: brighter, but grainy' : 'low: clean, needs more light', '#a78bfa'],
      ];
      const TX0 = X0 + 150; const TX1 = X0 + 560;
      ROWS.forEach(([name, value, f, hint, c], i) => {
        const y = Y0 + 462 + i * 74; const on = B[4] === i || B[4] === -1;
        label(ctx, name, X0 + 14, y, { size: 21, weight: 800, fill: on ? c : 'muted', align: 'left' });
        line(ctx, TX0, y, TX1, y, 'rgba(140,170,255,0.3)', 8);
        line(ctx, TX0, y, lerp(TX0, TX1, clamp(f)), y, on ? c : tint(c, 0.5), 8);
        circ(ctx, lerp(TX0, TX1, clamp(f)), y, 13, on ? c : tint(c, 0.6), DARK, 3);
        label(ctx, hint, (TX0 + TX1) / 2, y + 28, { size: 18, weight: 500, fill: on ? 'ink' : 'muted' });
        chip(ctx, value, X0 + 650, y, on ? c : 'muted', 20);
      });
      // An iris that opens and closes with the aperture.
      const IX = X1 - 38; const IY = Y0 + 462; const ir = 22 * clamp(2.2 / N, 0.14, 1);
      circ(ctx, IX, IY, 26, '#1f2937', '#94a3b8', 2);
      ctx.fillStyle = '#e0f2fe'; ctx.beginPath(); for (let j = 0; j < 6; j++) { const a = (j / 6) * TAU + 0.3; if (j) ctx.lineTo(IX + Math.cos(a) * ir, IY + Math.sin(a) * ir); else ctx.moveTo(IX + Math.cos(a) * ir, IY + Math.sin(a) * ir); } ctx.closePath(); ctx.fill();
      label(ctx, B[3], cx, Y1 - 24, { size: 20, weight: 700, fill: B[4] < 0 ? 'green' : ROWS[B[4]][4] });
      ctx.restore();
    },
  };
}
