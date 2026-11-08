// Checks lesson packs that use the explainer engines or the 3D render
// library: the pack format (lib/schema.mjs), every x-… draw op and every
// {op:'image', render} picture (shared/explainer-spec.js, shared/renders.js).
//   node test/explainer-check.mjs                 every pack using an engine
//   node test/explainer-check.mjs packs/HOWN      one folder or file
import fs from 'node:fs';
import path from 'node:path';
import { packProblems } from '../lib/schema.mjs';
import { explainerProblems, imageProblems } from '../shared/explainer-spec.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const target = path.resolve(process.argv[2] || path.join(root, 'packs'));
const files = [];
(function walk(p) {
  if (fs.statSync(p).isDirectory()) for (const f of fs.readdirSync(p)) walk(path.join(p, f));
  else if (p.endsWith('.json')) files.push(p);
})(target);

let packs = 0;
let bad = 0;
const titles = new Map();
for (const f of files) {
  let pack;
  try { pack = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.log(`${f}: not JSON (${e.message})`); bad++; continue; }
  const all = [...(pack.figure || []), ...(pack.explain || []).flatMap((s) => s.draw || [])];
  const ops = all.filter((o) => o?.op === 'sim' && /^x-/.test(o.name || ''));
  const pics = all.filter((o) => o?.op === 'image' && o.render != null);
  if (!ops.length && !pics.length && process.argv[2] == null) continue;
  packs++;
  const problems = [...packProblems(pack), ...ops.flatMap(explainerProblems), ...pics.flatMap(imageProblems)];
  if (`${pack.id}.json` !== path.basename(f)) problems.push(`file name should be ${pack.id}.json`);
  const t = String(pack.title || '').toLowerCase();
  if (titles.has(t)) problems.push(`same title as ${titles.get(t)}`); else titles.set(t, pack.id);
  if (problems.length) { bad++; console.log(`${path.relative(root, f)}:\n  ${problems.join('\n  ')}`); }
}
console.log(`${packs} explainer packs, ${bad} with problems`);
process.exitCode = bad ? 1 : 0;
