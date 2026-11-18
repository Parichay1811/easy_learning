import { fmtDate, fmtDuration, fmtNumber } from '../format';
import { isISODate } from '../dates';

export const AXIS_TICK = { fill: 'var(--d-tick)', fontSize: 12 };
export const GRID_STROKE = 'var(--d-grid)';

/** Format an x value: ISO dates become "18 Nov", anything else is shown as given. */
export const defaultXFormat = (x) => (isISODate(x) ? fmtDate(x, { style: 'day' }) : String(x ?? ''));

export const defaultXFull = (x) => (isISODate(x) ? fmtDate(x, { style: 'weekday' }) : String(x ?? ''));

/** Format a y value in the given unit ('min' -> "2 h 10 min", else a plain number + unit). */
export function makeValueFormat(unit) {
  return (v) => {
    if (v == null) return '—';
    if (unit === 'min') return fmtDuration(v);
    if (unit === '%') return `${fmtNumber(v)}%`;
    return unit ? `${fmtNumber(v)} ${unit}` : fmtNumber(v);
  };
}

/** Compact axis tick: 90 -> "90", 1200 -> "1.2K". The unit is named in the legend / answer line. */
export const tickFormat = (v) => fmtNumber(v, { compact: true });
