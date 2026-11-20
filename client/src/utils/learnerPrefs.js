// A learner's comfort settings: sounds, the teacher's voice, reading, motion,
// time and how to answer. One place for all of them, so the settings sheet,
// the parent/teacher "learning plan" and the code that applies them agree.
//
// No diagnosis is ever asked for. Presets are named by what they do, and any
// setting can be changed on its own. Stored in this browser (localStorage) and,
// when the learner is signed in, kept in their profile (`profile.supports`,
// GET/PUT /api/learn/profile) so it follows them to another device.
//
//   import { getPrefs, setPrefs, onPrefsChange, PREF_FIELDS, PRESETS } from "../utils/learnerPrefs";

const STORE_KEY = "learnigo_prefs";

// type: "bool" | "choice" | "range". `group` orders the settings sheet.
export const PREF_FIELDS = [
  // Sound and touch
  { key: "uiSounds", group: "sound", type: "bool", def: true },
  { key: "hoverSounds", group: "sound", type: "bool", def: true },
  { key: "soundVolume", group: "sound", type: "range", min: 0.2, max: 1, step: 0.1, def: 0.6 },
  { key: "haptics", group: "sound", type: "bool", def: true },
  // The teacher's voice
  { key: "voice", group: "voice", type: "bool", def: true },
  { key: "voiceRate", group: "voice", type: "range", min: 0.7, max: 1.2, step: 0.05, def: 0.9 },
  { key: "autoRead", group: "voice", type: "bool", def: false },
  { key: "captions", group: "voice", type: "bool", def: true },
  // Reading and seeing
  { key: "font", group: "reading", type: "choice", options: ["default", "readable", "dyslexic"], def: "default" },
  { key: "textScale", group: "reading", type: "range", min: 1, max: 1.5, step: 0.1, def: 1 },
  { key: "spacing", group: "reading", type: "choice", options: ["normal", "wide"], def: "normal" },
  { key: "contrast", group: "reading", type: "choice", options: ["normal", "high"], def: "normal" },
  // Movement and focus
  { key: "motion", group: "focus", type: "choice", options: ["system", "full", "reduced"], def: "system" },
  { key: "focusMode", group: "focus", type: "bool", def: false },
  { key: "bigTargets", group: "focus", type: "bool", def: false },
  // Time and answering
  { key: "timer", group: "time", type: "choice", options: ["on", "relaxed", "off"], def: "on" },
  { key: "breakEvery", group: "time", type: "choice", options: [0, 10, 15, 20, 30], def: 0 },
  { key: "speakInstead", group: "time", type: "choice", options: ["ask", "type", "choose"], def: "ask" },
];

export const DEFAULT_PREFS = Object.fromEntries(PREF_FIELDS.map((f) => [f.key, f.def]));

// One tap sets several settings; the learner can change any of them after.
export const PRESETS = {
  calm: { uiSounds: true, hoverSounds: false, soundVolume: 0.3, haptics: false, motion: "reduced", focusMode: true, timer: "off" },
  reading: { font: "readable", spacing: "wide", textScale: 1.2, autoRead: true, captions: true },
  focus: { focusMode: true, hoverSounds: false, motion: "reduced", breakEvery: 15 },
  captions: { captions: true, uiSounds: true, autoRead: false, speakInstead: "type" },
  bigger: { bigTargets: true, textScale: 1.2 },
  time: { timer: "off", breakEvery: 20 },
};

const listeners = new Set();
let cache = null;

function sanitize(raw) {
  const out = { ...DEFAULT_PREFS };
  if (!raw || typeof raw !== "object") return out;
  for (const f of PREF_FIELDS) {
    const v = raw[f.key];
    if (v === undefined) continue;
    if (f.type === "bool" && typeof v === "boolean") out[f.key] = v;
    else if (f.type === "range" && typeof v === "number" && Number.isFinite(v)) out[f.key] = Math.min(f.max, Math.max(f.min, v));
    else if (f.type === "choice" && f.options.includes(v)) out[f.key] = v;
  }
  return out;
}

// The navbar's old sound switch ("learnigo_sound" = "off") predates these
// settings: a learner who turned sounds off keeps them off.
const LEGACY_SOUND_KEY = "learnigo_sound";

/** The current settings (defaults filled in). */
export function getPrefs() {
  if (cache) return cache;
  let stored = null;
  let legacyOff = false;
  try {
    stored = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    legacyOff = localStorage.getItem(LEGACY_SOUND_KEY) === "off";
  } catch { /* private mode */ }
  if (!stored && legacyOff) {
    stored = { uiSounds: false };
    try { localStorage.setItem(STORE_KEY, JSON.stringify(sanitize(stored))); } catch { /* private mode */ }
  }
  cache = sanitize(stored);
  return cache;
}

/** Group keys in the order the settings sheet shows them. */
export const PREF_GROUPS = ["voice", "reading", "focus", "time", "sound"];

/** True when a settings object differs from the defaults. */
export function isCustomised(prefs = getPrefs()) {
  return PREF_FIELDS.some((f) => prefs[f.key] !== f.def);
}

/** Changes some settings, saves them and tells everyone listening. */
export function setPrefs(patch, { silent = false } = {}) {
  cache = sanitize({ ...getPrefs(), ...(patch || {}) });
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(cache));
    // Keep the old switch in step, for any code that still reads it.
    localStorage.setItem(LEGACY_SOUND_KEY, cache.uiSounds ? "on" : "off");
  } catch { /* private mode */ }
  if (!silent) listeners.forEach((fn) => { try { fn(cache); } catch { /* a listener failed */ } });
  return cache;
}

/** Applies a preset on top of the current settings. */
export function applyPreset(name) {
  return PRESETS[name] ? setPrefs(PRESETS[name]) : getPrefs();
}

export function resetPrefs() {
  return setPrefs(DEFAULT_PREFS);
}

/** Calls fn(prefs) whenever settings change; returns an unsubscribe function. */
export function onPrefsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** True when motion should be reduced (the setting, or the device's own setting). */
export function reducedMotion(prefs = getPrefs()) {
  if (prefs.motion === "reduced") return true;
  if (prefs.motion === "full") return false;
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
}

/** Only the known settings, for sending to the server. */
export function toSupports(prefs = getPrefs()) {
  return sanitize(prefs);
}

export { sanitize as sanitizePrefs };

// Another tab changed the settings: follow it here too.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== STORE_KEY) return;
    cache = null;
    const next = getPrefs();
    listeners.forEach((fn) => { try { fn(next); } catch { /* a listener failed */ } });
  });
}
