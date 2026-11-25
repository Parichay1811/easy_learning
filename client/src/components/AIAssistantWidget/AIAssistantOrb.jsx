import { useEffect, useRef } from "react";
import { useLiteMode } from "../../utils/useLiteMode";
import styles from "./AIAssistantWidget.module.css";

// The AI voice assistant's "face": a small rotating, pulsing icosphere shaded
// like plasma.
//
// What is always there is a still orb drawn in CSS. The moving one (three.js,
// orbScene.js) is fetched only when an orb is actually on screen, draws only
// while it is on screen and the tab is in front, and is not used at all in lite
// mode (less movement, fewer distractions, Save-Data, a weak device:
// utils/useLiteMode.js) or without WebGL: the CSS orb carries the look.
const AIAssistantOrb = ({ size = 64 }) => {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const lite = useLiteMode();

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (lite || !host || !canvas || !("IntersectionObserver" in window)) return undefined;

    let orb = null;
    let loading = false;
    let gone = false;
    let onScreen = false;

    const sync = () => {
      if (gone) return;
      const run = onScreen && !document.hidden;
      if (orb) {
        if (run) orb.start(); else orb.stop();
        return;
      }
      if (!run || loading) return;
      loading = true;
      import("./orbScene.js")
        .then(({ createOrb }) => {
          if (gone) return;
          orb = createOrb(canvas, size);
          orb.draw();
          host.dataset.live = "true";
          sync();
        })
        .catch(() => { /* no WebGL, or the chunk did not arrive: the CSS orb stays */ });
    };

    const io = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; sync(); });
    io.observe(host);
    document.addEventListener("visibilitychange", sync);

    return () => {
      gone = true;
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      orb?.dispose();
      delete host.dataset.live;
    };
  }, [size, lite]);

  return (
    <span ref={hostRef} className={styles.orb} style={{ "--orb": `${size}px` }} aria-hidden="true">
      {/* A new canvas after lite mode: a canvas that has given up its WebGL context cannot get another. */}
      <canvas key={lite ? "still" : "live"} ref={canvasRef} width={size} height={size} />
    </span>
  );
};

export default AIAssistantOrb;
