import { useId } from 'react';
import { MAX_POINTS } from './constants';
import { capPoints } from './utils';

const TONE = {
  neutral: 'var(--d-accent-ink)',
  good: 'var(--d-good)',
  attention: 'var(--d-attention)',
  alert: 'var(--d-alert)',
};

/**
 * Tiny trend line with no axes. `data` is numbers or [{ y }] / [{ value }].
 * It is decorative (aria-hidden) unless you pass `label`.
 *
 *   <Sparkline data={[3, 5, 4, 8, 9]} tone="good" label="Minutes per day, last 5 days" />
 */
export default function Sparkline({ data, width = 96, height = 32, tone = 'neutral', label, className }) {
  const gid = useId();
  const raw = (data || []).map((d) => (typeof d === 'number' ? d : (d?.y ?? d?.value))).filter((v) => Number.isFinite(v));
  const ys = capPoints(raw, MAX_POINTS);
  if (ys.length < 2) return null;
  const pad = 3;
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const span = max - min || 1;
  const pts = ys.map((y, i) => [
    pad + (i / (ys.length - 1)) * (width - pad * 2),
    height - pad - ((y - min) / span) * (height - pad * 2),
  ]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`;
  const color = TONE[tone] || TONE.neutral;
  const last = pts[pts.length - 1];
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
      focusable="false"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  );
}
