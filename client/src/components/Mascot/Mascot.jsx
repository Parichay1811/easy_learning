import mascotImg from "../../assets/dash/mascot.webp";
import styles from "./Mascot.module.css";

// Learnigo's puppy, alive: it breathes, bobs and now and then tilts its head,
// with a butterfly that flutters around it. Moods change the motion:
//   idle  – gentle breathing bob (the default)
//   wave  – a happy side-to-side wiggle (greeting someone)
//   cheer – a little hop (a right answer, a finished round)
//   think – a slow, curious head tilt (while something loads)
// Decorative: hidden from screen readers unless `alt` is given. Motion stops
// for people who ask their device for less motion.
export default function Mascot({ size = 160, mood = "idle", butterfly = true, alt = "", className = "", style }) {
  return (
    <div
      className={`${styles.wrap} ${styles[mood] || ""} ${className}`}
      style={{ "--mascot-size": typeof size === "number" ? `${size}px` : size, ...style }}
      aria-hidden={alt ? undefined : true}
    >
      <div className={styles.shadow} />
      <img className={styles.dog} src={mascotImg} alt={alt} draggable="false" />
      {butterfly && <Butterfly className={styles.orbit} />}
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
  const all = [
    { hue: "#ff8fc8", hue2: "#ffd45c" },
    { hue: "#7cc8ff", hue2: "#b69cff" },
    { hue: "#ffb35c", hue2: "#ff7a7a" },
    { hue: "#8be28b", hue2: "#ffe270" },
  ];
  return (
    <div className={styles.flock} aria-hidden="true">
      {all.slice(0, Math.max(1, Math.min(4, count))).map((b, i) => (
        <Butterfly key={i} className={`${styles.flyer} ${styles[`path${i}`]}`} hue={b.hue} hue2={b.hue2} />
      ))}
    </div>
  );
}
