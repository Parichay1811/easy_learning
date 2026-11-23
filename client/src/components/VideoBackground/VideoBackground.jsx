import { useEffect, useRef, useState } from "react";
import styles from "./VideoBackground.module.css";
import { usePrefs } from "../settings/usePrefs";
import { useCalmMotion } from "../../utils/useCalmMotion";
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

// Fixed, full-viewport background video that swaps source as the viewport
// crosses the mobile/tablet/laptop breakpoints. Purely decorative — no
// pointer events, no effect on page layout or functionality.
const VideoBackground = () => {
  const [src, setSrc] = useState(getSource);
  // "Fewer distractions" (focus mode): no moving video at all, just the calm overlay.
  const { focusMode } = usePrefs();
  // Less movement (the learner's setting, or the device's): the video holds
  // still on a frame instead of playing.
  const calm = useCalmMotion();
  const videoRef = useRef(null);

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

  // Play whenever the film is shown (it is not shown at all for less movement or
  // fewer distractions: the still poster is the background then).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    try { v.play()?.catch?.(() => { /* autoplay refused: the poster stays */ }); } catch { /* no media support */ }
  }, [calm, src, focusMode]);

  const poster = POSTERS.get(src);
  // Still meadow (no download of the film at all) for less movement or fewer distractions.
  const still = calm || focusMode;
  return (
    <div className={styles.wrapper} aria-hidden="true" style={{ backgroundImage: `url(${poster})` }}>
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
};

export default VideoBackground;
