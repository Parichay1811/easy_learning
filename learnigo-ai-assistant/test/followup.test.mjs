import test from 'node:test';
import assert from 'node:assert/strict';
import { followUp, nextQuestions, subjectOf } from '../lib/followup.mjs';

const about = (subject, q) => ({ subject, history: q ? [{ q, a: '' }] : [] });

test('follow-ups become whole questions about what was just said', () => {
  assert.equal(followUp('When was he born?', about('Albert Einstein')).text, 'When was Albert Einstein born?');
  assert.equal(followUp('who climbed it first?', about('Mount Everest')).text, 'who climbed Mount Everest first?');
  assert.equal(followUp('how many people live there?', about('France')).text, 'how many people live in France');
  assert.deepEqual(followUp('tell me more', about('Volcano')), { text: 'Tell me more about Volcano', kind: 'more' });
  assert.equal(followUp('show me a picture', about('Volcano')).kind, 'picture');
  assert.equal(followUp('explain it simpler', about('Photosynthesis')).kind, 'simpler');
  assert.equal(followUp('when?', about('Telephone', 'Who invented the telephone?')).text, 'When was the telephone invented?');
});

test('a question that names its own thing is left alone', () => {
  assert.equal(followUp('What is the capital of France and its population?', about('Volcano')).kind, null);
  assert.equal(followUp('is it raining in London?', about('Volcano')).kind, null);
  assert.equal(followUp('is there life on Mars?', about('France')).kind, null);
  assert.equal(followUp('When was he born?', {}).kind, null); // nothing said yet
  assert.equal(followUp('is it A?', { subject: 'Fractions', awaiting: { answer: 0 } }).kind, null); // a quiz answer
});

test('what to ask next suits a person, a place or a thing', () => {
  const plan = (about, say, kind = 'chat') => ({ kind, about, steps: [{ say }] });
  assert.match(nextQuestions(plan('German-born physicist', 'Albert Einstein was a scientist.'), 'Albert Einstein')[0], /born/);
  assert.match(nextQuestions(plan('country in Western Europe', 'France is a country.'), 'France')[0], /Where is France/);
  assert.ok(nextQuestions(plan('', 'A volcano is a mountain with lava.'), 'Volcano').includes('Show me a picture of a volcano'));
  assert.equal(subjectOf({ kind: 'chat', watch: 'Good question' }), null);
});
