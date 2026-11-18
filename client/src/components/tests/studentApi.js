// Student test API (server/routes/studentTests.js). Works with either sign-in:
// the JWT in localStorage or the signed session cookie.
import { authHeaders } from "../../utils/authHeaders";

const ROOT = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, "");

export async function studentApi(method, path, body) {
  try {
    const r = await fetch(`${ROOT}/student${path}`, {
      method,
      credentials: "include",
      headers: { ...authHeaders(), "Content-Type": "application/json", "X-Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let json = {};
    try { json = await r.json(); } catch { /* empty */ }
    return { ...json, ok: r.ok && json.success !== false, status: r.status };
  } catch {
    return { ok: false, status: 0, offline: true };
  }
}

export const sget = (p) => studentApi("GET", p);
export const spost = (p, b) => studentApi("POST", p, b ?? {});
export const sput = (p, b) => studentApi("PUT", p, b ?? {});
