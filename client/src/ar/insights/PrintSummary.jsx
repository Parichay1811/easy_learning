/**
 * The one-page printout for grown-ups ("Print or save as PDF"). Hidden on
 * screen; when the page is printed, only this is shown (see the print rules in
 * PrintSummary.module.css), whichever view was open. Black on white, no
 * buttons, no links: findings, the numbers with their meaning, and the same
 * honest disclaimer the screen carries.
 */
import { useTranslation } from 'react-i18next'
import AdultFindings from './AdultFindings'
import { numberLabel, numberMeaning, formatValue, trendWords } from './text.js'
import { periodLine } from './format.js'
import s from './PrintSummary.module.css'
import '../../components/dashboard/tokens.css'

const MEASURE = { understood: 'understanding', onTheirOwn: 'independence', thinkingTime: 'thinkingTime', movingTime: 'movingTime', directness: 'directness', daysPlayed: 'days' }

export default function PrintSummary({ result, names }) {
  const { t, i18n } = useTranslation()
  if (!result) return null
  const ctx = { t, ...names }
  const printed = new Date().toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <section className={`dash ${s.print}`} data-theme="light" aria-hidden="true">
      <header className={s.head}>
        <h1>{t('ar.insights.print.title', 'Camera games: summary for grown-ups')}</h1>
        <p>{periodLine(result, t, i18n.language)}</p>
        <p className={s.meta}>{t('ar.insights.print.printed', 'Printed {{date}} from Learnigo.', { date: printed })}</p>
      </header>
      <h2>{t('ar.insights.glance.findingsTitle', 'What we noticed')}</h2>
      <AdultFindings result={result} names={names} where="both" />
      <h2>{t('ar.insights.glance.numbersTitle', 'The numbers, and what they mean')}</h2>
      <table className={s.table}>
        <colgroup>
          <col className={s.cMeasure} /><col className={s.cNum} /><col className={s.cNum} /><col className={s.cChange} /><col />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">{t('ar.insights.print.measure', 'Measure')}</th>
            <th scope="col">{t('ar.insights.print.now', 'This period')}</th>
            <th scope="col">{t('ar.insights.print.before', 'Period before')}</th>
            <th scope="col">{t('ar.insights.print.change', 'Change')}</th>
            <th scope="col">{t('ar.insights.print.meaning', 'What it means')}</th>
          </tr>
        </thead>
        <tbody>
          {result.numbers.map((n) => (
            <tr key={n.key}>
              <th scope="row">{numberLabel(n.key, t)}</th>
              <td>{formatValue(n.now, n.unit)}</td>
              <td>{formatValue(n.before, n.unit)}</td>
              <td>{n.key === 'thinkingTime' ? '—' : trendWords({ trend: n.trend, measure: MEASURE[n.key], value: { unit: n.unit } }, ctx)}</td>
              <td>{numberMeaning(n.key, t)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={s.small}>
        {t('ar.insights.footer.disclaimer', 'These are descriptions of what happened in the games, not clinical measures. A high score is not evidence that a skill transfers off the screen — that has to be checked in real life.')}
      </p>
    </section>
  )
}
