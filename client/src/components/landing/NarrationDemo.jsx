import { useId } from "react";
import { useTranslation } from "react-i18next";
import { FaPlay, FaStop, FaClosedCaptioning, FaCheckCircle, FaHeadphones } from "react-icons/fa";
import { splitSentences } from "../../utils/narrator";
import { getSpeechLang } from "../../utils/speechLang";
import { useDemoVoice, shownLang } from "./useDemoVoice";
import board from "./Board.module.css";
import shell from "./Landing.module.css";
import styles from "./NarrationDemo.module.css";

const SCRIPT_KEY = "landing.narration.script";
const SCRIPT_EN = "Here's a sharing puzzle. You have six sweets and two friends, and you want to share them fairly: six divided by two. How many sweets does each friend get? Is it two, three, or four?";
const OPTIONS = ["2", "3", "4"];

/**
 * The narration demo: what the screen shows next to the script the teacher
 * says, with Play (the site's own voice, as if a Listen button was pressed),
 * Stop and captions that follow the sentence being spoken.
 */
export default function NarrationDemo() {
  const { t, i18n } = useTranslation();
  const voice = useDemoVoice();
  const uid = useId();
  const script = t(SCRIPT_KEY, SCRIPT_EN);
  const sentences = splitSentences(script);
  const playing = voice.speaking && voice.key === "narration";

  const play = () => {
    voice.play(script, { lang: getSpeechLang(shownLang(i18n, SCRIPT_KEY)), key: "narration" });
  };

  const sourceNote = voice.noVoice
    ? t("landing.voice.none", "No voice for this language on this device: the words stay on screen, and nothing waits for them.")
    : voice.source === "server"
      ? t("landing.voice.server", "Speaking with the AI Teacher's own voice.")
      : voice.source === "browser"
        ? t("landing.voice.browser", "Speaking with this device's voice for the language.")
        : "";

  return (
    <section id="landing-narration" className={`${shell.section} ${shell.rise}`} aria-labelledby={`${uid}-title`}>
      <div className={shell.head}>
        <p className={shell.eyebrow}><FaHeadphones aria-hidden="true" /> {t("landing.narration.eyebrow", "Listen")}</p>
        <h2 id={`${uid}-title`} className={shell.title}>{t("landing.narration.title", "Every question has its own spoken script")}</h2>
        <p className={shell.lead}>
          {t("landing.narration.lead", "The teacher doesn't just read the screen aloud. Each question has a script written to the learner, the way a teacher would say it. Here is one next to what is on screen.")}
        </p>
      </div>

      <div className={styles.grid}>
        <figure className={styles.col}>
          <figcaption className={styles.colLabel}>{t("landing.narration.screenLabel", "On screen")}</figcaption>
          <div className={board.board}>
            <h3 className={board.instruction}>{t("landing.narration.instruction", "Share them fairly")}</h3>
            <p className={board.promptBox}>
              {t("landing.narration.prompt", "6 sweets are shared equally between 2 friends. How many sweets does each friend get?")}
              <span className={board.equation}>6 ÷ 2 = ?</span>
            </p>
            <ul className={`${board.options} ${board.optionsRow}`}>
              {OPTIONS.map((o, i) => (
                <li key={o} className={`${board.option} ${board.static}`}>
                  <span className={board.letter} aria-hidden="true">{["A", "B", "C"][i]}</span>
                  <span className={board.optText}>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        </figure>

        <figure className={styles.col}>
          <figcaption className={styles.colLabel}>
            {t("landing.narration.scriptLabel", "Spoken script")}
            <span className={styles.style}>{t("landing.narration.style", "Style: curious")}</span>
          </figcaption>
          <div className={styles.paper}>
            <p className={styles.script}>
              {sentences.map((sen, i) => (
                <span key={i} className={playing && voice.index === i ? styles.now : undefined}>{sen}{" "}</span>
              ))}
            </p>
            <div className={shell.btnRow}>
              <button type="button" className={shell.secondary} onClick={play} data-sound="none">
                <FaPlay aria-hidden="true" /> {playing ? t("landing.narration.replay", "Play from the start") : t("landing.narration.play", "Play the script")}
              </button>
              <button type="button" className={shell.ghost} onClick={voice.stop} aria-disabled={!playing} data-sound="none">
                <FaStop aria-hidden="true" /> {t("landing.voice.stop", "Stop")}
              </button>
            </div>
            <div className={styles.captions} role="region" aria-label={t("landing.narration.captions", "Captions")}>
              <FaClosedCaptioning className={styles.ccIcon} aria-hidden="true" />
              <p className={styles.captionText} aria-live="polite">
                {playing && voice.sentence
                  ? voice.sentence
                  : t("landing.narration.captionIdle", "Press Play: each sentence appears here as it is spoken.")}
              </p>
            </div>
            <p className={styles.source} aria-live="polite">{sourceNote}</p>
          </div>
        </figure>
      </div>

      <ul className={styles.points}>
        {[
          ["same", "The same facts and the same three answers, read in the same order."],
          ["noAnswer", "It never hints at which answer is right."],
          ["maths", "Numbers and symbols are said as words: “6 ÷ 2” becomes “six divided by two”."],
          ["styles", "Scripts come in six styles: curious, story, detective, adventure, calm and challenge."],
        ].map(([k, en]) => (
          <li key={k} className={styles.point}>
            <FaCheckCircle className={styles.pointIcon} aria-hidden="true" />
            <span>{t(`landing.narration.points.${k}`, en)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
