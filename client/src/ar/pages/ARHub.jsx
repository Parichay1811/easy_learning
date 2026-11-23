/**
 * The Camera Games hub.
 *
 * Built for children (many with learning differences, motor or attention
 * difficulties), teenagers and adults, often with a parent or therapist
 * beside them. In order of importance on the page:
 *
 * 1. **What to play next** — one banner, one big Play button (HubHero).
 * 2. **The groups** — a real tab list (GroupTabs): one Tab stop, arrow keys,
 *    the chosen group unmistakable without colour.
 * 3. **The games** of the chosen group — ALL of them, in a calm vertical list
 *    of cards (GameCard), each with one obvious Play button and a read-aloud
 *    button.
 *
 * The hub used to fit one screen by paging the games behind dots. For this
 * audience that hid games (a child who does not understand the dots never sees
 * page two) and made the cards tiny; one scrolling column is a gesture
 * everyone knows, reaches every game with Tab in reading order, and lets the
 * cards be big enough to read and hit. The header (Back, points, progress,
 * settings) stays put above the scrolling part.
 *
 * Motion is small and purposeful (cards rise in, a lift on hover, a slow
 * glow on the "next up" card) and all of it stops under the learner's "less
 * movement" setting or the device's reduced-motion setting.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FaArrowLeft, FaCog, FaChartLine, FaCamera, FaGamepad, FaVolumeUp } from 'react-icons/fa'
import { GROUPS, GROUP_BY_ID, DOMAIN_LABELS } from '../catalog/groups'
import { GAMES, gamesInGroup } from '../catalog/games'
import { prewarmVision } from '../core/vision'
import { flushPendingSessions, fetchRemoteJourney } from '../core/telemetry'
import { isCalibrated, loadProfile } from '../core/profile'
import { journeySnapshot, mergeRemoteJourney, hasJourney, LEVELS } from '../core/journey'
import { haptic } from '../core/feedback'
import { speak } from '../core/tts'
import { sfx } from '../../utils/sounds'
import { useCalmMotion } from '../../utils/useCalmMotion'
import { tGroup, tDomain, tRecommend } from '../core/arText'
import SettingsSheet from '../core/SettingsSheet'
import LanguageSwitcher from '../../components/LanguageSwitcher/LanguageSwitcher'
import VideoBackground from '../../components/VideoBackground/VideoBackground'
import HubHero from '../hub/HubHero'
import GroupTabs from '../hub/GroupTabs'
import GameCard from '../hub/GameCard'
import { groupLine, PANEL_ID, tabId } from '../hub/hubText'
import { useBalancedColumns, useMedia } from '../hub/layout'
import styles from './ARHub.module.css'

export default function ARHub() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const calm = useCalmMotion()
  const [groupId, setGroupId] = useState(() => {
    try {
      return localStorage.getItem('ar_last_group') || 'body'
    } catch {
      return 'body'
    }
  })
  const [showSettings, setShowSettings] = useState(false)
  // Bumped when stored progress changes under us (a server merge), so the
  // journey figures below are recomputed rather than left stale.
  const [revision, setRevision] = useState(0)
  const settingsBtnRef = useRef(null)
  const gridWrapRef = useRef(null)
  // The live dog gets a place beside the banner only where there is room for
  // it without covering anything.
  const roomForDog = useMedia('(min-width: 1280px) and (min-height: 700px)')

  const group = GROUP_BY_ID[groupId] || GROUPS[0]
  const games = useMemo(() => gamesInGroup(group.id), [group.id])
  const cols = useBalancedColumns(gridWrapRef, games.length)
  const calibrated = isCalibrated()

  // These read localStorage, which the linter cannot see, so `revision` is a
  // deliberate cache-buster rather than a real dependency: it is bumped when
  // stored progress changes and is the only thing that should invalidate them.
  // `i18n.language` IS a real dependency: both snapshots carry translated
  // labels (rank, recommendation reason), which must follow a language switch.
  /* eslint-disable react-hooks/exhaustive-deps */
  const journey = useMemo(() => journeySnapshot(GAMES), [revision, i18n.language])
  const recommended = useMemo(() => pickRecommended(), [revision, i18n.language])
  /* eslint-enable react-hooks/exhaustive-deps */

  const open = useCallback(
    (gameId, level) => {
      haptic('tap')
      navigate(level ? `/games/ar/${gameId}?level=${level}` : `/games/ar/${gameId}`)
    },
    [navigate]
  )

  // Warm the models while the child is choosing, so pressing Play goes
  // straight to the camera instead of a two-second model download.
  useEffect(() => {
    const kinds = new Set(['hand'])
    for (const g of games) {
      if (['pose', 'cue', 'bilateral', 'mission'].includes(g.engine)) kinds.add('pose')
      if (g.config?.wholeBody) kinds.add('pose')
    }
    const timer = window.setTimeout(() => void prewarmVision([...kinds]), 350)
    return () => window.clearTimeout(timer)
  }, [games])

  // Anything the network ate last session gets another go now — and the journey
  // is pulled back from the server, so a child who changes device or clears
  // their browser does not lose their levels. The merge takes the better of the
  // two, so this can never cost them progress.
  useEffect(() => {
    let live = true
    const sync = async () => {
      await flushPendingSessions()
      const remote = await fetchRemoteJourney()
      if (live && remote && mergeRemoteJourney(remote)) setRevision((n) => n + 1)
    }
    void sync()
    return () => {
      live = false
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('ar_last_group', group.id)
    } catch {
      /* private mode */
    }
  }, [group.id])

  // The hub scrolls inside itself (under a header that stays put), so the
  // page behind it must not.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // Escape closes the settings sheet, or else goes back to the Game Zone.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return
      if (showSettings) setShowSettings(false)
      else navigate('/games')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, showSettings])

  // Keyboard and switch users land inside the settings sheet when it opens and
  // back on the Settings button when it closes.
  const sheetWasOpen = useRef(false)
  useEffect(() => {
    if (showSettings) {
      sheetWasOpen.current = true
      const id = requestAnimationFrame(() => {
        document.querySelector('[role="dialog"] button')?.focus()
      })
      return () => cancelAnimationFrame(id)
    }
    if (sheetWasOpen.current) {
      sheetWasOpen.current = false
      settingsBtnRef.current?.focus()
    }
    return undefined
  }, [showSettings])

  const grTitle = tGroup(group.id, 'title', group.title)
  const grBlurb = tGroup(group.id, 'blurb', group.blurb)
  const grLine = groupLine(group.id)
  const st = journey.byGroup[group.id] || { games: games.length, played: 0, levels: 0, possible: 0 }
  // The card that matches the big banner: the set-up until it is done.
  const nextId = calibrated ? recommended?.game.id : 'setup-space'
  const pointsName = journey.rank.next
    ? t('ar.hub.pointsTitleWithNext', '{{points}} points · {{rank}} · {{toNext}} to {{next}}', {
        points: journey.points,
        rank: journey.rank.name,
        toNext: journey.rank.toNext,
        next: journey.rank.next.name,
      })
    : t('ar.hub.pointsTitle', '{{points}} points · {{rank}}', { points: journey.points, rank: journey.rank.name })

  return (
    <div className={styles.hub} data-group={group.id} data-calm={calm ? '' : undefined}>
      <VideoBackground />
      <div className={styles.overlay} aria-hidden />
      <div className={styles.glow} aria-hidden />

      <header className={styles.head}>
        <div className={styles.headIn}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => {
              sfx.back()
              navigate('/games')
            }}
            aria-label={t('ar.hub.back', 'Back')}
            data-sound="none"
          >
            <FaArrowLeft aria-hidden />
            <span className={styles.wideLabel}>{t('ar.hub.back', 'Back')}</span>
          </button>
          <div className={styles.titleBlock}>
            <span className={styles.titleIcon} aria-hidden>
              <FaGamepad />
            </span>
            <span className={styles.titleText}>
              <h1 className={styles.title}>{t('ar.hub.title', 'Camera Games')}</h1>
              <span className={styles.subtitle}>
                {t('ar.hub.subtitle', 'Move in front of the camera to play')}
              </span>
            </span>
          </div>
          <div className={styles.headRight}>
            {/* Only when the hub stands alone: under the site navbar, which
                has its own language switch, this one is hidden. */}
            <span className={styles.hubLang}>
              <LanguageSwitcher />
            </span>
            {/* Points and rank: the one number that is the child's alone, and a
                door into their own progress screen. */}
            <button
              type="button"
              className={styles.pointsChip}
              onClick={() => navigate('/games/ar/insights')}
              aria-label={t('ar.hub.pointsAria', '{{points}} points, {{rank}}. See your progress', {
                points: journey.points,
                rank: journey.rank.name,
                count: journey.points,
              })}
              title={pointsName}
            >
              <span className={styles.rankIcon} aria-hidden>
                <journey.rank.icon />
              </span>
              <span className={styles.pointsNum}>{journey.points}</span>
              <span className={styles.pointsWord}>{t('ar.hub.pointsWord', 'points', { count: journey.points })}</span>
              <span
                className={styles.rankBar}
                style={{ '--p': `${Math.round(journey.rank.progress * 100)}%` }}
                aria-hidden
              />
            </button>
            <button
              type="button"
              className={`${styles.headBtn} ${styles.progressBtn}`}
              onClick={() => navigate('/games/ar/insights')}
              aria-label={t('ar.hub.progress', 'Progress')}
              title={t('ar.hub.progressTitle', 'Progress and analysis')}
            >
              <FaChartLine aria-hidden />
              <span className={styles.wideLabel}>{t('ar.hub.progress', 'Progress')}</span>
            </button>
            <button
              type="button"
              ref={settingsBtnRef}
              className={styles.headBtn}
              onClick={() => setShowSettings(true)}
              aria-label={t('ar.hub.settingsLabel', 'Settings')}
              aria-haspopup="dialog"
            >
              <FaCog aria-hidden />
              <span className={styles.wideLabel}>{t('ar.hub.settingsLabel', 'Settings')}</span>
            </button>
          </div>
        </div>
      </header>

      <div className={styles.scroller}>
        <main className={styles.inner}>
          <HubHero calibrated={calibrated} recommended={recommended} onOpen={open} showDog={roomForDog} />

          <section className={styles.groups} aria-label={t('ar.hub.groupsAriaLabel', 'Game groups')}>
            <div className={styles.tabsWrap}>
              <GroupTabs
                groups={GROUPS}
                selected={group.id}
                onSelect={setGroupId}
                byGroup={journey.byGroup}
              />
            </div>

            <div className={styles.panel} role="tabpanel" id={PANEL_ID} aria-labelledby={tabId(group.id)}>
              <div className={styles.panelHead} data-color={group.color}>
                <span className={styles.panelIcon} aria-hidden>
                  <group.icon />
                </span>
                <div className={styles.panelText}>
                  <h2 className={styles.panelTitle}>{grTitle}</h2>
                  <p className={styles.panelLine}>
                    <strong>{grLine}</strong>
                    <span aria-hidden className={styles.sep}> · </span>
                    <span className={styles.blurb}>{grBlurb}</span>
                  </p>
                  <ul className={styles.stats} aria-label={t('ar.hub.groupStatsLabel', 'This group')}>
                    <li>
                      {games.length === 1
                        ? t('ar.hub.footCountSingular', '{{count}} game', { count: games.length })
                        : t('ar.hub.footCountPlural', '{{count}} games', { count: games.length })}
                    </li>
                    {st.possible > 0 && (
                      <li>
                        {t('ar.hub.groupLevels', '{{levels}} of {{possible}} levels cleared', {
                          levels: st.levels,
                          possible: st.possible,
                        })}
                      </li>
                    )}
                  </ul>
                </div>
                <button
                  type="button"
                  className={styles.panelSpeak}
                  onClick={() => speak(`${grTitle}. ${grLine}. ${grBlurb}.`, { user: true })}
                  aria-label={t('ar.hub.readAloudAria', 'Read {{title}} aloud', { title: grTitle })}
                  title={t('ar.hub.readThisOut', 'Read this out')}
                >
                  <FaVolumeUp aria-hidden />
                </button>
              </div>

              <div className={styles.gridWrap} ref={gridWrapRef}>
                <ul key={group.id} className={styles.grid} style={{ '--cols': cols }} role="list">
                  {games.map((g, i) => (
                    <GameCard key={g.id} game={g} index={i} onOpen={open} isNext={g.id === nextId} />
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <footer className={styles.foot}>
            <span className={styles.footNote}>
              <FaCamera aria-hidden /> {t('ar.hub.footRunsOnDevice', 'Runs on this device · no video is recorded')}
            </span>
            <span className={styles.footNote}>
              {journey.levelsCleared > 0
                ? t('ar.hub.footLevelsCleared', '{{count}} levels cleared', { count: journey.levelsCleared })
                : t('ar.hub.footGamesInAll', '{{count}} games in all', { count: GAMES.length })}
            </span>
          </footer>
        </main>
      </div>

      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
    </div>
  )
}

/**
 * What to suggest next. Deliberately simple and explainable — an adult should
 * be able to see why the app suggested this, and disagree with it.
 *
 * Journey-first, because a half-walked path is the strongest pull there is: a
 * child returning to the app wants to carry on, not to be handed something new.
 */
function pickRecommended() {
  const profile = loadProfile()
  const j = profile.journey || { byGame: {} }
  const played = (id) => j.byGame?.[id]
  const levelOf = (id) => played(id)?.level ?? 1

  // 1. The most recently played game that still has levels to go.
  const inProgress = GAMES.filter((g) => {
    const st = played(g.id)
    if (!st?.plays || !hasJourney(g)) return false
    const cleared = Object.keys(st.cleared || {}).length
    return cleared < LEVELS
  })
  if (inProgress.length) {
    const g = inProgress[inProgress.length - 1]
    return { game: g, level: levelOf(g.id), reason: tRecommend('carryOn', 'Carry on your journey') }
  }

  // 2. The weakest capability estimate with at least a little evidence, matched
  //    to a featured game that trains it.
  const caps = Object.entries(profile.capabilities || {})
    .filter(([, v]) => v.n >= 5)
    .sort((a, b) => a[1].value - b[1].value)
  for (const [domain] of caps) {
    const candidate = GAMES.find((g) => g.featured && (g.domains || []).includes(domain))
    if (candidate) {
      return {
        game: candidate,
        level: levelOf(candidate.id),
        reason: tRecommend('practising', 'Practising {{domain}}', {
          domain: tDomain(domain, DOMAIN_LABELS[domain] || domain).toLowerCase(),
        }),
      }
    }
  }

  // 3. Nothing played yet — start with something that always works.
  const unplayed = GAMES.filter((g) => g.featured && !played(g.id) && hasJourney(g))
  if (unplayed.length) return { game: unplayed[0], level: 1, reason: tRecommend('tryNew', 'Try something new') }

  // 4. Every journey finished. Offer the hardest level of a favourite rather
  //    than nothing at all.
  const most = GAMES.filter((g) => played(g.id)).sort(
    (a, b) => (played(b.id).plays || 0) - (played(a.id).plays || 0)
  )[0]
  return most ? { game: most, level: LEVELS, reason: tRecommend('champion', 'Play a champion level') } : null
}

