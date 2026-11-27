/**
 * Counts visits to the public site, without cookies and without identifying
 * anyone (server: routes/visits.js, shown in the console under Growth → Website
 * visits).
 *
 * Each view of a public page (registry.js) or a sign-in screen adds one to that
 * day's total on the server. What is sent: the page, its language, whether this
 * view started the visit, and where the visitor came from: the referring site's
 * host name and any utm_source / utm_medium / utm_campaign in the address they
 * arrived on. Nothing is stored on the device (no cookie, no localStorage), the
 * request carries no cookies, and the server keeps no IP address or browser
 * details. The landing source lives in memory for this page load only, so later
 * pages of the same visit are credited to it.
 *
 * Not counted: game and dashboard screens, automated browsers, and browsers
 * that send Do Not Track or Global Privacy Control.
 */
import { DEFAULT_LANG, pageFor } from "./registry";
import { routeLang } from "./routeLocale";

const ENDPOINT = `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/+$/, "")}/visit`;

// Where a visitor starts using Learnigo: the sign-in and sign-up screens.
const START_PATHS = new Set(["/login", "/parent-login", "/teacher-login"]);

let landing = null; // { r, s, m, c } for this page load
let entrySent = false;
let lastKey = "";

function optedOut() {
  if (typeof navigator === "undefined") return true;
  return navigator.webdriver || navigator.globalPrivacyControl === true || navigator.doNotTrack === "1" || window.doNotTrack === "1";
}

function landingSource() {
  if (landing) return landing;
  const q = new URLSearchParams(window.location.search);
  let r = "";
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    if (ref && ref.hostname !== window.location.hostname) r = ref.hostname;
    else if (ref) r = "(internal)";
  } catch { /* an unreadable referrer counts as none */ }
  landing = { r, s: q.get("utm_source") || "", m: q.get("utm_medium") || "", c: q.get("utm_campaign") || "" };
  return landing;
}

/** Call with the router's pathname (no language prefix) on every page change. */
export function countVisit(pathname) {
  if (typeof window === "undefined" || optedOut()) return;
  const lang = routeLang || DEFAULT_LANG;
  const page = pageFor(pathname);
  const isStart = START_PATHS.has(pathname);
  if (!isStart && !(page && page.langs.includes(lang))) {
    lastKey = "";
    return;
  }
  const path = page ? page.path : pathname;

  // The same page drawn twice in a row (a re-render, React's dev double effect) is one view.
  const key = `${lang}${path}`;
  if (key === lastKey) return;
  lastKey = key;

  const src = landingSource();
  const entry = !entrySent && src.r !== "(internal)";
  entrySent = true;
  const body = JSON.stringify({ p: path, l: lang, e: entry ? 1 : 0, t: isStart ? "start" : "view", r: src.r, s: src.s, m: src.m, c: src.c });
  try {
    // text/plain keeps it a simple request; keepalive lets it finish if the page closes.
    fetch(ENDPOINT, { method: "POST", body, keepalive: true, credentials: "omit", headers: { "Content-Type": "text/plain" } }).catch(() => {});
  } catch { /* counting must never get in the way */ }
}
