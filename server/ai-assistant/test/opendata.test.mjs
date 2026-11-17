import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpenData, words } from '../lib/opendata.mjs';
import { dataPlan, videoPlan } from '../lib/router.mjs';

const open = createOpenData({ dataDir: '/tmp' });

test('big numbers are said in words', () => {
  assert.equal(words(1438069596), '1.44 billion');
  assert.equal(words(8848.86), '8,849');
  assert.equal(words(1.898e27), '1.9 × 10²⁷');
});

test('each question shape goes to its source, before or after the lessons', () => {
  const first = (q) => open.match(q)?.first;
  assert.equal(first('What does photosynthesis mean?'), true); // Wiktionary
  assert.equal(first('What is the chemical formula of caffeine?'), true); // PubChem
  assert.equal(first('Show me a picture of Saturn'), true); // Commons / NASA
  assert.equal(first('Any recent earthquakes?'), true); // USGS
  assert.equal(first("What's the weather in London?"), true); // MET Norway
  assert.equal(first('What is the GDP of India?'), true); // World Bank
  assert.equal(first('How tall is Mount Everest?'), false); // Wikidata, after the lessons
  assert.equal(first('Who painted the Mona Lisa?'), false);
  assert.equal(open.match('What is 5 + 3?'), null); // the maths rules' job
  assert.equal(open.match('Why is the sky blue?'), null); // Wikipedia's job
});

test('an open-data answer draws its figures beside the first sentence', () => {
  const plan = dataPlan({ title: 'GDP: India', say: ['One.', 'Two.'], figures: [{ op: 'line', items: ['2000: 1', '2010: 2'] }], more: [{ op: 'bignum', value: '$2tn' }], source: { site: 'World Bank', licence: 'CC BY 4.0' } });
  assert.deepEqual(plan.steps[0].draw.map((d) => d.op), ['clear', 'title', 'line', 'note', 'text']);
  assert.deepEqual(plan.steps[1].draw.map((d) => d.op), ['bignum', 'text']);
  assert.match(plan.steps[0].draw[3].text, /World Bank \(CC BY 4\.0\)/);
});

test('with nothing to go on, videos are drawn as cards to tap', () => {
  const plan = videoPlan('how to juggle', [{ id: 'x', title: 'Juggling for beginners | Tips', channel: 'Coach', url: 'https://www.youtube.com/watch?v=x', thumb: '' }]);
  assert.equal(plan.title, 'Watch: Juggle');
  assert.ok(plan.steps[0].draw.some((d) => d.op === 'video'));
  assert.match(plan.steps[1].say, /Juggling for beginners, from Coach/);
});
