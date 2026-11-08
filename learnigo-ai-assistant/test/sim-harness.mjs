// Runs every simulation of a sims module against a fake canvas, at several
// times, so a typo or a crash shows up without a browser:
//   node test/sim-harness.mjs public/sims-physics.js
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const file = process.argv[2];
if (!file) { console.error('usage: node test/sim-harness.mjs <sims module>'); process.exit(2); }

// A canvas context that accepts every call and property and counts draws.
function fakeCtx() {
  let draws = 0;
  const gradient = { addColorStop() {} };
  const target = {
    canvas: { width: 1600, height: 900 },
    measureText: (t) => ({ width: String(t).length * 11 }),
    createLinearGradient: () => gradient, createRadialGradient: () => gradient, createConicGradient: () => gradient,
    createPattern: () => ({}), getImageData: () => ({ data: new Uint8ClampedArray(4) }), isPointInPath: () => false,
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }), getLineDash: () => [],
  };
  return new Proxy(target, {
    get(t, k) {
      if (k === 'draws') return draws;
      if (k in t) return t[k];
      if (/^(fill|stroke|draw|clear)/.test(String(k))) return () => { draws++; };
      return () => {};
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

const FIG = { x: 60, y: 120, w: 800, h: 700 };
const COLORS = { ink: '#e9eeff', muted: '#93a0c4', cyan: '#22d3ee', blue: '#5b8cff', orange: '#ff9f43', green: '#34d399', red: '#fb7185', purple: '#a78bfa', yellow: '#fbbf24', teal: '#2dd4bf', surface: 'rgba(255,255,255,0.05)', line: 'rgba(140,170,255,0.18)' };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const kit = {
  FIG, COL: { x: 920, y: 150, w: 620 }, COLORS, HUES: ['blue', 'cyan', 'purple', 'teal', 'orange', 'green'], FONT: 'Lexend, sans-serif',
  glow: (ctx, c, b) => { ctx.shadowColor = c; ctx.shadowBlur = b; },
  label: (ctx, text) => { if (typeof text !== 'string' && typeof text !== 'number') throw new Error(`label got ${typeof text}`); ctx.fillText(String(text), 0, 0); },
  wrapLabel: (ctx, text) => { ctx.fillText(String(text ?? ''), 0, 0); },
  rounded: (ctx) => ctx.beginPath(),
  arrow: (ctx) => { ctx.stroke(); },
  clamp, easeOut: (p) => 1 - (1 - p) ** 3, outBack: (p) => { const c = 1.6; return 1 + (c + 1) * (p - 1) ** 3 + c * (p - 1) ** 2; },
  color: (c) => COLORS[c] || c, tint: () => 'rgba(0,0,0,0.2)',
};

// Browser modules import from /shared/: point that at the shared folder.
const shared = pathToFileURL(path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'shared')).href;
const src = fs.readFileSync(path.resolve(file), 'utf8').replace(/from\s+'\/shared\//g, `from '${shared}/`);
const mod = await import(`data:text/javascript;base64,${Buffer.from(src).toString('base64')}`);
const make = Object.values(mod).find((v) => typeof v === 'function');
const meta = Object.values(mod).find((v) => v && typeof v === 'object' && !Array.isArray(v));
const sims = make(kit);
let failed = 0;
for (const [name, draw] of Object.entries(sims)) {
  const m = meta?.[name];
  if (!m) { console.log(`MISSING META ${name}`); failed++; continue; }
  const it = { op: 'sim', name, ...(m.example || {}) };
  try {
    let draws = 0;
    for (const t of [0, 0.2, 0.7, 1.5, 3, 6, 12]) {
      const ctx = fakeCtx();
      const t0 = performance.now();
      draw({ clock: t + 100 }, ctx, it, t);
      const ms = performance.now() - t0;
      if (ms > 8) console.log(`SLOW ${name} t=${t}: ${ms.toFixed(1)} ms`);
      draws = Math.max(draws, ctx.draws);
    }
    if (!draws) { console.log(`DRAWS NOTHING ${name}`); failed++; } else console.log(`ok ${name} (${draws} draw calls)`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${name}: ${e.stack.split('\n').slice(0, 3).join(' | ')}`);
  }
}
for (const name of Object.keys(meta || {})) if (!sims[name]) { console.log(`META WITHOUT SIM ${name}`); failed++; }
console.log(`${Object.keys(sims).length} sims, ${failed} problems`);
process.exit(failed ? 1 : 0);
