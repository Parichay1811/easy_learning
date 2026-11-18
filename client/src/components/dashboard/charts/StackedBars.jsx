import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartFrame, { Swatch } from './ChartFrame';
import TooltipCard from './TooltipCard';
import { AXIS_TICK, GRID_STROKE, defaultXFormat, defaultXFull, makeValueFormat, tickFormat } from './rechartsBits';
import { MAX_POINTS, SUBJECTS, subjectLabel } from '../constants';
import { capPoints, prefersReducedMotion } from '../utils';
import s from './charts.module.css';

/** Four fill styles so series differ by texture as well as colour. */
function Pattern({ id, color, index }) {
  const stripe = 'rgba(255,255,255,0.8)';
  if (index === 0) return <pattern id={id} width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill={color} /></pattern>;
  if (index === 1) {
    return (
      <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="8" height="8" fill={color} /><rect width="3" height="8" fill={stripe} />
      </pattern>
    );
  }
  if (index === 2) {
    return (
      <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill={color} /><circle cx="4" cy="4" r="1.7" fill={stripe} />
      </pattern>
    );
  }
  return (
    <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill={color} /><path d="M0 4 H8 M4 0 V8" stroke={stripe} strokeWidth="1.5" />
    </pattern>
  );
}

/**
 * Stacked bars, e.g. minutes per day coloured by subject, with an optional goal line.
 *
 *   <StackedBars data={[{ x: '2026-11-17', english: 20, maths: 15, science: 5 }, …]}
 *                goal={30} />
 *
 * Props: data [{x, <seriesKey>: number, …}], series [{key, label, color}] (default: the three
 *        subjects with their fixed colours), unit ('min'), goal (number: dashed line),
 *        height (260), xFormat(x), yFormat(v), summary.
 * Each series also gets a texture (solid / stripes / dots / grid) so colour is never the only cue.
 */
export default function StackedBars({ data = [], series, unit = 'min', goal, height = 260, xFormat = defaultXFormat, yFormat, summary, label }) {
  const { t } = useTranslation();
  const uid = useId().replace(/:/g, '');
  const keys = series || SUBJECTS.map((x) => ({ key: x.key, label: subjectLabel(t, x.key), color: x.color }));
  const fmtY = yFormat || makeValueFormat(unit);
  const rows = useMemo(() => capPoints(data, MAX_POINTS), [data]);
  const totalOf = (r) => keys.reduce((a, k) => a + (Number(r[k.key]) || 0), 0);

  const grand = rows.reduce((a, r) => a + totalOf(r), 0);
  const top = rows.reduce((a, r) => (totalOf(r) > (a ? totalOf(a) : -1) ? r : a), null);
  const perKey = keys.map((k) => `${k.label} ${fmtY(rows.reduce((a, r) => a + (Number(r[k.key]) || 0), 0))}`).join(', ');
  const auto = grand > 0
    ? t('dash.stack.summary', {
        defaultValue: 'Stacked bar chart, {{n}} bars. Total {{total}} ({{per}}). Highest bar: {{when}} with {{top}}.{{goal}}',
        n: rows.length, total: fmtY(grand), per: perKey, when: defaultXFull(top.x), top: fmtY(totalOf(top)),
        goal: goal ? ` ${t('dash.stack.goal', { defaultValue: 'Goal: {{g}} per bar, reached on {{k}} bars.', g: fmtY(goal), k: rows.filter((r) => totalOf(r) >= goal).length })}` : '',
      })
    : t('dash.stack.none', { defaultValue: 'No data in this period.' });

  return (
    <ChartFrame label={label || t('dash.stack.label', { defaultValue: 'Stacked bar chart' })} summary={summary || auto}>
      <div className={s.rc} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 200 }}>
          <BarChart data={rows} margin={{ top: 14, right: 12, bottom: 0, left: 0 }} barCategoryGap="22%" accessibilityLayer>
            <defs>{keys.map((k, i) => <Pattern key={k.key} id={`${uid}-p${i}`} color={k.color} index={i} />)}</defs>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="x" tick={AXIS_TICK} tickFormatter={xFormat} tickLine={false} axisLine={{ stroke: GRID_STROKE }} minTickGap={16} />
            <YAxis tick={AXIS_TICK} tickFormatter={tickFormat} tickLine={false} axisLine={false} width={40} />
            <Tooltip
              cursor={{ fill: 'var(--d-band)' }}
              content={(p) => (
                <TooltipCard
                  {...p}
                  title={defaultXFull}
                  rows={(pl) => {
                    const r = pl[0].payload;
                    return [
                      ...keys.map((k, i) => ({
                        label: k.label,
                        value: fmtY(Number(r[k.key]) || 0),
                        swatch: <Swatch size={12} color={k.color} pattern={<Pattern id={`${uid}-tt${i}`} color={k.color} index={i} />} />,
                      })),
                      { label: t('dash.stack.total', { defaultValue: 'Total' }), value: fmtY(totalOf(r)) },
                    ];
                  }}
                />
              )}
            />
            {keys.map((k, i) => (
              <Bar key={k.key} dataKey={k.key} name={k.label} stackId="a" fill={`url(#${uid}-p${i})`} stroke="var(--d-card)" strokeWidth={1} radius={i === keys.length - 1 ? [5, 5, 0, 0] : 0} isAnimationActive={!prefersReducedMotion()} />
            ))}
            {goal != null && (
              <ReferenceLine y={goal} stroke="var(--d-ink)" strokeDasharray="6 5" strokeWidth={1.8} ifOverflow="extendDomain" />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className={s.legend}>
        {keys.map((k, i) => (
          <li key={k.key}>
            <Swatch color={k.color} pattern={<Pattern id={`${uid}-lg${i}`} color={k.color} index={i} />} />
            {k.label}
          </li>
        ))}
        {goal != null && <li><svg width="26" height="12" aria-hidden="true"><line x1="1" y1="6" x2="25" y2="6" stroke="var(--d-ink)" strokeWidth="2" strokeDasharray="5 4" /></svg>{t('dash.stack.goalLabel', { defaultValue: 'Goal' })} {fmtY(goal)}</li>}
      </ul>
    </ChartFrame>
  );
}
