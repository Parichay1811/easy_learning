import { useEffect, useRef } from "react";
import * as FramerMotion from "framer-motion";
import { useCalmMotion } from "../../utils/useCalmMotion";
import { useTranslation } from "react-i18next";
import Mascot, { Butterfly } from "../Mascot/Mascot";
import EntryScene from "../Entry/EntryScene";
import { splashShowing, splashDone } from "../Entry/splashSignal";
import { sfx } from "../../utils/sounds";
import { markSplashSeen, splashSeen } from "./splashSeen";
import styles from "./SplashPage.module.css";

// App shows the splash on the first visit only (splashSeen.js), on top of the
// first page: tell that page to hold its entrance until the splash hands over.
if (!splashSeen()) splashShowing();

// Short on purpose: the page underneath can be used about a second after it
// appears, and a tap, a click or any key hands over at once.
const DURATION_MS = 1250;
const REDUCED_MS = 600;
const EASE = [0.2, 0.8, 0.2, 1];

// The first moment of the site, like the opening shot of a film: the camera
// settles on the meadow as the sun comes up behind the logo, the puppy hops
// in, the Learnigo letters rise beside it (together they make the logo), and
// a sunny bar fills. Then the logo lifts away towards the top of the page
// and the light fades to show the page itself.
const SplashPage = ({ onFinish }) => {
  const { t } = useTranslation();
  const reduce = useCalmMotion();
  const onFinishRef = useRef(onFinish);
  const wrapRef = useRef(null);
  const total = reduce ? REDUCED_MS : DURATION_MS;

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    // Seen once it has started: a reload half-way through does not play it again.
    markSplashSeen();
    // Plays now if the browser allows sound; otherwise the welcome chime
    // plays on the first tap (sounds.js keeps that promise).
    sfx.loadStart();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      // The page underneath takes taps while the splash fades.
      if (wrapRef.current) wrapRef.current.style.pointerEvents = "none";
      splashDone();
      sfx.welcome();
      onFinishRef.current?.();
    };
    const timer = setTimeout(finish, total);
    // Skip: any tap, click or key.
    const skip = () => finish();
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, [total]);

  const pop = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.25 } }
    : {
        initial: { opacity: 0, scale: 0.5, y: 34 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { type: "spring", stiffness: 260, damping: 16, mass: 0.8 },
      };
  const letters = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.25, delay: 0.05 } }
    : {
        initial: { opacity: 0, y: 18, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.6, ease: EASE, delay: 0.18 },
      };

  return (
    <FramerMotion.motion.div
      ref={wrapRef}
      className={`${styles.wrapper} ${reduce ? styles.calm : ""}`}
      style={{ "--splash-ms": `${total - 100}ms` }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0.2 : 0.42, ease: "easeOut" }}
      role="status"
      aria-label={t("entry.splash.loading", "Learnigo is getting ready…")}
    >
      <div className={styles.camera}>
        <EntryScene butterflies={2} />
      </div>
      <div className={styles.dawn} aria-hidden="true" />

      <FramerMotion.motion.div
        className={styles.stage}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: "-16vh", scale: 0.82 }}
        transition={{ duration: 0.42, ease: [0.4, 0, 0.6, 1] }}
      >
        <div className={styles.logo}>
          <span className={styles.glow} aria-hidden="true" />
          <FramerMotion.motion.div className={styles.pup} {...pop}>
            <Mascot size="100%" mood="wave" />
          </FramerMotion.motion.div>
          <FramerMotion.motion.img
            src="/brand/logo-wordmark.webp"
            width="1000"
            height="443"
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
      </FramerMotion.motion.div>

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
