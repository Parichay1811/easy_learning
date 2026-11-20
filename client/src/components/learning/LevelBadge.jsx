import { useTranslation } from "react-i18next";
import { FaLock } from "react-icons/fa";
import { SUBJECT_META, clampLevel, levelName, subjectName } from "./levels";
import s from "./learning.module.css";

/**
 * A learner's level in one subject: a numbered bubble in the subject's colour
 * and "Level 2 · Basic understanding". A level is a learning stage, never an
 * age, a grade or a score.
 *
 *   <LevelBadge level={2} subject="maths" />            // bubble + "Level 2 · Basic understanding"
 *   <LevelBadge level={2} subject="maths" showSubject /> // "Maths" above it
 *   <LevelBadge level={2} subject="maths" showSubject note="Practising" /> // "Maths · Practising" above it
 *   <LevelBadge level={2} size="sm" locked />            // smaller, with a lock
 */
export default function LevelBadge({ level, subject, showSubject = false, note = "", locked = false, size = "md", className = "" }) {
  const { t } = useTranslation();
  const known = level != null && Number.isFinite(Number(level));
  const n = known ? clampLevel(level) : null;
  const meta = SUBJECT_META[subject] || { color: "var(--d-accent)", ink: "var(--d-accent-ink)", soft: "var(--d-accent-soft)" };
  return (
    <span className={`${s.levelBadge} ${size === "sm" ? s.levelBadgeSm : ""} ${className}`} style={{ "--lv": meta.color, "--lv-ink": meta.ink, "--lv-soft": meta.soft }}>
      <span className={s.levelNum} aria-hidden="true">{known ? n : "?"}</span>
      <span className={s.levelWords}>
        {showSubject && subject && (
          <span className={s.levelSubject}>
            {subjectName(t, subject)}
            {note && <span className={s.levelNote}><span aria-hidden="true"> · </span><span className={s.srOnly}>, </span>{note}</span>}
          </span>
        )}
        <span className={s.levelLine}>
          {known
            ? <><b>{t("learning.levelN", { defaultValue: "Level {{n}}", n })}</b><span aria-hidden="true"> · </span><span className={s.srOnly}>, </span>{levelName(t, n)}</>
            : <b>{t("learning.levelUnknown", "Not set yet")}</b>}
          {locked && (
            <span className={s.lockMark} title={t("learning.lockedShort", "Kept at this level")}>
              <FaLock aria-hidden="true" />
              <span className={s.srOnly}>{t("learning.lockedShort", "Kept at this level")}</span>
            </span>
          )}
        </span>
      </span>
    </span>
  );
}
