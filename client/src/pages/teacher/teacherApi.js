// Small fetch helpers for the teacher pages. Every call sends the teacher token and the
// browser's timezone; answers come back as { ok, status, ...json } and never throw.
import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "../../context/AdminAuthContext";

export const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const tz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; } };

export async function apiCall(path, { token, method = "GET", body, form } = {}) {
  try {
    const headers = { "X-Timezone": tz() };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined && !form) headers["Content-Type"] = "application/json";
    const r = await fetch(`${API_ROOT}/api${path}`, { method, headers, body: form || (body !== undefined ? JSON.stringify(body) : undefined) });
    const json = await r.json().catch(() => ({}));
    return { ok: r.ok && json.success !== false, status: r.status, ...json };
  } catch {
    return { ok: false, status: 0, message: "Could not reach Learnigo. Check your connection and try again." };
  }
}

export function useTeacherApi() {
  const { getTeacherToken } = useAdminAuth();
  const token = getTeacherToken();
  const get = useCallback((path) => apiCall(`/teacher${path}`, { token }), [token]);
  const send = useCallback((method, path, body) => apiCall(`/teacher${path}`, { token, method, body }), [token]);
  const upload = useCallback((path, form) => apiCall(`/teacher${path}`, { token, method: "POST", form }), [token]);
  return { get, send, upload, token };
}

// Load once (and again when `deps` change). Returns { data, loading, error, reload }.
// While a new load runs, the previous data stays on screen (no flash) and `loading` is true.
export function useLoad(loader, deps) {
  const [tick, setTick] = useState(0);
  const key = JSON.stringify([...deps, tick]);
  const [state, setState] = useState({ key: null, data: null, error: "", status: 0 });
  useEffect(() => {
    let live = true;
    loader().then((r) => {
      if (!live) return;
      setState({ key, data: r.ok ? r : null, error: r.ok ? "" : r.message || "Something went wrong", status: r.status });
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures the caller's deps
  }, [key]);
  const loading = state.key !== key;
  return { data: state.data, loading, error: loading ? "" : state.error, status: state.status, reload: () => setTick((n) => n + 1) };
}

export const pctToFraction = (v) => (v == null ? null : v / 100);
