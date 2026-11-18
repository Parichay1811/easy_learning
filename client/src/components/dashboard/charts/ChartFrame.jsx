import { useId } from 'react';
import s from './charts.module.css';

/** Floating tooltip used by the custom (non-Recharts) charts. See useChartTip. */
export function ChartTip({ tip }) {
  if (!tip) return null;
  const x = Math.min(Math.max(tip.x, 90), Math.max(90, tip.width - 90));
  return (
    <div className={s.tip} style={{ left: x, top: tip.y }} aria-hidden="true">
      {tip.content}
    </div>
  );
}

/**
 * Wraps a chart with a label and a plain-text summary for screen readers
 * (read through aria-describedby). `frameRef`/`tip` come from useChartTip.
 */
export default function ChartFrame({ label, summary, frameRef, tip, className = '', children }) {
  const id = useId();
  return (
    <div ref={frameRef} className={`${s.frame} ${className}`} role="group" aria-label={label} aria-describedby={summary ? id : undefined}>
      {children}
      {summary && <p id={id} className="d-sr-only">{summary}</p>}
      <ChartTip tip={tip} />
    </div>
  );
}

/** Line / bar / dot legend swatch that does not rely on colour alone. */
export function Swatch({ color, kind = 'box', dashed, pattern, size = 14 }) {
  if (kind === 'line') {
    return (
      <svg width="26" height="12" aria-hidden="true" focusable="false">
        <line x1="1" y1="6" x2="25" y2="6" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={dashed ? '5 4' : undefined} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} aria-hidden="true" focusable="false">
      {pattern}
      <rect width={size} height={size} rx="3" fill={color} />
      {pattern && <rect width={size} height={size} rx="3" fill={`url(#${pattern.props.id})`} />}
    </svg>
  );
}
