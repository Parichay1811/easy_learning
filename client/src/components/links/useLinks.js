// "Connect by email" requests (server: services/linkRequests.js), for every role.
// One hook: the incoming and outgoing requests of whoever is signed in as `role`,
// plus send / accept / decline / cancel. It polls gently and plays the notify
// sound once when a request we haven't seen before arrives.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sfx } from "../../utils/sounds";

export const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

// Where each role's link routes live, and which stored token signs the call.
const ROLES = {
  student: { base: "/api/dashboard/links", token: () => store("jwt_token") || store("firebase_jwt") },
  parent: { base: "/api/parent/links", token: () => store("parent_jwt") },
  teacher: { base: "/api/teacher/links", token: () => store("teacher_jwt") },
  admin: { base: "/api/admin/links", token: () => store("admin_jwt") },
};
function store(k) { try { return localStorage.getItem(k) || ""; } catch { return ""; } }
const tz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; } };

// fetch that never throws: { ok, status, ...json }
export async function linkCall(role, path = "", { method = "GET", body } = {}) {
  const r = ROLES[role];
  const token = r.token();
  try {
    const res = await fetch(`${API_ROOT}${r.base}${path}`, {
      method,
      credentials: role === "student" ? "include" : "same-origin",
      headers: { "X-Timezone": tz(), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { ...json, ok: res.ok && json.success !== false, status: res.status };
  } catch {
    return { ok: false, status: 0, message: "We couldn't reach Learnigo. Check your connection and try again." };
  }
}

// The /teach page: a teacher signed in with Google only (no workspace yet).
export async function hubCall(path, body) {
  try {
    const res = await fetch(`${API_ROOT}/api/teacher/auth${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
    const json = await res.json().catch(() => ({}));
    return { ...json, ok: res.ok && json.success !== false, status: res.status };
  } catch {
    return { ok: false, status: 0, message: "We couldn't reach Learnigo. Check your connection and try again." };
  }
}

const SEEN_KEY = "links_seen";
function seenIds() { try { return new Set(JSON.parse(sessionStorage.getItem(SEEN_KEY) || "[]")); } catch { return new Set(); } }
function markSeen(ids) { try { sessionStorage.setItem(SEEN_KEY, JSON.stringify([...new Set([...seenIds(), ...ids])].slice(-200))); } catch { /* private mode */ } }

// useLinks("parent", { poll: 30000 }) -> { data, loading, error, reload, send, accept, decline, cancel, fresh }
// `fresh` lists the incoming requests that arrived since the page was opened (for a toast).
export function useLinks(role, { poll = 45000, enabled = true, sound = true } = {}) {
  const [state, setState] = useState({ data: null, error: "", loaded: false });
  const [fresh, setFresh] = useState([]);
  const live = useRef(true);

  // Apply a list answer: remember it, and chime once for requests we haven't seen.
  const apply = useCallback((r) => {
    if (!live.current) return;
    if (r.ok) {
      const seen = seenIds();
      const unseen = (r.incoming || []).filter((x) => !seen.has(x.id));
      if (unseen.length) {
        if (sound) sfx.notify();
        setFresh(unseen);
        markSeen(unseen.map((x) => x.id));
      }
    }
    setState({ data: r.ok ? r : null, error: r.ok ? "" : r.message || "Something went wrong", loaded: true });
  }, [sound]);

  const load = useCallback(async () => {
    const r = await linkCall(role);
    apply(r);
    return r;
  }, [role, apply]);

  useEffect(() => {
    live.current = true;
    if (!enabled || (!ROLES[role].token() && role !== "student")) return () => { live.current = false; };
    const tick = async () => { const r = await linkCall(role); apply(r); };
    tick();
    const iv = poll ? setInterval(() => { if (document.visibilityState !== "hidden") tick(); }, poll) : null;
    return () => { live.current = false; if (iv) clearInterval(iv); };
  }, [role, enabled, poll, apply]);

  const act = useCallback(async (method, path, body) => {
    const r = await linkCall(role, path, { method, body });
    if (r.ok) await load();
    return r;
  }, [role, load]);

  return useMemo(() => ({
    data: state.data,
    loading: !state.loaded,
    error: state.error,
    fresh,
    clearFresh: () => setFresh([]),
    reload: load,
    send: (body) => act("POST", "", body),
    accept: (id, body = {}) => act("POST", `/${id}/accept`, body),
    decline: (id) => act("POST", `/${id}/decline`, {}),
    cancel: (id) => act("POST", `/${id}/cancel`, {}),
  }), [state, fresh, load, act]);
}

// "2 days" style countdown for a request's expiry.
export function daysLeft(iso) {
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  return Math.max(0, d);
}
