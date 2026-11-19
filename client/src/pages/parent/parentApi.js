// Talking to /api/parent/* with the parent's token, plus small shared helpers
// for the parent pages. Every request sends the browser's timezone so days and
// hours are the family's own (the analytics endpoints read X-Timezone).
import { useCallback, useEffect, useMemo, useState } from "react";

export const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
export const TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; } })();

export function useParentApi(token) {
  const call = useCallback(async (method, path, body) => {
    try {
      const r = await fetch(`${API_ROOT}/api/parent${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, "X-Timezone": TZ, ...(body ? { "Content-Type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await r.json().catch(() => ({}));
      return { status: r.status, ...json, success: r.ok && json.success !== false };
    } catch {
      return { success: false, status: 0, message: "We couldn't reach Learnigo. Check your connection and try again." };
    }
  }, [token]);

  // Downloads a file (CSV/JSON export) with the token, then saves it.
  const download = useCallback(async (path, fallbackName) => {
    const r = await fetch(`${API_ROOT}/api/parent${path}`, { headers: { Authorization: `Bearer ${token}`, "X-Timezone": TZ } });
    if (!r.ok) return false;
    const blob = await r.blob();
    const name = /filename="([^"]+)"/.exec(r.headers.get("content-disposition") || "")?.[1] || fallbackName;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  }, [token]);

  // One stable object per token, so effects that depend on `api` don't re-run every render.
  return useMemo(() => ({
    get: (p) => call("GET", p),
    post: (p, b = {}) => call("POST", p, b),
    patch: (p, b = {}) => call("PATCH", p, b),
    del: (p) => call("DELETE", p),
    download,
  }), [call, download]);
}

// Load a GET endpoint whenever `path` changes. Returns { data, loading, error, reload }.
// Data from a previous path is never shown for a new one (no flash of another child's numbers).
export function useLoad(get, path) {
  const [state, setState] = useState({ key: null, path: null, data: null, error: null, status: 0, code: null });
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    if (!path) return undefined;
    let live = true;
    (async () => {
      const d = await get(path);
      if (live) setState({ key: `${path}#${nonce}`, path, data: d.success ? d : null, error: d.success ? null : d.message || "Something went wrong", status: d.status, code: d.code });
    })();
    return () => { live = false; };
  }, [get, path, nonce]);
  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const loading = Boolean(path) && state.key !== `${path}#${nonce}`;
  const same = state.path === path;
  return { data: same ? state.data : null, loading, error: loading || !same ? null : state.error, status: same ? state.status : 0, code: same ? state.code : null, reload };
}

// Server keys -> kit keys.
export const masteryKey = (m) => (m === "not_started" ? "notStarted" : m || "notStarted");
export const frac = (pct) => (pct == null ? null : pct / 100);
export const serverCmp = (cmp) => (cmp === "yoy" ? "lastyear" : cmp || "prev");
export const rangeQuery = (tr) => `from=${tr.from}&to=${tr.to}&cmp=${serverCmp(tr.cmp)}`;

// Matrix grid { english: { listen: {...} } } -> kit cells.
export function matrixCells(grid) {
  const out = [];
  for (const [subject, mods] of Object.entries(grid || {})) {
    for (const [module, c] of Object.entries(mods || {})) {
      out.push({ subject, module, accuracy: frac(c.accuracy), minutes: c.minutes, answered: c.answered, level: masteryKey(c.mastery) });
    }
  }
  return out;
}

// The picture password alphabet (same ids as server/services/managedLearners.js).
export const PICTURES = {
  dog: "🐶", cat: "🐱", lion: "🦁", frog: "🐸", panda: "🐼", unicorn: "🦄",
  octopus: "🐙", apple: "🍎", star: "⭐", rocket: "🚀", rainbow: "🌈", flower: "🌸",
};
export const AVATARS = ["🦁", "🐼", "🦊", "🐸", "🐵", "🦄", "🐙", "🐯", "🐨", "🐰", "🐻", "🐧"];
export const STICKERS = {
  star: "⭐", trophy: "🏆", heart: "💖", rocket: "🚀", rainbow: "🌈", thumbs: "👍", party: "🎉", medal: "🏅", sun: "🌞", hug: "🤗",
};
export const avatarOf = (child) => child?.avatar || (child?.name || "?").charAt(0).toUpperCase();

// Connect by email (server: services/linkRequests.js). The parent types the child's
// Learnigo email; the child accepts under Dashboard → My people.
//   sendChildRequest(api, { name, age, email }) -> { success, request } | { success, linked, child }
export const sendChildRequest = (api, { name, age, email }) => api.post("/links", { to: "student", name, age, email });
export const childRequestFor = (outgoing, child) => (outgoing || []).find((r) => r.kind === "family" && r.child?.id === child?._id) || null;
