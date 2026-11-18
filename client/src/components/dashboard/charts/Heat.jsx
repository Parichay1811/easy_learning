import { useTranslation } from 'react-i18next';
import { MASTERY, masteryLabel, masteryOf } from '../constants';
import { fmtDuration, fmtNumber } from '../format';
import s from './charts.module.css';

/** Pie-style glyph: the amount filled is the mastery level, so it reads without colour. */
export function MasteryGlyph({ level, size = 14 }) {
  const lv = masteryOf(level).level;
  const common = { fill: 'currentColor', stroke: 'currentColor', strokeWidth: 1.6 };
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={s.glyph}>
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray={lv === 0 ? '2.4 2.2' : undefined} />
      {lv === 1 && <path d="M8 8 L8 2 A6 6 0 0 1 14 8 Z" {...common} />}
      {lv === 2 && <path d="M8 8 L8 2 A6 6 0 0 1 8 14 Z" {...common} />}
      {lv === 3 && <circle cx="8" cy="8" r="6" {...common} />}
    </svg>
  );
}

/** "Less [] [] [] [] [] More" legend for the activity heat ramp. */
export function HeatLegend({ max, unit = 'min', goal }) {
  const { t } = useTranslation();
  const fmt = (v) => (unit === 'min' ? fmtDuration(v) : `${fmtNumber(v)} ${unit}`);
  return (
    <div className={s.heatLegend} aria-hidden="true">
      <span>{t('dash.heat.less', { defaultValue: 'Less' })}</span>
      {[0, 1, 2, 3, 4].map((l) => (
        <span key={l} className={`${s.swatch} ${s[`h${l}`]}`} title={l === 0 ? fmt(0) : `≤ ${fmt(Math.round((max * l) / 4))}`} />
      ))}
      <span>{t('dash.heat.more', { defaultValue: 'More' })}</span>
      {goal != null && (
        <span className={s.goalKey}>
          <span className={`${s.cell} ${s.h3} ${s.goal}`} />
          {t('dash.heat.goal', { defaultValue: 'goal reached' })}
        </span>
      )}
      {max > 0 && <span className={s.legendMax}>({t('dash.heat.top', { defaultValue: 'top: {{v}}', v: fmt(max) })})</span>}
    </div>
  );
}

/** The four mastery levels, each with its glyph and word. */
export function MasteryLegend({ className = '' }) {
  const { t } = useTranslation();
  return (
    <ul className={`${s.masteryLegend} ${className}`} aria-label={t('dash.mastery.legend', { defaultValue: 'Mastery levels' })}>
      {MASTERY.map((m) => (
        <li key={m.key} className={s.masteryLegendItem} style={{ background: m.bg, color: m.ink }}>
          <MasteryGlyph level={m.level} />
          {masteryLabel(t, m.key)}
        </li>
      ))}
    </ul>
  );
}
