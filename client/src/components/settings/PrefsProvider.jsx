import { useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/600.css";
import "@fontsource/opendyslexic/400.css";
import "@fontsource/opendyslexic/700.css";
import { reducedMotion } from "../../utils/learnerPrefs";
import { useAuth } from "../../context/AuthContext";
import { usePrefs } from "./usePrefs";
import { startPrefsSync } from "./prefsSync";

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function useOsReducedMotion() {
  const [on, setOn] = useState(() => typeof window !== "undefined" && window.matchMedia?.(REDUCE_QUERY).matches);
  useEffect(() => {
    const mql = window.matchMedia?.(REDUCE_QUERY);
    if (!mql) return undefined;
    const fn = (e) => setOn(e.matches);
    mql.addEventListener("change", fn);
    return () => mql.removeEventListener("change", fn);
  }, []);
  return on;
}

/**
 * Applies the learner's comfort settings to the whole site: data attributes and
 * CSS variables on <html> (read by index.css and the components), and
 * framer-motion's MotionConfig, so animations follow the "Movement" setting as
 * well as the device's own. Also keeps the settings in the signed-in
 * learner's profile (prefsSync.js).
 *
 *   <html data-font="readable" data-spacing="wide" data-contrast="high"
 *         data-motion="reduced" data-focus-mode data-big-targets
 *         style="--lp-text-scale: 1.2; --lp-target: 56px">
 */
export default function PrefsProvider({ children }) {
  const prefs = usePrefs();
  const osReduce = useOsReducedMotion();
  const { user } = useAuth();
  const reduce = prefs.motion === "reduced" || (prefs.motion === "system" && osReduce);

  useEffect(() => {
    const el = document.documentElement;
    const attr = (name, value) => { if (value == null || value === false) el.removeAttribute(name); else el.setAttribute(name, value === true ? "" : String(value)); };
    attr("data-font", prefs.font !== "default" ? prefs.font : null);
    attr("data-spacing", prefs.spacing === "wide" ? "wide" : null);
    attr("data-contrast", prefs.contrast === "high" ? "high" : null);
    attr("data-motion", reducedMotion(prefs) ? "reduced" : null);
    attr("data-focus-mode", prefs.focusMode);
    attr("data-big-targets", prefs.bigTargets);
    el.style.setProperty("--lp-text-scale", String(prefs.textScale || 1));
    el.style.setProperty("--lp-target", prefs.bigTargets ? "56px" : "44px");
  }, [prefs, osReduce]);

  // Only a learner's own sign-in syncs (parents and teachers edit the plan in their dashboards).
  const who = user?.email || user?.uid || null;
  useEffect(() => { startPrefsSync(who); }, [who]);

  return (
    <MotionConfig reducedMotion={reduce ? "always" : prefs.motion === "full" ? "never" : "user"}>
      {children}
    </MotionConfig>
  );
}
