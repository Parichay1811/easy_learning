import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import * as FramerMotion from "framer-motion";
import { useCalmMotion } from "../../utils/useCalmMotion";
import styles from "./Cards.module.css";
import { sfx } from "../../utils/sounds";
import { FaStar, FaPlay } from "react-icons/fa";
import { SUBJECT_ICON_IMAGES } from "../../data/subjectIcons";

const MODULE_TYPES = ["listen", "read", "write", "speak"];

// titleKey/taglineKey map to translation keys; the rendered label is always localised
const cardData = [
  { titleKey: "cards.english.title", taglineKey: "cards.english.tagline", color: "purple", subject: "english" },
  { titleKey: "cards.maths.title", taglineKey: "cards.maths.tagline", color: "blue", subject: "maths" },
  { titleKey: "cards.science.title", taglineKey: "cards.science.tagline", color: "green", subject: "science" },
];

// The three subject worlds as big picture tiles. They lay themselves out from
// the space they get (see the `worlds` container in Hero): a row of tall
// tiles when it is wide, a stack of wide tiles when it is tall.
const Cards = ({ onSelect }) => {
  const { t } = useTranslation();
  const reduce = useCalmMotion();
  const moduleStars = useSelector((state) => state.dashboard.moduleStars);

  return (
    <div className={styles.wrapper}>
      {cardData.map((card, index) => {
        const totalStars = MODULE_TYPES.reduce(
          (sum, type) => sum + (moduleStars[`${type}_${card.subject}`] || 0),
          0
        );
        const title = t(card.titleKey);

        return (
          <FramerMotion.motion.button
            key={card.subject}
            type="button"
            className={`${styles.card} ${styles[card.color]}`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15 + index * 0.12, type: "spring", stiffness: 260, damping: 20 }}
            whileHover={reduce ? undefined : { y: -6 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { sfx.open(); onSelect?.(card.subject); }}
            aria-label={`${title}. ${t(card.taglineKey)}`}
            data-sound="none"
            data-hover-sound
          >
            <span className={styles.art} aria-hidden="true">
              <span className={styles.halo} />
              <img src={SUBJECT_ICON_IMAGES[card.subject]} alt="" className={styles.iconImg} draggable="false" />
            </span>
            <span className={styles.textWrap}>
              <span className={styles.title}>{title}</span>
              <span className={styles.tagline}>{t(card.taglineKey)}</span>
              <span className={styles.meta}>
                <span className={styles.starsRow}>
                  <FaStar className={styles.starIcon} aria-hidden="true" /> {totalStars} / 12
                </span>
                <span className={styles.enterBtn}>
                  <FaPlay className={styles.enterIcon} aria-hidden="true" />
                  <span className={styles.enterText}>{t("cards.enterWorld", { defaultValue: "Enter World" })}</span>
                </span>
              </span>
            </span>
          </FramerMotion.motion.button>
        );
      })}
    </div>
  );
};

export default Cards;
