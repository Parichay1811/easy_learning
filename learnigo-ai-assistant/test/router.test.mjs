import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPacks } from '../lib/packs.mjs';
import { quick, respond, parseMath, normalize } from '../lib/router.mjs';
import { sentenceSplitter } from '../lib/llm.mjs';
import { cleanTopic, fromQuestion } from '../lib/fast.mjs';

const packs = loadPacks(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'packs'), { drafts: false });
const ask = (text, context = {}) => quick(text, { packs, context, seed: 7 });

// Runs respond() and collects what it streams.
async function stream(text, opts = {}) {
  const events = [];
  const todos = [];
  const tier = await respond(text, { packs, seed: 7, emit: (e) => events.push(e), onTodo: (q, x) => todos.push({ q, ...x }), ...opts });
  return { tier, events, todos, types: events.map((e) => e.type) };
}
const fakeLLM = ({ classify = null, sentences = [] } = {}) => ({
  available: async () => true,
  classify: async () => classify,
  chat: async (text, { onSentence }) => { sentences.forEach((s, i) => onSentence(s, i)); return sentences.length; },
});
const fakeFast = { ack: async () => ({ say: 'Ooh, the Mona Lisa. Let me think.', topic: 'The Mona Lisa' }) };

test('a garden question becomes a rectangle area lesson, without any model', () => {
  const { plan, tier } = ask('My garden is 12 m by 7.5 m, how much turf do I need?');
  assert.equal(tier, 'rules');
  assert.equal(plan.context.template, 'rect_area');
  assert.deepEqual(plan.context.params, { l: 12, w: 7.5, unit: 'm' });
  assert.match(plan.steps[2].say, /90 square metres/);
  assert.equal(plan.awaiting, undefined, 'no question unless the student asks for one');
  assert.match(plan.steps.at(-1).say, /Say test me/);
});

test('fence means perimeter; spoken numbers work', () => {
  const { plan } = ask('how much fencing for a field eight metres by five metres');
  assert.equal(plan.context.template, 'rect_perimeter');
  assert.deepEqual(plan.context.params, { l: 8, w: 5, unit: 'm' });
});

test('circles: a diameter is halved; hoops, pizzas and "middle to rim" are understood', () => {
  assert.deepEqual(parseMath(normalize('area of a circle with diameter ten centimetres')), { template: 'circle_area', params: { r: 5, d: 10, unit: 'cm' } });
  assert.equal(parseMath(normalize('how far round a wheel of radius 30 cm')).template, 'circle_circumference');
  assert.deepEqual(parseMath(normalize('how big is the inside of a hoop 3 m from middle to rim')), { template: 'circle_area', params: { r: 3, unit: 'm' } });
  assert.deepEqual(parseMath(normalize('a pizza is 30 cm across, how much pizza is there')), { template: 'circle_area', params: { r: 15, d: 30, unit: 'cm' } });
});

test('a follow-up with only numbers reuses the last template', () => {
  const { plan } = ask("what if it's 10 by 4", { template: 'rect_area', params: { l: 12, w: 7.5, unit: 'm' } });
  assert.deepEqual(plan.context.params, { l: 10, w: 4, unit: 'm' });
});

test('vectors, with spoken minus signs', () => {
  assert.deepEqual(parseMath(normalize('add vectors 3 4 and minus 1 2')), { template: 'vec_add', params: { a: [3, 4], b: [-1, 2] } });
  assert.equal(parseMath(normalize('subtract vector 2, 5 from 6, 1')).template, 'vec_sub');
});

test('short commands are controls', () => {
  assert.equal(ask('Stop.').plan.action, 'stop');
  assert.equal(ask('okay go on').plan.action, 'resume');
  assert.equal(ask('say that again').plan.action, 'repeat');
  assert.equal(ask('slow down please').plan.action, 'slower');
});

test('common questions and topics come from the packs', () => {
  const faq = ask('Why do we halve for a triangle?');
  assert.equal(faq.tier, 'packs');
  assert.match(faq.plan.steps[0].say, /Two copies/);
  assert.equal(faq.plan.context.offer, 'test');
  const lesson = ask('teach me circles');
  assert.equal(lesson.plan.topic, 'MATH-MENS-02');
  assert.equal(lesson.plan.awaiting, undefined);
});

test('an answer to the waiting question is marked', () => {
  const quiz = packs.get('MATH-MENS-02').quiz[0];
  assert.equal(ask("it's B", { awaiting: quiz }).plan.title, 'Correct');
  const wrong = ask('100 pi', { awaiting: quiz });
  assert.equal(wrong.plan.title, 'Not quite');
  assert.match(wrong.plan.steps[0].say, /diameter/);
});

test('tests: asked for, the teacher confirms how many, then builds them', () => {
  const setup = ask('quiz me on circles');
  assert.match(setup.plan.steps[0].say, /How many questions on circles would you like: 5, 10 or 20\?/);
  assert.equal(setup.plan.context.offer, 'test-count');
  const built = ask('five', setup.plan.context);
  assert.equal(built.plan.kind, 'test');
  assert.equal(built.plan.test.questions.length, 5);
  assert.ok(built.plan.test.questions.every((q) => q.topic === 'MATH-MENS-02' && q.options.length >= 3));
  assert.equal(new Set(built.plan.test.questions.map((q) => q.say)).size, 5, 'no repeats');
});

test('tests: a number in the request skips the question; subjects and exams set the scope', () => {
  const direct = ask('give me 3 questions on vectors');
  assert.equal(direct.plan.kind, 'test');
  assert.equal(direct.plan.test.questions.length, 3);
  const maths = ask('test me for GCSE maths');
  assert.deepEqual(maths.plan.context.scope.ids.sort(), ['MATH-MENS-01', 'MATH-MENS-02', 'MATH-VEC-01']);
  assert.match(maths.plan.steps[0].say, /maths at GCSE level/);
  const mixed = ask('10', maths.plan.context);
  assert.equal(new Set(mixed.plan.test.questions.map((q) => q.topic)).size, 3, 'questions from every topic in scope');
});

test('tests: answers during a test have no "ask me anything", "I don\'t know" reveals', () => {
  const quiz = { ...packs.get('MATH-VEC-01').quiz[0], topic: 'MATH-VEC-01' };
  const right = ask('B', { awaiting: quiz, test: true });
  assert.equal(right.plan.correct, true);
  assert.doesNotMatch(right.plan.steps[0].say, /Ask me anything/);
  const stuck = ask('no idea', { awaiting: quiz, test: true });
  assert.equal(stuck.plan.correct, false);
  assert.doesNotMatch(stuck.plan.steps[0].say, /test me/);
});

// From the question log: none of these are missing lessons.
test('conversation: "I don\'t know" to a question reveals the answer kindly', () => {
  const quiz = packs.get('MATH-MENS-02').quiz[0];
  for (const said of ["I don't know the answer.", "I don't know the answer, I don't know the answer.", 'just tell me the answer']) {
    const { plan, tier } = ask(said, { awaiting: quiz });
    assert.equal(tier, 'talk', said);
    assert.match(plan.steps[0].say, /^That's okay.*The answer is B/, said);
  }
});

test('conversation: yes and no to an offer, small talk, thanks', () => {
  const offer = { topic: 'MATH-MENS-01', template: 'rect_area', offer: 'test' };
  assert.match(ask('yes please', offer).plan.steps[0].say, /How many questions on perimeter and area/, 'yes asks how many');
  assert.match(ask('No, thanks.', offer).plan.steps[0].say, /No problem/);
  assert.equal(ask('hello').tier, 'talk');
  assert.match(ask('how are you today').plan.steps[0].say, /great/);
  assert.match(ask('thank you').plan.steps[0].say, /welcome/);
  assert.match(ask('what can you do').plan.steps[0].say, /Say test me for practice questions/);
});

test('conversation: a half sentence waits for the rest; mumbles are asked again', () => {
  const frag = ask('What is the advantage I');
  assert.equal(frag.plan.kind, 'fragment');
  assert.equal(frag.plan.prefix, 'what is the advantage i');
  for (const said of ['the Aroheadhuche.', 'Darronto.']) assert.equal(ask(said).tier, 'unclear', said);
  assert.equal(ask('photosynthesis'), null, 'a real word is a question for the model, not a mumble');
});

test('streamed: rules answer at once, with no ack and no model', async () => {
  const { tier, types } = await stream('teach me circles', { llm: fakeLLM(), fast: fakeFast });
  assert.equal(tier, 'packs');
  assert.deepEqual(types, ['plan']);
});

test('streamed: a general question gets an ack, then a spoken answer, and a TODO', async () => {
  const llm = fakeLLM({ sentences: ['Leonardo da Vinci painted the Mona Lisa.', 'It is in Paris.'] });
  const { tier, events, types, todos } = await stream('Who painted the Mona Lisa?', { llm, fast: fakeFast });
  assert.equal(tier, 'chat');
  assert.deepEqual(types, ['ack', 'plan', 'step', 'step', 'end']);
  assert.equal(events[0].say, 'Ooh, the Mona Lisa. Let me think.');
  assert.equal(events[1].title, 'The Mona Lisa');
  assert.deepEqual(todos, [{ q: 'Who painted the Mona Lisa?', answered: true }]);
});

test('streamed: numbers no rule understands go to the classifier, then a lesson', async () => {
  const llm = fakeLLM({ classify: { topic: 'MATH-MENS-02', intent: 'solve', template: 'circle_area', a: 3, b: 0, c: 0, d: 0, unit: 'm' } });
  const { tier, events } = await stream('how much space inside a 3 m loop of string pulled tight', { llm, fast: fakeFast });
  assert.equal(tier, 'llm');
  assert.equal(events.find((e) => e.type === 'plan').context.template, 'circle_area');
});

test('streamed: with no model at all, a real question is a miss and a TODO', async () => {
  const { tier, todos } = await stream('Who painted the Mona Lisa?', {});
  assert.equal(tier, 'miss');
  assert.deepEqual(todos, [{ q: 'Who painted the Mona Lisa?', answered: false }]);
});

test('sentences are split as they stream, decimals stay whole', () => {
  const out = [];
  const s = sentenceSplitter((x) => out.push(x));
  for (const chunk of ['The area is 3', '.5 square metres. That', "'s **half** of 7! Done"]) s.push(chunk);
  s.end();
  assert.deepEqual(out, ['The area is 3.5 square metres.', "That's half of 7!", 'Done']);
});

test('topics from the fast model are cleaned, chatter is dropped', () => {
  assert.equal(cleanTopic('"The Mona Lisa."'), 'The Mona Lisa');
  assert.equal(cleanTopic('I think the question is about the very long history of art'), null);
  assert.ok(fromQuestion('The Mona Lisa', 'Who painted the Mona Lisa?'));
  assert.ok(fromQuestion('volcanoes', 'how does a volcano erupt'));
  assert.ok(!fromQuestion('Michelangelo', 'Who painted the Mona Lisa?'), 'an answer is not a topic');
});
