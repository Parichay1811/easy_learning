import test from 'node:test';
import assert from 'node:assert/strict';
import { autoViz, condense, packDiagram, withPictures } from '../shared/autoviz.js';

test('a sequence becomes a flow', () => {
  const v = autoViz('First, water evaporates from the sea. Then it cools into clouds. Finally it falls as rain.', { topic: 'water cycle' });
  assert.equal(v.op, 'flow');
  assert.equal(v.items[0], 'Water evaporates from the sea');
});

test('"difference between" becomes a compare panel, in either spelling', () => {
  const v = autoViz('A metre has one hundred centimetres. A centimetre is much smaller than a metre.', { question: 'What is the difference between meters and centimeters?' });
  assert.equal(v.op, 'compare');
  assert.equal(v.a.length, 1);
  assert.equal(v.b.length, 1);
});

test('a conversion becomes from, times, to', () => {
  const v = autoViz('So 3000 metres is 300000 centimetres.', { question: 'How much is 3000 meter in centimeter?' });
  assert.deepEqual(v, { op: 'flow', items: ['3000 m', '× 100', '300,000 cm'] });
});

test('one number is a big number, several are bars, a year is not a number', () => {
  assert.equal(autoViz('The Earth has a radius of about 6371 km.').op, 'bignum');
  assert.equal(autoViz('Mercury is 58 million km away. Venus is 108 million km away.').op, 'bars');
  assert.equal(autoViz('Newton was born in 1643 in England. He described gravity and motion.', { topic: 'Isaac Newton' }).op, 'parts');
});

test('anything else is a concept map round the topic', () => {
  const v = autoViz('An object stays at rest unless a force acts on it. A moving object keeps moving. This is called inertia.', { topic: "Newton's first law" });
  assert.equal(v.op, 'parts');
  assert.equal(v.center, "Newton's first law");
  assert.ok(v.items.length >= 2);
});

test('condense keeps the subject and drops fillers', () => {
  assert.equal(condense('So, basically it is a force that pulls things down, which we call gravity.'), 'A force that pulls things down');
});

test('a pack diagram is chosen by shared words, without its old cue', () => {
  const pack = { explain: [
    { say: 'Rocks come in three types.', draw: [{ op: 'tree', root: 'Rocks', items: ['Igneous', 'Sedimentary', 'Metamorphic'], at: 'types' }] },
    { say: 'Magma cools into igneous rock.', draw: [{ op: 'flow', items: ['Magma', 'Cools', 'Igneous rock'] }] },
  ] };
  assert.equal(packDiagram(pack, 'how does magma become igneous rock').op, 'flow');
  assert.equal(packDiagram(pack, 'three types of rocks').at, undefined);
  assert.equal(packDiagram(pack, 'what is a volcano'), null);
});

test('lesson steps without a picture get one, steps with one keep it', () => {
  const steps = withPictures([
    { say: 'First the seed gets water. Then a root grows. Finally a shoot appears.', draw: [{ op: 'clear' }, { op: 'title', text: 'Plants' }, { op: 'text', text: 'Seeds' }] },
    { say: 'Plants need light.', draw: [{ op: 'bignum', value: '3', label: 'needs' }] },
  ], 'How plants grow');
  assert.equal(steps[0].draw[2].op, 'flow');
  assert.equal(steps[1].draw.length, 1);
});

test('unit conversions are worked out and drawn', async () => {
  const { parseConvert, convertPlan } = await import('../shared/convert.js');
  const { quick } = await import('../lib/router.mjs');
  const c = parseConvert('how much is 3000 meter in centimeter?');
  assert.equal(c.value * c.from[1] / c.to[1], 300000);
  const plan = convertPlan(c);
  assert.deepEqual(plan.steps[0].draw[2].items, ['3,000 m', '× 100', '300,000 cm']);
  assert.equal(parseConvert('how many grams in 2.5 kg').to[2], 'g');
  assert.equal(parseConvert('convert 90 minutes to hours').value, 90);
  assert.equal(parseConvert('3 apples in a box'), null);
  assert.equal(parseConvert('5 kg in metres'), null);
  assert.equal(quick('How much is 3000 meter in centimeter?', { packs: new Map() }).plan.title, 'Converting units');
});

test('places become a map, a journey a route', () => {
  const v = autoViz('Marco Polo travelled from Venice to Beijing, passing through Baghdad.', { topic: 'Marco Polo' });
  assert.equal(v.op, 'map');
  assert.deepEqual(v.items2, ['Venice > Beijing > Baghdad']);
  assert.equal(autoViz('Paris is the capital of France.', { question: 'What is the capital of France?' }).op, 'map');
  assert.notEqual(autoViz('We had turkey for dinner and it was lovely.').op, 'map');
});

test('equations, atoms, percentages, fractions, angles, quotes and circuits get their figure', () => {
  assert.deepEqual(autoViz('The graph of y = x^2 - 4 crosses the x-axis twice.'), { op: 'graph', expr: 'y = x^2 - 4' });
  assert.deepEqual(autoViz('A sodium atom has 11 electrons in three shells.'), { op: 'atom', value: 'Sodium' });
  assert.deepEqual(autoViz('Air is about 78% nitrogen and 21% oxygen, with 1% other gases.').items, ['nitrogen: 78%', 'oxygen: 21%', 'other gases: 1%']);
  assert.equal(autoViz('If you eat 3/4 of a pizza, three slices are gone.').op, 'fraction');
  assert.equal(autoViz('An acute angle is less than 90 degrees, like 45 degrees.').value, '45');
  assert.equal(autoViz('Neil Armstrong said "That is one small step for man, one giant leap for mankind."').label, 'Neil Armstrong');
  assert.deepEqual(autoViz('A simple circuit has a cell, a switch and a bulb.').items, ['cell', 'switch', 'bulb']);
});

test('bullet points give way to a map when a step names places', () => {
  const [step] = withPictures([{ say: 'The Nile flows north through Egypt and Sudan to the Mediterranean Sea.', draw: [{ op: 'bullets', items: ['Flows north', 'Long river'] }, { op: 'text', text: 'The Nile' }] }], 'Ancient Egypt');
  assert.equal(step.draw[0].op, 'map');
});

test('the expression parser never runs code', async () => {
  const { parseExpr } = await import('../shared/expr.js');
  assert.equal(parseExpr('y = 2x + 1')(3), 7);
  assert.equal(parseExpr('alert(1)'), null);
  assert.equal(parseExpr('constructor'), null);
});
