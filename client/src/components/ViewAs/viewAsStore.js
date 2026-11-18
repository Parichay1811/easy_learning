// Browser side of "view as" (SUP-002). The console stores a pending session,
// the /view-as page moves its token into the role's usual storage key (keeping
// whatever was there, to put it back), and the banner reads the active session.
const PENDING = "learnigo_view_as_pending";
const ACTIVE = "learnigo_view_as";
const KEYS = new Set(["admin_jwt", "teacher_jwt", "parent_jwt"]);

const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } };

export function setPending(session) {
  localStorage.setItem(PENDING, JSON.stringify({ ...session, at: Date.now() }));
}

// Moves a fresh pending session (< 2 min old) into place. Returns it or null.
export function activatePending() {
  const p = read(PENDING);
  localStorage.removeItem(PENDING);
  if (!p || !KEYS.has(p.storageKey) || Date.now() - (p.at || 0) > 120_000) return null;
  const current = read(ACTIVE);
  // Keep the real token only once (not a previous view-as token).
  const previous = current?.storageKey === p.storageKey ? current.previous : localStorage.getItem(p.storageKey);
  localStorage.setItem(p.storageKey, p.token);
  localStorage.setItem(ACTIVE, JSON.stringify({ storageKey: p.storageKey, path: p.path, expiresAt: p.expiresAt, sessionId: p.sessionId, target: p.target, previous }));
  return p;
}

export function getActive() {
  const a = read(ACTIVE);
  if (!a || !KEYS.has(a.storageKey)) return null;
  return a;
}

// Puts the person's own token back (or removes the view-as token).
export function clearActive() {
  const a = read(ACTIVE);
  if (a && KEYS.has(a.storageKey)) {
    if (a.previous) localStorage.setItem(a.storageKey, a.previous);
    else localStorage.removeItem(a.storageKey);
  }
  localStorage.removeItem(ACTIVE);
}
