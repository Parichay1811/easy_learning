// A picture for an answer that came without one: a short answer from a
// pack's common questions, a sentence from the small chat model, or a lesson
// step made before lessons had pictures. Plain rules, no model call, so it is
// instant: numbers become bars or a big number, "first ... then" a flow, two
// things set side by side a compare panel, and anything else a concept map
// with the topic in the middle and the answer's key points round it.
// Used by the server (lib/router.mjs) and the browser.

import { placesIn } from './places.js';
import { parseExpr } from './expr.js';
import { ELEMENTS } from './elements.js';
import { shapesIn } from './shapes.js';

const FILLER = /^(so|well|now|okay|ok|yes|no|also|and|but|basically|in other words|this means( that)?|that means( that)?|that is|remember( that)?|in short|for example|you see|here is the thing)[,:]?\s+/i;
const LEAD = /^(it|this|that|these|those|there|they|you)\s+(is|are|was|were|has|have|can|will|means?)\s+/i;
const STOP = new Set('a an the of to in on at for and or but is are was were be been it its this that these those with as by from you your we our they their he she his her them so do does did can will would should could about into than then there here what which who whom how why when where just very really also not no yes'.split(' '));
const UNIT = '(%|percent|per cent|km|kilomet(?:re|er)s?|met(?:re|er)s?|cm|centimet(?:re|er)s?|mm|millimet(?:re|er)s?|kg|kilograms?|grams?|g|litres?|liters?|years?|days?|hours?|minutes?|seconds?|degrees?|°c|°f|million|billion|thousand)';
// A unit is a whole word: "5 goals" is not 5 g.
const NUM = new RegExp(`(\\d[\\d,]*(?:\\.\\d+)?)\\s*(?:${UNIT}(?![a-z]))?`, 'gi');
const WORDLIKE = new Set(['He', 'In', 'As', 'Be', 'No', 'At', 'Am', 'I']);
const SEQ = /\b(first(ly)?|second(ly)?|then|next|after that|afterwards|finally|lastly|last of all|step)\b/i;
const CONTRAST = /\b(unlike|whereas|while|but|however|on the other hand|instead|vs\.?|versus|compared (to|with)|difference)\b/i;

export const sentencesOf = (text) => String(text).replace(/\s+/g, ' ').match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter((s) => s.split(' ').length >= 3) || [];

// A sentence cut to a board label of at most `max` words.
export function condense(sentence, max = 7) {
  let s = String(sentence).replace(/[.!?]+$/, '').trim();
  s = s.replace(/^(today|now|first|next|in this lesson)?,?\s*(we|you|let's|let us)\s+(will\s+)?(look at|learn about|learn|talk about|see|explore|study|find out about)\s+/i, '');
  for (let i = 0; i < 3; i++) s = s.replace(FILLER, '').replace(LEAD, '');
  // "If a force acts at an angle, we split it": the main clause.
  const sub = s.match(/^(if|when|whenever|because|although|though|as|since|once|after|before|while)\b[^,]{3,80},\s*(.+)$/i);
  if (sub && sub[2].split(/\s+/).length >= 3) s = sub[2].replace(LEAD, '');
  s = s.replace(/^(we|you|i)\s+(can|will|could|should|must|need to|have to)\s+/i, '');
  // "X is called Y": the name, and what it is when the name is short.
  const named = s.match(/^(.+?)\s+(?:is|are)\s+(?:usually |often |also |sometimes )?(?:called|known as|named)\s+(.+)$/i);
  if (named) {
    const [, what, name] = named;
    s = name.split(/\s+/).length >= 3 ? name.replace(/^(the|a|an)\s+/i, '') : `${name}: ${what.replace(/^(these|those|the|this|that)\s+/i, '').replace(/^\w/, (c) => c.toLowerCase())}`;
  }
  // "The radius is the distance from ...": "Radius: distance from ...".
  const def = !named && s.match(/^(?:the |a |an )?([\w'-]+(?:\s+[\w'-]+){0,2})\s+(?:is|are|means)\s+(?:the |a |an )?(.{6,})$/i);
  if (def && !/^(it|this|that|there|they|he|she|you|we)$/i.test(def[1])) s = `${def[1]}: ${def[2]}`;
  const clause = s.split(/,|;|\s+(?:because|which|so that|so|since|while|whereas|and then)\s+/i)[0];
  if (clause.split(/\s+/).length >= 3 && s.length > 44) s = clause;
  // Whole words up to about 44 characters (two lines on a diagram box).
  const words = s.split(/\s+/).filter(Boolean);
  let out = '';
  for (const w of words.slice(0, max + 3)) { if ((`${out} ${w}`).trim().length > 44 && out) break; out = `${out} ${w}`.trim(); }
  if (out.length < s.length) out = out.replace(/(\s+(a|an|the|of|to|in|on|at|and|or|with|for|is|are|into|from|by))+$/i, '');
  return out.charAt(0).toUpperCase() + out.slice(1);
}

const ABBR = { percent: '%', 'per cent': '%', kilometre: 'km', kilometer: 'km', kilometres: 'km', kilometers: 'km', metre: 'm', meter: 'm', metres: 'm', meters: 'm', centimetre: 'cm', centimeter: 'cm', centimetres: 'cm', centimeters: 'cm', millimetre: 'mm', millimeter: 'mm', millimetres: 'mm', millimeters: 'mm', kilogram: 'kg', kilograms: 'kg', gram: 'g', grams: 'g', litre: 'L', liter: 'L', litres: 'L', liters: 'L', degree: '°', degrees: '°' };
const unitOf = (u) => ABBR[u] ?? u;
// Which kind of quantity a unit measures: only units of one kind convert.
const FAMILY = { km: 'length', m: 'length', cm: 'length', mm: 'length', kg: 'mass', g: 'mass', L: 'volume', year: 'time', day: 'time', hour: 'time', minute: 'time', second: 'time' };
const familyOf = (u) => FAMILY[String(unitOf(String(u).toLowerCase())).replace(/s$/, '')] || FAMILY[unitOf(String(u).toLowerCase())] || null;
const num = (v) => { const n = Number(String(v).replace(/,/g, '')); return Number.isFinite(n) && n >= 10000 ? n.toLocaleString('en-US') : String(v); };
const withUnit = (v, u) => { const a = unitOf(u); return `${num(v)}${a === '%' || a === '°' ? a : a ? ` ${a}` : ''}`; };
// British and American spellings match: metre = meter, centre = center.
const spell = (t) => String(t).toLowerCase().replace(/tre(s?)\b/g, 'ter$1');
const short = (t, n = 4) => String(t || '').replace(/[?.!]+$/, '').split(/\s+/).slice(0, n).join(' ');
const words = (t) => String(t).toLowerCase().match(/[a-z]{3,}/g)?.filter((w) => !STOP.has(w)) || [];

// "between metres and centimetres", "X vs Y", "X or Y": the two sides.
function sides(text) {
  const m = text.match(/\bbetween\s+(?:a |an |the )?([\w' -]{2,30}?)\s+and\s+(?:a |an |the )?([\w' -]{2,30}?)(?:[?.,]|$|\s+(?:is|are|in|when))/i)
    || text.match(/\b([\w'-]{3,20})\s+(?:vs\.?|versus)\s+([\w'-]{3,20})/i);
  return m ? [m[1].trim(), m[2].trim()] : null;
}

// The simulations the board has ({ name: { keywords } }), set by the server.
let SIM_META = {};
export function setSimsMeta(meta) { SIM_META = meta || {}; }
export const simsMeta = () => SIM_META;

// A simulation whose keywords the question or topic names (two words count
// double), or null.
function simFor(text, need = 1) {
  let best = null;
  let bestScore = 0;
  for (const [name, m] of Object.entries(SIM_META)) {
    let score = 0;
    for (const k of m.keywords || []) if (new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(text)) score += k.includes(' ') ? 2 : 1;
    if (score > bestScore) { best = name; bestScore = score; }
  }
  return bestScore >= need ? { op: 'sim', name: best } : null;
}

export function autoViz(input, { topic = '', question = '' } = {}) {
  const sents = Array.isArray(input) ? input.flatMap(sentencesOf) : sentencesOf(input);
  if (!sents.length) return null;
  const text = sents.join(' ');
  const center = short(topic || question, 4) || condense(sents[0], 3);

  const raw = Array.isArray(input) ? input.join(' ') : String(input);
  const all = `${question} ${text}`;
  const lower = all.toLowerCase();

  // The solar system: the planets going round the Sun.
  if (/\bsolar system\b|\bplanets?\b.*\b(sun|orbit)|\borbit(s|ing)? the sun\b/i.test(`${question} ${topic} ${text}`)) {
    const PLANETS = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
    const named = PLANETS.filter((p) => new RegExp(`\\b${p}\\b`, 'i').test(all));
    return { op: 'orbits', center: 'Sun', items: named.length >= 3 ? named : PLANETS };
  }
  // Shapes named in a lesson about shapes: the shapes themselves.
  const shapes = shapesIn(`${topic} ${question} ${text}`);
  if (shapes.length && /shape|side|corner|vert(ex|ices)|face|edge|solid|polygon|quadrilateral|triangle|circle|square|rectangle|cube|sphere|cylinder|cone|pyramid|prism/i.test(`${topic} ${question} ${text}`)) {
    const inText = shapesIn(text);
    return { op: 'shape', items: (inText.length ? inText : shapes).slice(0, 6) };
  }
  // A place, or several: a map, with a route when the answer travels.
  const places = placesIn(`${question} ${topic} ${text}`).filter((p) => p.kind !== 'line');
  if (places.length >= 2 || (places.length === 1 && /\b(where|located|capital|map|border|continent|country|ocean|river|mountain|city)\b/i.test(all))) {
    const journey = places.length >= 2 && /\b(route|travel(l?ed)?|journey|sailed|voyage|trade|traded|from .+ to|marched|migrat|spread|expedition|silk road)\b/i.test(all);
    const stops = places.filter((p) => !['ocean', 'continent', 'sea', 'region', 'range', 'river'].includes(p.kind));
    return { op: 'map', items: places.slice(0, 7).map((p) => p.said || p.name), ...(journey && stops.length >= 2 ? { items2: [stops.slice(0, 6).map((p) => p.name).join(' > ')] } : {}), ...(topic ? { label: short(topic, 8) } : {}) };
  }
  // An equation in x: its graph.
  // The longest run of words after "y =" that still parses, with spoken
  // maths as symbols ("x squared plus 3" is x^2 + 3), and never cut just
  // before an operator ("y = x plus 3" is not y = x).
  const eq = all.match(/\by\s*=\s*([^,;!?]{1,60})/i);
  if (eq) {
    const SAID = { squared: '^2', cubed: '^3', plus: '+', minus: '-', times: '*', over: '/', 'divided': '/' };
    const words = eq[1].replace(/\.\s.*$|\.$/, '').trim().split(/\s+/).filter((w) => w.toLowerCase() !== 'by').map((w) => SAID[w.toLowerCase()] || w);
    for (let n = words.length; n > 0; n--) {
      if (/^[-+*/^]/.test(words[n] || '') || /^[-+*/]$/.test(words[n - 1])) continue;
      const e = words.slice(0, n).join(' ').replace(/ \^/g, '^');
      if (parseExpr(e)) return { op: 'graph', expr: `y = ${e}` };
    }
  }
  // An element named in an answer about atoms or electrons.
  if (/\b(atom|atoms|electron|electrons|shell|shells|proton|nucleus|element)\b/.test(lower)) {
    // A symbol that is also an English word ("He discovered...", "In", "As") counts only as its name.
    const el = Object.entries(ELEMENTS).find(([sym, [name]]) => new RegExp(`\\b${name}\\b`, 'i').test(all) || !WORDLIKE.has(sym) && new RegExp(`\\b${sym}\\b`).test(question));
    if (el) return { op: 'atom', value: el[1][0] };
  }
  // A fraction, an angle, a quotation, a circuit.
  const fr = all.match(/\b(\d{1,2})\s*\/\s*(\d{1,2})\b/);
  if (fr && +fr[2] > 1 && +fr[1] <= +fr[2] && /fraction|quarter|half|third|eighth|part|share|slice|pizza|cake/i.test(all)) return { op: 'fraction', value: `${fr[1]}/${fr[2]}` };
  // An angle: the example size, not the 90 or 180 it is compared with.
  const angs = [...all.matchAll(/\b(\d{1,3})\s*(?:°|degrees?)/gi)].map((m) => +m[1]).filter((d) => d <= 360);
  if (angs.length && /\bangle|acute|obtuse|reflex|right angle|turn\b/i.test(all)) return { op: 'angle', value: String(angs.find((d) => ![90, 180, 360].includes(d)) ?? angs[0]) };
  const said = raw.match(/(?:([A-Z][\w.']*(?:\s+[A-Z][\w.']*){0,3})\s+(?:said|wrote|declared|once said)[,:]?\s*)?[“"]([^”"]{12,200})[”"](?:\s*[,.]?\s*(?:said|wrote|declared)\s+([A-Z][\w.' ]{2,40}))?/);
  // A real quotation: whole words someone said (a name with it), not a phrase in quotation marks.
  if (said && (said[1] || said[3]) && said[2].trim().split(/\s+/).length >= 6 && /[.!?]$/.test(said[2].trim())) return { op: 'quote', value: said[2].trim(), label: (said[1] || said[3]).trim() };
  if (/\bcircuit/i.test(all)) {
    const parts = ['cell', 'battery', 'switch', 'bulb', 'lamp', 'resistor', 'ammeter', 'voltmeter', 'motor', 'buzzer'].filter((c) => new RegExp(`\\b${c}s?\\b`, 'i').test(all));
    if (parts.length >= 2) return { op: 'circuit', items: parts.slice(0, 6) };
  }

  // A concept the board can animate: projectile, Pythagoras, refraction...
  // The question or topic naming it is enough; a lesson sentence needs more.
  const sim = simFor(`${question} ${topic}`) || simFor(text, 2);
  if (sim) return sim;

  // Numbers with what they count.
  const nums = [];
  for (const s of sents) {
    for (const m of s.matchAll(NUM)) {
      if (/^(1[0-9]{3}|20[0-9]{2})$/.test(m[1]) && !m[2]) continue; // a year, not a quantity
      const before = s.slice(0, m.index).replace(/\b(is|are|was|were|about|around|roughly|nearly|almost|equals?|makes?|of|has|have)\s*$/i, '').trim();
      // "78% nitrogen": the name comes after a percentage when a word follows.
      const after = (m[2] === '%' || /percent/i.test(m[2] || '')) && s.slice(m.index + m[0].length).match(/^\s*(?:of\s+(?:the\s+)?)?((?:(?!and\b|or\b|with\b|is\b|are\b)[a-z][\w-]*\s*){1,3})/i);
      const name = (after && after[1].trim()) || condense(before.split(/,|;|\bis\b|\bare\b|\band\b|\bwith\b/).pop() || before, 4) || center;
      nums.push({ value: m[1], unit: (m[2] || '').toLowerCase(), name, s });
    }
  }
  if (SEQ.test(text) && sents.filter((s) => SEQ.test(s)).length >= 2) {
    return { op: 'flow', items: sents.slice(0, 5).map((s) => condense(s.replace(/^(first(ly)?|second(ly)?|then|next|after that|afterwards|finally|lastly)[,]?\s+/i, ''), 6)) };
  }
  const pair = sides(`${question} ${topic} ${text}`);
  if (pair && CONTRAST.test(`${question} ${text}`)) {
    const [l, r] = pair;
    // Each sentence goes to the side it names first (its subject).
    const where = (s, side) => { const m = spell(s).match(new RegExp(`\\b(${words(spell(side)).map((w) => w.replace(/s$/, '')).join('|')})s?\\b`)); return m ? m.index : Infinity; };
    const a = [];
    const b = [];
    for (const s of sents) {
      const li = where(s, l);
      const ri = where(s, r);
      if (li === Infinity && ri === Infinity) continue;
      (li <= ri ? a : b).push(condense(s, 6));
    }
    if (a.length && b.length) return { op: 'compare', left: short(l, 3), right: short(r, 3), a: a.slice(0, 3), b: b.slice(0, 3) };
  }
  const distinct = [...new Map(nums.map((n) => [`${n.value}${n.unit}`, n])).values()];
  // Percentages that make a whole: a pie.
  const pcts = distinct.filter((n) => unitOf(n.unit) === '%');
  const sum = pcts.reduce((a, n) => a + Number(n.value.replace(/,/g, '')), 0);
  if (pcts.length >= 2 && sum > 85 && sum <= 101 && new Set(pcts.map((n) => n.name)).size === pcts.length) {
    return { op: 'pie', items: pcts.slice(0, 7).map((n) => `${n.name}: ${n.value.replace(/,/g, '')}%`), ...(topic ? { label: short(topic, 3) } : {}) };
  }
  const sameUnit = distinct.length >= 2 && distinct.every((n) => n.unit === distinct[0].unit);
  if (sameUnit && distinct.length <= 6 && new Set(distinct.map((n) => n.name)).size === distinct.length) {
    return { op: 'bars', items: distinct.map((n) => `${n.name}: ${n.value.replace(/,/g, '')}${unitOf(n.unit) === '%' ? '%' : n.unit ? ` ${unitOf(n.unit)}` : ''}`), ...(topic ? { label: short(topic, 6) } : {}) };
  }
  // A conversion, "3000 metres is 300000 centimetres": from, times, to.
  if (distinct.length === 2 && distinct[0].unit && distinct[1].unit && unitOf(distinct[0].unit) !== unitOf(distinct[1].unit) && familyOf(distinct[0].unit) && familyOf(distinct[0].unit) === familyOf(distinct[1].unit)) {
    const [x, y] = distinct.map((n) => Number(n.value.replace(/,/g, '')));
    const k = x && y ? (y >= x ? y / x : x / y) : 0;
    if (k > 1 && Number.isInteger(+k.toFixed(6))) return { op: 'flow', items: [withUnit(distinct[0].value, distinct[0].unit), `${y >= x ? '×' : '÷'} ${num(+k.toFixed(6))}`, withUnit(distinct[1].value, distinct[1].unit)] };
  }
  if (distinct.length >= 1) {
    const n = distinct[distinct.length - 1];
    return { op: 'bignum', value: withUnit(n.value, n.unit).slice(0, 16), label: condense(n.s, 9) };
  }
  // A concept map: the topic in the middle, a key point from each sentence.
  const items = [...new Set(sents.slice(0, 5).map((s) => condense(s, 6)))].filter((x) => x.split(' ').length >= 2);
  if (items.length >= 2) return { op: 'parts', center, items };
  return { op: 'bignum', value: short(center, 2), label: condense(sents[0], 10) };
}

// The lesson diagram of a pack that best fits a text (shared words), or null.
const DIAGRAMS = new Set(['shape', 'sim', 'cell', 'phscale', 'periodic', 'image', 'flow', 'cycle', 'timeline', 'compare', 'parts', 'tree', 'venn', 'bars', 'pyramid', 'bullets', 'bignum', 'map', 'line', 'pie', 'table', 'numberline', 'graph', 'forces', 'wave', 'circuit', 'atom', 'fraction', 'angle', 'orbits', 'quote', 'count', 'balance']);
export function packDiagram(pack, text, min = 2) {
  if (!pack) return null;
  const want = new Set(words(text));
  let best = null;
  let bestScore = 0;
  for (const s of pack.explain || []) {
    const op = (s.draw || []).find((o) => DIAGRAMS.has(o.op));
    if (!op) continue;
    const have = words(`${s.say} ${JSON.stringify(op)}`);
    const score = new Set(have.filter((w) => want.has(w))).size;
    if (score > bestScore) { best = op; bestScore = score; }
  }
  if (!best || bestScore < min) return null;
  const { at, ...rest } = best; // its cue was a word of the lesson, not of this answer
  return rest;
}

// Lesson steps with a picture each: a step without one gets an automatic one.
// Bullet points give way to these when the words call for one.
const WEAK = new Set(['bullets', 'parts', 'bignum']);
const RICH = new Set(['map', 'graph', 'atom', 'pie', 'quote', 'angle', 'fraction', 'circuit', 'shape', 'orbits', 'sim']);
// A specific figure for a text (map, shape, graph...), or null when only a
// generic one (concept map, bullets) would fit.
export function richViz(text, opts) { const v = autoViz(text, opts); return v && RICH.has(v.op) ? v : null; }

export function withPictures(steps, topic, visual = null) {
  // A step with only words in boxes, and no figure of its own in its words,
  // shows the topic's picture again: for shapes, one shape drawn big.
  const again = (i) => (visual?.op === 'shape' ? { op: 'shape', items: [visual.items[Math.min(i, visual.items.length - 1)]] } : visual ? { ...visual } : null);
  return steps.map((s, i) => {
    // Text-like pictures (bullets, a concept map, a big word) give way to a
    // real figure when the step's words call for one: a square is drawn,
    // not written in a bubble.
    const weak = (s.draw || []).findIndex((o) => WEAK.has(o.op));
    if (weak >= 0 && !(s.draw || []).some((o, i) => i !== weak && DIAGRAMS.has(o.op))) {
      const rich = autoViz(s.say, { topic });
      const pick = rich && RICH.has(rich.op) ? rich : i > 0 && s.draw[weak].op === 'parts' ? again(i) : null;
      if (pick) return { ...s, draw: s.draw.map((o, j) => (j === weak ? pick : o)) };
    }
    if ((s.draw || []).some((o) => DIAGRAMS.has(o.op) || ['rect', 'tri', 'circle', 'vecgrid', 'vec', 'colvec', 'grid', 'trace', 'options', 'question'].includes(o.op))) return s;
    const screen = (s.draw || []).find((o) => ['text', 'formula'].includes(o.op) && o.text)?.text;
    const pic = autoViz(s.say, { topic: screen && screen.split(/\s+/).length <= 5 ? screen : topic });
    if (!pic) return s;
    const draw = [...(s.draw || [])];
    const after = draw.findIndex((o) => o.op === 'title');
    draw.splice(after + 1, 0, pic);
    return { ...s, draw };
  });
}
