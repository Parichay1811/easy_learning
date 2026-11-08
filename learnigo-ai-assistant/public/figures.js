// More pictures for the board, for every subject: charts (line, pie, table),
// maths (graph of a function, number line, fraction, angle, balance),
// physics (forces, wave, circuit, orbits), chemistry (atom), history and
// literature (quote) and early years (count). Each is a function of the
// board clock, drawn with plain canvas calls: cheap enough for 60 fps on a
// phone. board.js passes its drawing kit in and merges the result.
import { parseExpr, prettyExpr } from '/shared/expr.js';
import { element } from '/shared/elements.js';
import { findShape } from '/shared/shapes.js';
import { RENDERS } from '/shared/renders.js';

const num = (s) => { const m = String(s).match(/-?\d[\d,]*(\.\d+)?/); return m ? Number(m[0].replace(/,/g, '')) : NaN; };
const pair = (s) => { const m = String(s).match(/^(.*?)[:=]\s*(-?\d[\d,]*(?:\.\d+)?)\s*(%|[a-zA-Z°]{0,12})?\s*$/); return m ? { label: m[1].trim(), value: Number(m[2].replace(/,/g, '')), unit: m[3] || '' } : null; };
const fmtN = (n) => (Math.abs(n) >= 1000 ? n.toLocaleString('en-US', { maximumFractionDigits: 0 }) : String(+n.toFixed(2)));

export function figures(kit) {
  const { FIG, COLORS, HUES, glow, label, wrapLabel, rounded, arrow, clamp, easeOut, outBack, color, tint, FONT } = kit;
  const cx = FIG.x + FIG.w / 2;
  const cy = FIG.y + FIG.h / 2;
  const fade = (ctx, t, d = 0.4) => { const q = easeOut(clamp(t / d)); ctx.globalAlpha *= q; return q; };
  const panel = (ctx, x, y, w, h, c = 'rgba(140,170,255,0.22)') => { ctx.fillStyle = 'rgba(255,255,255,0.035)'; ctx.strokeStyle = c; ctx.lineWidth = 1.5; rounded(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke(); };

  // Axes in a box: px/py map data to the board; nice ticks on both.
  function axes(box, x0, x1, y0, y1) {
    const px = (x) => box.x + ((x - x0) / (x1 - x0)) * box.w;
    const py = (y) => box.y + box.h - ((y - y0) / (y1 - y0)) * box.h;
    return { px, py, x0, x1, y0, y1, box };
  }
  const nice = (lo, hi, n = 5) => { const span = hi - lo || 1; const step0 = span / n; const p = 10 ** Math.floor(Math.log10(step0)); const step = [1, 2, 5, 10].map((m) => m * p).find((s) => s >= step0); const out = []; for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10)); return out; };
  function drawAxes(ctx, a, { xTicks = [], yTicks = [], grid = true, xLabels } = {}) {
    ctx.strokeStyle = 'rgba(140,170,255,0.12)';
    ctx.lineWidth = 1;
    if (grid) for (const y of yTicks) { ctx.beginPath(); ctx.moveTo(a.box.x, a.py(y)); ctx.lineTo(a.box.x + a.box.w, a.py(y)); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(200,215,255,0.55)';
    ctx.lineWidth = 2;
    const zy = a.y0 <= 0 && a.y1 >= 0 ? a.py(0) : a.box.y + a.box.h;
    const zx = a.x0 <= 0 && a.x1 >= 0 ? a.px(0) : a.box.x;
    ctx.beginPath(); ctx.moveTo(a.box.x, zy); ctx.lineTo(a.box.x + a.box.w, zy); ctx.moveTo(zx, a.box.y); ctx.lineTo(zx, a.box.y + a.box.h); ctx.stroke();
    for (const y of yTicks) label(ctx, fmtN(y), zx - 10, a.py(y), { size: 17, weight: 500, fill: 'muted', align: 'right' });
    (xLabels || xTicks.map((x) => [x, fmtN(x)])).forEach(([x, text]) => label(ctx, text, a.px(x), zy + 20, { size: 17, weight: 500, fill: 'muted' }));
  }

  // A 3D picture from the render library (shared/renders.js): the still, or
  // its loop playing in a muted inline video, with a glowing pin on each part,
  // a leader to its tag round the edge, and a tap on either asking about it.
  const PIN_HUES = ['cyan', 'orange', 'green', 'purple', 'yellow', 'blue', 'red', 'teal'];
  const askOfPart = (p) => {
    if (p.ask) return String(p.ask);
    const l = String(p.label || 'this part');
    return `Tell me about the ${/^[A-Z][a-z]/.test(l) ? l[0].toLowerCase() + l.slice(1) : l}`;
  };
  // The parts to show: the op's own ({label, x, y}), a pick from the render's
  // (labels or indexes), or all of the render's.
  function partsOf(it, r) {
    const all = r.parts || [];
    if (!Array.isArray(it.parts) || !it.parts.length) return all;
    return it.parts.map((p) => {
      if (typeof p === 'number') return all[p];
      if (typeof p === 'string') return all.find((q) => q.label.toLowerCase() === p.toLowerCase());
      if (p && typeof p.x === 'number' && typeof p.y === 'number' && p.label) return p;
      if (p && p.label) return { ...all.find((q) => q.label.toLowerCase() === String(p.label).toLowerCase()), ...p };
      return null;
    }).filter((p) => p && typeof p.x === 'number' && typeof p.y === 'number' && p.label).slice(0, 8);
  }
  // Tags in two columns at the picture's left and right edges, each near its
  // pin's height, pushed apart so none overlap.
  function layTags(ctx, box, parts) {
    const TH = 34; const GAP = 8; const top = box.y + 16; const bottom = box.y + box.h - 62; // room for the note strip
    ctx.font = `600 17px ${FONT}`;
    const tags = parts.map((p, i) => ({ p, i, px: box.x + p.x * box.w, py: box.y + p.y * box.h, w: Math.ceil(ctx.measureText(p.label).width) + 26, c: PIN_HUES[i % PIN_HUES.length] }));
    tags.forEach((g) => { g.side = g.px < box.x + box.w / 2 ? 0 : 1; });
    const cap = Math.max(1, Math.floor((bottom - top) / (TH + GAP)));
    for (let pass = 0; pass < 8; pass++) {
      const cnt = [0, 1].map((s) => tags.filter((g) => g.side === s).length);
      const big = cnt[0] > cnt[1] + 1 || cnt[0] > cap ? 0 : cnt[1] > cnt[0] + 1 || cnt[1] > cap ? 1 : -1;
      if (big < 0) break;
      const mover = tags.filter((g) => g.side === big).sort((a, c) => Math.abs(a.px - box.x - box.w / 2) - Math.abs(c.px - box.x - box.w / 2))[0];
      mover.side = 1 - big;
    }
    const columns = () => {
      for (const s of [0, 1]) {
        const col = tags.filter((g) => g.side === s).sort((a, c) => a.py - c.py);
        col.forEach((g) => { g.y = clamp(g.py - TH / 2, top, bottom - TH); });
        for (let k = 1; k < col.length; k++) col[k].y = Math.max(col[k].y, col[k - 1].y + TH + GAP);
        if (col.length && col[col.length - 1].y + TH > bottom) {
          col[col.length - 1].y = bottom - TH;
          for (let k = col.length - 2; k >= 0; k--) col[k].y = Math.min(col[k].y, col[k + 1].y - TH - GAP);
        }
        col.forEach((g) => { g.h = TH; g.x = s === 0 ? box.x + 14 : box.x + box.w - 14 - g.w; });
      }
    };
    // A leader that runs over another part's pin is confusing: try that tag
    // on the other side instead (while both columns still fit).
    const near = (g, o) => {
      const ex = g.side === 0 ? g.x + g.w : g.x; const ey = g.y + TH / 2;
      const dx = ex - g.px; const dy = ey - g.py; const L2 = dx * dx + dy * dy || 1;
      const u = clamp(((o.px - g.px) * dx + (o.py - g.py) * dy) / L2);
      return Math.hypot(g.px + dx * u - o.px, g.py + dy * u - o.py) < 13;
    };
    columns();
    for (let pass = 0; pass < 3; pass++) {
      const g = tags.find((a) => !a.flipped && tags.some((o) => o !== a && near(a, o)));
      if (!g) break;
      g.flipped = true;
      const other = tags.filter((a) => a.side === 1 - g.side).length;
      if (other + 1 > cap || other + 1 > tags.length - other + 1) continue;
      g.side = 1 - g.side;
      columns();
    }
    return tags;
  }
  // Loops play while their picture is drawn; a sweep pauses the rest.
  const playing = new Map();
  if (typeof window !== 'undefined') setInterval(() => { const now = performance.now(); for (const [v, at] of playing) if (now - at > 1500) { v.pause(); playing.delete(v); } }, 1000);
  function loopVideo(b, it, r) {
    if (!r.loop || typeof document === 'undefined') return null;
    let v = it._vid;
    if (!v) {
      v = it._vid = document.createElement('video');
      Object.assign(v, { muted: true, loop: true, playsInline: true, autoplay: true, preload: 'auto', src: r.loop });
      v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    }
    if (b.playing === false) { if (!v.paused) v.pause(); } else if (v.paused && !v._asked) { v._asked = true; v.play().then(() => { v._asked = false; }).catch(() => {}); }
    playing.set(v, performance.now());
    return v.readyState >= 2 && v.videoWidth ? v : null;
  }
  // Where a part's pin is now: its tracked path through the loop, or fixed.
  function pinAt(p, v) {
    if (!p.track || !v || !v.duration) return [p.x, p.y];
    const n = p.track.length; const f = ((v.currentTime / v.duration) % 1) * n;
    const a = p.track[Math.floor(f) % n]; const c = p.track[(Math.floor(f) + 1) % n]; const k = f - Math.floor(f);
    return [a[0] + (c[0] - a[0]) * k, a[1] + (c[1] - a[1]) * k];
  }
  function renderPicture(b, ctx, it, r, t) {
    const box = { x: FIG.x, y: FIG.y, w: FIG.w, h: FIG.h }; // 8:7, the renders' shape
    const img = it._img ||= Object.assign(new Image(), { decoding: 'async', src: r.src });
    const vid = loopVideo(b, it, r);
    const parts = it._parts ||= partsOf(it, r);
    ctx.save();
    ctx.globalAlpha *= easeOut(clamp(t / 0.6));
    ctx.save();
    rounded(ctx, box.x, box.y, box.w, box.h, 22);
    ctx.fillStyle = '#0a1028';
    ctx.fill();
    ctx.clip();
    const pic = vid || (img.complete && img.naturalWidth ? img : null);
    if (pic) ctx.drawImage(pic, box.x, box.y, box.w, box.h);
    else label(ctx, img.complete ? 'No picture' : 'Loading the picture…', box.x + box.w / 2, box.y + box.h / 2, { size: 24, weight: 500, fill: 'muted' });
    ctx.restore();
    ctx.strokeStyle = 'rgba(140,170,255,0.35)';
    ctx.lineWidth = 2;
    rounded(ctx, box.x, box.y, box.w, box.h, 22);
    ctx.stroke();
    const tags = it._tags ||= layTags(ctx, box, parts);
    const n = tags.length;
    // The lit part: a fixed focus, or each in turn once all have appeared.
    const f = Number.isInteger(it.focus) && it.focus >= 0 && it.focus < n ? it.focus : null;
    const start = 0.8 + n * 0.22;
    const lit = f ?? (t < start || !n ? -1 : Math.floor((t - start) / 2.6) % n);
    tags.forEach((g, k) => {
      const q = easeOut(clamp((t - 0.6 - k * 0.22) / 0.4));
      if (q <= 0) return;
      const on = k === lit;
      const [fx, fy] = pinAt(g.p, vid);
      const px = box.x + fx * box.w; const py = box.y + fy * box.h;
      const c = color(g.c);
      ctx.save();
      ctx.globalAlpha *= q * (lit < 0 || on ? 1 : 0.72);
      // leader from the pin to the tag's inner edge
      const ex = g.side === 0 ? g.x + g.w : g.x; const ey = g.y + g.h / 2;
      ctx.strokeStyle = tint(g.c, on ? 0.95 : 0.55); ctx.lineWidth = on ? 2.2 : 1.5;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ex + (g.side === 0 ? 10 : -10), ey); ctx.lineTo(ex, ey); ctx.stroke();
      // the pin, with a pulsing ring when lit
      if (on) {
        const pulse = (b.clock * 0.9) % 1;
        ctx.strokeStyle = tint(g.c, 0.8 * (1 - pulse)); ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(px, py, 9 + pulse * 18, 0, Math.PI * 2); ctx.stroke();
      }
      glow(ctx, c, on ? 16 : 9);
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(px, py, on ? 8 : 6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(px, py, on ? 3.2 : 2.4, 0, Math.PI * 2); ctx.fill();
      // the tag
      rounded(ctx, g.x, g.y, g.w, g.h, 17);
      ctx.fillStyle = on ? 'rgba(14,24,56,0.94)' : 'rgba(7,11,29,0.8)'; ctx.fill();
      if (on) { glow(ctx, c, 12); ctx.fillStyle = tint(g.c, 0.16); ctx.fill(); }
      ctx.strokeStyle = tint(g.c, on ? 0.95 : 0.5); ctx.lineWidth = on ? 2 : 1.3; ctx.stroke();
      ctx.shadowBlur = 0;
      label(ctx, g.p.label, g.x + g.w / 2, g.y + g.h / 2 + 1, { size: 17, weight: on ? 700 : 600, fill: on ? c : 'ink' });
      ctx.restore();
      b.hits.push({ i: askOfPart(g.p), x: g.x - 4, y: g.y - 4, w: g.w + 8, h: g.h + 8 });
      b.hits.push({ i: askOfPart(g.p), x: px - 18, y: py - 18, w: 36, h: 36 });
    });
    // The lit part's note, in a strip along the bottom.
    const shown = lit >= 0 ? tags[lit] : null;
    if (shown && shown.p.note) {
      const age = f != null ? t - 0.6 - lit * 0.22 : (t - start) % 2.6;
      ctx.save();
      ctx.globalAlpha *= easeOut(clamp(age / 0.35));
      ctx.font = `500 17px ${FONT}`;
      const w = Math.min(box.w - 60, ctx.measureText(shown.p.note).width + 36);
      rounded(ctx, box.x + (box.w - w) / 2, box.y + box.h - 52, w, 36, 18);
      ctx.fillStyle = 'rgba(7,11,29,0.82)'; ctx.fill();
      ctx.strokeStyle = tint(shown.c, 0.45); ctx.lineWidth = 1.2; ctx.stroke();
      label(ctx, shown.p.note, box.x + box.w / 2, box.y + box.h - 33, { size: 17, weight: 500, fill: 'ink' });
      ctx.restore();
    }
    if (it.caption) label(ctx, String(it.caption).slice(0, 70), box.x + box.w / 2, box.y + box.h + 22, { size: 20, weight: 700, fill: 'ink' });
    b.hits.push({ i: it.ask || `Explain this picture: ${r.title}`, x: box.x, y: box.y, w: box.w, h: box.h });
    ctx.restore();
  }

  const layout = {
    line(it) {
      const rows = (it.items || []).map(pair).filter(Boolean).slice(0, 12);
      const ys = rows.map((r) => r.value);
      const lo = Math.min(0, ...ys); const hi = Math.max(...ys) * 1.12 || 1;
      it.a = axes({ x: FIG.x + 90, y: FIG.y + 70, w: FIG.w - 140, h: FIG.h - 190 }, 0, Math.max(1, rows.length - 1), lo, hi);
      it.rows = rows;
      it.ticks = nice(lo, hi, 5);
    },
    pie(it) {
      const rows = (it.items || []).map(pair).filter((r) => r && r.value > 0).slice(0, 7);
      const total = rows.reduce((s, r) => s + r.value, 0) || 1;
      let a = -Math.PI / 2;
      it.rows = rows.map((r, i) => { const s = (r.value / total) * Math.PI * 2; const out = { ...r, a0: a, a1: a + s, pct: Math.round((r.value / total) * 100), c: HUES[i % HUES.length] }; a += s; return out; });
    },
    table(it) {
      it.rows = (it.items || []).slice(0, 7).map((r) => String(r).split(/\s*\|\s*/).slice(0, 4));
      it.cols = Math.max(1, ...it.rows.map((r) => r.length));
    },
    numberline(it) {
      const marks = (it.items || []).map((s) => pair(s) || (Number.isFinite(num(s)) ? { label: '', value: num(s) } : null)).filter(Boolean).slice(0, 6);
      const r = String(it.value || '').match(/(-?\d+(?:\.\d+)?)\s*(?:\.\.|to|–|-)\s*(-?\d+(?:\.\d+)?)/);
      let lo = r ? Number(r[1]) : Math.min(0, ...marks.map((m) => m.value));
      let hi = r ? Number(r[2]) : Math.max(10, ...marks.map((m) => m.value));
      if (!r) { const pad = Math.max(1, Math.ceil((hi - lo) * 0.1)); lo = Math.floor(lo - (lo < 0 ? pad : 0)); hi = Math.ceil(hi + pad); }
      it.lo = lo; it.hi = hi; it.marks = marks; it.ticks = nice(lo, hi, Math.min(10, hi - lo));
    },
    graph(it) {
      it.f = parseExpr(it.expr || it.value);
      const r = String(it.range || '').match(/(-?\d+(?:\.\d+)?)\s*(?:\.\.|to)\s*(-?\d+(?:\.\d+)?)/);
      const x0 = r ? Number(r[1]) : -5; const x1 = r ? Number(r[2]) : 5;
      const ys = [];
      if (it.f) for (let i = 0; i <= 200; i++) { const y = it.f(x0 + ((x1 - x0) * i) / 200); if (Number.isFinite(y)) ys.push(y); }
      ys.sort((a, b) => a - b);
      let y0 = ys.length ? ys[Math.floor(ys.length * 0.02)] : -5; let y1 = ys.length ? ys[Math.ceil(ys.length * 0.98) - 1] : 5;
      y0 = Math.min(y0, 0); y1 = Math.max(y1, 0);
      const pad = (y1 - y0) * 0.12 || 1;
      it.a = axes({ x: FIG.x + 70, y: FIG.y + 90, w: FIG.w - 110, h: FIG.h - 190 }, x0, x1, y0 - pad, y1 + pad);
      it.pts = (it.items || []).map((s) => { const m = String(s).match(/\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)?/); return m ? { x: Number(m[1]), y: Number(m[2]), text: String(s).replace(m[0], '').replace(/[:\-–]\s*$|^\s*[:\-–]/g, '').trim() } : null; }).filter(Boolean).slice(0, 4);
    },
    orbits(it) { it.bodies = (it.items || []).slice(0, 8); },
  };

  // One shape drawn at (x, y) with size S: its sides drawing in, corners
  // counted, equal sides ticked, right angles squared, symmetry lines dashed.
  // Solids turn slowly so their faces, edges and vertices can be seen.
  function drawShape(ctx, sh, x, y, S, t, clock, { detail = true, c = 'cyan' } = {}) {
    const col = color(c);
    if (sh.solid) return drawSolid(ctx, sh, x, y, S, t, clock, detail, col);
    if (sh.round) {
      const q = easeOut(clamp(t / 0.9));
      ctx.save();
      glow(ctx, col, 18);
      ctx.strokeStyle = col; ctx.fillStyle = tint(c, 0.16); ctx.lineWidth = 5;
      ctx.beginPath();
      if (sh.round === 'circle') ctx.arc(x, y, S, -Math.PI / 2, -Math.PI / 2 + q * Math.PI * 2);
      else if (sh.round === 'oval') ctx.ellipse(x, y, S * 1.25, S * 0.75, 0, -Math.PI / 2, -Math.PI / 2 + q * Math.PI * 2);
      else { ctx.arc(x, y + S * 0.35, S, Math.PI, Math.PI + q * Math.PI); if (q >= 1) ctx.closePath(); }
      ctx.fill(); ctx.stroke();
      ctx.restore();
      if (detail && sh.round === 'circle' && t > 1) {
        const a = clock * 0.6;
        ctx.save();
        ctx.globalAlpha *= easeOut(clamp((t - 1) / 0.5));
        ctx.fillStyle = COLORS.ink; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
        arrow(ctx, x, y, x + Math.cos(a) * (S - 4), y + Math.sin(a) * (S - 4), 'orange', 4);
        label(ctx, 'radius', x + Math.cos(a) * S * 0.5, y + Math.sin(a) * S * 0.5 - 18, { size: 20, weight: 700, fill: 'orange' });
        label(ctx, 'centre', x, y + 26, { size: 18, weight: 600, fill: 'muted' });
        ctx.restore();
      }
      return;
    }
    const P = sh.pts.map(([px, py]) => [x + px * S, y + py * S]);
    const n = P.length;
    const drawn = clamp(t / 1.2) * n;
    ctx.save();
    ctx.lineJoin = 'round';
    if (drawn >= n) { ctx.fillStyle = tint(c, 0.16); ctx.beginPath(); P.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.closePath(); ctx.fill(); }
    glow(ctx, col, 16);
    ctx.strokeStyle = col; ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(...P[0]);
    for (let i = 0; i < Math.floor(drawn); i++) ctx.lineTo(...P[(i + 1) % n]);
    const f = drawn - Math.floor(drawn);
    if (f > 0 && drawn < n) { const a = P[Math.floor(drawn) % n]; const b2 = P[(Math.floor(drawn) + 1) % n]; ctx.lineTo(a[0] + (b2[0] - a[0]) * f, a[1] + (b2[1] - a[1]) * f); }
    ctx.stroke();
    ctx.restore();
    if (!detail || t < 1.2) return;
    const k = easeOut(clamp((t - 1.2) / 0.6));
    const mid = (i) => [(P[i][0] + P[(i + 1) % n][0]) / 2, (P[i][1] + P[(i + 1) % n][1]) / 2];
    ctx.save();
    ctx.globalAlpha *= k;
    // Right angles: a small square in the corner.
    for (const i of sh.right || []) {
      const v = P[i]; const a = P[(i + n - 1) % n]; const b2 = P[(i + 1) % n];
      const u1 = [(a[0] - v[0]), (a[1] - v[1])]; const u2 = [(b2[0] - v[0]), (b2[1] - v[1])];
      const l1 = Math.hypot(...u1); const l2 = Math.hypot(...u2); const s2 = 24;
      const p1 = [v[0] + (u1[0] / l1) * s2, v[1] + (u1[1] / l1) * s2]; const p2 = [v[0] + (u2[0] / l2) * s2, v[1] + (u2[1] / l2) * s2];
      ctx.strokeStyle = COLORS.green; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(...p1); ctx.lineTo(p1[0] + (p2[0] - v[0]), p1[1] + (p2[1] - v[1])); ctx.lineTo(...p2); ctx.stroke();
    }
    // Corners counted one by one.
    P.forEach((p, i) => {
      const q = clamp((t - 1.4 - i * 0.25) / 0.3);
      if (q <= 0) return;
      const dx = p[0] - x; const dy = p[1] - y; const d = Math.hypot(dx, dy) || 1;
      ctx.fillStyle = COLORS.orange;
      ctx.beginPath(); ctx.arc(p[0], p[1], 8 * outBack(q), 0, Math.PI * 2); ctx.fill();
      if (n <= 10) label(ctx, String(i + 1), p[0] + (dx / d) * 30, p[1] + (dy / d) * 30, { size: 20, weight: 700, fill: 'orange' });
    });
    // Lines of symmetry, after the corners.
    const st = t - 1.6 - n * 0.25;
    if (sh.sym && st > 0) {
      const base = /square|rectangle|rhombus/i.test(sh.name) ? 0 : -Math.PI / 2;
      ctx.globalAlpha = k * easeOut(clamp(st / 0.6)) * 0.85;
      ctx.strokeStyle = COLORS.purple; ctx.lineWidth = 2.5; ctx.setLineDash([10, 9]);
      for (let j = 0; j < Math.min(sh.sym, 8); j++) { const a = base + (j * Math.PI) / sh.sym; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * S * 1.2, y - Math.sin(a) * S * 1.2); ctx.lineTo(x + Math.cos(a) * S * 1.2, y + Math.sin(a) * S * 1.2); ctx.stroke(); }
      ctx.setLineDash([]);
    }
    ctx.globalAlpha = k;
    // Equal sides: the same number of ticks on each side of a group.
    (sh.equal || []).forEach((group, g) => group.forEach((i) => {
      const [mx, my] = mid(i); const a = P[i]; const b2 = P[(i + 1) % n];
      const ang = Math.atan2(b2[1] - a[1], b2[0] - a[0]) + Math.PI / 2;
      ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
      for (let j = 0; j <= g; j++) { const o = (j - g / 2) * 11; const ox = mx + Math.cos(ang - Math.PI / 2) * o; const oy = my + Math.sin(ang - Math.PI / 2) * o; ctx.beginPath(); ctx.moveTo(ox - Math.cos(ang) * 15, oy - Math.sin(ang) * 15); ctx.lineTo(ox + Math.cos(ang) * 15, oy + Math.sin(ang) * 15); ctx.stroke(); }
    }));
    ctx.restore();
  }

  function drawSolid(ctx, sh, x, y, S, t, clock, detail, col) {
    const yaw = 0.6 + clock * 0.45; const pitch = 0.42;
    const cy2 = Math.cos(yaw); const sy2 = Math.sin(yaw); const cp = Math.cos(pitch); const sp = Math.sin(pitch);
    const T = ([px, py, pz]) => { const x1 = px * cy2 + pz * sy2; const z1 = -px * sy2 + pz * cy2; return [x1, py * cp - z1 * sp, py * sp + z1 * cp]; };
    const q = easeOut(clamp(t / 0.8));
    ctx.save();
    ctx.globalAlpha *= q;
    ctx.lineJoin = 'round';
    if (sh.v) {
      const V = sh.v.map(T);
      const P = V.map(([px, py]) => [x + px * S, y + py * S]);
      const centre = V.reduce((a, v) => [a[0] + v[0] / V.length, a[1] + v[1] / V.length, a[2] + v[2] / V.length], [0, 0, 0]);
      const faces = sh.f.map((f) => {
        const [a, b2, c2] = f.map((i) => V[i]);
        let nx = (b2[1] - a[1]) * (c2[2] - a[2]) - (b2[2] - a[2]) * (c2[1] - a[1]);
        let ny = (b2[2] - a[2]) * (c2[0] - a[0]) - (b2[0] - a[0]) * (c2[2] - a[2]);
        let nz = (b2[0] - a[0]) * (c2[1] - a[1]) - (b2[1] - a[1]) * (c2[0] - a[0]);
        const fc = f.reduce((acc, i) => [acc[0] + V[i][0] / f.length, acc[1] + V[i][1] / f.length, acc[2] + V[i][2] / f.length], [0, 0, 0]);
        if (nx * (fc[0] - centre[0]) + ny * (fc[1] - centre[1]) + nz * (fc[2] - centre[2]) < 0) { nx = -nx; ny = -ny; nz = -nz; }
        const len = Math.hypot(nx, ny, nz) || 1;
        return { f, front: nz < 0, light: Math.max(0, (-nz / len) * 0.7 + (-ny / len) * 0.3) };
      });
      // Hidden edges dashed and faint, then the visible faces, lit by their angle.
      const edges = new Map();
      for (const fc of faces) fc.f.forEach((i, j) => { const k2 = fc.f[(j + 1) % fc.f.length]; const key = i < k2 ? `${i}-${k2}` : `${k2}-${i}`; const e = edges.get(key) || { a: i, b: k2, front: false }; e.front ||= fc.front; edges.set(key, e); });
      ctx.setLineDash([7, 8]); ctx.strokeStyle = 'rgba(160,190,255,0.35)'; ctx.lineWidth = 2;
      for (const e of edges.values()) if (!e.front) { ctx.beginPath(); ctx.moveTo(...P[e.a]); ctx.lineTo(...P[e.b]); ctx.stroke(); }
      ctx.setLineDash([]);
      for (const fc of faces) if (fc.front) { ctx.fillStyle = `rgba(34,211,238,${0.08 + fc.light * 0.32})`; ctx.beginPath(); fc.f.forEach((i, j) => (j ? ctx.lineTo(...P[i]) : ctx.moveTo(...P[i]))); ctx.closePath(); ctx.fill(); }
      glow(ctx, col, 12);
      ctx.strokeStyle = col; ctx.lineWidth = 4;
      for (const e of edges.values()) if (e.front) { ctx.beginPath(); ctx.moveTo(...P[e.a]); ctx.lineTo(...P[e.b]); ctx.stroke(); }
      ctx.shadowBlur = 0;
      if (detail) { ctx.fillStyle = COLORS.orange; V.forEach((v, i) => { if (v[2] < centre[2] + 0.05) { ctx.beginPath(); ctx.arc(P[i][0], P[i][1], 6, 0, Math.PI * 2); ctx.fill(); } }); }
    } else {
      // Curved solids from ellipses: they look the same from any turn.
      const tilt = 0.32;
      ctx.strokeStyle = col; ctx.lineWidth = 4;
      const body = ctx.createLinearGradient(x - S, 0, x + S, 0);
      body.addColorStop(0, 'rgba(34,211,238,0.10)'); body.addColorStop(0.45, 'rgba(34,211,238,0.34)'); body.addColorStop(1, 'rgba(34,211,238,0.06)');
      if (sh.kind === 'sphere' || sh.kind === 'hemisphere') {
        ctx.fillStyle = body; glow(ctx, col, 14);
        ctx.beginPath();
        if (sh.kind === 'sphere') ctx.arc(x, y, S * 0.85, 0, Math.PI * 2); else { ctx.arc(x, y + S * 0.2, S * 0.85, Math.PI, 0); ctx.ellipse(x, y + S * 0.2, S * 0.85, S * 0.85 * tilt, 0, 0, Math.PI); }
        ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(160,190,255,0.45)'; ctx.lineWidth = 2;
        for (let j = 0; j < 3; j++) { const ph = ((clock * 0.45 + j / 3) % 1) * Math.PI; const rx = Math.abs(Math.cos(ph)) * S * 0.85; ctx.beginPath(); if (sh.kind === 'sphere') ctx.ellipse(x, y, rx, S * 0.85, 0, 0, Math.PI * 2); else ctx.ellipse(x, y + S * 0.2, rx, S * 0.85, 0, Math.PI, Math.PI * 2); ctx.stroke(); }
        ctx.beginPath(); ctx.ellipse(x, y + (sh.kind === 'sphere' ? 0 : S * 0.2), S * 0.85, S * 0.85 * tilt, 0, 0, Math.PI * 2); ctx.stroke();
      } else {
        const rx = S * 0.7; const ry = rx * tilt; const top = y - S * 0.75; const bot = y + S * 0.75;
        ctx.fillStyle = body; glow(ctx, col, 14);
        ctx.beginPath();
        if (sh.kind === 'cylinder') { ctx.moveTo(x - rx, top); ctx.lineTo(x - rx, bot); ctx.ellipse(x, bot, rx, ry, 0, Math.PI, 0, true); ctx.lineTo(x + rx, top); }
        else { ctx.moveTo(x, top); ctx.lineTo(x - rx, bot); ctx.ellipse(x, bot, rx, ry, 0, Math.PI, 0, true); ctx.closePath(); }
        ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.setLineDash([7, 8]); ctx.strokeStyle = 'rgba(160,190,255,0.4)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(x, bot, rx, ry, 0, Math.PI, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        if (sh.kind === 'cylinder') { ctx.fillStyle = 'rgba(34,211,238,0.25)'; ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, top, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
        else if (detail) { ctx.fillStyle = COLORS.orange; ctx.beginPath(); ctx.arc(x, top, 7, 0, Math.PI * 2); ctx.fill(); }
        // A band of light sweeping round shows it is round.
        const sw = Math.sin(clock * 1.2) * rx * 0.8;
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(x + sw * (sh.kind === 'cone' ? 0 : 1), top + (sh.kind === 'cone' ? 6 : ry)); ctx.lineTo(x + sw, bot + Math.sqrt(Math.max(0, 1 - (sw / rx) ** 2)) * ry - 4); ctx.stroke();
      }
    }
    ctx.restore();
  }

  const draw = {
    // A real picture (from Wikimedia Commons, freely licensed): fitted in
    // a rounded frame with a slow zoom, its caption and its credit.
    // "Learn more" on the board itself, when nothing drawn fits: the article
    // (title, what it is, its first lines), the official website, and the best
    // videos; each card is a button that opens it in a new tab.
    learn(b, ctx, it, t) {
      const art = it.article || {};
      const site = it.website;
      const vids = (it.videos || []).slice(0, 2);
      const fit = (text, max, size, weight = 500, n = 2) => {
        ctx.font = `${weight} ${size}px ${FONT}`;
        const out = []; let line = '';
        for (const w of String(text || '').split(/\s+/)) {
          const next = line ? `${line} ${w}` : w;
          if (ctx.measureText(next).width > max && line) { out.push(line); line = w; if (out.length === n) break; } else line = next;
        }
        if (out.length < n && line) out.push(line);
        if (out.length === n && ctx.measureText(out[n - 1]).width > max - 20) out[n - 1] = `${out[n - 1].slice(0, -3)}…`;
        return out;
      };
      const pill = (text, x, y, c) => {
        ctx.font = `700 18px ${FONT}`;
        const w = ctx.measureText(text).width + 28;
        ctx.fillStyle = tint(c, 0.16); ctx.strokeStyle = tint(c, 0.6); ctx.lineWidth = 1.5;
        rounded(ctx, x, y, w, 34, 17); ctx.fill(); ctx.stroke();
        label(ctx, text, x + w / 2, y + 18, { size: 18, weight: 700, fill: c });
      };
      const card = (x, y, w, h, c) => { ctx.fillStyle = 'rgba(255,255,255,0.045)'; ctx.strokeStyle = tint(c, 0.45); ctx.lineWidth = 2; rounded(ctx, x, y, w, h, 20); ctx.fill(); ctx.stroke(); };
      const img = (key, src) => { if (!src) return null; it[key] ||= Object.assign(new Image(), { decoding: 'async', referrerPolicy: 'no-referrer', src }); return it[key].complete && it[key].naturalWidth ? it[key] : null; };
      const X = FIG.x + 20; const W = FIG.w - 40;
      let y = FIG.y + 16;
      const step = (i) => { const q = easeOut(clamp((t - i * 0.25) / 0.5)); ctx.globalAlpha = q; return (1 - q) * 18; };
      ctx.save();
      // The article.
      const aH = site ? 236 : 262;
      let dy = step(0);
      card(X, y + dy, W, aH, 'blue');
      const pic = img('_art', art.thumb);
      const tw = 190; const th = aH - 36;
      ctx.save(); rounded(ctx, X + 18, y + dy + 18, tw, th, 14); ctx.clip();
      if (pic) { const k = Math.max(tw / pic.naturalWidth, th / pic.naturalHeight); ctx.drawImage(pic, X + 18 + (tw - pic.naturalWidth * k) / 2, y + dy + 18 + (th - pic.naturalHeight * k) / 2, pic.naturalWidth * k, pic.naturalHeight * k); }
      else { ctx.fillStyle = '#f1f3f8'; ctx.fillRect(X + 18, y + dy + 18, tw, th); label(ctx, 'W', X + 18 + tw / 2, y + dy + 18 + th / 2, { size: 96, weight: 700, fill: '#111' }); }
      ctx.restore();
      const tx = X + tw + 40; const tW = W - tw - 60;
      fit(art.title, tW, 32, 700, 1).forEach((l) => label(ctx, l, tx, y + dy + 42, { size: 32, weight: 700, fill: 'ink', align: 'left' }));
      fit(art.description, tW, 20, 500, 1).forEach((l) => label(ctx, l, tx, y + dy + 78, { size: 20, weight: 500, fill: 'cyan', align: 'left' }));
      fit(art.extract, tW, 21, 400, site ? 3 : 4).forEach((l, i) => label(ctx, l, tx, y + dy + 112 + i * 29, { size: 21, weight: 400, fill: 'ink', align: 'left' }));
      pill(`Read on ${art.site || 'Wikipedia'} ↗`, tx, y + dy + aH - 50, 'blue');
      if (art.url) b.hits.push({ i: { url: art.url }, x: X, y, w: W, h: aH });
      y += aH + 16;
      // The official website.
      if (site) {
        dy = step(1);
        const sH = 108;
        card(X, y + dy, W, sH, 'teal');
        // A small globe.
        const gx = X + 52; const gy = y + dy + sH / 2;
        ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(gx, gy, 26, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(gx, gy, 11, 26, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(gx - 26, gy); ctx.lineTo(gx + 26, gy); ctx.stroke();
        label(ctx, 'Official website', X + 100, y + dy + 26, { size: 17, weight: 700, fill: 'teal', align: 'left' });
        fit(site.title, W - 330, 22, 700, 1).forEach((l) => label(ctx, l, X + 100, y + dy + 54, { size: 22, weight: 700, fill: 'ink', align: 'left' }));
        fit(site.description || site.domain, W - 330, 18, 400, 1).forEach((l) => label(ctx, l, X + 100, y + dy + 84, { size: 18, weight: 400, fill: 'muted', align: 'left' }));
        pill(`${site.domain} ↗`, X + W - 230, y + dy + 36, 'teal');
        b.hits.push({ i: { url: site.url }, x: X, y, w: W, h: sH });
        y += sH + 16;
      }
      // The videos, side by side.
      const vw = vids.length > 1 ? (W - 16) / 2 : W;
      vids.forEach((v, i) => {
        dy = step(2 + i);
        const vx = X + i * (vw + 16);
        const left = FIG.y + FIG.h - y - 8;
        const thH = Math.min(left - 70, Math.round(vw * 9 / 16));
        const thW = vids.length > 1 ? vw : Math.round(thH * 16 / 9);
        const t0 = img(`_v${i}`, v.thumb);
        ctx.save(); rounded(ctx, vx, y + dy, thW, thH, 16); ctx.clip();
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(vx, y + dy, thW, thH);
        if (t0) { const k = Math.max(thW / t0.naturalWidth, thH / t0.naturalHeight); ctx.drawImage(t0, vx + (thW - t0.naturalWidth * k) / 2, y + dy + (thH - t0.naturalHeight * k) / 2, t0.naturalWidth * k, t0.naturalHeight * k); }
        ctx.restore();
        ctx.strokeStyle = 'rgba(140,170,255,0.35)'; ctx.lineWidth = 2; rounded(ctx, vx, y + dy, thW, thH, 16); ctx.stroke();
        // The play button, pulsing.
        const px = vx + thW / 2; const py = y + dy + thH / 2; const r = 30 * (1 + 0.05 * Math.sin(b.clock * 3 + i));
        glow(ctx, '#ff2d55', 20); ctx.fillStyle = '#ff2d55'; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(px - r * 0.32, py - r * 0.45); ctx.lineTo(px + r * 0.5, py); ctx.lineTo(px - r * 0.32, py + r * 0.45); ctx.closePath(); ctx.fill();
        const textX = vids.length > 1 ? vx : vx + thW + 20;
        const textY = vids.length > 1 ? y + dy + thH + 26 : y + dy + 30;
        const textW = vids.length > 1 ? vw : W - thW - 20;
        fit(v.title, textW, 20, 700, vids.length > 1 ? 1 : 3).forEach((l, j) => label(ctx, l, textX, textY + j * 28, { size: 20, weight: 700, fill: 'ink', align: 'left' }));
        label(ctx, `▶ YouTube · ${[v.channel, v.duration].filter(Boolean).join(' · ')}`.slice(0, 60), textX, vids.length > 1 ? textY + 28 : textY + 96, { size: 17, weight: 500, fill: 'muted', align: 'left' });
        b.hits.push({ i: { url: v.url }, x: vx, y, w: vids.length > 1 ? vw : W, h: thH + 60 });
      });
      ctx.restore();
    },
    // Videos to watch: one big card with a play button, up to two small ones
    // below; each is a button that opens the video on YouTube.
    video(b, ctx, it, t) {
      const vids = (it.items || []).slice(0, 3);
      vids.forEach((v) => { v._img ||= Object.assign(new Image(), { decoding: 'async', referrerPolicy: 'no-referrer', src: v.thumb }); });
      const thumb = (v, x, y, w, h, r) => {
        ctx.save();
        rounded(ctx, x, y, w, h, r);
        ctx.clip();
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(x, y, w, h);
        if (v._img.complete && v._img.naturalWidth) ctx.drawImage(v._img, x, y, w, h);
        ctx.restore();
        ctx.strokeStyle = 'rgba(140,170,255,0.35)';
        ctx.lineWidth = 2;
        rounded(ctx, x, y, w, h, r);
        ctx.stroke();
      };
      const play = (x, y, r, pulse) => {
        ctx.save();
        glow(ctx, '#ff2d55', 24 + pulse * 16);
        ctx.fillStyle = '#ff2d55';
        ctx.beginPath(); ctx.arc(x, y, r * (1 + pulse * 0.06), 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.moveTo(x - r * 0.32, y - r * 0.45); ctx.lineTo(x + r * 0.5, y); ctx.lineTo(x - r * 0.32, y + r * 0.45); ctx.closePath(); ctx.fill();
        ctx.restore();
      };
      const meta = (v) => [v.channel, v.duration].filter(Boolean).join(' · ');
      const cut = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trim()}…` : s);
      // The big card.
      const big = vids[0];
      if (!big) return;
      const bx = FIG.x + 20; const by = FIG.y + 30; const bw = FIG.w - 40; const bh = Math.round(bw * 9 / 16);
      ctx.save();
      const q = easeOut(clamp(t / 0.5));
      ctx.globalAlpha *= q;
      ctx.translate(0, (1 - q) * 24);
      thumb(big, bx, by, bw, bh, 22);
      play(bx + bw / 2, by + bh / 2, 46, (Math.sin(b.clock * 3) + 1) / 2);
      if (big.duration) {
        ctx.font = '700 18px Lexend, system-ui, sans-serif';
        const dw = ctx.measureText(big.duration).width + 16;
        ctx.fillStyle = 'rgba(0,0,0,0.78)';
        rounded(ctx, bx + bw - dw - 12, by + bh - 40, dw, 28, 6); ctx.fill();
        label(ctx, big.duration, bx + bw - dw / 2 - 12, by + bh - 26, { size: 18, weight: 700, fill: 'ink' });
      }
      label(ctx, cut(big.title, 62), bx, by + bh + 34, { size: 26, weight: 700, fill: 'ink', align: 'left' });
      label(ctx, meta(big), bx, by + bh + 66, { size: 19, weight: 500, fill: 'muted', align: 'left' });
      b.hits.push({ i: { url: big.url }, x: bx, y: by, w: bw, h: bh + 80 });
      ctx.restore();
      // The small cards.
      vids.slice(1).forEach((v, k) => {
        const lt = t - 0.5 - k * 0.25;
        if (lt < 0) return;
        const sw = (bw - 20) / 2; const sx = bx + k * (sw + 20); const sy = by + bh + 96; const th = 92; const tw = Math.round(th * 16 / 9);
        ctx.save();
        ctx.globalAlpha *= easeOut(clamp(lt / 0.4));
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        rounded(ctx, sx, sy, sw, th, 14); ctx.fill();
        thumb(v, sx, sy, tw, th, 14);
        play(sx + tw / 2, sy + th / 2, 16, 0);
        const words = cut(v.title, 44);
        const half = words.length > 22 ? words.lastIndexOf(' ', 24) : -1;
        label(ctx, half > 0 ? words.slice(0, half) : words, sx + tw + 12, sy + 26, { size: 17, weight: 700, fill: 'ink', align: 'left' });
        if (half > 0) label(ctx, words.slice(half + 1), sx + tw + 12, sy + 48, { size: 17, weight: 700, fill: 'ink', align: 'left' });
        label(ctx, cut(meta(v), 26), sx + tw + 12, sy + 76, { size: 15, weight: 500, fill: 'muted', align: 'left' });
        b.hits.push({ i: { url: v.url }, x: sx, y: sy, w: sw, h: th });
        ctx.restore();
      });
    },
    image(b, ctx, it, t) {
      if (it.render && RENDERS[it.render]) { renderPicture(b, ctx, it, RENDERS[it.render], t); return; }
      const img = it._img ||= Object.assign(new Image(), { decoding: 'async', referrerPolicy: 'no-referrer', src: it.src });
      const box = { x: FIG.x + 10, y: FIG.y + 30, w: FIG.w - 20, h: FIG.h - 110 };
      ctx.save();
      ctx.globalAlpha *= easeOut(clamp(t / 0.6));
      rounded(ctx, box.x, box.y, box.w, box.h, 20);
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fill();
      if (img.complete && img.naturalWidth) {
        ctx.save();
        rounded(ctx, box.x, box.y, box.w, box.h, 20);
        ctx.clip();
        const k = Math.max(box.w / img.naturalWidth, box.h / img.naturalHeight) * (1.04 + 0.05 * Math.sin(b.clock * 0.15));
        const w = img.naturalWidth * k; const h = img.naturalHeight * k;
        const fit = img.naturalWidth / img.naturalHeight < 1.2; // tall or square images are shown whole
        if (fit) {
          const k2 = Math.min(box.w / img.naturalWidth, box.h / img.naturalHeight);
          ctx.drawImage(img, box.x + (box.w - img.naturalWidth * k2) / 2, box.y + (box.h - img.naturalHeight * k2) / 2, img.naturalWidth * k2, img.naturalHeight * k2);
        } else ctx.drawImage(img, box.x + (box.w - w) / 2, box.y + (box.h - h) / 2, w, h);
        ctx.restore();
      } else {
        label(ctx, img.complete ? 'No picture' : 'Loading the picture…', box.x + box.w / 2, box.y + box.h / 2, { size: 24, weight: 500, fill: 'muted' });
      }
      ctx.strokeStyle = 'rgba(140,170,255,0.35)';
      ctx.lineWidth = 2;
      rounded(ctx, box.x, box.y, box.w, box.h, 20);
      ctx.stroke();
      if (it.caption) label(ctx, it.caption, box.x + box.w / 2, box.y + box.h + 30, { size: 26, weight: 700, fill: 'ink' });
      if (it.credit) label(ctx, `Image: ${String(it.credit).slice(0, 90)}`, box.x + box.w / 2, box.y + box.h + 60, { size: 14, weight: 400, fill: 'muted' });
      ctx.restore();
    },

    // A cell: membrane, nucleus and the parts round it, labelled one by one.
    // value 'plant' adds the cell wall, chloroplasts and the big vacuole.
    cell(b, ctx, it, t) {
      const plant = /plant/i.test(String(it.value || it.center || ''));
      const x0 = FIG.x + 70; const y0 = FIG.y + 70; const w = FIG.w - 300; const h = FIG.h - 160;
      const q = easeOut(clamp(t / 0.7));
      ctx.save();
      ctx.globalAlpha *= q;
      if (plant) {
        ctx.strokeStyle = COLORS.green; ctx.lineWidth = 9; glow(ctx, COLORS.green, 10);
        rounded(ctx, x0 - 8, y0 - 8, w + 16, h + 16, 18); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(52,211,153,0.10)'; rounded(ctx, x0, y0, w, h, 14); ctx.fill();
        ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 3; rounded(ctx, x0, y0, w, h, 14); ctx.stroke();
        ctx.fillStyle = 'rgba(91,140,255,0.16)'; ctx.strokeStyle = 'rgba(140,170,255,0.6)'; ctx.lineWidth = 2;
        rounded(ctx, x0 + w * 0.32, y0 + h * 0.22, w * 0.5, h * 0.56, 40); ctx.fill(); ctx.stroke();
      } else {
        const wob = (a) => 1 + Math.sin(a * 3 + b.clock * 1.2) * 0.025;
        ctx.beginPath();
        for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2; const px = x0 + w / 2 + Math.cos(a) * (w / 2) * wob(a); const py = y0 + h / 2 + Math.sin(a) * (h / 2) * wob(a + 1); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.fillStyle = 'rgba(251,113,133,0.10)'; ctx.fill();
        ctx.strokeStyle = COLORS.red; ctx.lineWidth = 3; glow(ctx, COLORS.red, 10); ctx.stroke(); ctx.shadowBlur = 0;
      }
      // Nucleus, mitochondria (and chloroplasts) drifting gently.
      const nx = x0 + (plant ? w * 0.2 : w * 0.45); const ny = y0 + h * (plant ? 0.3 : 0.45);
      const g = ctx.createRadialGradient(nx - 10, ny - 10, 4, nx, ny, 60);
      g.addColorStop(0, '#c4b5fd'); g.addColorStop(1, '#6d28d9');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(nx, ny, 52, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3b0f84'; ctx.beginPath(); ctx.arc(nx + 8, ny - 6, 14, 0, Math.PI * 2); ctx.fill();
      const mito = [[0.72, 0.25], [0.2, 0.72], [0.62, 0.78]];
      mito.forEach(([fx, fy], i) => {
        const mx = x0 + w * fx + Math.sin(b.clock * 0.7 + i) * 6; const my = y0 + h * fy + Math.cos(b.clock * 0.6 + i) * 5;
        ctx.save(); ctx.translate(mx, my); ctx.rotate(0.5 + i);
        ctx.fillStyle = 'rgba(255,159,67,0.75)'; ctx.beginPath(); ctx.ellipse(0, 0, 34, 15, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#7a3d00'; ctx.lineWidth = 2; ctx.beginPath(); for (let k = -24; k <= 24; k += 8) { ctx.moveTo(k, -9); ctx.lineTo(k + 4, 9); } ctx.stroke();
        ctx.restore();
      });
      if (plant) [[0.15, 0.62], [0.9, 0.4], [0.88, 0.85], [0.45, 0.9]].forEach(([fx, fy], i) => {
        const cx2 = x0 + w * fx + Math.sin(b.clock + i) * 4; const cy2 = y0 + h * fy;
        ctx.fillStyle = 'rgba(52,211,153,0.85)'; ctx.beginPath(); ctx.ellipse(cx2, cy2, 26, 14, 0.3 * i, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#065f46'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx2 - 16, cy2); ctx.lineTo(cx2 + 16, cy2); ctx.stroke();
      });
      ctx.restore();
      // Labels with leader lines, on the right, one by one.
      const parts = plant
        ? [['Cell wall', x0 + w, y0 + 40], ['Cell membrane', x0 + w - 4, y0 + 100], ['Vacuole', x0 + w * 0.7, y0 + h * 0.5], ['Nucleus', nx + 50, ny], ['Chloroplast', x0 + w * 0.9, y0 + h * 0.4], ['Mitochondrion', x0 + w * 0.62, y0 + h * 0.78], ['Cytoplasm', x0 + w * 0.3, y0 + h * 0.85]]
        : [['Cell membrane', x0 + w * 0.93, y0 + h * 0.3], ['Nucleus', nx + 50, ny], ['Mitochondrion', x0 + w * 0.72, y0 + h * 0.25], ['Cytoplasm', x0 + w * 0.35, y0 + h * 0.6], ['Ribosomes', x0 + w * 0.6, y0 + h * 0.55]];
      if (!plant) { ctx.fillStyle = COLORS.ink; for (let k = 0; k < 14; k++) { ctx.beginPath(); ctx.arc(x0 + w * (0.52 + ((k * 37) % 23) / 100), y0 + h * (0.5 + ((k * 53) % 19) / 100), 2.5, 0, Math.PI * 2); ctx.fill(); } }
      const lx = FIG.x + FIG.w - 200;
      // Label slots top to bottom in the order of the parts, so no lines cross.
      parts.sort((p1, p2) => p1[2] - p2[2]);
      parts.forEach(([name, px, py], i) => {
        const lt = t - 0.8 - i * 0.45;
        if (lt < 0) return;
        const k = easeOut(clamp(lt / 0.4));
        const ly = FIG.y + 70 + i * ((FIG.h - 140) / (parts.length - 1 || 1));
        const c = color(HUES[i % HUES.length]);
        ctx.save();
        ctx.globalAlpha *= k;
        ctx.strokeStyle = c; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + (lx - 12 - px) * k, py + (ly - py) * k); ctx.stroke();
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
        label(ctx, name, lx, ly, { size: 21, weight: 700, fill: c, align: 'left' });
        ctx.restore();
      });
      label(ctx, plant ? 'Plant cell' : 'Animal cell', x0 + w / 2, FIG.y + 30, { size: 26, weight: 800, fill: 'ink' });
    },

    // The pH scale: acid red to alkali purple, with everyday examples.
    phscale(b, ctx, it, t) {
      const x0 = FIG.x + 40; const w = FIG.w - 80; const y = cy - 30; const h = 70;
      const COLS = ['#e11d48', '#f43f5e', '#fb7185', '#fb923c', '#fbbf24', '#facc15', '#a3e635', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#7c3aed', '#9333ea', '#a21caf'];
      const q = clamp(t / 1.2);
      for (let i = 0; i <= 14; i++) {
        if (i / 14 > q + 0.001) break;
        ctx.fillStyle = COLS[i];
        ctx.fillRect(x0 + (w / 15) * i, y, w / 15 + 1, h);
        label(ctx, String(i), x0 + (w / 15) * (i + 0.5), y + h / 2 + 1, { size: 22, weight: 800, fill: i >= 4 && i <= 8 ? '#0b1024' : '#ffffff' });
      }
      if (t < 1.2) return;
      const k = easeOut(clamp((t - 1.2) / 0.5));
      ctx.save();
      ctx.globalAlpha *= k;
      label(ctx, 'ACID', x0 + w * 0.18, y - 34, { size: 24, weight: 800, fill: '#fb7185' });
      label(ctx, 'NEUTRAL', x0 + w * 0.5, y - 34, { size: 24, weight: 800, fill: 'green' });
      label(ctx, 'ALKALI', x0 + w * 0.82, y - 34, { size: 24, weight: 800, fill: 'purple' });
      const examples = [[1, 'Stomach acid'], [2.5, 'Lemon juice'], [5.5, 'Coffee'], [7, 'Pure water'], [8.3, 'Baking soda'], [11, 'Ammonia'], [13.5, 'Drain cleaner']];
      examples.forEach(([ph, name], i) => {
        const lt = t - 1.5 - i * 0.25;
        if (lt < 0) return;
        const x = x0 + (w / 15) * (ph + 0.5); const down = i % 2 === 0;
        ctx.globalAlpha = k * easeOut(clamp(lt / 0.35));
        ctx.strokeStyle = 'rgba(220,230,255,0.6)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + h + (down ? 50 : 120)); ctx.stroke();
        label(ctx, name, x, y + h + (down ? 70 : 140), { size: 19, weight: 600, fill: 'ink' });
      });
      ctx.restore();
      // A marker sliding to the value asked about (it.value), if any.
      const v = Number(it.value);
      if (Number.isFinite(v)) { const x = x0 + (w / 15) * (v + 0.5); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x - 12, y - 26); ctx.lineTo(x + 12, y - 26); ctx.closePath(); ctx.fill(); }
    },

    // A small periodic table (the first 20 elements), a group or element lit.
    periodic(b, ctx, it, t) {
      const EL = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca'];
      const pos = (z) => { if (z === 1) return [0, 0]; if (z === 2) return [7, 0]; const p = z <= 10 ? 1 : z <= 18 ? 2 : 3; return [z - (p === 1 ? 3 : p === 2 ? 11 : 19), p]; };
      const GROUP = (z) => { const [col] = pos(z); return col === 7 ? 0 : col + 1; };
      const want = String(it.value || '').toLowerCase();
      const litGroup = /alkali metal|group 1\b/.test(want) ? 1 : /halogen|group 7\b/.test(want) ? 7 : /noble|group 0\b|group 8\b/.test(want) ? 0 : null;
      const cell = 82; const gx = FIG.x + (FIG.w - cell * 8) / 2; const gy = FIG.y + 120;
      const colours = { 1: 'red', 2: 'orange', 7: 'teal', 0: 'purple' };
      EL.forEach((sym, i) => {
        const z = i + 1;
        const lt = t - i * 0.05;
        if (lt < 0) return;
        const [c0, r0] = pos(z);
        const x = gx + c0 * cell; const y = gy + r0 * cell;
        const g = GROUP(z);
        const lit = litGroup != null ? g === litGroup : want && (want === sym.toLowerCase());
        ctx.save();
        ctx.globalAlpha *= easeOut(clamp(lt / 0.3));
        const c = colours[g] || 'blue';
        if (lit) glow(ctx, color(c), 18);
        ctx.fillStyle = lit ? tint(c, 0.5) : tint(c, 0.14);
        ctx.strokeStyle = color(c); ctx.lineWidth = lit ? 3 : 1.5;
        rounded(ctx, x + 3, y + 3, cell - 6, cell - 6, 10); ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;
        label(ctx, String(z), x + 14, y + 16, { size: 14, weight: 500, fill: 'muted', align: 'left' });
        label(ctx, sym, x + cell / 2, y + cell / 2 + 6, { size: 28, weight: 800, fill: 'ink' });
        ctx.restore();
      });
      if (t > 1.2) {
        ctx.save(); ctx.globalAlpha *= easeOut(clamp((t - 1.2) / 0.4));
        label(ctx, 'Rows are periods · columns are groups', cx, FIG.y + 60, { size: 22, weight: 600, fill: 'muted' });
        [['Alkali metals', 'red'], ['Group 2', 'orange'], ['Halogens', 'teal'], ['Noble gases', 'purple']].forEach(([n, c], i) => { ctx.fillStyle = color(c); rounded(ctx, FIG.x + 40 + i * 190, FIG.y + FIG.h - 80, 22, 22, 6); ctx.fill(); label(ctx, n, FIG.x + 70 + i * 190, FIG.y + FIG.h - 69, { size: 18, weight: 600, fill: 'ink', align: 'left' }); });
        ctx.restore();
      }
    },

    // Shapes: one drawn big with what makes it that shape, or a gallery.
    shape(b, ctx, it, t) {
      const list = (it.items || [it.value]).map(findShape).filter(Boolean).slice(0, 6);
      if (!list.length) return;
      if (list.length === 1) {
        const sh = list[0];
        drawShape(ctx, sh, cx, FIG.y + 285, sh.solid ? 200 : 185, t, b.clock);
        label(ctx, sh.name, cx, FIG.y + 40, { size: 34, weight: 800, fill: 'ink' });
        (sh.facts || []).slice(0, 4).forEach((f, i) => {
          const lt = t - 2 - i * 0.35;
          if (lt < 0) return;
          ctx.save();
          ctx.globalAlpha *= easeOut(clamp(lt / 0.4));
          const col2 = i % 2; const row = Math.floor(i / 2);
          const x = FIG.x + 20 + col2 * 390; const y = FIG.y + 535 + row * 72;
          ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.strokeStyle = color(HUES[i % HUES.length]); ctx.lineWidth = 1.5;
          rounded(ctx, x, y, 370, 58, 14); ctx.fill(); ctx.stroke();
          wrapLabel(ctx, f, x + 16, y + 29, 340, 21, 'left', 'ink', 600);
          ctx.restore();
        });
        return;
      }
      const cols = list.length <= 3 ? list.length : list.length === 4 ? 2 : 3;
      const rows = Math.ceil(list.length / cols);
      const cw = FIG.w / cols; const ch = (FIG.h - 40) / rows;
      list.forEach((sh, i) => {
        const lt = t - i * 0.3;
        if (lt < 0) return;
        const x = FIG.x + cw * (i % cols) + cw / 2; const y = FIG.y + 20 + ch * Math.floor(i / cols) + ch / 2 - 22;
        drawShape(ctx, sh, x, y, Math.min(cw, ch) * 0.3, lt, b.clock + i, { detail: false, c: HUES[i % HUES.length] });
        ctx.save();
        ctx.globalAlpha *= easeOut(clamp((lt - 0.5) / 0.4));
        label(ctx, sh.name, x, y + Math.min(cw, ch) * 0.3 + 36, { size: 22, weight: 700, fill: 'ink' });
        const sub = sh.solid ? (sh.facts?.[0] || '') : sh.round ? 'curved' : `${sh.pts.length} sides`;
        label(ctx, sub.length > 30 ? sub.slice(0, 28) + '…' : sub, x, y + Math.min(cw, ch) * 0.3 + 62, { size: 17, weight: 500, fill: 'muted' });
        ctx.restore();
      });
    },

    // Values over time or over categories: the line draws itself.
    line(b, ctx, it, t) {
      const { a, rows } = it;
      if (!rows.length) return;
      ctx.save();
      fade(ctx, t);
      drawAxes(ctx, a, { yTicks: it.ticks, xLabels: rows.map((r, i) => [i, r.label.slice(0, 10)]) });
      const q = clamp((t - 0.3) / 1.4);
      const n = q * (rows.length - 1);
      const pts = rows.map((r, i) => [a.px(i), a.py(r.value)]);
      // Area under the line, then the line, then the points.
      ctx.beginPath();
      ctx.moveTo(pts[0][0], a.py(Math.max(a.y0, 0)));
      for (let i = 0; i <= Math.floor(n); i++) ctx.lineTo(...pts[i]);
      const fi = Math.floor(n); const ff = n - fi;
      const tip = fi < pts.length - 1 ? [pts[fi][0] + (pts[fi + 1][0] - pts[fi][0]) * ff, pts[fi][1] + (pts[fi + 1][1] - pts[fi][1]) * ff] : pts[fi];
      ctx.lineTo(...tip);
      ctx.lineTo(tip[0], a.py(Math.max(a.y0, 0)));
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, a.box.y, 0, a.box.y + a.box.h);
      grad.addColorStop(0, 'rgba(34,211,238,0.28)'); grad.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.fillStyle = grad;
      ctx.fill();
      glow(ctx, COLORS.cyan, 14);
      ctx.strokeStyle = COLORS.cyan;
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      pts.slice(0, fi + 1).forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
      ctx.lineTo(...tip);
      ctx.stroke();
      ctx.shadowBlur = 0;
      pts.forEach((p, i) => {
        if (i > n + 0.01) return;
        ctx.fillStyle = '#050816'; ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p[0], p[1], 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (rows.length <= 8) label(ctx, `${fmtN(rows[i].value)}${rows[i].unit === '%' ? '%' : ''}`, p[0], p[1] - 22, { size: 18, weight: 700, fill: 'ink' });
      });
      ctx.restore();
      if (it.label) wrapLabel(ctx, it.label, FIG.x, FIG.y + 34, FIG.w, 22, 'center', 'muted');
    },

    // Parts of a whole: wedges sweep round, the biggest named on the side.
    pie(b, ctx, it, t) {
      const R = 230; const px = FIG.x + 270; const py = cy + 10;
      const sweep = -Math.PI / 2 + easeOut(clamp(t / 1.2)) * Math.PI * 2;
      it.rows.forEach((r, i) => {
        const a1 = Math.min(r.a1, sweep);
        if (a1 <= r.a0) return;
        const mid = (r.a0 + r.a1) / 2;
        const pop = 6;
        ctx.save();
        ctx.translate(Math.cos(mid) * pop, Math.sin(mid) * pop);
        glow(ctx, color(r.c), 12);
        ctx.fillStyle = tint(r.c, 0.55);
        ctx.strokeStyle = color(r.c);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, R, r.a0, a1); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
        if (sweep >= r.a1 && r.pct >= 6) label(ctx, `${r.pct}%`, px + Math.cos(mid) * R * 0.66, py + Math.sin(mid) * R * 0.66, { size: 24, weight: 700, fill: '#ffffff' });
      });
      ctx.fillStyle = '#070b1d';
      ctx.beginPath(); ctx.arc(px, py, R * 0.38, 0, Math.PI * 2); ctx.fill();
      if (it.label) wrapLabel(ctx, it.label, px - R * 0.34, py, R * 0.68, 19, 'center', 'muted', 600);
      it.rows.forEach((r, i) => {
        const lt = t - 0.3 - i * 0.18;
        if (lt < 0) return;
        ctx.save();
        ctx.globalAlpha *= easeOut(clamp(lt / 0.4));
        const y = cy - (it.rows.length * 64) / 2 + i * 64 + 32;
        ctx.fillStyle = color(r.c);
        rounded(ctx, FIG.x + 540, y - 12, 24, 24, 6); ctx.fill();
        wrapLabel(ctx, r.label, FIG.x + 576, y - 10, 200, 21, 'left', 'ink', 600);
        label(ctx, `${fmtN(r.value)}${r.unit === '%' ? '%' : r.unit ? ` ${r.unit}` : ''}`, FIG.x + 576, y + 16, { size: 18, weight: 500, fill: 'muted', align: 'left' });
        ctx.restore();
      });
    },

    // A small table: a glowing header row, then the rows one by one.
    table(b, ctx, it, t) {
      const rows = it.rows;
      if (!rows.length) return;
      const w = FIG.w - 40; const x = FIG.x + 20;
      const h = Math.min(86, (FIG.h - 120) / rows.length);
      const top = cy - (rows.length * h) / 2;
      const cw = w / it.cols;
      rows.forEach((r, i) => {
        const lt = t - i * 0.2;
        if (lt < 0) return;
        ctx.save();
        ctx.globalAlpha *= easeOut(clamp(lt / 0.35));
        const y = top + i * h;
        if (i === 0) { ctx.fillStyle = 'rgba(34,211,238,0.14)'; rounded(ctx, x, y, w, h - 6, 12); ctx.fill(); } else if (i % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.035)'; rounded(ctx, x, y, w, h - 6, 10); ctx.fill(); }
        r.forEach((cell, j) => wrapLabel(ctx, cell, x + j * cw + 14, y + (h - 6) / 2, cw - 28, i === 0 ? 23 : 22, 'left', i === 0 ? 'cyan' : 'ink', i === 0 ? 700 : 500));
        ctx.restore();
      });
    },

    // A number line with the values marked: maths for every age.
    numberline(b, ctx, it, t) {
      const x0 = FIG.x + 50; const x1 = FIG.x + FIG.w - 50; const y = cy + 20;
      const px = (v) => x0 + ((v - it.lo) / (it.hi - it.lo || 1)) * (x1 - x0);
      const q = easeOut(clamp(t / 0.6));
      ctx.save();
      ctx.strokeStyle = 'rgba(220,230,255,0.8)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + (x1 - x0) * q, y); ctx.stroke();
      if (q > 0.95) { arrow(ctx, x1 - 30, y, x1 + 14, y, 'rgba(220,230,255,0.8)', 4); arrow(ctx, x0 + 30, y, x0 - 14, y, 'rgba(220,230,255,0.8)', 4); }
      ctx.globalAlpha *= q;
      for (const v of it.ticks) { ctx.beginPath(); ctx.moveTo(px(v), y - 12); ctx.lineTo(px(v), y + 12); ctx.stroke(); label(ctx, fmtN(v), px(v), y + 36, { size: 20, weight: 500, fill: 'muted' }); }
      ctx.restore();
      it.marks.forEach((m, i) => {
        const lt = t - 0.6 - i * 0.35;
        if (lt < 0) return;
        const p = outBack(clamp(lt / 0.45));
        const c = color(HUES[i % HUES.length]);
        const x = px(m.value);
        ctx.save();
        glow(ctx, c, 18);
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(x, y, 12 * p, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha *= clamp(p);
        const up = i % 2 === 0;
        ctx.strokeStyle = c; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y + (up ? -16 : 16)); ctx.lineTo(x, y + (up ? -70 : 80)); ctx.stroke();
        label(ctx, `${m.label ? `${m.label}: ` : ''}${fmtN(m.value)}`, x, y + (up ? -88 : 100), { size: 22, weight: 700, fill: c });
        ctx.restore();
      });
    },

    // The graph of a function, drawn left to right, with points marked.
    graph(b, ctx, it, t) {
      const { a, f } = it;
      ctx.save();
      fade(ctx, t);
      drawAxes(ctx, a, { xTicks: nice(a.x0, a.x1, 8), yTicks: nice(a.y0, a.y1, 6) });
      ctx.restore();
      if (!f) return;
      const q = clamp((t - 0.3) / 1.5);
      ctx.save();
      ctx.beginPath(); ctx.rect(a.box.x, a.box.y, a.box.w, a.box.h); ctx.clip();
      glow(ctx, COLORS.purple, 16);
      ctx.strokeStyle = COLORS.purple;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      let pen = false;
      const N = 240;
      for (let i = 0; i <= N * q; i++) {
        const x = a.x0 + ((a.x1 - a.x0) * i) / N;
        const y = f(x);
        if (!Number.isFinite(y) || y < a.y0 - (a.y1 - a.y0) || y > a.y1 + (a.y1 - a.y0)) { pen = false; continue; }
        if (pen) ctx.lineTo(a.px(x), a.py(y)); else { ctx.moveTo(a.px(x), a.py(y)); pen = true; }
      }
      ctx.stroke();
      ctx.restore();
      label(ctx, prettyExpr(it.expr || it.value || ''), FIG.x + FIG.w / 2, FIG.y + 50, { size: 30, weight: 700, fill: 'purple' });
      it.pts.forEach((p, i) => {
        const lt = t - 1.6 - i * 0.35;
        if (lt < 0) return;
        const s = outBack(clamp(lt / 0.4));
        const x = a.px(p.x); const y = a.py(p.y);
        ctx.save();
        glow(ctx, COLORS.orange, 16);
        ctx.fillStyle = COLORS.orange;
        ctx.beginPath(); ctx.arc(x, y, 9 * s, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha *= clamp(s);
        label(ctx, `${p.text ? `${p.text} ` : ''}(${fmtN(p.x)}, ${fmtN(p.y)})`, x + 14, y - 22, { size: 19, weight: 700, fill: 'orange', align: 'left' });
        ctx.restore();
      });
    },

    // A free-body diagram: the object in the middle, a labelled arrow per force.
    forces(b, ctx, it, t) {
      const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0], 'up-right': [0.71, -0.71], 'up-left': [-0.71, -0.71], 'down-right': [0.71, 0.71], 'down-left': [-0.71, 0.71] };
      const forces = (it.items || []).map((s) => { const m = String(s).match(/^\s*(up-right|up-left|down-right|down-left|up|down|left|right)\s*[:-]\s*(.+)$/i); return m ? { d: DIRS[m[1].toLowerCase()], text: m[2].trim(), n: num(m[2]) } : null; }).filter(Boolean).slice(0, 6);
      const max = Math.max(1, ...forces.map((f) => (Number.isFinite(f.n) ? f.n : 0)));
      const ox = cx; const oy = cy + 10;
      const q = outBack(clamp(t / 0.5));
      ctx.save();
      ctx.translate(ox, oy); ctx.scale(q, q);
      glow(ctx, COLORS.blue, 20);
      ctx.fillStyle = 'rgba(91,140,255,0.22)'; ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 3;
      rounded(ctx, -80, -60, 160, 120, 16); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      wrapLabel(ctx, it.center || 'Object', -70, 0, 140, 24, 'center', 'ink', 700);
      ctx.restore();
      forces.forEach((f, i) => {
        const lt = t - 0.4 - i * 0.35;
        if (lt < 0) return;
        const p = easeOut(clamp(lt / 0.5));
        const len = (Number.isFinite(f.n) ? 90 + 130 * (f.n / max) : 170) * p;
        const sx = ox + f.d[0] * (f.d[0] ? 84 : 0); const sy = oy + f.d[1] * (f.d[1] ? 64 : 0);
        const ex = sx + f.d[0] * len; const ey = sy + f.d[1] * len;
        const c = HUES[(i + 3) % HUES.length];
        ctx.save();
        glow(ctx, color(c), 14);
        arrow(ctx, sx, sy, ex, ey, c, 7);
        ctx.shadowBlur = 0;
        ctx.globalAlpha *= p;
        const lx = ex + f.d[0] * 18 + (f.d[0] === 0 ? 16 : 0); const ly = ey + f.d[1] * 22;
        label(ctx, f.text, lx, ly, { size: 22, weight: 700, fill: c, align: f.d[0] < 0 ? 'right' : f.d[0] > 0 ? 'left' : 'left' });
        ctx.restore();
      });
    },

    // A travelling wave with its wavelength and amplitude marked.
    wave(b, ctx, it, t) {
      const x0 = FIG.x + 50; const x1 = FIG.x + FIG.w - 40; const y = cy + 10; const A = 110; const L = 300;
      const q = clamp(t / 1.2);
      const phase = b.clock * 2.2;
      ctx.save();
      ctx.strokeStyle = 'rgba(200,215,255,0.35)'; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.setLineDash([]);
      glow(ctx, COLORS.cyan, 16);
      ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 5;
      ctx.beginPath();
      for (let x = x0; x <= x0 + (x1 - x0) * q; x += 3) { const yy = y - A * Math.sin(((x - x0) / L) * Math.PI * 2 - phase); if (x === x0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
      ctx.stroke();
      ctx.restore();
      if (t < 1.2) return;
      const k = easeOut(clamp((t - 1.2) / 0.5));
      ctx.save();
      ctx.globalAlpha *= k;
      // Wavelength between two crests, amplitude from the middle line.
      const crest = x0 + L * (0.25 + (phase / (Math.PI * 2)) % 1);
      const c0 = crest > x0 + L ? crest - L : crest;
      arrow(ctx, c0 + 10, y - A - 40, c0 + L - 10, y - A - 40, 'orange', 3);
      arrow(ctx, c0 + L - 10, y - A - 40, c0 + 10, y - A - 40, 'orange', 3);
      label(ctx, (it.items || [])[0] || 'wavelength', c0 + L / 2, y - A - 66, { size: 22, weight: 700, fill: 'orange' });
      const ax = x0 + 24;
      arrow(ctx, ax, y, ax, y - A * Math.sin(-phase) * 0 - A + 6, 'green', 3);
      label(ctx, (it.items || [])[1] || 'amplitude', ax + 14, y - A / 2, { size: 20, weight: 700, fill: 'green', align: 'left' });
      if (it.label) wrapLabel(ctx, it.label, FIG.x, y + A + 70, FIG.w, 22, 'center', 'muted');
      ctx.restore();
    },

    // A simple series circuit: components round a loop, current flowing.
    circuit(b, ctx, it, t) {
      const parts = (it.items || ['cell', 'switch', 'bulb']).slice(0, 6);
      const L = FIG.x + 170; const R = FIG.x + FIG.w - 170; const T = FIG.y + 170; const B = FIG.y + FIG.h - 150;
      const per = 2 * (R - L) + 2 * (B - T);
      const at = (d) => { d = ((d % per) + per) % per; if (d < R - L) return [L + d, T, 0]; d -= R - L; if (d < B - T) return [R, T + d, 1]; d -= B - T; if (d < R - L) return [R - d, B, 0]; d -= R - L; return [L, B - d, 1]; };
      const q = easeOut(clamp(t / 0.8));
      ctx.save();
      ctx.globalAlpha *= q;
      ctx.strokeStyle = 'rgba(220,230,255,0.75)'; ctx.lineWidth = 4;
      rounded(ctx, L, T, R - L, B - T, 6); ctx.stroke();
      // Components sit along the sides, never on a corner.
      const W2 = R - L; const H2 = B - T;
      const top = (f) => W2 * f; const right = (f) => W2 + H2 * f; const bottom = (f) => W2 + H2 + W2 * (1 - f); const left = (f) => 2 * W2 + H2 + H2 * (1 - f);
      const PLACES = [[top(0.5), bottom(0.5)], [top(0.5), bottom(0.5)], [top(0.5), right(0.5), bottom(0.5)], [top(0.3), top(0.7), right(0.5), bottom(0.5)], [top(0.3), top(0.7), right(0.5), bottom(0.5), left(0.5)], [top(0.3), top(0.7), right(0.5), bottom(0.7), bottom(0.3), left(0.5)]];
      const where = PLACES[Math.max(1, parts.length) - 1];
      const slots = parts.map((name, i) => ({ name: String(name).toLowerCase(), d: where[i] }));
      for (const s of slots) {
        const [x, y, vert] = at(s.d);
        ctx.save();
        ctx.translate(x, y);
        if (vert) ctx.rotate(Math.PI / 2);
        ctx.fillStyle = '#0a1024';
        ctx.fillRect(-46, -30, 92, 60);
        ctx.strokeStyle = COLORS.yellow; ctx.fillStyle = COLORS.yellow; ctx.lineWidth = 4;
        const n = s.name;
        if (/battery|cell/.test(n)) { for (const [dx, h] of [[-10, 34], [10, 18]]) { ctx.beginPath(); ctx.moveTo(dx, -h / 2); ctx.lineTo(dx, h / 2); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-46, 0); ctx.lineTo(-10, 0); ctx.moveTo(10, 0); ctx.lineTo(46, 0); ctx.stroke(); }
        else if (/bulb|lamp/.test(n)) { const on = 0.6 + 0.4 * Math.sin(b.clock * 3); glow(ctx, COLORS.yellow, 30 * on); ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-15, -15); ctx.lineTo(15, 15); ctx.moveTo(15, -15); ctx.lineTo(-15, 15); ctx.stroke(); ctx.shadowBlur = 0; ctx.beginPath(); ctx.moveTo(-46, 0); ctx.lineTo(-22, 0); ctx.moveTo(22, 0); ctx.lineTo(46, 0); ctx.stroke(); }
        else if (/resistor/.test(n)) { ctx.strokeRect(-30, -13, 60, 26); ctx.beginPath(); ctx.moveTo(-46, 0); ctx.lineTo(-30, 0); ctx.moveTo(30, 0); ctx.lineTo(46, 0); ctx.stroke(); }
        else if (/switch/.test(n)) { ctx.beginPath(); ctx.moveTo(-46, 0); ctx.lineTo(-20, 0); ctx.lineTo(18, -16); ctx.moveTo(22, 0); ctx.lineTo(46, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(-20, 0, 4, 0, Math.PI * 2); ctx.arc(22, 0, 4, 0, Math.PI * 2); ctx.fill(); }
        else if (/ammeter|voltmeter|motor/.test(n)) { const ch = n.includes('amm') ? 'A' : n.includes('volt') ? 'V' : 'M'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-46, 0); ctx.lineTo(-22, 0); ctx.moveTo(22, 0); ctx.lineTo(46, 0); ctx.stroke(); ctx.rotate(vert ? -Math.PI / 2 : 0); label(ctx, ch, 0, 1, { size: 24, weight: 700, fill: 'yellow' }); }
        else { ctx.strokeRect(-26, -16, 52, 32); ctx.beginPath(); ctx.moveTo(-46, 0); ctx.lineTo(-26, 0); ctx.moveTo(26, 0); ctx.lineTo(46, 0); ctx.stroke(); }
        ctx.restore();
        const out = vert ? (x < cx ? -1 : 1) : 0;
        label(ctx, String(s.name).replace(/^\w/, (c) => c.toUpperCase()), x + out * 80, y + (vert ? 0 : y < cy ? -54 : 56), { size: 21, weight: 600, fill: 'ink', align: out < 0 ? 'right' : out > 0 ? 'left' : 'center' });
      }
      ctx.restore();
      // Current: dots moving round the loop.
      if (t > 0.8) {
        ctx.save();
        glow(ctx, COLORS.cyan, 12);
        ctx.fillStyle = COLORS.cyan;
        for (let k = 0; k < 14; k++) { const [x, y] = at(b.clock * 90 + (k * per) / 14); ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
        if (it.label) wrapLabel(ctx, it.label, FIG.x, B + 90, FIG.w, 21, 'center', 'muted');
      }
    },

    // An atom: the nucleus and electrons circling in their shells.
    atom(b, ctx, it, t) {
      const e = element(it.value) || element(it.center);
      const shells = e?.shells || (it.items || []).map(Number).filter((n) => n > 0).slice(0, 6);
      const R0 = 78; const gap = Math.min(74, 250 / Math.max(1, shells.length));
      const q = outBack(clamp(t / 0.5));
      ctx.save();
      ctx.translate(cx, cy + 10);
      ctx.scale(q, q);
      glow(ctx, COLORS.orange, 26);
      const g = ctx.createRadialGradient(-10, -10, 4, 0, 0, 46);
      g.addColorStop(0, '#ffd29a'); g.addColorStop(1, '#ff7a3d');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, 46, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      label(ctx, e?.sym || it.value || '', 0, 2, { size: 34, weight: 800, fill: '#2a0f00' });
      ctx.restore();
      shells.forEach((n, s) => {
        const lt = t - 0.4 - s * 0.3;
        if (lt < 0) return;
        const r = R0 + (s + 1) * gap;
        const k = easeOut(clamp(lt / 0.5));
        ctx.save();
        ctx.translate(cx, cy + 10);
        ctx.globalAlpha *= k;
        ctx.strokeStyle = 'rgba(140,170,255,0.35)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
        glow(ctx, COLORS.cyan, 12);
        ctx.fillStyle = COLORS.cyan;
        const spin = b.clock * (0.7 / (s + 1));
        for (let j = 0; j < n; j++) { const a = spin + (j / n) * Math.PI * 2; ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 7, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      });
      if (t > 0.6 && (e || shells.length)) {
        ctx.save();
        ctx.globalAlpha *= easeOut(clamp((t - 0.6) / 0.4));
        label(ctx, e ? `${e.name}: ${e.z} electrons` : `${shells.reduce((a, b2) => a + b2, 0)} electrons`, cx, FIG.y + 40, { size: 26, weight: 700, fill: 'ink' });
        label(ctx, shells.join(', '), cx, FIG.y + FIG.h - 20, { size: 24, weight: 700, fill: 'cyan' });
        ctx.restore();
      }
    },

    // A fraction as a pie and a bar: the shaded parts appear one by one.
    fraction(b, ctx, it, t) {
      const m = String(it.value || '').match(/(\d+)\s*\/\s*(\d+)/);
      if (!m) return;
      const n = Math.min(+m[1], 24); const d = Math.max(1, Math.min(+m[2], 24));
      const R = 170; const px = FIG.x + 230; const py = cy;
      for (let i = 0; i < d; i++) {
        const a0 = -Math.PI / 2 + (i / d) * Math.PI * 2; const a1 = a0 + Math.PI * 2 / d;
        const lit = i < n && t > 0.4 + i * 0.25;
        ctx.save();
        ctx.globalAlpha *= easeOut(clamp(t / 0.4));
        if (lit) glow(ctx, COLORS.purple, 14);
        ctx.fillStyle = lit ? tint('purple', 0.6) : 'rgba(255,255,255,0.05)';
        ctx.strokeStyle = 'rgba(220,230,255,0.75)'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, R, a0, a1); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      const bx = FIG.x + 450; const bw = 320; const by = cy - 40; const bh = 80;
      for (let i = 0; i < d; i++) {
        const lit = i < n && t > 0.4 + i * 0.25;
        ctx.save();
        ctx.globalAlpha *= easeOut(clamp(t / 0.4));
        ctx.fillStyle = lit ? tint('cyan', 0.55) : 'rgba(255,255,255,0.05)';
        ctx.strokeStyle = 'rgba(220,230,255,0.75)'; ctx.lineWidth = 2;
        ctx.fillRect(bx + (bw / d) * i, by, bw / d, bh); ctx.strokeRect(bx + (bw / d) * i, by, bw / d, bh);
        ctx.restore();
      }
      if (t > 0.5 + n * 0.25) {
        ctx.save();
        ctx.globalAlpha *= easeOut(clamp((t - 0.5 - n * 0.25) / 0.4));
        label(ctx, String(n), bx + bw / 2, by + bh + 60, { size: 46, weight: 800, fill: 'purple' });
        ctx.fillStyle = COLORS.ink; ctx.fillRect(bx + bw / 2 - 34, by + bh + 92, 68, 4);
        label(ctx, String(d), bx + bw / 2, by + bh + 128, { size: 46, weight: 800, fill: 'cyan' });
        if (it.label) wrapLabel(ctx, it.label, FIG.x, FIG.y + FIG.h - 30, FIG.w, 22, 'center', 'muted');
        ctx.restore();
      }
    },

    // An angle opening from 0 to its size, with its name.
    angle(b, ctx, it, t) {
      const deg = Math.max(0, Math.min(360, num(it.value)));
      if (!Number.isFinite(deg)) return;
      const ox = FIG.x + 200; const oy = FIG.y + FIG.h - 170; const L = 440;
      const now = deg * easeOut(clamp((t - 0.3) / 1.1));
      const r = (d) => (-d * Math.PI) / 180;
      ctx.save();
      ctx.strokeStyle = 'rgba(220,230,255,0.85)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + L, oy); ctx.stroke();
      glow(ctx, COLORS.cyan, 14);
      ctx.strokeStyle = COLORS.cyan;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(r(now)) * L, oy + Math.sin(r(now)) * L); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = tint('orange', 0.25); ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 3;
      if (Math.round(now) === 90 && deg === 90) { ctx.strokeRect(ox, oy - 50, 50, 50); } else { ctx.beginPath(); ctx.moveTo(ox, oy); ctx.arc(ox, oy, 90, 0, r(now), true); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(ox, oy, 90, 0, r(now), true); ctx.stroke(); }
      const mid = r(now / 2);
      label(ctx, `${Math.round(now)}°`, ox + Math.cos(mid) * 140, oy + Math.sin(mid) * 140, { size: 38, weight: 800, fill: 'orange' });
      ctx.restore();
      if (t > 1.4) {
        const kind = deg < 90 ? 'Acute: less than 90°' : deg === 90 ? 'Right angle: exactly 90°' : deg < 180 ? 'Obtuse: between 90° and 180°' : deg === 180 ? 'Straight: 180°' : 'Reflex: more than 180°';
        ctx.save(); ctx.globalAlpha *= easeOut(clamp((t - 1.4) / 0.4));
        label(ctx, it.label || kind, cx, FIG.y + 40, { size: 26, weight: 700, fill: 'ink' });
        ctx.restore();
      }
    },

    // Bodies circling a centre: planets round the Sun, moons round a planet.
    orbits(b, ctx, it, t) {
      const n = it.bodies.length;
      const sx = cx; const sy = cy + 10;
      const q = outBack(clamp(t / 0.5));
      ctx.save();
      ctx.translate(sx, sy); ctx.scale(q, q);
      glow(ctx, COLORS.yellow, 40);
      const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 48);
      g.addColorStop(0, '#fff6c7'); g.addColorStop(1, '#ffb020');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, 44, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
      label(ctx, it.center || 'Sun', sx, sy + 66, { size: 20, weight: 700, fill: 'yellow' });
      it.bodies.forEach((name, i) => {
        const lt = t - 0.4 - i * 0.2;
        if (lt < 0) return;
        const rx = 90 + (i + 1) * (290 / Math.max(1, n)); const ry = rx * 0.62;
        const k = easeOut(clamp(lt / 0.4));
        ctx.save();
        ctx.globalAlpha *= k;
        ctx.strokeStyle = 'rgba(140,170,255,0.28)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
        const a = b.clock * (1.4 / Math.sqrt(i + 1)) * 0.5 + i * 1.7;
        const x = sx + Math.cos(a) * rx; const y = sy + Math.sin(a) * ry;
        const c = color(HUES[i % HUES.length]);
        glow(ctx, c, 14);
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(x, y, 9 + (i % 3) * 2, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        label(ctx, String(name), x, y - 22, { size: 18, weight: 600, fill: 'ink' });
        ctx.restore();
      });
    },

    // A quotation, big, with who said it and when.
    quote(b, ctx, it, t) {
      const q = easeOut(clamp(t / 0.6));
      ctx.save();
      ctx.globalAlpha *= q;
      panel(ctx, FIG.x + 20, FIG.y + 60, FIG.w - 40, FIG.h - 120, 'rgba(167,139,250,0.4)');
      glow(ctx, COLORS.purple, 24);
      label(ctx, '“', FIG.x + 80, FIG.y + 140, { size: 140, weight: 800, fill: 'purple' });
      ctx.shadowBlur = 0;
      ctx.font = `500 34px ${FONT}`;
      const words = String(it.value || '').split(/\s+/);
      const lines = [];
      let line = '';
      for (const w of words) { const next = line ? `${line} ${w}` : w; if (ctx.measureText(next).width > FIG.w - 200 && line) { lines.push(line); line = w; } else line = next; }
      if (line) lines.push(line);
      const shown = Math.ceil(lines.length * clamp((t - 0.3) / 1.2));
      ctx.fillStyle = COLORS.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      lines.slice(0, Math.min(7, shown)).forEach((l, i) => ctx.fillText(l, FIG.x + 110, FIG.y + 190 + i * 48));
      if (t > 1.5 && it.label) label(ctx, `— ${it.label}`, FIG.x + FIG.w - 70, FIG.y + FIG.h - 110, { size: 26, weight: 700, fill: 'cyan', align: 'right' });
      ctx.restore();
    },

    // Counting: dots in rows of five pop in, with the total.
    count(b, ctx, it, t) {
      const n = Math.max(0, Math.min(30, Math.round(num(it.value))));
      const per = 5; const rows = Math.ceil(n / per);
      const s = Math.min(100, (FIG.h - 220) / Math.max(1, rows));
      const top = cy - (rows * s) / 2 - 20;
      for (let i = 0; i < n; i++) {
        const lt = t - 0.2 - i * 0.18;
        if (lt < 0) break;
        const p = outBack(clamp(lt / 0.35));
        const r = Math.floor(i / per); const c = i % per;
        const x = cx - ((per - 1) * s) / 2 + c * s; const y = top + r * s + s / 2;
        const col = color(HUES[r % HUES.length]);
        ctx.save();
        ctx.translate(x, y); ctx.scale(p, p);
        glow(ctx, col, 14);
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(0, 0, s * 0.34, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      const done = t - 0.2 - n * 0.18;
      if (done > 0) {
        ctx.save(); ctx.globalAlpha *= easeOut(clamp(done / 0.4));
        label(ctx, `${n}${it.label ? ` ${it.label}` : ''}`, cx, FIG.y + FIG.h - 50, { size: 40, weight: 800, fill: 'cyan' });
        ctx.restore();
      }
    },

    // An equation as a balance: what is done to one side is done to the other.
    balance(b, ctx, it, t) {
      const tilt = Math.sin(b.clock * 1.6) * 0.02 * clamp(1 - t / 3);
      const px = cx; const py = FIG.y + 230; const arm = 290;
      const q = easeOut(clamp(t / 0.5));
      ctx.save();
      ctx.globalAlpha *= q;
      ctx.strokeStyle = 'rgba(220,230,255,0.85)'; ctx.fillStyle = 'rgba(220,230,255,0.85)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(px - 70, FIG.y + FIG.h - 70); ctx.lineTo(px + 70, FIG.y + FIG.h - 70); ctx.moveTo(px, FIG.y + FIG.h - 70); ctx.lineTo(px, py); ctx.stroke();
      ctx.translate(px, py); ctx.rotate(tilt);
      ctx.beginPath(); ctx.moveTo(-arm, 0); ctx.lineTo(arm, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(12, 8); ctx.lineTo(-12, 8); ctx.closePath(); ctx.fill();
      for (const [side, text, c] of [[-1, it.left, 'blue'], [1, it.right, 'purple']]) {
        const x = side * arm;
        ctx.strokeStyle = 'rgba(220,230,255,0.6)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - 90, 120); ctx.moveTo(x, 0); ctx.lineTo(x + 90, 120); ctx.stroke();
        glow(ctx, color(c), 16);
        ctx.fillStyle = tint(c, 0.28); ctx.strokeStyle = color(c); ctx.lineWidth = 3;
        rounded(ctx, x - 110, 120, 220, 90, 16); ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;
        wrapLabel(ctx, text || '', x - 100, 165, 200, String(text || '').length > 10 ? 26 : 34, 'center', 'ink', 700);
      }
      ctx.restore();
      if (t > 0.6) label(ctx, '=', px, py - 56, { size: 54, weight: 800, fill: 'cyan' });
    },
  };
  return { layout, draw };
}
