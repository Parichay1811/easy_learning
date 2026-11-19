import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaPause, FaPlay } from "react-icons/fa";
import { sfx, haptic } from "../../utils/sounds";
import styles from "./WarriorTimer.module.css";

// When the clock makes a sound. Quiet most of the time: a soft tick at every
// ten-second mark as a reminder, every second only in the last ten, and a
// little more present in the last five (louder tick + a light buzz).
function ticksAt(left) {
  if (left <= 0) return false;
  if (left <= 10) return true;
  return left % 10 === 0;
}

/**
 * The Warrior clock: a ring that empties as time runs down, warming from calm
 * blue to amber to a soft orange (never a flashing red), and pulsing with each
 * tick. Tap it to pause.
 *
 *   <WarriorTimer total={30} left={timeLeft} running={clockRunning}
 *     paused={paused} timedOut={timedOut} onTogglePause={togglePause} />
 *
 * `running` is false whenever the question is answered, the clock is paused,
 * the page is hidden or the round is over — the clock is silent then.
 */
export default function WarriorTimer({ total, left, running, paused, timedOut, onTogglePause, className = "" }) {
  const { t } = useTranslation();
  const last = useRef(left);

  // A sound on each counted-down second (only when it actually went down while
  // running, so a reset or a re-render never ticks).
  useEffect(() => {
    const prev = last.current;
    last.current = left;
    if (!running || left >= prev || !ticksAt(left)) return;
    sfx.tick(left);
    if (left <= 5) haptic("tick");
  }, [left, running]);

  // Time's up: a soft music-box fall, once.
  useEffect(() => {
    if (!timedOut) return;
    sfx.timeUp();
    haptic("warn");
  }, [timedOut]);

  const frac = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0;
  const phase = timedOut ? "out" : left <= 5 ? "last" : left <= 10 ? "warm" : "calm";
  const ticking = running && ticksAt(left);
  const R = 20;
  const C = 2 * Math.PI * R;

  const label = paused
    ? t("warriorTimer.resume", { defaultValue: "Resume the clock ({{n}} seconds left)", n: left })
    : t("warriorTimer.pause", { defaultValue: "Pause the clock ({{n}} seconds left)", n: left });

  return (
    <button
      type="button"
      className={`${styles.timer} ${styles[phase]} ${paused ? styles.paused : ""} ${className}`}
      onClick={onTogglePause}
      disabled={timedOut || !onTogglePause}
      aria-label={label}
      title={label}
      data-sound="toggle"
    >
      {/* Remounted on every tick so its pulse animation restarts in step with the sound. */}
      <span key={ticking ? left : "still"} className={`${styles.ring} ${ticking ? styles.pulse : ""}`} aria-hidden="true">
        <svg viewBox="0 0 48 48" className={styles.svg}>
          <circle cx="24" cy="24" r={R} className={styles.track} />
          <circle
            cx="24"
            cy="24"
            r={R}
            className={styles.arc}
            strokeDasharray={C}
            strokeDashoffset={C * (1 - frac)}
          />
        </svg>
        <span className={styles.num}>{paused ? <FaPause /> : left}</span>
      </span>
      {ticking && left <= 5 && <span key={`glow-${left}`} className={styles.glow} aria-hidden="true" />}
      <span className={styles.state} aria-hidden="true">
        {timedOut
          ? t("warriorTimer.timeUp", { defaultValue: "Time's up!" })
          : paused ? <><FaPlay /> {t("warriorTimer.paused", { defaultValue: "Paused" })}</> : null}
      </span>
      <span className={styles.srOnly} aria-live="polite">
        {timedOut ? t("warriorTimer.timeUp", { defaultValue: "Time's up!" }) : left === 10 || left === 5 ? t("warriorTimer.secondsLeft", { defaultValue: "{{n}} seconds left", n: left }) : ""}
      </span>
    </button>
  );
}
