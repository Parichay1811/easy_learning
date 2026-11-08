// The hearing's corrections: sound keys, sound-alike lesson phrases, the
// knowledge-base check and the student's own remembered corrections.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { soundKey, createHeard } from '../lib/heard.mjs';

const pack = (id, title, keywords, extra = {}) => ({ id, title, keywords, examples: [], faq: [], group: id.split('-').slice(0, 2).join('-'), ...extra });
const packs = new Map([
  ['BEE-CIRC-08', pack('BEE-CIRC-08', "Thevenin's theorem: a whole circuit as one battery and one resistor", ['Thevenin equivalent', 'open-circuit voltage'], { examples: ['How do I find the Thevenin resistance?'] })],
  ['BEE-AC-02', pack('BEE-AC-02', 'Phase and phasors: AC as a spinning arrow', ['phase', 'phasor', 'phase angle'])],
  ['BHIS-EMOD-03', pack('BHIS-EMOD-03', 'Why Portugal and Spain sailed: the age of exploration', ['Portugal', 'Spain', 'caravel'])],
  ['SCH-BIO-01', pack('SCH-BIO-01', 'Snake venom: how it works', ['venom', 'antivenom'])],
]);

// A tiny stand-in for the knowledge base: the pack sharing most words.
const kb = {
  async find(text) {
    const t = text.toLowerCase();
    let best = null;
    for (const p of packs.values()) {
      const ws = `${p.title} ${p.keywords.join(' ')}`.toLowerCase().match(/[a-z]{4,}/g);
      const hits = new Set(ws.filter((w) => t.includes(w))).size;
      const score = Math.min(0.95, 0.35 + 0.15 * hits);
      if (!best || score > best.score) best = { card: { pack: p.id }, score };
    }
    return [best];
  },
};

test('sound keys put sound-alikes together', () => {
  assert.equal(soundKey('face'), soundKey('phase'));
  assert.equal(soundKey('spawn'), soundKey('Spain'));
  assert.equal(soundKey('test'), soundKey('dest'));
  assert.equal(soundKey('the venom'), '0FNM');
  assert.equal(soundKey('Thevenin'), '0FNN');
});

test('a sound-alike lesson phrase replaces what was heard when it finds a lesson', async () => {
  const heard = createHeard(packs);
  const out = await heard.choose([{ text: 'Explain the venom theorem.', score: -0.3 }], { kb });
  assert.match(out.text, /Thevenin/);
  assert.equal(out.heard, 'Explain the venom theorem.');
  const spain = await heard.choose([{ text: 'Why did Portugal and spawn explore?', score: -0.3 }], { kb });
  assert.match(spain.text, /Spain/);
});

test('the open lesson decides between sound-alikes', async () => {
  const heard = createHeard(packs);
  const out = await heard.choose([{ text: 'What is face?', score: -0.4 }], { kb, context: { topic: 'BEE-AC-02' } });
  assert.match(out.text, /phase/i);
});

test('ordinary words and commands stay as said', async () => {
  const heard = createHeard(packs);
  assert.equal((await heard.choose([{ text: 'How does snake venom work?', score: -0.2 }], { kb })).text, 'How does snake venom work?');
  assert.equal((await heard.choose([{ text: 'Next.', score: -0.2 }], { kb })).text, 'Next.');
  assert.equal((await heard.choose([{ text: 'B', score: -0.2 }], { kb, context: { awaiting: true } })).text, 'B');
});

test('a lower guess wins when it finds the lesson, and the others are offered', async () => {
  const heard = createHeard(packs);
  const out = await heard.choose([{ text: 'Explain seven in theorem.', score: -0.5 }, { text: 'Explain Thevenin theorem.', score: -0.6 }], { kb });
  assert.equal(out.text, 'Explain Thevenin theorem.');
  assert.deepEqual(out.options, ['Explain seven in theorem.']);
});

test('the prompt holds the open lesson and the questions on screen', () => {
  const heard = createHeard(packs);
  const p = heard.prompt({ topic: 'BEE-CIRC-08', chips: ['How do I find the Thevenin resistance?'] });
  assert.match(p, /Thevenin equivalent, open-circuit voltage/);
  assert.match(p, /Thevenin resistance/);
  assert.equal(heard.prompt({}), '');
});

test('a correction is remembered and used from then on', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'heard-'));
  const heard = createHeard(packs, new Map(), { dataDir: dir });
  assert.deepEqual(heard.learn('explain the venom theorem', 'explain Thevenin theorem'), { from: 'the venom theorem', to: 'Thevenin theorem' });
  assert.deepEqual(heard.learn('who is a conquo', 'who is Okonkwo'), { from: 'a conquo', to: 'Okonkwo' }); // not a dictionary word: on its own
  assert.equal(heard.learn('what is a cell', 'what is the cell'), null); // small words only: not a mishearing
  const again = createHeard(packs, new Map(), { dataDir: dir });
  assert.equal(again.fix('so what is the venom theorem for'), 'so what is Thevenin theorem for');
  assert.equal(again.fix('how does snake venom work'), 'how does snake venom work');
  assert.match(again.prompt({}), /Thevenin/);
  again.forget('the venom theorem');
  again.forget('a conquo');
  assert.equal(again.fixes.length, 0);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('a version the recording does not support is not chosen', async () => {
  const heard = createHeard(packs);
  // The sound fits what was heard far better than any swap.
  const deaf = async (texts) => texts.map((t, i) => (i === 0 ? -0.3 : -3));
  assert.equal((await heard.choose([{ text: 'Explain the venom theorem.', score: -0.3 }], { kb, acoustic: deaf })).text, 'Explain the venom theorem.');
  const fits = async (texts) => texts.map((t, i) => (i === 0 ? -0.3 : -0.9));
  assert.match((await heard.choose([{ text: 'Explain the venom theorem.', score: -0.3 }], { kb, acoustic: fits })).text, /Thevenin/);
});
