import { lazy } from "react";
import { useTranslation } from "react-i18next";
import { FaChevronDown } from "react-icons/fa";
import { reducedMotion } from "../../utils/learnerPrefs";
import { sfx } from "../../utils/sounds";
import Deferred from "./Deferred";
import styles from "./Landing.module.css";

// Each section's code is fetched only as it comes near the screen.
const SampleJourney = lazy(() => import("./SampleJourney"));
const DifficultyLadder = lazy(() => import("./DifficultyLadder"));
const NarrationDemo = lazy(() => import("./NarrationDemo"));
const LanguagePreview = lazy(() => import("./LanguagePreview"));
const ParentExample = lazy(() => import("./ParentExample"));
const PrivacySafety = lazy(() => import("./PrivacySafety"));

/**
 * The visitor sections under Home's hero (signed-in learners never load
 * this): the tagline, then the real learning experience shown with samples:
 * a playable journey, the difficulty ladder, the voice, the languages, what a
 * parent sees (example data) and privacy. No testimonials, no statistics.
 */
export default function Landing() {
  const { t } = useTranslation();

  // "See how Learnigo teaches": glide to the sample (jump with less motion),
  // and bring keyboard focus along so Tab carries on from there.
  const toJourney = (e) => {
    const el = document.getElementById("landing-journey");
    if (!el) return;
    e.preventDefault();
    sfx.forward();
    el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  };

  return (
    <div className={styles.landing}>
      <section className={styles.band} aria-labelledby="landing-tagline">
        <div className={styles.bandInner}>
          <a className={styles.cue} href="#landing-journey" onClick={toJourney} data-sound="none">
            {t("landing.tagline.cue", "See how Learnigo teaches")}
            <FaChevronDown className={styles.cueIcon} aria-hidden="true" />
          </a>
          <h2 id="landing-tagline" className={styles.tagline}>
            <span>{t("landing.tagline.line1", "Every day begins with curiosity.")}</span>
            <span>{t("landing.tagline.line2", "Every question builds confidence.")}</span>
            <span><em>{t("landing.tagline.line3", "Every step reveals real progress.")}</em></span>
          </h2>
          <p className={styles.bandLead}>
            {t("landing.tagline.lead", "Below is the real learning experience, shown with samples: try a short journey, hear the teacher's voice, switch languages and see what a parent sees. Nothing you do here is saved.")}
          </p>
        </div>
      </section>

      <Deferred minHeight={760} idleAfter={4000}><SampleJourney /></Deferred>
      <Deferred minHeight={620} idleAfter={5000}><DifficultyLadder /></Deferred>
      <Deferred minHeight={640} idleAfter={5500}><NarrationDemo /></Deferred>
      <Deferred minHeight={640} idleAfter={6000}><LanguagePreview /></Deferred>
      <Deferred minHeight={620} idleAfter={6500}><ParentExample /></Deferred>
      <Deferred minHeight={560} idleAfter={7000}><PrivacySafety /></Deferred>
    </div>
  );
}
