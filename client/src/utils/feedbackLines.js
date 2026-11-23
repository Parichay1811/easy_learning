// What the teacher says after an answer and at the end of a round: fifty praise
// lines for a right answer, fifty kind, motivating lines for a miss, and fifty
// round summaries and "what to try next" lines, in each of the site's languages,
// so a child rarely hears the same thing twice.
//
// The lines live in public/locales/<lang>/feedback.json and are fetched when a
// lesson opens (a few KB, once; the main bundle does not carry them). Until
// they arrive, or if the file cannot be fetched, the callers fall back to the
// short built-in phrases, so nothing waits on this.
//
//   preloadFeedback("de");                         // when a lesson opens
//   pickCorrect({ lang: "de", name: "Aanya" });    // "Super gemacht, Aanya!"
//   pickWrong({ lang: "de" });                     // "Nicht ganz, aber das ist okay. ..."
//   pickSummary({ lang: "de", correct: 7, total: 10 }); // { tier, result, next, text }
//
// Rules the lines follow (checked by feedbackLines.test.mjs and the translators'
// brief): never "wrong", never a comparison with other children, never a claim
// about history that is not known; a line with {name} is only used when the
// learner's first name is known.
//
// Picking is a shuffled bag: every line is heard once before any repeats, and
// the first line of a new bag is never the one just heard.

const LANGS = new Set(["en", "de", "fr", "es", "it", "pt", "nl", "ru", "tr", "id", "ja", "ko", "zh", "vi"]);

const cache = new Map(); // lang -> data | null (null: tried and failed)
const loading = new Map();

export const baseLang = (lang) => {
  const b = String(lang || "en").split("-")[0].toLowerCase();
  return LANGS.has(b) ? b : "en";
};

/** The first name from a full name; a title keeps the surname ("Mrs Sharma"). */
export function firstNameOf(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const titled = /^(mr|mrs|ms|miss|mx|dr|prof|sir|madam|herr|frau|sr|sra|mme|mlle)\.?$/i.test(parts[0]);
  return titled ? parts.slice(0, 2).join(" ") : parts[0];
}

const valid = (d) => Boolean(d && Array.isArray(d.correct) && Array.isArray(d.wrong) && d.summary && d.next);

/** Fetches (once) the lines for a language. Resolves to the data, or null. */
export function loadFeedback(lang) {
  const l = baseLang(lang);
  if (cache.has(l) && cache.get(l)) return Promise.resolve(cache.get(l));
  if (loading.has(l)) return loading.get(l);
  if (typeof fetch !== "function") return Promise.resolve(null);
  const p = fetch(`/locales/${l}/feedback.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      const ok = valid(d) ? d : null;
      cache.set(l, ok);
      return ok;
    })
    .catch(() => { cache.set(l, null); return null; })
    .finally(() => loading.delete(l));
  loading.set(l, p);
  return p;
}

/** Starts fetching the language (and English as the fallback) without waiting. */
export function preloadFeedback(lang) {
  const l = baseLang(lang);
  loadFeedback(l);
  if (l !== "en") loadFeedback("en");
}

/** The lines already fetched for a language, else the English ones, else null. */
export function getFeedback(lang) {
  return cache.get(baseLang(lang)) || cache.get("en") || null;
}

/** Test hook: put lines in the cache without fetching. */
export function setFeedbackForTest(lang, data) {
  cache.set(baseLang(lang), data);
}

// ── picking ────────────────────────────────────────────────────────────────

const bags = new Map(); // pool key -> { order: number[], last: number }

function shuffle(a, random) {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function draw(key, list, hasName, random) {
  const usable = list.map((_, i) => i).filter((i) => hasName || !/\{name\}/.test(list[i]));
  if (!usable.length) return null;
  let bag = bags.get(key);
  if (!bag || !bag.order.length || bag.size !== list.length || bag.named !== hasName) {
    const order = shuffle(usable, random);
    // The first line of a new bag is never the one heard last.
    if (bag && order.length > 1 && order[0] === bag.last) order.push(order.shift());
    bag = { order, last: bag ? bag.last : -1, size: list.length, named: hasName };
    bags.set(key, bag);
  }
  const i = bag.order.shift();
  bag.last = i;
  return list[i];
}

function fill(line, { name, correct, total }) {
  return String(line)
    .replace(/\{name\}/g, name || "")
    .replace(/\{correct\}/g, correct ?? "")
    .replace(/\{total\}/g, total ?? "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Pickers. `random` is injectable for tests. They return "" (or null) when
 * the lines are not available yet, and the caller says its built-in phrase.
 */
export function makePickers(random = Math.random) {
  const pool = (kind, { lang, name } = {}) => {
    const d = getFeedback(lang);
    const list = d?.[kind];
    if (!list?.length) return "";
    const who = firstNameOf(name);
    const line = draw(`${baseLang(lang)}|${kind}`, list, Boolean(who), random);
    return line ? fill(line, { name: who }) : "";
  };

  return {
    pickCorrect: (o) => pool("correct", o),
    pickWrong: (o) => pool("wrong", o),
    pickSummary({ lang, name, correct, total } = {}) {
      const d = getFeedback(lang);
      if (!d || !(total > 0)) return null;
      const tier = tierOf(correct, total);
      const who = firstNameOf(name);
      const l = baseLang(lang);
      const resultList = d.summary?.[tier];
      const nextList = d.next?.[nextKind(tier)];
      if (!resultList?.length || !nextList?.length) return null;
      const vars = { name: who, correct, total };
      const rawResult = draw(`${l}|summary|${tier}`, resultList, Boolean(who), random);
      const rawNext = draw(`${l}|next|${nextKind(tier)}`, nextList, Boolean(who), random);
      if (!rawResult || !rawNext) return null;
      const result = fill(rawResult, vars);
      const next = fill(rawNext, vars);
      return { tier, result, next, text: `${result} ${next}`.trim() };
    },
  };
}

/** perfect: all right; high: 80% and up; mid: 50% and up; low: under half. */
export function tierOf(correct, total) {
  if (!(total > 0)) return "mid";
  if (correct >= total) return "perfect";
  const r = correct / total;
  if (r >= 0.8) return "high";
  if (r >= 0.5) return "mid";
  return "low";
}

/** What the next-step line is about: a new thing, another go, or a gentle retry. */
export const nextKind = (tier) => (tier === "perfect" || tier === "high" ? "ready" : tier === "mid" ? "again" : "gentle");

const shared = makePickers();
export const pickCorrect = shared.pickCorrect;
export const pickWrong = shared.pickWrong;
export const pickSummary = shared.pickSummary;
