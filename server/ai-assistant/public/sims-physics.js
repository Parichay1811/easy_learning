// Physics simulations for the board: one moving picture per idea, from motion
// graphs and projectiles to lenses, fields, decay and the life of stars. Each
// is a function of time (t since it appeared, b.clock for the loop), worked
// out from the real formulas every frame, so it can be drawn at any moment
// and stays cheap: plain canvas calls, a few glows, no state between frames.
// The board passes its drawing kit in; PHYSICS_SIMS says what each one is
// for, so a lesson's words can pick the right picture.

export const PHYSICS_SIMS = {
  'motion-graphs': { title: 'Motion graphs', keywords: ['distance-time graph', 'velocity-time graph', 'distance time graph', 'velocity time graph', 'speed-time graph', 'motion graph'], example: {} },
  projectile: { title: 'Projectile motion', keywords: ['projectile', 'trajectory', 'thrown', 'launch angle', 'horizontal range', 'cannonball'], example: { angle: 45, speed: 20 } },
  'free-fall': { title: 'Free fall', keywords: ['free fall', 'freefall', 'falling object', 'dropped ball', 'acceleration due to gravity', 'stroboscopic'], example: {} },
  suvat: { title: 'Equations of motion (suvat)', keywords: ['suvat', 'equations of motion', 'v = u + at', 'uniform acceleration', 'initial velocity', 'final velocity'], example: { u: 2, a: 1.5, t: 6 } },
  'resolve-vectors': { title: 'Resolving a vector', keywords: ['resolve', 'resolving', 'horizontal component', 'vertical component', 'components of a force', 'f cos'], example: { force: 50, angle: 35 } },
  newton2: { title: "Newton's second law", keywords: ["newton's second law", 'f = ma', 'resultant force', 'force and acceleration', 'mass and acceleration'], example: { force: 20, mass: 4 } },
  friction: { title: 'Friction', keywords: ['friction', 'frictional force', 'sliding', 'rough surface', 'coefficient of friction'], example: { speed: 6, mu: 0.3, mass: 2 } },
  'terminal-velocity': { title: 'Terminal velocity', keywords: ['terminal velocity', 'skydiver', 'air resistance', 'drag force', 'parachute'], example: { mass: 80 } },
  moments: { title: 'Moments', keywords: ['moment', 'moments', 'pivot', 'seesaw', 'principle of moments', 'turning effect', 'clockwise'], example: { f1: 40, d1: 1.5, f2: 30 } },
  'pressure-depth': { title: 'Pressure in a liquid', keywords: ['pressure in a liquid', 'liquid pressure', 'ρgh', 'rho g h', 'hydrostatic', 'pressure increases with depth'], example: { density: 1000 } },
  upthrust: { title: 'Upthrust and floating', keywords: ['upthrust', 'buoyancy', 'floats', 'sinks', 'archimedes', 'displaced water'], example: {} },
  hooke: { title: "Hooke's law", keywords: ["hooke's law", 'hooke', 'spring constant', 'extension', 'limit of proportionality', 'force-extension'], example: { k: 25 } },
  'inclined-plane': { title: 'Inclined plane', keywords: ['inclined plane', 'slope', 'ramp', 'incline', 'normal reaction', 'component of weight'], example: { angle: 30, mass: 5 } },
  'energy-transfer': { title: 'Energy transfers', keywords: ['energy transfer', 'kinetic energy', 'gravitational potential energy', 'conservation of energy', 'roller coaster', 'energy store'], example: {} },
  'pendulum-shm': { title: 'Pendulum (SHM)', keywords: ['pendulum', 'time period', 'swing', 'pendulum bob', 'simple pendulum'], example: { length: 1 } },
  'spring-shm': { title: 'Mass on a spring (SHM)', keywords: ['mass on a spring', 'spring oscillation', 'simple harmonic motion', 'shm', 'oscillating spring'], example: { mass: 0.5, k: 20 } },
  collision: { title: 'Collisions and momentum', keywords: ['collision', 'momentum', 'conservation of momentum', 'elastic collision', 'inelastic collision', 'trolleys collide'], example: { kind: 'elastic' } },
  'circular-motion': { title: 'Circular motion', keywords: ['circular motion', 'centripetal', 'angular velocity', 'mv²/r', 'moving in a circle'], example: { radius: 1.5, speed: 4 } },
  orbit: { title: 'Orbits', keywords: ['orbit', 'satellite', 'kepler', 'elliptical orbit', 'orbital speed'], example: { e: 0.5 } },
  'wave-types': { title: 'Transverse and longitudinal waves', keywords: ['transverse', 'longitudinal', 'compression', 'rarefaction', 'types of wave', 'slinky'], example: {} },
  refraction: { title: 'Refraction', keywords: ['refraction', 'refractive index', "snell's law", 'glass block', 'angle of refraction', 'towards the normal'], example: { angle: 40, n: 1.5 } },
  tir: { title: 'Total internal reflection', keywords: ['total internal reflection', 'critical angle', 'optical fibre', 'optical fiber'], example: {} },
  'standing-wave': { title: 'Standing waves', keywords: ['standing wave', 'stationary wave', 'harmonic', 'node', 'antinode', 'fundamental frequency'], example: { harmonic: 3 } },
  interference: { title: 'Interference', keywords: ['interference', 'path difference', 'two sources', 'double slit', 'superposition', 'coherent'], example: {} },
  doppler: { title: 'Doppler effect', keywords: ['doppler', 'pitch', 'siren', 'moving source', 'ambulance'], example: {} },
  'em-spectrum': { title: 'Electromagnetic spectrum', keywords: ['electromagnetic spectrum', 'em spectrum', 'electromagnetic waves', 'radio waves', 'microwaves', 'ultraviolet'], example: {} },
  lens: { title: 'Convex lens', keywords: ['convex lens', 'converging lens', 'focal length', 'ray diagram', 'real image', 'magnifying glass'], example: { u: 30, f: 10 } },
  mirror: { title: 'Plane mirror', keywords: ['plane mirror', 'law of reflection', 'angle of incidence', 'angle of reflection', 'mirror image'], example: { angle: 40 } },
  'series-parallel': { title: 'Series and parallel circuits', keywords: ['series circuit', 'parallel circuit', 'series and parallel', 'bulb brightness', 'branches'], example: { voltage: 6 } },
  'iv-characteristics': { title: 'I–V characteristics', keywords: ['i-v characteristic', 'i–v graph', 'current-voltage graph', 'filament lamp', 'diode', 'ohmic'], example: {} },
  'electric-field': { title: 'Electric fields', keywords: ['electric field', 'positive charge', 'negative charge', 'electric field lines', 'field strength', 'charged plates'], example: { kind: 'pair' } },
  'magnetic-field': { title: 'Magnetic field of a bar magnet', keywords: ['magnetic field', 'bar magnet', 'compass', 'north pole', 'south pole', 'magnetic field lines'], example: {} },
  'motor-effect': { title: 'The motor effect', keywords: ['motor effect', "fleming's left-hand rule", 'f = bil', 'electric motor', 'current-carrying wire', 'magnetic flux density'], example: { current: 'in' } },
  induction: { title: 'Electromagnetic induction', keywords: ['electromagnetic induction', 'induced current', 'induced potential difference', 'generator', 'induced emf', 'magnet into a coil'], example: {} },
  transformer: { title: 'Transformers', keywords: ['transformer', 'step-up', 'step-down', 'primary coil', 'secondary coil', 'turns ratio'], example: { np: 100, ns: 400, vp: 12 } },
  'particle-model': { title: 'Particle model of matter', keywords: ['particle model', 'states of matter', 'solid liquid gas', 'kinetic theory', 'arrangement of particles'], example: {} },
  'gas-laws': { title: "Gas pressure and Boyle's law", keywords: ["boyle's law", 'gas pressure', 'gas laws', 'pressure and volume', 'pv = constant', 'compressing a gas'], example: {} },
  'heat-transfer': { title: 'Conduction, convection, radiation', keywords: ['conduction', 'convection', 'thermal radiation', 'heat transfer', 'convection current', 'thermal conductor'], example: {} },
  'half-life': { title: 'Half-life', keywords: ['half-life', 'half life', 'radioactive decay', 'decay curve', 'undecayed nuclei'], example: { halfLife: 5, unit: 'min' } },
  'radiation-penetration': { title: 'Alpha, beta and gamma', keywords: ['alpha particles', 'beta particles', 'gamma rays', 'penetrating power', 'ionising radiation', 'stopped by paper'], example: {} },
  rutherford: { title: 'Rutherford scattering', keywords: ['rutherford', 'gold foil', 'alpha scattering', 'nuclear model', 'plum pudding', 'geiger and marsden'], example: {} },
  'energy-levels': { title: 'Energy levels and photons', keywords: ['energy level', 'energy levels', 'emission spectrum', 'line spectrum', 'excited state', 'ground state'], example: {} },
  photoelectric: { title: 'Photoelectric effect', keywords: ['photoelectric', 'work function', 'threshold frequency', 'photoelectrons', 'photon energy', 'planck constant'], example: {} },
  'star-life': { title: 'Life cycle of a star', keywords: ['life cycle of a star', 'red giant', 'white dwarf', 'supernova', 'neutron star', 'main sequence', 'red supergiant'], example: {} },
  redshift: { title: 'Red-shift', keywords: ['redshift', 'red-shift', 'red shift', 'expanding universe', 'receding galaxies', 'big bang'], example: {} },
};

export function physicsSims(kit) {
  // eslint-disable-next-line no-unused-vars
  const { FIG, COL, COLORS, HUES, FONT, glow, label, wrapLabel, rounded, arrow, clamp, easeOut, outBack, color, tint } = kit;
  const X0 = FIG.x; const Y0 = FIG.y; const X1 = FIG.x + FIG.w; const Y1 = FIG.y + FIG.h;
  const cx = X0 + FIG.w / 2; const cy = Y0 + FIG.h / 2;
  const TAU = Math.PI * 2; const G = 9.8; const DEG = Math.PI / 180;
  const LINE = 'rgba(220,230,255,0.8)'; const FAINT = 'rgba(140,170,255,0.18)'; const DARK = '#070b1d';

  // Small tools: numbers, timing, loops.
  const val = (v, d) => { const n = Number(v); return v !== null && v !== undefined && v !== '' && Number.isFinite(n) ? n : d; };
  const mod = (a, n) => ((a % n) + n) % n;
  const tri = (a) => { const m = mod(a, 2); return m < 1 ? m : 2 - m; };
  const smooth = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
  const fade = (ctx, t, d = 0.5) => { const q = easeOut(clamp(t / d)); ctx.globalAlpha *= q; return q; };
  const after = (t, at, d = 0.4) => easeOut(clamp((t - at) / d));
  const fx = (n, d = 1) => (Math.abs(n) < 0.5 * 10 ** -d ? 0 : n).toFixed(d).replace('-', '−');
  const cycle = (t, period, delay = 0.6) => (t < delay ? 0 : mod(t - delay, period));
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // Drawing helpers in the board's holo style.
  const title = (ctx, text) => label(ctx, text, cx, Y0 + 28, { size: 26, weight: 700, fill: 'ink' });
  function chip(ctx, text, x, y, c = 'ink', size = 21, align = 'center') {
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
    ctx.fillStyle = color(c); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    if (blur) ctx.shadowBlur = 0;
  }
  function ball(ctx, x, y, r, c, blur = 0) {
    dot(ctx, x, y, r, c, blur);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.32, 0, TAU); ctx.fill();
  }
  function line(ctx, x0, y0, x1, y1, c = LINE, w = 2, dash) {
    ctx.strokeStyle = color(c); ctx.lineWidth = w;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    if (dash) ctx.setLineDash([]);
  }
  // Ground with hatching underneath.
  function ground(ctx, x0, x1, y) {
    line(ctx, x0, y, x1, y, LINE, 3);
    ctx.strokeStyle = 'rgba(140,170,255,0.3)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let x = x0 + 8; x < x1; x += 18) { ctx.moveTo(x, y + 2); ctx.lineTo(x - 10, y + 14); }
    ctx.stroke();
  }
  // A cart standing on a track at yBase; x is its left edge.
  function cart(ctx, x, yBase, w, h, c, text, spin = 0) {
    const r = 11;
    ctx.fillStyle = tint(c, 0.3); ctx.strokeStyle = color(c); ctx.lineWidth = 3;
    rounded(ctx, x, yBase - 2 * r - h, w, h, 10); ctx.fill(); ctx.stroke();
    for (const wx of [x + w * 0.24, x + w * 0.76]) {
      ctx.fillStyle = DARK; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(wx, yBase - r, r - 1, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(wx, yBase - r); ctx.lineTo(wx + Math.cos(spin) * (r - 2), yBase - r + Math.sin(spin) * (r - 2)); ctx.stroke();
    }
    if (text) label(ctx, text, x + w / 2, yBase - 2 * r - h / 2, { size: 19, weight: 700, fill: 'ink' });
  }
  // A zigzag spring between two points.
  function spring(ctx, x0, y0, x1, y1, coils, amp, c = 'muted', lw = 3) {
    const dx = x1 - x0; const dy = y1 - y0; const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L; const uy = dy / L; const nx = -uy; const ny = ux;
    const lead = Math.min(12, L * 0.1); const n = coils * 2;
    ctx.strokeStyle = color(c); ctx.lineWidth = lw; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + ux * lead, y0 + uy * lead);
    for (let i = 1; i < n; i++) { const s = lead + ((L - 2 * lead) * i) / n; const side = i % 2 ? 1 : -1; ctx.lineTo(x0 + ux * s + nx * amp * side, y0 + uy * s + ny * amp * side); }
    ctx.lineTo(x1 - ux * lead, y1 - uy * lead); ctx.lineTo(x1, y1); ctx.stroke();
  }
  // Graph axes in a box; mid puts the time axis across the middle.
  function axes(ctx, x, y, w, h, xName, yName, mid = false) {
    ctx.strokeStyle = 'rgba(140,170,255,0.12)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 1; i <= 4; i++) { ctx.moveTo(x, y + (h * i) / 4); ctx.lineTo(x + w, y + (h * i) / 4); ctx.moveTo(x + (w * i) / 5, y); ctx.lineTo(x + (w * i) / 5, y + h); }
    ctx.stroke();
    const ay = mid ? y + h / 2 : y + h;
    arrow(ctx, x, ay, x + w + 14, ay, 'rgba(200,215,255,0.7)', 2.5);
    arrow(ctx, x, y + h, x, y - 14, 'rgba(200,215,255,0.7)', 2.5);
    if (mid) line(ctx, x, y + h, x, y, 'rgba(200,215,255,0.7)', 2.5);
    label(ctx, yName, x + 10, y - 12, { size: 17, weight: 600, fill: 'muted', align: 'left' });
    label(ctx, xName, x + w + 10, ay + 22, { size: 17, weight: 600, fill: 'muted', align: 'right' });
  }
  // A curve u in [0, upTo] mapped through fx, fy.
  function trace(ctx, n, gx, gy, c, lw = 4, upTo = 1) {
    if (upTo <= 0) return;
    const m = Math.max(1, Math.round(n * upTo));
    ctx.strokeStyle = color(c); ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= m; i++) { const u = (upTo * i) / m; if (i) ctx.lineTo(gx(u), gy(u)); else ctx.moveTo(gx(u), gy(u)); }
    ctx.stroke();
  }
  // Light of a wavelength (nm) as a CSS colour; outside the visible range a dim violet or red.
  function waveRGB(nm, a = 1) {
    let r = 0; let g = 0; let bl = 0;
    if (nm < 380) return `rgba(167,139,250,${a})`;
    if (nm > 780) return `rgba(190,60,60,${a})`;
    if (nm < 440) { r = (440 - nm) / 60; bl = 1; } else if (nm < 490) { g = (nm - 440) / 50; bl = 1; } else if (nm < 510) { g = 1; bl = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1;
    const k = nm < 420 ? 0.4 + (0.6 * (nm - 380)) / 40 : nm > 700 ? 0.4 + (0.6 * (780 - nm)) / 80 : 1;
    const c = (v) => Math.round(255 * (0.15 + 0.85 * (v * k) ** 0.8));
    return `rgba(${c(r)},${c(g)},${c(bl)},${a})`;
  }
  // A dot travelling along a polyline [x0,y0,x1,y1,...] at a given speed.
  function pulse(ctx, pts, speed, clock, c, r = 6) {
    let total = 0;
    for (let i = 2; i < pts.length; i += 2) total += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
    if (!total) return;
    let d = mod(clock * speed, total);
    for (let i = 2; i < pts.length; i += 2) {
      const s = Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
      if (d <= s) { const q = d / s; dot(ctx, pts[i - 2] + (pts[i] - pts[i - 2]) * q, pts[i - 1] + (pts[i + 1] - pts[i - 1]) * q, r, c, 14); return; }
      d -= s;
    }
  }
  // A labelled angle arc at (x, y) from a0 to a1 (canvas radians).
  function angleArc(ctx, x, y, r, a0, a1, c, text, tr = r + 30, align = 'center') {
    ctx.strokeStyle = color(c); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y, r, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke();
    const m = (a0 + a1) / 2;
    if (text) label(ctx, text, x + Math.cos(m) * tr, y + Math.sin(m) * tr, { size: 20, weight: 700, fill: c, align });
  }

  return {
    // A car's journey drawn twice at once: as a distance–time and a velocity–time graph.
    'motion-graphs'(b, ctx, it, t) {
      const T = 8; const u = cycle(t, T);
      const vAt = (s) => (s < 2 ? 3 * s : s < 5 ? 6 : s < 7 ? 6 - 3 * (s - 5) : 0);
      const dAt = (s) => (s < 2 ? 1.5 * s * s : s < 5 ? 6 + 6 * (s - 2) : s < 7 ? 24 + 6 * (s - 5) - 1.5 * (s - 5) ** 2 : 30);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'One journey, two graphs');
      const rx0 = X0 + 60; const rx1 = X1 - 140; const ry = Y0 + 180;
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(X0 + 20, ry, FIG.w - 40, 30);
      line(ctx, X0 + 20, ry + 15, X1 - 20, ry + 15, 'rgba(255,255,255,0.35)', 2, [16, 14]);
      ctx.strokeStyle = 'rgba(200,215,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let m = 0; m <= 30; m += 5) { const x = rx0 + (m / 30) * (rx1 - rx0); ctx.moveTo(x, ry + 30); ctx.lineTo(x, ry + 40); }
      ctx.stroke();
      const d = dAt(u); const v = vAt(u);
      const carX = rx0 + (d / 30) * (rx1 - rx0);
      cart(ctx, carX - 20, ry, 100, 34, 'blue', '', d / 0.3);
      arr(ctx, carX + 84, ry - 30, carX + 84 + v * 12, ry - 30, 'cyan', 5);
      const g1 = { x: X0 + 70, y: Y0 + 310, w: 300, h: 270 }; const g2 = { x: X0 + 460, y: Y0 + 310, w: 300, h: 270 };
      axes(ctx, g1.x, g1.y, g1.w, g1.h, 'time', 'distance (m)');
      axes(ctx, g2.x, g2.y, g2.w, g2.h, 'time', 'velocity (m/s)');
      const p1x = (q) => g1.x + q * g1.w; const p1y = (q) => g1.y + g1.h - (dAt(q * T) / 32) * g1.h;
      const p2x = (q) => g2.x + q * g2.w; const p2y = (q) => g2.y + g2.h - (vAt(q * T) / 7) * g2.h;
      ctx.globalAlpha *= 0.3; trace(ctx, 80, p1x, p1y, 'blue', 2); trace(ctx, 80, p2x, p2y, 'cyan', 2); ctx.globalAlpha /= 0.3;
      glow(ctx, COLORS.blue, 10); trace(ctx, 80, p1x, p1y, 'blue', 4, u / T); ctx.shadowBlur = 0;
      trace(ctx, 80, p2x, p2y, 'cyan', 4, u / T);
      dot(ctx, p1x(u / T), p1y(u / T), 7, 'blue'); dot(ctx, p2x(u / T), p2y(u / T), 7, 'cyan');
      chip(ctx, `distance = ${fx(d)} m`, g1.x + g1.w / 2, Y0 + 640, 'blue');
      chip(ctx, `velocity = ${fx(v)} m/s`, g2.x + g2.w / 2, Y0 + 640, 'cyan');
      const phase = u < 2 ? 'speeding up: steeper and steeper' : u < 5 ? 'steady speed: straight sloping line' : u < 7 ? 'slowing down: the slope flattens' : 'stopped: flat line on the distance graph';
      label(ctx, phase, cx, Y0 + 686, { size: 20, weight: 600, fill: 'muted' });
      ctx.restore();
    },

    // A launch at an angle: the path, its velocity parts, the range and the top height.
    projectile(b, ctx, it, t) {
      const deg = clamp(val(it.angle, 45), 5, 85); const th = deg * DEG; const v0 = clamp(val(it.speed ?? it.velocity, 20), 2, 80);
      const T = (2 * v0 * Math.sin(th)) / G; const R = (v0 * v0 * Math.sin(2 * th)) / G; const H = (v0 * Math.sin(th)) ** 2 / (2 * G);
      const s = 640 / ((v0 * v0) / G);
      const speed = Math.max(1, T / 3); const P = T / speed + 1.4;
      const st = Math.min(T, cycle(t, P, 0.5) * speed);
      const ox = X0 + 80; const gy = Y1 - 150;
      const px = (tt) => ox + v0 * Math.cos(th) * tt * s; const py = (tt) => gy - (v0 * Math.sin(th) * tt - 0.5 * G * tt * tt) * s;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Projectile motion');
      ground(ctx, X0 + 30, X1 - 30, gy);
      // Launcher and the dashed path it will follow.
      ctx.save(); ctx.translate(ox, gy); ctx.rotate(-th);
      ctx.fillStyle = tint('blue', 0.4); ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 2.5; rounded(ctx, -10, -11, 62, 22, 8); ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.setLineDash([6, 10]); trace(ctx, 60, (q) => px(q * T), (q) => py(q * T), 'rgba(200,215,255,0.35)', 2); ctx.setLineDash([]);
      // Stroboscopic trail: equal time gaps, equal horizontal gaps.
      ctx.fillStyle = tint('cyan', 0.45);
      for (let k = 1; k < 12; k++) { const tk = (k * T) / 12; if (tk > st) break; ctx.beginPath(); ctx.arc(px(tk), py(tk), 6, 0, TAU); ctx.fill(); }
      // Range and maximum height, bright once the ball has got there.
      const top = py(T / 2); const mx = px(T / 2);
      ctx.save(); ctx.globalAlpha *= st >= T / 2 ? 1 : 0.3;
      line(ctx, mx, top, mx, gy, 'green', 2, [5, 7]);
      label(ctx, `max height ${fx(H)} m`, mx + 12, top - 26, { size: 19, weight: 700, fill: 'green', align: mx > cx + 150 ? 'right' : 'left' });
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= st >= T ? 1 : 0.3;
      arr(ctx, ox + 12, gy + 34, px(T), gy + 34, 'blue', 3); arr(ctx, px(T) - 12, gy + 34, ox, gy + 34, 'blue', 3);
      label(ctx, `range ${fx(R)} m`, (ox + px(T)) / 2, gy + 62, { size: 20, weight: 700, fill: 'blue' });
      ctx.restore();
      // The ball and its velocity components: vx never changes, vy shrinks then reverses.
      const bx = px(st); const by = st >= T ? gy - 10 : py(st) - 10;
      const vx = v0 * Math.cos(th); const vy = st >= T ? 0 : v0 * Math.sin(th) - G * st;
      const k = 80 / v0;
      if (st < T) {
        arr(ctx, bx, by, bx + vx * k, by, 'cyan', 4);
        arr(ctx, bx, by, bx, by - vy * k, 'cyan', 4);
        line(ctx, bx, by, bx + vx * k, by - vy * k, 'rgba(255,255,255,0.5)', 2, [4, 5]);
        label(ctx, 'vx', Math.min(bx + vx * k + 16, X1 - 28), by - (bx + vx * k + 16 > X1 - 28 ? 22 : 0), { size: 18, weight: 700, fill: 'cyan', align: 'left' });
        label(ctx, 'vy', bx - 12, by - vy * k, { size: 18, weight: 700, fill: 'cyan', align: 'right' });
      }
      ball(ctx, bx, by, 10, 'orange', 16);
      chip(ctx, `u = ${fx(v0)} m/s at ${fx(deg, 0)}°`, X0 + 170, Y0 + 90, 'ink');
      chip(ctx, `speed now = ${fx(Math.hypot(vx, vy))} m/s`, X1 - 170, Y0 + 90, 'cyan');
      ctx.restore();
    },

    // A ball dropped beside a ruler, photographed every 0.1 s: the gaps grow because g speeds it up.
    'free-fall'(b, ctx, it, t) {
      const T = 1.0; const sc = 100; const top = Y0 + 110; const drop = 0.5 * G * T * T;
      const ft = Math.min(T, cycle(t, 2.6, 0.5));
      const bx = X0 + 260;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Free fall: g = 9.8 m/s²');
      // Ruler.
      const rx = X0 + 160;
      line(ctx, rx, top, rx, top + drop * sc, LINE, 3);
      ctx.strokeStyle = 'rgba(200,215,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let m = 0; m <= 4.9; m += 0.5) { const y = top + m * sc; const w = m % 1 === 0 ? 16 : 9; ctx.moveTo(rx - w, y); ctx.lineTo(rx, y); }
      ctx.stroke();
      label(ctx, '0 m', rx - 22, top, { size: 17, weight: 600, fill: 'muted', align: 'right' });
      label(ctx, '4.9 m', rx - 22, top + drop * sc, { size: 17, weight: 600, fill: 'muted', align: 'right' });
      ground(ctx, X0 + 190, X0 + 340, top + drop * sc + 12);
      // Strobe images every 0.1 s.
      ctx.fillStyle = tint('orange', 0.3); ctx.strokeStyle = tint('orange', 0.6); ctx.lineWidth = 1.5;
      for (let k = 0; k <= 10; k++) { const tk = k * 0.1; if (tk > ft) break; const y = top + 0.5 * G * tk * tk * sc; ctx.beginPath(); ctx.arc(bx, y, 11, 0, TAU); ctx.fill(); ctx.stroke(); line(ctx, bx + 16, y, bx + 30, y, tint('orange', 0.6), 1.5); }
      const y = top + 0.5 * G * ft * ft * sc; const v = G * ft;
      ball(ctx, bx, y, 12, 'orange', 16);
      arr(ctx, bx - 30, y, bx - 30, y + v * 7, 'cyan', 4);
      // v–t graph: a straight line whose gradient is g.
      const gx = X0 + 470; const gyy = Y0 + 160; const gw = 290; const gh = 270;
      axes(ctx, gx, gyy, gw, gh, 'time (s)', 'velocity (m/s)');
      const mx = (q) => gx + q * gw; const my = (q) => gyy + gh - ((G * q) / 11) * gh;
      ctx.globalAlpha *= 0.3; trace(ctx, 10, mx, my, 'cyan', 2); ctx.globalAlpha /= 0.3;
      glow(ctx, COLORS.cyan, 10); trace(ctx, 10, mx, my, 'cyan', 4, ft / T); ctx.shadowBlur = 0;
      dot(ctx, mx(ft / T), my(ft / T), 7, 'cyan');
      chip(ctx, 'gradient = g = 9.8 m/s²', gx + gw / 2, gyy + gh + 60, 'purple');
      chip(ctx, `t = ${fx(ft, 2)} s`, gx + gw / 2, Y0 + 560, 'ink');
      chip(ctx, `v = gt = ${fx(v)} m/s`, gx + gw / 2, Y0 + 615, 'cyan');
      label(ctx, 'Same time between flashes, bigger gaps each time', cx, Y0 + 680, { size: 20, weight: 600, fill: 'muted' });
      ctx.restore();
    },

    // A car speeding up steadily, with u, v, a, t and s read off live.
    suvat(b, ctx, it, t) {
      const u = val(it.u, 2); const a = val(it.a, 1.5); const Tend = clamp(val(it.t, 6), 1, 20);
      const sAt = (tt) => u * tt + 0.5 * a * tt * tt;
      let sMax = Math.max(Math.abs(sAt(Tend)), 1);
      if (a < 0 && -u / a > 0 && -u / a < Tend) sMax = Math.max(sMax, Math.abs(sAt(-u / a)));
      const speed = Math.max(1, Tend / 6); const P = Tend / speed + 1.6;
      const tt = Math.min(Tend, cycle(t, P) * speed);
      const s = sAt(tt); const v = u + a * tt;
      const rx0 = X0 + 40; const rw = FIG.w - 280; const ry = Y0 + 200; const sc = rw / sMax;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Uniform acceleration: suvat');
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(X0 + 20, ry, FIG.w - 40, 26);
      // A tick where the car was at each whole second: the gaps grow.
      ctx.strokeStyle = tint('blue', 0.8); ctx.lineWidth = 3; ctx.beginPath();
      for (let k = 0; k <= Math.floor(tt) && k <= 40; k++) { const x = rx0 + 60 + sAt(k) * sc; ctx.moveTo(x, ry + 4); ctx.lineTo(x, ry + 22); }
      ctx.stroke();
      const carX = rx0 + s * sc;
      cart(ctx, carX, ry, 120, 36, 'blue', '', s / 0.4);
      arr(ctx, carX + 124, ry - 34, carX + 124 + Math.min(100, Math.max(0, v) * 9) + 4, ry - 34, 'cyan', 5);
      if (a) arr(ctx, carX + 20, ry - 92, carX + 20 + Math.sign(a) * (24 + Math.abs(a) * 14), ry - 92, 'purple', 4);
      // Readouts.
      const row1 = Y0 + 320; const row2 = Y0 + 385;
      chip(ctx, `u = ${fx(u)} m/s`, X0 + 150, row1, 'cyan');
      chip(ctx, `a = ${fx(a)} m/s²`, cx, row1, 'purple');
      chip(ctx, `t = ${fx(tt)} s`, X1 - 150, row1, 'ink');
      chip(ctx, `v = ${fx(v)} m/s`, X0 + 260, row2, 'cyan');
      chip(ctx, `s = ${fx(s)} m`, X1 - 260, row2, 'blue');
      label(ctx, `v = u + at = ${fx(u)} + ${fx(a)} × ${fx(tt)} = ${fx(v)} m/s`, cx, Y0 + 490, { size: 24, weight: 600, fill: 'ink' });
      label(ctx, `s = ut + ½at² = ${fx(s)} m`, cx, Y0 + 550, { size: 24, weight: 600, fill: 'ink' });
      label(ctx, 'Ticks mark each second: the car covers more ground every second', cx, Y0 + 640, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // One force split into a horizontal and a vertical part.
    'resolve-vectors'(b, ctx, it, t) {
      const F = Math.max(1, val(it.force, 50));
      const deg = it.angle !== undefined ? clamp(val(it.angle, 35), 0, 90) : 45 + 25 * Math.sin(b.clock * 0.5);
      const th = deg * DEG; const k = 380 / F;
      const ox = X0 + 130; const oy = Y0 + 570;
      const Fx = F * Math.cos(th); const Fy = F * Math.sin(th);
      const tx = ox + Fx * k; const ty = oy - Fy * k;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Resolving a force into components');
      ctx.strokeStyle = 'rgba(140,170,255,0.08)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let x = ox; x <= X1 - 40; x += 50) { ctx.moveTo(x, Y0 + 110); ctx.lineTo(x, oy); }
      for (let y = oy; y >= Y0 + 110; y -= 50) { ctx.moveTo(ox, y); ctx.lineTo(X1 - 40, y); }
      ctx.stroke();
      line(ctx, ox, oy, X1 - 40, oy, 'rgba(200,215,255,0.4)', 2); line(ctx, ox, oy, ox, Y0 + 110, 'rgba(200,215,255,0.4)', 2);
      const q = after(t, 0.5, 0.6);
      ctx.save(); ctx.globalAlpha *= q;
      line(ctx, ox, ty, tx, ty, 'rgba(251,191,36,0.35)', 2, [6, 8]);
      line(ctx, ox, oy, ox, ty, 'rgba(251,191,36,0.35)', 2, [6, 8]);
      arr(ctx, ox, oy, tx, oy, 'yellow', 6);
      arr(ctx, tx, oy, tx, ty, 'yellow', 6);
      label(ctx, `Fx = F cos θ = ${fx(Fx)} N`, (ox + tx) / 2, oy + 34, { size: 21, weight: 700, fill: 'yellow' });
      label(ctx, `Fy = F sin θ = ${fx(Fy)} N`, tx + 18, (oy + ty) / 2, { size: 21, weight: 700, fill: 'yellow', align: 'left' });
      ctx.restore();
      glow(ctx, COLORS.orange, 16); arr(ctx, ox, oy, ox + (tx - ox) * easeOut(clamp(t / 0.6)), oy + (ty - oy) * easeOut(clamp(t / 0.6)), 'orange', 8); ctx.shadowBlur = 0;
      angleArc(ctx, ox, oy, 70, -th, 0, 'ink', `θ = ${fx(deg, 0)}°`, 112, 'left');
      label(ctx, `F = ${fx(F, 0)} N`, ox + (tx - ox) * 0.5 - 24, oy + (ty - oy) * 0.5 - 26, { size: 23, weight: 700, fill: 'orange', align: 'right' });
      label(ctx, 'Fx² + Fy² = F²: the two parts together do the same job as F', cx, Y0 + 670, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // A cart pushed by a steady force: a = F / m, so it speeds up evenly.
    newton2(b, ctx, it, t) {
      const F = Math.max(0.1, val(it.force, 20)); const m = Math.max(0.1, val(it.mass, 4)); const a = F / m;
      const Tr = 3; const st = Math.min(Tr, cycle(t, Tr + 1.3));
      const tx0 = X0 + 140; const run = 520; const ty = Y0 + 300;
      const w = clamp(70 + m * 8, 80, 140);
      const x = tx0 + run * (st / Tr) ** 2;
      const v = a * st;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || "Newton's second law: F = ma");
      ground(ctx, X0 + 30, X1 - 30, ty);
      // Ghosts every half second: the gaps grow.
      ctx.strokeStyle = tint('blue', 0.25); ctx.lineWidth = 2;
      for (let g = 0.5; g < st; g += 0.5) { const gx = tx0 + run * (g / Tr) ** 2; rounded(ctx, gx, ty - 22 - 50, w, 50, 10); ctx.stroke(); }
      cart(ctx, x, ty, w, 50, 'blue', `${fx(m, m < 10 ? 1 : 0)} kg`, (x - tx0) / 11);
      const len = clamp(40 + F * 3, 50, 150);
      glow(ctx, COLORS.orange, 14); arr(ctx, x - 12 - len, ty - 47, x - 6, ty - 47, 'orange', 8); ctx.shadowBlur = 0;
      label(ctx, `F = ${fx(F, 0)} N`, x - 12 - len / 2, ty - 84, { size: 21, weight: 700, fill: 'orange' });
      arr(ctx, x + w / 2 - 20, ty - 110, x + w / 2 - 20 + clamp(30 + a * 10, 36, 130), ty - 110, 'purple', 5);
      label(ctx, 'a', x + w / 2 - 30, ty - 110, { size: 21, weight: 700, fill: 'purple', align: 'right' });
      chip(ctx, `v = ${fx(v)} m/s`, X1 - 140, Y0 + 110, 'cyan');
      label(ctx, `a = F ÷ m = ${fx(F, 0)} ÷ ${fx(m, m < 10 ? 1 : 0)} = ${fx(a)} m/s²`, cx, Y0 + 420, { size: 28, weight: 700, fill: 'purple' });
      wrapLabel(ctx, 'Double the force: double the acceleration.', X0 + 40, Y0 + 520, FIG.w - 80, 21, 'center', 'muted', 500);
      wrapLabel(ctx, 'Double the mass: half the acceleration.', X0 + 40, Y0 + 565, FIG.w - 80, 21, 'center', 'muted', 500);
      ctx.restore();
    },

    // A block slides on a rough floor; friction points backwards and brings it to rest.
    friction(b, ctx, it, t) {
      const u = Math.max(0.5, val(it.speed, 6)); const mu = clamp(val(it.mu, 0.3), 0.02, 1.5); const m = Math.max(0.1, val(it.mass, 2));
      const a = mu * G; const tStop = u / a; const sStop = (u * u) / (2 * a); const Ff = mu * m * G;
      const st = Math.min(tStop, cycle(t, tStop + 1.6));
      const s = u * st - 0.5 * a * st * st; const v = u - a * st;
      const fy = Y0 + 290; const bw = 110; const bh = 70; const sc = (FIG.w - 160 - bw) / sStop;
      const bx = X0 + 90 + s * sc;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Friction opposes motion');
      // Rough floor.
      ctx.strokeStyle = LINE; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X0 + 30, fy);
      for (let i = 0, x = X0 + 30; x <= X1 - 30; i++, x += 12) ctx.lineTo(x, fy + (i % 2 ? 4 : 0));
      ctx.stroke();
      ctx.fillStyle = tint('purple', 0.3); ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 3;
      rounded(ctx, bx, fy - bh, bw, bh, 8); ctx.fill(); ctx.stroke();
      label(ctx, `${fx(m, m < 10 ? 1 : 0)} kg`, bx + bw / 2, fy - bh / 2, { size: 20, weight: 700, fill: 'ink' });
      if (v > 0.01) {
        arr(ctx, bx + bw / 2, fy - bh - 24, bx + bw / 2 + 20 + v * 14, fy - bh - 24, 'cyan', 5);
        glow(ctx, COLORS.red, 12); arr(ctx, bx + 10, fy + 14, bx + 10 - Math.min(90, 30 + Ff * 6), fy + 14, 'red', 6); ctx.shadowBlur = 0;
        ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2; ctx.beginPath();
        for (let k = 0; k < 4; k++) { const sx = bx + 20 + rnd(k + Math.floor(b.clock * 12)) * (bw - 40); ctx.moveTo(sx, fy - 2); ctx.lineTo(sx - 6 - rnd(k * 3 + 1) * 10, fy - 14); }
        ctx.stroke();
      }
      chip(ctx, `v = ${fx(v)} m/s`, X0 + 140, Y0 + 380, 'cyan');
      chip(ctx, v > 0.01 ? `friction = μmg = ${fx(Ff)} N` : 'at rest: no friction needed', cx, Y0 + 380, 'red');
      chip(ctx, `a = −μg = ${fx(-a)} m/s²`, X1 - 140, Y0 + 380, 'purple');
      // v–t graph: a straight line down to zero.
      const gx = X0 + 120; const gy = Y0 + 460; const gw = 560; const gh = 190; const tMax = tStop * 1.25;
      axes(ctx, gx, gy, gw, gh, 'time (s)', 'velocity (m/s)');
      const vAt = (q) => Math.max(0, u - a * q * tMax);
      const px = (q) => gx + q * gw; const py = (q) => gy + gh - (vAt(q) / (u * 1.1)) * gh;
      ctx.globalAlpha *= 0.3; trace(ctx, 30, px, py, 'cyan', 2); ctx.globalAlpha /= 0.3;
      trace(ctx, 30, px, py, 'cyan', 4, st / tMax);
      dot(ctx, px(st / tMax), py(st / tMax), 7, 'cyan', 10);
      ctx.restore();
    },

    // A skydiver: drag grows with speed until it matches weight; the parachute resets the balance.
    'terminal-velocity'(b, ctx, it, t) {
      const m = Math.max(20, val(it.mass, 80)); const W = m * G;
      const vt1 = val(it.terminal, 50); const vt2 = 6; const tOpen = 20; const chute = it.parachute !== false;
      const tEnd = chute ? 36 : 24; const k = 4;
      const tau = Math.min(tEnd, cycle(t, tEnd / k + 1.5, 0.5) * k);
      const v1At = (s) => vt1 * Math.tanh((G * s) / vt1);
      const c2 = Math.atanh(vt2 / v1At(tOpen));
      const vAt = (s) => (!chute || s <= tOpen ? v1At(s) : vt2 / Math.tanh((G * (s - tOpen)) / vt2 + c2));
      const sAt = (s) => (!chute || s <= tOpen ? ((vt1 * vt1) / G) * Math.log(Math.cosh((G * s) / vt1)) : ((vt1 * vt1) / G) * Math.log(Math.cosh((G * tOpen) / vt1)) + ((vt2 * vt2) / G) * (Math.log(Math.sinh((G * (s - tOpen)) / vt2 + c2)) - Math.log(Math.sinh(c2))));
      const open = chute && tau > tOpen;
      const v = vAt(tau); const vt = open ? vt2 : vt1; const D = W * (v / vt) ** 2;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Terminal velocity');
      // Sky column with clouds streaming past.
      const sx0 = X0 + 20; const sw = 360; const sy0 = Y0 + 70; const sh = 560;
      ctx.fillStyle = 'rgba(91,140,255,0.08)'; rounded(ctx, sx0, sy0, sw, sh, 18); ctx.fill();
      ctx.save(); rounded(ctx, sx0, sy0, sw, sh, 18); ctx.clip();
      const off = sAt(tau) * 6;
      ctx.fillStyle = 'rgba(233,238,255,0.12)';
      for (let i = 0; i < 5; i++) { const y = sy0 + mod(rnd(i) * sh - off, sh + 80) - 40; const x = sx0 + 30 + rnd(i + 9) * (sw - 90); ctx.beginPath(); ctx.ellipse(x, y, 46, 16, 0, 0, TAU); ctx.ellipse(x + 30, y - 8, 30, 14, 0, 0, TAU); ctx.fill(); }
      ctx.restore();
      // The skydiver.
      const px = sx0 + sw / 2; const py = sy0 + 300;
      ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 5; ctx.lineCap = 'round';
      if (open) {
        ctx.fillStyle = tint('purple', 0.4); ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(px, py - 110, 90, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(233,238,255,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath();
        ctx.moveTo(px - 88, py - 110); ctx.lineTo(px, py - 30); ctx.moveTo(px + 88, py - 110); ctx.lineTo(px, py - 30); ctx.stroke();
        ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 5; ctx.beginPath();
        ctx.moveTo(px, py - 20); ctx.lineTo(px, py + 20); ctx.moveTo(px, py - 12); ctx.lineTo(px - 16, py - 30); ctx.moveTo(px, py - 12); ctx.lineTo(px + 16, py - 30);
        ctx.moveTo(px, py + 20); ctx.lineTo(px - 10, py + 46); ctx.moveTo(px, py + 20); ctx.lineTo(px + 10, py + 46); ctx.stroke();
        dot(ctx, px, py - 30, 9, 'ink');
      } else {
        ctx.beginPath(); ctx.moveTo(px - 26, py); ctx.lineTo(px + 26, py);
        ctx.moveTo(px - 18, py); ctx.lineTo(px - 46, py - 22); ctx.moveTo(px + 18, py); ctx.lineTo(px + 46, py - 22);
        ctx.moveTo(px - 24, py); ctx.lineTo(px - 50, py + 18); ctx.moveTo(px + 24, py); ctx.lineTo(px + 50, py + 18); ctx.stroke();
        dot(ctx, px, py - 12, 9, 'ink');
      }
      const wl = 90; const dl = Math.min(open ? 85 : 220, (wl * D) / W);
      glow(ctx, COLORS.orange, 12); arr(ctx, px + 4, py + 30, px + 4, py + 30 + wl, 'orange', 7); ctx.shadowBlur = 0;
      arr(ctx, px - 4, py - (open ? 210 : 30), px - 4, py - (open ? 210 : 30) - dl, 'red', 7);
      label(ctx, 'weight', px + 18, py + 30 + wl - 10, { size: 19, weight: 700, fill: 'orange', align: 'left' });
      label(ctx, 'drag', px + 14, py - (open ? 210 : 30) - Math.max(dl, 20) + 6, { size: 19, weight: 700, fill: 'red', align: 'left' });
      // v–t graph.
      const gx = X0 + 450; const gy = Y0 + 110; const gw = 310; const gh = 280;
      axes(ctx, gx, gy, gw, gh, 'time', 'velocity');
      const pX = (q) => gx + q * gw; const pY = (q) => gy + gh - (vAt(q * tEnd) / 56) * gh;
      line(ctx, gx, gy + gh - (vt1 / 56) * gh, gx + gw, gy + gh - (vt1 / 56) * gh, 'rgba(34,211,238,0.4)', 1.5, [6, 6]);
      label(ctx, 'terminal velocity', gx + gw, gy + gh - (vt1 / 56) * gh - 16, { size: 17, weight: 600, fill: 'muted', align: 'right' });
      ctx.globalAlpha *= 0.25; trace(ctx, 90, pX, pY, 'cyan', 2); ctx.globalAlpha /= 0.25;
      glow(ctx, COLORS.cyan, 10); trace(ctx, 90, pX, pY, 'cyan', 4, tau / tEnd); ctx.shadowBlur = 0;
      dot(ctx, pX(tau / tEnd), pY(tau / tEnd), 7, 'cyan');
      chip(ctx, `v = ${fx(v, 0)} m/s`, gx + gw / 2, Y0 + 460, 'cyan');
      chip(ctx, `weight ${fx(W, 0)} N   drag ${fx(Math.min(D, 99999), 0)} N`, gx + gw / 2, Y0 + 515, 'orange', 19);
      const msg = open && v > vt2 * 1.03 ? 'Parachute open: drag > weight, so it slows down' : Math.abs(D - W) / W < 0.03 ? 'Drag = weight: no resultant force, steady speed' : 'Drag < weight: still speeding up';
      wrapLabel(ctx, msg, gx - 10, Y0 + 590, gw + 20, 20, 'center', 'ink', 600);
      ctx.restore();
    },

    // A seesaw: the right weight slides along; it balances when the moments are equal.
    moments(b, ctx, it, t) {
      const F1 = Math.max(1, val(it.f1, 40)); const d1 = clamp(val(it.d1, 1.5), 0.2, 3); const F2 = Math.max(1, val(it.f2, 30));
      const dBal = clamp((F1 * d1) / F2, 0.2, 3);
      const d2 = it.d2 !== undefined ? clamp(val(it.d2, dBal), 0.2, 3) : clamp(dBal + 0.9 * Math.sin(b.clock * 0.6) ** 3, 0.2, 3);
      const M1 = F1 * d1; const M2 = F2 * d2;
      const tilt = clamp(((M2 - M1) / M1) * 0.5, -0.16, 0.16);
      const px = cx; const py = Y0 + 370; const S = 100;
      const s1 = clamp(36 + Math.sqrt(F1) * 5, 40, 90); const s2 = clamp(36 + Math.sqrt(F2) * 5, 40, 90);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The principle of moments');
      ctx.fillStyle = tint('muted', 0.3); ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(px, py + 8); ctx.lineTo(px - 42, py + 84); ctx.lineTo(px + 42, py + 84); ctx.closePath(); ctx.fill(); ctx.stroke();
      ground(ctx, X0 + 60, X1 - 60, py + 84);
      ctx.save(); ctx.translate(px, py); ctx.rotate(tilt);
      ctx.fillStyle = 'rgba(220,230,255,0.22)'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
      rounded(ctx, -330, -8, 660, 16, 6); ctx.fill(); ctx.stroke();
      for (const [x, s, c] of [[-d1 * S, s1, 'blue'], [d2 * S, s2, 'purple']]) {
        ctx.fillStyle = tint(c, 0.35); ctx.strokeStyle = color(c); ctx.lineWidth = 3;
        rounded(ctx, x - s / 2, -8 - s, s, s, 8); ctx.fill(); ctx.stroke();
      }
      const yd = -8 - Math.max(s1, s2) - 26;
      ctx.strokeStyle = 'rgba(200,215,255,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(0, yd - 10); ctx.lineTo(0, -10); ctx.moveTo(-d1 * S, yd - 10); ctx.lineTo(-d1 * S, yd + 8); ctx.moveTo(d2 * S, yd - 10); ctx.lineTo(d2 * S, yd + 8); ctx.stroke();
      arr(ctx, -6, yd, -d1 * S + 2, yd, 'blue', 2.5); arr(ctx, 6, yd, d2 * S - 2, yd, 'purple', 2.5);
      label(ctx, `${fx(d1)} m`, (-d1 * S) / 2, yd - 18, { size: 19, weight: 700, fill: 'blue' });
      label(ctx, `${fx(d2)} m`, (d2 * S) / 2, yd - 18, { size: 19, weight: 700, fill: 'purple' });
      ctx.restore();
      const rot = (x, y) => [px + x * Math.cos(tilt) - y * Math.sin(tilt), py + x * Math.sin(tilt) + y * Math.cos(tilt)];
      const [a1x, a1y] = rot(-d1 * S, 10); const [a2x, a2y] = rot(d2 * S, 10);
      const L1 = 30 + F1 * 1.4; const L2 = 30 + F2 * 1.4; const Lm = Math.max(L1, L2); const kk = Lm > 110 ? 110 / Lm : 1;
      glow(ctx, COLORS.orange, 12); arr(ctx, a1x, a1y, a1x, a1y + L1 * kk, 'orange', 6); arr(ctx, a2x, a2y, a2x, a2y + L2 * kk, 'orange', 6); ctx.shadowBlur = 0;
      label(ctx, `${fx(F1, 0)} N`, a1x - 12, a1y + L1 * kk - 6, { size: 19, weight: 700, fill: 'orange', align: 'right' });
      label(ctx, `${fx(F2, 0)} N`, a2x + 12, a2y + L2 * kk - 6, { size: 19, weight: 700, fill: 'orange', align: 'left' });
      label(ctx, `Anticlockwise: ${fx(F1, 0)} N × ${fx(d1)} m = ${fx(M1)} N m`, cx, Y0 + 545, { size: 22, weight: 600, fill: 'blue' });
      label(ctx, `Clockwise: ${fx(F2, 0)} N × ${fx(d2)} m = ${fx(M2)} N m`, cx, Y0 + 590, { size: 22, weight: 600, fill: 'purple' });
      const bal = Math.abs(M2 - M1) / M1 < 0.02;
      chip(ctx, bal ? 'Balanced: the moments are equal' : M2 > M1 ? 'Clockwise moment bigger: right side goes down' : 'Anticlockwise moment bigger: left side goes down', cx, Y0 + 655, bal ? 'green' : 'ink', 20);
      ctx.restore();
    },

    // A tank of water: pressure grows with depth, so deeper jets squirt faster.
    'pressure-depth'(b, ctx, it, t) {
      const rho = Math.max(100, val(it.density, 1000)); const H = 5; const S = 80;
      const tl = X0 + 90; const tr = X0 + 390; const sy = Y0 + 140; const by = sy + H * S;
      const h = it.depth !== undefined ? clamp(val(it.depth, 3), 0, 4.2) : 2.3 + 1.9 * Math.sin(b.clock * 0.6);
      const p = rho * G * h;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Pressure increases with depth');
      const grad = ctx.createLinearGradient(0, sy, 0, by);
      grad.addColorStop(0, 'rgba(34,211,238,0.12)'); grad.addColorStop(1, 'rgba(91,140,255,0.38)');
      ctx.fillStyle = grad; ctx.fillRect(tl, sy, tr - tl, by - sy);
      ctx.strokeStyle = tint('cyan', 0.7); ctx.lineWidth = 2; ctx.beginPath();
      for (let x = tl; x <= tr; x += 10) { const y = sy + 2 * Math.sin(x * 0.08 + b.clock * 2); if (x === tl) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
      ctx.strokeStyle = LINE; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(tl, sy - 40); ctx.lineTo(tl, by); ctx.lineTo(tr, by); ctx.lineTo(tr, sy - 40); ctx.stroke();
      // Depth ruler.
      const rx = tl - 26;
      ctx.strokeStyle = 'rgba(200,215,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rx, sy); ctx.lineTo(rx, by);
      for (let m = 0; m <= H; m++) { ctx.moveTo(rx - 8, sy + m * S); ctx.lineTo(rx, sy + m * S); }
      ctx.stroke();
      label(ctx, '0 m', rx - 12, sy, { size: 16, weight: 600, fill: 'muted', align: 'right' });
      label(ctx, `${H} m`, rx - 12, by, { size: 16, weight: 600, fill: 'muted', align: 'right' });
      // Pressure arrows on the wall and the floor.
      for (let d = 0.5; d < H; d += 1) { const len = 10 + (d / H) * 60; arr(ctx, tl + 12 + len, sy + d * S, tl + 8, sy + d * S, 'orange', 3.5); }
      for (const x of [tl + 110, tl + 190, tl + 260]) arr(ctx, x, by - 40, x, by - 6, 'orange', 3.5);
      // Jets from three holes: exit speed √(2gh).
      ctx.strokeStyle = 'rgba(34,211,238,0.85)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.setLineDash([16, 10]); ctx.lineDashOffset = -b.clock * 80;
      for (const d of [1, 2.5, 4]) {
        const v = Math.sqrt(2 * G * d); const y0 = sy + d * S;
        ctx.beginPath(); ctx.moveTo(tr, y0);
        for (let k = 1; k <= 14; k++) { const s = (k / 14) * 0.42; ctx.lineTo(tr + v * s * S, y0 + 0.5 * G * s * s * S); }
        ctx.stroke();
      }
      ctx.setLineDash([]); ctx.lineDashOffset = 0;
      // The probe.
      const ppx = (tl + tr) / 2; const ppy = sy + h * S;
      line(ctx, ppx, sy - 60, ppx, ppy - 14, 'rgba(200,215,255,0.6)', 3);
      ctx.fillStyle = DARK; ctx.strokeStyle = COLORS.green; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ppx, ppy, 14, 0, TAU); ctx.fill(); ctx.stroke();
      label(ctx, `h = ${fx(h)} m`, ppx + 24, ppy, { size: 19, weight: 700, fill: 'green', align: 'left' });
      chip(ctx, `p = ρgh = ${fx(rho, 0)} × 9.8 × ${fx(h)} = ${fx(p / 1000)} kPa`, cx, Y0 + 610, 'orange', 21);
      label(ctx, 'More water above you: more pressure, so deeper jets go faster', cx, Y0 + 665, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Blocks dropped in water: upthrust grows as they go under; it beats weight only for the light one.
    upthrust(b, ctx, it, t) {
      const rhoW = 1000;
      const blocks = it.density !== undefined ? [{ rho: clamp(val(it.density, 600), 50, 20000), x: cx, name: String(it.name || 'object') }] : [{ rho: 600, x: X0 + 240, name: 'wood' }, { rho: 2500, x: X0 + 570, name: 'stone' }];
      const surf = Y0 + 330; const bot = Y0 + 560; const side = 90; const k = 7;
      const tau = cycle(t, 7, 0.4);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Upthrust: float or sink?');
      ctx.fillStyle = tint('cyan', 0.14); ctx.fillRect(X0 + 40, surf, FIG.w - 80, bot - surf);
      ctx.strokeStyle = tint('cyan', 0.7); ctx.lineWidth = 2; ctx.beginPath();
      for (let x = X0 + 40; x <= X1 - 40; x += 12) { const y = surf + 2.5 * Math.sin(x * 0.06 + b.clock * 2.2); if (x === X0 + 40) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
      ctx.strokeStyle = LINE; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X0 + 40, surf - 50); ctx.lineTo(X0 + 40, bot); ctx.lineTo(X1 - 40, bot); ctx.lineTo(X1 - 40, surf - 50); ctx.stroke();
      for (const bk of blocks) {
        let d;
        if (tau < 1) d = -90 * (1 - smooth(tau));
        else { const s = tau - 1; d = bk.rho < rhoW ? ((side * bk.rho) / rhoW) * (1 - Math.exp(-s / 0.7) * Math.cos(5 * s)) : (bot - surf) * (1 - Math.exp(-s / 0.8)); }
        d = Math.min(d, bot - surf);
        const f = clamp(d / side); const U = rhoW * 0.001 * f * G; const W = bk.rho * 0.001 * G;
        const c = bk.rho < rhoW ? 'orange' : 'purple';
        const yb = surf + d; const ymid = yb - side / 2;
        ctx.fillStyle = tint(c, 0.4); ctx.strokeStyle = color(c); ctx.lineWidth = 3;
        rounded(ctx, bk.x - side / 2, yb - side, side, side, 8); ctx.fill(); ctx.stroke();
        const wTip = ymid + W * k; const out = wTip > yb + 14;
        arr(ctx, bk.x + 12, ymid, bk.x + 12, wTip, 'orange', 6);
        label(ctx, `W = ${fx(W)} N`, out ? bk.x + 26 : bk.x + side / 2 + 10, out ? wTip - 8 : ymid + 20, { size: 19, weight: 700, fill: 'orange', align: 'left' });
        if (U > 0.05) {
          const uTip = ymid - U * k; const up = uTip < yb - side - 14;
          glow(ctx, COLORS.teal, 10); arr(ctx, bk.x - 12, ymid, bk.x - 12, uTip, 'teal', 6); ctx.shadowBlur = 0;
          label(ctx, `U = ${fx(U)} N`, up ? bk.x - 26 : bk.x - side / 2 - 10, up ? uTip + 8 : ymid - 20, { size: 19, weight: 700, fill: 'teal', align: 'right' });
        }
        chip(ctx, `${bk.name}: ${fx(bk.rho, 0)} kg/m³`, bk.x, Y0 + 82, c, 19);
        if (tau > 2.6) label(ctx, bk.rho < rhoW ? 'floats: upthrust = weight' : 'sinks: weight > upthrust', bk.x, Y0 + 124, { size: 19, weight: 600, fill: bk.rho < rhoW ? 'green' : 'red' });
      }
      label(ctx, 'Upthrust = weight of the water pushed aside', X0 + 40, Y0 + 682, { size: 19, weight: 600, fill: 'muted', align: 'left' });
      ctx.restore();
    },

    // Masses added one by one: extension grows in step with force, until the limit of proportionality.
    hooke(b, ctx, it, t) {
      const k = Math.max(1, val(it.k, 25)); const lim = 4; const cmPerN = 100 / k;
      const ext = (F) => (F <= lim ? F * cmPerN : (F + 0.75 * (F - lim) ** 2) * cmPerN);
      const step = 1.1; const tau = cycle(t, 7 * step + 1.8);
      const n = Math.min(6, Math.floor(tau / step)); const since = tau - n * step;
      let e = ext(n);
      if (n >= 1) e += (ext(n - 1) - ext(n)) * Math.exp(-since / 0.15) * Math.cos(since * 14);
      const eMax = ext(6); const pc = 216 / eMax;
      const sx = X0 + 190; const top = Y0 + 96; const nat = 150;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || "Hooke's law: F = ke");
      ctx.fillStyle = 'rgba(220,230,255,0.25)'; ctx.fillRect(X0 + 90, top - 14, 200, 14);
      ground(ctx, X0 + 90, X0 + 290, top - 14);
      const yEnd = top + nat + e * pc;
      spring(ctx, sx, top, sx, yEnd, 12, 16, 'ink', 3);
      line(ctx, sx, yEnd, sx, yEnd + 14, LINE, 3);
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = tint('orange', 0.45); ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2;
        rounded(ctx, sx - 32, yEnd + 14 + i * 24, 64, 22, 6); ctx.fill(); ctx.stroke();
      }
      // Ruler for the extension.
      const rx = X0 + 330; const r0 = top + nat;
      line(ctx, rx, r0, rx, r0 + eMax * pc, 'rgba(200,215,255,0.6)', 2);
      ctx.beginPath(); for (let c = 0; c <= eMax; c += 5) { ctx.moveTo(rx, r0 + c * pc); ctx.lineTo(rx + 10, r0 + c * pc); } ctx.stroke();
      line(ctx, sx + 20, yEnd, rx - 4, yEnd, 'rgba(91,140,255,0.8)', 2, [5, 5]);
      line(ctx, sx + 20, r0, rx - 4, r0, 'rgba(200,215,255,0.35)', 1.5, [5, 5]);
      // Force–extension graph.
      const gx = X0 + 420; const gy = Y0 + 130; const gw = 340; const gh = 380; const xm = eMax * 1.1;
      axes(ctx, gx, gy, gw, gh, 'extension (cm)', 'force (N)');
      const px = (cm) => gx + (cm / xm) * gw; const py = (F) => gy + gh - (F / 7) * gh;
      line(ctx, px(0), py(0), px(7 * cmPerN), py(7), 'rgba(255,159,67,0.3)', 2, [6, 6]);
      if (n > 0) { glow(ctx, COLORS.orange, 10); trace(ctx, 40, (q) => px(ext(q * n)), (q) => py(q * n), 'orange', 4); ctx.shadowBlur = 0; }
      for (let i = 0; i <= n; i++) dot(ctx, px(ext(i)), py(i), 6, i > lim ? 'red' : 'orange');
      if (n >= lim) {
        ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px(ext(lim)), py(lim), 12, 0, TAU); ctx.stroke();
        label(ctx, 'limit of proportionality', px(ext(lim)) + 18, py(lim) + 22, { size: 17, weight: 600, fill: 'ink', align: 'left' });
      }
      chip(ctx, `F = ${n} N`, gx + 80, Y0 + 580, 'orange');
      chip(ctx, `e = ${fx(Math.max(0, e))} cm`, gx + 250, Y0 + 580, 'blue');
      label(ctx, n <= lim ? `Straight line through 0: k = F ÷ e = ${fx(k, 0)} N/m` : 'Past the limit: F = ke no longer holds', cx, Y0 + 648, { size: 19, weight: 600, fill: n <= lim ? 'ink' : 'red' });
      ctx.restore();
    },

    // A block on a slope: weight splits into a part down the slope and a part into it.
    'inclined-plane'(b, ctx, it, t) {
      const deg = it.angle !== undefined ? clamp(val(it.angle, 30), 8, 60) : 30 + 8 * Math.sin(b.clock * 0.4);
      const th = deg * DEG; const m = Math.max(0.1, val(it.mass, 5)); const W = m * G;
      const sn = Math.sin(th); const cs = Math.cos(th);
      const Ax = X0 + 80; const Ay = Y0 + 580; const bl = Math.min(660, 400 / Math.tan(th)); const hgt = bl * Math.tan(th);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Forces on a slope');
      ctx.fillStyle = tint('blue', 0.12); ctx.strokeStyle = LINE; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(Ax, Ay); ctx.lineTo(Ax + bl, Ay); ctx.lineTo(Ax + bl, Ay - hgt); ctx.closePath(); ctx.fill(); ctx.stroke();
      angleArc(ctx, Ax, Ay, 70, -th, 0, 'ink', `θ = ${fx(deg, 0)}°`, 115, 'left');
      const ux = cs; const uy = -sn; const nx = -sn; const ny = -cs;
      const along = (bl / cs) * 0.55; const Px = Ax + ux * along; const Py = Ay + uy * along;
      ctx.save(); ctx.translate(Px, Py); ctx.rotate(-th);
      ctx.fillStyle = tint('purple', 0.35); ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 3; rounded(ctx, -55, -70, 110, 70, 8); ctx.fill(); ctx.stroke();
      ctx.restore();
      const Cx = Px + nx * 35; const Cy = Py + ny * 35; const L = 150;
      const lab = (text, x, y, c, align) => label(ctx, text, x, y, { size: 19, weight: 700, fill: c, align });
      let q = after(t, 0.3);
      if (q > 0) { glow(ctx, COLORS.orange, 12); arr(ctx, Cx, Cy, Cx, Cy + L * q, 'orange', 7); ctx.shadowBlur = 0; lab(`W = ${fx(W)} N`, Cx + 12, Cy + L + 18, 'orange', 'left'); }
      q = after(t, 0.9);
      if (q > 0) {
        ctx.save(); ctx.globalAlpha *= q;
        const l1 = L * sn; const l2 = L * cs;
        arr(ctx, Cx, Cy, Cx - ux * l1, Cy - uy * l1, 'yellow', 4);
        arr(ctx, Cx, Cy, Cx - nx * l2, Cy - ny * l2, 'yellow', 4);
        lab(`W sin θ = ${fx(W * sn)} N`, Cx - ux * (l1 + 20) + nx * 26, Cy - uy * (l1 + 20) + ny * 26, 'yellow', 'right');
        lab(`W cos θ = ${fx(W * cs)} N`, Cx - nx * l2 + 14, Cy - ny * l2 + 20, 'yellow', 'left');
        ctx.restore();
      }
      q = after(t, 1.4);
      if (q > 0) { ctx.save(); ctx.globalAlpha *= q; arr(ctx, Cx, Cy, Cx + nx * L * cs, Cy + ny * L * cs, 'teal', 6); lab(`R = ${fx(W * cs)} N`, Cx + nx * (L * cs + 22) - 6, Cy + ny * (L * cs + 22), 'teal', 'right'); ctx.restore(); }
      q = after(t, 1.8);
      if (q > 0 && it.friction !== false) { ctx.save(); ctx.globalAlpha *= q; const lf = L * sn; arr(ctx, Px, Py, Px + ux * lf, Py + uy * lf, 'red', 5); lab(`friction ${fx(W * sn)} N`, Px + ux * Math.max(lf + 10, 70) + nx * 24, Py + uy * Math.max(lf + 10, 70) + ny * 24, 'red', 'left'); ctx.restore(); }
      label(ctx, 'At rest: R balances W cos θ, friction balances W sin θ', cx, Y0 + 660, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // A roller coaster car: gravitational potential energy and kinetic energy trade places; friction warms the track.
    'energy-transfer'(b, ctx, it, t) {
      const g = it._energy || (it._energy = (() => {
        const hf = (X) => 26 * (X / 30) ** 2 + 8 * Math.exp(-((X / 5.4) ** 2));
        const dh = (X) => (52 * X) / 900 - ((16 * X) / (5.4 * 5.4)) * Math.exp(-((X / 5.4) ** 2));
        const mu = 0.05; const dt = 0.004; const N = 651;
        const xs = new Float32Array(N); const vs = new Float32Array(N); const th = new Float32Array(N);
        let X = -28.5; let v = 0; let E = 0;
        for (let i = 0; i < N; i++) {
          xs[i] = X; vs[i] = v; th[i] = E;
          for (let k = 0; k < 5; k++) {
            const s = dh(X); const q = Math.sqrt(1 + s * s); const sin = s / q; const cos = 1 / q;
            if (Math.abs(v) < 0.05 && Math.abs(sin) <= mu * cos) { v = 0; continue; }
            const acc = -G * sin - Math.sign(v || -sin) * mu * G * cos;
            v += acc * dt; const ds = v * dt; X += ds * cos; E += mu * G * cos * Math.abs(ds);
          }
        }
        return { xs, vs, th, hf, dh, N, h0: hf(-28.5) };
      })());
      const mass = 500; const Etot = (mass * G * g.h0) / 1000;
      const tau = cycle(t, 13.5, 0.5); const fi = Math.min(g.N - 1.001, tau / 0.02); const i = Math.floor(fi); const f = fi - i;
      const X = g.xs[i] + (g.xs[i + 1] - g.xs[i]) * f; const v = g.vs[i] + (g.vs[i + 1] - g.vs[i]) * f; const Th = g.th[i] + (g.th[i + 1] - g.th[i]) * f;
      const h = g.hf(X);
      const GPE = (mass * G * h) / 1000; const KE = (0.5 * mass * v * v) / 1000; const TH = Math.max(0, Etot - GPE - KE);
      const mx = (x) => X0 + 80 + ((x + 30) / 60) * 640; const my = (hh) => Y0 + 410 - hh * 10;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Energy transfers on a roller coaster');
      ctx.fillStyle = 'rgba(91,140,255,0.08)'; ctx.beginPath(); ctx.moveTo(mx(-30), Y0 + 430);
      for (let x = -30; x <= 30; x += 1) ctx.lineTo(mx(x), my(g.hf(x)));
      ctx.lineTo(mx(30), Y0 + 430); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(140,170,255,0.2)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let x = -24; x <= 24; x += 8) { ctx.moveTo(mx(x), my(g.hf(x)) + 4); ctx.lineTo(mx(x), Y0 + 430); }
      ctx.stroke();
      ctx.strokeStyle = LINE; ctx.lineWidth = 4; ctx.beginPath();
      for (let x = -30; x <= 30; x += 1) { if (x === -30) ctx.moveTo(mx(x), my(g.hf(x))); else ctx.lineTo(mx(x), my(g.hf(x))); }
      ctx.stroke();
      // The car, tilted along the track.
      const ang = Math.atan(-g.dh(X) * (10 / (640 / 60)));
      ctx.save(); ctx.translate(mx(X), my(h)); ctx.rotate(ang);
      ctx.fillStyle = tint('orange', 0.5); ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2.5;
      rounded(ctx, -24, -30, 48, 22, 7); ctx.fill(); ctx.stroke();
      dot(ctx, -14, -6, 6, 'ink'); dot(ctx, 14, -6, 6, 'ink');
      if (Math.abs(v) > 0.3) arr(ctx, 0, -44, Math.sign(v) * (20 + Math.abs(v) * 3.2), -44, 'cyan', 4);
      ctx.restore();
      // Energy bars.
      const rows = [['GPE', GPE, 'blue'], ['KE', KE, 'cyan'], ['thermal', TH, 'orange']];
      rows.forEach(([name, E, c], r) => {
        const y = Y0 + 480 + r * 58;
        label(ctx, `${name} ${fx(E, 0)} kJ`, X0 + 50, y, { size: 21, weight: 700, fill: c, align: 'left' });
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; rounded(ctx, X0 + 250, y - 15, 500, 30, 8); ctx.fill();
        ctx.fillStyle = tint(c, 0.75); rounded(ctx, X0 + 250, y - 15, Math.max(2, (500 * E) / Etot), 30, 8); ctx.fill();
      });
      label(ctx, `Total stays ${fx(Etot, 0)} kJ: energy is transferred, never lost`, cx, Y0 + 665, { size: 20, weight: 700, fill: 'green' });
      ctx.restore();
    },

    // A pendulum and its displacement–time graph: a sine curve with period T = 2π√(L/g).
    'pendulum-shm'(b, ctx, it, t) {
      const L = clamp(val(it.length, 1), 0.1, 10); const T = TAU * Math.sqrt(L / G); const a0 = clamp(val(it.amplitude, 15), 2, 30) * DEG;
      const tau = Math.max(0, t - 0.5); const w = TAU / T;
      const th = a0 * Math.cos(w * tau); const om = -a0 * w * Math.sin(w * tau);
      const pvx = X0 + 230; const pvy = Y0 + 100; const Lp = 280;
      const bx = pvx + Lp * Math.sin(th); const by = pvy + Lp * Math.cos(th);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'A pendulum: simple harmonic motion');
      ctx.fillStyle = 'rgba(220,230,255,0.25)'; ctx.fillRect(pvx - 70, pvy - 12, 140, 12);
      line(ctx, pvx, pvy, pvx, pvy + Lp + 30, 'rgba(200,215,255,0.3)', 1.5, [5, 6]);
      ctx.strokeStyle = 'rgba(200,215,255,0.3)'; ctx.lineWidth = 2; ctx.setLineDash([2, 7]);
      ctx.beginPath(); ctx.arc(pvx, pvy, Lp, Math.PI / 2 - a0, Math.PI / 2 + a0); ctx.stroke(); ctx.setLineDash([]);
      line(ctx, pvx, pvy, bx, by, LINE, 2.5);
      ball(ctx, bx, by, 18, 'orange', 18);
      const tx = Math.cos(th); const ty = -Math.sin(th);
      const vl = om * Lp * 0.35; const al = (-th / a0) * 70;
      arr(ctx, bx, by - 28, bx + tx * vl, by - 28 + ty * vl, 'cyan', 4);
      arr(ctx, bx + Math.sin(th) * 30, by + Math.cos(th) * 30, bx + Math.sin(th) * 30 + tx * al, by + Math.cos(th) * 30 + ty * al, 'purple', 4);
      chip(ctx, `T = 2π√(L/g) = ${fx(T, 2)} s`, X0 + 600, Y0 + 160, 'ink'); label(ctx, 'The mass of the bob does not change T', X0 + 600, Y0 + 262, { size: 16, weight: 500, fill: 'muted' });
      chip(ctx, `L = ${fx(L, 2)} m`, X0 + 600, Y0 + 215, 'blue');
      label(ctx, 'cyan: velocity, fastest in the middle', X0 + 600, Y0 + 310, { size: 17, weight: 600, fill: 'cyan' });
      label(ctx, 'purple: acceleration, towards the middle', X0 + 600, Y0 + 340, { size: 17, weight: 600, fill: 'purple' });
      // Displacement–time trace.
      const gx = X0 + 60; const gy = Y0 + 450; const gw = 680; const gh = 200;
      axes(ctx, gx, gy, gw, gh, 'time', 'displacement', true);
      const Wt = clamp(3 * T, 3, 12); const tg = mod(tau, Wt); const s0 = tau - tg;
      const xq = (q) => gx + q * gw; const yq = (q) => gy + gh / 2 - Math.cos(w * (s0 + q * Wt)) * (gh / 2 - 12);
      glow(ctx, COLORS.orange, 8); trace(ctx, 160, xq, yq, 'orange', 3.5, tg / Wt); ctx.shadowBlur = 0;
      dot(ctx, xq(tg / Wt), yq(tg / Wt), 6, 'orange');
      const k1 = Math.ceil(s0 / T - 1e-6) + 1; const c0 = gx + ((k1 * T - s0) / Wt) * gw; const c1 = gx + (((k1 + 1) * T - s0) / Wt) * gw;
      if (c1 <= gx + gw) { arr(ctx, c0 + 4, gy - 4, c1 - 4, gy - 4, 'ink', 2); arr(ctx, c1 - 4, gy - 4, c0 + 4, gy - 4, 'ink', 2); label(ctx, 'one period T', (c0 + c1) / 2, gy - 24, { size: 17, weight: 600, fill: 'ink' }); }
      ctx.restore();
    },

    // A mass bobbing on a spring, drawing its own displacement–time graph.
    'spring-shm'(b, ctx, it, t) {
      const m = Math.max(0.05, val(it.mass, 0.5)); const k = Math.max(0.5, val(it.k, 20)); const T = TAU * Math.sqrt(m / k);
      const A = 80; const w = TAU / T; const tau = Math.max(0, t - 0.5);
      const yAt = (s) => A * Math.cos(w * s);
      const sx = X0 + 150; const top = Y0 + 90; const eq = Y0 + 360;
      const y = eq + yAt(tau);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'A mass on a spring: simple harmonic motion');
      ctx.fillStyle = 'rgba(220,230,255,0.25)'; ctx.fillRect(sx - 70, top - 12, 140, 12);
      spring(ctx, sx, top, sx, y - 32, 14, 18, 'ink', 3);
      ctx.fillStyle = tint('blue', 0.4); ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 3;
      rounded(ctx, sx - 42, y - 32, 84, 64, 10); ctx.fill(); ctx.stroke();
      label(ctx, `${fx(m, 2)} kg`, sx, y, { size: 18, weight: 700, fill: 'ink' });
      line(ctx, sx - 70, eq, X1 - 30, eq, 'rgba(200,215,255,0.3)', 1.5, [6, 6]);
      const pen = X0 + 270; const span = X1 - 40 - pen; const Wt = span / 110;
      line(ctx, sx + 42, y, pen, y, 'rgba(91,140,255,0.6)', 1.5, [4, 5]);
      glow(ctx, COLORS.blue, 8);
      trace(ctx, 140, (q) => pen + q * span, (q) => eq + yAt(tau - q * Wt), 'blue', 3.5, Math.min(1, tau / Wt));
      ctx.shadowBlur = 0;
      dot(ctx, pen, y, 7, 'blue');
      const v = -A * w * Math.sin(w * tau); const a = -w * w * yAt(tau);
      arr(ctx, sx - 70, y, sx - 70, y + v * 0.15, 'cyan', 4);
      arr(ctx, sx + 66, y, sx + 66, y + a * 0.022, 'purple', 4);
      chip(ctx, `T = 2π√(m/k) = ${fx(T, 2)} s`, cx, Y0 + 560, 'ink');
      chip(ctx, `m = ${fx(m, 2)} kg   k = ${fx(k, 1)} N/m`, cx, Y0 + 615, 'blue', 19);
      label(ctx, 'Velocity (cyan) peaks in the middle; acceleration (purple) peaks at the ends', cx, Y0 + 670, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Two carts collide: total momentum is the same before and after.
    collision(b, ctx, it, t) {
      const elastic = !String(it.kind || 'elastic').toLowerCase().startsWith('in');
      const m1 = Math.max(0.1, val(it.m1, 2)); const m2 = Math.max(0.1, val(it.m2, 1)); const u1 = val(it.u1, 3); const u2 = val(it.u2, 0);
      let v1; let v2;
      if (elastic) { v1 = ((m1 - m2) * u1 + 2 * m2 * u2) / (m1 + m2); v2 = ((m2 - m1) * u2 + 2 * m1 * u1) / (m1 + m2); } else { v1 = (m1 * u1 + m2 * u2) / (m1 + m2); v2 = v1; }
      const S = 45; const ty = Y0 + 270;
      const w1 = clamp(60 + 22 * m1, 70, 150); const w2 = clamp(60 + 22 * m2, 70, 150);
      const x1s = X0 + 50; const x2s = x1s + w1 + 3 * S;
      const tc = u1 > u2 ? 3 / (u1 - u2) : Infinity; const tcap = Math.min(tc, 3.5);
      const tau = Math.min(tcap + 1.8, cycle(t, tcap + 2.6));
      const hit = tau >= tc;
      let x1; let x2;
      if (!hit) { x1 = x1s + u1 * tau * S; x2 = x2s + u2 * tau * S; } else { const d = tau - tc; x1 = x1s + u1 * tc * S + v1 * d * S; x2 = elastic ? x2s + u2 * tc * S + v2 * d * S : x1 + w1; }
      x1 = clamp(x1, X0 + 20, X1 - 20 - w1 - (elastic ? 0 : w2)); x2 = clamp(elastic ? x2 : x1 + w1, X0 + 20 + w1, X1 - 20 - w2);
      const KE0 = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2; const KE1 = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2; const p0 = m1 * u1 + m2 * u2; const p1 = m1 * v1 + m2 * v2;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || `${elastic ? 'Elastic' : 'Inelastic'} collision: momentum is conserved`);
      ground(ctx, X0 + 20, X1 - 20, ty);
      cart(ctx, x1, ty, w1, 44, 'blue', `${fx(m1, m1 % 1 ? 1 : 0)} kg`, x1 / 11);
      cart(ctx, x2, ty, w2, 44, 'purple', `${fx(m2, m2 % 1 ? 1 : 0)} kg`, x2 / 11);
      if (hit && tau - tc < 0.35) {
        const q = (tau - tc) / 0.35; const hx = x1 + w1; const hy = ty - 44;
        glow(ctx, COLORS.yellow, 20); ctx.strokeStyle = tint('yellow', 1 - q); ctx.lineWidth = 3; ctx.beginPath();
        for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; ctx.moveTo(hx + Math.cos(a) * 10, hy + Math.sin(a) * 10); ctx.lineTo(hx + Math.cos(a) * (18 + 30 * q), hy + Math.sin(a) * (18 + 30 * q)); }
        ctx.stroke(); ctx.shadowBlur = 0;
      }
      const va = hit ? v1 : u1; const vb = hit ? v2 : u2;
      for (const [x, w, v] of [[x1, w1, va], [x2, w2, vb]]) {
        const mxp = x + w / 2;
        if (Math.abs(v) > 0.05) arr(ctx, mxp, ty - 96, mxp + v * 25, ty - 96, 'cyan', 4);
        label(ctx, Math.abs(v) > 0.05 ? `${fx(v)} m/s` : 'at rest', mxp, ty - 124, { size: 19, weight: 700, fill: 'cyan' });
      }
      const pw = (FIG.w - 80) / 2;
      for (const [x, head, p, KE, on] of [[X0 + 30, 'Before', p0, KE0, 1], [X0 + 50 + pw, 'After', p1, KE1, hit ? after(tau - tc, 0, 0.4) : 0.25]]) {
        ctx.save(); ctx.globalAlpha *= on;
        ctx.fillStyle = 'rgba(255,255,255,0.035)'; ctx.strokeStyle = 'rgba(140,170,255,0.22)'; ctx.lineWidth = 1.5;
        rounded(ctx, x, Y0 + 380, pw, 170, 18); ctx.fill(); ctx.stroke();
        label(ctx, `${head}: p = ${fx(p)} kg m/s`, x + pw / 2, Y0 + 435, { size: 21, weight: 700, fill: 'yellow' });
        label(ctx, `KE = ${fx(KE)} J`, x + pw / 2, Y0 + 495, { size: 21, weight: 700, fill: 'green' });
        ctx.restore();
      }
      wrapLabel(ctx, elastic ? 'Elastic: kinetic energy is kept as well as momentum' : 'Inelastic: they stick together; some kinetic energy becomes heat and sound', X0 + 40, Y0 + 625, FIG.w - 80, 20, 'center', 'muted', 500);
      ctx.restore();
    },

    // A ball whirled in a circle: velocity along the tangent, force towards the centre.
    'circular-motion'(b, ctx, it, t) {
      const r = Math.max(0.1, val(it.radius, 1.5)); const v = Math.max(0.1, val(it.speed, 4)); const m = Math.max(0.01, val(it.mass, 0.5));
      const F = (m * v * v) / r; const a = (v * v) / r; const w = clamp(v / r, 0.4, 4);
      const ox = cx; const oy = Y0 + 330; const R = 210;
      const ph = b.clock * w;
      const bx = ox + R * Math.cos(ph); const by = oy - R * Math.sin(ph);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Circular motion');
      ctx.strokeStyle = 'rgba(200,215,255,0.3)'; ctx.lineWidth = 2; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.arc(ox, oy, R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      dot(ctx, ox, oy, 6, 'ink');
      for (let k = 1; k <= 3; k++) {
        const p = ph - (k * Math.PI) / 2; const gx = ox + R * Math.cos(p); const gy = oy - R * Math.sin(p);
        ctx.save(); ctx.globalAlpha *= 0.25; dot(ctx, gx, gy, 10, 'orange'); arr(ctx, gx, gy, gx - Math.sin(p) * 80, gy - Math.cos(p) * 80, 'cyan', 3); ctx.restore();
      }
      line(ctx, ox, oy, bx, by, 'rgba(233,238,255,0.6)', 2);
      const tvx = -Math.sin(ph); const tvy = -Math.cos(ph);
      glow(ctx, COLORS.cyan, 12); arr(ctx, bx, by, bx + tvx * 110, by + tvy * 110, 'cyan', 6); ctx.shadowBlur = 0;
      const ix = (ox - bx) / R; const iy = (oy - by) / R;
      arr(ctx, bx, by, bx + ix * 100, by + iy * 100, 'orange', 6);
      ball(ctx, bx, by, 13, 'orange', 14);
      label(ctx, 'v', bx + tvx * 132, by + tvy * 132, { size: 22, weight: 700, fill: 'cyan' });
      label(ctx, 'F', bx + ix * 100 + tvx * 22, by + iy * 100 + tvy * 22, { size: 22, weight: 700, fill: 'orange' });
      label(ctx, `Speed stays ${fx(v)} m/s, but the direction keeps changing`, cx, Y0 + 590, { size: 20, weight: 600, fill: 'cyan' });
      chip(ctx, `F = mv²/r = ${fx(m, 2)} × ${fx(v)}² ÷ ${fx(r)} = ${fx(F)} N, towards the centre`, cx, Y0 + 635, 'orange', 19);
      chip(ctx, `a = v²/r = ${fx(a)} m/s²`, cx, Y0 + 678, 'purple', 19);
      ctx.restore();
    },

    // A satellite on an ellipse: faster when close, and equal areas swept in equal times.
    orbit(b, ctx, it, t) {
      const e = clamp(val(it.e, 0.5), 0, 0.85);
      const a = Math.min(300, 250 / Math.sqrt(1 - e * e)); const bb = a * Math.sqrt(1 - e * e); const c = a * e;
      const ex = cx; const ey = Y0 + 340; const pxp = ex + c;
      const Tan = 8;
      const kepler = (M) => { let E = M; for (let i = 0; i < 6; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); return E; };
      const M = (TAU * mod(b.clock, Tan)) / Tan; const E = kepler(M);
      const sx = ex + a * Math.cos(E); const sy = ey - bb * Math.sin(E);
      const A = 2.0e7; const GM = 3.986e14; const rr = A * (1 - e * Math.cos(E));
      const v = Math.sqrt(GM * (2 / rr - 1 / A)); const vp = Math.sqrt(GM * (2 / (A * (1 - e)) - 1 / A));
      const Th = (TAU * Math.sqrt((A * A * A) / GM)) / 3600;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'A satellite in orbit');
      ctx.strokeStyle = 'rgba(200,215,255,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(ex, ey, a, bb, 0, 0, TAU); ctx.stroke();
      // Area swept in the last tenth of an orbit.
      ctx.fillStyle = tint('purple', 0.28); ctx.beginPath(); ctx.moveTo(pxp, ey);
      for (let j = 0; j <= 12; j++) { const Ej = kepler(M - TAU / 10 + (TAU / 10) * (j / 12)); ctx.lineTo(ex + a * Math.cos(Ej), ey - bb * Math.sin(Ej)); }
      ctx.closePath(); ctx.fill();
      const pg = ctx.createRadialGradient(pxp - 14, ey - 14, 4, pxp, ey, 46);
      pg.addColorStop(0, '#9fe8ff'); pg.addColorStop(1, '#2b6fd6');
      glow(ctx, COLORS.blue, 24); ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(pxp, ey, 44, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
      label(ctx, 'Earth', pxp, ey, { size: 18, weight: 700, fill: '#04122e' });
      const dx = -a * Math.sin(E); const dy = -bb * Math.cos(E); const dl = Math.hypot(dx, dy) || 1;
      const vl = 40 + (90 * v) / vp;
      arr(ctx, sx, sy, sx + (dx / dl) * vl, sy + (dy / dl) * vl, 'cyan', 5);
      const gx = pxp - sx; const gy = ey - sy; const gl = Math.hypot(gx, gy) || 1;
      const fl = clamp(100 * ((A * (1 - e)) / rr) ** 2, 18, 100);
      arr(ctx, sx, sy, sx + (gx / gl) * fl, sy + (gy / gl) * fl, 'orange', 5);
      ctx.fillStyle = COLORS.ink; ctx.fillRect(sx - 6, sy - 6, 12, 12);
      ctx.fillStyle = tint('blue', 0.9); ctx.fillRect(sx - 20, sy - 3, 12, 6); ctx.fillRect(sx + 8, sy - 3, 12, 6);
      label(ctx, 'v', sx + (dx / dl) * (vl + 18), sy + (dy / dl) * (vl + 18), { size: 20, weight: 700, fill: 'cyan' });
      chip(ctx, `v = ${fx(v / 1000)} km/s`, X0 + 130, Y0 + 90, 'cyan');
      chip(ctx, `one orbit = ${fx(Th)} h`, X1 - 130, Y0 + 90, 'ink');
      label(ctx, 'Closer to Earth: stronger pull (orange), faster', cx, Y0 + 640, { size: 20, weight: 600, fill: 'ink' });
      label(ctx, 'Kepler: equal areas are swept in equal times', cx, Y0 + 680, { size: 20, weight: 600, fill: 'purple' });
      ctx.restore();
    },

    // A rope and a spring carrying the same wave: up-and-down versus squash-and-stretch.
    'wave-types'(b, ctx, it, t) {
      const x0 = X0 + 60; const x1 = X1 - 60; const lam = 260; const kk = TAU / lam; const ph = b.clock * 2.4;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Two kinds of wave');
      // Transverse: a rope.
      const ty = Y0 + 220; const A = 60;
      label(ctx, 'Transverse: vibrations at right angles to the travel', cx, Y0 + 100, { size: 21, weight: 700, fill: 'cyan' });
      ctx.strokeStyle = 'rgba(34,211,238,0.45)'; ctx.lineWidth = 3; ctx.beginPath();
      for (let x = x0; x <= x1; x += 6) { const y = ty - A * Math.sin(kk * (x - x0) - ph); if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
      ctx.fillStyle = COLORS.cyan;
      for (let i = 0; i < 32; i++) { if (i === 12) continue; const x = x0 + (i * (x1 - x0)) / 31; ctx.beginPath(); ctx.arc(x, ty - A * Math.sin(kk * (x - x0) - ph), 6, 0, TAU); ctx.fill(); }
      const hx = x0 + (12 * (x1 - x0)) / 31; const hy = ty - A * Math.sin(kk * (hx - x0) - ph);
      dot(ctx, hx, hy, 9, 'red', 14);
      arr(ctx, hx + 20, ty, hx + 20, ty - A - 6, 'red', 2.5); arr(ctx, hx + 20, ty, hx + 20, ty + A + 6, 'red', 2.5);
      arr(ctx, x1 - 150, ty + A + 40, x1 - 10, ty + A + 40, 'ink', 3);
      label(ctx, 'direction of travel', x1 - 162, ty + A + 40, { size: 18, weight: 600, fill: 'muted', align: 'right' });
      // Longitudinal: a spring.
      const ly = Y0 + 500; const Al = 16; const N = 44;
      label(ctx, 'Longitudinal: vibrations along the direction of travel', cx, Y0 + 385, { size: 21, weight: 700, fill: 'purple' });
      line(ctx, x0, ly, x1, ly, 'rgba(167,139,250,0.25)', 2);
      ctx.strokeStyle = tint('purple', 0.85); ctx.lineWidth = 3; ctx.beginPath();
      let rx = 0;
      for (let i = 0; i < N; i++) { const e = x0 + (i * (x1 - x0)) / (N - 1); const x = e + Al * Math.sin(kk * (e - x0) - ph); if (i === 20) { rx = x; continue; } ctx.moveTo(x, ly - 40); ctx.lineTo(x, ly + 40); }
      ctx.stroke();
      line(ctx, rx, ly - 46, rx, ly + 46, 'red', 5);
      const xc = cx - lam / 2 + mod(x0 + (Math.PI + ph) / kk - (cx - lam / 2), lam);
      const xr = xc + lam / 2 <= x1 - 60 ? xc + lam / 2 : xc - lam / 2;
      label(ctx, 'compression', xc, ly - 64, { size: 19, weight: 700, fill: 'ink' });
      label(ctx, 'rarefaction', xr, ly + 66, { size: 19, weight: 700, fill: 'muted' });
      arr(ctx, x1 - 150, ly + 120, x1 - 10, ly + 120, 'ink', 3);
      ctx.restore();
    },

    // A ray into a glass block: it slows and bends towards the normal; sin i / sin r = n.
    refraction(b, ctx, it, t) {
      const n = clamp(val(it.n, 1.5), 1.01, 3);
      const deg = it.angle !== undefined ? clamp(val(it.angle, 40), 0, 85) : 40 + 15 * Math.sin(b.clock * 0.5);
      const i = deg * DEG; const r = Math.asin(Math.sin(i) / n);
      const BT = Y0 + 250; const BB = Y0 + 450; const Px = cx - 80; const Py = BT;
      const L1 = 180; const Sx = Px - Math.sin(i) * L1; const Sy = Py - Math.cos(i) * L1;
      const Qx = Px + (BB - BT) * Math.tan(r); const Qy = BB;
      const L3 = 120; const Ex = Qx + Math.sin(i) * L3; const Ey = Qy + Math.cos(i) * L3;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Refraction in a glass block');
      ctx.fillStyle = tint('blue', 0.16); ctx.strokeStyle = tint('blue', 0.7); ctx.lineWidth = 2.5;
      rounded(ctx, X0 + 60, BT, FIG.w - 120, BB - BT, 6); ctx.fill(); ctx.stroke();
      label(ctx, 'air', X1 - 80, BT - 28, { size: 19, weight: 600, fill: 'muted', align: 'right' });
      label(ctx, `glass (n = ${fx(n, 2)})`, X1 - 80, BB - 26, { size: 19, weight: 600, fill: 'muted', align: 'right' });
      line(ctx, Px, BT - 130, Px, BT + 120, 'rgba(200,215,255,0.5)', 2, [7, 7]);
      line(ctx, Qx, BB - 100, Qx, BB + 100, 'rgba(200,215,255,0.35)', 2, [7, 7]);
      ctx.strokeStyle = 'rgba(200,215,255,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(Px, Py, 60, -Math.PI / 2 - i, -Math.PI / 2); ctx.stroke();
      ctx.strokeStyle = COLORS.purple; ctx.beginPath(); ctx.arc(Px, Py, 60, Math.PI / 2 - r, Math.PI / 2); ctx.stroke();
      const q = easeOut(clamp(t / 0.8));
      glow(ctx, COLORS.yellow, 14); ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 4; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(Sx, Sy); ctx.lineTo(Px, Py); if (q > 0.5) { ctx.lineTo(Qx, Qy); ctx.lineTo(Qx + (Ex - Qx) * clamp((q - 0.5) * 2), Qy + (Ey - Qy) * clamp((q - 0.5) * 2)); } ctx.stroke(); ctx.shadowBlur = 0;
      arr(ctx, (Sx + Px) / 2 - Math.sin(i) * 12, (Sy + Py) / 2 - Math.cos(i) * 12, (Sx + Px) / 2 + Math.sin(i) * 12, (Sy + Py) / 2 + Math.cos(i) * 12, 'yellow', 3);
      // A pulse of light: slower inside the glass.
      const v = 260; const t1 = L1 / v; const t2 = (Math.hypot(Qx - Px, Qy - Py) * n) / v; const t3 = L3 / v;
      const ph = mod(b.clock, t1 + t2 + t3 + 0.3);
      let lx = Ex; let ly = Ey;
      if (ph < t1) { lx = Sx + (Px - Sx) * (ph / t1); ly = Sy + (Py - Sy) * (ph / t1); } else if (ph < t1 + t2) { const k = (ph - t1) / t2; lx = Px + (Qx - Px) * k; ly = Py + (Qy - Py) * k; } else if (ph < t1 + t2 + t3) { const k = (ph - t1 - t2) / t3; lx = Qx + (Ex - Qx) * k; ly = Qy + (Ey - Qy) * k; }
      if (ph < t1 + t2 + t3) dot(ctx, lx, ly, 7, '#fff7d6', 16);
      label(ctx, `i = ${fx(deg, 0)}°`, Px + 16, Py - 72, { size: 20, weight: 700, fill: 'ink', align: 'left' });
      label(ctx, `r = ${fx(r / DEG, 0)}°`, Px - 16, Py + 84, { size: 20, weight: 700, fill: 'purple', align: 'right' });
      chip(ctx, `sin i ÷ sin r = ${Math.sin(i).toFixed(3)} ÷ ${Math.sin(r).toFixed(3)} = ${fx(n, 2)}`, cx, Y0 + 620, 'ink', 20);
      label(ctx, 'Light slows down in glass, so it bends towards the normal', cx, Y0 + 672, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Light inside a semicircular block: past the critical angle, none escapes.
    tir(b, ctx, it, t) {
      const n = clamp(val(it.n, 1.5), 1.05, 3); const crit = Math.asin(1 / n);
      const deg = it.angle !== undefined ? clamp(val(it.angle, 30), 0, 89) : 40 - 26 * Math.cos(b.clock * 0.45);
      const i = deg * DEG; const Ox = cx; const Oy = Y0 + 300; const R = 260;
      let Rf = 1; let r = 0;
      if (i < crit) {
        const ct = Math.sqrt(1 - (n * Math.sin(i)) ** 2); const ci = Math.cos(i);
        const rs = (n * ci - ct) / (n * ci + ct); const rp = (ci - n * ct) / (ci + n * ct);
        Rf = (rs * rs + rp * rp) / 2; r = Math.asin(n * Math.sin(i));
      }
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Total internal reflection');
      ctx.fillStyle = tint('blue', 0.16); ctx.strokeStyle = tint('blue', 0.7); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(Ox, Oy, R, 0, Math.PI); ctx.closePath(); ctx.fill(); ctx.stroke();
      label(ctx, 'air', X0 + 60, Oy - 30, { size: 19, weight: 600, fill: 'muted', align: 'left' });
      label(ctx, 'glass', Ox - 220, Oy + 30, { size: 19, weight: 600, fill: 'muted', align: 'left' });
      line(ctx, Ox, Oy - 190, Ox, Oy + 200, 'rgba(200,215,255,0.5)', 2, [7, 7]);
      ctx.strokeStyle = 'rgba(200,215,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(Ox, Oy, 56, Math.PI / 2, Math.PI / 2 + i); ctx.stroke();
      const sn = Math.sin(i); const cs = Math.cos(i); const Lr = R + 50;
      glow(ctx, COLORS.yellow, 14); line(ctx, Ox - Lr * sn, Oy + Lr * cs, Ox, Oy, 'yellow', 4); ctx.shadowBlur = 0;
      arr(ctx, Ox - (Lr * 0.55 + 12) * sn, Oy + (Lr * 0.55 + 12) * cs, Ox - (Lr * 0.55 - 12) * sn, Oy + (Lr * 0.55 - 12) * cs, 'yellow', 3);
      if (Rf >= 1) glow(ctx, COLORS.yellow, 14);
      line(ctx, Ox, Oy, Ox + Lr * sn, Oy + Lr * cs, `rgba(251,191,36,${(0.15 + 0.85 * Rf).toFixed(3)})`, 2 + 2.5 * Rf);
      ctx.shadowBlur = 0;
      if (i < crit) {
        const ex = Ox + 200 * Math.sin(r); const ey = Oy - 200 * Math.cos(r);
        line(ctx, Ox, Oy, ex, ey, `rgba(251,191,36,${(1 - Rf).toFixed(3)})`, 4);
        label(ctx, `r = ${fx(r / DEG, 0)}°`, ex + 14, ey, { size: 19, weight: 700, fill: 'yellow', align: 'left' });
      }
      chip(ctx, `angle of incidence i = ${fx(deg, 0)}°`, X0 + 170, Y0 + 80, 'ink', 19);
      chip(ctx, `critical angle c = ${fx(crit / DEG)}°`, X1 - 160, Y0 + 80, 'orange', 19);
      const near = Math.abs(i - crit) < 0.5 * DEG;
      const msg = near ? 'At the critical angle: the ray skims along the surface' : i < crit ? 'Below c: some light reflects, most refracts out' : 'Above c: total internal reflection, all light stays inside';
      chip(ctx, msg, cx, Y0 + 640, i > crit && !near ? 'green' : 'ink', 20);
      label(ctx, `sin c = 1 / n, so c = ${fx(crit / DEG)}° for n = ${fx(n, 2)}`, cx, Y0 + 686, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // A string fixed at both ends vibrating in a harmonic: nodes never move, antinodes swing most.
    'standing-wave'(b, ctx, it, t) {
      const n = it.harmonic !== undefined ? clamp(Math.round(val(it.harmonic, 3)), 1, 6) : 1 + (Math.floor(b.clock / 4) % 4);
      const x0 = X0 + 80; const x1 = X1 - 80; const Lp = x1 - x0; const sy = Y0 + 290; const A = 100;
      const c = Math.cos(b.clock * (2 * n + 1));
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || `Standing wave: harmonic ${n}`);
      ctx.fillStyle = tint('purple', 0.35); ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 2; rounded(ctx, x0 - 50, sy - 26, 40, 52, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(220,230,255,0.3)'; ctx.fillRect(x1 + 6, sy - 60, 14, 120);
      ctx.save(); ctx.globalAlpha *= 0.35; ctx.setLineDash([5, 7]);
      trace(ctx, 100, (q) => x0 + q * Lp, (q) => sy - A * Math.sin(n * Math.PI * q), 'cyan', 2);
      trace(ctx, 100, (q) => x0 + q * Lp, (q) => sy + A * Math.sin(n * Math.PI * q), 'cyan', 2);
      ctx.setLineDash([]); ctx.restore();
      glow(ctx, COLORS.cyan, 14);
      trace(ctx, 120, (q) => x0 + q * Lp, (q) => sy - A * c * Math.sin(n * Math.PI * q), 'cyan', 4);
      ctx.shadowBlur = 0;
      for (let j = 0; j <= n; j++) { const x = x0 + (j * Lp) / n; dot(ctx, x, sy, 7, 'orange'); label(ctx, 'N', x, sy + 30, { size: 18, weight: 700, fill: 'orange' }); }
      for (let j = 0; j < n; j++) label(ctx, 'A', x0 + ((j + 0.5) * Lp) / n, sy - A - 24, { size: 18, weight: 700, fill: 'green' });
      label(ctx, `λ = 2L ÷ ${n}      f = ${n} × f₁`, cx, Y0 + 480, { size: 28, weight: 700, fill: 'ink' });
      label(ctx, `${n + 1} nodes, ${n} antinode${n > 1 ? 's' : ''}${n === 1 ? ' (the fundamental)' : ''}`, cx, Y0 + 540, { size: 22, weight: 600, fill: 'cyan' });
      label(ctx, 'N = node: never moves.   A = antinode: biggest movement', cx, Y0 + 640, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Two sources sending out ripples: where crests meet crests it is bright, crest on trough is dark.
    interference(b, ctx, it, t) {
      const g = it._intf || (it._intf = (() => {
        const sx = X0 + 90; const d = 110; const lam = 36; const scr = X1 - 60; const c = d / 2; const lines = [];
        const hyper = (D) => {
          const a = Math.abs(D) / 2; const b2 = c * c - a * a; const pts = new Float32Array(82);
          for (let k = 0; k <= 40; k++) { const x = sx + ((scr - sx) * k) / 40; pts[2 * k] = x; pts[2 * k + 1] = cy + Math.sign(D) * (a ? a * Math.sqrt(1 + (x - sx) ** 2 / b2) : 0); }
          return pts;
        };
        for (let m = -2; m <= 2; m++) lines.push({ bright: true, pts: hyper(m * lam) });
        for (const m of [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5]) lines.push({ bright: false, pts: hyper(m * lam) });
        return { sx, c, lam, scr, lines };
      })());
      const s1y = cy - g.c; const s2y = cy + g.c;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Interference from two sources');
      ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0 + 56, g.scr - X0 - 4, 560); ctx.clip();
      const ph = mod(b.clock * 40, g.lam); ctx.lineWidth = 2;
      for (const sy of [s1y, s2y]) for (let r = ph; r < 760; r += g.lam) { ctx.strokeStyle = `rgba(34,211,238,${(0.55 * (1 - r / 760)).toFixed(3)})`; ctx.beginPath(); ctx.arc(g.sx, sy, r, 0, TAU); ctx.stroke(); }
      for (const bright of [true, false]) {
        ctx.strokeStyle = bright ? 'rgba(255,240,180,0.6)' : 'rgba(251,113,133,0.4)'; ctx.lineWidth = bright ? 2.5 : 2; ctx.setLineDash(bright ? [10, 8] : [3, 9]);
        ctx.beginPath();
        for (const ln of g.lines) { if (ln.bright !== bright) continue; for (let k = 0; k <= 40; k++) { if (k) ctx.lineTo(ln.pts[2 * k], ln.pts[2 * k + 1]); else ctx.moveTo(ln.pts[0], ln.pts[1]); } }
        ctx.stroke();
      }
      ctx.setLineDash([]); ctx.restore();
      // The screen: bright and dark fringes.
      const L = g.scr - g.sx;
      for (let y = Y0 + 60; y < Y0 + 610; y += 5) {
        const D = Math.hypot(L, y + 2.5 - s1y) - Math.hypot(L, y + 2.5 - s2y); const I = Math.cos((Math.PI * D) / g.lam) ** 2;
        ctx.fillStyle = `rgba(255,240,180,${(0.08 + 0.9 * I).toFixed(3)})`; ctx.fillRect(g.scr, y, 22, 5);
      }
      label(ctx, 'screen', g.scr + 11, Y0 + 630, { size: 17, weight: 600, fill: 'muted' });
      dot(ctx, g.sx, s1y, 8, 'cyan', 16); dot(ctx, g.sx, s2y, 8, 'cyan', 16);
      label(ctx, 'S₁', g.sx - 18, s1y, { size: 19, weight: 700, fill: 'cyan', align: 'right' });
      label(ctx, 'S₂', g.sx - 18, s2y, { size: 19, weight: 700, fill: 'cyan', align: 'right' });
      label(ctx, 'Bright: path difference = nλ (crest meets crest)', X0 + 30, Y0 + 655, { size: 19, weight: 600, fill: '#fff0b4', align: 'left' });
      label(ctx, 'Dark: path difference = (n + ½)λ (crest meets trough)', X0 + 30, Y0 + 688, { size: 19, weight: 600, fill: 'red', align: 'left' });
      ctx.restore();
    },

    // A moving siren: wavefronts bunch up ahead (higher pitch) and spread out behind (lower pitch).
    doppler(b, ctx, it, t) {
      const f = Math.max(1, val(it.frequency, 400)); const ratio = clamp(val(it.ratio, 0.3), 0.05, 0.8);
      const vw = 150; const Te = 0.42; const vs = ratio * vw;
      const xStart = X0 + 130; const run = 520; const P = run / vs;
      const clock = b.clock; const cStart = clock - mod(clock, P);
      const sy = Y0 + 330; const sxNow = xStart + vs * (clock - cStart);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The Doppler effect');
      ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0 + 120, FIG.w, 440); ctx.clip();
      ctx.lineWidth = 2.5;
      const last = cStart + Math.floor((clock - cStart) / Te) * Te;
      for (let te = last; te >= cStart - 1e-9; te -= Te) {
        const r = vw * (clock - te); if (r > 900) break;
        ctx.strokeStyle = `rgba(34,211,238,${(0.75 * (1 - r / 900)).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(xStart + vs * (te - cStart), sy, r, 0, TAU); ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = tint('red', 0.5); ctx.strokeStyle = COLORS.red; ctx.lineWidth = 2.5; rounded(ctx, sxNow - 30, sy - 16, 60, 32, 8); ctx.fill(); ctx.stroke();
      dot(ctx, sxNow, sy - 24, 7, Math.floor(clock * 4) % 2 ? 'blue' : 'red', 16);
      arr(ctx, sxNow + 38, sy, sxNow + 90, sy, 'cyan', 4);
      for (const [x, dir] of [[X0 + 36, 1], [X1 - 36, -1]]) {
        dot(ctx, x, sy - 40, 11, 'ink');
        ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, sy - 28); ctx.lineTo(x, sy + 20); ctx.moveTo(x, sy + 20); ctx.lineTo(x - 10, sy + 50); ctx.moveTo(x, sy + 20); ctx.lineTo(x + 10, sy + 50); ctx.moveTo(x, sy - 14); ctx.lineTo(x + dir * 14, sy); ctx.stroke();
      }
      label(ctx, 'behind: waves spread out, lower pitch', X0 + 20, Y0 + 95, { size: 18, weight: 700, fill: 'blue', align: 'left' });
      label(ctx, 'ahead: waves bunched up, higher pitch', X1 - 20, Y0 + 595, { size: 18, weight: 700, fill: 'orange', align: 'right' });
      chip(ctx, `${fx(f, 0)} Hz siren heard as ${fx(f / (1 - ratio), 0)} Hz ahead, ${fx(f / (1 + ratio), 0)} Hz behind`, cx, Y0 + 640, 'ink', 19);
      label(ctx, `Source moving at ${fx(ratio * 100, 0)}% of the wave speed: f′ = f × v ÷ (v ∓ vₛ)`, cx, Y0 + 686, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // The electromagnetic spectrum: one family of waves, wavelength shrinking left to right.
    'em-spectrum'(b, ctx, it, t) {
      const BANDS = [
        ['radio', 'Radio waves', 'λ ≈ 1 m to over 1 km', 'radio and TV broadcasts', 'blue'],
        ['microwave', 'Microwaves', 'λ ≈ 1 mm to 1 m', 'mobile phones, satellites, cooking', 'teal'],
        ['infrared', 'Infrared', 'λ ≈ 700 nm to 1 mm', 'remote controls, thermal cameras', 'red'],
        ['visible', 'Visible light', 'λ ≈ 400 to 700 nm', 'seeing, photography, optical fibres', 'yellow'],
        ['UV', 'Ultraviolet', 'λ ≈ 10 to 400 nm', 'security marks, sun tanning', 'purple'],
        ['X-ray', 'X-rays', 'λ ≈ 0.01 to 10 nm', 'medical images of bones', 'cyan'],
        ['gamma', 'Gamma rays', 'λ below 0.01 nm', 'killing cancer cells, sterilising', 'green'],
      ];
      const bx0 = X0 + 40; const bw = FIG.w - 80; const cw = bw / 7; const by = Y0 + 290; const bh = 70; const slot = 3;
      let idx; let px;
      if (it.band) { const q = String(it.band).toLowerCase(); idx = Math.max(0, BANDS.findIndex((B) => B[1].toLowerCase().startsWith(q.slice(0, 4)) || B[0].toLowerCase() === q)); px = bx0 + cw * (idx + 0.5); } else {
        idx = Math.floor(b.clock / slot) % 7; const prev = (idx + 6) % 7; const p = smooth(mod(b.clock, slot) / 0.6);
        px = bx0 + cw * (prev + 0.5) + cw * (idx - prev) * p;
      }
      ctx.save(); fade(ctx, t);
      // The wave: long wavelength on the left, tiny on the right.
      const lam0 = 150; const rr = 5 / 150; const lr = Math.log(rr);
      glow(ctx, 'rgba(233,238,255,0.6)', 8); ctx.strokeStyle = 'rgba(233,238,255,0.85)'; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let x = 0; x <= bw; x += 2) { const u = x / bw; const phi = ((TAU * bw) / lam0) * ((1 - rr ** -u) / lr); const y = Y0 + 170 - 45 * Math.sin(phi - b.clock * 4); if (x) ctx.lineTo(bx0 + x, y); else ctx.moveTo(bx0, y); }
      ctx.stroke(); ctx.shadowBlur = 0;
      BANDS.forEach((B, k) => {
        const x = bx0 + k * cw;
        if (k === 3) { const gr = ctx.createLinearGradient(x, 0, x + cw, 0); [700, 620, 580, 530, 480, 420].forEach((nm, j) => gr.addColorStop(j / 5, waveRGB(nm, 0.75))); ctx.fillStyle = gr; } else ctx.fillStyle = tint(B[4], k === idx ? 0.45 : 0.22);
        ctx.fillRect(x, by, cw, bh);
        label(ctx, B[0], x + cw / 2, by + bh / 2, { size: 16, weight: 700, fill: k === 3 ? '#0a1024' : 'ink' });
      });
      ctx.strokeStyle = 'rgba(200,215,255,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(bx0, by, bw, bh);
      ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 3; ctx.strokeRect(bx0 + idx * cw, by, cw, bh);
      arr(ctx, bx0, by + bh + 30, bx0 + bw, by + bh + 30, 'muted', 2.5);
      label(ctx, 'shorter wavelength, higher frequency and energy', cx, by + bh + 56, { size: 18, weight: 600, fill: 'muted' });
      glow(ctx, COLORS.ink, 12); ctx.fillStyle = COLORS.ink; ctx.beginPath(); ctx.moveTo(px, by - 6); ctx.lineTo(px - 12, by - 28); ctx.lineTo(px + 12, by - 28); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
      const B = BANDS[idx];
      ctx.fillStyle = 'rgba(255,255,255,0.035)'; ctx.strokeStyle = tint(B[4], 0.6); ctx.lineWidth = 1.5; rounded(ctx, X0 + 100, Y0 + 470, FIG.w - 200, 190, 18); ctx.fill(); ctx.stroke();
      label(ctx, B[1], cx, Y0 + 515, { size: 30, weight: 700, fill: B[4] });
      label(ctx, B[2], cx, Y0 + 568, { size: 22, weight: 600, fill: 'ink' });
      wrapLabel(ctx, `Used for: ${B[3]}`, X0 + 120, Y0 + 618, FIG.w - 240, 21, 'center', 'muted', 500);
      ctx.restore();
    },

    // A convex lens ray diagram: three rays from the object top meet at the image.
    lens(b, ctx, it, t) {
      const f = clamp(val(it.f, 10), 2, 50);
      let u = it.u !== undefined ? clamp(val(it.u, 30), 1, 200) : f * (2.5 + 1.2 * Math.sin(b.clock * 0.35));
      if (Math.abs(u - f) < 0.04 * f) u = f + 0.04 * f * (u >= f ? 1 : -1);
      const v = (u * f) / (u - f); const mag = Math.abs(v) / u;
      const s = 330 / Math.max(4 * f, u * 1.05);
      const A = Y0 + 320; const Lx = cx; const ho = 90;
      const xo = Lx - u * s; const yo = A - ho; const xI = Lx + v * s; const yI = A + (v / u) * ho; const xF = Lx - f * s;
      const xe = X1 - 20;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Convex lens ray diagram');
      label(ctx, '1/f = 1/u + 1/v', X0 + 30, Y0 + 80, { size: 19, weight: 600, fill: 'muted', align: 'left' });
      ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0 + 50, FIG.w, 560); ctx.clip();
      line(ctx, X0 + 20, A, X1 - 20, A, 'rgba(200,215,255,0.4)', 2, [8, 8]);
      ctx.fillStyle = tint('cyan', 0.18); ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(Lx, A, 16, 190, 0, 0, TAU); ctx.fill(); ctx.stroke();
      for (const x of [Lx - f * s, Lx + f * s]) { dot(ctx, x, A, 6, 'ink'); label(ctx, 'F', x, A + 24, { size: 18, weight: 700, fill: 'ink' }); }
      arr(ctx, xo, A, xo, yo, 'orange', 6);
      const y3 = A + ((yo - A) * (Lx - xF)) / (xo - xF);
      const d1x = f * s; const d1y = A - yo; const d2x = Lx - xo; const d2y = A - yo;
      const rays = [
        [xo, yo, Lx, yo, xe, yo + (d1y * (xe - Lx)) / d1x],
        [xo, yo, Lx, A, xe, A + (d2y * (xe - Lx)) / d2x],
        [xo, yo, Lx, y3, xe, y3],
      ];
      rays.forEach((r, k) => {
        const q = after(t, 0.3 + 0.4 * k, 0.5);
        if (q <= 0) return;
        ctx.save(); ctx.globalAlpha *= q;
        ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 3; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(r[0], r[1]); ctx.lineTo(r[2], r[3]); ctx.lineTo(r[4], r[5]); ctx.stroke();
        if (v < 0) line(ctx, r[2], r[3], xI, yI, 'rgba(251,191,36,0.45)', 2, [6, 6]);
        pulse(ctx, r, 160, b.clock + k * 0.7, '#fff7d6', 5);
        ctx.restore();
      });
      const qi = after(t, 1.6, 0.5);
      if (qi > 0) { ctx.save(); ctx.globalAlpha *= qi; glow(ctx, COLORS.purple, 14); if (v < 0) ctx.setLineDash([8, 6]); arr(ctx, xI, A, xI, yI, 'purple', 6); ctx.setLineDash([]); ctx.shadowBlur = 0; ctx.restore(); }
      ctx.restore();
      chip(ctx, `u = ${fx(u)} cm    f = ${fx(f)} cm    v = ${fx(v)} cm`, cx, Y0 + 635, 'ink', 20);
      const desc = v > 0 ? `Real image: inverted, ${mag > 1.02 ? 'magnified' : mag < 0.98 ? 'smaller' : 'same size'} (× ${fx(mag, 2)})` : `Virtual image: upright, magnified (× ${fx(mag, 2)}), a magnifying glass`;
      label(ctx, desc, cx, Y0 + 682, { size: 20, weight: 700, fill: 'purple' });
      ctx.restore();
    },

    // A ray reflecting off a plane mirror: angle in equals angle out; the image sits behind the glass.
    mirror(b, ctx, it, t) {
      const deg = it.angle !== undefined ? clamp(val(it.angle, 40), 0, 85) : 40 + 18 * Math.sin(b.clock * 0.5);
      const i = deg * DEG; const M = Y0 + 400; const Px = cx; const L = 200;
      const Sx = Px - L * Math.sin(i); const Sy = M - L * Math.cos(i); const Ex = Px + L * Math.sin(i); const Iy = M + L * Math.cos(i);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Reflection in a plane mirror');
      line(ctx, X0 + 80, M, X1 - 80, M, 'rgba(233,238,255,0.9)', 5);
      ctx.strokeStyle = 'rgba(140,170,255,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let x = X0 + 90; x < X1 - 80; x += 16) { ctx.moveTo(x, M + 3); ctx.lineTo(x - 10, M + 15); }
      ctx.stroke();
      line(ctx, Px, M - 240, Px, M, 'rgba(200,215,255,0.5)', 2, [7, 7]);
      label(ctx, 'normal', Px, M - 256, { size: 17, weight: 600, fill: 'muted' });
      // Behind the mirror: where the image seems to be.
      line(ctx, Px, M, Sx, Iy, 'rgba(251,191,36,0.35)', 2, [6, 6]);
      line(ctx, Sx, Sy, Sx, Iy, 'rgba(200,215,255,0.2)', 1.5, [3, 6]);
      ctx.save(); ctx.globalAlpha *= 0.4; dot(ctx, Sx, Iy, 10, 'yellow'); ctx.restore();
      label(ctx, 'image', Sx - 18, Iy, { size: 17, weight: 600, fill: 'muted', align: 'right' });
      ctx.strokeStyle = 'rgba(200,215,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(Px, M, 64, -Math.PI / 2 - i, -Math.PI / 2); ctx.stroke();
      ctx.strokeStyle = COLORS.cyan; ctx.beginPath(); ctx.arc(Px, M, 72, -Math.PI / 2, -Math.PI / 2 + i); ctx.stroke();
      label(ctx, 'i', Px - 92 * Math.sin(i / 2), M - 92 * Math.cos(i / 2), { size: 20, weight: 700, fill: 'ink' });
      label(ctx, 'r', Px + 98 * Math.sin(i / 2), M - 98 * Math.cos(i / 2), { size: 20, weight: 700, fill: 'cyan' });
      glow(ctx, COLORS.yellow, 14); ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 4; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(Sx, Sy); ctx.lineTo(Px, M); ctx.lineTo(Ex, Sy); ctx.stroke(); ctx.shadowBlur = 0;
      const sn = Math.sin(i); const cs = Math.cos(i);
      arr(ctx, (Sx + Px) / 2 - sn * 12, (Sy + M) / 2 - cs * 12, (Sx + Px) / 2 + sn * 12, (Sy + M) / 2 + cs * 12, 'yellow', 3);
      arr(ctx, (Ex + Px) / 2 - sn * 12, (Sy + M) / 2 + cs * 12, (Ex + Px) / 2 + sn * 12, (Sy + M) / 2 - cs * 12, 'yellow', 3);
      pulse(ctx, [Sx, Sy, Px, M, Ex, Sy], 180, b.clock, '#fff7d6', 6);
      dot(ctx, Sx, Sy, 11, 'yellow', 18);
      ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(Ex + 14, Sy - 8, 18, 10, -0.5, 0, TAU); ctx.stroke();
      dot(ctx, Ex + 10, Sy - 6, 5, 'ink');
      chip(ctx, `angle of incidence i = ${fx(deg, 0)}°`, X0 + 175, Y0 + 90, 'ink', 19);
      chip(ctx, `angle of reflection r = ${fx(deg, 0)}°`, X1 - 175, Y0 + 90, 'cyan', 19);
      label(ctx, 'Angle of incidence = angle of reflection', cx, Y0 + 640, { size: 22, weight: 700, fill: 'ink' });
      label(ctx, 'The image is as far behind the mirror as the object is in front', cx, Y0 + 680, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // The same cell and two bulbs, wired in series and in parallel: current dots and brightness.
    'series-parallel'(b, ctx, it, t) {
      const V = Math.max(0.5, val(it.voltage, 6)); const R = Math.max(0.5, val(it.r, 6));
      const Is = V / (2 * R); const Ip = V / R; const Ps = Is * Is * R; const Pp = (V * V) / R;
      const g = it._sp || (it._sp = (() => {
        const mk = (pts) => { let tot = 0; for (let i = 2; i < pts.length; i += 2) tot += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]); return { pts, tot }; };
        const L = X0 + 70; const Rr = X0 + 330; const T = Y0 + 170; const B = Y0 + 450; const L2 = X0 + 470; const M2 = X0 + 610; const R2 = X0 + 750;
        return { L, Rr, T, B, L2, M2, R2, series: mk([L, B, L, T, Rr, T, Rr, B, L, B]), pa: mk([L2, B, L2, T, M2, T, M2, B, L2, B]), pb: mk([L2, B, L2, T, R2, T, R2, B, L2, B]) };
      })());
      const at = (path, d, out) => {
        const p = path.pts; d = mod(d, path.tot);
        for (let i = 2; i < p.length; i += 2) { const s = Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]); if (d <= s) { const q = d / s; out[0] = p[i - 2] + (p[i] - p[i - 2]) * q; out[1] = p[i - 1] + (p[i + 1] - p[i - 1]) * q; return; } d -= s; }
      };
      const mid = (g.T + g.B) / 2; const o = [0, 0];
      const cell = (x) => {
        ctx.fillStyle = DARK; ctx.fillRect(x - 24, mid - 16, 48, 32);
        ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 20, mid - 7); ctx.lineTo(x + 20, mid - 7); ctx.moveTo(x - 10, mid + 7); ctx.lineTo(x + 10, mid + 7); ctx.stroke();
        label(ctx, `${fx(V, V % 1 ? 1 : 0)} V`, x - 30, mid, { size: 18, weight: 700, fill: 'ink', align: 'right' });
      };
      const bulb = (x, y, P) => {
        const k = clamp(P / Pp);
        glow(ctx, COLORS.yellow, 8 + 34 * k);
        ctx.fillStyle = `rgba(251,191,36,${(0.12 + 0.8 * k).toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, 22, 0, TAU); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 22, 0, TAU); ctx.moveTo(x - 15, y - 15); ctx.lineTo(x + 15, y + 15); ctx.moveTo(x + 15, y - 15); ctx.lineTo(x - 15, y + 15); ctx.stroke();
      };
      ctx.save(); fade(ctx, t);
      ctx.strokeStyle = LINE; ctx.lineWidth = 4; ctx.lineJoin = 'round';
      ctx.strokeRect(g.L, g.T, g.Rr - g.L, g.B - g.T);
      ctx.strokeRect(g.L2, g.T, g.R2 - g.L2, g.B - g.T);
      ctx.beginPath(); ctx.moveTo(g.M2, g.T); ctx.lineTo(g.M2, g.B); ctx.stroke();
      cell(g.L); cell(g.L2);
      // Current: dots whose speed follows the current.
      ctx.fillStyle = COLORS.cyan;
      for (let k = 0; k < 16; k++) { at(g.series, b.clock * 60 * Is + (k * g.series.tot) / 16, o); ctx.beginPath(); ctx.arc(o[0], o[1], 4.5, 0, TAU); ctx.fill(); }
      for (const path of [g.pa, g.pb]) for (let k = 0; k < 12; k++) { at(path, b.clock * 60 * Ip + (k * path.tot) / 12 + (path === g.pb ? 17 : 0), o); ctx.beginPath(); ctx.arc(o[0], o[1], 4.5, 0, TAU); ctx.fill(); }
      bulb(g.L + (g.Rr - g.L) / 3, g.T, Ps); bulb(g.L + (2 * (g.Rr - g.L)) / 3, g.T, Ps);
      bulb(g.M2, mid, Pp); bulb(g.R2, mid, Pp);
      label(ctx, 'Series', (g.L + g.Rr) / 2, Y0 + 100, { size: 26, weight: 700, fill: 'ink' });
      label(ctx, 'Parallel', (g.L2 + g.R2) / 2, Y0 + 100, { size: 26, weight: 700, fill: 'ink' });
      label(ctx, `I = ${fx(Is, 2)} A everywhere`, (g.L + g.Rr) / 2, Y0 + 520, { size: 20, weight: 700, fill: 'cyan' });
      label(ctx, `each bulb gets ${fx(V / 2)} V: dimmer`, (g.L + g.Rr) / 2, Y0 + 565, { size: 19, weight: 600, fill: 'yellow' });
      label(ctx, `I = ${fx(2 * Ip, 2)} A total, ${fx(Ip, 2)} A per branch`, (g.L2 + g.R2) / 2 - 10, Y0 + 520, { size: 18, weight: 700, fill: 'cyan' });
      label(ctx, `each bulb gets ${fx(V)} V: brighter`, (g.L2 + g.R2) / 2, Y0 + 565, { size: 19, weight: 600, fill: 'yellow' });
      label(ctx, `Each bulb ${fx(R, R % 1 ? 1 : 0)} Ω: series adds resistance, parallel gives each bulb the full voltage`, cx, Y0 + 650, { size: 17, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Current against voltage for a resistor, a filament lamp and a diode, traced as the voltage sweeps.
    'iv-characteristics'(b, ctx, it, t) {
      const V = 6 * Math.sin(b.clock * 0.8);
      const comps = [
        ['Resistor', 'straight line: R stays the same (ohmic)', (v) => v / 10, 'cyan'],
        ['Filament lamp', 'curve: R rises as it heats up', (v) => Math.sign(v) * 0.6 * Math.sqrt(Math.abs(v) / 6), 'yellow'],
        ['Diode', 'current flows one way only, after about 0.6 V', (v) => (v <= 0.6 ? 0 : 0.6 * ((v - 0.6) / 0.6) ** 1.6), 'green'],
      ];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'I–V characteristics');
      comps.forEach(([name, note, I, c], k) => {
        const x = X0 + 25 + k * 262; const w = 230; const y = Y0 + 150; const h = 300;
        const px = (v) => x + w / 2 + (v / 6.5) * (w / 2); const py = (i) => y + h / 2 - (i / 0.7) * (h / 2);
        label(ctx, name, x + w / 2, Y0 + 100, { size: 22, weight: 700, fill: c });
        ctx.fillStyle = 'rgba(255,255,255,0.03)'; rounded(ctx, x, y, w, h, 14); ctx.fill();
        arr(ctx, x + 6, y + h / 2, x + w - 2, y + h / 2, 'rgba(200,215,255,0.6)', 2);
        arr(ctx, x + w / 2, y + h - 6, x + w / 2, y + 2, 'rgba(200,215,255,0.6)', 2);
        label(ctx, 'V', x + w - 8, y + h / 2 + 18, { size: 16, weight: 700, fill: 'muted' });
        label(ctx, 'I', x + w / 2 + 14, y + 12, { size: 16, weight: 700, fill: 'muted' });
        ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
        trace(ctx, 90, (q) => px(-6.5 + 13 * q), (q) => py(I(-6.5 + 13 * q)), c, 3.5);
        ctx.restore();
        const iv = I(V);
        dot(ctx, px(V), Math.max(y + 4, py(iv)), 7, c, k === 0 ? 14 : 0);
        label(ctx, `${fx(V)} V → ${iv > 0.7 ? 'over 0.7' : fx(iv, 2)} A`, x + w / 2, Y0 + 495, { size: 19, weight: 700, fill: 'ink' });
        wrapLabel(ctx, note, x, Y0 + 555, w, 17, 'center', 'muted', 500);
      });
      ctx.restore();
    },

    // Field lines between charges, traced from the field itself; dashes flow the way a + charge is pushed.
    'electric-field'(b, ctx, it, t) {
      const kind = String(it.kind || 'pair').toLowerCase();
      const g = it._ef || (it._ef = (() => {
        const cyy = Y0 + 340;
        if (kind.startsWith('plate')) return { plates: true, cyy };
        const charges = kind.startsWith('like') ? [[cx - 160, cyy, 1], [cx + 160, cyy, 1]] : kind.startsWith('single') ? [[cx, cyy, 1]] : [[cx - 170, cyy, 1], [cx + 170, cyy, -1]];
        const E = (x, y) => { let ex = 0; let ey = 0; for (const [qx, qy, q] of charges) { const dx = x - qx; const dy = y - qy; const r2 = dx * dx + dy * dy; const r3 = r2 * Math.sqrt(r2) || 1; ex += (q * dx) / r3; ey += (q * dy) / r3; } return [ex, ey]; };
        const lines = [];
        for (const [qx, qy, q] of charges) {
          if (q < 0) continue;
          for (let k = 0; k < 16; k++) {
            const a = ((k + 0.5) / 16) * TAU; let x = qx + Math.cos(a) * 22; let y = qy + Math.sin(a) * 22; const pts = [x, y];
            for (let s = 0; s < 300; s++) {
              const [ex, ey] = E(x, y); const m = Math.hypot(ex, ey) || 1; x += (ex / m) * 5; y += (ey / m) * 5; pts.push(x, y);
              if (x < X0 + 10 || x > X1 - 10 || y < Y0 + 60 || y > Y0 + 600) break;
              if (charges.some(([px, py, pq]) => pq < 0 && Math.hypot(x - px, y - py) < 20)) break;
            }
            lines.push(new Float32Array(pts));
          }
        }
        return { charges, lines, cyy };
      })());
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Electric field lines');
      const flow = (draw) => {
        ctx.strokeStyle = 'rgba(140,170,255,0.45)'; ctx.lineWidth = 2; ctx.beginPath(); draw(); ctx.stroke();
        ctx.strokeStyle = tint('cyan', 0.9); ctx.lineWidth = 3; ctx.setLineDash([4, 22]); ctx.lineDashOffset = -b.clock * 40; ctx.beginPath(); draw(); ctx.stroke();
        ctx.setLineDash([]); ctx.lineDashOffset = 0;
      };
      if (g.plates) {
        const top = Y0 + 150; const bot = Y0 + 530; const xa = X0 + 110; const xb = X1 - 110;
        flow(() => { for (let x = xa + 30; x <= xb - 30; x += 60) { ctx.moveTo(x, top + 8); ctx.lineTo(x, bot - 8); } });
        ctx.fillStyle = COLORS.ink; ctx.beginPath();
        for (let x = xa + 30; x <= xb - 30; x += 60) { ctx.moveTo(x, (top + bot) / 2 + 10); ctx.lineTo(x - 8, (top + bot) / 2 - 6); ctx.lineTo(x + 8, (top + bot) / 2 - 6); ctx.closePath(); }
        ctx.fill();
        glow(ctx, COLORS.red, 14); ctx.fillStyle = COLORS.red; ctx.fillRect(xa, top - 14, xb - xa, 14); ctx.shadowBlur = 0;
        ctx.fillStyle = COLORS.blue; ctx.fillRect(xa, bot, xb - xa, 14);
        label(ctx, '+  +  +  +  +  +  +  +', cx, top - 34, { size: 24, weight: 800, fill: 'red' });
        label(ctx, '−  −  −  −  −  −  −  −', cx, bot + 38, { size: 24, weight: 800, fill: 'blue' });
        const ty = top + 20 + mod(b.clock * 70, bot - top - 40);
        dot(ctx, cx - 30, ty, 9, 'ink'); label(ctx, '+', cx - 30, ty + 1, { size: 16, weight: 800, fill: DARK });
        arr(ctx, cx - 30, ty + 12, cx - 30, ty + 60, 'orange', 4);
        label(ctx, 'Between plates the field is uniform: parallel, evenly spaced lines', cx, Y0 + 640, { size: 19, weight: 600, fill: 'muted' });
      } else {
        flow(() => { for (const p of g.lines) { ctx.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]); } });
        ctx.fillStyle = 'rgba(200,215,255,0.85)'; ctx.beginPath();
        for (const p of g.lines) {
          const m = 2 * Math.floor(p.length / 4); if (m + 3 >= p.length || m < 2) continue;
          const a = Math.atan2(p[m + 3] - p[m + 1], p[m + 2] - p[m]); const x = p[m]; const y = p[m + 1];
          ctx.moveTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8); ctx.lineTo(x + Math.cos(a + 2.5) * 8, y + Math.sin(a + 2.5) * 8); ctx.lineTo(x + Math.cos(a - 2.5) * 8, y + Math.sin(a - 2.5) * 8); ctx.closePath();
        }
        ctx.fill();
        // A small test charge riding along one line.
        const p = g.lines[0];
        if (p && p.length > 8) {
          const n = p.length / 2 - 2; const i = 2 * Math.floor(mod(b.clock * 12, n)); const a = Math.atan2(p[i + 3] - p[i + 1], p[i + 2] - p[i]);
          dot(ctx, p[i], p[i + 1], 9, 'ink'); label(ctx, '+', p[i], p[i + 1] + 1, { size: 16, weight: 800, fill: DARK });
          arr(ctx, p[i] + Math.cos(a) * 12, p[i + 1] + Math.sin(a) * 12, p[i] + Math.cos(a) * 54, p[i + 1] + Math.sin(a) * 54, 'orange', 4);
        }
        for (const [qx, qy, q] of g.charges) {
          const c = q > 0 ? 'red' : 'blue';
          glow(ctx, color(c), 20); ctx.fillStyle = color(c); ctx.beginPath(); ctx.arc(qx, qy, 24, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
          label(ctx, q > 0 ? '+' : '−', qx, qy + 1, { size: 32, weight: 800, fill: '#ffffff' });
        }
        label(ctx, 'Lines start on + and end on −; closer lines mean a stronger field', cx, Y0 + 640, { size: 19, weight: 600, fill: 'muted' });
      }
      label(ctx, 'The orange arrow: the force on a small + charge', cx, Y0 + 680, { size: 18, weight: 500, fill: 'orange' });
      ctx.restore();
    },

    // A bar magnet's field: lines from N round to S, compasses lining up, one travelling along a line.
    'magnetic-field'(b, ctx, it, t) {
      const g = it._mf || (it._mf = (() => {
        const my = Y0 + 330; const poles = [[cx - 115, my, 1], [cx + 115, my, -1]];
        const B = (x, y) => { let bx = 0; let by = 0; for (const [qx, qy, q] of poles) { const dx = x - qx; const dy = y - qy; const r2 = dx * dx + dy * dy; const r3 = r2 * Math.sqrt(r2) || 1; bx += (q * dx) / r3; by += (q * dy) / r3; } return [bx, by]; };
        const lines = []; let tour = null; let best = 1e9;
        for (let k = 0; k < 14; k++) {
          const a = (40 + (280 * (k + 0.5)) / 14) * DEG; let x = poles[0][0] + Math.cos(a) * 16; let y = my + Math.sin(a) * 16; const pts = [x, y]; let reached = false; let minY = y;
          for (let s = 0; s < 400; s++) {
            const [bx, by] = B(x, y); const m = Math.hypot(bx, by) || 1; x += (bx / m) * 5; y += (by / m) * 5; pts.push(x, y); minY = Math.min(minY, y);
            if (x < X0 + 10 || x > X1 - 10 || y < Y0 + 60 || y > Y0 + 610) break;
            if (Math.hypot(x - poles[1][0], y - my) < 16) { reached = true; break; }
          }
          const arrP = new Float32Array(pts); lines.push(arrP);
          if (reached && Math.abs(my - minY - 160) < best) { best = Math.abs(my - minY - 160); tour = arrP; }
        }
        const spots = [[-330, 0], [330, 0], [0, -150], [0, 150], [-230, -130], [230, -130], [-230, 130], [230, 130], [-120, -230], [120, -230], [-120, 230], [120, 230]];
        const comps = spots.map(([dx, dy]) => { const [bx, by] = B(cx + dx, my + dy); return [cx + dx, my + dy, Math.atan2(by, bx)]; });
        return { my, lines, comps, tour, B };
      })());
      const my = g.my;
      const needle = (x, y, a, r) => {
        ctx.fillStyle = DARK; ctx.strokeStyle = 'rgba(200,215,255,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
        const c = Math.cos(a); const s = Math.sin(a); const w = r * 0.28; const L = r * 0.85;
        ctx.fillStyle = COLORS.red; ctx.beginPath(); ctx.moveTo(x + c * L, y + s * L); ctx.lineTo(x - s * w, y + c * w); ctx.lineTo(x + s * w, y - c * w); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e9eeff'; ctx.beginPath(); ctx.moveTo(x - c * L, y - s * L); ctx.lineTo(x - s * w, y + c * w); ctx.lineTo(x + s * w, y - c * w); ctx.closePath(); ctx.fill();
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Magnetic field of a bar magnet');
      const draw = () => { for (const p of g.lines) { ctx.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]); } };
      ctx.strokeStyle = 'rgba(167,139,250,0.45)'; ctx.lineWidth = 2; ctx.beginPath(); draw(); ctx.stroke();
      ctx.strokeStyle = tint('purple', 0.95); ctx.lineWidth = 3; ctx.setLineDash([4, 22]); ctx.lineDashOffset = -b.clock * 40; ctx.beginPath(); draw(); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
      for (const [x, y, a] of g.comps) needle(x, y, a, 16);
      ctx.save(); glow(ctx, COLORS.purple, 18);
      ctx.fillStyle = tint('red', 0.85); ctx.fillRect(cx - 140, my - 34, 140, 68);
      ctx.fillStyle = tint('blue', 0.85); ctx.fillRect(cx, my - 34, 140, 68);
      ctx.restore();
      label(ctx, 'N', cx - 70, my + 2, { size: 36, weight: 800, fill: '#ffffff' });
      label(ctx, 'S', cx + 70, my + 2, { size: 36, weight: 800, fill: '#ffffff' });
      if (g.tour && g.tour.length > 8) {
        const p = g.tour; const n = p.length / 2 - 1; const i = 2 * Math.floor(mod(b.clock * 10, n));
        const [bx, by] = g.B(p[i], p[i + 1]);
        needle(p[i], p[i + 1], Math.atan2(by, bx), 24);
      }
      label(ctx, 'Outside the magnet, field lines run from N to S', cx, Y0 + 645, { size: 20, weight: 600, fill: 'ink' });
      label(ctx, 'A compass needle lines up along the field: its red N end points along the line', cx, Y0 + 684, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // A current across a magnetic field feels a force (F = BIL); on a coil the forces make it spin.
    'motor-effect'(b, ctx, it, t) {
      const into = String(it.current || 'in').toLowerCase() !== 'out';
      const Bf = Math.max(0.01, val(it.B, 0.5)); const I = Math.max(0.01, val(it.I, 2)); const Lw = Math.max(0.01, val(it.L, 0.1)); const F = Bf * I * Lw;
      const poles = (y0, y1, w0, w1) => {
        ctx.fillStyle = tint('red', 0.7); ctx.fillRect(w0, y0, 110, y1 - y0);
        ctx.fillStyle = tint('blue', 0.7); ctx.fillRect(w1 - 110, y0, 110, y1 - y0);
        label(ctx, 'N', w0 + 55, (y0 + y1) / 2, { size: 34, weight: 800, fill: '#ffffff' });
        label(ctx, 'S', w1 - 55, (y0 + y1) / 2, { size: 34, weight: 800, fill: '#ffffff' });
        ctx.strokeStyle = 'rgba(167,139,250,0.4)'; ctx.lineWidth = 2; ctx.setLineDash([10, 10]); ctx.lineDashOffset = -b.clock * 30; ctx.beginPath();
        for (let y = y0 + 20; y <= y1 - 20; y += 30) { ctx.moveTo(w0 + 110, y); ctx.lineTo(w1 - 110, y); }
        ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
      };
      const wireMark = (x, y, r, inPage) => {
        ctx.fillStyle = DARK; ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
        if (inPage) { ctx.beginPath(); ctx.moveTo(x - r * 0.55, y - r * 0.55); ctx.lineTo(x + r * 0.55, y + r * 0.55); ctx.moveTo(x + r * 0.55, y - r * 0.55); ctx.lineTo(x - r * 0.55, y + r * 0.55); ctx.stroke(); } else dot(ctx, x, y, r * 0.28, 'yellow');
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The motor effect');
      // A single wire in the field.
      const y0 = Y0 + 70; const y1 = Y0 + 320; const wy = (y0 + y1) / 2;
      poles(y0, y1, X0 + 40, X1 - 40);
      const dir = into ? 1 : -1; const bob = dir * 10 * (0.5 - 0.5 * Math.cos(b.clock * 3));
      ctx.strokeStyle = 'rgba(251,191,36,0.35)'; ctx.lineWidth = 2; ctx.setLineDash([6, 8]); ctx.lineDashOffset = dir * -b.clock * 20;
      for (const r of [42, 64]) { ctx.beginPath(); ctx.arc(cx, wy + bob, r, 0, TAU); ctx.stroke(); }
      ctx.setLineDash([]); ctx.lineDashOffset = 0;
      wireMark(cx, wy + bob, 24, into);
      glow(ctx, COLORS.orange, 14); arr(ctx, cx, wy + bob + dir * 30, cx, wy + bob + dir * 115, 'orange', 7); ctx.shadowBlur = 0;
      label(ctx, 'force', cx + 16, wy + bob + dir * 100, { size: 19, weight: 700, fill: 'orange', align: 'left' });
      chip(ctx, `current ${into ? 'into' : 'out of'} the page`, cx - 150, wy - 70, 'yellow', 16);
      chip(ctx, `F = BIL = ${fx(Bf, 2)} × ${fx(I, 1)} × ${fx(Lw, 2)} = ${fx(F, 2)} N`, cx, Y0 + 362, 'orange', 19);
      // A coil spinning between the poles.
      const ym = Y0 + 520; const R = 70; const xm = cx;
      poles(ym - 110, ym + 110, X0 + 150, X1 - 150);
      const ph = b.clock * 1.6;
      const ax = Math.cos(ph) * R; const ay = Math.sin(ph) * R;
      line(ctx, xm - ax, ym - ay, xm + ax, ym + ay, 'orange', 7);
      dot(ctx, xm, ym, 6, 'ink');
      for (const s of [1, -1]) {
        const x = xm + s * ax; const y = ym + s * ay; const left = x < xm;
        wireMark(x, y, 14, !left);
        arr(ctx, x, y + (left ? -18 : 18), x, y + (left ? -66 : 66), 'orange', 5);
      }
      ctx.strokeStyle = 'rgba(200,215,255,0.6)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(xm, ym, 104, -Math.PI / 2 - 0.6, -Math.PI / 2 + 0.6); ctx.stroke();
      arr(ctx, xm + 104 * Math.cos(-Math.PI / 2 + 0.45), ym + 104 * Math.sin(-Math.PI / 2 + 0.45), xm + 104 * Math.cos(-Math.PI / 2 + 0.68), ym + 104 * Math.sin(-Math.PI / 2 + 0.68), 'rgba(200,215,255,0.8)', 3);
      wrapLabel(ctx, "Fleming's left-hand rule: First finger = Field, seCond finger = Current, thuMb = Motion", X0 + 40, Y0 + 680, FIG.w - 80, 18, 'center', 'muted', 500);
      ctx.restore();
    },

    // A magnet pushed into a coil and pulled out: the meter kicks one way, then the other.
    induction(b, ctx, it, t) {
      const tau = mod(b.clock, 5); const outX = X0 + 330; const inX = X0 + 520; const span = inX - outX;
      let x; let vel;
      if (tau < 1) { x = outX + span * smooth(tau); vel = span * 6 * tau * (1 - tau); } else if (tau < 2.4) { x = inX; vel = 0; } else if (tau < 3.4) { const p = tau - 2.4; x = inX - span * smooth(p); vel = -span * 6 * p * (1 - p); } else { x = outX; vel = 0; }
      const emf = vel / (span * 1.5);
      const ay = Y0 + 240; const c0 = X0 + 420; const c1 = X0 + 660; const ry = 70; const rx = 14;
      const mx = X0 + 540; const myy = Y0 + 545;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Electromagnetic induction');
      ctx.strokeStyle = 'rgba(255,159,67,0.35)'; ctx.lineWidth = 3; ctx.beginPath();
      for (let k = 0; k < 10; k++) { const xk = c0 + (k * (c1 - c0)) / 9; ctx.moveTo(xk, ay - ry); ctx.ellipse(xk, ay, rx, ry, 0, -Math.PI / 2, Math.PI / 2); }
      ctx.stroke();
      ctx.fillStyle = tint('blue', 0.85); ctx.fillRect(x - 220, ay - 26, 110, 52);
      ctx.fillStyle = tint('red', 0.85); ctx.fillRect(x - 110, ay - 26, 110, 52);
      label(ctx, 'S', x - 165, ay + 1, { size: 28, weight: 800, fill: '#ffffff' });
      label(ctx, 'N', x - 55, ay + 1, { size: 28, weight: 800, fill: '#ffffff' });
      ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 3.5; ctx.beginPath();
      for (let k = 0; k < 10; k++) { const xk = c0 + (k * (c1 - c0)) / 9; ctx.moveTo(xk, ay + ry); ctx.ellipse(xk, ay, rx, ry, 0, Math.PI / 2, (3 * Math.PI) / 2); }
      ctx.stroke();
      // Wires to the meter, with current dots that move only while the magnet moves.
      const wA = [c0, ay + ry, c0, myy, mx - 100, myy]; const wB = [mx + 100, myy, c1, myy, c1, ay + ry];
      ctx.strokeStyle = LINE; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wA[0], wA[1]); ctx.lineTo(wA[2], wA[3]); ctx.lineTo(wA[4], wA[5]); ctx.moveTo(wB[0], wB[1]); ctx.lineTo(wB[2], wB[3]); ctx.lineTo(wB[4], wB[5]); ctx.stroke();
      const off = (x - outX) * 0.9;
      ctx.fillStyle = COLORS.cyan;
      for (const w of [wA, wB]) {
        const l1 = Math.hypot(w[2] - w[0], w[3] - w[1]); const l2 = Math.hypot(w[4] - w[2], w[5] - w[3]); const tot = l1 + l2;
        for (let k = 0; k < 7; k++) { const d = mod(off + (k * tot) / 7, tot); const px = d < l1 ? w[0] + ((w[2] - w[0]) * d) / l1 : w[2] + ((w[4] - w[2]) * (d - l1)) / l2; const py = d < l1 ? w[1] + ((w[3] - w[1]) * d) / l1 : w[3] + ((w[5] - w[3]) * (d - l1)) / l2; ctx.beginPath(); ctx.arc(px, py, 4.5, 0, TAU); ctx.fill(); }
      }
      // Centre-zero meter.
      ctx.fillStyle = 'rgba(10,16,36,0.95)'; ctx.strokeStyle = 'rgba(200,215,255,0.6)'; ctx.lineWidth = 2; rounded(ctx, mx - 100, myy - 110, 200, 140, 16); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(200,215,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mx, myy, 80, -Math.PI + 0.5, -0.5); ctx.stroke();
      ctx.beginPath(); for (let k = -4; k <= 4; k++) { const a = -Math.PI / 2 + k * 0.25; ctx.moveTo(mx + Math.cos(a) * 80, myy + Math.sin(a) * 80); ctx.lineTo(mx + Math.cos(a) * (k ? 70 : 64), myy + Math.sin(a) * (k ? 70 : 64)); } ctx.stroke();
      label(ctx, '0', mx, myy - 98, { size: 16, weight: 700, fill: 'muted' });
      const na = -Math.PI / 2 + emf * 1.0;
      glow(ctx, COLORS.red, 12); line(ctx, mx, myy, mx + Math.cos(na) * 76, myy + Math.sin(na) * 76, 'red', 4); ctx.shadowBlur = 0;
      dot(ctx, mx, myy, 7, 'ink');
      const msg = emf > 0.05 ? 'Magnet moving in: a current flows' : emf < -0.05 ? 'Magnet moving out: the current reverses' : 'Magnet still: no current';
      chip(ctx, msg, cx, Y0 + 638, Math.abs(emf) > 0.05 ? 'cyan' : 'ink', 20);
      label(ctx, 'Faster movement, a stronger magnet or more turns: a bigger current', cx, Y0 + 684, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // A transformer: changing flux in the iron core links two coils; the turns ratio sets the voltage.
    transformer(b, ctx, it, t) {
      const np = Math.max(1, Math.round(val(it.np, 100))); const ns = Math.max(1, Math.round(val(it.ns, 400))); const vp = val(it.vp, 12);
      const vs = (vp * ns) / np;
      const sc = 16 / Math.max(np, ns); const nP = Math.max(2, Math.round(np * sc)); const nS = Math.max(2, Math.round(ns * sc));
      const ox0 = X0 + 230; const ox1 = X0 + 570; const oy0 = Y0 + 130; const oy1 = Y0 + 450; const th = 50;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'A transformer');
      ctx.fillStyle = tint('muted', 0.3); ctx.beginPath(); ctx.rect(ox0, oy0, ox1 - ox0, oy1 - oy0); ctx.rect(ox0 + th, oy0 + th, ox1 - ox0 - 2 * th, oy1 - oy0 - 2 * th); ctx.fill('evenodd');
      ctx.strokeStyle = 'rgba(200,215,255,0.4)'; ctx.lineWidth = 2; ctx.strokeRect(ox0, oy0, ox1 - ox0, oy1 - oy0); ctx.strokeRect(ox0 + th, oy0 + th, ox1 - ox0 - 2 * th, oy1 - oy0 - 2 * th);
      // Flux: dots surging back and forth round the core with the alternating current.
      const lx0 = ox0 + th / 2; const lx1 = ox1 - th / 2; const ly0 = oy0 + th / 2; const ly1 = oy1 - th / 2; const W = lx1 - lx0; const H = ly1 - ly0; const per = 2 * (W + H);
      const sway = 40 * Math.sin(b.clock * 3);
      ctx.fillStyle = COLORS.purple;
      for (let k = 0; k < 16; k++) {
        let d = mod((k * per) / 16 + sway, per); let x; let y;
        if (d < W) { x = lx0 + d; y = ly0; } else if ((d -= W) < H) { x = lx1; y = ly0 + d; } else if ((d -= H) < W) { x = lx1 - d; y = ly1; } else { d -= W; x = lx0; y = ly1 - d; }
        ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill();
      }
      const coil = (xa, n, c) => {
        const top = Y0 + 190; const span = 200; ctx.strokeStyle = color(c); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath();
        for (let k = 0; k < n; k++) { const y = top + (span * (k + 0.5)) / n; ctx.moveTo(xa - 10, y - 4); ctx.lineTo(xa + th + 10, y + 4); }
        ctx.stroke();
        return [top, top + span];
      };
      const [pt, pb] = coil(ox0, nP, 'orange'); const [st, sb] = coil(ox1 - th, nS, 'teal');
      // Leads and the two alternating voltages.
      const wave = (x0, A, c, phase) => {
        ctx.strokeStyle = 'rgba(200,215,255,0.25)'; ctx.lineWidth = 1.5; ctx.strokeRect(x0, Y0 + 250, 160, 120);
        ctx.strokeStyle = color(c); ctx.lineWidth = 3; ctx.beginPath();
        for (let i = 0; i <= 40; i++) { const x = x0 + 4 + i * 3.8; const y = Y0 + 310 - A * Math.sin(i * 0.31 - b.clock * 3 + phase); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.stroke();
      };
      const Vmax = Math.max(Math.abs(vp), Math.abs(vs), 1e-6);
      line(ctx, ox0 - 10, pt + 4, X0 + 190, Y0 + 270, LINE, 2); line(ctx, ox0 - 10, pb - 4, X0 + 190, Y0 + 350, LINE, 2);
      line(ctx, ox1 + 10, st + 4, X0 + 610, Y0 + 270, LINE, 2); line(ctx, ox1 + 10, sb - 4, X0 + 610, Y0 + 350, LINE, 2);
      wave(X0 + 30, (50 * Math.abs(vp)) / Vmax, 'orange', 0); wave(X0 + 610, (50 * Math.abs(vs)) / Vmax, 'teal', 0);
      label(ctx, `Vp = ${fx(vp, vp % 1 ? 1 : 0)} V`, X0 + 110, Y0 + 225, { size: 21, weight: 700, fill: 'orange' });
      label(ctx, `Vs = ${fx(vs, vs % 1 ? 1 : 0)} V`, X0 + 690, Y0 + 225, { size: 21, weight: 700, fill: 'teal' });
      label(ctx, `Np = ${np}`, ox0 + th / 2, oy1 + 30, { size: 21, weight: 700, fill: 'orange' });
      label(ctx, `Ns = ${ns}`, ox1 - th / 2, oy1 + 30, { size: 21, weight: 700, fill: 'teal' });
      chip(ctx, `Vs = Vp × Ns ÷ Np = ${fx(vp, vp % 1 ? 1 : 0)} × ${ns} ÷ ${np} = ${fx(vs, vs % 1 ? 1 : 0)} V`, cx, Y0 + 570, 'ink', 20);
      const kind = ns > np ? 'Step-up: more turns on the secondary, bigger voltage' : ns < np ? 'Step-down: fewer turns on the secondary, smaller voltage' : 'Same turns: same voltage';
      label(ctx, kind, cx, Y0 + 630, { size: 21, weight: 700, fill: ns > np ? 'teal' : 'orange' });
      label(ctx, 'Only alternating current works: the core’s field must keep changing', cx, Y0 + 675, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Solid, liquid and gas side by side: how the particles are arranged and how they move.
    'particle-model'(b, ctx, it, t) {
      const g = it._pm || (it._pm = (() => {
        const liquid = [];
        for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) liquid.push([22 + c * 33 + (r % 2) * 14 + (rnd(r * 7 + c) - 0.5) * 8, 218 - r * 30, rnd(r * 13 + c) * TAU, rnd(r * 5 + c + 50) * TAU]);
        const gas = [];
        for (let k = 0; k < 10; k++) gas.push([rnd(k + 100) * 2, rnd(k + 200) * 2, 0.5 + rnd(k + 300) * 0.7, 0.45 + rnd(k + 400) * 0.6]);
        return { liquid, gas };
      })());
      const w = 220; const h = 240; const y0 = Y0 + 140; const c = b.clock;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The particle model of matter');
      const names = [['Solid', 'blue', 'Close together in rows: they vibrate in place'], ['Liquid', 'cyan', 'Close but jumbled: they slide past each other'], ['Gas', 'purple', 'Far apart and fast: they fill the container']];
      names.forEach(([name, col, desc], k) => {
        const x0 = X0 + 30 + k * 260;
        ctx.strokeStyle = 'rgba(200,215,255,0.45)'; ctx.lineWidth = 2.5; rounded(ctx, x0, y0, w, h, 12); ctx.stroke();
        label(ctx, name, x0 + w / 2, y0 - 28, { size: 25, weight: 700, fill: col });
        wrapLabel(ctx, desc, x0 - 14, Y0 + 432, w + 28, 18, 'center', 'muted', 500);
        ctx.fillStyle = color(col); ctx.beginPath();
        if (k === 0) {
          for (let r = 0; r < 5; r++) for (let q = 0; q < 6; q++) { const i = r * 6 + q; const x = x0 + 30 + q * 32 + 2.2 * Math.sin(13 * c + i * 1.7); const y = y0 + h - 22 - r * 32 + 2.2 * Math.cos(11 * c + i * 2.3); ctx.moveTo(x + 14, y); ctx.arc(x, y, 14, 0, TAU); }
        } else if (k === 1) {
          for (const [lx, ly, a, bb] of g.liquid) { const x = clamp(x0 + lx + 7 * Math.sin(1.3 * c + a) + 4 * Math.sin(2.7 * c + bb), x0 + 14, x0 + w - 14); const y = y0 + ly + 3 * Math.sin(1.9 * c + bb); ctx.moveTo(x + 13, y); ctx.arc(x, y, 13, 0, TAU); }
        } else {
          for (const [ux, uy, vx, vy] of g.gas) { const x = x0 + 14 + tri(ux + vx * c) * (w - 28); const y = y0 + 14 + tri(uy + vy * c) * (h - 28); ctx.moveTo(x + 12, y); ctx.arc(x, y, 12, 0, TAU); }
        }
        ctx.fill();
      });
      line(ctx, X0 + 30 + 260 + 6, y0 + 92, X0 + 30 + 260 + w - 6, y0 + 92, 'rgba(34,211,238,0.3)', 2, [5, 6]);
      arr(ctx, X0 + 60, Y0 + 535, X1 - 60, Y0 + 535, 'orange', 3);
      label(ctx, 'Heat it: particles gain energy, move faster and spread out', cx, Y0 + 570, { size: 19, weight: 600, fill: 'orange' });
      ctx.restore();
    },

    // A piston squeezes a gas at fixed temperature: particles hit the walls more often, p × V stays the same.
    'gas-laws'(b, ctx, it, t) {
      const g = it._gl || (it._gl = (() => { const ps = []; for (let k = 0; k < 16; k++) ps.push([rnd(k + 11) * 2, rnd(k + 23) * 2, 110 + rnd(k + 37) * 110, 0.45 + rnd(k + 41) * 0.6]); return ps; })());
      const left = X0 + 40; const top = Y0 + 150; const H = 220; const Wbar = 270; const a = 1 / 3; const w = TAU / 8;
      const c = b.clock; const width = Wbar * (1 - a * Math.cos(w * c));
      // The exact time integral of 1/width, so particles keep a constant speed while the walls move.
      const s = Math.sqrt(1 - a * a); const q = Math.sqrt((1 + a) / (1 - a)); const th = (w * c) / 2; const kk = Math.floor((th + Math.PI / 2) / Math.PI);
      const integ = ((2 / (w * s)) * (Math.atan(q * Math.tan(th - kk * Math.PI)) + kk * Math.PI)) / Wbar;
      const V = (2 * width) / (Wbar * (1 + a)); const p = 200 / V;
      const r = 7;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || "Boyle's law: p × V stays constant");
      ctx.strokeStyle = LINE; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X0 + 450, top); ctx.lineTo(left, top); ctx.lineTo(left, top + H); ctx.lineTo(X0 + 450, top + H); ctx.stroke();
      const pxp = left + width;
      ctx.fillStyle = tint('blue', 0.5); ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 2; ctx.fillRect(pxp, top + 3, 16, H - 6); ctx.strokeRect(pxp, top + 3, 16, H - 6);
      ctx.fillStyle = 'rgba(200,215,255,0.5)'; ctx.fillRect(pxp + 16, top + H / 2 - 5, X0 + 470 - pxp - 16, 10); ctx.fillRect(X0 + 466, top + H / 2 - 40, 10, 80);
      ctx.fillStyle = COLORS.purple; ctx.beginPath(); const hits = [];
      for (const [ux, uy, v, vy] of g) {
        const ax = ux + v * integ; const u = tri(ax); const x = left + r + u * (width - 2 * r); const y = top + r + tri(uy + vy * c) * (H - 2 * r);
        ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU);
        if (u > 0.96) hits.push(y);
      }
      ctx.fill();
      ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2.5; ctx.beginPath();
      for (const y of hits) { ctx.moveTo(pxp - 2, y - 10); ctx.arc(pxp - 2, y, 10, -Math.PI / 2, Math.PI / 2, true); }
      ctx.stroke();
      // p–V graph: a curve, p = constant ÷ V.
      const gx = X0 + 510; const gy = Y0 + 150; const gw = 250; const gh = 250;
      axes(ctx, gx, gy, gw, gh, 'volume (L)', 'pressure (kPa)');
      const pxv = (vv) => gx + (vv / 2.4) * gw; const pyp = (pp) => gy + gh - (pp / 250) * gh;
      trace(ctx, 60, (u) => pxv(0.85 + u * 1.5), (u) => pyp(200 / (0.85 + u * 1.5)), 'orange', 3);
      dot(ctx, pxv(V), pyp(p), 8, 'orange', 14);
      chip(ctx, `V = ${fx(V, 2)} L`, X0 + 130, Y0 + 480, 'blue');
      chip(ctx, `p = ${fx(p, 0)} kPa`, X0 + 330, Y0 + 480, 'orange');
      chip(ctx, 'p × V = 200 kPa L: constant', X0 + 620, Y0 + 480, 'green', 19);
      wrapLabel(ctx, 'Squash the gas into less space: the particles hit the walls more often, so the pressure goes up (temperature fixed)', X0 + 40, Y0 + 590, FIG.w - 80, 20, 'center', 'muted', 500);
      ctx.restore();
    },

    // Three ways heat travels: through a metal rod, round a beaker of water, and across empty space.
    'heat-transfer'(b, ctx, it, t) {
      const c = b.clock; const r0 = Y0 + 70; const r1 = Y0 + 280; const r2 = Y0 + 490;
      const mix = (k) => `rgb(${Math.round(91 + 164 * k)},${Math.round(140 - 20 * k)},${Math.round(255 - 195 * k)})`;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Conduction, convection and radiation');
      ctx.strokeStyle = 'rgba(140,170,255,0.12)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X0 + 20, r1 - 5); ctx.lineTo(X1 - 20, r1 - 5); ctx.moveTo(X0 + 20, r2 - 5); ctx.lineTo(X1 - 20, r2 - 5); ctx.stroke();
      const text = [['Conduction', 'orange', 'Particles pass on their vibrations: best in metals'], ['Convection', 'cyan', 'Warm fluid rises, cool fluid sinks: a current forms'], ['Radiation', 'red', 'Infrared waves: no particles needed, even across space']];
      text.forEach(([n, col, d], k) => { const y = [r0, r1, r2][k]; label(ctx, n, X0 + 520, y + 60, { size: 24, weight: 700, fill: col, align: 'left' }); wrapLabel(ctx, d, X0 + 520, y + 118, 250, 18, 'left', 'muted', 500); });
      // Conduction: heat creeps along the rod.
      const tau = cycle(t, 9, 0.3); const front = Math.max(1, 400 * Math.sqrt(tau / 7));
      const rx0 = X0 + 80; const ry = r0 + 100;
      for (let i = 0; i < 16; i++) { const k = Math.exp(-((((i + 0.5) * 25) / front) ** 2)); ctx.fillStyle = mix(k); ctx.fillRect(rx0 + i * 25, ry - 20, 25.5, 40); }
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath();
      for (let j = 0; j < 14; j++) { const x0 = rx0 + 14 + j * 28; const k = Math.exp(-(((x0 - rx0) / front) ** 2)); const amp = 1 + 4 * k; for (const yy of [ry - 8, ry + 8]) { const x = x0 + amp * Math.sin(17 * c + j * 1.7 + yy); const y = yy + amp * Math.cos(15 * c + j); ctx.moveTo(x + 4, y); ctx.arc(x, y, 4, 0, TAU); } }
      ctx.fill();
      glow(ctx, COLORS.orange, 16); ctx.fillStyle = COLORS.orange; ctx.beginPath();
      for (let f = 0; f < 3; f++) { const fx0 = rx0 + 12 + f * 14; const hgt = 32 + 8 * Math.sin(c * 9 + f * 2); ctx.moveTo(fx0 - 9, ry + 62); ctx.quadraticCurveTo(fx0 - 8, ry + 62 - hgt * 0.6, fx0, ry + 62 - hgt); ctx.quadraticCurveTo(fx0 + 8, ry + 62 - hgt * 0.6, fx0 + 9, ry + 62); ctx.closePath(); }
      ctx.fill(); ctx.shadowBlur = 0;
      arr(ctx, rx0 + 70, ry - 46, rx0 + 360, ry - 46, 'orange', 3);
      // Convection: a loop in a beaker heated from the bottom left.
      const bx0 = X0 + 80; const bx1 = X0 + 460; const by0 = r1 + 20; const by1 = r1 + 185;
      ctx.fillStyle = tint('cyan', 0.1); ctx.fillRect(bx0, by0 + 12, bx1 - bx0, by1 - by0 - 12);
      ctx.strokeStyle = LINE; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx0, by0); ctx.lineTo(bx0, by1); ctx.lineTo(bx1, by1); ctx.lineTo(bx1, by0); ctx.stroke();
      glow(ctx, COLORS.red, 16); ctx.fillStyle = COLORS.red; ctx.fillRect(bx0 + 30, by1 + 5, 100, 9); ctx.shadowBlur = 0;
      const ex = (bx0 + bx1) / 2; const ey = (by0 + by1) / 2 + 6;
      for (let k = 0; k < 14; k++) { const ph = c * 0.8 + (k * TAU) / 14; const warm = (1 - Math.cos(ph + 0.6)) / 2; ctx.fillStyle = mix(warm); ctx.beginPath(); ctx.arc(ex + 150 * Math.cos(ph), ey + 52 * Math.sin(ph), 6, 0, TAU); ctx.fill(); }
      arr(ctx, ex - 20, ey - 52, ex + 20, ey - 52, 'ink', 2.5); arr(ctx, ex + 20, ey + 52, ex - 20, ey + 52, 'ink', 2.5);
      // Radiation: waves from a hot ball cross the gap.
      const hx = X0 + 130; const hy = r2 + 100;
      const hg = ctx.createRadialGradient(hx - 10, hy - 10, 4, hx, hy, 40); hg.addColorStop(0, '#ffe2a8'); hg.addColorStop(1, '#ff6a3d');
      glow(ctx, COLORS.orange, 26); ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hx, hy, 40, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = tint('red', 0.85); ctx.lineWidth = 2.5; ctx.beginPath();
      for (const a of [-0.22, 0, 0.22]) { const ca = Math.cos(a); const sa = Math.sin(a); for (let s2 = 0; s2 <= 250; s2 += 4) { const o = 8 * Math.sin(0.12 * s2 - c * 6); const x = hx + 55 * ca + s2 * ca - o * sa; const y = hy + 55 * sa + s2 * sa + o * ca; if (s2) ctx.lineTo(x, y); else ctx.moveTo(x, y); } }
      ctx.stroke();
      ctx.fillStyle = tint('orange', 0.3 + 0.15 * Math.sin(c * 2)); ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2; ctx.fillRect(X0 + 450, hy - 50, 30, 100); ctx.strokeRect(X0 + 450, hy - 50, 30, 100);
      ctx.restore();
    },

    // A hundred nuclei decaying at random, and the smooth curve they follow: half gone every half-life.
    'half-life'(b, ctx, it, t) {
      const hl = Math.max(0.0001, val(it.halfLife ?? it.halflife, 5)); const unit = String(it.unit || 'min'); const T = 2;
      const g = it._hl || (it._hl = (() => { const d = new Float32Array(100); for (let i = 0; i < 100; i++) d[i] = (-T / Math.LN2) * Math.log(1 - rnd(i * 3 + 7) * 0.9999); return d; })());
      const tau = cycle(t, 10, 0.6);
      let count = 0;
      for (let i = 0; i < 100; i++) if (g[i] > tau) count++;
      const x0 = X0 + 40; const y0 = Y0 + 140; const step = 34;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Radioactive decay and half-life');
      ctx.fillStyle = COLORS.green; ctx.beginPath();
      for (let i = 0; i < 100; i++) if (g[i] > tau) { const x = x0 + 17 + (i % 10) * step; const y = y0 + 17 + Math.floor(i / 10) * step; ctx.moveTo(x + 11, y); ctx.arc(x, y, 11, 0, TAU); }
      ctx.fill();
      ctx.fillStyle = 'rgba(147,160,196,0.3)'; ctx.beginPath();
      for (let i = 0; i < 100; i++) if (g[i] <= tau) { const x = x0 + 17 + (i % 10) * step; const y = y0 + 17 + Math.floor(i / 10) * step; ctx.moveTo(x + 8, y); ctx.arc(x, y, 8, 0, TAU); }
      ctx.fill();
      ctx.lineWidth = 2;
      for (let i = 0; i < 100; i++) { const q = (tau - g[i]) / 0.35; if (q > 0 && q < 1) { ctx.strokeStyle = tint('yellow', 1 - q); ctx.beginPath(); ctx.arc(x0 + 17 + (i % 10) * step, y0 + 17 + Math.floor(i / 10) * step, 11 + 22 * q, 0, TAU); ctx.stroke(); } }
      // Decay curve with the half-lives marked.
      const gx = X0 + 460; const gy = Y0 + 140; const gw = 300; const gh = 300;
      axes(ctx, gx, gy, gw, gh, 'time', 'undecayed');
      const px = (q) => gx + q * gw; const py = (n) => gy + gh - (n / 100) * gh;
      for (let k = 1; k <= 3; k++) {
        const x = px(k / 4); const y = py(100 * 0.5 ** k);
        ctx.strokeStyle = 'rgba(200,215,255,0.35)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(x, gy + gh); ctx.lineTo(x, y); ctx.lineTo(gx, y); ctx.stroke(); ctx.setLineDash([]);
        label(ctx, `${fx(k * hl, k * hl < 10 ? 1 : 0)}`, x, gy + gh + 18, { size: 16, weight: 600, fill: 'muted' });
        label(ctx, `${100 * 0.5 ** k}`, gx - 8, y, { size: 16, weight: 600, fill: 'muted', align: 'right' });
      }
      ctx.save(); ctx.globalAlpha *= 0.3; trace(ctx, 60, px, (q) => py(100 * 0.5 ** (q * 4)), 'green', 2); ctx.restore();
      const qn = Math.min(1, tau / (4 * T));
      glow(ctx, COLORS.green, 10); trace(ctx, 60, px, (q) => py(100 * 0.5 ** (q * 4)), 'green', 4, qn); ctx.shadowBlur = 0;
      if (tau <= 4 * T) dot(ctx, px(qn), py(count), 7, 'orange');
      chip(ctx, `undecayed: ${count} of 100`, X0 + 210, Y0 + 530, 'green');
      chip(ctx, `time = ${fx((tau / T) * hl, 1)} ${unit} (${fx(tau / T, 2)} half-lives)`, X0 + 590, Y0 + 530, 'ink', 19);
      wrapLabel(ctx, `Each nucleus decays at random, but every half-life (${fx(hl, hl % 1 ? 1 : 0)} ${unit}) about half of those left decay`, X0 + 40, Y0 + 620, FIG.w - 80, 20, 'center', 'muted', 500);
      ctx.restore();
    },

    // Alpha, beta and gamma fired at paper, aluminium and lead: how far each one gets.
    'radiation-penetration'(b, ctx, it, t) {
      const rows = [['alpha (α)', 'α', Y0 + 220, 160, 'red'], ['beta (β)', 'β', Y0 + 400, 320, 'cyan'], ['gamma (γ)', 'γ', Y0 + 580, 480, 'purple']];
      const bars = [['paper', X0 + 300, 6, 'rgba(233,238,255,0.85)'], ['aluminium', X0 + 470, 22, 'rgba(170,180,200,0.75)'], ['lead', X0 + 640, 50, 'rgba(90,100,125,0.95)']];
      const Te = 0.45; const c = b.clock; const now = Math.floor(c / Te);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'How far do alpha, beta and gamma get?');
      for (const [name, x, w, fill] of bars) { ctx.fillStyle = fill; ctx.fillRect(x, Y0 + 130, w, 530); label(ctx, name, x + w / 2, Y0 + 106, { size: 19, weight: 700, fill: 'ink' }); }
      rows.forEach(([name, sym, y, v, col], ri) => {
        ctx.fillStyle = tint(col, 0.3); ctx.strokeStyle = color(col); ctx.lineWidth = 2.5; rounded(ctx, X0 + 40, y - 30, 70, 60, 10); ctx.fill(); ctx.stroke();
        label(ctx, sym, X0 + 75, y + 1, { size: 28, weight: 700, fill: col });
        label(ctx, name, X0 + 40, y - 50, { size: 18, weight: 700, fill: col, align: 'left' });
        const stop = ri === 0 ? X0 + 300 - 9 : ri === 1 ? X0 + 470 - 5 : X0 + 665;
        for (let k = 0; k < 40; k++) {
          const idx = now - k; const age = c - idx * Te; const x = X0 + 112 + v * age;
          const absorbed = ri < 2 || mod(idx, 2) === 0;
          if (absorbed && x >= stop) {
            const late = age - (stop - X0 - 112) / v;
            if (late < 0.3) { ctx.strokeStyle = tint(col, 1 - late / 0.3); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(stop, y, 6 + 40 * late, 0, TAU); ctx.stroke(); }
            if (late > 2) break;
            continue;
          }
          if (x > X1 - 10) break;
          if (ri === 0) dot(ctx, x, y, 9, col);
          else if (ri === 1) dot(ctx, x, y, 5, col);
          else { ctx.strokeStyle = color(col); ctx.lineWidth = 2.5; ctx.beginPath(); for (let s2 = 0; s2 <= 36; s2 += 3) { const yy = y - 6 * Math.sin(s2 * 0.52) * Math.sin((Math.PI * s2) / 36); if (s2) ctx.lineTo(x - s2, yy); else ctx.moveTo(x, yy); } ctx.stroke(); }
        }
      });
      label(ctx, 'Alpha: stopped by paper. Beta: by a few mm of aluminium. Gamma: only reduced by lead', cx, Y0 + 686, { size: 17, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Alpha particles fired at gold: most fly straight through, a few are flung back by the tiny nucleus.
    rutherford(b, ctx, it, t) {
      const Nx = X0 + 470; const Ny = Y0 + 330; const d = 36; const v0 = 260; const P = 4.2;
      const g = it._ru || (it._ru = (() => {
        const out = [];
        for (const bb of [-150, -95, -55, -28, -10, 4, 16, 38, 70, 120, 170]) {
          const ab = Math.abs(bb); const pe = 2 * Math.atan(d / (2 * ab)); const sg = bb > 0 ? -1 : 1;
          const xs = []; const ys = []; const ts = []; let tt = 0; let px = null; let py = null;
          for (let k = 1; k < 420; k++) {
            const phi = Math.PI - (Math.PI - pe) * (k / 420);
            const u = Math.sin(phi) / ab - (d / (2 * ab * ab)) * (1 + Math.cos(phi));
            if (u <= 0) continue;
            const r = 1 / u; const x = Nx + r * Math.cos(phi); const y = Ny + sg * r * Math.sin(phi);
            if (x < X0 + 20 || x > X1 - 20 || y < Y0 + 60 || y > Y0 + 610) { if (xs.length) break; continue; }
            if (px !== null) tt += Math.hypot(x - px, y - py) / (v0 * Math.sqrt(Math.max(0.05, 1 - d / r)));
            xs.push(x); ys.push(y); ts.push(tt); px = x; py = y;
          }
          out.push({ xs: Float32Array.from(xs), ys: Float32Array.from(ys), ts: Float32Array.from(ts), T: tt });
        }
        return out;
      })());
      const find = (ts, v) => { let lo = 0; let hi = ts.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ts[m] <= v) lo = m; else hi = m; } return lo; };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Rutherford scattering: alpha particles and gold');
      ctx.fillStyle = 'rgba(251,191,36,0.1)'; ctx.fillRect(Nx - 8, Y0 + 70, 16, 530);
      ctx.strokeStyle = 'rgba(251,191,36,0.25)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.arc(Nx, Ny, 120, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(251,113,133,0.18)'; ctx.lineWidth = 2; ctx.beginPath();
      for (const p of g) { if (p.xs.length < 2) continue; ctx.moveTo(p.xs[0], p.ys[0]); for (let i = 1; i < p.xs.length; i++) ctx.lineTo(p.xs[i], p.ys[i]); }
      ctx.stroke();
      ctx.strokeStyle = COLORS.red; ctx.lineWidth = 3; ctx.lineCap = 'round';
      g.forEach((p, k) => {
        if (p.xs.length < 2) return;
        const tl = mod(b.clock - k * 0.61, P); if (tl > p.T) return;
        const i1 = find(p.ts, tl); const i0 = find(p.ts, Math.max(0, tl - 0.3));
        ctx.beginPath(); ctx.moveTo(p.xs[i0], p.ys[i0]); for (let i = i0 + 1; i <= i1; i++) ctx.lineTo(p.xs[i], p.ys[i]); ctx.stroke();
        ctx.fillStyle = COLORS.red; ctx.beginPath(); ctx.arc(p.xs[i1], p.ys[i1], 6, 0, TAU); ctx.fill();
      });
      dot(ctx, Nx, Ny, 8, 'orange', 18);
      label(ctx, 'nucleus (+)', Nx + 26, Ny, { size: 18, weight: 700, fill: 'orange', align: 'left' });
      label(ctx, 'alpha beam →', X0 + 30, Y0 + 85, { size: 18, weight: 600, fill: 'red', align: 'left' });
      label(ctx, 'A few bounce right back', X0 + 30, Y0 + 650, { size: 19, weight: 700, fill: 'red', align: 'left' });
      label(ctx, 'Most go straight through', X1 - 30, Y0 + 650, { size: 19, weight: 700, fill: 'ink', align: 'right' });
      label(ctx, 'So the atom is mostly empty space, with a tiny, heavy, positive nucleus', cx, Y0 + 688, { size: 17, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // An electron drops between energy levels and gives out one photon: bigger drop, bluer light.
    'energy-levels'(b, ctx, it, t) {
      const LV = [0, Y0 + 600, Y0 + 400, Y0 + 290, Y0 + 225]; const yInf = Y0 + 150;
      const E = (n) => -13.6 / (n * n);
      const list = [[3, 2], [4, 2], [2, 1], [4, 3], [3, 1]];
      let up; let lo;
      if (it.from !== undefined && it.to !== undefined) { up = clamp(Math.round(val(it.from, 3)), 2, 4); lo = clamp(Math.round(val(it.to, 2)), 1, up - 1); } else [up, lo] = list[Math.floor(b.clock / 3) % list.length];
      const ph = mod(b.clock, 3);
      const dE = E(up) - E(lo); const lam = 1240 / dE; const vis = lam >= 380 && lam <= 750;
      const name = lam < 380 ? 'ultraviolet' : lam < 450 ? 'violet' : lam < 495 ? 'blue-green' : lam < 570 ? 'green' : lam < 620 ? 'orange' : lam <= 750 ? 'red' : 'infrared';
      const lx0 = X0 + 230; const lx1 = X0 + 520; const ex = X0 + 400;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Energy levels: an electron drops, a photon leaves');
      line(ctx, lx0, yInf, lx1, yInf, 'rgba(200,215,255,0.35)', 2, [6, 6]);
      label(ctx, 'n = ∞    0 eV', lx0 - 14, yInf, { size: 17, weight: 600, fill: 'muted', align: 'right' });
      for (let n = 1; n <= 4; n++) {
        const on = n === up || n === lo;
        line(ctx, lx0, LV[n], lx1, LV[n], on ? 'rgba(233,238,255,0.95)' : 'rgba(200,215,255,0.45)', on ? 4 : 3);
        label(ctx, `n = ${n}   ${fx(E(n), 2)} eV`, lx0 - 14, LV[n], { size: 17, weight: on ? 700 : 600, fill: on ? 'ink' : 'muted', align: 'right' });
      }
      const ey = ph < 0.5 ? LV[up] : ph < 0.9 ? LV[up] + (LV[lo] - LV[up]) * smooth((ph - 0.5) / 0.4) : LV[lo];
      if (ph > 0.5) { ctx.save(); ctx.globalAlpha *= after(ph, 0.5, 0.3); ctx.setLineDash([5, 5]); arr(ctx, ex + 34, LV[up] + 6, ex + 34, LV[lo] - 6, 'green', 3); ctx.setLineDash([]); ctx.restore(); }
      dot(ctx, ex, ey - 10, 9, 'cyan', 16);
      if (ph > 0.9) {
        const xmin = lx1 + 12; const xp = Math.min(X1 - 40, xmin + (ph - 0.9) * 260); const yp = (LV[up] + LV[lo]) / 2;
        const lp = clamp(lam / 25, 6, 40); const col = vis ? waveRGB(lam) : lam < 380 ? COLORS.purple : COLORS.red;
        ctx.save(); ctx.globalAlpha *= 1 - clamp((ph - 2.6) / 0.4);
        glow(ctx, col, 14); ctx.strokeStyle = col; ctx.lineWidth = 3; if (!vis) ctx.setLineDash([6, 4]);
        ctx.beginPath(); let pen = false; for (let s = 0; s <= 110; s += 2) { if (xp - s < xmin) break; const y = yp - 14 * Math.sin((s * TAU) / lp) * Math.sin((Math.PI * s) / 110); if (pen) ctx.lineTo(xp - s, y); else { ctx.moveTo(xp - s, y); pen = true; } } ctx.stroke();
        ctx.setLineDash([]); ctx.shadowBlur = 0;
        if (xp > xmin + 20) label(ctx, `${name} photon`, Math.max(xp - 55, xmin + 80), yp - 34, { size: 18, weight: 700, fill: col });
        ctx.restore();
      }
      chip(ctx, `ΔE = E${up} − E${lo} = ${fx(dE, 2)} eV`, X0 + 230, Y0 + 655, 'green', 19);
      chip(ctx, `λ = hc ÷ ΔE = ${fx(lam, 0)} nm (${name})`, X0 + 590, Y0 + 655, vis ? waveRGB(lam) : 'purple', 19);
      ctx.restore();
    },

    // Light on a metal: electrons come off only if each photon has more energy than the work function.
    photoelectric(b, ctx, it, t) {
      const phi = clamp(val(it.workFunction ?? it.phi, 2.3), 0.5, 8); const h = 4.136e-15;
      const fAt = (c) => (it.frequency !== undefined ? clamp(val(it.frequency, 6), 1, 30) : 4.3 + 4.2 * (0.5 - 0.5 * Math.cos(c * 0.35))) * 1e14;
      const f = fAt(b.clock); const E = h * f; const lam = (3e8 / f) * 1e9; const emits = E > phi;
      const col = waveRGB(lam);
      const lx = X0 + 110; const ly = Y0 + 150; const pyT = Y0 + 470;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The photoelectric effect');
      ctx.fillStyle = waveRGB(lam, 0.12); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(X0 + 300, pyT); ctx.lineTo(X0 + 520, pyT); ctx.closePath(); ctx.fill();
      const pg = ctx.createLinearGradient(0, pyT, 0, pyT + 40); pg.addColorStop(0, '#c9d2e6'); pg.addColorStop(1, '#5d6782');
      ctx.fillStyle = pg; ctx.fillRect(X0 + 150, pyT, 500, 40);
      label(ctx, `metal plate: work function φ = ${fx(phi, 2)} eV`, X0 + 400, pyT + 66, { size: 18, weight: 600, fill: 'muted' });
      glow(ctx, col, 26); dot(ctx, lx, ly, 24, col); ctx.shadowBlur = 0;
      const ang = Math.atan2(pyT - ly, X0 + 410 - lx); const lp = clamp(lam / 40, 6, 20);
      ctx.strokeStyle = col; ctx.lineWidth = 2.5;
      for (let k = 0; k < 6; k++) {
        const s = mod(b.clock * 0.9 + k / 6, 1); const tx = X0 + 320 + (k / 5) * 180;
        const x = lx + (tx - lx) * s; const y = ly + (pyT - ly) * s;
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.beginPath();
        for (let q = 0; q <= 26; q += 2) { const yy = -6 * Math.sin((q * TAU) / lp) * Math.sin((Math.PI * q) / 26); if (q) ctx.lineTo(-q, yy); else ctx.moveTo(0, yy); }
        ctx.stroke(); ctx.restore();
      }
      // Electrons: each one checked against the light at the moment it would leave.
      const Te = 0.2; const now = Math.floor(b.clock / Te);
      ctx.fillStyle = COLORS.cyan; ctx.beginPath();
      for (let k = 0; k < 14; k++) {
        const idx = now - k; const te = idx * Te; const age = b.clock - te; const ke = h * fAt(te) - phi;
        if (ke <= 0) continue;
        const sp = 60 + 160 * Math.sqrt(ke / 2); const a = -Math.PI / 2 + (rnd(idx + 77) - 0.5) * 1.4;
        const x = X0 + 320 + rnd(idx) * 180 + Math.cos(a) * sp * age; const y = pyT - 4 + Math.sin(a) * sp * age;
        if (y < Y0 + 60 || x < X0 + 10 || x > X1 - 10) continue;
        ctx.moveTo(x + 6, y); ctx.arc(x, y, 6, 0, TAU);
      }
      ctx.fill();
      chip(ctx, `f = ${fx(f / 1e14, 1)} × 10¹⁴ Hz (λ = ${fx(lam, 0)} nm)`, X0 + 600, Y0 + 130, 'ink', 18);
      chip(ctx, `photon energy hf = ${fx(E, 2)} eV`, X0 + 600, Y0 + 185, 'green', 19);
      chip(ctx, `work function φ = ${fx(phi, 2)} eV`, X0 + 600, Y0 + 240, 'orange', 19);
      chip(ctx, emits ? `hf > φ: electrons fly off, max KE = ${fx(E - phi, 2)} eV` : 'hf < φ: no electrons, however bright the light', cx, Y0 + 610, emits ? 'cyan' : 'red', 20);
      label(ctx, `Threshold frequency f₀ = φ ÷ h = ${fx(phi / h / 1e14, 2)} × 10¹⁴ Hz`, cx, Y0 + 662, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // The life cycle of stars: a Sun-like path and a massive-star path, lit up stage by stage.
    'star-life'(b, ctx, it, t) {
      const S = { nebula: [X0 + 85, Y0 + 350, 50, 'nebula'], main: [X0 + 225, Y0 + 350, 28, 'main sequence'], giant: [X0 + 410, Y0 + 230, 48, 'red giant'], pn: [X0 + 580, Y0 + 230, 34, 'planetary nebula'], wd: [X0 + 735, Y0 + 230, 9, 'white dwarf'], sg: [X0 + 410, Y0 + 560, 58, 'red supergiant'], sn: [X0 + 580, Y0 + 560, 46, 'supernova'], ns: [X0 + 735, Y0 + 490, 8, 'neutron star'], bh: [X0 + 735, Y0 + 630, 18, 'black hole'] };
      const links = [['nebula', 'main'], ['main', 'giant'], ['giant', 'pn'], ['pn', 'wd'], ['main', 'sg'], ['sg', 'sn'], ['sn', 'ns'], ['sn', 'bh']];
      const lap = Math.floor(b.clock / 12); const inLap = mod(b.clock, 12); const massive = inLap >= 6;
      const path = massive ? ['nebula', 'main', 'sg', 'sn', lap % 2 ? 'bh' : 'ns'] : ['nebula', 'main', 'giant', 'pn', 'wd'];
      const stage = Math.min(4, Math.floor(mod(inLap, 6) / 1.2)); const active = path[stage]; const prev = stage ? path[stage - 1] : null;
      const sp = mod(inLap, 1.2) / 1.2;
      const g = it._sl || (it._sl = (() => { const pts = []; for (let k = 0; k < 22; k++) pts.push([(rnd(k) - 0.5) * 80, (rnd(k + 40) - 0.5) * 70, 8 + rnd(k + 80) * 12]); return pts; })());
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The life cycle of a star');
      label(ctx, 'Stars about the size of the Sun', X0 + 580, Y0 + 130, { size: 19, weight: 700, fill: 'yellow' });
      label(ctx, 'Massive stars (over about 8 Suns)', X0 + 560, Y0 + 445, { size: 19, weight: 700, fill: 'red' });
      for (const [a, z] of links) {
        const A = S[a]; const B = S[z]; const dx = B[0] - A[0]; const dy = B[1] - A[1]; const L = Math.hypot(dx, dy); const ux = dx / L; const uy = dy / L;
        const on = a === prev && z === active;
        const x0 = A[0] + ux * (A[2] + 10); const y0 = A[1] + uy * (A[2] + 10); const x1 = B[0] - ux * (B[2] + 12); const y1 = B[1] - uy * (B[2] + 12);
        arr(ctx, x0, y0, x1, y1, on ? COLORS.ink : 'rgba(200,215,255,0.35)', on ? 4 : 2.5);
        if (on) dot(ctx, x0 + (x1 - x0) * sp, y0 + (y1 - y0) * sp, 5, 'ink');
      }
      const c = b.clock;
      for (const [key, [x, y, r, nm]] of Object.entries(S)) {
        const on = key === active;
        if (on) { glow(ctx, COLORS.ink, 20); ctx.strokeStyle = 'rgba(233,238,255,0.9)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, r + 10, 0, TAU); ctx.stroke(); ctx.shadowBlur = 0; }
        if (key === 'nebula') { for (const [dx, dy, rr] of g) { ctx.fillStyle = `rgba(167,139,250,${0.18 + 0.06 * Math.sin(c + dx)})`; ctx.beginPath(); ctx.arc(x + dx * 0.55, y + dy * 0.55, rr, 0, TAU); ctx.fill(); } }
        else if (key === 'main') dot(ctx, x, y, r, 'yellow');
        else if (key === 'giant') dot(ctx, x, y, r, '#ff8a4c');
        else if (key === 'pn') { ctx.strokeStyle = tint('teal', 0.8); ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x, y, r - 6, 0, TAU); ctx.stroke(); dot(ctx, x, y, 4, '#ffffff'); }
        else if (key === 'wd') dot(ctx, x, y, r, '#ffffff');
        else if (key === 'sg') dot(ctx, x, y, r, '#d9363e');
        else if (key === 'sn') { const k = 1 + 0.12 * Math.sin(c * 5); ctx.fillStyle = '#fff2b0'; ctx.beginPath(); for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; const rr = (i % 2 ? r * 0.45 : r) * k; if (i) ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else ctx.moveTo(x + rr, y); } ctx.closePath(); ctx.fill(); }
        else if (key === 'ns') { dot(ctx, x, y, r, 'cyan'); const a = c * 4; line(ctx, x - Math.cos(a) * 30, y - Math.sin(a) * 30, x + Math.cos(a) * 30, y + Math.sin(a) * 30, 'rgba(34,211,238,0.6)', 2); }
        else if (key === 'bh') { ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, r + 14, 7, -0.3, 0, TAU); ctx.stroke(); dot(ctx, x, y, r, '#000000'); ctx.strokeStyle = 'rgba(255,159,67,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
        const ny = key === 'main' ? y - r - 22 : y + r + 22;
        label(ctx, nm, x, ny, { size: 17, weight: on ? 700 : 500, fill: on ? 'ink' : 'muted' });
      }
      ctx.restore();
    },

    // A galaxy moving away: its spectral lines slide towards the red end; z = Δλ / λ = v / c.
    redshift(b, ctx, it, t) {
      const tau = cycle(t, 8, 0.4); const z = it.z !== undefined ? clamp(val(it.z, 0.05), 0, 0.14) : 0.1 * smooth(tau / 6);
      const LINES = [410, 434, 486, 656];
      const sx0 = X0 + 60; const sw = FIG.w - 120; const nmx = (nm) => sx0 + ((nm - 380) / 370) * sw;
      const strip = (y) => {
        const gr = ctx.createLinearGradient(sx0, 0, sx0 + sw, 0);
        for (let k = 0; k <= 9; k++) { const nm = 380 + (370 * k) / 9; gr.addColorStop(k / 9, waveRGB(nm, 0.9)); }
        ctx.fillStyle = gr; ctx.fillRect(sx0, y, sw, 60);
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Red-shift: galaxies moving away');
      dot(ctx, X0 + 50, Y0 + 150, 6, 'ink'); label(ctx, 'us', X0 + 50, Y0 + 176, { size: 17, weight: 600, fill: 'muted' });
      const gx = X0 + 160 + z * 2600; const gy = Y0 + 150; const k = 1 - z * 4;
      ctx.save(); ctx.translate(gx, gy); ctx.scale(k, k); ctx.rotate(-0.3);
      glow(ctx, '#ffe9b0', 24); ctx.fillStyle = 'rgba(255,233,176,0.9)'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 12, 0, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(167,139,250,0.7)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, 0, 60, 26, 0, 0.2, 2.6); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 0, 60, 26, 0, 3.3, 5.8); ctx.stroke();
      ctx.restore();
      if (z > 0.004) arr(ctx, gx + 70 * k, gy, gx + 70 * k + 30 + z * 500, gy, 'cyan', 4);
      label(ctx, 'lab: a source that is not moving', sx0, Y0 + 268, { size: 18, weight: 600, fill: 'muted', align: 'left' });
      label(ctx, 'light from the galaxy', sx0, Y0 + 418, { size: 18, weight: 600, fill: 'muted', align: 'left' });
      strip(Y0 + 290); strip(Y0 + 440);
      ctx.fillStyle = '#05060f';
      for (const nm of LINES) { ctx.fillRect(nmx(nm) - 2.5, Y0 + 290, 5, 60); const s = nm * (1 + z); if (s <= 750) ctx.fillRect(nmx(s) - 2.5, Y0 + 440, 5, 60); }
      if (z > 0.005) {
        ctx.strokeStyle = 'rgba(233,238,255,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]); ctx.beginPath();
        for (const nm of LINES) { const s = nm * (1 + z); if (s <= 750) { ctx.moveTo(nmx(nm), Y0 + 354); ctx.lineTo(nmx(s), Y0 + 436); } }
        ctx.stroke(); ctx.setLineDash([]);
      }
      label(ctx, '400 nm', nmx(400), Y0 + 520, { size: 16, weight: 600, fill: 'muted' });
      label(ctx, '700 nm', nmx(700), Y0 + 520, { size: 16, weight: 600, fill: 'muted' });
      chip(ctx, `z = Δλ ÷ λ = ${z.toFixed(3)}`, X0 + 220, Y0 + 585, 'red', 20);
      chip(ctx, `speed ≈ z × c = ${String(Math.round(z * 300000)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} km/s`, X0 + 570, Y0 + 585, 'cyan', 20);
      label(ctx, 'Further galaxies show bigger red-shifts: the universe is expanding', cx, Y0 + 650, { size: 19, weight: 500, fill: 'muted' });
      ctx.restore();
    },
  };
}
