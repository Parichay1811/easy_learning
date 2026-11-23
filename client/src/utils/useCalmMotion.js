// One answer to "should this move less?" for every component: the learner's
// own "Movement" comfort setting (utils/learnerPrefs.js) first, then the
// device's reduced-motion setting when the learner left it on "system".
//
// Use this instead of framer-motion's useReducedMotion(), which reads only the
// device setting and so ignores a learner who chose "Less movement" here (or
// "Full movement" on a device that asks for less).
//
//   import { useCalmMotion } from "../utils/useCalmMotion";
//   const calm = useCalmMotion();          // true = keep still / cut, no slides
//   <MotionConfig reducedMotion={calm ? "always" : "never"}>
//
// Re-renders when the setting changes (this tab or another) or when the
// device setting changes.
import { useSyncExternalStore } from "react";
import { getPrefs, onPrefsChange, reducedMotion } from "./learnerPrefs";

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange) {
  const off = onPrefsChange(onChange);
  let mql = null;
  try {
    mql = window.matchMedia(REDUCE_QUERY);
    mql.addEventListener("change", onChange);
  } catch { mql = null; /* no matchMedia: the setting alone decides */ }
  return () => {
    off();
    mql?.removeEventListener("change", onChange);
  };
}

const snapshot = () => reducedMotion(getPrefs());
const serverSnapshot = () => false;

/** True when motion should be reduced: the in-app "Movement" setting, or the device's when that is "system". */
export function useCalmMotion() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

export default useCalmMotion;
