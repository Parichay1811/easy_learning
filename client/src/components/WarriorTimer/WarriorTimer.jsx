import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaPause, FaPlay, FaAssistiveListeningSystems } from "react-icons/fa";
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
 * `waiting`: the teacher is reading the question, so the clock has not started
 * (it shows a small "listening" ear instead of ticking).
 * The learner's "Warrior clock" setting (more time / no clock) is applied by
 * useQuestionRound, which passes the longer `total` or shows no clock at all.
 * `timedOut`: the clock reached zero. It never costs a star: the question stays
 * open and the clock just says "take your time".
 */
export default function WarriorTimer({ total, left, running, paused, timedOut, onTogglePause, waiting = false, className = "" }) {
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

  // The clock ran out: it stops at zero and says "take your time" (no alarm:
  // the question stays open and nothing is lost).

  const frac = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0;
  const phase = timedOut ? "out" : left <= 5 ? "last" : left <= 10 ? "warm" : "calm";
  const ticking = running && ticksAt(left);
  const R = 20;
  const C = 2 * Math.PI * R;

  const label = paused
    ? t("warriorTimer.resume", { defaultValue: "Resume the clock ({{n}} seconds left)", n: left })
    : waiting
      ? t("warriorTimer.waiting", { defaultValue: "The clock waits while the teacher reads ({{n}} seconds)", n: left })
      : t("warriorTimer.pause", { defaultValue: "Pause the clock ({{n}} seconds left)", n: left });

  return (
    <button
      type="button"
      className={`${styles.timer} ${styles[phase]} ${paused ? styles.paused : ""} ${waiting && !paused ? styles.waiting : ""} ${className}`}
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
          ? t("warriorTimer.takeYourTime", { defaultValue: "Take your time" })
          : paused ? <><FaPlay /> {t("warriorTimer.paused", { defaultValue: "Paused" })}</>
            : waiting ? <><FaAssistiveListeningSystems /> {t("warriorTimer.listening", { defaultValue: "Listen first" })}</> : null}
      </span>
      <span className={styles.srOnly} aria-live="polite">
        {timedOut ? t("warriorTimer.takeYourTimeLong", { defaultValue: "The clock has stopped. Take your time." }) : left === 10 || left === 5 ? t("warriorTimer.secondsLeft", { defaultValue: "{{n}} seconds left", n: left }) : ""}
      </span>
    </button>
  );
}
