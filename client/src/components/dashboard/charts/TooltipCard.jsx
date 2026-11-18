import s from './charts.module.css';

/** Tooltip card shared by the Recharts charts. `rows(payload)` returns [{label, value, swatch?}]. */
export default function TooltipCard({ active, payload, label, rows, title }) {
  if (!active || !payload || !payload.length) return null;
  const list = rows(payload);
  return (
    <div className={s.rtip}>
      <p className={s.rtipTitle}>{title ? title(label) : label}</p>
      <ul>
        {list.map((r) => (
          <li key={r.label}>
            {r.swatch}
            <span className={s.rtipLabel}>{r.label}</span>
            <strong>{r.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
