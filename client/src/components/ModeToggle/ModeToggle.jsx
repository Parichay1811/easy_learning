import { useTranslation } from "react-i18next";
import { FaGraduationCap } from "react-icons/fa";
import { GiCrossedSwords } from "react-icons/gi";
import { sfx } from "../../utils/sounds";
import styles from "./ModeToggle.module.css";

// Practice / Warrior: a two-way switch in the round's top bar. Warrior adds a
// gentle clock; Practice has none.
const ModeToggle = ({ mode, onChange, compact = false }) => {
  const { t } = useTranslation();
  const pick = (next) => {
    if (next === mode) return;
    sfx.toggle(next === "warrior");
    onChange(next);
  };
  return (
    <div
      className={`${styles.wrapper} ${compact ? styles.compact : ""}`}
      role="radiogroup"
      aria-label={t("modeToggle.label", { defaultValue: "Game mode" })}
      data-mode={mode}
    >
      <span className={styles.thumb} aria-hidden="true" />
      <button
        type="button"
        role="radio"
        aria-checked={mode === "practice"}
        className={`${styles.btn} ${mode === "practice" ? styles.active : ""}`}
        onClick={() => pick("practice")}
        title={t("modeToggle.practiceHint", { defaultValue: "Practice: no clock, take your time" })}
        data-sound="none"
      >
        <FaGraduationCap aria-hidden="true" />
        <span className={styles.text}>{t("modeToggle.practice", { defaultValue: "Practice" })}</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === "warrior"}
        className={`${styles.btn} ${mode === "warrior" ? styles.activeWarrior : ""}`}
        onClick={() => pick("warrior")}
        title={t("modeToggle.warriorHint", { defaultValue: "Warrior: beat the clock for bonus stars" })}
        data-sound="none"
      >
        <GiCrossedSwords aria-hidden="true" />
        <span className={styles.text}>{t("modeToggle.warrior", { defaultValue: "Warrior" })}</span>
      </button>
    </div>
  );
};

export default ModeToggle;
