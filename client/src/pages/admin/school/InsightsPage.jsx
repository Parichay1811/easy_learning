// ADM-042 Compare · ADM-043 At-risk and wins · ADM-044 Usage and adoption.
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChartCard, TrendLine, HourWeekdayHeatmap, DataTable, KpiTile, Skeleton, Button,
  fmtDuration, fmtDate, fmtPercent, NO_DATA, subjectLabel, toTable,
} from "../../../components/dashboard";
import { useLoad, qs } from "./api";
import { useSchoolRange } from "./useSchoolRange";
import { useSchool, BASE } from "./context";
import { Tabs, Health, Field, RangeControl } from "./bits";
import s from "./school.module.css";

const flatten = (nodes, depth = 0, out = []) => { for (const n of nodes || []) { out.push({ ...n, depth }); flatten(n.children, depth + 1, out); } return out; };
const pctOf = (v) => (v == null ? NO_DATA : fmtPercent(v / 100));

function Compare({ params }) {
  const { t } = useTranslation();
  const { has } = useSchool();
  const units = useLoad("/units", { skip: !has("org.tree") });
  const teachers = useLoad("/school/teachers");
  const flat = useMemo(() => flatten(units.data?.tree), [units.data]);
  const [items, setItems] = useState(["school", ""]);
  const [periods, setPeriods] = useState(false);
  const [p2, setP2] = useState({ from: "", to: "" });
  const choices = [
    { value: "school", label: t("school.compare.school", { defaultValue: "Whole school (my view)" }) },
    ...flat.map((u) => ({ value: `unit:${u.id}`, label: `${"— ".repeat(u.depth)}${u.name}` })),
    ...(teachers.data?.teachers || []).map((x) => ({ value: `teacher:${x.id}`, label: t("school.compare.teacherX", { defaultValue: "Teacher: {{n}}", n: x.name }) })),
  ];
  const specs = periods
    ? (items[0] && p2.from && p2.to ? [`${items[0]}@${params.from}..${params.to}`, `${items[0]}@${p2.from}..${p2.to}`] : [])
    : items.filter(Boolean);
  const ready = specs.length >= 2 && new Set(specs).size === specs.length;
  const res = useLoad(`/school/compare${qs({ ...params, items: specs.join(",") })}`, { skip: !ready });
  const rows = res.data?.items || [];
  return (
    <div className={s.page}>
      <section className={s.card} aria-labelledby="cmp-h">
        <h2 id="cmp-h" className={s.cardTitle}>{t("school.compare.title", { defaultValue: "Compare side by side" })}</h2>
        <label className={s.check}><input type="checkbox" checked={periods} onChange={(e) => setPeriods(e.target.checked)} /><span>{t("school.compare.periods", { defaultValue: "Compare one unit across two periods" })}</span></label>
        <div className={s.formGrid}>
          {(periods ? [0] : items.map((_, i) => i)).map((i) => (
            <Field key={i} id={`cmp-${i}`} label={t("school.compare.item", { defaultValue: "Item {{n}}", n: i + 1 })}>
              <select id={`cmp-${i}`} className={s.select} value={items[i]} onChange={(e) => setItems((it) => it.map((x, j) => (j === i ? e.target.value : x)))}>
                <option value="">{t("school.choose", { defaultValue: "Choose…" })}</option>
                {choices.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
          ))}
          {periods && (
            <>
              <Field id="p2-from" label={t("school.compare.p2from", { defaultValue: "Second period from" })}><input id="p2-from" type="date" className={s.input} value={p2.from} onChange={(e) => setP2({ ...p2, from: e.target.value })} /></Field>
              <Field id="p2-to" label={t("school.compare.p2to", { defaultValue: "to" })}><input id="p2-to" type="date" className={s.input} value={p2.to} onChange={(e) => setP2({ ...p2, to: e.target.value })} /></Field>
            </>
          )}
        </div>
        {!periods && items.length < 4 && <div className={s.actions}><Button size="sm" variant="ghost" onClick={() => setItems((it) => [...it, ""])}>{t("school.compare.add", { defaultValue: "Add another" })}</Button></div>}
      </section>
      {!ready ? <p className={s.muted}>{t("school.compare.pick", { defaultValue: "Choose at least two different things to compare." })}</p>
        : res.loading ? <Skeleton variant="chart" /> : res.error ? <p className={s.errorText}>{res.error.message}</p> : (
          <section className={s.card} aria-labelledby="cmp-r">
            <h2 id="cmp-r" className={s.cardTitle}>{t("school.compare.result", { defaultValue: "Per student, so different sizes compare fairly" })}</h2>
            {res.data.notes.map((n) => <p key={n} className={`${s.banner} ${s.attention}`} style={{ margin: "0 0 10px" }}>{n}</p>)}
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th scope="col">{t("school.compare.metric", { defaultValue: "Measure" })}</th>
                    {rows.map((r) => <th key={r.key} scope="col">{r.name}<div className={`${s.small} ${s.muted}`}>{fmtDate({ from: r.range.from, to: r.range.to })}</div></th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr><th scope="row">{t("school.compare.students", { defaultValue: "Students" })}</th>{rows.map((r) => <td key={r.key} className={s.num}>{r.learners}</td>)}</tr>
                  <tr><th scope="row">{t("school.tile.active", { defaultValue: "Active students" })}</th>{rows.map((r) => <td key={r.key} className={s.num}>{pctOf(r.activePct)}</td>)}</tr>
                  <tr><th scope="row">{t("school.tile.minutes", { defaultValue: "Minutes per student" })}</th>{rows.map((r) => <td key={r.key} className={s.num}>{r.minutesPerLearner != null ? fmtDuration(r.minutesPerLearner) : NO_DATA}</td>)}</tr>
                  <tr><th scope="row">{t("school.tile.accuracy", { defaultValue: "Accuracy" })}</th>{rows.map((r) => <td key={r.key} className={s.num}>{pctOf(r.accuracy)}</td>)}</tr>
                  <tr><th scope="row">{t("school.engagement", { defaultValue: "Engagement" })}</th>{rows.map((r) => <td key={r.key}><Health value={r.engagement} /></td>)}</tr>
                  {["english", "maths", "science"].map((sub) => (
                    <tr key={sub}><th scope="row">{subjectLabel(t, sub)} · {t("school.tile.accuracy", { defaultValue: "Accuracy" })}</th>{rows.map((r) => <td key={r.key} className={s.num}>{pctOf(r.subjects[sub]?.accuracy)}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
    </div>
  );
}

const REASON = { inactive: "No learning for 7 days", accuracy_drop: "Accuracy fell more than 15 points" };

function Lists({ params }) {
  const { t } = useTranslation();
  const data = useLoad(`/school/lists${qs(params)}`);
  if (data.loading) return <Skeleton variant="chart" />;
  if (data.error) return <p className={s.errorText}>{data.error.message}</p>;
  const d = data.data;
  return (
    <div className={s.grid2}>
      <section className={`${s.card} ${s.fitCard}`} aria-labelledby="ar-h">
        <h2 id="ar-h" className={s.cardTitle}>{t("school.risk.title", { defaultValue: "Who needs a nudge?" })}</h2>
        <p className={s.cardSub}>{(d.atRiskCount === 1 ? t("school.risk.listSub1", { defaultValue: "1 student, with their teachers and why." }) : t("school.risk.listSub", { defaultValue: "{{n}} students, by class, with their teachers and why.", n: d.atRiskCount }))}</p>
        {!d.atRiskCount && <p className={s.okText}>{t("school.risk.none", { defaultValue: "Nobody right now. Lovely." })}</p>}
        {d.atRisk.map((g) => (
          <div key={g.unit} style={{ marginBottom: 14 }}>
            <h3 className={s.label}>{g.unit} <span className={`${s.pill} ${s.pillAttention}`}>{g.students.length}</span></h3>
            <ul className={s.list}>
              {g.students.map((x) => (
                <li key={x.email} className={s.listItem}>
                  <span><Link to={`${BASE}/students/${x.id}`} className={s.strong}>{x.name}</Link><br /><span className={`${s.small} ${s.muted}`}>{t(`school.risk.reason.${x.reason}`, { defaultValue: REASON[x.reason] || x.reason })}{x.lastActive ? ` · ${t("school.risk.last", { defaultValue: "last learned {{d}}", d: fmtDate(x.lastActive) })}` : ""}</span></span>
                  <span className={`${s.small} ${s.muted}`}>{x.teachers?.join(", ") || t("school.risk.noTeacher", { defaultValue: "No teacher yet" })}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      <section className={`${s.card} ${s.fitCard}`} aria-labelledby="w-h">
        <h2 id="w-h" className={s.cardTitle}>{t("school.wins.title", { defaultValue: "Who should we celebrate?" })}</h2>
        <p className={s.cardSub}>{t("school.wins.sub", { defaultValue: "The biggest improvers compared with the period before." })}</p>
        {!d.wins.length && <p className={s.muted}>{t("school.wins.none", { defaultValue: "No big jumps yet in this period." })}</p>}
        <ul className={s.list}>
          {d.wins.map((w) => (
            <li key={w.email} className={s.listItem}>
              <span><Link to={`${BASE}/students/${w.id}`} className={s.strong}>{w.name}</Link><br /><span className={`${s.small} ${s.muted}`}>{w.unit}</span></span>
              <span className={`${s.pill} ${s.pillGood}`}>{w.why === "accuracy_up" ? t("school.wins.acc", { defaultValue: "▲ accuracy +{{n}} pts", n: w.accuracyDelta }) : t("school.wins.time", { defaultValue: "▲ {{m}} more learning", m: fmtDuration(w.minutesDelta) })}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const FEATURE = { practice: "Practice", warrior: "Warrior mode", test: "Tests", homework: "Homework", ar: "AR games", ai_teacher: "AI Teacher" };

// part "people": who uses Learnigo and how many learn each day; part "habits": when, what and on what.
function Usage({ params, part = "people" }) {
  const { t } = useTranslation();
  const data = useLoad(`/school/usage${qs(params)}`);
  const d = data.data;
  const heat = useMemo(() => (d?.heat || []).flatMap((row, weekday) => row.map((value, hour) => ({ weekday, hour, value }))), [d]);
  const trend = useMemo(() => (d?.learners?.series || []).map((p) => ({ x: p.date, value: p.learners })), [d]);
  if (data.loading) return <Skeleton variant="chart" />;
  if (data.error) return <p className={s.errorText}>{data.error.message}</p>;
  const totalF = Object.values(d.features).reduce((a, b) => a + b, 0) || 1;
  const totalD = Object.values(d.devices).reduce((a, b) => a + b, 0) || 1;
  if (part === "people") return (
    <div className={s.page}>
      <div className={s.tiles}>
        <KpiTile label={t("school.usage.learners", { defaultValue: "Students who learned" })} value={`${d.learners.activeInRange} / ${d.learners.total}`} helpText={t("school.usage.learnersHelp", { defaultValue: "At least one answer or 3 minutes in this period." })} />
        <KpiTile label={t("school.usage.teachers", { defaultValue: "Teachers active (30 days)" })} value={`${d.teachers.active30} / ${d.teachers.total}`} tone={d.teachers.active30 < d.teachers.total / 2 ? "attention" : "good"} helpText={t("school.usage.teachersHelp", { defaultValue: "Signed in during the last 30 days." })} />
        <KpiTile label={t("school.usage.parents", { defaultValue: "Parents linked" })} value={`${d.parents.linked} / ${d.parents.total}`} helpText={t("school.usage.parentsHelp", { defaultValue: "{{i}} invited, {{b}} bounced.", i: d.parents.invited, b: d.parents.bounced })} to={`${BASE}/people/parents`} />
        <KpiTile label={t("school.usage.staff", { defaultValue: "Staff active (30 days)" })} value={`${d.staff.active30} / ${d.staff.total}`} />
      </div>
      <ChartCard title={t("school.usage.trendTitle", { defaultValue: "How many students learn each day?" })} answer={t("school.usage.trendAnswer", { defaultValue: "Peak: {{n}} students on one day.", n: Math.max(0, ...trend.map((p) => p.value)) })} table={toTable.trend(trend, t, { unit: "" })}>
        <TrendLine data={trend} unit={t("school.usage.studentsUnit", { defaultValue: "students" })} seriesLabel={t("school.usage.activeStudents", { defaultValue: "Active students" })} />
      </ChartCard>
    </div>
  );
  return (
    <div className={s.page}>
      <div className={s.grid2}>
        <ChartCard title={t("school.usage.heatTitle", { defaultValue: "When do students learn?" })} answer={d.bestHour != null ? t("school.usage.heatAnswer", { defaultValue: "Busiest around {{h}}:00.", h: d.bestHour }) : ""} table={toTable.hourWeekday(heat, t)}>
          <HourWeekdayHeatmap data={heat} unit={t("school.usage.events", { defaultValue: "answers" })} />
        </ChartCard>
        <section className={s.card} aria-labelledby="feat-h">
          <h2 id="feat-h" className={s.cardTitle}>{t("school.usage.featTitle", { defaultValue: "What do they use, and on what?" })}</h2>
          <h3 className={s.label}>{t("school.usage.features", { defaultValue: "Features" })}</h3>
          <ul className={s.list}>
            {Object.entries(d.features).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <li key={k} className={s.listItem}><span>{t(`school.feature.${k}`, { defaultValue: FEATURE[k] || k })}</span><span className={s.small}>{fmtPercent(v / totalF)}</span></li>
            ))}
            {!Object.keys(d.features).length && <li className={s.muted}>{t("school.usage.noData", { defaultValue: "No learning in this period." })}</li>}
          </ul>
          <h3 className={s.label} style={{ marginTop: 14 }}>{t("school.usage.devices", { defaultValue: "Devices" })}</h3>
          <ul className={s.list}>
            {Object.entries(d.devices).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <li key={k} className={s.listItem}><span>{t(`school.device.${k}`, { defaultValue: k[0].toUpperCase() + k.slice(1) })}</span><span className={s.small}>{fmtPercent(v / totalD)}</span></li>
            ))}
          </ul>
          {d.teachers.neverSignedIn.length > 0 && (
            <p className={`${s.small} ${s.attentionInk}`} style={{ marginTop: 14 }}>{t("school.usage.never", { defaultValue: "Not signed in yet (training may help): {{list}}", list: d.teachers.neverSignedIn.map((x) => x.name).join(", ") })}</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const { t } = useTranslation();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get("tab") || "lists";
  const { tr, params } = useSchoolRange({ defaultRange: "month" });
  const setTab = (k) => setSp((p) => { const n = new URLSearchParams(p); n.set("tab", k); return n; });
  const tabs = [
    { key: "lists", label: t("school.insights.lists", { defaultValue: "Needs a nudge & wins" }) },
    { key: "compare", label: t("school.insights.compare", { defaultValue: "Compare" }) },
    { key: "usage", label: t("school.insights.usagePeople", { defaultValue: "Who uses it" }) },
    { key: "habits", label: t("school.insights.usageHabits", { defaultValue: "When & how" }) },
  ];
  return (
    <div className={`${s.page} ${s.pageTight}`}>
      <div className={s.head}>
        <div>
          <h1 className={s.title}>{t("school.insights.title", { defaultValue: "Insights" })}</h1>
          <p className={`${s.sub} ${s.subOptional}`}>{t("school.insights.sub", { defaultValue: "Who needs help, who to celebrate, and how the school uses Learnigo." })}</p>
        </div>
      </div>
      <Tabs label={t("school.insights.title", { defaultValue: "Insights" })} tabs={tabs} value={tab} onChange={setTab} />
      <RangeControl tr={tr} showCompare={false} />
      <div role="tabpanel" className={s.panel}>
        {tab === "lists" && <Lists params={params} />}
        {tab === "compare" && <Compare params={params} />}
        {tab === "usage" && <Usage params={params} part="people" />}
        {tab === "habits" && <Usage params={params} part="habits" />}
      </div>
    </div>
  );
}
