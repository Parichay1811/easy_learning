import { useEffect, useRef } from "react";
import * as FramerMotion from "framer-motion";
import { useCalmMotion } from "../../utils/useCalmMotion";
import { useTranslation } from "react-i18next";
import Mascot, { Butterfly } from "../Mascot/Mascot";
import EntryScene from "../Entry/EntryScene";
import { splashShowing, splashDone } from "../Entry/splashSignal";
import { sfx } from "../../utils/sounds";
import styles from "./SplashPage.module.css";

// App shows the splash on every fresh load, on top of the first page: tell
// that page to hold its entrance until the splash hands over.
splashShowing();

const DURATION_MS = 1900;
const REDUCED_MS = 900;

// The first moment of the site: the puppy hops into the meadow, the Learnigo
// letters bounce in beside it (together they make the logo), two butterflies
// flutter over, and a sunny bar fills while the app wakes up. Short on
// purpose: it hands over to the page underneath via onFinish.
const SplashPage = ({ onFinish }) => {
  const { t } = useTranslation();
  const reduce = useCalmMotion();
  const onFinishRef = useRef(onFinish);
  const total = reduce ? REDUCED_MS : DURATION_MS;

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    // Plays now if the browser allows sound; otherwise the welcome chime
    // plays on the first tap (sounds.js keeps that promise).
    sfx.loadStart();
    const timer = setTimeout(() => {
      splashDone();
      sfx.welcome();
      onFinishRef.current?.();
    }, total);
    return () => clearTimeout(timer);
  }, [total]);

  const pop = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } }
    : {
        initial: { opacity: 0, scale: 0.3, y: 40 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { type: "spring", stiffness: 260, damping: 14, mass: 0.8 },
      };
  const letters = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3, delay: 0.1 } }
    : {
        initial: { opacity: 0, scale: 0.55, rotate: -6 },
        animate: { opacity: 1, scale: 1, rotate: 0 },
        transition: { type: "spring", stiffness: 240, damping: 13, delay: 0.28 },
      };

  return (
    <FramerMotion.motion.div
      className={styles.wrapper}
      style={{ "--splash-ms": `${total - 150}ms` }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      role="status"
      aria-label={t("entry.splash.loading", "Learnigo is getting ready…")}
    >
      <EntryScene butterflies={2} />

      <div className={styles.stage}>
        <div className={styles.logo}>
          <FramerMotion.motion.div className={styles.pup} {...pop}>
            <Mascot size="100%" mood="wave" />
          </FramerMotion.motion.div>
          <FramerMotion.motion.img
            src="/brand/logo-wordmark.webp"
            alt="Learnigo"
            className={styles.word}
            draggable="false"
            {...letters}
          />
          <span className={`${styles.spark} ${styles.s1}`} aria-hidden="true" />
          <span className={`${styles.spark} ${styles.s2}`} aria-hidden="true" />
          <span className={`${styles.spark} ${styles.s3}`} aria-hidden="true" />
        </div>

        <div className={styles.loader} aria-hidden="true">
          <div className={styles.track}>
            <div className={styles.fill} />
          </div>
          <span className={styles.rider}>
            <Butterfly hue="#ff8fc8" hue2="#ffd45c" className={styles.riderWings} />
          </span>
        </div>
        <p className={styles.caption}>{t("entry.splash.caption", "Getting your games ready…")}</p>
      </div>

      <span className={`${styles.visitor} ${styles.v1}`} aria-hidden="true">
        <Butterfly hue="#7cc8ff" hue2="#b69cff" />
      </span>
      <span className={`${styles.visitor} ${styles.v2}`} aria-hidden="true">
        <Butterfly hue="#ffb35c" hue2="#ff7a7a" />
      </span>
    </FramerMotion.motion.div>
  );
};

export default SplashPage;
