import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaPause, FaPlay, FaStop, FaRedo, FaClosedCaptioning } from "react-icons/fa";
import { pauseNarration, resumeNarration, stopNarration, replayNarration, canReplay } from "../../utils/narrator";
import { usePrefs } from "../settings/usePrefs";
import { useNarration, useHasVoiceBarHost } from "./useNarration";
import styles from "./VoiceBar.module.css";

/**
 * The teacher's captions and voice controls, floating at the bottom of the
 * screen while she speaks: the sentence being said (when the Captions setting
 * is on), Pause / Resume, Stop, and Replay for a moment after she finishes.
 * Hidden on pages that show their own (the question card) and when `hidden`.
 *
 *   <VoiceBar />            // mounted once in App.jsx
 */
export default function VoiceBar({ hidden = false }) {
  const { t } = useTranslation();
  const prefs = usePrefs();
  const n = useNarration();
  const hosted = useHasVoiceBarHost();
  const show = !hidden && !hosted && (n.speaking || n.recent);
  // With no voice the words are the only way to get the message: shown whatever the Captions setting.
  const captions = (prefs.captions || n.source === "none") && n.caption !== false && n.sentence;

  return (
    <div className={styles.dock} aria-hidden={show ? undefined : "true"}>
      {/* Always in the page, so screen readers hear each sentence as it changes. */}
      <p className={styles.srOnly} aria-live="polite">{show && captions ? n.sentence : ""}</p>
      {show && (
        <div className={`${styles.bar} ${captions ? "" : styles.compact}`} role="region" aria-label={t("voiceBar.label", "The teacher's voice")}>
          {captions ? (
            <p className={`${styles.caption} ${n.source === "none" ? styles.allWords : ""}`} aria-hidden="true">
              <FaClosedCaptioning className={styles.ccIcon} aria-hidden="true" />
              <span>{n.sentence}</span>
            </p>
          ) : null}
          {n.source === "none" && (
            <span className={styles.note} data-no-voice={n.unavailable || ""}>
              {n.unavailable
                ? t("journey.voice.noVoiceLang", "No voice for this language on this device. Here are the words.")
                : t("voiceBar.noVoice", "No voice on this device: here are the words.")}
            </span>
          )}
          <div className={styles.controls}>
            {n.speaking ? (
              <>
                <button
                  type="button"
                  className={styles.btn}
                  onClick={() => (n.paused ? resumeNarration() : pauseNarration())}
                  aria-label={n.paused ? t("voiceBar.resume", "Carry on") : t("voiceBar.pause", "Pause")}
                  title={n.paused ? t("voiceBar.resume", "Carry on") : t("voiceBar.pause", "Pause")}
                  data-sound="none"
                >
                  {n.paused ? <FaPlay aria-hidden="true" /> : <FaPause aria-hidden="true" />}
                </button>
                <button type="button" className={styles.btn} onClick={stopNarration} aria-label={t("voiceBar.stop", "Stop talking")} title={t("voiceBar.stop", "Stop talking")} data-sound="none">
                  <FaStop aria-hidden="true" />
                </button>
              </>
            ) : canReplay() ? (
              <button type="button" className={styles.btn} onClick={() => replayNarration()} aria-label={t("voiceBar.replay", "Say it again")} title={t("voiceBar.replay", "Say it again")} data-sound="none">
                <FaRedo aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Stops the teacher mid-sentence when the page changes, and when the learner
 * picks another language: words already on their way are in the old language,
 * and the page fetches its text again in the new one (mounted in App.jsx,
 * inside the Router).
 */
export function StopVoiceOnNavigate() {
  const { pathname } = useLocation();
  const { i18n } = useTranslation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    stopNarration();
  }, [pathname]);
  useEffect(() => {
    let lang = i18n.language;
    const onChange = (next) => {
      if (next === lang) return;
      lang = next;
      stopNarration();
    };
    i18n.on("languageChanged", onChange);
    return () => i18n.off("languageChanged", onChange);
  }, [i18n]);
  return null;
}
