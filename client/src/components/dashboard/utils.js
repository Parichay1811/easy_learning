// Small helpers shared by the charts.
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { MAX_POINTS } from './constants';

/**
 * Down-sample a long series to at most `max` points by averaging buckets.
 * Charts call this so a runaway payload can never draw more than 2000 marks.
 * `pick` reads the number from an item (default: the item itself).
 */
export function capPoints(items, max = MAX_POINTS, pick = (v) => v) {
  if (!Array.isArray(items) || items.length <= max) return items || [];
  const size = items.length / max;
  const out = [];
  for (let i = 0; i < max; i += 1) {
    const slice = items.slice(Math.floor(i * size), Math.floor((i + 1) * size));
    if (!slice.length) continue;
    if (typeof slice[0] === 'number') {
      out.push(slice.reduce((a, b) => a + pick(b), 0) / slice.length);
    } else {
      out.push(slice[Math.floor(slice.length / 2)]); // objects: keep the middle sample
    }
  }
  return out;
}

/** Map a value 0..max onto heat levels 0..4 (0 only for zero/missing). */
export function heatLevel(value, max) {
  if (!Number.isFinite(value) || value <= 0 || !max) return 0;
  return Math.min(4, Math.max(1, Math.ceil((value / max) * 4)));
}

/** Prefer reduced motion? Read once per call. */
export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hover/focus tooltip for chart cells. Put `ref` on the chart wrapper (it must
 * be position: relative), spread `bind(content)` on each cell, render <ChartTip tip={tip}/>.
 */
export function useChartTip() {
  const ref = useRef(null);
  const [tip, setTip] = useState(null);
  const show = useCallback((e, content) => {
    const wrap = ref.current;
    if (!wrap) return;
    const r = e.currentTarget.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    setTip({ x: r.left - w.left + r.width / 2, y: r.top - w.top, content, width: w.width });
  }, []);
  const hide = useCallback(() => setTip(null), []);
  const bind = useCallback(
    (content) => ({
      onMouseEnter: (e) => show(e, content),
      onFocus: (e) => show(e, content),
      onMouseLeave: hide,
      onBlur: hide,
    }),
    [show, hide],
  );
  useEffect(() => {
    if (!tip) return undefined;
    const onKey = (e) => e.key === 'Escape' && setTip(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [tip]);
  return { ref, tip, bind, hide };
}

/**
 * Roving-tabindex arrow-key navigation for a grid of buttons, so a 53 x 7
 * heatmap is ONE tab stop instead of 371. Cells carry data-r / data-c.
 *
 *   const nav = useGridNav(rows, cols);
 *   <div role="grid" {...nav.gridProps}> … <button {...nav.cellProps(r, c)} /> …
 */
export function useGridNav(rows, cols) {
  const gridRef = useRef(null);
  const [pos, setPos] = useState([0, 0]);
  const id = useId();
  const focusCell = useCallback((r, c) => {
    const el = gridRef.current?.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (el) {
      setPos([r, c]);
      el.focus();
    }
  }, []);
  const onKeyDown = useCallback(
    (e) => {
      const [r, c] = pos;
      let nr = r;
      let nc = c;
      if (e.key === 'ArrowRight') nc = Math.min(cols - 1, c + 1);
      else if (e.key === 'ArrowLeft') nc = Math.max(0, c - 1);
      else if (e.key === 'ArrowDown') nr = Math.min(rows - 1, r + 1);
      else if (e.key === 'ArrowUp') nr = Math.max(0, r - 1);
      else if (e.key === 'Home') nc = 0;
      else if (e.key === 'End') nc = cols - 1;
      else return;
      e.preventDefault();
      focusCell(nr, nc);
    },
    [pos, rows, cols, focusCell],
  );
  return {
    id,
    gridProps: { ref: gridRef, onKeyDown },
    cellProps: (r, c) => ({
      'data-r': r,
      'data-c': c,
      tabIndex: pos[0] === r && pos[1] === c ? 0 : -1,
      onFocus: () => setPos([r, c]),
    }),
  };
}

/** Width in px of an element, kept up to date with a ResizeObserver. */
export function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setWidth(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

/**
 * Classify a question from its stats: 'check' (probably broken: strong students
 * miss it as often as weak ones), 'hard', 'easy', 'few' (too few answers) or 'ok'.
 */
export function itemFlag(it) {
  if (it.flag) return it.flag;
  if (it.attempts != null && it.attempts < 5) return 'few';
  if (it.discrimination != null && it.discrimination < 0.1 && it.pctCorrect < 0.5) return 'check';
  if (it.pctCorrect < 0.3) return 'hard';
  if (it.pctCorrect > 0.95) return 'easy';
  return 'ok';
}

/** Median of a number list (null when empty). */
export function median(values) {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

export function quantile(values, q) {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return null;
  const pos = (v.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return v[lo] + (v[hi] - v[lo]) * (pos - lo);
}
