import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaSlidersH } from "react-icons/fa";
import Sheet from "../dashboard/Sheet";
import { setPrefs, resetPrefs } from "../../utils/learnerPrefs";
import { usePrefs } from "./usePrefs";
import SupportsForm from "./SupportsForm";
import { OPEN_COMFORT_EVENT, openComfortSettings, holdClock } from "./comfortEvents";
import styles from "./ComfortSettings.module.css";

/**
 * The learner's "Comfort settings" sheet: presets and every setting, each
 * with a plain explanation. Changes apply at once to the whole site (the live
 * preview), are kept in this browser, and in the learner's profile when signed
 * in. Mounted once in App.jsx; opened with openComfortSettings() (comfortEvents.js).
 */
export function ComfortSettingsHost() {
  const { t } = useTranslation();
  const prefs = usePrefs();
  const [open, setOpen] = useState(false);
  // A phone on its side has little height: the sheet drops its subtitle there.
  const short = typeof window !== "undefined" && window.matchMedia?.("(max-height: 500px)").matches;

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_COMFORT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_COMFORT_EVENT, onOpen);
  }, []);
  // The Warrior clock waits while the sheet is open.
  useEffect(() => {
    holdClock("settings", open);
  }, [open]);

  if (!open) return null;
  return (
    <Sheet
      title={t("prefs.title", "Comfort settings")}
      text={short ? undefined : t("prefs.subtitle", "Make Learnigo comfortable for you. Changes show straight away and you can change them any time.")}
      onClose={() => setOpen(false)}
      size="lg"
      theme="light"
      className={styles.sheet}
      footer={(
        <>
          <button type="button" className={styles.secondary} onClick={() => resetPrefs()} data-sound="tap">
            {t("prefs.reset", "Back to how it started")}
          </button>
          <button type="button" className={styles.primary} onClick={() => setOpen(false)} data-sound="close" data-autofocus>
            {t("prefs.done", "Done")}
          </button>
        </>
      )}
    >
      <SupportsForm value={prefs} onChange={(next, patch) => setPrefs(patch || next)} />
    </Sheet>
  );
}

/**
 * The button that opens the sheet. `variant`: "nav" (the navbar, beside the
 * sound switch) or "hud" (a round icon in the question HUD).
 */
export function ComfortSettingsButton({ variant = "nav", className = "", showLabel = false }) {
  const { t } = useTranslation();
  const label = t("prefs.open", "Comfort settings");
  return (
    <button
      type="button"
      className={`${styles.trigger} ${styles[variant] || ""} ${className}`}
      onClick={openComfortSettings}
      aria-label={label}
      title={label}
      aria-haspopup="dialog"
      data-sound="none"
    >
      <FaSlidersH aria-hidden="true" />
      {showLabel && <span className={styles.triggerText}>{label}</span>}
    </button>
  );
}

export default ComfortSettingsHost;
