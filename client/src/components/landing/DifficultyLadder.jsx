import { useId } from "react";
import { useTranslation } from "react-i18next";
import { FaLayerGroup, FaInfoCircle } from "react-icons/fa";
import { STAGES } from "./journeyData";
import shell from "./Landing.module.css";
import styles from "./DifficultyLadder.module.css";

// One example per stage, all on the sample's idea (melting), so the climb is
// easy to see. English defaults of `landing.ladder.<n>.what|example`.
const LADDER = [
  { what: "A question from daily life, before any special words.", example: "What happens to an ice cube left on a warm plate?" },
  { what: "Spot or name the idea.", example: "Which of these is melting?" },
  { what: "Explain why it happens.", example: "Why does an ice lolly melt faster in the sun?" },
  { what: "Use the idea to do something.", example: "Your chocolate is starting to melt at a picnic. Where should you put it?" },
  { what: "Compare, predict and give a reason.", example: "One ice cube on a metal tray, one on a wooden board: which melts first, and why?" },
  { what: "Take the idea somewhere new.", example: "How could you keep a snowman from melting for as long as possible?" },
];

/** The difficulty ladder: stages 0-5, one example each; it adapts per topic. */
export default function DifficultyLadder() {
  const { t } = useTranslation();
  const uid = useId();

  return (
    <section id="landing-ladder" className={`${shell.section} ${shell.rise}`} aria-labelledby={`${uid}-title`}>
      <div className={shell.head}>
        <p className={shell.eyebrow}><FaLayerGroup aria-hidden="true" /> {t("landing.ladder.eyebrow", "How questions grow")}</p>
        <h2 id={`${uid}-title`} className={shell.title}>{t("landing.ladder.title", "The difficulty ladder")}</h2>
        <p className={shell.lead}>
          {t("landing.ladder.lead", "Every question is tagged with the kind of thinking it asks for, from everyday curiosity to taking an idea somewhere new. The sample above climbed the first three steps.")}
        </p>
      </div>

      <ol className={styles.ladder}>
        {STAGES.map((st, i) => (
          <li key={st.n} className={styles.rung} style={{ "--i": i }}>
            <div className={styles.rungHead}>
              <span className={styles.num} aria-hidden="true">{st.n}</span>
              <h3 className={styles.name}>
                <span className={shell.srOnly}>{t("landing.journey.stageN", { defaultValue: "Stage {{n}}", n: st.n })}: </span>
                {t(`landing.stage.${st.n}`, st.name)}
              </h3>
            </div>
            <p className={styles.what}>{t(`landing.ladder.${st.n}.what`, LADDER[i].what)}</p>
            <p className={styles.example}>
              <span className={styles.exLabel}>{t("landing.ladder.exampleLabel", "Example")}</span>
              {t(`landing.ladder.${st.n}.example`, LADDER[i].example)}
            </p>
            {i <= 2 && <span className={styles.tried}>{t("landing.ladder.tried", "In the sample")}</span>}
          </li>
        ))}
      </ol>

      <div className={styles.notes}>
        <p className={styles.note}>
          <FaInfoCircle className={styles.noteIcon} aria-hidden="true" />
          <span>
            <strong>{t("landing.ladder.perTopicTitle", "It adapts per topic, not per child.")}</strong>{" "}
            {t("landing.ladder.perTopic", "A learner can be reasoning about fractions while just starting to recognise a new science idea. Each topic climbs at its own pace, and nobody is labelled by one step.")}
          </span>
        </p>
        <p className={styles.note}>
          <FaInfoCircle className={styles.noteIcon} aria-hidden="true" />
          <span>
            <strong>{t("landing.ladder.levelTitle", "Stages and levels are different things.")}</strong>{" "}
            {t("landing.ladder.level", "A stage is the kind of thinking a question asks for. A level (0 to 8) is how far into a subject a learner has come.")}
          </span>
        </p>
      </div>
    </section>
  );
}
