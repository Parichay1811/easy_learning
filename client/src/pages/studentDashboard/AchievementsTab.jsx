import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { FaLock, FaBook, FaGamepad, FaFire, FaBolt, FaMagic, FaTrophy, FaTimes, FaMedal, FaSeedling } from 'react-icons/fa'
import Mascot from '../../components/Mascot/Mascot'
import { isGrowth, badgeName, badgeDesc, badgeEvidence, badgeIcon } from '../../components/journey/words'
import { sfx } from '../../utils/sounds'
import { fmtDay, isRecent, readSeenBadges, writeSeenBadges } from './helpers'
import { ReadOnlyContext } from './context'
import c from './common.module.css'
import a from './AchievementsTab.module.css'

// Growth badges (contract §2: for how a learner learns, each with its evidence) sit after the learning ones.
const CAT_ORDER = ['learning', 'growth', 'games', 'streak', 'xp', 'special']
const CAT_ICON = { learning: FaBook, growth: FaSeedling, games: FaGamepad, streak: FaFire, xp: FaBolt, special: FaMagic }

const achName = badgeName
const achDesc = badgeDesc
const achIcon = (ach) => (isGrowth(ach) ? badgeIcon(ach) : ach.icon)
function catName(t, cat) {
  if (cat === 'growth') return t('journey.growth.category', 'Growth')
  return t(`dashboard.achievements.categories.${cat}`, { defaultValue: cat })
}

function BadgeDialog({ ach, fresh, onClose }) {
  const { t, i18n } = useTranslation()
  const closeRef = useRef(null)
  useEffect(() => {
    const back = document.activeElement
    closeRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      if (e.key === 'Tab') { e.preventDefault(); closeRef.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); back?.focus?.() }
  }, [onClose])
  const CatIcon = CAT_ICON[ach.category] || FaMedal
  return createPortal(
    <div className="dash" data-theme="light">
      <Motion.div
        className={a.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <Motion.div
          className={a.dialog}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sd-badge-name"
          aria-describedby="sd-badge-desc"
          initial={{ scale: 0.8, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        >
          <div className={a.spot} data-earned={ach.earned || undefined} aria-hidden="true">
            <span className={a.spotRays} />
            <span className={a.spotMedal}>{achIcon(ach) || '🏅'}</span>
            {!ach.earned && <span className={a.spotLock}><FaLock /></span>}
          </div>
          {fresh && <span className={a.newTag}>{t('studentDash.badges.new', 'NEW')}</span>}
          <h3 id="sd-badge-name" className={a.dName}>{achName(t, ach)}</h3>
          <p id="sd-badge-desc" className={a.dDesc}>{achDesc(t, ach)}</p>
          {ach.earned && badgeEvidence(t, ach) && (
            <p className={a.dEvidence} data-evidence="">
              <b>{t('journey.growth.evidence', 'How you earned it:')}</b> {badgeEvidence(t, ach)}
            </p>
          )}
          <p className={a.dMeta}>
            <span className={c.pill} style={{ background: 'var(--d-grape-soft)', color: 'var(--d-grape-ink)' }}>
              <CatIcon aria-hidden="true" /> {catName(t, ach.category)}
            </span>
            {ach.earned && ach.earnedAt
              ? <span className={c.pill} style={{ background: 'var(--d-grass-soft)', color: 'var(--d-grass-ink)' }}>{t('dashboard.achievements.earnedOn', { date: fmtDay(ach.earnedAt, i18n.language) })}</span>
              : (ach.earned || Number.isFinite(ach.xp)) && <span className={c.pill} style={{ background: 'var(--d-sun-soft)', color: 'var(--d-sun-ink)' }}>{ach.earned ? t('studentDash.badges.earned', 'Earned') : t('dashboard.achievements.xpReward', { xp: ach.xp })}</span>}
          </p>
          <button ref={closeRef} type="button" className={c.soft} onClick={onClose}>
            <FaTimes aria-hidden="true" /> {t('dashboard.progressMap.close')}
          </button>
        </Motion.div>
      </Motion.div>
    </div>,
    document.body,
  )
}

export default function AchievementsTab({ achievements, now, who, isNew }) {
  const { t } = useTranslation()
  const readOnly = useContext(ReadOnlyContext)
  const [openId, setOpenId] = useState(null)

  const list = useMemo(() => {
    const rank = (cat) => { const i = CAT_ORDER.indexOf(cat); return i < 0 ? 99 : i }
    return [...achievements].sort((x, y) => rank(x.category) - rank(y.category))
  }, [achievements])
  const earned = list.filter((x) => x.earned).length

  // Badges earned in the last few days wear a NEW tag; the first time one is
  // revealed here it also gets a star sound (once per badge, remembered).
  const [seen] = useState(() => readSeenBadges(who))
  const recentIds = useMemo(() => list.filter((x) => x.earned && isRecent(x.earnedAt, now)).map((x) => x.id), [list, now])
  const firstFresh = list.findIndex((x) => recentIds.includes(x.id) && !seen.has(x.id))
  const freshKey = recentIds.filter((id) => !seen.has(id)).join(',')
  useEffect(() => {
    if (!freshKey || readOnly) return undefined
    const id = setTimeout(() => {
      sfx.star()
      writeSeenBadges(who, new Set([...seen, ...freshKey.split(',')]))
    }, 350 + Math.max(0, firstFresh) * 50)
    return () => clearTimeout(id)
  }, [freshKey, firstFresh, seen, who, readOnly])

  const open = list.find((x) => x.id === openId)
  const pct = list.length ? Math.round((earned / list.length) * 100) : 0

  if (!list.length) {
    return (
      <div className={`${c.card} ${c.empty}`}>
        <Mascot size="clamp(50px, 16vh, 140px)" mood="idle" />
        <h3>{t('studentDash.badges.title', 'Badge cabinet')}</h3>
        <p>{t('dashboard.achievements.empty')}</p>
        {!readOnly && <Link to="/home" className={c.cta}>{t('studentDash.playFirst', 'Play your first game')}</Link>}
      </div>
    )
  }

  return (
    <div className={c.panel}>
      <section className={`${c.card} ${a.head}`} aria-labelledby="sd-badges-title">
        <span className={a.trophy} aria-hidden="true"><FaTrophy /></span>
        <div className={a.headText}>
          <h2 id="sd-badges-title" className={a.title}>
            {t('studentDash.badges.count', '{{n}} of {{total}} badges', { n: earned, total: list.length })}
          </h2>
          <p className={a.sub}>
            {isNew || !earned
              ? t('studentDash.badges.startHint', 'Play your first game to win your first badge!')
              : t('studentDash.badges.hint', 'Tap a badge to see how you won it.')}
          </p>
        </div>
        <div className={a.bar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={t('studentDash.badges.title', 'Badge cabinet')}>
          <Motion.span initial={{ scaleX: 0 }} animate={{ scaleX: pct / 100 }} transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }} />
        </div>
        {(isNew || !earned) && !readOnly && <Link to="/home" className={`${c.cta} ${a.headCta}`}>{t('studentDash.playFirst', 'Play your first game')}</Link>}
      </section>

      <ul className={`${c.card} ${a.cabinet}`} aria-label={t('studentDash.badges.title', 'Badge cabinet')}>
        {list.map((ach, i) => {
          const CatIcon = CAT_ICON[ach.category] || FaMedal
          const fresh = recentIds.includes(ach.id)
          const name = achName(t, ach)
          return (
            <Motion.li
              key={ach.id}
              className={a.cell}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.12 + i * 0.05, type: 'spring', stiffness: 420, damping: 20 }}
            >
              <button
                type="button"
                className={a.badge}
                data-earned={ach.earned || undefined}
                data-fresh={fresh || undefined}
                aria-haspopup="dialog"
                aria-label={`${name}: ${ach.earned ? t('studentDash.badges.earned', 'Earned') : t('studentDash.badges.locked', 'Not won yet')}${fresh ? ` (${t('studentDash.badges.new', 'NEW')})` : ''}`}
                onClick={() => setOpenId(ach.id)}
              >
                <span className={a.medal} aria-hidden="true">
                  {ach.earned ? <span className={a.emoji}>{achIcon(ach)}</span> : <FaLock className={a.lock} />}
                  <span className={a.cat}><CatIcon /></span>
                  {fresh && <span className={a.newTag}>{t('studentDash.badges.new', 'NEW')}</span>}
                </span>
                <span className={a.name} aria-hidden="true">{name}</span>
              </button>
            </Motion.li>
          )
        })}
      </ul>

      <AnimatePresence>
        {open && <BadgeDialog key={open.id} ach={open} fresh={recentIds.includes(open.id)} onClose={() => setOpenId(null)} />}
      </AnimatePresence>
    </div>
  )
}
