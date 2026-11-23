/**
 * One game on the hub.
 *
 * One obvious action: the Play button, which starts the level the child is on
 * (its name says the game and the level: "Play Ball Pop, level 4 of 5"). The
 * picture is a second, pointer-only way to the same thing, because children
 * tap pictures. Replaying an earlier level is on the game's own start screen
 * (its level path is the picker there), so the card has no row of tiny level
 * buttons to miss-hit.
 *
 * The level path is drawn for the eye and said in words for everyone
 * ("Level 4 of 5, 3 cleared"); the speaker reads the card aloud for a child who
 * cannot read it.
 */
import { useTranslation } from 'react-i18next'
import { FaPlay, FaVolumeUp, FaTrophy, FaStar, FaSeedling } from 'react-icons/fa'
import { DOMAIN_LABELS, LIFE_SKILL_LABELS } from '../catalog/groups'
import { tileProgress, hasJourney, LEVELS } from '../core/journey'
import { speak } from '../core/tts'
import { tGame, tDomain, tLifeSkill } from '../core/arText'
import LevelPips from '../core/LevelPips'
import { levelWords } from './hubText'
import styles from './GameCard.module.css'

export default function GameCard({ game, index, onOpen, isNext }) {
  const { t } = useTranslation()
  const journeyOn = hasJourney(game)
  const p = journeyOn ? tileProgress(game) : null
  const title = tGame(game.id, 'title', game.title)
  const how = tGame(game.id, 'how', game.how)
  const domains = (game.domains || []).slice(0, 2).map((d) => tDomain(d, DOMAIN_LABELS[d] || d))
  const life = game.lifeSkill ? tLifeSkill(game.lifeSkill, LIFE_SKILL_LABELS[game.lifeSkill]) : null
  const words = levelWords(t, p)
  const titleId = `arhub-game-${game.id}`

  const play = () => onOpen(game.id, p?.level)
  const playName = journeyOn
    ? t('ar.hub.playGameAria', 'Play {{title}}, level {{n}} of {{total}}', { title, n: p.level, total: LEVELS })
    : t('ar.hub.startGameAria', 'Start {{title}}', { title })

  return (
    <li
      className={`${styles.card} ${isNext ? styles.next : ''} ${p?.complete ? styles.done : ''}`}
      data-color={game.color || 'blue'}
      data-game-card={game.id}
      style={{ '--i': index }}
      aria-labelledby={titleId}
    >
      {/* The picture: tap it to play (pointer only — the Play button is the
          keyboard and screen-reader way in, so this is not a second stop). */}
      <div className={styles.art} onClick={play} aria-hidden>
        <span className={styles.artBlob} />
        <span className={styles.artIcon}>
          <game.icon />
        </span>
        {p?.complete ? (
          <span className={`${styles.badge} ${styles.badgeDone}`}>
            <FaTrophy /> {t('ar.hub.badgeAllCleared', 'All cleared')}
          </span>
        ) : p && !p.plays ? (
          <span className={`${styles.badge} ${styles.badgeNew}`} data-butterfly-perch>
            <FaSeedling /> {t('ar.hub.newBadge', 'New')}
          </span>
        ) : null}
      </div>
      {isNext && (
        <span className={styles.nextTag}>
          <FaStar aria-hidden /> {t('ar.hub.nextUp', 'Next up')}
        </span>
      )}

      <div className={styles.body}>
        <h3 className={styles.title} id={titleId}>
          {title}
        </h3>
        <p className={styles.how}>{how}</p>

        {(domains.length > 0 || life) && (
          <ul className={styles.chips} aria-label={t('ar.hub.practisesLabel', 'Practises')}>
            {domains.map((d) => (
              <li key={d} className={styles.chip}>
                {d}
              </li>
            ))}
            {life && <li className={`${styles.chip} ${styles.chipLife}`}>{life}</li>}
          </ul>
        )}

        <div className={styles.level}>
          {journeyOn && (
            <span className={styles.pips} aria-hidden>
              <LevelPips pips={p.pips} size="card" />
            </span>
          )}
          <span className={styles.levelText}>{words}</span>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.play}
            onClick={play}
            aria-label={playName}
            data-play={game.id}
            data-sound="open"
          >
            <FaPlay aria-hidden className={styles.playIcon} />
            <span>{journeyOn ? t('ar.hub.calloutPlay', 'Play') : t('ar.hub.startWord', 'Start')}</span>
            {journeyOn && (
              <span className={styles.playLevel}>
                {t('ar.hub.levelShort', 'Level {{n}}', { n: p.level })}
              </span>
            )}
          </button>
          <button
            type="button"
            className={styles.speak}
            onClick={() => speak(`${title}. ${how} ${words}.`, { user: true })}
            aria-label={t('ar.hub.readAloudAria', 'Read {{title}} aloud', { title })}
            title={t('ar.hub.readThisOut', 'Read this out')}
          >
            <FaVolumeUp aria-hidden />
          </button>
        </div>
      </div>
    </li>
  )
}
