import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MasteryGlyph, MasteryLegend } from './Heat';
import { masteryLabel, masteryOf } from '../constants';
import s from './charts.module.css';

/**
 * Skills as chips filled by mastery level. Each chip shows a glyph and the
 * level in words to screen readers, so the fill colour is never the only cue.
 *
 *   <MasteryChips skills={[{ id: 'a', label: 'Count to 20', level: 3 }]} onSelect={(skill) => …} />
 *
 * Props: skills [{id, label, level (0-3 or 'notStarted'|'learning'|'practising'|'mastered'), prevLevel?}],
 *        onSelect(skill), showPrev (draw "was X" markers, used by SkillMap).
 */
export function MasteryChips({ skills = [], onSelect, showPrev = false }) {
  const { t } = useTranslation();
  return (
    <ul className={s.chips}>
      {skills.slice(0, 500).map((k) => {
        const m = masteryOf(k.level);
        const before = showPrev && k.prevLevel != null ? masteryOf(k.prevLevel) : null;
        const changed = before && before.level !== m.level;
        const inner = (
          <>
            {before && changed && <><MasteryGlyph level={before.level} /><span className={s.chipArrow} aria-hidden="true">{'→'}</span></>}
            <MasteryGlyph level={m.level} />
            <span>{k.label}</span>
            <span className="d-sr-only">
              : {masteryLabel(t, m.key)}
              {changed ? `, ${t('dash.skill.was', { defaultValue: 'was {{level}}', level: masteryLabel(t, before.key) })}` : ''}
            </span>
            {changed && <span className={s.chipUp} aria-hidden="true">{m.level > before.level ? '▲' : '▼'}</span>}
          </>
        );
        const style = { background: m.bg, color: m.ink, borderStyle: m.level === 0 ? 'dashed' : 'solid' };
        return (
          <li key={k.id}>
            {onSelect
              ? <button type="button" className={s.chipSkill} style={style} onClick={() => onSelect(k)}>{inner}</button>
              : <span className={s.chipSkill} style={style}>{inner}</span>}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * "What can they do now?" Skills grouped by topic, with a "then vs now" toggle
 * when skills carry `prevLevel`.
 *
 *   <SkillMap skills={[{ id: 'a', topic: 'Fractions', label: 'Halves', level: 3, prevLevel: 1 }, …]}
 *             onSelect={(skill) => …} />
 *
 * Props: skills [{id, topic, label, level, prevLevel?}], onSelect(skill), compare (initial, default false).
 */
export default function SkillMap({ skills = [], onSelect, compare = false, label }) {
  const { t } = useTranslation();
  const [showPrev, setShowPrev] = useState(compare);
  const canCompare = skills.some((k) => k.prevLevel != null);
  const topics = useMemo(() => {
    const m = new Map();
    skills.slice(0, 1000).forEach((k) => {
      const key = k.topic || '';
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(k);
    });
    return [...m.entries()];
  }, [skills]);
  const mastered = skills.filter((k) => masteryOf(k.level).level === 3).length;
  const summary = t('dash.skill.summary', { defaultValue: '{{m}} of {{n}} skills mastered across {{k}} topics.', m: mastered, n: skills.length, k: topics.length });

  return (
    <div role="group" aria-label={label || t('dash.skill.label', { defaultValue: 'Skill map' })}>
      <p className="d-sr-only">{summary}</p>
      <div className={s.skillTop}>
        <MasteryLegend />
        {canCompare && (
          <button type="button" className={s.switchBtn} role="switch" aria-checked={showPrev} onClick={() => setShowPrev((v) => !v)}>
            <span className={s.switchTrack}><span className={s.switchKnob} /></span>
            {t('dash.skill.thenNow', { defaultValue: 'Then vs now' })}
          </button>
        )}
      </div>
      <div className={s.topics}>
        {topics.map(([topic, list]) => {
          const done = list.filter((k) => masteryOf(k.level).level === 3).length;
          return (
            <section key={topic} className={s.topic}>
              <h4 className={s.topicTitle}>
                {topic || t('dash.skill.other', { defaultValue: 'Other' })}
                <span className={s.topicCount}>{t('dash.skill.count', { defaultValue: '{{d}} of {{n}} mastered', d: done, n: list.length })}</span>
              </h4>
              <MasteryChips skills={list} onSelect={onSelect} showPrev={showPrev} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
