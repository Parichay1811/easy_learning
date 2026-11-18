import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronRight } from 'react-icons/fa';
import ChartFrame from './ChartFrame';
import { fmtNumber, fmtPercent } from '../format';
import { useChartTip } from '../utils';
import s from './charts.module.css';

const R0 = 74;      // hole radius
const RING = 54;    // ring thickness
const GAP = 4;
const RINGS = 3;
const VIEW = R0 + RINGS * (RING + GAP) + 6;

const size = (n) => (n.students != null ? n.students : (n.children || []).reduce((a, c) => a + size(c), 0)) || 0;
const scoreColor = (v) => `color-mix(in srgb, var(--d-score-hi) ${Math.round(Math.min(1, Math.max(0, v ?? 0)) * 100)}%, var(--d-score-lo))`;

function arc(a0, a1, r0, r1) {
  const pt = (a, r) => [Math.sin(a) * r, -Math.cos(a) * r];
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = pt(a0, r1);
  const [x1, y1] = pt(a1, r1);
  const [x2, y2] = pt(a1, r0);
  const [x3, y3] = pt(a0, r0);
  return `M${x0},${y0} A${r1},${r1} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 ${large} 0 ${x3},${y3} Z`;
}

function layout(node, depth, a0, a1, trail, out) {
  const kids = (node.children || []).filter((c) => size(c) > 0);
  const total = kids.reduce((a, c) => a + size(c), 0);
  let a = a0;
  kids.forEach((c) => {
    const span = ((a1 - a0) * size(c)) / total;
    const t2 = [...trail, c];
    out.push({ node: c, depth, a0: a, a1: a + span, trail: t2 });
    if (depth + 1 < RINGS) layout(c, depth + 1, a, a + span, t2, out);
    a += span;
  });
  return out;
}

/**
 * "How is the school organised and doing?" Rings of units: angle = number of
 * students, colour = a 0..1 score (engagement, mastery). Click (or Enter on) a
 * unit to drill into it; click the centre to go back. A list beside the chart
 * gives the same numbers in words, so nothing depends on colour or on hovering.
 *
 *   <UnitSunburst root={{ id: 'school', name: 'Sunrise School', score: 0.78,
 *       children: [{ id: 'g4', name: 'Grade 4', score: 0.7, children: [{ id: '4a', name: '4A', students: 28, score: 0.74 }] }] }}
 *     scoreLabel="Engagement" onSelect={(node, path) => …} />
 *
 * Props: root {id, name, students? (leaf size), score (0..1), children?}, scoreLabel (default 'Score'),
 *        onSelect(node, path) fired on every click, drills = true to drill on click (default),
 *        summary, label.
 */
export default function UnitSunburst({ root, scoreLabel, onSelect, drills = true, summary, label }) {
  const { t } = useTranslation();
  const { ref, tip, bind } = useChartTip();
  const [path, setPath] = useState([]);
  const sl = scoreLabel || t('dash.sun.score', { defaultValue: 'Score' });

  const current = useMemo(() => path.reduce((n, id) => (n.children || []).find((c) => c.id === id) || n, root || { id: 'x', name: '', children: [] }), [path, root]);
  const arcs = useMemo(() => layout(current, 0, 0, Math.PI * 2 - 0.0001, [], []), [current]);
  const kids = (current.children || []).filter((c) => size(c) > 0);
  const nodesOnPath = useMemo(() => {
    const out = [root];
    path.reduce((n, id) => { const c = (n.children || []).find((x) => x.id === id); if (c) out.push(c); return c || n; }, root);
    return out;
  }, [path, root]);

  if (!root) return null;
  // `trail` = the nodes from the current centre down to the clicked unit.
  const pick = (trail) => {
    const node = trail[trail.length - 1];
    const ids = [...path, ...trail.map((n) => n.id)];
    onSelect?.(node, ids);
    if (drills && (node.children || []).length) setPath(ids);
  };

  const auto = t('dash.sun.summary', {
    defaultValue: '{{name}}: {{n}} students, {{sl}} {{score}}. Parts: {{parts}}.',
    name: current.name, n: fmtNumber(size(current)), sl, score: fmtPercent(current.score),
    parts: kids.map((c) => `${c.name} ${fmtNumber(size(c))} ${t('dash.sun.students', { defaultValue: 'students' })}, ${fmtPercent(c.score)}`).join('; ') || '—',
  });

  return (
    <ChartFrame frameRef={ref} tip={tip} label={label || t('dash.sun.label', { defaultValue: 'Sunburst of units' })} summary={summary || auto}>
      <nav className={s.sunCrumbs} aria-label={t('dash.sun.path', { defaultValue: 'Unit path' })}>
        {nodesOnPath.map((n, i) => (
          <span key={n.id} className={s.sunCrumb}>
            {i > 0 && <FaChevronRight aria-hidden="true" />}
            {i < nodesOnPath.length - 1
              ? <button type="button" onClick={() => setPath(path.slice(0, i))}>{n.name}</button>
              : <strong aria-current="true">{n.name}</strong>}
          </span>
        ))}
      </nav>
      <div className={s.sunBody}>
        <svg className={s.sunSvg} viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`} role="group" aria-label={auto}>
          {arcs.map((a) => {
            const r0 = R0 + a.depth * (RING + GAP);
            const mid = (a.a0 + a.a1) / 2;
            const rm = r0 + RING / 2;
            const wide = (a.a1 - a.a0) * rm > 58 && a.depth < 2;
            const text = `${a.node.name}: ${fmtNumber(size(a.node))} ${t('dash.sun.students', { defaultValue: 'students' })}, ${sl} ${fmtPercent(a.node.score)}`;
            const deeper = (a.node.children || []).length > 0 && drills;
            return (
              <g key={`${a.depth}-${a.node.id}`}>
                <path
                  d={arc(a.a0 + 0.004, a.a1 - 0.004, r0, r0 + RING)}
                  className={s.sunArc}
                  style={{ fill: scoreColor(a.node.score) }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${text}${deeper ? `. ${t('dash.sun.open', { defaultValue: 'Press Enter to open' })}` : ''}`}
                  {...bind(text)}
                  onClick={() => pick(a.trail)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick(a.trail))}
                />
                {wide && (
                  <text x={Math.sin(mid) * rm} y={-Math.cos(mid) * rm} textAnchor="middle" dominantBaseline="middle" className={s.sunLabel} pointerEvents="none">
                    {a.node.name.length > 11 ? `${a.node.name.slice(0, 10)}…` : a.node.name}
                  </text>
                )}
              </g>
            );
          })}
          <g
            className={path.length ? s.sunCenterBtn : undefined}
            role={path.length ? 'button' : undefined}
            tabIndex={path.length ? 0 : undefined}
            aria-label={path.length ? t('dash.sun.back', { defaultValue: 'Back up one level' }) : undefined}
            onClick={path.length ? () => setPath(path.slice(0, -1)) : undefined}
            onKeyDown={path.length ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setPath(path.slice(0, -1))) : undefined}
          >
            <circle r={R0 - 6} fill="var(--d-card-alt)" stroke="var(--d-line)" strokeWidth="2" />
            <text y="-12" textAnchor="middle" className={s.sunCenterName}>{current.name.length > 14 ? `${current.name.slice(0, 13)}…` : current.name}</text>
            <text y="8" textAnchor="middle" className={s.sunCenterSub}>{fmtNumber(size(current))} {t('dash.sun.students', { defaultValue: 'students' })}</text>
            <text y="26" textAnchor="middle" className={s.sunCenterSub}>{sl} {fmtPercent(current.score)}</text>
            {path.length > 0 && <text y="44" textAnchor="middle" className={s.sunBack}>{'←'} {t('dash.sun.backShort', { defaultValue: 'Back' })}</text>}
          </g>
        </svg>
        <div className={s.sunSide}>
          <p className={s.sunSideTitle}>{t('dash.sun.parts', { defaultValue: 'Inside {{name}}', name: current.name })}</p>
          <ul className={s.sunList}>
            {kids.map((c) => (
              <li key={c.id}>
                <button type="button" className={s.sunItem} onClick={() => pick([c])}>
                  <span className={s.sunSwatch} style={{ background: scoreColor(c.score) }} aria-hidden="true" />
                  <span className={s.sunName}>{c.name}</span>
                  <span className={s.sunNum}>{fmtNumber(size(c))}</span>
                  <span className={s.sunScore}>{fmtPercent(c.score)}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className={s.sunScale} aria-hidden="true">
            <span>0%</span><span className={s.sunScaleBar} /><span>100%</span>
            <em>{sl}</em>
          </div>
        </div>
      </div>
    </ChartFrame>
  );
}
