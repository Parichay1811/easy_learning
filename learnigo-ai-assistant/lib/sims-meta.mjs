// What simulations the board has (public/sims-*.js), for the server to pick
// one per topic. Those files are browser modules (their imports start with
// /shared/), so they are read as text with the imports pointed at this
// folder and loaded from a data: URL; only their metadata is used here.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function loadSimsMeta() {
  const meta = {};
  for (const file of ['sims-physics.js', 'sims-maths.js', 'sims-more.js', 'sims-engineering.js', 'sims-body.js', 'sims-kids.js', 'sims-philosophy.js', 'sims-mindtech.js', 'sims-kids2.js', 'sims-kids3.js', 'sims-faith.js', 'sims-bio2.js', 'sims-philo2.js', 'sims-history.js', 'sims-arts.js', 'sims-space.js', 'sims-explain.js']) {
    const full = path.join(ROOT, 'public', file);
    if (!fs.existsSync(full)) continue;
    const src = fs.readFileSync(full, 'utf8').replace(/from\s+'\/shared\//g, `from '${pathToFileURL(path.join(ROOT, 'shared')).href}/`);
    try {
      const mod = await import(`data:text/javascript;base64,${Buffer.from(src).toString('base64')}`);
      for (const v of Object.values(mod)) if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(meta, v);
    } catch (e) { console.warn(`${file}: ${e.message}`); }
  }
  return meta;
}

// The curriculum's topic rows by id (title, subtopics), for picking pictures.
export function loadTopics() {
  const out = new Map();
  for (const f of ['topics.json', 'topics-extra.json']) {
    try { for (const t of JSON.parse(fs.readFileSync(path.join(ROOT, 'factory', f), 'utf8')).topics) out.set(t.id, t); } catch { /* optional */ }
  }
  return out;
}
