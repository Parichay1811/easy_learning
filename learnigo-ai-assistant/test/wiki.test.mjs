import test from 'node:test';
import assert from 'node:assert/strict';
import { createWiki } from '../lib/wiki.mjs';

const wiki = createWiki({ dataDir: '/tmp' });

test('questions are cut to their subject before searching', () => {
  assert.equal(wiki.subject('Come on show me what is bubble sorting'), 'bubble sort');
  assert.equal(wiki.subject('Show me what is bubble'), 'bubble');
  assert.equal(wiki.subject('Okay so can you explain photosynthesis'), 'photosynthesis');
  assert.equal(wiki.subject('Hey teacher, who was Gandhi?'), 'Gandhi');
  assert.equal(wiki.subject('I want to know about volcanoes'), 'volcanoes');
  assert.equal(wiki.subject('Why do we have seasons?'), 'seasons');
  assert.equal(wiki.subject('How does the heart work?'), 'heart');
});

test('the model refusing or hedging is caught', async () => {
  const src = (await import('node:fs')).readFileSync(new URL('../lib/router.mjs', import.meta.url), 'utf8');
  const HEDGE = new RegExp(src.match(/const HEDGE = \/(.+)\/i;/)[1], 'i');
  for (const s of ['I cannot show you the concept of bubble sorting because it is not a school topic.', 'I am not sure.', 'You can practice these with me.', 'Sorry, I cannot help with that.']) assert.ok(HEDGE.test(s), s);
  for (const s of ['Bubble sort compares neighbours and swaps them.', 'The sky looks blue because air scatters blue light.']) assert.ok(!HEDGE.test(s), s);
  // The model talking about itself, anywhere in a sentence (seen with "Tell me something about Narendra Modi").
  const SELF = new RegExp(src.match(/const SELF = \/(.+)\/i;/)[1], 'i');
  for (const s of ['I am sorry, but I cannot answer that question.', 'I am not a musician, and I do not have personal opinions or experiences.', 'I am an AI assistant, and I cannot be a musician.', 'If you are curious about another subject, I will answer your question.']) assert.ok(SELF.test(s), s);
  for (const s of ['Narendra Modi is the prime minister of India.', 'Aeroplanes fly because their wings make lift.', 'I am because we are is the idea of ubuntu.']) assert.ok(!SELF.test(s), s);
});

test('speech fixing leaves real words with endings alone', async () => {
  const { createHeard } = await import('../lib/heard.mjs');
  const { dictionary } = await import('../lib/converse.mjs');
  const heard = createHeard(new Map([['p', { title: 'Photosynthesis', keywords: ['inverted image'] }]]));
  assert.equal(heard.fix('who invented the telephone'), 'who invented the telephone');
  if (dictionary().size) assert.equal(heard.fix('photosinthesis'), 'photosynthesis');
});
