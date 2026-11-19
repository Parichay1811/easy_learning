import { useCallback, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCalendarAlt, FaChevronDown, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { fmtDate } from './format';
import { parseISO, today, toISO } from './dates';
import Sheet from './Sheet';
import Button from './Button';
import s from './timerange.module.css';

// Where the full bar would wrap onto several rows or eat a short screen.
const COMPACT_QUERY = '(max-width: 1100px), (max-height: 820px)';
function useCompact(mode) {
  const subscribe = useCallback((cb) => {
    if (mode !== 'auto') return () => {};
    const mq = window.matchMedia(COMPACT_QUERY);
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
  }, [mode]);
  const auto = useSyncExternalStore(subscribe, () => (mode === 'auto' ? window.matchMedia(COMPACT_QUERY).matches : false), () => false);
  return mode === 'auto' ? auto : !!mode;
}

const LABELS = { day: 'Day', week: 'Week', month: 'Month', year: 'Year', custom: 'Custom' };
const PREV_WORD = { day: 'day', week: 'week', month: 'month', year: 'year', custom: 'period', term: 'term' };

/**
 * Same time controls on every page (DSN-003). Pair it with useTimeRange:
 *
 *   const tr = useTimeRange({ terms });
 *   <TimeRangeBar value={tr} />
 *   // fetch(`/api/…?from=${tr.from}&to=${tr.to}&cmpFrom=${tr.prevFrom}&cmpTo=${tr.prevTo}`)
 *
 * Props:
 *   value        the object returned by useTimeRange (required)
 *   ranges       which presets to offer, default ['day','week','month','year','custom']
 *   showCompare  show the "compare with" menu (default true)
 *   sticky       stick to the top of the scrolling page (default false)
 *   compact      true | 'auto': one short row (‹ period ›) whose middle opens the full
 *                controls in a sheet; 'auto' does that on phones, tablets and short screens
 */
export default function TimeRangeBar({ compact = false, ...props }) {
  const small = useCompact(compact);
  return small ? <RangePill {...props} /> : <FullBar {...props} />;
}

function RangePill({ value: tr, ranges = ['day', 'week', 'month', 'year', 'custom'], showCompare = true, className = '' }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const period = fmtDate({ from: tr.from, to: tr.to }, { style: tr.range === 'month' ? 'month' : 'short' });
  const canNext = tr.range === 'custom' || tr.range === 'term' ? true : parseISO(tr.to) < today();
  const word = t(`dash.range.${tr.range}`, { defaultValue: LABELS[tr.range] || tr.range });
  return (
    <div className={`${s.pillRow} ${className}`} role="group" aria-label={t('dash.range.aria', { defaultValue: 'Time range' })} data-print="hide">
      <button type="button" className={s.navBtn} onClick={() => tr.shift(-1)} aria-label={t('dash.range.back', { defaultValue: 'Earlier period' })}>
        <FaChevronLeft aria-hidden="true" />
      </button>
      <button type="button" className={s.pill} aria-haspopup="dialog" onClick={() => setOpen(true)}
        aria-label={t('dash.range.change', { defaultValue: 'Time range: {{period}}. Change it', period })}>
        <FaCalendarAlt aria-hidden="true" />
        <span className={s.pillText} aria-live="polite">{period}</span>
        <span className={s.pillWord}>{word}</span>
        <FaChevronDown aria-hidden="true" />
      </button>
      <button type="button" className={s.navBtn} onClick={() => tr.shift(1)} disabled={!canNext} aria-label={t('dash.range.forward', { defaultValue: 'Later period' })}>
        <FaChevronRight aria-hidden="true" />
      </button>
      {open && (
        <Sheet size="sm" title={t('dash.range.title', { defaultValue: 'Time range' })}
          text={t('dash.range.sheetText', { defaultValue: 'Which days to show, and what to compare them with.' })}
          onClose={() => setOpen(false)} footer={<Button onClick={() => setOpen(false)}>{t('dash.range.done', { defaultValue: 'Done' })}</Button>}>
          <FullBar value={tr} ranges={ranges} showCompare={showCompare} className={s.inSheet} />
        </Sheet>
      )}
    </div>
  );
}

function FullBar({ value: tr, ranges = ['day', 'week', 'month', 'year', 'custom'], showCompare = true, sticky = false, className = '' }) {
  const { t } = useTranslation();
  const rangeLabel = (r) => t(`dash.range.${r}`, { defaultValue: LABELS[r] });
  const period = fmtDate({ from: tr.from, to: tr.to }, { style: tr.range === 'month' ? 'month' : 'short' });
  const canNext = tr.range === 'custom' || tr.range === 'term' ? true : parseISO(tr.to) < today();
  const word = t(`dash.range.word.${PREV_WORD[tr.range]}`, { defaultValue: PREV_WORD[tr.range] });

  return (
    <div className={`${s.bar} ${sticky ? s.sticky : ''} ${className}`} role="group" aria-label={t('dash.range.aria', { defaultValue: 'Time range' })} data-print="hide">
      <div className={s.seg} role="group" aria-label={t('dash.range.preset', { defaultValue: 'Range' })}>
        {ranges.map((r) => (
          <button key={r} type="button" className={s.segBtn} aria-pressed={tr.range === r} onClick={() => tr.setRange(r)}>
            {rangeLabel(r)}
          </button>
        ))}
      </div>

      {tr.terms.length > 0 && (
        <label className={s.field}>
          <span className="d-sr-only">{t('dash.range.term', { defaultValue: 'Academic term' })}</span>
          <select className={s.select} value={tr.term?.key || ''} onChange={(e) => e.target.value && tr.setTerm(e.target.value)}>
            <option value="">{t('dash.range.termPlaceholder', { defaultValue: 'Term…' })}</option>
            {tr.terms.map((x) => (
              <option key={x.key} value={x.key}>{x.label}</option>
            ))}
          </select>
        </label>
      )}

      <div className={s.nav}>
        <button type="button" className={s.navBtn} onClick={() => tr.shift(-1)} aria-label={t('dash.range.back', { defaultValue: 'Earlier period' })}>
          <FaChevronLeft aria-hidden="true" />
        </button>
        <span className={s.period} aria-live="polite">{period}</span>
        <button type="button" className={s.navBtn} onClick={() => tr.shift(1)} disabled={!canNext} aria-label={t('dash.range.forward', { defaultValue: 'Later period' })}>
          <FaChevronRight aria-hidden="true" />
        </button>
      </div>

      {tr.range === 'custom' && (
        <div className={s.custom}>
          <label className={s.field}>
            <span className={s.fieldLabel}>{t('dash.range.from', { defaultValue: 'From' })}</span>
            <input type="date" className={s.select} value={tr.from} max={tr.to} onChange={(e) => e.target.value && tr.setCustom(e.target.value, tr.to)} />
          </label>
          <label className={s.field}>
            <span className={s.fieldLabel}>{t('dash.range.to', { defaultValue: 'To' })}</span>
            <input type="date" className={s.select} value={tr.to} min={tr.from} max={toISO(today())} onChange={(e) => e.target.value && tr.setCustom(tr.from, e.target.value)} />
          </label>
        </div>
      )}

      {showCompare && (
        <label className={`${s.field} ${s.compare}`}>
          <span className="d-sr-only">{t('dash.range.compare', { defaultValue: 'Compare with' })}</span>
          <select className={s.select} value={tr.cmp} onChange={(e) => tr.setCmp(e.target.value)}>
            <option value="none">{t('dash.range.cmpNone', { defaultValue: 'No comparison' })}</option>
            <option value="prev">{t('dash.range.cmpPrev', { defaultValue: 'vs previous {{word}}', word })}</option>
            <option value="yoy">{t('dash.range.cmpYoy', { defaultValue: 'vs same time last year' })}</option>
          </select>
        </label>
      )}
    </div>
  );
}
