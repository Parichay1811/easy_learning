import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaPlay, FaStop, FaGlobeEurope, FaClosedCaptioning, FaInfoCircle } from "react-icons/fa";
import { sfx } from "../../utils/sounds";
import { getSpeechLang } from "../../utils/speechLang";
import { PREVIEW_LANGS } from "./previewData";
import { useDemoVoice } from "./useDemoVoice";
import board from "./Board.module.css";
import shell from "./Landing.module.css";
import styles from "./LanguagePreview.module.css";

const LETTERS = ["A", "B", "C"];

function initialLang(i18n) {
  const base = String(i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);
  return PREVIEW_LANGS.some((l) => l.code === base) ? base : "en";
}

/**
 * The same sample question in four of the site's languages. Play speaks the
 * chosen language's script with the site's narrator; when this device has no
 * voice for it, the page says so and shows the words (never another
 * language's voice).
 */
export default function LanguagePreview() {
  const { t, i18n } = useTranslation();
  const voice = useDemoVoice({ strict: true });
  const uid = useId();
  const [code, setCode] = useState(() => initialLang(i18n));
  const lang = PREVIEW_LANGS.find((l) => l.code === code) || PREVIEW_LANGS[0];
  const playing = voice.speaking && voice.key === code;
  const noVoice = voice.key === code && voice.noVoice && !voice.speaking;

  const pick = (c) => {
    if (c === code) return;
    voice.stop();
    sfx.tab();
    setCode(c);
  };

  const play = () => {
    sfx.tap();
    voice.play(lang.script, { lang: getSpeechLang(lang.code), key: lang.code });
  };

  return (
    <section id="landing-languages" className={`${shell.section} ${shell.rise}`} aria-labelledby={`${uid}-title`}>
      <div className={shell.head}>
        <p className={shell.eyebrow}><FaGlobeEurope aria-hidden="true" /> {t("landing.languages.eyebrow", "14 languages")}</p>
        <h2 id={`${uid}-title`} className={shell.title}>{t("landing.languages.title", "One question, many languages")}</h2>
        <p className={shell.lead}>
          {t("landing.languages.lead", "Learnigo works in 14 languages. Here is the sample's first question in four of them. Play speaks it with a voice for that language.")}
        </p>
      </div>

      <div className={styles.picker} role="group" aria-label={t("landing.languages.pick", "Choose a language")}>
        {PREVIEW_LANGS.map((l) => (
          <button
            key={l.code}
            type="button"
            lang={l.code}
            className={`${styles.langBtn} ${l.code === code ? styles.langOn : ""}`}
            aria-pressed={l.code === code}
            onClick={() => pick(l.code)}
            data-sound="none"
          >
            {l.native}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        <div className={board.board} lang={lang.code}>
          <h3 className={board.instruction}>{lang.instruction}</h3>
          <div className={board.emoji} aria-hidden="true">🧊</div>
          <p className={board.promptBox}>{lang.prompt}</p>
          <ul className={board.options}>
            {lang.options.map((o, i) => (
              <li key={o} className={`${board.option} ${board.static}`}>
                <span className={board.letter} aria-hidden="true">{LETTERS[i]}</span>
                <span className={board.optText}>{o}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.side}>
          <p className={styles.sideLabel}>{t("landing.languages.scriptLabel", "Spoken script")}</p>
          <p className={styles.script} lang={lang.code}>{lang.script}</p>
          <div className={shell.btnRow}>
            <button type="button" className={shell.secondary} onClick={play} data-sound="none">
              <FaPlay aria-hidden="true" /> {t("landing.languages.play", { defaultValue: "Play in {{language}}", language: lang.native })}
            </button>
            <button type="button" className={shell.ghost} onClick={voice.stop} aria-disabled={!playing} data-sound="none">
              <FaStop aria-hidden="true" /> {t("landing.voice.stop", "Stop")}
            </button>
          </div>
          <div className={styles.captions} role="region" aria-label={t("landing.narration.captions", "Captions")}>
            <FaClosedCaptioning className={styles.ccIcon} aria-hidden="true" />
            <p className={styles.captionText} aria-live="polite" lang={playing ? lang.code : undefined}>
              {playing && voice.sentence ? voice.sentence : t("landing.languages.captionIdle", "Captions appear here while it speaks.")}
            </p>
          </div>
          {noVoice && (
            <p className={styles.noVoice} role="status">
              <FaInfoCircle aria-hidden="true" className={styles.noVoiceIcon} />
              <span>
                {t("landing.languages.noVoice", {
                  defaultValue: "This device has no {{language}} voice, so Learnigo shows the words instead. It never reads {{language}} with another language's voice.",
                  language: lang.native,
                })}
              </span>
            </p>
          )}
          <p className={styles.note}>
            {t("landing.languages.note", "In the app, each question's script in other languages is built from translated phrases, follows the same rules (it never gives the answer away) and is marked for a person to review.")}
          </p>
        </div>
      </div>
    </section>
  );
}
