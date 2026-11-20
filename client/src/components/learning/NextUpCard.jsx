import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaPlay, FaArrowRight } from "react-icons/fa";
import { SUBJECT_META, describeNext, subjectName } from "./levels";
import s from "./learning.module.css";

/**
 * "Up next": the lesson the learning engine suggests, with one button to start it.
 *
 *   <NextUpCard next={profile.next} skills={skills} />                   // a card
 *   <NextUpCard next={next} skills={skills} variant="button" className={cta} classes={{ icon, text }} />
 *       // just the big button (Today tab), styled by the page
 *
 * Props: next { subject, module, reason, skill? }, skills (to name the skill), variant "card" | "button",
 * readOnly (no button: someone else is looking), headingLevel (card), className, classes { icon, text }.
 */
export default function NextUpCard({ next, skills, variant = "card", readOnly = false, headingLevel = 3, className = "", classes = {}, empty = null }) {
  const { t } = useTranslation();
  const d = describeNext(t, next, skills);
  if (!d) return empty;
  const meta = SUBJECT_META[d.subject];

  if (variant === "button") {
    if (readOnly || !d.href) return null;
    return (
      <Link to={d.href} className={className} aria-label={t("learning.next.aria", { defaultValue: "Up next: {{what}}. {{where}}. Start", what: d.title, where: d.where })}>
        <span className={classes.icon} aria-hidden="true"><FaPlay /></span>
        <span className={classes.text} aria-hidden="true">
          <span>{t("learning.next.button", "Up next")}</span>
          <small>{d.title === d.where ? d.where : `${d.title} · ${subjectName(t, d.subject)}`}</small>
        </span>
      </Link>
    );
  }

  const H = `h${headingLevel}`;
  const Icon = meta?.Icon;
  return (
    <div className={s.nextWrap}>
    <section className={`${s.nextCard} ${className}`} style={meta ? { "--sk": meta.color, "--sk-soft": meta.soft, "--sk-ink": meta.ink } : undefined} aria-label={t("learning.next.title", "Up next")}>
      <div className={s.nextHead}>
        {Icon && <span className={s.nextIcon} aria-hidden="true"><Icon /></span>}
        <div className={s.nextWords}>
          <span className={s.nextKicker}>{t("learning.next.title", "Up next")}</span>
          <H className={s.nextTitle}>{d.title}</H>
          {d.title !== d.where && <span className={s.nextWhere}>{d.where}</span>}
        </div>
      </div>
      {d.reason && <p className={s.nextReason}>{d.reason}</p>}
      {!readOnly && d.href && (
        <Link to={d.href} className={s.nextGo}>
          {t("learning.next.go", "Let's go")} <FaArrowRight aria-hidden="true" />
        </Link>
      )}
    </section>
    </div>
  );
}
