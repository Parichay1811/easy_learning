import { useTranslation } from 'react-i18next';
import { FaLock, FaRocket } from 'react-icons/fa';
import Button from './Button';
import s from './cards.module.css';

/**
 * A locked module is never an error: show a blurred preview of what the user
 * would get, with friendly upgrade text (DSN-030).
 *
 *   <PlanLockCard module="reports.branded" title="Branded school reports"
 *                 text="Add your logo to every PDF." onUpgrade={openBilling}>
 *     <TrendLine data={sample} />   // optional: the blurred preview, e.g. sample data
 *   </PlanLockCard>
 *
 * Props: { module (feature key, shown to screen readers), title, text, ctaLabel, onUpgrade, children (preview) }
 * Without children a generic bar-chart preview is drawn.
 */
export default function PlanLockCard({ module, title, text, ctaLabel, onUpgrade, children, className = '' }) {
  const { t } = useTranslation();
  const bars = [40, 65, 50, 85, 60, 95, 70];
  return (
    <section className={`${s.card} ${s.lock} ${className}`} aria-label={title} data-module={module}>
      <div className={s.lockPreview} aria-hidden="true" inert>
        {children || (
          <div className={s.lockBars}>
            {bars.map((h, i) => (
              <span key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
        )}
      </div>
      <div className={s.lockOverlay}>
        <span className={s.lockIcon} aria-hidden="true"><FaLock /></span>
        <h3 className={s.lockTitle}>{title}</h3>
        <p className={s.lockText}>
          {text || t('dash.lock.text', { defaultValue: 'This is part of a bigger plan. Here is a preview of what you would see.' })}
        </p>
        {onUpgrade && (
          <Button icon={FaRocket} onClick={onUpgrade}>
            {ctaLabel || t('dash.lock.cta', { defaultValue: 'See plans' })}
          </Button>
        )}
      </div>
    </section>
  );
}
