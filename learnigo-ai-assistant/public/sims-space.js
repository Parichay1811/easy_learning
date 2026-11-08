// Space and astronomy simulations for the board: eclipses of the Sun and the
// Moon, tides, black holes, our galaxy, the history of the universe, finding
// exoplanets, telescopes, a Mars rover, the space station, light-years,
// comets, meteor showers, constellations, weight on other worlds, inside the
// Sun, the scale of space and a deep-field view. Each is a function of time
// (t since it appeared, b.clock for the loop), drawn inside a starry window
// in the figure area: plain canvas calls and gradients, star positions cached
// on the item, no other state between frames. SPACE_SIMS says what each one
// is for, so a lesson's words can pick the right picture.

export const SPACE_SIMS = {
  'solar-eclipse': { title: 'Solar eclipse', keywords: ['solar eclipse', 'eclipse of the sun', 'total eclipse of the sun', 'umbra and penumbra', 'moon blocks the sun', 'partial solar eclipse'], example: {} },
  'lunar-eclipse': { title: 'Lunar eclipse', keywords: ['lunar eclipse', 'eclipse of the moon', 'blood moon', "earth's shadow on the moon", 'total lunar eclipse', 'moon turns red'], example: {} },
  'tides-moon': { title: 'Tides and the Moon', keywords: ['ocean tides', 'high tide and low tide', 'tides and the moon', 'tidal bulge', 'two tides a day', 'what causes tides', 'tidal force'], example: {} },
  'black-hole': { title: 'Black hole', keywords: ['black hole', 'black holes', 'event horizon', 'accretion disc', 'accretion disk', 'spaghettification', 'gravitational lensing'], example: {} },
  'milky-way-galaxy': { title: 'The Milky Way', keywords: ['milky way', 'our galaxy', 'spiral galaxy', 'spiral arms', 'galactic centre', 'galactic center', 'where is the sun in the galaxy'], example: {} },
  'big-bang-timeline': { title: 'History of the universe', keywords: ['big bang timeline', 'history of the universe', 'age of the universe', '13.8 billion years', 'beginning of the universe', 'how the universe began', 'origin of the universe'], example: {} },
  'exoplanet-transit': { title: 'Finding exoplanets', keywords: ['exoplanet transit', 'transit method', 'finding exoplanets', 'planets around other stars', 'light curve dip', 'kepler space telescope'], example: {} },
  'telescope-types': { title: 'Types of telescope', keywords: ['types of telescope', 'refracting telescope', 'reflecting telescope', 'radio telescope', 'james webb space telescope', 'how telescopes work'], example: {} },
  'mars-rover': { title: 'Mars rover', keywords: ['mars rover', 'perseverance rover', 'curiosity rover', 'exploring mars', 'signal delay to mars', 'robots on mars'], example: {} },
  'iss-orbit': { title: 'The International Space Station', keywords: ['international space station', 'space station orbit', 'iss orbit', 'astronauts in orbit', '16 sunrises a day', 'low earth orbit'], example: {} },
  'light-years': { title: 'Light-years', keywords: ['light-year', 'light year', 'light-years', 'light-minutes', 'how far is a light year', 'proxima centauri', 'speed of light in space'], example: {} },
  'comet-orbit': { title: "A comet's orbit", keywords: ['comet orbit', "comet's tail", 'comet tail', "halley's comet", 'dirty snowball', 'tail points away from the sun'], example: {} },
  'meteor-shower': { title: 'Meteor shower', keywords: ['meteor shower', 'shooting stars', 'perseid meteor shower', 'meteors burn up', 'radiant point', 'geminid meteor shower'], example: {} },
  constellations: { title: 'Constellations', keywords: ['star constellations', 'orion constellation', 'orion the hunter', 'big dipper', 'the plough', 'patterns of stars', 'join the stars'], example: {} },
  'planet-weights': { title: 'Your weight on other worlds', keywords: ['weight on other planets', 'weight on the moon', 'weight on mars', 'gravity on other planets', 'mass and weight on planets', 'weigh on jupiter'], example: { mass: 40 } },
  'inside-the-sun': { title: 'Inside the Sun', keywords: ['layers of the sun', 'inside the sun', 'solar flare', "sun's core", 'nuclear fusion in the sun', 'solar corona', 'photosphere and chromosphere'], example: {} },
  'space-scale': { title: 'The scale of space', keywords: ['scale of the universe', 'size of the universe', 'how big is space', 'powers of ten', 'observable universe', 'distances in space'], example: {} },
  'space-telescope-view': { title: 'A deep-field view', keywords: ['hubble deep field', 'ultra deep field', 'deep field image', 'jwst deep field', 'thousands of galaxies', 'how many galaxies'], example: {} },
};

export function spaceSims(kit) {
  // eslint-disable-next-line no-unused-vars
  const { FIG, COLORS, FONT, glow, label, rounded, arrow, clamp, easeOut, outBack, color, tint } = kit;
  const X0 = FIG.x; const Y0 = FIG.y; const X1 = FIG.x + FIG.w; const Y1 = FIG.y + FIG.h;
  const cx = X0 + FIG.w / 2; const cy = Y0 + FIG.h / 2;
  const TAU = Math.PI * 2; const PI = Math.PI; const D2R = PI / 180;
  const TOP = Y0 + 58; // the top of the starry window, under the title

  // Small tools: numbers, timing, loops.
  const val = (v, d) => { const n = Number(v); return v !== null && v !== undefined && v !== '' && Number.isFinite(n) ? n : d; };
  const mod = (a, n) => ((a % n) + n) % n;
  const smooth = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
  const lerp = (a, c, p) => a + (c - a) * p;
  const fade = (ctx, t, d = 0.5) => { const q = easeOut(clamp(t / d)); ctx.globalAlpha *= q; return q; };
  const after = (t, at, d = 0.4) => easeOut(clamp((t - at) / d));
  const cycle = (t, period, delay = 0.6) => (t < delay ? 0 : mod(t - delay, period));
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const gauss = (i) => (rnd(i) + rnd(i + 0.37) + rnd(i + 0.71) - 1.5) * 1.2;
  const commas = (n) => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  // A colour lighter (f > 1) or darker (f < 1), with alpha.
  const shade = (h, f, a = 1) => { const m = (v) => Math.round(clamp(f > 1 ? v + (255 - v) * (f - 1) : v * f, 0, 255)); const [r, g, bl] = hex(h); return `rgba(${m(r)},${m(g)},${m(bl)},${a})`; };
  const mixRGB = (h1, h2, p, a = 1) => { const A = hex(h1); const B = hex(h2); return `rgba(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(p)))).join(',')},${a})`; };

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
  }
  function dot(ctx, x, y, r, c) { ctx.fillStyle = color(c); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  function line(ctx, x0, y0, x1, y1, c = 'rgba(220,230,255,0.8)', w = 2, dash) {
    ctx.strokeStyle = color(c); ctx.lineWidth = w;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    if (dash) ctx.setLineDash([]);
  }
  function arr(ctx, x0, y0, x1, y1, c, w = 4) { if (Math.hypot(x1 - x0, y1 - y0) > 4) arrow(ctx, x0, y0, x1, y1, c, w); }
  function poly(ctx, pts, close = true) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    if (close) ctx.closePath();
  }
  function panel(ctx, x, y, w, h, c = 'blue', a = 0.1, r = 16) {
    ctx.fillStyle = 'rgba(5,8,22,0.72)'; rounded(ctx, x, y, w, h, r); ctx.fill();
    ctx.fillStyle = tint(c, a); ctx.strokeStyle = tint(c, 0.55); ctx.lineWidth = 1.5;
    rounded(ctx, x, y, w, h, r); ctx.fill(); ctx.stroke();
  }
  // A thin pointer from a label to the thing it names.
  function leader(ctx, x0, y0, x1, y1, c = 'rgba(220,230,255,0.7)') {
    line(ctx, x0, y0, x1, y1, c, 1.5);
    dot(ctx, x1, y1, 3, c);
  }
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
  // Area shared by two circles of radii r1, r2 whose centres are d apart.
  function overlap(r1, r2, d) {
    if (d >= r1 + r2) return 0;
    if (d <= Math.abs(r1 - r2)) return PI * Math.min(r1, r2) ** 2;
    const a1 = r1 * r1 * Math.acos(clamp((d * d + r1 * r1 - r2 * r2) / (2 * d * r1), -1, 1));
    const a2 = r2 * r2 * Math.acos(clamp((d * d + r2 * r2 - r1 * r1) / (2 * d * r2), -1, 1));
    return a1 + a2 - 0.5 * Math.sqrt(Math.max(0, (-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2)));
  }

  // ─── The starry window ──────────────────────────────────────────────────
  function mkStars(n, seed, x0 = X0, y0 = TOP, w = FIG.w, h = Y1 - TOP) {
    const out = [];
    const tints = ['255,255,255', '205,222,255', '255,238,205', '185,205,255'];
    for (let i = 0; i < n; i++) {
      const q = rnd(seed * 997 + i * 3 + 1);
      out.push({ x: x0 + rnd(seed * 997 + i * 3) * w, y: y0 + rnd(seed * 997 + i * 3 + 2) * h, r: 0.5 + q * q * q * 2.1, ph: rnd(seed * 71 + i * 1.3) * TAU, sp: 0.5 + rnd(seed * 89 + i * 1.7) * 2.2, c: tints[Math.floor(rnd(seed * 53 + i * 2.1) * 4)] });
    }
    return out;
  }
  function drawStars(ctx, S, k, a = 1) {
    for (const s of S) {
      const tw = 0.6 + 0.4 * Math.sin(k * s.sp + s.ph);
      ctx.fillStyle = `rgba(${s.c},${clamp((0.3 + 0.7 * tw) * a * Math.min(1, 0.45 + s.r * 0.4))})`;
      if (s.r > 1.4) {
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
        if (s.r > 2.1) { ctx.fillRect(s.x - s.r * 2.6, s.y - 0.5, s.r * 5.2, 1); ctx.fillRect(s.x - 0.5, s.y - s.r * 2.6, 1, s.r * 5.2); }
      } else ctx.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
    }
  }
  function nebula(ctx, x, y, r, rgb, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  // Fills the window with deep space and clips to it (the caller's restore undoes the clip).
  function space(ctx, it, k, o = {}) {
    rounded(ctx, X0 + 2, TOP, FIG.w - 4, Y1 - TOP - 2, 18);
    const g = ctx.createRadialGradient(cx, cy - 80, 30, cx, cy, 640);
    g.addColorStop(0, o.c0 || '#0f1a40'); g.addColorStop(1, o.c1 || '#02040c');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(140,170,255,0.28)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.clip();
    if (o.nebula !== false) { nebula(ctx, X0 + 170, TOP + 150, 300, '120,90,230', 0.14); nebula(ctx, X1 - 130, Y1 - 170, 320, '30,170,220', 0.09); }
    const key = `_st${o.seed || 1}`;
    const S = it[key] || (it[key] = mkStars(o.n ?? 170, o.seed || 1));
    drawStars(ctx, S, k, o.a ?? 1);
  }

  // ─── Suns, planets and moons ────────────────────────────────────────────
  function sunBall(ctx, x, y, r, halo = 2.6) {
    const g = ctx.createRadialGradient(x, y, r * 0.7, x, y, r * halo);
    g.addColorStop(0, 'rgba(255,205,100,0.6)'); g.addColorStop(0.3, 'rgba(255,160,50,0.2)'); g.addColorStop(1, 'rgba(255,120,30,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * halo, 0, TAU); ctx.fill();
    const d = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, r * 0.05, x, y, r);
    d.addColorStop(0, '#fffdf0'); d.addColorStop(0.5, '#ffe27a'); d.addColorStop(0.85, '#ffb23e'); d.addColorStop(1, '#ff8a24');
    ctx.fillStyle = d; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  // The dark side of a ball lit from direction la (the angle the light comes from).
  function night(ctx, x, y, r, la, a = 0.85) {
    const dx = Math.cos(la); const dy = Math.sin(la);
    const g = ctx.createLinearGradient(x + dx * r, y + dy * r, x - dx * r, y - dy * r);
    g.addColorStop(0, 'rgba(2,4,14,0)'); g.addColorStop(0.44, 'rgba(2,4,14,0)'); g.addColorStop(0.56, `rgba(2,4,14,${a})`); g.addColorStop(1, `rgba(2,4,14,${a})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r + 0.5, 0, TAU); ctx.fill();
  }
  // A shaded ball of one colour, lit from la.
  function ball(ctx, x, y, r, base, la = -2.3) {
    const g = ctx.createRadialGradient(x + Math.cos(la) * r * 0.45, y + Math.sin(la) * r * 0.45, r * 0.05, x, y, r * 1.05);
    g.addColorStop(0, shade(base, 1.45)); g.addColorStop(0.55, shade(base, 1)); g.addColorStop(1, shade(base, 0.32));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  // Continents as soft blobs [longitude, latitude, size in degrees].
  const LAND = [
    // North America
    [-100, 48, 14], [-112, 58, 12], [-88, 42, 9], [-120, 42, 9], [-100, 34, 9], [-80, 52, 9], [-150, 63, 9], [-128, 56, 8], [-95, 60, 10], [-75, 44, 6], [-104, 24, 6], [-92, 17, 4], [-84, 11, 3],
    // South America
    [-62, -6, 12], [-52, -14, 9], [-58, -26, 9], [-66, -38, 6], [-70, -48, 4], [-74, 4, 7], [-68, -16, 7],
    // Europe
    [8, 48, 8], [22, 52, 8], [0, 44, 5], [36, 56, 9], [15, 62, 6], [-3, 54, 3], [26, 40, 4],
    // Africa
    [18, 8, 13], [8, 20, 12], [26, 20, 11], [24, -6, 11], [26, -20, 9], [28, -30, 5], [0, 10, 8], [40, 8, 6], [46, -18, 3],
    // Asia
    [90, 52, 15], [110, 36, 12], [70, 36, 9], [128, 58, 11], [102, 20, 7], [78, 21, 7], [140, 38, 4], [60, 54, 11], [44, 30, 8], [110, 62, 12], [150, 64, 9], [118, 0, 5], [106, 48, 10],
    // Australia
    [134, -24, 10], [144, -32, 5], [122, -22, 5],
  ];

  function earth(ctx, x, y, r, rot, la = null, lights = true) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, '#64b6ff'); g.addColorStop(0.6, '#1f6dd0'); g.addColorStop(1, '#0a2c6e');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    const cities = [];
    for (const [lon, lat, sz] of LAND) {
      const dl = lon * D2R - rot; const cl = Math.cos(lat * D2R); const z = cl * Math.cos(dl);
      if (z < -0.1) continue;
      const px = x + r * cl * Math.sin(dl); const py = y - r * Math.sin(lat * D2R);
      const rr = r * sz * D2R * 1.15;
      ctx.fillStyle = (lat > 14 && lat < 32 && lon > -20 && lon < 80) || (lat > -32 && lat < -18 && lon > 115) ? '#b9a060' : lat > 55 ? '#5c8f5a' : '#3f9a55';
      ctx.beginPath(); ctx.ellipse(px, py, rr * Math.max(0.12, Math.cos(dl)), rr * (0.55 + 0.45 * cl), 0, 0, TAU); ctx.fill();
      if (z > 0.1 && Math.abs(lat) < 60) cities.push([px, py, rr]);
    }
    // Polar ice caps.
    ctx.fillStyle = 'rgba(236,245,255,0.92)';
    ctx.beginPath(); ctx.ellipse(x, y - r, r * 0.36, r * 0.07, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y + r, r * 0.46, r * 0.1, 0, 0, TAU); ctx.fill();
    // Clouds drift a little faster than the ground turns.
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    for (let i = 0; i < 14; i++) {
      const lon = rnd(i * 3.1) * TAU; const lat = (rnd(i * 5.3) - 0.5) * 2.2; const dl = lon - rot * 1.25; const z = Math.cos(lat) * Math.cos(dl);
      if (z < 0.05) continue;
      ctx.beginPath(); ctx.ellipse(x + r * Math.cos(lat) * Math.sin(dl), y - r * Math.sin(lat), r * 0.16 * Math.cos(dl), r * 0.05, 0, 0, TAU); ctx.fill();
    }
    if (la !== null) {
      night(ctx, x, y, r, la, 0.84);
      if (lights) {
        ctx.fillStyle = 'rgba(255,214,120,0.85)';
        const dx = Math.cos(la); const dy = Math.sin(la);
        for (const [px, py, rr] of cities) {
          if (((px - x) * dx + (py - y) * dy) / r > -0.12) continue;
          for (let j = 0; j < 4; j++) ctx.fillRect(px + (rnd(px + j) - 0.5) * rr, py + (rnd(py + j * 2) - 0.5) * rr * 0.8, 1.6, 1.6);
        }
      }
    } else {
      const s = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.4, x, y, r * 1.05);
      s.addColorStop(0, 'rgba(0,0,20,0)'); s.addColorStop(1, 'rgba(0,0,20,0.55)');
      ctx.fillStyle = s; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(120,190,255,0.55)'; ctx.lineWidth = Math.max(1.5, r * 0.04);
    ctx.beginPath(); ctx.arc(x, y, r + ctx.lineWidth / 2, 0, TAU); ctx.stroke();
  }
  // Earth seen from above the North Pole, turning anticlockwise.
  function earthPolar(ctx, x, y, r, rot) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
    const g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.1, x, y, r);
    g.addColorStop(0, '#5aaefc'); g.addColorStop(0.7, '#1f6dd0'); g.addColorStop(1, '#0b3278');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    for (const [lon, lat, sz] of LAND) {
      if (lat < -40) continue;
      const rho = (r * (90 - lat)) / 125; const a = lon * D2R + rot; const rr = (r * sz) / 110;
      ctx.fillStyle = lat > 14 && lat < 32 && lon > -20 && lon < 80 ? '#b9a060' : '#3f9a55';
      ctx.beginPath(); ctx.ellipse(x + rho * Math.cos(a), y - rho * Math.sin(a), rr, rr * 0.8, -a, 0, TAU); ctx.fill();
    }
    dot(ctx, x, y, r * 0.13, 'rgba(240,248,255,0.9)');
    ctx.restore();
  }
  function moonBall(ctx, x, y, r, la = null, nightA = 0.9) {
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.05, x, y, r);
    g.addColorStop(0, '#f4f3ee'); g.addColorStop(0.7, '#bdbcb6'); g.addColorStop(1, '#77766f');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
    ctx.fillStyle = 'rgba(95,95,105,0.38)';
    for (const [dx, dy, s] of [[-0.25, -0.2, 0.3], [0.22, -0.32, 0.2], [0.1, 0.15, 0.26], [-0.32, 0.32, 0.15], [0.4, 0.28, 0.12]]) { ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, s * r, 0, TAU); ctx.fill(); }
    if (la !== null) night(ctx, x, y, r, la, nightA);
    ctx.restore();
  }

  // The tangent lines between a light source A and a ball B: the umbra
  // (between the outer tangents) and the penumbra (between the inner ones),
  // as polygons stretching L beyond B.
  function shadows(A, B, L) {
    const dx = B.x - A.x; const dy = B.y - A.y; const d = Math.hypot(dx, dy); const ux = dx / d; const uy = dy / d;
    const rot = (c, s) => [ux * c - uy * s, uy * c + ux * s];
    const ce = (A.r - B.r) / d; const se = Math.sqrt(1 - ce * ce);
    const ci = clamp((A.r + B.r) / d, -1, 1); const si = Math.sqrt(1 - ci * ci);
    const apex = B.r < A.r ? (d * B.r) / (A.r - B.r) : 1e9;
    const umb = []; const pen = []; const pl = [];
    for (const sg of [1, -1]) {
      const [nx, ny] = rot(ce, se * sg);
      const p1x = A.x + A.r * nx; const p1y = A.y + A.r * ny; const p2x = B.x + B.r * nx; const p2y = B.y + B.r * ny;
      const ex = p2x - p1x; const ey = p2y - p1y; const el = Math.hypot(ex, ey);
      const lu = Math.min(L, Math.hypot(B.x + ux * apex - p2x, B.y + uy * apex - p2y));
      umb.push([p2x, p2y, p2x + (ex / el) * lu, p2y + (ey / el) * lu]);
      const [mx, my] = rot(ci, si * sg);
      const q1x = A.x + A.r * mx; const q1y = A.y + A.r * my; const q2x = B.x - B.r * mx; const q2y = B.y - B.r * my;
      const fx = q2x - q1x; const fy = q2y - q1y; const fl = Math.hypot(fx, fy);
      pen.push([q2x, q2y, q2x + (fx / fl) * L, q2y + (fy / fl) * L]);
      pl.push({ x: q2x, y: q2y, dx: fx / fl, dy: fy / fl });
    }
    return {
      umbra: [umb[0][0], umb[0][1], umb[0][2], umb[0][3], umb[1][2], umb[1][3], umb[1][0], umb[1][1]],
      penumbra: [pen[0][0], pen[0][1], pen[0][2], pen[0][3], pen[1][2], pen[1][3], pen[1][0], pen[1][1]],
      penEdges: pl, umbEdges: umb,
    };
  }

  // ─── Small figures ──────────────────────────────────────────────────────
  // A little astronaut standing with feet at (x, y), about 92 px tall.
  function astronaut(ctx, x, y, s = 1, legSpread = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#c9d2e6'; rounded(ctx, -20, -64, 12, 30, 5); ctx.fill(); // backpack
    ctx.strokeStyle = '#e8edf8'; ctx.lineCap = 'round'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(-6, -26); ctx.lineTo(-8 - legSpread, -4); ctx.moveTo(6, -26); ctx.lineTo(8 + legSpread, -4); ctx.stroke();
    ctx.fillStyle = '#9aa6c2'; rounded(ctx, -15 - legSpread, -6, 14, 7, 3); ctx.fill(); rounded(ctx, 1 + legSpread, -6, 14, 7, 3); ctx.fill();
    ctx.fillStyle = '#f2f5fc'; rounded(ctx, -14, -64, 28, 42, 10); ctx.fill();
    ctx.lineWidth = 8; ctx.strokeStyle = '#e8edf8';
    ctx.beginPath(); ctx.moveTo(-12, -56); ctx.lineTo(-22, -36 - legSpread * 0.8); ctx.moveTo(12, -56); ctx.lineTo(22, -36 - legSpread * 0.8); ctx.stroke();
    ctx.fillStyle = '#ff9f43'; ctx.fillRect(-6, -52, 12, 8);
    ctx.fillStyle = '#f7f9ff'; ctx.beginPath(); ctx.arc(0, -76, 15, 0, TAU); ctx.fill();
    const v = ctx.createLinearGradient(-9, -84, 9, -68); v.addColorStop(0, '#5fd4ff'); v.addColorStop(1, '#1b3f8f');
    ctx.fillStyle = v; rounded(ctx, -10, -84, 20, 14, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-6, -82, 4, 3);
    ctx.restore();
  }
  // A flat-topped hexagon.
  function hexagon(ctx, x, y, r) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else ctx.moveTo(x + r, y); } ctx.closePath(); }
  // A glowing light dot with a fading trail behind it.
  function photon(ctx, x, y, tx, ty, c = '255,240,190', r = 5) {
    const g = ctx.createLinearGradient(tx, ty, x, y); g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(1, `rgba(${c},0.9)`);
    ctx.strokeStyle = g; ctx.lineWidth = r * 0.9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
    const h = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2); h.addColorStop(0, `rgba(${c},0.95)`); h.addColorStop(0.3, `rgba(${c},0.45)`); h.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = h; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, TAU); ctx.fill();
    dot(ctx, x, y, r * 0.6, '#ffffff');
  }

  return {
    // ─── Eclipses and tides ───────────────────────────────────────────────

    // The Moon slides between the Sun and Earth; its umbra and penumbra
    // sweep across Earth, and an inset shows the sky from inside the shadow.
    'solar-eclipse'(b, ctx, it, t) {
      const k = b.clock; const P = 13; const u = cycle(t, P, 0.4) / P;
      const s = 2 * u - 1; const dy = 110 * s * s * s;
      const ay = Y0 + 228;
      const S = { x: X0 + 95, y: ay, r: 66 }; const M = { x: X0 + 440, y: ay + dy, r: 25 }; const E = { x: X0 + 700, y: ay, r: 78 };
      const vis = clamp(Math.min(u, 1 - u) / 0.05);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Solar eclipse');
      space(ctx, it, k, { n: 130 });
      // A beam of sunlight spreading right, so the shadows show against it.
      ctx.save(); poly(ctx, [S.x, S.y - S.r, X1, ay - 175, X1, ay + 175, S.x, S.y + S.r]); ctx.clip();
      const wash = ctx.createLinearGradient(S.x, 0, X1, 0); wash.addColorStop(0, 'rgba(255,214,120,0.26)'); wash.addColorStop(1, 'rgba(255,214,120,0.07)');
      ctx.fillStyle = wash; ctx.fillRect(S.x, ay - 180, X1 - S.x, 360);
      ctx.restore();
      const sh = shadows(S, M, 520);
      ctx.save(); ctx.globalAlpha *= vis;
      poly(ctx, sh.penumbra); ctx.fillStyle = 'rgba(4,6,20,0.62)'; ctx.fill();
      poly(ctx, sh.umbra); ctx.fillStyle = 'rgba(0,0,0,0.92)'; ctx.fill();
      ctx.setLineDash([6, 6]); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(190,200,230,0.55)';
      for (const e of sh.penEdges) { ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + e.dx * 520, e.y + e.dy * 520); ctx.stroke(); }
      ctx.setLineDash([]);
      ctx.restore();
      earth(ctx, E.x, E.y, E.r, k * 0.25, PI, false);
      // The shadow falling on Earth's day side.
      ctx.save(); ctx.globalAlpha *= vis; ctx.beginPath(); ctx.arc(E.x, E.y, E.r, 0, TAU); ctx.clip();
      poly(ctx, sh.penumbra); ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fill();
      poly(ctx, sh.umbra); ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fill();
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= vis; moonBall(ctx, M.x, M.y, M.r, PI); ctx.restore();
      sunBall(ctx, S.x, S.y, S.r, 1.9);
      label(ctx, 'Sun', S.x, S.y + S.r + 26, { size: 21, weight: 700, fill: 'yellow' });
      label(ctx, 'Earth', E.x, E.y + E.r + 26, { size: 21, weight: 700, fill: 'cyan' });
      ctx.save(); ctx.globalAlpha *= vis; label(ctx, 'Moon', M.x, M.y - M.r - 22, { size: 20, weight: 700, fill: 'ink' }); ctx.restore();
      // Name the shadows while they reach Earth.
      const near = clamp((40 - Math.abs(dy)) / 15);
      if (near > 0) {
        ctx.save(); ctx.globalAlpha *= near;
        const xs = X0 + 572; const yAxis = ay + (dy * (xs - S.x)) / (M.x - S.x);
        const up = sh.penEdges.map((e) => e.y + ((xs - e.x) * e.dy) / e.dx).sort((p, q) => p - q)[0];
        leader(ctx, xs, Y0 + 104, xs, up + 12, 'rgba(200,210,240,0.8)');
        chip(ctx, 'penumbra', xs, Y0 + 90, 'muted', 18);
        leader(ctx, xs, Y0 + 368, xs, yAxis + 2, 'rgba(255,200,120,0.9)');
        chip(ctx, 'umbra', xs, Y0 + 382, 'orange', 18);
        ctx.restore();
      }
      // The view from Earth: the Moon's disc crossing the Sun's.
      const ix = X0 + 150; const iy = Y0 + 528; const IR = 90; const off = dy * 1.15;
      const cover = overlap(44, 46, Math.abs(off)) / (PI * 44 * 44);
      const dark = cover ** 3;
      label(ctx, 'View from Earth', ix, iy - IR - 20, { size: 19, weight: 700, fill: 'muted' });
      ctx.save(); ctx.beginPath(); ctx.arc(ix, iy, IR, 0, TAU); ctx.clip();
      ctx.fillStyle = mixRGB('#3f86d6', '#040817', dark); ctx.fillRect(ix - IR, iy - IR, 2 * IR, 2 * IR);
      if (dark > 0.5) { ctx.fillStyle = `rgba(255,255,255,${(dark - 0.5) * 1.6})`; for (let i = 0; i < 14; i++) ctx.fillRect(ix - IR + rnd(i * 4.1) * 2 * IR, iy - IR + rnd(i * 6.7) * 2 * IR, 2, 2); }
      if (cover > 0.96) {
        const ca = (cover - 0.96) / 0.04;
        const cg = ctx.createRadialGradient(ix, iy, 40, ix, iy, 95); cg.addColorStop(0, `rgba(235,240,255,${0.85 * ca})`); cg.addColorStop(0.35, `rgba(200,215,255,${0.3 * ca})`); cg.addColorStop(1, 'rgba(200,215,255,0)');
        ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(ix, iy, 95, 0, TAU); ctx.fill();
        ctx.strokeStyle = `rgba(235,240,255,${0.35 * ca})`; ctx.lineWidth = 2;
        for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU + 0.2; const L = 62 + 26 * rnd(i * 3.3); ctx.beginPath(); ctx.moveTo(ix + Math.cos(a) * 46, iy + Math.sin(a) * 46); ctx.lineTo(ix + Math.cos(a) * L, iy + Math.sin(a) * L); ctx.stroke(); }
      }
      if (cover < 0.999) sunBall(ctx, ix, iy, 44, 1.5 - dark * 0.5);
      ctx.save(); ctx.globalAlpha *= vis; dot(ctx, ix, iy + off, 46, mixRGB('#2a3550', '#05070f', dark)); ctx.restore();
      ctx.restore();
      ctx.strokeStyle = 'rgba(160,190,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ix, iy, IR, 0, TAU); ctx.stroke();
      // What is happening now.
      const tx = X0 + 280; const tw = X1 - 20 - tx;
      const total = cover > 0.995; const part = cover > 0.005;
      label(ctx, total ? 'Total eclipse!' : part ? 'Partial eclipse' : 'The Moon moves in…', tx, Y0 + 446, { size: 25, weight: 800, fill: total ? 'yellow' : part ? 'orange' : 'ink', align: 'left' });
      para(ctx, total ? 'Inside the umbra the Sun is hidden: day turns dark and the glowing corona appears.' : part ? 'In the penumbra the Moon covers only part of the Sun.' : 'At new Moon it can pass right between the Sun and Earth.', tx, Y0 + 496, tw, 19, 'ink', 500, 2, 'left');
      ctx.fillStyle = 'rgba(0,0,0,0.95)'; ctx.strokeStyle = 'rgba(255,200,120,0.8)'; ctx.lineWidth = 1.5; rounded(ctx, tx, Y0 + 552, 28, 18, 4); ctx.fill(); ctx.stroke();
      label(ctx, 'umbra: the Sun is fully hidden', tx + 40, Y0 + 561, { size: 19, weight: 600, fill: 'ink', align: 'left' });
      ctx.fillStyle = 'rgba(40,46,70,0.95)'; ctx.strokeStyle = 'rgba(200,210,240,0.7)'; rounded(ctx, tx, Y0 + 590, 28, 18, 4); ctx.fill(); ctx.stroke();
      label(ctx, 'penumbra: partly hidden', tx + 40, Y0 + 599, { size: 19, weight: 600, fill: 'ink', align: 'left' });
      label(ctx, 'Sizes and distances not to scale', cx, Y1 - 26, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // The Moon glides through Earth's shadow and turns coppery red, lit by
    // sunlight bent through Earth's air.
    'lunar-eclipse'(b, ctx, it, t) {
      const k = b.clock; const P = 14; const u = cycle(t, P, 0.4) / P;
      const s = 2 * u - 1; const dy = 150 * s * s * s;
      const ay = Y0 + 232;
      const E = { x: X0 + 330, y: ay, r: 56 }; const M = { x: X0 + 650, y: ay + dy, r: 22 };
      // A distant stand-in for the Sun gives gently sloping shadow edges.
      const V = { x: E.x - 7700, y: ay, r: 56 + 370 };
      const sh = shadows(V, E, 520);
      const vis = clamp(Math.min(u, 1 - u) / 0.05);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Lunar eclipse');
      space(ctx, it, k, { n: 150, seed: 2 });
      for (const yy of [-110, -55, 55, 110]) arr(ctx, X0 + 150, ay + yy, X0 + 236, ay + yy, 'rgba(255,214,120,0.75)', 3);
      // The shadow behind Earth.
      poly(ctx, sh.penumbra); ctx.fillStyle = 'rgba(4,6,20,0.55)'; ctx.fill();
      poly(ctx, sh.umbra); ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fill();
      ctx.setLineDash([6, 6]); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(190,200,230,0.5)';
      for (const e of sh.penEdges) { ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + e.dx * 520, e.y + e.dy * 520); ctx.stroke(); }
      ctx.setLineDash([]);
      // Red sunlight bent by Earth's air into the umbra.
      ctx.strokeStyle = 'rgba(255,110,60,0.55)'; ctx.lineWidth = 2;
      for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(E.x - 30, ay + sg * (E.r + 3)); ctx.quadraticCurveTo(E.x + 60, ay + sg * (E.r + 3), M.x - 40, ay + sg * 14); ctx.stroke(); }
      earth(ctx, E.x, E.y, E.r, k * 0.25, PI, true);
      ctx.strokeStyle = 'rgba(255,150,100,0.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(E.x, E.y, E.r + 4, -PI / 2, PI / 2); ctx.stroke();
      // The Moon, darkened and reddened by the parts of the shadow it is in.
      ctx.save(); ctx.globalAlpha *= vis;
      moonBall(ctx, M.x, M.y, M.r);
      ctx.save(); ctx.beginPath(); ctx.arc(M.x, M.y, M.r, 0, TAU); ctx.clip();
      poly(ctx, sh.penumbra); ctx.fillStyle = 'rgba(20,20,40,0.35)'; ctx.fill();
      poly(ctx, sh.umbra); ctx.fillStyle = 'rgba(150,48,22,0.86)'; ctx.fill();
      ctx.restore();
      label(ctx, 'Moon', M.x, M.y - M.r - 22, { size: 20, weight: 700, fill: 'ink' });
      ctx.restore();
      sunBall(ctx, X0 - 10, ay, 70, 2);
      label(ctx, 'Sun', X0 + 60, ay + 108, { size: 21, weight: 700, fill: 'yellow' });
      label(ctx, 'sunlight', X0 + 193, ay - 136, { size: 18, weight: 600, fill: 'yellow' });
      label(ctx, 'Earth', E.x, E.y + E.r + 28, { size: 21, weight: 700, fill: 'cyan' });
      // The view from Earth: the shadow creeping over the full Moon.
      const ix = X0 + 150; const iy = Y0 + 528; const IR = 90; const sc = 62 / M.r;
      const hu = Math.abs(sh.umbra[3] - sh.umbra[5]) / 2; const hp = E.r + (sh.penumbra[3] - sh.penumbra[5] > 0 ? 0 : 0);
      const xm = M.x - E.x; const huM = E.r - ((E.r - hu) * xm) / 520; const hpM = Math.abs((sh.penEdges[0].y + (M.x - sh.penEdges[0].x) * sh.penEdges[0].dy / sh.penEdges[0].dx) - ay);
      void hp;
      label(ctx, 'View from Earth', ix, iy - IR - 20, { size: 19, weight: 700, fill: 'muted' });
      ctx.save(); ctx.beginPath(); ctx.arc(ix, iy, IR, 0, TAU); ctx.clip();
      ctx.fillStyle = '#060a1c'; ctx.fillRect(ix - IR, iy - IR, 2 * IR, 2 * IR);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (let i = 0; i < 16; i++) ctx.fillRect(ix - IR + rnd(i * 3.9 + 2) * 2 * IR, iy - IR + rnd(i * 5.1 + 3) * 2 * IR, 1.6, 1.6);
      ctx.save(); ctx.globalAlpha *= vis;
      moonBall(ctx, ix, iy, 62);
      ctx.beginPath(); ctx.arc(ix, iy, 62, 0, TAU); ctx.clip();
      const oy = iy - dy * sc;
      ctx.fillStyle = 'rgba(20,20,40,0.35)'; ctx.beginPath(); ctx.arc(ix, oy, hpM * sc, 0, TAU); ctx.fill();
      const ug = ctx.createRadialGradient(ix, oy, 0, ix, oy, huM * sc); ug.addColorStop(0, 'rgba(110,30,14,0.92)'); ug.addColorStop(0.8, 'rgba(165,55,25,0.86)'); ug.addColorStop(1, 'rgba(190,80,40,0.8)');
      ctx.fillStyle = ug; ctx.beginPath(); ctx.arc(ix, oy, huM * sc, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.restore();
      ctx.strokeStyle = 'rgba(160,190,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ix, iy, IR, 0, TAU); ctx.stroke();
      // What is happening now.
      const dIn = Math.abs(dy);
      const total = dIn < huM - M.r; const part = dIn < huM + M.r; const pen = dIn < hpM + M.r;
      const tx = X0 + 280; const tw = X1 - 20 - tx;
      label(ctx, total ? 'Total: a red "blood moon"' : part ? 'Partial lunar eclipse' : pen ? 'Entering the penumbra' : 'Full Moon, moving in…', tx, Y0 + 446, { size: 24, weight: 800, fill: total ? 'red' : part ? 'orange' : 'ink', align: 'left' });
      para(ctx, total ? "Earth's air bends a little red sunlight into the shadow: the glow of every sunrise and sunset on Earth." : part ? "Earth's dark umbra is covering part of the Moon." : 'At full Moon, Earth can line up exactly between the Sun and the Moon.', tx, Y0 + 500, tw, 19, 'ink', 500, 3, 'left');
      label(ctx, 'Safe to watch with your own eyes', tx, Y0 + 580, { size: 19, weight: 700, fill: 'green', align: 'left' });
      label(ctx, 'Lasts up to about 1 hour 40 minutes in total', tx, Y0 + 612, { size: 18, weight: 500, fill: 'muted', align: 'left' });
      label(ctx, 'Sizes and distances not to scale', cx, Y1 - 26, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Seen from above the North Pole: the Moon's pull stretches the oceans
    // into two bulges, and Earth turns under them: two highs, two lows.
    'tides-moon'(b, ctx, it, t) {
      const k = b.clock; const T = 12; const u = cycle(t, T, 0.4);
      const rel = (u / T) * TAU; // where your beach is, measured from the Moon's direction
      const E = { x: X0 + 300, y: Y0 + 250, r: 90 }; const RX = 136; const RY = 104;
      const M = { x: X0 + 690, y: Y0 + 250, r: 32 };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Tides and the Moon');
      space(ctx, it, k, { n: 140, seed: 3 });
      // The ocean, stretched towards and away from the Moon.
      const wg = ctx.createRadialGradient(E.x, E.y, E.r, E.x, E.y, RX);
      wg.addColorStop(0, 'rgba(70,170,255,0.75)'); wg.addColorStop(1, 'rgba(110,210,255,0.55)');
      ctx.fillStyle = wg; ctx.beginPath(); ctx.ellipse(E.x, E.y, RX, RY, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(170,230,255,0.85)'; ctx.lineWidth = 2; ctx.stroke();
      earthPolar(ctx, E.x, E.y, E.r, rel + 0.6);
      // Your beach: a yellow marker on the turning Earth.
      const bx = E.x + Math.cos(rel) * E.r; const by = E.y - Math.sin(rel) * E.r;
      const wr = (RX * RY) / Math.hypot(RY * Math.cos(rel), RX * Math.sin(rel));
      line(ctx, bx, by, E.x + Math.cos(rel) * wr, E.y - Math.sin(rel) * wr, 'yellow', 4);
      dot(ctx, bx, by, 7, 'yellow'); dot(ctx, bx, by, 3, '#5a3b00');
      moonBall(ctx, M.x, M.y, M.r, 2.6, 0.5);
      label(ctx, 'Moon', M.x, M.y + M.r + 24, { size: 20, weight: 700, fill: 'ink' });
      // Labels for the bulges and the low water.
      chip(ctx, 'high tide', X0 + 476, Y0 + 168, 'cyan', 18); leader(ctx, X0 + 466, Y0 + 184, E.x + RX - 6, E.y - 10);
      chip(ctx, 'high tide', X0 + 124, Y0 + 168, 'cyan', 18); leader(ctx, X0 + 134, Y0 + 184, E.x - RX + 6, E.y - 10);
      chip(ctx, 'low tide', E.x, TOP + 26, 'muted', 18); leader(ctx, E.x, TOP + 42, E.x, E.y - RY + 2);
      // The Moon's pull: strongest on the near side, weakest on the far side.
      const gy = Y0 + 428;
      label(ctx, "The Moon's pull: strongest on the near side", E.x + 40, Y0 + 392, { size: 19, weight: 700, fill: 'ink' });
      [[E.x - E.r, 34, 'far side'], [E.x, 50, 'centre'], [E.x + E.r, 72, 'near side']].forEach(([x, L, nm]) => {
        dot(ctx, x, gy, 5, 'ink'); arr(ctx, x + 8, gy, x + 8 + L, gy, 'orange', 4);
        label(ctx, nm, x + 8, gy + 30, { size: 18, weight: 600, fill: 'muted' });
      });
      // The water level at your beach over a lunar day.
      const g = { x: X0 + 70, y: Y0 + 520, w: 680, h: 96 };
      const H = 24.84; const hr = (u / T) * H;
      label(ctx, 'Water at your beach', g.x, g.y - 24, { size: 19, weight: 700, fill: 'yellow', align: 'left' });
      chip(ctx, `${Math.floor(hr)} h ${String(Math.floor((hr % 1) * 60)).padStart(2, '0')} min`, X1 - 92, g.y - 24, 'yellow', 19);
      ctx.strokeStyle = 'rgba(140,170,255,0.25)'; ctx.lineWidth = 1;
      for (const h of [0, 6, 12, 18, 24]) { const x = g.x + (h / H) * g.w; ctx.beginPath(); ctx.moveTo(x, g.y); ctx.lineTo(x, g.y + g.h); ctx.stroke(); label(ctx, `${h} h`, x, g.y + g.h + 18, { size: 18, weight: 500, fill: 'muted' }); }
      ctx.strokeStyle = 'rgba(110,210,255,0.35)'; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= 120; i++) { const p = i / 120; const x = g.x + p * g.w; const y = g.y + g.h / 2 - Math.cos(p * 2 * TAU) * (g.h / 2 - 8); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke();
      ctx.strokeStyle = color('cyan'); ctx.lineWidth = 3.5; ctx.beginPath();
      const pn = u / T;
      for (let i = 0; i <= 120 * pn; i++) { const p = i / 120; const x = g.x + p * g.w; const y = g.y + g.h / 2 - Math.cos(p * 2 * TAU) * (g.h / 2 - 8); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke();
      dot(ctx, g.x + pn * g.w, g.y + g.h / 2 - Math.cos(pn * 2 * TAU) * (g.h / 2 - 8), 7, 'yellow');
      label(ctx, 'Two high tides and two low tides about every 24 h 50 min', cx, Y1 - 28, { size: 19, weight: 600, fill: 'ink' });
      ctx.restore();
    },

    // ─── Deep space ───────────────────────────────────────────────────────

    // A black hole with its glowing accretion disc, light bent around it,
    // and a rock calmly stretched as it falls in.
    'black-hole'(b, ctx, it, t) {
      const k = b.clock; const C = { x: cx, y: Y0 + 278 }; const RH = 62; const TILT = 0.24;
      const SD = 5; const u = cycle(t, SD * 4, 0.3); const st = Math.floor(u / SD); const su = u - st * SD;
      const env = clamp(su / 0.5) * clamp((SD - su) / 0.5);
      const D = it._bh || (it._bh = (() => {
        const parts = [];
        for (let i = 0; i < 240; i++) { const r = 92 + 160 * rnd(i * 1.7) ** 1.4; parts.push([r, rnd(i * 2.3) * TAU, 1.5 * (92 / r) ** 1.5, 1 + rnd(i * 3.1) * 1.8]); }
        const rays = [-200, -150, -110].map((off) => {
          let x = X0 + 6; let y = C.y + off; let vx = 1; let vy = 0; const pts = [x, y]; let captured = false;
          for (let i = 0; i < 400; i++) {
            const dx = C.x - x; const dy = C.y - y; const r = Math.hypot(dx, dy);
            if (r < RH) { captured = true; break; }
            const a = (18 / (r * r)) * (1 + 2 * (95 / r) ** 2) * 3;
            vx += (a * dx) / r; vy += (a * dy) / r; const vl = Math.hypot(vx, vy); vx /= vl; vy /= vl;
            x += vx * 3; y += vy * 3;
            if (i % 2) pts.push(x, y);
            if (x > X1 || y < TOP || y > Y1) break;
          }
          const cum = [0]; for (let i = 2; i < pts.length; i += 2) cum.push(cum[cum.length - 1] + Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]));
          return { pts, cum, captured };
        });
        return { parts, rays };
      })());
      const pos = (p) => { const a = p[1] - k * p[2]; return [C.x + p[0] * Math.cos(a), C.y + p[0] * Math.sin(a) * TILT, Math.sin(a), Math.cos(a)]; };
      const partDots = (front) => {
        for (const p of D.parts) {
          const [x, y, sn, cs] = pos(p);
          if ((sn > 0) !== front) continue;
          const hot = clamp((200 - p[0]) / 110); const beam = 0.6 + 0.4 * -cs;
          ctx.fillStyle = `rgba(255,${Math.round(150 + 100 * hot)},${Math.round(70 + 150 * hot)},${0.85 * beam})`;
          ctx.fillRect(x - p[3] / 2, y - p[3] / 2, p[3], p[3]);
        }
      };
      const disc = (front) => {
        ctx.save(); ctx.translate(C.x, C.y); ctx.scale(1, TILT);
        ctx.beginPath();
        if (front) { ctx.arc(0, 0, 255, 0, PI); ctx.arc(0, 0, 88, PI, 0, true); } else { ctx.arc(0, 0, 255, PI, TAU); ctx.arc(0, 0, 88, TAU, PI, true); }
        ctx.closePath();
        const g = ctx.createRadialGradient(0, 0, 86, 0, 0, 255);
        g.addColorStop(0, 'rgba(255,252,232,0.95)'); g.addColorStop(0.22, 'rgba(255,205,110,0.85)'); g.addColorStop(0.55, 'rgba(255,115,45,0.45)'); g.addColorStop(1, 'rgba(150,40,40,0)');
        ctx.fillStyle = g; ctx.fill();
        const d = ctx.createLinearGradient(-255, 0, 255, 0); d.addColorStop(0, 'rgba(255,255,255,0.22)'); d.addColorStop(0.5, 'rgba(255,255,255,0)'); d.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = d; ctx.fill();
        ctx.restore();
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Black hole');
      space(ctx, it, k, { n: 190, seed: 4 });
      nebula(ctx, C.x, C.y, 330, '255,140,60', 0.1);
      partDots(false); disc(false);
      // Light from the far side of the disc, bent over the top and under the bottom.
      ctx.save(); ctx.translate(C.x, C.y);
      let lg = ctx.createRadialGradient(0, 0, RH, 0, 0, RH + 54);
      lg.addColorStop(0, 'rgba(255,240,200,0)'); lg.addColorStop(0.12, 'rgba(255,236,190,0.95)'); lg.addColorStop(0.45, 'rgba(255,170,70,0.5)'); lg.addColorStop(1, 'rgba(255,110,40,0)');
      ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse(0, 0, RH + 54, RH + 46, 0, PI, TAU); ctx.lineTo(RH, 0); ctx.ellipse(0, 0, RH, RH, 0, TAU, PI, true); ctx.closePath(); ctx.fill();
      lg = ctx.createRadialGradient(0, 0, RH, 0, 0, RH + 26);
      lg.addColorStop(0, 'rgba(255,240,200,0)'); lg.addColorStop(0.2, 'rgba(255,220,160,0.7)'); lg.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse(0, 0, RH + 26, RH + 24, 0, 0, PI); ctx.lineTo(-RH, 0); ctx.ellipse(0, 0, RH, RH, 0, PI, 0, true); ctx.closePath(); ctx.fill();
      ctx.restore();
      dot(ctx, C.x, C.y, RH, '#000000');
      ctx.strokeStyle = 'rgba(255,238,200,0.95)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(C.x, C.y, RH + 2, 0, TAU); ctx.stroke();
      disc(true); partDots(true);
      // Stage 0: the event horizon.
      if (st === 0) {
        ctx.save(); ctx.globalAlpha *= env;
        const pr = RH + 9 + 4 * Math.sin(k * 4);
        ctx.strokeStyle = color('cyan'); ctx.lineWidth = 2.5; ctx.setLineDash([7, 6]); ctx.beginPath(); ctx.arc(C.x, C.y, pr, PI * 1.05, PI * 1.95); ctx.stroke(); ctx.setLineDash([]);
        chip(ctx, 'event horizon', X0 + 150, Y0 + 130, 'cyan', 19); leader(ctx, X0 + 196, Y0 + 147, C.x - pr * 0.72, C.y - pr * 0.7, color('cyan'));
        ctx.restore();
      }
      if (st === 1) {
        ctx.save(); ctx.globalAlpha *= env;
        chip(ctx, 'accretion disc', X0 + 650, Y0 + 400, 'orange', 19); leader(ctx, X0 + 640, Y0 + 383, C.x + 180, C.y + 20, color('orange'));
        chip(ctx, 'millions of °C', X0 + 150, Y0 + 400, 'yellow', 19); leader(ctx, X0 + 170, Y0 + 383, C.x - 150, C.y + 16, color('yellow'));
        ctx.restore();
      }
      if (st === 2) {
        ctx.save(); ctx.globalAlpha *= env;
        D.rays.forEach((ry, i) => {
          ctx.strokeStyle = 'rgba(190,170,255,0.75)'; ctx.lineWidth = 2; ctx.setLineDash([5, 6]);
          ctx.beginPath(); ctx.moveTo(ry.pts[0], ry.pts[1]); for (let j = 2; j < ry.pts.length; j += 2) ctx.lineTo(ry.pts[j], ry.pts[j + 1]); ctx.stroke(); ctx.setLineDash([]);
          const total = ry.cum[ry.cum.length - 1]; const dd = mod(su * 260 - i * 90, total + 200);
          if (dd < total) {
            let j = 1; while (j < ry.cum.length - 1 && ry.cum[j] < dd) j++;
            const q = (dd - ry.cum[j - 1]) / (ry.cum[j] - ry.cum[j - 1] || 1);
            const x = lerp(ry.pts[2 * j - 2], ry.pts[2 * j], q); const y = lerp(ry.pts[2 * j - 1], ry.pts[2 * j + 1], q);
            const j0 = Math.max(0, j - 8);
            photon(ctx, x, y, ry.pts[2 * j0], ry.pts[2 * j0 + 1], '205,185,255', 4);
          }
        });
        chip(ctx, 'light rays', X0 + 690, TOP + 24, 'purple', 18);
        { const cap = D.rays[2].pts; chip(ctx, 'this one falls in', X0 + 140, Y0 + 400, 'purple', 18); leader(ctx, X0 + 160, Y0 + 383, cap[cap.length - 2], cap[cap.length - 1], color('purple')); }
        ctx.restore();
      }
      if (st === 3) {
        // A rock falls straight in, stretching along the pull.
        const p = clamp(su / (SD - 0.6)); const ang = -0.72; const r = lerp(340, RH + 4, p * p);
        const ux = Math.cos(ang); const uy = Math.sin(ang); const x = C.x + ux * r; const y = C.y + uy * r;
        const L = 18 + 3600 / r; const w = Math.max(2.5, 15 - L * 0.16);
        ctx.save(); ctx.globalAlpha *= env * clamp((r - RH - 4) / 30);
        ctx.strokeStyle = '#c9b7a3'; ctx.lineWidth = w; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - ux * L / 2, y - uy * L / 2); ctx.lineTo(x + ux * L / 2, y + uy * L / 2); ctx.stroke();
        if (r < 260) {
          const a1 = 14 + 2400 / r; const a2 = 8 + 1000 / r;
          arr(ctx, x - ux * (L / 2 + 6), y - uy * (L / 2 + 6), x - ux * (L / 2 + 6 + a1), y - uy * (L / 2 + 6 + a1), 'green', 3.5);
          arr(ctx, x + ux * (L / 2 + 6), y + uy * (L / 2 + 6), x + ux * (L / 2 + 6 + a2), y + uy * (L / 2 + 6 + a2), 'green', 3.5);
        }
        ctx.restore();
        ctx.save(); ctx.globalAlpha *= env;
        chip(ctx, 'a falling rock', X0 + 640, TOP + 26, 'green', 18);
        ctx.restore();
      }
      // The caption for this stage.
      const CAP = [
        ['Event horizon', 'cyan', 'The black circle is the event horizon: once anything crosses it, not even light can get back out.'],
        ['Accretion disc', 'orange', 'Gas swirling around the black hole rubs and heats up to millions of degrees, so it glows brightly.'],
        ['Bending light', 'purple', 'Gravity this strong bends light. We even see the far side of the disc, curved over the top.'],
        ['Spaghettification', 'green', 'Near the hole, the near end of a rock is pulled harder than its far end, so it stretches long and thin.'],
      ][st];
      panel(ctx, X0 + 30, Y0 + 520, FIG.w - 60, 160, CAP[1], 0.08);
      label(ctx, CAP[0], cx, Y0 + 552, { size: 24, weight: 800, fill: CAP[1] });
      para(ctx, CAP[2], X0 + 56, Y0 + 618, FIG.w - 112, 20, 'ink', 500, 2);
      for (let i = 0; i < 4; i++) dot(ctx, cx - 36 + i * 24, Y0 + 664, i === st ? 6 : 4, i === st ? CAP[1] : 'rgba(150,170,220,0.5)');
      ctx.restore();
    },

    // Our spiral galaxy turning slowly, with the Sun marked about 26,000
    // light-years from the centre.
    'milky-way-galaxy'(b, ctx, it, t) {
      const k = b.clock; const G = { x: X0 + 285, y: Y0 + 292 }; const R = 212;
      const PITCH = 0.5;
      const armTh = (arm, f) => (arm * PI) / 2 + Math.log(f / 0.14) / PITCH;
      const W = it._mw || (it._mw = (() => {
        const pts = []; const glowB = [];
        for (let i = 0; i < 2600; i++) {
          const kind = rnd(i * 7.13); let x; let y; let c; let s;
          if (kind < 0.62) {
            const arm = rnd(i * 3.37) < 0.72 ? (rnd(i * 5.51) < 0.5 ? 0 : 2) : (rnd(i * 6.61) < 0.5 ? 1 : 3);
            const f = 0.14 + 0.86 * rnd(i * 1.79) ** 0.8;
            const th = armTh(arm, f) + gauss(i * 2.93) * (arm % 2 ? 0.12 : 0.2) * (1.2 - f * 0.5);
            const rr = R * f * (1 + gauss(i * 4.17) * 0.06);
            x = Math.cos(th) * rr; y = Math.sin(th) * rr;
            const q = rnd(i * 8.83); c = q < 0.05 ? 'rgba(255,120,190,0.9)' : q < 0.55 ? 'rgba(170,200,255,0.85)' : 'rgba(235,240,255,0.75)'; s = q < 0.05 ? 2.6 : 1 + rnd(i * 9.91) * 1.5;
          } else if (kind < 0.84) {
            const rr = R * rnd(i * 2.21) ** 0.75; const th = rnd(i * 4.43) * TAU;
            x = Math.cos(th) * rr; y = Math.sin(th) * rr; c = 'rgba(190,200,235,0.5)'; s = 0.8 + rnd(i * 5.9) * 0.9;
          } else {
            const bx = gauss(i * 1.31) * R * 0.17; const by = gauss(i * 2.71) * R * 0.07; const a = 0.45;
            x = bx * Math.cos(a) - by * Math.sin(a); y = bx * Math.sin(a) + by * Math.cos(a); c = 'rgba(255,214,150,0.85)'; s = 1 + rnd(i * 3.9) * 1.5;
          }
          pts.push([x, y, s, c]);
        }
        for (let i = 0; i < 90; i++) { const arm = i % 4; const f = 0.18 + 0.8 * rnd(i * 6.3); const th = armTh(arm, f) + gauss(i * 7.7) * 0.08; glowB.push([Math.cos(th) * R * f, Math.sin(th) * R * f, (arm % 2 ? 12 : 18) * (0.7 + 0.6 * rnd(i * 8.1))]); }
        pts.sort((p, q) => (p[3] < q[3] ? -1 : 1));
        return { pts, glowB };
      })());
      const rot = -k * 0.07;
      const sunTh = armTh(1, 0.52) + 0.06; const sunR = R * 0.52;
      const sx = G.x + Math.cos(sunTh + rot) * sunR; const sy = G.y + Math.sin(sunTh + rot) * sunR;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The Milky Way, our galaxy');
      space(ctx, it, k, { n: 120, seed: 5, a: 0.7 });
      // Halo, stars, and the bright bulge.
      nebula(ctx, G.x, G.y, R * 1.15, '120,140,255', 0.16);
      ctx.save(); ctx.translate(G.x, G.y); ctx.rotate(rot);
      ctx.fillStyle = 'rgba(120,150,255,0.07)';
      for (const [x, y, r] of W.glowB) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
      let last = '';
      for (const [x, y, s, c] of W.pts) { if (c !== last) { ctx.fillStyle = c; last = c; } ctx.fillRect(x - s / 2, y - s / 2, s, s); }
      ctx.rotate(0.45);
      const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, 62); cg.addColorStop(0, 'rgba(255,248,220,0.95)'); cg.addColorStop(0.3, 'rgba(255,214,140,0.55)'); cg.addColorStop(1, 'rgba(255,190,110,0)');
      ctx.scale(1.6, 0.8); ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, 62, 0, TAU); ctx.fill();
      ctx.restore();
      // You are here.
      const pulse = 0.5 + 0.5 * Math.sin(k * 3);
      ctx.strokeStyle = `rgba(251,191,36,${0.5 + 0.5 * pulse})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(sx, sy, 9 + pulse * 3, 0, TAU); ctx.stroke();
      dot(ctx, sx, sy, 3.5, 'yellow');
      line(ctx, G.x, G.y, sx, sy, 'rgba(251,191,36,0.55)', 1.5, [5, 5]);
      const lx = X0 + 540;
      leader(ctx, lx - 8, Y0 + 132, sx + (sx < lx ? 12 : -12), sy, 'rgba(251,191,36,0.85)');
      label(ctx, 'You are here', lx, Y0 + 132, { size: 23, weight: 800, fill: 'yellow', align: 'left' });
      label(ctx, 'about 26,000 light-years', lx, Y0 + 162, { size: 18, weight: 600, fill: 'ink', align: 'left' });
      label(ctx, 'from the centre', lx, Y0 + 186, { size: 18, weight: 600, fill: 'ink', align: 'left' });
      leader(ctx, lx - 8, Y0 + 262, G.x + 40, G.y + 4, 'rgba(255,214,150,0.85)');
      label(ctx, 'Central bulge', lx, Y0 + 262, { size: 20, weight: 700, fill: 'orange', align: 'left' });
      label(ctx, 'old stars and a bar', lx, Y0 + 288, { size: 18, weight: 500, fill: 'muted', align: 'left' });
      label(ctx, 'with a giant black hole', lx, Y0 + 312, { size: 18, weight: 500, fill: 'muted', align: 'left' });
      // Point at whichever arm is nearest the label.
      let best = null;
      for (let a = 0; a < 4; a += 2) for (const f of [0.7, 0.8, 0.9]) { const th = armTh(a, f) + rot; const px = G.x + Math.cos(th) * R * f; const py = G.y + Math.sin(th) * R * f; const sc = px - Math.abs(py - (Y0 + 400)) * 0.8; if (!best || sc > best[2]) best = [px, py, sc]; }
      leader(ctx, lx - 8, Y0 + 400, best[0], best[1], 'rgba(150,200,255,0.85)');
      label(ctx, 'Spiral arms', lx, Y0 + 400, { size: 20, weight: 700, fill: 'cyan', align: 'left' });
      label(ctx, 'young blue stars and', lx, Y0 + 426, { size: 18, weight: 500, fill: 'muted', align: 'left' });
      label(ctx, 'glowing pink gas', lx, Y0 + 450, { size: 18, weight: 500, fill: 'muted', align: 'left' });
      // Scale bar.
      const by = Y0 + 534;
      line(ctx, G.x - R, by, G.x + R, by, 'rgba(200,215,255,0.8)', 2);
      line(ctx, G.x - R, by - 8, G.x - R, by + 8, 'rgba(200,215,255,0.8)', 2); line(ctx, G.x + R, by - 8, G.x + R, by + 8, 'rgba(200,215,255,0.8)', 2);
      label(ctx, 'about 100,000 light-years across', G.x, by + 24, { size: 19, weight: 600, fill: 'ink' });
      panel(ctx, X0 + 30, Y0 + 592, FIG.w - 60, 90, 'purple', 0.08);
      label(ctx, '100 to 400 billion stars', cx, Y0 + 620, { size: 21, weight: 700, fill: 'ink' });
      label(ctx, 'The Sun goes round the centre once every 230 million years', cx, Y0 + 654, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // 13.8 billion years in one sweep: the universe expanding from the Big
    // Bang, with atoms, stars, galaxies, the Sun, Earth, life and us.
    'big-bang-timeline'(b, ctx, it, t) {
      const k = b.clock; const x0 = X0 + 40; const x1 = X1 - 34; const yc = Y0 + 205;
      const EV = [
        [0, 0, 'Big Bang: 13.8 billion years ago', 'Everything begins hot and tiny, then expands', 'yellow'],
        [1.6, 0.00038, 'First atoms: 380,000 years later', 'It cools enough for atoms; light travels freely', 'orange'],
        [3.2, 0.2, 'First stars: ~200 million years', 'Gravity pulls gas together; the first stars shine', 'cyan'],
        [4.8, 0.4, 'First galaxies: ~400 million years', 'Stars gather into great galaxies', 'purple'],
        [7.2, 9.2, 'The Sun: 4.6 billion years ago', 'Our Sun forms from a cloud of gas and dust', 'yellow'],
        [8.6, 9.26, 'Earth: 4.5 billion years ago', 'Earth forms from rock and dust around the Sun', 'blue'],
        [10.2, 10.0, 'First life: ~3.8 billion years ago', "Tiny living cells appear in Earth's oceans", 'green'],
        [12.4, 13.8, 'Humans: ~300,000 years ago', 'Humans arrive in the last blink of cosmic time', 'red'],
      ];
      const P = 15.5; const u = cycle(t, P, 0.5);
      let ei = 0; while (ei < EV.length - 1 && u >= EV[ei + 1][0]) ei++;
      const T = ei === EV.length - 1 ? 13.8 : lerp(EV[ei][1], EV[ei + 1][1], smooth((u - EV[ei][0]) / (EV[ei + 1][0] - EV[ei][0])));
      const X = (v) => x0 + (v / 13.8) * (x1 - x0);
      const hh = (x) => 10 + 122 * clamp((x - x0) / (x1 - x0)) ** 0.55;
      const xc = X(T);
      const C = it._bb || (it._bb = (() => {
        const stars = []; const gals = [];
        for (let i = 0; i < 280; i++) { const x = X(0.2) + rnd(i * 1.9) * (x1 - X(0.2)); stars.push([x, (rnd(i * 2.7) * 2 - 1) * 0.92, 0.6 + rnd(i * 3.3) * 1.4]); }
        for (let i = 0; i < 48; i++) { const x = X(0.4) + 8 + rnd(i * 4.1) * (x1 - X(0.4) - 16); gals.push([x, (rnd(i * 5.3) * 2 - 1) * 0.8, 3 + rnd(i * 6.1) * 5, rnd(i * 7.7) * PI, rnd(i * 8.3)]); }
        return { stars, gals };
      })());
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The history of the universe');
      space(ctx, it, k, { n: 0, nebula: false });
      // The universe so far: a cone that widens as space expands.
      const cone = () => { ctx.beginPath(); ctx.moveTo(x0, yc); for (let x = x0; x <= x1; x += 10) ctx.lineTo(x, yc - hh(x)); ctx.lineTo(x1, yc - hh(x1)); ctx.lineTo(x1, yc + hh(x1)); for (let x = x1; x >= x0; x -= 10) ctx.lineTo(x, yc + hh(x)); ctx.closePath(); };
      ctx.save(); cone(); ctx.clip();
      ctx.fillStyle = 'rgba(30,40,90,0.25)'; ctx.fillRect(x0, yc - 140, x1 - x0, 280);
      ctx.beginPath(); ctx.rect(x0 - 2, yc - 140, xc - x0 + 2, 280); ctx.clip();
      const bg = ctx.createLinearGradient(x0, 0, x1, 0);
      bg.addColorStop(0, '#fffbe6'); bg.addColorStop(0.012, '#ffb347'); bg.addColorStop(0.035, '#5a2a3a'); bg.addColorStop(0.08, '#0d1236'); bg.addColorStop(1, '#0a1030');
      ctx.fillStyle = bg; ctx.fillRect(x0, yc - 140, x1 - x0, 280);
      for (const [x, f, r] of C.stars) { if (x > xc) continue; ctx.fillStyle = `rgba(230,235,255,${0.5 + 0.4 * Math.sin(k * 2 + x)})`; ctx.fillRect(x, yc + f * hh(x) - r / 2, r, r); }
      for (const [x, f, r, a, h] of C.gals) {
        if (x > xc) continue;
        const y = yc + f * hh(x);
        ctx.save(); ctx.translate(x, y); ctx.rotate(a + k * 0.2);
        ctx.fillStyle = h < 0.5 ? 'rgba(180,200,255,0.35)' : 'rgba(255,200,160,0.35)'; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.6, r * 0.6, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,245,220,0.9)'; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.45, r * 0.25, 0, 0, TAU); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(120,200,255,0.6)'; ctx.lineWidth = 2; cone(); ctx.stroke();
      // The Big Bang flash, and the Sun, Earth, life and us.
      const fl = 1 - clamp(u / 1.2) * 0.6;
      const fg = ctx.createRadialGradient(x0, yc, 0, x0, yc, 60 * fl); fg.addColorStop(0, 'rgba(255,255,240,1)'); fg.addColorStop(0.3, 'rgba(255,220,120,0.7)'); fg.addColorStop(1, 'rgba(255,150,60,0)');
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(x0, yc, 60 * fl, 0, TAU); ctx.fill();
      if (T >= 9.2) { const p = after(u, EV[4][0], 0.5); ctx.save(); ctx.globalAlpha *= p; sunBall(ctx, X(9.2), yc - 34, 9, 2.4); ctx.restore(); }
      if (T >= 9.26) { const p = after(u, EV[5][0], 0.5); ctx.save(); ctx.globalAlpha *= p; earth(ctx, X(9.26) + 6, yc + 30, 9, k * 0.5, null); ctx.restore(); }
      if (T >= 10) { const p = after(u, EV[6][0], 0.5); ctx.save(); ctx.globalAlpha *= p; const x = X(10) + 24; ctx.strokeStyle = color('green'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, yc + 14); ctx.quadraticCurveTo(x + 3, yc - 2, x, yc - 14); ctx.stroke(); ctx.fillStyle = color('green'); ctx.beginPath(); ctx.ellipse(x - 6, yc - 6, 7, 3.5, -0.5, 0, TAU); ctx.ellipse(x + 6, yc - 2, 7, 3.5, 0.5, 0, TAU); ctx.fill(); ctx.restore(); }
      if (T >= 13.79) { const p = after(u, EV[7][0], 0.5); ctx.save(); ctx.globalAlpha *= p; const x = x1 - 14; dot(ctx, x, yc - 16, 5, 'red'); ctx.strokeStyle = color('red'); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, yc - 10); ctx.lineTo(x, yc + 6); ctx.moveTo(x - 8, yc - 4); ctx.lineTo(x + 8, yc - 4); ctx.moveTo(x, yc + 6); ctx.lineTo(x - 6, yc + 18); ctx.moveTo(x, yc + 6); ctx.lineTo(x + 6, yc + 18); ctx.stroke(); ctx.restore(); }
      // The time axis and the moving "now" line.
      const ay = Y0 + 358;
      line(ctx, x0, ay, x1, ay, 'rgba(200,215,255,0.75)', 2);
      [[0, 'Big Bang'], [5, '5'], [10, '10'], [13.8, 'today']].forEach(([v, s]) => { line(ctx, X(v), ay - 6, X(v), ay + 6, 'rgba(200,215,255,0.75)', 2); label(ctx, s, X(v), ay + 22, { size: 18, weight: 600, fill: 'muted', align: v === 0 ? 'left' : v === 13.8 ? 'right' : 'center' }); });
      label(ctx, 'billion years after the Big Bang', cx, ay + 48, { size: 18, weight: 500, fill: 'muted' });
      EV.forEach(([, v, , , c], i) => { if (i <= ei) dot(ctx, X(v), ay, 4.5, c); });
      line(ctx, xc, yc - hh(xc) - 8, xc, ay, 'rgba(255,255,255,0.85)', 2);
      dot(ctx, xc, ay, 6, 'ink');
      const tl = T < 0.001 ? `${commas(T * 1e9 / 1000) === '0' ? '0' : commas(Math.round(T * 1e9 / 10000) * 10000)} years` : T < 1 ? `${Math.round(T * 1000)} million years` : `${T.toFixed(1)} billion years`;
      chip(ctx, `Time since the Big Bang: ${tl}`, cx, Y0 + 438, EV[ei][4], 20);
      // The list of events, lit as time passes.
      EV.forEach(([, , text, , c], i) => {
        const col = i < 4 ? 0 : 1; const row = i % 4; const x = X0 + 34 + col * 386; const y = Y0 + 488 + row * 34;
        const on = i === ei; const past = i < ei;
        ctx.save(); ctx.globalAlpha *= on ? 1 : past ? 0.85 : 0.38;
        dot(ctx, x, y, on ? 7 : 5, c);
        label(ctx, text, x + 16, y, { size: 18, weight: on ? 800 : 500, fill: on ? c : 'ink', align: 'left' });
        ctx.restore();
      });
      label(ctx, EV[ei][3], cx, Y1 - 30, { size: 20, weight: 700, fill: 'ink' });
      ctx.restore();
    },

    // A planet crosses its star; a telescope sees the starlight dip.
    'exoplanet-transit'(b, ctx, it, t) {
      const k = b.clock; const S = { x: cx, y: Y0 + 232, r: 104 }; const A = 300; const B = 36; const RP = 26; const PER = 8;
      const u = cycle(t, PER * 2, 0.4);
      const ph = (q) => (q / PER) * TAU - PI / 2 - 0.9;
      const planetAt = (q) => { const a = ph(q); return { x: S.x + A * Math.cos(a), y: S.y + 24 + B * Math.sin(a), front: Math.sin(a) > 0 }; };
      const bright = (q) => { const p = planetAt(q); return p.front ? 1 - overlap(S.r, RP, Math.hypot(p.x - S.x, p.y - S.y)) / (PI * S.r * S.r) : 1; };
      const LC = it._lc || (it._lc = (() => { const a = []; for (let i = 0; i <= 400; i++) a.push(bright((i / 400) * PER * 2)); return a; })());
      const depth = 1 - Math.min(...LC);
      const p = planetAt(u); const now = bright(u);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Finding planets around other stars');
      space(ctx, it, k, { n: 160, seed: 6 });
      const orbit = (front) => { ctx.strokeStyle = 'rgba(160,190,255,0.45)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.ellipse(S.x, S.y + 24, A, B, 0, front ? 0 : PI, front ? PI : TAU); ctx.stroke(); ctx.setLineDash([]); };
      const planet = () => {
        const g = ctx.createRadialGradient(p.x - 8, p.y - 8, 2, p.x, p.y, RP);
        g.addColorStop(0, p.front && now < 1 ? '#1a2240' : '#7fa6d9'); g.addColorStop(1, p.front && now < 1 ? '#05070f' : '#22345e');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, RP, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(150,200,255,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      };
      orbit(false);
      if (!p.front) planet();
      // The star, slightly darker at its edge.
      const halo = ctx.createRadialGradient(S.x, S.y, S.r * 0.9, S.x, S.y, S.r * 1.9); halo.addColorStop(0, 'rgba(255,200,120,0.4)'); halo.addColorStop(1, 'rgba(255,160,80,0)');
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(S.x, S.y, S.r * 1.9, 0, TAU); ctx.fill();
      const sg = ctx.createRadialGradient(S.x, S.y, 0, S.x, S.y, S.r);
      sg.addColorStop(0, '#fffaf0'); sg.addColorStop(0.6, '#ffe2a0'); sg.addColorStop(0.92, '#ffb15a'); sg.addColorStop(1, '#f08a3a');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(S.x, S.y, S.r, 0, TAU); ctx.fill();
      orbit(true);
      if (p.front) planet();
      label(ctx, 'star', S.x - S.r - 46, S.y - S.r + 6, { size: 20, weight: 700, fill: 'yellow' });
      label(ctx, 'planet', p.x, p.y + (p.front ? RP + 22 : -RP - 20), { size: 19, weight: 700, fill: 'cyan' });
      // The light curve.
      const g = { x: X0 + 110, y: Y0 + 418, w: 640, h: 150 };
      const yv = (v) => g.y + 24 + ((1 - v) / depth) * (g.h - 50);
      ctx.fillStyle = 'rgba(10,16,40,0.6)'; rounded(ctx, g.x - 12, g.y - 6, g.w + 24, g.h + 12, 10); ctx.fill();
      label(ctx, 'Brightness of the star', g.x - 6, g.y - 26, { size: 19, weight: 700, fill: 'yellow', align: 'left' });
      label(ctx, '100%', g.x - 18, yv(1), { size: 18, weight: 600, fill: 'muted', align: 'right' });
      label(ctx, `${(100 * (1 - depth)).toFixed(0)}%`, g.x - 18, yv(1 - depth), { size: 18, weight: 600, fill: 'muted', align: 'right' });
      line(ctx, g.x, yv(1), g.x + g.w, yv(1), 'rgba(140,170,255,0.25)', 1, [4, 5]);
      line(ctx, g.x, yv(1 - depth), g.x + g.w, yv(1 - depth), 'rgba(140,170,255,0.25)', 1, [4, 5]);
      const n = Math.floor((u / (PER * 2)) * 400);
      ctx.strokeStyle = color('yellow'); ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= n; i++) { const x = g.x + (i / 400) * g.w; const y = yv(LC[i]); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke();
      dot(ctx, g.x + (u / (PER * 2)) * g.w, yv(now), 6, 'ink');
      label(ctx, 'time →', g.x + g.w, g.y + g.h + 22, { size: 18, weight: 600, fill: 'muted', align: 'right' });
      const dipping = now < 0.9995;
      label(ctx, dipping ? 'Dip! The planet blocks a little starlight' : 'A telescope keeps measuring the starlight', cx, Y1 - 62, { size: 21, weight: 800, fill: dipping ? 'yellow' : 'ink' });
      label(ctx, 'Bigger planet: deeper dip. Time between dips: its year.', cx, Y1 - 28, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Four ways to collect light: a lens, a mirror, a radio dish and the
    // James Webb Space Telescope's 18 gold mirror segments.
    'telescope-types'(b, ctx, it, t) {
      const k = b.clock; const W = 382; const H = 304;
      const P = [[X0 + 12, Y0 + 68, 'Refracting telescope', 'A lens at the front bends light to a focus.', 'cyan'], [X0 + 406, Y0 + 68, 'Reflecting telescope', 'A curved mirror collects light and reflects it to a focus.', 'blue'], [X0 + 12, Y0 + 384, 'Radio telescope', 'A giant dish gathers faint radio waves from space.', 'green'], [X0 + 406, Y0 + 384, 'James Webb (JWST)', '18 gold mirror segments, 6.5 m across, see infrared light.', 'yellow']];
      const ray = (pts, c = 'rgba(255,236,170,0.85)', off = 0) => { ctx.strokeStyle = c; ctx.lineWidth = 2.2; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -k * 40 + off; poly(ctx, pts, false); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0; };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Types of telescope');
      space(ctx, it, k, { n: 120, seed: 7, a: 0.6 });
      P.forEach(([px, py, name, desc, c], i) => {
        ctx.save(); ctx.globalAlpha *= after(t, 0.2 + i * 0.25, 0.5);
        panel(ctx, px, py, W, H, c, 0.06);
        label(ctx, name, px + W / 2, py + 26, { size: 21, weight: 800, fill: c });
        para(ctx, desc, px + 14, py + H - 38, W - 28, 18, 'ink', 500, 2);
        const yc = py + 140;
        if (i === 0) {
          // Lens at the front, eyepiece at the back.
          ctx.fillStyle = 'rgba(120,140,190,0.25)'; ctx.strokeStyle = 'rgba(170,190,240,0.6)'; ctx.lineWidth = 2;
          poly(ctx, [px + 64, yc - 46, px + 300, yc - 22, px + 300, yc + 22, px + 64, yc + 46]); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(140,220,255,0.55)'; ctx.beginPath(); ctx.ellipse(px + 64, yc, 10, 48, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = color('cyan'); ctx.stroke();
          for (const o of [-32, 0, 32]) ray([px + 14, yc + o, px + 64, yc + o, px + 290, yc - o * 0.04, px + 320, yc - o * 0.2], 'rgba(255,236,170,0.85)', o);
          ctx.fillStyle = 'rgba(170,190,240,0.7)'; rounded(ctx, px + 300, yc - 12, 26, 24, 4); ctx.fill();
          ctx.strokeStyle = color('ink'); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(px + 350, yc, 12, 8, 0, 0, TAU); ctx.stroke(); dot(ctx, px + 350, yc, 4, 'ink');
          label(ctx, 'lens', px + 64, yc + 70, { size: 18, weight: 700, fill: 'cyan' });
          label(ctx, 'eyepiece', px + 314, yc + 44, { size: 18, weight: 600, fill: 'muted' });
        } else if (i === 1) {
          // A Newtonian: the big mirror at the back, a flat one to the side.
          ctx.fillStyle = 'rgba(120,140,190,0.22)'; ctx.strokeStyle = 'rgba(170,190,240,0.6)'; ctx.lineWidth = 2;
          rounded(ctx, px + 40, yc - 48, 290, 96, 8); ctx.fill(); ctx.stroke();
          for (const o of [-34, 34]) ray([px + 10, yc + o, px + 316, yc + o, px + 120, yc + o * 0.12, px + 120, yc - 82], 'rgba(255,236,170,0.85)', o);
          ctx.strokeStyle = color('blue'); ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(px + 560, yc, 240, PI - 0.22, PI + 0.22); ctx.stroke();
          line(ctx, px + 108, yc - 12, px + 132, yc + 12, '#e9eeff', 4);
          ctx.fillStyle = 'rgba(170,190,240,0.7)'; rounded(ctx, px + 108, yc - 72, 24, 24, 4); ctx.fill();
          label(ctx, 'curved mirror', px + 300, yc + 72, { size: 18, weight: 700, fill: 'blue' });
          label(ctx, 'flat mirror', px + 120, yc + 72, { size: 18, weight: 600, fill: 'muted' });
        } else if (i === 2) {
          // A dish: waves come down and reflect up to the receiver at the focus.
          const dx = px + W / 2; const vy = yc + 56; const f = 66; const half = 120;
          ctx.strokeStyle = 'rgba(52,211,153,0.55)'; ctx.lineWidth = 2;
          for (let j = 0; j < 3; j++) {
            const yy = py + 50 + mod(k * 40 + j * 30, 90);
            ctx.globalAlpha *= 1; ctx.beginPath();
            for (let x = dx - half; x <= dx + half; x += 6) { const y = yy + Math.sin((x - dx) * 0.12 + k * 6) * 3; if (x === dx - half) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
            ctx.stroke();
          }
          for (const o of [-90, -45, 45, 90]) ray([dx + o, py + 50, dx + o, vy - (o * o) / (4 * f), dx, vy - f], 'rgba(120,240,190,0.85)', o);
          line(ctx, dx - 10, vy + 4, dx - 30, yc + 92, '#9aa6c2', 6); line(ctx, dx + 10, vy + 4, dx + 30, yc + 92, '#9aa6c2', 6); line(ctx, dx - 44, yc + 92, dx + 44, yc + 92, '#9aa6c2', 5);
          ctx.fillStyle = 'rgba(220,228,245,0.95)'; ctx.beginPath();
          for (let x = -half; x <= half; x += 6) { const y = vy - (x * x) / (4 * f); if (x === -half) ctx.moveTo(dx + x, y); else ctx.lineTo(dx + x, y); }
          for (let x = half; x >= -half; x -= 6) ctx.lineTo(dx + x, vy - (x * x) / (4 * f) + 7 + (1 - (x * x) / (half * half)) * 5);
          ctx.closePath(); ctx.fill();
          line(ctx, dx - 70, vy - 18, dx, vy - f, '#c9d2e6', 2); line(ctx, dx + 70, vy - 18, dx, vy - f, '#c9d2e6', 2);
          dot(ctx, dx, vy - f, 6 + Math.sin(k * 6), 'green');
          label(ctx, 'receiver', dx + 70, vy - f - 6, { size: 18, weight: 700, fill: 'green', align: 'left' });
        } else {
          // JWST: 18 gold hexagons (a ring of 6 and a ring of 12) above a sunshield.
          const hx = px + W / 2; const hy = yc - 26; const r = 15.5; const sx = r * 1.5; const sy = r * Math.sqrt(3);
          ctx.fillStyle = 'rgba(200,150,255,0.35)'; ctx.strokeStyle = 'rgba(220,190,255,0.7)'; ctx.lineWidth = 1.5;
          poly(ctx, [hx - 150, hy + 100, hx, hy + 70, hx + 150, hy + 100, hx, hy + 122]); ctx.fill(); ctx.stroke();
          poly(ctx, [hx - 132, hy + 104, hx, hy + 80, hx + 132, hy + 104, hx, hy + 116]); ctx.stroke();
          const cells = [];
          for (let q = -2; q <= 2; q++) for (let rr = -2; rr <= 2; rr++) { const s3 = -q - rr; const ring = Math.max(Math.abs(q), Math.abs(rr), Math.abs(s3)); if (ring === 1 || ring === 2) cells.push([q, rr]); }
          for (const [q, rr] of cells) {
            const x = hx + sx * q; const y = hy + sy * (rr + q / 2);
            const glint = Math.max(0, 1 - Math.abs(mod(k * 0.5, 2.2) * 120 - 60 - (x - hx) - (y - hy) * 0.5) / 40);
            const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, '#ffe08a'); g.addColorStop(0.5, '#e0a52e'); g.addColorStop(1, '#a8701a');
            ctx.fillStyle = g; hexagon(ctx, x, y, r - 1.2); ctx.fill();
            if (glint > 0) { ctx.fillStyle = `rgba(255,255,230,${0.7 * glint})`; ctx.fill(); }
          }
          ctx.strokeStyle = '#c9d2e6'; ctx.lineWidth = 2;
          for (const a of [-PI / 2, PI / 6, (5 * PI) / 6]) { ctx.beginPath(); ctx.moveTo(hx + Math.cos(a) * 70, hy + Math.sin(a) * 66); ctx.lineTo(hx, hy - 0); ctx.stroke(); }
          dot(ctx, hx, hy, 6, '#dfe6f5');
          label(ctx, '18 segments', px + 14, py + 84, { size: 18, weight: 700, fill: 'yellow', align: 'left' });
          label(ctx, 'sunshield', px + W - 14, hy + 62, { size: 18, weight: 600, fill: 'purple', align: 'right' });
        }
        ctx.restore();
      });
      ctx.restore();
    },

    // A rover drives to a rock, drills it, and radios the result to Earth,
    // which hears it minutes later.
    'mars-rover'(b, ctx, it, t) {
      const k = b.clock; const P = 17; const u = cycle(t, P, 0.4);
      const st = u < 4.5 ? 0 : u < 8.5 ? 1 : u < 14.5 ? 2 : 3;
      const ground = (x) => Y0 + 452 + 9 * Math.sin((x - X0) / 85) + 5 * Math.sin((x - X0) / 31 + 1);
      const rx = st === 0 ? lerp(X0 + 120, X0 + 400, smooth(u / 4.2)) : X0 + 400;
      const earthP = { x: X0 + 690, y: Y0 + 122 };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'A rover on Mars');
      rounded(ctx, X0 + 2, TOP, FIG.w - 4, Y1 - TOP - 2, 18); ctx.save(); ctx.clip();
      // A Martian dusk sky, hills and dusty ground.
      const sky = ctx.createLinearGradient(0, TOP, 0, Y0 + 460);
      sky.addColorStop(0, '#0b0d26'); sky.addColorStop(0.5, '#3a2236'); sky.addColorStop(0.85, '#a5583a'); sky.addColorStop(1, '#d58a55');
      ctx.fillStyle = sky; ctx.fillRect(X0, TOP, FIG.w, Y1 - TOP);
      const S = it._mrs || (it._mrs = mkStars(70, 8, X0, TOP, FIG.w, 200));
      drawStars(ctx, S, k, 0.6);
      ctx.fillStyle = '#6e3524'; ctx.beginPath(); ctx.moveTo(X0, Y0 + 420);
      for (let x = X0; x <= X1; x += 20) ctx.lineTo(x, Y0 + 400 - 34 * Math.abs(Math.sin((x - X0) / 150 + 0.6)) - 14 * Math.sin((x - X0) / 47));
      ctx.lineTo(X1, Y0 + 460); ctx.lineTo(X0, Y0 + 460); ctx.closePath(); ctx.fill();
      const gg = ctx.createLinearGradient(0, Y0 + 430, 0, Y1); gg.addColorStop(0, '#c1653b'); gg.addColorStop(1, '#6a2e1c');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(X0, Y1);
      for (let x = X0; x <= X1; x += 10) ctx.lineTo(x, ground(x));
      ctx.lineTo(X1, Y1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(80,30,18,0.55)';
      for (let i = 0; i < 26; i++) { const x = X0 + rnd(i * 3.7) * FIG.w; const y = ground(x) + 14 + rnd(i * 5.3) * 90; ctx.beginPath(); ctx.ellipse(x, y, 4 + rnd(i) * 9, 2 + rnd(i * 2) * 3, 0, 0, TAU); ctx.fill(); }
      // Wheel tracks behind the rover.
      ctx.strokeStyle = 'rgba(90,40,25,0.6)'; ctx.lineWidth = 3; ctx.setLineDash([4, 4]);
      ctx.beginPath(); for (let x = X0 + 70; x < rx - 40; x += 8) { const y = ground(x) + 2; if (x === X0 + 70) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); ctx.setLineDash([]);
      // Earth, a blue evening star.
      const hear = st === 3 ? 0.5 + 0.5 * Math.sin(k * 8) : 0;
      nebula(ctx, earthP.x, earthP.y, 26 + hear * 14, '90,170,255', 0.5);
      dot(ctx, earthP.x, earthP.y, 6, '#8cc8ff');
      label(ctx, 'Earth', earthP.x, earthP.y + 28, { size: 19, weight: 700, fill: 'cyan' });
      // The rock.
      const rkX = X0 + 560; const rkY = ground(rkX);
      ctx.fillStyle = '#7a4a3a'; ctx.beginPath(); ctx.moveTo(rkX - 34, rkY + 4); ctx.lineTo(rkX - 26, rkY - 22); ctx.lineTo(rkX - 4, rkY - 34); ctx.lineTo(rkX + 22, rkY - 26); ctx.lineTo(rkX + 34, rkY + 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,220,190,0.18)'; ctx.beginPath(); ctx.moveTo(rkX - 26, rkY - 22); ctx.lineTo(rkX - 4, rkY - 34); ctx.lineTo(rkX + 4, rkY - 18); ctx.closePath(); ctx.fill();
      if (st >= 1) dot(ctx, rkX - 14, rkY - 20, 4, '#2a140e');
      // The rover: six wheels on rocker-bogies, a mast, an arm and a dish.
      const SCR = 1.3; const yL = ground(rx - 48 * SCR); const yR = ground(rx + 48 * SCR); const tilt = Math.atan2(yR - yL, 96 * SCR); const yb = (yL + yR) / 2 - 14 * SCR;
      const spin = (rx - X0) / 17;
      ctx.save(); ctx.translate(rx, yb); ctx.rotate(tilt); ctx.scale(SCR, SCR);
      for (const wx of [-48, 0, 48]) {
        ctx.fillStyle = '#2d2f3a'; ctx.beginPath(); ctx.arc(wx, 0, 13, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#8a8fa3'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(wx, 0, 9, 0, TAU); ctx.stroke();
        for (let j = 0; j < 3; j++) { const a = spin + (j * TAU) / 3; line(ctx, wx, 0, wx + Math.cos(a) * 9, Math.sin(a) * 9, '#8a8fa3', 2); }
      }
      ctx.strokeStyle = '#b9bfcf'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-48, 0); ctx.lineTo(-20, -22); ctx.lineTo(0, 0); ctx.moveTo(-20, -22); ctx.lineTo(24, -16); ctx.lineTo(48, 0); ctx.stroke();
      ctx.fillStyle = '#e6e9f2'; rounded(ctx, -56, -48, 112, 28, 6); ctx.fill();
      ctx.fillStyle = '#c9cfdd'; ctx.fillRect(-56, -26, 112, 6);
      ctx.fillStyle = '#9aa0b5'; rounded(ctx, -60, -40, 18, 22, 4); ctx.fill();
      // Mast and camera head.
      ctx.fillStyle = '#d7dbe6'; ctx.fillRect(34, -112, 7, 66);
      ctx.fillStyle = '#e6e9f2'; rounded(ctx, 24, -128, 30, 18, 4); ctx.fill();
      dot(ctx, 46, -119, 4, '#22d3ee');
      // The high-gain dish on the deck, pointing at Earth when sending.
      const dishA = st >= 2 ? -0.9 : -0.2;
      ctx.save(); ctx.translate(-28, -52); ctx.rotate(dishA);
      ctx.fillStyle = '#c9cfdd'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 5, 0, 0, TAU); ctx.fill();
      ctx.restore();
      // The arm: folded while driving, reaching the rock to drill.
      const reach = st === 1 ? smooth((u - 4.5) / 0.8) * (1 - smooth((u - 7.8) / 0.6)) : 0;
      const shX = 56; const shY = -36; const tipX = lerp(70, (rkX - 14 - rx) / SCR, reach); const tipY = lerp(-58, (rkY - 20 - yb) / SCR - 4, reach);
      const elX = (shX + tipX) / 2 + 14; const elY = Math.min(shY, tipY) - 26 + reach * 6;
      ctx.strokeStyle = '#d7dbe6'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(shX, shY); ctx.lineTo(elX, elY); ctx.lineTo(tipX, tipY); ctx.stroke();
      ctx.fillStyle = '#9aa0b5'; ctx.beginPath(); ctx.arc(tipX, tipY, 6, 0, TAU); ctx.fill();
      if (st === 1 && reach > 0.9) {
        line(ctx, tipX, tipY, tipX, tipY + 10, '#ffffff', 3);
        for (let j = 0; j < 8; j++) { const a = -PI / 2 + (rnd(j * 3.1) - 0.5) * 2.2; const d = mod(k * 50 + j * 13, 40); ctx.fillStyle = `rgba(220,150,110,${1 - d / 40})`; ctx.fillRect(tipX + Math.cos(a) * d, tipY + 10 + Math.sin(a) * d * 0.6, 3, 3); }
      }
      ctx.restore();
      // Radio signal: pulses travelling from the dish to Earth.
      const ax = rx - 28 * SCR; const ay2 = yb - 56 * SCR;
      if (st === 2 || st === 3) {
        line(ctx, ax, ay2, earthP.x, earthP.y, 'rgba(120,220,255,0.35)', 1.5, [3, 7]);
        const sp = clamp((u - 8.5) / 6);
        for (let j = 0; j < 4; j++) {
          const q = sp - j * 0.06; if (q <= 0 || q >= 1) continue;
          const x = lerp(ax, earthP.x, q); const y = lerp(ay2, earthP.y, q);
          ctx.strokeStyle = `rgba(120,230,255,${0.9 - j * 0.2})`; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(x, y, 7 + j * 2, -2.6, 0.4); ctx.stroke();
        }
      }
      if (st === 2) chip(ctx, `Signal travelling: ${Math.min(12, Math.floor(clamp((u - 8.5) / 6) * 12.5))} min`, X0 + 300, Y0 + 104, 'cyan', 19);
      if (st === 3) chip(ctx, 'Received, 12 minutes later!', X0 + 300, Y0 + 104, 'green', 19);
      ctx.restore();
      // Steps and caption.
      panel(ctx, X0 + 24, Y0 + 556, FIG.w - 48, 130, 'orange', 0.06);
      ['1 Drive', '2 Drill', '3 Send', '4 Earth hears'].forEach((s, i) => {
        const x = X0 + 118 + i * 188; const on = i === st;
        ctx.save(); ctx.globalAlpha *= on ? 1 : 0.5; chip(ctx, s, x, Y0 + 588, on ? 'orange' : 'muted', 19); ctx.restore();
      });
      const CAP = ['The rover drives itself slowly over the rocky ground to an interesting rock.', 'Its robot arm drills into the rock and studies the powder for signs of water and life.', 'Radio waves travel at the speed of light, yet Earth is so far that it takes minutes.', 'The delay is 3 to 22 minutes, so drivers on Earth can\'t steer it live like a toy car.'];
      para(ctx, CAP[st], X0 + 50, Y0 + 646, FIG.w - 100, 19, 'ink', 500, 2);
      ctx.restore();
    },

    // The space station circles Earth every 90 minutes, about 400 km up
    // (drawn to scale), passing from day to night and back.
    'iss-orbit'(b, ctx, it, t) {
      const k = b.clock; const PO = 9; const E = { x: X0 + 290, y: Y0 + 300, r: 150 }; const R = E.r * (1 + 400 / 6371);
      const AL = 0.42; const BE = -0.32;
      const p3 = (th) => {
        const x = R * Math.cos(th); const y = R * Math.sin(th) * Math.sin(AL); const z = R * Math.sin(th) * Math.cos(AL);
        const xr = x * Math.cos(BE) - y * Math.sin(BE); const yr = x * Math.sin(BE) + y * Math.cos(BE);
        return { x: xr, y: yr, z, sx: E.x + xr, sy: E.y - yr, dark: xr > 0 && Math.hypot(yr, z) < E.r };
      };
      const C = it._iss || (it._iss = (() => { let exit = 0; for (let i = 0; i < 720; i++) { const a = (i / 720) * TAU; const b2 = ((i + 1) / 720) * TAU; if (p3(a).dark && !p3(b2).dark) exit = b2; } return { exit }; })());
      const tt = Math.max(0, t - 0.3) + 0.0; const th = (tt / PO) * TAU + PI * 0.75;
      const orbitN = Math.floor((th - C.exit) / TAU + 1e-9);
      const p = p3(th);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The International Space Station');
      space(ctx, it, k, { n: 170, seed: 9 });
      // Sunlight from the left.
      for (const yy of [-110, 0, 110]) arr(ctx, X0 + 22, E.y + yy, X0 + 96, E.y + yy, 'rgba(255,214,120,0.85)', 3);
      label(ctx, 'sunlight', X0 + 60, E.y - 140, { size: 18, weight: 600, fill: 'yellow' });
      // The orbit behind Earth, Earth, then the orbit in front.
      const path = (front) => {
        ctx.strokeStyle = front ? 'rgba(120,230,255,0.75)' : 'rgba(120,230,255,0.3)'; ctx.lineWidth = 2;
        ctx.beginPath(); let on = false;
        for (let i = 0; i <= 180; i++) { const q = p3((i / 180) * TAU); const ok = front ? q.z >= 0 : q.z < 0; if (ok) { if (on) ctx.lineTo(q.sx, q.sy); else ctx.moveTo(q.sx, q.sy); on = true; } else on = false; }
        ctx.stroke();
      };
      path(false);
      const iss = () => {
        const q2 = p3(th + 0.02); const a = Math.atan2(q2.sy - p.sy, q2.sx - p.sx);
        ctx.strokeStyle = p.dark ? 'rgba(120,160,255,0.55)' : 'rgba(255,240,180,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.sx, p.sy, 26 + 3 * Math.sin(k * 5), 0, TAU); ctx.stroke();
        ctx.save(); ctx.translate(p.sx, p.sy); ctx.rotate(a); ctx.scale(1.4, 1.4); ctx.globalAlpha *= p.dark ? 0.6 : 1;
        line(ctx, -17, 0, 17, 0, '#dfe6f5', 2.5);
        ctx.fillStyle = p.dark ? '#5a4a2a' : '#e0a52e';
        for (const x of [-15, -9, 9, 15]) { ctx.fillRect(x - 2.2, -11, 4.4, 9); ctx.fillRect(x - 2.2, 2, 4.4, 9); }
        ctx.fillStyle = '#f2f5fc'; rounded(ctx, -5, -3, 10, 6, 2); ctx.fill();
        ctx.restore();
        const since = mod(th - C.exit, TAU);
        if (since < 0.35) { const q = since / 0.35; nebula(ctx, p.sx, p.sy, 18 + 30 * q, '255,230,160', 0.8 * (1 - q)); }
      };
      if (p.z < 0 && Math.hypot(p.x, p.y) < E.r) { /* hidden behind Earth */ } else if (p.z < 0) iss();
      earth(ctx, E.x, E.y, E.r, k * 0.12, PI, true);
      path(true);
      if (p.z >= 0) iss();
      label(ctx, 'day side', E.x - 80, E.y + E.r + 30, { size: 19, weight: 700, fill: 'yellow' });
      label(ctx, 'night side', E.x + 80, E.y + E.r + 30, { size: 19, weight: 700, fill: 'muted' });
      // Counters.
      const lx = X0 + 530;
      const mins = Math.floor((mod(th - PI * 0.75, TAU) / TAU) * 90);
      label(ctx, 'Minutes into this orbit', lx, Y0 + 104, { size: 18, weight: 600, fill: 'muted', align: 'left' });
      label(ctx, `${mins} of 90`, lx, Y0 + 140, { size: 34, weight: 800, fill: 'cyan', align: 'left' });
      label(ctx, 'Sunrises seen today', lx, Y0 + 192, { size: 18, weight: 600, fill: 'muted', align: 'left' });
      label(ctx, `${(mod(orbitN, 16)) + 1} of about 16`, lx, Y0 + 228, { size: 34, weight: 800, fill: 'yellow', align: 'left' });
      chip(ctx, p.dark ? 'In Earth\'s shadow: night' : 'In sunlight: day', lx, Y0 + 284, p.dark ? 'blue' : 'yellow', 19, 'left');
      const facts = [['≈ 400 km', 'above the ground'], ['≈ 28,000 km/h', 'about 8 km every second'], ['≈ 90 minutes', 'once round Earth']];
      facts.forEach(([a, c2], i) => { const y = Y0 + 352 + i * 62; label(ctx, a, lx, y, { size: 22, weight: 800, fill: 'ink', align: 'left' }); label(ctx, c2, lx, y + 26, { size: 18, weight: 500, fill: 'muted', align: 'left' }); });
      panel(ctx, X0 + 30, Y0 + 568, FIG.w - 60, 112, 'cyan', 0.07);
      label(ctx, 'About 16 sunrises and 16 sunsets every day', cx, Y0 + 602, { size: 21, weight: 800, fill: 'ink' });
      label(ctx, 'The orbit is drawn to scale: 400 km is a thin layer above Earth', cx, Y0 + 642, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Light racing from Earth to the Moon (in real time), from the Sun to
    // Earth, and from the Sun to the nearest star.
    'light-years'(b, ctx, it, t) {
      const k = b.clock; const P = 15; const u = cycle(t, P, 0.4);
      const ROWS = [
        { y: Y0 + 150, start: 0.3, dur: 1.28, head: 'Earth to Moon: 384,400 km', res: '1.3 light-seconds', c: 'cyan', a: ['Earth', 18, 'earth'], z: ['Moon', 8, 'moon'], timer: (f) => `${(f * 1.28).toFixed(1)} s`, note: 'real time!' },
        { y: Y0 + 318, start: 2.4, dur: 4, head: 'Sun to Earth: 150 million km', res: '8 light-minutes', c: 'yellow', a: ['Sun', 24, 'sun'], z: ['Earth', 9, 'earth'], timer: (f) => { const s2 = Math.round(f * 500); return `${Math.floor(s2 / 60)} min ${String(s2 % 60).padStart(2, '0')} s`; }, note: 'sped up' },
        { y: Y0 + 486, start: 7.2, dur: 5.5, head: 'Sun to Proxima Centauri: 40 trillion km', res: '4.2 light-years', c: 'red', a: ['Sun', 12, 'sun'], z: ['Proxima Centauri', 8, 'red'], timer: (f) => `${(f * 4.24).toFixed(1)} years`, note: 'sped up a lot' },
      ];
      const ax = X0 + 70; const zx = X0 + 560;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'How far is a light-year?');
      space(ctx, it, k, { n: 170, seed: 10 });
      ROWS.forEach((R, i) => {
        const f = clamp((u - R.start) / R.dur); const shown = after(u, R.start - 0.3, 0.4) * (u > P - 0.4 ? clamp((P - u) / 0.4) : 1);
        ctx.save(); ctx.globalAlpha *= Math.max(0.3, shown);
        label(ctx, R.head, X0 + 30, R.y - 62, { size: 20, weight: 700, fill: 'ink', align: 'left' });
        label(ctx, R.note, X1 - 30, R.y - 62, { size: 18, weight: 600, fill: i === 0 ? 'green' : 'muted', align: 'right' });
        line(ctx, ax, R.y, zx, R.y, 'rgba(160,190,255,0.35)', 2, [4, 6]);
        const body = (x, [nm, r, kind]) => {
          if (kind === 'sun') sunBall(ctx, x, R.y, r, 2); else if (kind === 'earth') earth(ctx, x, R.y, r, k * 0.4, null); else if (kind === 'moon') moonBall(ctx, x, R.y, r); else ball(ctx, x, R.y, r, '#ff6a4a', PI);
          label(ctx, nm, x, R.y + Math.max(r, 12) + 22, { size: 18, weight: 600, fill: 'muted' });
        };
        body(ax, R.a); body(zx, R.z);
        if (f > 0 && f < 1) {
          const x = lerp(ax + R.a[1], zx - R.z[1], f);
          photon(ctx, x, R.y, Math.max(ax + R.a[1], x - 90), R.y, '255,240,190', 5);
        }
        if (f >= 1) { label(ctx, R.res, (ax + zx) / 2, R.y + 36, { size: 21, weight: 800, fill: R.c }); }
        chip(ctx, R.timer(f), X0 + 700, R.y, f >= 1 ? R.c : 'ink', 19);
        ctx.restore();
      });
      panel(ctx, X0 + 30, Y0 + 574, FIG.w - 60, 108, 'blue', 0.08);
      label(ctx, '1 light-year = how far light travels in a year', cx, Y0 + 606, { size: 21, weight: 800, fill: 'ink' });
      label(ctx, '≈ 9.46 trillion km  ·  light goes ≈ 300,000 km every second', cx, Y0 + 644, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // A comet on a long ellipse: slow and frozen far out, fast near the Sun,
    // where its tails grow and always point away from the Sun.
    'comet-orbit'(b, ctx, it, t) {
      const k = b.clock; const P = 12; const S = { x: X0 + 570, y: Y0 + 300 }; const a = 270; const e = 0.8; const bb = a * Math.sqrt(1 - e * e);
      const M = (cycle(t, P, 0.4) / P) * TAU + PI;
      let E = M; for (let i = 0; i < 8; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      const px = S.x + a * (Math.cos(E) - e); const py = S.y - bb * Math.sin(E);
      const r = Math.hypot(px - S.x, py - S.y); const ux = (px - S.x) / r; const uy = (py - S.y) / r;
      const vxp = -a * Math.sin(E); const vyp = -bb * Math.cos(E); const vl = Math.hypot(vxp, vyp);
      const act = clamp((190 - r) / 120);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || "A comet's orbit");
      space(ctx, it, k, { n: 170, seed: 11 });
      ctx.strokeStyle = 'rgba(160,190,255,0.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.ellipse(S.x - a * e, S.y, a, bb, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(90,170,255,0.45)'; ctx.beginPath(); ctx.arc(S.x, S.y, 95, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      label(ctx, "Earth's orbit", X0 + 440, Y0 + 392, { size: 18, weight: 600, fill: 'blue' });
      sunBall(ctx, S.x, S.y, 22, 3);
      label(ctx, 'Sun', S.x, S.y + 44, { size: 20, weight: 700, fill: 'yellow' });
      // Tails: a straight blue gas tail and a curved, pale dust tail.
      if (act > 0.01) {
        const Li = 30 + 9500 / r; const L = Math.min(Li, 175) * act;
        const ex = px + ux * L; const ey = py + uy * L;
        let g = ctx.createLinearGradient(px, py, ex, ey); g.addColorStop(0, 'rgba(120,200,255,0.85)'); g.addColorStop(1, 'rgba(120,200,255,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ex, ey); ctx.stroke();
        const bx = px + ux * L * 0.85 - (vxp / vl) * L * 0.35; const by = py + uy * L * 0.85 - (vyp / vl) * L * 0.35;
        g = ctx.createLinearGradient(px, py, bx, by); g.addColorStop(0, 'rgba(255,236,190,0.75)'); g.addColorStop(1, 'rgba(255,236,190,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(px - uy * 4, py + ux * 4);
        ctx.quadraticCurveTo(px + ux * L * 0.5, py + uy * L * 0.5, bx + uy * L * 0.18, by - ux * L * 0.18);
        ctx.lineTo(bx - uy * L * 0.12, by + ux * L * 0.12);
        ctx.quadraticCurveTo(px + ux * L * 0.4 - (vxp / vl) * 8, py + uy * L * 0.4 - (vyp / vl) * 8, px + uy * 4, py - ux * 4); ctx.closePath(); ctx.fill();
      }
      nebula(ctx, px, py, 6 + 18 * act, '200,240,255', 0.7);
      dot(ctx, px, py, 3.5, '#f2f8ff');
      // Notes at each end of the orbit.
      label(ctx, 'Far away: frozen, slow, no tail', X0 + 30, Y0 + 500, { size: 19, weight: 700, fill: 'muted', align: 'left' });
      label(ctx, 'Close in: fast, long tails', X1 - 30, Y0 + 500, { size: 19, weight: 700, fill: act > 0.2 ? 'cyan' : 'muted', align: 'right' });
      chip(ctx, act > 0.2 ? 'Ice turning to gas!' : r > 300 ? 'Cold and dark' : 'Warming up', X0 + 130, TOP + 28, act > 0.2 ? 'cyan' : 'muted', 18);
      panel(ctx, X0 + 30, Y0 + 548, FIG.w - 60, 132, 'cyan', 0.07);
      label(ctx, 'The tail always points away from the Sun', cx, Y0 + 580, { size: 22, weight: 800, fill: 'ink' });
      label(ctx, 'Sunlight and the solar wind push gas and dust outward', cx, Y0 + 616, { size: 18, weight: 500, fill: 'ink' });
      label(ctx, "Halley's Comet comes back about every 76 years", cx, Y0 + 650, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Earth ploughs through a comet's dust trail; in the night sky, meteors
    // streak out from one point, the radiant.
    'meteor-shower'(b, ctx, it, t) {
      const k = b.clock; const P = 12; const u = cycle(t, P, 0.4);
      const S = { x: X0 + 96, y: Y0 + 170 }; const RO = 88;
      const ea = -0.95 + (u / P) * 1.9; const ex = S.x + Math.cos(ea) * RO; const ey = S.y + Math.sin(ea) * RO;
      const inside = clamp(1 - Math.abs(ea) / 0.32);
      const rate = 0.12 + 0.88 * inside;
      const C = it._ms || (it._ms = (() => {
        const dust = []; for (let i = 0; i < 260; i++) { const a = rnd(i * 2.3) * TAU; dust.push([a, gauss(i * 3.7) * 7, 0.8 + rnd(i * 4.1) * 1.2]); }
        const met = []; for (let i = 0; i < 46; i++) met.push([rnd(i * 5.1) * TAU, 55 + rnd(i * 6.3) * 70, 60 + rnd(i * 7.1) * 120, 1.6 + rnd(i * 8.9) * 3.4, rnd(i * 9.7) * 5, rnd(i * 1.13)]);
        return { dust, met };
      })());
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Meteor shower');
      space(ctx, it, k, { n: 60, seed: 12, a: 0.6 });
      // Top: the orbit picture.
      panel(ctx, X0 + 20, Y0 + 70, FIG.w - 40, 200, 'purple', 0.05);
      const tc = { x: X0 + 420, y: Y0 + 168 }; const TA = 250; const TB = 30; const tr = -0.05;
      const tp = (a, off = 0) => { const x = TA * Math.cos(a); const y = (TB + off) * Math.sin(a); return [tc.x + x * Math.cos(tr) - y * Math.sin(tr), tc.y + x * Math.sin(tr) + y * Math.cos(tr)]; };
      for (const [a, off, s] of C.dust) { const [x, y] = tp(a + k * 0.01, off); ctx.fillStyle = 'rgba(255,214,160,0.55)'; ctx.fillRect(x, y, s, s); }
      const [cmx, cmy] = tp(0.15);
      ctx.strokeStyle = 'rgba(160,220,255,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cmx, cmy); ctx.lineTo(cmx + 44, cmy - 4); ctx.stroke();
      dot(ctx, cmx, cmy, 4, '#e8f6ff');
      ctx.strokeStyle = 'rgba(90,170,255,0.6)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(S.x, S.y, RO, -1.3, 1.3); ctx.stroke(); ctx.setLineDash([]);
      sunBall(ctx, S.x, S.y, 14, 2.4);
      earth(ctx, ex, ey, 9, k, null);
      if (inside > 0.05) { ctx.strokeStyle = `rgba(255,214,120,${inside})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ex, ey, 15 + 3 * Math.sin(k * 8), 0, TAU); ctx.stroke(); }
      label(ctx, 'Sun', S.x, S.y + 34, { size: 18, weight: 700, fill: 'yellow' });
      label(ctx, 'Earth', S.x + 128, S.y - 64, { size: 18, weight: 700, fill: 'cyan' });
      label(ctx, "a comet's dust trail", X0 + 470, Y0 + 106, { size: 18, weight: 700, fill: 'orange' });
      label(ctx, 'comet', cmx + 30, cmy + 26, { size: 18, weight: 600, fill: 'muted' });
      label(ctx, inside > 0.3 ? 'Earth is in the dust: shower!' : 'Earth moves along its orbit', X0 + 470, Y0 + 238, { size: 19, weight: 700, fill: inside > 0.3 ? 'yellow' : 'ink' });
      // Bottom: the night sky from a hilltop.
      const top = Y0 + 286;
      const sky = ctx.createLinearGradient(0, top, 0, Y1); sky.addColorStop(0, '#050a20'); sky.addColorStop(0.7, '#0f2148'); sky.addColorStop(1, '#1e3b62');
      ctx.fillStyle = sky; ctx.fillRect(X0, top, FIG.w, Y1 - top);
      const SS = it._mss || (it._mss = mkStars(110, 13, X0, top, FIG.w, 300));
      drawStars(ctx, SS, k, 0.9);
      const RD = { x: X0 + 470, y: top + 104 };
      for (const [ang, d0, len, life, off, gate] of C.met) {
        if (gate > rate) continue;
        const q = mod(k + off, life + 0.9) / 0.9; if (q > 1) continue;
        const d = d0 + q * len; const hx = RD.x + Math.cos(ang) * d; const hy = RD.y + Math.sin(ang) * d;
        const tl = Math.min(70, q * len); const tx = hx - Math.cos(ang) * tl; const ty = hy - Math.sin(ang) * tl;
        const a2 = Math.sin(q * PI);
        const g = ctx.createLinearGradient(tx, ty, hx, hy); g.addColorStop(0, 'rgba(200,230,255,0)'); g.addColorStop(1, `rgba(255,255,255,${0.95 * a2})`);
        ctx.strokeStyle = g; ctx.lineWidth = 2.8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
        dot(ctx, hx, hy, 1.8, `rgba(255,255,255,${a2})`);
      }
      ctx.strokeStyle = 'rgba(255,214,120,0.7)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(RD.x, RD.y, 10, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      label(ctx, 'radiant', RD.x, RD.y - 28, { size: 18, weight: 700, fill: 'yellow' });
      // Hills and trees.
      ctx.fillStyle = '#03050c'; ctx.beginPath(); ctx.moveTo(X0, Y1);
      for (let x = X0; x <= X1; x += 16) ctx.lineTo(x, Y0 + 610 - 26 * Math.sin((x - X0) / 120) - 12 * Math.sin((x - X0) / 43));
      ctx.lineTo(X1, Y1); ctx.closePath(); ctx.fill();
      for (const tx of [X0 + 80, X0 + 120, X0 + 690, X0 + 740]) { const ty = Y0 + 610 - 26 * Math.sin((tx - X0) / 120) - 12 * Math.sin((tx - X0) / 43); ctx.beginPath(); ctx.moveTo(tx - 16, ty + 4); ctx.lineTo(tx, ty - 58); ctx.lineTo(tx + 16, ty + 4); ctx.closePath(); ctx.fill(); }
      chip(ctx, inside > 0.3 ? `About ${Math.round(20 + 80 * inside)} meteors an hour` : 'Just a few stray meteors', X0 + 200, top + 36, inside > 0.3 ? 'yellow' : 'muted', 18);
      label(ctx, 'Dust grains burn up about 100 km above us', cx, Y1 - 52, { size: 19, weight: 700, fill: 'ink' });
      label(ctx, 'Perseids: every August, from the comet Swift–Tuttle', cx, Y1 - 24, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Stars join into Orion and the Plough; then Orion turns sideways and
    // its stars turn out to be at very different distances.
    constellations(b, ctx, it, t) {
      const k = b.clock; const P = 19; const u = cycle(t, P, 0.4);
      const ORI = [['Betelgeuse', 5.92, 7.4, 550, 3.6, '#ffae6b'], ['Bellatrix', 5.42, 6.35, 250, 2.6, '#cfe0ff'], ['Rigel', 5.24, -8.2, 860, 3.6, '#bcd4ff'], ['Saiph', 5.80, -9.67, 650, 2.5, '#cfe0ff'], ['Alnitak', 5.68, -1.94, 1260, 2.6, '#cfe0ff'], ['Alnilam', 5.60, -1.2, 1340, 2.7, '#cfe0ff'], ['Mintaka', 5.53, -0.3, 1200, 2.5, '#cfe0ff'], ['Meissa', 5.59, 9.93, 1100, 2, '#cfe0ff']];
      const OL = [[7, 0], [7, 1], [0, 4], [1, 6], [4, 5], [5, 6], [4, 3], [6, 2], [0, 1]];
      const UMA = [['Dubhe', 11.06, 61.75], ['Merak', 11.03, 56.38], ['Phecda', 11.9, 53.69], ['Megrez', 12.26, 57.03], ['Alioth', 12.9, 55.96], ['Mizar', 13.4, 54.93], ['Alkaid', 13.79, 49.31]];
      const UL = [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]];
      const O = { x: X0 + 250, y: Y0 + 330 }; const SC = 16;
      const eye = { x: X0 + 56, y: O.y };
      const side = smooth((u - 8) / 2.2) * (1 - smooth((u - 15.5) / 2));
      const ori = ORI.map(([nm, ra, dec, d, r, c]) => {
        const sx = O.x - (ra - 5.6) * 15 * SC; const sy = O.y - dec * SC;
        const f = d / 1400; const px = X0 + 100 + f * 660; const py = eye.y + (sy - eye.y) * f * 1.2;
        return { nm, d, r, c, sx, sy, x: lerp(sx, px, side), y: lerp(sy, py, side) };
      });
      const uma = UMA.map(([nm, ra, dec]) => ({ nm, x: X0 + 600 - (ra - 12.4) * 8.6 * 10, y: Y0 + 230 - (dec - 55.5) * 10 }));
      const drawLines = (pts, L, t0, dur, a) => {
        ctx.strokeStyle = `rgba(130,200,255,${0.75 * a})`; ctx.lineWidth = 2;
        L.forEach(([i, j], n) => {
          const p = clamp((u - t0 - (n * dur) / L.length) / (dur / L.length));
          if (p <= 0) return;
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(lerp(pts[i].x, pts[j].x, p), lerp(pts[i].y, pts[j].y, p)); ctx.stroke();
        });
      };
      const star = (x, y, r, c, a = 1) => { r *= 1.35; nebula(ctx, x, y, r * 4.5, '200,220,255', 0.4 * a); ctx.save(); ctx.globalAlpha *= a; dot(ctx, x, y, r, c); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - r * 2.6, y - 0.6, r * 5.2, 1.2); ctx.fillRect(x - 0.6, y - r * 2.6, 1.2, r * 5.2); ctx.restore(); };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Constellations: patterns of stars');
      space(ctx, it, k, { n: 240, seed: 14, a: 0.75 - side * 0.45 });
      // Side view: Earth and the sight lines.
      if (side > 0.01) {
        ctx.save(); ctx.globalAlpha *= side;
        earth(ctx, eye.x, eye.y, 13, k * 0.3, null);
        label(ctx, 'Earth', eye.x, eye.y + 36, { size: 18, weight: 700, fill: 'cyan' });
        ctx.strokeStyle = 'rgba(200,215,255,0.22)'; ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
        for (const s of ori) { ctx.beginPath(); ctx.moveTo(eye.x + 14, eye.y); ctx.lineTo(s.x, s.y); ctx.stroke(); }
        ctx.setLineDash([]);
        const ay = Y0 + 560;
        line(ctx, X0 + 100, ay, X0 + 760, ay, 'rgba(200,215,255,0.7)', 2);
        [[0, '0'], [500, '500'], [1000, '1,000 light-years']].forEach(([d, s]) => { const x = X0 + 100 + (d / 1400) * 660; line(ctx, x, ay - 6, x, ay + 6, 'rgba(200,215,255,0.7)', 2); label(ctx, s, x, ay + 22, { size: 18, weight: 600, fill: 'muted', align: d === 1000 ? 'left' : 'center' }); });
        ctx.restore();
      }
      const ola = 1 - side * 0.88;
      drawLines(ori, OL, 1, 3, ola * after(u, 1, 0.3));
      for (const s of ori) star(s.x, s.y, s.r, s.c, after(u, 0.2, 0.6));
      const ua = after(u, 4.2, 0.5) * (1 - side);
      if (ua > 0.01) {
        drawLines(uma, UL, 4.4, 2.6, ua);
        for (const s of uma) star(s.x, s.y, 2.6, '#e8f0ff', ua);
        ctx.save(); ctx.globalAlpha *= ua * after(u, 6.8, 0.5);
        label(ctx, 'The Plough (Big Dipper)', X0 + 600, Y0 + 336, { size: 20, weight: 700, fill: 'cyan' });
        label(ctx, 'part of the Great Bear', X0 + 600, Y0 + 362, { size: 18, weight: 500, fill: 'muted' });
        ctx.restore();
      }
      const front = (1 - side) * after(u, 3.6, 0.5);
      if (front > 0.01) {
        ctx.save(); ctx.globalAlpha *= front;
        label(ctx, 'Orion, the hunter', O.x, Y0 + 520, { size: 21, weight: 700, fill: 'cyan' });
        label(ctx, 'Betelgeuse', ori[0].x - 14, ori[0].y - 22, { size: 18, weight: 600, fill: 'orange', align: 'right' });
        label(ctx, 'Rigel', ori[2].x + 14, ori[2].y + 20, { size: 18, weight: 600, fill: 'blue', align: 'left' });
        ctx.restore();
      }
      const dl = clamp((side - 0.85) / 0.15);
      if (dl > 0) {
        ctx.save(); ctx.globalAlpha *= dl;
        const L = [[1, 0, -24, 'center'], [0, 0, -24, 'center'], [2, 0, 26, 'center']];
        for (const [i, dx, dy, al] of L) label(ctx, `${ori[i].nm} ${commas(ori[i].d)} ly`, ori[i].x + dx, ori[i].y + dy, { size: 18, weight: 700, fill: i === 0 ? 'orange' : 'ink', align: al });
        const bx = (ori[4].x + ori[6].x) / 2; const by = Math.min(ori[4].y, ori[5].y, ori[6].y);
        label(ctx, 'belt stars 1,200+ ly', bx - 10, by - 26, { size: 18, weight: 700, fill: 'ink' });
        ctx.restore();
      }
      const CAP = u < 4.2 ? ['Join bright stars with lines to make a picture', 'Orion is easy to spot by the three stars of his belt'] : u < 8 ? ['Each culture told stories about these patterns', 'Today astronomers divide the sky into 88 constellations'] : u < 15.5 ? ['Turn sideways: the stars are not side by side!', 'They only line up from where we stand on Earth'] : ['Back to the view from Earth', 'A constellation is a pattern, not a real group'];
      label(ctx, CAP[0], cx, Y1 - 62, { size: 21, weight: 800, fill: 'ink' });
      label(ctx, CAP[1], cx, Y1 - 28, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // The same astronaut on scales on the Moon, Mars, Earth and Jupiter:
    // hops high where gravity is weak, and the scale needle settles.
    'planet-weights'(b, ctx, it, t) {
      const k = b.clock; const mass = clamp(val(it.mass, 40), 5, 200);
      const W = [['Moon', 1.62, '1/6 ×', '#c9c7c0', '#8a8a86'], ['Mars', 3.71, '0.38×', '#d5653a', '#8a3a22'], ['Earth', 9.81, '1×', '#3f9a55', '#2a5f3a'], ['Jupiter*', 24.8, '2.5×', '#d9a066', '#9a6a3a']];
      const P = 3.6; const gy = Y0 + 468;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Your weight on other worlds');
      space(ctx, it, k, { n: 140, seed: 15 });
      W.forEach(([nm, g, ratio, c1, c2], i) => {
        const x = X0 + 105 + i * 197; const rel = g / 9.81;
        // The planet.
        const py = Y0 + 112;
        if (i === 2) earth(ctx, x, py, 34, k * 0.4, null);
        else if (i === 0) moonBall(ctx, x, py, 30);
        else if (i === 3) {
          ball(ctx, x, py, 40, '#d9a066');
          ctx.save(); ctx.beginPath(); ctx.arc(x, py, 40, 0, TAU); ctx.clip();
          for (const [dy, h, bc] of [[-0.6, 0.14, 'rgba(243,215,168,0.6)'], [-0.28, 0.16, 'rgba(150,90,50,0.55)'], [0.05, 0.12, 'rgba(243,215,168,0.6)'], [0.35, 0.15, 'rgba(160,100,60,0.55)']]) { ctx.fillStyle = bc; ctx.fillRect(x - 40, py + dy * 40, 80, h * 40); }
          dot(ctx, x + 12, py + 18, 6, 'rgba(200,80,50,0.8)');
          ctx.restore();
        } else ball(ctx, x, py, 26, '#d5653a');
        label(ctx, nm, x, Y0 + 176, { size: 21, weight: 800, fill: 'ink' });
        // Ground and scales.
        ctx.fillStyle = c2; rounded(ctx, x - 84, gy, 168, 26, 8); ctx.fill();
        ctx.fillStyle = c1; rounded(ctx, x - 84, gy, 168, 9, 4); ctx.fill();
        ctx.fillStyle = '#e8edf8'; rounded(ctx, x - 40, gy - 20, 80, 20, 6); ctx.fill();
        // The hop: higher and slower where gravity is weak.
        const tau = Math.min(1.9, 0.5 / rel ** 0.75); const H = Math.min(150, 26 / rel);
        const q = mod(k + i * 0.3, P);
        const air = q < tau; const s = q / tau;
        const hop = air ? 4 * H * s * (1 - s) : 0;
        const tl = air ? 0 : q - tau;
        const reading = air ? mass * rel * Math.exp(-q * 9) : mass * rel * (1 - Math.exp(-tl * 3.2) * Math.cos(tl * 10));
        astronaut(ctx, x, gy - 20 - hop, 0.95, air ? 4 : 0);
        // The dial on the scales.
        ctx.fillStyle = '#0d1430'; ctx.beginPath(); ctx.arc(x, gy - 10, 7.5, 0, TAU); ctx.fill();
        const na = -PI * 0.8 + clamp(reading / 110) * PI * 1.6; line(ctx, x, gy - 10, x + Math.cos(na - PI / 2) * 6, gy - 10 + Math.sin(na - PI / 2) * 6, '#fb7185', 2);
        // The numbers.
        label(ctx, `${Math.round(Math.max(0, reading) * 9.81)} N`, x, Y0 + 532, { size: 28, weight: 800, fill: i === 2 ? 'green' : i === 3 ? 'orange' : i === 1 ? 'red' : 'ink' });
        label(ctx, `scale reads ${(mass * rel).toFixed(mass * rel < 20 ? 1 : 0)} kg`, x, Y0 + 566, { size: 18, weight: 600, fill: 'muted' });
        chip(ctx, ratio, x, Y0 + 604, 'cyan', 18);
      });
      label(ctx, `Your mass stays ${mass} kg; your weight changes with gravity`, cx, Y1 - 52, { size: 19, weight: 700, fill: 'ink' });
      label(ctx, '*Jupiter has no solid ground: this is at its cloud tops', cx, Y1 - 24, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // A cut-away Sun: core, radiative zone, convective zone, photosphere,
    // chromosphere and corona; light zigzags out, and a flare erupts.
    'inside-the-sun'(b, ctx, it, t) {
      const k = b.clock; const C = { x: X0 + 262, y: Y0 + 342 }; const R = 196; const W0 = -1.0; const W1 = 0.78;
      const P = 16; const u = cycle(t, P, 0.4); const st = u < 3 ? 0 : u < 8 ? 1 : u < 12 ? 2 : 3;
      const D = it._sun || (it._sun = (() => {
        const walk = []; let r = 0.27 * R; let a = -0.1;
        walk.push(r, a);
        for (let i = 0; i < 70; i++) { const da = rnd(i * 3.3) * TAU; r = clamp(r + Math.cos(da) * 16 + 1.9, 0.26 * R, 0.69 * R); a = clamp(a + (Math.sin(da) * 16) / r, W0 + 0.12, W1 - 0.12); walk.push(r, a); }
        const gran = []; for (let i = 0; i < 160; i++) gran.push([rnd(i * 1.7) * TAU, Math.sqrt(rnd(i * 2.9)) * 0.97, 2 + rnd(i * 4.3) * 4]);
        return { walk, gran };
      })());
      const at = (rr, aa) => [C.x + Math.cos(aa) * rr, C.y + Math.sin(aa) * rr];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Inside the Sun');
      space(ctx, it, k, { n: 130, seed: 16, nebula: false });
      // Corona and chromosphere.
      const co = ctx.createRadialGradient(C.x, C.y, R * 0.95, C.x, C.y, R * 1.36);
      co.addColorStop(0, 'rgba(255,240,220,0.5)'); co.addColorStop(0.4, 'rgba(255,220,200,0.15)'); co.addColorStop(1, 'rgba(255,200,180,0)');
      ctx.fillStyle = co; ctx.beginPath(); ctx.arc(C.x, C.y, R * 1.36, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,215,190,0.07)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU + Math.sin(k * 0.3 + i) * 0.04; const L = R * (1.18 + 0.16 * rnd(i * 2.1)); ctx.beginPath(); ctx.moveTo(C.x + Math.cos(a) * R, C.y + Math.sin(a) * R); ctx.lineTo(C.x + Math.cos(a) * L, C.y + Math.sin(a) * L); ctx.stroke(); }
      dot(ctx, C.x, C.y, R + 6, 'rgba(255,90,120,0.75)');
      // The surface, with granules and a sunspot pair.
      const sg = ctx.createRadialGradient(C.x - R * 0.2, C.y - R * 0.2, R * 0.1, C.x, C.y, R);
      sg.addColorStop(0, '#fff3b0'); sg.addColorStop(0.6, '#ffc040'); sg.addColorStop(0.92, '#ff9020'); sg.addColorStop(1, '#e06a10');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(C.x, C.y, R, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,250,200,0.22)';
      for (const [a, f, s] of D.gran) { const [x, y] = at(f * R, a); ctx.beginPath(); ctx.arc(x, y, s * (0.8 + 0.2 * Math.sin(k * 2 + a * 9)), 0, TAU); ctx.fill(); }
      dot(ctx, C.x - 70, C.y + 60, 9, 'rgba(90,40,10,0.8)'); dot(ctx, C.x - 52, C.y + 66, 6, 'rgba(90,40,10,0.8)');
      // The cut-away wedge, layer by layer.
      ctx.save(); ctx.beginPath(); ctx.moveTo(C.x, C.y); ctx.arc(C.x, C.y, R + 1, W0, W1); ctx.closePath(); ctx.clip();
      const wedge = (r0, r1, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(C.x, C.y, r1, W0, W1); ctx.arc(C.x, C.y, r0, W1, W0, true); ctx.closePath(); ctx.fill(); };
      ctx.fillStyle = '#05060f'; ctx.fillRect(C.x, C.y - R - 4, R + 6, 2 * R + 8);
      const cv = ctx.createRadialGradient(C.x, C.y, R * 0.7, C.x, C.y, R); cv.addColorStop(0, '#b8321a'); cv.addColorStop(1, '#e8602a');
      wedge(R * 0.7, R - 5, cv);
      const rz = ctx.createRadialGradient(C.x, C.y, R * 0.25, C.x, C.y, R * 0.7); rz.addColorStop(0, '#ffd36a'); rz.addColorStop(1, '#f07828');
      wedge(R * 0.25, R * 0.7, rz);
      const cz = ctx.createRadialGradient(C.x, C.y, 0, C.x, C.y, R * 0.25); cz.addColorStop(0, '#ffffff'); cz.addColorStop(0.5, '#fff6c0'); cz.addColorStop(1, '#ffd060');
      wedge(0, R * 0.25, cz);
      wedge(R - 5, R, '#ffe680');
      // Convection: hot blobs rise, cool ones sink, in rolling cells.
      for (let i = 0; i < 6; i++) {
        const a = W0 + 0.12 + (i / 5) * (W1 - W0 - 0.24); const q = mod(k * 0.35 + i * 0.37, 1); const up = i % 2 === 0;
        const rr = up ? lerp(R * 0.73, R * 0.94, q) : lerp(R * 0.94, R * 0.73, q);
        const [x, y] = at(rr, a + Math.sin(q * PI) * 0.06 * (up ? 1 : -1));
        dot(ctx, x, y, 6, up ? 'rgba(255,230,140,0.85)' : 'rgba(160,40,10,0.7)');
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,240,200,0.55)'; ctx.lineWidth = 1.5;
      for (const f of [0.25, 0.7]) { ctx.beginPath(); ctx.arc(C.x, C.y, R * f, W0, W1); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(110,35,10,0.75)'; ctx.lineWidth = 3;
      for (const w of [W0, W1]) { ctx.beginPath(); ctx.moveTo(C.x, C.y); ctx.lineTo(C.x + Math.cos(w) * R, C.y + Math.sin(w) * R); ctx.stroke(); }
      // The journey of the energy, by stage.
      if (st === 0) { const g = 1 + 0.15 * Math.sin(k * 10); nebula(ctx, C.x + 18, C.y - 6, R * 0.22 * g, '255,255,255', 0.6); }
      if (st === 1) {
        const n = Math.floor(clamp((u - 3) / 4.6) * (D.walk.length / 2 - 1));
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.6; ctx.beginPath();
        for (let i = 0; i <= n; i++) { const [x, y] = at(D.walk[2 * i], D.walk[2 * i + 1]); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.stroke();
        const [hx, hy] = at(D.walk[2 * n], D.walk[2 * n + 1]); nebula(ctx, hx, hy, 12, '255,255,255', 0.9); dot(ctx, hx, hy, 3, '#ffffff');
      }
      if (st === 2) { const q = clamp((u - 8) / 3.6); const [x, y] = at(lerp(R * 0.7, R * 0.98, q), 0.05 + Math.sin(q * PI) * 0.1); nebula(ctx, x, y, 16, '255,250,200', 0.9); dot(ctx, x, y, 7, '#fff4c0'); }
      if (st === 3) { const q = clamp((u - 12) / 3.4); const x0 = C.x + R * Math.cos(0.05); const y0 = C.y + R * Math.sin(0.05); photon(ctx, lerp(x0, X1 - 10, q), y0, Math.max(x0, lerp(x0, X1 - 10, q) - 80), y0, '255,240,190', 5); }
      // A solar flare on the upper-left edge, every few seconds.
      const fq = mod(k, 7) / 7; const fa = -2.2;
      if (fq < 0.55) {
        const p = Math.sin((fq / 0.55) * PI); const [bx, by] = at(R, fa - 0.12); const [ex2, ey2] = at(R, fa + 0.12); const [mx, my] = at(R + 40 + 30 * p, fa);
        ctx.strokeStyle = `rgba(255,140,60,${0.9 * p})`; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(mx, my, ex2, ey2); ctx.stroke();
        nebula(ctx, (bx + ex2) / 2, (by + ey2) / 2, 30 * p + 4, '255,255,230', 0.9 * p);
      }
      label(ctx, 'solar flare', X0 + 22, TOP + 22, { size: 18, weight: 700, fill: 'orange', align: 'left' });
      { const [fx, fy] = at(R + 24, fa); leader(ctx, X0 + 74, TOP + 34, fx - 4, fy - 4, 'rgba(255,159,67,0.8)'); }
      // Layer names with their leader lines.
      const lx = X0 + 548;
      const LAB = [['Corona', 'over 1 million °C', R * 1.18, -0.78, 'ink'], ['Chromosphere', 'thin pink layer', R + 4, -0.6, 'red'], ['Photosphere', 'surface we see, 5,500 °C', R - 2, -0.42, 'yellow'], ['Convective zone', 'hot gas rises and sinks', R * 0.85, -0.02, 'orange'], ['Radiative zone', 'light zigzags outward', R * 0.5, 0.28, 'orange'], ['Core', '15 million °C: fusion', R * 0.12, 0.45, 'ink']];
      LAB.forEach(([nm, dsc, rr, aa, c], i) => {
        const y = Y0 + 112 + i * 78; const [px, py] = at(rr, aa);
        leader(ctx, lx - 8, y, px, py, 'rgba(230,236,255,0.7)');
        label(ctx, nm, lx, y, { size: 20, weight: 800, fill: c, align: 'left' });
        label(ctx, dsc, lx, y + 25, { size: 18, weight: 500, fill: 'muted', align: 'left' });
      });
      const CAP = [['1. The core', 'Hydrogen fuses into helium at 15 million °C, releasing energy.'], ['2. The radiative zone', 'Light bounces from particle to particle: escaping can take over 100,000 years!'], ['3. The convective zone', 'Hot gas carries the energy up like bubbles in boiling soup.'], ['4. Into space', 'From the surface, light reaches Earth in 8 minutes 20 seconds.']][st];
      panel(ctx, X0 + 24, Y0 + 574, FIG.w - 48, 112, 'orange', 0.07);
      label(ctx, CAP[0], cx, Y0 + 604, { size: 21, weight: 800, fill: 'yellow' });
      para(ctx, CAP[1], X0 + 46, Y0 + 648, FIG.w - 92, 18, 'ink', 500, 2);
      ctx.restore();
    },

    // Zooming out from Earth to the observable universe, step by step.
    'space-scale'(b, ctx, it, t) {
      const k = b.clock; const AU = 1.496e8; const LY = 9.461e12;
      const VX = cx; const VY = Y0 + 318;
      const GC = [-AU + 2.0e17, -1.43e17];
      const ST = [
        { w: 3.4e4, c: [0, 0], name: 'Earth', fact: '12,742 km across' },
        { w: 1.05e6, c: [0, 0], name: 'Earth and Moon', fact: '384,400 km apart: about 30 Earths fit in the gap' },
        { w: 3.7e8, c: [-AU / 2, 0], name: 'Earth and Sun', fact: '150 million km apart; the Sun is 109 Earths wide' },
        { w: 1.05e10, c: [-AU, 0], name: 'The Solar System', fact: 'Neptune orbits 4.5 billion km from the Sun' },
        { w: 1.3e14, c: [-AU, 0], name: 'The nearest stars', fact: 'Proxima Centauri is 4.2 light-years away' },
        { w: 1.3e18, c: GC, name: 'The Milky Way', fact: '100,000 light-years across' },
        { w: 1.05e24, c: GC, name: 'The observable universe', fact: 'About 93 billion light-years across' },
      ];
      const HOLD = 1.7; const MOVE = 1.5; const SP = HOLD + MOVE; const P = SP * ST.length + 0.6;
      const u = cycle(t, P, 0.3);
      let si = Math.min(ST.length - 1, Math.floor(u / SP)); const q = u - si * SP;
      let mv = q > HOLD && si < ST.length - 1 ? smooth((q - HOLD) / MOVE) : 0;
      const A = ST[si]; const Bn = ST[Math.min(si + 1, ST.length - 1)];
      const lw = Math.log(A.w) + (Math.log(Bn.w) - Math.log(A.w)) * mv; const Wv = Math.exp(lw);
      const gw = Bn.w === A.w ? 0 : (Wv - A.w) / (Bn.w - A.w);
      const vc = [lerp(A.c[0], Bn.c[0], gw), lerp(A.c[1], Bn.c[1], gw)];
      const s = 760 / Wv; const X = (x) => VX + (x - vc[0]) * s; const Y = (y) => VY + (y - vc[1]) * s;
      const endFade = si === ST.length - 1 ? clamp((P - u) / 0.6) : 1;
      const wnow = mv > 0.5 ? si + 1 : si; const lab = mv > 0 ? Math.abs(1 - 2 * mv) : 1;
      const C = it._sc || (it._sc = (() => {
        const near = []; for (let i = 0; i < 40; i++) { const d = (2.5 + rnd(i * 2.1) * 13) * LY; const a = rnd(i * 3.7) * TAU; near.push([Math.cos(a) * d, Math.sin(a) * d, 0.8 + rnd(i * 4.9) * 1.6]); }
        const gal = []; const RG = 4.73e17;
        for (let i = 0; i < 900; i++) {
          const arm = Math.floor(rnd(i * 5.3) * 4); const f = 0.12 + 0.88 * rnd(i * 1.9) ** 0.85; const th = (arm * PI) / 2 + Math.log(f / 0.12) / 0.5 + gauss(i * 2.7) * 0.2;
          const bulge = rnd(i * 6.1) < 0.18; const rr = bulge ? Math.abs(gauss(i * 7.3)) * RG * 0.12 : RG * f; const tha = bulge ? rnd(i * 8.1) * TAU : th;
          gal.push([GC[0] + Math.cos(tha) * rr, GC[1] + Math.sin(tha) * rr, bulge ? 'rgba(255,220,160,0.8)' : 'rgba(190,210,255,0.7)']);
        }
        const web = []; const RU = 4.4e23; const nodes = [];
        for (let i = 0; i < 22; i++) { const a = rnd(i * 9.1) * TAU; const d = Math.sqrt(rnd(i * 9.7)) * RU * 0.92; nodes.push([GC[0] + Math.cos(a) * d, GC[1] + Math.sin(a) * d]); }
        for (let i = 0; i < 1100; i++) {
          const n1 = nodes[Math.floor(rnd(i * 1.3) * nodes.length)]; let n2 = nodes[0]; let bd = Infinity;
          for (const n of nodes) { if (n === n1) continue; const d = Math.hypot(n[0] - n1[0], n[1] - n1[1]) * (0.7 + rnd(i * 2.9 + n[0] * 1e-23) * 0.6); if (d < bd) { bd = d; n2 = n; } }
          const p = rnd(i * 4.7); const j = RU * 0.025;
          web.push([lerp(n1[0], n2[0], p) + gauss(i * 5.9) * j, lerp(n1[1], n2[1], p) + gauss(i * 6.7) * j, rnd(i * 7.9)]);
        }
        return { near, gal, web };
      })());
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The scale of space');
      space(ctx, it, k, { n: 150, seed: 17, a: 0.55 });
      ctx.save(); ctx.globalAlpha *= endFade;
      const band = (lo, hi, v) => clamp((Math.log10(v) - Math.log10(lo)) / 0.6) * clamp((Math.log10(hi) - Math.log10(v)) / 0.6);
      // The observable universe: a web of galaxies.
      const aWeb = clamp((Math.log10(Wv) - 20.3) / 2);
      if (aWeb > 0) {
        const RUp = 4.4e23 * s;
        const eg = ctx.createRadialGradient(X(GC[0]), Y(GC[1]), RUp * 0.85, X(GC[0]), Y(GC[1]), RUp * 1.04);
        eg.addColorStop(0, 'rgba(255,140,90,0)'); eg.addColorStop(0.8, `rgba(255,140,90,${0.35 * aWeb})`); eg.addColorStop(1, 'rgba(255,140,90,0)');
        ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(X(GC[0]), Y(GC[1]), RUp * 1.04, 0, TAU); ctx.fill();
        for (const [x, y, h] of C.web) { ctx.fillStyle = h < 0.3 ? `rgba(255,190,150,${0.8 * aWeb})` : `rgba(170,200,255,${0.75 * aWeb})`; ctx.fillRect(X(x), Y(y), 1.6, 1.6); }
      }
      // The Milky Way.
      const RGp = 4.73e17 * s; const aGal = clamp((Math.log10(Wv) - 16.2) / 1.2) * (1 - clamp((Math.log10(Wv) - 21) / 1.2));
      if (RGp <= 3 && Wv > 1e18) { nebula(ctx, X(GC[0]), Y(GC[1]), 6, '255,235,200', 0.9); dot(ctx, X(GC[0]), Y(GC[1]), 1.8, '#fff4dc'); }
      if (aGal > 0 && RGp > 3) {
        ctx.save(); ctx.globalAlpha *= aGal;
        nebula(ctx, X(GC[0]), Y(GC[1]), RGp * 1.1, '140,160,255', 0.18);
        if (RGp > 40) for (const [x, y, c] of C.gal) { ctx.fillStyle = c; ctx.fillRect(X(x), Y(y), 1.8, 1.8); }
        nebula(ctx, X(GC[0]), Y(GC[1]), Math.max(4, RGp * 0.25), '255,230,180', 0.8);
        ctx.restore();
      }
      // Nearby stars.
      const aNear = band(2e12, 5e16, Wv);
      if (aNear > 0) { for (const [x, y, r] of C.near) { ctx.fillStyle = `rgba(230,236,255,${0.9 * aNear})`; ctx.beginPath(); ctx.arc(X(-AU + x), Y(y), r, 0, TAU); ctx.fill(); } }
      const px = X(-AU + 4.24 * LY * Math.cos(2.4)); const py = Y(4.24 * LY * Math.sin(2.4));
      if (aNear > 0) { ctx.save(); ctx.globalAlpha *= aNear; ball(ctx, px, py, 5, '#ff6a4a', 0); ctx.restore(); }
      // Planet orbits around the Sun.
      for (const [d, nm] of [[0.39], [0.72], [1], [1.52], [5.2], [9.5], [19.2], [30.1, 'Neptune']]) {
        const rp = d * AU * s; if (rp < 3 || rp > 5000) continue;
        const a = clamp((rp - 3) / 15) * clamp((2500 - rp) / 1500) * (d === 1 && Wv < 2e9 ? 0.4 : 1);
        ctx.strokeStyle = `rgba(150,180,255,${0.45 * a})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(X(-AU), Y(0), rp, 0, TAU); ctx.stroke();
        if (nm && a > 0.5) { const ang = PI + 0.16; dot(ctx, X(-AU) + Math.cos(ang) * rp, Y(0) + Math.sin(ang) * rp, 3, '#6a8cff'); }
      }
      // Sun, Earth and Moon.
      const sr = Math.max(3, 696000 * s); const sx = X(-AU); const sy = Y(0);
      if (sr < 4000 && aGal < 0.9) sunBall(ctx, sx, sy, Math.min(sr, 1200), sr < 6 ? 3.5 : 1.6);
      const er = 6371 * s;
      if (AU * s > 4 || er > 1) {
        if (er > 6) earth(ctx, X(0), Y(0), er, k * 0.3, PI, true); else { nebula(ctx, X(0), Y(0), 10, '95,179,255', 0.5); dot(ctx, X(0), Y(0), Math.max(3.5, er), '#5fb3ff'); }
        const mo = 384400 * s; const ma = -0.6 + k * 0.05;
        if (mo > 6 && mo < 4000) {
          ctx.strokeStyle = `rgba(200,210,240,${0.4 * clamp((mo - 6) / 20)})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(X(0), Y(0), mo, 0, TAU); ctx.stroke();
          const mr = Math.max(2.5, 1737 * s); const mx = X(0) + Math.cos(ma) * mo; const my = Y(0) + Math.sin(ma) * mo;
          if (mr > 3) moonBall(ctx, mx, my, mr, PI); else dot(ctx, mx, my, mr, '#d8d8d8');
        }
      }
      // Labels for the main things at this step.
      ctx.save(); ctx.globalAlpha *= lab;
      if (wnow === 1) { const mo = 384400 * s; const ma = -0.6 + k * 0.05; label(ctx, 'Moon', X(0) + Math.cos(ma) * mo, Y(0) + Math.sin(ma) * mo - 24, { size: 19, weight: 700, fill: 'ink' }); }
      if (wnow === 2) { label(ctx, 'Sun', sx, sy + 34, { size: 19, weight: 700, fill: 'yellow' }); label(ctx, 'Earth', X(0), Y(0) + 26, { size: 19, weight: 700, fill: 'cyan' }); }
      if (wnow === 3) { const rp = 30.1 * AU * s; label(ctx, 'Neptune', sx + Math.cos(PI + 0.16) * rp + 4, sy + Math.sin(PI + 0.16) * rp - 22, { size: 18, weight: 700, fill: 'blue', align: 'left' }); label(ctx, 'Sun', sx, sy + 30, { size: 19, weight: 700, fill: 'yellow' }); }
      if (wnow === 4) { label(ctx, 'Proxima Centauri', px, py - 24, { size: 19, weight: 700, fill: 'red' }); label(ctx, 'Sun', sx, sy + 30, { size: 19, weight: 700, fill: 'yellow' }); }
      if (wnow === 5) { const yx = X(-AU); const yy = Y(0); ctx.strokeStyle = color('yellow'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(yx, yy, 8, 0, TAU); ctx.stroke(); label(ctx, 'the Sun is in here', yx, yy + 28, { size: 18, weight: 700, fill: 'yellow' }); }
      if (wnow === 6) { const gx = X(GC[0]); const gy2 = Y(GC[1]); ctx.strokeStyle = color('yellow'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(gx, gy2, 7, 0, TAU); ctx.stroke(); label(ctx, 'the Milky Way: one tiny dot', gx, gy2 - 26, { size: 18, weight: 700, fill: 'yellow' }); }
      ctx.restore();
      ctx.restore();
      // Step dots, name and fact.
      const cur = ST[wnow];
      panel(ctx, X0 + 30, Y0 + 574, FIG.w - 60, 108, 'cyan', 0.07);
      ctx.save(); ctx.globalAlpha *= lab * endFade;
      label(ctx, cur.name, cx, Y0 + 604, { size: 23, weight: 800, fill: 'cyan' });
      label(ctx, cur.fact, cx, Y0 + 638, { size: 19, weight: 600, fill: 'ink' });
      ctx.restore();
      for (let i = 0; i < ST.length; i++) dot(ctx, cx - 72 + i * 24, Y0 + 666, i === wnow ? 6 : 4, i === wnow ? 'cyan' : 'rgba(150,170,220,0.5)');
      si = wnow; mv = 0;
      ctx.restore();
    },

    // A dark, empty-looking speck of sky; zoom in, and it is full of galaxies.
    'space-telescope-view'(b, ctx, it, t) {
      const k = b.clock; const P = 17; const u = cycle(t, P, 0.3);
      const box0 = { x: X0 + 560, y: Y0 + 210, s: 14 }; const F = { x: X0 + 20, y: TOP + 14, w: FIG.w - 40, h: 470 };
      const z = smooth((u - 3.2) / 2.4); const back = clamp((P - u) / 0.8);
      const bx = lerp(box0.x - box0.s / 2, F.x, z); const by = lerp(box0.y - box0.s / 2, F.y, z); const bw = lerp(box0.s, F.w, z); const bh = lerp(box0.s, F.h, z);
      const D = it._df || (it._df = (() => {
        const g = [];
        for (let i = 0; i < 680; i++) {
          const q = rnd(i * 1.7); const big = rnd(i * 2.3) < 0.07;
          g.push({ x: rnd(i * 3.1), y: rnd(i * 4.3), type: q < 0.3 ? 0 : q < 0.6 ? 1 : 2, r: big ? 8 + rnd(i * 5.9) * 13 : 1.5 + rnd(i * 6.7) ** 2 * 6, a: rnd(i * 7.3) * PI, e: 0.3 + rnd(i * 8.9) * 0.6, c: rnd(i * 9.1), ord: rnd(i * 1.13) });
        }
        g.sort((p, q2) => q2.r - p.r);
        const st = []; for (let i = 0; i < 5; i++) st.push([0.1 + rnd(i * 11.3) * 0.8, 0.1 + rnd(i * 12.7) * 0.8, 2.4 + rnd(i * 13.1) * 2.4]);
        return { g, st };
      })());
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'A deep-field view');
      space(ctx, it, k, { n: 200, seed: 18, a: 1 - z * 0.8 });
      // The deep field inside the box.
      const reveal = clamp((u - 3.3) / 7.5);
      ctx.save(); ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
      ctx.fillStyle = '#020309'; ctx.fillRect(bx, by, bw, bh);
      nebula(ctx, bx + bw * 0.3, by + bh * 0.4, Math.max(bw, bh) * 0.5, '60,80,160', 0.12); nebula(ctx, bx + bw * 0.75, by + bh * 0.7, Math.max(bw, bh) * 0.4, '140,70,120', 0.1);
      const zoomIn = 1 + 0.05 * Math.sin(k * 0.2);
      ctx.translate(bx + bw / 2, by + bh / 2); ctx.scale((bw / F.w) * zoomIn, (bh / F.h) * zoomIn); ctx.translate(-F.w / 2, -F.h / 2);
      for (const G of D.g) {
        const a = clamp((reveal - G.ord * 0.8) / 0.2);
        if (a <= 0) continue;
        const x = G.x * F.w; const y = G.y * F.h;
        ctx.save(); ctx.translate(x, y); ctx.rotate(G.a); ctx.globalAlpha *= a;
        if (G.type === 2) { ctx.fillStyle = G.c < 0.5 ? 'rgba(255,120,80,0.75)' : 'rgba(255,170,110,0.65)'; ctx.beginPath(); ctx.ellipse(0, 0, G.r * 0.6, G.r * 0.4, 0, 0, TAU); ctx.fill(); }
        else if (G.type === 1) {
          ctx.fillStyle = 'rgba(255,225,170,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, G.r, G.r * G.e, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(255,240,210,0.85)'; ctx.beginPath(); ctx.ellipse(0, 0, G.r * 0.4, G.r * G.e * 0.4, 0, 0, TAU); ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(150,180,255,0.28)'; ctx.beginPath(); ctx.ellipse(0, 0, G.r, G.r * G.e, 0, 0, TAU); ctx.fill();
          if (G.r > 6) { ctx.strokeStyle = 'rgba(190,210,255,0.6)'; ctx.lineWidth = 1.5; ctx.save(); ctx.scale(1, G.e); ctx.beginPath(); ctx.arc(0, 0, G.r * 0.7, 0, 2.4); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, G.r * 0.7, PI, PI + 2.4); ctx.stroke(); ctx.restore(); }
          ctx.fillStyle = 'rgba(255,245,225,0.9)'; ctx.beginPath(); ctx.ellipse(0, 0, Math.max(1, G.r * 0.25), Math.max(0.8, G.r * G.e * 0.25), 0, 0, TAU); ctx.fill();
        }
        ctx.restore();
      }
      // Foreground stars with the six-point spikes of JWST's mirror.
      for (const [sx, sy, r] of D.st) {
        const a = clamp((reveal - 0.05) / 0.2); if (a <= 0) continue;
        const x = sx * F.w; const y = sy * F.h;
        ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = 'rgba(255,250,240,0.7)'; ctx.lineWidth = 1.3;
        for (let j = 0; j < 3; j++) { const ang = PI / 2 + (j * PI) / 3; ctx.beginPath(); ctx.moveTo(x - Math.cos(ang) * r * 6, y - Math.sin(ang) * r * 6); ctx.lineTo(x + Math.cos(ang) * r * 6, y + Math.sin(ang) * r * 6); ctx.stroke(); }
        nebula(ctx, x, y, r * 3, '255,250,235', 0.9); dot(ctx, x, y, r * 0.6, '#ffffff');
        ctx.restore();
      }
      ctx.restore();
      ctx.strokeStyle = z > 0.02 ? 'rgba(251,191,36,0.8)' : `rgba(251,191,36,${0.6 + 0.4 * Math.sin(k * 5)})`; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
      if (z < 0.05) {
        label(ctx, 'this tiny, dark patch', box0.x - 30, box0.y - 34, { size: 19, weight: 700, fill: 'yellow', align: 'right' });
        leader(ctx, box0.x - 26, box0.y - 26, box0.x - 9, box0.y - 9, color('yellow'));
      }
      // Caption by stage.
      const CAP = u < 3.2 ? ['Aim at an empty-looking patch of sky', 'About the size of a grain of sand held at arm’s length'] : u < 5.6 ? ['Zoom in with a space telescope…', 'and collect its faint light for many hours'] : ['Thousands of galaxies, each with billions of stars', "Hubble's Ultra Deep Field shows about 10,000 galaxies"];
      ctx.save(); ctx.globalAlpha *= back;
      panel(ctx, X0 + 30, Y0 + 574, FIG.w - 60, 108, 'yellow', 0.06);
      label(ctx, CAP[0], cx, Y0 + 606, { size: 21, weight: 800, fill: 'ink' });
      label(ctx, CAP[1], cx, Y0 + 644, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
      ctx.restore();
    },
  };
}
