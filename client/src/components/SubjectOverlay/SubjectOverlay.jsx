import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import * as FramerMotion from "framer-motion";
import { useReducedMotion } from "framer-motion";
import styles from "./SubjectOverlay.module.css";
import { sfx } from "../../utils/sounds";
import { fetchModuleStars } from "../../store/slices/dashboardSlice";
import { SUBJECT_ICON_IMAGES } from "../../data/subjectIcons";
import PlacementSheet from "../Placement/PlacementSheet";
import { needsPlacement } from "../Placement/placementApi";
import {
  FaHeadphones, FaBookOpen, FaPencilAlt, FaMicrophone,
  FaStar, FaRegStar, FaTimes, FaPlay,
} from "react-icons/fa";

const moduleTypes = ["listen", "read", "write", "speak"];
const moduleIcons = {
  listen: FaHeadphones,
  read: FaBookOpen,
  write: FaPencilAlt,
  speak: FaMicrophone,
};
const moduleColors = { listen: "blue", read: "green", write: "orange", speak: "purple" };
const moduleXP = { listen: "30 XP", read: "20 XP", write: "15 XP", speak: "10 XP" };

const StarRow = ({ count }) => (
  <>
    {[1, 2, 3].map((s) =>
      s <= count
        ? <FaStar key={s} className={styles.starOn} />
        : <FaRegStar key={s} className={styles.starOff} />
    )}
  </>
);

/** The subject's name, tagline and picture, for the overlay and the subject page. */
export function SubjectHeader({ subject, className = "" }) {
  const { t } = useTranslation();
  const subjectKey = ["english", "maths", "science"].includes(subject) ? subject : null;
  const subjectLabel = subjectKey ? t(`subjectPage.${subjectKey}.label`) : subject;
  const subjectTagline = subjectKey ? t(`subjectPage.${subjectKey}.tagline`) : t("subjectPage.defaultTagline");
  return (
    <div className={`${styles.header} ${className}`}>
      {subjectKey && (
        <span className={styles.subjectBadge} aria-hidden="true">
          <img src={SUBJECT_ICON_IMAGES[subjectKey]} alt="" draggable="false" />
        </span>
      )}
      <span className={styles.headText}>
        <h1 className={styles.title}>{subjectLabel}</h1>
        <p className={styles.tagline}>{subjectTagline}</p>
      </span>
    </div>
  );
}

/**
 * The four ways to practise a subject (Listen, Read, Write, Speak) as game
 * tiles: a row of four when there is width, two by two when upright. Shared by
 * the Home overlay and the subject page.
 */
export function ModuleGrid({ subject, onPick }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const moduleStarsData = useSelector((state) => state.dashboard.moduleStars);
  return (
    <div className={styles.grid}>
      {moduleTypes.map((type, i) => {
        const Icon = moduleIcons[type];
        const label = t(`subjectPage.modules.${type}.label`);
        return (
          <FramerMotion.motion.button
            key={type}
            type="button"
            className={`${styles.card} ${styles[moduleColors[type]]}`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.08, type: "spring", stiffness: 280, damping: 18 }}
            whileHover={reduce ? undefined : { y: -6 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onPick(type)}
            aria-label={`${label}. ${t(`subjectPage.modules.${type}.desc`)}`}
            data-sound="none"
            data-hover-sound=""
          >
            <span className={styles.levelBadge}>{t(`subjectPage.modules.${type}.level`)}</span>
            <span className={styles.cardIconWrap} aria-hidden="true"><Icon /></span>
            <span className={styles.cardTitle}>{label}</span>
            <span className={styles.cardDesc}>{t(`subjectPage.modules.${type}.desc`)}</span>
            <span className={styles.stars} aria-hidden="true">
              <StarRow count={moduleStarsData[`${type}_${subject}`] ?? 0} />
            </span>
            <span className={styles.cardFoot}>
              <span className={styles.xpBadge}>{moduleXP[type]}</span>
              <span className={styles.playBtn}>
                <FaPlay aria-hidden="true" />
                <span>{t("subjectPage.play")}</span>
              </span>
            </span>
          </FramerMotion.motion.button>
        );
      })}
    </div>
  );
}

// Choosing a world on Home opens this: the subject and its four modules, as
// a panel over the map (below the navbar, one screen, nothing to scroll).
const SubjectOverlay = ({ subject, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (localStorage.getItem("jwt_token")) dispatch(fetchModuleStars());
  }, [dispatch]);

  // Lock background scroll and allow Escape to close while the overlay is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e) => { if (e.key === "Escape") { sfx.close(); onClose(); } };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // The first time in a subject: "Where would you like to start?" (components/Placement).
  const [placementFor, setPlacementFor] = useState(null);
  const [needsLevel, setNeedsLevel] = useState(false);
  useEffect(() => {
    let alive = true;
    needsPlacement(subject).then((v) => { if (alive) setNeedsLevel(v); });
    return () => { alive = false; };
  }, [subject]);

  const close = () => { sfx.close(); onClose(); };
  const go = (type) => {
    sfx.forward();
    onClose();
    navigate(`/module/${type}/${subject}`);
  };
  const pick = (type) => {
    if (needsLevel) { sfx.select(); setPlacementFor(type); return; }
    go(type);
  };

  const overlay = createPortal(
    <FramerMotion.motion.div
      className={styles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={close}
    >
      <FramerMotion.motion.div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="subject-overlay-title"
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 20 }}
        transition={{ duration: 0.28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.top} id="subject-overlay-title">
          <SubjectHeader subject={subject} />
          <button
            type="button"
            className={styles.closeBtn}
            onClick={close}
            aria-label={t("modules.close", { defaultValue: "Close" })}
            data-sound="none"
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>
        <ModuleGrid subject={subject} onPick={pick} />
      </FramerMotion.motion.div>
    </FramerMotion.motion.div>,
    document.body
  );

  // The placement sheet is a sibling (not inside the overlay), so its clicks
  // never reach the overlay's "tap outside to close".
  return (
    <>
      {overlay}
      {placementFor && (
        <PlacementSheet
          subject={subject}
          module={placementFor}
          onDone={() => { const type = placementFor; setPlacementFor(null); setNeedsLevel(false); go(type); }}
          onClose={() => { const type = placementFor; setPlacementFor(null); setNeedsLevel(false); go(type); }}
        />
      )}
    </>
  );
};

export default SubjectOverlay;
