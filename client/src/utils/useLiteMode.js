// One answer to "should this page do less work?" for every component: lite mode.
//
// Lite is on when
//   - the learner chose "Less movement" or "Fewer distractions" (utils/learnerPrefs.js),
//     or left Movement on "system" and the device asks for reduced motion;
//   - the browser asks to save data (navigator.connection.saveData);
//   - the device is weak: 4 GB of memory or less, or 4 processor cores or fewer.
// "Full movement" in the comfort settings turns the last two off: the learner asked
// for everything. A phone is NOT weak just because it is a phone.
//
// In lite mode the decoration stops costing anything: no butterflies canvas, the puppy
// is its still picture, the meadow is a still poster, glass blur is off, the AI orb and
// the 3D bricks hold still, and framer-motion drops transform and layout animations.
// PrefsProvider puts it on <html data-lite> for the stylesheets (index.css).
//
//   import { useLiteMode, liteMode } from "../utils/useLiteMode";
//   const lite = useLiteMode();        // in a component; re-renders when it changes
//   if (liteMode()) { … }              // anywhere else
import { useSyncExternalStore } from "react";
import { getPrefs, onPrefsChange, reducedMotion } from "./learnerPrefs";

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
const PHONE_QUERY = "(pointer: coarse) and (max-width: 900px), (pointer: coarse) and (max-height: 500px)";

const nav = () => (typeof navigator === "undefined" ? null : navigator);

/** True when the browser asks for less data (Chrome's Data Saver / Lite mode, Save-Data). */
export function saveData() {
  try { return Boolean(nav()?.connection?.saveData); } catch { return false; }
}

let weak = null;
/** True for a device with little memory or few cores. Decided once: hardware does not change. */
export function weakDevice() {
  if (weak != null) return weak;
  const n = nav();
  if (!n) return false;
  const memory = Number(n.deviceMemory); // Chromium only (GB, capped at 8)
  const cores = Number(n.hardwareConcurrency);
  // Safari reports 4 for every device with fewer than 8 cores (every iPhone), so 4 means
  // nothing there; without a memory figure it would mark every iPhone weak.
  const ua = String(n.userAgent || "");
  const appleCapped = !Number.isFinite(memory) && /AppleWebKit/.test(ua) && !/Chrome\/|Chromium\/|Android/.test(ua);
  weak = (Number.isFinite(memory) && memory > 0 && memory <= 4)
    || (Number.isFinite(cores) && cores > 0 && cores <= (appleCapped ? 2 : 4));
  return weak;
}

/** True when the decoration should stand still and cost nothing (see the top of this file). */
export function liteMode(prefs = getPrefs()) {
  if (reducedMotion(prefs) || prefs.focusMode) return true;
  if (prefs.motion === "full") return false;
  return saveData() || weakDevice();
}

/** True on a phone-sized touch screen: the decoration that stays on runs with cheaper settings. */
export function phoneScreen() {
  try { return window.matchMedia(PHONE_QUERY).matches; } catch { return false; }
}

function subscribe(onChange) {
  const off = onPrefsChange(onChange);
  let mql = null;
  try {
    mql = window.matchMedia(REDUCE_QUERY);
    mql.addEventListener("change", onChange);
  } catch { mql = null; /* no matchMedia: the settings alone decide */ }
  const conn = nav()?.connection;
  try { conn?.addEventListener?.("change", onChange); } catch { /* no Network Information API */ }
  return () => {
    off();
    mql?.removeEventListener("change", onChange);
    try { conn?.removeEventListener?.("change", onChange); } catch { /* nothing to remove */ }
  };
}

const snapshot = () => liteMode(getPrefs());
const serverSnapshot = () => false;

/** Calls fn(lite) whenever lite mode turns on or off; returns an unsubscribe function. */
export function onLiteChange(fn) {
  let last = snapshot();
  return subscribe(() => {
    const next = snapshot();
    if (next !== last) { last = next; fn(next); }
  });
}

/** Writes lite mode on <html data-lite> (index.css reads it). Safe to call before React starts. */
export function applyLiteAttr(lite = snapshot()) {
  if (typeof document === "undefined") return;
  if (lite) document.documentElement.setAttribute("data-lite", "");
  else document.documentElement.removeAttribute("data-lite");
}

/** True in lite mode; re-renders when the settings, the device's motion setting or Save-Data change. */
export function useLiteMode() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

export default useLiteMode;
