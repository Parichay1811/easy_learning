// The sunny meadow behind the splash, the "who are you?" page and every
// sign-in page: sky, drifting clouds, butterflies. All of its motion runs on
// one clock that started with the page load, so moving from one entry page to
// the next never makes the clouds or butterflies jump back to the start.
import { useLayoutEffect, useRef } from "react";
import { Butterfly } from "../Mascot/Mascot";
import s from "./EntryScene.module.css";

const FLYERS = [
  { hue: "#ff8fc8", hue2: "#ffd45c", cls: "f0" },
  { hue: "#7cc8ff", hue2: "#b69cff", cls: "f1" },
  { hue: "#ffb35c", hue2: "#ff7a7a", cls: "f2" },
];

function Cloud({ className }) {
  return (
    <svg className={className} viewBox="0 0 200 80" aria-hidden="true" focusable="false">
      <path
        d="M30 70 Q8 70 10 54 Q12 40 30 42 Q30 22 54 22 Q66 6 90 14 Q104 2 124 12 Q146 8 150 30 Q174 26 182 44 Q196 50 190 62 Q186 70 170 70 Z"
        fill="#fff"
      />
    </svg>
  );
}

export default function EntryScene({ butterflies = 3, tint }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    // Negative delay = "this has been running since the page loaded".
    ref.current?.style.setProperty("--t0", `${-(performance.now() / 1000).toFixed(2)}s`);
  }, []);
  return (
    <div ref={ref} className={s.scene} aria-hidden="true" style={tint ? { "--tint": tint } : undefined}>
      <div className={s.meadow} />
      <div className={s.sun} />
      <Cloud className={`${s.cloud} ${s.c0}`} />
      <Cloud className={`${s.cloud} ${s.c1}`} />
      {tint && <div className={s.tint} />}
      <div className={s.wash} />
      <div className={s.flock}>
        {FLYERS.slice(0, Math.max(0, Math.min(3, butterflies))).map((b) => (
          <span key={b.cls} className={`${s.flyer} ${s[b.cls]}`}>
            <Butterfly hue={b.hue} hue2={b.hue2} className={s.wings} />
          </span>
        ))}
      </div>
    </div>
  );
}
