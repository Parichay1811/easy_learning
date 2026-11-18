import { useTranslation } from 'react-i18next';
import ChartFrame from './ChartFrame';
import { MasteryGlyph, MasteryLegend } from './Heat';
import { MODULES, SUBJECTS, masteryFromScore, masteryLabel, masteryOf, moduleLabel, subjectLabel } from '../constants';
import { fmtDuration, fmtPercent } from '../format';
import s from './charts.module.css';

/**
 * "How are they doing in each subject and skill?" 3 subjects x 4 modules.
 * Tile colour = mastery level (with a glyph and a word), big number = accuracy.
 *
 *   <SubjectModuleMatrix
 *     cells={[{ subject: 'english', module: 'listen', accuracy: 0.82, minutes: 65 }, …]}
 *     onSelect={(subject, module) => …} />
 *
 * Props: cells [{subject, module, accuracy (0..1|null), minutes, level? (0-3 | key, else derived from accuracy)}],
 *        subjects / modules (optional subsets, default all), onSelect(subject, module),
 *        showLegend (default true), summary.
 */
export default function SubjectModuleMatrix({ cells = [], subjects, modules, onSelect, showLegend = true, summary, label }) {
  const { t } = useTranslation();
  const subs = subjects ? SUBJECTS.filter((x) => subjects.includes(x.key)) : SUBJECTS;
  const mods = modules ? MODULES.filter((x) => modules.includes(x.key)) : MODULES;
  const find = (sub, mod) => cells.find((c) => c.subject === sub && c.module === mod);

  const parts = [];
  subs.forEach((sub) => mods.forEach((mod) => {
    const c = find(sub.key, mod.key);
    const lv = c ? (c.level != null ? masteryOf(c.level) : masteryFromScore(c.accuracy)) : masteryOf(0);
    parts.push(`${subjectLabel(t, sub.key)} ${moduleLabel(t, mod.key)}: ${masteryLabel(t, lv.key)}${c?.accuracy != null ? `, ${fmtPercent(c.accuracy)}` : ''}`);
  }));

  return (
    <ChartFrame
      label={label || t('dash.matrix.label', { defaultValue: 'Mastery by subject and module' })}
      summary={summary || parts.join('. ')}
    >
      <div className={s.matrix}>
        {subs.map((sub) => (
          <div key={sub.key} className={s.matrixRow} role="group" aria-label={subjectLabel(t, sub.key)}>
            <span className={s.matrixSubject} style={{ '--sc': sub.fill, '--si': sub.ink }}>
              <span className={s.subjectBar} />
              {subjectLabel(t, sub.key)}
            </span>
            {mods.map((mod) => {
              const c = find(sub.key, mod.key);
              const lv = c ? (c.level != null ? masteryOf(c.level) : masteryFromScore(c.accuracy)) : masteryOf(0);
              const empty = !c || (c.accuracy == null && !c.minutes);
              const name = `${subjectLabel(t, sub.key)} ${moduleLabel(t, mod.key)}`;
              const body = (
                <>
                  <span className={s.tileModule}>
                    <span className={s.moduleDot} style={{ background: mod.fill }}><mod.Icon aria-hidden="true" /></span>
                    {moduleLabel(t, mod.key)}
                  </span>
                  <span className={s.tileValue}>{empty ? '—' : fmtPercent(c.accuracy)}</span>
                  <span className={s.tileTime}>{empty ? t('dash.matrix.notYet', { defaultValue: 'Not started' }) : fmtDuration(c.minutes)}</span>
                  <span className={s.tileLevel}><MasteryGlyph level={lv.level} /> {masteryLabel(t, lv.key)}</span>
                </>
              );
              const style = { background: lv.bg, color: lv.ink };
              return onSelect ? (
                <button key={mod.key} type="button" className={`${s.tile} ${s.tileBtn}`} style={style}
                  aria-label={`${name}: ${masteryLabel(t, lv.key)}${empty ? '' : `, ${fmtPercent(c.accuracy)}, ${fmtDuration(c.minutes)}`}`}
                  onClick={() => onSelect(sub.key, mod.key)}>
                  {body}
                </button>
              ) : (
                <div key={mod.key} className={s.tile} style={style} role="group" aria-label={name}>{body}</div>
              );
            })}
          </div>
        ))}
      </div>
      {showLegend && <MasteryLegend className={s.legendGap} />}
    </ChartFrame>
  );
}
