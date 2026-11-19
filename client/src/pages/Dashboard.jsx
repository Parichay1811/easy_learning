import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import {
  fetchDashboardStats,
  fetchDashboardActivity,
  fetchDashboardAchievements,
  fetchDashboardPerformance,
  fetchDashboardAnswers,
  fetchRounds,
  fetchArInsights,
  fetchModuleStars,
} from '../store/slices/dashboardSlice'
import styles from './Dashboard.module.css'
import c from './studentDashboard/common.module.css'
import DashboardView from './DashboardView'
import VideoBackground from '../components/VideoBackground/VideoBackground'
import LinkParentCard from '../components/LinkParentCard/LinkParentCard'
import Mascot from '../components/Mascot/Mascot'
import { TAB_KEYS } from './studentDashboard/helpers'
import { useNavOverlap } from './studentDashboard/hooks'

const BASE = import.meta.env.VITE_API_BASE_URL

function authHeaders() {
  const token = localStorage.getItem('jwt_token') || localStorage.getItem('firebase_jwt')
  let tz = 'UTC'
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { /* keep UTC */ }
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'X-Timezone': tz }
}

// ── Main Dashboard (Redux-connected wrapper for the logged-in student) ─────────
export default function Dashboard() {
  const dispatch  = useDispatch()
  const { user }  = useAuth()
  const { t }     = useTranslation()
  const { stats, activity, achievements, performance, answers, rounds, arInsights, moduleStars, status, error } = useSelector(s => s.dashboard)
  const navExtra = useNavOverlap()

  // The open tab lives in the URL (?tab=progress) so Back/Forward and reloads keep it.
  const [params, setParams] = useSearchParams()
  const tabParam = params.get('tab')
  const tab = TAB_KEYS.includes(tabParam) ? tabParam : 'overview'
  const onTabChange = useCallback((key) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', key)
      return next
    })
  }, [setParams])

  const thisYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(thisYear)
  const yearOptions = Array.from({ length: 5 }, (_, i) => thisYear - i)
  const [answersLoaded, setAnswersLoaded] = useState(false)
  const [family, setFamily] = useState(null)

  // Runs once user is available; `handleYearChange` below already handles
  // later year switches with its own dispatch, so `selectedYear` is
  // deliberately not a dependency here.
  useEffect(() => {
    if (!user) return
    dispatch(fetchDashboardStats())
    dispatch(fetchDashboardActivity({ year: selectedYear }))
    dispatch(fetchDashboardAchievements())
    dispatch(fetchDashboardPerformance(30))
    dispatch(fetchRounds(30))
    dispatch(fetchArInsights(30))
    dispatch(fetchModuleStars())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, user])

  // The family's weekly goal (if a linked grown-up set one) for "Today's goal".
  useEffect(() => {
    if (!user) return undefined
    let live = true
    fetch(`${BASE}/dashboard/family`, { headers: authHeaders(), credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (live) setFamily(d?.success ? d : null) })
      .catch(() => { /* offline: no family goal */ })
    return () => { live = false }
  }, [user])

  function handleYearChange(year) {
    setSelectedYear(year)
    dispatch(fetchDashboardActivity({ year }))
  }

  function handleRetry() {
    dispatch(fetchDashboardStats())
    dispatch(fetchDashboardActivity({ year: selectedYear }))
    dispatch(fetchDashboardAchievements())
    dispatch(fetchDashboardPerformance(30))
    dispatch(fetchRounds(30))
    dispatch(fetchModuleStars())
  }

  function handleOpenResults() {
    dispatch(fetchDashboardAnswers(50)).finally(() => setAnswersLoaded(true))
  }

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || ''

  let body
  if (user === undefined) {
    // Auth still resolving
    body = (
      <div className={`dash ${styles.state}`} data-theme="light">
        <div className={`${c.card} ${styles.stateCard}`} role="status">
          <Mascot size={110} mood="think" />
          <p>{t('dashboard.loading')}</p>
        </div>
      </div>
    )
  } else if (user === null) {
    // Definitely not logged in
    body = (
      <div className={`dash ${styles.state}`} data-theme="light">
        <div className={`${c.card} ${styles.stateCard}`}>
          <Mascot size={110} mood="wave" />
          <p>{t('dashboard.loginPrompt')}</p>
          <Link to="/login" className={c.cta}>{t('navbar.login')}</Link>
        </div>
      </div>
    )
  } else {
    body = (
      <DashboardView
        stats={stats}
        activity={activity}
        achievements={achievements}
        performance={performance}
        rounds={rounds}
        answers={answers}
        arInsights={arInsights}
        moduleStars={moduleStars}
        family={family}
        status={status}
        error={error}
        selectedYear={selectedYear}
        yearOptions={yearOptions}
        onYearChange={handleYearChange}
        onRetry={handleRetry}
        onOpenResults={handleOpenResults}
        answersLoaded={answersLoaded}
        displayName={firstName}
        avatarUrl={user?.photoURL}
        who={user?.email || user?.uid}
        tab={tab}
        onTabChange={onTabChange}
        people={<LinkParentCard />}
      />
    )
  }

  return (
    <div className={styles.screen} style={{ '--nav-extra': `${navExtra}px` }}>
      <VideoBackground />
      {body}
    </div>
  )
}
