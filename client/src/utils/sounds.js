// The site's sound palette. Every sound is made in the browser (Web Audio), so
// each one can match what happens on screen: a soft wooden "tock" when a
// button is pressed, a rising whoosh when a page slides in, a falling one when
// you go back, a sparkle when a star lands, a gentle tick-tock for the Warrior
// clock. Soft, rounded tones only: the site is for children, many with
// learning differences, so nothing is sharp, loud or sudden.
//
//   import { sfx, haptic } from "../utils/sounds";
//   sfx.select();            // a choice is made
//   haptic("success");       // and the phone answers with a little buzz
//
// Buttons and links get a sound by themselves (installUiSounds, below):
// `data-sound="tap|select|toggle|tab|open|close|forward|back|none"` on an
// element (or an ancestor) picks it; otherwise it follows the element's role.
// A component that plays its own sound in its click handler wins over that.

const STORE_KEY = "learnigo_sound"; // "off" mutes every effect (not the voice)
const MASTER = 0.32;

let ctx = null;
let master = null;
let unlocked = false;
let pendingIntro = false;
let lastExplicit = 0; // when a component last played a sound itself
let lastNav = 0; // when a navigation sound last played

function enabled() {
  try { return localStorage.getItem(STORE_KEY) !== "off"; } catch { return true; }
}

export function isSoundEnabled() { return enabled(); }
export function setSoundEnabled(on) {
  try { localStorage.setItem(STORE_KEY, on ? "on" : "off"); } catch { /* private mode */ }
}

function audio() {
  if (ctx) return ctx;
  const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return null;
  ctx = new AC({ latencyHint: "interactive" });
  // Soft top end and a gentle limiter: rounded, never harsh, never clipping.
  const soften = ctx.createBiquadFilter();
  soften.type = "lowpass";
  soften.frequency.value = 7000;
  const limit = ctx.createDynamicsCompressor();
  limit.threshold.value = -14;
  limit.knee.value = 8;
  limit.ratio.value = 6;
  master = ctx.createGain();
  master.gain.value = MASTER;
  master.connect(soften).connect(limit).connect(ctx.destination);
  return ctx;
}

// Browsers keep sound off until the first tap or key. Unlock then, and play
// the intro chime if the page asked for it before it was allowed.
if (typeof document !== "undefined") {
  const unlock = () => {
    const c = audio();
    if (!c) return;
    c.resume().then(() => {
      unlocked = true;
      if (pendingIntro) { pendingIntro = false; sfx.welcome(); }
    }).catch(() => {});
  };
  for (const ev of ["pointerdown", "keydown", "touchstart"]) document.addEventListener(ev, unlock, { capture: true, passive: true });
  // A hidden tab makes no sound and does not keep the audio device busy.
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend().catch(() => {});
    else if (unlocked) ctx.resume().catch(() => {});
  });
}

function ready() {
  if (!enabled()) return null;
  const c = audio();
  if (!c || c.state !== "running") return null;
  return c;
}

// One soft note: a sine (or triangle) with a quick rise and a smooth fall,
// optionally gliding to another pitch.
function note(c, freq, { at = 0, dur = 0.18, gain = 0.5, type = "sine", attack = 0.006, glide, detune = 0, pan = 0 } = {}) {
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur * 0.9);
  o.detune.value = detune;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let out = g;
  if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
  o.connect(g);
  out.connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

// A mallet (marimba-like): the note plus a quick, quiet overtone.
function mallet(c, freq, opts = {}) {
  note(c, freq, { dur: 0.32, ...opts });
  note(c, freq * 3.98, { ...opts, gain: (opts.gain ?? 0.5) * 0.18, dur: 0.07 });
}

// Filtered noise that sweeps: a whoosh up (into something) or down (out of it).
function whoosh(c, { at = 0, dur = 0.32, from = 300, to = 2400, gain = 0.22, q = 1.2 } = {}) {
  const t = c.currentTime + at;
  const len = Math.ceil(c.sampleRate * (dur + 0.05));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = q;
  bp.frequency.setValueAtTime(from, t);
  bp.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.45);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp).connect(g).connect(master);
  src.start(t);
  src.stop(t + dur + 0.05);
}

// A wooden tick: a very short knock (for clocks and toggles).
function knock(c, freq, { at = 0, gain = 0.35 } = {}) {
  note(c, freq, { at, dur: 0.05, gain, type: "triangle", attack: 0.002, glide: freq * 0.7 });
  note(c, freq * 2.7, { at, dur: 0.025, gain: gain * 0.25, attack: 0.001 });
}

// Notes of a bright major scale (C major, from C5).
const N = { C4: 261.63, E4: 329.63, G4: 392, A4: 440, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, D6: 1174.66, E6: 1318.5, G6: 1568 };

function play(fn, explicit = true) {
  const c = ready();
  if (explicit) lastExplicit = performance.now();
  if (!c) return;
  try { fn(c); } catch { /* sound is never worth an error */ }
}

export const sfx = {
  /** A plain press: a soft wooden tock. */
  tap: () => play((c) => mallet(c, N.C6, { gain: 0.28, dur: 0.12 })),
  /** A choice made (an answer, a card, a submit): two notes going up. */
  select: () => play((c) => { mallet(c, N.E5, { gain: 0.32 }); mallet(c, N.B5, { at: 0.06, gain: 0.28 }); }),
  /** A switch flips: a tiny click, higher when it turns on. */
  toggle: (on = true) => play((c) => knock(c, on ? 1400 : 1000, { gain: 0.3 })),
  /** A tab or a segment: a light pluck. */
  tab: () => play((c) => note(c, N.A5, { dur: 0.1, gain: 0.26, type: "triangle", glide: N.G5 })),
  /** A panel, menu or dialog opens: a short rising breath and a chime. */
  open: () => play((c) => { whoosh(c, { dur: 0.22, from: 500, to: 2600, gain: 0.12 }); mallet(c, N.G5, { at: 0.1, gain: 0.2 }); }),
  /** It closes: the breath falls away. */
  close: () => play((c) => { whoosh(c, { dur: 0.2, from: 2200, to: 400, gain: 0.1 }); note(c, N.D5, { at: 0.06, dur: 0.12, gain: 0.14, type: "triangle" }); }),
  /** Going into something (a new page, a game): a whoosh up and a bright note. */
  forward: () => play((c) => { lastNav = performance.now(); whoosh(c, { dur: 0.3, from: 300, to: 2000, gain: 0.16 }); mallet(c, N.G5, { at: 0.16, gain: 0.22 }); }),
  /** Going back: the whoosh goes down and the note is lower. */
  back: () => play((c) => { lastNav = performance.now(); whoosh(c, { dur: 0.3, from: 1800, to: 300, gain: 0.14 }); mallet(c, N.C5, { at: 0.14, gain: 0.2 }); }),
  /** A page changes on its own (no button): just the air moving. */
  whoosh: () => play((c) => { lastNav = performance.now(); whoosh(c, { dur: 0.34, from: 260, to: 1600, gain: 0.13 }); }),
  /** Right answer: a sparkling arpeggio up. */
  correct: () => play((c) => { [N.C6, N.E6, N.G6].forEach((f, i) => mallet(c, f, { at: i * 0.075, gain: 0.3 })); note(c, 3136, { at: 0.24, dur: 0.25, gain: 0.06 }); }),
  /** Not quite: two soft, low notes going down. Kind, not a buzzer. */
  wrong: () => play((c) => { note(c, N.G4, { dur: 0.16, gain: 0.3, type: "triangle" }); note(c, N.E4, { at: 0.14, dur: 0.24, gain: 0.26, type: "triangle" }); }),
  /** A star or a coin lands. */
  star: () => play((c) => { [N.E6, N.G6, 2093].forEach((f, i) => note(c, f, { at: i * 0.05, dur: 0.22, gain: 0.16, pan: (i - 1) * 0.4 })); }),
  /** A round or a level finished: a small fanfare. */
  levelUp: () => play((c) => { [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => mallet(c, f, { at: i * 0.11, gain: 0.3 })); note(c, N.E6, { at: 0.44, dur: 0.6, gain: 0.12 }); note(c, N.G6, { at: 0.5, dur: 0.6, gain: 0.08 }); }),
  /** Something new to look at (a message, a request). */
  notify: () => play((c) => { mallet(c, N.A5, { gain: 0.24 }); mallet(c, N.E6, { at: 0.12, gain: 0.2 }); }),
  /** Something went wrong (not an answer: a form or a network problem). */
  error: () => play((c) => { note(c, 220, { dur: 0.16, gain: 0.3, type: "triangle", glide: 180 }); }),
  /** A bubble appears (a card, a hint). */
  pop: () => play((c) => note(c, 900, { dur: 0.08, gain: 0.22, glide: 380 })),
  /**
   * The Warrior clock: tick-tock, a little brighter and closer in the last
   * seconds. `left` is the seconds remaining.
   */
  tick: (left = 10) => play((c) => {
    const urgent = left <= 5;
    knock(c, left % 2 ? 1250 : 980, { gain: urgent ? 0.34 : 0.16 });
    if (urgent) note(c, left % 2 ? N.E6 : N.C6, { at: 0.01, dur: 0.07, gain: 0.07 });
  }, false),
  /** Time is up: three soft notes going down, like a music box winding down. */
  timeUp: () => play((c) => { [N.G5, N.E5, N.C5].forEach((f, i) => mallet(c, f, { at: i * 0.14, gain: 0.26 })); }),
  /** Typing a key: barely there. */
  type: () => play((c) => knock(c, 1800, { gain: 0.06 }), false),
  /** The site waking up while it loads: a soft rising shimmer. */
  loadStart: () => {
    if (!ready()) { pendingIntro = true; return; }
    play((c) => { [N.C5, N.G5, N.E6].forEach((f, i) => note(c, f, { at: i * 0.12, dur: 1.1 - i * 0.1, gain: 0.1, attack: 0.25, pan: (i - 1) * 0.5 })); whoosh(c, { dur: 0.9, from: 200, to: 1200, gain: 0.06, q: 0.7 }); });
  },
  /** Loaded and welcome: a small magic "ta-da". */
  welcome: () => play((c) => { [N.C5, N.G5, N.C6, N.E6].forEach((f, i) => mallet(c, f, { at: i * 0.09, gain: 0.26, pan: (i - 1.5) * 0.3 })); [2637, 3136, 3520].forEach((f, i) => note(c, f, { at: 0.38 + i * 0.06, dur: 0.3, gain: 0.05 })); }),
  /** Stepping inside (a role chosen, signed in): a door of light opening. */
  enter: () => play((c) => { lastNav = performance.now(); whoosh(c, { dur: 0.5, from: 250, to: 3000, gain: 0.14, q: 0.9 }); [N.C5, N.E5, N.G5].forEach((f) => note(c, f, { at: 0.18, dur: 0.7, gain: 0.1, attack: 0.08 })); mallet(c, N.C6, { at: 0.32, gain: 0.22 }); }),
};

// Old names, kept so nothing breaks.
export const playBtn = () => sfx.tap();
export const playSlide = () => sfx.forward();
export const playCorrect = () => sfx.correct();
export const playWrong = () => sfx.wrong();

/** True when a navigation sound (forward/back/enter/whoosh) played in the last `ms`. */
export function navSoundWithin(ms = 600) { return performance.now() - lastNav < ms; }

const VIBES = { light: 8, tap: 8, select: 12, tick: 6, success: [12, 50, 18], error: [28, 40, 28], warn: [18, 60, 18] };
/** A little buzz on phones that have one (ignored elsewhere and when sound is off). */
export function haptic(kind = "light") {
  if (!enabled()) return;
  try { navigator.vibrate?.(VIBES[kind] ?? 8); } catch { /* not supported */ }
}

// The sound a pressed element makes when its component does not choose one.
function inferred(el) {
  const tag = el.tagName;
  const role = el.getAttribute("role");
  const label = `${el.getAttribute("aria-label") || ""} ${el.textContent || ""}`.trim().toLowerCase().slice(0, 40);
  if (role === "tab" || el.hasAttribute("aria-selected")) return "tab";
  if (role === "switch" || role === "checkbox" || role === "radio" || (tag === "INPUT" && /checkbox|radio/.test(el.type))) return "toggle";
  if (/^(close|cancel|dismiss|×|✕)\b|\bclose\b/.test(label)) return "close";
  if (/^(back|previous|←)\b|\bgo back\b/.test(label)) return "back";
  if (el.getAttribute("aria-haspopup") || el.getAttribute("aria-expanded") === "false") return "open";
  if (el.getAttribute("aria-expanded") === "true") return "close";
  if (tag === "A" && el.getAttribute("href") && !el.getAttribute("href").startsWith("#")) return "forward";
  if (el.type === "submit") return "select";
  return "tap";
}

let installed = false;
/**
 * Gives every button, link, tab and switch a sound that fits what it does.
 * Call once at start-up.
 */
export function installUiSounds() {
  if (installed || typeof document === "undefined") return;
  installed = true;
  document.addEventListener("click", (e) => {
    const el = e.target?.closest?.("button, a[href], [role=button], [role=tab], [role=switch], [role=checkbox], [role=radio], [role=menuitem], input[type=checkbox], input[type=radio], summary, [data-sound]");
    if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return;
    const chosen = el.closest("[data-sound]")?.getAttribute("data-sound");
    if (chosen === "none") return;
    const at = performance.now();
    // After the click has run: the component's own sound, if it played one, wins.
    setTimeout(() => {
      if (lastExplicit >= at) return;
      const kind = chosen || inferred(el);
      (sfx[kind] || sfx.tap)();
      if (kind === "forward" || kind === "back") lastNav = performance.now();
      haptic(kind === "select" ? "select" : "light");
    }, 0);
  }, true);
}
