import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ChartFrame from './ChartFrame';
import { fmtNumber, fmtPercent } from '../format';
import { median, quantile, useChartTip, useElementWidth } from '../utils';
import s from './charts.module.css';

const PAD = 14;

/**
 * "How is the whole class spread?" Each student is a dot on a shared axis, the
 * middle half of the class is shaded, the median is a labelled line. Hover or
 * focus a dot to see the name. The highlighted student is a square, not just a
 * different colour.
 *
 *   <DistributionStrip data={[{ id: 's1', name: 'Ravi', value: 0.64 }, …]} domain={[0, 1]}
 *                      highlightId="s7" onSelect={(item) => …} />
 *
 * Props: data [{id, name, value}], domain [min, max] (default [0, 1]), format(v) (default percent
 *        for 0..1 domains), highlightId, onSelect(item), summary, label.
 * More than 40 dots are still hoverable but only the first 40 are keyboard stops; the
 * "view as table" toggle of the ChartCard has every student.
 */
export default function DistributionStrip({ data = [], domain = [0, 1], format, highlightId, onSelect, summary, label }) {
  const { t } = useTranslation();
  const { ref: tipRef, tip, bind } = useChartTip();
  const [wrapRef, width] = useElementWidth();
  const fmt = format || (domain[1] <= 1 ? fmtPercent : fmtNumber);
  const items = useMemo(() => data.filter((d) => Number.isFinite(d.value)).slice(0, 2000), [data]);
  const w = Math.max(width, 240);
  const r = items.length > 300 ? 3 : items.length > 80 ? 5 : 8;
  const x = (v) => PAD + ((Math.min(domain[1], Math.max(domain[0], v)) - domain[0]) / (domain[1] - domain[0] || 1)) * (w - PAD * 2);

  const { dots, layers, med, q1, q3 } = useMemo(() => {
    const sorted = [...items].sort((a, b) => a.value - b.value);
    const placed = [];
    let maxLayer = 0;
    const d = r * 2 + 1.5;
    sorted.forEach((it) => {
      const px = x(it.value);
      let layer = 0;
      for (;;) {
        const off = layer === 0 ? 0 : (layer % 2 ? 1 : -1) * Math.ceil(layer / 2);
        const clash = placed.some((p) => p.off === off && Math.abs(p.px - px) < d);
        if (!clash) { placed.push({ it, px, off }); maxLayer = Math.max(maxLayer, Math.abs(off)); break; }
        layer += 1;
        if (layer > 400) { placed.push({ it, px, off: 0 }); break; }
      }
    });
    const vals = items.map((i) => i.value);
    return { dots: placed, layers: maxLayer, med: median(vals), q1: quantile(vals, 0.25), q3: quantile(vals, 0.75) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, w, r, domain[0], domain[1]]);

  const half = Math.min(layers, 7);
  const step = layers > half ? (half * (r * 2 + 1.5)) / layers : r * 2 + 1.5;
  const mid = 12 + half * (r * 2 + 1.5) + r + 8;
  const height = mid * 2 + 26;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => domain[0] + f * (domain[1] - domain[0]));
  const lowest = items.length ? items.reduce((a, b) => (b.value < a.value ? b : a)) : null;

  const auto = items.length
    ? t('dash.dist.summary', {
        defaultValue: '{{n}} students. Median {{med}}. Middle half between {{q1}} and {{q3}}. Lowest {{lo}} ({{name}}).',
        n: items.length, med: fmt(med), q1: fmt(q1), q3: fmt(q3), lo: fmt(lowest.value), name: lowest.name,
      })
    : t('dash.dist.none', { defaultValue: 'No students to show.' });

  return (
    <ChartFrame frameRef={tipRef} tip={tip} label={label || t('dash.dist.label', { defaultValue: 'Distribution of the class' })} summary={summary || auto}>
      <div ref={wrapRef} className={s.dist}>
        <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} role="presentation">
          {items.length > 0 && <rect x={x(q1)} y={mid - half * 7 - r - 8} width={Math.max(2, x(q3) - x(q1))} height={(half * 7 + r + 8) * 2} rx="10" fill="var(--d-band)" />}
          <line x1={PAD} x2={w - PAD} y1={mid} y2={mid} stroke="var(--d-grid)" strokeWidth="2" />
          {ticks.map((tv) => (
            <g key={tv}>
              <line x1={x(tv)} x2={x(tv)} y1={height - 24} y2={height - 18} stroke="var(--d-control)" />
              <text x={x(tv)} y={height - 4} textAnchor="middle" fontSize="12" fill="var(--d-tick)">{fmt(tv)}</text>
            </g>
          ))}
          {dots.map(({ it, px, off }, i) => {
            const cy = mid + off * (layers > half ? step : r * 2 + 1.5);
            const hl = it.id === highlightId;
            const common = {
              ...bind(`${it.name}: ${fmt(it.value)}`),
              'aria-label': `${it.name}: ${fmt(it.value)}`,
              role: onSelect ? 'button' : 'img',
              tabIndex: i < 40 ? 0 : undefined,
              className: s.dot,
              onClick: onSelect ? () => onSelect(it) : undefined,
              onKeyDown: onSelect ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(it)) : undefined,
            };
            return hl
              ? <rect key={it.id} x={px - r - 2} y={cy - r - 2} width={(r + 2) * 2} height={(r + 2) * 2} rx="3" fill="var(--d-ink)" stroke="var(--d-card)" strokeWidth="2" {...common} />
              : <circle key={it.id} cx={px} cy={cy} r={r} fill="var(--d-accent)" stroke="var(--d-card)" strokeWidth="1.5" {...common} />;
          })}
          {med != null && (
            <g pointerEvents="none">
              <line x1={x(med)} x2={x(med)} y1={6} y2={height - 26} stroke="var(--d-ink)" strokeWidth="2.2" strokeDasharray="5 3" />
              <text x={x(med)} y={13} textAnchor={x(med) > w - 90 ? 'end' : 'start'} dx={x(med) > w - 90 ? -6 : 6} fontSize="12" fontWeight="600" fill="var(--d-ink)">
                {t('dash.dist.median', { defaultValue: 'Median {{v}}', v: fmt(med) })}
              </text>
            </g>
          )}
        </svg>
      </div>
    </ChartFrame>
  );
}
