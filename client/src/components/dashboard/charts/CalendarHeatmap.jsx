import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChartFrame from './ChartFrame';
import { HeatLegend } from './Heat';
import { addDays, parseISO, startOfMonth, startOfWeek, toISO, today, endOfMonth } from '../dates';
import { fmtDate, fmtDuration, fmtNumber, monthNames, weekdayNames } from '../format';
import { heatLevel, useChartTip, useGridNav } from '../utils';
import s from './charts.module.css';

/**
 * Year-at-a-glance (53 x 7, GitHub style) or a single month. Colour = value,
 * and every cell has a tooltip, a spoken label and a readout line below.
 *
 *   <CalendarHeatmap data={[{ date: '2026-11-17', value: 42 }, …]} to="2026-11-18"
 *                    goal={20} onSelect={(iso) => openDay(iso)} />
 *
 * Props: data [{date: 'YYYY-MM-DD', value}], mode 'year' | 'month' (default 'year'),
 *        to (ISO, last day shown, default today; in month mode: any day of the month),
 *        unit ('min' formats as 2 h 10 min, anything else is appended), goal (value
 *        that earns a ring), onSelect(isoDate), summary (override screen-reader text).
 */
export default function CalendarHeatmap({ data = [], mode = 'year', to, unit = 'min', goal, onSelect, summary, label }) {
  const { t } = useTranslation();
  const { ref, tip, bind } = useChartTip();
  const [sel, setSel] = useState(null);
  const scroller = useRef(null);
  const end = useMemo(() => parseISO(to) || today(), [to]);
  const fmtV = (v) => (unit === 'min' ? fmtDuration(v) : `${fmtNumber(v)} ${unit}`);

  const { cols, start, lastDay, byDate, max } = useMemo(() => {
    const map = new Map();
    let mx = 0;
    data.slice(0, 2000).forEach((d) => {
      map.set(d.date, (map.get(d.date) || 0) + (d.value || 0));
      mx = Math.max(mx, map.get(d.date));
    });
    let st;
    let last;
    if (mode === 'month') {
      st = startOfWeek(startOfMonth(end));
      last = endOfMonth(end);
    } else {
      last = end;
      st = addDays(startOfWeek(end), -52 * 7);
    }
    const c = Math.floor((last - st) / 86400000 / 7) + 1;
    return { cols: c, start: st, lastDay: last, byDate: map, max: mx };
  }, [data, mode, end]);

  const nav = useGridNav(7, cols);
  const mNames = monthNames();
  const wNames = weekdayNames();

  useEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth; // newest weeks visible on phones
  }, [cols, mode]);

  const cells = [];
  const monthLabels = [];
  let activeDays = 0;
  let total = 0;
  let best = null;
  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < 7; r += 1) {
      const d = addDays(start, c * 7 + r);
      const iso = toISO(d);
      const inRange = d <= lastDay && (mode === 'year' || d.getMonth() === end.getMonth());
      if (!inRange) continue;
      const v = byDate.get(iso) ?? 0;
      if (v > 0) activeDays += 1;
      total += v;
      if (!best || v > best.v) best = { v, iso };
      if (r === 0 && mode === 'year' && (c === 0 || d.getMonth() !== addDays(d, -7).getMonth())) {
        monthLabels.push({ c, text: mNames[d.getMonth()] });
      }
      const text = `${fmtDate(iso, { style: 'weekday' })}: ${v > 0 ? fmtV(v) : t('dash.cal.none', { defaultValue: 'no learning' })}`;
      cells.push(
        <button
          key={iso}
          type="button"
          className={`${s.cell} ${s[`h${heatLevel(v, max)}`]} ${goal && v >= goal ? s.goal : ''} ${sel === iso ? s.cellSel : ''} ${mode === 'month' ? s.cellBig : ''}`}
          style={{ gridColumn: c + 2, gridRow: r + 2 }}
          aria-label={`${fmtDate(iso, { style: 'long' })}: ${v > 0 ? fmtV(v) : t('dash.cal.none', { defaultValue: 'no learning' })}${goal && v >= goal ? `, ${t('dash.heat.goal', { defaultValue: 'goal reached' })}` : ''}`}
          {...nav.cellProps(r, c)}
          {...bind(text)}
          onClick={() => { setSel(iso); onSelect?.(iso); }}
        >
          {mode === 'month' ? d.getDate() : null}
        </button>,
      );
    }
  }

  const days = mode === 'month' ? lastDay.getDate() : 365;
  const auto = best && best.v > 0
    ? t('dash.cal.summary', {
        defaultValue: 'Learning on {{active}} of {{days}} days, {{total}} in total. Busiest day: {{day}} with {{best}}.',
        active: activeDays, days, total: fmtV(total), day: fmtDate(best.iso, { style: 'long' }), best: fmtV(best.v),
      })
    : t('dash.cal.summaryNone', { defaultValue: 'No learning recorded in this period.' });
  const readout = sel
    ? `${fmtDate(sel, { style: 'long' })}: ${byDate.get(sel) ? fmtV(byDate.get(sel)) : t('dash.cal.none', { defaultValue: 'no learning' })}`
    : t('dash.cal.hint', { defaultValue: 'Tap or focus a day to see its total.' });

  return (
    <ChartFrame
      frameRef={ref} tip={tip}
      label={label || t('dash.cal.label', { defaultValue: 'Calendar heatmap of learning time' })}
      summary={summary || auto}
    >
      <div className={s.calScroll} ref={scroller}>
        <div
          className={`${s.cal} ${mode === 'month' ? s.calMonth : ''}`}
          style={{ gridTemplateColumns: `auto repeat(${cols}, minmax(${mode === 'month' ? 40 : 11}px, 1fr))` }}
          {...nav.gridProps}
        >
          {monthLabels.map((m) => (
            <span key={m.c} className={s.calMonthLabel} style={{ gridColumn: `${m.c + 2} / span 4`, gridRow: 1 }}>{m.text}</span>
          ))}
          {[0, 2, 4].concat(mode === 'month' ? [1, 3, 5, 6] : []).map((r) => (
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
