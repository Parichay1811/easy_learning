// Keeps the learner's comfort settings in their profile (GET/PUT
// /api/learn/profile `supports`), so they follow them to another device.
// Local first: the settings always work from this browser's copy. A change
// made here is sent up (a moment later, gathered); on sign-in the profile's
// copy is taken unless this browser has changes it has not sent yet (then
// those are sent). A guardian's or teacher's change to the learning plan
// arrives the same way. If the endpoint is not there (404), syncing stops
// for this visit and nothing else changes.
import { getPrefs, setPrefs, onPrefsChange, toSupports } from "../../utils/learnerPrefs";

const BASE = import.meta.env.VITE_API_BASE_URL;
const DIRTY_KEY = "learnigo_prefs_unsynced";
const PUSH_DELAY_MS = 1200;

let started = false;
let applyingRemote = false;
let unavailable = false;
let timer = null;
let pulledFor = null;

const token = () => {
  try { return localStorage.getItem("jwt_token") || localStorage.getItem("firebase_jwt"); } catch { return null; }
};
const isDirty = () => { try { return localStorage.getItem(DIRTY_KEY) === "1"; } catch { return false; } };
const setDirty = (on) => { try { if (on) localStorage.setItem(DIRTY_KEY, "1"); else localStorage.removeItem(DIRTY_KEY); } catch { /* private mode */ } };
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

async function push() {
  timer = null;
  if (unavailable || !token() || !BASE) return;
  try {
    const res = await fetch(`${BASE}/learn/profile`, { method: "PUT", headers: headers(), body: JSON.stringify({ supports: toSupports(getPrefs()) }) });
    if (res.status === 404) { unavailable = true; return; }
    if (res.ok) setDirty(false);
  } catch { /* offline: stays marked, sent next time */ }
}

/** Takes the profile's settings (or sends this browser's unsent ones). */
export async function pullPrefs(who = "student") {
  if (unavailable || !token() || !BASE) return;
  if (pulledFor === who) return;
  pulledFor = who;
  try {
    const res = await fetch(`${BASE}/learn/profile`, { headers: headers() });
    if (res.status === 404) { unavailable = true; return; }
    if (!res.ok) return;
    const json = await res.json();
    if (isDirty()) { push(); return; }
    const supports = json?.profile?.supports;
    if (supports && typeof supports === "object" && Object.keys(supports).length) {
      applyingRemote = true;
      try { setPrefs(supports); } finally { applyingRemote = false; }
    }
  } catch { /* offline: local settings carry on */ }
}

/** Starts syncing (once). `who` (an id or email) re-pulls when the learner changes. */
export function startPrefsSync(who) {
  if (!started) {
    started = true;
    onPrefsChange(() => {
      if (applyingRemote) return;
      setDirty(true);
      if (!token()) return;
      clearTimeout(timer);
      timer = setTimeout(push, PUSH_DELAY_MS);
    });
  }
  if (who) pullPrefs(who);
  else pulledFor = null;
}
