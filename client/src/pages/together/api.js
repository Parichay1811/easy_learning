// The learner's "Together" and Shorts endpoints (/api/social, /api/shorts), with the
// learner's token. Every call resolves (never throws): { ok, status, ...json }.
import { useCallback, useEffect, useRef, useState } from "react";
import { journeyFetch, signedIn } from "../../components/journey/journeyApi";

export { signedIn };
export const tg = (path, opts) => journeyFetch(`/social${path}`, opts);
export const shortsApi = (path, opts) => journeyFetch(`/shorts${path}`, opts);

/**
 * Everything the Together page shows, loaded in one call and refreshed on demand and when
 * the tab comes back (a friend may have played meanwhile). Never polls in the background.
 *   { data, loading, error, reload, patch }
 */
export function useTogether() {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const alive = useRef(true);
  const load = useCallback(async () => {
    const r = await tg("/home");
    if (!alive.current) return;
    setState((s) => (r.ok ? { data: r, loading: false, error: null } : { data: s.data, loading: false, error: r.status === 401 ? "signin" : r.message || "offline" }));
  }, []);
  useEffect(() => {
    alive.current = true;
    load();
    let hiddenAt = 0;
    const onVis = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > 20000) load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => { alive.current = false; document.removeEventListener("visibilitychange", onVis); };
  }, [load]);
  // Put part of a reply straight into the page (e.g. the friends list a POST returned).
  const patch = useCallback((part) => setState((s) => (s.data ? { ...s, data: { ...s.data, ...part } } : s)), []);
  return { ...state, reload: load, patch };
}
