// The learner's journey endpoints (contract §2), with the learner's token:
//   GET /api/learn/welcome?lang=    the welcome-back message and its actions
//   GET /api/learn/next?lang=       "What next?" (ranked, at most 6, each with a reason)
//   GET /api/learn/journey          stages 0-5 per subject (mastered / tried)
//   GET /api/learn/discovery?lang=  today's quick discovery ({ item, date })
// Every call resolves (never throws); an older server without them answers
// 404 and the pages fall back to what they showed before.
import { useCallback, useEffect, useState } from "react";

const BASE = import.meta.env.VITE_API_BASE_URL;

function token() {
  try { return localStorage.getItem("jwt_token") || localStorage.getItem("firebase_jwt") || ""; } catch { return ""; }
}

function headers(body) {
  let tz = "UTC";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { /* keep UTC */ }
  const tok = token();
  return { ...(tok ? { Authorization: `Bearer ${tok}` } : {}), "X-Timezone": tz, ...(body ? { "Content-Type": "application/json" } : {}) };
}

/** fetch /api<path> as the learner: { ok, status, ...json }. */
export async function journeyFetch(path, { method = "GET", body, signal } = {}) {
  try {
    const r = await fetch(`${BASE}${path}`, { method, headers: headers(body), credentials: "include", body: body ? JSON.stringify(body) : undefined, signal });
    const json = await r.json().catch(() => ({}));
    return { ...json, ok: r.ok && json.success !== false, status: r.status };
  } catch (e) {
    return { ok: false, status: 0, message: e?.name === "AbortError" ? "aborted" : "offline" };
  }
}

export const signedIn = () => Boolean(token());

// A short, stable tag for the signed-in learner on this device (from the
// token's email, hashed), so two learners sharing a device keep their own notes.
function who() {
  try {
    const p = JSON.parse(atob(token().split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const s = String(p.email || p.id || "");
    let h = 0;
    for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  } catch {
    return "me";
  }
}

/** A short tag for the signed-in learner on this device (never their email): for notes kept on the device. */
export const learnerTag = () => who();

/** The base language code for the server's words ("pt-BR" -> "pt"). */
export const langOf = (lng) => String(lng || "en").split("-")[0].toLowerCase();

// One copy per learner + language for the session, so moving between the
// dashboard's tabs does not flash or fetch twice (each visit still refreshes).
// A request already on its way is shared (the dashboard mounts the Today tab
// more than once while its own numbers load).
const cache = new Map();
const inflight = new Map();

function loadAll(key, lang, calm) {
  if (inflight.has(key)) return inflight.get(key);
  const q = `?lang=${encodeURIComponent(lang)}`;
  const p = Promise.all([
    // calm=1: the learner's own comfort settings on this device ask for the quieter welcome.
    journeyFetch(`/learn/welcome${q}${calm ? "&calm=1" : ""}`),
    journeyFetch(`/learn/next${q}`),
    journeyFetch("/learn/journey"),
    journeyFetch(`/learn/discovery${q}`),
  ]).then(([w, n, j, d]) => {
    const data = {
      welcome: w.ok && w.message ? w : null,
      next: n.ok && Array.isArray(n.items) ? n : null,
      journey: j.ok ? j : null,
      // { item, date, answered }: `answered` = today's one is done (a calm "see you tomorrow").
      discovery: d.ok && d.item ? d : null,
    };
    cache.set(key, data);
    return data;
  }).finally(() => { setTimeout(() => inflight.delete(key), 0); });
  inflight.set(key, p);
  return p;
}

/**
 * The Today hub's data:
 *   { welcome, next, journey, discovery, loading, available, reload }
 * welcome / next / journey / discovery are the endpoint's JSON or null.
 * `available` is false while loading and when the server has neither a
 * welcome nor a "What next?" (an older server): the page shows its old view.
 */
export function useJourney({ enabled = true, lang = "en", calm = false } = {}) {
  const key = `${token()}|${lang}|${calm ? 1 : 0}`;
  const own = cache.get(key) || null;
  const [state, setState] = useState(() => ({ key, data: own, loading: enabled && !own }));
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let live = true;
    loadAll(key, lang, calm).then((data) => { if (live) setState({ key, data, loading: false }); });
    return () => { live = false; };
  }, [enabled, key, lang, calm, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  // A new language: show the last words until the new ones arrive.
  const data = state.key === key ? state.data : own || state.data;
  const loading = enabled && !data && (state.loading || state.key !== key);
  return {
    welcome: data?.welcome || null,
    next: data?.next || null,
    journey: data?.journey || null,
    discovery: data?.discovery || null,
    loading,
    available: Boolean(data && (data.welcome || data.next)),
    reload,
  };
}

/** Today's date as the server counts it for the discovery (local YYYY-MM-DD). */
export function todayKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// "Done today" for the discovery, remembered on this device (the server also
// stops offering an item answered in the last 7 days).
const DONE_KEY = "journey_discovery_done";
export function discoveryDone(date = todayKey()) {
  try { return JSON.parse(localStorage.getItem(DONE_KEY) || "{}")[`${who()}|${date}`] || null; } catch { return null; }
}
export function markDiscoveryDone(id, date = todayKey()) {
  try {
    const all = JSON.parse(localStorage.getItem(DONE_KEY) || "{}");
    all[`${who()}|${date}`] = id || true;
    // Keep only the last few days.
    const keys = Object.keys(all).sort().slice(-14);
    localStorage.setItem(DONE_KEY, JSON.stringify(Object.fromEntries(keys.map((k) => [k, all[k]]))));
  } catch { /* storage off: the card just offers it again */ }
}
