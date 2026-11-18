import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaStar, FaInfoCircle, FaBullseye, FaExclamationTriangle, FaMagic } from 'react-icons/fa';
import Skeleton from './Skeleton';
import s from './cards.module.css';

const KINDS = {
  celebrate: { Icon: FaStar, word: 'Celebrate' },
  info: { Icon: FaInfoCircle, word: 'Good to know' },
  nudge: { Icon: FaBullseye, word: 'Next step' },
  alert: { Icon: FaExclamationTriangle, word: 'Needs attention' },
};

/**
 * The top of every overview: ONE sentence that answers "how is it going?",
 * plus 2-4 insight chips. Each chip should open the chart that proves it.
 *
 *   <StoryCard
 *     sentence="Aanya learned 2 h 10 min this week, 25 min more than last week."
 *     chips={[{ kind: 'celebrate', text: '9-day streak' },
 *             { kind: 'nudge', text: 'Practise: Fractions', onClick: openFractions }]} />
 *
 * chips[]: { kind: 'celebrate'|'info'|'nudge'|'alert', text, onClick?, to? }
 * `sentence` can be a string or JSX (use <strong> for the key numbers).
 */
export default function StoryCard({ sentence, chips = [], title, loading, className = '' }) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className={`${s.card} ${s.story} ${className}`} aria-busy="true">
        <Skeleton variant="text" lines={2} />
        <div className={s.chipRow}>
          <Skeleton width={130} height={36} />
          <Skeleton width={160} height={36} />
        </div>
      </div>
    );
  }
  return (
    <section className={`${s.card} ${s.story} ${className}`} aria-label={title || undefined} data-print="section">
      <span className={s.storyBadge} aria-hidden="true">
        <FaMagic />
      </span>
      <div className={s.storyBody}>
        {title && <p className={s.storyTitle}>{title}</p>}
        <p className={s.storySentence}>{sentence}</p>
        {chips.length > 0 && (
          <ul className={s.chipRow}>
            {chips.slice(0, 4).map((c, i) => {
              const k = KINDS[c.kind] || KINDS.info;
              const cls = `${s.chip} ${s[`chip_${c.kind}`] || s.chip_info} ${c.onClick || c.to ? s.chipAction : ''}`;
              const inner = (
                <>
                  <k.Icon aria-hidden="true" />
                  <span className="d-sr-only">{t(`dash.story.${c.kind}`, { defaultValue: k.word })}: </span>
                  <span>{c.text}</span>
                </>
              );
              return (
                <li key={`${c.kind}-${i}`}>
                  {c.to ? (
                    <Link to={c.to} className={cls}>{inner}</Link>
                  ) : c.onClick ? (
                    <button type="button" className={cls} onClick={c.onClick}>{inner}</button>
                  ) : (
                    <span className={cls}>{inner}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
