import { useState } from "react";
import { useTranslation } from "react-i18next";
import * as FramerMotion from "framer-motion";
import {
  FaMicrophone, FaSmile, FaSadTear, FaSurprise, FaBed, FaGrinStars,
} from "react-icons/fa";
import ModulePlayer from "../../components/ModulePlayer/ModulePlayer";
import { sfx } from "../../utils/sounds";
import styles from "./SpeakModule.module.css";

const moodKeys = ["moodHappy", "moodSad", "moodExcited", "moodTired", "moodAmazing"];
const moodIcons = [FaSmile, FaSadTear, FaSurprise, FaBed, FaGrinStars];
const moodColors = ["#f9ca24", "#74b9ff", "#fd79a8", "#a29bfe", "#fdcb6e"];

// "How are you feeling today?" — a gentle warm-up beside the speaking round.
function MoodPicker() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  return (
    <div className={styles.mood}>
      <p className={styles.moodTitle}>{t("modules.speak.howFeeling")}</p>
      <div className={styles.moodsGrid}>
        {moodKeys.map((key, i) => {
          const Icon = moodIcons[i];
          const label = t(`modules.speak.${key}`);
          return (
            <button
              key={key}
              type="button"
              className={`${styles.moodBtn} ${selected === label ? styles.moodActive : ""}`}
              onClick={() => { sfx.select(); setSelected(label); }}
              aria-pressed={selected === label}
              data-sound="none"
            >
              <span className={styles.moodEmoji}><Icon color={moodColors[i]} aria-hidden="true" /></span>
              <span className={styles.moodLabel}>{label}</span>
            </button>
          );
        })}
      </div>
      {selected && (
        <FramerMotion.motion.p className={styles.moodConfirm} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {t("modules.speak.youFeel", { mood: selected })}
        </FramerMotion.motion.p>
      )}
    </div>
  );
}

// Speak: say the answer out loud.
const SpeakModule = () => {
  const { t } = useTranslation();
  return (
    <ModulePlayer
      module="speak"
      warriorSeconds={45}
      icon={FaMicrophone}
      accent="linear-gradient(135deg, #9b7bff, #4527a0)"
      loadingKey="modules.loadingP"
      extra={{
        label: t("modules.speak.howFeeling"),
        icon: FaSmile,
        render: (reset) => <MoodPicker key={reset} />,
      }}
    />
  );
};

export default SpeakModule;
