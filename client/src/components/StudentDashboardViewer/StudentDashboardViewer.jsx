import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaTimes, FaEye } from 'react-icons/fa'
import DashboardView from '../../pages/DashboardView'
import meadow from '../../assets/dash/meadow.webp'
import styles from './StudentDashboardViewer.module.css'

// Read-only "view as student" dashboard, used by the admin and super-admin
// dashboards to show a student's real Learnigo dashboard (same data/UI the
// student sees) once that student is confirmed to exist in the learning DB.
// Full screen over the admin page; the tab is kept in local state (not the
// admin page's URL) and there is no "My people" tab.
export default function StudentDashboardViewer({ apiBase, token, displayName, onClose }) {
  const { t } = useTranslation()
  const thisYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(thisYear)
  const yearOptions = Array.from({ length: 5 }, (_, i) => thisYear - i)
  const closeRef = useRef(null)
  const overlayRef = useRef(null)

  const [data, setData] = useState({
    stats: null, activity: [], achievements: [], performance: [], rounds: [], answers: [], moduleStars: null,
    status: 'idle', error: null, answersLoaded: false,
  })

  const fetchJSON = useCallback(async (path) => {
    const r = await fetch(`${apiBase}${path}`, { headers: { Authorization: `Bearer ${token}` } })
    const json = await r.json()
    if (!json.success) throw new Error(json.message || 'Request failed')
    return json.data
  }, [apiBase, token])

  const loadAll = useCallback(async (year) => {
    setData(d => ({ ...d, status: 'loading', error: null }))
    try {
      const [stats, activity, achievements, performance, rounds] = await Promise.all([
        fetchJSON('/stats'),
        fetchJSON(`/activity?year=${year}`),
        fetchJSON('/achievements'),
        fetchJSON('/performance?days=30'),
        fetchJSON('/rounds?limit=30'),
      ])
      setData(d => ({ ...d, stats, activity, achievements, performance, rounds, status: 'succeeded' }))
    } catch (err) {
      setData(d => ({ ...d, status: 'failed', error: err.message }))
    }
    // Stars per skill are a nice extra: never fail the whole view for them.
    try {
      const moduleStars = await fetchJSON('/module-stars')
      setData(d => ({ ...d, moduleStars: moduleStars || null }))
    } catch { /* no stars endpoint for this viewer: stars show as "—" */ }
  }, [fetchJSON])

  // Runs once on mount with the current year; `handleYearChange` below
  // already handles later year switches with its own targeted fetch, so
  // `selectedYear` is deliberately not a dependency here.
  useEffect(() => { loadAll(selectedYear) }, [loadAll]) // eslint-disable-line react-hooks/exhaustive-deps

  // Escape closes; the page behind does not scroll while this is open.
  useEffect(() => {
    closeRef.current?.focus()
    // A badge's spotlight (a dialog of its own) closes first.
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      const inner = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].some((d) => d !== overlayRef.current)
      if (!inner) onClose?.()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  async function handleYearChange(year) {
    setSelectedYear(year)
    try {
      const activity = await fetchJSON(`/activity?year=${year}`)
      setData(d => ({ ...d, activity }))
    } catch (err) {
      setData(d => ({ ...d, status: 'failed', error: err.message }))
    }
  }

  async function handleOpenResults() {
    try {
      const answers = await fetchJSON('/answers?limit=50')
      setData(d => ({ ...d, answers }))
    } catch { /* results panel just stays empty */ }
    setData(d => ({ ...d, answersLoaded: true }))
  }

  return (
    <div ref={overlayRef} className={styles.overlay} style={{ backgroundImage: `url(${meadow})` }} role="dialog" aria-modal="true" aria-label={`${displayName || 'Student'} – dashboard`}>
      <div className={styles.bar}>
        <span className={styles.who}><FaEye aria-hidden="true" /> {displayName || 'Student'}</span>
        <button ref={closeRef} type="button" className={styles.close} onClick={onClose}>
          <FaTimes aria-hidden="true" /> {t('dashboard.progressMap.close')}
        </button>
      </div>
      <div className={styles.body}>
        <DashboardView
          stats={data.stats}
          activity={data.activity}
          achievements={data.achievements}
          performance={data.performance}
          rounds={data.rounds}
          answers={data.answers}
          moduleStars={data.moduleStars}
          status={data.status}
          error={data.error}
          selectedYear={selectedYear}
          yearOptions={yearOptions}
          onYearChange={handleYearChange}
          onRetry={() => loadAll(selectedYear)}
          onOpenResults={handleOpenResults}
          answersLoaded={data.answersLoaded}
          displayName={displayName}
          avatarUrl={null}
          who={`viewer-${displayName || 'student'}`}
          disableProgressMapPersistence
          readOnly
        />
      </div>
    </div>
  )
}
