// The site's one narrator. Everything that reads aloud (question "Listen"
// buttons, the Home greeting, the camera games' instructions) speaks through
// here, in the same natural voice as the AI teacher:
//
//  1. the server's neural voice (Supertonic, GET /api/ai-assistant/tts), for
//     every language it speaks — cached by sentence on the server, so a line
//     heard once comes back at once;
//  2. if that is not there (no server, a language it lacks such as Chinese, a
//     slow or failed request), the browser's most natural voice for the
//     language: "Natural"/"Neural"/"Online"/"Premium" voices first.
//
// Same origin: production serves /api from the same host, and Vite proxies it
// in development.
const TTS_URL = "/api/ai-assistant/tts";
// Supertonic's languages (server/ai-assistant/lib/speech.mjs VOICE_LANGS).
const SERVER_LANGS = new Set([
  "en", "ko", "ja", "ar", "bg", "cs", "da", "de", "el", "es", "et", "fi", "fr", "hi", "hr", "hu",
  "id", "it", "lt", "lv", "nl", "pl", "pt", "ro", "ru", "sk", "sl", "sv", "tr", "uk", "vi",
]);
const SERVER_WAIT_MS = 8000; // longer than this, and the browser's voice takes over
// Children listen best a little slower; the server keeps one cached version per speed.
const DEFAULT_RATE = 0.9;

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
let audio = null; // one element, unlocked by the first tap (iOS plays only those)
let current = null; // { stop } for what is being said now
let serverDown = false; // the voice endpoint failed: skip it until a reload

function player() {
  if (!audio && typeof Audio !== "undefined") audio = new Audio();
  return audio;
}

// iOS Safari plays audio only from an element first played inside a tap.
// The first tap anywhere plays a moment of silence on the shared element.
if (typeof document !== "undefined") {
  const unlock = () => {
    const a = player();
    if (!a) return;
    a.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
    a.play().catch(() => {});
  };
  document.addEventListener("pointerdown", unlock, { once: true, capture: true });
}

// The most natural installed voice for a language, or null.
function browserVoice(lang) {
  if (!synth) return null;
  const want = lang.toLowerCase();
  const base = want.split("-")[0];
  const all = synth.getVoices().filter((v) => v.lang?.toLowerCase().replace("_", "-").startsWith(base));
  const rank = (v) => {
    const name = v.name.toLowerCase();
    let r = 0;
    if (/natural|neural|premium|enhanced|online/.test(name)) r -= 4;
    if (/google|siri|samantha|serena|daniel|karen|moira|aria|jenny|libby|sonia|amelie|thomas|anna|helena|monica|paulina|luciana/.test(name)) r -= 2;
    if (v.lang?.toLowerCase().replace("_", "-") === want) r -= 1;
    if (/compact|espeak|robot/.test(name)) r += 5;
    return r;
  };
  return all.sort((a, b) => rank(a) - rank(b))[0] || null;
}

/** Stops whatever the narrator is saying. */
export function stopNarration() {
  current?.stop();
  current = null;
  try { synth?.cancel(); } catch { /* nothing to stop */ }
}

function speakWithBrowser(text, lang, { rate, pitch, volume }, done) {
  if (!synth) return done(false, new Error("no speech in this browser"));
  const u = new SpeechSynthesisUtterance(text);
  const v = browserVoice(lang);
  if (v) u.voice = v;
  u.lang = v?.lang || lang;
  u.rate = rate;
  u.pitch = pitch;
  if (volume != null) u.volume = volume;
  // Chrome pauses long speech after ~15 s unless nudged; Safari sometimes
  // never says it finished. Neither may leave the caller waiting.
  const nudge = setInterval(() => { if (synth.speaking) { synth.pause(); synth.resume(); } }, 10000);
  const guard = setTimeout(() => finish(true), 2000 + text.length * 120);
  let ended = false;
  const finish = (ok, err) => {
    if (ended) return;
    ended = true;
    clearInterval(nudge);
    clearTimeout(guard);
    done(ok, err);
  };
  u.onend = () => finish(true);
  u.onerror = (e) => finish(e.error === "interrupted" || e.error === "canceled", e);
  current = { stop: () => finish(false) };
  synth.speak(u);
  return !!v;
}

/**
 * Says `text` and resolves with true when it was heard to the end (false if
 * stopped or it failed). Callbacks: onStart, onEnd, onError, onNoVoice (no
 * voice at all for the language: the browser falls back to English).
 *
 * @param {string} text
 * @param {{lang?: string, rate?: number, pitch?: number, volume?: number,
 *   onStart?: Function, onEnd?: Function, onError?: Function, onNoVoice?: Function}} opts
 */
export function narrate(text, opts = {}) {
  const { lang = "en-US", rate = DEFAULT_RATE, pitch = 1, volume, onStart, onEnd, onError, onNoVoice } = opts;
  stopNarration();
  const say = String(text || "").trim();
  if (!say) return Promise.resolve(false);
  const short = lang.slice(0, 2).toLowerCase();

  return new Promise((resolve) => {
    let settled = false;
    const mine = {};
    const done = (ok, err) => {
      if (settled) return;
      settled = true;
      if (current === mine.handle) current = null;
      if (err && !ok) onError?.(err);
      else onEnd?.();
      resolve(ok);
    };
    const fallback = () => {
      if (settled) return;
      const found = speakWithBrowser(say, lang, { rate, pitch, volume }, done);
      mine.handle = current;
      if (found === false) onNoVoice?.();
      onStart?.();
    };

    if (serverDown || !SERVER_LANGS.has(short) || !player()) return fallback();

    const ctrl = new AbortController();
    let stopped = false;
    const a = player();
    current = mine.handle = {
      stop: () => {
        stopped = true;
        ctrl.abort();
        a.pause();
        done(false);
      },
    };
    const wait = setTimeout(() => ctrl.abort(), SERVER_WAIT_MS);
    const speed = Math.min(1.3, Math.max(0.7, rate)).toFixed(2);
    fetch(`${TTS_URL}?${new URLSearchParams({ text: say.slice(0, 600), lang: short, speed })}`, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) {
          if (r.status === 404) serverDown = true; // no voice server here (a static build)
          throw new Error(`voice ${r.status}`);
        }
        return r.blob();
      })
      .then((blob) => {
        clearTimeout(wait);
        if (stopped) return;
        const url = URL.createObjectURL(blob);
        const release = () => URL.revokeObjectURL(url);
        a.onended = () => { release(); done(true); };
        a.onerror = () => { release(); fallback(); };
        a.src = url;
        if (volume != null) a.volume = Math.min(1, volume);
        onStart?.();
        return a.play().catch(() => { release(); fallback(); });
      })
      .catch(() => {
        clearTimeout(wait);
        if (!stopped) fallback();
      });
  });
}

/** True while the narrator is talking. */
export function isNarrating() {
  return Boolean(current) && (!(audio?.paused ?? true) || Boolean(synth?.speaking));
}
