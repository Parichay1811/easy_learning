import { FaSeedling } from 'react-icons/fa';
import Button from './Button';
import s from './cards.module.css';

/**
 * An empty state teaches the next step with ONE button (DSN-030).
 *
 *   <EmptyState title="No lessons yet" text="Start a lesson to see progress here."
 *               actionLabel="Open the lessons" onAction={go} />
 *
 * Props: { icon (react-icons component), title, text, actionLabel, onAction,
 *          to (link instead of onAction), compact, tone: 'neutral' | 'error' }
 */
export default function EmptyState({ icon, title, text, actionLabel, onAction, to, compact, tone = 'neutral', role }) {
  const Icon = icon || FaSeedling;
  return (
    <div className={`${s.empty} ${compact ? s.emptyCompact : ''} ${tone === 'error' ? s.emptyError : ''}`} role={role}>
      <span className={s.emptyIcon} aria-hidden="true">
        <Icon />
      </span>
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
