// The children's check of a lesson pack (content v5, docs/learning/TEACHING-STANDARDS.md), on
// top of the format check in schema.mjs. Packs for young learners (levels EY or P1) follow the
// same rules as the question bank: short literal sentences, three choices, numerals not number
// words, no negation, nothing that gives the answer away, and feedback that explains.
//
//   lintPack(pack) -> [{ rule, where, text }]   empty = fine
// Rules apply to young learners' packs; older learners' packs get the -warning variants only.
//   giveaway    the question (said or shown) contains the right option's words
//               (giveaway-warning, older packs: a whole answer of 2+ words said word for word)
//   feedback    boilerplate wrong-answer feedback ("This is tempting because…"); a warning
//               (feedback-warning) on older learners' packs
//   options     more than three choices
//   numerals    a number word as a choice where a numeral is clearer ("Three" -> "3")
//   length      a quiz question over 20 spoken words, a shown question over 10 words,
//               or a lesson sentence over 14 words
//   figurative  game or story framing, idioms ("detective", "magic", "catch it")
//   negation    "not", "never", "n't" in a quiz question
export const YOUNG = new Set(['EY', 'P1']);
const NUMBER_WORDS = new Set(['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']);
const FIGURATIVE = /\b(detective|adventure|mission|quest|treasure|magic(al)?|sneaky|secret|spy|superhero|ninja|wizard|mystery|brain[- ]?(teaser|power)|catch (it|them)|super ?star|piece of cake|give it a (go|whirl))\b/i;
const BOILERPLATE = /\b(this is tempting because|you might be thinking of something else|tempting because you)\b/i;
const words = (s) => String(s || '').trim().split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
const norm = (s) => ` ${String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
const sentences = (s) => String(s || '').split(/(?<=[.?!])\s+/).filter(Boolean);

export const isYoung = (p) => (p.levels || []).some((l) => YOUNG.has(l));

export function lintPack(p) {
  const out = [];
  const add = (rule, where, text) => out.push({ rule, where, text: String(text || '').slice(0, 90) });
  const young = isYoung(p);
  for (const [i, q] of (p.quiz || []).entries()) {
    const right = q.options?.[q.answer];
    if (right) {
      const a = norm(right.say || right.show).trim();
      // A card that lists the choices ("14, 21, 36") is not a give-away.
      const listsChoices = (q.options || []).filter((o) => norm(q.show).includes(norm(o.show).trim() ? ` ${norm(o.show).trim()} ` : '\0')).length >= 2;
      const plain = a.length >= 2 && !/^(yes|no|true|false)$/.test(a);
      // Young learners: the answer's words anywhere in the question. Older learners: a whole
      // answer of two words or more said word for word (topic words in both are normal there).
      if (young && plain && (norm(q.say).includes(` ${a} `) || (!listsChoices && norm(q.show).includes(` ${a} `)))) add('giveaway', `quiz ${i}`, q.say);
      // Older learners' questions often name the things being compared: a warning to read.
      else if (!young && a.split(' ').length >= 2 && norm(q.say).includes(` ${a} `)) add('giveaway-warning', `quiz ${i}`, q.say);
    }
    for (const [k, w] of Object.entries(q.wrong || {})) if (BOILERPLATE.test(w)) add(young ? 'feedback' : 'feedback-warning', `quiz ${i} wrong ${k}`, w);
    if (!young) continue;
    if ((q.options || []).length > 3) add('options', `quiz ${i}`, `${q.options.length} choices`);
    if ((q.options || []).some((o) => NUMBER_WORDS.has(String(o.show || '').trim().toLowerCase()))) add('numerals', `quiz ${i}`, q.options.map((o) => o.show).join(', '));
    if (words(q.say).length > 20) add('length', `quiz ${i} say`, q.say);
    if (words(q.show).length > 10) add('length', `quiz ${i} show`, q.show);
    if (FIGURATIVE.test(`${q.say} ${q.show}`)) add('figurative', `quiz ${i}`, q.say);
    if (/\b(not|never)\b|n't\b/i.test(q.say)) add('negation', `quiz ${i}`, q.say);
  }
  if (young) {
    for (const [i, s] of (p.explain || []).entries()) {
      const long = sentences(s.say).find((x) => words(x).length > 14);
      if (long) add('length', `explain ${i}`, long);
      if (FIGURATIVE.test(s.say)) add('figurative', `explain ${i}`, s.say);
    }
  }
  return out;
}

// node lib/pack-lint.mjs [--young] [AREA ...]   lists findings (format + children's rules); exit 1 on any
// finding that is not a warning in the packs checked.
if (process.argv[1] && import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href) {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { packProblems } = await import('./schema.mjs');
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../packs');
  const args = process.argv.slice(2);
  const onlyYoung = args.includes('--young');
  const areas = args.filter((a) => !a.startsWith('--'));
  let blocking = 0;
  const counts = {};
  for (const area of fs.readdirSync(root).filter((a) => !areas.length || areas.includes(a))) {
    const dir = path.join(root, area);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
      const p = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      if (onlyYoung && !isYoung(p)) continue;
      const found = [...packProblems(p).map((t) => ({ rule: 'format', where: '', text: t })), ...lintPack(p)];
      for (const x of found) {
        counts[x.rule] = (counts[x.rule] || 0) + 1;
        if (!x.rule.endsWith('-warning')) { blocking++; console.log(`${p.id} ${x.rule} ${x.where}: ${x.text}`); }
      }
    }
  }
  console.log(`findings: ${JSON.stringify(counts)}; to fix: ${blocking}`);
  process.exitCode = blocking ? 1 : 0;
}
