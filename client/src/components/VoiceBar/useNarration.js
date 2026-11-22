import { useEffect, useState, useSyncExternalStore } from "react";
import { onNarration, getNarrationState } from "../../utils/narrator";

/**
 * What the narrator is saying, for captions and controls:
 * { speaking, paused, sentence, source, id, recent (just finished), unavailable (a language
 * this device has no voice for: the words are shown instead) }.
 */
export function useNarration() {
  const [state, setState] = useState(() => ({ ...getNarrationState(), id: 0, lastEnded: 0, recent: false }));
  useEffect(() => onNarration((e) => {
    if (e.type === "end") {
      // After she finishes, the words stay a moment (with Replay); longer when
      // there was no voice at all, so they can be read.
      const ms = e.source === "none" ? Math.min(9000, 2500 + (e.text || "").length * 60) : 2200;
      setTimeout(() => setState((s) => (s.id === e.id && !s.speaking ? { ...s, recent: false } : s)), ms);
    }
    setState((s) => {
      switch (e.type) {
        case "start": return { ...s, speaking: true, paused: false, sentence: "", id: e.id, source: null, caption: e.caption !== false, unavailable: null };
        case "unavailable": return e.id === s.id ? { ...s, unavailable: e.lang || true } : s;
        case "sentence": return { ...s, speaking: true, sentence: e.text, source: e.source, id: e.id, caption: e.caption !== false };
        case "pause": return { ...s, paused: true };
        case "resume": return { ...s, paused: false };
        // Nothing was said (no voice): all the words stay up, not just the last sentence.
        case "end": return e.id === s.id
          ? { ...s, speaking: false, paused: false, recent: true, source: e.source || s.source, ...(e.source === "none" && e.text ? { sentence: e.text } : {}) }
          : s;
        default: return s;
      }
    });
  }), []);
  return state;
}

// Pages that show their own captions/controls (the question card) hide the
// floating bar while they are on screen.
let hosts = 0;
const hostListeners = new Set();
export function useVoiceBarHost(active = true) {
  useEffect(() => {
    if (!active) return undefined;
    hosts += 1;
    hostListeners.forEach((fn) => fn(hosts));
    return () => {
      hosts -= 1;
      hostListeners.forEach((fn) => fn(hosts));
    };
  }, [active]);
}
const subscribeHosts = (cb) => {
  hostListeners.add(cb);
  return () => hostListeners.delete(cb);
};
const hostCount = () => hosts;
export function useHasVoiceBarHost() {
  return useSyncExternalStore(subscribeHosts, hostCount, hostCount) > 0;
}
