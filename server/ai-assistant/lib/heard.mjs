// Speech recognition writes what words sound like, and it does not know the
// lessons: "photosinthesis", "the venom theorem" (Thevenin), "what is face"
// (phase), "Portugal and spawn" (Spain). This puts the lesson's words back:
//
// - fix(text): a word that is in no dictionary becomes the closest word the
//   lessons use (one or two letters apart, never a short word), and the
//   student's own corrections ("the venom" -> "Thevenin") are applied.
// - prompt(context): the words of the open lesson and the questions on
//   screen, for a recogniser that takes a prompt (Whisper).
// - choose(hypotheses, { context, kb }): the recogniser's few best guesses,
//   each also with its sound-alike spans swapped for lesson phrases ("the
//   venom" and "Thevenin" sound the same: 0FNM, 0FNN). Every version is
//   searched in the knowledge base and one replaces what was heard only when
//   it clearly finds a lesson better, so ordinary words stay as said.
// - learn(heard, fixed): a correction the student typed or tapped, kept on
//   disk and used from then on.
import path from 'node:path';
import { dictionary } from './converse.mjs';
import { readJson, writeWholeSync } from './files.mjs';

// A rough sound of a word or phrase (after Metaphone): consonants by sound,
// voiced and unvoiced pairs together (d/t, b/p, g/k, v/f, z/s), vowels
// dropped except a leading one. "the venom" -> 0FNM, "Thevenin" -> 0FNN.
export function soundKey(text) {
  let s = String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
  if (!s) return '';
  s = s.replace(/^(kn|gn|pn|wr|ps)/, (m) => m[1]).replace(/^x/, 's').replace(/^wh/, 'w').replace(/mb$/, 'm');
  s = s.replace(/x/g, 'ks').replace(/tch/g, 'ch').replace(/sch/g, 'sk').replace(/ph/g, 'f').replace(/^gh/, 'g').replace(/gh/g, '')
    .replace(/th/g, '0').replace(/sh|ch|ti(?=[ao])/g, 'X').replace(/ck/g, 'k').replace(/c(?=[eiy])/g, 's').replace(/[cq]/g, 'k')
    .replace(/dg(?=[eiy])/g, 'j').replace(/z/g, 's').replace(/d/g, 't').replace(/b/g, 'p').replace(/g/g, 'k').replace(/v/g, 'f').replace(/j/g, 'X')
    .replace(/h(?![aeiou])/g, '').replace(/[wy](?![aeiou])/g, '');
  s = s.replace(/(.)\1+/g, '$1');
  const first = /^[aeiouy]/.test(s) ? 'A' : '';
  return (first + s.slice(first ? 1 : 0).replace(/[aeiouy]/g, '')).toUpperCase();
}

// Levenshtein distance, stopping early once it passes max.
export function distance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

const SMALL = new Set('a an the of to in on at by for and or but is are was be it its i me my you we he she they this that what why how who when where which do does did can could would should will tell explain teach show about with from into than then so if not no yes'.split(' '));
// Joining words a misheard name rarely starts or ends on ("is a car no" is
// not a name; "car no" may be Karnaugh).
const JOIN = new Set('of to in on at by for and or but is are was be it its i me my you we he she they this that what why how who when where which do does did about with from into'.split(' '));
const words = (t) => String(t).match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || [];
const plain = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();

// The name words of a text: capitalised words not at the start of a
// sentence ("Why does Okonkwo kill himself?" -> Okonkwo).
function names(text) {
  const out = [];
  for (const sentence of String(text).split(/[.?!:;]\s+/)) {
    words(sentence).slice(1).forEach((w) => { if (/^\p{Lu}/u.test(w) && w.length >= 3) out.push(w.replace(/['’]s$/, '')); });
  }
  return out;
}

// What the student said may be a quiz answer or a command: never reworded.
const COMMAND = /^(stop|wait|hold on|pause|quiet|go on|continue|carry on|keep going|resume|go ahead|repeat|again|pardon|next|skip|move on|slow(er)?( down)?|faster|speed up|yes|yeah|yep|no|nope|nah|ok(ay)?|sure|thanks?( you)?|(option )?[a-d]|[\d .,]+)\b[\s.!?]*$/i;

export function createHeard(packs, topics = new Map(), { dataDir = null } = {}) {
  let vocab = new Map();
  let all = packs;
  let phrases = [];          // { text, key, packs: Set }
  let byFirst = new Map();   // first sound -> phrases
  // Words of the lessons and of every topic in the curriculum (even ones
  // with no lesson yet), so "photosynthesis" is known before its pack is.
  function build(next) {
    all = next;
    vocab = new Map();
    const add = (text) => { for (const w of String(text).toLowerCase().match(/[a-z']{5,}/g) || []) vocab.set(w, (vocab.get(w) || 0) + 1); };
    for (const p of next.values()) add(`${p.title} ${(p.keywords || []).join(' ')}`);
    for (const t of topics.values()) add(`${t.title} ${t.subtopics || ''}`);
    // The phrases a student says to name a lesson: its keywords, its short
    // title and the names in its title and example questions.
    const found = new Map();
    const put = (text, id) => {
      const t = String(text).trim().replace(/^(the|a|an) /i, '');
      const n = words(t).length;
      if (!n || n > 4 || t.length > 40) return;
      const key = soundKey(t);
      if (key.length < 2) return;
      const k = `${key}|${t.toLowerCase()}`;
      if (!found.has(k)) found.set(k, { text: t, key, packs: new Set() });
      found.get(k).packs.add(id);
    };
    for (const p of next.values()) {
      for (const k of p.keywords || []) put(k, p.id);
      if (p.title.includes(':')) put(p.title.split(':')[0], p.id);
      for (const n of names(`${p.title}. ${(p.examples || []).join(' ')}`)) put(n, p.id);
    }
    phrases = [...found.values()];
    byFirst = new Map();
    for (const ph of phrases) { const f = ph.key[0]; if (!byFirst.has(f)) byFirst.set(f, []); byFirst.get(f).push(ph); }
  }
  build(packs);

  // The student's own corrections, from -> to (lower case), most recent last.
  const file = dataDir ? path.join(dataDir, 'heard-fixes.json') : null;
  let mine = [];
  if (file) mine = [].concat(readJson(file, {})?.fixes || []);
  const save = () => { try { if (file) writeWholeSync(file, `${JSON.stringify({ fixes: mine }, null, 1)}\n`); } catch { /* kept in memory */ } };
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // The word list has stems only ("invent", not "invented"), so a word whose
  // stem is in it is a real word, never a mishearing to correct.
  function known(dict, w) {
    if (dict.has(w)) return true;
    const stems = [[/s$/, ''], [/es$/, ''], [/ies$/, 'y'], [/ed$/, ''], [/ed$/, 'e'], [/(.)\1ed$/, '$1'], [/ied$/, 'y'], [/ing$/, ''], [/ing$/, 'e'], [/(.)\1ing$/, '$1'], [/er$/, ''], [/ers$/, ''], [/est$/, ''], [/ly$/, ''], [/ily$/, 'y'], [/ness$/, ''], [/ment$/, ''], [/ments$/, '']];
    return stems.some(([re, to]) => re.test(w) && dict.has(w.replace(re, to)));
  }

  function personal(text) {
    let t = String(text);
    for (const { from, to } of mine) t = t.replace(new RegExp(`(^|[^\\p{L}])${escape(from)}(?=$|[^\\p{L}])`, 'giu'), (m, pre) => `${pre}${to}`);
    return t;
  }

  function fix(text) {
    const t = personal(text);
    const dict = dictionary();
    if (!dict.size) return t; // no word list on this system: leave it
    return t.replace(/[A-Za-z']{5,}/g, (word) => {
      const w = word.toLowerCase();
      if (vocab.has(w) || known(dict, w)) return word;
      const max = w.length >= 8 ? 2 : 1;
      let best = null;
      let bestD = max + 1;
      for (const [v, n] of vocab) {
        if (v[0] !== w[0] && v.slice(0, 2) !== w.slice(0, 2).split('').reverse().join('')) continue;
        const d = distance(w, v, max);
        if (d < bestD || (d === bestD && n > (vocab.get(best) || 0))) { best = v; bestD = d; }
      }
      if (!best || bestD > max) return word;
      return /^[A-Z]/.test(word) ? best[0].toUpperCase() + best.slice(1) : best;
    });
  }

  // The lesson around the student: the open pack, its module and the
  // questions on screen. -> { packs: Set of ids, terms: [phrase] }
  function around(context = {}) {
    const ids = new Set();
    const open = all.get(context.topic);
    if (open) {
      ids.add(open.id);
      for (const p of all.values()) if (p.group && p.group === open.group) ids.add(p.id);
    }
    const terms = new Map();
    const put = (text, weight) => {
      const t = String(text).trim();
      const key = soundKey(t);
      if (key.length >= 2 && words(t).length <= 4 && !terms.has(t.toLowerCase())) terms.set(t.toLowerCase(), { text: t, key, weight });
    };
    if (open) {
      for (const k of open.keywords || []) put(k, 2);
      if (open.title.includes(':')) put(open.title.split(':')[0], 2);
      const lessonText = [open.title, ...(open.faq || []).map((f) => f.q), ...(open.examples || [])].join('. ');
      for (const n of names(lessonText)) put(n, 2);
      for (const w of words(lessonText)) if (w.length >= 5 && !SMALL.has(w.toLowerCase())) put(w.toLowerCase(), 1.5);
    }
    for (const ph of phrases) if ([...ph.packs].some((id) => ids.has(id))) put(ph.text, 1);
    for (const chip of context.chips || []) {
      for (const n of names(chip)) put(n, 1.5);
      for (const w of words(chip)) if (w.length >= 5 && !SMALL.has(w.toLowerCase())) put(w.toLowerCase(), 1);
    }
    for (const { to } of mine.slice(-20)) put(to, 1);
    return { packs: ids, terms: [...terms.values()] };
  }

  // Text for the recogniser to read first: the lesson's title and words, the
  // questions on screen and the student's own corrected words.
  function prompt(context = {}) {
    const open = all.get(context.topic);
    const parts = [];
    if (open) parts.push(`${open.title}.`, `${(open.keywords || []).join(', ')}.`);
    for (const c of (context.chips || []).slice(0, 4)) parts.push(c);
    const own = [...new Set(mine.slice(-8).map((m) => m.to))];
    if (own.length) parts.push(`${own.join(', ')}.`);
    return parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, 600);
  }

  // Versions of the text with one sound-alike span (1–4 words) swapped for a
  // lesson phrase, nearest first: [{ text, swaps: [{ from, to, d, here }] }].
  function variants(text, context = {}, near = around(context), limit = 8) {
    const at = [...String(text).matchAll(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)];
    const ws = at.map((m) => m[0]);
    const dict = dictionary();
    const found = [];
    for (let i = 0; i < ws.length; i++) {
      for (let n = 1; n <= 4 && i + n <= ws.length; n++) {
        const span = ws.slice(i, i + n);
        if (span.some((w) => /\d/.test(w))) continue; // "7 and theorem" has no sound for the 7
        if (span.every((w) => SMALL.has(w.toLowerCase())) || SMALL.has(span[0].toLowerCase()) && n === 1) continue;
        const key = soundKey(span.join(''));
        if (key.length < 2) continue;
        const said = plain(span.join(' '));
        const odd = span.some((w) => w.length >= 4 && !known(dict, w.toLowerCase()) && !vocab.has(w.toLowerCase()));
        // A span that starts or ends on a joining word ("is a car no", but
        // not "the venom" or "a con quo") is only swapped for a word of the
        // open lesson.
        const lead = span[0].toLowerCase();
        const edge = n > 1 && (JOIN.has(span[n - 1].toLowerCase()) || JOIN.has(lead));
        const consider = (ph, here) => {
          if (plain(ph.text) === said || plain(ph.text).replace(/ /g, '') === said.replace(/ /g, '')) return;
          if (!here && edge) return;
          const L = Math.max(key.length, ph.key.length);
          const max = here ? (L <= 2 ? 0 : L <= 6 ? 1 : 2) : (L <= 2 ? (odd ? 0 : -1) : L <= 3 ? 0 : L <= 9 ? 1 : 2);
          if (max < 0) return;
          const d = distance(key, ph.key, max);
          if (d <= max) found.push({ i, n, from: span.join(' '), to: ph.text, d, here, weight: here ? ph.weight : 0, packs: ph.packs ? [...ph.packs] : [] });
        };
        for (const t of near.terms) consider(t, true);
        for (const ph of byFirst.get(key[0]) || []) consider(ph, false);
      }
    }
    // Nearest and most local first; one swap per span.
    found.sort((a, b) => (a.d - b.d) || (b.weight - a.weight) || (b.n - a.n));
    const seen = new Set();
    const out = [];
    for (const f of found) {
      const from = at[f.i].index;
      const end = at[f.i + f.n - 1].index + at[f.i + f.n - 1][0].length;
      const t = `${text.slice(0, from)}${f.to}${text.slice(end)}`;
      if (seen.has(t.toLowerCase())) continue;
      seen.add(t.toLowerCase());
      out.push({ text: t, swaps: [f] });
      if (out.length >= limit) break;
    }
    return out;
  }

  // The recogniser's guesses [{ text, score }] (best first) -> what the
  // student most likely said: { text, heard, options, swapped }.
  // acoustic(texts): how well each sentence fits the recording (hear.score);
  // a version more than `drop` below what was heard (mean log-probability
  // per token) is not what the sound says ("happens" -> "hollow bones").
  // Tuned on 93 recorded questions (test/asr-eval.mjs --dump).
  const TUNE = { drop: 2, margin: 0.03, marginAny: 0.05, minKb: 0.5 };
  async function choose(hyps, { context = {}, kb = null, acoustic = null, tune = {}, debug = false } = {}) {
    const k = { ...TUNE, ...tune };
    const list = (hyps || []).filter((h) => h?.text?.trim());
    if (!list.length) return { text: '', heard: '', options: [] };
    const heard = list[0].text.trim();
    const first = fix(heard);
    // Other things it may have been, to tap: not for a command, and not the
    // same letters spelt another way ("A. C." for "AC").
    const letters = (t) => plain(t).replace(/[^a-z]/g, '');
    const result = (text, swapped = null, scored = null) => ({
      text, heard, swapped,
      options: COMMAND.test(heard) ? [] : list.map((h) => fix(h.text.trim())).filter((t, i, all) => letters(t) !== letters(text) && all.findIndex((x) => letters(x) === letters(t)) === i).slice(0, 2),
      ...(debug ? { scored } : {}),
    });
    if (!kb || COMMAND.test(heard) || context.awaiting && words(heard).length <= 3) return result(first);
    const near = around(context);
    const top = list[0].score ?? 0;
    const candidates = [];
    list.slice(0, 4).forEach((h, rank) => {
      const base = fix(h.text.trim());
      // Without the sound to check, a lower guess starts behind by how much less sure the recogniser was.
      const behind = rank ? Math.min(0.2, 0.25 * Math.max(0, top - (h.score ?? top))) + 0.01 : 0;
      candidates.push({ text: base, behind, cost: 0, swaps: [] });
      for (const v of variants(base, context, near, rank ? 3 : 6)) {
        const s = v.swaps[0];
        candidates.push({ text: v.text, behind, cost: s.here ? 0.01 + 0.01 * s.d : 0.02 + 0.02 * s.d, swaps: v.swaps });
      }
    });
    const seen = new Set();
    const unique = candidates.filter((c) => { const key = plain(c.text); return !seen.has(key) && seen.add(key); });
    const named = new Set([...near.packs, ...unique.flatMap((c) => c.swaps.flatMap((x) => x.packs || []))]);
    const [hits, sound] = await Promise.all([
      kb.rank ? kb.rank(unique.map((c) => c.text), [...named]) : Promise.all(unique.map(async (c) => (await kb.find(c.text, 1))[0])),
      unique.length > 1 && acoustic ? acoustic(unique.map((c) => c.text)).catch(() => null) : null,
    ]);
    // The sound check can come back empty (the recording already forgotten):
    // then the recogniser's own order counts instead.
    const scored = unique.map((c, i) => {
      const hit = hits[i];
      const local = hit && near.packs.has(hit.card.pack) ? 0.04 : 0;
      const drop = sound ? Math.max(0, sound[0] - sound[i]) : 0;
      const cost = c.cost + (sound ? 0 : c.behind);
      return { ...c, cost, kb: hit?.score || 0, pack: hit?.card.pack, sound: sound?.[i], drop, total: (hit?.score || 0) + local - cost };
    });
    const base = scored[0];
    const fits = scored.filter((c) => c.drop <= k.drop);
    const best = fits.reduce((a, b) => (b.total > a.total ? b : a), base);
    // A phrase from anywhere in the lessons has to find its lesson by a
    // wider margin than a word of the open lesson or another guess.
    const margin = best.swaps.some((x) => !x.here) ? k.marginAny : k.margin;
    if (best !== base && best.total > base.total + margin && best.kb >= k.minKb) {
      return result(best.text, { from: best.swaps[0]?.from || heard, to: best.swaps[0]?.to || best.text, kb: +best.kb.toFixed(2), was: +base.kb.toFixed(2) }, scored);
    }
    return result(first, null, scored);
  }

  // A correction the student made: keep the words that changed (at most
  // four on each side) so the same mishearing is fixed next time.
  function learn(said, meant) {
    const a = words(said);
    const b = words(meant);
    let s = 0;
    while (s < a.length && s < b.length && a[s].toLowerCase() === b[s].toLowerCase()) s++;
    let e = 0;
    while (e < a.length - s && e < b.length - s && a[a.length - 1 - e].toLowerCase() === b[b.length - 1 - e].toLowerCase()) e++;
    // Ordinary words ("venom" -> "Thevenin") keep a word beside them
    // ("venom theorem"), so "snake venom" is still heard as said.
    if (!a.slice(s, a.length - e).some((w) => !SMALL.has(w.toLowerCase()))) return null; // "a" -> "the" is not a mishearing
    const dict = dictionary();
    const ordinary = a.slice(s, a.length - e).every((w) => SMALL.has(w.toLowerCase()) || known(dict, w.toLowerCase()));
    if (ordinary && e > 0) e--; else if (ordinary && s > 0 && !SMALL.has(a[s - 1].toLowerCase())) s--;
    const from = a.slice(s, a.length - e).join(' ').toLowerCase();
    const to = b.slice(s, b.length - e).join(' ');
    if (!from || !to || words(from).length > 4 || words(to).length > 4 || from.length < 3) return null;
    mine = mine.filter((m) => m.from !== from);
    mine.push({ from, to, at: new Date().toISOString() });
    if (mine.length > 300) mine.shift();
    save();
    return { from, to };
  }
  function forget(from) { mine = mine.filter((m) => m.from !== String(from).toLowerCase()); save(); }

  return { fix, prompt, variants, choose, learn, forget, around, get fixes() { return mine.slice(); }, rebuild: build };
}
