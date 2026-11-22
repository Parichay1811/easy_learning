import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaLightbulb, FaVolumeUp, FaStop, FaArrowRight } from "react-icons/fa";
import { narrate, stopNarration, onNarration } from "../../utils/narrator";
import { getSpeechLang } from "../../utils/speechLang";
import { getPrefs } from "../../utils/learnerPrefs";
import { afterSplash } from "../Entry/splashSignal";
import s from "./ExplainCard.module.css";

/**
 * "Let's look at this idea": a short explanation of an idea that has tripped
 * the learner up twice (the round item's support.strategy "misconception" with
 * support.explain { text, skill }, or the last answer's learn.explain), shown
 * before the question. It is read aloud on request (or by itself with the
 * "Read each question aloud" setting), in its own language.
 *
 *   <ExplainCard explain={{ text, skill }} lang="de" onReady={() => …} />
 */
export default function ExplainCard({ explain, lang, onReady }) {
  const { t } = useTranslation();
  const [speakingId, setSpeakingId] = useState(null);
  const readyRef = useRef(null);
  const text = String(explain?.text || "").trim();
  // The explanation's own language (explain.lang), else the card's. When it is
  // not the card's language (only English exists for it), the words are shown
  // with a note and never spoken in a language the learner did not choose.
  const cardLang = String(lang || "en").split("-")[0].toLowerCase();
  const textLang = String(explain?.lang || lang || "en").split("-")[0].toLowerCase();
  const otherLang = textLang !== cardLang;
  const speechLang = getSpeechLang(textLang);
  const skill = explain?.skill ? t(`skills.${explain.skill}`, { defaultValue: explain.skillName || "" }) : "";

  // No voice for this language here: say so (the words are on the card).
  const [noVoice, setNoVoice] = useState(false);
  useEffect(() => onNarration((e) => {
    if (e.type === "end") setSpeakingId((id) => (id === e.id ? null : id));
    if (e.type === "unavailable") setNoVoice(true);
  }), []);

  const read = (user) => {
    const off = onNarration((e) => { if (e.type === "start") { setSpeakingId(e.id); off(); } });
    narrate(text, { lang: speechLang, user }).finally(off);
  };

  // Read by itself only when the learner asked for questions to be read aloud.
  useEffect(() => {
    readyRef.current?.focus();
    if (!getPrefs().autoRead || !text || otherLang) return undefined;
    let id = 0;
    const cancel = afterSplash(() => { id = setTimeout(() => read(false), 400); });
    return () => { cancel(); clearTimeout(id); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    if (speakingId) { stopNarration(); setSpeakingId(null); return; }
    read(true);
  };
  const ready = () => { stopNarration(); onReady?.(); };

  return (
    <section className={s.card} aria-labelledby="explain-title" data-explain="">
      <span className={s.icon} aria-hidden="true"><FaLightbulb /></span>
      <h2 id="explain-title" className={s.title}>{t("journey.explain.title", "Let's look at this idea")}</h2>
      {skill && <p className={s.skill}>{skill}</p>}
      <p className={`${s.text} ${speakingId ? s.reading : ""}`} lang={textLang}>{text}</p>
      {otherLang && <p className={s.note}>{t("journey.explain.onlyEnglish", "This explanation is only in English for now.")}</p>}
      {noVoice && !otherLang && <p className={s.note} role="status">{t("journey.voice.noVoiceLang", "No voice for this language on this device. Here are the words.")}</p>}
      <div className={s.actions}>
        {!otherLang && (
          <button type="button" className={s.speak} onClick={toggle} aria-pressed={Boolean(speakingId)} data-sound="none">
            {speakingId ? <FaStop aria-hidden="true" /> : <FaVolumeUp aria-hidden="true" />}
            {speakingId ? t("journey.explain.stop", "Stop reading") : t("journey.explain.read", "Read it to me")}
          </button>
        )}
        <button ref={readyRef} type="button" className={s.ready} onClick={ready} data-sound="forward">
          {t("journey.explain.ready", "I'm ready for the question")} <FaArrowRight aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
