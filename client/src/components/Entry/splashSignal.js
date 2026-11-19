// The splash (App shows it once per load, on top of the first page) tells the
// page underneath when it has gone, so that page starts its entrance (cards
// popping in, a little sound) when it can be seen, not behind the splash.

let showing = false;
let until = 0;
const waiting = new Set();

/** The splash is up (called by SplashPage as soon as it is imported). */
export function splashShowing(maxMs = 4000) {
  showing = true;
  until = Date.now() + maxMs;
}

/** The splash is handing over. */
export function splashDone() {
  showing = false;
  const fns = [...waiting];
  waiting.clear();
  fns.forEach((fn) => fn());
}

/** True while the splash covers the page. */
export function splashActive() {
  return showing && Date.now() < until;
}

/** Runs `fn` once the splash has gone (straight away when there is none). Returns a cancel function. */
export function afterSplash(fn) {
  if (!splashActive()) {
    fn();
    return () => {};
  }
  waiting.add(fn);
  // Never wait for ever (a splash that never finishes must not hide the page's entrance).
  const t = setTimeout(() => { if (waiting.delete(fn)) fn(); }, Math.max(0, until - Date.now()));
  return () => { waiting.delete(fn); clearTimeout(t); };
}
