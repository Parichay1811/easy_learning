import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartFrame, { Swatch } from './ChartFrame';
import TooltipCard from './TooltipCard';
import { AXIS_TICK, GRID_STROKE, defaultXFormat, defaultXFull, makeValueFormat, tickFormat } from './rechartsBits';
import { MAX_POINTS } from '../constants';
import { fmtDelta, fmtPercent } from '../format';
import { capPoints, prefersReducedMotion } from '../utils';
import s from './charts.module.css';

const COLOR = 'var(--d-accent-ink)';

function Diamond({ cx, cy }) {
  if (cx == null || cy == null) return null;
  return <path d={`M${cx} ${cy - 8} L${cx + 7} ${cy} L${cx} ${cy + 8} L${cx - 7} ${cy} Z`} fill="var(--d-card)" stroke="var(--d-ink)" strokeWidth="2.5" />;
}

/**
 * "Is it getting better?" Current period as a solid line, the previous period
 * as a dashed line over a soft band, and milestones as diamond markers.
 *
 *   <TrendLine data={[{ x: '2026-11-09', value: 20, prev: 14 }, …]} unit="min"
 *              milestones={[{ x: '2026-11-12', label: 'Fractions test' }]} />
 *
 * Props: data [{x, value, prev?}] (x = ISO date or any label), unit ('min' | '%' | anything),
 *        milestones [{x, label}], seriesLabel, prevLabel, height (default 260),
 *        yFormat(v), xFormat(x), color, summary.
 */
export default function TrendLine({
  data = [], unit = 'min', milestones = [], seriesLabel, prevLabel, height = 260, yFormat, xFormat = defaultXFormat, color = COLOR, summary, label,
}) {
  const { t } = useTranslation();
  const rows = useMemo(() => capPoints(data, MAX_POINTS), [data]);
  // '%' accepts either fractions (0.86, the kit's convention) or whole percentages (86, as the
  // analytics API returns them): values all within 0..1 are read as fractions.
  const isPct = unit === '%';
  const fraction = isPct && rows.every((r) => (r.value == null || r.value <= 1) && (r.prev == null || r.prev <= 1));
  const fmtY = yFormat || (isPct ? (v) => (v == null ? '—' : fmtPercent(fraction ? v : v / 100)) : makeValueFormat(unit));
  const axisTick = isPct ? (v) => `${Math.round(fraction ? v * 100 : v)}%` : tickFormat;
  const hasPrev = rows.some((r) => r.prev != null);
  const cur = seriesLabel || t('dash.trend.current', { defaultValue: 'This period' });
  const prv = prevLabel || t('dash.trend.prev', { defaultValue: 'Previous period' });
  const marks = milestones.map((m) => ({ ...m, y: rows.find((r) => r.x === m.x)?.value })).filter((m) => m.y != null);

  const vals = rows.map((r) => r.value).filter(Number.isFinite);
  let auto = t('dash.trend.none', { defaultValue: 'No data in this period.' });
  if (vals.length) {
    const hi = rows.reduce((a, b) => ((b.value ?? -Infinity) > (a.value ?? -Infinity) ? b : a));
    const sumCur = vals.reduce((a, b) => a + b, 0);
    const sumPrev = rows.map((r) => r.prev).filter(Number.isFinite).reduce((a, b) => a + b, 0);
    const d = hasPrev ? fmtDelta(sumCur, sumPrev, { vs: prv }) : null;
    auto = t('dash.trend.summary', {
      defaultValue: 'Line chart with {{n}} points. Starts at {{first}}, ends at {{last}}. Highest: {{hi}} on {{when}}.{{cmp}}{{marks}}',
      n: rows.length, first: fmtY(vals[0]), last: fmtY(vals[vals.length - 1]), hi: fmtY(hi.value), when: defaultXFull(hi.x),
      cmp: d && d.text !== '—' ? ` ${d.srText}.` : '',
      marks: marks.length ? ` ${t('dash.trend.marks', { defaultValue: 'Milestones' })}: ${marks.map((m) => `${defaultXFull(m.x)} ${m.label}`).join('; ')}.` : '',
    });
  }

  return (
    <ChartFrame label={label || t('dash.trend.label', { defaultValue: 'Trend line' })} summary={summary || auto}>
      <div className={s.rc} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 200 }}>
          <ComposedChart data={rows} margin={{ top: 14, right: 12, bottom: 0, left: 0 }} accessibilityLayer>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="x" tick={AXIS_TICK} tickFormatter={xFormat} tickLine={false} axisLine={{ stroke: GRID_STROKE }} minTickGap={24} />
            <YAxis tick={AXIS_TICK} tickFormatter={axisTick} tickLine={false} axisLine={false} width={44} />
            <Tooltip
              cursor={{ stroke: 'var(--d-control)', strokeDasharray: '4 4' }}
              content={(p) => (
                <TooltipCard
                  {...p}
                  title={(x) => defaultXFull(x)}
                  rows={(pl) => {
                    const r = pl[0].payload;
                    const out = [{ label: cur, value: fmtY(r.value), swatch: <Swatch kind="line" color={color} /> }];
                    if (r.prev != null) out.push({ label: prv, value: fmtY(r.prev), swatch: <Swatch kind="line" color="var(--d-muted)" dashed /> });
                    const m = milestones.find((x) => x.x === r.x);
                    if (m) out.push({ label: '◆', value: m.label });
                    return out;
                  }}
                />
              )}
            />
            {hasPrev && (
              <Area dataKey="prev" name={prv} stroke="var(--d-muted)" strokeWidth={2} strokeDasharray="6 5" fill="var(--d-band)" dot={false} activeDot={false} isAnimationActive={!prefersReducedMotion()} connectNulls />
            )}
            <Line dataKey="value" name={cur} stroke={color} strokeWidth={3} dot={rows.length <= 40 ? { r: 3.5, fill: 'var(--d-card)', stroke: color, strokeWidth: 2 } : false} activeDot={{ r: 6 }} isAnimationActive={!prefersReducedMotion()} connectNulls />
            {marks.map((m) => (
              <ReferenceDot key={m.x} x={m.x} y={m.y} r={8} shape={<Diamond />} ifOverflow="visible" />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ul className={s.legend}>
        <li><Swatch kind="line" color={color} />{cur}</li>
        {hasPrev && <li><Swatch kind="line" color="var(--d-muted)" dashed />{prv}</li>}
        {marks.map((m) => (
          <li key={m.x}>
            <svg width="16" height="16" viewBox="-8 -8 16 16" aria-hidden="true"><Diamond cx={0} cy={0} /></svg>
            {defaultXFormat(m.x)}: {m.label}
          </li>
        ))}
      </ul>
    </ChartFrame>
  );
}
