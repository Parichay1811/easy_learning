#!/usr/bin/env node
// How well the knowledge base finds the right card for questions in students'
// own words (eval.json). Run it after adding packs: as the database
// grows, this is the number that says whether small models are still enough.
//   node eval-kb.mjs [--words]   (--words: word search only)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { loadPacks } from './lib/packs.mjs';
import { buildCards, createIndex } from './lib/knowledge.mjs';
import { createEmbedder } from './lib/embed.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const packs = loadPacks(path.join(ROOT, 'packs'));
const embedder = process.argv.includes('--words') ? null : createEmbedder({ dataDir: path.join(ROOT, 'data') });
const kb = createIndex(buildCards(packs), { embedder });
await kb.embedded;
const { cases } = JSON.parse(fs.readFileSync(path.join(ROOT, 'eval.json'), 'utf8'));
const ACCEPT = 0.6;
// want: a card id, a list of ids, "PACK/" (any card of that pack) or null.
const fits = (got, want) => (Array.isArray(want) ? want : [want]).some((w) => (w && w.endsWith('/') ? String(got).startsWith(w) : got === w));
let right = 0;
let ms = 0;
for (const [q, want] of cases) {
  const t = performance.now();
  const [best] = await kb.find(q, 1);
  ms += performance.now() - t;
  const got = best && best.score >= ACCEPT ? best.card.id : null;
  const ok = fits(got, want);
  if (ok) right++;
  console.log(`${ok ? 'ok ' : 'BAD'} ${(best?.score ?? 0).toFixed(2)} ${String(got).padEnd(22)} want ${String(want).padEnd(22)} ${q}`);
}
console.log(`\n${kb.hybrid ? 'hybrid (words + meaning)' : 'word search only'}: ${right}/${cases.length} right, ${(ms / cases.length).toFixed(1)} ms a question, ${kb.size} cards`);
