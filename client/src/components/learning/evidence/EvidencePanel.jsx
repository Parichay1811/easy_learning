// The evidence panel: how a learner is growing, from their own recorded answers
// only. Parents see it at the top of "Learning", teachers in the student view,
// and the landing page shows it with SAMPLE_EVIDENCE ("Example data").
//
//   <EvidencePanel evidence={data.evidence} name="Aanya" />
//   <EvidencePanel evidence={SAMPLE_EVIDENCE} name="Mia" example />
//
// Props: evidence (the engine's `evidence`, any part may be missing), name (first
// name), audience 'parent' | 'teacher', loading, error (string) + onRetry,
// example (shows an "Example data" badge), title (overrides the heading),
// headingLevel (2). Honest and calm: no scores about ability, no rankings, no
// screen time; small samples are labelled; every chart has a text summary and
// a table view.
import { useId, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaFlask, FaChartLine, FaBrain, FaHandsHelping, FaRedo, FaPuzzlePiece, FaSeedling } from "react-icons/fa";
import { Button, EmptyState, Skeleton } from "../../dashboard";
import { normaliseEvidence } from "./model";
import ThenNow from "./ThenNow";
import { StageGrowth, StageAccuracy } from "./ThinkingCharts";
import { IndependenceChart, RetentionChart } from "./WeeklyCharts";
import { Insights, Misconceptions, Decisions, Activity } from "./Lists";
import c from "./evidence.module.css";

function NewLearner({ name, waiting = false }) {
  const { t } = useTranslation();
  const id = useId();
  const items = [
    [FaChartLine, t("evidence.new.thenNow", { defaultValue: "where {{name}} started in each subject, and where they are now", name })],
    [FaBrain, t("evidence.new.stages", "the kind of thinking reached, from everyday questions to using ideas in new situations")],
    [FaHandsHelping, t("evidence.new.indep", "what they manage on their own, and with a hint or help")],
    [FaRedo, t("evidence.new.retention", "what they still remember when a skill comes back days later")],
    [FaPuzzlePiece, t("evidence.new.mis", "tricky spots they have worked through, with ideas for home")],
  ];
  return (
    <section className={`${c.card} ${c.emptyCard}`} aria-labelledby={id}>
      <div className={c.emptyTop}>
        <span className={c.insightIcon} style={{ width: 44, height: 44, fontSize: "1.2rem" }} aria-hidden="true"><FaSeedling /></span>
        <div>
          <h3 id={id}>{waiting
            ? t("evidence.new.waitTitle", "The growth view is on its way")
            : t("evidence.new.title", { defaultValue: "{{name}} is just getting started", name })}</h3>
          <p className={c.cardSub}>{waiting ? t("evidence.new.waitText", "Soon you'll see here:") : t("evidence.new.text", "After a few sessions you'll see:")}</p>
        </div>
      </div>
      <ul className={c.preview}>
        {items.map((it) => {
          const Icon = it[0];
          return <li key={it[1]}><Icon aria-hidden="true" /><span>{it[1]}</span></li>;
        })}
      </ul>
      <p className={c.fine}>{t("evidence.new.fine", "Every number comes from real answers, and small numbers are marked as early days.")}</p>
    </section>
  );
}

export default function EvidencePanel({
  evidence, name = "", audience = "parent", loading = false, error = null, onRetry, example = false, title, headingLevel = 2, className = "",
}) {
  const { t, i18n } = useTranslation();
  const headId = useId();
  const H = `h${headingLevel}`;
  const first = String(name || "").split(" ")[0] || (audience === "teacher" ? t("evidence.someoneTeacher", "this learner") : t("evidence.someone", "your child"));
  const ev = useMemo(() => normaliseEvidence(evidence, i18n.language), [evidence, i18n.language]);

  const head = (
    <div className={c.head}>
      <div>
        <H id={headId}>{title || t("evidence.title", { defaultValue: "How {{name}} is growing", name: first })}</H>
        <p>{audience === "teacher"
          ? t("evidence.subTeacher", { defaultValue: "From {{name}}'s own answers only. No comparisons with other students, and time on screen never counts as progress.", name: first })
          : t("evidence.sub", { defaultValue: "From {{name}}'s own answers only. No comparisons with other children, and time on screen never counts as progress.", name: first })}</p>
      </div>
      {example && <span className={c.example}><FaFlask aria-hidden="true" />{t("evidence.example", "Example data")}</span>}
    </div>
  );

  let body;
  if (loading && !evidence) {
    body = <div className={c.grid} aria-busy="true"><Skeleton variant="rect" height={120} /><Skeleton variant="chart" /><Skeleton variant="chart" /></div>;
  } else if (error && !evidence) {
    body = (
      <div className={c.card} role="alert">
        <EmptyState compact tone="error" title={t("evidence.error", "We couldn't load the progress evidence")} text={error} />
        {onRetry && <Button variant="soft" icon={FaRedo} onClick={onRetry}>{t("evidence.retry", "Try again")}</Button>}
      </div>
    );
  } else if (evidence == null && !example) {
    // The server sent no `evidence` at all (an older server): say it is coming, never "just started".
    body = <NewLearner name={first} waiting />;
  } else if (ev.empty) {
    body = <NewLearner name={first} />;
  } else {
    const { has } = ev;
    body = (
      <div className={c.grid}>
        {has.insights && <Insights className={`${c.wide} ${c.first}`} insights={ev.insights} name={first} />}
        {has.subjects && <ThenNow className={c.full} subjects={ev.subjects} name={first} />}
        <Activity activity={ev.activity} className={has.insights ? c.up : ""} />
        {(has.stages || has.byStage) && <StageGrowth stages={ev.stages} name={first} />}
        {has.byStage && <StageAccuracy byStage={ev.byStage} name={first} />}
        <IndependenceChart weeks={ev.independence} name={first} />
        <RetentionChart retention={ev.retention} name={first} />
        <Misconceptions data={ev.misconceptions} name={first} audience={audience} />
        <Decisions decisions={ev.decisions} />
      </div>
    );
  }

  return (
    <section className={`${c.panel} ${className}`} aria-labelledby={headId}>
      {head}
      {body}
    </section>
  );
}
