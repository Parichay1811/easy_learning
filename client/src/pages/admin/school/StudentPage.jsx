// ADM-046 Student profile (admin view): where the student is in the school, plus
// the same in-depth analytics every role sees (shared /students/:id/analytics/*).
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  TimeRangeBar, StoryCard, KpiTile, ChartCard, SubjectModuleMatrix, CalendarHeatmap, TrendLine, Skeleton, EmptyState,
  fmtDuration, fmtPercent, fmtDate, NO_DATA, toTable,
} from "../../../components/dashboard";
import { useLoad, qs } from "./api";
import { useSchoolRange } from "./useSchoolRange";
import { BASE } from "./context";
import { StatusPill } from "./bits";
import s from "./school.module.css";

const LEVEL = { not_started: "notStarted", learning: "learning", practising: "practising", mastered: "mastered" };
const KIND = { move: "Moved", promote: "Promoted", repeat: "Repeating the year", leave: "Left", rejoin: "Rejoined" };

export default function StudentPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { tr, params } = useSchoolRange({ defaultRange: "month" });
  const profile = useLoad(`/students/${id}/profile`);
  const p = { from: params.from, to: params.to, cmp: params.cmp };
  const ov = useLoad(`/students/${id}/analytics/overview${qs(p)}`);
  const year = new Date().getFullYear();
  const cal = useLoad(`/students/${id}/analytics/calendar?year=${year}`);
  const d = ov.data;
  const cells = useMemo(() => {
    if (!d?.matrix) return [];
    return Object.entries(d.matrix).flatMap(([subject, mods]) => Object.entries(mods).map(([module, c]) => ({ subject, module, accuracy: c.accuracy == null ? null : c.accuracy / 100, minutes: c.minutes, level: LEVEL[c.mastery] })));
  }, [d]);
  const trend = useMemo(() => (d?.series?.points || []).map((x) => ({ x: x.key, value: x.minutes })), [d]);

  if (profile.error) return <EmptyState tone="error" title={t("school.student.notFound", { defaultValue: "Student not found" })} text={profile.error.message} actionLabel={t("school.back", { defaultValue: "Back to people" })} to={`${BASE}/people`} />;
  const pr = profile.data;
  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <p className={s.sub} style={{ margin: 0 }}><Link to={`${BASE}/people`}>{t("school.nav.people", { defaultValue: "People" })}</Link>{pr?.student.unit ? ` › ${pr.student.unit}` : ""}</p>
          <h1 className={s.title}>{pr?.student.name || " "}</h1>
          {pr && <p className={s.sub}>{[pr.student.email, pr.student.externalId && `#${pr.student.externalId}`, pr.student.status === "inactive" && t("school.student.left", { defaultValue: "Left on {{d}}", d: pr.student.leftAt ? fmtDate(pr.student.leftAt.slice(0, 10)) : "" })].filter(Boolean).join(" · ")}</p>}
        </div>
      </div>
      <TimeRangeBar value={tr} ranges={["week", "month", "year", "custom"]} />
      <StoryCard loading={ov.loading} sentence={d?.story} chips={(d?.insights || []).slice(0, 4).map((i) => ({ kind: i.kind, text: i.text }))} />
      <div className={s.tiles}>
        <KpiTile loading={ov.loading} label={t("school.student.time", { defaultValue: "Learning time" })} value={d ? fmtDuration(d.totals.minutes) : NO_DATA}
          delta={d?.previous ? { current: d.totals.minutes, previous: d.previous.minutes, mode: "duration", vs: t("school.vsPrev", { defaultValue: "vs the period before" }) } : undefined} sparkline={trend.map((x) => x.value)} />
        <KpiTile loading={ov.loading} label={t("school.tile.accuracy", { defaultValue: "Accuracy" })} value={d?.totals.accuracy != null ? fmtPercent(d.totals.accuracy / 100) : NO_DATA}
          delta={d?.previous?.accuracy != null && d?.totals.accuracy != null ? { current: d.totals.accuracy, previous: d.previous.accuracy, mode: "points" } : undefined} />
        <KpiTile loading={ov.loading} label={t("school.student.days", { defaultValue: "Active days" })} value={d ? `${d.totals.activeDays} / ${d.range.days}` : NO_DATA} />
        <KpiTile loading={ov.loading} label={t("school.student.streak", { defaultValue: "Streak" })} value={d?.streak ? t("school.student.streakN", { defaultValue: "{{n}} days", n: d.streak.current }) : NO_DATA}
          helpText={t("school.student.streakHelp", { defaultValue: "Days in a row. School holidays don't break it if your school chose that in Settings." })} />
      </div>
      <div className={s.grid2}>
        <ChartCard title={t("school.student.matrixTitle", { defaultValue: "How are they doing in each subject and skill?" })} loading={ov.loading} table={toTable.matrix(cells, t)}>
          <SubjectModuleMatrix cells={cells} />
        </ChartCard>
        <section className={s.card} aria-labelledby="ctx-h">
          <h2 id="ctx-h" className={s.cardTitle}>{t("school.student.inSchool", { defaultValue: "In school" })}</h2>
          {!pr ? <Skeleton variant="text" lines={6} /> : (
            <>
              <h3 className={s.label}>{t("school.people.groups", { defaultValue: "Groups" })}</h3>
              <ul className={s.list}>
                {pr.groups.map((g) => <li key={g.id} className={s.listItem}><span className={s.strong}>{g.name}{g.archived ? ` (${t("school.archived", { defaultValue: "archived" })})` : ""}</span><span className={`${s.small} ${s.muted}`}>{g.teachers.join(", ")}</span></li>)}
                {!pr.groups.length && <li className={s.muted}>{t("school.none", { defaultValue: "None yet" })}</li>}
              </ul>
              <h3 className={s.label} style={{ marginTop: 12 }}>{t("school.people.parents", { defaultValue: "Parents" })}</h3>
              <ul className={s.list}>
                {pr.parents.map((x) => <li key={x.id} className={s.listItem}><span>{x.name} <span className={`${s.small} ${s.muted}`}>{x.email}</span></span><StatusPill status={x.status} /></li>)}
                {!pr.parents.length && <li className={s.muted}>{t("school.student.noParents", { defaultValue: "No parent on record." })}</li>}
              </ul>
              <h3 className={s.label} style={{ marginTop: 12 }}>{t("school.student.history", { defaultValue: "History" })}</h3>
              <ul className={s.list}>
                {pr.history.map((h, i) => <li key={i} className={s.listItem}><span>{t(`school.move.${h.kind}`, { defaultValue: KIND[h.kind] })}{h.from || h.to ? `: ${h.from || "—"} → ${h.to || "—"}` : ""}{h.reason ? ` · ${h.reason}` : ""}</span><span className={`${s.small} ${s.muted}`}>{fmtDate(String(h.at).slice(0, 10))}</span></li>)}
                {!pr.history.length && <li className={s.muted}>{t("school.student.noHistory", { defaultValue: "No moves yet." })}</li>}
              </ul>
              <p className={`${s.small} ${s.muted}`} style={{ marginTop: 12 }}>
                {pr.consent?.length ? t("school.student.consent", { defaultValue: "Consent on record: {{b}} ({{d}}).", b: pr.consent[0].basis, d: fmtDate(String(pr.consent[0].at).slice(0, 10)) }) : t("school.student.noConsent", { defaultValue: "No individual consent record; covered by the school's data-processing agreement if signed." })}
              </p>
            </>
          )}
        </section>
      </div>
      <ChartCard title={t("school.student.calTitle", { defaultValue: "How often did they learn this year?" })} loading={cal.loading} table={toTable.calendar((cal.data?.days || []).map((x) => ({ date: x.date, value: x.minutes })), t)}>
        <CalendarHeatmap data={(cal.data?.days || []).map((x) => ({ date: x.date, value: x.minutes }))} mode="year" />
      </ChartCard>
      <ChartCard title={t("school.trend.studentTitle", { defaultValue: "Is their learning time going up?" })} loading={ov.loading} table={toTable.trend(trend, t)}>
        <TrendLine data={trend} unit="min" />
      </ChartCard>
    </div>
  );
}
