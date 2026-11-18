// A printable learner / group / school report (FND-060, DSN-031). Give it the
// report data, or an endpoint to load it from; "Print / Save as PDF" uses the
// browser (no server PDF). Charts use patterns and labels, so they read in
// black and white. The school's logo shows when its plan has reports.branded.
//
//   <ReportView role="teacher" endpoint={`/reports/teacher/batches/${id}`} from={tr.from} to={tr.to}
//               exportEndpoint={`/reports/teacher/batches/${id}/learners.export`} />
//   <ReportView report={data} />
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaFileCsv, FaFileExcel, FaPrint } from 'react-icons/fa';
import { api, download } from '../comms/commsApi';
import { Button, EmptyState, Skeleton, fmtDuration, fmtDate, fmtNumber, NO_DATA } from '../dashboard';
import s from './ReportView.module.css';

const SUBJECTS = ['english', 'maths', 'science'];
const MODULES = ['listen', 'read', 'write', 'speak'];
const MASTERY_GLYPH = { not_started: '○', learning: '◔', practising: '◑', mastered: '●' };
const KIND_GLYPH = { celebrate: '★', info: 'i', nudge: '→', alert: '!' };

export default function ReportView({ report: given, endpoint, role, from, to, title, exportEndpoint }) {
  const { t } = useTranslation();
  const [state, setState] = useState({ report: given || null, error: '', loading: Boolean(endpoint && !given) });

  useEffect(() => {
    if (given || !endpoint) return undefined;
    const ctl = new AbortController();
    const q = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) });
    api(`${endpoint}${q.toString() ? `?${q}` : ''}`, { role, signal: ctl.signal })
      .then((r) => setState({ report: r.report, error: '', loading: false }))
      .catch((e) => { if (e.name !== 'AbortError') setState({ report: null, error: e.message, loading: false }); });
    return () => ctl.abort();
  }, [given, endpoint, role, from, to]);

  const r = given || state.report;
  if (state.loading && !r) return <div className={s.state}><Skeleton variant="chart" /></div>;
  if (state.error) return <div className={s.state}><EmptyState tone="error" title={t('report.failed', { defaultValue: "We couldn't build this report" })} text={state.error} /></div>;
  if (!r) return null;

  const exportFile = (format) => {
    const q = new URLSearchParams({ format, from: r.range.from, to: r.range.to });
    download(`${exportEndpoint}?${q}`, { role }).catch(() => {});
  };

  return (
    <div>
      <div className={s.toolbar} data-print="hide">
        {exportEndpoint && (
          <>
            <Button variant="ghost" size="sm" icon={FaFileCsv} onClick={() => exportFile('csv')}>{t('report.csv', { defaultValue: 'CSV' })}</Button>
            <Button variant="ghost" size="sm" icon={FaFileExcel} onClick={() => exportFile('xlsx')}>{t('report.xlsx', { defaultValue: 'Excel' })}</Button>
          </>
        )}
        <Button icon={FaPrint} onClick={() => window.print()}>{t('report.print', { defaultValue: 'Print / Save as PDF' })}</Button>
      </div>
      <Report r={r} title={title} />
      {createPortal(<div className={`dash ${s.printRoot}`} data-theme="light"><Report r={r} title={title} print /></div>, document.body)}
    </div>
  );
}

function Report({ r, title, print = false }) {
  const idp = print ? 'p-' : '';
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const kindTitle = {
    learner: t('report.kind.learner', { defaultValue: 'Learning report' }),
    group: t('report.kind.group', { defaultValue: 'Group report' }),
    org: t('report.kind.org', { defaultValue: 'School report' }),
  }[r.kind];
  const pct = (n) => (n == null ? NO_DATA : `${n} %`);
  const tot = r.totals || {};
  const prev = r.previous;
  const delta = (cur, before, fmt) => {
    if (!prev || before == null || cur == null) return null;
    const d = Math.round((cur - before) * 10) / 10;
    if (d === 0) return t('report.same', { defaultValue: 'same as before' });
    return `${d > 0 ? '▲ +' : '▼ −'}${fmt(Math.abs(d))} ${t('report.vsPrev', { defaultValue: 'vs previous period' })}`;
  };

  const kpis = [
    { label: t('report.kpi.time', { defaultValue: 'Time learning' }), value: fmtDuration(tot.minutes), delta: delta(tot.minutes, prev?.minutes, (x) => fmtDuration(x)) },
    { label: t('report.kpi.answered', { defaultValue: 'Questions answered' }), value: fmtNumber(tot.answered), delta: delta(tot.answered, prev?.answered, (x) => fmtNumber(x)) },
    { label: t('report.kpi.accuracy', { defaultValue: 'Answers right' }), value: pct(tot.accuracy), delta: delta(tot.accuracy, prev?.accuracy, (x) => `${x} pts`) },
    { label: t('report.kpi.days', { defaultValue: 'Active days' }), value: `${tot.activeDays ?? NO_DATA} / ${r.range.days}`, delta: null },
  ];
  if (r.kind === 'learner' && r.streak) kpis.push({ label: t('report.kpi.streak', { defaultValue: 'Current streak' }), value: t('report.days', { count: r.streak.current, defaultValue: '{{count}} days', defaultValue_one: '{{count}} day' }), delta: t('report.best', { count: r.streak.longest, defaultValue: 'best: {{count}} days', defaultValue_one: 'best: {{count}} day' }) });
  if (r.summary) {
    kpis.push({ label: t('report.kpi.active', { defaultValue: 'Learners active' }), value: `${r.summary.active} / ${r.summary.learners}`, delta: null });
    kpis.push({ label: t('report.kpi.nudge', { defaultValue: 'Need a nudge' }), value: String(r.summary.atRisk), delta: null });
  }

  const hour = (h) => new Intl.DateTimeFormat(lang, { hour: 'numeric' }).format(new Date(2026, 0, 1, h));

  return (
    <article className={s.sheet} aria-labelledby={`${idp}report-title`}>
      <header className={s.head}>
        <div className={s.brand}>
          {r.brand?.logoUrl ? <img className={s.logo} src={r.brand.logoUrl} alt={r.brand.name} /> : <span className={s.wordmark}>Learnigo</span>}
          {r.brand?.name && !r.brand.logoUrl && <span className={s.orgName}>{r.brand.name}</span>}
        </div>
        <div className={s.titleBox}>
          <h1 id={`${idp}report-title`} className={s.title}>{title || `${kindTitle}: ${r.who}`}</h1>
          <p className={s.range}>{fmtDate({ from: r.range.from, to: r.range.to }, { style: 'long' })} · {t('report.daysN', { count: r.range.days, defaultValue: '{{count}} days', defaultValue_one: '{{count}} day' })}</p>
        </div>
      </header>

      <section className={s.section} data-print="section">
        <p className={s.story}>{r.story}</p>
        {r.insights?.length > 0 && (
          <ul className={s.insights}>
            {r.insights.map((x) => (
              <li key={x.key} className={s.insight}>
                <span className={s.glyph} aria-hidden="true">{KIND_GLYPH[x.kind] || '•'}</span>
                <span><span className={s.kind}>{t(`report.insight.${x.kind}`, { defaultValue: { celebrate: 'Well done:', info: 'Good to know:', nudge: 'Try next:', alert: 'Worth a look:' }[x.kind] || '' })}</span>{x.text}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={s.section} data-print="section" aria-labelledby={`${idp}report-kpis`}>
        <h2 id={`${idp}report-kpis`} className={s.h2}>{t('report.numbers', { defaultValue: 'The numbers' })}</h2>
        <div className={s.kpis}>
          {kpis.map((k) => (
            <div key={k.label} className={s.kpi}>
              <div className={s.kpiLabel}>{k.label}</div>
              <div className={s.kpiValue}>{k.value}</div>
              {k.delta && <div className={s.kpiDelta}>{k.delta}</div>}
            </div>
          ))}
        </div>
      </section>

      {r.series?.points?.length > 0 && (
        <section className={s.section} data-print="section" aria-labelledby={`${idp}report-trend`}>
          <h2 id={`${idp}report-trend`} className={s.h2}>{t('report.when', { defaultValue: 'When did learning happen?' })}</h2>
          <TrendBars points={r.series.points} bucket={r.series.bucket} idp={idp} />
        </section>
      )}

      <section className={s.section} data-print="section" aria-labelledby={`${idp}report-matrix`}>
        <h2 id={`${idp}report-matrix`} className={s.h2}>{t('report.matrix', { defaultValue: 'How is each subject going?' })}</h2>
        <div className={s.scroll}>
          <table className={s.table}>
            <caption className={s.srOnly}>{t('report.matrixCaption', { defaultValue: 'Accuracy and mastery by subject and skill' })}</caption>
            <thead>
              <tr>
                <th scope="col">{t('report.subject', { defaultValue: 'Subject' })}</th>
                {MODULES.map((m) => <th key={m} scope="col">{t(`dash.module.${m}`, { defaultValue: m[0].toUpperCase() + m.slice(1) })}</th>)}
              </tr>
            </thead>
            <tbody>
              {SUBJECTS.map((sub) => (
                <tr key={sub}>
                  <th scope="row">{t(`dash.subject.${sub}`, { defaultValue: sub[0].toUpperCase() + sub.slice(1) })}</th>
                  {MODULES.map((m) => {
                    const c = r.matrix?.[sub]?.[m] || {};
                    return (
                      <td key={m} className={s.matrixCell}>
                        <span aria-hidden="true">{MASTERY_GLYPH[c.mastery] || '○'} </span>
                        {c.answered ? `${pct(c.accuracy)}` : NO_DATA}
                        <span className={s.cellWord}> {c.answered > 0 && c.mastery === 'not_started'
                          ? t('report.mastery.few', { defaultValue: 'a few answers' })
                          : t(`report.mastery.${c.mastery || 'not_started'}`, { defaultValue: { not_started: 'not started', learning: 'learning', practising: 'practising', mastered: 'mastered' }[c.mastery || 'not_started'] })}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={s.legend}>○ {t('report.mastery.not_started', { defaultValue: 'not started' })} · ◔ {t('report.mastery.learning', { defaultValue: 'learning' })} · ◑ {t('report.mastery.practising', { defaultValue: 'practising' })} · ● {t('report.mastery.mastered', { defaultValue: 'mastered' })}</p>
        {(r.patterns?.bestHour != null || r.patterns?.weekdayAvgMinutes != null) && (
          <p className={s.legend} style={{ color: 'var(--d-ink)' }}>
            {r.patterns.bestHour != null && <span>{t('report.bestHour', { hour: hour(r.patterns.bestHour), defaultValue: 'Most learning happens around {{hour}}.' })}</span>}
            {r.patterns.weekdayAvgMinutes != null && <span>{t('report.weekday', { weekday: fmtDuration(r.patterns.weekdayAvgMinutes), weekend: fmtDuration(r.patterns.weekendAvgMinutes), defaultValue: 'Active weekdays average {{weekday}}, weekends {{weekend}}.' })}</span>}
          </p>
        )}
      </section>

      {r.learners && (
        <section className={s.section} aria-labelledby={`${idp}report-learners`}>
          <h2 id={`${idp}report-learners`} className={s.h2}>{t('report.learners', { count: r.learners.length, defaultValue: 'Learners ({{count}})' })}</h2>
          <div className={s.scroll}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">{t('report.col.name', { defaultValue: 'Learner' })}</th>
                  <th scope="col" className={s.num}>{t('report.col.time', { defaultValue: 'Time' })}</th>
                  <th scope="col" className={s.num}>{t('report.col.answered', { defaultValue: 'Answered' })}</th>
                  <th scope="col" className={s.num}>{t('report.col.accuracy', { defaultValue: 'Right' })}</th>
                  <th scope="col" className={s.num}>{t('report.col.days', { defaultValue: 'Active days' })}</th>
                  <th scope="col">{t('report.col.status', { defaultValue: 'Status' })}</th>
                </tr>
              </thead>
              <tbody>
                {r.learners.map((l, i) => (
                  <tr key={`${l.name}-${i}`}>
                    <th scope="row" style={{ fontWeight: 500 }}>{l.name}</th>
                    <td className={s.num}>{fmtDuration(l.minutes)}</td>
                    <td className={s.num}>{fmtNumber(l.answered)}</td>
                    <td className={s.num}>{pct(l.accuracy)}</td>
                    <td className={s.num}>{l.activeDays}</td>
                    <td>{l.atRisk
                      ? <span className={s.flag}>⚑ {l.riskReason === 'accuracy_drop' ? t('report.drop', { defaultValue: 'Needs a nudge (accuracy dipped)' }) : t('report.idle', { defaultValue: 'Needs a nudge (quiet lately)' })}</span>
                      : t('report.onTrack', { defaultValue: 'On track' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <footer className={s.foot}>
        {t('report.footer', { date: fmtDate(r.generatedAt.slice(0, 10), { style: 'long' }), defaultValue: 'Made with Learnigo on {{date}}. Every number follows the Learnigo metrics dictionary: active days have at least one answer or 3 minutes of learning; comparisons are with the previous period of the same length.' })}
      </footer>
    </article>
  );
}

// Minutes as hatched bars, accuracy as a dashed line with markers: readable without colour.
function TrendBars({ points, bucket, idp = '' }) {
  const { t } = useTranslation();
  const hatchId = `${idp}rv-hatch`;
  const data = useMemo(() => points.slice(-62), [points]);
  const W = 720, H = 232, L = 44, R = 40, T = 24, B = 34;
  const iw = W - L - R, ih = H - T - B;
  const maxMin = Math.max(10, ...data.map((p) => p.minutes || 0));
  const niceMax = Math.ceil(maxMin / 10) * 10;
  const bw = iw / data.length;
  const x = (i) => L + i * bw;
  const yMin = (v) => T + ih - (v / niceMax) * ih;
  const yAcc = (v) => T + ih - (v / 100) * ih;
  const label = (k) => (bucket === 'month' ? fmtDate(`${k}-01`, { style: 'month' }) : fmtDate(k, { style: 'short' }));
  const every = Math.ceil(data.length / 8);
  const acc = data.map((p, i) => (p.accuracy == null ? null : [x(i) + bw / 2, yAcc(p.accuracy)]));
  const path = acc.reduce((d, pt, i) => (pt ? `${d}${d && acc[i - 1] ? 'L' : 'M'}${pt[0].toFixed(1)},${pt[1].toFixed(1)}` : d), '');
  const total = data.reduce((a, p) => a + (p.minutes || 0), 0);
  const best = data.reduce((b, p) => ((p.minutes || 0) > (b?.minutes || 0) ? p : b), null);
  const summary = t('report.trendSummary', { total: fmtDuration(total), best: best ? label(best.key) : NO_DATA, defaultValue: '{{total}} in total. The busiest was {{best}}.' });
  return (
    <figure style={{ margin: 0 }}>
      <svg className={s.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary}>
        <defs>
          <pattern id={hatchId} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="var(--d-accent-soft, #ece9ff)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--d-ink, #1d2433)" strokeWidth="1.6" />
          </pattern>
        </defs>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={L} x2={W - R} y1={T + ih - f * ih} y2={T + ih - f * ih} stroke="var(--d-grid, #e2e7f0)" />
            <text x={L - 6} y={T + ih - f * ih + 4} textAnchor="end">{Math.round(niceMax * f)}</text>
            <text x={W - R + 6} y={T + ih - f * ih + 4}>{Math.round(100 * f)}%</text>
          </g>
        ))}
        {data.map((p, i) => (
          <rect key={p.key} x={x(i) + bw * 0.15} y={yMin(p.minutes || 0)} width={Math.max(1, bw * 0.7)} height={T + ih - yMin(p.minutes || 0)} fill={`url(#${hatchId})`} stroke="var(--d-ink, #1d2433)" strokeWidth="0.8">
            <title>{`${label(p.key)}: ${fmtDuration(p.minutes)}${p.accuracy != null ? `, ${p.accuracy} %` : ''}`}</title>
          </rect>
        ))}
        {path && <path d={path} fill="none" stroke="var(--d-ink, #1d2433)" strokeWidth="1.6" strokeDasharray="5 3" />}
        {acc.map((pt, i) => pt && <circle key={data[i].key} cx={pt[0]} cy={pt[1]} r="3" fill="var(--d-card, #fff)" stroke="var(--d-ink, #1d2433)" strokeWidth="1.5" />)}
        {data.map((p, i) => (i % every === 0 ? <text key={`l${p.key}`} x={x(i) + bw / 2} y={H - 12} textAnchor="middle">{label(p.key)}</text> : null))}
        <text x={L - 6} y={10} textAnchor="end">min</text>
      </svg>
      <figcaption className={s.legend}>
        <span><span className={s.swatch} style={{ background: 'repeating-linear-gradient(45deg, var(--d-ink) 0 1.5px, transparent 1.5px 5px)' }} aria-hidden="true" />{t('report.legendMinutes', { defaultValue: 'Minutes learning (left scale)' })}</span>
        <span><svg width="26" height="12" aria-hidden="true" style={{ verticalAlign: -1, marginRight: 6 }}><line x1="0" y1="6" x2="26" y2="6" stroke="currentColor" strokeWidth="1.6" strokeDasharray="5 3" /><circle cx="13" cy="6" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>{t('report.legendAccuracy', { defaultValue: 'Answers right (right scale)' })}</span>
        <span>{summary}</span>
      </figcaption>
    </figure>
  );
}
