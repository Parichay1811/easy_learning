import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wordsToDigits } from '../shared/numbers.js';
import { TEMPLATES, solvePlan, quizStep, missingCues, parseChoice, rng } from '../shared/solvers.js';
import { Vad } from '../shared/vad.js';
import { isEcho } from '../shared/echo.js';
import { questionPlan, resultPlan } from '../shared/test.js';
import { loadPacks } from '../lib/packs.mjs';

const packs = loadPacks(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'packs'), { drafts: false });

test('spoken numbers become digits', () => {
  assert.equal(wordsToDigits('twelve by seven point five metres'), '12 by 7.5 metres');
  assert.equal(wordsToDigits('one hundred and twenty five'), '125');
  assert.equal(wordsToDigits('three and a half'), '3.5');
  assert.equal(wordsToDigits('vector minus three, four'), 'vector -3, 4');
  assert.equal(wordsToDigits('four minus one'), '4 minus 1');
  assert.equal(wordsToDigits('twenty-five'), '25');
});

test('every template solves, cues only spoken words and asks four different options', () => {
  const samples = {
    rect_area: [12, 7.5], rect_perimeter: [8, 5], tri_area: [10, 6], circle_area: [4], circle_circumference: [3],
    vec_add: [3, 4, -1, 2], vec_sub: [6, 1, 2, 5],
  };
  for (const [name, nums] of Object.entries(samples)) {
    const plan = solvePlan(name, TEMPLATES[name].params(nums, 'm', {}), { seed: 3 });
    assert.deepEqual(missingCues(plan), [], name);
    for (let seed = 1; seed < 30; seed++) {
      const quiz = TEMPLATES[name].quiz(rng(seed));
      assert.equal(new Set(quiz.options.map((o) => o.show)).size, quiz.options.length, `${name} seed ${seed}`);
      assert.ok(quiz.options.length >= 3, `${name} seed ${seed} has ${quiz.options.length} options`);
      assert.equal(parseChoice(quiz.options[quiz.answer].say, quiz), quiz.answer, `${name} seed ${seed}: "${quiz.options[quiz.answer].say}"`);
    }
  }
});

test('pack lessons and questions cue only spoken words', () => {
  for (const pack of packs.values()) {
    assert.deepEqual(missingCues({ steps: pack.explain }), [], pack.id);
    for (const q of pack.quiz) {
      assert.deepEqual(missingCues({ steps: [quizStep(q)] }), [], pack.id);
      assert.equal(parseChoice(q.options[q.answer].say, q), q.answer, `${pack.id}: ${q.say}`);
    }
  }
});

test('answers by letter and by position', () => {
  const quiz = packs.get('MATH-MENS-01').quiz[0];
  assert.equal(parseChoice('B', quiz), 1);
  assert.equal(parseChoice('i think it is c', quiz), 2);
  assert.equal(parseChoice('the second one', quiz), 1);
  assert.equal(parseChoice('what is perimeter', quiz), null);
});

test('echo: the teacher heard back is ignored, a new question is not', () => {
  const teacher = [
    "Hi, I'm your Learnigo teacher. Ask me about area and perimeter, circles, or vectors. You can interrupt me any time.",
    "Let's draw it: a rectangle 9 metres long and 4 metres wide.",
    'Area counts the squares inside, so we multiply the length by the width.',
  ];
  // Transcripts from the question log, heard while the teacher was talking.
  assert.ok(isEcho("I'm your learn-a-go teacher. Ask me about area and perimeter, circles, or vectors. You can interrupt me anytime.", teacher));
  assert.ok(isEcho("Let's draw it, a rectangle 9 meters long and 4 meters wide.", teacher));
  assert.ok(isEcho('accounts the squares inside. So we multiply the length by the width.', teacher));
  assert.ok(!isEcho('What is the area of a rectangle 9 by 4?', teacher));
  assert.ok(!isEcho('the length of my garden is 10 meter and the width is 10 meter', teacher));
  assert.ok(!isEcho('go on', teacher));
});

test('test steps: numbered questions and a score with what to review', () => {
  const q = { ...packs.get('MATH-MENS-02').quiz[0], topic: 'MATH-MENS-02', topicTitle: 'Circles' };
  const t = { questions: [q, q], title: 'circles' };
  const step = questionPlan(t, 1);
  assert.match(step.steps[0].say, /^Question 2 of 2\./);
  assert.equal(step.awaiting, q);
  assert.deepEqual(missingCues(step), []);
  const r = resultPlan(t, [{ topicTitle: 'Circles', correct: true }, { topicTitle: 'Circles', correct: false }]);
  assert.match(r.steps[0].say, /You got 1 out of 2\. Good effort\. Have another look at circles\./);
  assert.deepEqual(missingCues(r), []);
});

const frame = (amp) => Float32Array.from({ length: 320 }, (_, i) => amp * Math.sin(i / 3));
const feed = (vad, amp, ms) => Array.from({ length: ms / 20 }, () => vad.push(frame(amp))).flat();

test('voice detection: start, then the whole utterance', () => {
  const vad = new Vad();
  assert.deepEqual(feed(vad, 0.002, 600), []);
  const speech = feed(vad, 0.2, 800);
  assert.equal(speech[0], 'start');
  const end = feed(vad, 0.002, 1000).find((e) => e.type === 'end');
  assert.ok(end, 'the utterance ends after the silence');
  assert.ok(end.audio.length / 16000 > 0.9 && end.audio.length / 16000 < 1.8, `${end.audio.length / 16000}s`);
});

test('voice detection: a click is not speech, and the teacher raises the bar', () => {
  const vad = new Vad();
  feed(vad, 0.002, 600);
  assert.deepEqual(feed(vad, 0.2, 100), []);
  feed(vad, 0.002, 600);
  vad.teacherTalking = true;
  assert.deepEqual(feed(vad, 0.02, 600), [], 'quiet echo while the teacher talks');
  assert.ok(feed(vad, 0.3, 600).includes('start'));
});
