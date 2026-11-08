// The board: a canvas that draws a lesson's steps as they are spoken. Each
// item appears at its time on the board clock, and the clock runs only while
// the board plays, so an interruption freezes the picture mid-sentence and a
// resume carries on from there: what you see is a function of the clock.
import { figures } from './figures.js';
import { drawMap } from './map.js';

const W = 1600;
const H = 900;
// A dark holo palette: light ink and neon accents on the glass panel.
export const COLORS = {
  ink: '#e9eeff', muted: '#93a0c4', surface: 'rgba(255,255,255,0.05)', line: 'rgba(140,170,255,0.18)', cyan: '#22d3ee',
  blue: '#5b8cff', orange: '#ff9f43', green: '#34d399', red: '#fb7185', purple: '#a78bfa', yellow: '#fbbf24', teal: '#2dd4bf',
};
// Neon glow for figure strokes.
const glow = (ctx, c, blur = 14) => { ctx.shadowColor = c; ctx.shadowBlur = blur; };
const FIG = { x: 60, y: 120, w: 800, h: 700 };
const COL = { x: 920, y: 150, w: 620 };
const WIDE = { x: 60, y: 150, w: 1480 };
const FONT = 'Lexend, system-ui, sans-serif';
const FIGURES = new Set(['rect', 'tri', 'circle', 'vecgrid', 'vec', 'flow', 'cycle', 'timeline', 'compare', 'bullets', 'bignum', 'parts', 'tree', 'venn', 'bars', 'pyramid', 'map', 'line', 'pie', 'table', 'numberline', 'graph', 'forces', 'wave', 'circuit', 'atom', 'fraction', 'angle', 'orbits', 'quote', 'count', 'balance', 'shape', 'sim', 'cell', 'phscale', 'periodic', 'image', 'video', 'learn']);
// Diagrams that fill the figure area: a second one starts a fresh board.
const BIG = new Set(['flow', 'cycle', 'timeline', 'compare', 'parts', 'tree', 'venn', 'bars', 'pyramid', 'map', 'line', 'pie', 'table', 'numberline', 'graph', 'forces', 'wave', 'circuit', 'atom', 'fraction', 'angle', 'orbits', 'quote', 'count', 'balance', 'shape', 'sim', 'cell', 'phscale', 'periodic', 'image', 'video', 'learn']);
const HUES = ['blue', 'cyan', 'purple', 'teal', 'orange', 'green'];
// Ops laid out in the text flow (the column beside a picture).
const TEXTY = new Set(['text', 'formula', 'note', 'box', 'card', 'question', 'chips', 'facts']);
const GAP = 26;

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const easeOut = (p) => 1 - (1 - p) ** 3;
const outBack = (p) => { const c = 1.6; return 1 + (c + 1) * (p - 1) ** 3 + c * (p - 1) ** 2; };
const color = (c) => COLORS[c] || c || COLORS.ink;
const tint = (c, a) => {
  const hex = color(c).replace('#', '');
  const n = parseInt(hex, 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

export class Board {
  constructor(canvas, { onSfx, onOption, onChip } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.items = [];
    this.clock = 0;
    this.playing = true;
    this.hits = [];
    this.onSfx = onSfx;
    this.onOption = onOption;
    this.onChip = onChip;
    this.reset();
    this.last = performance.now();
    // An answer option is chosen by its number; a chip asks its own words.
    canvas.addEventListener('click', (e) => {
      const i = this.hit(e);
      if (i?.url) window.open(i.url, '_blank', 'noopener,noreferrer'); // a video card
      else if (typeof i === 'string') this.onChip?.(i);
      else if (i != null) this.onOption?.(i);
    });
    canvas.addEventListener('mousemove', (e) => { canvas.style.cursor = this.hit(e) != null ? 'pointer' : ''; });
    requestAnimationFrame(this.frame);
  }

  reset() {
    this.cursor = null;
    this.hasFigure = false;
    this.grid = null;
    this.options = null;
    this.byId = new Map();
  }

  // Adds one op of a step at board time t0 (its other *At times are absolute too).
  add(op, t0) {
    const ctx = this.ctx;
    if (op.op === 'clear') {
      this.items = this.items.filter((it) => it.clearAt == null || it.clearAt > this.clock - 1);
      for (const it of this.items) if (it.clearAt == null) it.clearAt = t0;
      this.reset();
      this.title = null;
      return;
    }
    // Lessons draw a picture per step: the next big diagram, or text that
    // would run off the bottom, turns the page and keeps the title.
    if (BIG.has(op.op) && this.hasFigure) this.turnPage(t0);
    if (op.op === 'grid' || op.op === 'trace') {
      const target = this.byId.get(op.target);
      if (target) target[`${op.op}At`] = t0;
      return;
    }
    const it = { ...op, t0 };
    if (op.id) this.byId.set(op.id, it);
    if (FIGURES.has(op.op) && this.hasFigure && (op.op === 'bullets' || op.op === 'bignum')) {
      // A second visual in the scene: compact, in the text column.
      if (this.cursor == null) { this.zone = COL; this.cursor = COL.y; }
      const n = Math.min(5, (op.items || []).length);
      it.z = { x: COL.x, y: this.cursor, w: COL.w, h: op.op === 'bignum' ? 210 : Math.max(1, n) * 74 };
      this.cursor += it.z.h + GAP;
      layoutFigure(this, it);
    } else if (FIGURES.has(op.op)) {
      if (!this.hasFigure && this.zone === WIDE) this.toColumn();
      this.hasFigure = true;
      layoutFigure(this, it);
    } else if (op.op === 'mark') {
      it.target = this.options;
    } else if (op.op !== 'title') {
      if (this.cursor == null) { this.zone = this.hasFigure ? COL : WIDE; this.cursor = this.zone.y; }
      it.w = this.zone.w;
      it.h = measure(ctx, it);
      if (this.cursor + it.h > H - 30 && this.cursor > this.zone.y && op.op !== 'options') {
        // The column is full: its text gives way, the picture stays.
        for (const old of this.items) if (old.clearAt == null && TEXTY.has(old.op) && old.x === this.zone.x) old.clearAt = t0;
        this.cursor = this.zone.y;
        it.h = measure(ctx, it);
      }
      if (op.op === 'card' && this.cursor + it.h > H - 30) { it.small = true; it.h = measure(ctx, it); }
      it.x = this.zone.x;
      it.y = this.cursor;
      this.cursor += it.h + GAP;
      if (op.op === 'options') this.options = it;
    }
    if (op.op === 'title') this.title = op;
    this.items.push(it);
  }

  // A picture arrived after text: the text moves beside it, into the column.
  toColumn() {
    this.zone = COL;
    this.cursor = COL.y;
    for (const it of this.items) {
      if (it.clearAt != null || !TEXTY.has(it.op)) continue;
      it.x = COL.x;
      it.y = this.cursor;
      it.w = COL.w;
      it.h = measure(this.ctx, it);
      this.cursor += it.h + GAP;
    }
  }

  turnPage(t0) {
    const title = this.title;
    this.add({ op: 'clear' }, t0);
    if (title) this.add({ ...title, at: undefined, quiet: true }, t0);
  }

  frame = (now) => {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    if (this.playing) this.clock += dt;
    requestAnimationFrame(this.frame); // first: a failing frame never stops the board
    this.render();
  };

  render() {
    const { canvas, ctx } = this;
    const dpr = window.devicePixelRatio || 1;
    const cw = Math.round(canvas.clientWidth * dpr);
    const ch = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    // A wide board shows all of it. A squarer one (a phone held upright)
    // zooms onto the figure and its title, and the narration stays in the
    // caption under the board; a page of only text still shows it all.
    const square = cw / ch < 1.45;
    const view = square && this.hasFigure ? { x: 30, y: 30, w: 860, h: 820 } : { x: 0, y: 0, w: W, h: H };
    const k = Math.min(cw / view.w, ch / view.h);
    this.view = { ...view, k, ox: (cw - view.w * k) / 2 - view.x * k, oy: (ch - view.h * k) / 2 - view.y * k, dpr };
    ctx.setTransform(k, 0, 0, k, this.view.ox, this.view.oy);
    ctx.clearRect(-W, -H, W * 3, H * 3); // the glass panel shows through
    this.hits = [];
    for (const it of this.items) {
      const t = this.clock - it.t0;
      if (t < 0) continue;
      let alpha = 1;
      if (it.clearAt != null && this.clock >= it.clearAt) {
        const k = (this.clock - it.clearAt) / 0.25;
        if (k >= 1) continue;
        alpha = 1 - k;
      }
      // Each thing makes its sound as it appears; one that was already
      // there (a resume, a page rebuilt) stays quiet.
      it.beats ||= beats(it);
      while (it.beats.length && t >= it.beats[0].t) {
        const b = it.beats.shift();
        if (t - b.t < 0.3 && alpha === 1) this.onSfx?.(b.name, { pan: b.x / W * 2 - 1, step: b.step });
      }
      if (it.failed) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      // One broken item (a missing field) is left out; the rest still draw.
      try { DRAW[it.op]?.(this, ctx, it, t); } catch (e) { it.failed = true; console.warn('board: could not draw', it.op, e); }
      ctx.restore();
    }
  }

  hit(e) {
    const r = this.canvas.getBoundingClientRect();
    const v = this.view || { k: r.width / W, ox: 0, oy: 0, dpr: 1 };
    const x = (((e.clientX - r.left) * v.dpr) - v.ox) / v.k;
    const y = (((e.clientY - r.top) * v.dpr) - v.oy) / v.k;
    return this.hits.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h)?.i ?? null;
  }
}

// The sounds of an item, as [{ t, name, x, step }] in seconds after it
// appears: a whoosh as a picture slides in, then a pop for each of its rows or
// nodes on the beat the drawing brings them in (the same delays as DRAW), a
// sparkle for a title, a soft tick for a line of text.
const ROWS = { flow: [0, 0.45], cycle: [0.2, 0.35], timeline: [0, 0.4], bullets: [0, 0.4], parts: [0.35, 0.3], tree: [0.4, 0.3], bars: [0, 0.25], facts: [0.2, 0.18], options: [0, 0.18] };
const POPPY = new Set(['note', 'question', 'card', 'box', 'chips', 'bignum']);
function beats(it) {
  if (it.quiet) return [];
  const z = it.z || it;
  const x = (z.x ?? FIG.x) + (z.w ?? FIG.w) / 2;
  if (it.sfx) return [{ t: 0, name: it.sfx, x, step: 0 }];
  if (it.op === 'title') return [{ t: 0, name: 'sparkle', x: W / 2, step: 0 }];
  const out = [];
  if (BIG.has(it.op)) out.push({ t: 0, name: 'whoosh', x, step: 0 });
  if (ROWS[it.op]) {
    const [first, gap] = ROWS[it.op];
    const subs = it.rowsDrawn || it.geo?.nodes || it.geo?.kids || it.rows || it.items || it.pos || [];
    subs.slice(0, 7).forEach((s, i) => out.push({ t: first + i * gap, name: 'pop', x: s?.x ?? x, step: i }));
    if (out.length) return out;
  }
  if (it.op === 'bignum') return [{ t: 0, name: 'sparkle', x, step: 0 }];
  if (POPPY.has(it.op)) return [{ t: 0, name: 'pop', x, step: 2 }];
  if (TEXTY.has(it.op)) return [{ t: 0, name: 'tick', x, step: 0 }];
  if (FIGURES.has(it.op)) out.push({ t: BIG.has(it.op) ? 0.25 : 0, name: 'pop', x, step: 0 });
  return out;
}

function wrap(ctx, text, maxW) {
  const lines = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxW && line) { lines.push(line); line = word; } else line = next;
    }
    lines.push(line);
  }
  return lines;
}

const STYLE = {
  text: { size: 32, weight: 400, color: 'muted' },
  formula: { size: 42, weight: 500, color: 'ink' },
  note: { size: 32, weight: 500, color: 'red' },
  question: { size: 40, weight: 700, color: 'ink' },
};

function measure(ctx, it) {
  const st = STYLE[it.op];
  if (st) {
    ctx.font = `${st.weight} ${st.size}px ${FONT}`;
    it.lines = wrap(ctx, it.text, it.w - (it.op === 'note' ? 28 : 0));
    return it.lines.length * st.size * 1.3;
  }
  if (it.op === 'box') return 96;
  if (it.op === 'colvec') return 140;
  if (it.op === 'options') { it.cw = (it.w - 24) / 2; it.ch = 104; return Math.ceil(it.items.length / 2) * (it.ch + 20) - 20; }
  if (it.op === 'card') {
    const k = it.small ? 0.78 : 1;
    it.qSize = Math.round(36 * k);
    it.aSize = Math.round(32 * k);
    ctx.font = `700 ${it.qSize}px ${FONT}`;
    it.qLines = wrap(ctx, it.q, it.w - 64);
    ctx.font = `400 ${it.aSize}px ${FONT}`;
    it.aLines = wrap(ctx, it.a, it.w - 64);
    return 56 + it.qLines.length * it.qSize * 1.28 + 14 + it.aLines.length * it.aSize * 1.38;
  }
  if (it.op === 'facts') {
    // Key facts: a label column and the values, wrapped.
    it.labelW = 170;
    ctx.font = `500 25px ${FONT}`;
    it.rowsDrawn = (it.rows || []).slice(0, 5).map((r) => { const [k, ...v] = String(r).split(/\s*\|\s*/); return { k, lines: wrap(ctx, v.join(' | '), it.w - 48 - it.labelW).slice(0, 2) }; });
    return 62 + it.rowsDrawn.reduce((h, r) => h + r.lines.length * 32 + 12, 0);
  }
  if (it.op === 'chips') {
    ctx.font = `500 28px ${FONT}`;
    let x = 0;
    let rows = 1;
    it.pos = [];
    for (const label of it.items) {
      const w = Math.min(it.w, ctx.measureText(label).width + 44);
      if (x + w > it.w && x > 0) { if (rows === 4) break; rows++; x = 0; } // at most four rows
      it.pos.push({ label, x, row: rows - 1, w });
      x += w + 14;
    }
    return rows * 64;
  }
  return 40;
}

function layoutFigure(board, it) {
  if (EXTRA.layout[it.op]) return EXTRA.layout[it.op](it);
  const cx = FIG.x + FIG.w / 2;
  const cy = FIG.y + FIG.h / 2;
  if (it.op === 'rect') {
    const s = Math.min((FIG.w * 0.72) / it.l, (FIG.h * 0.58) / it.w);
    const w = Math.max(60, it.l * s);
    const h = Math.max(50, it.w * s);
    it.geo = { x: cx - w / 2, y: cy - h / 2 - 10, w, h };
  } else if (it.op === 'tri') {
    const s = Math.min((FIG.w * 0.7) / it.b, (FIG.h * 0.56) / it.h);
    const bw = Math.max(80, it.b * s);
    const hh = Math.max(60, it.h * s);
    const base = cy + hh / 2;
    it.geo = { x0: cx - bw / 2, x1: cx + bw / 2, y: base, ax: cx - bw / 2 + bw * 0.36, ay: base - hh };
  } else if (it.op === 'circle') {
    it.geo = { cx, cy: cy - 10, R: Math.min(FIG.w, FIG.h) * 0.33 };
  } else if (it.op === 'vecgrid') {
    const cell = Math.min(FIG.w, FIG.h - 40) / (2 * it.range + 1);
    board.grid = { ox: cx, oy: cy, cell, R: it.range };
    it.geo = board.grid;
  } else if (it.op === 'vec') {
    it.geo = board.grid || { ox: cx, oy: cy, cell: 60, R: 5 };
  } else if (it.op === 'flow' || it.op === 'bullets' || it.op === 'timeline') {
    it.z ||= FIG;
    const items = (it.items || []).slice(0, it.op === 'timeline' ? 6 : 5);
    const gap = it.op === 'flow' ? 44 : it.z === FIG ? 22 : 8;
    const h = Math.min(it.op === 'flow' ? 112 : it.z === FIG ? 104 : 66, (it.z.h - (it.z === FIG ? 40 : 0) - gap * (items.length - 1)) / Math.max(1, items.length));
    const top = it.z === FIG ? cy - (items.length * h + gap * (items.length - 1)) / 2 : it.z.y;
    it.rows = items.map((text, i) => ({ text, y: top + i * (h + gap), h }));
  } else if (it.op === 'bignum') {
    it.z ||= FIG;
  } else if (it.op === 'parts') {
    const items = (it.items || []).slice(0, 6);
    it.geo = { cx, cy: cy + 10, nodes: items.map((text, i) => { const a = -Math.PI / 2 + ((i + 0.5) / items.length) * Math.PI * 2; return { text, a, x: cx + Math.cos(a) * 265, y: cy + 10 + Math.sin(a) * 235 }; }) };
  } else if (it.op === 'tree') {
    const items = (it.items || []).slice(0, 4);
    const gap = 20;
    const w = (FIG.w - gap * (items.length - 1)) / Math.max(1, items.length);
    it.geo = { root: { x: cx, y: FIG.y + 90 }, kids: items.map((text, i) => ({ text, x: FIG.x + i * (w + gap), y: FIG.y + 300, w })) };
  } else if (it.op === 'bars') {
    const rows = (it.items || []).slice(0, 6).map((s) => {
      const m = String(s).match(/^(.*?)[:\s]+([-\d.,]+)\s*(%|°|[a-zA-Z]{0,12})\s*$/);
      return m ? { text: m[1].trim(), value: Number(m[2].replace(/,/g, '')), unit: m[3] || '' } : null;
    }).filter((r) => r && Number.isFinite(r.value));
    const max = Math.max(1e-9, ...rows.map((r) => Math.abs(r.value)));
    const h = Math.min(90, (FIG.h - 120) / Math.max(1, rows.length));
    const top = cy - (rows.length * h) / 2;
    it.rows = rows.map((r, i) => ({ ...r, k: Math.abs(r.value) / max, y: top + i * h, h }));
  } else if (it.op === 'pyramid') {
    const items = (it.items || []).slice(0, 5);
    const n = Math.max(1, items.length);
    const h = Math.min(130, (FIG.h - 80) / n);
    const top = cy - (n * h) / 2;
    const wOf = (y) => 200 + ((y - top) / (n * h)) * 560;
    it.rows = items.map((text, i) => ({ text, y: top + i * h, h, w0: wOf(top + i * h), w1: wOf(top + (i + 1) * h) }));
  } else if (it.op === 'cycle') {
    const items = (it.items || []).slice(0, 6);
    const R = Math.min(FIG.w, FIG.h) * 0.36;
    it.geo = { cx, cy, R, nodes: items.map((text, i) => { const a = -Math.PI / 2 + (i / items.length) * Math.PI * 2; return { text, a, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R }; }) };
  }
}

function label(ctx, text, x, y, { size = 30, weight = 600, fill = 'ink', align = 'center', base = 'middle' } = {}) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  ctx.fillStyle = color(fill);
  ctx.fillText(text, x, y);
}

// Text wrapped to a width, up to two lines, vertically centred on y.
function wrapLabel(ctx, text, x, y, maxW, size = 28, align = 'left', fill = 'ink', weight = 500) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  let lines = wrap(ctx, String(text), maxW);
  if (lines.length > 2) { lines = lines.slice(0, 2); lines[1] = `${lines[1].replace(/\s+\S*$/, '')}…`; }
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color(fill);
  const lh = size * 1.25;
  const ax = align === 'center' ? x + maxW / 2 : x;
  lines.forEach((l, i) => ctx.fillText(l, ax, y + (i - (lines.length - 1) / 2) * lh));
}

function rounded(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function enter(ctx, t, dur = 0.4, rise = 14) {
  const p = easeOut(clamp(t / dur));
  ctx.globalAlpha *= p;
  ctx.translate(0, (1 - p) * rise);
  return p;
}

function textBlock(it, ctx, t) {
  const st = STYLE[it.op];
  enter(ctx, t);
  if (it.op === 'note') {
    ctx.fillStyle = tint(it.color || 'red', 0.1);
    rounded(ctx, it.x, it.y - 8, it.w, it.h + 16, 12);
    ctx.fill();
    ctx.fillStyle = color(it.color || 'red');
    ctx.fillRect(it.x, it.y - 8, 8, it.h + 16);
  }
  ctx.font = `${st.weight} ${st.size}px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = color(it.op === 'note' ? 'ink' : it.color || st.color);
  it.lines.forEach((line, i) => ctx.fillText(line, it.x + (it.op === 'note' ? 24 : 0), it.y + i * st.size * 1.3));
}

function arrow(ctx, x0, y0, x1, y1, c, width = 7) {
  const a = Math.atan2(y1 - y0, x1 - x0);
  const len = Math.hypot(x1 - x0, y1 - y0);
  const head = Math.min(26, len * 0.45);
  ctx.strokeStyle = color(c);
  ctx.fillStyle = color(c);
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1 - Math.cos(a) * head * 0.7, y1 - Math.sin(a) * head * 0.7);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - Math.cos(a - 0.42) * head, y1 - Math.sin(a - 0.42) * head);
  ctx.lineTo(x1 - Math.cos(a + 0.42) * head, y1 - Math.sin(a + 0.42) * head);
  ctx.closePath();
  ctx.fill();
}

function colvec(ctx, x, y, v, c, size = 44) {
  const [a, b] = v.map((n) => (n < 0 ? `−${-n}` : String(n)));
  ctx.font = `600 ${size}px ${FONT}`;
  const w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width) + 28;
  const h = size * 2.3;
  ctx.strokeStyle = color(c);
  ctx.lineWidth = 4;
  for (const side of [0, 1]) {
    const bx = side ? x + w : x;
    const d = side ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(bx + d * 12, y - h / 2);
    ctx.quadraticCurveTo(bx - d * 6, y, bx + d * 12, y + h / 2);
    ctx.stroke();
  }
  label(ctx, a, x + w / 2, y - size * 0.55, { size, fill: c });
  label(ctx, b, x + w / 2, y + size * 0.6, { size, fill: c });
  return w;
}

const DRAW = {
  title(b, ctx, it, t) {
    enter(ctx, t, 0.4, 10);
    label(ctx, it.text, 60, 74, { size: 40, weight: 700, align: 'left' });
    glow(ctx, COLORS.cyan, 12);
    ctx.fillStyle = COLORS.cyan;
    ctx.fillRect(60, 102, 72, 6);
  },
  text: (b, ctx, it, t) => textBlock(it, ctx, t),
  formula: (b, ctx, it, t) => textBlock(it, ctx, t),
  note: (b, ctx, it, t) => textBlock(it, ctx, t),
  question: (b, ctx, it, t) => textBlock(it, ctx, t),

  box(b, ctx, it, t) {
    const p = clamp(t / 0.5);
    ctx.font = `700 46px ${FONT}`;
    const w = Math.min(it.w, ctx.measureText(it.text).width + 64);
    ctx.globalAlpha *= clamp(p * 3);
    ctx.translate(it.x + w / 2, it.y + 48);
    ctx.scale(0.85 + 0.15 * outBack(p), 0.85 + 0.15 * outBack(p));
    ctx.fillStyle = COLORS.green;
    rounded(ctx, -w / 2, -48, w, 96, 18);
    ctx.fill();
    label(ctx, it.text, 0, 2, { size: 46, weight: 700, fill: '#ffffff' });
  },

  colvec(b, ctx, it, t) {
    enter(ctx, t);
    const name = `${it.name} =`;
    label(ctx, name, it.x, it.y + 70, { size: 40, weight: 700, fill: it.color, align: 'left' });
    ctx.font = `700 40px ${FONT}`;
    colvec(ctx, it.x + ctx.measureText(name).width + 18, it.y + 70, it.v, it.color);
  },

  // "At a glance": a few key facts beside the answer, row by row.
  facts(b, ctx, it, t) {
    enter(ctx, t, 0.45);
    ctx.fillStyle = 'rgba(34,211,238,0.06)';
    ctx.strokeStyle = 'rgba(34,211,238,0.35)';
    ctx.lineWidth = 2;
    rounded(ctx, it.x, it.y, it.w, it.h, 18);
    ctx.fill();
    ctx.stroke();
    label(ctx, it.title || 'At a glance', it.x + 24, it.y + 30, { size: 22, weight: 700, fill: 'cyan', align: 'left' });
    let y = it.y + 62;
    it.rowsDrawn.forEach((r, i) => {
      const q = clamp((t - 0.2 - i * 0.18) / 0.35);
      ctx.save();
      ctx.globalAlpha *= easeOut(q);
      label(ctx, r.k, it.x + 24, y + 14, { size: 21, weight: 600, fill: 'muted', align: 'left' });
      r.lines.forEach((l, j) => label(ctx, l, it.x + 24 + it.labelW, y + 14 + j * 32, { size: 25, weight: 500, fill: 'ink', align: 'left' }));
      ctx.restore();
      y += r.lines.length * 32 + 12;
    });
  },

  card(b, ctx, it, t) {
    enter(ctx, t, 0.45);
    ctx.fillStyle = COLORS.surface;
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2;
    rounded(ctx, it.x, it.y, it.w, it.h, 20);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `700 ${it.qSize}px ${FONT}`;
    ctx.fillStyle = COLORS.cyan;
    it.qLines.forEach((l, i) => ctx.fillText(l, it.x + 32, it.y + 28 + i * it.qSize * 1.28));
    ctx.font = `400 ${it.aSize}px ${FONT}`;
    ctx.fillStyle = COLORS.ink;
    const top = it.y + 28 + it.qLines.length * it.qSize * 1.28 + 14;
    it.aLines.forEach((l, i) => ctx.fillText(l, it.x + 32, top + i * it.aSize * 1.38));
  },

  chips(b, ctx, it, t) {
    it.pos.forEach((p, i) => {
      const lt = t - i * 0.15;
      if (lt < 0) return;
      ctx.save();
      enter(ctx, lt, 0.35, 10);
      const x = it.x + p.x;
      const y = it.y + p.row * 64;
      b.hits.push({ i: p.label, x, y, w: p.w, h: 50 });
      ctx.fillStyle = tint('blue', 0.1);
      rounded(ctx, x, y, p.w, 50, 25);
      ctx.fill();
      label(ctx, p.label, x + p.w / 2, y + 26, { size: 28, weight: 500, fill: 'blue' });
      ctx.restore();
    });
  },

  options(b, ctx, it, t) {
    it.items.forEach((o, i) => {
      const lt = t - i * 0.18;
      if (lt < 0) return;
      const x = it.x + (i % 2) * (it.cw + 24);
      const y = it.y + Math.floor(i / 2) * (it.ch + 20);
      b.hits.push({ i, x, y, w: it.cw, h: it.ch });
      ctx.save();
      const p = easeOut(clamp(lt / 0.35));
      ctx.globalAlpha *= p;
      ctx.translate(x + it.cw / 2, y + it.ch / 2);
      ctx.scale(0.94 + 0.06 * p, 0.94 + 0.06 * p);
      ctx.translate(-it.cw / 2, -it.ch / 2);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.strokeStyle = 'rgba(140,170,255,0.28)';
      ctx.lineWidth = 2;
      rounded(ctx, 0, 0, it.cw, it.ch, 18);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = COLORS.blue;
      ctx.beginPath();
      ctx.arc(46, it.ch / 2, 24, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, 'ABCD'[i], 46, it.ch / 2 + 1, { size: 26, weight: 700, fill: '#ffffff' });
      if (o.col) colvec(ctx, 100, it.ch / 2, o.col, 'ink', 26);
      else label(ctx, o.show, 92, it.ch / 2 + 1, { size: o.show.length > 14 ? 30 : 36, weight: 600, align: 'left' });
      ctx.restore();
    });
  },

  mark(b, ctx, it, t) {
    const o = it.target;
    if (!o) return;
    const x = o.x + (it.option % 2) * (o.cw + 24);
    const y = o.y + Math.floor(it.option / 2) * (o.ch + 20);
    const p = easeOut(clamp(t / 0.35));
    const c = it.kind === 'tick' ? COLORS.green : COLORS.red;
    ctx.globalAlpha *= p;
    if (it.kind === 'cross') { ctx.fillStyle = 'rgba(5,8,20,0.55)'; rounded(ctx, x, y, o.cw, o.ch, 18); ctx.fill(); }
    ctx.strokeStyle = c;
    ctx.lineWidth = 6;
    rounded(ctx, x - 3, y - 3, o.cw + 6, o.ch + 6, 20);
    ctx.stroke();
    const bx = x + o.cw - 6;
    const by = y + 6;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(bx, by, 24 * (0.8 + 0.2 * outBack(p)), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (it.kind === 'tick') { ctx.moveTo(bx - 10, by + 1); ctx.lineTo(bx - 3, by + 8); ctx.lineTo(bx + 11, by - 8); } else { ctx.moveTo(bx - 8, by - 8); ctx.lineTo(bx + 8, by + 8); ctx.moveTo(bx + 8, by - 8); ctx.lineTo(bx - 8, by + 8); }
    ctx.stroke();
  },

  rect(b, ctx, it, t) {
    const { x, y, w, h } = it.geo;
    const p = easeOut(clamp(t / 0.9));
    ctx.fillStyle = tint('blue', 0.08 * p);
    ctx.fillRect(x, y, w, h);
    if (it.gridAt != null && b.clock >= it.gridAt) {
      const g = easeOut(clamp((b.clock - it.gridAt) / 1.1));
      const nx = Number.isInteger(it.l) && it.l <= 30 ? it.l : 10;
      const ny = Number.isInteger(it.w) && it.w <= 30 ? it.w : 10;
      ctx.fillStyle = tint('blue', 0.12);
      ctx.fillRect(x, y, w * g, h);
      ctx.strokeStyle = tint('blue', 0.35);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 1; i < nx; i++) if (i / nx <= g) { ctx.moveTo(x + (w * i) / nx, y); ctx.lineTo(x + (w * i) / nx, y + h); }
      for (let j = 1; j < ny; j++) { ctx.moveTo(x, y + (h * j) / ny); ctx.lineTo(x + w * g, y + (h * j) / ny); }
      ctx.stroke();
    }
    const L = 2 * (w + h);
    ctx.strokeStyle = COLORS.blue;
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.setLineDash([L * p, L]);
    glow(ctx, COLORS.blue);
    ctx.strokeRect(x, y, w, h);
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
    if (it.traceAt != null && b.clock >= it.traceAt) {
      const q = clamp((b.clock - it.traceAt) / 1.4);
      ctx.strokeStyle = COLORS.orange;
      ctx.lineWidth = 11;
      ctx.lineCap = 'round';
      ctx.setLineDash([L * q, L]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }
    if (p > 0.6 && it.labels) {
      ctx.globalAlpha *= clamp((p - 0.6) / 0.4);
      if (it.labels.bottom) label(ctx, it.labels.bottom, x + w / 2, y + h + 34, { size: 32 });
      if (it.labels.right) label(ctx, it.labels.right, x + w + 18, y + h / 2, { size: 32, align: 'left' });
    }
  },

  tri(b, ctx, it, t) {
    const { x0, x1, y, ax, ay } = it.geo;
    const p = easeOut(clamp(t / 0.9));
    ctx.fillStyle = tint('blue', 0.1 * p);
    ctx.beginPath();
    ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.lineTo(ax, ay); ctx.closePath();
    ctx.fill();
    const L = (x1 - x0) + Math.hypot(x1 - ax, y - ay) + Math.hypot(ax - x0, y - ay);
    ctx.strokeStyle = COLORS.blue;
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.setLineDash([L * p, L]);
    glow(ctx, COLORS.blue);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
    const hAt = it.heightAt ?? (it.t0 + 0.6);
    if (b.clock >= hAt) {
      const q = easeOut(clamp((b.clock - hAt) / 0.6));
      ctx.strokeStyle = COLORS.orange;
      ctx.lineWidth = 5;
      ctx.setLineDash([14, 10]);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + (y - ay) * q); ctx.stroke();
      ctx.setLineDash([]);
      if (q >= 1) {
        ctx.lineWidth = 3;
        ctx.strokeRect(ax, y - 22, 22, 22);
        if (it.labels?.height) label(ctx, it.labels.height, ax - 16, (ay + y) / 2, { size: 30, fill: 'orange', align: 'right' });
      }
    }
    if (p > 0.6 && it.labels?.base) label(ctx, it.labels.base, (x0 + x1) / 2, y + 34, { size: 32 });
  },

  circle(b, ctx, it, t) {
    const { cx, cy, R } = it.geo;
    const p = easeOut(clamp(t / 0.9));
    ctx.fillStyle = tint('blue', 0.08 * p);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    if (it.gridAt != null && b.clock >= it.gridAt) {
      const g = easeOut(clamp((b.clock - it.gridAt) / 1));
      ctx.fillStyle = tint('blue', 0.16);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + g * Math.PI * 2); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = COLORS.blue;
    ctx.lineWidth = 6;
    glow(ctx, COLORS.blue);
    ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
    if (it.traceAt != null && b.clock >= it.traceAt) {
      const q = clamp((b.clock - it.traceAt) / 1.4);
      ctx.strokeStyle = COLORS.orange;
      ctx.lineWidth = 11;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + q * Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
    if (it.diameterAt != null && b.clock >= it.diameterAt) {
      const q = easeOut(clamp((b.clock - it.diameterAt) / 0.6));
      ctx.strokeStyle = COLORS.purple;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx - R + 2 * R * q, cy); ctx.stroke();
      if (q >= 1 && it.labels?.d) label(ctx, it.labels.d, cx, cy + 36, { size: 30, fill: 'purple' });
    }
    if (it.radiusAt != null && b.clock >= it.radiusAt) {
      const q = easeOut(clamp((b.clock - it.radiusAt) / 0.6));
      const a = -0.75;
      ctx.strokeStyle = COLORS.orange;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R * q, cy + Math.sin(a) * R * q); ctx.stroke();
      if (q >= 1 && it.labels?.r) label(ctx, it.labels.r, cx + Math.cos(a) * (R + 18), cy + Math.sin(a) * (R + 18), { size: 30, fill: 'orange', align: 'left' });
    }
  },

  vecgrid(b, ctx, it, t) {
    const { ox, oy, cell, R } = it.geo;
    ctx.globalAlpha *= easeOut(clamp(t / 0.6));
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = COLORS.line;
    ctx.beginPath();
    for (let i = -R; i <= R; i++) {
      ctx.moveTo(ox + i * cell, oy - R * cell); ctx.lineTo(ox + i * cell, oy + R * cell);
      ctx.moveTo(ox - R * cell, oy + i * cell); ctx.lineTo(ox + R * cell, oy + i * cell);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(170,190,255,0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(ox - R * cell, oy); ctx.lineTo(ox + R * cell, oy);
    ctx.moveTo(ox, oy - R * cell); ctx.lineTo(ox, oy + R * cell);
    ctx.stroke();
  },

  vec(b, ctx, it, t) {
    const { ox, oy, cell } = it.geo;
    const p = easeOut(clamp(t / 0.8));
    const x0 = ox + it.from[0] * cell;
    const y0 = oy - it.from[1] * cell;
    const x1 = x0 + it.v[0] * cell * p;
    const y1 = y0 - it.v[1] * cell * p;
    if (p < 0.02) return;
    if (it.dashed) ctx.setLineDash([14, 10]);
    glow(ctx, color(it.color || 'blue'), 12);
    arrow(ctx, x0, y0, x1, y1, it.color || 'blue');
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
    if (it.label && p > 0.8) {
      const len = Math.hypot(x1 - x0, y1 - y0) || 1;
      const nx = -(y1 - y0) / len;
      const ny = (x1 - x0) / len;
      label(ctx, it.label, (x0 + x1) / 2 + nx * 30, (y0 + y1) / 2 + ny * 30, { size: 30, weight: 700, fill: it.color || 'blue' });
    }
  },

  // A process, in order: boxes top to bottom with arrows between them.
  flow(b, ctx, it, t) {
    const x = FIG.x + 90;
    const w = FIG.w - 180;
    const hues = ['blue', 'cyan', 'purple', 'teal', 'orange'];
    it.rows.forEach((r, i) => {
      const lt = t - i * 0.45;
      if (lt < 0) return;
      const p = easeOut(clamp(lt / 0.45));
      ctx.save();
      ctx.globalAlpha *= p;
      ctx.translate(0, (1 - p) * 16);
      const c = color(hues[i % hues.length]);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.strokeStyle = c;
      ctx.lineWidth = 2.5;
      glow(ctx, c, 10);
      rounded(ctx, x, r.y, w, r.h, 16);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(x + 34, r.y + r.h / 2, 16, 0, Math.PI * 2); ctx.fill();
      label(ctx, String(i + 1), x + 34, r.y + r.h / 2 + 1, { size: 20, weight: 700, fill: '#050816' });
      wrapLabel(ctx, r.text, x + 66, r.y + r.h / 2, w - 86, Math.min(30, r.h / 2.6));
      if (i < it.rows.length - 1 && p > 0.6) {
        const ay = r.y + r.h + 6;
        arrow(ctx, x + w / 2, ay, x + w / 2, ay + 32, c, 4);
      }
      ctx.restore();
    });
  },

  // Stages that repeat: nodes round a circle, a dot travelling the loop.
  cycle(b, ctx, it, t) {
    const { cx, cy, R, nodes } = it.geo;
    const p = easeOut(clamp(t / 1));
    ctx.save();
    ctx.globalAlpha *= p;
    ctx.strokeStyle = 'rgba(140,170,255,0.25)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 12]);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    const a = -Math.PI / 2 + ((b.clock * 0.35) % 1) * Math.PI * 2;
    glow(ctx, COLORS.cyan, 18);
    ctx.fillStyle = COLORS.cyan;
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 9, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    nodes.forEach((n, i) => {
      const lt = t - 0.2 - i * 0.35;
      if (lt < 0) return;
      const q = easeOut(clamp(lt / 0.4));
      const w = 290;
      const h = 96;
      ctx.save();
      ctx.globalAlpha *= q;
      ctx.translate(n.x, n.y);
      ctx.scale(0.9 + 0.1 * q, 0.9 + 0.1 * q);
      const c = color(['blue', 'cyan', 'purple', 'teal', 'orange', 'green'][i % 6]);
      ctx.fillStyle = 'rgba(10,16,34,0.92)';
      ctx.strokeStyle = c;
      ctx.lineWidth = 2.5;
      glow(ctx, c, 12);
      rounded(ctx, -w / 2, -h / 2, w, h, 18);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      wrapLabel(ctx, n.text, -w / 2 + 16, 0, w - 32, 27, 'center');
      ctx.restore();
    });
  },

  // Dated events down a glowing line: "when: what".
  timeline(b, ctx, it, t) {
    const x = FIG.x + 110;
    const first = it.rows[0];
    const last = it.rows[it.rows.length - 1];
    if (!first) return;
    const p = easeOut(clamp(t / 1.2));
    ctx.save();
    glow(ctx, COLORS.blue, 10);
    ctx.strokeStyle = COLORS.blue;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x, first.y + first.h / 2); ctx.lineTo(x, first.y + first.h / 2 + (last.y - first.y) * p); ctx.stroke();
    ctx.restore();
    it.rows.forEach((r, i) => {
      const lt = t - i * 0.4;
      if (lt < 0) return;
      const q = easeOut(clamp(lt / 0.4));
      const [when, ...rest] = String(r.text).split(/:\s+|\s+[-–]\s+/);
      const what = rest.join(' ') || '';
      ctx.save();
      ctx.globalAlpha *= q;
      glow(ctx, COLORS.cyan, 14);
      ctx.fillStyle = COLORS.cyan;
      ctx.beginPath(); ctx.arc(x, r.y + r.h / 2, 11 * q, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      label(ctx, what ? when : '', x + 34, r.y + r.h / 2 - (what ? 16 : 0), { size: 26, weight: 700, fill: 'cyan', align: 'left' });
      wrapLabel(ctx, what || when, x + 34, r.y + r.h / 2 + (what ? 16 : 0), FIG.w - 200, 25);
      ctx.restore();
    });
  },

  // Two sides: a column each, "vs" between.
  compare(b, ctx, it, t) {
    const colW = (FIG.w - 60) / 2;
    const n = Math.max(1, (it.a || []).length, (it.b || []).length);
    const h = Math.min(FIG.h - 80, 150 + Math.min(4, n) * 110);
    const top = FIG.y + (FIG.h - h) / 2;
    [[it.left, it.a || [], 'blue', 0], [it.right, it.b || [], 'purple', 1]].forEach(([title, items, c, k]) => {
      const lt = t - k * 0.35;
      if (lt < 0) return;
      const q = easeOut(clamp(lt / 0.5));
      const x = FIG.x + k * (colW + 60);
      ctx.save();
      ctx.globalAlpha *= q;
      ctx.translate(0, (1 - q) * 18);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.strokeStyle = color(c);
      ctx.lineWidth = 2.5;
      glow(ctx, color(c), 12);
      rounded(ctx, x, top, colW, h, 20);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      wrapLabel(ctx, title || '', x + 22, top + 44, colW - 44, 30, 'left', c, 700);
      items.slice(0, 4).forEach((text, j) => {
        const y = top + 130 + j * 110;
        ctx.fillStyle = color(c);
        ctx.beginPath(); ctx.arc(x + 30, y, 6, 0, Math.PI * 2); ctx.fill();
        wrapLabel(ctx, text, x + 48, y, colW - 70, 24);
      });
      ctx.restore();
    });
    if (t > 0.3) {
      ctx.save();
      ctx.globalAlpha *= easeOut(clamp((t - 0.3) / 0.4));
      ctx.fillStyle = '#050816';
      ctx.strokeStyle = COLORS.cyan;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(FIG.x + colW + 30, top + h / 2, 28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      label(ctx, 'vs', FIG.x + colW + 30, top + h / 2 + 1, { size: 22, weight: 700, fill: 'cyan' });
      ctx.restore();
    }
  },

  // Short points with glowing markers.
  bullets(b, ctx, it, t) {
    it.rows.forEach((r, i) => {
      const lt = t - i * 0.4;
      if (lt < 0) return;
      const q = easeOut(clamp(lt / 0.4));
      ctx.save();
      ctx.globalAlpha *= q;
      ctx.translate((1 - q) * -18, 0);
      const c = color(['cyan', 'blue', 'purple', 'teal', 'orange'][i % 5]);
      const z = it.z;
      const inset = z === FIG ? 50 : 12;
      glow(ctx, c, 14);
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(z.x + inset, r.y + r.h / 2, z === FIG ? 10 : 8, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      wrapLabel(ctx, r.text, z.x + inset + 28, r.y + r.h / 2, z.w - inset - 40, z === FIG ? 30 : 27);
      ctx.restore();
    });
  },

  // A labelled diagram: the thing in the middle, its parts round it.
  parts(b, ctx, it, t) {
    const { cx, cy, nodes } = it.geo;
    const p = outBack(clamp(t / 0.5));
    ctx.save();
    ctx.globalAlpha *= clamp(t / 0.3);
    ctx.translate(cx, cy);
    ctx.scale(p, p);
    glow(ctx, COLORS.cyan, 26);
    ctx.fillStyle = 'rgba(34,211,238,0.12)';
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 112, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    wrapLabel(ctx, it.center || '', -96, 0, 192, 28, 'center', 'ink', 700);
    ctx.restore();
    nodes.forEach((n, i) => {
      const lt = t - 0.35 - i * 0.3;
      if (lt < 0) return;
      const q = easeOut(clamp(lt / 0.4));
      const c = color(HUES[i % HUES.length]);
      const x0 = cx + Math.cos(n.a) * 116;
      const y0 = cy + Math.sin(n.a) * 116;
      ctx.save();
      ctx.strokeStyle = c;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha *= 0.8;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + (n.x - x0) * q, y0 + (n.y - y0) * q); ctx.stroke();
      ctx.restore();
      if (q < 0.5) return;
      ctx.save();
      ctx.globalAlpha *= (q - 0.5) * 2;
      const w = 250;
      const h = 86;
      ctx.fillStyle = 'rgba(10,16,34,0.94)';
      ctx.strokeStyle = c;
      ctx.lineWidth = 2.5;
      glow(ctx, c, 12);
      rounded(ctx, n.x - w / 2, n.y - h / 2, w, h, 16);
      ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      wrapLabel(ctx, n.text, n.x - w / 2 + 10, n.y, w - 20, n.text.length > 30 ? 21 : 24, 'center');
      ctx.restore();
    });
  },

  // Kinds of something: the whole at the top, its branches below.
  tree(b, ctx, it, t) {
    const { root, kids } = it.geo;
    const q0 = easeOut(clamp(t / 0.4));
    ctx.save();
    ctx.globalAlpha *= q0;
    ctx.fillStyle = 'rgba(34,211,238,0.12)';
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 3;
    glow(ctx, COLORS.cyan, 18);
    rounded(ctx, root.x - 190, root.y - 46, 380, 92, 20);
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    wrapLabel(ctx, it.root || '', root.x - 175, root.y, 350, 30, 'center', 'ink', 700);
    ctx.restore();
    kids.forEach((k, i) => {
      const lt = t - 0.4 - i * 0.3;
      if (lt < 0) return;
      const q = easeOut(clamp(lt / 0.45));
      const c = color(HUES[i % HUES.length]);
      const kx = k.x + k.w / 2;
      const mid = root.y + 46 + 60;
      ctx.save();
      ctx.strokeStyle = c;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(root.x, root.y + 46);
      ctx.lineTo(root.x, mid);
      ctx.lineTo(root.x + (kx - root.x) * q, mid);
      if (q > 0.95) ctx.lineTo(kx, k.y);
      ctx.stroke();
      ctx.restore();
      if (q < 0.6) return;
      const [head, ...rest] = String(k.text).split(/:\s+/);
      ctx.save();
      ctx.globalAlpha *= (q - 0.6) / 0.4;
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.strokeStyle = c;
      ctx.lineWidth = 2.5;
      glow(ctx, c, 12);
      rounded(ctx, k.x, k.y, k.w, rest.length ? 200 : 120, 18);
      ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      wrapLabel(ctx, head, k.x + 12, k.y + 46, k.w - 24, kids.length > 3 ? 24 : 27, 'center', rest.length ? c : 'ink', 700);
      if (rest.length) wrapLabel(ctx, rest.join(': '), k.x + 12, k.y + 132, k.w - 24, kids.length > 3 ? 21 : 23, 'center', 'muted');
      ctx.restore();
    });
  },

  // Two overlapping sets: what is only in each, and what they share.
  venn(b, ctx, it, t) {
    const cx = FIG.x + FIG.w / 2;
    const cy = FIG.y + FIG.h / 2 + 30;
    const r = 235;
    const sides = [[-140, it.left, it.a || [], 'blue'], [140, it.right, it.b || [], 'purple']];
    sides.forEach(([dx, title, items, c], k) => {
      const lt = t - k * 0.35;
      if (lt < 0) return;
      const q = easeOut(clamp(lt / 0.5));
      ctx.save();
      ctx.globalAlpha *= q;
      ctx.fillStyle = tint(c, 0.12);
      ctx.strokeStyle = color(c);
      ctx.lineWidth = 3;
      glow(ctx, color(c), 16);
      ctx.beginPath(); ctx.arc(cx + dx, cy, r * (0.85 + 0.15 * q), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      label(ctx, title || '', cx + dx * 1.15, cy - r - 26, { size: 30, weight: 700, fill: c });
      items.slice(0, 3).forEach((text, j) => wrapLabel(ctx, text, cx + dx * 1.62 - 105, cy - 80 + j * 80, 210, 22, 'center'));
      ctx.restore();
    });
    const both = it.both || [];
    if (t > 0.9 && both.length) {
      ctx.save();
      ctx.globalAlpha *= easeOut(clamp((t - 0.9) / 0.4));
      label(ctx, 'both', cx, cy - 130, { size: 22, weight: 700, fill: 'cyan' });
      both.slice(0, 3).forEach((text, j) => wrapLabel(ctx, text, cx - 78, cy - 70 + j * 76, 156, 21, 'center'));
      ctx.restore();
    }
  },

  // Numbers side by side: bars that grow to their size.
  bars(b, ctx, it, t) {
    const x = FIG.x + 20;
    const labelW = 250;
    const maxW = FIG.w - labelW - 150;
    it.rows.forEach((r, i) => {
      const lt = t - i * 0.25;
      if (lt < 0) return;
      const q = easeOut(clamp(lt / 0.8));
      const c = color(HUES[i % HUES.length]);
      const bh = r.h * 0.56;
      const by = r.y + (r.h - bh) / 2;
      ctx.save();
      ctx.globalAlpha *= clamp(lt / 0.3);
      wrapLabel(ctx, r.text, x, r.y + r.h / 2, labelW - 20, 24, 'left');
      ctx.fillStyle = tint(HUES[i % HUES.length], 0.25);
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      glow(ctx, c, 14);
      const w = Math.max(6, maxW * r.k * q);
      rounded(ctx, x + labelW, by, w, bh, 10);
      ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      // A year (1903) is written as a year, not 1,903.
      const year = Number.isInteger(r.value) && r.value >= 1000 && r.value <= 2100 && it.rows.every((x) => Number.isInteger(x.value) && x.value >= 1000 && x.value <= 2100);
      label(ctx, `${year ? Math.round(r.value * q) : (r.value * q).toLocaleString(undefined, { maximumFractionDigits: String(r.value).includes('.') ? 1 : 0 })}${r.unit === '%' ? '%' : r.unit ? ` ${r.unit}` : ''}`, x + labelW + w + 14, r.y + r.h / 2, { size: 26, weight: 700, fill: c, align: 'left' });
      ctx.restore();
    });
    if (it.label && t > 0.6) wrapLabel(ctx, it.label, FIG.x, FIG.y + FIG.h - 30, FIG.w, 22, 'center', 'muted');
  },

  // Levels from the top (fewest, smallest) to the base (most, largest).
  pyramid(b, ctx, it, t) {
    const cx = FIG.x + FIG.w / 2;
    it.rows.forEach((r, i) => {
      const lt = t - (it.rows.length - 1 - i) * 0.3;
      if (lt < 0) return;
      const q = easeOut(clamp(lt / 0.45));
      const c = color(HUES[i % HUES.length]);
      ctx.save();
      ctx.globalAlpha *= q;
      ctx.translate(0, (1 - q) * 20);
      ctx.fillStyle = tint(HUES[i % HUES.length], 0.16);
      ctx.strokeStyle = c;
      ctx.lineWidth = 2.5;
      glow(ctx, c, 12);
      ctx.beginPath();
      ctx.moveTo(cx - r.w0 / 2 + 4, r.y + 4);
      ctx.lineTo(cx + r.w0 / 2 - 4, r.y + 4);
      ctx.lineTo(cx + r.w1 / 2 - 4, r.y + r.h - 4);
      ctx.lineTo(cx - r.w1 / 2 + 4, r.y + r.h - 4);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      const inner = Math.min(r.w0, r.w1) - 40;
      wrapLabel(ctx, r.text, cx - inner / 2, r.y + r.h / 2, inner, inner < 260 ? 22 : 26, 'center');
      ctx.restore();
    });
  },

  // One number that matters, big.
  bignum(b, ctx, it, t) {
    const p = clamp(t / 0.6);
    const k = 0.8 + 0.2 * outBack(p);
    const z = it.z;
    const small = z !== FIG;
    const cx = z.x + z.w / 2;
    const cy = small ? z.y + 70 : z.y + z.h / 2 - 40;
    ctx.save();
    ctx.globalAlpha *= clamp(p * 2);
    ctx.translate(cx, cy);
    ctx.scale(k, k);
    glow(ctx, COLORS.cyan, 30);
    const big = small ? 76 : 150;
    label(ctx, String(it.value || ''), 0, 0, { size: String(it.value || '').length > 6 ? big * 0.72 : big, weight: 700, fill: 'cyan' });
    ctx.shadowBlur = 0;
    ctx.restore();
    if (p > 0.5) wrapLabel(ctx, it.label || '', z.x + (small ? 0 : 60), cy + (small ? 80 : 120), z.w - (small ? 0 : 120), small ? 26 : 32, 'center');
  },
};

// The other figures (figures.js) and the map (map.js) draw with this kit.
export const KIT = { FIG, COL, COLORS, HUES, FONT, glow, label, wrapLabel, rounded, arrow, clamp, easeOut, outBack, color, tint };
// The diagrams that fill the figure area (a lesson step shows one of them for the whole step).
export const BIG_OPS = BIG;
const EXTRA = figures(KIT);
Object.assign(DRAW, EXTRA.draw, { map: (b, ctx, it, t) => drawMap(KIT, ctx, it, t, b.clock) });

// Animated simulations for physics and maths concepts (sims-*.js), loaded as
// the page starts; a broken or missing file only leaves its sims out.
const SIMS = {};
for (const file of ['./sims-physics.js', './sims-maths.js', './sims-more.js', './sims-engineering.js', './sims-body.js', './sims-kids.js', './sims-philosophy.js', './sims-mindtech.js', './sims-kids2.js', './sims-kids3.js', './sims-faith.js', './sims-bio2.js', './sims-philo2.js', './sims-history.js', './sims-arts.js', './sims-space.js', './sims-explain.js']) {
  import(file).then((m) => { const make = Object.values(m).find((v) => typeof v === 'function'); if (make) Object.assign(SIMS, make(KIT)); }).catch((e) => console.warn(`${file}:`, e.message));
}
DRAW.sim = (b, ctx, it, t) => {
  const draw = SIMS[it.name];
  if (draw) { try { draw(b, ctx, it, t); } catch (e) { if (!it.failed) { it.failed = true; console.warn(`sim ${it.name}:`, e); } } } else label(ctx, '…', FIG.x + FIG.w / 2, FIG.y + FIG.h / 2, { size: 40, fill: 'muted' });
};
