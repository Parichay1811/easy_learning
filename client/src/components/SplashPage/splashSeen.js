// The splash is for the first visit: after that the site opens straight on the page.
const KEY = "learnigo_splash_seen";

/** True when this browser has already seen the splash (or cannot remember: private mode shows it). */
export function splashSeen() {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}

export function markSplashSeen() {
  try { localStorage.setItem(KEY, "1"); } catch { /* private mode: it shows again next time */ }
}
