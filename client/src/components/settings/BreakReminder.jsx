import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaMugHot } from "react-icons/fa";
import Mascot from "../Mascot/Mascot";
import { narrate } from "../../utils/narrator";
import { getSpeechLang } from "../../utils/speechLang";
import { usePrefs } from "./usePrefs";
import { holdClock } from "./comfortEvents";
import styles from "./BreakReminder.module.css";

// Pages where the learner is playing: the time there counts towards a break.
const PLAYING = /^\/(module|games|test|subject)\//;

/**
 * A gentle "time for a little break?" after the number of minutes in the
 * learner's Break reminders setting, counted only while they are playing and
 * the page is visible. Never blocks: "Keep going" carries on, the Warrior
 * clock waits while it is open.
 */
export default function BreakReminder() {
  const { t, i18n } = useTranslation();
  const prefs = usePrefs();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const seconds = useRef(0);
  const playing = PLAYING.test(pathname) || pathname === "/games";
  const minutes = Number(prefs.breakEvery) || 0;

  useEffect(() => {
    if (!minutes || !playing || open) return undefined;
    const id = setInterval(() => {
      if (document.hidden) return;
      seconds.current += 5;
      if (seconds.current >= minutes * 60) {
        seconds.current = 0;
        setOpen(true);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [minutes, playing, open]);

  useEffect(() => {
    holdClock("break", open);
    if (open) {
      narrate(t("breakReminder.say", { defaultValue: "You have been learning for {{n}} minutes. How about a little break?", n: minutes }), { lang: getSpeechLang(i18n.language || "en") });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;
  const close = () => { seconds.current = 0; setOpen(false); };
  return (
    <div className={styles.wrap} role="dialog" aria-modal="false" aria-labelledby="break-title" aria-describedby="break-text">
      <div className={styles.card}>
        <Mascot size={64} mood="wave" butterfly={false} />
        <div className={styles.text}>
          <h2 id="break-title" className={styles.title}><FaMugHot aria-hidden="true" /> {t("breakReminder.title", "Time for a little break?")}</h2>
          <p id="break-text" className={styles.body}>
            {t("breakReminder.text", { defaultValue: "You have been learning for {{n}} minutes. Stretch, have a drink of water and rest your eyes. Your place is kept.", n: minutes })}
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.rest} onClick={close} data-sound="close">{t("breakReminder.rest", "I'll take a break")}</button>
            <button type="button" className={styles.go} onClick={close} data-sound="forward" autoFocus>{t("breakReminder.keepGoing", "Keep going")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
