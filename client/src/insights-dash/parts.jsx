// Small shared pieces of the grown-up insights: the period toggle, measure tiles and the
// weekly small-multiple trends (plain SVG, no chart library: a text summary and a hidden table each).
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { FaArrowUp, FaArrowDown, FaEquals, FaHourglassHalf } from "react-icons/fa";
import { day } from "./fmt.js";
import { tx } from "./strings.js";
import { trendSeries } from "./render.js";
import s from "./insights.module.css";


// 7 days | 4 weeks, as a radio group (arrow keys move between them).
export function PeriodToggle({ value, onChange }) {
  const { t } = useTranslation();
  const name = useId();
  const opts = [[7, tx(t, "glance.days7"), tx(t, "glance.days7Long")], [28, tx(t, "glance.days28"), tx(t, "glance.days28Long")]];
  return (
    <div className={s.toggle} role="radiogroup" aria-label={tx(t, "glance.period")}>
      {opts.map(([d, label, long]) => (
        <label key={d}>
          <input type="radio" name={name} value={d} checked={value === d} onChange={() => onChange(d)} aria-label={long} />
          <span aria-hidden="true">{label}</span>
        </label>
      ))}
    </div>
  );
}

const STATUS_ICON = { up: FaArrowUp, more: FaArrowUp, down: FaArrowDown, fewer: FaArrowDown, steady: FaEquals, same: FaEquals, early: FaHourglassHalf };

export function Measure({ label, value, status, statusLabel, before, why }) {
  const Icon = STATUS_ICON[status];
  return (
    <li className={s.measure}>
      <span className={s.mLabel}>{label}</span>
      <span className={s.mValue}>{value ?? "—"}</span>
      {statusLabel && <span className={s.mStatus} data-s={status}>{Icon && <Icon aria-hidden="true" />}{statusLabel}</span>}
      {before && <span className={s.mBefore}>{before}</span>}
      {why && <span className={s.mBefore}>{why}</span>}
    </li>
  );
}

// One small multiple: a line (shares) or bars (days), gaps where a week had too few answers.
function Spark({ points, kind, max = 100, label }) {
  const W = 200, H = 64, n = points.length;
  const x = (i) => (n <= 1 ? W / 2 : 6 + (i * (W - 12)) / (n - 1));
  const y = (v) => H - 4 - (Math.max(0, Math.min(max, v)) / max) * (H - 10);
  if (kind === "bars") {
    const bw = Math.max(6, (W - 12) / n - 6);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} focusable="false">
        <line className={s.trendBase} x1="0" x2={W} y1={H - 3} y2={H - 3} />
        {points.map((p, i) => (p.value == null
          ? null
          : <rect key={p.week} className={p.partial ? s.trendBarPartial : s.trendBar} x={x(i) - bw / 2} width={bw} y={y(p.value)} height={Math.max(1.5, H - 3 - y(p.value))} rx="2" />))}
      </svg>
    );
  }
  // Line segments only between neighbouring weeks that both have a value.
  const segs = [];
  for (let i = 1; i < n; i++) if (points[i - 1].value != null && points[i].value != null) segs.push(`M${x(i - 1)},${y(points[i - 1].value)}L${x(i)},${y(points[i].value)}`);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} focusable="false">
      <line className={s.trendBase} x1="0" x2={W} y1={H - 3} y2={H - 3} />
      <path className={s.trendLine} d={segs.join("")} vectorEffect="non-scaling-stroke" />
      {points.map((p, i) => (p.value == null
        ? <circle key={p.week} className={s.trendGap} cx={x(i)} cy={H - 3} r="1.6" />
        : <circle key={p.week} className={p.partial ? s.trendHollow : s.trendDot} cx={x(i)} cy={y(p.value)} r="3.2" vectorEffect="non-scaling-stroke" />))}
    </svg>
  );
}

const METRICS = [
  { key: "days", kind: "bars", max: 7, unit: "" },
  { key: "firstTry", kind: "line", max: 100, unit: "%" },
  { key: "independent", kind: "line", max: 100, unit: "%" },
  { key: "remembered", kind: "line", max: 100, unit: "%" },
];

export function WeeklyTrends({ weeks, rules, headingLevel = 3 }) {
  const { t } = useTranslation();
  const H = `h${headingLevel}`;
  const id = useId();
  if (!weeks?.length) return null;
  const fmt = (m, v) => (v == null ? tx(t, "trend.few") : m.key === "days" ? `${v} / 7` : `${v}${m.unit}`);
  return (
    <section className={s.card} aria-labelledby={id}>
      <H id={id} className={s.h3}>{tx(t, "trend.title")}</H>
      <p className={s.sub}>{tx(t, "trend.sub", { n: rules?.minWeekAnswers ?? 10 })}</p>
      <div className={s.trends}>
        {METRICS.map((m) => {
          const ser = trendSeries(weeks, m.key);
          const title = tx(t, `trend.${m.key}`);
          let summary;
          if (!ser.count) summary = tx(t, "trend.noData");
          else if (m.key === "days") {
            const full = ser.points.filter((p) => p.value != null && !p.partial);
            const last = full[full.length - 1], prev = full[full.length - 2];
            summary = tx(t, "trend.summaryDays", { last: last?.value ?? "—", prev: prev ? `${prev.value} / 7` : "—" });
          } else {
            summary = tx(t, "trend.summary", { from: fmt(m, ser.first.value), to: fmt(m, ser.last.value), firstWeek: day(ser.first.week), lastWeek: day(ser.last.week) });
          }
          return (
            <figure key={m.key} className={s.trend} style={{ margin: 0 }}>
              <figcaption><h4>{title}</h4></figcaption>
              <div aria-hidden="true"><Spark points={ser.points} kind={m.kind} max={m.max} label="" /></div>
              <p className={s.trendText}>{summary}</p>
              <div className={s.srOnly}><table>
                <caption>{tx(t, "trend.table", { metric: title })}</caption>
                <thead><tr><th scope="col">{tx(t, "trend.colWeek")}</th><th scope="col">{tx(t, "trend.colValue")}</th></tr></thead>
                <tbody>
                  {ser.points.map((p) => (
                    <tr key={p.week}>
                      <th scope="row">{tx(t, "trend.week", { date: day(p.week) })}{p.partial ? ` (${tx(t, "trend.thisWeek")})` : ""}</th>
                      <td>{fmt(m, p.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
