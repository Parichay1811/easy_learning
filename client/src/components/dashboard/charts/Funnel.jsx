import { useTranslation } from 'react-i18next';
import ChartFrame from './ChartFrame';
import { fmtNumber, fmtPercent } from '../format';
import s from './charts.module.css';

/**
 * "Where do people drop off?" Each step is a bar sized against the first step,
 * with its count, its share of the previous step and how many were lost.
 *
 *   <Funnel steps={[{ key: 'signup', label: 'Signed up', value: 1000 },
 *                   { key: 'lesson', label: 'First lesson', value: 710 }, …]}
 *           onSelect={(step) => …} />
 *
 * Props: steps [{key, label, value}], onSelect(step), format(v) (default number), summary.
 */
export default function Funnel({ steps = [], onSelect, format = fmtNumber, summary, label }) {
  const { t } = useTranslation();
  const first = steps[0]?.value || 0;
  const last = steps[steps.length - 1]?.value;
  const auto = steps.length
    ? t('dash.funnel.summary', {
        defaultValue: 'Funnel with {{n}} steps, from {{first}} to {{last}} ({{pct}} stay to the end). {{steps}}',
        n: steps.length, first: format(first), last: format(last), pct: fmtPercent(first ? last / first : null),
        steps: steps.map((st, i) => `${st.label} ${format(st.value)}${i ? `, ${fmtPercent(steps[i - 1].value ? st.value / steps[i - 1].value : null)} of the previous step` : ''}`).join('. '),
      })
    : t('dash.funnel.none', { defaultValue: 'No data yet.' });

  return (
    <ChartFrame label={label || t('dash.funnel.label', { defaultValue: 'Conversion funnel' })} summary={summary || auto}>
      <ol className={s.funnel}>
        {steps.map((st, i) => {
          const prev = i ? steps[i - 1].value : null;
          const keep = prev ? st.value / prev : null;
          const width = first ? Math.max(4, (st.value / first) * 100) : 0;
          const body = (
            <>
              <span className={s.funnelLabel}>{st.label}</span>
              <span className={s.funnelTrack}>
                <span className={s.funnelBar} style={{ width: `${width}%`, opacity: 1 - i * (0.5 / Math.max(1, steps.length)) }} />
              </span>
              <span className={s.funnelNum}>{format(st.value)}</span>
              <span className={s.funnelRate}>
                {i === 0
                  ? t('dash.funnel.start', { defaultValue: 'start' })
                  : <>{fmtPercent(keep)} <span className={s.funnelLost}>{t('dash.funnel.lost', { defaultValue: '−{{n}} lost', n: format(prev - st.value) })}</span></>}
              </span>
            </>
          );
          return (
            <li key={st.key}>
              {onSelect
                ? <button type="button" className={s.funnelRow} onClick={() => onSelect(st)}>{body}</button>
                : <div className={s.funnelRow}>{body}</div>}
            </li>
          );
        })}
      </ol>
    </ChartFrame>
  );
}
