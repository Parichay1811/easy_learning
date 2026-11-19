import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { motion as Motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import styles from './ProgressMap.module.css'
import { FaBookOpen, FaPencilAlt, FaMicrophone, FaStar, FaRegStar, FaLock } from 'react-icons/fa'
import { MdHearing } from 'react-icons/md'

// ── Static data ─────────────────────────────────────────────────────────────────

const SUBJECTS = [
  { key: 'english', label: 'English', color: '#8b5cf6' },
  { key: 'maths',   label: 'Maths',   color: '#339af0' },
  { key: 'science', label: 'Science', color: '#40c057' },
]

const MODULES = [
  { key: 'listen', Icon: MdHearing,    achievementId: 'sharp_ears'     },
  { key: 'read',   Icon: FaBookOpen,   achievementId: 'bookworm'       },
  { key: 'write',  Icon: FaPencilAlt,  achievementId: 'penpal'         },
  { key: 'speak',  Icon: FaMicrophone, achievementId: 'public_speaker' },
]

// 12 ordered levels: english×4 → maths×4 → science×4
const LEVELS = SUBJECTS.flatMap((subj, si) =>
  MODULES.map((mod, mi) => ({
    id:            si * 4 + mi + 1,
    subject:       subj.key,
    subjectLabel:  subj.label,
    module:        mod.key,
    moduleLabel:   mod.key.charAt(0).toUpperCase() + mod.key.slice(1),
    Icon:          mod.Icon,
    color:         subj.color,
    achievementId: mod.achievementId,
  }))
)

// Node positions as % of the map (x: left, y: top), a winding trail.
// Tall maps (phones held upright): levels climb from the bottom to the top.
const VERT_POS = [
  { x: 22, y: 92 }, { x: 58, y: 86 }, { x: 80, y: 76 }, { x: 52, y: 67 },
  { x: 20, y: 58 }, { x: 46, y: 49 }, { x: 78, y: 41 }, { x: 52, y: 32 },
  { x: 20, y: 25 }, { x: 44, y: 15 }, { x: 74, y: 9 },  { x: 84, y: 24 },
]

// Wide maps (landscape): left to right.
const HORIZ_POS = [
  { x: 5,  y: 72 }, { x: 13, y: 32 }, { x: 22, y: 70 }, { x: 31, y: 30 },
  { x: 40, y: 66 }, { x: 49, y: 28 }, { x: 58, y: 66 }, { x: 67, y: 30 },
  { x: 76, y: 70 }, { x: 84, y: 32 }, { x: 91, y: 68 }, { x: 96, y: 34 },
]

function Stars({ count }) {
  return (
    <div className={styles.stars} aria-hidden="true">
      {[0, 1, 2].map(i => (
        <span key={i} className={i < count ? styles.starOn : styles.starOff}>
          {i < count ? <FaStar /> : <FaRegStar />}
        </span>
      ))}
    </div>
  )
}

/**
 * The adventure trail: 12 stops (English, Maths, Science × Listen, Read,
 * Write, Speak). A stop is mastered when its badge is earned; sessions open
 * the next stops. Shown inside the dashboard's Progress tab; it lays itself
 * out tall or wide to match the space it is given.
 */
export default function ProgressMap({ achievements, stats, disablePersistence }) {
  const { t }    = useTranslation()
  const { user } = useAuth()

  // Lay out to the box we are in, not the window.
  const boxRef = useRef(null)
  const [isHoriz, setIsHoriz] = useState(true)
  useEffect(() => {
    const el = boxRef.current
    if (!el) return undefined
    const check = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width && height) setIsHoriz(width > height * 1.15)
    }
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Persist progress to localStorage whenever props change
  const storageKey = `progressMap_${user?.uid || user?.email || 'guest'}`

  useEffect(() => {
    if (disablePersistence) return
    if (!achievements?.length && !stats) return
    try {
      localStorage.setItem(storageKey, JSON.stringify({ achievements, stats, savedAt: Date.now() }))
    } catch { /* quota exceeded — silently skip */ }
  }, [achievements, stats, storageKey, disablePersistence])

  // Load saved data as fallback when live data is absent
  const [saved] = useState(() => {
    if (disablePersistence) return null
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })

  const liveAchievements = useMemo(
    () => (achievements?.length ? achievements : (saved?.achievements ?? [])),
    [achievements, saved]
  )
  const liveStats = useMemo(() => stats ?? saved?.stats ?? {}, [stats, saved])

  const earnedIds = useMemo(
    () => new Set(liveAchievements.filter(a => a.earned).map(a => a.id)),
    [liveAchievements]
  )

  const getLevelStatus = useCallback((level) => {
    if (earnedIds.has(level.achievementId)) return 'mastered'
    const sessions = liveStats?.totalSessions ?? 0
    // First session unlocks the first 2 levels; each subsequent session +1
    const unlocked = Math.min(Math.max(sessions + 1, 1), LEVELS.length)
    if (level.id <= unlocked) return 'active'
    return 'locked'
  }, [earnedIds, liveStats])

  const getLevelStars = useCallback((level) => {
    const s = getLevelStatus(level)
    if (s === 'mastered') return 3
    if (s === 'active') {
      const sessions = liveStats?.totalSessions ?? 0
      return sessions >= level.id * 2 ? 2 : 1
    }
    return 0
  }, [getLevelStatus, liveStats])

  // Current = first active (non-mastered started) level
  const currentLevelId = useMemo(() => {
    const first = LEVELS.find(l => getLevelStatus(l) === 'active')
    return first?.id ?? 1
  }, [getLevelStatus])

  const masteredCount = LEVELS.filter(l => getLevelStatus(l) === 'mastered').length
  const progressPct   = Math.round((masteredCount / LEVELS.length) * 100)
  const positions     = isHoriz ? HORIZ_POS : VERT_POS
  const statusWord = {
    mastered: t('dashboard.progressMap.completed'),
    active: t('dashboard.progressMap.inProgress'),
    locked: t('dashboard.progressMap.locked'),
  }

  return (
    <div className={styles.map}>
      <div className={styles.header}>
        <p className={styles.subtitle}>
          {t('dashboard.progressMap.subtitle', { completed: masteredCount, total: LEVELS.length })}
        </p>
        <div className={styles.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPct}
          aria-label={t('dashboard.progressMap.title')}>
          <Motion.div className={styles.progressFill} initial={{ scaleX: 0 }} animate={{ scaleX: progressPct / 100 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }} />
        </div>
        <span className={styles.progressLabel}>{progressPct}%</span>
      </div>

      <div ref={boxRef} className={styles.field}>
        <svg className={styles.svgLines} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {positions.slice(0, -1).map((pos, i) => {
            const next = positions[i + 1]
            const done = getLevelStatus(LEVELS[i]) === 'mastered'
            return (
              <line
                key={i}
                x1={pos.x} y1={pos.y} x2={next.x} y2={next.y}
                className={done ? styles.pathDone : styles.path}
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
        </svg>

        <ol className={styles.nodes}>
          {LEVELS.map((level, i) => {
            const pos       = positions[i]
            const status    = getLevelStatus(level)
            const stars     = getLevelStars(level)
            const isCurrent = level.id === currentLevelId
            const NodeIcon  = level.Icon
            const name = `${t(`subjectPage.${level.subject}.label`, { defaultValue: level.subjectLabel })} · ${t(`subjectPage.modules.${level.module}.label`, { defaultValue: level.moduleLabel })}`
            return (
              <Motion.li
                key={level.id}
                className={`${styles.nodeWrap} ${isCurrent ? styles.nodeWrapCurrent : ''}`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%`, x: '-50%', y: '-50%' }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.3, ease: 'backOut' }}
                title={name}
              >
                <span className={styles.srOnly}>{`${level.id}. ${name}: ${statusWord[status]}, ${stars}/3`}</span>
                <Stars count={stars} />
                <div className={`${styles.nodeCircle} ${styles['node_' + status]} ${isCurrent ? styles.nodeCurrent : ''}`} style={{ '--nc': level.color }} aria-hidden="true">
                  <span className={styles.nodeIcon}>{status === 'locked' ? <FaLock /> : <NodeIcon />}</span>
                  <span className={styles.nodeNum}>{level.id}</span>
                  {isCurrent && <span className={styles.pulseRing} />}
                </div>
              </Motion.li>
            )
          })}
        </ol>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}><span className={`${styles.dot} ${styles.dotMastered}`} />{statusWord.mastered}</span>
        <span className={styles.legendItem}><span className={`${styles.dot} ${styles.dotActive}`} />{statusWord.active}</span>
        <span className={styles.legendItem}><span className={`${styles.dot} ${styles.dotLocked}`} />{statusWord.locked}</span>
      </div>
    </div>
  )
}
