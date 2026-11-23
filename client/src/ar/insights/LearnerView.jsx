/**
 * "For me": the learner's own page about their camera games.
 *
 * Three things I got better at, my next challenge, my effort. Big pictures,
 * short words, and a "Read to me" button that reads the page in the AI
 * Teacher's voice. Only good news and one challenge: never a list of what went
 * wrong, never a number to feel bad about, never a comparison with anyone else.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FaVolumeUp, FaStop, FaFlag, FaPlay, FaGamepad, FaCalendarCheck, FaClock, FaStar } from 'react-icons/fa'
import { narrate, stopNarration, onNarration } from '../../utils/narrator'
import { useCalmMotion } from '../../utils/useCalmMotion'
import { findingSentence, nextSentence } from './text.js'
import { KIND_ICON } from './icons.js'
import s from './LearnerView.module.css'

// The child's meter shows the number as a filled bar; the sentence and the
// hidden text carry the same information, so the picture is never the only way.
function Meter({ f }) {
  const { t } = useTranslation()
  const now = f.value?.now
  const before = f.value?.before
  if (f.value?.unit !== '%' || now == null) return null
  return (
    <div className={s.meter}>
      <span className={s.srOnly}>
        {before != null
          ? t('ar.insights.me.meterSrBoth', 'Before: {{before}} out of 100. Now: {{now}} out of 100.', { before, now })
          : t('ar.insights.me.meterSrNow', 'Now: {{now}} out of 100.', { now })}
      </span>
      {before != null && (
        <div className={s.meterRow} aria-hidden="true">
          <span className={s.meterLabel}>{t('ar.insights.me.before', 'Before')}</span>
          <span className={s.meterTrack}><span className={`${s.meterFill} ${s.meterBefore}`} style={{ width: `${Math.max(4, before)}%` }} /></span>
        </div>
      )}
      <div className={s.meterRow} aria-hidden="true">
        <span className={s.meterLabel}>{t('ar.insights.me.now', 'Now')}</span>
        <span className={s.meterTrack}><span className={s.meterFill} style={{ width: `${Math.max(4, now)}%` }} /></span>
      </div>
    </div>
  )
}

export default function LearnerView({ result, names, readOnly = false }) {
  const { t, i18n } = useTranslation()
  const calm = useCalmMotion()
  const [reading, setReading] = useState(false)
  const ctx = { t, ...names }
  const L = result.learner
  const wins = L.wins
  const effort = L.effort
  const challenge = L.challenge
  const totals = result.totals.current

  useEffect(() => onNarration((e) => { if (e.type === 'end') setReading(false) }), [])
  useEffect(() => () => stopNarration(), [])

  const headline = L.notEnough
    ? findingSentence(L.notEnough, 'child', ctx)
    : wins.length
      ? t('ar.insights.me.headline', 'Look how you are growing!')
      : t('ar.insights.me.headlineKeep', 'Every round you play is practice. Keep going!')
  const winTexts = wins.map((f) => findingSentence(f, 'child', ctx)).filter(Boolean)
  const challengeText = challenge ? nextSentence(challenge, 'child', ctx) : ''
  const effortText = effort ? findingSentence(effort, 'child', ctx) : ''

  const readAloud = () => {
    if (reading) { stopNarration(); setReading(false); return }
    const script = [
      headline,
      winTexts.length ? `${t('ar.insights.me.winsTitle', 'I got better at')}: ${winTexts.join(' ')}` : '',
      challengeText ? `${t('ar.insights.me.challengeTitle', 'My next challenge')}: ${challengeText}.` : '',
      effortText,
    ].filter(Boolean)
    setReading(true)
    narrate(script, { lang: i18n.language, user: true }).finally(() => setReading(false))
  }

  return (
    <div className={`${s.me} ${calm ? s.calm : ''}`}>
      <div className={s.hero}>
        <span className={s.heroIcon} aria-hidden="true"><FaStar /></span>
        <h2 className={s.headline}>{headline}</h2>
        <button type="button" className={s.read} onClick={readAloud} aria-pressed={reading} data-sound="none">
          {reading ? <FaStop aria-hidden="true" /> : <FaVolumeUp aria-hidden="true" />}
          <span>{reading ? t('ar.insights.me.stop', 'Stop') : t('ar.insights.me.read', 'Read to me')}</span>
        </button>
      </div>

      <section className={s.section} aria-labelledby="me-wins">
        <h3 id="me-wins" className={s.sectionTitle}>{t('ar.insights.me.winsTitle', 'I got better at')}</h3>
        {wins.length ? (
          <ul className={s.wins}>
            {wins.map((f, i) => {
              const Icon = KIND_ICON[f.kind] || FaStar
              return (
                <li key={f.id} className={s.win} style={{ '--i': i }}>
                  <span className={s.winIcon} aria-hidden="true"><Icon /></span>
                  <p className={s.winText}>{findingSentence(f, 'child', ctx)}</p>
                  <Meter f={f} />
                </li>
              )
            })}
          </ul>
        ) : (
          <p className={s.empty}>{t('ar.insights.me.winsEmpty', 'Play a few more rounds and your wins will show up here.')}</p>
        )}
      </section>

      <div className={s.pair}>
        <section className={`${s.section} ${s.challenge}`} aria-labelledby="me-challenge">
          <h3 id="me-challenge" className={s.sectionTitle}><FaFlag aria-hidden="true" /> {t('ar.insights.me.challengeTitle', 'My next challenge')}</h3>
          {challenge ? (
            <>
              <p className={s.big}>{challengeText}</p>
              {challenge.domain && (
                <p className={s.small}>{t('ar.insights.me.helpsWith', 'It helps with: {{skill}}', { skill: names.skillName(challenge.domain) })}</p>
              )}
              {!readOnly && (
                <Link className={s.play} to={`/games/ar/${challenge.gameId}`}>
                  <FaPlay aria-hidden="true" /> {t('ar.insights.me.play', 'Play now')}
                </Link>
              )}
            </>
          ) : (
            <p className={s.big}>{t('ar.insights.me.challengeAny', 'Pick any camera game you like!')}</p>
          )}
        </section>

        <section className={`${s.section} ${s.effort}`} aria-labelledby="me-effort">
          <h3 id="me-effort" className={s.sectionTitle}><FaGamepad aria-hidden="true" /> {t('ar.insights.me.effortTitle', 'My effort')}</h3>
          {effortText && <p className={s.big}>{effortText}</p>}
          <ul className={s.facts}>
            <li><FaGamepad aria-hidden="true" /><strong>{totals.played}</strong> <span>{t('ar.insights.me.rounds', 'rounds', { count: totals.played })}</span></li>
            <li><FaCalendarCheck aria-hidden="true" /><strong>{totals.days}</strong> <span>{t('ar.insights.me.days', 'days', { count: totals.days })}</span></li>
            <li><FaClock aria-hidden="true" /><strong>{totals.minutes}</strong> <span>{t('ar.insights.me.minutes', 'minutes', { count: totals.minutes })}</span></li>
          </ul>
          <p className={s.small}>{t('ar.insights.me.periodNote', 'In the last {{days}} days.', { days: result.period.days })}</p>
        </section>
      </div>
    </div>
  )
}
