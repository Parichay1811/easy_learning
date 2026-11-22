// "This week" for the weekly report: the engine's insight sentences (each
// citing its own numbers), the most recent decisions, and the next goals
// (open goals from the learning plan + Learnigo's next step). Plain lists,
// prints well, works with any part missing.
//
//   <WeekSummary evidence={learning.evidence} goals={learning.profile?.goals} next={learning.next}
//                skills={learning.skills} name="Aanya" />
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { FaRegLightbulb, FaBullseye, FaArrowRight, FaInfoCircle } from "react-icons/fa";
import { fmtDate } from "../../dashboard";
import { describeNext, goalByText, subjectName } from "../levels";
import { say, pickInsights } from "./model";
import c from "./evidence.module.css";

export default function WeekSummary({ evidence, goals, next, skills, name = "", headingLevel = 3, maxInsights = 4, maxDecisions = 3, className = "", plain = false }) {
  const { t, i18n } = useTranslation();
  const uid = useId();
  const H = `h${headingLevel}`;
  const insights = pickInsights(evidence?.insights, maxInsights);
  const decisions = (Array.isArray(evidence?.decisions) ? evidence.decisions : []).filter((d) => d?.reason).slice(0, maxDecisions);
  const open = (Array.isArray(goals) ? goals : []).filter((g) => g && g.text && !g.done).slice(0, 4);
  const step = describeNext(t, next, skills);
  const hasGoals = open.length > 0 || Boolean(step);
  const first = String(name || "").split(" ")[0];

  return (
    <div className={`${c.weekGrid} ${className}`}>
      <section className={plain ? undefined : c.card} aria-labelledby={`${uid}-i`}>
        <H id={`${uid}-i`} className={c.weekHead}>{t("evidence.week.insights", "What we noticed")}</H>
        {insights.length ? (
          <ul className={c.insightList}>
            {insights.map((m, i) => (
              <li key={`${m.key || "i"}-${i}`}>
                <span className={c.insightIcon} aria-hidden="true"><FaRegLightbulb /></span>
                <span>{say(t, m, "learn.insight", i18n.language)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={c.sectionEmpty}>{t("evidence.week.noInsights", { defaultValue: "After a week of practice, short notes about {{name}}'s progress appear here, each with the numbers behind it.", name: first || t("evidence.someone", "your child") })}</p>
        )}
        {decisions.length > 0 && (
          <>
            <p className={c.weekMinor}>{t("evidence.week.decisions", "Recent changes")}</p>
            <ul className={c.plainList}>
              {decisions.map((d, i) => (
                <li key={`${d.at}-${i}`}>
                  {d.at && <span className={c.when}>{fmtDate(String(d.at).slice(0, 10), { style: "day" })} · </span>}
                  {say(t, d.reason, "learn.decision", i18n.language)}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      <section className={plain ? undefined : c.card} aria-labelledby={`${uid}-g`}>
        <H id={`${uid}-g`} className={c.weekHead}>{t("evidence.week.goals", "Next goals")}</H>
        {hasGoals ? (
          <ul className={c.insightList}>
            {open.map((g) => (
              <li key={g.id}>
                <span className={c.insightIcon} aria-hidden="true"><FaBullseye /></span>
                <span>
                  {g.text}
                  {g.subject && <span className={c.when}> · {subjectName(t, g.subject)}</span>}
                  {goalByText(t, g.by, "guardian") && <span className={c.when}> · {goalByText(t, g.by, "guardian")}</span>}
                </span>
              </li>
            ))}
            {step && (
              <li>
                <span className={c.insightIcon} aria-hidden="true"><FaArrowRight /></span>
                <span>
                  {t("evidence.week.nextStep", { defaultValue: "Next in Learnigo: {{what}}", what: step.title })}
                  {step.where && step.where !== step.title && <span className={c.when}> · {step.where}</span>}
                  {step.reason && <span className={c.weekReason}>{step.reason}</span>}
                </span>
              </li>
            )}
          </ul>
        ) : (
          <p className={c.sectionEmpty}>{t("evidence.week.noGoals", "No open goals. You can add one together in the learning plan.")}</p>
        )}
        <p className={c.caveat} style={{ color: "var(--d-muted)" }}><FaInfoCircle aria-hidden="true" />{t("evidence.week.praise", "Praise the effort and the strategy, not only the score.")}</p>
      </section>
    </div>
  );
}
