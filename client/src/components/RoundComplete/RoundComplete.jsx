import { useEffect, useRef } from "react";
import * as FramerMotion from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaStar, FaRegStar, FaTrophy, FaRedo, FaArrowLeft, FaBolt } from "react-icons/fa";
import { GiCrossedSwords } from "react-icons/gi";
import Mascot, { FloatingButterflies } from "../Mascot/Mascot";
import { sfx, haptic } from "../../utils/sounds";
import { narrate } from "../../utils/narrator";
import { getSpeechLang } from "../../utils/speechLang";
import styles from "./RoundComplete.module.css";

const WARRIOR_PASS = 6;
const CONFETTI = Array.from({ length: 14 }, (_, i) => i);

// The end of a round: the mascot celebrates, the stars land one by one, and
// there are two clear ways on: play again, or go back.
export default function RoundComplete({ module: mod, subject, mode, stars, bonusStars, total = 10, onPlayAgain, onBack }) {
  const { t, i18n } = useTranslation();
  const reduce = useReducedMotion();
  const isPractice = mode !== "warrior";
  const passed = !isPractice ? stars >= WARRIOR_PASS : null;
  const totalStars = stars + bonusStars;
  const slots = Math.max(total, stars);

  // One fanfare when the round ends (guarded: StrictMode runs effects twice in development).
  const played = useRef(false);
  useEffect(() => {
    if (played.current) return;
    played.current = true;
    sfx.levelUp();
    haptic("success");
  }, []);
  // A few warm words in the teacher's voice, after the fanfare (praise for
  // the effort, never a label).
  useEffect(() => {
    const line = isPractice || passed
      ? t("roundComplete.say", { defaultValue: "You finished the round! You got {{count}} stars. Keep it up!", count: stars })
      : t("roundComplete.sayAlmost", { defaultValue: "Good effort, warrior! {{count}} stars this time. Shall we try again?", count: stars });
    const id = setTimeout(() => narrate(line, { lang: getSpeechLang(i18n.language || "en") }), 900);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const subtitle = `${t(`subjectPage.modules.${mod}.label`, { defaultValue: mod })} · ${t(`subjectPage.${subject}.label`, { defaultValue: subject })}`;

  return (
    <FramerMotion.motion.div
      className={styles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="round-complete-title"
    >
      <FloatingButterflies count={3} />
      {!reduce && (
        <div className={styles.confetti} aria-hidden="true" data-decorative="">
          {CONFETTI.map((i) => (
            <span key={i} className={styles.bit} style={{ "--x": `${(i * 37) % 100}%`, "--d": `${(i % 7) * 0.18}s`, "--h": `${(i * 53) % 360}` }} />
          ))}
        </div>
      )}

      <FramerMotion.motion.div
        className={`${styles.panel} ${!isPractice ? (passed ? styles.won : styles.almost) : ""}`}
        initial={reduce ? { opacity: 0 } : { scale: 0.8, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <div className={styles.hero}>
          <Mascot size={110} mood={isPractice || passed ? "cheer" : "wave"} className={styles.mascot} />
          <div className={styles.heading}>
            {!isPractice && <GiCrossedSwords className={styles.swords} aria-hidden="true" />}
            <h1 id="round-complete-title" className={styles.title}>
              {isPractice
                ? t("roundComplete.title")
                : passed
                  ? t("roundComplete.warriorPassed")
                  : t("roundComplete.warriorAlmost", { defaultValue: "So close, warrior!" })}
            </h1>
            <p className={styles.sub}>
              {isPractice
                ? subtitle
                : passed
                  ? t("roundComplete.conquered")
                  : t("roundComplete.neededToPass", { count: WARRIOR_PASS })}
            </p>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.starsBlock}>
            <p className={styles.caption}>{t("roundComplete.correctAnswers")}</p>
            <div className={styles.stars}>
              {Array.from({ length: slots }).map((_, i) => (
                <FramerMotion.motion.span
                  key={i}
                  className={i < stars ? styles.starOn : styles.starOff}
                  initial={reduce ? false : { scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.35 + i * 0.07, type: "spring", stiffness: 420, damping: 14 }}
                >
                  {i < stars ? <FaStar /> : <FaRegStar />}
                </FramerMotion.motion.span>
              ))}
            </div>
            <p className={styles.score}>{stars} / {total}</p>
            {!isPractice && <p className={styles.passing}>{t("roundComplete.passingMark", { count: WARRIOR_PASS })}</p>}
          </div>

          {!isPractice && bonusStars > 0 && (
            <FramerMotion.motion.div
              className={styles.bonus}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <span className={styles.bonusLine}><FaBolt aria-hidden="true" /> {t("roundComplete.speedBonusStars", { count: bonusStars })}</span>
              <span className={styles.bonusLine}><FaTrophy aria-hidden="true" /> {t("roundComplete.totalStars", { count: totalStars })}</span>
            </FramerMotion.motion.div>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.backBtn} onClick={() => { sfx.back(); onBack(); }} data-sound="none">
              <FaArrowLeft aria-hidden="true" /> {t("roundComplete.back")}
            </button>
            <button
              type="button"
              className={`${styles.againBtn} ${mode === "warrior" ? styles.againWarrior : ""}`}
              onClick={() => { sfx.select(); onPlayAgain(); }}
              data-sound="none"
              autoFocus
            >
              <FaRedo aria-hidden="true" /> {t("roundComplete.playAgain")}
            </button>
          </div>
        </div>
      </FramerMotion.motion.div>
    </FramerMotion.motion.div>
  );
}
