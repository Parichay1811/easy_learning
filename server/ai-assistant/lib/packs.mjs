// Lesson packs: one JSON file per topic in packs/<DOMAIN>/<ID>.json (any
// depth). Each is checked by lib/schema.mjs when it loads; a broken pack is
// reported and skipped, so one bad file never takes the teacher down.
import fs from 'node:fs';
import path from 'node:path';
import { packProblems } from './schema.mjs';

const STOP = new Set(('a an the is are am do does did i you we it its it\'s of to in on for and or with what whats how why when '
  + 'can could should would will my me your this that there be by as at from so if then than which who about please tell explain').split(' '));

// Lowercase content words, plurals folded ("circles" -> "circle").
export function tokens(text) {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
    .filter((w) => w && !STOP.has(w))
    .map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w));
}

function* jsonFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* jsonFiles(p);
    else if (e.name.endsWith('.json')) yield p;
  }
}

// { packs: Map(id -> pack), skipped: [{ file, problems }] } when report is
// asked for; the Map alone otherwise. drafts: false leaves out generated,
// unreviewed packs.
export function loadPacks(dir, { drafts = true, report = false, log = null } = {}) {
  const packs = new Map();
  const skipped = [];
  for (const file of jsonFiles(dir)) {
    let pack;
    try { pack = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { skipped.push({ file, problems: [`not JSON: ${e.message}`] }); continue; }
    const problems = packProblems(pack);
    if (problems.length) { skipped.push({ file, problems }); continue; }
    if (packs.has(pack.id)) { skipped.push({ file, problems: [`duplicate id ${pack.id}`] }); continue; }
    pack.status ||= 'reviewed';
    if (!drafts && pack.status !== 'reviewed') continue;
    pack.figure ||= [];
    pack.keySet = new Set(pack.keywords.flatMap(tokens));
    // A common question is [question, answer] or { q, a, asks: [other ways to ask it] }.
    pack.faq = pack.faq.map((f) => (Array.isArray(f) ? { q: f[0], a: f[1], asks: [] } : { asks: [], ...f }));
    pack.faqIndex = pack.faq.map(({ q, a }) => ({ q, a, tokens: new Set(tokens(q)) }));
    packs.set(pack.id, pack);
  }
  if (log) for (const s of skipped) log(`pack skipped: ${path.relative(dir, s.file)}: ${s.problems.slice(0, 3).join('; ')}`);
  return report ? { packs, skipped } : packs;
}

// Words that ask for something rather than name it ("now explain me ...").
const ASKING = new Set('teach show learn lesson lessons help understand know give now today again more simple simply quick quickly little bit please me us something thing things everything topic topics talk tell explain describe like want need idea basic basics'.split(' '));

// The pack whose keywords the text mentions most, or null. It must cover
// every word that names the topic: "solar system" is not the pack about
// solving systems of equations just because both say "system".
export function findTopic(text, packs) {
  const words = [...new Set(tokens(text).filter((w) => !ASKING.has(w) && !/^\d+$/.test(w)))];
  if (!words.length) return null;
  let best = null;
  let bestHits = 0;
  let bestScore = 0;
  for (const pack of packs.values()) {
    const have = pack.titleSet ||= new Set([...pack.keySet, ...tokens(pack.title)]);
    const title = pack.titleWords ||= new Set(tokens(pack.title));
    let hits = 0;
    let inTitle = 0;
    for (const w of words) { if (have.has(w)) hits++; if (title.has(w)) inTitle++; }
    // Ties go to the pack whose title names it, then to reviewed packs.
    const score = hits * 100 + inTitle * 10 + (pack.status === 'reviewed' ? 5 : 0) - title.size * 0.1;
    if (hits && score > bestScore) { best = pack; bestHits = hits; bestScore = score; }
  }
  return bestHits === words.length || (bestHits >= 3 && bestHits / words.length >= 0.75) ? best : null;
}

// The closest common question: cosine of content words, with at least two
// words in common so "area" alone does not match every area question.
export function bestFaq(text, packs) {
  const words = new Set(tokens(text));
  let best = { score: 0 };
  for (const pack of packs.values()) {
    for (const item of pack.faqIndex) {
      let common = 0;
      for (const w of words) if (item.tokens.has(w)) common++;
      if (common < Math.min(2, item.tokens.size)) continue;
      const score = common / Math.sqrt(words.size * item.tokens.size);
      if (score > best.score) best = { score, pack, item };
    }
  }
  return best;
}
