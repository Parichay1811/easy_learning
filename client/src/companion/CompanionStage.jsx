import { useEffect } from "react";
import { useCalmMotion } from "../utils/useCalmMotion";
import { usePrefs } from "../components/settings/usePrefs";
import { startCompanion } from "./stage";
import { startButterflies } from "./butterflies";

// Mount once, inside the router and outside the error boundary (the companion can
// then come and comfort the learner on the error screen).
//
// Off, and every <Mascot> shows the still picture as before, when the learner asked
// for less movement or fewer distractions, when the device asks for reduced motion,
// or when the browser asks to save data. Everything still works without it.
function saveData() {
  try { return Boolean(navigator.connection?.saveData); } catch { return false; }
}

export default function CompanionStage() {
  const calm = useCalmMotion();
  const { focusMode } = usePrefs();
  const on = !calm && !focusMode && !saveData() && typeof window !== "undefined" && !window.__LEARNIGO_NO_COMPANION__;

  useEffect(() => {
    if (!on) return undefined;
    // What the dog is doing, as data-* on <html> (tests and debugging read it).
    const root = document.documentElement.dataset;
    const dog = startCompanion({
      onState: (st) => {
        if ("live" in st) root.companionLive = String(st.live);
        if (st.clip) { root.companionClip = st.clip; root.companionBeat = st.kind; }
      },
    });
    const flock = startButterflies();
    return () => {
      dog.stop();
      flock.stop();
      delete root.companionLive;
      delete root.companionClip;
      delete root.companionBeat;
    };
  }, [on]);

  return null;
}
