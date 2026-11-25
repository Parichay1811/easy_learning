import { useEffect } from "react";
import { saveData, useLiteMode } from "../utils/useLiteMode";

// Mount once, inside the router and outside the error boundary (the companion can
// then come and comfort the learner on the error screen).
//
// Off, and every <Mascot> shows the still picture as before, in lite mode
// (utils/useLiteMode.js): the learner asked for less movement or fewer distractions,
// the device asks for reduced motion or is a weak one, or the browser asks to save
// data. Everything still works without it.
//
// The companion's code (the stage, the WebGL player, the butterflies) is fetched only
// when it is going to run, after the page has drawn.
export default function CompanionStage() {
  const lite = useLiteMode();
  const on = !lite && !saveData() && typeof window !== "undefined" && !window.__LEARNIGO_NO_COMPANION__;

  useEffect(() => {
    if (!on) return undefined;
    // What the dog is doing, as data-* on <html> (tests and debugging read it).
    const root = document.documentElement.dataset;
    let gone = false;
    let dog = null;
    let flock = null;
    // Each on its own: if one chunk does not arrive, the other still plays (and without
    // either, the still pictures stay).
    import("./stage")
      .then(({ startCompanion }) => {
        if (gone) return;
        dog = startCompanion({
          onState: (st) => {
            if (gone) return;
            if ("live" in st) root.companionLive = String(st.live);
            if (st.clip) { root.companionClip = st.clip; root.companionBeat = st.kind; }
          },
        });
      })
      .catch(() => {});
    import("./butterflies")
      .then(({ startButterflies }) => { if (!gone) flock = startButterflies(); })
      .catch(() => {});
    return () => {
      gone = true;
      dog?.stop();
      flock?.stop();
      delete root.companionLive;
      delete root.companionClip;
      delete root.companionBeat;
    };
  }, [on]);

  return null;
}
