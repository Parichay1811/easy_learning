/**
 * The camera-games findings for a grown-up: a parent, a teacher, a therapist.
 *
 * One card per finding: what kind it is (an icon AND a word), the sentence, the
 * change since the period before (an arrow AND words), a small trend line with
 * a text alternative, the numbers behind it, and what to try next (a game, and
 * an activity at home and/or in class). Styled with the dashboard tokens
 * (--d-*), so it sits in the parent and teacher dashboards as they are and in
 * the dark insights screen inside `.dash[data-theme="dark"]`.
 */
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { FaStar, FaGamepad, FaHome, FaChalkboardTeacher, FaHourglassHalf } from 'react-icons/fa'
import TrendSpark from './TrendSpark'
import { KIND_ICON, ARROW_ICON } from './icons.js'
import { activityOf } from './findings.js'
import {
  findingSentence, findingNotes, trendWords, evidenceLine, nextSentence, pendingSentence, kindLabel,
  numberLabel, seriesWords, sayText, NUMBER_OF_MEASURE,
} from './text.js'
import { shortDate } from './format.js'
import s from './AdultFindings.module.css'

export function TrendChip({ f, ctx }) {
  const dir = f.trend?.dir
  const Arrow = ARROW_ICON[dir || 'none']
  return (
    <span className={s.trend} data-dir={dir || 'none'}>
      <Arrow aria-hidden="true" />
      <span>{trendWords(f, ctx)}</span>
    </span>
  )
}

/**
 * @param {object} props
 * @param {object} props.result buildFindings() output
 * @param {{ skillName, gameName }} props.names
 * @param {'home'|'class'|'both'} [props.where] which activities to show
 * @param {boolean} [props.playLinks] link suggested games to the game (only where the learner plays)
 * @param {string} [props.headingId] id of the heading that labels the list
 */
export default function AdultFindings({ result, names, where = 'both', playLinks = false, headingId, compact = false }) {
  const { t, i18n } = useTranslation()
  if (!result) return null
  const ctx = { t, ...names, fmtDate: (d) => shortDate(d, i18n.language) }
  const pending = pendingSentence(result.pending, ctx)
  return (
    <div className={`${s.wrap} ${compact ? s.compact : ''}`}>
      <ul className={s.list} aria-labelledby={headingId}>
        {result.findings.map((f) => (
          <FindingCard key={f.id} f={f} ctx={ctx} where={where} playLinks={playLinks} />
        ))}
      </ul>
      {pending && <p className={s.pending}><FaHourglassHalf aria-hidden="true" /> {pending}</p>}
      {result.truncated && (
        <p className={s.pending}>{t('ar.findings.ui.truncated', 'Only the most recent 400 rounds of each period are included.')}</p>
      )}
    </div>
  )
}

function FindingCard({ f, ctx, where, playLinks }) {
  const { t } = ctx
  const Icon = KIND_ICON[f.kind] || FaStar
  const notes = findingNotes(f, ctx)
  const activity = activityOf(f)
  const next = f.next ? nextSentence(f.next, 'adult', ctx) : ''
  const numKey = NUMBER_OF_MEASURE[f.measure]
  const sparkLabel = numKey ? seriesWords(f.series, f.value?.unit === 'ms' ? 'ms' : f.value?.unit === '%' ? '%' : '', numberLabel(numKey, t), t) : ''
  return (
    <li className={s.card} data-kind={f.kind} data-print="section">
      <div className={s.head}>
        <span className={s.kind}><Icon aria-hidden="true" /> {kindLabel(f.kind, t)}</span>
        {f.kind !== 'notEnough' && f.kind !== 'effort' && <TrendChip f={f} ctx={ctx} />}
      </div>
      <p className={s.sentence}>{findingSentence(f, 'adult', ctx)}</p>
      {notes.map((n) => <p key={n.text} className={s.note} data-note={n.kind}>{n.text}</p>)}
      {f.kind !== 'notEnough' && (
        <div className={s.evidence}>
          {f.series?.length > 1 && <TrendSpark className={s.spark} series={f.series} unit={f.value?.unit} label={sparkLabel} />}
          <p className={s.evidenceText}>{evidenceLine(f, ctx)}</p>
        </div>
      )}
      {(next || activity) && (
        <div className={s.next}>
          <p className={s.nextTitle}>{t('ar.findings.ui.tryNext', 'What to try next')}</p>
          {next && (
            <p className={s.nextRow}>
              <FaGamepad aria-hidden="true" />
              <span>
                {playLinks && f.next?.gameId
                  ? <Link to={`/games/ar/${f.next.gameId}`}>{next}</Link>
                  : next}
              </span>
            </p>
          )}
          {activity && where !== 'class' && (
            <p className={s.nextRow}>
              <FaHome aria-hidden="true" />
              <span><strong>{t('ar.findings.ui.atHome', 'At home:')}</strong> {sayText(t, activity.home)}</span>
            </p>
          )}
          {activity && where !== 'home' && (
            <p className={s.nextRow}>
              <FaChalkboardTeacher aria-hidden="true" />
              <span><strong>{t('ar.findings.ui.inClass', 'In class:')}</strong> {sayText(t, activity.class)}</span>
            </p>
          )}
        </div>
      )}
    </li>
  )
}
