// True while a media query matches (and follows it as the window changes).
import { useEffect, useState } from "react";

export const COMPACT = "(max-width: 700px), (max-height: 500px)";
// Where the full time-range bar would wrap or eat a short screen: use the one-line pill.
export const RANGE_COMPACT = "(max-width: 1100px), (max-height: 820px)";

export function useMedia(query) {
  const [match, setMatch] = useState(() => (typeof window !== "undefined" ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}
