// TCH-056 "My teaching summary": what the admin will see about my teaching (ADM-041).
import { useTranslation } from "react-i18next";
import { TimeRangeBar, useTimeRange, KpiTile, EmptyState, Skeleton, fmtDuration, fmtPercent, fmtDate } from "../../components/dashboard";
import { useLoad, useTeacherApi } from "./teacherApi";
import { rangeQuery } from "./teacherShared";
import s from "./teacher.module.css";

export default function SummaryView({ workspace }) {
  const { t } = useTranslation();
  const { get } = useTeacherApi();
  const tr = useTimeRange({ defaultRange: "month", defaultCmp: "prev" });
  const rq = rangeQuery(tr);
  const q = useLoad(() => get(`/summary?${rq}`), [rq]);
  const d = q.data;
  const solo = workspace?.workspace?.kind === "solo";
  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1>{t("teacher.sum.title", { defaultValue: "My teaching summary" })}</h1>
          <p>{solo
            ? t("teacher.sum.subSolo", { defaultValue: "Your teaching at a glance, for your own records." })
            : t("teacher.sum.sub", { defaultValue: "The same numbers your school admin sees about your teaching. Transparent by design." })}</p>
        </div>
      </div>
      <TimeRangeBar value={tr} ranges={["week", "month", "year", "custom"]} showCompare />
      {q.loading && <div className={s.tiles}>{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} variant="tile" />)}</div>}
      {q.error && <EmptyState tone="error" title={t("teacher.loadError", { defaultValue: "We couldn't load this page" })} text={q.error} actionLabel={t("teacher.retry", { defaultValue: "Try again" })} onAction={q.reload} />}
      {d && (
        <>
          <p className={s.muted} style={{ margin: 0 }}>{fmtDate({ from: d.range.from, to: d.range.to }, { style: "short" })}</p>
          <div className={s.tiles}>
            <KpiTile label={t("teacher.sum.groups", { defaultValue: "Groups" })} value={d.groups} />
            <KpiTile label={t("teacher.sum.students", { defaultValue: "Students" })} value={d.students} />
            <KpiTile label={t("teacher.sum.active", { defaultValue: "Active students" })} value={d.activeStudents} helpText={t("teacher.sum.activeHelp", { defaultValue: "Students with any learning in the period." })} />
            <KpiTile label={t("teacher.kpi.minutesPer", { defaultValue: "Minutes per student" })} value={d.minutesPerStudent == null ? null : fmtDuration(d.minutesPerStudent)} />
            <KpiTile label={t("teacher.kpi.accuracy", { defaultValue: "Accuracy" })} value={d.accuracy == null ? null : fmtPercent(d.accuracy / 100)} delta={d.growth != null && d.accuracy != null ? { current: d.accuracy / 100, previous: (d.accuracy - d.growth) / 100, mode: "points" } : undefined} helpText={t("teacher.sum.growthHelp", { defaultValue: "Class growth: change in accuracy against the period before." })} />
            <KpiTile label={t("teacher.sum.engagement", { defaultValue: "Engagement" })} value={d.engagement == null ? null : `${d.engagement}`} unit="/ 100" helpText={t("teacher.sum.engagementHelp", { defaultValue: "A mix of active days, time and answers per student." })} />
            <KpiTile label={t("teacher.sum.questions", { defaultValue: "Questions contributed" })} value={d.questionsContributed} helpText={t("teacher.sum.questionsHelp", { defaultValue: "{{count}} approved.", count: d.questionsApproved })} />
            <KpiTile label={t("teacher.sum.tests", { defaultValue: "Tests created" })} value={d.testsCreated} helpText={d.notes?.testsCreated} />
            <KpiTile label={t("teacher.sum.reply", { defaultValue: "Reply time" })} value={d.replyTimeHours} helpText={d.notes?.replyTimeHours} />
          </div>
        </>
      )}
    </>
  );
}
