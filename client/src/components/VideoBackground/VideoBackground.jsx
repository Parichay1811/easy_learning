import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import styles from "./VideoBackground.module.css";
import { useLiteMode } from "../../utils/useLiteMode";
// The meadow without the puppy and butterflies that used to be painted into it: the
// live companion and butterflies (companion/) play those parts now. Each loop is
// ~0.5 MB (was 7-10 MB) and has a still poster that paints at once
// (tools/companion/plates.mjs makes them).
import laptopVideo from "../../assets/videos/meadow-laptop.mp4";
import tabletVideo from "../../assets/videos/meadow-tab.mp4";
import mobileVideo from "../../assets/videos/meadow-mobile.mp4";
import laptopPoster from "../../assets/videos/meadow-laptop.webp";
import tabletPoster from "../../assets/videos/meadow-tab.webp";
import mobilePoster from "../../assets/videos/meadow-mobile.webp";

const POSTERS = new Map([[laptopVideo, laptopPoster], [tabletVideo, tabletPoster], [mobileVideo, mobilePoster]]);

// Same breakpoints used elsewhere in the app (Navbar mobile collapse / Hero large-desktop)
const MOBILE_QUERY = "(max-width: 767px)";
const TABLET_QUERY = "(max-width: 1199px)";

function getSource() {
  if (typeof window === "undefined") return laptopVideo;
  if (window.matchMedia(MOBILE_QUERY).matches) return mobileVideo;
  if (window.matchMedia(TABLET_QUERY).matches) return tabletVideo;
  return laptopVideo;
}

function useSource() {
  const [src, setSrc] = useState(getSource);
  useEffect(() => {
    const mobileMql = window.matchMedia(MOBILE_QUERY);
    const tabletMql = window.matchMedia(TABLET_QUERY);
    const update = () => setSrc(getSource());
    mobileMql.addEventListener("change", update);
    tabletMql.addEventListener("change", update);
    return () => {
      mobileMql.removeEventListener("change", update);
      tabletMql.removeEventListener("change", update);
    };
  }, []);
  return src;
}

// ── Who wants the meadow ─────────────────────────────────────────────────────
// Pages ask for the background by rendering <VideoBackground />; ONE film, mounted
// once in the app layout (<VideoBackgroundHost />), plays behind all of them. So the
// film does not start again on every page change, and two never play at once. When
// the last page that asked for it goes, it stays a moment (the next page is usually
// arriving), then fades and pauses.
const LINGER_MS = 700;
let claims = 0;
let wanted = false; // shown now (lags `claims` on the way out)
let used = false; // asked for at least once this visit: only then is anything downloaded
let lingerTimer = 0;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());
const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const getWanted = () => wanted;
const getUsed = () => used;
const never = () => false;

function claim() {
  claims += 1;
  clearTimeout(lingerTimer);
  if (!wanted || !used) { wanted = true; used = true; emit(); }
  return () => {
    claims -= 1;
    if (claims > 0) return;
    clearTimeout(lingerTimer);
    lingerTimer = setTimeout(() => { if (claims <= 0) { wanted = false; emit(); } }, LINGER_MS);
  };
}

// The meadow itself: the still poster at once, the film over it (not in lite mode:
// less movement, fewer distractions, Save-Data or a weak device keep the still poster
// and never download the film). The film plays only while it is shown and the tab is
// in front.
function Meadow({ shown = true }) {
  const src = useSource();
  const still = useLiteMode();
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;
    const sync = () => {
      try {
        if (shown && !document.hidden) v.play()?.catch?.(() => { /* autoplay refused: the poster stays */ });
        else v.pause();
      } catch { /* no media support */ }
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [shown, still, src]);

  const poster = POSTERS.get(src);
  return (
    <div className={`${styles.wrapper} ${shown ? "" : styles.away}`} aria-hidden="true" style={{ backgroundImage: `url(${poster})` }}>
      {!still && <video
        key={src}
        ref={videoRef}
        className={styles.video}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />}
      <div className={styles.overlay} />
    </div>
  );
}

/**
 * The one meadow behind every page that asks for it. Mount once, in the app layout,
 * before anything else that paints at z-index -1 (a later one covers it).
 */
export function VideoBackgroundHost() {
  const shown = useSyncExternalStore(subscribe, getWanted, never);
  const everUsed = useSyncExternalStore(subscribe, getUsed, never);
  if (!everUsed) return null;
  return <Meadow shown={shown} />;
}

function Claim() {
  useLayoutEffect(() => claim(), []);
  return null;
}

// Fixed, full-viewport background video that swaps source as the viewport
// crosses the mobile/tablet/laptop breakpoints. Purely decorative: no
// pointer events, no effect on page layout or functionality.
//
// A page renders this to ask for the meadow; <VideoBackgroundHost /> draws it.
// `inline` draws it right here instead, inside the page's own stacking context:
// the camera games' pages do that (their own backdrop sits under it).
const VideoBackground = ({ inline }) => {
  const { pathname } = useLocation();
  if (inline ?? pathname.startsWith("/games/ar/")) return <Meadow />;
  return <Claim />;
};

export default VideoBackground;
