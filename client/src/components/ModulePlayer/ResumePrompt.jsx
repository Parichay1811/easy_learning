import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaPlay, FaRedo } from "react-icons/fa";
import Mascot from "../Mascot/Mascot";
import { narrate } from "../../utils/narrator";
import { getSpeechLang } from "../../utils/speechLang";
import { langOfKey } from "../journey/words";
import { getPrefs } from "../../utils/learnerPrefs";
import { afterSplash } from "../Entry/splashSignal";
import s from "./ResumePrompt.module.css";

/**
 * "Last time you answered 3 of 10 questions": an unfinished round (kept by the server
 * across reloads and sign-ins) can be carried on from there, or started fresh.
 * Shown in place of the question, so nothing is read aloud behind it.
 *
 *   <ResumePrompt position={3} total={10} onCarryOn={…} onFresh={…} />
 */
export default function ResumePrompt({ position, total, onCarryOn, onFresh, busy = false }) {
  const { t, i18n } = useTranslation();
  const goRef = useRef(null);
  const n = position + 1;
  const line = t("journey.resume.text", { defaultValue: "Last time you answered {{done}} of {{total}} questions. Would you like to carry on from question {{n}}?", done: position, n, total });

  useEffect(() => {
    goRef.current?.focus();
    if (!getPrefs().autoRead) return undefined;
    let id = 0;
    const cancel = afterSplash(() => { id = setTimeout(() => narrate(line, { lang: getSpeechLang(langOfKey(i18n, "journey.resume.text")) }), 400); });
    return () => { cancel(); clearTimeout(id); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className={s.card} aria-labelledby="resume-title" aria-describedby="resume-text" data-resume-prompt="">
      <Mascot size="clamp(64px, 16cqh, 120px)" mood="wave" butterfly={false} />
      <h2 id="resume-title" className={s.title}>{t("journey.resume.title", "Welcome back!")}</h2>
      <p id="resume-text" className={s.text}>{line}</p>
      <div className={s.actions}>
        <button ref={goRef} type="button" className={s.go} onClick={onCarryOn} disabled={busy} data-sound="forward" data-resume="carry-on">
          <FaPlay aria-hidden="true" /> {t("journey.resume.carryOn", { defaultValue: "Carry on from question {{n}}", n })}
        </button>
        <button type="button" className={s.fresh} onClick={onFresh} disabled={busy} data-resume="fresh">
          <FaRedo aria-hidden="true" /> {t("journey.resume.fresh", "Start fresh")}
        </button>
      </div>
    </section>
  );
}
