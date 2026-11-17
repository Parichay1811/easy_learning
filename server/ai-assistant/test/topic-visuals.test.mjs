import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSimsMeta, loadTopics } from '../lib/sims-meta.mjs';
import { topicVisual } from '../shared/topic-visuals.js';

const sims = await loadSimsMeta();
const topics = loadTopics();
const pick = (id) => { const p = topicVisual(topics.get(id), sims); return p?.name || p?.op; };

test('engineering, body, kids, philosophy, psychology and tech topics open on their own scene', () => {
  assert.equal(pick('ENGR-13'), 'four-stroke-engine');
  assert.equal(pick('ENGR-10'), 'bridge-types');
  assert.equal(pick('MED-02'), 'xray-imaging');
  assert.equal(pick('BODY-07'), 'eye-vision');
  assert.equal(pick('BODY-06'), 'brain-parts');
  assert.equal(pick('KIDS-ANIM-04'), 'butterfly-life-cycle');
  assert.equal(pick('KIDS-WORLD-13'), 'moon-phases');
  assert.equal(pick('PHILO-03'), 'plato-cave');
  assert.equal(pick('PHILO-25'), 'personal-identity');
  assert.equal(pick('PSY-13'), 'classical-conditioning');
  assert.equal(pick('TECH-07'), 'gps-trilateration');
  assert.equal(pick('KIDS-NUM-01'), 'adding-apples');
  assert.equal(pick('KIDS-ANIM-17'), 'chick-hatching');
  assert.equal(pick('KIDS-WORLD-23'), 'nocturnal-animals'); // day and night animals, not day and night
  assert.equal(pick('KIDS-ART-01'), 'colour-mixing');
  assert.equal(pick('KIDS-SPACE-02'), 'planets-parade');
  assert.equal(pick('RELIG-21'), 'gita-chariot');
  assert.equal(pick('RELIG-06'), 'five-pillars');
  assert.equal(pick('BIOX-04'), 'protein-synthesis');
  assert.equal(pick('SPACE-05'), 'black-hole');
  assert.equal(pick('HISTW-22'), 'french-revolution');
  assert.equal(pick('MUSIC-02'), 'music-staff');
});

test('a word in a topic does not pull in another subject\'s picture', () => {
  assert.notEqual(pick('KIDS-ANIM-11'), 'unit-circle'); // "polar" animals
  assert.notEqual(pick('KIDS-ANIM-10'), 'frog-life-cycle'); // rainforest frogs
  assert.notEqual(pick('KIDS-ANIM-16'), 'seasons'); // migration
  assert.notEqual(pick('PSY-07'), 'limits'); // "approaches"
  assert.notEqual(pick('TECH-10'), 'limits');
  assert.notEqual(pick('KIDS-WORD-03'), 'wave-types'); // rhyming is not a sound wave
});
