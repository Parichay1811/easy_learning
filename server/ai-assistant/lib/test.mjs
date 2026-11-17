// Building a test from what the student asked for: "quiz me on circles",
// "test me for GCSE maths", "give me 5 questions on vectors". The teacher
// confirms how many questions unless the student already said, then the
// questions are drawn from every pack in scope, one topic after another, with
// fresh numbers from the maths templates where a topic has one.
import { TEMPLATES, rng } from '../shared/solvers.js';
import { findTopic } from './packs.mjs';

// Subject words -> topic id prefixes.
const SUBJECTS = [
  // Longer names first: "computer science" is not science, "art history" not history.
  [/\b(computer science|computing|coding|programming|python|javascript)\b/, ['CS', 'DIG', 'CODE']], [/\bart history\b/, ['APAH', 'ARTH']],
  [/\b(maths?|mathematics|algebra|geometry|arithmetic)\b/, ['MATH', 'MATHX']], [/\bphysics\b/, ['PHYS', 'PHYSX']], [/\bchemistry\b/, ['CHEM', 'CHEMX']],
  [/\bbiology\b/, ['BIO', 'BODY', 'NATUR']], [/\b(human body|body|organs)\b/, ['BODY']], [/\b(nature|wildlife|ecosystems?)\b/, ['NATUR']],
  [/\b(earth science|rocks|volcanoes|weather|oceans?)\b/, ['TERRA', 'EARTH']], [/\b(engineering|how things work|machines)\b/, ['ENGR', 'DIY']],
  [/\b(statistics|data|charts|graphs)\b/, ['DATA']], [/\b(famous people|biograph(y|ies)|famous lives)\b/, ['BIOG']], [/\b(words|linguistics|idioms|etymology)\b/, ['LING']], [/\b(space|astronomy|planets?|stars)\b/, ['SPACE']],
  [/\bscience\b/, ['PHYS', 'CHEM', 'BIO', 'EARTH', 'ENV', 'WHY', 'SPACE', 'PHYSX', 'CHEMX', 'BODY', 'TERRA', 'NATUR']], [/\b(english|grammar|reading|writing)\b/, ['ENG']],
  [/\b(literature|myths?|stories|poetry|shakespeare)\b/, ['ENG', 'LITW']],
  [/\bhistory\b/, ['HIST', 'HISTW']], [/\bgeography\b/, ['GEOG', 'EARTH', 'GEOW', 'APHG']], [/\b(civics|citizenship|government)\b/, ['CIV', 'CIVL']],
  [/\beconomics\b/, ['ECON', 'ECONL']], [/\b(money|finance|budget(ing)?|saving)\b/, ['LIFE-MONEY']],
  [/\b(business|marketing|startups?)\b/, ['BUS', 'BUSI']], [/\baccounting\b/, ['ACCT']],
  [/\b(technology|tech|ai|artificial intelligence|internet|computers?)\b/, ['TECH', 'DIG']],
  [/\bpsychology\b/, ['PSY', 'MIND']], [/\b(mind|brain|memory|habits)\b/, ['MIND']], [/\bphilosophy\b/, ['PHIL', 'PHILO']],
  [/\b(sociology|law|rights)\b/, ['SOC', 'LAW', 'LAWL']], [/\b(health|pe)\b/, ['HLTH', 'PE']], [/\b(sports?|chess|football|cricket|basketball)\b/, ['SPORT', 'PE']],
  [/\bmusic\b/, ['MUS', 'MUSIC']], [/\b(art|painting|drawing|art history)\b/, ['ART', 'ARTH', 'APAH']], [/\b(film|movies?|media)\b/, ['FILM', 'MEDIA']],
  [/\b(drama|design)\b/, ['DRAMA', 'DT']], [/\b(cooking|food|baking)\b/, ['COOK']], [/\b(environment|climate|ecology)\b/, ['GREEN', 'ENV']],
  [/\b(architecture|buildings|bridges)\b/, ['ARCH']], [/\b(careers?|jobs?|interviews?)\b/, ['JOBS']], [/\b(diy|fixing|gardening|machines)\b/, ['DIY']],
  [/\b(skills|public speaking|debating|critical thinking)\b/, ['SKILL']], [/\b(animals|dinosaurs|kids|children)\b/, ['KIDS-ANIM', 'KIDS-WORLD', 'KIDS-WHY', 'KIDS-FUN']], [/\b(puzzles|games|rubik|sudoku)\b/, ['GAME']],
  [/\bspanish\b/, ['LANG-SPAN']], [/\bfrench\b/, ['LANG-FREN']], [/\bgerman\b/, ['LANG-GERM']], [/\b(mandarin|chinese)\b/, ['LANG-MAND']],
  [/\bhindi\b/, ['LANG-HIND']], [/\bjapanese\b/, ['LANG-JAPN']], [/\barabic\b/, ['LANG-ARAB']], [/\bsign language\b/, ['LANG-SIGN']],
  [/\bkorean\b/, ['LANG-KORE']], [/\bitalian\b/, ['LANG-ITAL']], [/\bportuguese\b/, ['LANG-PORT']], [/\bswahili\b/, ['LANG-SWAH']],
  [/\blanguages?\b/, ['LANG']], [/\b(study skills|revision|exam technique)\b/, ['STUDY']],
];
// Exam and year words -> the brief's level codes.
const LEVELS = [
  [/\b(gcse|igcse|o level|grade (9|10)|class (9|10)|year (10|11)|myp)\b/, 'M'], [/\b(a level|a-level|ib|ap|grade (11|12)|class (11|12)|year (12|13)|hsc|vce)\b/, 'U'],
  [/\b(ks3|key stage 3|grade [678]|class [678]|year [789])\b/, 'L'], [/\b(primary|grade [345]|class [345]|year [3456])\b/, 'P2'],
  [/\b(sat|act|jee|neet|entrance)\b/, 'E'], [/\b(university|college)\b/, 'H'],
];

const ASKING = /\b(test(s|ing)?|quiz(z?es)?|exams?|practi[cs]e|questions?|qs|give|me|us|on|in|about|for|of|a|an|the|some|please|can|could|you|i|want|would|like|take|do|my|level|at|and|\d+|one|two|three|four|five|six|seven|eight|nine|ten|twenty)\b/g;

// { ids, title } of the packs a test covers.
export function testScope(t, context, packs) {
  const level = LEVELS.find(([re]) => re.test(t))?.[1];
  const subject = SUBJECTS.find(([re]) => re.test(t));
  // The words that name what to test: "test me on 5 questions" names nothing,
  // and "test" must not pick the pack about the second derivative test.
  let rest = t.replace(ASKING, ' ');
  for (const [re] of LEVELS) rest = rest.replace(re, ' ');
  if (subject) rest = rest.replace(subject[0], ' ');
  const topic = rest.trim() ? findTopic(rest, packs) : null;
  if (topic) return { ids: [topic.id], title: topic.title.toLowerCase() };
  if (subject) {
    const prefixes = subject[1];
    let ids = [...packs.keys()].filter((id) => prefixes.some((p) => id.startsWith(`${p}-`)));
    if (level) {
      const atLevel = ids.filter((id) => !packs.get(id).levels || packs.get(id).levels.includes(level));
      if (atLevel.length) ids = atLevel;
    }
    const name = t.match(subject[0])[0];
    if (ids.length) return { ids, title: `${name}${level ? ` at ${t.match(LEVELS.find(([re]) => re.test(t))[0])[0].toUpperCase()} level` : ''}` };
  }
  if (context.topic && packs.has(context.topic)) return { ids: [context.topic], title: packs.get(context.topic).title.toLowerCase() };
  return { ids: [...packs.keys()], title: 'everything we have covered' };
}

// "5 questions", "ten", "give me 3": a number of questions, or null.
// any: a bare number counts (the answer to "how many?").
export function countFrom(t, any = false) {
  const m = any ? t.match(/\b(\d{1,2})\b/) : t.match(/\b(\d{1,2})\s*(questions?|qs|question test)\b/);
  const n = m ? Number(m[1]) : null;
  return n && n >= 1 && n <= 30 ? n : null;
}

export function askCountPlan(scope) {
  return {
    kind: 'talk', title: 'A test',
    context: { offer: 'test-count', scope },
    steps: [{
      say: `Sure! How many questions on ${scope.title} would you like: 5, 10 or 20?`,
      draw: [{ op: 'clear' }, { op: 'title', text: 'A test' }, { op: 'text', text: `On ${scope.title}`, color: 'ink' },
        { op: 'chips', items: ['5 questions', '10 questions', '20 questions'], at: 'many' }],
    }],
  };
}

export function buildTest(scope, n, packs, seed = Date.now()) {
  const r = rng(seed);
  const pools = scope.ids.map((id) => packs.get(id)).filter(Boolean).map((p) => {
    const own = p.quiz.map((q) => ({ ...q, topic: p.id, topicTitle: p.title }));
    const fresh = p.template && TEMPLATES[p.template] ? [1, 2, 3, 4, 5, 6, 7, 8].map((k) => ({ ...TEMPLATES[p.template].quiz(rng(seed + k * 7919 + p.id.length)), topic: p.id, topicTitle: p.title })) : [];
    const seen = new Set();
    const pool = [...own, ...fresh].filter((q) => !seen.has(q.say) && seen.add(q.say)).slice(0, own.length + 4);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    return pool;
  }).filter((p) => p.length);
  for (let i = pools.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pools[i], pools[j]] = [pools[j], pools[i]]; }
  const questions = [];
  for (let round = 0; questions.length < n && pools.some((p) => p.length > round); round++) {
    for (const pool of pools) if (pool[round] && questions.length < n) questions.push(pool[round]);
  }
  const k = questions.length;
  return {
    kind: 'test', title: `Test: ${scope.title}`, test: { questions, title: scope.title },
    context: { offer: null, scope },
    steps: [{
      say: `${k < n ? `I have ${k} questions on ${scope.title}. ` : ''}Here's your test: ${k} question${k === 1 ? '' : 's'} on ${scope.title}. Answer with A, B, C or D, or tap an option. Let's go!`,
      draw: [{ op: 'clear' }, { op: 'title', text: 'Your test' }, { op: 'box', text: `${k} question${k === 1 ? '' : 's'}`, at: 'test' }, { op: 'text', text: scope.title, color: 'ink' }],
    }],
  };
}
