// Sentence embeddings for the knowledge base: bge-small-en-v1.5 (33 MB, 8-bit)
// on the CPU, about 6 ms a question. It compares meanings ("sloping side" ~
// "slanted side"), which word search cannot, and it cannot make anything up.
//
// Vectors are cached on disk by their text in a compact binary file
// (data/embeddings-<model>.bin, 384 float32 per row, keys in .keys.json),
// so tens of thousands of phrasings are embedded once, in batches, and later
// starts load them in milliseconds.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline, env } from '@huggingface/transformers';
import { modelDir } from './models.mjs';
import { readJson, writeWholeSync } from './files.mjs';

export const DIMS = 384;

export function createEmbedder({ model = 'Xenova/bge-small-en-v1.5', dataDir } = {}) {
  env.cacheDir = modelDir();
  const base = dataDir ? path.join(dataDir, `embeddings-${model.replace(/\W+/g, '_')}`) : null;
  const rows = new Map(); // key -> Float32Array: the cards' phrasings, saved
  const asked = new Map(); // the students' questions: the last few hundred, never saved
  const keys = base && fs.existsSync(`${base}.bin`) ? readJson(`${base}.keys.json`, null) : null;
  if (Array.isArray(keys)) {
    const buf = fs.readFileSync(`${base}.bin`);
    const all = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4));
    if (all.length === keys.length * DIMS) keys.forEach((k, i) => rows.set(k, all.subarray(i * DIMS, (i + 1) * DIMS)));
  }
  let dirty = false;
  const ready = pipeline('feature-extraction', model, { dtype: 'q8', device: 'cpu' });
  const key = (t) => crypto.createHash('sha1').update(t).digest('hex').slice(0, 16);

  // Vectors for many texts, made in batches of 32 (cached ones are free).
  // query: the texts are what students said, kept only for a while, so the
  // saved cache holds the cards' phrasings and does not grow with every question.
  async function embedMany(texts, { query = false } = {}) {
    const have = (k) => rows.get(k) || asked.get(k);
    const missing = [...new Set(texts.filter((t) => !have(key(t))))];
    if (missing.length) {
      const extractor = await ready;
      for (let i = 0; i < missing.length; i += 32) {
        const batch = missing.slice(i, i + 32);
        const out = await extractor(batch, { pooling: 'mean', normalize: true });
        batch.forEach((t, j) => (query ? asked : rows).set(key(t), Float32Array.from(out.data.subarray(j * DIMS, (j + 1) * DIMS))));
      }
      if (query) while (asked.size > 500) asked.delete(asked.keys().next().value);
      else dirty = true;
    }
    return texts.map((t) => have(key(t)));
  }

  const embed = async (text, opts) => (await embedMany([text], opts))[0];

  function save() {
    if (!base || !dirty) return;
    fs.mkdirSync(path.dirname(base), { recursive: true });
    const keys = [...rows.keys()];
    const all = new Float32Array(keys.length * DIMS);
    keys.forEach((k, i) => all.set(rows.get(k), i * DIMS));
    // Keys last: a .bin without matching keys is noticed (length check) and rebuilt.
    writeWholeSync(`${base}.bin`, Buffer.from(all.buffer));
    writeWholeSync(`${base}.keys.json`, JSON.stringify(keys));
    dirty = false;
  }

  return { ready, embed, embedMany, save, model, get size() { return rows.size; } };
}

export const cosine = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
