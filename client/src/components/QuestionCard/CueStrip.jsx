import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { CUE_ICONS } from "./support";
import styles from "./CueStrip.module.css";

const WORDS = {
  listen: "Listen", look: "Look", read: "Read", count: "Count", think: "Think", tap: "Tap",
  drag: "Drag", type: "Type", say: "Say", order: "Order", match: "Match", sort: "Sort",
};

/**
 * The steps of the question as big icons with one word each ("👂 Listen → 👆 Tap"),
 * lit while the voice says that step. The words are always the same, so a child who
 * cannot read yet comes to know them by sight (docs/learning/TEACHING-STANDARDS.md).
 * cues: ["listen", "tap"]; active: indexes of the steps being said now.
 */
export default function CueStrip({ cues, active = [] }) {
  const { t } = useTranslation();
  if (!cues?.length) return null;
  const words = cues.map((c) => t(`questionCard.cue.${c}`, WORDS[c] || c));
  return (
    <ol className={styles.strip} aria-label={t("questionCard.cue.steps", { defaultValue: "What to do: {{steps}}", steps: words.join(", ") })} data-cue-strip="">
      {cues.map((c, i) => (
        <Fragment key={c}>
          {i > 0 && <li className={styles.arrow} aria-hidden="true">→</li>}
          <li className={`${styles.step} ${active.includes(i) ? styles.on : ""}`} data-cue={c} aria-hidden="true">
            <span className={styles.icon}>{CUE_ICONS[c]}</span>
            <span className={styles.word}>{words[i]}</span>
          </li>
        </Fragment>
      ))}
    </ol>
  );
}
