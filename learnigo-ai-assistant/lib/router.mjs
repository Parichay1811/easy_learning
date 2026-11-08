// The router turns what the student said into a lesson plan, cheapest way
// first. Instant (rules, about 5 ms): controls, answers to the waiting
// question, numbers and a shape, small talk, the lesson packs. When nothing
// instant fits, the teacher says something at once (the fast model names the
// topic) while the local LLM either classifies a maths question or answers
// in a few spoken sentences, streamed. Real questions with no lesson still
// go to the admin TODO list.
import { autoViz, packDiagram, withPictures, richViz, simsMeta } from '../shared/autoviz.js';
import { parseConvert, convertPlan } from '../shared/convert.js';
import { parseArith, arithPlan } from '../shared/arith.js';
import { TEMPLATES, solvePlan, withQuiz, withInvite, answerPlan, parseChoice, rng } from '../shared/solvers.js';
import { testScope, countFrom, askCountPlan, buildTest } from './test.mjs';
import { wordsToDigits, parseUnit } from '../shared/numbers.js';
import { MISS, OFFER, STOPPED, TALK } from '../shared/lines.js';
import { findTopic, bestFaq, tokens } from './packs.mjs';
import { converse, isRealQuestion, YES, NO } from './converse.mjs';
import { followUp, subjectOf, nextQuestions } from './followup.mjs';

// The kinds of answer that are about something (a follow-up can refer back to them).
const CONTENT = new Set(['explain', 'faq', 'chat', 'quiz', 'solve']);

const CONTROLS = [
  ['stop', /^(stop|wait|hold on|pause|be quiet|quiet|shh+|enough)\b/],
  ['resume', /^(go on|continue|carry on|keep going|resume|go ahead|okay go on|ok go on|yes continue|sorry go on|never mind|nevermind)\b/],
  ['repeat', /^(repeat|say (that|it) again|again|what did you say|pardon|come again|one more time)\b/],
  ['slower', /\b(slow(er)?( down)?|too fast)\b/],
  ['faster', /\b(speed up|faster|too slow)\b/],
  ['next', /^(next|skip|move on)\b/],
];

const NUM = /(-?\d+(?:\.\d+)?)(?:\s*(millimet(?:re|er)s?|mm|centimet(?:re|er)s?|cm|kilomet(?:re|er)s?|km|met(?:re|er)s?|m|inch(?:es)?|feet|foot|ft|yards?|yd)\b)?/g;
const CIRCLE = /\b(circles?|circular|round|pond|wheel|pizza|radius|diameter|circumference|semi ?circle|disc|coin|clock face|hoop|ring|plate|trampoline|tyre|tire|cd)\b/;
const EDGE_OF_CIRCLE = /\b(circumference|perimeter|around|edging|fence|fencing|border|rim of|crust|distance round|all the way round|how far round|go round)\b/;
const DIAMETER = /\b(diameter|across|wide)\b/;
const RADIUS = /\b(radius|middle to (the )?(rim|edge)|centre to (the )?(rim|edge)|center to (the )?(rim|edge))\b/;
const VECTOR = /\b(vectors?|column)\b/;
const SUB = /\b(subtract|minus|take away|takeaway|difference)\b/;
const TRIANGLE = /\b(triangles?|triangular)\b/;
const SQUARE = /\bsquare\b(?!\s*(met|cent|mill|kilo|unit|feet|foot|inch|yard|m\b|cm\b|mm\b|km\b|ft\b))/;
const RECT = /\b(rectangles?|rectangular|oblong|garden|room|floor|field|wall|carpet|lawn|yard|plot|table|board|bed|patio|pitch|court|tiles?|sheet|door|window|by|area|perimeter)\b|×|\d\s*x\s*\d/;
// Science words: "the magnetic field 1 cm from a wire carrying 10 A" is
// physics, not the area of a field, unless a shape is named.
const SCIENCE = /\b(magnetic|electric|current|voltage|volts?|amps?|amperes?|ohms?|resistors?|charges?|coulombs?|newtons?|kilonewtons?|joules?|watts?|stress|strain|torque|beams?|moments?|velocity|acceleration|pressure|wavelength|frequency|capacitors?|inductors?|tesla)\b/;
const SHAPE = /\b(rectangles?|rectangular|circles?|circular|triangles?|triangular|squares?|area|perimeter|circumference)\b/;
const PERIMETER = /\b(perimeter|fence|fencing|around|border|edging|edge|skirting|frame|trim|rope|ribbon|boundary|distance round|all the way round|walk round)\b/;
const EXPLAIN = /\b(explain|teach|lesson|learn|show me how|help me understand|tell me about|i don'?t (get|understand))\b/;
const QUIZ = /\b(quiz|test me|test on|test for|a test|mock|ask me|practi[cs]e|questions? (on|about|for|in)|give me (a |some |\d+ )?questions?|try one|another question|more questions)\b/;

// Thousands commas go ("1,200 cm" is 1200 cm, not 1 and 200).
export function normalize(text) {
  return fixHeard(wordsToDigits(text).replace(/(\d),(?=\d{3}\b)/g, '$1').toLowerCase().replace(/[“”"!;:]/g, ' ').replace(/\s+/g, ' ').trim());
}

// Speech recognition mishears the first word of a request most ("Flynn me
// about solar" was "tell me about solar"): "<anything> me about X" is a
// request to be told about X.
const VERBS = new Set(['tell', 'teach', 'show', 'explain', 'ask', 'give', 'quiz', 'test', 'remind', 'help']);
export function fixHeard(t) {
  return t.replace(/^(\w+) (me|us) (about|on)\b/i, (m, w, who, prep) => (VERBS.has(w.toLowerCase()) ? m : `tell ${who} ${prep}`));
}

// Numbers and a shape in the words -> { template, params }, or null.
export function parseMath(t, ctx = {}) {
  const found = [...t.matchAll(NUM)].map((m) => ({ v: parseFloat(m[1]), unit: parseUnit(m[2] || '') }));
  if (!found.length) return null;
  if (SCIENCE.test(t) && !SHAPE.test(t)) return null;
  const values = found.map((n) => n.v);
  const unit = found.find((n) => n.unit)?.unit || ctx.params?.unit || null;
  let template = null;
  let extra = {};
  let nums = values;
  if (VECTOR.test(t) || (values.length >= 4 && /\(/.test(t))) {
    template = SUB.test(t) ? 'vec_sub' : 'vec_add';
  } else if (CIRCLE.test(t)) {
    template = EDGE_OF_CIRCLE.test(t) ? 'circle_circumference' : 'circle_area';
  } else if (TRIANGLE.test(t)) {
    template = 'tri_area';
  } else if (SQUARE.test(t) && values.length === 1) {
    template = PERIMETER.test(t) ? 'rect_perimeter' : 'rect_area';
    nums = [values[0], values[0]];
  } else if (values.length >= 2 && RECT.test(t)) {
    template = PERIMETER.test(t) ? 'rect_perimeter' : 'rect_area';
  } else if (ctx.template && TEMPLATES[ctx.template]) {
    template = ctx.template; // a follow-up: "what if it's 10 by 4?"
  }
  if (!template) return null;
  if (template.startsWith('circle')) {
    if (DIAMETER.test(t) && !RADIUS.test(t)) extra = { d: values[0] };
    nums = [extra.d ? values[0] / 2 : values[0]];
  }
  if (template.startsWith('vec') && values.length === 2 && ctx.params?.a && ctx.template?.startsWith('vec')) {
    nums = /\bb\b/.test(t) ? [...ctx.params.a, ...values] : [...values, ...ctx.params.b];
  }
  const params = TEMPLATES[template].params(nums, unit, extra);
  return params ? { template, params } : null;
}

// The lesson opens on the topic's own picture (pack.visual: a simulation,
// shapes, a map), in place of words in boxes; a specific figure stays.
const PLAIN = new Set(['bullets', 'parts', 'bignum', 'flow', 'cycle', 'compare', 'tree', 'pyramid', 'timeline', 'venn']);
const PICTURE_OPS = new Set(['flow', 'cycle', 'timeline', 'compare', 'bullets', 'bignum', 'parts', 'tree', 'venn', 'bars', 'pyramid', 'line', 'pie', 'table', 'map', 'graph', 'numberline', 'fraction', 'angle', 'balance', 'forces', 'wave', 'circuit', 'atom', 'orbits', 'quote', 'count', 'shape', 'sim', 'cell', 'phscale', 'periodic', 'image', 'rect', 'tri', 'circle', 'vecgrid']);
export function openWith(steps, visual) {
  if (!visual || !steps.length) return steps;
  const [first, ...rest] = steps;
  const draw = [...(first.draw || [])];
  const fig = draw.findIndex((o) => PICTURE_OPS.has(o.op));
  if (fig >= 0 && !PLAIN.has(draw[fig].op)) return steps;
  if (fig >= 0) draw[fig] = { ...visual }; else draw.splice(draw.findIndex((o) => o.op === 'title') + 1, 0, { ...visual });
  return [{ ...first, draw }, ...rest];
}

export function packPlan(pack, kind, seed) {
  const quiz = pack.quiz[Math.floor(rng(seed)() * pack.quiz.length)];
  const base = { kind, topic: pack.id, title: pack.title, watch: pack.title, context: { topic: pack.id, template: pack.template } };
  if (kind === 'quiz') return withQuiz({ ...base, title: 'Your turn', steps: [] }, quiz);
  // Generated packs made before lessons had pictures get one per step.
  const steps = pack.status === 'reviewed' ? pack.explain : withPictures(openWith(pack.explain, pack.visual), pack.title, pack.visual);
  return { ...base, steps: withInvite(steps), context: { ...base.context, offer: 'test' } };
}

export function faqPlan(pack, item) {
  return {
    kind: 'faq', topic: pack.id, title: item.q, watch: pack.title,
    context: { topic: pack.id, template: pack.template, offer: 'test' },
    steps: [{
      say: `${item.a} ${OFFER}`,
      draw: [{ op: 'clear' }, { op: 'title', text: pack.title }, ...faqFigure(pack, item), { op: 'card', q: item.q, a: item.a }],
    }],
  };
}

// The picture beside a short answer: the pack's own figure, else the lesson
// diagram that fits the answer best, else one made from the answer itself.
function faqFigure(pack, item) {
  if (pack.figure?.length) return pack.figure;
  const pic = richViz(item.a, { topic: pack.title, question: item.q }) || packDiagram(pack, `${item.q} ${item.a}`) || autoViz(item.a, { topic: pack.title, question: item.q });
  return pic ? [pic] : [];
}

// A few packs from different subjects, to suggest instead.
function spread(packs, n) {
  const seen = new Set();
  const out = [];
  for (const p of [...packs.values()].sort((a, b) => (a.status === 'reviewed' ? -1 : 0) - (b.status === 'reviewed' ? -1 : 0))) {
    const d = p.id.split('-')[0];
    if (seen.has(d) || !p.examples?.length) continue;
    seen.add(d);
    out.push(p);
    if (out.length >= n) break;
  }
  return out;
}

export function missPlan(text, packs) {
  return {
    kind: 'miss', title: 'Not in my notes yet',
    steps: [{
      say: MISS,
      draw: [{ op: 'clear' }, { op: 'title', text: 'Not in my notes yet' }, { op: 'question', text: `“${text.slice(0, 120)}”` },
        { op: 'text', text: 'Added to the team’s list. You can ask me about:', at: 'list' },
        { op: 'chips', items: spread(packs, 6).map((p) => p.examples[0]), at: 'Right' }],
    }],
  };
}

// An answer from open data: its figures beside the first sentence, the rest
// (a big number, a second picture) beside the second.
export function dataPlan(d) {
  return {
    kind: 'chat', title: d.title, watch: d.watch === undefined ? d.title : d.watch, source: d.source, context: { offer: null },
    steps: d.say.map((say, i) => ({ say, draw: i === 0
      ? [{ op: 'clear' }, { op: 'title', text: d.title }, ...d.figures, { op: 'note', text: `From ${d.source.site}${d.source.licence ? ` (${d.source.licence})` : ''}`, color: 'teal' }, { op: 'text', text: say, color: 'ink' }]
      : [...(i === 1 ? d.more || [] : []), { op: 'text', text: say, color: 'ink' }] })),
  };
}

// No lesson and no article: the best videos on it, drawn on the board as
// cards to tap (they open on YouTube), while the question waits for the team.
export function videoPlan(topic, vids) {
  const v = vids[0];
  topic = topic.replace(/^(to|how to)\s+/i, '');
  const Topic = topic.charAt(0).toUpperCase() + topic.slice(1);
  return {
    kind: 'miss', title: `Watch: ${Topic}`, watch: null, context: { subject: Topic },
    steps: [
      { say: `I don't have a lesson on ${topic} yet, so I've asked the team to make one.`,
        draw: [{ op: 'clear' }, { op: 'title', text: `Let's watch: ${Topic}` }, { op: 'video', items: vids.slice(0, 3) }, { op: 'text', text: 'No lesson on this yet: it is on the team’s list.', color: 'muted' }] },
      { say: `Meanwhile, here is a good video about it: ${v.title.replace(/[|#].*$/, '').trim()}, from ${v.channel || 'YouTube'}. Tap it to watch.`,
        draw: [{ op: 'text', text: `▶ ${v.title}`, color: 'ink' }, { op: 'note', text: 'Tap a video to open it on YouTube', color: 'teal' }] },
    ],
  };
}

const control = (action) => ({ kind: 'control', action, ...(action === 'stop' ? { say: STOPPED } : {}) });

// Everything that needs no model. Returns { plan, tier } or null. faq: match
// common questions by their words here (off when the knowledge base, which
// also knows their other phrasings and meanings, answers them instead).
export function quick(text, { context = {}, packs, seed = Date.now(), faq: byWords = true } = {}) {
  const t = normalize(text);
  const short = t.split(' ').length <= 6;
  if (short) for (const [action, re] of CONTROLS) if (re.test(t)) return { plan: control(action), tier: 'rules' };

  if (context.awaiting) {
    const choice = parseChoice(t, context.awaiting);
    if (choice != null && choice >= 0) return { plan: { ...answerPlan(context.awaiting, choice, context.test ? '' : undefined), context }, tier: 'rules' };
  }

  // Tests: only when asked for. "How many?" first, unless the student said.
  if (context.offer === 'test-count') {
    const n = countFrom(t, true) ?? (YES.test(t) && short ? 5 : null);
    if (n) return { plan: buildTest(context.scope || testScope(t, context, packs), n, packs, seed), tier: 'rules' };
  }
  if (context.offer === 'test' && short && YES.test(t)) return { plan: askCountPlan(testScope('', context, packs)), tier: 'rules' };
  if (QUIZ.test(t)) {
    const scope = testScope(t, context, packs);
    const n = countFrom(t);
    return { plan: n ? buildTest(scope, n, packs, seed) : askCountPlan(scope), tier: 'rules' };
  }

  // A plain sum ("7 times 8", "20% of 150") before shapes: "7 x 8" with no
  // garden or room in it is a multiplication, not a rectangle.
  const sum = parseArith(t);
  // Inside a shape lesson, "10 x 4" is the next shape ("what if it's 10 by 4?").
  const nextShape = context.template && sum?.tokens.length === 3 && sum.tokens[1] === '*';
  if (sum && !nextShape) return { plan: arithPlan(sum), tier: 'rules' };
  const math = parseMath(t, context);
  if (math) return { plan: solvePlan(math.template, math.params), tier: 'rules' };
  const conversion = parseConvert(t);
  if (conversion) return { plan: convertPlan(conversion), tier: 'rules' };

  const talk = converse(t, { context, packs });
  if (talk) return talk;

  const topic = findTopic(t, packs);
  if (topic && EXPLAIN.test(t)) return { plan: packPlan(topic, 'explain', seed), tier: 'packs' };
  const faq = byWords ? bestFaq(t, packs) : { score: 0 };
  if (faq.score >= 0.5) return { plan: faqPlan(faq.pack, faq.item), tier: 'packs' };
  if (topic && short && byWords) return { plan: packPlan(topic, 'explain', seed), tier: 'packs' };
  return null;
}

// What a maths tool needs when the student named it but gave no numbers.
const ASK_NUMBERS = {
  rect_area: 'Tell me the length and the width.', rect_perimeter: 'Tell me the length and the width.',
  tri_area: 'Tell me the base and the height.', circle_area: 'Tell me the radius, or the diameter.',
  circle_circumference: 'Tell me the radius, or the diameter.', vec_add: 'Tell me the two vectors, top number then bottom number.',
  vec_sub: 'Tell me the two vectors, top number then bottom number.',
};

// What the teacher does with a knowledge-base card.
export function cardPlan(card, { text = '', packs, seed = Date.now() } = {}) {
  const pack = packs.get(card.pack);
  if (card.kind === 'faq') return faqPlan(pack, { q: card.q || card.label, a: card.a });
  // A fact is its own answer: the card's heading is the topic, not the fact again.
  if (card.kind === 'fact') return faqPlan(pack, { q: pack.title, a: card.a });
  if (card.kind === 'lesson') return packPlan(pack, 'explain', seed);
  if (card.kind === 'quiz') return packPlan(pack, 'quiz', seed);
  const math = parseMath(normalize(text), { template: card.tool });
  if (math?.template === card.tool) return solvePlan(math.template, math.params);
  return {
    kind: 'talk', title: TEMPLATES[card.tool].what,
    context: { topic: card.pack, template: card.tool },
    steps: [{ say: `Sure, let's work out the ${TEMPLATES[card.tool].what}. ${ASK_NUMBERS[card.tool]}`, draw: [] }],
  };
}

// Hybrid search scores (0..1): at least ACCEPT is used at once; at least
// CLARIFY gets "Do you mean...?"; below that the card only grounds the LLM.
const ACCEPT = 0.6;
const CLARIFY = 0.47;
const GROUND = 0.3;

const GENERIC = new Set('explain tell show mean means meaning difference between about much many please teach learn understand know something thing things example examples work works happen happens called define definition simple simply words word answer question help need needs want like really have has had make makes made get gets got use uses used give gives take takes come comes keep keeps call find kind kinds type types way ways look looks happening important exactly actually basically'.split(' '));
// The share of the question's key words a card mentions (1 when it has
// none), each word weighted by how rare it is across the packs: missing
// "solar" counts for much more than missing "system".
const DF = new WeakMap();
// A word's root for matching: its first five letters, after dropping -ing,
// -ed or a plural -s ("mixing" and "mixed" both match "mix").
const root = (w) => w.replace(/(?<=[a-z]{3})(ing|(?<!e)ed|(?<![su])s)$/, '').slice(0, 5);
function rarity(packs) {
  if (!packs || packs.size < 30) return () => 1; // too few packs to say what is rare
  let df = DF.get(packs);
  if (!df) {
    df = new Map();
    for (const p of packs.values()) for (const w of new Set([...(p.keySet || []), ...tokens(p.title || '')].map(root))) df.set(w, (df.get(w) || 0) + 1);
    DF.set(packs, df);
  }
  return (w) => Math.log(1 + packs.size / (1 + (df.get(w) || 0)));
}
export function keyCover(text, card, packs) {
  const have = new Set(tokens(`${card.label || ''} ${card.q || ''} ${card.a || ''} ${(card.phrasings || []).join(' ')} ${card.text || ''}`).map(root));
  const keys = [...new Set(tokens(text).filter((w) => w.length >= 4 && !GENERIC.has(w) && !/^\d/.test(w)).map(root))];
  if (!keys.length) return 1;
  const weight = rarity(packs);
  const total = keys.reduce((a, w) => a + weight(w), 0);
  return keys.filter((w) => have.has(w)).reduce((a, w) => a + weight(w), 0) / total;
}
export const coversKeys = (text, card) => keyCover(text, card) === 1;
// Two-word terms of the curriculum ("water cycle", "solar system", "column
// vector"), from every topic title and lesson keyword; set by the server.
let TERMS = new Set();
const pairs = (t) => { const w = tokens(t); const out = []; for (let i = 1; i < w.length; i++) out.push(`${w[i - 1]} ${w[i]}`); return out; };
export function setTerms(texts) { TERMS = new Set(texts.flatMap(pairs)); }

// The card's lesson is about what the question names: one of its key words
// is the lesson's topic, and a curriculum term the question uses ("the
// water cycle") appears as a term in the lesson or the card, not as two
// loose words (the frog's life cycle in water).
export function aboutTopic(text, pack, card = null, packs = null) {
  if (!pack) return true;
  const topic = new Set([...(pack.keySet || []), ...tokens(pack.title || '')].map(root));
  const keys = tokens(text).filter((w) => w.length >= 3 && !GENERIC.has(w) && !/^\d/.test(w)).map(root);
  // A rare word the card's own question names counts too ("What is the Kaaba?"
  // in the Islam lesson); a common one does not ("heart" in a symmetry card).
  const own = card?.kind === 'faq' ? new Set(tokens(`${card.q || ''} ${(card.phrasings || []).join(' ')}`).map(root)) : new Set();
  const rare = (w) => { if (!packs || packs.size < 30) return false; rarity(packs); return (DF.get(packs).get(w) || 0) <= 1; };
  if (keys.length && !keys.some((w) => topic.has(w) || (own.has(w) && rare(w)))) return false;
  const known = new Set([...TERMS, ...pairs(`${pack.title} ${(pack.keywords || []).join(' , ')}`)]);
  const terms = pairs(text).filter((p) => known.has(p));
  if (!terms.length) return true;
  const where = new Set([...pairs(pack.title || ''), ...(pack.keywords || []).flatMap(pairs), ...(card ? pairs(`${card.label || ''} ${card.q || ''} ${card.a || ''} ${(card.phrasings || []).join(' . ')}`) : [])]);
  return terms.every((p) => where.has(p));
}

// A name the student used ("Mount Everest", "Einstein") that the card never
// mentions: the card is about something else, so do not even ask about it.
function namesMissing(text, card) {
  const names = String(text).replace(/^\s*\S+/, '').match(/\b[A-Z][a-z]{2,}\b/g) || [];
  const have = `${card.label || ''} ${card.q || ''} ${card.a || ''} ${card.text || ''}`.toLowerCase();
  return names.some((n) => !have.includes(n.toLowerCase().slice(0, 5)));
}

// A simulation's title that contains the word ("bubble" -> "bubble sort").
function simMeaning(word) {
  const w = String(word).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (w.length < 3) return null;
  const hit = Object.values(simsMeta()).find((m) => new RegExp(`\\b${w}\\b`, 'i').test(m.title || ''));
  return hit ? hit.title.toLowerCase() : null;
}

const HEDGE = /^(i('m| am) not (sure|certain)|i (cannot|can't|can not|am unable to|'m unable to) (answer|help|explain|show|tell|teach)|i don'?t know|sorry\b|as an ai|i am unable)|not a school topic|i can help you (learn|with) (about )?school|you can practi[cs]e (these|this) with me/i;
// The model talking about itself instead of the subject ("I am sorry, but…",
// "I am an AI assistant", "I do not have personal opinions"): never said.
const SELF = /\b(i('m| am) (sorry|an ai|a language model|just an ai|not able)|as an ai|ai assistant|language model|i (do not|don'?t) have (personal|opinions|feelings|experiences|access)|i (cannot|can'?t|can not) (answer|help|provide|tell|share|be)|i('m| am) not (a|an) [a-z]+(,| and|\.|$)|i will (answer|help|be happy)|if you (are curious|want to know more|have (any )?(other|more) questions)|feel free to ask|let me know if|happy to help|another (subject|topic|question))/i;

// The streamed answer: emit({ type: 'ack' | 'plan' | 'step' | 'end' }).
// Returns the tier that answered.
// A lesson answer about a person or a place gets the same key-facts card as
// an encyclopedia answer, a moment later (the lesson is already playing).
export async function respond(text, options = {}) {
  const { emit, opendata } = options;
  let pending = null;
  const tier = await answer(text, { ...options, emit: (e) => {
    emit(e);
    if (e.type === 'plan' && ['kb', 'packs'].includes(e.tier) && e.context?.subject && opendata?.facts && !pending) {
      pending = opendata.facts(e.context.subject).then((g) => { if (g?.rows?.length && g.kind !== 'thing') emit({ type: 'figure', draw: [{ op: 'facts', title: 'At a glance', rows: g.rows }] }); }).catch(() => {});
    }
  } });
  if (pending) await Promise.race([pending, new Promise((r) => setTimeout(r, 5000))]);
  return tier;
}

async function answer(text, { context = {}, history = [], packs, kb, llm, fast, wiki, opendata, videos, onTodo, emit, signal, seed = Date.now() } = {}) {
  text = fixHeard(String(text).trim());
  // Follow-ups ("when was he born?", "tell me more", "why?") made whole questions.
  const follow = followUp(text, { ...context, history });
  text = follow.text;
  let t = normalize(text);
  // Every answer remembers what it was about (for the next follow-up) and
  // offers what to ask next.
  const send = emit;
  emit = (e) => {
    if (e.type === 'plan' && CONTENT.has(e.kind)) {
      const s = subjectOf(e);
      if (s) { e.context = { ...(e.context || {}), subject: s }; e.next ||= nextQuestions(e, s, text); }
    }
    send(e);
  };
  // "Tell me more": the article's next sentences, not the same answer again.
  if (follow.kind === 'more' && wiki && context.subject) {
    const web = await Promise.race([wiki.lookup(`what is ${context.subject}`).catch(() => null), new Promise((r) => setTimeout(() => r(null), 3000))]);
    const lines = web ? await Promise.race([wiki.more(web, history.map((h) => h.a || '').join(' '), 3).catch(() => []), new Promise((r) => setTimeout(() => r([]), 4000))]) : [];
    if (lines.length) {
      const pic = richViz(lines.join(' '), { question: text, topic: web.title }) || autoViz(lines, { topic: web.title, question: text }) || (web.image ? { op: 'image', src: web.image.src, credit: web.image.credit, caption: web.title } : null);
      emit({ type: 'plan', tier: 'wiki', kind: 'chat', title: web.title, watch: web.title, about: web.description, source: { title: web.title, url: web.url, site: web.site || 'Wikipedia' }, context: { offer: null },
        steps: lines.map((say, i) => ({ say, draw: i === 0
          ? [{ op: 'clear' }, { op: 'title', text: `More about ${web.title}` }, ...(pic ? [pic] : []), { op: 'note', text: `From ${web.site || 'Wikipedia'}: ${web.title}`, color: 'teal' }, { op: 'text', text: say, color: 'ink' }]
          : [{ op: 'text', text: say, color: 'ink' }] })) });
      onTodo?.(text, { answered: true });
      return 'wiki';
    }
  }
  // "No" to "Do you mean ...?": answer what was really asked, without that card.
  let skipCard = null;
  if (context.offer?.startsWith('card:') && context.asked && NO.test(t) && t.split(' ').length <= 4) {
    skipCard = context.offer.slice(5);
    text = context.asked;
    t = normalize(text);
    context = { ...context, offer: null };
  }
  // "Yes" to "Do you mean ...?"
  if (context.offer?.startsWith('card:') && YES.test(t) && t.split(' ').length <= 4) {
    const card = kb?.cards.find((c) => c.id === context.offer.slice(5));
    if (card) { emit({ type: 'plan', ...cardPlan(card, { packs, seed }), tier: 'kb' }); return 'kb'; }
  }
  // A tap on a part of the diagram ("Tell me about the hour hand"): the lesson's
  // own answer about that part, never the same lesson again from the start.
  const tapped = !!context.topic && /^tell me about the /i.test(text);
  if (tapped && kb) {
    const own = (await kb.find(text, 8)).filter((h) => h.card.pack === context.topic && h.card.kind === 'faq');
    if (own[0] && own[0].score >= 0.3) { emit({ type: 'plan', ...cardPlan(own[0].card, { text, packs, seed }), tier: 'kb', score: +own[0].score.toFixed(2) }); return 'kb'; }
  }
  // No question about that part: the lesson's own sentence that names it
  // (a tap stays inside the lesson; "spatula tips" is not a medical spatula).
  const lesson = tapped ? packs.get(context.topic) : null;
  if (lesson) {
    const part = text.replace(/^tell me about the /i, '').trim();
    const keys = tokens(part).filter((w) => !GENERIC.has(w)).map((w) => w.slice(0, 5));
    const lines = [...(lesson.explain || []).map((st) => st.say), ...(lesson.faq || []).map((f) => (Array.isArray(f) ? f[1] : f.a)), ...(lesson.facts || [])];
    const said = lines.map((line) => ({ line, n: keys.filter((k) => tokens(line).some((w) => w.startsWith(k))).length })).sort((x, y) => y.n - x.n)[0];
    if (said?.n) {
      emit({ type: 'plan', ...faqPlan(lesson, { q: part.charAt(0).toUpperCase() + part.slice(1), a: said.line }), tier: 'packs' });
      return 'packs';
    }
    text = `${part} (${lesson.title})`;
    t = normalize(text);
  }
  const q = skipCard || tapped ? null : quick(text, { context, packs, seed, faq: !kb });
  if (q) { emit({ type: 'plan', ...q.plan, tier: q.tier }); return q.tier; }

  // The first line ("Good question…") is said while answers are looked up.
  let acked = null;
  const ackNow = () => (acked ||= (fast ? fast.ack(text).catch(() => null) : Promise.resolve(null)).then((a) => { if (a) emit({ type: 'ack', ...a }); return a; }));
  // An exact answer from open data (lib/opendata.mjs): a number, a date, a
  // formula, a word's meaning, a picture, a country's figures over time.
  // What no lesson holds is looked up first; a fact a lesson may answer, after.
  const found = opendata?.match(text) || null;
  async function fromData() {
    const data = await Promise.race([opendata.run(found), new Promise((r) => setTimeout(() => r(null), 4500))]);
    if (!data?.say?.length) return false;
    await ackNow();
    emit({ type: 'plan', ...dataPlan(data), tier: 'data' });
    onTodo?.(text, { answered: true });
    return true;
  }
  if (found?.first) { ackNow(); if (await fromData()) return 'data'; }

  // The knowledge base: checked answers found by meaning, no model needed.
  const hits = kb ? (await kb.find(text, 8)).filter((h) => h.card.id !== skipCard) : [];
  // A card must cover the question's key words: "earth's radius" is not
  // answered by a card about the radius in volumes of revolution.
  // Missing key words make a match at most a "Do you mean...?".
  // ...and the card's lesson must be about something the question names:
  // "how does the heart work" is not the symmetry lesson's heart shape.
  // A specific question ("when was he born?") is not answered by a whole lesson.
  const specific = /^(when|where|who|whom|which year|what year|how (many|much|tall|big|old|far|long|high|cold|hot|deep|heavy|fast))\b|\b(famous for|known for|born|died)\b/i.test(t) || ['pronoun', 'bare'].includes(follow.kind) || tapped;
  // A quiz card only when a test was asked for ("test me" is a rule above);
  // among close matches, the card asking the same kind of question wins:
  // "how does a heat pump work?" is not "why are heat pumps less efficient?",
  // and "why does a volcano erupt?" is not the yes-or-no "can volcanoes erupt again?".
  const wh = (t.match(/^(why|how|what|who|when|where)\b/) || [])[1];
  const rank = (h) => {
    const q = String(h.card.q || h.card.label || '').toLowerCase();
    return h.score + (wh && q.startsWith(wh) ? 0.04 : 0) - (wh && /^(can|is|are|does|do|did|will|could|should|has|have)\b/.test(q) ? 0.06 : 0);
  };
  const usable = hits.filter((h) => h.card.kind !== 'quiz' && !(specific && h.card.kind === 'lesson')).sort((x, y) => rank(y) - rank(x));
  const best = usable[0] && aboutTopic(text, packs.get(usable[0].card.pack), usable[0].card, packs) ? usable[0] : null;
  // A card comparing two things does not answer a question about one of them.
  const comparing = best && /\b(difference between|compare|versus|vs\.?)\b/i.test(`${best.card.q || ''} ${best.card.label || ''}`) && !/\b(differen|compare|versus|vs\.?|and)\b/i.test(text);
  if (best && !comparing && best.score >= ACCEPT && coversKeys(text, best.card)) { emit({ type: 'plan', ...cardPlan(best.card, { text, packs, seed }), tier: 'kb', score: +best.score.toFixed(2) }); return 'kb'; }
  const ack = ackNow();
  if (found && !found.first && await fromData()) return 'data';
  if (best && !comparing && !follow.kind && best.score >= CLARIFY && best.card.kind !== 'tool' && !skipCard && !namesMissing(text, best.card) && keyCover(text, best.card, packs) >= 0.5) {
    emit({ type: 'plan', tier: 'kb', score: +best.score.toFixed(2), kind: 'talk', title: 'Do you mean…', context: { ...context, offer: `card:${best.card.id}`, asked: text },
      steps: [{ say: `Do you mean: ${best.card.label.replace(/[?.]$/, '')}?`, draw: [] }] });
    return 'kb';
  }
  const notes = hits.filter((h) => h.score >= GROUND && h.card.a).map((h) => `${h.card.q || ''} ${h.card.a}`.trim());
  // Open knowledge for the rest: Wikipedia's article on the question (no
  // key, CC BY-SA, credited), looked up while the first line is said. Its
  // facts ground the small model; its image is the picture when nothing
  // drawn fits; with no model at all, the teacher reads its summary.
  const web = wiki && isRealQuestion(t) ? await Promise.race([wiki.lookup(text).catch(() => null), new Promise((r) => setTimeout(() => r(null), 3000))]) : null;
  // Key facts about it from Wikidata (born, died, capital, population...), for a card beside the answer.
  const glance = web && opendata?.facts ? opendata.facts(web.title).catch(() => null) : null;
  // The best videos and the official website, looked up meanwhile, for the
  // "Learn more" panel on the board when nothing drawn fits the answer.
  const extras = web ? Promise.all([videos ? videos.search(web.title).catch(() => []) : [], opendata?.website ? opendata.website(web.title).catch(() => null) : null]) : null;
  async function learnPanel() {
    const [vids, site] = extras ? await Promise.race([extras, new Promise((r) => setTimeout(() => r([[], null]), 3000))]) : [[], null];
    return { op: 'learn', article: { title: web.title, description: web.description, extract: wiki.sentences(web.extract, 3).join(' '), url: web.url, site: web.site || 'Wikipedia', thumb: web.image?.src || null }, website: site, videos: (vids || []).slice(0, 2) };
  }
  // A drawn picture made from the words counts only when it really shows something.
  const strong = (op) => op && !['bignum', 'parts', 'flow', 'bullets', 'quote'].includes(op.op);
  async function glanceCard() {
    const g = glance && await Promise.race([glance, new Promise((r) => setTimeout(() => r(null), 5000))]); // the answer is already playing
    if (g?.rows?.length) emit({ type: 'figure', draw: [{ op: 'facts', title: 'At a glance', rows: g.rows }] });
  }
  // A "why", "how", "who", "when" or "where" question is answered from the
  // whole article, not just its summary (the sentences that name its words
  // and give a reason, a person, a year or a place).
  const deep = web && /\b(why|how|who|when|where)\b/i.test(t) ? await Promise.race([wiki.answer(text, web).catch(() => []), new Promise((r) => setTimeout(() => r([]), 2500))]) : [];
  const facts = deep.length >= 2 ? deep : web ? wiki.sentences(web.extract, 4) : [];
  if (web) {
    // With the encyclopedia's facts, only lesson cards that clearly match stay.
    const about = new Set(tokens(web.title).map((w) => w.slice(0, 5)));
    const strong = hits.filter((h) => h.score >= 0.5 && h.card.a && tokens(`${h.card.q || ''} ${h.card.a}`).some((w) => !GENERIC.has(w) && about.has(w.slice(0, 5)))).map((h) => `${h.card.q || ''} ${h.card.a}`.trim());
    notes.splice(0, notes.length, `${web.title}: ${facts.join(' ')}`, ...strong);
  }
  const source = web?.url ? { title: web.title, url: web.url, site: web.site || 'Wikipedia' } : null;
  // A word with several meanings ("bubble"): ask which one, with a button
  // for each; a meaning the board can animate (bubble sort) comes first.
  if (!web && wiki && isRealQuestion(t)) {
    const options = await Promise.race([wiki.choices(text).catch(() => []), new Promise((r) => setTimeout(() => r([]), 2000))]);
    if (options.length >= 2) {
      const word = wiki.subject(text);
      const sim = simMeaning(word);
      const list = [...new Set([...(sim ? [sim] : []), ...options])].slice(0, 4);
      await ack;
      emit({ type: 'plan', tier: 'wiki', kind: 'talk', title: `Which ${word}?`, context: { offer: null },
        steps: [{ say: `${word.charAt(0).toUpperCase() + word.slice(1)} can mean a few things: ${list.slice(0, -1).join(', ')} or ${list[list.length - 1]}. Which one do you mean?`,
          draw: [{ op: 'clear' }, { op: 'title', text: `Which ${word}?` }, { op: 'text', text: 'Tap one, or say it', color: 'muted' }, { op: 'chips', items: list.map((o) => `What is ${o}?`) }] }] });
      return 'wiki';
    }
  }
  const webPicture = web?.image ? { op: 'image', src: web.image.src, credit: web.image.credit, caption: web.title } : null;

  const up = llm ? await llm.available() : false;

  if (up && /\d/.test(t)) {
    const r = await llm.classify(text).catch(() => null);
    if (r?.intent === 'solve' && TEMPLATES[r.template]) {
      const params = TEMPLATES[r.template].params([r.a, r.b, r.c, r.d], r.unit || null, {});
      if (params) { await ack; emit({ type: 'plan', ...solvePlan(r.template, params), tier: 'llm' }); return 'llm'; }
    }
    const pack = r && r.intent !== 'none' && (packs.get(r.topic) || (TEMPLATES[r.template] && packs.get(TEMPLATES[r.template].topic)));
    if (pack) { await ack; emit({ type: 'plan', ...packPlan(pack, r.intent === 'quiz' ? 'quiz' : 'explain', seed), tier: 'llm' }); return 'llm'; }
  }

  // The encyclopedia's own words, read out: Simple English Wikipedia is
  // written for learners, so it is used as it is (accurate and instant);
  // also the answer when there is no model, or the model had nothing useful.
  async function readWiki() {
    await ack;
    const lead = /^\s*(who|when|where|what year|how (cold|hot|tall|high|far|big|heavy|deep|long|old))\b/i.test(text) && deep.length;
    const lines = (lead ? deep.slice(0, 1) : deep.length >= 2 ? deep : wiki.sentences(web.extract, 3)).slice(0, 3);
    const drawn = autoViz(lines, { topic: web.title, question: text });
    const pic = richViz(`${text} ${lines.join(' ')}`, { question: text, topic: web.title }) || webPicture || (strong(drawn) ? drawn : null) || await learnPanel();
    emit({ type: 'plan', tier: 'wiki', kind: 'chat', title: web.title, watch: web.title, about: web.description, source, context: { offer: null },
      steps: lines.map((say, i) => ({ say, draw: i === 0
        ? [{ op: 'clear' }, { op: 'title', text: web.title }, ...(pic ? [pic] : []), { op: 'note', text: `From ${web.site || 'Wikipedia'}: ${web.title}`, color: 'teal' }, { op: 'text', text: say, color: 'ink' }]
        : [{ op: 'text', text: say, color: 'ink' }] })) });
    await glanceCard();
    onTodo?.(text, { answered: true });
    return 'wiki';
  }
  // Our own articles and Simple English Wikipedia are read as written.
  // A person, a year or a place asked for: the article's own sentence that says it (a small model would guess).
  if (web && deep.length && /^\s*(who|when|where|what year|how (cold|hot|tall|high|far|big|heavy|deep|long|old))\b/i.test(text) && !['simpler', 'example'].includes(follow.kind)) return readWiki();
  // "Tell me about Narendra Modi", "who is…", "what is…": the encyclopedia's own
  // summary, read as written (a small model asked to retell it may refuse or invent).
  if (web && !deep.length && !['simpler', 'example'].includes(follow.kind) && /\b(tell me (something |a bit |more )?about|who (is|was|were|are)|what (is|are|was|were)|explain|describe)\b/i.test(t) && wiki.sentences(web.extract, 2).length >= 1) return readWiki();
  // "Simpler" and "an example" need new words: those go to the model, with the article as its notes.
  if (!['simpler', 'example'].includes(follow.kind) && (web?.lang === 'own' || (web?.lang === 'simple' && !deep.length)) && wiki.sentences(web.extract, 3).length >= 2) return readWiki();

  // Nothing checked to go on (no lesson notes, no article): the small model
  // would only guess, so the best videos on it are shown instead.
  if (!web && !notes.length && videos && isRealQuestion(t)) {
    const topic = wiki ? wiki.subject(text) : text;
    const vids = topic.length > 2 ? await Promise.race([videos.search(topic).catch(() => []), new Promise((r) => setTimeout(() => r([]), 5000))]) : [];
    if (vids.length) {
      await ack;
      onTodo?.(text, { answered: false });
      emit({ type: 'plan', ...videoPlan(topic, vids), tier: 'video' });
      return 'video';
    }
  }

  if (up) {
    const a = await ack;
    const title = a?.topic || 'Good question';
    let started = false;
    // The answer's picture: a lesson diagram of the pack the notes came from,
    // at once; otherwise one made from the first sentences as they arrive.
    const grounding = hits.find((h) => h.score >= GROUND && h.card.pack && packs.get(h.card.pack));
    // A lesson's diagram only when its card really matches (and no article): an
    // online-safety list is not a picture of a prime minister.
    let figure = richViz(text, { question: text }) || webPicture || (grounding && !web && grounding.score >= ACCEPT ? packDiagram(packs.get(grounding.card.pack), `${text} ${grounding.card.q || ''} ${grounding.card.a || ''}`) : null) ;
    if (!figure && web) figure = await learnPanel();
    let drawn = false;
    const said = [];
    // A refusal or "I am not sure" from the model is dropped; when it is the
    // model's first word and the article is there, the article is read instead.
    const refused = new AbortController();
    const asked = new Set(tokens(`${text} ${web?.title || ''} ${a?.topic || ''}`).map((w) => w.slice(0, 5)));
    const n = await llm.chat(text, {
      history, notes, signal: signal ? AbortSignal.any([signal, refused.signal]) : refused.signal,
      onSentence: (sentence, i0) => {
        if (HEDGE.test(sentence.trim()) || SELF.test(sentence)) { if (!said.length && web) refused.abort(); return; }
        // A question back about something else (from a stray note) is dropped.
        if (/\?\s*$/.test(sentence) && !tokens(sentence).some((w) => !GENERIC.has(w) && w.length > 3 && asked.has(w.slice(0, 5)))) return;
        const i = said.length;
        if (!started) { started = true; emit({ type: 'plan', kind: 'chat', title: web?.title || title, watch: web?.title || a?.topic || text, about: web?.description, source, streaming: true, steps: [], tier: web ? 'chat+wiki' : 'chat', context: { offer: null } }); }
        said.push(sentence);
        if (!figure && i === 1) figure = autoViz(said, { topic: a?.topic || '', question: text });
        const pic = figure && !drawn ? [figure] : [];
        if (pic.length) drawn = true;
        emit({ type: 'step', step: { say: sentence, draw: i === 0
          ? [{ op: 'clear' }, { op: 'title', text: web?.title || title }, ...pic, { op: 'note', text: web ? `A quick answer, checked with ${web.site || 'Wikipedia'}: ${web.title}` : 'A quick answer: no full lesson on this yet', color: 'teal' }, { op: 'text', text: sentence, color: 'ink' }]
          : [...pic, { op: 'text', text: sentence, color: 'ink' }] } });
      },
    }).catch((e) => { if (e.name !== 'AbortError') console.error('chat:', e.message); return 0; });
    if (said.length > 0) {
      if (!drawn) { const pic = autoViz(said, { topic: a?.topic || '', question: text }); if (pic) emit({ type: 'figure', draw: [pic] }); }
      await glanceCard();
      // No article behind this answer (only lesson notes): a good video to go further.
      if (!web && videos && isRealQuestion(t)) {
        const topic = (wiki ? wiki.subject(text) : text).replace(/^(to|how to)\s+/i, '');
        const vids = await Promise.race([videos.search(topic).catch(() => []), new Promise((r) => setTimeout(() => r([]), 4000))]);
        if (vids.length) emit({ type: 'step', step: { say: `To learn more, here is a good video: ${vids[0].title.replace(/[|#].*$/, '').trim()}. Tap it to watch.`, draw: [{ op: 'clear' }, { op: 'title', text: `Watch: ${topic.charAt(0).toUpperCase() + topic.slice(1)}` }, { op: 'video', items: vids.slice(0, 3) }, { op: 'note', text: 'Tap a video to open it on YouTube', color: 'teal' }] } });
      }
      emit({ type: 'end' });
      if (isRealQuestion(t)) onTodo?.(text, { answered: true });
      return 'chat';
    }
  }

  // No model, or it had nothing useful: the article, read out.
  if (web) return readWiki();

  await ack;
  onTodo?.(text, { answered: false });
  // Not in any notes: a good video on it, on the board, while the team adds a lesson.
  const topic = wiki ? wiki.subject(text) : text;
  const vids = videos && isRealQuestion(t) && topic.length > 2 ? await Promise.race([videos.search(topic).catch(() => []), new Promise((r) => setTimeout(() => r([]), 5000))]) : [];
  emit({ type: 'plan', ...(vids.length ? videoPlan(topic, vids) : missPlan(text, packs)), tier: 'miss' });
  return 'miss';
}
