// Content v5: the AI Teacher's lessons for young learners (levels EY and P1) follow the
// children's rules of docs/learning/TEACHING-STANDARDS.md, and each was rewritten by a reviewer.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintPack, isYoung } from '../lib/pack-lint.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../packs');
const packs = [];
for (const area of fs.readdirSync(root)) {
  const dir = path.join(root, area);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) packs.push(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
}

test('every young learner\'s pack passes the children\'s check and was reviewed', () => {
  const young = packs.filter(isYoung);
  assert.ok(young.length >= 400, `${young.length} young packs`);
  const problems = young.flatMap((p) => lintPack(p).filter((x) => !x.rule.endsWith('-warning')).map((x) => `${p.id} ${x.rule} ${x.where}`));
  assert.deepEqual(problems.slice(0, 10), []);
  const unchecked = young.filter((p) => p.checked !== 'content-v5').map((p) => p.id);
  assert.deepEqual(unchecked.slice(0, 10), [], `${unchecked.length} young packs not reviewed`);
});

test('the children\'s check catches what it is for', () => {
  const base = { id: 'EY-TEST-01', levels: ['EY'], explain: [{ say: 'Count the apples with me.', draw: [] }] };
  const quiz = (q) => lintPack({ ...base, quiz: [q] }).map((x) => x.rule);
  const opts = (...xs) => xs.map((x) => ({ show: x, say: x }));
  assert.ok(quiz({ say: 'Look at these three balls. Count them.', show: '⚫ ⚫ ⚫', options: opts('Two', 'Three', 'Four'), answer: 1, why: 'x', wrong: {} }).includes('giveaway'));
  assert.ok(quiz({ say: 'How many balls?', show: '⚫ ⚫ ⚫', options: opts('2', '3', '4', '5'), answer: 1, why: 'x', wrong: {} }).includes('options'));
  assert.ok(quiz({ say: 'How many balls?', show: '⚫ ⚫ ⚫', options: opts('Two', 'Three', 'Four'), answer: 1, why: 'x', wrong: {} }).includes('numerals'));
  assert.ok(quiz({ say: 'Which one is not round?', show: '?', options: opts('⚽', '🟦', '🔵'), answer: 1, why: 'x', wrong: { 0: 'This is tempting because it is round.' } }).includes('negation'));
  assert.deepEqual(quiz({ say: 'How many balls?', show: '⚫ ⚫ ⚫', options: opts('2', '3', '4'), answer: 1, why: 'Count each one once.', wrong: { 0: 'Count again, one at a time.', 2: 'One ball is counted twice.' } }), []);
});
