import { useId } from "react";
import { useTranslation } from "react-i18next";
import { FaShieldAlt, FaMicrophoneSlash, FaEyeSlash, FaHeart, FaFileDownload, FaUserShield, FaVideoSlash, FaArrowRight } from "react-icons/fa";
import shell from "./Landing.module.css";
import styles from "./PrivacySafety.module.css";
import PageLink from "../SEO/PageLink";

// Plain-language points that are true in this codebase (see the report /
// docs/learning/README.md "Privacy and safety"); English defaults of
// `landing.privacy.items.<key>.title|text`.
const ITEMS = [
  {
    key: "voice",
    Icon: FaMicrophoneSlash,
    title: "No voice recordings kept",
    text: "When a child speaks an answer, it is turned into words to check it, and Learnigo doesn't store the sound. (Some browsers, such as Chrome, use their own online service for this step.)",
  },
  {
    key: "ads",
    Icon: FaEyeSlash,
    title: "No advertising profile",
    text: "No ads, no ad trackers, and a child's information is never sold.",
  },
  {
    key: "diagnosis",
    Icon: FaHeart,
    title: "No diagnosis asked",
    text: "Comfort settings are named by what they do, like bigger text, a calmer screen or more time. We never ask about a diagnosis.",
  },
  {
    key: "rights",
    Icon: FaFileDownload,
    title: "Download or erase",
    text: "A parent can download everything stored about their child, or ask for it to be erased, with 30 days to change their mind.",
  },
  {
    key: "guardian",
    Icon: FaUserShield,
    title: "Guardians stay in control",
    text: "Only a verified guardian, or a teacher with the child in their class, can see or change a learning plan, and every change is logged.",
  },
  {
    key: "camera",
    Icon: FaVideoSlash,
    title: "Camera games keep no video",
    text: "Movement games use the camera on the device only. No images or video are stored, just the game results.",
  },
];

/** Privacy and child safety, in plain words, with the full policy one tap away. */
export default function PrivacySafety() {
  const { t } = useTranslation();
  const uid = useId();

  return (
    <section id="landing-privacy" className={`${shell.section} ${shell.rise}`} aria-labelledby={`${uid}-title`}>
      <div className={shell.head}>
        <p className={shell.eyebrow}><FaShieldAlt aria-hidden="true" /> {t("landing.privacy.eyebrow", "Safety first")}</p>
        <h2 id={`${uid}-title`} className={shell.title}>{t("landing.privacy.title", "Privacy and child safety")}</h2>
        <p className={shell.lead}>{t("landing.privacy.lead", "In plain words: what Learnigo does, and doesn't do, with a child's information.")}</p>
      </div>

      <ul className={styles.grid}>
        {ITEMS.map((item) => {
          const { key, title, text } = item;
          return (
          <li key={key} className={styles.item}>
            <span className={styles.icon} aria-hidden="true"><item.Icon /></span>
            <div>
              <h3 className={styles.itemTitle}>{t(`landing.privacy.items.${key}.title`, title)}</h3>
              <p className={styles.itemText}>{t(`landing.privacy.items.${key}.text`, text)}</p>
            </div>
          </li>
          );
        })}
      </ul>

      <div className={styles.foot}>
        <PageLink to="/policy" className={shell.ghost} data-sound="forward">
          <FaShieldAlt aria-hidden="true" /> {t("landing.privacy.policy", "Read the full privacy policy")}
        </PageLink>
        <PageLink to="/" className={shell.primary} data-sound="forward">
          {t("landing.privacy.start", "Get started")} <FaArrowRight aria-hidden="true" />
        </PageLink>
      </div>
    </section>
  );
}
