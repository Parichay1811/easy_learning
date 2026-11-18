// Talking to the shared comms API as whoever is signed in (FND-050..052).
// Each role keeps its own token in localStorage; a component can name the role it
// is mounted for (`role` prop), otherwise the page path decides, otherwise the
// first token found wins.
const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export const TOKEN_KEYS = [
  ['parent', 'parent_jwt'],
  ['teacher', 'teacher_jwt'],
  ['admin', 'admin_jwt'],
  ['superadmin', 'superadmin_jwt'],
  ['student', 'jwt_token'],
  ['student', 'firebase_jwt'],
];

const read = (key) => { try { return localStorage.getItem(key); } catch { return null; } };

// -> { role, token } or null
export function currentActor(role) {
  if (role) {
    const hit = TOKEN_KEYS.find(([r, k]) => r === role && read(k));
    return hit ? { role, token: read(hit[1]) } : null;
  }
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const fromPath = TOKEN_KEYS.find(([r, k]) => path.startsWith(`/${r}-`) && read(k));
  if (fromPath) return { role: fromPath[0], token: read(fromPath[1]) };
  const first = TOKEN_KEYS.find(([, k]) => read(k));
  return first ? { role: first[0], token: read(first[1]) } : null;
}

// Every role that has a token right now (for the dev gallery's switcher).
export const signedInRoles = () => [...new Set(TOKEN_KEYS.filter(([, k]) => read(k)).map(([r]) => r))];

const tz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } };

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || `Request failed (${status})`);
    this.status = status;
    this.code = body?.code;
    this.body = body;
  }
}

// api('/messages/threads', { role, method, body, form, signal }) -> parsed JSON (throws ApiError)
export async function api(path, { role, method = 'GET', body, form, signal, raw } = {}) {
  const actor = currentActor(role);
  if (!actor) throw new ApiError(401, { message: 'Not signed in' });
  const headers = { Authorization: `Bearer ${actor.token}`, 'X-Timezone': tz() };
  if (body && !form) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${path}`, { method, headers, body: form || (body ? JSON.stringify(body) : undefined), signal });
  if (raw) {
    if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null));
    return res;
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.success === false) throw new ApiError(res.status, json);
  return json;
}

// Fetch a protected file (attachment, export) and hand it to the browser.
export async function download(path, { role, filename, open = false } = {}) {
  const res = await api(path, { role, raw: true });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  if (open) window.open(url, '_blank', 'noopener');
  else {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || (res.headers.get('content-disposition') || '').match(/filename="([^"]+)"/)?.[1] || 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export const apiBase = BASE;
