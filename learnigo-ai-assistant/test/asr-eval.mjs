#!/usr/bin/env node
// How well the teacher hears hard lesson words, on recorded questions.
// macOS voices (Indian, British, American, Australian and Irish English) say
// lesson questions with a little background noise; each set-up hears them
// and is scored on the lesson words it got right (Thevenin, Okonkwo, Spain)
// and on whether the knowledge base then finds the right lesson.
//
//   node test/asr-eval.mjs [setups] [--limit N] [--dump candidates.jsonl]
//   setups: comma list of moonshine, moonshine-beam, moonshine-full, whisper,
//   whisper-prompt, whisper-full, small-full ("-full": best of several, checked
//   against the lessons and the sound; default: all but small-full)
//
// Clips are made once (macOS `say`) into LT_DATA/asr-clips (data/ by default).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadPacks } from '../lib/packs.mjs';
import { buildCards, createIndex } from '../lib/knowledge.mjs';
import { createEmbedder } from '../lib/embed.mjs';
import { createHeard } from '../lib/heard.mjs';
import { loadHearing } from '../lib/hearing.mjs';
import { dictionary } from '../lib/converse.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = process.env.LT_DATA || path.join(ROOT, 'data');
const args = process.argv.slice(2);
const limit = Number(args[args.indexOf('--limit') + 1]) || Infinity;
const wanted = (args.find((a, i) => !a.startsWith('--') && !/^\d+$/.test(a) && !args[i - 1]?.startsWith('--')) || 'moonshine,moonshine-full,whisper,whisper-prompt,whisper-full').split(',');

const packs = loadPacks(path.join(ROOT, 'packs'), { drafts: true, log: () => {} });
const dict = dictionary();
const plain = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();

// The words a recogniser has to get right: names (capitalised, not first)
// and words in no dictionary.
function hardWords(text) {
  const out = [];
  plain(text).split(' ').forEach((w, i, all) => {
    const raw = String(text).split(/\s+/)[i] || '';
    const base = w.replace(/'s$/, '');
    if (base.length < 3) return;
    const name = i > 0 && /^\p{Lu}/u.test(raw) && raw !== 'I';
    if (name || !dict.has(base) && !dict.has(base.replace(/s$/, ''))) out.push(base);
  });
  return [...new Set(out)];
}

// The questions: example questions asked out of the blue, questions asked
// inside the open lesson, and mishearings seen in the question log.
function items() {
  const list = [];
  const courses = ['BEE', 'BME', 'BCE', 'BLIT', 'BHIS'];
  const mine = [...packs.values()].filter((p) => courses.includes(p.id.split('-')[0])).sort((a, b) => a.id.localeCompare(b.id));
  const cold = [];
  const inside = [];
  for (const p of mine) {
    const ex = p.examples.find((e) => hardWords(e).length);
    if (ex) cold.push({ text: ex, pack: p.id, context: {} });
    const f = (p.faq || []).find((q) => hardWords(q.q).length && q.q.length < 90);
    if (f) inside.push({ text: f.q, pack: p.id, context: { topic: p.id, chips: p.examples.slice(0, 3) } });
  }
  const every = (arr, n) => arr.filter((_, i) => i % Math.max(1, Math.floor(arr.length / n)) === 0).slice(0, n);
  list.push(...every(cold, 45), ...every(inside, 30));
  const ac = [...packs.values()].find((p) => p.id.startsWith('BEE') && (p.keywords || []).some((k) => /phase/i.test(k)));
  list.push(
    { text: 'What is phase in an AC signal?', pack: ac?.id, context: ac ? { topic: ac.id } : {}, real: true },
    { text: 'Why did Portugal and Spain explore?', pack: 'BHIS-EMOD-03', context: {}, real: true },
    { text: "Who is Pip's secret benefactor?", pack: null, context: {}, real: true },
    { text: 'Explain Thevenin theorem', pack: 'BEE-CIRC-08', context: {}, real: true },
    { text: 'Explain Mohr circle', pack: 'BME-SOM-09', context: {}, real: true },
    { text: 'What is a Karnaugh map?', pack: 'BEE-DIG-04', context: {}, real: true },
  );
  // Everyday questions from the log: the corrections must leave them alone.
  for (const text of ['How do I add 27 and 15?', 'Why do we have time zones?', 'Who is the richest person in the world?', 'Test me on volcanoes.',
    'How do birds migrate?', 'What do I do when plans change?', 'Help me focus on homework.', 'How can I stop mixing up b and d?',
    'Tell me how an aeroplane works.', 'Can you say that again?', 'Why is the sky blue?', 'What is the bystander effect?']) list.push({ text, pack: null, context: {}, everyday: true });
  return list.slice(0, limit);
}

const VOICES = ['Rishi', 'Aman (English (India))', 'Tara', 'Daniel', 'Samantha', 'Karen', 'Moira', 'Rishi', 'Tara'];

function readWav(file) {
  const b = fs.readFileSync(file);
  for (let o = 12; o < b.length;) {
    const id = b.toString('ascii', o, o + 4);
    const n = b.readUInt32LE(o + 4);
    if (id === 'data') return new Float32Array(b.buffer.slice(b.byteOffset + o + 8, b.byteOffset + o + 8 + n));
    o += 8 + n + (n & 1);
  }
  throw new Error(`no audio in ${file}`);
}

// A clip of the text in that voice, with quiet noise about 25 dB below it.
function clip(text, voice, i) {
  const dir = path.join(DATA, 'asr-clips');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${crypto.createHash('sha1').update(`${voice}|${text}`).digest('hex').slice(0, 12)}.wav`);
  if (!fs.existsSync(file)) execFileSync('say', ['-v', voice, '-r', String(170 + (i % 4) * 15), '-o', file, '--file-format=WAVE', '--data-format=LEF32@16000', text]);
  const s = readWav(file);
  let power = 0;
  for (const x of s) power += x * x;
  const amp = Math.sqrt(power / s.length) / 10 ** (25 / 20) * Math.sqrt(3);
  let seed = i * 7919 + 1;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 * 2 - 1; };
  const pad = new Float32Array(s.length + 8000);
  for (let k = 0; k < pad.length; k++) pad[k] = (s[k - 4000] || 0) + amp * rnd();
  return pad;
}

const SETUPS = {
  moonshine: { model: 'moonshine', beams: 1, prompt: false, choose: false },
  'moonshine-beam': { model: 'moonshine', beams: 4, prompt: false, choose: true },
  'moonshine-full': { model: 'moonshine', beams: 4, prompt: false, choose: true, sound: true },
  whisper: { model: 'whisper', beams: 1, prompt: false, choose: false },
  'whisper-prompt': { model: 'whisper', beams: 1, prompt: true, choose: false },
  'whisper-full': { model: 'whisper', beams: 4, prompt: true, choose: true, sound: true },
  'small-full': { model: 'whisper-small', beams: 4, prompt: true, choose: true, sound: true },
};

const tests = items();
const audio = tests.map((t, i) => ({ ...t, voice: VOICES[i % VOICES.length], samples: clip(t.text, VOICES[i % VOICES.length], i) }));
console.log(`${audio.length} clips (${audio.filter((a) => a.context.topic).length} inside a lesson)`);

const embedder = createEmbedder({ dataDir: DATA });
const kb = createIndex(buildCards(packs), { embedder });
await kb.embedded;
const heard = createHeard(packs, new Map(), { dataDir: null });
const models = new Map();
// --dump file: every candidate's scores, for tuning heard.mjs's weights.
const dump = args.includes('--dump') ? fs.createWriteStream(args[args.indexOf('--dump') + 1]) : null;
const report = [];
for (const name of wanted) {
  const s = SETUPS[name];
  if (!s) continue;
  if (!models.has(s.model)) models.set(s.model, await loadHearing(s.model));
  const hear = models.get(s.model);
  let words = 0;
  let right = 0;
  let found = 0;
  let foundOf = 0;
  let ms = 0;
  let kept = 0;
  let everyday = 0;
  const rows = [];
  for (const a of audio) {
    const t0 = performance.now();
    const keep = `${name}|${a.text}|${a.voice}`;
    const hyps = await hear(a.samples, { beams: s.beams, prompt: s.prompt ? heard.prompt(a.context) : '', keep });
    const acoustic = s.sound ? (texts) => hear.score(keep, texts) : null;
    const out = s.choose ? await heard.choose(hyps, { context: a.context, kb, acoustic, debug: !!dump }) : { text: heard.fix(hyps[0]?.text || '') };
    if (dump && out.scored) dump.write(`${JSON.stringify({ setup: name, text: a.text, hard: hardWords(a.text), pack: a.pack, everyday: !!a.everyday, scored: out.scored.map((c) => ({ text: c.text, kb: c.kb, pack: c.pack, cost: c.cost, drop: c.drop, here: c.swaps.some((x) => x.here), any: c.swaps.some((x) => !x.here) })) })}\n`);
    ms += performance.now() - t0;
    const got = plain(out.text);
    const hard = hardWords(a.text);
    const ok = hard.filter((w) => got.includes(w));
    words += hard.length;
    right += ok.length;
    // An everyday question is kept when its words come out as said
    // (ignoring spelling of numbers and punctuation) or as plain Whisper heard them.
    if (a.everyday) {
      everyday++;
      const same = (x) => plain(x).replace(/aeroplane/g, 'airplane');
      if (same(out.text) === same(a.text) || same(out.text) === same(heard.fix(hyps[0]?.text || ''))) kept++;
      else rows.push(`CHANGED ${a.text} => ${out.text} (heard ${hyps[0]?.text})`);
    }
    let pack = '';
    if (a.pack) {
      foundOf++;
      pack = (await kb.find(out.text, 1))[0]?.card.pack || '';
      if (pack === a.pack) found++;
    }
    rows.push(`${ok.length === hard.length ? 'ok  ' : 'MISS'} ${a.pack && pack === a.pack ? 'kb ' : '   '} ${a.voice.split(' ')[0].padEnd(8)} ${a.text}  =>  ${out.text}${out.swapped ? `   [${out.swapped.from} -> ${out.swapped.to}]` : ''}`);
  }
  report.push({ name, words: `${right}/${words}`, wordRate: +(right / words).toFixed(3), lesson: `${found}/${foundOf}`, lessonRate: +(found / foundOf).toFixed(3), kept: `${kept}/${everyday}`, ms: Math.round(ms / audio.length) });
  console.log(`\n== ${name}\n${rows.join('\n')}`);
  console.log(JSON.stringify(report.at(-1)));
}
console.log('\nsetup            lesson words   right lesson   everyday kept   ms per question');
for (const r of report) console.log(`${r.name.padEnd(16)} ${r.words.padStart(9)} ${(r.wordRate * 100).toFixed(0).padStart(3)}%  ${r.lesson.padStart(7)} ${(r.lessonRate * 100).toFixed(0).padStart(3)}%  ${r.kept.padStart(10)}     ${String(r.ms).padStart(6)}`);
