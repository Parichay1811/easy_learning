// Which topic gets which opening picture: every row of the curriculum brief
// and the extra topics. Lists the topics with none, by subject, so the gaps
// are visible:  node test/visual-coverage.mjs [MATH,PHYS]
import { loadSimsMeta, loadTopics } from '../lib/sims-meta.mjs';
import { topicVisual } from '../shared/topic-visuals.js';

const only = process.argv[2]?.split(',');
const sims = await loadSimsMeta();
const topics = [...loadTopics().values()].filter((t) => !only || only.some((o) => t.id.startsWith(`${o}-`)));
const bySubject = new Map();
const missingSims = new Set();
for (const t of topics) {
  const d = t.id.split('-')[0];
  const v = topicVisual(t, sims);
  const row = bySubject.get(d) || { n: 0, got: 0, gaps: [] };
  row.n++;
  if (v) row.got++; else row.gaps.push(`${t.id} ${t.title}`);
  bySubject.set(d, row);
}
console.log(`${Object.keys(sims).length} simulations available`);
for (const [d, r] of [...bySubject].sort((a, b) => b[1].n - a[1].n)) console.log(`${d.padEnd(6)} ${String(r.got).padStart(4)}/${String(r.n).padEnd(4)} ${r.gaps.length && only ? `\n   no picture: ${r.gaps.join('\n   no picture: ')}` : ''}`);
