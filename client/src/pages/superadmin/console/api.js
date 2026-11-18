// Console API helpers: every call carries the staff session token; a revoked or
// expired session sends the person back to the sign-in page.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdminAuth } from "../../../context/AdminAuthContext";

export const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const getSuperAdminToken = () => localStorage.getItem("superadmin_jwt");

export function useConsoleApi() {
  const { superAdminLogout } = useAdminAuth();
  // The context's functions are new on every provider render; keep the latest in a ref.
  const logoutRef = useRef(superAdminLogout);
  useEffect(() => { logoutRef.current = superAdminLogout; }, [superAdminLogout]);
  const call = useCallback(async (method, path, body) => {
    const res = await fetch(`${API}/api/superadmin${path}`, {
      method,
      headers: { Authorization: `Bearer ${getSuperAdminToken()}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch { /* empty */ }
    if (res.status === 401) {
      logoutRef.current();
      window.location.assign("/superadmin-login?expired=1");
    }
    if (!res.ok || data?.success === false) {
      const err = new Error(data?.message || `Request failed (${res.status})`);
      err.status = res.status; err.code = data?.code; err.data = data;
      throw err;
    }
    return data;
  }, []);

  // Downloads a CSV/JSON export with the token, as a file.
  const download = useCallback(async (path, filename) => {
    const res = await fetch(`${API}/api/superadmin${path}`, { headers: { Authorization: `Bearer ${getSuperAdminToken()}` } });
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, []);

  // One stable object, so effects that depend on it don't re-run every render.
  return useMemo(() => ({
    get: (p) => call("GET", p),
    post: (p, b = {}) => call("POST", p, b),
    put: (p, b = {}) => call("PUT", p, b),
    patch: (p, b = {}) => call("PATCH", p, b),
    del: (p) => call("DELETE", p),
    download,
  }), [call, download]);
}

// Load data for a view: { data, error, loading, reload }. Re-runs when `path` changes;
// `pollMs` refreshes in the background (no WebSockets in this app).
export function useLoad(path, { pollMs = 0, skip = false } = {}) {
  const api = useConsoleApi();
  const [state, setState] = useState({ data: null, error: null, loading: !skip });
  const seq = useRef(0);
  const reload = useCallback(async ({ quiet = false } = {}) => {
    if (skip || !path) return;
    const n = ++seq.current;
    if (!quiet) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api.get(path);
      if (n === seq.current) setState({ data, error: null, loading: false });
    } catch (e) {
      if (n === seq.current) setState((s) => ({ data: s.data, error: e.message, loading: false }));
    }
  }, [api, path, skip]);
  useEffect(() => { reload(); }, [reload]);
  useEffect(() => {
    if (!pollMs || skip) return undefined;
    const id = setInterval(() => { if (!document.hidden) reload({ quiet: true }); }, pollMs);
    return () => clearInterval(id);
  }, [pollMs, reload, skip]);
  return { ...state, reload };
}

export const qs = (obj) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) if (v !== undefined && v !== null && v !== "") p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const money = (cents, currency = "EUR") => (cents == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100));
export const dateTime = (d) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");
export const dateOnly = (d) => (d ? new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—");
export const ago = (d) => {
  if (!d) return "—";
  const s = Math.round((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
};
