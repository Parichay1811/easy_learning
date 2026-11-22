import { useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { FaFire, FaStar, FaMedal, FaBolt, FaBookOpen, FaPlay, FaCheck, FaTrophy, FaChevronRight, FaGamepad, FaSeedling } from 'react-icons/fa'
import Mascot, { FloatingButterflies } from '../../components/Mascot/Mascot'
import NextUpCard from '../../components/learning/NextUpCard'
import { useJourney, langOf } from '../../components/journey/journeyApi'
import { badgeName } from '../../components/journey/words'
import { useLearnProfile } from './learnApi'
import { useCountUp } from './hooks'
import { ReadOnlyContext } from './context'
import { DEFAULT_DAILY_GOAL, fmtMinutes, fmtNumber, moduleName, subjectName, playTarget } from './helpers'
import TodayHub from './TodayHub'
import { usePrefs } from '../../components/settings/usePrefs'
import { reducedMotion } from '../../utils/learnerPrefs'
import c from './common.module.css'
import s from './OverviewTab.module.css'

const HUES = {
  streak: { bg: 'var(--d-coral-soft)', fg: 'var(--d-coral-ink)' },
  stars: { bg: 'var(--d-sun-soft)', fg: 'var(--d-sun-ink)' },
  badges: { bg: 'var(--d-grape-soft)', fg: 'var(--d-grape-ink)' },
  xp: { bg: 'var(--d-sky-soft)', fg: 'var(--d-sky-ink)' },
  sessions: { bg: 'var(--d-teal-soft)', fg: 'var(--d-teal-ink)' },
}

function Counter({ kind, icon, value, of, label, sub, delay, lang }) {
  const Glyph = icon
  const n = useCountUp(value ?? 0, { delay })
  return (
    <div className={s.counter} style={{ '--c-bg': HUES[kind].bg, '--c-fg': HUES[kind].fg }}>
      <span className={s.counterIcon} aria-hidden="true"><Glyph /></span>
      <span className={s.counterText}>
        <span className={s.counterNum}>
          {value == null ? '—' : fmtNumber(n, lang)}
          {of != null && value != null && <small>/{of}</small>}
        </span>
        <span className={s.counterLabel}>{label}</span>
        {sub && <span className={s.counterSub}>{sub}</span>}
      </span>
    </div>
  )
}

function Ring({ value, goal }) {
  const pct = goal > 0 ? Math.min(1, value / goal) : 0
  const done = goal > 0 && value >= goal
  return (
    <div className={s.ring} data-done={done || undefined}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="42" className={s.ringTrack} />
        {pct > 0 && (
          <Motion.circle
            cx="50" cy="50" r="42"
            className={s.ringFill}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: pct }}
            transition={{ duration: 1.1, ease: 'easeOut', delay: 0.35 }}
          />
        )}
      </svg>
      <span className={s.ringText}>
        {done ? <FaCheck aria-hidden="true" /> : <><b>{Math.round(value)}</b><small>/{goal}</small></>}
      </span>
    </div>
  )
}

/** The days of this week (Mon..Sun) with minutes played, in the server's day keys (UTC). */
function weekDays(performance, now) {
  const today = new Date(now)
  const todayKey = today.toISOString().slice(0, 10)
  const dow = (today.getUTCDay() + 6) % 7 // Mon = 0
  const monday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - dow)
  const byDay = {}
  for (const p of performance || []) {
    const k = new Date(p.date).toISOString().slice(0, 10)
    byDay[k] = (byDay[k] || 0) + (p.totalMinutes || 0)
  }
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday + i * 86400000)
    const key = d.toISOString().slice(0, 10)
    return { date: key, minutes: byDay[key] || 0, today: key === todayKey, future: key > todayKey }
  })
}

/**
 * The "Today" tab. For a signed-in learner on a server with the journey
 * endpoints (contract §2) it is the Today hub (welcome back, what next, the
 * journey map, today's discovery, growth badges; the numbers below under "My
 * stars"). Without them (an older server, or the admin's read-only viewer) it
 * is the overview it always was.
 */
export default function OverviewTab(props) {
  const { t, i18n } = useTranslation()
  const readOnly = useContext(ReadOnlyContext)
  const prefs = usePrefs()
  const journey = useJourney({ enabled: !readOnly, lang: langOf(i18n.language), calm: reducedMotion(prefs) || Boolean(prefs.focusMode) })
  const classic = <ClassicOverview {...props} />
  if (readOnly || (!journey.loading && !journey.available)) return classic
  if (journey.loading) {
    return (
      <div className={`${c.card} ${c.empty}`} role="status">
        <Mascot size="clamp(50px, 14vh, 110px)" mood="think" />
        <p>{t('journey.loading', 'Getting your day ready…')}</p>
      </div>
    )
  }
  return (
    <TodayHub
      journey={journey}
      classic={classic}
      achievements={props.achievements}
      displayName={props.displayName}
      now={props.now}
      onGoTab={props.onGoTab}
    />
  )
}

function ClassicOverview({
  stats, achievements, rounds, performance, moduleStars, family,
  displayName, avatarUrl, isNew, newBadge, now, onGoTab,
}) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const readOnly = useContext(ReadOnlyContext)

  const xp = stats?.totalXP ?? 0
  const level = stats?.level ?? Math.floor(xp / 100) + 1
  const inLevel = xp % 100
  const shownLevel = useCountUp(level, { duration: 700 })
  const earned = achievements.filter((a) => a.earned).length
  // null while unknown (the admin viewer has no stars endpoint): shown as "—".
  const starsTotal = useMemo(
    () => moduleStars == null ? null : Object.entries(moduleStars).filter(([k]) => /^(listen|read|write|speak)_(english|maths|science)$/.test(k)).reduce((sum, [, v]) => sum + (Number(v) || 0), 0),
    [moduleStars],
  )
  const streak = stats?.streak ?? 0

  // The puppy waves hello to a new learner and cheers a new badge or a streak,
  // for a few seconds, then settles into its calm idle (busy motion that never
  // stops is hard on attention).
  const celebrate = !isNew && (Boolean(newBadge) || streak >= 2)
  const lively = isNew || celebrate
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    if (!lively) return undefined
    const id = setTimeout(() => setSettled(true), 5000)
    return () => clearTimeout(id)
  }, [lively])
  const mood = !lively || settled ? 'idle' : isNew ? 'wave' : 'cheer'

  // Today's goal: the family's goal when a grown-up set one, else a gentle default.
  const goal = family?.goal && family?.progress ? family.progress.minutesPerDay : DEFAULT_DAILY_GOAL
  const famToday = family?.progress?.days?.find((d) => d.today)
  const todayMin = famToday ? famToday.minutes : (stats?.todayMinutes ?? 0)
  const days = family?.goal && family?.progress?.days ? family.progress.days : weekDays(performance, now)
  const goalTarget = goal || DEFAULT_DAILY_GOAL
  const goalDone = todayMin >= goalTarget
  const weekdayLetter = (iso) => {
    try { return new Date(`${iso}T12:00:00Z`).toLocaleDateString(lang || undefined, { weekday: 'narrow', timeZone: 'UTC' }) } catch { return '' }
  }

  // The learning engine's suggestion, when this server has one: the big button starts it.
  const learn = useLearnProfile({ enabled: !readOnly })
  const next = learn.data?.next

  const target = playTarget(rounds)
  const targetLabel = target ? [moduleName(t, target.module), target.subject && subjectName(t, target.subject)].filter(Boolean).join(' · ') : null

  return (
    <div className={s.grid} data-readonly={readOnly || undefined}>
      {/* ── Hero: puppy, name, level and XP ── */}
      <section className={`${c.card} ${s.hero}`} aria-labelledby="sd-hello">
        <div className={s.heroSky} aria-hidden="true"><FloatingButterflies count={2} /></div>
        <div className={s.heroMascot}>
          <Mascot size="var(--hero-mascot)" mood={mood} />
          {avatarUrl ? <img className={s.avatar} src={avatarUrl} alt="" /> : null}
        </div>
        <div className={s.heroBody}>
          <h2 id="sd-hello" className={s.hello}>
            {isNew
              ? t('studentDash.hello.new', 'Welcome, {{name}}!', { name: displayName })
              : t('studentDash.hello.back', 'Hi, {{name}}!', { name: displayName })}
          </h2>
          <p className={s.helloSub}>
            {isNew
              ? t('studentDash.hello.newSub', 'Your adventure starts here. Play a game to earn your first stars!')
              : t('dashboard.motivational')}
          </p>

          <div className={s.levelRow}>
            <div className={s.levelBadge} aria-hidden="true">
              <small>{t('studentDash.lvl', 'LVL')}</small>
              <b>{shownLevel}</b>
            </div>
            <div className={s.xpWrap}>
              <div className={s.xpTop}>
                {/* "XP level": game points, kept apart from the learning levels (Progress > My learning). */}
                <strong>{t('studentDash.xpLevel', { defaultValue: 'XP level {{level}}', level })}</strong>
                <span>
                  {t('studentDash.xpHave', '{{have}} / 100 XP', { have: inLevel })}
                  <span className={s.toNext}> {t('studentDash.xpToNextLevel', { defaultValue: 'to XP level {{next}}', next: level + 1 })}</span>
                </span>
              </div>
              <div
                className={s.xpBar}
                role="progressbar"
                aria-label={t('studentDash.xpBar', 'XP to the next level')}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={inLevel}
              >
                <Motion.span
                  className={s.xpFill}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: Math.max(0.02, inLevel / 100) }}
                  transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1], delay: 0.25 }}
                />
                <span className={s.xpShine} aria-hidden="true" />
              </div>
            </div>
          </div>

          {newBadge && (
            <button
              type="button"
              className={s.newBadge}
              onClick={() => onGoTab('achievements')}
              aria-label={t('studentDash.newBadge', 'New badge: {{name}}!', { name: badgeName(t, newBadge) })}
            >
              <span className={s.newPill} aria-hidden="true">{t('studentDash.badges.new', 'NEW')}</span>
              <span className={s.newIcon} aria-hidden="true">{newBadge.icon || <FaTrophy />}</span>
              <span className={s.newBadgeText} aria-hidden="true">{badgeName(t, newBadge)}</span>
              <FaChevronRight aria-hidden="true" />
            </button>
          )}
        </div>
      </section>

      {/* ── Counters ── */}
      {isNew ? (
        <section className={`${c.card} ${s.steps}`} aria-labelledby="sd-steps">
          <h3 id="sd-steps" className={c.cardTitle}><FaSeedling aria-hidden="true" /> {t('studentDash.steps.title', 'How to play')}</h3>
          <ol className={s.stepList}>
            <li><span aria-hidden="true">1</span>{t('studentDash.steps.one', 'Pick a subject world')}</li>
            <li><span aria-hidden="true">2</span>{t('studentDash.steps.two', 'Play a round of 10 questions')}</li>
            <li><span aria-hidden="true">3</span>{t('studentDash.steps.three', 'Win stars, XP and badges!')}</li>
          </ol>
        </section>
      ) : (
        <section className={s.counters} aria-label={t('studentDash.myNumbers', 'My numbers')}>
          <Counter kind="streak" icon={FaFire} value={streak} label={t('studentDash.counter.streak', 'Streak')}
            sub={streak >= 3 ? t('dashboard.stats.onFire') : t('dashboard.stats.keepGoing')} delay={150} lang={lang} />
          <Counter kind="stars" icon={FaStar} value={starsTotal} of={36} label={t('studentDash.counter.stars', 'Stars')} delay={250} lang={lang} />
          <Counter kind="badges" icon={FaMedal} value={earned} of={achievements.length || null} label={t('studentDash.counter.badges', 'Badges')} delay={350} lang={lang} />
          <Counter kind="xp" icon={FaBolt} value={xp} label={t('dashboard.stats.totalXP')} delay={450} lang={lang} />
          <Counter kind="sessions" icon={FaBookOpen} value={stats?.totalSessions ?? 0} label={t('dashboard.stats.sessions')}
            sub={t('dashboard.stats.lessonsCompleted')} delay={550} lang={lang} />
        </section>
      )}

      {/* ── Today's goal ── */}
      <section className={`${c.card} ${s.goal}`} aria-labelledby="sd-goal">
        <Ring value={todayMin} goal={goalTarget} />
        <div className={s.goalBody}>
          <h3 id="sd-goal" className={s.goalTitle}>{t('studentDash.goal.title', "Today's goal")}</h3>
          <p className={s.goalLine}>
            {goalDone
              ? t('studentDash.goal.done', 'Goal done! Super work!')
              : t('studentDash.goal.left', 'Play {{n}} more minutes', { n: Math.max(1, Math.ceil(goalTarget - todayMin)) })}
          </p>
          <p className={s.goalMeta}>
            {t('dashboard.stats.todayTime')}: <b>{fmtMinutes(todayMin)}</b>
            {stats?.peakTimeLabel ? <> · {t('dashboard.heatmap.mostActive', { time: stats.peakTimeLabel })}</> : null}
          </p>
          <div className={s.week} aria-label={family?.goal && family?.progress
            ? t('family.goalDays', { defaultValue: '{{met}} of {{n}} days this week', met: family.progress.daysMet, n: family.progress.daysPerWeek })
            : t('studentDash.goal.week', 'This week')}
          >
            {days.map((d) => {
              const met = d.met ?? d.minutes >= goalTarget
              const played = d.minutes > 0
              return (
                <span key={d.date} className={s.day} data-today={d.today || undefined} data-state={d.future ? 'future' : met ? 'met' : played ? 'played' : 'none'}
                  title={`${d.date}: ${fmtMinutes(d.minutes)}`}>
                  <i aria-hidden="true">{met ? <FaStar /> : null}</i>
                  <span>{weekdayLetter(d.date)}</span>
                </span>
              )
            })}
          </div>
          {family?.goal && family?.progress && (
            <p className={s.reward}>
              {family.progress.reached
                ? t('family.goalDone', { defaultValue: 'Goal reached this week!' })
                : t('family.goalDays', { defaultValue: '{{met}} of {{n}} days this week', met: family.progress.daysMet, n: family.progress.daysPerWeek })}
              {family.goal.reward && (
                <>
                  {' · '}
                  <span aria-hidden="true">{family.goal.rewardEmoji || '🎁'}</span>{' '}
                  {family.progress.reached ? t('family.rewardWon', { defaultValue: 'You earned: {{r}}', r: family.goal.reward }) : family.goal.reward}
                </>
              )}
            </p>
          )}
        </div>
      </section>

      {/* ── The one big button ── */}
      {!readOnly && (
      <div className={s.play}>
        {!isNew && next?.subject ? (
          <NextUpCard next={next} skills={learn.data?.skills} variant="button" className={`${c.cta} ${s.playBtn}`} classes={{ icon: s.playIcon, text: s.playText }} />
        ) : (
        <Link to={target ? target.to : '/home'} className={`${c.cta} ${s.playBtn}`}>
          <span className={s.playIcon} aria-hidden="true">{isNew ? <FaGamepad /> : <FaPlay />}</span>
          <span className={s.playText}>
            <span>{isNew ? t('studentDash.playFirst', 'Play your first game') : t('studentDash.continue', 'Continue playing')}</span>
            {!isNew && <small>{targetLabel || t('studentDash.pickGame', 'Pick a game')}</small>}
          </span>
        </Link>
        )}
      </div>
      )}
    </div>
  )
}
