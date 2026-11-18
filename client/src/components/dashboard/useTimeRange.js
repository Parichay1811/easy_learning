// Time range state that lives in the URL (DSN-003), so a link shares the view.
//
//   ?range=week&from=2026-11-09&cmp=prev            (day | week | month | year)
//   ?range=custom&from=2026-10-01&to=2026-10-31&cmp=yoy
//   ?range=term&term=t2                              (academic term)
//
// Needs to be rendered inside a react-router <Router>.
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  addDays, addMonths, daysBetween, endOfMonth, endOfYear, isISODate, parseISO,
  startOfMonth, startOfWeek, startOfYear, today, toISO,
} from './dates';

export const RANGES = ['day', 'week', 'month', 'year', 'custom'];
export const COMPARES = ['none', 'prev', 'yoy'];

/** Resolve a range key + anchor date into inclusive [from, to] Dates. */
export function resolveRange(range, anchor, custom) {
  switch (range) {
    case 'day':
      return [anchor, anchor];
    case 'week': {
      const s = startOfWeek(anchor);
      return [s, addDays(s, 6)];
    }
    case 'month':
      return [startOfMonth(anchor), endOfMonth(anchor)];
    case 'year':
      return [startOfYear(anchor), endOfYear(anchor)];
    default:
      return custom;
  }
}

/** The comparison window for a resolved range. */
export function resolveCompare(range, cmp, from, to) {
  if (cmp === 'none') return [null, null];
  if (cmp === 'yoy') return [addMonths(from, -12), addMonths(to, -12)];
  if (range === 'day') return [addDays(from, -1), addDays(to, -1)];
  if (range === 'week') return [addDays(from, -7), addDays(to, -7)];
  if (range === 'month') return [startOfMonth(addMonths(from, -1)), endOfMonth(addMonths(from, -1))];
  if (range === 'year') return [addMonths(from, -12), addMonths(to, -12)];
  const len = daysBetween(from, to) + 1; // custom/term: same length, ending the day before
  return [addDays(from, -len), addDays(from, -1)];
}

/**
 * const tr = useTimeRange({ defaultRange: 'week', terms });
 *
 * terms: [{ key: 't1', label: 'Term 1', from: '2026-09-01', to: '2026-12-18' }]
 *
 * Returns { range, from, to, cmp, prevFrom, prevTo, isCurrent, days,
 *           setRange(range), setCustom(from, to), setTerm(key), setCmp(cmp),
 *           shift(-1 | +1), reset(), term, terms }
 * from/to/prevFrom/prevTo are ISO local dates (YYYY-MM-DD); prev* are null when cmp === 'none'.
 */
export function useTimeRange({ defaultRange = 'week', defaultCmp = 'prev', terms = [] } = {}) {
  const [params, setParams] = useSearchParams();

  const rawRange = params.get('range');
  const termKey = params.get('term');
  const term = terms.find((x) => x.key === termKey) || null;
  const range = rawRange === 'term' && term ? 'term' : RANGES.includes(rawRange) ? rawRange : defaultRange;
  const rawCmp = params.get('cmp');
  const cmp = COMPARES.includes(rawCmp) ? rawCmp : defaultCmp;
  const rawFrom = params.get('from');
  const rawTo = params.get('to');

  const resolved = useMemo(() => {
    const now = today();
    const anchor = isISODate(rawFrom) ? parseISO(rawFrom) : now;
    let from;
    let to;
    if (range === 'term') {
      from = parseISO(term.from);
      to = parseISO(term.to);
    } else if (range === 'custom') {
      from = isISODate(rawFrom) ? parseISO(rawFrom) : addDays(now, -29);
      to = isISODate(rawTo) ? parseISO(rawTo) : now;
      if (to < from) [from, to] = [to, from];
    } else {
      [from, to] = resolveRange(range, anchor);
    }
    const [pf, pt] = resolveCompare(range, cmp, from, to);
    const isCurrent = range === 'custom' || range === 'term' ? false : now >= from && now <= to;
    return {
      from: toISO(from), to: toISO(to),
      prevFrom: pf ? toISO(pf) : null, prevTo: pt ? toISO(pt) : null,
      days: daysBetween(from, to) + 1, isCurrent,
    };
  }, [range, cmp, rawFrom, rawTo, term]);

  const update = useCallback(
    (patch) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([k, v]) => (v == null ? next.delete(k) : next.set(k, v)));
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setRange = useCallback((r) => update({ range: r, from: null, to: null, term: null }), [update]);
  const setCustom = useCallback((f, t) => update({ range: 'custom', from: f, to: t, term: null }), [update]);
  const setTerm = useCallback((key) => update({ range: 'term', term: key, from: null, to: null }), [update]);
  const setCmp = useCallback((c) => update({ cmp: c }), [update]);
  const reset = useCallback(() => update({ range: null, from: null, to: null, term: null, cmp: null }), [update]);

  const shift = useCallback(
    (dir) => {
      if (range === 'term' || range === 'custom') {
        // Slide a custom window by its own length.
        const len = resolved.days;
        const f = addDays(parseISO(resolved.from), dir * len);
        const t = addDays(parseISO(resolved.to), dir * len);
        update({ range: 'custom', from: toISO(f), to: toISO(t), term: null });
        return;
      }
      const f = parseISO(resolved.from);
      const next =
        range === 'day' ? addDays(f, dir) : range === 'week' ? addDays(f, 7 * dir)
          : range === 'month' ? addMonths(f, dir) : addMonths(f, 12 * dir);
      update({ from: toISO(next) });
    },
    [range, resolved, update],
  );

  return { range, cmp, ...resolved, term, terms, setRange, setCustom, setTerm, setCmp, shift, reset };
}
