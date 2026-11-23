/**
 * "At a glance": the first page a grown-up sees. Three to six findings in
 * plain words with their trend lines and what to try at home or in class, then
 * the headline numbers with what each one means. The analytical tabs follow it.
 */
import { useTranslation } from 'react-i18next'
import { FaPrint } from 'react-icons/fa'
import AdultFindings from './AdultFindings'
import NumbersList from './NumbersList'
import { PERIOD_CHOICES, periodLine } from './format.js'
import { RULES } from './findings.js'
import s from './GlanceView.module.css'
import '../../components/dashboard/tokens.css'

export default function GlanceView({ result, names, periodDays, onPeriod, onPrint, source }) {
  const { t, i18n } = useTranslation()
  return (
    <div className={s.glance}>
      <div className={s.top}>
        <div className={s.topText}>
          <h2 className={s.title}>{t('ar.insights.glance.title', 'At a glance')}</h2>
          <p className={s.period}>{periodLine(result, t, i18n.language)}</p>
          <p className={s.source}>
            {source === 'server'
              ? t('ar.insights.glance.sourceServer', 'From every device this learner has played on.')
              : t('ar.insights.glance.sourceDevice', 'From the rounds played on this device.')}
          </p>
        </div>
        <div className={s.actions}>
          <label className={s.periodPick}>
            <span>{t('ar.insights.glance.compare', 'Period')}</span>
            <select value={periodDays} onChange={(e) => onPeriod(Number(e.target.value))}>
              {PERIOD_CHOICES.map((d) => (
                <option key={d} value={d}>{t('ar.insights.glance.lastDays', 'Last {{n}} days', { n: d })}</option>
              ))}
            </select>
          </label>
          <button type="button" className={s.print} onClick={onPrint}>
            <FaPrint aria-hidden="true" /> {t('ar.insights.glance.print', 'Print or save as PDF')}
          </button>
        </div>
      </div>

      <div className={`dash ${s.dash}`} data-theme="dark">
        <div className={s.grid}>
          <section aria-labelledby="glance-findings" className={s.col}>
            <h3 id="glance-findings" className={s.colTitle}>{t('ar.insights.glance.findingsTitle', 'What we noticed')}</h3>
            <AdultFindings result={result} names={names} where="both" playLinks headingId="glance-findings" />
          </section>
          <section aria-labelledby="glance-numbers" className={s.col}>
            <h3 id="glance-numbers" className={s.colTitle}>{t('ar.insights.glance.numbersTitle', 'The numbers, and what they mean')}</h3>
            <NumbersList numbers={result.numbers} headingId="glance-numbers" />
            <p className={s.rules}>
              {t('ar.insights.glance.rules', 'A finding needs at least {{rounds}} rounds and {{turns}} turns. A change only counts when it is bigger than the normal ups and downs of play. Understanding and movement are always reported separately.', { rounds: RULES.minRounds, turns: RULES.minTrials })}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
