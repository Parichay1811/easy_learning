// A page that is fetched when it is first needed (its own chunk), like React.lazy, with
// two things React.lazy does not do:
//
//   const Pricing = lazyPage(() => import("./pages/Pricing"));
//   const Report = lazyPage(() => import("./pages/parent/ReportPage"), "ParentReportPage");
//   <Route path="/pricing" element={<Pricing />} />     // under a <Suspense>
//   Pricing.preload();                                   // fetch it now (hover, idle time)
//
// - preload(): fetch before the click, so the page opens at once.
// - A failed download is not for ever. The error goes to the nearest error boundary
//   (components/ErrorBoundary: "Try again"); trying again fetches again, and if that
//   fails too the next try reloads the site (after a new version went live the old
//   chunk is gone: only a reload can find the new one).
import { use } from "react";

const RETRY_AFTER_MS = 1200; // sooner than this, a new render is React's own retry, not the learner's
const RELOAD_KEY = "learnigo_chunk_reload";

const now = () => Date.now();

// At most once a minute, so a site that is really down cannot reload in a loop.
function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
    if (now() - last < 60_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(now()));
  } catch { return false; }
  window.location.reload();
  return true;
}

export function lazyPage(load, pick = "default") {
  let Loaded = null;
  let promise = null;
  let failedAt = 0;
  let failures = 0;

  const start = () => {
    if (!promise) {
      promise = load().then((m) => {
        Loaded = m[pick];
        failures = 0;
        return Loaded;
      });
      promise.catch(() => { failedAt = now(); failures += 1; });
    }
    return promise;
  };

  // A failure old enough to be the learner trying again (or coming back to the page).
  const retryDue = () => failedAt > 0 && now() - failedAt > RETRY_AFTER_MS;
  const forget = () => { promise = null; failedAt = 0; };

  function Page(props) {
    if (Loaded) return <Loaded {...props} />;
    if (retryDue()) {
      // A second failure in a row: fetch the whole site again. If a reload is under way
      // this waits for it; otherwise it simply tries the chunk once more.
      if (failures >= 2) reloadOnce();
      forget();
    }
    const Component = use(start());
    return <Component {...props} />;
  }

  /** Fetch the page's chunk now. Safe to call often; never throws. */
  Page.preload = () => {
    if (Loaded) return;
    if (retryDue()) forget();
    start().catch(() => { /* shown when the page is opened */ });
  };
  return Page;
}

/** Calls preload() on every lazy page inside a React element (a route's `element`). */
export function preloadElement(element) {
  if (!element || typeof element !== "object") return;
  if (Array.isArray(element)) { element.forEach(preloadElement); return; }
  element.type?.preload?.();
  preloadElement(element.props?.children);
}

export default lazyPage;
