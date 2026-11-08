// Odd input never breaks the teacher: bad pack files, tricky TODO keys, cut-off
// files, symbols in a subject, and the sound check coming back empty.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { packProblems } from '../lib/schema.mjs';
import { createStore } from '../lib/store.mjs';
import { readJson, writeWholeSync, prune } from '../lib/files.mjs';
import { nextQuestions } from '../lib/followup.mjs';
import { createMcp } from '../lib/mcp.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'lt-'));

test('a broken pack is reported, not thrown', () => {
  const pack = {
    id: 'AB-01', title: 't', keywords: ['k'], examples: [],
    explain: [{ say: 'a', draw: [null] }, { say: 'b', draw: [] }],
    faq: [null, { q: 'q', a: 'a', asks: null }],
    quiz: [{ say: 's', show: 's', options: 'abc', answer: 0, why: 'w', wrong: {} }],
  };
  const problems = packProblems(pack);
  assert.ok(problems.includes('faq 1: asks must be short strings'));
  assert.ok(problems.includes('quiz 0: 3 or 4 options'));
});

test('the TODO list takes any question as a key, and is saved whole', () => {
  const dir = tmp();
  const store = createStore(dir);
  store.addTodo('constructor');
  store.addTodo('__proto__');
  store.doneTodo('__proto__');
  assert.equal(({}).done, undefined);
  assert.equal(Object.count, undefined);
  assert.deepEqual(store.todos().map((t) => t.key).sort(), ['constructor', 'proto']);
  store.flush();
  assert.equal(createStore(dir).todos().length, 2);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('a cut-off file is set aside, not fatal', () => {
  const dir = tmp();
  const file = path.join(dir, 'todos.json');
  fs.writeFileSync(file, '{"half": {"text": "ha');
  assert.deepEqual(createStore(dir).todos(), []);
  assert.ok(fs.existsSync(`${file}.broken`));
  writeWholeSync(file, '{"a":1}');
  assert.deepEqual(readJson(file, null), { a: 1 });
  assert.deepEqual(fs.readdirSync(dir).filter((f) => f.endsWith('.tmp')), []);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('old cache entries are dropped', () => {
  const now = Date.now();
  const cache = { fresh: { at: now, value: 1 }, old: { at: now - 40 * 24 * 3600 * 1000, value: 2 }, bad: null };
  assert.deepEqual(Object.keys(prune(cache)), ['fresh']);
});

test('a subject with symbols ("C++") does not break the next questions', () => {
  assert.ok(nextQuestions({ steps: [{ say: 'C++ is a programming language.' }] }, 'C++').length > 0);
});

test('an MCP request with null params is an error reply, not a crash', async () => {
  const mcp = createMcp({ list: () => [], call: async () => ({ text: '' }) });
  const reply = await mcp.handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: null });
  assert.equal(reply.id, 1);
  assert.ok(reply.result || reply.error);
});
