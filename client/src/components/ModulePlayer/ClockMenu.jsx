import { useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaTimes, FaPause, FaPlay } from "react-icons/fa";
import { setPrefs } from "../../utils/learnerPrefs";
import { usePrefs } from "../settings/usePrefs";
import { fieldLabel, optionLabel } from "../settings/prefText";
import { holdClock } from "../settings/comfortEvents";
import styles from "./ClockMenu.module.css";

// No clock first: it is how every learner starts (docs/learning/GAME-ROADMAP.md G-005).
const CHOICES = ["off", "on", "relaxed"];
const FACTOR = { on: 1, relaxed: 2 };

/**
 * The Warrior clock's own little menu, opened from the clock in the round's
 * top bar: No clock / Normal / More time. It writes the same "Warrior clock"
 * comfort setting as the Comfort settings sheet (utils/learnerPrefs.js `timer`),
 * so the two always agree, and it says the one thing a learner needs to know:
 * the clock never takes a star away.
 *
 *   <ClockMenu baseSeconds={30} anchorRef={slotRef} onClose={close}
 *     canPause paused={userPaused} left={timeLeft} onTogglePause={togglePause} />
 *
 * The clock waits while the menu is open (comfortEvents.js holdClock). Esc, a
 * tap outside, the close button, or moving on with Tab closes it; focus goes
 * back to the clock in the bar (`anchorRef` holds that button's wrapper).
 * `canPause`: a clock is running for this question, so "Pause the clock" is offered.
 */
export default function ClockMenu({ baseSeconds = 30, anchorRef, onClose, canPause = false, paused = false, left = 0, onTogglePause }) {
  const { t } = useTranslation();
  const prefs = usePrefs();
  const ref = useRef(null);
  const titleId = useId();
  const noteId = useId();
  const name = useId();

  // The clock waits while the choices are open.
  useEffect(() => {
    holdClock("clock-menu", true);
    return () => holdClock("clock-menu", false);
  }, []);

  // Opened: start on the choice that is set now.
  useEffect(() => {
    const el = ref.current?.querySelector("input:checked") || ref.current?.querySelector("input");
    el?.focus({ preventScroll: true });
  }, []);

  const close = (refocus = true) => {
    onClose?.();
    if (refocus) anchorRef?.current?.querySelector("button")?.focus({ preventScroll: true });
  };

  // A tap anywhere else closes it (the clock in the bar toggles it itself).
  useEffect(() => {
    const onDown = (e) => {
      if (ref.current?.contains(e.target) || anchorRef?.current?.contains(e.target)) return;
      onClose?.();
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [anchorRef, onClose]);

  const onKeyDown = (e) => {
    if (e.key !== "Escape") return;
    e.stopPropagation();
    close();
  };
  // Tabbed on to the question: the menu steps out of the way (focus stays where it went).
  const onBlur = (e) => {
    const to = e.relatedTarget;
    if (to && !ref.current?.contains(to) && !anchorRef?.current?.contains(to)) close(false);
  };

  return (
    <div
      ref={ref}
      className={styles.menu}
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={noteId}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      <div className={styles.head}>
        <h2 id={titleId} className={styles.title}>{fieldLabel(t, "timer")}</h2>
        <button type="button" className={styles.close} onClick={() => close()} aria-label={t("modules.close", { defaultValue: "Close" })} data-sound="close">
          <FaTimes aria-hidden="true" />
        </button>
      </div>
      <p id={noteId} className={styles.note}>
        {t("modules.noClockHelp", "The clock is just for fun: it never takes a star away.")}
      </p>
      <div className={styles.choices} role="radiogroup" aria-labelledby={titleId}>
        {CHOICES.map((opt) => (
          <label key={opt} className={styles.choice} data-on={prefs.timer === opt || undefined}>
            <input
              type="radio"
              name={name}
              value={opt}
              checked={prefs.timer === opt}
              onChange={() => setPrefs({ timer: opt })}
            />
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.label}>{optionLabel(t, "timer", opt)}</span>
            {FACTOR[opt] && (
              <span className={styles.secs}>
                {t("modules.clockSeconds", { defaultValue: "{{n}} s", n: Math.round(baseSeconds * FACTOR[opt]) })}
              </span>
            )}
          </label>
        ))}
      </div>
      {canPause && onTogglePause && (
        <button type="button" className={styles.pause} onClick={() => { onTogglePause(); close(); }} data-sound="toggle">
          {paused ? <FaPlay aria-hidden="true" /> : <FaPause aria-hidden="true" />}
          {paused
            ? t("warriorTimer.resume", { defaultValue: "Resume the clock ({{n}} seconds left)", n: left })
            : t("warriorTimer.pause", { defaultValue: "Pause the clock ({{n}} seconds left)", n: left })}
        </button>
      )}
    </div>
  );
}
