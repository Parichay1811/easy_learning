// ADM-040 School overview (and the same page for one unit, ADM-011):
// story · tiles · sunburst + grade × subject heatmap · trend · lists.
import { useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  TimeRangeBar, StoryCard, KpiTile, ChartCard, TrendLine, UnitSunburst, Button, PlanLockCard, EmptyState,
  fmtDuration, fmtPercent, NO_DATA, toTable, subjectLabel,
} from "../../../components/dashboard";
import { useLoad, qs } from "./api";
import { useSchoolRange } from "./useSchoolRange";
import { useSchool, BASE } from "./context";
import { HeatCell } from "./bits";
import s from "./school.module.css";

const f = (v) => (v == null ? null : v / 100);

export function SubjectHeatmap({ heatmap, onRow }) {
  const { t } = useTranslation();
  if (!heatmap?.rows?.length) return <p className={s.muted}>{t("school.heat.none", { defaultValue: "Add grades in the school tree (or groups) to see this." })}</p>;
  return (
    <div className={s.tableWrap}>
      <table className={s.heat}>
        <caption className="d-sr-only">{t("school.heat.caption", { defaultValue: "Accuracy by row and subject, with the change from the previous period." })}</caption>
        <thead>
          <tr>
            <th scope="col">{t(`school.heat.rows.${heatmap.rowsAre}`, { defaultValue: heatmap.rowsAre === "grade" ? "Grade" : heatmap.rowsAre === "section" ? "Section" : "Group" })}</th>
            {heatmap.subjects.map((sub) => <th key={sub} scope="col">{subjectLabel(t, sub)}</th>)}
          </tr>
        </thead>
        <tbody>
          {heatmap.rows.map((r) => (
            <tr key={r.id}>
              <th scope="row">
                {onRow ? <button type="button" className={s.link} onClick={() => onRow(r)}>{r.name}</button> : r.name}
                <div className={`${s.small} ${s.muted}`}>{t("school.learnersN", { defaultValue: "{{n}} students", n: r.learners })}</div>
              </th>
              {heatmap.subjects.map((sub) => <td key={sub}><HeatCell cell={r.cells[sub]} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Server nodes -> the kit sunburst's { id, name, score, students, children }.
function toSunburst(name, nodes) {
  const conv = (n) => {
    const kids = (n.children || []).map(conv).filter((c) => (c.students ?? 0) > 0 || (c.children || []).length);
    return kids.length ? { id: n.id, name: n.name, score: f(n.engagement), children: kids } : { id: n.id, name: n.name, score: f(n.engagement), students: n.learners };
  };
  return { id: "root", name, children: nodes.map(conv) };
}

function SetupNudge() {
  const { t } = useTranslation();
  const setup = useLoad("/setup");
  if (!setup.data || setup.data.percent >= 100) return null;
  return (
    <div className={`${s.banner} ${s.attention}`}>
      <div className={s.grow}>
        <p className={s.strong}>{t("school.setup.nudge", { defaultValue: "School setup: {{done}} of {{total}} steps done", done: setup.data.done, total: setup.data.total })}</p>
        <div className={s.meter} style={{ marginTop: 8 }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={setup.data.percent} aria-label={t("school.setup.progress", { defaultValue: "Setup progress" })}>
          <div className={s.meterFill} style={{ width: `${setup.data.percent}%` }} />
        </div>
      </div>
      <Button size="sm" to={`${BASE}/setup`}>{t("school.setup.continue", { defaultValue: "Continue setup" })}</Button>
    </div>
  );
}

export default function OverviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { unitId } = useParams();
  const { access, has, isAdmin } = useSchool();
  const { tr, params } = useSchoolRange();
  const locked = !has("org.analytics");
  const ov = useLoad(`/school/overview${qs({ ...params, unitId })}`, { skip: locked });
  const lists = useLoad(`/school/lists${qs({ ...params, unitId })}`, { skip: locked });
  const d = ov.data;

  const trend = useMemo(() => {
    if (!d?.series) return [];
    const prev = d.prevSeries?.points || [];
    return d.series.points.map((p, i) => ({ x: p.key, value: p.minutes, prev: prev[i] ? prev[i].minutes : undefined }));
  }, [d]);

  if (locked) {
    return (
      <PlanLockCard module="org.analytics" title={t("school.lock.analytics", { defaultValue: "School-wide analytics" })}
        text={t("school.lock.analyticsText", { defaultValue: "See every grade, class and teacher in one screen. Part of the Institute plan." })} />
    );
  }
  const T = d?.tiles;
  const vs = d?.range?.term ? t("school.vsTerm", { defaultValue: "vs {{term}}", term: d.range.term.previous || "previous term" }) : t("school.vsPrev", { defaultValue: "vs the period before" });
  const chips = [
    ...(lists.data?.atRiskCount ? [{ kind: "nudge", text: t("school.chip.atRisk", { defaultValue: "{{n}} need a nudge", n: lists.data.atRiskCount }), to: `${BASE}/insights?tab=lists` }] : []),
    ...(lists.data?.wins?.length ? [{ kind: "celebrate", text: t("school.chip.wins", { defaultValue: "{{n}} big improvers", n: lists.data.wins.length }), to: `${BASE}/insights?tab=lists` }] : []),
    ...(d?.dip && d.dip.delta <= -5 ? [{ kind: "alert", text: t("school.chip.dip", { defaultValue: "{{row}} · {{subject}} down {{n}} pts", row: d.dip.row, subject: subjectLabel(t, d.dip.subject), n: -d.dip.delta }) }] : []),
    ...(d?.insights || []).slice(0, 1).map((i) => ({ kind: i.kind, text: i.text })),
  ].slice(0, 4);

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.title}>{unitId ? (d?.who || t("school.unit", { defaultValue: "Unit" })) : access.org.name}</h1>
          <p className={s.sub}>
            {unitId
              ? <><Link to={BASE}>{access.org.name}</Link> › {d?.who}</>
              : t("school.overviewSub", { defaultValue: "How every grade, class and teacher is doing." })}
          </p>
        </div>
        <div className={s.row}>
          {unitId && <Button size="sm" variant="soft" to={`${BASE}/tree?unit=${unitId}`}>{t("school.seePeople", { defaultValue: "People in this unit" })}</Button>}
          <Button size="sm" variant="ghost" onClick={() => window.print()}>{t("school.print", { defaultValue: "Print" })}</Button>
        </div>
      </div>
      {!unitId && isAdmin && <SetupNudge />}
      <TimeRangeBar value={tr} ranges={["week", "month", "year", "custom"]} sticky />
      {ov.error ? (
        <EmptyState tone="error" title={t("school.err", { defaultValue: "This view didn't load" })} text={ov.error.message} actionLabel={t("school.retry", { defaultValue: "Try again" })} onAction={ov.reload} />
      ) : (
        <>
          <StoryCard loading={ov.loading} sentence={d?.story} chips={chips} />
          <div className={s.tiles}>
            <KpiTile loading={ov.loading} label={t("school.tile.active", { defaultValue: "Active students" })} value={T ? fmtPercent(f(T.activePct)) : NO_DATA}
              helpText={t("school.tile.activeHelp", { defaultValue: "{{a}} of {{n}} students learned at least once in this period.", a: T?.activeLearners ?? 0, n: T?.learners ?? 0 })} />
            <KpiTile loading={ov.loading} label={t("school.tile.minutes", { defaultValue: "Minutes per student" })} value={T?.minutesPerStudent != null ? fmtDuration(T.minutesPerStudent) : NO_DATA}
              delta={T?.prevMinutesPerStudent != null ? { current: T.minutesPerStudent, previous: T.prevMinutesPerStudent, mode: "duration", vs } : undefined}
              sparkline={trend.map((p) => p.value)} helpText={t("school.tile.minutesHelp", { defaultValue: "Learning time divided by all students in view, including those who didn't learn." })} />
            <KpiTile loading={ov.loading} label={t("school.tile.accuracy", { defaultValue: "Accuracy" })} value={T?.accuracy != null ? fmtPercent(f(T.accuracy)) : NO_DATA}
              delta={T?.prevAccuracy != null && T?.accuracy != null ? { current: T.accuracy, previous: T.prevAccuracy, mode: "points", vs } : undefined}
              helpText={t("school.tile.accuracyHelp", { defaultValue: "Correct answers divided by answers given." })} />
            <KpiTile loading={ov.loading} label={t("school.tile.mastery", { defaultValue: "Practising or mastered" })} value={T?.masteryPct != null ? fmtPercent(f(T.masteryPct)) : NO_DATA}
              helpText={t("school.tile.masteryHelp", { defaultValue: "Share of student-subject pairs (with at least 5 answers) at Practising (50 %+) or Mastered (80 %+)." })} />
            <KpiTile loading={ov.loading} label={t("school.tile.tests", { defaultValue: "Tests completed" })} value={T?.testsCompleted ?? NO_DATA}
              helpText={T?.testsAvailable ? "" : t("school.tile.testsHelp", { defaultValue: "Tests appear here once your teachers use the Tests module." })} />
            <KpiTile loading={ov.loading} label={t("school.tile.risk", { defaultValue: "Need a nudge" })} value={T ? String(T.atRisk) : NO_DATA} tone={T?.atRisk ? "attention" : "good"} to={`${BASE}/insights?tab=lists`}
              helpText={t("school.tile.riskHelp", { defaultValue: "No learning for 7 days, or accuracy down more than 15 points over two weeks." })} />
            <KpiTile loading={ov.loading} label={t("school.tile.parents", { defaultValue: "Parents linked" })} value={T?.parentsLinkedPct != null ? fmtPercent(f(T.parentsLinkedPct)) : NO_DATA}
              to={`${BASE}/people/parents`} helpText={t("school.tile.parentsHelp", { defaultValue: "Students with at least one parent following their learning." })} />
          </div>
          <div className={s.grid2}>
            <ChartCard
              title={t("school.sun.title", { defaultValue: "How is the school organised and doing?" })}
              answer={t("school.sun.answer", { defaultValue: "Size = students, colour = engagement. Click a unit to open it." })}
              info={t("school.sun.info", { defaultValue: "Engagement mixes active days (50 %), time against 20 minutes a day (30 %) and answers (20 %)." })}
              loading={ov.loading}
              empty={!ov.loading && !(d?.sunburst?.nodes || []).some((n) => n.learners) && { title: t("school.sun.empty", { defaultValue: "No students placed yet" }), text: t("school.sun.emptyText", { defaultValue: "Build your school tree and import students." }), actionLabel: t("school.sun.emptyAction", { defaultValue: "Open the school tree" }), to: `${BASE}/tree` }}
            >
              {d?.sunburst && (
                <UnitSunburst
                  root={toSunburst(d.who, d.sunburst.nodes)}
                  scoreLabel={t("school.engagement", { defaultValue: "Engagement" })}
                  drills={d.sunburst.kind === "tree"}
                  onSelect={(node) => { if (d.sunburst.kind === "tree" && node.id !== "root") navigate(`${BASE}/units/${node.id}${window.location.search}`); }}
                />
              )}
            </ChartCard>
            <ChartCard
              title={t("school.heat.title", { defaultValue: "Which grade needs help in which subject?" })}
              answer={d?.dip && d.dip.delta <= -5
                ? t("school.heat.answerDip", { defaultValue: "{{row}} {{subject}} dropped the most: {{n}} points.", row: d.dip.row, subject: subjectLabel(t, d.dip.subject), n: -d.dip.delta })
                : t("school.heat.answer", { defaultValue: "Accuracy per subject; arrows show the change from the period before." })}
              info={t("school.heat.info", { defaultValue: "Cells need at least one answer. Changes need answers in both periods." })}
              loading={ov.loading}
            >
              <SubjectHeatmap heatmap={d?.heatmap} onRow={d?.heatmap?.rowsAre !== "group" ? (r) => navigate(`${BASE}/units/${r.id}${window.location.search}`) : null} />
            </ChartCard>
          </div>
          <ChartCard
            title={t("school.trend.title", { defaultValue: "Is learning time going up?" })}
            answer={T ? t("school.trend.answer", { defaultValue: "{{m}} per student in this period.", m: fmtDuration(T.minutesPerStudent || 0) }) : ""}
            loading={ov.loading}
            table={toTable.trend(trend, t)}
          >
            <TrendLine data={trend} unit="min" seriesLabel={t("school.trend.now", { defaultValue: "This period" })} prevLabel={d?.range?.term ? (d.range.term.previous || "") : t("school.trend.before", { defaultValue: "Period before" })} />
          </ChartCard>
          <AtRiskPreview lists={lists} />
        </>
      )}
    </div>
  );
}

function AtRiskPreview({ lists }) {
  const { t } = useTranslation();
  const l = lists.data;
  return (
    <div className={s.grid2}>
      <section className={s.card} aria-labelledby="risk-h">
        <h2 id="risk-h" className={s.cardTitle}>{t("school.risk.title", { defaultValue: "Who needs a nudge?" })}</h2>
        <p className={s.cardSub}>{l ? t("school.risk.sub", { defaultValue: "{{n}} students, grouped by class.", n: l.atRiskCount }) : ""}</p>
        {l && !l.atRiskCount && <p className={s.okText}>{t("school.risk.none", { defaultValue: "Nobody right now. Lovely." })}</p>}
        <ul className={s.list}>
          {(l?.atRisk || []).slice(0, 4).map((g) => (
            <li key={g.unit} className={s.listItem}>
              <span><span className={s.strong}>{g.unit}</span> · {g.students.slice(0, 3).map((x) => x.name).join(", ")}{g.students.length > 3 ? ` +${g.students.length - 3}` : ""}</span>
              <span className={`${s.pill} ${s.pillAttention}`}>{g.students.length}</span>
            </li>
          ))}
        </ul>
        <div className={s.actions}><Button size="sm" variant="soft" to={`${BASE}/insights?tab=lists`}>{t("school.risk.all", { defaultValue: "See everyone and why" })}</Button></div>
      </section>
      <section className={s.card} aria-labelledby="wins-h">
        <h2 id="wins-h" className={s.cardTitle}>{t("school.wins.title", { defaultValue: "Who should we celebrate?" })}</h2>
        <p className={s.cardSub}>{t("school.wins.sub", { defaultValue: "The biggest improvers compared with the period before." })}</p>
        {l && !l.wins.length && <p className={s.muted}>{t("school.wins.none", { defaultValue: "No big jumps yet in this period." })}</p>}
        <ul className={s.list}>
          {(l?.wins || []).slice(0, 4).map((w) => (
            <li key={w.email} className={s.listItem}>
              <span><Link to={`${BASE}/students/${w.id}`} className={s.strong}>{w.name}</Link> <span className={s.muted}>· {w.unit}</span></span>
              <span className={`${s.pill} ${s.pillGood}`}>{w.accuracyDelta != null && w.why === "accuracy_up" ? `▲ +${w.accuracyDelta} pts` : `▲ +${fmtDuration(w.minutesDelta)}`}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
