/**
 * The headline numbers for grown-ups, each with its change since the period
 * before (an arrow and words), a small trend line with a text alternative, and
 * one sentence on what the number means. Understanding and movement stay in
 * separate rows, always.
 */
import { useTranslation } from 'react-i18next'
import TrendSpark from './TrendSpark'
import { TrendChip } from './AdultFindings'
import { numberLabel, numberMeaning, formatValue, seriesWords } from './text.js'
import s from './NumbersList.module.css'

const MEASURE = { understood: 'understanding', onTheirOwn: 'independence', thinkingTime: 'thinkingTime', movingTime: 'movingTime', directness: 'directness', daysPlayed: 'days' }

export default function NumbersList({ numbers, sparklines = true, headingId }) {
  const { t } = useTranslation()
  const ctx = { t, skillName: (x) => x, gameName: (x) => x }
  return (
    <dl className={s.list} aria-labelledby={headingId}>
      {numbers.map((n) => {
        const label = numberLabel(n.key, t)
        const asFinding = { trend: n.trend, measure: MEASURE[n.key], value: { unit: n.unit } }
        return (
          <div key={n.key} className={s.row} data-print="section">
            <dt className={s.label}>{label}</dt>
            <dd className={s.value}>
              <strong>{formatValue(n.now, n.unit)}</strong>
              {n.key !== 'thinkingTime' && n.now != null && <TrendChip f={asFinding} ctx={ctx} />}
              {n.before != null && (
                <span className={s.before}>{t('ar.findings.ui.was', 'was {{value}}', { value: formatValue(n.before, n.unit) })}</span>
              )}
            </dd>
            {sparklines && n.series?.filter((p) => p.value != null).length > 1 && (
              <dd className={s.spark}>
                <TrendSpark series={n.series} unit={n.unit} label={seriesWords(n.series, n.unit, label, t)} width={120} height={34} />
              </dd>
            )}
            <dd className={s.meaning}>{numberMeaning(n.key, t)}</dd>
          </div>
        )
      })}
    </dl>
  )
}
