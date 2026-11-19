import { useContext, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  FaStar, FaRegStar, FaGlobeEurope, FaMap, FaCamera, FaArrowRight, FaChartLine, FaClock, FaGamepad,
  FaThumbsUp, FaHandsHelping, FaInfoCircle,
} from 'react-icons/fa'
import Mascot from '../../components/Mascot/Mascot'
import ProgressMap from '../ProgressMap'
import { SUBJECT_ICON_IMAGES } from '../../data/subjectIcons'
import { gameStrengthsAndGrowth, suggestNextGames } from '../../ar/core/recommend'
import TabBar from './TabBar'
import { ReadOnlyContext } from './context'
import { SUBJECT_KEYS, MODULE_KEYS, SUBJECT_META, MODULE_META, moduleName, subjectName, worldName, fmtMs } from './helpers'
import c from './common.module.css'
import p from './ProgressTab.module.css'

function StarRow({ n, max = 3 }) {
  return (
    <span className={c.stars} aria-hidden="true">
      {Array.from({ length: max }, (_, i) => (i < n
        ? <FaStar key={i} className={c.starOn} />
        : <FaRegStar key={i} className={c.starOff} />))}
    </span>
  )
}

function Worlds({ moduleStars }) {
  const { t } = useTranslation()
  const readOnly = useContext(ReadOnlyContext)
  const Tile = readOnly ? 'div' : Link
  return (
    <div className={p.worlds}>
      {SUBJECT_KEYS.map((sub, si) => {
        const known = moduleStars != null
        const total = MODULE_KEYS.reduce((sum, mod) => sum + (Number(moduleStars?.[`${mod}_${sub}`]) || 0), 0)
        return (
          <Motion.section
            key={sub}
            className={`${c.card} ${p.world}`}
            style={{ '--w': SUBJECT_META[sub].color }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.08, duration: 0.35 }}
            aria-labelledby={`sd-world-${sub}`}
          >
            <header className={p.worldHead}>
              <img className={p.worldArt} src={SUBJECT_ICON_IMAGES[sub]} alt="" />
              <h3 id={`sd-world-${sub}`} className={p.worldName}>{worldName(t, sub)}</h3>
              <span className={p.worldStars}>
                <FaStar aria-hidden="true" /> {known ? <>{total}<small>/12</small></> : '—'}
                <span className={c.srOnly}>{t('studentDash.starsOf', 'stars out of {{n}}', { n: 12 })}</span>
              </span>
            </header>
            <div className={p.tiles}>
              {MODULE_KEYS.map((mod) => {
                const n = Math.max(0, Math.min(3, Number(moduleStars?.[`${mod}_${sub}`]) || 0))
                const { Icon, color } = MODULE_META[mod]
                const name = moduleName(t, mod)
                return (
                  <Tile
                    key={mod}
                    {...(readOnly ? {} : { to: `/module/${mod}/${sub}` })}
                    className={p.tile}
                    data-stars={n}
                    style={{ '--m': color }}
                    aria-label={known
                      ? t('studentDash.tileLabel', '{{module}} in {{subject}}: {{n}} of 3 stars. Play', { module: name, subject: subjectName(t, sub), n })
                      : `${name} · ${subjectName(t, sub)}`}
                  >
                    <span className={p.tileIcon} aria-hidden="true"><Icon /></span>
                    <span className={p.tileName}>{name}</span>
                    {known && <StarRow n={n} />}
                  </Tile>
                )
              })}
            </div>
          </Motion.section>
        )
      })}
    </div>
  )
}

function GameRow({ g }) {
  const { t } = useTranslation()
  return (
    <li className={p.gameRow}>
      <span className={p.gameName}>{g.title || g.gameId}</span>
      <span className={p.gameAcc}>{g.accuracyPct}%</span>
      <span className={p.gameTime} title={t('studentDash.camera.medianTitle', 'Median thinking time')}>{fmtMs(g.medianLatencyMs)}</span>
    </li>
  )
}

function CameraGames({ arInsights }) {
  const { t } = useTranslation()
  const readOnly = useContext(ReadOnlyContext)
  const overall = arInsights?.overall
  const hasData = Boolean(overall?.trials)
  const { strengths, growth } = useMemo(() => gameStrengthsAndGrowth(arInsights), [arInsights])
  const suggestions = useMemo(() => suggestNextGames(arInsights, 4), [arInsights])

  if (!hasData) {
    return (
      <div className={`${c.card} ${c.empty}`}>
        <Mascot size="clamp(50px, 16vh, 140px)" mood="idle" />
        <h3>{t('studentDash.camera.emptyTitle', 'Move and learn!')}</h3>
        <p>{t('studentDash.camera.empty', 'No camera games played yet. Accuracy and time for each task will show up here once one is played.')}</p>
        {!readOnly && <Link to="/games/ar" className={c.soft}><FaCamera aria-hidden="true" /> {t('studentDash.camera.go', 'Go to Camera Games')}</Link>}
      </div>
    )
  }

  return (
    <div className={`${c.card} ${p.camera}`}>
      <div className={p.cameraHead}>
        <h3 className={c.cardTitle}><FaCamera aria-hidden="true" /> {t('studentDash.camera.title', 'Camera Games Report')}</h3>
        <Link to="/games/ar/insights" className={p.more}>{t('studentDash.camera.full', 'Full report')} <FaArrowRight aria-hidden="true" /></Link>
      </div>
      <div className={`${c.scroll} ${p.cameraBody}`}>
        <div className={p.cameraStats}>
          <div><FaChartLine aria-hidden="true" /><b>{overall.comprehensionPct ?? '—'}%</b><span>{t('studentDash.camera.understanding', 'Understanding')}</span><small>{t('studentDash.camera.turns', '{{n}} turns', { n: overall.trials })}</small></div>
          <div><FaClock aria-hidden="true" /><b>{fmtMs(overall.medianLatencyMs)}</b><span>{t('studentDash.camera.thinking', 'Thinking time')}</span><small>{t('studentDash.camera.median', 'Median, per turn')}</small></div>
          <div><FaGamepad aria-hidden="true" /><b>{arInsights.perGame?.length ?? 0}</b><span>{t('studentDash.camera.played', 'Games played')}</span><small>{t('studentDash.camera.minutes', '{{n}} min', { n: overall.minutesPlayed })}</small></div>
        </div>
        <div className={p.cameraLists}>
          <div>
            <h4 className={p.good}><FaThumbsUp aria-hidden="true" /> {t('studentDash.camera.well', 'Doing well')}</h4>
            {strengths.length ? <ul>{strengths.map((g) => <GameRow key={g.gameId} g={g} />)}</ul> : <p className={c.muted}>{t('studentDash.camera.more', 'Play a task a few more times to see this.')}</p>}
          </div>
          <div>
            <h4 className={p.grow}><FaHandsHelping aria-hidden="true" /> {t('studentDash.camera.practice', 'Needs more practice')}</h4>
            {growth.length ? <ul>{growth.map((g) => <GameRow key={g.gameId} g={g} />)}</ul> : <p className={c.muted}>{t('studentDash.camera.more', 'Play a task a few more times to see this.')}</p>}
          </div>
        </div>
        {suggestions.length > 0 && (
          <div>
            <h4 className={p.next}>{t('studentDash.camera.next', 'Try next')}</h4>
            <div className={p.chips}>
              {suggestions.map((sg) => (
                <Link key={sg.gameId} to={`/games/ar/${sg.gameId}`} title={sg.reason} className={p.chip}>
                  {sg.icon && <sg.icon aria-hidden="true" />} {sg.title}
                </Link>
              ))}
            </div>
          </div>
        )}
        <p className={p.note}>
          <FaInfoCircle aria-hidden="true" />
          {t('studentDash.camera.note', 'Descriptions of in-game behaviour over the last 30 days, not a diagnosis. "Needs more practice" is where the next session is worth spending, kept separate from how fast a turn was taken.')}
        </p>
      </div>
    </div>
  )
}

export default function ProgressTab({ moduleStars, achievements, stats, arInsights, disableProgressMapPersistence }) {
  const { t } = useTranslation()
  const [view, setView] = useState('worlds')
  const views = [
    { key: 'worlds', label: t('studentDash.progress.worlds', 'Worlds'), Icon: FaGlobeEurope },
    { key: 'map', label: t('studentDash.progress.map', 'Map'), Icon: FaMap },
    { key: 'camera', label: t('studentDash.progress.camera', 'Camera'), Icon: FaCamera },
  ]

  return (
    <div className={c.panel}>
      <TabBar variant="seg" tabs={views} active={view} onChange={setView} idPrefix="sd-progress" label={t('studentDash.progress.views', 'Progress views')} className={p.seg} />
      <div
        role="tabpanel"
        id={`sd-progress-panel-${view}`}
        aria-labelledby={`sd-progress-tab-${view}`}
        className={p.view}
      >
        {view === 'worlds' && <Worlds moduleStars={moduleStars} />}
        {view === 'map' && (
          <div className={`${c.card} ${p.mapCard}`}>
            <ProgressMap achievements={achievements} stats={stats} disablePersistence={disableProgressMapPersistence} />
          </div>
        )}
        {view === 'camera' && <CameraGames arInsights={arInsights} />}
      </div>
    </div>
  )
}
