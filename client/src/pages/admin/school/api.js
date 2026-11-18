// Calls to /api/admin/* with the admin (or staff) token. Every call resolves to
// the JSON body; failures throw an Error carrying `status`, `code` and `body`.
import { useCallback, useEffect, useMemo, useState } from "react";

export const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const TOKEN_KEY = "admin_jwt";

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
};

async function request(method, path, body, { raw = false } = {}) {
  const headers = { Authorization: `Bearer ${getToken()}` };
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (tz) headers["X-Timezone"] = tz;
  let payload;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) { headers["Content-Type"] = "application/json"; payload = JSON.stringify(body); }
  const res = await fetch(`${API_ROOT}/api/admin${path}`, { method, headers, body: payload });
  if (raw) {
    if (!res.ok) throw Object.assign(new Error(`Request failed (${res.status})`), { status: res.status });
    return res;
  }
  let json = null;
  try { json = await res.json(); } catch { /* empty */ }
  if (!res.ok || json?.success === false) {
    throw Object.assign(new Error(json?.message || `Request failed (${res.status})`), { status: res.status, code: json?.code, body: json });
  }
  return json;
}

export const api = {
  get: (p) => request("GET", p),
  post: (p, b = {}) => request("POST", p, b),
  put: (p, b = {}) => request("PUT", p, b),
  patch: (p, b = {}) => request("PATCH", p, b),
  del: (p) => request("DELETE", p),
  upload: (p, form) => request("POST", p, form),
  // Downloads a file (CSV export / template) with the token, then saves it.
  async download(p, filename) {
    const res = await request("GET", p, undefined, { raw: true });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

// useLoad("/school/overview?from=...") -> { data, error, loading, reload }. Refetches when
// the path changes; the previous data stays visible while the next one loads.
export function useLoad(path, { skip = false } = {}) {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ key: null, data: null, error: null });
  const key = skip || !path ? null : `${path}#${tick}`;
  useEffect(() => {
    if (!key) return undefined;
    let live = true;
    api.get(path).then(
      (data) => { if (live) setState({ key, data, error: null }); },
      (error) => { if (live) setState({ key, data: null, error }); },
    );
    return () => { live = false; };
  }, [key, path]);
  const reload = useCallback(() => setTick((n) => n + 1), []);
  return useMemo(() => ({
    data: state.data,
    error: key && state.key === key ? state.error : null,
    // Only "loading" before there is anything to show; reloads keep the old data on screen.
    loading: Boolean(key) && state.key !== key && state.data == null,
    refreshing: Boolean(key) && state.key !== key,
    reload,
  }), [state, key, reload]);
}

// Query string from an object, skipping empty values.
export const qs = (o) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o || {})) if (v !== undefined && v !== null && v !== "") p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : "";
};
