/**
 * A tiny trend line for a finding: the period before (hollow dots) and this
 * period (filled dots), with a dashed line between them. Shape, not colour,
 * says which is which, and the whole picture has a text alternative listing
 * every value (`label`), so nothing is shown only as a picture.
 *
 *   <TrendSpark series={f.series} unit="%" label="Understood each week, oldest first: 55%, 60%, …" />
 */
import { useId } from 'react'

export default function TrendSpark({ series, unit, label, width = 132, height = 40, className }) {
  const id = useId()
  const pts = (series || []).map((p, i) => ({ ...p, i }))
  const vals = pts.filter((p) => Number.isFinite(p.value))
  if (vals.length < 2) return null
  const pad = 5
  let lo = Math.min(...vals.map((p) => p.value))
  let hi = Math.max(...vals.map((p) => p.value))
  if (unit === '%') { lo = Math.min(lo, 40); hi = Math.max(hi, 100); lo = Math.max(0, Math.floor(lo / 10) * 10) }
  const span = hi - lo || 1
  const x = (i) => pad + (pts.length === 1 ? 0 : (i / (pts.length - 1)) * (width - pad * 2))
  const y = (v) => height - pad - ((v - lo) / span) * (height - pad * 2)
  const line = vals.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const firstNow = pts.findIndex((p) => p.current)
  const divider = firstNow > 0 ? (x(firstNow - 1) + x(firstNow)) / 2 : null
  return (
    <svg className={className} width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={id} focusable="false">
      <title id={id}>{label}</title>
      {divider != null && <line x1={divider} x2={divider} y1={2} y2={height - 2} stroke="currentColor" strokeOpacity="0.45" strokeDasharray="2 3" />}
      <path d={line} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {vals.map((p) => (
        <circle
          key={p.i}
          cx={x(p.i)}
          cy={y(p.value)}
          r={p.current ? 3.4 : 3}
          fill={p.current ? 'currentColor' : 'var(--spark-bg, #fff)'}
          stroke="currentColor"
          strokeWidth="1.6"
        />
      ))}
    </svg>
  )
}
