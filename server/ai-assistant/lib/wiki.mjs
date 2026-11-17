// Open knowledge for anything the lessons do not cover: Wikipedia's public
// API, Simple English first (written for learners), then English. No key.
// The text is CC BY-SA 4.0, so it may be used commercially with credit
// (every answer that uses it says so and links the article); images come
// from Wikimedia Commons with their own free licence and author, checked
// here, and a file not on Commons (a non-free image) is never shown.
// Results are cached on disk for a month: one lookup per question, not per
// student.
import fs from 'node:fs';
import path from 'node:path';
import { readJson, writeWhole, prune } from './files.mjs';

const UA = 'LearnigoLiveTeacher/0.3 (free education website; https://www.learnigo.eu)';
const MONTH = 30 * 24 * 3600 * 1000;
const DAY = 24 * 3600 * 1000;
// Words around a question that are not its subject: fillers ("come on",
// "okay so"), requests ("show me", "can you explain") and question words.
const FILLER = /^(come on|hey|hi|hello|ok(ay)?|so|well|um+|uh+|right|now|please|teacher|miss|sir|again|just|actually|then|and|but)[,!.]?\s+/i;
const ASKING = /^(can|could|would|will) you (please )?|^(please )?(tell|show|teach|explain|describe|define|give|help) (me|us)( (about|what|how|why|the meaning of|again))?\s*|^(please )?(tell|show|teach|explain|describe|define)( to me| about)?\s+|^i (want|would like|'d like|wanna) to (know|learn|see|understand)( about| what| how| why)?\s*|^(do you know|what do you know about|what can you tell me about)\s+|^(what|who|where|when|which)('s|'re| is| are| was| were| does| do| did)?( the| a| an)?\s+|^(why|how)( (is|are|do|does|did|can|could|would|was|were))?\s+|^(the )?(meaning|definition|concept|idea) of\s+/i;

export function createWiki({ dataDir, own = null, log = () => {} } = {}) {
  const file = path.join(dataDir, 'wiki.json');
  let cache = {};
  cache = readJson(file, {});
  let saving = null;
  const save = () => { clearTimeout(saving); saving = setTimeout(() => writeWhole(file, JSON.stringify(prune(cache))).catch(() => {}), 2000); };
  const get = (url, ms = 2500) => fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA }, signal: AbortSignal.timeout(ms) }).then((r) => (r.ok ? r.json() : null));

  // "Why is the sky blue?" -> "sky blue"; "tell me about the solar system" -> "solar system".
  function subject(question) {
    let q = String(question).trim().replace(/[?!.]+$/, '');
    for (let i = 0; i < 6; i++) { const before = q; q = q.replace(FILLER, '').replace(ASKING, '').replace(/^(is|are|was|were|does|do|did)\s+(the |a |an )?/i, '').trim(); if (q === before) break; }
    // "bubble sorting" -> "bubble sort": the name of the method, not the doing.
    q = q.replace(/\b(\w{3,})ing$/i, (m, w) => (/(sort|search|program|cod|comput|hash|pars|encrypt|cach|rout|test|debugg)$/i.test(w) ? w.replace(/(gg|dd)$/, (x) => x[0]).replace(/^cod$/, 'code') : m));
    // "we have seasons" -> "seasons"; "invented the telephone" -> "telephone".
    q = q.replace(/^(we|you|i|they|people|there)\s+(have|get|need|see|feel|use)?\s*/i, '').replace(/^(invented|discovered|created|wrote|painted|built|founded)\s+/i, '');
    // "heart work" -> "heart": the thing, not what it does.
    q = q.replace(/\s+(work|works|grow|grows|happen|happens|form|forms|move|moves|function|end|ends|start|starts|begin|begins|die|dies|live|lives)$/i, '');
    // Follow-ups made whole ("When was Albert Einstein born?", "Tell me more
    // about volcanoes", "who climbed Mount Everest first?"): just the thing.
    q = q.replace(/^(more about|a picture of|picture of|an? (everyday )?example of|everyday example of)\s+/i, '').replace(/\s+in simple words$/i, '');
    q = q.replace(/^(climbed|reached|found|named|discovered|made)\s+(.+?)\s+(first|last)$/i, '$2').replace(/^(climbed|reached|visited|named)\s+/i, '');
    q = q.replace(/^(cold|hot|big|tall|old|far|deep|long|high|heavy|fast|wide)\s+(is|are|was|were)\s+/i, '');
    for (let i = 0; i < 3; i++) q = q.replace(/\s+(born|die|died|famous( for)?|known( for)?|important|used( for)?|made( of)?|erupt|invented|discovered|built|founded|made|created|at the top|on top|located|first|today|now)$/i, '');
    return q.replace(/^(the|a|an)\s+/i, '').trim();
  }

  async function article(lang, q, exact = false) {
    let key;
    if (exact) key = q.trim().replace(/\s+/g, '_').replace(/^./, (c) => c.toUpperCase());
    else {
      const found = await get(`https://${lang}.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(q)}&limit=1`);
      key = found?.pages?.[0]?.key;
    }
    if (!key) return null;
    const s = await get(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(key)}`);
    if (!s?.extract || s.type === 'disambiguation') return null;
    return { lang, site: 'Wikipedia', title: s.title, description: s.description || '', extract: s.extract, url: s.content_urls?.desktop?.page, imageFile: s.originalimage?.source || s.thumbnail?.source || null };
  }

  // The image's licence and author from Commons, or null when it is not there.
  async function image(src) {
    const m = String(src || '').match(/\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?]+)/);
    if (!m) return null;
    const name = decodeURIComponent(m[1]);
    const r = await get(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=900&titles=${encodeURIComponent(`File:${name}`)}`).catch(() => null);
    const info = Object.values(r?.query?.pages || {})[0]?.imageinfo?.[0];
    if (!info) return null;
    const md = info.extmetadata || {};
    const licence = md.LicenseShortName?.value || '';
    if (!/public domain|cc0|cc[- ]by|pd/i.test(licence) || /\bnc\b|nd\b/i.test(licence)) return null; // free for commercial use only
    const author = String(md.Artist?.value || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
    return { src: info.thumburl || info.url, credit: `${author ? `${author}, ` : ''}${licence} via Wikimedia Commons`, page: info.descriptionurl };
  }

  // Our own knowledge base first, when there is one: a Wiki.js server
  // (js.wiki, open source, self-hosted) where the team writes articles for
  // the questions the lessons and Wikipedia answer badly. Its GraphQL API
  // with an API key; pages in Markdown, read as plain sentences.
  async function fromOwn(q, question) {
    if (!own?.url || !own?.token) return null;
    const gql = (query, variables) => fetch(`${own.url.replace(/\/$/, '')}/graphql`, {
      method: 'POST', signal: AbortSignal.timeout(2500),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${own.token}` },
      body: JSON.stringify({ query, variables }),
    }).then((r) => (r.ok ? r.json() : null));
    const found = await gql('query ($q: String!) { pages { search(query: $q) { results { id title description path locale } } } }', { q }).catch(() => null);
    const hit = found?.data?.pages?.search?.results?.[0];
    if (!hit) return null;
    const page = await gql('query ($id: Int!) { pages { single(id: $id) { title description content path locale } } }', { id: Number(hit.id) }).catch(() => null);
    const p = page?.data?.pages?.single;
    if (!p?.content) return null;
    const plain = p.content.replace(/```[\s\S]*?```/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/^#+\s.*$/gm, ' ').replace(/[*_`>|#-]+/g, ' ').replace(/\s+/g, ' ').trim();
    const a = { lang: 'own', site: own.name || 'Learnigo wiki', title: p.title, description: p.description || '', extract: plain, url: `${own.url.replace(/\/$/, '')}/${p.locale}/${p.path}`, image: null };
    return relevant(a, question) ? a : null;
  }

  // { title, description, extract, url, image } for a question, or null.
  async function lookup(question) {
    const q = subject(question);
    if (q.length < 2 || q.split(/\s+/).length > 12) return null;
    const mine = await fromOwn(q, question).catch(() => null);
    if (mine) return mine;
    const key = `v3:${q.toLowerCase()}`; // v3: qualified titles ("X (musician)") rejected
    const hit = cache[key];
    // Nothing found is kept for a day only: it may have been a slow network.
    if (hit && Date.now() - hit.at < (hit.value ? MONTH : DAY)) return hit.value;
    try {
      // "Why" and "how" questions are best searched whole on English Wikipedia
      // ("why is the sky blue" finds diffuse sky radiation, "sky blue" the
      // colour); "what is" and "who" in Simple English, written for learners.
      const why = /^\s*(why|how)\b/i.test(question);
      const full = String(question).replace(/[?!.]+$/, '');
      const one = q.replace(/\b(\w{4,}?)(es|s)\b/g, (m, w, e) => (e === 'es' && /(s|x|z|ch|sh)$/.test(w) ? w : w + (e === 'es' ? 'e' : '')));
      // The article named exactly what was asked comes first ("bubble" is not
      // "AI bubble"); a disambiguation page never counts.
      const tries = why ? [['en', full], ['simple', q, true], ['simple', q], ['en', q]] : [['simple', q, true], ['simple', q], ['en', q, true], ['en', q], ['simple', one]];
      // All at once; the best one about the question's own words wins:
      // "why do we have seasons" is not a band or an album.
      const found = await Promise.all(tries.map(([lang, text, exact]) => article(lang, text, exact).catch(() => null)));
      const media = /\b(album|song|single|film|movie|band|novel|novella|book|horror|comic|manga|tv series|television|video game|episode|rapper|singer|musician|play by)\b/i;
      let a = null;
      let best = -Infinity;
      found.forEach((x, i) => {
        if (!x || !relevant(x, question) || (media.test(x.description) && !media.test(question))) return;
        // "Aeroplane (musician)" is not the aeroplane asked about: a qualified title only when its qualifier was asked.
        const qual = (x.title.match(/\(([^)]+)\)/) || [])[1];
        if (qual && !question.toLowerCase().includes(qual.toLowerCase().split(/[\s,]+/)[0])) return;
        const keys = new Set(keyWords(question));
        const title = keyWords(x.title);
        // A why or how question searched whole finds the cause, not the thing named.
        // Every word of the title that was not asked counts against it, short ones too ("AI").
        const extra = (String(x.title).toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => !keys.has(w.slice(0, 5)) && !STOP.has(w)).length;
        const score = title.filter((w) => keys.has(w)).length * 2 - extra - i * 0.3 + (/^\s*why\b/i.test(question) && i === 0 ? 5 : 0);
        if (score > best) { best = score; a = x; }
      });
      const value = a ? { ...a, image: a.imageFile ? await image(a.imageFile) : null } : null;
      if (value) delete value.imageFile;
      cache[key] = { at: Date.now(), value };
      save();
      return value;
    } catch (e) {
      log(`wiki: ${e.message}`);
      return hit?.value || null;
    }
  }

  // The article is about the question: it names at least half of its key words.
  const STOP = new Set('the and are was were you can our its for not but has had did does what where when which who whom whose why how have that this there their they them with from about into your yours would could should tell explain teach show describe define please know learn people thing things work works happen happens make made invented discovered created'.split(' '));
  const keyWords = (t) => (String(t).toLowerCase().match(/[a-z]{3,}/g) || []).filter((w) => !STOP.has(w)).map((w) => w.slice(0, 5));
  function relevant(a, question) {
    const keys = [...new Set(keyWords(question))];
    if (!keys.length) return true;
    const have = new Set(keyWords(`${a.title} ${a.description} ${a.extract}`));
    return keys.filter((k) => have.has(k)).length >= Math.max(1, Math.ceil(keys.length / 2));
  }

  // The first sentences of an article, as many as fit a spoken answer.
  // Abbreviations ("U.S.", "e.g.", "Dr.") and decimal points ("4.5 billion")
  // are not the end of a sentence.
  const ABBR = /\b(U\.S|U\.K|U\.N|e\.g|i\.e|etc|vs|Dr|Mr|Mrs|Ms|St|Jr|Sr|No|approx|c|ca)\.|\d\.(?=\d)/g;
  function split(text) {
    const kept = String(text).replace(ABBR, (m) => m.replace(/\./g, '\u2024'));
    return (kept.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) || []).map((x) => x.replace(/\u2024/g, '.').trim());
  }
  function sentences(extract, max = 3) {
    return split(String(extract).replace(/\s*\([^)]*\)/g, '')).filter((s) => s.split(' ').length >= 4).slice(0, max);
  }

  // The answer to a "why" or "how" question is often deep in the article,
  // not in its summary: read the whole article as plain text (the API's own
  // extract, no HTML scraping) and keep the sentences that name the
  // question's key words and give a reason, in the article's order.
  async function answer(question, a, max = 3) {
    if (!a?.title) return [];
    const key = `answer2:${a.lang}:${a.title}:${String(question).toLowerCase()}`; // 2: the scoring of 25 Oct
    if (cache[key] && Date.now() - cache[key].at < MONTH) return cache[key].value;
    const r = await get(`https://${a.lang}.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1&exsectionformat=plain&redirects=1&titles=${encodeURIComponent(a.title)}`, 4000).catch(() => null);
    // The article without its link lists and references at the end.
    const text = (Object.values(r?.query?.pages || {})[0]?.extract || '').split(/\n\s*(References|Other websites|External links|Related pages|Notes|Sources|Further reading|See also)\s*\n/)[0];
    const keys = [...new Set(keyWords(question))];
    // In the article about Mount Everest every sentence names it: only the question's other words tell sentences apart.
    const own = new Set(keyWords(subject(question)));
    const asked = keys.filter((k) => !own.has(k)).length ? keys.filter((k) => !own.has(k)) : keys;
    const all = split(text.split(/\n+/).filter((p) => p.split(' ').length > 8).join(' ').replace(/\s*\([^)]*\)/g, ''))
      .map((x) => x.trim()).filter((x) => { const n = x.split(/\s+/).length; return n >= 6 && n <= 40 && !/^(see also|references|external links)/i.test(x) && !/\s{3,}|(\b\w\b\s+){4,}/.test(x); });
    const why = /\b(why|how)\b/i.test(question);
    // What was done, in the question's own verb ("invented", "end"), with the
    // words an article uses for it; a "who was X" question has none.
    const SAME = { invent: 'patent|creat|built|made', discov: 'found|first', end: 'surrender|over|finish', start: 'began|begin|outbreak', found: 'establish|creat', write: 'wrote|written|author', paint: 'painted|artist', build: 'built|construct', climb: 'reach|summit|ascent|get to the top|top of', cold: 'temperature|°c|degrees|freez', hot: 'temperature|°c|degrees', live: 'lived|inhabit', eat: 'eats|diet|feed' };
    const doneWords = String(question).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
      .filter((w) => w.length >= 3 && !/^(who|when|where|what|how|why|which|year|did|does|was|were|is|are|the|and|first|world|war|top|bottom|middle|side)$/.test(w) && !/^(at|in|on|of|to|for|from|with|it|its|they|them|this|that|do|can|could|would|should|tell|me|about|much|many)$/.test(w) && !subject(question).toLowerCase().split(/\s+/).includes(w));
    const stems = doneWords.map((w) => w.replace(/(ed|ing|s)$/, '').slice(0, 6)).filter((w) => w.length >= 3);
    const did = stems.length ? new RegExp(`\\b(${stems.map((w) => [w, ...Object.entries(SAME).filter(([k]) => w.startsWith(k) || k.startsWith(w)).map(([, v]) => v)].join('|')).join('|')})`, 'i') : null;
    const who = /^\s*who\b/i.test(question) && !!did;
    const when = /^\s*(when|what year)\b/i.test(question);
    const where = /^\s*where\b/i.test(question);
    // The summary's sentences first (the most general), then the article's;
    // a sentence that leans on the one before ("Hence...", "This...") is skipped.
    const summary = sentences(a.extract, 6);
    const pool = [...summary.map((x) => ({ x, top: true })), ...all.filter((x) => !summary.includes(x)).map((x) => ({ x, top: false }))];
    const scored = pool.filter((o) => !/^(hence|however|also|this|these|that|it|they|such|thus|therefore|in addition|for example|but|and)\b/i.test(o.x) || o.top).map((o, i) => {
      // A key word counts in any form ("cold" in "coldest", "climb" in "climbers").
      const have = (o.x.toLowerCase().match(/[a-z]{3,}/g) || []);
      let score = asked.filter((k) => have.some((h) => h.startsWith(k))).length * 2 + (o.top ? 2 : 0);
      if (why && /\b(because|so that|due to|causes?|caused|result of|which means|this is why|as a result|when|by)\b/i.test(o.x)) score += 2;
      if (did && did.test(o.x)) score += 4;
      // "Who climbed it first?": the first ever, not a record ("first to do it 30 times").
      if (/\bfirst\b/i.test(question) && /\bfirst\b/i.test(o.x)) score += /\bfirst (people|person|man|woman|ones?|humans?)\b|\bthe first to\b/i.test(o.x) ? 4 : 2;
      if (/\bfirst\b/i.test(question) && /\b(\d+ times|without|solo|youngest|oldest|fastest|record)\b/i.test(o.x)) score -= 3;
      // "How cold / tall / far…?": the sentence with the number.
      if (/^\s*how (cold|hot|warm|tall|high|far|big|heavy|deep|long|old|fast)\b/i.test(question) && /\d/.test(o.x)) score += /\d\s?(°|metres|meters|km|kilometres|kg|%|years|m\b|mph|km\/h)/i.test(o.x) ? 5 : 3;
      // "Who invented...": a sentence naming someone; "when": a year; "where": a place.
      // A person named, other than the thing asked about ("Mount Everest" is not a person).
      if (who && /\s(?:[A-Z][a-z]+\s){1,2}[A-Z][a-z]+/.test(` ${o.x.replace(/^\S+/, '').replace(new RegExp(subject(question).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '')}`)) score += 3;
      if (when && /\b(1[0-9]{3}|20[0-9]{2})\b/.test(o.x)) score += 3;
      if (where && /\b(in|at|near|from)\s+[A-Z][a-z]+/.test(o.x)) score += 3;
      return { x: o.x, i, score: score - i * 0.01 };
    });
    const top = scored.filter((o) => o.score >= 2).sort((p, q) => q.score - p.score).slice(0, max);
    // A "who", "when" or "where" answer says the person, year or place first.
    const lead = who || when || where || /^\s*how (cold|hot|warm|tall|high|far|big|heavy|deep|long|old|fast)\b/i.test(question);
    const best = (lead ? [top[0], ...top.slice(1).sort((p, q) => p.i - q.i)].filter(Boolean) : top.sort((p, q) => p.i - q.i)).map((o) => o.x);
    cache[key] = { at: Date.now(), value: best };
    save();
    return best;
  }

  // "Tell me more": the article's next sentences that were not said yet
  // (the whole plaintext, link lists and references cut off).
  async function more(a, said = '', n = 3) {
    if (!a?.title) return [];
    const key = `full2:${a.lang}:${a.title}`;
    let all = cache[key] && Date.now() - cache[key].at < MONTH ? cache[key].value : null;
    if (!all) {
      const r = await get(`https://${a.lang}.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1&exsectionformat=plain&redirects=1&titles=${encodeURIComponent(a.title)}`, 4000).catch(() => null);
      const text = (Object.values(r?.query?.pages || {})[0]?.extract || '').split(/\n\s*(References|Other websites|External links|Related pages|Notes|Sources|Further reading|See also)\s*\n/)[0];
      all = split(text.split(/\n+/).filter((p) => p.split(' ').length > 8).join(' ').replace(/\s*\([^)]*\)/g, ''))
        .map((x) => x.trim()).filter((x) => { const k = x.split(/\s+/).length; return k >= 6 && k <= 40 && !/\s{3,}|(\b\w\b\s+){4,}/.test(x); }); // not formulas laid out as text
      cache[key] = { at: Date.now(), value: all };
      save();
    }
    const heard = String(said).toLowerCase();
    // A sentence counts as said when its opening words were.
    return all.filter((x) => !heard.includes(x.toLowerCase().slice(0, 40)) && !/^(hence|however|also|this|these|that|it|they|such|thus|therefore|but|and)\b/i.test(x)).slice(0, n);
  }

  // The meanings of a word that has several ("bubble": bubble tea, soap
  // bubble, AI bubble), when its own article is a disambiguation page.
  async function choices(question) {
    const q = subject(question);
    if (!q || q.split(/\s+/).length > 2) return [];
    const exact = await get(`https://simple.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.replace(/\s+/g, '_'))}`).catch(() => null)
      || await get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.replace(/\s+/g, '_'))}`).catch(() => null);
    if (exact?.type !== 'disambiguation') return [];
    const out = [];
    for (const lang of ['simple', 'en']) {
      const found = await get(`https://${lang}.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(q)}&limit=6`).catch(() => null);
      for (const p of found?.pages || []) if (!/disambiguation|same term/i.test(p.description || '') && !out.some((o) => o.toLowerCase() === p.title.toLowerCase())) out.push(p.title);
    }
    return out.slice(0, 4);
  }

  return { lookup, subject, sentences, answer, choices, more };
}
