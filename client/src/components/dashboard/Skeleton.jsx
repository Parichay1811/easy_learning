import s from './cards.module.css';

/**
 * Loading placeholder shaped like the real content (DSN-030).
 * variant: 'text' | 'rect' | 'circle' | 'tile' | 'chart'
 *
 *   <Skeleton variant="text" lines={3} />
 *   <Skeleton variant="chart" height={220} />
 */
export default function Skeleton({ variant = 'rect', width, height, lines = 1, className = '' }) {
  if (variant === 'text') {
    return (
      <div className={className} role="presentation" aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={`${s.skel} ${s.skelText}`}
            style={{ width: width || (i === lines - 1 && lines > 1 ? '60%' : '100%') }}
          />
        ))}
      </div>
    );
  }
  if (variant === 'tile') {
    return (
      <div className={`${s.card} ${s.skelTile} ${className}`} aria-hidden="true">
        <div className={`${s.skel} ${s.skelText}`} style={{ width: '50%' }} />
        <div className={s.skel} style={{ width: '70%', height: 34, borderRadius: 10 }} />
        <div className={`${s.skel} ${s.skelText}`} style={{ width: '35%' }} />
      </div>
    );
  }
  if (variant === 'chart') {
    // A row of bars of different heights: reads as "a chart is coming".
    const bars = [55, 80, 45, 90, 65, 35, 75, 60, 85, 50];
    return (
      <div className={`${s.skelChart} ${className}`} style={{ height: height || 220 }} aria-hidden="true">
        {bars.map((h, i) => (
          <div key={i} className={s.skel} style={{ height: `${h}%`, borderRadius: 8 }} />
        ))}
      </div>
    );
  }
  return (
    <div
      className={`${s.skel} ${variant === 'circle' ? s.skelCircle : ''} ${className}`}
      style={{ width: width || '100%', height: height || (variant === 'circle' ? width : 16) }}
      aria-hidden="true"
    />
  );
}
