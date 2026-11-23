// The site's one narrator. Everything that reads aloud (questions, hints,
// feedback, worked examples, encouragement, the Home greeting, the camera
// games' instructions) speaks through here, in the same natural voice as the
// AI teacher:
//
//  1. the server's neural voice (Supertonic, GET /api/ai-assistant/tts), for
//     every language it speaks, one sentence at a time (the server caches each
//     sentence, and the next ones are fetched while this one plays). A slow
//     sentence is waited for, and a failed one is asked for again: the site
//     never switches to a robotic voice just because the server was busy;
//  2. only when that voice cannot be had (no voice server, the server is
//     unreachable, or a language it lacks such as Chinese), the browser's most
//     natural voice for the language: "Natural"/"Neural"/"Online"/"Premium"
//     voices first;
//  3. no voice at all: nothing is said, but the words still go to the
//     captions (components/VoiceBar) and nothing waits for them.
//
// Maths is made speakable first (utils/speakMath.js: "7 − 2 = ?" is said
// "seven minus two equals what?"), and text is said a sentence at a time with
// short natural pauses between sentences and a longer one between parts
// (narrate([instruction, question])).
//
// Only one thing ever speaks: a new narration stops the one before (or waits
// for it, with `queue: true`).
//
// The learner's settings (utils/learnerPrefs.js):
//  - voiceRate: the speed, unless the caller passes `rate`;
//  - voice: when OFF the teacher never speaks on her own. Only narrations the
//    learner asked for by pressing something (`user: true`: a Listen / Read to
//    me / Replay button) are spoken. Everything else resolves false at once.
//
// Same origin: production serves /api from the same host, and Vite proxies it
// in development.
import { getPrefs } from "./learnerPrefs";
import { speakMath, splitSentences } from "./speakMath";

export { splitSentences };

const TTS_URL = "/api/ai-assistant/tts";
// Supertonic's languages (server/ai-assistant/lib/speech.mjs VOICE_LANGS).
const SERVER_LANGS = new Set([
  "en", "ko", "ja", "ar", "bg", "cs", "da", "de", "el", "es", "et", "fi", "fr", "hi", "hr", "hu",
  "id", "it", "lt", "lv", "nl", "pl", "pt", "ro", "ru", "sk", "sl", "sv", "tr", "uk", "vi",
]);
// How long a sentence of the natural voice is waited for. A small server makes a
// sentence in 1-3 s, but a queue of other learners' sentences or a slow phone
// connection can take longer: waiting is better than a robotic voice.
const FIRST_WAIT_MS = 15000;
const NEXT_WAIT_MS = 15000;
const RETRY_SERVER_MS = 20000; // an unreachable voice server is tried again after this
const SERVER_TRIES = 2; // a sentence that fails (busy, timed out) is asked for once more
const SENTENCE_GAP_MS = 260; // a breath between sentences
const PART_GAP_MS = 520; // a longer pause between parts (instruction, then question)

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
let audio = null; // one element, unlocked by the first tap (iOS plays only those)
let serverDownUntil = 0; // the voice endpoint failed: skip it until then
const noServerLang = new Set(); // languages the server said it cannot speak
const listeners = new Set();
let job = null; // the narration now
let lastRequest = null; // for replay
let seq = 0;
// Bumped by every stop: a narration still waiting in the queue (`queue: true`)
// when the one before it was stopped never starts. Without this a page change,
// a language change or Stop would let the queued words speak on afterwards.
let epoch = 0;

function player() {
  if (!audio && typeof Audio !== "undefined") audio = new Audio();
  return audio;
}

// iOS Safari plays audio only from an element first played inside a tap.
// The first tap anywhere plays a moment of silence on the shared element.
if (typeof document !== "undefined") {
  const unlock = () => {
    const a = player();
    if (!a || job) return;
    a.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
    a.play().catch(() => {});
  };
  document.addEventListener("pointerdown", unlock, { once: true, capture: true });
}

// Browsers load their voice list late (Chrome fills it after the first
// "voiceschanged"); keep the latest list so the first sentence gets a real choice.
let voices = [];
function loadVoices() { try { voices = synth?.getVoices() || []; } catch { voices = []; } }
if (synth) {
  loadVoices();
  synth.addEventListener?.("voiceschanged", loadVoices);
}
const norm = (tag) => String(tag || "").toLowerCase().replace("_", "-");
// Novelty and robotic voices (macOS ships "Bells", "Zarvox"…) never read a lesson.
const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|compact|espeak|robot/;

// Chrome fills the list only after its first "voiceschanged": before deciding
// that a language has no voice, wait a moment for the list (once).
function voicesReady(ms = 800) {
  if (!synth) return Promise.resolve();
  if (!voices.length) loadVoices();
  if (voices.length) return Promise.resolve();
  return new Promise((resolve) => {
    let t = 0;
    const done = () => {
      clearTimeout(t);
      try { synth.removeEventListener?.("voiceschanged", done); } catch { /* old browser */ }
      loadVoices();
      resolve();
    };
    t = setTimeout(done, ms);
    try { synth.addEventListener?.("voiceschanged", done); } catch { /* old browser */ }
  });
}

// The most natural installed voice that speaks this language, or null. A voice
// of another language is never used: a wrong voice reads the words in its own
// accent, which sounds like another language altogether.
function browserVoice(lang) {
  if (!synth) return null;
  if (!voices.length) loadVoices();
  const want = norm(lang);
  const base = want.split("-")[0];
  const all = voices.filter((v) => norm(v.lang).split("-")[0] === base && !NOVELTY.test(v.name.toLowerCase()));
  const rank = (v) => {
    const name = v.name.toLowerCase();
    let r = 0;
    if (norm(v.lang) === want) r -= 3; // the same country's accent first
    if (/natural|neural|premium|enhanced|online/.test(name)) r -= 2;
    if (/google|siri|samantha|serena|daniel|karen|moira|aria|jenny|libby|sonia|amelie|thomas|anna|helena|monica|paulina|luciana/.test(name)) r -= 1;
    if (v.localService === false) r += 0.5; // network voices can be slow to start
    return r;
  };
  return all.sort((a, b) => rank(a) - rank(b))[0] || null;
}

/* ── Events (captions, the voice bar, ducking other sounds) ─────────────── */

/**
 * Calls fn(event) as narration happens; returns an unsubscribe function.
 * event.type: "start" | "sentence" | "pause" | "resume" | "end" | "unavailable".
 * "sentence" carries { text (as written, for captions), index, total, source:
 * "server" | "browser" | "none" }; "end" carries { ok }; "unavailable" carries
 * { lang, id }: this device has no voice for that language (and the server
 * voice is not there), so nothing is said and the words are only shown.
 */
export function onNarration(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit(evt) {
  listeners.forEach((fn) => { try { fn(evt); } catch { /* a listener failed */ } });
}

/** What the narrator is doing now (for components that mount mid-sentence). */
export function getNarrationState() {
  if (!job || job.done) return { speaking: false, paused: false, sentence: "", text: "", canReplay: Boolean(lastRequest) };
  const seg = job.segments[job.index];
  return { speaking: true, paused: job.paused, sentence: job.caption ? seg?.show || "" : "", text: job.caption ? job.text : "", caption: job.caption, source: job.source, canReplay: true };
}

/* ── The server voice ───────────────────────────────────────────────────── */

// `${lang}|${speed}|${text}` -> { p: Promise<Blob>, warm, settled }
// priority "warm": fetched ahead of time (the server makes it after the
// sentences someone is waiting for); "live": a learner is waiting for it now.
const clips = new Map();
function requestClip(text, lang, speed, waitMs, priority) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), waitMs);
  const q = { text: text.slice(0, 600), lang, speed };
  if (priority === "warm") q.priority = "warm";
  return (async () => {
    try {
      const r = await fetch(`${TTS_URL}?${new URLSearchParams(q)}`, { signal: ctrl.signal });
      if (!r.ok) {
        const err = new Error(`voice ${r.status}`);
        err.status = r.status;
        throw err;
      }
      const blob = await r.blob();
      if (!blob.size) throw new Error("empty voice");
      return blob;
    } catch (err) {
      if (err?.name === "AbortError") err.timedOut = true;
      throw err;
    } finally {
      clearTimeout(timer);
    }
  })();
}
function fetchClip(text, lang, speed, signal, waitMs, priority = "live") {
  const key = `${lang}|${speed}|${text}`;
  const had = clips.get(key);
  // A sentence fetched ahead of time and not here yet, now needed: ask for it
  // live too (the server then makes it next instead of after the warm-up queue).
  if (!had || (had.warm && !had.settled && priority === "live")) {
    const entry = { p: requestClip(text, lang, speed, waitMs, priority), warm: priority === "warm", settled: false };
    entry.p.then(() => { entry.settled = true; }, () => { if (clips.get(key) === entry) clips.delete(key); });
    clips.set(key, entry);
    if (clips.size > 60) clips.delete(clips.keys().next().value);
  }
  const p = clips.get(key).p;
  if (!signal) return p;
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(Object.assign(new Error("stopped"), { stopped: true }));
    if (signal.aborted) return onAbort();
    signal.addEventListener("abort", onAbort, { once: true });
    p.then(resolve, reject);
  });
}

function serverUsable(lang) {
  return Date.now() >= serverDownUntil && SERVER_LANGS.has(lang) && !noServerLang.has(lang) && Boolean(player());
}

// A failure the next try will not fix: the language has no server voice (422),
// there is no voice server here (404: a static build; 503: the server makes no
// voice), or the server cannot be reached at all.
function lastingFailure(err) {
  return err?.status === 422 || err?.status === 404 || err?.status === 503 || (!err?.status && !err?.timedOut);
}

function noteServerFailure(err, lang) {
  if (err?.stopped) return;
  if (err?.status === 422) noServerLang.add(lang);
  else if (err?.status === 404) serverDownUntil = Infinity; // no voice server here (a static build)
  else serverDownUntil = Date.now() + RETRY_SERVER_MS; // down or unreachable
}

/* ── One narration ──────────────────────────────────────────────────────── */

function sleep(ms, j) {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    j.wakers.push(() => { clearTimeout(t); resolve(); });
  });
}

function waitWhilePaused(j) {
  if (!j.paused || j.stopped) return Promise.resolve();
  return new Promise((resolve) => j.resumers.push(resolve));
}

function playClip(j, blob) {
  return new Promise((resolve) => {
    const a = player();
    const url = URL.createObjectURL(blob);
    let ended = false;
    const end = (result) => {
      if (ended) return;
      ended = true;
      URL.revokeObjectURL(url);
      a.onended = null;
      a.onerror = null;
      j.current = null;
      resolve(result);
    };
    j.current = {
      pause: () => a.pause(),
      resume: () => a.play().catch(() => end("error")),
      stop: () => { a.pause(); end("stopped"); },
    };
    a.onended = () => end("ok");
    a.onerror = () => end("error");
    a.src = url;
    if (j.volume != null) a.volume = Math.min(1, Math.max(0, j.volume));
    else a.volume = 1;
    a.playbackRate = 1;
    // The browser may refuse sound before the learner has tapped anything on
    // the page (autoplay rules): that is "blocked", not a reason for another voice.
    a.play().catch((err) => end(err?.name === "NotAllowedError" ? "blocked" : "error"));
  });
}

function utter(j, text) {
  return new Promise((resolve) => {
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") return resolve("none");
    // Only ever a voice of the text's language (saySegment checked there is one).
    const v = browserVoice(j.lang);
    if (!v) return resolve("none");
    const u = new SpeechSynthesisUtterance(text);
    u.voice = v;
    u.lang = v.lang || j.lang;
    u.rate = j.rate;
    u.pitch = j.pitch;
    if (j.volume != null) u.volume = j.volume;
    // Chrome pauses long speech after ~15 s unless nudged; Safari sometimes
    // never says it finished. Neither may leave the caller waiting.
    const nudge = setInterval(() => { if (synth.speaking && !j.paused) { synth.pause(); synth.resume(); } }, 10000);
    const guard = setTimeout(() => finish("ok"), 2500 + (text.length * 110) / Math.max(0.5, j.rate));
    let ended = false;
    function finish(result) {
      if (ended) return;
      ended = true;
      clearInterval(nudge);
      clearTimeout(guard);
      j.current = null;
      resolve(result);
    }
    u.onend = () => finish("ok");
    u.onerror = (e) => finish(e.error === "interrupted" || e.error === "canceled" ? "cancel" : "error");
    j.current = {
      // A paused browser voice is cancelled and the sentence said again on
      // resume: synth.pause() is unreliable on Android and Safari.
      pause: () => { try { synth.cancel(); } catch { /* nothing to stop */ } finish("cancel"); },
      resume: () => {},
      stop: () => { try { synth.cancel(); } catch { /* nothing to stop */ } finish("stopped"); },
    };
    try { synth.speak(u); } catch { finish("error"); }
  });
}

async function saySegment(j, seg, i) {
  for (;;) {
    if (j.stopped) return "stopped";
    await waitWhilePaused(j);
    if (j.stopped) return "stopped";
    // The natural voice for every sentence it can say (one sentence that had to
    // fall back does not make the rest robotic).
    let lastErr = null;
    for (let attempt = 0; attempt < SERVER_TRIES && serverUsable(j.short); attempt += 1) {
      try {
        const blob = await fetchClip(seg.say, j.short, j.speed, j.ctrl.signal, i === 0 ? FIRST_WAIT_MS : NEXT_WAIT_MS);
        if (j.stopped) return "stopped";
        // While this sentence plays, the next one is fetched (the one after it at low priority).
        const next = j.segments[i + 1];
        if (next) fetchClip(next.say, j.short, j.speed, null, NEXT_WAIT_MS).catch(() => {});
        const after = j.segments[i + 2];
        if (after) fetchClip(after.say, j.short, j.speed, null, NEXT_WAIT_MS, "warm").catch(() => {});
        if (j.source && j.source !== "server") j.mixed = true;
        j.source = "server";
        emitSentence(j, seg, i);
        const r = await playClip(j, blob);
        if (r === "ok" || r === "stopped") return r;
        // Sound not allowed yet (nothing tapped on this page): say nothing rather
        // than switch to a robotic voice; the learner can press Listen / Replay.
        if (r === "blocked") {
          j.blocked = true;
          emit({ type: "blocked", id: j.id });
          return "blocked";
        }
        lastErr = { status: 0, timedOut: true }; // a broken clip: ask once more
      } catch (err) {
        if (err?.stopped || j.stopped) return "stopped";
        lastErr = err;
        if (lastingFailure(err)) break;
      }
    }
    if (lastErr) noteServerFailure(lastErr, j.short);
    if (j.source === "server") j.mixed = true;
    // The browser's voice, but only one that speaks this language. Without one
    // nothing is said (some browsers would read it in their default voice, in
    // another language): the words go to the captions, and listeners hear
    // "unavailable" once so they can say why.
    if (synth) await voicesReady();
    if (j.stopped) return "stopped";
    j.source = synth && browserVoice(j.lang) ? "browser" : "none";
    if (j.source === "none" && !j.warnedNoVoice) {
      j.warnedNoVoice = true;
      j.onNoVoice?.();
      emit({ type: "unavailable", lang: j.lang, id: j.id });
    }
    emitSentence(j, seg, i);
    if (j.source === "none") return "none";
    const r = await utter(j, seg.say);
    if (r === "cancel" && j.paused && !j.stopped) continue; // paused: say it again on resume
    if (r === "cancel") return j.stopped ? "stopped" : "ok";
    return r === "none" ? "none" : r === "error" ? "error" : r;
  }
}

function emitSentence(j, seg, i) {
  if (j.shown === i) return;
  j.shown = i;
  if (!j.startedEmitted) {
    j.startedEmitted = true;
    j.onStart?.();
  }
  emit({ type: "sentence", text: j.caption ? seg.show : "", caption: j.caption, index: i, total: j.segments.length, source: j.source, id: j.id });
}

async function run(j) {
  emit({ type: "start", text: j.caption ? j.text : "", caption: j.caption, id: j.id, total: j.segments.length });
  let ok = true;
  let anySpoken = false;
  for (let i = 0; i < j.segments.length; i += 1) {
    j.index = i;
    const r = await saySegment(j, j.segments[i], i);
    if (r === "stopped" || j.stopped) { ok = false; break; }
    if (r === "blocked") { ok = false; break; } // no sound allowed yet: the rest would be blocked too
    if (r === "ok") anySpoken = true;
    if (r === "error") ok = false;
    if (r === "none") { ok = false; continue; }
    const gap = j.segments[i].gapAfter;
    if (gap && i < j.segments.length - 1) {
      await sleep(gap, j);
      await waitWhilePaused(j);
    }
  }
  return ok && anySpoken;
}

/** Stops whatever the narrator is saying. */
export function stopNarration() {
  epoch += 1;
  const j = job;
  if (!j || j.done) return;
  j.stopped = true;
  j.paused = false;
  try { j.ctrl.abort(); } catch { /* already */ }
  j.current?.stop();
  j.wakers.splice(0).forEach((w) => w());
  j.resumers.splice(0).forEach((w) => w());
  try { if (j.source === "browser") synth?.cancel(); } catch { /* nothing to stop */ }
}

/** Pauses the narration where it is (resumeNarration carries on). */
export function pauseNarration() {
  const j = job;
  if (!j || j.done || j.paused) return false;
  j.paused = true;
  j.current?.pause();
  emit({ type: "pause", id: j.id });
  return true;
}

/** Carries on after pauseNarration. */
export function resumeNarration() {
  const j = job;
  if (!j || j.done || !j.paused) return false;
  j.paused = false;
  j.current?.resume();
  j.resumers.splice(0).forEach((w) => w());
  emit({ type: "resume", id: j.id });
  return true;
}

/** Says the last narration again (a learner pressed Replay). */
export function replayNarration() {
  if (!lastRequest) return Promise.resolve(false);
  return narrate(lastRequest.input, { ...lastRequest.opts, user: true });
}

/** True when there is something to replay. */
export function canReplay() { return Boolean(lastRequest); }

function buildSegments(input, lang, math) {
  const parts = (Array.isArray(input) ? input : [input]).map((p) => String(p ?? "").trim()).filter(Boolean);
  const segs = [];
  parts.forEach((part, pi) => {
    const sentences = splitSentences(part);
    sentences.forEach((show, si) => {
      const say = math ? speakMath(show, lang) : show.replace(/\s+/g, " ").trim();
      if (!say || !/[\p{L}\p{N}]/u.test(say)) return;
      const lastOfPart = si === sentences.length - 1;
      segs.push({ show, say, gapAfter: lastOfPart ? (pi < parts.length - 1 ? PART_GAP_MS : 0) : SENTENCE_GAP_MS });
    });
  });
  return segs;
}

/**
 * Says `text` (a string, or an array of parts said with a pause between them)
 * and resolves with true when it was heard to the end (false if stopped, not
 * allowed by the learner's voice setting, or there was no voice).
 *
 * @param {string|string[]} text
 * @param {{lang?: string, rate?: number, pitch?: number, volume?: number,
 *   user?: boolean, queue?: boolean, math?: boolean, caption?: boolean,
 *   onStart?: Function, onEnd?: Function, onError?: Function, onNoVoice?: Function}} opts
 *   user: the learner pressed something to hear this (spoken even with the voice setting off).
 *   queue: wait for the current narration to finish instead of stopping it.
 *   math: make maths speakable first (default true).
 *   caption: false keeps the words out of the captions (a listening task's
 *     hidden text: hearing it is the exercise).
 */
export function narrate(text, opts = {}) {
  const prefs = getPrefs();
  const { lang = "en-US", rate = prefs.voiceRate ?? 0.9, pitch = 1, volume, user = false, queue = false, math = true } = opts;
  if (!prefs.voice && !user) return Promise.resolve(false);
  const short = String(lang).slice(0, 2).toLowerCase();
  const segments = buildSegments(text, short, math);
  if (!segments.length) return Promise.resolve(false);
  lastRequest = { input: text, opts: { ...opts, onStart: undefined, onEnd: undefined, onError: undefined } };

  const start = () => {
    const j = {
      id: ++seq,
      text: Array.isArray(text) ? text.filter(Boolean).join(" ") : String(text),
      segments, index: 0, shown: -1, lang, short, rate, pitch, volume,
      speed: Math.min(1.3, Math.max(0.7, rate)).toFixed(2),
      source: null, paused: false, stopped: false, done: false,
      ctrl: new AbortController(), wakers: [], resumers: [], current: null,
      onStart: opts.onStart, onNoVoice: opts.onNoVoice, caption: opts.caption !== false,
    };
    job = j;
    return run(j).then((ok) => {
      j.done = true;
      if (job === j) job = null;
      emit({ type: "end", ok, id: j.id, source: j.source, text: j.caption ? j.text : "", caption: j.caption });
      if (ok) opts.onEnd?.();
      else if (j.stopped || j.blocked) opts.onEnd?.();
      else opts.onError?.(new Error(j.source === "none" ? "no voice" : "speech failed"));
      return ok;
    });
  };

  if (queue && job && !job.done) {
    const before = job;
    const mine = epoch;
    return new Promise((resolve) => {
      const off = onNarration((e) => {
        if (e.type !== "end" || e.id !== before.id) return;
        off();
        // Stopped (or replaced) while waiting: say nothing.
        if (epoch !== mine) { resolve(false); return; }
        resolve(start());
      });
    });
  }
  stopNarration();
  return start();
}

/** Fetches the server voice for text ahead of time (so a later narrate starts at once). */
export function preloadNarration(text, { lang = "en-US", rate, math = true } = {}) {
  const prefs = getPrefs();
  const short = String(lang).slice(0, 2).toLowerCase();
  if (!serverUsable(short)) return;
  const speed = Math.min(1.3, Math.max(0.7, rate ?? prefs.voiceRate ?? 0.9)).toFixed(2);
  buildSegments(text, short, math).slice(0, 3).forEach((s) => fetchClip(s.say, short, speed, null, NEXT_WAIT_MS, "warm").catch(() => {}));
}

/** True while the narrator is talking (or paused mid-way). */
export function isNarrating() {
  return Boolean(job && !job.done && !job.stopped);
}

/** True while a narration is paused. */
export function isNarrationPaused() {
  return Boolean(job && !job.done && job.paused);
}
