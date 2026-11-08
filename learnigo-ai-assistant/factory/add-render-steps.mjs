// Puts the "see the real thing in 3D" step (factory/render-steps.json) back
// into any lesson that lost it, as its second step. Safe to run again.
//   node factory/add-render-steps.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { packProblems } from '../lib/schema.mjs';
import { imageProblems } from '../shared/explainer-spec.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { steps } = JSON.parse(fs.readFileSync(path.join(ROOT, 'factory/render-steps.json'), 'utf8'));
let added = 0;
for (const [id, { render, say }] of Object.entries(steps)) {
  const file = path.join(ROOT, 'packs', id.split('-')[0], `${id}.json`);
  if (!fs.existsSync(file)) continue;
  const p = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (p.explain.some((s) => s.draw.some((d) => d.op === 'image' && d.render)) || p.explain.length >= 8) continue;
  const step = { say, draw: [{ op: 'clear' }, { op: 'title', text: p.title }, { op: 'image', render }] };
  const next = { ...p, explain: [p.explain[0], step, ...p.explain.slice(1)] };
  const bad = [...packProblems(next), ...imageProblems(step.draw[2])];
  if (bad.length) { console.log(`${id}: ${bad.join('; ')}`); continue; }
  fs.writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`);
  added++;
}
console.log(`${added} steps added, ${Object.keys(steps).length} lessons listed`);
