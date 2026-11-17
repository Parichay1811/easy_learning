// The knowledge base, the tool registry and the MCP server. Word search only
// here (no embedding model), so the tests are quick and need no downloads.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPacks } from '../lib/packs.mjs';
import { buildCards, createIndex } from '../lib/knowledge.mjs';
import { respond, cardPlan } from '../lib/router.mjs';
import { createTools } from '../lib/tools.mjs';
import { createMcp } from '../lib/mcp.mjs';

const packs = loadPacks(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'packs'), { drafts: false });
const kb = createIndex(buildCards(packs));

async function stream(text, opts = {}) {
  const events = [];
  const tier = await respond(text, { packs, kb, seed: 7, emit: (e) => events.push(e), ...opts });
  return { tier, events, plan: events.find((e) => e.type === 'plan') };
}

test('every pack becomes cards: common questions (with other phrasings), a lesson, a quiz; every template a tool', () => {
  const kinds = kb.cards.reduce((m, c) => ({ ...m, [c.kind]: (m[c.kind] || 0) + 1 }), {});
  assert.equal(kinds.lesson, packs.size);
  assert.equal(kinds.quiz, packs.size);
  assert.equal(kinds.tool, 7);
  const sideways = kb.cards.find((c) => c.id === 'MATH-VEC-01/faq/1');
  assert.ok(sideways.phrasings.includes('which number goes sideways'));
});

test('word search finds a card by its other phrasings', async () => {
  const [best] = await kb.find('which number goes sideways in a column vector', 1);
  assert.equal(best.card.id, 'MATH-VEC-01/faq/1');
});

test('the knowledge base answers before any model, with the checked words of the card', async () => {
  const { tier, plan } = await stream('in a column vector which number goes sideways');
  assert.equal(tier, 'kb');
  assert.match(plan.steps[0].say, /^Yes\. The top number is across/);
});

test('"Do you mean...?" when unsure, and "yes" then teaches that card', async () => {
  const fuzzy = { find: async () => [{ card: kb.cards.find((c) => c.id === 'MATH-MENS-02/faq/4'), score: 0.5 }], cards: kb.cards };
  const ask = await stream('the circle number', { kb: fuzzy });
  assert.match(ask.plan.steps[0].say, /^Do you mean: Why is pi about 3\.14\?/);
  assert.equal(ask.plan.context.offer, 'card:MATH-MENS-02/faq/4');
  const yes = await stream('yes', { context: ask.plan.context });
  assert.equal(yes.tier, 'kb');
  assert.match(yes.plan.steps[0].say, /three of its diameters/);
});

test('a maths tool card with no numbers asks for them, then the follow-up is solved', async () => {
  const card = kb.cards.find((c) => c.id === 'tool/rect_area');
  const ask = cardPlan(card, { text: 'how much carpet for my bedroom', packs });
  assert.match(ask.steps[0].say, /length and the width/);
  const follow = await stream('4 by 3 metres', { context: ask.context });
  assert.equal(follow.plan.context.template, 'rect_area');
  assert.deepEqual(follow.plan.context.params, { l: 4, w: 3, unit: 'm' });
});

test('the chat model gets the nearest checked cards as notes', async () => {
  let notes = null;
  const llm = { available: async () => true, classify: async () => null, chat: async (t, o) => { notes = o.notes; o.onSentence('Pi is the circle number.', 0); return 1; } };
  const nearPi = { find: async () => [{ card: kb.cards.find((c) => c.id === 'MATH-MENS-02/faq/4'), score: 0.4 }], cards: kb.cards };
  await stream('tell me a fun fact about pi', { kb: nearPi, llm });
  assert.equal(notes.length, 1);
  assert.match(notes[0], /three of its diameters/);
});

const tools = createTools({ packs, kb });

test('tools: every tool has a JSON schema; solve, explain, quiz, search, ask', async () => {
  const names = tools.list().map((t) => t.name);
  for (const n of ['ask_teacher', 'search_knowledge', 'use_card', 'list_topics', 'explain_topic', 'practice_question', 'solve_rect_area', 'solve_vec_add']) assert.ok(names.includes(n), n);
  for (const t of tools.list()) assert.equal(t.inputSchema.type, 'object', t.name);
  const solved = await tools.call('solve_circle_area', { radius: 5, unit: 'cm' });
  assert.match(solved.text, /25 pi, which is about 78\.5 square centimetres/);
  const asked = await tools.call('ask_teacher', { question: 'My garden is 12 m by 7.5 m, how much turf?' });
  assert.equal(asked.plan.context.template, 'rect_area');
  const found = await tools.call('search_knowledge', { query: 'what is a scalar' });
  assert.equal(found.data[0].id, 'MATH-VEC-01/faq/4');
  const quiz = await tools.call('practice_question', { topic_id: 'MATH-VEC-01' });
  assert.match(quiz.text, /Answer: [ABCD]\./);
});

test('MCP: initialize, list tools, call a tool, errors', async () => {
  const mcp = createMcp(tools);
  const init = await mcp.handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } } });
  assert.equal(init.result.protocolVersion, '2025-06-18');
  assert.ok(init.result.capabilities.tools);
  assert.equal(await mcp.handle({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);
  const list = await mcp.handle({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  assert.ok(list.result.tools.length >= 12);
  const call = await mcp.handle({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'solve_rect_perimeter', arguments: { length: 8, width: 5, unit: 'm' } } });
  assert.match(call.result.content[0].text, /26 metres/);
  assert.ok(call.result.structuredContent.plan.steps.length >= 4);
  const bad = await mcp.handle({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'solve_rect_area', arguments: { length: -1, width: 2 } } });
  assert.equal(bad.result.isError, true);
  assert.equal((await mcp.handle({ jsonrpc: '2.0', id: 5, method: 'nope' })).error.code, -32601);
});

test('every pack in packs/, drafts included, passes the schema', () => {
  const { packs: all, skipped } = loadPacks(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'packs'), { report: true });
  assert.deepEqual(skipped.map((s) => `${path.basename(s.file)}: ${s.problems[0]}`), []);
  for (const p of all.values()) for (const q of p.quiz) assert.ok(q.answer >= 0 && q.answer < q.options.length, p.id);
});

test('"no" to "Do you mean...?" answers what was asked, without that card', async () => {
  const card = kb.cards.find((c) => c.id === 'MATH-MENS-02/faq/4');
  const fuzzy = { find: async () => [{ card, score: 0.5 }], cards: kb.cards };
  const ask = await stream('the circle number', { kb: fuzzy });
  assert.equal(ask.plan.context.asked, 'the circle number');
  const no = await stream('no', { context: ask.plan.context, kb: fuzzy });
  assert.notEqual(no.plan?.title, 'Do you mean…');
  assert.ok(['miss', 'chat'].includes(no.tier));
});

test('a card that shares only a common word is not offered: "solar system" is not "two different systems"', async () => {
  const card = { id: 'X/faq/0', kind: 'faq', pack: 'MATH-MENS-02', label: 'Why do we have two different systems?', q: 'Why do we have two different systems?', a: 'Metric and imperial units grew up in different places.', phrasings: [] };
  const fuzzy = { find: async () => [{ card, score: 0.79 }], cards: kb.cards };
  const all = loadPacks(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'packs'), { drafts: true });
  const ask = await stream('explain me solar system', { kb: fuzzy, packs: all });
  assert.notEqual(ask.plan?.title, 'Do you mean…');
});
