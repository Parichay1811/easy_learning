import { useEffect, useRef } from "react";
import { useLiteMode } from "../../utils/useLiteMode";
import styles from "./Background3D.module.css";

const BRICK_COLORS = ["#e53935", "#1e88e5", "#43a047", "#fb8c00", "#fdd835", "#8e44ad"];

const BRICKS = Array.from({ length: 14 }, (_, i) => {
  const size = 44 + ((i * 37) % 70);
  return {
    id: i,
    size,
    studs: size > 78 ? 4 : 2,
    color: BRICK_COLORS[i % BRICK_COLORS.length],
    top: (i * 53) % 100,
    left: (i * 71) % 100,
    depth: -420 + ((i * 97) % 820),
    duration: 14 + (i % 6) * 3,
    delay: -(i * 1.7),
    spin: i % 2 === 0 ? 1 : -1,
  };
});

// Fixed, non-interactive (pointer-events: none) full-viewport layer mounted once
// at the app root so every page/dashboard shares the same animated backdrop.
//
// The scene leans a little towards the pointer (or the way a phone is held). It
// works only while it is moving: the frame loop stops as soon as the scene has
// settled and starts again on the next movement. In lite mode (less movement,
// fewer distractions, Save-Data, a weak device: utils/useLiteMode.js) nothing
// listens and the bricks hold still (Background3D.module.css).
const Background3D = () => {
  const sceneRef = useRef(null);
  const lite = useLiteMode();

  useEffect(() => {
    if (lite) return undefined;
    const scene = sceneRef.current;
    let frame = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const tick = () => {
      frame = 0;
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      const settled = Math.abs(tx - cx) < 0.02 && Math.abs(ty - cy) < 0.02;
      if (settled) { cx = tx; cy = ty; }
      if (scene) scene.style.transform = `rotateX(${cy.toFixed(2)}deg) rotateY(${cx.toFixed(2)}deg)`;
      if (!settled) frame = requestAnimationFrame(tick);
    };
    const aim = (x, y) => {
      // A change too small to see does not wake the loop (a phone's tilt sensor never rests).
      if (Math.abs(x - tx) < 0.25 && Math.abs(y - ty) < 0.25) return;
      tx = x;
      ty = y;
      if (!frame && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const toward = (clientX, clientY) => {
      const x = (clientX / window.innerWidth - 0.5) * 2;
      const y = (clientY / window.innerHeight - 0.5) * 2;
      aim(x * 8, -y * 6);
    };

    const onMouseMove = (e) => toward(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      if (e.touches?.[0]) toward(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onOrientation = (e) => {
      if (e.gamma == null || e.beta == null) return;
      aim(Math.max(-10, Math.min(10, e.gamma / 3)), Math.max(-8, Math.min(8, (e.beta - 45) / 4)));
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("deviceorientation", onOrientation, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("deviceorientation", onOrientation);
      if (scene) scene.style.transform = "";
    };
  }, [lite]);

  return (
    <div className={styles.wrapper} aria-hidden="true" data-decorative>
      <div className={styles.scene} ref={sceneRef}>
        {BRICKS.map((b) => (
          <div
            key={b.id}
            className={styles.brick}
            style={{
              "--size": `${b.size}px`,
              "--color": b.color,
              "--top": `${b.top}%`,
              "--left": `${b.left}%`,
              "--depth": `${b.depth}px`,
              "--duration": `${b.duration}s`,
              "--delay": `${b.delay}s`,
              "--spin": b.spin,
            }}
          >
            <div className={styles.studRow}>
              {Array.from({ length: b.studs }, (_, s) => (
                <span key={s} className={styles.stud} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Background3D;
