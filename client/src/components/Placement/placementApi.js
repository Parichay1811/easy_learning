// Where a learner starts in a subject: the learning engine's profile and
// baseline (GET/PUT /api/learn/profile, GET/POST /api/learn/baseline, contract
// §2), with this browser as the fallback (guests, or a server without them).
import { authHeaders } from "../../utils/authHeaders";

const BASE = import.meta.env.VITE_API_BASE_URL;
const SEEN_KEY = "learnigo_placement_seen"; // { [who|subject]: true }
const LEVELS_KEY = "learnigo_levels"; // { maths: 2 } chosen on this device (questionsSlice reads it)

const read = (key) => { try { return JSON.parse(localStorage.getItem(key) || "{}") || {}; } catch { return {}; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ } };
export const signedIn = () => { try { return Boolean(localStorage.getItem("jwt_token") || localStorage.getItem("firebase_jwt")); } catch { return false; } };
const who = () => { try { return localStorage.getItem("jwt_token") ? "learner" : "guest"; } catch { return "guest"; } };

export function placementSeen(subject) { return Boolean(read(SEEN_KEY)[`${who()}|${subject}`]); }
export function markPlacementSeen(subject) { const m = read(SEEN_KEY); m[`${who()}|${subject}`] = true; write(SEEN_KEY, m); }
export function localLevel(subject) { const v = read(LEVELS_KEY)[subject]; return Number.isInteger(v) ? v : null; }
export function setLocalLevel(subject, level) { const m = read(LEVELS_KEY); m[subject] = level; write(LEVELS_KEY, m); }

let profileCache = null; // { at, value } — one profile per visit is plenty here
let apiMissing = false;

/** The learner's profile ({ profile, skills, ... }) or null (guest, no API, offline). */
export async function fetchLearnProfile({ fresh = false } = {}) {
  if (!signedIn() || apiMissing || !BASE) return null;
  if (!fresh && profileCache && Date.now() - profileCache.at < 60000) return profileCache.value;
  try {
    const res = await fetch(`${BASE}/learn/profile`, { headers: authHeaders() });
    if (res.status === 404) { apiMissing = true; return null; }
    if (!res.ok) return null;
    const json = await res.json();
    profileCache = { at: Date.now(), value: json };
    return json;
  } catch { return null; }
}

/**
 * True when the learner has not started this subject yet and has not been
 * asked: no level chosen or found, no answers, never offered on this device.
 */
export async function needsPlacement(subject) {
  if (placementSeen(subject)) return false;
  const data = await fetchLearnProfile();
  const ls = data?.profile?.levels?.[subject];
  if (ls && (ls.locked || (ls.source && ls.source !== "default") || ls.attempts > 0 || data?.profile?.baselineDone?.[subject])) {
    markPlacementSeen(subject);
    return false;
  }
  if (!data && localLevel(subject) != null) return false;
  return true;
}

/** Sets the learner's level. Resolves { ok, locked }. Always kept on this device too. */
export async function chooseLevel(subject, level) {
  setLocalLevel(subject, level);
  markPlacementSeen(subject);
  if (!signedIn() || apiMissing || !BASE) return { ok: true, local: true };
  try {
    const res = await fetch(`${BASE}/learn/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ levels: { [subject]: level } }),
    });
    if (res.status === 409) return { ok: false, locked: true };
    if (res.status === 404) { apiMissing = true; return { ok: true, local: true }; }
    profileCache = null;
    return { ok: res.ok };
  } catch { return { ok: true, local: true }; }
}

/** One question per level, easiest first, or null when the check-in is not available. */
export async function fetchBaseline(subject, module, lang) {
  if (!signedIn() || apiMissing || !BASE) return null;
  try {
    const qs = new URLSearchParams({ subject, module });
    if (lang && subject !== "english") qs.set("lang", lang);
    const res = await fetch(`${BASE}/learn/baseline?${qs}`, { headers: authHeaders() });
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json.items) && json.items.length ? json.items : null;
  } catch { return null; }
}

/** Sends the check-in's answers; resolves { level } or null. */
export async function sendBaseline(subject, results) {
  markPlacementSeen(subject);
  if (!signedIn() || !BASE) return null;
  try {
    const res = await fetch(`${BASE}/learn/baseline`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ subject, results }),
    });
    if (!res.ok) return { error: res.status };
    const json = await res.json();
    if (Number.isInteger(json.level)) setLocalLevel(subject, json.level);
    profileCache = null;
    return json;
  } catch { return null; }
}

/** Highest level answered right before two misses (the same rule as the server's). */
export function placeLocally(results) {
  let best = 0;
  let misses = 0;
  for (const r of [...results].sort((a, b) => a.level - b.level)) {
    if (r.status === "correct") best = Math.max(best, r.level);
    else if (r.status === "incorrect" || r.status === "close") { misses += 1; if (misses >= 2) break; }
  }
  return best;
}
