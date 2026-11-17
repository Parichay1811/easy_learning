// Engineering simulations for the board: simple machines (pulleys, gears,
// hydraulics), structures (bridges), engines and vehicles (the four-stroke
// engine, rockets, wings, submarines, electric cars, maglev), energy (wind,
// solar, hydroelectric, the power grid), making things (3D printing, robot
// arms), canal locks and control systems. Each is a function of time (t since
// it appeared, b.clock for the loop), so any moment can be drawn: plain canvas
// calls, a few glows, no state between frames beyond constants cached on the
// item. ENGINEERING_SIMS says what each one is for, so a lesson's words can
// pick the right picture.

export const ENGINEERING_SIMS = {
  'pulley-system': { title: 'Pulleys and mechanical advantage', keywords: ['pulley system', 'pulleys', 'block and tackle', 'mechanical advantage', 'movable pulley', 'fixed pulley', 'compound pulley'], example: { load: 100 } },
  'gear-train': { title: 'Gear trains and gear ratio', keywords: ['gear train', 'gear ratio', 'meshing gears', 'driver gear', 'driven gear', 'idler gear', 'how gears work', 'number of teeth'], example: { teeth: [12, 24, 16] } },
  'bridge-types': { title: 'Bridges: compression and tension', keywords: ['types of bridges', 'bridge types', 'suspension bridge', 'arch bridge', 'beam bridge', 'truss bridge', 'compression and tension', 'bridge design'], example: {} },
  'hydraulic-press': { title: 'Hydraulic press', keywords: ['hydraulic press', 'hydraulic jack', 'hydraulic lift', 'hydraulic system', 'hydraulics', "pascal's principle", 'force multiplier', 'car jack'], example: { force: 500, small: 0.005, big: 0.1 } },
  'four-stroke-engine': { title: 'Four-stroke engine', keywords: ['four-stroke engine', 'four stroke engine', 'four-stroke cycle', 'internal combustion engine', 'petrol engine', 'compression stroke', 'power stroke', 'spark plug'], example: {} },
  'wind-turbine': { title: 'Wind turbine', keywords: ['wind turbine', 'wind turbines', 'wind power', 'wind farm', 'wind energy', 'nacelle'], example: {} },
  'rocket-thrust': { title: 'How a rocket flies', keywords: ['rocket', 'rocket launch', 'rocket thrust', 'how rockets work', 'rocket stages', 'multistage rocket', 'rocket engine', "newton's third law"], example: {} },
  'wing-lift': { title: 'How a wing makes lift', keywords: ['how planes fly', 'how aeroplanes fly', 'how airplanes fly', 'lift force', 'aerofoil', 'airfoil', 'four forces of flight', 'wing shape'], example: {} },
  'submarine-ballast': { title: 'Submarine ballast tanks', keywords: ['submarine', 'submarines', 'ballast tank', 'ballast tanks', 'how submarines dive', 'neutral buoyancy'], example: {} },
  'electric-car': { title: 'Electric car energy flow', keywords: ['electric car', 'electric cars', 'electric vehicle', 'electric vehicles', 'regenerative braking', 'ev battery', 'battery-powered car'], example: {} },
  'solar-panel': { title: 'Solar panel', keywords: ['solar panel', 'solar panels', 'solar cell', 'solar cells', 'photovoltaic', 'solar power', 'p-n junction'], example: {} },
  'hydro-dam': { title: 'Hydroelectric dam', keywords: ['hydroelectric', 'hydroelectric power', 'hydroelectric dam', 'hydropower', 'hydro power', 'penstock', 'dam and reservoir'], example: {} },
  '3d-printer': { title: '3D printing', keywords: ['3d printer', '3d printing', '3-d printing', 'additive manufacturing', 'layer by layer', 'printer filament', 'fused deposition'], example: { layers: 14 } },
  'robot-arm': { title: 'Robot arm', keywords: ['robot arm', 'robotic arm', 'robot arms', 'industrial robot', 'inverse kinematics', 'pick and place', 'robotics'], example: {} },
  'canal-lock': { title: 'Canal lock', keywords: ['canal lock', 'canal locks', 'lock gates', 'lock chamber', 'how locks work', 'panama canal', 'narrowboat'], example: {} },
  'feedback-loop': { title: 'Feedback control loop', keywords: ['feedback loop', 'feedback control', 'control system', 'control systems', 'thermostat', 'closed-loop control', 'closed loop control', 'pid controller'], example: { setpoint: 20, start: 12 } },
  'power-grid': { title: 'The power grid', keywords: ['national grid', 'power grid', 'electricity grid', 'electrical grid', 'power lines', 'pylons', 'step-up transformer', 'transmission lines'], example: {} },
  'maglev-train': { title: 'Maglev train', keywords: ['maglev', 'maglev train', 'magnetic levitation', 'levitating train', 'bullet train', 'high-speed train'], example: {} },
};

export function engineeringSims(kit) {
  // eslint-disable-next-line no-unused-vars
  const { FIG, COL, COLORS, HUES, FONT, glow, label, wrapLabel, rounded, arrow, clamp, easeOut, outBack, color, tint } = kit;
  const X0 = FIG.x; const Y0 = FIG.y; const X1 = FIG.x + FIG.w; const Y1 = FIG.y + FIG.h;
  const cx = X0 + FIG.w / 2;
  const TAU = Math.PI * 2;
  const LINE = 'rgba(220,230,255,0.8)'; const DARK = '#070b1d';

  // Small tools: numbers, timing, loops.
  const val = (v, d) => { const n = Number(v); return v !== null && v !== undefined && v !== '' && Number.isFinite(n) ? n : d; };
  const mod = (a, n) => ((a % n) + n) % n;
  const smooth = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
  const lerp = (a, c, p) => a + (c - a) * p;
  const fade = (ctx, t, d = 0.5) => { const q = easeOut(clamp(t / d)); ctx.globalAlpha *= q; return q; };
  const after = (t, at0, d = 0.4) => easeOut(clamp((t - at0) / d));
  const cycle = (t, period, delay = 0.6) => (t < delay ? 0 : mod(t - delay, period));
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const nums = (v, d) => { const a = Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[\s,;]+/) : []; const out = a.map(Number).filter(Number.isFinite); return out.length >= 2 ? out : d; };
  const group = (n) => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const num = (n) => (Math.abs(n - Math.round(n)) < 1e-6 ? group(n) : n.toFixed(1));

  // Drawing helpers in the board's holo style.
  const title = (ctx, text) => label(ctx, String(text), cx, Y0 + 28, { size: 26, weight: 700, fill: 'ink' });
  function chip(ctx, text, x, y, c = 'ink', size = 21, align = 'center') {
    text = String(text);
    ctx.font = `700 ${size}px ${FONT}`;
    const w = ctx.measureText(text).width + 24; const h = size + 14;
    const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.fillStyle = 'rgba(5,8,22,0.82)'; ctx.strokeStyle = tint(c, 0.55); ctx.lineWidth = 1.5;
    rounded(ctx, left, y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
    label(ctx, text, left + w / 2, y + 1, { size, weight: 700, fill: c });
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
  // Stroke a path from distance d0 to d1.
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
  // Dots running along a path: n of them, offset (0..1) moves them on.
  function pulses(ctx, p, n, off, c, r = 5, blur = 0) {
    if (blur) glow(ctx, color(c), blur);
    ctx.fillStyle = color(c);
    for (let i = 0; i < n; i++) { const P = at(p, mod(off + i / n, 1) * p.total); ctx.beginPath(); ctx.arc(P.x, P.y, r, 0, TAU); ctx.fill(); }
    if (blur) ctx.shadowBlur = 0;
  }
  // A curved arrow round (x, y) from angle a0 to a1 (screen angles).
  function arcArrow(ctx, x, y, r, a0, a1, c, w = 4) {
    const dir = a1 > a0 ? 1 : -1; const aEnd = a1 - dir * 0.16;
    ctx.strokeStyle = color(c); ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r, a0, aEnd, dir < 0); ctx.stroke();
    const ex = x + Math.cos(a1) * r; const ey = y + Math.sin(a1) * r;
    const ta = a1 + (dir * Math.PI) / 2; const hd = 15;
    ctx.fillStyle = color(c); ctx.beginPath();
    ctx.moveTo(ex + Math.cos(ta) * 3, ey + Math.sin(ta) * 3);
    ctx.lineTo(ex - Math.cos(ta - 0.5) * hd, ey - Math.sin(ta - 0.5) * hd);
    ctx.lineTo(ex - Math.cos(ta + 0.5) * hd, ey - Math.sin(ta + 0.5) * hd);
    ctx.closePath(); ctx.fill();
  }
  // A spur gear: N teeth, module m (pitch radius N*m/2), tooth 0 at angle ang.
  function gear(ctx, x, y, N, m, ang, c, marker = true) {
    const r = (N * m) / 2; const rr = r - 1.25 * m; const rt = r + m; const p = TAU / N;
    ctx.beginPath();
    for (let k = 0; k < N; k++) {
      const a = ang + k * p;
      const a1 = a - 0.3 * p; const a2 = a - 0.13 * p; const a3 = a + 0.13 * p; const a4 = a + 0.3 * p;
      if (k) ctx.lineTo(x + Math.cos(a1) * rr, y + Math.sin(a1) * rr); else ctx.moveTo(x + Math.cos(a1) * rr, y + Math.sin(a1) * rr);
      ctx.lineTo(x + Math.cos(a2) * rt, y + Math.sin(a2) * rt);
      ctx.lineTo(x + Math.cos(a3) * rt, y + Math.sin(a3) * rt);
      ctx.lineTo(x + Math.cos(a4) * rr, y + Math.sin(a4) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = tint(c, 0.22); ctx.strokeStyle = color(c); ctx.lineWidth = 2.5; ctx.fill(); ctx.stroke();
    ctx.strokeStyle = tint(c, 0.6); ctx.lineWidth = 2;
    if (r > 45) {
      ctx.fillStyle = DARK;
      for (let i = 0; i < 5; i++) { const a = ang + (i + 0.5) * (TAU / 5); ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.52, y + Math.sin(a) * r * 0.52, r * 0.17, 0, TAU); ctx.fill(); ctx.stroke(); }
    } else {
      ctx.beginPath();
      for (let i = 0; i < 4; i++) { const a = ang + (i + 0.5) * (TAU / 4); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * rr * 0.8, y + Math.sin(a) * rr * 0.8); }
      ctx.stroke();
    }
    ctx.fillStyle = DARK; ctx.strokeStyle = color(c); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y, Math.max(5, r * 0.18), 0, TAU); ctx.fill(); ctx.stroke();
    dot(ctx, x, y, 3, 'ink');
    if (marker) dot(ctx, x + Math.cos(ang) * (rr - 7), y + Math.sin(ang) * (rr - 7), Math.max(4, m * 0.5), 'yellow');
  }
  // A wheel with a tyre and spokes turned to ang.
  function wheel(ctx, x, y, r, ang, c = 'muted') {
    ctx.fillStyle = '#0b1028'; ctx.strokeStyle = 'rgba(205,215,240,0.85)'; ctx.lineWidth = r * 0.24;
    ctx.beginPath(); ctx.arc(x, y, r * 0.88, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = color(c); ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i < 5; i++) { const a = ang + (i * TAU) / 5; ctx.moveTo(x + Math.cos(a) * r * 0.15, y + Math.sin(a) * r * 0.15); ctx.lineTo(x + Math.cos(a) * r * 0.68, y + Math.sin(a) * r * 0.68); }
    ctx.stroke(); dot(ctx, x, y, r * 0.16, c);
  }
  function house(ctx, x, yb, w, lit = 1) {
    const h = w * 0.6;
    ctx.fillStyle = tint('blue', 0.18); ctx.strokeStyle = tint('blue', 0.85); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.rect(x - w / 2, yb - h, w, h); ctx.fill(); ctx.stroke();
    ctx.fillStyle = tint('red', 0.3); ctx.strokeStyle = tint('red', 0.85);
    poly(ctx, [x - w / 2 - 6, yb - h, x, yb - h - w * 0.42, x + w / 2 + 6, yb - h], true); ctx.fill(); ctx.stroke();
    ctx.fillStyle = `rgba(251,191,36,${0.2 + 0.7 * lit})`;
    ctx.fillRect(x - w * 0.32, yb - h * 0.72, w * 0.24, w * 0.2); ctx.fillRect(x + w * 0.08, yb - h * 0.72, w * 0.24, w * 0.2);
    ctx.fillStyle = tint('blue', 0.5); ctx.fillRect(x - w * 0.08, yb - h * 0.42, w * 0.16, h * 0.42);
  }
  // A lattice pylon h tall standing at (x, yb).
  function pylon(ctx, x, yb, h, c = 'muted') {
    const top = yb - h; const wb = h * 0.2; const wt = h * 0.045;
    ctx.strokeStyle = tint(c, 0.95); ctx.lineWidth = 2.5; ctx.beginPath();
    ctx.moveTo(x - wb, yb); ctx.lineTo(x - wt, top + 12); ctx.lineTo(x, top); ctx.lineTo(x + wt, top + 12); ctx.lineTo(x + wb, yb);
    const n = 5;
    for (let i = 0; i < n; i++) {
      const ya = lerp(yb, top + 12, i / n); const yc = lerp(yb, top + 12, (i + 1) / n);
      const wa = lerp(wb, wt, i / n); const wc = lerp(wb, wt, (i + 1) / n);
      ctx.moveTo(x - wa, ya); ctx.lineTo(x + wc, yc); ctx.moveTo(x + wa, ya); ctx.lineTo(x - wc, yc);
    }
    const arm = h * 0.26;
    ctx.moveTo(x - arm, top + 22); ctx.lineTo(x + arm, top + 22); ctx.moveTo(x - arm * 0.8, top + 48); ctx.lineTo(x + arm * 0.8, top + 48);
    ctx.stroke();
    ctx.fillStyle = tint('cyan', 0.9);
    for (const sx of [-1, 1]) { ctx.fillRect(x + sx * arm - 2, top + 22, 4, 10); ctx.fillRect(x + sx * arm * 0.8 - 2, top + 48, 4, 10); }
  }

  return {
    // ─── Simple machines ──────────────────────────────────────────────────

    // One, two and four supporting ropes: the effort halves each time the
    // rope you must pull doubles, while the load rises the same height.
    'pulley-system'(b, ctx, it, t) {
      const W = Math.max(1, val(it.load, 100));
      const u = cycle(t, 6.5, 0.6);
      const h = 60 * (u < 2.6 ? smooth(u / 2.6) : u < 3.8 ? 1 : 1 - smooth((u - 3.8) / 2.2));
      const beamY = Y0 + 100; const top = beamY + 40; const boxTop = Y0 + 392 - h;
      const ROPE = 'rgba(240,226,190,0.95)';
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Pulleys and mechanical advantage');
      ctx.fillStyle = 'rgba(150,165,200,0.28)'; ctx.fillRect(X0 + 20, beamY - 14, FIG.w - 40, 14);
      line(ctx, X0 + 20, beamY, X1 - 20, beamY, LINE, 2);
      const pul = (x, y, r, a, fixed) => {
        if (fixed) line(ctx, x, beamY, x, y, 'rgba(200,210,235,0.8)', 4);
        ctx.fillStyle = DARK; ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = tint('cyan', 0.6); ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i < 3; i++) { const q = a + (i * TAU) / 3; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(q) * (r - 4), y + Math.sin(q) * (r - 4)); }
        ctx.stroke(); dot(ctx, x, y, 4, 'ink');
      };
      const box = (x) => {
        ctx.fillStyle = tint('purple', 0.3); ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 2.5;
        rounded(ctx, x - 45, boxTop, 90, 62, 8); ctx.fill(); ctx.stroke();
        label(ctx, `${num(W)} N`, x, boxTop + 32, { size: 20, weight: 800, fill: 'ink' });
      };
      const hand = (x, y, n) => {
        ctx.fillStyle = tint('orange', 0.5); ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2;
        rounded(ctx, x - 9, y - 4, 18, 22, 6); ctx.fill(); ctx.stroke();
        arr(ctx, x, y + 22, x, y + 22 + 84 / n, 'orange', 5);
      };
      const hold = (x0, y0, y1) => line(ctx, x0, y0, x0, y1, tint('teal', 0.9), 6);
      [1, 2, 4].forEach((n, i) => {
        const px = X0 + 135 + i * 265;
        ctx.save(); ctx.globalAlpha *= after(t, 0.2 + i * 0.25);
        chip(ctx, n === 1 ? '1 rope holds the load' : `${n} ropes hold it`, px, Y0 + 64, 'teal', 18);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = ROPE; ctx.lineWidth = 3.5; ctx.beginPath();
        if (n === 1) {
          const r = 30; const hy = Y0 + 290 + h;
          ctx.moveTo(px - r, boxTop - 14); ctx.lineTo(px - r, top); ctx.arc(px, top, r, Math.PI, 0); ctx.lineTo(px + r, hy); ctx.stroke();
          hold(px - r, top + 6, boxTop - 14);
          line(ctx, px - r, boxTop - 16, px - r, boxTop, 'rgba(200,210,235,0.9)', 3);
          pul(px, top, r, h / r, true); box(px - r); hand(px + r, hy, n);
        } else if (n === 2) {
          const r = 25; const my = boxTop - 50; const hy = Y0 + 262 + 2 * h; const fx = px + 15; const mx = px - 35;
          ctx.moveTo(px - 60, beamY); ctx.lineTo(px - 60, my); ctx.arc(mx, my, r, Math.PI, 0, true); ctx.lineTo(px - 10, top); ctx.arc(fx, top, r, Math.PI, 0); ctx.lineTo(px + 40, hy); ctx.stroke();
          hold(px - 60, beamY + 4, my); hold(px - 10, top + 6, my);
          dot(ctx, px - 60, beamY + 2, 5, 'ink');
          line(ctx, mx, my, mx, boxTop, 'rgba(200,210,235,0.9)', 4);
          pul(fx, top, r, (2 * h) / r, true); pul(mx, my, r, h / r, false); box(mx); hand(px + 40, hy, n);
        } else {
          const r = 16; const x0 = px - 80; const ly = boxTop - 46; const hy = Y0 + 228 + 4 * h;
          ctx.moveTo(x0, beamY); ctx.lineTo(x0, ly); ctx.arc(x0 + 16, ly, r, Math.PI, 0, true); ctx.lineTo(x0 + 32, top); ctx.arc(x0 + 48, top, r, Math.PI, 0);
          ctx.lineTo(x0 + 64, ly); ctx.arc(x0 + 80, ly, r, Math.PI, 0, true); ctx.lineTo(x0 + 96, top); ctx.arc(x0 + 112, top, r, Math.PI, 0); ctx.lineTo(x0 + 128, hy); ctx.stroke();
          hold(x0, beamY + 4, ly); hold(x0 + 32, top + 6, ly); hold(x0 + 64, top + 6, ly); hold(x0 + 96, top + 6, ly);
          dot(ctx, x0, beamY + 2, 5, 'ink');
          ctx.fillStyle = tint('muted', 0.35); ctx.strokeStyle = tint('muted', 0.9); ctx.lineWidth = 2; rounded(ctx, x0 + 6, ly - 7, 84, 14, 6); ctx.fill(); ctx.stroke();
          line(ctx, x0 + 48, ly, x0 + 48, boxTop, 'rgba(200,210,235,0.9)', 4);
          pul(x0 + 48, top, r, (1.5 * h) / r, true); pul(x0 + 112, top, r, (3.5 * h) / r, true);
          pul(x0 + 16, ly, r, (0.5 * h) / r, false); pul(x0 + 80, ly, r, (1.5 * h) / r, false);
          box(x0 + 48); hand(x0 + 128, hy, n);
        }
        label(ctx, `Effort ${num(W / n)} N`, px, Y0 + 534, { size: 22, weight: 800, fill: 'orange' });
        label(ctx, `Pull ${n} m of rope`, px, Y0 + 568, { size: 19, weight: 600, fill: 'ink' });
        label(ctx, `MA = ${n}`, px, Y0 + 598, { size: 19, weight: 700, fill: 'teal' });
        ctx.restore();
      });
      chip(ctx, 'Each lifts the load 1 m: more ropes, less effort', cx, Y0 + 640, 'teal', 20);
      label(ctx, `Work is the same: ${num(W)} N × 1 m = ${num(W / 2)} N × 2 m = ${num(W / 4)} N × 4 m`, cx, Y0 + 681, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Three meshing gears turning at speeds set by their teeth, each turning
    // the opposite way to its neighbour; turn counters prove the ratio.
    'gear-train'(b, ctx, it, t) {
      const C = it._c || (it._c = (() => {
        const N = nums(it.teeth, [12, 24, 16]).slice(0, 3).map((n) => clamp(Math.round(Math.abs(n)), 6, 48));
        const sum = N.reduce((a, n) => a + n, 0); const mx = Math.max(...N);
        const m = Math.min(620 / (sum + 2), 290 / (mx + 2));
        const r = N.map((n) => (n * m) / 2);
        const xs = []; let x = cx - (sum * m) / 2 + r[0];
        for (let i = 0; i < N.length; i++) { xs.push(x); if (i < N.length - 1) x += r[i] + r[i + 1]; }
        const gcd = (a, c) => (c ? gcd(c, a % c) : a); const g = gcd(N[1], N[0]);
        return { N, m, r, xs, rmax: Math.max(...r), ratio: `${N[1] / g} : ${N[0] / g}` };
      })());
      const { N, m, r, xs } = C; const gy = Y0 + 290;
      const run = Math.max(0, t - 0.8); const th = [run * TAU * 0.18];
      for (let i = 1; i < N.length; i++) th.push(-(N[i - 1] / N[i]) * th[i - 1] + Math.PI + Math.PI / N[i]);
      const COLS = ['cyan', 'orange', 'purple'];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Gear trains and gear ratio');
      N.forEach((n, i) => {
        ctx.save(); ctx.globalAlpha *= after(t, 0.15 + i * 0.2);
        gear(ctx, xs[i], gy, n, m, th[i], COLS[i]);
        const R = r[i] + m + 16; const cw = i % 2 === 0;
        arcArrow(ctx, xs[i], gy, R, cw ? -Math.PI / 2 - 0.45 : -Math.PI / 2 + 0.45, cw ? -Math.PI / 2 + 0.45 : -Math.PI / 2 - 0.45, COLS[i], 4);
        const ly = gy + C.rmax + m + 36;
        label(ctx, `${'ABC'[i]}${i === 0 ? ' (driver)' : ''}: ${n} teeth`, xs[i], ly, { size: 20, weight: 800, fill: COLS[i] });
        const turns = (run * 0.18 * N[0]) / n;
        label(ctx, `${turns.toFixed(1)} turns`, xs[i], ly + 32, { size: 20, weight: 700, fill: 'ink' });
        label(ctx, cw ? 'clockwise' : 'anticlockwise', xs[i], ly + 62, { size: 18, weight: 500, fill: 'muted' });
        ctx.restore();
      });
      ctx.save(); ctx.globalAlpha *= after(t, 0.9);
      chip(ctx, `Ratio ${C.ratio}, so B turns once for every ${num(N[1] / N[0])} turns of A`, cx, Y0 + 610, 'orange', 20);
      label(ctx, 'Meshing gears turn in opposite directions', cx, Y0 + 652, { size: 19, weight: 600, fill: 'ink' });
      label(ctx, 'The bigger gear turns slower, with more turning force', cx, Y0 + 685, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
      ctx.restore();
    },

    // ─── Structures ───────────────────────────────────────────────────────

    // Beam, arch, truss and suspension bridges in turn, a truck crossing each;
    // members that are squeezed glow red, members that are stretched glow blue.
    'bridge-types'(b, ctx, it, t) {
      const k = b.clock;
      const TYPES = [['beam', 'Beam bridge', 'The beam bends: its top squeezes, its bottom stretches'], ['arch', 'Arch bridge', 'The arch is squeezed and pushes out into the banks'], ['truss', 'Truss bridge', 'Triangles share the load: some bars push, some pull'], ['suspension', 'Suspension bridge', 'Cables pull up on the deck; towers push down']];
      const pick = String(it.kind || it.value || '').toLowerCase(); let ti = TYPES.findIndex(([key]) => pick.includes(key));
      const SEG = 5.5; let local;
      if (ti < 0) { const u = cycle(t, SEG * 4, 0.4); ti = Math.floor(u / SEG); local = u - ti * SEG; } else local = cycle(t, SEG, 0.4);
      const [key, name, info] = TYPES[ti];
      const Dy = Y0 + 330; const G = Dy + 26; const L0 = X0 + 70; const L1 = X1 - 70; const span = L1 - L0;
      const q = clamp((local - 0.3) / 4.8); const xt = lerp(X0 - 50, X1 + 50, q);
      const present = xt > L0 && xt < L1; const a = clamp((xt - L0) / span);
      const RED = COLORS.red; const BLUE = COLORS.blue;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Bridges: compression and tension');
      // Valley, banks and river.
      ctx.fillStyle = tint('orange', 0.12); ctx.strokeStyle = tint('orange', 0.45); ctx.lineWidth = 2;
      poly(ctx, [X0, G, L0, G, L0 + 30, Y0 + 560, L1 - 30, Y0 + 560, L1, G, X1, G, X1, Y0 + 575, X0, Y0 + 575], true); ctx.fill(); ctx.stroke();
      ctx.fillStyle = tint('blue', 0.3); poly(ctx, [L0 + 22, Y0 + 505, L1 - 22, Y0 + 505, L1 - 30, Y0 + 560, L0 + 30, Y0 + 560], true); ctx.fill();
      ctx.strokeStyle = 'rgba(200,225,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let x = L0 + 30; x < L1 - 30; x += 8) { const y = Y0 + 505 + Math.sin(x / 22 + k * 2) * 2; if (x === L0 + 30) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
      const sAlpha = Math.min(after(local, 0, 0.35), 1 - after(local, SEG - 0.3, 0.3));
      ctx.save(); ctx.globalAlpha *= sAlpha;
      chip(ctx, name, cx, Y0 + 78, 'cyan', 22);
      const road = (xa, xb, y = Dy) => { ctx.fillStyle = 'rgba(120,130,160,0.55)'; ctx.fillRect(xa, y, xb - xa, 16); line(ctx, xa, y, xb, y, LINE, 2); };
      const member = (x0, y0, x1, y1, F, ref) => {
        const s = clamp(Math.abs(F) / ref); const c = Math.abs(F) < 0.05 * ref ? 'rgba(170,180,200,0.6)' : F < 0 ? RED : BLUE;
        ctx.globalAlpha *= 0.45 + 0.55 * s; line(ctx, x0, y0, x1, y1, c, 3 + 7 * s); ctx.globalAlpha /= 0.45 + 0.55 * s;
      };
      let deckY = () => Dy;
      if (key === 'beam') {
        const sag = (x) => {
          const s = (x - L0) / span; if (s <= 0 || s >= 1) return 0;
          let f = 0.25 * Math.sin(Math.PI * s);
          if (present) { const A = a; const B = 1 - a; f += 0.8 * 8 * (s <= A ? B * s * (1 - B * B - s * s) : A * (1 - s) * (1 - A * A - (1 - s) * (1 - s))); }
          return f * 15;
        };
        deckY = (x) => Dy + sag(x);
        road(X0, L0); road(L1, X1);
        const NSTR = 44;
        for (let i = 0; i < NSTR; i++) {
          const xa = L0 + (i * span) / NSTR; const xb = L0 + ((i + 1) * span) / NSTR; const s = (i + 0.5) / NSTR;
          const M = clamp(1.2 * s * (1 - s) + (present ? (s <= a ? (1 - a) * s : a * (1 - s)) * 3 : 0));
          const ya = sag(xa); const yb = sag(xb);
          ctx.fillStyle = tint('red', 0.15 + 0.7 * M); poly(ctx, [xa, Dy + ya, xb + 0.6, Dy + yb, xb + 0.6, Dy + 13 + yb, xa, Dy + 13 + ya], true); ctx.fill();
          ctx.fillStyle = tint('blue', 0.15 + 0.7 * M); poly(ctx, [xa, Dy + 13 + ya, xb + 0.6, Dy + 13 + yb, xb + 0.6, Dy + 26 + yb, xa, Dy + 26 + ya], true); ctx.fill();
        }
        ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i <= NSTR; i++) { const x = L0 + (i * span) / NSTR; if (i) ctx.lineTo(x, Dy + sag(x)); else ctx.moveTo(x, Dy); }
        ctx.stroke();
        for (const x of [L0, L1]) { ctx.fillStyle = tint('muted', 0.6); poly(ctx, [x, G, x - 16, G + 26, x + 16, G + 26], true); ctx.fill(); }
        label(ctx, 'Top: squeezed (compression)', cx, Y0 + 405, { size: 19, weight: 700, fill: 'red' });
        label(ctx, 'Bottom: stretched (tension)', cx, Y0 + 445, { size: 19, weight: 700, fill: 'blue' });
        arr(ctx, cx - 215, Y0 + 405, cx - 168, Y0 + 405, 'red', 4); arr(ctx, cx + 215, Y0 + 405, cx + 168, Y0 + 405, 'red', 4);
        arr(ctx, cx - 160, Y0 + 445, cx - 207, Y0 + 445, 'blue', 4); arr(ctx, cx + 160, Y0 + 445, cx + 207, Y0 + 445, 'blue', 4);
      } else if (key === 'arch') {
        const ya = Y0 + 480; const xa = L0 + 19; const xb = L1 - 19; const apex = Dy + 34;
        const archY = (x) => { const s = (x - xa) / (xb - xa); return ya - (ya - apex) * 4 * s * (1 - s); };
        const lw = 0.6 + 0.4 * (present ? 1 : 0);
        for (let x = xa + 44; x < xb - 30; x += 48) {
          const s = present ? Math.exp(-(((x - xt) / 70) ** 2)) : 0;
          ctx.globalAlpha *= 0.5 + 0.5 * s; line(ctx, x, archY(x), x, Dy + 16, RED, 4 + 4 * s); ctx.globalAlpha /= 0.5 + 0.5 * s;
        }
        glow(ctx, RED, 10); ctx.strokeStyle = tint('red', lw); ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath();
        for (let i = 0; i <= 40; i++) { const x = lerp(xa, xb, i / 40); if (i) ctx.lineTo(x, archY(x)); else ctx.moveTo(x, archY(x)); }
        ctx.stroke(); ctx.shadowBlur = 0;
        road(X0, X1);
        arr(ctx, xa + 6, ya - 8, xa - 28, ya + 24, 'red', 5); arr(ctx, xb - 6, ya - 8, xb + 28, ya + 24, 'red', 5);
        label(ctx, 'Arch: squeezed (compression)', cx, Y0 + 430, { size: 19, weight: 700, fill: 'red' });
      } else if (key === 'truss') {
        const n = 6; const pw = span / n; const hT = 110; const top = Dy - hT;
        const P = [1, 1, 1, 1, 1, 1, 1];
        if (present) { const pos = a * n; const i0 = Math.min(n - 1, Math.floor(pos)); const f = pos - i0; P[i0] += 4 * (1 - f); P[i0 + 1] += 4 * f; }
        let RL = 0; for (let i = 0; i <= n; i++) RL += P[i] * (1 - i / n);
        const Mo = (x) => { let M = RL * x; for (let i = 0; i <= n && i < x; i++) M -= P[i] * (x - i); return M; };
        const sinT = 1 / Math.hypot(1, 0.5); const ref = 10.5;
        road(X0, X1);
        let V = RL;
        for (let j = 0; j < n; j++) {
          V -= P[j];
          const bx = L0 + j * pw; const tx = bx + pw / 2;
          member(bx, Dy, tx, top, -V / sinT, ref);
          member(tx, top, bx + pw, Dy, V / sinT, ref);
          member(bx, Dy, bx + pw, Dy, Mo(j + 0.5), ref);
          if (j < n - 1) member(tx, top, tx + pw, top, -Mo(j + 1), ref);
        }
        for (let j = 0; j <= n; j++) dot(ctx, L0 + j * pw, Dy, 5, 'ink');
        for (let j = 0; j < n; j++) dot(ctx, L0 + j * pw + pw / 2, top, 5, 'ink');
        label(ctx, 'Top chord: squeezed', cx, top - 26, { size: 19, weight: 700, fill: 'red' });
        label(ctx, 'Bottom chord: stretched', cx, Dy + 52, { size: 19, weight: 700, fill: 'blue' });
      } else {
        const tA = X0 + 190; const tB = X1 - 190; const tTop = Y0 + 140; const mid = Dy - 18;
        const cab = (x) => {
          if (x < tA) return lerp(Dy + 6, tTop, (x - (X0 + 14)) / (tA - X0 - 14));
          if (x > tB) return lerp(tTop, Dy + 6, (x - tB) / (X1 - 14 - tB));
          const s = (x - cx) / (tB - cx); return mid - (mid - tTop) * s * s;
        };
        for (let x = X0 + 44; x < X1 - 40; x += 26) {
          if (Math.abs(x - tA) < 14 || Math.abs(x - tB) < 14) continue;
          const s = present ? Math.exp(-(((x - xt) / 50) ** 2)) : 0;
          ctx.globalAlpha *= 0.45 + 0.55 * s; line(ctx, x, cab(x), x, Dy, BLUE, 2 + 3 * s); ctx.globalAlpha /= 0.45 + 0.55 * s;
        }
        for (const x of [tA, tB]) {
          const s = present ? 0.5 + 0.5 * Math.exp(-(((x - xt) / 160) ** 2)) : 0.5;
          ctx.fillStyle = tint('red', 0.2 + 0.4 * s); ctx.strokeStyle = RED; ctx.lineWidth = 2 + 2 * s;
          ctx.beginPath(); ctx.rect(x - 9, tTop - 8, 18, Y0 + 560 - tTop + 8); ctx.fill(); ctx.stroke();
        }
        glow(ctx, BLUE, 8); ctx.strokeStyle = BLUE; ctx.lineWidth = 5; ctx.beginPath();
        ctx.moveTo(X0 + 14, Dy + 6);
        for (let x = X0 + 14; x <= X1 - 14; x += 10) ctx.lineTo(x, cab(x));
        ctx.lineTo(X1 - 14, Dy + 6); ctx.stroke(); ctx.shadowBlur = 0;
        road(X0, X1);
        for (const x of [X0, X1 - 30]) { ctx.fillStyle = tint('muted', 0.5); ctx.fillRect(x, Dy + 16, 30, G - Dy - 16 + 10); }
        label(ctx, 'Cables: stretched', cx, mid - 46, { size: 19, weight: 700, fill: 'blue' });
        label(ctx, 'Towers: squeezed', tA + 20, Y0 + 430, { size: 19, weight: 700, fill: 'red', align: 'left' });
      }
      // The truck.
      ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0, FIG.w, FIG.h); ctx.clip();
      const ty = deckY(clamp(xt, L0, L1));
      ctx.fillStyle = tint('yellow', 0.35); ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 2;
      rounded(ctx, xt - 38, ty - 40, 54, 30, 4); ctx.fill(); ctx.stroke();
      rounded(ctx, xt + 18, ty - 32, 22, 22, 5); ctx.fill(); ctx.stroke();
      dot(ctx, xt - 24, ty - 7, 7, 'ink'); dot(ctx, xt + 26, ty - 7, 7, 'ink');
      ctx.restore();
      chip(ctx, info, cx, Y0 + 608, 'ink', 19);
      ctx.restore();
      line(ctx, X0 + 70, Y0 + 655, X0 + 110, Y0 + 655, 'red', 8);
      label(ctx, 'Compression: pushes, squeezed', X0 + 122, Y0 + 655, { size: 19, weight: 600, fill: 'red', align: 'left' });
      line(ctx, X0 + 450, Y0 + 655, X0 + 490, Y0 + 655, 'blue', 8);
      label(ctx, 'Tension: pulls, stretched', X0 + 502, Y0 + 655, { size: 19, weight: 600, fill: 'blue', align: 'left' });
      ctx.restore();
    },

    // A small piston pumped down, a big piston lifting a car: the oil carries
    // the same pressure everywhere, so the big area gives a big force.
    'hydraulic-press'(b, ctx, it, t) {
      const k = b.clock;
      const F1 = val(it.force, 500); const A1 = val(it.small, 0.005); const A2 = val(it.big, 0.1);
      const P = F1 / A1; const F2 = P * A2; const ratio = A2 / A1;
      const u = cycle(t, 11, 0.6); const SP = 1.5; const NS = 5;
      let ps; let lift; let phase; let pushing = false; let refill = false; let release = false;
      if (u < SP * NS) {
        const s = Math.floor(u / SP); const f = (u - s * SP) / SP;
        if (f < 0.6) { const q = smooth(f / 0.6); ps = q; lift = 14 * (s + q); pushing = true; } else { ps = 1 - smooth((f - 0.6) / 0.4); lift = 14 * (s + 1); refill = true; }
        phase = `Pump stroke ${s + 1} of ${NS}`;
      } else if (u < SP * NS + 1) { ps = 0; lift = 14 * NS; phase = 'Holding the car up'; } else { const q = smooth((u - SP * NS - 1) / 2); ps = 0; lift = 14 * NS * (1 - q); release = q < 1; phase = 'Release valve open'; }
      const sx0 = X0 + 150; const sw = 56; const sxc = sx0 + sw / 2; const bx0 = X0 + 380; const bw = 250; const bxc = bx0 + bw / 2; const bot = Y0 + 520;
      const yps = Y0 + 250 + 130 * ps; const ypb = Y0 + 420 - lift;
      const OIL = 'rgba(251,191,36,0.32)';
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Hydraulic press');
      // Oil: tank, small cylinder, channel, big cylinder.
      ctx.fillStyle = OIL;
      ctx.fillRect(sx0, yps + 24, sw, bot - yps - 24); ctx.fillRect(sx0 + sw, Y0 + 490, bx0 - sx0 - sw, 30); ctx.fillRect(bx0, ypb + 24, bw, bot - ypb - 24);
      const tankLvl = Y0 + 452 + lift * 0.5;
      ctx.fillRect(X0 + 30, tankLvl, 80, bot - tankLvl);
      for (let i = 0; i < 26; i++) {
        const big = i >= 8; const x = big ? bx0 + 14 + rnd(i) * (bw - 28) : sx0 + 8 + rnd(i) * (sw - 16);
        const y0 = big ? ypb + 34 : yps + 34; const y = y0 + rnd(i + 30) * (bot - y0 - 10) + Math.sin(k * 3 + i) * 2;
        dot(ctx, x, y, 2.5, 'rgba(255,230,160,0.55)');
      }
      // Pipes and valves.
      ctx.lineCap = 'butt';
      line(ctx, X0 + 110, Y0 + 505, sx0, Y0 + 505, OIL, 10);
      ctx.strokeStyle = OIL; ctx.lineWidth = 8; poly(ctx, [X0 + 300, bot, X0 + 300, Y0 + 548, X0 + 70, Y0 + 548, X0 + 70, bot]); ctx.stroke();
      ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.strokeRect(X0 + 30, Y0 + 410, 80, bot - Y0 - 410);
      const valve = (x, y, open, c) => { ctx.fillStyle = open ? tint(c, 0.85) : DARK; ctx.strokeStyle = open ? color(c) : tint('muted', 0.8); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill(); ctx.stroke(); };
      valve(X0 + 130, Y0 + 505, refill, 'green'); valve(X0 + 290, Y0 + 505, pushing, 'green'); valve(X0 + 190, Y0 + 548, release, 'red');
      if (pushing) for (let i = 0; i < 4; i++) dot(ctx, lerp(sx0 + sw, bx0, mod(i / 4 + k * 1.5, 1)), Y0 + 505, 4, 'yellow');
      if (refill) for (let i = 0; i < 3; i++) dot(ctx, lerp(X0 + 110, sx0, mod(i / 3 + k * 1.5, 1)), Y0 + 505, 4, 'yellow');
      if (release) for (let i = 0; i < 4; i++) dot(ctx, lerp(X0 + 300, X0 + 70, mod(i / 4 + k * 0.8, 1)), Y0 + 548, 4, 'yellow');
      // Cylinder walls.
      ctx.strokeStyle = LINE; ctx.lineWidth = 5; ctx.lineJoin = 'round';
      poly(ctx, [sx0, Y0 + 180, sx0, bot, bx0 + bw, bot, bx0 + bw, Y0 + 330]); ctx.stroke();
      poly(ctx, [bx0, Y0 + 330, bx0, Y0 + 490, sx0 + sw, Y0 + 490, sx0 + sw, Y0 + 180]); ctx.stroke();
      // Pistons, rod and handle.
      ctx.fillStyle = tint('muted', 0.55); ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      rounded(ctx, sx0 + 3, yps, sw - 6, 24, 4); ctx.fill(); ctx.stroke();
      rounded(ctx, bx0 + 3, ypb, bw - 6, 24, 4); ctx.fill(); ctx.stroke();
      line(ctx, sxc, yps, sxc, yps - 100, 'rgba(200,210,235,0.9)', 8);
      ctx.fillStyle = tint('orange', 0.6); rounded(ctx, sxc - 36, yps - 112, 72, 14, 6); ctx.fill();
      ctx.save(); ctx.globalAlpha *= pushing ? 1 : 0.3;
      arr(ctx, sxc, yps - 190, sxc, yps - 122, 'orange', 6);
      label(ctx, `${num(F1)} N`, sxc - 20, yps - 165, { size: 21, weight: 800, fill: 'orange', align: 'right' });
      ctx.restore();
      // The ram, platform and car on the big piston.
      ctx.fillStyle = tint('muted', 0.45); ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ctx.fillRect(bxc - 30, ypb - 82, 60, 82); ctx.strokeRect(bxc - 30, ypb - 82, 60, 82);
      ctx.fillStyle = tint('muted', 0.6); rounded(ctx, bx0 - 10, ypb - 98, bw + 20, 16, 5); ctx.fill(); ctx.stroke();
      const carB = ypb - 98;
      ctx.fillStyle = tint('red', 0.2); ctx.strokeStyle = COLORS.red; ctx.lineWidth = 2.5;
      poly(ctx, [bxc - 62, carB - 50, bxc - 38, carB - 82, bxc + 40, carB - 82, bxc + 68, carB - 50], true); ctx.fill(); ctx.stroke();
      ctx.fillStyle = tint('red', 0.38); rounded(ctx, bxc - 105, carB - 52, 210, 34, 10); ctx.fill(); ctx.stroke();
      line(ctx, bxc, carB - 80, bxc, carB - 52, tint('red', 0.8), 2);
      wheel(ctx, bxc - 64, carB - 16, 17, -lift / 17); wheel(ctx, bxc + 64, carB - 16, 17, -lift / 17);
      for (let i = 0; i < 6; i++) arr(ctx, bx0 + 25 + i * 40, Math.min(bot - 6, ypb + 84), bx0 + 25 + i * 40, ypb + 32, 'green', 4);
      label(ctx, `${group(F2)} N`, bx0 + bw + 14, Y0 + 420, { size: 22, weight: 800, fill: 'green', align: 'left' });
      label(ctx, 'lifting force', bx0 + bw + 14, Y0 + 448, { size: 18, weight: 500, fill: 'muted', align: 'left' });
      label(ctx, 'oil', sxc, Y0 + 470, { size: 18, weight: 800, fill: 'yellow' });
      label(ctx, 'oil tank', X0 + 70, Y0 + 392, { size: 18, weight: 600, fill: 'muted' });
      label(ctx, 'one-way valve', X0 + 290, Y0 + 472, { size: 18, weight: 500, fill: 'muted' });
      label(ctx, 'release valve', X0 + 190, Y0 + 574, { size: 18, weight: 500, fill: 'muted' });
      label(ctx, `Small piston ${A1} m²`, sxc + 30, Y0 + 604, { size: 19, weight: 700, fill: 'orange' });
      label(ctx, `Big piston ${A2} m²`, bxc, Y0 + 604, { size: 19, weight: 700, fill: 'green' });
      label(ctx, phase, X1 - 10, Y0 + 84, { size: 19, weight: 600, fill: 'muted', align: 'right' });
      chip(ctx, `Pressure = ${num(F1)} N ÷ ${A1} m² = ${group(P)} Pa, everywhere`, cx, Y0 + 643, 'yellow', 19);
      label(ctx, `Big force = ${group(P)} Pa × ${A2} m² = ${group(F2)} N (${num(ratio)}× more)`, cx, Y0 + 684, { size: 19, weight: 600, fill: 'ink' });
      ctx.restore();
    },

    // ─── Engines and vehicles ─────────────────────────────────────────────

    // Intake, compression, power, exhaust: the piston, valves, spark and
    // crankshaft working in order, two turns of the crank per cycle.
    'four-stroke-engine'(b, ctx, it, t) {
      const k = b.clock; const u = cycle(t, 8, 0.6); const th = (u / 8) * 2 * TAU; const st = Math.min(3, Math.floor(u / 2)); const sq = (u % 2) / 2;
      const ex = X0 + 330; const Cy = Y0 + 560; const r = 60; const l = 180; const Hy = Y0 + 240;
      const pinY = Cy - (r * Math.cos(th) + Math.sqrt(l * l - r * r * Math.sin(th) ** 2));
      const ptop = pinY - 45;
      const inL = th < Math.PI ? Math.sin(th) : 0; const exL = th > 3 * Math.PI ? Math.sin(th - 3 * Math.PI) : 0;
      const ROWS = [['Intake', 'cyan', 'Intake: piston goes down, fuel and air are sucked in'], ['Compression', 'purple', 'Compression: valves shut, piston squeezes the mixture'], ['Power', 'orange', 'Power: a spark ignites it, hot gas forces the piston down'], ['Exhaust', 'red', 'Exhaust: piston pushes the burnt gas out']];
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Four-stroke engine');
      // Gas in the chamber.
      let gas;
      if (st === 0) gas = tint('cyan', 0.08 + 0.2 * sq);
      else if (st === 1) gas = tint('cyan', 0.28 + 0.2 * sq);
      else if (st === 2) gas = sq < 0.12 ? 'rgba(255,240,170,0.85)' : tint('orange', 0.6 - 0.35 * sq);
      else gas = `rgba(150,150,165,${0.4 * (1 - sq) + 0.06})`;
      ctx.fillStyle = gas; ctx.fillRect(ex - 75, Hy, 150, ptop - Hy);
      const nDots = st === 0 ? Math.floor(16 * sq) : st === 3 ? Math.floor(16 * (1 - sq)) : 16;
      for (let i = 0; i < nDots; i++) {
        const x = ex - 66 + rnd(i) * 132 + Math.sin(k * 6 + i) * 2; const y = Hy + 6 + rnd(i + 50) * (ptop - Hy - 12);
        dot(ctx, x, y, 3.5, st < 2 ? 'cyan' : st === 2 ? 'yellow' : 'muted');
      }
      if (th > 2 * Math.PI - 0.05 && th < 2 * Math.PI + 0.35) {
        glow(ctx, COLORS.yellow, 20); ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 3; ctx.beginPath();
        for (let s = 0; s < 8; s++) { const a = (s / 8) * TAU; ctx.moveTo(ex + Math.cos(a) * 5, Hy + 10 + Math.sin(a) * 5); ctx.lineTo(ex + Math.cos(a) * 20, Hy + 10 + Math.sin(a) * 20); }
        ctx.stroke(); ctx.shadowBlur = 0;
      }
      // Head with ports, valves and the spark plug.
      ctx.fillStyle = tint('muted', 0.22); ctx.fillRect(X0 + 120, Y0 + 165, 420, Hy - Y0 - 165);
      ctx.fillStyle = DARK;
      poly(ctx, [X0 + 120, Y0 + 182, ex - 58, Y0 + 182, ex - 20, Hy, ex - 64, Hy, X0 + 120, Y0 + 214], true); ctx.fill();
      poly(ctx, [X0 + 540, Y0 + 182, ex + 58, Y0 + 182, ex + 20, Hy, ex + 64, Hy, X0 + 540, Y0 + 214], true); ctx.fill();
      if (inL > 0.15) for (let i = 0; i < 5; i++) { const q = mod(i / 5 + k * 1.2, 1); dot(ctx, lerp(X0 + 130, ex - 44, q), lerp(Y0 + 198, Hy - 4, q * q), 4, 'cyan'); }
      if (exL > 0.15) for (let i = 0; i < 5; i++) { const q = mod(i / 5 + k * 1.2, 1); dot(ctx, lerp(ex + 44, X0 + 530, q), lerp(Hy - 4, Y0 + 198, Math.sqrt(q)), 4, 'muted'); }
      ctx.strokeStyle = tint('muted', 0.7); ctx.lineWidth = 2; ctx.strokeRect(X0 + 120, Y0 + 165, 420, Hy - Y0 - 165);
      const valve = (vx, L, c) => {
        const vy = Hy + 16 * L;
        line(ctx, vx, Y0 + 150, vx, vy - 4, 'rgba(210,220,240,0.9)', 5);
        ctx.fillStyle = color(c); poly(ctx, [vx - 20, vy, vx + 20, vy, vx + 12, vy - 7, vx - 12, vy - 7], true); ctx.fill();
        ctx.fillStyle = tint(c, 0.6); ctx.fillRect(vx - 9, Y0 + 146, 18, 6);
      };
      valve(ex - 42, inL, 'cyan'); valve(ex + 42, exL, 'red');
      ctx.fillStyle = 'rgba(235,235,245,0.85)'; ctx.fillRect(ex - 8, Y0 + 128, 16, Hy - Y0 - 128 - 4);
      ctx.fillStyle = tint('muted', 0.9); ctx.fillRect(ex - 3, Hy - 6, 6, 10);
      // Cylinder, piston, rod and crank.
      ctx.strokeStyle = LINE; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(ex - 78, Hy); ctx.lineTo(ex - 78, Y0 + 482); ctx.moveTo(ex + 78, Hy); ctx.lineTo(ex + 78, Y0 + 482); ctx.stroke();
      if (st === 2 && ptop - Hy > 34) for (const dx of [-44, 0, 44]) arr(ctx, ex + dx, ptop - Math.min(44, ptop - Hy - 6), ex + dx, ptop - 4, 'orange', 5);
      const cpx = ex + r * Math.sin(th); const cpy = Cy - r * Math.cos(th);
      ctx.fillStyle = tint('purple', 0.12); ctx.strokeStyle = tint('purple', 0.7); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ex, Cy, 82, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = tint('purple', 0.4); ctx.beginPath(); ctx.moveTo(ex, Cy); ctx.arc(ex, Cy, 70, th + Math.PI / 2 - 1, th + Math.PI / 2 + 1); ctx.closePath(); ctx.fill();
      line(ctx, ex, Cy, cpx, cpy, color('purple'), 18);
      ctx.lineCap = 'round'; line(ctx, ex, pinY, cpx, cpy, 'rgba(200,210,235,0.95)', 14);
      dot(ctx, cpx, cpy, 9, 'ink'); dot(ctx, ex, Cy, 10, DARK); dot(ctx, ex, Cy, 5, 'purple');
      ctx.fillStyle = '#2a3150'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      rounded(ctx, ex - 73, ptop, 146, 75, 6); ctx.fill(); ctx.stroke();
      line(ctx, ex - 73, ptop + 12, ex + 73, ptop + 12, 'rgba(30,40,70,0.9)', 2); line(ctx, ex - 73, ptop + 21, ex + 73, ptop + 21, 'rgba(30,40,70,0.9)', 2);
      dot(ctx, ex, pinY, 7, 'ink');
      arcArrow(ctx, ex, Cy, 94, 0.7, 2.45, 'purple', 4);
      // Labels.
      label(ctx, 'spark plug', ex, Y0 + 106, { size: 19, weight: 700, fill: 'yellow' });
      label(ctx, 'fuel + air in', X0 + 178, Y0 + 147, { size: 18, weight: 700, fill: 'cyan' });
      label(ctx, 'exhaust out', X0 + 482, Y0 + 147, { size: 18, weight: 700, fill: 'red' });
      label(ctx, 'intake valve', X0 + 240, Y0 + 266, { size: 18, weight: 600, fill: 'cyan', align: 'right' });
      label(ctx, 'exhaust valve', X0 + 420, Y0 + 266, { size: 18, weight: 600, fill: 'red', align: 'left' });
      label(ctx, 'piston', X0 + 240, ptop + 37, { size: 19, weight: 600, fill: 'ink', align: 'right' });
      label(ctx, 'connecting rod', X0 + 238, Y0 + 505, { size: 18, weight: 600, fill: 'muted', align: 'right' });
      label(ctx, 'crankshaft', X0 + 232, Y0 + 600, { size: 18, weight: 600, fill: 'purple', align: 'right' });
      // The four strokes in order.
      ROWS.forEach(([n, c], i) => {
        const y = Y0 + 172 + i * 74; const on = i === st;
        panel(ctx, X0 + 560, y - 30, 230, 60, on ? c : 'muted', on ? 0.24 : 0.05, 14);
        if (on) { glow(ctx, color(c), 10); }
        label(ctx, String(i + 1), X0 + 588, y, { size: 23, weight: 800, fill: on ? c : 'muted' });
        ctx.shadowBlur = 0;
        label(ctx, n, X0 + 612, y, { size: 21, weight: on ? 800 : 600, fill: on ? 'ink' : 'muted', align: 'left' });
      });
      para(ctx, 'Suck, squeeze, bang, blow: 4 strokes = 2 turns of the crank', X0 + 562, Y0 + 488, 226, 18, 'muted', 500, 3);
      chip(ctx, ROWS[st][2], cx, Y0 + 680, ROWS[st][1], 19);
      ctx.restore();
    },

    // A turbine in the wind with a cutaway of its nacelle: slow shaft,
    // gearbox, fast generator, and electricity sent down to homes.
    'wind-turbine'(b, ctx, it, t) {
      const k = b.clock; const R = { x: X0 + 190, y: Y0 + 250 }; const rot = k * 1.1;
      const BL = [16, -9, 48, -15, 140, -4, 142, 2, 16, 9];
      const C = it._c || (it._c = { cable: mkPath([R.x, R.y + 30, R.x, Y0 + 652, X0 + 450, Y0 + 652, X0 + 450, Y0 + 612, X0 + 480, Y0 + 612, X0 + 550, Y0 + 598, X0 + 760, Y0 + 598]), gen: mkPath([X0 + 760, Y0 + 345, X0 + 760, Y0 + 390]) });
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Wind turbine');
      // Wind streaks.
      ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0 + 90, 375, 380); ctx.clip();
      ctx.lineCap = 'round'; ctx.lineWidth = 2.5;
      for (let i = 0; i < 10; i++) {
        const y = Y0 + 100 + i * 36; const x = X0 - 40 + mod(rnd(i) * 420 + k * 170, 440);
        ctx.strokeStyle = tint('cyan', 0.35); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 25, y - 4, x + 50, y); ctx.stroke();
      }
      ctx.restore();
      label(ctx, 'Wind', X0 + 14, Y0 + 74, { size: 20, weight: 800, fill: 'cyan', align: 'left' });
      arr(ctx, X0 + 80, Y0 + 74, X0 + 132, Y0 + 74, 'cyan', 4);
      // Ground, tower, blades.
      ctx.fillStyle = tint('green', 0.12); ctx.fillRect(X0, Y0 + 640, FIG.w, 22); line(ctx, X0, Y0 + 640, X1, Y0 + 640, tint('green', 0.6), 2);
      ctx.fillStyle = tint('muted', 0.28); ctx.strokeStyle = tint('muted', 0.9); ctx.lineWidth = 2;
      poly(ctx, [R.x - 7, R.y + 12, R.x + 7, R.y + 12, R.x + 13, Y0 + 640, R.x - 13, Y0 + 640], true); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = tint('yellow', 0.55); ctx.lineWidth = 3; poly(ctx, C.cable.pts); ctx.stroke();
      pulses(ctx, C.cable, 12, k * 0.25, 'yellow', 4.5, 8);
      ctx.fillStyle = 'rgba(225,232,250,0.85)'; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 1.5;
      for (let j = 0; j < 3; j++) {
        const a = rot + (j * TAU) / 3; const c = Math.cos(a); const s = Math.sin(a);
        ctx.beginPath();
        for (let i = 0; i < BL.length; i += 2) { const x = R.x + BL[i] * c - BL[i + 1] * s; const y = R.y + BL[i] * s + BL[i + 1] * c; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      dot(ctx, R.x, R.y, 17, 'rgba(200,210,235,0.95)'); dot(ctx, R.x, R.y, 7, 'cyan');
      // Zoom lines and the nacelle cutaway.
      line(ctx, R.x + 18, R.y - 12, X0 + 390, Y0 + 132, tint('cyan', 0.35), 1.5, [6, 6]);
      line(ctx, R.x + 18, R.y + 12, X0 + 390, Y0 + 388, tint('cyan', 0.35), 1.5, [6, 6]);
      panel(ctx, X0 + 390, Y0 + 130, 405, 260, 'cyan', 0.06, 16);
      label(ctx, 'Inside the nacelle', X0 + 592, Y0 + 158, { size: 19, weight: 700, fill: 'cyan' });
      const Ay = Y0 + 290;
      ctx.fillStyle = 'rgba(200,210,235,0.9)'; ctx.beginPath(); ctx.arc(X0 + 432, Ay, 26, Math.PI / 2, (3 * Math.PI) / 2); ctx.closePath(); ctx.fill();
      const shaft = (xa, xb, hw, sp, c) => {
        ctx.fillStyle = tint(c, 0.45); ctx.fillRect(xa, Ay - hw, xb - xa, hw * 2);
        ctx.strokeStyle = tint('ink', 0.7); ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i < 6; i++) { const x = xa + mod(i * 18 + sp, xb - xa); ctx.moveTo(x, Ay - hw); ctx.lineTo(Math.min(xb, x + 6), Ay + hw); }
        ctx.stroke();
      };
      shaft(X0 + 432, X0 + 530, 8, rot * 8, 'muted');
      panel(ctx, X0 + 530, Y0 + 235, 95, 110, 'purple', 0.12, 10);
      gear(ctx, X0 + 562, Ay, 20, 2.6, rot, 'purple', false);
      gear(ctx, X0 + 562 + 36.4, Ay, 8, 2.6, -2.5 * rot + Math.PI + Math.PI / 8, 'orange', false);
      shaft(X0 + 625, X0 + 668, 4, rot * 60, 'orange');
      panel(ctx, X0 + 668, Y0 + 235, 110, 110, 'green', 0.1, 10);
      ctx.strokeStyle = tint('orange', 0.9); ctx.lineWidth = 7; ctx.setLineDash([9, 5]); ctx.beginPath(); ctx.arc(X0 + 723, Ay, 38, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      const ga = rot * 14;
      ctx.save(); ctx.translate(X0 + 723, Ay); ctx.rotate(ga);
      ctx.fillStyle = tint('red', 0.85); ctx.fillRect(-26, -8, 26, 16); ctx.fillStyle = tint('blue', 0.85); ctx.fillRect(0, -8, 26, 16);
      ctx.restore();
      ctx.lineCap = 'round'; line(ctx, X0 + 760, Y0 + 345, X0 + 760, Y0 + 390, tint('yellow', 0.8), 4);
      pulses(ctx, C.gen, 2, k * 1.4, 'yellow', 4);
      label(ctx, '≈ 15 rpm', X0 + 480, Y0 + 208, { size: 18, weight: 600, fill: 'muted' });
      label(ctx, '≈ 1500 rpm', X0 + 648, Y0 + 208, { size: 18, weight: 600, fill: 'orange' });
      label(ctx, 'slow shaft', X0 + 478, Y0 + 320, { size: 18, weight: 600, fill: 'ink' });
      label(ctx, 'gearbox', X0 + 577, Y0 + 366, { size: 18, weight: 700, fill: 'purple' });
      label(ctx, 'generator', X0 + 705, Y0 + 366, { size: 18, weight: 700, fill: 'green' });
      // Cable to homes.
      panel(ctx, X0 + 420, Y0 + 596, 60, 44, 'purple', 0.25, 6);
      house(ctx, X0 + 580, Y0 + 640, 56); house(ctx, X0 + 660, Y0 + 640, 56); house(ctx, X0 + 740, Y0 + 640, 56);
      label(ctx, 'blades', X0 + 20, Y0 + 440, { size: 19, weight: 700, fill: 'ink', align: 'left' });
      label(ctx, 'tower', R.x + 22, Y0 + 520, { size: 19, weight: 600, fill: 'muted', align: 'left' });
      label(ctx, 'transformer', X0 + 450, Y0 + 574, { size: 18, weight: 600, fill: 'purple' });
      label(ctx, 'homes', X0 + 660, Y0 + 552, { size: 19, weight: 700, fill: 'blue' });
      chip(ctx, 'Wind spins the blades; the generator turns that into electricity', cx, Y0 + 683, 'cyan', 19);
      ctx.restore();
    },

    // A two-stage rocket: the engine pushes hot gas down, the gas pushes the
    // rocket up (Newton's third law); stage 1 drops away when it is empty.
    'rocket-thrust'(b, ctx, it, t) {
      const k = b.clock; const u = cycle(t, 13, 0.6); const rx = cx;
      const lift = u < 1.5 ? 0 : 0.5 * 70 * (u - 1.5) ** 2;
      const by = u < 1.5 ? Y0 + 540 : Math.max(Y0 + 470, Y0 + 540 - lift);
      const scroll = lift - (Y0 + 540 - by);
      const sep = u >= 6.5; const burn1 = !sep; const burn2 = u >= 7.3 && u < 12.4;
      const gY = Y0 + 560 + scroll;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'How a rocket flies');
      ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0 + 48, FIG.w, FIG.h - 48); ctx.clip();
      // Stars appear as the rocket climbs.
      const sa = clamp(scroll / 700) * 0.85;
      if (sa > 0.02) for (let i = 0; i < 40; i++) dot(ctx, X0 + rnd(i) * FIG.w, Y0 + 48 + mod(rnd(i + 40) * 652 + scroll * 0.25, 652), 1.5 + rnd(i + 9), `rgba(230,236,255,${sa * (0.4 + 0.6 * rnd(i + 3))})`);
      // Ground, pad and tower.
      if (gY < Y1 + 40) {
        ctx.fillStyle = tint('green', 0.12); ctx.fillRect(X0, gY, FIG.w, 200); line(ctx, X0, gY, X1, gY, tint('green', 0.6), 2);
        ctx.fillStyle = tint('muted', 0.5); ctx.fillRect(rx - 70, gY - 20, 140, 20);
        ctx.strokeStyle = tint('muted', 0.8); ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i < 10; i++) { const y = gY - 20 - i * 32; ctx.moveTo(rx - 120, y); ctx.lineTo(rx - 96, y - 32); ctx.moveTo(rx - 96, y); ctx.lineTo(rx - 120, y - 32); }
        ctx.moveTo(rx - 120, gY - 20); ctx.lineTo(rx - 120, gY - 340); ctx.moveTo(rx - 96, gY - 20); ctx.lineTo(rx - 96, gY - 340); ctx.stroke();
        if (u < 3.5) for (let i = 0; i < 12; i++) { const ph = mod(rnd(i) + k * 0.5, 1); const sd = i % 2 ? 1 : -1; const on = clamp(u / 0.8) * clamp((3.5 - u) / 1.5); dot(ctx, rx + sd * (40 + ph * 250), gY - 18 - ph * 26, 16 + ph * 30, `rgba(190,195,210,${0.4 * (1 - ph) * on})`); }
      }
      const plume = (x, y0, sc, pw) => {
        for (let i = 0; i < 34; i++) {
          const ph = mod(rnd(i) + k * 1.8, 1); const yy = y0 + ph * 230 * sc; const sp = (rnd(i + 7) - 0.5) * (14 + ph * 110) * sc; const rr = (5 + ph * 16) * sc;
          ctx.fillStyle = ph < 0.25 ? `rgba(255,236,170,${0.9 * pw})` : ph < 0.6 ? `rgba(255,150,60,${(0.75 - ph * 0.6) * pw})` : `rgba(170,170,185,${(0.5 - ph * 0.45) * pw})`;
          ctx.beginPath(); ctx.arc(x + sp, yy, rr, 0, TAU); ctx.fill();
        }
        glow(ctx, '#ffb347', 16); ctx.fillStyle = `rgba(255,245,200,${0.95 * pw})`; ctx.beginPath(); ctx.moveTo(x - 13 * sc, y0);
        ctx.quadraticCurveTo(x, y0 + (75 + 10 * Math.sin(k * 30)) * sc, x + 13 * sc, y0); ctx.fill(); ctx.shadowBlur = 0;
      };
      const stage1 = (x, yb, rotA) => {
        ctx.save(); ctx.translate(x, yb); ctx.rotate(rotA);
        ctx.fillStyle = tint('muted', 0.7); ctx.strokeStyle = LINE; ctx.lineWidth = 2;
        poly(ctx, [-14, -22, 14, -22, 22, 0, -22, 0], true); ctx.fill(); ctx.stroke();
        ctx.fillStyle = tint('red', 0.45); poly(ctx, [-30, -84, -54, -22, -30, -34], true); ctx.fill(); ctx.stroke(); poly(ctx, [30, -84, 54, -22, 30, -34], true); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(225,232,250,0.88)'; rounded(ctx, -30, -204, 60, 182, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = tint('red', 0.7); ctx.fillRect(-30, -170, 60, 8);
        ctx.fillStyle = tint('muted', 0.8); ctx.fillRect(-25, -204, 50, 14);
        ctx.restore();
      };
      const stage2 = (x, yb) => {
        ctx.fillStyle = tint('muted', 0.7); ctx.strokeStyle = LINE; ctx.lineWidth = 2;
        poly(ctx, [x - 10, yb - 12, x + 10, yb - 12, x + 15, yb, x - 15, yb], true); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(225,232,250,0.92)'; rounded(ctx, x - 25, yb - 128, 50, 116, 5); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - 25, yb - 126); ctx.quadraticCurveTo(x - 22, yb - 170, x, yb - 192); ctx.quadraticCurveTo(x + 22, yb - 170, x + 25, yb - 126); ctx.closePath();
        ctx.fillStyle = tint('red', 0.6); ctx.fill(); ctx.stroke();
        dot(ctx, x, yb - 96, 8, tint('cyan', 0.8)); ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, yb - 96, 8, 0, TAU); ctx.stroke();
      };
      const yb2 = by - 190;
      if (u < 1.5) { const p0 = smooth(u / 1.5); if (p0 > 0.05) plume(rx, by, 0.4 + 0.6 * p0, p0); } else if (burn1) plume(rx, by, 1, 1);
      if (burn2) plume(rx, yb2, 0.7, clamp((u - 7.3) / 0.3));
      if (sep) { const d = u - 6.5; stage1(rx - 30 * d, by + 20 * d + 60 * d * d, -0.25 * d); } else stage1(rx, by, 0);
      stage2(rx, yb2);
      ctx.restore();
      // Forces.
      const T1 = u < 1.5 ? 170 * smooth(u / 1.5) : burn1 ? 170 : 0;
      const W = sep ? 55 : 125 - 30 * clamp((u - 1.5) / 5);
      const ny = sep ? yb2 : by; const cmY = sep ? yb2 - 90 : by - 200;
      if (T1 > 4) { glow(ctx, COLORS.green, 8); arr(ctx, rx + 72, by - 30, rx + 72, by - 30 - T1, 'green', 7); ctx.shadowBlur = 0; }
      if (burn2) { glow(ctx, COLORS.green, 8); arr(ctx, rx + 60, yb2 - 20, rx + 60, yb2 - 140, 'green', 7); ctx.shadowBlur = 0; }
      const thrTip = burn2 ? yb2 - 140 : by - 30 - T1;
      if (T1 > 4 || burn2) {
        label(ctx, 'Thrust', rx + 92, thrTip + 12, { size: 22, weight: 800, fill: 'green', align: 'left' });
        label(ctx, 'gas pushes the rocket up', rx + 92, thrTip + 40, { size: 18, weight: 500, fill: 'muted', align: 'left' });
      }
      arr(ctx, rx - 72, cmY, rx - 72, cmY + W, 'red', 7);
      label(ctx, 'Weight', rx - 92, cmY + W - 30, { size: 22, weight: 800, fill: 'red', align: 'right' });
      label(ctx, 'gravity pulls down', rx - 92, cmY + W - 4, { size: 18, weight: 500, fill: 'muted', align: 'right' });
      if ((burn1 && u > 0.3) || burn2) {
        arr(ctx, rx - 40, ny + 30, rx - 40, ny + 96, 'orange', 5);
        label(ctx, 'engine pushes hot gas down', rx - 60, ny + 66, { size: 18, weight: 700, fill: 'orange', align: 'right' });
      }
      label(ctx, "Newton's third law:", X0 + 12, Y0 + 82, { size: 19, weight: 700, fill: 'cyan', align: 'left' });
      label(ctx, 'every push has an', X0 + 12, Y0 + 108, { size: 18, weight: 500, fill: 'muted', align: 'left' });
      label(ctx, 'equal, opposite push', X0 + 12, Y0 + 132, { size: 18, weight: 500, fill: 'muted', align: 'left' });
      const PH = u < 1.5 ? ['Engines start: thrust builds up', 'yellow'] : u < 6.5 ? ['Thrust > weight, so the rocket speeds up', 'green'] : u < 7.3 ? ['Stage 1 is empty: it drops away to save weight', 'orange'] : ['Stage 2 fires: a lighter rocket goes even faster', 'cyan'];
      chip(ctx, PH[0], cx, Y0 + 676, PH[1], 20);
      ctx.restore();
    },

    // An aerofoil in moving air: streamlines bunch and speed up over the
    // top (lower pressure), the wing turns air down, and the four forces.
    'wing-lift'(b, ctx, it, t) {
      const k = b.clock; const ch = 380; const LX = X0 + 200; const LY = Y0 + 330; const AOA = (5 * Math.PI) / 180;
      const C = it._c || (it._c = (() => {
        const xa = -0.52; const xb = 1.56; const NS = 70;
        const bump = (x) => Math.exp(-(((x - 0.32) / 0.42) ** 2));
        const lines = [0.1, 0.22, 0.36, 0.52, -0.14, -0.27, -0.41, -0.56].map((h) => {
          const xs = []; const ys = []; const T = [0]; const up = h > 0; const near = Math.exp(-Math.abs(h) / 0.3);
          for (let i = 0; i <= NS; i++) {
            const x = xa + ((xb - xa) * i) / NS;
            const down = (-0.09 / (1 + Math.exp(-(x - 0.75) / 0.12)) + 0.04 * Math.exp(-(((x + 0.05) / 0.25) ** 2))) * Math.exp(-Math.abs(h) / 0.5);
            const y = h + (up ? 0.126 * bump(x) * near : -0.025 * bump(x) * near) + down;
            xs.push(LX + x * ch); ys.push(LY - y * ch);
            if (i) { const v = up ? 1 + 0.9 * near * bump(x) : 1 - 0.3 * near * bump(x); T.push(T[i - 1] + (xb - xa) / NS / v); }
          }
          return { xs, ys, T, up };
        });
        const m = 0.04; const p = 0.4; const tk = 0.12; const foil = [];
        const surf = (x, s) => {
          const yt = 5 * tk * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1015 * x ** 4);
          const yc = x < p ? (m / (p * p)) * (2 * p * x - x * x) : (m / (1 - p) ** 2) * (1 - 2 * p + 2 * p * x - x * x);
          const dy = x < p ? ((2 * m) / (p * p)) * (p - x) : ((2 * m) / (1 - p) ** 2) * (p - x); const a = Math.atan(dy);
          const X = x - s * yt * Math.sin(a); const Y = yc + s * yt * Math.cos(a);
          foil.push(LX + ch * (X * Math.cos(AOA) + Y * Math.sin(AOA)), LY - ch * (-X * Math.sin(AOA) + Y * Math.cos(AOA)));
        };
        for (let i = 0; i <= 40; i++) surf((1 + Math.cos((Math.PI * i) / 40)) / 2, 1);
        for (let i = 1; i <= 40; i++) surf((1 - Math.cos((Math.PI * i) / 40)) / 2, -1);
        return { lines, foil };
      })());
      const TE = { x: LX + ch * Math.cos(AOA), y: LY + ch * Math.sin(AOA) };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'How a wing makes lift');
      // Pressure regions.
      ctx.fillStyle = tint('cyan', 0.1); ctx.beginPath(); ctx.ellipse(LX + 0.38 * ch, LY - 0.2 * ch, 0.56 * ch, 0.14 * ch, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = tint('orange', 0.1); ctx.beginPath(); ctx.ellipse(LX + 0.42 * ch, LY + 0.1 * ch, 0.5 * ch, 0.08 * ch, 0, 0, TAU); ctx.fill();
      // Streamlines and air parcels.
      for (const L of C.lines) {
        ctx.strokeStyle = L.up ? 'rgba(120,220,255,0.3)' : 'rgba(120,160,255,0.3)'; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i < L.xs.length; i++) { if (i) ctx.lineTo(L.xs[i], L.ys[i]); else ctx.moveTo(L.xs[i], L.ys[i]); }
        ctx.stroke();
        const Tt = L.T[L.T.length - 1]; const nP = 7;
        ctx.strokeStyle = L.up ? COLORS.cyan : COLORS.blue; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath();
        for (let j = 0; j < nP; j++) {
          const tau = mod(k * 0.75 + (j * Tt) / nP, Tt); let i = 1; while (i < L.T.length - 1 && L.T[i] < tau) i++;
          const f = (tau - L.T[i - 1]) / (L.T[i] - L.T[i - 1] || 1);
          const x = lerp(L.xs[i - 1], L.xs[i], f); const y = lerp(L.ys[i - 1], L.ys[i], f);
          const dx = L.xs[i] - L.xs[i - 1]; const dy = L.ys[i] - L.ys[i - 1]; const dl = Math.hypot(dx, dy) || 1;
          ctx.moveTo(x - (dx / dl) * 7, y - (dy / dl) * 7); ctx.lineTo(x + (dx / dl) * 7, y + (dy / dl) * 7);
        }
        ctx.stroke();
      }
      // The wing.
      glow(ctx, COLORS.blue, 10); ctx.fillStyle = 'rgba(70,100,190,0.85)'; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2.5;
      poly(ctx, C.foil, true); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      // Forces.
      const fx = LX + 0.3 * ch; const fy = LY + 6;
      ctx.save(); ctx.globalAlpha *= after(t, 0.6);
      glow(ctx, COLORS.green, 8); arr(ctx, fx, fy - 20, fx, Y0 + 152, 'green', 7); ctx.shadowBlur = 0;
      arr(ctx, fx, fy + 16, fx, Y0 + 500, 'red', 7);
      arr(ctx, LX - 12, LY + 2, LX - 112, LY + 2, 'yellow', 6);
      arr(ctx, TE.x + 12, TE.y, TE.x + 110, TE.y, 'purple', 6);
      chip(ctx, 'Lift', fx, Y0 + 128, 'green', 21); chip(ctx, 'Weight', fx, Y0 + 525, 'red', 21);
      chip(ctx, 'Thrust', LX - 108, LY - 30, 'yellow', 20); chip(ctx, 'Drag', TE.x + 152, TE.y, 'purple', 20);
      chip(ctx, 'Faster air: lower pressure', X0 + 610, Y0 + 190, 'cyan', 19);
      chip(ctx, 'Slower air: higher pressure', X0 + 600, Y0 + 470, 'orange', 19);
      ctx.restore();
      label(ctx, 'The plane flies left, so air flows past from left to right', cx, Y0 + 602, { size: 18, weight: 500, fill: 'muted' });
      label(ctx, 'Faster air on top, lower pressure: the wing is pushed up', cx, Y0 + 638, { size: 19, weight: 700, fill: 'ink' });
      label(ctx, 'The wing also turns the air downwards (downwash)', cx, Y0 + 672, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // A submarine floods its ballast tanks to dive, trims to hover, then
    // blows them with compressed air to rise: buoyancy against weight.
    'submarine-ballast'(b, ctx, it, t) {
      const k = b.clock; const u = cycle(t, 14, 0.6);
      const surfY = Y0 + 200; const top0 = Y0 + 234; const deep = Y0 + 430;
      let tank; let sy; let phase;
      if (u < 2) { tank = 0; sy = top0; phase = 0; } else if (u < 5) { tank = smooth((u - 2) / 2); sy = lerp(top0, deep, smooth((u - 2.4) / 2.6)); phase = 1; } else if (u < 7) { tank = lerp(1, 0.6, smooth((u - 5) / 0.8)); sy = deep; phase = 2; } else if (u < 10.5) { tank = lerp(0.6, 0, smooth((u - 7) / 1.2)); sy = lerp(deep, top0, smooth((u - 7.4) / 3)); phase = 3; } else { tank = 0; sy = top0; phase = 0; }
      sy += Math.sin(k * 1.4) * 2;
      const LB = lerp(90, 120, clamp((sy - top0) / 40)); const LW = 90 + 50 * tank;
      const sxC = X0 + 380; const L = sxC - 200; const R = sxC + 200; const T = sy - 42; const Bm = sy + 42;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Submarine ballast tanks');
      // Sea and sea floor.
      const sea = ctx.createLinearGradient(0, surfY, 0, Y0 + 640); sea.addColorStop(0, tint('blue', 0.12)); sea.addColorStop(1, tint('blue', 0.3));
      ctx.fillStyle = sea; ctx.fillRect(X0, surfY, FIG.w, Y0 + 640 - surfY);
      ctx.fillStyle = tint('yellow', 0.18); ctx.beginPath(); ctx.moveTo(X0, Y0 + 660);
      for (let x = 0; x <= FIG.w; x += 20) ctx.lineTo(X0 + x, Y0 + 632 + Math.sin(x / 50) * 6);
      ctx.lineTo(X1, Y0 + 660); ctx.closePath(); ctx.fill();
      // Bubbles and water leaving.
      const ventX = [L + 84, R - 84];
      if (phase === 1 && tank < 0.98) for (const vx of ventX) for (let i = 0; i < 6; i++) { const ph = mod(i / 6 + k * 0.9, 1); const y = T - 4 - ph * Math.max(10, T - surfY); if (y > surfY) dot(ctx, vx + Math.sin(i * 2 + k * 3) * 5, y, 3 + ph * 2, 'rgba(220,240,255,0.7)'); }
      if (phase === 3 && tank > 0.02) for (const vx of ventX) for (let i = 0; i < 5; i++) { const ph = mod(i / 5 + k * 1.1, 1); dot(ctx, vx + (i - 2) * 10, Bm + 4 + ph * 50, 3, `rgba(91,140,255,${1 - ph})`); }
      // Sail, hull, tanks.
      ctx.fillStyle = tint('muted', 0.45); ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2.5;
      rounded(ctx, sxC - 90, T - 40, 64, 46, 10); ctx.fill(); ctx.stroke();
      line(ctx, sxC - 70, T - 40, sxC - 70, T - 62, LINE, 3); line(ctx, sxC - 70, T - 62, sxC - 58, T - 62, LINE, 3);
      ctx.fillStyle = 'rgba(70,82,115,0.95)'; rounded(ctx, L, T, 400, 84, 42); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = tint('muted', 0.9); ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i < 3; i++) { const a = k * 6 + (i * TAU) / 3; ctx.moveTo(L - 6, sy); ctx.lineTo(L - 6 + Math.cos(a) * 4, sy + Math.sin(a) * 18); }
      ctx.stroke();
      for (const [xa, xb] of [[L + 26, L + 146], [R - 146, R - 26]]) {
        ctx.save(); rounded(ctx, xa, sy - 2, xb - xa, 36, 10); ctx.clip();
        ctx.fillStyle = 'rgba(225,235,255,0.16)'; ctx.fillRect(xa, sy - 2, xb - xa, 36);
        const wy = sy + 34 - 36 * tank;
        ctx.fillStyle = tint('blue', 0.85); ctx.beginPath(); ctx.moveTo(xa, wy);
        for (let x = xa; x <= xb; x += 10) ctx.lineTo(x, wy + Math.sin(x / 12 + k * 4) * (tank > 0.02 && tank < 0.98 ? 2 : 0));
        ctx.lineTo(xb, sy + 40); ctx.lineTo(xa, sy + 40); ctx.closePath(); ctx.fill();
        ctx.restore();
        ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 2; rounded(ctx, xa, sy - 2, xb - xa, 36, 10); ctx.stroke();
        const vx = (xa + xb) / 2;
        line(ctx, vx, sy - 2, vx, T + 2, LINE, 3);
        dot(ctx, vx, T + 3, 5, phase === 1 ? 'green' : 'muted');
        ctx.fillStyle = DARK; ctx.fillRect(vx - 14, Bm - 8, 6, 8); ctx.fillRect(vx + 8, Bm - 8, 6, 8);
      }
      // Compressed air bottles and lines.
      for (const bx of [sxC - 32, sxC + 4]) { ctx.fillStyle = tint('yellow', 0.4); ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 2; rounded(ctx, bx, sy - 30, 22, 60, 10); ctx.fill(); ctx.stroke(); }
      const blowing = phase === 3 && tank > 0.02;
      line(ctx, L + 146, sy - 14, sxC - 32, sy - 14, blowing ? COLORS.yellow : tint('yellow', 0.4), 3);
      line(ctx, sxC + 26, sy - 14, R - 146, sy - 14, blowing ? COLORS.yellow : tint('yellow', 0.4), 3);
      if (blowing) for (let i = 0; i < 3; i++) { const q = mod(i / 3 + k * 1.5, 1); dot(ctx, lerp(sxC - 32, L + 146, q), sy - 14, 4, 'yellow'); dot(ctx, lerp(sxC + 26, R - 146, q), sy - 14, 4, 'yellow'); }
      // Water surface on top.
      ctx.strokeStyle = 'rgba(200,225,255,0.7)'; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let x = 0; x <= FIG.w; x += 10) { const y = surfY + Math.sin(x / 30 + k * 1.5) * 3; if (x) ctx.lineTo(X0 + x, y); else ctx.moveTo(X0, y); }
      ctx.stroke();
      // Labels.
      line(ctx, sxC - 60, Bm + 18, L + 110, Bm - 6, tint('cyan', 0.7), 1.5); line(ctx, sxC + 60, Bm + 18, R - 110, Bm - 6, tint('cyan', 0.7), 1.5);
      label(ctx, 'ballast tanks', sxC, Bm + 26, { size: 19, weight: 700, fill: 'cyan' });
      label(ctx, 'vent', L + 86, T - 20, { size: 18, weight: 600, fill: 'green' });
      label(ctx, 'compressed air', sxC + 52, T - 20, { size: 18, weight: 700, fill: 'yellow' });
      // Forces.
      const ax = X0 + 650;
      glow(ctx, COLORS.cyan, 8); arr(ctx, ax, sy - 8, ax, sy - 8 - LB, 'cyan', 7); ctx.shadowBlur = 0;
      arr(ctx, ax, sy + 8, ax, sy + 8 + LW, 'red', 7);
      label(ctx, 'Buoyancy', ax + 14, sy - 8 - LB + 12, { size: 20, weight: 800, fill: 'cyan', align: 'left' });
      label(ctx, 'Weight', ax + 14, sy + 8 + LW - 12, { size: 20, weight: 800, fill: 'red', align: 'left' });
      const diff = LW - LB;
      chip(ctx, diff > 3 ? 'Weight > buoyancy: it sinks' : diff < -3 ? 'Buoyancy > weight: it rises' : phase === 2 ? 'Balanced: it hovers' : 'Balanced: it floats', X0 + 8, Y0 + 80, diff > 3 ? 'red' : diff < -3 ? 'cyan' : 'green', 19, 'left');
      const PH = ['Surfaced: tanks full of air, the sub floats', 'Diving: vents open, sea water floods the tanks', 'Hovering: some water blown out to balance', 'Surfacing: compressed air blows the water out'];
      chip(ctx, PH[phase], cx, Y0 + 682, 'ink', 19);
      ctx.restore();
    },

    // Battery → inverter → motor → wheels while driving; on braking the motor
    // works as a generator and sends energy back to the battery.
    'electric-car'(b, ctx, it, t) {
      const k = b.clock; const u = cycle(t, 10, 0.6);
      const vAt = (x) => (x < 1 ? 0 : x < 4.5 ? smooth((x - 1) / 3.5) : x < 6 ? 1 : x < 8.5 ? 1 - smooth((x - 6) / 2.5) : 0);
      let dist = 0; const NI = 40; for (let i = 0; i < NI; i++) dist += vAt(((i + 0.5) / NI) * u) * (u / NI);
      const v = vAt(u); const mode = u >= 1 && u < 6 ? 'drive' : u >= 6 && u < 8.5 ? 'regen' : 'stop';
      const charge = 80 - 2 * clamp((u - 1) / 5) + 0.6 * clamp((u - 6) / 2.5);
      const fc = mode === 'drive' ? 'yellow' : 'green'; const dir = mode === 'drive' ? 1 : -1;
      const C = it._c || (it._c = { track: mkPath([X0 + 100, Y0 + 212, X0 + 685, Y0 + 212]), wire: mkPath([X0 + 505, Y0 + 430, X0 + 540, Y0 + 412, X0 + 560, Y0 + 438]) });
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Electric car energy flow');
      const BX = [['Battery', `${charge.toFixed(1)}% full`, 'green'], ['Inverter', 'DC → AC', 'purple'], ['Motor', 'turns the axle', 'orange'], ['Wheels', 'move the car', 'cyan']];
      line(ctx, X0 + 100, Y0 + 212, X0 + 685, Y0 + 212, 'rgba(140,170,255,0.25)', 3);
      if (mode !== 'stop') pulses(ctx, C.track, 10, dir * k * 0.35, fc, 5, 8);
      BX.forEach(([n, s, c], i) => {
        const x = X0 + 20 + i * 195; const on = mode !== 'stop';
        ctx.save(); ctx.globalAlpha *= after(t, 0.1 + i * 0.15);
        panel(ctx, x, Y0 + 76, 160, 104, c, on ? 0.2 : 0.08, 14);
        label(ctx, n, x + 80, Y0 + 104, { size: 21, weight: 800, fill: c });
        label(ctx, s, x + 80, Y0 + 132, { size: 18, weight: 500, fill: 'ink' });
        if (i === 0) { ctx.fillStyle = tint('green', 0.2); ctx.fillRect(x + 20, Y0 + 152, 120, 12); ctx.fillStyle = COLORS.green; ctx.fillRect(x + 20, Y0 + 152, 1.2 * charge, 12); }
        if (i < 3 && on) { const ax = x + 160; if (dir > 0) arr(ctx, ax + 4, Y0 + 128, ax + 31, Y0 + 128, fc, 4); else arr(ctx, ax + 31, Y0 + 128, ax + 4, Y0 + 128, fc, 4); }
        ctx.restore();
      });
      // Road and car.
      const roll = dist * 300;
      line(ctx, X0, Y0 + 501, X1, Y0 + 501, LINE, 3);
      ctx.fillStyle = 'rgba(200,210,235,0.5)'; for (let i = 0; i < 11; i++) ctx.fillRect(X0 + mod(i * 80 - roll, 880) - 40, Y0 + 512, 40, 5);
      ctx.fillStyle = tint('blue', 0.22); ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 2.5;
      poly(ctx, [X0 + 150, Y0 + 452, X0 + 150, Y0 + 405, X0 + 175, Y0 + 385, X0 + 275, Y0 + 375, X0 + 335, Y0 + 330, X0 + 470, Y0 + 325, X0 + 545, Y0 + 375, X0 + 640, Y0 + 388, X0 + 660, Y0 + 410, X0 + 660, Y0 + 452], true); ctx.fill(); ctx.stroke();
      ctx.fillStyle = tint('cyan', 0.2); poly(ctx, [X0 + 290, Y0 + 375, X0 + 345, Y0 + 338, X0 + 400, Y0 + 336, X0 + 400, Y0 + 375], true); ctx.fill();
      poly(ctx, [X0 + 410, Y0 + 375, X0 + 410, Y0 + 336, X0 + 465, Y0 + 334, X0 + 525, Y0 + 375], true); ctx.fill();
      ctx.fillStyle = tint('green', mode === 'stop' ? 0.25 : 0.5); ctx.strokeStyle = COLORS.green; ctx.lineWidth = 2;
      rounded(ctx, X0 + 300, Y0 + 418, 205, 28, 5); ctx.fill(); ctx.stroke();
      label(ctx, 'battery pack', X0 + 402, Y0 + 433, { size: 18, weight: 700, fill: 'ink' });
      panel(ctx, X0 + 520, Y0 + 392, 40, 22, 'purple', 0.5, 4);
      ctx.lineCap = 'round'; ctx.strokeStyle = tint('yellow', 0.5); ctx.lineWidth = 3; poly(ctx, C.wire.pts); ctx.stroke();
      if (mode !== 'stop') pulses(ctx, C.wire, 3, dir * k * 0.9, fc, 4);
      const wa = roll / 46;
      wheel(ctx, X0 + 250, Y0 + 455, 46, wa); wheel(ctx, X0 + 560, Y0 + 455, 46, wa);
      if (mode !== 'stop') glow(ctx, COLORS.orange, 12);
      dot(ctx, X0 + 560, Y0 + 455, 19, tint('orange', 0.85)); ctx.shadowBlur = 0;
      ctx.strokeStyle = DARK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X0 + 560, Y0 + 455, 11, 0, TAU); ctx.stroke();
      line(ctx, X0 + 588, Y0 + 372, X0 + 560, Y0 + 392, tint('purple', 0.8), 1.5);
      label(ctx, 'inverter', X0 + 604, Y0 + 362, { size: 18, weight: 700, fill: 'purple' });
      line(ctx, X0 + 585, Y0 + 486, X0 + 612, Y0 + 535, tint('orange', 0.7), 1.5);
      label(ctx, 'motor', X0 + 618, Y0 + 540, { size: 18, weight: 700, fill: 'orange', align: 'left' });
      chip(ctx, `Speed ${Math.round(v * 50)} km/h`, X0 + 722, Y0 + 292, 'cyan', 19);
      const MT = { drive: ['Driving: battery → inverter → motor → wheels', 'The inverter turns the battery’s DC into AC for the motor'], regen: ['Regenerative braking: the motor charges the battery', 'Movement energy goes back in the battery, not wasted as heat'], stop: ['Stopped: no energy flowing', 'Nothing is used while the car stands still'] }[mode];
      chip(ctx, MT[0], cx, Y0 + 590, fc, 20);
      label(ctx, MT[1], cx, Y0 + 634, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // ─── Energy ───────────────────────────────────────────────────────────

    // Photons free electrons in a silicon cell; the p-n junction pushes them
    // out through the top contact, round the circuit and the bulb.
    'solar-panel'(b, ctx, it, t) {
      const k = b.clock;
      const C = it._c || (it._c = { wire: mkPath([X0 + 505, Y0 + 304, X0 + 505, Y0 + 250, X0 + 700, Y0 + 250, X0 + 700, Y0 + 600, X0 + 330, Y0 + 600, X0 + 330, Y0 + 526]) });
      const SX = X0 + 300; const SY = Y0 + 95;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Solar panel');
      ctx.strokeStyle = tint('yellow', 0.7); ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + k * 0.3; ctx.moveTo(SX + Math.cos(a) * 40, SY + Math.sin(a) * 40); ctx.lineTo(SX + Math.cos(a) * 52, SY + Math.sin(a) * 52); }
      ctx.stroke(); dot(ctx, SX, SY, 30, 'yellow', 22);
      label(ctx, 'Sunlight (photons)', SX - 64, SY, { size: 19, weight: 700, fill: 'yellow', align: 'right' });
      // The cell.
      ctx.fillStyle = tint('cyan', 0.3); ctx.fillRect(X0 + 140, Y0 + 300, 380, 12);
      ctx.fillStyle = tint('blue', 0.28); ctx.fillRect(X0 + 140, Y0 + 312, 380, 60);
      ctx.fillStyle = tint('red', 0.16); ctx.fillRect(X0 + 140, Y0 + 372, 380, 140);
      ctx.fillStyle = 'rgba(190,200,220,0.7)'; ctx.fillRect(X0 + 140, Y0 + 512, 380, 14);
      ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.strokeRect(X0 + 140, Y0 + 300, 380, 226);
      line(ctx, X0 + 140, Y0 + 372, X0 + 520, Y0 + 372, tint('yellow', 0.8), 2, [8, 6]);
      ctx.fillStyle = 'rgba(205,215,235,0.95)';
      for (let j = 0; j < 6; j++) ctx.fillRect(X0 + 165 + j * 60, Y0 + 302, 10, 14);
      ctx.fillRect(X0 + 495, Y0 + 302, 20, 14);
      // Photons, electrons and holes.
      for (let i = 0; i < 5; i++) {
        const xi = X0 + 340 + i * 38; const yi = Y0 + 395 + (rnd(i) - 0.5) * 30; const q = mod(k * 0.35 + i / 5 + rnd(i + 9) * 0.1, 1);
        const sx0 = SX + 10 + i * 6; const sy0 = SY + 36;
        if (q < 0.4) {
          const f = q / 0.4; const px = lerp(sx0, xi, f); const py = lerp(sy0, yi, f); const a = Math.atan2(yi - sy0, xi - sx0);
          glow(ctx, COLORS.yellow, 8); ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 3; ctx.beginPath();
          for (let s = -24; s <= 24; s += 3) { const w = Math.sin(s / 3.5) * 6; const x = px + Math.cos(a) * s - Math.sin(a) * w; const y = py + Math.sin(a) * s + Math.cos(a) * w; if (s === -24) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
          ctx.stroke(); ctx.shadowBlur = 0;
        } else if (q < 0.9) {
          const f = smooth((q - 0.4) / 0.45); const al = 1 - clamp((q - 0.8) / 0.1);
          if (q < 0.47) dot(ctx, xi, yi, 14 * (1 - (q - 0.4) / 0.07), `rgba(255,240,170,${0.8 * (1 - (q - 0.4) / 0.07)})`);
          const fx = X0 + 170 + Math.round((xi - X0 - 170) / 60) * 60;
          const ex = lerp(xi, Math.min(fx, X0 + 470), f); const ey = lerp(yi, Y0 + 324, f);
          dot(ctx, ex, ey, 8, `rgba(91,180,255,${al})`); label(ctx, '−', ex, ey - 1, { size: 18, weight: 800, fill: `rgba(5,8,22,${al})` });
          const hy = lerp(yi, Y0 + 494, f);
          ctx.strokeStyle = `rgba(251,113,133,${al})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(xi, hy, 8, 0, TAU); ctx.stroke();
          label(ctx, '+', xi, hy, { size: 16, weight: 800, fill: `rgba(251,113,133,${al})` });
        }
      }
      // Circuit and bulb.
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(210,220,240,0.85)'; ctx.lineWidth = 4; poly(ctx, C.wire.pts); ctx.stroke();
      pulses(ctx, C.wire, 16, k * 0.1, 'cyan', 4.5);
      const by = Y0 + 400;
      glow(ctx, COLORS.yellow, 26); dot(ctx, X0 + 700, by, 24, 'rgba(255,225,120,0.92)'); ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(120,80,20,0.9)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(X0 + 690, by + 10); ctx.lineTo(X0 + 693, by - 6); ctx.lineTo(X0 + 700, by + 4); ctx.lineTo(X0 + 707, by - 6); ctx.lineTo(X0 + 710, by + 10); ctx.stroke();
      ctx.fillStyle = tint('muted', 0.9); ctx.fillRect(X0 + 690, by + 22, 20, 14);
      arr(ctx, X0 + 560, Y0 + 250, X0 + 640, Y0 + 250, 'cyan', 4);
      // Labels.
      label(ctx, 'electrons flow', X0 + 600, Y0 + 226, { size: 18, weight: 700, fill: 'cyan' });
      label(ctx, 'bulb lights up', X0 + 668, by, { size: 18, weight: 700, fill: 'yellow', align: 'right' });
      label(ctx, 'n-type silicon', X0 + 152, Y0 + 342, { size: 18, weight: 700, fill: 'ink', align: 'left' });
      label(ctx, 'p–n junction', X0 + 152, Y0 + 392, { size: 18, weight: 700, fill: 'yellow', align: 'left' });
      label(ctx, 'p-type silicon', X0 + 152, Y0 + 460, { size: 18, weight: 700, fill: 'red', align: 'left' });
      label(ctx, 'metal contact', X0 + 152, Y0 + 548, { size: 18, weight: 600, fill: 'muted', align: 'left' });
      dot(ctx, X0 + 160, Y0 + 582, 7, 'rgba(91,180,255,1)'); label(ctx, 'electron', X0 + 174, Y0 + 582, { size: 18, weight: 600, fill: 'ink', align: 'left' });
      ctx.strokeStyle = COLORS.red; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(X0 + 262, Y0 + 582, 7, 0, TAU); ctx.stroke();
      label(ctx, 'hole', X0 + 276, Y0 + 582, { size: 18, weight: 600, fill: 'ink', align: 'left' });
      chip(ctx, '≈ 0.5 V per cell', X0 + 600, Y0 + 560, 'yellow', 18);
      chip(ctx, 'Light knocks electrons free; the junction pushes them one way', cx, Y0 + 645, 'yellow', 19);
      label(ctx, 'Electrons leave the n side, light the bulb, return to the p side', cx, Y0 + 685, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Reservoir water falls through the penstock, spins the turbine and the
    // generator, and electricity leaves along the power lines.
    'hydro-dam'(b, ctx, it, t) {
      const k = b.clock;
      const C = it._c || (it._c = {
        pen: mkPath([X0 + 282, Y0 + 390, X0 + 330, Y0 + 418, X0 + 500, Y0 + 518, X0 + 522, Y0 + 524]),
        tail: mkPath([X0 + 550, Y0 + 536, X0 + 620, Y0 + 536, X1 - 10, Y0 + 536]),
        wire: mkPath([X0 + 525, Y0 + 445, X0 + 525, Y0 + 420, X0 + 650, Y0 + 336, X0 + 700, Y0 + 332, X1, Y0 + 350]),
      });
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Hydroelectric dam');
      // Reservoir.
      ctx.fillStyle = tint('blue', 0.3); poly(ctx, [X0, Y0 + 215, X0 + 284, Y0 + 215, X0 + 270, Y0 + 560, X0, Y0 + 560], true); ctx.fill();
      ctx.strokeStyle = 'rgba(200,225,255,0.7)'; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let x = 0; x <= 280; x += 10) { const y = Y0 + 215 + Math.sin(x / 25 + k * 1.5) * 3; if (x) ctx.lineTo(X0 + x, y); else ctx.moveTo(X0, y); }
      ctx.stroke();
      for (let i = 0; i < 6; i++) { const q = mod(i / 6 + k * 0.15, 1); dot(ctx, lerp(X0 + 120 + rnd(i) * 60, X0 + 270, q), lerp(Y0 + 260 + rnd(i + 3) * 240, Y0 + 390, q), 3, tint('cyan', 0.6 * Math.sin(q * Math.PI))); }
      // Ground, river, dam, powerhouse.
      ctx.fillStyle = tint('orange', 0.14); ctx.fillRect(X0, Y0 + 560, FIG.w, 40);
      ctx.fillStyle = tint('blue', 0.35); ctx.fillRect(X0 + 545, Y0 + 522, X1 - X0 - 545, 38);
      ctx.strokeStyle = 'rgba(200,225,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let x = 620; x <= 800; x += 10) { const y = Y0 + 522 + Math.sin(x / 20 + k * 2) * 2; if (x === 620) ctx.moveTo(X0 + x, y); else ctx.lineTo(X0 + x, y); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(170,180,205,0.32)'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      poly(ctx, [X0 + 285, Y0 + 180, X0 + 335, Y0 + 180, X0 + 470, Y0 + 560, X0 + 270, Y0 + 560], true); ctx.fill(); ctx.stroke();
      ctx.fillStyle = tint('muted', 0.14); ctx.fillRect(X0 + 470, Y0 + 430, 150, 130); ctx.strokeRect(X0 + 470, Y0 + 430, 150, 130);
      ctx.fillStyle = tint('muted', 0.4); poly(ctx, [X0 + 462, Y0 + 430, X0 + 545, Y0 + 404, X0 + 628, Y0 + 430], true); ctx.fill();
      // Penstock and water.
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = LINE; ctx.lineWidth = 26; poly(ctx, C.pen.pts); ctx.stroke();
      ctx.strokeStyle = 'rgba(40,70,150,0.95)'; ctx.lineWidth = 20; poly(ctx, C.pen.pts); ctx.stroke();
      ctx.fillStyle = COLORS.cyan;
      for (let j = 0; j < 10; j++) { const q = mod(j / 10 + k * 0.55, 1); const P = at(C.pen, q ** 1.6 * C.pen.total); ctx.beginPath(); ctx.arc(P.x, P.y, 5, 0, TAU); ctx.fill(); }
      pulses(ctx, C.tail, 7, k * 0.25, tint('cyan', 0.8), 4);
      // Turbine and generator.
      const ta = k * 6; const tx = X0 + 525; const ty = Y0 + 525;
      ctx.fillStyle = DARK; ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(tx, ty, 26, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 3.5; ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = ta + (i * TAU) / 6; ctx.moveTo(tx + Math.cos(a) * 5, ty + Math.sin(a) * 5); ctx.quadraticCurveTo(tx + Math.cos(a + 0.6) * 16, ty + Math.sin(a + 0.6) * 16, tx + Math.cos(a + 0.4) * 23, ty + Math.sin(a + 0.4) * 23); }
      ctx.stroke();
      line(ctx, tx, ty - 26, tx, Y0 + 490, LINE, 5);
      panel(ctx, X0 + 495, Y0 + 445, 60, 45, 'green', 0.2, 8);
      ctx.save(); ctx.translate(X0 + 525, Y0 + 467); ctx.rotate(ta); ctx.fillStyle = tint('red', 0.85); ctx.fillRect(-16, -5, 16, 10); ctx.fillStyle = tint('blue', 0.85); ctx.fillRect(0, -5, 16, 10); ctx.restore();
      // Power line.
      pylon(ctx, X0 + 700, Y0 + 520, 210);
      ctx.strokeStyle = tint('yellow', 0.6); ctx.lineWidth = 3; poly(ctx, C.wire.pts); ctx.stroke();
      pulses(ctx, C.wire, 8, k * 0.3, 'yellow', 4.5, 8);
      // Height of the fall.
      arr(ctx, X0 + 34, Y0 + 370, X0 + 34, Y0 + 226, 'cyan', 3); arr(ctx, X0 + 34, Y0 + 370, X0 + 34, Y0 + 520, 'cyan', 3);
      // Labels.
      label(ctx, 'Reservoir', X0 + 150, Y0 + 300, { size: 22, weight: 800, fill: 'ink' });
      label(ctx, 'height of the fall', X0 + 50, Y0 + 460, { size: 18, weight: 600, fill: 'cyan', align: 'left' });
      label(ctx, 'Dam', X0 + 330, Y0 + 290, { size: 21, weight: 800, fill: 'ink' });
      label(ctx, 'intake', X0 + 262, Y0 + 366, { size: 18, weight: 700, fill: 'cyan', align: 'right' });
      label(ctx, 'penstock', X0 + 362, Y0 + 505, { size: 18, weight: 700, fill: 'blue' });
      label(ctx, 'turbine', tx, Y0 + 582, { size: 19, weight: 700, fill: 'teal' });
      label(ctx, 'generator', X0 + 562, Y0 + 467, { size: 19, weight: 700, fill: 'green', align: 'left' });
      label(ctx, 'power lines', X0 + 700, Y0 + 284, { size: 19, weight: 700, fill: 'yellow' });
      label(ctx, 'river', X0 + 772, Y0 + 503, { size: 18, weight: 700, fill: 'cyan' });
      chip(ctx, 'Falling water spins the turbine; the generator makes electricity', cx, Y0 + 640, 'cyan', 19);
      label(ctx, 'Stored energy of high water → movement → electricity', cx, Y0 + 682, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // ─── Making things ────────────────────────────────────────────────────

    // The hot nozzle traces each layer (outline, then infill) and the object
    // grows from the build plate, one layer on top of the last.
    '3d-printer'(b, ctx, it, t) {
      const N = clamp(Math.round(val(it.layers, 14)), 6, 18); const LH = Math.min(18, 250 / N); const LT = 0.55;
      const C = it._c || (it._c = (() => {
        const pts = []; for (let i = 0; i <= 40; i++) { const a = (i / 40) * TAU; pts.push(Math.cos(a), Math.sin(a)); }
        const inf = []; let d = 1; for (let x = -0.75; x <= 0.76; x += 0.25) { const h = Math.sqrt(1 - x * x) * 0.86; inf.push(x, -h * d, x, h * d); d = -d; }
        return { out: mkPath(pts), inf: mkPath(inf) };
      })());
      const oL = C.out.total; const total = oL + C.inf.total;
      const path = { total };
      const Rof = (i) => 55 + 45 * Math.sin((i / (N - 1)) * Math.PI * 0.85);
      const per = N * LT + 2.4; const u = cycle(t, per, 0.5);
      const done = u >= N * LT; const i = Math.min(N - 1, Math.floor(u / LT)); const q = done ? 1 : clamp((u - i * LT) / LT);
      const oA = 1 - after(u, N * LT + 1.7, 0.6);
      const ocx = X0 + 270; const bed = Y0 + 560;
      const dq = q * total; const P = dq < oL ? at(C.out, dq) : at(C.inf, dq - oL);
      let nx = ocx + P.x * Rof(i); let ny = bed - (i + 1) * LH;
      if (done) { const f = smooth((u - N * LT) / 0.8); nx = lerp(nx, X0 + 120, f); ny = lerp(ny, Y0 + 230, f); }
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || '3D printing');
      // Frame and bed.
      ctx.fillStyle = tint('muted', 0.3); ctx.strokeStyle = tint('muted', 0.9); ctx.lineWidth = 2;
      for (const fx of [X0 + 40, X0 + 484]) { ctx.fillRect(fx, Y0 + 70, 16, 530); ctx.strokeRect(fx, Y0 + 70, 16, 530); }
      ctx.fillRect(X0 + 40, Y0 + 70, 460, 14); ctx.fillRect(X0 + 40, Y0 + 590, 460, 14);
      ctx.fillStyle = tint('red', 0.4); ctx.strokeStyle = COLORS.red; rounded(ctx, X0 + 90, bed, 360, 12, 3); ctx.fill(); ctx.stroke();
      line(ctx, X0 + 270, bed + 12, X0 + 270, Y0 + 590, tint('muted', 0.8), 6);
      // Layers.
      ctx.save(); ctx.globalAlpha *= oA;
      const nDone = done ? N : i;
      for (let j = 0; j < nDone; j++) {
        const R = Rof(j); const y = bed - (j + 1) * LH;
        ctx.fillStyle = tint('orange', 0.42); ctx.strokeStyle = tint('orange', 0.95); ctx.lineWidth = 1.5;
        rounded(ctx, ocx - R, y + 1, 2 * R, LH - 2, (LH - 2) / 2); ctx.fill(); ctx.stroke();
        line(ctx, ocx - R + 6, y + 4, ocx + R - 6, y + 4, 'rgba(255,220,170,0.45)', 1.5);
      }
      if (!done) {
        const R = Rof(i); const y = bed - (i + 1) * LH;
        ctx.globalAlpha *= 0.25 + 0.6 * q; ctx.fillStyle = tint('orange', 0.5); rounded(ctx, ocx - R, y + 1, 2 * R, LH - 2, (LH - 2) / 2); ctx.fill(); ctx.globalAlpha /= 0.25 + 0.6 * q;
        dot(ctx, nx, ny + LH / 2, 5, 'rgba(255,200,120,1)', 12);
      }
      ctx.restore();
      // Gantry, hot end, filament, spool.
      ctx.fillStyle = tint('muted', 0.45); ctx.fillRect(X0 + 56, ny - 62, 428, 10);
      ctx.strokeStyle = tint('orange', 0.8); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X0 + 515, Y0 + 132); ctx.quadraticCurveTo(X0 + 520, ny - 150, nx, ny - 66); ctx.stroke();
      ctx.fillStyle = tint('muted', 0.7); ctx.strokeStyle = LINE; ctx.lineWidth = 2; rounded(ctx, nx - 22, ny - 68, 44, 38, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = tint('red', 0.75); ctx.fillRect(nx - 16, ny - 30, 32, 14);
      glow(ctx, COLORS.orange, 10); ctx.fillStyle = 'rgba(255,190,90,0.95)'; poly(ctx, [nx - 8, ny - 16, nx + 8, ny - 16, nx + 2, ny, nx - 2, ny], true); ctx.fill(); ctx.shadowBlur = 0;
      const sa = -t * 0.8;
      ctx.fillStyle = tint('orange', 0.25); ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(X0 + 530, Y0 + 110, 30, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); for (let s = 0; s < 3; s++) { const a = sa + (s * TAU) / 3; ctx.moveTo(X0 + 530, Y0 + 110); ctx.lineTo(X0 + 530 + Math.cos(a) * 26, Y0 + 110 + Math.sin(a) * 26); } ctx.stroke();
      dot(ctx, X0 + 530, Y0 + 110, 6, 'ink');
      label(ctx, 'filament', X0 + 572, Y0 + 110, { size: 18, weight: 700, fill: 'orange', align: 'left' });
      label(ctx, 'build plate', X0 + 518, bed + 6, { size: 18, weight: 600, fill: 'red', align: 'left' });
      // Top view of the current layer.
      const icx = X0 + 665; const icy = Y0 + 318; const Rs = Rof(i) * 0.95;
      panel(ctx, X0 + 545, Y0 + 175, 240, 258, 'cyan', 0.06, 14);
      label(ctx, `Top view: layer ${i + 1}`, icx, Y0 + 200, { size: 18, weight: 700, fill: 'cyan' });
      if (i > 0) { ctx.strokeStyle = tint('orange', 0.25); ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(icx, icy, Rof(i - 1) * 0.95, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
      ctx.save(); ctx.globalAlpha *= oA; ctx.translate(icx, icy); ctx.scale(Rs, Rs);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 6 / Rs; strokeSpan(ctx, C.out, 0, Math.min(dq, oL));
      ctx.strokeStyle = tint('orange', 0.7); ctx.lineWidth = 4 / Rs; strokeSpan(ctx, C.inf, 0, dq - oL);
      ctx.restore();
      if (!done) dot(ctx, icx + P.x * Rs, icy + P.y * Rs, 6, 'yellow', 10);
      label(ctx, dq < oL ? 'outline first…' : '…then infill', icx, Y0 + 455, { size: 18, weight: 600, fill: 'muted' });
      chip(ctx, done ? `All ${N} layers done!` : `Layer ${i + 1} of ${N}`, X0 + 270, Y0 + 636, done ? 'green' : 'cyan', 20);
      label(ctx, 'A hot nozzle (≈ 200 °C) melts plastic and draws one layer at a time', cx, Y0 + 680, { size: 18, weight: 500, fill: 'ink' });
      ctx.restore();
    },

    // A jointed arm picking up a block and placing it: inverse kinematics
    // turns each target into joint angles; sensors → controller → motors.
    'robot-arm'(b, ctx, it, t) {
      const k = b.clock; const u = cycle(t, 9, 0.6);
      const S = { x: X0 + 90, y: Y0 + 470 }; const L1 = 230; const L2 = 200; const L3 = 55;
      const PICK = X0 + 260; const PLACE = X0 + 450; const BY = Y0 + 560; const BS = 44; const gy = BY - BS - 4; const HX = X0 + 300; const HY = Y0 + 300;
      const KF = it._kf || (it._kf = [[0, HX, HY, 0], [1.2, PICK, gy - 90, 0], [2.0, PICK, gy, 0], [2.4, PICK, gy, 1], [3.0, PICK, gy - 90, 1], [4.6, PLACE, gy - 90, 1], [5.2, PLACE, gy, 1], [5.6, PLACE, gy, 0], [6.2, PLACE, gy - 90, 0], [7.6, HX, HY, 0], [9, HX, HY, 0]]);
      let j = 0; while (j < KF.length - 2 && KF[j + 1][0] <= u) j++;
      const f = smooth((u - KF[j][0]) / (KF[j + 1][0] - KF[j][0]));
      const px = lerp(KF[j][1], KF[j + 1][1], f); const py = lerp(KF[j][2], KF[j + 1][2], f); const grip = lerp(KF[j][3], KF[j + 1][3], f);
      const Wx = px; const Wy = py - L3;
      const dx = Wx - S.x; const dy = S.y - Wy; const d = clamp(Math.hypot(dx, dy), Math.abs(L1 - L2) + 1, L1 + L2 - 1);
      const e = Math.acos(clamp((d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2), -1, 1));
      const t1 = Math.atan2(dy, dx) + Math.atan2(L2 * Math.sin(e), L1 + L2 * Math.cos(e)); const t2 = t1 - e;
      const E = { x: S.x + L1 * Math.cos(t1), y: S.y - L1 * Math.sin(t1) };
      const Wp = { x: E.x + L2 * Math.cos(t2), y: E.y - L2 * Math.sin(t2) };
      const holding = u >= 2.4 && u < 5.6;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Robot arm');
      // Table and pads.
      ctx.fillStyle = tint('muted', 0.15); ctx.fillRect(X0 + 10, BY, 520, 14); line(ctx, X0 + 10, BY, X0 + 530, BY, LINE, 3);
      for (const x of [PICK, PLACE]) { ctx.strokeStyle = tint('yellow', 0.5); ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.strokeRect(x - BS / 2 - 4, BY - BS - 4, BS + 8, BS + 4); ctx.setLineDash([]); }
      label(ctx, 'pick', PICK, BY + 34, { size: 18, weight: 600, fill: 'muted' }); label(ctx, 'place', PLACE, BY + 34, { size: 18, weight: 600, fill: 'muted' });
      // The block.
      const drawBlock = (x, y, a) => { ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = tint('yellow', 0.45); ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 2.5; rounded(ctx, x - BS / 2, y, BS, BS, 6); ctx.fill(); ctx.stroke(); ctx.restore(); };
      if (holding) drawBlock(px, py + 4, 1);
      else if (u < 2.4) drawBlock(PICK, BY - BS, after(u, 0, 0.3));
      else if (u < 7.6) drawBlock(PLACE, BY - BS, 1);
      else { drawBlock(PLACE, BY - BS, 1 - smooth((u - 7.6) / 0.6)); drawBlock(PICK, BY - BS, smooth((u - 8.2) / 0.6)); }
      // Target marker.
      const tx = KF[j + 1][1]; const ty = KF[j + 1][2];
      if (Math.hypot(tx - px, ty - py) > 70) {
      ctx.strokeStyle = tint('yellow', 0.6); ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(tx, ty, 14, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      line(ctx, tx - 20, ty, tx + 20, ty, tint('yellow', 0.6), 1.5); line(ctx, tx, ty - 20, tx, ty + 20, tint('yellow', 0.6), 1.5);
      }
      // Pedestal and arm.
      ctx.fillStyle = tint('muted', 0.35); ctx.strokeStyle = tint('muted', 0.9); ctx.lineWidth = 2; rounded(ctx, S.x - 32, S.y, 64, BY - S.y, 6); ctx.fill(); ctx.stroke();
      ctx.lineCap = 'round';
      const link = (x0, y0, x1, y1, w) => { line(ctx, x0, y0, x1, y1, COLORS.cyan, w + 6); line(ctx, x0, y0, x1, y1, '#14204a', w); };
      link(S.x, S.y, E.x, E.y, 18); link(E.x, E.y, Wp.x, Wp.y, 14); link(Wp.x, Wp.y, px, py, 8);
      const gap = lerp(34, BS / 2 + 4, grip);
      line(ctx, px - gap - 3, py, px + gap + 3, py, COLORS.cyan, 6);
      line(ctx, px - gap, py, px - gap, py + 30, COLORS.cyan, 6); line(ctx, px + gap, py, px + gap, py + 30, COLORS.cyan, 6);
      const motorGlow = 6 + 6 * Math.abs(Math.sin(k * 4));
      for (const [x, y, r] of [[S.x, S.y, 16], [E.x, E.y, 13], [Wp.x, Wp.y, 10]]) { glow(ctx, COLORS.orange, motorGlow); ctx.fillStyle = DARK; ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0; dot(ctx, x, y, 3, 'orange'); }
      label(ctx, 'shoulder', S.x + 40, S.y + 24, { size: 18, weight: 600, fill: 'muted', align: 'left' });
      label(ctx, 'elbow', E.x - 20, E.y - 20, { size: 18, weight: 600, fill: 'muted', align: 'right' });
      label(ctx, 'gripper', px + 42, py + 32, { size: 18, weight: 600, fill: 'muted', align: 'left' });
      // Control loop.
      const LB = [['Sensors', 'camera + angles', 'cyan'], ['Controller', 'works out angles', 'purple'], ['Motors', 'turn the joints', 'orange']];
      const ph = Math.floor(mod(k * 1.5, 3));
      LB.forEach(([n, s, c], i) => {
        const y = Y0 + 140 + i * 130; const on = i === ph;
        if (on) glow(ctx, color(c), 12);
        panel(ctx, X0 + 560, y, 190, 84, c, on ? 0.24 : 0.1, 14); ctx.shadowBlur = 0;
        label(ctx, n, X0 + 655, y + 30, { size: 21, weight: 800, fill: c });
        label(ctx, s, X0 + 655, y + 58, { size: 18, weight: 500, fill: 'ink' });
        if (i < 2) arr(ctx, X0 + 655, y + 88, X0 + 655, y + 126, i === ph ? c : 'muted', 4);
      });
      ctx.strokeStyle = color(ph === 2 ? 'orange' : 'muted'); ctx.lineWidth = 4; ctx.lineJoin = 'round';
      poly(ctx, [X0 + 750, Y0 + 442, X0 + 780, Y0 + 442, X0 + 780, Y0 + 182, X0 + 768, Y0 + 182]); ctx.stroke();
      arr(ctx, X0 + 772, Y0 + 182, X0 + 754, Y0 + 182, ph === 2 ? 'orange' : 'muted', 4);
      para(ctx, 'The loop repeats many times a second', X0 + 560, Y0 + 540, 200, 18, 'muted', 500, 2);
      chip(ctx, `Shoulder ${Math.round((t1 * 180) / Math.PI)}°`, X0 + 150, Y0 + 634, 'orange', 19);
      chip(ctx, `Elbow ${Math.round(180 - (e * 180) / Math.PI)}°`, X0 + 380, Y0 + 634, 'orange', 19);
      label(ctx, 'Inverse kinematics: from the target, work out each joint angle', cx, Y0 + 680, { size: 18, weight: 500, fill: 'ink' });
      ctx.restore();
    },

    // ─── Water and control ────────────────────────────────────────────────

    // A boat climbs a canal lock: in, gate shut, the chamber fills from the
    // upper canal, the upper gate opens, out; then the lock empties again.
    'canal-lock'(b, ctx, it, t) {
      const k = b.clock; const u = cycle(t, 14, 0.6);
      const UL = Y0 + 290; const LL = Y0 + 430; const GU = X0 + 250; const GL = X0 + 560;
      let level; let upOpen; let lowOpen; let bx; let step; let sIn = 0; let sOut = 0;
      if (u < 2.6) { step = 0; level = LL; lowOpen = 1; upOpen = 0; bx = lerp(X0 + 760, X0 + 405, smooth(u / 2.6)); } else if (u < 3.6) { step = 1; level = LL; lowOpen = 1 - smooth((u - 2.6) / 0.8); upOpen = 0; bx = X0 + 405; } else if (u < 7.6) { step = 2; level = lerp(LL, UL, smooth((u - 3.6) / 4)); lowOpen = 0; upOpen = 0; bx = X0 + 405; sIn = 1; } else if (u < 8.6) { step = 3; level = UL; upOpen = smooth((u - 7.6) / 0.8); lowOpen = 0; bx = X0 + 405; } else if (u < 11.2) { step = 4; level = UL; upOpen = 1; lowOpen = 0; bx = lerp(X0 + 405, X0 + 60, smooth((u - 8.6) / 2.6)); } else { step = 5; const q = (u - 11.2) / 2.8; upOpen = 1 - smooth(q / 0.3); level = lerp(UL, LL, smooth((q - 0.3) / 0.55)); lowOpen = smooth((q - 0.85) / 0.15); sOut = q > 0.3 && q < 0.85 ? 1 : 0; bx = X0 + 60 - 260 * q; }
      const wl = bx < GU ? UL : bx < GL ? level : LL;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Canal lock');
      // Back walls and level marks.
      ctx.strokeStyle = tint('muted', 0.5); ctx.lineWidth = 2; poly(ctx, [X0, Y0 + 262, GL, Y0 + 262, GL, Y0 + 400, X1, Y0 + 400]); ctx.stroke();
      line(ctx, GU, UL, GL, UL, tint('cyan', 0.35), 1.5, [6, 6]); line(ctx, GU, LL, GL, LL, tint('cyan', 0.35), 1.5, [6, 6]);
      // Water.
      const water = (x, y, w, h) => { ctx.fillStyle = tint('blue', 0.35); ctx.fillRect(x, y, w, h); line(ctx, x, y, x + w, y, 'rgba(200,225,255,0.75)', 2.5); };
      water(X0, UL, GU - X0, Y0 + 440 - UL); water(GU, level, GL - GU, Y0 + 540 - level); water(GL, LL, X1 - GL, Y0 + 540 - LL);
      // Ground.
      ctx.fillStyle = tint('orange', 0.16); ctx.strokeStyle = tint('orange', 0.55); ctx.lineWidth = 2;
      poly(ctx, [X0, Y0 + 440, GU, Y0 + 440, GU, Y0 + 540, X1, Y0 + 540, X1, Y0 + 600, X0, Y0 + 600], true); ctx.fill(); ctx.stroke();
      // Sluice jets.
      ctx.strokeStyle = tint('cyan', 0.9); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
      if (sIn) for (let i = 0; i < 6; i++) { const x = GU + 10 + mod(i * 16 + k * 120, 96); const y = Y0 + 426 + (i % 2) * 6; ctx.moveTo(x, y); ctx.lineTo(x + 10, y); }
      if (sOut) for (let i = 0; i < 6; i++) { const x = GL + 10 + mod(i * 16 + k * 120, 96); const y = Y0 + 526 + (i % 2) * 6; ctx.moveTo(x, y); ctx.lineTo(x + 10, y); }
      ctx.stroke();
      // The boat.
      ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0, FIG.w, FIG.h); ctx.clip();
      ctx.fillStyle = tint('red', 0.45); ctx.strokeStyle = COLORS.red; ctx.lineWidth = 2;
      poly(ctx, [bx - 96, wl - 14, bx + 82, wl - 14, bx + 78, wl + 12, bx - 76, wl + 12], true); ctx.fill(); ctx.stroke();
      ctx.fillStyle = tint('green', 0.4); ctx.strokeStyle = COLORS.green; rounded(ctx, bx - 58, wl - 40, 118, 26, 6); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(251,191,36,0.7)'; ctx.fillRect(bx - 46 + i * 26, wl - 33, 12, 10); }
      ctx.fillStyle = tint('muted', 0.9); ctx.fillRect(bx + 36, wl - 52, 6, 12);
      ctx.restore();
      // Gates.
      const gate = (x, yb, open) => {
        ctx.save(); ctx.globalAlpha *= 1 - 0.8 * open;
        ctx.fillStyle = tint('orange', 0.6); ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2;
        ctx.fillRect(x - 8, Y0 + 262, 16, yb - Y0 - 262); ctx.strokeRect(x - 8, Y0 + 262, 16, yb - Y0 - 262);
        line(ctx, x, Y0 + 262, x + (x === GU ? -60 : 60), Y0 + 254, tint('orange', 0.9), 5);
        ctx.restore();
        if (open > 0.5) { ctx.strokeStyle = tint('orange', 0.6); ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]); ctx.strokeRect(x - 8, Y0 + 262, 16, yb - Y0 - 262); ctx.setLineDash([]); }
      };
      gate(GU, Y0 + 440, upOpen); gate(GL, Y0 + 540, lowOpen);
      if (sIn) { ctx.fillStyle = DARK; ctx.fillRect(GU - 8, Y0 + 418, 16, 20); }
      if (sOut) { ctx.fillStyle = DARK; ctx.fillRect(GL - 8, Y0 + 518, 16, 20); }
      // Labels.
      label(ctx, 'Upper canal', X0 + 118, Y0 + 224, { size: 20, weight: 700, fill: 'ink' });
      label(ctx, 'Lock chamber', X0 + 405, Y0 + 224, { size: 20, weight: 700, fill: 'ink' });
      label(ctx, 'Lower canal', X0 + 690, Y0 + 370, { size: 20, weight: 700, fill: 'ink' });
      label(ctx, 'upper gate', GU, Y0 + 172, { size: 18, weight: 600, fill: 'orange' });
      label(ctx, 'lower gate', GL, Y0 + 172, { size: 18, weight: 600, fill: 'orange' });
      label(ctx, upOpen > 0.5 ? 'open' : 'closed', GU, Y0 + 200, { size: 18, weight: 700, fill: upOpen > 0.5 ? 'green' : 'red' });
      label(ctx, lowOpen > 0.5 ? 'open' : 'closed', GL, Y0 + 200, { size: 18, weight: 700, fill: lowOpen > 0.5 ? 'green' : 'red' });
      label(ctx, 'sluice →', GU - 14, Y0 + 480, { size: 18, weight: 600, fill: 'cyan', align: 'right' });
      const ST = ['Boat enters; the lower gate is open', 'The lower gate closes behind the boat', 'Sluice opens: water flows in and lifts the boat', 'Water levels match, so the upper gate opens', 'The boat sails out at the higher level', 'The lock empties, ready for the next boat'];
      chip(ctx, `${step + 1}. ${ST[step]}`, cx, Y0 + 640, 'cyan', 19);
      label(ctx, 'Gravity moves the water: no pumps needed', cx, Y0 + 682, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // A thermostat loop: sensor → controller → heater → room → sensor, with
    // the temperature overshooting, then settling at the set point.
    'feedback-loop'(b, ctx, it, t) {
      const k = b.clock; const SPt = val(it.setpoint, 20); const T0 = val(it.start, SPt - 8);
      const u = cycle(t, 14, 0.8); const tau = 60 * clamp(u / 10);
      const Tof = (x) => SPt - (SPt - T0) * Math.exp(-x / 9) * Math.cos((TAU * x) / 22);
      const T = Tof(tau); const err = SPt - T; const pw = clamp(0.5 + 0.22 * err);
      const C = it._c || (it._c = { loop: mkPath([X0 + 92, Y0 + 170, X0 + 680, Y0 + 170, X0 + 680, Y0 + 280, X0 + 70, Y0 + 280, X0 + 70, Y0 + 192]) });
      const sgn = (v) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}`;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Feedback control loop');
      // Loop arrows and moving signals.
      ctx.strokeStyle = 'rgba(200,215,255,0.55)'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; poly(ctx, C.loop.pts); ctx.stroke();
      pulses(ctx, C.loop, 14, k * 0.12, 'cyan', 4);
      arr(ctx, X0 + 108, Y0 + 170, X0 + 138, Y0 + 170, 'rgba(200,215,255,0.8)', 3); arr(ctx, X0 + 330, Y0 + 170, X0 + 358, Y0 + 170, 'rgba(200,215,255,0.8)', 3);
      arr(ctx, X0 + 550, Y0 + 170, X0 + 578, Y0 + 170, 'orange', 3); arr(ctx, X0 + 560, Y0 + 280, X0 + 524, Y0 + 280, 'rgba(200,215,255,0.8)', 3);
      arr(ctx, X0 + 70, Y0 + 230, X0 + 70, Y0 + 194, 'rgba(200,215,255,0.8)', 3);
      label(ctx, 'Set point: ' + `${num(SPt)} °C`, X0 + 12, Y0 + 92, { size: 19, weight: 700, fill: 'yellow', align: 'left' });
      arr(ctx, X0 + 70, Y0 + 108, X0 + 70, Y0 + 146, 'yellow', 3);
      ctx.fillStyle = DARK; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(X0 + 70, Y0 + 170, 22, 0, TAU); ctx.fill(); ctx.stroke();
      label(ctx, '+', X0 + 92, Y0 + 140, { size: 18, weight: 800, fill: 'ink' }); label(ctx, '−', X0 + 92, Y0 + 204, { size: 20, weight: 800, fill: 'ink' });
      line(ctx, X0 + 55, Y0 + 155, X0 + 85, Y0 + 185, LINE, 2); line(ctx, X0 + 85, Y0 + 155, X0 + 55, Y0 + 185, LINE, 2);
      const box = (x, y, w, h, c, a, l1, l2, f2 = 'ink') => { ctx.fillStyle = DARK; rounded(ctx, x, y, w, h, 14); ctx.fill(); panel(ctx, x, y, w, h, c, a, 14); label(ctx, l1, x + w / 2, y + 22, { size: 20, weight: 800, fill: c }); if (l2) label(ctx, l2, x + w / 2, y + 50, { size: 18, weight: 600, fill: f2 }); };
      box(X0 + 140, Y0 + 135, 190, 72, 'purple', 0.14, 'Controller', `error ${sgn(err)} °C`);
      ctx.fillStyle = DARK; rounded(ctx, X0 + 360, Y0 + 135, 190, 72, 14); ctx.fill();
      glow(ctx, COLORS.orange, 6 + 16 * pw);
      panel(ctx, X0 + 360, Y0 + 135, 190, 72, 'orange', 0.08 + 0.3 * pw, 14); ctx.shadowBlur = 0;
      label(ctx, 'Heater', X0 + 455, Y0 + 157, { size: 20, weight: 800, fill: 'orange' });
      ctx.fillStyle = tint('orange', 0.2); ctx.fillRect(X0 + 385, Y0 + 180, 100, 12); ctx.fillStyle = COLORS.orange; ctx.fillRect(X0 + 385, Y0 + 180, 100 * pw, 12);
      label(ctx, `${Math.round(pw * 100)}%`, X0 + 495, Y0 + 186, { size: 18, weight: 700, fill: 'ink', align: 'left' });
      box(X0 + 580, Y0 + 135, 200, 72, err > 0 ? 'blue' : 'red', 0.1 + 0.25 * Math.min(1, Math.abs(err) / 4), 'Room', `${T.toFixed(1)} °C`);
      box(X0 + 360, Y0 + 250, 190, 62, 'teal', 0.14, 'Sensor', null);
      label(ctx, 'thermometer', X0 + 455, Y0 + 296, { size: 18, weight: 500, fill: 'muted' });
      label(ctx, 'heat', X0 + 565, Y0 + 120, { size: 18, weight: 700, fill: 'orange' });
      label(ctx, 'feedback: measured temperature', X0 + 215, Y0 + 302, { size: 18, weight: 600, fill: 'muted' });
      // Graph.
      const g = { x: X0 + 90, y: Y0 + 385, w: 640, h: 190 }; const lo = SPt - 10; const hi = SPt + 5;
      const gy = (v) => g.y + g.h - ((v - lo) / (hi - lo)) * g.h;
      ctx.strokeStyle = 'rgba(140,170,255,0.12)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let i = 1; i <= 3; i++) { const y = g.y + g.h - (i / 3) * g.h; ctx.moveTo(g.x, y); ctx.lineTo(g.x + g.w, y); }
      ctx.stroke();
      arrow(ctx, g.x, g.y + g.h, g.x + g.w + 14, g.y + g.h, 'rgba(200,215,255,0.7)', 2.5); arrow(ctx, g.x, g.y + g.h, g.x, g.y - 14, 'rgba(200,215,255,0.7)', 2.5);
      for (let i = 0; i <= 3; i++) label(ctx, num(lo + i * 5), g.x - 10, g.y + g.h - (i / 3) * g.h, { size: 17, weight: 500, fill: 'muted', align: 'right' });
      for (let i = 0; i <= 3; i++) label(ctx, String(i * 20), g.x + (i / 3) * g.w, g.y + g.h + 20, { size: 17, weight: 500, fill: 'muted' });
      label(ctx, 'temperature (°C)', g.x + 10, g.y - 14, { size: 18, weight: 600, fill: 'muted', align: 'left' });
      label(ctx, 'time (minutes)', g.x + g.w + 10, g.y + g.h + 46, { size: 18, weight: 600, fill: 'muted', align: 'right' });
      line(ctx, g.x, gy(SPt), g.x + g.w, gy(SPt), 'yellow', 2, [8, 6]);
      label(ctx, 'set point', g.x + g.w - 4, gy(SPt) - 16, { size: 18, weight: 700, fill: 'yellow', align: 'right' });
      glow(ctx, COLORS.cyan, 8); ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 3.5; ctx.beginPath();
      const NSm = 90; for (let i = 0; i <= NSm; i++) { const x = (tau * i) / NSm; const X = g.x + (x / 60) * g.w; const Y = gy(Tof(x)); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
      ctx.stroke(); ctx.shadowBlur = 0;
      dot(ctx, g.x + (tau / 60) * g.w, gy(T), 7, 'ink', 12);
      const msg = Math.abs(err) < 0.3 && tau > 30 ? ['Settled: the heater just balances the heat lost', 'green'] : err > 0 ? ['Too cold: big error, so the heater turns up', 'blue'] : ['Overshoot: too warm, so the heater turns down', 'red'];
      chip(ctx, msg[0], cx, Y0 + 672, msg[1], 19);
      ctx.restore();
    },

    // Power station → step-up transformer → pylons at 400 kV → substation →
    // pole transformer → homes at 230 V, with energy pulses along the wires.
    'power-grid'(b, ctx, it, t) {
      const k = b.clock;
      const C = it._c || (it._c = (() => {
        const pts = [X0 + 150, Y0 + 284, X0 + 185, Y0 + 290, X0 + 245, Y0 + 290];
        const sagTo = (x0, y0, x1, y1, sg, n = 8) => { for (let i = 1; i <= n; i++) { const f = i / n; pts.push(lerp(x0, x1, f), lerp(y0, y1, f) + sg * 4 * f * (1 - f)); } };
        sagTo(X0 + 245, Y0 + 290, X0 + 370, Y0 + 187, 10);
        const m0 = pts.length / 2 - 1;
        sagTo(X0 + 370, Y0 + 187, X0 + 530, Y0 + 187, 24); sagTo(X0 + 530, Y0 + 187, X0 + 690, Y0 + 187, 24);
        for (let i = 1; i <= 12; i++) { const f = i / 12; const a = (1 - f) * (1 - f); const bb = 2 * f * (1 - f); const c = f * f; pts.push(a * (X0 + 690) + bb * (X0 + 790) + c * (X0 + 712), a * (Y0 + 187) + bb * (Y0 + 300) + c * (Y0 + 472)); }
        sagTo(X0 + 712, Y0 + 472, X0 + 660, Y0 + 565, 6);
        pts.push(X0 + 560, Y0 + 565);
        const m1 = pts.length / 2 - 1;
        sagTo(X0 + 560, Y0 + 565, X0 + 420, Y0 + 482, 14);
        const m2 = pts.length / 2 - 1;
        sagTo(X0 + 420, Y0 + 482, X0 + 330, Y0 + 534, 8, 5);
        pts.push(X0 + 90, Y0 + 534);
        const p = mkPath(pts);
        return { p, d0: p.cum[m0], d1: p.cum[m1], d2: p.cum[m2] };
      })());
      const { p } = C;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The power grid');
      // Ground lines.
      line(ctx, X0, Y0 + 330, X1, Y0 + 330, tint('green', 0.5), 2); line(ctx, X0, Y0 + 600, X1, Y0 + 600, tint('green', 0.5), 2);
      // Station with chimney and smoke.
      for (let i = 0; i < 5; i++) { const ph = mod(i / 5 + k * 0.15, 1); dot(ctx, X0 + 122 + ph * 30, Y0 + 166 - ph * 60, 8 + ph * 12, `rgba(190,195,210,${0.4 * (1 - ph)})`); }
      ctx.fillStyle = tint('muted', 0.35); ctx.strokeStyle = tint('muted', 0.9); ctx.lineWidth = 2;
      ctx.fillRect(X0 + 110, Y0 + 170, 25, 80); ctx.strokeRect(X0 + 110, Y0 + 170, 25, 80);
      ctx.fillStyle = tint('purple', 0.22); ctx.strokeStyle = COLORS.purple; ctx.fillRect(X0 + 20, Y0 + 250, 130, 80); ctx.strokeRect(X0 + 20, Y0 + 250, 130, 80);
      ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(X0 + 50, Y0 + 292, 17, 0, TAU); ctx.stroke();
      ctx.beginPath(); for (let i = 0; i <= 12; i++) { const x = X0 + 40 + i * (20 / 12); const y = Y0 + 292 + Math.sin(k * 3 + i / 2) * 6; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
      label(ctx, '25 kV', X0 + 104, Y0 + 293, { size: 18, weight: 800, fill: 'yellow' });
      // Transformers.
      const tfm = (x, y, w, h, c) => {
        panel(ctx, x, y, w, h, c, 0.2, 6);
        ctx.strokeStyle = color(c); ctx.lineWidth = 2;
        for (const sx of [0.32, 0.68]) { ctx.beginPath(); for (let i = 0; i < 4; i++) ctx.arc(x + w * sx, y + h * 0.28 + i * h * 0.15, h * 0.08, -Math.PI / 2, Math.PI / 2); ctx.stroke(); }
      };
      // Wires and pulses.
      ctx.strokeStyle = 'rgba(210,220,240,0.6)'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; poly(ctx, p.pts); ctx.stroke();
      for (let i = 0; i < 22; i++) {
        const d = mod(i / 22 + k * 0.06, 1) * p.total; const P = at(p, d);
        const c = d < C.d0 ? 'yellow' : d < C.d1 ? 'orange' : d < C.d2 ? 'cyan' : 'green';
        dot(ctx, P.x, P.y, d < C.d0 || d >= C.d1 ? 5 : 4, c);
      }
      tfm(X0 + 185, Y0 + 270, 60, 60, 'orange');
      for (const x of [X0 + 330, X0 + 490, X0 + 650]) pylon(ctx, x, Y0 + 330, 165);
      pylon(ctx, X0 + 740, Y0 + 600, 150);
      tfm(X0 + 560, Y0 + 545, 100, 55, 'cyan');
      ctx.strokeStyle = tint('cyan', 0.45); ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]); ctx.strokeRect(X0 + 552, Y0 + 532, 116, 68); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(160,120,80,0.8)'; ctx.fillRect(X0 + 416, Y0 + 470, 8, 130); ctx.fillRect(X0 + 396, Y0 + 478, 48, 5);
      ctx.fillStyle = tint('green', 0.5); ctx.strokeStyle = COLORS.green; ctx.lineWidth = 2; rounded(ctx, X0 + 426, Y0 + 494, 22, 30, 4); ctx.fill(); ctx.stroke();
      for (const x of [X0 + 290, X0 + 190, X0 + 90]) house(ctx, x, Y0 + 600, 70, 0.8 + 0.2 * Math.sin(k * 2 + x));
      // Labels and voltages.
      chip(ctx, '400 kV', X0 + 490, Y0 + 124, 'orange', 20);
      chip(ctx, '11 kV', X0 + 505, Y0 + 466, 'cyan', 19);
      chip(ctx, '230 V', X0 + 190, Y0 + 466, 'green', 19);
      label(ctx, 'Power station', X0 + 85, Y0 + 356, { size: 19, weight: 700, fill: 'purple' });
      label(ctx, 'Step-up', X0 + 215, Y0 + 356, { size: 18, weight: 700, fill: 'orange' });
      label(ctx, 'transformer', X0 + 215, Y0 + 380, { size: 18, weight: 600, fill: 'orange' });
      label(ctx, 'Pylons carry it far', X0 + 570, Y0 + 356, { size: 19, weight: 700, fill: 'ink' });
      label(ctx, 'Homes', X0 + 165, Y0 + 626, { size: 19, weight: 700, fill: 'green' });
      label(ctx, 'Pole transformer', X0 + 420, Y0 + 626, { size: 18, weight: 600, fill: 'green' });
      label(ctx, 'Step-down substation', X0 + 612, Y0 + 626, { size: 18, weight: 600, fill: 'cyan' });
      chip(ctx, 'High voltage means less energy is wasted heating the cables', cx, Y0 + 672, 'yellow', 19);
      ctx.restore();
    },

    // An ordinary train on wheels next to a maglev floating on magnets: the
    // guideway's poles switch so each magnet is pulled from ahead and
    // pushed from behind.
    'maglev-train'(b, ctx, it, t) {
      const k = b.clock; const s1 = k * 160; const s2 = k * 240; const P = 55;
      const train = (y, h, c) => {
        ctx.fillStyle = tint(c, 0.25); ctx.strokeStyle = color(c); ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(X0 + 100, y); ctx.lineTo(X0 + 540, y); ctx.quadraticCurveTo(X0 + 600, y + 4, X0 + 612, y + h); ctx.lineTo(X0 + 100, y + h); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = tint('cyan', 0.35);
        for (let i = 0; i < 7; i++) { rounded(ctx, X0 + 120 + i * 58, y + 18, 40, 26, 6); ctx.fill(); }
        ctx.beginPath(); ctx.moveTo(X0 + 545, y + 14); ctx.quadraticCurveTo(X0 + 578, y + 16, X0 + 588, y + 42); ctx.lineTo(X0 + 545, y + 42); ctx.closePath(); ctx.fill();
      };
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Maglev train');
      // Wheels on rails.
      label(ctx, 'Ordinary train: steel wheels on rails', X0 + 20, Y0 + 80, { size: 20, weight: 700, fill: 'ink', align: 'left' });
      ctx.fillStyle = tint('muted', 0.4); for (let i = 0; i < 18; i++) ctx.fillRect(X0 + mod(i * 50 - s1, 850) - 25, Y0 + 286, 30, 10);
      ctx.fillStyle = 'rgba(200,210,230,0.85)'; ctx.fillRect(X0, Y0 + 276, FIG.w, 10);
      train(Y0 + 122, 106, 'blue');
      ctx.fillStyle = tint('muted', 0.6); ctx.fillRect(X0 + 150, Y0 + 228, 130, 12); ctx.fillRect(X0 + 410, Y0 + 228, 130, 12);
      for (const x of [X0 + 180, X0 + 250, X0 + 440, X0 + 510]) {
        wheel(ctx, x, Y0 + 254, 22, s1 / 22);
        const fl = 0.5 + 0.5 * Math.sin(k * 23 + x);
        dot(ctx, x, Y0 + 276, 5 + 3 * fl, `rgba(255,160,70,${0.5 + 0.4 * fl})`, 10);
        ctx.strokeStyle = 'rgba(255,200,120,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath();
        for (let s = 0; s < 3; s++) { const a = Math.PI + 0.3 + rnd(s + Math.floor(k * 12)) * 0.6; ctx.moveTo(x - 4, Y0 + 274); ctx.lineTo(x - 4 + Math.cos(a) * 14, Y0 + 274 + Math.sin(a) * 9); }
        ctx.stroke();
      }
      label(ctx, 'friction where the wheels touch the rails', X0 + 350, Y0 + 318, { size: 18, weight: 600, fill: 'orange' });
      chip(ctx, '≈ 300 km/h', X0 + 712, Y0 + 176, 'blue', 19);
      line(ctx, X0 + 10, Y0 + 345, X1 - 10, Y0 + 345, 'rgba(140,170,255,0.25)', 2);
      // Maglev.
      label(ctx, 'Maglev: floats, so no wheel friction', X0 + 20, Y0 + 374, { size: 20, weight: 700, fill: 'ink', align: 'left' });
      line(ctx, X0 + 480, Y0 + 374, X0 + 508, Y0 + 374, 'green', 4); label(ctx, 'pull', X0 + 515, Y0 + 374, { size: 18, weight: 700, fill: 'green', align: 'left' });
      line(ctx, X0 + 575, Y0 + 374, X0 + 603, Y0 + 374, 'orange', 4); label(ctx, 'push', X0 + 610, Y0 + 374, { size: 18, weight: 700, fill: 'orange', align: 'left' });
      const hv = 3 * Math.sin(k * 2); const my = Y0 + 492 + hv;
      train(Y0 + 402 + hv, 90, 'purple');
      ctx.fillStyle = tint('muted', 0.22); ctx.fillRect(X0, Y0 + 545, FIG.w, 55); line(ctx, X0, Y0 + 545, X1, Y0 + 545, tint('muted', 0.8), 2);
      const mc = (j) => X0 + 150 + j * P; const pol = (j) => (j % 2 ? 'S' : 'N');
      const pc = (s) => (s === 'N' ? 'red' : 'blue');
      for (let i = 0; i < 18; i++) {
        const xc = X0 + mod(i * P - s2, 18 * P) - 60;
        if (xc < X0 - 30 || xc > X1 + 30) continue;
        let j = 0; while (j < 8 && mc(j) <= xc) j++;
        const on = xc > mc(0) - P && xc < mc(7) + P;
        const s = j < 8 ? pol(j) : pol(7) === 'N' ? 'S' : 'N';
        ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0 + 540, FIG.w, 30); ctx.clip();
        ctx.fillStyle = on ? tint(pc(s), 0.7) : tint('muted', 0.3); ctx.strokeStyle = on ? color(pc(s)) : tint('muted', 0.6); ctx.lineWidth = 1.5;
        rounded(ctx, xc - 20, Y0 + 547, 40, 20, 4); ctx.fill(); ctx.stroke();
        if (on) label(ctx, s, xc, Y0 + 558, { size: 16, weight: 800, fill: 'ink' });
        ctx.restore();
        if (on) {
          if (j < 8 && mc(j) - xc < P) line(ctx, xc + 4, Y0 + 546, mc(j) - 4, my + 21, tint('orange', 0.85), 2.5);
          if (j > 0 && xc - mc(j - 1) < P) line(ctx, xc - 4, Y0 + 546, mc(j - 1) + 4, my + 21, tint('green', 0.85), 2.5);
        }
      }
      for (let j = 0; j < 8; j++) {
        const x = mc(j); const s = pol(j);
        ctx.fillStyle = tint(pc(s), 0.8); ctx.strokeStyle = color(pc(s)); ctx.lineWidth = 2; rounded(ctx, x - 20, my, 40, 21, 4); ctx.fill(); ctx.stroke();
        label(ctx, s, x, my + 11, { size: 16, weight: 800, fill: 'ink' });
      }
      glow(ctx, COLORS.green, 8); arr(ctx, X0 + 250, Y0 + 466 + hv, X0 + 380, Y0 + 466 + hv, 'green', 6); ctx.shadowBlur = 0;
      label(ctx, 'pushed forward', X0 + 392, Y0 + 466 + hv, { size: 18, weight: 700, fill: 'green', align: 'left' });
      label(ctx, 'train', X0 + 112, my - 4, { size: 18, weight: 600, fill: 'muted', align: 'right' });
      label(ctx, 'magnets', X0 + 112, my + 18, { size: 18, weight: 600, fill: 'muted', align: 'right' });
      line(ctx, X0 + 628, my + 22, X0 + 628, Y0 + 545, 'cyan', 2);
      label(ctx, 'gap', X0 + 638, (my + 22 + Y0 + 545) / 2, { size: 18, weight: 700, fill: 'cyan', align: 'left' });
      chip(ctx, 'up to ≈ 600 km/h', X0 + 712, Y0 + 446, 'purple', 18);
      label(ctx, 'Guideway electromagnets switch N and S as the train passes', X0 + 20, Y0 + 620, { size: 18, weight: 500, fill: 'muted', align: 'left' });
      chip(ctx, 'Opposite poles ahead pull, like poles behind push', cx, Y0 + 670, 'green', 20);
      ctx.restore();
    },
  };
}
