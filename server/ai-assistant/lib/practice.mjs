// A practice question, only when the learner asks for one ("quiz me on
// circles", "give me a question on vectors", "another one"). It is one calm
// "your turn" question with an explanation of the answer: there is no test,
// no count of questions and no score in the AI Teacher.
import { rng } from '../shared/solvers.js';
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

const ASKING = /\b(test(s|ing)?|quiz(z?es)?|exams?|practi[cs]e|questions?|qs|ask|another|more|try|give|me|us|on|in|about|for|of|a|an|the|some|please|can|could|you|i|want|would|like|take|do|my|level|at|and|\d+|one|two|three|four|five|six|seven|eight|nine|ten|twenty)\b/g;

// { ids, title } of the packs a practice question can come from, or null when
// the learner named nothing and no lesson is on the board.
export function practiceScope(t, context, packs) {
  const level = LEVELS.find(([re]) => re.test(t))?.[1];
  const subject = SUBJECTS.find(([re]) => re.test(t));
  // The words that name the topic: "give me a question" names nothing, and
  // "test" must not pick the pack about the second derivative test.
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
  return null;
}

// The pack a practice question comes from: the one named, else one of the
// subject's packs (seeded, so the same request is repeatable in tests).
export function pickPack(scope, packs, seed = Date.now()) {
  const ids = scope.ids.filter((id) => packs.get(id)?.quiz?.length);
  if (!ids.length) return null;
  return packs.get(ids[Math.floor(rng(seed)() * ids.length)]);
}

// Asked for a question but named no topic, with nothing on the board.
export function whichTopicPlan() {
  return {
    kind: 'talk', title: 'Your turn',
    steps: [{ say: 'Sure. Tell me a topic, and I will ask you one question about it.', draw: [{ op: 'clear' }, { op: 'title', text: 'Your turn' }, { op: 'text', text: 'Which topic?', color: 'ink' }] }],
  }
}
