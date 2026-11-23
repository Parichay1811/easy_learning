// Where the learner was before this page (in this tab), so "Back" from a round
// goes where they came from: a round started from the dashboard goes back to the
// dashboard, not Home (docs/learning/GAME-ROADMAP.md G-010).
// App.jsx notes every route change (RouteMemory); changes of the query alone
// (?resume=1) keep the page before.
let current = null;
let previous = null;

/** Notes the route the app is on now ("/dashboard?tab=x"). */
export function notePath(path) {
  if (!path || path === current) return;
  const pathOnly = (p) => String(p || "").split("?")[0];
  if (current && pathOnly(current) === pathOnly(path)) { current = path; return; }
  previous = current;
  current = path;
}

/**
 * The page before `selfPathname` (the page asking), or null on a first visit.
 * Works whether or not the app has noted the asking page yet.
 */
export function originFor(selfPathname) {
  const pathOnly = (p) => String(p || "").split("?")[0];
  return pathOnly(current) === selfPathname ? previous : current;
}

// Pages a round can go back to (everything else goes Home, with the subject open).
const BACK_TO = ["/dashboard", "/discovery", "/subject/", "/games", "/ai-teacher"];

/** The page a round's Back should return to, or null for Home. */
export function backTargetFor(selfPathname) {
  const o = originFor(selfPathname);
  if (!o || o.startsWith("/module/")) return null;
  const base = o.split("?")[0];
  return BACK_TO.some((p) => (p.endsWith("/") ? base.startsWith(p) : base === p || base.startsWith(`${p}/`))) ? o : null;
}
