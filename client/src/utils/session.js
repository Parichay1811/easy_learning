// Stay signed in until you sign out.
//
// Each role keeps its own token in this browser (student, parent, teacher, school
// admin). Two things make "signed in" stick:
//  - activeSession(): the entry page and every sign-in page send somebody who is
//    already signed in straight to their own place instead of asking again;
//  - renewSessions(): a still-valid token is swapped for a fresh one (server checks
//    the account is still active: POST /api/auth/renew), on app start, every few
//    hours, and when the tab comes back. Only "Logout" (or an account that was
//    removed) ends a session.
// Learnigo staff (super admin) sessions are deliberately not part of this.
const API = (import.meta.env?.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, "");

export const SESSIONS = [
  { role: "student", keys: ["jwt_token", "firebase_jwt"], home: "/home", renew: "jwt_token" },
  { role: "parent", keys: ["parent_jwt"], home: "/parent-dashboard", renew: "parent_jwt" },
  { role: "teacher", keys: ["teacher_jwt"], home: "/teacher-dashboard", renew: "teacher_jwt" },
  { role: "admin", keys: ["admin_jwt"], home: "/admin-dashboard", renew: "admin_jwt" },
];

const LAST_ROLE_KEY = "learnigo_last_role";
const RENEW_AFTER_MS = 6 * 60 * 60 * 1000; // a token older than this is renewed
const SKEW_MS = 60 * 1000;

const read = (k, store) => { try { return (store || localStorage).getItem(k); } catch { return null; } };
const write = (k, v, store) => { try { (store || localStorage).setItem(k, v); } catch { /* private mode */ } };

export function decodeToken(token) {
  try {
    const part = String(token || "").split(".")[1];
    if (!part) return null;
    return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

/** A token that is present, readable and not (about to be) expired. */
export function isValidToken(token, now = Date.now()) {
  const p = decodeToken(token);
  return Boolean(p?.exp && p.exp * 1000 > now + SKEW_MS && !p.imp);
}

/** Every role this browser is signed in as, with where it lives. */
export function validSessions(store, now = Date.now()) {
  return SESSIONS.filter((s) => s.keys.some((k) => isValidToken(read(k, store), now)));
}

/** The place to send somebody who is already signed in (their last-used role first), or null. */
export function activeSession(store, now = Date.now()) {
  const all = validSessions(store, now);
  if (!all.length) return null;
  const last = read(LAST_ROLE_KEY, store);
  return all.find((s) => s.role === last) || all[0];
}

/** For one sign-in page: is this role already signed in here? */
export function sessionFor(role, store, now = Date.now()) {
  return validSessions(store, now).find((s) => s.role === role) || null;
}

/** Remember which role was used last (so "/" opens that one on a shared family device). */
export function noteRoleForPath(pathname, store) {
  const role = pathname.startsWith("/parent") ? "parent"
    : pathname.startsWith("/teacher-dashboard") ? "teacher"
      : pathname.startsWith("/admin-dashboard") || pathname.startsWith("/admin-school") ? "admin"
        : /^\/(home|dashboard|discovery|games|module|subject|ai-teacher)(\/|$)/.test(pathname) ? "student" : null;
  if (role && sessionFor(role, store)) write(LAST_ROLE_KEY, role, store);
  return role;
}

/**
 * Swap still-valid tokens older than a few hours for fresh ones. A 401 from the server
 * means the account is no longer active: that token is removed (signed out). Network
 * trouble changes nothing.
 */
export async function renewSessions({ store, fetchImpl = typeof fetch === "function" ? fetch : null, now = Date.now(), force = false } = {}) {
  if (!fetchImpl) return [];
  const done = [];
  for (const s of SESSIONS) {
    const token = read(s.renew, store);
    const p = decodeToken(token);
    if (!token || !isValidToken(token, now)) continue;
    if (!force && p.iat && now - p.iat * 1000 < RENEW_AFTER_MS) continue;
    try {
      const res = await fetchImpl(`${API}/auth/renew`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.token && read(s.renew, store) === token) {
        write(s.renew, body.token, store);
        done.push(s.role);
      } else if (res.status === 401 && read(s.renew, store) === token) {
        try { (store || localStorage).removeItem(s.renew); } catch { /* private mode */ }
      }
    } catch { /* offline: try again later */ }
  }
  return done;
}
