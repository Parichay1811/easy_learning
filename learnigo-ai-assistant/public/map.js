// The board's map: the world (Natural Earth through world-atlas, ISC) in the
// Equal Earth projection, fitted to the places a step names. Countries it
// names light up, places drop in as pins, routes draw themselves along great
// circles. Shapes are projected once into Path2D objects per map, so a frame
// costs a few fills: fast on any phone. The 1:110m world loads on the first
// map (108 KB); a close-up of a region swaps in the 1:50m one.
import { COUNTRIES, findPlace } from '/shared/places.js';

const worlds = {};
function world(detail) {
  if (!worlds[detail]) {
    worlds[detail] = { ready: false };
    fetch(`/vendor/world/countries-${detail}.json`).then((r) => r.json()).then((topo) => {
      Object.assign(worlds[detail], { ready: true, countries: decode(topo) });
    }).catch(() => { worlds[detail].failed = true; });
  }
  return worlds[detail];
}

// TopoJSON -> [{ name, polys: [[ring of [lon, lat]]] }].
function decode(topo) {
  const [sx, sy] = topo.transform.scale;
  const [tx, ty] = topo.transform.translate;
  const arcs = topo.arcs.map((a) => { let x = 0; let y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
  const ring = (ids) => { const out = []; for (const i of ids) { const pts = i >= 0 ? arcs[i] : arcs[~i].slice().reverse(); out.push(...(out.length ? pts.slice(1) : pts)); } return out; };
  return topo.objects.countries.geometries.map((g) => ({
    name: g.properties.name,
    polys: (g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : []).map((p) => p.map(ring)),
  }));
}

// Equal Earth (Šavrič, Patterson and Jenny 2018), y up, in radians units.
const A1 = 1.340264; const A2 = -0.081106; const A3 = 0.000893; const A4 = 0.003796; const M = Math.sqrt(3) / 2;
function equalEarth(lon, lat) {
  const l = (lon * Math.PI) / 180;
  const t = Math.asin(M * Math.sin((lat * Math.PI) / 180));
  const t2 = t * t; const t6 = t2 * t2 * t2;
  return [(l * Math.cos(t)) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2))), t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))];
}

// Points on the great circle between two places, for a route.
function greatCircle([lo1, la1], [lo2, la2], n = 48) {
  const r = Math.PI / 180;
  const v = (lo, la) => [Math.cos(la * r) * Math.cos(lo * r), Math.cos(la * r) * Math.sin(lo * r), Math.sin(la * r)];
  const a = v(lo1, la1); const b = v(lo2, la2);
  const d = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
  if (d < 1e-6) return [[lo1, la1], [lo2, la2]];
  return Array.from({ length: n + 1 }, (_, i) => {
    const f = i / n; const s1 = Math.sin((1 - f) * d) / Math.sin(d); const s2 = Math.sin(f * d) / Math.sin(d);
    const p = [s1 * a[0] + s2 * b[0], s1 * a[1] + s2 * b[1], s1 * a[2] + s2 * b[2]];
    return [Math.atan2(p[1], p[0]) / r, Math.atan2(p[2], Math.hypot(p[0], p[1])) / r];
  });
}

// What a map op names: { pins, countries, routes, box } with every place found.
export function mapPlan(op) {
  const pins = [];
  const countries = new Set(op.highlight || []);
  for (const name of op.items || []) {
    const p = findPlace(name);
    if (!p) continue;
    if (p.kind === 'country') countries.add(p.name);
    else pins.push({ ...p, label: String(name).replace(/^the /i, '') });
  }
  const routes = (op.items2 || op.routes || []).map((r) => String(r).split(/\s*(?:>|→|->|\bto\b)\s*/i).map((x) => findPlace(x)).filter(Boolean)).filter((r) => r.length >= 2);
  for (const r of routes) for (const p of r) if (p.kind !== 'country' && !pins.some((q) => q.name === p.name)) pins.push({ ...p, label: p.name });
  // Pins at exact coordinates (open data: a landmark, this week's earthquakes).
  for (const p of op.pins || []) pins.push({ name: p.label || '', label: p.label || '', lat: p.lat, lon: p.lon, kind: p.size ? 'quake' : 'spot', size: p.size });
  // The area to show: every pin and named country, with room round them.
  let box = null;
  const grow = (lo0, la0, lo1, la1) => { box = box ? [Math.min(box[0], lo0), Math.min(box[1], la0), Math.max(box[2], lo1), Math.max(box[3], la1)] : [lo0, la0, lo1, la1]; };
  for (const p of pins) if (!['ocean', 'continent', 'line'].includes(p.kind)) grow(p.lon, p.lat, p.lon, p.lat);
  for (const c of countries) { const b = COUNTRIES[c]?.[2]; if (b) grow(...b); }
  if (op.region === 'world' || !box) box = [-180, -58, 180, 84];
  else {
    const w = Math.max(28, (box[2] - box[0]) * 1.5);
    const h = Math.max(18, (box[3] - box[1]) * 1.5);
    const cx = (box[0] + box[2]) / 2; const cy = (box[1] + box[3]) / 2;
    box = [Math.max(-180, cx - w / 2), Math.max(-60, cy - h / 2), Math.min(180, cx + w / 2), Math.min(85, cy + h / 2)];
  }
  return { pins: pins.slice(0, op.pins?.length > 8 ? 40 : 8), countries: [...countries], routes, box };
}

// Projects into the figure area; the shapes become Path2D objects once.
function build(it, area, detail) {
  const plan = it.plan;
  const [lo0, la0, lo1, la1] = plan.box;
  let xmin = Infinity; let xmax = -Infinity; let ymin = Infinity; let ymax = -Infinity;
  for (let i = 0; i <= 16; i++) for (const [lo, la] of [[lo0 + ((lo1 - lo0) * i) / 16, la0], [lo0 + ((lo1 - lo0) * i) / 16, la1], [lo0, la0 + ((la1 - la0) * i) / 16], [lo1, la0 + ((la1 - la0) * i) / 16]]) {
    const [x, y] = equalEarth(lo, la);
    xmin = Math.min(xmin, x); xmax = Math.max(xmax, x); ymin = Math.min(ymin, y); ymax = Math.max(ymax, y);
  }
  const pad = 18;
  const k = Math.min((area.w - pad * 2) / (xmax - xmin), (area.h - pad * 2) / (ymax - ymin));
  const ox = area.x + (area.w - (xmax - xmin) * k) / 2 - xmin * k;
  const oy = area.y + (area.h - (ymax - ymin) * k) / 2 + ymax * k;
  const P = (lon, lat) => { const [x, y] = equalEarth(lon, lat); return [ox + x * k, oy - y * k]; };
  const land = new Path2D();
  const lit = new Path2D();
  const named = new Set(plan.countries);
  for (const c of worlds[detail].countries) {
    const path = named.has(c.name) ? lit : land;
    for (const poly of c.polys) for (const ring of poly) {
      ring.forEach(([lon, lat], i) => { const [x, y] = P(lon, lat); if (i) path.lineTo(x, y); else path.moveTo(x, y); });
      path.closePath();
    }
  }
  const grid = new Path2D();
  for (let lon = -180; lon <= 180; lon += 30) for (let lat = -90; lat <= 90; lat += 3) { const [x, y] = P(lon, lat); if (lat === -90) grid.moveTo(x, y); else grid.lineTo(x, y); }
  for (let lat = -60; lat <= 60; lat += 30) for (let lon = -180; lon <= 180; lon += 3) { const [x, y] = P(lon, lat); if (lon === -180) grid.moveTo(x, y); else grid.lineTo(x, y); }
  const equator = new Path2D();
  for (let lon = -180; lon <= 180; lon += 3) { const [x, y] = P(lon, 0); if (lon === -180) equator.moveTo(x, y); else equator.lineTo(x, y); }
  const pins = plan.pins.map((p) => ({ ...p, xy: P(p.lon, p.lat) }));
  const labels = plan.countries.map((name) => ({ name, xy: P(COUNTRIES[name][0], COUNTRIES[name][1]) }));
  const routes = plan.routes.map((r) => { const pts = []; for (let i = 1; i < r.length; i++) pts.push(...greatCircle([r[i - 1].lon, r[i - 1].lat], [r[i].lon, r[i].lat]).map(([lo, la]) => P(lo, la))); return pts; });
  return { detail, land, lit, grid, equator, pins, labels, routes, zoom: 360 / Math.max(1, lo1 - lo0) };
}

export function drawMap(kit, ctx, it, t, clock) {
  const { FIG, COLORS, glow, label, rounded, clamp, easeOut, outBack, wrapLabel } = kit;
  const area = { x: FIG.x, y: FIG.y + 20, w: FIG.w, h: FIG.h - 40 };
  it.plan ||= mapPlan(it);
  const span = it.plan.box[2] - it.plan.box[0];
  const fine = span < 50 ? world('50m') : null;
  const base = world('110m');
  const detail = fine?.ready ? '50m' : base.ready ? '110m' : null;
  // The ocean and its frame first, so the panel is there while data loads.
  ctx.save();
  ctx.globalAlpha *= easeOut(clamp(t / 0.4));
  rounded(ctx, area.x, area.y, area.w, area.h, 22);
  const sea = ctx.createLinearGradient(0, area.y, 0, area.y + area.h);
  sea.addColorStop(0, 'rgba(34,211,238,0.07)');
  sea.addColorStop(1, 'rgba(91,140,255,0.04)');
  ctx.fillStyle = sea;
  ctx.fill();
  ctx.strokeStyle = 'rgba(140,170,255,0.22)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.clip();
  if (!detail) {
    label(ctx, base.failed ? 'Map unavailable' : 'Loading the map…', area.x + area.w / 2, area.y + area.h / 2, { size: 26, fill: 'muted', weight: 500 });
    ctx.restore();
    return;
  }
  if (!it.geo || it.geo.detail !== detail) it.geo = build(it, area, detail);
  const g = it.geo;
  ctx.strokeStyle = 'rgba(140,170,255,0.08)';
  ctx.lineWidth = 1;
  ctx.stroke(g.grid);
  ctx.strokeStyle = 'rgba(34,211,238,0.22)';
  ctx.setLineDash([6, 8]);
  ctx.stroke(g.equator);
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(120,150,255,0.16)';
  ctx.fill(g.land);
  ctx.strokeStyle = 'rgba(160,185,255,0.38)';
  ctx.lineWidth = g.zoom > 3 ? 1.2 : 0.8;
  ctx.stroke(g.land);
  // Named countries light up, with a slow pulse.
  if (t > 0.3) {
    const q = easeOut(clamp((t - 0.3) / 0.6));
    ctx.globalAlpha = q * (0.75 + 0.25 * Math.sin(clock * 2.2));
    glow(ctx, COLORS.cyan, 18);
    ctx.fillStyle = 'rgba(34,211,238,0.42)';
    ctx.fill(g.lit);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 2;
    ctx.stroke(g.lit);
    ctx.globalAlpha = q;
    for (const l of g.labels) label(ctx, l.name, l.xy[0], l.xy[1], { size: g.zoom > 3 ? 24 : 19, weight: 700, fill: '#ffffff' });
    ctx.globalAlpha = 1;
  }
  // Routes draw themselves, a dot travelling along.
  g.routes.forEach((pts, i) => {
    const q = clamp((t - 0.8 - i * 0.6) / 1.4);
    if (q <= 0 || pts.length < 2) return;
    const n = Math.max(2, Math.floor(pts.length * easeOut(q)));
    ctx.strokeStyle = COLORS.orange;
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 9]);
    ctx.lineDashOffset = -clock * 30;
    glow(ctx, COLORS.orange, 12);
    ctx.beginPath();
    pts.slice(0, n).forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.setLineDash([]);
    const [dx, dy] = pts[Math.floor(((clock * 0.25) % 1) * (n - 1))];
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(dx, dy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  });
  // Pins drop in one by one; labels avoid each other.
  // Country names count as taken space, so pin labels steer round them.
  ctx.font = '700 20px Lexend, system-ui, sans-serif';
  const placed = t > 0.3 ? g.labels.map((l) => ({ x: l.xy[0], y: l.xy[1], w: ctx.measureText(l.name).width + 10 })) : [];
  g.pins.forEach((p, i) => {
    const lt = t - 0.5 - i * 0.35;
    if (lt < 0) return;
    const q = clamp(lt / 0.5);
    const [x, y] = p.xy;
    const water = ['ocean', 'sea'].includes(p.kind);
    // An earthquake: a red ring sized by its magnitude, pulsing; quick to appear.
    if (p.kind === 'quake') {
      const qt = t - 0.5 - i * 0.06;
      if (qt < 0) return;
      const r = Math.max(4, (p.size - 4) * 7) * outBack(clamp(qt / 0.4));
      ctx.save();
      glow(ctx, '#ff5d6c', 12);
      ctx.fillStyle = 'rgba(255,93,108,0.55)';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      const ring = (clock * 0.8 + i * 0.13) % 1;
      ctx.strokeStyle = '#ff5d6c'; ctx.globalAlpha = 1 - ring; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, r + ring * 22, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      if (!p.label || qt < 0.4) return;
      ctx.font = '700 20px Lexend, system-ui, sans-serif';
      const w = ctx.measureText(p.label).width + 18;
      let ly = y - r - 22;
      for (let k = 0; k < 3; k++) for (const o of placed) if (Math.abs(o.x - x) < (o.w + w) / 2 && Math.abs(o.y - ly) < 30) ly = o.y - 32;
      placed.push({ x, y: ly, w });
      ctx.fillStyle = 'rgba(5,8,22,0.86)'; ctx.strokeStyle = '#ff5d6c'; ctx.lineWidth = 1.5;
      rounded(ctx, x - w / 2, ly - 15, w, 30, 9); ctx.fill(); ctx.stroke();
      label(ctx, p.label, x, ly + 1, { size: 19, weight: 700, fill: 'ink' });
      return;
    }
    const c = water ? COLORS.blue : p.kind === 'mountain' || p.kind === 'range' ? COLORS.green : p.kind === 'river' ? COLORS.teal : COLORS.orange;
    if (water || p.kind === 'continent' || p.kind === 'line') {
      ctx.globalAlpha = easeOut(q);
      ctx.font = `italic 600 ${p.kind === 'ocean' || p.kind === 'continent' ? 24 : 21}px Lexend, system-ui, sans-serif`;
      label(ctx, p.label, x, y, { size: p.kind === 'ocean' || p.kind === 'continent' ? 24 : 21, weight: 600, fill: water ? '#9cc3ff' : '#d6defa' });
      ctx.globalAlpha = 1;
      return;
    }
    const drop = (1 - outBack(q)) * -40;
    ctx.save();
    ctx.translate(x, y + drop);
    ctx.globalAlpha = clamp(q * 3);
    glow(ctx, c, 16);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-14, -16, -14, -34, 0, -36);
    ctx.bezierCurveTo(14, -34, 14, -16, 0, 0);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#050816';
    ctx.beginPath(); ctx.arc(0, -24, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // A ripple where it lands.
    if (q >= 1 && lt < 1.6) {
      ctx.strokeStyle = c; ctx.globalAlpha = 1 - (lt - 0.5) / 1.1; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y, 8 + (lt - 0.5) * 30, 3 + (lt - 0.5) * 10, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (q < 0.6 || !p.label) return;
    ctx.font = '600 20px Lexend, system-ui, sans-serif';
    const w = ctx.measureText(p.label).width + 22;
    let ly = y - 54;
    for (let k = 0; k < 3; k++) for (const r of placed) if (Math.abs(r.x - x) < (r.w + w) / 2 && Math.abs(r.y - ly) < 32) ly = r.y - 34;
    if (ly < area.y + 18) ly = y + 26;
    const lx = Math.min(area.x + area.w - w / 2 - 6, Math.max(area.x + w / 2 + 6, x));
    placed.push({ x: lx, y: ly, w });
    ctx.globalAlpha = clamp((q - 0.6) * 3);
    ctx.fillStyle = 'rgba(5,8,22,0.86)';
    ctx.strokeStyle = c;
    ctx.lineWidth = 1.5;
    rounded(ctx, lx - w / 2, ly - 16, w, 32, 10);
    ctx.fill(); ctx.stroke();
    label(ctx, p.label, lx, ly + 1, { size: 20, weight: 600, fill: 'ink' });
    ctx.globalAlpha = 1;
  });
  ctx.restore();
  if (it.label && t > 1) wrapLabel(ctx, it.label, area.x, area.y + area.h + 2, area.w, 20, 'center', 'muted');
}
