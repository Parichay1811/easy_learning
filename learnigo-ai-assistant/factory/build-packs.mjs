#!/usr/bin/env node
// The pack factory: a draft lesson pack for every topic in factory/topics.json
// (and topics-extra.json), written by a local model through Ollama, free and
// unattended. Each pack is checked by lib/schema.mjs and retried with the
// problems listed when it fails. Resumable: topics that already have a pack
// are skipped, so it can be stopped and started again at any time.
//
//   node factory/build-packs.mjs                      all topics, gemma4:e4b
//   node factory/build-packs.mjs --only MATH-TRIG,BIO --limit 20 --model gemma4:26b-mlx
//   node factory/build-packs.mjs --import-brief ../docs/learnigo/AGENTIC_CHANNEL_MASTER.md
//   node factory/build-packs.mjs --spread             one topic per subject in turn
//   node factory/build-packs.mjs --add-visuals        pictures for packs made without them
//   node factory/build-packs.mjs --enrich             pictures, plus an everyday example and the common mistake
//
// Generated packs are "status": "draft": a local model makes mistakes, so a
// person reviews them (change the status to "reviewed"). Sensitive topics and
// exam-format topics are never generated (see skipReason in topics.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { briefTopics, extraTopics, parseBrief, saveSnapshot, skipReason, domainOf } from './topics.mjs';
import { packProblems } from '../lib/schema.mjs';
import { speakable } from '../lib/speech-text.mjs';
import { findPlace, placesIn } from '../shared/places.js';
import { parseExpr } from '../shared/expr.js';
import { element } from '../shared/elements.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKS = path.resolve(HERE, '..', 'packs');
const REPORT = path.join(HERE, 'report.jsonl');
const arg = (name, dflt = null) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : dflt; };
const flag = (name) => process.argv.includes(`--${name}`);

// The live site and the factory share one Ollama, which keeps one model
// loaded at a time: while students are asking (the server touches
// data/site-active), the factory waits, so the site's model is not queued.
const ACTIVE = path.resolve(HERE, '..', process.env.LT_DATA || 'data', 'site-active');
async function yieldToSite() {
  for (;;) {
    let last = 0;
    try { last = fs.statSync(ACTIVE).mtimeMs; } catch { return; }
    if (Date.now() - last > 90000) return;
    await new Promise((r) => setTimeout(r, 5000));
  }
}
// Every model call goes through here. It waits while the site is busy, and
// a request already running is cancelled the moment a student asks (Ollama
// stops on a closed request), then sent again once the site is quiet.
const activeAt = () => { try { return fs.statSync(ACTIVE).mtimeMs; } catch { return 0; } };
async function chatFetch(host, { ms, ...opts }) {
  for (;;) {
    await yieldToSite();
    const started = Date.now();
    const stop = new AbortController();
    const watch = setInterval(() => { if (activeAt() > started) stop.abort(new Error('site busy')); }, 1500);
    try {
      const res = await fetch(`${host}/api/chat`, { ...opts, signal: AbortSignal.any([stop.signal, AbortSignal.timeout(ms)]) });
      const body = await res.text(); // read it here, so a cancel mid-answer retries too
      return new Response(body, { status: res.status, headers: res.headers });
    } catch (e) {
      if (!stop.signal.aborted) throw e;
    } finally {
      clearInterval(watch);
    }
  }
}

const LEVELS = {
  EY: 'age 4 to 5 (Reception, Kindergarten)', P1: 'age 6 to 7 (Grades 1 to 2)', P2: 'age 8 to 10 (Grades 3 to 5)',
  L: 'age 11 to 14 (Grades 6 to 8, KS3)', M: 'age 14 to 16 (GCSE, Class 9 to 10, MYP 4 to 5)', U: 'age 16 to 18 (A-level, IB DP, AP, Class 11 to 12)',
  E: 'entrance exams (SAT, ACT, JEE, NEET)', H: 'first-year university', PRO: 'working adults',
};

// The pictures a lesson step can have (public/board.js draws them).
const KINDS_TEXT = `"flow" (the steps of a process, in order), "cycle" (stages that repeat), "timeline" (items written "when: what"), "compare" (two sides: "left" and "right" titles, "items" for the left, "items2" for the right), "venn" ("left" and "right" titles, "items" only in the left, "items2" only in the right, "items3" in both), "parts" (a thing and its parts: "center" names the thing, "items" its parts), "tree" (kinds of something: "root" names the whole, "items" the kinds, each may be "kind: example"), "pyramid" (levels from the top, the fewest, to the base, the most), "bars" (things with numbers to compare: items "name: number", "label" says what is measured), "line" (a value changing over time: items "year or step: number", "label" says what is measured), "pie" (parts of a whole: items "name: number"), "table" (a small table: items are rows "cell | cell | cell", the first row the headings), "map" (where things are or were: "items" are real place names such as countries, cities, rivers, mountains and seas; "items2" may hold routes like "Venice > Constantinople"), "graph" (a maths function: "expr" like "y = x^2 - 4", "items" may mark points like "root (2, 0)"), "numberline" (items "label: number"), "fraction" ("value" like "3/4"), "angle" ("value" in degrees), "balance" (an equation: "left" and "right" sides), "forces" (a free-body diagram: "center" names the object, items like "up: Weight 500 N" with directions up, down, left or right), "wave" (items: the two things to mark, "label" a caption), "circuit" (items: the components in order, from cell, battery, switch, bulb, resistor, ammeter, voltmeter, motor), "atom" ("value" an element name), "orbits" ("center" and items: the bodies going round it), "quote" ("value" the exact famous words, "label" who said them and when), "count" ("value" a number up to 20, "label" what is counted), "bullets" (2 to 5 short points), "bignum" (one important number: "value" like "71%" and a short "label"), or "none". Pick the most specific picture: a map for any place in geography or history, a graph, number line, fraction, angle or balance in maths, forces, a wave, a circuit or orbits in physics, an atom in chemistry, a line, pie, bars or table for data, a timeline for dates, a quote for famous words`;

const SYSTEM = `You write lesson packs for Learnigo, a free voice teacher for school students in every English-speaking school system (UK, US, India, IB, Australia, Canada, Singapore).
Rules:
- Only correct, standard facts as taught in school textbooks. Where countries differ, say so plainly or leave it out. Never state exam dates, exam codes, mark weightings or grade boundaries.
- Write for the student's level given below.
- Every "say", "a", "question" and "why" is spoken aloud by a voice to one student: short sentences of 8 to 18 words, plain words, say "you", no lists, no markdown, no emojis. Write symbols as words a voice can read ("x squared", "pi", "degrees", "divided by").
- "screen" is the text shown on the board for that moment: at most 8 words; symbols are fine there (x², π, °, →).
- lesson: 4 to 6 steps. First the subtopics in order, one idea per step, each with one concrete example. Then one step with an everyday, real-life example of the idea. Then one step with the most common mistake students make and how to avoid it (for children under 8, a fun fact instead).
- Give each lesson step a "visual" that shows its idea as a picture: ${KINDS_TEXT}. Items are at most 6 words each, 2 to 6 of them, and use only facts from that step. Use a different kind of visual in each step where one fits; use "bullets" only when nothing else fits.
- faq: 5 to 7 questions students really ask about this topic, each with a 1 to 3 sentence answer and 2 or 3 other ways a student might ask the same thing ("asks").
- facts: 3 to 5 short checked facts.
- quiz: 3 original multiple-choice questions: recall, apply, and one shaped like "asked as" (do not write the words "asked as" in it). Work out the answer first and write it in "correct". Then write exactly 3 different wrong options in "wrong", each a real common mistake, with "why" saying why that mistake is tempting but wrong. "explain" says why the correct answer is right. Never copy a real exam question.
- keywords: 4 to 10 words a student would use to name this topic.
- examples: 2 or 3 questions a student might ask the teacher about this topic.
Reply with the JSON only.`;

// A picture for a lesson step (drawn by public/board.js).
const VISUAL = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['none', 'flow', 'cycle', 'timeline', 'compare', 'venn', 'parts', 'tree', 'pyramid', 'bars', 'line', 'pie', 'table', 'map', 'graph', 'numberline', 'fraction', 'angle', 'balance', 'forces', 'wave', 'circuit', 'atom', 'orbits', 'quote', 'count', 'bullets', 'bignum'] },
    items: { type: 'array', items: { type: 'string' }, maxItems: 6 },
    left: { type: 'string' }, right: { type: 'string' }, items2: { type: 'array', items: { type: 'string' }, maxItems: 6 },
    items3: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    center: { type: 'string' }, root: { type: 'string' }, expr: { type: 'string' },
    value: { type: 'string' }, label: { type: 'string' },
  },
  required: ['type', 'items'],
};

// The model's visual -> a draw op, or null when it is empty or malformed.
// Board items are plain words: models sometimes write TeX arrows in them.
const plainTex = (x) => String(x ?? '').replace(/\$?\\(right|long)?arrow\$?|\$?\\to\$?|\$?\\Rightarrow\$?/gi, '→').replace(/\$?\\leftarrow\$?/gi, '←').replace(/\$([^$]*)\$/g, '$1');

export function visualOp(v, say = '') {
  if (!v || v.type === 'none') return null;
  const list = (a) => (Array.isArray(a) ? a.map((x) => clean(plainTex(x), 80)).filter(Boolean).slice(0, 6) : []);
  const items = list(v.items);
  const at = cue(items[0] || clean(v.value, 20), say);
  const timed = at ? { at } : {};
  if (['flow', 'cycle', 'timeline', 'bullets', 'pyramid'].includes(v.type)) return items.length >= 2 ? { op: v.type, items, ...timed } : null;
  if (v.type === 'parts') return clean(v.center, 40) && items.length >= 2 ? { op: 'parts', center: clean(v.center, 40), items, ...timed } : null;
  if (v.type === 'tree') return clean(v.root, 50) && items.length >= 2 ? { op: 'tree', root: clean(v.root, 50), items: items.slice(0, 4), ...timed } : null;
  if (v.type === 'bars') {
    const rows = items.filter((x) => /[:\s][-\d.,]+\s*(%|°|[a-zA-Z]{0,12})\s*$/.test(x));
    return rows.length >= 2 ? { op: 'bars', items: rows, ...(clean(v.label, 80) ? { label: clean(v.label, 80) } : {}), ...timed } : null;
  }
  const named = (s) => /:\s*-?\d[\d,]*(\.\d+)?\s*(%|[a-zA-Z°]{0,12})\s*$/.test(s);
  if (v.type === 'line' || v.type === 'pie') { const rows = items.filter(named); return rows.length >= (v.type === 'line' ? 3 : 2) ? { op: v.type, items: rows, ...(clean(v.label, 60) ? { label: clean(v.label, 60) } : {}), ...timed } : null; }
  if (v.type === 'table') { const rows = items.filter((r) => r.includes('|')); return rows.length >= 2 ? { op: 'table', items: rows, ...timed } : null; }
  if (v.type === 'map') {
    const places = items.filter((x) => findPlace(x));
    const routes = list(v.items2).filter((r) => r.split(/\s*(?:>|→|->)\s*/).filter((x) => findPlace(x)).length >= 2);
    return places.length || routes.length ? { op: 'map', items: places, ...(routes.length ? { items2: routes } : {}), ...(clean(v.label, 80) ? { label: clean(v.label, 80) } : {}), ...timed } : null;
  }
  if (v.type === 'graph') { const expr = clean(v.expr || v.value, 60); return parseExpr(expr) ? { op: 'graph', expr, items: items.filter((x) => /\(\s*-?[\d.]+\s*,\s*-?[\d.]+\s*\)/.test(x)).slice(0, 4), ...timed } : null; }
  if (v.type === 'numberline') { const marks = items.filter((x) => /-?\d/.test(x)); return marks.length ? { op: 'numberline', items: marks, ...timed } : null; }
  if (v.type === 'fraction') { const f = String(v.value || '').match(/\b(\d{1,2})\s*\/\s*(\d{1,2})\b/); return f && +f[2] > 0 ? { op: 'fraction', value: `${f[1]}/${f[2]}`, ...(clean(v.label, 80) ? { label: clean(v.label, 80) } : {}), ...timed } : null; }
  if (v.type === 'angle') { const d = Number(String(v.value || '').match(/\d+(\.\d+)?/)?.[0]); return d > 0 && d <= 360 ? { op: 'angle', value: String(d), ...timed } : null; }
  if (v.type === 'balance') return clean(v.left, 30) && clean(v.right, 30) ? { op: 'balance', left: clean(v.left, 30), right: clean(v.right, 30), ...timed } : null;
  if (v.type === 'forces') { const f = items.filter((x) => /^\s*(up|down|left|right)(-(left|right))?\s*[:-]/i.test(x)); return f.length ? { op: 'forces', center: clean(v.center, 30) || 'Object', items: f, ...timed } : null; }
  if (v.type === 'wave') return { op: 'wave', items: items.slice(0, 2), ...(clean(v.label, 80) ? { label: clean(v.label, 80) } : {}), ...timed };
  if (v.type === 'circuit') { const parts = items.filter((x) => /cell|battery|switch|bulb|lamp|resistor|ammeter|voltmeter|motor|buzzer|led/i.test(x)); return parts.length >= 2 ? { op: 'circuit', items: parts, ...timed } : null; }
  if (v.type === 'atom') { const e = element(v.value) || element(v.center); return e ? { op: 'atom', value: e.name, ...timed } : null; }
  if (v.type === 'orbits') return items.length >= 2 ? { op: 'orbits', center: clean(v.center, 30) || 'Sun', items, ...timed } : null;
  if (v.type === 'quote') { const q = clean(v.value, 220); return q.length >= 10 ? { op: 'quote', value: q, ...(clean(v.label, 60) ? { label: clean(v.label, 60) } : {}), ...timed } : null; }
  if (v.type === 'count') { const n = Math.round(Number(String(v.value || '').match(/\d+/)?.[0])); return n >= 1 && n <= 20 ? { op: 'count', value: String(n), ...(clean(v.label, 30) ? { label: clean(v.label, 30) } : {}), ...timed } : null; }
  if (v.type === 'venn') {
    const b = list(v.items2);
    const both = list(v.items3);
    return clean(v.left, 30) && clean(v.right, 30) && (items.length || b.length) && both.length ? { op: 'venn', left: clean(v.left, 30), right: clean(v.right, 30), a: items.slice(0, 3), b: b.slice(0, 3), both: both.slice(0, 3), ...timed } : null;
  }
  if (v.type === 'compare') {
    const b = list(v.items2);
    return clean(v.left, 40) && clean(v.right, 40) && items.length && b.length ? { op: 'compare', left: clean(v.left, 40), right: clean(v.right, 40), a: items.slice(0, 4), b: b.slice(0, 4), ...timed } : null;
  }
  if (v.type === 'bignum') return clean(v.value, 16) ? { op: 'bignum', value: clean(v.value, 16), label: clean(v.label, 120), ...timed } : null;
  return null;
}

const GEN_SCHEMA = {
  type: 'object',
  properties: {
    keywords: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 10 },
    examples: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 3 },
    lesson: { type: 'array', minItems: 4, maxItems: 6, items: { type: 'object', properties: { say: { type: 'string' }, screen: { type: 'string' }, style: { type: 'string', enum: ['text', 'formula', 'note'] }, visual: VISUAL }, required: ['say', 'screen', 'style', 'visual'] } },
    faq: { type: 'array', minItems: 5, maxItems: 7, items: { type: 'object', properties: { q: { type: 'string' }, a: { type: 'string' }, asks: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 3 } }, required: ['q', 'a', 'asks'] } },
    facts: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 5 },
    quiz: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'object', properties: {
      question: { type: 'string' }, screen: { type: 'string' }, correct: { type: 'string' }, explain: { type: 'string' },
      wrong: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'object', properties: { option: { type: 'string' }, why: { type: 'string' } }, required: ['option', 'why'] } },
    }, required: ['question', 'screen', 'correct', 'explain', 'wrong'] } },
  },
  required: ['keywords', 'examples', 'lesson', 'faq', 'facts', 'quiz'],
};

const hash = (t) => { let h = 2166136261; for (const ch of t) h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0; return h; };
const clean = (s, max = 400) => String(s ?? '').replace(/[*#`_]+/g, '').replace(/\p{Extended_Pictographic}/gu, '').replace(/\s+/g, ' ').trim().slice(0, max);

// The first word of the screen text that the voice also says: the moment it appears.
function cue(screen, say) {
  const spoken = new Set(say.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z0-9']/g, '')));
  return screen.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z0-9']/g, '')).find((w) => w.length >= 4 && spoken.has(w));
}

// The model's answer -> a pack in the format of packs/SCHEMA.md.
export function toPack(topic, g, model) {
  const explain = g.lesson.map((s, i) => {
    const say = clean(s.say);
    const screen = clean(s.screen, 90);
    const at = cue(screen, say);
    const pic = visualOp(s.visual, say);
    return { say, draw: [...(i === 0 ? [{ op: 'clear' }, { op: 'title', text: topic.title }] : []), ...(pic ? [pic] : []), { op: s.style, text: screen, ...(at ? { at } : {}) }] };
  });
  return {
    id: topic.id, status: 'draft', generator: { model, date: new Date().toISOString().slice(0, 10), source: topic.source, enriched: true },
    title: topic.title, area: topic.area, group: topic.group, levels: topic.levels,
    keywords: [...new Set(g.keywords.map((k) => clean(k, 60).toLowerCase()).filter(Boolean))],
    examples: g.examples.map((e) => clean(e, 160)).filter(Boolean),
    figure: [],
    explain,
    faq: g.faq.map((f) => ({ q: clean(f.q, 200), a: clean(f.a, 450), asks: (f.asks || []).map((x) => clean(x, 200)).filter(Boolean) })),
    facts: g.facts.map((f) => clean(f, 300)).filter(Boolean),
    // The model names the correct answer as text and the factory places it
    // (by a hash of the question, so answers spread evenly over A to D): the
    // answer index can never point at the wrong option.
    quiz: g.quiz.map((q) => {
      const items = [{ show: clean(q.correct, 80), ok: true }, ...(q.wrong || []).map((w) => ({ show: clean(w.option, 80), why: clean(w.why, 300) }))];
      const shift = hash(`${topic.id} ${q.question}`) % items.length;
      const options = [...items.slice(shift), ...items.slice(0, shift)];
      const wrong = {};
      options.forEach((o, k) => { if (!o.ok && o.why) wrong[k] = o.why; });
      return {
        say: clean(q.question), show: clean(q.screen || q.question, 220),
        options: options.map((o) => ({ show: o.show, say: clean(speakable(o.show), 160) })),
        answer: options.findIndex((o) => o.ok), why: clean(q.explain, 450), wrong,
      };
    }),
  };
}

async function generate(topic, { model, host, feedback = null }) {
  const levels = topic.levels.map((l) => `${l} = ${LEVELS[l] || l}`).join('; ');
  const user = [
    `Topic id: ${topic.id}`, `Topic: ${topic.title}`, `Subject: ${topic.area} / ${topic.group}`, `Student level: ${levels}`,
    `Must teach (subtopics): ${topic.subtopics}`, `Asked as: ${topic.askedAs}`,
    ...(feedback ? [`Your last pack had these problems, fix them: ${feedback}`] : []),
  ].join('\n');
  const res = await chatFetch(host, {
    method: 'POST',
    ms: 10 * 60 * 1000,
    body: JSON.stringify({
      model, stream: false, keep_alive: '30m', format: GEN_SCHEMA,
      ...(/qwen3|gemma4/.test(model) ? { think: false } : {}),
      options: { temperature: 0.4, num_ctx: 8192, num_predict: 4096 },
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`ollama ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return JSON.parse(data.message.content);
}

// Checks the questions two ways and returns { problems, drop }: rules (the
// explanation must be about the marked option) and an independent solve
// (the model answers each question again without the answer key).
const norm = (s) => ` ${speakable(String(s)).toLowerCase().replace(/\.(?!\d)/g, ' ').replace(/[^a-z0-9.]+/g, ' ').trim()} `;
const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const mentions = (text, option) => {
  const t = norm(text);
  const o = norm(option).trim();
  if (!o || o.split(' ').length > 4) return false;
  const n = Number(o);
  return t.includes(` ${o} `) || (Number.isInteger(n) && n >= 0 && n <= 12 && t.includes(` ${NUM_WORDS[n]} `));
};

export async function checkQuiz(pack, { model, host }) {
  const problems = [];
  const drop = new Set();
  for (const [i, q] of pack.quiz.entries()) {
    if (/asked as/i.test(`${q.say} ${q.show}`)) { problems.push(`quiz ${i}: remove the words "asked as"`); drop.add(i); }
    const named = q.options.map((o, k) => (mentions(q.why, o.show) ? k : -1)).filter((k) => k >= 0);
    if (named.length === 1 && named[0] !== q.answer) { problems.push(`quiz ${i}: "why" explains option ${'ABCD'[named[0]]} but the answer is ${'ABCD'[q.answer]}`); drop.add(i); continue; }
    const res = await chatFetch(host, {
      method: 'POST', ms: 120000,
      body: JSON.stringify({
        model, stream: false, keep_alive: '30m', ...(/qwen3|gemma4/.test(model) ? { think: false } : {}),
        format: { type: 'object', properties: { working: { type: 'string' }, choice: { type: 'integer', enum: q.options.map((_, k) => k) } }, required: ['working', 'choice'] },
        options: { temperature: 0, num_ctx: 8192, num_predict: 400 },
        messages: [{ role: 'user', content: `Answer this multiple-choice question. Work it out briefly in "working", then give the index of the correct option (0 for A).\n${q.say}\n${q.options.map((o, k) => `${k}. ${o.show}`).join('\n')}` }],
      }),
    }).then((r) => r.json()).catch(() => null);
    let choice = null;
    try { choice = JSON.parse(res.message.content).choice; } catch { /* unchecked */ }
    if (choice != null && choice !== q.answer) { problems.push(`quiz ${i}: an independent solve chose ${'ABCD'[choice]} (${q.options[choice].show}), the answer says ${'ABCD'[q.answer]} (${q.options[q.answer].show}); recheck it`); drop.add(i); }
  }
  return { problems, drop };
}

async function makeOne(t, { model, host }) {
  let problems = [];
  let pack = null;
  let tries = 0;
  let best = null;
  while (tries < 3) {
    tries++;
    try {
      pack = toPack(t, await generate(t, { model, host, feedback: problems.length ? problems.slice(0, 6).join('; ') : null }), model);
      problems = packProblems(pack);
      if (!problems.length) {
        const check = await checkQuiz(pack, { model, host });
        // Keep the questions that passed when at least two did.
        const kept = pack.quiz.filter((_, i) => !check.drop.has(i));
        if (kept.length >= 2 && (!best || kept.length > best.quiz.length)) best = { ...pack, quiz: kept };
        problems = check.problems;
      }
    } catch (e) {
      problems = [`could not generate: ${e.message}`];
    }
    if (!problems.length) return { pack, problems, tries };
  }
  return best ? { pack: best, problems: [], tries, dropped: problems } : { pack: null, problems, tries };
}

const VISUALS_SYSTEM = `You add pictures to a short spoken lesson for school students. For each lesson step, choose the one visual that best shows its idea: ${KINDS_TEXT}. Items are at most 6 words each, 2 to 6 of them, and must only use facts from the step. Use a different kind in each step where one fits; use "bullets" only when nothing else fits. Reply with the JSON only.`;

const PICTURES = ['flow', 'cycle', 'timeline', 'compare', 'bullets', 'bignum', 'parts', 'tree', 'venn', 'bars', 'pyramid', 'line', 'pie', 'table', 'map', 'graph', 'numberline', 'fraction', 'angle', 'balance', 'forces', 'wave', 'circuit', 'atom', 'orbits', 'quote', 'count', 'rect', 'tri', 'circle', 'vecgrid'];
const hasVisual = (pack) => pack.explain.some((s) => s.draw.some((o) => PICTURES.includes(o.op)));

// A hint of the visual that usually fits a step, from its words: small
// models pick bullets for everything unless the step says what it is.
export function suggestKind(say) {
  const t = say.toLowerCase();
  const numbers = t.match(/\b\d[\d,.]*\s*(%|percent|million|billion|thousand|km|kilomet|years|degrees|metres|meters|kg)?/g) || [];
  if (placesIn(say).filter((p) => p.kind !== 'line').length >= 1) return 'map';
  if (/\by\s*=\s*[-\dx(]/.test(t)) return 'graph';
  if (/\b(force|forces|newtons?)\b/.test(t) && /\b(up|down|push|pull|weight|friction|drag|thrust|lift)\b/.test(t)) return 'forces';
  if (/\b(atom|electrons?|shells?|protons?)\b/.test(t)) return 'atom';
  if (/\bcircuit\b/.test(t)) return 'circuit';
  if (/\b(wave|wavelength|amplitude|frequency)\b/.test(t)) return 'wave';
  if (/\b(orbit|orbits|planets?)\b/.test(t)) return 'orbits';
  if (/\b\d+\s*\/\s*\d+\b|\bfractions?\b/.test(t)) return 'fraction';
  if (/\bangles?\b|\bdegrees\b/.test(t)) return 'angle';
  if (/\bsaid|wrote|famous words|speech\b/.test(t)) return 'quote';
  if (/\b(1[0-9]{3}|20[0-9]{2})s?\b|\bcentur(y|ies)\b|\b(bc|bce|ad)\b/.test(t)) return 'timeline';
  if (/\b(cycle|repeats?|again and again|over and over|life cycle|loop)\b/.test(t)) return 'cycle';
  if (/\b(both|in common|similar|share)\b/.test(t)) return 'venn';
  if (/\b(vs|versus|whereas|unlike|differen(t|ce)|compared?|on the other hand|while the)\b/.test(t)) return 'compare';
  if (/\b(levels?|hierarchy|pyramid|at the top|at the bottom|base of)\b/.test(t)) return 'pyramid';
  if (/\b(types|kinds|categories|groups|divided into|classified|branches|families)\b/.test(t)) return 'tree';
  if (/\b(parts?|made of|made up of|consists? of|contains?|has (two|three|four|five|six)|features|organs?|components?)\b/.test(t)) return 'parts';
  if (/\b(first|then|next|after that|finally|step|process|turns into|becomes|leads to)\b/.test(t)) return 'flow';
  if (numbers.length >= 2) return 'bars';
  if (numbers.some((n) => /%|percent|million|billion|thousand|km|kilomet|years|degrees|metres|meters|kg/.test(n))) return 'bignum';
  return null;
}

// Adds a visual to each lesson step of a pack that has none.
export async function addVisuals(pack, { model, host }) {
  const steps = pack.explain.map((s, i) => {
    const hint = suggestKind(s.say);
    return `${i + 1}. ${s.say} [board: ${s.draw.filter((o) => o.text && o.op !== 'title').map((o) => o.text).join(' / ')}]${hint ? ` (a ${hint} may fit)` : ''}`;
  }).join('\n');
  let visuals = await askVisuals(pack, steps, { model, host });
  // Models fall back on bullets: ask once more when every step got the same kind.
  const kinds = new Set(visuals.map((v) => v?.type).filter((k) => k && k !== 'none'));
  if (pack.explain.length >= 3 && kinds.size < 2) {
    visuals = await askVisuals(pack, steps, { model, host, nudge: `Your last answer used only "${[...kinds][0] || 'none'}". Use at least two different kinds: a timeline when there are dates or an order in time, compare when two things are set side by side, flow for a process, cycle for something that repeats, bignum for an important number.` });
  }
  let added = 0;
  const explain = pack.explain.map((s, i) => {
    const pic = visualOp(visuals[i], s.say);
    if (!pic) return s;
    added++;
    const draw = [...s.draw];
    const after = draw.findIndex((o) => o.op === 'title');
    draw.splice(after >= 0 ? after + 1 : 0, 0, pic);
    return { ...s, draw };
  });
  return { pack: { ...pack, explain }, added };
}

async function askVisuals(pack, steps, { model, host, nudge = '' }) {
  const res = await chatFetch(host, {
    method: 'POST', ms: 5 * 60 * 1000,
    body: JSON.stringify({
      model, stream: false, keep_alive: '30m', ...(/qwen3|gemma4/.test(model) ? { think: false } : {}),
      format: { type: 'object', properties: { visuals: { type: 'array', minItems: pack.explain.length, maxItems: pack.explain.length, items: VISUAL } }, required: ['visuals'] },
      options: { temperature: 0.3, num_ctx: 8192, num_predict: 1500 },
      messages: [{ role: 'system', content: VISUALS_SYSTEM }, { role: 'user', content: `Lesson: ${pack.title}\n${steps}${nudge ? `\n${nudge}` : ''}` }],
    }),
  });
  if (!res.ok) throw new Error(`ollama ${res.status}`);
  return JSON.parse((await res.json()).message.content).visuals || [];
}

// Two more steps for a pack made before lessons had them: an everyday
// example and the common mistake, each with its picture.
const ENRICH_SYSTEM = `You extend a short spoken lesson for school students with two more steps about the same topic.
- "example": an everyday, real-life example of THIS lesson's main idea (not another subject), where the student meets it, and what the idea explains there. Exactly 3 sentences, 30 to 55 words in all.
- "mistake": the most common mistake students make about THIS topic, then the right way to think about it. Start with "A common mistake is". Exactly 3 sentences, 30 to 55 words in all. For children under 8, a fun fact about the topic instead.
- Each "visual" is a picture of that step (not "none" when any kind fits).
Example of the length wanted, for a lesson on fractions: "When you share a pizza with three friends, each of you gets one quarter. The pizza is the whole, and the four slices are equal parts. That is exactly what the fraction one over four means."
Rules: only correct, standard facts as taught in school textbooks; if you are not sure a fact is right, leave it out. "say" is spoken aloud to one student: short sentences of 8 to 18 words, plain words, say "you", no lists, no markdown, no emojis, symbols written as words. "screen" is the board text, at most 8 words. Give each step a "visual": ${KINDS_TEXT}. Items are at most 6 words each and use only facts from that step. Reply with the JSON only.`;

const STEP = { type: 'object', properties: { say: { type: 'string' }, screen: { type: 'string' }, visual: VISUAL }, required: ['say', 'screen', 'visual'] };
const words = (t) => new Set(String(t).toLowerCase().match(/[a-z]{4,}/g) || []);

export async function addSteps(pack, { model, host }) {
  const lesson = pack.explain.map((s, i) => `${i + 1}. ${s.say}`).join('\n');
  const ask = (body) => chatFetch(host, {
    method: 'POST', ms: 5 * 60 * 1000,
    body: JSON.stringify({ model, stream: false, keep_alive: '30m', ...(/qwen3|gemma4/.test(model) ? { think: false } : {}), ...body }),
  }).then(async (r) => { if (!r.ok) throw new Error(`ollama ${r.status}`); return JSON.parse((await r.json()).message.content); });
  const g = await ask({
    format: { type: 'object', properties: { example: STEP, mistake: STEP }, required: ['example', 'mistake'] },
    options: { temperature: 0.4, num_ctx: 8192, num_predict: 1500 },
    messages: [{ role: 'system', content: ENRICH_SYSTEM }, { role: 'user', content: `Topic: ${pack.title}\nSubject: ${pack.area || pack.group || ''}${pack.levels?.length ? `\nStudent level: ${pack.levels.map((l) => `${l} = ${LEVELS[l] || l}`).join('; ')}` : ''}\nThe lesson so far:\n${lesson}` }],
  });
  // On topic: a step must share words with the title, keywords or lesson.
  const topicWords = words(`${pack.title} ${pack.keywords.join(' ')} ${lesson}`);
  const steps = [g.example, g.mistake].filter((x) => x?.say && clean(x.say).split(/\s+/).length >= 18 && [...words(x.say)].filter((w) => topicWords.has(w)).length >= 2);
  if (!steps.length) return { pack, added: 0 };
  // A second look at the facts, as for quiz answers: drop a step it doubts.
  const kept = [];
  for (const x of steps) {
    const v = await ask({
      format: { type: 'object', properties: { problem: { type: 'string' }, verdict: { type: 'string', enum: ['correct', 'wrong'] } }, required: ['problem', 'verdict'] },
      options: { temperature: 0, num_ctx: 8192, num_predict: 300 },
      messages: [{ role: 'user', content: `You check a school lesson about "${pack.title}" for factual errors. Name any statement that is false or misleading in "problem" (or "none"), then give the verdict.\n${x.say}` }],
    }).catch(() => null);
    // Its verdict is not enough (it once named the wrong pH and still said
    // "correct"): any problem named drops the step.
    if (v?.verdict === 'correct' && /^\W*(none|no\b|nothing|n\/a|$)/i.test(v.problem || '')) kept.push(x);
  }
  kept.splice(Math.max(0, 8 - pack.explain.length));
  const extra = kept.map((x) => {
    const say = clean(x.say);
    const screen = clean(x.screen, 90);
    const at = cue(screen, say);
    const pic = visualOp(x.visual, say);
    return { say, draw: [...(pic ? [pic] : []), { op: x === g.mistake ? 'note' : 'text', text: screen, ...(at ? { at } : {}) }] };
  });
  return { pack: { ...pack, explain: [...pack.explain, ...extra], generator: { ...pack.generator, enriched: true } }, added: extra.length };
}

// Pictures where a pack has none (or only bullet points), and with --enrich
// the two extra steps too. Drafts only: reviewed packs are left as they are.
const DIAGRAMS = new Set(['flow', 'cycle', 'timeline', 'compare', 'bullets', 'bignum', 'parts', 'tree', 'venn', 'bars', 'pyramid', 'line', 'pie', 'table', 'map', 'graph', 'numberline', 'fraction', 'angle', 'balance', 'forces', 'wave', 'circuit', 'atom', 'orbits', 'quote', 'count']);
const onlyBullets = (pack) => { const ops = pack.explain.flatMap((s) => s.draw.map((o) => o.op)).filter((o) => DIAGRAMS.has(o)); return ops.length > 0 && ops.every((o) => o === 'bullets'); };
const stripDiagrams = (pack) => ({ ...pack, explain: pack.explain.map((s) => ({ ...s, draw: s.draw.filter((o) => !DIAGRAMS.has(o.op)) })) });

async function visualsPass({ model, host, parallel, only, limit, enrich }) {
  const files = fs.readdirSync(PACKS, { recursive: true }).filter((f) => f.endsWith('.json')).map((f) => path.join(PACKS, f));
  const needs = (p) => p.status === 'draft' && (!hasVisual(p) || onlyBullets(p) || (enrich && !p.generator?.enriched && p.explain.length <= 6));
  const todo = files.filter((f) => { if (only && !only.some((o) => path.basename(f).startsWith(o))) return false; try { return needs(JSON.parse(fs.readFileSync(f, 'utf8'))); } catch { return false; } }).slice(0, limit);
  console.log(`${todo.length} packs to improve: ${enrich ? 'pictures and two more steps' : 'pictures'} with ${model}`);
  let done = 0;
  const queue = todo.values();
  async function worker() {
    for (const file of queue) {
      const t0 = Date.now();
      const notes = [];
      try {
        let pack = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (!hasVisual(pack) || onlyBullets(pack)) {
          const r = await addVisuals(stripDiagrams(pack), { model, host });
          if (r.added && !packProblems(r.pack).length) { pack = r.pack; notes.push(`${r.added} pictures`); }
        }
        if (enrich && !pack.generator?.enriched && pack.explain.length <= 6) {
          const r = await addSteps(pack, { model, host });
          const problems = packProblems(r.pack);
          if (r.added && !problems.length) { pack = r.pack; notes.push(`${r.added} steps`); } else notes.push(problems[0] || 'no usable steps');
        }
        if (!packProblems(pack).length) { fs.writeFileSync(`${file}.part`, `${JSON.stringify(pack, null, 2)}\n`); fs.renameSync(`${file}.part`, file); }
      } catch (e) { notes.push(`failed: ${e.message}`); }
      done++;
      console.log(`[improve ${done}/${todo.length}] ${path.basename(file, '.json')}: ${notes.join(', ') || 'unchanged'} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    }
  }
  await Promise.all(Array.from({ length: parallel }, worker));
}

async function main() {
  if (flag('add-visuals') || flag('enrich')) {
    return visualsPass({ model: arg('model', process.env.LT_FACTORY_MODEL || 'gemma4:e4b'), host: arg('host', 'http://127.0.0.1:11434'), parallel: Math.max(1, Number(arg('parallel', 1))), only: arg('only')?.split(',').map((x) => x.trim()), limit: Number(arg('limit', Infinity)), enrich: flag('enrich') });
  }
  const brief = arg('import-brief');
  if (brief) { const t = parseBrief(brief); saveSnapshot(t, path.basename(brief)); console.log(`imported ${t.length} topics into factory/topics.json`); return; }
  const model = arg('model', process.env.LT_FACTORY_MODEL || 'gemma4:e4b');
  const host = arg('host', 'http://127.0.0.1:11434');
  const only = arg('only')?.split(',').map((s) => s.trim()).filter(Boolean);
  const limit = Number(arg('limit', Infinity));
  const force = flag('force');
  let topics = [...briefTopics(), ...extraTopics()];
  if (only) topics = topics.filter((t) => only.some((o) => t.id === o || t.id.startsWith(`${o}-`) || t.id.startsWith(o)));
  const todo = [];
  let skipped = 0;
  for (const t of topics) {
    const file = path.join(PACKS, domainOf(t.id), `${t.id}.json`);
    if (skipReason(t)) { skipped++; continue; }
    if (!force && fs.existsSync(file)) continue;
    todo.push({ t, file });
  }
  // --spread: one topic from each subject in turn, so every subject gets
  // packs early instead of one subject at a time.
  if (flag('spread')) {
    const lanes = new Map();
    for (const x of todo) { const d = x.t.id.split('-')[0]; if (!lanes.has(d)) lanes.set(d, []); lanes.get(d).push(x); }
    const mixed = [];
    for (let i = 0; mixed.length < todo.length; i++) for (const lane of lanes.values()) if (lane[i]) mixed.push(lane[i]);
    todo.splice(0, todo.length, ...mixed);
  }
  const run = todo.slice(0, limit);
  console.log(`${topics.length} topics: ${run.length} to make now with ${model}, ${skipped} left to people, ${topics.length - skipped - todo.length} already made`);
  let ok = 0;
  let done = 0;
  const parallel = Math.max(1, Number(arg('parallel', 2)));
  const queue = run.entries();
  async function worker() {
    for (const [, { t, file }] of queue) {
      const t0 = Date.now();
      const { pack, problems, tries, dropped } = await makeOne(t, { model, host });
      const ms = Date.now() - t0;
      if (pack && !problems.length) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(`${file}.part`, `${JSON.stringify(pack, null, 2)}\n`);
        fs.renameSync(`${file}.part`, file);
        ok++;
      }
      done++;
      fs.appendFileSync(REPORT, `${JSON.stringify({ id: t.id, ok: !problems.length, tries, ms, model, quiz: pack?.quiz.length ?? 0, problems: problems.slice(0, 6), dropped: dropped?.slice(0, 6), at: new Date().toISOString() })}\n`);
      console.log(`[${done}/${run.length}] ${problems.length ? 'FAILED' : 'ok    '} ${t.id} ${t.title} (${(ms / 1000).toFixed(0)} s, ${tries} ${tries === 1 ? 'try' : 'tries'}${dropped ? `, ${3 - (pack?.quiz.length ?? 0)} question dropped` : ''})${problems.length ? `: ${problems[0]}` : ''}`);
    }
  }
  await Promise.all(Array.from({ length: parallel }, worker));
  console.log(`done: ${ok} of ${run.length} packs written to packs/`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
