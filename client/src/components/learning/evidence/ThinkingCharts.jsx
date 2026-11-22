// "Growth in the kind of thinking": the highest stage reached, week by week,
// and how often answers are right at each stage (with how many answers).
import { useTranslation } from "react-i18next";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, fmtPercent } from "../../dashboard";
import TooltipCard from "../../dashboard/charts/TooltipCard";
import ChartFrame from "../../dashboard/charts/ChartFrame";
import { AXIS_TICK, GRID_STROKE } from "../../dashboard/charts/rechartsBits";
import chartCss from "../../dashboard/charts/charts.module.css";
import { SUBJECT_META, subjectName } from "../levels";
import { reducedMotion } from "../../../utils/learnerPrefs";
import { STAGES, SMALL_WEEK, stageName, stageShort, stageText } from "./model";
import c from "./evidence.module.css";

// Colour + line pattern + marker shape, so subjects never differ by colour alone.
const DASH = ["", "7 4", "2 4"];
const SHAPES = ["circle", "square", "triangle"];
const inkOf = (s) => SUBJECT_META[s]?.ink || "var(--d-ink)";

function Marker({ cx, cy, shape, color, r = 5 }) {
  if (cx == null || cy == null) return null;
  if (shape === "square") return <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} rx={1.5} fill="var(--d-card)" stroke={color} strokeWidth={2.5} />;
  if (shape === "triangle") return <path d={`M${cx} ${cy - r - 1} L${cx + r + 1} ${cy + r} L${cx - r - 1} ${cy + r} Z`} fill="var(--d-card)" stroke={color} strokeWidth={2.5} />;
  return <circle cx={cx} cy={cy} r={r} fill="var(--d-card)" stroke={color} strokeWidth={2.5} />;
}

// One line per tick, never wrapped (Recharts' own tick wraps long words on phones).
function StageTick({ x, y, label }) {
  return <text x={x} y={y} dy={4} textAnchor="end" fill={AXIS_TICK.fill} fontSize={AXIS_TICK.fontSize}>{label}</text>;
}

function LegendMark({ i, color }) {
  return (
    <svg width="34" height="14" aria-hidden="true" focusable="false">
      <line x1="2" y1="7" x2="32" y2="7" stroke={color} strokeWidth="2.5" strokeDasharray={DASH[i % 3] || undefined} />
      <Marker cx={17} cy={7} r={4} shape={SHAPES[i % 3]} color={color} />
    </svg>
  );
}

/** Highest stage reached so far, per subject, week by week (a step line from 0 everyday to 5 transfer). */
export function StageGrowth({ stages, name, className = "" }) {
  const { t } = useTranslation();
  const { rows, subjects } = stages;
  const weekOf = (x) => t("evidence.weekOf", { defaultValue: "Week of {{d}}", d: x });
  const stageWords = (n) => (n == null ? "—" : t("evidence.stageN", { defaultValue: "Stage {{n}} · {{name}}", n, name: stageName(t, n) }));
  const summary = subjects.map((s) => {
    const pts = rows.filter((r) => r[s] != null);
    if (!pts.length) return "";
    const a = pts[0];
    const b = pts[pts.length - 1];
    return t("evidence.stages.sr", {
      defaultValue: "{{subject}}: stage {{from}} in the week of {{w1}}, stage {{to}} by the week of {{w2}}.",
      subject: subjectName(t, s), from: `${a[s]} (${stageName(t, a[s])})`, w1: a.x, to: `${b[s]} (${stageName(t, b[s])})`, w2: b.x,
    });
  }).filter(Boolean).join(" ");
  const chartLabel = t("evidence.stages.label", "Step chart: highest stage of thinking reached so far, week by week, per subject");
  const latest = subjects.map((s) => ({ s, v: rows[rows.length - 1]?.[s] })).filter((x) => x.v != null);
  const answer = latest.length
    ? latest.map((x) => `${subjectName(t, x.s)}: ${stageWords(x.v)}`).join(" · ")
    : undefined;
  const table = {
    caption: t("evidence.stages.title", { defaultValue: "What kind of thinking is {{name}} reaching?", name }),
    columns: [
      { key: "x", label: t("evidence.col.week", "Week of") },
      ...subjects.map((s) => ({
        key: s, label: subjectName(t, s),
        render: (r) => (r[s] == null ? "—" : `${stageWords(r[s])}${r[`${s}Week`] != null && r[`${s}Week`] !== r[s] ? ` (${t("evidence.stages.thatWeek", { defaultValue: "that week: {{n}}", n: r[`${s}Week`] })})` : ""}`),
      })),
    ],
    rows,
    getRowKey: (r) => r.key,
  };
  return (
    <ChartCard className={className}
      title={t("evidence.stages.title", { defaultValue: "What kind of thinking is {{name}} reaching?", name })}
      answer={answer}
      info={t("evidence.stages.info", "Each question asks for one kind of thinking, from 0 (everyday curiosity) to 5 (using an idea in a new situation). The line shows the highest stage answered correctly so far, week by week. It is not a score.")}
      table={table}
      empty={!rows.length && { title: t("evidence.stages.emptyT", "No weeks to show yet"), text: t("evidence.stages.emptyD", "After a week of practice, the kind of thinking reached shows up here.") }}>
      <ChartFrame label={chartLabel} summary={summary}>
      <div className={chartCss.rc} style={{ height: 230 }}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 200 }}>
          <LineChart data={rows} margin={{ top: 12, right: 14, bottom: 0, left: 0 }} accessibilityLayer title={chartLabel} desc={summary}>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="x" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_STROKE }} minTickGap={16} padding={{ left: 14, right: 10 }} />
            <YAxis domain={[0, 5]} ticks={STAGES} allowDecimals={false} tickLine={false} axisLine={false} width={100}
              tick={(p) => <StageTick {...p} label={`${p.payload.value} ${stageShort(t, p.payload.value)}`} />} />
            <Tooltip cursor={{ stroke: "var(--d-control)", strokeDasharray: "4 4" }}
              content={(p) => (
                <TooltipCard {...p} title={weekOf}
                  rows={(pl) => subjects.map((s, i) => ({ label: subjectName(t, s), value: stageWords(pl[0].payload[s]), swatch: <LegendMark i={i} color={inkOf(s)} /> }))} />
              )} />
            {subjects.map((s, i) => (
              <Line key={s} dataKey={s} name={subjectName(t, s)} type="stepAfter" stroke={inkOf(s)} strokeWidth={2.5}
                strokeDasharray={DASH[i % 3] || undefined} connectNulls={false}
                dot={(d) => <Marker key={`${s}-${d.index}`} cx={d.cx} cy={d.cy} shape={SHAPES[i % 3]} color={inkOf(s)} />}
                activeDot={(d) => <Marker key={`${s}-a-${d.index}`} cx={d.cx} cy={d.cy} r={7} shape={SHAPES[i % 3]} color={inkOf(s)} />}
                isAnimationActive={!reducedMotion()} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className={chartCss.legend}>
        {subjects.map((s, i) => <li key={s}><LegendMark i={i} color={inkOf(s)} />{subjectName(t, s)}</li>)}
      </ul>
      </ChartFrame>
    </ChartCard>
  );
}

/** How often answers are right at each stage, with the number of answers behind each bar. */
export function StageAccuracy({ byStage, name, className = "" }) {
  const { t } = useTranslation();
  const tried = byStage.filter((x) => x.attempts > 0);
  const summary = tried.map((x) => t("evidence.byStage.sr", {
    defaultValue: "Stage {{n}} {{name}}: {{pct}} right over {{total}} answers, {{own}} on their own.",
    n: x.stage, name: stageName(t, x.stage), pct: fmtPercent(x.accuracy), total: x.attempts, own: x.independent,
  })).join(" ");
  const table = {
    caption: t("evidence.byStage.title", "How often is each kind of thinking right?"),
    columns: [
      { key: "stage", label: t("evidence.col.stage", "Stage"), render: (r) => `${r.stage} · ${stageName(t, r.stage)}` },
      { key: "attempts", label: t("evidence.col.answers", "Answers"), align: "end" },
      { key: "correct", label: t("evidence.col.correct", "Right"), align: "end" },
      { key: "accuracy", label: t("evidence.col.share", "Share right"), align: "end", render: (r) => fmtPercent(r.accuracy) },
      { key: "independent", label: t("evidence.col.own", "On their own"), align: "end" },
    ],
    rows: byStage,
    getRowKey: (r) => r.stage,
  };
  const anySmall = tried.some((x) => x.attempts < SMALL_WEEK);
  return (
    <ChartCard className={className}
      title={t("evidence.byStage.title", "How often is each kind of thinking right?")}
      answer={t("evidence.byStage.answer", { defaultValue: "Share of right answers at each stage, from 0% to 100%, with the number of answers.", name })}
      info={t("evidence.byStage.info", "Right answers divided by all answers at that stage. Harder stages are expected to be lower: that is where the stretch is.")}
      summary={summary} table={table}
      empty={!tried.length && { title: t("evidence.byStage.emptyT", "No answers yet"), text: t("evidence.byStage.emptyD", "Answers at each kind of thinking will show up here.") }}>
      <div className={c.chart} tabIndex={0} role="group" aria-label={summary}>
        <ul className={c.stageRows}>
          {byStage.map((x) => (
            <li key={x.stage} className={`${c.stageRow} ${x.attempts && x.attempts < SMALL_WEEK ? c.small : ""}`} title={stageText(t, x.stage)}>
              <span className={c.stageName}><b>{x.stage}</b><span>{stageName(t, x.stage)}</span></span>
              {x.attempts > 0 ? (
                <span className={c.stageValue}>
                  <strong>{fmtPercent(x.accuracy)}</strong>{" · "}
                  {t("evidence.answers", { defaultValue: "{{count}} answers", defaultValue_one: "{{count}} answer", count: x.attempts })}
                  {x.attempts < SMALL_WEEK ? ` · ${t("evidence.few", "few answers")}` : ""}
                </span>
              ) : <span className={`${c.stageValue} ${c.none}`}>{t("evidence.byStage.notYet", "Not tried yet")}</span>}
              {x.attempts > 0 && <span className={`${c.meter} ${c.stageMeter}`} aria-hidden="true"><span className={c.fill} style={{ width: `${(x.accuracy || 0) * 100}%` }} /></span>}
            </li>
          ))}
        </ul>
      </div>
      <ul className={c.keys} aria-hidden="true">
        <li><span className={`${c.key} ${c.keySolid}`} />{t("evidence.byStage.keySolid", { defaultValue: "{{n}} or more answers", n: SMALL_WEEK })}</li>
        {anySmall && <li><span className={`${c.key} ${c.keyStriped}`} />{t("evidence.byStage.keyStriped", { defaultValue: "Striped: fewer than {{n}} answers", n: SMALL_WEEK })}</li>}
      </ul>
    </ChartCard>
  );
}
