// The one check of a lesson pack, used by the factory before it saves a pack,
// by the server when it loads packs (a bad pack is skipped, never fatal) and
// by the tests. Returns a list of problems; empty means the pack is usable.
// The format is described in packs/SCHEMA.md.
const STATUS = new Set(['reviewed', 'draft']);
const OPS = new Set(['clear', 'title', 'text', 'formula', 'note', 'box', 'card', 'question', 'options', 'chips', 'rect', 'tri', 'circle', 'vecgrid', 'vec', 'colvec', 'grid', 'trace', 'mark', 'flow', 'cycle', 'timeline', 'compare', 'bullets', 'bignum', 'parts', 'tree', 'venn', 'bars', 'pyramid', 'map', 'line', 'pie', 'table', 'numberline', 'graph', 'forces', 'wave', 'circuit', 'atom', 'fraction', 'angle', 'orbits', 'quote', 'count', 'balance', 'shape', 'sim', 'cell', 'phscale', 'periodic', 'image']);
const MARKUP = /[*#`_]{2}|^\s*[-*•]\s|\p{Extended_Pictographic}/u;

const str = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

export function packProblems(p) {
  const out = [];
  const need = (ok, msg) => { if (!ok) out.push(msg); };
  need(p && typeof p === 'object', 'not an object');
  if (!p || typeof p !== 'object') return out;
  need(/^[A-Z]{2,5}(-[A-Z0-9]{1,6})*-\d{2}$/.test(p.id || ''), `bad id ${p.id}`);
  need(str(p.title, 120), 'title missing or too long');
  need(!p.status || STATUS.has(p.status), `bad status ${p.status}`);
  need(Array.isArray(p.keywords) && p.keywords.length >= 1 && p.keywords.every((k) => str(k, 60)), 'keywords: 1 or more short words');
  need(Array.isArray(p.examples) && p.examples.every((e) => str(e, 160)), 'examples: short strings');
  need(Array.isArray(p.figure || []), 'figure: a list of draw ops');

  need(Array.isArray(p.explain) && p.explain.length >= 2 && p.explain.length <= 8, 'explain: 2 to 8 steps');
  for (const [i, s] of (p.explain || []).entries()) {
    need(str(s?.say, 400), `explain ${i}: say missing or over 400 characters`);
    need(!MARKUP.test(s?.say || ''), `explain ${i}: markdown or emoji in say`);
    need(Array.isArray(s?.draw) && s.draw.every((o) => OPS.has(o?.op)), `explain ${i}: unknown draw op`);
    const words = new Set((s?.say || '').toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z0-9']/g, '')));
    for (const o of Array.isArray(s?.draw) ? s.draw : []) for (const [k, v] of Object.entries(o || {})) {
      if ((k === 'at' || k.endsWith('At')) && typeof v === 'string') need(words.has(v.toLowerCase()), `explain ${i}: cue "${v}" is not a spoken word`);
    }
  }

  need(Array.isArray(p.faq) && p.faq.length >= 1, 'faq: at least one common question');
  for (const [i, f] of (p.faq || []).entries()) {
    const q = Array.isArray(f) ? f[0] : f?.q;
    const a = Array.isArray(f) ? f[1] : f?.a;
    need(str(q, 200), `faq ${i}: question missing or too long`);
    need(str(a, 450) && !MARKUP.test(a), `faq ${i}: answer missing, too long or with markdown`);
    if (!Array.isArray(f)) need(f?.asks === undefined || (Array.isArray(f.asks) && f.asks.every((x) => str(x, 200))), `faq ${i}: asks must be short strings`);
  }
  need(!p.facts || (Array.isArray(p.facts) && p.facts.every((x) => str(x, 300))), 'facts: short strings');

  need(Array.isArray(p.quiz) && p.quiz.length >= 1, 'quiz: at least one question');
  for (const [i, q] of (p.quiz || []).entries()) {
    need(str(q?.say, 400) && str(q?.show, 220), `quiz ${i}: say and show needed`);
    const opts = Array.isArray(q?.options) ? q.options : [];
    need(opts.length >= 3 && opts.length <= 4, `quiz ${i}: 3 or 4 options`);
    need(opts.every((o) => str(o?.show, 80) && str(o?.say, 160)), `quiz ${i}: every option needs show and say`);
    need(new Set(opts.map((o) => o?.show?.trim().toLowerCase())).size === opts.length, `quiz ${i}: options repeat`);
    need(Number.isInteger(q?.answer) && q.answer >= 0 && q.answer < opts.length, `quiz ${i}: answer out of range`);
    need(str(q?.why, 450), `quiz ${i}: why missing`);
    need(q?.wrong && typeof q.wrong === 'object' && !Object.hasOwn(q.wrong, String(q.answer)), `quiz ${i}: wrong must explain only wrong options`);
  }
  return out;
}
