// ADM-040 School overview (and the same page for one unit, ADM-011):
// story · tiles · sunburst + grade × subject heatmap · trend · lists.
import { useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaHome, FaChartPie, FaTh, FaChartLine, FaUserFriends, FaPrint } from "react-icons/fa";
import {
  StoryCard, KpiTile, ChartCard, TrendLine, UnitSunburst, Button, PlanLockCard, EmptyState,
  SubTabs, SubPanel, usePane, fmtDuration, fmtPercent, NO_DATA, toTable, subjectLabel,
} from "../../../components/dashboard";
import { useLoad, qs } from "./api";
import { useSchoolRange } from "./useSchoolRange";
import { useSchool, BASE } from "./context";
import { HeatCell, RangeControl } from "./bits";
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
  const children = nodes.map(conv).filter((c) => (c.students ?? 0) > 0 || (c.children || []).length);
  const size = (n) => (n.students != null ? n.students : (n.children || []).reduce((a, c) => a + size(c), 0));
  const total = children.reduce((a, c) => a + size(c), 0);
  const score = total ? children.reduce((a, c) => a + (c.score ?? 0) * size(c), 0) / total : null;
  return { id: "root", name, score, children };
}

// "School setup: 5 of 7" – a small pill in the page head (links to the setup steps).
function SetupNudge() {
  const { t } = useTranslation();
  const setup = useLoad("/setup");
  if (!setup.data || setup.data.percent >= 100) return null;
  return (
    <Link to={`${BASE}/setup`} className={s.setupPill}
      aria-label={t("school.setup.nudge", { defaultValue: "School setup: {{done}} of {{total}} steps done", done: setup.data.done, total: setup.data.total })}>
      <span className={s.setupPillText}>{t("school.setup.pill", { defaultValue: "Setup {{done}}/{{total}}", done: setup.data.done, total: setup.data.total })}</span>
      <span className={s.setupPillMeter} aria-hidden="true"><span style={{ width: `${setup.data.percent}%` }} /></span>
      <span className={s.setupPillGo}>{t("school.setup.continue", { defaultValue: "Continue setup" })}</span>
    </Link>
  );
}

const PANES = ["summary", "map", "grades", "trend", "people"];

export default function OverviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pane, setPane] = usePane(PANES);
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
    const n = Math.max(1, d.tiles?.learners || 1);
    const per = (m) => Math.round((m / n) * 10) / 10;
    return d.series.points.map((p, i) => ({ x: p.key, value: per(p.minutes), prev: prev[i] ? per(prev[i].minutes) : undefined }));
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
    ...(lists.data?.atRiskCount ? [{ kind: "nudge", text: (lists.data.atRiskCount === 1 ? t("school.chip.atRisk1", { defaultValue: "1 needs a nudge" }) : t("school.chip.atRisk", { defaultValue: "{{n}} need a nudge", n: lists.data.atRiskCount })), to: `${BASE}/insights?tab=lists` }] : []),
    ...(lists.data?.wins?.length ? [{ kind: "celebrate", text: t("school.chip.wins", { defaultValue: "{{n}} big improvers", n: lists.data.wins.length }), to: `${BASE}/insights?tab=lists` }] : []),
    ...(d?.dip && d.dip.delta <= -5 ? [{ kind: "alert", text: t("school.chip.dip", { defaultValue: "{{row}} · {{subject}} down {{n}} pts", row: d.dip.row, subject: subjectLabel(t, d.dip.subject), n: -d.dip.delta }) }] : []),
    ...(d?.insights || []).slice(0, 1).map((i) => ({ kind: i.kind, text: i.text })),
  ].slice(0, 4);

  const tabs = [
    { id: "summary", label: t("school.ov.summary", { defaultValue: "Summary" }), icon: FaHome },
    { id: "map", label: t("school.ov.map", { defaultValue: "School map" }), icon: FaChartPie },
    { id: "grades", label: t("school.ov.grades", { defaultValue: "Grades & subjects" }), icon: FaTh },
    { id: "trend", label: t("school.ov.trend", { defaultValue: "Learning time" }), icon: FaChartLine },
    { id: "people", label: t("school.ov.people", { defaultValue: "Nudges & wins" }), icon: FaUserFriends, badge: lists.data?.atRiskCount || undefined },
  ];

  return (
    <div className={`${s.page} ${s.pageTight}`}>
      <div className={s.head}>
        <div className={s.grow}>
          <h1 className={s.title}>{unitId ? (d?.who || t("school.unit", { defaultValue: "Unit" })) : access.org.name}</h1>
          <p className={`${s.sub} ${unitId ? "" : s.subOptional}`}>
            {unitId
              ? <><Link to={BASE}>{access.org.name}</Link> › {d?.who}</>
              : t("school.overviewSub", { defaultValue: "How every grade, class and teacher is doing." })}
          </p>
        </div>
        <div className={s.row}>
          {!unitId && isAdmin && <SetupNudge />}
          {unitId && <Button size="sm" variant="soft" to={`${BASE}/tree?unit=${unitId}`}>{t("school.seePeople", { defaultValue: "People in this unit" })}</Button>}
          <Button size="sm" variant="ghost" icon={FaPrint} className={s.phoneIcon} aria-label={t("school.print", { defaultValue: "Print" })} onClick={() => window.print()}>{t("school.print", { defaultValue: "Print" })}</Button>
        </div>
      </div>
      <SubTabs idBase="ov" label={t("school.ov.tabs", { defaultValue: "Overview views" })} value={pane} onChange={setPane} tabs={tabs} />
      <RangeControl tr={tr} />
      {ov.error ? (
        <EmptyState tone="error" title={t("school.err", { defaultValue: "This view didn't load" })} text={ov.error.message} actionLabel={t("school.retry", { defaultValue: "Try again" })} onAction={ov.reload} />
      ) : (
        <>
          <SubPanel idBase="ov" id="summary" value={pane}>
            <StoryCard loading={ov.loading} sentence={d?.story} chips={chips} />
            <div className={s.tilesTight}>
              <KpiTile loading={ov.loading} label={t("school.tile.active", { defaultValue: "Active students" })} value={T ? fmtPercent(f(T.activePct)) : NO_DATA}
                helpText={t("school.tile.activeHelp", { defaultValue: "{{a}} of {{n}} students learned at least once in this period.", a: T?.activeLearners ?? 0, n: T?.learners ?? 0 })} />
              <KpiTile loading={ov.loading} label={t("school.tile.minutes", { defaultValue: "Minutes per student" })} value={T?.minutesPerStudent != null ? fmtDuration(T.minutesPerStudent) : NO_DATA}
                delta={T?.prevMinutesPerStudent != null ? { current: T.minutesPerStudent, previous: T.prevMinutesPerStudent, mode: "duration", vs } : undefined}
                sparkline={trend.map((p) => p.value)} helpText={t("school.tile.minutesHelp", { defaultValue: "Learning time divided by all students in view, including those who didn't learn." })} />
              <KpiTile loading={ov.loading} label={t("school.tile.accuracy", { defaultValue: "Accuracy" })} value={T?.accuracy != null ? fmtPercent(f(T.accuracy)) : NO_DATA}
                delta={T?.prevAccuracy != null && T?.accuracy != null ? { current: T.accuracy / 100, previous: T.prevAccuracy / 100, mode: "points", vs } : undefined}
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
          </SubPanel>
          <SubPanel idBase="ov" id="map" value={pane}>
            <ChartCard
              className={s.sunFit}
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
          </SubPanel>
          <SubPanel idBase="ov" id="grades" value={pane}>
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
          </SubPanel>
          <SubPanel idBase="ov" id="trend" value={pane}>
            <ChartCard
              title={t("school.trend.title", { defaultValue: "Is learning time per student going up?" })}
              answer={T ? t("school.trend.answer", { defaultValue: "{{m}} per student in this period.", m: fmtDuration(T.minutesPerStudent || 0) }) : ""}
              loading={ov.loading}
              table={toTable.trend(trend, t)}
            >
              <TrendLine data={trend} unit="min" seriesLabel={t("school.trend.now", { defaultValue: "This period" })} prevLabel={d?.range?.term ? (d.range.term.previous || "") : t("school.trend.before", { defaultValue: "Period before" })} />
            </ChartCard>
          </SubPanel>
          <SubPanel idBase="ov" id="people" value={pane}>
            <AtRiskPreview lists={lists} />
          </SubPanel>
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
        <p className={s.cardSub}>{l ? (l.atRiskCount === 1 ? t("school.risk.sub1", { defaultValue: "1 student." }) : t("school.risk.sub", { defaultValue: "{{n}} students, grouped by class.", n: l.atRiskCount })) : ""}</p>
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
