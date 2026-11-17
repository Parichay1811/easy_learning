// Writes shared/renders.js from factory/blender/meta/*.json (one file per
// render, written by common.py finish()). Run after rendering:
//   node factory/blender/build-manifest.mjs
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..', '..');
const metaDir = path.join(here, 'meta');
const pub = path.join(root, 'public', 'renders');
const out = {};
for (const f of fs.readdirSync(metaDir).filter((f) => f.endsWith('.json')).sort()) {
  const m = JSON.parse(fs.readFileSync(path.join(metaDir, f), 'utf8'));
  if (!fs.existsSync(path.join(pub, `${m.name}.webp`))) { console.warn(`skip ${m.name}: no webp`); continue; }
  const e = { title: m.title, src: `/renders/${m.name}.webp` };
  if (m.loop && fs.existsSync(path.join(pub, `${m.name}.mp4`))) e.loop = `/renders/${m.name}.mp4`;
  e.tags = m.tags;
  e.parts = m.parts;
  out[m.name] = e;
}
const body = Object.entries(out).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join('\n');
const js = `// The 3D picture library: Blender renders in public/renders, made by
// factory/blender (scenes/<name>.py). Written by factory/blender/build-manifest.mjs
// from factory/blender/meta; do not edit by hand. Part x/y are 0-1 fractions of the
// picture, projected from the 3D part through the camera; a part with a track
// follows its object through the loop (samples evenly spaced over one loop).
export const RENDERS = {
${body}
};

// The render that best matches some words (title, name or tags), or null.
export function findRender(words) {
  const q = String(words || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').trim();
  if (!q) return null;
  if (RENDERS[q.replace(/ +/g, '-')]) return q.replace(/ +/g, '-');
  let best = null; let score = 0;
  for (const [name, r] of Object.entries(RENDERS)) {
    for (const t of [r.title.toLowerCase(), name.replace(/-/g, ' '), ...r.tags]) {
      const s = q === t ? 3 : (\` \${q} \`).includes(\` \${t} \`) ? 2 + t.length / 100 : 0;
      if (s > score) { score = s; best = name; }
    }
  }
  return best;
}
`;
fs.writeFileSync(path.join(root, 'shared', 'renders.js'), js);
console.log(`shared/renders.js: ${Object.keys(out).length} renders`);
