import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle, FaSort, FaSortDown, FaSortUp } from 'react-icons/fa';
import ChartFrame from './ChartFrame';
import { MasteryLegend } from './Heat';
import { masteryFromScore, masteryLabel } from '../constants';
import { fmtPercent } from '../format';
import s from './charts.module.css';

const avgOf = (st, skills) => {
  const v = skills.map((k) => st.scores?.[k.id]).filter(Number.isFinite);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

/**
 * "Who needs help on what?" Rows = students, columns = skills, cell = score with
 * the mastery colour AND the number. Students flagged `atRisk` are always pinned
 * on top. Click a column header to sort by that skill (lowest first), click again
 * to reverse. The first column stays visible while the grid scrolls sideways.
 *
 *   <StudentSkillHeatmap skills={[{ id: 'frac', label: 'Fractions' }, …]}
 *     students={[{ id: 's1', name: 'Ravi', atRisk: true, scores: { frac: 0.35, … } }, …]}
 *     onCellClick={(student, skill) => …} onStudentClick={(student) => …} />
 *
 * Props: students [{id, name, atRisk?, scores: {[skillId]: 0..1 | null}}], skills [{id, label, short?}],
 *        onCellClick(student, skill), onStudentClick(student), summary.
 */
export default function StudentSkillHeatmap({ students = [], skills = [], onCellClick, onStudentClick, summary, label }) {
  const { t } = useTranslation();
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });

  const rows = useMemo(() => {
    const val = (st) => (sort.key === 'name' ? st.name : sort.key === 'avg' ? avgOf(st, skills) : st.scores?.[sort.key]);
    const list = students.slice(0, 500).map((st) => ({ st, avg: avgOf(st, skills) }));
    list.sort((a, b) => {
      if (!!a.st.atRisk !== !!b.st.atRisk) return a.st.atRisk ? -1 : 1; // at-risk pinned on top
      const x = val(a.st);
      const y = val(b.st);
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      const c = typeof x === 'string' ? x.localeCompare(y) : x - y;
      return sort.dir === 'asc' ? c : -c;
    });
    return list;
  }, [students, skills, sort]);

  const toggle = (key) => setSort((c) => (c.key === key ? { key, dir: c.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  const sortIcon = (k) => (sort.key !== k ? <FaSort className={s.sortOff} aria-hidden="true" /> : sort.dir === 'asc' ? <FaSortUp aria-hidden="true" /> : <FaSortDown aria-hidden="true" />);
  const ariaSort = (k) => (sort.key === k ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none');
  const atRisk = students.filter((x) => x.atRisk);

  const auto = students.length
    ? t('dash.ssh.summary', {
        defaultValue: 'Grid of {{n}} students and {{k}} skills. {{r}} students need a nudge: {{names}}.',
        n: students.length, k: skills.length, r: atRisk.length, names: atRisk.map((x) => x.name).join(', ') || '—',
      })
    : t('dash.ssh.none', { defaultValue: 'No students in this group yet.' });

  return (
    <ChartFrame label={label || t('dash.ssh.label', { defaultValue: 'Student by skill heatmap' })} summary={summary || auto}>
      <div className={s.sshWrap} role="region" tabIndex={0} aria-label={label || t('dash.ssh.label', { defaultValue: 'Student by skill heatmap' })}>
        <table className={s.ssh}>
          <thead>
            <tr>
              <th scope="col" className={s.sshName} aria-sort={ariaSort('name')}>
                <button type="button" className={s.sshHeadBtn} onClick={() => toggle('name')}>{t('dash.ssh.student', { defaultValue: 'Student' })} {sortIcon("name")}</button>
              </th>
              {skills.map((k) => (
                <th key={k.id} scope="col" aria-sort={ariaSort(k.id)} className={s.sshSkill}>
                  <button type="button" className={s.sshHeadBtn} onClick={() => toggle(k.id)} title={k.label}>
                    <span>{k.short || k.label}</span> {sortIcon(k.id)}
                  </button>
                </th>
              ))}
              <th scope="col" className={s.sshSkill} aria-sort={ariaSort('avg')}>
                <button type="button" className={s.sshHeadBtn} onClick={() => toggle('avg')}>{t('dash.ssh.avg', { defaultValue: 'Average' })} {sortIcon("avg")}</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ st, avg }) => (
              <tr key={st.id} className={st.atRisk ? s.sshRisk : undefined}>
                <th scope="row" className={s.sshName}>
                  {onStudentClick
                    ? <button type="button" className={s.sshStudentBtn} onClick={() => onStudentClick(st)}>{st.name}</button>
                    : <span className={s.sshStudentBtn}>{st.name}</span>}
                  {st.atRisk && (
                    <span className={s.riskTag}><FaExclamationTriangle aria-hidden="true" /> {t('dash.ssh.nudge', { defaultValue: 'Needs a nudge' })}</span>
                  )}
                </th>
                {skills.map((k) => {
                  const v = st.scores?.[k.id];
                  const lv = masteryFromScore(v);
                  const text = Number.isFinite(v) ? fmtPercent(v) : '—';
                  const aria = `${st.name}, ${k.label}: ${Number.isFinite(v) ? `${text}, ${masteryLabel(t, lv.key)}` : t('dash.ssh.noData', { defaultValue: 'no data yet' })}`;
                  return (
                    <td key={k.id} className={s.sshTd}>
                      <button
                        type="button"
                        className={`${s.sshCell} ${Number.isFinite(v) ? '' : s.sshEmpty}`}
                        style={Number.isFinite(v) ? { background: lv.bg, color: lv.ink } : undefined}
                        aria-label={aria}
                        onClick={onCellClick ? () => onCellClick(st, k) : undefined}
                        disabled={!onCellClick}
                      >
                        {text}
                      </button>
                    </td>
                  );
                })}
                <td className={`${s.sshTd} ${s.sshAvg}`}>{fmtPercent(avg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MasteryLegend className={s.legendGap} />
    </ChartFrame>
  );
}
