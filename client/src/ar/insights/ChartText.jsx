/**
 * A chart's text alternative: a one-line summary anyone can read, and the
 * numbers as a visually hidden table for screen readers. Put it next to a chart
 * whose drawing is aria-hidden.
 *
 *   <ChartText summary="Understood rose from 55% to 80% over 6 days."
 *     caption="Understood and independent, per day" columns={['Day', 'Understood', 'Independent']}
 *     rows={[['11-02', '55%', '40%'], …]} />
 */
import s from './ChartText.module.css'

export default function ChartText({ summary, caption, columns, rows, showSummary = false }) {
  return (
    <>
      {summary && <p className={showSummary ? s.summary : s.srOnly}>{summary}</p>}
      {rows?.length ? (
        <table className={s.srOnly}>
          {caption && <caption>{caption}</caption>}
          <thead>
            <tr>{columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>{r.map((v, k) => (k === 0 ? <th key={k} scope="row">{v}</th> : <td key={k}>{v}</td>))}</tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </>
  )
}
