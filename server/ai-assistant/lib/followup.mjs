// Follow-up questions, as people really ask them: "When was he born?",
// "tell me more", "why?", "show me a picture", "explain it simpler". The
// conversation's subject (context.subject: what the last answer was about)
// and the last question (context.history) fill in what was left out, so the
// rest of the router sees a whole question: "When was Albert Einstein born?".

const MORE = /^(tell me more|more|go on|continue|carry on|keep going|and then|what else|anything else|tell me (something )?else|more please|more about (it|that|this|them|him|her)|tell me more about (it|that|this|them|him|her)|keep talking|what more)\b/;
const SIMPLER = /^(explain it simpler|simpler|in simple(r)? words|explain (it|that|this) (again|simply|more simply|in simple words|simpler)|i (do ?n.?t|dont) (get|understand) (it|that|this)|that.?s (too )?(hard|confusing)|what does that mean|can you (say|explain) (it|that) (simpler|more simply|again))\b/;
const EXAMPLE = /^(give me an example|give an example|for example|an example|example please|show me an example|like what|such as)\b/;
const PICTURE = /^(show me( a| the)? (picture|photo|image|pic)s?( of (it|that|this|them|him|her))?|show me (it|that|this|them|him|her)|what (does|do|did) (it|he|she|that|this|they) look like|can i see (it|that|them|a picture|a photo))$/;
const BARE = /^(why|when|where|who|how|how come|how much|how many|how big|how old|how long|how far|what for)$/;
// Everyday sentences with "it" that are not about the subject.
const IDIOM = /\b(what time is it|is it (raining|sunny|cold|hot|snowing) (in|at)|how is it going|that.?s it|is (that|it) (right|correct|true|wrong)|i (do ?n.?t|dont) get it|get it|i like it|forget it|never mind)\b/;
const STOP = new Set('a an the is are was were be been do does did can could will would should what why how who when where which whose whom of in on at to for from with about by as and or but it its they them their he him his she her this that these those there here me my i you your we our please tell show explain say know much many big old long far really very so just also'.split(' '));

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// The phrase the conversation is about, from an answer's plan.
export function subjectOf(plan) {
  const raw = String(plan.watch || '').trim() || (plan.kind === 'chat' || plan.kind === 'explain' ? String(plan.title || '') : '');
  const s = raw.replace(/^(watch|let's watch):\s*/i, '').replace(/[?!.]+$/, '').trim();
  if (!s || s.split(/\s+/).length > 12 || /^(good question|not in my notes|which |do you mean)/i.test(s)) return null;
  return s;
}

// Returns { text, kind } where kind is 'more' | 'simpler' | 'example' |
// 'picture' | 'bare' | 'pronoun' | null (nothing to fill in).
export function followUp(text, context = {}) {
  const subject = context.subject;
  const t = String(text).trim();
  const low = t.toLowerCase().replace(/[?!.,]+$/g, '').replace(/^(okay|ok|so|and|but|hmm|um|uh|teacher|please)[\s,]+/, '').trim();
  if (!subject || context.awaiting || !low) return { text: t, kind: null };
  if (MORE.test(low)) return { text: `Tell me more about ${subject}`, kind: 'more' };
  if (SIMPLER.test(low)) return { text: `Explain ${subject} in simple words`, kind: 'simpler' };
  if (EXAMPLE.test(low)) return { text: `Give me an everyday example of ${subject}`, kind: 'example' };
  if (PICTURE.test(low)) return { text: `Show me a picture of ${subject}`, kind: 'picture' };
  // "When?" after "Who invented the telephone?": the last question, asked with "when".
  const last = [...(context.history || [])].reverse().find((h) => h?.q)?.q;
  if (BARE.test(low)) {
    const rest = String(last || '').replace(/[?!.]+$/, '').replace(/^(what|who|when|where|why|which|how( (much|many|big|old|long|far|come))?)\s+(is|are|was|were|did|does|do)?\s*/i, '').trim();
    const verb = rest.match(/^(invented|discovered|wrote|painted|built|founded|made|created|designed|composed) (.+)$/i);
    if (verb) return { text: `${cap(low)} was ${verb[2]} ${verb[1]}?`, kind: 'bare' };
    if (rest && rest.split(/\s+/).length <= 8) return { text: `${cap(low)} ${/^(is|are|was|were)\b/i.test(rest) ? '' : 'is '}${rest}?`.replace(/\s+/g, ' '), kind: 'bare' };
    return { text: `${cap(low)} ${subject}?`, kind: 'bare' };
  }
  // "When was he born?", "why do they erupt?", "who climbed it first?".
  if (IDIOM.test(low)) return { text: t, kind: null };
  const words = low.split(/\s+/);
  // "there" is a place ("how many people live there?"), but not in "is there…".
  const pron = words.findIndex((w, i) => /^(it|its|it's|they|them|their|he|him|his|she|her|this|that|these|those)$/.test(w) || (w === 'there' && i > 0 && !/^(is|are|was|were)$/.test(words[i - 1])));
  if (pron < 0) return { text: t, kind: null };
  // Only when nothing else in the question names a thing of its own.
  const content = words.filter((w, i) => i !== pron && !STOP.has(w) && w.length > 2);
  // "the capital of France and its population": "its" is France, named right there.
  const named = t.split(/\s+/).some((w, i) => i > 0 && i !== pron && /^[A-Z][a-z]/.test(w));
  if (content.length >= 3 || named) return { text: t, kind: null };
  const w = words[pron];
  const possessive = /^(its|their|his)$/.test(w) || (w === 'her' && pron < words.length - 1 && !STOP.has(words[pron + 1]));
  const out = t.split(/\s+/);
  out[pron] = w === 'there' ? `in ${subject}` : possessive ? `${subject}'s` : subject;
  return { text: out.join(' '), kind: 'pronoun' };
}

// What to ask next, as buttons under the board: by what the answer is about.
const PERSON = /\b(was born|is born|he was|she was|he is|she is|his |her |first woman|first man|won the nobel|physicist|scientist|writer|author|poet|painter|artist|composer|musician|singer|actor|king|queen|emperor|president|prime minister|philosopher|inventor|explorer|mathematician|chemist|biologist|astronaut|leader|activist|footballer|player)\b/i;
const PLACE = /\b(is a (country|city|town|capital|mountain|river|lake|island|state|region|continent|ocean|sea|desert|village)|is located in|located in|capital of)\b/i;
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function nextQuestions(plan, subject, asked = '') {
  if (!subject) return [];
  const words = (plan.steps || []).map((x) => x.say).join(' ');
  const said = `${words} ${plan.about || ''}`;
  // "a volcano", "the telephone": a thing, said in lower case, not a name.
  const thing = /^[A-Z][a-z]+( [a-z]+)+$/.test(subject) || !/\s/.test(subject) && new RegExp(`\\b(a|an|the)\\s+${escapeRe(subject.toLowerCase())}\\b|\\b${escapeRe(subject.toLowerCase())}(s|es)\\b`).test(`${words} ${plan.about || ''}`.toLowerCase());
  const s = thing ? subject.toLowerCase().replace(/^the /, '') : subject;
  // "population of France": a picture of France.
  const pic = / of /.test(s) ? s.split(' of ').pop() : thing ? `${/^[aeiou]/.test(s) ? 'an' : 'a'} ${s}` : s;
  const place = PLACE.test(said) || /\b(country|city|capital|mountain|river|lake|island|state|town|village|ocean|sea|desert|landmark|tower|building)\b/i.test(plan.about || '');
  // "The Bhagavad Gita", "The Ramayana": a title, not a person, whatever its story says.
  const person = !thing && !/^the\s/i.test(s) && PERSON.test(plan.about || said) && /^[A-Z]/.test(s);
  const options = person
    ? [`When was ${s} born?`, `What is ${s} famous for?`, `Show me a picture of ${s}`, 'Tell me more']
    : !thing && place
      ? [`Where is ${s}?`, `Show me a picture of ${s}`, `How big is ${s}?`, 'Tell me more']
      : plan.kind === 'explain' || plan.kind === 'faq'
        ? ['Tell me more', 'Give me an example', `Why is ${thing || !/^[A-Z][a-z]+ [A-Z]/.test(s) ? s.toLowerCase() : s} important?`, 'Test me on this']
        : ['Tell me more', `Show me a picture of ${pic}`, 'Give me an example', 'Explain it simpler'];
  // A long lesson title ("How clock gears turn the hour and minute hands") reads badly inside a question.
  if (s.split(/\s+/).length > 5) return ['Tell me more', 'Give me an example', 'Explain it simpler', plan.kind === 'explain' || plan.kind === 'faq' ? 'Test me on this' : `Show me a picture of ${pic}`].filter((o) => !asked.toLowerCase().includes(o.toLowerCase()));
  const a = asked.toLowerCase();
  return options.filter((o) => !a.includes(o.toLowerCase().replace(/\?$/, ''))).slice(0, 4);
}
