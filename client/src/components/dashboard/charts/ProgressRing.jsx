import { useTranslation } from 'react-i18next';
import { FaCheck } from 'react-icons/fa';
import { fmtDuration, fmtNumber, fmtPercent } from '../format';
import s from './charts.module.css';

/**
 * Progress towards a goal (weekly minutes, test completion).
 *
 *   <ProgressRing value={95} goal={150} unit="min" label="Weekly goal" />
 *
 * Props: value, goal, unit ('min' | '%' | other word | undefined), label (below the ring),
 *        size (px, default 132), thickness (px, default 13), color (any CSS colour),
 *        centerText (override the centre text).
 * Reaching the goal fills the ring and shows a check mark, so "done" is not colour-only.
 */
export default function ProgressRing({ value, goal, unit = 'min', label, size = 132, thickness = 13, color = 'var(--d-accent)', centerText, className = '' }) {
  const { t } = useTranslation();
  const ok = Number.isFinite(value) && Number.isFinite(goal) && goal > 0;
  const frac = ok ? Math.min(1, Math.max(0, value / goal)) : 0;
  const done = ok && value >= goal;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const fmt = (v) => (unit === 'min' ? fmtDuration(v) : unit === '%' ? fmtPercent(v / 100) : `${fmtNumber(v)}${unit ? ` ${unit}` : ''}`);
  const spoken = ok
    ? t('dash.ring.spoken', { defaultValue: '{{label}}: {{value}} of {{goal}}, {{pct}}', label: label || '', value: fmt(value), goal: fmt(goal), pct: fmtPercent(frac) })
    : `${label || ''}: —`;

  return (
    <figure className={`${s.ring} ${className}`} style={{ width: size }}>
      <div className={s.ringBox} style={{ width: size, height: size }} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={ok ? goal : 100} aria-valuenow={ok ? Math.min(value, goal) : undefined} aria-valuetext={spoken}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--d-h0)" strokeWidth={thickness} />
          {frac > 0 && (
            <circle
              className={s.ringArc}
              cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round"
              strokeDasharray={`${c * frac} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}
        </svg>
        <div className={s.ringCenter}>
          <strong>{centerText ?? (ok ? fmtPercent(frac) : '—')}</strong>
          {done && <span className={s.ringDone}><FaCheck aria-hidden="true" /> {t('dash.ring.done', { defaultValue: 'Goal reached' })}</span>}
        </div>
      </div>
      <figcaption className={s.ringCaption}>
        {label && <span className={s.ringLabel}>{label}</span>}
        {ok && <span className={s.ringSub}>{fmt(value)} / {fmt(goal)}</span>}
      </figcaption>
    </figure>
  );
}
