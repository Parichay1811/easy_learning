import { useEffect, useRef, useState } from "react";
import styles from "./VideoBackground.module.css";
import { usePrefs } from "../settings/usePrefs";
import { useCalmMotion } from "../../utils/useCalmMotion";
import laptopVideo from "../../assets/videos/bg-laptop.mp4";
import tabletVideo from "../../assets/videos/bg-tab.mp4";
import mobileVideo from "../../assets/videos/bg-mobile.mp4";

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

  // Play, or pause on the frame it shows (the first one, when it never
  // started), whenever "less movement" changes or the video is swapped.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;
    if (!calm) {
      try { v.play()?.catch?.(() => { /* autoplay refused: it stays on a still frame */ }); } catch { /* no media support */ }
      return undefined;
    }
    v.pause();
    // A paused video that never played can paint nothing (iOS Safari):
    // seeking a hair in makes the browser decode and show the first frame.
    const still = () => { try { if (v.currentTime < 0.01) v.currentTime = 0.01; } catch { /* not seekable yet */ } };
    if (v.readyState >= 1) still();
    else v.addEventListener("loadedmetadata", still, { once: true });
    return () => v.removeEventListener("loadedmetadata", still);
  }, [calm, src, focusMode]);

  return (
    <div className={styles.wrapper} aria-hidden="true">
      {!focusMode && <video
        key={src}
        ref={videoRef}
        className={styles.video}
        src={src}
        autoPlay={!calm}
        muted
        loop
        playsInline
        preload={calm ? "metadata" : "auto"}
      />}
      <div className={styles.overlay} />
    </div>
  );
};

export default VideoBackground;
