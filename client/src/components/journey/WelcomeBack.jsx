import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGuide } from "../guide/useGuide";
import { FaPlay, FaRedo, FaCompass, FaSeedling, FaVolumeUp, FaStop } from "react-icons/fa";
import Mascot from "../Mascot/Mascot";
import { narrate, stopNarration, onNarration } from "../../utils/narrator";
import { getSpeechLang } from "../../utils/speechLang";
import { msgText, actionHref, subjectLabel, moduleLabel, langOfKey } from "./words";
import s from "./journey.module.css";

const ACTION_ICON = { continue: FaPlay, review: FaRedo, new: FaCompass, start: FaSeedling };

// The server's key (learn.welcome.action.<type>) when it is translated, else ours.
function actionLabel(t, a) {
  const mine = {
    continue: t("journey.welcome.action.continue", "Continue"),
    review: t("journey.welcome.action.review", "Review"),
    new: t("journey.welcome.action.new", "Something new"),
    start: t("journey.welcome.action.start", "Start"),
  }[a.type] || t("journey.welcome.action.go", "Let's go");
  return a.key ? t(a.key, { defaultValue: mine }) : mine;
}

/**
 * "Welcome back": the message the server built from the learner's own history
 * (GET /api/learn/welcome) with its actions (Continue / Review / Something
 * new, or Let's start the first time), and a button that reads it aloud.
 *
 *   <WelcomeBack welcome={json} name="Aanya" calm={false} />
 *
 * `calm` (the server's calm flag, or the learner's own calm / reduced-motion
 * settings): a quieter card, a resting mascot, the calmer green button.
 * With no `welcome` (an older server) it says a plain hello instead.
 */
export default function WelcomeBack({ welcome, name, calm = false, headingId = "jr-welcome", compact = false }) {
  const { t, i18n } = useTranslation();
  const guide = useGuide();
  const [speakingId, setSpeakingId] = useState(null);
  const message = welcome
    ? msgText(t, welcome.message)
    : t("journey.welcome.hello", { defaultValue: "Hi, {{name}}! Here's what you could do today.", name });
  const actions = (Array.isArray(welcome?.actions) ? welcome.actions : [])
    .map((a) => ({ ...a, href: actionHref(a, a.type === "new" ? "explore" : a.type) }))
    .filter((a) => a.href)
    .slice(0, 3);
  const quiet = calm || Boolean(welcome?.calm);

  useEffect(() => onNarration((e) => {
    if (e.type === "end") setSpeakingId((id) => (id === e.id ? null : id));
  }), []);

  const readAloud = () => {
    if (speakingId) { stopNarration(); setSpeakingId(null); return; }
    const off = onNarration((e) => { if (e.type === "start") { setSpeakingId(e.id); off(); } });
    // The words' own language (an untranslated message is English words).
    const key = welcome ? welcome.message?.key : "journey.welcome.hello";
    narrate(message, { lang: getSpeechLang(langOfKey(i18n, key)), user: true }).finally(off);
  };

  const mascotSize = compact ? "clamp(52px, 9vh, 78px)" : "clamp(64px, min(11vh, 9vw), 112px)";

  return (
    <section className={`${s.card} ${s.welcome}`} aria-labelledby={headingId} data-calm={quiet || undefined} data-kind={welcome?.kind || "local"}>
      <span className={s.welcomeMascot}>
        <Mascot size={mascotSize} mood={quiet ? "idle" : welcome?.kind === "first" ? "wave" : "idle"} butterfly={!quiet} />
      </span>
      <div className={s.welcomeBody}>
        <div className={s.welcomeTop}>
          <h2 id={headingId} className={s.welcomeMsg}>{message}</h2>
          <button
            type="button"
            className={s.speak}
            onClick={readAloud}
            aria-pressed={Boolean(speakingId)}
            aria-label={speakingId ? t("journey.welcome.stopReading", "Stop reading") : t("journey.welcome.readAloud", "Read this to me")}
            title={speakingId ? t("journey.welcome.stopReading", "Stop reading") : t("journey.welcome.readAloud", "Read this to me")}
            data-sound="none"
          >
            {speakingId ? <FaStop aria-hidden="true" /> : <FaVolumeUp aria-hidden="true" />}
          </button>
        </div>
      </div>
      {actions.length > 0 && (
          <div className={s.actions}>
            {actions.map((a, i) => {
              const Icon = ACTION_ICON[a.type] || FaPlay;
              const where = [a.module && moduleLabel(t, a.module), a.subject && subjectLabel(t, a.subject)].filter(Boolean).join(" · ");
              return (
                <Link key={`${a.type}-${i}`} to={a.href} className={i === 0 ? s.primary : s.secondary} data-action={a.type} {...(i === 0 ? guide("today.go", "Tap the orange button to carry on learning.", { order: 1 }) : {})}>
                  <span className={s.btnIcon} aria-hidden="true"><Icon /></span>
                  <span className={s.btnText}>
                    <span>{actionLabel(t, a)}</span>
                    {where && i === 0 && <small>{where}</small>}
                  </span>
                </Link>
              );
            })}
          </div>
      )}
    </section>
  );
}
