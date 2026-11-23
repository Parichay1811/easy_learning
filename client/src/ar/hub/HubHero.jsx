/**
 * The first thing on the hub: the one game worth playing next, with one big
 * Play button (or, before the space is set up, the set-up itself).
 *
 * The Play button carries data-companion-look / data-companion-guide: the live
 * companion dog looks at it and, after a while with nothing pressed, points to
 * it. On a wide screen the dog gets its own place beside the banner (a
 * <Mascot> spot), so it never sits on top of anything.
 */
import { useTranslation } from 'react-i18next'
import { FaPlay, FaVolumeUp, FaStar, FaBullseye } from 'react-icons/fa'
import { tileProgress, hasJourney, levelChange, LEVELS } from '../core/journey'
import { speak } from '../core/tts'
import { tGame } from '../core/arText'
import LevelPips from '../core/LevelPips'
import Mascot from '../../components/Mascot/Mascot'
import { levelWords } from './hubText'
import styles from './HubHero.module.css'

export default function HubHero({ calibrated, recommended, onOpen, showDog }) {
  const { t } = useTranslation()

  let content = null
  if (!calibrated) {
    const title = tGame('setup-space', 'title', 'Set Up My Space')
    const sub = t('ar.hub.setupSubtitle', 'Five stretches so every game lands where this child can reach')
    content = (
      <section className={styles.hero} aria-labelledby="arhub-hero-title" data-color="teal" data-hero>
        <div className={styles.grid}>
          <div className={styles.art} aria-hidden>
            <span className={styles.artIcon}>
              <FaBullseye />
            </span>
          </div>
          <div className={styles.text}>
            <p className={styles.eyebrow}>
              <FaStar aria-hidden /> {t('ar.hub.startHere', 'Start here')}
            </p>
            <h2 className={styles.title} id="arhub-hero-title">
              {title}
            </h2>
            <p className={styles.detail}>{sub}</p>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.play}
              onClick={() => onOpen('setup-space')}
              aria-label={t('ar.hub.startGameAria', 'Start {{title}}', { title })}
              data-companion-look
              data-companion-guide
              data-sound="open"
            >
              <FaPlay aria-hidden /> <span>{t('ar.hub.startWord', 'Start')}</span>
            </button>
            <button
              type="button"
              className={styles.speak}
              onClick={() => speak(`${t('ar.hub.startHere', 'Start here')}. ${title}. ${sub}`, { user: true })}
              aria-label={t('ar.hub.readAloudAria', 'Read {{title}} aloud', { title })}
              title={t('ar.hub.readThisOut', 'Read this out')}
            >
              <FaVolumeUp aria-hidden />
            </button>
          </div>
        </div>
      </section>
    )
  } else if (recommended) {
    const { game, level, reason } = recommended
    const title = tGame(game.id, 'title', game.title)
    const journeyOn = hasJourney(game)
    const p = journeyOn ? tileProgress(game) : null
    const n = level || p?.level || 1
    const words = journeyOn
      ? p.complete || n !== p.level
        ? t('ar.hub.levelOf', 'Level {{n}} of {{total}}', { n, total: LEVELS })
        : levelWords(t, p)
      : null
    const change = journeyOn ? levelChange(game, n) : null
    content = (
      <section className={styles.hero} aria-labelledby="arhub-hero-title" data-color={game.color || 'blue'} data-hero>
        <div className={styles.grid}>
          <div className={styles.art} aria-hidden onClick={() => onOpen(game.id, level)}>
            <span className={styles.artIcon}>
              <game.icon />
            </span>
          </div>
          <div className={styles.text}>
            <p className={styles.eyebrow}>
              <FaStar aria-hidden /> {reason}
            </p>
            <h2 className={styles.title} id="arhub-hero-title">
              {title}
            </h2>
            {journeyOn && (
              <div className={styles.level}>
                <span className={styles.pips} aria-hidden>
                  <LevelPips pips={p.pips} size="card" />
                </span>
                <span>{words}</span>
              </div>
            )}
            {change && (
              <p className={styles.detail}>{t('ar.hub.thisLevel', 'This level: {{change}}', { change })}</p>
            )}
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.play}
              onClick={() => onOpen(game.id, level)}
              aria-label={
                journeyOn
                  ? t('ar.hub.playGameAria', 'Play {{title}}, level {{n}} of {{total}}', { title, n, total: LEVELS })
                  : t('ar.hub.startGameAria', 'Start {{title}}', { title })
              }
              data-companion-look
              data-companion-guide
              data-sound="open"
            >
              <FaPlay aria-hidden /> <span>{t('ar.hub.calloutPlay', 'Play')}</span>
              {journeyOn && <span className={styles.playLevel}>{t('ar.hub.levelShort', 'Level {{n}}', { n })}</span>}
            </button>
            <button
              type="button"
              className={styles.speak}
              onClick={() => speak(`${reason}. ${title}. ${words || ''}`, { user: true })}
              aria-label={t('ar.hub.readAloudAria', 'Read {{title}} aloud', { title })}
              title={t('ar.hub.readThisOut', 'Read this out')}
            >
              <FaVolumeUp aria-hidden />
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (!content) return null
  return (
    <div className={`${styles.row} ${showDog ? styles.withDog : ''}`}>
      {content}
      {showDog && (
        <div className={styles.dog}>
          <Mascot size="clamp(110px, 9vw, 150px)" butterfly={false} />
        </div>
      )}
    </div>
  )
}
