import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import s from './celebration.module.css';

// Hook: ./useCelebrateOnce.js

const PIECES = Array.from({ length: 22 }, (_, i) => ({ left: (i * 37) % 100, delay: (i % 7) * 0.12, hue: [260, 170, 35, 330, 200][i % 5], size: 6 + (i % 4) * 2 }));

/**
 * A soft milestone card with a little confetti. Confetti is decorative (aria-hidden)
 * and switched off for people who prefer reduced motion.
 * Props: { emoji = '🎉', title, text, actionLabel, onAction, onClose, shareText }
 */
export default function Celebration({ emoji = '🎉', title, text, actionLabel, onAction, onClose, className = '' }) {
  const { t } = useTranslation();
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <section className={`${s.card} ${className}`} role="status" aria-live="polite">
      <div className={s.confetti} aria-hidden="true">
        {PIECES.map((p, i) => (
          <span key={i} style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, background: `hsl(${p.hue} 80% 60%)`, width: p.size, height: p.size * 1.6 }} />
        ))}
      </div>
      <span className={s.emoji} aria-hidden="true">{emoji}</span>
      <div className={s.body}>
        <h3 className={s.title}>{title}</h3>
        {text && <p className={s.text}>{text}</p>}
        <div className={s.actions}>
          {actionLabel && onAction && <Button size="sm" onClick={onAction}>{actionLabel}</Button>}
          <Button size="sm" variant="ghost" onClick={onClose}>{t('dash.celebration.close', { defaultValue: 'Lovely, thanks' })}</Button>
        </div>
      </div>
    </section>
  );
}
