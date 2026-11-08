// The conversational layer, all rules and instant: small talk, yes and no
// to an offer, "I don't know" to a question, half-finished sentences and
// mumbles the speech model turned into nonsense. None of these are missing
// lessons, so none of them reach the LLM or the TODO list.
import fs from 'node:fs';
import { TALK, NOT_HEARD, FRAGMENT } from '../shared/lines.js';
import { LETTERS } from '../shared/solvers.js';
import { findTopic } from './packs.mjs';

const say = (kind, text, draw = []) => ({ kind, title: null, steps: [{ say: text, draw }] });
const QUESTION = /\b(what|whats|why|how|who|when|where|which|can|could|does|do|is|are|explain|teach|tell|show|find|work|calculate|help)\b/;
// An unfinished sentence ends on a joining word, or on an article right after
// one ("what is the area of a"); "b take away a" ends on the vector a.
const DANGLING = /(\b(of|and|or|to|is|are|my|i|what|which|how|with|for|in|on|if|but|so|that|about|by|from|whats|it'?s|it s|its)|\b(of|is|with|in|on|for|to|by|from|find|have|got|want|need|whats|about|and) (the|a|an))$/;
const STUCK = /\b(i (do ?n.?t|dont) know|no idea|not sure|i give up|give up|tell me the answer|what is the answer|whats the answer|skip( it)?|i.?m stuck)\b/;

// Words the speech model can produce from a mumble are often not English at
// all ("Aroheadhuche", "Darronto"); the system word list tells them apart.
let DICT = null;
export function dictionary() {
  if (DICT) return DICT;
  try { DICT = new Set(fs.readFileSync('/usr/share/dict/words', 'utf8').toLowerCase().split('\n')); } catch { DICT = new Set(); }
  return DICT;
}
function mostlyUnknown(words) {
  const dict = dictionary();
  if (!dict.size) return false;
  const checked = words.filter((w) => w.length > 2 && !/\d/.test(w));
  return checked.length > 0 && checked.filter((w) => !dict.has(w.replace(/'s$/, '')) && !dict.has(w.replace(/s$/, ''))).length / checked.length >= 0.5;
}
export const YES = /^(yes|yeah|yep|yup|sure|ok|okay|alright|all right|go on then|please|yes please|lets do it|let.?s go)\b/;
export const NO = /^(no|nope|nah|no thanks|no thank you|not now|maybe later|not that)\b/;

// The answer of the waiting question, revealed kindly.
export function revealPlan(quiz, { test = false } = {}) {
  const a = quiz.answer;
  return {
    kind: 'answer', correct: false, title: 'The answer',
    steps: [{
      say: `That's okay, let's look at it together. The answer is ${LETTERS[a]}, ${quiz.options[a].say}. ${quiz.why}${test ? '' : ' Ask me anything else, or say test me.'}`,
      draw: [{ op: 'mark', option: a, kind: 'tick', at: 'answer', sfx: 'correct' }],
    }],
  };
}

// t is the normalized text. Returns { plan, tier } or null.
export function converse(t, { context = {}, packs } = {}) {
  const words = t.replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(Boolean);
  const bare = words.join(' ');
  const short = words.length <= 7;

  if (context.awaiting && STUCK.test(bare)) return { plan: { ...revealPlan(context.awaiting, { test: !!context.test }), context }, tier: 'talk' };
  if (short && NO.test(bare)) return { plan: say('talk', TALK.noThanks), tier: 'talk' };
  if (short && STUCK.test(bare)) return { plan: say('talk', TALK.stuck), tier: 'talk' };
  if (short && /^(hi|hello|hey|hiya|good (morning|afternoon|evening))\b/.test(bare) && words.length <= 4) return { plan: say('talk', TALK.hello), tier: 'talk' };
  if (/\bhow are you\b/.test(bare) && short) return { plan: say('talk', TALK.howAreYou), tier: 'talk' };
  if (short && /^(thanks|thank you|cheers|great|awesome|cool|nice|got it|that makes sense|i get it|i understand)\b/.test(bare)) return { plan: say('talk', TALK.thanks), tier: 'talk' };
  if (/\b(who are you|what is your name|whats your name|what are you)\b/.test(bare)) return { plan: say('talk', TALK.who), tier: 'talk' };
  if (/\b(what can you (do|teach)|what do you (know|teach)|what can i ask)\b/.test(bare) || bare === 'help') return { plan: say('talk', TALK.help), tier: 'talk' };
  if (short && YES.test(bare) && words.length <= 2) return { plan: say('talk', TALK.okay), tier: 'talk' };

  // The student stopped mid-sentence ("What is the advantage I"): wait for the rest.
  // ("What is Easter about" is a whole question, though it ends on "about".)
  if (words.length >= 2 && DANGLING.test(bare) && !/[?]$/.test(t.trim()) && !/^(what|whats|what's|what is|what are|who is) .+ (about|for|from|made of)$/.test(bare)) return { plan: { kind: 'fragment', prefix: t, steps: [{ say: FRAGMENT, draw: [] }] }, tier: 'talk' };

  // A mumble the speech model heard as nonsense ("the Aroheadhuche."): ask again.
  if (words.length <= 4 && !QUESTION.test(bare) && !findTopic(bare, packs) && mostlyUnknown(words)) return { plan: say('unclear', NOT_HEARD), tier: 'unclear' };

  return null;
}

export const isRealQuestion = (t) => QUESTION.test(t) || /\?\s*$/.test(t) || t.split(/\s+/).length >= 5;
