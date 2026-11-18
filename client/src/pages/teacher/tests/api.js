// Teacher API for the question bank and tests (server/routes/teacherTests.js).
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAdminAuth } from "../../../context/AdminAuthContext";

export const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, "");

// Every call resolves to { ok, status, locked, ...json } and never throws.
export function useTeacherApi() {
  const { getTeacherToken } = useAdminAuth();
  const token = getTeacherToken();

  const call = useCallback(async (method, path, body, { form } = {}) => {
    try {
      const r = await fetch(`${API_ROOT}/teacher${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, ...(form ? {} : { "Content-Type": "application/json" }), "X-Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone },
        body: form || (body !== undefined ? JSON.stringify(body) : undefined),
      });
      let json = {};
      try { json = await r.json(); } catch { /* empty body */ }
      return { ...json, ok: r.ok && json.success !== false, status: r.status, locked: r.status === 402 ? json.module || true : false };
    } catch {
      return { ok: false, status: 0, message: "network" };
    }
  }, [token]);

  // Downloads a CSV with the token (an <a href> can't send it).
  const download = useCallback(async (path, filename) => {
    const r = await fetch(`${API_ROOT}/teacher${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return false;
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  }, [token]);

  return useMemo(() => ({
    token,
    get: (p) => call("GET", p),
    post: (p, b) => call("POST", p, b ?? {}),
    put: (p, b) => call("PUT", p, b ?? {}),
    patch: (p, b) => call("PATCH", p, b ?? {}),
    del: (p) => call("DELETE", p),
    upload: (p, form) => call("POST", p, undefined, { form }),
    download,
  }), [call, download, token]);
}

// t() for this area: tt("key", "Default text", { vars })
export function useT() {
  const { t } = useTranslation();
  return useCallback((key, defaultValue, opts = {}) => t(`teacherTests.${key}`, { defaultValue, ...opts }), [t]);
}

export const MODULE_KEYS = ["read", "write", "listen", "speak"];
export const SUBJECT_KEYS = ["english", "maths", "science"];

export const INTERACTION_LABELS = {
  tap_mcq: "Tap the answer",
  true_false: "True or false",
  drag_to_blank: "Fill the blank",
  multi_select: "Tap all that are right",
  drag_order: "Put in order",
  tap_sequence: "Tap in sequence",
  letter_bank: "Build the word",
  match_pairs: "Match pairs",
  sort_bins: "Sort into groups",
  typed_short: "Short typed answer",
  typed_long: "Long typed answer",
  mic_record: "Say it (voice)",
};

export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

// "2026-11-20T09:00" for a datetime-local input, in a given timezone.
export function toLocalInput(iso, tz) {
  if (!iso) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz || undefined, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(iso));
    const g = (k) => parts.find((p) => p.type === k)?.value;
    return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
  } catch {
    return "";
  }
}

export const fmtWhen = (iso, tz) => {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(undefined, { timeZone: tz || undefined, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
};
