import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChartFrame from './ChartFrame';
import { HeatLegend } from './Heat';
import { addDays, parseISO, startOfMonth, startOfWeek, toISO, today, endOfMonth } from '../dates';
import { fmtDate, fmtDuration, fmtNumber, monthNames, weekdayNames } from '../format';
import { heatLevel, useChartTip } from '../utils';
import { monthBlocks, placeBlocks, moveDay } from './monthBlocks';
import s from './charts.module.css';

// Year mode: the narrowest a day may get, the space between two days, and the
// extra space between two months (a narrow empty column, with the usual space
// on each side of it).
const CELL_MIN = 11;
const GAP = 3;
const MONTH_GAP = 5;

/**
 * Year-at-a-glance (a block per month with a gap between months, like
 * LeetCode's calendar) or a single month. Colour = value, and every cell has a
 * tooltip, a spoken label and a readout line below.
 *
 *   <CalendarHeatmap data={[{ date: '2026-11-17', value: 42 }, …]} to="2026-11-18"
 *                    goal={20} onSelect={(iso) => openDay(iso)} />
 *
 * Props: data [{date: 'YYYY-MM-DD', value}], mode 'year' | 'month' (default 'year'),
 *        to (ISO, last day shown, default today; in month mode: any day of the month),
 *        unit ('min' formats as 2 h 10 min, anything else is appended), goal (value
 *        that earns a ring), onSelect(isoDate), summary (override screen-reader text).
 *
 * A week that straddles two months is split: each month's block shows only its
 * own days (monthBlocks.js, shared with the learner's own calendar). One day is
 * in the tab order; the arrow keys move by date (a week left or right, a day up
 * or down), Home and End go to the first and the last day.
 */
export default function CalendarHeatmap({ data = [], mode = 'year', to, unit = 'min', goal, onSelect, summary, label }) {
  const { t } = useTranslation();
  const { ref, tip, bind } = useChartTip();
  const [sel, setSel] = useState(null);
  const scroller = useRef(null);
  const grid = useRef(null);
  const end = useMemo(() => parseISO(to) || today(), [to]);
  const fmtV = (v) => (unit === 'min' ? fmtDuration(v) : `${fmtNumber(v)} ${unit}`);

  const { first, last, placed, byDate, max } = useMemo(() => {
    const map = new Map();
    let mx = 0;
    data.slice(0, 2000).forEach((d) => {
      map.set(d.date, (map.get(d.date) || 0) + (d.value || 0));
      mx = Math.max(mx, map.get(d.date));
    });
    // Month: that month. Year: the 53 weeks that end with `to`.
    const st = mode === 'month' ? startOfMonth(end) : addDays(startOfWeek(end), -52 * 7);
    const en = mode === 'month' ? endOfMonth(end) : end;
    const a = toISO(st);
    const b = toISO(en);
    // The first grid column holds the weekday names.
    return { first: a, last: b, placed: placeBlocks(monthBlocks(a, b), { first: 2 }), byDate: map, max: mx };
  }, [data, mode, end]);

  const mNames = monthNames();
  const wNames = weekdayNames();

  useEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth; // newest weeks visible on phones
  }, [placed, mode]);

  // One day is in the tab order (the one last focused, else the last day).
  const [focusDay, setFocusDay] = useState(null);
  const tabDay = focusDay && focusDay >= first && focusDay <= last ? focusDay : last;
  const onKeyDown = (e) => {
    const at = e.target?.dataset?.day;
    const next = at ? moveDay(at, e.key, first, last) : null;
    if (!next) return;
    e.preventDefault();
    setFocusDay(next);
    grid.current?.querySelector(`[data-day="${next}"]`)?.focus();
  };

  const cells = [];
  let activeDays = 0;
  let total = 0;
  let best = null;
  placed.blocks.forEach((block) => block.weeks.forEach((week, wi) => week.forEach((iso, r) => {
    if (!iso) return;
    const v = byDate.get(iso) ?? 0;
    if (v > 0) activeDays += 1;
    total += v;
    if (!best || v > best.v) best = { v, iso };
    const text = `${fmtDate(iso, { style: 'weekday' })}: ${v > 0 ? fmtV(v) : t('dash.cal.none', { defaultValue: 'no learning' })}`;
    cells.push(
      <button
        key={iso}
        type="button"
        className={`${s.cell} ${s[`h${heatLevel(v, max)}`]} ${goal && v >= goal ? s.goal : ''} ${sel === iso ? s.cellSel : ''} ${mode === 'month' ? s.cellBig : ''}`}
        style={{ gridColumn: block.start + wi, gridRow: r + 2 }}
        aria-label={`${fmtDate(iso, { style: 'long' })}: ${v > 0 ? fmtV(v) : t('dash.cal.none', { defaultValue: 'no learning' })}${goal && v >= goal ? `, ${t('dash.heat.goal', { defaultValue: 'goal reached' })}` : ''}`}
        data-day={iso}
        tabIndex={iso === tabDay ? 0 : -1}
        onFocus={() => setFocusDay(iso)}
        {...bind(text)}
        onClick={() => { setSel(iso); onSelect?.(iso); }}
      >
        {mode === 'month' ? Number(iso.slice(8, 10)) : null}
      </button>,
    );
  })));

  const days = mode === 'month' ? endOfMonth(end).getDate() : 365;
  const auto = best && best.v > 0
    ? t('dash.cal.summary', {
        defaultValue: 'Learning on {{active}} of {{days}} days, {{total}} in total. Busiest day: {{day}} with {{best}}.',
        active: activeDays, days, total: fmtV(total), day: fmtDate(best.iso, { style: 'long' }), best: fmtV(best.v),
      })
    : t('dash.cal.summaryNone', { defaultValue: 'No learning recorded in this period.' });
  const readout = sel
    ? `${fmtDate(sel, { style: 'long' })}: ${byDate.get(sel) ? fmtV(byDate.get(sel)) : t('dash.cal.none', { defaultValue: 'no learning' })}`
    : t('dash.cal.hint', { defaultValue: 'Tap or focus a day to see its total.' });

  const year = mode === 'year';
  const weeks = placed.template.filter((c) => !c.gap).length;
  const gaps = placed.template.length - weeks;
  const columns = placed.template.map((c) => (c.gap ? `${MONTH_GAP}px` : `minmax(${year ? CELL_MIN : 40}px, 1fr)`)).join(' ');

  return (
    <ChartFrame
      frameRef={ref} tip={tip}
      label={label || t('dash.cal.label', { defaultValue: 'Calendar heatmap of learning time' })}
      summary={summary || auto}
    >
      <div className={s.calScroll} ref={scroller}>
        <div
          ref={grid}
          className={`${s.cal} ${year ? '' : s.calMonth}`}
          style={{
            gridTemplateColumns: `auto ${columns}`,
            // Wide enough for every week and every month gap: on a phone the calendar scrolls sideways.
            ...(year ? { minWidth: `${Math.max(700, 36 + weeks * CELL_MIN + gaps * MONTH_GAP + placed.template.length * GAP)}px` } : {}),
          }}
          onKeyDown={onKeyDown}
        >
          {year && placed.blocks.map((b) => (
            // A month with one or two weeks in view (the ends of the year) has no room for its name.
            b.span >= 3 && (
              <span key={b.key} className={s.calMonthLabel} style={{ gridColumn: `${b.start} / span ${b.span}`, gridRow: 1, justifySelf: 'center' }}>{mNames[b.month]}</span>
            )
          ))}
          {[0, 2, 4].concat(year ? [] : [1, 3, 5, 6]).map((r) => (
            <span key={r} className={s.calWeekday} style={{ gridColumn: 1, gridRow: r + 2 }}>{wNames[r]}</span>
          ))}
          {cells}
        </div>
      </div>
      <div className={s.heatFoot}>
        <p className={s.readout} aria-live="polite">{readout}</p>
        <HeatLegend max={max} unit={unit} goal={goal} />
      </div>
    </ChartFrame>
  );
}
