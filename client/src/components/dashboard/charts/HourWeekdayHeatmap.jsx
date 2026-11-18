import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChartFrame from './ChartFrame';
import { HeatLegend } from './Heat';
import { fmtDuration, fmtNumber, weekdayNames } from '../format';
import { heatLevel, useChartTip, useGridNav } from '../utils';
import s from './charts.module.css';

const pad = (h) => `${String(h).padStart(2, '0')}:00`;

/**
 * "When do they learn best?" 24 hours x 7 weekdays (Monday first).
 *
 *   <HourWeekdayHeatmap data={[{ weekday: 1, hour: 17, value: 32 }, …]} onSelect={(weekday, hour) => …} />
 *
 * Props: data [{weekday: 0 (Mon) … 6 (Sun), hour: 0-23, value}], unit ('min' default),
 *        onSelect(weekday, hour), summary (override screen-reader text).
 * value is the average (or total) for that slot: aggregate on the server first.
 */
export default function HourWeekdayHeatmap({ data = [], unit = 'min', onSelect, summary, label }) {
  const { t } = useTranslation();
  const { ref, tip, bind } = useChartTip();
  const nav = useGridNav(7, 24);
  const [sel, setSel] = useState(null);
  const wNames = weekdayNames();
  const wLong = weekdayNames({ style: 'long' });
  const fmtV = (v) => (unit === 'min' ? fmtDuration(v) : `${fmtNumber(v)} ${unit}`);

  const { grid, max, best } = useMemo(() => {
    const g = Array.from({ length: 7 }, () => Array(24).fill(0));
    data.slice(0, 2000).forEach((d) => {
      if (d.weekday >= 0 && d.weekday < 7 && d.hour >= 0 && d.hour < 24) g[d.weekday][d.hour] += d.value || 0;
    });
    let mx = 0;
    let b = null;
    g.forEach((row, w) => row.forEach((v, h) => {
      if (v > mx) { mx = v; b = { w, h, v }; }
    }));
    return { grid: g, max: mx, best: b };
  }, [data]);

  const auto = best
    ? t('dash.hw.summary', {
        defaultValue: 'Most active: {{day}} at {{hour}}, with {{value}}.',
        day: wLong[best.w], hour: pad(best.h), value: fmtV(best.v),
      })
    : t('dash.hw.none', { defaultValue: 'No learning recorded in this period.' });
  const readout = sel
    ? `${wLong[sel.w]} ${pad(sel.h)}: ${grid[sel.w][sel.h] ? fmtV(grid[sel.w][sel.h]) : t('dash.cal.none', { defaultValue: 'no learning' })}`
    : auto;

  return (
    <ChartFrame
      frameRef={ref} tip={tip}
      label={label || t('dash.hw.label', { defaultValue: 'Heatmap of learning time by weekday and hour' })}
      summary={summary || auto}
    >
      <div className={s.hw} {...nav.gridProps}>
        {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
          <span key={h} className={s.hwHour} style={{ gridColumn: `${h + 2} / span 3`, gridRow: 1 }}>{h}</span>
        ))}
        {grid.map((row, w) => (
          <span key={`l${w}`} className={s.hwDay} style={{ gridColumn: 1, gridRow: w + 2 }}>{wNames[w]}</span>
        ))}
        {grid.map((row, w) => row.map((v, h) => (
          <button
            key={`${w}-${h}`}
            type="button"
            className={`${s.cell} ${s.hwCell} ${s[`h${heatLevel(v, max)}`]} ${sel && sel.w === w && sel.h === h ? s.cellSel : ''}`}
            style={{ gridColumn: h + 2, gridRow: w + 2 }}
            aria-label={`${wLong[w]} ${pad(h)}: ${v ? fmtV(v) : t('dash.cal.none', { defaultValue: 'no learning' })}`}
            {...nav.cellProps(w, h)}
            {...bind(`${wNames[w]} ${pad(h)}: ${v ? fmtV(v) : '—'}`)}
            onClick={() => { setSel({ w, h }); onSelect?.(w, h); }}
          />
        )))}
      </div>
      <div className={s.heatFoot}>
        <p className={s.readout} aria-live="polite">{readout}</p>
        <HeatLegend max={max} unit={unit} />
      </div>
    </ChartFrame>
  );
}
