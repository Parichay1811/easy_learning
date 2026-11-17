// Lesson templates. Each turns a few numbers into a short spoken, drawn
// lesson, ending with an invitation to practise (questions come when the
// student asks for a test, from the same template). They are pure
// functions shared by the server (the router) and the browser (tapped
// answers), so the maths is always code and never the LLM.
//
// A plan is { kind, topic, title, steps: [{ say, draw: [op] }], awaiting?, context? }.
// Every op may have `at` (a word of `say`, or seconds); keys ending in "At"
// (gridAt, radiusAt...) are cues too. The board draws the ops; see public/board.js.
import { fmt, sayNum, units, wordsToDigits } from './numbers.js';

export const LETTERS = ['A', 'B', 'C', 'D'];

// A seeded random source, so the same seed rebuilds the same question.
export function rng(seed = Date.now()) {
  let s = seed >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));

// The right option and the tempting wrong ones ([option, why it is wrong]),
// shuffled. Duplicates of the right answer are dropped.
function choices(r, right, wrongs) {
  const seen = new Set([right.show]);
  const list = [{ ...right, ok: true }];
  for (const [o, why] of wrongs) if (!seen.has(o.show) && list.length < 4) { seen.add(o.show); list.push({ ...o, why }); }
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  const wrong = {};
  list.forEach((o, i) => { if (!o.ok && o.why) wrong[i] = o.why; });
  return { options: list.map(({ show, say, col }) => ({ show, say, ...(col ? { col } : {}) })), answer: list.findIndex((o) => o.ok), wrong };
}
const len = (v, u) => ({ show: `${fmt(v)} ${u.short}`.trim(), say: `${sayNum(v)} ${u.long}` });
const area = (v, u) => ({ show: `${fmt(v)} ${u.sq}`, say: `${sayNum(v)} ${u.sqLong}` });
const piLen = (k, u) => ({ show: `${fmt(k)}π ${u.short}`.trim(), say: `${sayNum(k)} pi ${u.long}` });
const piArea = (k, u) => ({ show: `${fmt(k)}π ${u.sq}`, say: `${sayNum(k)} pi ${u.sqLong}` });
const col = (v) => ({ show: `(${fmt(v[0])}, ${fmt(v[1])})`, say: `${sayNum(v[0])} over ${sayNum(v[1])}`, col: v });
const across = (x) => (x > 0 ? `${fmt(x)} right` : x < 0 ? `${fmt(-x)} left` : 'nothing across');
const upDown = (y) => (y > 0 ? `${fmt(y)} up` : y < 0 ? `${fmt(-y)} down` : 'nothing up or down');
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const neg = (v) => [-v[0], -v[1]];
const rectLabels = (l, w, u) => ({ bottom: `${fmt(l)} ${u.short}`.trim(), right: `${fmt(w)} ${u.short}`.trim() });
const pos = (...v) => v.every((x) => Number.isFinite(x) && x > 0 && x < 1e6);

export const TEMPLATES = {
  rect_area: {
    topic: 'MATH-MENS-01', what: 'area of a rectangle',
    params: ([l, w], unit) => (pos(l, w) ? { l, w, unit } : null),
    solve({ l, w, unit }) {
      const u = units(unit);
      const A = l * w;
      return {
        title: `Area of a ${fmt(l)} by ${fmt(w)} rectangle`,
        steps: [
          { say: `Let's draw it: a rectangle ${sayNum(l)} ${u.long} long and ${sayNum(w)} ${u.long} wide.`,
            draw: [{ op: 'clear' }, { op: 'title', text: 'Area of a rectangle' }, { op: 'rect', id: 'shape', l, w, labels: rectLabels(l, w, u), at: 'rectangle' }] },
          { say: 'Area counts the squares inside, so we multiply the length by the width.',
            draw: [{ op: 'grid', target: 'shape', at: 'squares' }, { op: 'formula', text: 'Area = length × width', at: 'multiply' }] },
          { say: `${sayNum(l)} times ${sayNum(w)} is ${sayNum(A)} ${u.sqLong}.`,
            draw: [{ op: 'formula', text: `${fmt(l)} × ${fmt(w)} = ${fmt(A)}`, at: 'times' }, { op: 'box', text: `${fmt(A)} ${u.sq}`, at: 'is', sfx: 'correct' }] },
          { say: `Careful: area is in square units. The distance round the edge is the perimeter, ${sayNum(2 * (l + w))} ${u.long}, which is a different thing.`,
            draw: [{ op: 'note', text: `Trap: the perimeter is ${fmt(2 * (l + w))} ${u.short}, not the area`.replace(/ +,/g, ','), at: 'perimeter' }] },
        ],
      };
    },
    quiz(r) {
      const l = int(r, 4, 12);
      const w = int(r, 2, Math.min(9, l - 1));
      const u = units('m');
      return {
        say: `A garden bed is ${l} metres by ${w} metres. How much turf covers it?`,
        show: `A garden bed is ${l} m by ${w} m. How much turf covers it?`,
        figure: { op: 'rect', l, w, labels: rectLabels(l, w, u) },
        why: `Area is length times width: ${l} times ${w} is ${l * w} square metres.`,
        ...choices(r, area(l * w, u), [
          [len(2 * (l + w), u), 'That is the perimeter, the fence round the edge, not the turf inside.'],
          [area(l + w, u), 'That adds two sides. Area multiplies the length by the width.'],
          [len(l * w, u), 'Right number, wrong unit. Turf covers a surface, so it is square metres.'],
        ]),
      };
    },
  },

  rect_perimeter: {
    topic: 'MATH-MENS-01', what: 'perimeter of a rectangle',
    params: ([l, w], unit) => (pos(l, w) ? { l, w, unit } : null),
    solve({ l, w, unit }) {
      const u = units(unit);
      const P = 2 * (l + w);
      return {
        title: `Perimeter of a ${fmt(l)} by ${fmt(w)} rectangle`,
        steps: [
          { say: `Here is the shape: ${sayNum(l)} ${u.long} long and ${sayNum(w)} ${u.long} wide.`,
            draw: [{ op: 'clear' }, { op: 'title', text: 'Perimeter of a rectangle' }, { op: 'rect', id: 'shape', l, w, labels: rectLabels(l, w, u), at: 'shape' }] },
          { say: 'The perimeter is the distance all the way round, so we walk along all four sides.',
            draw: [{ op: 'trace', target: 'shape', at: 'round' }, { op: 'formula', text: 'Perimeter = 2 × (length + width)', at: 'four' }] },
          { say: `${sayNum(l)} plus ${sayNum(w)} is ${sayNum(l + w)}, and two lots of that is ${sayNum(P)} ${u.long}.`,
            draw: [{ op: 'formula', text: `2 × (${fmt(l)} + ${fmt(w)}) = ${fmt(P)}`, at: 'plus' }, { op: 'box', text: `${fmt(P)} ${u.short}`.trim(), at: 'two', sfx: 'correct' }] },
          { say: `A perimeter is a length, so it is in plain ${u.long}, not square ${u.long}.`,
            draw: [{ op: 'note', text: 'Trap: perimeter is a length, so no square units', at: 'length' }] },
        ],
      };
    },
    quiz(r) {
      const l = int(r, 5, 14);
      const w = int(r, 2, Math.min(9, l - 1));
      const u = units('m');
      return {
        say: `A field is ${l} metres by ${w} metres. How much fence goes all the way round?`,
        show: `A field is ${l} m by ${w} m. How much fence goes all the way round?`,
        figure: { op: 'rect', l, w, labels: rectLabels(l, w, u) },
        why: `There are four sides: two times ${l} plus ${w} is ${2 * (l + w)} metres.`,
        ...choices(r, len(2 * (l + w), u), [
          [area(l * w, u), 'That is the area inside, not the fence round it.'],
          [len(l + w, u), 'That is only two sides. A rectangle has four.'],
          [len(2 * l + w, u), 'One side is missing. Add all four sides.'],
        ]),
      };
    },
  },

  tri_area: {
    topic: 'MATH-MENS-01', what: 'area of a triangle',
    params: ([b, h], unit) => (pos(b, h) ? { b, h, unit } : null),
    solve({ b, h, unit }) {
      const u = units(unit);
      const A = (b * h) / 2;
      return {
        title: `Area of a triangle, base ${fmt(b)}, height ${fmt(h)}`,
        steps: [
          { say: `A triangle with a base of ${sayNum(b)} and a height of ${sayNum(h)} ${u.long}.`,
            draw: [{ op: 'clear' }, { op: 'title', text: 'Area of a triangle' }, { op: 'tri', id: 'shape', b, h, labels: { base: `${fmt(b)} ${u.short}`.trim(), height: `${fmt(h)} ${u.short}`.trim() }, at: 'triangle', heightAt: 'height' }] },
          { say: 'Two copies of it make a rectangle, so the triangle is half of base times height.',
            draw: [{ op: 'formula', text: 'Area = ½ × base × height', at: 'half' }] },
          { say: `Half of ${sayNum(b)} times ${sayNum(h)} is ${sayNum(A)} ${u.sqLong}.`,
            draw: [{ op: 'formula', text: `½ × ${fmt(b)} × ${fmt(h)} = ${fmt(A)}`, at: 'times' }, { op: 'box', text: `${fmt(A)} ${u.sq}`, at: 'is', sfx: 'correct' }] },
          { say: 'Use the straight up height, never the slanted side, and do not forget the half.',
            draw: [{ op: 'note', text: 'Trap: forgetting the half, or using the slanted side', at: 'slanted' }] },
        ],
      };
    },
    quiz(r) {
      const b = 2 * int(r, 2, 7);
      const h = int(r, 3, 9);
      const u = units('cm');
      return {
        say: `A triangle has a base of ${b} centimetres and a height of ${h} centimetres. What is its area?`,
        show: `Base ${b} cm, height ${h} cm. What is the area?`,
        figure: { op: 'tri', b, h, labels: { base: `${b} cm`, height: `${h} cm` } },
        why: `Half of ${b} times ${h} is ${(b * h) / 2} square centimetres.`,
        ...choices(r, area((b * h) / 2, u), [
          [area(b * h, u), 'That forgot the half. A triangle is half of the rectangle around it.'],
          [area(b + h, u), 'That adds the sides. Multiply base by height, then halve.'],
          [area((b + h) / 2, u), 'That halves the sum. Multiply first, then halve.'],
        ]),
      };
    },
  },

  circle_area: {
    topic: 'MATH-MENS-02', what: 'area of a circle',
    params: ([r], unit, { d } = {}) => (pos(r) ? { r, unit, ...(d ? { d } : {}) } : null),
    solve({ r, d, unit }) {
      const u = units(unit);
      const k = r * r;
      const first = d
        ? { say: `The diameter is ${sayNum(d)} ${u.long}, so the radius is half of that: ${sayNum(r)}.`,
            draw: [{ op: 'clear' }, { op: 'title', text: 'Area of a circle' }, { op: 'circle', id: 'c', r, labels: { d: `d = ${fmt(d)} ${u.short}`.trim(), r: `r = ${fmt(r)} ${u.short}`.trim() }, diameterAt: 'diameter', radiusAt: 'radius' }] }
        : { say: `Here is a circle with a radius of ${sayNum(r)} ${u.long}.`,
            draw: [{ op: 'clear' }, { op: 'title', text: 'Area of a circle' }, { op: 'circle', id: 'c', r, labels: { r: `r = ${fmt(r)} ${u.short}`.trim() }, radiusAt: 'radius' }] };
      return {
        title: `Area of a circle, radius ${fmt(r)}`,
        steps: [
          first,
          { say: 'The area of a circle is pi times the radius squared.',
            draw: [{ op: 'grid', target: 'c', at: 'area' }, { op: 'formula', text: 'A = π × r²', at: 'pi' }] },
          { say: `${sayNum(r)} squared is ${sayNum(k)}, so the area is ${sayNum(k)} pi, which is about ${sayNum(Math.PI * k, 1)} ${u.sqLong}.`,
            draw: [{ op: 'formula', text: `π × ${fmt(r)}² = ${fmt(k)}π`, at: 'squared' }, { op: 'box', text: `${fmt(k)}π ≈ ${fmt(Math.PI * k, 1)} ${u.sq}`, at: 'about', sfx: 'correct' }] },
          { say: `Use the radius, not the diameter. With the diameter you would get ${sayNum(4 * k)} pi, four times too big.`,
            draw: [{ op: 'note', text: 'Trap: halve the diameter before you square it', at: 'diameter' }] },
        ],
      };
    },
    quiz(r0) {
      const r = int(r0, 2, 9);
      const u = units('m');
      return {
        say: `A round pond has a radius of ${r} metres. What is its area, in terms of pi?`,
        show: `A round pond has radius ${r} m. Its area, in terms of π?`,
        figure: { op: 'circle', r, labels: { r: `r = ${r} m` } },
        why: `Area is pi r squared: ${r} squared is ${r * r}, so ${r * r} pi square metres.`,
        ...choices(r0, piArea(r * r, u), [
          [piArea(2 * r, u), 'That is two pi r, the formula for the distance round, not the area.'],
          [piArea(4 * r * r, u), 'That squared the diameter. Use the radius.'],
          [area(r * r, u), 'Pi is missing. The area is pi times r squared.'],
        ]),
      };
    },
  },

  circle_circumference: {
    topic: 'MATH-MENS-02', what: 'circumference of a circle',
    params: ([r], unit, { d } = {}) => (pos(r) ? { r, unit, ...(d ? { d } : {}) } : null),
    solve({ r, d, unit }) {
      const u = units(unit);
      const dd = 2 * r;
      return {
        title: `Circumference of a circle, radius ${fmt(r)}`,
        steps: [
          { say: d ? `The diameter is ${sayNum(d)} ${u.long}, all the way across.` : `A circle with a radius of ${sayNum(r)}, so the diameter is ${sayNum(dd)} ${u.long}.`,
            draw: [{ op: 'clear' }, { op: 'title', text: 'Circumference' }, { op: 'circle', id: 'c', r, labels: { r: `r = ${fmt(r)} ${u.short}`.trim(), d: `d = ${fmt(dd)} ${u.short}`.trim() }, radiusAt: d ? undefined : 'radius', diameterAt: 'diameter' }] },
          { say: 'The distance round is pi times the diameter, which is the same as two pi r.',
            draw: [{ op: 'trace', target: 'c', at: 'round' }, { op: 'formula', text: 'C = π × d = 2 × π × r', at: 'pi' }] },
          { say: `So it is ${sayNum(dd)} pi, about ${sayNum(Math.PI * dd, 1)} ${u.long}.`,
            draw: [{ op: 'formula', text: `π × ${fmt(dd)} = ${fmt(dd)}π`, at: 'So' }, { op: 'box', text: `${fmt(dd)}π ≈ ${fmt(Math.PI * dd, 1)} ${u.short}`.trim(), at: 'about', sfx: 'correct' }] },
          { say: 'Do not mix it up with the area: pi r squared is the inside, two pi r is the edge.',
            draw: [{ op: 'note', text: 'Trap: πr² is the area, 2πr is the edge', at: 'area' }] },
        ],
      };
    },
    quiz(r0) {
      const d = 2 * int(r0, 2, 7);
      const u = units('cm');
      return {
        say: `A wheel has a diameter of ${d} centimetres. How far is it round the edge, in terms of pi?`,
        show: `A wheel has diameter ${d} cm. How far round the edge, in terms of π?`,
        figure: { op: 'circle', r: d / 2, labels: { d: `d = ${d} cm` } },
        why: `The circumference is pi times the diameter: ${d} pi centimetres.`,
        ...choices(r0, piLen(d, u), [
          [piLen(2 * d, u), 'That doubled the diameter. Two pi r uses the radius.'],
          [piArea((d / 2) ** 2, u), 'That is the area, pi r squared, not the edge.'],
          [piLen(d / 2, u), 'That used the radius with pi d. Use the diameter.'],
        ]),
      };
    },
  },

  vec_add: {
    topic: 'MATH-VEC-01', what: 'adding column vectors',
    params: ([a0, a1, b0, b1]) => ([a0, a1, b0, b1].every(Number.isFinite) ? { a: [a0, a1], b: [b0, b1] } : null),
    solve: ({ a, b }) => vectorLesson(a, b, false),
    quiz: (r) => vectorQuiz(r, false),
  },

  vec_sub: {
    topic: 'MATH-VEC-01', what: 'subtracting column vectors',
    params: ([a0, a1, b0, b1]) => ([a0, a1, b0, b1].every(Number.isFinite) ? { a: [a0, a1], b: [b0, b1] } : null),
    solve: ({ a, b }) => vectorLesson(a, b, true),
    quiz: (r) => vectorQuiz(r, true),
  },
};

function vectorLesson(a, b, minus) {
  const second = minus ? neg(b) : b;
  const s = add(a, second);
  const R = Math.max(4, ...[a, second, s].flat().map(Math.abs), ...a.map((x, i) => Math.abs(x + second[i]))) + 1;
  const name = minus ? 'a − b' : 'a + b';
  const steps = [
    { say: `Vector a is ${col(a).say}: that is ${across(a[0])} and ${upDown(a[1])}.`,
      draw: [{ op: 'clear' }, { op: 'title', text: minus ? 'Subtracting vectors' : 'Adding vectors' }, { op: 'vecgrid', range: R },
        { op: 'vec', from: [0, 0], v: a, color: 'blue', label: 'a', at: 'Vector' }, { op: 'colvec', name: 'a', v: a, color: 'blue', at: 'Vector' }] },
    minus
      ? { say: `Vector b is ${col(b).say}. To take it away, we add minus b, which is ${col(second).say}, the same arrow turned round.`,
          draw: [{ op: 'colvec', name: 'b', v: b, color: 'orange', at: 'Vector' }, { op: 'vec', from: a, v: second, color: 'purple', label: '−b', at: 'minus' }] }
      : { say: `Vector b is ${col(b).say}. We draw it starting where a ends.`,
          draw: [{ op: 'colvec', name: 'b', v: b, color: 'orange', at: 'Vector' }, { op: 'vec', from: a, v: b, color: 'orange', label: 'b', at: 'starting' }] },
    { say: minus
        ? `Tops: ${sayNum(a[0])} minus ${sayNum(b[0])} is ${sayNum(s[0])}. Bottoms: ${sayNum(a[1])} minus ${sayNum(b[1])} is ${sayNum(s[1])}. So a minus b is ${col(s).say}.`
        : `Add the tops, then the bottoms: ${sayNum(a[0])} plus ${sayNum(b[0])} is ${sayNum(s[0])}, and ${sayNum(a[1])} plus ${sayNum(b[1])} is ${sayNum(s[1])}. So a plus b is ${col(s).say}.`,
      draw: [{ op: 'vec', from: [0, 0], v: s, color: 'green', label: name, at: 'So', sfx: 'correct' }, { op: 'colvec', name, v: s, color: 'green', at: 'So' }] },
    { say: 'One move after the other lands where the green arrow lands. Watch the signs: left and down are negative.',
      draw: [{ op: 'note', text: 'Trap: left and down are negative', at: 'signs' }] },
  ];
  return { title: `${name}, with a = ${col(a).show} and b = ${col(b).show}`, steps };
}

function vectorQuiz(r, minus) {
  const pick = () => { let v; do v = [int(r, -5, 5), int(r, -5, 5)]; while (!v[0] || !v[1]); return v; };
  const a = pick();
  const b = pick();
  const right = minus ? add(a, neg(b)) : add(a, b);
  const other = minus ? add(a, b) : add(a, neg(b));
  const op = minus ? 'minus' : 'plus';
  return {
    say: `Vector a is ${col(a).say} and vector b is ${col(b).say}. What is a ${op} b?`,
    show: `What is a ${minus ? '−' : '+'} b?`,
    draw: [{ op: 'colvec', name: 'a', v: a, color: 'blue' }, { op: 'colvec', name: 'b', v: b, color: 'orange' }],
    why: `${minus ? 'Take away' : 'Add'} the tops, then the bottoms: ${col(right).say}.`,
    ...choices(r, col(right), [
      [col(other), minus ? 'That added. Taking away flips the signs of b first.' : 'That subtracted. Adding means add the tops, then add the bottoms.'],
      [col([right[1], right[0]]), 'Top and bottom swapped. The top number is across, the bottom is up.'],
      [col([right[0], -right[1]]), 'A sign slipped on the bottom number. Check the minus signs.'],
      [col([-right[0], right[1]]), 'A sign slipped on the top number. Check the minus signs.'],
      [col([right[0] + 1, right[1] - 1]), 'Check each sum again, one number at a time.'],
    ]),
  };
}

// A worked example. It ends with an invitation, not a question: questions
// come only when the student asks for a test (see shared/test.js).
export function solvePlan(template, params) {
  const t = TEMPLATES[template];
  const lesson = t.solve(params);
  return { kind: 'solve', topic: t.topic, title: lesson.title, steps: withInvite(lesson.steps), context: { topic: t.topic, template, params, offer: 'test' } };
}

export const INVITE = 'Say test me if you want some practice questions.';
export function withInvite(steps) {
  const last = steps[steps.length - 1];
  return [...steps.slice(0, -1), { ...last, say: `${last.say} ${INVITE}` }];
}

// The question as a step: read the question, then the options with letters.
// lead is said first ("Your turn." or "Question 2 of 5.").
export function quizStep(quiz, { lead = 'Your turn.', title = 'Your turn' } = {}) {
  const n = quiz.options.length;
  const opts = quiz.options.map((o, i) => `${i === n - 1 ? 'or ' : ''}${LETTERS[i]}, ${o.say}`).join('; ');
  const cue = lead.split(/\s+/).pop().replace(/[^A-Za-z0-9']/g, '');
  return {
    say: `${lead} ${quiz.say} Is it ${opts}?`,
    draw: [
      { op: 'clear' }, { op: 'title', text: title },
      ...(quiz.figure ? [quiz.figure] : []), ...(quiz.draw || []),
      { op: 'question', text: quiz.show, at: cue, sfx: 'question' },
      { op: 'options', items: quiz.options, at: 'Is' },
    ],
  };
}

export function withQuiz(plan, quiz) {
  return { ...plan, steps: [...plan.steps, quizStep(quiz)], awaiting: quiz };
}

export function templateQuizPlan(template, { seed } = {}) {
  const t = TEMPLATES[template];
  return withQuiz({ kind: 'quiz', topic: t.topic, title: 'Your turn', steps: [], context: { topic: t.topic, template } }, t.quiz(rng(seed ?? Date.now())));
}

// The teacher's reaction to an answer: the tick, the cross and why.
export function answerPlan(quiz, choice, another = 'Ask me anything else, or say test me.') {
  const a = quiz.answer;
  if (choice === a) {
    return { kind: 'answer', correct: true, title: 'Correct', steps: [{ say: `Yes, ${quiz.options[a].say} is right. ${quiz.why} ${another}`.trim(), draw: [{ op: 'mark', option: a, kind: 'tick', sfx: 'correct' }] }] };
  }
  return {
    kind: 'answer', correct: false, title: 'Not quite',
    steps: [{
      say: `Not quite. ${quiz.wrong[choice] || ''} The answer is ${LETTERS[a]}, ${quiz.options[a].say}. ${quiz.why} ${another}`.replace(/\s+/g, ' ').trim(),
      draw: [{ op: 'mark', option: choice, kind: 'cross', sfx: 'wrong' }, { op: 'mark', option: a, kind: 'tick', at: 'answer' }],
    }],
  };
}

const NUM_RE = /-?\d+(?:\.\d+)?/g;
const ORDINALS = { first: 0, second: 1, third: 2, fourth: 3, last: 3 };

// Which option the student picked, from what they said: "B", "it's c",
// "the second one", "25 pi", "minus 3 over 4". null when it is not an answer.
export function parseChoice(text, quiz) {
  let t = ` ${wordsToDigits(text.replace(/['’]/g, '')).replace(/[^a-z0-9.\-π ]/g, ' ').replace(/\s+/g, ' ').trim()} `;
  // A column vector is said as a list: "2 minus 9" is (2, -9), not a sum.
  if (quiz.options.some((o) => o.col)) t = t.replace(/\b(?:minus|negative)\s+(?=\d)/g, '-');
  const words = t.trim().split(' ');
  const letter = t.match(/\b(?:option|answer|letter|it's|its|is|choose|pick|say)\s+([abcd])\b/) || (words.length <= 3 && t.match(/^\s*(?:the\s+)?([abcd])\s*$/));
  // "D" when there are only three options is not an answer.
  if (letter) return 'abcd'.indexOf(letter[1]) < quiz.options.length ? 'abcd'.indexOf(letter[1]) : null;
  const ord = t.match(/\b(first|second|third|fourth|last)\b/);
  if (ord && /\b(one|1|option|answer)\b/.test(t)) return Math.min(ORDINALS[ord[1]], quiz.options.length - 1);
  const said = (t.match(NUM_RE) || []).map(Number);
  if (!said.length) return null;
  // All the numbers said match all the numbers of one option ("4 pi plus 8").
  const exact = quiz.options.map((o, i) => {
    const nums = o.col || (o.show.match(NUM_RE) || []).map(Number);
    return nums.length === said.length && nums.every((n, j) => n === said[j]) ? i : -1;
  }).filter((i) => i >= 0);
  if (exact.length === 1) return exact[0];
  const saidPi = /\bpi\b|π/.test(t);
  const saidSq = /\bsquare|squared|²/.test(t);
  const hits = quiz.options.map((o, i) => {
    if (o.col) return said.length >= 2 && said[0] === o.col[0] && said[1] === o.col[1] ? i : -1;
    const n = Number((o.show.match(NUM_RE) || [])[0]);
    if (n !== said[0]) return -1;
    if (/π/.test(o.show) !== saidPi && quiz.options.some((p) => /π/.test(p.show))) return -1;
    return i;
  }).filter((i) => i >= 0);
  if (hits.length === 1) return hits[0];
  if (hits.length > 1) {
    const sq = hits.filter((i) => /²|sq/.test(quiz.options[i].show) === saidSq);
    if (sq.length === 1) return sq[0];
  }
  return null;
}

// Cue words a plan uses that its step does not say (a test helper).
export function missingCues(plan) {
  const out = [];
  for (const step of plan.steps) {
    const words = new Set(step.say.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z0-9']/g, '')));
    for (const op of step.draw) for (const [k, v] of Object.entries(op)) {
      if ((k === 'at' || /At$/.test(k)) && typeof v === 'string' && !words.has(v.toLowerCase())) out.push(`${v} (${op.op}) in "${step.say.slice(0, 40)}"`);
    }
  }
  return out;
}
