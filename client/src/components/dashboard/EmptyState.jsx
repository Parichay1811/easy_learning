import Button from './Button';
import mascot from '../../assets/dash/mascot.webp';
import s from './cards.module.css';

/**
 * An empty state teaches the next step with ONE button (DSN-030).
 *
 *   <EmptyState title="No lessons yet" text="Start a lesson to see progress here."
 *               actionLabel="Open the lessons" onAction={go} />
 *
 * Props: { icon (react-icons component, or an emoji string), title, text, actionLabel, onAction,
 *          to (link instead of onAction), compact, tone: 'neutral' | 'error' }
 * Without an icon the Learnigo puppy keeps the reader company.
 */
export default function EmptyState({ icon, title, text, actionLabel, onAction, to, compact, tone = 'neutral', role }) {
  let art;
  if (!icon) art = <img className={s.emptyMascot} src={mascot} alt="" width="96" height="112" />;
  else {
    const Icon = icon;
    art = (
      <span className={s.emptyIcon} aria-hidden="true">
        {typeof icon === 'string' ? icon : <Icon />}
      </span>
    );
  }
  return (
    <div className={`${s.empty} ${compact ? s.emptyCompact : ''} ${tone === 'error' ? s.emptyError : ''}`} role={role}>
      {art}
      {title && <p className={s.emptyTitle}>{title}</p>}
      {text && <p className={s.emptyText}>{text}</p>}
      {actionLabel && (onAction || to) && (
        <Button onClick={onAction} to={to}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
