// Pure helpers for the question card's teaching support: pictures for small
// sums, a second way to answer a speaking question, which explanation to offer
// next, and the server's personalised message. No React, no imports, so
// `node --test` checks them (support.test.mjs).

const WORD_NUMBERS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20,
};
const NUMBER_WORDS = Object.fromEntries(Object.entries(WORD_NUMBERS).map(([w, n]) => [n, w]));

const OPS = [
  [/\+|\bplus\b|\badd(?:ed)?\b/, "+"],
  [/[−–-]|\bminus\b|\btake away\b|\bsubtract\b/, "−"],
  [/[×x*]|\btimes\b|\bmultiplied by\b|\bgroups of\b/, "×"],
];

const num = (tok) => {
  const t = String(tok).toLowerCase();
  if (/^\d+$/.test(t)) return Number(t);
  return t in WORD_NUMBERS ? WORD_NUMBERS[t] : null;
};

/**
 * Finds a small sum in a question ("4 − 1", "What is four minus one?",
 * "3 + _ = 5") that can be shown with counters. Returns { a, b, op, result }
 * (result may be null when the unknown is not the answer) or null.
 * Only small numbers: a picture of 37 apples does not help.
 */
export function findSmallSum(...texts) {
  for (const raw of texts) {
    const text = String(raw || "").toLowerCase().replace(/[?!.,]/g, " ");
    const re = /\b(\d{1,2}|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s*(\+|[−–-]|[×x*]|plus|minus|take away|subtract|times|multiplied by|groups of|add)\s*(\d{1,2}|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/;
    const m = text.match(re);
    if (!m) continue;
    const a = num(m[1]);
    const b = num(m[3]);
    const op = (OPS.find(([r]) => r.test(m[2])) || [])[1];
    if (a == null || b == null || !op) continue;
    if (op === "+" && a + b > 20) continue;
    if (op === "−" && (a > 20 || b > a)) continue;
    if (op === "×" && (a * b > 24 || a > 6)) continue;
    const result = op === "+" ? a + b : op === "−" ? a - b : a * b;
    return { a, b, op, result };
  }
  return null;
}

/** A plain description of the picture, for screen readers and captions. */
export function describeSum({ a, b, op, result }) {
  if (op === "+") return `${a} and ${b} more make ${result}`;
  if (op === "−") return `${a}, take away ${b}, leaves ${result}`;
  return `${a} groups of ${b} make ${result}`;
}

const lower = (v) => String(v ?? "").trim().toLowerCase();

/** The answers a speaking question accepts, as text (for typing or choosing it instead). */
export function spokenAnswers(question) {
  const out = [];
  const add = (v) => { if (typeof v === "string" && v.trim() && !out.some((x) => lower(x) === lower(v))) out.push(v.trim()); };
  (Array.isArray(question?.accepted_answers) ? question.accepted_answers : []).forEach(add);
  if (typeof question?.correct_answer === "string") add(question.correct_answer);
  add(question?.speech_scoring?.sample_answer);
  return out;
}

/**
 * Three choices for answering a speaking question by tapping instead: the
 * answer and two plausible others (neighbouring numbers for a number, other
 * answers from the round for a word). Returns null when no fair choice can
 * be built. `seed` keeps the order stable for one question.
 */
export function buildChoices(question, pool = [], seed = 1) {
  const answers = spokenAnswers(question);
  const answer = answers[0];
  if (!answer || answer.split(/\s+/).length > 6) return null;
  const others = new Set();
  const n = num(answer);
  if (n != null) {
    const asWord = !/^\d+$/.test(answer);
    for (const d of [1, -1, 2, -2, 3]) {
      const v = n + d;
      if (v < 0 || v > 20) continue;
      others.add(asWord ? NUMBER_WORDS[v] : String(v));
      if (others.size >= 2) break;
    }
  } else {
    const words = answer.split(/\s+/).length;
    pool
      .filter((p) => typeof p === "string" && p.trim() && !answers.some((a) => lower(a) === lower(p)))
      .filter((p) => Math.abs(p.split(/\s+/).length - words) <= 1)
      .forEach((p) => { if (others.size < 2) others.add(p.trim()); });
  }
  if (others.size < 2) return null;
  const list = [answer, ...[...others].slice(0, 2)];
  // A small, stable shuffle.
  let s = Math.abs(Math.floor(seed)) || 1;
  for (let i = list.length - 1; i > 0; i -= 1) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/** A number from a question id, for stable shuffles. */
export function seedOf(id) {
  let h = 7;
  for (const ch of String(id || "")) h = (h * 31 + ch.charCodeAt(0)) % 1000003;
  return h;
}

/**
 * What a microphone answer tells us before marking it: { status: "uncertain",
 * reason } when nothing usable was heard (blocked mic, silence, no speech
 * recognition), otherwise null (mark it normally).
 */
export function micProblem(answer) {
  if (!answer || typeof answer !== "object") return null;
  if (answer.unsupported) return { status: "uncertain", reason: "unsupported" };
  const err = String(answer.error || "");
  if (err) {
    if (/not-allowed|service-not-allowed|permission|denied|NotAllowed/i.test(err)) return { status: "uncertain", reason: "mic_blocked" };
    if (/no-speech/i.test(err)) return { status: "uncertain", reason: "no_speech" };
    if (/audio-capture|NotFound|NotReadable/i.test(err)) return { status: "uncertain", reason: "no_mic" };
    if (/insecure/i.test(err)) return { status: "uncertain", reason: "insecure" };
    return { status: "uncertain", reason: "mic_error" };
  }
  if ("transcript" in answer && !String(answer.transcript || "").trim()) return { status: "uncertain", reason: "no_speech" };
  return null;
}

/**
 * The next way to explain, after `used` (a Set of "hints" | "pictures" |
 * "guided" | "worked"): pictures when the sum can be drawn, then step by step
 * when there are several hints, then the worked example. Never the same one twice.
 */
export function nextStrategy({ canPicture, hintCount, hasWorked, used }) {
  if (canPicture && !used.has("pictures")) return "pictures";
  if (hintCount > 1 && !used.has("guided")) return "guided";
  if (hintCount > 0 && !used.has("hints")) return "hints";
  if (hasWorked && !used.has("worked")) return "worked";
  return null;
}

/**
 * Whether an answer counts as right first time for the learning engine
 * (`firstTry` in the outcome): no earlier miss on the card, not answered after
 * a miss, and no wrong tries inside the widget on the way (`pieceMisses`: a
 * match-the-pairs board that only finishes once every pair is right).
 * A right answer that is not a first try is still right, it just weighs less
 * ("assisted" in the engine).
 */
export function isFirstTry({ cardMisses = 0, afterMiss = false, pieceMisses = 0 } = {}) {
  return !(cardMisses > 0) && !afterMiss && !(pieceMisses > 0);
}

/** The support step to report to the server for what was actually shown. */
export function supportStepShown(used) {
  if (used.has("guided")) return 2;
  if (used.has("pictures") || used.has("worked")) return 1;
  if (used.has("hints")) return 0;
  return null;
}

// Server messages added after the locale files were written (services/learning/feedback.js).
// Until a language has its own words for one, it says the nearest older message it does
// have, in its own words: never an English sentence in the middle of a French page.
const OLDER_MESSAGE = {
  warriorNotScored: "sharedIdea", warriorOpen: "sharedIdea",
  closeCapitals: "closeGeneric", closePunctuation: "closeGeneric", closeCapitalsPunctuation: "closeGeneric",
};

/**
 * The server's personalised message ({ key, params, text }) as the arguments
 * for t(): ["learn.feedback.<key>", options]. Skill params ({ id, name }) are
 * turned into the skill's translated name by `skillName(id, name)`.
 */
export function messageArgs(message, skillName = (id, name) => name, own = null) {
  if (!message || typeof message !== "object" || !message.key) return null;
  const params = {};
  for (const [k, v] of Object.entries(message.params || {})) {
    params[k] = v && typeof v === "object" && "id" in v ? skillName(v.id, v.name || v.id) : v;
  }
  // A message newer than this language's words: the nearest older one it does have.
  const older = OLDER_MESSAGE[message.key];
  if (own && older && !own(`learn.feedback.${message.key}`) && own(`learn.feedback.${older}`)) return [`learn.feedback.${older}`, params];
  return [`learn.feedback.${message.key}`, { ...params, defaultValue: message.text || "" }];
}

/** True when audio_text is a hidden stimulus (hearing it is the task), not text shown on the card. */
export function isHiddenAudio(question) {
  const a = lower(question?.audio_text);
  if (!a) return false;
  const shown = `${lower(question?.instruction)} ${lower(question?.prompt)}`;
  return !shown.includes(a);
}

/**
 * The item's own spoken script (question.narration, contract §1), or null.
 * It is used only when it is in the language of the words on the card (the
 * server sends it in the chosen language): an English script on a translated
 * card would be the wrong language, so the card is read as before instead.
 * { text, lang }
 */
export function scriptOf(question) {
  const n = question?.narration;
  const text = typeof n?.text === "string" ? n.text.trim() : "";
  if (!text) return null;
  const cardLang = String(question.lang || "en").split("-")[0].toLowerCase();
  const own = typeof n.lang === "string" && n.lang ? n.lang.split("-")[0].toLowerCase() : null;
  // English scripts are written per item ("authored"); other languages are built ("templated").
  const lang = own || (n.status === "authored" ? "en" : cardLang);
  return lang === cardLang ? { text, lang } : null;
}
