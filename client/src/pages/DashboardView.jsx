import { useMemo, useState } from 'react'
import { motion as Motion, AnimatePresence, MotionConfig } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { FaHome, FaMap, FaTrophy, FaHistory, FaUserFriends, FaRedo } from 'react-icons/fa'
import '../components/dashboard/tokens.css'
import Mascot from '../components/Mascot/Mascot'
import TabBar from './studentDashboard/TabBar'
import OverviewTab from './studentDashboard/OverviewTab'
import ProgressTab from './studentDashboard/ProgressTab'
import AchievementsTab from './studentDashboard/AchievementsTab'
import HistoryTab from './studentDashboard/HistoryTab'
import PeopleTab from './studentDashboard/PeopleTab'
import { useMedia } from './studentDashboard/hooks'
import { ReadOnlyContext } from './studentDashboard/context'
import { isRecent, readSeenBadges } from './studentDashboard/helpers'
import c from './studentDashboard/common.module.css'
import styles from './Dashboard.module.css'
import { useCalmMotion } from '../utils/useCalmMotion'

// Tab colours (fill, soft background, icon ink, icon colour when selected, 3D lip).
const HUE = {
  overview: { fill: '#ff922b', soft: 'var(--d-coral-soft)', ink: 'var(--d-coral-ink)', on: '#fff', lip: '#d9480f' },
  progress: { fill: '#339af0', soft: 'var(--d-sky-soft)', ink: 'var(--d-sky-ink)', on: '#fff', lip: '#1864ab' },
  achievements: { fill: '#fcc419', soft: 'var(--d-sun-soft)', ink: 'var(--d-sun-ink)', on: '#5c3b00', lip: '#c27c00' },
  history: { fill: '#20c997', soft: 'var(--d-teal-soft)', ink: 'var(--d-teal-ink)', on: '#fff', lip: '#0a6b52' },
  people: { fill: '#f06595', soft: 'var(--d-berry-soft)', ink: 'var(--d-berry-ink)', on: '#fff', lip: '#b0245f' },
}

/**
 * The student dashboard (presentational): a game-menu with five tabs, each
 * fitting one screen. Used by the student's own /dashboard (Redux data, tab in
 * the URL) and by the admin "view as student" viewer (its own fetches, tab in
 * local state, no "My people" tab).
 *
 *   tab / onTabChange   controlled tab (optional; local state otherwise)
 *   people              what the "My people" tab shows (the tab is hidden without it)
 *   moduleStars, family extra data for stars and today's goal (optional)
 *   readOnly            someone else looking (admin viewer): no play buttons or game links
 */
export default function DashboardView({
  stats, activity = [], achievements = [], performance = [], rounds = [], answers = [], arInsights,
  moduleStars, family,
  status, error,
  selectedYear, yearOptions, onYearChange, onRetry, onOpenResults, answersLoaded,
  displayName, avatarUrl, who,
  disableProgressMapPersistence,
  tab, onTabChange, people, readOnly = false,
}) {
  const { t } = useTranslation()
  const calm = useCalmMotion()
  const rail = useMedia('(orientation: landscape) and (min-width: 600px)')
  const [now] = useState(() => Date.now())
  const firstName = displayName || t('studentDash.friend', 'friend')
  const owner = who || displayName || 'me'

  const tabs = useMemo(() => {
    const list = [
      { key: 'overview', label: t('studentDash.tabs.overview', 'Today'), Icon: FaHome, hue: HUE.overview },
      { key: 'progress', label: t('studentDash.tabs.progress', 'Progress'), Icon: FaMap, hue: HUE.progress },
      { key: 'achievements', label: t('studentDash.tabs.achievements', 'Badges'), Icon: FaTrophy, hue: HUE.achievements },
      { key: 'history', label: t('studentDash.tabs.history', 'History'), Icon: FaHistory, hue: HUE.history },
    ]
    if (people) list.push({ key: 'people', label: t('studentDash.tabs.people', 'My people'), Icon: FaUserFriends, hue: HUE.people })
    return list
  }, [t, people])

  const [localTab, setLocalTab] = useState('overview')
  const wanted = tab ?? localTab
  const active = tabs.some((x) => x.key === wanted) ? wanted : 'overview'
  const [sawBadges, setSawBadges] = useState(active === 'achievements')
  const setTab = (key) => {
    if (key === 'achievements') setSawBadges(true)
    if (onTabChange) onTabChange(key)
    else setLocalTab(key)
  }

  // The newest badge from the last few days (for the hero chip and the tab dot).
  const newBadge = useMemo(() => achievements
    .filter((a) => a.earned && isRecent(a.earnedAt, now))
    .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))[0] || null, [achievements, now])
  const [seenAtStart] = useState(() => readSeenBadges(owner))
  const unseen = !readOnly && achievements.some((a) => a.earned && isRecent(a.earnedAt, now) && !seenAtStart.has(a.id))
  const tabsShown = tabs.map((x) => (x.key === 'achievements' && unseen && !sawBadges && active !== 'achievements'
    ? { ...x, badge: t('studentDash.newBadgeDot', 'new badge') }
    : x))

  const isNew = Boolean(stats) && !stats.totalSessions && !rounds.length

  const [answersAsked, setAnswersAsked] = useState(false)
  const openAnswers = () => {
    if (answersAsked) return
    setAnswersAsked(true)
    onOpenResults?.()
  }

  if (status === 'loading' && !stats) {
    return (
      <div className={`dash ${styles.state}`} data-theme="light">
        <div className={`${c.card} ${styles.stateCard}`} role="status">
          <Mascot size={120} mood="think" />
          <p>{t('dashboard.loadingDashboard')}</p>
        </div>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className={`dash ${styles.state}`} data-theme="light">
        <div className={`${c.card} ${styles.stateCard}`} role="alert">
          <Mascot size={110} mood="think" />
          <h2>{t('dashboard.serverError')}</h2>
          <p>{error || t('dashboard.serverErrorHint')}</p>
          {onRetry && (
            <button type="button" className={c.soft} onClick={onRetry}>
              <FaRedo aria-hidden="true" /> {t('dashboard.retry')}
            </button>
          )}
        </div>
      </div>
    )
  }

  let panel = null
  if (active === 'overview') {
    panel = (
      <OverviewTab
        stats={stats} achievements={achievements} rounds={rounds} performance={performance}
        moduleStars={moduleStars} family={family} displayName={firstName} avatarUrl={avatarUrl}
        isNew={isNew} newBadge={newBadge} now={now} onGoTab={setTab}
      />
    )
  } else if (active === 'progress') {
    panel = (
      <ProgressTab
        moduleStars={moduleStars} achievements={achievements} stats={stats} arInsights={arInsights}
        disableProgressMapPersistence={disableProgressMapPersistence}
      />
    )
  } else if (active === 'achievements') {
    panel = <AchievementsTab achievements={achievements} now={now} who={owner} isNew={isNew} />
  } else if (active === 'history') {
    panel = (
      <HistoryTab
        rounds={rounds} answers={answers} answersLoaded={answersLoaded ?? answersAsked} onOpenAnswers={openAnswers}
        activity={activity} performance={performance} stats={stats}
        selectedYear={selectedYear} yearOptions={yearOptions} onYearChange={onYearChange} isNew={isNew}
      />
    )
  } else if (active === 'people') {
    panel = <PeopleTab>{people}</PeopleTab>
  }

  return (
    <MotionConfig reducedMotion={calm ? 'always' : 'never'}>
      <ReadOnlyContext.Provider value={readOnly}>
      <div className={`dash ${styles.root}`} data-theme="light" data-dash-root data-readonly={readOnly || undefined}>
        <h1 className={c.srOnly}>{t('studentDash.title', 'My dashboard')}</h1>
        <TabBar
          tabs={tabsShown}
          active={active}
          onChange={setTab}
          idPrefix="sd"
          label={t('studentDash.tabsLabel', 'Dashboard sections')}
          vertical={rail}
          className={styles.tabs}
        />
        <div className={styles.stage}>
          <AnimatePresence mode="wait" initial={false}>
            <Motion.section
              key={active}
              role="tabpanel"
              id={`sd-panel-${active}`}
              aria-labelledby={`sd-tab-${active}`}
              tabIndex={0}
              className={styles.panel}
              initial={{ opacity: 0, y: 14, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {panel}
            </Motion.section>
          </AnimatePresence>
        </div>
      </div>
      </ReadOnlyContext.Provider>
    </MotionConfig>
  )
}
