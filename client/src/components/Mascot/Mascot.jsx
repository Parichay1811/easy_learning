import { useEffect, useLayoutEffect, useRef } from "react";
import mascotImg from "../../assets/dash/mascot.webp";
import { addSpot } from "../../companion/bus";
import { useCompanionLive } from "../../companion/useCompanionLive";
import styles from "./Mascot.module.css";

// Learnigo's puppy.
//
// A big <Mascot> (96px and up, or any CSS size such as "var(--pup)") is a place in
// the layout where the live companion may sit: while the companion is on, the one
// live dog moves into the best such place on screen (and hops between places), and
// the others keep their space but stay empty. A small one (toasts, chips) is a still
// picture. With the companion off (less movement, fewer distractions, no WebGL,
// data saver) every <Mascot> shows the still picture with its gentle CSS motion:
//   idle  – gentle breathing bob (the default)
//   wave  – a happy side-to-side wiggle (greeting someone)
//   cheer – a little hop (a right answer, a finished round)
//   think – a slow, curious head tilt (while something loads)
// For the live dog the mood is a cue: cheer = celebrate, think = curious, wave = hello.
// Decorative: hidden from screen readers unless `alt` is given.
// `fallback`: a place used only when no main place is on screen (e.g. the answer sheet
// on a phone); it folds away while the dog sits in a main place, so no empty hole shows.
export default function Mascot({ size = 160, mood = "idle", butterfly = true, alt = "", className = "", style, live, priority = 0, fallback = false }) {
  const isSpot = live ?? (typeof size !== "number" || size >= 96);
  const companionLive = useCompanionLive();
  const ref = useRef(null);
  const spotRef = useRef(null);
  const moodRef = useRef(mood);

  // Register as a place for the live companion. Layout effect: the cleanup runs before
  // the element leaves the page, so the dog can be lifted out of it in time.
  useLayoutEffect(() => {
    if (!isSpot || !ref.current) return undefined;
    const el = ref.current;
    const modal = Boolean(el.closest('[role="dialog"], [aria-modal="true"], dialog'));
    const h = addSpot({ el, priority: fallback ? -1 : priority, modal, fallback, mood: moodRef.current });
    spotRef.current = h;
    return () => { h.remove(); spotRef.current = null; };
  }, [isSpot, priority, fallback]);

  useEffect(() => {
    moodRef.current = mood;
    spotRef.current?.update({ mood });
  }, [mood]);

  const empty = isSpot && companionLive;
  return (
    <div
      ref={ref}
      className={`${styles.wrap} ${styles[mood] || ""} ${empty ? styles.liveSpot : ""} ${empty && fallback ? styles.fallbackSpot : ""} ${className}`}
      style={{ "--mascot-size": typeof size === "number" ? `${size}px` : size, ...style }}
      aria-hidden={alt ? undefined : true}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      data-mascot-spot={isSpot ? "true" : undefined}
    >
      <div className={styles.shadow} />
      <img className={styles.dog} src={mascotImg} alt="" draggable="false" />
      {butterfly && !empty && <Butterfly className={styles.orbit} />}
    </div>
  );
}

/**
 * A small butterfly with flapping wings. On its own it just flaps; give it a
 * class with a motion path (see FloatingButterflies) to make it fly.
 */
export function Butterfly({ className = "", hue = "#ff8fc8", hue2 = "#ffd45c", style }) {
  return (
    <span className={`${styles.butterfly} ${className}`} style={style} aria-hidden="true">
      <svg viewBox="0 0 40 32" width="100%" height="100%">
        <g className={styles.wingL}>
          <path d="M19 15 C 10 0, 0 4, 4 13 C 6 18, 14 18, 19 16 Z" fill={hue} />
          <path d="M19 17 C 12 20, 5 26, 10 30 C 14 32, 18 24, 19 18 Z" fill={hue2} />
          <circle cx="9" cy="10" r="2.2" fill="#fff" opacity="0.7" />
        </g>
        <g className={styles.wingR}>
          <path d="M21 15 C 30 0, 40 4, 36 13 C 34 18, 26 18, 21 16 Z" fill={hue} />
          <path d="M21 17 C 28 20, 35 26, 30 30 C 26 32, 22 24, 21 18 Z" fill={hue2} />
          <circle cx="31" cy="10" r="2.2" fill="#fff" opacity="0.7" />
        </g>
        <ellipse cx="20" cy="17" rx="1.6" ry="7" fill="#5b3a29" />
        <path d="M20 10 C 18 6, 16 5, 15 4 M20 10 C 22 6, 24 5, 25 4" stroke="#5b3a29" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/**
 * Butterflies drifting across a scene, behind the content (pointer-events off).
 * Put it inside a positioned container; `count` is 1–4.
 */
export function FloatingButterflies({ count = 3 }) {
  const live = useCompanionLive();
  const all = [
    { hue: "#ff8fc8", hue2: "#ffd45c" },
    { hue: "#7cc8ff", hue2: "#b69cff" },
    { hue: "#ffb35c", hue2: "#ff7a7a" },
    { hue: "#8be28b", hue2: "#ffe270" },
  ];
  if (live) return null; // the live butterflies (companion/butterflies.js) are flying
  return (
    <div className={styles.flock} aria-hidden="true" data-decorative>
      {all.slice(0, Math.max(1, Math.min(4, count))).map((b, i) => (
        <Butterfly key={i} className={`${styles.flyer} ${styles[`path${i}`]}`} hue={b.hue} hue2={b.hue2} />
      ))}
    </div>
  );
}
