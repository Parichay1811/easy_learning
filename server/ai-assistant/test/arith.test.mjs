// Maths said to a child is worked out in code: plain sums, spoken numbers,
// rounding, unit conversions, shapes, quiz answers and the board's graphs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArith, arithPlan } from '../shared/arith.js';
import { wordsToDigits, fmt } from '../shared/numbers.js';
import { parseConvert, convertPlan } from '../shared/convert.js';
import { findShape } from '../shared/shapes.js';
import { parseChoice } from '../shared/solvers.js';
import { autoViz } from '../shared/autoviz.js';
import { normalize, quick } from '../lib/router.mjs';
import { speakable } from '../lib/speech-text.mjs';

const answer = (q) => { const p = parseArith(normalize(q)); return p && arithPlan(p).steps[0]; };

test('plain sums are worked out exactly', () => {
  const cases = {
    'what is 7 times 8': '7 × 8 = 56', 'what is 7 x 8': '7 × 8 = 56', '20% of 150': '20% of 150 = 30', 'half of 30': 'half of 30 = 15',
    '3/4 + 1/8': '3/4 + 1/8 = 7/8', '1/2 + 1/3': '1/2 + 1/3 = 5/6', '0.1 + 0.2': '0.1 + 0.2 = 0.3', '-5 + 3': '−5 + 3 = −2',
    'what is 1,000 x 3': '1000 × 3 = 3000', 'twelve divided by four': '12 ÷ 4 = 3', '12 / 5': '12 ÷ 5 = 2.4', 'square root of 49': '√49 = 7',
    '5 squared': '5² = 25', 'what is (3 + 4) * 2': '(3 + 4) × 2 = 14', 'what is 3/4 of 20': '3/4 of 20 = 15', 'subtract 3 from 10': '10 − 3 = 7',
    'what is 2 to the power of 10': '2 ^ 10 = 1024',
  };
  for (const [q, want] of Object.entries(cases)) assert.equal(answer(q)?.draw[2].text, want, q);
  assert.match(answer('what is 7 times 8').say, /7 groups of 8/);
  assert.match(answer('3/4 + 1/8').say, /3\/4 is 6\/8/);
  assert.match(answer('what is 10 divided by 0').say, /cannot divide by zero/);
});

test('words that are not a sum are left for the rest of the router', () => {
  for (const q of ['what is 7', 'how old is 7', 'what is 7 x 8 garden', 'a garden 12 by 7 metres', 'what is photosynthesis']) assert.equal(parseArith(normalize(q)), null, q);
  // "7 x 8" is a sum on its own, but the next shape inside a rectangle lesson.
  assert.equal(quick('what is 7 x 8', { packs: new Map() }).plan.title, 'Working it out');
  assert.notEqual(quick('10 x 4', { packs: new Map(), context: { template: 'rect_area', params: { unit: 'm' } } }).plan.title, 'Working it out');
  assert.match(quick('1,200 cm by 300 cm rectangle area', { packs: new Map() }).plan.steps[0].say, /1200/);
});

test('spoken numbers: one number at a time, and "the one" is a word', () => {
  const cases = {
    'the one with radius five': 'the one with radius 5', 'three four': '3 4', 'nine nine nine': '9 9 9', 'two hundred and five': '205',
    'twenty one': '21', 'one thousand two hundred': '1200', 'seven point five': '7.5', 'four minus one': '4 minus 1', 'minus three': '-3',
  };
  for (const [said, want] of Object.entries(cases)) assert.equal(wordsToDigits(said), want, said);
});

test('small answers keep their digits', () => {
  assert.equal(fmt(0.075), '0.075');
  assert.equal(fmt(0.0016), '0.0016');
  assert.equal(fmt(0.1 + 0.2 - 0.3), '0');
  assert.equal(fmt(12.345), '12.35');
});

test('conversions keep the student\'s number and tiny results', () => {
  const said = (q) => convertPlan(parseConvert(q)).steps[1].say;
  assert.match(said('123456789 mm to m'), /123,456,789 millimetres is 123,456\.789 metres/);
  assert.match(said('1 mg in tonnes'), /0\.000000001 tonnes/);
});

test('shapes: a rhombus is found, a heptagon\'s angle is right', () => {
  assert.equal(findShape('rhombus')?.name, 'Rhombus');
  assert.equal(findShape('squares')?.name, 'Square');
  assert.ok(findShape('heptagon').facts.includes('Each angle 128.6°'));
});

test('quiz answers: a vector said with minus, and no option D among three', () => {
  const vec = { options: [{ show: '(2, 9)', col: [2, 9] }, { show: '(2, −9)', col: [2, -9] }, { show: '(−2, 9)', col: [-2, 9] }] };
  assert.equal(parseChoice('2 minus 9', vec), 1);
  assert.equal(parseChoice('two, minus nine', vec), 1);
  assert.equal(parseChoice('D', vec), null);
});

test('graphs and pictures read the words right', () => {
  assert.equal(autoViz('The graph of y = x squared is a parabola.').expr, 'y = x^2');
  assert.equal(autoViz('The line y = x plus 3 crosses at 3.').expr, 'y = x + 3');
  assert.notEqual(autoViz('A car goes 42 km in 2 hours.')?.op, 'flow');
  assert.notEqual(autoViz('He discovered the electron, the tiny part of an atom.', { question: 'He discovered the electron' })?.op, 'atom');
  assert.doesNotMatch(JSON.stringify(autoViz('She scored 5 goals and then 8 goals.')), /\d g\b/);
});

test('the voice reads fractions', () => {
  assert.equal(speakable('3/4 is 6/8'), '3 over 4 is 6 over 8');
});
