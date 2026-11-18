import { Link } from 'react-router-dom';
import { FaCheckCircle, FaExclamationCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import InfoTip from './InfoTip';
import Sparkline from './Sparkline';
import Skeleton from './Skeleton';
import { fmtDelta, fmtNumber, NO_DATA } from './format';
import s from './cards.module.css';

const TONE_ICON = { good: FaCheckCircle, attention: FaExclamationCircle, alert: FaExclamationTriangle };
const ARROW = { up: '▲', down: '▼', flat: '▬' };

/**
 * Big number + delta + sparkline. Every tile is a door: pass `onClick` or `to`.
 *
 *   <KpiTile label="Learning time" value={fmtDuration(130)}
 *            delta={{ current: 130, previous: 105, mode: 'duration', vs: 'last week' }}
 *            sparkline={[20, 25, 18, 30, 37]} helpText="Minutes with at least one answered question."
 *            tone="good" onClick={openTime} />
 *
 * value: string (already formatted) or number (formatted with fmtNumber) or null ("—").
 * delta: { current, previous, mode?, vs?, lowerIsBetter? }  mode = percent | points | duration | number
 * tone:  'neutral' | 'good' | 'attention' | 'alert'. Shown as an icon plus a word, never colour alone.
 */
export default function KpiTile({
  label, value, unit, delta, sparkline, helpText, tone = 'neutral', onClick, to, loading, className = '',
}) {
  const { t } = useTranslation();
  if (loading) return <Skeleton variant="tile" className={className} />;

  const shown = typeof value === 'number' ? fmtNumber(value) : value == null || value === '' ? NO_DATA : value;
  const d = delta ? fmtDelta(delta.current, delta.previous, delta) : null;
  const ToneIcon = TONE_ICON[tone];
  const toneWord = {
    good: t('dash.tone.good', { defaultValue: 'On track' }),
    attention: t('dash.tone.attention', { defaultValue: 'Needs a look' }),
    alert: t('dash.tone.alert', { defaultValue: 'Needs attention' }),
  }[tone];

  const body = (
    <>
      <span className={s.kpiLabel}>{label}</span>
      <span className={s.kpiValueRow}>
        <span className={s.kpiValue}>{shown}</span>
        {unit && shown !== NO_DATA && <span className={s.kpiUnit}>{unit}</span>}
      </span>
      <span className={s.kpiFoot}>
        {d && (
          <span className={`${s.delta} ${s[`delta_${d.tone}`]}`} title={d.srText}>
            {d.dir !== 'flat' || d.text !== NO_DATA ? <span aria-hidden="true">{ARROW[d.dir]}</span> : null}
            <span aria-hidden="true">{d.text}</span>
            <span className="d-sr-only">{d.srText}</span>
          </span>
        )}
        {ToneIcon && (
          <span className={`${s.kpiTone} ${s[`delta_${tone === 'attention' || tone === 'alert' ? 'attention' : 'good'}`]}`}>
            <ToneIcon aria-hidden="true" /> {toneWord}
          </span>
        )}
        {sparkline && <Sparkline data={sparkline} className={s.kpiSpark} tone={tone === 'neutral' ? 'neutral' : tone} />}
      </span>
    </>
  );

  const cls = `${s.card} ${s.kpi} ${s[`kpiTone_${tone}`] || ''} ${onClick || to ? s.kpiAction : ''} ${className}`;
  return (
    <div className={cls} data-print="section">
      {to ? (
        <Link to={to} className={s.kpiInner}>{body}</Link>
      ) : onClick ? (
        <button type="button" className={s.kpiInner} onClick={onClick}>{body}</button>
      ) : (
        <div className={s.kpiInner}>{body}</div>
      )}
      {helpText && <InfoTip className={s.kpiInfo} align="end">{helpText}</InfoTip>}
    </div>
  );
}
